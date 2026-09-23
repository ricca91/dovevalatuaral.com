const test=require('node:test');
const assert=require('node:assert/strict');

const R=require('./retribuzione-ccnl.js');
const {calcola,applicaMensilita}=require('./motore.js');

/* Gli undici contratti del gruppo 1 (RIC-60), uno per blocco. Ogni
   importo atteso è preso dalla fonte archiviata e scritto qui a mano,
   con il conto per esteso nel commento: nessun atteso è calcolato
   dalla funzione sotto prova. Le date sono fisse, perché il dataset
   porta tranche future che altrimenti cambierebbero i risultati. */
const OGGI='2026-09-22';

const FIPE='pubblici-esercizi-fipe-h05y';
const TURISMO='turismo-federalberghi-h052';
const AGENZIE='agenzie-viaggi-fiavet-h04z';
const STUDI='studi-professionali-confprofessioni-h442';
const MULTI='multiservizi-pulizia-k511';
const DMO='distribuzione-moderna-federdistribuzione-h008';
const LOGISTICA='logistica-trasporto-merci-i100';
const COOP='cooperative-sociali-t151';
const CONFAPI='metalmeccanica-pmi-confapi-c018';
const GRAFICI='grafici-editori-g011';
const POLIGRAFICI='poligrafici-quotidiani-g041';
const VETRO='vetro-lampade-display-b132';

const giornoPrima=iso=>new Date(Date.parse(iso+'T00:00:00Z')-86400000).toISOString().slice(0,10);

/* Il giorno prima e il giorno esatto di ogni tranche, prima della
   prima nessuna tabella, e il passaggio alla tranche già firmata. */
function provaDecorrenze(ccnl,sezione,attese){
  assert.deepEqual((sezione?R.sezioni(ccnl).find(s=>s.id===sezione):R.trovaContratto(ccnl))
    .tabelle.map(t=>t.decorrenza),attese,`${ccnl} ${sezione||''}`);
  assert.throws(()=>R.tabellaVigente(ccnl,giornoPrima(attese[0]),sezione),RangeError);
  attese.forEach((decorrenza,i)=>{
    assert.equal(R.tabellaVigente(ccnl,decorrenza,sezione).decorrenza,decorrenza);
    if(i>0){
      assert.equal(R.tabellaVigente(ccnl,giornoPrima(decorrenza),sezione).decorrenza,attese[i-1]);
      assert.equal(R.prossimaTabella(ccnl,giornoPrima(decorrenza),sezione).decorrenza,decorrenza);
    }
  });
  assert.equal(R.prossimaTabella(ccnl,attese[attese.length-1],sezione),null);
}

/* Scatti in cifra fissa: prima e alla decorrenza del primo, il
   secondo, il tetto, l'override, l'anzianità assente e non valida.
   `cadenza` e `massimo` sono quelli letti nell'articolo del contratto. */
function provaScattiFissi({ccnl,sezione=null,livello,cadenza,massimo,importo,mensilita}){
  const inizio='2015-03-15';
  const anno=a=>`${2015+a}`;
  const maturati=alla=>R.scattiMaturati(ccnl,inizio,alla,sezione);
  /* Il primo matura il 15 marzo dopo `cadenza` anni e decorre dal 1° aprile. */
  assert.equal(maturati(`${anno(cadenza)}-03-31`),0,`${ccnl} prima del primo`);
  assert.equal(maturati(`${anno(cadenza)}-04-01`),1,`${ccnl} primo`);
  if(massimo>1){
    assert.equal(maturati(`${anno(2*cadenza)}-03-31`),1,`${ccnl} prima del secondo`);
    assert.equal(maturati(`${anno(2*cadenza)}-04-01`),2,`${ccnl} secondo`);
  }
  assert.equal(maturati(`${anno(massimo*cadenza)}-04-01`),massimo,`${ccnl} tetto esatto`);
  assert.equal(R.scattiMaturati(ccnl,'1970-01-01',OGGI,sezione),massimo,`${ccnl} oltre il tetto`);
  const r=R.componiRal({ccnl,sezione,livello,scatti:massimo,alla:OGGI});
  assert.equal(r.valoreScatto,importo);
  assert.equal(r.scattiMensili,Math.round(importo*100*massimo)/100);
  assert.equal(r.scattiAlTetto,true);
  assert.equal(r.quote.find(q=>q.id==='scatti').mensilita,mensilita);
  assert.throws(()=>R.componiRal({ccnl,sezione,livello,scatti:massimo+1,alla:OGGI}),RangeError);
  assert.throws(()=>R.componiRal({ccnl,sezione,livello,scatti:-1,alla:OGGI}),RangeError);
  const senza=R.componiRal({ccnl,sezione,livello,alla:OGGI});
  assert.equal(senza.numeroScatti,0);
  assert.equal(senza.anzianitaDichiarata,false);
  assert.throws(()=>R.componiRal({ccnl,sezione,livello,dataAnzianita:'2026-02-30',alla:OGGI}),RangeError);
  assert.throws(()=>R.componiRal({ccnl,sezione,livello,dataAnzianita:'2027-01-01',alla:OGGI}),RangeError);
}

function nettoRiconcilia(r){
  const risultato=applicaMensilita(calcola(String(r.ral),{comune:'F205',nucleo:[]}),r.mensilita);
  assert.ok(risultato.riconciliazione.verificata);
  assert.ok(risultato.kpi.nettoAnnuo>0);
  return risultato;
}

const voci=livello=>livello.voci.map(v=>[v.id,v.importo]);

