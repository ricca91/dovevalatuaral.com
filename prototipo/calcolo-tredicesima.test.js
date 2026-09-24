const assert=require('node:assert/strict');
const {test}=require('node:test');
const {readFileSync}=require('node:fs');
const {resolve}=require('node:path');
const html=readFileSync(resolve(__dirname,'calcolo-tredicesima/index.html'),'utf8');

test('la pagina carica il modulo e non il motore',()=>{
  assert.match(html,/<script src="\.\.\/tredicesima\.js"><\/script>/);
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
