const test=require('node:test');
const assert=require('node:assert/strict');

const R=require('./retribuzione-ccnl.js');
const {calcola,applicaMensilita}=require('./motore.js');

/* Le estensioni del modello provate su contratti inventati, piccoli
   quanto basta. I numeri qui non sono di nessun CCNL: servono a
   vedere una regola alla volta, con conti che si fanno a mente.
   Le fixture con importi presi dalle fonti stanno in
   retribuzione-ccnl.test.js, contratto per contratto. */

const fonte={titolo:'fonte di prova',parte:'nessuna',url:'https://example.org',
  archivio:null,verificataIl:'2026-09-22'};
const scattiFissi={tipo:'cifraFissa',cadenzaAnni:2,massimo:3,
  base:'anzianità in azienda',articolo:'art. 1',decorre:'meseSuccessivo'};

const livello=(codice,voci,extra={})=>({codice,nome:`Livello ${codice}`,
  voci:voci.map(([id,importo,mensilita])=>({id,nome:id,importo,
    ...(mensilita?{mensilita}:{})})),...extra});

function catalogo(contratti){
  return R.creaCatalogo({versione:'prova',contratti,
    esclusioni:Object.fromEntries(contratti.map(c=>[c.id,['niente di escluso']]))});
}

const semplice={id:'semplice',nome:'Semplice',parti:'x',codiceCnel:'Z001',
  mensilita:14,oreSettimanali:40,scatti:scattiFissi,fonte,
  tabelle:[{decorrenza:'2026-01-01',titolo:'unica',livelli:[
    livello('A',[['minimo',1000]],{scatto:10}),
  ]}]};

test.describe('1 — incidenza per voce sulle mensilità aggiuntive',()=>{

  /* Una voce su 13 mensilità dentro un contratto a 14: l'EDR del
     Protocollo 1992. Minimo 1.000 × 14 + EDR 10 × 13 = 14.130. */
  test('una voce su 13 mensilità non viene moltiplicata per 14',()=>{
    const C=catalogo([{...semplice,tabelle:[{decorrenza:'2026-01-01',titolo:'unica',
      livelli:[livello('A',[['minimo',1000],['edr',10,13]],{scatto:10})]}]}]);
    const r=C.componiRal({ccnl:'semplice',livello:'A',alla:'2026-09-22'});
    assert.equal(r.baseMensile,1010);
    assert.equal(r.ral,14130);
    assert.deepEqual(r.quote.map(q=>[q.id,q.mensile,q.mensilita,q.annuo]),[
      ['base',1000,14,14000],['edr',10,13,130],
      ['scatti',0,14,0],['superminimo',0,14,0]]);
    assert.equal(r.identitaSemplice,false);
  });

  /* Gli scatti fuori dalla 14ª, come la FIPE (art. 184):
     2 scatti da 10 → 20 × 13 = 260; minimo 1.000 × 14. */
  test('gli scatti possono entrare in meno mensilità del minimo',()=>{
    const C=catalogo([{...semplice,scatti:{...scattiFissi,mensilita:13}}]);
    const r=C.componiRal({ccnl:'semplice',livello:'A',scatti:2,
      superminimoMensile:100,alla:'2026-09-22'});
    assert.equal(r.scattiMensili,20);
    assert.equal(r.mensileTotale,1120);
    assert.equal(r.ral,14000+260+1400);
  });

  test('con tutte le voci sulle stesse mensilità l’identità semplice regge',()=>{
    const C=catalogo([semplice]);
    const r=C.componiRal({ccnl:'semplice',livello:'A',scatti:1,alla:'2026-09-22'});
    assert.equal(r.identitaSemplice,true);
    assert.equal(r.ral,r.mensileTotale*14);
  });

  /* Part-time: ogni gruppo di incidenza si riproporziona per conto suo,
     poi si annualizza. 20 ore su 40: 500 × 14 + 5 × 13 = 7.065. */
  test('il part-time riproporziona ogni gruppo prima di annualizzarlo',()=>{
    const C=catalogo([{...semplice,tabelle:[{decorrenza:'2026-01-01',titolo:'unica',
      livelli:[livello('A',[['minimo',1000],['edr',10,13]],{scatto:10})]}]}]);
    const r=C.componiRal({ccnl:'semplice',livello:'A',oreSettimanali:20,alla:'2026-09-22'});
    assert.equal(r.baseMensile,505);
    assert.equal(r.ral,7065);
  });
});

test.describe('2 — mensilità che dipendono dalla data',()=>{
  const datata={...semplice,id:'datata',
    mensilita:[{dal:'2024-01-01',mensilita:13},{dal:'2025-01-01',mensilita:13.5}],
    tabelle:[{decorrenza:'2024-01-01',titolo:'unica',
      livelli:[livello('A',[['minimo',1000.01]],{scatto:10})]}]};

  test('il numero di mensilità è quello in vigore alla data',()=>{
    const C=catalogo([datata]);
    assert.equal(C.mensilitaAlla('datata','2024-12-31'),13);
    assert.equal(C.mensilitaAlla('datata','2025-01-01'),13.5);
    assert.throws(()=>C.mensilitaAlla('datata','2023-12-31'),RangeError);
  });

  /* 1.000,01 × 13,5 = 13.500,135: il mezzo centesimo si arrotonda
     sulla quota annua, non sul mensile. */
  test('una mensilità a metà si annualizza al centesimo',()=>{
    const C=catalogo([datata]);
    assert.equal(C.componiRal({ccnl:'datata',livello:'A',alla:'2024-12-31'}).ral,13000.13);
    const r=C.componiRal({ccnl:'datata',livello:'A',alla:'2025-01-01'});
    assert.equal(r.mensilita,13.5);
    assert.equal(r.ral,13500.14);
  });

  test('il motore accetta la media su 13,5 mensilità, non su frazioni qualsiasi',()=>{
    const annuale=calcola('27000');
    assert.equal(applicaMensilita(annuale,13.5).input.mensilita,13.5);
    assert.throws(()=>applicaMensilita(annuale,12.5),RangeError);
  });
});

