const test=require('node:test');
const assert=require('node:assert/strict');

const R=require('./retribuzione-ccnl.js');
const {CCNL,suggerisciMensilita,trovaCcnl}=require('./ccnl.js');
const P=require('./prove-ccnl.js');
const {provaDecorrenze,nettoRiconcilia,voci}=P;

/* Gomma, cavi elettrici e plastica, industria — B371 (RIC-61). Ogni
   importo atteso è preso dalla fonte archiviata e scritto a mano, con
   il conto per esteso nel commento. La data è fissa: il dataset porta
   tranche future già firmate. */
const OGGI='2026-10-16';
const GP='gomma-plastica-industria-b371';
const provaScattiFissi=prova=>P.provaScattiFissi({...prova,alla:OGGI});

test.describe('Gomma, cavi elettrici e plastica — B371',()=>{

  test('nessuna sezione, dieci livelli dal Q alla I, 40 ore',()=>{
    assert.deepEqual(R.sezioni(GP),[]);
    assert.equal(R.trovaContratto(GP).oreSettimanali,40);
    assert.deepEqual(R.livelli(GP,OGGI).map(l=>l.codice),
      ['Q','A','B','C','D','E','F','G','H','I']);
  });

  /* Ipotesi 10.12.2025, deposito CNEL, p. 31 (art. 17 c.3), tabella 1.1.2026. */
  test('tabella vigente: minimi per livello, indennità di funzione solo sul Quadro',()=>{
    const q=R.trovaLivello(GP,'Q',OGGI);
    assert.deepEqual(voci(q),[['minimo',2497.83],['indennitaFunzione',50]]);
    /* La fonte non stampa totali: totale derivato 2.497,83 + 50,00. */
    assert.equal(q.totalePubblicato,null);
    assert.equal(q.totale,2547.83);
    for(const [codice,minimo] of [['A',2351.85],['B',2218.74],['C',2189.60],['D',2162.08],
      ['E',2074.83],['F',2021.12],['G',1883.45],['H',1796.11],['I',1614.73]]){
      const l=R.trovaLivello(GP,codice,OGGI);
      assert.deepEqual(voci(l),[['minimo',minimo]],codice);
      assert.equal(l.totalePubblicato,null,codice);
      assert.equal(l.totale,minimo,codice);
    }
    assert.equal(R.trovaLivello(GP,'Q',OGGI).nome,'Quadri');
  });

  /* Ipotesi, deposito CNEL p. 31: F 2.021,12 / 2.081,12 / 2.141,12 / 2.156,12;
     Q 2.497,83 / 2.571,98 / 2.646,13 / 2.664,67; I 1.614,73 … 1.722,57.
     Gli incrementi, stessa pagina: F +60, +60, +60, +15 (= 195); Q +74,15 ×3, +18,54. */
  test('sette tabelle: tre storiche, la vigente e tre future già firmate',()=>{
    provaDecorrenze(GP,null,['2023-01-01','2024-01-01','2025-04-01','2026-01-01',
      '2027-04-01','2028-04-01','2028-12-01']);
    const minimo=(codice,data)=>R.trovaLivello(GP,codice,data).voci[0].importo;
    const date=['2026-01-01','2027-04-01','2028-04-01','2028-12-01'];
    assert.deepEqual(date.map(d=>minimo('F',d)),[2021.12,2081.12,2141.12,2156.12]);
    assert.deepEqual(date.map(d=>minimo('Q',d)),[2497.83,2571.98,2646.13,2664.67]);
    assert.deepEqual(date.map(d=>minimo('I',d)),[1614.73,1662.66,1710.59,1722.57]);
    /* Il livello I resta in tabella anche dopo l'1.12.2028 (eliminato solo
       in produzione e funzioni integrate trasversali). */
    assert.equal(R.livelli(GP,'2028-12-01').length,10);
    /* F: 2.156,12 - 1.961,12 (1.4.2025) = 195,00. */
    assert.equal(Math.round((minimo('F','2028-12-01')-minimo('F','2025-04-01'))*100),19500);
  });

  /* Accordo di rinnovo 26.1.2023, deposito CNEL, art. 17 c.3, p. 15. */
  test('tabelle storiche 2023–2025 del CCNL 26.1.2023',()=>{
    const minimo=(codice,data)=>R.trovaLivello(GP,codice,data).voci[0].importo;
    const date=['2023-01-01','2024-01-01','2025-04-01'];
    assert.deepEqual(date.map(d=>minimo('F',d)),[1869.12,1914.12,1961.12]);
    assert.deepEqual(date.map(d=>minimo('Q',d)),[2309.97,2365.59,2423.68]);
    assert.deepEqual(date.map(d=>minimo('I',d)),[1493.30,1529.25,1566.80]);
    /* L'indennità di funzione dei Quadri è in vigore dal 2008. */
    assert.deepEqual(voci(R.trovaLivello(GP,'Q','2024-06-01')),
      [['minimo',2365.59],['indennitaFunzione',50]]);
  });

  /* Art. 23 della stesura 16.9.2020, deposito CNEL, pp. 50–51: 20,14 Q; 18,59 A;
     16,53 B-C-D; 13,94 E-F; 13,43 G; 11,88 H; 10,33 I. */
  test('scatti biennali in cifra fissa, cinque, su tredici mensilità',()=>{
    provaScattiFissi({ccnl:GP,livello:'F',cadenza:2,massimo:5,importo:13.94,mensilita:13});
    provaScattiFissi({ccnl:GP,livello:'Q',cadenza:2,massimo:5,importo:20.14,mensilita:13});
    provaScattiFissi({ccnl:GP,livello:'I',cadenza:2,massimo:5,importo:10.33,mensilita:13});
    const importi={Q:20.14,A:18.59,B:16.53,C:16.53,D:16.53,E:13.94,F:13.94,G:13.43,H:11.88,I:10.33};
    for(const [codice,importo] of Object.entries(importi))
      assert.equal(R.componiRal({ccnl:GP,livello:codice,scatti:1,alla:OGGI}).valoreScatto,importo,codice);
  });

  test('le mensilità proposte sono tredici',()=>{
    assert.equal(R.trovaContratto(GP).mensilita,13);
    assert.equal(suggerisciMensilita(GP,12),13);
    const c=trovaCcnl(GP);
    assert.equal(c.codiceCnel,'B371');
    assert.equal(c.mensilita,13);
    assert.equal(CCNL.filter(x=>x.codiceCnel==='B371').length,1);
  });

  /* F: 2.021,12 × 13 = 26.274,56. Con 100,00 di superminimo:
     (2.021,12 + 100,00) × 13 = 2.121,12 × 13 = 27.574,56. */
  test('tempo pieno, senza e con superminimo',()=>{
    const zero=R.componiRal({ccnl:GP,livello:'F',alla:OGGI});
    assert.equal(zero.ral,26274.56);
    assert.equal(zero.mensilita,13);
    assert.equal(zero.ralCompleta,true);
    const con=R.componiRal({ccnl:GP,livello:'F',superminimoMensile:100,alla:OGGI});
    assert.equal(con.ral,27574.56);
    nettoRiconcilia(zero);
    nettoRiconcilia(con);
  });

  /* E, 2 scatti, 1.1.2026: (2.074,83 + 2 × 13,94) × 13 = 2.102,71 × 13 = 27.335,23.
     Q, 5 scatti, 1.4.2027: (2.571,98 + 5 × 20,14 + 50,00) × 13
     = (2.571,98 + 100,70 + 50,00) × 13 = 2.722,68 × 13 = 35.394,84.
     L'indennità di funzione entra nella retribuzione mensile e quindi nelle 13. */
  test('RAL con scatti, e con l’indennità di funzione del Quadro',()=>{
    assert.equal(R.componiRal({ccnl:GP,livello:'E',scatti:2,alla:OGGI}).ral,27335.23);
    const q=R.componiRal({ccnl:GP,livello:'Q',scatti:5,alla:'2027-04-01'});
    assert.equal(q.ral,35394.84);
    assert.equal(q.decorrenza,'2027-04-01');
    /* Il giorno prima vale ancora la tabella 1.1.2026: F 2.021,12 × 13. */
    assert.equal(R.componiRal({ccnl:GP,livello:'F',alla:'2027-03-31'}).ral,26274.56);
    /* Ultima tranche, giorno esatto: 2.156,12 × 13 = 28.029,56. */
    assert.equal(R.componiRal({ccnl:GP,livello:'F',alla:'2028-12-01'}).ral,28029.56);
  });

  /* Art. 10 c.7 (stesura 2020, p. 36) rinvia al D.Lgs. 81/2015, art. 7: riproporzione sulle 40 ore.
     F a 20 ore: 2.021,12 / 2 = 1.010,56 × 13 = 13.137,28; superminimo
     non riproporzionato: (1.010,56 + 100,00) × 13 = 14.437,28.
     Q a 20 ore, 1.4.2027, 5 scatti: base (2.571,98 + 50,00) / 2 = 1.310,99;
     scatti 100,70 / 2 = 50,35; (1.310,99 + 50,35) × 13 = 1.361,34 × 13 = 17.697,42. */
  test('part-time: riproporzione sulle 40 ore, superminimo intero',()=>{
    const f=R.componiRal({ccnl:GP,livello:'F',oreSettimanali:20,alla:OGGI});
    assert.equal(f.ral,13137.28);
    assert.equal(f.partTime,true);
    assert.equal(R.componiRal({ccnl:GP,livello:'F',oreSettimanali:20,superminimoMensile:100,alla:OGGI}).ral,14437.28);
    const q=R.componiRal({ccnl:GP,livello:'Q',scatti:5,oreSettimanali:20,alla:'2027-04-01'});
    assert.equal(q.ral,17697.42);
    nettoRiconcilia(f);
    nettoRiconcilia(q);
    assert.throws(()=>R.componiRal({ccnl:GP,livello:'F',oreSettimanali:41,alla:OGGI}),RangeError);
  });

  test('livello sconosciuto o data senza tabella: errore, nessun importo di ripiego',()=>{
    assert.throws(()=>R.componiRal({ccnl:GP,livello:'L',alla:OGGI}),RangeError);
    assert.throws(()=>R.componiRal({ccnl:GP,livello:'F',alla:'2022-12-31'}),RangeError);
  });

  /* Fonte primaria: l'ipotesi firmata depositata al CNEL (idAccordo
     239732), tabella dei minimi all'art. 17 c.3, p. 31 del deposito.
     Il riscontro cifra per cifra con le tabelle del dataset è nel dossier. */
  test('fonte: il deposito CNEL dell’ipotesi, archiviato',()=>{
    const f=R.trovaContratto(GP).fonte;
    assert.equal(f.url,'https://az-apim-cne-sa-0002-lgc-we.azure-api.net/ricerca-api/ricerca/pubblica/accordi/scarica/accordi/239732');
    assert.equal(f.archivio,'processo/dati/fonti/gomma-plastica-b371-cnel-ipotesi-accordo-rinnovo-2025-12-10.pdf');
    assert.match(f.titolo,/art\. 17 c\.3/);
    assert.match(f.parte,/CNEL[^.]*239732/);
    assert.doesNotMatch(R.trovaContratto(GP).notaFonte,/consolidato/);
  });

  test('esclusioni: premio sostitutivo, welfare, limiti documentali; la RAL è completa',()=>{
    const testo=R.ESCLUSIONI[GP].join('\n');
    assert.match(testo,/Allegato 1/);
    assert.match(testo,/art\. 24/);
    assert.match(testo,/Fondo Gomma Plastica/);
    assert.match(testo,/FASG&P/);
    assert.match(testo,/art\. 23 c\.4/);
    /* Letti sui depositi CNEL: resta non letto solo il testo coordinato
       2026 e l'accordo del 30 giugno 2026. */
    assert.match(testo,/depositi CNEL/);
    assert.match(testo,/testo coordinato 2026/);
    assert.match(testo,/30 giugno 2026/);
    assert.doesNotMatch(testo,/consolidato/);
    /* Art. 28 c.5: l'indennità di funzione può assorbire il superminimo. */
    assert.match(testo,/art\. 28 c\.5[^\n]*assorb/);
    assert.equal(R.trovaContratto(GP).quoteAnnueMancanti.length,0);
    assert.equal(R.etichettaAnnua(GP),'RAL');
    assert.equal(R.avvisoRalParziale(GP),null);
  });
});
