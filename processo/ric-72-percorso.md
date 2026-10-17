# RIC-72 — contratto del percorso

Ingresso per RIC-73: `/busta-paga.html#bp-upload`. RIC-72 possiede il blocco
`#bp-upload`, revisione, attesa, anteprima, checkout e report e i moduli
`busta-paga-{ui,invio,accesso,percorso}.js`. La landing può modificare le sezioni
commerciali precedenti; non deve duplicare l'upload. Gli stili del nuovo
percorso stanno in `busta-paga-percorso.css`.

Fonte unica per prezzo/capacità: `GET /api/busta-paga?azione=configurazione`.
Il prezzo deriva da uno Stripe Price configurato sul server, mai dal browser.
Una configurazione assente non produce un prezzo inventato né abilita l'invio.
Il test è esplicitamente etichettato; l'attivazione live richiede decisioni
commerciali e verifica del motore RIC-71.

Contratto motore iniziale: `server/busta-paga.js::analizza` restituisce
`{ok,analisi,motore}`. Lo invochiamo internamente, mai attraverso un endpoint
pubblico che possa esporre il report completo. Lo schema vendibile v1 richiede
periodo, tre totali numerici citati, almeno due diciture spiegate e un conto
calcolabile. È una soglia di completezza, non una certificazione fiscale;
RIC-71 deve validarne la qualità su fixture rappresentative prima del live.

Conservazione prevista: report cifrato e anteprima per 48 ore senza acquisto,
30 giorni dal pagamento; cancellazione anticipata su richiesta autenticata.
Solo riferimento ordine, stato e riferimenti Stripe per 90 giorni per
riconciliazione operativa. Non sono l'archivio contabile del venditore.
PDF e testo grezzo non sono salvati. PostgreSQL in UE, credenziali e chiave
di cifratura solo sul server. Nessuna persistenza in memoria in produzione.

Accesso senza account: segreto casuale di 256 bit in sessionStorage (solo il
segreto, mai il documento), inviato in Authorization. Link di recupero con
frammento rimosso prima di caricare analytics. Nel database solo l'hash.
Chi possiede il link può leggere il report: conservarlo privatamente.

Stato iniziale verificato il 21 settembre 2026: base b9e2785, PR #57 aperta
sopra #56. Su Vercel presente AI_GATEWAY_API_KEY; nessuna configurazione
Stripe/PostgreSQL. RIC-71 aperto, nessuna prova reale allegata.
