/*!

JSZip v3.10.1 - A JavaScript class for generating and reading zip files
<http://stuartk.com/jszip>

(c) 2009-2016 Stuart Knightley <stuart [at] stuartk.com>
Dual licenced under the MIT license or GPLv3. See https://raw.github.com/Stuk/jszip/main/LICENSE.markdown.

JSZip uses the library pako released under the MIT license :
https://github.com/nodeca/pako/blob/main/LICENSE
*/

!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{("undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this).JSZip=e()}}(function(){return function s(a,o,h){function u(r,e){if(!o[r]){if(!a[r]){var t="function"==typeof require&&require;if(!e&&t)return t(r,!0);if(l)return l(r,!0);var n=new Error("Cannot find module '"+r+"'");throw n.code="MODULE_NOT_FOUND",n}var i=o[r]={exports:{}};a[r][0].call(i.exports,function(e){var t=a[r][1][e];return u(t||e)},i,i.exports,s,a,o,h)}return o[r].exports}for(var l="function"==typeof require&&require,e=0;e<h.length;e++)u(h[e]);return u}({1:[function(e,t,r){"use strict";var d=e("./utils"),c=e("./support"),p="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";r.encode=function(e){for(var t,r,n,i,s,a,o,h=[],u=0,l=e.length,f=l,c="string"!==d.getTypeOf(e);u<e.length;)f=l-u,n=c?(t=e[u++],r=u<l?e[u++]:0,u<l?e[u++]:0):(t=e.charCodeAt(u++),r=u<l?e.charCodeAt(u++):0,u<l?e.charCodeAt(u++):0),i=t>>2,s=(3&t)<<4|r>>4,a=1<f?(15&r)<<2|n>>6:64,o=2<f?63&n:64,h.push(p.charAt(i)+p.charAt(s)+p.charAt(a)+p.charAt(o));return h.join("")},r.decode=function(e){var t,r,n,i,s,a,o=0,h=0,u="data:";if(e.substr(0,u.length)===u)throw new Error("Invalid base64 input, it looks like a data url.");var l,f=3*(e=e.replace(/[^A-Za-z0-9+/=]/g,"")).length/4;if(e.charAt(e.length-1)===p.charAt(64)&&f--,e.charAt(e.length-2)===p.charAt(64)&&f--,f%1!=0)throw new Error("Invalid base64 input, bad content length.");for(l=c.uint8array?new Uint8Array(0|f):new Array(0|f);o<e.length;)t=p.indexOf(e.charAt(o++))<<2|(i=p.indexOf(e.charAt(o++)))>>4,r=(15&i)<<4|(s=p.indexOf(e.charAt(o++)))>>2,n=(3&s)<<6|(a=p.indexOf(e.charAt(o++))),l[h++]=t,64!==s&&(l[h++]=r),64!==a&&(l[h++]=n);return l}},{"./support":30,"./utils":32}],2:[function(e,t,r){"use strict";var n=e("./external"),i=e("./stream/DataWorker"),s=e("./stream/Crc32Probe"),a=e("./stream/DataLengthProbe");function o(e,t,r,n,i){this.compressedSize=e,this.uncompressedSize=t,this.crc32=r,this.compression=n,this.compressedContent=i}o.prototype={getContentWorker:function(){var e=new i(n.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new a("data_length")),t=this;return e.on("end",function(){if(this.streamInfo.data_length!==t.uncompressedSize)throw new Error("Bug : uncompressed data size mismatch")}),e},getCompressedWorker:function(){return new i(n.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize",this.compressedSize).withStreamInfo("uncompressedSize",this.uncompressedSize).withStreamInfo("crc32",this.crc32).withStreamInfo("compression",this.compression)}},o.createWorkerFrom=function(e,t,r){return e.pipe(new s).pipe(new a("uncompressedSize")).pipe(t.compressWorker(r)).pipe(new a("compressedSize")).withStreamInfo("compression",t)},t.exports=o},{"./external":6,"./stream/Crc32Probe":25,"./stream/DataLengthProbe":26,"./stream/DataWorker":27}],3:[function(e,t,r){"use strict";var n=e("./stream/GenericWorker");r.STORE={magic:"\0\0",compressWorker:function(){return new n("STORE compression")},uncompressWorker:function(){return new n("STORE decompression")}},r.DEFLATE=e("./flate")},{"./flate":7,"./stream/GenericWorker":28}],4:[function(e,t,r){"use strict";var n=e("./utils");var o=function(){for(var e,t=[],r=0;r<256;r++){e=r;for(var n=0;n<8;n++)e=1&e?3988292384^e>>>1:e>>>1;t[r]=e}return t}();t.exports=function(e,t){return void 0!==e&&e.length?"string"!==n.getTypeOf(e)?function(e,t,r,n){var i=o,s=n+r;e^=-1;for(var a=n;a<s;a++)e=e>>>8^i[255&(e^t[a])];return-1^e}(0|t,e,e.length,0):function(e,t,r,n){var i=o,s=n+r;e^=-1;for(var a=n;a<s;a++)e=e>>>8^i[255&(e^t.charCodeAt(a))];return-1^e}(0|t,e,e.length,0):0}},{"./utils":32}],5:[function(e,t,r){"use strict";r.base64=!1,r.binary=!1,r.dir=!1,r.createFolders=!0,r.date=null,r.compression=null,r.compressionOptions=null,r.comment=null,r.unixPermissions=null,r.dosPermissions=null},{}],6:[function(e,t,r){"use strict";var n=null;n="undefined"!=typeof Promise?Promise:e("lie"),t.exports={Promise:n}},{lie:37}],7:[function(e,t,r){"use strict";var n="undefined"!=typeof Uint8Array&&"undefined"!=typeof Uint16Array&&"undefined"!=typeof Uint32Array,i=e("pako"),s=e("./utils"),a=e("./stream/GenericWorker"),o=n?"uint8array":"array";function h(e,t){a.call(this,"FlateWorker/"+e),this._pako=null,this._pakoAction=e,this._pakoOptions=t,this.meta={}}r.magic="\b\0",s.inherits(h,a),h.prototype.processChunk=function(e){this.meta=e.meta,null===this._pako&&this._createPako(),this._pako.push(s.transformTo(o,e.data),!1)},h.prototype.flush=function(){a.prototype.flush.call(this),null===this._pako&&this._createPako(),this._pako.push([],!0)},h.prototype.cleanUp=function(){a.prototype.cleanUp.call(this),this._pako=null},h.prototype._createPako=function(){this._pako=new i[this._pakoAction]({raw:!0,level:this._pakoOptions.level||-1});var t=this;this._pako.onData=function(e){t.push({data:e,meta:t.meta})}},r.compressWorker=function(e){return new h("Deflate",e)},r.uncompressWorker=function(){return new h("Inflate",{})}},{"./stream/GenericWorker":28,"./utils":32,pako:38}],8:[function(e,t,r){"use strict";function A(e,t){var r,n="";for(r=0;r<t;r++)n+=String.fromCharCode(255&e),e>>>=8;return n}function n(e,t,r,n,i,s){var a,o,h=e.file,u=e.compression,l=s!==O.utf8encode,f=I.transformTo("string",s(h.name)),c=I.transformTo("string",O.utf8encode(h.name)),d=h.comment,p=I.transformTo("string",s(d)),m=I.transformTo("string",O.utf8encode(d)),_=c.length!==h.name.length,g=m.length!==d.length,b="",v="",y="",w=h.dir,k=h.date,x={crc32:0,compressedSize:0,uncompressedSize:0};t&&!r||(x.crc32=e.crc32,x.compressedSize=e.compressedSize,x.uncompressedSize=e.uncompressedSize);var S=0;t&&(S|=8),l||!_&&!g||(S|=2048);var z=0,C=0;w&&(z|=16),"UNIX"===i?(C=798,z|=function(e,t){var r=e;return e||(r=t?16893:33204),(65535&r)<<16}(h.unixPermissions,w)):(C=20,z|=function(e){return 63&(e||0)}(h.dosPermissions)),a=k.getUTCHours(),a<<=6,a|=k.getUTCMinutes(),a<<=5,a|=k.getUTCSeconds()/2,o=k.getUTCFullYear()-1980,o<<=4,o|=k.getUTCMonth()+1,o<<=5,o|=k.getUTCDate(),_&&(v=A(1,1)+A(B(f),4)+c,b+="up"+A(v.length,2)+v),g&&(y=A(1,1)+A(B(p),4)+m,b+="uc"+A(y.length,2)+y);var E="";return E+="\n\0",E+=A(S,2),E+=u.magic,E+=A(a,2),E+=A(o,2),E+=A(x.crc32,4),E+=A(x.compressedSize,4),E+=A(x.uncompressedSize,4),E+=A(f.length,2),E+=A(b.length,2),{fileRecord:R.LOCAL_FILE_HEADER+E+f+b,dirRecord:R.CENTRAL_FILE_HEADER+A(C,2)+E+A(p.length,2)+"\0\0\0\0"+A(z,4)+A(n,4)+f+b+p}}var I=e("../utils"),i=e("../stream/GenericWorker"),O=e("../utf8"),B=e("../crc32"),R=e("../signature");function s(e,t,r,n){i.call(this,"ZipFileWorker"),this.bytesWritten=0,this.zipComment=t,this.zipPlatform=r,this.encodeFileName=n,this.streamFiles=e,this.accumulate=!1,this.contentBuffer=[],this.dirRecords=[],this.currentSourceOffset=0,this.entriesCount=0,this.currentFile=null,this._sources=[]}I.inherits(s,i),s.prototype.push=function(e){var t=e.meta.percent||0,r=this.entriesCount,n=this._sources.length;this.accumulate?this.contentBuffer.push(e):(this.bytesWritten+=e.data.length,i.prototype.push.call(this,{data:e.data,meta:{currentFile:this.currentFile,percent:r?(t+100*(r-n-1))/r:100}}))},s.prototype.openedSource=function(e){this.currentSourceOffset=this.bytesWritten,this.currentFile=e.file.name;var t=this.streamFiles&&!e.file.dir;if(t){var r=n(e,t,!1,this.currentSourceOffset,this.zipPlatform,this.encodeFileName);this.push({data:r.fileRecord,meta:{percent:0}})}else this.accumulate=!0},s.prototype.closedSource=function(e){this.accumulate=!1;var t=this.streamFiles&&!e.file.dir,r=n(e,t,!0,this.currentSourceOffset,this.zipPlatform,this.encodeFileName);if(this.dirRecords.push(r.dirRecord),t)this.push({data:function(e){return R.DATA_DESCRIPTOR+A(e.crc32,4)+A(e.compressedSize,4)+A(e.uncompressedSize,4)}(e),meta:{percent:100}});else for(this.push({data:r.fileRecord,meta:{percent:0}});this.contentBuffer.length;)this.push(this.contentBuffer.shift());this.currentFile=null},s.prototype.flush=function(){for(var e=this.bytesWritten,t=0;t<this.dirRecords.length;t++)this.push({data:this.dirRecords[t],meta:{percent:100}});var r=this.bytesWritten-e,n=function(e,t,r,n,i){var s=I.transformTo("string",i(n));return R.CENTRAL_DIRECTORY_END+"\0\0\0\0"+A(e,2)+A(e,2)+A(t,4)+A(r,4)+A(s.length,2)+s}(this.dirRecords.length,r,e,this.zipComment,this.encodeFileName);this.push({data:n,meta:{percent:100}})},s.prototype.prepareNextSource=function(){this.previous=this._sources.shift(),this.openedSource(this.previous.streamInfo),this.isPaused?this.previous.pause():this.previous.resume()},s.prototype.registerPrevious=function(e){this._sources.push(e);var t=this;return e.on("data",function(e){t.processChunk(e)}),e.on("end",function(){t.closedSource(t.previous.streamInfo),t._sources.length?t.prepareNextSource():t.end()}),e.on("error",function(e){t.error(e)}),this},s.prototype.resume=function(){return!!i.prototype.resume.call(this)&&(!this.previous&&this._sources.length?(this.prepareNextSource(),!0):this.previous||this._sources.length||this.generatedError?void 0:(this.end(),!0))},s.prototype.error=function(e){var t=this._sources;if(!i.prototype.error.call(this,e))return!1;for(var r=0;r<t.length;r++)try{t[r].error(e)}catch(e){}return!0},s.prototype.lock=function(){i.prototype.lock.call(this);for(var e=this._sources,t=0;t<e.length;t++)e[t].lock()},t.exports=s},{"../crc32":4,"../signature":23,"../stream/GenericWorker":28,"../utf8":31,"../utils":32}],9:[function(e,t,r){"use strict";var u=e("../compressions"),n=e("./ZipFileWorker");r.generateWorker=function(e,a,t){var o=new n(a.streamFiles,t,a.platform,a.encodeFileName),h=0;try{e.forEach(function(e,t){h++;var r=function(e,t){var r=e||t,n=u[r];if(!n)throw new Error(r+" is not a valid compression method !");return n}(t.options.compression,a.compression),n=t.options.compressionOptions||a.compressionOptions||{},i=t.dir,s=t.date;t._compressWorker(r,n).withStreamInfo("file",{name:e,dir:i,date:s,comment:t.comment||"",unixPermissions:t.unixPermissions,dosPermissions:t.dosPermissions}).pipe(o)}),o.entriesCount=h}catch(e){o.error(e)}return o}},{"../compressions":3,"./ZipFileWorker":8}],10:[function(e,t,r){"use strict";function n(){if(!(this instanceof n))return new n;if(arguments.length)throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");this.files=Object.create(null),this.comment=null,this.root="",this.clone=function(){var e=new n;for(var t in this)"function"!=typeof this[t]&&(e[t]=this[t]);return e}}(n.prototype=e("./object")).loadAsync=e("./load"),n.support=e("./support"),n.defaults=e("./defaults"),n.version="3.10.1",n.loadAsync=function(e,t){return(new n).loadAsync(e,t)},n.external=e("./external"),t.exports=n},{"./defaults":5,"./external":6,"./load":11,"./object":15,"./support":30}],11:[function(e,t,r){"use strict";var u=e("./utils"),i=e("./external"),n=e("./utf8"),s=e("./zipEntries"),a=e("./stream/Crc32Probe"),l=e("./nodejsUtils");function f(n){return new i.Promise(function(e,t){var r=n.decompressed.getContentWorker().pipe(new a);r.on("error",function(e){t(e)}).on("end",function(){r.streamInfo.crc32!==n.decompressed.crc32?t(new Error("Corrupted zip : CRC32 mismatch")):e()}).resume()})}t.exports=function(e,o){var h=this;return o=u.extend(o||{},{base64:!1,checkCRC32:!1,optimizedBinaryString:!1,createFolders:!1,decodeFileName:n.utf8decode}),l.isNode&&l.isStream(e)?i.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file.")):u.prepareContent("the loaded zip file",e,!0,o.optimizedBinaryString,o.base64).then(function(e){var t=new s(o);return t.load(e),t}).then(function(e){var t=[i.Promise.resolve(e)],r=e.files;if(o.checkCRC32)for(var n=0;n<r.length;n++)t.push(f(r[n]));return i.Promise.all(t)}).then(function(e){for(var t=e.shift(),r=t.files,n=0;n<r.length;n++){var i=r[n],s=i.fileNameStr,a=u.resolve(i.fileNameStr);h.file(a,i.decompressed,{binary:!0,optimizedBinaryString:!0,date:i.date,dir:i.dir,comment:i.fileCommentStr.length?i.fileCommentStr:null,unixPermissions:i.unixPermissions,dosPermissions:i.dosPermissions,createFolders:o.createFolders}),i.dir||(h.file(a).unsafeOriginalName=s)}return t.zipComment.length&&(h.comment=t.zipComment),h})}},{"./external":6,"./nodejsUtils":14,"./stream/Crc32Probe":25,"./utf8":31,"./utils":32,"./zipEntries":33}],12:[function(e,t,r){"use strict";var n=e("../utils"),i=e("../stream/GenericWorker");function s(e,t){i.call(this,"Nodejs stream input adapter for "+e),this._upstreamEnded=!1,this._bindStream(t)}n.inherits(s,i),s.prototype._bindStream=function(e){var t=this;(this._stream=e).pause(),e.on("data",function(e){t.push({data:e,meta:{percent:0}})}).on("error",function(e){t.isPaused?this.generatedError=e:t.error(e)}).on("end",function(){t.isPaused?t._upstreamEnded=!0:t.end()})},s.prototype.pause=function(){return!!i.prototype.pause.call(this)&&(this._stream.pause(),!0)},s.prototype.resume=function(){return!!i.prototype.resume.call(this)&&(this._upstreamEnded?this.end():this._stream.resume(),!0)},t.exports=s},{"../stream/GenericWorker":28,"../utils":32}],13:[function(e,t,r){"use strict";var i=e("readable-stream").Readable;function n(e,t,r){i.call(this,t),this._helper=e;var n=this;e.on("data",function(e,t){n.push(e)||n._helper.pause(),r&&r(t)}).on("error",function(e){n.emit("error",e)}).on("end",function(){n.push(null)})}e("../utils").inherits(n,i),n.prototype._read=function(){this._helper.resume()},t.exports=n},{"../utils":32,"readable-stream":16}],14:[function(e,t,r){"use strict";t.exports={isNode:"undefined"!=typeof Buffer,newBufferFrom:function(e,t){if(Buffer.from&&Buffer.from!==Uint8Array.from)return Buffer.from(e,t);if("number"==typeof e)throw new Error('The "data" argument must not be a number');return new Buffer(e,t)},allocBuffer:function(e){if(Buffer.alloc)return Buffer.alloc(e);var t=new Buffer(e);return t.fill(0),t},isBuffer:function(e){return Buffer.isBuffer(e)},isStream:function(e){return e&&"function"==typeof e.on&&"function"==typeof e.pause&&"function"==typeof e.resume}}},{}],15:[function(e,t,r){"use strict";function s(e,t,r){var n,i=u.getTypeOf(t),s=u.extend(r||{},f);s.date=s.date||new Date,null!==s.compression&&(s.compression=s.compression.toUpperCase()),"string"==typeof s.unixPermissions&&(s.unixPermissions=parseInt(s.unixPermissions,8)),s.unixPermissions&&16384&s.unixPermissions&&(s.dir=!0),s.dosPermissions&&16&s.dosPermissions&&(s.dir=!0),s.dir&&(e=g(e)),s.createFolders&&(n=_(e))&&b.call(this,n,!0);var a="string"===i&&!1===s.binary&&!1===s.base64;r&&void 0!==r.binary||(s.binary=!a),(t instanceof c&&0===t.uncompressedSize||s.dir||!t||0===t.length)&&(s.base64=!1,s.binary=!0,t="",s.compression="STORE",i="string");var o=null;o=t instanceof c||t instanceof l?t:p.isNode&&p.isStream(t)?new m(e,t):u.prepareContent(e,t,s.binary,s.optimizedBinaryString,s.base64);var h=new d(e,o,s);this.files[e]=h}var i=e("./utf8"),u=e("./utils"),l=e("./stream/GenericWorker"),a=e("./stream/StreamHelper"),f=e("./defaults"),c=e("./compressedObject"),d=e("./zipObject"),o=e("./generate"),p=e("./nodejsUtils"),m=e("./nodejs/NodejsStreamInputAdapter"),_=function(e){"/"===e.slice(-1)&&(e=e.substring(0,e.length-1));var t=e.lastIndexOf("/");return 0<t?e.substring(0,t):""},g=function(e){return"/"!==e.slice(-1)&&(e+="/"),e},b=function(e,t){return t=void 0!==t?t:f.createFolders,e=g(e),this.files[e]||s.call(this,e,null,{dir:!0,createFolders:t}),this.files[e]};function h(e){return"[object RegExp]"===Object.prototype.toString.call(e)}var n={load:function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},forEach:function(e){var t,r,n;for(t in this.files)n=this.files[t],(r=t.slice(this.root.length,t.length))&&t.slice(0,this.root.length)===this.root&&e(r,n)},filter:function(r){var n=[];return this.forEach(function(e,t){r(e,t)&&n.push(t)}),n},file:function(e,t,r){if(1!==arguments.length)return e=this.root+e,s.call(this,e,t,r),this;if(h(e)){var n=e;return this.filter(function(e,t){return!t.dir&&n.test(e)})}var i=this.files[this.root+e];return i&&!i.dir?i:null},folder:function(r){if(!r)return this;if(h(r))return this.filter(function(e,t){return t.dir&&r.test(e)});var e=this.root+r,t=b.call(this,e),n=this.clone();return n.root=t.name,n},remove:function(r){r=this.root+r;var e=this.files[r];if(e||("/"!==r.slice(-1)&&(r+="/"),e=this.files[r]),e&&!e.dir)delete this.files[r];else for(var t=this.filter(function(e,t){return t.name.slice(0,r.length)===r}),n=0;n<t.length;n++)delete this.files[t[n].name];return this},generate:function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},generateInternalStream:function(e){var t,r={};try{if((r=u.extend(e||{},{streamFiles:!1,compression:"STORE",compressionOptions:null,type:"",platform:"DOS",comment:null,mimeType:"application/zip",encodeFileName:i.utf8encode})).type=r.type.toLowerCase(),r.compression=r.compression.toUpperCase(),"binarystring"===r.type&&(r.type="string"),!r.type)throw new Error("No output type specified.");u.checkSupport(r.type),"darwin"!==r.platform&&"freebsd"!==r.platform&&"linux"!==r.platform&&"sunos"!==r.platform||(r.platform="UNIX"),"win32"===r.platform&&(r.platform="DOS");var n=r.comment||this.comment||"";t=o.generateWorker(this,r,n)}catch(e){(t=new l("error")).error(e)}return new a(t,r.type||"string",r.mimeType)},generateAsync:function(e,t){return this.generateInternalStream(e).accumulate(t)},generateNodeStream:function(e,t){return(e=e||{}).type||(e.type="nodebuffer"),this.generateInternalStream(e).toNodejsStream(t)}};t.exports=n},{"./compressedObject":2,"./defaults":5,"./generate":9,"./nodejs/NodejsStreamInputAdapter":12,"./nodejsUtils":14,"./stream/GenericWorker":28,"./stream/StreamHelper":29,"./utf8":31,"./utils":32,"./zipObject":35}],16:[function(e,t,r){"use strict";t.exports=e("stream")},{stream:void 0}],17:[function(e,t,r){"use strict";var n=e("./DataReader");function i(e){n.call(this,e);for(var t=0;t<this.data.length;t++)e[t]=255&e[t]}e("../utils").inherits(i,n),i.prototype.byteAt=function(e){return this.data[this.zero+e]},i.prototype.lastIndexOfSignature=function(e){for(var t=e.charCodeAt(0),r=e.charCodeAt(1),n=e.charCodeAt(2),i=e.charCodeAt(3),s=this.length-4;0<=s;--s)if(this.data[s]===t&&this.data[s+1]===r&&this.data[s+2]===n&&this.data[s+3]===i)return s-this.zero;return-1},i.prototype.readAndCheckSignature=function(e){var t=e.charCodeAt(0),r=e.charCodeAt(1),n=e.charCodeAt(2),i=e.charCodeAt(3),s=this.readData(4);return t===s[0]&&r===s[1]&&n===s[2]&&i===s[3]},i.prototype.readData=function(e){if(this.checkOffset(e),0===e)return[];var t=this.data.slice(this.zero+this.index,this.zero+this.index+e);return this.index+=e,t},t.exports=i},{"../utils":32,"./DataReader":18}],18:[function(e,t,r){"use strict";var n=e("../utils");function i(e){this.data=e,this.length=e.length,this.index=0,this.zero=0}i.prototype={checkOffset:function(e){this.checkIndex(this.index+e)},checkIndex:function(e){if(this.length<this.zero+e||e<0)throw new Error("End of data reached (data length = "+this.length+", asked index = "+e+"). Corrupted zip ?")},setIndex:function(e){this.checkIndex(e),this.index=e},skip:function(e){this.setIndex(this.index+e)},byteAt:function(){},readInt:function(e){var t,r=0;for(this.checkOffset(e),t=this.index+e-1;t>=this.index;t--)r=(r<<8)+this.byteAt(t);return this.index+=e,r},readString:function(e){return n.transformTo("string",this.readData(e))},readData:function(){},lastIndexOfSignature:function(){},readAndCheckSignature:function(){},readDate:function(){var e=this.readInt(4);return new Date(Date.UTC(1980+(e>>25&127),(e>>21&15)-1,e>>16&31,e>>11&31,e>>5&63,(31&e)<<1))}},t.exports=i},{"../utils":32}],19:[function(e,t,r){"use strict";var n=e("./Uint8ArrayReader");function i(e){n.call(this,e)}e("../utils").inherits(i,n),i.prototype.readData=function(e){this.checkOffset(e);var t=this.data.slice(this.zero+this.index,this.zero+this.index+e);return this.index+=e,t},t.exports=i},{"../utils":32,"./Uint8ArrayReader":21}],20:[function(e,t,r){"use strict";var n=e("./DataReader");function i(e){n.call(this,e)}e("../utils").inherits(i,n),i.prototype.byteAt=function(e){return this.data.charCodeAt(this.zero+e)},i.prototype.lastIndexOfSignature=function(e){return this.data.lastIndexOf(e)-this.zero},i.prototype.readAndCheckSignature=function(e){return e===this.readData(4)},i.prototype.readData=function(e){this.checkOffset(e);var t=this.data.slice(this.zero+this.index,this.zero+this.index+e);return this.index+=e,t},t.exports=i},{"../utils":32,"./DataReader":18}],21:[function(e,t,r){"use strict";var n=e("./ArrayReader");function i(e){n.call(this,e)}e("../utils").inherits(i,n),i.prototype.readData=function(e){if(this.checkOffset(e),0===e)return new Uint8Array(0);var t=this.data.subarray(this.zero+this.index,this.zero+this.index+e);return this.index+=e,t},t.exports=i},{"../utils":32,"./ArrayReader":17}],22:[function(e,t,r){"use strict";var n=e("../utils"),i=e("../support"),s=e("./ArrayReader"),a=e("./StringReader"),o=e("./NodeBufferReader"),h=e("./Uint8ArrayReader");t.exports=function(e){var t=n.getTypeOf(e);return n.checkSupport(t),"string"!==t||i.uint8array?"nodebuffer"===t?new o(e):i.uint8array?new h(n.transformTo("uint8array",e)):new s(n.transformTo("array",e)):new a(e)}},{"../support":30,"../utils":32,"./ArrayReader":17,"./NodeBufferReader":19,"./StringReader":20,"./Uint8ArrayReader":21}],23:[function(e,t,r){"use strict";r.LOCAL_FILE_HEADER="PK",r.CENTRAL_FILE_HEADER="PK",r.CENTRAL_DIRECTORY_END="PK",r.ZIP64_CENTRAL_DIRECTORY_LOCATOR="PK",r.ZIP64_CENTRAL_DIRECTORY_END="PK",r.DATA_DESCRIPTOR="PK\b"},{}],24:[function(e,t,r){"use strict";var n=e("./GenericWorker"),i=e("../utils");function s(e){n.call(this,"ConvertWorker to "+e),this.destType=e}i.inherits(s,n),s.prototype.processChunk=function(e){this.push({data:i.transformTo(this.destType,e.data),meta:e.meta})},t.exports=s},{"../utils":32,"./GenericWorker":28}],25:[function(e,t,r){"use strict";var n=e("./GenericWorker"),i=e("../crc32");function s(){n.call(this,"Crc32Probe"),this.withStreamInfo("crc32",0)}e("../utils").inherits(s,n),s.prototype.processChunk=function(e){this.streamInfo.crc32=i(e.data,this.streamInfo.crc32||0),this.push(e)},t.exports=s},{"../crc32":4,"../utils":32,"./GenericWorker":28}],26:[function(e,t,r){"use strict";var n=e("../utils"),i=e("./GenericWorker");function s(e){i.call(this,"DataLengthProbe for "+e),this.propName=e,this.withStreamInfo(e,0)}n.inherits(s,i),s.prototype.processChunk=function(e){if(e){var t=this.streamInfo[this.propName]||0;this.streamInfo[this.propName]=t+e.data.length}i.prototype.processChunk.call(this,e)},t.exports=s},{"../utils":32,"./GenericWorker":28}],27:[function(e,t,r){"use strict";var n=e("../utils"),i=e("./GenericWorker");function s(e){i.call(this,"DataWorker");var t=this;this.dataIsReady=!1,this.index=0,this.max=0,this.data=null,this.type="",this._tickScheduled=!1,e.then(function(e){t.dataIsReady=!0,t.data=e,t.max=e&&e.length||0,t.type=n.getTypeOf(e),t.isPaused||t._tickAndRepeat()},function(e){t.error(e)})}n.inherits(s,i),s.prototype.cleanUp=function(){i.prototype.cleanUp.call(this),this.data=null},s.prototype.resume=function(){return!!i.prototype.resume.call(this)&&(!this._tickScheduled&&this.dataIsReady&&(this._tickScheduled=!0,n.delay(this._tickAndRepeat,[],this)),!0)},s.prototype._tickAndRepeat=function(){this._tickScheduled=!1,this.isPaused||this.isFinished||(this._tick(),this.isFinished||(n.delay(this._tickAndRepeat,[],this),this._tickScheduled=!0))},s.prototype._tick=function(){if(this.isPaused||this.isFinished)return!1;var e=null,t=Math.min(this.max,this.index+16384);if(this.index>=this.max)return this.end();switch(this.type){case"string":e=this.data.substring(this.index,t);break;case"uint8array":e=this.data.subarray(this.index,t);break;case"array":case"nodebuffer":e=this.data.slice(this.index,t)}return this.index=t,this.push({data:e,meta:{percent:this.max?this.index/this.max*100:0}})},t.exports=s},{"../utils":32,"./GenericWorker":28}],28:[function(e,t,r){"use strict";function n(e){this.name=e||"default",this.streamInfo={},this.generatedError=null,this.extraStreamInfo={},this.isPaused=!0,this.isFinished=!1,this.isLocked=!1,this._listeners={data:[],end:[],error:[]},this.previous=null}n.prototype={push:function(e){this.emit("data",e)},end:function(){if(this.isFinished)return!1;this.flush();try{this.emit("end"),this.cleanUp(),this.isFinished=!0}catch(e){this.emit("error",e)}return!0},error:function(e){return!this.isFinished&&(this.isPaused?this.generatedError=e:(this.isFinished=!0,this.emit("error",e),this.previous&&this.previous.error(e),this.cleanUp()),!0)},on:function(e,t){return this._listeners[e].push(t),this},cleanUp:function(){this.streamInfo=this.generatedError=this.extraStreamInfo=null,this._listeners=[]},emit:function(e,t){if(this._listeners[e])for(var r=0;r<this._listeners[e].length;r++)this._listeners[e][r].call(this,t)},pipe:function(e){return e.registerPrevious(this)},registerPrevious:function(e){if(this.isLocked)throw new Error("The stream '"+this+"' has already been used.");this.streamInfo=e.streamInfo,this.mergeStreamInfo(),this.previous=e;var t=this;return e.on("data",function(e){t.processChunk(e)}),e.on("end",function(){t.end()}),e.on("error",function(e){t.error(e)}),this},pause:function(){return!this.isPaused&&!this.isFinished&&(this.isPaused=!0,this.previous&&this.previous.pause(),!0)},resume:function(){if(!this.isPaused||this.isFinished)return!1;var e=this.isPaused=!1;return this.generatedError&&(this.error(this.generatedError),e=!0),this.previous&&this.previous.resume(),!e},flush:function(){},processChunk:function(e){this.push(e)},withStreamInfo:function(e,t){return this.extraStreamInfo[e]=t,this.mergeStreamInfo(),this},mergeStreamInfo:function(){for(var e in this.extraStreamInfo)Object.prototype.hasOwnProperty.call(this.extraStreamInfo,e)&&(this.streamInfo[e]=this.extraStreamInfo[e])},lock:function(){if(this.isLocked)throw new Error("The stream '"+this+"' has already been used.");this.isLocked=!0,this.previous&&this.previous.lock()},toString:function(){var e="Worker "+this.name;return this.previous?this.previous+" -> "+e:e}},t.exports=n},{}],29:[function(e,t,r){"use strict";var h=e("../utils"),i=e("./ConvertWorker"),s=e("./GenericWorker"),u=e("../base64"),n=e("../support"),a=e("../external"),o=null;if(n.nodestream)try{o=e("../nodejs/NodejsStreamOutputAdapter")}catch(e){}function l(e,o){return new a.Promise(function(t,r){var n=[],i=e._internalType,s=e._outputType,a=e._mimeType;e.on("data",function(e,t){n.push(e),o&&o(t)}).on("error",function(e){n=[],r(e)}).on("end",function(){try{var e=function(e,t,r){switch(e){case"blob":return h.newBlob(h.transformTo("arraybuffer",t),r);case"base64":return u.encode(t);default:return h.transformTo(e,t)}}(s,function(e,t){var r,n=0,i=null,s=0;for(r=0;r<t.length;r++)s+=t[r].length;switch(e){case"string":return t.join("");case"array":return Array.prototype.concat.apply([],t);case"uint8array":for(i=new Uint8Array(s),r=0;r<t.length;r++)i.set(t[r],n),n+=t[r].length;return i;case"nodebuffer":return Buffer.concat(t);default:throw new Error("concat : unsupported type '"+e+"'")}}(i,n),a);t(e)}catch(e){r(e)}n=[]}).resume()})}function f(e,t,r){var n=t;switch(t){case"blob":case"arraybuffer":n="uint8array";break;case"base64":n="string"}try{this._internalType=n,this._outputType=t,this._mimeType=r,h.checkSupport(n),this._worker=e.pipe(new i(n)),e.lock()}catch(e){this._worker=new s("error"),this._worker.error(e)}}f.prototype={accumulate:function(e){return l(this,e)},on:function(e,t){var r=this;return"data"===e?this._worker.on(e,function(e){t.call(r,e.data,e.meta)}):this._worker.on(e,function(){h.delay(t,arguments,r)}),this},resume:function(){return h.delay(this._worker.resume,[],this._worker),this},pause:function(){return this._worker.pause(),this},toNodejsStream:function(e){if(h.checkSupport("nodestream"),"nodebuffer"!==this._outputType)throw new Error(this._outputType+" is not supported by this method");return new o(this,{objectMode:"nodebuffer"!==this._outputType},e)}},t.exports=f},{"../base64":1,"../external":6,"../nodejs/NodejsStreamOutputAdapter":13,"../support":30,"../utils":32,"./ConvertWorker":24,"./GenericWorker":28}],30:[function(e,t,r){"use strict";if(r.base64=!0,r.array=!0,r.string=!0,r.arraybuffer="undefined"!=typeof ArrayBuffer&&"undefined"!=typeof Uint8Array,r.nodebuffer="undefined"!=typeof Buffer,r.uint8array="undefined"!=typeof Uint8Array,"undefined"==typeof ArrayBuffer)r.blob=!1;else{var n=new ArrayBuffer(0);try{r.blob=0===new Blob([n],{type:"application/zip"}).size}catch(e){try{var i=new(self.BlobBuilder||self.WebKitBlobBuilder||self.MozBlobBuilder||self.MSBlobBuilder);i.append(n),r.blob=0===i.getBlob("application/zip").size}catch(e){r.blob=!1}}}try{r.nodestream=!!e("readable-stream").Readable}catch(e){r.nodestream=!1}},{"readable-stream":16}],31:[function(e,t,s){"use strict";for(var o=e("./utils"),h=e("./support"),r=e("./nodejsUtils"),n=e("./stream/GenericWorker"),u=new Array(256),i=0;i<256;i++)u[i]=252<=i?6:248<=i?5:240<=i?4:224<=i?3:192<=i?2:1;u[254]=u[254]=1;function a(){n.call(this,"utf-8 decode"),this.leftOver=null}function l(){n.call(this,"utf-8 encode")}s.utf8encode=function(e){return h.nodebuffer?r.newBufferFrom(e,"utf-8"):function(e){var t,r,n,i,s,a=e.length,o=0;for(i=0;i<a;i++)55296==(64512&(r=e.charCodeAt(i)))&&i+1<a&&56320==(64512&(n=e.charCodeAt(i+1)))&&(r=65536+(r-55296<<10)+(n-56320),i++),o+=r<128?1:r<2048?2:r<65536?3:4;for(t=h.uint8array?new Uint8Array(o):new Array(o),i=s=0;s<o;i++)55296==(64512&(r=e.charCodeAt(i)))&&i+1<a&&56320==(64512&(n=e.charCodeAt(i+1)))&&(r=65536+(r-55296<<10)+(n-56320),i++),r<128?t[s++]=r:(r<2048?t[s++]=192|r>>>6:(r<65536?t[s++]=224|r>>>12:(t[s++]=240|r>>>18,t[s++]=128|r>>>12&63),t[s++]=128|r>>>6&63),t[s++]=128|63&r);return t}(e)},s.utf8decode=function(e){return h.nodebuffer?o.transformTo("nodebuffer",e).toString("utf-8"):function(e){var t,r,n,i,s=e.length,a=new Array(2*s);for(t=r=0;t<s;)if((n=e[t++])<128)a[r++]=n;else if(4<(i=u[n]))a[r++]=65533,t+=i-1;else{for(n&=2===i?31:3===i?15:7;1<i&&t<s;)n=n<<6|63&e[t++],i--;1<i?a[r++]=65533:n<65536?a[r++]=n:(n-=65536,a[r++]=55296|n>>10&1023,a[r++]=56320|1023&n)}return a.length!==r&&(a.subarray?a=a.subarray(0,r):a.length=r),o.applyFromCharCode(a)}(e=o.transformTo(h.uint8array?"uint8array":"array",e))},o.inherits(a,n),a.prototype.processChunk=function(e){var t=o.transformTo(h.uint8array?"uint8array":"array",e.data);if(this.leftOver&&this.leftOver.length){if(h.uint8array){var r=t;(t=new Uint8Array(r.length+this.leftOver.length)).set(this.leftOver,0),t.set(r,this.leftOver.length)}else t=this.leftOver.concat(t);this.leftOver=null}var n=function(e,t){var r;for((t=t||e.length)>e.length&&(t=e.length),r=t-1;0<=r&&128==(192&e[r]);)r--;return r<0?t:0===r?t:r+u[e[r]]>t?r:t}(t),i=t;n!==t.length&&(h.uint8array?(i=t.subarray(0,n),this.leftOver=t.subarray(n,t.length)):(i=t.slice(0,n),this.leftOver=t.slice(n,t.length))),this.push({data:s.utf8decode(i),meta:e.meta})},a.prototype.flush=function(){this.leftOver&&this.leftOver.length&&(this.push({data:s.utf8decode(this.leftOver),meta:{}}),this.leftOver=null)},s.Utf8DecodeWorker=a,o.inherits(l,n),l.prototype.processChunk=function(e){this.push({data:s.utf8encode(e.data),meta:e.meta})},s.Utf8EncodeWorker=l},{"./nodejsUtils":14,"./stream/GenericWorker":28,"./support":30,"./utils":32}],32:[function(e,t,a){"use strict";var o=e("./support"),h=e("./base64"),r=e("./nodejsUtils"),u=e("./external");function n(e){return e}function l(e,t){for(var r=0;r<e.length;++r)t[r]=255&e.charCodeAt(r);return t}e("setimmediate"),a.newBlob=function(t,r){a.checkSupport("blob");try{return new Blob([t],{type:r})}catch(e){try{var n=new(self.BlobBuilder||self.WebKitBlobBuilder||self.MozBlobBuilder||self.MSBlobBuilder);return n.append(t),n.getBlob(r)}catch(e){throw new Error("Bug : can't construct the Blob.")}}};var i={stringifyByChunk:function(e,t,r){var n=[],i=0,s=e.length;if(s<=r)return String.fromCharCode.apply(null,e);for(;i<s;)"array"===t||"nodebuffer"===t?n.push(String.fromCharCode.apply(null,e.slice(i,Math.min(i+r,s)))):n.push(String.fromCharCode.apply(null,e.subarray(i,Math.min(i+r,s)))),i+=r;return n.join("")},stringifyByChar:function(e){for(var t="",r=0;r<e.length;r++)t+=String.fromCharCode(e[r]);return t},applyCanBeUsed:{uint8array:function(){try{return o.uint8array&&1===String.fromCharCode.apply(null,new Uint8Array(1)).length}catch(e){return!1}}(),nodebuffer:function(){try{return o.nodebuffer&&1===String.fromCharCode.apply(null,r.allocBuffer(1)).length}catch(e){return!1}}()}};function s(e){var t=65536,r=a.getTypeOf(e),n=!0;if("uint8array"===r?n=i.applyCanBeUsed.uint8array:"nodebuffer"===r&&(n=i.applyCanBeUsed.nodebuffer),n)for(;1<t;)try{return i.stringifyByChunk(e,r,t)}catch(e){t=Math.floor(t/2)}return i.stringifyByChar(e)}function f(e,t){for(var r=0;r<e.length;r++)t[r]=e[r];return t}a.applyFromCharCode=s;var c={};c.string={string:n,array:function(e){return l(e,new Array(e.length))},arraybuffer:function(e){return c.string.uint8array(e).buffer},uint8array:function(e){return l(e,new Uint8Array(e.length))},nodebuffer:function(e){return l(e,r.allocBuffer(e.length))}},c.array={string:s,array:n,arraybuffer:function(e){return new Uint8Array(e).buffer},uint8array:function(e){return new Uint8Array(e)},nodebuffer:function(e){return r.newBufferFrom(e)}},c.arraybuffer={string:function(e){return s(new Uint8Array(e))},array:function(e){return f(new Uint8Array(e),new Array(e.byteLength))},arraybuffer:n,uint8array:function(e){return new Uint8Array(e)},nodebuffer:function(e){return r.newBufferFrom(new Uint8Array(e))}},c.uint8array={string:s,array:function(e){return f(e,new Array(e.length))},arraybuffer:function(e){return e.buffer},uint8array:n,nodebuffer:function(e){return r.newBufferFrom(e)}},c.nodebuffer={string:s,array:function(e){return f(e,new Array(e.length))},arraybuffer:function(e){return c.nodebuffer.uint8array(e).buffer},uint8array:function(e){return f(e,new Uint8Array(e.length))},nodebuffer:n},a.transformTo=function(e,t){if(t=t||"",!e)return t;a.checkSupport(e);var r=a.getTypeOf(t);return c[r][e](t)},a.resolve=function(e){for(var t=e.split("/"),r=[],n=0;n<t.length;n++){var i=t[n];"."===i||""===i&&0!==n&&n!==t.length-1||(".."===i?r.pop():r.push(i))}return r.join("/")},a.getTypeOf=function(e){return"string"==typeof e?"string":"[object Array]"===Object.prototype.toString.call(e)?"array":o.nodebuffer&&r.isBuffer(e)?"nodebuffer":o.uint8array&&e instanceof Uint8Array?"uint8array":o.arraybuffer&&e instanceof ArrayBuffer?"arraybuffer":void 0},a.checkSupport=function(e){if(!o[e.toLowerCase()])throw new Error(e+" is not supported by this platform")},a.MAX_VALUE_16BITS=65535,a.MAX_VALUE_32BITS=-1,a.pretty=function(e){var t,r,n="";for(r=0;r<(e||"").length;r++)n+="\\x"+((t=e.charCodeAt(r))<16?"0":"")+t.toString(16).toUpperCase();return n},a.delay=function(e,t,r){setImmediate(function(){e.apply(r||null,t||[])})},a.inherits=function(e,t){function r(){}r.prototype=t.prototype,e.prototype=new r},a.extend=function(){var e,t,r={};for(e=0;e<arguments.length;e++)for(t in arguments[e])Object.prototype.hasOwnProperty.call(arguments[e],t)&&void 0===r[t]&&(r[t]=arguments[e][t]);return r},a.prepareContent=function(r,e,n,i,s){return u.Promise.resolve(e).then(function(n){return o.blob&&(n instanceof Blob||-1!==["[object File]","[object Blob]"].indexOf(Object.prototype.toString.call(n)))&&"undefined"!=typeof FileReader?new u.Promise(function(t,r){var e=new FileReader;e.onload=function(e){t(e.target.result)},e.onerror=function(e){r(e.target.error)},e.readAsArrayBuffer(n)}):n}).then(function(e){var t=a.getTypeOf(e);return t?("arraybuffer"===t?e=a.transformTo("uint8array",e):"string"===t&&(s?e=h.decode(e):n&&!0!==i&&(e=function(e){return l(e,o.uint8array?new Uint8Array(e.length):new Array(e.length))}(e))),e):u.Promise.reject(new Error("Can't read the data of '"+r+"'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"))})}},{"./base64":1,"./external":6,"./nodejsUtils":14,"./support":30,setimmediate:54}],33:[function(e,t,r){"use strict";var n=e("./reader/readerFor"),i=e("./utils"),s=e("./signature"),a=e("./zipEntry"),o=e("./support");function h(e){this.files=[],this.loadOptions=e}h.prototype={checkSignature:function(e){if(!this.reader.readAndCheckSignature(e)){this.reader.index-=4;var t=this.reader.readString(4);throw new Error("Corrupted zip or bug: unexpected signature ("+i.pretty(t)+", expected "+i.pretty(e)+")")}},isSignature:function(e,t){var r=this.reader.index;this.reader.setIndex(e);var n=this.reader.readString(4)===t;return this.reader.setIndex(r),n},readBlockEndOfCentral:function(){this.diskNumber=this.reader.readInt(2),this.diskWithCentralDirStart=this.reader.readInt(2),this.centralDirRecordsOnThisDisk=this.reader.readInt(2),this.centralDirRecords=this.reader.readInt(2),this.centralDirSize=this.reader.readInt(4),this.centralDirOffset=this.reader.readInt(4),this.zipCommentLength=this.reader.readInt(2);var e=this.reader.readData(this.zipCommentLength),t=o.uint8array?"uint8array":"array",r=i.transformTo(t,e);this.zipComment=this.loadOptions.decodeFileName(r)},readBlockZip64EndOfCentral:function(){this.zip64EndOfCentralSize=this.reader.readInt(8),this.reader.skip(4),this.diskNumber=this.reader.readInt(4),this.diskWithCentralDirStart=this.reader.readInt(4),this.centralDirRecordsOnThisDisk=this.reader.readInt(8),this.centralDirRecords=this.reader.readInt(8),this.centralDirSize=this.reader.readInt(8),this.centralDirOffset=this.reader.readInt(8),this.zip64ExtensibleData={};for(var e,t,r,n=this.zip64EndOfCentralSize-44;0<n;)e=this.reader.readInt(2),t=this.reader.readInt(4),r=this.reader.readData(t),this.zip64ExtensibleData[e]={id:e,length:t,value:r}},readBlockZip64EndOfCentralLocator:function(){if(this.diskWithZip64CentralDirStart=this.reader.readInt(4),this.relativeOffsetEndOfZip64CentralDir=this.reader.readInt(8),this.disksCount=this.reader.readInt(4),1<this.disksCount)throw new Error("Multi-volumes zip are not supported")},readLocalFiles:function(){var e,t;for(e=0;e<this.files.length;e++)t=this.files[e],this.reader.setIndex(t.localHeaderOffset),this.checkSignature(s.LOCAL_FILE_HEADER),t.readLocalPart(this.reader),t.handleUTF8(),t.processAttributes()},readCentralDir:function(){var e;for(this.reader.setIndex(this.centralDirOffset);this.reader.readAndCheckSignature(s.CENTRAL_FILE_HEADER);)(e=new a({zip64:this.zip64},this.loadOptions)).readCentralPart(this.reader),this.files.push(e);if(this.centralDirRecords!==this.files.length&&0!==this.centralDirRecords&&0===this.files.length)throw new Error("Corrupted zip or bug: expected "+this.centralDirRecords+" records in central dir, got "+this.files.length)},readEndOfCentral:function(){var e=this.reader.lastIndexOfSignature(s.CENTRAL_DIRECTORY_END);if(e<0)throw!this.isSignature(0,s.LOCAL_FILE_HEADER)?new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html"):new Error("Corrupted zip: can't find end of central directory");this.reader.setIndex(e);var t=e;if(this.checkSignature(s.CENTRAL_DIRECTORY_END),this.readBlockEndOfCentral(),this.diskNumber===i.MAX_VALUE_16BITS||this.diskWithCentralDirStart===i.MAX_VALUE_16BITS||this.centralDirRecordsOnThisDisk===i.MAX_VALUE_16BITS||this.centralDirRecords===i.MAX_VALUE_16BITS||this.centralDirSize===i.MAX_VALUE_32BITS||this.centralDirOffset===i.MAX_VALUE_32BITS){if(this.zip64=!0,(e=this.reader.lastIndexOfSignature(s.ZIP64_CENTRAL_DIRECTORY_LOCATOR))<0)throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");if(this.reader.setIndex(e),this.checkSignature(s.ZIP64_CENTRAL_DIRECTORY_LOCATOR),this.readBlockZip64EndOfCentralLocator(),!this.isSignature(this.relativeOffsetEndOfZip64CentralDir,s.ZIP64_CENTRAL_DIRECTORY_END)&&(this.relativeOffsetEndOfZip64CentralDir=this.reader.lastIndexOfSignature(s.ZIP64_CENTRAL_DIRECTORY_END),this.relativeOffsetEndOfZip64CentralDir<0))throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir),this.checkSignature(s.ZIP64_CENTRAL_DIRECTORY_END),this.readBlockZip64EndOfCentral()}var r=this.centralDirOffset+this.centralDirSize;this.zip64&&(r+=20,r+=12+this.zip64EndOfCentralSize);var n=t-r;if(0<n)this.isSignature(t,s.CENTRAL_FILE_HEADER)||(this.reader.zero=n);else if(n<0)throw new Error("Corrupted zip: missing "+Math.abs(n)+" bytes.")},prepareReader:function(e){this.reader=n(e)},load:function(e){this.prepareReader(e),this.readEndOfCentral(),this.readCentralDir(),this.readLocalFiles()}},t.exports=h},{"./reader/readerFor":22,"./signature":23,"./support":30,"./utils":32,"./zipEntry":34}],34:[function(e,t,r){"use strict";var n=e("./reader/readerFor"),s=e("./utils"),i=e("./compressedObject"),a=e("./crc32"),o=e("./utf8"),h=e("./compressions"),u=e("./support");function l(e,t){this.options=e,this.loadOptions=t}l.prototype={isEncrypted:function(){return 1==(1&this.bitFlag)},useUTF8:function(){return 2048==(2048&this.bitFlag)},readLocalPart:function(e){var t,r;if(e.skip(22),this.fileNameLength=e.readInt(2),r=e.readInt(2),this.fileName=e.readData(this.fileNameLength),e.skip(r),-1===this.compressedSize||-1===this.uncompressedSize)throw new Error("Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)");if(null===(t=function(e){for(var t in h)if(Object.prototype.hasOwnProperty.call(h,t)&&h[t].magic===e)return h[t];return null}(this.compressionMethod)))throw new Error("Corrupted zip : compression "+s.pretty(this.compressionMethod)+" unknown (inner file : "+s.transformTo("string",this.fileName)+")");this.decompressed=new i(this.compressedSize,this.uncompressedSize,this.crc32,t,e.readData(this.compressedSize))},readCentralPart:function(e){this.versionMadeBy=e.readInt(2),e.skip(2),this.bitFlag=e.readInt(2),this.compressionMethod=e.readString(2),this.date=e.readDate(),this.crc32=e.readInt(4),this.compressedSize=e.readInt(4),this.uncompressedSize=e.readInt(4);var t=e.readInt(2);if(this.extraFieldsLength=e.readInt(2),this.fileCommentLength=e.readInt(2),this.diskNumberStart=e.readInt(2),this.internalFileAttributes=e.readInt(2),this.externalFileAttributes=e.readInt(4),this.localHeaderOffset=e.readInt(4),this.isEncrypted())throw new Error("Encrypted zip are not supported");e.skip(t),this.readExtraFields(e),this.parseZIP64ExtraField(e),this.fileComment=e.readData(this.fileCommentLength)},processAttributes:function(){this.unixPermissions=null,this.dosPermissions=null;var e=this.versionMadeBy>>8;this.dir=!!(16&this.externalFileAttributes),0==e&&(this.dosPermissions=63&this.externalFileAttributes),3==e&&(this.unixPermissions=this.externalFileAttributes>>16&65535),this.dir||"/"!==this.fileNameStr.slice(-1)||(this.dir=!0)},parseZIP64ExtraField:function(){if(this.extraFields[1]){var e=n(this.extraFields[1].value);this.uncompressedSize===s.MAX_VALUE_32BITS&&(this.uncompressedSize=e.readInt(8)),this.compressedSize===s.MAX_VALUE_32BITS&&(this.compressedSize=e.readInt(8)),this.localHeaderOffset===s.MAX_VALUE_32BITS&&(this.localHeaderOffset=e.readInt(8)),this.diskNumberStart===s.MAX_VALUE_32BITS&&(this.diskNumberStart=e.readInt(4))}},readExtraFields:function(e){var t,r,n,i=e.index+this.extraFieldsLength;for(this.extraFields||(this.extraFields={});e.index+4<i;)t=e.readInt(2),r=e.readInt(2),n=e.readData(r),this.extraFields[t]={id:t,length:r,value:n};e.setIndex(i)},handleUTF8:function(){var e=u.uint8array?"uint8array":"array";if(this.useUTF8())this.fileNameStr=o.utf8decode(this.fileName),this.fileCommentStr=o.utf8decode(this.fileComment);else{var t=this.findExtraFieldUnicodePath();if(null!==t)this.fileNameStr=t;else{var r=s.transformTo(e,this.fileName);this.fileNameStr=this.loadOptions.decodeFileName(r)}var n=this.findExtraFieldUnicodeComment();if(null!==n)this.fileCommentStr=n;else{var i=s.transformTo(e,this.fileComment);this.fileCommentStr=this.loadOptions.decodeFileName(i)}}},findExtraFieldUnicodePath:function(){var e=this.extraFields[28789];if(e){var t=n(e.value);return 1!==t.readInt(1)?null:a(this.fileName)!==t.readInt(4)?null:o.utf8decode(t.readData(e.length-5))}return null},findExtraFieldUnicodeComment:function(){var e=this.extraFields[25461];if(e){var t=n(e.value);return 1!==t.readInt(1)?null:a(this.fileComment)!==t.readInt(4)?null:o.utf8decode(t.readData(e.length-5))}return null}},t.exports=l},{"./compressedObject":2,"./compressions":3,"./crc32":4,"./reader/readerFor":22,"./support":30,"./utf8":31,"./utils":32}],35:[function(e,t,r){"use strict";function n(e,t,r){this.name=e,this.dir=r.dir,this.date=r.date,this.comment=r.comment,this.unixPermissions=r.unixPermissions,this.dosPermissions=r.dosPermissions,this._data=t,this._dataBinary=r.binary,this.options={compression:r.compression,compressionOptions:r.compressionOptions}}var s=e("./stream/StreamHelper"),i=e("./stream/DataWorker"),a=e("./utf8"),o=e("./compressedObject"),h=e("./stream/GenericWorker");n.prototype={internalStream:function(e){var t=null,r="string";try{if(!e)throw new Error("No output type specified.");var n="string"===(r=e.toLowerCase())||"text"===r;"binarystring"!==r&&"text"!==r||(r="string"),t=this._decompressWorker();var i=!this._dataBinary;i&&!n&&(t=t.pipe(new a.Utf8EncodeWorker)),!i&&n&&(t=t.pipe(new a.Utf8DecodeWorker))}catch(e){(t=new h("error")).error(e)}return new s(t,r,"")},async:function(e,t){return this.internalStream(e).accumulate(t)},nodeStream:function(e,t){return this.internalStream(e||"nodebuffer").toNodejsStream(t)},_compressWorker:function(e,t){if(this._data instanceof o&&this._data.compression.magic===e.magic)return this._data.getCompressedWorker();var r=this._decompressWorker();return this._dataBinary||(r=r.pipe(new a.Utf8EncodeWorker)),o.createWorkerFrom(r,e,t)},_decompressWorker:function(){return this._data instanceof o?this._data.getContentWorker():this._data instanceof h?this._data:new i(this._data)}};for(var u=["asText","asBinary","asNodeBuffer","asUint8Array","asArrayBuffer"],l=function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},f=0;f<u.length;f++)n.prototype[u[f]]=l;t.exports=n},{"./compressedObject":2,"./stream/DataWorker":27,"./stream/GenericWorker":28,"./stream/StreamHelper":29,"./utf8":31}],36:[function(e,l,t){(function(t){"use strict";var r,n,e=t.MutationObserver||t.WebKitMutationObserver;if(e){var i=0,s=new e(u),a=t.document.createTextNode("");s.observe(a,{characterData:!0}),r=function(){a.data=i=++i%2}}else if(t.setImmediate||void 0===t.MessageChannel)r="document"in t&&"onreadystatechange"in t.document.createElement("script")?function(){var e=t.document.createElement("script");e.onreadystatechange=function(){u(),e.onreadystatechange=null,e.parentNode.removeChild(e),e=null},t.document.documentElement.appendChild(e)}:function(){setTimeout(u,0)};else{var o=new t.MessageChannel;o.port1.onmessage=u,r=function(){o.port2.postMessage(0)}}var h=[];function u(){var e,t;n=!0;for(var r=h.length;r;){for(t=h,h=[],e=-1;++e<r;)t[e]();r=h.length}n=!1}l.exports=function(e){1!==h.push(e)||n||r()}}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}],37:[function(e,t,r){"use strict";var i=e("immediate");function u(){}var l={},s=["REJECTED"],a=["FULFILLED"],n=["PENDING"];function o(e){if("function"!=typeof e)throw new TypeError("resolver must be a function");this.state=n,this.queue=[],this.outcome=void 0,e!==u&&d(this,e)}function h(e,t,r){this.promise=e,"function"==typeof t&&(this.onFulfilled=t,this.callFulfilled=this.otherCallFulfilled),"function"==typeof r&&(this.onRejected=r,this.callRejected=this.otherCallRejected)}function f(t,r,n){i(function(){var e;try{e=r(n)}catch(e){return l.reject(t,e)}e===t?l.reject(t,new TypeError("Cannot resolve promise with itself")):l.resolve(t,e)})}function c(e){var t=e&&e.then;if(e&&("object"==typeof e||"function"==typeof e)&&"function"==typeof t)return function(){t.apply(e,arguments)}}function d(t,e){var r=!1;function n(e){r||(r=!0,l.reject(t,e))}function i(e){r||(r=!0,l.resolve(t,e))}var s=p(function(){e(i,n)});"error"===s.status&&n(s.value)}function p(e,t){var r={};try{r.value=e(t),r.status="success"}catch(e){r.status="error",r.value=e}return r}(t.exports=o).prototype.finally=function(t){if("function"!=typeof t)return this;var r=this.constructor;return this.then(function(e){return r.resolve(t()).then(function(){return e})},function(e){return r.resolve(t()).then(function(){throw e})})},o.prototype.catch=function(e){return this.then(null,e)},o.prototype.then=function(e,t){if("function"!=typeof e&&this.state===a||"function"!=typeof t&&this.state===s)return this;var r=new this.constructor(u);this.state!==n?f(r,this.state===a?e:t,this.outcome):this.queue.push(new h(r,e,t));return r},h.prototype.callFulfilled=function(e){l.resolve(this.promise,e)},h.prototype.otherCallFulfilled=function(e){f(this.promise,this.onFulfilled,e)},h.prototype.callRejected=function(e){l.reject(this.promise,e)},h.prototype.otherCallRejected=function(e){f(this.promise,this.onRejected,e)},l.resolve=function(e,t){var r=p(c,t);if("error"===r.status)return l.reject(e,r.value);var n=r.value;if(n)d(e,n);else{e.state=a,e.outcome=t;for(var i=-1,s=e.queue.length;++i<s;)e.queue[i].callFulfilled(t)}return e},l.reject=function(e,t){e.state=s,e.outcome=t;for(var r=-1,n=e.queue.length;++r<n;)e.queue[r].callRejected(t);return e},o.resolve=function(e){if(e instanceof this)return e;return l.resolve(new this(u),e)},o.reject=function(e){var t=new this(u);return l.reject(t,e)},o.all=function(e){var r=this;if("[object Array]"!==Object.prototype.toString.call(e))return this.reject(new TypeError("must be an array"));var n=e.length,i=!1;if(!n)return this.resolve([]);var s=new Array(n),a=0,t=-1,o=new this(u);for(;++t<n;)h(e[t],t);return o;function h(e,t){r.resolve(e).then(function(e){s[t]=e,++a!==n||i||(i=!0,l.resolve(o,s))},function(e){i||(i=!0,l.reject(o,e))})}},o.race=function(e){var t=this;if("[object Array]"!==Object.prototype.toString.call(e))return this.reject(new TypeError("must be an array"));var r=e.length,n=!1;if(!r)return this.resolve([]);var i=-1,s=new this(u);for(;++i<r;)a=e[i],t.resolve(a).then(function(e){n||(n=!0,l.resolve(s,e))},function(e){n||(n=!0,l.reject(s,e))});var a;return s}},{immediate:36}],38:[function(e,t,r){"use strict";var n={};(0,e("./lib/utils/common").assign)(n,e("./lib/deflate"),e("./lib/inflate"),e("./lib/zlib/constants")),t.exports=n},{"./lib/deflate":39,"./lib/inflate":40,"./lib/utils/common":41,"./lib/zlib/constants":44}],39:[function(e,t,r){"use strict";var a=e("./zlib/deflate"),o=e("./utils/common"),h=e("./utils/strings"),i=e("./zlib/messages"),s=e("./zlib/zstream"),u=Object.prototype.toString,l=0,f=-1,c=0,d=8;function p(e){if(!(this instanceof p))return new p(e);this.options=o.assign({level:f,method:d,chunkSize:16384,windowBits:15,memLevel:8,strategy:c,to:""},e||{});var t=this.options;t.raw&&0<t.windowBits?t.windowBits=-t.windowBits:t.gzip&&0<t.windowBits&&t.windowBits<16&&(t.windowBits+=16),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new s,this.strm.avail_out=0;var r=a.deflateInit2(this.strm,t.level,t.method,t.windowBits,t.memLevel,t.strategy);if(r!==l)throw new Error(i[r]);if(t.header&&a.deflateSetHeader(this.strm,t.header),t.dictionary){var n;if(n="string"==typeof t.dictionary?h.string2buf(t.dictionary):"[object ArrayBuffer]"===u.call(t.dictionary)?new Uint8Array(t.dictionary):t.dictionary,(r=a.deflateSetDictionary(this.strm,n))!==l)throw new Error(i[r]);this._dict_set=!0}}function n(e,t){var r=new p(t);if(r.push(e,!0),r.err)throw r.msg||i[r.err];return r.result}p.prototype.push=function(e,t){var r,n,i=this.strm,s=this.options.chunkSize;if(this.ended)return!1;n=t===~~t?t:!0===t?4:0,"string"==typeof e?i.input=h.string2buf(e):"[object ArrayBuffer]"===u.call(e)?i.input=new Uint8Array(e):i.input=e,i.next_in=0,i.avail_in=i.input.length;do{if(0===i.avail_out&&(i.output=new o.Buf8(s),i.next_out=0,i.avail_out=s),1!==(r=a.deflate(i,n))&&r!==l)return this.onEnd(r),!(this.ended=!0);0!==i.avail_out&&(0!==i.avail_in||4!==n&&2!==n)||("string"===this.options.to?this.onData(h.buf2binstring(o.shrinkBuf(i.output,i.next_out))):this.onData(o.shrinkBuf(i.output,i.next_out)))}while((0<i.avail_in||0===i.avail_out)&&1!==r);return 4===n?(r=a.deflateEnd(this.strm),this.onEnd(r),this.ended=!0,r===l):2!==n||(this.onEnd(l),!(i.avail_out=0))},p.prototype.onData=function(e){this.chunks.push(e)},p.prototype.onEnd=function(e){e===l&&("string"===this.options.to?this.result=this.chunks.join(""):this.result=o.flattenChunks(this.chunks)),this.chunks=[],this.err=e,this.msg=this.strm.msg},r.Deflate=p,r.deflate=n,r.deflateRaw=function(e,t){return(t=t||{}).raw=!0,n(e,t)},r.gzip=function(e,t){return(t=t||{}).gzip=!0,n(e,t)}},{"./utils/common":41,"./utils/strings":42,"./zlib/deflate":46,"./zlib/messages":51,"./zlib/zstream":53}],40:[function(e,t,r){"use strict";var c=e("./zlib/inflate"),d=e("./utils/common"),p=e("./utils/strings"),m=e("./zlib/constants"),n=e("./zlib/messages"),i=e("./zlib/zstream"),s=e("./zlib/gzheader"),_=Object.prototype.toString;function a(e){if(!(this instanceof a))return new a(e);this.options=d.assign({chunkSize:16384,windowBits:0,to:""},e||{});var t=this.options;t.raw&&0<=t.windowBits&&t.windowBits<16&&(t.windowBits=-t.windowBits,0===t.windowBits&&(t.windowBits=-15)),!(0<=t.windowBits&&t.windowBits<16)||e&&e.windowBits||(t.windowBits+=32),15<t.windowBits&&t.windowBits<48&&0==(15&t.windowBits)&&(t.windowBits|=15),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new i,this.strm.avail_out=0;var r=c.inflateInit2(this.strm,t.windowBits);if(r!==m.Z_OK)throw new Error(n[r]);this.header=new s,c.inflateGetHeader(this.strm,this.header)}function o(e,t){var r=new a(t);if(r.push(e,!0),r.err)throw r.msg||n[r.err];return r.result}a.prototype.push=function(e,t){var r,n,i,s,a,o,h=this.strm,u=this.options.chunkSize,l=this.options.dictionary,f=!1;if(this.ended)return!1;n=t===~~t?t:!0===t?m.Z_FINISH:m.Z_NO_FLUSH,"string"==typeof e?h.input=p.binstring2buf(e):"[object ArrayBuffer]"===_.call(e)?h.input=new Uint8Array(e):h.input=e,h.next_in=0,h.avail_in=h.input.length;do{if(0===h.avail_out&&(h.output=new d.Buf8(u),h.next_out=0,h.avail_out=u),(r=c.inflate(h,m.Z_NO_FLUSH))===m.Z_NEED_DICT&&l&&(o="string"==typeof l?p.string2buf(l):"[object ArrayBuffer]"===_.call(l)?new Uint8Array(l):l,r=c.inflateSetDictionary(this.strm,o)),r===m.Z_BUF_ERROR&&!0===f&&(r=m.Z_OK,f=!1),r!==m.Z_STREAM_END&&r!==m.Z_OK)return this.onEnd(r),!(this.ended=!0);h.next_out&&(0!==h.avail_out&&r!==m.Z_STREAM_END&&(0!==h.avail_in||n!==m.Z_FINISH&&n!==m.Z_SYNC_FLUSH)||("string"===this.options.to?(i=p.utf8border(h.output,h.next_out),s=h.next_out-i,a=p.buf2string(h.output,i),h.next_out=s,h.avail_out=u-s,s&&d.arraySet(h.output,h.output,i,s,0),this.onData(a)):this.onData(d.shrinkBuf(h.output,h.next_out)))),0===h.avail_in&&0===h.avail_out&&(f=!0)}while((0<h.avail_in||0===h.avail_out)&&r!==m.Z_STREAM_END);return r===m.Z_STREAM_END&&(n=m.Z_FINISH),n===m.Z_FINISH?(r=c.inflateEnd(this.strm),this.onEnd(r),this.ended=!0,r===m.Z_OK):n!==m.Z_SYNC_FLUSH||(this.onEnd(m.Z_OK),!(h.avail_out=0))},a.prototype.onData=function(e){this.chunks.push(e)},a.prototype.onEnd=function(e){e===m.Z_OK&&("string"===this.options.to?this.result=this.chunks.join(""):this.result=d.flattenChunks(this.chunks)),this.chunks=[],this.err=e,this.msg=this.strm.msg},r.Inflate=a,r.inflate=o,r.inflateRaw=function(e,t){return(t=t||{}).raw=!0,o(e,t)},r.ungzip=o},{"./utils/common":41,"./utils/strings":42,"./zlib/constants":44,"./zlib/gzheader":47,"./zlib/inflate":49,"./zlib/messages":51,"./zlib/zstream":53}],41:[function(e,t,r){"use strict";var n="undefined"!=typeof Uint8Array&&"undefined"!=typeof Uint16Array&&"undefined"!=typeof Int32Array;r.assign=function(e){for(var t=Array.prototype.slice.call(arguments,1);t.length;){var r=t.shift();if(r){if("object"!=typeof r)throw new TypeError(r+"must be non-object");for(var n in r)r.hasOwnProperty(n)&&(e[n]=r[n])}}return e},r.shrinkBuf=function(e,t){return e.length===t?e:e.subarray?e.subarray(0,t):(e.length=t,e)};var i={arraySet:function(e,t,r,n,i){if(t.subarray&&e.subarray)e.set(t.subarray(r,r+n),i);else for(var s=0;s<n;s++)e[i+s]=t[r+s]},flattenChunks:function(e){var t,r,n,i,s,a;for(t=n=0,r=e.length;t<r;t++)n+=e[t].length;for(a=new Uint8Array(n),t=i=0,r=e.length;t<r;t++)s=e[t],a.set(s,i),i+=s.length;return a}},s={arraySet:function(e,t,r,n,i){for(var s=0;s<n;s++)e[i+s]=t[r+s]},flattenChunks:function(e){return[].concat.apply([],e)}};r.setTyped=function(e){e?(r.Buf8=Uint8Array,r.Buf16=Uint16Array,r.Buf32=Int32Array,r.assign(r,i)):(r.Buf8=Array,r.Buf16=Array,r.Buf32=Array,r.assign(r,s))},r.setTyped(n)},{}],42:[function(e,t,r){"use strict";var h=e("./common"),i=!0,s=!0;try{String.fromCharCode.apply(null,[0])}catch(e){i=!1}try{String.fromCharCode.apply(null,new Uint8Array(1))}catch(e){s=!1}for(var u=new h.Buf8(256),n=0;n<256;n++)u[n]=252<=n?6:248<=n?5:240<=n?4:224<=n?3:192<=n?2:1;function l(e,t){if(t<65537&&(e.subarray&&s||!e.subarray&&i))return String.fromCharCode.apply(null,h.shrinkBuf(e,t));for(var r="",n=0;n<t;n++)r+=String.fromCharCode(e[n]);return r}u[254]=u[254]=1,r.string2buf=function(e){var t,r,n,i,s,a=e.length,o=0;for(i=0;i<a;i++)55296==(64512&(r=e.charCodeAt(i)))&&i+1<a&&56320==(64512&(n=e.charCodeAt(i+1)))&&(r=65536+(r-55296<<10)+(n-56320),i++),o+=r<128?1:r<2048?2:r<65536?3:4;for(t=new h.Buf8(o),i=s=0;s<o;i++)55296==(64512&(r=e.charCodeAt(i)))&&i+1<a&&56320==(64512&(n=e.charCodeAt(i+1)))&&(r=65536+(r-55296<<10)+(n-56320),i++),r<128?t[s++]=r:(r<2048?t[s++]=192|r>>>6:(r<65536?t[s++]=224|r>>>12:(t[s++]=240|r>>>18,t[s++]=128|r>>>12&63),t[s++]=128|r>>>6&63),t[s++]=128|63&r);return t},r.buf2binstring=function(e){return l(e,e.length)},r.binstring2buf=function(e){for(var t=new h.Buf8(e.length),r=0,n=t.length;r<n;r++)t[r]=e.charCodeAt(r);return t},r.buf2string=function(e,t){var r,n,i,s,a=t||e.length,o=new Array(2*a);for(r=n=0;r<a;)if((i=e[r++])<128)o[n++]=i;else if(4<(s=u[i]))o[n++]=65533,r+=s-1;else{for(i&=2===s?31:3===s?15:7;1<s&&r<a;)i=i<<6|63&e[r++],s--;1<s?o[n++]=65533:i<65536?o[n++]=i:(i-=65536,o[n++]=55296|i>>10&1023,o[n++]=56320|1023&i)}return l(o,n)},r.utf8border=function(e,t){var r;for((t=t||e.length)>e.length&&(t=e.length),r=t-1;0<=r&&128==(192&e[r]);)r--;return r<0?t:0===r?t:r+u[e[r]]>t?r:t}},{"./common":41}],43:[function(e,t,r){"use strict";t.exports=function(e,t,r,n){for(var i=65535&e|0,s=e>>>16&65535|0,a=0;0!==r;){for(r-=a=2e3<r?2e3:r;s=s+(i=i+t[n++]|0)|0,--a;);i%=65521,s%=65521}return i|s<<16|0}},{}],44:[function(e,t,r){"use strict";t.exports={Z_NO_FLUSH:0,Z_PARTIAL_FLUSH:1,Z_SYNC_FLUSH:2,Z_FULL_FLUSH:3,Z_FINISH:4,Z_BLOCK:5,Z_TREES:6,Z_OK:0,Z_STREAM_END:1,Z_NEED_DICT:2,Z_ERRNO:-1,Z_STREAM_ERROR:-2,Z_DATA_ERROR:-3,Z_BUF_ERROR:-5,Z_NO_COMPRESSION:0,Z_BEST_SPEED:1,Z_BEST_COMPRESSION:9,Z_DEFAULT_COMPRESSION:-1,Z_FILTERED:1,Z_HUFFMAN_ONLY:2,Z_RLE:3,Z_FIXED:4,Z_DEFAULT_STRATEGY:0,Z_BINARY:0,Z_TEXT:1,Z_UNKNOWN:2,Z_DEFLATED:8}},{}],45:[function(e,t,r){"use strict";var o=function(){for(var e,t=[],r=0;r<256;r++){e=r;for(var n=0;n<8;n++)e=1&e?3988292384^e>>>1:e>>>1;t[r]=e}return t}();t.exports=function(e,t,r,n){var i=o,s=n+r;e^=-1;for(var a=n;a<s;a++)e=e>>>8^i[255&(e^t[a])];return-1^e}},{}],46:[function(e,t,r){"use strict";var h,c=e("../utils/common"),u=e("./trees"),d=e("./adler32"),p=e("./crc32"),n=e("./messages"),l=0,f=4,m=0,_=-2,g=-1,b=4,i=2,v=8,y=9,s=286,a=30,o=19,w=2*s+1,k=15,x=3,S=258,z=S+x+1,C=42,E=113,A=1,I=2,O=3,B=4;function R(e,t){return e.msg=n[t],t}function T(e){return(e<<1)-(4<e?9:0)}function D(e){for(var t=e.length;0<=--t;)e[t]=0}function F(e){var t=e.state,r=t.pending;r>e.avail_out&&(r=e.avail_out),0!==r&&(c.arraySet(e.output,t.pending_buf,t.pending_out,r,e.next_out),e.next_out+=r,t.pending_out+=r,e.total_out+=r,e.avail_out-=r,t.pending-=r,0===t.pending&&(t.pending_out=0))}function N(e,t){u._tr_flush_block(e,0<=e.block_start?e.block_start:-1,e.strstart-e.block_start,t),e.block_start=e.strstart,F(e.strm)}function U(e,t){e.pending_buf[e.pending++]=t}function P(e,t){e.pending_buf[e.pending++]=t>>>8&255,e.pending_buf[e.pending++]=255&t}function L(e,t){var r,n,i=e.max_chain_length,s=e.strstart,a=e.prev_length,o=e.nice_match,h=e.strstart>e.w_size-z?e.strstart-(e.w_size-z):0,u=e.window,l=e.w_mask,f=e.prev,c=e.strstart+S,d=u[s+a-1],p=u[s+a];e.prev_length>=e.good_match&&(i>>=2),o>e.lookahead&&(o=e.lookahead);do{if(u[(r=t)+a]===p&&u[r+a-1]===d&&u[r]===u[s]&&u[++r]===u[s+1]){s+=2,r++;do{}while(u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&s<c);if(n=S-(c-s),s=c-S,a<n){if(e.match_start=t,o<=(a=n))break;d=u[s+a-1],p=u[s+a]}}}while((t=f[t&l])>h&&0!=--i);return a<=e.lookahead?a:e.lookahead}function j(e){var t,r,n,i,s,a,o,h,u,l,f=e.w_size;do{if(i=e.window_size-e.lookahead-e.strstart,e.strstart>=f+(f-z)){for(c.arraySet(e.window,e.window,f,f,0),e.match_start-=f,e.strstart-=f,e.block_start-=f,t=r=e.hash_size;n=e.head[--t],e.head[t]=f<=n?n-f:0,--r;);for(t=r=f;n=e.prev[--t],e.prev[t]=f<=n?n-f:0,--r;);i+=f}if(0===e.strm.avail_in)break;if(a=e.strm,o=e.window,h=e.strstart+e.lookahead,u=i,l=void 0,l=a.avail_in,u<l&&(l=u),r=0===l?0:(a.avail_in-=l,c.arraySet(o,a.input,a.next_in,l,h),1===a.state.wrap?a.adler=d(a.adler,o,l,h):2===a.state.wrap&&(a.adler=p(a.adler,o,l,h)),a.next_in+=l,a.total_in+=l,l),e.lookahead+=r,e.lookahead+e.insert>=x)for(s=e.strstart-e.insert,e.ins_h=e.window[s],e.ins_h=(e.ins_h<<e.hash_shift^e.window[s+1])&e.hash_mask;e.insert&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[s+x-1])&e.hash_mask,e.prev[s&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=s,s++,e.insert--,!(e.lookahead+e.insert<x)););}while(e.lookahead<z&&0!==e.strm.avail_in)}function Z(e,t){for(var r,n;;){if(e.lookahead<z){if(j(e),e.lookahead<z&&t===l)return A;if(0===e.lookahead)break}if(r=0,e.lookahead>=x&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+x-1])&e.hash_mask,r=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart),0!==r&&e.strstart-r<=e.w_size-z&&(e.match_length=L(e,r)),e.match_length>=x)if(n=u._tr_tally(e,e.strstart-e.match_start,e.match_length-x),e.lookahead-=e.match_length,e.match_length<=e.max_lazy_match&&e.lookahead>=x){for(e.match_length--;e.strstart++,e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+x-1])&e.hash_mask,r=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart,0!=--e.match_length;);e.strstart++}else e.strstart+=e.match_length,e.match_length=0,e.ins_h=e.window[e.strstart],e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+1])&e.hash_mask;else n=u._tr_tally(e,0,e.window[e.strstart]),e.lookahead--,e.strstart++;if(n&&(N(e,!1),0===e.strm.avail_out))return A}return e.insert=e.strstart<x-1?e.strstart:x-1,t===f?(N(e,!0),0===e.strm.avail_out?O:B):e.last_lit&&(N(e,!1),0===e.strm.avail_out)?A:I}function W(e,t){for(var r,n,i;;){if(e.lookahead<z){if(j(e),e.lookahead<z&&t===l)return A;if(0===e.lookahead)break}if(r=0,e.lookahead>=x&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+x-1])&e.hash_mask,r=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart),e.prev_length=e.match_length,e.prev_match=e.match_start,e.match_length=x-1,0!==r&&e.prev_length<e.max_lazy_match&&e.strstart-r<=e.w_size-z&&(e.match_length=L(e,r),e.match_length<=5&&(1===e.strategy||e.match_length===x&&4096<e.strstart-e.match_start)&&(e.match_length=x-1)),e.prev_length>=x&&e.match_length<=e.prev_length){for(i=e.strstart+e.lookahead-x,n=u._tr_tally(e,e.strstart-1-e.prev_match,e.prev_length-x),e.lookahead-=e.prev_length-1,e.prev_length-=2;++e.strstart<=i&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+x-1])&e.hash_mask,r=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart),0!=--e.prev_length;);if(e.match_available=0,e.match_length=x-1,e.strstart++,n&&(N(e,!1),0===e.strm.avail_out))return A}else if(e.match_available){if((n=u._tr_tally(e,0,e.window[e.strstart-1]))&&N(e,!1),e.strstart++,e.lookahead--,0===e.strm.avail_out)return A}else e.match_available=1,e.strstart++,e.lookahead--}return e.match_available&&(n=u._tr_tally(e,0,e.window[e.strstart-1]),e.match_available=0),e.insert=e.strstart<x-1?e.strstart:x-1,t===f?(N(e,!0),0===e.strm.avail_out?O:B):e.last_lit&&(N(e,!1),0===e.strm.avail_out)?A:I}function M(e,t,r,n,i){this.good_length=e,this.max_lazy=t,this.nice_length=r,this.max_chain=n,this.func=i}function H(){this.strm=null,this.status=0,this.pending_buf=null,this.pending_buf_size=0,this.pending_out=0,this.pending=0,this.wrap=0,this.gzhead=null,this.gzindex=0,this.method=v,this.last_flush=-1,this.w_size=0,this.w_bits=0,this.w_mask=0,this.window=null,this.window_size=0,this.prev=null,this.head=null,this.ins_h=0,this.hash_size=0,this.hash_bits=0,this.hash_mask=0,this.hash_shift=0,this.block_start=0,this.match_length=0,this.prev_match=0,this.match_available=0,this.strstart=0,this.match_start=0,this.lookahead=0,this.prev_length=0,this.max_chain_length=0,this.max_lazy_match=0,this.level=0,this.strategy=0,this.good_match=0,this.nice_match=0,this.dyn_ltree=new c.Buf16(2*w),this.dyn_dtree=new c.Buf16(2*(2*a+1)),this.bl_tree=new c.Buf16(2*(2*o+1)),D(this.dyn_ltree),D(this.dyn_dtree),D(this.bl_tree),this.l_desc=null,this.d_desc=null,this.bl_desc=null,this.bl_count=new c.Buf16(k+1),this.heap=new c.Buf16(2*s+1),D(this.heap),this.heap_len=0,this.heap_max=0,this.depth=new c.Buf16(2*s+1),D(this.depth),this.l_buf=0,this.lit_bufsize=0,this.last_lit=0,this.d_buf=0,this.opt_len=0,this.static_len=0,this.matches=0,this.insert=0,this.bi_buf=0,this.bi_valid=0}function G(e){var t;return e&&e.state?(e.total_in=e.total_out=0,e.data_type=i,(t=e.state).pending=0,t.pending_out=0,t.wrap<0&&(t.wrap=-t.wrap),t.status=t.wrap?C:E,e.adler=2===t.wrap?0:1,t.last_flush=l,u._tr_init(t),m):R(e,_)}function K(e){var t=G(e);return t===m&&function(e){e.window_size=2*e.w_size,D(e.head),e.max_lazy_match=h[e.level].max_lazy,e.good_match=h[e.level].good_length,e.nice_match=h[e.level].nice_length,e.max_chain_length=h[e.level].max_chain,e.strstart=0,e.block_start=0,e.lookahead=0,e.insert=0,e.match_length=e.prev_length=x-1,e.match_available=0,e.ins_h=0}(e.state),t}function Y(e,t,r,n,i,s){if(!e)return _;var a=1;if(t===g&&(t=6),n<0?(a=0,n=-n):15<n&&(a=2,n-=16),i<1||y<i||r!==v||n<8||15<n||t<0||9<t||s<0||b<s)return R(e,_);8===n&&(n=9);var o=new H;return(e.state=o).strm=e,o.wrap=a,o.gzhead=null,o.w_bits=n,o.w_size=1<<o.w_bits,o.w_mask=o.w_size-1,o.hash_bits=i+7,o.hash_size=1<<o.hash_bits,o.hash_mask=o.hash_size-1,o.hash_shift=~~((o.hash_bits+x-1)/x),o.window=new c.Buf8(2*o.w_size),o.head=new c.Buf16(o.hash_size),o.prev=new c.Buf16(o.w_size),o.lit_bufsize=1<<i+6,o.pending_buf_size=4*o.lit_bufsize,o.pending_buf=new c.Buf8(o.pending_buf_size),o.d_buf=1*o.lit_bufsize,o.l_buf=3*o.lit_bufsize,o.level=t,o.strategy=s,o.method=r,K(e)}h=[new M(0,0,0,0,function(e,t){var r=65535;for(r>e.pending_buf_size-5&&(r=e.pending_buf_size-5);;){if(e.lookahead<=1){if(j(e),0===e.lookahead&&t===l)return A;if(0===e.lookahead)break}e.strstart+=e.lookahead,e.lookahead=0;var n=e.block_start+r;if((0===e.strstart||e.strstart>=n)&&(e.lookahead=e.strstart-n,e.strstart=n,N(e,!1),0===e.strm.avail_out))return A;if(e.strstart-e.block_start>=e.w_size-z&&(N(e,!1),0===e.strm.avail_out))return A}return e.insert=0,t===f?(N(e,!0),0===e.strm.avail_out?O:B):(e.strstart>e.block_start&&(N(e,!1),e.strm.avail_out),A)}),new M(4,4,8,4,Z),new M(4,5,16,8,Z),new M(4,6,32,32,Z),new M(4,4,16,16,W),new M(8,16,32,32,W),new M(8,16,128,128,W),new M(8,32,128,256,W),new M(32,128,258,1024,W),new M(32,258,258,4096,W)],r.deflateInit=function(e,t){return Y(e,t,v,15,8,0)},r.deflateInit2=Y,r.deflateReset=K,r.deflateResetKeep=G,r.deflateSetHeader=function(e,t){return e&&e.state?2!==e.state.wrap?_:(e.state.gzhead=t,m):_},r.deflate=function(e,t){var r,n,i,s;if(!e||!e.state||5<t||t<0)return e?R(e,_):_;if(n=e.state,!e.output||!e.input&&0!==e.avail_in||666===n.status&&t!==f)return R(e,0===e.avail_out?-5:_);if(n.strm=e,r=n.last_flush,n.last_flush=t,n.status===C)if(2===n.wrap)e.adler=0,U(n,31),U(n,139),U(n,8),n.gzhead?(U(n,(n.gzhead.text?1:0)+(n.gzhead.hcrc?2:0)+(n.gzhead.extra?4:0)+(n.gzhead.name?8:0)+(n.gzhead.comment?16:0)),U(n,255&n.gzhead.time),U(n,n.gzhead.time>>8&255),U(n,n.gzhead.time>>16&255),U(n,n.gzhead.time>>24&255),U(n,9===n.level?2:2<=n.strategy||n.level<2?4:0),U(n,255&n.gzhead.os),n.gzhead.extra&&n.gzhead.extra.length&&(U(n,255&n.gzhead.extra.length),U(n,n.gzhead.extra.length>>8&255)),n.gzhead.hcrc&&(e.adler=p(e.adler,n.pending_buf,n.pending,0)),n.gzindex=0,n.status=69):(U(n,0),U(n,0),U(n,0),U(n,0),U(n,0),U(n,9===n.level?2:2<=n.strategy||n.level<2?4:0),U(n,3),n.status=E);else{var a=v+(n.w_bits-8<<4)<<8;a|=(2<=n.strategy||n.level<2?0:n.level<6?1:6===n.level?2:3)<<6,0!==n.strstart&&(a|=32),a+=31-a%31,n.status=E,P(n,a),0!==n.strstart&&(P(n,e.adler>>>16),P(n,65535&e.adler)),e.adler=1}if(69===n.status)if(n.gzhead.extra){for(i=n.pending;n.gzindex<(65535&n.gzhead.extra.length)&&(n.pending!==n.pending_buf_size||(n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),F(e),i=n.pending,n.pending!==n.pending_buf_size));)U(n,255&n.gzhead.extra[n.gzindex]),n.gzindex++;n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),n.gzindex===n.gzhead.extra.length&&(n.gzindex=0,n.status=73)}else n.status=73;if(73===n.status)if(n.gzhead.name){i=n.pending;do{if(n.pending===n.pending_buf_size&&(n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),F(e),i=n.pending,n.pending===n.pending_buf_size)){s=1;break}s=n.gzindex<n.gzhead.name.length?255&n.gzhead.name.charCodeAt(n.gzindex++):0,U(n,s)}while(0!==s);n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),0===s&&(n.gzindex=0,n.status=91)}else n.status=91;if(91===n.status)if(n.gzhead.comment){i=n.pending;do{if(n.pending===n.pending_buf_size&&(n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),F(e),i=n.pending,n.pending===n.pending_buf_size)){s=1;break}s=n.gzindex<n.gzhead.comment.length?255&n.gzhead.comment.charCodeAt(n.gzindex++):0,U(n,s)}while(0!==s);n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),0===s&&(n.status=103)}else n.status=103;if(103===n.status&&(n.gzhead.hcrc?(n.pending+2>n.pending_buf_size&&F(e),n.pending+2<=n.pending_buf_size&&(U(n,255&e.adler),U(n,e.adler>>8&255),e.adler=0,n.status=E)):n.status=E),0!==n.pending){if(F(e),0===e.avail_out)return n.last_flush=-1,m}else if(0===e.avail_in&&T(t)<=T(r)&&t!==f)return R(e,-5);if(666===n.status&&0!==e.avail_in)return R(e,-5);if(0!==e.avail_in||0!==n.lookahead||t!==l&&666!==n.status){var o=2===n.strategy?function(e,t){for(var r;;){if(0===e.lookahead&&(j(e),0===e.lookahead)){if(t===l)return A;break}if(e.match_length=0,r=u._tr_tally(e,0,e.window[e.strstart]),e.lookahead--,e.strstart++,r&&(N(e,!1),0===e.strm.avail_out))return A}return e.insert=0,t===f?(N(e,!0),0===e.strm.avail_out?O:B):e.last_lit&&(N(e,!1),0===e.strm.avail_out)?A:I}(n,t):3===n.strategy?function(e,t){for(var r,n,i,s,a=e.window;;){if(e.lookahead<=S){if(j(e),e.lookahead<=S&&t===l)return A;if(0===e.lookahead)break}if(e.match_length=0,e.lookahead>=x&&0<e.strstart&&(n=a[i=e.strstart-1])===a[++i]&&n===a[++i]&&n===a[++i]){s=e.strstart+S;do{}while(n===a[++i]&&n===a[++i]&&n===a[++i]&&n===a[++i]&&n===a[++i]&&n===a[++i]&&n===a[++i]&&n===a[++i]&&i<s);e.match_length=S-(s-i),e.match_length>e.lookahead&&(e.match_length=e.lookahead)}if(e.match_length>=x?(r=u._tr_tally(e,1,e.match_length-x),e.lookahead-=e.match_length,e.strstart+=e.match_length,e.match_length=0):(r=u._tr_tally(e,0,e.window[e.strstart]),e.lookahead--,e.strstart++),r&&(N(e,!1),0===e.strm.avail_out))return A}return e.insert=0,t===f?(N(e,!0),0===e.strm.avail_out?O:B):e.last_lit&&(N(e,!1),0===e.strm.avail_out)?A:I}(n,t):h[n.level].func(n,t);if(o!==O&&o!==B||(n.status=666),o===A||o===O)return 0===e.avail_out&&(n.last_flush=-1),m;if(o===I&&(1===t?u._tr_align(n):5!==t&&(u._tr_stored_block(n,0,0,!1),3===t&&(D(n.head),0===n.lookahead&&(n.strstart=0,n.block_start=0,n.insert=0))),F(e),0===e.avail_out))return n.last_flush=-1,m}return t!==f?m:n.wrap<=0?1:(2===n.wrap?(U(n,255&e.adler),U(n,e.adler>>8&255),U(n,e.adler>>16&255),U(n,e.adler>>24&255),U(n,255&e.total_in),U(n,e.total_in>>8&255),U(n,e.total_in>>16&255),U(n,e.total_in>>24&255)):(P(n,e.adler>>>16),P(n,65535&e.adler)),F(e),0<n.wrap&&(n.wrap=-n.wrap),0!==n.pending?m:1)},r.deflateEnd=function(e){var t;return e&&e.state?(t=e.state.status)!==C&&69!==t&&73!==t&&91!==t&&103!==t&&t!==E&&666!==t?R(e,_):(e.state=null,t===E?R(e,-3):m):_},r.deflateSetDictionary=function(e,t){var r,n,i,s,a,o,h,u,l=t.length;if(!e||!e.state)return _;if(2===(s=(r=e.state).wrap)||1===s&&r.status!==C||r.lookahead)return _;for(1===s&&(e.adler=d(e.adler,t,l,0)),r.wrap=0,l>=r.w_size&&(0===s&&(D(r.head),r.strstart=0,r.block_start=0,r.insert=0),u=new c.Buf8(r.w_size),c.arraySet(u,t,l-r.w_size,r.w_size,0),t=u,l=r.w_size),a=e.avail_in,o=e.next_in,h=e.input,e.avail_in=l,e.next_in=0,e.input=t,j(r);r.lookahead>=x;){for(n=r.strstart,i=r.lookahead-(x-1);r.ins_h=(r.ins_h<<r.hash_shift^r.window[n+x-1])&r.hash_mask,r.prev[n&r.w_mask]=r.head[r.ins_h],r.head[r.ins_h]=n,n++,--i;);r.strstart=n,r.lookahead=x-1,j(r)}return r.strstart+=r.lookahead,r.block_start=r.strstart,r.insert=r.lookahead,r.lookahead=0,r.match_length=r.prev_length=x-1,r.match_available=0,e.next_in=o,e.input=h,e.avail_in=a,r.wrap=s,m},r.deflateInfo="pako deflate (from Nodeca project)"},{"../utils/common":41,"./adler32":43,"./crc32":45,"./messages":51,"./trees":52}],47:[function(e,t,r){"use strict";t.exports=function(){this.text=0,this.time=0,this.xflags=0,this.os=0,this.extra=null,this.extra_len=0,this.name="",this.comment="",this.hcrc=0,this.done=!1}},{}],48:[function(e,t,r){"use strict";t.exports=function(e,t){var r,n,i,s,a,o,h,u,l,f,c,d,p,m,_,g,b,v,y,w,k,x,S,z,C;r=e.state,n=e.next_in,z=e.input,i=n+(e.avail_in-5),s=e.next_out,C=e.output,a=s-(t-e.avail_out),o=s+(e.avail_out-257),h=r.dmax,u=r.wsize,l=r.whave,f=r.wnext,c=r.window,d=r.hold,p=r.bits,m=r.lencode,_=r.distcode,g=(1<<r.lenbits)-1,b=(1<<r.distbits)-1;e:do{p<15&&(d+=z[n++]<<p,p+=8,d+=z[n++]<<p,p+=8),v=m[d&g];t:for(;;){if(d>>>=y=v>>>24,p-=y,0===(y=v>>>16&255))C[s++]=65535&v;else{if(!(16&y)){if(0==(64&y)){v=m[(65535&v)+(d&(1<<y)-1)];continue t}if(32&y){r.mode=12;break e}e.msg="invalid literal/length code",r.mode=30;break e}w=65535&v,(y&=15)&&(p<y&&(d+=z[n++]<<p,p+=8),w+=d&(1<<y)-1,d>>>=y,p-=y),p<15&&(d+=z[n++]<<p,p+=8,d+=z[n++]<<p,p+=8),v=_[d&b];r:for(;;){if(d>>>=y=v>>>24,p-=y,!(16&(y=v>>>16&255))){if(0==(64&y)){v=_[(65535&v)+(d&(1<<y)-1)];continue r}e.msg="invalid distance code",r.mode=30;break e}if(k=65535&v,p<(y&=15)&&(d+=z[n++]<<p,(p+=8)<y&&(d+=z[n++]<<p,p+=8)),h<(k+=d&(1<<y)-1)){e.msg="invalid distance too far back",r.mode=30;break e}if(d>>>=y,p-=y,(y=s-a)<k){if(l<(y=k-y)&&r.sane){e.msg="invalid distance too far back",r.mode=30;break e}if(S=c,(x=0)===f){if(x+=u-y,y<w){for(w-=y;C[s++]=c[x++],--y;);x=s-k,S=C}}else if(f<y){if(x+=u+f-y,(y-=f)<w){for(w-=y;C[s++]=c[x++],--y;);if(x=0,f<w){for(w-=y=f;C[s++]=c[x++],--y;);x=s-k,S=C}}}else if(x+=f-y,y<w){for(w-=y;C[s++]=c[x++],--y;);x=s-k,S=C}for(;2<w;)C[s++]=S[x++],C[s++]=S[x++],C[s++]=S[x++],w-=3;w&&(C[s++]=S[x++],1<w&&(C[s++]=S[x++]))}else{for(x=s-k;C[s++]=C[x++],C[s++]=C[x++],C[s++]=C[x++],2<(w-=3););w&&(C[s++]=C[x++],1<w&&(C[s++]=C[x++]))}break}}break}}while(n<i&&s<o);n-=w=p>>3,d&=(1<<(p-=w<<3))-1,e.next_in=n,e.next_out=s,e.avail_in=n<i?i-n+5:5-(n-i),e.avail_out=s<o?o-s+257:257-(s-o),r.hold=d,r.bits=p}},{}],49:[function(e,t,r){"use strict";var I=e("../utils/common"),O=e("./adler32"),B=e("./crc32"),R=e("./inffast"),T=e("./inftrees"),D=1,F=2,N=0,U=-2,P=1,n=852,i=592;function L(e){return(e>>>24&255)+(e>>>8&65280)+((65280&e)<<8)+((255&e)<<24)}function s(){this.mode=0,this.last=!1,this.wrap=0,this.havedict=!1,this.flags=0,this.dmax=0,this.check=0,this.total=0,this.head=null,this.wbits=0,this.wsize=0,this.whave=0,this.wnext=0,this.window=null,this.hold=0,this.bits=0,this.length=0,this.offset=0,this.extra=0,this.lencode=null,this.distcode=null,this.lenbits=0,this.distbits=0,this.ncode=0,this.nlen=0,this.ndist=0,this.have=0,this.next=null,this.lens=new I.Buf16(320),this.work=new I.Buf16(288),this.lendyn=null,this.distdyn=null,this.sane=0,this.back=0,this.was=0}function a(e){var t;return e&&e.state?(t=e.state,e.total_in=e.total_out=t.total=0,e.msg="",t.wrap&&(e.adler=1&t.wrap),t.mode=P,t.last=0,t.havedict=0,t.dmax=32768,t.head=null,t.hold=0,t.bits=0,t.lencode=t.lendyn=new I.Buf32(n),t.distcode=t.distdyn=new I.Buf32(i),t.sane=1,t.back=-1,N):U}function o(e){var t;return e&&e.state?((t=e.state).wsize=0,t.whave=0,t.wnext=0,a(e)):U}function h(e,t){var r,n;return e&&e.state?(n=e.state,t<0?(r=0,t=-t):(r=1+(t>>4),t<48&&(t&=15)),t&&(t<8||15<t)?U:(null!==n.window&&n.wbits!==t&&(n.window=null),n.wrap=r,n.wbits=t,o(e))):U}function u(e,t){var r,n;return e?(n=new s,(e.state=n).window=null,(r=h(e,t))!==N&&(e.state=null),r):U}var l,f,c=!0;function j(e){if(c){var t;for(l=new I.Buf32(512),f=new I.Buf32(32),t=0;t<144;)e.lens[t++]=8;for(;t<256;)e.lens[t++]=9;for(;t<280;)e.lens[t++]=7;for(;t<288;)e.lens[t++]=8;for(T(D,e.lens,0,288,l,0,e.work,{bits:9}),t=0;t<32;)e.lens[t++]=5;T(F,e.lens,0,32,f,0,e.work,{bits:5}),c=!1}e.lencode=l,e.lenbits=9,e.distcode=f,e.distbits=5}function Z(e,t,r,n){var i,s=e.state;return null===s.window&&(s.wsize=1<<s.wbits,s.wnext=0,s.whave=0,s.window=new I.Buf8(s.wsize)),n>=s.wsize?(I.arraySet(s.window,t,r-s.wsize,s.wsize,0),s.wnext=0,s.whave=s.wsize):(n<(i=s.wsize-s.wnext)&&(i=n),I.arraySet(s.window,t,r-n,i,s.wnext),(n-=i)?(I.arraySet(s.window,t,r-n,n,0),s.wnext=n,s.whave=s.wsize):(s.wnext+=i,s.wnext===s.wsize&&(s.wnext=0),s.whave<s.wsize&&(s.whave+=i))),0}r.inflateReset=o,r.inflateReset2=h,r.inflateResetKeep=a,r.inflateInit=function(e){return u(e,15)},r.inflateInit2=u,r.inflate=function(e,t){var r,n,i,s,a,o,h,u,l,f,c,d,p,m,_,g,b,v,y,w,k,x,S,z,C=0,E=new I.Buf8(4),A=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];if(!e||!e.state||!e.output||!e.input&&0!==e.avail_in)return U;12===(r=e.state).mode&&(r.mode=13),a=e.next_out,i=e.output,h=e.avail_out,s=e.next_in,n=e.input,o=e.avail_in,u=r.hold,l=r.bits,f=o,c=h,x=N;e:for(;;)switch(r.mode){case P:if(0===r.wrap){r.mode=13;break}for(;l<16;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(2&r.wrap&&35615===u){E[r.check=0]=255&u,E[1]=u>>>8&255,r.check=B(r.check,E,2,0),l=u=0,r.mode=2;break}if(r.flags=0,r.head&&(r.head.done=!1),!(1&r.wrap)||(((255&u)<<8)+(u>>8))%31){e.msg="incorrect header check",r.mode=30;break}if(8!=(15&u)){e.msg="unknown compression method",r.mode=30;break}if(l-=4,k=8+(15&(u>>>=4)),0===r.wbits)r.wbits=k;else if(k>r.wbits){e.msg="invalid window size",r.mode=30;break}r.dmax=1<<k,e.adler=r.check=1,r.mode=512&u?10:12,l=u=0;break;case 2:for(;l<16;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(r.flags=u,8!=(255&r.flags)){e.msg="unknown compression method",r.mode=30;break}if(57344&r.flags){e.msg="unknown header flags set",r.mode=30;break}r.head&&(r.head.text=u>>8&1),512&r.flags&&(E[0]=255&u,E[1]=u>>>8&255,r.check=B(r.check,E,2,0)),l=u=0,r.mode=3;case 3:for(;l<32;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}r.head&&(r.head.time=u),512&r.flags&&(E[0]=255&u,E[1]=u>>>8&255,E[2]=u>>>16&255,E[3]=u>>>24&255,r.check=B(r.check,E,4,0)),l=u=0,r.mode=4;case 4:for(;l<16;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}r.head&&(r.head.xflags=255&u,r.head.os=u>>8),512&r.flags&&(E[0]=255&u,E[1]=u>>>8&255,r.check=B(r.check,E,2,0)),l=u=0,r.mode=5;case 5:if(1024&r.flags){for(;l<16;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}r.length=u,r.head&&(r.head.extra_len=u),512&r.flags&&(E[0]=255&u,E[1]=u>>>8&255,r.check=B(r.check,E,2,0)),l=u=0}else r.head&&(r.head.extra=null);r.mode=6;case 6:if(1024&r.flags&&(o<(d=r.length)&&(d=o),d&&(r.head&&(k=r.head.extra_len-r.length,r.head.extra||(r.head.extra=new Array(r.head.extra_len)),I.arraySet(r.head.extra,n,s,d,k)),512&r.flags&&(r.check=B(r.check,n,d,s)),o-=d,s+=d,r.length-=d),r.length))break e;r.length=0,r.mode=7;case 7:if(2048&r.flags){if(0===o)break e;for(d=0;k=n[s+d++],r.head&&k&&r.length<65536&&(r.head.name+=String.fromCharCode(k)),k&&d<o;);if(512&r.flags&&(r.check=B(r.check,n,d,s)),o-=d,s+=d,k)break e}else r.head&&(r.head.name=null);r.length=0,r.mode=8;case 8:if(4096&r.flags){if(0===o)break e;for(d=0;k=n[s+d++],r.head&&k&&r.length<65536&&(r.head.comment+=String.fromCharCode(k)),k&&d<o;);if(512&r.flags&&(r.check=B(r.check,n,d,s)),o-=d,s+=d,k)break e}else r.head&&(r.head.comment=null);r.mode=9;case 9:if(512&r.flags){for(;l<16;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(u!==(65535&r.check)){e.msg="header crc mismatch",r.mode=30;break}l=u=0}r.head&&(r.head.hcrc=r.flags>>9&1,r.head.done=!0),e.adler=r.check=0,r.mode=12;break;case 10:for(;l<32;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}e.adler=r.check=L(u),l=u=0,r.mode=11;case 11:if(0===r.havedict)return e.next_out=a,e.avail_out=h,e.next_in=s,e.avail_in=o,r.hold=u,r.bits=l,2;e.adler=r.check=1,r.mode=12;case 12:if(5===t||6===t)break e;case 13:if(r.last){u>>>=7&l,l-=7&l,r.mode=27;break}for(;l<3;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}switch(r.last=1&u,l-=1,3&(u>>>=1)){case 0:r.mode=14;break;case 1:if(j(r),r.mode=20,6!==t)break;u>>>=2,l-=2;break e;case 2:r.mode=17;break;case 3:e.msg="invalid block type",r.mode=30}u>>>=2,l-=2;break;case 14:for(u>>>=7&l,l-=7&l;l<32;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if((65535&u)!=(u>>>16^65535)){e.msg="invalid stored block lengths",r.mode=30;break}if(r.length=65535&u,l=u=0,r.mode=15,6===t)break e;case 15:r.mode=16;case 16:if(d=r.length){if(o<d&&(d=o),h<d&&(d=h),0===d)break e;I.arraySet(i,n,s,d,a),o-=d,s+=d,h-=d,a+=d,r.length-=d;break}r.mode=12;break;case 17:for(;l<14;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(r.nlen=257+(31&u),u>>>=5,l-=5,r.ndist=1+(31&u),u>>>=5,l-=5,r.ncode=4+(15&u),u>>>=4,l-=4,286<r.nlen||30<r.ndist){e.msg="too many length or distance symbols",r.mode=30;break}r.have=0,r.mode=18;case 18:for(;r.have<r.ncode;){for(;l<3;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}r.lens[A[r.have++]]=7&u,u>>>=3,l-=3}for(;r.have<19;)r.lens[A[r.have++]]=0;if(r.lencode=r.lendyn,r.lenbits=7,S={bits:r.lenbits},x=T(0,r.lens,0,19,r.lencode,0,r.work,S),r.lenbits=S.bits,x){e.msg="invalid code lengths set",r.mode=30;break}r.have=0,r.mode=19;case 19:for(;r.have<r.nlen+r.ndist;){for(;g=(C=r.lencode[u&(1<<r.lenbits)-1])>>>16&255,b=65535&C,!((_=C>>>24)<=l);){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(b<16)u>>>=_,l-=_,r.lens[r.have++]=b;else{if(16===b){for(z=_+2;l<z;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(u>>>=_,l-=_,0===r.have){e.msg="invalid bit length repeat",r.mode=30;break}k=r.lens[r.have-1],d=3+(3&u),u>>>=2,l-=2}else if(17===b){for(z=_+3;l<z;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}l-=_,k=0,d=3+(7&(u>>>=_)),u>>>=3,l-=3}else{for(z=_+7;l<z;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}l-=_,k=0,d=11+(127&(u>>>=_)),u>>>=7,l-=7}if(r.have+d>r.nlen+r.ndist){e.msg="invalid bit length repeat",r.mode=30;break}for(;d--;)r.lens[r.have++]=k}}if(30===r.mode)break;if(0===r.lens[256]){e.msg="invalid code -- missing end-of-block",r.mode=30;break}if(r.lenbits=9,S={bits:r.lenbits},x=T(D,r.lens,0,r.nlen,r.lencode,0,r.work,S),r.lenbits=S.bits,x){e.msg="invalid literal/lengths set",r.mode=30;break}if(r.distbits=6,r.distcode=r.distdyn,S={bits:r.distbits},x=T(F,r.lens,r.nlen,r.ndist,r.distcode,0,r.work,S),r.distbits=S.bits,x){e.msg="invalid distances set",r.mode=30;break}if(r.mode=20,6===t)break e;case 20:r.mode=21;case 21:if(6<=o&&258<=h){e.next_out=a,e.avail_out=h,e.next_in=s,e.avail_in=o,r.hold=u,r.bits=l,R(e,c),a=e.next_out,i=e.output,h=e.avail_out,s=e.next_in,n=e.input,o=e.avail_in,u=r.hold,l=r.bits,12===r.mode&&(r.back=-1);break}for(r.back=0;g=(C=r.lencode[u&(1<<r.lenbits)-1])>>>16&255,b=65535&C,!((_=C>>>24)<=l);){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(g&&0==(240&g)){for(v=_,y=g,w=b;g=(C=r.lencode[w+((u&(1<<v+y)-1)>>v)])>>>16&255,b=65535&C,!(v+(_=C>>>24)<=l);){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}u>>>=v,l-=v,r.back+=v}if(u>>>=_,l-=_,r.back+=_,r.length=b,0===g){r.mode=26;break}if(32&g){r.back=-1,r.mode=12;break}if(64&g){e.msg="invalid literal/length code",r.mode=30;break}r.extra=15&g,r.mode=22;case 22:if(r.extra){for(z=r.extra;l<z;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}r.length+=u&(1<<r.extra)-1,u>>>=r.extra,l-=r.extra,r.back+=r.extra}r.was=r.length,r.mode=23;case 23:for(;g=(C=r.distcode[u&(1<<r.distbits)-1])>>>16&255,b=65535&C,!((_=C>>>24)<=l);){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(0==(240&g)){for(v=_,y=g,w=b;g=(C=r.distcode[w+((u&(1<<v+y)-1)>>v)])>>>16&255,b=65535&C,!(v+(_=C>>>24)<=l);){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}u>>>=v,l-=v,r.back+=v}if(u>>>=_,l-=_,r.back+=_,64&g){e.msg="invalid distance code",r.mode=30;break}r.offset=b,r.extra=15&g,r.mode=24;case 24:if(r.extra){for(z=r.extra;l<z;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}r.offset+=u&(1<<r.extra)-1,u>>>=r.extra,l-=r.extra,r.back+=r.extra}if(r.offset>r.dmax){e.msg="invalid distance too far back",r.mode=30;break}r.mode=25;case 25:if(0===h)break e;if(d=c-h,r.offset>d){if((d=r.offset-d)>r.whave&&r.sane){e.msg="invalid distance too far back",r.mode=30;break}p=d>r.wnext?(d-=r.wnext,r.wsize-d):r.wnext-d,d>r.length&&(d=r.length),m=r.window}else m=i,p=a-r.offset,d=r.length;for(h<d&&(d=h),h-=d,r.length-=d;i[a++]=m[p++],--d;);0===r.length&&(r.mode=21);break;case 26:if(0===h)break e;i[a++]=r.length,h--,r.mode=21;break;case 27:if(r.wrap){for(;l<32;){if(0===o)break e;o--,u|=n[s++]<<l,l+=8}if(c-=h,e.total_out+=c,r.total+=c,c&&(e.adler=r.check=r.flags?B(r.check,i,c,a-c):O(r.check,i,c,a-c)),c=h,(r.flags?u:L(u))!==r.check){e.msg="incorrect data check",r.mode=30;break}l=u=0}r.mode=28;case 28:if(r.wrap&&r.flags){for(;l<32;){if(0===o)break e;o--,u+=n[s++]<<l,l+=8}if(u!==(4294967295&r.total)){e.msg="incorrect length check",r.mode=30;break}l=u=0}r.mode=29;case 29:x=1;break e;case 30:x=-3;break e;case 31:return-4;case 32:default:return U}return e.next_out=a,e.avail_out=h,e.next_in=s,e.avail_in=o,r.hold=u,r.bits=l,(r.wsize||c!==e.avail_out&&r.mode<30&&(r.mode<27||4!==t))&&Z(e,e.output,e.next_out,c-e.avail_out)?(r.mode=31,-4):(f-=e.avail_in,c-=e.avail_out,e.total_in+=f,e.total_out+=c,r.total+=c,r.wrap&&c&&(e.adler=r.check=r.flags?B(r.check,i,c,e.next_out-c):O(r.check,i,c,e.next_out-c)),e.data_type=r.bits+(r.last?64:0)+(12===r.mode?128:0)+(20===r.mode||15===r.mode?256:0),(0==f&&0===c||4===t)&&x===N&&(x=-5),x)},r.inflateEnd=function(e){if(!e||!e.state)return U;var t=e.state;return t.window&&(t.window=null),e.state=null,N},r.inflateGetHeader=function(e,t){var r;return e&&e.state?0==(2&(r=e.state).wrap)?U:((r.head=t).done=!1,N):U},r.inflateSetDictionary=function(e,t){var r,n=t.length;return e&&e.state?0!==(r=e.state).wrap&&11!==r.mode?U:11===r.mode&&O(1,t,n,0)!==r.check?-3:Z(e,t,n,n)?(r.mode=31,-4):(r.havedict=1,N):U},r.inflateInfo="pako inflate (from Nodeca project)"},{"../utils/common":41,"./adler32":43,"./crc32":45,"./inffast":48,"./inftrees":50}],50:[function(e,t,r){"use strict";var D=e("../utils/common"),F=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,0,0],N=[16,16,16,16,16,16,16,16,17,17,17,17,18,18,18,18,19,19,19,19,20,20,20,20,21,21,21,21,16,72,78],U=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577,0,0],P=[16,16,16,16,17,17,18,18,19,19,20,20,21,21,22,22,23,23,24,24,25,25,26,26,27,27,28,28,29,29,64,64];t.exports=function(e,t,r,n,i,s,a,o){var h,u,l,f,c,d,p,m,_,g=o.bits,b=0,v=0,y=0,w=0,k=0,x=0,S=0,z=0,C=0,E=0,A=null,I=0,O=new D.Buf16(16),B=new D.Buf16(16),R=null,T=0;for(b=0;b<=15;b++)O[b]=0;for(v=0;v<n;v++)O[t[r+v]]++;for(k=g,w=15;1<=w&&0===O[w];w--);if(w<k&&(k=w),0===w)return i[s++]=20971520,i[s++]=20971520,o.bits=1,0;for(y=1;y<w&&0===O[y];y++);for(k<y&&(k=y),b=z=1;b<=15;b++)if(z<<=1,(z-=O[b])<0)return-1;if(0<z&&(0===e||1!==w))return-1;for(B[1]=0,b=1;b<15;b++)B[b+1]=B[b]+O[b];for(v=0;v<n;v++)0!==t[r+v]&&(a[B[t[r+v]]++]=v);if(d=0===e?(A=R=a,19):1===e?(A=F,I-=257,R=N,T-=257,256):(A=U,R=P,-1),b=y,c=s,S=v=E=0,l=-1,f=(C=1<<(x=k))-1,1===e&&852<C||2===e&&592<C)return 1;for(;;){for(p=b-S,_=a[v]<d?(m=0,a[v]):a[v]>d?(m=R[T+a[v]],A[I+a[v]]):(m=96,0),h=1<<b-S,y=u=1<<x;i[c+(E>>S)+(u-=h)]=p<<24|m<<16|_|0,0!==u;);for(h=1<<b-1;E&h;)h>>=1;if(0!==h?(E&=h-1,E+=h):E=0,v++,0==--O[b]){if(b===w)break;b=t[r+a[v]]}if(k<b&&(E&f)!==l){for(0===S&&(S=k),c+=y,z=1<<(x=b-S);x+S<w&&!((z-=O[x+S])<=0);)x++,z<<=1;if(C+=1<<x,1===e&&852<C||2===e&&592<C)return 1;i[l=E&f]=k<<24|x<<16|c-s|0}}return 0!==E&&(i[c+E]=b-S<<24|64<<16|0),o.bits=k,0}},{"../utils/common":41}],51:[function(e,t,r){"use strict";t.exports={2:"need dictionary",1:"stream end",0:"","-1":"file error","-2":"stream error","-3":"data error","-4":"insufficient memory","-5":"buffer error","-6":"incompatible version"}},{}],52:[function(e,t,r){"use strict";var i=e("../utils/common"),o=0,h=1;function n(e){for(var t=e.length;0<=--t;)e[t]=0}var s=0,a=29,u=256,l=u+1+a,f=30,c=19,_=2*l+1,g=15,d=16,p=7,m=256,b=16,v=17,y=18,w=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0],k=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13],x=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7],S=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],z=new Array(2*(l+2));n(z);var C=new Array(2*f);n(C);var E=new Array(512);n(E);var A=new Array(256);n(A);var I=new Array(a);n(I);var O,B,R,T=new Array(f);function D(e,t,r,n,i){this.static_tree=e,this.extra_bits=t,this.extra_base=r,this.elems=n,this.max_length=i,this.has_stree=e&&e.length}function F(e,t){this.dyn_tree=e,this.max_code=0,this.stat_desc=t}function N(e){return e<256?E[e]:E[256+(e>>>7)]}function U(e,t){e.pending_buf[e.pending++]=255&t,e.pending_buf[e.pending++]=t>>>8&255}function P(e,t,r){e.bi_valid>d-r?(e.bi_buf|=t<<e.bi_valid&65535,U(e,e.bi_buf),e.bi_buf=t>>d-e.bi_valid,e.bi_valid+=r-d):(e.bi_buf|=t<<e.bi_valid&65535,e.bi_valid+=r)}function L(e,t,r){P(e,r[2*t],r[2*t+1])}function j(e,t){for(var r=0;r|=1&e,e>>>=1,r<<=1,0<--t;);return r>>>1}function Z(e,t,r){var n,i,s=new Array(g+1),a=0;for(n=1;n<=g;n++)s[n]=a=a+r[n-1]<<1;for(i=0;i<=t;i++){var o=e[2*i+1];0!==o&&(e[2*i]=j(s[o]++,o))}}function W(e){var t;for(t=0;t<l;t++)e.dyn_ltree[2*t]=0;for(t=0;t<f;t++)e.dyn_dtree[2*t]=0;for(t=0;t<c;t++)e.bl_tree[2*t]=0;e.dyn_ltree[2*m]=1,e.opt_len=e.static_len=0,e.last_lit=e.matches=0}function M(e){8<e.bi_valid?U(e,e.bi_buf):0<e.bi_valid&&(e.pending_buf[e.pending++]=e.bi_buf),e.bi_buf=0,e.bi_valid=0}function H(e,t,r,n){var i=2*t,s=2*r;return e[i]<e[s]||e[i]===e[s]&&n[t]<=n[r]}function G(e,t,r){for(var n=e.heap[r],i=r<<1;i<=e.heap_len&&(i<e.heap_len&&H(t,e.heap[i+1],e.heap[i],e.depth)&&i++,!H(t,n,e.heap[i],e.depth));)e.heap[r]=e.heap[i],r=i,i<<=1;e.heap[r]=n}function K(e,t,r){var n,i,s,a,o=0;if(0!==e.last_lit)for(;n=e.pending_buf[e.d_buf+2*o]<<8|e.pending_buf[e.d_buf+2*o+1],i=e.pending_buf[e.l_buf+o],o++,0===n?L(e,i,t):(L(e,(s=A[i])+u+1,t),0!==(a=w[s])&&P(e,i-=I[s],a),L(e,s=N(--n),r),0!==(a=k[s])&&P(e,n-=T[s],a)),o<e.last_lit;);L(e,m,t)}function Y(e,t){var r,n,i,s=t.dyn_tree,a=t.stat_desc.static_tree,o=t.stat_desc.has_stree,h=t.stat_desc.elems,u=-1;for(e.heap_len=0,e.heap_max=_,r=0;r<h;r++)0!==s[2*r]?(e.heap[++e.heap_len]=u=r,e.depth[r]=0):s[2*r+1]=0;for(;e.heap_len<2;)s[2*(i=e.heap[++e.heap_len]=u<2?++u:0)]=1,e.depth[i]=0,e.opt_len--,o&&(e.static_len-=a[2*i+1]);for(t.max_code=u,r=e.heap_len>>1;1<=r;r--)G(e,s,r);for(i=h;r=e.heap[1],e.heap[1]=e.heap[e.heap_len--],G(e,s,1),n=e.heap[1],e.heap[--e.heap_max]=r,e.heap[--e.heap_max]=n,s[2*i]=s[2*r]+s[2*n],e.depth[i]=(e.depth[r]>=e.depth[n]?e.depth[r]:e.depth[n])+1,s[2*r+1]=s[2*n+1]=i,e.heap[1]=i++,G(e,s,1),2<=e.heap_len;);e.heap[--e.heap_max]=e.heap[1],function(e,t){var r,n,i,s,a,o,h=t.dyn_tree,u=t.max_code,l=t.stat_desc.static_tree,f=t.stat_desc.has_stree,c=t.stat_desc.extra_bits,d=t.stat_desc.extra_base,p=t.stat_desc.max_length,m=0;for(s=0;s<=g;s++)e.bl_count[s]=0;for(h[2*e.heap[e.heap_max]+1]=0,r=e.heap_max+1;r<_;r++)p<(s=h[2*h[2*(n=e.heap[r])+1]+1]+1)&&(s=p,m++),h[2*n+1]=s,u<n||(e.bl_count[s]++,a=0,d<=n&&(a=c[n-d]),o=h[2*n],e.opt_len+=o*(s+a),f&&(e.static_len+=o*(l[2*n+1]+a)));if(0!==m){do{for(s=p-1;0===e.bl_count[s];)s--;e.bl_count[s]--,e.bl_count[s+1]+=2,e.bl_count[p]--,m-=2}while(0<m);for(s=p;0!==s;s--)for(n=e.bl_count[s];0!==n;)u<(i=e.heap[--r])||(h[2*i+1]!==s&&(e.opt_len+=(s-h[2*i+1])*h[2*i],h[2*i+1]=s),n--)}}(e,t),Z(s,u,e.bl_count)}function X(e,t,r){var n,i,s=-1,a=t[1],o=0,h=7,u=4;for(0===a&&(h=138,u=3),t[2*(r+1)+1]=65535,n=0;n<=r;n++)i=a,a=t[2*(n+1)+1],++o<h&&i===a||(o<u?e.bl_tree[2*i]+=o:0!==i?(i!==s&&e.bl_tree[2*i]++,e.bl_tree[2*b]++):o<=10?e.bl_tree[2*v]++:e.bl_tree[2*y]++,s=i,u=(o=0)===a?(h=138,3):i===a?(h=6,3):(h=7,4))}function V(e,t,r){var n,i,s=-1,a=t[1],o=0,h=7,u=4;for(0===a&&(h=138,u=3),n=0;n<=r;n++)if(i=a,a=t[2*(n+1)+1],!(++o<h&&i===a)){if(o<u)for(;L(e,i,e.bl_tree),0!=--o;);else 0!==i?(i!==s&&(L(e,i,e.bl_tree),o--),L(e,b,e.bl_tree),P(e,o-3,2)):o<=10?(L(e,v,e.bl_tree),P(e,o-3,3)):(L(e,y,e.bl_tree),P(e,o-11,7));s=i,u=(o=0)===a?(h=138,3):i===a?(h=6,3):(h=7,4)}}n(T);var q=!1;function J(e,t,r,n){P(e,(s<<1)+(n?1:0),3),function(e,t,r,n){M(e),n&&(U(e,r),U(e,~r)),i.arraySet(e.pending_buf,e.window,t,r,e.pending),e.pending+=r}(e,t,r,!0)}r._tr_init=function(e){q||(function(){var e,t,r,n,i,s=new Array(g+1);for(n=r=0;n<a-1;n++)for(I[n]=r,e=0;e<1<<w[n];e++)A[r++]=n;for(A[r-1]=n,n=i=0;n<16;n++)for(T[n]=i,e=0;e<1<<k[n];e++)E[i++]=n;for(i>>=7;n<f;n++)for(T[n]=i<<7,e=0;e<1<<k[n]-7;e++)E[256+i++]=n;for(t=0;t<=g;t++)s[t]=0;for(e=0;e<=143;)z[2*e+1]=8,e++,s[8]++;for(;e<=255;)z[2*e+1]=9,e++,s[9]++;for(;e<=279;)z[2*e+1]=7,e++,s[7]++;for(;e<=287;)z[2*e+1]=8,e++,s[8]++;for(Z(z,l+1,s),e=0;e<f;e++)C[2*e+1]=5,C[2*e]=j(e,5);O=new D(z,w,u+1,l,g),B=new D(C,k,0,f,g),R=new D(new Array(0),x,0,c,p)}(),q=!0),e.l_desc=new F(e.dyn_ltree,O),e.d_desc=new F(e.dyn_dtree,B),e.bl_desc=new F(e.bl_tree,R),e.bi_buf=0,e.bi_valid=0,W(e)},r._tr_stored_block=J,r._tr_flush_block=function(e,t,r,n){var i,s,a=0;0<e.level?(2===e.strm.data_type&&(e.strm.data_type=function(e){var t,r=4093624447;for(t=0;t<=31;t++,r>>>=1)if(1&r&&0!==e.dyn_ltree[2*t])return o;if(0!==e.dyn_ltree[18]||0!==e.dyn_ltree[20]||0!==e.dyn_ltree[26])return h;for(t=32;t<u;t++)if(0!==e.dyn_ltree[2*t])return h;return o}(e)),Y(e,e.l_desc),Y(e,e.d_desc),a=function(e){var t;for(X(e,e.dyn_ltree,e.l_desc.max_code),X(e,e.dyn_dtree,e.d_desc.max_code),Y(e,e.bl_desc),t=c-1;3<=t&&0===e.bl_tree[2*S[t]+1];t--);return e.opt_len+=3*(t+1)+5+5+4,t}(e),i=e.opt_len+3+7>>>3,(s=e.static_len+3+7>>>3)<=i&&(i=s)):i=s=r+5,r+4<=i&&-1!==t?J(e,t,r,n):4===e.strategy||s===i?(P(e,2+(n?1:0),3),K(e,z,C)):(P(e,4+(n?1:0),3),function(e,t,r,n){var i;for(P(e,t-257,5),P(e,r-1,5),P(e,n-4,4),i=0;i<n;i++)P(e,e.bl_tree[2*S[i]+1],3);V(e,e.dyn_ltree,t-1),V(e,e.dyn_dtree,r-1)}(e,e.l_desc.max_code+1,e.d_desc.max_code+1,a+1),K(e,e.dyn_ltree,e.dyn_dtree)),W(e),n&&M(e)},r._tr_tally=function(e,t,r){return e.pending_buf[e.d_buf+2*e.last_lit]=t>>>8&255,e.pending_buf[e.d_buf+2*e.last_lit+1]=255&t,e.pending_buf[e.l_buf+e.last_lit]=255&r,e.last_lit++,0===t?e.dyn_ltree[2*r]++:(e.matches++,t--,e.dyn_ltree[2*(A[r]+u+1)]++,e.dyn_dtree[2*N(t)]++),e.last_lit===e.lit_bufsize-1},r._tr_align=function(e){P(e,2,3),L(e,m,z),function(e){16===e.bi_valid?(U(e,e.bi_buf),e.bi_buf=0,e.bi_valid=0):8<=e.bi_valid&&(e.pending_buf[e.pending++]=255&e.bi_buf,e.bi_buf>>=8,e.bi_valid-=8)}(e)}},{"../utils/common":41}],53:[function(e,t,r){"use strict";t.exports=function(){this.input=null,this.next_in=0,this.avail_in=0,this.total_in=0,this.output=null,this.next_out=0,this.avail_out=0,this.total_out=0,this.msg="",this.state=null,this.data_type=2,this.adler=0}},{}],54:[function(e,t,r){(function(e){!function(r,n){"use strict";if(!r.setImmediate){var i,s,t,a,o=1,h={},u=!1,l=r.document,e=Object.getPrototypeOf&&Object.getPrototypeOf(r);e=e&&e.setTimeout?e:r,i="[object process]"==={}.toString.call(r.process)?function(e){process.nextTick(function(){c(e)})}:function(){if(r.postMessage&&!r.importScripts){var e=!0,t=r.onmessage;return r.onmessage=function(){e=!1},r.postMessage("","*"),r.onmessage=t,e}}()?(a="setImmediate$"+Math.random()+"$",r.addEventListener?r.addEventListener("message",d,!1):r.attachEvent("onmessage",d),function(e){r.postMessage(a+e,"*")}):r.MessageChannel?((t=new MessageChannel).port1.onmessage=function(e){c(e.data)},function(e){t.port2.postMessage(e)}):l&&"onreadystatechange"in l.createElement("script")?(s=l.documentElement,function(e){var t=l.createElement("script");t.onreadystatechange=function(){c(e),t.onreadystatechange=null,s.removeChild(t),t=null},s.appendChild(t)}):function(e){setTimeout(c,0,e)},e.setImmediate=function(e){"function"!=typeof e&&(e=new Function(""+e));for(var t=new Array(arguments.length-1),r=0;r<t.length;r++)t[r]=arguments[r+1];var n={callback:e,args:t};return h[o]=n,i(o),o++},e.clearImmediate=f}function f(e){delete h[e]}function c(e){if(u)setTimeout(c,0,e);else{var t=h[e];if(t){u=!0;try{!function(e){var t=e.callback,r=e.args;switch(r.length){case 0:t();break;case 1:t(r[0]);break;case 2:t(r[0],r[1]);break;case 3:t(r[0],r[1],r[2]);break;default:t.apply(n,r)}}(t)}finally{f(e),u=!1}}}}function d(e){e.source===r&&"string"==typeof e.data&&0===e.data.indexOf(a)&&c(+e.data.slice(a.length))}}("undefined"==typeof self?void 0===e?this:e:self)}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}]},{},[10])(10)});
function createCoverReader({zip, getPdfEngine, createCanvas, parseXml, decodeImage}) {
  const MiB = 1024 * 1024;
  const longEdge = 1800;
  const rasterTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
  const localOrigin = 'https://epub.local';
  const utf8 = new TextDecoder();
  const named = (root, name) => [...root.getElementsByTagNameNS('*', name)];

  function readText(bytes) {
    const body = utf8.decode(bytes).replace(/<!DOCTYPE[^>\[]*>/gi, '');
    if (/<!\s*(?:DOCTYPE|ENTITY)/i.test(body)) throw Error('Ce document contient une déclaration XML non prise en charge.');
    const root = parseXml(body);
    if (named(root, 'parsererror').length) throw Error('Les métadonnées du livre sont illisibles.');
    return root;
  }

  function archivePath(base, reference) {
    if (!reference) return '';
    try {
      const current = new URL(base.split('/').map(encodeURIComponent).join('/'), localOrigin + '/');
      const path = new URL(reference, current);
      if (path.origin !== localOrigin || path.username || path.password || path.search) return '';
      return path.pathname.slice(1).split('/').map(part => {
        const name = decodeURIComponent(part);
        if (name === '.' || name === '..' || /[/\\\u0000]/u.test(name)) throw Error('Chemin non valide.');
        return name;
      }).join('/');
    } catch { return ''; }
  }

  async function readEntry(archive, path, limit) {
    const entry = path && archive.file(path);
    if (!entry || (entry.unsafeOriginalName && entry.unsafeOriginalName !== path)) return null;
    return new Promise((resolve, reject) => {
      let size = 0;
      const chunks = [];
      const stream = entry.internalStream('uint8array');
      stream.on('data', chunk => {
        size += chunk.byteLength;
        if (size > limit) {
          stream.pause();
          reject(Error('Cette ressource du livre est trop volumineuse pour l’aperçu.'));
        } else {
          chunks.push(chunk);
        }
      }).on('error', reject).on('end', () => {
        if (size > limit) return;
        const bytes = new Uint8Array(size);
        let offset = 0;
        for (const chunk of chunks) {
          bytes.set(chunk, offset);
          offset += chunk.length;
        }
        resolve(bytes);
      }).resume();
    });
  }

  function findIsbn(value) {
    const candidates = String(value || '').match(/(?:\b97[89](?:[ \t-]*\d){10}\b|\b\d(?:[ \t-]*\d){8}[ \t-]*[\dXx]\b)/g) || [];
    return candidates.map(value => value.replace(/[ \t-]/g, '').toUpperCase()).find(value => {
      const sum = [...value].reduce((total, digit, index) => {
        const weight = value.length === 10 ? 10 - index : index % 2 ? 3 : 1;
        return total + weight * (digit === 'X' ? 10 : Number(digit));
      }, 0);
      return sum % (value.length === 10 ? 11 : 10) === 0;
    }) || '';
  }

  async function epubPackage(bytes) {
    const archive = await zip.loadAsync(bytes);
    const mime = await readEntry(archive, 'mimetype', 256);
    if (utf8.decode(mime || new Uint8Array()) !== 'application/epub+zip') throw Error('Ce fichier ZIP n’est pas un EPUB reconnu.');
    const container = await readEntry(archive, 'META-INF/container.xml', 256 * 1024);
    if (!container) throw Error('Le sommaire de l’EPUB est introuvable.');
    const rootfile = named(readText(container), 'rootfile').find(node => node.getAttribute('full-path'));
    const opfPath = archivePath('', rootfile?.getAttribute('full-path'));
    const opfFile = await readEntry(archive, opfPath, 2 * MiB);
    if (!opfFile) throw Error('Le fichier de métadonnées de l’EPUB est introuvable.');
    const opf = readText(opfFile);
    return {archive, opf, opfPath};
  }

  async function openEpub(bytes,cancelled = () => false) {
    const {archive, opf, opfPath} = await epubPackage(bytes);
    const items = new Map(named(opf, 'item').map(node => [node.getAttribute('id'), node]));
    const paths = named(opf, 'itemref').map(ref => items.get(ref.getAttribute('idref')))
      .filter(item => item && /html/i.test(item.getAttribute('media-type')))
      .map(item => archivePath(opfPath, item.getAttribute('href'))).filter(Boolean);
    if (!paths.length) throw Error('Aucun chapitre lisible dans cet EPUB.');
    const chapterTitles = [];
    const manifest = [...items.values()];
    const nav = manifest.find(item => item.getAttribute('properties')?.split(/\s+/).includes('nav'));
    const ncx = manifest.find(item => item.getAttribute('media-type') === 'application/x-dtbncx+xml');
    const titles = new Map();
    const chapters = [];
    const seenDestinations = new Set();
    for (const item of [nav,ncx].filter(Boolean)) {
      try {
        const path = archivePath(opfPath,item.getAttribute('href'));
        const data = await readEntry(archive,path,2 * MiB);
        if (!data) continue;
        const toc = readText(data);
        const menu = named(toc,'nav').find(el => /(?:^|\s)toc(?:\s|$)/.test(el.getAttribute('epub:type') || '') || el.getAttribute('role') === 'doc-toc');
        const entries = menu ? named(menu,'a') : named(toc,'navPoint');
        for (const entry of entries) {
          const ref = entry.getAttribute('href') || named(entry,'content')[0]?.getAttribute('src');
          const target = archivePath(path,ref);
          const title = (entry.localName === 'a' ? entry : named(entry,'navLabel')[0])?.textContent?.trim();
          const position = paths.indexOf(target);
          if (!title || position < 0) continue;
          let anchor = '';
          try { anchor = decodeURIComponent(ref.split('#')[1] || ''); } catch { continue; }
          const key = position+'#'+anchor;
          if (seenDestinations.has(key)) continue;
          seenDestinations.add(key);
          const label = title.slice(0,180);
          if (!titles.has(target)) titles.set(target,label);
          chapters.push({position,anchor,label});
        }
        if (chapters.length) break;
      } catch { /* A damaged optional table of contents does not prevent reading the spine. */ }
    }
    // The spine orders documents. A title page, map or appendix can be in both the spine
    // and the table of contents without being a chapter of the novel.
    const sectionInfo = [];
    const ordered = chapters.sort((a,b) => a.position-b.position);
    const clean = value => String(value || '').replace(/\s+/gu,' ').trim();
    const normal = value => clean(value).normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
    const bookTitle = normal(named(opf,'metadata')[0] && named(named(opf,'metadata')[0],'title')[0]?.textContent);
    const chapterPrefix = /^(?:chapitre|chapter|cap[ií]tulo|capitolo|kapitel)\s+([0-9]+(?:[a-z])?|[ivxlcdm]+)(?=$|[\s.:–—-])/iu;
    const namedMatter = /^(?:couverture|cover|titre|page de titre|title page|titre original|copyright|mentions l[eé]gales|d[eé]dicace|dedication|sommaire|table des mati[eè]res|contents|table of contents|carte|map|cartes|l['’]aut(?:eur|rice)|about the author|biographie|prologue|[eé]pilogue|remerciements|acknowledg(?:e)?ments|appendice|appendix|avant-propos|pr[eé]face|postface|notes|glossaire|glossary)$/iu;
    const typeTokens = el => clean(el?.getAttributeNS('http://www.idpf.org/2007/ops','type') || el?.getAttribute('epub:type')).split(' ');
    const weights = [];
    for (const [position,path] of paths.entries()) {
      if (cancelled()) throw new DOMException('Lecture fermée.','AbortError');
      const inToc = ordered.filter(entry => entry.position === position);
      let body, heading, title, words=0, types=[];
      try {
        const data = await readEntry(archive,path,10*MiB);
        if (data) {
          const doc = readText(data);
          body = named(doc,'body')[0];
          if (body) {
            heading = clean(body.querySelector('h1,h2')?.textContent);
            title = clean(named(doc,'title')[0]?.textContent);
            const primary = body.querySelector('section,article,nav');
            types = [...typeTokens(body),...typeTokens(primary)];
            words = clean(body.textContent).match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu)?.length || 0;
          }
        }
      } catch { /* Report a missing or damaged section when the reader opens it. */ }
      const label = clean(inToc[0]?.label || heading || (normal(title) !== bookTitle && title) || '');
      const semanticMatter = types.some(t => /^(?:cover|frontmatter|backmatter|preamble|titlepage|copyright-page|dedication|toc|appendix|acknowledgments|colophon|prologue|epilogue|preface|part)$/.test(t));
      const explicit = types.includes('chapter') || chapterPrefix.test(label);
      const isMatter = !explicit && (semanticMatter || namedMatter.test(label));
      const entries = inToc.filter(entry => !namedMatter.test(clean(entry.label)));
      const isPlate = !!body && words === 0 && [...body.getElementsByTagName('*')].filter(el => ['img','image'].includes(el.localName)).length === 1;
      const kind = isMatter || isPlate && !explicit && !entries.length ? 'matter' : 'body';
      const candidates = kind === 'body' ? entries : [];
      if (!candidates.length && kind === 'body' && (explicit || !ordered.length && (heading || label))) {
        candidates.push({position,anchor:'',label:heading || label});
      }
      const cover = types.includes('cover') || /^(?:couverture|cover)$/iu.test(label);
      const center = kind === 'matter' && !isPlate && !types.includes('toc') &&
        (types.some(type => ['frontmatter','preamble','copyright-page','dedication','titlepage'].includes(type)) ||
         /^(?:copyright|biographie|l['’]autrice|dédicace|page de titre)$/iu.test(label)) &&
        !/^(?:sommaire|table des matières|contents|table of contents)$/iu.test(label);
      const pageBreaks = body ? Array.from(body.querySelectorAll('[id]')).filter(el =>
        el.getAttribute('role') === 'doc-pagebreak' || typeTokens(el).includes('pagebreak')
      ).map(el => ({id:el.id,number:clean(el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent)}))
        .filter(entry => entry.number) : [];
      sectionInfo.push({kind,plate:isPlate,cover,center,label,chapters:candidates,pageBreaks});
      weights.push(Math.max(1,words));
    }
    const printedTotal = sectionInfo.reduce((last,info) => Math.max(last,...info.pageBreaks.map(item => Number(item.number)||0)),0);
    const tocChapters = sectionInfo.flatMap(info => info.chapters);
    tocChapters.forEach((chapter,i) => {
      chapter.number=i+1;
      chapter.printedNumber=clean(chapter.label).match(chapterPrefix)?.[1] || String(i+1);
    });
    const language = named(opf,'language')[0]?.textContent?.trim();
    const editionStyles = createEpubEditionStyles(async (path,ref,cache,parse) => {
      const file = archivePath(path,ref);
      if (!file) return [];
      if (!cache.has(file)) cache.set(file,readEntry(archive,file,512*1024).then(bytes => bytes ? parse(utf8.decode(bytes)) : []).catch(() => []));
      return cache.get(file);
    });
    return {count:paths.length,chapterTitles,weights,tocChapters,sectionInfo,printedTotal,language,async read(index) {
      const data = await readEntry(archive, paths[index], 10 * MiB);
      if (!data) throw Error('Ce chapitre est introuvable.');
      const doc = readText(data);
      const body = named(doc, 'body')[0];
      if (!body) throw Error('Ce chapitre est illisible.');
      const heading = [...body.getElementsByTagName('*')].find(node => /^h[12]$/i.test(node.localName));
      chapterTitles[index] = heading?.textContent?.trim().slice(0,180) || titles.get(paths[index]) || named(doc,'title')[0]?.textContent?.trim().slice(0,180) || '';
      const fragment = document.createDocumentFragment();
      const info = sectionInfo[index];
      const applyEdition = await editionStyles(doc,paths[index],info);
      const frame = document.createElement('div');
      frame.className='edition-sheet';
      if (info.center) frame.dataset.editionCenter='';
      if (info.kind === 'matter' && !info.plate) applyEdition(body,frame);
      fragment.append(frame);
      const allowed = new Set('p div section article h1 h2 h3 h4 h5 h6 span em i strong b br hr ol ul li blockquote sup sub pre figure figcaption table tr td th tbody'.split(' '));
      async function append(source, target) {
        for (const child of source.childNodes) {
          if (child.nodeType === 3) { target.append(document.createTextNode(child.nodeValue)); continue; }
          if (child.nodeType !== 1) continue;
          const tag = child.localName.toLowerCase();
          if (['script','style','noscript','iframe','object','embed','form'].includes(tag)) continue;
          if (tag === 'img' || tag === 'image') {
            const ref = child.getAttribute('src') || child.getAttribute('href') || child.getAttribute('xlink:href');
            const image = await readEntry(archive, archivePath(paths[index], ref), 24 * MiB);
            const spec = image && imageSpec(image);
            if (spec) {
              const node = document.createElement('img');
              node.alt = child.getAttribute('alt') || '';
              node.width = spec.width;
              node.height = spec.height;
              node.src = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(reader.error);
                reader.readAsDataURL(new Blob([image], {type: spec.mime}));
              });
              applyEdition(child,node);
              target.append(node);
            }
            continue;
          }
          const ref = tag === 'a' && child.getAttribute('href');
          const dest = ref && archivePath(paths[index],ref);
          const next = allowed.has(tag) || (dest && paths.includes(dest)) ? document.createElement(tag) :
            child.getAttribute('id') || child.getAttribute('name') ? document.createElement('span') : target;
          if (tag === 'a' && next !== target) {
            next.href = '#';
            next.dataset.epubSection = String(paths.indexOf(dest));
            try { next.dataset.epubTarget = decodeURIComponent(ref.split('#')[1] || ''); } catch { next.dataset.epubTarget = ''; }
          }
          if (next !== target) {
            applyEdition(child,next);
            if (child === heading) next.dataset.chapterHeading = '';
            const sourceId = child.getAttribute('id') || child.getAttribute('name');
            if (sourceId) next.dataset.epubId = sourceId;
            target.append(next);
          }
          await append(child, next);
        }
      }
      await append(body, frame);
      return fragment;
    }};
  }

  async function fromEpub(bytes) {
    const {archive, opf, opfPath} = await epubPackage(bytes);
    const metadata = named(opf, 'metadata')[0] || opf;
    const properties = named(metadata, 'meta');
    const refine = (entry, property) => {
      const id = entry.getAttribute('id');
      return id && properties.find(meta => meta.getAttribute('refines') === '#' + id && meta.getAttribute('property') === property)?.textContent.trim();
    };
    const calibre = name => properties.find(meta => meta.getAttribute('name') === 'calibre:' + name)?.getAttribute('content')?.trim();
    const manifest = named(opf, 'manifest')[0];
    const items = manifest ? named(manifest, 'item') : [];
    const meta = properties.find(node => node.getAttribute('name') === 'cover');
    const declared = items.find(item => item.getAttribute('properties')?.split(/\s+/).includes('cover-image'))
      || (meta && items.find(item => item.getAttribute('id') === meta.getAttribute('content')));
    const guide = named(opf, 'reference').find(node => node.getAttribute('type') === 'cover');
    const titles = named(metadata, 'title');
    const creators = named(metadata, 'creator');
    const title = (titles.find(node => refine(node, 'title-type') === 'main') || titles[0])?.textContent.trim() || '';
    const author = (creators.find(node =>
      (refine(node, 'role') || node.getAttribute('opf:role')) === 'aut') || creators[0])?.textContent.trim() || '';
    const identifiers = named(metadata, 'identifier');
    const primary = named(opf, 'package')[0]?.getAttribute('unique-identifier');
    const isbn = findIsbn(identifiers.find(node => node.getAttribute('id') === primary)?.textContent)
      || identifiers.map(node => findIsbn(node.textContent)).find(Boolean) || '';
    const collections = properties.filter(node => node.getAttribute('property') === 'belongs-to-collection');
    const seriesMeta = collections.find(node => refine(node, 'collection-type') === 'series')
      || (collections.length === 1 && !refine(collections[0], 'collection-type') ? collections[0] : null);
    const series = seriesMeta?.textContent.trim() || calibre('series') || '';
    const volume = (seriesMeta && refine(seriesMeta, 'group-position')) || calibre('series_index') || '';
    const summary = named(metadata, 'description')[0]?.textContent.replace(/<[^>]+>/g, ' ').trim().slice(0, 1800) || '';
    let cover = null;
    let coverIssue = '';

    for (const entry of [declared, guide].filter(Boolean)) {
      const path = archivePath(opfPath, entry.getAttribute('href'));
      if (!path) continue;
      try {
        const item = items.find(item => archivePath(opfPath, item.getAttribute('href')) === path);
        const type = item?.getAttribute('media-type') || '';
        if (type === 'application/xhtml+xml' || type === 'image/svg+xml' || /\.(?:xhtml|html|svg)$/i.test(path)) {
          const wrapper = await readEntry(archive, path, 512 * 1024);
          if (wrapper) {
            const doc = readText(wrapper);
            const image = [...named(doc, 'img'), ...named(doc, 'image')][0];
            const imagePath = archivePath(path, image?.getAttribute('src') || image?.getAttribute('href') || image?.getAttribute('xlink:href'));
            if (imagePath) cover = await readEntry(archive, imagePath, 24 * MiB);
          }
        } else if (!type || rasterTypes.has(type)) {
          cover = await readEntry(archive, path, 24 * MiB);
        }
        if (cover) break;
      } catch (error) {
        coverIssue = error.message;
      }
    }

    return {type: 'EPUB', title, author, isbn, series, volume, summary, subjects: named(metadata, 'subject').slice(0,100).map(node => node.textContent.trim().slice(0,160)).filter(Boolean), cover, coverIssue};
  }

  async function fromPdf(bytes, track) {
    const pdf = await getPdfEngine();
    const task = pdf.getDocument({
      data: bytes,
      isEvalSupported: false,
      useWasm: false,
      useWorkerFetch: false,
      useSystemFonts: true,
      isOffscreenCanvasSupported: false,
      maxImageSize: 40000000,
      canvasMaxAreaInBytes: 64000000,
    });
    track(task);
    const document = await task.promise;
    const metadata = await document.getMetadata().catch(() => null);
    const clean = value => typeof value === 'string' ? value.trim() : '';
    const title = clean(metadata?.info?.Title);
    const author = clean(metadata?.info?.Author);
    const isbn = findIsbn(metadata?.metadata?.get('dc:identifier'));
    return {type: 'PDF', document, title, author, isbn, subjects: String(metadata?.info?.Keywords || '').slice(0,5000).split(/[,;]/).map(item => item.trim()).filter(Boolean), TextLayer: pdf.TextLayer};
  }

  function formatOf(bytes) {
    if (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) return 'EPUB';
    if (utf8.decode(bytes.subarray(0, 1024)).includes('%PDF-')) return 'PDF';
    return '';
  }

  function imageSpec(bytes) {
    if (bytes.length < 24) return null;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const word = (start, end) => utf8.decode(bytes.subarray(start, end));
    const image = (mime, width, height) => width > 0 && height > 0 ? {mime, width, height} : null;
    if (view.getUint32(0) === 0x89504e47 && view.getUint32(4) === 0x0d0a1a0a && word(12, 16) === 'IHDR') {
      return image('image/png', view.getUint32(16), view.getUint32(20));
    }
    if (word(0, 6) === 'GIF89a' || word(0, 6) === 'GIF87a') {
      return image('image/gif', view.getUint16(6, true), view.getUint16(8, true));
    }
    if (word(0, 4) === 'RIFF' && word(8, 12) === 'WEBP' && bytes.length >= 30) {
      const kind = word(12, 16);
      if (kind === 'VP8X') {
        return image('image/webp', 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16), 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16));
      }
      if (kind === 'VP8 ' && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
        return image('image/webp', view.getUint16(26, true) & 0x3fff, view.getUint16(28, true) & 0x3fff);
      }
      if (kind === 'VP8L' && bytes[20] === 0x2f) {
        const bits = view.getUint32(21, true);
        return image('image/webp', 1 + (bits & 0x3fff), 1 + ((bits >>> 14) & 0x3fff));
      }
      return null;
    }
    if (view.getUint16(0) === 0xffd8) {
      let pos = 2;
      while (pos + 4 < bytes.length) {
        if (bytes[pos++] !== 0xff) return null;
        while (bytes[pos] === 0xff) pos++;
        const code = bytes[pos++];
        if (code === 0xda || code === 0xd9 || pos + 2 > bytes.length) return null;
        const size = view.getUint16(pos);
        if (size < 2 || pos + size > bytes.length) return null;
        if (size >= 8 && code >= 0xc0 && code <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(code)) {
          return image('image/jpeg', view.getUint16(pos + 5), view.getUint16(pos + 3));
        }
        pos += size;
      }
    }
    return null;
  }

  function fit(width, height, max) {
    const scale = Math.min(1, max / Math.max(width, height));
    return [Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale))];
  }

  async function imageCanvas(bytes) {
    const spec = imageSpec(bytes);
    if (!spec) throw Error('Choisis une image JPEG, PNG, WebP ou GIF.');
    if (spec.width * spec.height > 48000000 || Math.max(spec.width, spec.height) > 12000) throw Error('Les dimensions de cette image sont trop grandes pour l’aperçu.');
    const source = await decodeImage(new Blob([bytes], {type: spec.mime}));
    try {
      const [width, height] = fit(source.width, source.height, longEdge);
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = width !== source.width || height !== source.height;
      if (ctx.imageSmoothingEnabled) ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(source.native || source, 0, 0, width, height);
      return canvas;
    } finally {
      source.close?.();
    }
  }

  async function renderPage(pdf, number, size, trackRender = () => {}, TextLayer = null) {
    const page = await pdf.getPage(number);
    const bounds = page.getViewport({scale: 1});
    const viewport = page.getViewport({scale: size / Math.max(bounds.width, bounds.height)});
    if (Math.min(viewport.width, viewport.height) < 1 || !Number.isFinite(viewport.width + viewport.height)) throw Error('Cette page a des dimensions invalides.');
    const canvas = createCanvas(Math.round(viewport.width), Math.round(viewport.height));
    const context = canvas.getContext('2d', {alpha: Boolean(TextLayer), willReadFrequently: Boolean(TextLayer)});
    const task = page.render({canvas, canvasContext: context, viewport, background: '#FFFFFF'});
    trackRender(task);
    await task.promise;
    if (!TextLayer) return canvas;
    const result = document.createElement('div');
    result.className = 'pdf-page';
    result.style.setProperty('--pdf-ratio',String(canvas.width / canvas.height));
    result.append(canvas);
    try { applyPdfPaper(canvas,result); } catch { /* Keep the original raster if this device cannot allocate the theme layers. */ }
    try {
      const text = await page.getTextContent();
      if (!text.items.some(item => item.str?.trim())) return result;
      const layer = document.createElement('div');
      layer.className = 'textLayer';
      const pdfWidth = viewport.rotation % 180 ? viewport.rawDims.pageHeight : viewport.rawDims.pageWidth;
      layer.style.setProperty('--pdf-width', pdfWidth + 'px');
      layer.style.setProperty('--scale-round-x', '1px');
      layer.style.setProperty('--scale-round-y', '1px');
      result.append(layer);
      await new TextLayer({textContentSource:text,container:layer,viewport}).render();
    } catch {
      result.querySelector('.textLayer')?.remove();
    }
    return result;
  }

  function cropRectangle({data, width, height}, targetWidth, targetHeight) {
    const background = (x, y) => {
      const i = 4 * (y * width + x);
      return data[i + 3] <= 10 || (data[i] >= 248 && data[i + 1] >= 248 && data[i + 2] >= 248);
    };
    const blank = (length, visit) => {
      let marks = 0;
      for (let position = 0; position < length; position++) {
        if (!visit(position) && ++marks > Math.floor(length * 0.004)) return false;
      }
      return true;
    };
    const run = (length, check) => {
      let n = 0;
      const max = Math.floor(length * 0.24);
      while (n < max && check(n)) n++;
      return n < max ? n : 0;
    };
    const left = run(width, x => blank(height, y => background(x, y)));
    const right = run(width, x => blank(height, y => background(width - 1 - x, y)));
    const across = width - left - right;
    const top = run(height, y => blank(across, x => background(x + left, y)));
    const bottom = run(height, y => blank(across, x => background(x + left, height - 1 - y)));
    const x = Math.round(left * targetWidth / width);
    const y = Math.round(top * targetHeight / height);
    const croppedWidth = targetWidth - x - Math.round(right * targetWidth / width);
    const croppedHeight = targetHeight - y - Math.round(bottom * targetHeight / height);
    return {x, y, width: croppedWidth, height: croppedHeight};
  }

  function trimCover(source) {
    const {width, height} = source;
    const context = source.getContext('2d');
    const pixels = context.getImageData(0, 0, width, height);
    const area = cropRectangle(pixels, width, height);
    if (!area.x && !area.y && area.width === source.width && area.height === source.height) return source;
    const target = createCanvas(area.width, area.height);
    target.getContext('2d').putImageData(context.getImageData(area.x, area.y, area.width, area.height),0,0);
    return target;
  }

  return {openEpub, fromEpub, fromPdf, findIsbn, formatOf, imageCanvas, imageSpec, renderPage, cropRectangle, trimCover, longEdge};
}

// Earlier previews let users change the status of sample books, which saved these IDs locally.
const exampleBookIds = new Set([
  'public-0', 'public-1', 'public-2', 'public-3', 'public-4', 'public-5',
  'public-6', 'public-7', 'public-8', 'public-9', 'public-10', 'public-11',
  'example-0', 'example-1', 'example-2', 'example-3', 'example-yakuzas-2',
]);

async function loadLibraryStorage(root, storage) {
  const loading = root.querySelector('[data-storage-loading]');
  const recovery = root.querySelector('[data-storage-recovery]');
  const message = root.querySelector('[data-storage-recovery-message]');
  const retry = root.querySelector('[data-storage-retry]');
  const label = root.querySelector('[data-storage-retry-label]');

  for (;;) {
    try {
      const initial = await storage.load();
      loading.hidden = recovery.hidden = true;
      return initial;
    } catch (error) {
      root.dataset.storageState = 'unavailable';
      loading.hidden = true;
      recovery.hidden = false;
      message.textContent = error?.name === 'StorageBlockedError'
        ? 'Un autre onglet utilise le stockage de la bibliothèque. Ferme les autres onglets d’Entre les pages et réessaie.'
        : 'Le navigateur n’a pas pu accéder aux données de ta bibliothèque.';
      retry.disabled = false;
      label.textContent = 'Réessayer';
      window.lucide?.createIcons?.();
      await new Promise(resolve => retry.addEventListener('click', resolve, {once: true}));
      retry.disabled = true;
      label.textContent = 'Vérification…';
    }
  }
}

async function activateLibrary(root) {
  const find = (selector, parent = root) => parent.querySelector(selector);
  const all = (selector, parent = root) => [...parent.querySelectorAll(selector)];
  const {genres, families, unassigned} = JSON.parse(find('[data-catalogue]').textContent);
  const storage = typeof createReadingStorage === 'function' ? createReadingStorage(exampleBookIds) : createLibraryStorage();
  const alert = find('[data-storage-alert]');
  function showStorageError() {
    alert.hidden = false;
    alert.textContent = 'Le navigateur n’a pas pu enregistrer les données. Vérifie son espace de stockage et réessaie.';
  }
  const initial = await loadLibraryStorage(root, storage);
  const preferences = initial.preferences;
  let folders = initial.folders ?? [];
  const books = initial.books.filter(book => !exampleBookIds.has(book.id));
  const collator = new Intl.Collator('fr', {sensitivity: 'base', numeric: true});
  const key = value => value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr').replaceAll('œ','oe').replace(/[’']/g, ' ').trim();
  const unique = values => [...new Map(values.map(value => [key(value), value])).values()];
  const genreByName = new Map(genres.map(genre => [genre.name, genre]));
  const subgenresOf = genre => unique([...genre.groups.flatMap(id => families[id]), ...genre.observed]);
  const allSubgenres = unique([...Object.values(families).flat(), ...genres.flatMap(genre => genre.observed), ...unassigned]);
  const sorted = values => [...values].sort(collator.compare);
  const statuses = ['À lire', 'En cours', 'En pause', 'Terminé', 'Abandonné'];
  const libraryLists = {
    all: {
      title: 'Ma bibliothèque', action: 'Afficher tous mes livres', back: 'Revenir à ma bibliothèque',
      empty: 'Aucun livre dans la bibliothèque.', emptyDescription: 'Ajoute ton premier livre à ta bibliothèque.',
      includes: () => true,
    },
    pile: {
      title: 'Ma pile à lire', action: 'Ouvrir ma pile à lire', back: 'Revenir à ma pile à lire',
      empty: 'Aucun livre dans la pile à lire pour le moment.', emptyDescription: 'Ajoute un livre à ta pile à lire.',
      includes: book => book.status === 'À lire',
    },
    finished: {
      title: 'Mes livres lus', action: 'Afficher mes livres lus', back: 'Revenir à mes livres lus',
      empty: 'Aucun livre lu pour le moment.', emptyDescription: 'Les livres que tu marques comme terminés apparaîtront ici.',
      includes: book => book.status === 'Terminé',
    },
    favorites: {title: 'Coups de cœur', includes: book => book.coupDeCoeur === true},
  };
  const criteria = [
    {label: 'Genre et sous-genre', icon: 'tags', kinds: ['genre', 'subgenre']},
    {label: 'Tropes', icon: 'bookmark', kinds: ['trope']},
    {label: 'Statut de lecture', icon: 'book-open', kinds: ['status']},
    {label: 'Auteur et autrice', icon: 'user-round', kinds: ['author']},
  ];
  const options = {
    genre: sorted(genres.map(genre => genre.name)), subgenre: sorted(allSubgenres),
    trope: sorted(unique(books.flatMap(book => book.tropes))), status: statuses, author: sorted(unique(books.map(book => book.author).filter(Boolean))),
  };
  const bookTagOptions = {genres: options.genre, subgenres: options.subgenre, get tropes() { return options.trope; }};
  const emptyFilters = () => Object.fromEntries(Object.keys(options).map(kind => [kind, []]));
  const copy = filters => Object.fromEntries(Object.entries(filters).map(([kind, values]) => [kind, [...values]]));
  const countFilters = filters => Object.values(filters).filter(values => values.length).length;
  const organisePopover = find('[data-organise-popover]');
  const removalItems = find('[data-removal-items]');
  const removalGrid = find('[data-removal-grid]');
  const removeCount = find('[data-removal-count]');
  const removalSummary = find('[data-removal-summary]');
  const removalNote = find('[data-removal-folder-note]');
  const removalError = find('[data-removal-error]');
  const removalTrack = find('[data-removal-track]');
  const removalThumb = find('[data-removal-thumb]');
  const removalSelection = new Map();
  let removing = false;
  let removalDrag;
  let removalRequest;
  const organiseButton = find('[data-window-choice="organiser"]');
  const folderButton = find('[data-create-folder]');
  const filterNotice = find('[data-filter-notice]');
  const search = find('[data-library-search]');
  const sidebar = find('.library-sidebar');
  const sidebarLayer = find('[data-sidebar-layer]');
  const libraryMain = find('.library-main');
  const sidebarToggle = find('[data-window-choice="menu"]');
  const exitDialog = find('[data-exit-dialog]');
  const libraryTitle = find('[data-menu-page="home"]', sidebar);
  const libraryContent = find('[data-library-content]');
  const genreHeading = find('.genre-heading');
  const tabRow = find('[data-library-tabs]');
  const tabs = all('[data-library-tab]', tabRow);
  const listAccess = find('[data-open-collection-list]');
  const listAccessLabel = find('[data-collection-list-label]', listAccess);
  const grid = find('[data-genre-grid]');
  const results = find('[data-results]');
  const statusNotice = find('[data-status-notice]');
  const bookList = find('[data-book-list]');
  const resultsHeader = find('[data-results-header]');
  const searchEmpty = find('[data-search-empty]');
  const other = find('[data-other-view]');
  const otherBody = find('[data-other-body]');
  const addBookPage = find('[data-add-book-page]');
  const addBook = find('[data-view-choice="add"]');
  const catalogueView = find('[data-catalogue-view]');
  const catalogueTitle = find('#bibliotheque-app-catalogue-title');
  const catalogueSearchForm = find('[data-catalogue-search-form]');
  const bookSortChoices = all('[data-book-sort]');
  const catalogueSearch = find('[data-catalogue-search]');
  const catalogueCount = find('[data-catalogue-count]');
  const catalogueOutput = find('[data-catalogue-books]');
  const catalogueBack = find('[data-catalogue-back]');
  const favoriteControl = find('[data-catalogue-favorite-template]').content.cloneNode(true);
  const catalogueFavorite = find('[data-catalogue-favorite]', favoriteControl);
  const favoriteCategory = {label: 'Coups de cœur', icon: 'heart', kinds: []};
  const filterCategories = [...criteria, favoriteCategory];
  const catalogueNoResults = find('[data-catalogue-no-results]');
  const catalogueEmptyList = find('[data-catalogue-empty-list]');
  const catalogueFavoritesEmpty = find('[data-catalogue-favorites-empty]');
  const saveCatalogueFilter = find('[data-save-catalogue-filter]');
  const catalogueFilterNotice = find('[data-catalogue-filter-notice]');
  const scrollTopButton = find('[data-library-scroll-top]');
  const destinations = find('.library-destinations');
  const collections = [{name: 'Mes prochaines lectures', ids: books.filter(book => book.status === 'À lire').map(book => book.id)}];
  const filterLabelOrder = ['genre', 'subgenre', 'status', 'trope', 'author'];
  const savedFilters = [{genre: ['Romantasy'], subgenre: [], trope: ['Slow burn'], status: ['À lire'], author: []}];
  function setTheme(theme) {
    root.dataset.theme = theme;
  }
  setTheme(preferences.theme === 'dark' ? 'dark' : 'light');
  if (Array.isArray(preferences.savedFilters)) savedFilters.splice(0, savedFilters.length, ...preferences.savedFilters);
  const DEFAULT_ANNUAL_READING_GOAL = 30;
  const validReadingGoal = goal => Number.isSafeInteger(goal) && goal > 0;
  let annualReadingGoal = validReadingGoal(preferences.annualReadingGoal)
    ? preferences.annualReadingGoal : DEFAULT_ANNUAL_READING_GOAL;

  let activeLibraryTab = tabs.some(tab => tab.dataset.libraryTab === preferences.activeLibraryTab)
    ? preferences.activeLibraryTab : 'all';
  let applied = emptyFilters();
  let draft = emptyFilters();
  let ownOrder = [...genres];
  if (Array.isArray(preferences.genreOrder)) {
    const positions = new Map(preferences.genreOrder.map((name, rank) => [name, rank]));
    ownOrder.sort((a, b) => (positions.get(a.name) ?? Infinity) - (positions.get(b.name) ?? Infinity));
  }
  function savePreferences() {
    return storage.putPreferences({
      theme: root.dataset.theme,
      genreOrder: ownOrder.map(genre => genre.name),
      savedFilters: savedFilters.map(copy),
      activeLibraryTab,
      genreSort: sort,
      bookSort,
      annualReadingGoal,
    });
  }
  let sort = preferences.genreSort === 'alpha' ? 'alpha' : 'custom';
  let bookSort = preferences.bookSort === 'title' ? 'title' : 'author';
  const folderTrail = [];
  const catalogues = new Map(['all', 'pile', 'finished', 'favorites', 'genre'].map(view => [view, {
    sort: bookSort,
    expandedSagas: new Map(),
  }]));
  let favoritesOnly = false;
  let openWindow = '';
  const bookHost = find('[data-saved-book-host]');
  let disposeBook = null;
  function dismissBook() {
    if (!disposeBook) return;
    disposeBook();
    disposeBook = null;
    bookHost.hidden = true;
    root.removeAttribute('data-book-open');
  }
  let scope = 'home';
  let selectedGenre = null;
  let collection = null;
  let restoreFocus = null;
  let catalogueReturn = null;
  let libraryBookReturn = null;
  let categoryReturnTop = 0;

  function updateScrollTop() {
    const focused = document.activeElement === scrollTopButton;
    scrollTopButton.hidden = !other.hidden || root.dataset.sidebarOpen === 'true' ||
      (scope !== 'home' && !catalogues.has(scope)) || window.scrollY < window.innerHeight;
    if (focused && scrollTopButton.hidden && other.hidden && root.dataset.sidebarOpen !== 'true') {
      (catalogueView.hidden ? sidebarToggle : catalogueBack).focus({preventScroll: true});
    }
  }

  function syncCatalogueView() {
    if (other.hidden && disposeBook) dismissBook();
    const catalogue = catalogues.get(scope);
    const visible = Boolean(catalogue) && other.hidden;
    catalogueView.hidden = !visible;
    libraryContent.hidden = Boolean(catalogue) || !other.hidden;
    catalogueBack.hidden = other.hidden && scope === 'home';
    const parentTitle = folderTrail.at(-1)?.title;
    const backTo = !other.hidden && catalogues.has(scope) ? catalogueTitleText() : parentTitle;
    catalogueBack.setAttribute('aria-label', backTo ? `Revenir à « ${backTo} »` : 'Revenir à la bibliothèque');
    destinations.hidden = visible;
    favoriteCategory.trigger.hidden = !visible || scope === 'favorites';
    root.toggleAttribute('data-catalogue-open', visible);
    const active = countFilters(applied) + Number(visible && favoritesOnly);
    organiseButton.classList.toggle('filter-active', Boolean(active));
    organiseButton.setAttribute('aria-label', active ? `Menu, ${active} ${active === 1 ? 'critère actif' : 'critères actifs'}` : 'Menu');
    updateScrollTop();
  }
  let gesture = null;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function button(label, style, onClick) {
    const node = el('button', `${style} cursor-interaction`, label);
    node.type = 'button';
    node.addEventListener('click', onClick);
    return node;
  }

  function icon(name) {
    const node = el('i');
    node.setAttribute('data-lucide', name);
    node.setAttribute('aria-hidden', 'true');
    return node;
  }

  function refreshIcons() { window.lucide?.createIcons?.(); }
  function announce(text) { find('[data-feedback]').textContent = text; }
  function countLabel(count) { return `${count} ${count === 1 ? 'livre' : 'livres'}`; }

  let sidebarHideTimer;

  let sidebarOpener = sidebarToggle;

  function setSidebarOpen(open, opener = sidebarToggle) {
    if (open === (root.dataset.sidebarOpen === 'true')) return;
    clearTimeout(sidebarHideTimer);
    const animate = window.matchMedia?.('(prefers-reduced-motion: no-preference)').matches;

    sidebarToggle.setAttribute('aria-expanded', String(open));
    sidebarToggle.setAttribute('aria-label', open ? 'Fermer la barre latérale' : 'Ouvrir la barre latérale');

    if (open) {
      sidebarOpener = opener;
      sidebarOpener.setAttribute('aria-expanded', 'true');
      closeFolderForm();
      showWindow();
      sidebarLayer.hidden = false;
      sidebarLayer.inert = false;
      sidebarLayer.removeAttribute('aria-hidden');
      libraryMain.inert = true;
      addBookPage.inert = true;
      if (animate) sidebarLayer.getBoundingClientRect();
      root.dataset.sidebarOpen = 'true';
      updateScrollTop();
      (addBookPage.hidden ? libraryTitle : find('[data-menu-page="home"]', sidebar)).focus({preventScroll: true});
      return;
    }

    libraryMain.inert = false;
    addBookPage.inert = false;
    sidebarOpener.setAttribute('aria-expanded', 'false');
    const target = sidebarOpener.isConnected ? sidebarOpener : sidebarToggle;
    target.focus({preventScroll: true});
    sidebarLayer.inert = true;
    sidebarLayer.setAttribute('aria-hidden', 'true');
    root.dataset.sidebarOpen = 'false';
    updateScrollTop();
    if (animate) {
      sidebarHideTimer = setTimeout(() => { sidebarLayer.hidden = true; }, 230);
    } else {
      sidebarLayer.hidden = true;
    }
  }

  function refreshSidebarPage() {
    const currentView = other.hidden ? scope : other.dataset.view;
    const page = find(`[data-menu-page="${currentView}"]`, sidebar);
    const inLibrary = find('[data-bottom-page="home"][aria-current="page"]');
    const current = page ?? (inLibrary ? libraryTitle : null);
    for (const item of all('[data-menu-page]', sidebar)) {
      if (item === current) item.setAttribute('aria-current', item === page ? 'page' : 'location');
      else item.removeAttribute('aria-current');
    }
  }

  function showWindow(name = '', focusBack = false) {
    if (removing && name !== 'remove') return;
    const previous = openWindow;
    openWindow = name;
    organisePopover.hidden = !name;
    organisePopover.scrollTop = 0;
    const activePanel = all('[data-window]').find(panel => panel.dataset.window === name);
    all('[data-window]').forEach(panel => { panel.hidden = panel !== activePanel; });
    if (activePanel) organisePopover.setAttribute('aria-labelledby', find('h2', activePanel).id);
    if (name && folderDialog.open) closeFolderForm();
    organiseButton.setAttribute('aria-expanded', String(Boolean(name)));
    if (previous === 'remove' && name !== 'remove') {
      removalSelection.clear();
      removalItems.hidden = true;
      root.removeAttribute('data-removing');
    }
    if (name === 'organiser') {
      (find(`[data-organise-choice="${previous}"]`) ?? find('[data-organise-choice]')).focus({preventScroll: true});
    }
    if (name === 'filter') {
      draft = copy(applied);
      catalogueFavorite.checked = !catalogueView.hidden && favoritesOnly;
      resetFilterPanel();
      filterPicker.focus({preventScroll: true});
    }
    if (name === 'sort') {
      for (const choice of all('[data-sort-choice]')) choice.setAttribute('aria-pressed', String(choice.dataset.sortChoice === sort));
      for (const choice of bookSortChoices) choice.setAttribute('aria-pressed', String(choice.dataset.bookSort === bookSort));
      find('[data-sort-choice][aria-pressed="true"]').focus({preventScroll: true});
    }
    if (name === 'remove') {
      if (previous !== 'remove') {
        removalError.hidden = true;
        removalRequest = undefined;
      }
      root.setAttribute('data-removing', '');
      removalItems.hidden = false;
      renderRemovalItems();
      find('[data-menu-back]', activePanel).focus({preventScroll: true});
    }
    if (focusBack && previous) organiseButton.focus({preventScroll: true});
  }

  function renderRemovalItems() {
    const entries = [
      ...folders.map(folder => ({kind: 'folder', id: folder.id, name: folderPath(folder), label: folder.name})),
      ...books.map(book => ({kind: 'book', id: book.id, name: book.title, label: book.title, book})),
    ];
    const keyFor = entry => `${entry.kind}:${entry.id}`;
    const available = new Map(entries.map(entry => [keyFor(entry), entry]));
    for (const id of removalSelection.keys()) {
      if (available.has(id)) removalSelection.set(id, available.get(id));
      else removalSelection.delete(id);
    }
    removalGrid.replaceChildren(...entries.map(entry => {
      const tile = el('label', 'library-removal-tile cursor-interaction');
      const checkbox = el('input');
      const id = keyFor(entry);
      checkbox.type = 'checkbox';
      checkbox.disabled = removing;
      checkbox.checked = removalSelection.has(id);
      checkbox.setAttribute('aria-label', `Sélectionner ${entry.kind === 'folder' ? 'le dossier' : 'le livre'} ${entry.name}`);
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) removalSelection.set(id, entry);
        else removalSelection.delete(id);
        removalError.hidden = true;
        removalRequest = undefined;
        updateRemovalSummary();
      });
      const art = el('span', 'library-removal-art');
      art.setAttribute('aria-hidden', 'true');
      art.append(entry.kind === 'folder' ? icon('folder') : catalogueCover(entry.book));
      tile.append(checkbox, art, el('span', '', entry.label));
      return tile;
    }));
    if (!entries.length) removalGrid.append(el('p', 'empty', 'Aucun livre ni dossier à supprimer.'));
    updateRemovalSummary();
    refreshIcons();
  }

  function updateRemovalSummary() {
    const selected = [...removalSelection.values()];
    const count = selected.length;
    removeCount.textContent = count
      ? `${count} ${count === 1 ? 'élément sélectionné' : 'éléments sélectionnés'}`
      : 'Coche les éléments à supprimer.';
    removalSummary.hidden = !count;
    removalSummary.replaceChildren(...selected.map(entry => {
      const card = el('li');
      card.append(icon(entry.kind === 'folder' ? 'folder' : 'book'), el('span', '', entry.name));
      return card;
    }));
    removalNote.hidden = !selected.some(entry => entry.kind === 'folder');
    removalThumb.disabled = !count || removing;
    refreshIcons();
  }

  async function confirmRemoval() {
    if (removing || !removalSelection.size) return;
    const selected = [...removalSelection.values()];
    const booksToRemove = selected.filter(entry => entry.kind === 'book').map(entry => entry.id);
    const foldersToRemove = selected.filter(entry => entry.kind === 'folder').map(entry => entry.id);
    removing = true;
    removalError.hidden = true;
    removalItems.inert = true;
    updateRemovalSummary();
    try {
      removalRequest ??= crypto.randomUUID();
      const library = await storage.removeSelection({books: booksToRemove, folders: foldersToRemove}, removalRequest);
      updateStoredLibrary(library);
      removing = false;
      showWindow('', true);
      if (currentFolder() && !folders.some(folder => folder.id === currentFolder().id)) {
        setScope(scope, selectedGenre);
      } else renderContent();
      announce(selected.length === 1 ? 'Élément supprimé.' : `${selected.length} éléments supprimés.`);
    } catch {
      removalError.textContent = 'La suppression n’a pas pu être confirmée. Réessaie.';
      removalError.hidden = false;
    } finally {
      removing = false;
      removalItems.inert = false;
      updateRemovalSummary();
    }
  }

  removalThumb.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || removalThumb.disabled) return;
    removalDrag = {id: event.pointerId, start: event.clientX, distance: 0};
    removalThumb.setPointerCapture(event.pointerId);
  });
  removalThumb.addEventListener('pointermove', event => {
    if (event.pointerId !== removalDrag?.id) return;
    const limit = Math.max(1, removalTrack.clientWidth - removalThumb.offsetWidth - 2);
    removalDrag.distance = Math.min(limit, Math.max(0, event.clientX - removalDrag.start));
    removalTrack.style.setProperty('--removal-offset', `${removalDrag.distance}px`);
  });
  function endRemovalDrag(event) {
    if (event.pointerId !== removalDrag?.id) return;
    const limit = removalTrack.clientWidth - removalThumb.offsetWidth - 2;
    const complete = event.type === 'pointerup' && removalDrag.distance >= limit - 10;
    removalDrag = undefined;
    removalTrack.style.removeProperty('--removal-offset');
    if (complete) void confirmRemoval();
  }
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) removalThumb.addEventListener(event, endRemovalDrag);
  removalThumb.addEventListener('click', event => { if (event.detail === 0) void confirmRemoval(); });

  const filterPicker = find('[data-filter-picker]');
  const categoryMenu = find('[data-filter-categories]');
  const filterRows = find('[data-filter-rows]');
  const filterFields = new Map();
  const selectedCategories = new Set();
  let pickerOpen = false;

  function categoryValues(category) {
    if (category === favoriteCategory) return catalogueFavorite.checked ? ['Activé'] : [];
    return category.kinds.flatMap(kind => draft[kind]);
  }

  function selectedDraft() {
    const selection = emptyFilters();
    for (const category of selectedCategories) {
      for (const kind of category.kinds) selection[kind] = draft[kind];
    }
    return selection;
  }

  function showDraft() {
    const active = [...selectedCategories];
    const pickerLabel = active.length > 1 ? `${active.length} catégories choisies` : active[0]?.label ?? 'Choisir les filtres';
    find('[data-filter-picker-label]').textContent = pickerLabel;
    filterPicker.setAttribute('aria-expanded', String(pickerOpen));
    categoryMenu.hidden = !pickerOpen;
    filterRows.hidden = pickerOpen;
    for (const category of filterCategories) {
      const enabled = selectedCategories.has(category);
      const values = categoryValues(category);
      const summary = values.length > 1 ? `${values.length} choix` : values[0];
      category.trigger.setAttribute('aria-pressed', String(enabled));
      category.caption.textContent = enabled && summary ? `${category.label} · ${summary}` : category.label;
      category.section.hidden = !enabled || (category === favoriteCategory && catalogueView.hidden);
      category.heading.hidden = category !== favoriteCategory && active.length <= 1;
    }
    find('[data-clear-filters]').disabled = !countFilters(selectedDraft()) && !catalogueFavorite.checked;
  }

  function setPicker(open) {
    pickerOpen = open;
    if (!open) renderFilterFields();
    showDraft();
  }

  function optionKeyMatches(label, query) {
    const normalized = key(label);
    return key(query).split(/\s+/).every(part => normalized.includes(part));
  }

  function filterSearch(title, placeholder, kinds, parent) {
    const line = el('label', 'read-filter-search');
    const searchField = el('input');
    searchField.type = 'search';
    searchField.placeholder = placeholder;
    searchField.setAttribute('aria-label', title);
    const refresh = () => {
      for (const kind of kinds) {
        const field = filterFields.get(kind);
        field.expanded = false;
        renderFilterField(kind);
      }
    };
    searchField.addEventListener('input', refresh);
    searchField.addEventListener('keydown', event => {
      if (event.key === 'Escape' && searchField.value) {
        event.stopPropagation();
        searchField.value = '';
        refresh();
      }
    });
    line.append(icon('search'), searchField);
    parent.append(line);
    return searchField;
  }

  function valuesForFacet(kind, book) {
    if (kind === 'genre') return book.genres;
    if (kind === 'subgenre') return book.subgenres;
    return book.tropes;
  }

  function facetCounts(kind) {
    const context = selectedDraft();
    if (kind === 'trope') context.trope = [];
    else context.genre = context.subgenre = [];
    const counts = new Map();
    for (const book of filterBooks(true, context)) {
      if (!catalogueView.hidden && (!catalogueIncludes(book) || (catalogueFavorite.checked && !book.coupDeCoeur))) continue;
      if (kind === 'subgenre' && selectedCategories.has(criteria[0]) && draft.genre.length && !book.genres.some(name => draft.genre.includes(name))) continue;
      for (const name of new Set(valuesForFacet(kind, book).map(key))) counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return counts;
  }

  function toggleValue(kind, label, enabled) {
    draft[kind] = enabled ? [...draft[kind], label] : draft[kind].filter(value => value !== label);
    renderFilterFields();
    showDraft();
    const field = filterFields.get(kind);
    const next = all('[data-filter-option]', field.list).find(option => option.dataset.filterOption === label);
    (next ?? field.search)?.focus({preventScroll: true});
  }

  function renderChoiceLines(kind, field, choices) {
    for (const label of choices) {
      const author = kind === 'author';
      const row = el('label', author ? 'cursor-interaction' : 'read-filter-line cursor-interaction');
      const input = el('input');
      const text = el('span', '', label);
      const mark = el('span', author ? 'read-author-mark' : 'read-filter-dot');
      mark.setAttribute('aria-hidden', 'true');
      input.type = 'checkbox';
      input.checked = draft[kind].includes(label);
      input.setAttribute('data-filter-option', label);
      input.addEventListener('change', () => toggleValue(kind, label, input.checked));
      row.append(input, ...(author ? [text, mark] : [mark, text]));
      field.list.append(row);
    }
    if (!choices.length) field.list.append(el('p', 'read-filter-empty', 'Aucun nom trouvé.'));
  }

  function renderFacetTrack(kind, field, choices, query) {
    const counts = facetCounts(kind);
    const selected = draft[kind];
    const remaining = choices.filter(label => !selected.includes(label));
    const suggestions = query.trim() ? remaining : remaining.filter(label => counts.has(key(label)));
    const visible = [...selected, ...(field.expanded ? remaining : suggestions.slice(0, query.trim() ? 8 : 5))];
    field.more.hidden = !field.expanded && remaining.length === visible.length - selected.length;
    field.more.textContent = field.expanded ? 'Réduire' : 'Voir plus';
    field.more.setAttribute('aria-expanded', String(field.expanded));
    field.list.setAttribute('data-expanded', String(field.expanded));
    for (const label of visible) {
      const picked = selected.includes(label);
      const tally = counts.get(key(label)) ?? 0;
      const choice = button(label, 'read-facet-choice', () => toggleValue(kind, label, !picked));
      choice.setAttribute('aria-pressed', String(picked));
      choice.setAttribute('aria-label', `${label}, ${countLabel(tally)}`);
      choice.setAttribute('data-filter-option', label);
      const count = el('small', '', tally);
      count.setAttribute('aria-hidden', 'true');
      choice.append(count);
      field.list.append(choice);
    }
    if (!visible.length) {
      const notice = el('p', 'read-filter-empty', query.trim() ? 'Aucun résultat pour cette recherche.' : 'Aucun choix avec ces filtres.');
      notice.setAttribute('role', 'status');
      field.list.append(notice);
    }
  }

  function renderFilterField(kind) {
    const field = filterFields.get(kind);
    const query = field.search?.value ?? '';
    const choices = kind === 'subgenre' && draft.genre.length
      ? sorted(unique([...draft.genre.flatMap(name => subgenresOf(genreByName.get(name))), ...draft.subgenre]))
      : options[kind];
    const matching = choices.filter(label => draft[kind].includes(label) || optionKeyMatches(label, query));
    field.list.replaceChildren();
    if (field.more) renderFacetTrack(kind, field, matching, query);
    else renderChoiceLines(kind, field, matching);
  }

  function renderFilterFields() {
    for (const category of selectedCategories) {
      for (const kind of category.kinds) renderFilterField(kind);
    }
  }

  function resetFilterPanel() {
    selectedCategories.clear();
    for (const category of filterCategories) {
      if (categoryValues(category).length) selectedCategories.add(category);
    }
    for (const field of filterFields.values()) {
      if (field.search) field.search.value = '';
      field.expanded = false;
    }
    setPicker(false);
  }

  function addFacetField(kind, label, searchField, parent) {
    const group = el('div', 'read-facet-group');
    const heading = el('div', 'read-facet-heading');
    const list = el('div', 'read-facet-track');
    list.id = `${root.id}-facet-${kind}`;
    list.setAttribute('aria-label', label);
    list.setAttribute('role', 'group');
    const more = button('Voir plus', '', () => {
      const field = filterFields.get(kind);
      field.expanded = !field.expanded;
      renderFilterField(kind);
    });
    more.setAttribute('aria-controls', list.id);
    heading.append(el('span', '', label), more);
    group.append(heading, list);
    parent.append(group);
    filterFields.set(kind, {list, search: searchField, more, expanded: false});
  }

  filterPicker.addEventListener('click', () => setPicker(!pickerOpen));
  for (const category of filterCategories) {
    const isFavorite = category === favoriteCategory;
    const trigger = button('', '', () => {
      if (isFavorite) {
        selectedCategories.add(category);
        setPicker(false);
        catalogueFavorite.focus({preventScroll: true});
        return;
      }
      if (selectedCategories.has(category)) selectedCategories.delete(category);
      else selectedCategories.add(category);
      showDraft();
    });
    const caption = el('span', '', category.label);
    const check = icon('check');
    check.className = 'read-category-check';
    trigger.setAttribute('data-filter-category', isFavorite ? 'favorite' : category.kinds[0]);
    trigger.hidden = isFavorite;
    const mark = el('span', 'read-category-mark');
    mark.append(icon(category.icon));
    trigger.append(mark, caption, check);
    categoryMenu.append(trigger);
    const section = el('div', 'read-category');
    const heading = el('h3', '', category.label);
    section.append(heading);
    filterRows.append(section);
    Object.assign(category, {trigger, caption, section, heading});
    if (isFavorite) {
      section.append(favoriteControl);
      continue;
    }

    const first = category.kinds[0];
    if (first === 'genre') {
      const input = filterSearch('Rechercher un genre ou un sous-genre', 'Genre ou sous-genre…', category.kinds, section);
      addFacetField('genre', 'Genre', input, section);
      addFacetField('subgenre', 'Sous-genre', input, section);
    } else if (first === 'trope') {
      const input = filterSearch('Rechercher un trope', 'Rechercher un trope…', category.kinds, section);
      addFacetField('trope', 'Tropes', input, section);
    } else {
      const author = first === 'author';
      const input = author ? filterSearch('Rechercher un auteur ou une autrice', 'Rechercher un nom…', category.kinds, section) : null;
      const list = el(author ? 'div' : 'fieldset', author ? 'read-author-choices' : 'read-filter-lines');
      if (author) list.setAttribute('role', 'group');
      list.setAttribute('aria-label', author ? 'Noms disponibles' : 'Statuts de lecture');
      section.append(list);
      filterFields.set(first, {search: input, list});
    }
  }
  showDraft();

  function saveAppliedFilters() {
    if (!countFilters(applied)) return;
    const signature = filters => JSON.stringify(filterLabelOrder.map(kind => sorted(filters[kind])));
    const duplicate = savedFilters.some(filters => signature(filters) === signature(applied));
    if (!duplicate) {
      savedFilters.push(copy(applied));
      savePreferences().catch(showStorageError);
    }
    const notice = catalogueView.hidden ? filterNotice : catalogueFilterNotice;
    notice.hidden = false;
    notice.textContent = duplicate ? 'Ce filtre est déjà enregistré.' : 'Filtre enregistré.';
  }

  function applyFilters(filters) {
    dismissImport();
    applied = copy(filters);
    other.hidden = true;
    showWindow('', true);
    renderContent();
  }

  function filterBooks(includeQuery, filters = applied) {
    const field = catalogues.has(scope) ? catalogueSearch : search;
    const words = includeQuery ? key(field.value).split(/\s+/).filter(Boolean) : [];
    return books.filter(book => {
      const match = (kind, values) => !filters[kind].length || filters[kind].some(label => values.some(value => key(value) === key(label)));
      const searchable = key([book.title, book.author, book.saga ?? ''].join(' '));
      return words.every(word => searchable.includes(word)) &&
        match('genre', book.genres) && match('subgenre', book.subgenres) && match('trope', book.tropes) &&
        match('status', [book.status]) && match('author', [book.author]);
    });
  }

  function createArt(genre) {
    const cropSize = 230;
    const n = genre.supplementaryArt;
    const art = el('span', genre.crop ? 'art' : 'art supplementary');
    const [x,y,side] = genre.crop ?? [[143,378,622,873,1120][n % 5] - cropSize / 2, [163,401,632,863,1099][Math.floor(n / 5)] - cropSize / 2, cropSize];
    art.setAttribute('aria-hidden', 'true');
    art.style.setProperty('--atlas-scale', `${100 * 1254 / side}%`);
    art.style.setProperty('--atlas-x', `${100 * x / (1254 - side)}%`);
    art.style.setProperty('--atlas-y', `${100 * y / (1254 - side)}%`);
    return art;
  }

  function currentFolder() { return folderTrail.at(-1)?.folder; }

  function folderParent() {
    return currentFolder()?.id ?? (scope === 'genre' ? `genre:${selectedGenre.name}` : `list:${scope === 'home' ? activeLibraryTab : scope}`);
  }

  function catalogueTitleText() {
    return currentFolder()?.name ?? (scope === 'genre' ? selectedGenre.name : libraryLists[scope]?.title ?? 'Ma bibliothèque');
  }

  function catalogueIncludes(book) {
    const folder = currentFolder();
    if (folder) return book.folderIds?.includes(folder.id) ?? false;
    if (scope === 'genre') {
      return libraryLists[activeLibraryTab].includes(book) && book.genres.includes(selectedGenre.name);
    }
    return libraryLists[scope]?.includes(book) ?? true;
  }

  const folderDialog = find('[data-folder-dialog]');
  const folderForm = find('[data-folder-form]');
  const folderFormTitle = find('#elp-folder-form-title');
  const folderParentMenu = find('[data-folder-parent-menu]');
  const folderParentTrigger = find('[data-folder-parent-trigger]');
  const folderIndexResults = find('[data-folder-index-results]');
  const folderIndexSearch = find('[data-folder-index-search]');
  const folderIndexQueries = {genre: '', subgenre: ''};
  let folderIndexMode = 'genre';
  let folderIndexParent = '';
  let folderDestination;
  let folderBrowsing;
  let folderFormTrigger = folderButton;
  let bookFolderForm;
  const folderName = find('[data-folder-input]');
  const folderFeedback = find('[data-folder-feedback]');
  const folderFeedbackText = find('[data-folder-feedback-text]');
  const folderCreated = find('[data-folder-created]');
  const folderCreatedPath = find('[data-folder-created-path]');
  const folderSubmit = find('[data-folder-submit]');
  const folderGrid = find('[data-collection-grid]');
  const viewSwitch = find('[data-catalogue-view-switch]');
  const nextCatalogueMode = {overview: 'collections', collections: 'books', books: 'overview'};
  const catalogueModeLabels = {
    overview: 'Vue générale',
    collections: 'Mes collections',
    books: 'Mes livres',
  };
  let catalogueMode = 'overview';
  const folderEmpty = find('[data-collection-empty]');
  let folderRequest = 0;
  const folderArtwork = ['sagas', 'reread', 'favorites', 'short', 'new'];
  const sectionMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const catalogueSections = all('[data-catalogue-section-toggle]', catalogueView).map(control => ({
    control,
    heading: control.closest('h2'),
    section: control.closest('[data-catalogue-panel]'),
    panel: document.getElementById(control.getAttribute('aria-controls')),
    timer: 0,
  }));

  function setSectionExpanded(section, expanded, animateFilets = true) {
    section.control.setAttribute('aria-expanded', String(expanded));
    section.panel.toggleAttribute('data-collapsed', !expanded);
    section.panel.inert = !expanded;
    for (const filet of all('.catalogue-filet', section.control)) {
      for (const animation of filet.getAnimations()) animation.cancel();
      if (animateFilets && !sectionMotion.matches) {
        filet.animate([
          {transform: 'scaleX(1)', opacity: 1},
          {transform: 'scaleX(.58)', opacity: .58, offset: .32},
          {transform: 'scaleX(1)', opacity: 1},
        ], {duration: 480, easing: 'ease-out'});
      }
    }
  }

  function resetCatalogueSections() {
    catalogueView.setAttribute('data-prepare-entrance', '');
    for (const section of catalogueSections) {
      clearTimeout(section.timer);
      setSectionExpanded(section, sectionMotion.matches, false);
    }
  }

  function animateCatalogueSections() {
    catalogueView.getBoundingClientRect();
    catalogueView.removeAttribute('data-prepare-entrance');
    if (sectionMotion.matches) return;
    catalogueSections.forEach((section, index) => {
      if (!section.section.hidden && !section.heading.hidden) {
        section.timer = setTimeout(() => setSectionExpanded(section, true), 90 + index * 190);
      }
    });
  }

  for (const section of catalogueSections) {
    section.control.addEventListener('click', () => {
      clearTimeout(section.timer);
      setSectionExpanded(section, section.control.getAttribute('aria-expanded') === 'false');
    });
  }

  function showingCatalogueList() {
    return (scope === 'all' || scope === 'pile' || scope === 'finished' || scope === 'favorites') && !currentFolder();
  }

  function catalogueListIsEmpty() {
    return !books.some(libraryLists[scope].includes);
  }

  function updateCatalogueMode() {
    const redesigned = showingCatalogueList();
    const favorites = scope === 'favorites' && redesigned;
    const searching = Boolean(catalogueSearch.value.trim());
    const empty = redesigned && catalogueListIsEmpty();
    const hasCollections = empty && folders.some(folder => folder.parent === folderParent());
    const effectiveMode = empty && catalogueMode !== 'collections' ? 'books' : catalogueMode;
    const overview = effectiveMode === 'overview' && !searching;
    catalogueView.toggleAttribute('data-catalogue-list', redesigned);
    catalogueView.toggleAttribute('data-favorites-catalogue', favorites);
    catalogueSearchForm.hidden = favorites && empty;
    viewSwitch.hidden = favorites || searching || (empty && !hasCollections);
    find('[data-catalogue-search-form] [data-clear-catalogue-search]').hidden = !searching;
    const destination = nextCatalogueMode[catalogueMode];
    viewSwitch.setAttribute('aria-label', destination === 'overview'
      ? 'Afficher la vue générale'
      : `Afficher ${catalogueModeLabels[destination]}`);
    for (const symbol of all('[data-view-destination]', viewSwitch)) {
      symbol.hidden = symbol.dataset.viewDestination !== destination;
    }
    for (const entry of catalogueSections) {
      const isBooks = entry.section.dataset.cataloguePanel === 'books';
      entry.section.hidden = favorites || searching ? !isBooks : !overview && entry.section.dataset.cataloguePanel !== effectiveMode;
      entry.heading.hidden = favorites ? empty || !isBooks : !(overview || (searching && isBooks && !empty));
      entry.control.disabled = searching;
      if (!overview && !entry.section.hidden && entry.panel.inert) {
        setSectionExpanded(entry, true, false);
      }
    }
  }

  function expandVisibleCatalogueSections() {
    for (const entry of catalogueSections) {
      clearTimeout(entry.timer);
      if (!entry.section.hidden) setSectionExpanded(entry, true, false);
    }
  }

  function selectCatalogueMode(mode) {
    catalogueMode = mode;
    updateCatalogueMode();
    expandVisibleCatalogueSections();
  }

  const viewFace = find('.catalogue-view-switch-face', viewSwitch);
  viewSwitch.addEventListener('click', async () => {
    if (viewSwitch.hasAttribute('data-turning')) return;
    const origin = catalogueMode;
    const advance = () => {
      selectCatalogueMode(nextCatalogueMode[catalogueMode]);
      announce(catalogueModeLabels[catalogueMode]);
    };
    if (sectionMotion.matches || !viewFace.animate) {
      advance();
      return;
    }
    const start = getComputedStyle(viewFace).transform;
    viewSwitch.setAttribute('data-turning', '');
    const outgoing = viewFace.animate([{transform: start}, {transform: 'rotateY(90deg)'}],
      {duration: 230, easing: 'ease-in', fill: 'forwards'});
    try {
      await outgoing.finished;
      if (viewSwitch.hidden || catalogueView.hidden || catalogueMode !== origin) return;
      advance();
      outgoing.cancel();
      if (!sectionMotion.matches) await viewFace.animate([{transform: 'rotateY(-90deg)'}, {transform: 'rotateY(0deg)'}],
        {duration: 230, easing: 'ease-out'}).finished;
    } catch (error) {
      if (error.name !== 'AbortError') throw error;
    } finally {
      outgoing.cancel();
      viewSwitch.removeAttribute('data-turning');
    }
  });

  function moveWithinCatalogue() {
    closeFolderForm();
    showWindow();
    resetCatalogueSections();
    renderContent();
    window.scrollTo({top: 0, behavior: 'auto'});
    animateCatalogueSections();
    catalogueTitle.focus({preventScroll: true});
  }

  function openFolder(folder) {
    folderTrail.push({
      folder, title: catalogueTitleText(), query: catalogueSearch.value,
      top: window.scrollY, mode: catalogueMode,
    });
    catalogueMode = 'overview';
    catalogueSearch.value = '';
    moveWithinCatalogue();
  }

  function returnFromFolder() {
    const entry = folderTrail.pop();
    closeFolderForm();
    showWindow();
    catalogueSearch.value = entry.query;
    catalogueMode = entry.mode;
    renderContent();
    expandVisibleCatalogueSections();
    window.scrollTo({top: entry.top, behavior: 'auto'});
    const card = all('[data-folder-id]', folderGrid).find(item => item.dataset.folderId === entry.folder.id);
    (card ?? catalogueBack).focus({preventScroll: true});
  }

  function createFolderArt(folder) {
    const genre = genreByName.get(folder.name);
    if (genre) return createArt(genre);
    if (folder.artIndex >= folderArtwork.length) {
      return createArt(genres[(folder.artIndex - folderArtwork.length) % genres.length]);
    }
    const art = el('span', 'art folder-mask');
    art.dataset.artwork = folderArtwork[folder.artIndex];
    return art;
  }

  function collectionTile(name, art, count, onClick) {
    const tile = button('', `genre${name.length > 18 ? ' long-name' : ''}`, onClick);
    const illustration = el('span', 'genre-illustration');
    illustration.setAttribute('aria-hidden', 'true');
    illustration.append(art);
    tile.append(illustration, el('span', 'genre-title', name));
    if (count > 0) tile.append(el('span', 'number-pill', countLabel(count)));
    return tile;
  }

  function folderGridItem(folder, count, open) {
    const item = el('li');
    const card = collectionTile(folder.name, createFolderArt(folder), count, open);
    card.dataset.folderId = folder.id;
    item.append(card);
    return item;
  }

  function bookFolderCards(parent, open) {
    const folderIds = new Set(folders.map(folder => folder.id));
    const entries = folders.filter(folder => parent ? folder.parent === parent : !folderIds.has(folder.parent));
    const names = new Map();
    for (const folder of entries) names.set(key(folder.name), (names.get(key(folder.name)) ?? 0) + 1);
    return entries.map(folder => {
      const item = folderGridItem(folder, 0, () => open(folder));
      if (names.get(key(folder.name)) > 1) {
        item.firstElementChild.append(el('span', 'book-folder-origin', folderRootTitle(folder.parent)));
      }
      return item;
    });
  }

  function drawCollections() {
    const parent = folderParent();
    const visible = folders.filter(folder => folder.parent === parent);
    const counts = new Map();
    for (const book of books) {
      for (const id of book.folderIds ?? []) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    folderEmpty.hidden = visible.length > 0;
    folderGrid.hidden = !visible.length;
    folderGrid.replaceChildren(...visible.map(folder => folderGridItem(folder, counts.get(folder.id) ?? 0, () => openFolder(folder))));
  }

  function closeFolderForm(focusBack = false) {
    if (!folderDialog.open) return;
    folderRequest += 1;
    bookFolderForm = undefined;
    folderDialog.close();
    if (folderFormTrigger === folderButton) folderButton.setAttribute('aria-expanded', 'false');
    if (focusBack) folderFormTrigger.focus({preventScroll: true});
  }

  function showFolderFeedback(text = '', state = '') {
    folderFeedback.dataset.state = state;
    const created = state === 'success';
    folderCreated.hidden = !created;
    folderCreatedPath.textContent = created ? text : '';
    folderFeedbackText.textContent = created ? '' : text;
    folderName.setAttribute('aria-invalid', String(state === 'invalid'));
  }

  function folderRootTitle(id) {
    if (id.startsWith('genre:')) return id.slice('genre:'.length);
    return libraryLists[id.slice('list:'.length)]?.title ?? 'Mes collections';
  }

  function folderLocationLabel(id) {
    const folder = folders.find(item => item.id === id);
    return folder ? folderPath(folder, true) : folderRootTitle(id);
  }

  function showFolderScreen(screen, focus) {
    folderDialog.dataset.folderScreen = screen;
    for (const panel of all('[data-folder-panel]', folderDialog)) panel.hidden = panel.dataset.folderPanel !== screen;
    folderFormTitle.textContent = {create: 'Ajouter un dossier', index: 'Genres et sous-genres', location: 'Créer dans'}[screen];
    find('[data-folder-heading-icon]').hidden = screen !== 'create';
    find('[data-folder-panel-back]').hidden = screen === 'create';
    if (screen === 'create') {
      const label = bookFolderForm && folderDestination === bookFolderForm.home
        ? 'Mes collections' : folderLocationLabel(folderDestination);
      find('[data-folder-destination]').textContent = label;
    }
    focus?.focus({preventScroll: true});
  }

  function showFolderLocation(id) {
    const folder = folders.find(item => item.id === id);
    folderBrowsing = bookFolderForm && !folder ? bookFolderForm.home : id;
    find('[data-folder-location-path]').textContent = bookFolderForm && !folder ? 'Mes collections' : folderLocationLabel(id);
    find('[data-folder-location-back]').hidden = !folder;
    const cards = bookFolderForm
      ? bookFolderCards(folder?.id ?? null, child => showFolderLocation(child.id))
      : folders.filter(item => item.parent === id).map(item => folderGridItem(item, 0, () => showFolderLocation(item.id)));
    find('[data-folder-location-cards]').replaceChildren(...cards);
    find('[data-folder-location-empty]').hidden = cards.length > 0;
    showFolderScreen('location', find('[data-folder-choose-location]'));
    refreshIcons();
  }

  function setFolderParentMenu(open) {
    folderParentMenu.hidden = !open;
    folderIndexResults.hidden = open;
    folderParentTrigger.setAttribute('aria-expanded', String(open));
    if (open) find('[aria-pressed="true"]', folderParentMenu)?.focus();
  }

  function renderFolderIndex() {
    const values = folderIndexMode === 'subgenre' && folderIndexParent
      ? sorted(subgenresOf(genreByName.get(folderIndexParent))) : options[folderIndexMode];
    const results = values.filter(value => optionKeyMatches(value, folderIndexSearch.value)).map(value => {
      const item = button('', 'catalogue-folder-index-choice', () => {
        folderName.value = value;
        showFolderFeedback();
        showFolderScreen('create', folderName);
      });
      item.append(el('span', '', value), icon('plus'));
      return item;
    });
    if (!results.length) results.push(el('p', 'catalogue-folder-picker-empty',
      folderIndexMode === 'genre' ? 'Aucun genre trouvé.' : 'Aucun sous-genre trouvé.'));
    folderIndexResults.replaceChildren(...results);
    folderIndexResults.scrollTop = 0;
    refreshIcons();
  }

  function selectFolderIndexMode(mode) {
    folderIndexMode = mode;
    folderIndexSearch.value = folderIndexQueries[mode];
    const label = mode === 'genre' ? 'Rechercher un genre' : 'Rechercher un sous-genre';
    folderIndexSearch.setAttribute('aria-label', label);
    folderIndexSearch.placeholder = label + '…';
    find('[data-folder-parent-picker]').hidden = mode === 'genre';
    for (const choice of all('[data-folder-index-mode]', folderDialog)) {
      choice.setAttribute('aria-pressed', String(choice.dataset.folderIndexMode === mode));
    }
    setFolderParentMenu(false);
    renderFolderIndex();
  }

  function selectFolderIndexParent(value) {
    folderIndexParent = value;
    find('[data-folder-parent-value]').textContent = value || 'Tous les genres';
    for (const option of all('button', folderParentMenu)) {
      option.setAttribute('aria-pressed', String(option.dataset.folderParentOption === value));
    }
    setFolderParentMenu(false);
    renderFolderIndex();
  }

  function renderFolderParents() {
    folderParentMenu.replaceChildren(...['', ...options.genre.filter(value => subgenresOf(genreByName.get(value)).length)].map(value => {
      const option = button('', 'catalogue-folder-parent-option', () => {
        selectFolderIndexParent(value);
        folderParentTrigger.focus({preventScroll: true});
      });
      option.dataset.folderParentOption = value;
      option.setAttribute('aria-pressed', String(value === folderIndexParent));
      option.append(icon(value ? 'folder' : 'folders'), el('span', '', value || 'Tous les genres'), icon('check'));
      return option;
    }));
  }

  find('[data-folder-open-index]').addEventListener('click', () => {
    renderFolderParents();
    selectFolderIndexMode(folderIndexMode);
    showFolderScreen('index', folderIndexSearch);
  });
  for (const choice of all('[data-folder-index-mode]', folderDialog)) {
    choice.addEventListener('click', () => selectFolderIndexMode(choice.dataset.folderIndexMode));
  }
  folderIndexSearch.addEventListener('input', () => {
    folderIndexQueries[folderIndexMode] = folderIndexSearch.value;
    setFolderParentMenu(false);
    renderFolderIndex();
  });
  folderParentTrigger.addEventListener('click', () => setFolderParentMenu(folderParentMenu.hidden));
  folderDialog.addEventListener('pointerdown', event => {
    if (!folderParentMenu.hidden && !event.target.closest('[data-folder-parent-picker]')) setFolderParentMenu(false);
  });
  find('[data-folder-open-location]').addEventListener('click', () => showFolderLocation(folderDestination));
  find('[data-folder-location-back]').addEventListener('click', () => {
    const folder = folders.find(item => item.id === folderBrowsing);
    if (folder) showFolderLocation(folder.parent);
  });
  find('[data-folder-choose-location]').addEventListener('click', () => {
    folderDestination = folderBrowsing;
    showFolderFeedback();
    showFolderScreen('create', find('[data-folder-open-location]'));
  });
  find('[data-folder-panel-back]').addEventListener('click', () => {
    const control = folderDialog.dataset.folderScreen === 'location' ? '[data-folder-open-location]' : '[data-folder-open-index]';
    showFolderScreen('create', find(control));
  });

  function openFolderEditor({trigger = folderButton, destination, home, onCreated}) {
    if (folderDialog.open) return;
    showWindow();
    folderFormTrigger = trigger;
    bookFolderForm = onCreated ? {home, onCreated} : undefined;
    folderDestination = destination;
    folderIndexMode = 'genre';
    folderIndexParent = '';
    folderIndexQueries.genre = folderIndexQueries.subgenre = '';
    find('[data-folder-parent-value]').textContent = 'Tous les genres';
    setFolderParentMenu(false);
    showFolderScreen('create');
    folderName.value = '';
    folderName.readOnly = false;
    folderSubmit.disabled = false;
    find('[data-folder-open-index]').disabled = false;
    find('[data-folder-open-location]').disabled = false;
    showFolderFeedback();
    if (trigger === folderButton) folderButton.setAttribute('aria-expanded', 'true');
    folderDialog.showModal();
  }
  folderButton.addEventListener('click', () => {
    openFolderEditor({destination: scope === 'favorites' ? 'list:all' : folderParent()});
  });
  find('[data-folder-close]').addEventListener('click', () => closeFolderForm(true));
  folderDialog.addEventListener('cancel', event => {
    event.preventDefault();
    if (folderDialog.dataset.folderScreen === 'index' && !folderParentMenu.hidden) {
      setFolderParentMenu(false);
      folderParentTrigger.focus({preventScroll: true});
    } else if (folderDialog.dataset.folderScreen !== 'create') {
      const control = folderDialog.dataset.folderScreen === 'location' ? '[data-folder-open-location]' : '[data-folder-open-index]';
      showFolderScreen('create', find(control));
    } else closeFolderForm(true);
  });
  folderDialog.addEventListener('click', event => {
    if (event.target !== folderDialog) return;
    const {left, right, top, bottom} = folderDialog.getBoundingClientRect();
    if (event.clientX < left || event.clientX >= right || event.clientY < top || event.clientY >= bottom) {
      closeFolderForm(true);
    }
  });
  folderName.addEventListener('input', () => showFolderFeedback());
  folderForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (folderSubmit.disabled) return;
    const name = folderName.value.trim();
    if (!name) {
      showFolderFeedback('Donne un nom à ton dossier.', 'invalid');
      folderName.focus({preventScroll: true});
      return;
    }
    const parent = folderDestination;
    if (parent.startsWith('folder:') && !folders.some(folder => folder.id === parent)) {
      folderDestination = bookFolderForm?.home ?? (scope === 'favorites' ? 'list:all' : folderParent());
      if (!folders.some(folder => folder.id === folderDestination) && folderDestination.startsWith('folder:')) folderDestination = 'list:all';
      showFolderScreen('create', find('[data-folder-open-location]'));
      showFolderFeedback('Ce dossier a été retiré. Choisis un nouvel emplacement.', 'error');
      return;
    }
    const destination = folderLocationLabel(parent);
    const request = ++folderRequest;
    showFolderFeedback();
    folderName.readOnly = true;
    folderSubmit.disabled = true;
    find('[data-folder-open-index]').disabled = true;
    find('[data-folder-open-location]').disabled = true;
    try {
      const id = `folder:${crypto.randomUUID()}`;
      const result = await storage.createFolder({name, nameKey: key(name), parent, id});
      folders = result.folders;
      if (!catalogueView.hidden) drawCollections();
      if (request !== folderRequest) return;
      if (result.created) {
        if (bookFolderForm) {
          const created = folders.find(folder => folder.id === id);
          if (created) {
            const {onCreated} = bookFolderForm;
            closeFolderForm();
            onCreated(created, destination);
            return;
          }
        }
        showFolderFeedback(`${name} · ${destination}`, 'success');
        folderName.value = '';
        if (!catalogueView.hidden && parent === folderParent() && !catalogueSearch.value.trim()) {
          if (catalogueMode === 'books' || (showingCatalogueList() && catalogueListIsEmpty())) selectCatalogueMode('collections');
          else {
            clearTimeout(catalogueSections[0].timer);
            setSectionExpanded(catalogueSections[0], true, false);
          }
        }
      } else {
        showFolderFeedback('Un dossier porte déjà ce nom ici.', 'invalid');
      }
    } catch {
      showStorageError();
      if (request === folderRequest) showFolderFeedback('Le dossier n’a pas pu être créé.', 'error');
    } finally {
      if (request === folderRequest) {
        folderName.readOnly = false;
        folderSubmit.disabled = false;
        find('[data-folder-open-index]').disabled = false;
        find('[data-folder-open-location]').disabled = false;
        folderName.focus({preventScroll: true});
      }
    }
  });
  function folderPath(folder, includeRoot = false) {
    const path = [];
    const byId = new Map(folders.map(item => [item.id, item]));
    const seen = new Set();
    let entry = folder;
    let parent = entry.parent;
    while (entry && !seen.has(entry.id)) {
      seen.add(entry.id);
      path.push(entry.name);
      parent = entry.parent;
      entry = byId.get(parent);
    }
    if (includeRoot && !entry) path.push(folderRootTitle(parent));
    return path.reverse().join(' › ');
  }

  function renderGrid() {
    const counts = new Map();
    const matching = filterBooks(false).filter(libraryLists[activeLibraryTab].includes);
    for (const book of matching) for (const name of book.genres) counts.set(name, (counts.get(name) ?? 0) + 1);
    const order = sort === 'alpha' ? [...genres].sort((a,b) => collator.compare(a.name,b.name)) : ownOrder;
    const visible = order.filter(genre => counts.has(genre.name));
    grid.replaceChildren(...visible.map(genre => {
      const tile = collectionTile(genre.name, createArt(genre), counts.get(genre.name), () => {
        if (tile.dataset.skipClick) { delete tile.dataset.skipClick; return; }
        categoryReturnTop = window.scrollY;
        setScope('genre', genre);
        catalogueTitle.focus({preventScroll: true});
      });
      tile.dataset.genre = genre.name;
      const item = el('li');
      item.append(tile);
      return item;
    }));
    if (!visible.length) {
      let message = books.length ? 'Aucune collection à afficher.' : 'Aucun livre dans la bibliothèque.';
      if (books.length && countFilters(applied)) message = 'Aucune collection ne correspond aux filtres actifs.';
      grid.append(el('li','empty',message));
    }
  }

  function sagaKey(book) {
    return `saga:${key(book.saga)}`;
  }

  function volumeNumber(book) {
    const volume = Number.parseFloat(String(book.volume ?? '').replace(',', '.'));
    return Number.isFinite(volume) ? volume : Infinity;
  }

  function volumeLabel(book) {
    return book.volume ? `Tome ${String(book.volume).replace('.', ',')}` : '';
  }

  function sagaGroups(matches) {
    const groups = new Map();
    for (const book of matches) {
      const id = book.saga ? sagaKey(book) : `book:${book.id}`;
      if (!groups.has(id)) groups.set(id, []);
      groups.get(id).push(book);
    }
    return [...groups.values()].map(group => group.sort((a, b) => volumeNumber(a) - volumeNumber(b)));
  }

  function catalogueCover(book) {
    if (book.coverData) {
      const cover = el('img', 'elp-cover');
      cover.src = book.coverData;
      cover.alt = '';
      cover.loading = 'lazy';
      cover.decoding = 'async';
      return cover;
    }
    const cover = el('span', 'elp-cover elp-cover-placeholder');
    cover.setAttribute('aria-hidden', 'true');
    cover.append(icon('book-open'));
    return cover;
  }

  function bindBookGesture(control, getBook) {
    let press;
    let suppressClick = false;
    const cancel = () => {
      clearTimeout(press?.timer);
      press = undefined;
    };
    const open = read => {
      const book = getBook();
      if (book) openSecondary('book', book, control, {
        read, fromLibrary: true, openReadingSheet: !read && Boolean(book.readingSheet),
      });
    };
    control.setAttribute('data-book-gesture', '');
    control.setAttribute('aria-keyshortcuts', 'Shift+Enter');
    control.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0 || control.disabled) return;
      cancel();
      suppressClick = false;
      press = {id: event.pointerId, x: event.clientX, y: event.clientY};
      press.timer = setTimeout(() => {
        cancel();
        if (!control.isConnected || control.closest('[hidden], [inert]')) return;
        suppressClick = true;
        open(false);
      }, 550);
    });
    control.addEventListener('pointermove', event => {
      if (press?.id !== event.pointerId || Math.hypot(event.clientX - press.x, event.clientY - press.y) <= 10) return;
      suppressClick = true;
      cancel();
    });
    for (const type of ['pointerup', 'pointercancel', 'pointerleave', 'blur']) {
      control.addEventListener(type, cancel);
    }
    control.addEventListener('contextmenu', event => {
      if (event.pointerType === 'touch' || suppressClick || press) event.preventDefault();
    });
    control.addEventListener('click', event => {
      if (suppressClick && event.detail > 0) return;
      open(true);
    });
    control.addEventListener('keydown', event => {
      if (event.key !== 'Enter' || !event.shiftKey) return;
      event.preventDefault();
      if (!event.repeat) open(false);
    });
  }

  function catalogueBookLink(book, style, label) {
    const link = el('button', `${style} cursor-interaction`);
    link.type = 'button';
    link.dataset.book = book.id;
    link.id = `catalogue-book-${book.id}`;
    link.setAttribute('aria-label', label);
    bindBookGesture(link, () => book);
    return link;
  }

  function catalogueBookTile(book, {showSaga = true, linkId} = {}) {
    const tile = el('li', 'elp-tile');
    tile.dataset.tileKey = `book:${book.id}`;
    const saga = showSaga && book.saga ? [book.saga, volumeLabel(book)].filter(Boolean).join(' • ') : '';
    const copy = el('span', 'elp-book-copy');
    if (saga) copy.append(el('span', 'elp-book-meta', saga));
    copy.append(el('span', 'elp-title', book.title));
    if (book.author) copy.append(el('span', 'elp-book-author', book.author));
    const link = catalogueBookLink(book, 'elp-book-main', [saga, book.title, book.author].filter(Boolean).join(', '));
    link.append(catalogueCover(book), copy);
    if (linkId) link.id = linkId;
    tile.append(link);
    return tile;
  }

  function catalogueTilePositions() {
    return new Map(all('.elp-mosaic > [data-tile-key]', catalogueOutput)
      .map(tile => [tile.dataset.tileKey, {tile, rect: tile.getBoundingClientRect()}]));
  }

  function animateCatalogue(before) {
    const after = catalogueTilePositions();
    const motion = {duration: 360, easing: 'cubic-bezier(.2, .7, .3, 1)'};
    const offset = 'translate(-8px, -4px)';
    for (const [id, {tile, rect}] of after) {
      const from = before.get(id)?.rect;
      if (!from) {
        tile.animate([{opacity: 0, transform: offset}, {opacity: 1, transform: 'none'}], motion);
        continue;
      }
      const x = from.left - rect.left;
      const y = from.top - rect.top;
      if (x || y) tile.animate([{transform: `translate(${x}px, ${y}px)`}, {transform: 'none'}], motion);
    }
    const bounds = catalogueOutput.getBoundingClientRect();
    for (const [id, {tile, rect}] of before) {
      if (after.has(id)) continue;
      const closing = el('div', 'elp-leaving-tile');
      closing.inert = true;
      closing.setAttribute('aria-hidden', 'true');
      Object.assign(closing.style, {
        left: `${rect.left - bounds.left}px`,
        top: `${rect.top - bounds.top}px`,
        width: `${rect.width}px`,
      });
      closing.append(...tile.childNodes);
      for (const item of all('[id]', closing)) item.removeAttribute('id');
      catalogueOutput.append(closing);
      closing.animate([{opacity: 1, transform: 'none'}, {opacity: 0, transform: offset}], motion)
        .finished.then(() => closing.remove(), () => closing.remove());
    }
  }

  function catalogueFolder(volumes, first, state, expanded) {
    const id = sagaKey(first);
    const tile = el('li', 'elp-tile');
    tile.dataset.tileKey = id;
    const toggle = button('', 'elp-book-main', () => {
      const animate = typeof tile.animate === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const before = animate ? catalogueTilePositions() : null;
      state.set(id, !expanded);
      renderCatalogue();
      if (before) animateCatalogue(before);
      all('[data-saga-folder]', catalogueOutput).find(item => item.dataset.sagaFolder === id)?.focus({preventScroll: true});
    });
    toggle.dataset.sagaFolder = id;
    toggle.setAttribute('aria-label', `${expanded ? 'Replier' : 'Ouvrir'} ${first.saga}`);
    toggle.setAttribute('aria-expanded', String(expanded));
    if (expanded) toggle.setAttribute('aria-controls', volumes.map(book => `catalogue-book-${book.id}`).join(' '));
    const art = el('span', 'elp-cover elp-folder-cover');
    art.setAttribute('aria-hidden', 'true');
    const glyph = el('span', 'elp-folder-glyph');
    glyph.append(el('span', 'catalogue-saga-art'));
    art.append(catalogueCover(first), glyph);
    toggle.append(art);
    tile.append(toggle);
    const copy = el('span', 'elp-book-copy');
    if (expanded && volumes.includes(first)) {
      const link = catalogueBookLink(first, 'elp-saga-first', `${first.title}, ${volumeLabel(first)}`);
      link.textContent = volumeLabel(first) || first.title;
      copy.classList.add('elp-folder-copy');
      copy.append(link);
      tile.append(copy);
    } else {
      copy.append(el('span', 'elp-book-meta', `${volumes.length} ${volumes.length === 1 ? 'tome' : 'tomes'}`));
      toggle.append(copy);
    }
    copy.append(el('span', 'elp-title', first.saga));
    if (first.author) copy.append(el('span', 'elp-book-author', first.author));
    return tile;
  }

  function sortedCatalogueEntries(matching, sortBy, groupSagas = true) {
    const firstInSaga = groupSagas ? new Map(sagaGroups(books.filter(book => book.saga))
      .map(([first]) => [sagaKey(first), first])) : null;
    const groups = groupSagas ? sagaGroups(matching) : matching.map(book => [book]);
    const entries = groups.map(volumes => {
      const [book] = volumes;
      const first = book.saga ? firstInSaga?.get(sagaKey(book)) ?? book : book;
      return {first, volumes, title: groupSagas ? first.saga || first.title : book.title};
    });
    const surname = author => {
      const name = (author ?? '').trim();
      return name.includes(',') ? name.split(',')[0] : name.split(/\s+/).at(-1);
    };
    return entries.sort((a, b) => {
      if (sortBy === 'author') {
        const authorOrder = collator.compare(surname(a.first.author), surname(b.first.author)) ||
          collator.compare(a.first.author ?? '', b.first.author ?? '');
        if (authorOrder) return authorOrder;
      }
      return collator.compare(a.title, b.title);
    });
  }

  function renderSearchEmpty(panel, noMatch, searching, filtered) {
    panel.hidden = !noMatch;
    if (!noMatch) return;
    find('p', panel).textContent = filtered
      ? (searching ? 'Essaie un autre titre ou modifie les filtres.' : 'Essaie de modifier les filtres.')
      : 'Essaie un autre titre ou le nom de l’auteur.';
    find('[data-clear-catalogue-search], [data-clear-search]', panel).hidden = !searching;
    find('[data-clear-result-filters]', panel).hidden = !filtered;
  }

  function renderCatalogue() {
    const searching = Boolean(catalogueSearch.value.trim());
    const catalogue = catalogues.get(scope);
    const matching = filterBooks(true).filter(book => catalogueIncludes(book) && (!favoritesOnly || book.coupDeCoeur));
    const redesigned = showingCatalogueList();
    const favorites = scope === 'favorites' && redesigned;
    const emptyList = redesigned && catalogueListIsEmpty();
    const hasFilters = countFilters(applied) > 0 || favoritesOnly;
    const noResults = !emptyList && !matching.length && (searching || (hasFilters && books.some(catalogueIncludes)));
    if (emptyList && !favorites) find('[data-catalogue-empty-description]').textContent = libraryLists[scope].emptyDescription;
    renderSearchEmpty(catalogueNoResults, noResults, searching, hasFilters);
    if (noResults) {
      const section = catalogueSections.find(entry => entry.section.contains(catalogueNoResults));
      if (!section.section.hidden && section.panel.inert) setSectionExpanded(section, true, false);
    }
    catalogueEmptyList.hidden = !emptyList || favorites;
    catalogueFavoritesEmpty.hidden = !emptyList || !favorites;
    catalogueOutput.hidden = noResults || emptyList;
    catalogueCount.textContent = favorites
      ? `${matching.length} ${matching.length === 1 ? 'coup de cœur' : 'coups de cœur'}`
      : countLabel(matching.length);
    saveCatalogueFilter.hidden = !countFilters(applied);
    catalogueFilterNotice.hidden = true;
    if (noResults || emptyList) {
      catalogueOutput.replaceChildren();
      refreshIcons();
      return;
    }
    if (!matching.length) {
      const empty = currentFolder() ? 'Aucun livre dans ce dossier.' : scope === 'genre' ? 'Aucun livre dans cette catégorie.' : libraryLists[scope].empty;
      catalogueOutput.replaceChildren(el('p', 'catalogue-empty', empty));
      return;
    }
    const entries = sortedCatalogueEntries(matching, catalogue.sort, !favorites);
    const grid = el('ul', 'elp-mosaic');
    for (const {first, volumes} of entries) {
      if (favorites || searching) {
        grid.append(...volumes.map(book => catalogueBookTile(book, {showSaga: false})));
        continue;
      }
      if (!first.saga) {
        grid.append(catalogueBookTile(first));
        continue;
      }
      const expanded = catalogue.expandedSagas.get(sagaKey(first)) ?? false;
      grid.append(catalogueFolder(volumes, first, catalogue.expandedSagas, expanded));
      if (expanded) {
        for (const book of volumes) if (book !== first) grid.append(catalogueBookTile(book));
      }
    }
    catalogueOutput.replaceChildren(grid);
    refreshIcons();
  }

  function catalogueBookActions(book) {
    const actions = el('fieldset', 'catalogue-book-actions');
    const label = el('label', '', 'Statut de lecture');
    const select = el('select');
    for (const status of statuses) {
      const option = el('option', '', status);
      option.value = status;
      select.append(option);
    }
    label.append(select);
    const favorite = button('', 'plain', () => save({coupDeCoeur: !book.coupDeCoeur}));
    favorite.append(icon('heart'), document.createTextNode(' Coup de cœur'));
    select.addEventListener('change', () => save({status: select.value, updatedAt: Date.now(),
      ...(select.value === 'Terminé' && !book.finishedAt ? {finishedAt: Date.now()} : {})}));
    const folderLabel = el('label', '', 'Ajouter à un dossier');
    const folderSelect = el('select');
    folderLabel.append(folderSelect);
    folderSelect.addEventListener('change', () => {
      if (folderSelect.value) save({}, folderSelect.value);
    });
    const synchronize = () => {
      select.value = book.status;
      favorite.setAttribute('aria-pressed', String(Boolean(book.coupDeCoeur)));
      const availableFolders = folders.filter(folder => !book.folderIds?.includes(folder.id));
      folderSelect.replaceChildren(el('option', '', 'Choisir un dossier'));
      folderSelect.firstElementChild.value = '';
      for (const folder of availableFolders) {
        const option = el('option', '', folderPath(folder));
        option.value = folder.id;
        folderSelect.append(option);
      }
      folderLabel.hidden = availableFolders.length === 0;
    };
    async function save(changes, folderId) {
      if (actions.disabled) return;
      const focus = document.activeElement;
      actions.disabled = true;
      const updated = {...book, ...changes};
      try {
        const saved = await storage.putBook(updated, undefined, folderId);
        Object.assign(book, saved);
        const status = find('[data-book-detail-status]', otherBody);
        if (status && actions.isConnected) status.textContent = book.status;
        if (other.hidden) {
          const focusedId = document.activeElement.id;
          renderContent();
          if (focusedId) document.getElementById(focusedId)?.focus({preventScroll: true});
        }
        announce(`${book.title} · Modifications enregistrées.`);
      } catch {
        showStorageError();
      } finally {
        actions.disabled = false;
        synchronize();
        if (focus?.isConnected && !focus.closest('[hidden]')) focus.focus({preventScroll: true});
      }
    }
    synchronize();
    actions.append(label, favorite, folderLabel);
    return actions;
  }

  function bookRow(book) {
    const row = el('article', 'book-row');
    const main = el('button', 'book-main cursor-interaction');
    main.type = 'button';
    main.id = `library-book-${book.id}`;
    main.dataset.book = book.id;
    bindBookGesture(main, () => book);
    main.append(el('span','book-title',book.title + (book.volume ? ` · Tome ${book.volume.replace('.', ',')}` : '')),
      el('span','book-meta',[book.author,book.format,book.status].filter(Boolean).join(' · ')));
    if (book.coverData) {
      const copy = el('span','imported-book-copy');
      copy.append(...main.childNodes);
      main.classList.add('book-with-cover');
      main.replaceChildren(makeCoverImage(book), copy);
    }
    row.append(main, ...bookRowActions(book));
    return row;
  }

  function bookRowActions(book) {
    const actions = el('div','book-actions');
    actions.hidden = true;
    const toggle = button('', 'round', () => {
      const open = actions.hidden;
      for (const panel of all('.book-actions', bookList)) {
        if (panel.hidden) continue;
        panel.hidden = true;
        panel.previousElementSibling.setAttribute('aria-expanded', 'false');
      }
      actions.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
    });
    toggle.append(icon('ellipsis'));
    toggle.setAttribute('aria-label', `Actions pour ${book.title}${book.volume ? `, tome ${book.volume}` : ''}`);
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', `${root.id}-actions-${book.id}`);
    actions.id = `${root.id}-actions-${book.id}`;
    actions.append(el('h3','','Statut de lecture'));
    for (const status of statuses) {
      const choice = button(status,'menu-row sort-choice', async () => {
        if (book.status === status) {
          actions.hidden = true;
          toggle.setAttribute('aria-expanded', 'false');
          toggle.focus({preventScroll: true});
          return;
        }
        choice.disabled = true;
        const updated = {...book, status, updatedAt: Date.now(),
          ...(status === 'Terminé' && !book.finishedAt ? {finishedAt: Date.now()} : {})};
        try {
          await storage.putBook(updated);
        } catch {
          choice.disabled = false;
          showStorageError();
          return;
        }
        Object.assign(book, updated);
        renderContent();
        statusNotice.hidden = false;
        statusNotice.textContent = `${book.title} · Nouveau statut « ${status} ».`;
        const target = find(`#${root.id}-actions-${book.id}`)?.previousElementSibling ??
          (catalogueBack.hidden ? search : catalogueBack);
        target.focus({preventScroll: true});
      });
      choice.setAttribute('aria-pressed', String(status === book.status));
      choice.append(icon('check'));
      actions.append(choice);
    }
    const favorite = button('Coup de cœur', 'menu-row sort-choice', async () => {
      favorite.disabled = true;
      const updated = {...book, coupDeCoeur: !book.coupDeCoeur};
      try {
        await storage.putBook(updated);
      } catch {
        favorite.disabled = false;
        showStorageError();
        return;
      }
      Object.assign(book, updated);
      renderResults();
      const next = find(`#${root.id}-actions-${book.id}`)?.previousElementSibling ?? (catalogueBack.hidden ? search : catalogueBack);
      next.focus({preventScroll: true});
      announce(book.coupDeCoeur ? 'Ajouté aux coups de cœur.' : 'Retiré des coups de cœur.');
    });
    favorite.setAttribute('aria-pressed', String(Boolean(book.coupDeCoeur)));
    actions.append(favorite);
    return [toggle, actions];
  }

  function renderResults() {
    const query = Boolean(search.value.trim());
    const list = scope === 'genre' ? libraryLists[activeLibraryTab] : libraryLists[scope];
    const matching = filterBooks(true).filter(book => query || (
      (scope !== 'genre' || book.genres.includes(selectedGenre.name)) &&
      (scope !== 'collection' || collection.ids.includes(book.id)) && (!list || list.includes(book))
    ));
    find('[data-results-title]').textContent = query ? 'Résultats' : scope === 'genre' ? selectedGenre.name : scope === 'collection' ? collection.name : (list?.title ?? 'Tous les livres');
    find('[data-results-count]').textContent = countLabel(matching.length);
    const noMatch = query && !matching.length;
    results.toggleAttribute('data-library-search-results', query);
    resultsHeader.hidden = noMatch;
    renderSearchEmpty(searchEmpty, noMatch, query, countFilters(applied) > 0);
    bookList.hidden = noMatch;
    const ordered = query ? sortedCatalogueEntries(matching, bookSort).flatMap(entry => entry.volumes)
      : sagaGroups(matching).flat();
    if (query) {
      if (noMatch) bookList.replaceChildren();
      else {
        const mosaic = el('ul', 'elp-mosaic');
        mosaic.setAttribute('aria-label', 'Livres trouvés');
        mosaic.append(...ordered.map(book => catalogueBookTile(book, {
          showSaga: false,
          linkId: `library-book-${book.id}`,
        })));
        bookList.replaceChildren(mosaic);
      }
    } else bookList.replaceChildren(...ordered.map(bookRow));
    if (!matching.length && !query) {
      const message = countFilters(applied) ? 'Aucun livre ne correspond.'
        : (scope === 'genre' ? null : list?.empty) ?? 'Aucun livre dans cette sélection.';
      bookList.append(el('p', 'empty', message));
    }
    refreshIcons();
  }

  function markBottomPage(page) {
    for (const item of all('[data-bottom-page]')) {
      if (item.dataset.bottomPage === page) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    }
  }

  function renderContent() {
    markBottomPage(scope === 'all' ? 'library' : 'home');
    refreshSidebarPage();
    syncCatalogueView();
    root.toggleAttribute('data-accueil-page', scope === 'home');
    if (catalogues.has(scope)) {
      if (!catalogueView.hidden) {
        const title = catalogueTitleText();
        catalogueView.toggleAttribute('data-category-catalogue', scope === 'genre' || Boolean(currentFolder()));
        catalogueTitle.setAttribute('aria-label', title);
        const [initial, ...rest] = title;
        find('.elp-script', catalogueTitle).textContent = initial;
        find('.elp-heading-rest', catalogueTitle).textContent = rest.join('');
        catalogueSearchForm.setAttribute('aria-label', `Rechercher dans « ${title} »`);
        updateCatalogueMode();
        drawCollections();
        renderCatalogue();
      }
      return;
    }
    const home = scope === 'home';
    const emptyLibrary = home && books.length === 0;
    const searching = Boolean(search.value.trim());
    const showResults = !emptyLibrary && (!home || searching);
    find('[data-library-empty]').hidden = !emptyLibrary;
    search.closest('.search').hidden = emptyLibrary;
    statusNotice.hidden = true;
    statusNotice.textContent = '';
    const accueilOn = home && !emptyLibrary && !searching;
    genreHeading.hidden = true;
    tabRow.hidden = true;
    grid.hidden = showResults || emptyLibrary || accueilOn;
    listAccess.hidden = showResults || emptyLibrary || accueilOn;
    listAccessLabel.textContent = libraryLists[activeLibraryTab].action;
    results.hidden = !showResults;
    find('[data-save-filter]').hidden = !countFilters(applied);
    filterNotice.hidden = true;
    filterNotice.textContent = '';
    find('[data-clear-search]').hidden = !search.value;
    for (const tab of tabs) {
      const value = tab.dataset.libraryTab;
      tab.setAttribute('aria-pressed', String(value === activeLibraryTab));
      find('[data-tab-count]', tab).textContent = String(books.filter(libraryLists[value].includes).length);
    }
    refreshReadingCover();
    find('[data-current-reading]', libraryContent).hidden = true;
    const showRecentSearches = recentOpen();
    renderAccueil(accueilOn && !showRecentSearches);
    const now = new Date();
    renderHello(home && !emptyLibrary && !searching && !showRecentSearches, now);
    if (home) renderAnnualGoal(now);
    renderRecent();
    renderPill(home && !emptyLibrary);
    if (showResults) renderResults(); else if (!accueilOn) renderGrid();
  }

  function setScope(view, value = null) {
    closeFolderForm();
    dismissImport();
    const entering = catalogues.has(view);
    const changeCatalogue = (scope !== view || folderTrail.length > 0 || catalogueMode !== 'overview' || view === 'genre') &&
      (catalogues.has(scope) || entering);
    if (changeCatalogue) resetCatalogueSections();
    scope = view;
    catalogueMode = 'overview';
    folderTrail.length = 0;
    catalogueReturn = null;
    if (catalogues.has(scope)) {
      catalogueSearch.value = '';
      favoritesOnly = false;
    }
    selectedGenre = view === 'genre' ? value : null;
    collection = view === 'collection' ? value : null;
    search.value = '';
    other.hidden = true;
    showWindow();
    renderContent();
    if (changeCatalogue) {
      window.scrollTo({top: 0, behavior: 'auto'});
      if (entering) animateCatalogueSections();
    }
  }

  function openCatalogue(view = 'all') {
    setScope(view);
    catalogueTitle.focus({preventScroll: true});
  }

  const coverAssets = './vendor/';
  let pdfEngine;
  let closeImport = () => {};

  const coverReader = createCoverReader({
    zip: window.JSZip,
    getPdfEngine: () => {
      pdfEngine ||= import(coverAssets + 'pdf.min.mjs').then(pdf => {
        pdf.GlobalWorkerOptions.workerSrc = coverAssets + 'pdf.worker.min.mjs';
        return pdf;
      }).catch(() => {
        pdfEngine = null;
        throw Error('Le lecteur PDF n’a pas pu se charger. Vérifie ta connexion, puis réessaie.');
      });
      return pdfEngine;
    },
    createCanvas: (width,height) => {
      const canvas = el('canvas');
      canvas.width = width;
      canvas.height = height;
      return canvas;
    },
    parseXml: text => new DOMParser().parseFromString(text, 'application/xml'),
    decodeImage: async blob => {
      if (typeof createImageBitmap === 'function') {
        try { return await createImageBitmap(blob); } catch { /* Use the browser image decoder for formats it handles separately. */ }
      }
      const url = URL.createObjectURL(blob);
      try {
        const image = new Image();
        image.src = url;
        await image.decode();
        return {native: image, width: image.naturalWidth, height: image.naturalHeight, close: () => URL.revokeObjectURL(url)};
      } catch (error) {
        URL.revokeObjectURL(url);
        throw error;
      }
    },
  });


  function dismissImport() {
    if (bookFolderForm) closeFolderForm();
    dismissBook();
    closeImport();
    closeImport = () => {};
    if (!addBookPage.hidden) {
      addBookPage.hidden = true;
      addBookPage.replaceChildren();
    }
    root.removeAttribute('data-adding-book');
  }

  async function saveAddedBook(data, reading, folderId, isCurrent) {
    const {file, id: catalogueId, isbns, ...details} = data;
    const {statusChosen, promesse, ...readingFields} = reading;
    let fingerprint;
    if (file) {
      const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
      if (!isCurrent()) return;
      fingerprint = Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('');
    }
    const documentId = fingerprint && 'cover-import-' + fingerprint;
    const code = details.isbn || isbns?.[0] || '';
    const existing = books.find(book => (documentId && (book.id === documentId || book.fileFingerprint === fingerprint)) ||
      (catalogueId && book.catalogueId === catalogueId) || (code && book.isbn === code));
    const imported = {
      genres: [], subgenres: [], tropes: [],
      ...existing, ...details, ...(existing && !statusChosen ? {} : readingFields),
      ...(promesse ? {promesse} : {}),
      id: existing?.id ?? documentId ?? (catalogueId ? 'catalogue:' + catalogueId : 'paper:' + crypto.randomUUID()),
      isbn: code || existing?.isbn || '',
      catalogueId: catalogueId || existing?.catalogueId,
      coverData: details.coverData || existing?.coverData,
      fileFingerprint: fingerprint || existing?.fileFingerprint,
      format: !file && existing && existing.format !== 'Papier' ? existing.format : details.format,
      updatedAt: Date.now(),
      addedAt: existing?.addedAt ?? Date.now(),
    };
    if (imported.status === 'Terminé' && !imported.finishedAt) imported.finishedAt = Date.now();
    const position = reading.readingPosition;
    if (position?.unit === 'chapter') imported.chapter = position.value;
    if (position?.unit === 'percent') imported.progress = position.value;
    if (scope === 'genre' && !imported.genres.includes(selectedGenre.name)) {
      imported.genres = [...imported.genres, selectedGenre.name];
    }
    if (!isCurrent()) return;
    const book = await storage.putBook(imported, file, folderId);
    if (existing) Object.assign(existing, book);
    else books.unshift(book);
    options.author = sorted(unique(books.map(item => item.author).filter(Boolean)));
    options.trope = sorted(unique(books.flatMap(item => item.tropes)));
    if (isCurrent()) {
      returnFromSecondary();
      if (!catalogues.has(scope)) renderContent();
    } else if (other.hidden) {
      renderContent();
    }
  }

  function showAddBook() {
    const template = find('template[data-add-book-template]');
    addBookPage.append(template.content.cloneNode(true));
    addBookPage.hidden = false;
    const stage = find('#elp-add-book', addBookPage);
    stage.dataset.theme = root.dataset.theme;
    root.setAttribute('data-adding-book', '');
    window.scrollTo({top: 0, behavior: 'auto'});
    closeImport = mountAddBook(stage, {
      engine: coverReader,
      findFolder: id => folders.find(folder => folder.id === id),
      folderCards: bookFolderCards,
      folderLabel: folderPath,
      folderHome: scope === 'favorites' ? 'list:all' : folderTrail[0]?.folder.parent ?? folderParent(),
      initialFolder: currentFolder(),
      openFolderEditor,
      saveBook: saveAddedBook,
      close: returnFromSecondary,
      home() {
        setScope('home');
        window.scrollTo({top: 0, behavior: 'instant'});
        sidebarToggle.focus({preventScroll: true});
      },
      openSidebar: button => setSidebarOpen(true, button),
      bookTagOptions,
      refreshIcons,
    });
  }

  function makeCoverImage(book) {
    const image = el('img','official-cover');
    image.src = book.coverData;
    image.alt = `Couverture de ${book.title}`;
    image.decoding = 'async';
    return image;
  }

  function importedReading() {
    return books.filter(book => book.status === 'En cours')
      .reduce((current, book) => !current || (book.updatedAt || 0) > (current.updatedAt || 0) ? book : current, null);
  }

  function refreshReadingCover() {
    const book = importedReading();
    const reading = find('.reading', libraryContent);
    const picture = find('[data-current-image]', reading);
    const label = find('.reading-title', reading);
    const [chapter, progress] = find('.progress-label', reading).children;
    const track = find('span', find('.track', reading));
    const author = find('[data-current-author]', reading);
    const series = find('[data-current-series]', reading);
    find('[data-current-reading]', libraryContent).hidden = !book || scope !== 'home' || Boolean(search.value.trim());
    series.textContent = [book?.saga, book?.volume && `Tome ${String(book.volume).replace('.', ',')}`].filter(Boolean).join(' · ');
    series.hidden = !series.textContent;
    label.textContent = book?.title || 'Aucune lecture en cours';
    author.textContent = book?.author || '';
    author.hidden = !author.textContent;
    const position = book?.readingPosition;
    const atPage = position?.unit === 'page';
    chapter.textContent = book ? atPage ? `Page ${position.value}` : `Chapitre ${(position?.unit === 'chapter' ? position.value : book.chapter) || 1}` : '';
    progress.textContent = book ? `${book.progress || 0} %` : '';
    track.style.width = `${book?.progress || 0}%`;
    find('.reading-progress', reading).hidden = !book;
    const cover = book?.coverData;
    picture.hidden = !cover;
    if (cover) picture.src = cover;
    else picture.removeAttribute('src');
    find('[data-cover-empty]', reading).hidden = Boolean(cover);
    reading.disabled = !book;
    reading.setAttribute('aria-label', book ? `Reprendre ${book.title}, ${chapter.textContent}, ${progress.textContent}` : label.textContent);
  }

  /* Accueil d'ouverture : ma pile, la suite des sagas, lus récemment, pastille du livre en cours. */
  const accueil = find('[data-accueil]');
  const accPill = find('[data-acc-pill]');
  const ACC_MAX = 5;
  const accVolume = book => Number(String(book.volume ?? '').replace(',', '.'));
  const accAddedRank = book => {
    if (book.addedAt) return book.addedAt;
    const index = books.indexOf(book);
    return index < 0 ? 0 : -index;
  };
  function accFinishedAt(book) {
    const end = book.readingEnd;
    if (end?.year) return new Date(Number(end.year), Number(end.month || 12) - 1, Number(end.day || 1)).getTime();
    return book.finishedAt || (book.status === 'Terminé' ? book.updatedAt || 0 : 0);
  }
  function accAgo(time) {
    const days = Math.max(0, Math.floor((Date.now() - time) / 86400000));
    if (days === 0) return 'aujourd’hui';
    if (days === 1) return 'hier';
    if (days < 7) return `il y a ${days} jours`;
    if (days < 30) return `il y a ${Math.round(days / 7)} sem.`;
    const months = Math.round(days / 30);
    return months < 12 ? `il y a ${months} mois` : `il y a ${Math.floor(days / 365)} an${days >= 730 ? 's' : ''}`;
  }
  /* Pour chaque saga commencée (au moins un tome lu), le tome suivant déjà présent dans la bibliothèque. */
  function accNextVolumes() {
    const groups = new Map();
    for (const book of books) {
      const saga = (book.saga || '').trim();
      if (!saga || !Number.isFinite(accVolume(book))) continue;
      const key = saga.toLocaleLowerCase('fr');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(book);
    }
    const next = [];
    for (const group of groups.values()) {
      group.sort((a, b) => accVolume(a) - accVolume(b));
      const read = group.filter(book => book.status === 'Terminé');
      if (!read.length || group.some(book => book.status === 'En cours')) continue;
      const lastRead = Math.max(...read.map(accVolume));
      const candidate = group.find(book => accVolume(book) > lastRead && book.status !== 'Terminé');
      if (!candidate) continue;
      const total = Math.max(...group.map(accVolume), Number(candidate.seriesTotal) || 0);
      next.push({book: candidate, lastRead, total, readAt: Math.max(...read.map(accFinishedAt))});
    }
    return next.sort((a, b) => b.readAt - a.readAt);
  }
  function accCard(book, {stamp, label, sub, extra, heart, menu} = {}) {
    const card = el('button', 'acc-card cursor-interaction');
    card.type = 'button';
    card.setAttribute('role', 'listitem');
    card.dataset.book = book.id;
    card.setAttribute('aria-label', [label || book.title, sub].filter(Boolean).join(', '));
    const cover = el('span', 'acc-cover');
    cover.append(catalogueCover(book));
    if (stamp) cover.append(el('i', 'acc-stamp', stamp));
    if (heart) {
      const mark = el('i', 'acc-heart', '♥');
      mark.setAttribute('aria-hidden', 'true');
      cover.append(mark);
    }
    card.append(cover, el('b', 'acc-name', label || book.title));
    if (sub) card.append(el('small', 'acc-sub', sub));
    if (extra) card.append(extra);
    card.addEventListener('click', event => {
      if (accPressFired) { accPressFired = false; event.preventDefault(); return; }
      openSecondary('book', book, card, {fromLibrary: true});
    });
    if (menu) accLongPress(card, book);
    return card;
  }

  // Commencer un livre : statut « En cours », date du jour, puis la liseuse (avec fichier) ou la fiche
  async function accStartBook(book, before) {
    const now = new Date();
    const updated = {...book, status: 'En cours', updatedAt: Date.now(),
      ...(book.readingStart?.year ? {} : {readingStart: {day: String(now.getDate()), month: String(now.getMonth() + 1), year: String(now.getFullYear())}})};
    try { await storage.putBook(updated); }
    catch { showStorageError(); return false; }
    Object.assign(book, updated);
    before?.();
    renderContent();
    announce(`${book.title} · Lecture commencée.`);
    openSecondary('book', book, search, {fromLibrary: true, read: Boolean(book.fileFingerprint)});
    return true;
  }

  // Le dé de la pile : ouvre le questionnaire « Ta prochaine lecture »
  const accDice = find('[data-acc-dice]');
  let questionnaire = null;
  accDice?.addEventListener('click', async () => {
    try {
      if (!questionnaire) {
        const module = await import('./questionnaire.js?v=7');
        questionnaire = module.mountQuestionnaire({
          host: root,
          books: () => books,
          cover: catalogueCover,
          openBook: book => openSecondary('book', book, search, {fromLibrary: true}),
          startBook: book => accStartBook(book),
          async saveBook(updated) {
            const stamped = {...updated, updatedAt: Date.now()};
            await storage.putBook(stamped);
            const target = books.find(item => item.id === stamped.id);
            if (target) Object.assign(target, stamped);
          },
        });
      }
      questionnaire.open(accDice);
    } catch {
      showStorageError();
    }
  });

  // Appui long (0,5 s) sur un livre de la pile : la couverture se soulève, une bulle s'ouvre dessous
  const accMenu = find('[data-acc-menu]');
  const accVeil = find('[data-acc-veil]');
  let accPressFired = false;
  let accMenuCard = null;
  function accLongPress(card, book) {
    let timer = 0;
    let start = null;
    const cancel = () => { clearTimeout(timer); timer = 0; start = null; if (accMenuCard !== card) card.classList.remove('lifting'); };
    card.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0) return;
      accPressFired = false;
      start = {x: event.clientX, y: event.clientY};
      card.classList.add('lifting');
      timer = setTimeout(() => { timer = 0; accPressFired = true; openAccMenu(card, book); }, 500);
    });
    card.addEventListener('pointermove', event => {
      if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8) cancel();
    });
    for (const type of ['pointerup', 'pointercancel', 'pointerleave']) card.addEventListener(type, () => { if (timer) cancel(); });
    card.addEventListener('contextmenu', event => {
      event.preventDefault();
      if (accMenuCard === card) return;
      clearTimeout(timer); timer = 0;
      openAccMenu(card, book);
    });
  }
  function accMenuItem(label, svg, action, extraClass = '') {
    const item = el('button', `acc-menu-item cursor-interaction ${extraClass}`.trim());
    item.type = 'button';
    item.setAttribute('role', 'menuitem');
    item.innerHTML = svg;
    item.append(el('span', '', label));
    item.addEventListener('click', action);
    return item;
  }
  const ACC_ICONS = {
    start: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>',
    heart: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
    heartOn: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
    remove: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/></svg>',
  };
  function placeAccMenu(card) {
    const rect = card.querySelector('.acc-cover').getBoundingClientRect();
    const width = accMenu.offsetWidth;
    const height = accMenu.offsetHeight;
    const left = Math.min(window.innerWidth - width - 12, Math.max(12, rect.left + rect.width / 2 - width / 2));
    const below = rect.bottom + 10;
    const top = below + height > window.innerHeight - 90 ? Math.max(12, rect.top - height - 10) : below;
    accMenu.style.left = `${left}px`;
    accMenu.style.top = `${top}px`;
    accMenu.style.transformOrigin = `${rect.left + rect.width / 2 - left}px ${top >= below ? 0 : height}px`;
  }
  function closeAccMenu(focusCard = false) {
    if (!accMenuCard) return;
    const card = accMenuCard;
    accMenuCard = null;
    card.classList.remove('lifting');
    accMenu.hidden = true;
    accVeil.hidden = true;
    accMenu.replaceChildren();
    if (focusCard && card.isConnected) card.focus({preventScroll: true});
  }
  function openAccMenu(card, book) {
    closeAccMenu();
    accMenuCard = card;
    card.classList.add('lifting');
    if (navigator.vibrate) { try { navigator.vibrate(8); } catch {} }
    accMenu.setAttribute('aria-label', `Actions pour ${book.title}`);
    const title = el('p', 'acc-menu-title', book.title);
    const busy = item => { for (const b of all('button', accMenu)) b.disabled = true; item?.setAttribute('aria-busy', 'true'); };
    const start = accMenuItem('Commencer', ACC_ICONS.start, async () => {
      busy(start);
      const ok = await accStartBook(book, () => closeAccMenu());
      if (!ok) closeAccMenu();
    });
    const favorite = accMenuItem(book.coupDeCoeur ? 'Retirer des coups de cœur' : 'Coup de cœur', book.coupDeCoeur ? ACC_ICONS.heartOn : ACC_ICONS.heart, async () => {
      busy(favorite);
      const updated = {...book, coupDeCoeur: !book.coupDeCoeur, updatedAt: Date.now()};
      try { await storage.putBook(updated); }
      catch { closeAccMenu(); showStorageError(); return; }
      Object.assign(book, updated);
      closeAccMenu(true);
      renderContent();
      announce(book.coupDeCoeur ? 'Ajouté aux coups de cœur.' : 'Retiré des coups de cœur.');
    }, book.coupDeCoeur ? 'is-on' : '');
    const remove = accMenuItem('Retirer de ma pile', ACC_ICONS.remove, () => {
      // Confirmation dans la bulle : le livre quitte toute l'app
      const question = el('p', 'acc-menu-ask', 'Supprimer ce livre de ta bibliothèque ?');
      const actions = el('div', 'acc-menu-confirm');
      const cancel = el('button', 'acc-menu-cancel cursor-interaction', 'Annuler');
      cancel.type = 'button';
      cancel.addEventListener('click', () => closeAccMenu(true));
      const confirm = el('button', 'acc-menu-delete cursor-interaction', 'Supprimer');
      confirm.type = 'button';
      confirm.addEventListener('click', async () => {
        busy(confirm);
        try { await storage.removeBook(book.id); }
        catch { closeAccMenu(); showStorageError(); return; }
        const index = books.findIndex(item => item.id === book.id);
        if (index >= 0) books.splice(index, 1);
        closeAccMenu();
        renderContent();
        announce(`${book.title} a été supprimé.`);
        search.focus({preventScroll: true});
      });
      actions.append(cancel, confirm);
      accMenu.replaceChildren(title, question, actions);
      placeAccMenu(card);
      cancel.focus({preventScroll: true});
    }, 'danger');
    accMenu.replaceChildren(title, start, favorite, remove);
    accMenu.hidden = false;
    accVeil.hidden = false;
    placeAccMenu(card);
    start.focus({preventScroll: true});
  }
  accVeil.addEventListener('pointerdown', event => { event.preventDefault(); closeAccMenu(); });
  accMenu.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.stopPropagation(); closeAccMenu(true); return; }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const items = all('button:not([disabled])', accMenu);
    const index = items.indexOf(document.activeElement);
    const next = items[(index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length];
    event.preventDefault();
    next?.focus();
  });
  window.addEventListener('scroll', () => closeAccMenu(), {passive: true});
  window.addEventListener('resize', () => closeAccMenu());
  function accMore(count, noun, target) {
    const card = el('button', 'acc-card acc-more cursor-interaction');
    card.type = 'button';
    card.setAttribute('role', 'listitem');
    const box = el('span', 'acc-cover');
    box.append(el('span', 'acc-more-count', `+${count}`), el('small', '', noun));
    card.append(box, el('b', 'acc-name', target.label));
    card.addEventListener('click', target.open);
    return card;
  }
  function accFill(name, items, total, moreTarget, noun) {
    const row = find(`[data-acc-row="${name}"]`, accueil);
    row.hidden = items.length === 0;
    if (row.hidden) return;
    find('[data-acc-count]', row).textContent = String(total);
    const track = find('[data-acc-track]', row);
    const cards = items.slice(0, ACC_MAX);
    if (total > cards.length && moreTarget) cards.push(accMore(total - cards.length, noun(total - cards.length), moreTarget));
    track.replaceChildren(...cards);
    const dots = find('[data-acc-dots]', row);
    dots.replaceChildren(...cards.map((_, index) => el('i', index === 0 ? 'on' : '')));
    dots.hidden = cards.length < 2;
    track.scrollLeft = 0;
    requestAnimationFrame(accDotsFit);
  }
  // Les points n'apparaissent que si la rangée déborde de l'écran
  function accDotsFit() {
    for (const track of all('[data-acc-track]', accueil)) {
      const dots = track.nextElementSibling;
      dots.hidden = track.children.length < 2 || track.scrollWidth <= track.clientWidth + 2;
    }
  }
  window.addEventListener('resize', () => { if (!accueil.hidden) accDotsFit(); });
  const accOpenList = view => () => openCatalogue(view);
  function accTicks(lastRead, total, current) {
    const ticks = el('span', 'acc-ticks');
    ticks.setAttribute('aria-hidden', 'true');
    for (let volume = 1; volume <= Math.min(total, 12); volume += 1) {
      ticks.append(el('i', volume <= lastRead ? 'read' : volume === current ? 'next' : ''));
    }
    return ticks;
  }

  /* ---------- Parutions (Hardcover) : tomes à acheter et « Bientôt en librairie » ---------- */
  const PARU_KEY = 'elp-parutions';
  const PREVENIR_KEY = 'elp-prevenir';
  let parutions = null;
  let parutionsRequestKey = '';
  try {
    const cached = JSON.parse(localStorage.getItem(PARU_KEY) || 'null');
    if (cached?.data) { parutions = cached.data; parutionsRequestKey = cached.key || ''; }
  } catch {}
  function accSagaGroups() {
    const groups = new Map();
    for (const book of books) {
      const saga = (book.saga || '').trim();
      if (!saga) continue;
      const key = saga.toLocaleLowerCase('fr');
      if (!groups.has(key)) groups.set(key, {name: saga, author: book.author || '', books: []});
      groups.get(key).books.push(book);
    }
    return [...groups.values()];
  }
  function parutionsQuery() {
    const sagas = accSagaGroups()
      .map(group => ({name: group.name, author: group.author, last: Math.max(0, ...group.books.map(book => book.status === 'Terminé' ? Number(accFinishedAt(book)) || 0 : 0))}))
      .sort((a, b) => b.last - a.last).slice(0, 10).map(({name, author}) => ({name, author}));
    const authors = [...new Set(books.filter(book => book.coupDeCoeur && book.author).map(book => book.author.trim()))].slice(0, 6);
    return {sagas, authors};
  }
  let parutionsLoading = false;
  async function loadParutions() {
    if (parutionsLoading || typeof compteLecture === 'undefined' || !compteLecture?.db?.functions) return;
    const query = parutionsQuery();
    if (!query.sagas.length && !query.authors.length) return;
    const key = JSON.stringify(query);
    let fresh = false;
    try { fresh = Date.now() - (JSON.parse(localStorage.getItem(PARU_KEY) || 'null')?.at || 0) < 12 * 3600000; } catch {}
    if (fresh && key === parutionsRequestKey) return;
    parutionsLoading = true;
    try {
      const {data, error} = await compteLecture.db.functions.invoke('catalogue', {body: {action: 'parutions', params: query}});
      if (!error && data?.series) {
        parutions = data;
        parutionsRequestKey = key;
        try { localStorage.setItem(PARU_KEY, JSON.stringify({at: Date.now(), key, data})); } catch {}
        if (!accueil.hidden) renderContent();
      }
    } catch {} finally { parutionsLoading = false; }
  }
  const prevenir = () => { try { return new Set(JSON.parse(localStorage.getItem(PREVENIR_KEY) || '[]')); } catch { return new Set(); } };
  const dayStart = date => { const d = new Date(date); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const parseDay = value => { const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getTime() : null; };
  function remoteCard({key, label, sub, image, extra, onAdd, soon}) {
    const card = el('div', 'acc-card acc-remote');
    card.setAttribute('role', 'listitem');
    const cover = el('span', 'acc-cover');
    if (image) {
      const img = el('img', 'elp-cover');
      img.src = image; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async'; img.referrerPolicy = 'no-referrer';
      img.addEventListener('error', () => img.replaceWith(Object.assign(el('span', 'elp-cover elp-cover-placeholder'), {textContent: ''})));
      cover.append(img);
    } else cover.append(el('span', 'elp-cover elp-cover-placeholder acc-remote-title', label));
    if (soon) {
      cover.classList.add('is-soon');
      cover.append(el('i', 'acc-band', soon.out ? 'Sorti !' : 'À paraître'));
      const bell = el('button', 'acc-bell cursor-interaction');
      bell.type = 'button';
      const on = () => prevenir().has(key);
      const draw = () => {
        bell.setAttribute('aria-pressed', String(on()));
        bell.setAttribute('aria-label', on() ? `Ne plus me prévenir pour ${label}` : `Me prévenir de la sortie de ${label}`);
        bell.innerHTML = `<svg viewBox="0 0 24 24" fill="${on() ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`;
      };
      bell.addEventListener('click', () => {
        const set = prevenir();
        set.has(key) ? set.delete(key) : set.add(key);
        try { localStorage.setItem(PREVENIR_KEY, JSON.stringify([...set])); } catch {}
        draw();
        announce(set.has(key) ? `Je te préviendrai à la sortie de ${label}.` : `Plus de rappel pour ${label}.`);
      });
      draw();
      cover.append(bell);
    }
    if (onAdd) {
      const plus = el('button', 'acc-plus cursor-interaction');
      plus.type = 'button';
      plus.setAttribute('aria-label', `Ajouter ${label}${sub ? `, ${sub}` : ''} à ma pile`);
      plus.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
      plus.addEventListener('click', () => { plus.disabled = true; onAdd().finally(() => { plus.disabled = false; }); });
      cover.append(plus);
    }
    card.append(cover, el('b', 'acc-name', label));
    if (sub) card.append(el('small', 'acc-sub', sub));
    if (extra) card.append(extra);
    return card;
  }
  async function imageAsData(url) {
    try {
      const response = await fetch(url, {referrerPolicy: 'no-referrer'});
      if (!response.ok) return '';
      const blob = await response.blob();
      if (!/^image\//.test(blob.type) || blob.size > 3_000_000) return '';
      return await new Promise(resolve => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => resolve(''); reader.readAsDataURL(blob); });
    } catch { return ''; }
  }
  async function addToPile({title, author, saga, volume, image}) {
    const now = Date.now();
    const book = {id: 'paper:' + crypto.randomUUID(), title, author: author || '', saga: saga || '', volume: volume ? String(volume) : '',
      status: 'À lire', format: 'Papier', genres: [], subgenres: [], tropes: [], addedAt: now, updatedAt: now};
    const cover = image ? await imageAsData(image) : '';
    if (cover) book.coverData = cover;
    try { await storage.putBook(book); } catch { showStorageError(); return; }
    books.push(book);
    renderContent();
    announce(`${title} ajouté à ta pile.`);
  }
  // Tomes déjà sortis des sagas commencées, qu'elle n'a pas encore
  function accToBuy() {
    if (!parutions?.series) return [];
    const today = dayStart(Date.now());
    const out = [];
    for (const group of accSagaGroups()) {
      const read = group.books.filter(book => book.status === 'Terminé');
      if (!read.length || group.books.some(book => book.status === 'En cours')) continue;
      const lastRead = Math.max(...read.map(accVolume).filter(Number.isFinite), 0);
      const owned = new Set(group.books.map(accVolume).filter(Number.isFinite));
      if ([...owned].some(volume => volume > lastRead)) continue; // le tome suivant est déjà chez elle
      const volumes = parutions.series[group.name] || [];
      const next = volumes.find(item => item.position > lastRead);
      if (!next) continue;
      const date = parseDay(next.date);
      if (date == null || date > today) continue; // pas encore sorti : il ira dans « Bientôt »
      const status = el('span', 'acc-status');
      status.append(el('span', 'acc-pill-tag buy', 'À acheter'), accTicks(lastRead, Math.max(volumes.length, next.position), next.position));
      out.push({readAt: Math.max(...read.map(accFinishedAt)), card: remoteCard({
        key: `${group.name}#${next.position}`, label: group.name, sub: `tome ${next.position}`, image: next.image, extra: status,
        onAdd: () => addToPile({title: next.title || `${group.name}, tome ${next.position}`, author: group.author, saga: group.name, volume: next.position, image: next.image}),
      })});
    }
    return out;
  }
  // « Bientôt en librairie » : les 3 prochains mois, et « Sorti ! » pendant 7 jours
  function accSoon() {
    if (!parutions) return [];
    const today = dayStart(Date.now());
    const items = [];
    const ownedTitles = new Set(books.map(book => (book.title || '').toLocaleLowerCase('fr').trim()));
    for (const group of accSagaGroups()) {
      const owned = new Set(group.books.map(accVolume).filter(Number.isFinite));
      for (const volume of parutions.series?.[group.name] || []) {
        const date = parseDay(volume.date);
        if (date == null || owned.has(volume.position) || date < today - 7 * DAY_MS || date > today + 92 * DAY_MS) continue;
        items.push({key: `${group.name}#${volume.position}`, label: group.name, title: volume.title, sub: `tome ${volume.position}`, date, image: volume.image, heart: false});
      }
    }
    for (const book of parutions.upcoming || []) {
      const date = parseDay(book.date);
      if (date == null || date < today - 7 * DAY_MS || date > today + 92 * DAY_MS) continue;
      if (ownedTitles.has((book.title || '').toLocaleLowerCase('fr').trim())) continue;
      const key = book.saga && book.position ? `${book.saga}#${book.position}` : `titre:${book.title}`;
      if (items.some(item => item.key === key)) continue;
      items.push({key, label: book.saga || book.title, title: book.title, sub: book.saga && book.position ? `tome ${book.position}` : book.author, date, image: book.image, heart: true});
    }
    items.sort((a, b) => a.date - b.date);
    return items.slice(0, 8).map(item => {
      const days = Math.round((item.date - today) / DAY_MS);
      const out = days <= 0;
      const when = el('small', `acc-when${out ? ' is-out' : ''}`, out ? 'Sorti !' : days === 1 ? 'demain' : `dans ${days} jours`);
      const extra = el('span', 'acc-status');
      extra.append(when);
      if (item.heart) { const heart = el('span', 'acc-follow', '♥'); heart.title = 'Une autrice de tes coups de cœur'; extra.append(heart); }
      return remoteCard({key: item.key, label: item.label, sub: item.sub, image: item.image, extra, soon: {out}});
    });
  }
  const DAY_MS = 86400000;

  function renderAccueil(show) {
    accueil.hidden = !show;
    if (!show) return;
    loadParutions();
    const nextVolumes = accNextVolumes();
    const sagaIds = new Set(nextVolumes.map(item => item.book.id));
    const pile = books.filter(book => book.status === 'À lire' && !sagaIds.has(book.id))
      .sort((a, b) => accAddedRank(b) - accAddedRank(a));
    const pileTotal = books.filter(book => book.status === 'À lire').length;
    accFill('pile', pile.map(book => accCard(book, {stamp: book.addedAt ? accAgo(book.addedAt) : '', menu: true})),
      pileTotal, {label: 'Voir ma pile', open: accOpenList('pile')}, n => n === 1 ? 'autre livre' : 'autres livres');
    const sagaCards = nextVolumes.map(({book, lastRead, total, readAt}) => {
      const status = el('span', 'acc-status');
      const pill = el('span', `acc-pill-tag ${book.status === 'À lire' ? 'pile' : 'buy'}`, book.status === 'À lire' ? 'Dans ta pile' : 'Dans ta bibliothèque');
      status.append(pill, accTicks(lastRead, Math.max(total, accVolume(book)), accVolume(book)));
      return {readAt, card: accCard(book, {label: book.saga, sub: `tome\u00a0${String(book.volume).replace('.', ',')}`, extra: status})};
    });
    for (const item of accToBuy()) sagaCards.push(item);
    sagaCards.sort((a, b) => b.readAt - a.readAt);
    accFill('sagas', sagaCards.map(item => item.card), sagaCards.length, {label: 'Voir mes sagas', open: accOpenList('all')}, n => n === 1 ? 'autre saga' : 'autres sagas');
    const soonCards = accSoon();
    accFill('bientot', soonCards, soonCards.length, null, () => '');
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const lus = books.filter(book => book.status === 'Terminé' && accFinishedAt(book) >= monthStart)
      .sort((a, b) => accFinishedAt(b) - accFinishedAt(a));
    accFill('lus', lus.map(book => accCard(book, {sub: accAgo(accFinishedAt(book)), heart: book.coupDeCoeur === true})),
      lus.length, {label: 'Tout voir', open: accOpenList('finished')}, n => n === 1 ? 'autre livre' : 'autres livres');
  }
  for (const more of all('[data-acc-more]')) {
    more.addEventListener('click', () => openCatalogue({pile: 'pile', sagas: 'all', lus: 'finished'}[more.dataset.accMore]));
  }
  accueil.addEventListener('scroll', event => {
    const track = event.target;
    if (!track.matches?.('[data-acc-track]')) return;
    const cards = [...track.children];
    if (!cards.length) return;
    const step = cards[1] ? cards[1].offsetLeft - cards[0].offsetLeft : track.clientWidth;
    const index = Math.min(cards.length - 1, Math.round(track.scrollLeft / Math.max(1, step)));
    [...track.nextElementSibling.children].forEach((dot, i) => dot.classList.toggle('on', i === index));
  }, true);
  /* Pastille : ouverte en haut de page, réduite en rond quand on fait défiler vers le bas, rouverte en remontant tout en haut. */
  let accPillMini = false;
  function renderPill(show) {
    const book = show ? importedReading() : null;
    accPill.hidden = !book;
    if (!book) return;
    const cover = find('[data-acc-pill-cover]', accPill);
    cover.replaceChildren(catalogueCover(book));
    find('[data-acc-pill-title]', accPill).textContent = book.title;
    const progress = Math.max(0, Math.min(100, Number(book.progress) || 0));
    find('[data-acc-pill-sub]', accPill).textContent = [book.author, `${progress} %`].filter(Boolean).join(' · ');
    find('[data-acc-pill-bar]', accPill).style.width = `${progress}%`;
    find('[data-acc-ring]', accPill).setAttribute('stroke-dasharray', `${(2 * Math.PI * 17 * progress / 100).toFixed(1)} 999`);
    accPill.setAttribute('aria-label', `Reprendre ${book.title}, ${progress} %`);
    accPill.classList.toggle('mini', accPillMini);
  }
  window.addEventListener('scroll', () => {
    if (accPill.hidden) return;
    const y = window.scrollY;
    if (!accPillMini && y > 40) accPillMini = true;
    else if (accPillMini && y <= 4) accPillMini = false;
    else return;
    accPill.classList.toggle('mini', accPillMini);
  }, {passive: true});
  accPill.addEventListener('click', () => {
    if (accPill.classList.contains('mini')) {
      accPillMini = false;
      accPill.classList.remove('mini');
      return;
    }
    openSecondary('reading', null, accPill);
  });

  // Accueil : salutation, pile à lire et objectif annuel dans la barre.
  const PRENOM = 'Elisa';
  const accHello = find('[data-acc-hello]');
  const accGoal = find('[data-acc-goal]');
  function renderHello(show, now) {
    accHello.hidden = !show;
    if (!show) return;
    const hour = now.getHours();
    const evening = hour >= 18 || hour < 5;
    const title = find('[data-acc-hello-title]', accHello);
    const word = evening ? 'Bonsoir' : 'Bonjour';
    title.replaceChildren(el('span', 'acc-hello-initial', word[0]), `${word.slice(1)} ${PRENOM}`);
    title.setAttribute('aria-label', `${word} ${PRENOM}`);
    const moment = evening ? 'Belle soirée de lecture' : hour < 12 ? 'Belle matinée de lecture' : 'Bel après-midi de lecture';
    const pile = books.filter(book => book.status === 'À lire').length;
    const subtitle = find('[data-acc-hello-sub]', accHello);
    subtitle.replaceChildren(el('em', '', moment));
    if (pile) {
      subtitle.append(' · ', el('strong', '', `${pile}\u00a0livre${pile > 1 ? 's' : ''}`),
        ` t’attend${pile > 1 ? 'ent' : ''} dans ta pile`);
    }
  }

  function renderAnnualGoal(now) {
    const year = now.getFullYear();
    const count = books.filter(book => book.status === 'Terminé' && new Date(accFinishedAt(book)).getFullYear() === year).length;
    const percent = Math.min(count / annualReadingGoal, 1) * 100;
    find('[data-acc-goal-count]', accGoal).textContent = `${count} / ${annualReadingGoal}`;
    find('[data-acc-goal-ring]', accGoal).setAttribute('stroke-dasharray', `${percent} 100`);
    const unit = count > 1 ? 'livres lus' : 'livre lu';
    accGoal.setAttribute('aria-label', `Objectif de lecture ${year}, ${count} ${unit} sur ${annualReadingGoal}`);
    accGoal.hidden = false;
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden || scope !== 'home' || !other.hidden) return;
    const now = new Date();
    renderHello(!accHello.hidden, now);
    renderAnnualGoal(now);
  });

  function annualGoalSetting() {
    const form = el('form', 'library-goal-setting');
    const title = el('label', '', 'Objectif annuel de lecture');
    title.htmlFor = 'elp-annual-reading-goal';
    const field = Object.assign(el('input'), {
      id: title.htmlFor,
      type: 'number',
      min: '1',
      max: String(Number.MAX_SAFE_INTEGER),
      step: '1',
      required: true,
      value: String(annualReadingGoal),
    });
    const submit = el('button', 'plain cursor-interaction', 'Enregistrer');
    submit.type = 'submit';
    const feedback = el('p');
    feedback.setAttribute('role', 'status');
    form.append(title, field, submit, feedback);
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (submit.disabled || !validReadingGoal(field.valueAsNumber)) return;
      const previous = annualReadingGoal;
      annualReadingGoal = field.valueAsNumber;
      field.disabled = submit.disabled = true;
      feedback.textContent = '';
      try {
        await savePreferences();
        feedback.textContent = 'Objectif enregistré.';
      } catch {
        annualReadingGoal = previous;
        feedback.textContent = 'Impossible d’enregistrer l’objectif. Réessaie.';
      } finally {
        field.disabled = submit.disabled = false;
        if (scope === 'home') renderAnnualGoal(new Date());
      }
    });
    return form;
  }

  // Recherches récentes : 3 gardées sur l'appareil
  const RECENT_KEY = 'elp-recherches-recentes';
  const recentBox = find('[data-recent]');
  const recentList = find('[data-recent-list]');
  let searchFocused = false;
  function readRecent() {
    try { const list = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); return Array.isArray(list) ? list.filter(q => typeof q === 'string').slice(0, 3) : []; }
    catch { return []; }
  }
  function writeRecent(list) {
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 3))); } catch {}
  }
  function rememberSearch() {
    const q = search.value.trim();
    if (q.length < 2) return;
    writeRecent([q, ...readRecent().filter(item => item.toLowerCase() !== q.toLowerCase())]);
  }
  function recentOpen() {
    return scope === 'home' && searchFocused && !search.value.trim() && books.length > 0 && readRecent().length > 0;
  }
  function renderRecent() {
    const open = recentOpen();
    recentBox.hidden = !open;
    if (!open) return;
    recentList.replaceChildren(...readRecent().map(q => {
      const item = el('li', 'acc-recent-item');
      const pick = el('button', 'acc-recent-pick cursor-interaction');
      pick.type = 'button';
      pick.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>';
      pick.append(el('span', '', q));
      pick.addEventListener('click', () => { search.value = q; rememberSearch(); renderContent(); });
      const remove = el('button', 'acc-recent-remove cursor-interaction');
      remove.type = 'button';
      remove.setAttribute('aria-label', `Retirer « ${q} » des recherches récentes`);
      remove.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
      remove.addEventListener('click', () => { writeRecent(readRecent().filter(item => item !== q)); renderContent(); search.focus({preventScroll: true}); });
      item.append(pick, remove);
      return item;
    }));
  }
  // Toucher la liste ne doit pas faire perdre le focus du champ avant le clic
  recentBox.addEventListener('pointerdown', event => event.preventDefault());
  find('[data-recent-clear]').addEventListener('click', () => { writeRecent([]); renderContent(); });
  search.addEventListener('focus', () => { searchFocused = true; if (recentOpen()) renderContent(); });
  search.addEventListener('blur', () => { searchFocused = false; rememberSearch(); if (scope === 'home') renderContent(); });
  search.addEventListener('keydown', event => { if (event.key === 'Enter') { rememberSearch(); search.blur(); } });

  // En-tête : se réduit en barre compacte collée en haut quand on fait défiler
  const headerBar = find('.toolbar');
  let headerCompact = false;
  function updateHeader() {
    const y = window.scrollY;
    const next = headerCompact ? y > 40 : y > 72;
    if (next === headerCompact) return;
    headerCompact = next;
    headerBar.classList.toggle('is-compact', headerCompact);
  }
  window.addEventListener('scroll', updateHeader, {passive: true});

  const previewSpaces = {
    journal: {title: 'Journal', empty: 'Aucune note de lecture.'},
    sheets: {title: 'Fiches', empty: 'Aucune fiche de fin de lecture.'},
    settings: {title: 'Réglages'},
  };

  function openSecondary(view, book = null, source = document.activeElement, {read = false, fromLibrary = false, openReadingSheet = false} = {}) {
    closeFolderForm();
    const space = previewSpaces[view];
    markBottomPage(view === 'reading' || space ? view : 'home');
    dismissImport();
    if (view === 'reading') book = importedReading();
    restoreFocus = source;
    libraryBookReturn = fromLibrary || view === 'add' ? {top: window.scrollY, id: source?.id} : null;
    if (!catalogueView.hidden) {
      catalogueReturn = {
        top: window.scrollY,
        bookId: restoreFocus?.dataset.book ?? '',
      };
    }
    showWindow();
    other.hidden = false;
    other.dataset.view = view;
    syncCatalogueView();
    if (catalogues.has(scope)) window.scrollTo({top: 0, behavior: 'auto'});
    refreshSidebarPage();
    otherBody.replaceChildren();
    if ((view === 'book' || view === 'reading') && book) {
      root.setAttribute('data-book-open', '');
      bookHost.hidden = false;
      function refreshBookLists() {
        options.author = sorted(unique(books.map(item => item.author).filter(Boolean)));
        collections[0].ids = books.filter(item => item.status === 'À lire').map(item => item.id);
      }
      function home() {
        setScope('home');
        window.scrollTo({top:0, behavior:'instant'});
        sidebarToggle.focus({preventScroll:true});
      }
      disposeBook = mountSavedBook({
        root, host: bookHost, book, storage, engine: coverReader, bookTagOptions, refreshIcons, home: fromLibrary ? returnFromSecondary : home,
        startInReader: read || (view === 'reading' && (book.format !== 'Papier' || Boolean(book.fileFingerprint))),
        startInNote: openReadingSheet,
        returnToLibrary: fromLibrary ? returnFromSecondary : null,
        setReaderTheme(theme) {setTheme(theme);savePreferences().catch(showStorageError);},
        onError: showStorageError,
        onSave(updated) { Object.assign(book, updated); refreshBookLists(); },
        onRemove() {
          const index = books.findIndex(item => item.id === book.id);
          if (index >= 0) books.splice(index, 1);
          refreshBookLists();
          if (root.hasAttribute('data-book-open') && bookHost.dataset.bookId === book.id) home();
        },
      });
      return;
    }
    const title = space?.title ?? (view === 'add' ? 'Ajouter un livre' : view === 'collections' ? 'Mes collections' : book?.title ?? 'Aucune lecture en cours');
    if (view !== 'add') otherBody.append(el('h2','',title));
    if (space?.empty) otherBody.append(el('p','',space.empty));
    if (view === 'settings') {
      const theme = button('Mode sombre', 'plain', () => {
        setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
        theme.setAttribute('aria-pressed', String(root.dataset.theme === 'dark'));
        savePreferences().catch(showStorageError);
      });
      theme.setAttribute('aria-pressed', String(root.dataset.theme === 'dark'));
      const settings = el('div', 'library-settings');
      settings.append(theme, annualGoalSetting(), el('h3', '', 'Filtres enregistrés'));
      for (const filters of savedFilters) {
        const label = filterLabelOrder.flatMap(name => filters[name]).filter(Boolean).join(' · ');
        settings.append(button(label, 'plain', () => {
          openCatalogue();
          applyFilters(filters);
        }));
      }
      otherBody.append(settings);
    }
    if (view === 'add') {
      showAddBook();
      return;
    }
    if (view === 'collections') for (const entry of collections) otherBody.append(button(entry.name,'menu-row',() => setScope('collection',entry)));
    catalogueBack.focus({preventScroll: true});
  }

  function moveGenre(from, to) {
    const start = ownOrder.findIndex(genre => genre.name === from);
    const end = ownOrder.findIndex(genre => genre.name === to);
    if (start < 0 || end < 0 || start === end) return;
    ownOrder.splice(end, 0, ...ownOrder.splice(start, 1));
    savePreferences().catch(showStorageError);
    renderGrid();
    all('[data-genre]',grid).find(tile => tile.dataset.genre === from)?.focus({preventScroll:true});
    announce(`${from} déplacé dans Mon ordre.`);
  }

  function finishGesture(apply) {
    if (!gesture) return;
    const {tile, target, timer, dragging} = gesture;
    clearTimeout(timer);
    gesture = null;
    if (!dragging) return;
    tile.dataset.skipClick = 'true';
    setTimeout(() => { delete tile.dataset.skipClick; }, 0);
    tile.classList.remove('dragging');
    target?.classList.remove('drop-target');
    if (apply && target) moveGenre(tile.dataset.genre,target.dataset.genre);
  }

  function beginGesture(tile, x, y, pointer) {
    if (!tile || sort !== 'custom') return;
    finishGesture(false);
    const timer = setTimeout(() => {
      if (!gesture) return;
      gesture.dragging = true;
      tile.classList.add('dragging');
      if (pointer !== null && tile.isConnected) tile.setPointerCapture(pointer);
    }, 380);
    gesture = {tile, timer, x, y, pointer, target: null, dragging: false};
  }

  function updateGesture(x, y) {
    if (!gesture.dragging) {
      if (Math.hypot(x - gesture.x, y - gesture.y) > 9) finishGesture(false);
      return;
    }
    const hit = document.elementFromPoint(x,y)?.closest('[data-genre]');
    const target = hit && hit !== gesture.tile ? hit : null;
    if (gesture.target === target) return;
    gesture.target?.classList.remove('drop-target');
    gesture.target = target;
    gesture.target?.classList.add('drop-target');
  }

  grid.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch' || event.button !== 0 || !event.isPrimary) return;
    beginGesture(event.target.closest('[data-genre]'), event.clientX, event.clientY, event.pointerId);
  });
  root.addEventListener('pointermove', event => {
    if (gesture?.pointer === event.pointerId) updateGesture(event.clientX, event.clientY);
  });
  root.addEventListener('pointerup', event => { if (gesture?.pointer === event.pointerId) finishGesture(true); });
  root.addEventListener('pointercancel', event => { if (gesture?.pointer === event.pointerId) finishGesture(false); });
  grid.addEventListener('touchstart', event => {
    if (event.touches.length !== 1) { finishGesture(false); return; }
    const {clientX, clientY} = event.touches[0];
    beginGesture(event.target.closest('[data-genre]'), clientX, clientY, null);
  }, {passive: true});
  grid.addEventListener('touchmove', event => {
    if (gesture?.pointer !== null || event.touches.length !== 1) return;
    if (gesture.dragging && event.cancelable) event.preventDefault();
    const {clientX, clientY} = event.touches[0];
    updateGesture(clientX,clientY);
  }, {passive: false});
  grid.addEventListener('touchend', event => {
    if (gesture?.pointer !== null) return;
    if (gesture.dragging && event.cancelable) event.preventDefault();
    finishGesture(true);
  }, {passive: false});
  grid.addEventListener('touchcancel', () => finishGesture(false), {passive: true});
  grid.addEventListener('contextmenu', event => { if (gesture?.dragging) event.preventDefault(); });
  grid.addEventListener('keydown', event => {
    const columns = Number(window.getComputedStyle(grid).getPropertyValue('--genre-columns')) || 3;
    const offsets = {ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columns, ArrowDown: columns};
    if (!event.altKey || sort !== 'custom' || !(event.key in offsets)) return;
    const tiles = all('[data-genre]',grid);
    const target = tiles[tiles.indexOf(event.target) + offsets[event.key]];
    if (!target || !tiles.includes(event.target)) return;
    event.preventDefault();
    moveGenre(event.target.dataset.genre,target.dataset.genre);
  });

  sidebarToggle.addEventListener('click', () => setSidebarOpen(true));
  find('[data-sidebar-dismiss]').addEventListener('click', () => setSidebarOpen(false));
  sidebarLayer.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const focusable = all('button', sidebarLayer).filter(button => !button.disabled && !button.hidden);
    const first = focusable[0];
    const last = focusable.at(-1);
    const edge = event.shiftKey ? first : last;
    if (document.activeElement !== edge) return;
    event.preventDefault();
    (event.shiftKey ? last : first).focus({preventScroll: true});
  });
  organiseButton.addEventListener('click', () => showWindow(openWindow ? '' : 'organiser'));
  all('[data-organise-choice]').forEach(choice => {
    choice.addEventListener('click', () => showWindow(choice.dataset.organiseChoice));
  });
  all('[data-close-window]').forEach(control => control.addEventListener('click', () => showWindow('', true)));
  all('[data-menu-back]').forEach(control => control.addEventListener('click', () => showWindow('organiser')));
  const toolbar = find('.toolbar');
  root.addEventListener('click', event => {
    if (openWindow && !event.composedPath().includes(toolbar) && !event.composedPath().includes(removalItems)) showWindow();
  });
  root.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || exitDialog.open || folderDialog.open) return;
    if (openWindow) {
      if (openWindow === 'organiser') showWindow('', true);
      else showWindow('organiser');
    } else if (root.dataset.sidebarOpen === 'true') setSidebarOpen(false);
  });
  all('[data-sort-choice]').forEach(choice => choice.addEventListener('click', () => {
    sort = choice.dataset.sortChoice;
    all('[data-sort-choice]').forEach(item => item.setAttribute('aria-pressed',String(item === choice)));
    renderContent();
    savePreferences().catch(showStorageError);
  }));
  for (const choice of bookSortChoices) {
    choice.addEventListener('click', () => {
      bookSort = choice.dataset.bookSort;
      for (const catalogue of catalogues.values()) catalogue.sort = bookSort;
      for (const item of bookSortChoices) item.setAttribute('aria-pressed', String(item === choice));
      renderContent();
      savePreferences().catch(showStorageError);
    });
  }
  catalogueFavorite.addEventListener('change', showDraft);
  find('[data-clear-filters]').addEventListener('click', () => {
    draft = emptyFilters();
    catalogueFavorite.checked = false;
    resetFilterPanel();
    filterPicker.focus({preventScroll: true});
  });
  find('[data-apply-filters]').addEventListener('click', () => {
    if (!catalogueView.hidden) favoritesOnly = catalogueFavorite.checked;
    applyFilters(selectedDraft());
  });
  find('[data-save-filter]').addEventListener('click', saveAppliedFilters);
  saveCatalogueFilter.addEventListener('click', saveAppliedFilters);
  bindBookGesture(find('.reading', libraryContent), importedReading);
  all('[data-view-choice]:not([data-book-gesture])').forEach(choice => choice.addEventListener('click',() => {
    const view = choice.dataset.viewChoice;
    if (catalogues.has(view)) openCatalogue(view);
    else if (view === 'home') setScope(view);
    else if (libraryLists[view]) openLibraryList(view);
    else openSecondary(view, null, choice);
  }));
  sidebar.addEventListener('click', event => {
    if (event.target.closest('[data-menu-page]')) setSidebarOpen(false);
  });
  function returnFromSecondary() {
    markBottomPage('home');
    dismissImport();
    other.hidden = true;
    const libraryReturn = libraryBookReturn;
    libraryBookReturn = null;
    if (catalogues.has(scope)) {
      renderContent();
      const originalBook = catalogueReturn?.bookId
        ? document.getElementById(`catalogue-book-${catalogueReturn.bookId}`) : null;
      const target = originalBook ?? (catalogueReturn?.bookId ? catalogueSearch : restoreFocus) ?? catalogueBack;
      window.scrollTo({top: catalogueReturn?.top ?? 0, behavior: 'auto'});
      if (target.isConnected && !target.closest('[hidden], [inert]')) target.focus({preventScroll: true});
      else catalogueBack.focus({preventScroll: true});
      catalogueReturn = null;
      return;
    }
    if (libraryReturn) {
      renderContent();
      window.scrollTo({top: libraryReturn.top, behavior: 'instant'});
      const target = (libraryReturn.id && document.getElementById(libraryReturn.id)) || restoreFocus;
      const fallback = search.closest('[hidden]') ? sidebarToggle : search;
      (target?.isConnected && !target.closest('[hidden], [inert]') ? target : fallback).focus({preventScroll: true});
      return;
    }
    syncCatalogueView();
    refreshSidebarPage();
    if (restoreFocus?.closest('[hidden], [inert]')) restoreFocus = sidebarToggle;
    (restoreFocus ?? sidebarToggle).focus({preventScroll: true});
  }
  catalogueBack.addEventListener('click', () => {
    if (!other.hidden) {
      returnFromSecondary();
      return;
    }
    if (folderTrail.length) {
      returnFromFolder();
      return;
    }
    const category = selectedGenre?.name;
    setScope('home');
    if (category) window.scrollTo({top: categoryReturnTop, behavior: 'auto'});
    const card = category && all('[data-genre]', grid).find(item => item.dataset.genre === category);
    (card || listAccess).focus({preventScroll: true});
  });
  find('[data-catalogue-search-form]').addEventListener('submit', event => event.preventDefault());
  catalogueSearch.addEventListener('input', () => {
    updateCatalogueMode();
    renderCatalogue();
  });
  for (const clear of all('[data-clear-catalogue-search]')) {
    clear.addEventListener('click', () => {
      catalogueSearch.value = '';
      catalogueSearch.dispatchEvent(new Event('input'));
      catalogueSearch.focus({preventScroll: true});
    });
  }
  for (const clear of all('[data-clear-result-filters]')) {
    clear.addEventListener('click', () => {
      favoritesOnly = false;
      applyFilters(emptyFilters());
      (catalogueView.hidden ? search : catalogueSearch).focus({preventScroll: true});
    });
  }
  scrollTopButton.addEventListener('click', () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({top: 0, behavior: reduced ? 'auto' : 'smooth'});
  });
  window.addEventListener('scroll', updateScrollTop, {passive: true});
  window.addEventListener('resize', updateScrollTop);
  search.addEventListener('input',renderContent);
  for (const clear of all('[data-clear-search]')) {
    clear.addEventListener('click', () => { search.value = ''; renderContent(); search.focus({preventScroll: true}); });
  }
  for (const tab of tabs) {
    tab.addEventListener('click', () => {
      if (activeLibraryTab === tab.dataset.libraryTab) return;
      activeLibraryTab = tab.dataset.libraryTab;
      renderContent();
      savePreferences().catch(showStorageError);
    });
  }
  listAccess.addEventListener('click', () => openCatalogue(activeLibraryTab));
  find('[data-browse-from-favorites]').addEventListener('click', () => openLibraryList('all'));

  const title = find('.title-with-initial');
  const initialLetter = find('.title-initial', title);
  const baseline = find('[data-baseline-b]', title);
  function fitTitleLetter() {
    const height = baseline.getBoundingClientRect().top - initialLetter.getBoundingClientRect().top;
    if (height > 0) title.style.setProperty('--title-initial-height', `${height}px`);
  }
  const tablet = window.matchMedia('(min-width: 650px) and (min-height: 500px)');
  function resizeLibrary() {
    root.dataset.format = tablet.matches ? 'tablet' : 'phone';
    fitTitleLetter();
  }
  tablet.addEventListener('change', resizeLibrary);
  resizeLibrary();
  if (globalThis.ResizeObserver) new ResizeObserver(fitTitleLetter).observe(title);
  document.fonts?.ready.then(fitTitleLetter);

  const exitConfirm = find('[data-exit-confirm]');
  const exitDismiss = find('[data-exit-dismiss]');
  find('[data-exit-trigger]').addEventListener('click', () => {
    exitConfirm.hidden = false;
    exitDismiss.textContent = 'Annuler';
    exitDialog.showModal();
  });
  exitDismiss.addEventListener('click', () => exitDialog.close());
  exitConfirm.addEventListener('click', async () => {
    storage.endSession?.();
    if ('caches' in window) {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.filter(key => key.startsWith('entre-les-pages-shell-')).map(key => caches.delete(key)));
      } catch { /* Sign-out still runs when the device cannot clear its offline cache. */ }
    }
    await compteLecture.logout();
  });
  function updateStoredLibrary(library) {
    const byId = new Map(books.map(book => [book.id, book]));
    const updated = library.books.filter(book => !exampleBookIds.has(book.id)).map(book => {
      const existing = byId.get(book.id);
      if (!existing) return book;
      for (const key of Object.keys(existing)) if (!(key in book)) delete existing[key];
      return Object.assign(existing, book);
    });
    books.splice(0, books.length, ...updated);
    folders = library.folders;
    options.author = sorted(unique(books.map(book => book.author).filter(Boolean)));
    options.trope = sorted(unique(books.flatMap(book => book.tropes)));
  }

  function openLibraryList(view) {
    setScope(view);
    applyFilters(emptyFilters());
    catalogueBack.focus({preventScroll: true});
  }

  renderContent();
  refreshIcons();
  delete root.dataset.storageState;
  toolbar.inert = false;
  const syncStatus = find('[data-library-sync-status]');
  storage.subscribe?.((state, library) => {
    syncStatus.hidden = state === 'synced';
    syncStatus.textContent = state === 'offline' ? 'Hors connexion' : state === 'pending' ? 'Synchronisation en attente'
      : state === 'online-only' ? 'Lecture en ligne · Le stockage de cet appareil est indisponible.' : '';
    if (!library) return;
    updateStoredLibrary(library);
    if (openWindow === 'remove') renderRemovalItems();
    if (other.hidden && !root.hasAttribute('data-book-open')) renderContent();
  });
  if (typeof createReadingStorage === 'function' && 'serviceWorker' in navigator && navigator.onLine) {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  }
}
compteLecture.start(() => activateLibrary(document.getElementById('bibliotheque-app')).catch(() => {
  document.querySelector('[data-storage-loading]').hidden = true;
  const notice = document.querySelector('[data-storage-alert]');
  notice.hidden = false;
  notice.textContent = 'La bibliothèque n’a pas pu s’ouvrir. Recharge cette page pour réessayer.';
}));
