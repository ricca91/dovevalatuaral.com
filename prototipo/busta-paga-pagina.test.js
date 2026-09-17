const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const {resolve}=require('node:path');
const E=require('./busta-paga-estrazione.js');

const leggi=nome=>readFileSync(resolve(__dirname,nome),'utf8');
/* I divieti si controllano sul codice, non sui commenti: questo file parla di
   `localStorage` proprio per dire che non lo usa. */
const senzaCommenti=sorgente=>sorgente
  .replace(/\/\*[\s\S]*?\*\//g,'')
  .split('\n').filter(riga=>!riga.trim().startsWith('//')).join('\n');
const pagina=leggi('busta-paga.html');
/* I file che compongono il percorso. Qualunque cosa esca da qui esce da uno di questi. */
const FILE_PERCORSO=['busta-paga-estrazione.js','busta-paga-redazione.js',
  'busta-paga-ui.js','busta-paga-pdf.js','analytics-datafast.js'];

test('Google Analytics 4 non viene caricato, Datafast sì',()=>{
  assert.doesNotMatch(pagina,/<script[^>]+src="analytics\.js"/);
  assert.match(pagina,/<script src="analytics-datafast\.js" async><\/script>/);
  assert.doesNotMatch(pagina,/googletagmanager|gtag\(|dataLayer|G-[A-Z0-9]{8,}/);
  const datafast=leggi('analytics-datafast.js');
  assert.doesNotMatch(datafast,/googletagmanager|gtag|dataLayer/);
  assert.match(datafast,/datafa\.st/);
});

test('nessuna chiamata di rete e nessuna memoria persistente nel percorso',()=>{
  const vietati=[/\bfetch\s*\(/,/XMLHttpRequest/,/sendBeacon/,/WebSocket/,/EventSource/,
    /localStorage/,/sessionStorage/,/indexedDB/,/document\.cookie/,/navigator\.clipboard/];
  for(const nome of FILE_PERCORSO){
    const sorgente=senzaCommenti(leggi(nome));
    for(const vietato of vietati)
      assert.doesNotMatch(sorgente,vietato,`${nome} non deve contenere ${vietato}`);
  }
  // Datafast è l'unica richiesta di terze parti della pagina, e non trasporta documenti.
  const esterni=[...pagina.matchAll(/(?:src|href|action)="(https?:\/\/[^"]+)"/g)].map(m=>m[1]);
  assert.deepEqual(esterni,[]);
  assert.doesNotMatch(pagina,/<form[^>]+action=/);
});

test('la libreria di lettura è locale, non su una CDN',()=>{
  const lettore=leggi('busta-paga-pdf.js');
  assert.match(lettore,/from '\.\/vendor\/pdfjs\/pdf\.min\.mjs'/);
  assert.match(lettore,/vendor\/pdfjs\/pdf\.worker\.min\.mjs/);
  assert.doesNotMatch(lettore,/https?:\/\//);
  for(const file of ['vendor/pdfjs/pdf.min.mjs','vendor/pdfjs/pdf.worker.min.mjs','vendor/pdfjs/LICENSE'])
    assert.ok(existsSync(resolve(__dirname,file)),file);
});

test('la pagina carica il percorso completo, nell’ordine che serve',()=>{
  const script=[...pagina.matchAll(/<script[^>]*src="([^"]+)"/g)].map(m=>m[1]);
  assert.deepEqual(script,['analytics-datafast.js','busta-paga-estrazione.js',
    'busta-paga-redazione.js','site-nav.js','busta-paga-ui.js','busta-paga-pdf.js']);
  assert.match(pagina,/<script type="module" src="busta-paga-pdf\.js"><\/script>/);
});

test('il consenso è esplicito, obbligatorio e nomina i dati particolari',()=>{
  assert.match(pagina,/<input type="checkbox" id="bp-consenso" required>/);
  const blocco=pagina.match(/<label class="check" for="bp-consenso">([\s\S]*?)<\/label>/);
  assert.ok(blocco,'la spunta di consenso deve esserci');
  assert.match(blocco[1],/art\. 9/i);
  assert.match(blocco[1],/sindacal/i);
  assert.match(blocco[1],/salute/i);
});

test('in questa versione il pulsante di invio nasce disattivato',()=>{
  assert.match(pagina,/<button class="btn btn--primary" type="submit" id="bp-invia" disabled>/);
  assert.match(leggi('busta-paga-ui.js'),/const INVIO_ATTIVO=false;/);
});

test('la pagina rimanda all’informativa e dichiara i limiti che il codice applica',()=>{
  assert.match(pagina,/href="privacy\.html"/);
  assert.ok(pagina.includes(`${E.LIMITI.pagineMassime} pagine`),'il tetto di pagine dichiarato è quello del codice');
  assert.ok(pagina.includes(`${E.LIMITI.byteMassimi/1024/1024} MB`),'il tetto di dimensione dichiarato è quello del codice');
  assert.match(pagina,/accept="application\/pdf,\.pdf"/);
});

test('l’informativa copre i punti che il ticket chiede',()=>{
  const privacy=leggi('privacy.html');
  for(const atteso of [/titolare del trattamento/i,/Datafast/,/Google Analytics/,
    /responsabile del trattamento/i,/regione europea/i,/art\. 9/i,/consenso esplicito/i,
    /Garante/,/localStorage/,/pseudonimizzat/i])
    assert.match(privacy,atteso,String(atteso));
});
