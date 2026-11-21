const prefix = "entre-les-pages-shell-" + self.registration.scope + "-";
const version = prefix + "liseuse-progression-141";
const files = ["add-book.css","add-book.js","app.css","app.js","app.webmanifest","art/add-book/closed.png","art/add-book/cours.png","art/add-book/lu.png","art/add-book/open.png","art/add-book/pile.png","art/add-book/reader.png","art/add-book/star-dark-empty.png","art/add-book/star-dark-full.png","art/add-book/star-dark-half.png","art/add-book/star-light-empty.png","art/add-book/star-light-full.png","art/add-book/star-light-half.png","art/book-detail/book.png","art/book-detail/note.png","art/catalogue-illustrations.png","art/collections-line-art-supplementaire.webp","art/collections-line-art.webp","art/creation-dossier.webp","art/dossier-favorites.png","art/dossier-new.png","art/dossier-reread.png","art/dossier-sagas.png","art/dossier-short.png","art/liste-livres-vignette.png","art/livre-et-coeur.png","art/loupe-recherche.png","art/ornement-filets.png","art/ornement-livre-etoiles.png","art/signature-ma.png","bibliotheque-supabase.js","book-detail.css","book-detail.js","book-scan.js","book-tags.js","catalogue-engine.js","catalogue.css","compte.css","compte.js","fonts/alegreya-LICENSE.txt","fonts/alegreya.woff","fonts/baskervville.woff2","fonts/cormorant-garamond.woff2","fonts/instrument.woff2","fonts/italianno-catalogue.woff2","fonts/italianno-fiche-LICENSE.txt","fonts/italianno-fiche.ttf","fonts/italianno-initial-m.ttf","fonts/playfair-LICENSE.txt","fonts/playfair.woff","fonts/source-sans.woff2","icons/app-192.png","icons/app-512.png","icons/apple-touch-icon.png","index.html","library-sync.js","reader-edition.js","reader-pagination.js","reader.css","reader.js","storage.js","vendor/LUCIDE-LICENSE","vendor/PDFJS-LICENSE","vendor/SUPABASE-LICENSE","vendor/lucide.min.js","vendor/pdf.min.mjs","vendor/pdf.worker.min.mjs","vendor/supabase-2.119.1.js"];

const urls = files.map(path => new URL(path,self.registration.scope).href);
const index = new URL('index.html',self.registration.scope).href;
self.addEventListener('install',event => event.waitUntil((async () => {
  const cache = await caches.open(version);
  await cache.addAll(urls.map(url => new Request(url,{cache:'reload'})));
  await self.skipWaiting();
})()));
self.addEventListener('activate',event => event.waitUntil((async () => {
  const keys = await caches.keys();
  for (const key of keys) if (key.startsWith(prefix) && key !== version) await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('fetch',event => {
  const request = event.request;
  const url = new URL(request.url);
  if (url.origin !== location.origin || request.method !== 'GET') return;
  url.search = '';
  const path = request.mode === 'navigate' && url.href === self.registration.scope ? index : url.href;
  if (urls.includes(path)) event.respondWith(fetch(request).catch(async () => (await caches.open(version)).match(path)));
});
