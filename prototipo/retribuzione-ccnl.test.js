const test=require('node:test');
const assert=require('node:assert/strict');

const R=require('./retribuzione-ccnl.js');
const {calcola,applicaMensilita}=require('./motore.js');
const {CCNL}=require('./ccnl.js');

const TERZIARIO='terziario-confcommercio-h011';
const METAL='metalmeccanica-industria-c011';

/* Ogni coppia contratto × sezione del dataset: dove il contratto non
   ha sezioni, una sola coppia con sezione null. */
const coppie=()=>R.CONTRATTI.flatMap(c=>c.sezioni
  ?c.sezioni.map(s=>({contratto:c,sezione:s.id,tabelle:s.tabelle}))
  :[{contratto:c,sezione:null,tabelle:c.tabelle}]);
/* Le tabelle future sono già nel dataset: senza una data fissa le
   prove cambierebbero risultato al passaggio della prossima tranche. */
const OGGI='2026-09-07';

test.describe('dataset retributivo — le tabelle come le pubblica il contratto',()=>{

  /* A — CORRETTEZZA. La riga trascritta a mano dalla fonte firmataria.
     Terziario, 1° novembre 2025, 4° livello:
     paga base 1.257,46 + contingenza 524,22 + terzo elemento nazionale 2,07
     = 1.783,75, che è il totale che la tabella stampa. */
  test('il 4° livello Terziario riporta le voci e il totale pubblicati',()=>{
    const livello=R.trovaLivello(TERZIARIO,'4',OGGI);
    assert.deepEqual(livello.voci.map(v=>[v.id,v.importo]),[
      ['pagaBase',1257.46],['contingenza',524.22],['terzoElemento',2.07]]);
    assert.equal(livello.totale,1783.75);
    assert.equal(livello.scatto,20.66);
    assert.equal(R.tabellaVigente(TERZIARIO,OGGI).decorrenza,'2025-11-01');
  });

  /* Le due voci che si somigliano e non sono la stessa cosa. */
  test('l’indennità di funzione è del Quadro, l’elemento aggiuntivo è del 7°',()=>{
    const quadro=R.trovaLivello(TERZIARIO,'Q',OGGI);
    const settimo=R.trovaLivello(TERZIARIO,'7',OGGI);
    assert.equal(quadro.voci.find(v=>v.id==='indennitaFunzione').importo,260.76);
    assert.equal(quadro.voci.find(v=>v.id==='elementoAggiuntivo'),undefined);
    assert.equal(settimo.voci.find(v=>v.id==='elementoAggiuntivo').importo,5.16);
    assert.equal(settimo.voci.find(v=>v.id==='indennitaFunzione'),undefined);
    for(const codice of ['1','2','3','4','5','6','OV1','OV2']){
      const livello=R.trovaLivello(TERZIARIO,codice,OGGI);
      assert.equal(livello.voci.find(v=>v.id==='indennitaFunzione'),undefined,codice);
      assert.equal(livello.voci.find(v=>v.id==='elementoAggiuntivo'),undefined,codice);
    }
  });

  test('il Terziario ha dieci livelli, non otto: ci sono gli operatori di vendita',()=>{
    assert.deepEqual(R.livelli(TERZIARIO,OGGI).map(l=>l.codice),
      ['Q','1','2','3','4','5','6','7','OV1','OV2']);
    assert.equal(R.trovaLivello(TERZIARIO,'OV1',OGGI).totale,1717.04);
    assert.equal(R.trovaLivello(TERZIARIO,'OV2',OGGI).totale,1521.07);
    /* Gli operatori di vendita hanno scatti propri, più bassi di
       ogni livello ordinario, e nessun terzo elemento. */
    assert.equal(R.trovaLivello(TERZIARIO,'OV1',OGGI).scatto,15.50);
    assert.equal(R.trovaLivello(TERZIARIO,'OV2',OGGI).scatto,14.46);
    assert.equal(R.trovaLivello(TERZIARIO,'OV1',OGGI)
      .voci.find(v=>v.id==='terzoElemento'),undefined);
  });

  test('la Metalmeccanica pubblica un importo unico, con la vecchia categoria accanto',()=>{
    assert.deepEqual(R.livelli(METAL,OGGI).map(l=>l.codice),
      ['D1','D2','C1','C2','C3','B1','B2','B3','A1']);
    const c3=R.trovaLivello(METAL,'C3',OGGI);
    assert.deepEqual(c3.voci.map(v=>[v.id,v.importo]),[['minimo',2211.43]]);
    assert.equal(c3.totale,2211.43);
    assert.equal(c3.exCategoria,'5');
    assert.equal(c3.scatto,29.64);
    assert.equal(R.tabellaVigente(METAL,OGGI).decorrenza,'2026-06-01');
    /* D1 e A1 sono gli estremi della tabella: se un refuso sposta
       una riga si vede qui prima che altrove. */
    assert.equal(R.trovaLivello(METAL,'D1',OGGI).totale,1784.94);
    assert.equal(R.trovaLivello(METAL,'A1',OGGI).totale,2907.01);
    assert.equal(R.trovaLivello(METAL,'A1',OGGI).scatto,40.96);
  });

  /* La guardia sulla trascrizione: somma delle voci = totale pubblicato,
     su ogni livello di ogni decorrenza, futura compresa. */
  test('in ogni tabella le voci riconciliano con il totale pubblicato',()=>{
    for(const {contratto,sezione,tabelle} of coppie())
      for(const tabella of tabelle)
        for(const livello of tabella.livelli){
          const conti=R.riconciliaLivello(livello);
          assert.ok(conti.verificata,
            `${contratto.id} ${sezione||''} ${tabella.decorrenza} ${livello.codice}: `+
            `voci ${conti.somma} contro totale ${conti.totale}, pubblicato ${conti.totalePubblicato}`);
        }
    /* I due contratti originari pubblicano il totale su ogni riga,
       e la somma delle voci lo ritrova al centesimo senza scarti. */
    for(const [id,righe] of [[TERZIARIO,30],[METAL,9]]){
      const tutte=R.trovaContratto(id).tabelle.flatMap(t=>t.livelli);
      assert.equal(tutte.length,righe,id);
      for(const livello of tutte){
        const conti=R.riconciliaLivello(livello);
        assert.equal(conti.tipo,'pubblicato',`${id} ${livello.codice}`);
        assert.equal(conti.scartoFonte,0,`${id} ${livello.codice}`);
      }
    }
  });

  test('ogni riga porta fonte, decorrenza e data di verifica',()=>{
    for(const contratto of R.CONTRATTI){
      assert.match(contratto.fonte.url,/^https:\/\//);
      assert.match(contratto.fonte.verificataIl,/^\d{4}-\d{2}-\d{2}$/);
      assert.ok(contratto.fonte.parte,contratto.id);
      assert.ok(R.ESCLUSIONI[contratto.id].length>0,contratto.id);
    }
    for(const {contratto,sezione,tabelle} of coppie())
      for(const tabella of tabelle){
        assert.match(tabella.decorrenza,/^\d{4}-\d{2}-\d{2}$/,`${contratto.id} ${sezione}`);
        assert.ok(tabella.titolo,`${contratto.id} ${sezione}`);
      }
    assert.equal(R.VERSIONE_DATASET,'2026-09-22');
  });

  test('mensilità e orario contrattuale restano allineati al catalogo CCNL',()=>{
    for(const {contratto,sezione} of coppie()){
      const catalogo=CCNL.find(c=>c.id===contratto.id);
      assert.ok(catalogo,`${contratto.id} manca in ccnl.js`);
      /* Il catalogo porta le mensilità vigenti: dove dipendono dalla
         data, quelle in vigore al giorno fisso delle prove. */
      assert.equal(R.mensilitaAlla(contratto.id,OGGI,sezione),catalogo.mensilita,contratto.id);
    }
    /* L'orario non è 40 per tutti: qui solo i due contratti originari. */
    assert.equal(R.oreContrattuali(TERZIARIO),40);
    assert.equal(R.oreContrattuali(METAL),40);
    /* Funzioni Centrali resta nel catalogo delle mensilità e fuori
       dal generatore: il motore applica aliquote del privato. */
    assert.ok(CCNL.some(c=>c.id==='funzioni-centrali'));
    assert.equal(R.trovaContratto('funzioni-centrali'),null);
  });

  test('il catalogo non è modificabile dai consumatori',()=>{
    assert.ok(Object.isFrozen(R.CONTRATTI));
    const terziario=R.trovaContratto(TERZIARIO);
    assert.ok(Object.isFrozen(terziario));
    assert.ok(Object.isFrozen(terziario.tabelle));
    assert.ok(Object.isFrozen(R.trovaLivello(TERZIARIO,'4',OGGI)));
    assert.ok(Object.isFrozen(R.trovaLivello(TERZIARIO,'4',OGGI).voci));
  });
});

test.describe('decorrenze — la tabella vigente e quella che verrà',()=>{

  test('le tre tranche del Terziario si succedono alle date giuste',()=>{
    assert.equal(R.tabellaVigente(TERZIARIO,'2026-10-31').decorrenza,'2025-11-01');
    assert.equal(R.tabellaVigente(TERZIARIO,'2026-11-01').decorrenza,'2026-11-01');
    assert.equal(R.tabellaVigente(TERZIARIO,'2027-01-31').decorrenza,'2026-11-01');
    assert.equal(R.tabellaVigente(TERZIARIO,'2027-02-01').decorrenza,'2027-02-01');
    /* Prima della prima decorrenza del dataset non si inventa una
       tabella: si dichiara che non c'è. */
    assert.throws(()=>R.tabellaVigente(TERZIARIO,'2025-10-31'),RangeError);
  });

  test('la tranche successiva è nota e i suoi importi crescono',()=>{
    const prossima=R.prossimaTabella(TERZIARIO,OGGI);
    assert.equal(prossima.decorrenza,'2026-11-01');
    assert.equal(prossima.livelli.find(l=>l.codice==='4').totale,1818.75);
    assert.equal(R.trovaLivello(TERZIARIO,'4','2027-02-01').totale,1858.75);
    /* La Metalmeccanica ha una sola decorrenza pubblicata: la
       prossima si adegua per indice IPCA-NEI e non è ancora firmata. */
    assert.equal(R.prossimaTabella(METAL,OGGI),null);
  });

  test('gli scatti del Terziario non si muovono con le tranche',()=>{
    for(const data of [OGGI,'2026-11-01','2027-02-01'])
      assert.equal(R.trovaLivello(TERZIARIO,'4',data).scatto,20.66,data);
  });
});

test.describe('scatti di anzianità — maturazione e tetto',()=>{

  /* B — COMPORTAMENTO AI LIMITI. Le due cadenze e i due tetti,
     presi esattamente sui confini. */
  test('il Terziario matura uno scatto ogni tre anni, dal mese successivo, fino a dieci',()=>{
    assert.equal(R.scattiMaturati(TERZIARIO,'2023-09-07',OGGI),0);
    assert.equal(R.scattiMaturati(TERZIARIO,'2023-09-01','2026-09-30'),0);
    assert.equal(R.scattiMaturati(TERZIARIO,'2023-09-01','2026-10-01'),1);
    assert.equal(R.scattiMaturati(TERZIARIO,'2020-08-01',OGGI),2);
    assert.equal(R.scattiMaturati(TERZIARIO,'1996-08-01',OGGI),10); // tetto esatto
    assert.equal(R.scattiMaturati(TERZIARIO,'1980-01-01',OGGI),10); // oltre il tetto
  });

  test('la Metalmeccanica matura uno scatto ogni due anni, dal mese successivo, fino a cinque',()=>{
    assert.equal(R.scattiMaturati(METAL,'2024-09-07',OGGI),0);
    assert.equal(R.scattiMaturati(METAL,'2024-08-01',OGGI),1);
    assert.equal(R.scattiMaturati(METAL,'2016-08-01',OGGI),5); // tetto esatto
    assert.equal(R.scattiMaturati(METAL,'1980-01-01',OGGI),5);
  });

  test('l’anzianità richiede una data reale non futura',()=>{
    assert.throws(()=>R.scattiMaturati(TERZIARIO,'2026-02-30',OGGI),RangeError);
    assert.throws(()=>R.scattiMaturati(TERZIARIO,'2026-10-01',OGGI),RangeError);
    assert.throws(()=>R.scattiMaturati(TERZIARIO,'molti'),RangeError);
    assert.throws(()=>R.scattiMaturati('inesistente','2020-01-01',OGGI),RangeError);
  });

  test('anzianità non dichiarata significa zero scatti, e il risultato lo dice',()=>{
    const senza=R.componiRal({ccnl:TERZIARIO,livello:'4',alla:OGGI});
    assert.equal(senza.numeroScatti,0);
    assert.equal(senza.scattiMensili,0);
    assert.equal(senza.anzianitaDichiarata,false);
    assert.equal(senza.scattiOverride,false);
    const con=R.componiRal({ccnl:TERZIARIO,livello:'4',dataAnzianita:'2026-09-07',alla:OGGI});
    assert.equal(con.anzianitaDichiarata,true);
    assert.equal(con.numeroScatti,0);
  });

  test('il numero di scatti dichiarato prevale sull’anzianità stimata',()=>{
    const stimati=R.componiRal({ccnl:METAL,livello:'C3',dataAnzianita:'2022-07-01',alla:OGGI});
    assert.equal(stimati.numeroScatti,2);
    const dichiarati=R.componiRal({ccnl:METAL,livello:'C3',dataAnzianita:'2022-07-01',
      scatti:5,alla:OGGI});
    assert.equal(dichiarati.numeroScatti,5);
    assert.equal(dichiarati.scattiOverride,true);
    assert.equal(dichiarati.scattiAlTetto,true);
    /* Sopra il tetto contrattuale non si passa, nemmeno dichiarandolo. */
    assert.throws(()=>R.componiRal({ccnl:METAL,livello:'C3',scatti:6,alla:OGGI}),RangeError);
    assert.throws(()=>R.componiRal({ccnl:TERZIARIO,livello:'4',scatti:11,alla:OGGI}),RangeError);
    assert.throws(()=>R.componiRal({ccnl:METAL,livello:'C3',scatti:-1,alla:OGGI}),RangeError);
  });
});

test.describe('composizione della RAL — l’identità del prodotto',()=>{

  /* A — CORRETTEZZA, derivata a mano.
     Terziario 4° livello, 1° novembre 2025, tempo pieno, nessuno scatto:
     1.783,75 × 14 mensilità = 24.972,50 €. */
  test('senza scatti e senza superminimo la RAL è il totale per le mensilità',()=>{
    const r=R.componiRal({ccnl:TERZIARIO,livello:'4',alla:OGGI});
    assert.equal(r.baseMensile,1783.75);
    assert.equal(r.mensileTotale,1783.75);
    assert.equal(r.ral,24972.50);
    assert.equal(r.mensilita,14);
    assert.equal(r.decorrenza,'2025-11-01');
    assert.equal(r.partTime,false);
  });

  /* Metalmeccanica C3, 1° giugno 2026, 13 mensilità:
     2.211,43 × 13 = 28.748,59 €. */
  test('la Metalmeccanica su tredici mensilità',()=>{
    const r=R.componiRal({ccnl:METAL,livello:'C3',alla:OGGI});
    assert.equal(r.mensileTotale,2211.43);
    assert.equal(r.ral,28748.59);
    assert.equal(r.mensilita,13);
  });

  /* Gli scatti sono una voce distinta dal minimo e dal superminimo.
     Terziario 4°, 9 anni in azienda → 3 scatti da 20,66 = 61,98.
     (1.783,75 + 61,98) × 14 = 25.840,22 €. */
  test('gli scatti entrano come voce propria, non dentro il minimo',()=>{
    const r=R.componiRal({ccnl:TERZIARIO,livello:'4',dataAnzianita:'2017-08-01',alla:OGGI});
    assert.equal(r.numeroScatti,3);
    assert.equal(r.valoreScatto,20.66);
    assert.equal(r.scattiMensili,61.98);
    assert.equal(r.baseMensile,1783.75);         // il minimo non si muove
    assert.equal(r.mensileTotale,1845.73);
    assert.equal(r.ral,25840.22);
  });

  /* Il superminimo è mensile e si annualizza sulle mensilità contrattuali,
     una volta sola. Terziario 4°, 3 scatti, superminimo 200 €:
     (1.783,75 + 61,98 + 200) × 14 = 28.640,22 €. */
  test('il superminimo si annualizza sulle mensilità contrattuali',()=>{
    const r=R.componiRal({ccnl:TERZIARIO,livello:'4',dataAnzianita:'2017-08-01',
      superminimoMensile:200,alla:OGGI});
    assert.equal(r.superminimoMensile,200);
    assert.equal(r.mensileTotale,2045.73);
    assert.equal(r.ral,28640.22);
    /* Default zero, e un superminimo negativo non è un dato. */
    assert.equal(R.componiRal({ccnl:TERZIARIO,livello:'4',alla:OGGI}).superminimoMensile,0);
    assert.throws(()=>R.componiRal({ccnl:TERZIARIO,livello:'4',
      superminimoMensile:-1,alla:OGGI}),RangeError);
  });

  test('l’identità RAL = (base + scatti + superminimo) × mensilità tiene su ogni livello',()=>{
    /* Solo dove tutte le voci entrano in tutte le mensilità: i due
       contratti originari. Gli altri la verificano, o la smentiscono
       per una ragione dichiarata, nelle loro fixture. */
    for(const contratto of [R.trovaContratto(TERZIARIO),R.trovaContratto(METAL)])
      for(const livello of R.livelli(contratto.id,OGGI)){
        const r=R.componiRal({ccnl:contratto.id,livello:livello.codice,
          dataAnzianita:'2013-08-01',superminimoMensile:150,alla:OGGI});
        assert.equal(Math.round(r.ral*100),
          Math.round((r.baseMensile+r.scattiMensili+r.superminimoMensile)*100)
          *contratto.mensilita,`${contratto.id} ${livello.codice}`);
        assert.equal(Math.round(r.mensileTotale*100),
          Math.round(r.baseMensile*100)+Math.round(r.scattiMensili*100)
          +Math.round(r.superminimoMensile*100),`${contratto.id} ${livello.codice}`);
      }
  });

  test('CCNL e livello sconosciuti si fermano invece di produrre un numero',()=>{
    assert.throws(()=>R.componiRal({ccnl:'inesistente',livello:'4'}),RangeError);
    assert.throws(()=>R.componiRal({ccnl:TERZIARIO,livello:'C3',alla:OGGI}),RangeError);
    assert.throws(()=>R.componiRal({ccnl:METAL,livello:'OV1',alla:OGGI}),RangeError);
    assert.throws(()=>R.componiRal({ccnl:'funzioni-centrali',livello:'1'}),RangeError);
  });
});

/* C — NON REGRESSIONE di H011 e C011. Le RAL di ogni livello, a ogni
   decorrenza, in tre casi, calcolate con il codice di main al commit
   9206fbb prima dell'estensione del modello e scritte qui per esteso:
   [livello, senza scatti, 3 scatti + superminimo 150 €, 3 scatti a 24 ore]. */
test.describe('H011 e C011 — le RAL di prima dell’estensione non si muovono',()=>{
  const ATTESE={
    [`${TERZIARIO}|2026-09-07`]:[["Q",41808.06,44977.38,25726.4],["1",35085.82,38229.1,21677.46],["2",31299.1,34357.96,19354.72],["3",27774.74,30796.64,17218.04],["4",24972.5,27940.22,15504.16],["5",23241.12,26193.72,14456.26],["6",21584.78,24513.44,13447.98],["7",19571.44,22489.18,12233.62],["OV1",24038.56,26789.56,14813.68],["OV2",21294.98,24002.3,13141.38]],
    [`${TERZIARIO}|2026-11-01`]:[["Q",42658.7,45828.02,26236.84],["1",35852.18,38995.46,22137.22],["2",31962,35020.86,19752.46],["3",28341.32,31363.22,17557.96],["4",25462.5,28430.22,15798.16],["5",23683.8,26636.4,14721.84],["6",21982.24,24910.9,13686.54],["7",19911.78,22829.52,12437.74],["OV1",24501.12,27252.12,15091.3],["OV2",21683.34,24390.66,13374.48]],
    [`${TERZIARIO}|2027-02-01`]:[["Q",43630.86,46800.18,26820.08],["1",36728.02,39871.3,22662.78],["2",32719.54,35778.4,20207.04],["3",28988.82,32010.72,17946.46],["4",26022.5,28990.22,16134.16],["5",24189.76,27142.36,15025.36],["6",22436.4,25365.06,13958.98],["7",20300.7,23218.44,12671.12],["OV1",25029.76,27780.76,15408.4],["OV2",22127.14,24834.46,13640.76]],
    [`${METAL}|2026-09-07`]:[["D1",23204.22,26276.9,14596.14],["D2",25731.81,28984.41,16220.62],["C1",26287.56,29540.16,16554.07],["C2",26843.44,30184.44,16940.69],["C3",28748.59,32239.87,18174],["B1",30814.29,34450.65,19500.39],["B2",33058.74,36902.06,20971.21],["B3",36906.87,40986.79,23421.97],["A1",37791.13,41871.05,23952.63]],
  };
  for(const [chiave,righe] of Object.entries(ATTESE)){
    const [ccnl,alla]=chiave.split('|');
    test(`${ccnl} al ${alla}`,()=>{
      assert.deepEqual(R.livelli(ccnl,alla).map(l=>l.codice),righe.map(r=>r[0]));
      for(const [livello,semplice,conScatti,partTime] of righe){
        assert.equal(R.componiRal({ccnl,livello,alla}).ral,semplice,livello);
        assert.equal(R.componiRal({ccnl,livello,dataAnzianita:'2017-08-01',
          superminimoMensile:150,alla}).ral,conScatti,livello);
        assert.equal(R.componiRal({ccnl,livello,dataAnzianita:'2017-08-01',
          oreSettimanali:24,alla}).ral,partTime,livello);
      }
    });
  }
  test('nessuna sezione, identità semplice, scatti in cifra fissa',()=>{
    for(const ccnl of [TERZIARIO,METAL]){
      assert.deepEqual(R.sezioni(ccnl),[]);
      assert.equal(R.regolaScatti(ccnl).tipo,'cifraFissa');
      const r=R.componiRal({ccnl,livello:R.livelli(ccnl,OGGI)[0].codice,scatti:1,
        superminimoMensile:100,alla:OGGI});
      assert.equal(r.identitaSemplice,true,ccnl);
      assert.equal(r.sezione,null);
    }
  });
});

test.describe('part-time — riduce la retribuzione, non il periodo di lavoro',()=>{

  /* Terziario 4° a 20 ore su 40: base 1.783,75 → 891,88 (arrotondato
     al centesimo), scatti 20,66 → 10,33 ciascuno. */
  test('minimo e scatti si riproporzionano sull’orario contrattuale',()=>{
    const r=R.componiRal({ccnl:TERZIARIO,livello:'4',dataAnzianita:'2017-08-01',
      oreSettimanali:20,alla:OGGI});
    assert.equal(r.partTime,true);
    assert.equal(r.oreSettimanali,20);
    assert.equal(r.oreContrattuali,40);
    assert.equal(r.baseMensile,891.88);          // 1.783,75 / 2, arrotondato
    assert.equal(r.baseMensileIntera,1783.75);   // la riga intera resta visibile
    assert.equal(r.valoreScatto,10.33);
    assert.equal(r.scattiMensili,30.99);         // 61,98 / 2
    assert.equal(r.ral,12920.18);
  });

  test('il superminimo dichiarato non si riproporziona una seconda volta',()=>{
    /* È l'importo che l'utente percepisce *già* al proprio orario:
       ridurlo qui lo conterebbe part-time due volte. */
    const pieno=R.componiRal({ccnl:TERZIARIO,livello:'4',
      superminimoMensile:200,alla:OGGI});
    const ridotto=R.componiRal({ccnl:TERZIARIO,livello:'4',oreSettimanali:20,
      superminimoMensile:200,alla:OGGI});
    assert.equal(pieno.superminimoMensile,200);
    assert.equal(ridotto.superminimoMensile,200);
    assert.equal(ridotto.mensileTotale,1091.88);   // 891,88 + 200
    assert.equal(ridotto.ral,15286.32);
  });

  /* L'errore naturale da commettere, fissato da una prova.
     Un part-time su anno intero mantiene i 365 giorni ai fini
     dell'art. 13: la riduzione tocca la retribuzione, non il
     periodo di lavoro. Il motore riceve una RAL e nient'altro,
     quindi la stessa RAL deve dare lo stesso identico netto,
     che sia venuta da un tempo pieno o da un part-time. */
  test('a parità di RAL il part-time non tocca detrazioni né netto',()=>{
    const ridotto=R.componiRal({ccnl:TERZIARIO,livello:'4',oreSettimanali:20,alla:OGGI});
    /* Non è esattamente metà della RAL a tempo pieno (24.972,50 / 2
       farebbe 12.486,25): la riproporzione avviene sull'importo
       mensile, dove 891,875 arrotonda a 891,88, e solo dopo si
       annualizza. Il mezzo centesimo per mensilità è la differenza. */
    assert.equal(ridotto.ral,12486.32);
    const daPartTime=calcola(String(ridotto.ral),{comune:'F205',nucleo:[]});
    const daTempoPieno=calcola('12486.32',{comune:'F205',nucleo:[]});
    assert.deepEqual(daPartTime.voci,daTempoPieno.voci);
    assert.equal(daPartTime.kpi.nettoAnnuo,daTempoPieno.kpi.nettoAnnuo);
    /* La detrazione da lavoro dipendente è quella dell'anno intero:
       la sua base è l'imponibile, e nessun rapporto di giorni la scala. */
    const art13=daPartTime.voci.find(v=>v.id==='detrlav');
    assert.ok(art13,'la detrazione art. 13 deve essere emessa');
    assert.equal(art13.rapporto,null);
    assert.equal(art13.importo,1955);   // la quota fissa intera, non una frazione di giorni
    assert.ok(daPartTime.riconciliazione.verificata);
  });

  test('la riproporzione è lineare e rifiuta orari fuori dal contratto',()=>{
    const meta=R.componiRal({ccnl:METAL,livello:'C3',oreSettimanali:20,alla:OGGI});
    assert.equal(meta.baseMensile,1105.72);      // 2.211,43 / 2, arrotondato
    const trenta=R.componiRal({ccnl:METAL,livello:'C3',oreSettimanali:30,alla:OGGI});
    assert.equal(trenta.baseMensile,1658.57);
    /* Il tempo pieno resta il default, dichiarato invece che assunto. */
    assert.equal(R.componiRal({ccnl:METAL,livello:'C3',alla:OGGI}).oreSettimanali,40);
    assert.throws(()=>R.componiRal({ccnl:METAL,livello:'C3',oreSettimanali:41,alla:OGGI}),RangeError);
    assert.throws(()=>R.componiRal({ccnl:METAL,livello:'C3',oreSettimanali:0,alla:OGGI}),RangeError);
    assert.throws(()=>R.componiRal({ccnl:METAL,livello:'C3',oreSettimanali:'venti',alla:OGGI}),RangeError);
  });
});

test.describe('la RAL composta entra nel motore come qualsiasi altra',()=>{

  /* Almeno un livello per ciascun CCNL supportato, fino al netto,
     con la media mensile sulle mensilità del contratto. */
  test('Terziario 4° livello: dalla tabella al netto',()=>{
    const r=R.componiRal({ccnl:TERZIARIO,livello:'4',alla:OGGI});
    const risultato=applicaMensilita(
      calcola(String(r.ral),{comune:'F205',nucleo:[]}),r.mensilita);
    assert.equal(risultato.input.ral,24972.50);
    assert.equal(risultato.input.mensilita,14);
    assert.ok(risultato.kpi.nettoAnnuo>0);
    assert.ok(risultato.riconciliazione.verificata);
    assert.equal(risultato.kpi.mediaMensile,
      Number((Math.round(risultato.kpi.nettoAnnuo/14*100)/100).toFixed(2)));
  });

  test('Metalmeccanica C3 con scatti e superminimo: dalla tabella al netto',()=>{
    const r=R.componiRal({ccnl:METAL,livello:'C3',dataAnzianita:'2020-08-01',
      superminimoMensile:150,alla:OGGI});
    assert.equal(r.numeroScatti,3);
    assert.equal(r.scattiMensili,88.92);          // 29,64 × 3
    assert.equal(r.mensileTotale,2450.35);        // 2.211,43 + 88,92 + 150
    assert.equal(r.ral,31854.55);
    const risultato=applicaMensilita(
      calcola(String(r.ral),{comune:'F205',nucleo:[]}),r.mensilita);
    assert.ok(risultato.kpi.nettoAnnuo>0);
    assert.ok(risultato.riconciliazione.verificata);
  });

  test('ogni livello di ogni CCNL e sezione produce una RAL che il motore riconcilia',()=>{
    for(const {contratto,sezione} of coppie())
      for(const livello of R.livelli(contratto.id,OGGI,sezione))
        for(const profilo of [null,...livello.profili.map(p=>p.id)])
          for(const ore of [R.oreContrattuali(contratto.id,sezione),24]){
            const etichetta=`${contratto.id} ${sezione||''} ${livello.codice} ${profilo||''} ${ore}h`;
            const r=R.componiRal({ccnl:contratto.id,sezione,livello:livello.codice,profilo,
              oreSettimanali:ore,alla:OGGI});
            assert.ok(Number.isFinite(r.ral)&&r.ral>0,etichetta);
            const risultato=applicaMensilita(
              calcola(String(r.ral),{comune:'F205',nucleo:[]}),r.mensilita);
            assert.ok(risultato.riconciliazione.verificata,etichetta);
            assert.ok(risultato.kpi.nettoAnnuo>0,etichetta);
            assert.ok(Number.isFinite(risultato.kpi.mediaMensile),etichetta);
          }
  });

  /* C — NON REGRESSIONE. Comporre una RAL non tocca il motore:
     il golden storico resta dov'era. */
  test('il golden a RAL 35.000 resta 26.032,17 €',()=>{
    assert.equal(calcola('35000',{comune:'F205',nucleo:[]}).kpi.nettoAnnuo,26032.17);
  });
});

test.describe('la pagina — che cosa promette al primo sguardo',()=>{
  const fs=require('node:fs');
  const path=require('node:path');
  const leggi=nome=>fs.readFileSync(path.join(__dirname,nome),'utf8');
  const pagina=leggi('ccnl-livello.html');

  test('non c’è nessun campo RAL: la RAL è ciò che esce, non ciò che si chiede',()=>{
    assert.doesNotMatch(pagina,/<input[^>]+(?:id|name)="ral"/i);
    assert.doesNotMatch(pagina,/<label[^>]*>\s*RAL/i);
    /* Gli ingressi sono contratto e livello; anzianità, superminimo,
       orario e scatti li accompagnano. */
    assert.match(pagina,/<select class="input" id="ccnl"/);
    assert.match(pagina,/<select class="input" id="livello"/);
    for(const id of ['anzianita','superminimo','ore','scatti'])
      assert.match(pagina,new RegExp(`id="${id}"`),id);
  });

  test('parte senza risultato e lo invalida a ogni modifica',()=>{
    assert.match(pagina,/id="risultato"[\s\S]*?hidden/);
    assert.match(pagina,/aria-live="polite"/);
    assert.match(pagina,/addEventListener\('input',nascondi\)/);
    assert.match(pagina,/selCcnl\.addEventListener\('change'/);
    assert.match(pagina,/type="submit">Calcola la RAL e il netto/);
  });

  test('dove manca una quota annua la cifra non si chiama RAL (RIC-77)',()=>{
    assert.match(pagina,/composta\.ralCompleta/);
    assert.match(pagina,/R\.etichettaAnnua\(contratto\.id\)/);
    assert.match(pagina,/R\.avvisoRalParziale\(contratto\.id\)/);
    assert.match(pagina,/<div id="avviso-parziale"><\/div>/);
  });

  test('il selettore viene dal dataset: nessun contratto scritto a mano',()=>{
    assert.match(pagina,/<select class="input" id="ccnl" name="ccnl" aria-describedby="ccnl-help"><\/select>/);
    assert.match(pagina,/for\(const contratto of R\.CONTRATTI\)/);
    assert.doesNotMatch(pagina,/<option value="terziario-confcommercio-h011">/);
    assert.doesNotMatch(pagina,/Due CCNL privati/);
  });

  test('sezione e profilo esistono solo dove servono, e spariscono davvero',()=>{
    assert.match(pagina,/<div class="field" id="campo-sezione" hidden>/);
    assert.match(pagina,/<div class="field" id="campo-profilo" hidden>/);
    assert.match(pagina,/\.field\[hidden\]\{display:none\}/);
    /* Cambiare contratto o sezione ricostruisce tutto a valle e toglie
       il risultato; cambiare livello ricostruisce il profilo. */
    assert.match(pagina,/selCcnl\.addEventListener\('change',\(\)=>\{popolaSezioni\(\);popolaLivelli\(\);nascondi\(\);\}\)/);
    assert.match(pagina,/selSezione\.addEventListener\('change',\(\)=>\{popolaLivelli\(\);nascondi\(\);\}\)/);
    assert.match(pagina,/selLivello\.addEventListener\('change',\(\)=>\{popolaProfili\(\);nascondi\(\);\}\)/);
    assert.match(pagina,/campo\('ore'\)\.value='';campo\('scatti'\)\.value='';/);
  });

  test('non assume scatti regolari né mensilità identiche',()=>{
    /* La moltiplicazione unica compare solo dove è vera; altrove le
       quote annue una per una. */
    assert.match(pagina,/id="annualizzazione" hidden/);
    assert.match(pagina,/composta\.identitaSemplice/);
    assert.match(pagina,/non tutte le voci entrano in tutte le mensilità/);
    assert.match(pagina,/non calcolabili per questo livello/);
    assert.match(pagina,/il numero da solo non basta/);
    assert.match(pagina,/id="nota-affidabilita"/);
  });

  test('orario ridotto e scatti dichiarati stanno nelle opzioni avanzate',()=>{
    assert.match(pagina,/<details class="avanzate" id="avanzate">/);
    assert.match(pagina,/Opzioni avanzate — orario ridotto e scatti già maturati/);
    /* Il tempo pieno è il default, e la pagina lo dichiara invece di assumerlo. */
    assert.match(pagina,/Vuoto significa tempo pieno/);
  });

  test('dopo il calcolo porta il fuoco e la pagina sul risultato',()=>{
    /* Il risultato sta sotto il modulo e su mobile nasce fuori schermo.
       Il fuoco va sul titolo, non solo lo scorrimento, perché chi
       naviga da tastiera deve arrivarci come chi vede la pagina
       muoversi — è lo stesso trattamento dell'esito del confronto. */
    assert.match(pagina,/<h2 id="risultato-titolo" tabindex="-1">/);
    assert.match(pagina,/titolo\.focus\(\);/);
    assert.match(pagina,/titolo\.scrollIntoView\(\{behavior:movimento\(\),block:'start'\}\)/);
    /* Chi ha chiesto di non essere mosso non viene mosso. */
    assert.match(pagina,/matchMedia\('\(prefers-reduced-motion:reduce\)'\)\.matches\?'auto':'smooth'/);
    assert.match(pagina,/\.result h2:focus-visible\{outline:/);
  });

  test('i campi appaiati non si stirano l’uno diverso dall’altro',()=>{
    /* `.field` del design system è una griglia a righe automatiche.
       Come figlia di `.grid2` viene stirata all'altezza della vicina,
       e senza questa regola lo spazio avanzato dal campo con l'aiuto
       più lungo finisce *dentro* etichetta e input della colonna
       accanto: «Scatti già maturati» era alto 52,78 px contro i 46,39
       di «Ore settimanali», e partiva 6 px più in basso. */
    assert.match(pagina,/\.grid2>\.field\{align-content:start\}/);
  });

  test('carica gli script accanto e nessuna dipendenza esterna',()=>{
    for(const file of ['dati-addizionali-2026.js','geografia.js','motore.js',
      'retribuzione-ccnl.js','site-nav.js'])
      assert.match(pagina,new RegExp(`<script src="${file.replace(/\./g,'\\.')}"></script>`),file);
    assert.doesNotMatch(pagina,/<script[^>]+src="https?:/);
    assert.doesNotMatch(pagina,/localStorage|sessionStorage/);
    assert.doesNotMatch(pagina,/type="module"/);
  });

  test('dichiara il perimetro invece di lasciarlo intendere',()=>{
    assert.match(pagina,/Base nazionale/);
    assert.match(pagina,/zero scatti considerati/);
    assert.match(pagina,/Che cosa questo numero non contiene/);
    assert.match(pagina,/non è il reddito di un anno attraversato da una tranche/);
    /* Il superminimo è mensile e non si riproporziona due volte:
       la pagina lo dice a chi lo compila, non solo al codice. */
    assert.match(pagina,/il superminimo no, perché lo dichiari già al tuo orario/);
  });

  test('la navigazione la rende raggiungibile da ogni pagina pubblica',()=>{
    for(const file of ['index.html','compara.html','come-ho-lavorato.html',
      'la-storia.html','netto-ral.html'])
      assert.match(leggi(file),/href="ccnl-livello\.html">CCNL e livello<\/a>/,file);
    for(const file of ['confronti-ral/index.html','ral-35000-netto/index.html'])
      assert.match(leggi(file),/href="\.\.\/ccnl-livello\.html">CCNL e livello<\/a>/,file);
  });
});
