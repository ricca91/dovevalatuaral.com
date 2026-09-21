# Piano editoriale 90 giorni — dovevalatuaral.com

_22 settembre – 20 dicembre 2026. Un articolo al giorno._
_Scritto il 21 settembre 2026. Ricerca in [`ricerca/`](ricerca/). Come si scrivono gli articoli: [`guida-scrittura-articoli.md`](guida-scrittura-articoli.md)._

> **Il piano vive su Airtable** (base `appAsCWc7NBzY5nam`, tabella "Piano editoriale"): una riga
> per articolo, con l'angolo completo, le PAA da coprire, la CTA e i dati SEO. Questo documento
> spiega **perche** il piano e fatto cosi. Per scrivere un articolo servono la riga e la guida.

---

## 1. La decisione che sta sotto a tutto

La ricerca ha ribaltato l'ipotesi di partenza, ed e giusto dirlo prima del calendario.

**Il mercato dello "spiegare la busta paga" si sta sgonfiando.** Su base annua:
`come leggere la busta paga` −47%, `come si legge la busta paga` −38%, `voci busta paga` −47%,
`troppe trattenute in busta paga` −65%. L'AI Overview e presente e completo su 4 SERP su 6 e
cita 5-9 fonti. La domanda semplice non arriva piu al clic.

Fa eccezione una cosa sola: **chi chiede un artefatto.** `esempio busta paga` e a −23% e stabile
a 1.600. Le query che vogliono un documento, un esempio, un numero, tengono. Quelle che vogliono
una definizione, no.

Da qui la regola che governa tutti e 90 gli articoli:

> **Non sono 90 articoli che spiegano. Sono 90 pagine che fanno un conto.**
> Ogni pagina deve contenere almeno un numero che esce dal motore, e dove possibile un input
> di chi legge. Un pezzo che spiega cos'e il ROL e morto in partenza: la SERP ha gia la
> risposta completa sopra il fold.

**Una nota sul ritmo.** La ricerca dice che 90 pagine sottili perdono contro 45 con un calcolo
dentro. Il piano resta da 90 perche e quello che e stato chiesto, ed e costruito per reggerlo:
alterna pagine costose (sintomi, strumenti, pilastri) con esempi di cedolino per casistica, che
il motore genera a costo marginale basso. Se il ritmo si dirada, il piano non va riscritto: si
allunga, e l'ordine di priorita dice cosa difendere.

---

## 2. Il campo di gioco, in breve

**Il concorrente non e BustaIA. E l'AI Overview.**

BustaIA vende "ti spiego la busta paga", ma il **53% del suo traffico stimato viene dalle pagine
CCNL**. Il cluster lettura-cedolino vale 1.050 di ETV su 13 keyword, quasi tutto dalla homepage.
Il suo `/blog/come-leggere-la-busta-paga` fa **ETV 8,3**, posizioni 31-90: sul tema che da il
nome al suo prodotto, per Google non esiste.

Gli occupanti veri delle posizioni 1-10 sono altri: **Zeta Service** (numero uno del territorio,
outsourcing paghe B2B), Ipsoa, Randstad, **Factorial** (massima visibilita), Indeed, Dipendenti
in Cloud, Jet HR, Skello. Piu studi di consulenti locali e sindacati: su `conguaglio in busta
paga` un **post Facebook della UILM Basilicata e sesto**.

**Si vince col contenuto, non con i link.** La correlazione misurata fra backlink rank e
posizione mediana su 20 domini e **+0,01: zero**. Zeta Service (rank 218) batte Ipsoa (505) e
Indeed (499); quattro domini con rank sotto 310 hanno mediana ≤3. Sui backlink il sito parte da
dove sta BustaIA — da zero — e non e quello che decide.

**Perche e sfruttabile.** Le due pagine in posizione 1-2 sulle query piu grosse non contengono
un solo calcolo: Zeta Service, 3.500 parole, **zero numeri**, nessuna data, promette nel titolo
la lista dei codici e **non la da**. Factorial, 4.500 parole, **un solo importo**, zero fonti
normative, e i suoi due cedolini annotati sono **placeholder SVG rotti**.

**La controprova e Skello:** backlink rank piu basso di Factorial, **posizione 1**, con esempio
lavorato in tabella, simulatore funzionante, fonti con estremi di legge, data di aggiornamento e
FAQ a nove domande. E la ricetta, verificata sul campo.

