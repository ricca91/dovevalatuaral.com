# Ti spiego la busta paga

RIC-64, consegnato in due PR: **RIC-68** il percorso locale, **RIC-69**
l'analisi. Si carica un cedolino in PDF, si legge nel browser, si oscura quello
che identifica la persona, si mostra — carattere per carattere — il testo che
parte, e si riceve una spiegazione voce per voce.

Il confine fra le due metà è netto e vale la pena tenerlo a mente leggendo il
codice: **il PDF non lascia mai il browser**, e l'unica cosa che esce è la
stringa che la persona ha appena letto nel riquadro nero. Nessun link dalla
navigazione del sito: la pagina è ancora in prova.

## I file

| File | Che cos'è |
|---|---|
| `busta-paga.html` | la pagina: promessa, limiti, informativa breve, upload, revisione, conferma |
| `busta-paga.css` | lo stile della sola pagina, sopra i token di `draftsman.css` |
| `busta-paga-estrazione.js` | da frammenti con coordinate a righe; limiti e codici di errore |
| `busta-paga-redazione.js` | da righe a righe oscurate, più l'elenco di che cosa è stato oscurato e perché |
| `busta-paga-pdf.js` | l'unico file che tocca pdf.js: da `File` a righe, o a un codice di errore |
| `busta-paga-ui.js` | il controller: campo file, riquadro, commutazione parola per parola, consenso, invio |
| `busta-paga-invio.js` | **l'unico file che tocca la rete**: da stringa a `POST /api/busta-paga` |
| `busta-paga-risultato.js` | da analisi a DOM, solo `textContent`: le quattro sezioni del risultato |
| `busta-paga-misura.js` | gli eventi Datafast, con nomi e proprietà a elenco chiuso |
| `api/busta-paga.js` | il guscio Vercel, due righe |
| `server/busta-paga.js` | l'endpoint: tetti, chiamata al gateway, nessun log del contenuto |
| `server/busta-paga-contratto.js` | schema, guardie, riconciliazione, cose da verificare |
| `server/busta-paga-prompt.js` | il messaggio di sistema e il recinto attorno al documento |
| `server/busta-paga-tetti.js` | caratteri, frequenza per chiamante, budget giornaliero |
| `privacy.html` | l'informativa di tutto il sito, non solo di questo percorso |
| `analytics-datafast.js` | solo Datafast: su questa pagina GA4 non viene caricato |
| `vendor/pdfjs/` | pdf.js 6.3.289, copia locale ([perché](vendor/pdfjs/README.md)) |

Le prove stanno in `busta-paga-estrazione.test.js`, `busta-paga-redazione.test.js`,
`busta-paga-pagina.test.js` e `server/busta-paga.test.js`, e girano con le altre:
`npm test`.

## La riga non è la concatenazione dei frammenti

pdf.js non restituisce righe: restituisce frammenti di testo con la loro
posizione. Su una tabella densa come un cedolino, concatenarli nell'ordine in cui
arrivano mescola le colonne e appiccica l'importo alla dicitura sbagliata.

`componiRighe()` raggruppa per **linea di base** e ordina per **ascissa**. Due
costanti governano tutto, entrambe espresse in frazione dell'altezza del
carattere, perché un cedolino in corpo 7 e uno in corpo 11 non possono avere la
stessa soglia in punti:

- `TOLLERANZA_RIGA = 0.45` — quanto può scostarsi una linea di base dalla riga a
  cui appartiene. Gli importi sono spesso composti qualche decimo di punto più in
  alto o più in basso della dicitura.
- `DISTANZA_SPAZIO = 0.25` — sotto questa distanza due frammenti sono la stessa
  parola spezzata dalla libreria: `IRP` + `EF` deve tornare `IRPEF`, non `IRP EF`.

È una funzione pura sulla struttura dei frammenti, quindi le prove sono array di
coordinate scritti a mano: **nessun PDF entra nei test**, né vero né finto.

## Che cosa si oscura, e perché l'importo resta

