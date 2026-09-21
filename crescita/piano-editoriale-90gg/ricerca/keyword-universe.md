# Universo keyword — dovevalatuaral.com

Materia prima per il piano editoriale di 90 articoli (fine settembre → dicembre 2026).
Non è il piano: è il bacino misurato da cui l'orchestratore sceglie i 90 target.

**Data della ricerca:** 20 settembre 2026
**Mercato:** `location_name: "Italy"`, `language_code: "it"`
**Keyword consegnate e misurate:** 397
**File dati:** [`keywords.csv`](keywords.csv)

---

## 1. Metodo, endpoint, limiti

### Come è stato costruito

**Espansione.** 34 chiamate a `dataforseo_labs_google_keyword_suggestions` (filtro `keyword_info.search_volume > 20`) e 8 a `dataforseo_labs_google_related_keywords` (depth 2) sui seed del brief più i filoni emersi strada facendo (`quanto si guadagna`, `trattenute`, `anzianità`, `trasferta`, `preavviso`, `conguaglio`, `cuneo fiscale`, `imponibile previdenziale`, `detrazioni lavoro dipendente`). Bacino grezzo: **6.114 keyword uniche**.

**Pulizia.** Dal bacino grezzo sono state tolte: pensioni e pubblico impiego (fuori ICP: il target è il dipendente privato), portali aziendali e software gestionali, annunci di lavoro geolocalizzati, e soprattutto le omonimie che inquinano il dominio semantico (vedi §6). Poi le varianti sono state collassate per nucleo semantico, tenendo la forma a volume più alto di ogni gruppo: da 6.114 grezze a **2.526 gruppi distinti**, da cui è stata estratta una selezione di 398 keyword bilanciata per cluster e con una quota forzata di query "problema/sintomo".

**Misura.** Una chiamata a `dataforseo_labs_google_keyword_overview` sulle 398 keyword selezionate (volume medio mensile, `monthly_searches` a 12 mesi, `search_volume_trend`, `search_intent_info`) e una a `dataforseo_labs_bulk_keyword_difficulty` per il KD. **397 keyword su 398 sono state confermate dal database.**

**Intento.** `search_intent_info` da `keyword_overview` per tutte le 397, più una chiamata dedicata a `dataforseo_labs_search_intent` (language_code `it`) sulle 35 keyword finaliste.

**Stagionalità.** Calcolata dai `monthly_searches` restituiti da `keyword_overview`: mese di picco = mese con il volume più alto nella finestra settembre 2025 – agosto 2026; indice Q4 = media ottobre-novembre-dicembre 2025 diviso la media dei 12 mesi.

**SERP.** 11 controlli con `serp_organic_live_advanced` (depth 10) sulle keyword più attraenti.

### Limiti dichiarati

- **Ogni volume e ogni KD in questo documento e nel CSV viene da una chiamata effettivamente eseguita.** Niente stime.
- L'unica keyword selezionata ma **non confermata dal database** è `quanti giorni di ferie si maturano in un mese part-time`: non compare nella risposta di `keyword_overview`. Non significa volume zero, significa che il database non la copre. È stata esclusa dal CSV.
- Tre keyword sono presenti nella risposta ma **senza `search_volume`**: `ferie godute ap significato`, `come si calcolano le ferie in busta paga in ore`, `verifica codice ccnl`. Nel CSV la cella volume è vuota. Anche qui: dato mancante, non volume zero.
- Dove `bulk_keyword_difficulty` non ha restituito un valore, il CSV riporta `non disponibile` (**25 keyword**). Non è stato stimato nulla.
- **KD 0 è un dato, non un verdetto.** DataForSEO usa una scala logaritmica: su moltissime long-tail italiane il KD collassa a 0 perché i backlink verso le pagine posizionate sono pochi. Non tiene conto di chi occupa la SERP. Vedi §5 e §6.
- I `monthly_searches` coprono settembre 2025 – agosto 2026: la stagionalità Q4 è quindi misurata **sul Q4 2025**, ed è usata come proxy per il Q4 2026. Per le keyword con l'anno nel testo (`tredicesima 2025`, `aliquote irpef 2025`) il dato storico descrive il comportamento di quella stringa in quell'anno: nel 2026 il picco si sposterà sulla variante `2026`.
- La competizione Google Ads (`LOW`/`HIGH`) è presente nei dati grezzi ma **non è stata usata come indicatore di difficoltà organica**: misura gli inserzionisti, non i concorrenti SEO.

---

## 2. I cluster

