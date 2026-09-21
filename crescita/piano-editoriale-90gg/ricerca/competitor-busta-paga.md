# Teardown SEO — territorio "busta paga spiegata / lettura cedolino"

> **Documento collegato:** `competitor-occupanti-reali.md` (stessa data) analizza i domini che occupano davvero le posizioni 1-10 — Zeta Service, Factorial, Randstad, Indeed, Jet HR, Skello — e **corregge la lacuna L5 (colf/badanti)**, qui sopravvalutata. Leggere i due insieme.

**Rilevazione: 20 settembre 2026.** Analista: sessione agent SEO per `dovevalatuaral.com`.
Complementare a RIC-70 (reverse engineering strutturale dei concorrenti, 19/09/2026): quel documento copre stack, modello di business e superficie di pagine. Questo copre **keyword, pagine che reggono il traffico, SERP e lacune**.

---

## 1. Metodo, endpoint, limiti

### Endpoint DataForSEO usati (tutti `location_name: "Italy"`, `language_code: "it"`)

| Endpoint | Target / seed | Risultato |
|---|---|---|
| `dataforseo_labs_google_ranked_keywords` | `bustaia.it` (limit 300 + 500 offset 300, order by ETV desc) | 800 righe estratte; **`total_count` = 2.395** keyword posizionate |
| `dataforseo_labs_google_ranked_keywords` | `chiediagioia.it` (limit 100) | 100 righe; `total_count` = **337** |
| `dataforseo_labs_google_ranked_keywords` | `cedolingo.com` (limit 40) | 40 righe; `total_count` = **64** |
| `dataforseo_labs_google_relevant_pages` | `bustaia.it` (limit 80) | **56 URL** con metriche organiche |
| `dataforseo_labs_google_keyword_suggestions` | `busta paga` (400), `cedolino` (250), `trattenute busta paga` (200) | pool di domanda |
| `dataforseo_labs_google_related_keywords` | `come leggere la busta paga` (depth 3, limit 200) | pool di domanda |
| `dataforseo_labs_google_keyword_overview` | 20 keyword del territorio core | volumi, trend 12 mesi, intento |
| `dataforseo_labs_bulk_keyword_difficulty` | 50 keyword del territorio core | KD |
| `serp_organic_live_advanced` | 5 query (vedi §6), `people_also_ask_click_depth: 2` su 4 | SERP osservate dal vivo |
| `on_page` / WebFetch | 5 pagine concorrenti | anatomia contenuti |

Pool di domanda unificato dopo deduplica: **788 keyword grezze → 653 dopo normalizzazione**.

### Limiti dichiarati — leggere prima dei numeri

1. **KD quasi assente in `ranked_keywords`.** Su 300 item del primo batch, **267 non avevano `keyword_difficulty`**. Ho recuperato la KD con una chiamata `bulk_keyword_difficulty` dedicata sulle 50 keyword core. Dove manca, la tabella riporta `—`, non una stima.
2. **Deduplica per insieme di token.** DataForSEO restituisce molte varianti d'ordine con volume identico ("metalmeccanici livelli" / "livelli metalmeccanici" / "metalmeccanico livelli", tutte 14.800). Ho collassato le varianti ordinando i token e tenendo la riga con ETV più alto. **Anche così i volumi di cluster sono gonfiati** — Google Keyword Planner raggruppa keyword semanticamente identiche sullo stesso volume. Trattare i totali di cluster come **ordini di grandezza relativi**, non come traffico ottenibile.
3. **Discrepanza con RIC-70.** Il 19/09 la stima era 1.384 keyword per bustaia.it; oggi `total_count` è **2.395**. Non so se sia crescita reale, differenza di filtri (qui `item_types: ["organic","featured_snippet"]`) o aggiornamento del database DataForSEO. **Non risolta.**
4. **Stima fornitore vs SERP osservata.** Volumi, ETV e KD sono **stime DataForSEO**. Posizioni, AI Overview, PAA e composizione della SERP nelle 5 query di §6 sono **osservati dal vivo il 20/09/2026**. Il documento lo segnala ovunque sia rilevante.
5. **PAA senza risposte.** Con `people_also_ask_click_depth: 2` Google ha restituito `asynchronous_ai_overview: true` per ogni elemento: **ho le domande, non i testi delle risposte**. Per il piano editoriale le domande bastano.
6. **5 keyword senza dati.** `busta paga spiegata`, `significato voci busta paga`, `come controllare se la busta paga è corretta`, `perché lo stipendio è più basso`, `stipendio più basso del solito` sono state **omesse da `keyword_overview`**: il database non le contiene. Volume **non disponibile** — non inventato.
7. Niente account creati, nessun documento caricato, nessun endpoint privato sondato.

---

## 2. I cluster tematici

### 2a. Dove sta davvero il traffico di BustaIA

Clustering delle **708 keyword deduplicate** di bustaia.it. `ETV` = traffico organico stimato/mese attribuito dal fornitore.

| Cluster | n. kw | Volume tot. (gonfiato) | ETV | KD medio | Pos. mediana | Pagina principale |
|---|---|---|---|---|---|---|
| CCNL & livelli/tabelle | 396 | 688.340 | **6.615** | 3,6 | 13 | `/guida-ccnl/metalmeccanici` |
| Busta paga generica / online | 48 | 236.320 | 1.120 | 8,1 | 14 | `/cedolino-online` |
| Lordo→netto & calcolatori | 55 | 215.900 | 1.757 | 13,8 | 13 | `/strumenti/*-lordo-quanto-netto` |
| Non classificato | 92 | 118.060 | 863 | 14,6 | 17 | `/guida-ccnl/sanita` |
| Mensilità aggiuntive (13ª/14ª) | 33 | 106.440 | 501 | n.d. | 40 | `/blog/tredicesima-come-si-calcola` |
| TFR | 22 | 54.230 | 187 | 1,0 | 29 | `/strumenti/calcolo-tfr` |
| NASpI / cessazione | 23 | 31.620 | 187 | 5,5 | 25 | `/strumenti/calcolo-naspi` |
| Trattenute / contributi / IRPEF | 16 | 22.590 | 147 | n.d. | 19 | `/blog/trattenute-busta-paga-cosa-sono` |
| **Lettura/controllo cedolino** | **13** | **14.080** | **1.050** | n.d. | **2** | `/` (homepage) |
| Bonus & welfare | 2 | 13.400 | 28 | n.d. | 49 | `/blog/detassazione-...` |
| Glossario / codici / sigle | 6 | 10.200 | 65 | 8,0 | 58 | `/blog/codice-ccnl-busta-paga-2026` |
| Straordinari / maggiorazioni | 2 | 4.800 | 10 | n.d. | 50 | `/blog/straordinari-...` |

