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
/* I file che compongono il percorso. Qualunque cosa esca da qui esce da uno di
   questi — e da uno solo: `busta-paga-invio.js` è l'unico a cui la rete è
   concessa, e sta apposta fuori da questo elenco. Il valore della prova qui
   sotto è che l'assenza di rete è dimostrata file per file, non promessa. */
const FILE_PERCORSO=['busta-paga-estrazione.js','busta-paga-redazione.js',
  'busta-paga-ui.js','busta-paga-pdf.js','analytics-datafast.js',
  'busta-paga-misura.js','busta-paga-risultato.js','busta-paga-percorso.js','busta-paga-landing.js'];
const FILE_CHE_ESCE='busta-paga-invio.js';

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
  // Il canonical è metadato: non effettua una richiesta e non riceve il PDF.
  const esterni=[...pagina.replace(/<link rel="canonical"[^>]+>/g,'').matchAll(/(?:src|href|action)="(https?:\/\/[^"]+)"/g)].map(m=>m[1]);
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
  assert.deepEqual(script,['busta-paga-accesso.js','analytics-datafast.js','busta-paga-estrazione.js',
    'busta-paga-redazione.js','busta-paga-misura.js','busta-paga-invio.js',
    'busta-paga-risultato.js','site-nav.js','busta-paga-percorso.js','busta-paga-ui.js','busta-paga-landing.js','busta-paga-pdf.js']);
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

test('l’invio è attivo, ma il pulsante nasce disattivato e lo sblocca solo il consenso',()=>{
  assert.match(pagina,/<button class="btn btn--primary" type="submit" id="bp-invia" disabled>/);
  const controller=leggi('busta-paga-ui.js');
  assert.match(controller,/const INVIO_ATTIVO=true;/);
  /* La spunta resta l'unica cosa che apre il pulsante: l'interruttore non la
     scavalca, li mette in AND. */
  assert.match(controller,/invia\.disabled=!INVIO_ATTIVO\|\|!consentito/);
  assert.match(controller,/if\(!\(consenso&&consenso\.checked\)\)return;/);
});

test('la rete resta separata dal PDF, il payload include consenso e testo approvato',()=>{
  const invio=senzaCommenti(leggi(FILE_CHE_ESCE));
  assert.match(invio,/richiesta\('analizza','POST',\{testo,consenso:true\}\)/);
  assert.match(invio,/const ENDPOINT='\/api\/busta-paga'/);
  /* Il `File`, il suo buffer e il suo nome non compaiono nemmeno come parola:
     il nome di un cedolino contiene quasi sempre il cognome. */
  for(const vietato of [/\bFormData\b/,/\bBlob\b/,/arrayBuffer/,/\.files\b/,/fileName|filename/i,
    /localStorage/,/sessionStorage/,/document\.cookie/])
    assert.doesNotMatch(invio,vietato,String(vietato));
  /* E il controller non ricostruisce il testo: lo prende da `applica()`, la
     stessa chiamata che ha disegnato il riquadro. */
  const controller=senzaCommenti(leggi('busta-paga-ui.js'));
  assert.match(controller,/const \{testo\}=R\.applica\(righe,redazione\);/);
  assert.match(controller,/I\.analizza\(testo\)/);
});

test('il tetto di caratteri dichiarato dal codice è quello che il controller applica',()=>{
  assert.match(senzaCommenti(leggi('busta-paga-ui.js')),/testo\.length>E\.LIMITI\.caratteriMassimi/);
  assert.ok(leggi('privacy.html').includes('tetto di caratteri'));
});

test('gli eventi di misurazione sono un elenco chiuso, e non trasportano contenuto',()=>{
  const misura=leggi('busta-paga-misura.js');
  const nomi=[...misura.matchAll(/^\s{4}(payslip_[a-z_]+):/gm)].map(m=>m[1]);
  assert.deepEqual(nomi,['payslip_view','payslip_upload_selected','payslip_extraction',
    'payslip_redaction_confirmed','payslip_analysis','payslip_guards','payslip_preview','payslip_checkout','payslip_feedback']);
  /* Le sole proprietà ammesse sono quelle del ticket: booleani, codici e fasce. */
  const proprieta=[...misura.matchAll(/'([a-z_]+)'/g)].map(m=>m[1]);
  for(const ammessa of ['file_type','page_bucket','success','error_code','dropped_bucket','useful'])
    assert.ok(proprieta.includes(ammessa),ammessa);
  /* Nessun modo di far passare testo libero: il valore è un'espressione breve. */
  assert.match(misura,/VALORE=\/\^\[a-z0-9_-\]\{1,32\}\$\//);
  const controller=senzaCommenti(leggi('busta-paga-ui.js'));
  const eventi=[...controller.matchAll(/misura\('([a-z_]+)'/g)].map(m=>m[1]);
  for(const nome of eventi)assert.ok(nomi.includes(nome),`evento fuori elenco: ${nome}`);
});

test('il risultato si scrive come testo, mai come HTML',()=>{
  const renderer=senzaCommenti(leggi('busta-paga-risultato.js'));
  for(const vietato of [/innerHTML/,/outerHTML/,/insertAdjacentHTML/,/document\.write/,/\beval\(/])
    assert.doesNotMatch(renderer,vietato,String(vietato));
  /* Le quattro sezioni del ticket padre. */
  for(const titolo of ['In breve','Le voci spiegate','Come torna il conto','Cose da verificare'])
    assert.ok(renderer.includes(`'${titolo}'`),titolo);
  /* Un totale mancante si scrive, non si stima. */
  assert.ok(renderer.includes("'non individuato'"));
});

test('la pagina dichiara a schermo il limite sull’assenza di valutazione',()=>{
  assert.match(pagina,/qualità dell’analisi su cedolini reali è ancora da verificare/);
  assert.match(pagina,/non offre consulenza fiscale/i);
  assert.match(leggi('privacy.html'),/Nessuno ha verificato, su buste paga vere/);
});

test('il voto è un sì o un no, senza campi di testo',()=>{
  const blocco=pagina.match(/<div class="bp-feedback" id="bp-feedback">([\s\S]*?)<\/div>\s*<p class="bp-feedback__grazie"/);
  assert.ok(blocco,'il riquadro del voto deve esserci');
  assert.match(blocco[1],/data-utile="si"/);
  assert.match(blocco[1],/data-utile="no"/);
  assert.doesNotMatch(blocco[1],/<textarea|type="text"|type="email"/);
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
