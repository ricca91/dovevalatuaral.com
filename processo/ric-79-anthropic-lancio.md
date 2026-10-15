# RIC-79 — Anthropic diretta e integrazione del lancio

Decisione di Riccardo, 24 settembre 2026: semplificare il fornitore e ridimensionare
la promessa privacy ai requisiti necessari. Sostituisce le raccomandazioni AWS /
Vertex e i vincoli UE-only/ZDR di RIC-64, RIC-69 e della ricerca RIC-71.

## Trattamento scelto

- Anthropic API commerciale diretta, endpoint `/v1/messages`, `claude-sonnet-5`.
- `ANTHROPIC_API_KEY` solo server. Nessun fallback ad AI Gateway, OIDC o altro cloud.
- Nessun addestramento secondo i termini commerciali; retention standard entro
  30 giorni, salvo eccezioni di sicurezza/legge. Nessuna promessa ZDR o inferenza UE.
- PDF letto nel browser, oscuramento e revisione del testo, consenso esplicito.
- Nessun PDF o testo grezzo nei nostri log/storage. Il report cifrato rimane
  disponibile 48 ore senza acquisto o 30 giorni dal pagamento, cancellabile.
- Limiti condivisi nel database e chiave di cifratura server; pagamento e report
  restano protetti lato server, nessun accesso al report completo prima del pagamento.
- GA4 sospeso sul sito: mancava una raccolta del consenso. Resta Datafast.

Fonti: [termini commerciali](https://www.anthropic.com/legal/commercial-terms),
[DPA](https://www.anthropic.com/legal/data-processing-addendum),
[retention](https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data),
[modelli](https://platform.claude.com/docs/en/models/overview).

## Punto contrattuale ancora da chiudere

Il DPA pubblico, Schedule 1 B.3, indica “None” per le categorie particolari.
Il consenso dell’utente non modifica il contratto con Anthropic. Prima del lancio
con documenti reali va chiarito il perimetro applicabile a eventuali dati salute /
sindacato residui oppure esclusa efficacemente la loro trasmissione. L’oscuramento
automatico è una minimizzazione, non una garanzia di anonimato o di assenza di
categorie particolari. Non è risolto dal cambio provider o da una checkbox.

## Integrazione

Branch unico sopra main con PR #56, #57, #60, #67 e #64. Conservati build `dist/`,
pagine generate fuori Git, calcolatore tredicesima, blog, CCNL e nuova navigazione.
Rimosso il catalogo ritenzione Vercel, aggiornati consenso/informativa/report e
prove del confine Anthropic (autenticazione, risposta parziale, timeout, errori).

## Attivazione

Usare `.env.example` e `processo/ric-72-operazioni.md`.
Il database richiesto da Riccardo è Supabase PostgreSQL, senza nuovo sistema account
utenti. Per `pg` usare connessione pooler session mode (porta 5432) con TLS verificato;
non il pooler transaction mode: il codice usa transazioni e advisory lock.
Prima di inviare dati reali dichiarare progetto/regione e retention backup effettive.
Migrazione: `node processo/attrezzi/busta-paga-migra.cjs`.

Vercel attuale: Hobby (verificato tramite API); il piano commerciale non è ancora
attivo. Nessun upgrade a pagamento eseguito. Stripe è disponibile secondo Riccardo,
ma credenziali/prodotto/prezzo/webhook non sono ancora configurati su questo progetto.
Non abilitare il flag live finché configurazione e percorso completo non passano.

## Verifica

Prima corsa reale Anthropic: tutti i totali delle 4 fixture corretti, nessuna
citazione inventata; 1/4 sul contratto esatto del benchmark (etichette con importo
incorporato e periodo con prefisso). Prompt chiarito senza cambiare gli attesi.
Le prove automatiche e i risultati successivi sono riportati nella PR di integrazione.
Nessuna prova con cedolini personali; nessun incasso reale effettuato.
