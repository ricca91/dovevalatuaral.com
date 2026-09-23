const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {test}=require('node:test');
const {ROTTE,CONTRATTI_SEO,generate}=require('./genera-pagine-ccnl.js');
const {sitemap,RALS}=require('./genera-pagine-ral.js');
const R=require('./retribuzione-ccnl.js');
const {calcola,applicaMensilita,eur}=require('./motore.js');

const ORIGIN='https://www.dovevalatuaral.com';
const ALLA='2026-09-22';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'minimi-ccnl-'));
generate(dir,{alla:ALLA});
const leggi=rotta=>fs.readFileSync(path.join(dir,rotta,'index.html'),'utf8');
const testo=html=>html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
const uno=(html,re,label)=>{const m=[...html.matchAll(re)];assert.equal(m.length,1,label);return m[0][1];};

test('le rotte sono quelle decise dai volumi di ricerca, non una per riga del dataset',()=>{
  assert.equal(ROTTE.length,48);
  assert.equal(new Set(ROTTE).size,ROTTE.length);
  const perContratto=Object.fromEntries(CONTRATTI_SEO.map(c=>[c.slug,ROTTE.filter(r=>r.startsWith(`/minimi-ccnl/${c.slug}/`)&&r!==`/minimi-ccnl/${c.slug}/`).length]));
  assert.deepEqual(perContratto,{commercio:4,metalmeccanico:9,'pubblici-esercizi':0,turismo:4,'agenzie-di-viaggio':0,logistica:0,
    multiservizi:4,'studi-professionali':4,'cooperative-sociali':8,dmo:0,'metalmeccanico-confapi':0,
    'grafici-editoriali':0,poligrafici:0,vetro:0});
  for(const rotta of ['/minimi-ccnl/','/minimi-ccnl/commercio/5-livello/','/minimi-ccnl/metalmeccanico/livello-c3/',
    '/minimi-ccnl/cooperative-sociali/livello-d2/','/minimi-ccnl/studi-professionali/4s-livello/'])
    assert.ok(ROTTE.includes(rotta),rotta);
  /* Tabelle per tutti e quattordici i contratti del dataset. */
  assert.deepEqual(new Set(CONTRATTI_SEO.map(c=>c.id)),new Set(R.CONTRATTI.map(c=>c.id)));
  for(const rotta of ROTTE)assert.doesNotMatch(rotta,/stipendio/);
});

test('il generatore scrive esattamente le rotte dichiarate',()=>{
  const scritte=[];
  (function scorri(rel){
    for(const e of fs.readdirSync(path.join(dir,rel),{withFileTypes:true})){
      if(e.isDirectory())scorri(path.join(rel,e.name));
      else scritte.push(`/${rel.split(path.sep).join('/')}/`);
    }
  })('minimi-ccnl');
  assert.deepEqual(scritte.sort(),[...ROTTE].sort());
});

test('gli importi escono dal dataset: riscontro con le tabelle pubblicate',()=>{
  /* Valori attesi presi dalle fonti (Filcams H011, FIM C011, testo T151),
     non dalla funzione sotto test. */
  const casi=[
    ['/minimi-ccnl/commercio/5-livello/','1.660,08 €','23.241,12 €','1° novembre 2025',14],
    ['/minimi-ccnl/metalmeccanico/livello-c3/','2.211,43 €','28.748,59 €','1° giugno 2026',13],
    ['/minimi-ccnl/cooperative-sociali/livello-d2/','1.727,83 €','23.325,71 €','1° ottobre 2025',13.5],
  ];
  for(const [rotta,minimo,ral,decorrenza,mensilita] of casi){
    const t=testo(leggi(rotta));
    assert.ok(t.includes(minimo),`${rotta}: minimo`);
    assert.ok(t.includes(ral),`${rotta}: RAL`);
    assert.ok(t.includes(`in vigore dal ${decorrenza}`),`${rotta}: decorrenza`);
    /* Il netto è quello del motore, non una seconda formula. */
    const numero=Number(ral.replace(/[.\s€]/g,'').replace(',','.'));
    const atteso=applicaMensilita(calcola(String(numero),{comune:'F205',nucleo:[]}),mensilita).kpi.mediaMensile;
    assert.ok(t.includes(eur(atteso)),`${rotta}: netto ${eur(atteso)}`);
  }
});