**E la cosa strutturale che conta di piu:** tutti gli occupanti **monetizzano altrove** — SaaS
alle aziende, annunci, abbonamenti. Nessuno ha come cliente il lavoratore che legge la pagina.
Noi si. Per questo possiamo mettere il calcolo dentro la pagina, e loro non hanno motivo di
seguirci.

### Cosa NON fare

- **Non attaccare l'head term nudo del lordo→netto.** `calcolo stipendio netto` e varianti
  (49.500 ciascuna) sono tenute in posizione 1 da calcolastipendionetto.it, e 10 risultati su 10
  sono calcolatori: va servita con la pagina-strumento, non con un articolo.
- **Non attaccare `controllo busta paga online gratis`.** BustaIA e in posizione 2 **ed e il
  brand citato dentro l'AI Overview**. E persa.
- **Non attaccare `scaglioni irpef` / `aliquote irpef`.** L'Agenzia delle Entrate e in posizione
  2 organica: chi definisce l'aliquota vince la query sulla definizione dell'aliquota. Il KD 0 li
  mente.
- **Non inseguire il volume fantasma.** `cedolino NoiPA` (301.000), `cedolino pensione INPS`
  (135.000 ×2), `prestiti senza busta paga`, `zucchetti login`: sono circa il 70% del volume
  apparente del territorio e sono navigazionali verso INPS, la PA o le finanziarie.
- **Colf e badanti: fuori perimetro.** Erano indicati come opportunita, poi la SERP live si e
  rivelata tutta generatori gratuiti di cedolini. L'intento e **produrre** una busta paga, non
  capirla: l'opposto del prodotto.

### Cosa ci resta, ed e solido

1. **Il conto rifatto.** Nessuno in queste SERP sa fare i conti. Jet HR cita le fonti e non ha
   una tabella numerica; BustaIA ha il motore e non lo usa in pagina. Noi abbiamo entrambi.
2. **La non conservazione.** BustaIA garantisce la non conservazione **del fornitore del
   modello**; il PDF pero esce dal browser e finisce in un database. Noi diciamo un'altra cosa:
   il PDF non lascia il browser, al server arriva solo il testo che la persona ha approvato,
   niente account, niente database. **E verificabile in DevTools**, e nessuno dei tre concorrenti
   puo copiarla senza smontare il proprio prodotto.
3. **Il format del sintomo**, che e l'idea migliore di BustaIA e che loro hanno lasciato a 680
   parole senza un numero.

---

## 3. La stagionalita, che e il vincolo non recuperabile

Un articolo va online **3-4 settimane prima** del picco: serve tempo a Google per posizionarlo e
la domanda inizia a salire dal mese precedente. Sotto c'e il mese di **picco**, non di
pubblicazione. Dati da `monthly_searches`, misurati sul Q4 2025 e usati come proxy del Q4 2026.

| Quando esplode | Cosa | Il dato | Si pubblica |
|---|---|---|---|
| **Ottobre** | Legge di bilancio | `taglio irpef` 14.800 → **74.000** · `tredicesima detassata` 8.100 → **74.000** · `tassazione tredicesima` 6.600 → **49.500** | **subito, giorni 1-10** |
| **Novembre** | Tredicesima-anticipazione, rinnovi CCNL | `tredicesima mensilita` 8.100 → **60.500** · `rinnovo ccnl metalmeccanici` 6.600 → **27.100** | giorni 11-40 (ottobre) |
| **Dicembre** | Tredicesima-attesa | `quando arriva la tredicesima` 12.100 → **110.000** (fattore 9, il picco piu violento del dataset) · `tredicesima come si calcola` 8.100 → **60.500** | giorni 41-60 (novembre) |
| **Gennaio** (fuori finestra) | Conguaglio | `esempio di calcolo conguaglio fiscale` 480 → **2.900** · `quando arriva il conguaglio` 260 → **1.600**, trend annuo **+400%** | giorni 61-90 (dicembre) |

**Cosa e fuori finestra e non va sprecato:** CU e Certificazione Unica (picco febbraio-marzo),
730 e dichiarazione (aprile-giugno), quattordicesima (giugno-luglio). E **le ferie**: contro
l'attesa, il picco non e a dicembre ma a marzo-luglio, perche la scadenza che genera domanda e
il 30 giugno dei 18 mesi, non il 31 dicembre.

**Da preparare a vuoto:** le aliquote dell'anno nuovo. `aliquote irpef 2025` nel Q4 2025 stava a
90.500/74.000/74.000 contro 40.500 di media. La stringa che salira nel Q4 2026 e quella con
l'anno successivo, che oggi non ha ancora dati.