**Il dato che ribalta la lettura del concorrente.** BustaIA vende "ti spiego la busta paga", ma il **53% del suo traffico organico stimato viene da pagine CCNL** (ETV 6.615 su 12.530 totali nei cluster). Il cluster che coincide con il prodotto — lettura e controllo del cedolino — vale **1.050 di ETV (8,4%) su appena 13 keyword**, e quasi tutto arriva dalla homepage posizionata #2 su quattro varianti di "controllo busta paga online (gratis)".

**BustaIA non è un editore di contenuti sulla busta paga. È un aggregatore di query CCNL con un prodotto attaccato.** Da `relevant_pages`, le 14 pagine `/guida-ccnl/` valgono insieme **4.815 di ETV**: `/guida-ccnl/metalmeccanici` da sola fa 1.562 su 242 keyword, più della homepage (1.017).

Il loro articolo dedicato alla lettura del cedolino, `/blog/come-leggere-la-busta-paga`, **fa 8,3 di ETV** con posizioni tra la 31ª e la 90ª. Sul tema che dà il nome al prodotto, il loro contenuto non esiste per Google.

### 2b. La domanda reale del territorio, e chi la copre

Clustering delle **653 keyword** del pool di domanda, incrociate con le posizioni di bustaia.it. "Gap" = BustaIA **non è in top 20**.

| Cluster (domanda) | n. kw | Volume tot. | KD medio | n. gap | Volume gap | % gap |
|---|---|---|---|---|---|---|
| Trattenute / IRPEF / addizionali | 141 | 556.670 | 20,8 | 134 | 551.450 | 99% |
| Busta paga online / dove trovarla | 55 | 413.830 | 7,0 | 54 | 408.430 | 98% |
| Non classificato | 259 | 427.100 | 14,1 | 255 | 350.410 | 82% |
| NASpI / cessazione / pensione | 23 | 287.790 | 8,7 | 23 | 287.790 | 100% |
| **Lettura / comprensione cedolino** | **51** | **40.600** | **7,5** | **48** | **39.430** | **97%** |
| Detrazioni / conguaglio / 730 | 20 | 17.410 | 3,7 | 20 | 17.410 | 100% |
| TFR / ratei / accantonamenti | 4 | 12.000 | n.d. | 4 | 12.000 | 100% |
| Lordo→netto / calcolatori | 16 | 11.450 | 12,5 | 16 | 11.450 | 100% |
| Bonus / welfare / normativa | 9 | 10.560 | n.d. | 9 | 10.560 | 100% |
| Ferie / permessi / ROL / malattia | 25 | 7.870 | 47,0 | 25 | 7.870 | 100% |
| Categorie professionali (colf, badanti…) | 11 | 7.140 | 1,0 | 11 | 7.140 | 100% |
| Glossario / sigle / codici | 20 | 6.470 | 35,0 | 19 | 6.330 | 97% |
| Straordinari / trasferte / ex festività | 7 | 4.860 | 11,0 | 7 | 4.860 | 100% |
| Controllo / errori / sintomi | 6 | 3.120 | n.d. | 3 | 1.440 | 46% |
| 13ª/14ª in busta paga | 3 | 1.260 | n.d. | 3 | 1.260 | 100% |

⚠️ **Attenzione: i primi quattro cluster sono in larga parte domanda NON indirizzabile.** L'ho verificata riga per riga:

- `trattenute/IRPEF` (556k): dominato da **"cedolino INPS pensione"** — 135.000 + 135.000 + 60.500 + decine di varianti mensili. Sono **pensionati che cercano il cedolino INPS**, non dipendenti che vogliono capire una trattenuta. Query navigazionale verso `inps.it`.
- `busta paga online` (413k): dominato da **"cedolino NoiPA" (301.000)** e varianti login/SPID/area riservata. È il portale stipendi della PA. Navigazionale puro.
- `non classificato` (427k): **"prestiti senza busta paga"** (18.100 ×4), **"zucchetti login"** (22.200), `adp login busta paga`, `cedolino iperal`. Credito al consumo e login a gestionali.
- `NASpI/pensione` (287k): **"cedolino pensione"** (74.000 ×3) più varianti mensili. Di nuovo INPS.

**Tolto questo rumore, la domanda realmente indirizzabile del territorio "capire il mio cedolino" vale circa 100-120k ricerche/mese lorde di volume gonfiato**, concentrata nei cluster dal quinto in giù. È un mercato più piccolo di quanto i totali grezzi suggeriscano. Va detto all'orchestratore prima che dimensioni un piano da 90 articoli su numeri sbagliati.

### 2c. Il trend, che è la notizia peggiore

Da `keyword_overview`, andamento a 12 mesi delle keyword core:

| Keyword | Vol. attuale | Trend annuo | Picco (gen 2026) |
|---|---|---|---|
| come leggere la busta paga | 3.600 | **−47%** | 5.400 |
| come si legge la busta paga | 1.600 | **−38%** | 2.400 |
| voci busta paga | 320 | **−47%** | 480 |
| codici busta paga | 260 | **−47%** | 480 |
| busta paga spiegazione voci | 590 | −19% | 880 |
| troppe trattenute in busta paga | 390 | **−65%** | 720 |
| come leggere il cedolino | 110 | −36% | 170 |
| esempio busta paga | 1.600 | −23% | 1.600 |
| errori busta paga | 20 | −50% | 30 |

**L'intero cluster informativo "spiegami la busta paga" sta perdendo il 35-65% di volume su base annua.** Coerente con quanto ho osservato nelle SERP: Google mette un AI Overview esaustivo su 4 query su 5 e la domanda semplice non arriva più al click. Fa eccezione **`esempio busta paga` (−23%, stabile a 1.600)**: le query che chiedono un **artefatto** (un esempio concreto, un documento, un numero) tengono meglio di quelle che chiedono una spiegazione.

**Implicazione diretta sul piano editoriale: 90 articoli che spiegano concetti sono 90 articoli su un mercato in contrazione, che l'AI Overview intercetta prima.** La raccomandazione operativa in §6 parte da qui.

---

## 3. Top 74 keyword del territorio indirizzabile

Escluse le query navigazionali INPS/NoiPA/Zucchetti e il credito al consumo. Volume e KD = **stima DataForSEO**; posizione BustaIA = **dal suo profilo ranked keywords, 20/09/2026**.

