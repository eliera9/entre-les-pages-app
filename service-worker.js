const prefix = "entre-les-pages-shell-" + self.registration.scope + "-";
const version = prefix + "lancement-fond-logo-revalidation-v2";
const files = ["art/livre-imprime.webp","add-book.css","add-book.js","app.css","app.js","app.webmanifest","art/add-book/closed.png","art/add-book/cours.png","art/add-book/lu.png","art/add-book/open.png","art/add-book/pile.png","art/add-book/reader.png","art/add-book/star-dark-empty.png","art/add-book/star-dark-full.png","art/add-book/star-dark-half.png","art/add-book/star-light-empty.png","art/add-book/star-light-full.png","art/add-book/star-light-half.png","art/book-detail/book.png","art/book-detail/note.png","art/catalogue-illustrations.png","art/collections-line-art-supplementaire.webp","art/collections-line-art.webp","art/creation-dossier.webp","art/dossier-favorites.png","art/dossier-new.png","art/dossier-reread.png","art/dossier-sagas.png","art/dossier-short.png","art/liste-livres-vignette.png","art/livre-et-coeur.png","art/loupe-recherche.png","art/ornement-filets.png","art/ornement-livre-etoiles.png","art/questionnaire/de.webp","art/questionnaire/decor-autre-monde.webp","art/questionnaire/decor-campagne.webp","art/questionnaire/decor-campus.webp","art/questionnaire/decor-chateau.webp","art/questionnaire/decor-mer.webp","art/questionnaire/decor-plaid-hiver.webp","art/questionnaire/decor-soleil-ete.webp","art/questionnaire/decor-ville-nuit.webp","art/questionnaire/emo-coeur-fond.webp","art/questionnaire/emo-emerveillee.webp","art/questionnaire/emo-frissons.webp","art/questionnaire/emo-moins-seule.webp","art/questionnaire/emo-peur.webp","art/questionnaire/emo-pleurer.webp","art/questionnaire/emo-rire.webp","art/questionnaire/emo-sourire.webp","art/questionnaire/genre-dark-romance.webp","art/questionnaire/genre-fantasy.webp","art/questionnaire/genre-fiction-contemporaine.webp","art/questionnaire/genre-romance-contemporaine.webp","art/questionnaire/genre-romantasy.webp","art/questionnaire/genre-thriller.webp","art/questionnaire/humeur-calin.webp","art/questionnaire/humeur-calme.webp","art/questionnaire/humeur-coeur-lourd.webp","art/questionnaire/humeur-energie.webp","art/questionnaire/humeur-secoue-moi.webp","art/questionnaire/je-ne-sais-pas.webp","art/questionnaire/noirceur-dark.webp","art/questionnaire/noirceur-doux-amer.webp","art/questionnaire/noirceur-feel-good.webp","art/questionnaire/piment.webp","art/questionnaire/surprends-moi.webp","art/questionnaire/temps-1-semaine.webp","art/questionnaire/temps-1-soiree.webp","art/questionnaire/temps-3-a-5-jours.webp","art/questionnaire/trope-enemies-to-lovers.webp","art/questionnaire/trope-forced-proximity.webp","art/questionnaire/trope-found-family.webp","art/questionnaire/trope-grumpy-sunshine.webp","art/questionnaire/trope-huis-clos.webp","art/questionnaire/trope-second-chance.webp","art/questionnaire/trope-slow-burn.webp","art/signature-ma.png","bibliotheque-supabase.js","book-detail.css","book-detail.js","book-scan.js","book-tags.js","catalogue-engine.js","catalogue.css","compte.css","compte.js","fonts/alegreya-LICENSE.txt","fonts/alegreya.woff","fonts/baskervville.woff2","fonts/cormorant-garamond.woff2","fonts/instrument.woff2","fonts/italianno-catalogue.woff2","fonts/italianno-fiche-LICENSE.txt","fonts/italianno-fiche.ttf","fonts/italianno-initial-m.ttf","fonts/playfair-LICENSE.txt","fonts/playfair.woff","fonts/source-sans.woff2","icons/app-192.png","icons/app-512.png","icons/apple-touch-icon.png","index.html","library-sync.js","promesse-form.js","promesse.js","questionnaire.css","questionnaire.js","reader-edition.js","reader-pagination.js","reader.css","reader.js","storage.js","vendor/LUCIDE-LICENSE","vendor/PDFJS-LICENSE","vendor/SUPABASE-LICENSE","vendor/lucide.min.js","vendor/pdf.min.mjs","vendor/pdf.worker.min.mjs","vendor/supabase-2.119.1.js"];

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
  if (path === new URL('app.webmanifest', self.registration.scope).href) {
    event.respondWith(fetch(request, {cache: 'no-cache'}).catch(async () => (await caches.open(version)).match(path)));
    return;
  }
  if (urls.includes(path)) event.respondWith(fetch(request).catch(async () => (await caches.open(version)).match(path)));
});
