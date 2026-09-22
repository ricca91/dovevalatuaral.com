const {test}=require('node:test');
const assert=require('node:assert/strict');
const Stripe=require('stripe');
const {Readable}=require('node:stream');
const {scenario,TESTO,REPORT}=require('../processo/verifiche/ric-72/supporto.cjs');
const {creaServizio,idDaToken,DURATE,utilizzabile}=require('./busta-paga-acquisto');
const H=require('./busta-paga-http');
const rifiuta=(p,codice)=>assert.rejects(p,e=>e.codice===codice);
function res(){return{headers:{},setHeader(k,v){this.headers[k]=v;},end(s){this.body=s?JSON.parse(s):null;}};}

test('report completo mai consegnato prima del pagamento, archivio cifrato e nessun testo grezzo',async()=>{
  const s=scenario(),a=await s.crea();
  assert.equal(a.stato,'anteprima');assert.equal(a.report,undefined);
  assert.equal(a.anteprima.estratto.sourceLabel,'Retribuzione ordinaria');
  assert.ok(!JSON.stringify(a).includes('Spiegazione sintetica di IRPEF'));
  const salvato=JSON.stringify([...s.archivio.righe.values()]);
  for(const dato of [TESTO,'Spiegazione sintetica','1700,00',s.token])assert.ok(!salvato.includes(dato));
  assert.equal((await s.servizio.stato(s.token)).report,undefined);
});
test('consenso e soglia minima impediscono di analizzare o comprare un risultato inutile',async()=>{
  const s=scenario();await rifiuta(s.servizio.crea(s.token,TESTO,false,'ip'),'TESTO_NON_VALIDO');
  assert.equal(s.chiamate,0);
  const incompleto=structuredClone(REPORT);incompleto.analisi.totali.netto=null;
  const t=scenario({analizza:async()=>incompleto});
  await rifiuta(t.crea(),'REPORT_NON_UTILIZZABILE');
  await rifiuta(t.servizio.checkout(t.token),'REPORT_NON_UTILIZZABILE');assert.equal(t.creazioni,0);
  assert.equal(utilizzabile(null),false);
});
test('doppio invio e retry, anche da un’altra istanza, invocano il motore una sola volta',async()=>{
  let termina;const pronto=new Promise(r=>termina=r);
  const s=scenario({analizza:async()=>{await pronto;return REPORT;}});
  const prima=s.crea();await new Promise(r=>setTimeout(r,10));
  assert.equal((await s.crea()).stato,'analisi');termina();await prima;
  const altra=creaServizio({archivio:s.archivio,stripe:s.stripe,ambiente:s.ambiente,analizza:()=>{throw Error('non deve chiamare');}});
  assert.equal((await altra.crea(s.token,TESTO,true,'ip')).stato,'anteprima');assert.equal(s.chiamate,1);
  await rifiuta(s.servizio.crea(s.token,TESTO+' modifica',true,'ip'),'OPERAZIONE_DIVERSA');
});
test('sessione interrotta non richiama il motore automaticamente',async()=>{
  const s=scenario();await s.crea();const o=s.archivio.righe.get(idDaToken(s.token));o.stato='analisi';
  s.avanza(130000);await rifiuta(s.crea(),'ANALISI_INTERROTTA');assert.equal(s.chiamate,1);
});
test('chiavi diverse e ID ordine non danno accesso incrociato',async()=>{
  const s=scenario(),a=await s.crea();
  for(const token of ['ff'.repeat(32),idDaToken(s.token),a.ordine])
    await rifiuta(s.servizio.stato(token),'ACCESSO_NON_VALIDO');
  await rifiuta(s.servizio.checkout('ff'.repeat(32)),'ACCESSO_NON_VALIDO');
  await rifiuta(s.servizio.cancella('ff'.repeat(32)),'ACCESSO_NON_VALIDO');
});
test('checkout concorrenti e annullamento riusano una sessione; prezzo e metadati sono server-side',async()=>{
  const s=scenario();await s.crea();
  const [a,b]=await Promise.all([s.servizio.checkout(s.token),s.servizio.checkout(s.token)]);
  assert.equal(a.url,b.url);assert.equal(s.creazioni,1);
  assert.equal((await s.servizio.stato(s.token)).stato,'anteprima');
  assert.equal((await s.servizio.checkout(s.token)).url,a.url);
  const o=s.archivio.righe.get(idDaToken(s.token));
  assert.deepEqual(o.checkout.parametri.line_items,[{price:'price_test',quantity:1}]);
  assert.deepEqual(Object.keys(o.checkout.parametri.metadata),['ordine']);
  assert.ok(!JSON.stringify(o.checkout).includes(s.token));
});
test('risposta Stripe persa: stessi parametri e idempotency key, una sola sessione',async()=>{
  const s=scenario();await s.crea();const create=s.stripe.checkout.sessions.create;
  let primo=true;s.stripe.checkout.sessions.create=async(...a)=>{const v=await create(...a);if(primo){primo=false;throw Error('rete');}return v;};
  await assert.rejects(s.servizio.checkout(s.token));await s.servizio.checkout(s.token);assert.equal(s.creazioni,1);
});
test('sessione scaduta viene sostituita solo dopo conferma Stripe; sessione completata mai',async()=>{
  const s=scenario();await s.crea();await s.servizio.checkout(s.token);
  [...s.sessioni.values()][0].status='expired';await s.servizio.checkout(s.token);assert.equal(s.creazioni,2);
  [...s.sessioni.values()].at(-1).status='complete';
  await rifiuta(s.servizio.checkout(s.token),'PAGAMENTO_IN_CORSO');assert.equal(s.creazioni,2);
});
test('redirect prima del webhook riconcilia il pagamento; duplicati non ricontano né estendono la scadenza',async()=>{
  const s=scenario();await s.crea();await s.servizio.checkout(s.token);const paid=s.paga();
  const a=await s.servizio.stato(s.token);assert.equal(a.stato,'pagato');assert.equal(a.report.analisi.voci.length,4);
  const scadenza=a.scadenza;s.avanza(10000);
  for(const type of ['checkout.session.completed','checkout.session.expired','checkout.session.completed'])
    await s.servizio.webhook({type,livemode:false,data:{object:paid}});
  const b=await s.servizio.stato(s.token);assert.equal(b.scadenza,scadenza);
  assert.equal([...s.archivio.righe.values()].filter(o=>o.eventoPagamento==='payslip_payment_succeeded').length,1);
  assert.equal((await s.servizio.checkout(s.token)).stato,'pagato');assert.equal(s.creazioni,1);
});
test('importo, valuta, modalità e ordine inattesi non sbloccano il report',async()=>{
  for(const modifica of [{amount_total:1},{currency:'usd'},{livemode:true},{client_reference_id:'altro'},{mode:'subscription'},{metadata:{ordine:'altro'}}]){
    const s=scenario();await s.crea();await s.servizio.checkout(s.token);Object.assign(s.paga(),modifica);
    await rifiuta(s.servizio.stato(s.token),'PAGAMENTO_NON_VALIDO');
    assert.equal(s.archivio.righe.get(idDaToken(s.token)).pagatoIl,undefined);
  }
});
test('cancellazione revoca il link ed elimina il contenuto, un webhook tardivo non lo ricrea',async()=>{
  const s=scenario();await s.crea();await s.servizio.checkout(s.token);const paid=s.paga();
  await s.servizio.cancella(s.token);
  await s.servizio.webhook({type:'checkout.session.completed',livemode:false,data:{object:paid}});
  await rifiuta(s.servizio.stato(s.token),'SESSIONE_SCADUTA');
  assert.equal(s.archivio.righe.get(idDaToken(s.token)).cifrato,undefined);
});
test('scadenze e pulizia: contenuto prima, riferimenti transazionali dopo',async()=>{
  const s=scenario();await s.crea();s.avanza(DURATE.anteprima+1);
  await rifiuta(s.servizio.stato(s.token),'SESSIONE_SCADUTA');await s.servizio.pulisci();
  assert.equal(s.archivio.righe.get(idDaToken(s.token)).cifrato,undefined);
  s.avanza(DURATE.transazione);await s.servizio.pulisci();assert.equal(s.archivio.righe.size,0);
});
test('limite condiviso per chiamante, senza IP nei dati persistiti',async()=>{
  const s=scenario();for(let i=0;i<5;i++)await s.servizio.crea(i.toString().padStart(64,'a'),TESTO,true,'ip-privato');
  await rifiuta(s.servizio.crea('bb'.repeat(32),TESTO,true,'ip-privato'),'TROPPE_RICHIESTE');
  assert.ok(!JSON.stringify([...s.archivio.contatori]).includes('ip-privato'));assert.equal(s.chiamate,5);
});
test('endpoint legacy non restituisce l’analisi e le risposte non sono memorizzabili',async()=>{
  const s=scenario(),r=res();await H.rispondi({url:'/api/busta-paga',method:'POST',headers:{},body:{testo:TESTO}},r,{servizio:s.servizio});
  assert.equal(r.statusCode,401);assert.equal(s.chiamate,0);assert.match(r.headers['Cache-Control'],/no-store/);
  const r2=res();await H.rispondi({url:'/api/busta-paga',method:'POST',headers:{authorization:'Bearer '+s.token},body:{testo:TESTO}},r2,{servizio:s.servizio});
  assert.equal(r2.statusCode,400);assert.equal(s.chiamate,0);
});
test('webhook: firma valida su bytes originali, rifiuto firma alterata e retry dopo errore DB',async()=>{
  const stripe=new Stripe('sk_test_fake'),secret='whsec_prova';let ricevuti=0;
  const payload=JSON.stringify({type:'checkout.session.completed',data:{object:{}}});
  const firma=stripe.webhooks.generateTestHeaderString({payload,secret});
  for(const valida of [true,false]){
    const req=Readable.from([Buffer.from(payload+(valida?'':' '))]);req.method='POST';req.headers={'stripe-signature':firma};
    const r=res();await H.webhook(req,r,{stripe,webhookSecret:secret,servizio:{webhook:async()=>{ricevuti++;}}});
    assert.equal(r.statusCode,valida?200:400);
  }
  assert.equal(ricevuti,1);
  const req=Readable.from([Buffer.from(payload)]);req.method='POST';req.headers={'stripe-signature':firma};
  const r=res();await H.webhook(req,r,{stripe,webhookSecret:secret,servizio:{webhook:async()=>{throw Error('db');}}});assert.equal(r.statusCode,503);
});
test('live bloccato senza approvazione esplicita o con Price di un altro ambiente',async()=>{
  assert.throws(()=>scenario({ambiente:{BUSTA_PAGA_MODALITA:'live'}}),e=>e.codice==='CONFIGURAZIONE_MANCANTE');
  const s=scenario();s.stripe.prices.retrieve=async()=>({active:true,type:'one_time',livemode:true,unit_amount:100,currency:'eur'});
  await rifiuta(s.crea(),'CONFIGURAZIONE_MANCANTE');assert.equal(s.chiamate,0);
});
