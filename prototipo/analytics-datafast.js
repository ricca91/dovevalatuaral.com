/* Analytics del percorso busta paga: solo Datafast, cookieless.
   Google Analytics 4 resta fuori da questa pagina per decisione di prodotto
   (RIC-64): chi carica un cedolino non deve trovarsi un tag pubblicitario
   accanto. È un file separato invece di un ramo dentro `analytics.js` perché
   così l'assenza di GA4 si vede dal <head>, e si può provare. */
(()=>{
  /* La coda che Datafast documenta: `window.datafast` esiste da subito e
     accumula, il suo script la svuota quando arriva. Senza, un evento scattato
     prima del caricamento andrebbe perso in silenzio — e su questa pagina i
     primi eventi scattano al primo clic. */
  window.datafast=window.datafast||function(){
    window.datafast.q=window.datafast.q||[];
    window.datafast.q.push(arguments);
  };

  const datafast=document.createElement('script');
  datafast.defer=true;
  datafast.setAttribute('data-website-id','dfid_BrwdP2Ei7Bb3tkIVhHiGs');
  datafast.setAttribute('data-domain','dovevalatuaral.com');
  datafast.src='https://datafa.st/js/script.js';
  document.head.appendChild(datafast);
})();
