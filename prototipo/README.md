# Dove va la tua RAL — calcolatore netto 2026

Una pagina che risponde a una domanda sola: di una retribuzione annua lorda, quanto resta
in tasca, dove finisce il resto e perché.

Si inserisce la RAL, si sceglie il domicilio fiscale con tre controlli dipendenti
(**regione → provincia → comune**) e si dichiarano, se ci sono, i **familiari a carico**.
Il profilo resta dichiarato — regole 2026, settore privato, tempo indeterminato, anno
intero — mentre le addizionali coprono tutti i 7.894 comuni Istat attivi nello snapshot
del 21 febbraio 2026.

## I file

| File | Che cos'è |
|---|---|
| `index.html` | la pagina |
| `compara.html` | il confronto fra due offerte: modulo, tabella e controller |
| `compara.js` | le funzioni pure del confronto: normalizzazione, delta e codec dell'URL |
| `compara.test.js` | le prove dei contratti del confronto |
| `draftsman.css` | il design system delle pagine: token, componenti e caratteri incorporati |
| `come-ho-lavorato.html` | la nota di lavoro: perimetro, modello, verifica, limiti |
| `la-storia.html` | la storia: cosa è successo dopo la pubblicazione |
| `motore.js` | il calcolo, separato per poterlo provare fuori dal browser |
| `motore.test.js` | la matrice di prova |
| `ral-page.template.js` | il template canonico condiviso delle pagine RAL e dell’hub |
| `genera-pagine-ral.js` | il generatore deterministico delle 17 pagine RAL, dell’hub e della sitemap |
| `ccnl-livello.html` | il generatore da CCNL e livello a RAL e netto: nessun campo RAL in ingresso |
| `retribuzione-ccnl.js` | il dataset retributivo dei due CCNL coperti e `componiRal()`, la sola funzione che ne produce un numero |
| `retribuzione-ccnl.test.js` | le prove del dataset, degli scatti, del part-time e del contratto della pagina |
| `ccnl-livello.md` | che cosa fa quella pagina e quali decisioni il dataset incorpora |
| `../processo/fonti-ccnl-2026.md` | da dove viene ogni numero contrattuale, e che cosa resta dichiarato come limite |
| `righe.js` | l'adapter che trasforma ogni Voce in una Riga |
| `righe.test.js` | le prove della seam Voce → Riga |
| `sezioni.js` | i riepiloghi delle due sezioni facoltative del modulo, e quali partono aperte |
| `sezioni.test.js` | le prove di quei riepiloghi |
| `nucleo.js` | il codec dei familiari, condiviso fra la home e il confronto |
| `fonti.js` | il catalogo delle fonti normative usato da pagina e adapter |
| `geografia.js` | la piccola interface per elenchi dipendenti e risoluzione per codice catastale |
| `dati-addizionali-2026.js` | lo snapshot runtime generato da Istat e MEF |
| `../processo/attrezzi/importa-addizionali.js` | l'import deterministico degli snapshot ufficiali |
| `../processo/verifica.md` | che cosa è provato, come, e che cosa non lo è |

## Come si apre

Doppio clic su `index.html`, tenendo `draftsman.css`, `motore.js`, `righe.js`, `sezioni.js`,
`nucleo.js`, `compara.js`, `ccnl.js` e `fonti.js` nella stessa cartella. Il confronto è
`compara.html`, e vuole accanto gli stessi file meno `sezioni.js` e `ccnl.js`. Il generatore
da CCNL e livello è `ccnl-livello.html`, che vuole accanto `motore.js`, `geografia.js`,
`dati-addizionali-2026.js`, `retribuzione-ccnl.js` e `site-nav.js`. Nessuna dipendenza, nessun passo di build, nessuna richiesta di rete:
Archivo, Instrument Sans e JetBrains Mono sono incorporati in `draftsman.css`, quindi le
pagine funzionano anche offline.

Le pagine — `index.html`, `compara.html`, `come-ho-lavorato.html` e `la-storia.html` — condividono
`draftsman.css` invece di portare ciascuna la propria copia dei caratteri: 232 KB una volta
sola contro i 480 KB che prima erano triplicati. Il prezzo è che `come-ho-lavorato.html` e
`la-storia.html` non sono più apribili da sole: vogliono `draftsman.css` accanto. Un `<link>`
si carica anche da `file://`, a differenza dei moduli ES.

