/* ============================================================
   BUSTA PAGA — L'INVIO.

   L'unico file di tutto il percorso che tocca la rete, e l'unico
   in cui la parola `fetch` è ammessa. Tutti gli altri file del
   percorso hanno il divieto, e una prova lo verifica riga per
   riga: così «il PDF non lascia il browser» non è una promessa,
   è una proprietà che si legge dal codice.

   Che cosa parte, esattamente: una stringa, dentro
   `{"testo": ...}`. Non il `File`, non il suo buffer, non il suo
   nome — il nome di un cedolino contiene quasi sempre il cognome
   di chi lo ha ricevuto, e per questo in questo file la parola
   `files` non compare proprio.

   La stringa è quella che `BUSTA_PAGA_REDAZIONE.applica()` ha
   prodotto: la stessa che la persona ha appena letto nel
   riquadro, carattere per carattere. Non viene ricostruita qui.
   ============================================================ */
(()=>{
  'use strict';
  const ENDPOINT='/api/busta-paga';
  /* Più lunga della finestra della funzione (60 secondi): se scade prima il
     server, vogliamo il suo codice di errore, non il nostro. */
  const ATTESA=70000;

  async function analizza(testo){
    if(typeof testo!=='string'||!testo.trim())return{ok:false,codice:'TESTO_NON_VALIDO'};

    const stop=new AbortController();
    const scadenza=setTimeout(()=>stop.abort(),ATTESA);
    try{
      const risposta=await fetch(ENDPOINT,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({testo}),
        signal:stop.signal,
        cache:'no-store',
        credentials:'omit',        // nessun cookie, in nessuna direzione
        referrerPolicy:'no-referrer',
      });
      const corpo=await risposta.json().catch(()=>null);
      /* Il codice lo decide il server, che sa perché ha rifiutato. Qui si
         inventa un codice solo quando il corpo non è leggibile. */
      if(corpo&&typeof corpo==='object'&&typeof corpo.codice==='string')return corpo;
      if(corpo&&corpo.ok===true)return corpo;
      return{ok:false,codice:risposta.status===429?'TROPPE_RICHIESTE':'SERVIZIO_NON_DISPONIBILE'};
    }catch(_){
      return{ok:false,codice:'SERVIZIO_NON_DISPONIBILE'};
    }finally{
      clearTimeout(scadenza);
    }
  }

  window.BUSTA_PAGA_INVIO={ENDPOINT,ATTESA,analizza};
})();
