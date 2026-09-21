# Chi occupa davvero le posizioni 1-10 sulla busta paga

**Rilevazione: 20 settembre 2026.** Secondo passaggio del teardown SEO per `dovevalatuaral.com`.
Segue e corregge `competitor-busta-paga.md` (stessa data), dove avevo segnalato che i veri occupanti del territorio non sono BustaIA/GioIA/Cedolingo. Questo documento verifica l'ipotesi, la conferma, e **corregge una delle lacune che avevo classificato male**.

---

## 1. Metodo

| Endpoint | Input | Output |
|---|---|---|
| `dataforseo_labs_google_serp_competitors` | **38 keyword** del territorio già misurate (lettura cedolino, voci, trattenute, conguaglio, TFR, ROL, ferie, esempi, colf, calcolatori) | **702 domini**; analizzati i primi 45 per ETV |
| `backlinks_bulk_ranks` | 24 domini, scala 0-1000 | rank da referring domains, **dato real-time** |
| `serp_organic_live_advanced` | `busta paga colf`, depth 10 | SERP osservata dal vivo |
| WebFetch | 7 pagine | anatomia |

**Perché `serp_competitors` e non il traffico assoluto.** Indeed ha milioni di keyword e Randstad centinaia di migliaia: il loro traffico totale non dice nulla. `serp_competitors` misura **solo le 38 keyword che ci interessano**, e restituisce per ciascun dominio quante ne prende, in che posizione, con quanto ETV. È la metrica giusta per questa domanda.

**Limiti.**
- ETV e visibility sono **stime DataForSEO**; posizioni e composizione SERP di `busta paga colf` sono **osservate**. Le posizioni dentro `serp_competitors` derivano dal database SERP del fornitore, non da una lettura live query per query.
- **`it.indeed.com` ha restituito HTTP 403** a WebFetch: non ho potuto leggere la pagina che è posizione 1 su `troppe trattenute in busta paga`. Di Indeed ho solo posizioni, snippet e citazioni nell'AI Overview. **Non verificato.**
- `colfinregola.it/busta-paga-colf/` dà **404**: l'URL che si posiziona è la homepage. Corretto via SERP live.
- Le 38 keyword sono un campione del territorio, non il territorio intero. Un dominio forte su cluster che non ho incluso non appare.
- `backlinks_bulk_ranks` misura **solo i referring domains**. Non misura qualità editoriale, brand, né E-E-A-T.

---

## 2. Il set reale, dimensionato sul nostro territorio

Ordinato per ETV sulle 38 keyword. `rank` = backlink rank 0-1000.

| # | Dominio | kw | ETV territorio | pos. mediana | visibility | rank backlink | Che cos'è |
|---|---|---|---|---|---|---|---|
| 1 | **zetaservice.com** | 15 | **4.105** | **2** | 9,30 | 218 | outsourcing payroll B2B |
| 2 | ipsoa.it | 13 | 3.202 | 17 | 2,55 | **505** | editoria fiscale (Wolters Kluwer) |
| 3 | **randstad.it** | 18 | 2.537 | 7 | 8,15 | 489 | agenzia per il lavoro |
| 4 | fondopriamo.it | 4 | 2.042 | 11 | 1,15 | n.r. | fondo pensione di categoria |
| 5 | **factorial.it** | **19** | 1.834 | **4** | **10,40** | **586** | SaaS HR |
| 6 | am.pictet.com | 4 | 1.524 | **1** | 2,50 | 384 | asset manager (!) |
| 7 | dottrinalavoro.it | 3 | 1.282 | 2 | 2,40 | 423 | portale consulenti (il PDF 2016) |
| 8 | **it.indeed.com** | 19 | 1.033 | 13 | 5,45 | 499 | portale annunci |
| 9 | dipendentincloud.it | 4 | 868 | **1** | 3,90 | 407 | SaaS gestione dipendenti |
| 10 | **jethr.com** | **20** | 749 | 9 | 5,00 | **224** | SaaS payroll + consulenza |
| 11 | skello.io | 1 | 578 | **1** | 1,00 | 301 | SaaS pianificazione turni |
| 12 | opendotcom.it | 6 | 541 | 3 | 3,65 | 307 | software paghe |
| 13 | inps.it | 6 | 497 | 7 | 1,90 | n.r. | ente |
| 14 | wikilabour.it | 9 | 479 | 25 | 1,50 | 367 | wiki sindacale (CGIL) |
| 15 | colfinregola.it | 2 | 450 | **1** | 2,00 | **169** | generatore busta paga colf |
| 16 | edenred.it | 7 | 384 | 5 | 3,30 | 388 | welfare/buoni pasto |
| 17 | laborability.com | 19 | 316 | 17 | 2,20 | 227 | media sul lavoro |
| 18 | coverflex.com | 7 | 284 | 13 | 2,05 | 300 | SaaS welfare |
| 19 | youtube.com | **28** | 281 | 14 | 2,45 | — | video |
| 20 | facebook.com | 22 | 395 | 24 | 2,80 | — | social |
| 21 | fiscoetasse.com | **24** | 235 | 23 | 2,90 | 433 | editoria fiscale |
| — | **bustaia.it** | 14 | **259** | **46** | **1,15** | **nessun rank** | il concorrente di prodotto |

