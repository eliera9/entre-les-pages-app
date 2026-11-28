function mountPalIdentity(root, {tagOptions, defaultTropes, change, coverOf, editCover, signal}) {
 root.classList.add('ep-pal-identity');
 root.innerHTML=`<div class="livre">
 <button type="button" class="couverture" aria-label="Modifier la couverture et la fiche"></button>
 <div class="identite">
  <div class="texte-infos">
   <span class="titre-livre" data-texte="title" data-vide="Ajouter un titre" role="textbox" contenteditable="plaintext-only" aria-label="Titre du livre"></span>
   <span class="autrice" data-texte="author" data-vide="Ajouter un nom" role="textbox" contenteditable="plaintext-only" aria-label="Autrice ou auteur"></span>
   <div class="saga"><span data-texte="series" data-vide="Ajouter une saga" role="textbox" contenteditable="plaintext-only" aria-label="Saga"></span><span aria-hidden="true"> · </span><span class="prefixe-tome">Tome </span><span data-texte="volume" data-vide="n°" role="textbox" contenteditable="plaintext-only" aria-label="Tome"></span></div>
   <div class="saga spin" hidden>Spin-Off de <span data-texte="spinOffOf" role="textbox" contenteditable="plaintext-only" aria-label="Livre ou saga d’origine"></span></div>
  </div>
  <div class="rangee-genre-date">
   <div class="recherche-genre"><button type="button" class="jeton" data-champ="genre" aria-label="Modifier le genre"></button></div>

  </div>
 </div>
 <section class="collection reperes" aria-labelledby="ep-reperes-title">
  <h3 class="libelle-groupe" id="ep-reperes-title">Mes repères de lecture</h3>
  <div class="reperes-champs">
   <div class="bloc-parution"><span class="intitule-sortie">Date de sortie</span><div class="champs-date" role="group" aria-label="Date de sortie"></div></div>
   <div class="repere-priorite"><span class="intitule-sortie" id="ep-priorite-label">Priorité de lecture</span>
    <button type="button" class="priorite-valeur" aria-labelledby="ep-priorite-label ep-priorite-valeur" aria-expanded="false" aria-controls="ep-choix-priorite"><span id="ep-priorite-valeur"></span></button>
    <div class="priorite-menu" id="ep-choix-priorite" role="group" aria-labelledby="ep-priorite-label" hidden></div>
   </div>
   <label class="repere-pages"><span class="intitule-sortie">Nombre de pages</span><input type="number" min="1" step="1" inputmode="numeric" placeholder="—"></label>
  </div>
 </section>
 <button type="button" class="collection" data-champ="subgenres"><span class="libelle-groupe">Sous-genres</span><span class="valeurs"></span></button>
 <button type="button" class="collection" data-champ="tropes"><span class="libelle-groupe">Tropes</span><span class="valeurs"></span></button>
</div>
<dialog class="palette ep-tag-sheet" id="ep-pal-palette" aria-labelledby="ep-tag-sheet-title">
 <div class="ep-tag-sheet-inner">
  <div class="ep-tag-sheet-handle" aria-hidden="true"></div>
  <header class="ep-tag-sheet-heading">
   <svg viewBox="0 0 34 30" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 6h15v19l-7.5-5L3 25zM7 11h7M23 2l1.5 4.5L29 8l-4.5 1.5L23 14l-1.5-4.5L17 8l4.5-1.5z"/>
    <circle cx="30" cy="16" r="1"/>
   </svg>
   <h3 id="ep-tag-sheet-title" tabindex="-1" autofocus></h3>
   <button type="button" class="ep-tag-sheet-close" aria-label="Fermer le volet">
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" aria-hidden="true"><path d="m4 4 8 8m0-8-8 8"/></svg>
   </button>
  </header>
  <label class="ep-tag-sheet-input">
   <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" aria-hidden="true"><circle cx="8.5" cy="8.5" r="4.5"/><path d="m12 12 4 4"/></svg>
   <input class="saisie-genre" type="text" autocomplete="off" enterkeyhint="done">
  </label>
  <div class="ep-tag-sheet-group" data-tags-selected hidden>
   <p>Pour ce livre</p><div class="ep-tag-sheet-chips"></div>
  </div>
  <div class="ep-tag-sheet-group" data-tags-results hidden>
   <p></p><div class="ep-tag-sheet-chips"></div>
  </div>
  <button type="button" class="creer-genre" hidden></button>
  <span class="annonce-genre sr-only" role="status"></span>
 </div>
</dialog>`;
 const livre=root.querySelector('.livre'),ligneGenreDate=livre.querySelector('.rangee-genre-date');
 const boutons=Object.fromEntries([...livre.querySelectorAll('[data-champ]')].map(b=>[b.dataset.champ,b]));
 const blocDate=livre.querySelector('.bloc-parution'),champs=blocDate.querySelector('.champs-date'),apercu=root;
 const donnees={genre:'',subgenres:[],tropes:[]};
 let book=null,coverKey='';
 const priorite=livre.querySelector('.repere-priorite');
 const valeurPriorite=priorite.querySelector('.priorite-valeur');
 const menuPriorite=priorite.querySelector('.priorite-menu');
 const pages=livre.querySelector('.repere-pages input');
 const niveaux=[
  ['Plus tard','À lire plus tard','<path d="M5 3h14M5 21h14M7 3c0 6 2 6 5 9-3 2-5 4-5 9m10-18c0 6-2 6-5 9 3 2 5 4 5 9M9 18l3-3 3 3Z"/>'],
  ['Bientôt','À lire bientôt','<path d="M2 7c4-1 7 0 10 3 3-3 6-4 10-3v12c-4-1-7 0-10 2-3-2-6-3-10-2Zm10 3v11M4 10l5 2m6 0 5-2M14 2l.7 2 2 .7-2 .7L14 7l-.7-1.6-1.7-.7 1.7-.7Z"/>'],
  ['En premier','À lire en priorité','<path d="m12 2 2.8 6.5 7 .7-5.2 4.8 1.5 7-6.1-3.6-6.1 3.6 1.4-7L2 9.2l7.2-.7Z M12 2v15.4M2 9.2l10 3 9.8-3"/>']
 ];
 function fermerPriorite(retour=false){
  menuPriorite.hidden=true;
  valeurPriorite.setAttribute('aria-expanded','false');
  if(retour)valeurPriorite.focus({preventScroll:true});
 }
 function afficherPriorite(valeur){
  const niveau=niveaux.find(([cle,nom])=>cle===valeur||nom===valeur)||niveaux[1];
  const choix=[...menuPriorite.children];
  choix.forEach((option,i)=>option.setAttribute('aria-pressed',String(niveaux[i]===niveau)));
  valeurPriorite.firstElementChild.replaceChildren(...Array.from(choix[niveaux.indexOf(niveau)].childNodes,n=>n.cloneNode(true)));
 }
 niveaux.forEach(([cle,nom,dessin])=>{
  const option=bouton('','option-priorite',()=>{
   change(book,'readingPriority',cle);afficherPriorite(cle);fermerPriorite(true);
  });
  option.innerHTML='<svg viewBox="-1 0 26 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round">'+dessin+'</svg>';
  option.append(document.createTextNode(nom));menuPriorite.append(option);
 });
 function ouvrirPriorite(focus=false){
  replier();effacerOuverture();menuPriorite.hidden=false;valeurPriorite.setAttribute('aria-expanded','true');
  if(focus)menuPriorite.querySelector('[aria-pressed=true]').focus();
 }
 valeurPriorite.addEventListener('click',()=>menuPriorite.hidden?ouvrirPriorite():fermerPriorite());
 priorite.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!menuPriorite.hidden){e.preventDefault();e.stopPropagation();fermerPriorite(true);return}
  if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return;
  e.preventDefault();if(menuPriorite.hidden){ouvrirPriorite(true);return}
  const choix=[...menuPriorite.children],i=choix.indexOf(document.activeElement);
  const suivant={Home:0,End:choix.length-1,ArrowDown:(i+1)%choix.length,ArrowUp:(i+choix.length-1)%choix.length};
  choix[suivant[e.key]].focus();
 });
 priorite.addEventListener('focusout',e=>{if(e.relatedTarget&&!priorite.contains(e.relatedTarget))fermerPriorite()});
 pages.addEventListener('input',()=>{
  if(book&&pages.validity.valid)change(book,'pageCount',pages.value===''?null:pages.valueAsNumber);
 });
 pages.addEventListener('blur',()=>{if(book)pages.value=book.pageCount??''});
 function el(tag,cl,tx){const n=document.createElement(tag);if(cl)n.className=cl;if(tx!==undefined)n.textContent=tx;return n}
 function bouton(tx,cl,fn){const b=el('button',cl,tx);b.type='button';b.addEventListener('click',fn);return b}
 function afficher(c){
  if(c==='genre'){
   boutons.genre.textContent=donnees.genre||'Ajouter un genre';
   boutons.genre.setAttribute('aria-label',donnees.genre?'Modifier le genre : '+donnees.genre:'Ajouter un genre');
   return;
  }
  const valeurs=donnees[c];
  const liste=boutons[c].querySelector('.valeurs');
  liste.replaceChildren();
  if(!valeurs.length){liste.textContent=c==='tropes'?'Ajouter un trope':'Ajouter un sous-genre';return}
  valeurs.forEach((nom,i)=>{const groupe=el('span','item');if(i)groupe.append(el('span','puce','•'));groupe.append(el('span','mot',nom));liste.append(groupe)});
 }
 const moisFrancais=new Intl.DateTimeFormat('fr',{month:'long'});
 const frMois=Array.from({length:12},(_,i)=>moisFrancais.format(new Date(2000,i,15)));
 const termes={jour:'Jour',mois:'Mois',annee:'Année'};
 const rubriques={};let listeOuverte=null;
 function morceaux(){
  if(book?.publicationDateParts)return {...book.publicationDateParts};
  const raw=String(book?.publicationDate||book?.publishedDate||'').trim();
  const iso=raw.match(/^(\d{4})(?:-(\d\d?)\b(?:-(\d\d?)(?:$|T))?)?/);
  if(iso)return {jour:Number(iso[3])||0,mois:Number(iso[2])||0,annee:Number(iso[1])};
  const fr=raw.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/);
  if(fr)return {jour:Number(fr[1]),mois:Number(fr[2]),annee:Number(fr[3])};
  const mois=frMois.findIndex(m=>raw.toLowerCase().includes(m))+1,year=raw.match(/\b\d{4}\b/),day=raw.match(/\b\d{1,2}\b/);
  if(mois&&year)return {jour:day?Number(day[0]):0,mois,annee:Number(year[0])};
  const stamp=raw&&Date.parse(raw);
  if(Number.isFinite(stamp)&&year){const d=new Date(stamp);return {jour:day?d.getUTCDate():0,mois:d.getUTCMonth()+1,annee:d.getUTCFullYear()}}
  return {jour:0,mois:0,annee:year?Number(year[0]):0};
 }
 function maxJour(m,a){return m?new Date(Date.UTC(a||2000,m,0)).getUTCDate():31}
 function nomValeur(k,v){if(!v)return {jour:'JJ',mois:'mois',annee:'année'}[k];return k==='mois'?frMois[v-1]:String(v)}
 function choisir(k,val){
  const d=morceaux();d[k]=val;if(d.jour)d.jour=Math.min(d.jour,maxJour(d.mois,d.annee));
  const deux=x=>String(x).padStart(2,'0');
  book.publicationDateParts=d;
  change(book,'publicationDate',d.annee?String(d.annee).padStart(4,'0')+(d.mois?'-'+deux(d.mois)+(d.jour?'-'+deux(d.jour):''):''):'');
  peindre();replier(true);
 }
 function peindre(){
  const d=morceaux();
  Object.entries(rubriques).forEach(([k,x])=>{x.btn.textContent=k==='mois'&&d[k]?String(d[k]).padStart(2,'0'):nomValeur(k,d[k]);x.btn.setAttribute('aria-label',termes[k]+', '+nomValeur(k,d[k]))});
 }
 function hauteur(){
  if(!listeOuverte){apercu.style.removeProperty('--hauteur-date');return}
  const x=rubriques[listeOuverte],a=x.btn.getBoundingClientRect(),f=apercu.getBoundingClientRect(),w=x.menu.offsetWidth;
  const gauche=Math.max(f.left+2,Math.min(f.right-2-w,a.left+(a.width-w)/2));
  x.menu.style.setProperty('--decalage',(gauche-x.btn.parentElement.getBoundingClientRect().left)+'px');
  apercu.style.setProperty('--hauteur-date',Math.ceil(x.menu.getBoundingClientRect().bottom-f.top+5)+'px');
 }
 function fermerListe(){
  if(!listeOuverte)return;const x=rubriques[listeOuverte];x.menu.hidden=true;x.btn.setAttribute('aria-expanded','false');listeOuverte=null;hauteur();
 }
 function replier(focus=false){const active=listeOuverte;fermerListe();if(focus&&active)rubriques[active].btn.focus({preventScroll:true})}
 function listeValeurs(k,filtre){
  const d=morceaux();
  if(k==='jour')return Array.from({length:maxJour(d.mois,d.annee)},(_,i)=>i+1);
  if(k==='mois')return Array.from({length:12},(_,i)=>i+1);
  if(filtre){const y=Number(filtre);return y>=1&&y<=9999?[y]:[]}
  const haut=Math.min(9999,(d.annee||new Date().getFullYear())+20),bas=Math.max(1,(d.annee||new Date().getFullYear())-100);
  return Array.from({length:haut-bas+1},(_,i)=>haut-i);
 }
 function options(k,filtre=''){
  const x=rubriques[k],d=morceaux(),nombres=listeValeurs(k,filtre);
  x.liste.replaceChildren();
  nombres.forEach(n=>{const o=bouton(nomValeur(k,n),'option-val',()=>choisir(k,n));o.setAttribute('role','option');o.setAttribute('aria-selected',String(d[k]===n));o.dataset.valeur=n;x.liste.append(o)});
  if(!nombres.length)x.liste.append(el('span','sans-annee','1 à 9999'));
 }
 function ouvrirListe(k,clavier=false){
  effacerOuverture();if(listeOuverte===k){fermerListe();return}
  fermerListe();const x=rubriques[k];listeOuverte=k;x.menu.hidden=false;x.btn.setAttribute('aria-expanded','true');if(x.recherche)x.recherche.value='';
  options(k);const selection=x.liste.querySelector('[aria-selected=true]');if(selection){
   x.liste.scrollTop+=selection.getBoundingClientRect().top-x.liste.getBoundingClientRect().top-x.liste.clientHeight/2+selection.offsetHeight/2;
   if(clavier)selection.focus({preventScroll:true});
  }
  hauteur();
 }
 for(const [k,libelle] of Object.entries(termes)){
  const cell=el('div','partie-date');cell.dataset.col=k;
  const btn=bouton('','declencheur',()=>ouvrirListe(k)),menu=el('div','options-date'),liste=el('div','liste-date');
  menu.hidden=true;menu.id='elp-menu-date-'+k;liste.id=menu.id+'-liste';
  btn.dataset.partie=k;btn.setAttribute('aria-haspopup','listbox');btn.setAttribute('aria-controls',liste.id);btn.setAttribute('aria-expanded','false');
  liste.setAttribute('role','listbox');liste.setAttribute('aria-label',libelle);let recherche=null;
  if(k==='annee'){
   recherche=el('input','recherche-an');recherche.type='text';recherche.inputMode='numeric';recherche.maxLength=4;recherche.placeholder='AAAA';recherche.setAttribute('aria-label','Chercher une année');
   recherche.addEventListener('input',()=>{recherche.value=recherche.value.replace(/[^0-9]/g,'');options(k,recherche.value)});
   recherche.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key==='ArrowDown'){const o=liste.querySelector('button');if(o){e.preventDefault();if(e.key==='Enter')o.click();else o.focus()}}});menu.append(recherche);
  }
  menu.append(liste);cell.append(btn,menu);if(k!=='jour'){const sep=el('span','barre-oblique','/');sep.setAttribute('aria-hidden','true');champs.append(sep)}champs.append(cell);
  rubriques[k]={btn,menu,liste,recherche};
  btn.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();if(listeOuverte!==k)ouvrirListe(k,true);else liste.querySelector('[aria-selected=true]')?.focus()}});
  liste.addEventListener('keydown',e=>{const items=[...liste.querySelectorAll('button')],pos=items.indexOf(e.target);if(pos<0)return;const idx={ArrowDown:Math.min(pos+1,items.length-1),ArrowUp:Math.max(0,pos-1),Home:0,End:items.length-1}[e.key];if(idx!==undefined){e.preventDefault();items[idx].focus()}});
 }
 const cleGenre=t=>t.trim().toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/œ/g,'oe').replace(/[-’']/g,' ').replace(/\s+/g,' ');
 const palette=root.querySelector('.palette'),saisie=palette.querySelector('.saisie-genre');
 const titreVolet=palette.querySelector('h3');
 const fermerVolet=palette.querySelector('.ep-tag-sheet-close');
 const creer=palette.querySelector('.creer-genre');
 const annonce=palette.querySelector('.annonce-genre');
 const groupeSelection=palette.querySelector('[data-tags-selected]');
 const groupeResultats=palette.querySelector('[data-tags-results]');
 const rubriquesTags={
  genre:{nom:'genre',titre:'Genre',champ:'genres',source:()=>tagOptions.genres},
  subgenres:{nom:'sous-genre',titre:'Sous-genres',champ:'subgenres',source:()=>tagOptions.subgenres},
  tropes:{nom:'trope',titre:'Tropes',champ:'tropes',source:()=>[...tagOptions.tropes,...defaultTropes,...["D’ennemis à amants", "Proximité forcée", "Amour interdit", "Slow burn", "Seconde chance", "Faux couple", "Âmes sœurs", "Famille choisie", "Rivaux", "Amis d’enfance", "Bal masqué", "Quête", "Double identité", "Garde du corps", "Pacte secret", "Mariage arrangé", "Un seul lit", "Amour secret", "Triangle amoureux", "Deuil", "Grincheux et solaire", "Coup de foudre", "Différence d’âge", "Mémoire perdue", "Héros malgré lui", "Alliance fragile", "Course contre la montre", "Retour au pays", "Lettre perdue", "Amis puis amants", "Voyage dans le temps", "Identité cachée", "Rédemption", "Échange de lettres", "Dernière chance", "Rivalité familiale"]]}
 };
 let rubrique='genre';
 let catalogue=[];
 let resultats=[];
 const mesures=document.createElement('canvas').getContext('2d');
 const canon=s=>s.trim().replace(/\s+/g,' ');
 function uniques(items){
  const vus=new Set();
  return items.filter(n=>{
   const k=cleGenre(n);
   if(!k||vus.has(k))return false;
   vus.add(k);
   return true;
  });
 }
 function selection(){return rubrique==='genre'?[donnees.genre].filter(Boolean):donnees[rubrique]}
 function effacerOuverture(){
  if(!palette.open)return;
  palette.close();
  boutons[rubrique].setAttribute('aria-expanded','false');
  saisie.value='';
 }
 function ajusterVolet(){
  const viewport=window.visualViewport;
  if(!viewport||!palette.open)return;
  palette.style.setProperty('--volet-bas',Math.max(0,window.innerHeight-viewport.height-viewport.offsetTop)+'px');
  palette.style.setProperty('--volet-hauteur',viewport.height+'px');
 }
 function ouvrirRubrique(k){
  if(!book||palette.open)return;
  replier();
  fermerPriorite();
  rubrique=k;
  const cfg=rubriquesTags[k];
  titreVolet.textContent=cfg.titre;
  palette.dataset.rubrique=k;
  saisie.placeholder='Chercher ou écrire un '+cfg.nom+'…';
  saisie.setAttribute('aria-label',saisie.placeholder.slice(0,-1));
  catalogue=uniques([...cfg.source(),...tagOptions.used(cfg.champ)]);
  rafraichir();
  boutons[k].setAttribute('aria-expanded','true');
  palette.showModal();
  palette.scrollTop=0;
  ajusterVolet();
 }
 function afficherPastilles(groupe,noms,actifs){
  groupe.hidden=noms.length===0;
  groupe.querySelector('.ep-tag-sheet-chips').replaceChildren(...noms.map(nom=>{
   const b=bouton('','option-genre',()=>choisirValeur(nom,true));
   b.append(el('span','etiquette',nom));
   b.setAttribute('aria-pressed',String(actifs.has(cleGenre(nom))));
   return b;
  }));
 }
 function rafraichir(){
  const cfg=rubriquesTags[rubrique];
  const terme=cleGenre(saisie.value);
  const choisis=selection();
  const actifs=new Set(choisis.map(cleGenre));
  const recents=tagOptions.recent(cfg.champ);
  const options=uniques([...recents,...choisis,...catalogue]);
  resultats=terme?options.filter(n=>cleGenre(n).includes(terme))
   .sort((a,b)=>Number(cleGenre(b).startsWith(terme))-Number(cleGenre(a).startsWith(terme))):recents;
  const codesRecents=new Set(recents.map(cleGenre));
  afficherPastilles(groupeSelection,terme?[]:choisis.filter(n=>!codesRecents.has(cleGenre(n))),actifs);
  groupeResultats.querySelector('p').textContent=terme?'Résultats':'Récemment utilisés';
  afficherPastilles(groupeResultats,resultats,actifs);
  creer.hidden=!terme||options.some(n=>cleGenre(n)===terme);
  creer.textContent='+ Ajouter « '+canon(saisie.value)+' »';
  annonce.textContent=terme&&!resultats.length?'Aucun terme correspondant.':'';
 }
 function choisirValeur(texte,basculer){
  const propre=canon(texte);
  if(!propre)return;
  const cle=cleGenre(propre);
  const nom=resultats.find(n=>cleGenre(n)===cle)||propre;
  if(rubrique==='genre'){
   change(book,'genres',[nom]);
   donnees.genre=nom;
   afficher('genre');
   effacerOuverture();
   ajusterGenreFerme();
   return;
  }
  const valeurs=donnees[rubrique];
  const pos=valeurs.findIndex(n=>cleGenre(n)===cle);
  if(pos>=0&&basculer)valeurs.splice(pos,1);
  else if(pos<0)valeurs.push(nom);
  change(book,rubrique,[...valeurs]);
  afficher(rubrique);
  if(basculer&&!saisie.value.trim()){
   rafraichir();
   const suivant=[...palette.querySelectorAll('.option-genre')].find(b=>cleGenre(b.textContent)===cle);
   (suivant||titreVolet).focus({preventScroll:true});
  }else{
   saisie.value='';
   rafraichir();
   saisie.focus({preventScroll:true});
  }
  annonce.textContent=nom+(pos>=0&&basculer?' retiré.':' sélectionné.');
 }
 function ajusterGenreFerme(){
  const boutonGenre=boutons.genre;
  if(!boutonGenre.firstElementChild){
   const nom=el('span','nom-du-genre',donnees.genre||'Ajouter un genre');
   boutonGenre.replaceChildren(nom);
  }
  if(!ligneGenreDate.clientWidth)return;
  const nom=boutonGenre.firstElementChild;
  const style=getComputedStyle(boutonGenre);
  const etoile=getComputedStyle(boutonGenre,'::before');
  const largeurEtoile=parseFloat(etoile.width)+parseFloat(etoile.marginRight);
  const cadre=parseFloat(style.paddingLeft)+parseFloat(style.paddingRight)+2+(largeurEtoile||0);
  const libre=ligneGenreDate.clientWidth;
  const base=parseFloat(style.fontSize);
  mesures.font=style.fontWeight+' '+base+'px '+style.fontFamily;
  const motLarge=Math.max(...(donnees.genre||'Ajouter un genre').split(/\s+/).map(v=>mesures.measureText(v).width+v.length*parseFloat(style.letterSpacing||0)));
  const taille=Math.min(base,Math.max(11.5,base*(libre-cadre-1)/Math.max(1,motLarge)));
  nom.style.fontSize=taille+'px';
  const echelle=Math.min(1,Math.max(.01,(libre-cadre-1)/(motLarge*taille/base)));
  if(echelle<1){
   nom.style.width=(Math.max(1,libre-cadre)/echelle)+'px';
   nom.style.flex='none';nom.style.transform='scaleX('+echelle+')';
   nom.style.transformOrigin='left center';nom.style.marginRight=-(1-echelle)*parseFloat(nom.style.width)+'px';
  }else{
   for(const prop of ['width','flex','transform','transform-origin','margin-right'])nom.style.removeProperty(prop);
  }
 }
 const suivreGenre=new ResizeObserver(ajusterGenreFerme);suivreGenre.observe(ligneGenreDate);
 document.fonts.ready.then(()=>{if(!signal.aborted)ajusterGenreFerme()});
 for(const [k,b] of Object.entries(boutons)){
  b.setAttribute('aria-controls',palette.id);
  b.setAttribute('aria-haspopup','dialog');
  b.setAttribute('aria-expanded','false');
  if(k!=='genre')afficher(k);
  b.addEventListener('click',()=>ouvrirRubrique(k));
 }
 saisie.addEventListener('input',rafraichir);
 saisie.addEventListener('keydown',e=>{
  if(e.isComposing)return;
  if(e.key==='Enter'){
   e.preventDefault();
   const terme=cleGenre(saisie.value);
   const existant=resultats.find(n=>cleGenre(n)===terme);
   if(existant||!creer.hidden)choisirValeur(existant||saisie.value,false);
  }
  if(e.key==='ArrowDown'){
   const premier=palette.querySelector('[data-tags-results] .option-genre')||(!creer.hidden&&creer);
   if(premier){e.preventDefault();premier.focus()}
  }
 });
 creer.addEventListener('click',()=>choisirValeur(saisie.value,false));
 fermerVolet.addEventListener('click',effacerOuverture);
 palette.addEventListener('click',e=>{if(e.target===palette)effacerOuverture()});
 palette.addEventListener('cancel',e=>{e.preventDefault();effacerOuverture()});
 palette.addEventListener('keydown',e=>{if(e.key==='Escape')e.stopPropagation()});
 window.visualViewport?.addEventListener('resize',ajusterVolet,{signal});
 window.visualViewport?.addEventListener('scroll',ajusterVolet,{signal});
 const champsTexte=[...root.querySelectorAll('[data-texte]')];
 for(const field of champsTexte){
  const key=field.dataset.texte;
  if(key==='series'||key==='volume')field.setAttribute('aria-placeholder',field.dataset.vide);
  field.addEventListener('input',()=>{if(book)change(book,key,field.textContent.trim())});
  field.addEventListener('focus',()=>{field.dataset.avant=String(book?.[key]||'');effacerOuverture();replier()});
  field.addEventListener('keydown',e=>{
   if(e.isComposing)return;
   if(e.key==='Escape'){e.preventDefault();e.stopPropagation();field.textContent=field.dataset.avant;change(book,key,field.textContent);field.blur()}
   if(e.key==='Enter'){e.preventDefault();field.blur()}
  });
  field.addEventListener('blur',()=>{if(book)field.textContent=String(book[key]||'')});
 }
 const cover=livre.querySelector('.couverture');cover.addEventListener('click',editCover);
 document.addEventListener('pointerdown',e=>{if(!priorite.contains(e.target))fermerPriorite();if(!blocDate.contains(e.target))replier()},{signal});
 blocDate.addEventListener('keydown',e=>{if(e.key==='Escape'&&listeOuverte){e.preventDefault();e.stopPropagation();replier(true)}});
 blocDate.addEventListener('focusout',e=>{if(e.relatedTarget&&!blocDate.contains(e.relatedTarget))replier()});
 signal.addEventListener('abort',()=>{effacerOuverture();suivreGenre.disconnect()},{once:true});
 function update(next){
  if(!next)return;
  if(book!==next){fermerPriorite();effacerOuverture();replier();coverKey=''}
  book=next;
  afficherPriorite(book.readingPriority);
  if(document.activeElement!==pages)pages.value=book.pageCount??'';
  for(const field of champsTexte)if(document.activeElement!==field)field.textContent=String(book[field.dataset.texte]??'');
  const spin=livre.querySelector('.spin');
  spin.hidden=!String(book.spinOffOf || '').trim();
  livre.querySelector('.saga:not(.spin)').hidden=!spin.hidden;
  const currentKey=JSON.stringify([book.title,book.coverData]);
  if(coverKey!==currentKey){cover.replaceChildren(coverOf(book));coverKey=currentKey}
  donnees.genre=book.genres?.[0]||'';
  donnees.subgenres=[...(book.subgenres||[])];donnees.tropes=[...(book.tropes||[])];
  Object.keys(boutons).forEach(afficher);ajusterGenreFerme();peindre();
  if(palette.open)rafraichir()
 }
 return {update,close(){fermerPriorite();effacerOuverture();replier()},focusTitle(){champsTexte[0].focus()}};
}
