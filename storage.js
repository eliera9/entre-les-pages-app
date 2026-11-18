function createLibraryStorage(databaseName = 'app-lecture', sync = false) {
  const retryDelays = [120, 360];
  const transientErrors = new Set(['AbortError', 'InvalidStateError', 'UnknownError']);
  let database;
  let opening;
  let openedOnce = false;
  let writeQueue = Promise.resolve();

  function open() {
    if (database) return Promise.resolve(database);
    if (opening) return opening;
    opening = new Promise((resolve, reject) => {
      const indexedDb = globalThis.indexedDB;
      if (!indexedDb) throw new DOMException('Le stockage de ce navigateur est indisponible.', 'NotSupportedError');
      const request = indexedDb.open(databaseName, 1);
      let settled = false;
      let blocked = false;
      const deadline = setTimeout(() => {
        fail(new DOMException('L’ouverture du stockage a pris trop de temps.', blocked ? 'StorageBlockedError' : 'TimeoutError'));
      }, 5000);

      function finish() {
        settled = true;
        clearTimeout(deadline);
      }

      function fail(error) {
        if (settled) return;
        finish();
        reject(error);
      }

      request.onblocked = () => { blocked = true; };
      request.onupgradeneeded = () => {
        if (settled || openedOnce) {
          request.transaction.abort();
          fail(new DOMException('Le stockage a été réinitialisé pendant l’ouverture de la bibliothèque.', 'StorageResetError'));
          return;
        }
        const db = request.result;
        db.createObjectStore('books', {keyPath: 'id'});
        db.createObjectStore('documents');
        db.createObjectStore('preferences');
      };
      request.onsuccess = () => {
        const db = request.result;
        if (settled) {
          db.close();
          return;
        }
        finish();
        database = db;
        openedOnce = true;
        db.onclose = () => { if (database === db) database = undefined; };
        db.onversionchange = () => {
          if (database === db) database = undefined;
          db.close();
        };
        resolve(db);
      };
      request.onerror = () => fail(request.error);
    }).finally(() => { opening = undefined; });
    return opening;
  }

  function runTransaction(db, stores, mode, operation) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(stores, mode);
      let failure;
      let requestError;
      let result;
      tx.onabort = () => reject(failure || tx.error || requestError || new Error('L’opération a été interrompue.'));
      tx.onerror = event => { requestError ||= event.target.error; };
      tx.oncomplete = () => resolve(result);
      try {
        result = operation(tx);
      } catch (error) {
        failure = error;
        tx.abort();
      }
    });
  }

  async function attemptTransaction(stores, mode, operation) {
    for (let attempt = 0; ; attempt += 1) {
      let db;
      let readResult;
      try {
        db = await open();
        readResult = await runTransaction(db, stores, mode, operation);
      } catch (error) {
        if (db && database === db && ['InvalidStateError', 'UnknownError'].includes(error?.name)) {
          database = undefined;
          db.close();
        }
        if (!transientErrors.has(error?.name) || attempt === retryDelays.length) throw error;
        await new Promise(resolve => setTimeout(resolve, retryDelays[attempt]));
        continue;
      }
      return typeof readResult === 'function' ? readResult() : undefined;
    }
  }

  function transaction(stores, mode, operation) {
    const pending = writeQueue.then(() => attemptTransaction(stores, mode, operation));
    if (mode === 'readwrite') writeQueue = pending.catch(() => {});
    return pending;
  }

  const preferencesKey = 'library-sync-outbox';
  const offlineKey = 'library-sync-offline-document';
  const revisionKey = 'library-sync-revision';
  const pendingFileKey = id => `library-sync-file:${id}`;
  const withJournal = stores => sync ? [...new Set([...stores, 'preferences'])] : stores;

  function record(tx, change, file) {
    const preferences = tx.objectStore('preferences');
    const lookup = preferences.get(preferencesKey);
    lookup.onsuccess = () => {
      let pending = lookup.result ?? [];
      if (change.type === 'delete' || change.type === 'remove-selection') {
        const removed = new Set(change.type === 'delete' ? [change.id] : change.value.books);
        pending = pending.filter(op => {
          if (!removed.has(op.id) || !['book', 'patch', 'migration', 'delete'].includes(op.type)) return true;
          if (op.hasFile) tx.objectStore('documents').delete(pendingFileKey(op.requestId));
          return false;
        });
      }
      if (file) tx.objectStore('documents').put(file, pendingFileKey(change.requestId));
      preferences.put([...pending, change], preferencesKey);
    };
  }

  function changedBookFields(previous, updated) {
    return Object.fromEntries(Object.entries(updated).filter(([key, value]) => key !== 'id' &&
      JSON.stringify(value) !== JSON.stringify(previous[key])));
  }

  return {
    load() {
      return transaction(['books', 'preferences'], 'readonly', tx => {
        const books = tx.objectStore('books').getAll();
        const preferences = tx.objectStore('preferences').get('library');
        const folders = tx.objectStore('preferences').get('folders');
        return () => ({books: books.result, preferences: preferences.result || {}, folders: folders.result || []});
      });
    },
    putBook(book, file, folderId, migrating = false) {
      const stores = withJournal(file ? ['books', 'documents'] : ['books']);
      const requestId = sync ? crypto.randomUUID() : null;
      return transaction(stores, 'readwrite', tx => {
        const books = tx.objectStore('books');
        const lookup = books.get(book.id);
        let updated;
        lookup.onsuccess = () => {
          const ids = new Set([...(lookup.result?.folderIds ?? []), ...(book.folderIds ?? [])]);
          if (folderId) ids.add(folderId);
          updated = ids.size ? {...book, folderIds: [...ids]} : book;
          if (file && sync) updated = {...updated, hasDocument: true, documentRevision: requestId};
          books.put(updated);
          if (sync) {
            const type = migrating ? 'migration' : lookup.result ? 'patch' : 'book';
            const value = type === 'patch' ? changedBookFields(lookup.result, updated) : updated;
            if (file || Object.keys(value).length) {
              record(tx, {requestId, type, id: book.id, value, hasFile: Boolean(file), legacyFile: migrating && Boolean(file)}, migrating ? undefined : file);
            }
          } else if (file) tx.objectStore('documents').put(file, book.id);
        };
        return () => updated;
      });
    },
    getDocument(id) {
      return transaction(['documents'], 'readonly', tx => {
        const file = tx.objectStore('documents').get(id);
        return () => file.result;
      });
    },
    patchBook(id, changes) {
      const requestId = sync ? crypto.randomUUID() : null;
      return transaction(withJournal(['books']), 'readwrite', tx => {
        const store = tx.objectStore('books');
        const lookup = store.get(id);
        let updated;
        lookup.onsuccess = () => {
          if (!lookup.result) { tx.abort(); return; }
          updated = {...lookup.result, ...changes, updatedAt: Date.now()};
          if (changes.bookmarkMap) {
            updated.bookmarkMap = {...lookup.result.bookmarkMap, ...changes.bookmarkMap};
            for (const key of Object.keys(updated.bookmarkMap)) if (!updated.bookmarkMap[key]) delete updated.bookmarkMap[key];
          }
          store.put(updated);
          if (sync) record(tx, {requestId, type: 'patch', id, value: {...changes, updatedAt: updated.updatedAt}});
        };
        return () => updated;
      });
    },
    removeBook(id) {
      const requestId = sync ? crypto.randomUUID() : null;
      return transaction(withJournal(['books', 'documents']), 'readwrite', tx => {
        tx.objectStore('books').delete(id);
        tx.objectStore('documents').delete(id);
        if (sync) record(tx, {requestId, type: 'delete', id});
      });
    },
    removeSelection(selection, requestId = sync ? crypto.randomUUID() : null) {
      const removedBooks = new Set(selection.books);
      const removedFolders = new Set(selection.folders);
      return transaction(['books', 'documents', 'preferences'], 'readwrite', tx => {
        const books = tx.objectStore('books');
        const documents = tx.objectStore('documents');
        const preferences = tx.objectStore('preferences');
        const existingFolders = preferences.get('folders');
        const existingBooks = books.getAll();
        const offline = preferences.get(offlineKey);
        let library;
        offline.onsuccess = () => {
          if (removedBooks.has(offline.result?.id)) preferences.delete(offlineKey);
          const folders = existingFolders.result ?? [];
          // Every nested folder is removed together with its selected ancestor.
          let size;
          do {
            size = removedFolders.size;
            for (const folder of folders) if (removedFolders.has(folder.parent)) removedFolders.add(folder.id);
          } while (size !== removedFolders.size);
          const remainingFolders = folders.filter(folder => !removedFolders.has(folder.id));
          const remainingBooks = [];
          for (const book of existingBooks.result) {
            if (removedBooks.has(book.id)) {
              books.delete(book.id);
              documents.delete(book.id);
              continue;
            }
            const ids = book.folderIds?.filter(id => !removedFolders.has(id));
            const kept = ids?.length !== book.folderIds?.length ? {...book, folderIds: ids} : book;
            if (kept !== book) books.put(kept);
            remainingBooks.push(kept);
          }
          preferences.put(remainingFolders, 'folders');
          if (sync) record(tx, {requestId, type: 'remove-selection', id: requestId, value: selection});
          library = {books: remainingBooks, folders: remainingFolders};
        };
        return () => library;
      });
    },
    createFolder(folder) {
      const requestId = sync ? crypto.randomUUID() : null;
      return transaction(['preferences'], 'readwrite', tx => {
        const preferences = tx.objectStore('preferences');
        const lookup = preferences.get('folders');
        let result;
        lookup.onsuccess = () => {
          const folders = lookup.result || [];
          const taken = folders.some(item => item.parent === folder.parent && item.nameKey === folder.nameKey);
          if (!taken) {
            const entry = {...folder, artIndex: folders.length};
            folders.push(entry);
            preferences.put(folders, 'folders');
            if (sync) record(tx, {requestId, type: 'folder', id: folder.id, value: entry});
          }
          result = {folders, created: !taken};
        };
        return () => result;
      });
    },
    putPreferences(preferences) {
      return transaction(['preferences'], 'readwrite', tx => {
        tx.objectStore('preferences').put(preferences, 'library');
      });
    },
    loadMetadata(key) {
      return transaction(['preferences'], 'readonly', tx => {
        const request = tx.objectStore('preferences').get(key);
        return () => request.result;
      });
    },
    putMetadata(key, value) {
      return transaction(['preferences'], 'readwrite', tx => { tx.objectStore('preferences').put(value, key); });
    },
    pending() {
      return transaction(['preferences'], 'readonly', tx => {
        const request = tx.objectStore('preferences').get(preferencesKey);
        return () => request.result ?? [];
      });
    },
    pendingFile(requestId) {
      return transaction(['documents'], 'readonly', tx => {
        const request = tx.objectStore('documents').get(pendingFileKey(requestId));
        return () => request.result;
      });
    },
    acknowledge(requestId, revision) {
      return transaction(['preferences', 'documents'], 'readwrite', tx => {
        const preferences = tx.objectStore('preferences');
        const request = preferences.get(preferencesKey);
        const current = preferences.get(revisionKey);
        request.onsuccess = () => {
          preferences.put((request.result ?? []).filter(op => op.requestId !== requestId), preferencesKey);
          tx.objectStore('documents').delete(pendingFileKey(requestId));
        };
        current.onsuccess = () => preferences.put(Math.max(current.result ?? 0, revision), revisionKey);
      });
    },
    cachedDocument(id, revision) {
      return transaction(['documents', 'preferences'], 'readonly', tx => {
        const current = tx.objectStore('preferences').get(offlineKey);
        const file = tx.objectStore('documents').get(id);
        return () => current.result?.id === id && current.result.revision === revision ? file.result : undefined;
      });
    },
    cacheDocument(id, revision, file) {
      return transaction(['documents', 'preferences'], 'readwrite', tx => {
        const preferences = tx.objectStore('preferences');
        const documents = tx.objectStore('documents');
        const current = preferences.get(offlineKey);
        current.onsuccess = () => {
          if (current.result && current.result.id !== id) documents.delete(current.result.id);
          documents.put(file, id);
          preferences.put({id, revision}, offlineKey);
        };
      });
    },
    applyRemote({books, folders, revision}) {
      return transaction(['books', 'preferences', 'documents'], 'readwrite', tx => {
        const preferences = tx.objectStore('preferences');
        const pending = preferences.get(preferencesKey);
        const currentRevision = preferences.get(revisionKey);
        const cached = preferences.get(offlineKey);
        let applied = false;
        currentRevision.onsuccess = () => {
          if (pending.result?.length || (currentRevision.result ?? 0) > revision) return;
          const store = tx.objectStore('books');
          store.clear();
          for (const book of books) store.put(book);
          preferences.put(folders, 'folders');
          preferences.put(revision, revisionKey);
          cached.onsuccess = () => {
            const current = cached.result;
            if (current && !books.some(book => book.id === current.id && book.documentRevision === current.revision)) {
              tx.objectStore('documents').delete(current.id);
              preferences.delete(offlineKey);
            }
          };
          applied = true;
        };
        return () => applied;
      });
    },
  };
}
