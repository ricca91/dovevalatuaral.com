/* Esegue lo stesso template del browser con i dati canonici, senza DOM. */
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'../../prototipo');
function markup(){
  const context=vm.createContext({URLSearchParams});
  for(const file of ['dati-addizionali-2026.js','geografia.js','motore.js','fonti.js','righe.js','nucleo.js','sezioni.js','compara.js','home-ui.js'])
    vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
  return vm.runInContext(`hero(st)+'<div id="home-body">'+vuoto(st)+'</div>'`,context).replace(/<(button|select|input)\b([^>]*)>/g,(tag,name,attrs)=>{
    if(/\bid="(?:ral|mensilita)"/.test(attrs))return tag;
    return `<${name}${attrs} disabled data-avvio-disabled>`;
  }).replace(/[ \t]+$/gm,'');
}
function generate(){
  const file=path.join(root,'index.html');
  const html=fs.readFileSync(file,'utf8');
  const next=html.replace(/<!-- HOME_STATIC_START -->[\s\S]*?<!-- HOME_STATIC_END -->/,()=>`<!-- HOME_STATIC_START --><div id="app">${markup()}</div><!-- HOME_STATIC_END -->`);
  if(next===html)return;
  fs.writeFileSync(file,next);
}
if(require.main===module)generate();
module.exports={generate,markup};
