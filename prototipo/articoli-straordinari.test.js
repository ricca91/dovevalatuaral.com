const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {calcola}=require('./motore');
const {parse}=require('./articoli-parser');
const text=fs.readFileSync(path.join(__dirname,'articoli','straordinari-non-pagati-busta-paga.md'),'utf8');
const netto=ral=>calcola(String(ral)).kpi.nettoAnnuo;
const euro=x=>x.toFixed(2).replace('.',',');
const sezione=titolo=>text.split(/^#{2,3} /m).find(s=>s.startsWith(titolo))||'';
const riga=inizio=>(text.split('\n').find(l=>l.startsWith(`| ${inizio} |`))||'').split('|').slice(1,-1).map(s=>s.trim());
/* RAL 30.000 €, 13 mensilità, divisore 173, dieci ore al 22%: la sola maggiorazione, intera o a metà. */
const maggiorazione=quota=>30000/13/173*0.22*10*quota;
const nettoMaggiorazione=quota=>netto(30000+maggiorazione(quota))-netto(30000);

test('straordinari: la banca ore non è zero euro per regola generale (RIC-85)',()=>{
  assert.doesNotMatch(text,/non arriva un euro/);
  assert.doesNotMatch(text,/zero euro adesso/);
  assert.doesNotMatch(text,/non portano? un euro/);
  assert.doesNotMatch(text,/Dipende da una cosa sola/);
  const caso3=sezione('Caso 3: le ore sono finite in banca ore');
  assert.match(caso3,/^Caso 3[^\n]*\n\nSe le ore finiscono in banca ore, il pagamento immediato dipende dal CCNL\./);
  assert.match(caso3,/alcuni contratti non pagano altro nel mese, altri riconoscono comunque la maggiorazione o una sua quota/);
  assert.match(caso3,/«in alternativa o in aggiunta alle maggiorazioni retributive»/);
  assert.match(caso3,/Controlla la disciplina del tuo CCNL e le voci del cedolino/);
});

test('straordinari: un esempio di riposo più maggiorazione, intera o a metà, legato al motore (RIC-85)',()=>{
  assert.deepEqual(riga('Solo il riposo').slice(1),['0,00 €','0,00 €','10 ore']);
  for(const [etichetta,quota] of [['Riposo più metà della maggiorazione',0.5],['Riposo più la maggiorazione intera',1]]){
    const [,lordo,nettoMese,ore]=riga(etichetta);
    assert.equal(lordo,`${euro(maggiorazione(quota))} €`,etichetta);
    assert.equal(nettoMese,`${euro(nettoMaggiorazione(quota))} €`,etichetta);
    assert.equal(ore,'10 ore',etichetta);
  }
  assert.equal(euro(nettoMaggiorazione(0.5)),'8,75');
  assert.equal(euro(nettoMaggiorazione(1)),'17,38');
  const caso3=sezione('Caso 3: le ore sono finite in banca ore');
  assert.match(caso3,/maggiorazione onnicomprensiva pari al 50% di quella prevista per il lavoro straordinario/);
});

test('straordinari: riepilogo dei tre casi e sezione «Conviene» coerenti con il CCNL (RIC-85)',()=>{
  const inBreve=text.split('\n').find(l=>l.startsWith('> **In breve**'))||'';
  assert.match(inBreve,/ore accantonate in banca ore, dove è il CCNL a decidere se nel mese arriva comunque la maggiorazione o una sua quota/);
  const treCasi=sezione('Straordinari non pagati: i tre casi');
  assert.match(treCasi,/dieci ore finite in banca ore sono dieci ore di riposo da usare e, nel mese, zero euro oppure la sola maggiorazione, intera o in parte, secondo il CCNL/);
  const conviene=sezione('Conviene tenere gli straordinari');
  assert.match(conviene,/le stesse dieci ore diventano riposo; l'eventuale maggiorazione pagata subito dipende dal CCNL/);
  for(const cifra of ['96,70 €',`${euro(nettoMaggiorazione(0.5))} €`,`${euro(nettoMaggiorazione(1))} €`])assert.ok(conviene.includes(cifra),cifra);
  assert.doesNotMatch(conviene,/162,74 € lordi li vedi solo se/);
});

test('straordinari: le fonti della banca ore sono citate e la pagina si genera (RIC-85)',()=>{
  const fonti=text.split('## Fonti')[1];
  assert.match(fonti,/Ministero del Lavoro, «Diritto ad un'equa retribuzione»/);
  assert.ok(fonti.includes('https://www.lavoro.gov.it/_layouts/Lavoro.Web/AppPages/GetResource?ds=oil&rid=2454'));
  assert.match(fonti,/CCNL piccola e media industria metalmeccanica e installazione di impianti, 26 maggio 2021, art\. 29/);
  const articolo=parse(text,'straordinari-non-pagati-busta-paga.md');
  assert.equal(articolo.data_aggiornamento,'2026-10-07');
});
