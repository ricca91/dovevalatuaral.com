const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');

/* RIC-231: il template delle pagine CCNL riceve dati già calcolati dal
   generatore e non deve importare il catalogo retribuzione-ccnl.js.
   Oggi lo importa (riga 3): il test si attiva al passo 6 del refactor. */
test('ccnl-page.template.js non fa require di retribuzione-ccnl.js',{skip:'RIC-231: si attiva al passo 6'},()=>{
  const src=fs.readFileSync(path.join(__dirname,'ccnl-page.template.js'),'utf8');
  const richieste=[...src.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g)].map(m=>m[1]);
  const vietate=richieste.filter(r=>/(^|\/)retribuzione-ccnl(\.js)?$/.test(r));
  assert.deepEqual(vietate,[],'il template importa retribuzione-ccnl.js');
});
