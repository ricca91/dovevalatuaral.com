const assert=require('node:assert/strict');
const {test}=require('node:test');
const T=require('./tredicesima.js');
const M=require('./motore.js');

const importi=r=>Object.fromEntries(r.voci.map(v=>[v.id,v.importo]));
const somma=r=>r.voci.reduce((t,v)=>t+(v.id==='lorda'||v.id==='cuneo'?v.importo:-v.importo),0);

test('le costanti coincidono con quelle del motore',()=>{
  for(const k of ['aliquotaIvs','massimale','primaFascia','aliquotaAggiuntivo'])
    assert.equal(T.K.contributi[k],M.K.contributi[k],k);
  assert.deepEqual(T.K.irpef.scaglioni,M.K.irpef.scaglioni);
  assert.deepEqual(T.K.sommaNonImponibile.aliquote,M.K.sommaNonImponibile.aliquote);
  for(const ral of ['15000','30000','60000','130000'])
    assert.equal(T.imponibileAnnuo(T.dec(ral)),M.imponibile(M.dec(ral)),ral);
});

test('casi di controllo su 13 mensilità e anno intero',()=>{
  assert.deepEqual(importi(T.calcolaDaRal({ral:'15000'})),{lorda:1153.85,inps:106.04,irpef:241,cuneo:55.53});
  assert.deepEqual(importi(T.calcolaDaRal({ral:'20000'})),{lorda:1538.46,inps:141.38,irpef:321.33,cuneo:67.06});
  assert.deepEqual(importi(T.calcolaDaRal({ral:'30000'})),{lorda:2307.69,inps:212.08,irpef:481.99});
  assert.deepEqual(importi(T.calcolaDaRal({ral:'35000'})),{lorda:2692.31,inps:247.42,aggiuntivo:7,irpef:571.17});
  assert.deepEqual(importi(T.calcolaDaRal({ral:'40000'})),{lorda:3076.92,inps:282.77,aggiuntivo:14.69,irpef:683.89});
  assert.equal(T.calcolaDaRal({ral:'15000'}).netta,862.34);
  assert.equal(T.calcolaDaRal({ral:'30000'}).netta,1613.62);
  assert.equal(T.calcolaDaRal({ral:'35000'}).netta,1866.72);
  assert.equal(T.calcolaDaRal({ral:'40000'}).netta,2095.57);
});

test('IRPEF con gli scaglioni ragguagliati a mese, fascia per fascia',()=>{
  const irpef=T.calcolaDaRal({ral:'35000'}).voci.find(v=>v.id==='irpef');
  assert.equal(irpef.fasce.length,2);
  assert.equal(irpef.fasce[0].a,2333.33333333);
  assert.equal(irpef.fasce[0].aliquota,0.23);
  assert.equal(irpef.fasce[1].aliquota,0.33);
  assert.equal(irpef.fasce.reduce((t,f)=>t+f.importo,0).toFixed(2),irpef.importo.toFixed(2));
  const alto=T.calcolaDaLordo({lordo:'9000'}).voci.find(v=>v.id==='irpef');
  assert.equal(alto.fasce.length,3);
  assert.equal(alto.fasce[2].a,null);
});

test('mesi lavorati: la tredicesima matura in ratei',()=>{
  assert.equal(T.calcolaDaRal({ral:'30000',mesi:8}).lorda,1538.46);
  assert.equal(T.calcolaDaLordo({lordo:'1200',mesi:6}).lorda,600);
});

test('le due modalità danno lo stesso risultato sullo stesso mensile',()=>{
  const daRal=T.calcolaDaRal({ral:'30000'}),daLordo=T.calcolaDaLordo({lordo:'2307.69'});
  assert.deepEqual(importi(daRal),importi(daLordo));
  assert.equal(T.calcolaDaRal({ral:'28000',mensilita:14}).lorda,2000);
});

test('contributo aggiuntivo: solo la quota che si deve alla tredicesima',()=>{
  assert.equal(importi(T.calcolaDaRal({ral:'30000'})).aggiuntivo,undefined);
  /* 4.000 + 4.000 = 8.000 a dicembre: 1% su 3.315 */
  assert.equal(importi(T.calcolaDaLordo({lordo:'4000'})).aggiuntivo,33.15);
  /* già sopra soglia col solo stipendio: 1% su tutta la tredicesima */
  assert.equal(importi(T.calcolaDaLordo({lordo:'5000'})).aggiuntivo,50);
});

