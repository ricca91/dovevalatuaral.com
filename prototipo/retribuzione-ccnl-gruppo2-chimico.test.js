const test=require('node:test');
const assert=require('node:assert/strict');

const R=require('./retribuzione-ccnl.js');
const C=require('./ccnl.js');
const P=require('./prove-ccnl.js');
const {provaDecorrenze,nettoRiconcilia,voci}=P;

/* Chimico-farmaceutico, industria, CNEL B011 (RIC-61, gruppo 2).
   Ogni atteso è preso dalla tabella TEM di p. 48 dell'ipotesi di
   rinnovo 15 aprile 2025 (sciolta il 4 giugno 2025, vigente dal
   1° luglio 2025 al 30 giugno 2028; copia Filctem = deposito CNEL
   221298) e dall'intesa 8 gennaio 2024, archiviate in
   processo/dati/fonti, e scritto qui a mano con il conto per esteso
   nel commento: nessun atteso è calcolato dalla funzione sotto prova.
   Data fissa, perché il dataset porta tranche future già firmate. */
const OGGI='2026-10-16';
const CHIMICO='chimico-farmaceutico-industria-b011';

const DATE=['2024-01-01','2024-07-01','2025-07-01','2025-12-01','2026-07-01','2027-07-01','2028-06-01'];
const CODICI=['A1','A2','A3','B1','B2','C1','C2','D1','D2','D3','E1','E2','E3','E4','F'];

const importo=(codice,alla,id)=>R.trovaLivello(CHIMICO,codice,alla).voci.find(v=>v.id===id)?.importo;

