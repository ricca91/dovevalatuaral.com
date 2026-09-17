/* ============================================================
   BUSTA PAGA — L'ENDPOINT DI ANALISI.

   Riceve **solo** il testo redatto che il browser ha mostrato
   alla persona, lo manda a un modello attraverso Vercel AI
   Gateway e restituisce un'analisi già passata dalle guardie.

   Che cosa questo file promette, e dove lo si verifica:

   - **Non salva niente.** Nessun database, nessun object
     storage, nessun file. Il testo esiste come variabile per la
     durata della richiesta.
   - **Non scrive niente nei log.** `registra()` scrive solo il
     codice di errore e lo stato HTTP del gateway. Mai il corpo,
     mai la risposta del modello, mai un header del chiamante.
   - **Non mette niente negli errori.** Al browser tornano
     codici, e la copy dei codici sta nel browser.
   - **Gira in regione europea.** `vercel.json` dichiara `fra1`
     per le funzioni; la richiesta al gateway chiede a sua volta
     inferenza in UE, retention zero e divieto di addestramento.
     Se il gateway non trova un fornitore che rispetti tutte e
     tre le condizioni, la richiesta **fallisce** invece di
     ripiegare su uno che non le rispetta. Fallire chiuso è la
     scelta: preferiamo non spiegare un cedolino piuttosto che
     spiegarlo altrove.

   Il limite dichiarato, che non va fatto sparire: nessuno ha
   verificato che il modello legga bene un cedolino vero prima
   degli utenti. È la conseguenza della decisione 3 di RIC-64.
   Le guardie di `busta-paga-contratto.js` non sostituiscono
   quella verifica: impediscono di mostrare numeri inventati,
   non garantiscono che i numeri veri siano capiti.
   ============================================================ */
'use strict';

const C=require('./busta-paga-contratto.js');
const P=require('./busta-paga-prompt.js');
const T=require('./busta-paga-tetti.js');

const GATEWAY='https://ai-gateway.vercel.sh/v1/chat/completions';
/* Scelto il 17 settembre 2026 fra i modelli che il catalogo del gateway dà
   `zdr: all` e `no_training: all` con inferenza disponibile in UE. Il nome sta
   anche in `privacy.html`: se cambia qui, cambia lì — una prova lo impone. */
const MODELLO='anthropic/claude-sonnet-5';
const REGIONE_INFERENZA='eu';
const GETTONI_MASSIMI=8000;
const ATTESA=55000;

/* Le tre condizioni di trattamento, in un posto solo. Sono requisito di
   prodotto (RIC-64), non configurazione: per questo non sono sovrascrivibili
   da variabile d'ambiente. */
const CONDIZIONI=Object.freeze({
  zeroDataRetention:true,
  disallowPromptTraining:true,
  inferenceRegion:Object.freeze({scope:'zone',geoRegion:REGIONE_INFERENZA}),
});

function credenziale(ambiente){
  return ambiente.AI_GATEWAY_API_KEY||ambiente.VERCEL_OIDC_TOKEN||'';
}

/* L'indirizzo del gateway si può spostare solo fuori produzione, e serve a una
   cosa sola: mettere un finto gateway davanti al percorso per provarlo in un
   browser senza spendere. In produzione la costante non è negoziabile, perché
   una variabile d'ambiente che reindirizza il payload è una variabile
   d'ambiente che può mandare un cedolino da un'altra parte.
   Il modello non è sovrascrivibile in nessun ambiente: è nominato
   nell'informativa come responsabile del trattamento, quindi cambia con un
   deploy e con una riga di privacy, non con una variabile. */
function indirizzo(ambiente={}){
  if(ambiente.VERCEL_ENV==='production')return GATEWAY;
  return ambiente.BUSTA_PAGA_GATEWAY||GATEWAY;
}

function corpoRichiesta(testo){
  return{
    model:MODELLO,
    messages:P.messaggi(testo),
    max_tokens:GETTONI_MASSIMI,
    stream:false,
    providerOptions:{gateway:{...CONDIZIONI}},
  };
}

/* Solo il codice e lo stato HTTP. Niente corpo, niente risposta, niente
   chiamante: un log che riporta il contenuto è un log che conserva un
   cedolino, e qui non ne conserviamo nessuno. */
function registra(codice,stato){
  const dettaglio=stato?` (http ${stato})`:'';
  console.error(`busta-paga: ${codice}${dettaglio}`);
}

/* La chiamata vera. È isolata perché nei test si sostituisce: nessuna prova
   automatica spende un centesimo né esce dalla macchina. */
