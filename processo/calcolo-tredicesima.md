# Calcolatore della tredicesima — spec

Data: 2026-09-24 · Branch: `calcolo-13esima` · Ticket: RIC-76 (strategia "free tools")

## Perché

"calcolo tredicesima" vale 5.400 ricerche al mese in Italia, 33.100 a dicembre
(DataForSEO, RIC-76). Il sito ha 0 keyword posizionate. Un calcolatore gratuito su
una pagina sua è la leva che ha fatto crescere SuperX. Scadenza: online entro il
31 ottobre 2026, prima del picco.

Successo = numeri giusti e verificabili con le fonti come nel resto del sito, pagina
indicizzabile, online entro fine ottobre insieme all'articolo corretto.

## Perimetro

Dentro: lavoro dipendente privato, regole 2026, tredicesima lorda e netta con
scomposizione, mesi lavorati, riquadro sulla tredicesima detassata (proposta).

Fuori (YAGNI): quattordicesima e TFR (pagine gemelle successive, il modulo non deve
impedirle), immagine di condivisione, pensionati, part-time come input separato (il
lordo mensile o la RAL lo contengono già), massimale contributivo.

## 1. Input e stati

Selettore in testa: **"Parto dal lordo mensile"** / **"Parto dalla RAL"**.

| Campo | Modalità | Valori | Default |
|---|---|---|---|
| Lordo mensile | lordo | 100 – 9.000 € | vuoto |
| RAL | RAL | 1.000 – 120.000 € | vuoto |
| Mensilità | RAL | 13, 14 | 13 |
| Mesi lavorati nell'anno | entrambe | intero 1 – 12 | 12 |

I tetti restano sotto il massimale contributivo (122.295 €), che è fuori perimetro.

Non si chiedono comune né familiari: sulla tredicesima non si trattengono
addizionali e non si applicano detrazioni. La pagina lo dice.

Nota accanto ai mesi: di solito una frazione di almeno 15 giorni conta come mese
intero, ma lo stabilisce il CCNL.

Comportamento: calcolo al click del bottone, come `netto-ral.html`. Errori inline
sul campo (vuoto, non numerico, fuori range). Precompilazione da query string:
`?ral=30000[&mensilita=14][&mesi=8]` oppure `?lordo=2300[&mesi=8]`; valori non
validi nella query vengono ignorati, senza errore.

## 2. Calcolo

Modulo puro `prototipo/tredicesima.js`, stesso pattern di `netto-ral.js` (globale
nel browser, `module.exports` in Node), stessa aritmetica decimale di `motore.js`.
Non carica il motore nel browser: il motore richiede `dati-addizionali-2026.js`
(4,4 MB) che qui non serve. Le costanti usate sono replicate e un test di parità le
confronta con `K` del motore. Restituisce **voci** (importo, base, fonte), non testo: le **righe** le
compone la pagina (glossario in `CONTEXT.md`).

Definizioni:

- `mensile` = lordo mensile, oppure RAL ÷ mensilità
- `lorda` = mensile × mesi ÷ 12
- `imponibileAnnuoStimato` = serve solo per bonus cuneo e riquadro detassata.
  Modalità RAL: `imponibile(RAL × mesi ÷ 12)` del motore. Modalità lordo:
  la stessa funzione su `mensile × 13 × mesi ÷ 12`, dichiarata in pagina come stima
  su 13 mensilità.

| # | Voce | Regola | Fonte |
|---|---|---|---|
| 1 | Tredicesima lorda | `lorda` | prassi CCNL: una mensilità, in ratei per i mesi lavorati |
| 2 | Contributi INPS | 9,19% di `lorda` | INPS circ. 101/2024 |
| 3 | Contributo aggiuntivo 1% | criterio di mensilizzazione: a dicembre la tredicesima si somma allo stipendio. Importo = 1% × [max(0, mensile + lorda − 4.685) − max(0, mensile − 4.685)]. Mostrata solo se > 0 | INPS circ. 6/2026 (soglia mensile 4.685 €; conguaglio a fine anno) |
| 4 | IRPEF trattenuta | `lorda − 2 − 3`, tassata da sola con gli scaglioni annui ÷ 12: 23% fino a 2.333,33 €, 33% fino a 4.166,67 €, 43% oltre. Nessuna detrazione. Scomposta per scaglione | D.Lgs. 33/2025 art. 33 c. 3 lett. b; AdE circ. 15/2007 (conferma circ. 326/1997) |
| 5 | Bonus cuneo (somma esente) | spetta se `imponibileAnnuoStimato` ≤ 20.000 €; la percentuale (7,1 / 5,3 / 4,8%) si sceglie sull'imponibile rapportato all'anno intero e si applica a `lorda − 2 − 3`. Si **aggiunge** al netto | L. 207/2024 art. 1 c. 4-5; AdE circ. 4/2025 ("applicando tale percentuale al reddito effettivamente corrisposto mensilmente") |
| 6 | **Tredicesima netta** | 1 − 2 − 3 − 4 + 5 | — |

Resta fuori, e la pagina lo dice: ulteriore detrazione 20–40 mila e trattamento
integrativo (sono ripartiti sui periodi di paga ordinari), addizionali regionale e
comunale (non trattenute sulla tredicesima), conguaglio di fine anno.

