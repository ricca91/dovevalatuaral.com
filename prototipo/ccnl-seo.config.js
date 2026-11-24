/* ------------------------------------------------------------
   CONFIGURAZIONE SEO DELLE PAGINE CCNL (RIC-59, RIC-231)

   Solo dati: quali pagine esistono, come si chiamano, quali metadata
   hanno gli override (RIC-215). Nessun require di dataset, motore,
   template o generatore: lo leggono sitemap/seo, genera-articoli.js e
   i test senza caricare niente di pesante. Gli importi vivono altrove.

   Le pagine per livello non sono una per riga del dataset (sarebbero
   233): esistono solo dove la domanda è misurata. Volumi DataForSEO,
   Italia, del 6 settembre (Commercio, Metalmeccanica) e del 22
   settembre 2026 (gli altri), nel commento di RIC-59.

   Slug e title seguono come la gente scrive la query:
   «5 livello ccnl commercio», «livello c3 metalmeccanico»,
   «livello d2 cooperative sociali». Niente «stipendio» negli slug.
   ------------------------------------------------------------ */

const numerico=codice=>`${codice.toLowerCase()}-livello`;
const lettera=codice=>`livello-${codice.toLowerCase()}`;
/* Solo i codici numerici prendono «°»: Quadro, Quadri e operatori di
   vendita, che compaiono fra i livelli accanto, usano il nome del
   dataset invece di «Q° livello» o «OV1° livello» (RIC-140). */
const livelloN=l=>/^\d+S?$/i.test(l.codice)
  ?`${l.codice.replace(/S$/i,'')}° livello${/S$/i.test(l.codice)?' super':''}`:l.nome;
const livelloL=l=>`Livello ${l.codice}`;

// RIC-215: metadata specifici per le sole pagine selezionate.
const SEO_OVERRIDE=Object.freeze({
  "/minimi-ccnl/studi-professionali/4s-livello/": {title:"4° livello super Studi professionali 2026: stipendio netto",description:"4° livello super CCNL Studi professionali: 1.654,70 € lordi al mese su 14 mensilità, RAL 23.165,80 € e circa 1.390 € netti al mese, senza scatti."},
  "/minimi-ccnl/studi-professionali/": {title:"CCNL Studi Professionali 2026: tabelle e aumento di dicembre",description:"Tabelle retributive CCNL Studi professionali Confprofessioni: minimo lordo, RAL e netto al mese per livello, con i nuovi minimi dal 1° dicembre 2026."},
  "/minimi-ccnl/cooperative-sociali/": {title:"CCNL Cooperative Sociali 2026: tabelle da A1 a F2 e netto",description:"Tabelle retributive CCNL Cooperative sociali (T151): minimo lordo, RAL su 13,5 mensilità e netto al mese per ogni posizione, da A1 a F2, E2 compresa."},
  "/minimi-ccnl/multiservizi/": {title:"CCNL Multiservizi e Pulizie 2026: minimi e netto per livello",description:"Tabelle retributive CCNL Multiservizi e pulizie dal 1° ottobre 2026 e da maggio 2027: minimo lordo, RAL e netto al mese dal 1° livello al Quadro."},
  "/minimi-ccnl/dmo/": {title:"CCNL DMO Distribuzione Moderna 2026: tabelle e netto",description:"Tabelle retributive CCNL DMO Federdistribuzione dal 1° novembre 2026: minimo lordo, RAL e netto al mese per ogni livello, 5° compreso, e aumenti 2027."},
  "/minimi-ccnl/pubblici-esercizi/": {title:"CCNL Pubblici Esercizi FIPE 2026: stipendi per livello",description:"Tabelle retributive CCNL FIPE per bar, ristoranti, ristorazione collettiva e turismo: minimo lordo, RAL e netto al mese per livello, con gli aumenti 2027."},
  "/minimi-ccnl/logistica/": {title:"CCNL Trasporti e Logistica 2026-2027: tabelle retributive",description:"Tabelle retributive CCNL Logistica, trasporto merci e spedizione 2026 e dal 1° gennaio 2027: minimo lordo, RAL e netto al mese per livello, rider inclusi."},
  "/minimi-ccnl/commercio/": {title:"CCNL Commercio 2026: tabelle retributive e netto per livello",description:"Tabelle retributive CCNL Commercio dal 1° novembre 2026 e aumenti di febbraio 2027: minimo lordo, RAL e netto al mese per i 10 livelli, con fonte."},
});

