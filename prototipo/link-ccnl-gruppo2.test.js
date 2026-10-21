const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {HUB}=require('./genera-pagine-ccnl.js');
const R=require('./retribuzione-ccnl.js');
const {eur}=require('./motore.js');

/* RIC-144: tre contratti si chiamano «metalmeccanico» e l'ABI non è il
   credito cooperativo. Leggono le pagine che `npm test` ha rigenerato. */
const leggi=rotta=>fs.readFileSync(path.join(__dirname,rotta,'index.html'),'utf8');
const link=html=>[...html.matchAll(/href="([^"]+)"/g)].map(m=>m[1].replace(/^(\.\.\/)+/,'/'));
const blocco=(html,aperto)=>{
  const i=html.indexOf(aperto);
  assert.notEqual(i,-1,`manca ${aperto}`);
  return html.slice(i,html.indexOf('</section>',i));
};
const ID={industria:'metalmeccanica-industria-c011',confapi:'metalmeccanica-pmi-confapi-c018',
  artigiano:'area-meccanica-artigianato-c030',bancari:'credito-abi-j241'};
const T=slug=>`/minimi-ccnl/${slug}/`;
const riquadro=html=>{
  const m=html.match(/<section class="ccnl-blocco ccnl-affiancato">[\s\S]*?<\/section>/);
  assert.ok(m,'riquadro assente');
  return m[0];
};

test('l\'hub, nella sezione dei nomi che si confondono, linka le tre tabelle metalmeccaniche e i bancari',()=>{
  const hub=leggi(HUB);
  const omonimi=blocco(hub,'<section class="ccnl-omonimi"');
  assert.match(omonimi,/<h2 id="omonimi-titolo">Nomi che si confondono<\/h2>/);
  assert.equal((omonimi.match(/<article>/g)||[]).length,4);
  const l=link(omonimi);
  for(const slug of ['metalmeccanico','metalmeccanico-confapi','metalmeccanico-artigiano','bancari'])
    assert.ok(l.includes(T(slug)),`l'hub non linka ${slug} dai nomi che si confondono`);
  assert.match(omonimi,/credito cooperativo/);
  assert.match(omonimi,/Conflavoro/);
});

test('la tabella industria linka artigiano e Confapi dal riquadro, con il minimo del 5° livello dal dataset',()=>{
  const html=leggi(T('metalmeccanico'));
  const r=riquadro(html);
  assert.match(r,/Lavori in un’azienda artigiana\?/);
  assert.deepEqual(link(r),[T('metalmeccanico-artigiano'),T('metalmeccanico-confapi')]);
  const quinto=R.livelli(ID.artigiano,new Date().toISOString().slice(0,10),'metalmeccanica-impianti').find(l=>l.codice==='5');
  assert.ok(r.includes(eur(quinto.totale)),`minimo ${quinto.totale} assente dal riquadro`);
  /* il riquadro sta dopo l'intro e prima delle tabelle */
  assert.ok(html.indexOf(r)>html.indexOf('</header>')&&html.indexOf(r)<html.indexOf('<table'));
});

test('la tabella artigiano linka industria e Confapi dal riquadro di ritorno',()=>{
  const r=riquadro(leggi(T('metalmeccanico-artigiano')));
  assert.match(r,/Lavori in un’industria metalmeccanica\?/);
  assert.deepEqual(link(r),[T('metalmeccanico'),T('metalmeccanico-confapi')]);
});

test('l\'articolo sul rinnovo metalmeccanici linka artigiano e Confapi',()=>{
  const html=leggi('/blog/rinnovo-ccnl-metalmeccanici/');
  const l=link(html);
  assert.ok(l.includes(T('metalmeccanico-confapi')));
  assert.ok(l.includes(T('metalmeccanico-artigiano')));
});

test('nei riquadri e nelle schede omonimi compaiono solo codici CNEL del dataset',()=>{
  const consentiti=new Set(Object.values(ID).map(id=>R.trovaContratto(id).codiceCnel));
  const schede=blocco(leggi(HUB),'<section class="ccnl-omonimi"').split('<article>').slice(3);
  assert.equal(schede.length,2);
  const testi=[...schede,
    riquadro(leggi(T('metalmeccanico'))),riquadro(leggi(T('metalmeccanico-artigiano')))]
    .map(h=>h.replace(/<[^>]+>/g,' ').replace(/href="[^"]*"/g,''));
  for(const t of testi){
    const trovati=t.match(/\b[A-Z]\d{3}\b|\b[A-Z]\d{2}[A-Z]\b/g)||[];
    for(const c of trovati)assert.ok(consentiti.has(c),`codice ${c} non è nel dataset`);
  }
  assert.doesNotMatch(testi.join(' '),/C049/);
});
