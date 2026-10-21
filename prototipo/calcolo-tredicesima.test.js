const assert=require('node:assert/strict');
const {test}=require('node:test');
const {readFileSync}=require('node:fs');
const {resolve}=require('node:path');
const html=readFileSync(resolve(__dirname,'calcolo-tredicesima/index.html'),'utf8');

test('la pagina carica il modulo e non il motore',()=>{
  assert.match(html,/<script src="\.\.\/tredicesima\.js"[^>]*><\/script>/);
  assert.doesNotMatch(html,/motore\.js|dati-addizionali/);
});

test('le FAQ stanno nell\'HTML statico e coincidono con il JSON-LD',()=>{
  const blocchi=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
  const faq=blocchi.find(b=>b['@type']==='FAQPage');
  assert.ok(blocchi.find(b=>b['@type']==='WebApplication'));
  assert.ok(faq.mainEntity.length>=4);
  for(const q of faq.mainEntity)assert.ok(html.includes(`<h3>${q.name}</h3>`),q.name);
});

test('titolo e H1 contengono la keyword',()=>{
  assert.match(html,/<title>Calcolo tredicesima 2026/);
  assert.match(html,/<h1>[^<]*[Cc]alcolo (della )?tredicesima/);
});

test('la sitemap contiene la pagina',()=>{
  assert.match(readFileSync(resolve(__dirname,'sitemap.xml'),'utf8'),/<loc>https:\/\/www\.dovevalatuaral\.com\/calcolo-tredicesima\/<\/loc>/);
});

const {readdirSync,statSync}=require('node:fs');
function fileConMenu(dir=__dirname,out=[]){
  for(const nome of readdirSync(dir)){
    const p=resolve(dir,nome);
    if(nome==='node_modules'||nome==='vendor')continue;
    if(statSync(p).isDirectory())fileConMenu(p,out);
    else if(/\.(html|js)$/.test(nome)&&!nome.endsWith('.test.js')&&readFileSync(p,'utf8').includes('id="nav-calcola"'))out.push(p);
  }
  return out;
}

test('ogni menu "Calcola" porta alla tredicesima',()=>{
  const file=fileConMenu();
  assert.ok(file.length>=70,`trovati solo ${file.length} file con il menu`);
  for(const f of file)assert.match(readFileSync(f,'utf8'),/<a href="\/calcolo-tredicesima\/"( aria-current="page")?>Tredicesima<\/a>/,f);
});

test('le pagine RAL linkano la tredicesima a quella RAL',()=>{
  assert.match(readFileSync(resolve(__dirname,'ral-30000-netto/index.html'),'utf8'),/href="\.\.\/calcolo-tredicesima\/\?ral=30000"/);
});

test('il form usa i componenti del design system',()=>{
  assert.match(html,/<select class="select" id="mensilita"/);
  assert.doesNotMatch(html,/<select class="input"/);
  assert.match(html,/<fieldset class="modi"><legend class="label">Parto da<\/legend><div class="segmented">/);
  assert.match(html,/<p class="error-text" id="importo-errore"/);
});

test('il title 2026 della tredicesima resta sotto 60 caratteri',()=>{
  const title=html.match(/<title>([^<]+)<\/title>/)[1];
  assert.ok(title.length<60,`${title.length} caratteri: ${title}`);
});

test('la tabella date-ccnl ha 9 righe, ognuna con un link alla fonte',()=>{
  const tabella=html.match(/<table class="table date-ccnl">([\s\S]*?)<\/table>/)[1];
  const righe=[...tabella.matchAll(/<tr><th scope="row">([^<]+)<\/th>([\s\S]*?)<\/tr>/g)];
  assert.equal(righe.length,9);
  for(const [,nome,resto] of righe)assert.match(resto,/<a href="https:\/\/[^"]+">/,nome);
  for(const codice of ['C030','E012','B011','B371','J241'])assert.ok(righe.some(([,n])=>n.includes(`(${codice})`)),codice);
});

test('la riga dei bancari dice 20 dicembre',()=>{
  const riga=html.match(/<tr><th scope="row">Bancari ABI[\s\S]*?<\/tr>/)[0];
  assert.match(riga,/20 dicembre/);
});

test('la riga dell\'alimentare parla anche della quattordicesima',()=>{
  const riga=html.match(/<tr><th scope="row">Industria alimentare[\s\S]*?<\/tr>/)[0];
  assert.match(riga,/quattordicesima/);
});

test('la FAQ "Quando si paga" è identica nel JSON-LD e nel testo visibile',()=>{
  const faq=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1])).find(b=>b['@type']==='FAQPage');
  const q=faq.mainEntity.find(x=>x.name==='Quando si paga la tredicesima?');
  const visibile=html.match(/<h3>Quando si paga la tredicesima\?<\/h3>\s*<p>([\s\S]*?)<\/p>/)[1];
  assert.equal(visibile,q.acceptedAnswer.text);
  assert.match(q.acceptedAnswer.text,/20 dicembre/);
  assert.match(q.acceptedAnswer.text,/ricorrenza natalizia/);
});
