// Partie « Ce qu'il me promet » du formulaire d'ajout : carrousel de quatre slides.
import {HUMEURS, EMOTIONS, DECORS, NOIRCEUR, SPICE, emptyPromesse, guessPromesse, fillGaps} from "./promesse.js?v=edition-officielle-1";

const svg = (body, box = "0 0 32 32") => `<svg viewBox="${box}" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const ICONS = {
  humeur: svg('<path d="M7 14h15v4a7 7 0 0 1-7 7h-1a7 7 0 0 1-7-7z"/><path d="M22 15h2a2.5 2.5 0 0 1 0 5h-2.3"/><path d="M5 27h21"/><path d="M12 10c-1-1.5 1-2.5 0-4M16 10c-1-1.5 1-2.5 0-4"/><path d="M26 5l.6 1.2 1.2.6-1.2.6-.6 1.2-.6-1.2-1.2-.6 1.2-.6z"/>'),
  emotions: svg('<path d="M16 26s-9-5.6-9-12.2A4.8 4.8 0 0 1 16 11a4.8 4.8 0 0 1 9 2.8C25 20.4 16 26 16 26z"/><path d="M26 4l.7 1.4 1.4.7-1.4.7-.7 1.4-.7-1.4-1.4-.7 1.4-.7zM6 5l.5 1 1 .5-1 .5-.5 1-.5-1-1-.5 1-.5z"/>'),
  decor: svg('<path d="M7 27V12a9 9 0 0 1 18 0v15z"/><path d="M16 4v23M7 16h18"/><path d="M4 27h24"/><path d="M13.5 9.5a2.6 2.6 0 1 0 2.5 3.4 2 2 0 0 1-2.5-3.4z"/>'),
  noirceur: svg('<path d="M20 6a10 10 0 1 0 6.5 15.5A8 8 0 0 1 20 6z"/><path d="M24 9l.6 1.2 1.2.6-1.2.6-.6 1.2-.6-1.2-1.2-.6 1.2-.6z"/><path d="M27 15l.4.8.8.4-.8.4-.4.8-.4-.8-.8-.4.8-.4z"/>'),
  spice: svg('<path d="M16 28c-5 0-8-3.4-8-7.8 0-4.6 3.6-6.6 4.6-11.2 2.8 1.6 3.6 4.4 3.4 6.4 1.2-1 2-2.6 2-4.4 3.4 2.4 6 5.6 6 9.4 0 4.4-3 7.6-8 7.6z"/><path d="M16 28c-2 0-3.4-1.4-3.4-3.4 0-2.2 2-3.2 2.4-5.2 1.6 1 2.6 2.6 2.6 4 .6-.4 1-1.2 1-2 1 1 1.6 2.2 1.6 3.4 0 1.8-1.6 3.2-4.2 3.2z"/>'),
  pages: svg('<path d="M4 9c4-1.5 8-1.5 12 1 4-2.5 8-2.5 12-1v15c-4-1.5-8-1.5-12 1-4-2.5-8-2.5-12-1z"/><path d="M16 10v15"/><path d="M7 13c2-.6 4-.6 6 .3M7 17c2-.6 4-.6 6 .3M19 13.3c2-.9 4-.9 6-.3"/>'),
  piment: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 9c0-2.5 1.8-4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path class="piment-body" d="M10.5 11.5c3.5-2.6 9-2.1 11 1.4 2.5 4.2-.7 12-7.5 16.9-1.4 1-3.2 0-2.8-1.6.9-4.6-.7-8.1-2.8-10.9-1.4-1.9-.4-4.6 2.1-5.8z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
  check: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
const SLIDES = [
  {key: "humeur", title: "Son humeur", list: HUMEURS, nothing: "Rien trouvé sur son humeur."},
  {key: "emotions", title: "En le refermant, je vais…", list: EMOTIONS, nothing: "Rien trouvé sur ce qu'il fait ressentir."},
  {key: "decor", title: "En le lisant, je serai…", list: DECORS, nothing: "Rien trouvé sur son décor."},
  {key: "noirceur", title: "Son côté sombre"},
];
const SPICE_SLIDE = {key: "spice", title: "Ça chauffe ?"};
const moodArt = {reconfort:"calin",energie:"energie",melancolie:"coeur-lourd",tension:"secoue-moi",calme:"calme"};

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const analyses=new WeakMap();

async function askServer(book, context, signal, phase) {
  const params={title:book.title || "",author:book.author || "",isbn:book.isbn || (book.isbns?.length===1 ? book.isbns[0] : "") || "",
    series:book.series || book.saga || "",volume:book.volume || "",publicationDate:book.publicationDate || "",
    publisher:book.publisher || "",language:book.language || "",format:book.format || book.type || "",
    genres:[...(book.genres || []),...(book.subgenres || []),...(book.subjects || [])].slice(0,20).join("|"),
    summary:(book.summary || "").slice(0,4000),phase,rechercheWeb:context?.rechercheWeb,toc:context?.toc,opening:context?.opening,ending:context?.ending};
  const {data,error}=await compteLecture.db.functions.invoke("catalogue",{body:{action:"promesse",params},signal});
  return error ? null : data;
}

export async function searchImportWeb(book,context,signal) {
  return askServer(book,context,AbortSignal.any([signal,AbortSignal.timeout(50000)]),"recherche-web");
}

export function beginAnalysis(book, context, signal) {
  if (!analyses.has(book)) {
    const deadline=AbortSignal.timeout(95000);
    const active=signal ? AbortSignal.any([signal,deadline]) : deadline;
    analyses.set(book,askServer(book,context,active).catch(()=>null));
  }
  return analyses.get(book);
}

export function forgetAnalysis(book) { analyses.delete(book); }

export function reuseAnalysis(book,pending) {
  analyses.set(book,pending);
}

export async function findPromesse(book, signal) {
  let server = null;
  const sources = {};
  try {
    server = await beginAnalysis(book,null,signal);
    if (server?.sources) Object.assign(sources, server.sources);
    else sources.serveur = server ? "ancienne version" : "pas de réponse";
    if (server && !Object.values(server.promesse || {}).some(value => Array.isArray(value) ? value.length : value != null)) sources.serveur = "rien trouvé";
  } catch (error) {
    sources.serveur = `erreur ${String(error?.message || "").slice(0, 40)}`;
  }
  if (signal?.aborted) return null;
  const fromServer = server ? fillGaps(emptyPromesse(), server.promesse) : emptyPromesse();
  const full = ["humeur", "emotions", "decor"].every(key => fromServer[key].length) && fromServer.noirceur != null && fromServer.pages != null && fromServer.spice != null;
  if (full) return {promesse: fromServer, romance: Boolean(server.romance), sources};
  // Ce qui manque encore : l'appareil cherche aussi de son côté (Google Books + Open Library)
  try {
    const guess = await guessPromesse(book, signal);
    for (const [name, value] of Object.entries(guess.sources || {})) sources[`${name} (téléphone)`] = value;
    return {promesse: fillGaps(fromServer, guess.promesse), romance: Boolean(server?.romance) || guess.romance, sources};
  } catch (error) {
    sources.telephone = `erreur ${String(error?.message || "").slice(0, 40)}`;
    return {promesse: fromServer, romance: Boolean(server?.romance), sources};
  }
}

export function mountPromesse(section, {onPages, signal} = {}) {
  let state = emptyPromesse();
  let touched = new Set();
  let loading = false;
  let notFound = false;
  let request = null;
  let open = true;
  let bookKey = "";
  let sources = null;

  section.replaceChildren();
  const heading = make("h3", "ep-promesse-heading");
  const head = make("button", "ep-summary-heading ep-promesse-head cursor-interaction");
  head.type = "button";
  head.setAttribute("aria-expanded", "true");
  const title = make("span", "ep-promesse-title");
  title.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8c-3-2-6-2-10-1v13c4-1 7-1 10 1 3-2 6-2 10-1V7c-3-.7-5-.7-7 0M12 9v12"/><path d="m16 1 .8 2.3L19 4l-2.2.8L16 7l-.8-2.2L13 4l2.2-.7Z"/></svg>';
  title.append(document.createTextNode("Ce qu’il me promet"));
  head.append(title);
  heading.append(head);
  const body = make("div", "ep-promesse-body");
  body.id = "ep-promesse-body";
  head.setAttribute("aria-controls", body.id);
  const track = make("div", "ep-promesse-track");
  track.setAttribute("role", "group");
  track.setAttribute("aria-roledescription", "carrousel");
  track.setAttribute("aria-label", "Questions sur ce que le livre promet");
  const dots = make("div", "ep-promesse-dots");
  dots.setAttribute("role", "group");
  dots.setAttribute("aria-label", "Questions du carrousel");
  const trace = make("p", "ep-promesse-trace");
  trace.hidden = true;
  body.append(track, dots, trace);
  section.append(heading, body);

  head.addEventListener("click", () => setOpen(!open));

  function setOpen(next) {
    open = next;
    head.setAttribute("aria-expanded", String(open));
    body.hidden = !open;
    section.classList.toggle("is-closed", !open);
    if (open) { body.classList.remove("is-opening"); void body.offsetWidth; body.classList.add("is-opening"); }
  }



  function slideShell(slide, index, total) {
    const node = make("section", `ep-promesse-slide slide-${slide.key}`);
    node.setAttribute("role", "group");
    node.setAttribute("aria-roledescription", "question");
    node.setAttribute("aria-label", `${index + 1} sur ${total} : ${slide.title}`);
    node.append(slideHeading(slide));
    return node;
  }
  function slideHeading(slide) {
    const top = make("header", "ep-promesse-slide-head");
    const icon = make("span", "ep-promesse-icon");
    icon.innerHTML = ICONS[slide.key];
    top.append(icon, make("h4", "ep-promesse-question", slide.title));
    return top;
  }

  function goTo(index) {
    const target = track.children[index];
    if (!target) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({left: target.offsetLeft - track.offsetLeft, behavior: reduce ? "auto" : "smooth"});
  }

  function nothingLine(slide) {
    if (!notFound || loading || touched.has(slide.key)) return null;
    const value = state[slide.key];
    if (Array.isArray(value) ? value.length : value != null) return null;
    return make("p", "ep-promesse-nothing", `${slide.nothing || "Rien trouvé."} Choisis si tu le sais, sinon passe.`);
  }

  function checklist(slide, index, node) {
    if (loading && !touched.has(slide.key)) {
      const ghost = make("div", "ep-promesse-checks is-loading");
      ghost.setAttribute("aria-hidden", "true");
      for (const _ of slide.list) ghost.append(make("span", "ep-promesse-ghost"));
      node.append(ghost);
      return;
    }
    const line = nothingLine(slide);
    if (line) node.append(line);
    const grid = make("div", "ep-promesse-checks");
    for (const [id, label, detail] of slide.list) {
      const option = make("label", "ep-promesse-check cursor-interaction");
      const input = make("input");
      input.type = "checkbox";
      input.className = "sr-only";
      input.value = id;
      input.checked = state[slide.key].includes(id);
      const box = make("span", "ep-promesse-box");
      box.innerHTML = ICONS.check;
      const text = make("span", "ep-promesse-label");
      text.append(make("b", "", label));
      if (detail) text.append(make("small", "", detail));
      const art = make("img", "ep-choice-art");
      art.alt = "";
      art.src = slide.key === "decor" ? "./art/pal-decors/" + id + ".webp"
        : "./art/questionnaire/" + (slide.key === "humeur" ? "humeur-" + moodArt[id] : "emo-" + id) + ".webp";
      option.append(input, box, art, text);
      input.addEventListener("change", () => {
        touched.add(slide.key);
        const list = state[slide.key].filter(value => value !== id);
        if (input.checked) list.push(id);
        state = {...state, [slide.key]: list};
        refreshEmpty(slide, index, node);
      });
      grid.append(option);
    }
    node.append(grid);
    node.append(make("div", "ep-promesse-empty-slot"));
    refreshEmpty(slide, index, node);
  }

  function refreshEmpty(slide, index, node) {
    const slot = node.querySelector(".ep-promesse-empty-slot");
    if (!slot) return;
    const empty = Array.isArray(state[slide.key]) ? !state[slide.key].length : state[slide.key] == null;
    slot.replaceChildren();
    if (!empty) return;
    const line = make("div", "ep-promesse-empty");
    line.append(make("p", "", "Tu ne sais pas encore ? Laisse vide, ça ira."));
    const skip = make("button", "ep-promesse-skip cursor-interaction", "Passer");
    skip.type = "button";
    skip.addEventListener("click", () => goTo(index + 1));
    line.append(skip);
    slot.append(line);
  }

  function darkness(slide, index, node) {
    const line = nothingLine({...slide, nothing: "Rien trouvé sur son côté sombre."});
    if (line) node.append(line);
    const value = state.noirceur;
    const wrap = make("div", `ep-promesse-range${value == null ? " is-unset" : ""}${loading && !touched.has("noirceur") ? " is-loading" : ""}`);
    const input = make("input");
    input.type = "range";
    input.min = "1";
    input.max = "5";
    input.step = "1";
    input.value = String(value ?? 3);
    input.setAttribute("aria-label", "Son côté sombre, de Doux à Dark");
    const ticks = make("div", "ep-promesse-ticks");
    ticks.setAttribute("aria-hidden", "true");
    for (const [level, word] of NOIRCEUR) {
      const tick = make("span", "", word);
      tick.dataset.level = String(level);
      ticks.append(tick);
    }
    const said = make("p", "ep-promesse-said");
    said.setAttribute("aria-live", "polite");
    const describe = () => {
      const level = state.noirceur;
      if (level == null) { said.replaceChildren(make("b", "", "Pas encore réglée")); input.setAttribute("aria-valuetext", "Pas encore réglée"); return; }
      const [, word, meaning] = NOIRCEUR[level - 1];
      const warnings = level >= 3 && state.avertissements?.length ? ` : ${state.avertissements.slice(0, 3).join(", ")}` : "";
      said.replaceChildren(make("b", "", word), ` · ${meaning}${warnings}`);
      input.setAttribute("aria-valuetext", word);
      for (const tick of ticks.children) tick.classList.toggle("on", Number(tick.dataset.level) === level);
    };
    const set = () => {
      touched.add("noirceur");
      state = {...state, noirceur: Number(input.value)};
      wrap.classList.remove("is-unset");
      describe();
    };
    input.addEventListener("input", set);
    input.addEventListener("pointerdown", () => { if (state.noirceur == null) set(); });
    input.addEventListener("keydown", () => { if (state.noirceur == null) set(); });
    wrap.append(input, ticks);
    node.append(wrap, said);
    describe();
  }

  function spice(slide, index, node) {
    const line = nothingLine({...slide, nothing: "Rien trouvé sur ses scènes."});
    if (line) node.append(line);
    const row = make("div", `ep-promesse-piments${state.spice == null ? " is-unset" : ""}${loading && !touched.has("spice") ? " is-loading" : ""}`);
    row.setAttribute("role", "radiogroup");
    row.setAttribute("aria-label", "Ça chauffe ?");
    const said = make("p", "ep-promesse-said");
    said.setAttribute("aria-live", "polite");
    const draw = () => {
      const level = state.spice;
      row.classList.toggle("is-unset", level == null);
      [...row.children].forEach((button, i) => {
        button.classList.toggle("on", level != null && i < level);
        button.setAttribute("aria-checked", String(level === i + 1));
      });
      if (level == null) said.replaceChildren(make("b", "", "Pas encore réglé"));
      else said.replaceChildren(make("b", "", SPICE[level][1]), ` · ${SPICE[level][2]}`);
    };
    for (let i = 1; i <= 5; i += 1) {
      const button = make("button", `ep-promesse-piment cursor-interaction p${i}`);
      button.type = "button";
      button.setAttribute("role", "radio");
      button.setAttribute("aria-label", SPICE[i][1]);
      button.innerHTML = ICONS.piment;
      button.addEventListener("click", () => {
        touched.add("spice");
        // Retoucher le dernier piment allumé l'éteint
        state = {...state, spice: state.spice === i ? i - 1 : i};
        draw();
      });
      row.append(button);
    }
    node.append(row, said);
    draw();
  }

  function render() {
    const list = SLIDES;
    const keep = track.scrollLeft;
    observer.disconnect();
    track.replaceChildren(...list.map((slide, index) => {
      const node = slideShell(slide, index, list.length);
      if (slide.list) checklist(slide, index, node);
      else {
        darkness(slide, index, node);
        node.append(slideHeading(SPICE_SLIDE));
        spice(SPICE_SLIDE, index, node);
      }
      return node;
    }));
    dots.replaceChildren(...list.map((slide,index) => {
      const button = make("button");
      button.type = "button";
      button.setAttribute("aria-label", slide.title);
      button.append(make("i"));
      button.addEventListener("click", () => goTo(index));
      return button;
    }));
    trace.hidden = true;
    const empty = !state.humeur.length && !state.emotions.length && !state.decor.length && state.noirceur == null && state.pages == null;
    if (notFound && empty && sources) {
      trace.textContent = "Ce que j'ai consulté : " + Object.entries(sources).map(([name, value]) => `${name} · ${value}`).join(" — ");
      trace.hidden = false;
    }
    observer.observe(track);
    for (const slide of track.children) observer.observe(slide,{box:'border-box'});
    track.scrollLeft = keep;
    updateDots();
  }

  function updateDots() {
    const width = (track.children[1]?.offsetLeft - track.children[0]?.offsetLeft) || track.clientWidth || 1;
    const index = Math.round(track.scrollLeft / width);
    [...dots.children].forEach((dot,i) => {
      dot.firstChild.classList.toggle("on", i === index);
      dot.setAttribute("aria-current", i === index ? "step" : "false");
    });
    const active = track.children[index];
    if (!active?.offsetHeight) return;
    let height = active.offsetHeight;
    if (track.closest('[data-format="phone"]') && width > 0) {
      const position = track.scrollLeft / width;
      for (const i of [Math.floor(position), Math.ceil(position)]) {
        height = Math.max(height, track.children[i]?.offsetHeight || 0);
      }
    }
    track.style.height = height + "px";
  }
  track.addEventListener("scroll", updateDots, {passive: true});

  const observer = new ResizeObserver(updateDots);
  observer.observe(track);
  signal?.addEventListener("abort",()=>observer.disconnect(),{once:true});

  const collected=new WeakMap();
  function collect(book, metadata) {
    if (!collected.has(book)) {
      const result=Promise.resolve(metadata).then(()=>{
        if (signal?.aborted) return null;
        const deadline=AbortSignal.timeout(38000);
        return findPromesse(book,signal ? AbortSignal.any([signal,deadline]) : deadline);
      }).catch(()=>null);
      collected.set(book,result);
    }
    return collected.get(book);
  }

  let pending;
  function prefill(book, summaryReady) {
    const key = [book?.id, book?.title, book?.author].join("|");
    if (!book || key === bookKey) return pending;
    bookKey = key;
    pending = fill(book, summaryReady);
    return pending;
  }
  async function fill(book, summaryReady) {
    request?.abort();
    const controller = new AbortController();
    request = controller;
    if (book.promesse) {
      state = {...emptyPromesse(), ...book.promesse};
      onPages?.(book,state.pages);
      loading = false;
      notFound = false;
      render();
      return;
    }
    loading = true;
    notFound = false;
    render();
    // Les réponses du formulaire utilisent la notice enrichie et sa pagination.
    const result = await collect(book,summaryReady);
    if (controller.signal.aborted) return;
    sources = result?.sources || null;
    const found = {...result?.promesse};
    if (globalThis.BookMetadata.editionPages(book.pageCount)) found.pages=book.pageCount;
    if (controller.signal.aborted) return;
    const kept = Object.fromEntries([...touched].map(name => [name, state[name]]));
    state = {...fillGaps(emptyPromesse(), found || {}), ...kept};
    onPages?.(book,state.pages);
    loading = false;
    notFound = true;
    render();
  }

  function retry(book,metadata) {
    collected.delete(book);
    bookKey="";
    return prefill(book,metadata);
  }

  function clear() {
    request?.abort();
    pending = null;
    state = emptyPromesse();
    touched = new Set();
    loading = false;
    notFound = false;
    bookKey = "";
    sources = null;
    setOpen(true);
    render();
  }

  function setVisible(visible) {
    const was = !section.hidden;
    section.hidden = !visible;
    if (visible && !was) setOpen(true);
  }

  function values() {
    const result = {...state};
    const filled = result.humeur.length || result.emotions.length || result.decor.length ||
      result.noirceur != null || result.spice != null || result.pages != null;
    return filled ? result : null;
  }

  render();
  return {collect, prefill, retry, clear, values, setVisible};
}

export function renderPalDetail(root,book,save,statusChange) {
  const node=(tag,cls,text)=>make(tag,cls,text);
  const hero=node('div','pal-detail-hero'), meta=node('div','pal-detail-meta');
  const cover=node('img','pal-detail-cover');cover.alt=book.title;
  if(book.coverData)cover.src=book.coverData;else cover.hidden=true;
  hero.append(cover,meta);
  const title=node('div','pal-detail-title');
  title.append(node('h1','',book.title));
  const info=node('details','pal-detail-info'), icon=node('summary','','ⓘ');
  icon.setAttribute('aria-label','Informations sur l’édition');
  const pages=book.promesse?.pages || book.pageCount || book.pages;
  info.append(icon,node('div','',[book.publicationDate && 'Date de sortie · '+book.publicationDate,pages && pages+' pages'].filter(Boolean).join(' · ') || 'Informations indisponibles'));
  title.append(info);meta.append(title);
  const series=book.spinOffOf ? 'Spin-Off de '+book.spinOffOf : [book.series || book.saga,book.volume && (/^tome/i.test(book.volume)?book.volume:'Tome '+book.volume)].filter(Boolean).join(' · ');
  for(const [cls,text] of [['pal-detail-author',book.author],['pal-detail-series',series],['pal-detail-genre',(book.genres || []).join(' · ')]])if(text)meta.append(node('div',cls,text));
  const controls=node('div','pal-detail-controls');
  function select(label,choices,value,change){
    const field=node('label','',label), input=node('select');
    for(const [key,name] of choices)input.add(new Option(name,key));
    input.value=value;input.onchange=()=>save(change(input.value));field.append(input);controls.append(field);
  }
  select('Statut',[['À lire','À lire'],['En cours','En cours'],['Terminé','Lu']],book.status,v=>statusChange(book,v));
  const ongoing = book.status === 'En cours';
  if (ongoing) {
    const start = book.readingStart;
    const date = typeof start==='string' ? start : [start?.day,start?.month,start?.year].filter(Boolean).join('/');
    if(date){
      const field=node('label','','Début de lecture');
      field.append(node('span','',date));controls.append(field);
    }
  } else select('Priorité',[['Plus tard','À lire plus tard'],['Bientôt','À lire bientôt'],['En premier','À lire en priorité']],book.readingPriority||'Bientôt',v=>({readingPriority:v}));
  meta.append(controls);root.replaceChildren(hero);
  const tags=node('div','pal-detail-tags');
  for(const [label,values] of [['Sous-genres',book.subgenres],['Tropes',book.tropes]])if(values?.length){
    const row=node('div');row.append(node('i','',label),node('span','',values.join(' · ')));tags.append(row);
  }
  if(tags.childElementCount)root.append(tags);
  function heading(label,art){const h=node('h2');h.innerHTML=art;h.append(document.createTextNode(label));return h;}
  if(book.summary)root.append(heading('Résumé',svg('<path d="M6 26 24 7M9 21C7 10 18 4 27 4c-1 10-7 19-18 17z"/>')),node('p','pal-detail-summary',book.summary));
  if(ongoing){
    root.append(heading('Ma progression',svg('<path d="M8 5h15v23l-7.5-5L8 28zM25 1l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/>')));
    const pos=book.readingPosition || {}, initial=book.readingJournal || {};
    const tracked=Number.isFinite(pos.percent);
    const percent=tracked ? pos.percent : initial.percent ?? book.progress;
    const page=tracked ? pos.page : initial.page ?? (pos.unit==='page'?pos.value:null);
    const chapter=tracked ? pos.chapter : initial.chapter ?? book.chapter ?? (pos.unit==='chapter'?pos.value:null);
    const numbers=node('div','fiche-positions');
    for(const [label,value] of [['Page',page],['Chapitre',chapter],['Progression',percent==null?null:percent+' %']]){
      const col=node('div');col.append(node('small','',label),node('span','',String(value??'—')));numbers.append(col);
    }
    const line=node('div','fiche-track'), fill=node('div','fiche-fill');
    fill.style.width=Math.max(0,Math.min(100,Number(percent)||0))+'%';
    if(percent!=null) fill.append(node('span','','✦'));
    line.append(fill);root.append(numbers,line);return;
  }
  const promise=book.promesse || {},rows=node('div','pal-detail-rows');
  for(const slide of [...SLIDES,SPICE_SLIDE]){
    const key=slide.key,value=promise[key];
    if(value==null)continue;
    const row=node('section'),h=node('h3');h.innerHTML=ICONS[key];h.append(node('span','',slide.title));row.append(h);
    if(slide.list){
      const selected=slide.list.filter(([id])=>Array.isArray(value)&&value.includes(id));
      if(!selected.length)continue;
      if(key==='decor'){
        const gallery=node('div','pal-detail-gallery');
        for(const [id,label] of selected){const fig=node('figure'),img=node('img');img.src='./art/pal-decors/'+id+'.webp';img.alt='';fig.append(img,node('figcaption','',label));gallery.append(fig);}row.append(gallery);
      }else row.append(node('p','',selected.map(x=>x[1]).join(' · ')));
    }else{
      const level=(key==='spice'?SPICE:NOIRCEUR).find(x=>x[0]===Number(value));if(!level)continue;
      if(key==='spice'){const peppers=node('div','pal-detail-peppers');for(let i=1;i<=5;i++){const s=node('span',i<=value?'on':'');s.innerHTML=ICONS.piment;peppers.append(s);}row.append(peppers);}
      row.append(node('p','',key==='spice'?level[2]:level.slice(1).join(' · ')));
    }
    rows.append(row);
  }
  if(rows.childElementCount)root.append(heading('Ce qu’il me promet',ICONS.pages),rows);
}
