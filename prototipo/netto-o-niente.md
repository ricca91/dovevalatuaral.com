# Netto o niente

RIC-62: due offerte fittizie, una domanda, una serie fino al primo errore.
Ogni risposta corretta vale **1**. Nessun limite di round, tempo, vite, aiuti,
salti, moltiplicatori o cash-out. Dopo il confronto 20 la difficoltà resta al
massimo e continuano nuovi confronti. Il gioco è statico, senza account o backend.

## Contante e conti

Il vincitore ha il maggiore **netto annuo in busta meno costi del lavoro annui**.
`valutaConfronto(A,B)` chiama direttamente `COMPARA.confronta(A,B)` e legge la
riga `dopoCosti`, già in centesimi interi. Trasporto e altre spese sono input
mensili: il comparatore li moltiplica per 12. Le mensilità distribuiscono il
netto, senza modificare il vincitore. Welfare e fringe sono non monetari e
restano separati; l'eventuale imponibilità fringe è calcolata dal motore.

Il gioco rifiuta risultati non riconciliati, avvisi di inaffidabilità, valori
non finiti/non sicuri, disponibile non positivo e parità nel generatore. La
catena visualizzata verifica anche la propria identità su centesimi interi.

**Un arrotondamento risolto (RIC-78):** fino a settembre 2026 il KPI imposte
del motore arrotondava l'IRPEF netta in blocco e poteva differire di un
centesimo dalla somma delle voci (a RAL 24.000 e 38.000, per esempio). Ora il
motore ricava imposte e IRPEF netta dalle stesse voci arrotondate da cui nasce
il netto. `catenaContabile()` continua a sommare le voci per tipo, includendo
le detrazioni nelle imposte nette una sola volta; netti, vincitori e sequenze
dei vettori non sono cambiati.

Il pulsante “Apri questo confronto” usa `COMPARA.codificaStato({A,B})` con i lati
effettivamente mostrati. Si apre in un'altra scheda; `componiRighe(res.voci)`
alimenta anche la tabella A/B con formule e fonti. Nessuna formula fiscale nuova.

## Sequenza e versione

Versione iniziale: `non-v1-2026-01`. Comprende algoritmo, catalogo, regole di
gioco, motore e dataset fiscali. Il manifest di test contiene SHA-256 dei cinque
file fiscali richiesti e dei due moduli puri del gioco, oltre a tre vettori di
100 round (seed 0, 123456789, 4294967295). I test falliscono se le sorgenti
cambiano senza una revisione consapevole. Prima di aggiornare il manifest,
ricontrollare fixture e sequenze: una modifica che cambia input, ordine o
vincitori richiede una nuova versione e rende incompatibili i vecchi link.
Questo controllo non aggiunge richieste o crittografia al browser.

PRNG locale **Mulberry32**, stato uint32. Il seed di ogni round è FNV-1a della
stringa ASCII `versione|seed|indice` (indice da 1), con `Math.imul` e shift
unsigned. Due estrazioni iniziali: famiglia RAL alta/bassa al 50%, poi scambio
dei lati al 50%. Ogni candidato consuma sempre 16 estrazioni in quest'ordine:

1. RAL base e differenza RAL.
2. Mensilità A/B.
3. Trasporto A/B.
4. Altre spese A/B.
5. Welfare A/B.
6. Domicilio A/B.
7. Fringe A/B.
8. Due estrazioni riservate, sempre consumate.

Le variabili non ancora introdotte consumano comunque la loro estrazione.
RAL base 24–60 mila, passo 500; prima fascia differenza 4–10 mila, poi 500–5
mila; risultato massimo 70 mila. Trasporto 0–450/mese e altre spese 0–150/mese,
passo 25; welfare 0–2500 e fringe 0–2000 annui, passo 500. I cinque domicili
sono risolti nello snapshot: Milano, Roma, Firenze, Vicenza, Verona. Famiglia
sempre vuota, buoni e misure di tempo assenti.

