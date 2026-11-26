import "./book-metadata.js";
const metadata=globalThis.BookMetadata;
// « Ce qu'il me promet » : les réponses possibles, et comment l'app les devine.
// Ce module sert à la fois dans l'app et dans la fonction Supabase « catalogue ».

export const HUMEURS = [
  ["reconfort", "Réconfort", "il prend dans les bras"],
  ["energie", "Énergie", "il donne envie de bouger"],
  ["melancolie", "Mélancolie", "il serre le cœur"],
  ["tension", "Tension", "il secoue"],
  ["calme", "Calme", "il apaise"],
];
export const EMOTIONS = [
  ["sourire", "Sourire toute seule"],
  ["coeur-fond", "Avoir le cœur qui fond"],
  ["emerveillee", "Être émerveillée"],
  ["moins-seule", "Me sentir moins seule"],
  ["rire", "Rire aux éclats"],
  ["frissons", "Avoir des frissons"],
  ["peur", "Avoir peur"],
  ["pleurer", "Pleurer pour de vrai"],
];
export const DECORS = [
  ["hiver", "Sous un plaid, en plein hiver"],
  ["ete", "Au soleil, en été"],
  ["mer", "Au bord de la mer"],
  ["campagne", "À la campagne"],
  ["ville-nuit", "En ville, la nuit"],
  ["campus", "Sur un campus"],
  ["chateau", "Dans un château plein de magie"],
  ["autre-monde", "Dans un autre monde"],
];
export const NOIRCEUR = [
  [1, "Doux", "aucune ombre, on reste dans la lumière"],
  [2, "Tendre", "quelques moments durs, vite apaisés"],
  [3, "Nuancé", "un peu d'ombre"],
  [4, "Sombre", "des thèmes lourds"],
  [5, "Dark", "le noir, sans détour"],
];
export const SPICE = [
  [0, "Pas de spice", "aucune scène"],
  [1, "Une étincelle", "des baisers, rien de plus"],
  [2, "Tiède", "des scènes suggérées, porte fermée"],
  [3, "Ça chauffe", "quelques scènes explicites"],
  [4, "Brûlant", "des scènes explicites fréquentes"],
  [5, "Incendie", "très explicite, c'est le cœur du livre"],
];

const ids = list => list.map(item => item[0]);
export const ANSWERS = {humeur: ids(HUMEURS), emotions: ids(EMOTIONS), decor: ids(DECORS)};

export function emptyPromesse() {
  return {humeur: [], emotions: [], decor: [], noirceur: null, spice: null, pages: null, avertissements: []};
}

// Une romance (ou romantasy, dark romance…) garde la slide « Ça chauffe ? »
export function isRomance(book = {}) {
  const words = [...(book.genres || []), ...(book.subgenres || []), ...(book.tropes || [])].join(" ");
  return /romance|romantasy|new adult|sentimental|amour|love/i.test(words);
}

