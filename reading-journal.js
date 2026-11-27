
function mountReadingJournal(host,signal){
  const root=host.attachShadow({mode:'open'});
  root.innerHTML="<link rel=\"stylesheet\" href=\"./reading-journal.css?v=1\"><fieldset class=\"progression\"><legend><span class=\"section-label\">✧　Ma progression</span></legend><div class=\"positions\">\n<label>Page<input name=\"page\" type=\"number\" inputmode=\"numeric\" min=\"0\" step=\"1\" placeholder=\"—\" aria-describedby=\"feedback\"></label>\n<label>Chapitre<input name=\"chapter\" type=\"number\" inputmode=\"numeric\" min=\"0\" step=\"1\" placeholder=\"—\" aria-describedby=\"feedback\"></label>\n<label><abbr title=\"Pourcentage\" aria-label=\"Pourcentage\">%</abbr><input name=\"percent\" aria-label=\"Pourcentage\" type=\"number\" inputmode=\"numeric\" min=\"0\" max=\"100\" step=\"1\" placeholder=\"—\" aria-describedby=\"feedback\"></label>\n</div><div class=\"line\" hidden aria-hidden=\"true\"><div class=\"fill\"></div>\n<span class=\"quarter\" style=\"left:25%\"></span>\n<span class=\"quarter\" style=\"left:50%\"></span>\n<span class=\"quarter\" style=\"left:75%\"></span>\n<span class=\"reading-star\"></span></div><p class=\"msg\" role=\"status\" id=\"feedback\"></p></fieldset><div class=\"journal\"><h1><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\"><path d=\"M5 2h14v20l-7-5-7 5z\"></path><path d=\"m12 5 1 3 3 1-3 1-1 3-1-3-3-1 3-1z\"></path></svg>Ma lecture jusqu’ici</h1><div class=\"track\" role=\"region\" aria-label=\"Ma lecture jusqu’ici\" aria-roledescription=\"carrousel\"><div id=\"feel\"><section><div class=\"k\">Mon ressenti</div><h2>Comment te sens-tu dans cette lecture ?</h2><p>Tu peux cocher plusieurs phrases.</p><details name=\"rubriques\"><summary>Mon envie de lire<span aria-hidden=\"true\"></span></summary><label><input type=\"checkbox\">J’ai envie de savoir ce qui va se passer.</label><label><input type=\"checkbox\">Je me dis « encore un chapitre » et je continue.</label><label><input type=\"checkbox\">Je savoure cette lecture, j’ai envie de prendre mon temps.</label><label><input type=\"checkbox\">Pour l’instant, j’ai du mal à m’y remettre.</label><label><input type=\"checkbox\">Je trouve le temps long entre deux moments qui m’intéressent.</label><label><input type=\"checkbox\">Je me demande si j’ai envie de continuer ce livre.</label></details><details name=\"rubriques\"><summary>Mon lien avec l’histoire<span aria-hidden=\"true\"></span></summary><label><input type=\"checkbox\">Je m’attache aux personnages.</label><label><input type=\"checkbox\">J’ai l’impression d’être là, au milieu de la scène.</label><label><input type=\"checkbox\">Un personnage me donne du fil à retordre, mais j’ai envie de le comprendre.</label><label><input type=\"checkbox\">Je suis l’histoire, mais je me sens encore un peu à distance.</label><label><input type=\"checkbox\">Je me sens perdue entre les personnages et les événements.</label><label><input type=\"checkbox\">Les décisions d’un personnage m’agacent.</label></details><details name=\"rubriques\" open><summary>Ce que ça me fait<span aria-hidden=\"true\"></span></summary><label><input type=\"checkbox\">Cette lecture me fait du bien.</label><label><input type=\"checkbox\">Certains passages me touchent plus que je ne m’y attendais.</label><label><input type=\"checkbox\">Je ressens la tension, j’appréhende la suite.</label><label><input type=\"checkbox\">Mon ressenti change d’un chapitre à l’autre.</label><label><input type=\"checkbox\">Certains passages me mettent mal à l’aise.</label><label><input type=\"checkbox\">Cette lecture me remue et j’ai besoin de souffler.</label></details></section></div><div class=\"notes\" id=\"notes\"><section><form><fieldset><legend>Mes notes de lecture</legend><div class=\"subjects\"></div></fieldset><div class=\"loc\"><label>Page<input name=\"page\" type=\"number\" min=\"0\" ></label><label>Chapitre<input name=\"chap\" type=\"number\" min=\"0\" ></label></div><label class=\"prompt\" for=\"note\"></label><textarea id=\"note\" required></textarea><button class=\"save\">Ajouter la note</button></form><ul aria-live=\"polite\"></ul></section></div></div><div class=\"dots\" role=\"group\" aria-label=\"Choisir une diapo\"><button aria-label=\"Mon ressenti\" aria-controls=\"feel\" aria-current=\"page\"></button><button aria-label=\"Mes notes\" aria-controls=\"notes\"></button></div></div>";
  const q=selector=>root.querySelector(selector);
  const all=selector=>Array.from(root.querySelectorAll(selector));
  const positions=all('.positions input');
  const loc=q('.loc'),field=q('textarea'),track=q('.track'),slides=Array.from(track.children),dots=all('.dots button');
  const prompts={Scène:'Quel moment veux-tu garder en mémoire ?',Personnage:'Qu’as-tu remarqué chez ce personnage ?',Théorie:'Qu’est-ce que tu soupçonnes pour la suite ?',Question:'Quelle question te poses-tu à ce stade ?',Citation:'Quelle phrase veux-tu garder mot pour mot ?',Indice:'Quel détail pourrait compter pour la suite ?'};
  let book,subject,notes=[],drafts={};
  const number=input=>input.value===''?null:input.valueAsNumber;
  function progress(){
    const input=positions[2], value=number(input);
    q('.line').hidden=false;
    q('.reading-star').hidden=value===null||!input.validity.valid;
    q('.line').style.setProperty('--position',(input.validity.valid&&value!==null?value:0)+'%');
    for(const [i,marker] of all('.loc input').entries())if(!marker.dataset.manual)marker.value=positions[i].value;
  }
  positions.forEach(input=>input.oninput=progress);
  for(const input of all('.loc input'))input.oninput=()=>input.dataset.manual='1';
  function select(key){if(subject)drafts[subject]=field.value;subject=key;field.value=drafts[key]||'';q('.prompt').textContent=prompts[key];all('.subjects button').forEach(b=>b.setAttribute('aria-pressed',String(b.textContent===key)))}
  for(const key of Object.keys(prompts)){const b=document.createElement('button');b.type='button';b.textContent=key;b.onclick=()=>select(key);q('.subjects').append(b)}
  function list(){q('ul').replaceChildren(...notes.map(n=>{const li=document.createElement('li');li.textContent=[n.subject,n.page!=null?'p. '+n.page:'',n.chapter!=null?'ch. '+n.chapter:''].filter(Boolean).join(' · ')+'\n'+n.text;return li}))}
  q('form').onsubmit=e=>{e.preventDefault();if(!field.value.trim())return;notes.push({subject,page:number(loc.querySelector('[name=page]')),chapter:number(loc.querySelector('[name=chap]')),text:field.value.trim()});field.value='';drafts[subject]='';list()};
  function sync(){if(!track.clientWidth)return;const i=Math.max(0,Math.min(1,Math.round(track.scrollLeft/(track.clientWidth+12))));dots.forEach((b,k)=>{b.setAttribute('aria-current',k===i?'page':'false');slides[k].inert=k!==i});track.style.height=slides[i].offsetHeight+'px'}
  dots.forEach((b,i)=>b.onclick=()=>track.scrollTo({left:i*(track.clientWidth+12),behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'}));
  track.onscroll=sync;const observer=new ResizeObserver(sync);slides.forEach(s=>observer.observe(s));signal.addEventListener('abort',()=>observer.disconnect(),{once:true});
  let initialPositions;
  return {open(next){if(book===next)return;book=next;const data=book.readingJournal||{},old=book.readingPosition;
    positions.forEach(input=>{
      const name=input.name;
      const legacy=name==='chapter'?book.chapter:name==='percent'?book.progress:null;
      input.value=old?.[name] ?? data[name] ?? (old?.unit===name?old.value:legacy) ?? '';
    });
    initialPositions=positions.map(i=>i.value);
    for(const i of all('.loc input'))delete i.dataset.manual;
    all('input[type=checkbox]').forEach(i=>i.checked=(data.feelings||[]).includes(i.parentElement.textContent));
    notes=[...(data.notes||[])];drafts={};subject=null;select('Scène');progress();list();track.scrollLeft=0;requestAnimationFrame(sync)
  },values(){for(const i of positions)if(!i.reportValidity())return null;
    const [page,chapter,percent]=positions.map(number);
    const readingJournal={page,chapter,percent,notes:[...notes],feelings:all('input:checked').map(i=>i.parentElement.textContent)};
    const marker=page!==null?{unit:'page',value:page}:chapter!==null?{unit:'chapter',value:chapter}:percent!==null?{unit:'percent',value:percent}:null;
    return {readingJournal,...(marker && (!book.readingPosition || positions.some((i,k)=>i.value!==initialPositions[k]))?{readingPosition:marker}:{}),...(chapter!==null?{chapter}:{}),...(percent!==null?{progress:percent}:{})}
  }};
}