test.describe('Chimico-farmaceutico industria — B011',()=>{

  test('quindici righe, categorie A–F con posizioni organizzative, nessuna sezione',()=>{
    /* Art. 4: A 1-2-3, B 1-2, C 1-2, D 1-2-3, E 1-2-3-4, F. */
    assert.deepEqual(R.livelli(CHIMICO,OGGI).map(l=>l.codice),CODICI);
    assert.equal(R.trovaLivello(CHIMICO,'A2',OGGI).nome,'Categoria A, posizione organizzativa 2 — quadri');
    assert.equal(R.trovaLivello(CHIMICO,'D1',OGGI).nome,'Categoria D, posizione organizzativa 1');
    assert.equal(R.trovaLivello(CHIMICO,'F',OGGI).nome,'Categoria F');
  });

  test('tabella dal 1° luglio 2026: minimo, IPO ed EAR per posizione, nessun totale pubblicato',()=>{
    /* P. 48, colonna 1/7/2026 (Min. / IPO). A1 2.711,52 / 626,96;
       EAR quadri 190 (art. 16 rinnovo 2009). */
    const a1=R.trovaLivello(CHIMICO,'A1',OGGI);
    assert.deepEqual(voci(a1),[['minimo',2711.52],['ipo',626.96],['ear',190]]);
    /* La fonte non stampa il totale: derivato. 2.711,52 + 626,96 + 190 = 3.528,48. */
    assert.equal(a1.totalePubblicato,null);
    assert.equal(a1.totale,3528.48);
    /* B2: 2.504,22 / 245,39, EAR 100. */
    assert.deepEqual(voci(R.trovaLivello(CHIMICO,'B2',OGGI)),[['minimo',2504.22],['ipo',245.39],['ear',100]]);
    /* D1: 2.053,03 / 367,23, nessun EAR. */
    assert.deepEqual(voci(R.trovaLivello(CHIMICO,'D1',OGGI)),[['minimo',2053.03],['ipo',367.23]]);
    /* F: solo il minimo 1.821,46, IPO a 0,00 non esposta. */
    assert.deepEqual(voci(R.trovaLivello(CHIMICO,'F',OGGI)),[['minimo',1821.46]]);
    /* Il minimo è uguale fra le posizioni della stessa categoria; cambia l'IPO. */
    for(const [codici,minimo] of [[['A1','A2','A3'],2711.52],[['B1','B2'],2504.22],[['C1','C2'],2217.25],
      [['D1','D2','D3'],2053.03],[['E1','E2','E3','E4'],1856.87]])
      for(const c of codici) assert.equal(importo(c,OGGI,'minimo'),minimo,c);
    assert.deepEqual(['E1','E2','E3','E4'].map(c=>importo(c,OGGI,'ipo')),[282.41,169.27,97.42,48.17]);
  });

  test('l’EAR è solo delle categorie A e B; l’IPO manca solo alla F',()=>{
    for(const c of CODICI){
      const ear=importo(c,OGGI,'ear');
      assert.equal(ear,c[0]==='A'?190:c[0]==='B'?100:undefined,c);
      assert.equal(importo(c,OGGI,'ipo')===undefined,c==='F',c);
    }
  });

  test('le sette tabelle: 1/1/2024, 1/7/2024 e le cinque tranche del rinnovo 2025',()=>{
    provaDecorrenze(CHIMICO,null,DATE);
    /* D1, p. 48: minimo / IPO ai passi 1/7/2024 1.917,03 / 322,23;
       1/7/2025 1.993,03 / 347,23; 1/12/2025 2.008,03 / 352,23;
       1/7/2026 2.053,03 / 367,23; 1/7/2027 2.098,03 / 382,23;
       1/6/2028 2.111,03 / 385,23. Incrementi del minimo + IPO: 101, 20, 60, 60, 16 (= 257). */
    const attesi=[['2024-07-01',1917.03,322.23],['2025-07-01',1993.03,347.23],['2025-12-01',2008.03,352.23],
      ['2026-07-01',2053.03,367.23],['2027-07-01',2098.03,382.23],['2028-06-01',2111.03,385.23]];
    for(const [alla,minimo,ipo] of attesi){
      assert.equal(importo('D1',alla,'minimo'),minimo,alla);
      assert.equal(importo('D1',alla,'ipo'),ipo,alla);
    }
    /* Intesa 8 gennaio 2024, tabella dal 1/1/2024 (EDR già azzerato): D1 1.900,03 / 316,23. */
    assert.equal(importo('D1','2024-01-01','minimo'),1900.03);
    assert.equal(importo('D1','2024-01-01','ipo'),316.23);
    /* 1.993,03 + 347,23 = 2.340,26 e 1.917,03 + 322,23 = 2.239,26: +101. */
    assert.equal(Math.round((1993.03+347.23-1917.03-322.23)*100),10100);
    /* Fine contratto: nessuna tabella dopo il 1/6/2028 (scadenza 30/6/2028). */
    assert.equal(R.prossimaTabella(CHIMICO,'2028-06-01'),null);
  });

  test('l’EDR vale solo dal 1° luglio 2027: nelle tabelle in cui è zero non c’è la voce',()=>{
    /* Intesa 8/1/2024: EDR a 0,00 dal 1/1/2024. Ipotesi 2025, p. 49: dal 1/7/2027
       A1 39, A2 34, A3 33, B1 32, B2 30, C1 28, C2 27, D1 26, D2 25, D3 24,
       E1 22, E2 20, E3 19, E4 19, F 18. */
    const EDR=[39,34,33,32,30,28,27,26,25,24,22,20,19,19,18];
    for(const alla of ['2024-01-01','2025-12-01','2027-06-30'])
      for(const c of CODICI) assert.equal(importo(c,alla,'edr'),undefined,`${c} ${alla}`);
    for(const alla of ['2027-07-01','2028-06-01'])
      CODICI.forEach((c,i)=>assert.equal(importo(c,alla,'edr'),EDR[i],`${c} ${alla}`));
    /* Rinnovo 2018, art. 15 B1: l'EDR è «erogato per il numero di mensilità previste dal CCNL»:
       nessuna mensilità propria, vale le 13 del contratto. */
    assert.equal(R.trovaLivello(CHIMICO,'D1','2027-07-01').voci.find(v=>v.id==='edr').mensilita,undefined);
  });

  test('riscontri indipendenti: leggeinchiaro.it, TEM al 1/7/2026 e 2027–2028',()=>{
    /* leggeinchiaro.it, 13/10/2026: TEM = minimo + IPO. A1 3.338,48, D1 2.420,26, F 1.821,46. */
    const tem=c=>Math.round((importo(c,OGGI,'minimo')+(importo(c,OGGI,'ipo')||0))*100);
    assert.equal(tem('A1'),333848);
    assert.equal(tem('D1'),242026);
    assert.equal(tem('F'),182146);
    /* D1 2.480,26 al 1/7/2027 (2.098,03 + 382,23) e 2.496,26 al 1/6/2028 (2.111,03 + 385,23). */
    assert.equal(Math.round((importo('D1','2027-07-01','minimo')+importo('D1','2027-07-01','ipo'))*100),248026);
    assert.equal(Math.round((importo('D1','2028-06-01','minimo')+importo('D1','2028-06-01','ipo'))*100),249626);
  });

  test('scatti assenti dal 1° gennaio 2010 (art. 17 abrogato): nessuno scatto maturato',()=>{
    assert.equal(R.scattiMaturati(CHIMICO,'1980-01-01',OGGI),0);
    const r=R.componiRal({ccnl:CHIMICO,livello:'D1',dataAnzianita:'1990-01-01',alla:OGGI});
    assert.equal(r.numeroScatti,0);
    assert.equal(r.scattiPrevisti,false);
    assert.equal(r.scattiDocumentati,true);
    assert.equal(r.scattiMensili,0);
    assert.equal(r.ral,31463.38);
    /* Un numero di scatti dichiarato dall'utente è rifiutato. */
    assert.throws(()=>R.componiRal({ccnl:CHIMICO,livello:'D1',scatti:1,alla:OGGI}),RangeError);
    /* Nessun livello porta uno scatto in tabella. */
    for(const l of R.livelli(CHIMICO,OGGI)) assert.ok(!l.scatto,l.codice);
  });

  test('D1 tempo pieno alla data del dossier',()=>{
    /* 2.053,03 + 367,23 = 2.420,26 × 13 = 31.463,38. */
    const r=R.componiRal({ccnl:CHIMICO,livello:'D1',alla:OGGI});
    assert.equal(r.ral,31463.38);
    assert.equal(r.mensilita,13);
    assert.equal(r.oreContrattuali,40);
    nettoRiconcilia(r);
  });

  test('A1, livello più alto: minimo, IPO ed EAR dei quadri',()=>{
    /* 2.711,52 + 626,96 + 190,00 = 3.528,48 × 13 = 45.870,24. */
    const r=R.componiRal({ccnl:CHIMICO,livello:'A1',alla:OGGI});
    assert.equal(r.ral,45870.24);
    nettoRiconcilia(r);
  });

  test('B2: EAR di categoria B',()=>{
    /* 2.504,22 + 245,39 + 100,00 = 2.849,61 × 13 = 37.044,93. */
    assert.equal(R.componiRal({ccnl:CHIMICO,livello:'B2',alla:OGGI}).ral,37044.93);
  });

  test('F, estremo basso senza IPO',()=>{
    /* 1.821,46 × 13 = 23.678,98. */
    assert.equal(R.componiRal({ccnl:CHIMICO,livello:'F',alla:OGGI}).ral,23678.98);
  });

  test('giorno prima e giorno esatto delle tranche, D1',()=>{
    /* Giorno prima del 1/7/2026 vale la tranche 1/12/2025: 2.008,03 + 352,23 = 2.360,26 × 13 = 30.683,38. */
    assert.equal(R.componiRal({ccnl:CHIMICO,livello:'D1',alla:'2026-06-30'}).ral,30683.38);
    /* Giorno prima del 1/7/2025 vale la tabella 1/7/2024: 1.917,03 + 322,23 = 2.239,26 × 13 = 29.110,38. */
    assert.equal(R.componiRal({ccnl:CHIMICO,livello:'D1',alla:'2025-06-30'}).ral,29110.38);
    /* 1/7/2027, con EDR 26: 2.098,03 + 382,23 + 26 = 2.506,26 × 13 = 32.581,38. */
    assert.equal(R.componiRal({ccnl:CHIMICO,livello:'D1',alla:'2027-07-01'}).ral,32581.38);
  });

  test('tabelle future già firmate: A1 ed E4 al 1/6/2028 con EDR',()=>{
    /* A1: 2.793,52 + 659,96 + 190 + 39 = 3.682,48 × 13 = 47.872,24. */
    assert.equal(R.componiRal({ccnl:CHIMICO,livello:'A1',alla:'2028-06-01'}).ral,47872.24);
    /* E4: 1.909,87 + 49,17 + 19 = 1.978,04 × 13 = 25.714,52. */
    assert.equal(R.componiRal({ccnl:CHIMICO,livello:'E4',alla:'2028-06-01'}).ral,25714.52);
  });

  test('part-time: riproporzione su 40 ore (art. 3 E punto 5), EAR compreso',()=>{
    /* D1 20 ore: 2.420,26 × 20/40 = 1.210,13 × 13 = 15.731,69. */
    const d1=R.componiRal({ccnl:CHIMICO,livello:'D1',oreSettimanali:20,alla:OGGI});
    assert.equal(d1.partTime,true);
    assert.equal(d1.oreContrattuali,40);
    assert.equal(d1.ral,15731.69);
    nettoRiconcilia(d1);
    /* A2 30 ore: (2.711,52 + 360,07 + 190,00) = 3.261,59 × 30/40 = 2.446,1925 → 2.446,19
       (le voci con le stesse mensilità si riproporzionano sulla somma); × 13 = 31.800,47. */
    const a2=R.componiRal({ccnl:CHIMICO,livello:'A2',oreSettimanali:30,alla:OGGI});
    assert.equal(a2.ral,31800.47);
    nettoRiconcilia(a2);
    /* Il tempo pieno è 40, non 37 h 45': 40 ore equivalgono al tempo pieno. */
    assert.equal(R.componiRal({ccnl:CHIMICO,livello:'D1',oreSettimanali:40,alla:OGGI}).ral,31463.38);
  });

  test('superminimo: zero e positivo, non riproporzionato nel part-time',()=>{
    assert.equal(R.componiRal({ccnl:CHIMICO,livello:'D1',superminimoMensile:0,alla:OGGI}).ral,31463.38);
    /* D1 + 100: 2.520,26 × 13 = 32.763,38. */
    const r=R.componiRal({ccnl:CHIMICO,livello:'D1',superminimoMensile:100,alla:OGGI});
    assert.equal(r.ral,32763.38);
    nettoRiconcilia(r);
    /* D1 20 ore + 100 intero: 1.210,13 + 100 = 1.310,13 × 13 = 17.031,69. */
    const pt=R.componiRal({ccnl:CHIMICO,livello:'D1',oreSettimanali:20,superminimoMensile:100,alla:OGGI});
    assert.equal(pt.ral,17031.69);
    nettoRiconcilia(pt);
  });

  test('il superminimo non assorbe l’EAR: A2 con superminimo somma tutto',()=>{
    /* Assorbimento non simulato: 3.261,59 + 200 = 3.461,59 × 13 = 45.000,67. */
    assert.equal(R.componiRal({ccnl:CHIMICO,livello:'A2',superminimoMensile:200,alla:OGGI}).ral,45000.67);
  });

  test('date e livelli fuori dal dataset fanno fermare il calcolo',()=>{
    /* Il dataset parte dal 1/1/2024 (intesa 8 gennaio 2024). */
    assert.throws(()=>R.componiRal({ccnl:CHIMICO,livello:'D1',alla:'2023-12-31'}),RangeError);
    assert.throws(()=>R.componiRal({ccnl:CHIMICO,livello:'G',alla:OGGI}),RangeError);
    assert.throws(()=>R.componiRal({ccnl:CHIMICO,livello:'F1',alla:OGGI}),RangeError);
    assert.throws(()=>R.componiRal({ccnl:CHIMICO,sezione:'turnisti',livello:'D1',alla:OGGI}),RangeError);
  });

  test('il catalogo propone 13 mensilità e il contratto è identificato come B011',()=>{
    assert.equal(C.suggerisciMensilita(CHIMICO,12),13);
    assert.equal(C.trovaCcnl(CHIMICO).codiceCnel,'B011');
    assert.equal(C.trovaCcnl(CHIMICO).mensilita,R.mensilitaAlla(CHIMICO,OGGI));
    assert.equal(C.trovaCcnl(CHIMICO).dataRiferimento,'2025-04-15');
    assert.equal(R.trovaContratto(CHIMICO).codiceCnel,'B011');
    assert.equal(R.ralCompleta(CHIMICO),true);
    assert.equal(R.etichettaAnnua(CHIMICO),'RAL');
  });

  test('esclusioni: gli articoli e le voci lasciate fuori dalla RAL',()=>{
    const testo=R.ESCLUSIONI[CHIMICO].join('\n');
    for(const attesa of [/fibre chimiche/,/abrasivi/,/lubrificanti/,/art\. 17/,/31\/12\/2009/,/superminimo/,
      /EAR/,/assorbibile/,/non è simulato/,/art\. 3/,/IPT/,/premio di partecipazione/i,
      /perequativo/,/Fonchim/,/Faschim/,/294/,/apprendisti/i,/37 ore e 45/])
      assert.match(testo,attesa);
  });

  test('ogni riga riconcilia: totale derivato = somma delle voci, nessun totale pubblicato',()=>{
    for(const t of R.trovaContratto(CHIMICO).tabelle)
      for(const l of t.livelli){
        const r=R.riconciliaLivello(l);
        assert.equal(r.verificata,true,`${t.decorrenza} ${l.codice}`);
        assert.equal(r.tipo,'derivato');
      }
  });
});
