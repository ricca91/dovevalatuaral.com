'use strict';
const crypto=require('node:crypto');
const Stripe=require('stripe');
const {creaArchivio}=require('./busta-paga-archivio');
const Motore=require('./busta-paga');
const T=require('./busta-paga-tetti');

const ORA=3600000,GIORNO=24*ORA;
const DURATE=Object.freeze({anteprima:2*GIORNO,report:30*GIORNO,transazione:90*GIORNO});
const CODICI=Object.freeze({ACCESSO_NON_VALIDO:401,SESSIONE_SCADUTA:410,
  OPERAZIONE_DIVERSA:409,ANALISI_IN_CORSO:202,ANALISI_INTERROTTA:409,
  REPORT_NON_UTILIZZABILE:422,PAGAMENTO_RICHIESTO:402,PAGAMENTO_IN_CORSO:409,
  CONFIGURAZIONE_MANCANTE:503,SERVIZIO_NON_DISPONIBILE:503,
  TESTO_NON_VALIDO:400,TESTO_TROPPO_LUNGO:413,TROPPE_RICHIESTE:429,
  BUDGET_SUPERATO:429,RISPOSTA_NON_CONFORME:502,NESSUNA_VOCE:422,
  PAGAMENTO_NON_VALIDO:409});
function errore(codice){throw Object.assign(new Error(codice),{codice});}
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
function idDaToken(token){
  if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))errore('ACCESSO_NON_VALIDO');
  return hash(token);
}
function cifra(report,chiave,id){
  const iv=crypto.randomBytes(12),c=crypto.createCipheriv('aes-256-gcm',chiave,iv);
  c.setAAD(Buffer.from(id));
  const corpo=Buffer.concat([c.update(JSON.stringify(report),'utf8'),c.final()]);
  return Buffer.concat([iv,c.getAuthTag(),corpo]).toString('base64');
}
function decifra(cifrato,chiave,id){
  const b=Buffer.from(cifrato,'base64'),c=crypto.createDecipheriv('aes-256-gcm',chiave,b.subarray(0,12));
  c.setAAD(Buffer.from(id));c.setAuthTag(b.subarray(12,28));
  return JSON.parse(Buffer.concat([c.update(b.subarray(28)),c.final()]).toString('utf8'));
}
function utilizzabile(report){
  const a=report?.analisi;
  return Boolean(a?.periodo?.sourceValue&&a?.conto&&a.conto.stato!=='non_calcolabile'
    &&['competenze','trattenute','netto'].every(k=>Number.isFinite(a.totali?.[k]?.numero))
    &&a.voci?.filter(v=>v.category!=='sconosciuta'&&v.confidence!=='bassa'&&v.plainExplanation).length>=2);
}
function anteprima(report){
  const a=report.analisi,v=a.voci.find(v=>v.category!=='sconosciuta'&&v.confidence!=='bassa');
  return{periodo:a.periodo,totali:Object.fromEntries(['competenze','trattenute','netto'].map(k=>[k,a.totali[k]])),
    estratto:{sourceLabel:v.sourceLabel,sourceAmount:v.sourceAmount,plainExplanation:v.plainExplanation,
      sourceReference:v.sourceReference},
    sezioni:['Riepilogo del cedolino','Le voci spiegate e le loro fonti','Percorso lordo/netto e riconciliazione','Dubbi e dati non individuati']};
}

