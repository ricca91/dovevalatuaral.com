# CCNL e livello → RAL

`ccnl-livello.html` parte da contratto e livello di inquadramento e arriva a RAL
e netto. **Non c'è nessun campo RAL**: qui la RAL è ciò che esce, per chi legge
in un annuncio «inserimento al 4° livello» e non ha ancora un numero.

L'identità che la pagina rende visibile riga per riga:

```
RAL = (base mensile riproporzionata
       + scatti mensili riproporzionati
       + superminimo mensile dichiarato) × mensilità contrattuali
```

## Che cosa fa e che cosa non fa

`retribuzione-ccnl.js` porta il dataset e l'unica funzione che produce un
numero, `componiRal()`. Non contiene formule fiscali: la RAL composta entra in
`calcola()` di `motore.js` come qualsiasi altra, e `applicaMensilita()` la
divide per le mensilità del contratto. Il netto è quello del profilo standard —
dipendente privato, Milano (`F205`), anno intero, nessun familiare, nessun
benefit.

Copertura: Terziario Confcommercio (H011) e Metalmeccanica industria (C011).
Funzioni Centrali resta in `ccnl.js` per le sole mensilità e fuori da qui,
perché il motore applica aliquote del lavoro privato.

## Le decisioni che il dataset incorpora

**Le due forme del dato convivono.** Il Terziario pubblica la riga scomposta e
il totale; la Metalmeccanica un importo unico. Lo schema tiene entrambe invece
di normalizzarne una via: `voci` è come il contratto stampa, `totale` è il
numero che il contratto dichiara. Non li sommiamo noi — li riconciliamo, e
`riconciliaLivello()` è provato su tutte e 39 le righe del dataset. È una
guardia sulla trascrizione, non una prova che i numeri siano quelli giusti:
quella viene dal confronto a mano con la fonte, in `processo/fonti-ccnl-2026.md`.

**Base nazionale, dichiarata come tale.** Il terzo elemento è quello nazionale.
Le tabelle territoriali usano quello provinciale e danno totali più alti: sono
corrette lì e sbagliate come base nazionale.

**Decorrenze nel dataset, non una fotografia.** Il Terziario ha tre tranche già
firmate; `tabellaVigente()` sceglie l'ultima non successiva alla data, quindi la
pagina passa da sola alla tranche di novembre 2026. La RAL è annualizzata a
condizioni costanti: non ricostruisce il reddito di un anno attraversato da una
tranche, e lo dice.

**L'anzianità è quella in azienda**, non nel livello corrente, perché è ciò che
entrambi i contratti misurano. Il numero di scatti resta sovrascrivibile nelle
opzioni avanzate: passaggi di livello e servizio pregresso li conosce l'utente,
non una divisione. Anzianità non dichiarata significa zero scatti, e la pagina
lo scrive invece di lasciarlo intendere.

**Il part-time riduce la retribuzione, non i giorni.** Minimo e scatti si
riproporzionano sull'orario contrattuale; il superminimo no, perché è dichiarato
già all'orario indicato. Un rapporto part-time su anno intero mantiene i 365
giorni ai fini dell'art. 13: è l'errore naturale da commettere, e una prova in
`retribuzione-ccnl.test.js` lo fissa mostrando che a parità di RAL il netto e la
detrazione non si muovono.

## Aritmetica

Gli importi contrattuali hanno due decimali e le somme devono tornare al
centesimo con il totale pubblicato. Il modulo lavora in centesimi interi e torna
in euro solo all'uscita — non serve il BigInt del motore, perché una RAL sta
larga dentro l'intero sicuro. La riproporzione avviene sull'importo **mensile** e
solo dopo si annualizza: un part-time al 50% non dà quindi esattamente metà
della RAL a tempo pieno, e la differenza è il mezzo centesimo per mensilità.

## Prove

`retribuzione-ccnl.test.js` copre dataset, decorrenze, scatti ai confini di
maturazione e di tetto, part-time, superminimo, l'integrazione con il motore su
ogni livello di entrambi i CCNL, e il contratto della pagina. SEO e sitemap
restano coperti da `seo.test.js` e da `genera-pagine-ral.js`, dove la pagina è
registrata in `PUBLIC_PAGES`.

Le pagine SEO programmatiche — hub, tabelle per contratto e pagine per livello —
non sono qui: stanno in RIC-59, che dipende da questa pagina.