| Cluster | N. kw | Volume totale mensile | KD medio | Intento dominante | Mesi di picco | Aggancio prodotto |
|---|---|---|---|---|---|---|
| Fine rapporto e NASpI | 29 | 488.740 | 3,1 | informazionale pura (19/29) | luglio, ottobre | nessuno |
| IRPEF, detrazioni e conguaglio | 49 | 443.080 | 0,8 | informazionale pura (30/49) | gennaio, ottobre | calcolatore RAL |
| Dal lordo al netto (RAL) | 32 | 358.620 | 7,7 | con bisogno di calcolo (29/32) | marzo, ottobre | calcolatore RAL |
| CCNL, livelli e scatti | 30 | 284.610 | 2,7 | informazionale pura (26/30) | **novembre**, marzo | nessuno |
| Leggere la busta paga | 56 | 210.720 | 2,1 | **problema/sintomo (23/56)** | gennaio, marzo | **busta paga** |
| Contributi INPS e imponibili | 24 | 147.450 | 4,3 | navigazionale (23/24) | marzo, gennaio | nessuno |
| Benefit, welfare e buoni pasto | 23 | 145.760 | 3,2 | informazionale pura (15/23) | gennaio, settembre | nessuno |
| TFR e liquidazione | 31 | 123.700 | 0,1 | informazionale pura (19/31) | gennaio, marzo | calcolatore RAL |
| Tredicesima e quattordicesima | 35 | 122.610 | 0,0 | informazionale pura (22/35) | **dicembre (17/35)**, giugno | calcolatore RAL |
| Ferie, permessi, malattia, maternità | 38 | 98.900 | 0,1 | informazionale pura (20/38) | gennaio, marzo | busta paga |
| Part time e apprendistato | 14 | 54.500 | 0,4 | informazionale pura (10/14) | settembre, marzo | nessuno |
| Orario e straordinari | 20 | 25.600 | 0,0 | con bisogno di calcolo (10/20) | **ottobre (9/20)** | busta paga |
| Aumenti e rinnovi contrattuali | 16 | 18.660 | 0,0 | informazionale pura (12/16) | **novembre**, giugno | nessuno |

> **I volumi totali non vanno letti come domanda disponibile.** Sono somme aritmetiche di keyword che in molti casi descrivono la stessa ricerca. Esempi reali dal dataset: `calcolare stipendio netto` e `calcolatore stipendio netto` valgono 49.500 **ciascuna** e sono lo stesso bisogno; `tfr come calcolare`, `tfr come calcolarlo` e `tfr: calcolo` valgono 12.100 ciascuna e sono la stessa ricerca; `calcolatore tredicesima` e `calcolare tredicesima` idem a 5.400; `contratto collettivo nazionale metalmeccanici` e `metalmeccanico ccnl` idem a 27.100. Il "Dal lordo al netto" da 358.620 in realtà vale una frazione. Usare le colonne N. kw e KD medio per la priorità, non il volume totale.

---

## 3. I cluster in dettaglio

### Leggere la busta paga — 56 kw, KD medio 2,1, aggancio: "Ti spiego la busta paga"

È il cluster strategico: è l'unico dove l'intento dominante è **problema/sintomo** (23 keyword su 56), cioè persone che hanno il cedolino davanti e non lo capiscono.

| Keyword | Volume | KD | Intento operativo | Picco |
|---|---|---|---|---|
| busta paga | 74.000 | 0 | informazionale pura | aprile |
| inps cedolino | 60.500 | 21 | navigazionale | febbraio |
| cedolino | 12.100 | 10 | informazionale pura | febbraio |
| tfr in busta paga | 5.400 | 0 | informazionale pura | gennaio |
| busta paga: come leggerla | 3.600 | 0 | informazionale pura | gennaio |
| come leggere una busta paga | 3.600 | 0 | problema/sintomo | gennaio |
| contributo ivs in busta paga | 2.400 | 0 | problema/sintomo | luglio |
| trattenute sulla busta paga | 1.600 | 0 | problema/sintomo | gennaio |
| rol busta paga | 1.300 | 0 | problema/sintomo | marzo |
| superminimo in busta paga | 1.300 | 0 | problema/sintomo | febbraio |
| edr in busta paga | 1.300 | 0 | problema/sintomo | maggio |

**SERP controllate.** Su `come leggere una busta paga`: AI Overview in posizione 1, poi Zeta Service, un PDF del 2016 di Dottrina per il Lavoro, Randstad, Edenred, un reel del Post su Instagram, Banca Sella, Jet HR, Factorial. **Nessun dominio istituzionale**: è una SERP di blog HR-tech e agenzie per il lavoro. Battibile con contenuto migliore, ma l'AI Overview cita Factorial e risponde già per esteso.
Su `trattenute sulla busta paga`: AI Overview molto esteso che esaurisce la domanda, poi Randstad, OpenDotCom, Indeed, Bibanca, SmartCAF, stipendionettocalcolatore.it, Ipsoa. Il blocco "People Also Ask" contiene letteralmente *"Perché ho molte trattenute sulla busta paga?"*: l'intento problema/sintomo è confermato da Google stesso.
Su `rol busta paga`: AI Overview che spiega già le sigle ROL AP/MAT/GOD/RES; organico occupato da SaaS HR con domini forti (Dipendenti in Cloud, Indeed, Randstad, Factorial, Coverflex, Personio).

**Il filone delle sigle è il tesoro nascosto di questo cluster.** `ferie ap significato`, `ferie godute significato`, `ferie residue significato`, `ferie mat significato`, `ferie ac significato`, `codice ccnl in busta paga c011 cosa significa`, `fringe benefit sogg busta paga cosa significa`: volumi piccoli, KD 0, e sono esattamente la domanda che "Ti spiego la busta paga" risolve in un secondo. Nessuno li presidia bene.

### Tredicesima e quattordicesima — 35 kw, KD medio 0,0

Il cluster con la stagionalità più netta dell'intero dataset: 17 keyword su 35 hanno il picco a dicembre.

