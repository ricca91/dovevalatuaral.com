const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {parse,markdown}=require('./articoli-parser.js');
const {prepare,writeBlog,readArticles}=require('./genera-articoli.js');
const {sitemap}=require('./genera-pagine-ral.js');
const sample=fs.readFileSync(path.join(__dirname,'../processo/fixtures/articolo-demo.md'),'utf8');
function fixture(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ric74-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;}
function save(dir,text=sample.replace('stato: bozza','stato: pubblicato'),name='articolo-demo.md'){fs.writeFileSync(path.join(dir,name),text);}
test('frontmatter completo, commenti YAML e data aggiornamento esplicita o derivata',()=>{
  const a=parse(sample.replace('stato: bozza','stato: bozza # commento'));
  assert.equal(a.data_aggiornamento,'2026-09-22');assert.equal(a.stato,'bozza');
  assert.equal(parse(sample.replace('data_aggiornamento: 2026-09-22\n','')).data_aggiornamento,'2026-09-21');
  assert.equal(parse(sample.replace('cluster: "il-progetto"',"cluster: 'il-progetto'")).cluster,'il-progetto');
});
test('errori utili per frontmatter incompleto, date, stati, URL e campi duplicati',()=>{
  for(const [from,to,pattern] of [
    ['title_seo:', 'altro:', /title_seo/],['2026-09-22','2026-02-30',/data_aggiornamento/],
    ['stato: bozza','stato: pronto',/stato/],['cta: "/"','cta: "javascript:alert(1)"',/URL/],
    ['cluster: "il-progetto"','cluster: "il-progetto"\ncluster: altro',/duplicato/],
    ['slug: articolo-demo','slug: ../segreto',/slug/],['link_interni: ["/confronti-ral/", "/come-ho-lavorato.html"]','link_interni: no',/array/],
  ])assert.throws(()=>parse(sample.replace(from,to),'esempio.md'),error=>error.message.includes('esempio.md')&&pattern.test(error.message));
  assert.throws(()=>parse('## Senza frontmatter'),/frontmatter/);
});
test('renderer copre tabelle, liste, citazioni, inline e non esegue HTML o URL pericolosi',()=>{
  const html=markdown(parse(sample).body);
  for(const tag of ['h2','h3','table','ul','ol','blockquote','code','strong','em'])assert.ok(html.includes(`<${tag}`),tag);
  assert.match(markdown('Test <script>alert(1)</script>'),/&lt;script&gt;/);
  assert.throws(()=>markdown('[x](javascript:alert(1))'),/URL/);
  assert.throws(()=>markdown('## Test\n\n| A | B |\n| --- | --- |\n| uno |'),/celle/);
});
test('pagina pubblicata: metadati unici, date, fonti, una CTA e link interni risolti',t=>{
  const dir=fixture(t);save(dir);
  const {articles,pages}=prepare({sourceDir:dir});const html=pages.get('/blog/articolo-demo/');
  for(const pattern of [/<title>/g,/<meta name="description"/g,/<link rel="canonical"/g,/class="article-cta"/g])assert.equal([...html.matchAll(pattern)].length,1);
  assert.match(html,/https:\/\/www.dovevalatuaral.com\/blog\/articolo-demo\//);
  assert.match(html,/Aggiornato il <time datetime="2026-09-22"/);
  assert.match(html,/Fonti<\/h2>/);assert.match(sitemap(articles),/blog\/articolo-demo\//);
  assert.match(pages.get('/blog/'),/href="\/blog\/articolo-demo\/"/);
});
test('bozze e rivisti esclusi; ritirare o cancellare un articolo elimina anche il vecchio output',t=>{
  const source=fixture(t),output=fixture(t);save(source);
  writeBlog(output,prepare({sourceDir:source}).pages);
  assert.ok(fs.existsSync(path.join(output,'blog/articolo-demo/index.html')));
  for(const state of ['bozza','rivisto']){
    save(source,sample.replace('stato: bozza',`stato: ${state}`));
    const result=prepare({sourceDir:source});writeBlog(output,result.pages);
    assert.equal(result.articles.length,0);assert.ok(!fs.existsSync(path.join(output,'blog/articolo-demo')));
    assert.ok(!sitemap(result.articles).includes('/blog/articolo-demo/'));
  }
  fs.unlinkSync(path.join(source,'articolo-demo.md'));assert.equal(readArticles(source).length,0);
});
test('slug duplicati, filename incoerenti e metadati duplicati fermano la build',t=>{
  const dir=fixture(t);save(dir);save(dir, sample,'z.md');
  assert.throws(()=>prepare({sourceDir:dir}),/slug duplicato/);
  fs.unlinkSync(path.join(dir,'articolo-demo.md'));assert.throws(()=>prepare({sourceDir:dir}),/nome deve/);
  fs.unlinkSync(path.join(dir,'z.md'));save(dir);save(dir,sample.replace('slug: articolo-demo','slug: secondo').replace('stato: bozza','stato: pubblicato'),'secondo.md');
  assert.throws(()=>prepare({sourceDir:dir}),/title_seo duplicato/);
});
test('link rotti nel corpo, metadati, CTA e link verso bozze fanno fallire la build',t=>{
  const dir=fixture(t);
  for(const text of [sample.replace('/confronti-ral/','/non-esiste/'),sample.replace('cta: "/"','cta: "/assente.html"'),sample.replace('## La risposta','[Errore](/blog/non-pubblicato/)\n\n## La risposta')]){
    save(dir,text.replace('stato: bozza','stato: pubblicato'));assert.throws(()=>prepare({sourceDir:dir}),/link interno inesistente/);
  }
});
test('articoli correlati includono solo pubblicati del medesimo cluster',t=>{
  const dir=fixture(t);save(dir);
  let other=sample.replaceAll('articolo-demo','secondo').replace('title_seo: "','title_seo: "Secondo: ').replace('description: "','description: "Secondo: ').replace('stato: bozza','stato: pubblicato');save(dir,other,'secondo.md');
  let {pages}=prepare({sourceDir:dir});assert.match(pages.get('/blog/articolo-demo/'),/href="\/blog\/secondo\/"/);
  save(dir,other.replace('cluster: "il-progetto"','cluster: altro'),'secondo.md');({pages}=prepare({sourceDir:dir}));assert.doesNotMatch(pages.get('/blog/articolo-demo/'),/href="\/blog\/secondo\/"/);
});
test('Blog è nella navigazione statica delle pagine pubbliche',()=>{
  const {PUBLIC_PAGES}=require('./genera-pagine-ral.js');
  for(const location of PUBLIC_PAGES){const route=new URL(location).pathname;const html=fs.readFileSync(path.join(__dirname,route,route.endsWith('/')?'index.html':''),'utf8');assert.match(html,/<a href="\/blog\/">Blog<\/a>/,route);}
});
test('build reale: pubblica HTML e asset, esclude sorgenti e bozze; errore restituisce exit 1',t=>{
  const root=fixture(t);
  fs.cpSync(__dirname,path.join(root,'prototipo'),{recursive:true});
  fs.mkdirSync(path.join(root,'processo/attrezzi'),{recursive:true});
  fs.copyFileSync(path.join(__dirname,'../processo/attrezzi/build.cjs'),path.join(root,'processo/attrezzi/build.cjs'));
  const sources=path.join(root,'prototipo/articoli');save(sources);
  save(sources,sample.replaceAll('articolo-demo','bozza'),'bozza.md');
  const run=()=>require('node:child_process').spawnSync(process.execPath,['processo/attrezzi/build.cjs'],{cwd:root,encoding:'utf8'});
  let result=run();assert.equal(result.status,0,result.stderr);
  const dist=path.join(root,'dist');
  for(const file of ['index.html','draftsman.css','site-nav.js','blog/index.html','blog/articolo-demo/index.html','ral-30000-netto/index.html','sitemap.xml'])assert.ok(fs.existsSync(path.join(dist,file)),file);
  for(const file of ['articoli','blog/bozza','articolo.template.js','articoli.test.js','README.md','articoli-parser.js'])assert.ok(!fs.existsSync(path.join(dist,file)),file);
  save(sources,sample.replace('title_seo:','campo_errato:'));
  result=run();assert.equal(result.status,1);assert.match(result.stderr,/title_seo/);
});
test('metadati SEO degli articoli non duplicano una pagina pubblica esistente',t=>{
  const dir=fixture(t),home=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
  const title=home.match(/<title>([^<]+)<\/title>/)[1];
  save(dir,sample.replace(/title_seo: .+/,`title_seo: ${JSON.stringify(title)}`).replace('stato: bozza','stato: pubblicato'));
  assert.throws(()=>prepare({sourceDir:dir,knownRoutes:['/']}),/title_seo duplicato/);
});
