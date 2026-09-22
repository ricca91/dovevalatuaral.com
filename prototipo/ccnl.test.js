const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {VERSIONE_CATALOGO,CCNL,trovaCcnl,suggerisciMensilita,statoMensilita,
  preferenzaDaUrl}=require('./ccnl.js');
const MENSILITA_AMMESSE=[12,13,14,15,16];

test.describe('catalogo CCNL',()=>{
  test('identifica precisamente i contratti e le loro fonti',()=>{
    assert.equal(VERSIONE_CATALOGO,'2026-09-22');
    assert.deepEqual(CCNL.map(({id,codiceCnel,mensilita})=>({id,codiceCnel,mensilita})),[
      {id:'terziario-confcommercio-h011',codiceCnel:'H011',mensilita:14},
      {id:'metalmeccanica-industria-c011',codiceCnel:'C011',mensilita:13},
      {id:'pubblici-esercizi-fipe-h05y',codiceCnel:'H05Y',mensilita:14},
      {id:'turismo-federalberghi-h052',codiceCnel:'H052',mensilita:14},
      {id:'logistica-trasporto-merci-i100',codiceCnel:'I100',mensilita:14},
      {id:'multiservizi-pulizia-k511',codiceCnel:'K511',mensilita:14},
      {id:'studi-professionali-confprofessioni-h442',codiceCnel:'H442',mensilita:14},
      {id:'cooperative-sociali-t151',codiceCnel:'T151',mensilita:13.5},
      {id:'distribuzione-moderna-federdistribuzione-h008',codiceCnel:'H008',mensilita:14},
      {id:'metalmeccanica-pmi-confapi-c018',codiceCnel:'C018',mensilita:13},
      {id:'grafici-editori-g011',codiceCnel:'G011',mensilita:13},
      {id:'poligrafici-quotidiani-g041',codiceCnel:'G041',mensilita:13},
      {id:'vetro-lampade-display-b132',codiceCnel:'B132',mensilita:13},
      {id:'funzioni-centrali',codiceCnel:null,mensilita:13},
    ]);
    for(const contratto of CCNL){
      assert.ok(contratto.nome);
      assert.ok(contratto.parti);
      assert.match(contratto.dataRiferimento,/^\d{4}-\d{2}-\d{2}$/);
      assert.match(contratto.fonte.url,/^https:\/\//);
      assert.ok(contratto.fonte.titolo);
    }
  });

  /* Il catalogo delle mensilità e il dataset retributivo parlano degli
     stessi contratti con gli stessi ID e codici CNEL: tredici CCNL
     privati, tredici codici distinti. Funzioni Centrali resta solo qui. */
  test('ogni contratto del dataset retributivo è nel catalogo con lo stesso codice',()=>{
    const R=require('./retribuzione-ccnl.js');
    assert.equal(R.CONTRATTI.length,13);
    assert.equal(new Set(R.CONTRATTI.map(c=>c.codiceCnel)).size,13);
    for(const contratto of R.CONTRATTI){
      const voce=trovaCcnl(contratto.id);
      assert.ok(voce,contratto.id);
      assert.equal(voce.codiceCnel,contratto.codiceCnel,contratto.id);
      assert.equal(voce.nome,contratto.nome,contratto.id);
    }
    assert.deepEqual(CCNL.filter(c=>!R.trovaContratto(c.id)).map(c=>c.id),['funzioni-centrali']);
  });

  /* 13,5 è il numero del contratto, non una preferenza: il catalogo
     lo propone, l'URL può solo scegliere fra le mensilità ammesse. */
  test('le Cooperative sociali propongono 13,5 mensilità',()=>{
    assert.equal(suggerisciMensilita('cooperative-sociali-t151',13),13.5);
    assert.deepEqual(statoMensilita('cooperative-sociali-t151',13.5),
      {personalizzato:false,consigliate:13.5});
    assert.deepEqual(statoMensilita('cooperative-sociali-t151',14),
      {personalizzato:true,consigliate:13.5});
    assert.deepEqual(preferenzaDaUrl('cooperative-sociali-t151',null,13,MENSILITA_AMMESSE),
      {ccnl:'cooperative-sociali-t151',mensilita:13.5});
    assert.deepEqual(preferenzaDaUrl('cooperative-sociali-t151','14',13,MENSILITA_AMMESSE),
      {ccnl:'cooperative-sociali-t151',mensilita:14});
    assert.deepEqual(preferenzaDaUrl('cooperative-sociali-t151','13.5',13,MENSILITA_AMMESSE),
      {ccnl:'cooperative-sociali-t151',mensilita:13.5});
  });

  test('ogni nuovo contratto propone le sue mensilità',()=>{
    for(const [id,mensilita] of [['pubblici-esercizi-fipe-h05y',14],['turismo-federalberghi-h052',14],
      ['logistica-trasporto-merci-i100',14],['multiservizi-pulizia-k511',14],
      ['studi-professionali-confprofessioni-h442',14],['distribuzione-moderna-federdistribuzione-h008',14],
      ['metalmeccanica-pmi-confapi-c018',13],['grafici-editori-g011',13],
      ['poligrafici-quotidiani-g041',13],['vetro-lampade-display-b132',13]])
      assert.equal(suggerisciMensilita(id,12),mensilita,id);
  });

  test('selezionare un CCNL propone le sue mensilita; nessuna selezione conserva il valore',()=>{
    assert.equal(suggerisciMensilita('terziario-confcommercio-h011',13),14);
    assert.equal(suggerisciMensilita('metalmeccanica-industria-c011',14),13);
    assert.equal(suggerisciMensilita('',14),14);
    assert.throws(()=>suggerisciMensilita('inesistente',13),RangeError);
  });

  test('distingue il suggerimento contrattuale da un valore personalizzato',()=>{
    assert.deepEqual(statoMensilita('terziario-confcommercio-h011',14),
      {personalizzato:false,consigliate:14});
    assert.deepEqual(statoMensilita('terziario-confcommercio-h011',13),
      {personalizzato:true,consigliate:14});
    assert.deepEqual(statoMensilita('',13),
      {personalizzato:false,consigliate:null});
  });

  test('lookup e catalogo non sono modificabili dai consumatori',()=>{
    const commercio=trovaCcnl('terziario-confcommercio-h011');
    assert.ok(Object.isFrozen(CCNL));
    assert.ok(Object.isFrozen(commercio));
    assert.ok(Object.isFrozen(commercio.fonte));
  });

  test('nell URL le mensilita esplicite prevalgono sul suggerimento del CCNL',()=>{
    assert.deepEqual(preferenzaDaUrl('terziario-confcommercio-h011','13',13,MENSILITA_AMMESSE),
      {ccnl:'terziario-confcommercio-h011',mensilita:13});
    assert.deepEqual(preferenzaDaUrl('terziario-confcommercio-h011',null,13,MENSILITA_AMMESSE),
      {ccnl:'terziario-confcommercio-h011',mensilita:14});
    assert.deepEqual(preferenzaDaUrl('inesistente','14',13,MENSILITA_AMMESSE),
      {ccnl:'',mensilita:14});
    assert.deepEqual(preferenzaDaUrl('',null,13,MENSILITA_AMMESSE),{ccnl:'',mensilita:13});
  });
});

test('la home lascia il CCNL al calcolatore dedicato',()=>{
  const home=fs.readFileSync(`${__dirname}/index.html`,'utf8');
  assert.doesNotMatch(home,/id="ccnl"|CCNL_CATALOGO|script src="ccnl\.js"/);
  assert.match(home,/href="ccnl-livello\.html">CCNL e livello<\/a>/);
});
