# Verifica — calcolatore della tredicesima

Data: 2026-09-24 · Branch: `calcolo-13esima` · Ticket: RIC-76

## Screenshot

Server di anteprima `npm run dev` (porta 4182), catturati con
`chrome-headless-shell` di Playwright (`--window-size=375,2600` e `1440,2600`).
`google-chrome --headless=new` non va bene per il mobile: impone una larghezza
minima di 500 px, e a 375 restituisce un ritaglio di un layout da 500.

| File | URL | Cosa mostra |
|---|---|---|
| `vuoto-375.png`, `vuoto-1440.png` | `/calcolo-tredicesima/` | form vuoto, FAQ, fonti; nessun risultato |
| `risultato-40000-375.png`, `…-1440.png` | `?ral=40000` | netta 2.095,57 €, contributo aggiuntivo 1% 14,69 €, IRPEF su due scaglioni; detassata 0 € |
| `detassata-15000-375.png`, `…-1440.png` | `?ral=15000` | netta 862,34 €, bonus cuneo +55,53 €, risparmio con la proposta 83,83 € |
| `lordo-8-mesi-375.png`, `…-1440.png` | `?lordo=2300&mesi=8` | lorda 1.533,33 € in ratei, nota "stima su 13 mensilità", bonus cuneo 4,8% |

Controllato a occhio: risultato visibile, righe leggibili a 375 px, nessun
overflow orizzontale, riquadro "Proposta, non legge" presente, menu a hamburger
su mobile. Lo stato di errore non si raggiunge da URL (per scelta, una query non
valida lascia la pagina vuota): è coperto dai test di `normalizza`.

## Test

`npm test` → 493 test, 493 pass, 0 fail. Comprende `tredicesima.test.js` (14),
`calcolo-tredicesima.test.js` (7) e i 3 test di `genera-articoli` che fallivano
dal commit del link nell'articolo.

`node processo/attrezzi/build.cjs` → `dist/calcolo-tredicesima/index.html` e
`dist/tredicesima.js` presenti, `dist/tredicesima.test.js` assente.

## Solo il deploy live può confermare

- indicizzazione della pagina e presenza in Search Console dalla sitemap
- rich results FAQ (Rich Results Test sull'URL di produzione)
- evento GA4 `tredicesima_calcolata` con parametro `modalita`
- resa su dispositivi reali (qui solo Chromium headless)
