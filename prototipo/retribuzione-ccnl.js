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
        scatti:normalizzaScatti(c.scatti)};
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

    function valorePercentuale(regola,livello,maturazione,id){
      const finestre=regola.finestre.filter(f=>f.dal<=maturazione);
      const finestra=finestre[finestre.length-1];
      const importo=finestra?finestra.importi[livello.codice]:undefined;
      if(importo===undefined)
        throw new RangeError(`Scatto maturato il ${maturazione}: valore non documentato `+
          `per ${id} ${livello.codice} (le fonti partono dal ${regola.finestre[0].dal})`);
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
        throw new RangeError(`Scatti non calcolabili per ${ccnl} ${livello.codice}: `+
          'il contratto non ne pubblica il valore per questo livello');
      if(regola.tipo==='percentualeMaturazione'&&dichiarati>0)
        throw new RangeError(`Per ${ccnl} ogni scatto vale quanto la tabella del giorno in cui `+
          'è maturato: serve la data di anzianità, il numero da solo non basta');

      let dettaglio=[];
      if(dichiarati===null&&anzianitaDichiarata&&documentati)
        dettaglio=scadenze(regola,dataAnzianita,alla);
      else if(dichiarati!==null){
        if(anzianitaDichiarata)scadenze(regola,dataAnzianita,alla);   // la data resta validata
        dettaglio=Array.from({length:dichiarati},(_,i)=>({n:i+1,maturazione:null,decorrenza:null}));
      }else if(anzianitaDichiarata)scadenze(regola,dataAnzianita,alla);
      dettaglio=dettaglio.map(s=>({...s,importo:regola.tipo==='percentualeMaturazione'
        ?valorePercentuale(regola,livello,s.maturazione,ccnl)
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
      oreContrattuali,regolaScatti,mensilitaAlla,
      scattiMaturati,riproporziona,componiRal,riconciliaLivello});
  }

  return congela({...creaCatalogo({versione:VERSIONE_DATASET,
    contratti:CONTRATTI_DATI,esclusioni:ESCLUSIONI_DATI}),creaCatalogo});
});
