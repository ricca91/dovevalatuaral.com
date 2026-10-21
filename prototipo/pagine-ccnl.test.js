const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {test}=require('node:test');
const {ROTTE,CONTRATTI_SEO,generate,datiContratto}=require('./genera-pagine-ccnl.js');
const {titoloLivello,renderHub}=require('./ccnl-page.template.js');
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
  assert.equal(ROTTE.length,103);
  assert.equal(new Set(ROTTE).size,ROTTE.length);
  const perContratto=Object.fromEntries(CONTRATTI_SEO.map(c=>[c.slug,ROTTE.filter(r=>r.startsWith(`/minimi-ccnl/${c.slug}/`)&&r!==`/minimi-ccnl/${c.slug}/`).length]));
  assert.deepEqual(perContratto,{commercio:8,metalmeccanico:9,'pubblici-esercizi':0,turismo:4,'agenzie-di-viaggio':0,logistica:4,
    multiservizi:6,'studi-professionali':6,'cooperative-sociali':13,dmo:4,'metalmeccanico-confapi':0,
    'grafici-editoriali':0,poligrafici:0,vetro:0,'metalmeccanico-artigiano':6,'industria-alimentare':3,
    'chimico-farmaceutico':9,'gomma-plastica':7,bancari:4});
  for(const rotta of ['/minimi-ccnl/','/minimi-ccnl/commercio/5-livello/','/minimi-ccnl/metalmeccanico/livello-c3/',
    '/minimi-ccnl/cooperative-sociali/livello-d2/','/minimi-ccnl/studi-professionali/4s-livello/'])
    assert.ok(ROTTE.includes(rotta),rotta);
  /* Tabelle per tutti i contratti del dataset. */
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

