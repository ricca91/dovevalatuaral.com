/* Analytics delle pagine pubbliche: Datafast; GA4 sospeso in assenza di consenso.
   Gli snippet ufficiali vanno in linea in ogni <head>; qui stanno in un file
   perché le pagine pubbliche sono ventiquattro e diciotto nascono da un
   template: una riga sola da tenere allineata invece di ventiquattro.
   L'iniezione dinamica è il metodo che Datafast documenta per Tag Manager. */
(()=>{
  // GA4 disabilitato: il sito non raccoglie ancora il consenso ai cookie.

  const datafast=document.createElement('script');
  datafast.defer=true;
  datafast.setAttribute('data-website-id','dfid_BrwdP2Ei7Bb3tkIVhHiGs');
  datafast.setAttribute('data-domain','dovevalatuaral.com');
  datafast.src='https://datafa.st/js/script.js';
  document.head.appendChild(datafast);
})();
