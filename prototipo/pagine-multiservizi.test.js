const test=require('node:test');
const assert=require('node:assert/strict');
const {CONTRATTI_SEO,ROTTE,datiLivello}=require('./genera-pagine-ccnl.js');

/* RIC-100: 5° e 6° livello Multiservizi hanno domanda (Search Console,
   DataForSEO «ccnl multiservizi 5/6 livello»). Il 7° e il quadro esistono
   solo fra gli impiegati e nessuno li cerca: niente pagina. */
const multi=CONTRATTI_SEO.find(c=>c.slug==='multiservizi');

test('Multiservizi: pagine dal 1° al 6° livello, né il 7° né il quadro',()=>{
  assert.deepEqual(multi.livelli,['1','2','3','4','5','6']);
  for(const n of [5,6])assert.ok(ROTTE.includes(`/minimi-ccnl/multiservizi/${n}-livello/`));
  assert.ok(!ROTTE.some(r=>/multiservizi\/(7-livello|quadro)/.test(r)));
});

test('Multiservizi 5° e 6° livello: operai e impiegati, cifre finite',()=>{
  for(const codice of ['5','6']){
    const d=datiLivello(multi,codice,'2026-10-16');
    assert.deepEqual(d.righe.map(r=>r.sezione).sort(),['impiegati','operai']);
    for(const r of d.righe)assert.ok(Number.isFinite(r.composta.ral)&&r.composta.ral>0);
  }
});