---

## 4. Com'e composto

Sei cluster portano il peso, e la scelta viene dalle lacune misurate:

- **Sintomi (15)** — il cluster piu difendibile in assoluto: nessun occupante della SERP ha un
  motore di calcolo in pagina, e nessuno ha incentivo a costruirlo. Sopravvive all'AI Overview
  perche la risposta dipende dai numeri di chi legge.
- **Esempi per casistica (14)** — il piu resistente all'AI: un esempio e un artefatto. Skello ha
  il format vincente ma copre **una sola** delle sette casistiche; le altre sono libere, tutte
  KD 0, nessuna presidiata da BustaIA.
- **Voce per voce (15)** — solo nel taglio "dove sta nel tuo PDF e come si verifica". **Mai in
  formato definizione**: sui ROL l'AI Overview e gia completo. GioIA ha provato il glossario
  puro ed e a posizione 37-103.
- **Tredicesima (7) + IRPEF e manovra (8) + Conguaglio (6)** — la spina stagionale.

Il resto: Strumenti (7), Ferie e permessi (5), TFR (4), CCNL e rinnovi (4), Benefit (2),
Straordinari (2), piu il pilastro `come leggere la busta paga`, che vale da solo.

**Aggancio ai prodotti:** 54 articoli portano a "Ti spiego la busta paga", 28 al calcolatore RAL,
8 agli altri strumenti (CCNL, netto→RAL, confronto offerte). La proporzione riflette l'obiettivo dichiarato della fase due.

### L'articolo che conta piu di tutti

**Giorno 1, `come leggere la busta paga`.** 3.600 ricerche al mese, KD 0, **nessun AI Overview,
nessun PAA**, e il primo risultato organico e **un PDF caricato nel 2016**. BustaIA e oltre la
50esima. Zeta Service e primo con 3.500 parole e zero numeri. E la singola opportunita piu grande
del territorio e non e presidiata da nessuno che sappia fare i conti.

---

## 5. Prima del giorno 1: due cose che bloccano

Verificate il 20 settembre 2026, non sono opinioni.

**1. Non esiste un'infrastruttura di blog.** Il sito e statico, generato da template Node
(`genera-pagine-ral.js` + `ral-page.template.js`). Non c'e una cartella articoli, un generatore,
un indice. Un articolo al giorno non e pubblicabile finche non la si costruisce. Serve:
`prototipo/articoli/` (sorgente markdown), `articolo.template.js`, `genera-articoli.js`,
un indice `/blog/`, gli articoli in sitemap, e i test in `seo.test.js`.

**2. `/busta-paga.html` e `/privacy.html` rispondono 404 in produzione.** Esistono su `main` ma
non sono deployate (RIC-68 e RIC-69 sono "In Review"). Sono il bersaglio delle CTA di 54 articoli
su 90. Finche rispondono 404, quegli articoli mandano le persone su una pagina che non c'e:
la CTA va temporaneamente al calcolatore.

```sh
curl -s -o /dev/null -w "%{http_code}\n" https://www.dovevalatuaral.com/busta-paga.html
```

---

## 6. Come leggere i numeri di questo piano

- **71 articoli su 90** hanno un volume confermato da una chiamata DataForSEO reale. I restanti
  19 hanno in `Query principale` un'**etichetta di lavoro** interrogata il 21/09/2026 e **non
  presente nel database**: e un dato mancante, non un volume zero. Sono dichiarati uno per uno
  nelle Note, e chi scrive deve trovare l'head term reale prima di partire.
- **KD 0 non vuol dire facile.** Su 50 keyword core, 44 hanno KD 0: il territorio non e difeso
  da link authority. La difesa vera e l'AI Overview e la fiducia di brand, che il KD non misura.
  Per questo in tabella c'e `Difficolta reale`, che e un giudizio sulla SERP e **prevale sul KD**.
- **I volumi non si sommano.** `calcolare stipendio netto` e `calcolatore stipendio netto`
  valgono 49.500 ciascuna e sono la stessa ricerca. Le somme per cluster servono a ordinare le
  priorita, non a prevedere traffico.
- **Il volume non e clic disponibili.** Su 10 SERP controllate su 11 c'e l'AI Overview in
  posizione 1. Quanto eroda i clic non e stato misurato.
- **Nessuna previsione di traffico in questo piano.** Sarebbe un numero inventato.

---
## Il calendario, giorno per giorno

