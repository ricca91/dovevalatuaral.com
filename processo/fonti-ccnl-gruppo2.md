# Fonti contrattuali — CCNL gruppo 2 (RIC-61)

_Dossier aperto il 16 ottobre 2026. Stesso metodo di `processo/fonti-ccnl-gruppo1.md`:
documento della parte firmataria, copia in `processo/dati/fonti/`, riconciliazione in
prova. Ogni contratto ha un dossier proprio, linkato qui sotto; questo file tiene
l'identificazione comune e la matrice di copertura._

## Identificazione CNEL

Fonte: open data dell'Archivio CNEL, archivio corrente scaricato il 16 ottobre
2026 (`archivio_corrente20261016.json`, 2.288 accordi). L'estratto dei soli codici
usati è in
`processo/dati/fonti/cnel-archivio-corrente-estratto-gruppo2-2026-10-16.json`.
I codici sono letti da lì, filtrando per parti firmatarie e non per nome del
settore: per ogni settore l'archivio porta anche contratti di altre sigle.

| Contratto | Codice | Ultimo accordo in archivio (stipula → decorrenza, scadenza) | Firmatari | Dossier |
|---|---|---|---|---|
| Area meccanica — artigianato | C030 | testo definitivo 19 nov 2024 → 1 gen 2023, 31 dic 2026; verbale integrativo 25 nov 2024 | Confartigianato (metalmeccanica di produzione, impianti, odontotecnici, orafi, autoriparazione), CNA (produzione, installazione e impianti, SNO, autoriparatori, artistico e tradizionale), Casartigiani, CLAAI / FIM, FIOM, UILM | `fonti-ccnl-gruppo2-area-meccanica.md` |
| Industria alimentare | E012 | verbale di stesura 28 ott 2024 del rinnovo 1 mar 2024 → 1 dic 2023, 30 nov 2027 | associazioni di Federalimentare (Assolatte, Assitol, Anicav, Assica, Assocarni, Unionfood, Assobirra, Assobibe, Federvini, Mineracqua e altre) / FAI, FLAI, UILA | `fonti-ccnl-gruppo2-alimentare.md` |
| Chimico-farmaceutico — industria | B011 | ipotesi di rinnovo 15 apr 2025 → 1 lug 2025, 30 giu 2028 | Federchimica, Farmindustria / Filctem, Femca, Uiltec | `fonti-ccnl-gruppo2-chimico.md` |
| Gomma, cavi elettrici e plastica — industria | B371 | ipotesi di rinnovo 10 dic 2025 → 1 gen 2026, 31 dic 2028, riserva sciolta il 30 gen 2026; sottoscrizione per adesione di FAILC Confail 9 gen 2026 | Federazione Gomma Plastica, AIRP / Filctem, Femca, Uiltec | `fonti-ccnl-gruppo2-gomma-plastica.md` |
| Credito — ABI, quadri direttivi e aree professionali | J241 | testo definitivo 14 lug 2025 del rinnovo 23 nov 2023 → 23 nov 2023, 31 mar 2026 | ABI / FABI, First CISL, Fisac CGIL, Uilca, Unisin | `fonti-ccnl-gruppo2-credito-abi.md` |

Esclusi per perimetro, pur presenti in archivio con nomi simili: la piccola e media
industria alimentare Unionalimentari Confapi (E018), l'Area alimentazione-panificazione
artigiana (E015), la chimica PMI Unionchimica Confapi (B018), i dirigenti ABI (J251)
e il credito cooperativo Federcasse (J271, J281).

Due segnali dall'anagrafica, verificati sulle fonti:

- **Credito ABI J241**: scaduto il 31 marzo 2026, nessun rinnovo firmato al 16 ottobre
  2026. I verbali del 31 marzo e del 16 luglio 2026 sospendono i termini fino al 31
  dicembre 2026 e il CCNL 23 novembre 2023 si applica per intero; un accordo futuro potrà
  decorrere dal 1° aprile 2026, con arretrati. Nessun aumento anticipato.
- **Area meccanica C030**: vigente fino al 31 dicembre 2026, poi ultrattività (art. 2);
  nessun rinnovo né accordo economico successivo.

L'identificazione è stata riletta contratto per contratto nei dossier. Nessun rinnovo
firmato dopo il 12 settembre 2026 per nessuno dei cinque.

## Matrice di copertura

Dataset al 16 ottobre 2026 (`VERSIONE_DATASET`). Le righe sono le combinazioni sezione ×
decorrenza × livello riconciliate dall'invariante di `retribuzione-ccnl.test.js`; ogni
livello di ogni sezione arriva a RAL e netto nella prova d'integrazione con il motore.

