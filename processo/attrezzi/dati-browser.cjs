/* Codec di trasporto lossless, derivato dallo snapshot canonico a ogni build.
   Ogni forma conserva ordine e presenza delle chiavi. La maschera omette solo
   scalari uguali al default della colonna: nessuna formula o fonte è scartata. */
const fs=require('node:fs');
const path=require('node:path');
function pack(data){
  const forme=[],ids=new Map(),conteggi=[];
  function forma(object){
    const keys=Object.keys(object),key=JSON.stringify(keys);
    if(keys.length>30)throw new Error('Il codec browser supporta fino a 30 chiavi per oggetto.');
    if(!ids.has(key)){
      ids.set(key,forme.length);forme.push(keys);
      conteggi.push(keys.map(()=>new Map()));
    }
    return ids.get(key);
  }
  function conta(value){
    if(!value||typeof value!=='object')return;
    if(Array.isArray(value)){value.forEach(conta);return;}
    const id=forma(value);
    Object.values(value).forEach((cell,i)=>{
      if(cell===null||typeof cell!=='object'){
        const key=JSON.stringify(cell),counts=conteggi[id][i];
        counts.set(key,(counts.get(key)||0)+1);
      }
      conta(cell);
    });
  }
  conta(data);
  const defaults=conteggi.map(columns=>columns.map(counts=>counts.size
    ?JSON.parse([...counts].sort((a,b)=>b[1]-a[1])[0][0]):null));
  function encode(value){
    if(!value||typeof value!=='object')return value;
    if(Array.isArray(value))return [-1,...value.map(encode)];
    const id=forma(value),row=[id,0];
    Object.values(value).forEach((cell,i)=>{
      if(cell!==defaults[id][i]){row[1]|=1<<i;row.push(encode(cell));}
    });
    return row;
  }
  return {forme,defaults,data:encode(data)};
}
function unpack(p){
  function decode(value){
    if(!Array.isArray(value))return value;
    if(value[0]===-1)return value.slice(1).map(decode);
    const keys=p.forme[value[0]],defaults=p.defaults[value[0]],object={};
    let cell=2;
    for(let i=0;i<keys.length;i++)object[keys[i]]=(value[1]&(1<<i))?decode(value[cell++]):defaults[i];
    return object;
  }
  return Object.freeze(decode(p.data));
}
function source(data){
  const encoded=JSON.stringify(JSON.stringify(pack(data))).replace(/</g,'\\u003c');
  return `/* Generato da dati-browser.cjs: non modificare. */\nconst DATI_ADDIZIONALI_2026=(${unpack.toString()})(JSON.parse(${encoded}));\n`;
}
function generate(output){
  const data=require('../../prototipo/dati-addizionali-2026.js').DATI_ADDIZIONALI_2026;
  fs.writeFileSync(path.join(output,'dati-addizionali-2026.js'),source(data));
}
module.exports={pack,unpack,source,generate};