`vol` = volume mensile stimato DataForSEO. Cella vuota = **dato mancante**, non volume zero.
`KD` vuoto = non restituito dal provider. L'angolo completo di ogni articolo sta in Airtable.


### Settembre 2026

| G | Data | Titolo | Query principale | Vol | KD | Cluster | Prod. | Pri. |
|--:|---|---|---|--:|--:|---|---|---|
| 1 | 22/09 | Come si legge una busta paga, riga per riga, con i conti rifatti | `come leggere la busta paga` | 3.600 | 0 | Leggere la busta paga | BP | A |
| 2 | 23/09 | Taglio IRPEF: cosa cambia davvero sul tuo netto, con il conto a confronto | `taglio irpef` | 14.800 | 0 | IRPEF e manovra | RAL | A |
| 3 | 24/09 | Il netto e sceso rispetto al mese scorso: le cause, una per una, con il conto | `troppe trattenute in busta paga` | 390 | 0 | Sintomi | BP | A |
| 4 | 25/09 | Tredicesima detassata: cosa significa e quanto vale in euro nel tuo caso | `tredicesima detassata` | 8.100 | 0 | Tredicesima | RAL | A |
| 5 | 26/09 | Esempio di busta paga: un cedolino vero, spiegato importo per importo | `esempio busta paga` | 1.600 | — | Esempi per casistica | BP | A |
| 6 | 27/09 | Tassazione della tredicesima: perche e piu bassa di quanto ti aspetti | `tassazione tredicesima` | 6.600 | 0 | Tredicesima | RAL | A |
| 7 | 28/09 | Contributo IVS in busta paga: cos'e quel 9,19% e su cosa si calcola | `contributo ivs in busta paga` | 2.400 | — | Voce per voce | BP | A |
| 8 | 29/09 | Esempio di busta paga con malattia: quanto ti paga l'INPS e quanto il datore | `esempio busta paga con malattia` | 1.900 | 0 | Esempi per casistica | BP | A |
| 9 | 30/09 | Detassazione degli straordinari: cosa cambia sull'ora in piu | `tassazione straordinari` | 2.400 | 0 | Straordinari | BP | A |

### Ottobre 2026

