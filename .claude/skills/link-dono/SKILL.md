---
name: link-dono
description: per i prospect Qualificato di Outreach confronta la loro pagina CCNL con le fonti primarie, prepara foglio di correzioni, netto per livello e bozza Gmail; dopo 7 giorni senza risposta il sollecito
disable-model-invocation: true
---

Per ogni prospect da lavorare leggi la sua pagina, controlla ogni cifra sui minimi CCNL contro le fonti primarie,
e solo se restano almeno due correzioni solide prepara il foglio di correzioni, il netto per livello e una bozza
Gmail. Prima ancora, gestisci i solleciti delle mail già inviate. Al massimo 5 bozze per run, solleciti compresi:
prima i solleciti, poi i prospect nuovi fino al tetto.

## Contesto

È il `gift` di Distribb adattato: una mail che consegna un lavoro già fatto sulla pagina di chi la riceve, senza
chiedere un link. Spec: `crescita/sistema-backlink-2026-10-13.md`, sezione "link-dono". I minimi CCNL scadono in
date note: alla decorrenza di una tranche le pagine non aggiornate diventano superate tutte insieme.

Il rischio è uno solo: una correzione sbagliata. Chi riceve il foglio lo controlla per prima cosa, e un numero
falso brucia il prospect per sempre. Per questo il **cancello** decide, non tu: una correzione entra nella mail solo
con la fonte primaria di una parte firmataria; il non verificabile esce; con meno di due correzioni solide la
pagina si salta. Saltare è un esito valido.

CRM: Airtable, base `appAsCWc7NBzY5nam`, tabella Outreach `tbl3ELP9SWiFPTO2A`. Gli strumenti possono arrivare come
`mcp__plugin_airtable_airtable__*` o `mcp__claude_ai_Airtable__*`: usa quelli che hai. Campi che usi:

