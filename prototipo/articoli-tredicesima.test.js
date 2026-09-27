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