L'aspetto è **Draftsman**, il design system in
`resources/design-systems/greptile-inspired-design-system`: raggio zero e angoli smussati,
hairline tratteggiate, etichette mono fra parentesi, ombre a offset duro e **una sola sezione
inchiostro per pagina** — il flusso del denaro nel calcolatore, il modello nella nota di
lavoro, la coda nella storia.

Il prototipo usa-e-getta del feedback visivo del pulsante **Calcola** si apre con
`prototype-ral-feedback.html?variant=A`. Le varianti A, B e C si cambiano dalla barra
in basso o con le frecce della tastiera.

Il motore è uno script classico e non un modulo ES proprio per questo: i moduli non si
caricano da `file://`, gli script classici sì.

Lo stato sta nell'URL (`?ral=&m=&c=&n=&calc=1`), incluso il codice catastale del comune e
il nucleo familiare, quindi ogni schermata è condivisibile. Il parametro `n` porta un
familiare per token — `c` coniuge, `f22` figlio di 22 anni, `a` ascendente convivente,
`f35d` con disabilità accertata, `f22r1500` con il suo reddito — e **non compare** se non
c'è nessun familiare dichiarato:
senza nucleo la query string è quella di prima.

## Come si provano i numeri

Per ricreare tutte le pagine RAL, l’hub “Confronti RAL” e la sitemap a partire dal
template e dal motore:

```
node prototipo/genera-pagine-ral.js
```

Gli HTML nelle directory `ral-XXXXX-netto/` e `confronti-ral/` sono output generati:
non vanno modificati a mano. Due esecuzioni consecutive producono gli stessi byte.

**Anche `sitemap.xml` è output generato**, quindi una pagina scritta a mano — `compara.html`
è la prima — non basta aggiungerla al file: va aggiunta a `PUBLIC_PAGES` dentro
`genera-pagine-ral.js`, altrimenti la prima esecuzione del generatore la toglie di nuovo.

```
node --test prototipo/*.test.js
```

Node 18 o successivo, zero dipendenze. Lo stesso file `motore.js` che gira nella pagina
gira in Node: nessuna logica duplicata fra pagina e prove.

Dettagli in [`processo/verifica.md`](../processo/verifica.md).

## Le tre scelte che spiegano la pagina

**1. La risposta prima di tutto, poi il resto in tre livelli.** Netto mensile grande e
subito; sotto, il flusso del denaro in scala; sotto ancora, la catena voce per voce con
formula, base di calcolo e fonte normativa di ogni riga. Chi vuole solo il numero si ferma
alla prima schermata; chi non si fida scende fino alla norma.

**2. Le soglie si mostrano, non si nascondono.** In alcuni punti un euro lordo in più fa
*scendere* il netto. `soglie({ comune })` separa gli eventi nazionali, regionali e
comunali e la FAQ usa sempre il comune selezionato. Per Milano, a 25.327,62 € di RAL
finisce l'esenzione comunale e il netto perde 184 € l'anno; un comune senza esenzione
non eredita quel gradino. È un'esenzione, non una franchigia.

**3. Ogni euro torna, per costruzione.** Il netto non è un totale calcolato a parte e poi
confrontato con le voci: **è** la somma delle voci arrotondate. La verifica gira a ogni
ricalcolo, non solo nelle prove, quindi la pagina non può mostrare una tabella che non
chiude.

## Il calcolo

Aritmetica decimale a virgola fissa su `BigInt`, scala 1e-8, mai virgola mobile binaria.
Tredici passi in ordine vincolante: contributi, imponibile, IRPEF lorda per scaglioni,
detrazioni con la capienza, IRPEF netta, addizionali — dovute solo se l'IRPEF netta è
positiva — e integrazioni di legge. Troncamento a quattro decimali sui rapporti dell'art. 13
e su quelli dell'art. 12, dove la norma lo impone (art. 12 c. 4, art. 13 c. 6).

Versione delle regole: `regole-2026-v4`. Fonti primarie, tutte citate nella pagina:
leggi di bilancio 2025 e 2026, TUIR, circolari INPS, Istat e MEF. Le pubblicazioni
comunali 2026 si sovrappongono alla disciplina 2025 prorogata; ogni regola conserva
annualità, `asOf`, stato definitivo/provvisorio ed estremi disponibili della delibera.

Per rigenerare lo snapshot, dopo aver sostituito i quattro file ufficiali in
`processo/dati/fonti/`, eseguire:

```
node processo/attrezzi/importa-addizionali.js
```

