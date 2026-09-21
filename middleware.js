/* Bot traffic di Datafast: chi passa di qui senza eseguire JavaScript.
   Lo snippet in prototipo/analytics.js vede solo i browser; ChatGPT, Claude,
   Googlebot e gli altri chiedono l'HTML grezzo e se ne vanno, quindi vanno
   contati lato server. Le pagine sono file statici serviti dalla CDN: l'unico
   punto in cui passa ogni richiesta, prima della cache, è questo middleware.
   È il metodo che Datafast documenta per Vercel.

   La chiamata non si aspetta: trackAICrawlerRequest riceve il contesto della
   richiesta e usa waitUntil, così la risposta parte subito e l'evento viene
   spedito dopo. Se Datafast è giù, la pagina esce lo stesso. */
import {trackAICrawlerRequest} from '@datafast/ai-crawl';
import {next} from '@vercel/functions';

const ID_SITO='dfid_BrwdP2Ei7Bb3tkIVhHiGs';

export default function middleware(request,context){
  trackAICrawlerRequest(request,context,{
    websiteId:ID_SITO,
    /* Il token è opzionale e oggi non è impostato: serve solo se un giorno
       accendiamo "Reject unauthenticated requests" nella card Bot traffic.
       Vive in una variabile d'ambiente, mai nel repo. */
    authToken:process.env.DATAFAST_BOT_TOKEN,
  });
  return next();
}

export const config={
  runtime:'nodejs',
  /* Ogni richiesta che arriva qui è un'invocazione pagata, quindi gli asset
     restano fuori. Restano dentro le pagine .html, i percorsi senza estensione
     e i file che i crawler leggono per primi: robots.txt e sitemap.xml. */
  matcher:['/((?!_vercel/|.*\\.(?:js|mjs|css|png|jpg|jpeg|webp|svg|ico|json|map|woff2?)$).*)'],
};
