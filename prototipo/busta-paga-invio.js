/* Confine di rete: invia esclusivamente il testo approvato e metadati di
   protocollo. Il lettore PDF non ha accesso a queste operazioni. */
(()=>{
  'use strict';
  const ENDPOINT='/api/busta-paga',ATTESA=70000;
  const A=window.BUSTA_PAGA_ACCESSO;
  async function richiesta(azione,method='GET',dati){
    const stop=new AbortController(),timer=setTimeout(()=>stop.abort(),ATTESA);
    try{
      const headers={'Content-Type':'application/json'};
      if(azione!=='configurazione'){
        const token=A.leggi();
        if(!token)return{ok:false,codice:'ACCESSO_NON_VALIDO'};
        headers.Authorization='Bearer '+token;
      }
      const r=await fetch(ENDPOINT+'?azione='+azione,{method,headers,
        body:dati?JSON.stringify(dati):undefined,signal:stop.signal,
        cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'});
      const b=await r.json();
      return b&&typeof b.ok==='boolean'?b:{ok:false,codice:'SERVIZIO_NON_DISPONIBILE'};
    }catch(_){return{ok:false,codice:'SERVIZIO_NON_DISPONIBILE'};}
    finally{clearTimeout(timer);}
  }
  async function analizza(testo){
    if(typeof testo!=='string'||!testo.trim())return{ok:false,codice:'TESTO_NON_VALIDO'};
    try{A.crea();}catch(_){return{ok:false,codice:'MEMORIA_NON_DISPONIBILE'};}
    return richiesta('analizza','POST',{testo,consenso:true});
  }
  window.BUSTA_PAGA_INVIO={ENDPOINT,ATTESA,analizza,
    configurazione:()=>richiesta('configurazione'),stato:()=>richiesta('stato'),
    checkout:()=>richiesta('checkout','POST'),cancella:()=>richiesta('cancella','DELETE')};
})();
