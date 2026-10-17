# Area meccanica — artigianato — C030

_Bozza del dossier `processo/fonti-ccnl-gruppo2-area-meccanica.md` (RIC-61). Verifica: 16 ottobre 2026.
Dati strutturati in `dati.json`, copie delle fonti in `fonti/`._

## Identificazione e stato del contratto

- **Archivio CNEL** (archivio corrente scaricato il 16 ottobre 2026): due soli accordi
  C030, entrambi `ultimoAccordoVigente`:
  - **testo definitivo «CCNL Area Meccanica»**, stipula 19 novembre 2024, decorrenza
    1 gennaio 2023, scadenza 31 dicembre 2026 (idAccordo 221687, identificativo 20769,
    ricevuto 24 luglio 2025);
  - **verbale integrativo** dell'ipotesi del 19 novembre 2024, Roma 25 novembre 2024,
    con le tabelle (idAccordo 198588, identificativo 20535).
  Estratto: `area-meccanica-c030-cnel-anagrafica-2026-10-16.json`.
- **Firmatari** (frontespizio del testo definitivo, pp. 1–2): Confartigianato
  Autoriparazione, Metalmeccanica di produzione, Impianti, Orafi, Odontotecnici,
  Restauro; CNA Produzione, Installazione e Impianti, Servizi alla
  comunità/Autoriparatori, Artistico e tradizionale, Benessere e Sanità–SNO;
  Casartigiani; CLAAI / FIOM-CGIL, FIM-CISL, UILM-UIL.
- **Date**: ipotesi firmata il 19 novembre 2024; riserva sindacale sciolta il
  20 dicembre 2024 (comunicazione Fim-Fiom-Uilm riportata dalla sintesi UILM del
  28 gennaio 2025); testo definitivo con la data del 19 novembre 2024, depositato al
  CNEL a luglio 2025. Decorrenza contrattuale 1 gennaio 2023; tranche economiche
  1 dicembre 2024, 1 luglio 2025, 1 marzo 2026, 1 novembre 2026.
- **Stato al 16 ottobre 2026**: vigente. Art. 2 (p. 11): scade il 31 dicembre 2026
  e «continuerà a produrre i suoi effetti anche dopo la scadenza … fino alla data di
  decorrenza del successivo accordo di rinnovo». Nessun accordo successivo in archivio
  CNEL; nessun rinnovo né piattaforma 2027+ nelle pagine UILM nazionale e nelle
  ricerche web del 16 ottobre 2026. L'ultima tranche firmata (1 novembre 2026) è
  futura e determinata.
- **Una tantum**: nessuna. Art. 29 (p. 89): «ad integrale copertura del periodo di
  carenza contrattuale operano i nuovi minimi»; l'AFAC (accordo 21 dicembre 2023) è
  confluito nella retribuzione tabellare dal 1 dicembre 2024.

## Fonti

