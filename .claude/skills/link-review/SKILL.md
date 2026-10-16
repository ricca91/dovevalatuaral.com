---
name: link-review
description: revisione backlink del lunedì per dovevalatuaral.com (link ottenuti, GSC 28 contro 28 giorni, DataFast, pipeline Outreach, 5 azioni)
disable-model-invocation: true
---

Fai la revisione settimanale dei backlink di dovevalatuaral.com e chiudi con un blocco `REPORT_`.
Sei in sola lettura: non scrivi file, non tocchi Airtable, non mandi mail.

## Contesto

I link sono lenti: si giudicano su 60-90 giorni. Questa revisione misura ciò che conta (clic, impressioni,
posizioni, visitatori portati), non DR o numero di link, e non giudica troppo presto.
Spec: `crescita/sistema-backlink-2026-10-13.md`, sezione "link-review". Il punto zero (13 ottobre 2026) è
2 domini referenti, entrambi spazzatura: `gym-essentials-shop.shop` (nofollow) e `gunghapcafe.com` (immagine,
spam score 50). Nessun link utile.

Il sito vive per due prodotti: "Ti spiego la busta paga" e il calcolatore RAL → netto. Le pagine
`/minimi-ccnl/…` sono la destinazione dei link; commercio è la prima (aumento dal 1° novembre 2026).

## Data di oggi

Se il prompt contiene RUNNER FACTS con la data di oggi, usa quella. Altrimenti:

    node processo/link/misure.mjs date

Prendi da lì tutte le soglie, non contarle a mano: `settimana` (ultimi 7 giorni), `dataforseo_date_from`,
`followup_dovuto_se_invio_entro`, `attesa_se_link_dopo`. Con una data esplicita: `… misure.mjs date AAAA-MM-GG`.

## Gli strumenti

- **Airtable**, base `appAsCWc7NBzY5nam`, tabella Outreach `tbl3ELP9SWiFPTO2A`. Usa `list_records_for_table` del
  server che hai (`mcp__plugin_airtable_airtable__…` oppure `mcp__claude_ai_Airtable__…`). La tabella è piccola:
  leggi tutti i record, paginando con `cursor` se serve. Campi: Dominio, URL pagina, Tipo, Stato, Data invio,
  Data link, URL del link (la pagina che contiene il link), Nostra pagina di destinazione, Anchor, rel,
  Recuperato o nuovo, Note. Solo lettura. Lo schema non ti serve (e non hai il tool per leggerlo): i campi sono
  questi. La tabella è nata vuota il 15 ottobre 2026 (RIC-120): 0 record è uno stato normale finché link-fonti
  non la riempie, non un guasto da segnalare.
- **DataForSEO**: `mcp__dataforseo__backlinks_summary` e `mcp__dataforseo__backlinks_backlinks`, target sempre
  `dovevalatuaral.com`. Non usare `backlinks_bulk_new_lost_referring_domains`: il 15 ottobre 2026 contava come
  "nuovi dall'8 ottobre" due domini che DataForSEO aveva visto il 9 e il 25 settembre, e non restituisce i persi.
- **`node processo/link/misure.mjs`**, l'attrezzo deterministico delle skill backlink. Stampa JSON.
  Se una fonte non risponde stampa il motivo su stderr ed esce con 2: in quel caso quella fonte "non ha risposto",
  e lo scrivi così.
  - `gsc <oggi> [pagina …]`: trova l'ultimo giorno con dati GSC (di solito 2-3 giorni fa), confronta gli ultimi
    28 giorni con i 28 precedenti, per il sito e per ogni pagina passata (www e senza www sommate); elenca le
    query di quelle pagine entrate in top 10 con almeno 10 impressioni e conta quelle sotto.
  - `datafast <oggi> [dominio …]`: visitatori da ciascun dominio negli ultimi 28 giorni completi contro i 28 prima.
  - `link <url della pagina che linka> <nostra pagina concordata>`: scarica la pagina e riporta stato HTTP, link
    verso il sito con anchor, `rel` effettivo (follow, nofollow, sponsored, ugc), se puntano alla pagina concordata
    e il testo del paragrafo intorno.

Dipendenze di `misure.mjs` fuori dal repo (non copiarle, non stamparle):

- GSC: `/root/ricc-os/integrazioni/gsc/gsc.mjs` (non versionato), con le credenziali OAuth read-only in
  `~/.config/ricc-os/google-readonly-mcp/`. Sovrascrivibile con `GSC_BIN`; proprietà `sc-domain:dovevalatuaral.com`
  (`GSC_SITE`). Se il token scade: `node /root/ricc-os/integrazioni/gsc/gsc.mjs login`, lo fa Riccardo.
