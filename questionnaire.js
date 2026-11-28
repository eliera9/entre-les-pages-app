// Le dé de la pile et le questionnaire « Ta prochaine lecture ».
// Validé slide par slide le 24 novembre (cahier des charges, zone 3).
import {findPromesse, makeReadingArt} from "./promesse-form.js?v=promesse-litteraire-1";
import {HUMEURS, EMOTIONS, DECORS, normalizeHumeurs} from "./promesse.js?v=promesse-litteraire-1";

const ART = name => `./art/questionnaire/${name}.webp`;
const DAY = 86400000;

const decorOptions = new Map(DECORS);
const decorGroups = [
  ["Une saison", ["hiver", "ete"]],
  ["Un lieu", ["mer", "campagne", "ville-nuit", "campus", "petite-ville", "manoir", "foret-ancienne", "ville-autrefois"]],
  ["Ailleurs", ["chateau", "autre-monde"]],
].map(([name, ids]) => [name, ids.map(id => [id, decorOptions.get(id)])]);
const TROPE_ART = {
  "found family": "trope-found-family", "second chance": "trope-second-chance", "forced proximity": "trope-forced-proximity",
  "grumpy sunshine": "trope-grumpy-sunshine", "grumpy x sunshine": "trope-grumpy-sunshine", "grumpy/sunshine": "trope-grumpy-sunshine",
  "huis clos": "trope-huis-clos", "locked room": "trope-huis-clos", "enemies to lovers": "trope-enemies-to-lovers", "slow burn": "trope-slow-burn",
};
const GENRE_ART = [
  [/dark romance/i, "genre-dark-romance"], [/romantasy/i, "genre-romantasy"], [/romance/i, "genre-romance-contemporaine"],
  [/thriller|polar|policier|suspense/i, "genre-thriller"], [/fantasy|fantastique/i, "genre-fantasy"],
];
const TEMPS = [
  ["soiree", "1 soirée", "moins de 300 pages", "temps-1-soiree", 300],
  ["jours", "3 à 5 jours", "300 à 500 pages", "temps-3-a-5-jours", 500],
  ["semaine", "1 semaine et +", "plus de 500 pages", "temps-1-semaine", Infinity],
];
const NOIRCEUR = [
  ["Feel good", "tu refermes le livre avec le sourire", "noirceur-feel-good", 2],
  ["Doux‑amer", "quelques larmes, mais ça finit bien", "noirceur-doux-amer", 3],
  ["Dark", "thèmes durs, ça secoue", "noirceur-dark", 5],
];
const SPICE = [
  ["Clean", "aucune scène"], ["Bisous", "des baisers, rien de plus"], ["Porte fermée", "ça se passe hors de la page"],
  ["Porte ouverte", "quelques scènes sur la page"], ["Spicy", "des scènes fréquentes et détaillées"], ["Très spicy", "c'est le cœur du livre"],
];
const SAGA = [
  ["suite", "La suite d'une saga", "le tome d'après celui que tu as lu"],
  ["tome1", "Un tome 1", "le début d'une saga"],
  ["oneshot", "Un one shot", "une histoire en un seul livre"],
];
const PAL = [
  ["ancien", "Un ancien de ma PAL", "dans ta PAL depuis plus d'un an"],
  ["milieu", "Un du milieu", "entre 3 mois et un an"],
  ["nouveau", "Une nouveauté", "arrivé il y a moins de 3 mois"],
];
const ROMANCE = /romance|romantasy|new adult|sentimental/i;

const CHECK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CLOSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
const BACK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
const art = (name, extra = "") => {
  const node = make("span", `qz-art ${extra}`.trim());
  node.style.setProperty("--art", `url("${ART(name)}")`);
  node.setAttribute("aria-hidden", "true");
  return node;
};
const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const lower = value => String(value || "").trim().toLowerCase();
const volumeOf = book => {
  const match = String(book.volume ?? "").replace(",", ".").match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : NaN;
};
// Titre avec initiale manuscrite
function title(text, tag = "h2") {
  const node = make(tag, "qz-title");
  node.setAttribute("aria-label", text);
  const initial = make("span", "qz-initial", text[0]);
  initial.setAttribute("aria-hidden", "true");
  const rest = make("span", "", text.slice(1));
  rest.setAttribute("aria-hidden", "true");
  node.append(initial, rest);
  return node;
}

