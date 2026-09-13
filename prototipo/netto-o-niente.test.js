const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('./compara.js'),N=require('./netto-o-niente.js'),S=require('./netto-o-niente-scenari.js');
const off=(ral,extra={})=>({...C.offertaVuota(),ralRaw:String(ral),...extra});
const row=(r,k)=>r.esito.righe.find(x=>x.chiave===k);
const fixtures=[
  ['base',off(24000),off(30000),[1996783,2342549],[0,0],'B'],
  ['costi',off(38000,{mensilitaRaw:'14',trasportoRaw:'220'}),off(36000,{trasportoRaw:'30'}),[2723870,2645239],[264000,36000],'B'],
  ['mensilità',off(35000),off(35000,{mensilitaRaw:'14'}),[2603217,2603217],[0,0],null],
  ['welfare',off(35000,{welfareRaw:'2000'}),off(35500),[2603217,2625572],[0,0],'B'],
  ['geografia',off(35000),off(35000,{comune:'H501'}),[2603217,2563698],[0,0],'A'],
  ['fringe',off(35000,{fringeRaw:'1500'}),off(35000),[2514905,2603217],[0,0],'B'],
];
for(const [name,A,B,net,cost,winner] of fixtures)test(`fixture ${name}, catena e inversione A/B`,()=>{
  const r=N.valutaConfronto(A,B),reverse=N.valutaConfronto(B,A);
  assert.equal(r.ok,true);assert.equal(r.vincitore,winner);
  assert.deepEqual([row(r,'netto').a,row(r,'netto').b],net);
  assert.deepEqual([row(r,'costi').a,row(r,'costi').b],cost);
  assert.deepEqual([row(r,'dopoCosti').a,row(r,'dopoCosti').b],net.map((v,i)=>v-cost[i]));
  assert.equal(reverse.deltaCentesimi+r.deltaCentesimi,0);
  assert.equal(reverse.vincitore,winner===null?null:winner==='A'?'B':'A');
  for(const lato of ['A','B']){
    const f=S.catenaContabile(r.esito.risultati[lato]);
    assert.equal(f.ral-f.contributi-f.imposte+f.integrazioni,f.netto);
  }
});
test('100 euro mensili tolgono 1200 annui; welfare non modifica il contante',()=>{
  const A=off(35000),B=off(35000,{trasportoRaw:'100',welfareRaw:'2500'}),r=N.valutaConfronto(A,B);
  assert.equal(row(r,'netto').delta,0);assert.equal(r.deltaCentesimi,-120000);
  assert.equal(row(r,'benefit').delta,250000);
});
test('rifiuta errore, riconciliazione falsa, avvisi, importi non finiti e disponibilità negativa',()=>{
  assert.equal(N.valutaConfronto(off('no'),off(35000)).ok,false);
  assert.equal(N.valutaConfronto(off(35000,{trasportoRaw:'999999'}),off(35000)).ok,false);
  const original=C.confronta;
  for(const corrupt of [e=>e.risultati.A.riconciliazione.verificata=false,
    e=>e.avvisi.A.push('inaffidabile'),e=>e.risultati.B.kpi.nettoInBusta=Infinity,
    e=>e.righe.find(r=>r.chiave==='dopoCosti').a=Number.MAX_SAFE_INTEGER+1]){
    const sandbox={module:{exports:{}},require:p=>p==='./compara.js'?{...C,confronta:(a,b)=>{const r=original(a,b);corrupt(r.esito);return r;}}:require(p)};
    require('node:vm').runInNewContext(require('node:fs').readFileSync(require.resolve('./netto-o-niente-scenari.js'),'utf8'),sandbox);
    assert.equal(sandbox.module.exports.valutaConfronto(off(35000),off(40000)).ok,false);
  }
});
test('spiegazioni derivano da inversione effettiva e quota fringe del motore',()=>{
  const [,A,B]=fixtures[1],r={...N.valutaConfronto(A,B),A,B};
  assert.equal(N.costruisciSpiegazione(r).frase,"A porta 786,31 € netti in più, ma richiede 2.280,00 € di costi aggiuntivi. Con B restano 1.493,69 € in più all'anno dopo i costi indicati.");
  const f=off(35000,{fringeRaw:'1500'}),g=off(35000);
  assert.match(N.costruisciSpiegazione({...N.valutaConfronto(f,g),A:f,B:g}).note.join(' '),/1.500,00 € di fringe sono imponibili/);
  const base=fixtures[0];
  assert.doesNotMatch(N.costruisciSpiegazione({...N.valutaConfronto(base[1],base[2]),A:base[1],B:base[2]}).frase,/costi aggiuntivi/);
});
test('codec del comparatore conserva input, orientamento, netto e costi al centesimo',()=>{
  for(const [,A,B] of fixtures){
    const decoded=C.decodificaStato(C.codificaStato({A,B}));
    assert.equal(decoded.ok,true);
    const r=N.valutaConfronto(decoded.stato.A,decoded.stato.B),original=N.valutaConfronto(A,B);
    for(const k of ['netto','costi','dopoCosti'])assert.deepEqual(row(r,k),row(original,k));
  }
});
test('primo errore, dieci corrette poi errore, doppia risposta e nessuno skip',()=>{
  let s=N.creaPartita({seed:0});
  assert.strictEqual(N.prossimo(s),s);
  let end=N.rispondi(s,s.round.vincitore==='A'?'B':'A');
  assert.equal(end.score,0);assert.equal(end.fase,'FINE');assert.equal(end.indice,1);
  assert.strictEqual(N.rispondi(end,'A'),end);assert.strictEqual(N.prossimo(end),end);
  for(let i=0;i<10;i++){
    s=N.rispondi(s,s.round.vincitore);assert.equal(s.score,i+1);
    assert.strictEqual(N.rispondi(s,'A'),s);s=N.prossimo(s);
  }
  end=N.rispondi(s,s.round.vincitore==='A'?'B':'A');
  assert.equal(end.score,10);assert.equal(end.indice,11);
});
const replay=s=>{const it=N.ripristinaRun(N.leggiRun(N.salvaRun(s)));let n;do{n=it.next();}while(!n.done);return n.value;};
test('replay prima scelta, rivelazione, prossimo e sconfitta non duplica punti',()=>{
  let s=N.creaPartita({seed:4294967295,target:10});assert.deepEqual(replay(s),s);
  for(let i=0;i<25;i++){
    s=N.rispondi(s,s.round.vincitore);assert.deepEqual(replay(s),s);
    s=N.prossimo(s);assert.deepEqual(replay(s),s);
  }
  s=N.rispondi(s,s.round.vincitore==='A'?'B':'A');assert.deepEqual(replay(s),s);
  const raw=N.leggiRun(N.salvaRun(s));raw.scelte.push('A','B');raw.fase='DOMANDA';raw.score=999;
  const it=N.ripristinaRun(raw);let n;do{n=it.next();}while(!n.done);
  assert.equal(n.value.score,25);assert.equal(n.value.fase,'FINE');assert.equal(n.value.scelte.length,26);
});
test('storage corrotto e record zero',()=>{
  for(const raw of ['null','{}','{','{"seed":-1}','<script>'])assert.equal(N.leggiRun(raw),null);
  assert.equal(N.leggiRecord('0'),0);assert.equal(N.leggiRecord('10'),10);
  for(const raw of [null,'','-1','1e2','NaN','00','9007199254740992'])assert.equal(N.leggiRecord(raw),null);
});
test('codec sfida, limiti numerici e target non modifica la sequenza',()=>{
  for(const seed of [0,1,4294967295])for(const target of [0,1,10,999999999999999]){
    const encoded=N.codificaSfida({seed,target});
    assert.deepEqual(N.decodificaSfida('#'+encoded),{ok:true,sfida:{seed,target}});
    assert.deepEqual(N.creaPartita({seed,target}).round,N.creaPartita({seed}).round);
  }
  assert.deepEqual(N.decodificaSfida(''),{ok:true,sfida:null});
  for(const fragment of ['v=x&s=0&t=0','v='+N.VERSIONE+'&s=0&t=0&s=1',
    'v='+N.VERSIONE+'&s=0&t=0&x=1','s=0&t=0','a'.repeat(513),
    ...['-1','1.2','1e2','NaN','Infinity','4294967296','00','+1','<img>'].map(s=>`v=${N.VERSIONE}&s=${s}&t=0`),
    ...['-1','1.2','1e2','NaN','Infinity','1000000000000000','9007199254740992'].map(t=>`v=${N.VERSIONE}&s=0&t=${t}`)])
    assert.equal(N.decodificaSfida(fragment).ok,false,fragment);
  assert.equal(N.decodificaSfida('v=x&s=0&t=0').errore,'versione');
});
test('share richiede run conclusa e usa la run, non record o target',()=>{
  let s=N.creaPartita({seed:0,target:500});assert.throws(()=>N.testoSfida(s));
  s=N.rispondi(s,s.round.vincitore==='A'?'B':'A');
  assert.match(N.testoSfida(s).testo,/Mi sono fermato al primo confronto/);
  assert.match(N.testoSfida(s).url,/&t=0$/);
  assert.match(N.testoSfida({...s,score:1}).testo,/azzeccato 1 /);
  assert.match(N.testoSfida({...s,score:10}).testo,/azzeccati 10 /);
});
test('errore di generazione preserva checkpoint e punteggio',()=>{
  let s=N.creaPartita({seed:0});s=N.rispondi(s,s.round.vincitore);
  const original=S.generaConfronto;
  try{S.generaConfronto=()=>({ok:false});const e=N.prossimo(s);
    assert.equal(e.fase,'ERRORE');assert.equal(e.score,1);assert.equal(e.indice,1);
    assert.equal(N.leggiRun(N.salvaRun(e)).fase,'RIVELAZIONE');
  }finally{S.generaConfronto=original;}
});