**Riconciliazione**: lorda − 2 − 3 − 4 + 5 = netta, al centesimo; stessa guardia
del motore.

**Nota sul conguaglio** (in pagina): è la trattenuta di dicembre. A fine anno il
conguaglio ricalcola l'IRPEF sul totale annuo con le detrazioni, e l'1% aggiuntivo
viene restituito se nell'anno si resta sotto 56.224 €.

**Riquadro detassata** (etichetta fissa "proposta, non legge"):

- se `imponibileAnnuoStimato` ≤ 15.000 €: "Con la proposta del 15% risparmieresti
  X €", con X = voce 4 − 15% × (lorda − 2 − 3), minimo 0
- altrimenti: "0 €: sei sopra la soglia di 15.000 € di imponibile"
- link a `/blog/tredicesima-detassata/`

Le costanti della proposta (15%, 15.000 €) stanno in un blocco a parte, commentato
come ipotesi di stampa (Sky TG24, 28/08/2026), per aggiornarle quando esce il testo.

Casi di controllo, calcolati a mano (RAL, 13 mensilità, 12 mesi, fuori dal bonus
cuneo):

| RAL | Lorda | INPS 9,19% | Aggiuntivo 1% | IRPEF | Netta |
|---|---|---|---|---|---|
| 30.000 | 2.307,69 | 212,08 | 0 | 481,99 | 1.613,62 |
| 35.000 | 2.692,31 | 247,42 | 7,00 | 571,17 | 1.866,72 |
| 40.000 | 3.076,92 | 282,77 | 14,69 | 683,89 | 2.095,57 |

Da 35.000 € in su, a dicembre stipendio + tredicesima superano 4.685 € e scatta
l'1%, che abbassa anche la base IRPEF. I valori sopra sono stime in virgola mobile:
il test li fissa al centesimo con l'aritmetica decimale del motore. L'articolo non
mette l'1% in tabella (lo spiega in "Cosa non copro"), quindi coincide con il tool
fino a 30.000 € e differisce di pochi euro sopra: accettabile, perché l'articolo lo
dichiara.

## 3. Pagina, SEO, collegamenti

- File `prototipo/calcolo-tredicesima/index.html` → `/calcolo-tredicesima/`,
  statico, stile `draftsman.css`, risorse condivise con `../`.
- Title: "Calcolo tredicesima 2026: lorda e netta, con i mesi lavorati | Dove va la
  tua RAL". Description con "calcolo tredicesima netta". Canonical su se stessa.
  `analytics.js` nel head.
- JSON-LD `WebApplication` + `FAQPage`.
- Struttura: H1 con keyword → una riga su cosa fa → form → risultato → riquadro
  detassata → 3-4 FAQ in HTML statico (Come si calcola? Perché è tassata di più?
  Quando si paga? Se ho lavorato solo qualche mese?) → fonti.
- Collegamenti: `sitemap.xml`; `publicPages` in `seo.test.js`; voce "Calcolo
  tredicesima" nel menu dei calcolatori su tutte le pagine che ripetono il markup
  del menu; riga "La tua tredicesima netta a questa RAL →" nel template delle pagine
  `ral-xxx-netto/` con `?ral=` (poi rigenerate); link dall'articolo (commit
  `1d5699c`, già su questo branch).
- Analytics: evento `tredicesima_calcolata` con parametro `modalita`
  (`lordo`/`ral`), via `gtag` come gli eventi esistenti. Nessun importo inviato.

## 4. Test e verifica

`prototipo/tredicesima.test.js` (entra in `npm test`):

- casi di controllo della tabella sopra, al centesimo; RAL 15.000 e 20.000 con il
  bonus cuneo
- mesi: 8 mesi = 8/12 della piena
- equivalenza modalità: lordo 2.307,69 = RAL 30.000/13
- scaglioni: confine esatto 2.333,33 e 4.166,67
- 1%: assente sotto soglia, solo quota dovuta alla tredicesima sopra
- bonus cuneo: presente a imponibile annuo 20.000, assente a 20.000,01
- riconciliazione su una griglia di input
- input non validi: vuoti, negativi, fuori range, mesi 0 e 13, mensilità non
  ammesse
- detassata: positivo sotto 15.000 € di imponibile, zero sopra

Test di pagina: `seo.test.js` (title, description, canonical, analytics), pagina
in sitemap, FAQ presenti nell'HTML statico, JSON-LD parsabile, link `?ral=` dalle
pagine `ral-xxx-netto/`.

Verifica visiva: screenshot headless a 375 e 1440 px (vuoto, risultato, errore,
riquadro detassata) in `processo/verifiche/calcolo-tredicesima/`; PR → preview
Vercel per Riccardo.

Solo il deploy live può confermare: indicizzazione, rich results, eventi in
analytics.

## Note

- Il commit dell'articolo `1d5699c` rompe 3 test finché la pagina non esiste
  (`validateLinks` in `genera-articoli.js`): si risolve con questo lavoro.
- `prototipo/sitemap.xml` su main non contiene l'articolo della tredicesima; i test
  lo rigenerano scrivendo in `prototipo/`. Problema preesistente, da ticket a parte.
- L'articolo, righe 15.000 e 20.000: aggiungere il bonus cuneo sulla tredicesima
  (circ. 4/2025). Deciso: si corregge in questo branch.
