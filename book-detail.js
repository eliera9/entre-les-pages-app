// Vitesse de lecture : pages imprimées lues par heure, mesurée en tournant les pages dans la liseuse
let speedLast = null;
function trackSpeed(printedPage, percent) {
  const now = Date.now();
  const bookPages = Number(speedBook?.promesse?.pages || speedBook?.pages) || 0;
  const page = Number.isFinite(printedPage) && printedPage > 0 ? printedPage : bookPages && Number.isFinite(percent) ? percent / 100 * bookPages : null;
  if (page == null) { speedLast = null; return; }
  const previous = speedLast;
  speedLast = {time: now, page, book: speedBook?.id};
  if (!previous || previous.book !== speedLast.book) return;
  const pages = page - previous.page;
  const elapsed = now - previous.time;
  // Une page tournée en 3 s à 5 min compte ; au-delà, c'était une pause
  if (pages <= 0 || pages > 5 || elapsed < 3000 || elapsed > 300000) return;
  try {
    const stats = JSON.parse(localStorage.getItem('elp-vitesse') || '{}');
    stats.pages = (Number(stats.pages) || 0) + pages;
    stats.minutes = (Number(stats.minutes) || 0) + elapsed / 60000;
    localStorage.setItem('elp-vitesse', JSON.stringify(stats));
  } catch {}
}
let speedBook = null;

