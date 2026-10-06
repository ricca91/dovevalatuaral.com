const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {calcolaDaRal}=require('./tredicesima');
const read=name=>fs.readFileSync(path.join(__dirname,'articoli',`${name}.md`),'utf8');
const cents=s=>Math.round(Number(s.replace(/[€\s+.]/g,'').replace('−','-').replace(',','.').replace('—','0'))*100);
const rows=text=>text.split('\n').filter(l=>/^\| [\d.]+ € \|/.test(l)).map(l=>l.split('|').slice(1,-1).map(s=>s.trim()));

test('le tabelle editoriali della tredicesima coincidono con il calcolatore prima del conguaglio',()=>{
  const detassata=read('tredicesima-detassata');
  const tassazione=read('tassazione-tredicesima');
  for(const text of [detassata,tassazione])assert.match(text,/Netto della tredicesima prima del conguaglio/);
  const dettagli=rows(detassata).filter(r=>r.length===7);
  assert.equal(dettagli.length,7);
  for(const row of dettagli){
    const [ral,lorda,inps,ivs,irpef,cuneo,netta]=row.map(cents);
    const result=calcolaDaRal({ral:ral/100});
    assert.equal(lorda+inps+ivs+irpef+cuneo,netta,row[0]);
    assert.equal(netta,Math.round(result.netta*100),row[0]);
    for(const [id,value] of [['lorda',lorda],['inps',-inps],['aggiuntivo',-ivs],['irpef',-irpef],['cuneo',cuneo]])
      assert.equal(Math.abs(value),Math.round((result.voci.find(v=>v.id===id)?.importo||0)*100),`${row[0]} ${id}`);
  }
  const confronti=rows(tassazione).filter(r=>r.length===4);
  assert.equal(confronti.length,7);
  for(const row of confronti){
    const [ral,ordinario,netta,divario]=row.map(cents);
    assert.equal(netta,Math.round(calcolaDaRal({ral:ral/100}).netta*100),row[0]);
    assert.equal(ordinario-netta,divario,row[0]);
  }
  for(const row of rows(detassata).filter(r=>r.length===3)){
    const [ral,risparmio,azzeramento]=row.map(cents);
    const irpef=calcolaDaRal({ral:ral/100}).voci.find(v=>v.id==='irpef');
    assert.equal(azzeramento,Math.round(irpef.importo*100));
    assert.equal(risparmio,azzeramento-Math.round(irpef.base*15));
  }
});

test('la tredicesima per mesi lavorati distingue la ritenuta di dicembre dal beneficio annuo del cuneo',()=>{
  const {calcola}=require('./motore');
  const text=read('tredicesima-mensilita-quanto-arriva');
  const mesi=text.split('\n').filter(l=>/^\| \d+ \| [\d.,]+ € \|/.test(l)).map(l=>l.split('|').slice(1,-1).map(s=>s.trim()));
  assert.equal(mesi.length,7);
  for(const [m,lorda,netta] of mesi){
    const result=calcolaDaRal({ral:30000,mesi:Number(m)});
    assert.equal(cents(lorda),Math.round(result.lorda*100),`${m} mesi`);
    assert.equal(cents(netta),Math.round(result.netta*100),`${m} mesi`);
  }
  /* Sopra 20.000 € il cuneo cambia forma, non sparisce (L. 207/2024 c. 6-7). */
  assert.doesNotMatch(text,/soglia secca|sparisce per intero|il bonus non c'è/);
  assert.match(text,/Netto della tredicesima prima del conguaglio/);
  assert.match(text,/ulteriore detrazione/);
  assert.match(text,/rapportat[ai] al periodo di lavoro/);
  /* Gli esempi annui: otto mesi su 30.000 € sono l'imponibile di una RAL di 20.000, nove di 22.500. */
  const voce=(ral,id)=>calcola(ral).voci.find(v=>v.id===id);
  assert.equal(calcola(20000).imponibile,18162);
  assert.ok(text.includes(`${voce(20000,'somma').importo.toFixed(2).replace('.',',')} €`));
  assert.equal(calcola(22500).imponibile,20432.25);
  assert.equal(voce(22500,'somma'),undefined);
  assert.equal(voce(22500,'detrult').importo,1000);
});
