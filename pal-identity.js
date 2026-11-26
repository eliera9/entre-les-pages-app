function mountPalIdentity(root, {tagOptions, defaultTropes, change, coverOf, editCover, signal}) {
 root.classList.add('ep-pal-identity');
 root.dataset.pastilles='galets';
 root.dataset.repere='points';
 root.dataset.saisie='ligne';
 root.innerHTML=`<div class="livre">
 <button type="button" class="couverture" aria-label="Modifier la couverture et la fiche"></button>
 <div class="identite">
  <div class="texte-infos">
   <span class="titre-livre" data-texte="title" data-vide="Ajouter un titre" role="textbox" contenteditable="plaintext-only" aria-label="Titre du livre"></span>
   <span class="autrice" data-texte="author" data-vide="Ajouter un nom" role="textbox" contenteditable="plaintext-only" aria-label="Autrice ou auteur"></span>
   <div class="saga"><span data-texte="series" data-vide="Ajouter une saga" role="textbox" contenteditable="plaintext-only" aria-label="Saga"></span><span aria-hidden="true"> · </span><span class="prefixe-tome">Tome </span><span data-texte="volume" data-vide="…" role="textbox" contenteditable="plaintext-only" aria-label="Tome"></span></div>
   <small class="spin" hidden></small>
  </div>
  <div class="rangee-genre-date">
   <div class="recherche-genre"><button type="button" class="jeton" data-champ="genre" aria-label="Modifier le genre"></button></div>
   <div class="bloc-parution"><span class="intitule-sortie"><i class="icone-agenda" aria-hidden="true"></i>Date de sortie</span><div class="champs-date" role="group" aria-label="Date de sortie"></div></div>
  </div>
 </div>
 <section class="palette" id="ep-pal-palette" hidden><label class="barre-ecrire"><input class="saisie-genre" type="text" autocomplete="off" enterkeyhint="done"></label>
  <div class="piste-genres" id="ep-pal-piste" role="region" aria-roledescription="carrousel"></div>
  <div class="pages-genres" hidden><span class="repere-points" role="group"></span><span class="lecture-page sr-only" aria-live="polite"></span></div>
  <button type="button" class="creer-genre" hidden></button><span class="annonce-genre sr-only" role="status"></span>
 </section>
 <button type="button" class="collection" data-champ="subgenres"><span class="libelle-groupe">Sous-genres</span><span class="valeurs"></span></button>
 <button type="button" class="collection" data-champ="tropes"><span class="libelle-groupe">Tropes</span><span class="valeurs"></span></button>
</div>`;
 const livre=root.querySelector('.livre'),ligneGenreDate=livre.querySelector('.rangee-genre-date');
 const boutons=Object.fromEntries([...livre.querySelectorAll('[data-champ]')].map(b=>[b.dataset.champ,b]));
 const blocDate=livre.querySelector('.bloc-parution'),champs=blocDate.querySelector('.champs-date'),apercu=root;
 const donnees={genre:'',subgenres:[],tropes:[]};
 let book=null,coverKey='';
 function el(tag,cl,tx){const n=document.createElement(tag);if(cl)n.className=cl;if(tx!==undefined)n.textContent=tx;return n}
 function bouton(tx,cl,fn){const b=el('button',cl,tx);b.type='button';b.addEventListener('click',fn);return b}
 function afficher(c){
  if(c==='genre'){boutons.genre.textContent=donnees.genre||'Ajouter un genre';return}
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
  Object.entries(rubriques).forEach(([k,x])=>{x.btn.textContent=nomValeur(k,d[k]);x.btn.setAttribute('aria-label',termes[k]+', '+x.btn.textContent)});
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
 const palette=root.querySelector('.palette'),saisie=palette.querySelector('.saisie-genre'),piste=palette.querySelector('.piste-genres');
 const creer=palette.querySelector('.creer-genre'),points=palette.querySelector('.repere-points'),navPoints=palette.querySelector('.pages-genres'),annonce=palette.querySelector('.annonce-genre');
 const genreAncre=document.createComment('Palette du genre');palette.before(genreAncre);
 const rubriquesTags={
  genre:{nom:'genre',pluriel:'genres',colonnes:3,source:[...tagOptions.genres],priorites:['Romantasy','Fantasy','Thriller','Dark romance','Policier','Science-fiction','Mystère','Aventure','Fantastique']},
  subgenres:{nom:'sous-genre',pluriel:'sous-genres',colonnes:4,source:[...tagOptions.subgenres],priorites:['High fantasy','Fae fantasy','Grimdark','Cozy fantasy','Epic fantasy','Dark fantasy','Royal','Dragon fantasy','Yakuza','Low fantasy','Small town','Gothique']},
  tropes:{nom:'trope',pluriel:'tropes',colonnes:4,source:[...tagOptions.tropes,...defaultTropes,...["D’ennemis à amants", "Proximité forcée", "Amour interdit", "Slow burn", "Seconde chance", "Faux couple", "Âmes sœurs", "Famille choisie", "Rivaux", "Amis d’enfance", "Bal masqué", "Quête", "Double identité", "Garde du corps", "Pacte secret", "Mariage arrangé", "Un seul lit", "Amour secret", "Triangle amoureux", "Deuil", "Grincheux et solaire", "Coup de foudre", "Différence d’âge", "Mémoire perdue", "Héros malgré lui", "Alliance fragile", "Course contre la montre", "Retour au pays", "Lettre perdue", "Amis puis amants", "Voyage dans le temps", "Identité cachée", "Rédemption", "Échange de lettres", "Dernière chance", "Rivalité familiale"]],priorites:[]}
 };
 let rubrique='subgenres',indexPage=0,ordre=[],liste=[];
 const mesures=document.createElement('canvas').getContext('2d');
 const canon=s=>s.trim().replace(/\s+/g,' ');
 function uniques(items){const vus=new Set();return items.filter(n=>{const k=cleGenre(n);if(!k||vus.has(k))return false;vus.add(k);return true})}
 function selection(){return rubrique==='genre'?[donnees.genre]:donnees[rubrique]}
 function ordonner(){
  const cfg=rubriquesTags[rubrique];
  ordre=uniques([...selection(),...cfg.priorites,...cfg.source].filter(Boolean));
 }
 function effacerOuverture(focus=false){
  const ligne=boutons[rubrique];palette.hidden=true;ligne.setAttribute('aria-expanded','false');saisie.value='';
  if(focus)ligne.focus({preventScroll:true});
 }
 function ouvrirRubrique(k,focus=false){
  effacerOuverture();replier();rubrique=k;const cfg=rubriquesTags[k];
  (k==='genre'?genreAncre:boutons[k]).after(palette);
  palette.dataset.rubrique=k;palette.hidden=false;boutons[k].setAttribute('aria-expanded','true');
  palette.setAttribute('aria-label','Modifier les '+cfg.pluriel);
  saisie.setAttribute('aria-label','Chercher ou écrire un '+cfg.nom);saisie.placeholder='Chercher ou écrire un '+cfg.nom+'…';
  piste.setAttribute('aria-label',cfg.pluriel);points.setAttribute('aria-label','Pages de '+cfg.pluriel);
  ordonner();rafraichir();if(focus)saisie.focus({preventScroll:true});
 }
 function hauteurActive(){
  const h=piste.children[indexPage]?.offsetHeight;piste.style.height=h?h+'px':'';
 }
 function afficherPoints(index){
  const total=piste.childElementCount;
  indexPage=Math.max(0,Math.min(index,total-1));
  const debut=Math.max(0,Math.min(indexPage-2,total-5)),fin=Math.min(total,debut+5);
  if(points.dataset.fenetre!==[debut,fin,total,rubrique].join('-')){
   const avant=document.activeElement;const garder=points.contains(avant)?avant.dataset.index:null;
   points.replaceChildren();
   for(let i=debut;i<fin;i++){
    const b=bouton('','point-page',()=>allerPage(i));b.dataset.index=i;
    b.setAttribute('aria-controls',piste.id);b.setAttribute('aria-label','Page '+(i+1)+' de '+rubriquesTags[rubrique].pluriel);points.append(b);
   }
   points.dataset.fenetre=[debut,fin,total,rubrique].join('-');
   if(garder!=null)points.querySelector('[data-index="'+garder+'"]')?.focus({preventScroll:true});
  }
  for(const b of points.children)b.setAttribute('aria-current',Number(b.dataset.index)===indexPage?'page':'false');
  navPoints.hidden=total<2;
  Array.from(piste.children).forEach((p,i)=>{p.inert=i!==indexPage});
  palette.querySelector('.lecture-page').textContent=total?'Page '+(indexPage+1)+' sur '+total:'';
  hauteurActive();
 }
 function allerPage(i){
  if(!piste.children[i])return;
  piste.scrollTo({left:i*piste.clientWidth,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 }
 piste.addEventListener('scroll',()=>{if(piste.clientWidth)afficherPoints(Math.round(piste.scrollLeft/piste.clientWidth))},{passive:true});
 function typographie(px){mesures.font=px+'px '+getComputedStyle(palette).getPropertyValue('--lettres-etiquettes').trim()}
 // Allocate space for whole words first, then distribute the remaining space toward the natural label widths.
 function ajusterLigne(row){
  const boutonsLigne=[...row.children],n=boutonsLigne.length,gap=parseFloat(getComputedStyle(row).columnGap)||0;
  const dispo=row.clientWidth-gap*(n-1);if(dispo<1||!n)return;
  const multi=rubrique!=='genre';const maximum=parseFloat(getComputedStyle(palette).getPropertyValue(multi?'--taille-multiple':'--taille-genre'));
  const pad=multi?5:9;typographie(maximum);
  const mots=boutonsLigne.map(b=>Math.max(...b.textContent.split(/\s+/).map(m=>mesures.measureText(m).width)));

  const mini=mots.reduce((a,v)=>a+v,0),base=pad*2+3;
  const ratio=Math.min(1,(dispo-n*base)/Math.max(1,mini));
  const padding=ratio>=.9?pad:2;
  const cadre=padding*2+3;
  const facteur=Math.min(1,(dispo-n*cadre)/Math.max(1,mini));
  const taille=Math.max(1,Math.floor(maximum*facteur*10)/10);
  typographie(taille);
  const minima=boutonsLigne.map(b=>Math.ceil(Math.max(...b.textContent.split(/\s+/).map(m=>mesures.measureText(m).width)))+padding*2+2);
  const souhaits=boutonsLigne.map((b,i)=>Math.max(minima[i],Math.ceil(mesures.measureText(b.textContent).width)+padding*2+2));
  const sommeMin=minima.reduce((a,x)=>a+x,0),besoin=souhaits.reduce((a,x,i)=>a+x-minima[i],0);
  const partage=besoin?Math.min(1,Math.max(0,dispo-sommeMin)/besoin):0;
  boutonsLigne.forEach((b,i)=>{
   const largeur=minima[i]+partage*(souhaits[i]-minima[i]);
   const corps=Math.max(taille,11.5);
   const texte=b.firstElementChild;
   typographie(corps);
   const motMax=Math.max(...texte.textContent.split(/\s+/).map(m=>mesures.measureText(m).width));
   const espace=Math.max(1,largeur-2*padding-2);
   const echelle=Math.min(1,espace/(motMax+.5));
   b.style.fontSize=corps+'px';b.style.paddingInline=padding+'px';b.style.width=largeur+'px';
   texte.style.width=(espace/echelle)+'px';texte.style.transform='scaleX('+echelle+')';

  });
 }
 function tailleDesLibelles(){
  if(palette.hidden||!piste.clientWidth)return;
  piste.querySelectorAll('.rangee-choix').forEach(ajusterLigne);hauteurActive();
 }
 let largeurRecente=0;
 const voirTaille=new ResizeObserver(()=>{const l=piste.clientWidth;if(!l||palette.hidden)return;if(l!==largeurRecente){largeurRecente=l;rafraichir()}else tailleDesLibelles()});voirTaille.observe(piste);
 function composerRangees(noms,colonnes){
  if(!noms.length)return [];
  typographie(11.4);
  const dispo=palette.clientWidth-2;
  const ecart=colonnes===3?6:4;
  const poids=nom=>Math.ceil(Math.max(...nom.split(/\s+/).map(m=>mesures.measureText(m).width)))+7+ecart;
  const poidsMax=dispo+ecart;
  const elements=noms.map((nom,position)=>({nom,position,poids:poids(nom)}));
  const lignes=[];
  for(let i=0;i<elements.length;i+=colonnes){
   const valeurs=elements.slice(i,i+colonnes);
   lignes.push({valeurs,somme:valeurs.reduce((sum,x)=>sum+x.poids,0)});
  }
  // Pair long words with shorter neighbours so every word fits at a legible size.
  for(const ligne of lignes){
   while(ligne.somme>poidsMax){
    let gain=0,echange=null;
    for(const autre of lignes.slice(Math.floor(lignes.indexOf(ligne)/3)*3,Math.floor(lignes.indexOf(ligne)/3)*3+3)){
     if(autre===ligne||autre.somme>=poidsMax)continue;
     for(const a of ligne.valeurs)for(const b of autre.valeurs){
      const delta=a.poids-b.poids;
      if(delta>gain&&autre.somme+delta<=poidsMax){gain=delta;echange={autre,a,b}}
     }
    }
    if(!echange)break;
    const {autre,a,b}=echange;
    ligne.valeurs[ligne.valeurs.indexOf(a)]=b;autre.valeurs[autre.valeurs.indexOf(b)]=a;
    ligne.somme-=gain;autre.somme+=gain;
   }
  }
  return lignes.map(ligne=>ligne.valeurs.sort((a,b)=>a.position-b.position).map(x=>x.nom));
 }
 function rafraichir(){
  const cfg=rubriquesTags[rubrique],cle=cleGenre(saisie.value),actifs=new Set(selection().map(cleGenre));
  liste=ordre.filter(n=>!cle||cleGenre(n).includes(cle));piste.replaceChildren();indexPage=0;
  const lignes=composerRangees(liste,cfg.colonnes);
  for(let i=0;i<lignes.length;i+=3){
   const page=el('div','page-genres');
   page.setAttribute('role','group');page.setAttribute('aria-label','Page '+(1+i/3));
   for(const groupe of lignes.slice(i,i+3)){
    const ligne=el('div','rangee-choix');
    for(const nom of groupe){
     const b=bouton('','option-genre',()=>choisirValeur(nom,true));b.append(el('span','etiquette',nom));
     b.setAttribute('aria-pressed',String(actifs.has(cleGenre(nom))));ligne.append(b);
    }
    page.append(ligne);
   }
   piste.append(page);
  }
  piste.scrollLeft=0;tailleDesLibelles();afficherPoints(0);
  creer.hidden=!cle||ordre.some(n=>cleGenre(n)===cle);
  creer.textContent='＋ Ajouter « '+canon(saisie.value)+' »';
  annonce.textContent=cle&&!liste.length?'Aucun résultat. Tu peux ajouter ce libellé.':'';
 }
 function choisirValeur(texte,basculer){
  const propre=canon(texte);if(!propre)return;
  const cle=cleGenre(propre),cfg=rubriquesTags[rubrique];
  const nom=ordre.find(n=>cleGenre(n)===cle)||propre;
  if(!ordre.includes(nom)){ordre.push(nom);cfg.source.push(nom)}
  if(rubrique==='genre'){
   change(book,'genres',[nom]);donnees.genre=nom;afficher('genre');boutons.genre.setAttribute('aria-label','Modifier le genre : '+nom);
   effacerOuverture(true);ajusterGenreFerme();return;
  }
  const valeurs=donnees[rubrique],pos=valeurs.findIndex(n=>cleGenre(n)===cle);
  if(pos>=0&&basculer)valeurs.splice(pos,1);else if(pos<0)valeurs.push(nom);
  change(book,rubrique,[...valeurs]);afficher(rubrique);
  if(basculer){
   for(const b of piste.querySelectorAll('.option-genre'))if(cleGenre(b.textContent)===cle)b.setAttribute('aria-pressed',String(pos<0));
  }else{
   saisie.value='';ordonner();rafraichir();saisie.focus({preventScroll:true});
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
  const libre=ligneGenreDate.clientWidth-blocDate.getBoundingClientRect().width-parseFloat(getComputedStyle(ligneGenreDate).columnGap);
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
 const suivreGenre=new ResizeObserver(ajusterGenreFerme);suivreGenre.observe(ligneGenreDate);suivreGenre.observe(blocDate);
 document.fonts.ready.then(()=>{if(!palette.hidden)rafraichir();ajusterGenreFerme()});
 for(const k of Object.keys(rubriquesTags)){
  const b=boutons[k];b.setAttribute('aria-controls',palette.id);b.setAttribute('aria-expanded','false');
  if(k!=='genre')afficher(k);
  b.addEventListener('click',e=>{if(!palette.hidden&&rubrique===k)effacerOuverture();else ouvrirRubrique(k,e.detail===0)});
 }
 saisie.addEventListener('input',rafraichir);
 saisie.addEventListener('keydown',e=>{
  if(e.isComposing)return;
  if(e.key==='Enter'&&saisie.value.trim()){e.preventDefault();choisirValeur(saisie.value,false)}
  if(e.key==='ArrowDown'){const b=piste.children[indexPage]?.querySelector('button')||(!creer.hidden&&creer);if(b){e.preventDefault();b.focus()}}
 });
 creer.addEventListener('click',()=>choisirValeur(saisie.value,false));
 palette.addEventListener('keydown',e=>{
  if(e.key==='Escape'){e.stopPropagation();e.preventDefault();effacerOuverture(true);return}
  if(!piste.contains(e.target))return;
  const pas={ArrowLeft:-1,ArrowRight:1}[e.key];if(!pas||!piste.children[indexPage+pas])return;
  e.preventDefault();allerPage(indexPage+pas);const suivant=piste.children[indexPage+pas];suivant.inert=false;suivant.querySelector('button').focus({preventScroll:true});
 });
 livre.addEventListener('click',e=>{if(!palette.hidden&&!palette.contains(e.target)&&!e.target.closest('[data-champ="genre"],[data-champ="subgenres"],[data-champ="tropes"]'))effacerOuverture()});
 const champsTexte=[...root.querySelectorAll('[data-texte]')];
 for(const field of champsTexte){
  const key=field.dataset.texte;
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
 document.addEventListener('pointerdown',e=>{if(!blocDate.contains(e.target))replier();if(!root.contains(e.target)&&!palette.hidden)effacerOuverture()},{signal});
 blocDate.addEventListener('keydown',e=>{if(e.key==='Escape'&&listeOuverte){e.preventDefault();e.stopPropagation();replier(true)}});
 blocDate.addEventListener('focusout',e=>{if(e.relatedTarget&&!blocDate.contains(e.relatedTarget))replier()});
 signal.addEventListener('abort',()=>{suivreGenre.disconnect();voirTaille.disconnect()},{once:true});
 function update(next){
  if(!next)return;
  if(book!==next){effacerOuverture();replier();coverKey=''}
  book=next;
  for(const field of champsTexte)if(document.activeElement!==field)field.textContent=String(book[field.dataset.texte]??'');
  const spin=livre.querySelector('.spin');spin.hidden=!book.spinOffOf;spin.textContent=spin.hidden?'':'Spin-off de '+book.spinOffOf;
  const currentKey=JSON.stringify([book.title,book.coverData]);
  if(coverKey!==currentKey){cover.replaceChildren(coverOf(book));coverKey=currentKey}
  donnees.genre=book.genres?.[0]||'';
  donnees.subgenres=[...(book.subgenres||[])];donnees.tropes=[...(book.tropes||[])];
  Object.keys(boutons).forEach(afficher);ajusterGenreFerme();peindre();
  if(!palette.hidden){ordonner();rafraichir()}
 }
 return {update,close(){effacerOuverture();replier()},focusTitle(){champsTexte[0].focus()}};
}