test.describe('FIPE — pubblici esercizi e ristorazione, H05Y',()=>{

  test('tre sezioni, dieci livelli, voci e totali della tabella FIPE',()=>{
    assert.deepEqual(R.sezioni(FIPE).map(s=>s.id),['generale','collettiva','minori']);
    assert.deepEqual(R.livelli(FIPE,OGGI,'generale').map(l=>l.codice),
      ['Qa','Qb','1','2','3','4','5','6s','6','7']);
    /* Tabelle retributive 2024, p. 362: giugno 2026, 4° livello,
       contingenza 524,94 + paga base 1.167,75 = 1.692,69. */
    const quarto=R.trovaLivello(FIPE,'4',OGGI,'generale');
    assert.deepEqual(voci(quarto),[['pagaBase',1167.75],['contingenza',524.94]]);
    assert.equal(quarto.totalePubblicato,1692.69);
    assert.equal(quarto.scatto,33.05);
    /* Estremi: Qa 2.462,96 e 7° 1.390,20. */
    assert.equal(R.trovaLivello(FIPE,'Qa',OGGI,'generale').totale,2462.96);
    assert.equal(R.trovaLivello(FIPE,'7',OGGI,'generale').totale,1390.20);
    /* Aziende minori, p. 367: paga base ridotta 1.164,39 (3,36 in meno)
       + 524,94 = 1.689,33. */
    const minore=R.trovaLivello(FIPE,'4',OGGI,'minori');
    assert.deepEqual(voci(minore),[['pagaBase',1164.39],['contingenza',524.94]]);
    assert.equal(minore.totalePubblicato,1689.33);
  });

  test('la ristorazione collettiva ha le tranche intermedie a settembre',()=>{
    provaDecorrenze(FIPE,'generale',['2024-06-01','2025-06-01','2026-06-01','2027-06-01','2027-12-01']);
    provaDecorrenze(FIPE,'collettiva',['2024-06-01','2025-09-01','2026-09-01','2027-06-01','2027-12-01']);
    provaDecorrenze(FIPE,'minori',['2024-06-01','2025-06-01','2026-06-01','2027-06-01','2027-12-01']);
    /* Al 31 agosto 2026 il 4° vale 1.692,69 nella generale e ancora
       1.652,69 nella collettiva (settembre 2025); dal 1° settembre coincidono. */
    assert.equal(R.trovaLivello(FIPE,'4','2026-08-31','generale').totale,1692.69);
    assert.equal(R.trovaLivello(FIPE,'4','2026-08-31','collettiva').totale,1652.69);
    assert.equal(R.trovaLivello(FIPE,'4','2026-09-01','collettiva').totale,1692.69);
  });

  test('scatti quadriennali, sei, esclusi dalla quattordicesima',()=>{
    provaScattiFissi({ccnl:FIPE,sezione:'generale',livello:'4',cadenza:4,massimo:6,
      importo:33.05,mensilita:13});
  });

  /* 4° livello, due scatti da 33,05, tempo pieno:
     1.692,69 × 14 = 23.697,66; 66,10 × 13 = 859,30 → 24.556,96.
     A 20 ore su 40: 1.692,69 / 2 = 846,345 → 846,35 × 14 = 11.848,90;
     66,10 / 2 = 33,05 × 13 = 429,65 → 12.278,55. */
  test('tempo pieno e part-time, con gli scatti su 13 mensilità',()=>{
    const pieno=R.componiRal({ccnl:FIPE,sezione:'generale',livello:'4',scatti:2,alla:OGGI});
    assert.equal(pieno.ral,24556.96);
    assert.equal(pieno.identitaSemplice,false);
    const ridotto=R.componiRal({ccnl:FIPE,sezione:'generale',livello:'4',scatti:2,
      oreSettimanali:20,alla:OGGI});
    assert.equal(ridotto.baseMensile,846.35);
    assert.equal(ridotto.ral,12278.55);
    nettoRiconcilia(pieno);nettoRiconcilia(ridotto);
  });

  test('le esclusioni dicono la quattordicesima senza scatti e i terzi elementi',()=>{
    const testo=R.ESCLUSIONI[FIPE].join(' ');
    assert.match(testo,/art\. 184/);
    assert.match(testo,/art\. 165/);
    assert.match(testo,/percentuale di servizio/);
    assert.match(R.componiRal({ccnl:FIPE,sezione:'collettiva',livello:'4',alla:OGGI})
      .esclusioni.join(' '),/Titolo X/);
  });
});

test.describe('Turismo — Federalberghi, H052',()=>{

  test('due sezioni e l’indennità di funzione dei Quadri come voce propria',()=>{
    assert.deepEqual(R.sezioni(TURISMO).map(s=>s.id),['generale','minori']);
    /* Art. 152, maggio 2026: 4° livello 1.695,69 nella generale,
       1.688,98 negli alberghi a una e due stelle. */
    assert.equal(R.trovaLivello(TURISMO,'4',OGGI,'generale').totale,1695.69);
    assert.equal(R.trovaLivello(TURISMO,'4',OGGI,'minori').totale,1688.98);
    /* Quadro A: 2.416,82 + indennità art. 145 di 75,00 = 2.491,82. */
    const quadro=R.trovaLivello(TURISMO,'A',OGGI,'generale');
    assert.deepEqual(voci(quadro),[['pagaBase',2416.82],['indennitaFunzione',75]]);
    assert.equal(quadro.totale,2491.82);
    assert.equal(R.trovaLivello(TURISMO,'B',OGGI,'minori').voci[1].importo,70);
    assert.equal(R.trovaLivello(TURISMO,'7',OGGI,'minori').totale,1407.44);
  });

  test('cinque tranche firmate, da luglio 2024 a novembre 2027',()=>{
    for(const sezione of ['generale','minori'])
      provaDecorrenze(TURISMO,sezione,['2024-07-01','2025-06-01','2026-05-01','2027-04-01','2027-11-01']);
    assert.equal(R.trovaLivello(TURISMO,'4','2027-11-01','generale').totale,1750.69);
  });

  test('scatti triennali, sei, anche nella quattordicesima',()=>{
    provaScattiFissi({ccnl:TURISMO,sezione:'generale',livello:'4',cadenza:3,massimo:6,
      importo:33.05,mensilita:14});
    assert.match(R.regolaScatti(TURISMO,'generale').base,/18 anni/);
  });

  /* 4° generale, tre scatti: (1.695,69 + 99,15) × 14 = 25.127,76.
     A 20 ore: 847,845 → 847,85; scatti 49,575 → 49,58 (sul totale
     degli scatti, 99,15 / 2); (847,85 + 49,58) × 14 = 12.564,02. */
  test('tempo pieno e part-time',()=>{
    const pieno=R.componiRal({ccnl:TURISMO,sezione:'generale',livello:'4',scatti:3,alla:OGGI});
    assert.equal(pieno.ral,25127.76);
    assert.equal(pieno.identitaSemplice,true);
    const ridotto=R.componiRal({ccnl:TURISMO,sezione:'generale',livello:'4',scatti:3,
      oreSettimanali:20,alla:OGGI});
    assert.equal(ridotto.baseMensile,847.85);
    assert.equal(ridotto.scattiMensili,49.58);
    assert.equal(ridotto.ral,12564.02);
    nettoRiconcilia(pieno);nettoRiconcilia(ridotto);
  });

  test('le esclusioni dicono l’età per gli scatti e l’assunzione sulla funzione',()=>{
    const testo=R.ESCLUSIONI[TURISMO].join(' ');
    assert.match(testo,/18 anni/);
    assert.match(testo,/artt\. 160–161/);
  });
});

