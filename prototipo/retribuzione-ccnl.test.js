const test=require('node:test');
const assert=require('node:assert/strict');

const R=require('./retribuzione-ccnl.js');
const {calcola,applicaMensilita}=require('./motore.js');
const {CCNL}=require('./ccnl.js');

const TERZIARIO='terziario-confcommercio-h011';
const METAL='metalmeccanica-industria-c011';
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
    let righe=0;
    for(const contratto of R.CONTRATTI)
      for(const tabella of contratto.tabelle)
        for(const livello of tabella.livelli){
          const conti=R.riconciliaLivello(livello);
          assert.ok(conti.verificata,
            `${contratto.id} ${tabella.decorrenza} ${livello.codice}: `+
            `voci ${conti.somma} contro totale ${conti.totale}`);
          righe++;
        }
    assert.equal(righe,39);   // 10 livelli × 3 tranche Terziario + 9 Metalmeccanica
  });

  test('ogni riga porta fonte, decorrenza e data di verifica',()=>{
    for(const contratto of R.CONTRATTI){
      assert.match(contratto.fonte.url,/^https:\/\//);
      assert.match(contratto.fonte.verificataIl,/^\d{4}-\d{2}-\d{2}$/);
      assert.ok(contratto.fonte.parte,contratto.id);
      assert.ok(R.ESCLUSIONI[contratto.id].length>0,contratto.id);
      for(const tabella of contratto.tabelle){
        assert.match(tabella.decorrenza,/^\d{4}-\d{2}-\d{2}$/);
        assert.ok(tabella.titolo);
      }
    }
    assert.equal(R.VERSIONE_DATASET,'2026-09-07');
  });

  test('mensilità e orario contrattuale restano allineati al catalogo CCNL',()=>{
    for(const contratto of R.CONTRATTI){
      const catalogo=CCNL.find(c=>c.id===contratto.id);
      assert.ok(catalogo,`${contratto.id} manca in ccnl.js`);
      assert.equal(contratto.mensilita,catalogo.mensilita,contratto.id);
      assert.equal(contratto.oreSettimanali,40,contratto.id);
    }
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
  test('il Terziario matura uno scatto ogni tre anni, fino a dieci',()=>{
    assert.equal(R.scattiMaturati(TERZIARIO,0),0);
    assert.equal(R.scattiMaturati(TERZIARIO,2),0);
    assert.equal(R.scattiMaturati(TERZIARIO,3),1);   // primo confine
    assert.equal(R.scattiMaturati(TERZIARIO,5),1);
    assert.equal(R.scattiMaturati(TERZIARIO,6),2);
    assert.equal(R.scattiMaturati(TERZIARIO,29),9);
    assert.equal(R.scattiMaturati(TERZIARIO,30),10);  // il tetto, esatto
    assert.equal(R.scattiMaturati(TERZIARIO,45),10);  // e oltre il tetto
  });

  test('la Metalmeccanica matura uno scatto ogni due anni, fino a cinque',()=>{
    assert.equal(R.scattiMaturati(METAL,1),0);
    assert.equal(R.scattiMaturati(METAL,2),1);
    assert.equal(R.scattiMaturati(METAL,9),4);
    assert.equal(R.scattiMaturati(METAL,10),5);      // il tetto, esatto
    assert.equal(R.scattiMaturati(METAL,40),5);
  });

  test('l’anzianità si conta ad anni compiuti e rifiuta valori impossibili',()=>{
    assert.equal(R.scattiMaturati(TERZIARIO,3.9),1);
    assert.throws(()=>R.scattiMaturati(TERZIARIO,-1),RangeError);
    assert.throws(()=>R.scattiMaturati(TERZIARIO,'molti'),RangeError);
    assert.throws(()=>R.scattiMaturati('inesistente',3),RangeError);
  });

  test('anzianità non dichiarata significa zero scatti, e il risultato lo dice',()=>{
    const senza=R.componiRal({ccnl:TERZIARIO,livello:'4',alla:OGGI});
    assert.equal(senza.numeroScatti,0);
    assert.equal(senza.scattiMensili,0);
    assert.equal(senza.anzianitaDichiarata,false);
    assert.equal(senza.scattiOverride,false);
    const con=R.componiRal({ccnl:TERZIARIO,livello:'4',anniAnzianita:0,alla:OGGI});
    assert.equal(con.anzianitaDichiarata,true);
    assert.equal(con.numeroScatti,0);
  });

  test('il numero di scatti dichiarato prevale sull’anzianità stimata',()=>{
    const stimati=R.componiRal({ccnl:METAL,livello:'C3',anniAnzianita:4,alla:OGGI});
    assert.equal(stimati.numeroScatti,2);
    const dichiarati=R.componiRal({ccnl:METAL,livello:'C3',anniAnzianita:4,
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
    const r=R.componiRal({ccnl:TERZIARIO,livello:'4',anniAnzianita:9,alla:OGGI});
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
    const r=R.componiRal({ccnl:TERZIARIO,livello:'4',anniAnzianita:9,
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
    for(const contratto of R.CONTRATTI)
      for(const livello of R.livelli(contratto.id,OGGI)){
        const r=R.componiRal({ccnl:contratto.id,livello:livello.codice,
          anniAnzianita:12,superminimoMensile:150,alla:OGGI});
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

test.describe('part-time — riduce la retribuzione, non il periodo di lavoro',()=>{

  /* Terziario 4° a 20 ore su 40: base 1.783,75 → 891,88 (arrotondato
     al centesimo), scatti 20,66 → 10,33 ciascuno. */
  test('minimo e scatti si riproporzionano sull’orario contrattuale',()=>{
    const r=R.componiRal({ccnl:TERZIARIO,livello:'4',anniAnzianita:9,
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
    const r=R.componiRal({ccnl:METAL,livello:'C3',anniAnzianita:6,
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

  test('ogni livello di ogni CCNL produce una RAL che il motore riconcilia',()=>{
    for(const contratto of R.CONTRATTI)
      for(const livello of R.livelli(contratto.id,OGGI))
        for(const ore of [40,24]){
          const r=R.componiRal({ccnl:contratto.id,livello:livello.codice,
            anniAnzianita:7,oreSettimanali:ore,alla:OGGI});
          const risultato=calcola(String(r.ral),{comune:'F205',nucleo:[]});
          assert.ok(risultato.riconciliazione.verificata,
            `${contratto.id} ${livello.codice} ${ore}h`);
          assert.ok(risultato.kpi.nettoAnnuo>0,
            `${contratto.id} ${livello.codice} ${ore}h`);
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
