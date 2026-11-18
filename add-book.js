function mountAddBook(stage, {engine, findFolder, folderCards, folderLabel, folderHome, initialFolder, openFolderEditor, saveBook, close, refreshIcons}) {
  const root=stage;
  const copy=selector=>root.querySelector(selector).content.cloneNode(true);
  const lifecycle=new AbortController();
  let selectedStatus="to-read";
  function mountPickers(following,form) {
    const menus=new Map([...following.querySelectorAll("[data-picker]")].map(button=>{
      const list=following.querySelector("#"+button.getAttribute("aria-controls"));
      return [button,{button,list}];
    }));
    let openedMenu=null;

    function closeMenu(returnFocus=false) {
      if (!openedMenu) return false;
      const menu=openedMenu;
      openedMenu=null;
      menu.list.hidden=true;
      menu.button.setAttribute("aria-expanded","false");
      if (returnFocus) menu.button.focus({preventScroll:true});
      return true;
    }
    function positionMenu(menu) {
      const anchor=menu.button.getBoundingClientRect();
      const frame=form.getBoundingClientRect();
      const below=Math.min(frame.bottom,window.innerHeight)-anchor.bottom-8;
      const above=anchor.top-Math.max(frame.top,0)-8;
      menu.list.style.maxBlockSize="";
      const opensAbove=menu.list.offsetHeight>below && above>below;
      menu.list.dataset.side=opensAbove ? "above" : "below";
      menu.list.style.maxBlockSize=Math.max(44,Math.min(205,opensAbove ? above : below))+"px";
    }
    function openMenu(menu) {
      if (menu.button.disabled) return;
      if (openedMenu===menu) return;
      closeMenu();
      openedMenu=menu;
      menu.list.hidden=false;
      positionMenu(menu);
      menu.button.setAttribute("aria-expanded","true");
    }
    function setOptions(button,choices,value,onPick) {
      const menu=menus.get(button);
      menu.button.querySelector("[data-value]").textContent=choices.find(([id])=>id===value)?.[1] || choices[0][1];
      menu.list.replaceChildren(...choices.map(([id,label,optionLabel=label]) => {
        const option=document.createElement("button");
        option.type="button";
        option.className="ep-picker-option cursor-interaction";
        option.textContent=optionLabel;
        option.setAttribute("aria-pressed",String(id===value));
        option.addEventListener("click",()=>{
          closeMenu();
          onPick(id);
          menu.button.focus({preventScroll:true});
        });
        return option;
      }));
    }
    for (const menu of menus.values()) {
      menu.button.addEventListener("click",()=>{
        if (openedMenu===menu) closeMenu();
        else openMenu(menu);
      });
      menu.button.addEventListener("keydown",event=>{
        if (menu.button.disabled || (event.key!=="ArrowDown" && event.key!=="ArrowUp")) return;
        event.preventDefault();
        openMenu(menu);
        const options=[...menu.list.children];
        const selected=options.find(option=>option.getAttribute("aria-pressed")==="true");
        (selected || options[event.key==="ArrowDown" ? 0 : options.length-1])?.focus();
      });
      menu.list.addEventListener("keydown",event=>{
        if (!["ArrowDown","ArrowUp","Home","End"].includes(event.key)) return;
        const options=[...menu.list.children];
        const current=options.indexOf(event.target);
        if (current===-1) return;
        event.preventDefault();
        const next=event.key==="Home" ? 0 : event.key==="End" ? options.length-1 :
          (current+(event.key==="ArrowDown" ? 1 : -1)+options.length)%options.length;
        options[next].focus();
      });
    }
    function dismissOutside(target) {
      if (openedMenu && !openedMenu.button.contains(target) && !openedMenu.list.contains(target)) closeMenu();
    }
    root.addEventListener("pointerdown",event=>dismissOutside(event.target));
    following.addEventListener("focusout",event=>dismissOutside(event.relatedTarget));
    window.addEventListener("resize",()=>{if (openedMenu) positionMenu(openedMenu);},{signal:lifecycle.signal});
    return {setOptions,closeMenu};
  }

  function mountFolders(following) {
    const get = selector => following.querySelector(selector);
    const disclosure = get("[data-book-folders]");
    const panel = get("[data-book-folder-panel]");
    const path = get("[data-book-folder-path]");
    const parent = get("[data-book-folder-parent]");
    const grid = get("[data-book-folder-grid]");
    const choose = get("[data-book-folder-choose]");
    const create = get("[data-book-folder-create]");
    const remove = get("[data-book-folder-remove]");
    const status = get("[data-creation-status]");
    const created = get("[data-book-folder-created]");
    const createdPath = get("[data-book-folder-created-path]");
    let selected = initialFolder ?? null;
    let browsing = null;

    function renderSelection() {
      get("[data-book-folder-value]").textContent = selected ? folderLabel(selected) : "Voir les dossiers";
      remove.hidden = !selected;
    }

    function browse(folder, focusCards = false) {
      browsing = folder;
      path.hidden = !folder;
      path.textContent = folder ? folderLabel(folder) : "";
      parent.hidden = !folder;
      choose.hidden = !folder;
      const cards = folderCards(folder?.id ?? null, child => browse(child, true));
      grid.replaceChildren(...cards);
      grid.hidden = !cards.length;
      get("[data-book-folder-empty]").hidden = cards.length > 0;
      refreshIcons();
      if (focusCards) (grid.querySelector("button") ?? (folder ? choose : create)).focus({preventScroll:true});
    }

    function close(returnFocus = true) {
      if (panel.hidden) return false;
      panel.hidden = true;
      disclosure.setAttribute("aria-expanded","false");
      if (returnFocus) disclosure.focus({preventScroll:true});
      return true;
    }

    function select(folder, message, creationPath = "") {
      selected = folder;
      renderSelection();
      close(false);
      disclosure.focus({preventScroll:true});
      created.hidden = !creationPath;
      createdPath.textContent = creationPath;
      status.textContent = message;
    }

    disclosure.addEventListener("click", () => {
      created.hidden = true;
      createdPath.textContent = "";
      if (close()) return;
      panel.hidden = false;
      disclosure.setAttribute("aria-expanded","true");
      browse(selected);
    });
    parent.addEventListener("click", () => browse(findFolder(browsing?.parent) ?? null, true));
    choose.addEventListener("click", () => {
      if (browsing) select(browsing,"Dossier choisi : " + folderLabel(browsing));
    });
    create.addEventListener("click", () => {
      openFolderEditor({
        trigger: create,
        destination: browsing?.id ?? folderHome,
        home: folderHome,
        onCreated: (folder, destination) => {
          if (lifecycle.signal.aborted) return;
          select(folder,"",folder.name + " · " + destination);
        },
      });
    });
    remove.addEventListener("click", () => select(null,"Dossier retiré."));
    renderSelection();
    return {id: () => selected?.id ?? null, close};
  }

  const datePartLabels={day:"Jour",month:"Mois",year:"Année"};

  function mountDatePickers(row) {
    const date=row.dataset.readingDate;
    const context=date==="start" ? " de début" : " de fin";
    const group=row.querySelector(".ep-date-parts");
    for (const [part,label] of Object.entries(datePartLabels)) {
      const fragment=copy(".ep-date-picker-template");
      const button=fragment.querySelector("[data-picker]");
      const value=fragment.querySelector("[data-value]");
      const list=fragment.querySelector(".ep-picker-list");
      const prefix="ep-"+date+"-"+part;
      button.dataset.datePart=part;
      button.setAttribute("aria-label",label+context);
      button.setAttribute("aria-describedby",prefix+"-value");
      button.setAttribute("aria-controls",prefix+"-options");
      value.setAttribute("id",prefix+"-value");
      list.setAttribute("id",prefix+"-options");
      list.setAttribute("aria-label",label+context);
      group.append(fragment);
    }
  }

  function mountReadingDate(row,setOptions) {
    const buttons=[...row.querySelectorAll("[data-picker]")];
    const feedback=row.querySelector("[data-date-feedback]");
    const months=["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
    const currentYear=new Date().getFullYear();
    const years=Array.from({length:currentYear-1899},(_,index)=>{
      const year=String(currentYear-index);
      return [year,year];
    });
    let date={day:"",month:"",year:""};

    function monthLength() {
      return date.month ? new Date(Date.UTC(Number(date.year) || 2000,Number(date.month),0)).getUTCDate() : 31;
    }
    function render() {
      const parts={
        day:Array.from({length:monthLength()},(_,index)=>[String(index+1),String(index+1)]),
        month:months.map((name,index)=>[String(index+1),name]),
        year:years,
      };
      for (const button of buttons) {
        const part=button.dataset.datePart;
        setOptions(button,[["",datePartLabels[part],"Laisser vide"],...parts[part]],date[part],value=>{
          date[part]=value;
          const invalidDay=Number(date.day)>monthLength();
          if (invalidDay) date.day="";
          feedback.textContent=invalidDay ? "Le jour a été effacé car il n’existe pas pour ce mois et cette année." : "";
          feedback.hidden=!invalidDay;
          render();
        });
      }
    }
    function clear() {
      date={day:"",month:"",year:""};
      feedback.textContent="";
      feedback.hidden=true;
      render();
    }
    function parts() {
      return Object.values(date).some(Boolean) ? {...date} : null;
    }

    return {clear,parts};
  }

  function mountRating(following) {
    const controlGroup=following.querySelector(".ep-rating-controls");
    const group=following.querySelector("[data-rating-stars]");
    const status=following.querySelector("[data-rating-status]");
    const controls=[...following.querySelectorAll("[data-rating-step]")];
    const numbers=new Intl.NumberFormat("fr-FR");
    const stars=Array.from({length:5},(_,index)=>{
      const fragment=copy(".ep-rating-star-template");
      const star=fragment.querySelector("button");
      star.setAttribute("aria-label","Étoile "+(index+1)+" sur 5");
      group.append(fragment);
      return star;
    });
    let score=0;

    function setScore(next) {
      score=Math.min(5,Math.max(0,next));
      stars.forEach((star,index)=>{
        const fill=score-index;
        const state=fill>=1 ? "full" : fill===0.5 ? "half" : "empty";
        star.dataset.fill=state;
        star.setAttribute("aria-pressed",String(fill>0 && fill<=1));
      });
      for (const control of controls) {
        const step=Number(control.dataset.ratingStep);
        control.setAttribute("aria-disabled",String(step<0 ? score===0 : score===5));
      }
      status.textContent=score ? numbers.format(score)+" sur 5" : "Note non renseignée";
    }

    for (const control of controls) {
      control.addEventListener("click",()=>{
        if (control.getAttribute("aria-disabled")==="true") return;
        setScore(score+Number(control.dataset.ratingStep));
      });
    }
    stars.forEach((star,index)=>{
      star.addEventListener("click",event=>{
        const box=star.getBoundingClientRect();
        const half=event.detail>0 && event.clientX<box.left+(box.right-box.left)/2;
        const next=index+(half ? 0.5 : 1);
        setScore(next===score ? 0 : next);
      });
    });
    controlGroup.addEventListener("keydown",event=>{
      const steps={ArrowRight:0.5,ArrowUp:0.5,ArrowLeft:-0.5,ArrowDown:-0.5};
      if (Object.hasOwn(steps,event.key)) setScore(score+steps[event.key]);
      else if (event.key==="End") setScore(5);
      else if (event.key==="Home" || event.key==="Delete") setScore(0);
      else return;
      event.preventDefault();
      stars[Math.max(0,Math.ceil(score)-1)].focus({preventScroll:true});
    });

    return {
      clear:()=>setScore(0),
      value:()=>score || null,
    };
  }

  function mountReadingFields(following,{setOptions,closeMenu}) {
    const panel=following.querySelector("[data-reading-fields]");
    const conditionalFields=[...panel.querySelectorAll("[data-reading-for]")];
    const statusOptions=[...following.querySelectorAll('input[type="radio"]')];
    const progress=following.querySelector("[data-progress]");
    const unitButton=following.querySelector("[data-progress-unit]");
    const startDate=mountReadingDate(panel.querySelector('[data-reading-date="start"]'),setOptions);
    const finishDate=mountReadingDate(panel.querySelector('[data-reading-date="finish"]'),setOptions);
    const rating=mountRating(following);
    const favorite=following.querySelector("[data-favorite]");
    const units=[["page","Page"],["chapter","Chapitre"],["percent","Pourcentage"]];
    let unit="page";
    let progressByUnit={};
    let statusChosen=false;

    function selectUnit(nextUnit) {
      progressByUnit[unit]=progress.value;
      unit=nextUnit;
      progress.max=unit==="percent" ? "100" : "";
      progress.value=progressByUnit[unit] || "";
      setOptions(unitButton,units,unit,selectUnit);
    }

    function renderStatus() {
      panel.hidden=selectedStatus==="to-read";
      panel.dataset.readingStatus=selectedStatus;
      for (const field of conditionalFields) field.hidden=field.dataset.readingFor!==selectedStatus;
      for (const option of statusOptions) option.checked=option.value===selectedStatus;
    }
    for (const status of statusOptions) {
      status.addEventListener("click",()=>{statusChosen=true;});
      status.addEventListener("change",()=>{
        if (!status.checked) return;
        closeMenu();
        selectedStatus=status.value;
        statusChosen=true;
        renderStatus();
      });
    }
    renderStatus();

    function clear() {
      selectedStatus="to-read";
      statusChosen=false;
      renderStatus();
      progress.value="";
      startDate.clear();
      finishDate.clear();
      rating.clear();
      favorite.checked=false;
      progressByUnit={};
      selectUnit("page");
    }


    function values() {
      const completed=selectedStatus==="finished";
      if (selectedStatus==="reading" && !progress.reportValidity()) return null;
      return {
        statusChosen,
        status:{"to-read":"À lire",reading:"En cours",finished:"Terminé"}[selectedStatus],
        ...(selectedStatus!=="to-read" ? {readingStart:startDate.parts()} : {}),
        ...(selectedStatus==="reading" && progress.value!=="" ? {readingPosition:{unit,value:Number(progress.value)}} : {}),
        ...(completed ? {readingEnd:finishDate.parts(),rating:rating.value(),coupDeCoeur:favorite.checked} : {}),
      };
    }

    return {clear,values};
  }

  function seriesLine(book) {
    return [book.series,book.volume && /^(?:tome|volume|hors[- ]série)/i.test(book.volume) ? book.volume : book.volume ? "Tome "+book.volume : ""].filter(Boolean).join(" · ");
  }

  function drawBook(book,showSeries=false) {
    const fragment = copy(".ep-book-template");
    const image=fragment.querySelector("[data-book-cover]");
    const frame=fragment.querySelector(".ep-cover");
    fragment.querySelector("[data-cover-caption]").textContent=book.title;
    const cover=book.coverData;
    if (cover) {
      image.referrerPolicy="no-referrer";
      image.src=cover;
      image.hidden=false;
      for (const part of [".ep-cover-mark","[data-cover-caption]"]) frame.querySelector(part).hidden=true;
      image.addEventListener("error",()=>{
        image.hidden=true;
        for (const part of [".ep-cover-mark","[data-cover-caption]"]) frame.querySelector(part).hidden=false;
      },{once:true});
    }
    fragment.querySelector(".ep-book-name").textContent = book.title;
    fragment.querySelector(".ep-book-author").textContent = book.author;
    const series = fragment.querySelector(".ep-book-series");
    series.textContent = showSeries ? seriesLine(book) : "";
    series.hidden = !series.textContent;
    return fragment;
  }

  function drawRecap(book) {
    const fragment=drawBook(book,true);
    fragment.querySelector(".ep-book-snapshot").classList.add("ep-book-recap");
    const info=fragment.querySelector(".ep-book-copy");
    const identity=document.createElement("span");
    identity.className="ep-book-identity";
    identity.append(...info.children);
    info.append(identity);

    const author=identity.querySelector(".ep-book-author");
    author.hidden=!book.author;
    if (book.author) author.prepend("Par ");

    const series=identity.querySelector(".ep-book-series");
    series.textContent=series.textContent.replace(/\bTome (?=\d+$)/i,"Tome\u00a0");
    if (book.genres?.length) info.append(tagGroup("Genres",book.genres,"genres"));
    if (book.subgenres?.length) info.append(tagGroup("Sous-genres",book.subgenres,"subgenres"));
    return fragment;
  }

  function tagGroup(label,values,kind) {
    const group=document.createElement("span");
    group.className="ep-tag-group";
    group.dataset.category=kind;
    const heading=document.createElement("span");
    heading.className="ep-tag-label";
    heading.textContent=label;
    const list=document.createElement("span");
    list.className="ep-tag-values";
    list.setAttribute("role","list");
    list.setAttribute("aria-label",label);
    for (const value of values) {
      const tag=document.createElement("span");
      tag.className="ep-tag";
      tag.setAttribute("role","listitem");
      tag.textContent=value;
      list.append(tag);
    }
    group.append(heading,list);
    return group;
  }



  const get=selector=>stage.querySelector(selector);
  const form=get(".ep-form");
  const paper=get(".ep-paper");
  const digital=get(".ep-digital");
  const following=get(".ep-following");
  const back=get(".ep-back");
  const exit=get(".ep-close");
  const editToolbar=get(".ep-edit-toolbar");
  const editButton=get(".ep-edit-toggle");
  const editForm=get("#ep-book-editor");
  const editSummary=get("#ep-summary-editor");
  const editCover=get("[data-edit-cover]");
  const editCoverPreview=get("[data-edit-cover-preview]");
  const editCoverStatus=get("[data-edit-cover-status]");
  const nextBook=get("[data-next-book]");
  const summary=get(".ep-next-summary");
  const editFields=["title","author","series","volume","genres","subgenres"].map(name=>editForm.elements.namedItem(name));
  const cards=[...form.querySelectorAll("[data-book]")];
  const searchForm=get(".ep-paper-search");
  const query=get(".ep-search-input");
  const results=get(".ep-results");
  const empty=get("[data-empty]");
  const searchMessage=get("[data-scan-message]");
  const nextButton=get("[data-ep-continue]");
  const addButton=get("[data-confirm-book]");
  const saveStatus=document.createElement("p");
  saveStatus.className="ep-message";
  saveStatus.setAttribute("role","status");
  addButton.after(saveStatus);
  const fileInput=get("[data-ep-document]");
  const fileChoice=get("[data-ep-file-choice]");
  const drop=get(".ep-drop");
  const importStatus=get("[data-ep-import-status]");
  const digitalPreview=get("[data-ep-digital-preview]");
  const recovery=get("[data-ep-recovery]");
  const manualTitle=get("[data-ep-manual-title]");
  const titleField=get("[data-ep-title-field]");
  const coverTools=get("[data-ep-cover-tools]");
  const pages=get("[data-ep-pages]");
  const pagesLabel=get("[data-ep-pages-label]");
  const coverModes=get("[data-ep-cover-modes]");
  const cropped=get("[data-ep-cropped]");
  const original=get("[data-ep-original]");
  const imageInput=get("[data-ep-image]");
  const signal=lifecycle.signal;
  const pendingSummaries=new WeakMap();
  const editedSummaries=new WeakSet();

  digital.id="ep-fiche-numerique";
  paper.id="ep-fiche-papier";
  for (const card of cards) card.setAttribute("aria-controls",card.dataset.book==="digital" ? digital.id : paper.id);
  for (const date of following.querySelectorAll("[data-reading-date]")) mountDatePickers(date);
  const pickers=mountPickers(following,form);
  const folderPicker=mountFolders(following);
  const readingFields=mountReadingFields(following,pickers);
  let lastStep="";
  let currentBook;
  let origin;
  let originScroll=0;
  let editCoverCanvas;
  let editCoverVersion=0;
  let editCoverBusy=false;
  let editSummaryChanged=false;
  let digitalBook;
  let documentVersion=0;
  let coverVersion=0;
  let pdfTask;
  let renderTask;
  let pdfDocument;
  let sourceCanvas;
  let trimmedCanvas;
  let searchTimer;
  let searchRequest;

  const isbn=value=>{
    const code=(value || "").replace(/[\s-]/g,"").toUpperCase();
    if (!/^\d{9}[\dX]$/.test(code)) return code;
    const base="978"+code.slice(0,9);
    return base+(10-[...base].reduce((sum,digit,index)=>sum+Number(digit)*(index%2 ? 3 : 1),0)%10)%10;
  };

  function showStep(step,animate=true) {
    pickers.closeMenu();
    const pane={digital,paper,next:following}[step];
    const changed=pane?.hidden;
    stage.dataset.step=step;
    back.hidden=step!=="next";
    editToolbar.hidden=step!=="next";
    for (const item of [digital,paper,following]) item.hidden=item!==pane;
    for (const card of cards) card.setAttribute("aria-expanded",String(card.dataset.book===step));
    if (changed && animate && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      pane.animate?.([{opacity:0,transform:"translateY(4px)"},{opacity:1,transform:"translateY(0)"}],{duration:260,easing:"ease"});
    }
  }

  function renderBook(book) {
    nextBook.replaceChildren(drawRecap(book));
    if (book.summary || editedSummaries.has(book)) {
      summary.textContent=book.summary || "Résumé indisponible.";
      return;
    }
    summary.textContent="Recherche du résumé…";
    prepareSummary(book).then(()=>{
      if (signal.aborted || currentBook!==book) return;
      summary.textContent=book.summary || "Résumé indisponible.";
      if (!editForm.hidden && !editSummaryChanged) editSummary.value=book.summary || "";
    });
  }

  function openBook(book,step,trigger) {
    if (currentBook!==book) readingFields.clear();
    currentBook=book;
    lastStep=step;
    origin=trigger;
    originScroll=window.scrollY;
    renderBook(book);
    saveStatus.textContent="";
    back.setAttribute("aria-label",step==="paper" ? "Revenir aux résultats de recherche" : "Revenir à l’aperçu du livre");
    showStep("next");
    window.scrollTo({top:0,behavior:"instant"});
    back.focus({preventScroll:true});
  }

  function setEditing(editing) {
    const label=editing ? "Terminer les modifications" : "Modifier la fiche";
    editButton.setAttribute("aria-expanded",String(editing));
    editButton.setAttribute("aria-label",label);
    editButton.title=label;
    get("[data-edit-pencil]").hidden=editing;
    get("[data-edit-check]").hidden=!editing;
    editForm.hidden=editSummary.hidden=!editing;
    nextBook.hidden=summary.hidden=editing;
    if (!editing) {
      ++editCoverVersion;
      editCoverCanvas=null;
      editCoverBusy=false;
      editCoverPreview.replaceChildren();
      editCoverStatus.hidden=true;
    }
  }

  function startEditing() {
    if (!currentBook || addButton.disabled) return;
    pickers.closeMenu();
    for (const field of editFields) {
      const value=currentBook[field.name];
      field.value=Array.isArray(value) ? value.join("; ") : value || "";
    }
    editFields[0].setCustomValidity("");
    editSummary.value=currentBook.summary || "";
    editSummaryChanged=false;
    editCoverPreview.replaceChildren(drawBook(currentBook).querySelector(".ep-cover"));
    setEditing(true);
    editFields[0].focus();
  }

  function applyBookEdits(restoreFocus=false) {
    if (editForm.hidden) return true;
    if (editCoverBusy) return false;
    const title=editFields[0];
    title.setCustomValidity(title.value.trim() ? "" : "Renseigne le titre du livre.");
    if (!editForm.reportValidity()) return false;
    for (const field of editFields) {
      const value=field.value.trim();
      currentBook[field.name]=["genres","subgenres"].includes(field.name)
        ? [...new Set(value.split(/[;\n]/).map(part=>part.trim()).filter(Boolean))]
        : value;
    }
    if (editSummaryChanged) {
      currentBook.summary=editSummary.value.trim();
      editedSummaries.add(currentBook);
    }
    if (currentBook===digitalBook) {
      manualTitle.value=currentBook.title;
      titleField.hidden=true;
      if (editCoverCanvas) setCover(editCoverCanvas);
      else drawDigital();
    } else if (editCoverCanvas) {
      currentBook.coverData=engine.trimCover(editCoverCanvas).toDataURL("image/png");
    }
    setEditing(false);
    renderBook(currentBook);
    if (restoreFocus) editButton.focus({preventScroll:true});
    return true;
  }

  const catalogueCache=new Map();
  async function queryCatalogues(action, query, requestSignal) {
    const params=new URLSearchParams(query);
    let serverData;
    try {
      const {data,error}=await compteLecture.db.functions.invoke("catalogue", {
        body:{action,params:Object.fromEntries(params)},signal:requestSignal
      });
      if (!error && data) {
        serverData=data;
        if (action==="details" ? serverData.summary : Array.isArray(serverData.books) && (serverData.books.length || !serverData.partial)) return serverData;
      }
    } catch (error) {
      if (requestSignal.aborted) throw error;
    }
    try {
      // The same catalogue adapters can reach the public sources from the device.
      const {createCatalogue}=await import("./catalogue-engine.js?v=1");
      const local=createCatalogue([],requestSignal);
      return await (action==="details" ? local.details(params) : local.search(params));
    } catch (error) {
      if (requestSignal.aborted || !serverData) throw error;
      return serverData;
    }
  }
  async function catalogue(query,requestSignal=signal) {
    const key=new URLSearchParams(query).toString();
    const cached=catalogueCache.get(key);
    if (cached && cached.until>Date.now()) return cached.data;
    const data=await queryCatalogues("catalogue",query,requestSignal);
    if (!Array.isArray(data.books)) throw new Error("Catalogue indisponible.");
    if (data.books.length && !requestSignal.aborted) {
      if (catalogueCache.size>=30) catalogueCache.delete(catalogueCache.keys().next().value);
      catalogueCache.set(key,{until:Date.now()+300000,data});
    }
    return data;
  }

  async function loadSummary(book) {
    if (!book.id) return "";
    try {
      const data=await queryCatalogues("details",{id:book.id,title:book.title,author:book.author || "",volume:book.volume || "",isbn:book.isbn || book.isbns?.[0] || ""},signal);
      return typeof data?.summary==="string" ? data.summary : "";
    } catch {
      return "";
    }
  }

  function prepareSummary(book,fallback="") {
    if (book.summary || editedSummaries.has(book)) return Promise.resolve(book.summary);
    if (!pendingSummaries.has(book)) {
      pendingSummaries.set(book,loadSummary(book).then(value=>{
        if (!editedSummaries.has(book)) book.summary=value || fallback;
        return book.summary;
      }));
    }
    return pendingSummaries.get(book);
  }

  async function matchDocument(info,fileName) {
    const code=isbn(info.isbn);
    const title=info.title || fileName;
    if (!code && !(title && info.author)) return null;
    try {
      const request=new AbortController();
      const abort=()=>request.abort();
      const timer=setTimeout(abort,21000);
      signal.addEventListener("abort",abort,{once:true});
      const numbered=/\b(?:tome|vol(?:ume)?\.?|t(?=\d))\s*(\d+(?:[.,]\d+)?)/i;
      const volume=info.volume || info.title?.match(numbered)?.[1] || fileName.match(numbered)?.[1] || "";
      const {books}=await catalogue({q:title || code,match:"1",author:info.author || "",series:info.series || "",volume,isbn:code},request.signal).finally(()=>{
        clearTimeout(timer);
        signal.removeEventListener("abort",abort);
      });
      return books.length===1 ? books[0] : null;
    } catch {
      return null;
    }
  }

  function showSearch() {
    clearTimeout(searchTimer);
    searchRequest?.abort();
    const text=query.value.trim();
    empty.hidden=true;
    searchMessage.textContent="";
    results.replaceChildren();
    results.hidden=true;
    if (text.length<2) return;
    searchTimer=setTimeout(async()=>{
      const request=new AbortController();
      searchRequest=request;
      const code=isbn(text);
      searchMessage.textContent="Recherche en cours…";
      try {
        const {books:rows,partial}=await catalogue({q:text,...(/^(?:\d{13}|\d{9}[\dX])$/.test(code) ? {isbn:code} : {})},request.signal);
        if (request.signal.aborted || signal.aborted) return;
        const items=rows.map(info=>{
          const book={...info,format:"Papier"};
          const item=document.createElement("li");
          const button=document.createElement("button");
          button.type="button";
          button.className="ep-result cursor-interaction";
          button.append(drawBook(book,true));
          button.addEventListener("click",()=>openBook(book,"paper",button));
          item.append(button);
          return item;
        });
        results.replaceChildren(...items);
        results.hidden=!items.length;
        empty.hidden=Boolean(items.length) || partial;
        searchMessage.textContent=!items.length && partial ? "Recherche incomplète. Un catalogue est momentanément indisponible. Réessaie dans un instant." : "";
      } catch {
        if (!request.signal.aborted && !signal.aborted) searchMessage.textContent="Le catalogue est momentanément indisponible. Réessaie dans un instant.";
      }
    },400);
  }

  function message(text="") {
    importStatus.textContent=text;
    importStatus.hidden=!text;
  }
  function current(version) {
    return !signal.aborted && version===documentVersion;
  }
  function releasePdf() {
    renderTask?.cancel();
    renderTask=null;
    pdfDocument=null;
    pdfTask?.destroy().catch(()=>{});
    pdfTask=null;
  }
  function drawDigital() {
    fileChoice.hidden=Boolean(digitalBook);
    digitalPreview.hidden=!digitalBook;
    if (digitalBook) {
      get("[data-ep-snapshot]").replaceChildren(drawBook(digitalBook));
      nextButton.disabled=!digitalBook.title;
    }
  }
  function showCover(canvas) {
    digitalBook.coverData=canvas.toDataURL("image/png");
    const useTrimmed=canvas===trimmedCanvas;
    cropped.setAttribute("aria-pressed",String(useTrimmed));
    original.setAttribute("aria-pressed",String(!useTrimmed));
    drawDigital();
  }
  function setCover(canvas) {
    sourceCanvas=canvas;
    trimmedCanvas=engine.trimCover(canvas);
    coverModes.hidden=sourceCanvas===trimmedCanvas;
    showCover(trimmedCanvas);
  }

  async function readCoverImage(file) {
    if (file.size>24*1024*1024) throw new Error("Cette image dépasse 24 Mo.");
    return engine.imageCanvas(new Uint8Array(await file.arrayBuffer()));
  }

  async function choosePdfPage(number,version=documentVersion) {
    const ticket=++coverVersion;
    renderTask?.cancel();
    message("Préparation de la couverture…");
    try {
      const canvas=await engine.renderPage(pdfDocument,number,engine.longEdge,task=>{
        if (!current(version) || ticket!==coverVersion) task.cancel();
        else renderTask=task;
      });
      if (!current(version) || ticket!==coverVersion) return;
      renderTask=null;
      setCover(canvas);
      for (const button of pages.querySelectorAll("button")) button.setAttribute("aria-pressed",String(Number(button.dataset.page)===number));
      message();
    } catch (error) {
      if (current(version) && ticket===coverVersion && error.name!=="RenderingCancelledException") {
        message("Cette page est illisible. Essaie une autre page ou choisis une image.");
      }
    }
  }

  async function drawPdfPages(version) {
    for (let number=1; number<=Math.min(pdfDocument?.numPages || 0,4); number++) {
      let canvas;
      try { canvas=await engine.renderPage(pdfDocument,number,230); } catch { continue; }
      if (!current(version)) return;
      const button=document.createElement("button");
      button.type="button";
      button.className="cover-page cursor-interaction";
      button.dataset.page=String(number);
      button.setAttribute("aria-pressed",String(number===1 && Boolean(sourceCanvas)));
      const image=document.createElement("img");
      image.src=canvas.toDataURL("image/png");
      image.alt="";
      const label=document.createElement("span");
      label.textContent="Page "+number;
      button.append(image,label);
      button.addEventListener("click",()=>choosePdfPage(number));
      pages.append(button);
    }
    if (current(version)) pages.hidden=pagesLabel.hidden=!pages.children.length;
  }

  async function importDocument(file) {
    if (!file) return;
    const version=++documentVersion;
    ++coverVersion;
    releasePdf();
    sourceCanvas=trimmedCanvas=null;
    digitalBook=null;
    drawDigital();
    recovery.hidden=coverModes.hidden=pages.hidden=pagesLabel.hidden=true;
    coverTools.open=false;
    pages.replaceChildren();
    message("Lecture du fichier…");
    try {
      if (file.size>100*1024*1024) throw new Error("L’aperçu accepte les fichiers jusqu’à 100 Mo.");
      const bytes=new Uint8Array(await file.arrayBuffer());
      if (!current(version)) return;
      const format=engine.formatOf(bytes);
      let info;
      if (format==="EPUB") info=await engine.fromEpub(bytes);
      else if (format==="PDF") info=await engine.fromPdf(bytes,task=>{
        if (current(version)) pdfTask=task;
        else task.destroy().catch(()=>{});
      });
      else throw new Error("Choisis un fichier EPUB ou PDF reconnu.");
      if (!current(version)) return;
      const fileName=file.name.replace(/\.(epub|pdf)$/i,"").trim();
      message("Recherche dans le catalogue…");
      const matched=await matchDocument(info,fileName);
      if (!current(version)) return;
      const title=matched?.title || info.title || fileName;
      const code=isbn(info.isbn || matched?.isbns?.[0]);
      digitalBook={...matched,title,author:matched?.author || info.author || "",series:matched?.series || info.series || "",
        volume:matched?.volume || info.volume || "",isbn:code,format,file};
      prepareSummary(digitalBook,info.summary);
      manualTitle.value=title;
      titleField.hidden=Boolean(title);
      if (!title) recovery.hidden=false;
      message();
      drawDigital();
      if (format==="PDF") {
        pdfDocument=info.document;
        recovery.hidden=false;
        await choosePdfPage(1,version);
        if (current(version)) await drawPdfPages(version);
      } else if (info.cover) {
        try {
          const canvas=await engine.imageCanvas(info.cover);
          if (current(version) && !sourceCanvas) setCover(canvas);
        } catch {
          if (current(version) && !digitalBook.coverData) recovery.hidden=false;
        }
      }
      if (current(version) && !digitalBook.coverData) {
        recovery.hidden=false;
        if (format==="EPUB") {
          coverTools.open=true;
          message("Aucune couverture intégrée. Tu peux choisir une image.");
        }
      }
    } catch (error) {
      if (current(version)) message(error.name==="PasswordException" ? "Ce PDF est protégé par un mot de passe." : error.message || "Impossible d’ouvrir ce fichier.");
    }
  }

  fileInput.addEventListener("change",()=>{
    const file=fileInput.files?.[0];
    fileInput.value="";
    importDocument(file);
  });
  for (const type of ["dragover","dragleave","drop"]) drop.addEventListener(type,event=>{
    event.preventDefault();
    drop.dataset.dragging=String(type==="dragover");
    if (type==="drop") importDocument(event.dataTransfer.files?.[0]);
  });
  manualTitle.addEventListener("input",()=>{
    if (!digitalBook) return;
    digitalBook.title=manualTitle.value.trim();
    drawDigital();
  });
  imageInput.addEventListener("change",async()=>{
    const file=imageInput.files?.[0];
    if (!file || !digitalBook) return;
    const version=documentVersion;
    const ticket=++coverVersion;
    renderTask?.cancel();
    try {
      const canvas=await readCoverImage(file);
      if (!current(version) || ticket!==coverVersion) return;
      setCover(canvas);
      message();
      for (const page of pages.querySelectorAll("button")) page.setAttribute("aria-pressed","false");
    } catch (error) {
      if (current(version) && ticket===coverVersion) message(error.message || "Cette image est illisible.");
    }
  });
  cropped.addEventListener("click",()=>{if (trimmedCanvas) showCover(trimmedCanvas);});
  original.addEventListener("click",()=>{if (sourceCanvas) showCover(sourceCanvas);});

  editButton.addEventListener("click",()=>{
    if (editForm.hidden) startEditing();
    else applyBookEdits(true);
  });
  editForm.addEventListener("submit",event=>{
    event.preventDefault();
    applyBookEdits(true);
  });
  editFields[0].addEventListener("input",()=>editFields[0].setCustomValidity(""));
  editSummary.addEventListener("input",()=>{editSummaryChanged=true;});
  editCover.addEventListener("change",async()=>{
    const file=editCover.files?.[0];
    editCover.value="";
    if (!file || editForm.hidden) return;
    const version=++editCoverVersion;
    editCoverBusy=true;
    editCoverStatus.hidden=false;
    editCoverStatus.textContent="Préparation de la couverture…";
    try {
      const canvas=await readCoverImage(file);
      if (signal.aborted || version!==editCoverVersion) return;
      const coverData=engine.trimCover(canvas).toDataURL("image/png");
      editCoverPreview.replaceChildren(drawBook({...currentBook,coverData}).querySelector(".ep-cover"));
      editCoverCanvas=canvas;
      editCoverStatus.hidden=true;
    } catch (error) {
      if (!signal.aborted && version===editCoverVersion) editCoverStatus.textContent=error.message || "Cette image est illisible.";
    } finally {
      if (version===editCoverVersion) editCoverBusy=false;
    }
  });

  const scanner=mountBookScanner(get("[data-ep-scan-dialog]"),code=>{
    query.value=code;
    showSearch();
    query.focus();
  });
  get(".ep-scan").addEventListener("click",scanner.open);
  query.addEventListener("input",showSearch);
  searchForm.addEventListener("submit",event=>{event.preventDefault();showSearch();});
  for (const card of cards) card.addEventListener("click",()=>showStep(card.dataset.book));
  nextButton.addEventListener("click",()=>{if (digitalBook?.title) openBook(digitalBook,"digital",nextButton);});
  back.addEventListener("click",()=>{
    if (!applyBookEdits()) return;
    showStep(lastStep);
    window.scrollTo({top:originScroll,behavior:"instant"});
    origin?.focus({preventScroll:true});
  });
  exit.addEventListener("click",close);
  stage.addEventListener("keydown",event=>{
    if (event.key!=="Escape" || folderDialog.open || scanner.active()) return;
    if (pickers.closeMenu(true) || folderPicker.close()) event.preventDefault();
    else if (!editForm.hidden) {
      setEditing(false);
      editButton.focus({preventScroll:true});
      event.preventDefault();
    }
    else close();
  });
  addButton.addEventListener("click",async()=>{
    if (!currentBook || addButton.disabled || !applyBookEdits()) return;
    const book=currentBook;
    const reading=readingFields.values();
    if (!reading) return;
    const collection=folderPicker.id();
    addButton.disabled=true;
    saveStatus.textContent="";
    try {
      await prepareSummary(book);
      if (!signal.aborted && book===currentBook) await saveBook(book,reading,collection,()=>!signal.aborted && book===currentBook);
    } catch {
      if (!signal.aborted) saveStatus.textContent="Enregistrement impossible. Vérifie l’espace disponible, puis réessaie.";
    } finally {
      addButton.disabled=false;
    }
  });
  readingFields.clear();
  showStep("",false);
  refreshIcons();
  exit.focus({preventScroll:true});

  return ()=>{
    lifecycle.abort();
    clearTimeout(searchTimer);
    searchRequest?.abort();
    releasePdf();
    scanner.stop();
  };
}
