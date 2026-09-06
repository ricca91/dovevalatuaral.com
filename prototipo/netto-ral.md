# Netto → RAL

`netto-ral.html` cerca la RAL indicativa da chiedere a partire dalla media netta
mensile desiderata su 13 mensilità. Le assunzioni di calcolo sono fisse: dipendente
privato FPLD ordinario, Milano (`F205`), anno completo, nessun familiare a carico
e nessun benefit.

`netto-ral.js` riusa `calcola()` e `applicaMensilita()` da `motore.js`. Confronta
in centesimi il netto annuo con il target mensile moltiplicato per 13 e percorre
la griglia crescente di 100 €: il primo candidato valido è quindi preservato
anche in presenza dei salti del netto. Nel browser la scansione cede il controllo
fra blocchi; il limite resta la RAL massima di 1.000.000 € del calcolatore.

La CTA apre `index.html` con RAL trovata, 13 mensilità, Milano e `calc=1`. I test
del contratto sono in `netto-ral.test.js`; SEO e sitemap restano coperti da
`seo.test.js` e dal generatore `genera-pagine-ral.js`.