### Quattro cose che questa tabella dice

**1. Il set che ipotizzavi è quasi giusto, con una sostituzione importante.** Jet HR, Factorial, Coverflex, Indeed e Randstad ci sono tutti. Ma il numero uno è **Zeta Service**, che non era nella lista: 15 keyword, **ETV 4.105**, posizione mediana **2**. È un'azienda di outsourcing paghe, non un SaaS. È prima su `voci busta paga`, `come si legge la busta paga`, `come leggere una busta paga`, `codici busta paga`; seconda su `tfr in busta paga`, `conguaglio busta paga`, `busta paga spiegazione voci`.

Non ci sono invece, o sono marginali: **laleggepertutti** e **PMI.it** non compaiono tra i primi 45; **Fiscoetasse** c'è ma con posizione mediana 23; **Zucchetti, TeamSystem, Danea, InfoJobs** non appaiono affatto su queste query.

**2. Jet HR ha la copertura più ampia e la resa peggiore.** 20 keyword sul territorio — il massimo insieme a Factorial — ma posizione mediana **9** e ETV **749**, cioè un sesto di Zeta Service con più keyword. Sta ovunque e non vince quasi mai: unico picco è `controllo busta paga online gratis` (pos 2, dietro BustaIA) e `addizionale regionale busta paga` (pos 2). **Non è l'avversario più forte del territorio, è il più presente.**

**3. Factorial è il vero leader di visibilità.** 19 keyword, posizione mediana **4**, **visibility 10,40** — la più alta del set. È primo su `esempio busta paga con malattia`, `carenza malattia busta paga` e `busta paga spiegazione voci`; terzo-quarto su quasi tutto il resto.

**4. BustaIA su questo territorio è fuori gioco.** 14 keyword, posizione mediana **46**, visibility 1,15. L'unica cosa che ha è `controllo busta paga online gratis` in posizione 1. Conferma e rafforza il dato del primo documento: **BustaIA non è il concorrente editoriale, è il concorrente di prodotto su una sola query.**

---

## 3. Authority o contenuto? La domanda che decide se si entra

Correlazione di Spearman su 20 domini con entrambi i dati:

| Coppia di variabili | ρ |
|---|---|
| backlink rank ↔ **posizione mediana** | **+0,01** |
| backlink rank ↔ ETV sul territorio | +0,48 |
| backlink rank ↔ visibility | +0,41 |
| n. keyword ↔ ETV | −0,01 |

**Il dato decisivo è il primo: la correlazione tra autorità di dominio e posizione mediana è +0,01, cioè zero.** Su questo territorio l'autorità di dominio non predice dove ti posizioni. La correlazione moderata con l'ETV (+0,48) si spiega diversamente: i brand grandi coprono *più* keyword ad alto volume, non le coprono *meglio*.

Le prove per contrasto:

