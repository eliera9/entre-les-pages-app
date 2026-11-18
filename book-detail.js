function mountSavedBook({root, host, book, storage, engine, home, startInReader, startInNote, returnToLibrary, onSave, onRemove, onError}) {
  const scope = new AbortController();
  const on = (node, type, callback) => node.addEventListener(type, callback, {signal: scope.signal});
  host.replaceChildren(root.querySelector('[data-saved-book-template]').content.cloneNode(true));
  host.dataset.bookId = book.id;
  const q = selector => host.querySelector(selector);
  const bar = selector => root.querySelector('.library-main > .toolbar ' + selector);
  const stage = q('[data-saved-book]');
  const note = q('[data-note-preview]');
  const reader = q('[data-book-reader]');
  const readerBack = q('[data-close-reader]');
  const readerDetails = q('[data-reader-details]');
  const preview = q('[data-book-preview]');
  const editor = q('[data-edit-fields]');
  const form = q('form');
  const summary = q('[data-summary-view]');
  const access = q('[data-reader-access]');
  const read = q('[data-open-reader]');
  const edit = bar('[data-book-edit]');
  const trash = bar('[data-book-trash]');
  const homeButton = bar('[data-book-home]');
  const create = bar('[data-create-note]');
  const switcher = q('[data-open-note]');
  const cancelNote = q('[data-cancel-note]');
  const trigger = q('[data-status-trigger]');
  const favorite = q('[data-saved-favorite]');
  const popup = q('[data-status-popup]');
  const bubble = q('[data-delete-layer]');
  const hasSheet = Boolean(book.readingSheet);
  const statuses = {
    pile: ['À lire', 'Pile à lire', 'pile'],
    'en-cours': ['En cours', 'En cours', 'cours'],
    finished: ['Terminé', 'Livre lu', 'lu'],
  };
  let mode = 'book';
  let openedDirectly = Boolean(startInReader && returnToLibrary);
  let pendingCover;
  let coverRevision = 0;
  let readerSession = 0;
  let renderSequence = 0;
  let pdfTask;
  let pageTask;
  let pages;
  let index = 0;
  const list = value => Array.isArray(value) ? value.filter(Boolean) : String(value || '').split(';').map(x => x.trim()).filter(Boolean);
  const setText = (selector, value) => { q(selector).textContent = value || ''; };
  const focus = node => node.focus({preventScroll:true});

  function renderStatus() {
    const key = Object.keys(statuses).find(id => statuses[id][0] === book.status);
    const label = statuses[key]?.[1] || book.status || statuses.pile[1];
    const art = statuses[key]?.[2] || 'pile';
    setText('[data-current-status-name]', label);
    q('[data-current-status-icon]').className = 'ep-status-art ep-status-art-' + art;
    trigger.setAttribute('aria-label', 'Changer le statut de lecture, ' + label);
    for (const option of popup.querySelectorAll('[data-pick-status]')) {
      option.setAttribute('aria-pressed', String(option.dataset.pickStatus === (key || (!book.status && 'pile'))));
      option.querySelector('[data-option-icon]').className = 'ep-status-art ep-status-art-' + statuses[option.dataset.pickStatus][2];
    }
  }

  function render() {
    const editing = mode === 'edit';
    const viewing = mode === 'book';
    const readingNote = mode === 'note';
    stage.hidden = !(viewing || editing);
    preview.hidden = !viewing;
    editor.hidden = form.hidden = q('#saved-summary-editor').hidden = !editing;
    summary.hidden = !viewing || !book.summary;
    access.hidden = !viewing || (book.format === 'Papier' && !book.fileFingerprint);
    note.hidden = !readingNote;
    reader.hidden = mode !== 'reader';
    root.toggleAttribute('data-book-reading', !reader.hidden);
    edit.hidden = trash.hidden = stage.hidden;
    edit.setAttribute('aria-expanded', String(editing));
    homeButton.hidden = false;
    create.hidden = !viewing || book.status !== 'Terminé' || hasSheet;
    cancelNote.hidden = !readingNote || hasSheet;
    const parent = readingNote ? note : q('[data-cover-column]');
    if (switcher.parentElement !== parent) parent.prepend(switcher);
    switcher.hidden = !hasSheet || !(viewing || readingNote);
    switcher.setAttribute('aria-label', readingNote ? 'Afficher la fiche du livre' : 'Afficher ma fiche de lecture');
    switcher.setAttribute('aria-controls', readingNote ? 'elp-saved-book' : 'book-reading-sheet');
    q('[data-note-next]').hidden = readingNote;
    q('[data-note-previous]').hidden = !readingNote;

    setText('.ep-book-name', book.title);
    setText('[data-author-value]', book.author);
    q('.ep-book-author').hidden = !book.author;
    const image = q('.ep-cover img');
    image.hidden = !book.coverData;
    if (book.coverData) image.src = book.coverData;
    else image.removeAttribute('src');
    const series = book.saga || book.series;
    const volume = book.volume == null ? '' : String(book.volume);
    const volumeText = volume && !/^(?:tome|volume|hors[- ]série)/i.test(volume) ? 'Tome ' + volume : volume;
    setText('[data-series-name]', series);
    setText('[data-series-volume]', volumeText);
    q('[data-series-name]').hidden = !series;
    q('[data-series-volume]').hidden = !volume;
    q('[data-series-volume]').toggleAttribute('data-simple-volume', /^Tome \d+$/i.test(volumeText));
    q('[data-series-separator]').hidden = !series || !volume;
    q('.ep-book-series').hidden = !series && !volume;
    for (const field of ['genres', 'subgenres']) {
      const group = q('[data-book-' + field + ']');
      const tags = list(book[field]).map(name => {
        const tag = document.createElement('span');
        tag.className = 'ep-tag';
        tag.textContent = name;
        return tag;
      });
      group.hidden = !tags.length;
      group.querySelector('.ep-tag-values').replaceChildren(...tags);
    }
    setText('[data-summary-copy]', book.summary);
    renderStatus();
    favorite.setAttribute('aria-pressed', String(book.coupDeCoeur === true));
  }

  function setPopup(open, moveFocus = false) {
    popup.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
    if (open) {
      popup.style.removeProperty('--status-menu-shift');
      const menu = popup.getBoundingClientRect(), frame = root.getBoundingClientRect();
      const shift = Math.max(0,frame.left + 6 - menu.left) - Math.max(0,menu.right - frame.right + 6);
      popup.style.setProperty('--status-menu-shift', shift + 'px');
    }
    if (moveFocus) focus(open ? popup.querySelector('[aria-pressed="true"]') || popup.querySelector('button') : trigger);
  }

  function anchorDelete() {
    if (bubble.hidden) return;
    const frame = (bubble.offsetParent || root).getBoundingClientRect(), button = trash.getBoundingClientRect();
    bubble.style.setProperty('--delete-top', Math.round(button.bottom - frame.top + 8) + 'px');
    bubble.style.setProperty('--delete-right', Math.round(frame.right - button.right) + 'px');
  }
  function setDelete(open, moveFocus = false) {
    bubble.hidden = !open;
    trash.setAttribute('aria-expanded', String(open));
    if (open) {
      anchorDelete();
      setText('[data-delete-copy]', '« ' + book.title + ' » sera retiré de ta bibliothèque.');
    }
    if (moveFocus) focus(open ? q('[data-cancel]') : trash);
  }
  async function save(changes) {
    try { onSave(await storage.patchBook(book.id, changes)); return !scope.signal.aborted; }
    catch { onError(); return false; }
  }
  on(favorite, 'click', async () => {
    if (favorite.getAttribute('aria-disabled') === 'true') return;
    favorite.setAttribute('aria-disabled', 'true');
    try {
      if (await save({coupDeCoeur: book.coupDeCoeur !== true})) {
        favorite.setAttribute('aria-pressed', String(book.coupDeCoeur === true));
      }
    } finally {
      favorite.removeAttribute('aria-disabled');
    }
  });
  on(trigger, 'click', () => {setDelete(false); setPopup(popup.hidden, true);});
  on(popup, 'click', async event => {
    const choice = event.target.closest('[data-pick-status]');
    if (!choice) return;
    if (await save({status: statuses[choice.dataset.pickStatus][0]})) { render(); setPopup(false, true); }
  });
  on(q('[data-status-disclosure]'), 'focusout', event => {
    if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setPopup(false);
  });
  on(document, 'pointerdown', event => {
    if (!q('[data-status-disclosure]').contains(event.target)) setPopup(false);
    if (!q('[data-delete-dialog]').contains(event.target) && !trash.contains(event.target)) setDelete(false);
  });
  function fit() {
    const gutter = window.innerWidth - document.documentElement.getBoundingClientRect().width;
    stage.style.setProperty('--resume-vw', 'min(calc(1vw + ' + gutter / 100 + 'px), 10.6px)');
    anchorDelete();
  }
  fit();
  on(window, 'resize', fit);
  on(window, 'scroll', anchorDelete);
  on(trash, 'click', () => {setPopup(false); setDelete(bubble.hidden, true);});
  on(q('[data-cancel]'), 'click', () => setDelete(false, true));
  on(q('[data-delete]'), 'click', async () => {
    const button = q('[data-delete]');
    button.disabled = true;
    try { await storage.removeBook(book.id); onRemove(); }
    catch { button.disabled = false; onError(); }
  });
  on(homeButton, 'click', home);

  function previewCover() {
    const container = q('[data-edit-cover-preview]');
    container.replaceChildren();
    if (!pendingCover) return;
    const img = document.createElement('img');
    img.alt = 'Couverture de ' + book.title;
    img.src = pendingCover;
    container.append(img);
  }
  on(edit, 'click', () => {
    if (mode === 'edit') {form.requestSubmit(); return;}
    setPopup(false); setDelete(false);
    mode = 'edit';
    pendingCover = book.coverData;
    coverRevision++;
    previewCover();
    q('[data-edit-cover]').value = '';
    for (const field of ['title','author','series','volume','genres','subgenres']) {
      const value = field === 'series' ? book.saga || book.series : book[field];
      form.elements.namedItem(field).value = Array.isArray(value) ? value.join('; ') : value ?? '';
    }
    q('#saved-summary-editor').value = book.summary || '';
    render();
    focus(form.elements.title);
  });
  on(q('[data-edit-cover]'), 'change', event => {
    const file = event.target.files[0];
    if (!file || !['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)) return;
    const version = ++coverRevision;
    const input = new FileReader();
    input.onload = () => {
      if (!scope.signal.aborted && mode === 'edit' && version === coverRevision) {
        pendingCover = input.result;
        previewCover();
      }
    };
    input.readAsDataURL(file);
  });
  on(form, 'submit', async event => {
    event.preventDefault();
    const value = name => form.elements.namedItem(name).value.trim();
    const title = value('title');
    if (!title) {focus(form.elements.title); return;}
    const changes = {title, author:value('author'), saga:value('series'), volume:value('volume'),
      genres:list(value('genres')), subgenres:list(value('subgenres')), summary:q('#saved-summary-editor').value.trim(), coverData:pendingCover};
    if ('series' in book) changes.series = changes.saga;
    if (await save(changes)) {mode = 'book'; render(); focus(edit);}
  });

  function showNote() {
    setPopup(false); setDelete(false);
    mode = 'note';
    setText('#book-reading-sheet-title', hasSheet ? 'Fiche de lecture' : 'Remplir ma fiche de lecture');
    setText('[data-note-book]', book.title);
    render();
    focus(hasSheet ? switcher : cancelNote);
  }
  function backFromNote() {
    mode = 'book'; render(); focus(hasSheet ? switcher : create);
  }
  on(create, 'click', showNote);
  on(cancelNote, 'click', backFromNote);
  on(switcher, 'click', async () => {
    if (switcher.hasAttribute('data-turning')) return;
    const opening = mode === 'book';
    const change = opening ? showNote : backFromNote;
    const face = switcher.firstElementChild;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced.matches || !face.animate) {change(); return;}
    const direction = opening ? 1 : -1;
    const start = getComputedStyle(face).transform;
    switcher.setAttribute('data-turning', '');
    const out = face.animate([{transform:start},{transform:'rotateY(' + 90 * direction + 'deg)'}], {duration:230,easing:'ease-in',fill:'forwards'});
    try {
      await out.finished;
      if (scope.signal.aborted || switcher.hidden || root.dataset.sidebarOpen === 'true') return;
      change();
      out.cancel();
      if (!reduced.matches) await face.animate([{transform:'rotateY(' + -90 * direction + 'deg)'},{transform:'rotateY(0deg)'}], {duration:230,easing:'ease-out'}).finished;
    } catch (error) { if (error.name !== 'AbortError') throw error; }
    finally {out.cancel(); switcher.removeAttribute('data-turning');}
  });

  function stopReader() {
    readerSession++;
    renderSequence++;
    pageTask?.cancel();
    pdfTask?.destroy()?.catch(() => {});
    pageTask = pdfTask = pages = null;
  }
  const bookmark = q('[data-bookmark]');
  const marks = q('[data-bookmarks]');
  const unit = () => pages.label === 'Page' ? 'page' : 'chapter';
  function refreshBookmarks() {
    if (!pages) return;
    const prefix = unit() + '-';
    const saved = book.bookmarkMap || {};
    const marked = Boolean(saved[prefix + (index + 1)]);
    bookmark.setAttribute('aria-pressed', String(marked));
    bookmark.textContent = marked ? 'Retirer le marque-page' : 'Marquer cette position';
    const positions = Object.keys(saved).filter(key => saved[key] && key.startsWith(prefix))
      .map(key => Number(key.slice(prefix.length))).filter(n => Number.isInteger(n) && n >= 1 && n <= pages.count).sort((a,b) => a-b);
    marks.replaceChildren(new Option('Mes marque-pages',''), ...positions.map(n => new Option(pages.label + ' ' + n, String(n))));
    marks.disabled = !positions.length;
  }
  on(bookmark,'click',async () => {
    if (!pages) return;
    bookmark.disabled = true;
    const key = unit() + '-' + (index + 1);
    try { await save({bookmarkMap:{[key]:book.bookmarkMap?.[key] ? null : true}}); refreshBookmarks(); }
    finally { bookmark.disabled = false; }
  });
  on(marks,'change',() => { if (pages && marks.value) { index = Number(marks.value)-1; void drawPage(true); } });
  async function drawPage(record = false) {
    const version = ++renderSequence;
    const section = pages;
    const current = index;
    const content = q('[data-reader-content]');
    const prev = q('[data-reader-prev]'), next = q('[data-reader-next]');
    q('[data-reader-pages]').hidden = section.count < 2;
    prev.disabled = current === 0;
    next.disabled = current + 1 >= section.count;
    setText('#ep-reading-title', section.label + ' ' + (current + 1) + ' / ' + section.count);
    try {
      pageTask?.cancel();
      const result = await section.read(current);
      if (renderSequence !== version) return;
      content.replaceChildren(result);
      q('[data-bookmark-controls]').hidden = false;
      refreshBookmarks();
      if (record || !book.readingPosition) {
        await save({readingPosition:{unit:unit(),value:current+1}});
        if (renderSequence !== version) return;
      }
      window.scrollTo({top:0, behavior:'instant'});
    } catch (error) { if (renderSequence === version) content.textContent = error.message; }
  }
  async function openReader() {
    setPopup(false); setDelete(false); stopReader();
    const session = readerSession;
    const current = () => session === readerSession && !scope.signal.aborted;
    mode = 'reader'; render();
    setText('[data-reading-book]', book.title);
    setText('#ep-reading-title', '');
    setText('[data-reader-content]', 'Ouverture du livre…');
    q('[data-reader-pages]').hidden = q('[data-bookmark-controls]').hidden = true;
    window.scrollTo({top:0, behavior:'instant'});
    readerDetails.hidden = true;
    readerBack.setAttribute('aria-label', openedDirectly ? 'Revenir à la bibliothèque' : 'Revenir à la fiche');
    focus(readerBack);
    try {
      if (book.format === 'Papier' && !book.fileFingerprint) throw Error('Ce livre papier n’a pas de fichier à ouvrir.');
      const file = await storage.getDocument(book.id);
      if (!current()) return;
      if (!file) throw Error('Le fichier de ce livre est introuvable sur cet appareil.');
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (!current()) return;
      const format = engine.formatOf(bytes);
      let section;
      if (format === 'EPUB') {
        section = {label:'Section', ...await engine.openEpub(bytes)};
      } else if (format === 'PDF') {
        const pdf = await engine.fromPdf(bytes, task => { if (current()) pdfTask = task; else task.destroy().catch(() => {}); });
        section = {count:pdf.document.numPages, label:'Page', read:n => engine.renderPage(pdf.document, n + 1, 1600, task => {if (current()) pageTask = task; else task.cancel();})};
      } else throw Error('Ce format de livre est illisible.');
      if (!current()) return;
      pages = section;
      const position = book.readingPosition;
      const start = position && position.unit === (format === 'PDF' ? 'page' : 'chapter') ? Number(position.value) - 1 : 0;
      index = Math.max(0, Math.min(section.count - 1, Math.floor(start) || 0));
      await drawPage();
    } catch (error) {
      if (!current()) return;
      setText('[data-reader-content]', error.message);
      readerDetails.hidden = false;
    }
  }
  function showBookDetails() {
    openedDirectly = false;
    stopReader();
    mode = 'book';
    render();
    q('[data-reader-content]').replaceChildren();
    focus(q('.ep-book-name'));
  }
  function closeReader() {
    if (openedDirectly) returnToLibrary();
    else {
      showBookDetails();
      if (!read.closest('[hidden]')) focus(read);
    }
  }
  on(read, 'click', openReader);
  on(readerBack, 'click', closeReader);
  on(readerDetails, 'click', showBookDetails);
  on(q('[data-reader-prev]'), 'click', () => {if (pages && index > 0) {index--; drawPage(true);}});
  on(q('[data-reader-next]'), 'click', () => {if (pages && index + 1 < pages.count) {index++; drawPage(true);}});
  on(document, 'keydown', event => {
    if (event.key !== 'Escape' || root.dataset.sidebarOpen === 'true') return;
    if (!bubble.hidden) setDelete(false, true);
    else if (!popup.hidden) setPopup(false, true);
    else if (mode === 'note') backFromNote();
    else if (mode === 'reader') closeReader();
  });
  setDelete(false);
  q('.ep-book-name').tabIndex = -1;
  if (startInReader) void openReader();
  else if (startInNote && hasSheet) {
    showNote();
    window.scrollTo({top:0, behavior:'instant'});
  } else {
    render();
    window.scrollTo({top:0, behavior:'instant'});
    focus(q('.ep-book-name'));
  }
  return () => {
    scope.abort(); stopReader();
    for (const button of [edit, trash, homeButton, create]) button.hidden = true;
    host.replaceChildren();
    delete host.dataset.bookId;
    root.removeAttribute('data-book-reading');
  };
}
