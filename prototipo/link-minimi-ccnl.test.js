const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {RALS,PUBLIC_PAGES,livelliVicini}=require('./genera-pagine-ral.js');
const {ROTTE,HUB}=require('./genera-pagine-ccnl.js');
const {prepare,readArticles}=require('./genera-articoli.js');

/* RIC-92: le pagine dei minimi fanno quasi tutti i clic organici, e il
   resto del sito non le linkava. Questi test leggono le pagine che
   `npm test` ha appena rigenerato. */
const ORIGIN='https://www.dovevalatuaral.com';
const leggi=rotta=>fs.readFileSync(path.join(__dirname,rotta,rotta.endsWith('/')?'index.html':''),'utf8');
const destinazioni=(html,rotta)=>[...html.matchAll(/href="([^"]+)"/g)]
  .map(m=>new URL(m[1].replaceAll('&amp;','&'),ORIGIN+rotta)).filter(u=>u.origin===ORIGIN).map(u=>u.pathname);
const footer=(html,rotta)=>{
  const trovati=html.match(/<footer\b[\s\S]*?<\/footer>/g);
  assert.ok(trovati,`${rotta}: footer assente`);
  return trovati.at(-1);
};
const articoli=readArticles();
const tutte=[...PUBLIC_PAGES.map(url=>new URL(url).pathname),...RALS.map(ral=>`/ral-${ral}-netto/`),
  '/blog/',...articoli.map(a=>`/blog/${a.slug}/`),...ROTTE];
const sample=fs.readFileSync(path.join(__dirname,'../processo/fixtures/articolo-demo.md'),'utf8').replace('stato: bozza','stato: pubblicato');
function cartella(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ric92-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;}

test('ogni pagina pubblica ha nel footer un link all’indice dei minimi CCNL',()=>{
  assert.ok(tutte.length>=80,`pagine controllate: ${tutte.length}`);
  for(const rotta of tutte)
    assert.ok(destinazioni(footer(leggi(rotta),rotta),rotta).includes(HUB),rotta);
});

test('la home linka l’indice e i cinque contratti con più clic',()=>{
  const html=leggi('/');
  const statica=html.match(/<!-- HOME_STATIC_START -->([\s\S]*?)<!-- HOME_STATIC_END -->/)[1];
  const linkate=destinazioni(statica,'/');
  for(const slug of ['multiservizi','studi-professionali','commercio','logistica','pubblici-esercizi']){
    const rotta=`${HUB}${slug}/`;
    assert.ok(ROTTE.includes(rotta),`${rotta} non è una pagina generata`);
    assert.ok(linkate.includes(rotta),`la home non linka ${rotta}`);
  }
  assert.ok(destinazioni(statica.replace(/<footer\b[\s\S]*?<\/footer>/,''),'/').includes(HUB),'la home linka l’indice solo dal footer');
});

test('ogni articolo linka la tabella del suo contratto, o l’indice se non ne dichiara uno',()=>{
  assert.ok(articoli.some(a=>a.ccnl)&&articoli.some(a=>!a.ccnl));
  for(const a of articoli){
    const rotta=`/blog/${a.slug}/`;
    const riquadro=leggi(rotta).match(/<aside class="article-assumptions article-ccnl">[\s\S]*?<\/aside>/);
    assert.ok(riquadro,`${rotta}: manca il rimando ai minimi`);
    assert.deepEqual(destinazioni(riquadro[0],rotta),[a.ccnl?`${HUB}${a.ccnl}/`:HUB],rotta);
  }
});

test('un ccnl sconosciuto o malformato nel frontmatter ferma la build',t=>{
  const dir=cartella(t);
  const scrivi=valore=>fs.writeFileSync(path.join(dir,'articolo-demo.md'),sample.replace(/^cluster: .*$/m,`$&\nccnl: ${valore}`));
  scrivi('"commercio"');
  assert.match(prepare({sourceDir:dir,knownRoutes:ROTTE}).pages.get('/blog/articolo-demo/'),/href="\/minimi-ccnl\/commercio\/"/);
  scrivi('"edilizia"');
  assert.throws(()=>prepare({sourceDir:dir,knownRoutes:ROTTE}),/articolo-demo\.md: ccnl sconosciuto: edilizia/);
  scrivi('"CCNL Commercio"');
  assert.throws(()=>prepare({sourceDir:dir,knownRoutes:ROTTE}),/ccnl: usare lettere minuscole/);
});

test('ogni pagina RAL linka almeno due pagine livello, di contratti diversi',()=>{
  const livelli=new Set(ROTTE.filter(r=>r.split('/').length===5));
  for(const ral of RALS){
    const rotta=`/ral-${ral}-netto/`;
    const linkate=destinazioni(leggi(rotta),rotta).filter(p=>livelli.has(p));
    assert.ok(linkate.length>=2,`${rotta}: ${linkate.length} pagine livello`);
    assert.equal(new Set(linkate.map(p=>p.split('/')[2])).size,linkate.length,`${rotta}: contratti ripetuti`);
  }
  assert.match(leggi('/ral-100000-netto/'),/Nessuna delle nostre pagine per livello arriva a una RAL minima di 100\.000 €/);
  assert.doesNotMatch(leggi('/ral-25000-netto/'),/Nessuna delle nostre pagine per livello/);
});

test('i livelli vicini sono i più prossimi alla RAL, uno per contratto',()=>{
  const l=(slug,ral)=>({slug,ral,rotta:`${HUB}${slug}/${ral}/`,nome:`${slug} ${ral}`});
  const livelli=[l('a',29000),l('a',30500),l('b',27000),l('c',31500),l('d',40000)];
  assert.deepEqual(livelliVicini(30000,livelli).map(x=>x.rotta),[l('a',30500).rotta,l('c',31500).rotta,l('b',27000).rotta]);
  assert.deepEqual(livelliVicini(30000,livelli,2).map(x=>x.slug),['a','c']);
});
