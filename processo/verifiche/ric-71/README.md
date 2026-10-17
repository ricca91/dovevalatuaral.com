# RIC-71 — verifica del motore reale

Stato al 22 settembre 2026: **infrastruttura verificata fino al Gateway, qualità
del modello non ancora misurabile**. Il team Vercel non ha una carta valida
associata ad AI Gateway e rifiuta ogni generazione prima che raggiunga il
modello.

## Che cosa è stato costruito

`fixture.json` contiene quattro cedolini sintetici e privi di dati personali:

- mensile ordinario con paga base, superminimo, contributi e IRPEF;
- straordinario, buoni pasto, ratei, ferie e ROL;
- dicembre con premio, tredicesima, addizionali e conguaglio;
- codici aziendali non standard, importo col segno finale e prompt injection.

Ogni caso dichiara periodo, tre totali e quattro diciture che devono essere
riconosciute. `esegui.cjs` chiama lo stesso `server/busta-paga.js` usato dal
prodotto e fallisce se il modello perde un valore atteso o se una voce non è
citata nella stessa riga del testo. Registra inoltre latenza, regione e
fornitore dichiarati dal Gateway. Non contiene segreti e non usa PDF reali.

Esecuzione, con una chiave AI Gateway valida nell’ambiente:

```bash
node processo/verifiche/ric-71/esegui.cjs > /tmp/ric71-risultati.json
```

La soglia minima proposta per chiudere RIC-71 è 4/4 casi superati in due corse
consecutive, nessuna citazione inventata, regione `eu` confermata e revisione
umana delle spiegazioni. Questo corpus prova un minimo di utilità e robustezza;
non certifica correttezza fiscale né copre la varietà dei software paghe reali.

## Prova effettivamente eseguita

La preview Vercel protetta è stata distribuita e chiamata con `vercel curl`.
Sono stati verificati questi passaggi:

- il catalogo AI Gateway risponde `200` e contiene `anthropic/claude-sonnet-5`;
- il controllo preventivo di zero retention trova fornitori idonei in regione
  europea e lascia proseguire la richiesta;
- la vecchia `AI_GATEWAY_API_KEY` configurata nel progetto restituiva `401`;
- Vercel Functions consegna il token OIDC nell’header
  `x-vercel-oidc-token`, non in `process.env`; il backend ora lo trasferisce al
  motore come fallback senza salvarlo o restituirlo;
- una nuova chiave limitata a 1 USD autentica il catalogo, ma la generazione
  restituisce `403 customer_verification_required` perché manca una carta
  valida nel team;
- nessuna delle quattro richieste ha raggiunto Claude e nessun risultato di
  qualità o latenza del modello viene quindi dichiarato.

Il messaggio ufficiale del Gateway è: serve una carta valida sul team per
sbloccare i crediti. Aggiungerla è al di fuori di questo ticket: la sostituzione
del provider verrà valutata separatamente.

## Modifiche operative emerse

Il percorso RIC-72 invoca il motore dopo checkout e database. Ora propaga al
motore anche il token OIDC della singola richiesta, mantenendo la API key come
prima scelta e OIDC come fallback. Una prova automatica impedisce di perdere di
nuovo l’header. Il token resta solo in memoria per la durata della richiesta.

L’endpoint temporaneo usato per la prova è stato rimosso dal branch e non farà
parte della preview o della produzione finale.
