# RIC-101 — verifica del 16 ottobre 2026

## Ricerca SERP prima delle modifiche

Query: `ccnl studi professionali tabelle retributive 2026` e
`ccnl cooperative sociali tabelle retributive 2026`, con approfondimenti su
netto, D1 e aumenti. I risultati attuali includono guide 2026 e calcolatori:
non confermano più una SERP composta soltanto da PDF vecchi.
Lo strumento di ricerca non espone il blocco Google «Le persone hanno chiesto
anche»: le FAQ sono selezionate dai temi dei risultati e dal ticket, non
presentate come trascrizione verificata di quel blocco.

## Fonti

- [Confprofessioni, CCNL 2024, art. 140](https://confprofessioni.eu/wp-content/uploads/2024/02/CCNL-Studi-Professionali.pdf):
  consultato online; tranche dicembre 2026. Testo integrale e dati già verificati
  nel progetto: `processo/fonti-ccnl-gruppo1.md`, sezione H442.
- [Federsolidarietà, CCNL 2023–2025](https://www.federsolidarieta.confcooperative.it/Portals/0/CCNL/CCNL%20delle%20Cooperative%20Sociali%202023-2025%20.pdf):
  accesso web non riuscito; usata la copia locale già verificata nel progetto,
  `processo/dati/fonti/coopsociali-t151-ccnl-2023-2025-federsolidarieta.pdf`,
  artt. 76, 79, 79 bis. Riscontro documentato in `processo/fonti-ccnl-gruppo1.md`.
- [UILFP, 1 ottobre 2026](https://www.uilfp.it/ccnl-cooperative-sociali-report-sulla-prosecuzione-della-trattativa-per-il-rinnovo/):
  consultato online; trattativa del 29 settembre, discussione sugli aumenti
  rinviata. Non vengono attribuiti nuovi importi al rinnovo in corso.

Importi e netto delle FAQ derivano dallo stesso modello delle tabelle:
nessuna modifica alle regole del calcolo. La cronologia usa il 3° livello
per Studi e D1 per Cooperative; la tabella principale mantiene tutti i livelli.

## Verifica

- Primo ciclo: 20/21 test passati prima, 21/21 dopo (FAQ e data).
- Secondo ciclo: 21/22 prima, 22/22 dopo (decorrenze e fonti).
- `npm test`: 565/565 passati.
- `npm run build`: riuscita.
- `git diff --check`: riuscito.

## Dopo il merge

Il merge resta a Riccardo. Verificare le due pagine in produzione e annotare
la data effettiva di pubblicazione. Tre settimane dopo quella data, confrontare
in GSC posizione, clic, impressioni e CTR delle due query esatte, con stesso
periodo e filtri, e commentare RIC-101. Il risultato top 3 non è garantito dai test.