| Round | Livello | Variabili nuove | Margine annuo |
| --- | --- | --- | --- |
| 1–3 | Riscaldamento | RAL, Milano, 13 mensilità | ≥ 1.500 € |
| 4–7 | Occhio ai costi | trasporto, 13/14 mensilità | 600–3.000 € |
| 8–12 | Leggi tra le righe | altre spese, welfare | 360–1.800 € |
| 13–20 | Sfida fiscale | domicilio | 240–1.200 € |
| 21+ | Fuoriclasse | fringe | 240–1.200 € |

Massimo 128 candidati. Poi catalogo di **8 coppie di soli input per fascia**;
nelle fasce 2–5 quattro vincono con RAL alta e quattro con RAL bassa. Offset
deterministico da FNV-1a di `versione|seed|indice|fallback`; si visita il catalogo
una volta, ricalcolando e verificando ogni candidato. Un test forza questo
percorso con `forzaFallback:true`, mai usato dalla UI. In entrambi i percorsi
si escludono le ultime due identità di coppia, ottenute serializzando i campi
ordinati e normalizzando A/B (nessuna collisione di un hash breve).
Nessun catalogo valido: ERRORE tecnico recuperabile, mai sconfitta artificiale.

Solo il seed iniziale usa `crypto.getRandomValues` (fallback non crittografico
se assente). Da lì niente clock, `Math.random`, target o stato globale nel
generatore. Ridimensionamento, animazioni e risposte non modificano gli input.

## Moduli e API

- `netto-o-niente-scenari.js`: versione, PRNG, catalogo, `generaConfronto`,
  `valutaConfronto`, `catenaContabile` e identità delle coppie.
- `netto-o-niente.js`: transizioni pure `creaPartita`, `rispondi`, `prossimo`,
  spiegazioni, codec sfida/record/run e replay incrementale `ripristinaRun`.
- `netto-o-niente-share.js`: modello dello scontrino, PNG locale 1080×1350,
  link risultato e destinazioni social. Non entra
  nella versione delle sequenze e non modifica i fingerprint fiscali/di gioco.
- `netto-o-niente-link.js`: contratto URL pubblico leggero, condiviso con il
  server. Valida versione/seed/score senza caricare motore e dataset fiscale.
- `api/risultato.js`, `api/risultato-immagine.js`, `server/risultato.js`:
  HTML con metadati server e PNG 1200×630. Nessun database o upload.
- `netto-o-niente-ui.js`: DOM, focus, blocco sincrono dei pulsanti, storage,
  condivisione e analytics. INTRO è gestito dal controller; DOMANDA,
  RIVELAZIONE, FINE ed ERRORE sono le fasi della run. Una risposta sbagliata
  rivela subito i conti nello stato FINE. Nessun timer di avanzamento.
- `netto-o-niente.css`: stili della sola pagina con prefisso `non-`, token e
  font Draftsman. Animazione di rivelazione 450 ms; con reduced motion è assente.

Gli script classici seguono la catena dati → geografia → motore → fonti → righe
→ nucleo → compara → scenari → gioco → link → share → navigazione → UI. Dataset
caricato una sola volta; CommonJS per i moduli puri. Il gioco resta statico.
`package.json` e lockfile aggiungono solo il renderer server `@resvg/resvg-js`
2.6.2; `npm ci` installa le dipendenze delle due Vercel Functions. Nessun
framework frontend, account o servizio di storage. Font TTF locali con licenze OFL.

## Sfide, record e ripristino

Canonical: `https://www.dovevalatuaral.com/netto-o-niente.html`.
Esempio: `#v=non-v1-2026-01&s=123456789&t=10`.
`v`, `s`, `t` sono obbligatori, senza duplicati o chiavi aggiuntive. Seed uint32
in decimale canonico; target intero sicuro non negativo, massimo 15 cifre.
Fragment oltre 512 caratteri, negativi, decimali, esponenti e versioni diverse
producono errori recuperabili. Target influenza solo i messaggi, non la sequenza.

