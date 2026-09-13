# Verifica RIC-62 — 13 settembre 2026

Base: `d1b9245a052b6c30627a0172db6396fef84568df`. Implementazione nel branch
`riccsartori/RIC-62-netto-o-niente`, clone isolato in `/tmp/ric-62-netto-o-niente`.
Il checkout originale con modifiche in corso non è stato modificato.

## Verificato

- `npm test`: **339 test, 339 pass, 0 fail**, 46 suite (incluse API social),
  Node v22.22.2. Nessuno skip. Baseline: il test SEO dei vecchi prototipi falliva
  perché i due file non sono nel repository; correzione circoscritta in questa PR.
- `node --check` per i nuovi script del gioco e il copione browser; `git diff --check`.
- Generatore RAL eseguito; suite verifica rigenerazione deterministica e sitemap.
- Sei fixture fiscali del ticket al centesimo, costi mensili, benefit separati,
  spiegazione dell'inversione e apertura nel comparatore esistente.
- 25 seed × 101 round con validazione completa, 1.000 round avanzati bilanciati,
  40 fallback di input ricalcolati, fingerprint di 7 sorgenti e 3 vettori da 100 round.
- Chromium reale controllato con agent-browser e copione Playwright/CDP:
  22 risposte corrette, errore al confronto 23, refresh prima della scelta,
  dopo risposta corretta, dopo Prossimo e dopo sconfitta. Focus da tastiera,
  Enter tenuto premuto e doppio clic non duplicano punti.
- Sfida in un contesto browser separato, 101 round browser/Node identici,
  pareggio e superamento del target senza finale, target zero, rivincita e nuovo seed.
- Errore tecnico del generatore recuperabile; guasto al round 14 durante replay
  di 105 risposte: cronologia intera conservata e successivamente ricostruita.
- Storage bloccato/corrotto, URL incompatibili/duplicati/enormi/malevoli,
  tracker assente, `file://` offline e JavaScript disabilitato.
- Dialog social, chiusura, clipboard successo/rifiuto, fallback manuale:
  guasti API simulati in Chromium. **Clipboard verificata anche realmente**,
  con rilettura del testo copiato. Eventi analytics controllati nelle transizioni,
  assenti durante ripristino, senza seed, URL o dati fiscali nei payload.
- Layout controllato visivamente e con bounding box a 375×812, 390×844,
  1440×900, zoom CSS 200% e reduced motion. Nessun controllo ritagliato;
  dettagli almeno 14px, pulsanti di gioco almeno 44px. Corretto il layout a
  larghezza estrema emerso durante la verifica dello zoom.

## Screenshot

Verifica completa rieseguita dopo il nuovo finale con scontrino.
Dettagli del flusso attuale e nuove immagini in [ric-62-social](../ric-62-social/README.md).

| Stato | Evidenza |
| --- | --- |
| Intro desktop | [Screenshot](intro-desktop.png) |
| Domanda desktop | [Screenshot](domanda-desktop.png) |
| Domanda 375px | [Screenshot](domanda-375.png) |
| Domanda 390px | [Screenshot](domanda-390.png) |
| Confronto 13, continua | [Screenshot](rivelazione-desktop.png) |
| Rivelazione mobile | [Screenshot](rivelazione-mobile.png) |
| Fine desktop | [Screenshot](fine-desktop.png) |
| Fine mobile | [Screenshot](fine-mobile.png) |
| Conti e fonti | [Screenshot](conti-e-fonti-desktop.png) |
| Zoom 200% | [Screenshot](zoom-200-mobile.png) |
| Storage bloccato | [Screenshot](storage-indisponibile-mobile.png) |

## Limiti concreti

La prova browser locale usa `http://127.0.0.1:4182`; l'esito della preview viene
riportato nella PR. Nessun deploy in produzione. Verificati dialog, link e
metadati pubblici; non la pubblicazione nei social o la ricezione da parte dell'amico.

La discrepanza preesistente di un centesimo fra KPI imposte e somma delle voci
è documentata in `prototipo/netto-o-niente.md`: il gioco usa le voci riconciliate,
senza cambiare fonti fiscali, netti o disponibili del comparatore.

## Ripetere la verifica browser

Usare `processo/attrezzi/verifica-netto-o-niente.cjs` con percorso a una copia
installata di `playwright-core`, endpoint CDP di agent-browser e URL base
facoltativo. Il copione esegue clic reali, apre il comparatore, inietta soltanto
i guasti/fallback dichiarati e rigenera questi screenshot fuori dalla cartella
pubblicata `prototipo/`. Playwright non è una dipendenza del prodotto; il nuovo
renderer PNG server usa `@resvg/resvg-js`.
