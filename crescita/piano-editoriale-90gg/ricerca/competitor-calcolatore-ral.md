# Teardown SEO — territorio "calcolatore RAL / lordo→netto / stipendio netto"

Data ricerca: 20 settembre 2026. Location DataForSEO: Italy. Lingua: it.

## 1. Metodo, endpoint usati, limiti

Endpoint DataForSEO Labs/SERP usati (tutti con `location_name: "Italy"`, `language_code: "it"`):
- `dataforseo_labs_google_serp_competitors` — su 20 keyword seme + 4 keyword supplementari per riempire buchi di cluster (RAL 25k/40k/50k, quattordicesima, netto→lordo, part-time, confronto offerte).
- `dataforseo_labs_google_domain_rank_overview` — su 12 domini (traffico organico stimato, distribuzione posizioni).
- `dataforseo_labs_google_ranked_keywords` — sui 4 domini più forti secondo il brief (calcolastipendionetto.it, stipendee.it, bustaia.it, coverflex.com), top 200-250 per volume ciascuno.
- `dataforseo_labs_google_relevant_pages` — su bustaia.it, calcolastipendionetto.it, stipendee.it, coverflex.com, nettostipendio.com, dalordoanetto.com, jethr.com.
- `serp_organic_live_advanced`, depth 20 — su 6 query rappresentative, `people_also_ask_click_depth: 2` su 3 di esse.
- `WebFetch` su 3 pagine vincenti (calcolastipendionetto.it, bustaia.it, coverflex.com); la pagina PMI.it ha risposto 403 e non è stata leggibile.