| Campo | ID |
|---|---|
| Dominio | `flddr04MQcT7yAPJu` |
| URL pagina | `fldqMOgooN21RLGSA` |
| Play | `fldqO2iM581Cf3S7K` |
| Nostra pagina di destinazione | `fldJtrP3VCTQuwTzg` |
| CCNL | `fldHYRtUN1SaFVYHh` (slug del sito: `commercio`, `metalmeccanico`, …) |
| Contatto | `fldBKV9mPAqx1z327` |
| Dove trovato il contatto | `fld0eRBnzwBcJepIl` |
| Verifica | `fldDXQXkUtXlpNvaL` |
| Stato | `fldkWYpJEJTuiP7OY` (filtri con l'id: Qualificato `selXIPfVad7PMJ3NA`, Bozza pronta `sel0AVRbTjMU0mozf`, Inviata `selYGRWG9O4LKRQV2`, Follow-up `seluyeO5YFrcztkTq`; in scrittura il nome) |
| Data invio | `fldbcnBYKCDhtdAbP` (scrivi `AAAA-MM-GG`) |
| Recuperato o nuovo | `fld1JGV1rSImhscDD` (in scrittura il nome: `Nuovo`) |
| Note | `fldhJwhlPaqkJm7Xg` |

Gmail (connettore claude.ai, bozze nell'account di Riccardo): `create_draft`, `list_drafts`, `get_draft`,
`search_threads`, `get_thread`, `get_message`. Le bozze le invia Riccardo.

## Gli argomenti

Dai RUNNER FACTS o dal testo dopo `/link-dono`:

- `oggi`: la data del run. Se manca, la data di oggi.
- `invio`: il primo giorno in cui Riccardo invierà le bozze. Se manca, `oggi`. Le correzioni si giudicano a quella
  data: con `oggi=2026-10-15 invio=2026-11-03` una tabella vera fino al 31/10 è superata.
- `record`: id `rec…` separati da virgola. Se ci sono, lavori quei record (qualunque Stato tranne Bozza pronta,
  Inviata, Follow-up, Link ottenuto, Menzione, Rifiutato, Chiuso) invece dei `Qualificato`. Serve alle sessioni a mano.
- `ccnl`: uno o più slug separati da virgola. Se c'è, solo prospect con quei CCNL. La settimana dopo una tranche
  lo passa da solo il runner, con le tranche partite; il tetto delle bozze resta quello.
- `nota`: testo da aggiungere alle Note di ogni record su cui scrivi.

## Lo strumento: `dono-ccnl.js`

    node processo/link/dono-ccnl.js valori <ccnl> [--sezione <id>]
    node processo/link/dono-ccnl.js classifica <file.json>
    node processo/link/dono-ccnl.js netto <ccnl> <prima> <dopo> [--sezione <id>] [--livelli 3,4,5]
    node processo/link/dono-ccnl.js tranche <dopo il> <fino al> [--ccnl <slug>]

- `valori`: le tabelle della fonte per decorrenza (totale, voci, scatto per livello, con i codici di livello del
  dataset), la fonte con `firmataria` sì/no, l'accordo e `firmatarie`, le sole fonti (URL e copia in
  `processo/dati/fonti/`) su cui regge una correzione controllata a mano. Per il commercio ci sono anche le tabelle precedenti, fino a
  quella in vigore al 31/3/2023, ricostruite dall'art. 213 (`ricostruita`): servono a riconoscere una cifra vecchia,
  mai a proporla.
- `classifica`: classifica le affermazioni e applica il cancello. Restituisce per ogni affermazione `stato`
  (`ancora vero`, `superato`, `cambiato`, `non verificabile`) col dettaglio, poi `decisione` (`scrivi` o `salta`),
  `foglio` (id delle correzioni solide), `fuori` (id che restano fuori dalla mail), `nonPrimaDel` e `verifica`
  (il testo per il campo Verifica, una riga per affermazione con l'URL della fonte).
- `netto`: il netto per livello prima e dopo una tranche con il motore delle pagine (Milano, tempo pieno, zero
  scatti, media sulle mensilità del contratto), in testo semplice da incollare nella mail, con la pagina nostra di
  ogni livello e l'avviso dove l'aumento passa un salto.
- `tranche`: le tranche del dataset con decorrenza dopo la prima data e fino alla seconda compresa (date
  `AAAA-MM-GG` o `GG/MM/AAAA`), con lo slug del sito. `[]` se nessuna.

Le cifre escono da qui: non rifare i conti a mano e non ritoccare quelle che lo script stampa.

## 1. Solleciti

Prima dei prospect nuovi. Soglia: `node .claude/skills/link-review/misure.mjs date <oggi>` →
`followup_dovuto_se_invio_entro` (sette giorni fa). Sono tuoi solo i record con una riga
`link-dono … thread <threadId>` nelle Note: le bozze degli altri playbook (link-recupero) restano dei loro.

- **Bozza pronta** con il thread di link-dono: `get_thread`. Se Riccardo l'ha inviata (un messaggio con etichetta `SENT`)
  e Airtable non lo sa, metti Stato `Inviata` e Data invio = data di quel messaggio.
- **Inviata** con Data invio fino alla soglia: `get_thread`. Se c'è un messaggio di qualcun altro, è una risposta:
  non toccare il record e mettila nel report. Altrimenti crea **una** bozza di sollecito nello stesso thread:
  `create_draft` con `replyToMessageId` = id dell'ultimo messaggio inviato, stesso `to`, oggetto `Re: <oggetto>`, tre
  righe (ripropone il foglio in una frase, nessuna pressione, nessuna richiesta di link). Stato `Follow-up`, Note +
  `link-dono GG/MM/AAAA: sollecito, bozza <id>`.
- **Follow-up**: se il sollecito è stato inviato, è più vecchio della soglia e non c'è risposta, Stato `Chiuso`.
  Se il sollecito non è ancora partito, niente.

Ogni sollecito è una bozza e conta nel tetto delle 5. Se i solleciti dovuti sono più di 5, fai i primi 5 (Data invio
più vecchia prima) e scrivi gli altri nel report: restano `Inviata` e li riprende il run dopo.

Fatto quando: ogni record Bozza pronta, Inviata e Follow-up con il thread di link-dono è stato guardato.

## 2. Quali prospect

`record` se c'è, altrimenti `list_records_for_table` con Stato = Qualificato (e CCNL = `ccnl` se c'è), tolti quelli
**in pausa**: l'ultima riga di link-dono nelle Note è `link-dono GG/MM/AAAA: in pausa fino alla prossima tranche, …`
e `node processo/link/dono-ccnl.js tranche <GG/MM/AAAA della pausa> <oggi> --ccnl <CCNL>` dà `[]`, cioè nessuna
tranche del loro CCNL è partita dopo la pausa. Se la lista non è vuota la pausa è finita e il record si lavora come
gli altri. I record passati con `record` si lavorano anche in pausa: li ha scelti Riccardo.

Ne lavori fino a riempire il tetto: 5 bozze meno i solleciti creati al passo 1. Con il tetto pieno, nessun prospect
nuovo. Per ognuno, prima di leggere la pagina:

- **Doppioni.** Se le Note hanno già una bozza di link-dono, o `list_drafts` con `to:<contatto>` ne trova una,
  passa oltre senza scrivere niente: non è un salto, la bozza c'è già.
- **Contatto.** Serve un indirizzo pubblicato sul loro sito. Se Contatto è `n/d`, cercalo (contatti, footer, chi
  siamo, redazione); se lo trovi, scrivilo identico con l'URL in Dove trovato il contatto. Tra più indirizzi preferisci
  quello per redazione, contenuti o collaborazioni a quello generico. Se non lo trovi, salta.
- **CCNL.** Deve essere uno dei contratti del sito (`valori` risponde). Se il loro contratto è un altro (un CCNL di
  altre sigle con lo stesso nome), salta.
- **Fonte.** Se la loro pagina è la fonte stessa del dataset (`valori` → `fonte.url`), non c'è niente da correggere:
  salta.
- **Concorrente.** Se il loro sito offre un proprio calcolo del netto o della busta paga (un calcolatore linkato dalla
  pagina o dal menu), il netto per livello e il link non gli servono e le correzioni migliorano un concorrente: salta
  e proponi il dominio nel report per `.claude/skills/link-fonti/esclusi.json`.

Ogni salto va nelle Note del record e nel report, ed è di due tipi:

- **permanente** (concorrente, la pagina è la fonte del dataset, nessun contatto pubblicato, un CCNL che non è del
  sito): la pagina non diventerà lavorabile. Stato `Chiuso`, Note + `link-dono GG/MM/AAAA: chiuso, <motivo>`.
- **temporaneo** (pagina non leggibile al passo 3, meno di due correzioni solide al passo 4): alla prossima tranche
  del loro CCNL la pagina può cambiare, o diventare superata. Stato invariato, Note + `link-dono GG/MM/AAAA: in pausa
  fino alla prossima tranche, <motivo>`: è la marca che questo passo legge nei run dopo.

## 3. Leggi la pagina ed estrai le affermazioni

`node processo/link/verifica-pagina.js <URL pagina>` dice se la pagina risponde e se ci linka già (`link`). Il testo
leggilo con WebFetch; se è bloccata (403, Cloudflare) prova lo scrape Firecrawl se lo hai, altrimenti è un salto
temporaneo (passo 2) con motivo "pagina non leggibile". Un PDF si legge col tool Read dopo WebFetch, a blocchi di pagine.

Estrai **ogni** dato controllabile sul contratto: minimi per livello (ogni cifra di ogni riga: paga base, totale),
aumenti con la loro decorrenza, decorrenze, una tantum, scatti, mensilità, date della tredicesima, scadenza del
contratto. Fatto quando ogni cifra della pagina su quel CCNL è nel file, copiata identica in `frase`.

Scrivi `.link-dono/<dominio>-<oggi>.json` nella root del repo (cartella ignorata da git: il repo è pubblico):

    {"ccnl": "commercio", "sezione": null, "oggi": "2026-10-15", "invio": "2026-11-03",
     "affermazioni": [
      {"id": "A1", "frase": "IV | 1.257,46 € | 1.781,68 €", "livello": "4", "importo": 1781.68,
       "decorrenza": "2025-11-01", "vigente": true},
      {"id": "A2", "frase": "+35 € dal 1° novembre 2026", "livello": "4", "voce": "aumento", "importo": 35,
       "decorrenza": "2026-11-01"},
      {"id": "A3", "frase": "una tantum di 350 € in due rate", "stato": "ancora vero",
       "fonte": {"url": "https://…", "parte": "testo dell’accordo sottoscritto dalle parti firmatarie"},
       "nota": "art. 213: 175 € a luglio 2024 e 175 € a luglio 2025"}]}

- `livello`: il codice di `valori` (Quadri → `Q`, IV → `4`, operatore di vendita 1ª categoria → `OV1`).
- `importo`: la cifra stampata, in euro. Una cifra per affermazione. Se la pagina la arrotonda ("circa 1.618
  euro"), aggiungi `"approssimato": true`: si confronta all'euro invece che al centesimo.
- `voce`: ometti per i minimi (lo script trova se è il totale, una voce, o un totale a cui manca una voce);
  `aumento` per gli aumenti.
- `decorrenza`: la data a cui la pagina lega la cifra, se la dice.
- `vigente`: `true` se la pagina presenta la cifra come quella in vigore ("tabelle aggiornate", "minimi 2026",
  nessuna data); `false` se è un fatto datato che non pretende di valere oggi (una notizia del 21/11/2025 sulle
  "tabelle di novembre 2025"). Un fatto datato giusto resta vero: la storia non scade.
- Ciò che il dataset non contiene (una tantum, tredicesima, scadenza, mensilità) controllalo tu sulla fonte primaria
  (`valori` → `firmatarie`: l'URL o la copia in `processo/dati/fonti/`) e passalo con `stato`, `fonte` (`url` e
  `parte`, cioè chi la pubblica) e `nota`. Lo script guarda l'URL, non la `parte`: una fonte che non è in
  `firmatarie` lascia la correzione fuori dalla mail, comunque la descrivi. Se non lo trovi su una di quelle fonti,
  `stato: "non verificabile"`. Banche dati, portali e la stampa non sono fonti primarie: per Poligrafici
  e Vetro il dataset stesso viene da una banca dati non firmataria, quindi lì nessuna correzione regge.

## 4. Il cancello

`node processo/link/dono-ccnl.js classifica .link-dono/<dominio>-<oggi>.json`.

- `decisione: salta`: scrivi `verifica` nel campo Verifica, nessuna bozza; è un salto temporaneo (passo 2): Stato
  invariato, Note + `link-dono GG/MM/AAAA: in pausa fino alla prossima tranche, <n> correzioni solide`.
- `decisione: scrivi`: rileggi sulla pagina ogni correzione del `foglio`. Lo script sa i numeri, non il contesto: se la
  cifra non è presentata come hai scritto in `vigente`/`decorrenza`, o se la pagina dichiara la differenza (p.es.
  "tabelle con il terzo elemento provinciale di Vicenza"), correggi il file e rilancia. Il cancello ha l'ultima parola.

Con `nonPrimaDel` la mail diventa giusta solo a quella data (una tabella vera fino al giorno prima della tranche, o
una cifra proposta che entra in vigore con la tranche): scrivila vera in entrambi i casi ("dal 1° novembre la tabella
cambia così"), e Riccardo non la invia prima. La `verifica` lo scrive già in testa.

## 5. La destinazione e il test del lettore

La pagina nostra è quella del livello se la loro parla di un livello, altrimenti la tabella del contratto (`netto`
mette quella giusta: la pagina del livello se gli chiedi un livello solo, altrimenti la tabella); mai la home. Test del lettore, in una frase: cosa ottiene chi legge quel paragrafo
cliccando? Il netto prima e dopo l'aumento accanto al loro lordo è la risposta tipica. Se la risposta è debole,
niente link nella mail (il netto resta come testo) e lo scrivi nelle Note. Aggiorna Nostra pagina di destinazione se
cambia.

## 6. Il foglio e la mail

Il **foglio di correzioni**, una voce per correzione del `foglio` (le righe di una stessa tabella si raggruppano):

- frase vecchia, identica a come è sulla pagina;
- cosa è cambiato, in una riga (dallo `stato` e dal dettaglio di `classifica`);
- fonte: l'URL della fonte primaria;
- frase sostitutiva nel loro stile, pronta da incollare: stesso formato, stesse colonne, stessi separatori, stesso
  modo di scrivere i livelli. Se la loro è una tabella, la riga nuova della tabella.

Il **netto per livello**: `netto <ccnl> <giorno prima della tranche> <decorrenza della tranche> --livelli <i loro>`,
incollato com'è.

La **mail**: testo semplice, italiano, firmata Riccardo Sartori. Breve e concreta, numeri esatti:

1. chi è, in una riga: ha costruito Dove va la tua RAL, che pubblica i minimi CCNL e ne calcola il netto;
2. cosa ha notato sulla loro pagina (quale, quante cifre, da quando) e il foglio;
3. il netto per livello come complemento al loro lordo, con il link alla pagina specifica;
4. una riga finale che lascia a loro la scelta.

Mai chiedere un link, nemmeno di riflesso. Oggetto concreto, p.es. "CCNL Commercio: le cifre del 4° livello dal
1° novembre". Nessuna affermazione su di loro che non stia nella `verifica`.

## 7. Bozza e Airtable

Ricontrolla i doppioni (`list_drafts` con `to:<contatto>`), poi `create_draft` con `to` = Contatto, `subject`,
`body`. Poi `update_records_for_table` sul record:

- Verifica: la `verifica` di `classifica`, identica;
- Stato: `Bozza pronta`;
- Recuperato o nuovo: `Nuovo`, se è vuoto (un record di link-recupero resta `Recuperato`);
- Note: le Note esistenti + `link-dono GG/MM/AAAA: bozza Gmail <id>, thread <threadId>.` + `Non inviare prima del
  GG/MM/AAAA, e ricontrolla la pagina prima di inviare.` se c'è `nonPrimaDel` + la `nota` degli argomenti;
- Contatto, Dove trovato il contatto, Nostra pagina di destinazione, se li hai trovati o cambiati.

Se il tool Gmail non c'è in questo run, nessuna bozza: Verifica scritta, Stato invariato, Note
`link-dono GG/MM/AAAA: bozza non creata, Gmail non disponibile`, e il report lo dice.

## Regole fisse

- Le bozze le invia Riccardo: Gmail solo con gli strumenti di lettura e `create_draft`, i solleciti con
  `replyToMessageId`. Una bozza creata è di Riccardo: non la modifichi e non la cancelli.
- Nessuna correzione o cifra senza fonte primaria. Ciò che non hai è `n/d`.
- Contatti solo se pubblicati, con l'URL dove li hai letti.
- Un link, una destinazione specifica. Anchor: il brand ("Dove va la tua RAL"), l'URL o parole neutre.
- Il repo è pubblico: prospect, pagine, affermazioni e contatti stanno su Airtable, nelle bozze e in `.link-dono/`.
  Non committi e non pushi.
- Su Airtable aggiorni solo i record che lavori, e solo i campi qui sopra.

## Il report

Prima del blocco, in poche righe: per ogni prospect l'esito (bozza, saltato e perché, risposta arrivata), cosa hai
verificato davvero e cosa resta a Riccardo (rileggere foglio, Verifica e bozza; date da rispettare). Finisce nella
mail del runner.

Poi chiudi con questo blocco, una coppia per riga, niente altro dopo, nessuna riga vuota in mezzo, valori su una riga
sola:

    REPORT_DATA=2026-10-15
    REPORT_INVIO=2026-11-03
    REPORT_PROSPECT=4
    REPORT_BOZZE=2
    REPORT_RECORD=recXXXXXXXXXXXXXX, recYYYYYYYYYYYYYY
    REPORT_SALTATI=dominio.it (in pausa: 1 correzione solida); altro.it (chiuso: contatto n/d)
    REPORT_SOLLECITI=0
    REPORT_CHIUSI=0
    REPORT_RISPOSTE=nessuna
    REPORT_NON_PRIMA_DEL=2026-11-01
    REPORT_NOTE=tutto ciò che non è riuscito o che hai assunto, in una riga sola

`REPORT_BOZZE` sono le bozze ai prospect nuovi, `REPORT_SOLLECITI` le bozze di sollecito: insieme non passano 5.
`REPORT_RECORD` sono i record con una bozza nuova; `REPORT_RISPOSTE` i domini con una risposta da leggere;
`REPORT_SALTATI` dice per ogni salto se è in pausa o chiuso, e perché; `REPORT_CHIUSI` conta i record messi
`Chiuso` in questo run, dai solleciti e dai salti permanenti. `REPORT_NON_PRIMA_DEL` la data più lontana tra i
`nonPrimaDel`, o `nessuna`. Se un valore non lo hai, scrivilo in `REPORT_NOTE`: mai inventarlo.

## Per chi lancia la skill

`claude -p "/link-dono RUNNER FACTS …"` dalla radice del repo, con la login che carica Gmail (vedi RIC-120).
Allowlist per nome: i sei strumenti Gmail sopra (mai `send_message`, `reply`, `forward`, `update_draft`,
`delete_draft`), `list_records_for_table` e `update_records_for_table` dei due server Airtable, WebFetch,
`Bash(node processo/link/dono-ccnl.js:*)`, `Bash(node processo/link/verifica-pagina.js:*)`,
`Bash(node .claude/skills/link-review/misure.mjs:*)`, Read, Write (solo per `.link-dono/`).
Test dello strumento: `node --test processo/link/dono-ccnl.test.js` (gira anche in `npm test`).
