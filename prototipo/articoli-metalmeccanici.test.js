const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {calcola}=require('./motore');
const {parse}=require('./articoli-parser');
const text=fs.readFileSync(path.join(__dirname,'articoli','rinnovo-ccnl-metalmeccanici.md'),'utf8');
const corpo=text.split('## Fonti')[0];
const netto=ral=>calcola(ral.toFixed(2)).kpi.nettoAnnuo;
const numero=s=>Number(s.replace(/[ €%+]/g,'').replaceAll('.','').replace(',','.'));
const cent=n=>Math.round(n*100);
/* Netto in più fra due RAL espresse in centesimi, arrotondato al centesimo. */
const differenza=(ral,base)=>cent(netto(ral/100)-netto(base/100))/100;
const sezione=titolo=>text.split(/^#{2,3} /m).find(s=>s.startsWith(titolo))||'';
const righe=(blocco,colonne)=>blocco.split('\n')
  .filter(l=>new RegExp(`^\\| [A-D]\\d \\|${' [^|]+ \\|'.repeat(colonne-1)}$`).test(l))
  .map(l=>l.split('|').slice(1,-1).map(s=>s.trim()));
const livello=sezione('Quanto è l\'aumento dei metalmeccanici nel 2026');
/* Livello, minimo dal 1/6/2026 e aumento al mese, dalla prima tabella. */
const minimi=righe(livello,7).map(([codice,,minimo,aumento])=>({codice,nuovo:cent(numero(minimo)),aumento:cent(numero(aumento))}));
/* Livello, lordo e netto a regime, lordo e netto maturati nel 2026. */
const annuale=righe(livello,5);

test('metalmeccanici: i valori annui sono a regime e il 2026 conta solo da giugno (RIC-115)',()=>{
  assert.equal(minimi.length,9);
  assert.match(livello,/\| Livello \| Aumento lordo annuo a regime \| Aumento netto annuo a regime \| Maturato nel 2026, lordo \| Maturato nel 2026, netto \|/);
  assert.deepEqual(annuale.map(r=>r[0]),minimi.map(m=>m.codice));
  for(const [i,{codice,nuovo,aumento}] of minimi.entries()){
    const vecchio=nuovo-aumento;
    const [,lordoRegime,nettoRegime,lordo2026,netto2026]=annuale[i].map(numero);
    assert.equal(cent(lordoRegime),aumento*13,`${codice} lordo a regime`);
    assert.equal(cent(lordo2026),aumento*8,`${codice} lordo 2026`);
    assert.equal(nettoRegime,differenza(nuovo*13,vecchio*13),`${codice} netto a regime`);
    assert.equal(netto2026,differenza(vecchio*5+nuovo*8,vecchio*13),`${codice} netto 2026`);
  }
});

test('metalmeccanici: nessun testo presenta il valore a regime come somma del 2026 (RIC-115)',()=>{
  assert.doesNotMatch(text,/410,90 € sull'anno/);
  assert.doesNotMatch(text,/Aumento (lordo|netto) all'anno/);
  assert.doesNotMatch(text,/incassa/);
  for(const riga of corpo.split('\n').filter(l=>/691,21|410,90|618,67|887,25|631,93|460,47/.test(l)&&!l.startsWith('|')))
    assert.match(riga,/a regime/i,riga.slice(0,80));
  const intro=text.split('\n## ')[0];
  assert.match(intro,/A regime, su 13 mensilità, l'aumento vale 691,21 € lordi e 410,90 € netti l'anno\./);
  assert.match(intro,/Nel 2026 però decorre dal 1° giugno[^\n]*\*\*425,36 € lordi e 252,90 € netti\*\*/);
  assert.match(intro,/\*\*In breve\*\*:[^\n]*nel 2026 sul C3 maturano 425,36 € lordi e 252,90 € netti in più/);
});

test('metalmeccanici: il metodo del 2026 documenta tredicesima e conguaglio (RIC-115)',()=>{
  assert.match(livello,/Da gennaio a maggio il minimo è quello del 1° giugno 2025[^\n]*da giugno a dicembre è quello nuovo: sette mensilità con l'aumento\./);
  assert.match(livello,/La tredicesima il contratto la ragguaglia alla retribuzione globale di fatto e la paga a Natale: assumo che sia calcolata sul minimo di dicembre/);
  assert.match(livello,/Sul C3: 53,17 € per 8 fa 425,36 € lordi\./);
  assert.match(livello,/le imposte sono calcolate sul reddito di tutto il 2026, come le ricalcola il datore al conguaglio/);
  assert.match(livello,/le addizionali regionale e comunale sul reddito del 2026 si trattengono a rate dopo il conguaglio, cioè nel 2027/);
  const c3=minimi.find(m=>m.codice==='C3');
  const ral2026=((c3.nuovo-c3.aumento)*5+c3.nuovo*8)/100;
  assert.equal(ral2026,28482.74);
  assert.equal(netto(ral2026),22523.50);
  assert.match(sezione('Quanto resta netto a un C3'),/la RAL effettiva di un C3 in forza tutto l'anno è 28\.482,74 €[^\n]*il motore ne fa 22\.523,50 € netti/);
});

test('metalmeccanici: il D2 nel 2026 supera la soglia con otto mensilità su tredici (RIC-115)',()=>{
  const r=calcola('25493.86');
  assert.equal(r.imponibile,23150.97);
  assert.equal(r.voci.find(v=>v.id==='addcom').importo,-185.21);
  const d2=sezione('Perché il netto non segue il lordo?');
  assert.match(d2,/l'imponibile dell'anno è 23\.150,97 €[^\n]*l'addizionale è 185,21 €[^\n]*Dei 380,72 € lordi maturati nel 2026 restano netti \*\*44,00 €\*\*, l'11,6%\. Quell'addizionale però te la trattengono a rate nel 2027/);
});

test('metalmeccanici: FAQ, ipotesi e fonti usano la stessa distinzione (RIC-115)',()=>{
  assert.match(sezione('Cosa cambia per i metalmeccanici nel 2026?'),/nel 2026 maturano 425,36 € lordi e 252,90 € netti in più[^\n]*a regime, su un anno intero, vale 691,21 € lordi e 410,90 € netti/);
  assert.match(sezione('Qual è la tabella di aumento contrattuale'),/separando il valore a regime da quello maturato nel 2026/);
  const articolo=parse(text,'rinnovo-ccnl-metalmeccanici.md');
  assert.match(articolo.ipotesi_calcolo,/valori annui a regime: nuovo minimo per 13 mensilità come se valesse da gennaio; maturato nel 2026: minimo del 1° giugno 2025 per cinque mensilità, nuovo minimo per sette mensilità e per la tredicesima/);
  assert.equal(articolo.data_aggiornamento,'2026-10-10');
  const fonti=text.split('## Fonti')[1];
  assert.match(fonti,/minimi in vigore dal 1° giugno 2025[^\n]*riaperta il 10 ottobre 2026/);
  assert.match(fonti,/Sez\. Quarta, Titolo IV, art\. 7 — tredicesima mensilità «di importo ragguagliato alla retribuzione globale di fatto»[^\n]*verificata il 10 ottobre 2026/);
  assert.match(fonti,/DPR 29 settembre 1973, n\. 600, art\. 23 c\. 3 — [^\n]*versione vigente dal 21 maggio 2022 al 31 dicembre 2026, verificata il 10 ottobre 2026/);
  assert.match(fonti,/D\.Lgs\. 15 dicembre 1997, n\. 446, art\. 50 c\. 4 — [^\n]*verificata il 10 ottobre 2026/);
  assert.match(fonti,/D\.Lgs\. 28 settembre 1998, n\. 360, art\. 1 c\. 5 — [^\n]*verificata il 10 ottobre 2026/);
});
