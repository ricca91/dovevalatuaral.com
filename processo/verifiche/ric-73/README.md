# RIC-73 — landing «Parti dal tuo dubbio»

Implementazione della proposta 02 approvata nel ticket, con HTML/CSS accessibile,
senza usare il mockup come immagine della pagina. Base: RIC-72, commit `d3d9ecf`.
Checkout isolato per preservare le modifiche preesistenti nel workspace principale.

## Preview e confronto visivo

[Preview Vercel](https://dovevalatuaral-qupn24cor-riccardosartori-outlookcoms-projects.vercel.app/busta-paga.html).

[Desktop, 1440 px](preview-desktop.png) · [Mobile, 390 px](preview-mobile.png).
Screenshot del deploy effettivo, aperti e confrontati con la proposta 02.
Hero con dubbi lavanda, upload affiancato, demo anteprima/report, passi numerati,
offerte, fonti/limiti, FAQ e fascia ciano conservano la composizione scelta.

Differenze motivate: prezzo/modalità accanto all’upload; CTA breve mobile;
estratto già nell’anteprima; dettaglio acquistabile anche su mobile; nessuna
promessa di velocità o ricalcolo fiscale; FAQ e retention complete. La CTA upload
è grigia sulla preview perché il servizio è ancora non configurato. Il controllo
è quello reale di RIC-72, non un pulsante finto abilitato per la schermata.

## Confine dei file

- `busta-paga.html`: contenuti commerciali, stesso unico `#bp-upload`, stessi ID
  applicativi per revisione/consenso/anteprima/report. Gli stati restano subito
  dopo la hero, prima della demo; il report privato non è nella demo sintetica.
- `busta-paga-landing.css/js`: solo presentazione commerciale. Il JS legge la
  promessa `BUSTA_PAGA_PERCORSO.configurazione`; nessuna nuova fetch o prezzo locale.
- `busta-paga-percorso.js`: espone la configurazione già caricata alla landing.
- `site-nav.js` / `index.html`: ingressi predisposti sotto gate editoriale chiuso.
  Nessuna modifica al motore del calcolatore o al backend dei pagamenti.
- `busta-paga-termini.html`: stato trasparente dei termini ancora da pubblicare,
  non condizioni di vendita inventate e non un’autorizzazione alla vendita.

## Contratto d’ingresso e misurazione

Tutte le CTA puntano a `/busta-paga.html#bp-upload`, che contiene l’unico input.
Prezzo: stessa risposta di `GET /api/busta-paga?azione=configurazione` usata dal
percorso. Se assente: «prezzo da definire» e upload disabilitato. Se test: etichetta
esplicita «di test (nessun addebito reale)» in tutte le posizioni commerciali.
Il prezzo dell’ordine mostrato nel checkout resta quello memorizzato dal server.

Nessun evento duplicato al clic sulle ancore: selezione, estrazione, consenso,
analisi, anteprima e checkout restano misurati dal flusso RIC-72. GA4 escluso.

## Prove

- `npm test`: 24 file passati, compresi lettura/redazione, rete, paywall, archivio,
  calcolatore, SEO e nuovi casi prezzo/gate editoriale.
- TDD ai confini confermati dall’utente: configurazione prezzo e gate pubblico;
  regressione browser per CTA, upload, consenso e stati del percorso.
- Controlli sintattici Node sui JS cambiati e `git diff --check` passati.
  Questa base statica non dichiara script typecheck/lint/build. Build Vercel passata.
- Preview reale: nessun errore JS, nessun overflow a 390/1440 px; prezzo da definire
  e servizio non configurato visibili. Nessuna prova con uno screen reader umano.

Prova ripetibile del percorso con soli dati sintetici, usando `agent-browser`:

```sh
node processo/verifiche/ric-72/server-fixture.cjs
# In un secondo terminale:
node processo/verifiche/ric-73/browser.cjs
```

Il lettore PDF è reale. AI, Stripe e archivio della fixture sono simulati: questi
test non dimostrano inferenza reale, acquisto Stripe test o incassi live.

## Attivazione coordinata con RIC-71/72

La landing resta `noindex, nofollow` anche via header Vercel. Non è in sitemap.
Il gate `pubblicata=false` in `site-nav.js` mantiene nascosti navigazione, Altri
strumenti e CTA dopo risultato. Non si apre automaticamente con Stripe test.

La base RIC-72 precede il merge del blog RIC-74. Il codice condiviso protegge le
CTA `.article-cta a[href="/busta-paga.html"]` e quelle marcate
`data-busta-paga-cta`, mantenendo il fallback al calcolatore. Gli articoli che già
puntano al calcolatore restano tali. Al merge con main, per i soli articoli del
piano destinati alla busta paga, conservare l’intento nel template con
`data-busta-paga-cta`: il gate comune potrà allora attivarli insieme al prodotto.

Prima del live: completare configurazione e prova integrata RIC-72 e qualità
RIC-71; approvare prezzo e termini/dati venditore; verificare backup e hosting;
aprire il gate editoriale, togliere noindex da HTML/header, aggiornare sitemap,
metadati e testi «preview»/termini; attivare le CTA del piano editoriale e rimuovere
il fallback indicato dalla guida di scrittura. Verificare il prezzo live e il
percorso su deploy. Nessuno di questi gate è dichiarato superato da RIC-73.