| G | Data | Titolo | Query principale | Vol | KD | Cluster | Prod. | Pri. |
|--:|---|---|---|--:|--:|---|---|---|
| 10 | 01/10 | TFR: come si calcola davvero, e come verificare l'accantonamento in busta paga | `tfr come calcolarlo` | 12.100 | 0 | TFR | RAL | A |
| 11 | 02/10 | Gli straordinari non ci sono in busta paga: dove cercarli e come verificarli | `straordinari non pagati busta paga` | — | — | Sintomi | BP | M |
| 12 | 03/10 | Quanto vale davvero un'ora del tuo lavoro, al netto | `calcolo ral da busta paga` | 390 | — | Strumenti | RAL | M |
| 13 | 04/10 | Esempio di busta paga con liquidazione del TFR | `esempio busta paga liquidazione tfr` | 1.900 | 0 | Esempi per casistica | BP | A |
| 14 | 05/10 | Voci della busta paga: il dizionario delle diciture, con dove trovarle | `voci busta paga` | 320 | — | Voce per voce | BP | A |
| 15 | 06/10 | Tredicesima: quanto ti arrivera, calcolato sul tuo caso | `tredicesima mensilita` | 8.100 | 0 | Tredicesima | RAL | A |
| 16 | 07/10 | Il ROL in busta paga: dove sta, quante ore ti spettano e quanto valgono | `rol busta paga` | 1.300 | 0 | Voce per voce | BP | M |
| 17 | 08/10 | Ho pagato piu tasse di quelle che mi aspettavo: le quattro spiegazioni possibili | `trattenute fiscali busta paga` | 90 | — | Sintomi | BP | A |
| 18 | 09/10 | Esempio di busta paga part-time: come cambiano le voci con le ore ridotte | `esempio busta paga part time` | 320 | 0 | Esempi per casistica | RAL | M |
| 19 | 10/10 | Rinnovo del CCNL metalmeccanici: cosa arriva in busta paga e quando | `rinnovo ccnl metalmeccanici` | 6.600 | 0 | CCNL e rinnovi | CCNL | A |
| 20 | 11/10 | Esempio di busta paga con infortunio: chi paga cosa dal primo giorno | `esempio busta paga con infortunio` | 1.300 | 0 | Esempi per casistica | BP | A |
| 21 | 12/10 | EDR in busta paga: cos'e quella voce da 10,33 euro | `edr in busta paga` | 1.300 | 0 | Voce per voce | BP | M |
| 22 | 13/10 | Le ferie in busta paga sono in ore o in giorni? Come leggere il saldo | `le ferie in busta paga sono in ore o giorni` | 480 | — | Ferie e permessi | BP | M |
| 23 | 14/10 | Il conguaglio in busta paga, spiegato con il conto rifatto | `conguaglio in busta paga` | 2.400 | 0 | Conguaglio | BP | A |
| 24 | 15/10 | Mi hanno dato un premio e il netto e cresciuto meno del lordo | `premio di risultato busta paga` | 30 | — | Sintomi | RAL | B |
| 25 | 16/10 | Esempio di busta paga con pignoramento: cosa si vede e cosa resta | `esempio busta paga con pignoramento` | 880 | 0 | Esempi per casistica | BP | A |
| 26 | 17/10 | Superminimo in busta paga: cos'e e perche puo sparire | `superminimo in busta paga` | 1.300 | 0 | Voce per voce | CCNL | M |
| 27 | 18/10 | Trasferta in busta paga: indennita, rimborsi e cosa e tassato | `trasferta italia busta paga` | 880 | 0 | Straordinari | BP | M |
| 28 | 19/10 | Esempio di busta paga con contratto a chiamata | `esempio busta paga contratto a chiamata` | 880 | 0 | Esempi per casistica | BP | M |
| 29 | 20/10 | Ex festivita in busta paga: quelle quattro ore che non sai di avere | `ex festivita busta paga` | 720 | 0 | Ferie e permessi | BP | B |
| 30 | 21/10 | Contingenza in busta paga: la voce ferma dal 1991 | `cos'e la contingenza in busta paga` | 590 | 0 | Voce per voce | BP | M |
| 31 | 22/10 | Controllare la busta paga da soli: la procedura in sette verifiche | `controllare la busta paga` | 480 | 0 | Sintomi | BP | A |
| 32 | 23/10 | Contributo FAP in busta paga: cos'e e chi lo paga | `contributo fap in busta paga` | 1.000 | — | Voce per voce | BP | M |
| 33 | 24/10 | Buoni pasto in busta paga: quanto sono esenti e quanto no | `buoni pasto 10 euro` | 3.600 | — | Benefit e welfare | RAL | M |
| 34 | 25/10 | Tassazione del TFR: quanto ti resta davvero della liquidazione | `tassazione tfr` | 9.900 | — | TFR | RAL | A |
| 35 | 26/10 | Assenze e permessi: perche una giornata in meno costa piu di un trentesimo | `permessi non retribuiti busta paga` | — | — | Sintomi | BP | M |
| 36 | 27/10 | Addizionale regionale e comunale: perche compaiono solo in certi mesi | `addizionale comunale busta paga` | 320 | — | Voce per voce | RAL | A |
| 37 | 28/10 | Esempio di busta paga con maternita | `busta paga maternita` | — | — | Esempi per casistica | BP | M |
| 38 | 29/10 | Residuo AP in busta paga: cosa vuol dire quella sigla accanto alle ferie | `busta paga residuo ap` | 590 | — | Voce per voce | BP | M |
| 39 | 30/10 | Indennita legge 207/24 in busta paga: cos'e quella riga nuova | `indennita l. 207/24 in busta paga` | 590 | 0 | IRPEF e manovra | BP | A |
| 40 | 31/10 | Bonus benzina in busta paga: quando c'e e quanto vale netto | `bonus benzina busta paga` | 5.400 | — | Benefit e welfare | RAL | A |

### Novembre 2026