- DataFast: `DATAFAST_API_KEY` dall'ambiente; se manca, dal file `/root/ricc-os/projects/dovevalatuaral.com/.env`
  (checkout principale, ignorato da git; il percorso si cambia con `DATAFAST_ENV_FILE`). La chiave non va mai
  stampata, né nella risposta né in un comando: non leggere quel file tu, ci pensa `misure.mjs`.

## I passi

### 1. Link della settimana

- Da Airtable: record con Stato `Link ottenuto` e Data link nella `settimana`.
- Da DataForSEO: `backlinks_backlinks` con `target: "dovevalatuaral.com"`, `order_by: ["first_seen,desc"]`,
  `limit: 100`; sono nuovi quelli con `first_seen` da `dataforseo_date_from` in poi. Un link trovato da DataForSEO
  che non è in Airtable è "spontaneo": va contato a parte, non tra quelli dell'outreach.
- Per ogni link della settimana in Airtable: `misure.mjs link <URL pagina> <Nostra pagina di destinazione>`.
  Se URL del link è diverso da URL pagina, controlla anche quello. Riporta:
  - vivo: HTTP 200 e almeno un link verso il sito;
  - sulla pagina concordata: il link sta su URL pagina;
  - verso l'URL concordato: `verso_destinazione`;
  - `rel`: quello effettivo coincide con il campo rel di Airtable?
  - test del lettore, in una frase, dal `contesto`: cosa ottiene chi legge quel paragrafo cliccando?
    Se non sai rispondere, il test non è superato.
  Se `link` esce con 2 o la pagina non è HTML leggibile (JavaScript, 403), scrivi "non verificato" e perché.
- Link persi: ricontrolla con `link` anche tutti i record `Link ottenuto` più vecchi. Se la pagina non risponde
  200 o il link verso di noi non c'è più, il link è perso: va in cima alle azioni se la pagina prendeva clic.
- Limite noto: i link persi che non sono su Airtable non li vedi. `backlinks_backlinks` restituisce solo i link
  vivi: l'API sceglie vivi o persi con `backlinks_status_type` (default `live`), che lo strumento MCP non espone,
  e un filtro su `is_lost` non trova niente tra i vivi; la risposta non ha nemmeno una data di perdita. Non provare
  altre strade a pagamento: scrivi nel report che i persi fuori da Airtable non sono misurati.

### 2. Misura

- Pagine linkate: la Nostra pagina di destinazione di tutti i record `Link ottenuto`, di qualunque data.
  `misure.mjs gsc <oggi> <pagina> <pagina> …`. Per ciascuna: guadagna impressioni? Perde clic? Quali query sono
  entrate in top 10?
- Domini che linkano: il Dominio dei record `Link ottenuto` più i domini spontanei del passo 1.
  `misure.mjs datafast <oggi> <dominio> <dominio> …`: visitatori portati, 28 giorni contro 28.
- Anche senza pagine né domini lancia `gsc <oggi>` e `datafast <oggi>`: confermano che le fonti rispondono e
  danno il riferimento del sito (clic e impressioni GSC, visitatori DataFast) in una riga.

### 3. Conti separati

Mai mescolati: link nuovi e link recuperati (campo Recuperato o nuovo), della settimana e in totale; domini
referenti e backlink (`backlinks_summary`: `referring_domains` e `backlinks`, con i nofollow) confrontati con il
punto zero; link spontanei a parte.

Recuperato o nuovo lo scrivono le skill: link-recupero `Recuperato`, link-fonti e link-dono `Nuovo`.
Un record con Recuperato o nuovo vuoto conta come `Nuovo`: contalo così e segnalalo (quanti record e quali
domini) in questa sezione e in `REPORT_NOTE`.

### 4. Attesa

Una pagina il cui link più vecchio ha Data link dopo `attesa_se_link_dopo` ha un link da meno di 60 giorni:
scrivi "attesa" e i numeri, nessun giudizio. Si giudicano solo le pagine con un link da 60 giorni o più.

### 5. Pipeline Outreach

Conta per Stato: Da qualificare, Qualificato, Bozza pronta, Inviata, Follow-up, Link ottenuto, Menzione,
Rifiutato, Chiuso. Poi:

- inviati: record con Data invio, in totale e nella settimana;
- risposte: Link ottenuto + Menzione + Rifiutato (Airtable non ha un campo risposta e Gmail non lo leggi: dillo);
- sollecito dovuto: Stato `Inviata` con Data invio fino a `followup_dovuto_se_invio_entro` (lo prepara link-dono);
- in scadenza: Stato `Inviata` con Data invio dopo quella data, che arrivano a 7 giorni entro lunedì prossimo.

### 6. Cinque azioni

