/* ============================================================
   BUSTA PAGA — LA GARANZIA DI NON CONSERVAZIONE.

   RIC-64 pretende che il testo del cedolino vada solo a un
   fornitore che non lo conserva e non ci addestra sopra.

   Il modo diretto sarebbe chiedere `zeroDataRetention: true` a
   ogni richiesta: il gateway filtrerebbe i fornitori e
   rifiuterebbe se non ne trovasse uno conforme. Ma quella
   opzione Vercel la riserva ai piani Pro ed Enterprise, e questo
   progetto sta su Hobby.

   Qui sotto c'è l'altra strada, che non è un ripiego. Invece di
   chiedere al gateway di **escludere** i fornitori che
   conservano, verifichiamo che nella regione dove mandiamo il
   testo non ce ne sia **nessuno** da escludere. Se l'insieme dei
   fornitori raggiungibili è tutto conforme, non serve un filtro:
   non c'è niente da filtrare.

   La differenza pratica fra le due strade è dove sta la fiducia.
   Con il filtro ti fidi che il gateway lo applichi; qui ti fidi
   del catalogo pubblico di Vercel, che dichiara `has_zdr` e
   `has_no_training` per ogni coppia fornitore-modello — e lo
   leggi tu, prima di mandare, senza chiave e senza spendere.

   Questa verifica **blocca**. Se il catalogo non risponde, o
   dice che un fornitore raggiungibile conserva, il cedolino non
   parte. Fallire chiuso è l'unico modo per cui una promessa
   scritta nell'informativa resta vera anche quando qualcosa
   cambia sotto di noi.
   ============================================================ */
'use strict';

const CATALOGO='https://ai-gateway.vercel.sh/v1/models';
const ATTESA=8000;
/* Il catalogo cambia di rado e la risposta non dipende da chi chiama: una
   verifica per istanza basta. Si ricorda solo l'esito positivo — un fallimento
   di rete non deve restare appiccicato all'istanza per sempre. */
const RICORDATE=new Map();

function endpointsPerRegione(catalogo,regione){
  const dati=(catalogo&&catalogo.data)||catalogo||{};
  const elenco=Array.isArray(dati.endpoints)?dati.endpoints:null;
  if(!elenco)return null;
  return elenco.filter(endpoint=>
    Array.isArray(endpoint.inference_regions)
    &&endpoint.inference_regions.some(area=>area&&area.geo_region===regione));
}

/* L'esito è deliberatamente verboso: i nomi dei fornitori raggiungibili
   servono a poterli scrivere nell'informativa senza tirare a indovinare. */
function giudica(catalogo,regione){
  const raggiungibili=endpointsPerRegione(catalogo,regione);
  if(!raggiungibili)return{ok:false,motivo:'catalogo-illeggibile'};
  if(!raggiungibili.length)return{ok:false,motivo:'nessun-fornitore-in-regione'};
  const conservano=raggiungibili.filter(e=>!(e.has_zdr&&e.has_no_training));
  if(conservano.length)return{ok:false,motivo:'fornitore-che-conserva',
    fornitori:conservano.map(e=>e.provider_name)};
  return{ok:true,fornitori:raggiungibili.map(e=>e.provider_name)};
}

async function interroga(modello,{preleva=fetch,attesa=ATTESA}={}){
  const stop=new AbortController();
  const scadenza=setTimeout(()=>stop.abort(),attesa);
  try{
    /* Nessuna credenziale: il catalogo è pubblico, e va bene così — la
       verifica deve poter girare anche prima che una chiave esista. */
    const risposta=await preleva(`${CATALOGO}/${modello}/endpoints`,{signal:stop.signal});
    if(!risposta||!risposta.ok)return null;
    return await risposta.json();
  }catch(_){
    return null;
  }finally{
    clearTimeout(scadenza);
  }
}

async function verifica(modello,regione,opzioni={}){
  const catalogo=await interroga(modello,opzioni);
  if(!catalogo)return{ok:false,motivo:'catalogo-irraggiungibile'};
  return giudica(catalogo,regione);
}

/* Come `verifica()`, ma ricorda il sì. È questa che usa l'endpoint. */
async function garanzia(modello,regione,opzioni={}){
  const chiave=`${modello}|${regione}`;
  if(RICORDATE.has(chiave))return RICORDATE.get(chiave);
  const esito=await verifica(modello,regione,opzioni);
  if(esito.ok)RICORDATE.set(chiave,esito);
  return esito;
}

const dimentica=()=>RICORDATE.clear();

/* Eseguibile a mano, per guardare con i propri occhi prima di un rilascio:
   `node server/busta-paga-ritenzione.js`. */
if(require.main===module){
  const {MODELLO,REGIONE_INFERENZA}=require('./busta-paga.js');
  verifica(MODELLO,REGIONE_INFERENZA).then(esito=>{
    if(esito.ok){
      console.log(`OK — in regione "${REGIONE_INFERENZA}" ${MODELLO} è servito solo da:`);
      for(const fornitore of esito.fornitori)
        console.log(`   · ${fornitore} (non conserva, non addestra)`);
      console.log('Nessun fornitore raggiungibile conserva il prompt.');
      return;
    }
    console.error(`FERMO — ${esito.motivo}`);
    if(esito.fornitori)console.error('   fornitori non conformi:',esito.fornitori.join(', '));
    console.error('Finché è così, l’endpoint rifiuta di mandare il cedolino.');
    process.exitCode=1;
  });
}

module.exports={CATALOGO,ATTESA,endpointsPerRegione,giudica,verifica,garanzia,dimentica};
