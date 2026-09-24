# RIC-72 — configurazione, assistenza e attivazione

Il codice non incassa senza configurazione. Riccardo ha richiesto **codice e
istruzioni**, senza provisioning di Stripe o database. Nessuna transazione reale
è stata creata. La prova integrata Stripe test + database ospitato + motore reale
resta un gate di rilascio, insieme a RIC-71. Prezzo live non deciso.

## 1. Database e chiavi

1. Predisporre PostgreSQL in UE, distinto fra test e live. L'applicazione usa
   `pg`, connessione TLS con verifica del certificato (ad esempio `sslmode=verify-full`),
   massimo tre connessioni per istanza; usare l'endpoint con pooling del provider.
   Non disabilitare la verifica TLS. Il database non deve essere esposto al browser.
2. Nominare il provider, regione, DPA e durata dei backup nell'informativa prima
   di abilitare upload. I backup devono avere una scadenza definita; il codice
   può cancellare il database attivo, non i backup gestiti dal provider.
3. Impostare `BUSTA_PAGA_DATABASE_URL` nel secret store di Vercel e nella shell
   solo per la migrazione. Eseguire `node processo/attrezzi/busta-paga-migra.cjs`.
   La migrazione crea due tabelle `bp_ordini`, `bp_limiti`; è ripetibile, non
   cancella dati. Per migrare usare un ruolo DDL, per runtime preferire un ruolo
   limitato a SELECT/INSERT/UPDATE/DELETE sulle due tabelle.
4. Generare due segreti indipendenti: `openssl rand -hex 32` per
   `BUSTA_PAGA_CHIAVE_REPORT`, `openssl rand -hex 32` per `CRON_SECRET`.
   Inserirli tramite prompt di `vercel env add NOME`, mai nei commit o ticket.
   La chiave cifra AES-256-GCM con l'ordine come associated data. Non sostituirla
   finché esistono report leggibili: una rotazione richiede ricifratura/migrazione.
5. Il cron `/api/busta-paga-pulizia` gira ogni giorno alle 03:15 UTC e richiede
   `Authorization: Bearer <CRON_SECRET>`. Su Vercel i cron girano in produzione:
   per un database preview predisporre un trigger HTTPS esterno protetto con lo
   stesso header, oppure eseguire la pulizia prima di eliminare l'ambiente.
   Controllare l'esecuzione e allertare in caso di HTTP diverso da 204.

## 2. Stripe test

1. In Stripe scegliere modalità test/sandbox e creare prodotto e prezzo EUR
   **una tantum**, senza tasse automatiche, coupon o quantità variabile. Il valore
   è provvisorio di test: non è una scelta commerciale. I test automatici usano
   1,00 € sintetico; il codice distribuito non contiene un prezzo predefinito.
2. Impostare `STRIPE_SECRET_KEY` test e `STRIPE_PRICE_ID`. Non serve una chiave
   pubblicabile: Checkout è ospitato da Stripe e non raccogliamo carte nel sito.
3. Impostare `BUSTA_PAGA_MODALITA=test` e `BUSTA_PAGA_ORIGINE` all'origine HTTPS
   esatta della preview stabile, **senza slash finale**. Deve coincidere con
   l'origine sulla quale si carica il PDF: la chiave di accesso è in sessionStorage
   e un ritorno su un dominio diverso non può leggerla.
