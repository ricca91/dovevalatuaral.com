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
      dataAnzianita:'2019-03-15',alla:'2026-09-22'}),/non documentato/);
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