test.describe('Imprese di viaggi e turismo — FIAVET Confcommercio, H04Z',()=>{

  /* Art. 147 dell'accordo 26 luglio 2024: paga base al 30 giugno 2024
     più gli incrementi di ogni tranche. 1° livello: 1.906,44 + 61,47
     = 1.967,91 (luglio 2024); + 49,18 = 2.017,09 (settembre 2025);
     + 49,18 = 2.066,27 (settembre 2026). */
  test('dieci livelli, nessuna sezione, paga base conglobata dell’art. 147',()=>{
    assert.deepEqual(R.sezioni(AGENZIE),[]);
    assert.deepEqual(R.livelli(AGENZIE,OGGI).map(l=>l.codice),
      ['A','B','1','2','3','4','5','6S','6','7']);
    assert.equal(R.trovaLivello(AGENZIE,'1','2026-08-31').totale,2017.09);
    assert.equal(R.trovaLivello(AGENZIE,'1',OGGI).totale,2066.27);
    assert.equal(R.trovaLivello(AGENZIE,'4',OGGI).totale,1680.69);
    assert.equal(R.trovaLivello(AGENZIE,'7',OGGI).totale,1400.10);
    /* Quadro A: 2.395,44 + indennità art. 140 di 75,00 = 2.470,44. */
    const quadro=R.trovaLivello(AGENZIE,'A',OGGI);
    assert.deepEqual(voci(quadro),[['pagaBase',2395.44],['indennitaFunzione',75]]);
    assert.equal(quadro.totale,2470.44);
    assert.equal(R.trovaLivello(AGENZIE,'B',OGGI).voci[1].importo,70);
  });

  test('cinque tranche firmate, da luglio 2024 a dicembre 2027',()=>{
    provaDecorrenze(AGENZIE,null,['2024-07-01','2025-09-01','2026-09-01','2027-06-01','2027-12-01']);
    /* 1° livello a dicembre 2027: 2.066,27 + 36,88 + 49,18 = 2.152,33. */
    assert.equal(R.trovaLivello(AGENZIE,'1','2027-12-01').totale,2152.33);
  });

  test('non è il contratto degli alberghi: stesso livello, altra paga',()=>{
    assert.notEqual(R.trovaLivello(AGENZIE,'1','2026-08-31').totale,
      R.trovaLivello(TURISMO,'1','2026-08-31','generale').totale);
  });

  test('scatti triennali, sei, anche nella quattordicesima',()=>{
    provaScattiFissi({ccnl:AGENZIE,livello:'4',cadenza:3,massimo:6,importo:33.05,mensilita:14});
    assert.match(R.regolaScatti(AGENZIE).base,/18 anni/);
  });

  /* 1° livello, tre scatti: (2.066,27 + 113,10) × 14 = 30.511,18.
     A 20 ore: 1.033,135 → 1.033,14; scatti 56,55;
     (1.033,14 + 56,55) × 14 = 15.255,66. */
  test('tempo pieno e part-time',()=>{
    const pieno=R.componiRal({ccnl:AGENZIE,livello:'1',scatti:3,alla:OGGI});
    assert.equal(pieno.ral,30511.18);
    assert.equal(pieno.identitaSemplice,true);
    assert.equal(R.componiRal({ccnl:AGENZIE,livello:'1',alla:OGGI}).ral,28927.78);
    const ridotto=R.componiRal({ccnl:AGENZIE,livello:'1',scatti:3,oreSettimanali:20,alla:OGGI});
    assert.equal(ridotto.baseMensile,1033.14);
    assert.equal(ridotto.scattiMensili,56.55);
    assert.equal(ridotto.ral,15255.66);
    nettoRiconcilia(pieno);nettoRiconcilia(ridotto);
  });

  test('le esclusioni dicono le agenzie minori, l’età per gli scatti e la funzione',()=>{
    const testo=R.ESCLUSIONI[AGENZIE].join(' ');
    assert.match(testo,/agenzie minori/i);
    assert.match(testo,/art\. 148/);
    assert.match(testo,/18 anni/);
    assert.match(testo,/artt\. 157–158/);
  });
});

test.describe('Studi professionali — Confprofessioni, H442',()=>{

  test('otto livelli, minimo conglobato unico',()=>{
    assert.deepEqual(R.sezioni(STUDI),[]);
    assert.deepEqual(R.livelli(STUDI,OGGI).map(l=>l.codice),['Q','1','2','3S','3','4S','4','5']);
    /* Art. 140, terza tranche (ottobre 2025): 4° 1.595,42, Quadri 2.408,53, 5° 1.484,78. */
    assert.deepEqual(voci(R.trovaLivello(STUDI,'4',OGGI)),[['minimo',1595.42]]);
    assert.equal(R.trovaLivello(STUDI,'Q',OGGI).totale,2408.53);
    assert.equal(R.trovaLivello(STUDI,'5',OGGI).totale,1484.78);
  });

  test('quattro tranche, l’ultima firmata a dicembre 2026',()=>{
    provaDecorrenze(STUDI,null,['2024-03-01','2024-10-01','2025-10-01','2026-12-01']);
    /* Riscontro Filcams: 4° 1.614,12 e Quadri 2.436,76 dal 1° dicembre 2026. */
    assert.equal(R.trovaLivello(STUDI,'4','2026-12-01').totale,1614.12);
    assert.equal(R.trovaLivello(STUDI,'Q','2026-12-01').totale,2436.76);
  });

  test('scatti triennali, otto, allo stesso studio',()=>{
    provaScattiFissi({ccnl:STUDI,livello:'4',cadenza:3,massimo:8,importo:20,mensilita:14});
    assert.equal(R.trovaLivello(STUDI,'Q',OGGI).scatto,30);
  });

  /* 4°: 1.595,42 × 14 = 22.335,88. A 30 ore: 1.595,42 × 0,75 =
     1.196,565 → 1.196,57 × 14 = 16.751,98. */
  test('tempo pieno e part-time',()=>{
    const pieno=R.componiRal({ccnl:STUDI,livello:'4',alla:OGGI});
    assert.equal(pieno.ral,22335.88);
    const ridotto=R.componiRal({ccnl:STUDI,livello:'4',oreSettimanali:30,alla:OGGI});
    assert.equal(ridotto.ral,16751.98);
    nettoRiconcilia(pieno);nettoRiconcilia(ridotto);
  });

  test('l’elemento di allineamento Confedertecnica è escluso e dichiarato',()=>{
    assert.match(R.ESCLUSIONI[STUDI].join(' '),/allineamento contrattuale/);
    assert.equal(R.trovaLivello(STUDI,'1',OGGI).voci.length,1);
  });
});

