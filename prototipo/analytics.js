/* Analytics delle pagine pubbliche: Google Analytics 4 e Datafast.
   Gli snippet ufficiali vanno in linea in ogni <head>; qui stanno in un file
   perché le pagine pubbliche sono ventiquattro e diciotto nascono da un
   template: una riga sola da tenere allineata invece di ventiquattro.
   L'iniezione dinamica è il metodo che Datafast documenta per Tag Manager. */
(()=>{
  const GA_ID='G-9Y1NYDHTEZ';
  window.dataLayer=window.dataLayer||[];
  window.gtag=function(){window.dataLayer.push(arguments)};
  gtag('js',new Date());
  gtag('config',GA_ID);
  const ga=document.createElement('script');
  ga.async=true;
  ga.src=`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(ga);

  const datafast=document.createElement('script');
  datafast.defer=true;
  datafast.setAttribute('data-website-id','dfid_BrwdP2Ei7Bb3tkIVhHiGs');
  datafast.setAttribute('data-domain','dovevalatuaral.com');
  datafast.src='https://datafa.st/js/script.js';
  document.head.appendChild(datafast);
})();