| # | Keyword | Vol/mese | KD | Intento | BustaIA oggi | URL BustaIA | Altri competitor top-20 |
|---|---|---|---|---|---|---|---|
| 1 | busta paga | 74000 | — | navigational | pos 18 | / | — |
| 2 | cedolino | 12100 | 10 | informational | pos 25 | /cedolino-online | — |
| 3 | calcolatore tfr | 12100 | — | informational | pos 27 | /strumenti/calcolo-tfr | — |
| 4 | cedolini | 12100 | 4 | informational | pos 21 | /cedolino-online | — |
| 5 | la tredicesima quando arriva | 12100 | — | informational | pos 11 | /blog/tredicesima-come-si-calcola | — |
| 6 | tfr come calcolarlo | 12100 | — | informational | pos 97 | /strumenti/calcolo-tfr | — |
| 7 | tassazione tfr | 9900 | — | informational | pos 37 | /blog/tfr-trattamento-fine-rapporto | — |
| 8 | tredicesima | 9900 | — | informational | pos 28 | /blog/tredicesima-come-si-calcola | — |
| 9 | calcolo tfr | 8100 | 1 | informational | pos 40 | /strumenti/calcolo-tfr | — |
| 10 | come si calcola la tredicesima | 8100 | — | informational | pos 50 | /blog/tredicesima-come-si-calcola | — |
| 11 | tredicesima detassata | 8100 | — | informational | pos 76 | /blog/tredicesima-tassata-di-piu-falso | — |
| 12 | tredicesima mensilità | 8100 | — | informational | pos 36 | /blog/tredicesima-come-si-calcola | — |
| 13 | tassazione tredicesima | 6600 | — | informational | pos 31 | /blog/tredicesima-tassata-di-piu-falso | — |
| 14 | bonus benzina busta paga | 5400 | — | informational | non posiz. | — | — |
| 15 | busta paga tfr | 5400 | — | informational | non posiz. | — | — |
| 16 | cedolino online | 5400 | 3 | navigational | pos 14 | /cedolino-online | — |
| 17 | tfr in busta paga | 5400 | 0 | navigational | non posiz. | — | — |
| 18 | calcolare la tredicesima | 5400 | — | informational | pos 84 | /blog/tredicesima-come-si-calcola | — |
| 19 | calcolare tredicesima | 5400 | — | informational | pos 84 | /blog/tredicesima-come-si-calcola | — |
| 20 | calcolatore tredicesima | 5400 | — | informational | pos 69 | /blog/tredicesima-come-si-calcola | — |
| 21 | calcola tredicesima | 5400 | — | informational | pos 71 | /blog/tredicesima-come-si-calcola | — |
| 22 | calcolo della tredicesima | 5400 | — | informational | pos 86 | /blog/tredicesima-come-si-calcola | — |
| 23 | calcolo tredicesima | 5400 | — | informational | pos 82 | /blog/tredicesima-come-si-calcola | — |
| 24 | busta paga online | 4400 | 3 | navigational | pos 33 | / | — |
| 25 | busta paga come leggere | 3600 | — | informational | pos 60 | /blog/come-leggere-la-busta-paga | — |
| 26 | busta paga come leggerla | 3600 | — | informational | non posiz. | — | — |
| 27 | come leggere la busta paga | 3600 | 0 | informational | non posiz. | — | — |
| 28 | come leggere una busta paga | 3600 | 0 | informational | pos 55 | /blog/come-leggere-la-busta-paga | — |
| 29 | calcolo tfr online | 3600 | — | informational | pos 19 | /strumenti/calcolo-tfr | — |
| 30 | tredicesima quando si prende | 3600 | — | informational | pos 40 | /blog/tredicesima-come-si-calcola | — |
| 31 | calcolatore online tfr | 2900 | — | informational | pos 14 | /strumenti/calcolo-tfr | — |
| 32 | arretrati contratto medici quando in busta paga 2025 | 2400 | — | informational | non posiz. | — | — |
| 33 | busta paga contributo ivs | 2400 | — | informational | non posiz. | — | — |
| 34 | cedolino asp catania | 2400 | — | navigational | non posiz. | — | — |
| 35 | cedolino asp ct | 2400 | — | navigational | non posiz. | — | — |
| 36 | cedolino daces | 2400 | — | informational | non posiz. | — | — |
| 37 | conguaglio busta paga | 2400 | 0 | informational | non posiz. | — | — |
| 38 | conguaglio busta paga gennaio 2026 | 2400 | — | transactional | non posiz. | — | — |
| 39 | conguaglio in busta paga | 2400 | 0 | informational | non posiz. | — | — |
| 40 | contributi ivs busta paga | 2400 | — | informational | non posiz. | — | — |
| 41 | contributo ivs in busta paga | 2400 | — | informational | non posiz. | — | — |
| 42 | come si calcola la quattordicesima | 2400 | — | informational | pos 103 | /blog/quattordicesima-come-si-calcola | — |
| 43 | straordinari tassazione | 2400 | — | informational | pos 40 | /blog/straordinari-busta-paga-come-funziona | — |
| 44 | tassazione straordinario | 2400 | — | informational | pos 50 | /blog/straordinari-busta-paga-come-funziona | — |
| 45 | asp rc cedolino | 1900 | 5 | informational | non posiz. | — | — |
| 46 | asprc cedolino | 1900 | 5 | informational | non posiz. | — | — |
| 47 | busta paga contingenza | 1900 | — | informational | pos 49 | /glossario | — |
| 48 | cedolino dicembre 2025 | 1900 | — | informational | non posiz. | — | — |
| 49 | cedolino noi pa | 1900 | 8 | informational | non posiz. | — | — |
| 50 | contingenza in busta paga | 1900 | — | informational | pos 58 | /glossario | — |
| 51 | contingenze busta paga | 1900 | — | informational | non posiz. | — | — |
| 52 | esempio busta paga con malattia | 1900 | 0 | informational | non posiz. | — | — |
| 53 | esempio busta paga liquidazione tfr | 1900 | 0 | informational | pos 40 | /blog/tfr-trattamento-fine-rapporto | — |
| 54 | pa stipendi cedolino | 1900 | 3 | informational | non posiz. | — | — |
| 55 | stipendio pubblica amministrazione cedolino | 1900 | 14 | informational | non posiz. | — | — |
| 56 | come calcolare la tredicesima | 1900 | — | informational | pos 33 | /blog/tredicesima-come-si-calcola | — |
| 57 | come calcolare tredicesima | 1900 | — | informational | pos 31 | /blog/tredicesima-come-si-calcola | — |
| 58 | come calcolo la tredicesima | 1900 | — | informational | pos 40 | /blog/tredicesima-come-si-calcola | — |
| 59 | come funziona il tfr | 1900 | — | informational | pos 33 | /blog/tfr-trattamento-fine-rapporto | — |
| 60 | tfr come funziona | 1900 | — | informational | pos 32 | /blog/tfr-trattamento-fine-rapporto | — |
| 61 | ama cedolino | 1600 | — | informational | non posiz. | — | — |
| 62 | ape busta paga | 1600 | — | informational | non posiz. | — | — |
| 63 | arretrati contratto medici quando in busta paga 2026 | 1600 | — | transactional | non posiz. | — | — |
| 64 | busta paga come si legge | 1600 | — | informational | non posiz. | — | — |
| 65 | busta paga esempio | 1600 | — | informational | non posiz. | — | — |
| 66 | busta paga forestale | 1600 | — | informational | non posiz. | — | — |
| 67 | busta paga trattenute | 1600 | — | informational | pos 21 | /blog/trattenute-busta-paga-cosa-sono | — |
| 68 | cedolino coop | 1600 | — | commercial | non posiz. | — | — |
| 69 | cedolino febbraio 2026 docenti | 1600 | — | transactional | non posiz. | — | — |
| 70 | cedolino sapienza | 1600 | — | informational | non posiz. | — | — |
| 71 | cedolino unina | 1600 | 11 | transactional | non posiz. | — | — |
| 72 | come si legge la busta paga | 1600 | 0 | informational | pos 53 | /blog/come-leggere-la-busta-paga | — |
| 73 | come si legge una busta paga | 1600 | — | informational | non posiz. | — | — |
| 74 | esempio di busta paga | 1600 | — | informational | non posiz. | — | — |

