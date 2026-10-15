const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),zlib=require('node:zlib');
const {pack,unpack,source}=require('../processo/attrezzi/dati-browser.cjs');
const canonical=require('./dati-addizionali-2026.js').DATI_ADDIZIONALI_2026;
const plain=value=>JSON.parse(JSON.stringify(value));
function browser(){
  const context=vm.createContext({});
  vm.runInContext(source(canonical),context);
  for(const file of ['geografia.js','motore.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,file),'utf8'),context);
  return context;
}
test('codec deterministico, lossless per tutti i comuni, fonti e condizioni personali',()=>{
  const packed=pack(canonical);
  assert.deepEqual(unpack(packed),canonical);
  assert.equal(source(canonical),source(canonical));
  const context=browser();
  assert.deepEqual(plain(vm.runInContext('DATI_ADDIZIONALI_2026',context)),canonical);
  const geo=require('./geografia.js');
  assert.equal(canonical.comuni.length,7894);
  for(const c of canonical.comuni){
    const actual=vm.runInContext(`GEOGRAFIA_ITALIA.risolvi(${JSON.stringify(c.catastale)})`,context);
    assert.deepEqual(plain(actual),plain(geo.risolvi(c.catastale)),c.catastale);
  }
  for(const p of geo.province())assert.deepEqual(plain(vm.runInContext(`GEOGRAFIA_ITALIA.comuni(${p.id})`,context)),plain(geo.comuni(p.id)));
});
test('il pacchetto browser mantiene calcoli, soglie e ordine geografico',()=>{
  const context=browser(),engine=require('./motore.js'),geo=require('./geografia.js');
  assert.deepEqual(plain(vm.runInContext('GEOGRAFIA_ITALIA.regioni()',context)),plain(geo.regioni()));
  assert.deepEqual(plain(vm.runInContext('GEOGRAFIA_ITALIA.province()',context)),plain(geo.province()));
  for(const comune of ['F205','H501','L781','A952','B153','D612']){
    const options={comune,nucleo:[{tipo:'figlio',eta:22,reddito:0,disabilita:true}],fringe:'2500',buoniPasto:{tipo:'elettronici',valoreUnitario:'12',numero:220}};
    for(const ral of ['0','15000','28000','35000','50000','56224','122295','150000'])
      assert.deepEqual(plain(vm.runInContext(`calcola(${JSON.stringify(ral)},${JSON.stringify(options)})`,context)),plain(engine.calcola(ral,options)));
    assert.deepEqual(plain(vm.runInContext(`soglie(${JSON.stringify({comune})})`,context)),plain(engine.soglie({comune})));
  }
});
test('codec distingue chiavi assenti, null, zero, array e stringhe',()=>{
  const value={rows:[{a:null,b:0},{a:null,b:1},{b:0},{a:[],b:''},{a:[null,[1,2]],b:'è €'}]};
  assert.deepEqual(unpack(pack(value)),value);
  assert.throws(()=>pack(Object.fromEntries(Array.from({length:31},(_,i)=>['k'+i,i]))),/30 chiavi/);
});
test('trasferimento gzip del dato browser inferiore allo snapshot',()=>{
  const original=fs.readFileSync(path.join(__dirname,'dati-addizionali-2026.js'));
  assert.ok(zlib.gzipSync(source(canonical)).length<zlib.gzipSync(original).length*.85);
});
