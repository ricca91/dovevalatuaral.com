const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {test}=require('node:test');
const {ROTTE,generate}=require('./genera-pagine-ccnl.js');

/* Pagine livello DMO (RIC-100): solo i livelli con query «ccnl dmo N livello» misurata. */
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'minimi-dmo-'));
generate(dir,{alla:'2026-09-22'});
const leggi=rotta=>fs.readFileSync(path.join(dir,rotta,'index.html'),'utf8');

test('DMO ha le pagine dei livelli 1, 3, 4, 5 e nessuna delle altre',()=>{
  const dmo=ROTTE.filter(r=>r.startsWith('/minimi-ccnl/dmo/'));
  assert.deepEqual(dmo,['/minimi-ccnl/dmo/','/minimi-ccnl/dmo/1-livello/','/minimi-ccnl/dmo/3-livello/',
    '/minimi-ccnl/dmo/4-livello/','/minimi-ccnl/dmo/5-livello/']);
});

test('le pagine DMO citano DMO, hanno importi veri e la tabella le linka',()=>{
  for(const n of [1,3,4,5]){
    const html=leggi(`/minimi-ccnl/dmo/${n}-livello/`);
    assert.match(html,/<title>[^<]*livello CCNL DMO 2026: [\d.]+ € netti[^<]*<\/title>/);
    assert.match(html,/<h1[^>]*>[^<]*DMO/);
    assert.doesNotMatch(html,/NaN|undefined/);
    assert.ok(html.includes('href="../../../minimi-ccnl/dmo/"'));
    assert.ok(leggi('/minimi-ccnl/dmo/').includes(`href="../../minimi-ccnl/dmo/${n}-livello/"`));
  }
});

test('Commercio e DMO mostrano la tranche vigente di novembre e quella successiva',()=>{
  const novembre=fs.mkdtempSync(path.join(os.tmpdir(),'minimi-novembre-'));
  try {
    generate(novembre,{alla:'2026-11-01'});
    for(const contratto of ['commercio','dmo']){
      const pagina=rotta=>fs.readFileSync(path.join(novembre,'minimi-ccnl',contratto,rotta,'index.html'),'utf8');
      const hub=pagina('');
      assert.match(hub,/tabella in vigore dal 1° novembre 2026/);
      assert.match(hub,/La prossima tranche firmata decorre dal 1° febbraio 2027/);
      for(const valore of ['2.560,87 €','2.024,38 €','1.818,75 €','1.691,70 €','25.462,50 €'])
        assert.ok(hub.includes(valore),`${contratto}: ${valore}`);
      for(const [livello,minimo] of [['1','2.560,87 €'],['3','2.024,38 €'],['4','1.818,75 €'],['5','1.691,70 €']]){
        const html=pagina(`${livello}-livello`);
        assert.match(html,/Tabella nazionale in vigore dal 1° novembre 2026/);
        assert.ok(html.includes(minimo));
        assert.match(html,/Dal 1° febbraio 2027 la tranche già firmata/);
        if(livello==='4')assert.ok(html.includes('25.462,50 €'));
      }
    }
  } finally { fs.rmSync(novembre,{recursive:true,force:true}); }
});
