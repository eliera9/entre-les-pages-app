// Règles communes aux fichiers, aux notices de catalogue et aux réponses analysées.
(() => {
  const key = value => String(value ?? "").normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/œ/g, "oe").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const sep = String.raw`(?:\s+[-–—]\s+|\s*[:·|–—]\s*|,\s+)`;
  const mark = String.raw`(?:tome|livre|book|volume|vol\.?|t\.?|#)\s*(\d+(?:[.,]\d+)?|[IVX]+)\b`;
  const rx = pattern => new RegExp(pattern, "i");
  const numberOf = value => {
    const token = String(value ?? "").trim().replace(/^(?:tome|volume|vol\.?|t\.?)\s*(?=\d|[IVX]+$)/i, "").replace(",", ".");
    if (/^\d+(?:\.\d+)?$/.test(token)) return String(Number(token));
    if (!/^(?=[IVX]+$)X{0,3}(?:IX|IV|V?I{0,3})$/i.test(token)) return "";
    const digits = [...token.toUpperCase()].map(c => ({I:1,V:5,X:10})[c]);
    return String(digits.reduce((n, x, i) => n + (x < digits[i+1] ? -x : x), 0));
  };
  function separateTitle(book) {
    const original = book.title?.trim();
    if (!original) return book;
    const series = String(book.series || "").trim();
    const volume = numberOf(book.volume);
    // Each rule keeps an independent title. A series alone can also be the book's real title.
    function apply(title, candidate, number) {
      title = title.trim();
      candidate = candidate?.trim().replace(/[,:·–—-]+$/, "").trim();
      number = numberOf(number);
      if (!title || !number || (volume && volume !== number) ||
          (series && candidate && key(series) !== key(candidate))) return false;
      book.title = title;
      if (candidate && !series) book.series = candidate;
      book.volume = number;
      return true;
    }
    let m = original.match(rx("^\\s*[([（]([^()\\[\\]]+?)(?:\\s*[,·:#–—-]\\s*|\\s+)"+mark+"\\s*[)\\]）]\\s*(?:[-–—:·]\\s*)?(.+)$"));
    if (m) return apply(m[3], m[1], m[2]) ? separateTitle(book) : book;
    m = original.match(rx("^(.+?)\\s*\\(\\s*"+mark+"\\s*\\)\\s*[-–—:·]\\s*(.+)$"));
    if (m) return apply(m[3], m[1], m[2]) ? separateTitle(book) : book;
    m = original.match(rx("^(.+?)\\s*[([（]\\s*(.+?)(?:\\s*[,·:#–—-]\\s*|\\s+)"+mark+"\\s*[)\\]）]$"));
    if (m) return apply(m[1], m[2], m[3]) ? separateTitle(book) : book;
    m = original.match(rx("^(.+?)"+sep+"(.+?)(?:\\s*[,·:#–—-]\\s*|\\s+)"+mark+"$"));
    if (m) return apply(m[1], m[2], m[3]) ? separateTitle(book) : book;
    m = original.match(rx("^(.+?)(?:\\s*[,·:–—-]\\s*|\\s+)"+mark+ "(?:\\s*[)\\]]?\\s*[-–—:.·|]\\s*|\\s+)(.+)$"));
    if (m) return apply(m[3], m[1], m[2]) ? separateTitle(book) : book;
    m = original.match(rx("^(.+?)(?:\\s*[([（]\\s*|"+sep+"|\\s+)"+mark+"\\s*[)\\]）]?$"));
    if (m) return apply(m[1], "", m[2]) ? separateTitle(book) : book;
    // An explicitly supplied series may itself be repeated in a title without a volume marker.
    if (series) {
      m = original.match(rx("^(.+?)"+sep+"(.+)$"));
      if (m && key(m[1]) === key(series)) book.title = m[2].trim();
      else if (m && key(m[2]) === key(series)) book.title = m[1].trim();
      else {
        m = original.match(/^(.+?)\s*[(（]([^()]+)[)）]$/);
        if (m && key(m[2]) === key(series)) book.title = m[1].trim();
      }
    }
    return book;
  }

  const months = [
    ["janvier","january","janv","jan"],["fevrier","february","fevr","feb"],["mars","march","mar"],
    ["avril","april","avr","apr"],["mai","may"],["juin","june","jun"],["juillet","july","juil","jul"],
    ["aout","august","aug"],["septembre","september","sept","sep"],["octobre","october","oct"],
    ["novembre","november","nov"],["decembre","december","dec"],
  ];
  function publicationDate(raw) {
    const s = String(raw ?? "").trim();
    let year, month, day;
    let m = s.match(/^(\d{4})(?:-(\d{1,2})(?:-(\d{1,2})(?:T\d{2}:\d{2}[^\s]*)?)?)?$/);
    if (m) [,year,month,day] = m;
    else if ((m = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/))) [,day,month,year] = m;
    else {
      const parts = key(s).replace(/(?:1er|1st)\b/, "1").split(" ");
      if (parts.length < 2 || parts.length > 3) return "";
      const index = parts.findIndex(part => months.some(names => names.includes(part)));
      if (index < 0 || !/^\d{4}$/.test(parts.at(-1))) return "";
      year = parts.pop();
      const monthWord = parts.splice(index,1)[0];
      month = months.findIndex(names => names.includes(monthWord)) + 1;
      day = parts[0];
      if (day && !/^\d{1,2}$/.test(day)) return "";
    }
    year = Number(year); month = month === undefined ? null : Number(month); day = day === undefined ? null : Number(day);
    if (year < 1000 || year > 9999 || (month !== null && (month < 1 || month > 12)) ||
        (day !== null && (day < 1 || day > new Date(Date.UTC(year,month,0)).getUTCDate()))) return "";
    return [year,month,day].filter(x => x !== null).map((x,i) => i ? String(x).padStart(2,"0") : x).join("-");
  }
  function refineDate(current, extra) {
    const first = publicationDate(current), next = publicationDate(extra);
    if (!first) return next;
    return next.length > first.length && next.startsWith(first + "-") ? next : first;
  }
  function coverUrl(value) {
    if (typeof value !== "string") return "";
    try {
      const u = new URL(value);
      if (u.protocol !== "https:" || u.username || u.password || u.port) return "";
      if (u.hostname === "covers.openlibrary.org" && /^\/b\/(?:id|isbn)\/[0-9X-]+-[SML]\.jpg$/i.test(u.pathname)) {
        u.pathname = u.pathname.replace(/-[SML]\.jpg$/i, "-L.jpg");
        u.searchParams.set("default","false");
      } else if (/^is\d+(?:-ssl)?\.mzstatic\.com$/.test(u.hostname) && /^\/image\//.test(u.pathname)) {
        u.pathname = u.pathname.replace(/\/\d+x\d+[^/]*\.(jpg|jpeg|png)$/i, "/1800x1800bb.$1");
      } else if (u.hostname === "openapi.bnf.fr" && u.pathname === "/couverture/image/image/recupererImage" &&
          (/^(?:97[89]\d{10}|\d{9}[\dX])$/.test(u.searchParams.get("ISBN") || "") || /^ark:\/12148\/cb\d{8}[a-z0-9]$/.test(u.searchParams.get("idArk") || ""))) {
        u.searchParams.set("taille","originale");
      } else if (["books.google.com","books.googleusercontent.com"].includes(u.hostname) && u.pathname === "/books/content"
          && /^[A-Za-z0-9_-]{4,64}$/.test(u.searchParams.get("id") || "")) {
        u.searchParams.delete("edge");
      } else if (!["assets.hardcover.app","images.hardcover.app"].includes(u.hostname)) return "";
      return u.href;
    } catch { return ""; }
  }
  function editionPages(value) {
    if (typeof value !== "number" && !(typeof value === "string" && /^\d+$/.test(value.trim()))) return undefined;
    const pages=Number(value);
    return Number.isSafeInteger(pages) && pages>0 ? pages : undefined;
  }
  function editionIsbn(value) {
    const raw=String(value || "").replace(/[\s-]/g,"").toUpperCase();
    if (!/^(?:97[89]\d{10}|\d{9}[\dX])$/.test(raw)) return "";
    const sum=[...raw].reduce((n,d,i)=>n+(d==="X"?10:Number(d))*(raw.length===10?10-i:i%2?3:1),0);
    if (sum%(raw.length===10?11:10)) return "";
    if (raw.length===13) return raw;
    const base="978"+raw.slice(0,9);
    const check=[...base].reduce((n,d,i)=>n+Number(d)*(i%2?3:1),0);
    return base+(10-check%10)%10;
  }
  function language(value) {
    const name=key(String(value || "").split(/[-_]/)[0]);
    return ({fre:"fr",fra:"fr",francais:"fr",french:"fr",eng:"en",english:"en",anglais:"en",spa:"es",deu:"de",ger:"de",ita:"it"})[name] || name;
  }
  function editorialText(value) {
    if (typeof value!=="string" || value.length>100000) return "";
    const entities={amp:"&",lt:"<",gt:">",quot:'"',apos:"'",nbsp:" ",rsquo:"’",lsquo:"‘",ldquo:"“",rdquo:"”",hellip:"…",ndash:"–",mdash:"—",eacute:"é",egrave:"è",ecirc:"ê",agrave:"à",ccedil:"ç",oelig:"œ"};
    return value.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,"")
      .replace(/<br\s*\/?\s*>/gi,"\n").replace(/<\/(?:p|div|li)>/gi,"\n\n").replace(/<\/?[a-z][^>]*>/gi,"")
      .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi,(whole,k)=>{
        if(k[0]!=="#") return entities[k] ?? whole;
        const n=k[1].toLowerCase()==="x"?parseInt(k.slice(2),16):Number(k.slice(1));
        return n>0 && n<=0x10ffff && !(n>=0xd800 && n<=0xdfff)?String.fromCodePoint(n):whole;
      }).replace(/\r\n?/g,"\n").replace(/\n[ \t]+/g,"\n").replace(/\n{3,}/g,"\n\n").trim();
  }
  globalThis.BookMetadata = Object.freeze({separateTitle,publicationDate,refineDate,coverUrl,editionPages,editionIsbn,language,editorialText});
})();
