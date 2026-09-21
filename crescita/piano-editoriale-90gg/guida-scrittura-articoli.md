# Guida alla scrittura degli articoli — dovevalatuaral.com

_Scritta il 20 settembre 2026. Destinatario: l'agente (o la persona) che scrive un articolo
del piano editoriale a 90 giorni. Leggila per intero la prima volta; dopo basta la
[checklist finale](#12-checklist-prima-di-consegnare)._

> Questa guida dice **come** si scrive un articolo. **Cosa** scrivere, in che giorno, con
> quale keyword e quale angolo, sta nella tabella Airtable del piano editoriale. Una riga
> della tabella + questa guida = un articolo. Non serve altro.

---

## 1. Il lavoro in una riga

Prendi una riga della tabella, scrivi l'articolo che risponde alla query meglio di chiunque
altro nella SERP italiana, e fallo con **numeri che vengono dal motore di calcolo del sito**
e **fonti primarie con la data di verifica accanto**. Se non puoi fare queste due cose su un
pezzo di contenuto, quel pezzo non si scrive: si dichiara come non coperto.

---

## 2. Chi legge

Non un consulente del lavoro. Una persona che ha in mano una cifra — una RAL in un'offerta,
un netto in un cedolino — e non capisce come si passi dall'una all'altro. Di solito:

- ha appena ricevuto un'offerta e vuole sapere quanto le resta;
- ha aperto la busta paga e c'è una riga che non riconosce;
- ha visto lo stipendio più basso del solito e non sa se è normale;
- sta per chiedere un aumento e non sa quanto chiedere;
- confronta due lavori e i due numeri non sono confrontabili.

Ha fretta, legge sul telefono, e non ha nessuna intenzione di imparare il TUIR. Vuole il suo
numero e vuole sapere se può fidarsi.

**Conseguenza operativa:** la risposta sta nelle prime tre righe. Il resto dell'articolo serve
a chi vuole capire *perché*, e a Google. Mai costruire un articolo che tiene la risposta in
ostaggio fino al paragrafo sette.

---

## 3. La voce

Riccardo scrive in prima persona, in italiano piano, con frasi corte. Il modello di voce sta
in `la-storia.md`, `README.md` e `/root/ricc-os/context/voice.md`. I tratti che contano:

**Fai così**

- Frasi brevi. Un'idea per frase.
- Il numero esatto, sempre. `1.955 €`, non «quasi duemila euro».
- Parla della cosa, non del concetto della cosa. «Ti tolgono il 9,19%» batte «l'incidenza
  contributiva a carico del lavoratore».
- Ammetti i limiti dentro il testo, non in un disclaimer a fondo pagina. «Questo vale se sei
  dipendente privato a tempo pieno. Se sei in apprendistato il conto cambia, e qui non lo
  copro.»
- Quando una regola è assurda, dillo che è assurda. Non difendere il legislatore.
- Seconda persona singolare. «Il tuo netto», non «il netto del contribuente».

**Non fare così**

- Niente introduzioni che scaldano il motore. «Nel complesso panorama della fiscalità
  italiana…» → cancella e parti dalla risposta.
- Niente «in questo articolo vedremo». Vedilo e basta.
- Niente entusiasmo da blog aziendale, niente emoji, niente domande retoriche in apertura.
- Niente elenchi di tre per il gusto del ritmo.
- Niente «è importante sottolineare che», «vale la pena ricordare», «come ben sappiamo».
- Niente conclusioni che riassumono l'articolo. Chiudi con la cosa da fare, non con il riepilogo.
- Mai promettere consulenza. Non siamo consulenti del lavoro e lo diciamo.

**La regola madre:** la sciatteria può stare nella prosa, **mai nei numeri**. Un periodo
storto va bene. Un'aliquota sbagliata no.

---

## 4. Lo standard di verifica — la parte non negoziabile

Questo è il motivo per cui il sito esiste e l'unica cosa che i concorrenti fanno fatica a
copiare. Tre regole.

### 4.1 Ogni numero ha una provenienza, e la provenienza è di tre tipi soltanto

| Tipo | Come si scrive | Esempio |
|---|---|---|
| **Calcolato** dal motore del sito | Dichiara le ipotesi accanto al numero | «Su 30.000 € di RAL, dipendente privato, Milano, nessun familiare a carico, 13 mensilità: **1.680 € netti al mese**» |
| **Normativo**, da fonte primaria | Cita norma + link + data in cui l'hai verificata | «L'aliquota IVS a carico del lavoratore è 9,19% (INPS, circolare 101/2024 — verificata il 20/09/2026)» |
| **Stimato o riportato** da terzi | Dì che è una stima e di chi | «DataForSEO stima 5.400 ricerche mensili: è una stima del fornitore, non utenti unici» |

Se un numero non rientra in nessuna delle tre categorie, **non entra nell'articolo**.

### 4.2 I numeri di calcolo si producono con il motore, non a mano

Il motore sta in `prototipo/motore.js`. Per ottenere un netto:

```sh
cd /root/ricc-os/projects/dovevalatuaral.com
node -e "const {calcola}=require('./prototipo/motore.js'); const r=calcola('30000'); console.log(JSON.stringify(r.kpi,null,2))"
```

Per la media mensile su N mensilità usa `applicaMensilita(result, N)`. Per RAL derivate da
CCNL e livello c'è `componiRal()` in `prototipo/retribuzione-ccnl.js`.

**Mai calcolare a mente, mai fidarsi di un numero trovato su un altro sito, mai riusare un
numero da un articolo precedente senza rigenerarlo.** Se il motore cambia, gli articoli che
hanno rigenerato il numero restano allineati; quelli che l'hanno copiato no.

Se l'articolo ha bisogno di un numero che il motore **non** sa produrre (es. un settore con
aliquota contributiva diversa da FPLD ordinario), scrivi esplicitamente che il calcolatore
assume FPLD ordinario e che quel caso non è coperto. Non inventare l'aliquota.

