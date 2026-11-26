import "./book-metadata.js";
const metadata=globalThis.BookMetadata;
const apple="https://itunes.apple.com";
const openLibrary="https://openlibrary.org";
const covers="https://covers.openlibrary.org";
const bnf="https://catalogue.bnf.fr";
const text=(value,limit=240)=>typeof value==="string" ? value.trim().slice(0,limit) : "";
const list=(value)=>Array.isArray(value) ? [...new Set(value.map(item=>text(item,120)).filter(Boolean))].slice(0,30) : [];
const normal=(value)=>text(value,3000).normalize("NFKD").replace(/\p{M}/gu,"").replace(/œ/gi,"oe").replace(/æ/gi,"ae").toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").trim();
const volumeMarker=/\b(?:tome|livre|book|vol(?:ume)?\.?|t(?=\d))\s*(\d+(?:[.,]\d+)?)/i;

const isbn=metadata.editionIsbn;

function artworkIsbn(cover) {
  const url=coverUrl(cover);
  if (!url || !/^https:\/\/is\d+(?:-ssl)?\.mzstatic\.com\//.test(url)) return "";
  return isbn(new URL(url).pathname.match(/\/(97[89]\d{10})(?:-\d+-[a-z])?\.jpe?g\//i)?.[1]);
}

export function coverUrl(value) {
  const url=metadata.coverUrl(value);
  return url && !new URL(url).hostname.endsWith(".hardcover.app") ? url : "";
}

function summary(value) {
  if (value && typeof value==="object") value=value.value;
  return metadata.editorialText(value);
}


// Règles de pertinence de la recherche du Monde d’Eli (app/search/model.ts, score).
// Les notices d’Entre les pages regroupent les ISBN au niveau de l’œuvre.
function catalogueScore(book,query) {
  const term=normal(query);
  if (!term) return 0;
  const title=normal(book.title);
  const authors=[book.author,...(book.authors || [])].map(normal);
  const series=normal(book.series);
  const aliases=(book.aliases || []).map(normal).filter(Boolean);
  if (book.isbns?.includes(isbn(query))) return 1000;
  if (title===term || aliases.includes(term)) return 900;
  if (authors.includes(term)) return 820;
  if (series===term) return 800;
  if (title.includes(term)) return 700;
  if (authors.some(name=>name.includes(term))) return 650;
  if (series.includes(term)) return 620;
  const words=term.split(" ");
  const index=[title,...authors,series,...aliases].join(" ");
  return words.every(word=>index.includes(word)) ? 400+20*words.filter(word=>title.includes(word)).length : 0;
}

export function createCatalogue(localRows=[], signal, googleKey="") {
  async function readSource(url, format, timeout=8000) {
    const controller=new AbortController();
    const abort=()=>controller.abort();
    if (signal?.aborted) abort();
    signal?.addEventListener("abort",abort,{once:true});
    const timer=setTimeout(abort,timeout);
    try {
      const response=await fetch(url,{signal:controller.signal,credentials:"omit",referrerPolicy:"no-referrer",
        headers:{Accept:format==="text" ? "application/xml,text/xml" : "application/json"}});
      if (new URL(response.url || url).origin!==new URL(url).origin) throw new Error("Redirection de catalogue inattendue.");
      if (response.status===404 && format==="edition") return null;
      if (!response.ok) throw new Error("Catalogue inaccessible ("+response.status+").");
      return format==="text" ? await response.text() : await response.json();
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort",abort);
    }
  }
  async function json(url,ms=8000) {
    return readSource(url,"json",ms);
  }

  function fromAppCatalogue(row) {
    return {
      // Keep identifiers stable for books already imported before the app had its own catalogue.
      id:"monde:"+row.id,title:text(row.title),author:text(row.author),authors:list(row.authors),
      series:text(row.series),volume:text(row.volume,50),genres:list(row.genres?.length ? row.genres : [row.genre]),subgenres:list(row.subgenres),
      tropes:list(row.tropes),summary:"",
      publicationDate:metadata.publicationDate(row.publicationDate || row.publishedDate),
      coverData:coverUrl(row.cover),
      isbns:[...new Set([row.isbn,...list(row.isbns),artworkIsbn(row.cover)].map(isbn).filter(Boolean))],
    };
  }

  function matches(book,q) {
    const words=normal(q).split(" ").filter(Boolean);
    const haystack=normal([book.title,book.author,book.series,book.volume,...(book.aliases || [])].join(" "));
    return words.every(word=>haystack.includes(word));
  }

  function bookVolume(book) {
    const value=text(book.volume);
    const raw=value.match(volumeMarker)?.[1] || (/^\d+(?:[.,]\d+)?$/.test(value) ? value : "") || text(book.title).match(volumeMarker)?.[1];
    return raw ? String(Number(raw.replace(",","."))) : "";
  }

  function sameWork(a,b) {
    const names=book=>[book.author,...(book.authors || [])].filter(Boolean)
      .map(value=>normal(value).split(" ").sort().join(" ")).filter(Boolean);
    const leftAuthors=names(a);
    if (!names(b).some(name=>leftAuthors.includes(name))) return false;
    const leftVolume=bookVolume(a);
    const rightVolume=bookVolume(b);
    if (leftVolume && rightVolume && leftVolume!==rightVolume) return false;
    if (a.series && b.series && normal(a.series)!==normal(b.series) &&
        normal(a.title)!==normal(b.series) && normal(b.title)!==normal(a.series)) return false;
    const titles=book=>[book.title,...(book.aliases || []),book.series && book.series+" "+book.title,
        book.title?.match(volumeMarker) && book.title.slice(0,book.title.search(volumeMarker))]
      .map(title=>normal(text(title).replace(volumeMarker," "))).filter(Boolean);
    const leftTitles=titles(a);
    return titles(b).some(title=>leftTitles.includes(title));
  }

  function appleBook(row,lookupIsbn="") {
      const title=text(row.trackName);
      const artwork=text(row.artworkUrl100,1100);
      return metadata.separateTitle({
        id:"apple:"+row.trackId,title,aliases:[title],author:text(row.artistName),authors:list(text(row.artistName).split(/\s+&\s+/)),series:"",volume:"",
        publicationDate:metadata.publicationDate(row.releaseDate),format:"EPUB",ebook:true,
        genres:list(row.genres),subgenres:[],tropes:[],isbns:[...new Set([lookupIsbn,artworkIsbn(artwork)].filter(Boolean))],summary:summary(row.description),summarySource:"Apple Books", language:text(row.languageCodesISO2A?.[0]),
        coverData:coverUrl(artwork),
      });
  }
  async function appleSearch(q) {
    const params=new URLSearchParams({term:q,country:"fr",media:"ebook",entity:"ebook",limit:"15"});
    const data=await json(apple+"/search?"+params,8000);
    return (Array.isArray(data.results) ? data.results : []).filter(row=>row.kind==="ebook" && Number.isSafeInteger(row.trackId)).map(row=>appleBook(row)).filter(row=>row.title);
  }

  async function appleIsbn(code,expectedId="") {
    const data=await json(apple+"/lookup?"+new URLSearchParams({isbn:code,country:"fr",entity:"ebook"}));
    const rows=(Array.isArray(data.results) ? data.results : []).filter(row=>
      row.kind==="ebook" && Number.isSafeInteger(row.trackId) && text(row.trackName));
    if (rows.length!==1 || (expectedId && String(rows[0].trackId)!==expectedId)) return [];
    // Apple lookup queried this exact ISBN. Artwork identifiers are optional corroboration.
    const embedded=artworkIsbn(rows[0].artworkUrl100);
    if (embedded && embedded!==code) return [];
    return [appleBook(rows[0],code)];
  }

  function openLibraryCover(row) {
    const cover=Array.isArray(row.covers) ? row.covers[0] : row.cover_i;
    return Number.isSafeInteger(cover) && cover>0 ? coverUrl(covers+"/b/id/"+cover+"-M.jpg") : "";
  }

  async function openLibraryIsbn(code) {
    const row=await readSource(openLibrary+"/isbn/"+code+".json","edition",8500);
    if (!row) return [];
    if (!text(row.title)) return [];
    const returnedCodes=[...(row.isbn_10 || []),...(row.isbn_13 || [])].map(isbn).filter(Boolean);
    if (returnedCodes.length && !returnedCodes.includes(code)) return [];
    const author=row.authors?.[0]?.key;
    const work=row.works?.[0]?.key;
    const [person,workData]=await Promise.all([
      /^\/authors\/OL\d+A$/.test(author || "") ? json(openLibrary+author+".json",5500).catch(()=>({})) : {},
      /^\/works\/OL\d+W$/.test(work || "") ? json(openLibrary+work+".json",5500).catch(()=>({})) : {},
    ]);
    return [{
      id:text(row.key).replace("/books/","ol-edition:") || "isbn:"+code,
      title:text(row.title),author:text(person.name || row.by_statement),series:text(Array.isArray(row.series) ? row.series[0] : row.series),
      publisher:text(row.publishers?.[0]),language:text(row.languages?.[0]?.key).split("/").pop(),
      publicationDate:metadata.publicationDate(row.publish_date),pageCount:metadata.editionPages(row.number_of_pages),volume:"",genres:[],subjects:list([...(row.subjects || []), ...(workData.subjects || [])]),subgenres:[],tropes:[],isbns:[code],summary:"",
      coverData:openLibraryCover(row) || coverUrl(covers+"/b/isbn/"+code+"-L.jpg"),
    }];
  }

  async function openLibrarySearch(q,author="") {
    const term=q.replace(/[{}:[\]"\\]/g," ").trim();
    const authorTerm=author.replace(/[{}:[\]"\\]/g," ").trim();
    const params=new URLSearchParams({
      q:authorTerm ? 'title:"'+term+'" author:"'+authorTerm+'"' : term,lang:"fr",limit:"12",
      fields:"key,title,alternative_title,author_name,cover_i,isbn,series,subject,editions,editions.title,editions.isbn,editions.cover_i,editions.language,editions.publish_date",
    });
    const data=await json(openLibrary+"/search.json?"+params,8000);
    return (Array.isArray(data.docs) ? data.docs : []).filter(row=>/^\/works\/OL\d+W$/.test(row.key || "") && text(row.title)).map(row=>{
      const editions=Array.isArray(row.editions?.docs) ? row.editions.docs : [];
      const edition=editions.find(item=>item.language?.includes("fre"));
      const title=text(edition?.title || row.title);
      return {
        id:row.key.replace("/works/","ol-work:"),title,aliases:list([row.title,...list(row.alternative_title)]),
        author:text(row.author_name?.[0]),authors:list(row.author_name),
        series:text(Array.isArray(row.series) ? row.series[0] : row.series),volume:bookVolume({title}),
        genres:list(row.subject).slice(0,8),subgenres:[],tropes:[],
        isbns:[...new Set(list(edition ? edition.isbn : row.isbn).map(isbn).filter(Boolean))].slice(0,25),
        publicationDate:metadata.publicationDate(edition?.publish_date),
        summary:"",coverData:openLibraryCover(edition || {}) || openLibraryCover(row),
      };
    });
  }

  async function bnfSearch(q,code="",author="") {
    const safe=value=>value.replace(/["\\]/g," ").trim();
    const params=new URLSearchParams({
      version:"1.2",operation:"searchRetrieve",
      query:(code ? 'bib.isbn all "'+code+'"' : 'bib.'+(author ? 'title' : 'anywhere')+' all "'+safe(q)+'"'+(author ? ' and bib.author all "'+safe(author)+'"' : ''))+' and bib.doctype any "a"',
      recordSchema:"unimarcxchange",maximumRecords:code ? "5" : "12",
    });
    const xml=await readSource(bnf+"/api/SRU?"+params,"text",8500);
    if (xml.length>4000000 || /<!DOCTYPE|<!ENTITY|<(?:[\w-]+:)?diagnostics\b/i.test(xml) ||
        !/<(?:[\w-]+:)?searchRetrieveResponse\b/i.test(xml)) throw new Error("Réponse BnF indisponible.");
    const records=[...xml.matchAll(/<(?:[\w-]+:)?record\b[^>]*\bid="[^"]*(cb\d{8}[a-z0-9])"[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?record>/gi)];
    return records.flatMap(([,id,record])=>{
      const fields=[...record.matchAll(/<(?:[\w-]+:)?datafield\b[^>]*\btag="(\d{3})"[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?datafield>/gi)];
      const field=tag=>fields.find(([,key])=>key===tag)?.[2] || "";
      const sub=(field,key,limit=240)=>{
        const parts=field.matchAll(/<(?:[\w-]+:)?subfield\b[^>]*\bcode="([a-z0-9])"[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?subfield>/gi);
        return summary([...parts].filter(([,code])=>code===key).map(([, ,value])=>value).join(" ")).slice(0,limit);
      };
      const title=sub(field("200"),"a");
      const authors=fields.filter(([,tag])=>["700","701"].includes(tag)).map(([, ,part])=>
        [sub(part,"b"),sub(part,"a")].filter(Boolean).join(" ")).filter(Boolean);
      const author=authors[0] || sub(field("200"),"f");
      const seen=fields.filter(([,tag])=>tag==="010").map(([, ,value])=>isbn(sub(value,"a")));
      if (!title || (code && !seen.includes(code))) return [];
      const imprintDate=sub(field("214") || field("210"),"d");
      const image="https://openapi.bnf.fr/couverture/image/image/recupererImage?"+new URLSearchParams({
        ...(seen.find(Boolean) ? {ISBN:seen.find(Boolean)} : {idArk:"ark:/12148/"+id}),couverture:"1",taille:"originale",
      });
      return [{
        id:"bnf:"+id,title,author,authors,
        ebook:/ressource électronique|en ligne|numérique|epub|\bpdf\b/i.test(sub(field("200"),"b")+" "+sub(field("215"),"a")) || Boolean(field("135")),publisher:sub(field("214") || field("210"),"c"), publicationDate:metadata.publicationDate(imprintDate) || (/^\D{0,15}(\d{4})\D{0,5}$/.exec(imprintDate)?.[1] || ""),
        pageCount:Number(sub(field("215"),"a").match(/(\d+)\s*p(?:ages|\.)/i)?.[1]) || undefined,
        language:sub(field("101"),"a"),aliases:[sub(field("454"),"t"),sub(field("500"),"a")].filter(Boolean),series:sub(field("461"),"t"),volume:sub(field("461"),"v") || sub(field("200"),"h"),
        genres:list(fields.filter(([,tag])=>tag==="608").map(([, ,value])=>sub(value,"a"))),
        subgenres:list(fields.filter(([,tag])=>tag==="608").map(([, ,value])=>sub(value,"x"))),tropes:[],
        isbns:[...new Set(seen.filter(Boolean))],
        summary:/(?:quatri[eè]me|4e|4ème) de couverture|(?:source|fourni par|texte de)\s*:?\s*(?:l[’']?)?[eé]diteur/i.test(field("330"))
          ? sub(field("330"),"a",100000) : "",summarySource:"BnF · éditeur",coverData:coverUrl(image),
      }];
    });
  }

  function reconcile(books, incoming) {
    const results=[...books];
    for (const book of incoming) {
      const candidates=results.filter(row=>sameWork(row,book) ||
        (book.isbns.some(code=>row.isbns.includes(code)) && (!row.volume || !book.volume || bookVolume(row)===bookVolume(book))));
      if (!candidates.length) {
        results.push(book);
        continue;
      }
      if (candidates.length!==1) continue;
      const row=candidates[0];
      row.author=row.author || book.author;
      row.series=row.series || book.series;
      row.volume=row.volume || book.volume;
      const sameEdition=row.id===book.id || (row.isbns.length===1 && book.isbns.length===1 && row.isbns[0]===book.isbns[0]);
      if (sameEdition) {
        if (!row.summary && book.summarySource) {row.summary=book.summary;row.summarySource=book.summarySource;}
        row.publicationDate=metadata.refineDate(row.publicationDate,book.publicationDate);
        row.coverCandidates=[...new Set([...(row.coverCandidates || []),row.coverData,book.coverData].filter(Boolean))];
        row.coverData ||= book.coverData;
      }
      row.isbns=[...new Set([...row.isbns,...book.isbns])];
      if (!row.genres.length) row.genres=book.genres;
      if (!row.subgenres.length) row.subgenres=book.subgenres;
    }
    return results;
  }

  async function search(params) {
    const q=text(params.get("q"),200);
    const code=isbn(params.get("isbn") || q);
    if (q.length<2 && !code) return {books:[],partial:false};
    const matchesDocument=params.get("match")==="1";
    const author=matchesDocument ? text(params.get("author")) : "";
    const input={title:q,author,series:text(params.get("series")),volume:text(params.get("volume"),50)};
    const volume=bookVolume(input);
    const documentMatches=book=>sameWork(book,input) && (!volume || bookVolume(book)===volume);
    const selectDocument=books=>{
      const exact=code ? books.filter(book=>book.isbns.includes(code)) : [];
      if (exact.length===1) return exact;
      const byTitle=(exact.length ? exact : books).filter(documentMatches);
      return byTitle.length===1 ? byTitle : [];
    };
    const local=localRows.map(fromAppCatalogue).map(metadata.separateTitle);
    if (matchesDocument) {
      const match=selectDocument(local);
      if (match.length) return {books:match,partial:false};
    }
    const title=q.replace(volumeMarker," ").replace(/^[\s:–—,-]+|[\s:–—,-]+$/g,"");
    const byTitle=title && !isbn(title) && (!code || matchesDocument);
    const requests=[
      ...(byTitle ? [appleSearch([title,author].filter(Boolean).join(" ")),openLibrarySearch(title,author)] : []),
      ...(code ? [openLibraryIsbn(code),appleIsbn(code)] : []),
      bnfSearch(title,code,author),
    ];
    const outcomes=await Promise.allSettled(requests);
    const incoming=outcomes.flatMap(value=>value.status==="fulfilled" ? value.value : []).map(book=>{
      const raw=book.title;
      metadata.separateTitle(book);
      if (raw!==book.title) book.aliases=[...new Set([raw,...(book.aliases || [])])];
      return book;
    });
    const eligible=matchesDocument ? incoming : code
      ? incoming.filter(book=>book.isbns.includes(code)) : incoming;
    const library=matchesDocument ? local : code
      ? local.filter(book=>book.isbns.includes(code) || eligible.some(entry=>sameWork(book,entry) && local.filter(row=>sameWork(row,entry)).length===1))
      : local.filter(book=>matches(book,q));
    const reconciled=reconcile(library,eligible);
    const ranked=reconciled.map(book=>({book,score:catalogueScore(book,title || q)}))
      .filter(({book,score})=>code || score>0 && (!volume || !bookVolume(book) || bookVolume(book)===volume))
      .sort((a,b)=>b.score-a.score);
    const books=matchesDocument ? selectDocument(reconciled) : ranked.slice(0,32).map(entry=>entry.book);
    const unavailable=!books.length && outcomes.every(value=>value.status==="rejected");
    if (unavailable) throw new Error("Les catalogues sont inaccessibles.");
    return {books,partial:outcomes.some(row=>row.status==="rejected")};
  }

  async function googleEditions(title,author,code) {
    const term=code ? "isbn:"+code : 'intitle:"'+title+'" inauthor:"'+author+'"';
    const data=await json("https://www.googleapis.com/books/v1/volumes?"+new URLSearchParams({q:term,maxResults:"10",...(googleKey?{key:googleKey}:{})}));
    return (data.items || []).map(({id,volumeInfo:row={},saleInfo={}})=>({
      id:"google:"+id,summarySource:"Google Books",
      ebook:saleInfo.isEbook,
      title:text(row.title), author:text(row.authors?.[0]), authors:list(row.authors),
      isbns:(row.industryIdentifiers || []).map(item=>isbn(item.identifier)).filter(Boolean),
      subjects:list(row.categories), summary:summary(row.description),
      coverData:["extraLarge","large","medium","small","thumbnail","smallThumbnail"]
        .map(key=>coverUrl(row.imageLinks?.[key]?.replace(/^http:\/\//i,"https://"))).find(Boolean) || "",
      publisher:text(row.publisher), publicationDate:text(row.publishedDate),
      language:text(row.language), pageCount:row.pageCount,
    }));
  }

  async function details(params) {
    const id=text(params.get("id"));
    const title=text(params.get("title"));
    const author=text(params.get("author"));
    const volume=text(params.get("volume"),50);
    const code=isbn(params.get("isbn"));
    const key=id.match(/^ol-work:(OL\d+W)$/)?.[1];
    const appleId=id.match(/^apple:(\d+)$/)?.[1];
    const [work,known,alternatives,national,google,appleEdition]=await Promise.all([
      key ? json(openLibrary+"/works/"+key+".json",8000).catch(()=>({})) : {},
      code ? openLibraryIsbn(code).catch(()=>[]) : [],
      appleId ? json(apple+"/lookup?"+new URLSearchParams({id:appleId,country:"fr"})).then(data=>
        (Array.isArray(data.results) ? data.results : []).filter(row=>String(row.trackId)===appleId).map(row=>appleBook(row))).catch(()=>[])
        : title && author ? appleSearch([title,volume && "tome "+volume,author].filter(Boolean).join(" ")).catch(()=>[]) : [],
      id.startsWith("bnf:") || !appleId && !key ? bnfSearch(title,code,author).catch(()=>[]) : [],
      code || title && author ? googleEditions(title,author,code).catch(()=>[]) : [],
      code ? appleIsbn(code,appleId).catch(()=>[]) : [],
    ]);
    const requested={title,author,volume};
    const nearby=[...alternatives,...national,...google].filter(book=>sameWork(requested,book));
    const sameVolume=nearby.filter(book=>!bookVolume(requested) || bookVolume(book)===bookVolume(requested));
    const local = localRows.map(fromAppCatalogue).filter(book => (code && book.isbns.includes(code)) || sameWork(requested,book));
    const curated = local.length === 1 ? local[0] : null;
    const candidates = [...known,...sameVolume].filter(book =>
      (code && book.isbns.includes(code)) || sameWork(requested,book));
    // Une œuvre peut regrouper plusieurs éditions. Réserver les données physiques à la notice identifiée.
    const editions=[...national,...known,...appleEdition,...google,...alternatives].filter(row=>
      (code && row.isbns.includes(code)) || (!code && /^(?:bnf|apple|google|ol-edition):/.test(id) && row.id===id));
    const edition={};
    for (const row of editions) {
      edition.publicationDate=metadata.refineDate(edition.publicationDate,row.publicationDate);
      for (const name of ["publisher","language","pageCount"]) {
        if (!edition[name] && row[name]) edition[name]=row[name];
      }
      if (!edition.isbn) edition.isbn=code || row.isbns[0];
    }
    // Les exemplaires d’une même œuvre peuvent avoir des paginations et des textes de couverture différents.
    const publisher=normal(params.get("publisher"));
    const language=metadata.language(params.get("language"));
    const format=normal(params.get("format"));
    const confirmed=editions.filter(row=> !volume || !bookVolume(row) || bookVolume(row)===bookVolume(requested));
    const byIdentity=code || confirmed.length ? [] : sameVolume.filter(row=>{
      const lang=metadata.language(row.language);
      if (language && language!==lang) return false;
      if (publisher && normal(row.publisher)!==publisher) return false;
      if (!volume && bookVolume(row)) return false;
      if (format==="papier") return row.ebook===false || row.id?.startsWith("bnf:") && row.ebook!==true;
      if (["epub","pdf","numerique"].includes(format)) return row.ebook===true;
      return Boolean(publisher);
    });
    const editionKeys=new Set(byIdentity.map(row=>row.isbns?.[0] || row.id).filter(Boolean));
    const physical=confirmed.length ? confirmed : editionKeys.size===1 && (publisher || language) ? byIdentity : [];
    const counts=new Set(physical.map(row=>metadata.editionPages(row.pageCount)).filter(Boolean));
    edition.pageCount=counts.size===1 ? [...counts][0] : undefined;
    const notices=(confirmed.length ? confirmed : byIdentity).filter(row=>row.summarySource && row.summary &&
      (!language || !row.language || metadata.language(row.language)===language));
    const texts=new Set(notices.map(row=>row.summary));
    const official=confirmed.length ? notices[0] : texts.size===1 ? notices[0] : undefined;
    const coverCandidates=[...new Set(editions.map(row=>coverUrl(row.coverData)).filter(Boolean))];
    const matched=[...editions,...candidates];
    const first=name=>matched.find(row=>row[name])?.[name];
    return {...edition, title:first("title"),author:first("author"),series:first("series"),volume:first("volume"),
      coverData:coverCandidates[0] || "",coverCandidates, summary:official?.summary || "",summarySource:official?.summarySource || "", genres:curated?.genres || [],
      subgenres:list([...(curated?.subgenres || []), ...candidates.flatMap(row => row.subgenres || [])]),
      tropes:curated?.tropes || [],
      subjects:list([...(Array.isArray(work.subjects) ? work.subjects : []), ...matched.flatMap(row => [...(row.subjects || []), ...(row.genres || [])])])};
  }


  return {search,details,appleSearch,openLibraryIsbn};
}
