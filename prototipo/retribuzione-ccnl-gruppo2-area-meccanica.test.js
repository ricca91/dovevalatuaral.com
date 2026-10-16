const test=require('node:test');
const assert=require('node:assert/strict');

const R=require('./retribuzione-ccnl.js');
const C=require('./ccnl.js');
const P=require('./prove-ccnl.js');
const {provaDecorrenze,nettoRiconcilia,voci}=P;

/* Area meccanica — artigianato, CNEL C030 (RIC-61, gruppo 2). Ogni atteso
   è preso dal testo definitivo del CCNL 19 novembre 2024 (CNEL idAccordo
   221687, art. 29 pp. 89–94) e dal verbale integrativo 25 novembre 2024
   (idAccordo 198588), archiviati in processo/dati/fonti, e scritto qui a
   mano con il conto per esteso nel commento: nessun atteso è calcolato
   dalla funzione sotto prova. Data fissa, perché il dataset porta una
   tranche futura già firmata (1° novembre 2026). */
const OGGI='2026-10-16';
const AM='area-meccanica-artigianato-c030';
const MECC='metalmeccanica-impianti';
const ORAFI='orafi';
const ODONTO='odontotecnica';
const RESTAURO='restauro';

const DATE=['2024-12-01','2025-07-01','2026-03-01','2026-11-01'];

const minimo=(sezione,codice,alla=OGGI)=>
  R.trovaLivello(AM,codice,alla,sezione).voci.find(v=>v.id==='tabellare').importo;