| G | Data | Titolo | Query principale | Vol | KD | Cluster | Prod. | Pri. |
|--:|---|---|---|--:|--:|---|---|---|
| 41 | 01/11 | Quanto costi davvero alla tua azienda, e perche non e il tuo lordo | `quanto costa un dipendente all'azienda` | 50 | — | Strumenti | RAL | B |
| 42 | 02/11 | Esempio di busta paga con cessione del quinto | `cessione del quinto busta paga` | 140 | 5 | Esempi per casistica | BP | M |
| 43 | 03/11 | Codici della busta paga: come si decifrano, con la lista | `codici busta paga` | 260 | — | Voce per voce | BP | M |
| 44 | 04/11 | Ferie non godute: quanto vengono pagate e quando si perdono | `ferie non godute` | 1.900 | 0 | Ferie e permessi | BP | M |
| 45 | 05/11 | Quanto devi chiedere di aumento per avere 200 euro netti in piu | `aumento stipendio quanto chiedere` | 1.600 | 5 | Strumenti | N→R | A |
| 46 | 06/11 | Tredicesima: come si calcola, con il conto sul tuo caso | `tredicesima come si calcola` | 8.100 | 0 | Tredicesima | RAL | A |
| 47 | 07/11 | Quando arriva la tredicesima, e cosa fare se non arriva | `quando arriva la tredicesima` | 12.100 | 0 | Tredicesima | RAL | A |
| 48 | 08/11 | Calcolatore della tredicesima: mettici i tuoi numeri | `calcolatore tredicesima` | 5.400 | 0 | Tredicesima | RAL | A |
| 49 | 09/11 | La tredicesima e piu bassa dell'anno scorso: le cause possibili | `tredicesima piu bassa` | — | — | Sintomi | BP | A |
| 50 | 10/11 | Conguaglio a debito: perche a dicembre la busta paga si svuota | `conguaglio a debito busta paga` | 480 | — | Conguaglio | BP | A |
| 51 | 11/11 | IRPEF 2026: scaglioni, aliquote e quanto pesano sul tuo netto | `irpef 2026` | 14.800 | 0 | IRPEF e manovra | RAL | A |
| 52 | 12/11 | Anticipo del TFR: quando si puo chiedere e quanto arriva netto | `anticipazioni tfr` | 5.400 | 0 | TFR | RAL | M |
| 53 | 13/11 | TFR in azienda o nel fondo pensione: il confronto, coi numeri | `tfr silenzio-assenso` | 1.600 | — | TFR | RAL | M |
| 54 | 14/11 | Ho cambiato lavoro a meta anno: perche il conguaglio fa paura | `conguaglio cambio lavoro` | 20 | — | Conguaglio | BP | B |
| 55 | 15/11 | Rimborso del 730 in busta paga: quando arriva e perche puo non arrivare | `rimborso 730 in busta paga` | 590 | — | Conguaglio | BP | M |
| 56 | 16/11 | Esempio di busta paga dell'ultimo mese di lavoro | `ultima busta paga dimissioni` | — | — | Esempi per casistica | BP | M |
| 57 | 17/11 | Livello CCNL e netto: quanto prende davvero un quinto livello | `5 livello metalmeccanico stipendio netto` | 1.900 | — | CCNL e rinnovi | CCNL | A |
| 58 | 18/11 | Scatti di anzianita: quanto valgono netti e ogni quanto arrivano | `scatti di anzianita busta paga` | — | — | CCNL e rinnovi | CCNL | M |
| 59 | 19/11 | Il netto non torna con quello che mi avevano promesso al colloquio | `ral promessa netto diverso` | — | — | Sintomi | RAL | A |
| 60 | 20/11 | Due offerte di lavoro a confronto: quale lascia piu soldi in tasca | `confronto offerte di lavoro stipendio netto` | — | — | Strumenti | Conf. | M |
| 61 | 21/11 | Detrazioni da lavoro dipendente: quanto ti spetta e quanto ne usi davvero | `detrazioni lavoro dipendente` | 8.100 | — | IRPEF e manovra | RAL | A |
| 62 | 22/11 | Esempio di busta paga con arretrati | `arretrati in busta paga` | 30 | 12 | Esempi per casistica | BP | B |
| 63 | 23/11 | Carenza per malattia: i giorni che nessuno ti paga | `carenza malattia busta paga` | 590 | — | Ferie e permessi | BP | M |
| 64 | 24/11 | Tabella lordo-netto per dipendenti, con le ipotesi dichiarate | `tabella lordo netto` | 4.400 | 5 | Strumenti | RAL | A |
| 65 | 25/11 | Apprendistato: perche la busta paga e diversa | `busta paga apprendistato` | 110 | — | Esempi per casistica | BP | M |
| 66 | 26/11 | Cuneo fiscale: cos'e e quanto ne vedi davvero in busta paga | `cuneo fiscale busta paga` | 50 | — | IRPEF e manovra | RAL | B |
| 67 | 27/11 | Preavviso: quanto vale, e cosa succede se non lo lavori | `preavviso dimissioni` | 8.100 | — | Esempi per casistica | BP | A |
| 68 | 28/11 | Imponibile previdenziale e imponibile fiscale: perche sono due numeri diversi | `imponibile previdenziale` | 1.300 | — | Voce per voce | BP | M |
| 69 | 29/11 | Banca ore: dove sta e cosa ci puoi fare | `banca ore busta paga` | 140 | — | Ferie e permessi | BP | B |
| 70 | 30/11 | Quattordicesima: chi ce l'ha, quando arriva e quanto vale netta | `come si calcola la quattordicesima` | 2.400 | — | Tredicesima | RAL | M |