- **Zeta Service, rank 218, è primo davanti a Ipsoa (505) e Indeed (499).** Ha meno della metà della loro autorità e li batte di quindici posizioni mediane.
- **Quattro domini con rank ≤ 310 hanno posizione mediana ≤ 3**: skello.io (301, mediana 1), colfinregola.it (**169**, mediana 1), zetaservice.com (218, mediana 2), opendotcom.it (307, mediana 3).
- **studio-borghi.it (193)** è pos 2 su `tredicesima in busta paga` e pos 3 su `busta paga spiegazione voci`. **consulentidellavoro-piga-riitano.it (203)** — uno studio di consulenti — è pos 1 su `esempio busta paga part time` e pos 3 su `tredicesima in busta paga`.
- All'opposto, **Fiscoetasse (433) è a posizione mediana 23** e **Lavoro e Diritti (987 di rating, 24 keyword) a posizione mediana 63**: autorità e ampiezza senza risultato.

### E l'autorità di partenza di Riccardo?

`backlinks_bulk_ranks` ha restituito **nessun valore di rank** per `bustaia.it`, `chiediagioia.it`, `cedolingo.com` e `dovevalatuaral.com`: zero backlink rilevati per tutti e quattro.

Due conseguenze, entrambe rilevanti:
1. **Sul piano dei link, Riccardo parte esattamente da dove sta BustaIA.** Il loro vantaggio di 2.395 keyword posizionate non nasce da backlink: nasce da volume di pagine pubblicate e da anzianità. È recuperabile con il lavoro editoriale.
2. **La soglia d'ingresso più bassa osservata è 169** (colfinregola). Non serve arrivare a 500 come Ipsoa. Ma un rank *nullo* non è la stessa cosa di 169: **qualche decina di referring domain servirà comunque**, e non è oggetto di questo documento.

**Verdetto: questo territorio si vince col contenuto, non con l'autorità.** È la condizione necessaria perché il piano da 90 pezzi abbia senso. È verificata.

---

## 4. Anatomia: cosa c'è davvero dentro le pagine che vincono

Sette pagine lette il 20/09/2026. Indeed non leggibile (403).

| Pagina | Parole | Numeri veri | Fonti con estremi | Data aggiorn. | Calcolatore | FAQ | Esempio annotato |
|---|---|---|---|---|---|---|---|
| **Zeta Service** `come-leggere-una-busta-paga` (pos 1-2) | ~3.500 | **nessuno** | 4, senza date | **assente** | no | no | no |
| **Factorial** `come-leggere-busta-paga` (pos 3-4) | ~4.500 | **uno** (EDR 10,33 €) | **nessuna** | 12/01/2026 | no | **sì (5)** | **immagini SVG placeholder rotte** |
| **Jet HR** `come-leggere-busta-paga` (pos 4-7) | ~1.400 | 2 (9,19% · 26 gg) | link senza estremi | 29/09/2025 | no (solo in navbar) | no | no |
| **Jet HR** `come-controllare-...-corretta` (pos 2-3) | ~1.900 | **nessuno** | **sì: L. 4/1953, art. 39 D.L. 112/2008, D.M. 9/7/2008** | — | no | no | no |
| **Dipendenti in Cloud** `permessi-rol` (**pos 1** ×3) | ~1.800 | pochi (÷12, 15 gg, 18 mesi) | **nessuna con estremi** | **assente** | no | no | no |
| **Coverflex** `liquidazione-tfr-come-si-legge` | ~1.900 | sì (÷13,5 · 1,5%+75% ISTAT · 17% · es. 30.000 € → 11.111 €) | art. 2120 c.c., D.Lgs. 47/2000 art. 11 c. 3 | 27/08/2026 | **no** | no | sì (testuale) |
| **Skello** `esempio-busta-paga-liquidazione-tfr` (**pos 1**) | ~3.500 | **sì, molti** | **sì, 4 con estremi** | **28/07/2026** | **sì, funzionante** | **sì (9)** | **sì, commentato** |

### Il pattern, in una riga

**Le due pagine che stanno in posizione 1-2 sulle query più grosse — Zeta Service e Factorial — non contengono un solo calcolo.** Zeta Service scrive 3.500 parole senza un numero, non dichiara una data di aggiornamento, e **promette nel titolo "lista dei codici" senza fornirla**. Factorial scrive 4.500 parole con un solo importo, **zero fonti normative**, e i suoi due "cedolini annotati" sono **placeholder SVG che non caricano alcun contenuto visivo**.

