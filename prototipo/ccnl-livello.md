# CCNL e livello → RAL

`ccnl-livello.html` parte da contratto e livello di inquadramento e arriva a RAL
e netto. **Non c'è nessun campo RAL**: qui la RAL è ciò che esce, per chi legge
in un annuncio «inserimento al 4° livello» e non ha ancora un numero.

Nel caso semplice la pagina rende visibile riga per riga questa identità:

```
RAL = (base mensile riproporzionata
       + scatti mensili riproporzionati
       + superminimo mensile dichiarato) × mensilità contrattuali
```

Regge per Terziario e Metalmeccanica e per altri contratti, non per tutti. Quando
una voce entra in meno mensilità delle altre — l'EDR del 1992 su 13 in un contratto
a 14, gli scatti esclusi dalla quattordicesima FIPE — la RAL è la somma di **quote
annue**, una per gruppo di incidenza, e la pagina le mostra una per una invece di
una moltiplicazione che sarebbe falsa:

```
RAL = Σ quota mensile riproporzionata × mensilità in cui quella quota entra
```

## Che cosa fa e che cosa non fa

`retribuzione-ccnl.js` porta il dataset e l'unica funzione che produce un
numero, `componiRal()`. Non contiene formule fiscali: la RAL composta entra in
`calcola()` di `motore.js` come qualsiasi altra, e `applicaMensilita()` la
divide per le mensilità del contratto. Il netto è quello del profilo standard —
dipendente privato, Milano (`F205`), anno intero, nessun familiare, nessun
benefit.

Copertura: diciannove CCNL privati, diciannove codici CNEL distinti. Terziario
Confcommercio (H011) e Metalmeccanica industria (C011) dal RIC-54; dal RIC-60
FIPE (H05Y), Turismo (H052), Agenzie di viaggi (H04Z), Logistica (I100),
Multiservizi (K511), Studi professionali (H442), Cooperative sociali (T151),
Distribuzione moderna (H008), PMI metalmeccanica Confapi (C018), Grafici editori
(G011), Poligrafici (G041), Vetro, lampade e display (B132); dal RIC-61 Area
meccanica artigiana (C030), Industria alimentare (E012), Chimico-farmaceutico
(B011), Gomma, cavi elettrici e plastica (B371), Credito ABI per aree
professionali e quadri direttivi (J241). Fonti, letture e limiti di ciascuno
stanno in `processo/fonti-ccnl-gruppo1.md` e nei dossier indicizzati da
`processo/fonti-ccnl-gruppo2.md`, che porta anche la matrice di copertura del
gruppo 2. Funzioni Centrali resta in `ccnl.js` per le
sole mensilità e fuori da qui, perché il motore applica aliquote del lavoro privato.

## Il modello: che cosa un contratto può dichiarare

Le regole girano su `creaCatalogo()`, una funzione dei dati: le stesse regole
servono il dataset vero e i contratti inventati di `retribuzione-ccnl-modello.test.js`.
Nessuna regola conosce il nome di un CCNL.

| Estensione | Nel dato | Chi la usa oggi |
|---|---|---|
| Sezioni con tabelle, calendari, scatti o orari propri | `sezioni: [{id, nome, descrizione, tabelle, oreSettimanali?, scatti?, codiciLivello?, esclusioni?}]` | FIPE, Turismo, Logistica, Multiservizi, Grafici editori, Vetro, Area meccanica, Alimentare; Credito ABI con `codiciLivello` per il tetto di scatti dei QD3–QD4 |
| Incidenza di una voce sulle mensilità | `voce.mensilita`, `scatti.mensilita` | EDR di Multiservizi, Logistica e Alimentare; scatti FIPE |
| Mensilità che dipendono dalla data | `mensilita: [{dal, mensilita}]` | Cooperative sociali: 13 fino al 2024, 13,5 dal 2025 |
| Famiglie di scatti | `scatti.tipo`: `cifraFissa`, `percentualeMaturazione` (finestre per data di maturazione), `quotaUnica` (dopo N anni), `assenti`; scatto `null` sul livello = non documentato | Multiservizi impiegati e operai; Grafici Q e AS non calcolabili; Chimico-farmaceutico senza scatti dal 2010 |
| Cadenza e decorrenza degli scatti | `scatti.primoDopoAnni` (default la cadenza), `scatti.decorre`: `meseSuccessivo` (default), `meseMaturazione`, `anniversario`; `scatti.sospensioni: [{dal, al, articolo}]`, periodi in cui l'anzianità non matura | Credito ABI: primo dopo 4 anni e poi ogni 3, dal primo del mese in cui matura, anzianità sospesa dal 1° gennaio 2013 al 31 luglio 2014 |
| Anzianità da cui vale il conto dalla data | `scatti.anzianitaDal: {data, motivo}` (default nessuna soglia): una data di anzianità precedente ferma il calcolo con il motivo, il numero di scatti dichiarato resta possibile entro il tetto; l'aiuto della data lo dice prima | Credito ABI, aree e QD1–QD2: dal 20 dicembre 1994, perché chi era in servizio al 19 dicembre 1994 conserva fino a 12 scatti con regole non modellate; nessuna soglia per i QD3–QD4, che contano dalla nomina |
| Voci per profilo | `livello.profili: [{id, nome, voce}]` | indennità professionali delle Cooperative sociali; quadri dell'olearia (Alimentare); funzioni direttive e tecnico del restauro senior (Area meccanica) |
| Orario per contratto o sezione | `oreSettimanali` | 39 Logistica, 38 Cooperative sociali, 37 Credito ABI, 36 Poligrafici e soffio del Vetro |
| Totale pubblicato contro derivato | `totalePubblicato`, `vociTotalePubblicato`, `discrepanzaFonte: {scarto, nota}` | ovunque; scarti registrati su Logistica e Poligrafici |

