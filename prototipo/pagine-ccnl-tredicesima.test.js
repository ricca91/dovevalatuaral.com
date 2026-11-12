const assert=require('node:assert/strict');
const {test}=require('node:test');
const {CONTRATTI_SEO,datiLivello}=require('./genera-pagine-ccnl.js');
const {renderLivello}=require('./ccnl-page.template.js');
const T=require('./tredicesima.js');
const {eur}=require('./motore.js');

test('ogni pagina livello mostra la stessa tredicesima del calcolatore precompilato',()=>{
  for(const c of CONTRATTI_SEO)for(const codice of c.livelli||[]){
    const d=datiLivello(c,codice,'2026-11-12');
    const html=renderLivello({...d,alla:'2026-11-12'});
    for(const r of d.righe){
      const query=`?lordo=${encodeURIComponent(String(r.composta.baseMensile))}&mesi=12`;
      const input=T.normalizza(T.daQuery(query));
      assert.ok(!input.errore,`${d.rotta}: input non valido`);
      const risultato=T.calcola(input);
      assert.deepEqual(r.tredicesima,risultato,d.rotta);
      assert.ok(html.includes(eur(risultato.lorda))&&html.includes(eur(risultato.netta)),d.rotta);
      assert.ok(html.includes(query.replace('&','&amp;')),d.rotta);
      if(r.quattordicesima)assert.ok(html.includes(eur(r.quattordicesima.lorda))&&html.includes(eur(r.quattordicesima.netta)),d.rotta);
    }
  }
});

test('quattordicesima: esclusione EDR logistica e mezza mensilità cooperative',()=>{
  const r=(slug,codice)=>datiLivello(CONTRATTI_SEO.find(c=>c.slug===slug),codice,'2026-11-12').righe[0];
  const logistica=r('logistica','3°');
  assert.equal(logistica.quattordicesima.lorda,logistica.composta.quote.find(q=>q.id==='base').mensile);
  const coop=r('cooperative-sociali','D1');
  assert.equal(coop.quattordicesima.lorda,Math.round(coop.composta.baseMensile*100/2)/100);
});