Google le premia comunque. Il che significa che oggi vincono per **copertura di entità, struttura dei heading e corrispondenza d'intento** — non per qualità sostanziale. È una posizione difendibile solo finché nessuno fa meglio.

### E chi fa meglio, vince

**Skello è la controprova.** Rank 301 — meno di Factorial (586), Randstad (489) e Indeed (499) — e sta in **posizione 1** con una pagina sola. Cosa ha che gli altri non hanno, tutto insieme:
- esempio numerico lavorato con tabella progressiva (Marco, CCNL Commercio, RAL 28.000 €, 5 anni → TFR cumulato 10.554 €, di cui 607 € di sola rivalutazione ISTAT);
- secondo esempio sulla tassazione (10.554 € lordi → reddito di riferimento 25.330 € → aliquota 25% → ~7.915 € netti);
- **simulatore funzionante** (RAL, anni, inflazione ISTAT, aumenti stimati → "Calcola il mio TFR") con disclaimer "stima indicativa";
- **fonti con estremi**: art. 2120 c.c., L. 29 maggio 1982 n. 297, artt. 17 e 19 TUIR (D.P.R. 917/1986), art. 2 L. 297/1982 — con un badge "⚖️ Legge" accanto;
- **"Aggiornato il 28/7/26"** in testa;
- **FAQ a 9 domande**.

**Questa è esattamente la ricetta che avevo raccomandato nel primo documento prima di aver letto Skello.** Non è una teoria: è il pattern che occupa la posizione 1 con un dominio di autorità media. È replicabile.

### Modelli di business dietro (e perché conta)

Tutti gli occupanti monetizzano **altrove**: Zeta Service vende outsourcing paghe B2B, Factorial/Jet HR/Coverflex/Skello/Dipendenti in Cloud vendono SaaS alle aziende, Indeed e Randstad vendono annunci e somministrazione, Ipsoa e Fiscoetasse vendono abbonamenti editoriali, Edenred vende buoni pasto.

**Nessuno di loro ha come cliente il lavoratore che sta leggendo.** Il lettore è un sottoprodotto: Factorial scrive per il dipendente e mette "Richiedi una demo", Jet HR scrive per il lavoratore e rimanda a un SaaS per aziende. Sono contenuti scritti per attrarre traffico che converte su qualcun altro.

Riccardo è l'unico che avrebbe come utente finale **la stessa persona che legge la pagina**. È il motivo strutturale per cui può permettersi di mettere in pagina il calcolo vero invece di trattenerlo dietro una demo.

---

## 5. Verdetto cluster per cluster

### C1 — "come leggere la busta paga" (3.600/mese, KD 0)
**Avversari reali:** Zeta Service (pos 1-2), dottrinalavoro.it (PDF 2016, pos 2), Randstad (pos 3), Factorial (pos 4), Edenred (pos 5), Jet HR (pos 7), studio-borghi (pos 8).
**Cosa serve al nostro pezzo:**
- un **cedolino reale annotato e navigabile** — Factorial ce l'ha rotto (SVG placeholder), nessun altro ce l'ha;
- **almeno un lordo→netto calcolato per intero**: Zeta Service ha zero numeri in 3.500 parole, Jet HR ne ha due;
- **fonti normative con estremi**, prendendole dove Jet HR le mette bene (L. 4/1953, art. 39 D.L. 112/2008, D.M. 9/7/2008) e Zeta Service le cita senza date;
- **la lista codici vera**, che Zeta Service promette nel titolo e non consegna: è un differenziatore già pagato dall'intento;
- **data di aggiornamento visibile** — assente su Zeta Service e su Dipendenti in Cloud, presente su Skello che vince;
- **schema FAQ**: solo Factorial ne ha una, di 5 domande generiche.
**Giudizio: si entra.** È la SERP più debole rispetto al volume di tutto il territorio.

