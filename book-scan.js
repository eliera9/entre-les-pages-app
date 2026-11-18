const eanLeft=["0001101","0011001","0010011","0111101","0100011","0110001","0101111","0111011","0110111","0001011"];
const eanRight=eanLeft.map(bits=>bits.replace(/[01]/g,bit=>bit==="0" ? "1" : "0"));
const eanEven=eanRight.map(bits=>[...bits].reverse().join(""));
const eanParity=["LLLLLL","LLGLGG","LLGGLG","LLGGGL","LGLLGG","LGGLLG","LGGGLL","LGLGLG","LGLGGL","LGGLGL"];

function isbnForScan(value) {
  const candidates=String(value ?? "").match(/(?:97[89](?:[\s-]*\d){10})|(?:\d(?:[\s-]*\d){8}[\s-]*[\dXx])/g) || [];
  for (const candidate of candidates) {
    const code=candidate.replace(/[\s-]/g,"").toUpperCase();
    if (code.length===13 && [...code].reduce((sum,number,index)=>sum+Number(number)*(index%2 ? 3 : 1),0)%10===0) return code;
    if (code.length===10 && [...code].reduce((sum,number,index)=>sum+(number==="X" ? 10 : Number(number))*(10-index),0)%11===0) return code;
  }
  return "";
}

function decodeEan13(bits) {
  if (bits.length!==95 || !bits.startsWith("101") || bits.slice(45,50)!=="01010" || !bits.endsWith("101")) return "";
  let digits="";
  let parity="";
  for (let i=3;i<45;i+=7) {
    const part=bits.slice(i,i+7);
    const odd=eanLeft.indexOf(part);
    const even=eanEven.indexOf(part);
    if (odd<0 && even<0) return "";
    digits+=odd<0 ? even : odd;
    parity+=odd<0 ? "G" : "L";
  }
  const first=eanParity.indexOf(parity);
  if (first<0) return "";
  for (let i=50;i<92;i+=7) {
    const value=eanRight.indexOf(bits.slice(i,i+7));
    if (value<0) return "";
    digits+=value;
  }
  const code=first+digits;
  return /^97[89]/.test(code) ? isbnForScan(code) : "";
}

function scanEanLine(values) {
  const min=Math.min(...values);
  const max=Math.max(...values);
  if (max-min<42) return "";
  const threshold=(max+min)/2;
  const sample=values.map(value=>value<threshold ? "1" : "0");
  for (let start=1;start<sample.length-95;start++) {
    if (sample[start]!=="1" || sample[start-1]!=="0") continue;
    let end=start;
    for (const bit of ["1","0","1"]) {
      while (sample[end]===bit) end++;
    }
    const size=(end-start)/3;
    if (size<1 || size>sample.length/88) continue;
    for (const scale of [1,.985,1.015,.965,1.035,.945,1.055]) {
      const step=size*scale;
      if (start+94.5*step>=sample.length) continue;
      const bits=Array.from({length:95},(_,index)=>sample[Math.floor(start+(index+.5)*step)]).join("");
      const found=decodeEan13(bits);
      if (found) return found;
    }
  }
  return "";
}

function imageIsbn(context,width,height) {
  const pixels=context.getImageData(0,0,width,height).data;
  function gray(x,y) {
    const i=(y*width+x)*4;
    return (pixels[i]*77+pixels[i+1]*150+pixels[i+2]*29)/256;
  }
  for (const position of [.5,.44,.56,.38,.62,.32,.68,.25,.75]) {
    for (const line of [
      Array.from({length:width},(_,x)=>gray(x,Math.floor(height*position))),
      Array.from({length:height},(_,y)=>gray(Math.floor(width*position),y)),
    ]) {
      const result=scanEanLine(line) || scanEanLine(line.reverse());
      if (result) return result;
    }
  }
  return "";
}

function mountBookScanner(dialog,onScan) {
  const video=dialog.querySelector("[data-ep-camera]");
  const message=dialog.querySelector("[data-ep-camera-message]");
  const file=dialog.querySelector("[data-ep-photo]");
  const canvas=document.createElement("canvas");
  const context=canvas.getContext("2d",{willReadFrequently:true});
  let detector;
  try { if (typeof BarcodeDetector==="function") detector=new BarcodeDetector({formats:["ean_13","qr_code"]}); } catch { /* Canvas fallback. */ }
  let stream;
  let timer;
  let version=0;
  let disposed=false;

  function release() {
    version++;
    clearTimeout(timer);
    stream?.getTracks().forEach(track=>track.stop());
    stream=null;
    video.srcObject=null;
    video.hidden=true;
  }
  function done(code) {
    dialog.close();
    release();
    onScan(code);
  }
  async function detect(source,width,height) {
    if (detector) {
      try {
        const detected=(await detector.detect(source)).map(item=>isbnForScan(item.rawValue)).find(Boolean);
        if (detected) return detected;
      } catch { /* Try the frame directly. */ }
    }
    if (!context || !width || !height) return "";
    const ratio=Math.min(1,720/Math.max(width,height));
    canvas.width=Math.max(1,Math.round(width*ratio));
    canvas.height=Math.max(1,Math.round(height*ratio));
    context.drawImage(source,0,0,canvas.width,canvas.height);
    return imageIsbn(context,canvas.width,canvas.height);
  }
  async function poll(ticket) {
    if (ticket!==version || !dialog.open) return;
    try {
      const code=await detect(video,video.videoWidth,video.videoHeight);
      if (ticket!==version || !dialog.open) return;
      if (code) { done(code); return; }
    } catch { /* Continue with the next frame. */ }
    if (ticket===version) timer=setTimeout(()=>poll(ticket),260);
  }
  async function open() {
    if (dialog.open || disposed) return;
    const ticket=++version;
    dialog.showModal();
    message.textContent="Demande d’accès à la caméra…";
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error();
      const next=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}},audio:false});
      if (ticket!==version || !dialog.open) { next.getTracks().forEach(track=>track.stop()); return; }
      stream=next;
      video.srcObject=next;
      video.hidden=false;
      await video.play();
      if (ticket!==version) return;
      message.textContent="Place le code-barres du livre au centre.";
      poll(ticket);
    } catch {
      if (ticket!==version) return;
      release();
      message.textContent="Caméra indisponible. Tu peux scanner une photo ou saisir l’ISBN dans la recherche.";
    }
  }
  file.addEventListener("change",async()=>{
    const selected=file.files?.[0];
    file.value="";
    if (!selected || !dialog.open) return;
    release();
    const ticket=version;
    message.textContent="Lecture du code-barres…";
    const url=URL.createObjectURL(selected);
    try {
      const image=new Image();
      image.src=url;
      await image.decode();
      const code=await detect(image,image.naturalWidth,image.naturalHeight);
      if (ticket!==version || !dialog.open) return;
      if (code) done(code);
      else message.textContent="Code-barres introuvable. Essaie une photo plus nette ou saisis l’ISBN.";
    } catch {
      if (ticket===version && dialog.open) message.textContent="Cette photo est illisible.";
    } finally {
      URL.revokeObjectURL(url);
    }
  });
  dialog.querySelector("[data-ep-scan-close]").addEventListener("click",()=>dialog.close());
  dialog.addEventListener("close",release);
  return {open,active:()=>dialog.open,stop:()=>{disposed=true;if (dialog.open) dialog.close();release();}};
}