### Dicembre 2026

| G | Data | Titolo | Query principale | Vol | KD | Cluster | Prod. | Pri. |
|--:|---|---|---|--:|--:|---|---|---|
| 71 | 01/12 | Aliquote e scaglioni del prossimo anno: cosa cambia sul tuo netto | `aliquote irpef 2027` | — | — | IRPEF e manovra | RAL | A |
| 72 | 02/12 | Il conguaglio di fine anno, con l'esempio del calcolo completo | `esempio di calcolo conguaglio fiscale` | 480 | — | Conguaglio | BP | A |
| 73 | 03/12 | Quando arriva il conguaglio, e in quale busta paga | `quando arriva il conguaglio in busta paga` | 260 | — | Conguaglio | BP | A |
| 74 | 04/12 | Cosa cambia in busta paga da gennaio | `cosa cambia nella busta paga da gennaio` | 2.400 | — | IRPEF e manovra | BP | A |
| 75 | 05/12 | Il netto di gennaio e diverso da quello di dicembre: perche | `stipendio gennaio piu basso` | — | — | Sintomi | BP | A |
| 76 | 06/12 | Ratei in busta paga: cosa sono quei numeri che crescono ogni mese | `ratei busta paga` | 40 | 30 | Voce per voce | BP | B |
| 77 | 07/12 | Progressivi in busta paga: a cosa servono quei totali da inizio anno | `progressivi busta paga` | 20 | — | Voce per voce | BP | B |
| 78 | 08/12 | Il TFR non compare in busta paga: e normale? | `tfr in busta paga non c'e` | — | — | Sintomi | BP | M |
| 79 | 09/12 | Minimo tabellare: da dove parte davvero il tuo stipendio | `minimo tabellare busta paga` | 50 | 11 | CCNL e rinnovi | CCNL | B |
| 80 | 10/12 | Stipendio medio netto in Italia: cosa dicono i numeri e cosa non dicono | `stipendio medio netto italia` | 3.600 | — | Strumenti | RAL | M |
| 81 | 11/12 | Trattamento integrativo, l'ex bonus Renzi: perche c'e o non c'e in busta paga | `bonus renzi busta paga` | 880 | — | IRPEF e manovra | RAL | M |
| 82 | 12/12 | Esempio di busta paga con trasferta e rimborsi | `busta paga con trasferta esempio` | — | — | Esempi per casistica | BP | B |
| 83 | 13/12 | Quanto ti resta di un aumento di 100 euro lordi | `100 euro lordi quanto sono netti` | 260 | 11 | Strumenti | N→R | M |
| 84 | 14/12 | Ho due lavori: perche le tasse non tornano mai | `due contratti di lavoro tasse busta paga` | — | — | Sintomi | BP | M |
| 85 | 15/12 | Malattia lunga: cosa succede al netto mese dopo mese | `malattia lunga busta paga` | — | — | Sintomi | BP | M |
| 86 | 16/12 | Come si verifica che i contributi siano stati versati davvero | `verificare contributi versati` | — | — | Sintomi | BP | M |
| 87 | 17/12 | Il glossario della busta paga, sigla per sigla | `sigle busta paga` | — | — | Voce per voce | BP | M |
| 88 | 18/12 | Tre cose da controllare ogni mese, in due minuti | `controllo busta paga mensile` | — | — | Sintomi | BP | M |
| 89 | 19/12 | Come cambia il netto se cambi comune | `addizionale comunale differenze` | — | — | Voce per voce | RAL | M |
| 90 | 20/12 | Un anno di busta paga: come rileggere i dodici cedolini insieme | `confronto buste paga anno` | — | — | Sintomi | BP | M |

---

## Composizione

| Cluster | Articoli | Volume confermato (somma grezza) |
|---|--:|--:|
| Sintomi | 15 | 990 |
| Voce per voce | 15 | 10.740 |
| Esempi per casistica | 14 | 17.160 |
| IRPEF e manovra | 8 | 41.620 |
| Tredicesima | 7 | 50.800 |
| Strumenti | 7 | 10.300 |
| Conguaglio | 6 | 4.230 |
| Ferie e permessi | 5 | 3.830 |
| TFR | 4 | 29.000 |
| CCNL e rinnovi | 4 | 8.550 |
| Straordinari | 2 | 3.280 |
| Benefit e welfare | 2 | 9.000 |
| Leggere la busta paga | 1 | 3.600 |
| **Totale** | **90** | **193.100** |

