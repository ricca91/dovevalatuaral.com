# RIC-62 — Anteprima cliccabile

13 settembre 2026. Follow-up alla PR #54: Condividi → LinkedIn, X, WhatsApp
o Telegram → conferma nel social. Nessun account aggiuntivo, download o upload
obbligatorio. Il PNG è l'anteprima del link, non un allegato fotografico.

## Verificato

- `npm test`: 339 pass, 0 fail, 0 skip, 46 suite. API GET/HEAD, errori,
  validazione stretta, origine fidata, HTML e PNG deterministici compresi.
- Regressione Chromium completa: gioco, ripristini, sfide, oltre 100 round,
  comparatore reale, storage, offline, tastiera e clipboard reale riletta.
- Copione social in Chromium: quattro destinazioni, popup reali intercettati
  prima di accedere ai social, copia e fallback, doppio click, Tab/Escape/focus.
- Risposta HTML con metadati OG/Twitter usando user-agent LinkedInBot,
  Twitterbot e WhatsApp; PNG decodificato 1200×630, sotto 1 MB.
- Pagina risultato senza JavaScript: immagine e CTA visibili. Accetta la sfida
  ricostruisce gli stessi confronti in un contesto browser nuovo.
- Richieste invalide, duplicate, aggiuntive e malevole rifiutate; POST 405,
  HEAD 200. Nessuna fiducia in Host forniti dal client.
- Canvas indisponibile non blocca i social; clipboard rifiutata e completata
  dopo una nuova partita gestite. Il punteggio condiviso è quello della run,
  non il record personale.
- 375×667, 390×844, 1440×900 e zoom CSS 200%: nessun overflow orizzontale,
  controlli almeno 44px. Screenshot mobile e landing controllati visivamente.
- Zero errori JavaScript/console nel copione. Analytics intercettata nei test;
  nessun seed, URL o profilo fiscale nei payload espliciti.

## Evidenze

- [Finestra mobile](finestra-mobile.png)
- [Schermo corto 375px](finestra-375.png)
- [Desktop](finestra-1440.png)
- [Zoom 200%](finestra-zoom-200.png)
- [PNG social effettivo](anteprima-social-12.png)
- [Pagina pubblica senza JavaScript](risultato-pubblico-mobile.png)

## Ripetere

```sh
npm ci
npm test
npm run dev
node processo/attrezzi/verifica-netto-o-niente-share.cjs /percorso/playwright-core ws://endpoint-cdp [URL-preview] [directory-evidenze]
```

Il server locale richiama gli stessi handler della preview Vercel. La verifica
HTTPS e il relativo URL vengono riportati nella PR. Solo preview, niente produzione.

## Limiti

I user-agent simulati non provano un crawl reale di LinkedIn/X/WhatsApp.
Non è stata eseguita alcuna pubblicazione da account social. Presenza, tempi,
cache e ritaglio della card dipendono dal social; non promettiamo post automatici.
Il server espone solo pagine e PNG pubblici, senza account o database. Il
punteggio è autodichiarato, non certificato. L'anteprima remota richiede rete.
