# RIC-72 — verifiche

21 settembre 2026. Solo dati sintetici. Nessuna carta o transazione reale.

## Automatiche

`npm test` esegue tutta la suite precedente e i nuovi file:

- `server/busta-paga-acquisto.test.js`: paywall, idempotenza analisi/checkout,
  sessione interrotta, accesso incrociato, soglia di report utilizzabile,
  annullamento/scadenza checkout, ritorno prima del webhook, duplicati/eventi
  fuori ordine, importo/valuta/ambiente/riferimento errati, cancellazione,
  retention, limite condiviso, endpoint legacy, firma sui bytes originali,
  errore DB senza ACK e gate live.
- `server/busta-paga-archivio.test.js`: SQL su PostgreSQL incorporato PGlite,
  rollback, chiusura/riapertura dell'archivio, recupero del report pagato senza
  nuova AI/checkout, pulizia contenuti e successivamente riferimenti operativi.
  PGlite ha una sola connessione: la contesa fra istanze viene simulata nei
  test del servizio e resta da provare sul PostgreSQL ospitato.
- `prototipo/busta-paga-rete.test.js`: segreto rimosso dall'URL prima di analytics,
  storage limitato al token, payload testo+consenso, header Authorization,
  retry che conserva la chiave e assenza di retry automatico della chiamata AI.

I test esistenti su lettura, oscuramento e guardie restano attivi. I vecchi
vincoli «una sola fetch»/«nessuno storage» sono sostituiti dalle proprietà
attuali: PDF non inviato, testo approvato, storage del solo segreto, report
cifrato, autorizzazione e nessun contenuto nei log. Nessun test disabilitato.

## Browser locale — simulazione dichiarata

Server isolato `node processo/verifiche/ric-72/server-fixture.cjs`:
solo loopback, nessun handler di prova importato dalle funzioni distribuite.
Analisi e Stripe sono simulati con `supporto.cjs`; la lettura del PDF usa il
pdf.js reale, non sostituito. Un banner dichiara la simulazione.

Verificato con agent-browser:

- PDF sintetico digitale, 11 righe → estrazione → consenso → invio da tastiera.
- Anteprima: periodo, totali e una spiegazione; DOM report vuoto prima di pagare.
- Refresh conserva l'anteprima e la chiave; nessun testo in sessionStorage.
- Creazione checkout simulata; pagamento simulato separato → report con 4 diciture.
- Report presente dopo refresh e recupero tramite frammento; frammento rimosso.
- Cancellazione svuota report e accesso; successivo upload nuovamente disponibile.
- Desktop 1280×900 e mobile 390×844: niente overflow orizzontale, nessun errore JS.
- Accessibilità: controllo etichette, heading, stati live e tastiera; nessuna prova
  con screen reader umano.

[Anteprima desktop simulata](anteprima-desktop-simulata.png) ·
[Report mobile simulato](report-mobile-simulato.png).
Gli importi e le spiegazioni nelle immagini sono sintetici. Le immagini non
costituiscono una valutazione del motore né una prova con Stripe test.

## Limiti

Mancano le credenziali/configurazioni Stripe e PostgreSQL: l'utente ha chiesto
codice e istruzioni, senza provisioning. Perciò non sono verificati Checkout
Stripe test reale, webhook sul deploy configurato, carta rifiutata dal provider,
concorrenza multi-istanza del DB ospitato e pulizia programmata su quel provider.
Il motore reale è una dipendenza aperta di RIC-71. Nessun incasso live verificato.
I gate e la procedura di prova sono in [operazioni](../../ric-72-operazioni.md).