- [Testo definitivo CCNL Area Meccanica, Roma 19 novembre 2024](https://az-apim-cne-sa-0002-lgc-we.azure-api.net/ricerca-api/ricerca/pubblica/accordi/scarica/accordi/221687),
  Archivio CNEL (deposito delle parti) →
  `area-meccanica-c030-cnel-testo-definitivo-ccnl-2024-11-19.pdf`. 144 pagine,
  **scansione senza testo**: pagine rese con `pdftoppm` e lette a immagine. Lette
  pp. 1–2, 4–8 (frontespizio, parti, indice), 10–11 (artt. 1–2), 19–22 (artt. 7,
  7 bis, 11), 63 (art. 18), 65 (art. 18 bis), 70–74 (artt. 22–25), 87–96 (art. 27
  punto 19 bis, artt. 28, 29, 29 bis, 29 ter, 30), 110–111 (art. 57), 117–118 (art. 64),
  122–124 (art. 70 e scatti del restauro), 128–130 (art. 77), 135 (art. 85), 140 (art. 94).
  Altre pagine viste solo in miniatura per trovare gli articoli. La numerazione stampata
  coincide con quella del PDF. L'API restituisce il PDF in base64 nel campo
  `model.fileContent` (endpoint ricavato da `archiviocontratti.cnel.it/ricerca/main.js`).
- [Verbale integrativo 25 novembre 2024](https://az-apim-cne-sa-0002-lgc-we.azure-api.net/ricerca-api/ricerca/pubblica/accordi/scarica/accordi/198588),
  Archivio CNEL → `area-meccanica-c030-cnel-verbale-integrativo-tabelle-2024-11-25.pdf`.
  5 pagine, scansione, lette tutte: aumenti e retribuzione tabellare per le quattro
  sezioni, protocollo quota contratto. Le tabelle sono identiche a quelle dell'art. 29
  del testo definitivo (pp. 90–92 e 94).
- [Sintesi UILM con le tabelle, 28 gennaio 2025](https://www.uilmnazionale.it/wp-content/uploads/2025/01/20250128-CCNL-Artigianato-area-meccanica-2023-2026-sintesi-contratto.pdf)
  → `area-meccanica-c030-uilm-sintesi-tabelle-2025-01-28.pdf` (testo, letto tutto).
  Firmataria, ma documento distinto: riscontro di tutte le righe.
- [FIM-CISL, info rinnovo 21 novembre 2024](https://www.fim-cisl.it/wp-content/uploads/2024/11/07-Info-Ccnl-2023-26-ARTIGIANATO-rinnovo-2.pdf)
  → `area-meccanica-c030-fim-info-rinnovo-2024-11-21.pdf` (testo, letto tutto): tranche
  al 4° livello per sezione.
- [Verbale integrativo 17 febbraio 2025](https://confartigianatomarcatrevigiana.it/wp-content/uploads/2025/02/CCNL-AREA-MECCANICA-VERB.17.2.25-correzione-preavviso-e-versamento-oossll.pdf),
  copia di Confartigianato Marca Trevigiana →
  `area-meccanica-c030-verbale-integrativo-preavviso-2025-02-17-confartigianatotv.pdf`.
  Letta p. 3 (decorrenza 1 marzo 2025 delle modifiche agli artt. 66 e 88, protocollo
  quota contratto). Pp. 1–2 non lette; il contenuto (preavviso, livello 2 bis, mese di
  versamento) è riassunto dal
  [comunicato Fim-Fiom-Uilm del 18 febbraio 2025](https://www.uilmnazionale.it/wp-content/uploads/2025/02/250218_ARTIGIANI-AREA-MECCANICA_unitario_verbale_integrativo-1.pdf)
  → `area-meccanica-c030-uilm-comunicato-verbale-2025-02-18.pdf`. Nessun effetto
  economico.
- Riscontro indipendente (non firmatario):
  [lavoro-economia.it, scheda C030](https://www.lavoro-economia.it/ccnl/ccnl.aspx?c=419)
  → `area-meccanica-c030-lavoro-economia-tabelle-2026-10-16.html`. Minimi, indennità e
  scatti per le quattro sezioni, senza data di decorrenza: i minimi coincidono con la
  colonna 1 marzo 2026.
- Consultati e **non archiviati**, solo per orientamento: testo CCNL 17 dicembre 2021
  stampato da EBNA (ebat.tn.it; usato per confrontare gli articoli sugli scatti, che il
  rinnovo 2024 ha rinumerato ma non cambiato negli importi); pagina e nota n. 181 di
  Confartigianato Marca Trevigiana sull'accorpamento degli istituti (gennaio 2025).
  Non letti: la scansione dell'ipotesi 19/25 novembre 2024 e le tabelle paghe pubblicate
  da Confartigianato Marca Trevigiana; l'accordo AFAC del 21 dicembre 2023.

## Che cosa è stato riscontrato

### Sezioni

Il testo ha una parte comune e una parte speciale per settore; i settori con
**tabelle proprie e scatti propri** sono quattro. Orario, mensilità e part-time sono
di parte comune.

| Sezione | Livelli | Tabella | Scatti |
|---|---|---|---|
| Metalmeccanica e installazione di impianti | 1Q, 1, 2, 2 bis, 3, 4, 5, 6 (8) | art. 29, p. 90 | artt. 57 e 64 |
| Orafi, argentieri ed affini | 1Q, 1, 2, 3, 4, 5, 6 (7) | art. 29, p. 91 | artt. 70 e 77 |
| Odontotecnica | 1S, 1, 2, 3, 4, 5, 6 (7) | art. 29, p. 92 | artt. 85 e 94 |
| Restauro di beni culturali | QS, Q, 1, 2, 3, 4, 5, 6 (8) | art. 29, p. 94 | art. 70, ultimo comma |

- **Autoriparazione** è confluita nella metalmeccanica: art. 1 punto 4 (p. 10,
  «imprese operanti nei settori dell'assistenza, manutenzione e riparazione dei veicoli,
  di cui alla legge n. 122/1992»: carrozzieri, meccatronici, gommisti, revisioni,
  autolavaggi…). Nessuna tabella propria.
- **Restauro**: si applica a tutti i datori di lavoro del restauro di beni culturali,
  anche non artigiani (Ateco prevalente 91.30.01, art. 1 p. 11), escluse le imprese edili.
  Le norme speciali stanno nella Sezione II «Orafi, Argentieri ed Affini e Restauro».
- Il rinnovo 2024 aggiunge al campo di applicazione la progettazione industriale e di
  macchine (art. 1 punto 9) e le attività subacquee (p. 11).

### Retribuzione

- **Voce unica**: «Retribuzione tabellare», che conglobava già con l'accordo 16 giugno
  2011 paga base, ex contingenza ed EDR (art. 29, «Conglobamento», p. 95). Non ci sono
  contingenza o EDR separati.
- **Quattro tranche** per tutte le sezioni (art. 29, p. 89; tabelle pp. 90–94): 1 dicembre
  2024, 1 luglio 2025, 1 marzo 2026, 1 novembre 2026. Al 4° livello: 50 + 25 + 25 € e
  poi 20 € (metalmeccanica, orafi), **44 €** (restauro), **9 €** (odontotecnica).
  Al 16 ottobre 2026 è vigente la tabella del 1 marzo 2026.
- Ogni tabella stampa aumenti per tranche e retribuzione risultante: la prova
  aritmetica (precedente + aumento = successiva; somma degli aumenti = totale) torna su
  tutte le 30 righe e le 4 tranche.
- Tabelle vigenti (1 marzo 2026) e prossime (1 novembre 2026), €/mese:

| Metalmeccanica | 1Q | 1 | 2 | 2 bis | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|---|---|
| 1/3/2026 | 2.080,91 | 2.080,91 | 1.936,20 | 1.828,24 | 1.758,00 | 1.656,98 | 1.595,91 | 1.521,84 |
| 1/11/2026 | 2.106,03 | 2.106,03 | 1.959,57 | 1.850,31 | 1.779,22 | 1.676,98 | 1.615,17 | 1.540,21 |

| Orafi | 1Q | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|---|
| 1/3/2026 | 2.081,99 | 2.081,99 | 1.939,74 | 1.765,67 | 1.660,64 | 1.596,86 | 1.514,02 |
| 1/11/2026 | 2.107,06 | 2.107,06 | 1.963,10 | 1.786,93 | 1.680,64 | 1.616,09 | 1.532,25 |

| Odontotecnica | 1S | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|---|
| 1/3/2026 | 2.172,40 | 1.964,73 | 1.861,07 | 1.682,32 | 1.584,00 | 1.517,02 | 1.459,60 |
| 1/11/2026 | 2.184,74 | 1.975,89 | 1.871,64 | 1.691,88 | 1.593,00 | 1.525,64 | 1.467,89 |

| Restauro | QS | Q | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|---|---|
| 1/3/2026 | 2.754,48 | 2.754,48 | 2.586,42 | 1.989,37 | 1.848,69 | 1.823,55 | 1.709,27 | 1.632,04 |
| 1/11/2026 | 2.820,94 | 2.820,94 | 2.648,83 | 2.037,37 | 1.893,30 | 1.867,55 | 1.750,51 | 1.671,42 |

  Le tranche 1 dicembre 2024 e 1 luglio 2025 sono in `dati.json`.
- **Indennità fisse nazionali**:
  - metalmeccanica 1Q: **indennità quadri 70 €**; livello 1 con funzioni direttive:
    **50 €** (nota in testa a p. 91 sotto la tabella metalmeccanica; art. 22 «Lavoratori
    con funzioni direttive», p. 71: «Quadri € 70.00; Impiegati con funzioni direttive
    € 50.00»). Il 50 € è un profilo del livello 1, non di tutto il livello;
  - orafi 1Q e 1 con funzioni direttive: stessi importi per l'art. 22, di parte comune (vedi
    «Rilettura dell'art. 22 e degli scatti»);
  - restauro: **50 €** a ogni Quadro Super (nota *) e **I.R.S. 100 €** al solo tecnico
    del restauro senior del livello 4 (nota **), p. 93. Il livello 4 comprende anche gli
    addetti all'amministrazione, che non la ricevono: profilo.
  Le tabelle stampano solo la retribuzione tabellare: per le righe con indennità il
  totale (tabellare + indennità) è derivato.

### Mensilità, orario, part-time

- **13 mensilità** per tutti: art. 29 bis (operai, «gratifica pari a 173 ore di
  retribuzione globale di fatto») e art. 29 ter (impiegati, «tredicesima mensilità
  d'importo ragguagliato all'intera retribuzione globale di fatto»), pp. 95–96, ora in
  parte comune. Con il divisore 173 (art. 28, p. 88) le 173 ore valgono una mensilità.
  La retribuzione globale di fatto comprende tabellare, superminimi, scatti e altri
  elementi retributivi (art. 28): tutte le voci entrano in 13. Nessuna 14ª.
- **40 ore** settimanali per tutte le sezioni (art. 18, p. 63, parte comune), di norma
  su 5 giorni; 6 giorni per impianti e autoriparazione (punti 3 e 4 dell'art. 1). Le
  flessibilità (art. 19–20) non cambiano l'orario contrattuale.
- **Part-time** (art. 24, p. 72): trattamento «riproporzionato sulla base del rapporto
  fra l'orario ridotto ed il corrispondente orario intero». Regola unica.

### Scatti

- **Famiglia `cifraFissa`**: un importo fisso per livello, diverso per sezione, ogni
  **biennio** di anzianità nella stessa azienda, **massimo 5**, «dal primo giorno del
  mese immediatamente successivo a quello in cui si compie il biennio». Il regime vale per
  chi non aveva maturato il primo scatto al 27 novembre 1997 (metalmeccanica), al 7 ottobre
  1998 (orafi) o al 4 dicembre 1998 (odontotecnica). Operai e impiegati della stessa
  sezione hanno gli stessi importi. Nel passaggio di categoria gli scatti maturati si
  adeguano al valore della nuova categoria. Importi immutati rispetto al testo 2021.

| Livello | Metalmeccanica (artt. 57, 64) | Orafi (artt. 70, 77) | Restauro (art. 70) | Odontotecnica (artt. 85, 94) |
|---|---|---|---|---|
| Q / QS / 1Q / 1S | 32,94 (1Q) | 33,57 (1Q) | 32,94 (QS e Q) | 35,43 (1S) |
| 1 | 32,94 | 33,57 | 29,08 | 29,95 |
| 2 | 29,08 | 29,79 | 26,13 | 27,04 |
| 2 bis | 26,13 («Secondo B») | — | — | — |
| 3 | 24,29 | 24,95 | 24,29 | 22,27 |
| 4 | 21,72 | 22,31 | 21,72 | 19,84 |
| 5 | 20,24 | 20,68 | 20,24 | 18,14 |
| 6 | 18,40 | 18,51 | 18,40 | 16,70 |

- I quadri 1Q (metalmeccanica, orafi) hanno lo scatto dell'impiegato di 1° livello: art. 22,
  p. 71, «al quadro trovano applicazione quelli previsti per gli impiegati di 1 livello,
  ivi compresi gli aumenti periodici di anzianità».
- Apprendisti: dal 1 gennaio 2025 scatti di 10 € (art. 27 punto 19 bis, p. 87). Fuori
  perimetro.

### Elementi esclusi dalla RAL

- **Contrattazione regionale**: art. 7 (p. 19), «l'applicazione del contratto collettivo
  nazionale … comporta l'obbligo, per il datore di lavoro, di applicare anche il contratto
  collettivo di lavoro regionale». I CCRL aggiungono elementi propri (per esempio la voce
  regionale veneta citata da Confartigianato Marca Trevigiana). Sono territoriali: esclusi,
  ma la RAL nazionale sottostima chi ha un CCRL con elementi fissi.
- **E.A.R.** (art. 11 punto 4, p. 21): 25 € lordi mensili per 13 mensilità, dovuti solo
  dalle imprese che non aderiscono alla bilateralità e non versano il contributo.
  Condizionato: escluso.
- Contributi EBNA/FSBA (art. 11), San.Arti., Fon.Te.: a carico del datore, esclusi.
- Quota contratto: trattenuta di 30 € sui non iscritti, aprile 2025 (protocollo, p. 95):
  non è retribuzione.

## Riscontro indipendente

- lavoro-economia.it (non firmataria): minimi coincidenti con la colonna 1 marzo 2026
  in **tutte** le righe delle quattro sezioni (es. metalmeccanica 4 = 1.656,98, orafi
  4 = 1.660,64, odontotecnica 4 = 1.584,00, restauro 4 = 1.823,55); indennità 70/50 €
  per metalmeccanica e orafi, 50 € al QS e I.R.S. 100 € al «4 S» del restauro; 13
  mensilità; 5 scatti biennali; divisore 173.
- UILM, sintesi 28 gennaio 2025: tutte le colonne di tutte le sezioni coincidono con il
  verbale del 25 novembre 2024 (es. 1 novembre 2026: metalmeccanica 4 = 1.676,98, restauro
  4 = 1.867,55).
- FIM, 21 novembre 2024: tranche al 4° livello per sezione (50/25/25 e 20/20/44/9 €).

## Discrepanze nella fonte

- **lavoro-economia.it, scatti**: metalmeccanica livello 5 = 20,25 € (testo: 20,24);
  metalmeccanica 2 e 2 bis invertiti (29,08 al 2 bis e 26,13 al 2; il testo dà 29,08 al
  «Secondo» e 26,13 al «Secondo B»); odontotecnica 6 = 16,69 € (testo: 16,70). Vale il
  testo depositato.
- **Testo definitivo, p. 93**: ristampa la tabella del restauro 2022 (QS 2.458,42 …)
  con la clausola di riallineamento del 2022, dopo le tabelle 2024 della stessa sezione
  (p. 94). È un residuo del testo 2021; le note sulle indennità del QS e sull'I.R.S. si
  trovano solo lì.
- Odontotecnica 1S e 6 al 1 marzo 2026 stampati «2172,4» e «1459,6»: solo formato.
- Le pp. 89–94 del testo definitivo e il verbale del 25 novembre 2024 coincidono cifra
  per cifra.

## Limiti dichiarati

- **Tabelle anteriori al 1 dicembre 2024 non modellate**: la colonna «fino al 30 novembre
  2024» comprende l'AFAC (50 € dal 1/12/2023, 46 € dal 1/4/2024 al 4° livello, secondo
  FIM/UILM), il cui accordo del 21 dicembre 2023 non è stato letto. Prima del 1/12/2024
  nessuna tabella applicabile.
- **«Secondo B» = 2 bis**: attribuzione per esclusione (unico livello intermedio fra 2 e 3
  della metalmeccanica); il testo non lo dice in modo esplicito. Riletti gli artt. 57 (p. 111)
  e 64 (pp. 117–118): le tabelle chiamano il livello «Secondo B» senza rinviare al 2 bis.
- **Odontotecnica**: l'indennità di 50 € per funzioni direttive (art. 22) non è
  attribuita a un livello del settore; non modellata.
- **Incidenza delle indennità su 13**: dedotta dalla definizione di retribuzione globale
  di fatto. L'art. 22 aggiunge che l'indennità di funzione «è da considerarsi
  esclusivamente per la definizione dei nuovi minimi tabellari ad esso riferiti»: frase
  di senso non univoco, segnalata.
- Scatti delle norme transitorie (regime percentuale ante 1997/1998, lavoratori in forza
  negli anni '79–'84, importi congelati): non modellati; override del numero disponibile.
- Apprendisti, cottimo, trasferte, reperibilità, maneggio denaro, straordinari e turni:
  esclusi.
- Declaratorie dei livelli (artt. 17–17 quater) non lette per esteso: i nomi dei livelli
  sono i codici, salvo il restauro (qualifiche della tabella a p. 93).

## Rilettura dell'art. 22 e degli scatti (correzione di review, 17 ottobre 2026)

Pagine del testo definitivo rese con `pdftoppm` e lette a immagine: 69–71 (art. 22), 90–91
(tabelle metalmeccanica e orafi), 110–111 (art. 57), 117–118 (art. 64).

- **Art. 22 «Lavoro straordinario, notturno e festivo» è di parte comune.** A p. 69 si apre
  con le regole valide per tutti e il recupero «per le imprese» di ciascun settore
  (metalmeccanica, installazione di impianti, odontotecnica, orafi), poi ha tre paragrafi di
  settore con il titolo sottolineato (metalmeccanica e installazione, orafi, odontotecnico,
  pp. 69–70). Il paragrafo **«Lavoratori con funzioni direttive»** (p. 71) ha un titolo in
  grassetto, non è sotto la voce di un settore e si riferisce a «dette norme contrattuali»,
  cioè all'intero art. 22: «Per tali lavoratori è prevista una indennità mensile di funzione
  pari a: Quadri € 70.00; Impiegati con funzioni direttive € 50.00 … al quadro trovano
  applicazione quelli previsti per gli impiegati di 1 livello, ivi compresi gli aumenti
  periodici di anzianità». Il testo quindi **attribuisce i 70 € e i 50 € anche agli orafi**, che
  hanno il livello 1Q (tabella p. 91). La nota in testa a p. 91 è della tabella metalmeccanica
  e la tabella orafi non ne ha una propria, ma l'attribuzione non dipende dalla nota. La
  riserva sugli orafi è tolta dalle esclusioni; dati e prove invariati.
- **«Secondo B»**: le tabelle degli artt. 57 (p. 111) e 64 (pp. 117–118) elencano Primo,
  Secondo, Secondo B, Terzo … senza dire che il Secondo B è il 2 bis della tabella di p. 90.
  L'attribuzione resta per esclusione e resta fra le esclusioni.

## Nota per l'implementazione

Il modello attuale basta: quattro sezioni con tabelle e scatti propri, scatti
`cifraFissa` biennali (massimo 5, decorrenza mese successivo) con importi per livello
e sezione, 13 mensilità uniformi, 40 ore, profili per il livello 1 con funzioni
direttive (metalmeccanica, orafi) e per il tecnico del restauro senior (I.R.S.), voce
fissa aggiuntiva per 1Q e QS. Totale stampato = sola retribuzione tabellare
(`vociTotalePubblicato:['tabellare']`). Le fixture con il conto per esteso sono in
`dati.json`.

## Come il dataset ricava gli importi (implementazione, 16 ottobre 2026)

- **Sezioni.** Quattro, ognuna con quattro tabelle (1/12/2024, 1/7/2025, 1/3/2026, 1/11/2026) e scatti propri. Autoriparazione confluita nella metalmeccanica, nessuna tabella propria. Prima del 1° dicembre 2024 nessuna tabella: il calcolo si ferma.
- **Minimi.** Le 30 righe per 4 tranche sono quelle di `dati.json`, che la ricerca ha letto sul testo definitivo (art. 29, pp. 90–94) e riscontrato con il verbale del 25 novembre 2024 e la sintesi UILM; i conti a mano delle prove (tranche, estremi, aumenti al 4° livello) sono stati rifatti dall'implementazione sulle tabelle stampate nel dossier.
- **Totale.** Voce unica «retribuzione tabellare»: `totalePubblicato` = tabellare e `vociTotalePubblicato:['tabellare']`. Dove c'è un'indennità fissa (1Q, QS) il totale derivato del livello è tabellare + indennità e la riga riconcilia lo stesso.
- **Voci fisse dirette** dove il livello coincide con la qualifica: indennità quadri 70 € al 1Q (metalmeccanica, orafi), 50 € al QS del restauro. **Profili** dove dipende dalla funzione: 50 € di funzioni direttive al livello 1 (metalmeccanica, orafi), I.R.S. 100 € al livello 4 del restauro (tecnico del restauro senior).
- **Mensilità.** 13 per tutte le voci, indennità e profili compresi (art. 28: retribuzione globale di fatto); nessuna quota a parte, identità semplice.
- **Scatti.** Cifra fissa biennale, massimo 5, dal mese successivo, importo per livello e per sezione, uguale in ogni tranche; il 1Q ha lo scatto del livello 1 (art. 22). Dove la fonte secondaria differisce (metalmeccanica 5, 2 e 2 bis; odontotecnica 6) vale il testo depositato.
- **Part-time.** Riproporzione sulle 40 ore (art. 24) di ogni voce, profili e scatti compresi; superminimo non riproporzionato.
- **Orafi.** Il 70/50 € è applicato come da art. 22, di parte comune (riletto il 17 ottobre 2026, pp. 69–71): nessuna riserva nelle esclusioni. **Odontotecnica:** i 50 € di funzioni direttive non sono modellati, dichiarato nelle esclusioni.
- **Esclusioni** nel dataset (la prima è il CCRL regionale, obbligatorio: la cifra nazionale può essere più bassa della retribuzione dovuta): E.A.R., bilateralità e fondi, quota contratto, odontotecnica, «Secondo B», incidenza delle indennità, scatti transitori, apprendisti/AFAC/tabelle antecedenti, maggiorazioni, part-time.
- **Fonte archiviata.** Il testo definitivo CNEL (19 MB, scansione) è in `processo/dati/fonti/area-meccanica-c030-cnel-testo-definitivo-ccnl-2024-11-19.pdf`.
- **Estensioni del modello:** nessuna. `ralCompleta` è vera (nessuna quota annua mancante).
