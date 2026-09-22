/* La landing legge la stessa configurazione del percorso: nessuna seconda
   richiesta, nessun prezzo locale e nessun accesso al contenuto del cedolino. */
(()=>{
  'use strict';
  window.BUSTA_PAGA_PERCORSO.configurazione.then(c=>{
    if(!c.ok)return;
    const prezzo=new Intl.NumberFormat('it-IT',{style:'currency',currency:c.prezzo.valuta}).format(c.prezzo.importo/100);
    const testo=c.prezzo.test?'Report completo · '+prezzo+' di test (nessun addebito reale)':'Report completo · '+prezzo;
    document.querySelectorAll('[data-bp-prezzo]').forEach(n=>{n.textContent=testo;});
  });
})();
