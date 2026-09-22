const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');

test('la landing usa la stessa intestazione delle pagine del sito senza stili dedicati',()=>{
  const leggi=nome=>fs.readFileSync(path.join(__dirname,nome),'utf8');
  const intestazione=html=>html.match(/<header class="site-header">[\s\S]*?<\/header>/)[0];
  assert.equal(intestazione(leggi('busta-paga.html')),intestazione(leggi('privacy.html')));
  assert.doesNotMatch(leggi('busta-paga-landing.css'),/bl-header/);
});

// Confine browser/API: codice del percorso reale, rete e DOM come ambiente esterno.
async function pagina(configurazione){
  const nodi=new Map(),prezzi=Array.from({length:3},()=>({textContent:'Report completo · prezzo da definire'}));
  const nodo=id=>{if(!nodi.has(id))nodi.set(id,{textContent:'',addEventListener(){}});return nodi.get(id);};
  const richieste=[];
  const sandbox={window:{BUSTA_PAGA_ACCESSO:{disponibile:true,leggi:()=>null}},
    document:{getElementById:nodo,querySelectorAll:selettore=>selettore==='[data-bp-prezzo]'?prezzi:[],addEventListener(){}},
    fetch:async url=>{richieste.push(url);return{json:async()=>configurazione};},
    AbortController,setTimeout,clearTimeout,Intl};
  const context=vm.createContext(sandbox);
  for(const nome of ['busta-paga-invio.js','busta-paga-percorso.js','busta-paga-landing.js']){
    vm.runInContext(fs.readFileSync(path.join(__dirname,nome),'utf8'),context);
  }
  await sandbox.window.BUSTA_PAGA_PERCORSO.pronto;
  await new Promise(resolve=>setImmediate(resolve));
  return{prezzi,nodi,richieste};
}

test('upload, offerta e CTA finale mostrano lo stesso prezzo server, esplicitamente di test',async()=>{
  const p=await pagina({ok:true,disponibile:true,prezzo:{test:true,importo:1234,valuta:'eur'}});
  for(const nodo of p.prezzi){assert.match(nodo.textContent,/12,34/);assert.match(nodo.textContent,/test/i);}
  assert.deepEqual(p.richieste,['/api/busta-paga?azione=configurazione']);
});

test('senza configurazione non viene inventato un prezzo né dichiarato il servizio pronto',async()=>{
  const p=await pagina({ok:false,codice:'CONFIGURAZIONE_MANCANTE'});
  for(const nodo of p.prezzi)assert.equal(nodo.textContent,'Report completo · prezzo da definire');
  assert.match(p.nodi.get('bp-configurazione').textContent,/non sono ancora disponibili/);
});

test('il prezzo live approvato dal server non viene presentato come test',async()=>{
  const p=await pagina({ok:true,disponibile:true,prezzo:{test:false,importo:2400,valuta:'eur'}});
  for(const nodo of p.prezzi){assert.match(nodo.textContent,/24,00/);assert.doesNotMatch(nodo.textContent,/test/);}
});

test('gli ingressi pubblici restano chiusi finché il rilascio commerciale non è approvato',()=>{
  const sandbox={window:{},document:{querySelector:()=>null}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'site-nav.js'),'utf8'),sandbox);
  const ingressi=sandbox.window.BUSTA_PAGA_INGRESSI;
  assert.equal(ingressi.attivo,false);
  assert.equal(ingressi.strumento(),'');
  assert.equal(ingressi.dopoRisultato(),'');
  assert.equal(ingressi.ctaBlog(),'/');
});
