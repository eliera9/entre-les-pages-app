function createReadingStorage(excludedBooks) {
  const accountKey = 'entre-les-pages-library-account';
  const backend = createSupabaseLibrary();
  const identity = compteLecture.owner;
  const listeners = new Set();
  const networkUnavailable = error => !navigator.onLine || error?.name === 'TypeError' || error?.name === 'AbortError';
  let device;
  let account;
  let initial;
  let lastSnapshot;
  let remoteOnly;
  let syncing;
  let timer;
  let suspended = false;

  function remember(value) {
    try {
      if (value) localStorage.setItem(accountKey, value);
      else localStorage.removeItem(accountKey);
    } catch { /* Browser settings may disallow local storage. */ }
  }

  function remembered() {
    try {
      const value = localStorage.getItem(accountKey);
      return /^[a-f\d]{64}$/.test(value ?? '') ? value : null;
    } catch { return null; }
  }

  async function snapshot() {
    const value = await backend.snapshot();
    if (!/^[a-f\d]{64}$/.test(value?.account ?? '') || !Number.isSafeInteger(value.revision) || !Array.isArray(value.books) || !Array.isArray(value.folders)) {
      throw new Error('Réponse de la bibliothèque indisponible.');
    }
    return value;
  }

  function notify(mode, library) {
    for (const listener of listeners) listener(mode, library);
  }

  async function connect(remote) {
    if (account && account !== remote.account) {
      remember(null);
      suspended = true;
      window.location.reload();
      throw new Error('La session de la bibliothèque a changé.');
    }
    if (account && device) return;
    const nextDevice = createLibraryStorage(`app-lecture-${remote.account}`, true);
    account = remote.account;
    remember(account);
    try {
      await nextDevice.applyRemote(remote);
    } catch {
      remoteOnly = remote;
      device = undefined;
      return;
    }
    remoteOnly = undefined;
    device = nextDevice;

  }

  async function open() {
    let remote;
    if (navigator.onLine) {
      try { remote = await snapshot(); } catch (error) {
        if (error.status === 401 && remembered()) {
          remember(null);
          throw error;
        }
      }
    }
    if (remote) await connect(remote);
    else {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(identity));
      account = Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2,'0')).join('');
      if (account !== remembered()) throw new Error('Connecte cet appareil une première fois avec Internet.');
      device = createLibraryStorage('app-lecture-' + account, true);
    }
    const library = remoteOnly ? {...remoteOnly, preferences: {}} : await device.load();
    if (remote || navigator.onLine) schedule();
    return library;
  }

  function load() {
    initial ??= open().catch(error => {
      initial = null;
      throw error;
    });
    return initial;
  }

  function schedule(delay = 160) {
    if (suspended) return;
    clearTimeout(timer);
    timer = setTimeout(() => { void synchronize(); }, delay);
  }

  async function submit(operation, file) {
    return backend.submit(operation, file);
  }

  async function send(operation) {
    const file = operation.hasFile ? await device.pendingFile(operation.requestId) : undefined;
    if (operation.hasFile && !file) {
      if (!(await device.pending()).some(item => item.requestId === operation.requestId)) return;
      throw new Error('Un fichier à synchroniser est indisponible sur cet appareil.');
    }
    const saved = await submit(operation, file);
    await device.acknowledge(operation.requestId, saved.revision);
  }

  function synchronize() {
    if ((!device && !remoteOnly) || suspended) return Promise.resolve();
    if (!navigator.onLine) {
      notify('offline');
      return Promise.resolve();
    }
    syncing ??= (async () => {
      let remote = await snapshot();
      await connect(remote);
      if (remoteOnly) {
        remoteOnly = remote;
        notify('online-only', {...remote, preferences: {}});
        return;
      }

      const pending = await device.pending();
      for (const operation of pending) {
        if (suspended) return;
        if ((await device.pending()).some(item => item.requestId === operation.requestId)) await send(operation);
      }
      if (pending.length) { remote = await snapshot(); void backend.tidy().catch(() => {}); }
      if (remote.account !== account) throw Object.assign(new Error('La session a changé.'), {status: 401});
      const applied = await device.applyRemote(remote);
      if (!applied) { schedule(); return; }
      const changed = lastSnapshot !== remote.revision;
      lastSnapshot = remote.revision;
      notify('synced', changed ? await device.load() : undefined);
    })().catch(error => {
      if (error.status === 401) remember(null);
      notify(networkUnavailable(error) ? 'offline' : 'pending');
      if (navigator.onLine && error.status !== 401) schedule(12000);
    }).finally(() => { syncing = undefined; });
    return syncing;
  }

  async function writeOnline(method, args) {
    const call = (type, id, value, file) => submit({type, id, value, requestId: crypto.randomUUID(), hasFile: Boolean(file)}, file);
    const [item, data, folderId] = args;
    if (method === 'createFolder') {
      if (remoteOnly.folders.some(folder => folder.parent === item.parent && folder.nameKey === item.nameKey)) {
        return {created: false, folders: remoteOnly.folders};
      }
      await call('folder', item.id, {...item, artIndex: remoteOnly.folders.length});
      remoteOnly = await snapshot();
      return {created: remoteOnly.folders.some(folder => folder.id === item.id), folders: remoteOnly.folders};
    }
    if (method === 'removeSelection') {
      await submit({type: 'remove-selection', id: data, value: item, requestId: data});
      remoteOnly = await snapshot();
      return remoteOnly;
    }
    if (method === 'removeBook') {
      await call('delete', item);
      remoteOnly = await snapshot();
      return;
    }
    const id = method === 'putBook' ? item.id : item;
    const existing = remoteOnly.books.find(book => book.id === id);
    if (method === 'putBook') {
      const ids = new Set([...(existing?.folderIds ?? []), ...(item.folderIds ?? [])]);
      if (folderId) ids.add(folderId);
      await call(existing ? 'patch' : 'book', id, {...item, folderIds: [...ids]}, data);
    } else {
      if (!existing) throw new Error('Ce livre est indisponible.');
      await call('patch', id, {...data, updatedAt: Date.now()});
    }
    remoteOnly = await snapshot();
    const saved = remoteOnly.books.find(book => book.id === id);
    if (!saved) throw new Error('Ce livre est indisponible.');
    return saved;
  }

  async function write(method, args) {

    if (method === 'putBook' && args[1]?.size > 50 * 1024 * 1024) throw new Error('La taille maximale d’un fichier est de 50 Mio.');
    if (remoteOnly) return writeOnline(method, args);
    const target = device;
    const result = await target[method](...args);
    schedule();
    return result;
  }

  async function getDocument(id) {

    const {books} = remoteOnly ?? await device.load();
    const book = books.find(item => item.id === id);
    if (!book?.hasDocument) return undefined;
    const revision = book.documentRevision;
    const cached = await device?.cachedDocument(id, revision);
    if (cached) return cached;
    const operation = device && revision ? (await device.pending()).find(item => item.requestId === revision) : undefined;
    const pending = operation?.hasFile ? await device.pendingFile(revision) : undefined;
    if (pending) {
      await device.cacheDocument(id, revision, pending).catch(() => {});
      return pending;
    }
    if (!navigator.onLine) throw new Error('Ouvre ce livre une première fois avec Internet pour pouvoir le lire hors connexion.');
    let document;
    try {
      document = await backend.documentFile(id);
      if (!document) return undefined;
    } catch (error) {
      if (networkUnavailable(error)) throw new Error('Ce livre doit être ouvert avec Internet avant de pouvoir être lu hors connexion.');
      if (error.status === 404) return undefined;
      throw error;
    }
    const {file, version} = document;
    await device?.cacheDocument(id, version, file).catch(() => {});
    return file;
  }

  setInterval(() => { if (!document.hidden && navigator.onLine && !suspended) void synchronize(); }, 30000);
  window.addEventListener('online', () => { void synchronize(); });
  window.addEventListener('offline', () => notify('offline'));
  window.addEventListener('focus', () => { void synchronize(); });
  window.addEventListener('storage', event => {
    if (event.key !== accountKey || !account || event.newValue === account) return;
    suspended = true;
    clearTimeout(timer);
    window.location.reload();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void synchronize();
  });

  return {
    load,
    putBook: (...args) => write('putBook', args),
    patchBook: (...args) => write('patchBook', args),
    removeBook: (...args) => write('removeBook', args),
    removeSelection: (selection, requestId) => write('removeSelection', [selection, requestId]),
    createFolder: (...args) => write('createFolder', args),
    putPreferences: preferences => remoteOnly ? Promise.resolve() : device.putPreferences(preferences),
    getDocument,
    subscribe(listener) {
      listeners.add(listener);
      if (!navigator.onLine) listener('offline');
      else if (remoteOnly) listener('online-only');
    },
    endSession() {
      suspended = true;
      clearTimeout(timer);
      remember(null);
    },
  };
}
