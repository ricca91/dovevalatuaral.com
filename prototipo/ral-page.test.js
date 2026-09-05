const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {calcola,applicaMensilita,eur}=require('./motore.js');

const pagina=fs.readFileSync(path.join(__dirname,'ral-35000-netto','index.html'),'utf8');

test.describe('pagina RAL 35.000',()=>{
  const risultato=calcola('35000');

  test('pubblica i valori prodotti dal motore per 12, 13 e 14 mensilità',()=>{
    assert.equal(risultato.kpi.nettoAnnuo,26032.17);
    for(const mensilita of [12,13,14]){
      const media=applicaMensilita(risultato,mensilita).kpi.mediaMensile;
      assert.match(pagina,new RegExp(escapeRegExp(eur(media))));
    }
    assert.match(pagina,new RegExp(escapeRegExp(eur(risultato.kpi.nettoAnnuo))));
    assert.match(pagina,new RegExp(escapeRegExp(eur(risultato.kpi.totaleImposte))));
    assert.match(pagina,new RegExp(escapeRegExp(eur(risultato.kpi.totaleContributi))));
  });

  test('ha metadati univoci e canonical sulla pagina, non sulla home',()=>{
    assert.match(pagina,/<html lang="it">/);
    assert.match(pagina,/<title>RAL 35\.000 €: stipendio netto su 12, 13 e 14 mensilità<\/title>/);
    assert.match(pagina,/<meta name="description" content="[^"]+">/);
    assert.match(pagina,/<link rel="canonical" href="https:\/\/www\.dovevalatuaral\.com\/ral-35000-netto\/">/);
    assert.match(pagina,/<h1>RAL 35\.000 €: netto su 12, 13 o 14 mensilità<\/h1>/);
  });

  test('offre percorsi reali verso il calcolatore e le RAL confinanti',()=>{
    for(const mensilita of [12,13,14])
      assert.match(pagina,new RegExp(`index\\.html\\?ral=35\\.000&amp;m=${mensilita}&amp;c=F205&amp;calc=1`));
    assert.match(pagina,/href="\.\.\/ral-30000-netto\/"/);
    assert.match(pagina,/href="\.\.\/ral-40000-netto\/"/);
  });

  test('mantiene la navigazione essenziale e spiega il confronto senza una falsa scansione mensile',()=>{
    assert.doesNotMatch(pagina,/<nav class="nav ral-nav"/);
    assert.doesNotMatch(pagina,/Metodo e fonti|La storia|Come cambiano le mensilità/);
    assert.match(pagina,/Tre numeri mensili, un solo netto annuo/);
    assert.match(pagina,/Il totale non cambia/);
    assert.match(pagina,/Cambia la media mensile/);
    assert.match(pagina,/Decide il contratto/);
  });
});

function escapeRegExp(valore){
  return valore.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
}