const CONTRATTI_SEO=Object.freeze([
  {id:'terziario-confcommercio-h011',slug:'commercio',breve:'Commercio',query:'CCNL Commercio',
    titoloTabella:'CCNL Commercio',livelli:['Q','1','2','3','4','5','6','7'],
    slugLivello:codice=>codice==='Q'?'quadro':numerico(codice),
    etichetta:l=>l.codice==='Q'?l.nome:livelloN(l)},
  {id:'metalmeccanica-industria-c011',slug:'metalmeccanico',breve:'Metalmeccanico',query:'metalmeccanico',
    titoloTabella:'CCNL Metalmeccanico',livelli:['D1','D2','C1','C2','C3','B1','B2','B3','A1'],
    slugLivello:lettera,etichetta:livelloL},
  {id:'pubblici-esercizi-fipe-h05y',slug:'pubblici-esercizi',breve:'Pubblici esercizi',
    /* Senza pagine FIPE dedicate, i livelli non devono aprire il dettaglio
       di un contratto diverso, anche se questo contiene un confronto. */
    titoloTabella:'CCNL Pubblici esercizi (FIPE)'},
  {id:'turismo-federalberghi-h052',slug:'turismo',breve:'Turismo',query:'CCNL Turismo',
    titoloTabella:'CCNL Turismo',livelli:['3','4','5','6'],slugLivello:numerico,etichetta:livelloN,
    sezioneLivelli:'generale',
    /* «ccnl turismo 5 livello» lo scrive anche chi lavora in un bar:
       il FIPE si chiama «Pubblici esercizi… e turismo». La pagina per
       livello mostra i due contratti affiancati invece di sceglierne uno. */
    affianca:{id:'pubblici-esercizi-fipe-h05y',sezione:'generale'}},
  /* Agenzie di viaggi e tour operator hanno un contratto proprio,
     non quello degli alberghi. Solo la tabella: la domanda per livello
     non è misurata. */
  {id:'agenzie-viaggi-fiavet-h04z',slug:'agenzie-di-viaggio',breve:'Agenzie di viaggio',
    titoloTabella:'CCNL Agenzie di viaggio e tour operator'},
  /* Solo i livelli 3°, 4°, 5° e 6° del personale non viaggiante, gli unici con
     query misurate (DataForSEO, Italia, 16 ottobre 2026: «5 livello ccnl
     logistica» 10, «ccnl logistica 5 livello» 30, «ccnl logistica 6
     livello» 30, «ccnl logistica 4 livello» 20, «ccnl logistica 3
     livello» 10; volumi bassi, ma sono le uniche misurate). Il 1° e il 2°
     non risultano; 3° super, 4° junior, Quadri e i codici del viaggiante
     (C3, B3, rider I/L...) non hanno volume o sono parametri. */
  {id:'logistica-trasporto-merci-i100',slug:'logistica',breve:'Logistica',query:'CCNL Logistica',
    titoloTabella:'CCNL Logistica e trasporto merci',livelli:['3°','4°','5°','6°'],
    sezioneLivelli:'non-viaggiante',
    slugLivello:codice=>`${codice.replace('°','')}-livello`,etichetta:l=>l.nome},
  {id:'multiservizi-pulizia-k511',slug:'multiservizi',breve:'Multiservizi',query:'CCNL Multiservizi',
    titoloTabella:'CCNL Multiservizi e pulizie',livelli:['1','2','3','4','5','6'],slugLivello:numerico,
    etichetta:livelloN},
  {id:'studi-professionali-confprofessioni-h442',slug:'studi-professionali',breve:'Studi professionali',
    query:'CCNL Studi professionali',titoloTabella:'CCNL Studi professionali',
    livelli:['1','2','3','4','4S','5'],slugLivello:numerico,etichetta:livelloN},
  {id:'cooperative-sociali-t151',slug:'cooperative-sociali',breve:'Cooperative sociali',
    query:'cooperative sociali',titoloTabella:'CCNL Cooperative sociali',
    livelli:['A1','A2','B1','C1','C2','C3','D1','D2','D3','E1','E2','F1','F2'],slugLivello:lettera,etichetta:livelloL},
  {id:'distribuzione-moderna-federdistribuzione-h008',slug:'dmo',breve:'DMO',
    query:'CCNL DMO',titoloTabella:'CCNL DMO, distribuzione moderna',
    /* DMO ha livelli e importi propri, diversi dal Commercio: le query
       «5 livello ccnl commercio» restano alle pagine Commercio. Qui solo
       le query che citano DMO (DataForSEO Italia, 12 mesi a settembre
       2026: «ccnl dmo 5 livello» 50, «3 livello» 20, «1 livello» 20,
       «4 livello» 10). Nessun dato per 2°, 6°, 7°, Quadro, OV. */
    livelli:['1','3','4','5'],slugLivello:numerico,etichetta:livelloN},
  {id:'metalmeccanica-pmi-confapi-c018',slug:'metalmeccanico-confapi',breve:'Metalmeccanico Confapi',
    titoloTabella:'CCNL Metalmeccanico Confapi',
    /* RIC-228: aumenti letti dal dataset, FAQ e data come gli altri contratti. */
    aumentiDalDataset:true},
  {id:'grafici-editori-g011',slug:'grafici-editoriali',breve:'Grafici editoriali',
    titoloTabella:'CCNL Grafici editoriali'},
  {id:'poligrafici-quotidiani-g041',slug:'poligrafici',breve:'Poligrafici',
    titoloTabella:'CCNL Poligrafici'},
  {id:'vetro-lampade-display-b132',slug:'vetro',breve:'Vetro',titoloTabella:'CCNL Vetro'},
  /* Gruppo 2 (RIC-61). Slug della tabella sulla formulazione più
     cercata (DataForSEO, Italia, 16 ottobre 2026): «ccnl metalmeccanico
     artigiano» 2.900 contro «ccnl area meccanica» 30; «ccnl industria
     alimentare» 3.600 contro «ccnl alimentare» 720; «ccnl chimico
     farmaceutico» 2.900 contro «ccnl chimico» 880; «ccnl gomma plastica»
     2.400; «ccnl bancari» 4.400 contro «ccnl credito» 3.600 e «ccnl abi»
     880.
     Pagine per livello (RIC-140) dove la domanda sul netto è misurata
     (DataForSEO Labs, Italia, media 12 mesi, 21 ottobre 2026):
     «5 livello metalmeccanico artigiano stipendio netto» 390, «4 livello»
     170, «3 livello» 140, «6 livello» 110 (al 20 ottobre «2° netto» 40),
     «livello 2 bis metalmeccanico artigiano» 30, per cui lo slug è
     `livello-2-bis`; «livello h gomma plastica stipendio netto» 260,
     «livello f» 210, «livello h gomma plastica» 170; «livello e3 chimico
     stipendio netto» 210, «livello e4» 170, «livello d3 chimico
     farmaceutico» 110; «stipendio netto bancario 3 area 4 livello» 70,
     «quadro direttivo 4 livello bancario netto» 70, «quadro direttivo 1
     livello bancario» 40; «stipendio netto 3 livello industria
     alimentare» 110, «5 livello alimentare industria» 70, «6 livello» 50.
     Gli altri livelli restano solo in tabella finché GSC non mostra
     impressioni (RIC-137).
     `etichetta` serve anche ai livelli accanto, che non hanno pagina:
     copre ogni codice del contratto, senza «2bis°» o «1Q°». */
  {id:'area-meccanica-artigianato-c030',slug:'metalmeccanico-artigiano',breve:'Metalmeccanico artigiano',
    query:'CCNL Metalmeccanico artigiano',titoloTabella:'CCNL Metalmeccanico artigiano',
    livelli:['5','4','3','6','2','2bis'],
    /* Orafi, odontotecnica e restauro hanno gli stessi codici ma importi
       propri: le loro righe restano senza link. */
    sezioneLivelli:'metalmeccanica-impianti',
    slugLivello:codice=>codice==='2bis'?'livello-2-bis':numerico(codice),
    etichetta:l=>/^\d+$/.test(l.codice)?livelloN(l)
      :{'2bis':'Livello 2 bis','1Q':'Quadro (1Q)','1S':'1° livello super','QS':'Quadro super','Q':'Quadro'}[l.codice]||livelloL(l),
    /* RIC-141: aumenti letti dal dataset (vedi trancheDalDataset). */
    aumentiDalDataset:true},
  {id:'alimentare-industria-e012',slug:'industria-alimentare',breve:'Industria alimentare',
    query:'CCNL Industria alimentare',titoloTabella:'CCNL Industria alimentare',
    livelli:['3','5','6'],
    /* L'olearia ha anche il 3°, il 5° e il 6°, con importi propri: le
       pagine mostrano la sola parte comune. */
    sezioneLivelli:'alimentare',slugLivello:numerico,
    etichetta:l=>/^\d+$/.test(l.codice)?livelloN(l):livelloL(l),
    aumentiDalDataset:true},
  {id:'chimico-farmaceutico-industria-b011',slug:'chimico-farmaceutico',breve:'Chimico farmaceutico',
    query:'CCNL Chimico farmaceutico',titoloTabella:'CCNL Chimico farmaceutico',
    livelli:['E3','E4','D3','E2','D1','C2','E1','B1','A3'],slugLivello:lettera,etichetta:livelloL,
    aumentiDalDataset:true},
  {id:'gomma-plastica-industria-b371',slug:'gomma-plastica',breve:'Gomma plastica',
    query:'CCNL Gomma plastica',titoloTabella:'CCNL Gomma plastica',
    livelli:['H','F','G','E','C','I','A'],slugLivello:lettera,
    etichetta:l=>l.codice==='Q'?'Quadri':livelloL(l),
    aumentiDalDataset:true},
  /* Niente `sezioneLivelli`: QD4 sta nella sezione dei quadri direttivi
     di 3° e 4° livello, gli altri tre in quella delle aree e dei quadri
     di 1° e 2°; datiLivello tiene solo la sezione dove il codice esiste. */
  {id:'credito-abi-j241',slug:'bancari',breve:'Bancari',query:'CCNL Bancari',titoloTabella:'CCNL Bancari (ABI)',
    livelli:['3A4','3A3','QD4','QD1'],
    slugLivello:codice=>codice.replace(/^QD(\d)$/,'quadro-direttivo-$1-livello').replace(/^3A(\d)$/,'3-area-$1-livello'),
    etichetta:l=>l.codice==='AU'?'Area unificata'
      :l.codice.replace(/^QD(\d)$/,'Quadro direttivo $1° livello').replace(/^3A(\d)$/,'3ª area $1° livello'),
    /* RIC-143: «rinnovo contratto bancari» è la domanda più grande del
       gruppo 2 e arriva il giorno della firma. Title e H1 lo dicono;
       l'anno resta al template (RIC-105). Gli aumenti si leggono dal
       dataset: oggi nessuno, perché la sola tabella del J241 non ha un
       prima; alla firma bastano le nuove tranche in TABELLE_ABI. */
    codaTitolo:'tabelle, netto e rinnovo',codaH1:'tabelle retributive e rinnovo',
    aumentiDalDataset:true,
    /* Gli scatti dei QD3–QD4 si contano dall'assunzione o dalla nomina
       (art. 94 c. 2), non dall'anzianità in azienda: la pagina livello
       usa la `base` della regola di ciascuna sezione. */
    scattiDallaBase:true},
].map(Object.freeze));

const HUB='/minimi-ccnl/';
const rottaTabella=c=>`${HUB}${c.slug}/`;
const rottaLivello=(c,codice)=>`${HUB}${c.slug}/${c.slugLivello(codice)}/`;

/* Le rotte non dipendono dalla data: sitemap e test le leggono senza
   generare niente. */
const ROTTE=Object.freeze([HUB,
  ...CONTRATTI_SEO.flatMap(c=>[rottaTabella(c),...(c.livelli||[]).map(codice=>rottaLivello(c,codice))])]);

module.exports={CONTRATTI_SEO,ROTTE,HUB,SEO_OVERRIDE,rottaTabella,rottaLivello};