**Nota sulla KD.** Sulle 50 keyword core interrogate con `bulk_keyword_difficulty`, **44 hanno KD = 0**, due KD = 5 (`calcolatore busta paga`, `cessione del quinto busta paga`), quattro senza dato. KD 0 in DataForSEO significa che le pagine in top-10 hanno profili di backlink trascurabili: **il territorio non è difeso da link authority**. Non significa che sia facile: la difesa reale è l'AI Overview e la fiducia di brand (Indeed, Randstad, Ipsoa), che la KD non misura.

### Dove GioIA e Cedolingo sono davvero

Nessuno dei due compete su "lettura cedolino". Sono altrove:

- **GioIA (337 kw)**: il suo unico asset è `/detrazioni-fiscali`, che prende `detrazioni lavoro dipendente 2026` (5.400, pos 9) e varianti — ETV ~138. Poi `/strumenti/{1200,1300,1400}-euro-lordi-quanto-sono-netti` (pos 5) e `/articoli/part-time-commercio-busta-paga` su `esempio busta paga part time` (320, pos 5-6). Ha un `/glossario/{rol,tfr,irpef,inps}` che **non si posiziona** (pos 37-103). Conferma: il glossario da solo non basta.
- **Cedolingo (64 kw)**: praticamente fermo. L'unica cosa che porta traffico è `/blog/bonus-mamme-2025` (244 di ETV su una keyword da 74.000 in pos 21) e `/blog/malattia-durante-le-ferie` (dieci varianti di "malattia e ferie", pos 24-32). Il resto è la home in posizione 40-70 su query cedolino generiche. **Due articoli di attualità/casistica valgono più di tutto il suo sito.** Segnale utile.

---

## 4. Anatomia dei loro contenuti

Cinque pagine lette integralmente il 20/09/2026.

### `bustaia.it/come-verifichiamo` — la pagina di fiducia, ed è ottima
~1.200-1.400 parole. H2: "Il software calcola, l'AI spiega" → "Ogni parametro ha una fonte primaria e una data" → "L'intelligenza artificiale, dichiarata" → "I limiti, detti chiaramente".

Dichiara "Regole di calcolo 2026.2, aggiornate al 16/07/2026" e pubblica un **registro parametro-per-parametro con data**: IRPEF 08/05/2026, contributi INPS 08/05/2026, detrazioni e taglio del cuneo 16/07/2026, CCNL settoriali dal 02/08 al 22/08/2026. Fonti: Normattiva, Agenzia delle Entrate, INPS, MEF. Rimanda a `/fonti` per il registro completo.

Sulla privacy dichiara il comportamento del **fornitore del modello**, non del proprio sistema:
> "Nessuna conservazione di default. Prompt e output delle richieste API non vengono conservati di default dopo l'elaborazione e vengono in ogni caso cancellati automaticamente entro un massimo di 30 giorni"

**Questa è la crepa.** BustaIA garantisce la non conservazione *a valle* (Anthropic non conserva) ma il cedolino **esce comunque dal browser dell'utente, passa dal loro backend FastAPI e transita verso un'API di terze parti**. Hanno 5.193 utenti e 6.413 analisi in un database Supabase (dato RIC-70). Il loro messaggio è "ci puoi credere"; quello di Riccardo può essere "non devi crederci, il PDF non esce". Sono due affermazioni di natura diversa e la seconda è verificabile dall'utente.

CTA: 2, sobrie ("Controlla la tua busta paga" → `/analizza`, "Guarda la Doppia verifica in un referto d'esempio"). Nessun calcolatore embedded.

### `bustaia.it/blog/trattenute-busta-paga-cosa-sono` — il loro articolo migliore
~2.200-2.400 parole, 13 H2. È l'unico articolo del blog che regge traffico vero: **ETV 100, pos 6-20 su una dozzina di query** ("trattenute busta paga esempio" pos 6, "come capire se le trattenute in busta paga sono giuste" pos 8, "totale trattenute busta paga" pos 8).

Cosa fa bene: **tabella IRPEF a scaglioni, range addizionali regionali (0,70%-3,33%) e comunali (0-0,9%), tabella di incidenza delle trattenute per fascia di lordo, esempio numerico completo su 2.000 € lordi × 13 mensilità**. Tre fonti con data ("Fonti verificate il 28 agosto 2026"). Tono demistificante: *"Ma dove vanno quei soldi? Sono tutti 'tasse'? No, e capire la differenza è importante."*

Cosa fa male: **6 CTA + 1 verso BustaIA Studio in 2.300 parole**, nessun widget interattivo (rimanda sempre a strumenti esterni), **nessuna FAQ strutturata** nonostante la SERP di quella query abbia 9 PAA. Lascia sul tavolo lo schema FAQ.

### `bustaia.it/controllo/{sintomo}` — il format giusto, eseguito male
Pagina "Questo mese hai preso meno. Vediamo di quanto." (~650-700 parole). Struttura a diagnosi differenziale: form "Netto di solito" / "Netto di questo mese" → "Fai il conto" → quattro cause possibili (contributi variabili, conguaglio, assenze, errore di lettura). Link a tre sottopagine `/controllo/`, a `/quiz`, al glossario.

**Zero esempi numerici. Zero tabelle. Zero fonti citate. Zero data di aggiornamento.** 5 CTA in 700 parole. È il format più intelligente del sito — parte dal sintomo, non dal concetto — ed è il contenuto più sottile. **Questa è la lacuna più sfruttabile dell'intero teardown.**

