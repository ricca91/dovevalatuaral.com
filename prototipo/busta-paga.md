# Ti spiego la busta paga — il percorso locale

RIC-68, la prima delle due PR di RIC-64. **Interamente locale: nessuna chiamata a
un modello, nessun endpoint nuovo, nessun link dalla navigazione del sito.**
Si carica un cedolino in PDF, si legge nel browser, si oscura quello che
identifica la persona e si mostra — carattere per carattere — il testo che un
giorno partirà. In questa versione non parte: il pulsante di invio nasce
disattivato e non c'è niente da chiamare.

## I file

| File | Che cos'è |
|---|---|
| `busta-paga.html` | la pagina: promessa, limiti, informativa breve, upload, revisione, conferma |
| `busta-paga.css` | lo stile della sola pagina, sopra i token di `draftsman.css` |
| `busta-paga-estrazione.js` | da frammenti con coordinate a righe; limiti e codici di errore |
| `busta-paga-redazione.js` | da righe a righe oscurate, più l'elenco di che cosa è stato oscurato e perché |
| `busta-paga-pdf.js` | l'unico file che tocca pdf.js: da `File` a righe, o a un codice di errore |
| `busta-paga-ui.js` | il controller: campo file, riquadro, commutazione parola per parola, consenso |
| `privacy.html` | l'informativa di tutto il sito, non solo di questo percorso |
| `analytics-datafast.js` | solo Datafast: su questa pagina GA4 non viene caricato |
| `vendor/pdfjs/` | pdf.js 6.3.289, copia locale ([perché](vendor/pdfjs/README.md)) |

Le prove stanno in `busta-paga-estrazione.test.js`, `busta-paga-redazione.test.js`
e `busta-paga-pagina.test.js`, e girano con le altre: `node --test prototipo/*.test.js`.

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

## Errori

Codici distinti, copy che dice che cosa fare, e **nessun contenuto del documento
nei messaggi** — nemmeno il nome del file, che spesso contiene il cognome:
`FILE_NON_PDF`, `FILE_TROPPO_GRANDE`, `FILE_VUOTO`, `TROPPE_PAGINE`,
`PDF_SENZA_TESTO`, `ESTRAZIONE_VUOTA`, `PDF_PROTETTO`, `PDF_ILLEGGIBILE`.

## Privacy, in concreto

- Il PDF resta un buffer in memoria: `compito.destroy()` lo chiude a fine
  lettura, e il campo file viene svuotato subito dopo, così nemmeno il
  riferimento al documento sopravvive.
- Niente `localStorage`, `sessionStorage`, `indexedDB`, cookie. Una prova
  meccanica cerca queste parole, e `fetch`, `XMLHttpRequest`, `sendBeacon`,
  `WebSocket`, in tutti i file del percorso.
- La libreria di lettura è locale: aprire un cedolino non fa partire nessuna
  richiesta verso terzi. L'unica richiesta esterna della pagina è Datafast, che
  parte al caricamento e non trasporta niente del documento.
- GA4 non viene caricato. Una prova lo verifica sul sorgente della pagina.

## Che cosa non è provato

- **Nessun cedolino vero è mai stato letto da questi test.** Le prove coprono la
  ricomposizione delle righe su coordinate sintetiche e ogni schema di
  oscuramento su stringhe costruite apposta, inclusi falsi positivi plausibili.
  Quanto bene il riconoscimento regga sui layout reali dei software paghe
  italiani non lo sappiamo, ed è la conseguenza diretta della decisione 3 di
  RIC-64.
- La verifica in browser è stata fatta a mano, su un cedolino finto generato per
  l'occasione: lettura, commutazione, tastiera, mobile, albero di accessibilità,
  errori. Non è automatizzata in CI.
- Invio, endpoint, guardie sulla risposta del modello, riconciliazione e eventi
  di misurazione stanno nella seconda PR.
