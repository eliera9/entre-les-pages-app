(function() {
  const symbols = {
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    arrow: '<path d="M4 12h15m-5-5 5 5-5 5"/>',
    home: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    save: '<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7M7 3v4a1 1 0 0 0 1 1h7"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/>',
    pencil: '<path d="m13.5 6.5 4 4M5 19l1-5L16 4a2.8 2.8 0 0 1 4 4L10 18z"/>',
    calendar: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4m8-4v4M4 10h16m-12 5h2m4 0h2m-8 3h2"/>',
    heart: '<path d="M12 20c-1.1-1.2-8-5.4-8-10a4.3 4.3 0 0 1 8-2.1A4.3 4.3 0 0 1 20 10c0 4.6-6.9 8.8-8 10z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>'
  };
  symbols['mobile-download'] = symbols.download;
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

  function mountReadingSheet({node,book,onBack,onHome,onSave,onSearchAuthor}) {
    node.innerHTML = `
      <section class="rs-tablet" hidden aria-label="Ma fiche de lecture">
        <nav class="rs-toolbar" aria-label="Navigation de la fiche de lecture">
          <div>${button('home','Accueil')}</div>
          <div>${button('pencil','Modifier')}${button('save','Enregistrer')}${button('download','Télécharger')}
          </div>
        </nav>
        <nav class="rs-mobile-nav" aria-label="Progression de la fiche" hidden>
          <div class="rs-progress"></div>${button('close','Annuler la rédaction')}
        </nav>
        <div class="rs-heading" data-step="0">
          <div class="rs-cover"><img alt="" hidden></div>
          <div class="rs-book">
            <label class="rs-title"><span>Titre</span><input data-rs="title" aria-label="Titre"></label>
            <label class="rs-author"><span>Écrit par</span><input data-rs="author"></label>
            <div class="rs-date">${icon('calendar')}<span>Terminé le</span><div data-rs="date"></div></div>
            <div class="rs-rating"><div><span class="rs-rating-label">Note</span><div class="rs-stars" aria-label="Note sur cinq"></div></div>${button('heart','Coup de cœur')}</div>
          </div>
        </div>
        <div class="rs-columns">
          <div class="rs-column">
            <section class="rs-card rs-opinion" data-step="1"><h2><span>Mon avis</span></h2>
              <textarea data-rs="opinion" aria-label="Mon avis" rows="4"></textarea>
              <picture><img src="./art/reading-sheet/ink.webp" alt=""></picture>
            </section>
            <section class="rs-card rs-character" data-step="3" aria-label="Personnages">
              <div class="rs-role-line"><input class="rs-role" data-rs="role" aria-label="Intitulé du personnage" placeholder="Personnage"></div>
              <button type="button" class="rs-arch cursor-interaction" data-rs="portrait" aria-label="Ajouter ou remplacer un portrait"><img alt="" hidden></button>
              <input type="file" data-rs="file" accept="image/*" hidden>
              <input class="rs-character-name" data-rs="name" aria-label="Nom du personnage" placeholder="Nom">
              <div class="rs-quote"><span aria-hidden="true">“</span><span tabindex="0" role="textbox" aria-label="Citation du personnage" aria-multiline="true" data-rs="quote"></span><span aria-hidden="true">”</span></div>
              <div class="rs-controls"><div class="rs-dots"></div>${button('plus','Ajouter un personnage')}</div>
            </section>
          </div>
          <div class="rs-column">
            <section class="rs-card rs-feelings" data-step="2"><h2><span>Ce que j’ai ressenti</span></h2><div class="rs-moods"></div></section>
            <section class="rs-card rs-passage" data-step="4" aria-label="Passages">
              <div class="rs-chapter"><span>Chapitre</span><input data-rs="chapter" aria-label="Chapitre" placeholder="—"></div>
              <textarea data-rs="passage" aria-label="Passage" rows="4"></textarea>
              <div class="rs-controls"><div class="rs-dots"></div>${button('plus','Ajouter un passage')}</div>
            </section>
          </div>
        </div>
        <section class="rs-card rs-final" aria-label="Dernières questions">
          <h2 class="rs-question" aria-live="polite"></h2><div class="rs-answers"></div>
          <div class="rs-dots"></div><img alt="" class="rs-final-sticker">
          <button type="button" class="rs-search-author" data-rs="search-author" hidden>Rechercher ses livres</button>
        </section>
        <section class="rs-mobile-questions" data-step="5" aria-label="Dernières questions" hidden></section>
        <div class="rs-mobile-footer" hidden>
          <button type="button" class="rs-primary" data-rs="next">Suivant${icon('arrow')}</button>
          <button type="button" class="rs-primary" data-rs="finish" hidden>Enregistrer</button>
          ${button('mobile-download','Télécharger')}
        </div>
        <div class="rs-download" hidden>
          <button type="button" data-rs="pdf">Télécharger en PDF</button>
          <button type="button" data-rs="world">Envoyer au Monde d’Eli</button>
        </div>
        <p class="rs-status" role="status"></p>
      </section>`;
    const sheet=node.firstElementChild;
    const control = name => sheet.querySelector('[data-rs="'+name+'"]');
    const character=sheet.querySelector('.rs-character');
    const passage=sheet.querySelector('.rs-passage');
    const final=sheet.querySelector('.rs-final');
    const status=sheet.querySelector('.rs-status');
    const menu=sheet.querySelector('.rs-download');
    const toolbar=sheet.querySelector('.rs-toolbar');
    const mobileNav=sheet.querySelector('.rs-mobile-nav');
    const footer=sheet.querySelector('.rs-mobile-footer');
    const mobileQuestions=sheet.querySelector('.rs-mobile-questions');
    const downloadButtons=[control('download'),control('mobile-download')];
    const stepLabels=['Le livre','Mon avis','Ce que j’ai ressenti','Personnages','Passages','Dernières questions'];
    let draft,editing,page,mobile=false,step=0,furthest=0,saving=false,revision=0,portraitTask;
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
      if (!menu.contains(event.target) && !downloadButtons.some(button=>button.contains(event.target))) setDownload(false);
    });
    sheet.addEventListener('keydown',event=>{
      if (event.key==='Escape' && (!menu.hidden || Object.values(dateParts).some(part=>!part.list.hidden))) {
        event.stopPropagation();closeDate();setDownload(false);
      }
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
    const slides = () => (book.saga || book.series || '').trim() ? ['recommend','follow','saga'] : ['recommend','follow'];
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
    function questionTitle(key) {
      return key==='follow' && draft.author.trim()
        ? 'Est-ce que je veux suivre '+draft.author.trim()+' ?' : questions[key].title;
    }
    function renderAnswers(row,key) {
      if (!row.children.length) row.replaceChildren(...choices.map(choice=>{
        const b=document.createElement('button');
        b.type='button';
        b.className='cursor-interaction';
        b.innerHTML='<span aria-hidden="true"></span>';
        b.append(document.createTextNode(choice));
        b.onclick=()=>{
          if (!editing) return;
          draft.answers[row.dataset.question]=choice;
          renderFinal();
        };
        return b;
      }));
      row.dataset.question=key;
      [...row.children].forEach((b,i)=>{
        setPressed(b,draft.answers[key]===choices[i]);
        b.disabled=!editing;
      });
    }
    function renderFinal() {
      const all=slides(), key=all[page.final];
      final.dataset.slide=key;
      final.querySelector('h2').textContent=questionTitle(key);
      final.querySelector('img').src='./art/reading-sheet/'+key+'.webp';
      renderAnswers(final.querySelector('.rs-answers'),key);
      pager(final.querySelector('.rs-dots'),page.final,all.length,(i,f)=>changePage('final',i,f));

      if (mobileQuestions.childElementCount!==all.length) {
        mobileQuestions.replaceChildren(...all.map(id=>{
          const item=document.createElement('section');
          const title=document.createElement('h2');
          title.id='rs-mobile-question-'+id;
          item.setAttribute('aria-labelledby',title.id);
          const row=document.createElement('div');
          row.className='rs-answers';
          item.append(title,row);
          return item;
        }));
      }
      all.forEach((id,i)=>{
        const [title,row]=mobileQuestions.children[i].children;
        title.textContent=questionTitle(id);
        renderAnswers(row,id);
      });
      const search=final.querySelector('[data-rs="search-author"]');
      search.hidden=editing || key!=='follow' || draft.answers.follow!=='Oui' || !draft.author.trim() || !onSearchAuthor;
    }
    const progress=mobileNav.querySelector('.rs-progress');
    const steps=stepLabels.map((name,i)=>{
      const b=document.createElement('button');
      b.type='button';
      b.setAttribute('aria-label',name);
      b.onclick=()=>showStep(i);
      progress.append(b);
      return b;
    });
    function renderLayout() {
      const wizard=mobile && editing;
      sheet.toggleAttribute('data-rs-mobile',mobile);
      sheet.toggleAttribute('data-rs-wizard',wizard);
      sheet.querySelector('.rs-rating-label').textContent=wizard?'Ma note':'Note';
      toolbar.hidden=wizard;
      mobileNav.hidden=!wizard;
      footer.hidden=!wizard;
      final.hidden=wizard;
      mobileQuestions.hidden=!wizard || step!==5;
      sheet.querySelectorAll('[data-step]:not(.rs-mobile-questions)').forEach(panel=>{
        panel.hidden=wizard && Number(panel.dataset.step)!==step;
      });
      steps.forEach((b,i)=>{
        b.disabled=i>furthest;
        b.toggleAttribute('data-filled',i<=step);
        if(i===step)b.setAttribute('aria-current','step');
        else b.removeAttribute('aria-current');
      });
      control('next').hidden=step===5;
      control('finish').hidden=step!==5;
      control('mobile-download').hidden=step!==5;
      const target=wizard?control('mobile-download'):control('download');
      target.after(menu);
    }
    function showStep(value) {
      if(saving) return;
      if (!value || draft.title.trim()) {
        step=value;
        furthest=Math.max(furthest,step);
        closeDate();
        setDownload(false);
        status.textContent='';
        renderLayout();
        render();
        sheet.scrollIntoView({block:'start',behavior:'instant'});
        steps[step].focus({preventScroll:true});
      } else {
        control('title').focus();
      }
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
    control('pencil').onclick=()=>{
      editing=true;
      step=0;furthest=0;
      renderLayout();render();
      (mobile?steps[0]:control('save')).focus({preventScroll:true});
    };
    control('close').onclick=()=>{if(!saving)onBack();};
    control('home').onclick=()=>{if(!saving)onHome();};
    control('next').onclick=()=>showStep(step+1);
    control('search-author').onclick=()=>onSearchAuthor?.(draft.author.trim());
    function setDownload(open) {
      menu.hidden=!open;
      downloadButtons.forEach(button=>button.setAttribute('aria-expanded',String(open)));
    }
    downloadButtons.forEach(button=>button.onclick=()=>setDownload(menu.hidden));
    control('world').onclick=()=>{
      setDownload(false);
      status.textContent='L’envoi direct au Monde d’Eli n’est pas encore disponible.';
    };
    control('save').onclick=control('finish').onclick=async()=>{
      if(saving)return;
      const title=draft.title.trim();
      if(!title){if(mobile)showStep(0);control('title').focus();return;}
      const saveButtons=[control('save'),control('finish')];
      saving=true;saveButtons.forEach(button=>button.disabled=true);
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
        const result=await onSave(patch);
        if (!result) {
          status.textContent='La fiche n’a pas pu être enregistrée. Réessaie.';
          return;
        }
        if (!mobile && !result.followError) {
          onBack();
          return;
        }
        editing=false;
        setDownload(false);
        renderLayout();render();
        sheet.scrollIntoView({block:'start',behavior:'instant'});
        control('home').focus({preventScroll:true});
        status.textContent=result.followError
          ? 'Fiche enregistrée. Le suivi de l’auteur a échoué. Tu peux réessayer depuis Modifier.'
          : 'Fiche enregistrée.';
      }finally{saving=false;saveButtons.forEach(button=>button.disabled=false);}
    };
    control('pdf').onclick=async()=>{
      if (document.body.classList.contains('rs-printing')) return;
      setDownload(false);
      await portraitTask;
      if (document.body.classList.contains('rs-printing')) return;
      const paper=document.createElement('article');
      paper.className='rs-print';
      const add=(parent,tag,text='',className='')=>{
        const element=document.createElement(tag);
        element.textContent=text;
        if(className)element.className=className;
        parent.append(element);
        return element;
      };
      const info=add(paper,'header','','rs-print-heading');
      if(book.coverData) {
        const cover=add(info,'img','','rs-print-cover');
        cover.src=book.coverData;cover.alt='';
      }
      const facts=add(info,'div');
      add(facts,'h1',draft.title);
      if(draft.author.trim())add(facts,'p','Écrit par '+draft.author.trim());
      const {day,month,year}=draft.date;
      const date=[day,month?monthLabel(Number(month)):'',year].filter(Boolean).join(' ');
      if(date)add(facts,'p','Terminé le '+date);
      if(draft.rating || draft.favorite) add(facts,'p',
        [draft.rating?'Ma note · '+String(draft.rating).replace('.',',')+' / 5':'',draft.favorite?'Coup de cœur':''].filter(Boolean).join(' · '));
      const columns=add(paper,'div','','rs-print-columns');
      const left=add(columns,'div'),right=add(columns,'div');
      function block(parent,title,text) {
        const card=add(parent,'section','','rs-print-card');
        if(title)add(card,'h2',title);
        if(text?.trim())add(card,'p',text);
        return card;
      }
      if(draft.text.trim())block(left,'Mon avis',draft.text);
      if(draft.moods.length)block(right,'Ce que j’ai ressenti',draft.moods.join(' · '));
      for(const row of draft.characters) {
        if(!row.name.trim() && !row.quote.trim() && !validPortrait(row.image))continue;
        const card=block(left,row.role||'Personnage');
        if(validPortrait(row.image)) {
          const img=add(card,'img','','rs-print-portrait');
          img.src=row.image;img.alt=row.name;
        }
        if(row.name.trim())add(card,'h3',row.name);
        if(row.quote.trim())add(card,'p','« '+row.quote.trim()+' »','rs-print-quote');
      }
      for(const row of draft.passages) {
        if(row.chapter.trim() || row.text.trim())
          block(right,row.chapter?'Chapitre '+row.chapter:'Passage',row.text);
      }
      const answered=slides().filter(key=>draft.answers[key]);
      if(answered.length) {
        const summary=add(paper,'section','','rs-print-card rs-print-final');
        for(const key of answered)add(summary,'p',questionTitle(key)+' '+draft.answers[key]);
      }
      document.body.append(paper);
      document.body.classList.add('rs-printing');
      const pageTitle=document.title;
      document.title='Fiche de lecture — '+draft.title;
      window.addEventListener('afterprint',()=>{
        paper.remove();
        document.body.classList.remove('rs-printing');
        document.title=pageTitle;
      },{once:true});
      window.print();
    };
    return {
      open(onMobile){
        revision++;
        mobile=onMobile;
        draft=readBook();
        page={character:0,passage:0,final:0};
        step=0;furthest=0;
        editing=!book.readingSheet || typeof book.readingSheet==='string' || !Array.isArray(book.readingSheet.characters);
        setDownload(false);
        status.textContent='';
        sheet.hidden=false;
        renderLayout();render();
        node.scrollIntoView({block:'start',behavior:'instant'});
        (mobile && editing ? steps[0] : control('home')).focus({preventScroll:true});
      },
      close(){ revision++;sheet.hidden=true;closeDate(); },
      get visible(){return !sheet.hidden;}
    };
  }
  window.mountReadingSheet=mountReadingSheet;
})();