| Keyword | Volume | KD | Intento operativo | Picco | Indice Q4 |
|---|---|---|---|---|---|
| quando arriva la tredicesima | 12.100 | 0 | informazionale pura | dicembre | 3,51 |
| tredicesima | 9.900 | 0 | informazionale pura | dicembre | 2,98 |
| tredicesima come si calcola | 8.100 | 0 | con bisogno di calcolo | dicembre | 3,12 |
| tredicesima detassata | 8.100 | 0 | informazionale pura | ottobre | 3,59 |
| tredicesima mensilità | 8.100 | 0 | informazionale pura | novembre | 3,83 |
| tassazione tredicesima | 6.600 | 0 | con bisogno di calcolo | ottobre | 3,30 |
| calcolatore tredicesima | 5.400 | 0 | con bisogno di calcolo | dicembre | 3,29 |
| tredicesima: quando si prende | 3.600 | 0 | informazionale pura | dicembre | 3,04 |
| simulatore calcolo tredicesima | 1.600 | 0 | con bisogno di calcolo | dicembre | 3,41 |
| cos'è la tredicesima | 1.000 | 0 | informazionale pura | dicembre | 2,74 |

**SERP controllate.** `tredicesima come si calcola`: AI Overview che riporta già la formula completa, poi Gi HR Services, PMI.it con simulatore, Namirial, Gi Group, Indeed, Jobtech. Nessun istituzionale, ma l'AI Overview chiude la domanda base — serve un angolo che non copre.
`quando arriva la tredicesima`: AI Overview, poi Randstad, Namirial, **Sky TG24**, **NoiPA (MEF, istituzionale)**, Indeed, Fenalca, **Idealista**. A dicembre questa SERP diventa news-driven e i grandi editori entrano con articoli freschi: difficile tenere la posizione in stagione.
`tassazione tredicesima`: AI Overview, poi FiscoeTasse, Pensionati CISL, e in **posizione 3 organica `bustaia.it`** — un concorrente diretto con lo stesso identico posizionamento di prodotto (spiegare la busta paga). Da tenere d'occhio.

### IRPEF, detrazioni e conguaglio — 49 kw, KD medio 0,8

| Keyword | Volume | KD | Intento operativo | Picco | Indice Q4 |
|---|---|---|---|---|---|
| aliquote irpef 2025 | 40.500 | 0 | con bisogno di calcolo | ottobre | 2,01 |
| scaglioni irpef 2025 | 40.500 | 0 | con bisogno di calcolo | dicembre | 1,95 |
| irpef | 40.500 | 13 | informazionale pura | ottobre | 1,57 |
| aliquote irpef 2026 | 40.500 | 0 | con bisogno di calcolo | giugno | 0,44 |
| scaglioni irpef 2026 | 40.500 | 0 | con bisogno di calcolo | giugno | 0,38 |
| scaglioni irpef | 27.100 | 4 | con bisogno di calcolo | novembre | 1,28 |
| detrazioni fiscali | 22.200 | 6 | informazionale pura | aprile | 0,45 |
| trattamento integrativo | 18.100 | 0 | informazionale pura | gennaio | — |
| irpef 2026 | 14.800 | 0 | informazionale pura | dicembre | 1,71 |
| taglio irpef | 14.800 | 0 | informazionale pura | ottobre | 2,64 |
| taglio irpef 2026 | 9.900 | 0 | informazionale pura | ottobre | 3,28 |
| detrazioni lavoro dipendente 2025 | 8.100 | 0 | informazionale pura | gennaio | 1,58 |

**SERP controllate.** `taglio irpef 2026`: AI Overview, poi DynamicaRetail, FunniFin, Il Sole 24 Ore (video), Corriere della Sera, SoluzioneTasse, Ipsoa. **Nessuna Agenzia delle Entrate in top 10** — SERP editoriale, aggredibile, ma presidiata da testate economiche forti.
`scaglioni irpef 2026`: AI Overview che cita l'Agenzia delle Entrate, e **l'Agenzia delle Entrate in posizione 2 organica**. Qui il KD 0 è ingannevole: l'ente che *definisce* le aliquote presidia la query. Vedi §6.

### Dal lordo al netto (RAL) — 32 kw, KD medio 7,7

Il cluster più prezioso per il prodotto storico, ma con un avvertimento pesante.

| Keyword | Volume | KD | Intento operativo | Picco |
|---|---|---|---|---|
| calcolare stipendio netto | 49.500 | 20 | con bisogno di calcolo | gennaio |
| calcolatore stipendio netto | 49.500 | 20 | con bisogno di calcolo | gennaio |
| stipendio netto calcolo | 49.500 | 5 | con bisogno di calcolo | gennaio |
| stipendio netto lordo | 14.800 | 3 | con bisogno di calcolo | gennaio |
| calcolatore tfr | 12.100 | 0 | con bisogno di calcolo | ottobre |
| netto lordo | 12.100 | 3 | con bisogno di calcolo | novembre |
| calcolare netto da lordo | 9.900 | 3 | con bisogno di calcolo | marzo |
| calcolatore ral | 8.100 | 20 | con bisogno di calcolo | ottobre |

**SERP controllata su `stipendio netto calcolo`: nessun AI Overview, e le prime 10 posizioni sono occupate al 100% da strumenti di calcolo** — calcolastipendionetto.it, Coverflex, Stipendee, aPensione, calcolostipendionettoaffidabile.it, Graber & Partner, Jet HR, Quickfisco, Inaz, PMI.it. Non è una SERP da articolo di blog: Google vuole un calcolatore. **Queste keyword vanno aggredite con la pagina-strumento, non con un post del piano editoriale.** Metterle nel calendario dei 90 giorni sarebbe sprecare una giornata.

