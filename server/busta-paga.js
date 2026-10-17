/* Analisi con Anthropic API commerciale diretta. Il PDF resta nel browser.
   Non salviamo né registriamo il testo grezzo; il percorso acquisto conserva
   separatamente il report cifrato. Retention standard del provider, con le
   eccezioni documentate, senza promessa di ZDR o inferenza esclusivamente UE. */
'use strict';
const C=require('./busta-paga-contratto.js');
const P=require('./busta-paga-prompt.js');
const T=require('./busta-paga-tetti.js');
const ENDPOINT='https://api.anthropic.com/v1/messages';
const MODELLO='claude-sonnet-5';
const GETTONI_MASSIMI=8000;
const ATTESA=55000;
const credenziale=ambiente=>ambiente.ANTHROPIC_API_KEY||'';
function corpoRichiesta(testo){
  return{model:MODELLO,system:P.SISTEMA,
    messages:[{role:'user',content:P.utente(testo)}],
    max_tokens:GETTONI_MASSIMI,stream:false};
}
function registra(codice,stato){
  console.error(`busta-paga: ${codice}${stato?` (http ${stato})`:''}`);
}
async function chiamaAnthropic(testo,ambiente={},{attesa=ATTESA,preleva=fetch}={}){
  const chiave=credenziale(ambiente);
  if(!chiave)return{ok:false,codice:C.CODICI.SERVIZIO_NON_DISPONIBILE,speso:false};
  const stop=new AbortController();
  const scadenza=setTimeout(()=>stop.abort(),attesa);
  try{
    const risposta=await preleva(ENDPOINT,{
      method:'POST',redirect:'error',
      headers:{'Content-Type':'application/json','x-api-key':chiave,'anthropic-version':'2023-06-01'},
      body:JSON.stringify(corpoRichiesta(testo)),signal:stop.signal,
    });
    if(!risposta.ok){
      registra('anthropic',risposta.status);
      return{ok:false,codice:risposta.status===429?C.CODICI.BUDGET_SUPERATO:C.CODICI.SERVIZIO_NON_DISPONIBILE,speso:false};
    }
    const corpo=await risposta.json();
    const blocchi=Array.isArray(corpo.content)?corpo.content:[];
    const contenuto=blocchi.filter(b=>b.type==='text'&&typeof b.text==='string').map(b=>b.text).join('');
    if(corpo.stop_reason!=='end_turn'||!contenuto.trim())
      return{ok:false,codice:C.CODICI.RISPOSTA_NON_CONFORME,speso:true};
    const utilizzo={};
    for(const k of ['input_tokens','output_tokens'])
      if(Number.isSafeInteger(corpo.usage?.[k])&&corpo.usage[k]>=0)utilizzo[k]=corpo.usage[k];
    return{ok:true,contenuto,utilizzo};
  }catch(_){
    // Una richiesta interrotta può aver consumato token: non rimborsare il tetto.
    return{ok:false,codice:C.CODICI.SERVIZIO_NON_DISPONIBILE,speso:true};
  }finally{clearTimeout(scadenza);}
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
async function analizza(corpo,{tetti,chiama=chiamaAnthropic,
  ambiente=process.env,chiamante='',adesso=Date.now()}={}){
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
    motore:{modello:MODELLO,fornitore:'Anthropic',regione:null,
      ritenzione:'standard_30_giorni_con_eccezioni',addestramento:'vietato',
      utilizzo:esito.utilizzo||null}};
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
    chiama:opzioni.chiama||chiamaAnthropic,
    ambiente:ambiente,
    chiamante:T.chiamanteDa(req.headers||{}),
    adesso:opzioni.adesso||Date.now(),
  });

  res.statusCode=esito.ok?200:STATI[esito.codice]||500;
  return res.end(JSON.stringify(esito));
}

module.exports={ENDPOINT,MODELLO,GETTONI_MASSIMI,STATI,
  corpoRichiesta,credenziale,testoDaCorpo,chiamaAnthropic,analizza,rispondi};
