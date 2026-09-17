/* ============================================================
   BUSTA PAGA — LA MISURAZIONE.

   Solo Datafast, cookieless, mai Google Analytics 4: su questa
   pagina GA4 non viene nemmeno caricato, e una prova lo verifica
   sul sorgente della pagina.

   Il file esiste per una ragione sola: rendere **impossibile**
   spedire un dato del cedolino dentro un evento. Non lo chiede
   la buona volontà di chi scrive il controller, lo impone questa
   funzione — nome dell'evento e nomi delle proprietà sono due
   elenchi chiusi, e tutto quello che non è nell'elenco viene
   buttato prima di uscire.

   Nessun nome di file, nessun testo, nessun importo, nessuna
   voce, nessun identificatore: i valori ammessi sono booleani,
   codici di errore e fasce.
   ============================================================ */
(()=>{
  'use strict';

  /* Gli eventi ammessi, e per ciascuno le proprietà ammesse. È l'elenco del
     ticket padre: aggiungerne uno vuol dire toccare questo file, che è il
     punto — nessun evento nuovo parte per distrazione. */
  const EVENTI=Object.freeze({
    payslip_view:[],
    payslip_upload_selected:['file_type','page_bucket'],
    payslip_extraction:['success','error_code'],
    payslip_redaction_confirmed:[],
    payslip_analysis:['success','error_code'],
    payslip_guards:['dropped_bucket'],
    payslip_feedback:['useful'],
  });

  /* I valori ammessi per ogni proprietà. Un codice di errore è un codice
     nostro, non un messaggio; una fascia è una fascia, non un conteggio. */
  const VALORE=/^[a-z0-9_-]{1,32}$/;

  function pulisci(nome,proprieta){
    const ammesse=EVENTI[nome];
    const fuori={};
    for(const chiave of ammesse){
      const grezzo=proprieta&&proprieta[chiave];
      if(grezzo===undefined||grezzo===null)continue;
      const valore=typeof grezzo==='boolean'?String(grezzo):String(grezzo).toLowerCase();
      if(VALORE.test(valore))fuori[chiave]=valore;
    }
    return fuori;
  }

  function evento(nome,proprieta){
    if(!Object.prototype.hasOwnProperty.call(EVENTI,nome))return null;
    const pulite=pulisci(nome,proprieta);
    try{
      if(typeof window.datafast==='function')window.datafast(nome,pulite);
    }catch(_){/* la misurazione non deve mai rompere la pagina */}
    return pulite;
  }

  /* La fascia di pagine: quante pagine aveva il PDF, senza dire quante. */
  const fasciaPagine=pagine=>pagine<=1?'1':(pagine<=2?'2':'3');

  window.BUSTA_PAGA_MISURA={EVENTI,evento,pulisci,fasciaPagine};
})();