test.describe('Multiservizi — K511',()=>{

  test('impiegati e operai condividono le tabelle, non i livelli',()=>{
    assert.deepEqual(R.livelli(MULTI,OGGI,'impiegati').map(l=>l.codice),['Q','7','6','5','4','3','2']);
    assert.deepEqual(R.livelli(MULTI,OGGI,'operai').map(l=>l.codice),['6','5','4','3','2','1']);
    /* Filcams, maggio 2026, 5° livello: tabellare 1.097,13 + contingenza
       518,53 = retribuzione base 1.615,66; EDR 10,33 a parte. */
    const quinto=R.trovaLivello(MULTI,'5',OGGI,'impiegati');
    assert.deepEqual(voci(quinto),[['tabellare',1097.13],['contingenza',518.53],['edr',10.33]]);
    assert.equal(quinto.totalePubblicato,1615.66);
    assert.equal(quinto.voci.find(v=>v.id==='edr').mensilita,13);
    /* Quadro: 1.724,08 + 532,06 = 2.256,14, più l'indennità di funzione 25,82. */
    const quadro=R.trovaLivello(MULTI,'Q',OGGI,'impiegati');
    assert.equal(quadro.totalePubblicato,2256.14);
    assert.equal(quadro.voci.find(v=>v.id==='indennitaFunzione').importo,25.82);
    /* 1°, solo operai: 783,68 + 512,71 = 1.296,39. */
    assert.equal(R.trovaLivello(MULTI,'1',OGGI,'operai').totalePubblicato,1296.39);
    assert.equal(R.trovaLivello(MULTI,'1',OGGI,'impiegati'),null);
  });

  test('otto tranche fino a marzo 2029',()=>{
    const attese=['2025-07-01','2026-05-01','2026-10-01','2027-05-01','2027-12-01',
      '2028-07-01','2028-10-01','2029-03-01'];
    provaDecorrenze(MULTI,'impiegati',attese);
    provaDecorrenze(MULTI,'operai',attese);
    /* Riscontro testuale della scheda: Quadro 2.326,78, 2° 1.403,17 e
       1° 1.328,50 da ottobre 2026. */
    assert.equal(R.trovaLivello(MULTI,'Q','2026-10-01','impiegati').totalePubblicato,2326.78);
    assert.equal(R.trovaLivello(MULTI,'2','2026-10-01','operai').totalePubblicato,1403.17);
    assert.equal(R.trovaLivello(MULTI,'1','2026-10-01','operai').totalePubblicato,1328.50);
  });

  /* Impiegato di 5° livello assunto il 10 agosto 2021: scatti maturati
     il 10 agosto 2023 (finestra luglio 2023, 77,62) e il 10 agosto 2025
     (finestra luglio 2025, 83,24), decorrenti dal 1° settembre.
     RAL: 1.615,66 × 14 + 10,33 × 13 + 160,86 × 14
        = 22.619,24 + 134,29 + 2.252,04 = 25.005,57. */
  test('impiegati: ogni scatto vale la finestra in cui è maturato',()=>{
    const r=R.componiRal({ccnl:MULTI,sezione:'impiegati',livello:'5',
      dataAnzianita:'2021-08-10',alla:OGGI});
    assert.deepEqual(r.dettaglioScatti.map(s=>[s.maturazione,s.decorrenza,s.importo]),
      [['2023-08-10','2023-09-01',77.62],['2025-08-10','2025-09-01',83.24]]);
    assert.equal(r.scattiMensili,160.86);
    assert.equal(r.ral,25005.57);
    assert.equal(r.famigliaScatti,'percentualeMaturazione');
    /* Il giorno prima della decorrenza del secondo, uno solo. */
    assert.equal(R.componiRal({ccnl:MULTI,sezione:'impiegati',livello:'5',
      dataAnzianita:'2021-08-10',alla:'2025-08-31'}).numeroScatti,1);
    /* Una finestra successiva non rivaluta gli scatti già maturati. */
    assert.equal(R.componiRal({ccnl:MULTI,sezione:'impiegati',livello:'5',
      dataAnzianita:'2021-08-10',alla:'2026-10-01'}).scattiMensili,160.86);
    /* Tetto a otto: assunto nel 2025, al 2041 ne ha otto e non di più. */
    assert.equal(R.scattiMaturati(MULTI,'2025-08-10','2045-01-01','impiegati'),8);
  });

  test('impiegati: prima del luglio 2021 e senza data il valore non si ricostruisce',()=>{
    assert.throws(()=>R.componiRal({ccnl:MULTI,sezione:'impiegati',livello:'5',
      dataAnzianita:'2019-03-01',alla:OGGI}),/non è documentato/);
    assert.throws(()=>R.componiRal({ccnl:MULTI,sezione:'impiegati',livello:'5',
      scatti:2,alla:OGGI}),/data di anzianità/);
    assert.throws(()=>R.componiRal({ccnl:MULTI,sezione:'impiegati',livello:'5',
      dataAnzianita:'2026-02-30',alla:OGGI}),RangeError);
    assert.equal(R.componiRal({ccnl:MULTI,sezione:'impiegati',livello:'5',alla:OGGI}).numeroScatti,0);
  });

  /* Operaio di 2° livello nel settore dal 1° gennaio 2020: dal quinto
     anno la quota forfettaria di 54,39.
     (1.368,17 + 54,39) × 14 + 10,33 × 13 = 19.915,84 + 134,29 = 20.050,13. */
  test('operai: una quota unica dal quinto anno nel settore',()=>{
    assert.equal(R.scattiMaturati(MULTI,'2022-09-23',OGGI,'operai'),0);
    assert.equal(R.scattiMaturati(MULTI,'2022-09-22',OGGI,'operai'),1);
    const r=R.componiRal({ccnl:MULTI,sezione:'operai',livello:'2',dataAnzianita:'2020-01-01',alla:OGGI});
    assert.equal(r.scattiMensili,54.39);
    assert.equal(r.ral,20050.13);
    assert.equal(r.scattiAlTetto,true);
    assert.equal(R.componiRal({ccnl:MULTI,sezione:'operai',livello:'2',scatti:1,alla:OGGI}).scattiMensili,54.39);
    assert.throws(()=>R.componiRal({ccnl:MULTI,sezione:'operai',livello:'2',scatti:2,alla:OGGI}),RangeError);
    assert.match(R.regolaScatti(MULTI,'operai').base,/nel settore/);
  });

  /* Operaio di 2° a 25 ore, senza anzianità: 1.368,17 × 25/40 =
     855,10625 → 855,11 × 14 = 11.971,54; EDR 10,33 × 25/40 = 6,45625
     → 6,46 × 13 = 83,98. RAL 12.055,52. */
  test('part-time: EDR su 13 mensilità riproporzionato a parte',()=>{
    const r=R.componiRal({ccnl:MULTI,sezione:'operai',livello:'2',oreSettimanali:25,alla:OGGI});
    assert.equal(r.ral,12055.52);
    assert.deepEqual(r.quote.filter(q=>q.annuo).map(q=>[q.id,q.mensile,q.mensilita]),
      [['base',855.11,14],['edr',6.46,13]]);
    nettoRiconcilia(r);
    nettoRiconcilia(R.componiRal({ccnl:MULTI,sezione:'impiegati',livello:'Q',alla:OGGI}));
  });

  test('le esclusioni dicono ANIP, i parametri 115 e 125 e gli scatti ante 2021',()=>{
    const testo=R.ESCLUSIONI[MULTI].join(' ');
    assert.match(testo,/ANIP/);
    assert.match(testo,/Parametri 115/);
    assert.equal(R.livelli(MULTI,OGGI,'operai').some(l=>/115|125/.test(l.nome)),false);
    assert.match(R.componiRal({ccnl:MULTI,sezione:'impiegati',livello:'5',alla:OGGI})
      .esclusioni.join(' '),/1° luglio 2021/);
  });
});