### `bustaia.it/guida-ccnl/metalmeccanici` — la macchina che li tiene in piedi
~2.500-2.800 parole. Tabella a 9 livelli (D1 → A1) con minimo conglobato lordo (D1 1.784,94 €, A1 2.907,01 €) e **netto stimato come forchetta** (D1: 1.450-1.500 €), ogni riga linkata a `/strumenti/stipendio-netto-ccnl?ccnl=metalmeccanici&livello=X`. Rinnovo 22/11/2025 Federmeccanica-Assistal/Fim-Fiom-Uilm, vigenza 2025-2028, tranche giugno 2026 +53,17 € sul C3. "Aggiornato a settembre 2026". Form interattivo di verifica livello+lordo. 5 CTA.

Valutazione: **ibrida, ~7/10 di programmaticità**. Scheletro, FAQ e footer sono template; il corpo è redazionale. **Non cita il testo ufficiale del CCNL** — disclaimer "per i valori esatti consulta il testo del CCNL". Vulnerabile a chi linka la fonte primaria.

### `jethr.com/risorse/come-controllare-se-la-busta-paga-e-corretta` — il vero benchmark
Non è un concorrente di prodotto ma è **pos 3 su "controllo busta paga online gratis" e pos 4 su "come leggere la busta paga"**, ed è citato nell'AI Overview di entrambe. ~1.800-2.000 parole. Checklist operativa in **10 passi numerati**, poi "controlli di coerenza salva-tempo", poi "errori tipici".

Cita **normativa vera con estremi**: Legge 4/1953 sulla consegna del prospetto paga, art. 39 D.L. 112/2008 sul Libro Unico del Lavoro, D.M. 9 luglio 2008. Glossario implicito delle causali di assenza (FE, PR, MA, IF, MP). CTA soft, il prodotto arriva dopo il valore.

**Il suo limite, che è l'apertura per Riccardo: nessuna tabella numerica.** Su un articolo che promette di "rifare i conti", non c'è un solo conto rifatto.

### Sintesi dell'anatomia

| | Lunghezza | Numeri concreti | Fonti con data | Interattivo | CTA | FAQ schema |
|---|---|---|---|---|---|---|
| BustaIA `/come-verifichiamo` | 1.300 | no | **sì, per parametro** | no | 2 | no |
| BustaIA `/blog/trattenute` | 2.300 | **sì, forti** | sì (3) | no | **7** | no |
| BustaIA `/controllo/{sintomo}` | 680 | **no** | **no** | sì (form) | 5 | H3 pseudo-FAQ |
| BustaIA `/guida-ccnl/metalmeccanici` | 2.600 | sì (tabellari) | parziale | sì (form) | 5 | sì (template) |
| Jet HR checklist | 1.900 | **no** | **sì (leggi + DM)** | no | 3 | no |

Il pattern: **chi ha i numeri non ha le fonti primarie, chi ha le fonti non ha i numeri. Nessuno ha entrambi.** Riccardo ha un motore di calcolo vero e può avere le fonti primarie. È esattamente lo spazio vuoto.

---

## 5. Le lacune, ordinate per attrattività

Attrattività = volume reale indirizzabile × debolezza della risposta attuale × coerenza col differenziatore. Query fuori target (INPS/NoiPA/prestiti) escluse.

### L1 — Pagine-sintomo con numeri veri ⭐ la migliore
BustaIA ha inventato il format `/controllo/{sintomo}` e lo ha lasciato a 680 parole senza un numero né una fonte. Le query dietro esistono: `troppe trattenute in busta paga` (390, KD 0, **−65% annuo**), `controllare la busta paga` (480, KD 0), `controllo busta paga online gratis` (720), più le related osservate in SERP: *"Troppe trattenute in busta paga"*, *"1.000 euro di trattenute in busta paga"*, *"Come abbassare le trattenute in busta paga"*, *"Le trattenute in busta paga vengono restituite"*.

Perché è la migliore: è l'unico cluster dove **un motore di calcolo è un vantaggio strutturale, non un accessorio**. "Il netto è sceso di 180 € rispetto al mese scorso: ecco le cinque cause, con il conto rifatto per ognuna" è un contenuto che Jet HR non può scrivere (non ha il motore) e che BustaIA non ha scritto (ha il motore ma non l'ha usato in pagina). E sopravvive all'AI Overview, perché la risposta dipende dai numeri dell'utente.

### L2 — Esempi di cedolino per casistica ⭐⭐ la più difendibile dall'AI
Il cluster che tiene meglio a trend (`esempio busta paga` −23% contro −47% delle query esplicative), tutto KD 0, tutto scoperto:

| Query | Vol | KD | BustaIA |
|---|---|---|---|
| esempio busta paga | 1.600 | 0 | non posiz. |
| esempio busta paga liquidazione tfr | 1.900 | 0 | pos 40 |
| esempio busta paga con malattia | 1.900 | 0 | non posiz. |
| esempio busta paga con infortunio | 1.300 | 0 | non posiz. |
| esempio busta paga part time | 320 | 0 | non posiz. (GioIA pos 5) |
| esempio busta paga con pignoramento | 880 | 0 | non posiz. |
| esempio busta paga contratto a chiamata | 880 | 0 | non posiz. |

Sette pagine, ~8.800 di volume, **nessuna presidiata da BustaIA**. Un esempio è un artefatto: l'AI Overview può riassumerlo ma non sostituirlo. E un motore di calcolo può generarne di corretti a ciclo continuo.

### L3 — Voce per voce, con il conto rifatto
Query sulla singola riga del cedolino, tutte KD 0, tutte scoperte o presidiate male:
`tfr in busta paga` (5.400, non posiz.), `busta paga tfr` (5.400, non posiz.), `cosa sono i rol in busta paga` (1.000), `rol busta paga cosa sono` (1.000), `edr in busta paga` (1.300, BustaIA pos 58), `cos'è la contingenza in busta paga` (590), `contributo fap in busta paga` (1.000, pos 42), `busta paga residuo ap` (590), `ferie ap significato` (210), `saldo ferie in busta paga cosa significa` (30).

⚠️ **Caveat forte.** La SERP osservata su `cosa sono i rol in busta paga` ha un **AI Overview lungo e completo** che cita Indeed, Randstad, Gi Group, Jet HR, Coverflex, TikTok e YouTube. La definizione è già data sopra il fold. **Scrivere la ventesima definizione di ROL è tempo sprecato.** Ciò che l'AI Overview *non* fa: dire dove sta esattamente quella voce nel PDF, cosa fare se il numero non torna, e rifare il conto. Il taglio deve essere "come si legge e come si verifica", mai "cos'è".

### L4 — Conguaglio e 730, stagionali e ad alto panico
`conguaglio in busta paga` (2.400), `conguaglio busta paga` (2.400), `conguaglio busta paga gennaio 2026` (2.400), `rimborso 730 in busta paga` (590 ×5 varianti), `busta paga dicembre conguaglio` (480). Tutte KD 0, **BustaIA non è in top 20 su nessuna**, ha solo `/blog/conguaglio-730-a-debito-busta-paga` con **ETV 2,1**.