test('ogni pagina ha title, description, H1 e canonical propri, e il breadcrumb strutturato coincide con quello visibile',()=>{
  const titoli=new Set(),descrizioni=new Set();
  for(const rotta of ROTTE){
    const html=leggi(rotta);
    const titolo=uno(html,/<title>([^<]+)<\/title>/g,`${rotta}: title`);
    const descrizione=uno(html,/<meta name="description" content="([^"]+)">/g,`${rotta}: description`);
    uno(html,/<h1>([^<]+)<\/h1>/g,`${rotta}: h1`);
    assert.equal(uno(html,/<link rel="canonical" href="([^"]+)">/g,`${rotta}: canonical`),`${ORIGIN}${rotta}`);
    assert.ok(!titoli.has(titolo),`title duplicato: ${titolo}`);
    assert.ok(!descrizioni.has(descrizione),`description duplicata: ${rotta}`);
    titoli.add(titolo);descrizioni.add(descrizione);
    assert.ok(titolo.length<=75,`${rotta}: title di ${titolo.length} caratteri`);
    assert.match(titolo,/2026/);
    assert.doesNotMatch(html,/undefined|NaN|\[object/);
    const ld=JSON.parse(uno(html,/<script type="application\/ld\+json">([^<]+)<\/script>/g,`${rotta}: json-ld`));
    assert.equal(ld['@type'],'BreadcrumbList');
    const visibili=[...uno(html,/<div class="shell breadcrumb__in">([\s\S]*?)<\/div>/g,'breadcrumb')
      .matchAll(/>([^<>›]+)<\/(?:a|span)>/g)].map(m=>m[1]);
    assert.deepEqual(ld.itemListElement.map(i=>i.name),visibili,rotta);
    assert.equal(ld.itemListElement.at(-1).item,`${ORIGIN}${rotta}`);
  }
});

