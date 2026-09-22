# Il registro delle decisioni

Come sono arrivato alla pagina. Serve a orientarsi: il dettaglio vive nei ticket, questo è
l'indice.

## Il metodo, in tre righe

Una **domanda per ticket**. Ogni ticket si chiude con un **commento di risoluzione** che fissa
una decisione e la motiva. La [mappa #1](https://github.com/ricca91/jethr-riccardosartori/issues/1)
tiene insieme destinazione, vincoli e l'elenco delle decisioni prese.

Il punto non è la burocrazia: è che le domande difficili di questo dominio — quale aliquota,
quale arrotondamento, quale prova basta — si decidono meglio prima di scrivere il codice che
dentro il codice. Quando ho iniziato a costruire, erano già chiuse per iscritto.

## Gli otto ticket

| # | La domanda | La decisione, in una riga |
|---|---|---|
| [1](https://github.com/ricca91/jethr-riccardosartori/issues/1) | La mappa | Destinazione, vincoli e indice delle decisioni. Ridisegnata a metà strada: da «una specifica pronta per i ticket di build» a «la pagina finita» |
| [2](https://github.com/ricca91/jethr-riccardosartori/issues/2) | Quali regole compongono il netto nel 2026? | Quattro trattenute, due detrazioni, due integrazioni di legge. Otto affermazioni verificate su fonti primarie: sette confermate, una corretta |
| [3](https://github.com/ricca91/jethr-riccardosartori/issues/3) | Quali pattern dei calcolatori esistenti adottare o superare? | Progressive disclosure con la RAL come unico input, flusso del denaro in scala, dettaglio riconciliabile. Il distintivo realistico è la comprensibilità, non l'estensione del calcolo |
| [4](https://github.com/ricca91/jethr-riccardosartori/issues/4) | Qual è il contratto di calcolo? | Tredici passi in ordine vincolante, aritmetica decimale, netto = somma delle voci arrotondate, troncamento a 4 decimali solo dove la norma lo impone. Sette salti e quattro cambi di pendenza esposti come fatti |
| [5](https://github.com/ricca91/jethr-riccardosartori/issues/5) | Quale esperienza rende comprensibile il passaggio? | Cinque sezioni impilate con barra di ancore, non schede. Il 12/13 si applica senza ricalcolare. Nessun avviso di soglia a schermo: le soglie restano nel motore e nelle FAQ |
| [6](https://github.com/ricca91/jethr-riccardosartori/issues/6) | Quale prova di correttezza basta? | Tre categorie **etichettate per ciò che provano**, perché riconciliazione e golden file *non* provano la correttezza. Il valore canonico a RAL 35.000 è **26.032,17** |
| [7](https://github.com/ricca91/jethr-riccardosartori/issues/7) | Come confezionare la specifica in ticket di build? | **Chiuso senza risolverlo**: nessun passaggio di consegne, quindi la specifica non ha lettori. È questa esclusione a ridisegnare la destinazione della mappa |
| [9](https://github.com/ricca91/jethr-riccardosartori/issues/9) | Quale stack regge la pagina? | Si rifinisce l'HTML esistente: nessun framework, nessun bundler, nessuna dipendenza. Il motore esce in un file a parte per poterlo provare fuori dal browser |

*(#8 non è un ticket: è la pull request che corregge un riferimento INPS.)*

## L'errore che è rimasto scritto

Il ticket #4 impone due convenzioni di arrotondamento — troncamento a quattro decimali sui
rapporti dell'art. 13, netto come somma delle voci arrotondate — e poi, nella sua sezione
*Verifica*, cita numeri calcolati **senza** la regola che lui stesso impone. A RAL 35.000
scrive 26.032,22; il valore che nasce dal contratto è **26.032,17**.

Se ne è accorto #6, implementando. Le opzioni erano due: riscrivere #4 e far sparire l'errore,
oppure lasciarlo dov'era e dichiarare l'errata. Ho scelto la seconda, e ne è uscita una regola
vincolante:

> I valori attesi si **rigenerano dal motore**, non si ricopiano dai ticket a monte.

Vale anche per le sette soglie: ci sono tutte, con gli stessi importi, ma sei su sette cadono
uno o due centesimi più in alto delle posizioni annotate durante la ricerca. È il tipo di
scarto che, copiato dentro un test, boccerebbe un motore che funziona — e la reazione naturale
sarebbe "aggiustare" il motore, rompendolo.

Per questo, leggendo i ticket, **#6 vince su #4 e su #3 sui numeri**.

## Due cose che ho tolto invece di aggiungere

**La specifica di build (#7).** Sarebbe stato mezzo giorno su cinque per scrivere un documento
a un destinatario che non esiste: costruisce la stessa persona che ha fatto la mappa.

**Le impalcature esplorative.** Il prototipo aveva tre varianti di architettura
dell'informazione, un selettore per confrontarle e una finestra regolabile per gli avvisi di
soglia. Servivano a scegliere. Fatta la scelta, sono uscite dalla pagina: quello che resta è
una versione sola, senza interruttori che non interessano a chi legge.

## Tre decisioni prese dopo la chiusura dei ticket

Il registro si ferma dove finiscono i ticket, ma la pagina è andata avanti ancora un giro. Dove
il prodotto e il registro non coincidono più, comanda il prodotto — ed è scritto qui invece che
correggendo i ticket a posteriori.

**C'è un tetto all'input.** Il ticket [#4](https://github.com/ricca91/jethr-riccardosartori/issues/4)
lo escludeva: nessun limite, e una battuta sopra il milione. Ora il calcolatore si ferma a
**1.000.000 €**. Il motivo è lo stesso che regge tutto il resto: su cifre così il modello a
input unico non descrive più niente di reale, e un numero preciso su un caso fuori perimetro
è peggio di un rifiuto onesto. Lo spazio liberato dalla battuta è occupato da un avviso che
serve davvero — sopra **122.295 €** il risultato assume nessuna anzianità contributiva al
31 dicembre 1995, ed è l'unico punto in cui la sola RAL non basta.

**La riconciliazione non è più stampata a schermo.** Il ticket
[#3](https://github.com/ricca91/jethr-riccardosartori/issues/3) la elencava fra i pattern da
adottare, e per un po' la pagina mostrava la riga `RAL − contributi − imposte = netto`. È
uscita perché ripeteva ad alta voce quello che la tabella sopra già faceva vedere. **La guardia
resta dov'era utile**: `motore.js` calcola `riconciliazione.verificata` a ogni chiamata e le
prove la controllano. Quello che è sparito è la dimostrazione, non il controllo.

**C'è una nota di lavoro, e un easter egg.** `prototipo/come-ho-lavorato.html` racconta
perimetro, modello, verifica e limiti a chi apre la demo senza passare da questo repo — le
stesse cose che stanno qui, per un lettore che è arrivato dall'altra parte. L'easter egg si
apre su una RAL precisa, e chi conosce Jet HR sa già quale.

## Il nucleo familiare: quattro decisioni prese col prototipo (#35)

Il [#35](https://github.com/ricca91/jethr-riccardosartori/issues/35) lasciava aperta una domanda
che non si poteva decidere a tavolino: le detrazioni di famiglia diventano **una voce sola, una
per tipo di familiare, o una per persona?** Sono nate tre varianti dell'interfaccia sulla pagina
vera, commutabili con un parametro, e la scelta è arrivata guardandole.

**Una voce per persona.** Vince perché è l'unica forma in cui la pagina può dire *perché* una
detrazione è zero. Il figlio di diciassette anni ha la sua riga, con `0,00 €` e il motivo scritto
accanto: sotto i 21 anni la detrazione non esiste, è assorbita dall'Assegno Unico. Una voce sola
seppellirebbe quel fatto dentro una formula lunga; una voce per tipo lo direbbe di «i figli»,
non di quel figlio.

**Le righe stanno dentro il gruppo IRPEF, non in un gruppo loro.** Il prototipo le aveva messe
sotto un'intestazione «Carichi di famiglia», e il risultato era che la riga di totale «IRPEF
netta» finiva orfana, come se fosse il totale della famiglia. Sono detrazioni dell'imposta:
stanno dove stanno le altre.

**Il motore emette codici, non frasi.** `assorbitaAssegnoUnico` è un fatto; «sotto i 21 anni la
detrazione è assorbita dall'Assegno Unico» è un racconto. La separazione fra Voce e Riga di
`CONTEXT.md` regge anche qui: il primo esce da `motore.js`, il secondo nasce in `righe.js`.

**Il nucleo si dichiara e poi si preme Calcola**, come per la RAL e per il comune. Il prototipo
ricalcolava a ogni cifra digitata e si leggeva bene, ma metteva in pagina numeri live accanto a
una catena ferma. La pagina ha una tesi sola — quello che si vede viene tutto dallo stesso
calcolo, e quel calcolo chiude — e vale più di un clic risparmiato. Finché il risultato a schermo
non è stato calcolato per *quel* nucleo, le colonne «detrazione» e «perché» dicono `—`.

Il prototipo ha anche corretto due errori di merito prima che diventassero codice: la soglia dei
figli cresce solo per i figli **che danno diritto** alla detrazione, e i rapporti dell'art. 12
vanno **troncati a quattro decimali** come quelli dell'art. 13 (c. 4). Entrambi erano sbagliati
nelle formule scritte a memoria, ed entrambi ora hanno una prova.

## Le regole locali per la famiglia: tre meccanismi, non uno (#34)

Contare gli enti che nell'addizionale guardano i figli a carico è stato il lavoro, non
implementarli. Il conto è venuto leggendo i CSV MEF riga per riga, e due volte è risultato
diverso da quello scritto nel ticket.

**Le regioni sono otto, non sette.** All'elenco del ticket manca il **Veneto**, che applica
un'aliquota agevolata dello 0,9% a chi ha un familiare disabile fiscalmente a carico: stesso
meccanismo delle Marche, stessa soglia di 50.000 €.

**I comuni sono sei, non due.** Il ticket contava le righe del CSV 2026, ma il dataset usa anche
le righe 2025 prorogate per i 4.830 comuni senza delibera 2026 — e lì compaiono **Bovolone,
Negrar di Valpolicella, Roverè Veronese e Zevio**, con la stessa esenzione per numero di figli di
Bardolino e Bosco Chiesanuova. Contare la fonte invece del dato generato è il modo in cui si
perdono quattro comuni.

**Tre meccanismi restano tre.** Sei enti aggiungono una **detrazione** per figlio: sta nell'array
`detrazioni`, che sapeva già sommare importi, con una forma nuova (`perFiglio`) che porta i suoi
criteri come dati — importo, minimo di figli, età massima, limite di reddito del figlio,
supplemento per disabilità. Marche e Veneto cambiano l'**aliquota**: non è una detrazione e non
poteva starci dentro, perché sostituisce il calcolo dell'imposta invece di correggerlo. I sei
comuni cambiano l'**esenzione**: non è un importo ma una soglia che sale di 10.000 € per ogni
figlio oltre il minimo. Modellarli tutti e tre come «una detrazione» avrebbe dato numeri
plausibili e sbagliati.

**Il filtro sta dentro le funzioni, mai sull'input.** Il nucleo arriva intero, minorenni compresi.
L'art. 12 non dà niente ai figli sotto i 21 anni, ma la Sardegna vuole proprio i minorenni e i
comuni veronesi contano i figli senza limite d'età: filtrare all'ingresso renderebbe il dato
locale non più ricostruibile.

**Due comuni restano scoperti, e lo dicono.** Grottammare e San Benedetto del Tronto condizionano
l'esenzione all'**ISEE**, che dalla RAL non si ricava. Non c'è niente da normalizzare: la
condizione è scritta nel dataset, in `condizioniPersonali`, invece di sparire.

## La disabilità toglie un'età, non aggiunge un importo (#34)

Il ticket lasciava aperto «l'importo per i figli con disabilità», citando 1.350 € da fonti
secondarie. Sul testo vigente dell'art. 12 quell'importo **non esiste**, e non esiste più nemmeno
la maggiorazione di 400 € per handicap: la lett. c) dà 950 € «per ciascun figlio di età compresa
fra 21 e 30 anni, **ovvero** per ciascun figlio di età pari o superiore a 30 anni con disabilità
accertata». La disabilità entra solo nel predicato di ammissibilità — stessa formula, stesso
importo, stessa soglia — e infatti non ha portato con sé nessuna costante in `K`.

La conseguenza pratica è che il flag serviva comunque: cinque delle otto regioni e una delle due
aliquote agevolate lo guardano. Senza, metà del lavoro sulle regole locali sarebbe stato
irraggiungibile dalla pagina.

## Il pacchetto non è una RAL più larga (#26)

La RAL resta la componente monetaria. Welfare, fringe benefit e buoni pasto formano una
seconda somma, `benefitSpendibili`: il loro valore nominale non viene spacciato per denaro in
busta. Le sole quote imponibili si aggiungono alle basi previdenziale e fiscale e le relative
trattenute riducono il netto monetario. Il risultato espone quindi due identità: `nettoInBusta`
e `valorePacchetto = nettoInBusta + benefitSpendibili`.

`welfare` non prova l'esenzione. Un unico importo non porta categoria, destinatari e condizioni
del piano richieste dalle diverse lettere dell'art. 51: il prodotto lo nomina e lo presenta come
valore **già qualificato esente**. È un'assunzione dichiarata, non una verifica fiscale.

Il fringe usa una soglia secca: 1.000 €, oppure 2.000 € quando il nucleo dichiarato contiene
almeno un figlio fiscalmente a carico. I buoni usano invece una franchigia per titolo, 4 €
cartaceo e 8 € elettronico. Questa differenza resta visibile nelle Voce e nelle Riga, non solo
nel totale.

## Il CCNL diventa un ingresso, non un metro (RIC-54)

Il ticket era nato come confronto — *«la tua RAL sta sopra o sotto il minimo?»*. La domanda si
è rovesciata: **si entra da CCNL e livello e si esce con RAL e netto**, per chi legge in un
annuncio «inserimento al 4° livello» e non ha ancora un numero. La pagina non ha nessun campo
RAL: la RAL è ciò che esce.

Non è una semplificazione, alza l'asticella sui dati. In un confronto un minimo incompleto è un
metro storto: sbagli la percentuale. In un generatore quel numero entra nel motore e produce un
**netto sbagliato**, presentato con la stessa autorevolezza del golden. Da qui le quattro
decisioni che seguono.

**Le due forme del dato convivono, invece di normalizzarne una via.** Il Terziario pubblica la
riga scomposta *e* il totale; la Metalmeccanica un importo unico. Lo schema tiene entrambe. Il
totale non lo sommiamo noi: è pubblicato dal contratto, e una prova verifica che coincida con la
somma delle voci su tutte e 39 le righe. È una guardia sulla trascrizione, non una prova di
verità — la verità viene dal confronto a mano con la fonte firmataria.

**Base nazionale, con le esclusioni scritte a schermo.** Il terzo elemento è quello nazionale.
Le tabelle delle associazioni territoriali usano quello provinciale e danno totali più alti:
corrette lì, sbagliate come base nazionale. Presentare la base come «il minimo applicabile»
sarebbe stata la prima affermazione non citabile del prodotto, quindi l'elenco di ciò che il
numero non contiene fa parte del dataset e non della grafica.

**Le decorrenze stanno nel dato, non nella data di sistema.** Il Terziario ha tre tranche già
firmate e pubblicate: ci sono tutte, e la funzione che sceglie la vigente fa passare la pagina
alla tranche di novembre 2026 da sola. Le prove fissano una data invece di usare quella di
sistema, altrimenti cambierebbero risultato per conto loro.

**L'anzianità è quella in azienda, ma il numero di scatti resta dell'utente.** È l'anzianità di
servizio che entrambi i contratti misurano, non gli anni nel livello corrente. Chi ha avuto
passaggi di livello o servizio pregresso conosce il proprio numero meglio di quanto lo sappia
ricostruire una divisione: da qui il campo che lo sovrascrive. Anzianità non dichiarata significa
zero scatti, e la pagina lo scrive invece di lasciarlo intendere.

### Due cose che ho corretto durante il lavoro

- **«Da CCNL e livello gli scatti non si ricavano».** Lo avevo scritto, ed è falso: entrambi i
  contratti pubblicano il valore dello scatto per livello. Il risultato smette così di essere un
  pavimento teorico e diventa una stima ricostruibile interamente da dati contrattuali, che è la
  tesi del prodotto.
- **«L'elemento perequativo spetta a chi ha superminimo zero».** Anche questa è più grossolana
  del vero: i 485 € spettano a chi non ha contrattazione aziendale né superminimo individuale, e
  **in quota parte** a chi ha un superminimo annuo inferiore a quella cifra. Resta comunque fuori
  dal calcolo, perché dipende da fatti aziendali che il calcolatore non conosce.

### Il part-time è una funzionalità, non un limite da dichiarare

Lo avevo messo fra i possibili fuori perimetro. La ricerca sui volumi ha misurato domanda reale
sull'orario ridotto, e proprio sul Terziario — dove il part-time è la norma — assumere il tempo
pieno avrebbe reso il calcolatore poco utile a chi lo usa di più.

Il Metalmeccanica detta una regola propria: l'art. 4, sezione C dispone il trattamento
riproporzionato al tempo parziale. Per il Terziario resta l'art. 7 c. 2 del D.Lgs. 81/2015.
Gli scatti seguono la stessa proporzione. Il superminimo non si
riproporziona, perché è dichiarato già all'orario indicato: ridurlo lo conterebbe due volte.

E la cosa che è facile sbagliare: **il part-time riduce la retribuzione, non i giorni di
detrazione.** Un rapporto part-time su anno intero mantiene i 365 giorni ai fini dell'art. 13.
Il motore riceve una RAL e nient'altro, quindi non ha modo di sbagliare — la prova serve a
impedire che qualcuno gliene dia il modo.

## Il modello si allarga ai contratti veri, non ai contratti comodi (RIC-60)

Undici contratti nuovi, e le loro fonti hanno smontato l'identità `(base + scatti +
superminimo) × mensilità` su cui era costruito il RIC-54. Regge per il Turismo e gli Studi
professionali, non per la FIPE, che esclude gli scatti dalla quattordicesima, né per i
contratti che pagano l'EDR del 1992 su 13 mensilità dentro un anno da 14. Forzarli in quella
moltiplicazione avrebbe dato una RAL sbagliata di qualche centinaio di euro, presentata con
la stessa autorevolezza delle altre.

**Il modello si estende dove il dato lo impone, e da nessun'altra parte.** Sette estensioni,
ciascuna con un contratto reale che la richiede e una prova su un contratto inventato che la
isola: sezioni con tabelle, calendari, scatti e orari propri; incidenza di ogni voce sulle
mensilità; mensilità che dipendono dalla data; quattro famiglie di scatti; voci per profilo;
orario per contratto o sezione; totale pubblicato contro totale derivato. Il modello è una
funzione dei dati, `creaCatalogo()`, e nessuna regola conosce il nome di un contratto: il
gruppo 2 le riusa senza toccarle.

**H011 e C011 non si muovono, e una prova lo dice con i numeri.** Le RAL di ogni loro livello, a
ogni decorrenza, in tre casi, calcolate dal codice di prima e scritte per esteso. I conteggi
globali «due contratti» e «39 righe» sono spariti dalle prove: erano asserzioni sul perimetro,
non sulla correttezza.

**Dove il valore non si ricostruisce, il calcolo si ferma invece di stimarlo.** Gli scatti
degli impiegati Multiservizi valgono la tabella del giorno in cui maturano: prima del luglio
2021 le fonti non pubblicano quel valore, e con una data che li comprende il calcolo si ferma.
Gli scatti di Q e AS dei Grafici non sono pubblicati: il livello si sceglie, gli scatti no. Il
premio speciale del Vetro ha una base che nessuna fonte pubblica per i livelli attuali: è
fuori dalla RAL e scritto a schermo.

**Il refuso della fonte si registra con il suo importo, non si corregge in silenzio.** La
riconciliazione ha trovato quattordici totali stampati che non tornano con le voci accanto: il
Logistica F2 di 6 centesimi su ogni tranche, l'intera tabella non viaggiante di gennaio 2027,
che usa già il minimo di giugno, e il 7° dei Poligrafici, dove le fonti divergono di 10
centesimi. La RAL usa la somma delle voci; lo scarto sta nel dato con la sua spiegazione, e uno
scarto diverso fa cadere la prova.

**Una mensilità a metà entra nel motore.** `applicaMensilita()` accetta 13,5, perché è il numero
delle Cooperative sociali dal 2025, non una preferenza di presentazione. I selettori della home
restano sugli interi. È l'unica riga cambiata in `motore.js`, fuori dalle formule fiscali: le
2.001 corse del confronto non hanno una divergenza.

## Le pagine per livello seguono la domanda, non il dataset (RIC-59)

Il dataset ha 233 righe di livello su tredici contratti. Una pagina per riga sarebbe stata
facile e sbagliata: la maggior parte non ha una ricerca dietro, e duecento pagine quasi
identiche sono quello che Google chiama doorway. Quindi tre strati, con regole diverse:

- **Hub e una tabella per ciascuno dei tredici contratti.** La tabella ha sempre senso: la
  query «ccnl X» e «ccnl X tabelle retributive» esiste per tutti (da 50 a 27.100 al mese).
- **Pagine per livello solo dove il volume è misurato.** Commercio 2°–5° e i nove livelli
  metalmeccanici (ricerca del 6 settembre); Cooperative sociali (otto posizioni, fino a
  ~1.000/mese per D2 sommando le varianti), Studi professionali 2°, 3°, 4°, 4°S, Multiservizi
  1°–4°, Turismo 3°–6° (ricerca DataForSEO del 22 settembre). Confapi, DMO, Logistica,
  Grafici, Poligrafici, Vetro e FIPE per livello restano sotto le 30 ricerche al mese: niente
  pagina, per ora.
- **Il Turismo per livello mostra anche il FIPE.** «ccnl turismo 5 livello» lo scrive anche
  chi lavora in un bar, perché il FIPE si chiama «Pubblici esercizi… e turismo». Scegliere
  un contratto solo avrebbe dato la risposta sbagliata a metà dei lettori.

Slug sul modo in cui la gente scrive: `5-livello`, `livello-c3`, `livello-d2`. Nessuna pagina
porta «paga oraria», anche se Multiservizi e Turismo la cercano: il divisore orario di
ciascun contratto non è nel dataset, e inventarlo sarebbe il primo numero non citabile.

I numeri non vivono nelle pagine: escono da `componiRal()` e dal motore alla data della
build. Un solo scrittore del sitemap (`genera-pagine-ral.js`) raccoglie RAL, CCNL e blog.

## Il blog si pubblica da solo, ma solo se passa cinque cancelli

Il piano editoriale a 90 giorni è una promessa che nessuno mantiene a mano: novanta mattine
di seguito non le fa nessuno. Da qui `processo/cron/articolo-quotidiano/`, che alle 06:30
scrive l'articolo del giorno e lo pusha su `main`.

Le tre decisioni che contano.

**Push diretto su main, non una pull request.** Una PR ogni mattina non è automazione: è
novanta click. E l'agente che apre la PR non può mergiarla, quindi la PR sarebbe comunque
un lavoro che resta a Riccardo. Il rischio — un articolo brutto che va online da solo — è
contenuto dalla soglia: sotto 90/90 l'articolo resta `stato: bozza`, e `genera-articoli.js`
già filtra le bozze fuori dalla build. Per pubblicare una schifezza servirebbe che l'audit
le desse 90 su 100, e in quel caso il problema è l'audit.

**Il runner è deterministico, l'agente è creativo.** Commit, push, test, build e invio mail
non sono dell'agente: sono di `run.sh`. Il motivo è una regola già pagata da `daily-x-drafts`
(otto mail duplicate in otto mattine): un modello non può riferire l'esito di un'azione che
non ha ancora compiuto. Se fosse lui a mandare la mail, la mail direbbe "pubblicato" anche
dopo un push fallito. La skill è stata riscritta per fermarsi al report.

**La skill si invoca con la slash, non col tool Skill.** `disable-model-invocation: true`
su `seo-90-giorni` non è un intralcio da togliere: è ciò che impedisce a una sessione
interattiva di far partire una pubblicazione per sbaglio. Il flag resta, e il cron passa
da `claude -p "/seo-90-giorni …"`, che l'harness tratta come invocazione esplicita
dell'utente. Il flag è stato tolto solo a `seo-article` e `seo-audit`, che l'agente deve
poter chiamare dall'interno del loop.

**Allowlist esplicita, non `bypassPermissions`.** Un agente che ogni notte pusha su main
merita di poter toccare l'MCP Airtable, DataForSEO, i file degli articoli e `npm test` —
e nient'altro.

## Se un link di un ticket non porta da nessuna parte

I ticket sono stati scritti mentre il lavoro procedeva, quindi citano la repo **com'era in quel
momento**. Due cose sono cambiate alla consegna, e vale la pena saperlo prima di cliccare:

- **I percorsi.** I file stavano sotto `docs/`. Ora il prodotto è in `prototipo/` e il lavoro
  che c'è dietro in `processo/`. Le citazioni dentro i ticket non sono state riscritte: sono la
  fotografia di quando sono state prese le decisioni.
- **I rami di lavoro.** `prototype/ia-ral-netto` e `research/competitor-*` sono stati rimossi
  una volta uniti. I commit restano nella storia del repo.

Niente di quello che serve per valutare il lavoro sta in quei link: sta in questa cartella e in
`prototipo/`.

## Dove finisce il registro

Nel codice, in tre pull request:

- [#10](https://github.com/ricca91/jethr-riccardosartori/pull/10) — la rifinitura: motore
  estratto, matrice di prova, tre correzioni di accessibilità trovate aprendo davvero la pagina
  invece che leggendo il codice.
- [#11](https://github.com/ricca91/jethr-riccardosartori/pull/11) — la porta d'ingresso, e la
  correzione della fonte INPS: i valori del massimale erano giusti, la circolare citata no.
- [#12](https://github.com/ricca91/jethr-riccardosartori/pull/12) — la struttura attuale della
  repo e il curriculum.