function creaServizio({archivio,stripe,ambiente=process.env,adesso=Date.now,
  analizza=(corpo,runtime={})=>Motore.analizza(corpo,{
    ambiente:{...ambiente,...runtime},tetti:T.crea(ambiente)})}){
  const chiave=Buffer.from(ambiente.BUSTA_PAGA_CHIAVE_REPORT||'','hex');
  if(!/^[a-f0-9]{64}$/i.test(ambiente.BUSTA_PAGA_CHIAVE_REPORT||'')||chiave.length!==32)errore('CONFIGURAZIONE_MANCANTE');
  const origine=ambiente.BUSTA_PAGA_ORIGINE;
  if(!origine||new URL(origine).origin!==origine)errore('CONFIGURAZIONE_MANCANTE');
  const live=ambiente.BUSTA_PAGA_MODALITA==='live';
  if(live&&(ambiente.BUSTA_PAGA_LIVE_APPROVATO!=='1'||ambiente.VERCEL_ENV!=='production'))errore('CONFIGURAZIONE_MANCANTE');

  async function prezzo(){
    if(!ambiente.STRIPE_PRICE_ID)errore('CONFIGURAZIONE_MANCANTE');
    const p=await stripe.prices.retrieve(ambiente.STRIPE_PRICE_ID);
    if(!p.active||p.type!=='one_time'||p.livemode!==live||!Number.isSafeInteger(p.unit_amount)||p.unit_amount<=0
      ||p.currency!=='eur')errore('CONFIGURAZIONE_MANCANTE');
    return{id:p.id,importo:p.unit_amount,valuta:p.currency,test:!p.livemode};
  }
  function attivo(o){
    if(!o)errore('ACCESSO_NON_VALIDO');
    if(o.scadenza<=adesso()||o.stato==='cancellato'||o.stato==='scaduto')errore('SESSIONE_SCADUTA');
  }
  function vista(o,id){
    attivo(o);
    if(o.stato==='analisi'){
      if(adesso()-o.creatoIl>120000)errore('ANALISI_INTERROTTA');
      return{ok:true,stato:'analisi'};
    }
    if(o.stato==='errore')errore(o.codice);
    const report=decifra(o.cifrato,chiave,id);
    const base={ok:true,stato:o.pagatoIl?'pagato':'anteprima',scadenza:o.scadenza,prezzo:o.prezzo,
      ordine:o.riferimento,anteprima:anteprima(report)};
    if(o.pagatoIl)base.report=report;
    return base;
  }
  async function limita(chiaveLimite,massimo,durata,contatori=archivio){
    const finestra=Math.floor(adesso()/durata);
    const h=crypto.createHmac('sha256',chiave).update(`${finestra}:${chiaveLimite}`).digest('hex');
    if(!await contatori.consuma(h,massimo,(finestra+1)*durata))errore('TROPPE_RICHIESTE');
  }
  async function crea(token,testo,consenso,chiamante,runtime={}){
    const id=idDaToken(token);
    if(consenso!==true)errore('TESTO_NON_VALIDO');
    const verifica=T.verificaTesto(testo);
    if(!verifica.ok)errore(verifica.codice);
    if(ambiente.BUSTA_PAGA_ATTIVO==='0')errore('SERVIZIO_NON_DISPONIBILE');
    const impronta=crypto.createHmac('sha256',chiave).update(id).update(testo).digest('hex');
    const nuova=await archivio.transazione(id,async(o,salva,contatori)=>{
      if(o){attivo(o);if(o.impronta!==impronta)errore('OPERAZIONE_DIVERSA');return false;}
      await limita('analisi:'+chiamante,5,ORA,contatori);
      await limita('analisi:globale',Number(ambiente.BUSTA_PAGA_ANALISI_GIORNO)||100,GIORNO,contatori);
      const p=await prezzo(); // Mai spendere per analizzare se non possiamo offrire un acquisto.
      salva({stato:'analisi',impronta,riferimento:crypto.randomUUID(),creatoIl:adesso(),
        scadenza:adesso()+DURATE.anteprima,eliminaIl:adesso()+DURATE.transazione,
        prezzo:p,consensoVersione:'2026-09-21',tentativo:0});return true;
    });
    if(nuova){
      let report;
      try{report=await analizza({testo},runtime);}catch(_){report={ok:false,codice:'SERVIZIO_NON_DISPONIBILE'};}
      await archivio.transazione(id,async(o,salva,contatori)=>{
        if(!o||o.stato!=='analisi')return; // Una cancellazione durante l'analisi non rinasce.
        if(!report.ok||!utilizzabile(report)){
          o.stato='errore';o.codice=report.ok?'REPORT_NON_UTILIZZABILE':report.codice;
          if(!Object.hasOwn(CODICI,o.codice))o.codice='SERVIZIO_NON_DISPONIBILE';
        }else{o.stato='pronto';o.cifrato=cifra(report,chiave,id);}
        salva(o);
      });
    }
    return stato(token,false);
  }
  function verificaPagamento(s,o,id){
    return s.mode==='payment'&&s.payment_status==='paid'&&s.status==='complete'
      &&s.livemode===live&&s.amount_total===o.prezzo.importo&&s.currency===o.prezzo.valuta
      &&s.client_reference_id===o.riferimento&&s.metadata?.ordine===id&&s.id===o.checkout?.id;
  }
  function applicaPagamento(s,o,id){
    if(o.pagatoIl)return;
    if(s.payment_status==='paid'){
      if(!verificaPagamento(s,o,id))errore('PAGAMENTO_NON_VALIDO');
      o.pagatoIl=adesso();o.paymentIntent=typeof s.payment_intent==='string'?s.payment_intent:s.payment_intent?.id;
      // La transizione e il conteggio sono lo stesso aggiornamento transazionale.
      o.eventoPagamento='payslip_payment_succeeded';
      if(o.cifrato&&o.scadenza>adesso()&&o.stato!=='cancellato'&&o.stato!=='scaduto'){
        o.scadenza=adesso()+DURATE.report;o.stato='pronto';
      }else{delete o.cifrato;o.assistenza='pagamento_senza_report';}
      o.eliminaIl=adesso()+DURATE.transazione;
    }
  }
  async function stato(token,riconcilia=true){
    const id=idDaToken(token);
    return archivio.transazione(id,async(o,salva,contatori)=>{
      attivo(o);
      if(riconcilia&&o.checkout?.id&&!o.pagatoIl){
        await limita('stripe:'+id,30,60000,contatori);
        const s=await stripe.checkout.sessions.retrieve(o.checkout.id);
        applicaPagamento(s,o,id);salva(o);
      }
      return vista(o,id);
    });
  }
  async function checkout(token){
    const id=idDaToken(token);
    // Persistiamo i parametri PRIMA di chiamare Stripe: anche dopo un timeout o
    // crash l'idempotency key usa esattamente gli stessi parametri.
    await archivio.transazione(id,async(o,salva,contatori)=>{
      attivo(o);
      if(o.pagatoIl)return;
      if(o.stato!=='pronto'||!utilizzabile(decifra(o.cifrato,chiave,id)))errore('REPORT_NON_UTILIZZABILE');
      await limita('checkout:'+id,15,ORA,contatori);
      if(o.checkout?.id){
        const s=await stripe.checkout.sessions.retrieve(o.checkout.id);
        applicaPagamento(s,o,id);
        if(o.pagatoIl){salva(o);return;}
        if(s.status==='complete')errore('PAGAMENTO_IN_CORSO');
        if(s.status!=='expired')return;
        delete o.checkout;
      }
      if(o.checkout)return; // Tentativo ancora da riconciliare, stessa chiave.
      if(o.scadenza-adesso()<2*ORA)errore('SESSIONE_SCADUTA');
      o.tentativo++;
      o.checkout={chiave:`bp:${id}:${o.tentativo}`,creatoIl:adesso(),parametri:{
        mode:'payment',payment_method_types:['card'],line_items:[{price:o.prezzo.id,quantity:1}],
        client_reference_id:o.riferimento,metadata:{ordine:id},
        success_url:origine+'/busta-paga.html?ritorno=pagamento',
        cancel_url:origine+'/busta-paga.html?ritorno=annullato',
        expires_at:Math.floor(adesso()/1000)+3600,
      }};salva(o);
    });
    return archivio.transazione(id,async(o,salva,contatori)=>{
      attivo(o);if(o.pagatoIl)return vista(o,id);
      if(!o.checkout.id){
        // Stripe conserva le chiavi >=24 h. Non rischiare un nuovo addebito se
        // abbiamo perso una risposta e la chiave potrebbe essere stata rimossa.
        if(adesso()-o.checkout.creatoIl>23*ORA)errore('PAGAMENTO_IN_CORSO');
        const s=await stripe.checkout.sessions.create(o.checkout.parametri,{idempotencyKey:o.checkout.chiave});
        o.checkout.id=s.id;o.checkout.url=s.url;salva(o);
      }
      return{ok:true,url:o.checkout.url};
    });
  }
  async function webhook(event){
    const tipi=['checkout.session.completed','checkout.session.async_payment_succeeded',
      'checkout.session.async_payment_failed','checkout.session.expired'];
    if(!tipi.includes(event.type)||event.livemode!==live)return;
    const oggetto=event.data.object,id=oggetto.metadata?.ordine;
    if(!/^[a-f0-9]{64}$/.test(id||''))return;
    await archivio.transazione(id,async(o,salva,contatori)=>{
      if(!o)return;
      // Il webhook può precedere la risposta della creazione della sessione.
      if(!o.checkout?.id)errore('SERVIZIO_NON_DISPONIBILE'); // 5xx => Stripe ritenta.
      if(o.checkout.id!==oggetto.id)return;
      const s=await stripe.checkout.sessions.retrieve(o.checkout.id);
      applicaPagamento(s,o,id);salva(o); // Lo stato Stripe corrente prevale sull'ordine eventi.
    });
  }
  async function cancella(token){
    const id=idDaToken(token);
    return archivio.transazione(id,async(o,salva,contatori)=>{
      if(!o)errore('ACCESSO_NON_VALIDO');
      if(o.checkout?.id&&!o.pagatoIl){
        const s=await stripe.checkout.sessions.retrieve(o.checkout.id);
        applicaPagamento(s,o,id);
        if(s.status==='open')await stripe.checkout.sessions.expire(s.id);
        else if(s.status==='complete'&&s.payment_status!=='paid')errore('PAGAMENTO_IN_CORSO');
      }else if(o.checkout&&!o.checkout.id)errore('PAGAMENTO_IN_CORSO');
      delete o.cifrato;delete o.impronta;
      o.stato='cancellato';o.scadenza=adesso();salva(o);return{ok:true};
    });
  }
  return{crea,stato,checkout,webhook,cancella,limita,
    async configurazione(){if(ambiente.BUSTA_PAGA_ATTIVO==='0')errore('SERVIZIO_NON_DISPONIBILE');return{ok:true,disponibile:true,prezzo:await prezzo(),
      limiti:{pagine:3,byte:5*1024*1024,mensilita:1},durate:DURATE};},
    pulisci:()=>archivio.pulisci(adesso())};
}

let dipendenze;
function produzione(){
  if(dipendenze)return dipendenze;
  const e=process.env;
  if(!e.BUSTA_PAGA_DATABASE_URL||!e.STRIPE_SECRET_KEY||!e.STRIPE_WEBHOOK_SECRET)errore('CONFIGURAZIONE_MANCANTE');
  const stripe=new Stripe(e.STRIPE_SECRET_KEY,{maxNetworkRetries:1,timeout:8000});
  const archivio=creaArchivio(e.BUSTA_PAGA_DATABASE_URL);
  const servizio=creaServizio({archivio,stripe,ambiente:e});
  return dipendenze={stripe,servizio};
}
module.exports={creaServizio,produzione,idDaToken,cifra,decifra,utilizzabile,anteprima,CODICI,DURATE};