Tre principi:

1. **Si sostituisce, non si rimuove.** Il segnaposto è una parola sola —
   `[CODICE_FISCALE]`, `[INDIRIZZO]`, `[MOTIVO_ASSENZA]` — così la riga mantiene
   le sue colonne e l'importo resta accanto alla sua dicitura.
2. **Di sigle sindacali e motivi di assenza si oscura l'etichetta, non
   l'importo.** Sono categorie particolari ex art. 9 GDPR: la quota associativa
   rivela l'appartenenza sindacale, malattia, infortunio e permessi legge 104
   rivelano lo stato di salute. Ma la riconciliazione deve continuare a tornare,
   quindi `TRATTENUTA SINDACALE CGIL 1,00% 18,50` diventa
   `[SIGLA_SINDACALE] 1,00% 18,50`.
3. **Il riconoscimento è deterministico, e sbaglia.** Riconosce schemi noti, non
   capisce il documento. Per questo ogni parola resta commutabile a mano.

Il caso fragile è il **nome**, che non ha una forma fissa. Tre euristiche, in
ordine: dopo un'etichetta (`DIPENDENTE:`, `COGNOME E NOME`); accanto a un codice
fiscale, dove il nome sta quasi sempre; e nelle prime `INTESTAZIONE_RIGHE = 12`
righe, su righe corte senza importi fatte di parole che non appartengono al
vocabolario del cedolino. Sbaglia per eccesso — la ragione sociale del datore
finisce spesso sotto `[NOME]` — e questo è il verso giusto in cui sbagliare,
perché riportare una parola costa un clic.

## Il riquadro è la promessa, non un passaggio

La schermata di conferma non dice «abbiamo oscurato qualcosa»: mostra il testo.
`applica()` produce **una sola volta** sia i segmenti da disegnare sia la stringa
finale, quindi non può esistere uno scarto fra quello che si legge e quello che
partirebbe. Il test lo verifica ricomponendo la stringa dai segmenti mostrati.

Il riquadro è un gruppo a **tabindex mobile**: un cedolino sono qualche centinaio
di parole, e con un bottone per tabulazione uscirne costerebbe trecento Tab. Si
entra una volta, ci si muove con le frecce, si commuta con Invio o barra
spaziatrice, si esce con un altro Tab.

## L'analisi: cosa parte, e che cosa la controlla

Parte una stringa dentro `{"testo": ...}` e basta. Il `File`, il suo buffer e il
suo nome non entrano nemmeno come parola in `busta-paga-invio.js`, che è l'unico
file del percorso a cui la rete è concessa; su tutti gli altri il divieto è
verificato riga per riga da una prova. È quello che rende «il PDF non lascia il
browser» una proprietà leggibile dal codice invece di una promessa.

L'endpoint gira in **regione europea** (`fra1` in `vercel.json`) e instrada la
richiesta via Vercel AI Gateway a **`anthropic/claude-sonnet-5`**, con tre
condizioni imposte a ogni singola richiesta:

```js
providerOptions: { gateway: {
  zeroDataRetention: true,
  disallowPromptTraining: true,
  inferenceRegion: { scope: 'zone', geoRegion: 'eu' },
}}
```

Se il gateway non trova un fornitore che le rispetti tutte e tre, la richiesta
**fallisce**. È voluto: meglio non spiegare un cedolino che spiegarlo altrove.
Per lo stesso motivo il modello non è sovrascrivibile da variabile d'ambiente —
è nominato nell'informativa come responsabile del trattamento, quindi cambia con
un deploy, non con una configurazione — e l'indirizzo del gateway è spostabile
solo fuori produzione, dove serve a metterci davanti un finto gateway per le
prove in browser.

## Le guardie, al posto della valutazione

Non esiste una valutazione end-to-end, per la decisione 3 di RIC-64: avrebbe
richiesto cedolini di altre persone. Al suo posto ci sono quattro controlli
meccanici in `server/busta-paga-contratto.js`, e la differenza fra i primi due
è il cuore del file.

