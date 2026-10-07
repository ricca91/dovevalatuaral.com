const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {calcola}=require('./motore');
const {parse,markdown}=require('./articoli-parser');
const text=fs.readFileSync(path.join(__dirname,'articoli','voci-busta-paga.md'),'utf8');
const netto=ral=>calcola(String(ral)).kpi.nettoAnnuo;
const paragrafo=needle=>text.split('\n\n').find(p=>p.includes(needle))||'';
const riga=inizio=>(text.split('\n').find(l=>l.startsWith(`| ${inizio} |`))||'').split('|').slice(1,-1).map(s=>s.trim());

test('voci busta paga: un rimborso documentato non è per forza netto esente (RIC-88)',()=>{
  assert.doesNotMatch(text,/\| Rimborso spese documentate \|[^\n]*\| Solo il netto \|/);
  assert.doesNotMatch(text,/un rimborso spese documentato, per esempio/);
  assert.doesNotMatch(text,/Sono i rimborsi spese documentati e le competenze non imponibili/);
  assert.match(riga('Rimborso spese, nota spese, rimborso km')[2],/Solo il netto se esente, il lordo se imponibile/);
  assert.match(paragrafo('Cento euro che entrano dopo le imposte'),/«Documentato» da solo non basta/);
});

test('voci busta paga: rimborsi distinti per comune, tipo di spesa e tracciabilità (RIC-88)',()=>{
  assert.match(text,/^### Quando un rimborso spese arriva intero, e quando passa dal lordo\?$/m);
  assert.deepEqual(riga('Spesa rimborsata'),['Spesa rimborsata','Trasferta fuori dal comune','Trasferta dentro il comune']);
  const [,fuoriVitto,dentroVitto]=riga('Vitto e alloggio');
  assert.match(fuoriVitto,/^Esente con la ricevuta e, in Italia, se pagata con mezzi tracciabili$/);
  assert.match(dentroVitto,/^Imponibile/);
  const [,fuoriViaggio,dentroViaggio]=riga('Treno, aereo, autobus, pedaggi, parcheggio, rimborso km');
  assert.match(fuoriViaggio,/^Esente/);
  assert.match(dentroViaggio,/^Esente/);
  assert.match(paragrafo('Per viaggio e trasporto dentro il comune'),/«comprovate e documentate»: non serve più il biglietto del vettore/);
  const [,fuoriTaxi,dentroTaxi]=riga('Taxi e NCC, anche prenotati da app');
  for(const cella of [fuoriTaxi,dentroTaxi])assert.match(cella,/mezzi tracciabili/);
  assert.deepEqual(riga('Altre spese, anche senza ricevuta').slice(1),["Esenti fino a 15,49 € al giorno, 25,82 € all'estero",'Imponibili']);
  const tracciabilita=paragrafo('La tracciabilità è richiesta');
  for(const valore of ['1° gennaio 2025','in Italia','imposta di soggiorno','rimborso chilometrico',"all'estero non serve"])assert.ok(tracciabilita.includes(valore),valore);
});

test('voci busta paga: un esempio esente e uno imponibile, legati al motore (RIC-88)',()=>{
  const esempi=paragrafo('Due esempi sulla RAL di questa pagina');
  assert.match(esempi,/Bologna da 100 €, pagata con carta[^.]*: non entra nel reddito, e ti arrivano \*\*100 € netti\*\*/);
  assert.match(esempi,/pranzi durante le trasferte dentro Milano[^.]*: entrano nel lordo/);
  const imponibile=(netto(30100)-netto(30000)).toFixed(2).replace('.',',');
  assert.equal(imponibile,'59,43');
  assert.ok(esempi.includes(`**${imponibile} € netti**`));
  assert.ok(paragrafo('Cento euro che entrano dopo le imposte').includes(`ne restano ${imponibile}`));
});

test('voci busta paga: le fonti dei rimborsi sono citate e la pagina si genera (RIC-88)',()=>{
  const fonti=text.split('## Fonti')[1];
  assert.match(fonti,/TUIR, art\. 51 c\. 5 — rimborsi di trasferta/);
  assert.match(fonti,/Agenzia delle Entrate, circolare 15\/E del 22 dicembre 2025/);
  assert.match(fonti,/INPS, circolare 263\/1997/);
  const articolo=parse(text,'voci-busta-paga.md');
  assert.equal(articolo.data_aggiornamento,'2026-10-07');
  assert.match(markdown(articolo.body),/<h3>Quando un rimborso spese arriva intero, e quando passa dal lordo\?<\/h3>/);
});
