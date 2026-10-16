# RIC-102 — tredicesima 2026

Verifica del 16 ottobre 2026.

## Controllo preliminare RIC-89

Linear: Done, PR #78. Nel main sono presenti la distinzione fra somma esente e
ulteriore detrazione sopra 20.000 €, il rapporto al periodo lavorato e il conguaglio.
Il test editoriale esistente verifica anche gli esempi numerici. Nessuna modifica al motore.

## Fonti delle date

- Commercio Confcommercio H011: [testo CCNL, art. 220](https://www.confcommercio.it/documents/20126/3213306/Testo%20CCNL%202019.pdf/6d0afa9a-89c1-ce34-969c-577393206bc7?version=1.0).
  PDF scaricato e testo letto: pagamento in coincidenza con la vigilia di Natale,
  riportata come 24 dicembre 2026.
- Metalmeccanico industria C011: [testo Federmeccanica 2021, sez. IV, titolo IV, art. 7, p. PDF 178](https://www.federmeccanica.it/images/files/ccnl/CCNL2021-nostampa.pdf#page=178).
  PDF scaricato e testo letto: la corresponsione avviene **normalmente** alla vigilia.
  Conservata questa qualificazione. Il [rinnovo 22 novembre 2025](https://www.federmeccanica.it/relazioni-industriali/documenti-ccnl-22-novembre-2025.html)
  è pubblicato separatamente dal testo integrale.
- Turismo Federalberghi-Faita H052: [accordo 5 luglio 2024, art. 160, p. 45](https://intranet.federalberghi.it/pubblicazioni/Documenti%20Generali/ccnl%20turismo%20-%20ipotesi%20di%20accordo%205%20luglio%202024.pdf#page=45).
  Letta visivamente la pagina del PDF firmato sul sito della parte datoriale,
  oltre al testo della copia già archiviata nel repo: ricorrenze natalizie, nessun giorno fisso.
- Pubblici esercizi FIPE H05Y: [testo FIPE, art. 183](https://www.fipe.it/2025/03/10/area-lavoro/titolo-vi-trattamento-economico/).
  Testo letto sul sito firmatario: ricorrenze natalizie, nessun giorno fisso.

Le quattro pagine distinguono il termine contrattuale dalla data del bonifico;
non estendono queste regole a tutti i contratti dello stesso settore.
Le date di verifica generali delle fonti fiscali degli articoli non sono state avanzate:
la nuova verifica riguarda solo le date contrattuali.

## Evidenze

- Test title: prima 7/8, dopo 8/8; nuovo limite sotto 60 caratteri (title finale: 44).
- Test quattro pagine/date/fonti: prima 2/3, dopo 3/3.
- `npm test`: 567 passati, 0 falliti.
- `npm run build`: completata.
- Browser Chromium headless: quattro pagine a 390 e 1440 px, nessun overflow
  della pagina; tabelle presenti e fonti visibili. Controllati screenshot.
- Calcolatore in browser: `?ral=30000` mostra 1.613,62 €.

## Dopo il merge (non eseguito)

Il merge è riservato a Riccardo. Nessun deploy di produzione manuale.

1. Confermare sul dominio pubblico i quattro title, tabelle e fonti e la sitemap.
2. In Search Console, Ispezione URL → Testa URL pubblicato → Richiedi indicizzazione:
   - https://www.dovevalatuaral.com/calcolo-tredicesima/
   - https://www.dovevalatuaral.com/blog/tassazione-tredicesima/
   - https://www.dovevalatuaral.com/blog/tredicesima-detassata/
   - https://www.dovevalatuaral.com/blog/tredicesima-mensilita-quanto-arriva/
3. Registrare data ed esito delle richieste. La presenza nella sitemap non equivale
   a una richiesta d'indicizzazione né alla conferma che Google abbia indicizzato.

Il criterio «pubblicato e indicizzazione richiesta» resta aperto fino a questi passaggi.
