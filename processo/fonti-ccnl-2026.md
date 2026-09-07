# Fonti contrattuali per il generatore CCNL → RAL

_Verifica del 7 settembre 2026. Questa nota dice da dove viene ogni numero del
dataset in `prototipo/retribuzione-ccnl.js`, che cosa è stato riscontrato sul
testo e che cosa resta dichiarato come limite._

## Conclusione

I minimi e gli scatti dei due CCNL coperti sono verificabili su documenti
pubblicati dalle **organizzazioni sindacali firmatarie**, che sono parte del
contratto. Non esiste una fonte leggibile da una macchina: il CNEL pubblica
open data, ma sono metadati sui contratti — anagrafica, parti, vigenze — e le
pagine dei minimi tabellari rispondono 404. La trascrizione è quindi a mano,
con lo stesso metodo delle addizionali: file scaricato, conservato in
`processo/dati/fonti/`, datato, e una prova che riconcilia le voci con il
totale pubblicato prima che il numero entri nel motore.

Il rischio di manutenzione è reale e va detto: **nessuna delle due tabelle sta
sul sito della parte datoriale.** Federmeccanica pubblica l'ipotesi di accordo,
non le tabelle; Confcommercio nazionale non le espone e le associazioni
territoriali pubblicano versioni con il terzo elemento *provinciale*, che non è
la base nazionale. L'aggiornamento non è «ricontrolla due URL stabili».

## Terziario, Distribuzione e Servizi — Confcommercio, H011