test.describe('Area meccanica — artigianato — C030',()=>{

  test('quattro sezioni, ognuna con i livelli del proprio contratto',()=>{
    assert.deepEqual(R.sezioni(AM).map(s=>s.id),[MECC,ORAFI,ODONTO,RESTAURO]);
    /* Art. 29 p. 90: 1Q, 1, 2, 2 bis, 3–6. Autoriparazione confluita (art. 1 p. 4). */
    assert.deepEqual(R.livelli(AM,OGGI,MECC).map(l=>l.codice),['1Q','1','2','2bis','3','4','5','6']);
    /* p. 91: 1Q, 1–6. */
    assert.deepEqual(R.livelli(AM,OGGI,ORAFI).map(l=>l.codice),['1Q','1','2','3','4','5','6']);
    /* p. 92: 1S, 1–6. */
    assert.deepEqual(R.livelli(AM,OGGI,ODONTO).map(l=>l.codice),['1S','1','2','3','4','5','6']);
    /* p. 94: QS, Q, 1–6. */
    assert.deepEqual(R.livelli(AM,OGGI,RESTAURO).map(l=>l.codice),['QS','Q','1','2','3','4','5','6']);
  });

  test('una tabella a quattro tranche per sezione',()=>{
    for(const sezione of [MECC,ORAFI,ODONTO,RESTAURO])provaDecorrenze(AM,sezione,DATE);
    /* Art. 29 p. 89: la prima tranche decorre dal 1° dicembre 2024; prima non c’è
       tabella dentro il dataset (la colonna precedente comprende l’AFAC, non letto). */
    assert.throws(()=>R.componiRal({ccnl:AM,sezione:MECC,livello:'4',alla:'2024-11-30'}),RangeError);
  });

  test('metalmeccanica, tabella 1° marzo 2026: righe, estremi e totale pubblicato',()=>{
    /* Art. 29 p. 90: livello 4 = 1.656,98; il totale stampato è la sola retribuzione
       tabellare (voce unica, conglobata dal 2011). */
    const quarto=R.trovaLivello(AM,'4',OGGI,MECC);
    assert.deepEqual(voci(quarto),[['tabellare',1656.98]]);
    assert.equal(quarto.totalePubblicato,1656.98);
    assert.equal(quarto.totale,1656.98);
    assert.equal(quarto.scatto,21.72);
    /* Estremi: 1Q e 1 = 2.080,91; 6 = 1.521,84; 2 bis = 1.828,24. */
    assert.equal(minimo(MECC,'1'),2080.91);
    assert.equal(minimo(MECC,'6'),1521.84);
    assert.equal(minimo(MECC,'2bis'),1828.24);
    assert.equal(R.trovaLivello(AM,'2bis',OGGI,MECC).nome,'2 bis');
  });

  test('metalmeccanica: le quattro tranche del livello 4 (50 + 25 + 25 e poi 20 €)',()=>{
    /* 1.606,98 (1/12/2024) + 25 = 1.631,98 (1/7/2025) + 25 = 1.656,98 (1/3/2026)
       + 20 = 1.676,98 (1/11/2026). FIM 21/11/2024: 50/25/25/20 al 4° livello. */
    for(const [alla,importo] of [['2024-12-01',1606.98],['2025-07-01',1631.98],['2026-03-01',1656.98],
      ['2026-11-01',1676.98]])
      assert.equal(minimo(MECC,'4',alla),importo,alla);
    assert.equal(minimo(MECC,'4','2026-10-31'),1656.98);
  });

  test('orafi, odontotecnica e restauro: righe, estremi e aumento al 4° livello',()=>{
    /* Orafi p. 91: 4 = 1.660,64 → 1.680,64 (+20). */
    assert.equal(minimo(ORAFI,'4'),1660.64);
    assert.equal(minimo(ORAFI,'4','2026-11-01'),1680.64);
    assert.equal(minimo(ORAFI,'1Q'),2081.99);
    assert.equal(minimo(ORAFI,'6'),1514.02);
    /* Odontotecnica p. 92: 4 = 1.584,00 → 1.593,00 (+9). */
    assert.equal(minimo(ODONTO,'4'),1584);
    assert.equal(minimo(ODONTO,'4','2026-11-01'),1593);
    assert.equal(minimo(ODONTO,'1S'),2172.4);
    assert.equal(minimo(ODONTO,'6'),1459.6);
    /* Restauro p. 94: 4 = 1.823,55 → 1.867,55 (+44). */
    assert.equal(minimo(RESTAURO,'4'),1823.55);
    assert.equal(minimo(RESTAURO,'4','2026-11-01'),1867.55);
    assert.equal(minimo(RESTAURO,'QS'),2754.48);
    assert.equal(minimo(RESTAURO,'6'),1632.04);
  });

  test('riscontri indipendenti sulle tabelle (UILM 28/1/2025, lavoro-economia.it)',()=>{
    /* UILM, tutte le sezioni: tabella 1/11/2026, metalmeccanica 4 = 1.676,98,
       restauro 4 = 1.867,55. lavoro-economia.it (non firmataria), tabella 1/3/2026:
       metalmeccanica 4 = 1.656,98, orafi 4 = 1.660,64, odontotecnica 4 = 1.584,00,
       restauro 4 = 1.823,55. */
    assert.equal(minimo(MECC,'4','2026-11-01'),1676.98);
    assert.equal(minimo(RESTAURO,'4','2026-11-01'),1867.55);
    assert.equal(minimo(MECC,'4'),1656.98);
    assert.equal(minimo(ORAFI,'4'),1660.64);
    assert.equal(minimo(ODONTO,'4'),1584);
    assert.equal(minimo(RESTAURO,'4'),1823.55);
  });

  test('indennità fisse dove il livello coincide con la qualifica: 70 € al 1Q, 50 € al QS',()=>{
    /* Art. 22 p. 71 e nota p. 91: indennità quadri 70 € al 1Q (metalmeccanica e orafi);
       nota * p. 93: 50 € a ogni Quadro Super del restauro. Il totale pubblicato è la
       sola tabellare: l’indennità è una voce in più, il totale derivato la somma. */
    for(const sezione of [MECC,ORAFI]){
      const quadro=R.trovaLivello(AM,'1Q',OGGI,sezione);
      assert.deepEqual(voci(quadro).map(v=>v[0]),['tabellare','indennitaQuadri']);
      assert.equal(quadro.voci[1].importo,70);
      assert.equal(quadro.totale,quadro.totalePubblicato+70);
      assert.equal(R.riconciliaLivello(quadro).verificata,true);
    }
    /* 2.080,91 + 70 = 2.150,91 */
    assert.equal(R.trovaLivello(AM,'1Q',OGGI,MECC).totale,2150.91);
    const qs=R.trovaLivello(AM,'QS',OGGI,RESTAURO);
    assert.equal(qs.voci[1].importo,50);
    /* 2.754,48 + 50 = 2.804,48 */
    assert.equal(qs.totale,2804.48);
    /* Il livello 1 e il Q non hanno la voce fissa, solo il profilo (il 1) o niente. */
    assert.deepEqual(voci(R.trovaLivello(AM,'1',OGGI,MECC)),[['tabellare',2080.91]]);
    assert.deepEqual(voci(R.trovaLivello(AM,'Q',OGGI,RESTAURO)),[['tabellare',2754.48]]);
  });

  test('profili: 50 € funzioni direttive al livello 1 (metalmeccanica, orafi), I.R.S. 100 € al livello 4 del restauro',()=>{
    for(const sezione of [MECC,ORAFI]){
      assert.deepEqual(R.trovaLivello(AM,'1',OGGI,sezione).profili.map(p=>[p.id,p.voce.importo]),
        [['funzioniDirettive',50]],sezione);
      assert.ok(R.livelli(AM,OGGI,sezione).filter(l=>l.codice!=='1').every(l=>l.profili.length===0));
    }
    assert.deepEqual(R.trovaLivello(AM,'4',OGGI,RESTAURO).profili.map(p=>[p.id,p.voce.importo]),
      [['tecnicoRestauroSenior',100]]);
    /* Odontotecnica: i 50 € di funzioni direttive non sono attribuiti a un livello,
       non sono modellati (dichiarato nelle esclusioni). */
    assert.ok(R.livelli(AM,OGGI,ODONTO).every(l=>l.profili.length===0&&l.voci.length===1));
    assert.ok(R.livelli(AM,OGGI,RESTAURO).filter(l=>l.codice!=='4').every(l=>l.profili.length===0));
  });

  test('scatti: cifra fissa biennale, massimo 5, importo per livello e per sezione, uguale in ogni tranche',()=>{
    /* Art. 57 e 64 (metalmeccanica), 70 e 77 (orafi), 70 ultimo comma (restauro),
       85 e 94 (odontotecnica): un aumento ogni biennio, massimo 5, dal primo giorno
       del mese successivo. 13 mensilità (art. 28: gli scatti sono nella retribuzione
       globale di fatto). */
    P.provaScattiFissi({ccnl:AM,sezione:MECC,livello:'4',cadenza:2,massimo:5,importo:21.72,mensilita:13,alla:OGGI});
    P.provaScattiFissi({ccnl:AM,sezione:ORAFI,livello:'6',cadenza:2,massimo:5,importo:18.51,mensilita:13,alla:OGGI});
    P.provaScattiFissi({ccnl:AM,sezione:ODONTO,livello:'1S',cadenza:2,massimo:5,importo:35.43,mensilita:13,alla:OGGI});
    P.provaScattiFissi({ccnl:AM,sezione:RESTAURO,livello:'QS',cadenza:2,massimo:5,importo:32.94,mensilita:13,alla:OGGI});
    const attesi={
      [MECC]:{'1Q':32.94,'1':32.94,'2':29.08,'2bis':26.13,'3':24.29,'4':21.72,'5':20.24,'6':18.4},
      [ORAFI]:{'1Q':33.57,'1':33.57,'2':29.79,'3':24.95,'4':22.31,'5':20.68,'6':18.51},
      [ODONTO]:{'1S':35.43,'1':29.95,'2':27.04,'3':22.27,'4':19.84,'5':18.14,'6':16.7},
      [RESTAURO]:{QS:32.94,Q:32.94,'1':29.08,'2':26.13,'3':24.29,'4':21.72,'5':20.24,'6':18.4},
    };
    for(const [sezione,livelli] of Object.entries(attesi))
      for(const data of DATE)
        for(const [codice,scatto] of Object.entries(livelli))
          assert.equal(R.trovaLivello(AM,codice,data,sezione).scatto,scatto,`${sezione} ${codice} ${data}`);
  });

  test('scatti: il testo depositato prevale sulla fonte secondaria',()=>{
    /* lavoro-economia.it stampa 20,25 (metalmeccanica 5) e 16,69 (odontotecnica 6)
       e scambia 2 e 2 bis; il testo (artt. 57, 64, 85, 94) dà 20,24, 16,70, 2 = 29,08
       e 2 bis = 26,13. */
    assert.equal(R.trovaLivello(AM,'5',OGGI,MECC).scatto,20.24);
    assert.equal(R.trovaLivello(AM,'6',OGGI,ODONTO).scatto,16.7);
    assert.equal(R.trovaLivello(AM,'2',OGGI,MECC).scatto,29.08);
    assert.equal(R.trovaLivello(AM,'2bis',OGGI,MECC).scatto,26.13);
  });

  test('il 1Q prende lo scatto del livello 1 (art. 22)',()=>{
    /* «Al quadro trovano applicazione quelli previsti per gli impiegati di 1 livello». */
    for(const sezione of [MECC,ORAFI])
      for(const data of DATE)
        assert.equal(R.trovaLivello(AM,'1Q',data,sezione).scatto,R.trovaLivello(AM,'1',data,sezione).scatto);
  });

  test('metalmeccanica, livello 4, tempo pieno, nessuno scatto',()=>{
    /* 1.656,98 × 13 = 21.540,74 */
    const r=R.componiRal({ccnl:AM,sezione:MECC,livello:'4',scatti:0,alla:OGGI});
    assert.equal(r.decorrenza,'2026-03-01');
    assert.equal(r.mensilita,13);
    assert.equal(r.oreContrattuali,40);
    assert.equal(r.ral,21540.74);
    assert.equal(r.identitaSemplice,true);
    assert.equal(r.ralCompleta,true);
    assert.equal(r.anzianitaDichiarata,false);
    nettoRiconcilia(r);
  });

  test('metalmeccanica, livello 4, tre scatti, tranche futura del 1° novembre 2026',()=>{
    /* (1.676,98 + 3 × 21,72 = 65,16) × 13 = 1.742,14 × 13 = 22.647,82 */
    const r=R.componiRal({ccnl:AM,sezione:MECC,livello:'4',scatti:3,alla:'2026-11-01'});
    assert.equal(r.decorrenza,'2026-11-01');
    assert.equal(r.ral,22647.82);
    nettoRiconcilia(r);
  });

  test('metalmeccanica, livello 6, il giorno prima e il giorno della tranche di novembre',()=>{
    /* 1.521,84 × 13 = 19.783,92 */
    assert.equal(R.componiRal({ccnl:AM,sezione:MECC,livello:'6',alla:'2026-10-31'}).ral,19783.92);
    /* 1.540,21 × 13 = 20.022,73 */
    assert.equal(R.componiRal({ccnl:AM,sezione:MECC,livello:'6',alla:'2026-11-01'}).ral,20022.73);
  });

  test('metalmeccanica, 1Q: indennità quadri 70 € e cinque scatti del livello 1',()=>{
    /* (2.080,91 + 70,00 + 5 × 32,94 = 164,70) × 13 = 2.315,61 × 13 = 30.102,93 */
    const r=R.componiRal({ccnl:AM,sezione:MECC,livello:'1Q',scatti:5,alla:OGGI});
    assert.equal(r.baseMensile,2150.91);
    assert.equal(r.scattiMensili,164.7);
    assert.equal(r.scattiAlTetto,true);
    assert.equal(r.ral,30102.93);
    nettoRiconcilia(r);
  });

  test('metalmeccanica, livello 1 con funzioni direttive: profilo di 50 €',()=>{
    /* (2.080,91 + 50,00) × 13 = 2.130,91 × 13 = 27.701,83 */
    const r=R.componiRal({ccnl:AM,sezione:MECC,livello:'1',profilo:'funzioniDirettive',alla:OGGI});
    assert.equal(r.profilo,'funzioniDirettive');
    assert.equal(r.ral,27701.83);
    nettoRiconcilia(r);
    /* Senza profilo il livello 1 è l’impiegato senza funzioni: 2.080,91 × 13 = 27.051,83. */
    assert.equal(R.componiRal({ccnl:AM,sezione:MECC,livello:'1',alla:OGGI}).ral,27051.83);
    /* Dove il livello non ha il profilo, il calcolo si ferma. */
    assert.throws(()=>R.componiRal({ccnl:AM,sezione:MECC,livello:'2',profilo:'funzioniDirettive',alla:OGGI}),RangeError);
    assert.throws(()=>R.componiRal({ccnl:AM,sezione:ODONTO,livello:'1',profilo:'funzioniDirettive',alla:OGGI}),RangeError);
  });

  test('metalmeccanica, livello 2 bis, un scatto, tranche 1° luglio 2025',()=>{
    /* (1.800,66 + 26,13) × 13 = 1.826,79 × 13 = 23.748,27 */
    const r=R.componiRal({ccnl:AM,sezione:MECC,livello:'2bis',scatti:1,alla:'2025-12-31'});
    assert.equal(r.decorrenza,'2025-07-01');
    assert.equal(r.ral,23748.27);
  });

  test('metalmeccanica, livello 3, part-time 24 ore su 40, due scatti',()=>{
    /* Art. 24: trattamento riproporzionato sul rapporto fra orario ridotto e pieno
       (24/40 = 3/5). Base 1.758,00 × 3/5 = 1.054,80. Scatti 2 × 24,29 = 48,58;
       × 3/5 = 29,148 → 29,15. (1.054,80 + 29,15) × 13 = 1.083,95 × 13 = 14.091,35 */
    const r=R.componiRal({ccnl:AM,sezione:MECC,livello:'3',scatti:2,oreSettimanali:24,alla:OGGI});
    assert.equal(r.partTime,true);
    assert.equal(r.oreContrattuali,40);
    assert.equal(r.ral,14091.35);
    nettoRiconcilia(r);
  });

  test('orafi, 1Q con indennità quadri, nessuno scatto',()=>{
    /* (2.081,99 + 70,00) × 13 = 2.151,99 × 13 = 27.975,87 */
    const r=R.componiRal({ccnl:AM,sezione:ORAFI,livello:'1Q',alla:OGGI});
    assert.equal(r.ral,27975.87);
    nettoRiconcilia(r);
  });

  test('orafi, livello 6, cinque scatti, il giorno prima della tranche di marzo 2026',()=>{
    /* Tranche 1/7/2025: 1.491,23. (1.491,23 + 5 × 18,51 = 92,55) × 13 = 1.583,78 × 13 = 20.589,14 */
    const r=R.componiRal({ccnl:AM,sezione:ORAFI,livello:'6',scatti:5,alla:'2026-02-28'});
    assert.equal(r.decorrenza,'2025-07-01');
    assert.equal(r.ral,20589.14);
  });

  test('orafi, livello 4, part-time 30 ore su 40',()=>{
    /* 1.660,64 × 30/40 = 1.245,48; × 13 = 16.191,24 */
    const r=R.componiRal({ccnl:AM,sezione:ORAFI,livello:'4',oreSettimanali:30,alla:OGGI});
    assert.equal(r.ral,16191.24);
    nettoRiconcilia(r);
  });

  test('restauro, Quadro Super con l’indennità di 50 €',()=>{
    /* (2.754,48 + 50,00) × 13 = 2.804,48 × 13 = 36.458,24 */
    const r=R.componiRal({ccnl:AM,sezione:RESTAURO,livello:'QS',alla:OGGI});
    assert.equal(r.ral,36458.24);
    nettoRiconcilia(r);
  });

  test('restauro, livello 4: con e senza I.R.S., tempo pieno e part-time',()=>{
    /* Tecnico del restauro senior: (1.823,55 + 100,00) × 13 = 1.923,55 × 13 = 25.006,15 */
    assert.equal(R.componiRal({ccnl:AM,sezione:RESTAURO,livello:'4',profilo:'tecnicoRestauroSenior',alla:OGGI}).ral,
      25006.15);
    /* Addetto all’amministrazione dello stesso livello, senza I.R.S.: 1.823,55 × 13 = 23.706,15 */
    assert.equal(R.componiRal({ccnl:AM,sezione:RESTAURO,livello:'4',alla:OGGI}).ral,23706.15);
    /* Part-time 20/40: base 1.823,55 × 1/2 = 911,775 → 911,78; I.R.S. 100 × 1/2 = 50,00.
       (911,78 + 50,00) × 13 = 961,78 × 13 = 12.503,14 */
    const r=R.componiRal({ccnl:AM,sezione:RESTAURO,livello:'4',profilo:'tecnicoRestauroSenior',
      oreSettimanali:20,alla:OGGI});
    assert.equal(r.ral,12503.14);
    nettoRiconcilia(r);
  });

  test('restauro, livello 6, due scatti, tranche 1° novembre 2026',()=>{
    /* (1.671,42 + 2 × 18,40 = 36,80) × 13 = 1.708,22 × 13 = 22.206,86 */
    assert.equal(R.componiRal({ccnl:AM,sezione:RESTAURO,livello:'6',scatti:2,alla:'2026-11-01'}).ral,22206.86);
  });

  test('odontotecnica, 1S con cinque scatti',()=>{
    /* (2.172,40 + 5 × 35,43 = 177,15) × 13 = 2.349,55 × 13 = 30.544,15 */
    const r=R.componiRal({ccnl:AM,sezione:ODONTO,livello:'1S',scatti:5,alla:OGGI});
    assert.equal(r.ral,30544.15);
    nettoRiconcilia(r);
  });

  test('odontotecnica, livello 6, prima tranche',()=>{
    /* 1.413,52 × 13 = 18.375,76 */
    const r=R.componiRal({ccnl:AM,sezione:ODONTO,livello:'6',alla:'2024-12-01'});
    assert.equal(r.decorrenza,'2024-12-01');
    assert.equal(r.ral,18375.76);
  });

  test('odontotecnica, livello 4, part-time 20 ore, un scatto, tranche 1° novembre 2026',()=>{
    /* Base 1.593,00 × 20/40 = 796,50; scatto 19,84 × 1/2 = 9,92.
       (796,50 + 9,92) × 13 = 806,42 × 13 = 10.483,46 */
    const r=R.componiRal({ccnl:AM,sezione:ODONTO,livello:'4',scatti:1,oreSettimanali:20,alla:'2026-11-01'});
    assert.equal(r.ral,10483.46);
    nettoRiconcilia(r);
  });

  test('superminimo: dichiarato su 13, non riproporzionato nel part-time',()=>{
    /* Metalmeccanica 4: (1.656,98 + 100) × 13 = 1.756,98 × 13 = 22.840,74 */
    assert.equal(R.componiRal({ccnl:AM,sezione:MECC,livello:'4',superminimoMensile:100,alla:OGGI}).ral,22840.74);
    /* Orafi 4 part-time 30/40: 1.245,48 + 100 = 1.345,48; × 13 = 17.491,24 */
    const r=R.componiRal({ccnl:AM,sezione:ORAFI,livello:'4',oreSettimanali:30,superminimoMensile:100,alla:OGGI});
    assert.equal(r.superminimoMensile,100);
    assert.equal(r.ral,17491.24);
    nettoRiconcilia(r);
  });

  test('le indennità fisse entrano in tutte le 13 mensilità (art. 28, 29 bis, 29 ter)',()=>{
    /* Retribuzione globale di fatto: nessuna voce ha incidenza ridotta. */
    for(const sezione of R.sezioni(AM))
      for(const l of R.livelli(AM,OGGI,sezione.id)){
        assert.ok(l.voci.every(v=>(v.mensilita??13)===13),`${sezione.id} ${l.codice}`);
        assert.ok(l.profili.every(p=>(p.voce.mensilita??13)===13));
      }
    assert.equal(R.componiRal({ccnl:AM,sezione:MECC,livello:'1Q',alla:OGGI}).identitaSemplice,true);
  });

  test('livelli e sezioni inesistenti fanno fermare il calcolo',()=>{
    assert.throws(()=>R.componiRal({ccnl:AM,sezione:MECC,livello:'1S',alla:OGGI}),RangeError);
    assert.throws(()=>R.componiRal({ccnl:AM,sezione:ORAFI,livello:'2bis',alla:OGGI}),RangeError);
    assert.throws(()=>R.componiRal({ccnl:AM,sezione:ODONTO,livello:'1Q',alla:OGGI}),RangeError);
    assert.throws(()=>R.componiRal({ccnl:AM,livello:'4',alla:OGGI}),RangeError);
  });

  test('il catalogo propone 13 mensilità e il contratto è identificato come C030',()=>{
    assert.equal(C.suggerisciMensilita(AM,12),13);
    assert.equal(C.trovaCcnl(AM).codiceCnel,'C030');
    assert.equal(C.trovaCcnl(AM).mensilita,R.mensilitaAlla(AM,OGGI,MECC));
    assert.equal(C.trovaCcnl(AM).dataRiferimento,'2024-11-19');
    assert.equal(R.trovaContratto(AM).codiceCnel,'C030');
    assert.equal(R.ralCompleta(AM),true);
    assert.equal(R.etichettaAnnua(AM),'RAL');
    assert.equal(R.trovaContratto(AM).oreSettimanali,40);
  });

  test('esclusioni: i CCRL obbligatori per primi, poi le voci lasciate fuori',()=>{
    const esclusioni=R.ESCLUSIONI[AM];
    /* Art. 7: il contratto regionale è obbligatorio e la cifra nazionale può essere
       più bassa della retribuzione dovuta. */
    assert.match(esclusioni[0],/art\. 7/);
    assert.match(esclusioni[0],/regional/i);
    assert.match(esclusioni[0],/obbligator|obbligo/i);
    assert.match(esclusioni[0],/più bassa|inferiore|sottostim/i);
    const testo=esclusioni.join('\n');
    for(const attesa of [/E\.A\.R\./,/25 €/,/EBNA/,/San\.Arti\./,/Fon\.Te\./,/quota contratto/i,
      /apprendisti/i,/27\/11\/1997/,/7\/10\/1998/,/4\/12\/1998/,/1° dicembre 2024/,/straordinari/i,
      /art\. 22/,/odontotecnic/i,/2 bis/])
      assert.match(testo,attesa);
  });

  test('ogni riga riconcilia: il totale stampato è la sola retribuzione tabellare',()=>{
    for(const s of R.sezioni(AM))
      for(const t of s.tabelle)
        for(const l of t.livelli){
          const r=R.riconciliaLivello(l);
          assert.equal(r.verificata,true,`${s.id} ${t.decorrenza} ${l.codice}`);
          assert.equal(l.totalePubblicato,l.voci[0].importo);
        }
  });
});
