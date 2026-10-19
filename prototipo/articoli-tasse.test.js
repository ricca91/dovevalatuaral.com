const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {parse}=require('./articoli-parser');
const text=fs.readFileSync(path.join(__dirname,'articoli','ho-pagato-piu-tasse-del-previsto.md'),'utf8');
const sezione=titolo=>text.split(/^#{2,3} /m).find(s=>s.startsWith(titolo))||'';

test('tasse: quota netta e prelievo incrementale sono distinti e riconciliati (RIC-134)',()=>{
  const causa1=sezione('Causa 1: hai superato lo scaglione in quel mese?').replace(/\*\*/g,'');
  const cents=value=>Math.round(Number(value.replace(/\./g,'').replace(',','.'))*100);
  const netto=causa1.match(/netto annuo passa da ([\d.,]+) € a ([\d.,]+) €/);
  const lordo=cents(causa1.match(/— ([\d.,]+) € lordi in più/)[1]);
  const retained=causa1.match(/restano ([\d.,]+) €, cioè il ([\d,]+)% dell'aumento lordo/);
  const withheld=causa1.match(/prelievo complessivo incrementale è di ([\d.,]+) €, pari al ([\d,]+)%/);
  assert.ok(retained,'la percentuale netta deve essere indicata come quota che resta');
  assert.ok(withheld,'il prelievo complessivo deve avere importo e percentuale propri');
  const retainedShare=cents(retained[2]);
  const withheldShare=cents(withheld[2]);
  assert.equal(cents(netto[2])-cents(netto[1]),149186);
  assert.equal(cents(retained[1]),149186);
  assert.equal(cents(withheld[1]),90814);
  assert.equal(retainedShare,Math.round(cents(retained[1])/lordo*10000));
  assert.equal(withheldShare,Math.round(cents(withheld[1])/lordo*10000));
  assert.equal(retainedShare+withheldShare,10000);
  const trattenute=[...causa1.matchAll(/^\|[^\n|]+\| −([\d.,]+) € \|$/gm)];
  assert.equal(trattenute.length,5);
  assert.equal(trattenute.reduce((sum,row)=>sum+cents(row[1]),0),cents(withheld[1]));
  assert.equal(cents(retained[1])+cents(withheld[1]),lordo);
});

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
