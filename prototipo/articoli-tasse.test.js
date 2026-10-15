const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {parse}=require('./articoli-parser');
const text=fs.readFileSync(path.join(__dirname,'articoli','ho-pagato-piu-tasse-del-previsto.md'),'utf8');
const sezione=titolo=>text.split(/^#{2,3} /m).find(s=>s.startsWith(titolo))||'';

test('tasse: l\'incapienza del mese non è data per definitiva (RIC-113)',()=>{
  assert.doesNotMatch(text,/non torna in nessun modo/);
  const causa2=sezione('Causa 2: la detrazione è entrata tutta?');
  assert.match(causa2,/L'incapienza del cedolino può essere temporanea; l'esito definitivo si determina al conguaglio annuale o alla cessazione del rapporto\./);
  assert.match(causa2,/incapienza annuale/);
  assert.match(causa2,/il datore rifà il conto sull'anno: confronta quello che ti ha trattenuto con l'imposta dovuta su tutto quello che ti ha pagato, tenendo conto delle detrazioni spettanti/);
  assert.match(causa2,/la tua IRPEF lorda dell'anno è 400 €/);
});

test('tasse: la perdita definitiva è limitata all\'incapienza sull\'imposta annuale (RIC-113)',()=>{
  const restituite=sezione('Le trattenute fiscali vengono restituite?');
  assert.match(restituite,/Una detrazione non assorbita nel singolo mese non è necessariamente persa: al conguaglio il datore ricalcola imposta e detrazioni sul reddito dell'intero anno\./);
  assert.match(restituite,/Resta definitivamente inutilizzata solo la quota che non trova capienza neppure nell'imposta annuale complessiva/);
});

test('tasse: le fonti del conguaglio sono citate e la pagina si genera (RIC-113)',()=>{
  const fonti=text.split('## Fonti')[1];
  assert.match(fonti,/art\. 23 c\. 3 — [^\n]*alla data di cessazione del rapporto[^\n]*detrazioni degli artt\. 12 e 13 TUIR/);
  assert.match(fonti,/INPS, circolare n\. 12 del 19 gennaio 1998/);
  assert.ok(fonti.includes('https://servizi2.inps.it/servizi/Bussola/visualizzadoc.aspx?sVirtuAlURL=%2FCircolari%2FCircolare+numero+12+del+19-1-1998.htm'));
  const articolo=parse(text,'ho-pagato-piu-tasse-del-previsto.md');
  assert.equal(articolo.data_aggiornamento,'2026-10-08');
});