test.describe('DMO — Federdistribuzione, H008',()=>{

  test('una voce propria del catalogo, con la tabella Filcams DMO',()=>{
    assert.notEqual(R.trovaContratto(DMO),R.trovaContratto('terziario-confcommercio-h011'));
    assert.equal(R.trovaContratto(DMO).codiceCnel,'H008');
    /* Filcams DMO, minimi dal 1/11/2025: 4° livello 1.257,46 + 524,22 +
       2,07 = 1.783,75; Quadro con indennità di funzione 260,76 = 2.986,29. */
    const quarto=R.trovaLivello(DMO,'4',OGGI);
    assert.deepEqual(voci(quarto),[['pagaBase',1257.46],['contingenza',524.22],['terzoElemento',2.07]]);
    assert.equal(quarto.totalePubblicato,1783.75);
    assert.equal(R.trovaLivello(DMO,'Q',OGGI).totalePubblicato,2986.29);
    assert.equal(R.trovaLivello(DMO,'7',OGGI).voci.find(v=>v.id==='elementoAggiuntivo').importo,5.16);
    assert.equal(R.trovaLivello(DMO,'OV2',OGGI).scatto,14.46);
  });

  test('tre tranche e scatti triennali, dieci',()=>{
    provaDecorrenze(DMO,null,['2025-11-01','2026-11-01','2027-02-01']);
    provaScattiFissi({ccnl:DMO,livello:'4',cadenza:3,massimo:10,importo:20.66,mensilita:14});
  });

  /* 4°: 1.783,75 × 14 = 24.972,50; a 20 ore 891,875 → 891,88 × 14 = 12.486,32. */
  test('tempo pieno e part-time',()=>{
    assert.equal(R.componiRal({ccnl:DMO,livello:'4',alla:OGGI}).ral,24972.50);
    const ridotto=R.componiRal({ccnl:DMO,livello:'4',oreSettimanali:20,alla:OGGI});
    assert.equal(ridotto.ral,12486.32);
    nettoRiconcilia(ridotto);
    assert.match(R.ESCLUSIONI[DMO].join(' '),/art\. 198/);
  });
});

test.describe('Logistica, trasporto merci e spedizione — I100',()=>{

  test('due sezioni, 39 ore, il 6° Junior fuori e i rider per parametro',()=>{
    assert.deepEqual(R.sezioni(LOGISTICA).map(s=>s.id),['non-viaggiante','viaggiante']);
    assert.equal(R.oreContrattuali(LOGISTICA,'viaggiante'),39);
    assert.deepEqual(R.livelli(LOGISTICA,OGGI,'non-viaggiante').map(l=>l.codice),
      ['Quadri','1°','2°','3°Super','3°','4°','4°Junior','5°','6°']);
    assert.equal(R.trovaLivello(LOGISTICA,'6°Junior','2025-01-01','non-viaggiante'),null);
    assert.deepEqual(R.livelli(LOGISTICA,OGGI,'viaggiante').map(l=>l.codice),
      ['C3','B3','A3','F2','E2','D2','H1','G1','I-110','I-116','L-110','L-116','L-119']);
    /* Gennaio 2026, 3° Super: minimo 1.970,37 + EPA 30,00 = 2.000,37;
       EDR 10,00 per 13 mensilità, fuori dal totale stampato. */
    const terzoSuper=R.trovaLivello(LOGISTICA,'3°Super',OGGI,'non-viaggiante');
    assert.deepEqual(voci(terzoSuper),[['minimo',1970.37],['epa',30],['edr',10]]);
    assert.equal(terzoSuper.totalePubblicato,2000.37);
    /* Quadri: 2.528,31 + 46,67 + indennità di funzione 51,65 + EDR 12,80. */
    assert.deepEqual(voci(R.trovaLivello(LOGISTICA,'Quadri',OGGI,'non-viaggiante')),
      [['minimo',2528.31],['epa',46.67],['indennitaFunzione',51.65],['edr',12.8]]);
    /* Rider L, parametro 119: 1.762,98 + 16,67 = 1.779,65; EDR 8,95. */
    const rider=R.trovaLivello(LOGISTICA,'L-119',OGGI,'viaggiante');
    assert.equal(rider.totalePubblicato,1779.65);
    assert.equal(rider.voci.find(v=>v.id==='edr').importo,8.95);
  });

  test('le discrepanze della fonte sono esattamente quelle registrate',()=>{
    const scarti=[];
    for(const sezione of R.sezioni(LOGISTICA))
      for(const tabella of sezione.tabelle)
        for(const livello of tabella.livelli){
          const conti=R.riconciliaLivello(livello);
          assert.ok(conti.verificata,`${sezione.id} ${tabella.decorrenza} ${livello.codice}`);
          if(conti.scartoFonte)scarti.push(`${tabella.decorrenza} ${livello.codice} ${conti.scartoFonte}`);
        }
    assert.deepEqual(scarti.sort(),[
      '2025-01-01 F2 0.06','2026-01-01 F2 0.06',
      '2027-01-01 1° 12.05','2027-01-01 2° 11.06','2027-01-01 3° 9.7','2027-01-01 3°Super 10',
      '2027-01-01 4° 9.24','2027-01-01 4°Junior 9.02','2027-01-01 5° 8.79','2027-01-01 6° 8.26',
      '2027-01-01 F2 0.06','2027-01-01 Quadri 12.81','2027-06-01 F2 0.06',
    ].sort());
    /* F2 gennaio 2026: stampato 1.948,15, somma 1.918,09 + 30,00 = 1.948,09. */
    const f2=R.trovaLivello(LOGISTICA,'F2',OGGI,'viaggiante');
    assert.equal(f2.totalePubblicato,1948.15);
    assert.equal(R.componiRal({ccnl:LOGISTICA,sezione:'viaggiante',livello:'F2',alla:OGGI})
      .baseMensile,1948.09+9.74);
  });

  test('quattro decorrenze, la terza di solo EPA',()=>{
    for(const sezione of ['non-viaggiante','viaggiante'])
      provaDecorrenze(LOGISTICA,sezione,['2025-01-01','2026-01-01','2027-01-01','2027-06-01']);
    const gennaio=R.trovaLivello(LOGISTICA,'3°',"2027-01-01",'non-viaggiante');
    assert.deepEqual(voci(gennaio).slice(0,2),[['minimo',1916.84],['epa',60]]);
  });

  test('scatti biennali, cinque, con importi per sezione',()=>{
    provaScattiFissi({ccnl:LOGISTICA,sezione:'non-viaggiante',livello:'3°Super',cadenza:2,
      massimo:5,importo:24.79,mensilita:14});
    provaScattiFissi({ccnl:LOGISTICA,sezione:'viaggiante',livello:'G1',cadenza:2,
      massimo:5,importo:23.14,mensilita:14});
  });

  /* 3° Super: 2.000,37 × 14 = 28.005,18; EDR 10,00 × 13 = 130,00 → 28.135,18.
     A 19,5 ore su 39: 1.000,185 → 1.000,19 × 14 = 14.002,66; EDR 5,00 × 13 = 65 → 14.067,66. */
  test('tempo pieno e part-time su 39 ore',()=>{
    const pieno=R.componiRal({ccnl:LOGISTICA,sezione:'non-viaggiante',livello:'3°Super',alla:OGGI});
    assert.equal(pieno.ral,28135.18);
    const ridotto=R.componiRal({ccnl:LOGISTICA,sezione:'non-viaggiante',livello:'3°Super',
      oreSettimanali:19.5,alla:OGGI});
    assert.equal(ridotto.ral,14067.66);
    assert.throws(()=>R.componiRal({ccnl:LOGISTICA,sezione:'viaggiante',livello:'B3',
      oreSettimanali:40,alla:OGGI}),RangeError);
    nettoRiconcilia(pieno);nettoRiconcilia(ridotto);
  });

  test('le esclusioni dicono il 6° Junior e le norme transitorie',()=>{
    const testo=R.ESCLUSIONI[LOGISTICA].join(' ');
    assert.match(testo,/6° livello Junior/);
    assert.match(testo,/1° giugno 2000/);
  });
});

