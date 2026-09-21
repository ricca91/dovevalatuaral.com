# Strategia SEO — Dove va la tua RAL

_Aggiornata il 9 settembre 2026. Questa è la fonte delle priorità di crescita correnti.
Il [recap operativo](recap-pagine-programmatiche.md) descrive l'implementazione delle pagine RAL;
la [ricerca business model](ricerca-business-model-trustmrr-canivibecodeit.md) raccoglie casi e ipotesi commerciali._

## Obiettivo e priorità

Dimostrare che le pagine RAL intercettano ricerche pertinenti e portano utenti a usare il calcolatore personalizzato.
La domanda SEO è documentata su alcune query; traffico conquistabile e sostenibilità economica restano da validare.

Ordine corrente:

1. Consolidare le pagine RAL esistenti e completare l'esperimento 28.000/39.000 euro.
2. Aggiungere una tabella lordo-netto per dipendenti, riutilizzando dati e motore.
3. Preparare un contenuto sulle discontinuità del netto («i sette salti»), verificando esempi e profili prima della pubblicazione, e distribuirlo su LinkedIn.
4. Testare poche pagine per livelli di un solo CCNL, usando il generatore retributivo già esistente.
5. Rimandare l'espansione a professioni, altri CCNL, assegno unico e impatriati fino alla valutazione dei primi esperimenti.

Non è previsto un lancio simultaneo di tutti i cluster. La priorità considera riuso del prodotto,
pertinenza dell'intento e manutenzione, non soltanto volume di ricerca.

## Stato verificato nel repository

- L'origine canonica del template è `https://www.dovevalatuaral.com`. Il vecchio sottodominio
  `jethr.riccsartori.com` è descritto come dominio legacy nella documentazione di deploy.
- [Il generatore RAL](../prototipo/genera-pagine-ral.js) produce 17 pagine, da 20.000 a 100.000 euro a passi di 5.000,
  l'hub `/confronti-ral/` e la sitemap. I risultati sono precalcolati nell'HTML statico.
- Le RAL 28.000 e 39.000 non sono ancora nell'elenco del generatore: sono un esperimento da implementare.
- Il [generatore CCNL → RAL](../prototipo/ccnl-livello.md) esiste già per Terziario Confcommercio (H011)
  e Metalmeccanica industria (C011). Compone la RAL da livello, scatti, orario e superminimo e usa il motore fiscale esistente.
- Le pagine SEO per contratto/livello sono lavoro distinto, indicato come RIC-59 nella documentazione del generatore CCNL.
  Non serve ricostruire da zero l'ingresso CCNL; serve verificare copertura e limiti per ogni pagina pubblicata.
- Le [fonti CCNL](../processo/fonti-ccnl-2026.md) documentano verifiche del 7 settembre e costi di manutenzione.
  La RAL è annualizzata a condizioni costanti; il motore usa il profilo del dipendente privato e non copre automaticamente ogni settore.