async function chiamaGateway(testo,ambiente={},{attesa=ATTESA}={}){
  const chiave=credenziale(ambiente);
  if(!chiave)return{ok:false,codice:C.CODICI.SERVIZIO_NON_DISPONIBILE,speso:false};

  const stop=new AbortController();
  const scadenza=setTimeout(()=>stop.abort(),attesa);
  try{
    const risposta=await fetch(indirizzo(ambiente),{
      method:'POST',
      headers:{'Content-Type':'application/json',Authorization:`Bearer ${chiave}`},
      body:JSON.stringify(corpoRichiesta(testo)),
      signal:stop.signal,
    });
    if(!risposta.ok){
      registra('gateway',risposta.status);
      /* 429 dal gateway è il budget del team o il limite del fornitore: per
         chi carica un cedolino sono la stessa cosa, «riprova più tardi». */
      const codice=risposta.status===429?C.CODICI.BUDGET_SUPERATO:C.CODICI.SERVIZIO_NON_DISPONIBILE;
      return{ok:false,codice,speso:false};
    }
    const corpo=await risposta.json();
    const scelta=corpo&&Array.isArray(corpo.choices)?corpo.choices[0]:null;
    const contenuto=scelta&&scelta.message?scelta.message.content:null;
    if(typeof contenuto!=='string'||!contenuto.trim())
      return{ok:false,codice:C.CODICI.RISPOSTA_NON_CONFORME,speso:true};
    return{ok:true,contenuto};
  }catch(_){
    /* L'errore non si propaga e non si stampa: potrebbe portarsi dietro il
       corpo della richiesta, e il corpo della richiesta è un cedolino. */
    return{ok:false,codice:C.CODICI.SERVIZIO_NON_DISPONIBILE,speso:false};
  }finally{
    clearTimeout(scadenza);
  }
}

/* Il corpo della richiesta dal browser. Accetta solo `{testo}`: qualunque
   altra chiave viene ignorata, e un corpo che non sia un oggetto con una
   stringa è una richiesta non valida. */
function testoDaCorpo(corpo){
  let valore=corpo;
  if(typeof valore==='string'){
    try{valore=JSON.parse(valore);}catch(_){return null;}
  }
  if(!valore||typeof valore!=='object'||Array.isArray(valore))return null;
  return typeof valore.testo==='string'?valore.testo:null;
}

/* Il passaggio completo, senza HTTP intorno: serve ai test e tiene l'handler
   sottile. `chiama` è iniettabile; `tetti` è condiviso fra le richieste. */
async function analizza(corpo,{tetti,chiama=chiamaGateway,ambiente=process.env,
  chiamante='',adesso=Date.now()}={}){
  const testo=testoDaCorpo(corpo);
  const ammesso=T.verificaTesto(testo);
  if(!ammesso.ok)return{ok:false,codice:ammesso.codice};

  const gettone=tetti.consuma(chiamante,adesso);
  if(!gettone.ok)return{ok:false,codice:gettone.codice};

  const esito=await chiama(ammesso.testo,ambiente);
  if(!esito.ok){
    if(!esito.speso)tetti.restituisci();
    return{ok:false,codice:esito.codice};
  }

  const analisi=C.analizza(esito.contenuto,ammesso.testo);
  if(!analisi.ok){
    registra(analisi.codice);
    return{ok:false,codice:analisi.codice};
  }
  return{ok:true,analisi:analisi.analisi,
    motore:{modello:MODELLO,regione:REGIONE_INFERENZA,
      ritenzione:'zero',addestramento:'vietato'}};
}

/* Lo stato HTTP per ogni codice. Il corpo porta comunque il codice: il numero
   serve alle cache e ai proxy, la copy la sceglie il browser. */
const STATI=Object.freeze({
  [C.CODICI.TESTO_NON_VALIDO]:400,
  [C.CODICI.TESTO_TROPPO_LUNGO]:413,
  [C.CODICI.TROPPE_RICHIESTE]:429,
  [C.CODICI.BUDGET_SUPERATO]:429,
  [C.CODICI.RISPOSTA_NON_CONFORME]:502,
  [C.CODICI.NESSUNA_VOCE]:502,
  [C.CODICI.SERVIZIO_NON_DISPONIBILE]:503,
});

/* Un solo insieme di contatori per istanza: creare i tetti dentro l'handler
   li azzererebbe a ogni richiesta, che è come non averli. */
let tettiCondivisi=null;
const tettiDi=ambiente=>(tettiCondivisi||(tettiCondivisi=T.crea(ambiente)));

async function rispondi(req,res,opzioni={}){
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Robots-Tag','noindex');
  res.setHeader('Content-Type','application/json; charset=utf-8');

  if(req.method!=='POST'){
    res.setHeader('Allow','POST');
    res.statusCode=405;
    return res.end(JSON.stringify({ok:false,codice:C.CODICI.TESTO_NON_VALIDO}));
  }

  const ambiente=opzioni.ambiente||process.env;
  const esito=await analizza(req.body,{
    tetti:opzioni.tetti||tettiDi(ambiente),
    chiama:opzioni.chiama||chiamaGateway,
    ambiente,
    chiamante:T.chiamanteDa(req.headers||{}),
    adesso:opzioni.adesso||Date.now(),
  });

  res.statusCode=esito.ok?200:STATI[esito.codice]||500;
  return res.end(JSON.stringify(esito));
}

module.exports={GATEWAY,MODELLO,REGIONE_INFERENZA,CONDIZIONI,GETTONI_MASSIMI,STATI,
  indirizzo,corpoRichiesta,credenziale,testoDaCorpo,chiamaGateway,analizza,rispondi};
