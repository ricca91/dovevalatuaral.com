const fs=require('node:fs');
const path=require('node:path');
const {calcola}=require('./motore.js');
const {ORIGIN,renderRalPage,renderHub}=require('./ral-page.template.js');
const ccnl=require('./genera-pagine-ccnl.js');

const RALS=Object.freeze(Array.from({length:17},(_,index)=>20000+index*5000));
const PUBLIC_PAGES=Object.freeze([
  `${ORIGIN}/`,
  `${ORIGIN}/come-ho-lavorato.html`,
  `${ORIGIN}/la-storia.html`,
  `${ORIGIN}/compara.html`,
  `${ORIGIN}/netto-ral.html`,
  `${ORIGIN}/ccnl-livello.html`,
  `${ORIGIN}/netto-o-niente.html`,
  `${ORIGIN}/confronti-ral/`,
]);

function write(file,contents){
  fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,contents,'utf8');
}

/* Il solo scrittore di sitemap.xml: raccoglie le rotte di tutti i
   generatori (RAL, minimi CCNL, blog) invece di lasciare che ognuno
   scriva la propria e sovrascriva quella dell'altro. */
function sitemap(articles=[]){
  const locations=[...PUBLIC_PAGES,...RALS.map(ral=>`${ORIGIN}/ral-${ral}-netto/`),...ccnl.ROTTE.map(rotta=>`${ORIGIN}${rotta}`),`${ORIGIN}/blog/`,...articles.map(a=>`${ORIGIN}/blog/${a.slug}/`)];
  const updated=new Map(articles.map(a=>[`${ORIGIN}/blog/${a.slug}/`,a.data_aggiornamento]));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${locations.map(location=>`  <url>\n    <loc>${location}</loc>${updated.has(location)?`\n    <lastmod>${updated.get(location)}</lastmod>`:''}\n  </url>`).join('\n')}\n</urlset>\n`;
}

function generate(outputDir=__dirname,options={}){
  const {prepare,writeBlog}=require('./genera-articoli.js');
  const blog=prepare({...options,knownRoutes:[...PUBLIC_PAGES.map(url=>new URL(url).pathname),...RALS.map(ral=>`/ral-${ral}-netto/`),...ccnl.ROTTE]});
  const results=new Map(RALS.map(ral=>[ral,calcola(String(ral))]));
  RALS.forEach((ral,index)=>write(
    path.join(outputDir,`ral-${ral}-netto`,'index.html'),
    renderRalPage({ral,result:results.get(ral),previous:RALS[index-1],next:RALS[index+1]}),
  ));
  write(path.join(outputDir,'confronti-ral','index.html'),renderHub({rals:RALS,results}));
  /* Le pagine CCNL si rigenerano a ogni build con le tabelle in
     vigore quel giorno: una tranche che scatta cambia le pagine alla
     prima pubblicazione successiva. */
  ccnl.generate(outputDir,options.alla?{alla:options.alla}:{});
  writeBlog(outputDir,blog.pages);
  write(path.join(outputDir,'sitemap.xml'),sitemap(blog.articles));
}

if(require.main===module)generate();
module.exports={RALS,PUBLIC_PAGES,generate,sitemap};
