const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const R=require('./retribuzione-ccnl');
const {parse}=require('./articoli-parser');
const text=fs.readFileSync(path.join(__dirname,'articoli','edr-in-busta-paga.md'),'utf8');
const articolo=parse(text,'edr-in-busta-paga.md');
const {body}=articolo;
const sezione=titolo=>{
  const start=body.indexOf(titolo);
  assert.ok(start>=0,titolo);
  const end=body.indexOf('\n#',start+titolo.length);
  return body.slice(start,end<0?undefined:end);
};
const controlli=sezione('## Dove sta l\'EDR nel tuo cedolino?');
const partTime=sezione('### Sei part-time, e l\'EDR scende con le ore');
/* 2° livello operaio Multiservizi a 25 ore su 40, tabella dal 1° ottobre 2026. */
const venticinque=R.componiRal({ccnl:'multiservizi-pulizia-k511',sezione:'operai',livello:'2',oreSettimanali:25,alla:'2026-10-12'});
const edr=venticinque.quote.find(q=>q.id==='edr');
const euro=n=>n.toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2,useGrouping:'always'});

test('EDR: la checklist non presenta più l\'importo come «per intero o assente» (RIC-117)',()=>{
  assert.doesNotMatch(body,/o il mese è retribuito, o non c'è/);
  assert.doesNotMatch(body,/L'EDR non si matura a ore/);
  assert.doesNotMatch(controlli,/L'importo mensile deve essere una \*\*cifra fissa\*\*, non il risultato di ore per tariffa/);
});

test('EDR: la regola del tempo pieno è distinta dal riproporzionamento part-time (RIC-117)',()=>{
  assert.match(controlli,/Due controlli li fai in dieci secondi\. Il primo cambia se sei part-time: il conto completo è più sotto, nel paragrafo sul part-time\./);
  const primo=controlli.split('\n').find(l=>l.startsWith('- '));
  assert.match(primo,/^- A tempo pieno, senza riduzioni d'orario, l'EDR del 1992 è una \*\*cifra mensile fissa\*\*, non il risultato di ore effettivamente lavorate per una tariffa\./);
  assert.match(primo,/Nel part-time invece si riproporziona all'orario del contratto: a 25 ore su 40, i 10,33 € diventano \*\*6,46 €\*\*\./);
  assert.match(primo,/Un importo diverso da 10,33 €, da solo, non è un errore\./);
});

test('EDR: l\'esempio 25/40 della checklist torna con il paragrafo part-time e con il motore (RIC-117)',()=>{
  assert.equal(venticinque.oreContrattuali,40);
  assert.equal(edr.mensile,Math.round(10.33*25/40*100)/100);
  assert.equal(edr.mensilita,13);
  const mese=`${euro(edr.mensile)} €`,anno=`${euro(Math.round(edr.mensile*13*100)/100)} €`;
  assert.ok(controlli.includes(`**${mese}**`),mese);
  assert.ok(controlli.includes(`su ${mese} sono ${anno}`),anno);
  assert.ok(partTime.includes(`a 25 ore su 40 prende **${mese} al mese**: ${anno} lordi l'anno`),mese);
  assert.ok(partTime.includes(`su una RAL di ${euro(venticinque.ral)} €`),'RAL a 25 ore');
});

test('EDR: resta la distinzione fra l\'EDR del 1992 e gli EDR contrattuali di altro importo (RIC-117)',()=>{
  assert.ok(body.includes('### Sei nella logistica, dove l\'EDR dipende dal livello'));
  assert.ok(body.includes('### Non è l\'EDR del 1992, è un EDR che segnala un versamento mancante'));
  assert.match(body,/## E se il tuo EDR non fa 10,33 euro\?\n\nAllora non stai guardando per forza l'EDR del 1992\./);
});

test('EDR: fonte del part-time riletta e data di aggiornamento (RIC-117)',()=>{
  const fonti=body.split('## Fonti')[1];
  assert.match(fonti,/D\.Lgs\. 81\/2015, art\. 7 comma 2 — [^\n]*riproporzionato in ragione della ridotta entità della prestazione lavorativa[^\n]*verificata il 12 ottobre 2026/);
  assert.equal(articolo.data_aggiornamento,'2026-10-12');
});
