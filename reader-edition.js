// Read typography from the EPUB without adopting its stylesheets in the application.
function createEpubEditionStyles(readCss) {
  const cache = new Map();
  const properties = ['text-align','text-indent','font-weight','font-style','font-variant','font-size','line-height','letter-spacing','hyphens',
    'margin-top','margin-bottom','margin-left','margin-right','padding-top','padding-bottom','padding-left','padding-right','vertical-align'];
  const numeric = /^(?:0|(?:\d+(?:\.\d+)?|\.\d+)(?:%|em|rem|px|pt)?|normal|auto|inherit)$/i;
  function declarations(style) {
    const list = [];
    for (const prop of properties) {
      const val = style.getPropertyValue(prop).trim();
      if (!val || val.length > 28 || !/^[\w.%-]+$/.test(val)) continue;
      if (/^(margin|padding|text-indent|font-size|line-height|letter-spacing)/.test(prop) && !numeric.test(val)) continue;
      list.push({prop,val,important:style.getPropertyPriority(prop) === 'important'});
    }
    return list;
  }
  function parse(css) {
    const rules = [];
    try {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(css);
      for (const rule of sheet.cssRules) {
        if (!rule.selectorText || rules.length >= 800) continue;
        const values = declarations(rule.style);
        if (!values.length) continue;
        for (const selector of rule.selectorText.split(',')) {
          // Structural selectors target the detached XHTML, never the app.
          if (selector.length > 180 || !/^[\w.#*\-\s>+~]+$/.test(selector)) continue;
          const ids = (selector.match(/#/g) || []).length;
          const classes = (selector.match(/\./g) || []).length;
          const tags = selector.split(/[\s>+~]+/).filter(part => /^[a-z]/i.test(part)).length;
          rules.push({selector,score:ids*10000+classes*100+tags,values});
        }
      }
    } catch { /* EPUBs with no usable stylesheet still display their contents. */ }
    return rules;
  }
  return async function forDocument(doc,path,info) {
    const matched = new WeakMap();
    function assign(el,score,values) {
      let map = matched.get(el);
      if (!map) {map=new Map();matched.set(el,map);}
      for (const item of values) {
        const priority = score + (item.important ? 100000000 : 0);
        if (priority >= (map.get(item.prop)?.priority ?? -1)) map.set(item.prop,{value:item.val,priority});
      }
    }
    for (const source of doc.querySelectorAll('head link,head style')) {
      let rules;
      if (source.localName === 'style') rules=parse(source.textContent);
      else {
        if (!source.getAttribute('rel')?.toLowerCase().split(/\s+/).includes('stylesheet')) continue;
        const ref = source.getAttribute('href');
        // The archive reader normalizes relative paths and resolves only embedded files.
        rules = await readCss(path,ref,cache,parse);
      }
      for (const rule of rules) {
        try {for (const el of doc.querySelectorAll(rule.selector)) assign(el,rule.score,rule.values);} catch { /* Optional selector. */ }
      }
    }
    const inline = document.createElement('span');
    return function apply(source,target) {
      if (source.hasAttribute('style')) {
        inline.style.cssText=source.getAttribute('style');
        assign(source,1000000,declarations(inline.style));
      }
      const values=matched.get(source);
      const align=source.getAttribute('align');
      if (/^(center|left|right|justify)$/i.test(align || '')) target.style.textAlign=align;
      if (!values) return;
      for (const [prop,{value}] of values) {
        if (info.plate) continue;
        if (info.kind !== 'matter') {
          // Keep intentional alignment and italic/bold inside the reader's validated novel typography.
          if (!['text-align','font-style','font-weight','font-variant','vertical-align'].includes(prop)) continue;
          if (source.matches('h1,h2,h3,h4,h5,h6')) continue;
        }
        if (info.center && /^(padding|margin)-top$/.test(prop) && value.endsWith('%') && parseFloat(value)>=20) {
          target.dataset.editionOpeningSpace=value;
          continue;
        }
        if (prop === 'font-size' && /^(p|h[1-6])$/.test(source.localName) && /[0-9](?:%|em|rem|px|pt)$/.test(value)) {
          target.style.fontSize='max(var(--reader-label-size),'+value+')';
        } else target.style.setProperty(prop,value);
      }
    };
  };
}

// Replace a light paper field with transparency. A colour photograph keeps its original interior.
async function adaptEpubIllustration(image) {
  if (!image.naturalWidth || !image.naturalHeight) return;
  const probe=document.createElement('canvas');
  probe.width=probe.height=40;
  const probeContext=probe.getContext('2d',{willReadFrequently:true});
  if (!probeContext) return;
  probeContext.drawImage(image,0,0,40,40);
  const sampled=probeContext.getImageData(0,0,40,40).data;
  let neutral=0, light=0, edge=0, opaque=0;
  for (let i=0;i<1600;i++) {
    const p=i*4,r=sampled[p],g=sampled[p+1],b=sampled[p+2];
    if (sampled[p+3]<245) continue;
    opaque++;
    if (Math.max(r,g,b)-Math.min(r,g,b)<14) neutral++;
    if (Math.min(r,g,b)>226) {
      light++;
      if (i<40 || i>=1560 || i%40===0 || i%40===39) edge++;
    }
  }
  const ink=opaque>0 && neutral/opaque>.975 && (light/opaque>.38 || opaque<1400);
  const paperCorners=[0,39,1560,1599].filter(i => {
    const p=i*4;
    return sampled[p+3]>245 && Math.min(sampled[p],sampled[p+1],sampled[p+2])>230;
  }).length;
  if (!ink && edge<124 && (paperCorners<3 || edge<12)) return;
  const canvas=document.createElement('canvas');
  const scale=Math.min(1,2200/Math.max(image.naturalWidth,image.naturalHeight));
  const width=canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));
  const height=canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  if (!ctx) return;
  ctx.drawImage(image,0,0,width,height);
  const bitmap=ctx.getImageData(0,0,width,height),pixels=bitmap.data;
  if (ink) {
    for (let p=0;p<pixels.length;p+=4) {
      const gray=(pixels[p]*.2126+pixels[p+1]*.7152+pixels[p+2]*.0722);
      pixels[p+3]=Math.round(pixels[p+3]*Math.max(0,1-gray/250));
      pixels[p]=73;pixels[p+1]=58;pixels[p+2]=59;
    }
  } else {
    const queue=new Uint32Array(width*height);
    let begin=0,end=0;
    function clear(i) {
      const p=i*4;
      if (pixels[p+3]===0 || Math.min(pixels[p],pixels[p+1],pixels[p+2])<237) return;
      pixels[p+3]=0;queue[end++]=i;
    }
    for (let x=0;x<width;x++) {clear(x);clear((height-1)*width+x);}
    for (let y=1;y<height-1;y++) {clear(y*width);clear(y*width+width-1);}
    while (begin<end) {
      const i=queue[begin++],x=i%width;
      if (x>0) clear(i-1);
      if (x<width-1) clear(i+1);
      if (i>=width) clear(i-width);
      if (i<width*(height-1)) clear(i+width);
    }
    if (!end) return;
  }
  ctx.putImageData(bitmap,0,0);
  image.src=canvas.toDataURL('image/png');
  image.dataset.editionPaper='transparent';
  if (ink) image.dataset.editionInk='';
  await image.decode();
}

function formatRemainingReadingTime(minutes) {
  const hours=Math.floor(minutes/60), remainder=minutes%60;
  if (!hours) return remainder+' min';
  return hours+' h'+(remainder?' '+String(remainder).padStart(2,'0')+' min':'');
}
