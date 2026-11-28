(function() {
  const symbols = {
    back: '<path d="m15 18-6-6 6-6"/>',
    home: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    save: '<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7M7 3v4a1 1 0 0 0 1 1h7"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/>',
    pencil: '<path d="m13.5 6.5 4 4M5 19l1-5L16 4a2.8 2.8 0 0 1 4 4L10 18z"/>',
    calendar: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4m8-4v4M4 10h16m-12 5h2m4 0h2m-8 3h2"/>',
    heart: '<path d="M12 20c-1.1-1.2-8-5.4-8-10a4.3 4.3 0 0 1 8-2.1A4.3 4.3 0 0 1 20 10c0 4.6-6.9 8.8-8 10z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>'
  };
  const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${symbols[name]}</svg>`;
  const button = (name,label) => `<button type="button" class="rs-icon cursor-interaction" data-rs="${name}" aria-label="${label}" title="${label}">${icon(name)}</button>`;
  const moods = [
    ['Joie et douceur',['J’ai ri','J’ai eu des papillons','J’ai refermé le livre avec le sourire']],
    ['Émotions fortes',['J’ai été émue','J’ai eu le cœur serré','J’ai été surprise','J’ai ressenti de la colère']],
    ['Réserves',['Je me suis ennuyée','Je suis restée sur ma faim','J’ai eu du mal à m’attacher']]
  ];
  const questions = {
    recommend: {title:'Est-ce que je le recommanderais ?', alt:'Recommandation'},
    follow: {title:'Est-ce que je veux suivre l’autrice ou l’auteur ?', alt:'Suivre l’autrice ou l’auteur'},
    saga: {title:'Est-ce que je veux continuer cette saga ?', alt:'Continuer la saga'}
  };
  const choices = ['Oui','Peut-être','Non'];
  const validPortrait = value => typeof value==='string' && /^data:image\/(?:jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(value);
  const string = value => typeof value==='string' ? value : '';
  const copyRows = (value,keys) => Array.isArray(value) ? value.map(row => Object.fromEntries(keys.map(key => [key,string(row?.[key])]))) : [];
  const newCharacter = (role='') => ({role,name:'',quote:'',image:''});
  const newPassage = () => ({chapter:'',text:''});
  function dateFor(book) {
    if (book.readingEnd && !book.readingEnd.unknown) return book.readingEnd;
    if (!book.finishedAt || book.finishDateUnknown) return {};
    const date = new Date(book.finishedAt);
    return Number.isNaN(date.getTime()) ? {} : {day:date.getDate(),month:date.getMonth()+1,year:date.getFullYear()};
  }

  function mountTabletReadingSheet({node,book,onBack,onHome,onSave}) {
    node.innerHTML = `
      <section class="rs-tablet" hidden aria-label="Ma fiche de lecture">
        <nav class="rs-toolbar" aria-label="Navigation de la fiche de lecture">
          <div>${button('back','Retour')}${button('home','Accueil')}</div>
          <div>${button('pencil','Modifier')}${button('save','Enregistrer')}${button('download','Télécharger')}
            <div class="rs-download" hidden><button type="button" data-rs="pdf">Télécharger en PDF</button></div>
          </div>
        </nav>
        <div class="rs-heading">
          <div class="rs-cover"><img alt="" hidden></div>
          <div class="rs-book">
            <img class="rs-book-art" src="./art/reading-sheet/book.webp" alt="">
            <label class="rs-title"><span>Titre</span><input data-rs="title"></label>
            <label class="rs-author"><span>Écrit par</span><input data-rs="author"></label>
            <div class="rs-date">${icon('calendar')}<span>Terminé le</span><div data-rs="date"></div></div>
            <div class="rs-rating"><div><span>Note</span><div class="rs-stars" aria-label="Note sur cinq"></div></div>${button('heart','Coup de cœur')}</div>
          </div>
        </div>
        <div class="rs-columns">
          <div class="rs-column">
            <section class="rs-card rs-opinion"><h2><span>Mon avis</span></h2>
              <textarea data-rs="opinion" aria-label="Mon avis" rows="4"></textarea>
              <picture><img src="./art/reading-sheet/ink.webp" alt=""></picture>
            </section>
            <section class="rs-card rs-character" aria-label="Personnages">
              <input class="rs-role" data-rs="role" aria-label="Intitulé du personnage" placeholder="Personnage">
              <button type="button" class="rs-arch cursor-interaction" data-rs="portrait" aria-label="Ajouter ou remplacer un portrait"><img alt="" hidden></button>
              <input type="file" data-rs="file" accept="image/*" hidden>
              <input class="rs-character-name" data-rs="name" aria-label="Nom du personnage" placeholder="Nom">
              <div class="rs-quote"><span aria-hidden="true">“</span><span tabindex="0" role="textbox" aria-label="Citation du personnage" aria-multiline="true" data-rs="quote"></span><span aria-hidden="true">”</span></div>
              <div class="rs-controls"><div class="rs-dots"></div>${button('plus','Ajouter un personnage')}</div>
            </section>
          </div>
          <div class="rs-column">
            <section class="rs-card rs-feelings"><h2><span>Ce que j’ai ressenti</span></h2><div class="rs-moods"></div></section>
            <section class="rs-card rs-passage" aria-label="Passages">
              <div class="rs-chapter"><span>Chapitre</span><input data-rs="chapter" aria-label="Chapitre" placeholder="—"></div>
              <textarea data-rs="passage" aria-label="Passage" rows="4"></textarea>
              <div class="rs-controls"><div class="rs-dots"></div>${button('plus','Ajouter un passage')}</div>
            </section>
          </div>
        </div>
        <section class="rs-card rs-final" aria-label="Dernières questions">
          <h2 class="rs-question" aria-live="polite"></h2><div class="rs-answers"></div>
          <div class="rs-dots"></div><img alt="" class="rs-final-sticker">
        </section>
        <p class="rs-status" role="status"></p>
      </section>`;
    const sheet=node.firstElementChild;
    const control = name => sheet.querySelector('[data-rs="'+name+'"]');
    const character=sheet.querySelector('.rs-character');
    const passage=sheet.querySelector('.rs-passage');
    const final=sheet.querySelector('.rs-final');
    const status=sheet.querySelector('.rs-status');
    const menu=sheet.querySelector('.rs-download');
    let draft,editing,page,saving=false,revision=0,portraitTask;
    const setPressed=(node,value)=>node.setAttribute('aria-pressed',String(value));
    let dateParts={};
    const dateUI=control('date');
    const monthNames=new Intl.DateTimeFormat('fr',{month:'long'});
    const monthLabel=i=>monthNames.format(new Date(2024,i-1,1));
    const yearNow=new Date().getFullYear();
    const lists = [
      ['day','Jour','jj',Array.from({length:31},(_,i)=>[i+1,String(i+1).padStart(2,'0')])],
      ['month','Mois','mois',Array.from({length:12},(_,i)=>[i+1,monthLabel(i+1)])],
      ['year','Année','aaaa',Array.from({length:yearNow-1899},(_,i)=>[yearNow+1-i,String(yearNow+1-i)])]
    ];
    for (const [key,label,placeholder,options] of lists) {
      const wrapper=document.createElement('div');
      wrapper.className='rs-date-part';
      const trigger=document.createElement('button');
      trigger.type='button';
      trigger.setAttribute('aria-label',label);
      trigger.setAttribute('aria-expanded','false');
      const list=document.createElement('div');
      list.className='rs-date-options';
      list.hidden=true;
      dateParts[key]={trigger,list,options,placeholder};
      trigger.addEventListener('click',()=>{
        const show=list.hidden;
        closeDate();
        if (!show) return;
        list.hidden=false;
        trigger.setAttribute('aria-expanded','true');
        const active=list.querySelector('[aria-pressed="true"]');
        if (active) list.scrollTop=active.offsetTop-list.offsetTop;
      });
      wrapper.append(trigger,list);
      dateUI.append(wrapper);
    }
    function closeDate() {
      for (const part of Object.values(dateParts)) {
        part.list.hidden=true;
        part.trigger.setAttribute('aria-expanded','false');
      }
    }
    sheet.addEventListener('pointerdown',event=>{
      if (!dateUI.contains(event.target)) closeDate();
      if (!menu.contains(event.target) && !control('download').contains(event.target)) setDownload(false);
    });
    sheet.addEventListener('keydown',event=>{
      if (event.key==='Escape') {closeDate();setDownload(false);}
    });

    function readBook() {
      const raw=book.readingSheet;
      const data=raw && typeof raw==='object' ? raw : {};
      const people=copyRows(data.characters,['role','name','quote','image']);
      const passages=copyRows(data.passages,['chapter','text']);
      return {
        title:string(book.title), author:string(book.author), date:{...dateFor(book)},
        rating:Number.isFinite(Number(book.rating)) ? Math.min(5,Math.max(0,Number(book.rating))) : 0,
        favorite:book.coupDeCoeur===true,
        text:typeof raw==='string' ? raw : string(data.text),
        moods:Array.isArray(data.moods) ? data.moods.filter(value=>typeof value==='string') : [],
        characters:people.length ? people : [newCharacter('Mon personnage préféré'),newCharacter('Le personnage que j’ai le moins aimé')],
        passages:passages.length ? passages : [newPassage()],
        answers:{recommend:string(data.answers?.recommend),follow:string(data.answers?.follow),saga:string(data.answers?.saga)}
      };
    }

    function grow(node) {
      node.style.height='0px';
      node.style.height=Math.max(node.scrollHeight,112)+'px';
    }
    const bind = (name,write) => control(name).addEventListener('input',event=>{
      if (!editing) return;
      write(event.target.value);
      status.textContent='';
    });
    bind('title',v=>{draft.title=v;});
    bind('author',v=>{draft.author=v;renderFinal();});
    bind('opinion',v=>{draft.text=v;grow(control('opinion'));});
    bind('role',v=>{draft.characters[page.character].role=v;});
    bind('name',v=>{draft.characters[page.character].name=v;});
    bind('chapter',v=>{draft.passages[page.passage].chapter=v;control('chapter').size=Math.max(2,Math.min(13,v.length));});
    bind('passage',v=>{draft.passages[page.passage].text=v;grow(control('passage'));});
    control('quote').addEventListener('input',event=>{
      if (editing) draft.characters[page.character].quote=event.target.innerText;
    });
    function renderDate() {
      for (const [key,part] of Object.entries(dateParts)) {
        const value=Number(draft.date[key]);
        const options=key==='day' && draft.date.month
          ? part.options.slice(0,new Date(Number(draft.date.year)||2024,Number(draft.date.month),0).getDate()) : part.options;
        const selected=options.find(([id])=>id===value);
        part.trigger.textContent=selected?.[1]||part.placeholder;
        part.trigger.disabled=!editing;
        part.list.replaceChildren(...options.map(([id,label])=>{
          const option=document.createElement('button');
          option.type='button';
          option.textContent=label;
          setPressed(option,id===value);
          option.onclick=()=>{
            draft.date[key]=id;
            if (draft.date.day && draft.date.month &&
              draft.date.day>new Date(Number(draft.date.year)||2024,Number(draft.date.month),0).getDate()) delete draft.date.day;
            closeDate();
            renderDate();
            part.trigger.focus();
          };
          return option;
        }));
      }
    }
    function renderRating() {
      const stars=sheet.querySelector('.rs-stars');
      stars.replaceChildren(...Array.from({length:5},(_,i)=>{
        const b=document.createElement('button');
        b.type='button';
        b.textContent=draft.rating>i?'★':'☆';
        b.classList.toggle('rs-half',draft.rating>i&&draft.rating<i+1);
        b.setAttribute('aria-label',(i+1)+' sur 5');
        setPressed(b,draft.rating===i+1);
        b.disabled=!editing;
        b.onclick=()=>{
          draft.rating=draft.rating===i+1?i+.5:i+1;
          renderRating();
          stars.children[i].focus();
        };
        return b;
      }));
      setPressed(control('heart'),draft.favorite);
      control('heart').disabled=!editing;
    }
    control('heart').onclick=()=>{draft.favorite=!draft.favorite;renderRating();};
    const moodControls=[];
    const moodList=sheet.querySelector('.rs-moods');
    let moodIndex=0;
    for (const [label,items] of moods) {
      const row=document.createElement('section');
      const heading=document.createElement('h3');
      heading.textContent=label;
      const group=document.createElement('div');
      group.className='rs-mood-group';
      for (const title of items) {
        const b=document.createElement('button');
        b.type='button';
        b.className='rs-mood cursor-interaction';
        b.innerHTML='<span class="rs-mood-image"><img alt=""></span><span></span>';
        b.querySelector('img').src='./art/reading-sheet/mood-'+(moodIndex++)+'.webp';
        b.lastElementChild.textContent=title;
        b.onclick=()=>{
          if (draft.moods.includes(title)) draft.moods=draft.moods.filter(v=>v!==title);
          else draft.moods.push(title);
          renderMoods();
        };
        moodControls.push([title,b]);
        group.append(b);
      }
      row.append(heading,group); moodList.append(row);
    }
    function renderMoods() {
      for (const [name,b] of moodControls) {
        setPressed(b,draft.moods.includes(name));
        b.disabled=!editing;
      }
    }
    const slides = () => ['recommend','follow',...[book.saga || book.series ? 'saga' : null].filter(Boolean)];
    const pager=(node,active,total,move)=>{
      const indexWindow=Math.max(0,Math.min(active-3,total-7));
      const items=Array.from({length:Math.min(7,total)},(_,i)=>indexWindow+i);
      const buttons=items.map(i=>{
        const b=document.createElement('button');
        b.type='button';
        b.setAttribute('aria-label',(i+1)+' sur '+total);
        setPressed(b,i===active);
        if (i>0 && i===indexWindow || i<total-1 && i===items.at(-1)) b.dataset.more='';
        b.onclick=()=>move(i,true);
        return b;
      });
      node.replaceChildren(...buttons);
      if (total>7) {
        const count=document.createElement('span');
        count.textContent=(active+1)+' / '+total;
        node.append(count);
      }
    };
    function changePage(name,value,focusDot=false) {
      const container=name==='character'?character:name==='passage'?passage:final;
      const length=name==='character'?draft.characters.length:name==='passage'?draft.passages.length:slides().length;
      const index=Math.max(0,Math.min(length-1,value));
      if(index===page[name]) return;
      page[name]=index;
      if (name==='character') renderCharacter();
      if (name==='passage') renderPassage();
      if (name==='final') renderFinal();
      if (focusDot) container.querySelector('.rs-dots [aria-pressed=true]')?.focus({preventScroll:true});
    }
    function swipe(container,key) {
      let x,y,pointer;
      container.addEventListener('pointerdown',event=>{
        if(event.target.closest('input,textarea,[contenteditable]:not([contenteditable=false]),button')) return;
        x=event.clientX;y=event.clientY;pointer=event.pointerId;
      });
      container.addEventListener('pointercancel',()=>{pointer=undefined;});
      container.addEventListener('pointerup',event=>{
        if(pointer!==event.pointerId)return;
        pointer=undefined;
        const dx=event.clientX-x;
        if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(event.clientY-y))changePage(key,page[key]+(dx<0?1:-1));
      });
    }
    swipe(character,'character');
    swipe(passage,'passage');
    swipe(final,'final');

    function renderCharacter() {
      const person=draft.characters[page.character];
      for (const name of ['role','name']) control(name).value=person[name];
      const quote=control('quote');
      quote.textContent=person.quote;
      quote.contentEditable=editing?'plaintext-only':'false';
      if(editing)quote.setAttribute('aria-readonly','false');
      else quote.setAttribute('aria-readonly','true');
      const portrait=control('portrait');
      const image=portrait.querySelector('img');
      if(validPortrait(person.image)){image.src=person.image;image.hidden=false;}
      else {image.removeAttribute('src');image.hidden=true;}
      portrait.disabled=!editing;
      pager(character.querySelector('.rs-dots'),page.character,draft.characters.length,(i,f)=>changePage('character',i,f));
    }
    const file=control('file');
    let fileTarget;
    control('portrait').onclick=()=>{fileTarget=draft.characters[page.character];file.click();};
    file.onchange=()=>{
      const selected=file.files[0];
      file.value='';
      if(!selected || !editing || !fileTarget)return;
      const version=++revision;
      const person=fileTarget;
      const url=URL.createObjectURL(selected);
      portraitTask=(async()=>{
        try {
          const img=new Image();img.src=url;await img.decode();
          if (version!==revision) return;
          const canvas=document.createElement('canvas');
          const scale=Math.min(1,420/Math.max(img.naturalWidth,img.naturalHeight));
          canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
          canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
          canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
          person.image=canvas.toDataURL('image/jpeg',.83);
          status.textContent='';
          if(draft.characters[page.character]===person)renderCharacter();
        } catch {
          if(version===revision)status.textContent='Cette image n’a pas pu être ouverte.';
        } finally{URL.revokeObjectURL(url);}
      })();
    };
    character.querySelector('[data-rs=plus]').onclick=()=>{
      draft.characters.push(newCharacter());
      changePage('character',draft.characters.length-1);
      control('role').focus({preventScroll:true});
    };
    passage.querySelector('[data-rs=plus]').onclick=()=>{
      draft.passages.push(newPassage());
      changePage('passage',draft.passages.length-1);
      control('chapter').focus({preventScroll:true});
    };
    function renderPassage() {
      const entry=draft.passages[page.passage];
      control('chapter').value=entry.chapter;
      control('chapter').size=Math.max(2,Math.min(13,entry.chapter.length));
      control('passage').value=entry.text;
      grow(control('passage'));
      pager(passage.querySelector('.rs-dots'),page.passage,draft.passages.length,(i,f)=>changePage('passage',i,f));
    }
    function renderFinal() {
      const all=slides(), key=all[page.final];
      final.dataset.slide=key;
      final.querySelector('h2').textContent=key==='follow' && draft.author.trim()
        ? 'Est-ce que je veux suivre '+draft.author.trim()+' ?' : questions[key].title;
      const image=final.querySelector('img');
      image.src='./art/reading-sheet/'+key+'.webp';
      const row=final.querySelector('.rs-answers');
      if (!row.children.length) row.replaceChildren(...choices.map(choice=>{
        const b=document.createElement('button');
        b.type='button';
        b.className='cursor-interaction';
        b.innerHTML='<span aria-hidden="true"></span>';
        b.append(document.createTextNode(choice));
        b.onclick=()=>{draft.answers[slides()[page.final]]=choice;renderFinal();};
        return b;
      }));
      [...row.children].forEach((b,i)=>{
        setPressed(b,draft.answers[key]===choices[i]);
        b.disabled=!editing;
      });
      pager(final.querySelector('.rs-dots'),page.final,all.length,(i,f)=>changePage('final',i,f));
    }
    function render() {
      control('title').value=draft.title;
      control('author').value=draft.author;
      control('opinion').value=draft.text;
      const cover=sheet.querySelector('.rs-cover img');
      cover.hidden=!book.coverData;
      if(book.coverData)cover.src=book.coverData;
      control('pencil').hidden=editing || !book.readingSheet;
      control('save').hidden=!editing;
      for (const name of ['title','author','opinion','role','name','chapter','passage']) control(name).readOnly=!editing;
      sheet.querySelectorAll('[data-rs="plus"]').forEach(b=>b.hidden=!editing);
      renderDate();renderRating();renderMoods();renderCharacter();renderPassage();renderFinal();
      grow(control('opinion'));
    }
    control('pencil').onclick=()=>{editing=true;render();control('save').focus({preventScroll:true});};
    control('back').onclick=onBack;
    control('home').onclick=onHome;
    function setDownload(open) {
      menu.hidden=!open;
      control('download').setAttribute('aria-expanded',String(open));
    }
    control('download').onclick=()=>setDownload(menu.hidden);
    control('save').onclick=async()=>{
      if(saving)return;
      const title=draft.title.trim();
      if(!title){control('title').focus();return;}
      saving=true;control('save').disabled=true;
      try{
        await portraitTask;
        const previous=book.readingSheet;
        const patch={
          title,author:draft.author.trim(),rating:draft.rating,coupDeCoeur:draft.favorite,
          readingSheet:{...(previous && typeof previous==='object'?previous:{}),text:draft.text,moods:[...draft.moods],
            characters:draft.characters.map(row=>({...row})),passages:draft.passages.map(row=>({...row})),answers:{...draft.answers}}
        };
        if(Object.keys(draft.date).length) {
          const {year,month,day}=draft.date;
          patch.readingEnd={...draft.date};
          if(year && month && day){patch.finishedAt=new Date(Number(year),Number(month)-1,Number(day),12).getTime();patch.finishDateUnknown=false;}
        }
        if(await onSave(patch))onBack();
        else status.textContent='La fiche n’a pas pu être enregistrée. Réessaie.';
      }finally{saving=false;control('save').disabled=false;}
    };
    control('pdf').onclick=()=>{
      setDownload(false);
      const paper=document.createElement('article');
      paper.className='rs-print';
      const section=(title,text)=>{
        if(!text?.trim())return;
        const h=document.createElement('h2');h.textContent=title;
        const p=document.createElement('p');p.textContent=text;
        paper.append(h,p);
      };
      const h=document.createElement('h1');h.textContent=draft.title;paper.append(h);
      section('Écrit par',draft.author);
      section('Ma note',draft.rating?draft.rating+' / 5'+(draft.favorite?' · Coup de cœur':''):draft.favorite?'Coup de cœur':'');
      section('Mon avis',draft.text);section('Ce que j’ai ressenti',draft.moods.join(' · '));
      for(const row of draft.characters)if(row.name||row.quote||validPortrait(row.image)){
        section(row.role||'Personnage',[row.name,row.quote].filter(Boolean).join('\n'));
        if(validPortrait(row.image)){const image=document.createElement('img');image.src=row.image;image.alt=row.name;paper.append(image);}
      }
      for(const row of draft.passages)section(row.chapter?'Chapitre '+row.chapter:'Passage',row.text);
      for(const key of slides())section(key==='follow' && draft.author.trim()
        ? 'Est-ce que je veux suivre '+draft.author.trim()+' ?' : questions[key].title,draft.answers[key]);
      document.body.append(paper);
      document.body.classList.add('rs-printing');
      window.addEventListener('afterprint',()=>{paper.remove();document.body.classList.remove('rs-printing');},{once:true});
      window.print();
    };
    return {
      open(){
        revision++;
        draft=readBook();
        page={character:0,passage:0,final:0};
        editing=!book.readingSheet || typeof book.readingSheet==='string' || !Array.isArray(book.readingSheet.characters);
        setDownload(false);
        status.textContent='';
        sheet.hidden=false;
        render();
        node.scrollIntoView({block:'start',behavior:'instant'});
        control('back').focus({preventScroll:true});
      },
      close(){ revision++;sheet.hidden=true;closeDate(); },
      get visible(){return !sheet.hidden;}
    };
  }
  window.mountTabletReadingSheet=mountTabletReadingSheet;
})();
