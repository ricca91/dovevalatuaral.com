const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {calcola,applicaMensilita,eur}=require('./motore.js');
const {generate}=require('./genera-pagine-ral.js');

const root=__dirname;
const origin='https://www.dovevalatuaral.com';
const rals=Array.from({length:17},(_,i)=>20000+i*5000);
const routes=rals.map(ral=>`ral-${ral}-netto`);
const htmlFor=ral=>fs.readFileSync(path.join(root,`ral-${ral}-netto`,'index.html'),'utf8');
const escapeRegExp=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const formatRal=ral=>new Intl.NumberFormat('it-IT').format(ral);

test('il generatore pubblica esattamente le 17 route RAL previste',()=>{
  const actual=fs.readdirSync(root,{withFileTypes:true})
    .filter(entry=>entry.isDirectory()&&/^ral-\d+-netto$/.test(entry.name))
    .map(entry=>entry.name).sort();
  assert.deepEqual(actual,routes.slice().sort());
  for(const route of routes)assert.ok(fs.existsSync(path.join(root,route,'index.html')));
});

test('ogni pagina espone i risultati del motore per il profilo canonico',()=>{
  for(const ral of rals){
    const html=htmlFor(ral);
    const result=calcola(String(ral));
    assert.match(html,new RegExp(`data-ral="${ral}"`));
    assert.match(html,new RegExp(`data-netto-annuo="${result.kpi.nettoAnnuo.toFixed(2)}"`));
    assert.match(html,new RegExp(`data-imposte="${result.kpi.totaleImposte.toFixed(2)}"`));
    assert.match(html,new RegExp(`data-contributi="${result.kpi.totaleContributi.toFixed(2)}"`));
    for(const mensilita of [12,13,14]){
      const monthly=applicaMensilita(result,mensilita).kpi.mediaMensile;
      assert.match(html,new RegExp(`data-mensilita="${mensilita}"[\\s\\S]*?data-netto-mensile="${monthly.toFixed(2)}"`));
      assert.match(html,new RegExp(escapeRegExp(eur(monthly))));
    }
    for(const value of [result.kpi.nettoAnnuo,result.kpi.totaleImposte,result.kpi.totaleContributi])
      assert.match(html,new RegExp(escapeRegExp(eur(value))));
  }
});

test('title, description, H1 e canonical sono specifici per ciascuna RAL',()=>{
  for(const ral of rals){
    const formatted=formatRal(ral),html=htmlFor(ral);
    assert.match(html,new RegExp(`<title>RAL ${escapeRegExp(formatted)} €: stipendio netto su 12, 13 e 14 mensilità</title>`));
    assert.match(html,new RegExp(`<meta name="description" content="Quanto sono netti ${escapeRegExp(formatted)} euro di RAL\\?`));
    assert.match(html,new RegExp(`<h1>RAL ${escapeRegExp(formatted)} €: netto su 12, 13 o 14 mensilità</h1>`));
    assert.match(html,new RegExp(`<link rel="canonical" href="${origin}/ral-${ral}-netto/">`));
    assert.doesNotMatch(html,new RegExp(`<link rel="canonical" href="${origin}/">`));
  }
});

test('le pagine collegano hub e sole RAL confinanti, con estremità corrette',()=>{
  for(const [index,ral] of rals.entries()){
    const html=htmlFor(ral);
    assert.match(html,/href="\.\.\/confronti-ral\/">Confronti RAL<\/a>/);
    const linked=[...html.matchAll(/href="\.\.\/ral-(\d+)-netto\/"/g)].map(match=>Number(match[1]));
    assert.deepEqual(linked,[rals[index-1],rals[index+1]].filter(Boolean));
    assert.doesNotMatch(html,/related-card[^>]+href="[^\"]*index\.html\?/);
  }
});

test('hub e pagine RAL formano un grafo interno senza orfane',()=>{
  const hub=fs.readFileSync(path.join(root,'confronti-ral','index.html'),'utf8');
  const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.doesNotMatch(home,/Confronta le RAL da 20\.000 a 100\.000 €/);
  assert.match(hub,new RegExp(`<link rel="canonical" href="${origin}/confronti-ral/">`));
  for(const ral of rals){
    assert.match(hub,new RegExp(`href="\\.\\.\\/ral-${ral}-netto\\/"`));
    assert.match(htmlFor(ral),/href="\.\.\/confronti-ral\/"/);
  }
});

test('nessuna pagina diversa da 35.000 conserva dati hardcoded della pagina campione',()=>{
  const sample=calcola('35000');
  for(const ral of rals.filter(value=>value!==35000)){
    const html=htmlFor(ral);
    assert.doesNotMatch(html,/<title>RAL 35\.000|<h1>RAL 35\.000|data-ral="35000"/);
    assert.doesNotMatch(html,new RegExp(escapeRegExp(eur(sample.kpi.nettoAnnuo))),`${ral}: netto campione`);
  }
});

test('due esecuzioni consecutive del generatore sono idempotenti',()=>{
  const generatedFiles=()=>[
    ...routes.map(route=>path.join(root,route,'index.html')),
    path.join(root,'confronti-ral','index.html'),path.join(root,'sitemap.xml'),
  ];
  const digest=()=>crypto.createHash('sha256')
    .update(generatedFiles().map(file=>fs.readFileSync(file)).join('\0')).digest('hex');
  generate();
  const first=digest();
  generate();
  assert.equal(digest(),first);
});