function mountSavedBook({editPal, releaseWatch, folderChoices, root, host, book, storage, engine, setReaderTheme, bookTagOptions, refreshIcons, home, startInReader, startInNote, returnToLibrary, onSave, onRemove, onError}) {
  speedBook = book;
  speedLast = null;
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
  const tags = mountBookTags(form.querySelector('[data-book-tags]'), bookTagOptions, refreshIcons);
  const summary = q('[data-summary-view]');
  const access = q('[data-reader-access]');
  const read = q('[data-open-reader]');
  const edit = bar('[data-book-edit]');
  const carnet = document.createElement('button');
  carnet.type = 'button';
  carnet.className = edit.className;
  carnet.setAttribute('aria-label','Mes annotations');
  carnet.title = 'Mes annotations';
  carnet.innerHTML = '<svg class="navigation-icon" viewBox="0 0 24 24" aria-hidden="true"><image href="./art/carnet-etoile.webp" width="24" height="24"/></svg>';
  edit.before(carnet);
  const trash = bar('[data-book-trash]');
  const homeButton = bar('[data-book-home]');
  const create = bar('[data-create-note]');
  const switcher = q('[data-open-note]');
  const cancelNote = q('[data-cancel-note]');
  const trigger = q('[data-status-trigger]');
  const favorite = q('[data-saved-favorite]');
  const popup = q('[data-status-popup]');
  const bubble = q('[data-delete-layer]');
  let hasSheet = Boolean(book.readingSheet);
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

  const hasPages=()=>Boolean(book.promesse?.pages || book.pages || book.pageCount);
  if (!hasPages() && ['EPUB','Papier'].includes(book.format)) {
    (async()=>{
      let code=book.isbn || '';
      let pages=engine.editionPages(code);
      if (!pages && book.format==='EPUB') {
        try {
          const file=await storage.getDocument(book.id);
          if (scope.signal.aborted) return;
          if (file) {
            const embedded=await engine.readEditionPages(new Uint8Array(await file.arrayBuffer()));
            code=embedded.isbn || code;
            pages=embedded.pageCount || engine.editionPages(code);
          }
        } catch { /* Une notice peut compléter un fichier indisponible. */ }
      }
      if (!pages && !scope.signal.aborted && (code || book.title && book.author)) {
        const {createCatalogue}=await import('./catalogue-engine.js?v=edition-officielle-1');
        const query=new URLSearchParams({id:book.catalogueId || '',isbn:code,title:book.title || '',
          author:book.author || '',volume:book.volume || '',publisher:book.publisher || '',format:book.format,language:book.language || ''});
        const edition=await createCatalogue([],scope.signal).details(query);
        pages=edition.pageCount;
      }
      if (Number.isInteger(pages) && pages>0 && !scope.signal.aborted && !hasPages()) {
        if (await save({pageCount:pages,...(!book.isbn && code ? {isbn:code} : {})})) render();
      }
    })().catch(()=>{});
  }

  const detail = document.createElement('article');
  detail.className = 'pal-saved-detail';
  access.before(detail);
  const detailModule = import('./promesse-form.js?v=pal-layout-3');
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
    const editionCount=book.promesse?.pages || book.pageCount || book.pages || engine.editionPages(book.isbn);
    const pageLabel=q('[data-edition-pages]');
    pageLabel.hidden=!editionCount;
    pageLabel.textContent=editionCount ? editionCount+' pages' : '';
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
    for (const field of ['genres', 'subgenres', 'tropes']) {
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
    const ongoing = book.status === 'En cours';
    carnet.hidden = !viewing || !ongoing || access.hidden;
    setText('[data-reader-label]', ongoing ? 'Reprendre ma lecture' : 'Lire le livre');
    const pal = viewing && (ongoing || book.status === 'À lire');
    detail.hidden = !pal;
    if (pal) {
      preview.hidden = summary.hidden = true;
      detailModule.then(module => {
        if (scope.signal.aborted || detail.hidden) return;
        module.renderPalDetail(detail,book,async changes => {if(await save(changes))render();},readingStatusChange);
      });
    }
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
    const status = statuses[choice.dataset.pickStatus][0];
    const changes = readingStatusChange(book,status);
    if (await save(changes)) { render(); setPopup(false, true); }
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
  const actions = document.createElement('div');
  actions.className = 'pal-book-actions';
  actions.setAttribute('popover','auto');
  host.append(actions);
  function action(label, handler) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    const art = {'Suivre l’auteur':'feather','Ne plus suivre l’auteur':'feather','Gérer les dossiers':'folder','Supprimer':'trash-2'}[label];
    if(art) button.dataset.actionArt=art;
    button.onclick = handler;
    actions.append(button);
    return button;
  }
  on(trash, 'click', async () => {
    if (actions.matches(':popover-open')) { actions.hidePopover(); return; }
    setPopup(false); setDelete(false);
    actions.replaceChildren();
    if (book.author) {
      const label = () => releaseWatch.has(book.author) ? 'Ne plus suivre l’auteur' : 'Suivre l’auteur';
      const follow = action(label(), async () => {
        follow.disabled = true;
        try { await releaseWatch.follow(book.author,!releaseWatch.has(book.author)); actions.hidePopover(); }
        catch { onError(); }
        finally { follow.disabled = false; }
      });
      void releaseWatch.refresh().then(() => { follow.textContent = label(); });
    }
    action('Gérer les dossiers', () => {
      actions.replaceChildren();
      const choices = folderChoices();
      if (!choices.length) actions.textContent = 'Aucun dossier';
      for (const folder of choices) {
        const button = action(folder.name, async () => {
          const ids = new Set(book.folderIds || []);
          if (ids.has(folder.id)) ids.delete(folder.id); else ids.add(folder.id);
          if (await save({folderIds:[...ids]})) actions.hidePopover();
        });
        button.setAttribute('aria-pressed', String(book.folderIds?.includes(folder.id) || false));
      }
    });
    action('Supprimer', () => { actions.hidePopover(); setDelete(true,true); });
    const box = trash.getBoundingClientRect();
    actions.style.top = (box.bottom+6)+'px';
    actions.style.right = Math.max(8,innerWidth-box.right)+'px';
    actions.showPopover();
  });
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
    if (book.status === 'À lire' || book.status === 'En cours') {editPal();return;}
    if (mode === 'edit') {form.requestSubmit(); return;}
    setPopup(false); setDelete(false);
    mode = 'edit';
    pendingCover = book.coverData;
    coverRevision++;
    previewCover();
    q('[data-edit-cover]').value = '';
    for (const field of ['title','author','series','volume']) {
      const value = field === 'series' ? book.saga || book.series : book[field];
      form.elements.namedItem(field).value = Array.isArray(value) ? value.join('; ') : value ?? '';
    }
    tags.set(book);
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
      ...tags.values(), summary:q('#saved-summary-editor').value.trim(), coverData:pendingCover};
    if (changes.summary!==(book.summary || '')) changes.summarySource='manual';
    if ('series' in book) changes.series = changes.saga;
    if (await save(changes)) {mode = 'book'; render(); focus(edit);}
  });

  const sheetText=q('[data-sheet-text]');
  const saveSheet=q('[data-save-sheet]');
  sheetText.value=typeof book.readingSheet==='string' ? book.readingSheet : book.readingSheet?.text || '';
  on(sheetText,'input',()=>setText('[data-sheet-status]',''));
  on(saveSheet,'click',async()=>{
    if(saveSheet.disabled)return;
    saveSheet.disabled=true;
    const previous=book.readingSheet;
    const readingSheet={...(previous && typeof previous==='object' ? previous : {}),text:sheetText.value};
    if(await save({readingSheet})){
      hasSheet=true;
      render();
      setText('[data-sheet-status]','Fiche enregistrée.');
    }
    saveSheet.disabled=false;
  });
  function showNote() {
    setPopup(false); setDelete(false);
    mode = 'note';
    setText('#book-reading-sheet-title', 'Ma fiche de lecture');
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
    const out = face.animate([{transform:start},{transform:'perspective(1400px) rotateY(' + 90 * direction + 'deg)'}], {duration:230,easing:'ease-in',fill:'forwards'});
    try {
      await out.finished;
      if (scope.signal.aborted || switcher.hidden || root.dataset.sidebarOpen === 'true') return;
      change();
      out.cancel();
      if (!reduced.matches) await face.animate([{transform:'perspective(1400px) rotateY(' + -90 * direction + 'deg)'},{transform:'perspective(1400px) rotateY(0deg)'}], {duration:230,easing:'ease-out'}).finished;
    } catch (error) { if (error.name !== 'AbortError') throw error; }
    finally {out.cancel(); switcher.removeAttribute('data-turning');}
  });

  function stopReader() {
    readerSession++;
    renderSequence++;
    closeExplorer();
    showLastLeaf();
    setRail(false);
    previewPages = [];
    pageTask?.cancel();
    pdfTask?.destroy()?.catch(() => {});
    pageTask = pdfTask = pages = null;
    readyToRead = false;
    motion?.cancel();
    cancelAnimationFrame(layoutFrame);
    delete content.dataset.flow;
    if (reader.hasAttribute('data-immersive')) leaveFullscreen();
    annotations.clearPage();
    chrome.hidden = true;
  }
  const chrome = q('[data-reader-chrome]');
  const content = q('[data-reader-content]');
  const viewport = q('[data-reader-viewport]');
  const surface = q('[data-page]');
  let readyToRead = false;
  let motion;
  let readingFonts;
  let layoutFrame;
  let latestAnchor = {};
  let anchorLayout;
  let visibleChapters = [];
  let currentChapter;
  let savePosition = Promise.resolve();
  const readCounts = new Map();
  const unit = () => pages.label === 'Page' ? 'page' : 'chapter';
  const annotations = mountReaderAnnotations({
    root:reader,app:root,book,storage,save,signal:scope.signal,refreshIcons,
    navigate:async (position,offset=0) => {
      if (!pages || position < 0 || position >= pages.count) return;
      if (position !== index) {
        index = position;
        await drawPage(true,{offset});
      } else if (unit() === 'chapter') {
        pager.measure(unit(),{offset});
        recordPosition(true);
      }
    },
    onBookmark:() => {}
  });
  const pager = createReaderPagination(viewport,content,annotations);
  const railToggle = q('[data-reader-rail-toggle]');
  const rail = q('[data-rail]');
  const explorer = q('[data-reader-explorer]');
  const grid = q('[data-reader-thumbnails]');
  const slider = q('[data-reader-slider]');
  const galleryButton = q('[data-reader-gallery]');
  const switchView = q('[data-reader-switch]');
  let explorerMode = '';
  let previewPages = [];
  let thumbnailObserver;
  let thumbnailGeneration = 0;
  let finished = false;

  function setRail(open) {
    reader.toggleAttribute('data-rail-open',open);
    rail.inert = !open;
    railToggle.setAttribute('aria-expanded',String(open));
    railToggle.setAttribute('aria-label',open ? 'Replier les outils d’annotation' : 'Ouvrir les outils d’annotation');
    if (!open) annotations.closeForReading();
    resizePages();
  }
  on(railToggle,'click',event => {
    if (railDragged && event.detail) {railDragged = false;return;}
    const open = !reader.hasAttribute('data-rail-open');

    setRail(open);
  });

  let railStart, railDragged;
  on(railToggle,'pointerdown',event => { railStart = event.clientX; railDragged = false; });
  on(railToggle,'pointercancel',() => { railStart = undefined; });
  on(railToggle,'pointerup',event => {
    const drag = event.clientX - (railStart ?? event.clientX);
    railStart = undefined;
    if (Math.abs(drag) < 28) return;
    event.preventDefault();
    railDragged = true;

    setRail(drag < 0);
  });

  function pagesForExplorer() {
    return Array.from({length:pages.count},(_,position) => {
      const label = pages.sectionInfo?.[position]?.label || pages.chapterTitles?.[position] || 'Page '+(position+1);
      const breaks = pages.sectionInfo?.[position]?.pageBreaks || [];
      const chapter = pages.outline?.find(item => position >= item.position);
      return (breaks.length ? breaks : [{}]).map(entry => ({
        position, anchor:entry.id, number:entry.number || (!pages.sectionInfo ? String(position+1) : ''), label:entry.number ? 'Page '+entry.number : label,
        group:pages.sectionInfo ? label : chapter?.label || (pages.outline?.length ? 'Ouverture du livre' : ''),
      }));
    }).flat();
  }

  function currentPreview() {
    const first = previewPages.findIndex(item => item.position === index);
    if (first < 0 || !pages.sectionInfo) return Math.max(0,first);
    const edge = viewport.getBoundingClientRect().right;
    let current = first;
    for (let i=first;i<previewPages.length && previewPages[i].position===index;i++) {
      const id = previewPages[i].anchor;
      const marker = id && content.querySelector('[data-epub-id="'+CSS.escape(id)+'"]');
      if (marker && marker.getBoundingClientRect().left < edge - 1) current=i;
    }
    return current;
  }

  function showPreviewPosition(number,align = false) {
    const card = grid.querySelector('[data-preview-index="'+number+'"]');
    if (!card) return;
    grid.querySelector('[aria-current]')?.removeAttribute('aria-current');
    card.setAttribute('aria-current','true');
    slider.value = String(number);
    slider.setAttribute('aria-valuetext',previewPages[number].label);
    const row = previewPages[number];
    const identity = [book.title,explorerMode === 'grid' ? book.author : row.label].filter(Boolean);
    setText('[data-preview-subtitle]',identity.join(' · '));
    const position = 100 * number / Math.max(1,previewPages.length-1);
    chrome.style.setProperty('--curseur',position+'%');
    chrome.style.setProperty('--progress',position+'%');
    const fraction = pages.printedTotal ? Number(row.number || 0)/pages.printedTotal : number/Math.max(1,previewPages.length-1);
    setText('[data-reader-percent]',Math.round(fraction*100)+' %');
    setText('[data-reader-progress]',row.number ? row.label+' · '+row.group : row.label);
    if (align && explorerMode === 'grid') {
      const group = card.closest('.groupe-feuilles'), heading = group.querySelector('.rubrique');
      const top = grid.getBoundingClientRect().top;
      const rowStart = heading && card.getBoundingClientRect().top-group.querySelector('button').getBoundingClientRect().top < 2;
      const previous = group.previousElementSibling;
      if (rowStart && previous?.querySelectorAll('button').length === 1 && previous.offsetHeight+card.offsetHeight+72 < grid.clientHeight)
        grid.scrollTop += previous.getBoundingClientRect().top - top - 12;
      else if (rowStart) grid.scrollTop += heading.getBoundingClientRect().top - top - 12;
      else grid.scrollTop += card.getBoundingClientRect().top - top - (grid.clientHeight-card.offsetHeight)/2;
    } else if (align) grid.scrollLeft += card.getBoundingClientRect().left-grid.getBoundingClientRect().left+(card.offsetWidth-grid.clientWidth)/2;
  }

  const previewReads = new Map();
  function markerIn(fragment,id) {
    return id && fragment.querySelector('[data-epub-id="'+CSS.escape(id)+'"]');
  }
  // Preserve the text sequence used by existing bookmarks and annotations when
  // a publisher's page boundary falls inside a paragraph.
  function splitPrintedLeaves(fragment,info) {
    const breaks = info.pageBreaks || [];
    if (info.kind !== 'body' || breaks.length < 2) return;
    const frame = fragment.querySelector('.edition-sheet');
    if (!frame) return;
    const starts = breaks.slice(1).map(entry => markerIn(frame,entry.id)).filter(Boolean);
    const leaves = [];
    for (const boundary of starts) {
      const section = document.createElement('div');
      section.className = 'printed-leaf';
      const range = document.createRange();
      range.selectNodeContents(frame);
      range.setEndBefore(boundary);
      section.append(range.extractContents());
      leaves.push(section);
    }
    const final = document.createElement('div');
    final.className = 'printed-leaf';
    final.append(...Array.from(frame.childNodes));
    frame.replaceChildren(...leaves,final);
  }
  function thumbnail(button,section,generation) {
    const number = Number(button.dataset.previewIndex), row = previewPages[number];
    if (!row || button.dataset.loaded) return;
    button.dataset.loaded = 'true';
    const picture = button.firstElementChild;
    const paper = document.createElement('div');
    paper.className = 'fac-simile';
    picture.append(paper);
    if (!section.sectionInfo) {
      paper.classList.add('illust');
      section.preview(row.position).then(fragment => {
        if (generation === thumbnailGeneration) paper.append(fragment);
      }).catch(() => {});
      return;
    }
    // Share the sanitized chapter between visible thumbnails, bounded by section.
    let pending = previewReads.get(row.position);
    if (!pending) {
      pending = section.read(row.position);
      previewReads.set(row.position,pending);
      if (previewReads.size > 4) previewReads.delete(previewReads.keys().next().value);
    }
    pending.then(async fragment => {
      if (generation !== thumbnailGeneration || !button.isConnected) return;
      const info = section.sectionInfo[row.position];
      const range = document.createRange();
      range.selectNodeContents(fragment);
      const start = markerIn(fragment,row.anchor);
      const next = previewPages[number+1];
      const end = next?.position===row.position && markerIn(fragment,next.anchor);
      if (start && row.anchor !== info.pageBreaks?.[0]?.id) range.setStartAfter(start);
      if (end) range.setEndBefore(end);
      const sample = range.cloneContents();
      if (info.plate) {
        paper.classList.add('illust');
        const img = sample.querySelector('img');
        if (img) paper.append(img);
      } else {
        if (info.center) paper.classList.add('feuille-centree');
        for (const link of sample.querySelectorAll('a')) link.replaceWith(...Array.from(link.childNodes));
        const blocks = sample.querySelectorAll('h1,h2,h3,h4,h5,h6,p');
        if (info.kind === 'body' && blocks.length && !sample.querySelector('img,ul,ol,table')) {
          for (const block of blocks) {
            if (!block.textContent.trim()) continue;
            if (block.matches('h1,h2,h3,h4,h5,h6')) block.classList.add('titre-folio');
            paper.append(block);
          }
        } else paper.append(sample);
      }
      for (const img of paper.querySelectorAll('img')) {
        try {await img.decode(); if (generation===thumbnailGeneration && !info.cover) await adaptEpubIllustration(img);} catch {}
      }
    }).catch(() => {});
  }

  function openExplorer(view,selected) {
    if (!readyToRead || !previewPages.length) return;
    annotations.closeForReading();
    explorerMode = view;
    explorer.hidden = false;
    reader.dataset.explorer = view;
    viewport.inert = true;
    rail.inert = true;
    galleryButton.setAttribute('aria-expanded','true');
    q('[data-reader-explorer-title]').textContent = view === 'grid' ? 'Toutes les pages' : 'Feuilleter';
    const origin = currentPreview();
    const original = previewPages[origin];
    grid.className = view === 'grid' ? 'mosaique' : 'bandeau-pages';
    reader.querySelector('.livre').dataset.explore = view;
    switchView.hidden = false;
    switchView.setAttribute('aria-label',view === 'grid' ? 'Afficher le carrousel' : 'Toutes les pages');
    switchView.firstElementChild.innerHTML = view === 'grid' ? '<i data-lucide="gallery-horizontal-end"></i>' : '<i data-lucide="layout-grid"></i>';
    refreshIcons();
    setText('[data-resume-label]',original.number ? 'Revenir à la page '+original.number : 'Reprendre ma lecture · '+original.label);
    q('[data-reader-exit]').setAttribute('aria-label','Revenir à ma lecture');
    galleryButton.setAttribute('aria-label',view === 'grid' ? 'Fermer la grille des pages' : 'Toutes les pages');
    thumbnailObserver?.disconnect();
    const generation = ++thumbnailGeneration, section = pages;
    const group = document.createDocumentFragment();
    let rowGroup, heading;
    for (const [number,item] of previewPages.entries()) {
      if (view === 'grid' && (!rowGroup || heading !== item.group)) {
        heading = item.group;
        const section = document.createElement('section');
        section.className = 'groupe-feuilles';
        if (heading) {
          const title = document.createElement('h3');
          title.className = 'rubrique';
          title.textContent = heading;
          section.append(title);
        }
        rowGroup = document.createElement('div');
        rowGroup.className = 'rangees';
        section.append(rowGroup); group.append(section);
      }
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'apercu-page cursor-interaction';
      button.dataset.previewIndex = String(number);
      button.setAttribute('aria-label','Ouvrir '+item.label);
      const sample = document.createElement('span');
      sample.className = 'mini-contenu';
      sample.setAttribute('aria-hidden','true');
      const caption = document.createElement('span');
      if (number === origin) button.dataset.origine = '';
      caption.className = 'numero-page';
      caption.textContent = item.number || (pages.sectionInfo && view === 'grid' ? 'Non paginée' : item.label);
      button.append(sample,caption);
      (view === 'grid' ? rowGroup : group).append(button);
    }
    grid.replaceChildren(group);
    if (window.IntersectionObserver) {
      thumbnailObserver = new IntersectionObserver(entries => {
        for (const item of entries) {
          if (!item.isIntersecting) continue;
          thumbnailObserver.unobserve(item.target);
          thumbnail(item.target,section,generation);
        }
      },{root:grid,rootMargin:'90px'});
      for (const card of grid.querySelectorAll('button')) thumbnailObserver.observe(card);
    }
    slider.max = String(previewPages.length-1);
    const number = selected ?? currentPreview();
    showPreviewPosition(number,true);
    for (let i=Math.max(0,number-3);i<Math.min(previewPages.length,number+4);i++) {
      const card=grid.querySelector('[data-preview-index="'+i+'"]');
      if (card) thumbnail(card,section,generation);
    }
  }

  function closeExplorer() {
    if (!explorerMode) return;
    explorerMode = '';
    thumbnailGeneration++;
    thumbnailObserver?.disconnect();
    explorer.hidden = true;
    grid.replaceChildren();
    delete reader.dataset.explorer;
    delete reader.querySelector('.livre').dataset.explore;
    q('.retour-position .repere-retour')?.remove();
    delete q('.retour-position').dataset.sens;
    previewReads.clear();
    switchView.hidden = true;
    galleryButton.setAttribute('aria-label','Toutes les pages');
    q('[data-reader-exit]').setAttribute('aria-label','Retour à la bibliothèque');
    viewport.inert = false;
    rail.inert = !reader.hasAttribute('data-rail-open');
    galleryButton.setAttribute('aria-expanded','false');
    if (pages && readyToRead) recordPosition(false,true);
  }
  function showProgressSlider() {
    slider.max = String(Math.max(0,previewPages.length-1));
    slider.value = String(currentPreview());
  }
  on(galleryButton,'click',() => {
    if (explorerMode === 'grid') closeExplorer();
    else openExplorer('grid',explorerMode ? Number(slider.value) : undefined);
  });
  on(switchView,'click',() => openExplorer(explorerMode === 'grid' ? 'carousel' : 'grid',Number(slider.value)));
  on(q('[data-reader-resume]'),'click',() => {closeExplorer();focus(viewport);});
  on(slider,'pointerdown',() => {if (explorerMode !== 'carousel') openExplorer('carousel',Number(slider.value));});
  on(slider,'click',() => { if (!explorerMode) openExplorer('carousel'); });
  on(slider,'input',() => {
    const number = Number(slider.value);
    if (explorerMode === 'carousel') showPreviewPosition(number,true);
    else openExplorer('carousel',number);
  });
  let carouselFrame;
  on(grid,'scroll',() => {
    if (explorerMode === 'grid') {
      const dock=q('.retour-position'), origin=grid.querySelector('[data-origine]');
      if (!origin) return;
      const frame=grid.getBoundingClientRect(), box=origin.getBoundingClientRect();
      const side=box.bottom<frame.top-3 ? 'haut' : box.top>frame.bottom+3 ? 'bas' : '';
      if (!side) {delete dock.dataset.sens;return;}
      dock.dataset.sens=side;
      if (!dock.querySelector('.repere-retour') && origin.firstElementChild.childElementCount) {
        const miniature=origin.firstElementChild.cloneNode(true);
        miniature.classList.add('repere-retour');dock.querySelector('button').prepend(miniature);
      }
      return;
    }
    if (explorerMode !== 'carousel' || carouselFrame) return;
    carouselFrame = requestAnimationFrame(() => {
      carouselFrame = undefined;
      if (explorerMode !== 'carousel') return;
      const bounds = grid.getBoundingClientRect();
      const middle = bounds.left + bounds.width/2;
      const closest = document.elementsFromPoint(middle,bounds.top + bounds.height/2)
        .map(el => el.closest('[data-preview-index]')).find(card => card && grid.contains(card));
      if (closest) showPreviewPosition(Number(closest.dataset.previewIndex));
    });
  });
  on(grid,'click',async event => {
    const button = event.target.closest('[data-preview-index]');
    if (!button || !pages) return;
    const entry = previewPages[Number(button.dataset.previewIndex)];
    if (!entry) return;
    closeExplorer();
    if (finished) showLastLeaf();
    if (index !== entry.position) {index = entry.position;await drawPage(false);}
    if (!readyToRead) return;
    const marker = entry.anchor && content.querySelector('[data-epub-id="'+CSS.escape(entry.anchor)+'"]');
    if (marker) {
      const left = marker.getClientRects()[0]?.left ?? viewport.getBoundingClientRect().left;
      pager.show(Math.floor((left-viewport.getBoundingClientRect().left+viewport.scrollLeft+1)/(viewport.clientWidth+32)));
    } else pager.show(0);
    recordPosition(true);
    focus(viewport);
  });
  q('[data-fiche]').addEventListener('click',closeExplorer,{capture:true,signal:scope.signal});

  const endPage = q('[data-reader-end]');
  function finishBook() {
    if (finished) return;
    finished = true;
    annotations.closeForReading();
    const cover = q('[data-reader-end-cover]');
    cover.hidden = !book.coverData;
    if (book.coverData) cover.src = book.coverData;
    setText('[data-reader-end-title]',[book.title,book.author].filter(Boolean).join(' · '));
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    reader.setAttribute('data-finished','');
    endPage.hidden = false;
    if (!reduced && viewport.animate) {
      motion = viewport.animate([{transform:'perspective(1400px) rotateY(0deg)'},{transform:'perspective(1400px) rotateY(-93deg)'}],
        {duration:850,easing:'cubic-bezier(.43,0,.25,1)'});
      motion.onfinish = () => {if (finished) viewport.hidden = true;};
    } else viewport.hidden = true;
    focus(endPage);
  }
  function showLastLeaf() {
    finished = false;
    reader.removeAttribute('data-finished');
    endPage.hidden = true;
    viewport.hidden = false;
    resizePages();
  }
  bindPageTurns(endPage,scope.signal,() => finished,turn,() => openExplorer('carousel'));

  let fullscreenPending = false;
  function requestReaderFullscreen() {
    if (!reader.hasAttribute('data-immersive') || fullscreenPending || document.fullscreenElement ||
        !document.fullscreenEnabled || !reader.requestFullscreen || navigator.userActivation?.isActive === false) return;
    fullscreenPending = true;
    reader.requestFullscreen({navigationUI:'hide'}).then(() => {
      if (!reader.hasAttribute('data-immersive') && document.fullscreenElement === reader) return document.exitFullscreen();
    }).catch(() => {}).finally(() => { fullscreenPending = false; });
  }
  function enterReading() {
    reader.setAttribute('data-immersive','');
    requestReaderFullscreen();
    if (!fullscreenPending && !document.fullscreenElement) reader.addEventListener('click',requestReaderFullscreen,{once:true,capture:true});
  }
  function leaveFullscreen() {
    reader.removeEventListener('click',requestReaderFullscreen,true);
    reader.removeAttribute('data-immersive');
    if (document.fullscreenElement === reader) document.exitFullscreen().catch(() => {});
  }
  on(q('[data-reader-exit]'),'click',() => {
    if (explorerMode) {closeExplorer();focus(viewport);}
    else (returnToLibrary || home)();
  });
  const initializingAnnotations = annotations.initialize();
  refreshIcons();

  function recordPosition(record,keepAnchor = false) {
    if (!keepAnchor) {
      latestAnchor = pager.anchor();
      anchorLayout = {width:viewport.clientWidth,height:viewport.clientHeight,count:pager.count};
    }
    const currentWeight = pages.weights?.[index] || 1;
    const total = pages.totalWeight;
    const done = (pages.before[index] + currentWeight * pager.done) / total;
    const last = index === pages.count-1 && pager.number === pager.count-1;
    const percent = last ? 100 : Math.min(99,Math.max(0,Math.round(done*100)));
    let sampledWeight = 0, sampledWords = 0;
    for (const [i,words] of readCounts) {
      sampledWeight += pages.weights?.[i] || 1;
      sampledWords += words;
    }
    const wordsPerWeight = sampledWords ? sampledWords/sampledWeight : unit() === 'page' ? 250 : .14;
    const remainingWords = unit() === 'chapter' ? (1-done)*total : (1-done)*total*wordsPerWeight;
    const minutes = last ? 0 : Math.max(1,Math.ceil(remainingWords/220));
    let location = pages.label+' '+(index+1)+'/'+pages.count;
    const info = pages.sectionInfo?.[index];
    if (info?.kind === 'matter' || (info && !pages.tocChapters.length)) {
      location = info.label || 'Page du livre';
    } else if (unit() === 'chapter' && pages.tocChapters?.length) {
      const left = viewport.getBoundingClientRect().left;
      const candidate = visibleChapters.filter(item => item.element.getBoundingClientRect().left < left+viewport.clientWidth-1).at(-1);
      const chapter = candidate?.chapter || pages.tocChapters.filter(item => item.position < index).at(-1);
      if (chapter) {
        location = 'Chapitre '+chapter.printedNumber+'/'+pages.tocChapters.length;
        if (chapter !== currentChapter) {
          const first = pages.tocChapters.find(item => item.position === chapter.position);
          const key = 'note-chapter-'+(chapter.position+1)+(chapter === first ? '' : '@'+chapter.number);
          annotations.setChapter({key,position:chapter.position,label:chapter.label,offset:candidate?.offset || 0});
          setText('[data-chapter-title]',chapter.label);
          currentChapter = chapter;
        }
      } else location = pages.chapterTitles[index] || 'Ouverture du livre';
    }
    const leaf = previewPages[currentPreview()];
    const numbered = pages.printedTotal && /^\d+$/.test(leaf?.number);
    const progressLocation = numbered ? leaf.number+' / '+pages.printedTotal : unit() === 'page' ? (index+1)+' / '+pages.count : location;
    const label = progressLocation+' · '+formatRemainingReadingTime(minutes);
    const shownPercent = numbered ? Math.round(100*Number(leaf.number)/pages.printedTotal) : percent;
    setText('[data-reader-percent]',shownPercent+' %');
    if (!explorerMode) showProgressSlider();
    setText('[data-reader-progress]',label);
    chrome.style.setProperty('--progress',shownPercent+'%');
    chrome.hidden = false;
    trackSpeed(numbered ? Number(leaf.number) : null, percent);
    if (record) {
      const readingPosition = {unit:unit(),value:index+1,...latestAnchor,percent:shownPercent,page:numbered ? Number(leaf.number) : unit()==='page' ? index+1 : null,chapter:location.startsWith('Chapitre ') ? location.slice(9).split('/')[0] : null};
      savePosition = savePosition.then(async () => {if(await save({readingPosition}) && mode==='book')render();});
    }
  }
  function slide(delta) {
    motion?.cancel();
    if (!delta || !viewport.animate || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Move only the clipped leaf. Moving the column strip also exposes neighbouring leaves.
    const distance = 16*Math.sign(delta);
    motion = viewport.animate([{transform:'translateX('+distance+'px)'},{transform:'translateX(0)'}],{duration:180});
    motion.onfinish = () => annotations.resize();
  }
  function turn(delta) {
    if (!pages || !readyToRead || explorerMode) return;
    motion?.cancel();
    if (finished) {if (delta < 0) showLastLeaf();return;}
    const dest = pager.number + delta;
    if (dest >= 0 && dest < pager.count) {
      pager.show(dest);
      recordPosition(true);
      slide(delta);
    } else if (index+delta >= 0 && index+delta < pages.count) {
      index += delta;
      void drawPage(true,{last:delta<0},delta);
    } else if (delta>0) finishBook();
  }
  const canTurn = () => !explorerMode && readyToRead && annotations.allowTurn();
  bindPageTurns(surface,scope.signal,canTurn,turn,() => openExplorer('carousel'));
  on(reader,'keydown',event => {
    if (event.defaultPrevented || !canTurn() || event.target.closest('input,select,textarea,button,a,[contenteditable=true]') || window.getSelection()?.toString()) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      turn(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  function resizePages() {
    cancelAnimationFrame(layoutFrame);
    if (!readyToRead || finished || explorerMode) return;
    layoutFrame = requestAnimationFrame(() => {
      if (!readyToRead) return;
      motion?.cancel();
      pager.measure(unit(),latestAnchor,anchorLayout);
      recordPosition(false,true);
    });
  }
  let previousSize = '';
  const observer = new ResizeObserver(() => {
    const size = viewport.clientWidth + '/' + viewport.clientHeight;
    if (size !== previousSize) {previousSize = size; resizePages();}
  });
  observer.observe(viewport);
  on(window,'resize',resizePages);
  scope.signal.addEventListener('abort',() => {observer.disconnect();cancelAnimationFrame(layoutFrame);},{once:true});
  on(content,'click',async event => {
    const link = event.target.closest('[data-epub-section]');
    if (!link || !pages) return;
    event.preventDefault();
    const target = link.dataset.epubTarget;
    const section = Number(link.dataset.epubSection);
    if (section !== index) {index = section;await drawPage(true);}
    if (!readyToRead) return;
    const node = target && content.querySelector('[data-epub-id="'+CSS.escape(target)+'"]');
    if (node) {
      const left = node.getClientRects()[0]?.left ?? viewport.getBoundingClientRect().left;
      const number = Math.floor((left-viewport.getBoundingClientRect().left+viewport.scrollLeft+1)/(viewport.clientWidth+32));
      pager.show(number);
    } else pager.show(0);
    recordPosition(true);
  });
  function presentHeading(fragment,label,title,anchor) {
    const heading = anchor?.matches('h1,h2,h3,h4,h5,h6') ? anchor :
      anchor?.querySelector('h1,h2,h3,h4,h5,h6') || (!anchor ? fragment.querySelector('[data-chapter-heading]') : null);
    const header = document.createElement('div');
    header.className = 'leaf-heading';
    if (heading || anchor) (heading || anchor).before(header);
    else fragment.prepend(header);
    const normalize = text => String(text || '').replace(/\s+/gu,' ').trim().toLocaleLowerCase();
    if (heading && normalize(heading.textContent) === normalize(label)) {
      heading.classList.add('leaf-number','number-only');
      header.append(heading);
      if (title && normalize(title) !== normalize(label)) {
        const subtitle = document.createElement('div');
        subtitle.className = 'leaf-title';
        subtitle.dataset.caption = title;
        header.append(subtitle);
      }
      return header;
    }
    const number = document.createElement('span');
    number.className = 'leaf-number';
    const digit = document.createElement('i');
    digit.dataset.caption = label;
    number.append(digit);
    header.append(number);
    if (heading) {
      heading.classList.add('leaf-title');
      header.append(heading);
    } else if (title && title !== label) {
      const fallback = document.createElement('div');
      fallback.className = 'leaf-title';
      fallback.dataset.caption = title;
      header.append(fallback);
    }
    return header;
  }
  function prepareOpenings(fragment,section,current,label) {
    visibleChapters = [];
    currentChapter = null;
    if (section.sectionInfo[current].kind === 'matter' || !section.tocChapters.length) return;
    const entries = section.tocChapters.filter(item => item.position === current);
    for (const chapter of entries) {
      const anchor = chapter.anchor ? fragment.querySelector('[data-epub-id="'+CSS.escape(chapter.anchor)+'"]') : null;
      if (chapter.anchor && !anchor && visibleChapters.length) continue;
      const opening = presentHeading(fragment,'Chapitre '+chapter.printedNumber,chapter.label,anchor);
      if (visibleChapters.length) opening.style.breakBefore = 'column';
      visibleChapters.push({chapter,element:opening});
    }
  }
  async function drawPage(record=false,position={},direction=0) {
    const version = ++renderSequence;
    readyToRead = false;
    motion?.cancel();
    readerDetails.hidden = true;
    const section = pages;
    const current = index;
    try {
      pageTask?.cancel();
      const result = await section.read(current);
      if (renderSequence !== version) return;
      // The previous leaf stays on screen until the new one can be painted in its final theme and position.
      if (section.sectionInfo) {
        readingFonts ??= Promise.allSettled(['16px "Alegreya Lecture"','21px "Playfair Lecture"'].map(font => document.fonts?.load(font)));
        const images = Array.from(result.querySelectorAll('img'));
        await Promise.all([readingFonts,...images.map(async image => {
          try {
            await image.decode();
            if (version === renderSequence) await adaptEpubIllustration(image);
          } catch { /* Display the embedded illustration when conversion is unavailable. */ }
        })]);
        if (version !== renderSequence) return;
      }
      const info = section.sectionInfo?.[current];
      const label = info ? (info.label || section.chapterTitles[current] || 'Page du livre') : section.label+' '+(current+1);
      surface.dataset.pageKind = info?.plate ? 'plate' : info?.kind || 'pdf';
      const chapter = unit() === 'chapter' ? {key:'note-chapter-'+(current+1),position:current,label:info?.label || section.chapterTitles[current] || label} :
        section.outline?.find(item => current >= item.position);
      content.dataset.flow = unit();
      content.lang = section.language || document.documentElement.lang || 'fr';
      viewport.scrollLeft = 0;
      if (unit() === 'chapter') {
        if (info.kind === 'body') {
          const textNodes = document.createTreeWalker(result,NodeFilter.SHOW_TEXT);
          while (textNodes.nextNode()) {
            const node = textNodes.currentNode;
            node.data = node.data.replace(/(\p{L})\u00a0(?=\p{L})/gu,'$1 ');
          }
        }
        prepareOpenings(result,section,current,label);
        splitPrintedLeaves(result,info);
        if (info.plate) {
          const img = result.querySelector('img');
          if (img) {img.classList.add('page-plate'); if (!img.alt) img.alt = label;}
        }
      }
      setText('[data-chapter-title]',chapter?.label || label);
      const pageWords = annotations.loadPage(result,{key:unit()+'-'+(current+1),position:current,count:section.count,label,chapter,unitLabel:section.label});
      for (const item of visibleChapters) {
        if (unit() !== 'chapter') break;
        const prefix = document.createRange();
        prefix.selectNodeContents(content);
        prefix.setEndBefore(item.element);
        item.offset = prefix.toString().length;
      }
      if (pageWords) readCounts.set(current,pageWords);
      chrome.hidden = false;
      pager.measure(unit(),position);
      readyToRead = true;
      recordPosition(record || !book.readingPosition);
      slide(direction);
    } catch (error) {
      if (renderSequence !== version) return;
      annotations.clearPage();
      delete content.dataset.flow;
      chrome.hidden = false;
      content.textContent = error.message || 'Cette page est illisible.';
      readerDetails.hidden = false;
    }
  }
  async function pdfChapters(pdf) {
    try {
      const outline = await pdf.getOutline();
      const chapters = [];
      for (const item of outline?.slice(0,250) || []) {
        const destination = typeof item.dest === 'string' ? await pdf.getDestination(item.dest) : item.dest;
        if (!Array.isArray(destination) || destination[0] == null) continue;
        const position = Number.isInteger(destination[0]) ? destination[0] : await pdf.getPageIndex(destination[0]);
        if (position < 0 || position >= pdf.numPages || chapters.some(chapter => chapter.position === position)) continue;
        chapters.push({key:'note-pdf-chapter-'+position,label:item.title.trim().slice(0,180) || 'Chapitre',position});
      }
      return chapters.sort((a,b) => b.position-a.position);
    } catch { return []; }
  }

  async function openReader() {
    setPopup(false); setDelete(false); stopReader();
    const session = readerSession;
    const current = () => session === readerSession && !scope.signal.aborted;
    mode = 'reader'; render();
    enterReading();
    setText('[data-book-title]', book.title);
    setText('[data-chapter-title]', '');
    setText('[data-reader-progress]', '');
    chrome.hidden = false;
    readCounts.clear();
    setText('[data-reader-content]', 'Ouverture du livre…');
    window.scrollTo({top:0, behavior:'instant'});
    readerDetails.hidden = true;
    readerBack.setAttribute('aria-label', openedDirectly ? 'Revenir à la bibliothèque' : 'Revenir à la fiche');
    reader.tabIndex = -1;
    focus(reader);
    try {
      if (book.format === 'Papier' && !book.fileFingerprint) throw Error('Ce livre papier n’a pas de fichier à ouvrir.');
      await Promise.all([initializingAnnotations,savePosition]);
      if (!current()) return;
      const file = await storage.getDocument(book.id);
      if (!current()) return;
      if (!file) throw Error('Le fichier de ce livre est introuvable sur cet appareil.');
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (!current()) return;
      const format = engine.formatOf(bytes);
      let section;
      if (format === 'EPUB') {
        section = {label:'Chapitre', ...await engine.openEpub(bytes,() => !current())};
      } else if (format === 'PDF') {
        const pdf = await engine.fromPdf(bytes, task => { if (current()) pdfTask = task; else task.destroy().catch(() => {}); });
        const outline = await pdfChapters(pdf.document);
        section = {count:pdf.document.numPages, label:'Page', outline,
          preview:n => engine.renderPage(pdf.document,n+1,240,task => {if (!current()) task.cancel();}),
          read:n => engine.renderPage(pdf.document, n + 1, 1600, task => {if (current()) pageTask = task; else task.cancel();},pdf.TextLayer)};

      } else throw Error('Ce format de livre est illisible.');
      if (!current()) return;
      section.before = [];
      section.totalWeight = 0;
      for (let n=0;n<section.count;n++) {
        section.before.push(section.totalWeight);
        section.totalWeight += section.weights?.[n] || 1;
      }
      pages = section;
      previewPages = pagesForExplorer();
      const track = q('[data-track-marks]');
      track.replaceChildren();
      for (let i=1;i<previewPages.length;i++) {
        if (!previewPages[i].group || previewPages[i].group===previewPages[i-1].group) continue;
        const mark=document.createElement('i');
        mark.className='trait-chap';
        if (pages.printedTotal && (!previewPages[i].number || !pages.sectionInfo?.[previewPages[i].position]?.chapters?.length)) continue;
        mark.style.left=(pages.printedTotal ? 100*Number(previewPages[i].number)/pages.printedTotal : 100*i/Math.max(1,previewPages.length-1))+'%';
        track.append(mark);
      }
      const position = book.readingPosition;
      const start = position && position.unit === (format === 'PDF' ? 'page' : 'chapter') ? Number(position.value) - 1 : 0;
      index = Math.max(0, Math.min(section.count - 1, Math.floor(start) || 0));
      await drawPage(false,position?.unit === unit() ? position : {});
    } catch (error) {
      if (!current()) return;
      setText('[data-reader-content]', error.name === 'PasswordException' ? 'Ce PDF demande un mot de passe. Ouvre une copie déverrouillée pour le lire ici.' : error.message);
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
  on(carnet,'click',async () => {
    await openReader();
    if(mode==='reader' && readyToRead && !scope.signal.aborted) q('[data-fiche]').click();
  });
  on(readerBack, 'click', closeReader);
  on(readerDetails, 'click', showBookDetails);
  on(document, 'keydown', event => {
    if (event.defaultPrevented || event.key !== 'Escape' || root.dataset.sidebarOpen === 'true') return;
    if (mode === 'reader' && explorerMode) {event.preventDefault();closeExplorer();focus(galleryButton);return;}
    if (mode === 'reader' && reader.hasAttribute('data-immersive')) {event.preventDefault();closeReader();return;}
    if (!bubble.hidden) setDelete(false, true);
    else if (!popup.hidden) setPopup(false, true);
    else if (mode === 'note') backFromNote();
    else if (mode === 'reader') closeReader();
  });
  setDelete(false);
  q('.ep-book-name').tabIndex = -1;
  if (startInReader) void openReader();
  else if (startInNote) {
    showNote();
    window.scrollTo({top:0, behavior:'instant'});
  } else {
    render();
    window.scrollTo({top:0, behavior:'instant'});
    focus(q('.ep-book-name'));
  }
  return () => {
    carnet.remove(); scope.abort(); stopReader();
    for (const button of [edit, trash, homeButton, create]) button.hidden = true;
    host.replaceChildren();
    delete host.dataset.bookId;
    root.removeAttribute('data-book-reading');
  };
}
