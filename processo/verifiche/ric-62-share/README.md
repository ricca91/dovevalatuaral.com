# RIC-62 — Scontrino e condivisione rapida

> Resoconto storico della prima iterazione. Il menu nativo è stato sostituito
> dal selettore social con anteprima cliccabile: [verifica attuale](../ric-62-social/README.md).

13 settembre 2026. Follow-up richiesto da Riccardo: proposta 1, minimizzando
i passaggi fra risultato e pubblicazione. Aggiornamento della PR #54, nessun
merge o deploy di produzione. Checkout originale sporco lasciato intatto.

## Risultato

Scontrino PNG 1080×1350, generato localmente prima del click, con il punteggio
della run conclusa (non il record), invito e dominio. Un pulsante “Condividi”
apre direttamente il menu del dispositivo con PNG e testo/link, se supportati.
Nessun selettore formato, account, upload o download obbligatorio. Le alternative
rimangono chiuse nel percorso normale. Calcolo, generatori, versione e vecchi
link sono invariati.

## Verificato personalmente

- Suite Node: **332 pass, 0 fail, 0 skip**, 46 suite. Controllo sintattico e diff.
- Copione completo del gioco rieseguito: 22 corrette, errore, refresh nelle
  quattro fasi, oltre 100 round, sfide, Compara reale, storage, tastiera e offline.
- Copione dedicato in Chromium: PNG decodificato realmente, firma, MIME,
  dimensioni 1080×1350, file <1MB e contenuto della run corretti. File passato
  all'API in un solo click, con `navigator.userActivation.isActive === true`.
- Immagine identica dopo reload; download reale confrontato byte per byte.
- Browser senza file/canShare, senza Web Share, errore API, annullamento,
  Canvas/encoding/File indisponibili. Nessun effetto collaterale all'annullamento.
- Doppio click e share concorrente non aprono due menu; risoluzione tardiva
  di una condivisione non modifica la nuova run. Link ricevuto ricostruisce
  seed/target e prima offerta in un altro contesto browser.
- Mobile 375/390, desktop 1440, zoom CSS 200%, zero e singolare. Percorso
  reale di sconfitta a 375×667: “Condividi” visibile senza scroll aggiuntivo.
- Zero errori JavaScript/console nel copione dedicato. Analytics sostituita
  durante le prove: nessun dato di test inviato al tracker.

## Evidenze

- [PNG effettivamente condiviso](scontrino-12.png)
- [Finale mobile](risultato-mobile.png)
- [Finale desktop](risultato-desktop.png)
- [Schermo corto, CTA visibile](risultato-schermo-corto.png)
- [Punteggio zero](risultato-zero.png)
- [Alternative senza API nativa](alternative-mobile.png)
- [Zoom 200%](risultato-zoom-200.png)

## Limiti, non nascosti dai test

Il menu nativo e le risposte dell'API sono simulati; Canvas, PNG, input utente,
attivazione, DOM e download sono reali. L'ambiente headless non ha Instagram,
WhatsApp o gli account social: **non è stata effettuata né verificata una
pubblicazione reale**. Il successo della Promise non prova la pubblicazione.

Le app disponibili e l'eventuale scelta feed/storie sono del sistema operativo.
Alcune destinazioni ignorano testo/link allegati a un file. Il dominio stampato
resta visibile, ma non è cliccabile. I link social del fallback precompilano
testo/URL e non allegano il PNG. Nessuna promessa di post automatico su ogni social.

I link sfida restano canonical di produzione: prima del merge, per provare il
destinatario il copione conserva il fragment sulla preview. URL e verifica
HTTPS del nuovo deployment sono riportati nella PR.

## Ripetere

```sh
node --test prototipo/*.test.js
node processo/attrezzi/verifica-netto-o-niente-share.cjs /percorso/playwright-core ws://endpoint-cdp [URL-preview]
node processo/attrezzi/verifica-netto-o-niente.cjs /percorso/playwright-core ws://endpoint-cdp [URL-preview]
```

Skill agent-browser/agent-browser-verify usate per apertura e controllo del
browser; deployments-cicd per il percorso PR → preview, senza produzione.
