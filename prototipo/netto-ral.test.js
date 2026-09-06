const assert=require('node:assert/strict');
const {test}=require('node:test');

const INVERSO=require('./netto-ral.js');
const fs=require('node:fs');
const pagina=fs.readFileSync(require('node:path').join(__dirname,'netto-ral.html'),'utf8');

test('trova la RAL piu bassa sulla griglia che raggiunge il target annuo',()=>{
  const risultato=INVERSO.trovaRal('2.000');
  assert.equal(risultato.ral,35000);
  assert.equal(risultato.nettoAnnuo,26032.17);
  assert.equal(risultato.mediaMensile,2002.47);
  assert.equal(risultato.ral%100,0);
  assert.ok(Math.round(risultato.nettoAnnuo*100)>=2000*13*100);
  assert.ok(Math.round(INVERSO.calcolaStandard(risultato.ral-100).kpi.nettoAnnuo*100)<2000*13*100);
});

test('la scansione conserva il primo candidato valido prima di un salto del netto',()=>{
  const primaDelSalto=INVERSO.trovaRal('2.110,40');
  assert.equal(primaDelSalto.ral,38500);
  assert.equal(INVERSO.calcolaStandard(38600).kpi.nettoAnnuo,27409.72);
  assert.ok(INVERSO.calcolaStandard(38600).kpi.nettoAnnuo<primaDelSalto.nettoAnnuo);
  assert.equal(INVERSO.trovaRal('2.110,42').ral,38700);
});

test('normalizza input italiani e rifiuta valori invalidi o irraggiungibili',()=>{
  assert.deepEqual(INVERSO.normalizzaTarget('2.000,50'),{valore:2000.5,centesimi:200050});
  for(const raw of ['', '0', '-1', 'ciao', 'Infinity'])
    assert.ok(INVERSO.normalizzaTarget(raw).errore,raw);
  assert.match(INVERSO.normalizzaTarget('50.000').errore,/fuori dall.intervallo/);
  assert.equal(INVERSO.trovaRal('50.000'),null);
});

test('costruisce la CTA per il profilo standard e il calcolo attivo',()=>{
  assert.equal(INVERSO.urlCalcolatore(35000),'index.html?ral=35000&m=13&c=F205&calc=1');
});

test('la pagina parte senza risultato, espone un solo input e invalida il risultato alle modifiche',()=>{
  assert.equal((pagina.match(/<input\b/g)||[]).length,1);
  assert.match(pagina,/value="2\.000"/);
  assert.match(pagina,/id="risultato"[\s\S]*?hidden/);
  assert.match(pagina,/input\.addEventListener\('input',nascondi\)/);
  assert.match(pagina,/aria-live="polite"/);
  assert.match(pagina,/type="submit">Calcola la RAL/);
});

test('la navigazione pubblica rende raggiungibile Netto RAL anche dopo la generazione',()=>{
  for(const file of ['index.html','compara.html','come-ho-lavorato.html','la-storia.html','confronti-ral/index.html','ral-35000-netto/index.html'])
    assert.match(fs.readFileSync(require('node:path').join(__dirname,file),'utf8'),/href="(?:\.\.\/)?netto-ral\.html">Netto → RAL<\/a>/,file);
});

test('la home raggruppa calcoli e confronti e non duplica i link nella hero',()=>{
  const home=fs.readFileSync(require('node:path').join(__dirname,'index.html'),'utf8');
  assert.match(home,/>Calcola<\/button>[\s\S]*>RAL → Netto<\/a>[\s\S]*>Netto → RAL<\/a>/);
  assert.match(home,/>Confronta<\/button>[\s\S]*>Due offerte<\/a>[\s\S]*>Livelli di RAL<\/a>/);
  assert.doesNotMatch(home,/Confronta due offerte →|La storia, dopo la pubblicazione →/);
});
