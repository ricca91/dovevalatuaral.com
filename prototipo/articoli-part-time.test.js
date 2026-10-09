const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {calcola}=require('./motore');
const {parse}=require('./articoli-parser');
const text=fs.readFileSync(path.join(__dirname,'articoli','esempio-busta-paga-part-time.md'),'utf8');
const netto=ral=>calcola(String(ral)).kpi.nettoAnnuo;
const numero=s=>Number(s.replace(/[ €%]/g,'').replaceAll('.','').replace(',','.'));
const sezione=titolo=>text.split(/^#{2,3} /m).find(s=>s.startsWith(titolo))||'';
const diminuisce=sezione('Quanto diminuisce lo stipendio con il part-time?');
/* Ore, quota di orario, lordo mese, RAL, netto anno, netto mese, quota del netto a tempo pieno. */
const righe=diminuisce.split('\n').filter(l=>/^\| \d+ \|/.test(l)).map(l=>l.split('|').slice(1,-1).map(s=>numero(s.trim())));

test('part-time: il netto che cala meno delle ore non è una regola universale (RIC-114)',()=>{
  assert.doesNotMatch(text,/Meno di quanto diminuiscono le ore, sempre/);
  assert.doesNotMatch(diminuisce,/\bsempre\b/);
  assert.match(diminuisce,/^Quanto diminuisce[^\n]*\n\nNelle simulazioni di questa pagina, meno di quanto diminuiscono le ore/);
  assert.match(diminuisce,/Non è una regola universale: soglie fiscali, altri redditi, detrazioni personali e conguagli possono cambiare il risultato\./);
});

test('part-time: la conclusione ristretta vale riga per riga sulla tabella del motore (RIC-114)',()=>{
  assert.deepEqual(righe.map(r=>r[0]),[40,30,24,20,16]);
  for(const [ore,,,ral,nettoAnno] of righe)assert.equal(netto(ral),nettoAnno,`${ore} ore`);
  const scarto=righe.slice(1).map(([ore,quotaOrario,,,,,quotaNetto])=>{
    assert.ok(quotaNetto>quotaOrario,`${ore} ore`);
    return quotaNetto-quotaOrario;
  });
  for(let i=1;i<scarto.length;i++)assert.ok(scarto[i]>scarto[i-1],`${righe[i+1][0]} ore`);
});

test('part-time: resta il salto da 130,11 € e la fonte del conguaglio (RIC-114)',()=>{
  const scala=sezione('Perché il netto non scala con le ore?');
  assert.ok(scala.includes('un centesimo di lordo in più, 130,11 € netti in meno'));
  assert.equal(Math.round((netto(16518.01)-netto(16518.02))*100)/100,130.11);
  const fonti=text.split('## Fonti')[1];
  assert.match(fonti,/D\.L\. 5 febbraio 2020, n\. 3, art\. 1 — [^\n]*il datore ne verifica la spettanza al conguaglio e recupera quanto non spetta \(c\. 3\)[^\n]*verificata il 9 ottobre 2026/);
  const articolo=parse(text,'esempio-busta-paga-part-time.md');
  assert.equal(articolo.data_aggiornamento,'2026-10-09');
});