### C2 — Esempi di cedolino per casistica
**Avversari reali:** su TFR è **Skello in posizione 1, ed è forte** — non attaccarlo di petto. Sulle altre casistiche gli occupanti sono deboli: Factorial pos 1 su `esempio busta paga con malattia`, studiocampesato pos 2, studiomontali pos 3, Ipsoa pos 23; `esempio busta paga part time` è di uno studio di consulenti (pos 1) e Fiscoetasse (pos 7).
**Cosa serve:** **il format Skello applicato alle sei casistiche che Skello non copre** (malattia, infortunio, maternità, part-time, a chiamata, pignoramento). Cioè: esempio numerico lavorato + tabella + fonti con estremi + data + FAQ + simulatore. Skello presidia una keyword sola; il format è il suo, il territorio è libero.
**Giudizio: si entra, copiando la struttura del leader dove il leader non c'è.**

### C3 — Conguaglio / 730
**Avversari reali:** Pictet (asset manager, pos 1 — mediana 1 con 4 keyword), Zeta Service pos 2, 4Stars pos 3, elisalupo.com pos 3, **un post Facebook della UILM in posizione 5**, NoiPA pos 4-5, studi locali.
**Cosa serve:** poco. È la SERP più debole osservata e ha 9 PAA. Serve un pezzo con il **conto del conguaglio rifatto** (nessuno lo fa: Pictet è divulgazione finanziaria, 4Stars e gli studi sono testi brevi), **la data**, e **lo schema FAQ sulle 9 PAA raccolte**. Stagionale: online entro novembre.
**Giudizio: si entra, ed è il rapporto sforzo/risultato migliore.**

### C4 — Voce per voce (ROL, EDR, contingenza, FAP, ferie AP)
**Avversari reali:** Dipendenti in Cloud (pos 1 su ROL e ferie, ma **nessuna fonte con estremi, nessuna data, nessuna FAQ, nessun calcolatore**), Randstad, Indeed, Factorial, 360Forma; su `edr busta paga` sono **Wikilabour pos 1 e Wikipedia pos 2**.
**Cosa serve:** **mai il formato definizione.** L'AI Overview su `cosa sono i rol in busta paga` è completo e cita sette fonti: la definizione è già data sopra il fold. Serve "**dove sta questa voce nel tuo PDF, che numero ci deve essere, e come verifichi che sia giusto**" — più le tre cose che al leader mancano (fonti con estremi, data, FAQ) e il calcolo, che nessuno ha.
**Giudizio: si entra solo con taglio verifica, non spiegazione. Basso volume per pezzo, alto valore di link interno verso le pagine-sintomo.**

### C5 — Colf e badanti ⚠️ **CORREZIONE del primo documento**
Nel primo documento avevo classificato colf/badanti come quinta lacuna migliore. **La SERP osservata dice che è un errore.**

La prima pagina di `busta paga colf` è: **colfinregola.it #1 e #2** (*"Crea la tua busta paga con pochi click e senza registrazione"*), **webcolf.com #4** (*"Calcola, simula, pianifica. Gratis"*), **colf.info #5**, **un PDF modello di infocolf.it #7**, Associazione Domina #8, **mondocolf.it #9**. L'AI Overview cita **solo generatori e moduli**.

L'intento non è informativo: è **"generami un cedolino per la mia colf, gratis e subito"**. Sono datori di lavoro domestici che devono *produrre* una busta paga, non lavoratori che devono *capirla*. È l'opposto del prodotto di Riccardo. Un articolo, per quanto ben fatto, non compete con un generatore gratuito.
**Giudizio: non si entra con contenuti editoriali. Declassato da "quinta lacuna migliore" a "fuori perimetro", a meno di costruire un generatore di cedolini per lavoro domestico — che è un altro prodotto.**

