# RIC-74 — verifica del blog

Verificato il 21 settembre 2026.

Preview: https://dovevalatuaral-brjf6kouk-riccardosartori-outlookcoms-projects.vercel.app

La preview usa una copia isolata del prodotto e la fixture tecnica
`processo/fixtures/articolo-demo.md` con stato pubblicato. Una seconda copia,
`bozza-demo.md`, resta in bozza. Non sono articoli editoriali: nessuna delle due
fixture viene aggiunta a `prototipo/articoli/` nel repository o alla produzione.
Il branch genera l’indice vuoto fino al primo articolo pubblicato.

## Verifiche eseguite

- Build Node e build remota Vercel riuscite, output `dist/`.
- Suite completa `npm test`: 350 test passati, zero errori (46 suite).
  Include 11 prove dedicate del parser/generatore/build.
- `node --check` sui nuovi moduli e `git diff --check` riusciti; nessun lint configurato.
- Desktop 1440×1000 e mobile 390×844, screenshot aperti e ispezionati.
- Menu mobile aperto e link Blog seguito fino all’indice.
- Articolo: titolo, data pubblicazione, aggiornamento e verifica fonti visibili;
  tabella, liste, citazione, codice inline, fonti e una sola CTA presenti.
- Nessun overflow orizzontale della pagina; tabella in contenitore scorrevole.
- Indice con un articolo e navigazione per cluster.
- HTTP 200: `/`, `/blog/`, `/blog/articolo-demo/`, `/sitemap.xml`,
  `/ral-30000-netto/`, `/confronti-ral/`.
- HTTP 404: `/blog/bozza-demo/`, `/articoli/bozza-demo.md`,
  `/articoli/articolo-demo.md`. Sorgenti non scaricabili.
- Sitemap unica: articolo presente, bozza assente e lastmod 2026-09-22.
- Handler `/api/risultato` raggiungibile (400 senza parametri, come previsto).

Screenshot: [articolo desktop](articolo-desktop.png), [articolo mobile](articolo-mobile.png),
[indice desktop](indice-desktop.png), [indice mobile](indice-mobile.png).

## Confini

Verificata la preview, non una pubblicazione sul dominio di produzione.
Indicizzazione Google e aggiornamento della produzione richiedono il deploy live;
la build non verifica le affermazioni normative o la vigenza delle fonti esterne.
Le date editoriali non pianificano l’uscita: serve stato pubblicato e nuovo deploy.