test.describe('3 — sezioni con tabelle, calendari, scatti e orari propri',()=>{
  const sezionato={...semplice,id:'sezionato',tabelle:undefined,
    sezioni:[
      {id:'generale',nome:'Generale',tabelle:[
        {decorrenza:'2026-01-01',titolo:'prima',livelli:[livello('A',[['minimo',1000]],{scatto:10})]},
        {decorrenza:'2026-06-01',titolo:'seconda',livelli:[livello('A',[['minimo',1100]],{scatto:10})]}]},
      {id:'collettiva',nome:'Ristorazione collettiva',oreSettimanali:38,
        scatti:{...scattiFissi,cadenzaAnni:3,massimo:2},tabelle:[
        {decorrenza:'2026-01-01',titolo:'prima',livelli:[livello('A',[['minimo',1000]],{scatto:10})]},
        {decorrenza:'2026-09-01',titolo:'seconda',livelli:[livello('A',[['minimo',1100]],{scatto:10}),
          livello('B',[['minimo',900]],{scatto:8})]}]},
    ]};

  test('un contratto con sezioni le elenca, uno senza non ne ha',()=>{
    const C=catalogo([semplice,sezionato]);
    assert.deepEqual(C.sezioni('sezionato').map(s=>s.id),['generale','collettiva']);
    assert.deepEqual(C.sezioni('semplice'),[]);
  });

  test('ogni sezione ha il suo calendario di tranche',()=>{
    const C=catalogo([sezionato]);
    assert.equal(C.tabellaVigente('sezionato','2026-07-01','generale').decorrenza,'2026-06-01');
    assert.equal(C.tabellaVigente('sezionato','2026-07-01','collettiva').decorrenza,'2026-01-01');
    assert.equal(C.prossimaTabella('sezionato','2026-07-01','collettiva').decorrenza,'2026-09-01');
    assert.deepEqual(C.livelli('sezionato','2026-09-01','collettiva').map(l=>l.codice),['A','B']);
    assert.equal(C.trovaLivello('sezionato','B','2026-09-01','generale'),null);
  });

  test('la sezione è obbligatoria dove esiste e vietata dove non esiste',()=>{
    const C=catalogo([semplice,sezionato]);
    assert.throws(()=>C.tabellaVigente('sezionato','2026-07-01'),RangeError);
    assert.throws(()=>C.componiRal({ccnl:'sezionato',livello:'A',alla:'2026-07-01'}),RangeError);
    assert.throws(()=>C.componiRal({ccnl:'sezionato',sezione:'inesistente',livello:'A',
      alla:'2026-07-01'}),RangeError);
    assert.throws(()=>C.componiRal({ccnl:'semplice',sezione:'generale',livello:'A',
      alla:'2026-07-01'}),RangeError);
  });

  test('orario e scatti della sezione prevalgono su quelli del contratto',()=>{
    const C=catalogo([sezionato]);
    const r=C.componiRal({ccnl:'sezionato',sezione:'collettiva',livello:'A',
      dataAnzianita:'2020-01-01',oreSettimanali:19,alla:'2026-07-01'});
    assert.equal(r.sezione,'collettiva');
    assert.equal(r.oreContrattuali,38);
    assert.equal(r.numeroScatti,2);          // triennali, tetto 2
    assert.equal(r.baseMensile,500);
    assert.throws(()=>C.componiRal({ccnl:'sezionato',sezione:'collettiva',livello:'A',
      oreSettimanali:39,alla:'2026-07-01'}),RangeError);
    assert.equal(C.regolaScatti('sezionato','generale').massimo,3);
  });

  test('una sezione può esporre solo una parte dei livelli di tabelle condivise',()=>{
    const tabelle=[{decorrenza:'2026-01-01',titolo:'unica',livelli:[
      livello('Q',[['minimo',2000]]),livello('1',[['minimo',1000]])]}];
    const C=catalogo([{...semplice,id:'filtrato',tabelle:undefined,sezioni:[
      {id:'impiegati',nome:'Impiegati',codiciLivello:['Q'],tabelle},
      {id:'operai',nome:'Operai',codiciLivello:['1'],tabelle}]}]);
    assert.deepEqual(C.livelli('filtrato','2026-09-22','impiegati').map(l=>l.codice),['Q']);
    assert.deepEqual(C.livelli('filtrato','2026-09-22','operai').map(l=>l.codice),['1']);
  });
});

