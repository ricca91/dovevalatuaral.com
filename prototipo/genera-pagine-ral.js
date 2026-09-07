const fs=require('node:fs');
const path=require('node:path');
const {calcola}=require('./motore.js');
const {ORIGIN,renderRalPage,renderHub}=require('./ral-page.template.js');

const RALS=Object.freeze(Array.from({length:17},(_,index)=>20000+index*5000));
const PUBLIC_PAGES=Object.freeze([
  `${ORIGIN}/`,
  `${ORIGIN}/come-ho-lavorato.html`,
  `${ORIGIN}/la-storia.html`,
  `${ORIGIN}/compara.html`,
  `${ORIGIN}/netto-ral.html`,
  `${ORIGIN}/ccnl-livello.html`,
  `${ORIGIN}/confronti-ral/`,
]);

function write(file,contents){
  fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,contents,'utf8');
}

function sitemap(){
  const locations=[...PUBLIC_PAGES,...RALS.map(ral=>`${ORIGIN}/ral-${ral}-netto/`)];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${locations.map(location=>`  <url>\n    <loc>${location}</loc>\n  </url>`).join('\n')}\n</urlset>\n`;
}

function generate(outputDir=__dirname){
  const results=new Map(RALS.map(ral=>[ral,calcola(String(ral))]));
  RALS.forEach((ral,index)=>write(
    path.join(outputDir,`ral-${ral}-netto`,'index.html'),
    renderRalPage({ral,result:results.get(ral),previous:RALS[index-1],next:RALS[index+1]}),
  ));
  write(path.join(outputDir,'confronti-ral','index.html'),renderHub({rals:RALS,results}));
  write(path.join(outputDir,'sitemap.xml'),sitemap());
}

if(require.main===module)generate();
module.exports={RALS,PUBLIC_PAGES,generate,sitemap};