- Per pubblicare vale la [procedura del repository](../prototipo/README.md#come-si-pubblica): deploy dalla root;
  un push non pubblica automaticamente il sito.

Questa revisione ha controllato codice e documentazione. Il precedente aggiornamento riportava le 17 pagine
in produzione e una risposta 200 per la pagina 40.000; non è una nuova verifica live.
Il recupero web della pagina 35.000 durante la valutazione ha restituito un errore dello strumento:
non dimostra un guasto del sito e non conferma il deploy. Indicizzazione e canonical scelti da Google richiedono GSC.

La vecchia proposta di usare `dovevalatuaral.it` come home è superata dall'origine `.com` attuale.
La disponibilità del `.it` non è stata confermata da un registrar; un eventuale acquisto difensivo è separato dalla roadmap SEO.

## Come leggere i dati

Le ricerche DataForSEO sono state effettuate il 1° e il 9 settembre 2026, per Italia e lingua italiana.
Le medie mensili sono stime del fornitore, non utenti unici, visite previste o ricavi.

- La competizione Google Ads riguarda gli inserzionisti: `LOW` non misura la concorrenza organica.
- Il KD è una stima distinta. Un KD assente è un dato mancante; neppure KD 0 garantisce un posizionamento facile.
- Varianti e sinonimi possono sovrapporsi: i volumi non vanno sommati automaticamente.
- Query su rinnovi, preavviso e testo contrattuale non equivalgono alla domanda di un calcolatore del netto.
- SERP con AI Overview, immagini e altre risposte possono ridurre i clic disponibili; il volume non misura questo effetto.
- I dati di dominio, backlink e spam score non provano perché un sito si posiziona né quanto sia battibile.
  Nofollow e provenienza geografica, da soli, non dimostrano scarsa qualità.

Le vecchie stime aggregate (~150.000+ per CCNL, ~90.000+ per professioni, ~7.000–10.000 per RAL)
restano riferimenti esplorativi della ricerca del 1° settembre. Non sono totali deduplicati di domanda
pertinente e non vengono usati per calcolare ROI o giustificare espansioni.

## Evidenze per il cluster RAL

### Baseline GSC e GA4 riportata nel precedente aggiornamento

Per `sc-domain:dovevalatuaral.com`, il 6 settembre erano riportati 4 clic, 10 impression e posizione media 51,6 sulla home.
Le query visibili `ral 28.000 stipendio netto`, `ral 39.000 stipendio netto` e `ral 40.000 stipendio netto`
avevano ciascuna un'impression, zero clic e posizioni rispettivamente 76, 75 e 84.
Il dettaglio query non riconciliava tutti i clic; la nota precedente lo attribuiva alle omissioni per privacy di GSC.

È un primo segnale di associazione semantica, non prova di ranking stabile o volume.
GA4 riportava, dal 7 settembre, 80 sessioni, 58 utenti attivi e 244 pageview: troppo poco per dedurre
qualità del traffico organico o conversioni. GSC e GA4 non sono stati riletti in questa revisione.

### Verifica RAL riportata il 9 settembre

| Query esatta | Media mensile stimata | KD riportato | Uso operativo |
|---|---:|---:|---|
| `ral 28000 stipendio netto` | 1.000 | non disponibile | prima pagina aggiuntiva dell'esperimento |
| `ral 39000 stipendio netto` | 140 | non disponibile | test di nicchia |
| `ral 40000 stipendio netto` | 480 | 0 | pagina esistente da controllare in GSC |

La variante `40000 euro lordi quanto sono netti` era riportata a 1.300/mese: non va sommata senza deduplicazione.
Nella verifica precedente erano presenti AI Overview e People Also Ask, oltre a concorrenti dedicati:
[NettoStipendio per 28.000](https://nettostipendio.com/ral/ral-28000-stipendio-netto/) in posizione organica 7
 e [CalcoloNetto per 40.000](https://calcolonetto.it/stipendio-netto-40k/) in posizione 2.
Per 39.000 non emergeva una pagina specifica nei primi nove organici osservati: è un limite del campione, non assenza di concorrenti.

Questi dati provengono dall'aggiornamento già presente, non da una nuova misurazione delle tre query.
Nella successiva chiamata Keyword Overview del 9 settembre, 28.000 e 39.000 sono state omesse dal risultato:
quell'endpoint non le conferma né ne dimostra volume nullo.

## Controllo aggiuntivo DataForSEO — 9 settembre

Endpoint `dataforseo_labs_google_keyword_overview`, Italia/it; dati keyword aggiornati ad agosto 2026.

| Query | Media mensile stimata | Luglio 2026 | KD restituito |
|---|---:|---:|---:|
| `livello d2 metalmeccanico stipendio netto` | 3.600 | 2.400 | non disponibile |
| `5 livello metalmeccanico stipendio netto` | 1.900 | 1.000 | non disponibile |
| `stipendio netto 5 livello commercio 40 ore` | 50 | 20 | non disponibile |
| `tabella lordo netto` | 5.400 | 2.900 | 5 |
| `stipendio part time 30 ore netto` | 880 | 480 | non disponibile |

Il mese recente è inferiore alla media in questo campione; non basta a distinguere stagionalità e calo strutturale.
Il provider attribuisce inoltre a `tabella lordo netto` una lingua rilevata incongrua (`nb`): ulteriore motivo
per leggere le metriche insieme alla SERP, senza attribuire precisione assoluta al database.

### CCNL: domanda presente, concorrenza già specializzata

La SERP live desktop Italia/it per `livello d2 metalmeccanico stipendio netto` mostrava AI Overview e:

| Posizione organica | Pagina |
|---|---|
| 1 | [StipendioNettoCalcolatore, tabella per livello](https://stipendionettocalcolatore.it/stipendio-netto-ccnl-metalmeccanico-2026/) |
| 2 | [DaLordoANetto, calcolo CCNL metalmeccanico](https://dalordoanetto.com/calcolo-ccnl-metalmeccanico.html) |
| 3 | [PMI, tabelle e aumenti](https://www.pmi.it/economia/lavoro/367777/ccnl-metalmeccanico-tabelle-aumenti-livelli.html) |
| 5 | [NettoStipendio, calcolatore metalmeccanico](https://nettostipendio.com/settoriale/calcolare-stipendio-metalmeccanico/) |

È una fotografia della query, non un audit di tutte le pagine. Il cluster non è «scoperto».
La differenziazione da testare è la tracciabilità da contratto e decorrenza alla RAL, fino al netto personalizzabile.
I numeri salariali mostrati dagli snippet e dall'AI Overview non sono stati validati e non vanno usati come fonti contrattuali.

### Tabella: intento misto

La SERP live per `tabella lordo netto` includeva immagini, People Also Ask, AI Overview e numerosi risultati sportivi:
[AIC](https://www.assocalciatori.it/news/tabelle-lordo-netto-stagione-20262027) era prima,
[Coverflex](https://www.coverflex.com/it/calcolo-stipendio-netto) seconda e
[GIBA](https://www.giba.it/tabella-lordo-netto/) terza fra gli organici.

La tabella per dipendenti resta sensata per riuso e utilità, ma le 5.400 ricerche non sono tutte del nostro pubblico.
Titolo, ipotesi e contenuto devono esplicitare «lavoratori dipendenti»; prima di creare un URL nuovo,
valutare se arricchire l'hub esistente soddisfa lo stesso intento ed evita duplicazioni.

## Piano operativo e criteri di avanzamento

### 1. Consolidamento RAL

- Verificare in GSC indicizzazione e canonical della pagina 40.000 e di un campione delle 17 pagine.
- Aggiungere prima 28.000, poi 39.000 al generatore, con hub, vicine, sitemap e verifiche coerenti.
- Mantenere un URL per importo con confronto 12/13/14; niente espansione cartesiana delle mensilità.
- Verificare il percorso landing → personalizzazione → risultato. Prima di interpretare le conversioni,
  accertare che gli eventi siano presenti e funzionanti; non considerarli già implementati sulla base di questa nota.
- Separare nelle analisi il traffico organico da LinkedIn, diretto e altri canali.

Monitorare subito la copertura. Valutare le performance su una finestra di 6–8 settimane dopo l'indicizzazione
confermata, annotando per ogni pagina data di pubblicazione e prima indicizzazione osservata.
Leggere impression, query pertinenti, clic, posizione e utilizzo del calcolatore. Un campione scarso resta inconcludente.

Se le pagine non sono indicizzate, diagnosticare copertura e canonical prima di aumentarne il numero.
Se ricevono impression pertinenti ma pochi clic, esaminare posizione e SERP prima di attribuire il problema al titolo.
Se raccolgono accessi ma poca personalizzazione, verificare il percorso: una risposta già sufficiente sulla landing
può spiegare l'assenza di clic sul calcolatore. Due URL visibili sulla stessa query non provano da soli cannibalizzazione.

Espandere con altri importi solo quando emergono query ricorrenti o segnali coerenti dalle pagine del test.

### 2. Tabella e contenuto distintivo

Riutilizzare il motore per una tabella scannerizzabile con ipotesi, anno e link ai casi specifici.
Per il contenuto sui «sette salti», riconfermare quali discontinuità esistono nel profilo scelto:
il numero non va promesso come universale. Accompagnare gli esempi con fonti e calcoli riproducibili.
La distribuzione LinkedIn è un canale da usare e misurare; l'attenzione storica non garantisce nuovi backlink.

### 3. Pilota CCNL

Scegliere un solo contratto fra i due già coperti e pochi livelli, dopo controllo delle query e delle SERP specifiche.
Per ogni pagina indicare contratto, decorrenza, componenti retributive, profilo fiscale e limiti;
riutilizzare `componiRal()` senza creare una seconda fonte dei numeri.

Prima dell'espansione misurare indicizzazione, domanda pertinente, utilizzo e ore necessarie per mantenere le fonti.
La disponibilità dell'ingresso CCNL riduce il lavoro iniziale, ma non elimina la manutenzione retributiva.

### 4. Opportunità rinviate

- **Professioni:** richiedono fonti salariali e distinzioni fra lavoro dipendente, autonomo e pubblico;
  una retribuzione media non è automaticamente un input appropriato al motore attuale.
- **Part-time:** le sole ore non determinano uno stipendio; servono RAL o base contrattuale esplicita.
  Valutare le pagine insieme al pilota CCNL, senza moltiplicare ora gli URL.
- **Impatriati e assegno unico:** richiedono una valutazione normativa e di prodotto autonoma.
  Il riuso di alcuni input non dimostra copertura delle regole o basso costo di realizzazione.
- **Altri contenuti fiscali e welfare:** selezionare quelli che aiutano un caso d'uso del calcolatore;
  CPC elevato e volume generico non dimostrano un pubblico monetizzabile.

## Qualità e sostenibilità

Ogni pagina deve rispondere alla ricerca anche senza proseguire alla home. La generazione automatica
non è di per sé un problema: Google contesta le pagine create su larga scala con poco valore e le doorway
che fungono da passaggi intermedi poco utili. [Policy Google](https://developers.google.com/search/docs/essentials/spam-policies)

Il differenziale proposto è un calcolo verificabile, con fonti, ipotesi e personalizzazione.
Non è ancora dimostrato che questo basti a superare i concorrenti.

Sul piano economico, distinguere l'utente SEO che cerca il proprio stipendio dal pubblico HR raggiunto sui social.
Prima di costruire infrastruttura sponsor, validare una combinazione di pubblico, inserzionista, azione e risultato
misurabile. Il piano commerciale e i suoi limiti sono nella [ricerca business model](ricerca-business-model-trustmrr-canivibecodeit.md).

## Provenienza e limiti

- Ricerca del 1° settembre: esplorazione iniziale keyword, competitor e business model; le interpretazioni
  su facilità di ranking, dominio `.it` e priorità per volume sono sostituite da questa revisione.
- Precedente aggiornamento del 9 settembre: baseline GSC/GA4 e verifiche RAL riportate sopra, non ripetute qui.
- Valutazione del 9 settembre: Keyword Overview e due SERP live. ID task DataForSEO per riscontro:
  `09091728-9717-0607-0000-07e0219c4c13` (keyword),
  `09091728-9717-0139-0000-acbebd3a5da2` (D2),
  `09091728-9717-0139-0000-dbae9e56aeab` (tabella).
  Le risposte integrali sono nella conversazione di valutazione, non in un export locale allegato.
- Revisione documentale: controllo dei file del repository; nessun nuovo audit fiscale, di produzione o di analytics.