L'input accetta RAL da 0 a **1.000.000 €**. Oltre, il calcolatore si ferma e lo dice:
il modello non è pensato per quelle cifre e restituire un numero preciso su un caso
fuori perimetro sarebbe peggio che non rispondere. Sopra **122.295 €** il risultato
compare con l'avviso che assume nessuna anzianità contributiva al 31 dicembre 1995 —
l'unico punto in cui la sola RAL non basta più.

`calcola()` restituisce soltanto il risultato annuale. Il selettore **12–16 mensilità**
passa quel risultato ad `applicaMensilita()`, che divide il netto annuo già calcolato.
È la dimostrazione a schermo di una tesi del modello — le mensilità sono presentazione,
non calcolo. Se richiedessero un ricalcolo, la pagina direbbe il contrario di quello che
afferma.

## Benefit e valore del pacchetto

`calcola(ral, { welfare, fringe, buoniPasto })` mantiene separati il denaro e i valori
spendibili. `welfare` è un importo annuo già qualificato come esente; `fringe` applica nel
2026 la soglia integrale di 1.000 €, elevata a 2.000 € in presenza di un figlio fiscalmente
a carico; `buoniPasto` porta `{ tipo, valoreUnitario, numero }`, con tipo `elettronici` o
`cartacei`. La quota oltre 8 € o 4 € per titolo è imponibile.

Il risultato conserva `kpi.nettoAnnuo` per compatibilità e lo espone anche come
`kpi.nettoInBusta`; aggiunge `benefitSpendibili`, `valorePacchetto` e la media mensile dei
buoni come puro dato di presentazione. Il valore nominale dei benefit non entra mai nel netto
come se fosse denaro libero.

## Il nucleo familiare