La SERP ha AI Overview ma la top-10 organica è composta da **studi di consulenti del lavoro locali** (Studio Signore, Studio Campagnoli, Studio Carafa, Graber & Partner, elisalupo.com), un **post Facebook della UILM Basilicata in posizione 6** e un PDF NoiPA. È la SERP più debole che ho osservato. Nove PAA disponibili. Stagionalità dicembre-febbraio, quindi va pubblicato entro novembre.

### L5 — Colf, badanti e figure senza ufficio HR ⚠️ SUPERATA — vedi correzione
> **Correzione del 20/09/2026, stessa giornata.** In `competitor-occupanti-reali.md` §5-C5 ho osservato la SERP live di `busta paga colf`: la prima pagina è occupata da **generatori gratuiti di cedolini** (colfinregola #1-2, webcolf #4, colf.info #5, mondocolf #9) e da un PDF modello, e l'AI Overview cita solo tool. L'intento è *produrre* una busta paga, non *capirla* — l'opposto del prodotto. **Questa lacuna è declassata a "fuori perimetro".** Quanto segue resta come traccia del ragionamento iniziale.

`busta paga colf` (1.000 ×3 varianti), `busta paga badante` (480 ×4), `busta paga badante convivente esempio` (720), `busta paga badante livello cs` (720), `simulazione busta paga badante gratis` (480), `simulazione busta paga colf gratis` (390). **KD 0-1. BustaIA non è in top 20 su nessuna** nonostante abbia `/guida-ccnl/colf-badanti` (ETV 15, pos 11-89).

È il pubblico con più bisogno e meno accesso a un consulente: il datore di lavoro domestico è una famiglia, non un'azienda. Ed è il pubblico per cui **"il PDF non lascia il browser" significa qualcosa di concreto** — qui il cedolino contiene i dati di una persona che lavora in casa tua.

### L6 — Le altre, in ordine
- **Ferie/permessi/ROL residui** (7.870 di volume gap, tutto KD 0): `busta paga rol` 1.300, `ferie non godute quanto vengono pagate` 480, `le ferie in busta paga sono in ore o giorni` 480, `ferie non godute dopo 18 mesi` 260, `carenza malattia busta paga` 590. Otto PAA raccolte.
- **Trasferte e maggiorazioni** (4.860, KD 0-11): `trasferta italia busta paga` 880 ×4 varianti, `ex festività busta paga` 720, `indennità l. 207/24 in busta paga` 590. Quest'ultima è **normativa recente su cui nessuno ha ancora scritto bene**.
- **Simulatori/calcolatori** (11.450, KD 0-5): `calcolatore busta paga` 1.000, `calcolare busta paga` 1.000, `simulazione busta paga` 590, `simulazione busta paga gratis` 590, `calcolo ral da busta paga` 390. BustaIA è oltre la 80ª posizione dove c'è. Ogni pagina può essere uno strumento vero, non un articolo.
- **Bonus in busta paga** (10.560): `bonus benzina busta paga` **5.400**, BustaIA non posizionata. `fringe benefit busta paga` 720, `bonus renzi busta paga` 880.
- **Glossario codici** (6.470): `codici busta paga` 260, `voci busta paga codici` 1.000, `busta paga spiegazione voci` 590. GioIA ha provato il glossario ed è a pos 37-103: **il glossario funziona solo se ogni voce è una pagina con un esempio numerico e la posizione nel PDF**, non una definizione.

---

## 6. Le SERP osservate (20/09/2026)

| Query | Vol | AI Overview | PAA | Chi vince | Tipo di pagina vincente |
|---|---|---|---|---|---|
| come leggere la busta paga | 3.600 | **NO** | **NO** | dottrinalavoro.it (**PDF del 2016**), Zeta Service, Jet HR, Edenred, Centro Paghe, Factorial | guida lunga di fornitore payroll/HR |
| trattenute in busta paga | 1.600 | sì, lungo | 9 | Randstad, Opendotcom, Bibanca (glossario), Indeed, Ipsoa, Pictet | articolo divulgativo di brand grande |
| conguaglio in busta paga | 2.400 | sì | 9 | Pictet, Zeta Service, 4Stars, **Facebook UILM (pos 6)**, Graber, NoiPA, Studio Campagnoli | blog di studi di consulenza locali |
| cosa sono i rol in busta paga | 1.000 | **sì, molto completo** | 9 | Dipendenti in Cloud, Indeed, Randstad, Factorial, Coverflex, 360Forma, Jet HR | definizione + HR-tech |
| tfr in busta paga | 5.400 | sì | 9 | Fondo Priamo, Ipsoa, Zeta Service, Generazione Vincente, ilCCNL, Coverflex, **PDF FP CGIL** | fondi pensione + studi + sindacati |
| controllo busta paga online gratis | 720 | sì — **BustaIA è la fonte #1 citata** | 4 | **BustaIA pos 2**, Jet HR, elisalupo.com, Opendotcom, Studio Argari (50 €), app LaMiaBustaPaga, Geobadge, Studio Cardone, Fillea CGIL | landing di prodotto + servizi a pagamento |

### Cosa dicono queste SERP

**1. `come leggere la busta paga` è la SERP più debole del lotto e la più grossa.** Nessun AI Overview, nessun PAA, e al primo posto **un PDF caricato nel 2016 da dottrinalavoro.it**. Dietro ci sono blog di fornitori payroll (Zeta Service, Centro Paghe, Factorial, Edenred) che scrivono per le aziende, non per il lavoratore. C'è un video pack e un reel de *il Post*. **BustaIA è oltre la 50ª posizione.** 3.600 ricerche/mese, KD 0, e il miglior risultato ha dieci anni.

**2. BustaIA ha già vinto la query commerciale e va lasciata stare.** Su `controllo busta paga online gratis` è il primo brand citato nell'AI Overview — *"piattaforme automatizzate come BustaIA, che usa l'intelligenza artificiale per verificare voci come IRPEF, INPS e detrazioni"* — e posizione 2 organica. Attaccare frontalmente questa query significa competere contro un incumbent già canonizzato da Google. **Meglio entrare dal lato informativo e dai sintomi.**

**3. L'AI Overview è il vero concorrente, non BustaIA.** Su 4 query su 6 l'AI Overview risponde in modo completo e cita 5-9 fonti. Le fonti citate sono quasi sempre **Indeed, Randstad, Ipsoa, Coverflex, Jet HR + TikTok/YouTube/Instagram**. Nota: **i social entrano regolarmente nelle citazioni**. Un contenuto che vuole essere citato deve essere strutturato in affermazioni brevi e verificabili con fonte — esattamente il formato di `/come-verifichiamo` di BustaIA.

**4. Sindacati e studi locali occupano posizioni alte con contenuti mediocri.** Un post Facebook della UILM Basilicata è sesto su una query da 2.400. Fillea CGIL, FP CGIL (PDF del 2021), CISL sono in prima pagina. **Sono difese fragili.**

**5. La SERP commerciale premia il servizio umano a pagamento.** Studio Argari vende il controllo a 50 €, Studio Cardone e la CISL offrono vertenze. Esiste una fascia di prezzo tra il gratis di BustaIA e i 50 € dello studio.

---

## 7. Come si batte — raccomandazioni operative

### R1. Non scrivere 90 articoli. Costruire 90 pagine che fanno un conto.
È la raccomandazione che conta più di tutte. Il cluster esplicativo perde il 35-65% annuo e l'AI Overview lo intercetta. Un articolo che spiega cos'è il ROL è morto in partenza: la SERP osservata ha già una risposta completa sopra il fold.

Ogni pagina deve contenere **almeno un input dell'utente e un output calcolato dal motore**: quante ore di ROL ti spettano col tuo CCNL e quanto valgono in euro; di quanto è sceso il netto e perché; quanto TFR hai accantonato. Il format `/controllo/{sintomo}` di BustaIA è giusto — l'hanno solo scritto in 680 parole senza numeri. **Prendere il format e riempirlo.**

Distribuzione suggerita dei 90 pezzi:
- **30** pagine-sintomo con calcolo (L1) — "ho preso meno", "ho pagato più tasse", "mi mancano gli straordinari", "le ferie non tornano", "il TFR non c'è", "il conguaglio mi ha svuotato la busta"…
- **20** esempi di cedolino per casistica (L2) — malattia, infortunio, maternità, part-time, a chiamata, pignoramento, cessione del quinto, liquidazione TFR, primo mese, ultimo mese…
- **15** voce-per-voce "dove sta nel PDF e come si verifica" (L3), mai in formato definizione
- **10** conguaglio/730/detrazioni (L4), pubblicati entro novembre per la stagione
- **8** colf/badanti/lavoro domestico (L5)
- **7** strumenti veri su query calcolatore (L6)

### R2. Fare della non conservazione un fatto dimostrabile, non un claim.
BustaIA ha già preso il messaggio "motore deterministico + fonti con data" e lo esegue bene su `/come-verifichiamo`. **Non si vince riscrivendo quella pagina meglio.**

Ma la loro pagina rivela la crepa: garantiscono la non conservazione **del fornitore del modello** ("Anthropic non conserva, cancella entro 30 giorni"), mentre il PDF esce comunque dal browser, passa dal loro backend e finisce in un database con 5.193 utenti. Riccardo può dire una cosa strutturalmente diversa: **il PDF non lascia il browser, al server arriva solo il testo che l'utente ha redatto, non c'è account, non c'è database.**

Operativamente, in ogni pagina del piano:
- un **blocco fisso e breve** ("Cosa succede al tuo cedolino") ripetuto su tutte le pagine, non una pagina-manifesto che nessuno visita;
- **renderlo verificabile**: il DevTools è aperto a tutti, dire esplicitamente "apri la scheda Rete, non vedrai partire il PDF". Una dimostrazione batte una promessa;
- su colf/badanti (L5) e pignoramento/cessione del quinto (L2) alzare il volume: sono i casi in cui il cedolino è un documento imbarazzante e la non conservazione è il motivo per cui uno sceglie te.

### R3. Vincere `come leggere la busta paga` con l'unica cosa che nessuno ha: il conto rifatto su un cedolino vero.
3.600 ricerche/mese, KD 0, **nessun AI Overview, nessun PAA**, primo risultato un PDF del 2016, BustaIA oltre la 50ª. È la singola opportunità più grande del territorio e **non è presidiata da nessuno che sappia fare i conti**.

Il contenuto che vince, sulla base di ciò che manca a tutti e cinque i concorrenti letti:
- un **cedolino reale riga per riga**, in versione navigabile (clic sulla riga → spiegazione + fonte + verifica), non un'immagine;
- **ogni numero ricalcolato dal motore e mostrato**, con la formula in chiaro — è ciò che manca a Jet HR (fonti ma zero numeri) e a `/controllo/{sintomo}` (form ma zero numeri);
- **fonti primarie con estremi e data**, sul modello Jet HR (L. 4/1953, art. 39 D.L. 112/2008, D.M. 9/7/2008) e sul modello del registro datato di BustaIA — questo è il solo terreno in cui li si batte in casa loro;
- **schema FAQ vera**, che nessuno dei cinque ha: su `come leggere la busta paga` non ci sono PAA da intercettare ma le related searches sono esplicite (*"Busta paga spiegazione voci"*, *"Come leggere la busta paga INAIL"*, *"Codici busta paga pdf"*, *"Come leggere la busta paga ferie e permessi"*), e sulle query vicine ci sono 40 PAA raccolte in §8;
- **versione video/reel**: nella SERP osservata compaiono YouTube, TikTok e un reel de *il Post* con 5.400 like. Il formato verticale è già in prima pagina su questa query.

### R4. Tre note tattiche
- **Non inseguire `cedolino NoiPA`, `cedolino pensione INPS`, `prestiti senza busta paga`.** Sono il 70% del volume del territorio e sono navigazionali verso INPS, NoiPA o finanziarie. Il piano deve dichiararlo, altrimenti qualcuno vedrà 500k di volume e sbaglierà le attese.
- **Frequenza ≠ 1 al giorno.** Dato il trend in calo e le SERP occupate dall'AI Overview, 90 pagine sottili perdono contro 45 pagine con un calcolo dentro. Se il vincolo "1 al giorno" resta, alternare: pagine-sintomo e strumenti (costose, alto valore) con esempi-casistica (generabili dal motore, costo marginale basso).
- **Lezione da Cedolingo**: due soli articoli — `bonus-mamme-2025` e `malattia-durante-le-ferie` — reggono praticamente tutto il suo traffico. Un pezzo di attualità normativa azzeccato vale venti pezzi evergreen. Tenere 1 slot a settimana per la normativa fresca (es. `indennità l. 207/24 in busta paga`, 590, su cui nessuno ha ancora scritto bene).

---

## 8. People Also Ask raccolte (grezze, per l'orchestratore)

Osservate dal vivo il 20/09/2026 con `people_also_ask_click_depth: 2`. Le risposte non erano disponibili (`asynchronous_ai_overview`): sono le **domande**. Indentate = domande di secondo livello con la loro seed question.

### Da `trattenute in busta paga`
- Perché ci sono tante trattenute in busta paga?
- Quanto è il netto di 1.500 euro lordi?
- Quante trattenute ci sono in uno stipendio?
- Qual è la differenza tra ritenute e trattenute?
  - Cosa vuol dire trattenuta in busta paga?
  - Come funziona il conguaglio della busta paga a gennaio 2026?
    - In che mese viene fatto il conguaglio in busta paga?
    - Quali sono le novità per le trattenute in busta paga nel 2026?
    - Come evitare il conguaglio a debito?

### Da `conguaglio in busta paga`
- Come evitare il conguaglio a debito?
- In che mese si prende il conguaglio?
- Come si fa il calcolo del conguaglio?
- Cos'è il conguaglio busta paga gennaio 2026?
  - Cosa cambia nella busta paga da gennaio 2026?
  - In quale busta paga viene fatto il conguaglio?
    - Come funziona il conguaglio fiscale per lo stipendio?
    - Il datore di lavoro è obbligato a fare il conguaglio fiscale?
    - Come funziona il pagamento a conguaglio?

### Da `cosa sono i rol in busta paga`
- Che differenza c'è tra rol e permessi?
- Che fine fanno i rol non goduti?
- Quante ore di rol si accumulano al mese?
- Quanto viene pagata un'ora di rol?
  - È meglio consumare i permessi ROL o le ferie?
  - Qual è la differenza tra ferie e rol?
    - Posso utilizzare i ROL al posto delle ferie?
    - A chi spettano i ROL?
    - Quali scadono prima, i ROL o le ferie?

### Da `tfr in busta paga`
- Quando viene pagato il TFR in busta paga?
- Come faccio a sapere quanto è il mio TFR?
- Quanti soldi ti danno con il TFR?
- Perché sulla busta paga non c'è il TFR?
  - Il TFR è obbligatorio sulla busta paga?
  - Il datore di lavoro è obbligato ad accantonare il TFR?
    - Cosa rischia il datore di lavoro se non versa il TFR?
    - Quanto è l'importo netto di un TFR di 10.000 euro?
    - Quali sono le novità per il TFR a partire da luglio 2026?

### Da `controllo busta paga online gratis`
- Come faccio a verificare se la mia busta paga è corretta?
- Dove posso far controllare le mie buste paga?
- Quanto costa far controllare le buste paga al CAF?
- Qual è la migliore app per controllare le buste paga?

### Related searches osservate (non PAA, ma utili)
**Da `come leggere la busta paga`** (SERP senza PAA): Busta paga spiegazione voci · Busta paga spiegazione semplice · Esempio busta paga · Come leggere la busta paga INAIL · Come leggere una busta paga pdf · Codici busta paga pdf · Come leggere la busta paga ferie · Come leggere la busta paga ferie e permessi

**Da `trattenute in busta paga`**: Troppe trattenute in busta paga · Trattenute busta paga esempio · Chi paga le trattenute in busta paga · 1.000 euro di trattenute in busta paga · Le trattenute in busta paga vengono restituite · Trattenute IRPEF busta paga · Come abbassare le trattenute in busta paga · Trattenute fiscali busta paga

**Da `conguaglio in busta paga`**: Quando arriva il conguaglio in busta paga · Dove si vede il conguaglio in busta paga · Conguaglio busta paga come si calcola · Conguaglio IRPEF busta paga · Conguaglio a debito busta paga · Conguaglio busta paga gennaio 2026 · Ritenute IRPEF conguaglio ultima busta paga · Conguaglio IRPEF negativo in busta paga

**Da `cosa sono i rol in busta paga`**: Differenza tra permessi e ROL in busta paga · Posso usare i ROL come ferie · Non ho i ROL in busta paga · ROL in busta paga sono obbligatori · ROL busta paga part time · Come si calcolano i ROL in busta paga · ROL come si maturano · ROL ap busta paga

**Da `tfr in busta paga`**: Esempio busta paga liquidazione TFR · TFR in busta paga ogni mese conviene · TFR in busta paga ogni anno · TFR in busta paga si può fare · TFR in busta paga come si vede · TFR in busta paga non c'è · TFR in busta paga nuova legge · TFR in busta paga come si calcola

**Da `controllo busta paga online gratis`**: Controllo buste paga online · Controllo buste paga CAF costo · Controllo busta paga Caf · Busta paga online INPS · Simulazione busta paga online · Controllo buste paga a chi rivolgersi · Controllo busta paga AI · Busta paga online SPID

---

## 9. Cosa NON ho verificato

- **Non ho verificato il traffico reale di nessun concorrente.** ETV e volumi sono stime DataForSEO. L'unico dato di prima mano su BustaIA (5.193 utenti, 6.413 analisi) viene da RIC-70, non da questa sessione.
- **Non ho risolto la discrepanza 1.384 → 2.395 keyword** su bustaia.it tra il 19/09 e il 20/09.
- **Non ho letto tutte le 2.395 keyword di BustaIA**, solo le prime 800 per ETV. La coda lunga sotto ETV ~5 non è stata ispezionata.
- **Non ho analizzato i backlink** di nessun dominio. La KD è un proxy; non ho guardato referring domains, anchor o velocity. Se serve capire quanto sia difendibile una posizione, serve un passaggio `backlinks_*`.
- **Non ho visto le risposte delle PAA**, solo le domande (`asynchronous_ai_overview: true`).
- **Non ho verificato le SERP su mobile** né in località diverse da "Italy". Tutte le rilevazioni sono desktop, nazionali.
- **Non ho controllato la stabilità degli AI Overview.** Un AIO osservato una volta il 20/09 può non esserci domani; la sua presenza va ricontrollata prima di decidere di non scrivere un pezzo.
- **Non ho caricato alcun cedolino** su BustaIA, GioIA o Cedolingo: non ho visto il loro output reale, solo le pagine pubbliche. La qualità effettiva dell'analisi di BustaIA resta non verificata — e con essa la solidità del claim "motore deterministico".
- **Non ho verificato le affermazioni normative** contenute nelle pagine dei concorrenti (art. 39 D.L. 112/2008, L. 4/1953, posizione INL sul TFR mensile). Sono riportate come *ciò che loro dichiarano*, non come fatti confermati.
- **Non ho stimato il potenziale di traffico** delle lacune. "Volume × debolezza SERP" in §5 è un ordinamento qualitativo motivato, non un modello. Nessuna proiezione di visite: sarebbe un numero inventato.
- **Non ho analizzato i competitor sulla SERP che non sono nel set iniziale** (Jet HR, Factorial, Coverflex, Indeed, Randstad, Zeta Service). Emergono come i veri occupanti del territorio informativo e **meriterebbero un teardown a parte**: sono loro, non BustaIA, che tengono le posizioni 1-10 sulle query che servono a Riccardo.
