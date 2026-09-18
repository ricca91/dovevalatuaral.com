/* ============================================================
   BUSTA PAGA — I TETTI.

   Un endpoint pubblico che chiama un modello è una bolletta
   aperta a chiunque. Qui stanno le tre cose che la chiudono:
   il tetto di caratteri, il tetto di frequenza per chiamante e
   il budget giornaliero con interruttore.

   Che cosa questo file NON è. Il contatore vive nella memoria
   dell'istanza, e su Vercel le istanze sono più d'una e muoiono:
   a freddo il conteggio riparte da zero. È un dosso, non un
   muro. Il muro è il budget configurato sul gateway
   (`vercel ai-gateway budgets set`), che vale per il team e non
   dipende da noi. Sono due cose diverse e vanno dette diverse:
   questo file serve a **rifiutare in modo pulito** prima di
   spendere, non a garantire che non si spenda.

   Sulla privacy: l'indirizzo IP non viene mai conservato. Si
   conserva un'impronta accorciata di `IP + sale`, dove il sale
   cambia ogni giorno; il giorno dopo la stessa persona ha
   un'impronta diversa e le vecchie non sono più collegabili a
   niente. È lo stesso principio del contatore cookieless di
   Datafast, ed è il motivo per cui non serve un consenso per
   contare le richieste.
   ============================================================ */
'use strict';

const {createHash,randomBytes}=require('node:crypto');
const C=require('./busta-paga-contratto.js');

const PREDEFINITI=Object.freeze({
  richiestePerChiamante:5,        // in una finestra
  finestraMinuti:60,
  analisiAlGiorno:200,            // budget nostro, prima di quello del gateway
  chiamantiInMemoria:5000,        // oltre questa soglia la mappa si svuota
});

const MINUTO=60*1000;

/* Il sale del giorno. Se non è configurato se ne genera uno a caso all'avvio:
   ruota a ogni istanza invece che a ogni giorno, il che è più stretto, non
   meno. Non è un segreto da proteggere, è un valore che deve cambiare. */
const SALE_DI_AVVIO=randomBytes(16).toString('hex');

const giornoDi=adesso=>new Date(adesso).toISOString().slice(0,10);

function impronta(chiamante,adesso,saleBase){
  const sale=`${saleBase}:${giornoDi(adesso)}`;
  return createHash('sha256').update(`${sale}:${chiamante||'ignoto'}`).digest('hex').slice(0,16);
}

/* Da dove arriva la richiesta, secondo il proxy di Vercel. Non esce mai da qui:
   viene passato a `impronta()` e dimenticato. */
function chiamanteDa(headers={}){
  const inoltrato=headers['x-forwarded-for']||headers['X-Forwarded-For'];
  if(typeof inoltrato==='string'&&inoltrato.trim())return inoltrato.split(',')[0].trim();
  const reale=headers['x-real-ip']||headers['X-Real-IP'];
  if(typeof reale==='string'&&reale.trim())return reale.trim();
  return'';
}

const intero=(valore,predefinito)=>{
  const numero=Number.parseInt(valore,10);
  return Number.isFinite(numero)&&numero>=0?numero:predefinito;
};

function configura(ambiente={}){
  return Object.freeze({
    attivo:ambiente.BUSTA_PAGA_ATTIVO!=='0',
    richiestePerChiamante:intero(ambiente.BUSTA_PAGA_RICHIESTE,PREDEFINITI.richiestePerChiamante),
    finestraMinuti:intero(ambiente.BUSTA_PAGA_FINESTRA_MINUTI,PREDEFINITI.finestraMinuti),
    analisiAlGiorno:intero(ambiente.BUSTA_PAGA_BUDGET_GIORNO,PREDEFINITI.analisiAlGiorno),
    sale:ambiente.BUSTA_PAGA_SALE||SALE_DI_AVVIO,
  });
}

/* Il tetto sul testo. Vive qui e non nel browser perché il browser non è un
   posto dove si mettono i limiti: è un posto dove si mettono i messaggi. */
function verificaTesto(testo){
  if(typeof testo!=='string')return{ok:false,codice:C.CODICI.TESTO_NON_VALIDO};
  const pulito=testo.trim();
  if(pulito.length<C.LIMITI.caratteriMinimi)return{ok:false,codice:C.CODICI.TESTO_NON_VALIDO};
  if(pulito.length>C.LIMITI.caratteriMassimi)return{ok:false,codice:C.CODICI.TESTO_TROPPO_LUNGO};
  return{ok:true,testo:pulito};
}

function crea(ambiente={}){
  const config=configura(ambiente);
  const finestre=new Map();      // impronta -> istanti delle richieste
  let giorno=null;
  let spese=0;

  /* Chiede il permesso di spendere una chiamata, e se lo concede la segna.
     Controlla e consuma insieme di proposito: due passaggi separati sarebbero
     due occasioni per passare due volte. */
  function consuma(chiamante,adesso=Date.now()){
    if(!config.attivo)return{ok:false,codice:C.CODICI.BUDGET_SUPERATO};

    const oggi=giornoDi(adesso);
    if(oggi!==giorno){giorno=oggi;spese=0;finestre.clear();}
    if(spese>=config.analisiAlGiorno)return{ok:false,codice:C.CODICI.BUDGET_SUPERATO};

    const chiave=impronta(chiamante,adesso,config.sale);
    const inizio=adesso-config.finestraMinuti*MINUTO;
    const recenti=(finestre.get(chiave)||[]).filter(istante=>istante>inizio);
    if(recenti.length>=config.richiestePerChiamante){
      finestre.set(chiave,recenti);
      return{ok:false,codice:C.CODICI.TROPPE_RICHIESTE};
    }

    recenti.push(adesso);
    finestre.set(chiave,recenti);
    spese+=1;
    /* Nessuna scadenza automatica: la mappa si pulisce quando serve, e se
       cresce troppo si butta via intera. Perdere il conteggio è meno grave
       che tenere in memoria centomila impronte. */
    if(finestre.size>PREDEFINITI.chiamantiInMemoria)potaOSvuota(inizio);
    return{ok:true,restanti:config.analisiAlGiorno-spese};
  }

  function potaOSvuota(inizio){
    for(const [chiave,istanti] of finestre){
      const vivi=istanti.filter(istante=>istante>inizio);
      if(vivi.length)finestre.set(chiave,vivi);else finestre.delete(chiave);
    }
    if(finestre.size>PREDEFINITI.chiamantiInMemoria)finestre.clear();
  }

  /* Una chiamata che non è mai partita non si paga: se il gateway rifiuta
     prima di generare, restituiamo il gettone al budget del giorno. */
  function restituisci(){if(spese>0)spese-=1;}

  const stato=()=>({attivo:config.attivo,giorno,spese,budget:config.analisiAlGiorno,
    chiamanti:finestre.size});

  return{config,consuma,restituisci,stato};
}

module.exports={PREDEFINITI,crea,configura,impronta,chiamanteDa,verificaTesto,giornoDi};