test.describe('4 — famiglie di scatti',()=>{

  test('cifra fissa: il valore viene dalla regola se la regola lo porta',()=>{
    const C=catalogo([{...semplice,scatti:{...scattiFissi,importi:{A:7}}}]);
    const r=C.componiRal({ccnl:'semplice',livello:'A',scatti:3,alla:'2026-09-22'});
    assert.equal(r.valoreScatto,7);
    assert.equal(r.scattiMensili,21);
    assert.equal(r.scattiAlTetto,true);
  });

  /* Percentuale della tabellare vigente alla maturazione: ogni scatto
     vale quanto la finestra in cui è maturato, e lo conserva. Biennali:
     assunto il 15/3/2021 → maturazioni 15/3/2023 (finestra 2022, 50),
     15/3/2025 (finestra 2024, 60); il terzo, 15/3/2027, è futuro. */
  const percentuale={...semplice,id:'percentuale',scatti:{tipo:'percentualeMaturazione',
    cadenzaAnni:2,massimo:8,base:'anzianità in azienda',articolo:'art. 22',
    decorre:'meseSuccessivo',finestre:[
      {dal:'2022-07-01',importi:{A:50}},
      {dal:'2024-07-01',importi:{A:60}},
      {dal:'2026-10-01',importi:{A:70}}]}};

  test('percentuale alla maturazione: somma per finestre',()=>{
    const C=catalogo([percentuale]);
    const r=C.componiRal({ccnl:'percentuale',livello:'A',dataAnzianita:'2021-03-15',
      alla:'2026-09-22'});
    assert.equal(r.numeroScatti,2);
    assert.deepEqual(r.dettaglioScatti.map(s=>[s.maturazione,s.decorrenza,s.importo]),
      [['2023-03-15','2023-04-01',50],['2025-03-15','2025-04-01',60]]);
    assert.equal(r.scattiMensili,110);
    assert.equal(r.valoreScatto,null);       // non c'è un valore unico
    /* La finestra di ottobre 2026 non rivaluta gli scatti già maturati. */
    const dopo=C.componiRal({ccnl:'percentuale',livello:'A',dataAnzianita:'2021-03-15',
      alla:'2026-10-01'});
    assert.equal(dopo.scattiMensili,110);
  });

  test('percentuale alla maturazione: prima della prima finestra il valore non è documentato',()=>{
    const C=catalogo([percentuale]);
    assert.throws(()=>C.componiRal({ccnl:'percentuale',livello:'A',
      dataAnzianita:'2019-03-15',alla:'2026-09-22'}),/non è documentato/);
    /* Senza date il valore non si ricostruisce: il numero dichiarato non basta. */
    assert.throws(()=>C.componiRal({ccnl:'percentuale',livello:'A',scatti:2,
      alla:'2026-09-22'}),/data/);
    assert.equal(C.componiRal({ccnl:'percentuale',livello:'A',scatti:0,
      alla:'2026-09-22'}).scattiMensili,0);
  });

  /* Quota unica dopo quattro anni nel settore, come l'anzianità
     forfettaria degli operai Multiservizi: spetta dal quinto anno. */
  const quota={...semplice,id:'quota',scatti:{tipo:'quotaUnica',dopoAnni:4,
    base:'anzianità nel settore',articolo:'art. 22',decorre:'anniversario',
    importi:{A:51.02}}};

  test('quota unica: zero fino al quarto anno, una sola quota dal quinto',()=>{
    const C=catalogo([quota]);
    assert.equal(C.scattiMaturati('quota','2022-09-23','2026-09-22'),0);
    assert.equal(C.scattiMaturati('quota','2022-09-22','2026-09-22'),1);
    assert.equal(C.scattiMaturati('quota','1990-01-01','2026-09-22'),1);
    const r=C.componiRal({ccnl:'quota',livello:'A',dataAnzianita:'2010-01-01',alla:'2026-09-22'});
    assert.equal(r.scattiMensili,51.02);
    assert.equal(r.scattiAlTetto,true);
    assert.throws(()=>C.componiRal({ccnl:'quota',livello:'A',scatti:2,alla:'2026-09-22'}),RangeError);
  });

  test('scatti assenti e scatti non documentati non sono la stessa cosa',()=>{
    const C=catalogo([
      {...semplice,id:'assenti',scatti:{tipo:'assenti',articolo:'nessuno'}},
      {...semplice,id:'lacuna',tabelle:[{decorrenza:'2026-01-01',titolo:'unica',
        livelli:[livello('A',[['minimo',1000]],{scatto:null})]}]}]);
    const assenti=C.componiRal({ccnl:'assenti',livello:'A',dataAnzianita:'2000-01-01',
      alla:'2026-09-22'});
    assert.equal(assenti.numeroScatti,0);
    assert.equal(assenti.scattiPrevisti,false);
    assert.equal(assenti.scattiDocumentati,true);
    assert.throws(()=>C.componiRal({ccnl:'assenti',livello:'A',scatti:1,alla:'2026-09-22'}),RangeError);

    const lacuna=C.componiRal({ccnl:'lacuna',livello:'A',alla:'2026-09-22'});
    assert.equal(lacuna.scattiDocumentati,false);
    assert.equal(lacuna.scattiMensili,0);
    assert.throws(()=>C.componiRal({ccnl:'lacuna',livello:'A',dataAnzianita:'2000-01-01',
      alla:'2026-09-22'}),/non calcolabili/);
    assert.throws(()=>C.componiRal({ccnl:'lacuna',livello:'A',scatti:1,alla:'2026-09-22'}),
      /non calcolabili/);
  });
});