1. **Ogni voce deve citarsi**, e la voce che non ci riesce viene **scartata** —
   non mostrata con confidenza bassa. `sourceLabel` e `sourceAmount` devono
   comparire alla lettera in **una sola riga** del testo inviato, la stessa per
   entrambi. La riga in più è più stretta di quanto chieda il ticket, ed è
   voluta: su un cedolino la dicitura e il suo importo stanno insieme, e pescare
   un importo dalla riga accanto è precisamente l'errore da impedire.
2. **Categoria, effetto e confidenza sono enumerazioni chiuse**, e un valore
   fuori elenco non fa cadere la voce: fa cadere **tutta la risposta**. La
   distinzione è il confine fra «questo pezzo non è affidabile» e «questa
   risposta non è quella che ho chiesto».
3. **L'aritmetica è nostra.** `riconcilia()` somma le competenze, somma
   trattenute-contributi-imposte e confronta con il netto letto. Il modello non
   somma mai. Se un totale non si cita diventa «non individuato» e il conto
   diventa non calcolabile: non si stima.
4. **Il risultato si scrive come testo.** In `busta-paga-risultato.js` la parola
   `innerHTML` non compare. Un cedolino che contiene uno script lo mostra come
   caratteri — verificato in un browser vero, con un PDF che ne contiene uno.

Le lunghezze fanno eccezione: spiegazione, riferimento e avvisi vengono
**tagliati**, non rifiutati. Sono prosa del modello, non fatti; si è severi solo
con ciò che pretende di essere un dato.

## Il documento è dato, non istruzione

Il testo del cedolino sta **solo** nel messaggio utente, dentro un recinto, e le
sequenze `[[[` che potrebbero chiuderlo dall'interno vengono spezzate. Il
messaggio di sistema non contiene mai una riga del documento, quindi non c'è
modo di far scrivere al documento una regola.

Il prompt dice anche di ignorare le istruzioni trovate nel documento, ma è la
terza linea di difesa, non la prima: se un'istruzione iniettata venisse
obbedita, la voce che produce non si cita e viene scartata comunque. È questo
che rende il percorso difendibile, non la frase nel prompt.

## Tetti e abuso

Un endpoint pubblico che chiama un modello è una bolletta aperta. Tre tetti:
caratteri sul testo (20.000, lo stesso numero da tutte e due le parti — una
prova lo verifica), frequenza per chiamante, budget giornaliero con
interruttore (`BUSTA_PAGA_ATTIVO=0`).

Il conteggio per chiamante non conserva l'IP: conserva `sha256(IP + sale)`
troncata, con il sale che cambia ogni giorno. **I contatori vivono nella memoria
dell'istanza**, e su Vercel le istanze sono più d'una e muoiono: a freddo il
conteggio riparte. Sono un dosso, non un muro. Il muro è il budget configurato
sul gateway (`vercel ai-gateway budgets set`), che vale per il team e non
dipende da questo codice.

## Errori

Codici distinti, copy che dice che cosa fare, e **nessun contenuto del documento
nei messaggi** — nemmeno il nome del file, che spesso contiene il cognome.

Otto codici di lettura, definiti in `busta-paga-estrazione.js`: `FILE_NON_PDF`,
`FILE_TROPPO_GRANDE`, `FILE_VUOTO`, `TROPPE_PAGINE`, `PDF_SENZA_TESTO`,
`ESTRAZIONE_VUOTA`, `PDF_PROTETTO`, `PDF_ILLEGGIBILE`.

Sette codici di analisi, definiti in `server/busta-paga-contratto.js` perché è il
server a emetterli: `TESTO_NON_VALIDO`, `TESTO_TROPPO_LUNGO`, `TROPPE_RICHIESTE`,
`BUDGET_SUPERATO`, `RISPOSTA_NON_CONFORME`, `NESSUNA_VOCE`,
`SERVIZIO_NON_DISPONIBILE`.

