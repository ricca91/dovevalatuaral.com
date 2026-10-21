const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {parse,markdown}=require('./articoli-parser');
const text=fs.readFileSync(path.join(__dirname,'articoli/esempio-busta-paga-pignoramento.md'),'utf8');

for(const [netto,quota,trattenuta,resta] of [
  ['2.499,00','Un decimo','249,90','2.249,10'],
  ['2.501,00','Un settimo','357,29','2.143,71'],
])test(`AER: il cedolino da ${netto} applica ${quota.toLowerCase()} (RIC-136)`,()=>{
  const rows=text.split('\n').filter(row=>row.startsWith(`| ${netto} € |`));
  assert.equal(rows.length,1,'esempio sul netto del singolo cedolino');
  assert.deepEqual(rows[0].split('|').slice(1,-1).map(s=>s.trim()),
    [`${netto} €`,quota,`${trattenuta} €`,`${resta} €`]);
});

test('AER: nessuna tabella associa la RAL a una fascia legale (RIC-136)',()=>{
  const tables=text.match(/(?:^\|.*\n)+/gm)||[];
  for(const table of tables)if(table.includes('RAL'))
    assert.doesNotMatch(table,/Un decimo|Un settimo|Scaglione/);
  assert.doesNotMatch(text,/89,84|dividilo per cinque\. Per dieci/);
  assert.match(text,/La media annua divisa per 13 non basta/);
  assert.match(text,/tredicesima[^\n]*separatamente/);
  const article=parse(text);
  assert.ok(markdown(article.body).includes('2.143,71 €'));
});