| Contratto | ID | Sezioni e livelli | Decorrenze nel dataset | Mensilità, ore, scatti | Fonte principale | Prove | Esclusioni e limiti principali |
|---|---|---|---|---|---|---|---|
| Area meccanica — artigianato (C030) | `area-meccanica-artigianato-c030` | metalmeccanica e impianti (1Q, 1, 2, 2 bis, 3–6), orafi (1Q, 1–6), odontotecnica (1S, 1–6), restauro (QS, Q, 1–6); 120 righe | 1.12.2024, 1.7.2025, 1.3.2026 vigente, 1.11.2026 firmata | 13; 40; cifra fissa per sezione, biennali, max 5 | testo definitivo 19.11.2024 e verbale integrativo tabelle 25.11.2024, deposito CNEL | `…gruppo2-area-meccanica.test.js`, 33 | CCRL regionali obbligatori non inclusi; E.A.R. per chi è fuori dalla bilateralità; 50 € di funzioni direttive dell'odontotecnica non modellati; tabelle prima del dicembre 2024 (AFAC) |
| Industria alimentare (E012) | `alimentare-industria-e012` | parte comune (1S, 1, 2, 3A, 3–6), olearia e margariniera oltre 40 dipendenti (1–10); 108 righe | 1.12.2023, 1.9.2024, 1.1.2025, 1.1.2026 vigente, 1.1.2027, 1.9.2027 (solo IAR) | 14, EDR su 13; 40; cifra fissa, biennali, max 5 | CCNL 2023–2027, testo FAI CISL e FLAI CGIL | `…gruppo2-alimentare.test.js`, 22 | 14ª ridotta dell'olearia fino a 40 dipendenti; art. 51 bis e premio per obiettivi; premi di settore; indennità di funzione e quadri olearia su 14 per assunzione |
| Chimico-farmaceutico — industria (B011) | `chimico-farmaceutico-industria-b011` | categorie A–F con posizioni organizzative (15 righe); 105 righe | 1.1.2024, 1.7.2024, 1.7.2025, 1.12.2025, 1.7.2026 vigente, 1.7.2027, 1.6.2028 | 13; 40 come base del part-time (orario medio 37 h 45'); scatti assenti dal 2010 | ipotesi 15.4.2025, p. 48, sciolta il 4.6.2025 | `…gruppo2-chimico.test.js`, 20 | fibre, abrasivi, lubrificanti e GPL; Fonchim, Faschim, welfare; EAR assorbibile non simulato; scatti congelati al 2009 da indicare nel superminimo |
| Gomma, cavi elettrici e plastica — industria (B371) | `gomma-plastica-industria-b371` | una scala, 10 livelli (Q, A–I); 70 righe | 1.1.2023, 1.1.2024, 1.4.2025, 1.1.2026 vigente, 1.4.2027, 1.4.2028, 1.12.2028 | 13; 40; cifra fissa, biennali, max 5 | ipotesi 10.12.2025, art. 17 c.3, deposito CNEL (riserva sciolta il 30.1.2026); rinnovo 2023 e stesura 2020, depositi CNEL | `…gruppo2-gomma-plastica.test.js`, 12 | indennità sostitutiva del premio di risultato; Fondo Gomma Plastica e FASG&P; indennità dei Quadri assorbibile non simulata; testo coordinato 2026 riservato, non letto |
| Credito — ABI, aree professionali e quadri (J241) | `credito-abi-j241` | aree e QD1–QD2 (QD2, QD1, 3ª area 4–1, Area unificata), QD3–QD4; 9 righe | 1.3.2026 vigente; nessuna tranche futura firmata | 13; 37; primo scatto dopo 4 anni, poi ogni 3, dal primo del mese di maturazione, anzianità sospesa 1.1.2013–31.7.2014, max 8 o 7 | testo coordinato CCNL 23.11.2023, Allegato 2 | `…gruppo2-credito-abi.test.js`, 14, più le prove delle regole nuove in `retribuzione-ccnl-modello.test.js` | tabelle 2023–2025 non nel dataset (base del part-time a 37,5 ore fino al 2025); 12 scatti per chi era in servizio nel 1994; VAP, buono pasto, art. 8; orario dei quadri assunto a 37 ore |

`retribuzione-ccnl-gruppo2.test.js` prova il gruppo nell'insieme: diciannove codici CNEL
distinti, dossier e fonte archiviata per ciascuno, RAL completa su ogni sezione, e le regole
nuove degli scatti dichiarate dal solo Credito ABI.