test.describe('Cooperative sociali — T151',()=>{

  test('tredici posizioni, 38 ore, minimo conglobato',()=>{
    assert.deepEqual(R.livelli(COOP,OGGI).map(l=>l.codice),
      ['A1','A2','B1','C1','C2','C3','D1','D2','D3','E1','E2','F1','F2']);
    assert.equal(R.oreContrattuali(COOP),38);
    /* Art. 76, ottobre 2025: D2 1.727,83; C3 e D1 1.637,57; F2 2.504,09. */
    assert.deepEqual(voci(R.trovaLivello(COOP,'D2',OGGI)),[['minimo',1727.83]]);
    assert.equal(R.trovaLivello(COOP,'C3',OGGI).totale,1637.57);
    assert.equal(R.trovaLivello(COOP,'D1',OGGI).totale,1637.57);
    assert.equal(R.trovaLivello(COOP,'F2',OGGI).totale,2504.09);
    assert.equal(R.trovaLivello(COOP,'A1',OGGI).totale,1359.85);
  });

  test('tre tranche e nessuna successiva: il contratto è scaduto e non rinnovato',()=>{
    provaDecorrenze(COOP,null,['2024-02-01','2024-10-01','2025-10-01']);
    assert.equal(R.prossimaTabella(COOP,OGGI),null);
    assert.match(R.ESCLUSIONI[COOP][0],/scaduto il 31 dicembre 2025/);
  });

  test('13 mensilità fino al 2024, 13,5 dal 2025',()=>{
    assert.equal(R.mensilitaAlla(COOP,'2024-12-31'),13);
    assert.equal(R.mensilitaAlla(COOP,'2025-01-01'),13.5);
    /* D2, 31 dicembre 2024 (tabella ottobre 2024): 1.694,41 × 13 = 22.027,33. */
    assert.equal(R.componiRal({ccnl:COOP,livello:'D2',alla:'2024-12-31'}).ral,22027.33);
    /* 1° gennaio 2025, stessa tabella: 1.694,41 × 13,5 = 22.874,535 → 22.874,54. */
    assert.equal(R.componiRal({ccnl:COOP,livello:'D2',alla:'2025-01-01'}).ral,22874.54);
  });

  /* D2 infermiere, oggi: 1.727,83 × 13,5 = 23.325,705 → 23.325,71;
     indennità 154,94 × 13,5 = 2.091,69. RAL 25.417,40. */
  test('le indennità professionali si scelgono per profilo, dove la declaratoria le colloca',()=>{
    const profili=codice=>R.trovaLivello(COOP,codice,OGGI).profili.map(p=>[p.id,p.voce.importo]);
    assert.deepEqual(profili('D1'),[['infermiere-generico',61.97]]);
    assert.deepEqual(profili('D2'),[['infermiere',154.94],['terapista',154.94]]);
    assert.deepEqual(profili('E2'),[['medico',258.23]]);
    assert.deepEqual(profili('F1'),[['medico',258.23]]);
    assert.deepEqual(profili('F2'),[['direttore',232.41]]);
    assert.deepEqual(profili('C3'),[]);
    const r=R.componiRal({ccnl:COOP,livello:'D2',profilo:'infermiere',alla:OGGI});
    assert.equal(r.ral,25417.40);
    assert.throws(()=>R.componiRal({ccnl:COOP,livello:'C3',profilo:'infermiere',alla:OGGI}),RangeError);
    nettoRiconcilia(r);
  });

  test('scatti biennali, cinque',()=>{
    provaScattiFissi({ccnl:COOP,livello:'D2',cadenza:2,massimo:5,importo:23.24,mensilita:13.5});
  });

  /* D2 a 19 ore su 38: 1.727,83 / 2 = 863,915 → 863,92 × 13,5 = 11.662,92. */
  test('part-time su 38 ore e media su 13,5 mensilità',()=>{
    const ridotto=R.componiRal({ccnl:COOP,livello:'D2',oreSettimanali:19,alla:OGGI});
    assert.equal(ridotto.ral,11662.92);
    const risultato=nettoRiconcilia(ridotto);
    assert.equal(risultato.input.mensilita,13.5);
  });
});

test.describe('PMI metalmeccanica Confapi — C018',()=>{

  test('nove categorie e i Quadri con l’indennità di funzione',()=>{
    assert.deepEqual(R.livelli(CONFAPI,OGGI).map(l=>l.codice),
      ['1','2','3','4','5','6','7','8','8Q','9','9Q']);
    /* Verbale IPCA 17 giugno 2026: 1ª 1.639,96; 5ª 2.245,87; 9ª 3.124,30. */
    assert.deepEqual(voci(R.trovaLivello(CONFAPI,'5',OGGI)),[['minimo',2245.87]]);
    assert.equal(R.trovaLivello(CONFAPI,'1',OGGI).totale,1639.96);
    /* 9Q: 3.124,30 + 69,72 = 3.194,02; 8Q: 2.809,37 + 49,06 = 2.858,43. */
    assert.equal(R.trovaLivello(CONFAPI,'9Q',OGGI).totale,3194.02);
    assert.equal(R.trovaLivello(CONFAPI,'8Q',OGGI).totale,2858.43);
    assert.equal(R.trovaLivello(CONFAPI,'8',OGGI).totale,2809.37);
  });

  test('cinque tranche, due già firmate per il 2027 e il 2028',()=>{
    provaDecorrenze(CONFAPI,null,['2025-06-01','2025-09-01','2026-06-01','2027-06-01','2028-06-01']);
    assert.equal(R.trovaLivello(CONFAPI,'5','2027-06-01').totale,2290.87);
    assert.equal(R.trovaLivello(CONFAPI,'5','2028-06-01').totale,2345.87);
  });

  test('scatti biennali, cinque, per categoria',()=>{
    provaScattiFissi({ccnl:CONFAPI,livello:'5',cadenza:2,massimo:5,importo:29.64,mensilita:13});
    assert.equal(R.trovaLivello(CONFAPI,'9Q',OGGI).scatto,45.96);
  });

  /* 5ª: 2.245,87 × 13 = 29.196,31. A 20 ore: 1.122,935 → 1.122,94 × 13 = 14.598,22. */
  test('tempo pieno e part-time',()=>{
    assert.equal(R.componiRal({ccnl:CONFAPI,livello:'5',alla:OGGI}).ral,29196.31);
    const ridotto=R.componiRal({ccnl:CONFAPI,livello:'5',oreSettimanali:20,alla:OGGI});
    assert.equal(ridotto.ral,14598.22);
    nettoRiconcilia(ridotto);
    assert.match(R.ESCLUSIONI[CONFAPI].join(' '),/485 €/);
  });
});