test('hub e tabelle collegano tutte le pagine: nessuna orfana, nessun link rotto',()=>{
  const collegate=new Set(['/minimi-ccnl/']);
  for(const rotta of ROTTE){
    for(const [,href] of leggi(rotta).matchAll(/href="([^"#]+)(?:#[^"]*)?"/g)){
      if(/^(https?:|data:|\/blog\/)/.test(href))continue;
      const assoluto=new URL(href,`${ORIGIN}${rotta}`);
      if(assoluto.pathname.startsWith('/minimi-ccnl/')){
        assert.ok(ROTTE.includes(assoluto.pathname),`${rotta} → ${href}`);
        if(assoluto.pathname!==rotta)collegate.add(assoluto.pathname);
      }else{
        const file=assoluto.pathname.endsWith('/')?`${assoluto.pathname}index.html`:assoluto.pathname;
        assert.ok(fs.existsSync(path.join(__dirname,file)),`${rotta} → ${href}`);
      }
    }
  }
  assert.deepEqual([...collegate].sort(),[...ROTTE].sort());
});

test('i link al calcolatore portano contratto, sezione e livello che il dataset conosce',()=>{
  let visti=0;
  for(const rotta of ROTTE)for(const [,href] of leggi(rotta).matchAll(/href="[./]*ccnl-livello\.html\?([^"]+)"/g)){
    const q=new URLSearchParams(href.replaceAll('&amp;','&'));
    const id=q.get('ccnl');
    assert.ok(R.trovaContratto(id),`${rotta}: ${id}`);
    const sezione=q.get('sezione');
    if(R.sezioni(id).length&&q.get('livello'))assert.ok(sezione,`${rotta}: manca la sezione`);
    if(q.get('livello'))assert.ok(R.trovaLivello(id,q.get('livello'),ALLA,sezione),`${rotta}: ${q}`);
    visti++;
  }
  assert.ok(visti>=ROTTE.length);
  assert.match(leggi('/minimi-ccnl/commercio/5-livello/'),/ccnl-livello\.html\?ccnl=terziario-confcommercio-h011&amp;livello=5"/);
});

test('le pagine per livello mostrano scatti, part-time e tranche futura solo dove il contratto li documenta',()=>{
  const commercio=testo(leggi('/minimi-ccnl/commercio/5-livello/'));
  assert.ok(commercio.includes('Ogni scatto vale 20,30 €'));
  assert.ok(commercio.includes('30 anni · 10 scatti'));
  assert.ok(commercio.includes('Dal 1° novembre 2026 la tranche già firmata'));
  assert.ok(commercio.includes('20 ore'));
  const multiservizi=testo(leggi('/minimi-ccnl/multiservizi/2-livello/'));
  assert.doesNotMatch(multiservizi,/Ogni scatto vale/);
  assert.ok(multiservizi.includes('uguale per impiegati e quadri e per operai'));
});

test('«Turismo» a un livello mostra anche il contratto dei pubblici esercizi',()=>{
  const t=testo(leggi('/minimi-ccnl/turismo/5-livello/'));
  const fipe=R.componiRal({ccnl:'pubblici-esercizi-fipe-h05y',sezione:'generale',livello:'5',alla:ALLA});
  assert.ok(t.includes('Lavori in un bar, un ristorante o una mensa?'));
  assert.ok(t.includes(eur(fipe.baseMensile)));
  assert.ok(t.includes('1.590,27 €'));
});

test('«Turismo» nell’hub porta anche alle agenzie di viaggio',()=>{
  const hub=leggi('/minimi-ccnl/');
  assert.ok(testo(hub).includes('«Turismo» sono tre contratti'));
  assert.match(hub,/href="\.\.\/minimi-ccnl\/agenzie-di-viaggio\/"/);
  /* 1° livello da settembre 2026: 2.066,27 €, art. 147. */
  assert.ok(testo(leggi('/minimi-ccnl/agenzie-di-viaggio/')).includes('2.066,27 €'));
});

test('fonti non firmatarie e contratti scaduti lo dichiarano in pagina',()=>{
  const poligrafici=testo(leggi('/minimi-ccnl/poligrafici/'));
  assert.ok(poligrafici.includes('in vigore dal 1° aprile 2021'));
  assert.ok(poligrafici.includes('scaduto il 31 dicembre 2022'));
  for(const rotta of ROTTE.filter(r=>r.split('/').length===4&&r!=='/minimi-ccnl/')){
    assert.match(testo(leggi(rotta)),/Verificata il \d/,rotta);
  }
});

test('a una tranche nuova le pagine si rigenerano con la tabella che decorre',()=>{
  const dopo=fs.mkdtempSync(path.join(os.tmpdir(),'minimi-ccnl-nov-'));
  generate(dopo,{alla:'2026-11-01'});
  const t=testo(fs.readFileSync(path.join(dopo,'minimi-ccnl/commercio/5-livello/index.html'),'utf8'));
  assert.ok(t.includes('in vigore dal 1° novembre 2026'));
  assert.ok(t.includes('1.691,70 €'));
  assert.ok(!t.includes('1.660,08 €'));
});

test('un solo sitemap raccoglie RAL, CCNL e blog senza doppioni',()=>{
  const locs=[...sitemap([{slug:'prova',data_aggiornamento:'2026-09-22'}]).matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
  assert.equal(new Set(locs).size,locs.length);
  for(const rotta of ROTTE)assert.ok(locs.includes(`${ORIGIN}${rotta}`),rotta);
  for(const ral of RALS)assert.ok(locs.includes(`${ORIGIN}/ral-${ral}-netto/`));
  assert.ok(locs.includes(`${ORIGIN}/blog/prova/`));
});

/* RIC-77: il Vetro esclude il premio speciale di giugno, quindi la sua
   cifra annua non si chiama RAL da nessuna parte e il netto è dichiarato
   parziale. Le altre tabelle continuano a chiamarla RAL. */
test('Vetro: base tabellare annualizzata, non RAL, e netto dichiarato parziale',()=>{
  const html=leggi('/minimi-ccnl/vetro/');
  const t=testo(html);
  assert.doesNotMatch(html,/<th scope="col">RAL<\/th>/);
  assert.match(html,/<th scope="col">Base tabellare annualizzata<\/th>/);
  assert.match(html,/<th scope="col">Netto medio al mese sulla base parziale<\/th>/);
  assert.doesNotMatch(t,/RAL su 13 mensilità/);
  assert.ok(t.includes('Non è la RAL contrattuale completa: manca il premio speciale di giugno previsto dall’art. 34'));
  assert.ok(t.includes('Anche il netto mostrato è quindi sottostimato'));
  /* Trasformazione 5: 2.245,46 × 13 = 29.190,98, cifra della tabella. */
  assert.ok(t.includes('29.190,98 €'));
  assert.doesNotMatch(leggi('/minimi-ccnl/vetro/').match(/<title>[^<]*/)[0],/RAL/);
  const commercio=leggi('/minimi-ccnl/commercio/');
  assert.match(commercio,/<th scope="col">RAL<\/th>/);
  assert.doesNotMatch(testo(commercio),/Base tabellare annualizzata/);
});

test('hub: il Vetro è segnalato come copertura parziale, fuori dai confronti di RAL',()=>{
  const html=leggi('/minimi-ccnl/');
  const card=html.match(/<a class="hub-card" href="[^"]*vetro\/">[\s\S]*?<\/a>/)[0];
  assert.match(testo(card),/Copertura parziale: la cifra annua non comprende il premio speciale di giugno/);
  assert.equal((html.match(/Copertura parziale/g)||[]).length,1);
  assert.match(testo(html),/Per il CCNL Vetro la cifra annua è una base tabellare parziale e non va confrontata con la RAL degli altri contratti/);
});
