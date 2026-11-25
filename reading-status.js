// Each entry records a completed reading before a new one starts.
function readingStatusChange(book, status, now = new Date()) {
  const changes = {status, updatedAt: now.getTime()};
  if (book.status === status) return changes;
  if (status === 'Terminé') {
    const dated = book.status === 'En cours';
    Object.assign(changes, {
      readingEnd: dated ? {day:String(now.getDate()),month:String(now.getMonth()+1),year:String(now.getFullYear())} : null,
      finishedAt: dated ? now.getTime() : null, finishDateUnknown: !dated, progress:100
    });
  } else if (book.status === 'Terminé') {
    const completed = {readingStart:book.readingStart, readingEnd:book.readingEnd,
      finishedAt:book.finishedAt || (book.finishDateUnknown ? null : book.updatedAt),
      rating:book.rating, readingPosition:book.readingPosition};
    Object.assign(changes,{readingHistory:[...(book.readingHistory || []),completed],
      finishedAt:null, readingEnd:null, finishDateUnknown:false, readingStart:null,
      readingPosition:null, progress:0, chapter:null});
  }
  return changes;
}
function finishedInYear(book, year) {
  function matches(entry) {
    if (entry.readingEnd?.year) return Number(entry.readingEnd.year) === year;
    return !!entry.finishedAt && new Date(entry.finishedAt).getFullYear() === year;
  }
  if (book.readingHistory?.some(matches)) return true;
  return book.status === 'Terminé' && matches({...book,finishedAt:book.finishedAt || (!book.finishDateUnknown && book.updatedAt)});
}
