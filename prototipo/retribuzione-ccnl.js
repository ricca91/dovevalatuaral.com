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

  const VERSIONE_DATASET='2026-09-07';

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

     Fonte: testo coordinato pubblicato da Filcams CGIL, che è
     parte firmataria, per l'art. 205 (aumenti periodici di
     anzianità) e le tabelle dei minimi per decorrenza.
     Copia archiviata in processo/dati/fonti/.

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
    titolo:'CCNL Terziario, Distribuzione e Servizi — tabelle retributive e art. 205',
    parte:'Filcams CGIL, organizzazione sindacale firmataria',
    url:'https://cgil-agb.it/images/Filcams/pdf/commercio/TERZIARIO_confcommercio.pdf',
    archivio:'processo/dati/fonti/filcams-ccnl-terziario-testo-coordinato-2026-09-07.pdf',
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
     COSTRUZIONE DEL CATALOGO
     ------------------------------------------------------------ */

  function livelloTerziario([codice,nome,pagaBase,contingenza,indennitaFunzione,
    elementoAggiuntivo,terzoElemento,totalePubblicato],ordine){
    return congela({codice,nome,ordine,exCategoria:null,
      voci:congela([
        congela({id:'pagaBase',nome:'Paga base nazionale conglobata',importo:pagaBase}),
        congela({id:'contingenza',nome:'Ex indennità di contingenza',importo:contingenza}),
        ...(indennitaFunzione?[congela({id:'indennitaFunzione',
          nome:'Indennità di funzione',importo:indennitaFunzione})]:[]),
        ...(elementoAggiuntivo?[congela({id:'elementoAggiuntivo',
          nome:'Elemento aggiuntivo della paga base',importo:elementoAggiuntivo})]:[]),
        ...(terzoElemento?[congela({id:'terzoElemento',
          nome:'Terzo elemento nazionale',importo:terzoElemento})]:[]),
      ]),
      totale:totalePubblicato,
      scatto:SCATTI_TERZIARIO[codice]});
  }

  function livelloMetalmeccanica([codice,nome,exCategoria,minimo,scatto],ordine){
    return congela({codice,nome,ordine,exCategoria,
      voci:congela([congela({id:'minimo',nome:'Minimo tabellare',importo:minimo})]),
      totale:minimo,scatto});
  }

  const CONTRATTI=Object.freeze([
    congela({
      id:'terziario-confcommercio-h011',
      nome:'Terziario, Distribuzione e Servizi',
      parti:'Confcommercio',
      codiceCnel:'H011',
      mensilita:14,
      oreSettimanali:40,
      scatti:congela({cadenzaAnni:3,massimo:10,
        base:'anzianità di servizio presso la stessa azienda o gruppo aziendale',
        articolo:'art. 205 — aumenti periodici di anzianità',
        decorrenza:'dal primo giorno del mese successivo a quello in cui si compie il triennio'}),
      fonte:FONTE_TERZIARIO,
      fonteAccordo:FONTE_ACCORDO_TERZIARIO,
      tabelle:Object.freeze(TABELLE_TERZIARIO.map(([decorrenza,titolo,righe])=>congela({
        decorrenza,titolo,
        livelli:Object.freeze(righe.map(livelloTerziario)),
      }))),
    }),
    congela({
      id:'metalmeccanica-industria-c011',
      nome:'Industria Metalmeccanica e Installazione Impianti',
      parti:'Federmeccanica / Assistal',
      codiceCnel:'C011',
      mensilita:13,
      oreSettimanali:40,
      scatti:congela({cadenzaAnni:2,massimo:5,
        base:'anzianità di servizio presso la stessa azienda o gruppo aziendale',
        articolo:'aumenti periodici di anzianità — massimo 5 bienni',
        decorrenza:'dal primo giorno del mese successivo a quello in cui si compie il biennio'}),
      fonte:FONTE_METALMECCANICA,
      fonteAccordo:null,
      tabelle:Object.freeze([congela({
        decorrenza:'2026-06-01',
        titolo:'adeguamento IPCA-NEI del verbale di accordo 16 giugno 2026',
        livelli:Object.freeze(TABELLA_METALMECCANICA.map(livelloMetalmeccanica)),
      })]),
    }),
  ]);

  const perId=new Map(CONTRATTI.map(contratto=>[contratto.id,contratto]));

  /* Ciò che il numero non contiene. Sta nel dataset e non nella
     pagina perché è parte del dato: una base nazionale presentata
     come «il minimo applicabile» sarebbe una bugia, e l'elenco
     delle esclusioni è ciò che la rende un'affermazione onesta. */
  const ESCLUSIONI=Object.freeze({
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
  });

  /* ------------------------------------------------------------
     LOOKUP
     ------------------------------------------------------------ */

  const trovaContratto=id=>id?perId.get(id)||null:null;

  /* Il dataset porta anche le tranche future già firmate. Vigente
     è l'ultima decorrenza non successiva alla data chiesta: le
     stringhe ISO si ordinano da sole, quindi il confronto è
     testuale e non passa da Date. */
  function tabellaVigente(id,alla=new Date().toISOString().slice(0,10)){
    const contratto=trovaContratto(id);
    if(!contratto)throw new RangeError(`CCNL sconosciuto: ${id}`);
    const applicabili=contratto.tabelle.filter(t=>t.decorrenza<=alla);
    if(!applicabili.length)
      throw new RangeError(`Nessuna tabella in vigore al ${alla} per ${id}`);
    return applicabili[applicabili.length-1];
  }

  function prossimaTabella(id,alla=new Date().toISOString().slice(0,10)){
    const contratto=trovaContratto(id);
    if(!contratto)throw new RangeError(`CCNL sconosciuto: ${id}`);
    return contratto.tabelle.find(t=>t.decorrenza>alla)||null;
  }

  function livelli(id,alla){
    return tabellaVigente(id,alla).livelli;
  }

  function trovaLivello(id,codice,alla){
    return livelli(id,alla).find(livello=>livello.codice===codice)||null;
  }

  /* ------------------------------------------------------------
     GLI SCATTI

     L'input è l'anzianità in azienda, non nel livello corrente:
     è ciò che entrambi i contratti misurano. Il numero di scatti
     già maturati resta comunque sovrascrivibile, perché chi ha
     avuto passaggi di livello, servizio pregresso o periodi in
     somministrazione conosce il proprio numero meglio di quanto
     lo sappia ricostruire una divisione.

     Il calcolatore ragiona ad anni compiuti. Entrambi i contratti
     fanno decorrere lo scatto dal primo giorno del mese successivo
     a quello di maturazione: c'è quindi fino a un mese in cui lo
     scatto è maturato e non ancora in paga, e questo scarto non
     è modellato. È dichiarato nella pagina, non nascosto qui.
     ------------------------------------------------------------ */
  function scattiMaturati(id,anniAnzianita){
    const contratto=trovaContratto(id);
    if(!contratto)throw new RangeError(`CCNL sconosciuto: ${id}`);
    const anni=Number(anniAnzianita);
    if(!Number.isFinite(anni)||anni<0)
      throw new RangeError(`Anzianità non valida: ${anniAnzianita}`);
    return Math.min(contratto.scatti.massimo,
      Math.floor(Math.floor(anni)/contratto.scatti.cadenzaAnni));
  }

  /* ------------------------------------------------------------
     LA RIPROPORZIONE

     Nessuno dei due CCNL pubblica una regola propria per il
     part-time: la proporzione discende dall'art. 7 c. 1 del
     D.Lgs. 81/2015, per cui il trattamento economico del
     lavoratore a tempo parziale è riproporzionato alla ridotta
     entità della prestazione. Per la stessa ragione non esiste
     una regola distinta per gli scatti, che sono retribuzione:
     si riproporzionano come la base.

     Il superminimo no. È l'importo mensile che l'utente dichiara
     di percepire *già* al proprio orario: ridurlo di nuovo lo
     conterebbe part-time due volte.
     ------------------------------------------------------------ */
  function riproporziona(centesimi,oreSettimanali,oreContrattuali){
    if(oreSettimanali===oreContrattuali)return centesimi;
    return Math.round(centesimi*oreSettimanali/oreContrattuali);
  }

  const FONTE_RIPROPORZIONE=Object.freeze({
    titolo:'D.Lgs. 81/2015, art. 7 c. 1',
    nota:'il trattamento economico del lavoratore a tempo parziale è riproporzionato alla ridotta entità della prestazione',
    url:'https://www.normattiva.it/eli/stato/DECRETO%20LEGISLATIVO/2015/06/15/81/CONSOLIDATED',
  });

  /* ------------------------------------------------------------
     LA COMPOSIZIONE — l'unica funzione che produce un numero
     ------------------------------------------------------------ */
  function componiRal({ccnl,livello:codiceLivello,anniAnzianita=null,scatti=null,
    oreSettimanali=null,superminimoMensile=0,alla}={}){
    const contratto=trovaContratto(ccnl);
    if(!contratto)throw new RangeError(`CCNL sconosciuto: ${ccnl}`);
    const tabella=tabellaVigente(ccnl,alla);
    const livello=tabella.livelli.find(l=>l.codice===codiceLivello);
    if(!livello)
      throw new RangeError(`Livello sconosciuto per ${ccnl}: ${codiceLivello}`);

    const ore=oreSettimanali===null||oreSettimanali===undefined
      ? contratto.oreSettimanali:Number(oreSettimanali);
    if(!Number.isFinite(ore)||ore<=0||ore>contratto.oreSettimanali)
      throw new RangeError(`Orario settimanale non valido per ${ccnl}: ${oreSettimanali}`);

    /* Anzianità non dichiarata significa zero scatti, e la pagina
       lo dice invece di lasciarlo intendere. Un numero esplicito
       di scatti vince sull'anzianità, che è una stima. */
    const dichiarati=scatti===null||scatti===undefined?null:Number(scatti);
    if(dichiarati!==null&&(!Number.isInteger(dichiarati)||dichiarati<0
      ||dichiarati>contratto.scatti.massimo))
      throw new RangeError(`Numero di scatti non valido per ${ccnl}: ${scatti}`);
    const numeroScatti=dichiarati!==null?dichiarati
      :anniAnzianita===null||anniAnzianita===undefined?0
      :scattiMaturati(ccnl,anniAnzianita);

    const baseCent=riproporziona(cent(livello.totale),ore,contratto.oreSettimanali);
    const scattiCent=riproporziona(cent(livello.scatto)*numeroScatti,ore,contratto.oreSettimanali);
    const superminimoCent=cent(superminimoMensile||0);
    if(!Number.isFinite(superminimoCent)||superminimoCent<0)
      throw new RangeError(`Superminimo non valido: ${superminimoMensile}`);

    const mensileCent=baseCent+scattiCent+superminimoCent;
    const ralCent=mensileCent*contratto.mensilita;

    return Object.freeze({
      ccnl:contratto.id,
      livello:livello.codice,
      decorrenza:tabella.decorrenza,
      mensilita:contratto.mensilita,
      oreSettimanali:ore,
      oreContrattuali:contratto.oreSettimanali,
      partTime:ore<contratto.oreSettimanali,
      anzianitaDichiarata:anniAnzianita!==null&&anniAnzianita!==undefined,
      scattiOverride:dichiarati!==null,
      numeroScatti,
      scattiAlTetto:numeroScatti>=contratto.scatti.massimo,
      valoreScatto:euro(riproporziona(cent(livello.scatto),ore,contratto.oreSettimanali)),
      baseMensile:euro(baseCent),
      baseMensileIntera:livello.totale,
      scattiMensili:euro(scattiCent),
      superminimoMensile:euro(superminimoCent),
      mensileTotale:euro(mensileCent),
      ral:euro(ralCent),
      esclusioni:ESCLUSIONI[contratto.id],
    });
  }

  /* Il totale che il contratto stampa e la somma delle voci che
     stampa accanto devono coincidere. Non è una prova che i
     numeri siano quelli giusti — è la guardia che li tiene
     insieme mentre li si trascrive, ed è ciò che fa cadere un
     refuso invece di lasciarlo entrare nel motore. */
  function riconciliaLivello(livello){
    const somma=livello.voci.reduce((totale,voce)=>totale+cent(voce.importo),0);
    return{somma:euro(somma),totale:livello.totale,
      verificata:somma===cent(livello.totale)};
  }

  return Object.freeze({VERSIONE_DATASET,CONTRATTI,ESCLUSIONI,FONTE_RIPROPORZIONE,
    trovaContratto,tabellaVigente,prossimaTabella,livelli,trovaLivello,
    scattiMaturati,riproporziona,componiRal,riconciliaLivello});
});