La sezione compare nella pagina solo dove il contratto ne ha; il profilo solo dove
il livello ne ha. Cambiare contratto o sezione ricostruisce livello, scatti e ore e
toglie il risultato.

## Le decisioni che il dataset incorpora

**Le due forme del dato convivono.** Il Terziario pubblica la riga scomposta e
il totale; la Metalmeccanica un importo unico. Lo schema tiene entrambe invece
di normalizzarne una via: `voci` è come il contratto stampa, `totale` è il
numero che il contratto dichiara. Non li sommiamo noi — li riconciliamo, e
`riconciliaLivello()` è provato su tutte le 1.517 righe del dataset (sezione × decorrenza ×
livello). Dove la fonte
stessa sbaglia la somma, lo scarto è registrato nel dato con il suo importo e la
RAL usa la somma delle voci; uno scarto diverso da quello registrato fa cadere la
prova. Dove la fonte non stampa un totale, il totale è derivato e lo si dice. È una
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

**L'anzianità è quella che il contratto misura**: in azienda quasi ovunque, nel
settore per gli operai Multiservizi, dopo i 18 anni nel Turismo — l'help lo dice
contratto per contratto. Il numero di scatti resta sovrascrivibile nelle
opzioni avanzate: passaggi di livello e servizio pregresso li conosce l'utente,
non una divisione. Anzianità non dichiarata significa zero scatti, e la pagina
lo scrive invece di lasciarlo intendere.

**Il part-time riduce la retribuzione, non i giorni.** Minimo e scatti si
riproporzionano sull'orario contrattuale di quel contratto o sezione, ogni quota
per conto suo; il superminimo no, perché è dichiarato
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

**Mensilità a metà.** Le Cooperative sociali hanno dal 2025 una quattordicesima
pari a mezza mensilità: 13,5. `applicaMensilita()` del motore accetta 13,5 oltre
agli interi; i selettori della home e del confronto restano sugli interi, quindi
il bottone verso il calcolatore completo porta la RAL giusta e una media su 13.

## Prove

`retribuzione-ccnl-modello.test.js` prova le estensioni su contratti
inventati, comprese le regole degli scatti del RIC-61 (primo scatto, decorrenza nel
mese, anzianità sospesa, soglia di anzianità) e la descrizione unica che ne danno la
pagina e le tabelle dei minimi. `retribuzione-ccnl.test.js` fissa H011 e C011 con le RAL calcolate
prima dell'estensione, la riconciliazione di ogni riga, l'integrazione con il
motore su ogni livello di ogni contratto e sezione, e il contratto della pagina.
`retribuzione-ccnl-gruppo1.test.js` ha le fixture dei nuovi contratti: importi
presi dalla fonte e scritti a mano, tempo pieno e part-time con il conto per
esteso, giorno prima ed esatto di ogni tranche, scatti ai confini. Il gruppo 2 ha
un file per contratto, `retribuzione-ccnl-gruppo2-<contratto>.test.js`, con gli aiuti
comuni in `prove-ccnl.js`, e `retribuzione-ccnl-gruppo2.test.js` per il gruppo
nell'insieme: codici, fonti archiviate, perimetro delle regole nuove. SEO e sitemap
restano coperti da `seo.test.js` e da `genera-pagine-ral.js`, dove la pagina è
registrata in `PUBLIC_PAGES`.

Le pagine SEO programmatiche — hub, tabelle per contratto e pagine per livello —
non sono qui: stanno in RIC-59, che dipende da questa pagina.
