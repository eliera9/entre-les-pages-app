function mountReaderAnnotations({root,app,book,storage,save:saveBook,navigate,signal,refreshIcons,onBookmark}) {
  const config = {"colors":[["Rose poudré","#d1aab6"],["Rose boisé","#b77b8d"],["Lilas doux","#c4a7cb"],["Sauge","#a7ad94"],["Miel","#d8b578"],["Sable","#d1b49c"],["Vieux rose","#c58a9c"],["Framboise","#b65c7c"],["Lavande","#ab9acf"],["Prune","#8e6384"],["Bleu brume","#adc6d8"],["Bleu ardoise","#788fa9"],["Vert amande","#c4ceaa"],["Eucalyptus","#83aea0"],["Pêche","#efb9a4"],["Terracotta","#c78772"],["Vanille","#ebd7a4"],["Taupe","#aa968b"]],"tools":[["surligner","Surligner"],["souligner","Souligner"],["entourer-le-texte","Entourer le texte"],["symbole","Symbole"],["note-de-passage","Note de passage"],["note-de-page","Note de page"],["note-de-chapitre","Note de chapitre"],["marque-page","Marque-page"],["passage-favori","Passage favori"],["citation","Citation"],["etiquette-personnalisee","Étiquette personnalisée"]]};
  const preferences = {color:config.colors[0][1],strength:"light",shape:"rounded"};
  const one = selector => root.querySelector(selector);
  const all = selector => [...root.querySelectorAll(selector)];
  const reader = one(".reader");
  const sheet = one(".sheet");
  const rail = one("[data-rail]");
  const views = all("[data-view]");
  const fiche = one("[data-fiche]");
  const savedSection = one("[data-view=saved]");
  fiche.setAttribute("aria-controls",savedSection.id);
  const page = one("[data-page]");
  const ribbonOpen = one("[data-ribbon-open]");
  const ribbon = one("[data-bookmark]");
  const ribbonMarker = one("[data-ribbon-note-mark]");
  const ribbonPanel = one("[data-ribbon-panel]");
  const ribbonChoices = one("[data-ribbon-choices]");
  const ribbonEntry = one("[data-ribbon-entry]");
  const ribbonText = one("[data-ribbon-text]");
  const ribbonSave = one("[data-ribbon-save]");
  const ribbonDrafts = new Map();
  let ribbonScope = null;
  const marginReperes = one("[data-margin-reperes-layer]");
  const reading = one("[data-reading]");
  let sections = [];
  let sectionTexts = [];
  let offsets = [0];
  let current = null;
  let state = {annotations:[],placement:[],bookmarked:false};
  let savedFilter = "all";
  let persisted = {};
  let writeQueue = Promise.resolve();
  const toolLabels = new Map(config.tools);
  const bookmarkNoteTypes = new Set(["note-de-page","note-de-chapitre"]);
  const contextualTools = new Set(["note-de-passage","passage-favori","citation",...bookmarkNoteTypes]);
  const railTools = config.tools.filter(([slug]) => !contextualTools.has(slug));
  const toolButtons = new Map();
  const symbols = [
    ["♡","J’ai adoré ce passage"],["☺","Ça m’a fait rire"],["!","Ça m’a surprise"],
    ["ϟ","Ce passage m’a tenue en haleine"],["×","Je ne suis pas convaincue"],
    ["✧","Passage important"],["?","Quelque chose m’interroge"],["⌕","Indice ou théorie"],
    ["♙","Détail sur un personnage"],["❝","Formulation que j’aime"]
  ];
  const symbolNames = new Map(symbols);
  const notes = new Map([
    ["note-de-passage",() => ""],["note-de-page",pageLabel],["note-de-chapitre",chapterLabel]
  ]);
  const textTools = new Map([["surligner","highlight"],["souligner","underline"],["entourer-le-texte","circle"]]);
  const panelViews = new Map([["etiquette-personnalisee","editor"],["symbole","symbol"]]);
  function pageLabel() { return current?.label || ""; }
  function chapterLabel() { return current?.chapter?.label || ""; }
  function bookmarkNoteFor(slug) {
    return slug === "note-de-chapitre" ? current?.chapter && persisted[current.chapter.key]?.note :
      state.annotations.find(item => item.slug === slug);
  }
  const assist = one("[data-tool-hint]");
  const status = one("[data-status]");
  const editor = one("[data-view=editor]");
  const tagName = one("[data-tag-name]");
  const save = one("[data-save]");
  const meaning = one("[data-meaning]");
  const pageMeaning = one("[data-page-meaning]");
  const ghost = one("[data-ghost]");
  const tagTrack = one("[data-tags]");

  let view = "reading";
  let tool = null;
  let pending = null;
  let selectedRange = null;
  let selectionTimer;
  let currentEditor = null;
  let editedAnnotation = null;
  let activeTag = null;

  function span(className,text = "") {
    const item = document.createElement("span");
    item.className = className;
    item.textContent = text;
    return item;
  }
  function art(id) {
    const icon = span("line-art");
    icon.dataset.art = id;
    icon.setAttribute("aria-hidden","true");
    return icon;
  }
  function symbolArt(glyph) {
    const icon = span("symbol-art");
    icon.dataset.symbolArt = glyph;
    icon.setAttribute("aria-hidden","true");
    return icon;
  }
  function button(label,className) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = className + " cursor-interaction";
    if (label) item.textContent = label;
    return item;
  }
  function announce(text) {
    status.textContent = text;
  }

  function syncChrome() {
    fiche.setAttribute("aria-expanded",String(!sheet.hidden && view === "saved"));
    for (const [id] of panelViews) {
      toolButtons.get(id)?.setAttribute("aria-expanded",String(!sheet.hidden && view !== "saved" && tool === id));
    }
  }

  for (const [index,[slug,label]] of railTools.entries()) {
    const item = button("","rail-button");
    item.dataset.tool = slug;
    item.setAttribute("aria-label",label);
    item.setAttribute("data-tooltip",label);
    item.setAttribute("data-tooltip-placement","left");
    item.tabIndex = index === 0 ? 0 : -1;
    item.append(art(slug));
    if (textTools.has(slug) || slug === "marque-page") item.setAttribute("aria-pressed","false");
    if (panelViews.has(slug)) {
      item.setAttribute("aria-controls",sheet.id);
      item.setAttribute("aria-expanded","false");
    }
    item.addEventListener("focus",() => {
      for (const other of toolButtons.values()) other.tabIndex = other === item ? 0 : -1;
    });
    item.addEventListener("click",() => {
      if (!current) return;
      if (!options.hidden) {
        closeOptions();
        return;
      }
      openTool(slug);
    });
    toolButtons.set(slug,item);
    rail.append(item);
  }
  const layout = one(".reader-layout");
  const readingColumn = one(".reading-column");
  const linkMenu = one("[data-link-actions]");
  const linkShortcuts = one("[data-link-shortcuts]");
  const linkEntry = one("[data-link-entry]");
  const linkBack = one("[data-entry-back]");
  const linkCheck = one("[data-entry-check]");
  const linkNext = one("[data-entry-next]");
  const inlineNote = one("[data-inline-note]");
  const repereFields = one("[data-repere-fields]");
  const reperePicker = one("[data-repere-picker]");
  const repereTrigger = one("[data-repere-trigger]");
  const repereTriggerLabel = one("[data-repere-trigger-label]");
  const repereOptions = one("[data-repere-options]");
  const repereCustom = one("[data-repere-custom]");
  const repereName = one("[data-repere-name]");
  let repereStep = "type";
  let repereType = "";
  let repereChoice = "";
  let matchingReperes = [];
  const repereSymbols = {
    personnage:"♙",decor:"map-pin",indice:"⌕",objet:"key-round",
    evenement:"✧",relation:"♡",autre:"etiquette-personnalisee"
  };
  let repereCatalog = [];
  const repereLabels = new Map([
    ["personnage","Personnage"],["decor","Décor"],["indice","Indice"],["objet","Objet"],
    ["evenement","Événement"],["relation","Relation"],["autre","Autre type…"]
  ]);
  const reperePlaceholders = {
    personnage:"Nom du personnage",decor:"Nom du décor",indice:"Nom de l’indice",
    objet:"Nom de l’objet",evenement:"Nom de l’événement",relation:"Nom de la relation"
  };
  const linkSave = one("[data-link-save]");
  const linkDrafts = new WeakMap();
  let linkHighlight = null;
  let activeLinkEntry = null;
  const newId = () => crypto.randomUUID();
  const options = one("[data-pin-options]");
  const pinToggle = one("[data-pin-toggle]");
  const pinClose = one("[data-pin-close]");
  const replacement = one("[data-pin-replace]");
  const pinChoices = one("[data-pin-choices]");
  const pinStatus = one("[data-pin-status]");
  const bookmarkNotes = one("[data-bookmark-notes]");
  const bookmarkNoteButtons = all("[data-bookmark-note]");
  const pinned = document.createElement("div");
  const rest = document.createElement("div");
  pinned.className = "rail-pinned";
  pinned.setAttribute("role","group");
  pinned.setAttribute("aria-label","Outils épinglés");
  rest.className = "rail-rest";
  rail.append(pinned,rest);
  let profile = {};
  const pinnedIds = new Set(["surligner","souligner","symbole","marque-page"]);
  const highlightSettings = one("[data-highlight-settings]");
  const highlightColors = one("[data-highlight-colors]");
  const colorName = one("[data-color-name]");
  const colorStatus = one("[data-color-status]");
  const colorButtons = new Map();
  let lastHighlight = preferences.color;
  let lastUnderline = null;
  let underlineLine = "simple";
  const underlineStyles = one("[data-underline-styles]");
  const lineChoices = all("[data-line]");
  const underlineDefault = () => app.dataset.theme === "dark" ? "#c4a7cb" : "#b77b8d";
  const startingOrder = [...new Set([...pinnedIds,...toolButtons.keys()])];
  const useCount = new Map();
  let ranked = startingOrder.slice();
  let configuring = null;
  let optionsY = 4;
  let hold = null;
  let holdTimer;
  let suppressedClick = -Infinity;

  function recordUse(id) {
    if (!toolButtons.has(id)) return;
    useCount.set(id,(useCount.get(id) || 0) + 1);
    saveProfile();

  }

  function arrangeRail(scroll = rest.scrollTop) {
    replaceTools(pinned,[...pinnedIds]);
    replaceTools(rest,ranked.filter(id => !pinnedIds.has(id)));
    rest.scrollTop = scroll;
  }

  function replaceTools(container,ids) {
    if (container.children.length === ids.length &&
      ids.every((id,index) => container.children[index].dataset.tool === id)) return;
    container.replaceChildren(...ids.map(id => toolButtons.get(id)));
  }

  function positionOptions() {
    if (options.hidden) return;
    const height = layout.getBoundingClientRect().height;
    const menu = options.getBoundingClientRect().height;
    const top = Math.max(4,Math.min(optionsY,height - menu - 4));
    options.style.setProperty("--pin-top",top + "px");
  }

  function refreshHighlightSettings() {
    highlightSettings.hidden = configuring !== "surligner" && configuring !== "souligner";
    if (highlightSettings.hidden) return;
    const isUnderline = configuring === "souligner";
    const color = isUnderline ? lastUnderline || underlineDefault() : lastHighlight;
    const [name] = config.colors.find(([,value]) => value === color);
    for (const [value,item] of colorButtons) item.setAttribute("aria-pressed",String(value === color));
    highlightColors.setAttribute("aria-label",isUnderline ? "Couleurs du soulignement" : "Couleurs de surlignage");
    colorName.textContent = name;
    underlineStyles.hidden = !isUnderline;
    if (isUnderline) {
      underlineStyles.style.setProperty("--line-color",color);
      for (const choice of lineChoices) choice.setAttribute("aria-pressed",String(choice.dataset.line === underlineLine));
    }
  }

  for (const [name,color] of config.colors) {
    const item = button("","highlight-swatch");
    item.dataset.highlightColor = color;
    item.setAttribute("aria-label",name);
    item.setAttribute("data-tooltip",name);
    const swatch = span("active-color-dot");
    swatch.setAttribute("aria-hidden","true");
    swatch.style.setProperty("--preview-color",color);
    item.append(swatch);
    item.addEventListener("click",() => {
      if (configuring === "souligner") lastUnderline = color;
      else lastHighlight = color;
      colorStatus.textContent = "Couleur sélectionnée · " + name;
      refreshHighlightSettings();
      saveProfile();
    });
    colorButtons.set(color,item);
    highlightColors.append(item);
  }
  wireScroll(highlightColors);

  function updatePin() {
    pinToggle.setAttribute("aria-label","Épingler " + toolLabels.get(configuring));
    pinToggle.setAttribute("aria-pressed",String(pinnedIds.has(configuring)));
    pinToggle.setAttribute("data-tooltip",pinnedIds.has(configuring) ? "Désépingler" : "Épingler");
  }

  function openOptions(id,trigger,focus = true) {
    selectedRange = currentSelection() || selectedRange;
    closeRibbonNotes();
    closeLinkMenu();
    if (!sheet.hidden) showSheet(false);
    setPending(null);
    if (configuring) toolButtons.get(configuring).removeAttribute("data-options-open");
    configuring = id;
    options.dataset.menuTool = id;
    const bounds = layout.getBoundingClientRect();
    optionsY = trigger.getBoundingClientRect().top - bounds.top;
    options.hidden = false;
    replacement.hidden = true;
    pinStatus.textContent = "";
    layout.setAttribute("data-pin-open","");
    trigger.setAttribute("data-options-open","");
    one("[data-pin-title]").textContent = toolLabels.get(id);
    one("[data-pin-heading-icon]").replaceChildren(art(id));
    bookmarkNotes.hidden = id !== "marque-page";
    for (const control of bookmarkNoteButtons) control.hidden = control.dataset.bookmarkNote === "note-de-chapitre" && !current?.chapter;
    if (!bookmarkNotes.hidden) {
      for (const control of bookmarkNoteButtons) {
        const hasNote = Boolean(bookmarkNoteFor(control.dataset.bookmarkNote));
        control.dataset.saved = String(hasNote);
        const name = toolLabels.get(control.dataset.bookmarkNote);
        control.setAttribute("aria-label",hasNote ? name + " · Modifier" : name);
      }
    }
    updatePin();
    refreshHighlightSettings();
    positionOptions();
    if (focus) pinToggle.focus({preventScroll:true});
  }

  function closeOptions(focus = false) {
    if (options.hidden) return;
    const trigger = toolButtons.get(configuring);
    trigger?.removeAttribute("data-options-open");
    options.hidden = true;
    layout.removeAttribute("data-pin-open");
    configuring = null;
    if (focus) trigger?.focus({preventScroll:true});
  }

  function togglePin(replaced) {
    const added = !pinnedIds.has(configuring);
    if (added) {
      if (replaced) {
        const order = [...pinnedIds].map(id => id === replaced ? configuring : id);
        pinnedIds.clear();
        order.forEach(id => pinnedIds.add(id));
      } else pinnedIds.add(configuring);
    } else {
      pinnedIds.delete(configuring);
    }
    replacement.hidden = true;
    arrangeRail();
    updatePin();
    positionOptions();
    saveProfile();
    pinStatus.textContent = added ? "Raccourci épinglé." : "Raccourci désépinglé.";
  }

  pinToggle.addEventListener("click",() => {
    if (pinnedIds.has(configuring) || pinnedIds.size < 4) {
      togglePin();
      return;
    }
    if (!replacement.hidden) {
      replacement.hidden = true;
      positionOptions();
      return;
    }
    const choices = ranked.filter(id => pinnedIds.has(id)).map(id => {
      const choice = button("","pin-choice");
      const label = toolLabels.get(id);
      choice.dataset.replaceTool = id;
      choice.setAttribute("aria-label","Remplacer " + label);
      choice.setAttribute("data-tooltip",label);
      choice.append(art(id),span("",label));
      choice.addEventListener("click",() => {
        togglePin(id);
        pinToggle.focus({preventScroll:true});
      });
      return choice;
    });
    pinChoices.replaceChildren(...choices);
    replacement.hidden = false;
    positionOptions();
    choices[0]?.focus({preventScroll:true});
  });
  pinClose.addEventListener("click",() => closeOptions(true));

  function cancelHold() {
    clearTimeout(holdTimer);
    hold = null;
  }
  rail.addEventListener("pointerdown",event => {
    const trigger = event.target.closest("[data-tool]");
    if (!trigger || event.button !== 0 || event.isPrimary === false) return;
    cancelHold();
    suppressedClick = -Infinity;
    hold = {id:event.pointerId,x:event.clientX,y:event.clientY};
    holdTimer = setTimeout(() => {
      if (!hold || root.hidden) return;
      if (event.target !== trigger && !trigger.contains(event.target)) return;
      suppressedClick = performance.now() + 800;
      openOptions(trigger.dataset.tool,trigger);
    },475);
  });
  rail.addEventListener("pointermove",event => {
    if (hold?.id !== event.pointerId) return;
    if (Math.hypot(event.clientX - hold.x,event.clientY - hold.y) > 8) cancelHold();
  });
  for (const type of ["pointerup","pointercancel","pointerleave"]) rail.addEventListener(type,cancelHold);
  rail.addEventListener("click",event => {
    if (event.detail && performance.now() < suppressedClick) {
      event.preventDefault();
      event.stopPropagation();
    }
  },true);
  rail.addEventListener("contextmenu",event => {
    const trigger = event.target.closest("[data-tool]");
    if (!trigger) return;
    event.preventDefault();
    if (event.pointerType === "touch" || performance.now() < suppressedClick) return;
    openOptions(trigger.dataset.tool,trigger);
  });

  options.addEventListener("pointerdown",() => { selectedRange = currentSelection() || selectedRange; });
  options.addEventListener("keydown",event => {
    if (event.key === "Escape") closeOptions(true);
  });
  reader.addEventListener("pointerdown",event => {
    if (!options.hidden && !options.contains(event.target) && !rail.contains(event.target)) closeOptions();
  });
  wireScroll(rest,true);
  rail.addEventListener("keydown",event => {
    const current = event.target.closest("[data-tool]");
    if (!current) return;
    if (event.key === "Escape" && !options.hidden) {
      event.preventDefault();
      closeOptions(true);
      return;
    }
    if (event.key === "ContextMenu" || (event.key === "F10" && event.shiftKey)) {
      event.preventDefault();
      openOptions(current.dataset.tool,current);
      return;
    }
    const list = [...rail.querySelectorAll("[data-tool]")];
    const index = list.indexOf(current);
    const next = {ArrowUp:index - 1,ArrowDown:index + 1,Home:0,End:list.length - 1}[event.key];
    if (next === undefined || !list[next]) return;
    event.preventDefault();
    list[next].focus();
  });

  function renderRibbon() {
    const hasNote = [...bookmarkNoteTypes].some(slug => bookmarkNoteFor(slug));
    ribbon.hidden = !state.bookmarked;
    ribbonMarker.hidden = !hasNote;
    ribbonOpen.hidden = !state.bookmarked && !hasNote;
    ribbonOpen.toggleAttribute("data-notes-only",!state.bookmarked);
    toolButtons.get("marque-page").setAttribute("aria-pressed",String(state.bookmarked));
  }

  function closeRibbonNotes() {
    ribbonScope = null;
    ribbonPanel.hidden = true;
    ribbonOpen.setAttribute("aria-expanded","false");
  }

  function ribbonDraftKey(slug) {
    return slug === "note-de-chapitre" ? current.chapter?.key : current.key;
  }

  function refreshRibbonEntry() {
    ribbonText.style.height = "auto";
    ribbonText.style.height = Math.max(32,ribbonText.scrollHeight + 2) + "px";
    ribbonSave.disabled = !ribbonText.value.trim();
  }

  function showRibbonNotes(slug = null,focus = true) {
    if (!current || (slug === "note-de-chapitre" && !current.chapter)) return;
    closeLinkMenu();
    closeOptions();
    if (!sheet.hidden) showSheet(false);
    ribbonScope = slug;
    ribbonPanel.hidden = false;
    ribbonOpen.setAttribute("aria-expanded","true");
    ribbonChoices.hidden = Boolean(slug);
    ribbonEntry.hidden = !slug;
    if (slug) {
      const name = toolLabels.get(slug);
      const context = notes.get(slug)();
      ribbonText.placeholder = name + "…";
      ribbonText.setAttribute("aria-label",name + " · " + context);
      ribbonText.value = ribbonDrafts.get(ribbonDraftKey(slug)) ?? bookmarkNoteFor(slug)?.text ?? "";
      refreshRibbonEntry();
      if (focus) ribbonText.focus({preventScroll:true});
    } else {
      for (const choice of ribbonChoices.children) {
        choice.hidden = choice.dataset.ribbonNote === "note-de-chapitre" && !current.chapter;
        choice.dataset.saved = String(Boolean(bookmarkNoteFor(choice.dataset.ribbonNote)));
      }
      if (focus) ribbonChoices.firstElementChild.focus({preventScroll:true});
    }
  }

  function saveBookmarkNote(slug,text) {
    if (slug === "note-de-chapitre") {
      const key = current.chapter.key;
      const note = {kind:"note",slug,text};
      persisted[key] = {...persisted[key],note,label:current.chapter.label,position:current.chapter.position,documentRevision:book.documentRevision || ""};
      enqueue({readerAnnotations:{[key]:persisted[key]}});
    } else {
      const existing = bookmarkNoteFor(slug);
      if (existing) existing.text = text;
      else state.annotations.push({kind:"note",slug,text});
      persistPage();
    }
    recordUse("marque-page");
  }

  ribbonOpen.addEventListener("click",() => {
    if (ribbonPanel.hidden) showRibbonNotes();
    else closeRibbonNotes();
  });
  for (const choice of ribbonChoices.children) choice.addEventListener("click",() => showRibbonNotes(choice.dataset.ribbonNote));
  for (const control of bookmarkNoteButtons) control.addEventListener("click",() => showRibbonNotes(control.dataset.bookmarkNote));
  one("[data-ribbon-back]").addEventListener("click",() => showRibbonNotes());
  ribbonText.addEventListener("input",() => {
    if (!ribbonScope) return;
    ribbonDrafts.set(ribbonDraftKey(ribbonScope),ribbonText.value);
    refreshRibbonEntry();
  });
  ribbonEntry.addEventListener("submit",event => {
    event.preventDefault();
    const text = ribbonText.value.trim();
    if (!ribbonScope || !text) return;
    saveBookmarkNote(ribbonScope,text);
    ribbonDrafts.delete(ribbonDraftKey(ribbonScope));
    closeRibbonNotes();
    renderRibbon();
    announce("Note du marque-page enregistrée.");
    ribbonOpen.focus({preventScroll:true});
  });
  reader.addEventListener("pointerdown",event => {
    if (!ribbonPanel.hidden && !ribbonPanel.contains(event.target) && !ribbonOpen.contains(event.target)) closeRibbonNotes();
  });
  ribbonPanel.addEventListener("keydown",event => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    closeRibbonNotes();
    if (ribbonOpen.hidden) toolButtons.get("marque-page").focus({preventScroll:true});
    else ribbonOpen.focus({preventScroll:true});
  });
  arrangeRail(0);

  function setPending(value) {
    pending = value;
    clearTimeout(selectionTimer);
    assist.hidden = !pending || sheet.hidden;
    assist.textContent = pending ? "Sélectionne le passage sur la page." : "";
    if (pending && assist.hidden) announce(assist.textContent);
    for (const [slug,item] of toolButtons) {
      if (slug === "marque-page" || !textTools.has(slug)) continue;
      item.setAttribute("aria-pressed",String(value?.owner === slug));
    }
  }

  function positionSymbolPanel() {
    if (sheet.hidden || view !== "symbol") return;
    const bounds = layout.getBoundingClientRect();
    const anchor = toolButtons.get("symbole").getBoundingClientRect();
    const height = sheet.getBoundingClientRect().height;
    const top = Math.max(4,Math.min(anchor.top - bounds.top,bounds.height - height - 4));
    sheet.style.setProperty("--symbol-top",top + "px");
  }

  function setView(name,focus = false) {
    view = name;
    sheet.dataset.viewing = name;
    for (const section of views) section.hidden = section.dataset.view !== view;
    meaning.hidden = true;
    setPending(null);
    syncChrome();
    positionSymbolPanel();
    if (focus) {
      const control = name === "symbol" ? one('[data-symbol-tab][aria-selected="true"]') : one('[data-view="' + name + '"] [data-back]');
      control?.focus({preventScroll:true});
    }
  }

  function showSheet(open) {
    if (open) {
      closeRibbonNotes();
      closeLinkMenu();
    }
    const restoreFocus = !open && sheet.contains(document.activeElement);
    sheet.hidden = !open;
    if (!open) {
      const target = view === "saved" ? fiche :
        toolButtons.get(bookmarkNoteTypes.has(tool) ? "marque-page" : tool);
      setView("reading");
      if (restoreFocus) target?.focus({preventScroll:true});
    } else syncChrome();
  }

  function openTool(slug) {
    closeRibbonNotes();
    closeLinkMenu();
    if (!sheet.hidden && view !== "saved" && tool === slug && panelViews.has(slug)) {
      showSheet(false);
      return;
    }
    tool = slug;
    selectedRange = currentSelection() || selectedRange;
    if (panelViews.has(slug)) {
      if (panelViews.get(slug) === "editor") openEditor(slug);
      else {
        showSheet(true);
        setView(panelViews.get(slug),true);
      }
      return;
    }
    if (!sheet.hidden) showSheet(false);
    if (view !== "reading") setView("reading");
    if (slug === "marque-page") {
      setPending(null);
      state.bookmarked = !state.bookmarked;
      renderRibbon();
      if (state.bookmarked) recordUse(slug);
      enqueue({bookmarkMap:{[current.key]:state.bookmarked ? true : null}});
      announce(state.bookmarked ? pageLabel() + " marquée." : "Marque-page retiré.");
    } else if (slug === "souligner") {
      armUnderline();
    } else if (textTools.has(slug)) {
      const color = slug === "surligner" ? lastHighlight : undefined;
      arm({kind:textTools.get(slug),owner:slug,color});
    }
  }

  function offsetFor(node,offset) {
    if (!reading.contains(node)) return null;
    const prefix = document.createRange();
    prefix.selectNodeContents(reading);
    prefix.setEnd(node,offset);
    const clone = prefix.cloneContents();
    for (const decoration of clone.querySelectorAll("[data-reading-decoration]")) decoration.remove();
    return clone.textContent.length;
  }
  function currentSelection() {
    const selection = window.getSelection();
    if (!current || !selection?.rangeCount || selection.isCollapsed) return null;
    const range = selection.getRangeAt(0);
    const start = offsetFor(range.startContainer,range.startOffset);
    const end = offsetFor(range.endContainer,range.endOffset);
    return start !== null && end !== null && end > start && quoteFor({start,end}).trim() ? {start,end} : null;
  }
  function quoteFor(range) {
    return sectionTexts.join("").slice(range.start,range.end).replace(/\s+/g," ").trim();
  }
  function contextFor(item) {
    return item.range ? "« " + quoteFor(item.range) + " »" : notes.get(item.slug)?.() || pageLabel();
  }
  function clearSelection() {
    selectedRange = null;
    window.getSelection()?.removeAllRanges();
  }
  function arm(operation) {
    if (!current?.selectable) {
      announce("Le texte de cette page n’est pas sélectionnable.");
      return;
    }
    const range = currentSelection() || selectedRange;
    if (range) applyRange(operation,range);
    else {
      const same = pending?.kind === operation.kind && pending.color === operation.color && pending.line === operation.line;
      setPending(same ? null : operation);
    }
  }

  function armUnderline() {
    arm({kind:"underline",owner:"souligner",color:lastUnderline,line:underlineLine});
  }

  function applyRange(operation,range) {
    if (operation.kind === "highlight" || operation.kind === "underline") {
      applyTextMark(operation,range);
      return;
    }
    state.annotations.push({...operation,range});
    persistPage();
    recordUse(operation.owner);
    announce("Annotation appliquée.");
    clearSelection();
    setPending(null);
    renderText();
    renderFooter();
  }

  function annotationAt(kind,range) {
    return state.annotations.find(item => item.kind === kind &&
      item.range?.start === range.start && item.range?.end === range.end);
  }

  function linkedAnnotation(highlight,kind) {
    if (kind === "favorite" || kind === "citation") return annotationAt(kind,highlight.range) || null;
    return state.annotations.find(item => item.kind === kind && item.highlightId === highlight.id) || null;
  }

  function positionLinkMenu() {
    if (!linkHighlight || root.hidden) return;
    const anchors = [...reading.querySelectorAll('[data-linked-marks~="' + linkHighlight.id + '"]')];
    const rects = anchors.flatMap(anchor => [...anchor.getClientRects()]);
    const anchor = rects.at(-1);
    if (!anchor) return;
    const area = readingColumn.getBoundingClientRect();
    const frame = layout.getBoundingClientRect();
    const {width,height} = linkMenu.getBoundingClientRect();
    const middle = (anchor.left + anchor.right) / 2;
    const gutter = marginReperes.hidden ? 0 : marginReperes.getBoundingClientRect().width;
    const x = Math.min(area.right - width - 5,Math.max(area.left + gutter + 5,middle - width / 2));
    const tip = Math.max(8,Math.min(middle - x - 4,width - 15));
    linkMenu.style.setProperty("--link-x",x - frame.left + "px");
    const y = anchor.bottom - frame.top + 6;
    linkMenu.style.setProperty("--link-y",y + "px");
    linkMenu.style.setProperty("--link-tip",tip + "px");
    const reserved = Number.parseFloat(layout.style.getPropertyValue("--link-room")) || 0;
    const needed = Math.max(0,Math.ceil(y + height + 5 - frame.height + reserved));
    layout.style.setProperty("--link-room",needed + "px");
  }

  const linkActions = [
    {selector:"[data-link-note]",kind:"note",owner:"note-de-passage",add:"Ajouter une note",linked:"Modifier la note"},
    {selector:"[data-link-repere]",kind:"tag",owner:"etiquette-personnalisee",add:"Ajouter un repère",linked:"Modifier le repère"},
    {selector:"[data-link-favorite]",kind:"favorite",owner:"passage-favori",add:"Associer un passage favori",linked:"Passage favori associé"},
    {selector:"[data-link-citation]",kind:"citation",owner:"citation",add:"Associer une citation",linked:"Citation associée"}
  ];

  function showLinkMenu(highlight) {
    closeRibbonNotes();
    if (linkHighlight !== highlight) collapseLinkEntry();
    linkHighlight = highlight;
    linkMenu.setAttribute("aria-label",highlight.kind === "underline" ?
      "Associer au passage souligné" : "Associer au passage surligné");
    for (const {selector,kind,add,linked} of linkActions) {
      const control = one(selector);
      const associated = Boolean(linkedAnnotation(highlight,kind));
      control.dataset.linked = String(associated);
      control.setAttribute("aria-label",associated ? linked : add);
    }
    linkMenu.hidden = false;
    positionLinkMenu();
  }

  function collapseLinkEntry() {
    activeLinkEntry = null;
    linkEntry.hidden = true;
    linkShortcuts.hidden = false;
    setRepereOptionsOpen(false);
    one("[data-link-note]").setAttribute("aria-expanded","false");
    one("[data-link-repere]").setAttribute("aria-expanded","false");
  }

  function closeLinkMenu() {
    if (linkMenu.hidden) return;
    collapseLinkEntry();
    linkMenu.hidden = true;
    linkHighlight = null;
    layout.style.removeProperty("--link-room");
  }

  function repereKey(value) {
    return value.trim().normalize("NFC").replace(/\s+/g," ").toLocaleLowerCase("fr");
  }

  function readRepereForm() {
    return {type:repereType,custom:repereType === "autre" ? repereCustom.value.trim() : "",
      choice:repereChoice,name:repereName.value.trim(),step:repereStep};
  }

  function reperesForType(type,custom) {
    return repereCatalog.filter(item => item.type === type &&
      repereKey(item.custom) === repereKey(custom));
  }

  function renderRepereChoices(choice = "",name = "") {
    const {type,custom} = readRepereForm();
    const ready = Boolean(type && (type !== "autre" || custom));
    matchingReperes = ready ? reperesForType(type,custom) : [];
    repereChoice = "";
    if (ready && (!matchingReperes.length || choice === "new")) repereChoice = "new";
    else if (matchingReperes.some(repere => repere.id === choice)) repereChoice = choice;
    repereName.value = name;
    repereName.placeholder = reperePlaceholders[type] || "Nom du repère";
    repereName.setAttribute("aria-label",repereName.placeholder);
  }

  function stepAfterType() {
    const {type,custom,choice} = readRepereForm();
    if (!type) return "type";
    if (type === "autre" && !custom) return "custom";
    return choice === "new" ? "name" : "choice";
  }

  function repereField() {
    if (repereStep === "name") return repereName;
    if (repereStep === "custom") return repereCustom;
    return repereTrigger;
  }

  function setRepereOptionsOpen(open) {
    repereOptions.hidden = !open;
    repereTrigger.setAttribute("aria-expanded",String(open));
  }

  function repereEmblem(symbol) {
    let emblem;
    if (symbolNames.has(symbol)) emblem = symbolArt(symbol);
    else if (symbol === "etiquette-personnalisee") emblem = art(symbol);
    else {
      emblem = document.createElement("i");
      emblem.dataset.lucide = symbol;
      emblem.setAttribute("aria-hidden","true");
    }
    emblem.classList.add("repere-emblem");
    return emblem;
  }

  function paintRepereEmblems() {
    globalThis.lucide?.createIcons();
  }

  function showRepereSelection() {
    const choosingType = repereStep === "type";
    const caption = choosingType ? "Type de repère" : "Choisir un repère";
    const selected = choosingType ? repereType : repereChoice;
    let name = "";
    for (const option of repereOptions.children) {
      const isSelected = option.dataset.repereValue === selected;
      option.setAttribute("aria-pressed",String(isSelected));
      option.querySelector(".entry-check").hidden = !isSelected;
      if (isSelected) name = option.querySelector("[data-repere-option-label]").textContent;
    }
    repereTriggerLabel.textContent = name || caption;
    repereTrigger.setAttribute("aria-label",name ? caption + " · " + name : caption);
  }

  function updateReperePicker() {
    const choosingType = repereStep === "type";
    const options = choosingType ? [...repereLabels] :
      [...matchingReperes.map(repere => [repere.id,repere.name,repere.symbol]),["new","Créer un repère…"]];
    repereOptions.setAttribute("aria-label",choosingType ? "Types de repère" : "Repères du livre");
    repereOptions.replaceChildren(...options.map(([value,label,symbol]) => {
      const option = button("","repere-option");
      option.dataset.repereValue = value;
      const check = span("entry-check");
      check.setAttribute("aria-hidden","true");
      const title = span("repere-option-label",label);
      title.setAttribute("data-repere-option-label","");
      if (symbol) option.append(repereEmblem(symbol));
      option.append(title,check);
      option.addEventListener("click",() => {
        if (choosingType) {
          repereType = value;
          repereCustom.value = "";
          renderRepereChoices();
          setRepereStep(stepAfterType(),true);
        } else {
          repereChoice = value;
          if (value === "new") setRepereStep("name",true);
          else showRepereSelection();
        }
        rememberLinkDraft();
      });
      return option;
    }));
    showRepereSelection();
    if (!choosingType) paintRepereEmblems();
  }

  function setRepereStep(step,focus = false) {
    repereStep = step;
    setRepereOptionsOpen(false);
    reperePicker.hidden = step !== "type" && step !== "choice";
    repereCustom.hidden = step !== "custom";
    repereName.hidden = step !== "name";
    if (!reperePicker.hidden) updateReperePicker();
    linkBack.setAttribute("aria-label",step === "type" ? "Retour aux quatre actions" : "Revenir au choix précédent");
    if (focus) repereField().focus({preventScroll:true});
  }

  function findRepere(choice) {
    if (!choice) return null;
    return repereCatalog.find(item => item.id === choice) || null;
  }

  function repereDescription(item) {
    const repere = findRepere(item.repereId);
    if (!repere) return item.text;
    return (repere.custom || repereLabels.get(repere.type)) + " · " + repere.name;
  }

  function refreshLinkEntry() {
    if (!activeLinkEntry) return;
    let mode = "save";
    if (activeLinkEntry.kind === "note") {
      inlineNote.style.height = "auto";
      inlineNote.style.height = Math.max(32,inlineNote.scrollHeight + 2) + "px";
      linkSave.disabled = !inlineNote.value.trim();
    } else {
      const {type,custom,choice,name} = readRepereForm();
      const ready = Boolean(type && (type !== "autre" || custom));
      if (repereStep === "type") {
        mode = type ? "next" : "choice";
        linkSave.disabled = !type;
      } else if (repereStep === "custom") {
        mode = "next";
        linkSave.disabled = !custom;
      } else {
        linkSave.disabled = !ready || !(repereStep === "name" ? name : findRepere(choice));
      }
    }
    linkSave.dataset.mode = mode;
    linkSave.setAttribute("aria-label",mode === "next" ? "Suivant" : "Enregistrer");
    linkCheck.hidden = mode === "next";
    linkNext.hidden = mode !== "next";
    positionLinkMenu();
  }

  function openLinkEntry(action) {
    const wasOpen = activeLinkEntry === action;
    collapseLinkEntry();
    if (wasOpen) {
      positionLinkMenu();
      return;
    }
    activeLinkEntry = action;
    linkShortcuts.hidden = true;
    linkEntry.hidden = false;
    one(action.selector).setAttribute("aria-expanded","true");
    const isNote = action.kind === "note";
    inlineNote.hidden = !isNote;
    repereFields.hidden = isNote;
    const previous = linkedAnnotation(linkHighlight,action.kind);
    const draft = linkDrafts.get(linkHighlight)?.[action.kind];
    if (isNote) {
      inlineNote.value = draft ?? previous?.text ?? "";
      linkBack.setAttribute("aria-label","Retour aux quatre actions");
    } else {
      const repere = findRepere(previous?.repereId);
      const initial = draft || (repere && {type:repere.type,custom:repere.custom,choice:repere.id}) ||
        (previous && {type:"autre",custom:"Repère",choice:"new",name:previous.text}) || {};
      repereType = initial.type || "";
      repereCustom.value = initial.custom || "";
      renderRepereChoices(initial.choice,initial.name);
      setRepereStep(initial.step || stepAfterType());
    }
    refreshLinkEntry();
    const field = isNote ? inlineNote : repereField();
    field.focus({preventScroll:true});
  }

  function rememberLinkDraft() {
    if (!activeLinkEntry || !linkHighlight) return;
    const drafts = linkDrafts.get(linkHighlight) || {};
    drafts[activeLinkEntry.kind] = activeLinkEntry.kind === "note" ? inlineNote.value : readRepereForm();
    linkDrafts.set(linkHighlight,drafts);
    refreshLinkEntry();
  }

  inlineNote.addEventListener("input",rememberLinkDraft);
  repereName.addEventListener("input",rememberLinkDraft);
  repereCustom.addEventListener("input",() => {
    renderRepereChoices();
    rememberLinkDraft();
  });
  repereTrigger.addEventListener("click",() => {
    setRepereOptionsOpen(repereOptions.hidden);
    positionLinkMenu();
  });
  reperePicker.addEventListener("keydown",event => {
    if (event.key === "Escape" && !repereOptions.hidden) {
      event.preventDefault();
      event.stopPropagation();
      setRepereOptionsOpen(false);
      positionLinkMenu();
      repereTrigger.focus({preventScroll:true});
      return;
    }
    if (!["ArrowDown","ArrowUp","Home","End"].includes(event.key)) return;
    const choices = [...repereOptions.children];
    if (!choices.length) return;
    event.preventDefault();
    if (repereOptions.hidden) {
      setRepereOptionsOpen(true);
      positionLinkMenu();
    }
    const index = choices.indexOf(document.activeElement);
    const next = {
      ArrowDown:(index + 1) % choices.length,
      ArrowUp:index <= 0 ? choices.length - 1 : index - 1,
      Home:0,End:choices.length - 1
    }[event.key];
    choices[next].focus();
  });

  linkBack.addEventListener("click",() => {
    if (!activeLinkEntry) return;
    if (activeLinkEntry.kind === "tag" && repereStep !== "type") {
      if (repereStep === "name" && matchingReperes.length) {
        repereChoice = "";
        setRepereStep("choice",true);
      } else if (repereType === "autre" && repereStep !== "custom") {
        setRepereStep("custom",true);
      } else {
        setRepereStep("type",true);
      }
      rememberLinkDraft();
      return;
    }
    const action = activeLinkEntry;
    collapseLinkEntry();
    positionLinkMenu();
    one(action.selector).focus({preventScroll:true});
  });

  linkEntry.addEventListener("submit",event => {
    event.preventDefault();
    if (!linkHighlight || !activeLinkEntry || linkEntry.hidden) return;
    const {kind,owner} = activeLinkEntry;
    if (linkSave.disabled) return;
    if (kind === "tag" && (repereStep === "type" || repereStep === "custom")) {
      setRepereStep(stepAfterType(),true);
      rememberLinkDraft();
      return;
    }
    let text = inlineNote.value.trim();
    let repereId;
    if (kind === "tag") {
      const {type,custom,choice,name} = readRepereForm();
      let repere = findRepere(choice);
      if (choice === "new") {
        repere = reperesForType(type,custom).find(item => repereKey(item.name) === repereKey(name));
        if (!repere) {
          repere = {id:newId(),type,custom,name,symbol:repereSymbols[type]};
          repereCatalog.push(repere);
        }
      }
      if (!repere) return;
      text = repere.name;
      repereId = repere.id;
    }
    const highlight = linkHighlight;
    const existing = linkedAnnotation(highlight,kind);
    if (existing) {
      existing.text = text;
      if (repereId) existing.repereId = repereId;
    } else {
      state.annotations.push({kind,slug:owner,text,range:highlight.range,highlightId:highlight.id,repereId});
      recordUse(owner);
    }
    persistPage(repereId ? {readerReperes:{[repereId]:findRepere(repereId)}} : {});
    const drafts = linkDrafts.get(highlight);
    if (drafts) delete drafts[kind];
    closeLinkMenu();
    renderText();
    renderFooter();
    renderPageAnnotations();
    announce(kind === "note" ? "Note enregistrée sur ce passage." : "Repère enregistré sur ce passage.");
    toolButtons.get(highlight.owner).focus({preventScroll:true});
  });

  function associatePassage(highlight,kind,owner) {
    let annotation = annotationAt(kind,highlight.range);
    if (!annotation) {
      annotation = {kind,owner,range:highlight.range};
      state.annotations.push(annotation);
      recordUse(owner);
    }
    annotation.highlightId = highlight.id;
    persistPage();
    closeLinkMenu();
    renderText();
    renderFooter();
    if (!sheet.hidden && view === "saved") renderSaved();
    announce(kind === "citation" ? "Citation associée." : "Passage favori associé.");
  }

  for (const action of linkActions) {
    one(action.selector).addEventListener("click",() => {
      if (!linkHighlight) return;
      if (action.kind === "note" || action.kind === "tag") openLinkEntry(action);
      else associatePassage(linkHighlight,action.kind,action.owner);
    });
  }
  reader.addEventListener("pointerdown",event => {
    if (activeLinkEntry?.kind === "tag") return;
    if (!linkMenu.hidden && !linkMenu.contains(event.target) && !event.target.closest("[data-linked-mark]")) closeLinkMenu();
  });
  reader.addEventListener("keydown",event => {
    if (event.key === "Escape" && !linkMenu.hidden) {
      const owner = linkHighlight.owner;
      closeLinkMenu();
      toolButtons.get(owner).focus({preventScroll:true});
    }
  });
  reading.addEventListener("click",event => {
    if (activeLinkEntry?.kind === "tag") return;
    const id = event.target.closest("[data-linked-mark]")?.dataset.linkedMark;
    if (!id || currentSelection() || !sheet.hidden) return;
    const highlight = state.annotations.find(item => String(item.id) === id);
    if (!highlight) return;
    if (pending) applyRange(pending,highlight.range);
    else showLinkMenu(highlight);
  });

  function applyTextMark(operation,range) {
    let mark = annotationAt(operation.kind,range);
    const changed = !mark || mark.color !== operation.color || mark.line !== operation.line;
    if (mark) {
      mark.color = operation.color;
      mark.line = operation.line;
      mark.id ??= newId();
    } else {
      mark = {...operation,range,id:newId()};
      state.annotations.push(mark);
    }
    if (changed) recordUse(operation.owner);
    persistPage();
    clearSelection();
    setPending(null);
    renderText();
    renderFooter();
    showLinkMenu(mark);
    const result = operation.kind === "underline" ? "Passage souligné." : "Passage surligné.";
    announce(result + " Les options d’association sont disponibles.");
  }

  document.addEventListener("selectionchange",() => {
    if (root.hidden || !current) return;
    const range = currentSelection();
    if (!range) {
      if (pending) clearTimeout(selectionTimer);
      return;
    }
    selectedRange = range;
    if (!sheet.hidden && view === "editor" && !editedAnnotation) refreshEditor();
    if (pending) {
      clearTimeout(selectionTimer);
      selectionTimer = setTimeout(() => {
        const ready = currentSelection();
        if (!root.hidden && pending && ready) applyRange(pending,ready);
      },650);
    }
  },{signal});
  reading.addEventListener("pointerdown",event => {
    if (event.target.closest(".inline-symbol")) return;
    pageMeaning.hidden = true;
    selectedRange = null;
    if (!sheet.hidden && view === "editor" && !editedAnnotation) refreshEditor();
  });
  sheet.addEventListener("pointerdown",() => { selectedRange = currentSelection() || selectedRange; });
  rail.addEventListener("pointerdown",() => { selectedRange = currentSelection() || selectedRange; });
  fiche.addEventListener("click",() => {
    if (!options.hidden) closeOptions();
    if (!sheet.hidden && view === "saved") {
      showSheet(false);
      return;
    }
    setView("saved");
    renderSaved();
    showSheet(true);
  });
  for (const back of all("[data-back]")) back.addEventListener("click",() => {
    showSheet(false);
    toolButtons.get(tool)?.focus({preventScroll:true});
  });
  for (const choice of lineChoices) choice.addEventListener("click",() => {
    underlineLine = choice.dataset.line;
    saveProfile();
    closeOptions(true);
    armUnderline();
  });

  function makeSymbol(glyph,className,origin) {
    const item = button("",className + " symbol-button");
    item.setAttribute("aria-label",symbolNames.get(glyph));
    item.append(symbolArt(glyph));
    wireSymbol(item,glyph,origin);
    return item;
  }
  function showMeaning(glyph) {
    const label = symbolNames.get(glyph);
    announce(label);
    if (!sheet.hidden && view === "symbol") {
      meaning.textContent = label;
      meaning.hidden = false;
      positionSymbolPanel();
    } else {
      pageMeaning.textContent = label;
      pageMeaning.hidden = false;
    }
  }
  function wordAt(clientX,clientY) {
    const at = document.caretPositionFromPoint?.(clientX,clientY);
    const legacy = at ? null : document.caretRangeFromPoint?.(clientX,clientY);
    if (!at && !legacy) return null;
    const node = at?.offsetNode || legacy.startContainer;
    const offset = at?.offset ?? legacy.startOffset;
    const absolute = offsetFor(node,offset);
    const run = offsets.findIndex((start,index) => absolute >= start && absolute < offsets[index+1]);
    if (absolute === null || run < 0) return null;
    const startOffset = offsets[run];
    const local = absolute - startOffset;
    const text = sectionTexts[run];
    for (const match of text.matchAll(/[\p{L}\p{N}’'-]+/gu)) {
      if (match.index <= local && local <= match.index + match[0].length) {
        return {start:startOffset + match.index,end:startOffset + match.index + match[0].length};
      }
    }
    return null;
  }
  function placeSymbol(glyph,clientX,clientY,origin) {
    const bounds = page.getBoundingClientRect();
    const inPage = bounds.width && bounds.height && clientX >= bounds.left && clientX <= bounds.right &&
      clientY >= bounds.top && clientY <= bounds.bottom;
    const range = currentSelection() || selectedRange || (inPage ? wordAt(clientX,clientY) : null);
    if (!range && !inPage) return;
    if (origin) {
      const collection = origin.range ? state.annotations : state.placement;
      const index = collection.indexOf(origin);
      if (index >= 0) collection.splice(index,1);
    }
    if (range) state.annotations.push({kind:"symbol",glyph,range});
    else state.placement.push({glyph,x:(clientX - bounds.left)/bounds.width,y:(clientY - bounds.top)/bounds.height});
    clearSelection();
    persistPage();
    renderText();
    if (!origin) {
      recordUse("symbole");
      if (view === "symbol") {
        meaning.hidden = true;
        positionSymbolPanel();
      }
    }
    announce("Symbole placé.");
  }
  function wireSymbol(item,glyph,origin) {
    let gesture = null;
    let timer;
    let suppressUntil = -Infinity;
    function moveGhost(x,y) {
      const bounds = reader.getBoundingClientRect();
      ghost.style.left = (x - bounds.left) + "px";
      ghost.style.top = (y - bounds.top) + "px";
    }
    function stop() {
      clearTimeout(timer);
      ghost.hidden = true;
      gesture = null;
    }
    item.addEventListener("click",event => {
      if (event.detail > 0 && performance.now() < suppressUntil) return;
      showMeaning(glyph);
    });
    item.addEventListener("pointerdown",event => {
      if (event.button !== 0 || event.isPrimary === false) return;
      gesture = {id:event.pointerId,held:false,x:event.clientX,y:event.clientY};
      item.setPointerCapture?.(event.pointerId);
      timer = setTimeout(() => {
        if (!gesture) return;
        gesture.held = true;
        ghost.replaceChildren(symbolArt(glyph));
        moveGhost(gesture.x,gesture.y);
        ghost.hidden = false;
      },420);
    });
    item.addEventListener("pointermove",event => {
      if (gesture?.id !== event.pointerId) return;
      gesture.x = event.clientX;
      gesture.y = event.clientY;
      if (gesture.held) moveGhost(gesture.x,gesture.y);
    });
    item.addEventListener("pointerup",event => {
      if (gesture?.id !== event.pointerId) return;
      if (gesture.held) {
        suppressUntil = performance.now() + 500;
        placeSymbol(glyph,event.clientX,event.clientY,origin);
      }
      stop();
    });
    item.addEventListener("pointercancel",stop);
    item.addEventListener("lostpointercapture",stop);
  }
  const symbolTabs = all("[data-symbol-tab]");
  const symbolGrids = all("[data-symbol-grid]");
  for (const [index,[glyph]] of symbols.entries()) {
    const grid = symbolGrids[index < 5 ? 0 : 1];
    grid.append(makeSymbol(glyph,"symbol-picker"));
  }

  function selectSymbolTab(tab) {
    if (tab.getAttribute("aria-selected") === "true") return;
    for (const item of symbolTabs) item.setAttribute("aria-selected",String(item === tab));
    for (const grid of symbolGrids) grid.hidden = grid.dataset.symbolGrid !== tab.dataset.symbolTab;
    meaning.hidden = true;
    positionSymbolPanel();
  }

  for (const tab of symbolTabs) tab.addEventListener("click",() => selectSymbolTab(tab));
  one("[data-symbol-tabs]").addEventListener("keydown",event => {
    const index = symbolTabs.indexOf(event.target);
    if (index < 0) return;
    const direction = {ArrowLeft:1 - index,ArrowRight:1 - index,Home:0,End:1};
    if (!Object.hasOwn(direction,event.key)) return;
    event.preventDefault();
    const tab = symbolTabs[direction[event.key]];
    selectSymbolTab(tab);
    tab.focus();
  });

  function renderText() {
    const marks = state.annotations.filter(item => item.range);
    sections.forEach(({slot},index) => {
      const offset = offsets[index];
      const end = offsets[index + 1];
      const overlapping = marks.filter(item => item.range.start < end && item.range.end > offset);
      const cuts = new Set([offset,end]);
      for (const {range} of overlapping) {
        cuts.add(Math.max(offset,range.start));
        cuts.add(Math.min(end,range.end));
      }
      const points = [...cuts].sort((a,b) => a - b);
      const fragment = document.createDocumentFragment();
      points.slice(1).forEach((to,piece) => {
        const from = points[piece];
        const text = sectionTexts[index].slice(from - offset,to - offset);
        const applicable = overlapping.filter(item => item.range.start <= from && item.range.end >= to);
        if (!applicable.length) {
          fragment.append(text);
          return;
        }
        const part = span("text-mark",text);
        const inkMarks = applicable.filter(item => ["highlight","favorite","circle","margin","tag"].includes(item.kind));
        for (const item of inkMarks) part.classList.add("marked-" + item.kind);
        const highlight = inkMarks.findLast(item => item.kind === "highlight");
        if (highlight?.color) part.style.setProperty("--mark-color",highlight.color);
        const linked = applicable.filter(item => item.id !== undefined &&
          (item.kind === "highlight" || item.kind === "underline"));
        if (linked.length) {
          part.dataset.textFrom = from;
          part.dataset.textTo = to;
          part.dataset.linkedMark = linked.at(-1).id;
          part.dataset.linkedMarks = linked.map(item => item.id).join(" ");
          part.classList.add("cursor-interaction");
        }
        const underline = applicable.findLast(item => item.kind === "underline");
        const cited = applicable.some(item => item.kind === "citation");
        if (underline || cited) {
          const style = underline ? underline.line || "simple" : "dotted";
          part.classList.add("marked-underline","marked-" + style);
          if (underline) {
            part.classList.add("underline-ink");
            part.style.setProperty("--line-color",underline.color || "var(--line-default)");
          }
          if (cited && underline && style !== "dotted") {
            part.replaceChildren(span("marked-underline marked-dotted citation-on-line",text));
          }
        }
        fragment.append(part);
        for (const item of applicable.filter(item => item.range.end === to)) {
          if (item.kind === "favorite") {
            const heart = art("passage-favori");
            heart.classList.add("favorite-heart");
            heart.dataset.readingDecoration = "";
            fragment.append(heart);
          }
          if (item.kind === "symbol") {
            const symbol = makeSymbol(item.glyph,"inline-symbol",item);
            symbol.dataset.readingDecoration = "";
            fragment.append(symbol);
          }
        }
      });
      slot.replaceChildren(fragment);
    });
    const layer = one("[data-free-symbols]");
    layer.replaceChildren(...state.placement.map(item => {
      const marker = makeSymbol(item.glyph,"free-symbol",item);
      marker.style.left = (item.x * 100) + "%";
      marker.style.top = (item.y * 100) + "%";
      return marker;
    }));
    renderMarginReperes();
  }

  function positionMarginReperes() {
    if (marginReperes.hidden || root.hidden) return;
    const bounds = page.getBoundingClientRect();
    const fragments = [...reading.querySelectorAll("[data-text-from]")];
    const positions = [...marginReperes.children].map(marker => {
      const start = Number(marker.dataset.marginStart);
      const fragment = fragments.find(mark => Number(mark.dataset.textFrom) <= start &&
        Number(mark.dataset.textTo) > start);
      const paragraphIndex = offsets.findIndex((offset,index) => start >= offset && start < offsets[index + 1]);
      const anchor = fragment?.getClientRects()[0] || sections[paragraphIndex]?.slot.parentElement?.getBoundingClientRect();
      return {marker,top:Math.max(0,(anchor?.top ?? bounds.top) - bounds.top - 7)};
    });
    positions.sort((a,b) => a.top - b.top);
    let nextTop = 0;
    for (const {marker,top} of positions) {
      const placed = Math.max(top,nextTop);
      marker.style.top = placed + "px";
      nextTop = placed + Math.max(marker.getBoundingClientRect().height,44) + 3;
    }
    const reserved = parseFloat(page.style.getPropertyValue("--repere-margin-room")) || 0;
    const needed = Math.max(0,Math.ceil(nextTop + 5 - bounds.height + reserved));
    page.style.setProperty("--repere-margin-room",needed + "px");
  }

  function renderMarginReperes() {
    const markers = state.annotations.filter(item => item.kind === "tag" && item.range && item.repereId)
      .map(item => ({item,repere:findRepere(item.repereId)})).filter(({repere}) => repere);
    page.toggleAttribute("data-with-margin-reperes",Boolean(markers.length));
    marginReperes.hidden = !markers.length;
    marginReperes.replaceChildren(...markers.map(({item,repere}) => {
      const marker = button("","margin-repere");
      marker.dataset.marginRepere = item.repereId;
      marker.dataset.marginStart = item.range.start;
      const label = repereDescription(item);
      marker.setAttribute("aria-label",label);
      marker.setAttribute("data-tooltip",label);
      marker.append(repereEmblem(repere.symbol),span("margin-repere-label",repere.name));
      marker.addEventListener("click",() => {
        if (activeLinkEntry?.kind === "tag") return;
        const highlight = state.annotations.find(entry => entry.id === item.highlightId);
        if (!highlight) return;
        if (!options.hidden) closeOptions();
        if (!sheet.hidden) showSheet(false);
        showLinkMenu(highlight);
        openLinkEntry(linkActions.find(action => action.kind === "tag"));
      });
      return marker;
    }));
    page.style.removeProperty("--repere-margin-room");
    if (markers.length) paintRepereEmblems();
    positionMarginReperes();
  }

  function target() {
    return editor.querySelector('input[name="edp-all-target"]:checked')?.value || "";
  }
  function openEditor(slug,item = null) {
    currentEditor = slug;
    editedAnnotation = item;
    tool = slug;
    editor.reset();
    one("[data-editor-title]").textContent = toolLabels.get(slug);
    one("[data-attachment]").hidden = Boolean(item);
    one("[data-tag-entry]").hidden = false;
    tagName.value = item?.text || "";
    save.textContent = item ? "Enregistrer" : "Ajouter";
    showSheet(true);
    setView("editor",true);
    refreshEditor();
  }
  function refreshEditor() {
    if (view !== "editor") return;
    const needsPassage = target() === "passage";
    const range = editedAnnotation ? editedAnnotation.range : needsPassage ? selectedRange : null;
    const excerpt = range ? quoteFor(range) : "";
    const label = needsPassage && !excerpt ? (current.selectable ? "Sélectionne le passage sur la page." : "Le texte de cette page n’est pas sélectionnable.") : pageLabel();
    one("[data-anchor]").hidden = false;
    one("[data-anchor-label]").hidden = Boolean(excerpt);
    one("[data-anchor-label]").textContent = label;
    one("[data-anchor-quote]").hidden = !excerpt;
    one("[data-anchor-quote]").textContent = excerpt;
    save.disabled = !(editedAnnotation || target()) || (needsPassage && !excerpt) || !tagName.value.trim();
  }
  editor.addEventListener("change",event => {
    if (event.target.name !== "edp-all-target") return;
    selectedRange = currentSelection() || selectedRange;
    refreshEditor();
  });
  tagName.addEventListener("input",refreshEditor);
  editor.addEventListener("submit",event => {
    event.preventDefault();
    if (save.disabled) return;
    const value = tagName.value.trim();
    if (editedAnnotation) editedAnnotation.text = value;
    else {
      const range = target() === "passage" ? selectedRange : null;
      state.annotations.push({kind:"tag",slug:currentEditor,text:value,range});
      recordUse(currentEditor);
    }
    persistPage();
    announce(editedAnnotation ? "Étiquette modifiée." : "Étiquette enregistrée.");
    clearSelection();
    showSheet(false);
    renderText();
    renderFooter();
  });

  function renderPageAnnotations() {
    const container = one("[data-page-annotations]");
    const notes = state.annotations.filter(item => item.kind === "note" && item.highlightId);
    container.hidden = !notes.length;
    container.replaceChildren(...notes.map(item => {
      const control = button("","plain-button");
      control.append(art(item.slug),span("","Note"));
      control.addEventListener("click",() => {
        const mark = state.annotations.find(annotation => annotation.id === item.highlightId);
        if (mark) {
          showLinkMenu(mark);
          openLinkEntry(linkActions.find(action => action.kind === "note"));
        }
      });
      return control;
    }));
  }

  function annotationName(item) {
    const lineNames = {simple:"Soulignement",double:"Soulignement double",dotted:"Soulignement pointillé"};
    const labels = {symbol:"Symbole",highlight:"Surlignage",underline:lineNames[item.line || "simple"]};
    return labels[item.kind] || (item.repereId ? "Repère personnalisé" : toolLabels.get(item.slug || item.owner));
  }

  function renderSaved() {
    const rows = [];
    const savedPages = new Map(Object.entries(persisted));
    for (const key of Object.keys(book.bookmarkMap || {})) {
      if (!key.startsWith(current.key.split("-")[0] + "-") || !book.bookmarkMap[key]) continue;
      const number = Number(key.slice(key.indexOf("-")+1));
      if (number < 1 || number > current.count) continue;
      const page = persisted[key] || {label:current.unitLabel + " " + number,position:number-1};
      rows.push({icon:"marque-page",label:"Marque-page",copy:page.label,page});
    }
    for (const page of savedPages.values()) {
      for (const item of [...(page.annotations || []),...(page.note ? [page.note] : []),...(page.placement || []).map(item => ({...item,kind:"symbol"}))]) {
        if (savedFilter !== "all" && savedFilter !== item.kind) continue;
        const icon = item.repereId ? "etiquette-personnalisee" : item.slug || item.owner || "symbole";
        const copy = [item.glyph ? symbolNames.get(item.glyph) : "",item.text,item.quote,page.label].filter(Boolean).join(" · ");
        rows.push({icon,label:annotationName(item),copy,page,item});
      }
    }
    const visible = savedFilter === "all" ? rows : rows.filter(row => row.item?.kind === savedFilter);
    const list = one("[data-saved-list]");
    one("[data-saved-empty]").hidden = Boolean(visible.length);
    list.hidden = !visible.length;
    visible.sort((first,second) => first.page.position - second.page.position);
    list.replaceChildren(...visible.map(({icon,label,copy,page,item}) => {
      const element = document.createElement("li");
      const action = button("","saved-jump");
      const title = document.createElement("strong");
      title.textContent = label;
      action.append(title,span("",copy));
      action.addEventListener("click", async () => {
        showSheet(false);
        if (page.position !== current.position) await navigate(page.position);
        if (signal.aborted || page.position !== current?.position) return;
        const id = item?.highlightId || item?.id;
        const mark = state.annotations.find(candidate => candidate.id === id);
        if (mark) {
          const anchor = reading.querySelector('[data-linked-marks~="' + CSS.escape(String(id)) + '"]');
          anchor?.scrollIntoView?.({block:"center"});
          showLinkMenu(mark);
        } else if (item && bookmarkNoteTypes.has(item.slug)) showRibbonNotes(item.slug);
        else if (item?.kind === "tag") showTag(state.annotations.find(candidate => candidate.text === item.text && candidate.kind === "tag"));
      });
      element.append(art(icon),action);
      return element;
    }));
  }
  for (const tab of all("[data-saved-filter]")) tab.addEventListener("click",() => {
    savedFilter = tab.dataset.savedFilter;
    for (const item of all("[data-saved-filter]")) item.setAttribute("aria-pressed",String(item === tab));
    renderSaved();
  });

  function footerTags() {
    return state.annotations.filter(item => item.kind === "tag" && !item.repereId);
  }

  function showTag(item) {
    activeTag = item;
    one("[data-tag-detail]").hidden = !item;
    if (item) one("[data-tag-context]").textContent = contextFor(item);
    tagTrack.querySelectorAll("button").forEach((chip,index) => {
      chip.setAttribute("aria-expanded",String(footerTags()[index] === item));
    });
  }
  function renderFooter() {
    const tags = footerTags();
    one("[data-page-foot]").hidden = !tags.length;
    one("[data-tags-foot]").hidden = !tags.length;
    const x = tagTrack.scrollLeft;
    tagTrack.replaceChildren(...tags.map(item => {
      const chip = button("","tag-chip");
      const label = span("");
      label.append(art(item.slug),span("one-line",repereDescription(item)));
      chip.append(label);
      chip.addEventListener("click",() => showTag(activeTag === item ? null : item));
      return chip;
    }));
    tagTrack.scrollLeft = x;
    showTag(activeTag);
  }
  one("[data-edit-tag]").addEventListener("click",() => {
    if (!activeTag) return;
    const highlight = state.annotations.find(item => item.id === activeTag.highlightId);
    if (highlight) {
      showLinkMenu(highlight);
      openLinkEntry(linkActions.find(action => action.kind === "tag"));
      linkMenu.scrollIntoView?.({block:"nearest",inline:"nearest"});
    } else {
      openEditor(activeTag.slug,activeTag);
    }
  });

  function wireScroll(track,vertical = false) {
    let drag = null;
    let lastDrag = -Infinity;
    track.addEventListener("pointerdown",event => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      drag = {id:event.pointerId,start:vertical ? event.clientY : event.clientX,scroll:vertical ? track.scrollTop : track.scrollLeft,active:false};
      lastDrag = -Infinity;
    });
    track.addEventListener("pointermove",event => {
      if (!drag || drag.id !== event.pointerId) return;
      const delta = (vertical ? event.clientY : event.clientX) - drag.start;
      if (!drag.active && Math.abs(delta) < 7) return;
      if (!drag.active) {
        drag.active = true;
        track.dataset.dragging = "";
        track.setPointerCapture?.(event.pointerId);
      }
      event.preventDefault();
      if (vertical) track.scrollTop = drag.scroll - delta;
      else track.scrollLeft = drag.scroll - delta;
    });
    function release(event) {
      if (!drag || drag.id !== event.pointerId) return;
      if (drag.active) lastDrag = performance.now();
      drag = null;
      delete track.dataset.dragging;
    }
    for (const event of ["pointerup","pointercancel","lostpointercapture"]) track.addEventListener(event,release);
    track.addEventListener("pointerleave",event => { if (drag && !drag.active) release(event); });
    track.addEventListener("click",event => {
      if (event.detail <= 0 || performance.now() - lastDrag >= 450) return;
      event.preventDefault();
      event.stopPropagation();
    },true);
    if (vertical) return;
    track.addEventListener("keydown",event => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const current = event.target.closest("button");
      const next = event.key === "ArrowRight" ? current?.nextElementSibling : current?.previousElementSibling;
      if (!next) return;
      event.preventDefault();
      next.focus();
    });
  }
  wireScroll(tagTrack);

  const grip = one("[data-close]");
  let gripStart = null;
  grip.addEventListener("click",() => showSheet(false));
  grip.addEventListener("pointerdown",event => {
    if (event.button !== 0) return;
    gripStart = event.clientY;
    grip.setPointerCapture?.(event.pointerId);
  });
  grip.addEventListener("pointerup",event => {
    if (gripStart !== null && event.clientY > gripStart + 28) showSheet(false);
    gripStart = null;
  });
  grip.addEventListener("pointercancel",() => { gripStart = null; });
  sheet.addEventListener("keydown",event => {
    if (event.key === "Escape") showSheet(false);
  });

  function enqueue(changes) {
    const payload = JSON.parse(JSON.stringify(changes));
    writeQueue = writeQueue.then(async () => {
      const saved = await saveBook(payload);
      if (signal.aborted) return;
      if (!saved) announce("L’enregistrement n’a pas abouti. Vérifie la connexion et réessaie.");
      else if (payload.bookmarkMap) onBookmark();
    });
  }

  function persistPage(extra = {}) {
    const annotations = state.annotations.map(item => item.range ? {...item,quote:quoteFor(item.range)} : item);
    persisted[current.key] = {position:current.position,label:current.label,annotations,placement:state.placement,documentRevision:book.documentRevision || ""};
    enqueue({...extra,readerAnnotations:{[current.key]:persisted[current.key]}});
  }

  function saveProfile() {
    profile = {pinned:[...pinnedIds],highlight:lastHighlight,underline:lastUnderline,line:underlineLine,usage:Object.fromEntries(useCount)};
    storage.putReaderProfile?.(profile).catch(() => {});
  }

  async function initialize() {
    profile = await storage.getReaderProfile?.().catch(() => null) || {};
    if (signal.aborted) return;
    if (Array.isArray(profile.pinned)) {
      pinnedIds.clear();
      profile.pinned.filter(id => toolButtons.has(id)).slice(0,4).forEach(id => pinnedIds.add(id));
    }
    if (colorButtons.has(profile.highlight)) lastHighlight = profile.highlight;
    if (colorButtons.has(profile.underline)) lastUnderline = profile.underline;
    if (lineChoices.some(item => item.dataset.line === profile.line)) underlineLine = profile.line;
    for (const [id,count] of Object.entries(profile.usage || {})) if (toolButtons.has(id) && Number.isSafeInteger(count)) useCount.set(id,count);
    ranked = [...pinnedIds,...startingOrder.filter(id => !pinnedIds.has(id))
      .sort((a,b) => (useCount.get(b) || 0) - (useCount.get(a) || 0))];
    arrangeRail(0);
    persisted = structuredClone(Object.fromEntries(Object.entries(book.readerAnnotations || {})
      .filter(([,entry]) => entry.documentRevision === (book.documentRevision || ""))));
    repereCatalog = Object.values(book.readerReperes || {});
  }

  function clearPage() {
    current = null;
    closeOptions();
    closeRibbonNotes();
    closeLinkMenu();
    showSheet(false);
    clearSelection();
    savedFilter = "all";
    for (const tab of all("[data-saved-filter]")) tab.setAttribute("aria-pressed",String(tab.dataset.savedFilter === "all"));
    one("[data-page-foot]").hidden = true;
    one("[data-page-annotations]").hidden = true;
    pageMeaning.hidden = true;
    marginReperes.hidden = true;
    marginReperes.replaceChildren();
    page.removeAttribute("data-with-margin-reperes");
    page.style.removeProperty("--repere-margin-room");
    one("[data-free-symbols]").replaceChildren();
    ribbonOpen.hidden = true;
    rail.hidden = true;
    fiche.disabled = true;
  }
  function loadPage(fragment,descriptor) {
    clearPage();
    current = descriptor;
    activeTag = null;
    const saved = persisted[current.key] || {};
    state = {annotations:structuredClone(saved.annotations || []),placement:structuredClone(saved.placement || []),
      bookmarked:Boolean(book.bookmarkMap?.[current.key])};
    reading.replaceChildren(fragment);
    const walker = document.createTreeWalker(reading, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) if (walker.currentNode.data) nodes.push(walker.currentNode);
    sections = nodes.map(node => {
      const slot = document.createElement("span");
      slot.style.display = "contents";
      const text = node.data;
      node.replaceWith(slot);
      return {slot,text};
    });
    sectionTexts = sections.map(section => section.text);
    offsets = [0];
    for (const text of sectionTexts) offsets.push(offsets.at(-1)+text.length);
    current.selectable = Boolean(sectionTexts.join("").trim());
    for (const id of ["surligner","souligner","entourer-le-texte"]) {
      const button = toolButtons.get(id);
      button.setAttribute("aria-disabled",String(!current.selectable));
      button.setAttribute("data-tooltip",current.selectable ? toolLabels.get(id) : "Texte non sélectionnable");
    }
    rail.hidden = false;
    fiche.disabled = false;
    renderRibbon();
    renderText();
    renderFooter();
    renderPageAnnotations();
    refreshIcons();
    return sectionTexts.join("").trim().split(/\s+/).filter(Boolean).length;
  }

  resize();
  function resize() {
    if (signal.aborted || root.hidden) return;
    refreshHighlightSettings();
    positionOptions();
    positionMarginReperes();
    positionLinkMenu();
    positionSymbolPanel();
  }
  window.addEventListener("resize",resize,{signal});
  document.fonts?.ready.then(resize);
  signal.addEventListener("abort",() => {
    clearTimeout(holdTimer);
    clearTimeout(selectionTimer);
  },{once:true});
  reader.addEventListener("keydown",event => {
    if (event.key !== "Escape") return;
    if (event.target.closest("[data-repere-options],[data-repere-trigger]") && !repereOptions.hidden) return;
    if (!options.hidden || !linkMenu.hidden || !sheet.hidden || !ribbonPanel.hidden) {
      event.preventDefault();
      closeOptions();
      closeLinkMenu();
      closeRibbonNotes();
      showSheet(false);
    }
  },{capture:true});
  clearPage();
  return {initialize,loadPage,clearPage,resize};

}