### TFR e liquidazione — 31 kw, KD medio 0,1

Nove keyword di questo cluster hanno il picco a ottobre, dentro la finestra.

| Keyword | Volume | KD | Intento operativo | Picco |
|---|---|---|---|---|
| tfr come calcolarlo | 12.100 | 0 | con bisogno di calcolo | ottobre |
| tfr come calcolare | 12.100 | 1 | con bisogno di calcolo | ottobre |
| tfr: calcolo | 12.100 | 1 | con bisogno di calcolo | ottobre |
| tfr e tassazione | 9.900 | 0 | con bisogno di calcolo | marzo |
| tfr 2026 | 8.100 | 0 | informazionale pura | gennaio |
| anticipazioni tfr / tfr anticipato / tfr in anticipo | 5.400 ciascuna | 0 | informazionale pura | ottobre |
| tfr rivalutazione | 2.900 | 0 | con bisogno di calcolo | — |
| tfr silenzio-assenso | 1.600 | 0 | informazionale pura | dicembre |

Le tre varianti `tfr come calcolarlo` / `tfr come calcolare` / `tfr: calcolo` a 12.100 sono **una sola ricerca**, così come le tre di `anticipazioni tfr` a 5.400.

### CCNL, livelli e scatti — 30 kw, KD medio 2,7

Dodici keyword su 30 hanno il picco a **novembre**: è il cluster più sincronizzato con la finestra dopo la tredicesima.

| Keyword | Volume | KD | Picco | Indice Q4 |
|---|---|---|---|---|
| contratto collettivo nazionale | 49.500 | 39 | novembre | — |
| contratto collettivo nazionale di lavoro | 49.500 | 14 | novembre | — |
| contratto collettivo nazionale metalmeccanici | 27.100 | 0 | novembre | 1,56 |
| metalmeccanico ccnl | 27.100 | 0 | novembre | 1,56 |
| commercio ccnl | 18.100 | 2 | marzo | — |
| rinnovo ccnl metalmeccanici | 6.600 | 0 | novembre | 2,60 |
| tabelle retributive ccnl commercio | 8.100 | 0 | novembre | — |
| scatto di anzianità | 2.400 | 0 | — | — |

Attenzione: `contratto collettivo nazionale` ha **KD 39**, il più alto del dataset. Le varianti settoriali hanno KD 0.

### Ferie, permessi, malattia, maternità — 38 kw, KD medio 0,1

`ferie` (27.100, KD 2), `congedi straordinari legge 104` (9.900, KD 0), `maternità facoltativa` (9.900, KD 0), `aspettativa non retribuita` (8.100, KD 0), `ferie non godute` (1.900, KD 0), `quanti giorni di ferie si maturano in un mese` (2.400, KD 0).

**SERP controllata su `ferie non godute`:** AI Overview, poi Dipendenti in Cloud, Lavorosì, Ali Lavoro, Randstad, buoni-pasto.it, Zeta Service, Moltocomuni. Il taglio prevalente è **B2B — obblighi e sanzioni per il datore di lavoro**. Lo spazio dal lato del lavoratore ("le mie ferie scadono? quanto mi pagano?") è largamente libero.

### Orario e straordinari — 20 kw, KD medio 0,0

Piccolo per volume (25.600 totali) ma **9 keyword su 20 hanno il picco a ottobre**, proprio all'apertura della finestra. `tassazione straordinari` / `tassazione straordinario` / `detassazione straordinari` valgono 2.400 ciascuna con indice Q4 2,08; `detassazione straordinari 2026` e `tassazione straordinari 2026` valgono 2.900. Tutte KD 0.

### Fine rapporto e NASpI — 29 kw, KD medio 3,1

Il cluster con più volume assoluto (488.740) ma il **peggior aggancio al prodotto**: `naspi` (135.000, KD 16), `dimissioni volontarie` (90.500, KD 0), `licenziamento` (74.000, KD 0), `dimissioni online` (22.200, KD 7, navigazionale verso il portale ministeriale). Picco a luglio e ottobre. Traffico grande ma lontano sia dal calcolatore RAL sia dalla lettura del cedolino.

### Contributi INPS e imponibili — 24 kw, KD medio 4,3

**23 keyword su 24 sono navigazionali**: la gente cerca `inps cedolino`, `estratto conto inps contributi`, `verifica contributi inps con spid` perché vuole *entrare nel portale INPS*, non leggere un articolo. Cluster da trattare con estrema cautela (vedi §6).

### Benefit, welfare e buoni pasto — 23 kw, KD medio 3,2

`welfare` (49.500, KD 4), `welfare aziendale` (27.100, KD 0), `fringe benefit` (22.200, KD 11), `fringe benefit 2026` (12.100, KD 0), `buoni pasto` (12.100, **KD 38** — il secondo più alto del dataset, SERP dominata dagli emittenti), `fringe benefit 2025` (5.400, KD 4, picco dicembre, indice Q4 2,67).

### Part time e apprendistato — 14 kw · Aumenti e rinnovi — 16 kw