test('Commercio: 1°, 6°, 7° e Quadro hanno pagina, link dalla tabella e sitemap (RIC-96)',()=>{
  const tabella=leggi('/minimi-ccnl/commercio/');
  const xml=sitemap();
  for(const [codice,slug,etichetta] of [
    ['1','1-livello','1° livello'],['6','6-livello','6° livello'],
    ['7','7-livello','7° livello'],['Q','quadro','Quadro'],
  ]){
    const rotta=`/minimi-ccnl/commercio/${slug}/`;
    assert.ok(ROTTE.includes(rotta),rotta);
    const html=leggi(rotta);
    assert.ok(html.includes(`<h1>${etichetta} CCNL Commercio: minimo, RAL e netto</h1>`),rotta);
    assert.ok(html.includes(`livello=${codice}"`),`${rotta}: calcolatore`);
    assert.ok(tabella.includes(`<th scope="row"><a href="../../minimi-ccnl/commercio/${slug}/">${etichetta}</a></th>`),`${rotta}: tabella`);
    assert.ok(xml.includes(`<loc>${ORIGIN}${rotta}</loc>`),`${rotta}: sitemap`);
    assert.doesNotMatch(html,/Q° livello/);
  }
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

test('il title delle pagine livello porta il netto mensile della pagina, all’euro, entro 60 caratteri (RIC-99)',()=>{
  const livelli=ROTTE.filter(r=>r.split('/').filter(Boolean).length===3);
  assert.equal(livelli.length,83);
  for(const rotta of livelli){
    const html=leggi(rotta);
    const titolo=uno(html,/<title>([^<]+)<\/title>/g,`${rotta}: title`);
    assert.ok(titolo.length<=60,`${rotta}: title di ${titolo.length} caratteri — ${titolo}`);
    /* La cifra è quella in grassetto nell'apertura, arrotondata: nessun secondo calcolo. */
    const apertura=uno(html,/<b>([\d.,]+) € netti al mese<\/b>/g,`${rotta}: netto in apertura`);
    const intero=String(Math.round(Number(apertura.replace(/\./g,'').replace(',','.'))))
      .replace(/\B(?=(\d{3})+(?!\d))/g,'.');
    assert.ok(titolo.includes(` 2026: ${intero} € netti`),`${rotta}: ${titolo} invece di ${intero} €`);
    assert.equal(uno(html,/<meta property="og:title" content="([^"]+)">/g,`${rotta}: og:title`),titolo);
  }
  /* Forma piena dove ci sta; Studi professionali sfora e perde prima
     «CCNL», poi (solo il 4° super) «al mese». */
  const forme=[
    ['/minimi-ccnl/turismo/6-livello/',/^6° livello CCNL Turismo 2026: [\d.]+ € netti al mese$/],
    ['/minimi-ccnl/metalmeccanico/livello-c3/',/^Livello C3 metalmeccanico 2026: [\d.]+ € netti al mese$/],
    ['/minimi-ccnl/cooperative-sociali/livello-d2/',/^Livello D2 cooperative sociali 2026: [\d.]+ € netti al mese$/],
    ['/minimi-ccnl/studi-professionali/3-livello/',/^3° livello Studi professionali 2026: [\d.]+ € netti al mese$/],
    ['/minimi-ccnl/studi-professionali/4s-livello/',/^4° livello super Studi professionali 2026: [\d.]+ € netti$/],
  ];
  for(const [rotta,forma] of forme)assert.match(uno(leggi(rotta),/<title>([^<]+)<\/title>/g,rotta),forma);
});

test('un title di livello che non sta in 60 caratteri nemmeno accorciato ferma la build',()=>{
  assert.equal(titoloLivello('2° livello','CCNL Turismo',1296.4),'2° livello CCNL Turismo 2026: 1.296 € netti al mese');
  assert.equal(titoloLivello('2° livello','CCNL Turismo',999.5),'2° livello CCNL Turismo 2026: 1.000 € netti al mese');
  assert.throws(()=>titoloLivello('4° livello super','CCNL Studi professionali e affini',1390),RangeError);
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

/* RIC-111: la tabella della Logistica diceva che il passaggio di
   parametro del rider non è automatico. Il CCNL (art. 6) lo fa
   scattare dopo 6 mesi e, sui ciclomotori, dopo ulteriori 9. */
test('la tabella della Logistica dice che il parametro del rider cresce con l’anzianità',()=>{
  const pagina=testo(leggi('/minimi-ccnl/logistica/'));
  assert.doesNotMatch(pagina,/non è automatico/);
  assert.ok(pagina.includes('chi usa cicli passa dal 110 al 116 dopo 6 mesi'));
  assert.ok(pagina.includes('al 119 dopo ulteriori 9 mesi'));
  assert.ok(pagina.includes('Rider su cicli — I, parametro 110 (primi 6 mesi)'));
  assert.ok(pagina.includes('Rider su ciclomotori e motocicli — L, parametro 119 (dopo 15 mesi)'));
});

/* Artt. 94 e 103 del CCNL ABI: primo scatto dopo 4 anni, poi ogni 3,
   dal primo del mese in cui matura; anzianità sospesa dal 1° gennaio
   2013 al 31 luglio 2014. La tabella lo dice come la pagina CCNL e
   livello; le tabelle degli altri contratti restano come prima. */
test('la tabella dei Bancari dice cadenza, decorrenza nel mese e periodo sospeso degli scatti',()=>{
  const t=testo(leggi('/minimi-ccnl/bancari/'));
  const sospensione=' L’anzianità non matura dal 1° gennaio 2013 al 31 luglio 2014 (art. 94 c. 5 e art. 103 c. 3).';
  for(const massimo of [8,7])
    assert.ok(t.includes(`Scatti: fino a ${massimo} scatti, il primo dopo 4 anni e poi uno ogni 3, `+
      `ciascuno dal primo giorno del mese in cui matura.${sospensione} Nessuna tranche successiva è firmata.`),String(massimo));
  assert.ok(testo(leggi('/minimi-ccnl/commercio/')).includes('Scatti: fino a 10 scatti, uno ogni 3 anni. La prossima tranche'));
  assert.doesNotMatch(testo(leggi('/minimi-ccnl/commercio/')),/non matura|mese in cui matura/);
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

/* Il numero di contratti nell'hub viene da quelli che il template
   riceve: un contratto in più nel dataset non lascia un «diciannove»
   scritto a mano. */
test('l’hub conta i contratti che riceve, nell’apertura e nella description',()=>{
  const descrizione=html=>uno(html,/<meta name="description" content="([^"]+)">/g,'description');
  const hub=leggi('/minimi-ccnl/');
  assert.ok(testo(hub).includes('19 contratti collettivi, livello per livello'));
  assert.match(descrizione(hub),/^Tabelle retributive 2026 di 19 CCNL, dal Commercio ai Bancari/);
  const due=renderHub({contratti:CONTRATTI_SEO.slice(0,2).map(c=>datiContratto(c,ALLA)),alla:ALLA});
  assert.ok(testo(due).includes('2 contratti collettivi, livello per livello'));
  assert.match(descrizione(due),/^Tabelle retributive 2026 di 2 CCNL/);
  assert.doesNotMatch(testo(due),/iciannove/);
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

test('Commercio: entrambe le tranche mostrano lordo e netto prima/dopo per tutti i livelli (RIC-95)',()=>{
  const html=leggi('/minimi-ccnl/commercio/');
  for(const decorrenza of ['2026-11-01','2027-02-01']){
    const blocco=uno(html,new RegExp(`<section class="ccnl-aumento" data-decorrenza="${decorrenza}">([\\s\\S]*?)</section>`,'g'),decorrenza);
    const prima=decorrenza==='2026-11-01'?'2026-10-31':'2027-01-31';
    for(const livello of R.livelli('terziario-confcommercio-h011',prima)){
      const riga=uno(blocco,new RegExp(`<tr data-livello="${livello.codice}">([\\s\\S]*?)</tr>`,'g'),livello.codice);
      for(const alla of [prima,decorrenza]){
        const composta=R.componiRal({ccnl:'terziario-confcommercio-h011',livello:livello.codice,alla});
        const netto=applicaMensilita(calcola(String(composta.ral),{comune:'F205',nucleo:[]}),14).kpi.mediaMensile;
        assert.ok(testo(riga).includes(eur(composta.baseMensile)));
        assert.ok(testo(riga).includes(eur(netto)));
      }
    }
  }
  assert.match(testo(html),/regole fiscali 2026 anche per febbraio 2027/);
});

test('Commercio: FAQ visibili e schema coerenti, link ai livelli e aggiornamento (RIC-95)',()=>{
  const html=leggi('/minimi-ccnl/commercio/');
  assert.match(html,/<time datetime="2026-09-22">22 settembre 2026<\/time>/);
  const faq=JSON.parse(uno(html,/<script id="faq-commercio" type="application\/ld\+json">([^<]+)<\/script>/g,'FAQ'));
  assert.equal(faq['@type'],'FAQPage');
  assert.equal(faq.mainEntity.length,4);
  for(const q of faq.mainEntity){
    assert.ok(testo(html).includes(q.name));
    assert.ok(testo(html).includes(q.acceptedAnswer.text));
  }
  const visibile=uno(html,/<section class="ccnl-faq">([\s\S]*?)<\/section>/g,'FAQ visibili');
  for(const codice of ['3','4','5'])assert.ok(visibile.includes(`commercio/${codice}-livello/`));
  assert.doesNotMatch(leggi('/minimi-ccnl/metalmeccanico/'),/faq-commercio/);
});

test('RIC-101: FAQ brevi, schema coerente, link ai livelli e aggiornamento per Studi e Cooperative',()=>{
  for(const slug of ['studi-professionali','cooperative-sociali']){
    const html=leggi(`/minimi-ccnl/${slug}/`);
    assert.match(html,/<time datetime="2026-09-22">/);
    const schema=JSON.parse(uno(html,/<script id="faq-settore" type="application\/ld\+json">([^<]+)<\/script>/g,'schema settore'));
    assert.equal(schema['@type'],'FAQPage');
    assert.equal(schema.mainEntity.length,3);
    const visible=uno(html,/<section class="ccnl-faq">([\s\S]*?)<\/section>/g,'FAQ');
    for(const q of schema.mainEntity){
      assert.ok(testo(visible).includes(q.name));
      assert.ok(testo(visible).includes(q.acceptedAnswer.text));
      assert.ok(q.acceptedAnswer.text.length<350);
    }
    assert.equal([...visible.matchAll(/<a href="([^"]+)"/g)].length,3);
    if(slug==='cooperative-sociali')assert.match(visible,/Quanto guadagna un D1\?/);
  }
});

test('RIC-101: decorrenze contrattuali e prossimi aumenti con fonte, anche dopo dicembre',()=>{
  for(const alla of ['2026-10-16','2026-12-01']){
    const out=fs.mkdtempSync(path.join(os.tmpdir(),'ric101-'));
    generate(out,{alla});
    for(const [slug,date,valori] of [
      ['studi-professionali',['2024-03-01','2024-10-01','2025-10-01','2026-12-01'],['1.706,37 €','1.726,37 €']],
      ['cooperative-sociali',['2024-02-01','2024-10-01','2025-10-01'],['1.637,57 €']],
    ]){
      const html=fs.readFileSync(path.join(out,'minimi-ccnl',slug,'index.html'),'utf8');
      const timeline=uno(html,/<section class="ccnl-decorrenze">([\s\S]*?)<\/section>/g,'decorrenze');
      for(const d of date)assert.ok(timeline.includes(`datetime="${d}"`));
      for(const v of valori)assert.ok(timeline.includes(v));
      assert.match(timeline,/Fonte.*href=/s);
      if(slug==='cooperative-sociali')assert.match(timeline,/uilfp.it/);
    }
  }
});

test('Studi professionali: pagine 1° e 5° livello (RIC-100); quadro e 3° super restano fuori',()=>{
  const base='/minimi-ccnl/studi-professionali/';
  for(const [slug,nome] of [['1-livello','1°'],['5-livello','5°']]){
    assert.ok(ROTTE.includes(base+slug+'/'),slug);
    const html=leggi(base+slug+'/');
    assert.match(uno(html,/<title>([^<]+)<\/title>/g,slug),new RegExp('^'+nome+' livello (CCNL )?Studi professionali 2026: [\\d.]+ € netti'));
    assert.doesNotMatch(html,/NaN|undefined/);
    assert.ok(leggi(base).includes('<th scope="row"><a href="../../minimi-ccnl/studi-professionali/'+slug+'/">'+nome+' livello</a></th>'),'tabella');
  }
  for(const slug of ['quadro','q-livello','3s-livello'])assert.ok(!ROTTE.includes(base+slug+'/'),slug);
});

test('Logistica: pagine per i livelli 3-6 del non viaggiante, senza NaN',()=>{
  const tabellaHtml=leggi('/minimi-ccnl/logistica/');
  for(const n of [3,4,5,6]){
    const html=leggi(`/minimi-ccnl/logistica/${n}-livello/`);
    assert.match(uno(html,/<h1[^>]*>(.*?)<\/h1>/gs,`h1 ${n}`),new RegExp(`${n}° livello`));
    assert.doesNotMatch(html,/NaN|undefined/);
    assert.ok(tabellaHtml.includes(`/minimi-ccnl/logistica/${n}-livello/`),`link tabella ${n}`);
  }
  for(const r of ['/minimi-ccnl/logistica/3-super-livello/','/minimi-ccnl/logistica/c3-livello/'])
    assert.ok(!ROTTE.includes(r),r);
});

test('Cooperative sociali: pagine per i livelli A1, A2, F1, F2, senza NaN (RIC-100)',()=>{
  const tabellaHtml=leggi('/minimi-ccnl/cooperative-sociali/');
  for(const l of ['A1','A2','F1','F2']){
    const rotta=`/minimi-ccnl/cooperative-sociali/livello-${l.toLowerCase()}/`;
    assert.ok(ROTTE.includes(rotta),rotta);
    const html=leggi(rotta);
    assert.match(uno(html,/<h1[^>]*>(.*?)<\/h1>/gs,`h1 ${l}`),new RegExp(`Livello ${l}`));
    assert.equal(uno(html,/<link rel="canonical" href="([^"]+)">/g,`canonical ${l}`),`${ORIGIN}${rotta}`);
    assert.doesNotMatch(html,/NaN|undefined/);
    assert.match(html,/ € netti al mese/);
    assert.ok(tabellaHtml.includes(rotta),`link tabella ${l}`);
  }
});

test('la tabella Pubblici esercizi linka solo i livelli 3-6 «generale» alle pagine Turismo',()=>{
  const html=leggi('/minimi-ccnl/pubblici-esercizi/');
  const sezioni=html.split('<section class="ccnl-sezione"').slice(1);
  assert.equal(sezioni.length,3);
  const link=s=>[...s.matchAll(/<th scope="row"><a href="([^"]+)">([^<]+)<\/a><\/th>/g)];
  const generale=link(sezioni.find(s=>s.startsWith(' id="generale"')));
  assert.deepEqual(generale.map(m=>m[1]),['3','4','5','6'].map(n=>`../../minimi-ccnl/turismo/${n}-livello/`));
  for(const [,href] of generale)assert.ok(ROTTE.includes(new URL(href,`${ORIGIN}/minimi-ccnl/pubblici-esercizi/`).pathname),href);
  for(const s of sezioni.filter(s=>!s.startsWith(' id="generale"')))assert.equal(link(s).length,0);
  /* nessuna pagina propria, nessuna carta «Approfondisci un livello» */
  assert.equal(ROTTE.filter(r=>r.startsWith('/minimi-ccnl/pubblici-esercizi/')&&r!=='/minimi-ccnl/pubblici-esercizi/').length,0);
  assert.doesNotMatch(html,/Approfondisci un livello/);
});

test('Metalmeccanico: tre tranche mostrano lordo e netto prima/dopo per tutti i livelli (RIC-98)',()=>{
  const html=leggi('/minimi-ccnl/metalmeccanico/');
  for(const decorrenza of ['2026-06-01','2027-06-01','2028-06-01']){
    const blocco=uno(html,new RegExp(`<section class="ccnl-aumento" data-decorrenza="${decorrenza}">([\\s\\S]*?)</section>`,'g'),decorrenza);
    const prima=new Date(Date.parse(decorrenza)-86400000).toISOString().slice(0,10);
    for(const livello of R.livelli('metalmeccanica-industria-c011',prima)){
      const riga=uno(blocco,new RegExp(`<tr data-livello="${livello.codice}">([\\s\\S]*?)</tr>`,'g'),livello.codice);
      for(const alla of [prima,decorrenza]){
        const composta=R.componiRal({ccnl:'metalmeccanica-industria-c011',livello:livello.codice,alla});
        const netto=applicaMensilita(calcola(String(composta.ral),{comune:'F205',nucleo:[]}),13).kpi.mediaMensile;
        assert.ok(testo(riga).includes(eur(composta.baseMensile)));
        assert.ok(testo(riga).includes(eur(netto)));
      }
    }
  }
  assert.match(testo(html),/regole fiscali 2026 anche per il 2027 e il 2028/);
});


test('RIC-98: FAQ metalmeccanico visibili, schema e limiti delle stime',()=>{
  const html=leggi('/minimi-ccnl/metalmeccanico/');
  assert.match(html,/<time datetime="2026-09-22">22 settembre 2026<\/time>/);
  const faq=JSON.parse(uno(html,/<script id="faq-metalmeccanico" type="application\/ld\+json">([^<]+)<\/script>/g,'FAQ'));
  assert.equal(faq['@type'],'FAQPage');
  assert.equal(faq.mainEntity.length,4);
  for(const q of faq.mainEntity){
    assert.ok(testo(html).includes(q.name));
    assert.ok(testo(html).includes(q.acceptedAnswer.text));
  }
  for(const codice of ['d1','c3','a1'])assert.ok(html.includes(`metalmeccanico/livello-${codice}/`));
  assert.match(testo(html),/salvaguardia IPCA-NEI/);
  assert.match(testo(html),/superminimo assorbibile/);
  assert.match(testo(html),/imposta sostitutiva del 5% non applicata/);
  assert.match(html,/20251122-CCNL-Federmeccanica/);
});

test('Poligrafici: cinque scatti ordinari e fonte del rinnovo 2018–2019 (RIC-135)',()=>{
  const html=leggi('/minimi-ccnl/poligrafici/');
  const t=testo(html);
  assert.match(t,/Scatti: fino a 5 scatti, uno ogni 2 anni/);
  assert.doesNotMatch(t,/fino a 7 scatti/);
  assert.match(html,/href="https:\/\/www.slc-cgil.it\/images\/CCNL_poligrafici_rinnovo_2018_2019.pdf/);
  assert.match(t,/1° gennaio 2019/);
  assert.match(t,/sesto o settimo/);
  assert.match(t,/esclusivamente lo scatto in corso di maturazione/);
  assert.match(t,/non gestisce.*transitori/);
});