4. Registrare il webhook HTTPS `/api/busta-paga-webhook` nello stesso account
   test e configurare `STRIPE_WEBHOOK_SECRET`. Eventi:
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed`, `checkout.session.expired`.
   Stripe deve poter raggiungere l'endpoint: usare le eccezioni webhook della
   protezione deploy, senza rendere pubblica tutta una preview protetta.
5. Mantenere `AI_GATEWAY_API_KEY` con budget del provider; configurare
   `BUSTA_PAGA_ANALISI_GIORNO` (default 100) come ulteriore limite condiviso.
   Il costo AI è sostenuto dal proprietario della chiave, anche senza acquisto.
   `BUSTA_PAGA_ATTIVO=0` ferma nuove analisi senza impedire il recupero dei report.
6. Ridistribuire la preview. `GET /api/busta-paga?azione=configurazione` deve
   riportare `disponibile:true`, prezzo con `test:true` e limiti 3 pagine/5 MB.
   Prima di questo la pagina mostra servizio in preparazione e disabilita upload.

## 3. Prova integrata da eseguire dopo la configurazione

Usare PDF sintetici, mai dati di terzi senza autorizzazione. RIC-71 deve fornire
il motore verificato e le fixture rappresentative. Una risposta HTTP 200 non
è una valutazione della qualità della spiegazione.

- Desktop e 390 px: PDF → oscuramento → consenso → anteprima specifica;
  in rete deve comparire solo testo approvato più `consenso`, mai bytes/nome PDF.
- Prima di pagare: nessun report completo in risposte API, DOM o storage browser.
  Solo l'anteprima con periodo, tre totali disponibili e una dicitura spiegata.
- Aprire Checkout e annullare; l'anteprima sopravvive e un nuovo clic riusa la
  sessione. Provare un rifiuto con i numeri di carta **test** documentati da Stripe.
- Completare Stripe test, tornare prima del webhook e aggiornare: il server
  interroga Stripe, non si fida del redirect. Il report non richiede nuova AI.
- Reinviare lo stesso webhook e invertirne l'ordine con `expired`: il server
  legge lo stato Stripe corrente; un pagamento è contato una volta sola.
- Ricaricare e aprire il link privato in un altro browser; provare invece ID
  ordine e token diverso: accesso negato. Il token non deve comparire nei log,
  referrer, URL HTTP o eventi analytics. Escludere Authorization e corpi HTTP
  da eventuali log drain/APM aggiunti al progetto.
- Verificare scadenza, cancellazione, stampa/PDF e indisponibilità temporanea di
  Stripe/DB. La pulizia deve eliminare contenuti scaduti entro il giro giornaliero.

Fonti ufficiali lette il 21 settembre 2026:
[Checkout fulfillment](https://docs.stripe.com/checkout/fulfillment),
[webhook e firma](https://docs.stripe.com/webhooks),
[idempotenza](https://docs.stripe.com/api/idempotent_requests),
[carte test](https://docs.stripe.com/testing),
[raw body Vercel](https://vercel.com/kb/guide/how-do-i-get-the-raw-body-of-a-serverless-function).

## 4. Recupero e assistenza

Il link è una credenziale: non metterlo in ticket, email di assistenza, screenshot
pubblici o analytics. Il server conserva solo il suo hash e non può ricostruirlo.
Il browser conserva soltanto la chiave; mostrare il link prima dell'acquisto
permette alla persona di salvarlo. Chiudere la scheda può eliminare sessionStorage:
serve il link salvato. Non esiste recupero tramite email né storico/account.

Per un pagamento senza report, richiedere il **riferimento ordine** oppure
l'identificatore di ricevuta Stripe, mai il PDF o il link privato. Operatore
abilitato confronta riferimento ordine, sessione Stripe, `paymentIntent`,
importo/valuta e stato. Cercare l'ordine con query parametrizzata su
`dati->>'riferimento'` (i dati sono nella tabella `bp_ordini`).

- Se la sessione è pagata ma il webhook è fallito, reinviarlo da Stripe o chiedere
  alla persona di usare «Aggiorna stato»: entrambi eseguono la stessa riconciliazione.
- Se il report è ancora valido, il link originale lo recupera senza nuovo addebito.
- Se link e sessione browser sono persi, non consegnare il contenuto a chi mostra
  soltanto un numero d'ordine: verificare l'acquisto in Stripe e offrire assistenza
  o rimborso. Questa versione non emette un secondo link tramite email.
- Se il contenuto è stato eliminato/scaduto, non ricostruirlo automaticamente né
  addebitare di nuovo. Il campo `assistenza: pagamento_senza_report` segnala i
  pagamenti riconciliati senza contenuto disponibile. Valutare rimborso dal
  PaymentIntent originale in Stripe; nessun rimborso automatico implementato.
- Cancellare un report non rimborsa. Per una cancellazione amministrativa
  eliminare `cifrato` e `impronta`, impostare `stato=cancellato` e `scadenza=now`,
  preservando i riferimenti di pagamento. Prima chiudere eventuale Checkout aperto.

Il conteggio server degli acquisti è la transizione persistita
`eventoPagamento=payslip_payment_succeeded`, una per ordine. Per le metriche
usare aggregati SQL, mai esportare contenuti o token in Datafast. Esempio:

```sql
SELECT count(*) FROM bp_ordini
WHERE dati->>'eventoPagamento' = 'payslip_payment_succeeded';
```

Il conteggio copre la retention operativa di 90 giorni. Conservare eventuali
aggregati privi di riferimenti ordine separatamente per statistiche storiche.

## 5. Gate live (non ancora soddisfatti)

- Prezzo EUR approvato da Riccardo, prodotto e Price live corrispondenti.
- Account Stripe abilitato agli incassi, dati venditore reali, conto di accredito,
  informazioni contrattuali/fiscali, termini di vendita e gestione consumatori
  verificati prima della vendita. Non inventare i dati del venditore.
- Hosting adatto all'uso commerciale: [Vercel Hobby è per uso personale non
  commerciale](https://vercel.com/docs/plans/hobby); verificare il piano effettivo
  e passare a un piano idoneo prima dell'attivazione, non automaticamente.
- Provider PostgreSQL UE e backup nominati nell'informativa; privacy/condizioni
  effettive dei fornitori verificate. Retention contabile distinta dai 90 giorni
  operativi dell'app e definita con chi segue gli obblighi del venditore.
- RIC-71 completato: motore reale, trattamento verificato, qualità e latenza
  misurate. Soglia v1 di completezza approvata sulla valutazione.
- Prova integrata sopra completata su deploy, inclusi webhook con raw body e
  firma, concorrenza su PostgreSQL ospitato, cleanup schedulato e ritorno Stripe.
- Solo allora `BUSTA_PAGA_MODALITA=live`, credenziali/Price/webhook live separati,
  `BUSTA_PAGA_LIVE_APPROVATO=1` e `VERCEL_ENV=production`. Il codice impedisce live
  su preview o senza approvazione esplicita. La variabile rappresenta tutti i gate,
  non sostituisce la verifica.
- Collegare landing/ingressi pubblici con RIC-73 solo al rilascio pronto. Nessuna
  modifica al piano di hosting, pagamento reale o pubblicazione in produzione
  è stata effettuata in questa implementazione.