`calcola(ral, { comune, nucleo })` accetta un nucleo come lista di familiari —
`{ tipo: 'coniuge' | 'figlio' | 'ascendente', eta, disabilita, reddito }` — e ne emette **una Voce per
persona** (`detrfam1`, `detrfam2`, …), non una voce sola né una per tipo. È la scelta uscita
dal prototipo del [#35](https://github.com/ricca91/jethr-riccardosartori/issues/35): la
pagina deve poter dire *perché* una detrazione è zero, e per dirlo serve una riga per la
persona a cui non spetta.

Il motore emette un **codice** di esito — `spetta`, `assorbitaAssegnoUnico`,
`oltreTrentaAnni`, `etaNonDichiarata`, `familiareNonACarico`, `rapportoFuoriIntervallo` — e
la frase in italiano nasce in `righe.js`, che è dove vivono le parole. Ogni Riga porta anche
una `nota`: la stessa cosa della formula, in poche parole, per la colonna «perché» della
tabella del nucleo.

La **disabilità accertata** (art. 3 L. 104/1992) non è un importo: toglie il tetto dei
trent'anni della lett. c) e lascia formula, importo e soglia identici. Le fonti secondarie
citano 1.350 € per i figli disabili e una maggiorazione di 400 €: sul testo vigente non
esiste né l'uno né l'altra, e infatti il flag non porta nessuna costante in `K`. Serve però
anche alle regole locali — cinque regioni su otto lo guardano.

Otto giurisdizioni regionali e sei comuni cambiano l'**addizionale** in base ai figli a
carico, in tre forme distinte: una detrazione per figlio (Trento, Bolzano, Sardegna,
Campania, Piemonte, Puglia), un'aliquota diversa (Marche, Veneto) e — nei sei comuni
veronesi — una soglia di esenzione che sale di 10.000 € per ogni figlio oltre il minimo.
Per questo `calcolaAddizionale`, `addizionaleRegionale`, `addizionaleComunale` e
`detrazioneLocale` ricevono la famiglia come parametro opzionale in coda.

Due punti dell'art. 12 sono facili da sbagliare e sono provati apposta: la soglia dei figli
cresce di 15.000 € solo per i figli **che danno diritto** alla detrazione (un quindicenne non
la alza), e il comma 4 vuole che il rapporto si guardi *vero* per decidere se la detrazione
compete e *troncato a quattro decimali* per calcolarla.

Quando la capienza non basta, la quota usata si ripartisce **in proporzione** a quanto spetta
a ciascuno. È una convenzione di presentazione: l'art. 12 somma e sottrae, non alloca niente
a nessuno. Consumarle in fila direbbe che il primo dichiarato ha avuto tutto e l'ultimo
niente, che non è vero di nessuno.

`soglie({ comune: codiceCatastale, nucleo })` restituisce soltanto le discontinuità effettive:
ogni elemento dichiara `ambito` (`nazionale`, `regionale` o `comunale`), imponibile,
RAL, causa e variazione del netto. Le soglie normative sull'imponibile vengono convertite
nella prima RAL che le supera usando contributi e arrotondamenti del motore; i normali
cambi di scaglione progressivo, che modificano la pendenza ma non creano un salto, non
sono inclusi. Senza opzioni il default resta Milano per compatibilità. La cache è separata
per codice catastale e per nucleo dichiarato: le detrazioni di famiglia possono azzerare
l'IRPEF netta, e un salto che esiste per un contribuente solo può non esistere per una
famiglia — a Milano il gradino da 184 € dell'esenzione comunale sparisce con tre familiari
a carico, perché da entrambi i lati della soglia l'imposta è già zero.

## Il confronto fra due offerte

`compara.html` risponde a una domanda diversa da quella della home: non «quanto resta», ma
**«quanto cambia davvero per me con questa offerta?»**. Si arriva dal link nell'intestazione
della home, oppure dalla CTA **Confronta con un'offerta** che compare sotto un risultato
valido e porta nell'offerta A tutto lo scenario appena calcolato — comune, familiari e
benefit compresi. Se il modulo della home è stato toccato dopo il calcolo, la CTA chiede
prima di premere **Calcola**: trasferisce l'ultimo risultato valido, non quello che si sta
scrivendo.

A è il **lavoro attuale**, B la **nuova offerta**. Nessun punteggio, nessun vincitore:
denaro, benefit e tempo restano tre cose distinte, e il confronto non dice quale offerta
convenga.

### Che cosa calcola, e che cosa no

Il confronto **non contiene una sola formula fiscale**: chiama due volte lo stesso
`calcola()` della home e sottrae. Quello che aggiunge sono quattro identità, tutte
verificabili a mano:

```
costiAnnui        = (trasportoMensile + altreSpeseMensili) × 12
nettoDopoCosti    = kpi.nettoInBusta − costiAnnui          (può essere negativo)
oreViaggioAnnue   = giorniPresenzaMese × 12 × minutiViaggio ÷ 60
delta             = B − A, sempre in questo ordine
```

**Costi, giorni in presenza e numero di buoni pasto si dichiarano al mese**; welfare, fringe
e RAL restano annui. È il modo in cui una
persona conosce le proprie spese — un abbonamento, un pieno, i giorni in ufficio di un mese
tipo — mentre l'equivalente annuo è un conto da fare a mente prima di scrivere. La
moltiplicazione per dodici avviene in un posto solo, su centesimi interi, quindi non lascia
in giro mezzo centesimo; la tabella resta annua come il resto della pagina, con le sue righe
`/ 12` accanto.

I **buoni pasto** sono l'unico campo mensile che accetta i decimali, e per una ragione sola:
220 buoni l'anno — il caso più comune che arriva dalla home — sono 18,33 al mese, e nessun
intero li rappresenta. Arrotondare a 18 ne perderebbe quattro all'anno. Chi compila a mano
scrive `20` e resta `20`; la media con la virgola compare solo quando serve a non perdere
niente per strada. Al motore arriva comunque un intero — il conto annuo — e il giro completo
è esatto: `perMese()` e `perAnno()` si annullano a vicenda per ogni valore annuo, e c'è una
prova che le esercita una per una da 0 a 3.000.

Tre regole che la tabella non viola mai:

1. **I benefit non sono denaro.** Welfare e buoni pasto compaiono nella loro riga e nel
   valore nominale del pacchetto, ma non vengono mai sommati al denaro dopo i costi.
2. **Le mensilità non sono un aumento.** Un netto diviso per 13 e uno diviso per 14 non
   stanno sulla stessa scala: la riga della media mostra i due divisori e **omette il
   delta**. Per confrontare c'è la riga «Netto annuo / 12».
3. **Il tempo non si monetizza, e vuoto non è zero.** Costi lasciati vuoti valgono zero;
   ore, giorni e minuti lasciati vuoti restano **non dichiarati**. Nessuna stima automatica di
   affitto, ferie, settimane lavorate o costi chilometrici, e i giorni in presenza non
   determinano il numero di buoni pasto.

Gli importi derivati e i delta vivono in **centesimi interi**. La media mensile di una
differenza nasce dal delta annuo diviso per 12, non dalla sottrazione di due medie già
arrotondate: su 1.200 € l'anno la seconda strada darebbe 99,99 € o 100,01 € a caso.

Gli avvisi del motore — compreso quello sopra il massimale contributivo di 122.295 € —
sono riportati per ciascuno scenario. Il confronto resta una stima con le regole 2026, non
una previsione del cedolino.

### Lo stato nell'URL

`compara.html` mette lo stato nel **fragment**, non nella query string: `#v=1&...`. È la
differenza che conta per la riservatezza — la query string viaggia fino al server, il
fragment no — e vale anche per il passaggio dalla home al confronto. Il link **non è
cifratura**: chi lo riceve legge tutti i dati, familiari inclusi, e la pagina lo dice
accanto al pulsante di copia. Niente `localStorage`, nessun analytics.

Lo schema è versionato. `v=1` porta, per ciascuna offerta, i parametri della home con il
prefisso `a.` o `b.` — meno il CCNL — più i cinque campi che la home non conosce:

| Parametro | Che cos'è | Quando compare |
|---|---|---|
| `v` | versione dello schema, oggi `1` | sempre |
| `a.ral` `b.ral` | RAL annua, come è stata scritta | sempre |
| `a.m` `b.m` | mensilità, 12–16 | sempre |
| `a.c` `b.c` | codice catastale del comune | sempre |
| `a.n` `b.n` | nucleo familiare, stesso codec della home | se dichiarato |
| `a.w` `b.w` · `a.f` `b.f` | welfare e fringe annui | se valorizzati |
| `a.bt` `b.bt` · `a.bv` `b.bv` · `a.bnm` `b.bnm` | buoni: tipo, valore unitario, numero **al mese** | se valorizzati |
| `a.trm` `b.trm` · `a.asm` `b.asm` | trasporto e altre spese **al mese** | se valorizzati |
| `a.ore` `b.ore` · `a.ggm` `b.ggm` · `a.min` `b.min` | ore settimanali, giorni in presenza **al mese**, minuti al giorno | se dichiarati |

La `m` finale di `trm`, `asm`, `ggm` e `bnm` non è decorazione. Quei quattro campi sono stati
annui in una versione precedente dello schema, e un nome uguale con un'unità diversa farebbe rileggere
«1.200 all'anno» come «1.200 al mese». Col nome nuovo un link vecchio lascia il campo vuoto —
non dichiarato, mai un numero sbagliato.

Il fragment porta **gli input, mai i risultati**: alla riapertura si ricalcola. Un valore
che questa pagina non potrebbe mai produrre — un comune inesistente, una mensilità fuori
elenco, un nucleo che non si riserializza identico — non viene «corretto» in silenzio:
rende il link non leggibile, la pagina lo dice e lascia un modulo vuoto e utilizzabile.
Gli importi restano invece testo grezzo, così un numero sbagliato diventa un errore di
campo che si corregge a mano. Il formato degli URL della home **non cambia**.

### Limiti dichiarati del confronto

- Nessuna deduzione su quale offerta convenga: la pagina mostra numeri distinti, non un
  punteggio.
- I costi sono quelli **dichiarati da chi compila**: il confronto non sa se una spesa è
  stata contata due volte, e non verifica niente. I dodici mesi sono presi tali e quali,
  senza tredicesime di spesa, mesi di ferie o stagionalità.
- Fuori perimetro come nella home: TFR, costo azienda, bonus e MBO, previdenza
  complementare, altri redditi, benchmark salariali.
- **Niente selettore CCNL, per scelta.** Sulla home il contratto collettivo esiste per
  suggerire le mensilità, e non tocca né il regime contributivo né una singola aliquota.
  Sul confronto le mensilità sono già un campo esplicito per ciascuna offerta: un secondo
  controllo che muove il primo, e non muove nessun numero, sarebbe solo rumore in un modulo
  che ne ha due affiancati. Il CCNL non entra quindi nemmeno nel fragment, e un link che lo
  portasse comunque viene letto ignorandolo.

## Come si pubblica

La demo è un deploy statico senza passo di build. Il comando va eseguito dalla root del
repository, così Vercel applica `vercel.json` (incluso il redirect del dominio legacy):

```
vercel deploy --prod
```

Il progetto Vercel si chiama `dovevalatuaral.com` e risponde su **https://www.dovevalatuaral.com**.
Il vecchio hostname `jethr.riccsartori.com` reindirizza permanentemente al nuovo dominio.

Il deploy parte dalla riga di comando, non da un push: il repo **non** è collegato a
Vercel. `git push` aggiorna GitHub e lascia la demo com'era. Se una copia nuova del repo
non è ancora agganciata al progetto, la si aggancia una volta sola:

```
vercel link --yes --project dovevalatuaral.com
```
