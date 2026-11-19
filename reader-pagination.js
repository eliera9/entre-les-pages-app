// Page coordinates are measured from the EPUB text, so a bookmark survives a change of screen size.
function createReaderPagination(viewport, content, annotations) {
  const gap = 32;
  let number = 0;
  let count = 1;
  let stride = 1;
  let textLength = 0;
  let start = 0;
  let end = Infinity;
  let format = '';
  const boundaries = new Map();

  function columnAt(offset) {
    const rect = annotations.characterRect(Math.min(Math.max(0,offset),textLength - 1));
    if (!rect) return 0;
    return Math.max(0,Math.min(count-1,Math.floor((rect.left - viewport.getBoundingClientRect().left + viewport.scrollLeft + 1) / stride)));
  }
  function boundary(column) {
    if (column <= 0) return 0;
    if (column >= count) return textLength;
    if (boundaries.has(column)) return boundaries.get(column);
    let low = 0, high = textLength;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (columnAt(middle) < column) low = middle + 1;
      else high = middle;
    }
    boundaries.set(column,low);
    return low;
  }
  function show(target) {
    number = Math.max(0,Math.min(count-1,target));
    viewport.scrollLeft = number * stride;
    start = boundary(number);
    end = number + 1 === count ? Infinity : boundary(number+1);
    viewport.dataset.leaf = String(number + 1);
    viewport.dataset.leaves = String(count);
    annotations.setLeaf(start,end);
  }
  function measure(kind,position = {},originalLayout) {
    format = kind;
    boundaries.clear();
    // Flex layout accounts for the actual header, tools, footer and safe areas.
    viewport.style.setProperty('--leaf-height',Math.max(1,viewport.clientHeight)+'px');
    const width = viewport.clientWidth;
    if (!width) return;
    stride = width + gap;
    textLength = annotations.textLength();
    viewport.style.setProperty('--leaf-width',width + 'px');
    count = kind === 'chapter' ? Math.max(1,Math.round((content.scrollWidth + gap) / stride)) : 1;
    let target = 0;
    if (position.last) target = count-1;
    else if (Number.isFinite(position.offset)) target = columnAt(position.offset);
    if (position.leaf && (!textLength || (position.leaf < count && boundary(position.leaf) === position.offset))) target = position.leaf;
    // Returning to the exact layout restores its original leaf even at a line-break boundary.
    if (originalLayout?.width === width && originalLayout.height === viewport.clientHeight && originalLayout.count === count) {
      target = position.leaf || 0;
    }
    show(target);
  }
  function anchor() { return format === 'chapter' ? {offset:start,leaf:number} : {}; }
  return {measure,show,anchor,get number(){return number;},get count(){return count;},
    get done(){return Number.isFinite(end) && textLength ? end/textLength : (number+1)/count;}};
}

function bindPageTurns(surface,signal,canTurn,turn) {
  let pointer;
  const interactive = 'button,a,select,input,textarea,[contenteditable=true],[role=button],[data-linked-mark],[data-annotation-id]';
  const selected = () => Boolean(window.getSelection()?.toString());
  const on = (type,callback) => surface.addEventListener(type,callback,{signal});
  on('pointerdown',event => {
    if (!event.isPrimary || event.button !== 0 || event.target.closest(interactive) || !canTurn()) {pointer = null;return;}
    pointer = {id:event.pointerId,x:event.clientX,y:event.clientY,at:performance.now(),selected:selected(),moved:false};
  });
  on('pointermove',event => {
    if (pointer?.id === event.pointerId && Math.abs(event.clientY-pointer.y)>20 && Math.abs(event.clientY-pointer.y)>Math.abs(event.clientX-pointer.x)) pointer.moved = true;
  });
  on('pointercancel',() => {pointer=null;});
  on('contextmenu',() => {pointer=null;});
  on('pointerup',event => {
    const from = pointer;
    pointer = null;
    if (!from || from.id !== event.pointerId || from.selected || selected() || from.moved || !canTurn() || event.target.closest(interactive)) return;
    const dx = event.clientX-from.x, dy = event.clientY-from.y, elapsed = performance.now()-from.at;
    if (elapsed < 750 && Math.abs(dx)>42 && Math.abs(dx)>Math.abs(dy)*1.6) return turn(dx < 0 ? 1 : -1);
    if (elapsed > 330 || Math.hypot(dx,dy)>9) return;
    const bounds = surface.getBoundingClientRect();
    const part = (event.clientX-bounds.left)/bounds.width;
    if (part <= .25 || part >= .75) turn(part <= .25 ? -1 : 1);
  });
}
