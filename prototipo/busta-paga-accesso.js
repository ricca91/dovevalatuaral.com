/* Deve eseguire nel head, prima di qualsiasi analytics. Solo il segreto di
   accesso viene conservato: né PDF, né testo, né anteprima, né report. */
(()=>{
  'use strict';
  const CHIAVE='bp-accesso-v1';
  let token=null,disponibile=true;
  const recupero=/^#recupero=([a-f0-9]{64})$/.exec(location.hash);
  const ritorno=new URLSearchParams(location.search).get('ritorno');
  // Rimuovere anche query arbitrarie prima che strumenti terzi leggano l'URL.
  if(location.search||location.hash.startsWith('#recupero='))
    history.replaceState(null,'',location.pathname+(recupero?'#bp-upload':location.hash.startsWith('#recupero=')?'':location.hash));
  try{
    token=recupero?recupero[1]:sessionStorage.getItem(CHIAVE);
    if(token&&!/^[a-f0-9]{64}$/.test(token))token=null;
    sessionStorage.setItem(CHIAVE,token||'');
  }catch(_){disponibile=false;}
  window.BUSTA_PAGA_ACCESSO={
    ritorno,disponibile,
    leggi:()=>token,
    crea(){
      if(!disponibile)throw new Error('MEMORIA_NON_DISPONIBILE');
      if(!token){
        token=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
        sessionStorage.setItem(CHIAVE,token);
      }
      return token;
    },
    dimentica(){token=null;try{sessionStorage.removeItem(CHIAVE);}catch(_){}},
    link:()=>token?location.origin+location.pathname+'#recupero='+token:'',
  };
})();