test.describe('5 — voci per livello o per profilo',()=>{
  const profili={...semplice,id:'profili',tabelle:[{decorrenza:'2026-01-01',titolo:'unica',
    livelli:[livello('D1',[['minimo',1500]],{scatto:20,profili:[
      {id:'infermiere-generico',nome:'Infermiere generico',
        voce:{id:'indennitaProfessionale',nome:'Indennità professionale',importo:61.97}}]}),
    livello('C1',[['minimo',1300]],{scatto:18})]}]};

  test('il profilo aggiunge la sua voce solo se scelto',()=>{
    const C=catalogo([profili]);
    const senza=C.componiRal({ccnl:'profili',livello:'D1',alla:'2026-09-22'});
    assert.equal(senza.profilo,null);
    assert.equal(senza.ral,1500*14);
    const con=C.componiRal({ccnl:'profili',livello:'D1',profilo:'infermiere-generico',
      alla:'2026-09-22'});
    assert.equal(con.profilo,'infermiere-generico');
    assert.equal(con.baseMensile,1500);
    assert.deepEqual(con.quote.find(q=>q.id==='indennitaProfessionale'),
      {id:'indennitaProfessionale',nome:'Indennità professionale',mensile:61.97,
        mensilita:14,annuo:867.58});
    assert.equal(con.ral,21000+867.58);
  });

  test('un profilo che il livello non prevede si ferma',()=>{
    const C=catalogo([profili]);
    assert.throws(()=>C.componiRal({ccnl:'profili',livello:'C1',
      profilo:'infermiere-generico',alla:'2026-09-22'}),RangeError);
  });
});

test.describe('6 — orario contrattuale per contratto o sezione',()=>{
  test('il tempo pieno è quello del contratto, e il part-time si misura lì',()=>{
    const C=catalogo([{...semplice,oreSettimanali:36}]);
    const pieno=C.componiRal({ccnl:'semplice',livello:'A',alla:'2026-09-22'});
    assert.equal(pieno.oreSettimanali,36);
    assert.equal(pieno.partTime,false);
    const ridotto=C.componiRal({ccnl:'semplice',livello:'A',oreSettimanali:18,alla:'2026-09-22'});
    assert.equal(ridotto.baseMensile,500);
    assert.equal(C.oreContrattuali('semplice'),36);
    assert.throws(()=>C.componiRal({ccnl:'semplice',livello:'A',oreSettimanali:40,
      alla:'2026-09-22'}),RangeError);
  });
});

test.describe('7 — totale pubblicato contro totale derivato',()=>{
  const conTotali={...semplice,id:'totali',tabelle:[{decorrenza:'2026-01-01',titolo:'unica',
    livelli:[
      livello('P',[['minimo',1000],['epa',30]],{scatto:10,totalePubblicato:1030}),
      livello('D',[['minimo',1000],['epa',30]],{scatto:10}),
      livello('E',[['minimo',1000],['epa',30]],{scatto:10,totalePubblicato:1030.06,
        discrepanzaFonte:{scarto:0.06,nota:'refuso di stampa del totale'}}),
      livello('S',[['minimo',1000],['epa',30],['edr',10.33,13]],{scatto:10,
        totalePubblicato:1030,vociTotalePubblicato:['minimo','epa']}),
    ]}]};

  test('la riconciliazione distingue pubblicato, derivato e discrepanza nota',()=>{
    const C=catalogo([conTotali]);
    const conti=codice=>C.riconciliaLivello(C.trovaLivello('totali',codice,'2026-09-22'));
    assert.deepEqual(conti('P'),{somma:1030,totale:1030,verificata:true,
      tipo:'pubblicato',totalePubblicato:1030,scartoFonte:0});
    assert.deepEqual(conti('D'),{somma:1030,totale:1030,verificata:true,
      tipo:'derivato',totalePubblicato:null,scartoFonte:0});
    assert.deepEqual(conti('E'),{somma:1030,totale:1030,verificata:true,
      tipo:'pubblicato',totalePubblicato:1030.06,scartoFonte:0.06});
    assert.equal(conti('S').verificata,true);
    assert.equal(conti('S').totale,1040.33);
  });

  test('una discrepanza non registrata fa cadere la riconciliazione',()=>{
    const C=catalogo([{...conTotali,tabelle:[{decorrenza:'2026-01-01',titolo:'unica',
      livelli:[livello('X',[['minimo',1000],['epa',30]],{scatto:10,totalePubblicato:1030.06})]}]}]);
    assert.equal(C.riconciliaLivello(C.trovaLivello('totali','X','2026-09-22')).verificata,false);
  });

  test('la RAL usa la somma delle voci, non il totale stampato con il refuso',()=>{
    const C=catalogo([conTotali]);
    assert.equal(C.componiRal({ccnl:'totali',livello:'E',alla:'2026-09-22'}).ral,1030*14);
  });
});

test.describe('8 — righe che si succedono per anzianità',()=>{
  /* I rider della Logistica: una riga d'ingresso e una dopo 6 mesi.
     La data di anzianità sceglie la riga maturata; senza data resta
     quella scelta. */
  const progressione={articolo:'art. 1',passi:[
    {codice:'R0',nome:'ingresso',dopoMesi:0},{codice:'R6',nome:'dopo 6 mesi',dopoMesi:6}]};
  const conProgressione={...semplice,id:'progressione',tabelle:[{decorrenza:'2026-01-01',titolo:'unica',
    livelli:[
      livello('R0',[['minimo',1000]],{scatto:10,progressione}),
      livello('R6',[['minimo',1100]],{scatto:10,progressione}),
      livello('B',[['minimo',2000]],{scatto:10}),
    ]}]};
  const C=catalogo([conProgressione]);
  const componi=(livello,dataAnzianita,alla)=>
    C.componiRal({ccnl:'progressione',livello,dataAnzianita,alla});

  test('la riga applicata è quella maturata alla data, in entrambe le direzioni',()=>{
    assert.equal(componi('R0','2026-01-15','2026-07-14').livello,'R0');
    const passato=componi('R0','2026-01-15','2026-07-15');
    assert.equal(passato.livello,'R6');
    assert.equal(passato.ral,1100*14);
    assert.deepEqual({...passato.progressione},
      {richiesto:'R0',applicato:'R6',dal:'2026-07-15',articolo:'art. 1'});
    assert.equal(componi('R6','2026-03-01','2026-07-15').livello,'R0');
  });

  /* Sei mesi dal 31 agosto finiscono l'ultimo giorno di febbraio. */
  test('i mesi si contano sul calendario, con l’ultimo giorno del mese',()=>{
    assert.equal(componi('R0','2025-08-31','2026-02-27').livello,'R0');
    assert.equal(componi('R0','2025-08-31','2026-02-28').progressione.dal,'2026-02-28');
  });

  test('senza data o fuori dalla progressione la riga resta quella scelta',()=>{
    const scelta=C.componiRal({ccnl:'progressione',livello:'R6',alla:'2026-09-22'});
    assert.equal(scelta.livello,'R6');
    assert.equal(scelta.livelloRichiesto,'R6');
    assert.equal(scelta.progressione,null);
    assert.equal(componi('B','2026-03-01','2026-09-22').progressione,null);
    assert.throws(()=>componi('R0','2026-10-01','2026-09-22'),RangeError);
  });
});

