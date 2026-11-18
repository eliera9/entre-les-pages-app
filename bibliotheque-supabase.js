function createSupabaseLibrary() {
  const {db, owner} = compteLecture;
  const bucket = db.storage.from('livres');
  const covers = new Map();
  async function rpc(name, args = {}) {
    const {data, error, status} = await db.rpc(name, args);
    if (error) throw Object.assign(new Error(error.message), {status});
    return data;
  }
  async function upload(path, blob) {
    const {error} = await bucket.upload(path, blob, {contentType: blob.type || 'application/octet-stream', upsert:false});
    if (error && error.statusCode !== '409' && Number(error.status) !== 409 && error.error !== 'Duplicate') throw error;
  }
  async function download(path) {
    if (!path?.startsWith(owner + '/')) throw new Error('Fichier indisponible.');
    const {data,error} = await bucket.download(path);
    if (error) throw error;
    return data;
  }
  async function cover(path) {
    if (!covers.has(path)) {
      covers.set(path, download(path).then(blob => new Promise((resolve,reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      })).catch(error => { covers.delete(path); throw error; }));
    }
    return covers.get(path);
  }
  async function snapshot() {
    const result = await rpc('elp_snapshot');
    await Promise.all(result.books.map(async book => {
      if (book.coverPath) book.coverData = await cover(book.coverPath);
    }));
    return result;
  }
  async function submit(operation, file) {
    if (file) {
      const head = new Uint8Array(await file.slice(0,5).arrayBuffer());
      const pdf = String.fromCharCode(...head) === '%PDF-';
      const type = pdf ? 'application/pdf' : 'application/epub+zip';
      await upload(owner + '/' + operation.requestId, file.slice(0,file.size,type));
    }
    const value = {...operation.value};
    const encoded = typeof value.coverData === 'string' && /^data:(image\/(?:png|jpeg|webp|avif|gif));base64,([\s\S]+)$/.exec(value.coverData);
    if (encoded) {
      const bytes = Uint8Array.from(atob(encoded[2]), char => char.charCodeAt(0));
      value.coverPath = owner + '/cover-' + operation.requestId;
      await upload(value.coverPath, new Blob([bytes], {type:encoded[1]}));
      covers.set(value.coverPath, Promise.resolve(value.coverData));
      delete value.coverData;
    } else if (typeof value.coverData === 'string' && value.coverData.startsWith('https://')) {
      const {data,error,response} = await db.functions.invoke('catalogue',{body:{action:'cover',params:{url:value.coverData}}});
      if (!error && data instanceof Blob && response?.headers.get('X-Cover-Type')) {
        value.coverPath = owner + '/cover-' + operation.requestId;
        await upload(value.coverPath,new Blob([data],{type:response.headers.get('X-Cover-Type')}));
        delete value.coverData;
      } else value.coverPath = null;
    } else if (Object.hasOwn(value,'coverData')) value.coverPath = null;
    const saved = await rpc('elp_apply', {change:{...operation,value}});
    return saved;
  }
  async function tidy() {
    const paths = await rpc('elp_retired_documents');
    if (paths.length) {
      const {error} = await bucket.remove(paths);
      if (error) throw error;
      paths.forEach(path => covers.delete(path));
    }
  }
  async function documentFile(id) {
    const path = await rpc('elp_document', {book_id:id});
    return path ? {file:await download(path), version:path.split('/').at(-1)} : undefined;
  }
  return {snapshot,submit,documentFile,tidy};
}