test.describe('Grafici editori — G011',()=>{

  test('due sezioni con livelli propri, tre voci e totale derivato',()=>{
    assert.deepEqual(R.livelli(GRAFICI,OGGI,'grafici').map(l=>l.codice),
      ['Q','AS','A','B1S','B1','B2','B3','C1','C2','D1','D2','E']);
    assert.deepEqual(R.livelli(GRAFICI,OGGI,'editori').map(l=>l.codice),
      ['Q','1','2','3','4','5','6','7']);
    /* B3 Grafici, luglio 2026: 1.339,04 (1° ottobre 2022, testo 2021)
       + 90 + 30 + 30 + 50 + 52 (circolare) = 1.591,04; contingenza
       525,47 (Allegato 1); EDR 10,33. Totale 2.126,84. */
    const b3=R.trovaLivello(GRAFICI,'B3',OGGI,'grafici');
    assert.deepEqual(voci(b3),[['minimo',1591.04],['contingenza',525.47],['edr',10.33]]);
    assert.equal(b3.totale,2126.84);
    assert.equal(R.riconciliaLivello(b3).tipo,'derivato');
    /* Livello 2 Editori: 1.630,80 + 90 + 30 + 30 + 50 + 52 = 1.882,80. */
    assert.equal(R.trovaLivello(GRAFICI,'2',OGGI,'editori').voci[0].importo,1882.80);
    /* Riscontro indipendente Kitech al 1° luglio 2026: Q 2.331,78. */
    assert.equal(R.trovaLivello(GRAFICI,'Q',OGGI,'grafici').voci[0].importo,2331.78);
  });

  test('cinque tranche e nessun livello 8 Editori',()=>{
    for(const sezione of ['grafici','editori'])
      provaDecorrenze(GRAFICI,sezione,['2024-03-01','2024-10-01','2025-05-01','2025-10-01','2026-07-01']);
    for(const tabella of R.sezioni(GRAFICI).find(s=>s.id==='editori').tabelle)
      assert.equal(tabella.livelli.some(l=>l.codice==='8'),false);
    assert.match(R.ESCLUSIONI[GRAFICI].join(' '),/Livello 8 Editori/);
  });

  test('scatti biennali, cinque; per Q e AS non calcolabili',()=>{
    provaScattiFissi({ccnl:GRAFICI,sezione:'grafici',livello:'B3',cadenza:2,massimo:5,
      importo:13.43,mensilita:13});
    for(const [sezione,livello] of [['grafici','Q'],['grafici','AS'],['editori','Q']]){
      const r=R.componiRal({ccnl:GRAFICI,sezione,livello,alla:OGGI});
      assert.equal(r.scattiDocumentati,false,livello);
      assert.equal(r.scattiMensili,0);
      assert.throws(()=>R.componiRal({ccnl:GRAFICI,sezione,livello,
        dataAnzianita:'2015-01-01',alla:OGGI}),/non calcolabili/);
      assert.throws(()=>R.componiRal({ccnl:GRAFICI,sezione,livello,scatti:1,alla:OGGI}),/non calcolabili/);
    }
  });

  /* B3: 2.126,84 × 13 = 27.648,92. A 20 ore: (1.591,04 + 525,47 + 10,33) / 2
     = 1.063,42 × 13 = 13.824,46. */
  test('tempo pieno e part-time',()=>{
    assert.equal(R.componiRal({ccnl:GRAFICI,sezione:'grafici',livello:'B3',alla:OGGI}).ral,27648.92);
    const ridotto=R.componiRal({ccnl:GRAFICI,sezione:'grafici',livello:'B3',oreSettimanali:20,alla:OGGI});
    assert.equal(ridotto.ral,13824.46);
    nettoRiconcilia(ridotto);
  });
});

test.describe('Poligrafici — G041',()=>{

  test('una tabella in ultrattività, undici righe, 36 ore',()=>{
    assert.deepEqual(R.livelli(POLIGRAFICI,OGGI).map(l=>l.codice),
      ['10Q','10','9','8','7','6','5','4','3','2','1']);
    assert.equal(R.oreContrattuali(POLIGRAFICI),36);
    provaDecorrenze(POLIGRAFICI,null,['2021-04-01']);
    /* 5°: 1.162,99 + 531,82 = 1.694,81; 10Q con indennità 132,02 = 2.571,73. */
    assert.equal(R.trovaLivello(POLIGRAFICI,'5',OGGI).totalePubblicato,1694.81);
    assert.equal(R.trovaLivello(POLIGRAFICI,'10Q',OGGI).totale,2571.73);
    assert.match(R.trovaContratto(POLIGRAFICI).notaFonte,/non firmatarie/);
  });

  /* Decisione del 22 settembre 2026: 7° a 1.433,21 (Adapt), non 1.433,31
     (Kitech). 1.433,21 + 540,38 = 1.973,59; Kitech stampa 1.973,69. */
  test('il 7° livello usa il valore del rapporto Adapt e registra lo scarto',()=>{
    const settimo=R.trovaLivello(POLIGRAFICI,'7',OGGI);
    assert.equal(settimo.voci[0].importo,1433.21);
    assert.equal(settimo.totale,1973.59);
    assert.deepEqual(R.riconciliaLivello(settimo),{somma:1973.59,totale:1973.59,verificata:true,
      tipo:'pubblicato',totalePubblicato:1973.69,scartoFonte:0.1});
  });

  test('scatti biennali, sette',()=>{
    provaScattiFissi({ccnl:POLIGRAFICI,livello:'5',cadenza:2,massimo:7,importo:15.75,mensilita:13});
  });

  /* 5°: 1.694,81 × 13 = 22.032,53. A 18 ore su 36: 847,405 → 847,41 × 13 = 11.016,33. */
  test('tempo pieno e part-time su 36 ore',()=>{
    assert.equal(R.componiRal({ccnl:POLIGRAFICI,livello:'5',alla:OGGI}).ral,22032.53);
    const ridotto=R.componiRal({ccnl:POLIGRAFICI,livello:'5',oreSettimanali:18,alla:OGGI});
    assert.equal(ridotto.ral,11016.33);
    nettoRiconcilia(ridotto);
    assert.match(R.ESCLUSIONI[POLIGRAFICI].join(' '),/35 ore/);
  });
});

