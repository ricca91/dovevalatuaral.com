const {test}=require('node:test'),assert=require('node:assert/strict');
const L=require('../prototipo/netto-o-niente-link.js'),S=require('./risultato.js');
const page=require('../api/risultato.js'),image=require('../api/risultato-immagine.js');
const query={v:L.VERSIONE,s:'123456789',t:'12'};
function request(handler,queryValue=query,method='GET',headers={},url='/api/risultato'){
  const result={headers:{},statusCode:200,body:null};
  handler({query:queryValue,method,headers,url},{set statusCode(n){result.statusCode=n;},
    setHeader(k,v){result.headers[k.toLowerCase()]=v;},end(body){result.body=body;}});
  return result;
}
test('versione condivisa allineata al motore, senza dipendenze fiscali nel server',()=>{
  assert.equal(L.VERSIONE,require('../prototipo/netto-o-niente.js').VERSIONE);
  const deps=require('node:fs').readFileSync(require.resolve('./risultato.js'),'utf8');
  assert.doesNotMatch(deps,/require\(['"].*(?:motore|scenari|compara|netto-o-niente\.js)/);
});
test('query valide: zero, uint32 massimo e punteggio massimo',()=>{
  for(const s of ['0','4294967295'])for(const t of ['0','1','999999999999999']){
    const p={v:L.VERSIONE,s,t};assert.deepEqual(L.valida(p),p);
    assert.equal(S.modello(p).url,`${L.CANONICAL}/risultato/${L.VERSIONE}/${s}/${t}`);
  }
});
test('query non fidate: array/duplicati, chiavi extra, versione, enormi, HTML e numeri non canonici',()=>{
  // Query già normalizzata dalla piattaforma: il duplicato resta nell'URL originale.
  for(const suffix of ['?s=0','?t=0','?v=old','?x=1']){
    assert.equal(request(page,query,'GET',{},`/risultato/${query.v}/${query.s}/${query.t}${suffix}`).statusCode,400);
  }
  for(const p of [null,{}, {...query,x:'1'},{...query,s:['0','1']},{...query,t:['1','2']},
    {...query,v:'old'},...['-1','01','1.0','1e2','4294967296','<script>','9'.repeat(10000)].map(s=>({...query,s})),
    ...['-1','01','1.0','NaN','1000000000000000','<img>'].map(t=>({...query,t}))]){
    assert.equal(L.valida(p),null);assert.equal(request(page,p).statusCode,400);assert.equal(request(image,p).statusCode,400);
  }
});
test('HTML leggibile senza JS, OG e Twitter completi, CTA conserva la sfida',()=>{
  const m=S.modello(query),r=request(page);assert.equal(r.statusCode,200);
  assert.equal(r.headers['content-type'],'text/html; charset=utf-8');
  for(const tag of ['og:title','og:description','og:url','og:image','og:image:type','og:image:width','og:image:height','og:image:alt','twitter:card','twitter:image'])assert.ok(r.body.includes(tag));
  assert.ok(r.body.includes(m.immagine));assert.ok(r.body.includes('summary_large_image'));
  assert.ok(r.body.includes(m.gioco.replaceAll('&','&amp;')));assert.ok(r.body.includes('Accetta la sfida'));
  assert.doesNotMatch(r.body,/<script|http-equiv="refresh"/);assert.ok(r.body.includes('noindex,follow'));
  assert.equal(r.headers['x-robots-tag'],'noindex');
});
test('origin del server solo da configurazione, mai da host/header del client',()=>{
  assert.equal(S.origineServer({VERCEL_ENV:'production',VERCEL_URL:'foo.vercel.app'}),L.CANONICAL);
  assert.equal(S.origineServer({VERCEL_ENV:'preview',VERCEL_URL:'test-123.vercel.app'}),'https://test-123.vercel.app');
  for(const value of ['evil.com','foo.vercel.app/evil','foo.vercel.app@evil.com','foo.vercel.app\n'])assert.equal(S.origineServer({VERCEL_ENV:'preview',VERCEL_URL:value}),L.CANONICAL);
  const r=request(page,query,'GET',{host:'evil.com','x-forwarded-host':'evil.com'});assert.doesNotMatch(r.body,/evil\.com/);
});
test('GET/HEAD, cache pubblica, errori non memorizzati e metodi limitati',()=>{
  for(const handler of [page,image]){
    const r=request(handler,query,'HEAD');assert.equal(r.statusCode,200);assert.equal(r.body,undefined);
    assert.match(r.headers['cache-control'],/s-maxage=86400/);
    const invalid=request(handler,{});assert.equal(invalid.headers['cache-control'],'no-store');
    const post=request(handler,query,'POST');assert.equal(post.statusCode,405);assert.equal(post.headers.allow,'GET, HEAD');
  }
});
test('PNG reale 1200×630, font locali e output deterministico, diversi score',()=>{
  const a=request(image),b=request(image);assert.equal(a.statusCode,200);assert.equal(a.headers['content-type'],'image/png');
  assert.deepEqual(a.body,b.body);assert.deepEqual([...a.body.subarray(0,8)],[137,80,78,71,13,10,26,10]);
  assert.equal(a.body.readUInt32BE(16),1200);assert.equal(a.body.readUInt32BE(20),630);
  assert.ok(a.body.length>10000&&a.body.length<1000000);
  for(const t of ['0','1','999999999999999']){const r=request(image,{...query,t});assert.equal(r.statusCode,200);assert.notDeepEqual(r.body,a.body);}
});
test('SVG non contiene input liberi né risorse esterne; grandi score non allargano il canvas',()=>{
  const s=S.svg(S.modello({...query,t:'999999999999999'}));
  assert.ok(s.includes('width="1200"'));assert.ok(s.includes('999.999.999.999.999'));
  assert.doesNotMatch(s,/<image|<script|foreignObject|href=/);
});
