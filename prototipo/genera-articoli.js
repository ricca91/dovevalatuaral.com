const fs=require('node:fs');
const path=require('node:path');
const {parse,escape}=require('./articoli-parser.js');
const {renderArticle,renderIndex}=require('./articolo.template.js');
const {ORIGIN}=require('./ral-page.template.js');
function readArticles(sourceDir=path.join(__dirname,'articoli')){
  if(!fs.existsSync(sourceDir))return [];
  const articles=fs.readdirSync(sourceDir).filter(f=>f.endsWith('.md')).sort().map(file=>parse(fs.readFileSync(path.join(sourceDir,file),'utf8'),file));
  const slugs=new Set();
  for(const article of articles){
    if(slugs.has(article.slug))throw Error(`${article.file}: slug duplicato: ${article.slug}`);
    slugs.add(article.slug);
    if(article.file!==`${article.slug}.md`)throw Error(`${article.file}: il nome deve essere ${article.slug}.md`);
  }
  return articles.filter(a=>a.stato==='pubblicato').sort((a,b)=>b.data_pubblicazione.localeCompare(a.data_pubblicazione)||a.slug.localeCompare(b.slug));
}
function validateLinks(pages,articles,publicDir,knownRoutes=[]){
  const routes=new Set([...knownRoutes,...pages.keys()]);
  function check(href,route){
    const target=new URL(href,ORIGIN+route);
    if(target.origin!==ORIGIN)return;
    const pathname=decodeURIComponent(target.pathname);
    const file=path.resolve(publicDir,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
    const generated=routes.has(pathname);
    const forbidden=pathname.startsWith('/blog/')&&!generated||pathname.startsWith('/articoli/')||/\.(?:md|test\.js|template\.js)$/.test(pathname)||/\/(?:genera-|prototype-|articoli-parser\.js)/.test(pathname);
    if(forbidden||(!generated&&(!file.startsWith(path.resolve(publicDir)+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())))throw Error(`${route}: link interno inesistente: ${href}`);
    if(target.hash&&pages.has(pathname)){
      const id=decodeURIComponent(target.hash.slice(1));
      if(!pages.get(pathname).includes(`id="${id}"`))throw Error(`${route}: ancora inesistente: ${href}`);
    }
  }
  for(const [route,html] of pages)for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g))check(match[1].replaceAll('&amp;','&'),route);
  for(const article of articles)for(const href of article.link_interni)check(href,`/blog/${article.slug}/`);
}
function prepare({sourceDir=path.join(__dirname,'articoli'),publicDir=__dirname,knownRoutes=[]}={}){
  const articles=readArticles(sourceDir),pages=new Map([['/blog/',renderIndex(articles)]]);
  for(const article of articles){
    try{pages.set(`/blog/${article.slug}/`,renderArticle(article,articles));}
    catch(error){throw Error(`${article.file}: ${error.message}`);}
  }
  for(const field of ['title_seo','description']){
    const seen=new Set([field==='title_seo'?'Blog: RAL, stipendio netto e busta paga':'Articoli su RAL, stipendio netto e busta paga, con ipotesi di calcolo, fonti e date di aggiornamento visibili.']);
    // Compare serialized values too, including the public static pages.
    const encoded=new Set([...seen].map(escape));
    for(const route of knownRoutes){
      const file=path.join(publicDir,route,route.endsWith('/')?'index.html':'');
      if(!fs.existsSync(file))continue;
      const html=fs.readFileSync(file,'utf8');
      const match=html.match(field==='title_seo'?/<title>([^<]+)<\/title>/:/<meta name="description" content="([^"]+)"/);
      if(match)encoded.add(match[1]);
    }
    for(const a of articles){if(encoded.has(escape(a[field])))throw Error(`${a.file}: ${field} duplicato`);encoded.add(escape(a[field]));}
  }
  validateLinks(pages,articles,publicDir,knownRoutes);
  return {articles,pages};
}
function writeBlog(outputDir,pages){
  // /blog è interamente generato: rimuove anche articoli ritirati o cancellati.
  fs.rmSync(path.join(outputDir,'blog'),{recursive:true,force:true});
  for(const [route,html] of pages){const file=path.join(outputDir,route,'index.html');fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,html);}
}
module.exports={readArticles,prepare,validateLinks,writeBlog};
if(require.main===module){
  try{require('./genera-pagine-ral.js').generate();}
  catch(error){console.error(error.message);process.exitCode=1;}
}