test.describe('Vetro, lampade e display — B132',()=>{

  test('quattro comparti, più il soffio a 36 ore',()=>{
    assert.deepEqual(R.sezioni(VETRO).map(s=>[s.id,s.oreSettimanali]),[
      ['meccanizzati',40],['trasformazione',40],['soffio',40],['soffio-36-ore',36],['lampade',40]]);
    /* Lavoro & Economia, gennaio 2026. Trasformazione 5: 1.713,37 +
       521,76 + 10,33 = 2.245,46. */
    const cinque=R.trovaLivello(VETRO,'5',OGGI,'trasformazione');
    assert.deepEqual(voci(cinque),[['minimo',1713.37],['contingenza',521.76],['edr',10.33]]);
    assert.equal(cinque.totalePubblicato,2245.46);
    /* Meccanizzati D2: 2.080,92 + IPO 154,21 + 10,33 = 2.245,46; D1 senza IPO. */
    assert.deepEqual(voci(R.trovaLivello(VETRO,'D2',OGGI,'meccanizzati')),
      [['minimo',2080.92],['ipo',154.21],['edr',10.33]]);
    assert.equal(R.trovaLivello(VETRO,'D1',OGGI,'meccanizzati').totale,2091.25);
    /* Soffio 1: superminimo contrattuale 5,28 → 1.694,32. Lampade A con
       elemento aggiuntivo 60,00 → 2.991,37. */
    assert.equal(R.trovaLivello(VETRO,'1',OGGI,'soffio').totalePubblicato,1694.32);
    assert.equal(R.trovaLivello(VETRO,'A',OGGI,'lampade').totalePubblicato,2991.37);
    assert.match(R.trovaContratto(VETRO).notaFonte,/fonti secondarie/);
  });

  test('cinque tranche, con il D1 che sale di 50, 15, 30, 25 e 75 euro',()=>{
    const date=['2026-01-01','2026-10-01','2027-01-01','2027-06-01','2028-07-01'];
    for(const sezione of ['meccanizzati','trasformazione','soffio','soffio-36-ore','lampade'])
      provaDecorrenze(VETRO,sezione,date);
    const d1=date.map(d=>R.trovaLivello(VETRO,'D1',d,'meccanizzati').voci[0].importo);
    assert.deepEqual(d1,[2080.92,2095.92,2125.92,2150.92,2225.92]);
    /* L'ultima tranche firmata 2023–2025 (1° aprile 2025) era 2.030,92. */
    assert.equal(d1[0]-2030.92,50);
  });

  test('scatti biennali, cinque, per comparto',()=>{
    provaScattiFissi({ccnl:VETRO,sezione:'meccanizzati',livello:'D2',cadenza:2,massimo:5,
      importo:13.94,mensilita:13});
    provaScattiFissi({ccnl:VETRO,sezione:'soffio',livello:'7',cadenza:2,massimo:5,
      importo:14.72,mensilita:13});
  });

  /* Trasformazione 5: 2.245,46 × 13 = 29.190,98. Soffio a 36 ore, livello 1,
     a 18 ore: 1.694,32 / 2 = 847,16 × 13 = 11.013,08. */
  test('tempo pieno e part-time, anche a 36 ore',()=>{
    assert.equal(R.componiRal({ccnl:VETRO,sezione:'trasformazione',livello:'5',alla:OGGI}).ral,29190.98);
    const ridotto=R.componiRal({ccnl:VETRO,sezione:'soffio-36-ore',livello:'1',oreSettimanali:18,alla:OGGI});
    assert.equal(ridotto.ral,11013.08);
    nettoRiconcilia(ridotto);
  });

  /* RIC-77. L'art. 34 paga 100 ore l'anno su una base che deduce i 137
     punti di contingenza del 1977: la tabella allegata è in lire e per
     le categorie precedenti al 2001, e nessuna fonte la porta sui
     livelli attuali. Finché manca, la cifra annua non si chiama RAL. */
  test('il premio speciale manca, e la cifra annua lo dice invece di chiamarsi RAL',()=>{
    for(const sezione of R.sezioni(VETRO).map(s=>s.id)){
      const livello=R.livelli(VETRO,OGGI,sezione)[0].codice;
      const composta=R.componiRal({ccnl:VETRO,sezione,livello,alla:OGGI});
      assert.equal(composta.ralCompleta,false,sezione);
      assert.deepEqual(composta.quoteAnnueMancanti.map(q=>[q.id,q.fonte]),[['premioSpeciale','art. 34']],sezione);
    }
    assert.equal(R.etichettaAnnua(VETRO),'Base tabellare annualizzata');
    assert.match(R.avvisoRalParziale(VETRO),/Non è la RAL contrattuale completa: manca il premio speciale di giugno previsto dall’art\. 34/);
    assert.match(R.avvisoRalParziale(VETRO),/netto mostrato è quindi sottostimato/);
    assert.match(R.ESCLUSIONI[VETRO][0],/Premio speciale/);
    assert.doesNotMatch(R.ESCLUSIONI[VETRO][0],/RAL/);
    /* La cifra resta quella della tabella: 2.245,46 × 13 = 29.190,98,
       senza premio stimato dentro. */
    assert.equal(R.componiRal({ccnl:VETRO,sezione:'trasformazione',livello:'5',alla:OGGI}).ral,29190.98);
  });
});

test.describe('il gruppo 1 nel suo insieme',()=>{
  test('solo il Vetro ha una quota annua mancante: gli altri danno la RAL',()=>{
    const parziali=R.CONTRATTI.filter(c=>!R.componiRal({ccnl:c.id,
      sezione:R.sezioni(c.id)[0]?.id,livello:R.livelli(c.id,OGGI,R.sezioni(c.id)[0]?.id)[0].codice,alla:OGGI}).ralCompleta);
    assert.deepEqual(parziali.map(c=>c.id),[VETRO]);
    assert.equal(R.etichettaAnnua(FIPE),'RAL');
    assert.equal(R.avvisoRalParziale(FIPE),null);
  });

  test('quattordici codici CNEL distinti, dodici nuovi',()=>{
    assert.deepEqual(R.CONTRATTI.map(c=>c.codiceCnel),
      ['H011','C011','H05Y','H052','H04Z','I100','K511','H442','T151','H008','C018','G011','G041','B132']);
  });
});
