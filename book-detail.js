function mountSavedBook({root, host, book, storage, engine, bookTagOptions, refreshIcons, home, startInReader, startInNote, returnToLibrary, onSave, onRemove, onError}) {
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
    readyToRead = false;
    motion?.cancel();
    cancelAnimationFrame(layoutFrame);
    delete content.dataset.flow;
    annotations.clearPage();
    chrome.hidden = true;
  }
  const chrome = q('[data-reader-chrome]');
  const content = q('[data-reader-content]');
  const viewport = q('[data-reader-viewport]');
  const surface = q('[data-page]');
  let readyToRead = false;
  let motion;
  let layoutFrame;
  let latestAnchor = {};
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
  const initializingAnnotations = annotations.initialize();
  refreshIcons();

  function recordPosition(record) {
    latestAnchor = pager.anchor();
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
    const minutes = last ? 0 : Math.max(1,Math.ceil((1-done)*total*wordsPerWeight/220));
    let location = pages.label+' '+(index+1)+'/'+pages.count;
    if (unit() === 'chapter' && pages.tocChapters?.length) {
      const left = viewport.getBoundingClientRect().left;
      const candidate = visibleChapters.filter(item => item.element.getBoundingClientRect().left < left+viewport.clientWidth-1).at(-1);
      const chapter = candidate?.chapter || pages.tocChapters.filter(item => item.position < index).at(-1);
      if (chapter) {
        location = 'Chapitre '+chapter.number+'/'+pages.tocChapters.length;
        if (chapter !== currentChapter) {
          const first = pages.tocChapters.find(item => item.position === chapter.position);
          const key = 'note-chapter-'+(chapter.position+1)+(chapter === first ? '' : '@'+chapter.number);
          annotations.setChapter({key,position:chapter.position,label:chapter.label,offset:candidate?.offset || 0});
          setText('[data-chapter-title]',chapter.label);
          currentChapter = chapter;
        }
      } else location = pages.chapterTitles[index] || 'Ouverture du livre';
    }
    const label = location+' • '+percent+'% • '+minutes+' min';
    setText('[data-reader-progress]',label);
    chrome.style.setProperty('--progress',percent+'%');
    chrome.hidden = false;
    if (record) {
      const readingPosition = {unit:unit(),value:index+1,...latestAnchor};
      savePosition = savePosition.then(() => save({readingPosition}));
    }
  }
  function slide(delta) {
    motion?.cancel();
    if (!delta || !content.animate || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const distance = (viewport.clientWidth+32)*Math.sign(delta);
    motion = content.animate([{transform:'translateX('+distance+'px)'},{transform:'translateX(0)'}],{duration:310,easing:'ease-out'});
    motion.onfinish = () => annotations.resize();
  }
  function turn(delta) {
    if (!pages || !readyToRead) return;
    motion?.cancel();
    const dest = pager.number + delta;
    if (dest >= 0 && dest < pager.count) {
      pager.show(dest);
      recordPosition(true);
      slide(delta);
    } else if (index+delta >= 0 && index+delta < pages.count) {
      index += delta;
      void drawPage(true,{last:delta<0},delta);
    }
  }
  const canTurn = () => readyToRead && annotations.allowTurn();
  bindPageTurns(surface,scope.signal,canTurn,turn);
  on(reader,'keydown',event => {
    if (event.defaultPrevented || !canTurn() || event.target.closest('input,select,textarea,button,a,[contenteditable=true]') || window.getSelection()?.toString()) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      turn(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  function resizePages() {
    cancelAnimationFrame(layoutFrame);
    if (!readyToRead) return;
    layoutFrame = requestAnimationFrame(() => {
      if (!readyToRead) return;
      motion?.cancel();
      pager.measure(unit(),latestAnchor);
      recordPosition(false);
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
    if (heading?.textContent.trim().toLocaleLowerCase() === label.toLocaleLowerCase()) {
      heading.classList.add('leaf-number','number-only');
      header.append(heading);
      if (title && title.toLocaleLowerCase() !== label.toLocaleLowerCase()) {
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
    if (!section.tocChapters.length) {
      presentHeading(fragment,label,section.chapterTitles[current]);
      return;
    }
    const entries = section.tocChapters.filter(item => item.position === current);
    for (const chapter of entries) {
      const anchor = chapter.anchor ? fragment.querySelector('[data-epub-id="'+CSS.escape(chapter.anchor)+'"]') : null;
      if (chapter.anchor && !anchor && visibleChapters.length) continue;
      const opening = presentHeading(fragment,'Chapitre '+chapter.number,chapter.label,anchor);
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
      const label = section.label+' '+(current+1);
      const chapter = unit() === 'chapter' ? {key:'note-chapter-'+(current+1),position:current,label:section.chapterTitles[current] || label} :
        section.outline?.find(item => current >= item.position);
      content.dataset.flow = unit();
      content.lang = section.language || document.documentElement.lang || 'fr';
      viewport.scrollLeft = 0;
      if (unit() === 'chapter') prepareOpenings(result,section,current,label);
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
      if (unit() === 'chapter') {
        await Promise.all([document.fonts?.ready,...Array.from(content.images || content.querySelectorAll('img'),img => img.decode?.().catch(() => {}))]);
      }
      if (renderSequence !== version) return;
      pager.measure(unit(),position);
      readyToRead = true;
      recordPosition(record || !book.readingPosition);
      slide(direction);
    } catch (error) {
      if (renderSequence !== version) return;
      annotations.clearPage();
      delete content.dataset.flow;
      chrome.hidden = true;
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
    setText('[data-book-title]', book.title);
    setText('[data-chapter-title]', '');
    setText('[data-reader-progress]', '');
    chrome.hidden = true;
    readCounts.clear();
    setText('[data-reader-content]', 'Ouverture du livre…');
    chrome.hidden = true;
    window.scrollTo({top:0, behavior:'instant'});
    readerDetails.hidden = true;
    readerBack.setAttribute('aria-label', openedDirectly ? 'Revenir à la bibliothèque' : 'Revenir à la fiche');
    focus(readerBack);
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
        section = {label:'Chapitre', ...await engine.openEpub(bytes)};
      } else if (format === 'PDF') {
        const pdf = await engine.fromPdf(bytes, task => { if (current()) pdfTask = task; else task.destroy().catch(() => {}); });
        const outline = await pdfChapters(pdf.document);
        section = {count:pdf.document.numPages, label:'Page', outline,
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
  on(readerBack, 'click', closeReader);
  on(readerDetails, 'click', showBookDetails);
  on(document, 'keydown', event => {
    if (event.defaultPrevented || event.key !== 'Escape' || root.dataset.sidebarOpen === 'true') return;
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