test.describe('9 — scatti con primo scatto diverso, decorrenza nel mese e anzianità sospesa',()=>{
  const conScatti=(id,regola)=>({...semplice,id,scatti:{...scattiFissi,...regola}});
  const maturazioni=(C,id,inizio,alla)=>C.componiRal({ccnl:id,livello:'A',dataAnzianita:inizio,alla})
    .dettaglioScatti.map(s=>[s.maturazione,s.decorrenza]);

  /* Il primo dopo 4 anni, poi ogni 3: assunto il 15/3/2015 matura il
     15/3/2019, il 15/3/2022 e il 15/3/2025, ciascuno dal 1° del mese
     successivo. Con la sola cadenza sarebbero 2018, 2021, 2024. */
  test('primoDopoAnni: il primo scatto dopo N anni, i successivi ogni cadenzaAnni',()=>{
    const C=catalogo([conScatti('scaglionato',{primoDopoAnni:4,cadenzaAnni:3,massimo:3})]);
    const maturati=alla=>C.scattiMaturati('scaglionato','2015-03-15',alla);
    assert.equal(maturati('2019-03-31'),0);
    assert.equal(maturati('2019-04-01'),1);
    assert.equal(maturati('2022-03-31'),1);
    assert.equal(maturati('2022-04-01'),2);
    assert.equal(maturati('2025-04-01'),3);
    assert.equal(maturati('2040-01-01'),3);       // tetto
    assert.deepEqual(maturazioni(C,'scaglionato','2015-03-15','2026-09-22'),[
      ['2019-03-15','2019-04-01'],['2022-03-15','2022-04-01'],['2025-03-15','2025-04-01']]);
    assert.equal(C.regolaScatti('scaglionato').primoDopoAnni,4);
  });

  test('senza primoDopoAnni il primo scatto matura dopo cadenzaAnni, come prima',()=>{
    const C=catalogo([semplice]);
    assert.equal(C.regolaScatti('semplice').primoDopoAnni,2);
    assert.equal(C.scattiMaturati('semplice','2015-03-15','2017-03-31'),0);
    assert.equal(C.scattiMaturati('semplice','2015-03-15','2017-04-01'),1);
  });

  /* Lo scatto decorre dal 1° del mese in cui matura: assunto il
     20/10/2024, biennale, matura il 20/10/2026 ma è dovuto dal
     1/10/2026 — già il 16 ottobre, prima della maturazione. Con il
     mese successivo sarebbe dovuto dal 1/11/2026. */
  test('decorre meseMaturazione: dal primo giorno del mese in cui lo scatto matura',()=>{
    const C=catalogo([conScatti('nelMese',{decorre:'meseMaturazione'}),
      conScatti('dopo',{decorre:'meseSuccessivo'})]);
    assert.equal(C.scattiMaturati('nelMese','2024-10-20','2026-09-30'),0);
    assert.equal(C.scattiMaturati('nelMese','2024-10-20','2026-10-01'),1);
    assert.equal(C.scattiMaturati('dopo','2024-10-20','2026-10-16'),0);
    assert.equal(C.scattiMaturati('dopo','2024-10-20','2026-11-01'),1);
    assert.deepEqual(maturazioni(C,'nelMese','2024-10-20','2026-10-16'),[['2026-10-20','2026-10-01']]);
    /* Assunto il primo del mese: decorrenza e maturazione coincidono. */
    assert.deepEqual(maturazioni(C,'nelMese','2024-10-01','2026-10-01'),[['2026-10-01','2026-10-01']]);
  });

  test('una modalità di decorrenza sconosciuta ferma il catalogo invece di diventare un default',()=>{
    assert.throws(()=>catalogo([conScatti('refuso',{decorre:'inizioMese'})]),/decorrenza/);
  });

  /* Un anno in cui l'anzianità non matura, il 2020: biennali, tetto 3,
     dal 1° del mese successivo. Le maturazioni che cadrebbero dopo
     l'inizio del periodo slittano di quanto del periodo cade dopo
     l'inizio dell'anzianità; quelle già compiute restano dove sono. */
  const sospesa=conScatti('sospesa',{sospensioni:[{dal:'2020-01-01',al:'2020-12-31',articolo:'art. 9'}]});

  test('sospensioni: inizio prima del periodo, solo le maturazioni successive slittano',()=>{
    const C=catalogo([sospesa]);
    /* 10/6/2017: il primo il 10/6/2019, prima del periodo; il secondo
       cadrebbe il 10/6/2021 e slitta di 12 mesi, come il terzo. */
    assert.deepEqual(maturazioni(C,'sospesa','2017-06-10','2026-09-22'),[
      ['2019-06-10','2019-07-01'],['2022-06-10','2022-07-01'],['2024-06-10','2024-07-01']]);
    /* 1/1/2018: due anni compiuti il 31/12/2019, il primo matura il
       1/1/2020, giorno d'inizio del periodo, e non slitta. */
    assert.deepEqual(maturazioni(C,'sospesa','2018-01-01','2026-09-22').slice(0,2),[
      ['2020-01-01','2020-02-01'],['2023-01-01','2023-02-01']]);
  });

  /* 10/5/2018: il primo cadrebbe il 10/5/2020, dentro il periodo. Al
     31/12/2019 mancano 4 mesi e 9 giorni, che si compiono dal
     1/1/2021: maturazione 10/5/2021, decorrenza 1/6/2021. */
  test('sospensioni: una maturazione a cavallo del periodo si compie dopo la ripresa',()=>{
    const C=catalogo([sospesa]);
    assert.equal(C.scattiMaturati('sospesa','2018-05-10','2021-05-31'),0);
    assert.equal(C.scattiMaturati('sospesa','2018-05-10','2021-06-01'),1);
    assert.deepEqual(maturazioni(C,'sospesa','2018-05-10','2026-09-22')[0],['2021-05-10','2021-06-01']);
  });

  test('sospensioni: inizio dentro il periodo conta dalla ripresa, inizio dopo non slitta',()=>{
    const C=catalogo([sospesa]);
    /* 15/6/2020: l'anzianità comincia a maturare il 1/1/2021. */
    assert.deepEqual(maturazioni(C,'sospesa','2020-06-15','2026-09-22'),[
      ['2023-01-01','2023-02-01'],['2025-01-01','2025-02-01']]);
    assert.deepEqual(maturazioni(C,'sospesa','2021-03-01','2026-09-22'),[
      ['2023-03-01','2023-04-01'],['2025-03-01','2025-04-01']]);
  });

  /* Due periodi, dichiarati in disordine: 6 mesi nel 2018, 12 nel
     2020. Dal 1/1/2017 il primo cadrebbe il 1/1/2019, slitta di 6 al
     1/7/2019, che è prima del secondo periodo; il secondo cadrebbe il
     1/1/2021 e slitta di 6 e poi di 12, al 1/7/2022. Controprova:
     12 mesi nel 2017, 18 da luglio 2018 a dicembre 2019, i 18 che
     mancano da gennaio 2021 a giugno 2022. */
  test('sospensioni: più periodi si sommano in ordine di data',()=>{
    const C=catalogo([conScatti('dueVolte',{sospensioni:[
      {dal:'2020-01-01',al:'2020-12-31',articolo:'art. 9'},
      {dal:'2018-01-01',al:'2018-06-30',articolo:'art. 9'}]})]);
    assert.deepEqual(maturazioni(C,'dueVolte','2017-01-01','2026-09-22'),[
      ['2019-07-01','2019-08-01'],['2022-07-01','2022-08-01'],['2024-07-01','2024-08-01']]);
    assert.deepEqual(C.regolaScatti('dueVolte').sospensioni.map(s=>s.dal),['2018-01-01','2020-01-01']);
  });

  /* Un regime che il catalogo non modella per le anzianità più vecchie
     (i 12 scatti dei bancari in servizio al 19 dicembre 1994): una data
     precedente alla soglia ferma il calcolo invece di dare un numero,
     con data all'italiana, nome del contratto e motivo. Il numero di
     scatti dichiarato a mano resta possibile entro il tetto. */
  const soglia=conScatti('soglia',{anzianitaDal:{data:'2000-03-01',
    motivo:'chi era in servizio prima ha un regime che il calcolo non applica'}});
  const ferma=(...attesi)=>errore=>errore instanceof RangeError
    &&attesi.every(a=>errore.message.includes(a));

  test('anzianitaDal: un’anzianità precedente alla soglia ferma il calcolo, non dà un numero',()=>{
    const C=catalogo([soglia]);
    /* Dal giorno della soglia si calcola: 1/3/2000, biennali, tetto 3. */
    assert.equal(C.scattiMaturati('soglia','2000-03-01','2026-09-22'),3);
    const atteso=ferma('29/02/2000','Semplice','chi era in servizio prima ha un regime che il calcolo non applica');
    assert.throws(()=>C.scattiMaturati('soglia','2000-02-29','2026-09-22'),atteso);
    assert.throws(()=>C.componiRal({ccnl:'soglia',livello:'A',dataAnzianita:'2000-02-29',
      alla:'2026-09-22'}),atteso);
    /* Una data non valida resta l'errore di sempre. */
    assert.throws(()=>C.scattiMaturati('soglia','2000-02-30','2026-09-22'),/non valida/);
  });

  /* Minimo 1.000 + 3 scatti da 10 = 1.030 × 14 = 14.420, con o senza la data. */
  test('anzianitaDal: il numero di scatti dichiarato resta possibile entro il tetto',()=>{
    const C=catalogo([soglia]);
    assert.equal(C.componiRal({ccnl:'soglia',livello:'A',scatti:3,dataAnzianita:'1990-01-01',
      alla:'2026-09-22'}).ral,14420);
    assert.equal(C.componiRal({ccnl:'soglia',livello:'A',scatti:3,alla:'2026-09-22'}).ral,14420);
    assert.throws(()=>C.componiRal({ccnl:'soglia',livello:'A',scatti:4,alla:'2026-09-22'}),RangeError);
  });

  test('senza anzianitaDal nessuna soglia; una soglia senza data valida o senza motivo ferma il catalogo',()=>{
    const C=catalogo([semplice]);
    assert.equal(C.regolaScatti('semplice').anzianitaDal,null);
    assert.equal(C.scattiMaturati('semplice','1950-01-01','2026-09-22'),3);
    assert.deepEqual({...catalogo([soglia]).regolaScatti('soglia').anzianitaDal},
      {data:'2000-03-01',motivo:'chi era in servizio prima ha un regime che il calcolo non applica'});
    for(const anzianitaDal of [{data:'2000-02-30',motivo:'x'},{data:'2000-03-01'},{data:'2000-03-01',motivo:''}])
      assert.throws(()=>catalogo([conScatti('rotta',{anzianitaDal})]),/anzianità/);
  });

  test('un periodo sospeso con date non valide ferma il catalogo',()=>{
    assert.throws(()=>catalogo([conScatti('rovescio',{sospensioni:[
      {dal:'2020-12-31',al:'2020-01-01',articolo:'art. 9'}]})]),/sospe/);
    assert.throws(()=>catalogo([conScatti('mese13',{sospensioni:[
      {dal:'2020-13-01',al:'2020-12-31',articolo:'art. 9'}]})]),/sospe/);
    assert.deepEqual(catalogo([semplice]).regolaScatti('semplice').sospensioni,[]);
  });
});

