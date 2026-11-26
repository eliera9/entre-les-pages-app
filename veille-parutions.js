/* Les dates des ebooks sont des dates civiles françaises. */
const EbookReleases = (() => {
  const dayMs = 86400000;
  const paris = new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'});
  const today = () => paris.format(new Date());
  const stamp = iso => Date.parse(iso + 'T00:00:00Z');
  const normalize = name => String(name || '').trim().toLocaleLowerCase('fr');
  function visible(date, now) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
    const release = new Date(stamp(date));
    if (isNaN(release) || release.toISOString().slice(0,10) !== date) return false;
    const year = release.getUTCFullYear(), month = release.getUTCMonth();
    const last = new Date(Date.UTC(year,month,0)).getUTCDate();
    const start = Date.UTC(year,month-1,Math.min(last,release.getUTCDate()));
    return stamp(now) >= start && stamp(now) <= +release + 7 * dayMs;
  }
  function accountApi(compte) {
    async function checked(query) {
      const {data,error} = await query;
      if (error) throw error;
      return data;
    }
    return {
      key:'elp-veille-ebook-'+compte.owner,
      feed:() => checked(compte.db.rpc('elp_ebook_releases')),
      authors:async () => (await checked(compte.db.from('elp_auteurs_suivis').select('nom').order('nom'))).map(a=>a.nom),
      async follow(name, yes) {
        const table=compte.db.from('elp_auteurs_suivis');
        if (!yes) return checked(table.delete().eq('cle',normalize(name)));
        const {error}=await table.insert({nom:name});
        if (error && error.code!=='23505') throw error;
      },
    };
  }
  function mount({root,storage,books,api,changed}) {
    let names=[], items=[], loadedAt=0, pending, settings, currentDay=today(), lastOffer='';
    function cache(){try{localStorage.setItem(api.key,JSON.stringify({names,items}));}catch{}}
    try {
      const cached=JSON.parse(localStorage.getItem(api.key));
      if (Array.isArray(cached?.items) && Array.isArray(cached.names)) ({items,names}=cached);
    } catch {}
    const has=name=>names.some(n=>normalize(n)===normalize(name));
    function refresh(force=false) {
      if (pending) return pending;
      if (!force && Date.now()-loadedAt<15*60000) return Promise.resolve();
      loadedAt=Date.now();
      pending=Promise.all([api.authors(),api.feed()]).then(([nextNames,nextItems])=>{
        names=nextNames; items=Array.isArray(nextItems)?nextItems:[]; cache(); drawList(); changed();
      }).catch(()=>{loadedAt=Date.now()-14*60000;}).finally(()=>{pending=null;});
      return pending;
    }
    async function follow(name, yes) {
      if(pending) await pending;
      await api.follow(name,yes);
      names=names.filter(n=>normalize(n)!==normalize(name));
      if(yes)names.push(name);
      cache();drawList();await refresh(true);
    }
    const create=(tag,text)=>{const node=document.createElement(tag);if(text)node.textContent=text;return node;};
    const button=(label,fn)=>{const b=create('button',label);b.type='button';b.className='plain';b.onclick=fn;return b;};
    const dialog=create('dialog');
    dialog.className='acc-saga-details veille-dialog';
    dialog.setAttribute('aria-labelledby','veille-auteur-titre');
    const title=create('h2','Suivre cet auteur ?');title.id='veille-auteur-titre';
    const detail=create('p'), status=create('p');status.setAttribute('role','status');
    const accept=button('Suivre',async()=>{
      accept.disabled=true;
      try{await follow(dialog.dataset.author,true);dialog.close();}
      catch{status.textContent='Suivi non enregistré. Vérifie ta connexion et réessaie.';}
      finally{accept.disabled=false;}
    });
    dialog.append(title,detail,status,button('Pas maintenant',()=>dialog.close()),accept);root.append(dialog);
    function offer(name) {
      if(!name||has(name)||dialog.open)return;
      dialog.dataset.author=name;detail.textContent='Retrouver les nouveaux ebooks de '+name+' dans « Les prochaines sorties » ?';
      status.textContent='';dialog.showModal();
    }
    for(const method of ['putBook','patchBook']){
      const write=storage[method];if(!write)continue;
      storage[method]=async function(...args){
        const patch=method==='putBook'?args[0]:args[1];
        const id=method==='putBook'?patch.id:args[0];
        const newFavorite=patch?.coupDeCoeur===true&&!books().find(b=>b.id===id)?.coupDeCoeur;
        const saved=await write.apply(this,args);
        if(newFavorite&&saved?.coupDeCoeur&&saved.author&&!has(saved.author)&&lastOffer!==id){
          lastOffer=id;setTimeout(()=>{offer(saved.author);lastOffer='';},0);
        }
        return saved;
      };
    }
    function drawList(){
      if(!settings?.isConnected)return;
      const list=settings.querySelector('ul');
      list.replaceChildren(...names.map(name=>{
        const li=create('li');li.append(create('span',name),button('Ne plus suivre',async e=>{
          e.target.disabled=true;
          try{await follow(name,false);}catch{settings.querySelector('[role=status]').textContent='Le suivi n’a pas pu être modifié.';}
          finally{e.target.disabled=false;}
        }));return li;
      }));
    }
    function authorSettings(){
      settings=create('section');settings.className='veille-settings';
      const h=create('h3','Auteurs suivis'),list=create('ul'),form=create('form'),input=create('input');
      const status=create('p');status.setAttribute('role','status');
      input.placeholder='Nom de l’auteur ou de l’autrice';input.setAttribute('aria-label',input.placeholder);input.maxLength=200;input.required=true;
      const submit=create('button','Suivre');submit.type='submit';
      form.append(input,submit);form.onsubmit=async e=>{
        e.preventDefault();const name=input.value.trim();if(!name)return;
        submit.disabled=true;
        try{await follow(name,true);input.value='';status.textContent=name+' figure dans tes auteurs suivis.';}
        catch{status.textContent='Suivi non enregistré. Vérifie ta connexion et réessaie.';}
        finally{submit.disabled=false;}
      };
      settings.append(h,form,status,list);queueMicrotask(drawList);return settings;
    }
    function feed(){
      const now=today(), seen=new Set(), output=[];
      for(const item of items){
        if(!visible(item.date,now))continue;
        const key=normalize(item.title)+'|'+normalize(item.author);
        if(seen.has(key))continue;
        seen.add(key);output.push({...item,days:(stamp(item.date)-stamp(now))/dayMs});
      }
      return output.sort((a,b)=>a.date.localeCompare(b.date)||a.title.localeCompare(b.title,'fr'));
    }
    function tick(){
      if(document.hidden)return;
      const now=today();if(now!==currentDay){currentDay=now;changed();}
      void refresh();
    }
    function start(){
      void refresh(true);setInterval(tick,60000);document.addEventListener('visibilitychange',tick);
      window.addEventListener('online',()=>refresh(true));window.addEventListener('pageshow',tick);
    }
    return {feed,authorSettings,start,has,follow,refresh};
  }
  return {visible,today,accountApi,mount};
})();