**Limiti dichiarati:**
- Il campione di keyword usato per le tabelle cluster/keyword viene dai `ranked_keywords` dei 4 domini sopra, **top 200 per volume ciascuno** (non l'intero export). Il totale keyword tracciate da DataForSEO per quei domini è molto più alto (calcolastipendionetto.it 705, stipendee.it 2.395, bustaia.it 6.428, coverflex.com 2.395/6.428 — vedi tabella dominio); la coda lunga oltre le top 200 per dominio non è stata ispezionata riga per riga.
- **jethr.com non è stato incluso nel pull di `ranked_keywords`** (il brief indicava di limitarsi a 3-4 domini e dava priorità a bustaia.it per la minaccia specifica sulla serie lordo→netto). Dal `domain_rank_overview` risulta però che jethr.com ha un traffico stimato (105.578 ETV) superiore a bustaia.it, stipendee.it e stipendionettocalcolatore.it: è il buco di ricerca più rilevante di questo report, segnalato anche al punto 8.
- Per **calculator.graber-partner.com**, `relevant_pages` ha restituito `total_count: null, items: []` nonostante `domain_rank_overview` mostri dati (14.070 ETV, 413 keyword) e il dominio compaia stabilmente in posizione 6-9 in quasi tutte le SERP live controllate. Non risolto: possibile problema di canonicalizzazione lato provider sul percorso `/it/`.
- Per **dalordoanetto.com**, la prima chiamata `domain_rank_overview` (impostazioni di default, `ignore_synonyms: true`) ha dato 1.500 ETV/384 keyword; una chiamata con `ignore_synonyms: false` ha dato 2.949 ETV/603 keyword. Uso il valore di default per coerenza con gli altri domini e segnalo l'alternativa in tabella.
- Ho **verificato due volte** (chiamate individuali, non in batch) i numeri di bustaia.it, coverflex.com, jethr.com e calculator.graber-partner.com dopo aver notato un'incongruenza nella prima lettura: i valori riportati in questo file sono quelli confermati dalle chiamate singole.
- Alcune query di cluster (netto→lordo generico, part-time, confronto offerte, aumento contrattuale) non hanno **nessun dominio tracciato** in `serp_competitors` — non è detto che non esista volume di ricerca, solo che nessuno dei domini monitorati in questa ricerca si posiziona lì con continuità. Non ho interrogato `keyword_overview`/`search_volume` dedicato per quei termini, quindi il volume esatto è "non disponibile".
- `stipendee.com` e `calcolonetto.it` come varianti di dominio: `stipendee.com` non ha dati (il dominio corretto è `stipendee.it`); `calcolonetto.it` esiste ed è un dominio minore (3.310 ETV) — compare nelle SERP live come fonte AI Overview ma non tra i primi 30 competitor sui seed keyword.
- `dovevalatuaral.com`: confermato **zero dati** in DataForSEO Labs (`domain_rank_overview` vuoto), coerente con quanto riportato nel brief.

## 2. Tabella comparativa domini

| Dominio | Traffico organico stimato (ETV, DataForSEO) | N. keyword posizionate | Top pagine (per ETV) | Modello di monetizzazione osservato |
|---|---|---|---|---|
| **coverflex.com** | 206.031 | 3.918 | `/it/calcolo-codice-fiscale` (113.632 ETV, non è il nostro territorio) · `/it/calcolo-stipendio-netto` (48.298 ETV, 375 kw) · vari blog CCNL/TFR/IRPEF | SaaS B2B welfare aziendale — calcolatori come content marketing/lead gen verso demo/signup, nessuna pubblicità |
| **jethr.com** | 105.578 | 4.719 | `/risorse/consultazione-attestati-di-malattia/` (14.069) · `/risorse/inail-cose-e-cosa-deve-fare-azienda/` (9.760) · `/strumenti/calcolo-stipendio-netto` (7.912, 339 kw) · `/strumenti/calcolo-irpef`, `/strumenti/ccnl-ral-livello`, `/strumenti/calcolo-fringe-benefit-auto`, `/strumenti/calcolo-costo-azienda` | SaaS payroll/HR (Jet HR) — blog molto ampio su adempimenti HR lato datore di lavoro (INAIL, DURC, UNILAV, licenziamenti), il calcolatore netto è solo una fetta minoritaria del traffico totale |
| **calcolastipendionetto.it** | 64.668 | 452 | homepage unica (64.668 — praticamente tutto il traffico) | Sito mono-pagina ad-supported (rilevato messaggio anti-adblock), nessun altro prodotto |
| **stipendee.it** | 40.187 | 1.253 | homepage (34.355) · `/naspi` (2.557) · `/preavviso-dimissioni` (1.407) · `/cv-builder` (737) · pagine `/stipendio-netto/{N}-euro-lordi` nuove, senza metriche | Content hub lavoro più ampio (NASPI, dimissioni, CV builder, "osservatorio stipendi") — probabile lead-gen/media, non solo calcolatore. Ha già iniziato una serie programmatica per importo (`/stipendio-netto/18000|33000|38000|50000-euro-lordi`), ancora senza traffico misurabile |
| **bustaia.it** | 8.558 | 1.524 | `/guida-ccnl/metalmeccanici` (1.562) · home (1.017) · `/guida-ccnl/cooperative-sociali` (723) · `/guida-ccnl/sanita` (621) · serie `/strumenti/{1000..5000}-lordo-quanto-netto` (somma ≈1.181 ETV sulle 8 pagine) · `/strumenti/calcolo-stipendio-netto` (170) | Prodotto freemium: calcolatore gratuito + "Analizza gratis la tua busta paga" (analisi AI del cedolino) con upsell "BustaIA Studio"/"BustaChiara" per consulenti e aziende |
| **stipendionettocalcolatore.it** | 15.190 | 1.090 | homepage + pagine per importo tipo `/ral-30000-netto-2026/`, `/stipendio-netto-ccnl-metalmeccanico-2026/` (osservate in SERP live, non isolate via relevant_pages in questa run) | Blog/contenuto ad-supported presumibile; struttura "Blog" nel breadcrumb |
| **nettostipendio.com** | 9.312 | 1.503 | `/settoriale/calcolatore-stipendio-insegnanti/` (3.006) · `/settoriale/calcolare-stipendio-metalmeccanico/` (2.555) · home (757) · `/ral/ral-30000-stipendio-netto/` (97) e altre pagine RAL-per-importo con poco traffico | Rete di calcolatori settoriali (per professione/categoria) + calcolatori fiscali (codice fiscale, IRPEF, ISEE); debole sugli head term puri (posizione media ~29 sui seed) ma presente nella coda settoriale |
| **calculator.graber-partner.com** | 14.071 | 413 | non determinabile (relevant_pages vuoto, vedi limiti) | Presumibile calcolatore white-label/embed (dominio "Graber & Partner", sottodominio `calculator.`); compare stabilmente in posizione 6-9 nelle SERP live testate |
| **calcolonetto.it** | 3.311 | 577 | non isolato in questa run (solo osservato come fonte AI Overview e pagina `/stipendio-netto-30k/` in SERP live) | Non determinato — necessita approfondimento |
| **dalordoanetto.com** | 1.500 (default) / 2.949 (con `ignore_synonyms:false`) | 384 / 603 | home (1.397) · `/calcolo-ccnl-metalmeccanico.html` (980) · `/stipendio/1400-euro-lordi-netti.html` (155) · `/da-netto-a-lordo.html` — calcolo inverso (132) · `/calcolo-trattamento-integrativo.html`, `/calcolo-apprendistato.html`, `/calcolo-pensione-reversibilita.html`, `/calcolo-assegno-unico.html` | Rete di micro-calcolatori tematici ad-supported presumibile; combina già serie per importo mensile + CCNL + calcolo inverso netto→lordo + calcolatori adiacenti |
| **stipendee.com** | nessun dato | — | — | dominio errato nel brief; quello reale è stipendee.it |
| **dovevalatuaral.com** | nessun dato | 0 | — | conferma quanto indicato nel brief |

Nota: coverflex.com e jethr.com sono domini internazionali/multi-prodotto; l'ETV di dominio include pagine molto lontane dal nostro territorio (codice fiscale, adempimenti HR per aziende). Ho isolato dove possibile l'ETV della singola pagina calcolatore netto.

## 3. Tabella dei cluster

Campione: keyword deduplicate dai `ranked_keywords` (top 200 per volume) di calcolastipendionetto.it, stipendee.it, bustaia.it, coverflex.com — 659 keyword uniche totali. I numeri di "n. keyword" e "volume totale" sono relativi a questo campione, non all'universo completo (vedi limiti §1).

| Cluster | N. keyword (campione) | Volume totale (campione) | KD medio | Query esempio | Chi lo domina | Pagina programmatica o articolo? |
|---|---|---|---|---|---|---|
| **Generico "calcolo/calcolatore stipendio netto/lordo/RAL"** (senza importo, senza CCNL) | 77 | 513.690 | 11,8 (su 66 kw con KD noto) | "calcolo stipendio netto", "stipendio netto da lordo", "calcolatore ral", "ral a netto" | calcolastipendionetto.it (posizione 1 su quasi tutte le varianti) | Nessuna delle due nel senso classico — è la homepage/hub del sito. Non conviene competere frontalmente sull'head term nudo (dominato da un mono-tema in pos.1); investire su varianti long-tail come **articoli** che linkano all'hub e alle pagine programmatiche |
| **Importo mensile "N euro lordi quanto netti"** | 31 | 26.700 | 14,7 (su 20 kw) | "1500 euro lordi quanto sono netti" (480), "2000 euro lordi quanto sono netti" (1.600), "1800/1700/1600 lordi quanto sono netti" (1.600 ciascuna) | bustaia.it (serie `/strumenti/{N}-lordo-quanto-netto`) e dalordoanetto.com (serie `/stipendio/{N}-euro-lordi-netti.html`) sono gli unici con pagine dedicate; calcolastipendionetto.it intercetta con la sola homepage | **Programmatica** — è un pattern di query diverso (mensile, non RAL annuale) da quello già coperto da dovevalatuaral; serve una seconda serie di pagine per importo mensile, non coperta dalle attuali `/ral-{N}-netto/` |
| **RAL specifica "RAL N stipendio netto"** | 6 (nel campione; l'universo reale è più ampio, osservato anche per 20k/45k/60k in SERP live) | 6.190 | non disponibile (KD quasi sempre -1) | "ral 30000 stipendio netto" (1.600), "ral 45000/35000/25000 stipendio netto" (1.000) | stipendee.it (pos.1 su quasi tutti), calcolastipendionetto.it, stipendionettocalcolatore.it con pagine dedicate tipo `/ral-30000-netto-2026/` | **Programmatica** — è esattamente il pattern già coperto dalle pagine `/ral-{N}-netto/` esistenti; opportunità di infittire i passi (importi non tondi come 27.000/32.000/26.000 osservati con volume reale) |
| **CCNL e livello** | 181 | 1.124.100 | 8,3 (su 25 kw con KD noto; molte varianti sinonimiche dello stesso concetto, quindi il volume "totale" è gonfiato da ripetizioni semantiche) | "ccnl metalmeccanici" (27.100), "contratto collettivo nazionale commercio" (18.100), "metalmeccanico livelli" (14.800), "5 livello metalmeccanico stipendio netto" (1.900) | bustaia.it (`/guida-ccnl/*`) e coverflex.com (`/blog/ccnl-*`) con guide editoriali lunghe; **nessuno** ha un vero calcolatore per livello CCNL | **Programmatica** ad alto valore ma alto costo di manutenzione (minimi tabellari cambiano a ogni rinnovo contrattuale). Partire da 2-3 CCNL a maggior volume (metalmeccanici, commercio) con matrice livello×netto, non tentare copertura totale |
| **Tredicesima / quattordicesima** | 28 | 120.000 | non disponibile (KD sempre -1 nel campione) | "tredicesima" (9.900), "la tredicesima quando arriva" (12.100), "calcolo tredicesima" (5.400) | bustaia.it con un solo articolo lungo (`/blog/tredicesima-come-si-calcola`) intercetta quasi tutto il cluster | **Blog** — articolo calcolatore semplice, non serve matrice; tema evergreen a bassa manutenzione, buon hub di link interno verso le pagine RAL |
| **Tassazione / scaglioni IRPEF** | 24 | 401.260 | 6,6 (su 8 kw; molte varianti duplicate "scaglioni/aliquote irpef 2025/2026") | "scaglioni irpef 2026" (40.500), "aliquote irpef 2026" (40.500), "irpef 2026" (14.800) | coverflex.com domina con un solo blog post (`/blog/nuova-irpef`) | **Blog** — pillar editoriale aggiornato annualmente; si presta a citazioni normative (coerente col posizionamento "fonti citate" di dovevalatuaral) |
| **Bonus / detrazioni / cuneo fiscale** | 28 | 537.180 | 7,6 (su 14 kw) | "bonus mamme" (27.100), "bonus asilo nido" (22.200), "cuneo fiscale" | coverflex.com domina quasi tutto (blog dedicati per bonus) | **Blog**, ma **parzialmente fuori target**: bonus mamme/nido/bebè sono welfare-familiare, territorio di Coverflex/player HR, non core di un calcolatore RAL. Selezionare solo i sottotemi legati al netto in busta paga (cuneo fiscale, detrazioni lavoro dipendente, trattamento integrativo) |
| **Calcolo inverso (netto→lordo)** | 8 | 60.320 | 4,5 (su 8 kw) | "stipendio netto lordo" (14.800, ambiguo tra le due direzioni), "dal netto al lordo" (1.600), "calcolo lordo dal netto" (12.100) | Nessun competitor forte con pagine dedicate — dalordoanetto.com ha una sola pagina (`/da-netto-a-lordo.html`, 132 ETV), hsweba34.inaz.it (tool istituzionale non ottimizzato SEO) | **Programmatica** complementare — gap chiaro: nessuno programmatizza "voglio N netti, quanto devo chiedere di RAL" |
| **Tabelle lordo/netto** | 3 (sottostima: "tabella lordo netto" compare spesso come *related search*, non come keyword isolata nel campione) | 10.700 | non disponibile | "tabella lordo netto" (4.400), "tabella netto lordo" (4.400) | stipendee.it, calcolastipendionetto.it (intercettate dalla homepage, nessuna pagina tabellare dedicata) | **Programmatica** — un'unica pagina "hub tabellare" con tutti gli importi in vista tabellare; possibile upgrade dell'hub `/confronti-ral/` già esistente |
| **Strumenti busta paga adiacenti (TFR, NASPI, cedolino)** | 21 | 365.100 | 5,8 (su 11 kw) | "naspi" (135.000), "naspi inps" (49.500), "cedolino"/"cedolini" (12.100 ciascuna), "calcolatore tfr" (12.100) | stipendee.it (`/naspi`), bustaia.it (`/strumenti/calcolo-tfr`, `/cedolino-online`), jethr.com (`/risorse/tfr-in-busta-paga...`) | **Misto**: NASPI/cedolino sono **blog** (alto volume ma fuori dal cuore lordo→netto); TFR potrebbe giustificare un piccolo calcolatore dedicato (query transazionali "calcolo tfr"), da valutare come secondo prodotto |
| **Part-time / ore** | 1 (segnale di forte sotto-copertura nel campione) | 720 | non disponibile | "stipendio part-time 20 ore netto" (720) | Nessun competitor con contenuto dedicato individuato | **Blog** — articolo "stipendio netto part-time: come si calcola" con esempi, che rimanda al calcolatore con opzione part-time. Bassa priorità per volume ma bassissima competizione |
| **Confronto offerte di lavoro** | 0 — nessun dominio tracciato compare per questo pattern (verificato con `serp_competitors` dedicato su "offerta di lavoro stipendio netto confronto") | non disponibile | non disponibile | — | Nessuno | **Blog/tool leggero** — gap vero; coerente con l'hub `/confronti-ral/` già esistente di dovevalatuaral, che potrebbe ospitare uno strumento "confronta due offerte: stipendio netto a confronto" |
| **Aumenti e scatti contrattuali** | 0 nel campione ranked_keywords, ma osservato 1 articolo jethr.com (`/risorse/aumento-stipendio/`, 1.477 ETV) fuori campione | non disponibile | non disponibile | "aumento stipendio", "aumento contrattuale" (0 domini tracciati in `serp_competitors` dedicato) | jethr.com (parzialmente) | **Blog** — gap parziale, quasi nessuno lo presidia con contenuto mirato |

## 4. Top keyword singole (dal campione raccolto)

Colonna "tipo di pagina che vince" = osservazione diretta da SERP live o da `ranked_keywords`. Volume/KD = stima DataForSEO ("non disp." dove KD è -1).

| Keyword | Volume | KD | Intento | Chi si posiziona (pos.) | Tipo di pagina che vince |
|---|---|---|---|---|---|
| calcolo stipendio netto | 49.500 | 20 | informational | calcolastipendionetto.it (1), pmi.it (2), coverflex.com (3), stipendee.it (4) | Homepage calcolatore mono-tema / editoriale con simulatore embedded |
| calcolatore stipendio netto | 49.500 | 20 | informational | calcolastipendionetto.it (1) | idem |
| calcolare stipendio netto | 49.500 | 20 | informational | calcolastipendionetto.it (1) | idem |
| stipendio netto lordo | 14.800 | 3 | informational | calcolastipendionetto.it (1), coverflex.com (2) | Homepage calcolatore |
| stipendio netto e lordo | 14.800 | 20 | informational | coverflex.com (2), stipendee.it (3) | idem |
| stipendio netto da lordo | 14.800 | non disp. | informational | calcolastipendionetto.it (1) | idem |
| stipendio lordo netto | 14.800 | 3 | informational | calcolastipendionetto.it (1) | idem |
| stipendio lordo e netto | 14.800 | 20 | informational | calcolastipendionetto.it (2/3) | idem |
| stipendio lordo da netto | 14.800 | 5 | informational | stipendee.it (8) | idem |
| stipendio da lordo a netto | 14.800 | 5 | informational | calcolastipendionetto.it (1) | idem |
| lordo netto stipendio | 14.800 | 20 | informational | calcolastipendionetto.it (1) | idem |
| netto lordo | 12.100 | 3 | informational | calcolastipendionetto.it (1) | idem |
| lordo netto | 12.100 | 3 | informational | calcolastipendionetto.it (1) | idem |
| lordo a netto | 12.100 | 20 | informational | calcolastipendionetto.it (1) | idem |
| calcolo lordo dal netto | 12.100 | 5 | informational | calcolastipendionetto.it (1), stipendee.it (8) | idem |
| stipendio netto | 9.900 | 20 | informational | calcolastipendionetto.it (1) | idem |
| retribuzione | 9.900 | 16 | informational | calcolastipendionetto.it (30, debole) | non presidiata bene da nessuno del set |
| calcolo lordo netto | 9.900 | 3 | informational | calcolastipendionetto.it (1), stipendee.it (3) | idem |
| ral calcolo | 8.100 | 5 | informational | calcolastipendionetto.it (2), stipendee.it (1) | idem |
| da lordo a netto | 8.100 | 5 | informational | calcolastipendionetto.it (1) | idem |
| calcolatore ral | 8.100 | 20 | informational | calcolastipendionetto.it (2) | idem |
| naspi | 135.000 | 16 | informational | stipendee.it (30, debole) | Contenuto istituzionale-simile (INPS domina realmente, fuori dal nostro set) |
| busta paga | 74.000 | non disp. | navigational | bustaia.it (18), stipendee.it (54) | Homepage brand ("bustaia" match navigazionale) |
| buste paga | 74.000 | non disp. | informational | bustaia.it (35) | idem |
| tfr | 74.000 | 3 | informational | coverflex.com (20, debole) | Nessuno del set domina davvero (probabile dominanza INPS/wikipedia fuori set) |
| ral 30000 stipendio netto | 1.600 | non disp. | informational | stipendee.it (1 in SERP live), calcolastipendionetto.it (2), calcolonetto.it (5), stipendionettocalcolatore.it (7 con pagina dedicata) | Pagina/hub calcolatore con richiamo diretto all'importo in title/H1; AI Overview attivo, cita stipendee.it e pmi.it |
| 2000 euro lordi quanto sono netti | 1.600 | non disp. | informational | calcolastipendionetto.it (3), bustaia.it (4, pagina dedicata `/strumenti/2000-lordo-quanto-netto`) | Pagina programmatica per importo mensile |
| 1800/1700/1600 lordi quanto sono netti | 1.600 ciascuna | 1/non disp. | informational | calcolastipendionetto.it (10-21, posizioni deboli) | Nessuno ha una pagina dedicata a questi importi specifici — gap |
| 1500 euro lordi quanto sono netti | 480 | non disp. | informational | bustaia.it (3, con AI Overview citante `/strumenti/1500-lordo-quanto-netto`), partitaiva.it (4), jethr.com (5), dalordoanetto.com (8) | Pagina programmatica per importo mensile con breakdown voce-per-voce |
| 40000/35000/30000 euro lordi quanto sono netti | 1.300 ciascuna | 20 | informational | calcolastipendionetto.it (2-4) | Homepage calcolatore (nessuna pagina per-importo dedicata su questo dominio) |
| 28000/25000 euro lordi quanto sono netti | 1.000 ciascuna | 20 | informational | calcolastipendionetto.it (3) | idem |
| 50000/45000 euro lordi quanto sono netti | 880 ciascuna | 20 | informational | calcolastipendionetto.it (3-4) | idem |
| ral 45000 stipendio netto | 1.000 | non disp. | informational | calcolastipendionetto.it (3) | Homepage |
| ral 35000 stipendio netto (+ "14 mensilità") | 1.000 | non disp. | informational | calcolastipendionetto.it (17-18, debole) | Nessuno forte — gap parziale |
| ral 25000 stipendio netto | 1.000 | 20 | informational | stipendee.it (1), calcolastipendionetto.it (2) | idem |
| ccnl metalmeccanici / ccnl metalmeccanico | 27.100 ciascuna | 2/non disp. | navigational | bustaia.it (29-61, debole), coverflex.com (6, con blog dedicato) | Guida editoriale lunga sul CCNL (nessun calcolatore per livello) |
| contratto collettivo nazionale di lavoro | 49.500 | 14 | informational | coverflex.com (19) | idem |
| metalmeccanico livelli / livelli metalmeccanici | 14.800 ciascuna | non disp. | informational/transactional | coverflex.com (15-28) | idem |
| 5 livello metalmeccanico stipendio netto | 1.900 | non disp. | informational | bustaia.it (49, debole) | Guida CCNL generica, nessuna riga dedicata al netto per livello — gap concreto |
| stipendio netto 5 livello commercio 40 ore netto | 1.300 | non disp. | informational | calcolastipendionetto.it/stipendee.it (20-22, deboli) | Nessuno presidia bene — gap (incrocio livello CCNL + ore) |
| tredicesima | 9.900 | non disp. | informational | bustaia.it (28, debole nonostante l'articolo dedicato) | Articolo lungo con formula e casi particolari |
| la tredicesima quando arriva | 12.100 | non disp. | informational | bustaia.it (11) | idem |
| come si calcola la tredicesima | 8.100 | non disp. | informational | bustaia.it (50, debole) | idem |
| scaglioni irpef 2026 / 2025 | 40.500 ciascuna | non disp. | informational | coverflex.com (30-39, debole) | Blog normativo con tabella aliquote |
| aliquote irpef 2026 / 2025 | 40.500 ciascuna | non disp. | informational | coverflex.com (35-42) | idem |
| tassazione tfr | 9.900 | non disp. | informational | coverflex.com (6), bustaia.it (39) | Blog normativo |
| bonus mamme | 27.100 | 5 | informational | coverflex.com (47, debole) | Blog dedicato (fuori dal core "lordo→netto") |
| bonus asilo nido | 22.200 | 1 | informational | coverflex.com (28) | idem |
| cuneo fiscale | volume non isolato nel campione (presente come frase dentro pagine, non come riga keyword top-200) | — | — | bustaia.it (`/strumenti/cuneo-fiscale`, ETV 13) | Micro-tool dedicato, traffico ancora basso |
| dal netto al lordo | 1.600 | 5 | informational | calcolastipendionetto.it (4) | Homepage, nessuna pagina dedicata al calcolo inverso tra i 4 domini principali |
| tabella lordo netto | 4.400 | 5 | informational | stipendee.it (7) | Homepage/related search ricorrente in quasi ogni SERP controllata |
| tabella netto lordo | 4.400 | non disp. | informational | stipendee.it (17) | idem |
| naspi inps / inps naspi | 49.500 / 40.500 | 18 | informational/navigational | stipendee.it (29-30, debole) | Pagina guida NASPI generica |
| calcolatore tfr | 12.100 | non disp. | informational | bustaia.it (27, `/strumenti/calcolo-tfr`) | Micro-calcolatore dedicato |
| cedolino / cedolini | 12.100 ciascuna | 10/4 | informational | bustaia.it (21-25, `/cedolino-online`) | Servizio/landing per consultazione cedolino online |
| preavviso dimissioni | 8.100 | non disp. | informational | stipendee.it (9) | Articolo guida pratico |
| welfare aziendale | 27.100 | non disp. | informational | coverflex.com (11) | Blog + prodotto (Coverflex vende welfare aziendale) |
| stipendio part-time 20 ore netto | 720 | non disp. | informational | calcolastipendionetto.it (26, debole) | Nessuno presidia bene — gap |
| stipendio medio netto italia / italiano | 3.600 ciascuna | 4-6 | informational | calcolastipendionetto.it (38-50, debole) | Nessuno presidia bene — gap |

## 5. Anatomia delle pagine vincenti

Letture dirette (WebFetch) di calcolastipendionetto.it, bustaia.it/strumenti/1500-lordo-quanto-netto, coverflex.com/it/calcolo-stipendio-netto. La pagina PMI.it ha risposto **403 Forbidden** a WebFetch: non letta, dati limitati alla SERP snippet.

**calcolastipendionetto.it (homepage, mono-pagina, #1 su ~50 varianti dell'head term)**
- Calcolatore sopra la piega, con campi: RAL, regione (20 opzioni), mensilità (12-15), toggle apprendistato, tipo impiego, giorni lavorati, figli a carico, coniuge/familiari, bonus €100, welfare/fringe benefit.
- ~1.100-1.200 parole di contenuto editoriale sotto il tool, organizzato in sezioni tipo "Come funziona il calcolo", "Cuneo fiscale 2026", "Detrazioni 2026", "Part-time", "Apprendistato" — niente FAQ in formato accordion classico, ma struttura a domande nei titoli.
- Monetizzazione: messaggio anti-adblock visibile, nessun affiliate/prodotto secondario.
- Citazioni normative generiche a INPS/IRPEF/CCNL, nessun link diretto a fonti primarie nel contenuto fornito.

**bustaia.it/strumenti/1500-lordo-quanto-netto (pagina programmatica per importo mensile)**
- Calcolatore sopra la piega con risultato già pre-calcolato in pagina (1.500€ → 1.306€ netti) e breakdown per voce (INPS, IRPEF, addizionali, trattamento integrativo).
- ~1.800-2.000 parole, sezioni per ogni voce di trattenuta + "Chi guadagna circa 1.500€ lordi al mese?", "Ruoli tipici", "CCNL più frequenti", "Confronto con la media italiana", FAQ dedicata.
- Link a 6 varianti di importo (1.000/2.000/2.500/3.000/3.500/4.000€), a guide CCNL, blog su lettura busta paga/TFR, e cross-link a prodotti BustaIA (Studio, BustaChiara, tier "per consulenti").
- Monetizzazione: freemium — calcolatore gratis, upsell verso analisi AI della busta paga reale ("Prova gratis") e tier professionale.
- Cita esplicitamente: Osservatorio INPS lavoratori privati, Agenzia delle Entrate (aliquote IRPEF 2026), Normattiva (Legge di Bilancio 2026); disclaimer che il tool "usa Claude AI" ed è informativo, non sostituisce consulenza del lavoro.

**coverflex.com/it/calcolo-stipendio-netto**
- Calcolatore sopra la piega dopo una breve intro.
- ~800-1.000 parole, sezioni: welfare aziendale, due blocchi FAQ distinti, "Articoli consigliati", "Scopri anche gli altri calcolatori", loghi/statistiche clienti (18.000+ aziende).
- CTA principali: "Calcola ora", "Scopri di più", richiesta demo/consulenza, iscrizione azienda.
- Nessuna citazione esplicita di fonti normative nel testo estratto — il calcolatore appare sviluppato internamente senza riferimento a documentazione ufficiale in pagina.

**PMI.it** — non letta (403). Dalla SERP snippet: titolo "Calcolo stipendio netto da lordo e RAL: regole 2026 e 2027", ancore interne "Come si calcola lo stipendio netto dal lordo nel 2026" e "Domande frequenti (FAQ)", quindi presumibilmente struttura editoriale con FAQ e simulatore embedded — non verificato oltre lo snippet.

## 6. Le lacune (dove la SERP è debole e c'è domanda)

1. **Importi mensili "rotondi ma non standard"** (1.400/1.600/1.700/1.800€ lordi): volume reale (1.600 ricerche/mese ciascuno secondo DataForSEO) ma nessuno dei 4 domini principali ha una pagina dedicata — solo homepage generiche in posizione 10-28. bustaia.it e dalordoanetto.com coprono solo una manciata di importi (1000/1500/2000/2500/3000/3500/4000/5000 su bustaia; 1400/1500/30000 su dalordoanetto). C'è spazio per una serie più fitta.
2. **Calcolo inverso netto→lordo**: nessun competitor forte ha una pagina o serie dedicata; solo un tool istituzionale non ottimizzato SEO (hsweba34.inaz.it) e una singola pagina debole su dalordoanetto.com.
3. **CCNL × livello × netto**: tutti i competitor trattano il CCNL come guida editoriale (retribuzioni lorde tabellari), non come calcolatore che restituisce il netto per livello. Query come "5 livello metalmeccanico stipendio netto" o "stipendio netto 5 livello commercio 40 ore netto" hanno domanda reale (1.300-1.900 vol) e nessuno risponde bene (posizioni 20-54).
4. **Confronto offerte di lavoro**: zero domini tracciati compaiono per questo pattern di query — coerente con l'hub `/confronti-ral/` già esistente di dovevalatuaral, che potrebbe diventare un vero differenziatore se sviluppato prima che un competitor lo presidi.
5. **Part-time e ore ridotte**: quasi assente nel set di competitor (1 solo riscontro nel campione, posizione debole).
6. **"Retribuzione" e "stipendio medio netto Italia"**: volume non trascurabile (9.900 e 3.600) intercettato solo debolmente dalla homepage di calcolastipendionetto.it — spazio per un articolo di benchmark.
7. **jethr.com come concorrente sottovalutato**: secondo per ETV di dominio (105.578) dopo coverflex, con un ampio ventaglio di `/strumenti/` oltre al calcolatore netto (IRPEF, CCNL-RAL-livello, fringe benefit auto, costo azienda) — merita un pull di `ranked_keywords` dedicato in un secondo giro, non fatto in questa run per vincolo di scope.

## 7. Raccolta grezza delle People Also Ask

Da `serp_organic_live_advanced` con `people_also_ask_click_depth: 2` su 3 query (gli "expanded_element" erano AI Overview asincroni, non leggibili in questa chiamata — riporto solo i titoli delle domande PAA, non le risposte espanse).

**"calcolo stipendio netto"** — nessun blocco PAA nella SERP (solo related searches: Calcolo stipendio netto mensile 2026, Calcolo stipendio netto affidabile, Calcolo stipendio netto da RAL, Tabella lordo netto, Calcolo stipendio netto da lordo, Calcolo stipendio netto part-time, Calcolo stipendio netto Repubblica, Calcolo stipendio netto pmi).

**"ral 30000 stipendio netto"**:
- Quanti sono 30 mila euro di RAL?
- Qual è il netto di 30000 euro lordi?
- Quanto sono €30.000 lordi l'anno?
- La RAL di 30.000 euro è buona?
- Quanto RAL devo avere per avere 2000 € netti al mese?
- Quanto guadagna un lavoratore con RAL 30.000 nel CCNL Commercio?
- Quanto sono 30.000 euro netti all'anno?
- Quanto guadagna netto un 4 livello commercio?
- Quanto costa all'azienda un dipendente con RAL di 30.000 euro?

**"1500 euro lordi quanto sono netti"**:
- Quanto sono €1500 lordi?
- Con una pensione lorda di 1500 euro, quanto sarà il netto?
- Quanto è 1550 lordi al netto?
- Quanto costa un dipendente che prende 1500 € netti?
- Quanto è 1500 lordi in netto?
- 1500 euro è un buon stipendio?
- Dove si vive bene con 1500 euro al mese?
- Qual è lo stipendio minimo per vivere bene?
- È possibile vivere con 1200 euro al mese da solo?

**"ccnl metalmeccanici stipendio netto"**:
- Quanto guadagna un CCNL metalmeccanico?
- Quanti euro netti guadagna un metalmeccanico con 2.000 euro lordi al mese?
- Quanto guadagna un C3 netto?
- Quanti euro netti sono 30.000 euro lordi per un metalmeccanico?

**"calcolo tredicesima"**:
- Come si calcola la 13esima?
- Quanto è la tredicesima di 1.500 euro nette al mese?
- Come si calcola la tredicesima mensile?
- Come si calcola la tredicesima oraria?

**"quanto prendo di netto"**:
- Come capire quanto prendo di netto?
- Quanti sono 2000 € lordi al netto?
- Quanto è il netto di 1.200 euro lordi?
- Quanto è il netto di 1.500 euro lordi?

**Osservazione trasversale**: su 5 delle 6 query controllate compare un **AI Overview** di Google che cita esplicitamente calcolastipendionetto.it, stipendee.it, pmi.it, bustaia.it, jethr.com e calcolonetto.it come fonti — nessuna fonte istituzionale (INPS, Agenzia Entrate) è citata direttamente nell'AI Overview stesso, il che apre uno spazio competitivo per un sito percepito come più autorevole/normativo (coerente col posizionamento dichiarato di dovevalatuaral, "fonti normative citate").

## 8. Cosa NON hai verificato

- Non ho letto la coda lunga oltre le top 200 keyword per volume per ciascuno dei 4 domini principali (l'universo reale arriva a 705-6.428 keyword per dominio).
- Non ho estratto `ranked_keywords` per jethr.com, nettostipendio.com, stipendionettocalcolatore.it, dalordoanetto.com, calculator.graber-partner.com, calcolonetto.it — solo `domain_rank_overview` e, per alcuni, `relevant_pages`.
- Non ho letto la pagina PMI.it (403 su WebFetch) — dati solo da snippet SERP.
- Non ho verificato il volume di ricerca esatto per i cluster "confronto offerte di lavoro", "aumento contrattuale", "netto a lordo" generico, "part-time stipendio netto calcolo": ho solo confermato che nessun dominio del set si posiziona per quei pattern via `serp_competitors` — non ho interrogato `keyword_overview`/`search_volume` dedicato, quindi il volume resta "non disponibile", non zero.
- Non ho verificato cosa cita realmente l'AI Overview asincrono nei blocchi PAA (le risposte espanse non sono state restituite dall'endpoint, solo i titoli delle domande).
- Non ho verificato la natura esatta di calculator.graber-partner.com (probabile tool white-label, non confermato) né di calcolonetto.it (non isolato in questa run).
- Non ho verificato con strumenti di traffico terzi (Similarweb) i numeri: il connettore Similarweb configurato nell'ambiente **non si è connesso** (errore di Dynamic Client Registration) — tutte le cifre di traffico in questo report sono stime DataForSEO, non dati Similarweb/Analytics reali.
- Il numero "zero keyword posizionate" per dovevalatuaral.com riportato nel brief è stato confermato via `domain_rank_overview` (nessun item restituito), ma non ho controllato Search Console direttamente in questa run.
