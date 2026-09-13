const {test}=require('node:test');
const assert=require('node:assert/strict');
const S=require('./netto-o-niente-scenari.js');
const G=require('./geografia.js');
test('fingerprint fiscali e vettori fissano la versione pubblicata',()=>{
  const fs=require('node:fs'),crypto=require('node:crypto');
  const manifest=require('./netto-o-niente.manifest.json');
  const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
  assert.equal(manifest.versione,S.VERSIONE);
  for(const [file,expected] of Object.entries(manifest.sources))
    assert.equal(hash(fs.readFileSync(require.resolve('./'+file))),expected,
      `${file} cambiato: rivedere versione, fixture, sequenze e compatibilità dei link prima di aggiornare il manifest`);
  for(const v of manifest.vettori){
    let precedenti=[];
    const rounds=Array.from({length:v.rounds},(_,i)=>{
      const r=S.generaConfronto({seed:v.seed,indice:i+1,precedenti});
      precedenti=[...precedenti,r.id].slice(-2);
      return{A:r.A,B:r.B,vincitore:r.vincitore,deltaCentesimi:r.deltaCentesimi};
    });
    assert.deepEqual(rounds[0],v.primo);assert.equal(hash(JSON.stringify(rounds)),v.sha256);
  }
});
function controlla(r,indice,precedenti){
  assert.equal(r.ok,true,`round ${indice}`);
  assert.equal(r.livello,S.livello(indice));
  assert.ok(r.vincitore);assert.ok(!precedenti.includes(r.id));
  assert.equal(r.id,S.identita(r.B,r.A));
  const tier=S.LIVELLI[r.livello],delta=Math.abs(r.deltaCentesimi);
  assert.ok(delta>=tier.min&&delta<=tier.max);
  assert.notEqual(r.A.ralRaw,r.B.ralRaw);
  const diff=Math.abs(Number(r.A.ralRaw)-Number(r.B.ralRaw));
  assert.ok(diff>=(indice<=3?4000:500)&&diff<=(indice<=3?10000:5000));
  for(const o of [r.A,r.B]){
    assert.ok(+o.ralRaw>=24000&&+o.ralRaw<=70000&&+o.ralRaw%500===0);
    assert.ok([13,14].includes(+o.mensilitaRaw));assert.deepEqual(o.nucleo,[]);
    assert.equal(o.buoniNumeroRaw,'');assert.equal(o.oreSettimanaliRaw,'');
    assert.equal(o.giorniPresenzaRaw,'');assert.equal(o.minutiViaggioRaw,'');
    assert.ok(+o.trasportoRaw>=0&&+o.trasportoRaw<=450&&+o.trasportoRaw%25===0);
    assert.ok(+o.altreSpeseRaw>=0&&+o.altreSpeseRaw<=150&&+o.altreSpeseRaw%25===0);
    assert.ok(+o.welfareRaw>=0&&+o.welfareRaw<=2500&&+o.welfareRaw%500===0);
    assert.ok(+o.fringeRaw>=0&&+o.fringeRaw<=2000&&+o.fringeRaw%500===0);
    if(indice<=3){assert.equal(+o.trasportoRaw,0);assert.equal(o.mensilitaRaw,'13');}
    if(indice<=7){assert.equal(+o.altreSpeseRaw,0);assert.equal(+o.welfareRaw,0);}
    if(indice<=12)assert.equal(o.comune,'F205');
    if(indice<=20)assert.equal(+o.fringeRaw,0);
    assert.ok(S.DOMICILI.includes(o.comune));
  }
  for(const lato of ['A','B'])assert.equal(r.esito.risultati[lato].riconciliazione.verificata,true);
}
test('cinque domicili risolti nel dataset reale',()=>{
  assert.deepEqual(S.DOMICILI.map(c=>G.risolvi(c).comune.nome),['Milano','Roma','Firenze','Vicenza','Verona']);
});
test('25 seed × 100 round: determinismo, margini, livelli, deduplica e plateau',()=>{
  for(let seed=0;seed<25;seed++){
    let precedenti=[];
    for(let indice=1;indice<=101;indice++){
      const args={seed,indice,precedenti};const r=S.generaConfronto(args);
      controlla(r,indice,precedenti);
      assert.deepEqual(S.generaConfronto({...args,target:999}),r);
      precedenti=[...precedenti,r.id].slice(-2);
    }
  }
});
test('1000 round avanzati: famiglie e posizioni entrambe fra 35% e 65%',()=>{
  let alte=0,latoA=0,ugualiConsecutivi=0,last;
  for(let i=0;i<1000;i++){
    const r=S.generaConfronto({seed:123456789,indice:21+i});
    assert.equal(r.ok,true);alte+=Number(r[r.vincitore].ralRaw)>Number(r[r.vincitore==='A'?'B':'A'].ralRaw);
    latoA+=r.vincitore==='A';ugualiConsecutivi+=last===r.vincitore;last=r.vincitore;
  }
  assert.ok(alte>=350&&alte<=650,`RAL alta ${alte}`);
  assert.ok(latoA>=350&&latoA<=650,`A ${latoA}`);
  assert.ok(ugualiConsecutivi>300,'nessuna alternanza costruita');
});
test('catalogo fallback: otto coppie valide per fascia, metà alta/metà bassa',()=>{
  const boundary=[1,4,8,13,21];
  for(let l=0;l<5;l++){
    assert.ok(S.FALLBACK[l].length>=8);const ids=new Set();let alte=0;
    for(const pair of S.FALLBACK[l]){
      const [A,B]=pair.map(S.daTupla),r=S.valutaConfronto(A,B);
      controlla({...r,A,B,id:S.identita(A,B),livello:l},boundary[l],[]);
      ids.add(S.identita(A,B));alte+=Number((r.vincitore==='A'?A:B).ralRaw)>Number((r.vincitore==='A'?B:A).ralRaw);
    }
    assert.equal(ids.size,S.FALLBACK[l].length);assert.equal(alte,l?4:8);
    for(let seed=0;seed<25;seed++){
      let precedenti=[];
      for(let n=0;n<5;n++){
        const args={seed,indice:boundary[l],precedenti,forzaFallback:true};
        const r=S.generaConfronto(args);controlla(r,boundary[l],precedenti);
        assert.deepEqual(r,S.generaConfronto(args));precedenti=[...precedenti,r.id].slice(-2);
      }
    }
  }
});
test('nessun fallback affidabile termina in errore tecnico',()=>{
  const C=require('./compara.js');
  const sandbox={module:{exports:{}},require:p=>p==='./compara.js'?{...C,confronta:()=>({ok:false})}:require(p)};
  require('node:vm').runInNewContext(require('node:fs').readFileSync(require.resolve('./netto-o-niente-scenari.js'),'utf8'),sandbox);
  const r=sandbox.module.exports.generaConfronto({seed:0,indice:21});
  assert.equal(r.ok,false);assert.equal(r.errore,'generazione');
});
