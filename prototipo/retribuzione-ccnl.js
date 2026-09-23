/* ============================================================
   RETRIBUZIONE CONTRATTUALE — da CCNL e livello alla RAL.

   Il catalogo in ccnl.js sa solo quante mensilità distribuire un
   netto già calcolato. Qui si fa il passo prima: si compone una
   RAL a partire da ciò che il contratto pubblica, e la RAL entra
   poi in motore.js come qualsiasi altra. Nessuna formula fiscale
   vive in questo file.

   L'identità, valida in entrambi i contratti:

     RAL = (base mensile riproporzionata
            + scatti mensili riproporzionati
            + superminimo mensile dichiarato) × mensilità

   Due contratti, due forme del dato. Il Terziario pubblica la
   riga scomposta (paga base, contingenza, terzo elemento e, su
   due soli livelli, una voce aggiuntiva) *e* il totale. La
   Metalmeccanica pubblica un importo unico. Lo schema tiene
   entrambe le forme invece di normalizzarne una via: `voci` è
   come il contratto la stampa, `totale` è il numero che il
   contratto dichiara. Non li sommiamo noi — li riconciliamo,
   e la riconciliazione è una prova in retribuzione-ccnl.test.js.

   Script classico come il motore: la stessa riga gira nella
   pagina aperta da file:// e in Node per i test.
   ============================================================ */
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.RETRIBUZIONE_CCNL=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){

  const VERSIONE_DATASET='2026-09-22';

  /* Gli importi contrattuali sono in euro con due decimali, e le
     somme devono tornare al centesimo con il totale pubblicato.
     I float non lo garantiscono: si lavora in centesimi interi e
     si torna in euro solo all'uscita. Gli ordini di grandezza qui
     (una RAL sta sotto i 10 milioni di centesimi) stanno larghi
     dentro l'intero sicuro, quindi non serve BigInt come nel motore. */
  const cent=euro=>Math.round(Number(euro)*100);
  const euro=centesimi=>centesimi/100;

  const congela=oggetto=>Object.freeze(oggetto);

  /* ------------------------------------------------------------
     TERZIARIO, DISTRIBUZIONE E SERVIZI — Confcommercio, H011

     Fonte: tabelle nazionali pubblicate da Filcams CGIL, parte
     firmataria, per minimi e decorrenze. L'archivio precedente
     chiamato "testo coordinato" è una sintesi del 2014: conserva
     solo il riscontro storico sugli scatti, non prova le tabelle
     2025–2027.

     Dieci livelli, non otto: oltre a Quadro e I–VII ci sono gli
     operatori di vendita di 1ª e 2ª categoria, che hanno tabella
     e scatti propri. Quasi tutte le fonti divulgative ne contano
     otto e li perdono per strada.

     Due voci si somigliano e non sono la stessa cosa:
     l'`indennitaFunzione` di 260,76 € spetta solo al Quadro;
     l'`elementoAggiuntivo` di 5,16 € è un elemento aggiuntivo
     della paga base e spetta solo al 7° livello. Chiamarle
     entrambe «indennità di funzione» è l'errore corrente.

     Il `terzoElemento` qui è quello *nazionale*, 2,07 €. Le
     associazioni territoriali pubblicano tabelle con il terzo
     elemento provinciale al suo posto — Vicenza, per dirne una,
     stampa 6,20 € e quindi totali più alti. Questa è la base
     nazionale, non il minimo completo applicabile ovunque.
     ------------------------------------------------------------ */

  const FONTE_TERZIARIO=congela({
    titolo:'CCNL Terziario, Distribuzione e Servizi — tabelle salariali nazionali',
    parte:'Filcams CGIL, organizzazione sindacale firmataria',
    url:'https://www.filcams.cgil.it/page/confcommercio_terziario',
    archivio:'processo/dati/fonti/filcams-confcommercio-terziario-tabelle-2026-09-07.html',
    verificataIl:'2026-09-07',
  });

  const FONTE_ACCORDO_TERZIARIO=congela({
    titolo:'Accordo di rinnovo del CCNL Terziario, 22 marzo 2024 — art. 213',
    parte:'testo dell’accordo sottoscritto dalle parti',
    url:'https://ce-mu.it/rapportolavoro/contratti/cms_magazine/uploads/CommercioConfcommercio_AccordoRinnovo_22.3.2024.pdf',
    archivio:'processo/dati/fonti/accordo-rinnovo-terziario-2024-03-22.pdf',
    verificataIl:'2026-09-07',
  });

  /* [codice, denominazione, pagaBase, contingenza, indennitaFunzione,
      elementoAggiuntivo, terzoElemento, totalePubblicato] */
  const TABELLE_TERZIARIO=[
    ['2025-11-01','quarta tranche del rinnovo 22 marzo 2024',[
      ['Q'  ,'Quadro'                          ,2183.09,540.37,260.76,0   ,2.07,2986.29],
      ['1'  ,'1° livello'                      ,1966.54,537.52,0     ,0   ,2.07,2506.13],
      ['2'  ,'2° livello'                      ,1701.04,532.54,0     ,0   ,2.07,2235.65],
      ['3'  ,'3° livello'                      ,1453.94,527.90,0     ,0   ,2.07,1983.91],
      ['4'  ,'4° livello'                      ,1257.46,524.22,0     ,0   ,2.07,1783.75],
      ['5'  ,'5° livello'                      ,1136.07,521.94,0     ,0   ,2.07,1660.08],
      ['6'  ,'6° livello'                      ,1019.94,519.76,0     ,0   ,2.07,1541.77],
      ['7'  ,'7° livello'                      , 873.22,517.51,0     ,5.16,2.07,1397.96],
      ['OV1','Operatore di vendita 1ª categoria',1187.00,530.04,0    ,0   ,0   ,1717.04],
      ['OV2','Operatore di vendita 2ª categoria', 994.96,526.11,0    ,0   ,0   ,1521.07],
    ]],
    ['2026-11-01','quinta tranche del rinnovo 22 marzo 2024',[
      ['Q'  ,'Quadro'                          ,2243.85,540.37,260.76,0   ,2.07,3047.05],
      ['1'  ,'1° livello'                      ,2021.28,537.52,0     ,0   ,2.07,2560.87],
      ['2'  ,'2° livello'                      ,1748.39,532.54,0     ,0   ,2.07,2283.00],
      ['3'  ,'3° livello'                      ,1494.41,527.90,0     ,0   ,2.07,2024.38],
      ['4'  ,'4° livello'                      ,1292.46,524.22,0     ,0   ,2.07,1818.75],
      ['5'  ,'5° livello'                      ,1167.69,521.94,0     ,0   ,2.07,1691.70],
      ['6'  ,'6° livello'                      ,1048.33,519.76,0     ,0   ,2.07,1570.16],
      ['7'  ,'7° livello'                      , 897.53,517.51,0     ,5.16,2.07,1422.27],
      ['OV1','Operatore di vendita 1ª categoria',1220.04,530.04,0    ,0   ,0   ,1750.08],
      ['OV2','Operatore di vendita 2ª categoria',1022.70,526.11,0    ,0   ,0   ,1548.81],
    ]],
    ['2027-02-01','sesta e ultima tranche del rinnovo 22 marzo 2024',[
      ['Q'  ,'Quadro'                          ,2313.29,540.37,260.76,0   ,2.07,3116.49],
      ['1'  ,'1° livello'                      ,2083.84,537.52,0     ,0   ,2.07,2623.43],
      ['2'  ,'2° livello'                      ,1802.50,532.54,0     ,0   ,2.07,2337.11],
      ['3'  ,'3° livello'                      ,1540.66,527.90,0     ,0   ,2.07,2070.63],
      ['4'  ,'4° livello'                      ,1332.46,524.22,0     ,0   ,2.07,1858.75],
      ['5'  ,'5° livello'                      ,1203.83,521.94,0     ,0   ,2.07,1727.84],
      ['6'  ,'6° livello'                      ,1080.77,519.76,0     ,0   ,2.07,1602.60],
      ['7'  ,'7° livello'                      , 925.31,517.51,0     ,5.16,2.07,1450.05],
      ['OV1','Operatore di vendita 1ª categoria',1257.80,530.04,0    ,0   ,0   ,1787.84],
      ['OV2','Operatore di vendita 2ª categoria',1054.40,526.11,0    ,0   ,0   ,1580.51],
    ]],
  ];

  /* Gli scatti del Terziario non si muovono con le tranche del
     rinnovo: l'art. 205 li fissa in cifra dal 1° gennaio 1990 e
     il rinnovo 2024 non li tocca. Stanno quindi fuori dalle
     tabelle per decorrenza, con l'anno da cui valgono. */
  const SCATTI_TERZIARIO={Q:25.46,'1':24.84,'2':22.83,'3':21.95,'4':20.66,
    '5':20.30,'6':19.73,'7':19.47,OV1:15.50,OV2:14.46};

  /* ------------------------------------------------------------
     INDUSTRIA METALMECCANICA E INSTALLAZIONE IMPIANTI — C011

     Fonte: pubblicazione FIM CISL, parte firmataria, del 15
     giugno 2026, che dà minimi e scatti della decorrenza 1° giugno
     2026 discendente dal verbale di accordo 16 giugno 2026.

     Importo unico per livello: il contratto non scompone. La
     colonna `exCategoria` conserva la vecchia numerazione perché
     annunci e buste paga la citano ancora, ma il sistema vigente
     è quello a lettere introdotto nel 2021.

     L'elemento perequativo di 485 € resta fuori dal calcolo: non
     dipende dal livello ma dall'assenza di contrattazione
     aziendale e dall'entità del superminimo annuo individuale,
     che è un fatto aziendale e non contrattuale. Vedi ESCLUSIONI.
     ------------------------------------------------------------ */

  const FONTE_METALMECCANICA=congela({
    titolo:'CCNL Federmeccanica-Assistal 2025–2028 — minimi tabellari dal 1° giugno 2026',
    parte:'FIM CISL, organizzazione sindacale firmataria',
    url:'https://www.fim-cisl.it/2026/06/15/ccnl-federmeccanica-assistal-2025-2028-nuovi-minimi-tabellari-giugno-2026/',
    archivio:null,
    verificataIl:'2026-09-07',
  });

  const FONTE_DISCIPLINA_SCATTI_METALMECCANICA=congela({
    titolo:'CCNL Federmeccanica-Assistal, 5 dicembre 2012 — art. 6, aumenti periodici di anzianità',
    parte:'Federmeccanica, organizzazione datoriale firmataria',
    url:'https://www.federmeccanica.it/images/files/ccnl_2012.pdf',
    archivio:'processo/dati/fonti/federmeccanica-ccnl-2012.pdf',
    verificataIl:'2026-09-07',
  });

  /* [codice, denominazione, exCategoria, minimo, scatto] */
  const TABELLA_METALMECCANICA=[
    ['D1','Livello D1','2' ,1784.94,21.59],
    ['D2','Livello D2','3' ,1979.37,25.05],
    ['C1','Livello C1','3S',2022.12,25.05],
    ['C2','Livello C2','4' ,2064.88,26.75],
    ['C3','Livello C3','5' ,2211.43,29.64],
    ['B1','Livello B1','5S',2370.33,32.43],
    ['B2','Livello B2','6' ,2542.98,36.41],
    ['B3','Livello B3','7' ,2838.99,40.96],
    ['A1','Livello A1','8Q',2907.01,40.96],
  ];

  /* ------------------------------------------------------------
     COSTRUZIONE DELLE RIGHE

     Ogni contratto stampa la riga a modo suo. Qui la si porta nella
     forma comune — voci come le pubblica il contratto, totale
     pubblicato dove esiste — senza sommare niente al posto della fonte.
     ------------------------------------------------------------ */

  const voce=(id,nome,importo,extra={})=>({id,nome,importo,...extra});

  function livelloTerziario([codice,nome,pagaBase,contingenza,indennitaFunzione,
    elementoAggiuntivo,terzoElemento,totalePubblicato]){
    return {codice,nome,
      voci:[
        voce('pagaBase','Paga base nazionale conglobata',pagaBase),
        voce('contingenza','Ex indennità di contingenza',contingenza),
        ...(indennitaFunzione?[voce('indennitaFunzione','Indennità di funzione',indennitaFunzione)]:[]),
        ...(elementoAggiuntivo?[voce('elementoAggiuntivo','Elemento aggiuntivo della paga base',elementoAggiuntivo)]:[]),
        ...(terzoElemento?[voce('terzoElemento','Terzo elemento nazionale',terzoElemento)]:[]),
      ],
      totalePubblicato,
      scatto:SCATTI_TERZIARIO[codice]};
  }

  function livelloMetalmeccanica([codice,nome,exCategoria,minimo,scatto]){
    return {codice,nome,exCategoria,
      voci:[voce('minimo','Minimo tabellare',minimo)],
      totalePubblicato:minimo,scatto};
  }

  const CONTRATTI_DATI=[
    {
      id:'terziario-confcommercio-h011',
      nome:'Terziario, Distribuzione e Servizi',
      parti:'Confcommercio',
      codiceCnel:'H011',
      mensilita:14,
      oreSettimanali:40,
      scatti:{tipo:'cifraFissa',cadenzaAnni:3,massimo:10,
        base:'anzianità di servizio presso la stessa azienda o gruppo aziendale',
        articolo:'art. 205 — aumenti periodici di anzianità',
        decorrenza:'dal primo giorno del mese successivo a quello in cui si compie il triennio'},
      fonte:FONTE_TERZIARIO,
      fonteAccordo:FONTE_ACCORDO_TERZIARIO,
      tabelle:TABELLE_TERZIARIO.map(([decorrenza,titolo,righe])=>({
        decorrenza,titolo,livelli:righe.map(livelloTerziario)})),
    },
    {
      id:'metalmeccanica-industria-c011',
      nome:'Industria Metalmeccanica e Installazione Impianti',
      parti:'Federmeccanica / Assistal',
      codiceCnel:'C011',
      mensilita:13,
      oreSettimanali:40,
      scatti:{tipo:'cifraFissa',cadenzaAnni:2,massimo:5,
        base:'anzianità di servizio presso la stessa azienda o gruppo aziendale',
        articolo:'aumenti periodici di anzianità — massimo 5 bienni',
        decorrenza:'dal primo giorno del mese successivo a quello in cui si compie il biennio'},
      fonte:FONTE_METALMECCANICA,
      fonteDisciplinaScatti:FONTE_DISCIPLINA_SCATTI_METALMECCANICA,
      fonteAccordo:null,
      tabelle:[{
        decorrenza:'2026-06-01',
        titolo:'adeguamento IPCA-NEI del verbale di accordo 16 giugno 2026',
        livelli:TABELLA_METALMECCANICA.map(livelloMetalmeccanica),
      }],
    },
  ];

  /* Ciò che il numero non contiene. Sta nel dataset e non nella
     pagina perché è parte del dato: una base nazionale presentata
     come «il minimo applicabile» sarebbe una bugia, e l'elenco
     delle esclusioni è ciò che la rende un'affermazione onesta. */
  const ESCLUSIONI_DATI={
    'terziario-confcommercio-h011':Object.freeze([
      'Terzo elemento provinciale: la tabella usa quello nazionale di 2,07 €. Dove la contrattazione territoriale ne prevede uno più alto, il minimo effettivo è superiore.',
      'Contrattazione integrativa aziendale e territoriale.',
      'Indennità legate alla mansione o all’orario: notturno, festivo, maggiorazioni, straordinario.',
    ]),
    'metalmeccanica-industria-c011':Object.freeze([
      'Elemento perequativo di 485 €: spetta a chi non ha contrattazione aziendale né superminimo individuale, e in quota a chi ha un superminimo annuo inferiore a 485 €. Dipende da fatti aziendali che il calcolatore non conosce, quindi resta fuori dal totale.',
      'Contrattazione integrativa aziendale e premi di risultato.',
      'Indennità legate alla mansione o all’orario: turni, notturno, straordinario, trasferta.',
    ]),
  };


  /* ============================================================
     GRUPPO 1 — undici contratti (RIC-60)

     Fonti, letture e limiti di ognuno stanno in
     processo/fonti-ccnl-gruppo1.md. Le tabelle lunghe qui sopra sono
     state lette dal testo delle fonti archiviate, non ribattute a
     mano; le fixture delle prove invece sì, dalla fonte, così una
     trascrizione sbagliata non si conferma da sola.
     ============================================================ */

  /* Tabelle lette dal testo delle fonti archiviate. */
  /* [decorrenza,righe [livello,contingenza,paga base,totale pubblicato]] */
  const TABELLE_FIPE_GENERALE=[
    ['2024-06-01',[['Qa',542.7,1788.71,2331.41],['Qb',537.59,1615.23,2152.82],['1',536.71,1463.34,2000.05],['2',531.59,1289.89,1821.48],['3',528.26,1185.29,1713.55],['4',524.94,1087.75,1612.69],['5',522.37,985.26,1507.63],['6s',520.64,926.08,1446.72],['6',520.51,904.54,1425.05],['7',518.45,812.03,1330.48]]],
    ['2025-06-01',[['Qa',542.7,1854.49,2397.19],['Qb',537.59,1674.63,2212.22],['1',536.71,1517.16,2053.87],['2',531.59,1337.33,1868.92],['3',528.26,1228.88,1757.14],['4',524.94,1127.75,1652.69],['5',522.37,1021.49,1543.86],['6s',520.64,960.13,1480.77],['6',520.51,937.8,1458.31],['7',518.45,841.89,1360.34]]],
    ['2026-06-01',[['Qa',542.7,1920.26,2462.96],['Qb',537.59,1734.02,2271.61],['1',536.71,1570.97,2107.68],['2',531.59,1384.76,1916.35],['3',528.26,1272.47,1800.73],['4',524.94,1167.75,1692.69],['5',522.37,1057.72,1580.09],['6s',520.64,994.19,1514.83],['6',520.51,971.06,1491.57],['7',518.45,871.75,1390.2]]],
    ['2027-06-01',[['Qa',542.7,1969.6,2512.3],['Qb',537.59,1778.57,2316.16],['1',536.71,1611.33,2148.04],['2',531.59,1420.33,1951.92],['3',528.26,1305.16,1833.42],['4',524.94,1197.75,1722.69],['5',522.37,1084.89,1607.26],['6s',520.64,1019.73,1540.37],['6',520.51,996.01,1516.52],['7',518.45,894.14,1412.59]]],
    ['2027-12-01',[['Qa',542.7,2035.37,2578.07],['Qb',537.59,1837.97,2375.56],['1',536.71,1665.14,2201.85],['2',531.59,1467.77,1999.36],['3',528.26,1348.74,1877.0],['4',524.94,1237.75,1762.69],['5',522.37,1121.13,1643.5],['6s',520.64,1053.78,1574.42],['6',520.51,1029.27,1549.78],['7',518.45,924.0,1442.45]]],
  ];
  const TABELLE_FIPE_COLLETTIVA=[
    ['2024-06-01',[['Qa',542.7,1788.71,2331.41],['Qb',537.59,1615.23,2152.82],['1',536.71,1463.34,2000.05],['2',531.59,1289.89,1821.48],['3',528.26,1185.29,1713.55],['4',524.94,1087.75,1612.69],['5',522.37,985.26,1507.63],['6s',520.64,926.08,1446.72],['6',520.51,904.54,1425.05],['7',518.45,812.03,1330.48]]],
    ['2025-09-01',[['Qa',542.7,1854.49,2397.19],['Qb',537.59,1674.63,2212.22],['1',536.71,1517.16,2053.87],['2',531.59,1337.33,1868.92],['3',528.26,1228.88,1757.14],['4',524.94,1127.75,1652.69],['5',522.37,1021.49,1543.86],['6s',520.64,960.13,1480.77],['6',520.51,937.8,1458.31],['7',518.45,841.89,1360.34]]],
    ['2026-09-01',[['Qa',542.7,1920.26,2462.96],['Qb',537.59,1734.02,2271.61],['1',536.71,1570.97,2107.68],['2',531.59,1384.76,1916.35],['3',528.26,1272.47,1800.73],['4',524.94,1167.75,1692.69],['5',522.37,1057.72,1580.09],['6s',520.64,994.19,1514.83],['6',520.51,971.06,1491.57],['7',518.45,871.75,1390.2]]],
    ['2027-06-01',[['Qa',542.7,1969.6,2512.3],['Qb',537.59,1778.57,2316.16],['1',536.71,1611.33,2148.04],['2',531.59,1420.33,1951.92],['3',528.26,1305.16,1833.42],['4',524.94,1197.75,1722.69],['5',522.37,1084.89,1607.26],['6s',520.64,1019.73,1540.37],['6',520.51,996.01,1516.52],['7',518.45,894.14,1412.59]]],
    ['2027-12-01',[['Qa',542.7,2035.37,2578.07],['Qb',537.59,1837.97,2375.56],['1',536.71,1665.14,2201.85],['2',531.59,1467.77,1999.36],['3',528.26,1348.74,1877.0],['4',524.94,1237.75,1762.69],['5',522.37,1121.13,1643.5],['6s',520.64,1053.78,1574.42],['6',520.51,1029.27,1549.78],['7',518.45,924.0,1442.45]]],
  ];
  /* [livello,contingenza,paga base ridotta,totale pubblicato,riduzione] */
  const TABELLE_FIPE_MINORI=[
    ['2024-06-01',[['Qa',542.7,1783.03,2325.73,5.68],['Qb',537.59,1610.07,2147.66,5.16],['1',536.71,1458.18,1994.89,5.16],['2',531.59,1285.5,1817.09,4.39],['3',528.26,1181.42,1709.68,3.87],['4',524.94,1084.39,1609.33,3.36],['5',522.37,982.16,1504.53,3.1],['6s',520.64,923.24,1443.88,2.84],['6',520.51,901.7,1422.21,2.84],['7',518.45,809.45,1327.9,2.58]]],
    ['2025-06-01',[['Qa',542.7,1848.81,2391.51,5.68],['Qb',537.59,1669.47,2207.06,5.16],['1',536.71,1512.0,2048.71,5.16],['2',531.59,1332.94,1864.53,4.39],['3',528.26,1225.01,1753.27,3.87],['4',524.94,1124.39,1649.33,3.36],['5',522.37,1018.39,1540.76,3.1],['6s',520.64,957.29,1477.93,2.84],['6',520.51,934.96,1455.47,2.84],['7',518.45,839.31,1357.76,2.58]]],
    ['2026-06-01',[['Qa',542.7,1914.58,2457.28,5.68],['Qb',537.59,1728.86,2266.45,5.16],['1',536.71,1565.81,2102.52,5.16],['2',531.59,1380.37,1911.96,4.39],['3',528.26,1268.6,1796.86,3.87],['4',524.94,1164.39,1689.33,3.36],['5',522.37,1054.62,1576.99,3.1],['6s',520.64,991.35,1511.99,2.84],['6',520.51,968.22,1488.73,2.84],['7',518.45,869.17,1387.62,2.58]]],
    ['2027-06-01',[['Qa',542.7,1963.92,2506.62,5.68],['Qb',537.59,1773.41,2311.0,5.16],['1',536.71,1606.17,2142.88,5.16],['2',531.59,1415.94,1947.53,4.39],['3',528.26,1301.29,1829.55,3.87],['4',524.94,1194.39,1719.33,3.36],['5',522.37,1081.79,1604.16,3.1],['6s',520.64,1016.89,1537.53,2.84],['6',520.51,993.17,1513.68,2.84],['7',518.45,891.56,1410.01,2.58]]],
    ['2027-12-01',[['Qa',542.7,2029.69,2572.39,5.68],['Qb',537.59,1832.81,2370.4,5.16],['1',536.71,1659.98,2196.69,5.16],['2',531.59,1463.38,1994.97,4.39],['3',528.26,1344.87,1873.13,3.87],['4',524.94,1234.39,1759.33,3.36],['5',522.37,1118.03,1640.4,3.1],['6s',520.64,1050.94,1571.58,2.84],['6',520.51,1026.43,1546.94,2.84],['7',518.45,921.42,1439.87,2.58]]],
  ];
  /* [decorrenza,righe [livello,minimo,EPA,totale stampato]] */
  const TABELLE_LOGISTICA_NON_VIAGGIANTE=[
    ['2025-01-01',[['Quadri',2477.1,46.67,2523.77],['1°',2326.61,36.67,2363.28],['2°',2137.31,36.67,2173.98],['3°Super',1930.37,30.0,1960.37],['3°',1878.05,30.0,1908.05],['4°',1786.59,26.67,1813.26],['4°Junior',1740.19,26.67,1766.86],['5°',1703.16,23.33,1726.49],['6°',1592.38,23.33,1615.71]]],
    ['2026-01-01',[['Quadri',2528.31,46.67,2574.98],['1°',2374.79,36.67,2411.46],['2°',2181.55,36.67,2218.22],['3°Super',1970.37,30.0,2000.37],['3°',1916.84,30.0,1946.84],['4°',1823.56,26.67,1850.23],['4°Junior',1776.25,26.67,1802.92],['5°',1738.31,23.33,1761.64],['6°',1625.41,23.33,1648.74]]],
    ['2027-01-01',[['Quadri',2528.31,93.34,2634.46],['1°',2374.79,73.34,2460.18],['2°',2181.55,73.34,2265.95],['3°Super',1970.37,60.0,2040.37],['3°',1916.84,60.0,1986.54],['4°',1823.56,53.34,1886.14],['4°Junior',1776.25,53.34,1838.61],['5°',1738.31,46.66,1793.76],['6°',1625.41,46.66,1680.33]]],
    ['2027-06-01',[['Quadri',2541.12,140.0,2681.12],['1°',2386.84,110.0,2496.84],['2°',2192.61,110.0,2302.61],['3°Super',1980.37,90.0,2070.37],['3°',1926.54,90.0,2016.54],['4°',1832.8,80.0,1912.8],['4°Junior',1785.27,80.0,1865.27],['5°',1747.1,70.0,1817.1],['6°',1633.67,70.0,1703.67]]],
  ];
  const TABELLE_LOGISTICA_VIAGGIANTE=[
    ['2025-01-01',[['C3',1931.46,50.0,1981.46],['B3',1930.37,40.0,1970.37],['A3',1929.29,33.33,1962.62],['F2',1879.14,30.0,1909.2],['E2',1878.11,30.0,1908.11],['D2',1877.03,30.0,1907.03],['H1',1819.42,28.33,1847.75],['G1',1812.11,26.67,1838.78],['I-110',1596.56,10.0,1606.56],['I-116',1683.63,10.0,1693.63],['L-110',1596.56,16.67,1613.23],['L-116',1683.63,16.67,1700.3],['L-119',1727.19,16.67,1743.86]]],
    ['2026-01-01',[['C3',1971.61,50.0,2021.61],['B3',1970.37,40.0,2010.37],['A3',1969.14,33.33,2002.47],['F2',1918.09,30.0,1948.15],['E2',1916.91,30.0,1946.91],['D2',1915.68,30.0,1945.68],['H1',1856.87,28.33,1885.2],['G1',1849.41,26.67,1876.08],['I-110',1629.65,10.0,1639.65],['I-116',1718.52,10.0,1728.52],['L-110',1629.65,16.67,1646.32],['L-116',1718.52,16.67,1735.19],['L-119',1762.98,16.67,1779.65]]],
    ['2027-01-01',[['C3',1971.61,100.0,2071.61],['B3',1970.37,80.0,2050.37],['A3',1969.14,66.66,2035.8],['F2',1918.09,60.0,1978.15],['E2',1916.91,60.0,1976.91],['D2',1915.68,60.0,1975.68],['H1',1856.87,56.66,1913.53],['G1',1849.41,53.34,1902.75],['I-110',1629.65,20.0,1649.65],['I-116',1718.52,20.0,1738.52],['L-110',1629.65,33.34,1662.99],['L-116',1718.52,33.34,1751.86],['L-119',1762.98,33.34,1796.32]]],
    ['2027-06-01',[['C3',1981.65,150.0,2131.65],['B3',1980.37,120.0,2100.37],['A3',1979.11,100.0,2079.11],['F2',1927.83,90.0,2017.89],['E2',1926.61,90.0,2016.61],['D2',1925.34,90.0,2015.34],['H1',1866.23,85.0,1951.23],['G1',1858.72,80.0,1938.72],['I-110',1637.91,30.0,1667.91],['I-116',1727.24,30.0,1757.24],['L-110',1637.91,50.0,1687.91],['L-116',1727.23,50.0,1777.23],['L-119',1771.92,50.0,1821.92]]],
  ];
  /* [decorrenza,righe [livello,tabellare,contingenza,retribuzione base pubblicata,EDR]] */
  const TABELLE_MULTISERVIZI=[
    ['2025-07-01',[['Q',1653.44,532.06,2185.5,10.33],['7',1510.64,532.06,2042.7,10.33],['6',1307.72,524.77,1832.49,10.33],['5',1052.18,518.53,1570.71,10.33],['4',962.0,517.5,1479.5,10.33],['3',886.85,515.42,1402.27,10.33],['2',819.21,513.96,1333.17,10.33],['1',751.57,512.71,1264.28,10.33]]],
    ['2026-05-01',[['Q',1724.08,532.06,2256.14,10.33],['7',1575.18,532.06,2107.24,10.33],['6',1363.59,524.77,1888.36,10.33],['5',1097.13,518.53,1615.66,10.33],['4',1003.1,517.5,1520.6,10.33],['3',924.74,515.42,1440.16,10.33],['2',854.21,513.96,1368.17,10.33],['1',783.68,512.71,1296.39,10.33]]],
    ['2026-10-01',[['Q',1794.72,532.06,2326.78,10.33],['7',1639.72,532.06,2171.78,10.33],['6',1419.46,524.77,1944.23,10.33],['5',1142.08,518.53,1660.61,10.33],['4',1044.2,517.5,1561.7,10.33],['3',962.63,515.42,1478.05,10.33],['2',889.21,513.96,1403.17,10.33],['1',815.79,512.71,1328.5,10.33]]],
    ['2027-05-01',[['Q',1855.27,532.06,2387.33,10.33],['7',1695.04,532.06,2227.1,10.33],['6',1467.35,524.77,1992.12,10.33],['5',1180.61,518.53,1699.14,10.33],['4',1079.43,517.5,1596.93,10.33],['3',995.11,515.42,1510.53,10.33],['2',919.21,513.96,1433.17,10.33],['1',843.31,512.71,1356.02,10.33]]],
    ['2027-12-01',[['Q',1895.64,532.06,2427.7,10.33],['7',1731.92,532.06,2263.98,10.33],['6',1499.28,524.77,2024.05,10.33],['5',1206.3,518.53,1724.83,10.33],['4',1102.92,517.5,1620.42,10.33],['3',1016.76,515.42,1532.18,10.33],['2',939.21,513.96,1453.17,10.33],['1',861.66,512.71,1374.37,10.33]]],
    ['2028-07-01',[['Q',1946.1,532.06,2478.16,10.33],['7',1778.02,532.06,2310.08,10.33],['6',1539.19,524.77,2063.96,10.33],['5',1238.41,518.53,1756.94,10.33],['4',1132.28,517.5,1649.78,10.33],['3',1043.82,515.42,1559.24,10.33],['2',964.21,513.96,1478.17,10.33],['1',884.6,512.71,1397.31,10.33]]],
    ['2028-10-01',[['Q',1986.47,532.06,2518.53,10.33],['7',1814.9,532.06,2346.96,10.33],['6',1571.12,524.77,2095.89,10.33],['5',1264.1,518.53,1782.63,10.33],['4',1155.77,517.5,1673.27,10.33],['3',1065.47,515.42,1580.89,10.33],['2',984.21,513.96,1498.17,10.33],['1',902.95,512.71,1415.66,10.33]]],
    ['2029-03-01',[['Q',2006.65,532.06,2538.71,10.33],['7',1833.34,532.06,2365.4,10.33],['6',1587.08,524.77,2111.85,10.33],['5',1276.94,518.53,1795.47,10.33],['4',1167.51,517.5,1685.01,10.33],['3',1076.3,515.42,1591.72,10.33],['2',994.21,513.96,1508.17,10.33],['1',912.12,512.71,1424.83,10.33]]],
  ];
  /* [livello,minimo per decorrenza 2026-01-01,2026-10-01,2027-01-01,2027-06-01,2028-07-01] */
  const MINIMI_VETRO_SOFFIO=[['9A',2412.41,2435.58,2481.92,2520.54,2636.4],['9',2342.58,2365.08,2410.08,2447.58,2560.08],['8A',2110.19,2130.45,2170.97,2204.74,2306.05],['8',2088.73,2108.77,2148.84,2182.24,2282.43],['7',1831.77,1849.34,1884.49,1913.78,2001.65],['6',1726.84,1743.41,1776.54,1804.15,1886.99],['5',1574.31,1589.42,1619.64,1644.83,1720.39],['4',1448.09,1461.97,1489.73,1512.86,1582.26],['3',1352.1,1365.09,1391.06,1412.7,1477.63],['2',1259.47,1271.56,1295.74,1315.89,1376.34],['1',1166.1,1177.29,1199.68,1218.34,1274.31]];
  /* [livello,minimo per decorrenza 2026-01-01,2026-10-01,2027-01-01,2027-06-01,2028-07-01] */
  const MINIMI_VETRO_TRASFORMAZIONE=[['8A',2412.41,2435.58,2481.92,2520.54,2636.4],['8',2342.58,2365.08,2410.08,2447.58,2560.08],['7',2088.73,2108.77,2148.84,2182.24,2282.43],['6A',1877.2,1895.22,1931.26,1961.3,2051.41],['6',1831.77,1849.34,1884.49,1913.78,2001.65],['5A',1772.54,1789.55,1823.58,1851.94,1937.01],['5',1713.37,1729.83,1762.74,1790.17,1872.45],['4',1562.06,1577.06,1607.06,1632.06,1707.06],['3',1457.44,1471.43,1499.42,1522.74,1592.7],['2',1307.18,1319.72,1344.79,1365.69,1428.38],['1',1166.1,1177.29,1199.68,1218.34,1274.31]];
  /* [livello,minimo per decorrenza 2026-01-01,2026-10-01,2027-01-01,2027-06-01,2028-07-01] */
  const MINIMI_VETRO_LAMPADE=[['A',2389.31,2412.52,2458.93,2497.61,2613.65],['B',2147.64,2168.27,2209.52,2243.9,2347.03],['C',1939.82,1958.46,1995.74,2026.81,2120.01],['D',1739.4,1755.92,1788.97,1816.51,1899.12],['E',1673.12,1689.24,1721.49,1748.36,1828.98],['F',1552.52,1567.52,1597.52,1622.52,1697.52],['G',1412.46,1426.07,1453.28,1475.96,1543.99],['H',1330.19,1342.82,1368.09,1389.15,1452.32],['I',1290.5,1302.88,1327.63,1348.26,1410.14],['L',1125.88,1136.68,1158.28,1176.28,1230.28]];
  /* [livello,[minimo,IPO] per decorrenza 2026-01-01,2026-10-01,2027-01-01,2027-06-01,2028-07-01] */
  const MINIMI_VETRO_MECCANIZZATI=[['A2',[2874.69,69.97],[2897.19,70.64],[2942.19,71.98],[2979.69,73.1],[3092.19,76.46]],['A1',[2874.69,0],[2897.19,0],[2942.19,0],[2979.69,0],[3092.19,0]],['B2',[2616.86,66.42],[2636.9,66.98],[2676.97,68.1],[2710.37,69.03],[2810.56,71.83]],['B1',[2616.86,0],[2636.9,0],[2676.97,0],[2710.37,0],[2810.56,0]],['C2',[2354.05,46.68],[2371.62,47.13],[2406.77,48.02],[2436.06,48.77],[2523.93,51.01]],['C1',[2354.05,0],[2371.62,0],[2406.77,0],[2436.06,0],[2523.93,0]],['D3',[2080.92,213.37],[2095.92,215.38],[2125.92,219.41],[2150.92,222.77],[2225.92,232.84]],['D2',[2080.92,154.21],[2095.92,155.67],[2125.92,158.58],[2150.92,161.01],[2225.92,168.29]],['D1',[2080.92,0],[2095.92,0],[2125.92,0],[2150.92,0],[2225.92,0]],['E3',[1822.13,194.23],[1834.67,196.02],[1859.74,199.61],[1880.64,202.59],[1943.33,211.54]],['E2',[1822.13,152.44],[1834.67,153.89],[1859.74,156.81],[1880.64,159.23],[1943.33,166.5]],['E1',[1822.13,0],[1834.67,0],[1859.74,0],[1880.64,0],[1943.33,0]],['F1',[1683.88,0],[1695.07,0],[1717.46,0],[1736.12,0],[1792.09,0]]];
  /* Lavoro & Economia,tranche 1.1.2026: [livello,contingenza,indennità di funzione o elemento aggiuntivo,superminimo contrattuale,totale pubblicato,scatto] */
  const VOCI_VETRO_SOFFIO=[['9A',532.25,60.0,0,3014.99,17.56],['9',532.11,60.0,0,2945.02,17.56],['8A',528.17,0,0,2648.69,16.53],['8',528.14,0,0,2627.2,16.53],['7',523.14,0,0,2365.24,14.72],['6',521.61,0,0,2258.78,13.94],['5',518.77,0,0,2103.41,12.65],['4',516.88,0,0,1975.3,12.39],['3',515.22,0,0,1877.65,10.33],['2',514.05,0,0,1783.85,9.3],['1',512.61,0,5.28,1694.32,8.26]];
  /* Lavoro & Economia,tranche 1.1.2026: [livello,contingenza,indennità di funzione o elemento aggiuntivo,superminimo contrattuale,totale pubblicato,scatto] */
  const VOCI_VETRO_TRASFORMAZIONE=[['8A',532.25,60.0,0,3014.99,17.56],['8',532.11,60.0,0,2945.02,17.56],['7',528.14,0,0,2627.2,16.53],['6A',523.53,0,0,2411.06,14.98],['6',522.29,0,0,2364.39,14.98],['5A',521.76,0,0,2304.63,13.94],['5',521.76,0,0,2245.46,13.94],['4',518.86,0,0,2091.25,12.91],['3',517.12,0,0,1984.89,12.39],['2',514.95,0,0,1832.46,10.33],['1',512.61,0,5.16,1694.2,8.26]];
  /* Lavoro & Economia,tranche 1.1.2026: [livello,contingenza,indennità di funzione o elemento aggiuntivo,superminimo contrattuale,totale pubblicato,scatto] */
  const VOCI_VETRO_LAMPADE=[['A',531.73,60.0,0,2991.37,17.56],['B',530.32,0,0,2688.29,17.56],['C',526.74,0,0,2476.89,16.53],['D',521.23,0,0,2270.96,14.46],['E',521.23,0,0,2204.68,13.94],['F',518.46,0,0,2081.31,12.39],['G',516.48,0,0,1939.27,12.39],['H',514.95,0,0,1855.47,10.85],['I',514.95,0,0,1815.78,10.33],['L',512.27,0,0,1648.48,8.26]];
  /* Lavoro & Economia,tranche 1.1.2026: [livello,contingenza,indennità di funzione o elemento aggiuntivo,superminimo contrattuale,totale pubblicato,scatto] */
  const VOCI_VETRO_MECCANIZZATI=[['A2',0,60.0,0,3014.99,17.56],['A1',0,60.0,0,2945.02,17.56],['B2',0,0,0,2693.61,16.53],['B1',0,0,0,2627.19,16.53],['C2',0,0,0,2411.06,14.98],['C1',0,0,0,2364.38,14.98],['D3',0,0,0,2304.62,13.94],['D2',0,0,0,2245.46,13.94],['D1',0,0,0,2091.25,12.91],['E3',0,0,0,2026.69,12.39],['E2',0,0,0,1984.9,12.39],['E1',0,0,0,1832.46,10.33],['F1',0,0,0,1694.21,8.26]];
  /* [livello, valori base contrattuali per decorrenza] 2024-03-01, 2024-10-01,
     2025-05-01, 2025-10-01, 2026-07-01. Derivati, non trascritti: il
     valore firmato al 1° ottobre 2022 (CCNL 19 gennaio 2021, Parte
     Settima art. 1) più gli incrementi TEM della circolare Assografici,
     AIE, ANES dell'11 gennaio 2024. AS, A, D2 ed E sono stati
     riparametrati dal rinnovo: per loro il punto di partenza è il
     valore di marzo 2024 pubblicato da lavorofacile.it, poi gli stessi
     incrementi. */
  const MINIMI_GRAFICI=[
    ['Q',[2094.5,2138.44,2182.38,2255.62,2331.78]],
    ['AS',[2084.59,2128.35,2172.11,2245.05,2320.9]],
    ['A',[1760.8,1797.85,1834.9,1896.66,1960.89]],
    ['B1S',[1693.14,1728.61,1764.08,1823.19,1884.67]],
    ['B1',[1643.6,1678.19,1712.78,1770.42,1830.37]],
    ['B2',[1539.29,1571.58,1603.87,1657.69,1713.66]],
    ['B3',[1429.04,1459.04,1489.04,1539.04,1591.04]],
    ['C1',[1319.53,1347.23,1374.93,1421.1,1469.12]],
    ['C2',[1164.94,1189.47,1214.0,1254.88,1297.39]],
    ['D1',[1054.68,1076.91,1099.14,1136.2,1174.74]],
    ['D2',[959.79,980.08,1000.37,1034.19,1069.36]],
    ['E',[842.35,859.99,877.63,907.04,937.62]],
  ];
  const MINIMI_EDITORI=[
    ['Q',[2047.79,2083.49,2119.19,2178.68,2240.55]],
    ['1',[2038.03,2073.57,2109.11,2168.35,2229.96]],
    ['2',[1720.8,1750.8,1780.8,1830.8,1882.8]],
    ['3',[1610.79,1639.58,1668.37,1716.36,1766.27]],
    ['4',[1505.88,1532.27,1558.66,1602.65,1648.4]],
    ['5',[1396.72,1421.01,1445.3,1485.79,1527.9]],
    ['6',[1153.43,1175.92,1198.41,1235.9,1274.89]],
    ['7',[963.78,984.77,1005.76,1040.75,1077.14]],
  ];

  const fonte=(titolo,parte,url,archivio)=>congela({titolo,parte,url,archivio,
    verificataIl:'2026-09-22'});
  const cifraFissa=(cadenzaAnni,massimo,articolo,extra={})=>({tipo:'cifraFissa',
    cadenzaAnni,massimo,articolo,
    base:'anzianità di servizio presso la stessa azienda o gruppo aziendale',
    decorrenza:`dal primo giorno del mese successivo a quello in cui si compie il ${
      cadenzaAnni===2?'biennio':cadenzaAnni===3?'triennio':'quadriennio'}`,...extra});
  const tabella=(decorrenza,titolo,livelli)=>({decorrenza,titolo,livelli});
  const livelloOrdinale=codice=>/^\d+$/.test(codice)?`${codice}° livello`:codice;

  /* ------------------------------------------------------------
     PUBBLICI ESERCIZI, RISTORAZIONE COLLETTIVA E COMMERCIALE E
     TURISMO — FIPE, H05Y

     Tre sezioni retributive: le aziende dell'art. 1 punti I, III–VI;
     la ristorazione collettiva, con gli stessi importi ma le tranche
     intermedie a settembre invece che a giugno; le aziende minori
     dell'art. 162, con la paga base ridotta di un importo fisso.

     La quattordicesima (art. 184) esclude gli scatti maturati: è il
     contratto che rompe l'identità semplice, e gli scatti entrano in
     13 mensilità invece che in 14.
     ------------------------------------------------------------ */
  const NOMI_FIPE={Qa:'Quadro A',Qb:'Quadro B','6s':'6° livello super'};
  const SCATTI_FIPE={Qa:40.80,Qb:39.25,'1':37.70,'2':36.15,'3':34.86,'4':33.05,
    '5':32.54,'6s':31.25,'6':30.99,'7':30.47};
  const livelloFipe=([codice,contingenza,pagaBase,totalePubblicato])=>({
    codice,nome:NOMI_FIPE[codice]||livelloOrdinale(codice),
    voci:[voce('pagaBase','Paga base nazionale',pagaBase),
      voce('contingenza','Indennità di contingenza',contingenza)],
    totalePubblicato,scatto:SCATTI_FIPE[codice]});
  const livelloFipeMinori=([codice,contingenza,pagaBaseRidotta,totalePubblicato])=>({
    codice,nome:NOMI_FIPE[codice]||livelloOrdinale(codice),
    voci:[voce('pagaBase','Paga base nazionale ridotta (art. 162)',pagaBaseRidotta),
      voce('contingenza','Indennità di contingenza',contingenza)],
    totalePubblicato,scatto:SCATTI_FIPE[codice]});
  const TRANCHE_FIPE=['prima','seconda','terza','quarta','quinta'];
  const tabelleFipe=(tabelle,costruisci)=>tabelle.map(([decorrenza,righe],i)=>
    tabella(decorrenza,`${TRANCHE_FIPE[i]} tranche del rinnovo 5 giugno 2024`,righe.map(costruisci)));

  const FIPE={
    id:'pubblici-esercizi-fipe-h05y',
    nome:'Pubblici esercizi, ristorazione collettiva e commerciale e turismo',
    parti:'FIPE, Confcommercio, Legacoop, Confcooperative, AGCI',
    codiceCnel:'H05Y',
    mensilita:14,
    oreSettimanali:40,
    scatti:cifraFissa(4,6,'art. 182 — scatti di anzianità, quadriennali dal 1° gennaio 2018',
      {mensilita:13,incidenza:'esclusi dalla quattordicesima (art. 184)'}),
    fonte:fonte('CCNL Pubblici esercizi, ristorazione collettiva e commerciale e turismo — tabelle retributive 2024',
      'FIPE, organizzazione datoriale firmataria',
      'https://www.fipe.it/wp-content/uploads/2025/02/Tabelle-retributive-2024.pdf',
      'processo/dati/fonti/fipe-h05y-tabelle-retributive-2024.pdf'),
    sezioni:[
      {id:'generale',nome:'Pubblici esercizi e ristorazione commerciale',
        descrizione:'Aziende dell’art. 1 c. 1 punti I, III, IV, V e VI: bar, ristoranti, ristorazione commerciale, stabilimenti balneari, alberghi diurni, rifugi.',
        tabelle:tabelleFipe(TABELLE_FIPE_GENERALE,livelloFipe)},
      {id:'collettiva',nome:'Ristorazione collettiva',
        descrizione:'Aziende dell’art. 1 c. 1 punto II: mense e ristorazione collettiva. Stessi importi, con le tranche intermedie a settembre.',
        tabelle:tabelleFipe(TABELLE_FIPE_COLLETTIVA,livelloFipe),
        esclusioni:['Cambio di gestione nella ristorazione collettiva (Titolo X): il computo dell’anzianità ai fini degli scatti fra gestioni successive non è modellato; se la conosci, indica il numero di scatti.']},
      {id:'minori',nome:'Aziende minori',
        descrizione:'Pubblici esercizi e stabilimenti balneari di 3ª e 4ª categoria (art. 162): paga base ridotta di un importo fisso per livello.',
        tabelle:tabelleFipe(TABELLE_FIPE_MINORI,livelloFipeMinori)},
    ],
  };

  /* ------------------------------------------------------------
     TURISMO — Federalberghi, FAITA Federcamping, Confcommercio, H052

     Paga base nazionale conglobata unica (art. 152 c. 5). Due
     sezioni: la generale e quella degli alberghi a una e due stelle
     e dei campeggi fino a 1.200 presenze-licenza, con valori ridotti.
     Qui 13ª e 14ª comprendono gli scatti (artt. 160–161).
     ------------------------------------------------------------ */
  const DATE_TURISMO=[['2024-07-01','prima'],['2025-06-01','seconda'],['2026-05-01','terza'],
    ['2027-04-01','quarta'],['2027-11-01','quinta']];
  /* [livello, valori per decorrenza] — art. 152 dell'accordo 5 luglio 2024 */
  const PAGA_TURISMO_GENERALE=[
    ['A' ,2309.93,2366.94,2416.82,2466.71,2495.22],
    ['B' ,2138.57,2191.35,2237.53,2283.72,2310.11],
    ['1' ,1992.50,2041.68,2084.71,2127.73,2152.32],
    ['2' ,1821.13,1866.07,1905.40,1944.73,1967.20],
    ['3' ,1717.55,1759.94,1797.04,1834.13,1855.32],
    ['4' ,1620.69,1660.69,1695.69,1730.69,1750.69],
    ['5' ,1519.93,1557.44,1590.27,1623.09,1641.85],
    ['6S',1461.49,1497.57,1529.13,1560.69,1578.72],
    ['6' ,1440.78,1476.34,1507.45,1538.57,1556.35],
    ['7' ,1350.12,1383.45,1412.60,1441.76,1458.42],
  ];
  const PAGA_TURISMO_MINORI=[
    ['A' ,2298.57,2355.58,2405.46,2455.35,2483.86],
    ['B' ,2128.24,2181.02,2227.20,2273.39,2299.78],
    ['1' ,1982.17,2031.35,2074.38,2117.40,2141.99],
    ['2' ,1812.35,1857.29,1896.62,1935.95,1958.42],
    ['3' ,1709.80,1752.19,1789.29,1826.38,1847.57],
    ['4' ,1613.98,1653.98,1688.98,1723.98,1743.98],
    ['5' ,1513.73,1551.24,1584.07,1616.89,1635.65],
    ['6S',1455.81,1491.89,1523.45,1555.01,1573.04],
    ['6' ,1435.10,1470.66,1501.77,1532.89,1550.67],
    ['7' ,1344.96,1378.29,1407.44,1436.60,1453.26],
  ];
  const SCATTI_TURISMO={A:40.80,B:39.25,'1':37.70,'2':36.15,'3':34.86,'4':33.05,
    '5':32.54,'6S':31.25,'6':30.99,'7':30.47};
  /* Art. 145: da gennaio 2009, non toccata dal rinnovo 2024. */
  const FUNZIONE_TURISMO={A:75.00,B:70.00};
  const NOMI_TURISMO={A:'Quadro A',B:'Quadro B','6S':'6° livello super'};
  const tabelleTurismo=righe=>DATE_TURISMO.map(([decorrenza,n],i)=>tabella(decorrenza,
    `${n} tranche del rinnovo 5 luglio 2024`,righe.map(([codice,...valori])=>({
      codice,nome:NOMI_TURISMO[codice]||livelloOrdinale(codice),
      voci:[voce('pagaBase','Paga base nazionale conglobata',valori[i]),
        ...(FUNZIONE_TURISMO[codice]?[voce('indennitaFunzione','Indennità di funzione dei Quadri (art. 145)',
          FUNZIONE_TURISMO[codice])]:[])],
      totalePubblicato:valori[i],vociTotalePubblicato:['pagaBase'],
      scatto:SCATTI_TURISMO[codice]}))));

  const TURISMO={
    id:'turismo-federalberghi-h052',
    nome:'Turismo — alberghi e complessi turistico-ricettivi',
    parti:'Federalberghi, FAITA Federcamping, Confcommercio',
    codiceCnel:'H052',
    mensilita:14,
    oreSettimanali:40,
    scatti:cifraFissa(3,6,'art. 158 — scatti di anzianità',{
      base:'anzianità di servizio presso la stessa azienda o gruppo, maturata dopo il compimento dei 18 anni'}),
    fonte:fonte('Accordo di rinnovo del CCNL Turismo, 5 luglio 2024 — art. 152',
      'testo dell’accordo, linkato da Filcams CGIL, organizzazione sindacale firmataria',
      'https://ce-mu.it/rapportolavoro/contratti/cms_magazine/uploads/AlberghiFederalberghi_AccordoRinnovo_5.7.24.pdf',
      'processo/dati/fonti/turismo-h052-accordo-rinnovo-2024-07-05.pdf'),
    sezioni:[
      {id:'generale',nome:'Alberghi e complessi ricettivi',
        descrizione:'Sezione generale. Vale anche per cuoco, cameriere e barista al 5° livello, ostelli, bed and breakfast e affittacamere, esclusi dalla riduzione.',
        tabelle:tabelleTurismo(PAGA_TURISMO_GENERALE)},
      {id:'minori',nome:'Alberghi a una e due stelle e campeggi fino a 1.200 presenze',
        descrizione:'Valori ridotti dell’art. 152 c. 2. Non si applicano a cuoco, cameriere e barista al 5° livello, né a ostelli, bed and breakfast e affittacamere.',
        tabelle:tabelleTurismo(PAGA_TURISMO_MINORI)},
    ],
  };

  /* ------------------------------------------------------------
     STUDI E ATTIVITÀ PROFESSIONALI — Confprofessioni, H442
     ------------------------------------------------------------ */
  /* Art. 140 del CCNL 16 febbraio 2024: minimo tabellare conglobato. */
  const DATE_STUDI=[['2024-03-01','prima'],['2024-10-01','seconda'],['2025-10-01','terza'],
    ['2026-12-01','quarta']];
  const MINIMI_STUDI=[
    ['Q' ,'Quadri'              ,2281.51,2345.02,2408.53,2436.76],
    ['1' ,'1° livello'          ,2018.99,2075.19,2131.39,2156.38],
    ['2' ,'2° livello'          ,1758.60,1807.55,1856.50,1878.26],
    ['3S','3° livello super'    ,1631.19,1676.60,1722.01,1742.20],
    ['3' ,'3° livello'          ,1616.37,1661.37,1706.37,1726.37],
    ['4S','4° livello super'    ,1567.44,1611.07,1654.70,1674.10],
    ['4' ,'4° livello'          ,1511.28,1553.35,1595.42,1614.12],
    ['5' ,'5° livello'          ,1406.48,1445.63,1484.78,1502.19],
  ];
  const SCATTI_STUDI={Q:30,'1':26,'2':23,'3S':22,'3':22,'4S':20,'4':20,'5':20};

  const STUDI={
    id:'studi-professionali-confprofessioni-h442',
    nome:'Studi e attività professionali',
    parti:'Confprofessioni',
    codiceCnel:'H442',
    mensilita:14,
    oreSettimanali:40,
    scatti:cifraFissa(3,8,'art. 134 — scatti di anzianità',{
      base:'anzianità di servizio presso lo stesso studio professionale'}),
    fonte:fonte('CCNL Studi professionali, 16 febbraio 2024 — testo integrale, art. 140',
      'Confprofessioni, organizzazione datoriale firmataria',
      'https://confprofessioni.eu/wp-content/uploads/2024/09/CCNL-Studi-2024-integrale-definitivo.pdf',
      'processo/dati/fonti/studi-h442-ccnl-2024-integrale-confprofessioni.pdf'),
    tabelle:DATE_STUDI.map(([decorrenza,n],i)=>tabella(decorrenza,
      `${n} tranche del CCNL 16 febbraio 2024`,MINIMI_STUDI.map(([codice,nome,...valori])=>({
        codice,nome,voci:[voce('minimo','Minimo tabellare conglobato',valori[i])],
        totalePubblicato:valori[i],scatto:SCATTI_STUDI[codice]})))),
  };

  /* ------------------------------------------------------------
     SERVIZI DI PULIZIA E SERVIZI INTEGRATI/MULTISERVIZI — K511

     Il rinnovo 2025 è firmato dalle centrali cooperative e da
     Unionservizi Confapi, non da ANIP Confindustria: il dato copre
     loro. Due sezioni perché le regole di anzianità sono due:
     gli impiegati hanno scatti biennali pari al 6,25% della
     tabellare vigente *al momento della maturazione*, e ogni scatto
     conserva il valore della sua finestra; gli operai hanno una
     quota unica di anzianità forfettaria dal quinto anno nel settore.
     L'EDR del Protocollo 1992 entra in 13 mensilità.
     ------------------------------------------------------------ */
  const NOMI_MULTISERVIZI={Q:'Quadro','4':'4° livello (parametro 128)','2':'2° livello (parametro 109)'};
  const TRANCHE_MULTISERVIZI=['prima','seconda','terza','quarta','quinta','sesta','settima','ottava'];
  const tabelleMultiservizi=()=>TABELLE_MULTISERVIZI.map(([decorrenza,righe],i)=>tabella(decorrenza,
    `${TRANCHE_MULTISERVIZI[i]} tranche del rinnovo 13 giugno 2025 (accordo integrativo 6 agosto 2025)`,
    righe.map(([codice,tabellare,contingenza,base,edr])=>({
      codice,nome:NOMI_MULTISERVIZI[codice]||livelloOrdinale(codice),
      voci:[voce('tabellare','Retribuzione tabellare',tabellare),
        voce('contingenza','Indennità di contingenza',contingenza),
        ...(codice==='Q'?[voce('indennitaFunzione','Indennità di funzione dei Quadri',25.82)]:[]),
        voce('edr','E.D.R. (Protocollo 31 luglio 1992)',edr,{mensilita:13})],
      totalePubblicato:base,vociTotalePubblicato:['tabellare','contingenza']}))));
  /* Appendice all'art. 22: valore dello scatto per finestra di
     maturazione. 2021–2024 dal CCNL 8 giugno 2021; dal 1° luglio 2025
     dall'accordo integrativo 6 agosto 2025, che sostituisce il valore
     provvisorio del 2021 per la stessa data. L'ultimo, marzo 2029, è
     provvisorio ai sensi dell'art. 73 anche nella fonte. */
  const FINESTRE_SCATTI_MULTISERVIZI=[
    ['2021-07-01',{Q:105.68,'7':98.06,'6':87.23,'5':73.60,'4':68.79,'3':64.78,'2':61.18}],
    ['2022-07-01',{Q:108.20,'7':100.37,'6':89.23,'5':75.21,'4':70.26,'3':66.14,'2':62.43}],
    ['2023-07-01',{Q:111.98,'7':103.82,'6':92.22,'5':77.62,'4':72.46,'3':68.17,'2':64.30}],
    ['2024-07-01',{Q:114.51,'7':106.13,'6':94.22,'5':79.22,'4':73.93,'3':69.52,'2':65.55}],
    ['2025-07-01',{Q:120.81,'7':111.89,'6':99.21,'5':83.24,'4':77.60,'3':72.90,'2':68.68}],
    ['2026-05-01',{Q:125.23,'7':115.92,'6':102.70,'5':86.05,'4':80.17,'3':75.27,'2':70.86}],
    ['2026-10-01',{Q:129.64,'7':119.96,'6':106.19,'5':88.86,'4':82.74,'3':77.64,'2':73.05}],
    ['2027-05-01',{Q:133.43,'7':123.42,'6':109.18,'5':91.26,'4':84.94,'3':79.67,'2':74.93}],
    ['2027-12-01',{Q:135.95,'7':125.72,'6':111.18,'5':92.87,'4':86.41,'3':81.02,'2':76.18}],
    ['2028-07-01',{Q:139.11,'7':128.60,'6':113.67,'5':94.88,'4':88.24,'3':82.71,'2':77.74}],
    ['2028-10-01',{Q:141.63,'7':130.91,'6':115.67,'5':96.48,'4':89.71,'3':84.07,'2':78.99}],
    ['2029-03-01',{Q:142.89,'7':132.06,'6':116.67,'5':97.28,'4':90.44,'3':84.74,'2':79.61}],
  ];

  const MULTISERVIZI={
    id:'multiservizi-pulizia-k511',
    nome:'Servizi di pulizia e servizi integrati/multiservizi',
    parti:'Legacoop Produzione e Servizi, Confcooperative Lavoro e Servizi, AGCI Servizi, Unionservizi Confapi',
    codiceCnel:'K511',
    mensilita:14,
    oreSettimanali:40,
    scatti:{tipo:'assenti',articolo:'art. 22'},
    fonte:fonte('CCNL Servizi di pulizia e multiservizi — tabelle salariali 2025–2029 e scatti',
      'Filcams CGIL, organizzazione sindacale firmataria; riscontrate sulla scansione dell’accordo integrativo 6 agosto 2025 (Legacoop Produzione e Servizi)',
      'https://www.filcams.cgil.it/page/multiservizi',
      'processo/dati/fonti/multiservizi-k511-filcams-tabelle-2026-09-22.html'),
    sezioni:[
      {id:'impiegati',nome:'Impiegati e quadri',
        descrizione:'Scatti biennali, massimo otto, pari al 6,25% della tabellare vigente quando ciascuno matura (art. 22).',
        codiciLivello:['Q','7','6','5','4','3','2'],
        scatti:{tipo:'percentualeMaturazione',cadenzaAnni:2,massimo:8,
          base:'anzianità di servizio presso la stessa impresa',
          articolo:'art. 22 — scatti biennali per gli impiegati, 6,25% della retribuzione tabellare vigente alla maturazione e della contingenza al 1° agosto 1983',
          decorrenza:'dal primo giorno del mese successivo a quello in cui si compie il biennio',
          finestre:FINESTRE_SCATTI_MULTISERVIZI.map(([dal,importi])=>({dal,importi}))},
        tabelle:tabelleMultiservizi(),
        esclusioni:['Scatti maturati prima del 1° luglio 2021: il valore della loro finestra di maturazione non è nelle fonti archiviate. Con una data di anzianità che li comprende il calcolo si ferma invece di stimarli.',
          'Passaggi di livello: l’impiegato conserva l’importo in cifra degli scatti maturati nel livello di provenienza (art. 22). Il calcolo li valorizza tutti al livello attuale.']},
      {id:'operai',nome:'Operai',
        descrizione:'Nessuno scatto: una quota unica di anzianità forfettaria di settore dal quinto anno di anzianità nel settore (art. 22).',
        codiciLivello:['6','5','4','3','2','1'],
        scatti:{tipo:'quotaUnica',dopoAnni:4,decorre:'anniversario',
          base:'anzianità nel settore senza interruzione del rapporto, salvi i passaggi di appalto',
          articolo:'art. 22 — anzianità forfettaria di settore per gli operai',
          decorrenza:'dal compimento del quarto anno di anzianità nel settore',
          importi:{'6':82.99,'5':66.77,'4':63.15,'3':58.18,'2':54.39,'1':51.02}},
        tabelle:tabelleMultiservizi()},
    ],
  };

  /* ------------------------------------------------------------
     DISTRIBUZIONE MODERNA ORGANIZZATA — Federdistribuzione, H008

     Struttura e importi coincidono al centesimo con il Terziario
     H011, su tutte e tre le tabelle Filcams. È comunque un altro
     contratto — codice, firmatari, testo — e le sue righe sono
     trascritte dalla sua fonte, non copiate dall'H011.
     ------------------------------------------------------------ */
  const FONTE_DMO=fonte('CCNL Distribuzione Moderna Organizzata — minimi dal 1/11/2025, 1/11/2026, 1/2/2027',
    'Filcams CGIL, organizzazione sindacale firmataria; aumenti riscontrati sull’art. 196 del testo unico Federdistribuzione',
    'https://www.filcams.cgil.it/page/federdistribuzione',
    'processo/dati/fonti/dmo-h008-filcams-tabelle-2026-09-22.html');
  /* [codice, denominazione, pagaBase, contingenza, indennitaFunzione,
      elementoAggiuntivo, terzoElemento, totalePubblicato] */
  const TABELLE_DMO=[
    ['2025-11-01','quarta tranche del rinnovo 23 aprile 2024 (art. 196)',[
      ['Q'  ,'Quadro'                          ,2183.09,540.37,260.76,0   ,2.07,2986.29],
      ['1'  ,'1° livello'                      ,1966.54,537.52,0     ,0   ,2.07,2506.13],
      ['2'  ,'2° livello'                      ,1701.04,532.54,0     ,0   ,2.07,2235.65],
      ['3'  ,'3° livello'                      ,1453.94,527.90,0     ,0   ,2.07,1983.91],
      ['4'  ,'4° livello'                      ,1257.46,524.22,0     ,0   ,2.07,1783.75],
      ['5'  ,'5° livello'                      ,1136.07,521.94,0     ,0   ,2.07,1660.08],
      ['6'  ,'6° livello'                      ,1019.94,519.76,0     ,0   ,2.07,1541.77],
      ['7'  ,'7° livello'                      , 873.22,517.51,0     ,5.16,2.07,1397.96],
      ['OV1','Operatore di vendita 1ª categoria',1187.00,530.04,0    ,0   ,0   ,1717.04],
      ['OV2','Operatore di vendita 2ª categoria', 994.96,526.11,0    ,0   ,0   ,1521.07],
    ]],
    ['2026-11-01','quinta tranche del rinnovo 23 aprile 2024 (art. 196)',[
      ['Q'  ,'Quadro'                          ,2243.85,540.37,260.76,0   ,2.07,3047.05],
      ['1'  ,'1° livello'                      ,2021.28,537.52,0     ,0   ,2.07,2560.87],
      ['2'  ,'2° livello'                      ,1748.39,532.54,0     ,0   ,2.07,2283.00],
      ['3'  ,'3° livello'                      ,1494.41,527.90,0     ,0   ,2.07,2024.38],
      ['4'  ,'4° livello'                      ,1292.46,524.22,0     ,0   ,2.07,1818.75],
      ['5'  ,'5° livello'                      ,1167.69,521.94,0     ,0   ,2.07,1691.70],
      ['6'  ,'6° livello'                      ,1048.33,519.76,0     ,0   ,2.07,1570.16],
      ['7'  ,'7° livello'                      , 897.53,517.51,0     ,5.16,2.07,1422.27],
      ['OV1','Operatore di vendita 1ª categoria',1220.04,530.04,0    ,0   ,0   ,1750.08],
      ['OV2','Operatore di vendita 2ª categoria',1022.70,526.11,0    ,0   ,0   ,1548.81],
    ]],
    ['2027-02-01','sesta e ultima tranche del rinnovo 23 aprile 2024 (art. 196)',[
      ['Q'  ,'Quadro'                          ,2313.29,540.37,260.76,0   ,2.07,3116.49],
      ['1'  ,'1° livello'                      ,2083.84,537.52,0     ,0   ,2.07,2623.43],
      ['2'  ,'2° livello'                      ,1802.50,532.54,0     ,0   ,2.07,2337.11],
      ['3'  ,'3° livello'                      ,1540.66,527.90,0     ,0   ,2.07,2070.63],
      ['4'  ,'4° livello'                      ,1332.46,524.22,0     ,0   ,2.07,1858.75],
      ['5'  ,'5° livello'                      ,1203.83,521.94,0     ,0   ,2.07,1727.84],
      ['6'  ,'6° livello'                      ,1080.77,519.76,0     ,0   ,2.07,1602.60],
      ['7'  ,'7° livello'                      , 925.31,517.51,0     ,5.16,2.07,1450.05],
      ['OV1','Operatore di vendita 1ª categoria',1257.80,530.04,0    ,0   ,0   ,1787.84],
      ['OV2','Operatore di vendita 2ª categoria',1054.40,526.11,0    ,0   ,0   ,1580.51],
    ]],
  ];
  /* Art. 188 e art. 14 della sezione Operatori di vendita. */
  const SCATTI_DMO={Q:25.46,'1':24.84,'2':22.83,'3':21.95,'4':20.66,
    '5':20.30,'6':19.73,'7':19.47,OV1:15.50,OV2:14.46};

  const DMO={
    id:'distribuzione-moderna-federdistribuzione-h008',
    nome:'Distribuzione Moderna Organizzata',
    parti:'Federdistribuzione',
    codiceCnel:'H008',
    mensilita:14,
    oreSettimanali:40,
    scatti:cifraFissa(3,10,'art. 188 — scatti di anzianità; art. 14 della sezione Operatori di vendita'),
    fonte:FONTE_DMO,
    tabelle:TABELLE_DMO.map(([decorrenza,titolo,righe])=>tabella(decorrenza,titolo,
      righe.map(riga=>({...livelloTerziario(riga),scatto:SCATTI_DMO[riga[0]]})))),
  };

  /* ------------------------------------------------------------
     LOGISTICA, TRASPORTO MERCI E SPEDIZIONE — I100

     Due sezioni: personale non viaggiante e viaggiante, con scatti
     propri. 39 ore. Il totale stampato è minimo + EPA; l'EDR
     dell'accordo 18 maggio 2021 sta accanto, per 13 mensilità.
     Il 6° Junior è cessato il 31 dicembre 2025 ed è fuori dal dato.
     I rider hanno una riga per parametro: il passaggio da 110 a 116
     (e a 119) avviene per anzianità e qui si sceglie a mano.

     Due refusi della fonte, registrati con il loro importo: il totale
     F2 è stampato 6 centesimi sopra la somma delle voci su ogni
     decorrenza, e i totali del non viaggiante a gennaio 2027 usano il
     minimo di giugno 2027. La RAL usa la somma delle voci.
     ------------------------------------------------------------ */
  const NOMI_LOGISTICA={Quadri:'Quadri','1°':'1° livello','2°':'2° livello',
    '3°Super':'3° livello super','3°':'3° livello','4°':'4° livello','4°Junior':'4° livello junior',
    '5°':'5° livello','6°':'6° livello',
    C3:'C3 (parametro 133,5)',B3:'B3 (parametro 133)',A3:'A3 (parametro 132,5)',
    F2:'F2 (parametro 129,5)',E2:'E2 (parametro 129)',D2:'D2 (parametro 128,5)',
    H1:'H1 (parametro 124,5)',G1:'G1 (parametro 124)',
    'I-110':'Rider su cicli — I, parametro 110','I-116':'Rider su cicli — I, parametro 116 (dopo 6 mesi)',
    'L-110':'Rider su ciclomotori e motocicli — L, parametro 110',
    'L-116':'Rider su ciclomotori e motocicli — L, parametro 116 (dopo 6 mesi)',
    'L-119':'Rider su ciclomotori e motocicli — L, parametro 119 (dopo ulteriori 9 mesi)'};
  const EDR_LOGISTICA={Quadri:12.80,'1°':12.05,'2°':11.06,'3°Super':10.00,'3°':9.70,'4°':9.24,
    '4°Junior':9.02,'5°':8.79,'6°':8.26,
    C3:10.04,B3:10.00,A3:9.96,F2:9.74,E2:9.70,D2:9.66,H1:9.36,G1:9.32,
    'I-110':8.27,'I-116':8.72,'L-110':8.27,'L-116':8.72,'L-119':8.95};
  const SCATTI_LOGISTICA={Quadri:30.99,'1°':29.44,'2°':26.86,'3°Super':24.79,'3°':24.27,
    '4°':23.24,'4°Junior':22.34,'5°':22.21,'6°':20.66,
    C3:24.79,B3:24.79,A3:24.79,F2:24.27,E2:24.27,D2:24.27,H1:23.24,G1:23.14,
    'I-110':22.18,'I-116':22.18,'L-110':21.62,'L-116':21.62,'L-119':21.62};
  const DISCREPANZE_LOGISTICA={
    F2:{scarto:0.06,nota:'Il totale stampato supera di 0,06 € la somma di minimo ed EPA su ogni decorrenza; il minimo è confermato dalla sintesi ASGB.'},
  };
  /* Gennaio 2027, non viaggiante: la tranche è di solo EPA, ma ogni
     totale stampato usa già il minimo di giugno 2027. Lo scarto di
     ciascuna riga è esattamente l'aumento del minimo di giugno; la
     tabella del viaggiante, nella stessa pagina, torna. */
  for(const [codice,scarto] of [['Quadri',12.81],['1°',12.05],['2°',11.06],['3°Super',10.00],
    ['3°',9.70],['4°',9.24],['4°Junior',9.02],['5°',8.79],['6°',8.26]])
    DISCREPANZE_LOGISTICA[`${codice}|2027-01-01`]={scarto,
      nota:'Il totale stampato a gennaio 2027 usa il minimo di giugno 2027 invece di quello in vigore a gennaio, che non cambia fino a giugno.'};
  const TITOLI_LOGISTICA={'2025-01-01':'prima tranche del rinnovo 6 dicembre 2024',
    '2026-01-01':'seconda tranche del rinnovo 6 dicembre 2024',
    '2027-01-01':'terza tranche: solo EPA','2027-06-01':'quarta e ultima tranche del rinnovo 6 dicembre 2024'};
  const tabelleLogistica=tabelle=>tabelle.map(([decorrenza,righe])=>tabella(decorrenza,
    TITOLI_LOGISTICA[decorrenza],righe.map(([codice,minimo,epa,totaleStampato])=>{
      const discrepanza=DISCREPANZE_LOGISTICA[`${codice}|${decorrenza}`]||DISCREPANZE_LOGISTICA[codice]||null;
      return {codice,nome:NOMI_LOGISTICA[codice],
        voci:[voce('minimo','Minimo contrattuale conglobato',minimo),
          voce('epa','Elemento professionale d’area (EPA)',epa),
          ...(codice==='Quadri'?[voce('indennitaFunzione','Indennità di funzione dei Quadri',51.65)]:[]),
          voce('edr','E.D.R. accordo 18 maggio 2021',EDR_LOGISTICA[codice],{mensilita:13})],
        totalePubblicato:totaleStampato,vociTotalePubblicato:['minimo','epa'],
        discrepanzaFonte:discrepanza,scatto:SCATTI_LOGISTICA[codice]};
    })));

  const LOGISTICA={
    id:'logistica-trasporto-merci-i100',
    nome:'Logistica, trasporto merci e spedizione',
    parti:'Confetra, Fedit, Fedespedi, Assologistica, Anita, FAI, CNA Fita, Confartigianato Trasporti e altre',
    codiceCnel:'I100',
    mensilita:14,
    oreSettimanali:39,
    scatti:cifraFissa(2,5,'art. 17 — aumenti periodici di anzianità'),
    fonte:fonte('CCNL Logistica, trasporto merci e spedizione — stesura del testo 25 settembre 2025, tabelle dei minimi, EPA ed EDR',
      'Confartigianato Trasporti, organizzazione datoriale firmataria',
      'https://confartigianatotrasporti.it/wp-content/uploads/2025/10/CCNL_logistica_trasporto_merci_stesura_25set2025.pdf',
      'processo/dati/fonti/logistica-i100-ccnl-stesura-2025-09-25-confartigianato-trasporti.pdf'),
    sezioni:[
      {id:'non-viaggiante',nome:'Personale non viaggiante',
        descrizione:'Impiegati e operai di magazzino, uffici, piattaforme.',
        tabelle:tabelleLogistica(TABELLE_LOGISTICA_NON_VIAGGIANTE)},
      {id:'viaggiante',nome:'Personale viaggiante e rider',
        descrizione:'Conducenti per parametro e rider (lettere I e L). La riga del rider va scelta per parametro: il passaggio per anzianità non è automatico.',
        tabelle:tabelleLogistica(TABELLE_LOGISTICA_VIAGGIANTE)},
    ],
  };

  /* ------------------------------------------------------------
     COOPERATIVE SOCIALI — T151

     Scaduto il 31 dicembre 2025, trattativa aperta, nessun aumento
     successivo firmato: la tabella di ottobre 2025 resta vigente e
     non ne segue un'altra. La quattordicesima nasce il 1° gennaio
     2025 ed è mezza mensilità (art. 79 bis): 13 mensilità fino al
     2024, 13,5 dopo. 38 ore. Le indennità professionali dell'art. 78
     dipendono dal profilo, non dalla posizione: si scelgono dove la
     declaratoria dell'art. 47 colloca quel profilo.
     ------------------------------------------------------------ */
  const MINIMI_COOP=[
    ['A1','A1',1307.22,1333.54,1359.85],['A2','A2',1319.37,1345.95,1372.53],
    ['B1','B1',1381.00,1408.89,1436.79],['C1','C1',1485.21,1515.21,1545.21],
    ['C2','C2',1529.48,1560.27,1591.06],['C3','C3',1574.41,1605.99,1637.57],
    ['D1','D1',1574.41,1605.99,1637.57],['D2','D2',1660.99,1694.41,1727.83],
    ['D3','D3',1768.09,1803.62,1839.15],['E1','E1',1768.09,1803.62,1839.15],
    ['E2','E2',1908.58,1947.00,1985.42],['F1','F1',2107.81,2150.18,2192.54],
    ['F2','F2',2407.25,2455.67,2504.09],
  ];
  const SCATTI_COOP={A1:11.62,A2:13.43,B1:16.27,C1:18.59,C2:19.63,C3:20.66,D1:20.66,
    D2:23.24,D3:26.86,E1:26.86,E2:31.50,F1:39.51,F2:46.48};
  const indennita=(id,nome,importo)=>({id,nome,
    voce:{id:'indennitaProfessionale',nome:`Indennità professionale — ${nome} (art. 78)`,importo}});
  const PROFILI_COOP={
    D1:[indennita('infermiere-generico','infermiera/e generica/o',61.97)],
    D2:[indennita('infermiere','infermiera/e',154.94),
      indennita('terapista','fisioterapista, psicomotricista, terapista occupazionale, logopedista',154.94)],
    E2:[indennita('medico','medico',258.23)],
    F1:[indennita('medico','medico',258.23)],
    F2:[indennita('direttore','direttrice e direttore aziendale',232.41)],
  };
  const DATE_COOP=[['2024-02-01','prima'],['2024-10-01','seconda'],['2025-10-01','terza e ultima']];

  const COOPERATIVE_SOCIALI={
    id:'cooperative-sociali-t151',
    nome:'Cooperative sociali',
    parti:'Federsolidarietà Confcooperative, Legacoopsociali, AGCI Imprese sociali',
    codiceCnel:'T151',
    mensilita:[{dal:'2024-02-01',mensilita:13},{dal:'2025-01-01',mensilita:13.5}],
    oreSettimanali:38,
    scatti:cifraFissa(2,5,'art. 80 — scatti di anzianità',{
      base:'anzianità di servizio presso la stessa impresa'}),
    fonte:fonte('CCNL Cooperative sociali 2023–2025, testo coordinato — art. 76',
      'Confcooperative Federsolidarietà, organizzazione datoriale firmataria',
      'https://www.federsolidarieta.confcooperative.it/Portals/0/CCNL/CCNL%20delle%20Cooperative%20Sociali%202023-2025%20.pdf',
      'processo/dati/fonti/coopsociali-t151-ccnl-2023-2025-federsolidarieta.pdf'),
    tabelle:DATE_COOP.map(([decorrenza,n],i)=>tabella(decorrenza,
      `${n} tranche del rinnovo 26 gennaio 2024 (art. 76)`,MINIMI_COOP.map(([codice,nome,...valori])=>({
        codice,nome:`Posizione ${nome}`,voci:[voce('minimo','Minimo contrattuale conglobato',valori[i])],
        totalePubblicato:valori[i],scatto:SCATTI_COOP[codice],profili:PROFILI_COOP[codice]||[]})))),
  };

  /* ------------------------------------------------------------
     PICCOLA E MEDIA INDUSTRIA METALMECCANICA — Unionmeccanica
     Confapi, C018

     Rinnovo 2025–2028 firmato il 4 giugno 2026 e ratificato il 23
     luglio 2026, con le tranche 2027 e 2028 già determinate. I Quadri
     sono la 8ª e la 9ª categoria: stesso minimo della categoria, più
     l'indennità di funzione dell'art. 98.
     ------------------------------------------------------------ */
  const DATE_CONFAPI=[['2025-06-01','accordo 24 luglio 2025, prima tranche'],
    ['2025-09-01','accordo 24 luglio 2025, seconda tranche'],
    ['2026-06-01','verbale IPCA 17 giugno 2026'],
    ['2027-06-01','rinnovo 4 giugno 2026, tranche 2027'],
    ['2028-06-01','rinnovo 4 giugno 2026, tranche 2028']];
  const MINIMI_CONFAPI=[
    ['1',1587.31,1603.45,1639.96,1672.82,1712.98],
    ['2',1752.97,1770.79,1811.11,1847.40,1891.75],
    ['3',1944.96,1964.74,2009.48,2049.75,2098.96],
    ['4',2029.27,2049.91,2096.58,2138.59,2189.93],
    ['5',2173.77,2195.87,2245.87,2290.87,2345.87],
    ['6',2330.66,2354.36,2407.97,2456.22,2515.19],
    ['7',2500.42,2525.84,2583.36,2635.12,2698.38],
    ['8',2719.17,2746.82,2809.37,2865.66,2934.46],
    ['9',3023.99,3054.74,3124.30,3186.90,3263.42],
  ];
  const SCATTI_CONFAPI={'1':18.49,'2':21.59,'3':25.05,'4':26.75,'5':29.64,'6':32.43,
    '7':36.41,'8':40.95,'9':45.96};
  const QUADRI_CONFAPI={'8':['8Q','Quadro B (8ª categoria)',49.06],'9':['9Q','Quadro A (9ª categoria)',69.72]};

  const CONFAPI={
    id:'metalmeccanica-pmi-confapi-c018',
    nome:'Piccola e media industria metalmeccanica, orafa e installazione impianti',
    parti:'Unionmeccanica Confapi',
    codiceCnel:'C018',
    mensilita:13,
    oreSettimanali:40,
    scatti:cifraFissa(2,5,'art. 41 — aumenti periodici di anzianità'),
    fonte:fonte('Ipotesi di accordo di rinnovo CCNL Unionmeccanica Confapi 2025–2028, 4 giugno 2026 — tabella dei minimi (p. 5); verbale IPCA 17 giugno 2026',
      'Uilm, organizzazione sindacale firmataria',
      'https://www.uilmnazionale.it/wp-content/uploads/2026/06/20260604-CCNL-Unionmeccanica-Confapi-2025-2028.pdf',
      'processo/dati/fonti/pmi-confapi-c018-ipotesi-accordo-rinnovo-2026-06-04.pdf'),
    tabelle:DATE_CONFAPI.map(([decorrenza,titolo],i)=>tabella(decorrenza,titolo,
      MINIMI_CONFAPI.flatMap(([codice,...valori])=>{
        const base={codice,nome:`${codice}ª categoria`,
          voci:[voce('minimo','Minimo tabellare conglobato',valori[i])],
          totalePubblicato:valori[i],vociTotalePubblicato:['minimo'],scatto:SCATTI_CONFAPI[codice]};
        const quadro=QUADRI_CONFAPI[codice];
        return quadro?[base,{...base,codice:quadro[0],nome:quadro[1],
          voci:[...base.voci,voce('indennitaFunzione','Indennità di funzione dei Quadri (art. 98)',quadro[2])]}]:[base];
      }))),
  };

  /* ------------------------------------------------------------
     GRAFICI EDITORI — Assografici, AIE, ANES, G011

     Due sezioni con livelli e minimi propri. Ogni livello ha tre voci
     che nessuna fonte somma: valore base, contingenza congelata al
     30 aprile 1992 (Allegato 1 del testo 2021), EDR. Il totale è
     derivato. Il livello 8 degli Editori e gli scatti di Q e AS
     Grafici e Q Editori non sono documentati: il primo è fuori dal
     dato, i secondi sono dichiarati non calcolabili.
     ------------------------------------------------------------ */
  const DATE_GRAFICI=[['2024-03-01','prima'],['2024-10-01','seconda'],['2025-05-01','terza'],
    ['2025-10-01','quarta'],['2026-07-01','quinta e ultima']];
  const CONTINGENZA_GRAFICI={Q:539.99,AS:539.99,A:533.19,B1S:530.40,B1:530.40,B2:528.03,
    B3:525.47,C1:523.01,C2:519.63,D1:517.35,D2:515.40,E:512.87};
  const CONTINGENZA_EDITORI={Q:539.99,'1':539.99,'2':533.19,'3':530.40,'4':528.03,
    '5':525.47,'6':519.63,'7':515.40};
  /* Art. 9 Parte Seconda (operai) e Parte Terza (impiegati): gli
     importi coincidono dove i livelli si sovrappongono. */
  const SCATTI_GRAFICI={Q:null,AS:null,A:16.01,B1S:14.46,B1:14.46,B2:13.94,B3:13.43,
    C1:12.91,C2:12.39,D1:11.88,D2:11.36,E:10.33};
  const SCATTI_EDITORI={Q:null,'1':16.01,'2':16.01,'3':14.46,'4':13.94,'5':13.43,
    '6':12.91,'7':11.88};
  const NOMI_GRAFICI={Q:'Quadri',AS:'A super',B1S:'B1 super'};
  const tabelleGrafici=(minimi,contingenze,scatti,nomi)=>DATE_GRAFICI.map(([decorrenza,n],i)=>
    tabella(decorrenza,`${n} tranche del rinnovo 19 dicembre 2023`,
      minimi.map(([codice,valori])=>({codice,nome:nomi(codice),
        voci:[voce('minimo','Valore base contrattuale',valori[i]),
          voce('contingenza','Indennità di contingenza',contingenze[codice]),
          voce('edr','E.D.R. (Protocollo 31 luglio 1992)',10.33)],
        scatto:scatti[codice]}))));

  const GRAFICI_EDITORI={
    id:'grafici-editori-g011',
    nome:'Grafici editori — aziende grafiche ed editoriali',
    parti:'Assografici, AIE, ANES',
    codiceCnel:'G011',
    mensilita:13,
    oreSettimanali:40,
    scatti:cifraFissa(2,5,'art. 9 Parte Seconda (operai) e Parte Terza (impiegati)'),
    fonte:fonte('Misura e decorrenza dell’incremento TEM Grafici ed Editori, 11 gennaio 2024',
      'Assografici, AIE, ANES, organizzazioni datoriali firmatarie (circolare trasmessa da Confindustria Toscana Centro e Costa)',
      'https://confindustriatoscanacentroecosta.it/ccnl-grafici-editori-nuove-tabelle-parametrali/',
      'processo/dati/fonti/grafici-editori-g011-incrementi-tem-assografici-2024-01-11.pdf'),
    notaFonte:'Gli importi sono derivati: valore firmato al 1° ottobre 2022 più gli incrementi della circolare datoriale. Per A super, A, D2 ed E, riparametrati dal rinnovo, il punto di partenza di marzo 2024 viene da una fonte secondaria (lavorofacile.it). Due banche dati indipendenti (Kitech, lavorofacile.it) concordano entro uno o due centesimi.',
    sezioni:[
      {id:'grafici',nome:'Grafici',descrizione:'Aziende grafiche e affini: dodici livelli, da Q a E.',
        tabelle:tabelleGrafici(MINIMI_GRAFICI,CONTINGENZA_GRAFICI,SCATTI_GRAFICI,
          codice=>NOMI_GRAFICI[codice]||`Livello ${codice}`)},
      {id:'editori',nome:'Editori',descrizione:'Aziende editoriali, anche multimediali: Nuova Classificazione Unica Editori (Parte Quinta bis).',
        tabelle:tabelleGrafici(MINIMI_EDITORI,CONTINGENZA_EDITORI,SCATTI_EDITORI,
          codice=>codice==='Q'?'Quadri':`Livello ${codice}`)},
    ],
  };

  /* ------------------------------------------------------------
     POLIGRAFICI — aziende editrici e stampatrici di quotidiani e
     agenzie di stampa, FIEG, ASIG, G041

     Scaduto il 31 dicembre 2022 e in ultrattività: vale la tabella
     del 1° aprile 2021, senza tranche future. Nessuna delle fonti
     delle tabelle è una parte firmataria (Kitech, ilCCNL.it, rapporto
     Adapt concordano); la parte normativa è letta sul testo 2008–2011
     pubblicato da SLC CGIL. Sul 7° livello Kitech stampa 1.433,31 € e
     il rapporto Adapt, che cita l'accordo, 1.433,21 €: il dato usa
     il secondo e registra lo scarto sul totale stampato.
     ------------------------------------------------------------ */
  /* [livello, minimo, contingenza, indennità di funzione, totale stampato, scatto] */
  const TABELLA_POLIGRAFICI=[
    ['10Q',1885.93,553.78,132.02,2571.73,21.69],
    ['10' ,1885.93,553.78,0     ,2439.71,21.69],
    ['9'  ,1709.90,549.08,0     ,2258.98,20.66],
    ['8'  ,1559.03,544.55,0     ,2103.58,19.11],
    ['7'  ,1433.21,540.38,0     ,1973.69,18.08],
    ['6'  ,1307.58,536.21,0     ,1843.79,17.04],
    ['5'  ,1162.99,531.82,0     ,1694.81,15.75],
    ['4'  ,1030.98,527.68,0     ,1558.66,14.87],
    ['3'  , 911.54,524.35,0     ,1435.89,14.36],
    ['2'  , 804.67,520.39,0     ,1325.06,13.58],
    ['1'  , 628.64,515.32,0     ,1143.96,12.55],
  ];

  const POLIGRAFICI={
    id:'poligrafici-quotidiani-g041',
    nome:'Poligrafici — quotidiani e agenzie di stampa',
    parti:'FIEG, ASIG',
    codiceCnel:'G041',
    mensilita:13,
    oreSettimanali:36,
    scatti:cifraFissa(2,7,'art. 16 Parte operai e art. 13 Parte impiegati del testo 2008–2011'),
    fonte:fonte('Tabella retributiva CCNL Poligrafici in vigore dal 1° aprile 2021',
      'Kitech, banca dati indipendente, non firmataria; riscontrata su ilCCNL.it e sul rapporto Adapt sulla contrattazione',
      'https://www.kitech.it/Retribuzione-stipendio-ccnl.aspx?CodiceCateg=161',
      'processo/dati/fonti/poligrafici-g041-kitech-tabella-2021-04-2026-09-22.md'),
    notaFonte:'Contratto scaduto il 31 dicembre 2022 e applicato in ultrattività. Le tabelle vengono da fonti non firmatarie concordanti; la parte normativa è letta sul testo 2008–2011 pubblicato da SLC CGIL.',
    tabelle:[tabella('2021-04-01','accordo economico 15 febbraio 2021, in ultrattività',
      TABELLA_POLIGRAFICI.map(([codice,minimo,contingenza,funzione,totaleStampato,scatto])=>({
        codice,nome:codice==='10Q'?'10° livello — Quadri':`${codice}° livello`,
        voci:[voce('minimo','Minimo tabellare',minimo),
          voce('contingenza','Indennità di contingenza',contingenza),
          ...(funzione?[voce('indennitaFunzione','Indennità di funzione dei Quadri (7% del minimo del 10°)',funzione)]:[])],
        totalePubblicato:totaleStampato,scatto,
        discrepanzaFonte:codice==='7'?{scarto:0.10,nota:'Kitech stampa il minimo a 1.433,31 € e il totale a 1.973,69 €; il rapporto Adapt, che cita l’accordo, dà 1.433,21 €. Il dato usa quest’ultimo.'}:null})))],
  };

  /* ------------------------------------------------------------
     VETRO, LAMPADE E DISPLAY — industria, Assovetro, B132

     Rinnovo 9 aprile 2026, efficace dopo lo scioglimento della
     riserva del 19 maggio. L'accordo firmato non contiene tabelle:
     i minimi 2026–2028 vengono da lavorofacile.it, le altre voci e
     gli scatti della tranche di gennaio 2026 da Lavoro & Economia.
     Coerenti con gli aumenti annunciati dalle parti (50/15/30/25/75 €
     sul D1) e con l'ultima tabella 2023–2025 firmata.

     Quattro comparti con tabellari propri; il soffio ha un orario di
     36 ore per maestri fiascai e piazza semiautomatica delle damigiane
     (art. 15), esposto come sezione a sé perché cambia il tempo pieno.
     ------------------------------------------------------------ */
  const DATE_VETRO=[['2026-01-01','prima'],['2026-10-01','seconda'],['2027-01-01','terza'],
    ['2027-06-01','quarta'],['2028-07-01','quinta e ultima']];
  const voceEdr=voce('edr','E.D.R. (Protocollo 31 luglio 1992)',10.33);
  function tabelleVetro(minimi,vociLe,{funzione='Indennità di funzione',idFunzione='indennitaFunzione'}={}){
    const altre=new Map(vociLe.map(r=>[r[0],r]));
    return DATE_VETRO.map(([decorrenza,n],i)=>tabella(decorrenza,`${n} tranche del rinnovo 9 aprile 2026`,
      minimi.map(([codice,...valori])=>{
        const [,contingenza,indennita,superminimo,totale,scatto]=altre.get(codice);
        return {codice,nome:`Livello ${codice}`,
          voci:[voce('minimo','Minimo tabellare',valori[i]),
            voce('contingenza','Indennità di contingenza',contingenza),
            voceEdr,
            ...(indennita?[voce(idFunzione,funzione,indennita)]:[]),
            ...(superminimo?[voce('superminimoContrattuale','Superminimo contrattuale del 1° livello',superminimo)]:[])],
          totalePubblicato:i===0?totale:null,scatto};
      })));
  }
  function tabelleVetroMeccanizzati(){
    const altre=new Map(VOCI_VETRO_MECCANIZZATI.map(r=>[r[0],r]));
    return DATE_VETRO.map(([decorrenza,n],i)=>tabella(decorrenza,`${n} tranche del rinnovo 9 aprile 2026`,
      MINIMI_VETRO_MECCANIZZATI.map(([codice,...valori])=>{
        const [minimo,ipo]=valori[i];
        const [,,funzione,,totale,scatto]=altre.get(codice);
        return {codice,nome:`Categoria ${codice[0]}, posizione organizzativa ${codice.slice(1)}`,
          voci:[voce('minimo','Minimo tabellare',minimo),
            ...(ipo?[voce('ipo','Indennità di posizione organizzativa',ipo)]:[]),
            voceEdr,
            ...(funzione?[voce('indennitaFunzione','Indennità di funzione',funzione)]:[])],
          totalePubblicato:i===0?totale:null,scatto};
      })));
  }
  const soffio=()=>tabelleVetro(MINIMI_VETRO_SOFFIO,VOCI_VETRO_SOFFIO);

  const VETRO={
    id:'vetro-lampade-display-b132',
    nome:'Vetro, lampade e display — industria',
    parti:'Assovetro',
    codiceCnel:'B132',
    mensilita:13,
    oreSettimanali:40,
    scatti:cifraFissa(2,5,'art. 35 — aumenti periodici di anzianità'),
    fonte:fonte('Rinnovato il CCNL Vetro Industria — minimi 2026–2028',
      'lavorofacile.it, banca dati indipendente, non firmataria; altre voci e scatti da Lavoro & Economia',
      'https://www.lavorofacile.it/rinnovi-ccnl/rinnovato-il-ccnl-vetro-industria',
      'processo/dati/fonti/vetro-b132-lavorofacile-tabelle-2026-2028-2026-09-22.md'),
    notaFonte:'Le tabelle 2026–2028 vengono da fonti secondarie: l’accordo firmato il 9 aprile 2026 non le contiene e la diffusione ufficiale è in una banca dati a pagamento. Sono coerenti con gli aumenti annunciati dalle parti e con la base 2023–2025 firmata.',
    /* L'art. 34 deduce dal minimo i 137 punti di contingenza conglobati
       nel 1977: l'allegato 8 li dà in lire, per le categorie di prima del
       2001, per età e dimensione d'azienda. Nessuna fonte li porta sui
       livelli attuali, quindi il premio non si stima (RIC-77). */
    quoteAnnueMancanti:[{id:'premioSpeciale',nome:'premio speciale di giugno',fonte:'art. 34'}],
    sezioni:[
      {id:'meccanizzati',nome:'Settori meccanizzati — prime lavorazioni',
        descrizione:'Categorie da A a F con posizioni organizzative; le posizioni 2 e 3 hanno l’indennità di posizione organizzativa.',
        tabelle:tabelleVetroMeccanizzati()},
      {id:'trasformazione',nome:'Settori della trasformazione — seconde lavorazioni e mosaico',
        descrizione:'Livelli da 1 a 8A.',
        tabelle:tabelleVetro(MINIMI_VETRO_TRASFORMAZIONE,VOCI_VETRO_TRASFORMAZIONE)},
      {id:'soffio',nome:'Settori a soffio, a mano e con macchine semiautomatiche',
        descrizione:'Livelli da 1 a 9A, orario di 40 ore.',
        tabelle:soffio()},
      {id:'soffio-36-ore',nome:'Soffio — maestri fiascai e piazza semiautomatica delle damigiane (36 ore)',
        descrizione:'Stessa tabella del soffio. Tempo pieno di 36 ore per maestri fiascai e aiutanti della bofferia toscana e per gli addetti alla piazza semiautomatica che fabbricano damigiane da 5/7 a 60 litri (art. 15).',
        oreSettimanali:36,tabelle:soffio()},
      {id:'lampade',nome:'Lampade e display',
        descrizione:'Livelli da L ad A.',
        tabelle:tabelleVetro(MINIMI_VETRO_LAMPADE,VOCI_VETRO_LAMPADE,
          {funzione:'Elemento aggiuntivo della retribuzione',idFunzione:'elementoAggiuntivo'})},
    ],
  };

  const CONTRATTI_GRUPPO_1=[FIPE,TURISMO,LOGISTICA,MULTISERVIZI,STUDI,COOPERATIVE_SOCIALI,
    DMO,CONFAPI,GRAFICI_EDITORI,POLIGRAFICI,VETRO];

  const ESCLUSIONI_GRUPPO_1={
    'pubblici-esercizi-fipe-h05y':[
      'Quattordicesima senza scatti: l’art. 184 li esclude, quindi gli scatti entrano in 13 mensilità mentre la paga base in 14.',
      'Superminimo nella quattordicesima: l’art. 184 vi comprende i trattamenti integrativi aziendali; il calcolo tratta il superminimo come voce su tutte le 14 mensilità.',
      'Terzi elementi provinciali o aziendali (art. 165) e contrattazione integrativa.',
      'Personale retribuito a percentuale di servizio (artt. 166–171) e lavoratori extra e di surroga (art. 164).',
      'Norme transitorie sugli scatti (Allegato F, anzianità ante 1989–1990): indica il numero di scatti se ne sei coinvolto.',
      'Maggiorazioni per lavoro notturno, festivo, straordinario.',
    ],
    'turismo-federalberghi-h052':[
      'Scatti: contano solo gli anni dopo il compimento dei 18 anni (art. 158). Il calcolatore non conosce la tua età: se sei stato assunto prima, indica il numero di scatti.',
      'Indennità di funzione dei Quadri calcolata su 14 mensilità: gli artt. 160–161 non la elencano espressamente fra le voci di 13ª e 14ª, quindi è un’assunzione. È assorbibile da trattamenti individuali, e con il superminimo l’assorbimento non è simulato.',
      'Terzi elementi e quote provinciali, contrattazione integrativa.',
      'Personale discontinuo o con orario normale di 44–45 ore, lavoratori extra e di surroga, apprendisti.',
      'Norme transitorie sugli scatti (artt. 226 e 276).',
    ],
    'studi-professionali-confprofessioni-h442':[
      'Elemento nazionale di allineamento contrattuale (42,35 / 102,53 / 110,40 € per 1°, 2° e 3° super): spetta solo a chi era inquadrato nel CCNL Confedertecnica e assunto prima del 1° luglio 2004.',
      'Importo di 43 € per 14 mensilità dovuto solo dagli studi che non aderiscono alla bilateralità.',
      'Una tantum 2024–2025.',
      'Maggiorazioni per lavoro straordinario, notturno e festivo.',
    ],
    'multiservizi-pulizia-k511':[
      'Imprese associate ad ANIP Confindustria: non firmano il rinnovo 2025 e le loro tabelle 2025–2029 non sono documentate. Il dato copre le centrali cooperative e Unionservizi Confapi.',
      'Parametri 115 (ausiliari scolastici e sanitari) e 125 (verniciatura): l’accordo 2025 pubblica solo l’aumento, non la retribuzione tabellare risultante. Non sono selezionabili.',
      'Elemento di garanzia retributiva dal 1° gennaio 2027: dipende dall’assenza di contrattazione di secondo livello.',
      'E.D.A.R. ad personam del CCNL 2007.',
      'Maggiorazioni per lavoro supplementare, straordinario, notturno e festivo.',
    ],
    'distribuzione-moderna-federdistribuzione-h008':[
      'Terzo elemento provinciale (art. 198): la tabella usa quello nazionale di 2,07 €.',
      'Una tantum 2024–2025 e personale retribuito a provvigione (art. 201).',
      'Contrattazione integrativa aziendale e territoriale.',
      'Indennità legate alla mansione o all’orario: notturno, festivo, maggiorazioni, straordinario.',
    ],
    'logistica-trasporto-merci-i100':[
      '6° livello Junior: cessato il 31 dicembre 2025 per previsione della declaratoria, non è selezionabile.',
      'Terzo elemento (anzianità fino al 30 settembre 1981), elemento distinto per chi era in servizio il 26 gennaio 2011, indennità di mensa locali, premi di operosità integrativi.',
      'Scatti delle norme transitorie: 8 per chi è stato assunto prima del 1° giugno 2000 nell’ex autotrasporto; importi precedenti per gli scatti maturati nei magazzini generali prima del 2013. Il numero dichiarato è comunque limitato a 5.',
      'Indennità di trasferta, straordinari, regimi orari aziendali per la qualifica 1 G-H.',
    ],
    'cooperative-sociali-t151':[
      'Contratto scaduto il 31 dicembre 2025, trattativa di rinnovo aperta: la tabella di ottobre 2025 resta in vigore e nessun aumento successivo è firmato.',
      'Premio territoriale di risultato, indennità di affiancamento (50 €, temporanea), indennità di cassa, turno, reperibilità.',
      'Accordi territoriali di gradualità (art. 77).',
      'ETDR Educatore 2025, cessato il 1° gennaio 2026.',
    ],
    'metalmeccanica-pmi-confapi-c018':[
      'Elemento perequativo di 485 € (art. 48): spetta solo nelle aziende senza contrattazione di secondo livello e a chi non ha superminimi o premi. Dipende da fatti aziendali, quindi resta fuori.',
      'Somma aggiuntiva di 32,75 € per i Quadri B del settore oreficeria.',
      'Adeguamento IPCA delle tranche 2027 e 2028 per l’eventuale eccedenza oltre il 2,653% e il 2,729% (art. 40): si verifica a giugno di ciascun anno.',
      'Norme transitorie sugli scatti (elementi congelati per anzianità ante 1980–1990).',
      'Indennità di trasferta e reperibilità, welfare aziendale, premio di risultato.',
    ],
    'grafici-editori-g011':[
      'Livello 8 Editori: assente dalla circolare datoriale dell’11 gennaio 2024, documentato solo da una fonte secondaria. Non è selezionabile.',
      'Scatti dei Quadri e di A super Grafici e dei Quadri Editori: l’art. 9 non ne pubblica il valore. Il livello è selezionabile, gli scatti no.',
      'Quadri: garanzia della retribuzione annua pari al trattamento contrattuale +7% (Parte Quarta art. 3), che dipende dalla retribuzione individuale.',
      'Elemento di garanzia retributiva di 250 € annui (art. 10): condizionato all’assenza di contrattazione di secondo livello.',
      'Struttura normativa letta sul testo 19 gennaio 2021: nessuna fonte segnala modifiche del rinnovo 2023 a orario, scatti, mensilità.',
      'Una tantum 2023 e contributi ai fondi welfare.',
    ],
    'poligrafici-quotidiani-g041':[
      'Tabella del 1° aprile 2021 in ultrattività: il contratto è scaduto il 31 dicembre 2022 e il rinnovo è in trattativa. Nessun aumento non firmato è anticipato.',
      'Livello 7 «parametro 238»: compare solo in una banca dati, senza fonte che ne spieghi la natura. Non è selezionabile.',
      'Tempo parziale: il testo 2008–2011 lo misura rispetto a 35 ore settimanali, l’orario medio di fatto, mentre l’orario contrattuale è di 36. Il calcolo riproporziona sulle 36.',
      'Scatti nella tredicesima: nessuna fonte lo dice espressamente; sono inclusi per assunzione.',
      'Maggiorazioni di turno, notturno e domenicale; welfare contrattuale e Fondo Casella.',
    ],
    'vetro-lampade-display-b132':[
      'Premio speciale di giugno (art. 34): 100 ore di retribuzione l’anno, calcolate sul minimo tabellare al netto dei 137 punti di contingenza conglobati nel 1977, più IPO e scatti. La tabella di quei 137 punti è in lire e per le categorie precedenti al 2001: nessuna fonte la riporta sui livelli attuali, quindi il premio non è nella cifra annua, che è più bassa della retribuzione contrattuale effettiva.',
      'EDR nel settore lampade e display: la tabella firmata 2023–2025 non lo riportava, le tabelle secondarie 2026 sì. Il calcolo lo include.',
      'Superminimo contrattuale del 1° livello nel soffio: 5,28 € nelle tabelle secondarie 2026, 5,16 € nel testo 2002 e nella tabella 2023–2025.',
      'Scatti: importi della banca dati Lavoro & Economia, non verificati su un testo firmato.',
      'Turnisti del ciclo continuo (232,5 giornate annue), maggiorazioni di turno, notturno, festivo; contribuzione Fonchim.',
    ],
  };

  /* ------------------------------------------------------------
     DATE
     ------------------------------------------------------------ */
  const oggi=()=>new Date().toISOString().slice(0,10);

  function dataIsoValida(valore){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(String(valore)))return false;
    const [anno,mese,giorno]=String(valore).split('-').map(Number);
    const data=new Date(Date.UTC(anno,mese-1,giorno));
    return data.getUTCFullYear()===anno&&data.getUTCMonth()===mese-1&&data.getUTCDate()===giorno;
  }

  function aggiungiAnni(iso,anni){
    const [anno,mese,giorno]=iso.split('-').map(Number);
    const ultimo=new Date(Date.UTC(anno+anni,mese,0)).getUTCDate();
    return new Date(Date.UTC(anno+anni,mese-1,Math.min(giorno,ultimo))).toISOString().slice(0,10);
  }

  function primoDelMeseSuccessivo(iso){
    const [anno,mese]=iso.split('-').map(Number);
    return new Date(Date.UTC(anno,mese,1)).toISOString().slice(0,10);
  }

  /* ------------------------------------------------------------
     LA RIPROPORZIONE

     Il D.Lgs. 81/2015, art. 7 c. 2, impone la proporzione alla
     ridotta entità della prestazione, e i contratti che ne parlano
     la ripetono. Le voci contrattuali e gli scatti sono retribuzione
     e seguono la stessa proporzione.

     Il superminimo no. È l'importo mensile che l'utente dichiara
     di percepire *già* al proprio orario: ridurlo di nuovo lo
     conterebbe part-time due volte.
     ------------------------------------------------------------ */
  function riproporziona(centesimi,oreSettimanali,oreContrattuali){
    if(oreSettimanali===oreContrattuali)return centesimi;
    return Math.round(centesimi*oreSettimanali/oreContrattuali);
  }

  const FONTE_RIPROPORZIONE=Object.freeze({
    titolo:'D.Lgs. 81/2015, art. 7 c. 2',
    nota:'il trattamento economico del lavoratore a tempo parziale è riproporzionato alla ridotta entità della prestazione',
    url:'https://www.normattiva.it/eli/stato/DECRETO%20LEGISLATIVO/2015/06/15/81/CONSOLIDATED',
  });

  /* ------------------------------------------------------------
     IL CATALOGO

     Il modello è una funzione dei dati, non il contrario: le stesse
     regole girano sul dataset vero e sui contratti inventati delle
     prove del modello. Nessuna regola conosce il nome di un CCNL.

     Che cosa un contratto può dichiarare, oltre a tabelle e livelli:

       · sezioni — parti del contratto con tabelle, calendario,
         scatti o orario propri (FIPE, Logistica, Multiservizi…).
         Chi non ne ha non ne dichiara, e la pagina non le mostra;
       · mensilità che dipendono dalla data ([{dal,mensilita}]);
       · per ogni voce, le mensilità in cui entra, quando sono meno
         di quelle del contratto (l'EDR del 1992 su 13);
       · per gli scatti, la famiglia di regole — cifra fissa,
         percentuale alla maturazione, quota unica, assenti — e le
         mensilità in cui entrano;
       · per ogni livello, i profili che portano una voce propria;
       · per ogni riga, il totale pubblicato e le voci che somma,
         o nessun totale se la fonte non lo stampa.
     ------------------------------------------------------------ */
  function creaCatalogo({versione,contratti,esclusioni}){

    function normalizzaScatti(regola){
      const tipo=regola.tipo||'cifraFissa';
      const massimo=tipo==='assenti'?0:tipo==='quotaUnica'?1:regola.massimo;
      return congela({...regola,tipo,massimo,decorre:regola.decorre||'meseSuccessivo',
        ...(regola.importi?{importi:congela({...regola.importi})}:{}),
        ...(regola.finestre?{finestre:congela(regola.finestre.map(f=>
          congela({...f,importi:congela({...f.importi})})))}:{})});
    }

    function normalizzaLivello(livello,ordine){
      const voci=congela(livello.voci.map(v=>congela({...v})));
      const totale=euro(voci.reduce((s,v)=>s+cent(v.importo),0));
      return congela({
        codice:livello.codice,nome:livello.nome,ordine,
        exCategoria:livello.exCategoria??null,
        voci,totale,
        totalePubblicato:livello.totalePubblicato??null,
        vociTotalePubblicato:livello.vociTotalePubblicato
          ?congela([...livello.vociTotalePubblicato]):null,
        discrepanzaFonte:livello.discrepanzaFonte?congela({...livello.discrepanzaFonte}):null,
        scatto:livello.scatto===undefined?null:livello.scatto,
        profili:congela((livello.profili||[]).map(p=>congela({...p,voce:congela({...p.voce})}))),
        ...(livello.nota?{nota:livello.nota}:{}),
      });
    }

    function normalizzaTabelle(tabelle,codiciLivello){
      return congela(tabelle.map(t=>congela({decorrenza:t.decorrenza,titolo:t.titolo,
        livelli:congela(t.livelli
          .filter(l=>!codiciLivello||codiciLivello.includes(l.codice))
          .map((l,i)=>normalizzaLivello(l,i)))})));
    }

    const normalizzaMensilita=m=>Array.isArray(m)
      ?congela(m.map(f=>congela({...f}))):m;

    function normalizzaContratto(c){
      const base={...c,
        mensilita:normalizzaMensilita(c.mensilita),
        scatti:normalizzaScatti(c.scatti),
        quoteAnnueMancanti:congela((c.quoteAnnueMancanti||[]).map(q=>congela({...q})))};
      delete base.sezioni;delete base.tabelle;
      if(!c.sezioni)
        return congela({...base,tabelle:normalizzaTabelle(c.tabelle)});
      return congela({...base,sezioni:congela(c.sezioni.map(s=>congela({
        ...s,
        oreSettimanali:s.oreSettimanali??c.oreSettimanali,
        mensilita:normalizzaMensilita(s.mensilita??c.mensilita),
        scatti:s.scatti?normalizzaScatti(s.scatti):normalizzaScatti(c.scatti),
        codiciLivello:s.codiciLivello?congela([...s.codiciLivello]):null,
        tabelle:normalizzaTabelle(s.tabelle,s.codiciLivello),
      })))});
    }

    const CONTRATTI=congela(contratti.map(normalizzaContratto));
    const ESCLUSIONI=congela(Object.fromEntries(Object.entries(esclusioni)
      .map(([id,voci])=>[id,congela([...voci])])));
    const perId=new Map(CONTRATTI.map(contratto=>[contratto.id,contratto]));

    /* --- LOOKUP ------------------------------------------------ */

    const trovaContratto=id=>id?perId.get(id)||null:null;

    /* Una quota annua che il contratto prevede ma che nessuna fonte
       quantifica rende la cifra annua parziale: allora non si chiama
       RAL, né nelle pagine né nel calcolatore. Una sola definizione per
       tutti, decisa dal dato e non dal nome del contratto (RIC-77). */
    const ralCompleta=id=>!contrattoNoto(id).quoteAnnueMancanti.length;
    const etichettaAnnua=id=>ralCompleta(id)?'RAL':'Base tabellare annualizzata';
    function avvisoRalParziale(id){
      if(ralCompleta(id))return null;
      const c=contrattoNoto(id);
      const mancanti=c.quoteAnnueMancanti.map(q=>`il ${q.nome} previsto dall’${q.fonte}`).join(' e ');
      return `Base tabellare annualizzata: lordo mensile di tabella × mensilità. Non è la RAL contrattuale completa: manca ${mancanti}, non ancora quantificato da una fonte primaria per i livelli attuali. Anche il netto mostrato è quindi sottostimato.`;
    }

    function contrattoNoto(id){
      const contratto=trovaContratto(id);
      if(!contratto)throw new RangeError(`CCNL sconosciuto: ${id}`);
      return contratto;
    }

    /* Il profilo da cui leggono tutte le regole: la sezione dove il
       contratto ne ha, il contratto stesso dove non ne ha. Chiedere
       un contratto sezionato senza dire quale sezione non ha una
       risposta onesta, quindi si ferma. */
    function profilo(id,sezione){
      const contratto=contrattoNoto(id);
      const nessuna=sezione===null||sezione===undefined||sezione==='';
      if(!contratto.sezioni){
        if(!nessuna)throw new RangeError(`${id} non ha sezioni: ${sezione}`);
        return {contratto,sezione:null,oreSettimanali:contratto.oreSettimanali,
          mensilita:contratto.mensilita,scatti:contratto.scatti,tabelle:contratto.tabelle,
          fonte:contratto.fonte};
      }
      if(nessuna)throw new RangeError(`Per ${id} serve la sezione del contratto`);
      const s=contratto.sezioni.find(x=>x.id===sezione);
      if(!s)throw new RangeError(`Sezione sconosciuta per ${id}: ${sezione}`);
      return {contratto,sezione:s,oreSettimanali:s.oreSettimanali,mensilita:s.mensilita,
        scatti:s.scatti,tabelle:s.tabelle,fonte:s.fonte||contratto.fonte};
    }

    const sezioni=id=>contrattoNoto(id).sezioni||congela([]);

    /* Il dataset porta anche le tranche future già firmate. Vigente
       è l'ultima decorrenza non successiva alla data chiesta: le
       stringhe ISO si ordinano da sole, quindi il confronto è
       testuale e non passa da Date. */
    function tabellaVigente(id,alla=oggi(),sezione){
      const {tabelle}=profilo(id,sezione);
      const applicabili=tabelle.filter(t=>t.decorrenza<=alla);
      if(!applicabili.length)
        throw new RangeError(`Nessuna tabella in vigore al ${alla} per ${id}`);
      return applicabili[applicabili.length-1];
    }

    function prossimaTabella(id,alla=oggi(),sezione){
      return profilo(id,sezione).tabelle.find(t=>t.decorrenza>alla)||null;
    }

    const livelli=(id,alla,sezione)=>tabellaVigente(id,alla,sezione).livelli;

    function trovaLivello(id,codice,alla,sezione){
      return livelli(id,alla,sezione).find(livello=>livello.codice===codice)||null;
    }

    const oreContrattuali=(id,sezione)=>profilo(id,sezione).oreSettimanali;
    const regolaScatti=(id,sezione)=>profilo(id,sezione).scatti;

    function mensilitaDi(mensilita,alla,id){
      if(!Array.isArray(mensilita))return mensilita;
      const applicabili=mensilita.filter(f=>f.dal<=alla);
      if(!applicabili.length)
        throw new RangeError(`Mensilità non definite al ${alla} per ${id}`);
      return applicabili[applicabili.length-1].mensilita;
    }

    const mensilitaAlla=(id,alla=oggi(),sezione)=>
      mensilitaDi(profilo(id,sezione).mensilita,alla,id);

    /* --- GLI SCATTI ---------------------------------------------

       L'input è la data d'inizio dell'anzianità, non gli anni nel
       livello corrente: così si modella il mese fra maturazione e
       decorrenza. Il numero già maturato resta sovrascrivibile per
       anzianità convenzionale, passaggi di livello o servizio
       pregresso — tranne dove il valore di ogni scatto dipende da
       quando è maturato, e un numero da solo non basta. */
    function scadenze(regola,dataInizio,alla){
      if(!dataIsoValida(dataInizio)||!dataIsoValida(alla)||dataInizio>alla)
        throw new RangeError(`Data di anzianità non valida: ${dataInizio}`);
      const anni=regola.tipo==='quotaUnica'
        ?[regola.dopoAnni]
        :Array.from({length:regola.massimo},(_,i)=>(i+1)*regola.cadenzaAnni);
      const elenco=[];
      for(const [i,a] of anni.entries()){
        const maturazione=aggiungiAnni(dataInizio,a);
        const decorrenza=regola.decorre==='anniversario'
          ?maturazione:primoDelMeseSuccessivo(maturazione);
        if(decorrenza>alla)break;
        elenco.push({n:i+1,maturazione,decorrenza});
      }
      return elenco;
    }

    function scattiMaturati(id,dataInizio,alla=oggi(),sezione){
      return scadenze(profilo(id,sezione).scatti,dataInizio,alla).length;
    }

    function importoScatto(regola,livello){
      if(regola.importi)return regola.importi[livello.codice]??null;
      return livello.scatto;
    }

    function scattiDocumentati(regola,livello){
      if(regola.tipo==='assenti')return true;
      if(regola.tipo==='percentualeMaturazione')
        return regola.finestre.some(f=>f.importi[livello.codice]!==undefined);
      return importoScatto(regola,livello)!==null;
    }

    /* I messaggi finiscono a schermo: date all'italiana e il nome del
       contratto, non l'ID. */
    const dataItaliana=iso=>iso.split('-').reverse().join('/');

    function valorePercentuale(regola,livello,maturazione,contratto){
      const finestre=regola.finestre.filter(f=>f.dal<=maturazione);
      const finestra=finestre[finestre.length-1];
      const importo=finestra?finestra.importi[livello.codice]:undefined;
      if(importo===undefined)
        throw new RangeError(`Con questa data uno scatto sarebbe maturato il ${dataItaliana(maturazione)}: `+
          `per ${contratto.nome}, ${livello.nome}, il valore non è documentato: le fonti partono dal `+
          `${dataItaliana(regola.finestre[0].dal)}. Il calcolo si ferma invece di stimarlo.`);
      return importo;
    }

    /* --- LA COMPOSIZIONE — l'unica funzione che produce un numero --- */
    function componiRal({ccnl,sezione=null,livello:codiceLivello,profilo:codiceProfilo=null,
      dataAnzianita=null,scatti=null,oreSettimanali=null,superminimoMensile=0,alla=oggi()}={}){
      const P=profilo(ccnl,sezione);
      const contratto=P.contratto;
      const tabella=tabellaVigente(ccnl,alla,sezione);
      const livello=tabella.livelli.find(l=>l.codice===codiceLivello);
      if(!livello)
        throw new RangeError(`Livello sconosciuto per ${ccnl}: ${codiceLivello}`);
      const M=mensilitaDi(P.mensilita,alla,ccnl);

      const ore=oreSettimanali===null||oreSettimanali===undefined
        ?P.oreSettimanali:Number(oreSettimanali);
      if(!Number.isFinite(ore)||ore<=0||ore>P.oreSettimanali)
        throw new RangeError(`Orario settimanale non valido per ${ccnl}: ${oreSettimanali}`);
      const prop=c=>riproporziona(c,ore,P.oreSettimanali);

      const scelto=codiceProfilo===null||codiceProfilo===undefined||codiceProfilo===''
        ?null:livello.profili.find(p=>p.id===codiceProfilo);
      if(scelto===undefined)
        throw new RangeError(`Profilo non previsto per ${ccnl} ${livello.codice}: ${codiceProfilo}`);

      /* Anzianità non dichiarata significa zero scatti, e la pagina
         lo dice invece di lasciarlo intendere. Un numero esplicito
         di scatti vince sull'anzianità, che è una stima. */
      const regola=P.scatti;
      const anzianitaDichiarata=dataAnzianita!==null&&dataAnzianita!==undefined&&dataAnzianita!=='';
      const dichiarati=scatti===null||scatti===undefined||scatti===''?null:Number(scatti);
      if(dichiarati!==null&&(!Number.isInteger(dichiarati)||dichiarati<0
        ||dichiarati>regola.massimo))
        throw new RangeError(`Numero di scatti non valido per ${ccnl}: ${scatti}`);
      const documentati=scattiDocumentati(regola,livello);
      if(!documentati&&(anzianitaDichiarata||dichiarati>0))
        throw new RangeError(`Scatti non calcolabili per ${contratto.nome}, ${livello.nome}: `+
          'il contratto non ne pubblica il valore per questo livello');
      if(regola.tipo==='percentualeMaturazione'&&dichiarati>0)
        throw new RangeError(`Per ${contratto.nome} ogni scatto vale quanto la tabella del giorno in cui `+
          'è maturato: serve la data di anzianità, il numero da solo non basta');

      let dettaglio=[];
      if(dichiarati===null&&anzianitaDichiarata&&documentati)
        dettaglio=scadenze(regola,dataAnzianita,alla);
      else if(dichiarati!==null){
        if(anzianitaDichiarata)scadenze(regola,dataAnzianita,alla);   // la data resta validata
        dettaglio=Array.from({length:dichiarati},(_,i)=>({n:i+1,maturazione:null,decorrenza:null}));
      }else if(anzianitaDichiarata)scadenze(regola,dataAnzianita,alla);
      dettaglio=dettaglio.map(s=>({...s,importo:regola.tipo==='percentualeMaturazione'
        ?valorePercentuale(regola,livello,s.maturazione,contratto)
        :importoScatto(regola,livello)}));
      const numeroScatti=dettaglio.length;
      const uniforme=regola.tipo!=='percentualeMaturazione'&&documentati&&regola.tipo!=='assenti';

      /* Le quote: una per gruppo di incidenza. Le voci che entrano in
         tutte le mensilità del contratto stanno insieme, riproporzionate
         sul loro totale come il contratto le stampa; ogni voce con
         un'incidenza diversa fa quota a sé. Poi il profilo, gli scatti,
         il superminimo. Dove tutto entra nelle stesse mensilità torna
         l'identità semplice (base + scatti + superminimo) × mensilità. */
      const quote=[];
      const quota=(id,nome,mensileCent,mensilita)=>
        quote.push({id,nome,mensileCent,mensilita,annuoCent:Math.round(mensileCent*mensilita)});
      const piene=livello.voci.filter(v=>(v.mensilita??M)===M);
      quota('base','Retribuzione contrattuale',prop(piene.reduce((s,v)=>s+cent(v.importo),0)),M);
      for(const v of livello.voci.filter(v=>(v.mensilita??M)!==M))
        quota(v.id,v.nome,prop(cent(v.importo)),v.mensilita);
      const nVoci=quote.length;
      if(scelto)quota(scelto.voce.id,scelto.voce.nome,prop(cent(scelto.voce.importo)),
        scelto.voce.mensilita??M);
      const scattiCent=prop(dettaglio.reduce((s,x)=>s+cent(x.importo),0));
      quota('scatti','Scatti di anzianità',scattiCent,regola.mensilita??M);
      const superminimoCent=cent(superminimoMensile||0);
      if(!Number.isFinite(superminimoCent)||superminimoCent<0)
        throw new RangeError(`Superminimo non valido: ${superminimoMensile}`);
      quota('superminimo','Superminimo',superminimoCent,M);

      const baseCent=quote.slice(0,nVoci).reduce((s,q)=>s+q.mensileCent,0);
      const mensileCent=quote.reduce((s,q)=>s+q.mensileCent,0);
      const ralCent=quote.reduce((s,q)=>s+q.annuoCent,0);

      return congela({
        ccnl:contratto.id,
        sezione:P.sezione?P.sezione.id:null,
        livello:livello.codice,
        profilo:scelto?scelto.id:null,
        decorrenza:tabella.decorrenza,
        mensilita:M,
        oreSettimanali:ore,
        oreContrattuali:P.oreSettimanali,
        partTime:ore<P.oreSettimanali,
        anzianitaDichiarata,
        scattiOverride:dichiarati!==null,
        famigliaScatti:regola.tipo,
        scattiPrevisti:regola.tipo!=='assenti',
        scattiDocumentati:documentati,
        numeroScatti,
        scattiAlTetto:regola.massimo>0&&numeroScatti>=regola.massimo,
        valoreScatto:uniforme?euro(prop(cent(importoScatto(regola,livello)))):null,
        dettaglioScatti:congela(dettaglio.map(s=>congela({...s}))),
        baseMensile:euro(baseCent),
        baseMensileIntera:livello.totale,
        scattiMensili:euro(scattiCent),
        superminimoMensile:euro(superminimoCent),
        mensileTotale:euro(mensileCent),
        ral:euro(ralCent),
        quote:congela(quote.map(q=>congela({id:q.id,nome:q.nome,mensile:euro(q.mensileCent),
          mensilita:q.mensilita,annuo:euro(q.annuoCent)}))),
        identitaSemplice:quote.every(q=>q.mensilita===M),
        ralCompleta:!contratto.quoteAnnueMancanti.length,
        quoteAnnueMancanti:contratto.quoteAnnueMancanti,
        esclusioni:congela([...(ESCLUSIONI[contratto.id]||[]),
          ...((P.sezione&&P.sezione.esclusioni)||[])]),
      });
    }

    /* Il totale che il contratto stampa e la somma delle voci che
       stampa accanto devono coincidere. Non è una prova che i
       numeri siano quelli giusti — è la guardia che li tiene
       insieme mentre li si trascrive, ed è ciò che fa cadere un
       refuso invece di lasciarlo entrare nel motore. Dove la fonte
       stessa sbaglia la somma, lo scarto va registrato nel dato con
       il suo importo esatto: uno scarto diverso fa cadere la prova. */
    function riconciliaLivello(livello){
      const somma=livello.voci.reduce((totale,v)=>totale+cent(v.importo),0);
      const pubblicato=livello.totalePubblicato??null;
      let scarto=0;
      if(pubblicato!==null){
        const comprese=livello.vociTotalePubblicato
          ?livello.voci.filter(v=>livello.vociTotalePubblicato.includes(v.id)):livello.voci;
        scarto=cent(pubblicato)-comprese.reduce((t,v)=>t+cent(v.importo),0);
      }
      const atteso=livello.discrepanzaFonte?cent(livello.discrepanzaFonte.scarto):0;
      return{somma:euro(somma),totale:livello.totale,
        verificata:somma===cent(livello.totale)&&scarto===atteso,
        tipo:pubblicato===null?'derivato':'pubblicato',
        totalePubblicato:pubblicato,scartoFonte:euro(scarto)};
    }

    return congela({VERSIONE_DATASET:versione,CONTRATTI,ESCLUSIONI,FONTE_RIPROPORZIONE,
      trovaContratto,sezioni,tabellaVigente,prossimaTabella,livelli,trovaLivello,
      oreContrattuali,regolaScatti,mensilitaAlla,ralCompleta,etichettaAnnua,avvisoRalParziale,
      scattiMaturati,riproporziona,componiRal,riconciliaLivello});
  }

  return congela({...creaCatalogo({versione:VERSIONE_DATASET,
    contratti:[...CONTRATTI_DATI,...CONTRATTI_GRUPPO_1],
    esclusioni:{...ESCLUSIONI_DATI,...ESCLUSIONI_GRUPPO_1}}),creaCatalogo});
});
