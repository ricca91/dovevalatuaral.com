# RIC-81 — caricamento mobile

Verifica del 25 settembre 2026. Baseline: commit `ac3e657fd7cdef35f2a3db1aeb600d6d1babdebc`. Modifiche sul branch `ric-81-velocita-mobile`.

## Deploy e metodo

- [Baseline Vercel](https://dovevalatuaral-7d18ql5ga-riccardosartori-outlookcoms-projects.vercel.app), deployment `dpl_7FdSS6V6Mydu9P5XQLqxVWgWcGiS`.
- [Versione verificata](https://dovevalatuaral-odtg312xn-riccardosartori-outlookcoms-projects.vercel.app), deployment `dpl_9zsUs6eBh92iCuKMoch7CzzNWkFX`.
- Entrambe preview pubbliche dello stesso progetto Vercel, build iad1. Nessuna modifica alla produzione.
- Lighthouse **13.5.0**, Chromium headless sullo stesso VPS, impostazioni mobile predefinite (Moto G Power emulato, rete slow 4G simulata, rallentamento CPU 4×). Tre browser nuovi a cache fredda per variante, in sequenza. Mediana calcolata separatamente per ciascuna metrica. Analytics reali attivi, senza blocchi o modifiche.
- Desktop: una misura per variante, viewport 1350×940, CPU 1×, rete desktop. Il primo accesso a ogni preview include il riscaldamento della CDN; tutti e tre i risultati mobile sono conservati, senza scartare il peggiore.
- Queste sono misure **Lighthouse su preview**, non nuove misure PSI produzione né dati CrUX. Il report PSI citato nel ticket resta una baseline distinta.

## Risultati

| Metrica | Prima, mediana mobile | Dopo, mediana mobile | Obiettivo |
| --- | ---: | ---: | ---: |
| Performance | 64 | **92** | ≥90 |
| FCP | 1,839 s | **1,015 s** | ≤1,8 s |
| LCP | 6,653 s | **2,887 s** | ≤2,5 s — ancora sopra |
| TBT | 489 ms | **204 ms** | ≤200 ms — ancora sopra |
| CLS | 0 | **0,000154** | ≤0,1 |
| Performance desktop | 96 | **100** | ≥90 |

Mobile prima: 59 / 65 / 64. Dopo: 85 / 92 / 93. Il punteggio non è una garanzia su ogni esecuzione. Desktop dopo: FCP 273 ms, LCP 638 ms, TBT 0, CLS 0,00082.

**L'ottimizzazione non è dichiarata chiusa:** LCP e TBT mediani restano sopra i target. L'elemento LCP è il paragrafo introduttivo. Il caricamento dei tre font nella prima schermata resta nel percorso di rendering; il dataset completo e il JavaScript di analytics restano costi di avvio. Le waterfall e i long task nei report distinguono le risorse. Non è stato alterato il tracciamento per alzare il punteggio.

### Quando il calcolatore è utilizzabile

Misura separata con throttling **applicato realmente via CDP**: 150 ms latenza, 1.638.400 bit/s download, 750.000 bit/s upload, CPU 4×, viewport 412×823, browser context nuovo e cache disabilitata. Si rileva quando `Calcola` è abilitato e il motore è disponibile, poi si esegue un calcolo reale. Non confondere questi tempi con i mark non simulati interni ai report Lighthouse.

| Misura | Prima | Dopo |
| --- | ---: | ---: |
| Calcola utilizzabile, mediana di 3 | 3,767 s | **3,691 s** |
| Risultato ottenuto, mediana di 3 | 4,013 s | **3,985 s** |

L'anticipo del contenuto è forte; il miglioramento del tempo al primo calcolo è **modesto (circa 76 ms, 2%)**. Il dataset nazionale continua a essere richiesto per intero e compete con i font. I tempi del primo calcolo comprendono l'attesa del test fino a DOMContentLoaded e non misurano la latenza di una persona. Nessun caricamento parziale per comune e nessun fallback fiscale silenzioso sono stati introdotti. Un'eventuale migrazione asincrona richiede un progetto separato che gestisca anche confronto, inversione e gioco.

## Cosa cambia

1. Tre WOFF2 estratti **identici byte per byte** dal CSS, con nomi hashati e URL relativi al foglio condiviso. `font-display:swap`, famiglie, pesi e stretch conservati. Fallback per corpo e mono calibrati sulle metriche; in una prova con font ritardati, altezza della hero e posizione del modulo sono identiche prima/dopo. La homepage precarica soltanto Instrument Sans, usato dal paragrafo LCP. Nessuna cache immutable aggiunta.
2. `home-ui.js` è la sorgente unica del markup: `genera-home.cjs` esegue lo stesso template in build, con lo snapshot canonico, e aggiorna il blocco marcato nell'HTML. Titolo, spiegazione, modulo, cifre chiave e FAQ sono presenti prima del dataset. RAL e mensilità sono editabili; gli altri controlli attendono i dati. La hero resta nel DOM; il caso iniziale attiva il markup esistente senza ridisegnarlo.
3. Controller estratti e catene classiche `defer` ordinate per home, confronto, inverso, CCNL, tredicesima e gioco. Navigazione `async` indipendente dal dataset. Stato visibile, noscript e retry tramite nuovo documento; il retry della home conserva RAL/mensilità e la query. Input, focus e selezione sono conservati anche con `calc=1#risultato` e download ritardato.
4. Build: il dataset browser usa forme di oggetti e default scalari per colonna; una maschera registra quali valori ricostruire. Ogni campo, fonte, data e condizione viene ripristinato. Nessun arrotondamento. Node, test, generatori, importatore e server leggono ancora lo snapshot originale. Sono state scartate codifiche a dizionario che aumentavano il gzip. Il codec fallisce esplicitamente se una futura forma supera 30 chiavi.
5. Lookup geografici per regione/provincia costruiti una volta mantenendo l'ordinamento italiano e gli ID originali. Non si aggiungono indici ordinati al payload: si conserva un solo ordinamento all'avvio, evitando i filtri ripetuti a ogni interazione. Il fingerprint del gioco per `geografia.js` è aggiornato; versione, seed, vettori e hash delle sequenze restano invariati e passano la suite.
6. Le pagine RAL, CCNL e blog continuano a essere statiche. I generatori/template esistenti restano validi: tutti puntano al CSS condiviso, che risolve autonomamente i font. Nessun dataset è aggiunto a queste pagine; la build li rigenera e copia gli asset.

## Byte e costo del codec

Byte esatti: gzip predefinito Node e Brotli predefinito Node, stessa configurazione prima/dopo. Non sono le dimensioni HTTP della CDN: quelle sono nelle waterfall.

| Asset | Raw prima → dopo | gzip prima → dopo | Brotli prima → dopo |
| --- | ---: | ---: | ---: |
| draftsman.css | 236.776 → 35.596 | 161.046 → 8.141 | 158.830 → 7.259 |
| dati-addizionali-2026.js | 4.451.542 → 1.085.922 | 238.478 → 191.866 | 154.213 → 136.738 |
| index.html | 76.096 → 44.048 | 24.375 → 12.837 | 21.901 → 11.225 |

I font esterni pesano 90.104, 30.092 e 31.432 byte: sono spostati fuori dal CSS bloccante, non eliminati. Anche il controller della home è ora una risorsa separata: la riduzione del solo HTML non è la riduzione dell'intera pagina.

Benchmark isolato del dataset in Chromium, cinque context nuovi, senza rete né rallentamento CPU: mediana compilazione + esecuzione **74,3 → 42,1 ms**. Il decoder sposta lavoro dalla compilazione JS all'esecuzione, ma riduce il totale. Heap trattenuto dopo GC: **1.904.828 → 2.710.556 byte** (circa +787 KiB). È un compromesso esplicito: meno trasferimento e meno tempo di avvio, con più memoria trattenuta. Non è una misura del picco di memoria o della RAM totale del processo.

## Verifiche

- `npm test`: **497/497**, 68 suite; `npm run build`: riuscita. `git diff --check`: pulito. Nessuno script lint nel progetto.
- Confronto esaustivo del dato decodificato e di `risolvi()` per tutti i **7.894 comuni**, incluse fonti e condizioni; controllo dell'ordine per provincia e regioni; risultati su sei comuni e otto RAL con nucleo/benefit; soglie comunali. Restano attive tutte le suite fiscali, inversione, CCNL, confronto, tredicesima e gioco.
- Browser su preview: download dati bloccato, menu utilizzabile durante l'attesa, input/focus/cursore, query completa con `calc=1`, reset, Roma/Milano, nucleo/benefit, trasferimento e calcolo del confronto, inversione, CCNL, tredicesima e gioco. Fallimento del dataset e dello stesso bootstrap con retry riuscito. JavaScript disabilitato: contenuto utile e noscript. Nessun errore JS sul percorso normale, nessun 404 interno.
- Screenshot mobile 390×844 e desktop 1440×1000 di home, inverso, pagina RAL, pagina CCNL, articolo, CCNL interattivo, tredicesima e gioco. Controllo overflow orizzontale.
- Motori fiscali, snapshot canonico, sequenze di gioco e `analytics.js` confrontati byte per byte con la baseline: invariati.

## Artefatti e riproduzione

- `lighthouse-summary.json`: otto esecuzioni e date; `*.json.gz`: report completi, impostazioni e audit inclusi.
- `baseline-mobile.html` e `final-v4-mobile.html`: report navigabili delle esecuzioni centrali; `*-waterfall.tsv`: risorse, tempi, priorità e byte HTTP.
- `bytes.json`, `data-benchmark.json`, `*-usable.json`: misure grezze.
- `tests.txt`, `browser.txt`: output delle verifiche; immagini del confronto visivo accanto al report.
- Strumenti in `processo/attrezzi/`: `misura-velocita-mobile.mjs`, `misura-primo-calcolo.cjs`, `benchmark-dati-browser.cjs`, `verifica-velocita-mobile.cjs`. Installare Lighthouse 13.5.0 e Playwright in un ambiente di strumenti separato; impostare `CHROME_PATH` e, per gli script CommonJS, `NODE_PATH`. Per lo script Lighthouse ESM, copiarlo nell'ambiente che contiene le dipendenze. Nessuna dipendenza runtime aggiunta al sito.

Resta da confermare sul **deploy di produzione** il comportamento della sua CDN e dei suoi tempi di risposta. Non sono stati misurati Core Web Vitals reali degli utenti né eseguito un nuovo PSI produzione.