> La somma dei volumi **non e domanda disponibile**: contiene sinonimi che descrivono la stessa
> ricerca e non vanno sommati. Serve a dare un ordine di grandezza fra cluster, niente di piu.

| Prodotto agganciato | Articoli |
|---|--:|
| Busta paga | 54 |
| Calcolatore RAL | 28 |
| CCNL | 5 |
| Netto→RAL | 2 |
| Confronto offerte | 1 |

| Priorita | Articoli |   | Tipo | Articoli |
|---|--:|---|---|--:|
| Alta | 40 |  | Risposta | 27 |
| Media | 39 |  | Calcolo | 26 |
| Bassa | 11 |  | Sintomo | 16 |
|  |  |  | Stagionale | 9 |
|  |  |  | Pilastro | 8 |
|  |  |  | Confronto | 4 |

**Copertura del dato:** 71/90 articoli hanno un volume confermato da una chiamata DataForSEO. I restanti 19 hanno in `Query principale` un'etichetta di lavoro interrogata il 21/09/2026 e **non presente nel database**: sono dichiarati riga per riga nel campo Note, e chi scrive deve trovare l'head term reale prima di partire.
---

## 7. I file

| File | Cos'e |
|---|---|
| `piano-editoriale-90-giorni.md` | Questo documento: il perche del piano e il calendario |
| `piano-90-giorni.json` | I 90 articoli in forma leggibile da una macchina. **Fonte di verita per Airtable** |
| `guida-scrittura-articoli.md` | Come si scrive un articolo: voce, verifica, struttura, CTA, checklist |
| `schema-airtable.md` | I campi della tabella e le regole di compilazione |
| `build_piano.py` | Genera il JSON. Contiene l'angolo e le motivazioni di ogni articolo, con i controlli |
| `patch_misure.py` | Applica le misure DataForSEO del 21/09 e declassa gli slot a volume basso |
| `patch_swap.py` | Sostituisce i tre slot il cui bersaglio, misurato, si e rivelato sbagliato |
| `render_piano.py` | Genera il calendario di questo documento dal JSON |
| `ricerca/competitor-busta-paga.md` | Teardown del territorio busta paga: cluster, trend, lacune, 40 PAA |
| `ricerca/competitor-calcolatore-ral.md` | Teardown del territorio lordo→netto: domini, cluster, programmatica vs blog |
| `ricerca/competitor-occupanti-reali.md` | Chi occupa davvero la top 10, e perche si vince col contenuto |
| `ricerca/keyword-universe.md` | 13 cluster, stagionalita Q4, 25 opportunita, keyword da evitare |
| `ricerca/keywords.csv` | 397 keyword misurate, una per riga, con la fonte del dato |

**Se il piano va rigenerato:** modifica `build_piano.py`, poi

```sh
python3 build_piano.py && python3 patch_misure.py && python3 patch_swap.py && python3 render_piano.py
```

I controlli in `build_piano.py` falliscono rumorosamente se i giorni non coprono 1-90, se ci sono
slug duplicati o se una CTA punta a una pagina che non esiste.

## 8. Cosa questo piano non ha verificato

- **Nessuna previsione di traffico.** Non c'e, ed e voluto: sarebbe un numero inventato.
- **La qualita reale dei concorrenti non e stata provata.** Nessun cedolino e stato caricato su
  BustaIA, GioIA o Cedolingo: sappiamo come sono costruiti e cosa promettono, non quanto ci prendono.
- **Le norme citate dai concorrenti non sono state controllate.** Le fonti che Jet HR e Skello
  mettono in pagina sono riportate come *cio che loro dichiarano*. Vanno riverificate su Normattiva
  prima di riusarle in un nostro articolo.
- **Gli AI Overview sono una fotografia del 20-21 settembre.** Possono comparire e sparire: vanno
  ricontrollati prima di decidere di non scrivere un pezzo.
- **Le SERP sono state osservate solo da desktop, in Italia.** Nessun controllo mobile.
- **La stagionalita Q4 e misurata sul Q4 2025**, con una legge di bilancio diversa da quella che
  arrivera. E il miglior dato disponibile, non una certezza.
- **Non e stata verificata l'autorita di dovevalatuaral.com** su questi temi. Il giudizio
  "aggredibile" riguarda la SERP, non la forza del dominio: al 19/09 risultava con zero keyword
  posizionate.
