# Fonti — Gomma, cavi elettrici e plastica, industria (CNEL B371)

Dossier di ricerca RIC-61, gruppo 2. Verifica del 16 ottobre 2026. ID dataset `gomma-plastica-industria-b371`.
Copie dei documenti in `processo/dati/fonti/`, tranne il consolidato Eutekne (vedi sotto).

## Identificazione

- CNEL B371 (idCcnl 189): «CCNL per gli addetti all'industria della gomma, cavi elettrici ed affini e all'industria delle materie plastiche».
- Parti datoriali: Federazione Gomma Plastica (Assogomma, Unionplast) e A.I.R.P. (ricostruttori pneumatici). Sindacati: Filctem-Cgil, Femca-Cisl, Uiltec-Uil.
- Archivio CNEL: ipotesi 10.12.2025 (idAccordo 239732 Femca/Uiltec/Filctem; 239733 UGL Chimici), accordo di sottoscrizione per adesione stipulato il 9.1.2026 (239734, FAILC CONFAIL). La sottoscrizione per adesione non è di AIRP: AIRP compare come parte datoriale in tutti e tre i record. Decorrenza 1.1.2026, scadenza 31.12.2028. Testo base: stesura 16.9.2020 (138012), rinnovo 26.1.2023.
- Nessun record CNEL dopo il 17.3.2026.

## Stato alla data di verifica (16.10.2026)

- Ipotesi firmata il 10.12.2025. L'efficacia era sospesa fino alla comunicazione di approvazione dei lavoratori.
- Riserva sciolta positivamente: Filctem, Femca, Uiltec lo hanno comunicato il 30.1.2026 alla Federazione (Assolombarda, pagina pubblica). Il contratto è quindi efficace.
- Le parti hanno diffuso il 16.1.2026 il testo con la tabella ufficiale dei minimi per livello (Eutekne 17.1.2026; FiscoeTasse).
- Tranche determinate: 1.1.2026, 1.4.2027, 1.4.2028, 1.12.2028. Alla data di oggi vige la tabella 1.1.2026; le altre tre sono future già firmate, con importi determinati.
- Accordo 30.6.2026: modifica solo il Titolo III (previdenza complementare, recepimento avviso comune 26.5.2026). Non letto.

## Fonti

| Fonte | Uso | Archivio |
|---|---|---|
| Ipotesi 10.12.2025 con tabelle, formato CNEL (Uniolex), 41 pp. | tabelle minimi e incrementi (pp. 15-16), art. 17, 8, 10, 24, previdenza (p. 6) | `processo/dati/fonti/gomma-plastica-b371-ipotesi-accordo-rinnovo-2025-12-10-uniolex-2026-10-16.pdf` |
| Testo consolidato CCNL 26.1.2023 + ipotesi (Eutekne, 174 pp.) | art. 17-19, 23, 25, 28, Allegato 1, art. 8, 10, FASG&P | non archiviato (riproduzione riservata) |
| Assolombarda: scioglimento riserva | stato efficacia | `processo/dati/fonti/gomma-plastica-b371-assolombarda-scioglimento-riserva-2026-01-30.html` |
| Eutekne 17.1.2026, FiscoeTasse, Consulenza Buffetti | corroborazione indipendente | `processo/dati/fonti/…eutekne…`, `…fiscoetasse…`, `…consulenza…` |
| Edotto, Dottrinalavoro | sintesi (incrementi, previdenza, orario) | `processo/dati/fonti/…edotto…`, `…dottrinalavoro…` |
| CNEL archivio, record B371 | identificazione | `processo/dati/fonti/gomma-plastica-b371-cnel-archivio-record-2026-10-16.json` |