`localStorage['non:best:<versione>']` conserva il record del dispositivo e viene
aggiornato dopo ogni risposta corretta; la prima sconfitta salva anche lo zero.
Il valore viene riletto prima dell'aggiornamento per conservare record più alti
di altre schede. `sessionStorage['non:run:<versione>']` contiene solo seed,
target, modalità, scelte A/B e fase. Nessun risultato fiscale serializzato.

Si salva prima della rivelazione. Al reload si ricalcola la cronologia a blocchi
di 10 risposte cedendo il thread; score e fase vengono derivati, mai letti da un
punteggio dichiarato. Il primo errore tronca qualsiasi coda di scelte iniettata.
Un errore tecnico durante il replay conserva il salvataggio completo per il
prossimo tentativo. Storage bloccato/corrotto dà un avviso e fallback in memoria.
Un nuovo intento nel fragment prevale sulla run della scheda. “Riprova” crea un
seed nuovo e rimuove il fragment; “Rigioca questa sfida” conserva seed/target,
azzera le scelte e mostra “Rivincita”.

Solo FINE può condividere. Testo e target usano il risultato della run conclusa,
mai il record personale. Lo scontrino è il primo elemento del finale e
“Condividi” è la CTA principale, accanto a “Riprova”. Focus sul risultato;
scorrimento automatico al finale, con CTA visibile anche a 375×667.

“Condividi” apre un nostro `<dialog>` con **LinkedIn, X, WhatsApp e Telegram**,
anteprima cliccabile del risultato, “Copia link” e download verticale facoltativo.
Non viene più invocata Web Share: nessuna dipendenza dalle app presenti nel menu
di sistema. Focus contenuto nel dialog, chiusura con Escape/X/click sullo sfondo,
ritorno al pulsante iniziale. Nessun invio automatico o copia all'apertura/chiusura.
I social si aprono in un'altra scheda; l'utente conferma lì. LinkedIn riceve il
link, senza promettere una didascalia precompilata non supportata dal suo endpoint.

Link condiviso: `/risultato/non-v1-2026-01/<seed>/<score>`, senza fragment.
La pagina viene renderizzata sul server con Open Graph e Twitter Card, PNG
pubblico `/risultato-immagine/non-v1-2026-01/<seed>/<score>.png` (1200×630),
punteggio visibile e CTA “Accetta la sfida” verso il vecchio URL di gioco con
`#v=...&s=...&t=...`. Un click sull'immagine apre la stessa sfida. Il contenuto
è identico per crawler e persone; nessun redirect JS o bot sniffing. Il formato
orizzontale è una variante dello scontrino, non un semplice ritaglio del verticale.

Produzione: canonical `www.dovevalatuaral.com`. Preview: link/PNG/CTA restano
sull'origine preview. Il server usa `VERCEL_URL` solo con `VERCEL_ENV=preview`
e hostname validato, mai `Host`/`X-Forwarded-Host`. API GET/HEAD, POST 405;
versione errata, duplicati nell'API diretta, valori fuori limite o chiavi extra
danno 400/no-store. Sui link pubblici le rewrite danno precedenza ai valori
del path: parametri omonimi nella query non possono cambiare la sfida.
Template chiuso, nessun input SVG o URL remoto accettato dal renderer. Cache
pubblica 1h client / 24h CDN. Nessuna cache applicativa illimitata per seed.
Pagine noindex/follow ed escluse dalla sitemap, ma accessibili ai crawler social.
Punteggi autodichiarati, senza certificazione/anti-cheat: il server non rigioca
una serie potenzialmente enorme per validarne il punteggio.

Il Canvas locale resta solo per scontrino verticale/download 1080×1350. Se
fallisce, la condivisione tramite pagina pubblica continua. Il PNG social viene
precaricato al finale; un errore è dichiarato nel dialog. Clipboard manuale solo
se la copia fallisce; “Link copiato” solo dopo successo. Una copia tardiva non
modifica la nuova partita. Offline si può giocare ma non recuperare anteprime remote.