test.describe('10 — la pagina CCNL e livello descrive la regola degli scatti',()=>{
  const vm=require('node:vm');
  const fs=require('node:fs');
  const path=require('node:path');
  const sorgente=fs.readFileSync(path.join(__dirname,'ccnl-livello-ui.js'),'utf8');

  /* Il minimo di DOM che la pagina tocca al caricamento: si apre con
     contratto, sezione e livello nell'indirizzo, come dalle pagine dei
     minimi, e si leggono i testi d'aiuto che mostra. */
  class Elemento{
    constructor(){this.options=[];this.value='';this.hidden=false;this.textContent='';
      this.disabled=false;this.html='';}
    get innerHTML(){return this.html;}
    set innerHTML(v){this.html=v;if(v===''){this.options=[];this.value='';}}
    append(o){this.options.push(o);if(this.options.length===1)this.value=o.value;}
    addEventListener(){}
    setAttribute(){}
    removeAttribute(){}
    focus(){}
  }
  function aiuti(C,richiesta){
    const elementi=new Map();
    const document={getElementById:id=>{
      if(!elementi.has(id))elementi.set(id,new Elemento());
      return elementi.get(id);},createElement:()=>({value:'',textContent:''})};
    vm.runInNewContext(sorgente,{RETRIBUZIONE_CCNL:C,CALCOLATORE_AVVIO:{errore:false,pronto(){}},
      document,location:{search:`?${new URLSearchParams(richiesta)}`},URLSearchParams,
      matchMedia:()=>({matches:false}),eur:String});
    return {scatti:document.getElementById('scatti-help').textContent,
      anzianita:document.getElementById('anzianita-help').textContent};
  }

  /* Il testo che la pagina mostrava prima dell'estensione, contratto
     per contratto: chi non dichiara primo scatto, decorrenza nel mese
     o periodi sospesi deve vedere esattamente lo stesso. */
  test('i contratti che non dichiarano le regole nuove mostrano lo stesso testo di prima',()=>{
    const R=require('./retribuzione-ccnl.js');
    const fisso=(massimo,anni)=>`Massimo ${massimo}, uno ogni ${anni} anni. Se lo compili prevale sull’anzianità.`;
    const atteso=[
      [fisso(10,3),['terziario-confcommercio-h011','distribuzione-moderna-federdistribuzione-h008']],
      [fisso(5,2),['metalmeccanica-industria-c011','logistica-trasporto-merci-i100|non-viaggiante',
        'logistica-trasporto-merci-i100|viaggiante','cooperative-sociali-t151','metalmeccanica-pmi-confapi-c018',
        'grafici-editori-g011|grafici|A','grafici-editori-g011|editori|1','vetro-lampade-display-b132|meccanizzati',
        'vetro-lampade-display-b132|trasformazione','vetro-lampade-display-b132|soffio',
        'vetro-lampade-display-b132|soffio-36-ore','vetro-lampade-display-b132|lampade',
        'alimentare-industria-e012|alimentare','alimentare-industria-e012|olearia-margariniera',
        'gomma-plastica-industria-b371','poligrafici-quotidiani-g041']],
      [fisso(6,4),['pubblici-esercizi-fipe-h05y|generale','pubblici-esercizi-fipe-h05y|collettiva',
        'pubblici-esercizi-fipe-h05y|minori']],
      [fisso(6,3),['turismo-federalberghi-h052|generale','turismo-federalberghi-h052|minori',
        'agenzie-viaggi-fiavet-h04z']],
      [fisso(8,3),['studi-professionali-confprofessioni-h442']],
      ['Fino a 8, uno ogni 2 anni, ciascuno pari alla tabella del giorno in cui matura: qui serve la data di anzianità, il numero da solo non basta.',
        ['multiservizi-pulizia-k511|impiegati']],
      ['Nessuno scatto: una quota unica di anzianità forfettaria dal quinto anno nel settore. Scrivi 1 se la percepisci già, 0 se no.',
        ['multiservizi-pulizia-k511|operai']],
    ];
    for(const [testo,chiavi] of atteso)
      for(const chiave of chiavi){
        const [ccnl,sezione,livello]=chiave.split('|');
        assert.equal(aiuti(R,{ccnl,...(sezione?{sezione}:{}),...(livello?{livello}:{})}).scatti,testo,chiave);
      }
  });

  /* Il primo dopo 4 anni, poi ogni 3, dal primo del mese di
     maturazione, con un periodo sospeso: la pagina dice tutte e tre
     le cose, perché sono quelle che spostano la data da indicare. */
  test('primo scatto diverso, mese di maturazione e periodi sospesi sono detti',()=>{
    const C=catalogo([{...semplice,id:'nuovo',scatti:{...scattiFissi,massimo:8,primoDopoAnni:4,
      cadenzaAnni:3,decorre:'meseMaturazione',
      sospensioni:[{dal:'2013-01-01',al:'2014-07-31',articolo:'art. 9'}]}}]);
    assert.equal(aiuti(C,{ccnl:'nuovo'}).scatti,
      'Massimo 8, il primo dopo 4 anni e poi uno ogni 3, ciascuno dal primo giorno del mese in cui matura. '+
      'L’anzianità non matura dal 1° gennaio 2013 al 31 luglio 2014 (art. 9). '+
      'Se lo compili prevale sull’anzianità.');
    /* Una sola regola nuova alla volta: le altre parti non compaiono. */
    const soloPrimo=catalogo([{...semplice,id:'primo',scatti:{...scattiFissi,primoDopoAnni:4}}]);
    assert.equal(aiuti(soloPrimo,{ccnl:'primo'}).scatti,
      'Massimo 3, il primo dopo 4 anni e poi uno ogni 2. Se lo compili prevale sull’anzianità.');
    const soloMese=catalogo([{...semplice,id:'mese',scatti:{...scattiFissi,decorre:'meseMaturazione'}}]);
    assert.equal(aiuti(soloMese,{ccnl:'mese'}).scatti,
      'Massimo 3, uno ogni 2 anni, ciascuno dal primo giorno del mese in cui matura. Se lo compili prevale sull’anzianità.');
  });

  test('la percentuale alla maturazione dice primo scatto e periodi sospesi allo stesso modo',()=>{
    const C=catalogo([{...semplice,id:'perc',scatti:{tipo:'percentualeMaturazione',cadenzaAnni:2,
      primoDopoAnni:3,massimo:8,base:'anzianità in azienda',articolo:'art. 22',
      sospensioni:[{dal:'2020-01-01',al:'2020-12-31',articolo:'art. 9'}],
      finestre:[{dal:'2022-07-01',importi:{A:50}}]}}]);
    assert.equal(aiuti(C,{ccnl:'perc'}).scatti,
      'Fino a 8, il primo dopo 3 anni e poi uno ogni 2, ciascuno pari alla tabella del giorno in cui matura: '+
      'qui serve la data di anzianità, il numero da solo non basta. '+
      'L’anzianità non matura dal 1° gennaio 2020 al 31 dicembre 2020 (art. 9).');
  });

  /* La soglia di anzianità si dice prima del calcolo, nell'aiuto della
     data: chi ha un'anzianità più vecchia sa già che il calcolo si
     fermerà e perché. Chi non ne dichiara legge l'aiuto di sempre. */
  test('l’aiuto dell’anzianità dice la soglia oltre la quale il calcolo dalla data si ferma',()=>{
    const C=catalogo([semplice,{...semplice,id:'soglia',scatti:{...scattiFissi,
      anzianitaDal:{data:'2000-03-01',motivo:'chi era in servizio prima ha un regime che il calcolo non applica'}}}]);
    const base='Conta l’anzianità in azienda. Serve per far decorrere lo scatto dal momento giusto; lascia vuoto se non la sai.';
    assert.equal(aiuti(C,{ccnl:'soglia'}).anzianita,base+' Con un’anzianità anteriore al 1° marzo 2000 '+
      'il calcolo dalla data si ferma: chi era in servizio prima ha un regime che il calcolo non applica.');
    assert.equal(aiuti(C,{ccnl:'semplice'}).anzianita,base);
    assert.equal(C.descrizioneScatti(C.regolaScatti('semplice')).anzianitaDal,'');
  });

  /* Una sola descrizione per la pagina CCNL e livello e per le pagine
     dei minimi: il catalogo scrive cadenza, decorrenza e periodi
     sospesi, le pagine compongono la frase. Le date sono quelle delle
     pagine dei minimi, «1° gennaio». */
  test('il catalogo descrive cadenza, decorrenza e periodi sospesi; vuoto ciò che la regola non dichiara',()=>{
    const C=catalogo([semplice,{...semplice,id:'nuovo',scatti:{...scattiFissi,massimo:8,primoDopoAnni:4,
      cadenzaAnni:3,decorre:'meseMaturazione',sospensioni:[
        {dal:'2020-03-15',al:'2020-12-31',articolo:'art. 10'},
        {dal:'2013-01-01',al:'2014-07-31',articolo:'art. 9'}]}}]);
    assert.deepEqual({...C.descrizioneScatti(C.regolaScatti('nuovo'))},{
      cadenza:'il primo dopo 4 anni e poi uno ogni 3',
      decorrenza:', ciascuno dal primo giorno del mese in cui matura',
      sospensioni:' L’anzianità non matura dal 1° gennaio 2013 al 31 luglio 2014 (art. 9).'+
        ' L’anzianità non matura dal 15 marzo 2020 al 31 dicembre 2020 (art. 10).',
      anzianitaDal:''});
    assert.deepEqual({...C.descrizioneScatti(C.regolaScatti('semplice'))},
      {cadenza:'uno ogni 2 anni',decorrenza:'',sospensioni:'',anzianitaDal:''});
  });
});
