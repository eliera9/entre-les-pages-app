const bookFolderIcon = '<svg class="navigation-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 19V6h6l2 2h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1z"/></svg>';
const bookFolderArtwork = '<svg viewBox="0 0 40 34" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 25V11a3 3 0 0 1 3-3h5l3 3h10a3 3 0 0 1 3 3M3 26l3-10q.5-1.5 2-1.5h20q2 0 1.5 2L27 26q-.5 2-2.5 2H5q-2.5 0-2-2Z"/><path d="M27 27q6-5 7-14m-1.8 7q-2.2-3-1.6-5 2.4 1 1.6 5Zm.8-3q1-4 4-4-.7 3-4 4ZM24 3q0 3.3-3 4 3 .6 3 3.3.6-2.6 3-3.3Q24.6 6.3 24 3Z"/></svg>';
const bookFolderCheck = '<svg class="book-folder-check" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m4 10 4 4 8-9"/></svg>';

function mountBookFolders({host, triggerClass, findFolder, folderEntries, folderLabel, createFolder, folderHome, initialFolder, signal}) {
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = triggerClass;
  trigger.dataset.openBookFolders = '';
  trigger.setAttribute('aria-label', 'Mes dossiers');
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.innerHTML = bookFolderIcon;
  trigger.hidden = true;

  const dialog = document.createElement('dialog');
  dialog.className = 'book-folders-dialog';
  const id = 'book-folders-dialog';
  dialog.id = id;
  trigger.setAttribute('aria-controls', id);
  dialog.setAttribute('aria-labelledby', id+'-title');
  dialog.innerHTML = `
    <header class="book-folders-head">
      ${bookFolderArtwork}
      <h2 id="${id}-title">Mes dossiers</h2>
      <button type="button" class="book-folders-round" data-book-folders-close aria-label="Fermer Mes dossiers">×</button>
    </header>
    <form class="book-folders-form">
      <p class="book-folders-intro">Choisis d’abord un dossier principal pour ce livre.</p>
      <nav class="book-folders-trail" aria-label="Chemin du dossier" hidden></nav>
      <div class="book-folders-entry">
        <input type="text" maxlength="45" autocomplete="off" aria-label="Nom du dossier" aria-describedby="${id}-feedback" enterkeyhint="done">
        <button type="button" class="book-folders-round" data-book-folders-list aria-expanded="false" aria-controls="${id}-results">${bookFolderIcon}</button>
      </div>
      <div class="book-folders-results" id="${id}-results" aria-label="Dossiers existants" hidden></div>
      <button type="submit" class="book-folders-create" hidden>Créer et choisir ce dossier</button>
      <button type="button" class="book-folders-remove" hidden>Retirer le dossier</button>
      <p class="book-folders-feedback" id="${id}-feedback" role="status" hidden></p>
    </form>`;
  host.append(dialog);
  const q = selector => dialog.querySelector(selector);
  const form = q('form');
  const name = q('input');
  const heading = q('h2');
  heading.tabIndex = -1;
  const listButton = q('[data-book-folders-list]');
  const closer = q('[data-book-folders-close]');
  const results = q('.book-folders-results');
  const trail = q('.book-folders-trail');
  const submit = q('[type="submit"]');
  const remove = q('.book-folders-remove');
  const feedback = q('.book-folders-feedback');
  let selected = initialFolder ?? null;
  let current = selected;
  let changed = false;
  let listingAll = false;
  let saving = false;
  const normalize = value => value.trim().normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase('fr');

  function pill(folder, callback) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'book-folders-pill';
    button.dataset.folderId = folder.id;
    button.innerHTML = bookFolderIcon;
    const text = document.createElement('span');
    text.textContent = folder.name;
    button.append(text);
    if (folder.id === selected?.id) {
      button.setAttribute('aria-current','true');
      button.insertAdjacentHTML('beforeend',bookFolderCheck);
    }
    if (callback) button.addEventListener('click', callback);
    else {
      const label = document.createElement('span');
      label.className = button.className;
      label.dataset.folderId = folder.id;
      label.append(...button.childNodes);
      if (folder.id === selected?.id) label.setAttribute('aria-label',folder.name+' · Dossier choisi');
      return label;
    }
    return button;
  }

  function visit(folder, choose) {
    current = folder;
    if (choose) {
      selected = folder;
      changed = true;
    }
    name.value = '';
    listingAll = false;
    message('');
    render();
    heading.focus({preventScroll:true});
  }

  function renderTrail() {
    trail.hidden = !current;
    trail.replaceChildren();
    if (!current) return;
    const chain = [];
    const seen = new Set([current.id]);
    for (let parent = findFolder(current.parent); parent && !seen.has(parent.id); parent = findFolder(parent.parent)) {
      seen.add(parent.id);
      chain.unshift(parent);
    }
    const destinations = chain.length ? chain : [null];
    for (const [index,parent] of destinations.entries()) {
      const back = document.createElement('button');
      back.type = 'button';
      back.textContent = (index === 0 ? 'Dans ' : '') + (parent?.name ?? 'Mes dossiers');
      if (!parent) {
        back.textContent = 'Dans';
        back.setAttribute('aria-label','Revenir aux dossiers principaux');
      }
      back.addEventListener('click',() => visit(parent,false));
      trail.append(back);
      if (!parent) break;
      const separator = document.createElement('span');
      separator.textContent = '›';
      separator.setAttribute('aria-hidden','true');
      trail.append(separator);
    }
    trail.append(pill(current));
  }

  function message(text, invalid = false) {
    feedback.textContent = text;
    feedback.hidden = !text;
    if (invalid) name.setAttribute('aria-invalid','true');
    else name.removeAttribute('aria-invalid');
  }

  function render() {
    const isRoot = !current;
    q('.book-folders-intro').hidden = !isRoot;
    name.placeholder = isRoot ? 'Écris le nom du dossier' : 'Écris le nom du sous-dossier';
    name.setAttribute('aria-label', isRoot ? 'Nom du dossier' : 'Nom du sous-dossier');
    listButton.setAttribute('aria-label', isRoot ? 'Dossiers principaux existants' : 'Sous-dossiers existants');
    listButton.setAttribute('aria-expanded', String(listingAll));
    renderTrail();
    renderResults();
  }

  function renderResults() {
    const query = normalize(name.value);
    const entries = folderEntries(current?.id ?? null);
    const matches = listingAll ? entries : query ? entries.filter(folder => normalize(folder.name).includes(query)) : [];
    results.hidden = !matches.length && !listingAll;
    const counts = new Map();
    for (const folder of matches) {
      const key = normalize(folder.name);
      counts.set(key,(counts.get(key) ?? 0)+1);
    }
    results.replaceChildren(...matches.map(folder => {
      const button = pill(folder, () => visit(folder,true));
      if (counts.get(normalize(folder.name)) > 1) {
        const path = folderLabel(folder, true);
        const location = document.createElement('small');
        location.textContent = path.split(' › ').slice(0,-1).join(' › ') || path;
        button.append(location);
      }
      return button;
    }));
    if (listingAll && !matches.length) results.textContent = 'Aucun dossier à cet emplacement.';
    submit.hidden = !query || entries.some(folder => normalize(folder.name) === query);
    remove.hidden = !selected;
    trigger.title = selected ? folderLabel(selected) : 'Mes dossiers';
  }

  function close() {
    if (saving || !dialog.open) return false;
    dialog.close();
    return true;
  }

  trigger.addEventListener('click', () => {
    if (dialog.open) return;
    visit(selected,false);
    dialog.showModal();
    trigger.setAttribute('aria-expanded','true');
    heading.focus({preventScroll:true});
  });
  closer.addEventListener('click', close);
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    event.stopPropagation();
    event.preventDefault();
    close();
  });
  dialog.addEventListener('close', () => {
    trigger.setAttribute('aria-expanded','false');
    if (!signal.aborted) trigger.focus({preventScroll:true});
  });
  listButton.addEventListener('click', () => {
    listingAll = !listingAll;
    listButton.setAttribute('aria-expanded',String(listingAll));
    renderResults();
  });
  name.addEventListener('input', () => {
    listingAll = false;
    listButton.setAttribute('aria-expanded','false');
    message('');
    renderResults();
  });
  remove.addEventListener('click', () => {
    visit(null,true);
    message('Dossier retiré.');
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (saving || submit.hidden) return;
    const value = name.value.trim();
    if (!value) return;
    saving = true;
    closer.disabled = true;
    form.inert = true;
    try {
      const folder = await createFolder(value,current?.id ?? folderHome);
      if (signal.aborted) return;
      if (folder) {
        form.inert = false;
        visit(folder,true);
      } else {
        message('Un dossier porte déjà ce nom ici.',true);
        renderResults();
      }
    } catch {
      if (!signal.aborted) message('Le dossier n’a pas pu être créé. Réessaie.');
    } finally {
      saving = false;
      closer.disabled = false;
      form.inert = false;
      if (!signal.aborted && !feedback.hidden) name.focus();
    }
  });
  signal.addEventListener('abort', () => {
    if (dialog.open) dialog.close();
    trigger.remove();
    dialog.remove();
  }, {once:true});
  render();
  return {
    trigger,
    id: () => selected?.id ?? null,
    changed: () => changed,
    reset(folder) {
      selected = folder ?? null;
      changed = false;
      current = selected;
      name.value = '';
      listingAll = false;
      message('');
      render();
    }
  };
}
