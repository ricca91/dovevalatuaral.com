const test=require('node:test');
const assert=require('node:assert/strict');

const R=require('./retribuzione-ccnl.js');
const {CCNL,suggerisciMensilita,trovaCcnl}=require('./ccnl.js');
const {provaDecorrenze,nettoRiconcilia,voci}=require('./prove-ccnl.js');

/* Credito — ABI, aree professionali e quadri direttivi — J241 (RIC-61).
   Ogni importo atteso è preso dalla fonte archiviata e scritto a mano,
   con il conto per esteso nel commento: testo coordinato FABI del CCNL
   23 novembre 2023, Allegato 2, tabella «Dal 1° marzo 2026», p. 165 a
   stampa (167 del PDF). Le nove righe coincidono con Edotto (19/08/2025,
   indipendente) e con First CISL (24/02/2026). La data è fissa. */
const OGGI='2026-10-16';
const ABI='credito-abi-j241';
const AREE='aree-qd12';
const QD34='qd34';

test.describe('Credito — ABI, aree professionali e quadri direttivi — J241',()=>{

  /* Due sezioni sulla stessa tabella di nove livelli: cambia solo la
     regola degli scatti (massimo 8 contro 7, artt. 94 c. 2 e 103 c. 2). */
  test('due sezioni sulla stessa tabella, livelli nell’ordine della fonte, 37 ore',()=>{
    assert.deepEqual(R.sezioni(ABI).map(s=>s.id),[AREE,QD34]);
    assert.deepEqual(R.livelli(ABI,OGGI,AREE).map(l=>l.codice),
      ['QD2','QD1','3A4','3A3','3A2','3A1','AU']);
    assert.deepEqual(R.livelli(ABI,OGGI,QD34).map(l=>l.codice),['QD4','QD3']);
    assert.equal(R.oreContrattuali(ABI,AREE),37);
    assert.equal(R.oreContrattuali(ABI,QD34),37);
    assert.equal(R.trovaLivello(ABI,'AU',OGGI,AREE).nome,'Area unificata (ex 1ª e 2ª area professionale)');
    assert.equal(R.trovaLivello(ABI,'3A4',OGGI,AREE).nome,'3ª area professionale, 4° livello');
    assert.equal(R.trovaLivello(ABI,'QD3',OGGI,QD34).nome,'Quadro direttivo di 3° livello');
  });

  /* Allegato 2, dal 1° marzo 2026: una sola voce, lo stipendio; la
     fonte non stampa un totale. Lo scatto è la somma delle due colonne
     che spettano «per ciascuno scatto» (artt. 93 e 102):
     QD4 e QD3 95,31 + 14,30 = 109,61; QD2…3ª area 1° 41,55 + 7,99 = 49,54;
     Area unificata 29,07 + 5,59 = 34,66. */
  test('tabella vigente: stipendio, totale derivato, scatto con l’importo ex ristrutturazione',()=>{
    for(const [sezione,codice,stipendio,scatto] of [
      [QD34,'QD4',5160.06,109.61],[QD34,'QD3',4396.88,109.61],
      [AREE,'QD2',3965.48,49.54],[AREE,'QD1',3743.21,49.54],
      [AREE,'3A4',3341.90,49.54],[AREE,'3A3',3059.49,49.54],
      [AREE,'3A2',2890.41,49.54],[AREE,'3A1',2742.34,49.54],
      [AREE,'AU',2479.45,34.66]]){
      const l=R.trovaLivello(ABI,codice,OGGI,sezione);
      assert.deepEqual(voci(l),[['stipendio',stipendio]],codice);
      assert.equal(l.totalePubblicato,null,codice);
      assert.equal(l.totale,stipendio,codice);
      assert.equal(l.scatto,scatto,codice);
      assert.match(l.nota,/ex ristrutturazione tabellare/,codice);
    }
  });

  /* Nel dataset entra solo la tabella vigente dal 1° marzo 2026, ultima
     tranche del rinnovo 2023: il contratto è scaduto il 31 marzo 2026 e
     nessun rinnovo è firmato. Prima del 1° marzo nessuna tabella. */
  test('una sola tabella, dal 1° marzo 2026, in entrambe le sezioni',()=>{
    provaDecorrenze(ABI,AREE,['2026-03-01']);
    provaDecorrenze(ABI,QD34,['2026-03-01']);
    assert.throws(()=>R.componiRal({ccnl:ABI,sezione:AREE,livello:'3A4',alla:'2026-02-28'}),RangeError);
  });

  const maturazioni=r=>r.dettaglioScatti.map(s=>[s.maturazione,s.decorrenza]);

  /* Art. 103 c. 1: «4 anni per il primo scatto in tutti i casi di
     assunzione», poi cadenza triennale; «Ogni scatto decorre dal primo
     giorno del mese in cui matura». 3ª area 4° livello assunto il
     10/5/2015: 10/5/2019, 10/5/2022, 10/5/2025, ciascuno dal 1° maggio.
     (3.341,90 + 3 × 49,54) × 13 = (3.341,90 + 148,62) × 13
     = 3.490,52 × 13 = 45.376,76. */
  test('scatti: il primo dopo 4 anni, i successivi ogni 3, dal primo del mese in cui maturano',()=>{
    const maturati=alla=>R.scattiMaturati(ABI,'2015-05-10',alla,AREE);
    assert.equal(maturati('2019-04-30'),0);
    assert.equal(maturati('2019-05-01'),1);
    assert.equal(maturati('2022-04-30'),1);
    assert.equal(maturati('2022-05-01'),2);
    assert.equal(maturati('2025-05-01'),3);
    const r=R.componiRal({ccnl:ABI,sezione:AREE,livello:'3A4',dataAnzianita:'2015-05-10',alla:OGGI});
    assert.deepEqual(maturazioni(r),[['2019-05-10','2019-05-01'],['2022-05-10','2022-05-01'],
      ['2025-05-10','2025-05-01']]);
    assert.equal(r.valoreScatto,49.54);
    assert.equal(r.scattiMensili,148.62);
    assert.equal(r.ral,45376.76);
    assert.equal(r.quote.find(q=>q.id==='scatti').mensilita,13);
  });

  /* 3ª area 1° livello assunto il 20/10/2022: il primo scatto matura il
     20/10/2026 e decorre dal 1/10/2026, quindi al 16/10 è già dovuto.
     (2.742,34 + 49,54) × 13 = 2.791,88 × 13 = 36.294,44. Il 30/9 no:
     2.742,34 × 13 = 35.650,42. Con il mese successivo il 16/10 darebbe
     ancora 35.650,42. */
  test('scatti: dovuto dal primo del mese anche prima del giorno di maturazione',()=>{
    const oggi=R.componiRal({ccnl:ABI,sezione:AREE,livello:'3A1',dataAnzianita:'2022-10-20',alla:OGGI});
    assert.deepEqual(maturazioni(oggi),[['2026-10-20','2026-10-01']]);
    assert.equal(oggi.ral,36294.44);
    const prima=R.componiRal({ccnl:ABI,sezione:AREE,livello:'3A1',dataAnzianita:'2022-10-20',
      alla:'2026-09-30'});
    assert.equal(prima.numeroScatti,0);
    assert.equal(prima.ral,35650.42);
  });

  /* Art. 103 c. 3 (e art. 94 c. 5): dal 1/1/2013 al 31/7/2014, 19 mesi,
     l'anzianità non matura. 3ª area 2° livello assunto il 15/3/2010: il
     primo scatto cadrebbe il 15/3/2014, dentro il periodo, e slitta di
     19 mesi al 15/10/2015; poi 15/10/2018, 15/10/2021, 15/10/2024; il
     quinto nel 2027. (2.890,41 + 4 × 49,54) × 13 = 3.088,57 × 13
     = 40.151,41. Senza il periodo sarebbero 5 scatti, l'ultimo dal
     1/3/2026, e 40.795,43. */
  test('scatti: l’anzianità non matura dal 1° gennaio 2013 al 31 luglio 2014',()=>{
    const r=R.componiRal({ccnl:ABI,sezione:AREE,livello:'3A2',dataAnzianita:'2010-03-15',alla:OGGI});
    assert.deepEqual(maturazioni(r),[['2015-10-15','2015-10-01'],['2018-10-15','2018-10-01'],
      ['2021-10-15','2021-10-01'],['2024-10-15','2024-10-01']]);
    assert.equal(r.ral,40151.41);
    assert.deepEqual(R.regolaScatti(ABI,AREE).sospensioni.map(s=>[s.dal,s.al]),[['2013-01-01','2014-07-31']]);
    /* Assunto il 1/9/2014, dopo il periodo: nessuno slittamento. */
    assert.equal(R.scattiMaturati(ABI,'2014-09-01','2018-08-31',AREE),0);
    assert.equal(R.scattiMaturati(ABI,'2014-09-01','2018-09-01',AREE),1);
  });

  /* Area unificata dal 10/1/2000: l'ottavo scatto, a 4 + 7 × 3 = 25 anni,
     cadrebbe il 10/1/2025; slitta di 19 mesi al 10/8/2026 e decorre dal
     1/8/2026. Tetto: (2.479,45 + 8 × 34,66) × 13 = (2.479,45 + 277,28)
     × 13 = 2.756,73 × 13 = 35.837,49. Lo stesso con 8 scatti dichiarati. */
  test('scatti: tetto di 8 per aree e quadri di 1° e 2° livello, override fino a 8',()=>{
    assert.equal(R.scattiMaturati(ABI,'2000-01-10','2026-07-31',AREE),7);
    const r=R.componiRal({ccnl:ABI,sezione:AREE,livello:'AU',dataAnzianita:'2000-01-10',alla:OGGI});
    assert.equal(r.numeroScatti,8);
    assert.deepEqual(maturazioni(r)[7],['2026-08-10','2026-08-01']);
    assert.equal(r.scattiAlTetto,true);
    assert.equal(r.ral,35837.49);
    const dichiarati=R.componiRal({ccnl:ABI,sezione:AREE,livello:'AU',scatti:8,alla:OGGI});
    assert.equal(dichiarati.valoreScatto,34.66);
    assert.equal(dichiarati.ral,35837.49);
    assert.throws(()=>R.componiRal({ccnl:ABI,sezione:AREE,livello:'AU',scatti:9,alla:OGGI}),RangeError);
    assert.throws(()=>R.componiRal({ccnl:ABI,sezione:AREE,livello:'AU',scatti:-1,alla:OGGI}),RangeError);
  });

  /* Art. 103 c. 2 (aree) e art. 94 c. 2 (QD1–QD2): chi era in servizio
     al 19 dicembre 1994 conserva il numero di scatti dei contratti di
     allora, fino a 12 nelle aree, con regole che il dataset non porta.
     Dal 20/12/1994 si calcola: Area unificata, 4 + 7 × 3 = 25 anni, i
     primi cinque prima del 2013, il sesto (20/12/2013) e i successivi
     slittano di 19 mesi; l'ottavo matura il 20/7/2021: 8, al tetto.
     Il 19/12/1994 il calcolo si ferma, invece di dare 8 senza avviso.
     Il numero dichiarato resta, fino a 8: (2.479,45 + 8 × 34,66) × 13
     = 35.837,49. */
  test('scatti: un’anzianità anteriore al 20 dicembre 1994 ferma il calcolo dalla data',()=>{
    assert.equal(R.scattiMaturati(ABI,'1994-12-20',OGGI,AREE),8);
    const fermo=data=>errore=>errore instanceof RangeError&&[`anzianità dal ${data}`,'Credito — ABI',
      'in servizio al 19 dicembre 1994','fino a 12','dal 20/12/1994','al massimo 8']
      .every(t=>errore.message.includes(t));
    assert.throws(()=>R.scattiMaturati(ABI,'1994-12-19',OGGI,AREE),fermo('19/12/1994'));
    assert.throws(()=>R.scattiMaturati(ABI,'1980-01-01',OGGI,AREE),fermo('01/01/1980'));
    assert.throws(()=>R.componiRal({ccnl:ABI,sezione:AREE,livello:'QD1',dataAnzianita:'1990-06-01',
      alla:OGGI}),fermo('01/06/1990'));
    assert.equal(R.componiRal({ccnl:ABI,sezione:AREE,livello:'AU',dataAnzianita:'1980-01-01',scatti:8,
      alla:OGGI}).ral,35837.49);
    /* QD3–QD4: gli scatti contano dalla nomina «in luogo dei precedenti»
       e il dossier non documenta una soglia: nessuna. */
    assert.equal(R.regolaScatti(ABI,QD34).anzianitaDal,null);
  });

  /* Art. 94 c. 2: per i quadri di 3° e 4° livello fino a 7 scatti,
     «in luogo dei precedenti», dalla data di assunzione o nomina; c. 1:
     4 anni per il primo anche nel passaggio al 3° o 4° livello. Quadro
     di 3° livello nominato il 1/2/2019: 1/2/2023 e 1/2/2026.
     (4.396,88 + 2 × 109,61) × 13 = (4.396,88 + 219,22) × 13
     = 4.616,10 × 13 = 60.009,30. */
  test('scatti dei quadri di 3° e 4° livello: dalla nomina, fino a 7',()=>{
    const r=R.componiRal({ccnl:ABI,sezione:QD34,livello:'QD3',dataAnzianita:'2019-02-01',alla:OGGI});
    assert.deepEqual(maturazioni(r),[['2023-02-01','2023-02-01'],['2026-02-01','2026-02-01']]);
    assert.equal(r.valoreScatto,109.61);
    assert.equal(r.ral,60009.30);
    assert.match(R.regolaScatti(ABI,QD34).base,/nomina/);
    assert.equal(R.scattiMaturati(ABI,'1980-01-01',OGGI,QD34),7);
    /* QD4 con 7 scatti: (5.160,06 + 7 × 109,61) × 13 = (5.160,06 + 767,27)
       × 13 = 5.927,33 × 13 = 77.055,29. */
    const tetto=R.componiRal({ccnl:ABI,sezione:QD34,livello:'QD4',scatti:7,alla:OGGI});
    assert.equal(tetto.ral,77055.29);
    assert.equal(tetto.scattiAlTetto,true);
    assert.throws(()=>R.componiRal({ccnl:ABI,sezione:QD34,livello:'QD4',scatti:8,alla:OGGI}),RangeError);
  });

  test('scatti: anzianità assente vale zero, anzianità non valida si ferma',()=>{
    const senza=R.componiRal({ccnl:ABI,sezione:AREE,livello:'QD2',alla:OGGI});
    assert.equal(senza.numeroScatti,0);
    assert.equal(senza.anzianitaDichiarata,false);
    assert.throws(()=>R.componiRal({ccnl:ABI,sezione:AREE,livello:'QD2',dataAnzianita:'2026-02-30',
      alla:OGGI}),RangeError);
    assert.throws(()=>R.componiRal({ccnl:ABI,sezione:QD34,livello:'QD3',dataAnzianita:'2026-10-17',
      alla:OGGI}),RangeError);
  });

  /* Tredici mensilità per ogni voce (art. 50 c. 5, art. 51; Allegato 2
     «Importi mensili per 13 mensilità»).
     3ª area 4°: 3.341,90 × 13 = 43.444,70; con 100,00 di superminimo
     (3.341,90 + 100,00) × 13 = 3.441,90 × 13 = 44.744,70.
     Area unificata 2.479,45 × 13 = 32.232,85; quadro di 1° livello
     3.743,21 × 13 = 48.661,73; quadro di 4° livello 5.160,06 × 13
     = 67.080,78. */
  test('tempo pieno, senza e con superminimo, dagli estremi della tabella',()=>{
    const zero=R.componiRal({ccnl:ABI,sezione:AREE,livello:'3A4',alla:OGGI});
    assert.equal(zero.ral,43444.70);
    assert.equal(zero.mensilita,13);
    assert.equal(zero.identitaSemplice,true);
    const con=R.componiRal({ccnl:ABI,sezione:AREE,livello:'3A4',superminimoMensile:100,alla:OGGI});
    assert.equal(con.ral,44744.70);
    assert.equal(R.componiRal({ccnl:ABI,sezione:AREE,livello:'AU',alla:OGGI}).ral,32232.85);
    assert.equal(R.componiRal({ccnl:ABI,sezione:AREE,livello:'QD1',alla:OGGI}).ral,48661.73);
    const qd4=R.componiRal({ccnl:ABI,sezione:QD34,livello:'QD4',alla:OGGI});
    assert.equal(qd4.ral,67080.78);
    nettoRiconcilia(zero);
    nettoRiconcilia(con);
    nettoRiconcilia(qd4);
  });

  /* Art. 38 c. 12: retribuzione proporzionata alla minore durata; dal
     1° gennaio 2026 sulle 37 ore (FABI, Fisac CGIL, Edotto). Superminimo
     non riproporzionato.
     3ª area 4°, 22 ore e 30: 3.341,90 × 22,5 / 37 = 2.032,2365 → 2.032,24;
     × 13 = 26.419,12 (Fisac: 60,81% per 22h30, 3.341,90 × 0,6081 = 2.032,21,
     con la percentuale arrotondata). Con 100,00 di superminimo
     (2.032,24 + 100,00) × 13 = 2.132,24 × 13 = 27.719,12.
     3ª area 4°, 30 ore, assunto il 10/5/2015 (3 scatti, che a part-time
     maturano per intero, art. 38 c. 2 lett. c): 3.341,90 × 30/37
     = 2.709,649 → 2.709,65; 148,62 × 30/37 = 120,503 → 120,50;
     2.830,15 × 13 = 36.791,95.
     Quadro di 1° livello, 30 ore: 3.743,21 × 30/37 = 3.035,035 → 3.035,04;
     × 13 = 39.455,52. */
  test('part-time delle aree: riproporzione sulle 37 ore, superminimo intero',()=>{
    const pt=R.componiRal({ccnl:ABI,sezione:AREE,livello:'3A4',oreSettimanali:22.5,alla:OGGI});
    assert.equal(pt.baseMensile,2032.24);
    assert.equal(pt.ral,26419.12);
    assert.equal(pt.partTime,true);
    assert.equal(R.componiRal({ccnl:ABI,sezione:AREE,livello:'3A4',oreSettimanali:22.5,
      superminimoMensile:100,alla:OGGI}).ral,27719.12);
    const scatti=R.componiRal({ccnl:ABI,sezione:AREE,livello:'3A4',dataAnzianita:'2015-05-10',
      oreSettimanali:30,alla:OGGI});
    assert.equal(scatti.numeroScatti,3);
    assert.equal(scatti.scattiMensili,120.50);
    assert.equal(scatti.ral,36791.95);
    assert.equal(R.componiRal({ccnl:ABI,sezione:AREE,livello:'QD1',oreSettimanali:30,alla:OGGI}).ral,39455.52);
    nettoRiconcilia(pt);
    nettoRiconcilia(scatti);
    assert.throws(()=>R.componiRal({ccnl:ABI,sezione:AREE,livello:'3A4',oreSettimanali:37.5,alla:OGGI}),
      RangeError);
  });

  /* Quadro di 3° livello nominato il 1/2/2019 (2 scatti), 30 ore:
     4.396,88 × 30/37 = 3.565,038 → 3.565,04; 219,22 × 30/37 = 177,746
     → 177,75; 3.742,79 × 13 = 48.656,27. */
  test('part-time dei quadri di 3° e 4° livello sulle stesse 37 ore',()=>{
    const r=R.componiRal({ccnl:ABI,sezione:QD34,livello:'QD3',dataAnzianita:'2019-02-01',
      oreSettimanali:30,alla:OGGI});
    assert.equal(r.baseMensile,3565.04);
    assert.equal(r.scattiMensili,177.75);
    assert.equal(r.ral,48656.27);
    nettoRiconcilia(r);
  });

  test('le mensilità proposte sono tredici, come nel dataset',()=>{
    assert.equal(R.trovaContratto(ABI).mensilita,13);
    assert.equal(R.mensilitaAlla(ABI,OGGI,QD34),13);
    assert.equal(suggerisciMensilita(ABI,14),13);
    const c=trovaCcnl(ABI);
    assert.equal(c.codiceCnel,'J241');
    assert.equal(c.nome,R.trovaContratto(ABI).nome);
    assert.equal(c.mensilita,13);
    assert.equal(c.dataRiferimento,'2023-11-23');
    assert.equal(CCNL.filter(x=>x.codiceCnel==='J241').length,1);
  });

  test('esclusioni: stato del rinnovo, voci aziendali e individuali, limiti degli scatti e dell’orario',()=>{
    const testo=R.ESCLUSIONI[ABI].join('\n');
    /* Stato: scaduto, termini sospesi, rinnovo dal 1° aprile 2026. */
    assert.match(testo,/scaduto il 31 marzo 2026/);
    assert.match(testo,/31 dicembre 2026/);
    assert.match(testo,/1° aprile 2026[^.]*arretrati/);
    /* Voci escluse con l'articolo che le prevede. */
    assert.match(testo,/VAP[^.]*artt\. 52, 55 e 56/);
    assert.match(testo,/Buono pasto[^.]*4,00 €[^.]*art\. 54/);
    assert.match(testo,/art\. 53 e Allegati 3 e 5/);
    assert.match(testo,/tranviarie[^.]*art\. 53 c\. 5 e Allegato 4/);
    assert.match(testo,/ex intesa 8 dicembre 2007/);
    assert.match(testo,/Assegni mensili di anzianità/);
    assert.match(testo,/Una tantum/);
    assert.match(testo,/Apposito elemento della retribuzione[^.]*art\. 8/);
    assert.match(testo,/Prosolidar/);
    /* Limiti: 12 scatti non esprimibili, orari non modellati, quadri. */
    assert.match(testo,/fino a 12 scatti[^.]*al massimo 8/);
    assert.match(testo,/40 ore[^.]*36 ore[^.]*art\. 108/);
    assert.match(testo,/quadri direttivi[^.]*37 ore[^.]*art\. 96/);
    assert.match(testo,/37 ore dal 1° gennaio 2026/);
    /* La ripartenza nel passaggio da 3° a 4° livello vale solo per quella sezione. */
    const qd=R.componiRal({ccnl:ABI,sezione:QD34,livello:'QD4',alla:OGGI}).esclusioni.join('\n');
    assert.match(qd,/dal 3° al 4° livello/);
    assert.doesNotMatch(R.componiRal({ccnl:ABI,sezione:AREE,livello:'QD2',alla:OGGI}).esclusioni.join('\n'),
      /dal 3° al 4° livello/);
    assert.match(R.trovaContratto(ABI).notaFonte,/1° aprile 2026/);
    assert.equal(R.trovaContratto(ABI).quoteAnnueMancanti.length,0);
    assert.equal(R.etichettaAnnua(ABI),'RAL');
    assert.equal(R.avvisoRalParziale(ABI),null);
  });
});
