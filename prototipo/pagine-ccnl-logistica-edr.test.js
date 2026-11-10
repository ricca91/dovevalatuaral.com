const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {test}=require('node:test');
const {generate,ROTTE}=require('./genera-pagine-ccnl.js');

test('Logistica: tutte le pagine livello distinguono EDR e quattordicesima',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'logistica-edr-'));
  try{
    generate(dir,{alla:'2026-09-22'});
    const casi={
      '3-livello':['1.946,84','9,70','1.956,54','27.381,86'],
      '4-livello':['1.850,23','9,24','1.859,47','26.023,34'],
      '5-livello':['1.761,64','8,79','1.770,43','24.777,23'],
      '6-livello':['1.648,74','8,26','1.657,00','23.189,74'],
    };
    const rotte=ROTTE.filter(r=>r.startsWith('/minimi-ccnl/logistica/')&&r!=='/minimi-ccnl/logistica/');
    assert.equal(rotte.length,Object.keys(casi).length);
    for(const rotta of rotte){
      const slug=rotta.split('/').filter(Boolean).at(-1);
      const [base,edr,totale,ral]=casi[slug];
      const html=fs.readFileSync(path.join(dir,rotta,'index.html'),'utf8');
      assert.ok(html.includes(`retribuzione contrattuale è ${base} € al mese per 14 mensilità, più ${edr} € di EDR per 13 mensilità`),rotta);
      assert.ok(html.includes(`Il lordo nei mesi con EDR è ${totale} €; la quattordicesima non include l’EDR. La RAL è ${ral} €`),rotta);
      assert.ok(html.includes(`<span class="micro">Lordo mensile con EDR</span><b>${totale} €</b>`),rotta);
      assert.ok(!html.includes(`${totale} € lordi al mese su 14 mensilità`),rotta);
    }
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