### C6 — Pagine-sintomo
**Avversari reali:** su `troppe trattenute in busta paga` è **Indeed in posizione 1** (pagina non leggibile, 403 — **non verificata**), poi Adecco pos 3, Fiscoetasse pos 7, Jet HR pos 9, Randstad pos 12, BustaIA pos 20. Su `controllare la busta paga` / `controllo busta paga online gratis` è BustaIA pos 1-2 con Jet HR pos 2-3.
**Cosa serve:** è l'unico cluster dove **nessun occupante ha un motore di calcolo in pagina**. Indeed, Adecco, Randstad e Fiscoetasse sono redazioni generaliste che scrivono spiegazioni; BustaIA ha il motore ma la sua pagina-sintomo è 680 parole senza un numero né una fonte (vedi primo documento). Serve: **input dell'utente → differenza calcolata → cause ordinate per probabilità, ognuna con il suo conto**.
**Giudizio: si entra, ed è il cluster con il vantaggio competitivo più difendibile.** Nessuno degli occupanti può replicarlo senza costruire un motore, e nessuno di loro ha incentivo a farlo perché monetizza altrove.

### Tabella di sintesi

| Cluster | Avversario principale | Perché è battibile | Cosa deve avere il nostro pezzo | Entrare? |
|---|---|---|---|---|
| C1 come leggere | Zeta Service (rank 218) | 3.500 parole, **zero numeri**, no data, promette codici e non li dà | cedolino annotato vero + lordo→netto calcolato + lista codici + fonti con estremi + FAQ | **Sì, priorità 1** |
| C2 esempi casistica | Skello su TFR (forte), deboli altrove | Skello copre **1 sola** delle 7 casistiche | il format Skello sulle 6 casistiche libere | **Sì, priorità 2** |
| C3 conguaglio/730 | Pictet, 4Stars, **post Facebook UILM pos 5** | SERP più debole osservata, 9 PAA | il conguaglio ricalcolato + data + schema FAQ | **Sì, miglior ROI** |
| C4 voce per voce | Dipendenti in Cloud (pos 1) | no fonti, no data, no FAQ, no calcolo | taglio "dove sta e come verifichi", mai definizione | Sì, con riserva |
| C5 colf/badanti | colfinregola (rank 169, pos 1-2) | **non è battibile con un articolo: la SERP vuole un generatore** | — | **No — declassato** |
| C6 pagine-sintomo | Indeed (non verificato) + BustaIA | nessuno ha un motore in pagina | input utente → differenza calcolata → cause col conto | **Sì, più difendibile** |

---

## 6. Cosa NON ho verificato

- **La pagina Indeed in posizione 1 su `troppe trattenute in busta paga`**: HTTP 403. Il verdetto su C6 si regge su posizioni e snippet, non sul contenuto letto.
- **Non ho letto** le pagine di Randstad, Ipsoa, Edenred, Opendotcom, Wikilabour, Laborability, Fiscoetasse, Pictet. Per questi ho solo posizioni e ETV stimati.
- **Nessun controllo dello schema markup nel sorgente.** Le note su FAQ/HowTo/Article derivano da ciò che è visibile in pagina, non dal JSON-LD. Per un'analisi vera servirebbe `on_page_instant_pages` o un'ispezione del markup.
- **La correlazione ρ = +0,01 è calcolata su 20 domini.** È un campione piccolo: indica assenza di relazione su questo insieme, non una legge generale.
- **`backlinks_bulk_ranks` non ha restituito rank per bustaia.it, chiediagioia.it, cedolingo.com, dovevalatuaral.com.** L'ho letto come "nessun backlink rilevato", ma potrebbe anche essere un dominio non ancora indicizzato nel database backlink del fornitore. **Non ho distinto i due casi.**
- **Non ho misurato la freschezza come fattore.** Ho registrato le date dichiarate ma non ho testato se correlano con la posizione.
- **Non ho verificato le affermazioni normative** delle pagine lette (art. 2120 c.c., L. 297/1982, artt. 17-19 TUIR, L. 4/1953, art. 39 D.L. 112/2008, D.M. 9/7/2008). Sono riportate come *ciò che quelle pagine dichiarano*. **Vanno controllate su Normattiva prima di riusarle.**
- **Non ho stimato quanto traffico porterebbe entrare in top-5** su nessuno di questi cluster.
- **Non ho analizzato il profilo di backlink necessario per partire.** So che la soglia più bassa osservata è 169 e che partiamo da zero; non so quanti referring domain servano né in quanto tempo.
