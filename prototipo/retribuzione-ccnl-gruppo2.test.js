const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const R=require('./retribuzione-ccnl.js');
const {CCNL}=require('./ccnl.js');

/* Il gruppo 2 (RIC-61) nel suo insieme. Le prove di ogni contratto
   stanno nei file retribuzione-ccnl-gruppo2-<contratto>.test.js; qui
   solo ciò che riguarda il gruppo: identità, fonti archiviate e il
   perimetro delle regole nuove degli scatti. */
const OGGI='2026-10-16';
const radice=path.join(__dirname,'..');

const GRUPPO_2=[
  ['area-meccanica-artigianato-c030','C030','area-meccanica'],
  ['alimentare-industria-e012','E012','alimentare'],
  ['chimico-farmaceutico-industria-b011','B011','chimico'],
  ['gomma-plastica-industria-b371','B371','gomma-plastica'],
  ['credito-abi-j241','J241','credito-abi'],
];

const sezioniDi=id=>R.sezioni(id).length?R.sezioni(id).map(s=>s.id):[null];

test.describe('il gruppo 2 nel suo insieme',()=>{

  test('diciannove codici CNEL distinti, cinque nuovi in coda',()=>{
    assert.deepEqual(R.CONTRATTI.map(c=>c.codiceCnel),
      ['H011','C011','H05Y','H052','H04Z','I100','K511','H442','T151','H008','C018','G011','G041','B132',
        ...GRUPPO_2.map(([,codice])=>codice)]);
    assert.deepEqual(R.CONTRATTI.slice(14).map(c=>c.id),GRUPPO_2.map(([id])=>id));
    assert.equal(new Set(R.CONTRATTI.map(c=>c.id)).size,19);
  });

  test('ogni contratto ha dossier, fonte archiviata e data di verifica',()=>{
    for(const [id,,slug] of GRUPPO_2){
      const contratto=R.trovaContratto(id);
      assert.ok(fs.existsSync(path.join(radice,'processo',`fonti-ccnl-gruppo2-${slug}.md`)),slug);
      assert.equal(contratto.fonte.verificataIl,OGGI,id);
      assert.ok(fs.existsSync(path.join(radice,contratto.fonte.archivio)),contratto.fonte.archivio);
      assert.ok(CCNL.find(c=>c.id===id),`${id} manca in ccnl.js`);
    }
  });

  /* Nessuno dei cinque ha una quota annua prevista e non quantificata:
     la cifra si chiama RAL ovunque. */
  test('ogni contratto dà la RAL, su ogni sezione',()=>{
    for(const [id] of GRUPPO_2){
      assert.equal(R.ralCompleta(id),true,id);
      for(const sezione of sezioniDi(id)){
        const livello=R.livelli(id,OGGI,sezione)[0].codice;
        const r=R.componiRal({ccnl:id,sezione,livello,alla:OGGI});
        assert.ok(Number.isFinite(r.ral)&&r.ral>0,`${id} ${sezione}`);
        assert.ok(r.esclusioni.length>0,`${id} ${sezione}`);
      }
    }
  });

  /* Le regole nuove degli scatti le dichiara solo chi ne ha bisogno:
     gli altri contratti, vecchi e nuovi, restano sui default. */
  test('solo il Credito ABI dichiara primo scatto, mese di maturazione e sospensioni',()=>{
    const particolari=[];
    for(const contratto of R.CONTRATTI)
      for(const sezione of sezioniDi(contratto.id)){
        const regola=R.regolaScatti(contratto.id,sezione);
        if(regola.decorre!=='meseSuccessivo'&&regola.decorre!=='anniversario'
          ||regola.sospensioni.length
          ||regola.primoDopoAnni!==undefined&&regola.primoDopoAnni!==regola.cadenzaAnni)
          particolari.push(`${contratto.id} ${sezione}`);
      }
    assert.deepEqual(particolari,['credito-abi-j241 aree-qd12','credito-abi-j241 qd34']);
  });

  /* La soglia di anzianità la dichiarano solo aree e QD1–QD2 del Credito
     ABI: per ogni altro contratto e sezione il conto dalla data non ha
     limiti, come prima. */
  test('solo aree e QD1–QD2 del Credito ABI dichiarano una soglia di anzianità',()=>{
    const conSoglia=R.CONTRATTI.flatMap(contratto=>sezioniDi(contratto.id)
      .filter(sezione=>R.regolaScatti(contratto.id,sezione).anzianitaDal!==null)
      .map(sezione=>`${contratto.id} ${sezione}`));
    assert.deepEqual(conSoglia,['credito-abi-j241 aree-qd12']);
  });
});
