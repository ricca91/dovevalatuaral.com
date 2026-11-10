const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {test}=require('node:test');
const {generate}=require('./genera-pagine-ral.js');

test('la generazione del sito dopo la decorrenza usa i minimi artigiani di novembre',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ric172-'));
  try{
    generate(dir,{alla:'2026-11-15'});
    const base=path.join(dir,'minimi-ccnl','metalmeccanico-artigiano');
    const read=slug=>fs.readFileSync(path.join(base,slug,'index.html'),'utf8');
    for(const slug of ['2-livello','livello-2-bis','3-livello','4-livello','5-livello','6-livello']){
      const html=read(slug);
      assert.match(html,/Tabella nazionale in vigore dal 1° novembre 2026\./,slug);
      assert.doesNotMatch(html,/Tabella nazionale in vigore dal 1° marzo 2026\./,slug);
    }
    const quattro=read('4-livello'),cinque=read('5-livello');
    assert.match(quattro,/<title>4° livello Metalmeccanico artigiano 2026: 1\.430 € netti<\/title>/);
    assert.match(quattro,/<meta name="description" content="[^"]*1\.676,98 €[^"]*21\.800,74 €[^"]*1\.430,36 €/);
    assert.match(cinque,/<title>5° livello Metalmeccanico artigiano 2026: 1\.390 € netti<\/title>/);
    assert.match(cinque,/<meta name="description" content="[^"]*1\.615,17 €[^"]*20\.997,21 €[^"]*1\.390,47 €/);
    assert.match(cinque,/<th scope="row">2 anni · 1 scatto<\/th><td>1\.635,41 €<\/td><td>21\.260,33 €<\/td>/);
    assert.match(cinque,/<th scope="row">20 ore<\/th><td>807,59 €<\/td><td>10\.498,67 €<\/td>/);
    assert.match(cinque,/<b>4° livello Metalmeccanico artigiano<\/b><small>1\.676,98 € lordi al mese<\/small>/);
    assert.match(quattro,/<b>5° livello Metalmeccanico artigiano<\/b><small>1\.615,17 € lordi al mese<\/small>/);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
