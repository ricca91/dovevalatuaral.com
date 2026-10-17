const assert=require('node:assert/strict');

const R=require('./retribuzione-ccnl.js');
const {calcola,applicaMensilita}=require('./motore.js');

/* Le prove che ogni contratto del dataset ripete uguali: decorrenze
   delle tranche, scatti in cifra fissa, netto che riconcilia. Le
   usano i test dei gruppi 1 e 2 (RIC-60, RIC-61). Non è un file di
   prova da solo e non va in produzione: la build lo esclude. */

const giornoPrima=iso=>new Date(Date.parse(iso+'T00:00:00Z')-86400000).toISOString().slice(0,10);

/* Il giorno prima e il giorno esatto di ogni tranche, prima della
   prima nessuna tabella, e il passaggio alla tranche già firmata. */
function provaDecorrenze(ccnl,sezione,attese){
  assert.deepEqual((sezione?R.sezioni(ccnl).find(s=>s.id===sezione):R.trovaContratto(ccnl))
    .tabelle.map(t=>t.decorrenza),attese,`${ccnl} ${sezione||''}`);
  assert.throws(()=>R.tabellaVigente(ccnl,giornoPrima(attese[0]),sezione),RangeError);
  attese.forEach((decorrenza,i)=>{
    assert.equal(R.tabellaVigente(ccnl,decorrenza,sezione).decorrenza,decorrenza);
    if(i>0){
      assert.equal(R.tabellaVigente(ccnl,giornoPrima(decorrenza),sezione).decorrenza,attese[i-1]);
      assert.equal(R.prossimaTabella(ccnl,giornoPrima(decorrenza),sezione).decorrenza,decorrenza);
    }
  });
  assert.equal(R.prossimaTabella(ccnl,attese[attese.length-1],sezione),null);
}

/* Scatti in cifra fissa: prima e alla decorrenza del primo, il
   secondo, il tetto, l'override, l'anzianità assente e non valida.
   `cadenza` e `massimo` sono quelli letti nell'articolo del contratto;
   `alla` è la data fissa delle prove di chi chiama. */
function provaScattiFissi({ccnl,sezione=null,livello,cadenza,massimo,importo,mensilita,alla}){
  const inizio='2015-03-15';
  const anno=a=>`${2015+a}`;
  const maturati=data=>R.scattiMaturati(ccnl,inizio,data,sezione);
  /* Il primo matura il 15 marzo dopo `cadenza` anni e decorre dal 1° aprile. */
  assert.equal(maturati(`${anno(cadenza)}-03-31`),0,`${ccnl} prima del primo`);
  assert.equal(maturati(`${anno(cadenza)}-04-01`),1,`${ccnl} primo`);
  if(massimo>1){
    assert.equal(maturati(`${anno(2*cadenza)}-03-31`),1,`${ccnl} prima del secondo`);
    assert.equal(maturati(`${anno(2*cadenza)}-04-01`),2,`${ccnl} secondo`);
  }
  assert.equal(maturati(`${anno(massimo*cadenza)}-04-01`),massimo,`${ccnl} tetto esatto`);
  assert.equal(R.scattiMaturati(ccnl,'1970-01-01',alla,sezione),massimo,`${ccnl} oltre il tetto`);
  const r=R.componiRal({ccnl,sezione,livello,scatti:massimo,alla});
  assert.equal(r.valoreScatto,importo);
  assert.equal(r.scattiMensili,Math.round(importo*100*massimo)/100);
  assert.equal(r.scattiAlTetto,true);
  assert.equal(r.quote.find(q=>q.id==='scatti').mensilita,mensilita);
  assert.throws(()=>R.componiRal({ccnl,sezione,livello,scatti:massimo+1,alla}),RangeError);
  assert.throws(()=>R.componiRal({ccnl,sezione,livello,scatti:-1,alla}),RangeError);
  const senza=R.componiRal({ccnl,sezione,livello,alla});
  assert.equal(senza.numeroScatti,0);
  assert.equal(senza.anzianitaDichiarata,false);
  assert.throws(()=>R.componiRal({ccnl,sezione,livello,dataAnzianita:'2026-02-30',alla}),RangeError);
  const domani=new Date(Date.parse(alla+'T00:00:00Z')+86400000).toISOString().slice(0,10);
  assert.throws(()=>R.componiRal({ccnl,sezione,livello,dataAnzianita:domani,alla}),RangeError);
}

/* La RAL composta entra nel motore come qualsiasi altra: scenario
   standard, Milano, nessun familiare. */
function nettoRiconcilia(r){
  const risultato=applicaMensilita(calcola(String(r.ral),{comune:'F205',nucleo:[]}),r.mensilita);
  assert.ok(risultato.riconciliazione.verificata);
  assert.ok(risultato.kpi.nettoAnnuo>0);
  return risultato;
}

const voci=livello=>livello.voci.map(v=>[v.id,v.importo]);

module.exports={giornoPrima,provaDecorrenze,provaScattiFissi,nettoRiconcilia,voci};
