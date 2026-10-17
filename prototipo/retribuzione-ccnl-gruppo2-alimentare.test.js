const test=require('node:test');
const assert=require('node:assert/strict');

const R=require('./retribuzione-ccnl.js');
const C=require('./ccnl.js');
const P=require('./prove-ccnl.js');
const {provaDecorrenze,nettoRiconcilia,voci}=P;

/* Industria alimentare, CNEL E012 (RIC-61, gruppo 2). Ogni atteso è
   preso dal testo coordinato del CCNL 2023–2027 (verbale di stesura
   28 ottobre 2024, copia FAI CISL archiviata in processo/dati/fonti) e
   scritto qui a mano, con il conto per esteso nel commento: nessun
   atteso è calcolato dalla funzione sotto prova. Le pagine citate sono
   quelle stampate nel PDF. Data fissa, perché il dataset porta tranche
   future già firmate. */
const OGGI='2026-10-16';
const ALIMENTARE='alimentare-industria-e012';
const COMUNE='alimentare';
const OLEARIA='olearia-margariniera';

const DATE=['2023-12-01','2024-09-01','2025-01-01','2026-01-01','2027-01-01','2027-09-01'];

test.describe('Industria alimentare — E012',()=>{

  test('due sezioni con scale di livelli diverse, nell’ordine del contratto',()=>{
    assert.deepEqual(R.sezioni(ALIMENTARE).map(s=>s.id),[COMUNE,OLEARIA]);
    /* Art. 51 lett. A, p. 114: parametri 230/200/165/145/130/120/110/100
       su 1S, 1, 2, 3A, 3, 4, 5, 6. */
    assert.deepEqual(R.livelli(ALIMENTARE,OGGI,COMUNE).map(l=>l.codice),
      ['1S','1','2','3A','3','4','5','6']);
    /* Disposizioni specifiche olearia, art. 51, p. 276: dieci livelli. */
    assert.deepEqual(R.livelli(ALIMENTARE,OGGI,OLEARIA).map(l=>l.codice),
      ['1','2','3','4','5','6','7','8','9','10']);
  });

  test('parte comune: tabella dal 1° gennaio 2026, voci per livello e nessun totale pubblicato',()=>{
    /* Art. 51 lett. A p. 114 (minimo 3: 1.566,16), art. 52 p. 119
       (contingenza 3: 522,32; EDR 10,33), lett. D p. 117 (IAR 3: 85,41). */
    const terzo=R.trovaLivello(ALIMENTARE,'3',OGGI,COMUNE);
    assert.deepEqual(voci(terzo),[['minimo',1566.16],['contingenza',522.32],['iar',85.41],['edr',10.33]]);
    /* Il contratto non pubblica un totale mensile: derivato, mai inventato.
       1.566,16 + 522,32 + 85,41 + 10,33 = 2.184,22. */
    assert.equal(terzo.totalePubblicato,null);
    assert.equal(terzo.totale,2184.22);
    assert.equal(terzo.scatto,29.06);
    /* Estremi: 1S 2.770,85 e 6° 1.204,74. */
    assert.equal(R.trovaLivello(ALIMENTARE,'1S',OGGI,COMUNE).voci.find(v=>v.id==='minimo').importo,2770.85);
    assert.equal(R.trovaLivello(ALIMENTARE,'6',OGGI,COMUNE).voci.find(v=>v.id==='minimo').importo,1204.74);
  });

  test('le voci con incidenza diversa: l’EDR vale 13 mensilità, le altre 14',()=>{
    /* Art. 52: l’EDR di 10,33 € è «per 13 mensilità». Art. 54: la 13ª e la
       14ª comprendono minimo, contingenza e scatti; l’IAR (art. 51 lett. D)
       «incide esclusivamente su 13ª, 14ª e T.F.R.». */
    for(const sezione of [COMUNE,OLEARIA]){
      const livello=R.livelli(ALIMENTARE,OGGI,sezione)[2];
      const edr=livello.voci.find(v=>v.id==='edr');
      assert.equal(edr.importo,10.33);
      assert.equal(edr.mensilita,13);
      for(const id of ['minimo','contingenza','iar'])
        assert.equal(livello.voci.find(v=>v.id===id).mensilita??14,14,id);
    }
    assert.equal(R.mensilitaAlla(ALIMENTARE,OGGI,COMUNE),14);
    assert.equal(R.mensilitaAlla(ALIMENTARE,OGGI,OLEARIA),14);
  });

  test('1S: l’indennità di funzione dei quadri è nel livello, su 14 mensilità per assunzione',()=>{
    /* Art. 23: 100,00 € mensili, non riassorbibili. Il testo non dice su
       quante mensilità: l’assunzione (14, come la retribuzione di fatto
       dell’art. 54) è dichiarata fra le esclusioni. Solo la 1S la porta. */
    const quadro=R.trovaLivello(ALIMENTARE,'1S',OGGI,COMUNE);
    assert.deepEqual(voci(quadro),[['minimo',2770.85],['contingenza',545.72],['iar',151.11],
      ['indennitaFunzione',100],['edr',10.33]]);
    assert.ok(R.livelli(ALIMENTARE,OGGI,COMUNE).slice(1).every(l=>!l.voci.some(v=>v.id==='indennitaFunzione')));
    assert.ok(R.ESCLUSIONI[ALIMENTARE].some(e=>/art\. 23/.test(e)&&/14 mensilità/.test(e)&&/assunzione/.test(e)));
  });

  test('olearia e margariniera: scala propria, contingenza propria, IAR proprio',()=>{
    /* Art. 51 olearia p. 276, 1/1/2026, livello 1: 2.519,00 + 94,35 = 2.613,35;
       livello 10: 1.159,99 + 43,48 = 1.203,47. Contingenza (art. 52, p. 119):
       535,00 e 513,13. IAR (p. 277, dal 1/12/2023): 141,53 e 65,21. */
    const primo=R.trovaLivello(ALIMENTARE,'1',OGGI,OLEARIA);
    assert.deepEqual(voci(primo),[['minimo',2613.35],['contingenza',535],['iar',141.53],['edr',10.33]]);
    assert.equal(primo.scatto,32.12);
    const ultimo=R.trovaLivello(ALIMENTARE,'10',OGGI,OLEARIA);
    assert.deepEqual(voci(ultimo),[['minimo',1203.47],['contingenza',513.13],['iar',65.21],['edr',10.33]]);
    assert.equal(ultimo.scatto,15.68);
    assert.equal(primo.totalePubblicato,null);
    /* Livello 5, 1/1/2026: 1.770,36 + 521,62 + 95,87 + 10,33 = 2.398,18. */
    assert.equal(R.trovaLivello(ALIMENTARE,'5',OGGI,OLEARIA).totale,2398.18);
  });

  test('le sei tabelle di ogni sezione, con la tabella in più del 1° settembre 2027',()=>{
    provaDecorrenze(ALIMENTARE,COMUNE,DATE);
    provaDecorrenze(ALIMENTARE,OLEARIA,DATE);
    /* Art. 51 lett. A e D: i minimi della tabella 1/1/2027 restano invariati
       al 1/9/2027, quando sale solo l’IAR (+11 € sul parametro 138, tabella
       p. 117: livello 3, 85,41 → 95,85; olearia livello 1, 141,53 → 158,83). */
    const prima=R.trovaLivello(ALIMENTARE,'3','2027-08-31',COMUNE);
    const dopo=R.trovaLivello(ALIMENTARE,'3','2027-09-01',COMUNE);
    assert.equal(prima.voci.find(v=>v.id==='minimo').importo,1603.17);
    assert.equal(dopo.voci.find(v=>v.id==='minimo').importo,1603.17);
    assert.equal(prima.voci.find(v=>v.id==='iar').importo,85.41);
    assert.equal(dopo.voci.find(v=>v.id==='iar').importo,95.85);
    assert.equal(R.trovaLivello(ALIMENTARE,'1','2027-08-31',OLEARIA).voci.find(v=>v.id==='iar').importo,141.53);
    assert.equal(R.trovaLivello(ALIMENTARE,'1','2027-09-01',OLEARIA).voci.find(v=>v.id==='iar').importo,158.83);
    /* Prima tranche, livello 3: 1.419,08 al 1/12/2023, 1.452,29 al 1/9/2024,
       1.509,22 al 1/1/2025. */
    for(const [alla,minimo] of [['2023-12-01',1419.08],['2024-09-01',1452.29],['2025-01-01',1509.22]])
      assert.equal(R.trovaLivello(ALIMENTARE,'3',alla,COMUNE).voci.find(v=>v.id==='minimo').importo,minimo,alla);
    /* L’IAR di 85,41 vale già dal 1/12/2023 (tabella p. 117). */
    assert.equal(R.trovaLivello(ALIMENTARE,'3','2023-12-01',COMUNE).voci.find(v=>v.id==='iar').importo,85.41);
  });

  test('riscontri indipendenti sulle tabelle',()=>{
    /* leggeinchiaro.it, tabella al 1/1/2026: livello 1 minimo 2.409,40,
       contingenza 538,70, EDR 10,33 (TEM 2.958,43), IAR 131,39; livello 6
       minimo 1.204,74, IAR 65,70, scatto 22,35. */
    const uno=R.trovaLivello(ALIMENTARE,'1','2026-01-01',COMUNE);
    assert.deepEqual(voci(uno),[['minimo',2409.4],['contingenza',538.7],['iar',131.39],['edr',10.33]]);
    assert.equal(Math.round((2409.4+538.7+10.33)*100),295843);
    const sesto=R.trovaLivello(ALIMENTARE,'6','2026-01-01',COMUNE);
    assert.equal(sesto.voci.find(v=>v.id==='iar').importo,65.7);
    assert.equal(sesto.scatto,22.35);
    /* news.ilccnl.it, 1/9/2024, livello 1S: 2.569,39 + 545,72 + 10,33. */
    const quadro=R.trovaLivello(ALIMENTARE,'1S','2024-09-01',COMUNE);
    assert.equal(quadro.voci.find(v=>v.id==='minimo').importo,2569.39);
    /* ilccnl.it, olearia livello 1: 2.613,35, contingenza 535,00, scatto 32,12. */
    assert.equal(R.trovaLivello(ALIMENTARE,'1','2026-01-01',OLEARIA).scatto,32.12);
  });

  test('scatti: cifra fissa biennale, massimo 5, importo per livello, uguale in ogni tranche',()=>{
    /* Art. 53: un aumento ogni biennio, massimo 5, dal mese successivo;
       importi consolidati dal 1998, «non soggetti più ad alcun ricalcolo».
       Livello 3: 29,06 €, su 14 mensilità (art. 54). */
    P.provaScattiFissi({ccnl:ALIMENTARE,sezione:COMUNE,livello:'3',cadenza:2,massimo:5,
      importo:29.06,mensilita:14,alla:OGGI});
    /* Olearia, art. 53 delle Disposizioni specifiche: livello 5, 21,96 €. */
    P.provaScattiFissi({ccnl:ALIMENTARE,sezione:OLEARIA,livello:'5',cadenza:2,massimo:5,
      importo:21.96,mensilita:14,alla:OGGI});
    const comune=[['1S',51.42],['1',44.71],['2',36.89],['3A',32.42],['3',29.06],['4',26.83],['5',24.59],['6',22.35]];
    for(const data of DATE)
      for(const [codice,scatto] of comune)
        assert.equal(R.trovaLivello(ALIMENTARE,codice,data,COMUNE).scatto,scatto,`${codice} ${data}`);
    const olearia=[['1',32.12],['2',29.81],['3',26.64],['4',22.72],['5',21.96],['6',21.15],
      ['7',19.18],['8',18.8],['9',18.05],['10',15.68]];
    for(const data of DATE)
      for(const [codice,scatto] of olearia)
        assert.equal(R.trovaLivello(ALIMENTARE,codice,data,OLEARIA).scatto,scatto,`${codice} ${data}`);
  });

  test('livello 3, tabella 2026, nessuno scatto: l’EDR su 13 e il resto su 14',()=>{
    /* Mensile su 14: 1.566,16 + 522,32 + 85,41 = 2.173,89; × 14 = 30.434,46.
       EDR: 10,33 × 13 = 134,29. RAL = 30.568,75. */
    const r=R.componiRal({ccnl:ALIMENTARE,sezione:COMUNE,livello:'3',alla:OGGI});
    assert.equal(r.decorrenza,'2026-01-01');
    /* baseMensile somma anche l’EDR: 2.173,89 + 10,33 = 2.184,22. */
    assert.equal(r.baseMensile,2184.22);
    assert.equal(r.ral,30568.75);
    assert.equal(r.identitaSemplice,false);
    assert.deepEqual(r.quote.map(q=>[q.id,q.mensile,q.mensilita,q.annuo]).slice(0,2),
      [['base',2173.89,14,30434.46],['edr',10.33,13,134.29]]);
    assert.equal(r.ralCompleta,true);
    nettoRiconcilia(r);
  });

  test('livello 6, cinque scatti',()=>{
    /* 1.204,74 + 515,31 + 65,70 = 1.785,75; scatti 5 × 22,35 = 111,75;
       mensile su 14 = 1.897,50; × 14 = 26.565,00; + EDR 134,29 = 26.699,29. */
    const r=R.componiRal({ccnl:ALIMENTARE,sezione:COMUNE,livello:'6',scatti:5,alla:OGGI});
    assert.equal(r.scattiMensili,111.75);
    assert.equal(r.mensileTotale,1897.5+10.33);
    assert.equal(r.ral,26699.29);
    assert.equal(r.scattiAlTetto,true);
    nettoRiconcilia(r);
  });

  test('1S quadri, due scatti, con l’indennità di funzione',()=>{
    /* 2.770,85 + 545,72 + 151,11 + 100,00 = 3.567,68; scatti 2 × 51,42 = 102,84;
       su 14 = 3.670,52; × 14 = 51.387,28; + EDR 134,29 = 51.521,57. */
    const r=R.componiRal({ccnl:ALIMENTARE,sezione:COMUNE,livello:'1S',scatti:2,alla:OGGI});
    assert.equal(r.ral,51521.57);
    nettoRiconcilia(r);
  });

  test('tabelle future già firmate: gennaio 2027 e settembre 2027',()=>{
    /* 1/1/2027, livello 3, un scatto: 1.603,17 + 522,32 + 85,41 + 29,06 = 2.239,96;
       × 14 = 31.359,44; + 134,29 = 31.493,73. */
    assert.equal(R.componiRal({ccnl:ALIMENTARE,sezione:COMUNE,livello:'3',scatti:1,alla:'2027-01-01'}).ral,31493.73);
    /* 1/9/2027, livello 3 (IAR 95,85): 1.603,17 + 522,32 + 95,85 = 2.221,34;
       × 14 = 31.098,76; + 134,29 = 31.233,05. */
    assert.equal(R.componiRal({ccnl:ALIMENTARE,sezione:COMUNE,livello:'3',alla:'2027-09-01'}).ral,31233.05);
    /* Il giorno prima, IAR ancora 85,41: 2.210,90 × 14 = 30.952,60 + 134,29 = 31.086,89. */
    assert.equal(R.componiRal({ccnl:ALIMENTARE,sezione:COMUNE,livello:'3',alla:'2027-08-31'}).ral,31086.89);
  });

  test('part-time 30 ore su 40: ogni voce riproporzionata, l’EDR compreso',()=>{
    /* Art. 20: proporzione fra orario ridotto e orario pieno (30/40 = 3/4).
       Livello 4, 2026, un scatto. Base: 1.445,65 + 519,99 + 78,84 = 2.044,48;
       × 3/4 = 1.533,36. Scatto: 26,83 × 3/4 = 20,1225 → 20,12. Mensile su 14 =
       1.553,48; × 14 = 21.748,72. EDR: 10,33 × 3/4 = 7,7475 → 7,75; × 13 = 100,75.
       RAL = 21.849,47. */
    const r=R.componiRal({ccnl:ALIMENTARE,sezione:COMUNE,livello:'4',scatti:1,oreSettimanali:30,alla:OGGI});
    assert.equal(r.partTime,true);
    assert.equal(r.oreContrattuali,40);
    assert.equal(r.ral,21849.47);
    nettoRiconcilia(r);
  });

  test('superminimo: dichiarato su 14, non riproporzionato nel part-time',()=>{
    /* Livello 2, 2026, superminimo 150: 1.987,80 + 530,51 + 108,40 = 2.626,71;
       + 150 = 2.776,71; × 14 = 38.873,94; + EDR 134,29 = 39.008,23. */
    assert.equal(R.componiRal({ccnl:ALIMENTARE,sezione:COMUNE,livello:'2',superminimoMensile:150,alla:OGGI}).ral,39008.23);
    /* Livello 4 part-time 30 ore, un scatto, superminimo 100: 1.553,48 + 100
       = 1.653,48; × 14 = 23.148,72; + 100,75 = 23.249,47. */
    const r=R.componiRal({ccnl:ALIMENTARE,sezione:COMUNE,livello:'4',scatti:1,oreSettimanali:30,
      superminimoMensile:100,alla:OGGI});
    assert.equal(r.superminimoMensile,100);
    assert.equal(r.ral,23249.47);
    nettoRiconcilia(r);
  });

  test('olearia, livello 5, tabella 2026, nessuno scatto',()=>{
    /* 1.770,36 + 521,62 + 95,87 = 2.387,85; × 14 = 33.429,90; EDR 134,29;
       RAL = 33.564,19 (azienda oltre 40 dipendenti: 14 mensilità intere). */
    const r=R.componiRal({ccnl:ALIMENTARE,sezione:OLEARIA,livello:'5',alla:OGGI});
    assert.equal(r.ral,33564.19);
    assert.equal(r.mensilita,14);
    nettoRiconcilia(r);
  });

  test('olearia, livello 10, tabella 2027, tre scatti',()=>{
    /* 1.231,73 + 513,13 + 65,21 = 1.810,07; scatti 3 × 15,68 = 47,04;
       su 14 = 1.857,11; × 14 = 25.999,54; + 134,29 = 26.133,83. */
    const r=R.componiRal({ccnl:ALIMENTARE,sezione:OLEARIA,livello:'10',scatti:3,alla:'2027-01-01'});
    assert.equal(r.ral,26133.83);
    nettoRiconcilia(r);
  });

  test('olearia, livello 3, part-time 30 ore, tabella 2025',()=>{
    /* 2.112,56 + 528,65 + 118,70 = 2.759,91; × 3/4 = 2.069,9325 → 2.069,93;
       × 14 = 28.979,02. EDR: 7,75 × 13 = 100,75. RAL = 29.079,77. */
    const r=R.componiRal({ccnl:ALIMENTARE,sezione:OLEARIA,livello:'3',oreSettimanali:30,alla:'2025-06-01'});
    assert.equal(r.decorrenza,'2025-01-01');
    assert.equal(r.ral,29079.77);
    nettoRiconcilia(r);
  });

  test('olearia: i quadri nei livelli 1 e 2 hanno l’elemento aggiuntivo come profilo',()=>{
    /* Art. 51 olearia p. 276: 142 € mensili ai quadri del livello 1, 122,50 € al 2.
       Livello 1, 2026, quadro: 2.613,35 + 535,00 + 141,53 + 142,00 = 3.431,88;
       × 14 = 48.046,32; + EDR 134,29 = 48.180,61. */
    assert.deepEqual(R.trovaLivello(ALIMENTARE,'1',OGGI,OLEARIA).profili.map(p=>[p.id,p.voce.importo]),
      [['quadro',142]]);
    assert.deepEqual(R.trovaLivello(ALIMENTARE,'2',OGGI,OLEARIA).profili.map(p=>[p.id,p.voce.importo]),
      [['quadro',122.5]]);
    const quadro=R.componiRal({ccnl:ALIMENTARE,sezione:OLEARIA,livello:'1',profilo:'quadro',alla:OGGI});
    assert.equal(quadro.profilo,'quadro');
    assert.equal(quadro.ral,48180.61);
    /* Senza profilo il livello 1 è l’impiegato: 3.289,88 × 14 = 46.058,32 + 134,29 = 46.192,61. */
    assert.equal(R.componiRal({ccnl:ALIMENTARE,sezione:OLEARIA,livello:'1',alla:OGGI}).ral,46192.61);
    /* Livello 2 quadro, 1/9/2027, un scatto: 2.490,42 + 532,82 + 147,84 + 122,50 = 3.293,58;
       + 29,81 = 3.323,39; × 14 = 46.527,46; + 134,29 = 46.661,75. */
    assert.equal(R.componiRal({ccnl:ALIMENTARE,sezione:OLEARIA,livello:'2',profilo:'quadro',scatti:1,
      alla:'2027-09-01'}).ral,46661.75);
    nettoRiconcilia(quadro);
    /* Dove il contratto non prevede il profilo, il calcolo si ferma. */
    assert.throws(()=>R.componiRal({ccnl:ALIMENTARE,sezione:OLEARIA,livello:'3',profilo:'quadro',alla:OGGI}),RangeError);
    assert.throws(()=>R.componiRal({ccnl:ALIMENTARE,sezione:COMUNE,livello:'1',profilo:'quadro',alla:OGGI}),RangeError);
  });

  test('livelli e sezioni inesistenti fanno fermare il calcolo',()=>{
    assert.throws(()=>R.componiRal({ccnl:ALIMENTARE,sezione:COMUNE,livello:'7',alla:OGGI}),RangeError);
    assert.throws(()=>R.componiRal({ccnl:ALIMENTARE,sezione:OLEARIA,livello:'1S',alla:OGGI}),RangeError);
    assert.throws(()=>R.componiRal({ccnl:ALIMENTARE,livello:'3',alla:OGGI}),RangeError);
  });

  test('il catalogo propone 14 mensilità e il contratto è identificato come E012',()=>{
    assert.equal(C.suggerisciMensilita(ALIMENTARE,12),14);
    assert.equal(C.trovaCcnl(ALIMENTARE).codiceCnel,'E012');
    assert.equal(C.trovaCcnl(ALIMENTARE).mensilita,R.mensilitaAlla(ALIMENTARE,OGGI,COMUNE));
    assert.equal(R.trovaContratto(ALIMENTARE).codiceCnel,'E012');
    assert.equal(R.ralCompleta(ALIMENTARE),true);
    assert.equal(R.etichettaAnnua(ALIMENTARE),'RAL');
  });

  test('esclusioni: gli articoli e le voci lasciate fuori dalla RAL',()=>{
    const testo=R.ESCLUSIONI[ALIMENTARE].join('\n');
    for(const attesa of [/art\. 51 bis/,/premio per obiettivi/i,/FASA/,/campagna/,/saccarifero/,
      /superminim/,/viaggiatori/i,/art\. 23/])
      assert.match(testo,attesa);
    /* La riduzione della 14ª olearia sotto i 40 dipendenti sta nella sezione. */
    const olearia=R.componiRal({ccnl:ALIMENTARE,sezione:OLEARIA,livello:'3',alla:OGGI}).esclusioni;
    assert.ok(olearia.some(e=>/art\. 54/.test(e)&&/35%/.test(e)&&/50%/.test(e)&&/40 dipendenti/.test(e)));
    const comune=R.componiRal({ccnl:ALIMENTARE,sezione:COMUNE,livello:'3',alla:OGGI}).esclusioni;
    assert.ok(!comune.some(e=>/35%/.test(e)));
    assert.match(R.sezioni(ALIMENTARE).find(s=>s.id===OLEARIA).descrizione,/oltre 40 dipendenti/);
  });

  test('ogni riga riconcilia: totale derivato = somma delle voci, nessun totale pubblicato',()=>{
    for(const s of R.sezioni(ALIMENTARE))
      for(const t of s.tabelle)
        for(const l of t.livelli){
          const r=R.riconciliaLivello(l);
          assert.equal(r.verificata,true,`${s.id} ${t.decorrenza} ${l.codice}`);
          assert.equal(r.tipo,'derivato');
        }
  });
});