test('bonus cuneo: spetta sul reddito dell\'anno, percentuale sul reddito teorico',()=>{
  assert.ok(importi(T.calcolaDaRal({ral:'22024'})).cuneo>0);
  assert.equal(importi(T.calcolaDaRal({ral:'22025'})).cuneo,undefined);
  /* 12.000 di RAL per 6 mesi: reddito dell'anno ~5.449, teorico ~10.897 → 5,3% */
  const breve=T.calcolaDaRal({ral:'12000',mesi:6}).voci.find(v=>v.id==='cuneo');
  assert.equal(breve.aliquota,0.053);
  assert.equal(breve.importo,22.21);
  /* 30.000 di RAL per 8 mesi: reddito dell'anno 18.162 → spetta, teorico 27.243 → 4,8% */
  assert.equal(T.calcolaDaRal({ral:'30000',mesi:8}).voci.find(v=>v.id==='cuneo').aliquota,0.048);
});

test('la netta riconcilia con le voci su una griglia di casi',()=>{
  for(const ral of ['1000','9000','16518','22024','35000','56224','90000','120000'])
    for(const mesi of [1,6,12])for(const mensilita of [13,14]){
      const r=T.calcolaDaRal({ral,mensilita,mesi});
      assert.equal(somma(r).toFixed(2),r.netta.toFixed(2),`${ral} ${mensilita} ${mesi}`);
    }
});

test('proposta detassata: risparmio sotto soglia, zero sopra',()=>{
  const sotto=T.calcolaDaRal({ral:'15000'}).detassata;
  assert.deepEqual(sotto,{applicabile:true,risparmio:83.83,soglia:15000,aliquota:0.15});
  assert.equal(T.calcolaDaRal({ral:'16518'}).detassata.risparmio,92.31);
  assert.deepEqual(T.calcolaDaRal({ral:'20000'}).detassata,{applicabile:false,risparmio:0,soglia:15000,aliquota:0.15});
});

test('importi scritti come li scrive una persona',()=>{
  const ral=importo=>T.normalizza({modalita:'ral',importo}).ral;
  assert.equal(ral('30000'),'30000');
  assert.equal(ral('30.000'),'30000');
  assert.equal(ral('30.000,50'),'30000.50');
  assert.equal(ral('€ 30 000'),'30000');
  assert.equal(T.normalizza({modalita:'lordo',importo:'2.300,5'}).lordo,'2300.5');
});

test('input non validi: messaggio sul campo giusto',()=>{
  const campo=input=>T.normalizza(input).errore?.campo;
  assert.equal(campo({modalita:'ral',importo:''}),'importo');
  assert.equal(campo({modalita:'ral',importo:'abc'}),'importo');
  assert.equal(campo({modalita:'ral',importo:'-5000'}),'importo');
  assert.equal(campo({modalita:'ral',importo:'999'}),'importo');
  assert.equal(campo({modalita:'ral',importo:'120001'}),'importo');
  assert.equal(campo({modalita:'lordo',importo:'99'}),'importo');
  assert.equal(campo({modalita:'lordo',importo:'9000.01'}),'importo');
  assert.equal(campo({modalita:'ral',importo:'30000',mesi:'0'}),'mesi');
  assert.equal(campo({modalita:'ral',importo:'30000',mesi:'13'}),'mesi');
  assert.equal(campo({modalita:'ral',importo:'30000',mesi:'8.5'}),'mesi');
  assert.equal(campo({modalita:'ral',importo:'30000',mensilita:'15'}),'mensilita');
  assert.equal(campo({modalita:'altro',importo:'30000'}),'modalita');
  assert.match(T.normalizza({modalita:'ral',importo:'120001'}).errore.messaggio,/120\.000/);
});

test('input valido: calcola passa alla modalità giusta',()=>{
  const r=T.calcola(T.normalizza({modalita:'ral',importo:'30.000',mensilita:'13',mesi:'12'}));
  assert.equal(r.modalita,'ral');assert.equal(r.netta,1613.62);
  assert.equal(T.calcola(T.normalizza({modalita:'lordo',importo:'2.307,69'})).netta,1613.62);
});

test('query string: precompila, ma non inventa',()=>{
  assert.deepEqual(T.daQuery('?ral=30000&mesi=8'),{modalita:'ral',importo:'30000',mensilita:'13',mesi:'8'});
  assert.deepEqual(T.daQuery('?lordo=2300'),{modalita:'lordo',importo:'2300',mesi:'12'});
  assert.equal(T.daQuery(''),null);
  assert.equal(T.daQuery('?utm_source=x'),null);
  /* una query illeggibile si legge, ma normalizza la rifiuta: la pagina resta vuota */
  assert.ok(T.normalizza(T.daQuery('?ral=abc')).errore);
  assert.ok(T.normalizza(T.daQuery('?ral=30000&mesi=0')).errore);
});

test('importi col punto delle migliaia anche sotto 10.000, come nel resto del sito',()=>{
  assert.equal(T.formattaEuro(3076.92),'3.076,92 €');
  assert.equal(T.formattaEuro(862.34),'862,34 €');
  assert.equal(T.formattaEuro(120000),'120.000,00 €');
  assert.match(T.normalizza({modalita:'lordo',importo:'9000.01'}).errore.messaggio,/da 100 a 9\.000 €/);
});
