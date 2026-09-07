/* Google Analytics 4.
   Lo snippet ufficiale di Google va in linea in ogni <head>; qui sta in un file
   perché le pagine pubbliche sono ventiquattro e diciotto nascono da un
   template: una riga sola da tenere allineata invece di ventiquattro. */
(()=>{
  const ID='G-9Y1NYDHTEZ';
  window.dataLayer=window.dataLayer||[];
  window.gtag=function(){window.dataLayer.push(arguments)};
  gtag('js',new Date());
  gtag('config',ID);
  const tag=document.createElement('script');
  tag.async=true;
  tag.src=`https://www.googletagmanager.com/gtag/js?id=${ID}`;
  document.head.appendChild(tag);
})();