**Limite:** l'immagine è l'anteprima cliccabile di un link, non un allegato foto.
Visualizzazione, cache e ritagli dipendono dal social; metadati corretti non
garantiscono che ogni compositore mostri immediatamente l'immagine. Nessun
accesso ai profili e nessuna pubblicazione eseguita dai test.

## Misurazione

Solo `window.gtag` già disponibile: `non_start {mode}`, `non_answer
{round,tier,correct}`, `non_end {score,mode}`, `non_share {method}` e
`non_open_comparison {round}`. Tier da 1 a 5; mode `free|challenge|replay`.
Eventi emessi nelle transizioni, mai al render o reload. `non_share_open {}`
misura l'apertura del dialog. Share `clipboard` misura il successo della copia;
`manual` la presentazione del testo
selezionabile, non una copia verificata. `non_share_destination {method}` misura
solo il click su `linkedin|x|whatsapp|telegram`; `non_share_download {format:'png'}`
solo il click sul download. Nessuna misura certifica pubblicazione o consegna.
Niente seed, URL, target, offerte o profilo fiscale nei payload espliciti.
Tracker assente, bloccato o in errore non ferma il gioco.

## Verifica e consegna

```sh
npm ci
npm test
node prototipo/genera-pagine-ral.js
git diff --check
```

Non esiste uno script build/lint: la suite Node e il controllo sintattico degli
script sono i controlli applicabili. La suite copre fixture al centesimo,
transizioni, parser, record, replay, fallback, fingerprint, **25 seed × 101
round**, più 1.000 round avanzati per il bilanciamento (35–65% per famiglia/lato).

Copione browser ripetibile, con `playwright-core` esterno al prodotto:

```sh
npm run dev
agent-browser --session ric62 open http://127.0.0.1:4182/netto-o-niente.html
agent-browser --session ric62 get cdp-url
node processo/attrezzi/verifica-netto-o-niente.cjs /percorso/playwright-core ws://indirizzo-cdp [URL-preview]
```

Screenshot e resoconto in `processo/verifiche/ric-62/`, fuori dalla directory
pubblicata. Browser: serie oltre 12, perdita, quattro fasi di refresh, rivincita,
sfida in contesto separato, 101 round confrontati con Node, Compara reale, fonti,
375×812, 390×844, 1440×900, zoom 200%, tastiera, doppio tap, reduced motion,
storage rifiutato/corrotto, guasti e ripristino lungo, share/cancel/fallback,
clipboard realmente riletta, file offline, tracker assente e noscript.

Anteprima cliccabile: `processo/attrezzi/verifica-netto-o-niente-share.cjs`
con gli stessi argomenti e un eventuale quarto argomento per la directory screenshot.
Evidenze e limiti in
[`processo/verifiche/ric-62-social/`](../processo/verifiche/ric-62-social/README.md).
PNG pubblico reale, metadati senza JavaScript, popup social intercettati senza
pubblicare, copia/fallback, focus, schermi corti e zero errori console.

Riferimenti: [Anteprime LinkedIn](https://www.linkedin.com/help/lms/answer/a521928),
[Telegram](https://core.telegram.org/widgets/share),
[WhatsApp](https://faq.whatsapp.com/5913398998672934),
[X Web Intents](https://docs.x.com/x-for-websites/web-intents/overview).

Nel test SEO è stata corretta l'assunzione preesistente che due vecchi
prototipi non pubblicati debbano esistere: se presenti devono avere
`noindex, nofollow`, se assenti non vengono creati. Sempre esclusi dalla
sitemap. “Gioca” compare nei menu manuali, nel template e nelle 18 pagine
generate; `PUBLIC_PAGES` e test SEO preservano la canonical a ogni rigenerazione.

Limiti delle prove: richieste HTTP con user-agent social non equivalgono a un
crawl reale del social. Nessuna pubblicazione o consegna al destinatario verificata.
Clipboard verificata anche realmente in Chromium. Nessuna certificazione normativa.
La PR offre una preview: i suoi link restano sulla preview, quelli di produzione
usano il dominio canonical. Nessun merge o deploy di produzione eseguito.