export function mountQuestionnaire({host, books, cover, openBook, startBook, saveBook}) {
  let state = {step: -1, answers: {}, visited: new Set()};
  let overlay = null;
  let card = null;
  let trigger = null;
  let enrichment = null;
  let enrichDone = Promise.resolve();
  let results = null;

  const pile = () => books().filter(book => book.status === "À lire");
  const sagaInfo = () => {
    const read = new Map();
    for (const book of books()) {
      if (!book.saga || book.status !== "Terminé") continue;
      const volume = volumeOf(book);
      if (Number.isFinite(volume)) read.set(lower(book.saga), Math.max(read.get(lower(book.saga)) || 0, volume));
    }
    return read;
  };
  const sagaKind = (book, read) => {
    if (!book.saga) return "oneshot";
    const volume = volumeOf(book);
    const last = read.get(lower(book.saga)) || 0;
    if (last > 0) return "suite";
    return volume === 1 || !Number.isFinite(volume) ? "tome1" : "later";
  };
  const addedAt = book => Number(book.addedAt) || null;
  const palKind = book => {
    const time = addedAt(book);
    if (!time) return null;
    const age = Date.now() - time;
    return age > 365 * DAY ? "ancien" : age < 90 * DAY ? "nouveau" : "milieu";
  };

  // Les slides (ordre validé). « visible » cache une slide sans réponse possible.
  const SLIDES = [
    {key: "humeur", text: "De quelle humeur de lecture as-tu envie ?", weight: 3, kind: "cards", idk: true,
      groups: () => [["", HUMEURS.map(([id, label, detail]) => [id, label, null, null, detail])]]},
    {key: "emotions", text: "En refermant le livre, tu veux…", weight: 3, kind: "cards", idk: true, groups: () => [["", EMOTIONS]]},
    {key: "decor", text: "En lisant, tu veux être…", weight: 2, kind: "cards", idk: true, groups: () => decorGroups},
    {key: "tropes", text: "Côté histoire, tu as envie de…", weight: 1, kind: "cards", surprise: true,
      groups: () => [["", countValues(pile(), book => book.tropes).slice(0, 12).map(([name, count]) => [name, name, TROPE_ART[lower(name)] || null, count])]],
      visible: () => pile().some(book => book.tropes?.length)},
    {key: "genres", text: "Tu pioches sur quelle étagère ?", weight: 2, kind: "cards", surprise: true,
      groups: () => {
        const list = countValues(pile(), book => book.genres).slice(0, 12);
        const card = ([name, count]) => [name, name, GENRE_ART.find(([pattern]) => pattern.test(name))?.[1] || null, count];
        return [["De la romance", list.filter(([name]) => ROMANCE.test(name)).map(card)], ["Sans romance", list.filter(([name]) => !ROMANCE.test(name)).map(card)]]
          .filter(([, items]) => items.length);
      },
      visible: () => pile().some(book => book.genres?.length)},
    {key: "temps", text: "Ce livre, tu le lis en…", weight: 1, kind: "frise", surprise: true},
    {key: "noirceur", text: "Ta lecture, tu la veux plutôt…", weight: 2, kind: "noirceur"},
    {key: "spice", text: "Ta romance, tu la veux plutôt…", weight: 1, kind: "spice",
      visible: () => (state.answers.genres || []).some(name => ROMANCE.test(name))},
    {key: "saga", text: "Ce soir, tu as envie de…", weight: 1, kind: "saga", surprise: true},
    {key: "pal", text: "Ce soir, tu sors de ta PAL…", weight: 1, kind: "pal", visible: () => pile().some(addedAt)},
  ];
  const slides = () => SLIDES.filter(slide => !slide.visible || slide.visible());

  function countValues(list, pick) {
    const counts = new Map();
    for (const book of list) for (const value of pick(book) || []) {
      const name = String(value).trim();
      if (name) counts.set(name, (counts.get(name) || 0) + 1);
    }
    return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr"));
  }

  // Remplit en arrière-plan « ce qu'il me promet » des livres de la pile qui ne l'ont pas encore
  function enrichPile() {
    if (enrichment) return enrichDone;
    const missing = pile().filter(book => !book.promesse).slice(0, 40);
    if (!missing.length) return enrichDone;
    enrichment = new AbortController();
    const signal = enrichment.signal;
    enrichDone = (async () => {
      for (const book of missing) {
        if (signal.aborted) return;
        const found = await findPromesse(book, signal).catch(() => null);
        if (!found || signal.aborted) continue;
        try { await saveBook({...book, promesse: found.promesse}); } catch {}
      }
    })().finally(() => { enrichment = null; });
    return enrichDone;
  }

  function score(book, answers, read) {
    const promesse = book.promesse || {};
    let got = 0;
    let max = 0;
    const add = (weight, ok) => { max += weight; if (ok) got += weight; };
    const has = (list, wanted) => (list || []).some(value => wanted.includes(value));
    if (answers.humeur?.length) add(3, has(normalizeHumeurs(promesse.humeur), answers.humeur));
    if (answers.emotions?.length) add(3, has(promesse.emotions, answers.emotions));
    if (answers.decor?.length) add(2, has(promesse.decor, answers.decor));
    if (answers.tropes?.length) add(1, (book.tropes || []).some(name => answers.tropes.includes(String(name).trim())));
    if (answers.genres?.length) add(2, (book.genres || []).some(name => answers.genres.includes(String(name).trim())));
    if (answers.temps?.length) {
      const limit = Math.max(...answers.temps.map(id => TEMPS.find(item => item[0] === id)?.[4] || 0));
      const pages = Number(promesse.pages);
      add(1, limit === Infinity || (pages > 0 && pages <= limit));
    }
    if (answers.noirceur != null) add(2, promesse.noirceur != null && promesse.noirceur <= NOIRCEUR[answers.noirceur][3]);
    if (answers.spice != null) {
      const romance = (book.genres || []).some(name => ROMANCE.test(name));
      const spice = promesse.spice ?? (romance ? null : 0);
      add(1, spice != null && spice <= answers.spice);
    }
    if (answers.saga?.length) add(1, answers.saga.includes(sagaKind(book, read)));
    if (answers.pal != null) add(1, palKind(book) === PAL[answers.pal][0]);
    return {got, max};
  }

  function rank() {
    const read = sagaInfo();
    // « Passer », « Je ne sais pas trop » et « Surprends-moi » ne comptent pas
    const answers = {};
    for (const [key, value] of Object.entries(state.answers)) {
      if (Array.isArray(value)) {
        const kept = value.filter(id => id !== "__vide");
        if (kept.length) answers[key] = kept;
      } else if (value != null) answers[key] = value;
    }
    if (!(answers.genres || []).some(name => ROMANCE.test(name))) delete answers.spice;
    const candidates = pile().filter(book => {
      // Jamais le tome 2 avant le tome 1
      if (!book.saga) return true;
      const volume = volumeOf(book);
      if (!Number.isFinite(volume) || volume <= 1) return true;
      return volume <= (read.get(lower(book.saga)) || 0) + 1;
    });
    return candidates.map(book => {
      const {got, max} = score(book, answers, read);
      return {book, pct: max ? Math.round(100 * got / max) : null, tie: Math.random()};
    }).sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0) || a.tie - b.tie);
  }

  /* ---------- Ouverture : le dé roule, la carte sort du dé ---------- */
  function open(fromButton) {
    if (overlay) return;
    trigger = fromButton;
    const dice = fromButton?.querySelector(".acc-dice-art") || fromButton;
    if (dice && !reduceMotion()) {
      dice.classList.remove("is-rolling");
      void dice.offsetWidth;
      dice.classList.add("is-rolling");
    }
    enrichPile();
    setTimeout(build, reduceMotion() ? 0 : 420);
  }

  function originOf() {
    const origin = trigger?.querySelector(".next-reading-die") || trigger;
    const rect = origin?.getBoundingClientRect();
    return rect ? {x: rect.left + rect.width / 2, y: rect.top + rect.height / 2} : {x: innerWidth / 2, y: innerHeight / 2};
  }

  // La carte grandit depuis le dé et y retourne : l'origine se calcule sans la mise à l'échelle
  function setOrigin(node) {
    const {x, y} = originOf();
    const left = innerWidth / 2 - node.offsetWidth / 2;
    const top = innerHeight / 2 - node.offsetHeight / 2;
    node.style.transformOrigin = `${Math.round(x - left)}px ${Math.round(y - top)}px`;
  }

  function build() {
    overlay = make("div", "qz-overlay");
    const veil = make("div", "qz-veil");
    veil.addEventListener("click", () => close());
    card = make("section", "qz-card");
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");
    card.setAttribute("aria-label", "Ta prochaine lecture");
    card.tabIndex = -1;
    overlay.append(veil, card);
    host.append(overlay);
    document.documentElement.classList.add("qz-lock");
    setOrigin(card);
    overlay.addEventListener("keydown", event => {
      if (event.key === "Escape") { event.preventDefault(); close(); }
      if (event.key === "Tab") trapFocus(event);
    });
    if (state.step === "fin" && results) {
      card.classList.add("is-full");
      renderEnd(0);
    } else if (state.step >= 0 && state.step !== "fin") {
      card.classList.add("is-full");
      renderStep();
    } else renderIntro();
    requestAnimationFrame(() => overlay.classList.add("is-open"));
    card.focus({preventScroll: true});
  }

  function trapFocus(event) {
    const items = [...card.querySelectorAll("button:not([disabled]), input, [tabindex='0']")].filter(item => item.offsetParent);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  function close(after) {
    if (!overlay) return;
    const leaving = overlay;
    const leavingCard = card;
    overlay = null;
    card = null;
    if (leavingCard?.classList.contains("is-full")) {
      leavingCard.classList.remove("is-full");
      setOrigin(leavingCard);
    }
    leaving.classList.remove("is-open");
    leaving.classList.add("is-closing");
    const done = () => {
      leaving.remove();
      document.documentElement.classList.remove("qz-lock");
      if (after) after();
      else trigger?.focus({preventScroll: true});
    };
    if (reduceMotion()) done();
    else setTimeout(done, 280);
  }

  function closeButton() {
    const button = make("button", "qz-close cursor-interaction");
    button.type = "button";
    button.setAttribute("aria-label", "Fermer");
    button.innerHTML = CLOSE;
    button.addEventListener("click", () => close());
    return button;
  }

  /* ---------- L'accueil de la carte ---------- */
  function renderIntro() {
    card.classList.remove("is-full");
    const count = pile().length;
    const medal = make("div", "qz-medal");
    medal.append(art("de", "qz-medal-art"));
    const meta = make("p", "qz-meta", `Ta pile · ${count} livre${count > 1 ? "s" : ""}`);
    const phrase = make("p", "qz-phrase", "Dis-moi comment tu te sens, je fouille ta pile.");
    const start = make("button", "qz-start cursor-interaction");
    start.type = "button";
    start.append(art("de", "qz-btn-art"), make("span", "", state.step === -1 && !Object.keys(state.answers).length ? "Commencer" : "Reprendre"));
    start.addEventListener("click", () => {
      if (state.step === -1 || state.step === "fin") { state.step = 0; }
      expand();
    });
    const random = make("button", "qz-random cursor-interaction");
    random.type = "button";
    const randomMedal = make("span", "qz-random-medal");
    randomMedal.append(art("de", "qz-random-art"));
    random.append(randomMedal, make("span", "", "Au hasard"));
    random.addEventListener("click", () => {
      state = {step: "fin", answers: {}, visited: new Set()};
      expand(true);
    });
    const body = make("div", "qz-intro");
    body.append(medal, meta, title("Ta prochaine lecture"), phrase, start, random);
    if (!count) {
      start.disabled = true;
      random.disabled = true;
      phrase.textContent = "Ta pile est vide pour l'instant. Ajoute un livre « à lire » et reviens me voir.";
    }
    card.replaceChildren(closeButton(), body);
  }

  function expand(toEnd = false) {
    card.classList.add("is-full");
    if (toEnd) searchThenEnd();
    else renderStep();
  }

  /* ---------- Les écrans de question ---------- */
  function renderStep(direction = 1) {
    const list = slides();
    if (state.step >= list.length) { searchThenEnd(); return; }
    const index = Math.max(0, Math.min(state.step, list.length - 1));
    state.step = index;
    const slide = list[index];
    state.visited.add(slide.key);

    const head = make("header", "qz-head");
    const back = make("button", "qz-back cursor-interaction");
    back.type = "button";
    back.innerHTML = BACK;
    back.setAttribute("aria-label", index ? "Question d'avant" : "Revenir à l'accueil du questionnaire");
    back.addEventListener("click", () => {
      if (index === 0) { state.step = -1; renderIntroInFull(); }
      else { state.step = index - 1; renderStep(-1); }
    });
    const dots = make("div", "qz-dots");
    dots.setAttribute("role", "group");
    dots.setAttribute("aria-label", `Question ${index + 1} sur ${list.length}`);
    list.forEach((item, i) => {
      const dot = make("button", "qz-dot");
      dot.type = "button";
      dot.setAttribute("aria-label", `Question ${i + 1}`);
      if (i === index) { dot.classList.add("now"); dot.setAttribute("aria-current", "step"); }
      else if (state.visited.has(item.key)) dot.classList.add("on");
      dot.disabled = !state.visited.has(item.key) && i !== index;
      dot.addEventListener("click", () => { if (i !== index) { state.step = i; renderStep(i > index ? 1 : -1); } });
      dots.append(dot);
    });
    head.append(back, dots, closeButton());

    const pane = make("div", "qz-pane");
    pane.append(title(slide.text));
    const foot = make("footer", "qz-foot");
    const skip = make("button", "qz-skip cursor-interaction", "Passer");
    skip.type = "button";
    const go = make("button", "qz-go cursor-interaction", index === list.length - 1 ? "Voir mes livres" : "Continuer");
    go.type = "button";
    const next = () => { state.step = index + 1; renderStep(1); };
    skip.addEventListener("click", () => { delete state.answers[slide.key]; next(); });
    go.addEventListener("click", next);
    foot.append(skip, go);

    const refresh = () => {
      const value = state.answers[slide.key];
      go.disabled = value == null || (Array.isArray(value) && !value.length);
    };
    if (slide.kind === "cards") cards(slide, pane, refresh);
    else if (slide.kind === "frise") frise(slide, pane, refresh);
    else if (slide.kind === "noirceur") noirceur(pane, refresh);
    else if (slide.kind === "spice") spice(pane, refresh);
    else if (slide.kind === "saga") saga(pane, refresh);
    else pal(pane, refresh);
    refresh();

    const scroller = make("div", "qz-scroll");
    scroller.append(pane);
    const screen = make("div", "qz-screen");
    screen.append(head, scroller, foot);
    if (!reduceMotion()) screen.classList.add(direction < 0 ? "from-left" : "from-right");
    card.replaceChildren(screen);
    card.focus({preventScroll: true});
  }

  function renderIntroInFull() {
    card.classList.remove("is-full");
    renderIntro();
  }

  // Une réponse « vide » (Je ne sais pas trop, Surprends-moi) ne compte pas dans le calcul
  function toggle(slide, id, exclusive) {
    const list = new Set(state.answers[slide.key] || []);
    if (exclusive) {
      if (list.has(id)) list.delete(id); else { list.clear(); list.add(id); }
    } else {
      list.delete("__vide");
      list.has(id) ? list.delete(id) : list.add(id);
    }
    state.answers[slide.key] = [...list];
  }

  function choiceCard(slide, [id, label, image, count, detail], refresh, extraClass = "") {
    const button = make("button", `qz-choice cursor-interaction ${extraClass}`.trim());
    button.type = "button";
    const selected = () => (state.answers[slide.key] || []).includes(id);
    button.setAttribute("aria-pressed", String(selected()));
    if (id !== "__vide" && (slide.key === "humeur" || slide.key === "emotions")) {
      button.append(makeReadingArt(slide.key === "humeur" ? "moods" : "feelings", id));
    } else if (id !== "__vide" && slide.key === "decor") {
      const decor = make("img", "qz-decor-art");
      decor.alt = "";
      decor.src = "./art/pal-decors/" + id + ".webp";
      button.append(decor);
    } else if (image) button.append(art(image));
    const text = make("span", "qz-choice-text");
    text.append(make("b", "", label));
    if (detail) text.append(make("small", "", detail));
    if (count) text.append(make("small", "", `${count} livre${count > 1 ? "s" : ""}`));
    const tick = make("i", "qz-tick");
    tick.innerHTML = CHECK;
    button.append(text, tick);
    button.addEventListener("click", () => {
      toggle(slide, id, id === "__vide");
      for (const other of button.closest(".qz-pane").querySelectorAll(".qz-choice")) {
        other.setAttribute("aria-pressed", String((state.answers[slide.key] || []).includes(other.dataset.id)));
      }
      refresh();
    });
    button.dataset.id = id;
    return button;
  }

  function cards(slide, pane, refresh) {
    for (const [family, items] of slide.groups()) {
      if (!items.length) continue;
      if (family) pane.append(make("p", "qz-family", family));
      const grid = make("div", "qz-grid");
      for (const item of items) grid.append(choiceCard(slide, item, refresh));
      pane.append(grid);
    }
    const tail = make("div", "qz-grid qz-tail");
    if (slide.idk) tail.append(choiceCard(slide, ["__vide", "Je ne sais pas trop", "je-ne-sais-pas"], refresh, "is-dashed"));
    if (slide.surprise) tail.append(choiceCard(slide, ["__vide", "Surprends-moi", "surprends-moi"], refresh, "is-dashed"));
    if (tail.children.length) pane.append(tail);
  }

  function frise(slide, pane, refresh) {
    const line = make("div", "qz-frise");
    line.append(make("span", "qz-thread"));
    for (const [id, label, sub, image] of TEMPS) {
      const button = choiceCard(slide, [id, label, image], refresh, "qz-step");
      button.querySelector(".qz-choice-text").append(make("small", "", sub));
      line.append(button);
    }
    pane.append(line);
    const tail = make("div", "qz-grid qz-tail");
    tail.append(choiceCard(slide, ["__vide", "Surprends-moi", "surprends-moi"], refresh, "is-dashed"));
    pane.append(tail);
  }

  function slider({min, max, value, label, onInput, className = ""}) {
    const input = make("input", `qz-range ${className}`.trim());
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.step = "1";
    input.value = String(value);
    input.setAttribute("aria-label", label);
    input.addEventListener("input", () => onInput(Number(input.value)));
    return input;
  }

  function noirceur(pane, refresh) {
    if (state.answers.noirceur == null) state.answers.noirceur = 1;
    const picture = make("div", "qz-level-art");
    const word = make("p", "qz-word");
    const said = make("p", "qz-said");
    const draw = level => {
      const [name, phrase, image] = NOIRCEUR[level];
      picture.replaceChildren(art(image, "qz-art-big"));
      word.replaceChildren(make("small", "", "jusqu'à… "), name);
      said.textContent = phrase;
      input.setAttribute("aria-valuetext", `jusqu'à ${name}`);
    };
    const input = slider({min: 0, max: 2, value: state.answers.noirceur, label: "Ta lecture, jusqu'à quel point sombre", className: "is-dark",
      onInput: level => { state.answers.noirceur = level; draw(level); refresh(); }});
    const ends = make("div", "qz-ends");
    ends.append(make("span", "", "Feel good"), make("span", "", "Dark"));
    pane.append(picture, word, said, input, ends);
    draw(state.answers.noirceur);
  }

  function spice(pane, refresh) {
    if (state.answers.spice == null) state.answers.spice = 2;
    const peppers = make("div", "qz-peppers");
    peppers.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 5; i += 1) peppers.append(art("piment", "qz-pepper"));
    const word = make("p", "qz-word");
    const said = make("p", "qz-said");
    const draw = level => {
      [...peppers.children].forEach((pepper, i) => pepper.classList.toggle("on", i < level));
      word.replaceChildren(make("small", "", "jusqu'à… "), SPICE[level][0]);
      said.textContent = SPICE[level][1];
      input.setAttribute("aria-valuetext", `jusqu'à ${SPICE[level][0]}`);
    };
    const input = slider({min: 0, max: 5, value: state.answers.spice, label: "Ta romance, jusqu'à quel point épicée", className: "is-spice",
      onInput: level => { state.answers.spice = level; draw(level); refresh(); }});
    const ends = make("div", "qz-ends");
    ends.append(make("span", "", "Clean"), make("span", "", "Très spicy"));
    pane.append(peppers, word, said, input, ends);
    draw(state.answers.spice);
  }

  function coverStack(list) {
    const stack = make("span", "qz-covers");
    stack.setAttribute("aria-hidden", "true");
    for (const book of list.slice(0, 3)) {
      const slot = make("span", "qz-cover");
      slot.append(cover(book));
      stack.append(slot);
    }
    return stack;
  }

  function saga(pane, refresh) {
    const slide = SLIDES.find(item => item.key === "saga");
    const read = sagaInfo();
    const groups = new Map(SAGA.map(([id]) => [id, []]));
    for (const book of pile()) {
      const kind = sagaKind(book, read);
      if (groups.has(kind)) groups.get(kind).push(book);
    }
    const list = make("div", "qz-lines");
    for (const [id, label, sub] of SAGA) {
      const items = groups.get(id);
      if (!items.length) continue;
      const button = choiceCard(slide, [id, label, null, items.length], refresh, "qz-line");
      button.querySelector(".qz-choice-text").insertBefore(make("small", "qz-sub", sub), button.querySelector(".qz-choice-text small"));
      button.prepend(coverStack(items));
      list.append(button);
    }
    pane.append(list);
    const tail = make("div", "qz-grid qz-tail");
    tail.append(choiceCard(slide, ["__vide", "Surprends-moi", "surprends-moi"], refresh, "is-dashed"));
    pane.append(tail);
  }

  function pal(pane, refresh) {
    if (state.answers.pal == null) state.answers.pal = 1;
    const groups = new Map(PAL.map(([id]) => [id, []]));
    for (const book of pile()) {
      const kind = palKind(book);
      if (kind) groups.get(kind).push(book);
    }
    for (const list of groups.values()) list.sort((a, b) => addedAt(a) - addedAt(b));
    const covers = make("div", "qz-pal-covers");
    const word = make("p", "qz-word");
    const said = make("p", "qz-said");
    const count = make("p", "qz-count");
    const draw = level => {
      const [id, name, phrase] = PAL[level];
      const items = groups.get(id);
      covers.replaceChildren(coverStack(items));
      if (!items.length) covers.append(make("span", "qz-none", "Aucun livre ici"));
      word.textContent = name;
      said.textContent = phrase;
      count.textContent = `${items.length} livre${items.length > 1 ? "s" : ""}`;
      input.setAttribute("aria-valuetext", name);
    };
    const input = slider({min: 0, max: 2, value: state.answers.pal, label: "Ce soir, tu sors de ta PAL",
      onInput: level => { state.answers.pal = level; draw(level); refresh(); }});
    const ends = make("div", "qz-ends");
    ends.append(make("span", "", "Un ancien"), make("span", "", "Une nouveauté"));
    pane.append(covers, word, said, input, ends, count);
    draw(state.answers.pal);
  }

  /* ---------- « Je fouille ta pile… » puis la slide de fin ---------- */
  async function searchThenEnd() {
    state.step = "fin";
    const wait = make("div", "qz-wait");
    const dice = art("de", "qz-wait-art");
    wait.append(dice, title("Je fouille ta pile…", "p"));
    card.replaceChildren(closeButton(), wait);
    const pause = new Promise(resolve => setTimeout(resolve, reduceMotion() ? 300 : 1200));
    const ready = Promise.race([enrichDone, new Promise(resolve => setTimeout(resolve, 8000))]);
    await Promise.all([pause, ready]);
    if (!card) return;
    results = rank();
    renderEnd(0);
  }

  function renderEnd(offset) {
    if (!card) return;
    if (!results.length) {
      const empty = make("div", "qz-end");
      empty.append(title("Ta pile est vide"), make("p", "qz-low", "Ajoute un livre « à lire » pour que je puisse fouiller."));
      card.replaceChildren(closeButton(), empty);
      return;
    }
    const ordered = [...results.slice(offset), ...results.slice(0, offset)];
    const [best, ...rest] = ordered;
    const answeredSomething = best.pct != null;
    const low = answeredSomething && best.pct < 50;
    const end = make("div", "qz-end");
    end.append(title(low ? "Les plus proches de ton envie" : "Ce soir, ce sera…"));
    if (low) end.append(make("p", "qz-low", "Aucun livre de ta pile ne coche tout. Voici ceux qui s'en approchent le plus."));

    const main = make("button", "qz-best cursor-interaction");
    main.type = "button";
    main.setAttribute("aria-label", `${best.book.title}, ouvrir la fiche`);
    const big = make("span", "qz-best-cover");
    big.append(cover(best.book));
    main.append(big, make("b", "qz-best-title", best.book.title));
    if (best.book.author) main.append(make("span", "qz-best-author", best.book.author));
    if (answeredSomething) main.append(make("span", "qz-pct", `${best.pct} % pour toi`));
    main.addEventListener("click", () => close(() => openBook(best.book)));
    end.append(main);

    const others = rest.slice(0, 2);
    if (others.length) {
      end.append(make("p", "qz-also", "Et aussi"));
      const row = make("div", "qz-also-row");
      for (const item of others) {
        const small = make("button", "qz-small cursor-interaction");
        small.type = "button";
        small.setAttribute("aria-label", `${item.book.title}, ouvrir la fiche`);
        const slot = make("span", "qz-small-cover");
        slot.append(cover(item.book));
        small.append(slot, make("b", "", item.book.title));
        if (item.pct != null) small.append(make("span", "qz-pct is-small", `${item.pct} %`));
        small.addEventListener("click", () => close(() => openBook(item.book)));
        row.append(small);
      }
      end.append(row);
    }

    const foot = make("div", "qz-end-foot");
    const startNow = make("button", "qz-start cursor-interaction", "Je le commence");
    startNow.type = "button";
    startNow.addEventListener("click", () => {
      startNow.disabled = true;
      const book = best.book;
      state = {step: -1, answers: {}, visited: new Set()};
      close(() => startBook(book));
    });
    foot.append(startNow);
    if (results.length > 1) {
      const notThis = make("button", "qz-not cursor-interaction", "Pas celui-là");
      notThis.type = "button";
      notThis.addEventListener("click", () => renderEnd((offset + 1) % results.length));
      foot.append(notThis);
    }
    const again = make("button", "qz-again cursor-interaction", "Refaire le questionnaire");
    again.type = "button";
    again.addEventListener("click", () => { state = {step: 0, answers: {}, visited: new Set()}; renderStep(1); });
    foot.append(again);

    const scroller = make("div", "qz-scroll");
    scroller.append(end);
    const screen = make("div", "qz-screen is-end");
    if (!reduceMotion()) screen.classList.add("from-right");
    screen.append(make("header", "qz-head qz-head-end"), scroller, foot);
    screen.firstChild.append(closeButton());
    card.replaceChildren(screen);
    card.focus({preventScroll: true});
  }

  return {open, close: () => close(), enrichPile};
}