### 4.3 Le fonti sono primarie e datate

Il catalogo delle fonti già verificate è in `prototipo/fonti.js`: Normattiva, INPS, TUIR,
Agenzia delle Entrate, siti di Regione e Comune. Usa quelle quando esistono.

Se ti serve una fonte nuova:

1. Risalire all'atto primario. Normattiva, Gazzetta Ufficiale, circolare INPS, provvedimento
   AdE. **Non** un articolo di un altro blog, **non** un riassunto giornalistico, **non** la
   pagina di un concorrente.
2. Verificare che sia la versione vigente per l'anno di cui parli.
3. Scrivere accanto la **data in cui l'hai aperta**.
4. Se non trovi la fonte primaria: l'affermazione esce dall'articolo. Non si scrive «secondo
   alcune fonti».

**Formato in pagina:** nome dell'atto + cosa dice + link + data di verifica. Esempio:

> Fonte: L. 199/2025, art. 1 c. 3 — scaglioni IRPEF 2026 al 23 / 33 / 43%
> ([Normattiva](https://www.normattiva.it/eli/stato/LEGGE/2025/12/30/199/CONSOLIDATED)) ·
> verificata il 20 settembre 2026

### 4.4 Quello che non sappiamo lo diciamo

Il silenzio dichiarato vale più del riempimento. Frasi legittime e incoraggiate:

- «Questo non lo copro.»
- «Il calcolatore assume FPLD ordinario: se il tuo settore ha un'aliquota diversa, il numero
  cambia e qui non lo stimo.»
- «Nessun consulente del lavoro ha validato questi numeri.»
- «Non posso dirti se la tua busta paga è sbagliata. Posso dirti quale riga guardare.»

Mai dire a un lettore che il suo cedolino è sbagliato. La formula è sempre **«potrebbe valere
la pena verificare»**, mai «il tuo datore ha sbagliato».

---

## 5. Struttura dell'articolo

Questa guida **non fissa H1/H2** — quelli li decide chi scrive, sulla base della query. Fissa
la forma.

```
[Risposta diretta]        3-5 righe. Il numero o la spiegazione, subito. Con le ipotesi.
[Il contesto minimo]      Perché quel numero è quello. Corto.
[Il corpo]                2-5 sezioni. Una domanda per sezione.
[Il caso concreto]        Almeno un esempio numerico completo, generato dal motore.
[Limiti]                  Cosa non vale, per chi non vale.
[Fonti]                   Elenco con data di verifica.
[Passo successivo]        Una CTA sola. Vedi §7.
```

**Lunghezza:** 900-1.600 parole per un articolo normale. 1.800-2.500 per i pochi pilastri
segnati come tali in tabella. Non allungare per raggiungere un conteggio: un articolo di 900
parole che risponde batte uno di 2.000 che gira intorno.

**Tabelle:** usale quando confronti (importi, mensilità, livelli, anni). Ogni tabella dichiara
sopra o sotto le ipotesi del calcolo. Una tabella senza ipotesi è un numero senza provenienza.

**Una domanda per sezione.** Se una sezione risponde a due domande, sono due sezioni. Se non
risponde a nessuna, si cancella.

---

## 6. SEO — quello che serve, niente di più

- **Una query principale per articolo.** Sta in tabella. L'articolo la soddisfa; non prova a
  coprire anche le altre tre del cluster.
- **Niente cannibalizzazione.** Prima di scrivere, controlla in tabella e nella sitemap che
  non esista già una pagina per quell'intento. Le pagine `/ral-{N}-netto/` coprono già
  «quanto sono netti N euro di RAL»: un articolo **non** deve rifarle. Se la query è
  sovrapposta, l'articolo cambia angolo o non si scrive.
- **Title e meta description**: scritti per essere cliccati da una persona in ansia, non per
  ripetere la keyword. Il title dice il risultato, la description dice le ipotesi.
- **Link interni**: da 2 a 5 per articolo, verso pagine che esistono davvero. Inventario in §8.
  Il link ha senso solo se il lettore, a quel punto del testo, vuole davvero andarci.
- **Le domande delle persone**: la tabella riporta, per molti articoli, le People Also Ask
  raccolte dalla SERP. Rispondi a quelle dentro il corpo, con la risposta secca prima della
  spiegazione. Non costruire un blocco FAQ finto in fondo.
- **Le SERP con AI Overview** sono segnalate in tabella. Lì il clic disponibile è meno: vale
  la pena scrivere comunque quando l'articolo può essere *citato* dall'AI Overview, cioè
  quando ha un numero verificabile e una fonte. Ragione in più per §4.
- **Niente keyword stuffing, niente varianti infilate a forza.** Se il testo suona come
  scritto per un motore, riscrivi.

---

## 7. La CTA — una sola, e pertinente

Ogni articolo porta a **un** posto, scelto in base all'intento della query. La tabella lo
indica nella colonna dedicata. Le destinazioni:

| Intento del lettore | Destinazione | Formula |
|---|---|---|
| Vuole un numero dalla sua RAL | `/` (calcolatore) | «Metti la tua RAL e vedi il tuo caso» |
| Vuole partire dal netto | `/netto-ral.html` | «Sai quanto vuoi netto? Calcola la RAL che serve» |
| Ha il cedolino in mano / sospetta un errore | `/busta-paga.html` | «Hai il cedolino? Caricalo: il PDF resta nel tuo browser» |
| Confronta due offerte | `/compara.html` | — |
| Parte da CCNL e livello | `/ccnl-livello.html` | — |
| Cerca un importo specifico | `/ral-{N}-netto/` o `/confronti-ral/` | — |

**Regole della CTA:**

- Una sola, alla fine. Al massimo un secondo rimando contestuale a metà articolo, se cade
  naturale.
- Mai interrompere la risposta con la CTA. Prima rispondi, poi inviti.
- Sulla busta paga la CTA nomina sempre il differenziatore vero: **il PDF non lascia il
  browser, non serve un account, non conserviamo niente.** È l'unica promessa che i
  concorrenti non possono copiare senza smontare il proprio prodotto.
- Mai promettere che «i tuoi dati non escono»: è falso e lo sappiamo. La promessa esatta è
  «il PDF non lascia il browser, e prima di inviare vedi letteralmente il testo che parte».

---

## 8. Inventario dei link interni

Pagine che **esistono e sono in produzione** (verificate il 20 settembre 2026):

| URL | Cos'è |
|---|---|
| `/` | Calcolatore RAL → netto |
| `/netto-ral.html` | Calcolo inverso: netto → RAL |
| `/ccnl-livello.html` | RAL da CCNL, livello, scatti, superminimo |
| `/compara.html` | Confronto fra due offerte |
| `/confronti-ral/` | Hub delle pagine per importo |
| `/ral-{N}-netto/` | 17 pagine, da 20.000 a 100.000 € a passi di 5.000 |
| `/netto-o-niente.html` | Il browser game |
| `/la-storia.html` | La storia del progetto |
| `/come-ho-lavorato.html` | Metodo |

**Attenzione — non ancora in produzione al 20 settembre 2026:** `/busta-paga.html` e
`/privacy.html` esistono nel repository ma rispondono **404** sul dominio. Fino al deploy,
un articolo che linka la busta paga manda il lettore su una pagina inesistente.
Prima di pubblicare articoli con CTA verso la busta paga, **verifica che risponda 200**:

```sh
curl -s -o /dev/null -w "%{http_code}\n" https://www.dovevalatuaral.com/busta-paga.html
```

Se non è ancora online, l'articolo si scrive lo stesso ma la CTA punta al calcolatore.

---

## 9. Formato di consegna

La pipeline di RIC-74 genera articoli e indice con `npm run build` dalla root.
Vercel esegue lo stesso comando prima del deploy; un push da solo non pubblica.

### 9.1 Cosa consegna chi scrive

Un file markdown, uno per articolo, in `prototipo/articoli/{slug}.md`, con questo frontmatter:

```yaml
---
slug: quanto-si-perde-dalla-ral-al-netto
titolo: "Dalla RAL al netto: quanto si perde davvero"
title_seo: "Dalla RAL al netto: quanto resta nel 2026"
description: "Su una RAL di 30.000 € restano 1.680 € netti al mese su 13 mensilità. Ecco dove finisce il resto, voce per voce, con le fonti."
query_principale: "dalla ral al netto quanto si perde"
cluster: "ral-netto-base"
data_pubblicazione: 2026-10-03
data_aggiornamento: 2026-10-03 # opzionale: in assenza coincide con la pubblicazione
cta: "/"                      # una sola, da §7
link_interni: ["/ral-30000-netto/", "/confronti-ral/"]
ipotesi_calcolo: "dipendente privato, Milano, nessun familiare a carico, anno intero, FPLD ordinario"
fonti_verificate: 2026-09-20  # data in cui hai riaperto le fonti citate
stato: bozza                  # bozza | rivisto | pubblicato
---
```

Il corpo è markdown semplice: `##` e `###`, tabelle, liste, link. Niente HTML inline, niente
componenti. Le formule si scrivono a parole o in tabella, non in LaTeX.

### 9.2 Contratto del generatore (RIC-74)

- Tutti i campi mostrati sopra sono obbligatori, tranne `data_aggiornamento`. Date reali in
  formato `AAAA-MM-GG`; aggiornamento non precedente alla pubblicazione.
- `slug` deve coincidere col nome del file (senza `.md`), con minuscole, numeri e trattini.
  Anche `cluster` usa questo formato. Slug duplicati o metadati incompleti fermano la build.
- Solo `stato: pubblicato` va online. `bozza` e `rivisto` sono esclusi da indice, pagine e
  sitemap. La data è editoriale: **non pianifica** l’uscita; il cambio di stato e un nuovo
  deploy sono necessari. Ritirare/cancellare un articolo e rifare build rimuove la pagina.
- YAML supportato: scalari su una riga, stringhe tra virgolette singole o doppie, commenti
  dopo ` # `, array inline con stringhe tra virgolette doppie (come l’esempio).
  Non sono supportati oggetti, array su più righe, ancore YAML o stringhe multilinea.
- Markdown supportato: paragrafi, `##`, `###`, tabelle a pipe, liste semplici non annidate,
  link `[testo](URL)`, `**grassetto**`, `*corsivo*`, blockquote e codice inline.
  Niente HTML, immagini, codice a blocchi, link di riferimento o componenti.
- Chiudi il corpo con **una sezione `## Fonti`**, con almeno un link HTTP(S) alla fonte.
  Il template la separa visivamente e mostra `fonti_verificate`; non duplicare la CTA nel
  corpo. La data di verifica resta una dichiarazione dell’autore: la build non verifica
  l’attendibilità o la vigenza delle fonti esterne.
- `cta` è un solo percorso interno. `link_interni` elenca i rimandi editoriali, che vanno
  scritti anche nel corpo nel punto pertinente. Il generatore controlla che le destinazioni
  esistano; non crea link nel testo automaticamente. I correlati vengono dal medesimo cluster.
- `npm run build` genera `/blog/{slug}/index.html`, l’indice e l’unica sitemap insieme alle
  pagine RAL. L’output pubblico è `dist/`, senza sorgenti editoriali, bozze, template e test.
  Gli HTML in `prototipo/blog/` sono generati: non modificarli a mano.
- Il renderer non implementa tutto CommonMark o tutto YAML: sintassi fuori contratto va
  riscritta nel sottoinsieme sopra. Non si aggiungono dipendenze al sito.

Per un esempio tecnico completo: `processo/fixtures/articolo-demo.md`. È una fixture di
prova, esclusa dai contenuti e dalla produzione.

---

## 10. Il campo di gioco, e cosa ci rende diversi

Sintesi operativa dei due teardown del 20 settembre 2026 (dettaglio in `ricerca/`, più il
ticket Linear RIC-70 del 19 settembre).

### 10.1 Il vero concorrente è l'AI Overview, non BustaIA

Questa è la cosa che deve cambiare il modo in cui scrivi.

- Sul territorio busta paga, **l'AI Overview è presente e completo su 4 SERP su 6** e cita
  5-9 fonti — di solito Indeed, Randstad, Ipsoa, Coverflex, Jet HR, e regolarmente **TikTok e
  YouTube**. Se la tua pagina si limita a definire un termine, l'AI Overview l'ha già fatto
  sopra il fold e meglio.
- L'intero cluster esplicativo **perde il 35-65% di volume su base annua**: `come leggere la
  busta paga` −47%, `troppe trattenute in busta paga` −65%, `voci busta paga` −47%.
- Fa eccezione chi chiede un **artefatto**: `esempio busta paga` è a −23% e stabile. Le query
  che vogliono un documento, un esempio concreto, un numero, tengono. Quelle che vogliono una
  spiegazione, no.

**La regola che ne deriva, e che vale per ogni pezzo del piano:**

> Un articolo che spiega un concetto è morto in partenza. Ogni pagina deve contenere
> **almeno un numero che esce dal motore** e, dove possibile, **un input della persona**.
> Non «cos'è il ROL»: «dove sta il ROL nel tuo PDF, quante ore ti spettano col tuo CCNL,
> quanto valgono in euro e cosa fare se il numero non torna».

Corollario: l'AI Overview **cita** volentieri affermazioni brevi, verificabili e con fonte.
Lo standard di verifica del §4 non serve solo all'onestà: è il formato che si fa citare.
Sul territorio RAL, l'AI Overview osservato cita solo calcolatori commerciali e **nessuna
fonte istituzionale**. Un contenuto con gli estremi normativi in chiaro ha spazio.

### 10.2 Chi c'è davvero nelle SERP

- **BustaIA** vende «ti spiego la busta paga», ma il **53% del suo traffico stimato viene da
  pagine CCNL**. Il cluster lettura-cedolino vale 1.050 di ETV su 13 keyword, quasi tutto
  dalla homepage. Il suo `/blog/come-leggere-la-busta-paga` fa **ETV 8,3**, posizioni 31-90.
  Sul tema che dà il nome al suo prodotto, per Google non esiste.
- Gli occupanti reali delle posizioni 1-10 sul territorio informativo sono **Jet HR,
  Factorial, Coverflex, Indeed, Randstad, Zeta Service**, più studi di consulenti locali e
  sindacati. Sulla query `conguaglio in busta paga` (2.400/mese) un **post Facebook della UILM
  Basilicata è sesto**. Sono difese fragili.
- Sul territorio lordo→netto comanda `calcolastipendionetto.it`, in posizione 1 su quasi
  tutte le varianti dell'head term. **Non attaccare l'head term nudo.** Si entra dalla coda
  lunga e dalle pagine che rispondono a un caso.
- **Una query commerciale è già persa e si lascia stare:** su `controllo busta paga online
  gratis` BustaIA è posizione 2 ed è il brand citato dentro l'AI Overview. Non ci si schianta
  contro.

### 10.3 Cosa ci resta, ed è solido

1. **«Motore deterministico + fonti citate» non è più il titolo.** BustaIA l'ha già
   rivendicato su `/come-verifichiamo`, scritto bene e indicizzato. Resta il nostro metodo e
   si continua a fare (§4), ma non è il gancio. Non aprire mai un articolo con «noi però
   citiamo le fonti».
2. **Il differenziatore è la non conservazione, ed è di natura diversa dalla loro.** BustaIA
   garantisce la non conservazione **del fornitore del modello**; il PDF però esce dal
   browser, passa dal loro backend e finisce in un database con migliaia di utenti. Noi
   diciamo un'altra cosa: **il PDF non lascia il browser, al server arriva solo il testo che
   la persona ha redatto e approvato, non c'è account, non c'è database.**
   - Va messo come **blocco breve e fisso** su ogni pagina pertinente, non come pagina-
     manifesto che nessuno visita.
   - Va reso **dimostrabile**: «apri la scheda Rete del browser: non vedrai partire il PDF».
     Una dimostrazione batte una promessa.
   - Alza il volume dove il documento è imbarazzante: **colf e badanti, pignoramento,
     cessione del quinto**. Lì la non conservazione è il motivo per cui uno sceglie noi.
3. **Il conto rifatto.** Nessuno in queste SERP sa fare i conti. Jet HR cita le fonti
   normative e non ha una sola tabella numerica; BustaIA ha il motore e non lo usa in pagina.
   Noi abbiamo il motore e le fonti. È l'unica combinazione che manca a tutti.
4. **Il format giusto è del concorrente, e si prende.** Le pagine `/controllo/{sintomo}` di
   BustaIA — «stipendio più basso del solito», «straordinari non pagati» — intercettano il
   problema **come lo formula la persona**, non il nome tecnico. È la loro idea migliore e
   l'hanno lasciata a 680 parole senza un numero né una fonte. Quando la tabella assegna una
   query-sintomo, scrivi nella lingua di chi ha paura, non in quella della norma.
5. **Non scrivere articoli di confronto «noi vs loro»** senza una decisione esplicita di
   Riccardo. Non è il terreno dove siamo forti oggi.

### 10.4 Due cose da non fare

- **Non inseguire il volume fantasma.** `cedolino NoiPA` (301.000), `cedolino pensione INPS`
  (135.000 ×2), `prestiti senza busta paga`, `zucchetti login` sono circa il 70% del volume
  apparente del territorio e sono navigazionali verso INPS, la PA o le finanziarie. Non sono
  nostri e non lo diventeranno.
- **Non riscrivere la ventesima definizione.** Su `cosa sono i rol in busta paga` l'AI
  Overview è lungo e completo. Ciò che non fa: dire dove sta la voce nel PDF, rifare il conto,
  e dire cosa fare se non torna. Quello è il nostro pezzo.

---

## 11. Errori che fanno rifiutare l'articolo

1. Un numero senza provenienza (§4.1).
2. Un numero calcolato a mano invece che col motore (§4.2).
3. Una fonte secondaria spacciata per primaria, o senza data (§4.3).
4. Dire o insinuare che la busta paga del lettore è sbagliata.
5. Promettere che i dati non escono dal dispositivo.
6. Presentarsi come consulenza fiscale o del lavoro.
7. Duplicare l'intento di una pagina già esistente (§6).
8. Link interni verso URL che rispondono 404 (§8).
9. Più di una CTA principale, o CTA non pertinente all'intento.
10. Introduzione che rimanda la risposta oltre la quinta riga.
11. Riuso di un numero da un articolo precedente senza rigenerarlo.
12. Tono da blog aziendale: entusiasmo, emoji, domande retoriche, «scopriamo insieme».

---

## 12. Checklist prima di consegnare

- [ ] La risposta alla query sta nelle prime 5 righe
- [ ] Ogni numero è calcolato, normativo o dichiarato come stima (§4.1)
- [ ] I numeri di calcolo sono usciti da `motore.js` in questa sessione
- [ ] Le ipotesi del calcolo sono scritte accanto ai numeri
- [ ] Ogni fonte è primaria, linkata, con data di verifica
- [ ] C'è una sezione sui limiti, e dice cosa non copriamo
- [ ] Nessuna affermazione che il cedolino del lettore sia sbagliato
- [ ] Le PAA indicate in tabella hanno una risposta nel corpo
- [ ] 2-5 link interni, tutti verificati 200
- [ ] Una sola CTA, coerente con l'intento (§7)
- [ ] Frontmatter completo e `stato` aggiornato
- [ ] Riletto ad alta voce: suona come una persona, non come un ufficio stampa
- [ ] Riga Airtable aggiornata con stato e data

---

## 13. Dove stanno le cose

| Cosa | Dove |
|---|---|
| Piano editoriale, articolo per articolo | Tabella Airtable (base `appAsCWc7NBzY5nam`) |
| Motore di calcolo | `prototipo/motore.js` |
| Catalogo fonti già verificate | `prototipo/fonti.js` |
| Ricerca normativa | `processo/regole-netto-2026.md`, `processo/fonti-ccnl-2026.md` |
| Glossario del dominio (Voce, Riga, Capienza, Salto) | `CONTEXT.md` |
| Voce e tono | `la-storia.md`, `README.md`, `/root/ricc-os/context/voice.md` |
| Strategia SEO e priorità | `crescita/strategia-seo.md` |
| Ricerca competitor e keyword del piano | `crescita/piano-editoriale-90gg/ricerca/` |
| Analisi concorrenti busta paga | Linear RIC-70 |
| Specifica del prodotto busta paga | Linear RIC-64 |
