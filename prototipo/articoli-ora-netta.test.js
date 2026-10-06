const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {calcola}=require('./motore');
const text=fs.readFileSync(path.join(__dirname,'articoli','quanto-vale-un-ora-di-lavoro-netta.md'),'utf8');
const cents=s=>Math.round(Number(s.replace(/[€%\s.]/g,'').replace(',','.'))*100);
const rows=text.split('\n').filter(l=>/^\| [\d.]+ € \|/.test(l)).map(l=>l.split('|').slice(1,-1).map(s=>s.trim()));
const netto=ral=>calcola(String(Math.round(ral*100)/100)).kpi.nettoAnnuo;
const paragrafo=needle=>text.split('\n\n').find(p=>p.includes(needle))||'';
const ORE=2076,DIVISORE=173,MENSILITA=13;

test('ora netta: il netto orario si confronta con il lordo annuo sulle stesse ore, non con la paga base (RIC-86)',()=>{
  assert.doesNotMatch(text,/senza ore in cambio/);
  assert.doesNotMatch(text,/87,4%/);
  assert.match(text,/\| Lordo annuo per ora retribuita \| RAL divisa le ore retribuite \| 12,52 € \|/);
  assert.match(paragrafo('**12,52 €**'),/80,7%/);
  assert.match(text,/\| RAL \| Netto annuo \| Lordo annuo per ora retribuita \| Netto per ora retribuita \| Paga base oraria \| Netto dell'ora in più \| Prelievo marginale \|/);
  assert.equal(rows.length,9);
  for(const row of rows){
    const [ral,annuo,lordoOra,nettoOra,base,margine,prelievo]=row.map(cents);
    const atteso=netto(ral/100);
    assert.equal(annuo,Math.round(atteso*100),row[0]);
    assert.equal(lordoOra,Math.round(ral/ORE),row[0]);
    assert.equal(nettoOra,Math.round(atteso*100/ORE),row[0]);
    const pagaBase=ral/100/MENSILITA/DIVISORE;
    assert.equal(base,Math.round(pagaBase*100),row[0]);
    // ora in più: 100 ore aggiunte alla paga base, come dichiarato sotto la tabella
    const extra=(netto(ral/100+pagaBase*100)-atteso)/100;
    assert.equal(margine,Math.round(extra*100),row[0]);
    assert.equal(prelievo,Math.round((1-extra/pagaBase)*1000)*10,row[0]);
  }
});

test('ora netta: part time e offerte con mensilità diverse confrontano lordo e netto annui (RIC-86)',()=>{
  const partTime=paragrafo('12.725,55 €');
  assert.equal(netto(13000),12725.55);
  for(const valore of ['12,52 €','12,26 €','97,9%','10,11 €','80,7%'])assert.ok(partTime.includes(valore),valore);
  const offerte=paragrafo('14 mensilità');
  assert.equal((1900/DIVISORE).toFixed(2),'10.98');
  assert.equal((26600/ORE).toFixed(2),'12.81');
  assert.equal((netto(26600)/ORE).toFixed(2),'10.28');
  for(const valore of ['10,98 €','26.600 €','12,81 €','10,28 €','12,52 €','10,11 €'])assert.ok(offerte.includes(valore),valore);
});