Il testo coordinato 2026 e la circolare della Federazione sono riservati (chiave d'accesso, area soci Assolombarda): non letti.

## Che cosa è stato riscontrato

- **Struttura**: una sola scala di 10 livelli (Q, A, B, C, D, E, F, G, H, I) e una sola tabella TEM. Nessuna sezione. Gomma, plastica e ricostruzione compaiono solo come sotto-settori negli esempi di mansioni dell'area produzione; i cavi elettrici non hanno articolazione propria. Le aree funzionali usano sottoinsiemi della stessa scala.
- **Minimo (TEM)**, euro lordi mensili (art. 17 par. A c.3):

| Liv. | 1.1.2026 | 1.4.2027 | 1.4.2028 | 1.12.2028 |
|---|---|---|---|---|
| Q | 2.497,83 | 2.571,98 | 2.646,13 | 2.664,67 |
| A | 2.351,85 | 2.421,67 | 2.491,49 | 2.508,94 |
| B | 2.218,74 | 2.284,61 | 2.350,48 | 2.366,95 |
| C | 2.189,60 | 2.254,60 | 2.319,60 | 2.335,85 |
| D | 2.162,08 | 2.226,26 | 2.290,44 | 2.306,49 |
| E | 2.074,83 | 2.136,43 | 2.198,03 | 2.213,43 |
| F | 2.021,12 | 2.081,12 | 2.141,12 | 2.156,12 |
| G | 1.883,45 | 1.939,36 | 1.995,27 | 2.009,25 |
| H | 1.796,11 | 1.849,43 | 1.902,75 | 1.916,08 |
| I | 1.614,73 | 1.662,66 | 1.710,59 | 1.722,57 |

  Controllo: le differenze tra tabelle coincidono con la tabella degli incrementi (F +60, +60, +60, +15 = 195; Q +74,15 ×3, +18,54) e la tabella 1.1.2026 meno gli incrementi dà la tabella 1.4.2025 del CCNL 2023 (F 1.961,12). Storico 2023-2025 in `dati.json`.
- **Nessun EDR/contingenza** né altre voci nazionali fisse per i livelli, tranne l'indennità di funzione dei quadri (50,00 lordi mensili, art. 28 c.5). Totale pubblicato: nessuno (`totalePubblicato:null`).
- **Mensilità**: 13 (art. 25), calcolata su art. 19 c.2. Le voci fisse entrano nelle 13. Incidenza identica, nessuna quota annua mancante.
- **Orario**: 40 ore su 5 giorni (art. 8 par. A). Divisore 173 (art. 18).
- **Scatti** (art. 23): cifra fissa per ogni biennio di servizio presso la stessa azienda o gruppo, massimo 5, dal primo giorno del mese successivo al compimento del biennio. Importi: Q 20,14; A 18,59; B-C-D 16,53; E-F 13,94; G 13,43; H 11,88; I 10,33.
- **Part-time** (art. 10): D.Lgs. 81/2015; riproporzione legale sull'orario, nessuna formula contrattuale.
- **Welfare**: Fondo Gomma Plastica (azienda 1,56%, poi 1,78% dall'1.1.2027 e 2,00% dall'1.1.2028; lavoratore 1,56%); fondo sanitario FASG&P, 14 euro mensili a carico azienda. Non Fonchim/Faschim.
- **Condizionati**: indennità sostitutiva del premio di risultato (Allegato 1, 30-51 euro mensili), solo senza contrattazione di secondo livello. Nessuna una tantum.

## Corroborazione indipendente

- Livello F 1.1.2026, 2.021,12: Eutekne, FiscoeTasse (e consolidato Eutekne); Eutekne riporta tutti e 10 i livelli.
- Livello Q 1.12.2028, 2.664,67: Consulenza Buffetti (tabella a 4 decorrenze).

## Discrepanze nella fonte

- Termine per la comunicazione di approvazione: 30.6.2026 nel testo riprodotto da Uniolex, 30.1.2026 in Eutekne, Edotto e Assolombarda. La riserva è stata sciolta il 30.1.2026.
- Incremento «204 euro» (TEC, secondo i sindacati) contro 195 euro sui minimi di F: nel modello vale solo la tabella dei minimi.

## Limiti dichiarati

- Testo coordinato 2026 e circolare della Federazione riservati, non letti: scatti, tredicesima e
  part-time sono letti sul consolidato 2023 più l'ipotesi, e non si può escludere una modifica in stesura.
- Comunicazione sindacale originale del 30.1.2026 non letta: l'efficacia poggia su Assolombarda.
- Nessuna fonte primaria scaricabile: l'ipotesi è una riproduzione di terzi; la tabella è concorde in 4 fonti.
- Importi degli scatti dopo il rinnovo 2026 non confermati in stesura 2026.
- Riproporzione part-time di scatti e indennità di funzione: regola legale ore/40, non formula del contratto.
- Accordo 30.6.2026 (solo Titolo III, previdenza complementare) non letto.
- Livello I: nessuna regola sui lavoratori I fuori da produzione e funzioni integrate dopo l'1.12.2028.
- Nessun rinnovo dopo il 12 settembre 2026 in CNEL (ultimo inserimento 17.3.2026).

## Il consolidato Eutekne non è archiviato

«CCNL 26.1.2023 — testo consolidato come modificato dall'ipotesi 10.12.2025», Eutekne, 174 pp.
(<https://idealservice.it/d/ccnl-gomma-e-plastica-industria>). Ogni pagina porta la dicitura
«Eutekne — riproduzione riservata, copia riservata a» un'azienda cliente: per vincoli di
riproduzione la copia non è in `processo/dati/fonti/`. Resta citato per titolo e URL. Lettura
del 16 ottobre 2026 (pdftotext): pp. 16, 35, 39-41, 46-50 (art. 8, 10, 17-19), 54 (art. 23),
59 (art. 25), 60 (art. 28), 89 (Allegato 1). Gli altri file archiviati non portano marcature analoghe.

## Come il dataset ricava gli importi (implementazione, 16 ottobre 2026)

- **Tabelle**: sette, in `GOMMA_PLASTICA` (`prototipo/retribuzione-ccnl.js`). Le quattro 2026–2028
  (1.1.2026 vigente, 1.4.2027, 1.4.2028, 1.12.2028, future già firmate) sono ricopiate dall'ipotesi
  (art. 17 par. A c.3, p. 15); le tre 2023–2025 (1.1.2023, 1.1.2024, 1.4.2025) dal consolidato 2023
  (pp. 46-47). Ogni importo è stato ricontrollato per stringa sul testo estratto dei due PDF.
- **Voci**: `minimo` (TEM) su tutti i livelli; `indennitaFunzione` di 50,00 € solo sul livello Q
  (art. 28 c.5), nelle tredici mensilità come le altre voci fisse. Nessun EDR o contingenza.
- **Totale**: la fonte non stampa totali, quindi `totalePubblicato:null` e il totale è derivato.
- **Mensilità e orario**: 13 (art. 25), 40 ore (art. 8). Voci fisse e scatti entrano tutti nelle 13:
  nessuna `mensilita` per voce, nessuna `quoteAnnueMancanti`, `ralCompleta` vera.
- **Scatti**: `cifraFissa(2,5)`, importo per livello (Q 20,14; A 18,59; B/C/D 16,53; E/F 13,94;
  G 13,43; H 11,88; I 10,33), dal mese successivo al biennio, su 13 mensilità. Gli importi sono
  uguali in tutte e sette le tabelle: l'art. 23 non risulta modificato dall'ipotesi (limite dichiarato).
  Il passaggio di livello (c.4) è nelle esclusioni.
- **Part-time**: riproporzione ore/40 su minimo, indennità di funzione e scatti; superminimo non
  riproporzionato. È la regola legale (D.Lgs. 81/2015 art. 7, richiamato dall'art. 10).
- **Fonte nel catalogo** (`ccnl.js`): scioglimento della riserva, Assolombarda 30.1.2026; data di
  riferimento 10.12.2025 (data dell'ipotesi). Decorrenza economica 1.1.2026, scadenza 31.12.2028.
- **Corroborazione**: F 1.1.2026 = 2.021,12 (Eutekne, FiscoeTasse); Q 1.12.2028 = 2.664,67
  (Consulenza Buffetti); controllo incrociato F: 2.021,12 − 60 = 1.961,12 (tabella 1.4.2025).
- **Nessuna estensione del modello**: sezioni assenti, voci per livello e scatti con importi per
  livello bastavano.