La copy di tutti e quindici sta in un posto solo, `MESSAGGI`, e una prova impone
che i due elenchi combacino: un codice nuovo rompe le prove finché qualcuno non
scrive che cosa dice all'utente. Il server manda codici, mai copy.

## Misurazione

Solo Datafast, cookieless, mai GA4. `busta-paga-misura.js` tiene due elenchi
chiusi — i sette eventi e le proprietà ammesse per ciascuno — e butta via tutto
il resto prima che esca. Non è la buona volontà di chi scrive il controller a
impedire che un importo finisca in un evento: è quella funzione.

I sette: `payslip_view`, `payslip_upload_selected`, `payslip_extraction`,
`payslip_redaction_confirmed`, `payslip_analysis`, `payslip_guards`,
`payslip_feedback`. I valori ammessi sono booleani, codici di errore e fasce —
mai un conteggio, mai un importo, mai una dicitura.

## Privacy, in concreto

- Il PDF resta un buffer in memoria: `compito.destroy()` lo chiude a fine
  lettura, e il campo file viene svuotato subito dopo, così nemmeno il
  riferimento al documento sopravvive.
- Niente `localStorage`, `sessionStorage`, `indexedDB`, cookie, in nessun file.
  Una prova meccanica cerca queste parole, e `fetch`, `XMLHttpRequest`,
  `sendBeacon`, `WebSocket`, in tutti i file del percorso **tranne uno**:
  `busta-paga-invio.js`, dove la stessa prova pretende esattamente una `fetch`,
  un corpo `{testo}` e nessuna menzione di `FormData`, `Blob`, `arrayBuffer`,
  `.files` o del nome del file. Il divieto non è stato allargato, è stato
  ritagliato attorno a un file solo.
- La libreria di lettura è locale: aprire un cedolino non fa partire nessuna
  richiesta verso terzi. Le sole richieste esterne sono Datafast, che parte al
  caricamento, e la nostra `POST /api/busta-paga`, che parte solo dopo la spunta
  di consenso.
- Il server non conserva niente e non registra niente: nessun `require('fs')`,
  nessun archivio, nessun `console.log`. L'unica riga di log è un
  `console.error` con il codice di errore, e una prova conta che sia una sola.
- GA4 non viene caricato. Una prova lo verifica sul sorgente della pagina.

## Che cosa non è provato

- **Nessun cedolino vero è mai stato letto da questi test.** Le prove coprono la
  ricomposizione delle righe su coordinate sintetiche e ogni schema di
  oscuramento su stringhe costruite apposta, inclusi falsi positivi plausibili.
  Quanto bene il riconoscimento regga sui layout reali dei software paghe
  italiani non lo sappiamo, ed è la conseguenza diretta della decisione 3 di
  RIC-64.
- **Nessuno ha verificato che il modello legga bene un cedolino vero.** Le
  guardie impediscono di mostrare numeri inventati; non garantiscono che i
  numeri veri siano capiti. È la stessa decisione 3, e sta scritta sulla pagina
  e nell'informativa, non solo qui.
- **Nessuna chiamata reale al gateway è mai stata fatta.** Tutte le prove
  automatiche sostituiscono la chiamata, e la verifica in browser gira contro un
  finto gateway locale. Che la richiesta sia accettata da Vercel AI Gateway con
  quelle tre condizioni si vede solo con una chiave vera, su una preview.
  Attenzione: `zeroDataRetention` per richiesta è documentato come funzione
  Pro/Enterprise — su un piano Hobby la richiesta fallisce, e fallisce chiusa.
- La verifica in browser è stata fatta a mano, su un cedolino finto generato per
  l'occasione: lettura, commutazione, tastiera, mobile, albero di accessibilità,
  risultato, voto, cancellazione, risposta non conforme e conto che non torna.
  Non è automatizzata in CI.
- Gli ingressi dal sito — area «Altri strumenti» in home, CTA dopo il risultato
  del calcolatore — **non sono collegati**. La pagina resta `noindex` e fuori
  dalla navigazione finché il flusso non è stato provato su una preview vera.
