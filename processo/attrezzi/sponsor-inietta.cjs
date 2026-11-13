/* Sponsorship limitate (RIC-51): gli slot sponsor entrano in ogni pagina qui,
   alla build, e non in ogni template. Una pagina nuova li riceve senza che
   nessuno se ne ricordi; per toglierli tutti basta non chiamare questa funzione.

   In pagina arrivano tre cose: lo spazio riservato alla striscia (così il
   contenuto non salta quando arriva il tabellone), il segnaposto sotto la
   navigazione e lo script. Il resto lo fa prototipo/sponsor.js. */
const fs=require('node:fs');
const path=require('node:path');
const STILE='<style>#sp-striscia{min-height:45px}@media(min-width:1600px){#sp-striscia{display:none}}</style>';
const SEGNAPOSTO='<aside id="sp-striscia" class="sp-striscia" aria-label="Sponsor"></aside>';
const SCRIPT='<script src="/sponsor.js" defer></script>';

function inietta(html){
  if(html.includes(SCRIPT)||/<html[^>]*\bdata-sponsor="off"/.test(html))return html;
  if(!/<\/head>/i.test(html)||!/<\/body>/i.test(html)||!/<body[^>]*>/i.test(html))return html;
  let out=html.replace(/<\/head>/i,()=>STILE+'</head>');
  const header=/(<header class="site-header"[\s\S]*?<\/header>)/;
  out=header.test(out)?out.replace(header,(m)=>m+SEGNAPOSTO):out.replace(/<body[^>]*>/i,m=>m+SEGNAPOSTO);
  const fine=out.toLowerCase().lastIndexOf('</body>');
  return out.slice(0,fine)+SCRIPT+out.slice(fine);
}
function iniettaCartella(dir){
  let pagine=0;
  for(const voce of fs.readdirSync(dir,{withFileTypes:true})){
    const file=path.join(dir,voce.name);
    if(voce.isDirectory()){pagine+=iniettaCartella(file);continue;}
    if(!voce.name.endsWith('.html'))continue;
    const html=fs.readFileSync(file,'utf8'),next=inietta(html);
    if(next!==html){fs.writeFileSync(file,next);pagine++;}
  }
  return pagine;
}
module.exports={inietta,iniettaCartella,SCRIPT,SEGNAPOSTO};