Due cluster piccoli. Part time/apprendistato ha picco a settembre (fuori finestra all'inizio) e KD medio 0,4. Aumenti e rinnovi ha picco a novembre, KD 0, ma volumi modesti ed è tutto legato ai rinnovi contrattuali settoriali (metalmeccanici soprattutto): materiale da notizia, non evergreen.

---

## 4. Calendario della stagionalità — ottobre, novembre, dicembre 2026

**Regola di lettura: qui sotto c'è il mese di PICCO della domanda, non il mese di pubblicazione.** L'articolo va online almeno 3-4 settimane prima, perché Google ha bisogno di tempo per posizionarlo e perché la domanda inizia a salire dal mese precedente.

### Cosa esplode a OTTOBRE (pubblicare a settembre)

| Keyword | Volume medio | Ottobre | Novembre | Dicembre | Indice Q4 |
|---|---|---|---|---|---|
| tredicesima detassata | 8.100 | **74.000** | 6.600 | 3.600 | 3,59 |
| taglio irpef | 14.800 | **74.000** | 18.100 | 14.800 | 2,64 |
| tassazione tredicesima | 6.600 | **49.500** | 3.600 | 4.400 | 3,30 |
| irpef | 40.500 | **90.500** | 49.500 | 40.500 | 1,57 |
| aliquote irpef 2025 | 40.500 | **90.500** | 74.000 | 74.000 | 2,01 |
| taglio irpef 2026 | 9.900 | **40.500** | 33.100 | 18.100 | 3,28 |
| tassazione straordinari | 2.400 | **8.100** | 2.900 | 2.900 | 2,08 |
| detassazione straordinari | 2.400 | **8.100** | 2.900 | 2.900 | 2,08 |
| tfr come calcolarlo | 12.100 | **18.100** | 14.800 | 12.100 | 1,27 |
| anticipazioni tfr | 5.400 | **8.100** | 6.600 | 4.400 | 1,10 |
| buoni pasto 10 euro | 3.600 | **14.800** | 4.400 | 4.400 | 2,07 |

**Lettura.** Ottobre è il mese della **legge di bilancio**: `taglio irpef` passa da 14.800 di media a 74.000, `tredicesima detassata` da 8.100 a 74.000. La gente inizia a chiedersi a ottobre cosa succederà in busta paga l'anno dopo, mesi prima che succeda. È il segnale più sottovalutato del dataset. Il cluster straordinari, piccolo tutto l'anno, raddoppia a ottobre per lo stesso motivo (detassazione in manovra).

### Cosa esplode a NOVEMBRE (pubblicare a ottobre)

| Keyword | Volume medio | Ottobre | Novembre | Dicembre | Indice Q4 |
|---|---|---|---|---|---|
| tredicesima mensilità | 8.100 | 8.100 | **60.500** | 18.100 | 3,83 |
| contratto collettivo nazionale metalmeccanici | 27.100 | 40.500 | **60.500** | 18.100 | 1,56 |
| metalmeccanico ccnl | 27.100 | 40.500 | **60.500** | 18.100 | 1,56 |
| rinnovo ccnl metalmeccanici | 6.600 | 22.200 | **27.100** | 2.400 | 2,60 |
| tfr dipendente pubblico | 4.400 | 2.400 | **33.100** | 1.900 | 2,53 |
| aumento metalmeccanici | 3.600 | 2.400 | **18.100** | 3.600 | 2,20 |
| tredicesima 2025: quando viene pagata | 2.400 | 590 | **18.100** | 12.100 | 3,91 |

**Lettura.** Novembre è il mese in cui la tredicesima diventa **anticipazione** ("quanto mi arriverà?") e il mese dei rinnovi contrattuali. Il picco di `tredicesima mensilità` a novembre (60.500 contro una media di 8.100) precede di un mese il picco di `quando arriva la tredicesima` a dicembre: sono due momenti psicologici distinti e vanno serviti con due articoli diversi.

### Cosa esplode a DICEMBRE (pubblicare a novembre)

| Keyword | Volume medio | Ottobre | Novembre | Dicembre | Indice Q4 |
|---|---|---|---|---|---|
| quando arriva la tredicesima | 12.100 | 4.400 | 33.100 | **110.000** | 3,51 |
| tredicesima come si calcola | 8.100 | 5.400 | 18.100 | **60.500** | 3,12 |
| tredicesima | 9.900 | 14.800 | 27.100 | **49.500** | 2,98 |
| tredicesima 2025 | 6.600 | 8.100 | 18.100 | **49.500** | 3,90 |
| tredicesima quando viene pagata | 4.400 | 2.400 | 14.800 | **33.100** | 3,53 |
| calcolatore tredicesima | 5.400 | 5.400 | 14.800 | **33.100** | 3,29 |
| tredicesima: quando si prende | 3.600 | 3.600 | 12.100 | **18.100** | 3,04 |
| simulatore calcolo tredicesima | 1.600 | 1.300 | 5.400 | **12.100** | 3,41 |
| quando pagano la tredicesima | 1.300 | 720 | 2.900 | **12.100** | 3,61 |
| tfr silenzio-assenso | 1.600 | 880 | 210 | **8.100** | 2,18 |
| cos'è la tredicesima | 1.000 | 720 | 1.900 | **6.600** | 2,74 |
| fringe benefit 2025 | 5.400 | 12.100 | 14.800 | **14.800** | 2,67 |
| irpef 2026 | 14.800 | 27.100 | 27.100 | **27.100** | 1,71 |

**Lettura.** `quando arriva la tredicesima` fa **110.000 ricerche a dicembre contro una media annua di 12.100: è un fattore 9**. È il singolo picco stagionale più violento dell'intero dataset. Anche `tredicesima 2025` a 49.500 a dicembre, `tredicesima come si calcola` a 60.500.

### Cosa NON è in finestra (ma va preparato)

- **Conguaglio di fine anno.** Il conguaglio si vede nel cedolino di dicembre ma la gente lo cerca **a gennaio**: `conguaglio busta paga come si calcola` fa 1.000 a dicembre e 2.400 a gennaio; `quando arriva il conguaglio in busta paga` fa 260 a dicembre e 1.600 a gennaio. Lo stesso pattern emerge, fuori dal set misurato, da `dataforseo_labs_google_related_keywords`: `conguaglio irpef a debito` 720 a dicembre e 2.400 a gennaio, `esempio di calcolo conguaglio fiscale` 1.300 a dicembre e 2.900 a gennaio. Gli articoli sul conguaglio vanno pubblicati **a dicembre, dentro la finestra**, per raccogliere il picco di gennaio che cade appena fuori.
- **Nuove aliquote dell'anno successivo.** `aliquote irpef 2026` e `scaglioni irpef 2026` hanno indice Q4 2025 di 0,44 e 0,38 — nel Q4 2025 quella stringa non era ancora la ricerca giusta. Nel Q4 2026 la stringa che salirà è `aliquote irpef 2027` / `scaglioni irpef 2027`, oggi non misurabile. Il segnale affidabile è il comportamento di `aliquote irpef 2025`, che a ottobre-dicembre 2025 stava a 90.500/74.000/74.000 contro una media di 40.500. **Vanno preparati gli articoli sulle aliquote 2027 per novembre-dicembre 2026.**
- **CU / Certificazione Unica: FUORI FINESTRA.** Il picco è febbraio-marzo. Fuori dal set misurato, `dataforseo_labs_google_related_keywords` dà `imponibile previdenziale` a 3.600 a marzo contro 1.300 di media, e `imponibile previdenziale cud` a 260 a marzo contro 110. Non sprecare giornate dei 90 su questo.
- **730 e dichiarazione: FUORI FINESTRA.** Picco aprile-giugno. `conguaglio 730 quando arriva` e simili vanno rimandati.
- **Quattordicesima: FUORI FINESTRA.** Picco a giugno-luglio (`quando arriva la quattordicesima` 8.100 di media, picco giugno). Nei 90 giorni serve solo come contenuto di supporto alla tredicesima, non come target autonomo.
- **Ferie da smaltire.** Contrariamente all'attesa, **il picco non è a dicembre**: `ferie non godute` ha indice Q4 0,73 e picco a marzo; `quanti giorni di ferie si maturano in un mese` ha picco a luglio. La scadenza normativa che genera domanda è il 30 giugno (18 mesi), non il 31 dicembre. Il tema ferie in finestra vale meno di quanto sembri.

---

## 5. Le 25 keyword con il miglior rapporto opportunità/difficoltà

Criteri: volume reale, KD misurato, aggancio a uno dei due prodotti, e soprattutto **timing dentro la finestra ottobre-dicembre 2026**. Dove ho controllato la SERP lo dico; dove non l'ho fatto lo dico altrettanto.

| # | Keyword | Vol. | KD | Picco | Aggancio | Perché | SERP |
|---|---|---|---|---|---|---|---|
| 1 | tredicesima come si calcola | 8.100 | 0 | dicembre (60.500) | calcolatore | Q4 ×3,12, intento di calcolo puro, aggancia il calcolatore | **Controllata.** AI Overview con formula; organico Gi HR, PMI.it, Namirial, Indeed. Nessun istituzionale. Serve un angolo che l'AIO non copre |
| 2 | tredicesima mensilità | 8.100 | 0 | novembre (60.500) | calcolatore | Q4 ×3,83, il più alto tra le keyword sopra 5.000 | Non controllata |
| 3 | tredicesima detassata | 8.100 | 0 | **ottobre (74.000)** | calcolatore | ×9 sul volume medio a ottobre, apre la finestra | Non controllata |
| 4 | tassazione tredicesima | 6.600 | 0 | **ottobre (49.500)** | calcolatore | Q4 ×3,30; è la domanda "perché è più bassa?" | **Controllata.** FiscoeTasse, CISL, e **bustaia.it in pos. 3: concorrente diretto sul nostro stesso posizionamento** |
| 5 | taglio irpef | 14.800 | 0 | **ottobre (74.000)** | calcolatore | ×5 a ottobre, KD 0, è il tema della manovra | Non controllata |
| 6 | taglio irpef 2026 | 9.900 | 0 | **ottobre (40.500)** | calcolatore | Q4 ×3,28 | **Controllata.** DynamicaRetail, FunniFin, Sole 24 Ore, Corriere, Ipsoa. **Nessuna Agenzia Entrate**: aggredibile |
| 7 | quando arriva la tredicesima | 12.100 | 0 | **dicembre (110.000)** | calcolatore | Il picco più violento del dataset, ×9 | **Controllata.** Randstad, Namirial, **Sky TG24, NoiPA, Idealista**: diventa news-driven a dicembre. Puntarla sapendo che è una gara di freschezza |
| 8 | calcolatore tredicesima | 5.400 | 0 | dicembre (33.100) | calcolatore | Intento di calcolo, porta dritto allo strumento | Non controllata |
| 9 | tfr come calcolarlo | 12.100 | 0 | **ottobre (18.100)** | calcolatore | Picco in finestra, KD 0, intento di calcolo | Non controllata |
| 10 | calcolatore tfr | 12.100 | 0 | **ottobre (18.100)** | calcolatore | Stesso bisogno del #9: **non sono due articoli** | Non controllata |
| 11 | come leggere una busta paga | 3.600 | 0 | gennaio | **busta paga** | La query-manifesto del secondo prodotto | **Controllata.** Zeta Service, PDF 2016, Randstad, Edenred, Jet HR, Factorial. Nessun istituzionale, ma AI Overview forte |
| 12 | busta paga: come leggerla | 3.600 | 0 | gennaio | **busta paga** | Variante con stesso volume, utile come secondo angolo | Non controllata |
| 13 | trattenute sulla busta paga | 1.600 | 0 | gennaio | **busta paga** | Problema/sintomo confermato dal PAA di Google | **Controllata.** Randstad, OpenDotCom, Indeed, Ipsoa. Nessun istituzionale. AIO molto esteso |
| 14 | conguaglio busta paga come si calcola | 390 | 0 | gennaio (1.000 a dic) | **busta paga** | Volume basso ma SERP debolissima e picco a ridosso | **Controllata.** Confcommercio Lecco, Labor SpA, MEM Informatica, Pictet. **Qualità editoriale bassa: la migliore occasione di superare tutti** |
| 15 | rol busta paga | 1.300 | 0 | marzo | **busta paga** | Sigla del cedolino, aggancio perfetto al prodotto | **Controllata.** Dipendenti in Cloud, Indeed, Randstad, Factorial, Coverflex, Personio: SaaS HR con domini forti |
| 16 | contributo ivs in busta paga | 2.400 | 0 | luglio | **busta paga** | Sigla incomprensibile, intento problema/sintomo | Non controllata |
| 17 | superminimo in busta paga | 1.300 | 0 | febbraio | **busta paga** | Voce che la gente non capisce e teme di perdere | Non controllata |
| 18 | edr in busta paga | 1.300 | 0 | maggio | **busta paga** | Sigla pura, stesso filone | Non controllata |
| 19 | cos'è la contingenza in busta paga | 590 | 0 | marzo | **busta paga** | Voce storica che nessuno sa spiegare bene | Non controllata |
| 20 | tassazione straordinari | 2.400 | 0 | **ottobre (8.100)** | busta paga | Q4 ×2,08, KD 0, tema manovra | Non controllata |
| 21 | detassazione straordinari 2026 | 2.900 | 0 | gennaio (5.400 a ott) | busta paga | Stesso filone, sale già a ottobre | Non controllata |
| 22 | anticipazioni tfr | 5.400 | 0 | **ottobre (8.100)** | calcolatore | Picco in finestra; attenzione: 3 varianti = 1 ricerca | Non controllata |
| 23 | rinnovo ccnl metalmeccanici | 6.600 | 0 | **novembre (27.100)** | nessuno | Q4 ×2,60, KD 0; serve il lettore giusto anche senza aggancio diretto | Non controllata |
| 24 | ferie non godute | 1.900 | 0 | marzo | busta paga | SERP tutta B2B: spazio libero dal lato lavoratore | **Controllata.** Dipendenti in Cloud, Lavorosì, Ali Lavoro, Randstad, Moltocomuni. Taglio "obblighi del datore" |
| 25 | irpef 2026 | 14.800 | 0 | dicembre (27.100) | calcolatore | Q4 ×1,71, volume alto, KD 0 | Non controllata |

**Nota trasversale sulle SERP controllate: 10 SERP su 11 hanno l'AI Overview in posizione 1.** L'unica senza è `stipendio netto calcolo`. Su tutte queste query il volume misurato **non equivale a clic disponibili**: una quota rilevante della domanda viene risolta dentro la pagina dei risultati. Vale in particolare per `come leggere una busta paga`, `trattenute sulla busta paga`, `rol busta paga` e `tredicesima come si calcola`, dove l'AI Overview riporta già la risposta completa, formule e sigle incluse.

---

## 6. Keyword da evitare, e perché

**SERP istituzionale — il KD mente.**
- `scaglioni irpef 2026`, `aliquote irpef 2026` (40.500 ciascuna, KD 0). **Controllata:** l'Agenzia delle Entrate è in posizione 2 organica e viene citata dall'AI Overview. Chi definisce l'aliquota vince la query sulla definizione dell'aliquota. KD 0 qui non significa niente.
- `quando arriva la tredicesima` ha **NoiPA (MEF)** in top 10 — inserita comunque tra le 25 perché il resto della SERP è aggredibile, ma va saputo.
- Tutto il cluster `naspi` / `pagamento naspi` / `inps pagamento naspi`: INPS presidia, e il KD 16-18 lo conferma.

**Intento navigazionale — l'utente vuole un portale, non un articolo.**
- `inps cedolino` (60.500, KD 21), `www inps it cedolino` (KD 36), `estratto conto inps contributi`, `verifica contributi inps con spid`, `inps contributi versati`, `dimissioni online`, `dimissioni volontarie online`, `portale del dipendente busta paga`, `cedolino online`, `busta paga online`. **23 keyword su 24 del cluster Contributi INPS sono navigazionali.** Volume enorme, valore zero: chi cerca `inps cedolino` vuole fare login, non leggere.

**SERP da strumento, non da articolo.**
- `stipendio netto calcolo`, `calcolatore stipendio netto`, `calcolare stipendio netto` (49.500 ciascuna). **Controllata:** 10 risultati su 10 sono calcolatori. Vanno servite con la pagina-strumento esistente. Metterle nel piano editoriale come articoli è una giornata buttata.

**Ambiguità semantica — la trappola più insidiosa del dominio.**
- **`RAL` non è solo la Retribuzione Annua Lorda: è anche il sistema di codici colore RAL.** Nel bacino grezzo sono emerse con volumi alti `9010 ral`, `9005 ral`, `7035 ral`, `1013 ral`, `9016 ral`, `colori ral`, `ral colour`. Sono state escluse a mano. Qualunque espansione futura su "RAL" va filtrata, altrimenti il piano si riempie di keyword sulla vernice.
- **`ferie`** intercetta `casa per ferie`, `case per ferie`, `chiuso per ferie` (cartelli), `ferie d'agosto` (il film). Escluse.
- **`straordinari`** intercetta `la lega degli straordinari gentlemen`, `mercati straordinari`, `lavori straordinari in condominio`, `ministri straordinari della comunione`, `ricorsi straordinari al Presidente della Repubblica`. Escluse.
- `cedolino` intercetta decine di portali aziendali e universitari (`cedolino sapienza`, `asp catania`, `unina`). Escluse.
- `busta paga` intercetta un intero filone creditizio: `prestito senza busta paga`, `finanziamento senza busta paga`, `iphone a rate senza busta paga`. Volume alto, intento totalmente diverso, utente non monetizzabile per questi prodotti. Escluse.

**Fuori ICP.**
- Pensionati, pubblico impiego e NoiPA (`tfr dipendente pubblico` è rimasto nel dataset per il segnale stagionale di novembre, ma il target dichiarato è il dipendente privato), colf e badanti, bonus INPS familiari (`bonus mamme`, `bonus asilo nido`, `bonus nuovi nati`): volumi molto alti, ma sono materia INPS, non materia busta paga, e la SERP è istituzionale.

**Alto KD reale.**
- `contratto collettivo nazionale` (49.500, **KD 39**) e `buoni pasto` (12.100, **KD 38**): i due KD più alti del dataset. Le varianti settoriali e long-tail hanno KD 0 e vanno preferite.

---

## 7. Cosa NON ho verificato

- **Ho controllato 11 SERP, non 25.** Il brief ne chiedeva 20-25. Il pattern era diventato ripetitivo e stabile (AI Overview in posizione 1 quasi ovunque, organico dominato da blog HR-tech e agenzie per il lavoro, istituzionali solo su IRPEF/INPS/NoiPA), e ogni ulteriore chiamata costava molto per informazione marginale. **Le 14 keyword delle 25 finaliste marcate "Non controllata" hanno una difficoltà reale non verificata**: il loro KD 0 va trattato come indizio, non come garanzia. In particolare non ho controllato `tredicesima detassata`, `taglio irpef`, `tfr come calcolarlo`, `calcolatore tfr` e `rinnovo ccnl metalmeccanici`, che sono cinque delle prime dieci opportunità.
- **Non ho verificato l'autorevolezza di dovevalatuaral.com** su questi temi: nessuna analisi di backlink, di ranking attuali o di traffic share del dominio. Non so se il sito parta da zero o abbia già posizionamenti su questi cluster. Il giudizio "aggredibile" è relativo alla SERP, non alla forza del dominio di Riccardo.
- **Non ho misurato i concorrenti.** `bustaia.it` è emerso per caso nella SERP di `tassazione tredicesima` e ha lo stesso identico posizionamento di prodotto; non ho analizzato il suo footprint né la sua velocità di pubblicazione. Questa lacuna è però coperta dai documenti paralleli nella stessa cartella — `competitor-busta-paga.md`, `competitor-calcolatore-ral.md`, `competitor-occupanti-reali.md` — prodotti nella stessa giornata: **vanno letti insieme a questo file prima di chiudere il piano.**
- **La stagionalità Q4 è misurata sul Q4 2025.** È il dato più recente disponibile da `monthly_searches`, ma è comunque una proiezione su un anno diverso, con una legge di bilancio diversa. Le keyword datate (`2025`, `2026`) si comporteranno diversamente: quello che nel 2025 era `aliquote irpef 2026`, nel 2026 sarà `aliquote irpef 2027`, e quella stringa oggi non ha dati.
- **Non ho usato `dataforseo_labs_google_historical_keyword_data`.** La stagionalità viene dai soli 12 mesi di `monthly_searches`: non ho verificato se i picchi si ripetano su più anni o siano anomalie del 2025.
- **Non ho stimato il CTR né i clic.** Il volume è volume di ricerca. Con l'AI Overview su 10 SERP su 11, i clic effettivi saranno sensibilmente inferiori, ma di quanto non l'ho misurato.
- **Non ho valutato la difficoltà di produzione.** Alcune di queste keyword richiedono aggiornamento normativo continuo (aliquote, manovra, rinnovi CCNL): un articolo su `taglio irpef 2026` invecchia in settimane. Il piano editoriale deve tenerne conto, ma questo è un giudizio che non ho dati per dare.
- **Non ho controllato le 27 keyword con KD `non disponibile`** oltre a registrarle come tali. Fra queste ci sono query interessanti del filone sigle (`ferie ap cosa significa`, `ferie mat significato`, `codice ccnl in busta paga c011 cosa significa`, `perche ho tante trattenute in busta paga`): il loro volume è confermato, la loro difficoltà no.