- [Testo coordinato pubblicato da Filcams CGIL](https://cgil-agb.it/images/Filcams/pdf/commercio/TERZIARIO_confcommercio.pdf) —
  copia in `processo/dati/fonti/filcams-ccnl-terziario-testo-coordinato-2026-09-07.pdf`.
  Filcams è firmataria. Da qui vengono le tabelle dei minimi per decorrenza e il
  testo degli aumenti periodici di anzianità.
- [Accordo di rinnovo 22 marzo 2024](https://ce-mu.it/rapportolavoro/contratti/cms_magazine/uploads/CommercioConfcommercio_AccordoRinnovo_22.3.2024.pdf) —
  copia in `processo/dati/fonti/accordo-rinnovo-terziario-2024-03-22.pdf`.
  L'art. 213 elenca le sei tranche di aumento e le loro decorrenze: è il
  documento che spiega *perché* il dataset ha tre decorrenze e non una.

### Che cosa è stato riscontrato

- **Dieci livelli, non otto.** Oltre a Quadro e I–VII ci sono gli operatori di
  vendita di 1ª e 2ª categoria, con tabella e scatti propri. Le fonti
  divulgative ne contano otto.
- **Il totale è pubblicato dal contratto.** La colonna `TOTALE` esiste: non la
  calcoliamo noi. La scomposizione resta accanto per poterla mostrare, e una
  prova verifica che le due cose coincidano su tutte e 30 le righe.
- **Due voci diverse che si somigliano.** L'indennità di funzione di 260,76 €
  spetta al solo Quadro; l'elemento aggiuntivo della paga base di 5,16 € spetta
  al solo 7° livello. Non sono la stessa voce e non vanno chiamate allo stesso
  modo.
- **Il terzo elemento del dataset è quello nazionale, 2,07 €.** La tabella di
  Confcommercio Vicenza usa il terzo elemento provinciale (6,20 €) e produce
  totali più alti — per il Quadro 2.990,42 € contro i 2.986,29 € nazionali.
  Sono numeri corretti per Vicenza e sbagliati come base nazionale.
- **Scatti: dieci, triennali.** Importi fissati in cifra dal 1° gennaio 1990 e
  non toccati dal rinnovo 2024, quindi indipendenti dalla decorrenza:
  Q 25,46 · 1° 24,84 · 2° 22,83 · 3° 21,95 · 4° 20,66 · 5° 20,30 · 6° 19,73 ·
  7° 19,47. Operatori di vendita: 1ª categoria 15,50 €, 2ª categoria 14,46 €.
  L'anzianità è quella **di servizio presso la stessa azienda o gruppo**, e
  l'aumento decorre dal primo giorno del mese successivo a quello in cui si
  compie il triennio.
- **Orario normale 40 ore settimanali**, distribuito su 5 o 6 giorni.
- **Quattordici mensilità**, confermate anche dal testo dell'accordo di rinnovo.

### Decorrenze nel dataset

| Decorrenza | Che cos'è | Stato al 7 settembre 2026 |
|---|---|---|
| 1° novembre 2025 | quarta tranche | **in vigore** |
| 1° novembre 2026 | quinta tranche | firmata, futura |
| 1° febbraio 2027 | sesta e ultima tranche | firmata, futura |

Le tranche future sono già firmate e già pubblicate: stanno nel dataset perché
il dato esiste, non perché lo si stimi. `tabellaVigente()` sceglie l'ultima
decorrenza non successiva alla data, quindi la pagina cambia da sola il 1°
novembre 2026 senza che nessuno tocchi il codice.

## Industria Metalmeccanica e Installazione Impianti — C011

- [Pubblicazione FIM CISL del 15 giugno 2026](https://www.fim-cisl.it/2026/06/15/ccnl-federmeccanica-assistal-2025-2028-nuovi-minimi-tabellari-giugno-2026/).
  FIM è firmataria. Riporta minimi, aumenti e scatti per livello con decorrenza
  1° giugno 2026.

### Che cosa è stato riscontrato

- **Importo unico per livello**: il contratto non scompone la retribuzione come
  fa il Terziario. Lo schema del dataset tiene entrambe le forme invece di
  normalizzarne una via.
- **Scatti: cinque, biennali**, sull'anzianità di servizio presso la stessa
  azienda o gruppo, con decorrenza dal primo giorno del mese successivo al
  compimento del biennio. Dal 1° febbraio 2008 il passaggio a categoria
  superiore conserva anzianità e numero di scatti, rivalutandone l'importo a
  quello della categoria di arrivo.
- **Orario normale 40 ore settimanali** (art. 5), **tredici mensilità**.
- **L'adeguamento è per indice IPCA-NEI**, non solo per rinnovo: quest'anno
  1,9% ISTAT contro il 2,46% contrattualizzato. La prossima decorrenza non è
  ancora firmata, quindi il dataset ha una sola tabella.

### L'elemento perequativo resta fuori

I 485 € spettano a chi non ha contrattazione aziendale **né** superminimo
individuale, e **in quota parte** a chi ha un superminimo annuo inferiore a
485 €. La condizione non è quindi «superminimo zero», ed è la correzione a
un'affermazione più grossolana fatta in sede di design. Dipende da fatti
aziendali che il calcolatore non conosce: sta fuori dal totale e dentro
l'elenco delle esclusioni mostrato all'utente.

## Il part-time

**Nessuno dei due CCNL detta una regola propria di riproporzionamento**, né per
il minimo né — ed è la domanda che ci si era posti — per gli scatti. La
proporzione discende dall'[art. 7 c. 1 del D.Lgs. 81/2015](https://www.normattiva.it/eli/stato/DECRETO%20LEGISLATIVO/2015/06/15/81/CONSOLIDATED),
per cui il trattamento economico del lavoratore a tempo parziale è
riproporzionato alla ridotta entità della prestazione. Gli scatti sono
retribuzione, quindi seguono la stessa regola: il dataset non inventa una
disciplina contrattuale che non esiste, cita quella di legge.

Il superminimo no: è l'importo che l'utente dichiara di percepire **già** al
proprio orario, e ridurlo lo conterebbe part-time due volte.

## Che cosa non è verificato, e resta dichiarato

- **Le eccezioni storiche sulla decorrenza dell'anzianità.** Il Terziario fa
  partire l'anzianità utile dal 1° aprile 1987 (dal 1° giugno 1995 per gli
  operatori di vendita) per chi era già assunto e aveva compiuto 21 anni. Sono
  regole che riguardano chi ha oltre trent'anni di servizio, cioè chi è comunque
  al tetto dei dieci scatti: il calcolatore non le modella e il caso resta
  coperto dal tetto.
- **Lo scarto di un mese.** Entrambi i contratti fanno decorrere lo scatto dal
  primo giorno del mese successivo alla maturazione. Il calcolatore ragiona ad
  anni compiuti e non modella quel mese. È scritto nella pagina.
- **Le eccezioni all'orario ordinario nel Terziario.** Il testo prevede casi a
  45 ore settimanali per lavorazioni particolari. Il dataset copre il caso
  generale a 40 ore e non pretende di coprire quelli.
- **Il terzo elemento provinciale.** È escluso e dichiarato: dove la
  contrattazione territoriale ne prevede uno più alto, il minimo effettivo sta
  sopra la base nazionale.
- **La ricostruzione dell'anzianità convenzionale** — passaggi di livello,
  servizio pregresso, periodi in somministrazione — resta fuori scope. Da qui
  il campo che permette di dichiarare direttamente il numero di scatti già
  maturati.

## Manutenzione

La prossima scadenza è il **1° novembre 2026**, ed è già nel dataset: non
richiede intervento. Le due da presidiare sono la tranche del **1° febbraio
2027**, anch'essa già dentro, e soprattutto il prossimo adeguamento IPCA-NEI
della Metalmeccanica, che non è ancora pubblicato. Alla scadenza del Terziario
— 31 marzo 2027 — il rinnovo successivo rifà tutte le tabelle.

Quando si aggiorna: scaricare il documento della parte firmataria, conservarlo
in `processo/dati/fonti/` con la data, aggiornare `VERSIONE_DATASET` e
`verificataIl`, e lasciare che la prova di riconciliazione dica se la
trascrizione tiene.
