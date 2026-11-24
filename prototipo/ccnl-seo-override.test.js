const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {test}=require('node:test');

/* RIC-231 passo 2: la SEO è un dato (ccnl-seo.config.js) e l'override di
   title/description (RIC-215) entra nei render come input. Seam: il modulo
   di configurazione e l'HTML che generate() scrive su disco. */
const SEO=require('./ccnl-seo.config.js');
const {generate,CONTRATTI_SEO,ROTTE,HUB,rottaTabella}=require('./genera-pagine-ccnl.js');

const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

test('il modulo di configurazione si carica senza generatore, dataset, motore o template',()=>{
  const prova=`require(${JSON.stringify(require.resolve('./ccnl-seo.config.js'))});
    const caricati=Object.keys(require.cache).map(f=>require('node:path').basename(f));
    process.stdout.write(JSON.stringify(caricati));`;
  const r=spawnSync(process.execPath,['-e',prova],{encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);
  const caricati=JSON.parse(r.stdout);
  for(const vietato of ['genera-pagine-ccnl.js','retribuzione-ccnl.js','motore.js','ccnl-page.template.js'])
    assert.ok(!caricati.includes(vietato),`${vietato} non deve essere caricato dalla config`);
});

test('il generatore ri-esporta gli stessi oggetti della configurazione',()=>{
  assert.equal(CONTRATTI_SEO,SEO.CONTRATTI_SEO);
  assert.equal(ROTTE,SEO.ROTTE);
  assert.equal(HUB,SEO.HUB);
  assert.equal(rottaTabella,SEO.rottaTabella);
});

test('ogni chiave di SEO_OVERRIDE è una rotta esistente',()=>{
  const chiavi=Object.keys(SEO.SEO_OVERRIDE);
  assert.ok(chiavi.length>0);
  for(const k of chiavi)assert.ok(SEO.ROTTE.includes(k),`${k} non è in ROTTE`);
});

test('ogni override arriva in title, description, og:title e og:description',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'seo-override-'));
  generate(dir,{alla:'2026-09-22'});
  for(const [rotta,{title,description}] of Object.entries(SEO.SEO_OVERRIDE)){
    const html=fs.readFileSync(path.join(dir,rotta,'index.html'),'utf8');
    const t=esc(title),d=esc(description);
    assert.ok(html.includes(`<title>${t}</title>`),`${rotta}: title`);
    assert.ok(html.includes(`<meta name="description" content="${d}">`),`${rotta}: description`);
    assert.ok(html.includes(`<meta property="og:title" content="${t}">`),`${rotta}: og:title`);
    assert.ok(html.includes(`<meta property="og:description" content="${d}">`),`${rotta}: og:description`);
  }
});
