# Recap — pagine programmatiche RAL

_Aggiornato il 9 settembre 2026. Per priorità, dati e criteri di espansione vale la
[strategia SEO](strategia-seo.md). Questa nota descrive lo stato tecnico e il lavoro restante._

## Stato corrente

Il [generatore Node](../prototipo/genera-pagine-ral.js) e il
[template](../prototipo/ral-page.template.js) esistono già, senza nuove dipendenze.
Il generatore richiama `calcola()` e produce:

- 17 pagine da 20.000 a 100.000 euro, a intervalli di 5.000;
- hub `/confronti-ral/`;
- sitemap con pagine pubbliche e pagine RAL;
- risultati precalcolati, metadati, canonical e link alle RAL vicine.

La [pagina 35.000](../prototipo/ral-35000-netto/index.html) è già un output del template.
L'automazione non è più una proposta subordinata all'approvazione della pagina campione.
Le RAL 28.000 e 39.000 non sono ancora nell'elenco: sono le prossime aggiunte dell'esperimento.
Lo stato live e l'indicizzazione restano distinti dalla presenza degli HTML nel repository.

## Contratto delle pagine

La home resta il calcolatore completo. Ogni pagina RAL risponde immediatamente a una ricerca specifica e contiene:

- title, description, canonical e H1 specifici;
- risultato annuale e confronto della media mensile su 12, 13 e 14 mensilità;
- ipotesi visibili: Milano, nessun familiare, FPLD ordinario, anno completo;
- contributi, imposte, aliquote effettive e spiegazione sintetica;
- link al calcolatore personalizzato e alle RAL vicine.

Numeri e contenuto principale sono presenti nell'HTML iniziale. A parità di profilo e RAL,
il modello divide lo stesso netto annuale per le mensilità: il risultato è una **media**,
non la ricostruzione di ciascun cedolino. Il copy deve mantenere questa distinzione.

## URL e ampiezza

Un URL per importo, per esempio `/ral-35000-netto/`, con confronto 12/13/14 nella stessa pagina.
Non generare tre URL per ogni RAL. I link al calcolatore includono già RAL, mensilità e comune;
non occorre introdurre nuove landing con parametri per coprire lo stesso intento.

Un'eventuale separazione futura richiede prove di utilità e intenti distinti, non soltanto varianti di keyword.
Pagine simili non sono automaticamente doorway, ma devono offrire una risposta autonoma e una struttura navigabile.
[Policy Google](https://developers.google.com/search/docs/essentials/spam-policies)

## Ruolo del CCNL

Il cluster RAL parte da un importo annuale già noto. Il selettore CCNL della home suggerisce le mensilità;
non applica automaticamente tutte le regole contributive settoriali.

Separatamente, il [generatore CCNL → RAL](../prototipo/ccnl-livello.md) è già implementato per
Terziario Confcommercio e Metalmeccanica industria. Compone la RAL da livello, scatti, orario e superminimo,
poi usa il motore fiscale esistente. Le pagine SEO per livello sono un esperimento successivo;
la loro implementazione non è un prerequisito per le pagine RAL.

## Come aggiornare

Modificare elenco, template o fonti del calcolo; non modificare a mano gli HTML generati.
Dalla root del repository:

```bash
node prototipo/genera-pagine-ral.js
node --test prototipo/pagine-ral.test.js prototipo/ral-page.test.js prototipo/seo.test.js
```

Se cambiano elenco o struttura, adeguare le verifiche interessate e controllare numeri, canonical,
link interni, hub e sitemap. Se cambia il motore, eseguire anche le prove pertinenti al calcolo.
Questi sono comandi operativi per le modifiche al prodotto, non test dichiarati eseguiti da questa revisione documentale.

## Prossime azioni

1. Controllare in GSC indicizzazione e canonical della pagina 40.000 e di un campione delle pagine esistenti.
2. Aggiungere 28.000, poi 39.000 al generatore, aggiornando verifiche, vicine, hub e sitemap.
3. Eseguire generazione e controlli; creare una preview Vercel raggiungibile e verificarne direttamente desktop/mobile e collegamenti.
4. Pubblicare seguendo la [procedura di deploy](../prototipo/README.md#come-si-pubblica), dalla root del repository.
   Un push non aggiorna automaticamente il sito.
5. Verificare in produzione pagine e sitemap; inviare la sitemap in GSC e richiedere l'indicizzazione di un campione.
6. Monitorare subito copertura e canonical; valutare le performance nelle 6–8 settimane successive all'indicizzazione confermata.

Prima della pubblicazione verificare che le pagine siano raggiungibili dall'hub e che l'hub sia collegato dalla home.
Per ogni pagina annotare pubblicazione, prima indicizzazione osservata, impression, query, clic e utilizzo del calcolatore.
La raccolta degli eventi di personalizzazione va verificata prima di usarli come metrica.

Ampliare solo sulla base di query ricorrenti o segnali coerenti dal test. Se manca indicizzazione,
risolvere quel problema prima di produrre altre pagine; se il campione è scarso, registrare l'esito come inconcludente.
