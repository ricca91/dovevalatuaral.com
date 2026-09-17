# pdf.js, copia locale

`pdf.min.mjs` e `pdf.worker.min.mjs` sono la build *legacy* di
[pdfjs-dist](https://github.com/mozilla/pdf.js) **6.3.289**, copiate senza modifiche dal
pacchetto npm `pdfjs-dist@6.3.289` (`legacy/build/`). Licenza Apache-2.0, in `LICENSE`.

Stanno qui dentro invece che su una CDN per una ragione sola: `busta-paga.html` promette
che il PDF non lascia il browser, e una pagina che lo promette non può aprire una
connessione a un terzo mentre lo fa. Nessuna richiesta esce dal dominio.

Per aggiornarla:

```
npm pack pdfjs-dist@<versione>
tar xzf pdfjs-dist-<versione>.tgz package/legacy/build/pdf.min.mjs package/legacy/build/pdf.worker.min.mjs package/LICENSE
cp package/legacy/build/pdf.min.mjs package/legacy/build/pdf.worker.min.mjs package/LICENSE prototipo/vendor/pdfjs/
```

La versione vale la pena tenerla recente: la 4.2.67 ha chiuso la CVE-2024-4367, che
permetteva a un PDF costruito apposta di eseguire JavaScript nella pagina che lo apre. Qui
il PDF arriva da chi visita il sito, quindi è input non fidato per definizione.