Cinque, ordinate per valore di business, non per numero di link. Prima ciò che protegge o porta clic
verso le pagine che servono i prodotti (un link perso o sbagliato verso una pagina che già prende clic, una
pagina CCNL con un aumento in arrivo), poi le scadenze (solleciti dovuti, tranche CCNL entro 30 giorni), poi la
pipeline (prospect da qualificare, bozze da inviare), infine il resto. Ogni azione: chi la fa (Riccardo,
link-fonti, link-dono, link-recupero), cosa, e il dato di questa revisione che la giustifica. Se oggi le azioni
utili sono meno di cinque, scrivi solo quelle e dillo in una riga: un'azione inventata per fare numero, o che
chiede di controllare la revisione stessa, toglie attenzione a quelle vere.

## Regole

- Nessun numero senza fonte. Ciò che non hai è "n/d"; mai DR, traffico o risultati stimati.
- Se GSC, DataFast, DataForSEO o Airtable non rispondono, scrivi "<fonte> non ha risposto: <motivo>" e vai avanti
  con le altre. Non stimare al posto loro.
- Link da meno di 60 giorni: "attesa", nessun giudizio. Recuperati e nuovi, domini e link: sempre separati.
- Il repo è pubblico: la revisione esiste solo nella tua risposta (finisce nella mail del runner) e i dati dei
  prospect restano su Airtable.

## Cosa NON fai

Non scrivi file, non committi, non modifichi record Airtable, non usi Gmail, non mandi mail: la mail la manda il
runner `processo/cron/link/` (RIC-126) con il testo della tua risposta. Se un record va corretto (rel sbagliato,
link perso), lo metti tra le azioni per Riccardo.

## Il report

La tua risposta è il corpo della mail: testo semplice, niente tabelle Markdown, niente code fence, righe corte.
In quest'ordine:

    Revisione backlink del AAAA-MM-GG
    Fonti: una riga per GSC (con l'ultimo giorno con dati), DataFast, DataForSEO, Airtable
    1. Link della settimana (dal … al …)
    2. Pagine linkate: GSC e DataFast, 28 giorni contro 28 (con le date)
    3. Conti separati
    4. In attesa
    5. Pipeline Outreach
    6. Cinque azioni, per valore di business

Se non c'è ancora nessun link, dillo all'inizio in una riga ("punto zero: nessun link ottenuto, tutto in attesa")
e tieni corte le sezioni vuote.

Chiudi con questo blocco, una coppia per riga, niente altro dopo. Il runner lo legge con grep: valori su una riga
sola, nessuna riga vuota in mezzo.

    REPORT_DATA=2026-11-02
    REPORT_STATO=punto-zero
    REPORT_GSC=ok
    REPORT_GSC_DATI_FINO_AL=2026-10-30
    REPORT_DATAFAST=ok
    REPORT_DATAFORSEO=ok
    REPORT_AIRTABLE=ok
    REPORT_LINK_NUOVI=0
    REPORT_LINK_RECUPERATI=0
    REPORT_LINK_SPONTANEI=0
    REPORT_DOMINI_REFERENTI=2
    REPORT_BACKLINK=2
    REPORT_IN_ATTESA=0
    REPORT_SOLLECITI_DOVUTI=0
    REPORT_AZIONE_1=la prima delle cinque azioni, in una riga
    REPORT_NOTE=tutto ciò che non è riuscito o che hai assunto, in una riga sola

- `REPORT_STATO`: `punto-zero` se nessun record è `Link ottenuto`; `attesa` se ci sono link ma tutti da meno di
  60 giorni; `giudicabile` se almeno una pagina ha un link da 60 giorni o più.
- `REPORT_GSC`, `REPORT_DATAFAST`, `REPORT_DATAFORSEO`, `REPORT_AIRTABLE`: `ok` oppure `non ha risposto: <motivo>`.
- `REPORT_LINK_NUOVI`, `REPORT_LINK_RECUPERATI`, `REPORT_LINK_SPONTANEI`: link della settimana.
  `REPORT_DOMINI_REFERENTI`, `REPORT_BACKLINK`: totali DataForSEO di oggi. `REPORT_IN_ATTESA`: pagine in attesa.
- Se un valore non lo hai, scrivi `n/d` e spiega in `REPORT_NOTE`: mai inventarlo.

## Dipendenze per chi lancia la skill

`claude -p "/link-review RUNNER FACTS …"` dalla radice del repo. Allowlist minima, per nome:
`mcp__plugin_airtable_airtable__list_records_for_table,mcp__claude_ai_Airtable__list_records_for_table,mcp__dataforseo__backlinks_summary,mcp__dataforseo__backlinks_backlinks,Bash(node processo/link/misure.mjs:*)`.
Niente Gmail, Write, Edit. Test dell'attrezzo: `node --test processo/link/misure.test.mjs` (gira anche in `npm test`).