// Table de correspondance : un mot trouvé dans les genres, sujets ou tags coche une réponse précise.
const RULES = [
  [/dark romance/i, {noirceur: 5, spice: 4, humeur: ["tension"], emotions: ["frissons"]}],
  [/cosy|cozy|feel[- ]?good|doudou|comfort|réconfort|heartwarming|wholesome/i, {noirceur: 1, humeur: ["reconfort", "calme"], emotions: ["sourire", "coeur-fond"]}],
  [/romance|romantic|love stor|sentimental|histoire d'amour/i, {humeur: ["reconfort"], emotions: ["coeur-fond", "sourire"], unless: /dark romance|bully|mafia/i}],
  [/humou?r|funny|comedy|comédie|comique|drôle|hilarious/i, {humeur: ["energie"], emotions: ["rire", "sourire"]}],
  [/thriller|suspense|mystery|mystère|polar|policier|crime|detective|enquête/i, {noirceur: 4, humeur: ["tension"], emotions: ["frissons"]}],
  [/horror|horreur|épouvante|ghost|fantôme|haunted|gothic|gothique/i, {noirceur: 5, humeur: ["tension"], emotions: ["peur", "frissons"]}],
  [/romantasy|fantasy|fantastique|magic|magie|fae|fées|dragon|witch|sorcière|wizard|sorcier/i, {decor: ["chateau"], emotions: ["emerveillee"]}],
  [/high fantasy|epic fantasy|fantasy épique|science[- ]fiction|\bsf\b|space|espace|dystop|other world|autre monde|portal|portail/i, {decor: ["autre-monde"], emotions: ["emerveillee"]}],
  [/dystop|post-apo|apocalyp/i, {noirceur: 4, humeur: ["tension"]}],
  [/christmas|noël|winter|hiver|snow|neige|holiday/i, {decor: ["hiver"], humeur: ["reconfort"]}],
  [/summer|été|vacances|vacation|beach|plage|\bsun\b|soleil/i, {decor: ["ete"]}],
  [/\bsea\b|\bmer\b|ocean|océan|island|\bîle\b|coast|côte|beach|plage/i, {decor: ["mer"]}],
  [/small town|village|countryside|campagne|farm|ferme|ranch|rural/i, {decor: ["campagne"], humeur: ["calme"]}],
  [/college|university|université|campus|academy|académie|school|école|lycée|fac\b/i, {decor: ["campus"]}],
  [/new york|london|londres|paris|city|ville|urban|urbain|mafia|nightlife/i, {decor: ["ville-nuit"]}],
  [/grief|deuil|death|mort|loss|perte|illness|maladie|cancer|tragedy|tragédie|tearjerker|sad|triste/i, {noirceur: 3, humeur: ["melancolie"], emotions: ["pleurer"]}],
  [/friendship|amitié|found family|famille choisie|loneliness|solitude|coming of age|apprentissage/i, {emotions: ["moins-seule"], humeur: ["reconfort"]}],
  [/adventure|aventure|action|quest|quête|heist/i, {humeur: ["energie"]}],
  [/literary|littéraire|contemplati|poetic|poétique|slow|lent|quiet/i, {humeur: ["calme"]}],
  // Humeurs des lecteurs (Hardcover)
  [/\badventurous\b|\bfast-paced\b/i, {humeur: ["energie"]}],
  [/\bfunny\b|\blighthearted\b|\blight-hearted\b/i, {humeur: ["energie"], emotions: ["rire", "sourire"]}],
  [/\bdark\b/i, {noirceur: 4, humeur: ["tension"]}],
  [/\btense\b|\bsuspenseful\b/i, {humeur: ["tension"], emotions: ["frissons"]}],
  [/\bmysterious\b/i, {emotions: ["frissons"]}],
  [/\bemotional\b/i, {emotions: ["coeur-fond", "pleurer"]}],
  [/\bsad\b/i, {noirceur: 3, humeur: ["melancolie"], emotions: ["pleurer"]}],
  [/\bhopeful\b|\bheartwarming\b/i, {humeur: ["reconfort"], emotions: ["moins-seule"]}],
  [/\breflective\b|\brelaxing\b/i, {humeur: ["calme"]}],
  [/\binspiring\b|\bwhimsical\b/i, {emotions: ["emerveillee"]}],
  [/\bchallenging\b/i, {noirceur: 3}],
  [/war|guerre|violence|abuse|maltraitance|trauma|assault|agression|torture|murder|meurtre/i, {noirceur: 4, avertissements: true}],
  [/erotic|érotique|erotica|steamy|spicy|explicit|explicite|smut/i, {spice: 4}],
  [/sweet romance|clean romance|closed door|porte fermée|christian|chrétien/i, {spice: 1}],
];

const WARNINGS = [
  [/grief|deuil|loss|perte/i, "deuil"], [/death|mort/i, "mort"], [/violence|violent/i, "violence"],
  [/abuse|maltraitance/i, "maltraitance"], [/assault|agression/i, "agression"], [/war|guerre/i, "guerre"],
  [/suicid/i, "suicide"], [/illness|maladie|cancer/i, "maladie"], [/murder|meurtre/i, "meurtre"],
  [/addiction|drug|drogue/i, "addiction"], [/torture/i, "torture"],
];

// signals : {words: [genres, sujets, tags…], pages}
export function mapSignals(signals = {}) {
  const result = emptyPromesse();
  const words = (signals.words || []).filter(word => typeof word === "string" && word.length < 120);
  const text = words.join(" · ");
  let darkest = null;
  for (const [pattern, effect] of RULES) {
    if (!pattern.test(text) || effect.unless?.test(text)) continue;
    for (const key of ["humeur", "emotions", "decor"]) {
      for (const value of effect[key] || []) if (!result[key].includes(value)) result[key].push(value);
    }
    if (effect.noirceur) darkest = Math.max(darkest || 0, effect.noirceur);
    if (effect.spice !== undefined && result.spice === null) result.spice = effect.spice;
  }
  // Un « cosy mystery » reste doux : le côté doudou plafonne la noirceur à Tendre
  if (darkest) result.noirceur = /cosy|cozy|feel[- ]?good|doudou|wholesome/i.test(text) ? Math.min(darkest, 2) : darkest;
  for (const [pattern, label] of WARNINGS) if (pattern.test(text) && !result.avertissements.includes(label)) result.avertissements.push(label);
  const pages = Number(signals.pages);
  if (metadata.editionPages(pages)) result.pages = pages;
  result.humeur = result.humeur.slice(0, 2);
  result.emotions = result.emotions.slice(0, 3);
  result.decor = result.decor.slice(0, 2);
  return result;
}

// Ne remplit que ce qui manque dans « base »
export function fillGaps(base, extra) {
  const next = {...emptyPromesse(), ...base};
  for (const key of ["humeur", "emotions", "decor", "avertissements"]) {
    if (!next[key]?.length && extra?.[key]?.length) next[key] = extra[key].filter(value => key === "avertissements" || ANSWERS[key].includes(value));
  }
  for (const key of ["noirceur", "spice", "pages"]) if (next[key] == null && extra?.[key] != null) next[key] = extra[key];
  return next;
}

const clean = value => String(value || "").replace(/\s+/g, " ").trim().slice(0, 200);

const normalized = value => clean(value).normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
export function sameNotice(book, title, authors, ids = []) {
  const isbn = clean(book.isbn).replace(/[ -]/g, "");
  if (isbn && ids.includes(isbn)) return true;
  const name = value => normalized(value).split(" ").sort().join(" ");
  return Boolean(book.title && book.author && normalized(title) === normalized(book.title) &&
    authors.some(author => name(author) === name(book.author)));
}

async function getJson(url, signal, init) {
  const response = await fetch(url, {...init, signal});
  if (!response.ok) throw new Error(String(response.status));
  return response.json();
}

// Google Books : genres, nombre de pages (sans clé, ou avec GOOGLE_BOOKS_KEY côté serveur)
export async function fromGoogleBooks(book, signal, key = "") {
  const isbn = metadata.editionIsbn(book.isbn);
  const q = /^97[89]\d{10}$/.test(isbn) ? `isbn:${isbn}` : `intitle:${clean(book.title)}${book.author ? ` inauthor:${clean(book.author)}` : ""}`;
  const params = new URLSearchParams({q, maxResults: "3", printType: "books", fields: "items(volumeInfo(title,authors,industryIdentifiers,categories,pageCount,description,language,publisher,publishedDate),saleInfo(isEbook))"});
  if (key) params.set("key", key);
  const data = await getJson("https://www.googleapis.com/books/v1/volumes?" + params, signal);
  const info = (data.items || []).map(item => ({...item.volumeInfo, ebook:item.saleInfo?.isEbook})).filter(item =>
    sameNotice(book, item.title, item.authors || [], (item.industryIdentifiers || []).map(id => id.identifier)));
  const edition = info.filter(item => {
    if (isbn) return (item.industryIdentifiers || []).some(id=>metadata.editionIsbn(id.identifier)===isbn);
    const format = normalized(book.format);
    return Boolean(book.publisher && book.language &&
      normalized(book.publisher) === normalized(item.publisher) && metadata.language(book.language) === metadata.language(item.language) &&
      (["epub","pdf","numerique"].includes(format) ? item.ebook===true : format==="papier" && item.ebook===false) &&
      (!book.volume || metadata.separateTitle({title:item.title}).volume===String(book.volume)));
  });
  const unique = values => {const found=[...new Set(values.filter(Boolean))];return found.length===1?found[0]:undefined;};
  const selected=isbn || edition.length===1 ? edition : [];
  const description=unique(selected.filter(row=>!book.language || metadata.language(row.language)===metadata.language(book.language))
    .map(row=>metadata.editorialText(row.description))) || "";
  return {publicationDate:unique(edition.map(row=>row.publishedDate)) || "",
    words:info.length===1 ? info[0].categories || [] : [],
    pages:unique(selected.map(row=>metadata.editionPages(row.pageCount))),description};
}

// Open Library : sujets donnés par les lecteurs et bibliothèques
export async function fromOpenLibrary(book, signal) {
  const code=metadata.editionIsbn(book.isbn);
  const params = new URLSearchParams({title:clean(book.title),limit:"2",fields:"title,author_name,isbn,subject"});
  if (book.author) params.set("author",clean(book.author));
  const [work,edition]=await Promise.allSettled([
    getJson("https://openlibrary.org/search.json?"+params,signal),
    code ? getJson("https://openlibrary.org/isbn/"+code+".json",signal) : null
  ]);
  if (work.status==="rejected" && (edition.status==="rejected" || !edition.value)) throw work.reason;
  const docs=(work.status==="fulfilled"?work.value.docs || []:[]).filter(item=>sameNotice(book,item.title,item.author_name || [],item.isbn || []));
  const row=edition.status==="fulfilled"?edition.value:null;
  const ids=[...(row?.isbn_10||[]),...(row?.isbn_13||[])].map(metadata.editionIsbn).filter(Boolean);
  return {words:docs.length===1?(docs[0].subject || []).slice(0,40):[],
    pages:code && row && (!ids.length || ids.includes(code)) ? metadata.editionPages(row.number_of_pages):undefined};
}

// Devine tout ce qu'on peut sans IA : genres de l'app + Google Books + Open Library
export async function guessPromesse(book, signal, {googleKey = ""} = {}) {
  const sources = await Promise.allSettled([fromGoogleBooks(book, signal, googleKey), fromOpenLibrary(book, signal)]);
  const status = {};
  ["Google Books", "Open Library"].forEach((name, i) => {
    const source = sources[i];
    status[name] = source.status === "fulfilled" ? `${source.value.words.length} mots${source.value.pages ? ", pages" : ""}` : `erreur ${String(source.reason?.message || "").slice(0, 40)}`;
  });
  const found = sources.filter(source => source.status === "fulfilled").map(source => source.value);
  // Le titre compte aussi : « Unknown (dark romance) », « Noël à… »
  const words = [book.title || "", book.series || book.saga || "", ...(book.genres || []), ...(book.subgenres || []), ...(book.tropes || []), ...found.flatMap(item => item.words || [])];
  const counts=[...new Set(found.map(item=>item.pages).filter(Boolean))];
  const pages=counts.length===1?counts[0]:undefined;
  const description = found.find(item => item.description)?.description || "";
  return {promesse: mapSignals({words, pages}), words, description, catalogueWords:found.flatMap(item=>item.words || []), publicationDate:found.find(item=>item.publicationDate)?.publicationDate || "", romance: isRomance({genres: words}), sources: status};
}
