# Ti spiego la busta paga — percorso RIC-72

Partendo da RIC-68 (PDF e oscuramento locali) e RIC-69 (analisi), RIC-72
aggiunge anteprima → Stripe Checkout una tantum → report recuperabile.
Le precedenti esclusioni di storage e pagamento sono superate. RIC-71 resta
responsabile della qualità e verifica del motore reale; RIC-73 della landing.

**Stato:** implementazione predisposta per configurazione. Senza PostgreSQL,
chiave di cifratura, Stripe e prezzo la pagina disabilita upload e acquisto.
Riccardo ha richiesto codice e istruzioni: non sono stati provisionati servizi
né effettuati incassi. Le simulazioni non sostituiscono la prova integrata reale.

- [Contratto per la landing](../processo/ric-72-percorso.md)
- [Configurazione, assistenza e gate live](../processo/ric-72-operazioni.md)
- [Verifiche ed evidenze](../processo/verifiche/ric-72/README.md)

## Il percorso e i dati

1. Un PDF digitale, una mensilità, fino a 3 pagine e 5 MB. `busta-paga-pdf.js`
   usa pdf.js ospitato sul sito; `componiRighe` raggruppa frammenti per linea di
   base e ascissa. Il PDF non lascia mai il browser; buffer e campo file sono
   liberati dopo la lettura.
2. `busta-paga-redazione.js` sostituisce identificatori, sigle sindacali e motivi
   di assenza con segnaposto mantenendo gli importi. Il riconoscimento del nome
   è euristico e imperfetto: la persona controlla e modifica parola per parola.
   Una sola `applica()` produce testo e segmenti mostrati, evitando divergenze.
3. Dopo consenso esplicito parte `{testo, consenso:true}`. Un token casuale di
   256 bit viaggia solo in Authorization; nel browser si conserva in
   sessionStorage **solo il token**, non documento, testo o report. Doppio clic
   e retry mantengono lo stesso token/operazione.
4. Il server registra l'operazione in PostgreSQL prima di invocare il motore.
   Il testo non viene salvato. L'impronta HMAC impedisce di riusare la medesima
   operazione con testo diverso. Limiti condivisi: cinque nuove analisi per
   chiamante/ora e cento al giorno globali (configurabile), oltre al budget AI.
5. Il motore interno `server/busta-paga.js::analizza` restituisce il report
   validato dalle guardie. Contratto v1: periodo, tre totali numerici, almeno
   due diciture spiegate non sconosciute e con confidenza non bassa, conto
   calcolabile. Un report sotto soglia non consente Checkout. Questo controllo
   misura completezza, non correttezza fiscale o qualità semantica.
6. Il report viene cifrato AES-256-GCM e salvato. La risposta pubblica include
   solo periodo, tre totali e una spiegazione. Il report completo non arriva al
   client finché il pagamento non è verificato. `/api/busta-paga` legacy usa lo
   stesso handler protetto; il vecchio handler del motore non è esposto in API.
7. Il prezzo deriva da uno Stripe Price server-side, è salvato sull'ordine e
   mostrato prima del checkout. Le sessioni sono idempotenti per tentativo:
   annullamento e rifiuto preservano la sessione; una nuova sessione è consentita
   solo dopo che Stripe dichiara scaduta la precedente. Nessun abbonamento.
8. Webhook firmato e ritorno dal checkout condividono la stessa transizione
   atomica. Il server legge lo stato corrente da Stripe e controlla prezzo,
   valuta, ambiente, riferimento e sessione. Un redirect non prova il pagamento.
9. Solo dopo la verifica viene consegnato il report, reso con `textContent`:
   riepilogo, diciture, fonte, spiegazioni, calcoli, dubbi e valori non individuati.
   Stampa/salva PDF usa gli stili print senza link privato o UI di pagamento.
10. Il link di recupero contiene il segreto nel frammento, rimosso dal primo
    script nel head prima di analytics. Chi lo possiede può accedere: salvarlo
    privatamente. Nessun account o recupero email implementato.

## Persistenza e limiti

PostgreSQL durevole, mai memoria dell'istanza in produzione. Il report rimane
48 ore senza acquisto o 30 giorni dal pagamento. Accesso revocato alla scadenza;
il cron giornaliero elimina il cifrato scaduto entro 24 ore. Il pulsante di
cancellazione elimina subito il contenuto dal database attivo; le politiche di
backup del provider vanno dichiarate prima dell'attivazione.

Ordine, prezzo del servizio e riferimenti Stripe rimangono 90 giorni per
riconciliazione/assistenza. Non sono archivio contabile. Stripe non riceve mai
cedolino, testo o token. Il database conserva hash del token, non il token.

Se l'istanza muore dopo aver prenotato l'analisi, non ripetiamo automaticamente
una chiamata potenzialmente già fatturata: dopo due minuti mostriamo tentativo
interrotto, cancellabile. Se l'utente decide di ripartire, è una nuova operazione.
Se Stripe risponde ma il processo perde la risposta, i parametri già persistiti
mantengono la stessa idempotency key. Dopo 23 ore senza session ID si richiede
assistenza: non si rischia di ricreare un pagamento oltre la finestra di Stripe.

## File

| Confine | File |
|---|---|
| Lettura e oscuramento | `busta-paga-{pdf,estrazione,redazione}.js` |
| Revisione e consenso | `busta-paga-ui.js` |
| Accesso privato, prima di analytics | `busta-paga-accesso.js` |
| Rete (mai bytes/nome PDF) | `busta-paga-invio.js` |
| Anteprima, acquisto, recupero | `busta-paga-percorso.js`, `busta-paga-percorso.css` |
| Report come testo | `busta-paga-risultato.js` |
| API e firma webhook | `server/busta-paga-http.js`, `api/busta-paga*.js` |
| Stati, pagamento, cifratura | `server/busta-paga-acquisto.js` |
| Transazioni SQL, limiti, cleanup | `server/busta-paga-archivio.js` |
| Schema e migrazione | `processo/attrezzi/busta-paga-migra.cjs` |
| Motore e guardie (RIC-71) | `server/busta-paga{,-contratto,-prompt,-ritenzione,-tetti}.js` |

## Misurazione

GA4 escluso. Datafast riceve eventi a nomi e proprietà chiusi, senza contenuti,
importi o identificatori del cedolino. RIC-72 aggiunge `payslip_preview` e
`payslip_checkout`, senza proprietà. Il pagamento riuscito è contato una sola
volta nella transizione server persistita `eventoPagamento`; non è un evento
client che un refresh possa replicare. Per l'aggregazione vedere le istruzioni.

## Cosa deve ancora dimostrare RIC-71

Le guardie del motore verificano che dicitura e importo compaiano nella stessa
riga, rifiutano enumerazioni sconosciute e calcolano la riconciliazione. Non
basta per provare associazione semantica, segni o qualità su layout reali.
Il routing AI, regione, non conservazione e divieto di addestramento sono quelli
ereditati da RIC-69 e vanno verificati con il provider reale in RIC-71.
Non abbiamo modificato il motore o dichiarato superata quella dipendenza.
