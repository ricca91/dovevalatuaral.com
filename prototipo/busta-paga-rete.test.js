const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const {webcrypto}=require('node:crypto');
const sorgente=n=>fs.readFileSync(path.join(__dirname,n),'utf8');
function browser({hash='',search='',storage=new Map(),fetch=async()=>({json:async()=>({ok:true})})}={}){
  const location={hash,search,pathname:'/busta-paga.html',origin:'https://esempio.test'};
  const sessionStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
  const sandbox={window:{},location,history:{replaceState(_,__,url){const u=new URL(url,location.origin);location.hash=u.hash;location.search=u.search;}},
    sessionStorage,URLSearchParams,crypto:webcrypto,Uint8Array,fetch,AbortController,setTimeout,clearTimeout};
  vm.runInNewContext(sorgente('busta-paga-accesso.js'),sandbox);
  vm.runInNewContext(sorgente('busta-paga-invio.js'),sandbox);
  return{...sandbox,storage};
}
test('recupero rimuove segreto e query dall’URL prima di analytics e conserva solo la chiave',()=>{
  const token='ab'.repeat(32),b=browser({hash:'#recupero='+token,search:'?ritorno=pagamento'});
  assert.equal(b.location.hash,'#bp-upload');assert.equal(b.location.search,'');
  assert.equal(b.window.BUSTA_PAGA_ACCESSO.leggi(),token);
  assert.deepEqual([...b.storage.keys()],['bp-accesso-v1']);
  const html=sorgente('busta-paga.html');assert.ok(html.indexOf('busta-paga-accesso.js')<html.indexOf('analytics-datafast.js'));
  assert.match(html,/<meta name="referrer" content="no-referrer">/);
});
test('rete invia solo testo e consenso, Authorization resta fuori dall’URL; retry riusa accesso',async()=>{
  const requests=[],b=browser({fetch:async(url,options)=>{requests.push({url,options});return{json:async()=>({ok:true,stato:'anteprima'})};}});
  await b.window.BUSTA_PAGA_INVIO.analizza('testo approvato');
  await b.window.BUSTA_PAGA_INVIO.analizza('testo approvato');
  assert.deepEqual(JSON.parse(requests[0].options.body),{testo:'testo approvato',consenso:true});
  assert.equal(requests[0].options.headers.Authorization,requests[1].options.headers.Authorization);
  assert.equal(requests[0].url,'/api/busta-paga?azione=analizza');
  assert.equal(requests[0].options.credentials,'omit');assert.equal(requests[0].options.referrerPolicy,'no-referrer');
  assert.ok(!JSON.stringify([...b.storage]).includes('testo approvato'));
  const nuovo=browser({storage:b.storage});assert.equal(nuovo.window.BUSTA_PAGA_ACCESSO.leggi(),b.window.BUSTA_PAGA_ACCESSO.leggi());
});
test('errore di rete non elimina accesso e non avvia retry automatici',async()=>{
  let n=0;const b=browser({fetch:async()=>{n++;throw Error('rete');}});
  const e=await b.window.BUSTA_PAGA_INVIO.analizza('testo');assert.equal(e.codice,'SERVIZIO_NON_DISPONIBILE');
  assert.equal(n,1);assert.ok(b.window.BUSTA_PAGA_ACCESSO.leggi());
});
