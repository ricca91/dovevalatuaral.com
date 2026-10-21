const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {test}=require('node:test');
const {ROTTE,CONTRATTI_SEO,generate,datiLivello}=require('./genera-pagine-ccnl.js');
const {sitemap}=require('./genera-pagine-ral.js');

/* Pagine livello dei cinque CCNL del gruppo 2 (RIC-140): solo i livelli
   con domanda misurata, etichette scritte come la query. */
const ORIGIN='https://www.dovevalatuaral.com';
const ALLA='2026-09-22';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'minimi-gruppo2-'));
generate(dir,{alla:ALLA});
const leggi=rotta=>fs.readFileSync(path.join(dir,rotta,'index.html'),'utf8');
const testo=html=>html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
const uno=(html,re,label)=>{const m=[...html.matchAll(re)];assert.equal(m.length,1,label);return m[0][1];};

const GOMMA=['gomma-plastica','CCNL Gomma plastica','gomma-plastica-industria-b371',null];
const CHIMICO=['chimico-farmaceutico','CCNL Chimico farmaceutico','chimico-farmaceutico-industria-b011',null];
const ARTIGIANO=['metalmeccanico-artigiano','CCNL Metalmeccanico artigiano','area-meccanica-artigianato-c030','metalmeccanica-impianti'];
const BANCARI=['bancari','CCNL Bancari','credito-abi-j241','aree-qd12'];
const QD34=['bancari','CCNL Bancari','credito-abi-j241','qd34'];
const ALIMENTARE=['industria-alimentare','CCNL Industria alimentare','alimentare-industria-e012','alimentare'];

/* [contratto, pagina, codice del dataset, etichetta attesa] */
const PAGINE=[
  ...[['H'],['F'],['G'],['E'],['C'],['I'],['A']].map(([c])=>[GOMMA,`livello-${c.toLowerCase()}`,c,`Livello ${c}`]),
  ...['E3','E4','D3','E2','D1','C2','E1','B1','A3'].map(c=>[CHIMICO,`livello-${c.toLowerCase()}`,c,`Livello ${c}`]),
  ...['5','4','3','6','2'].map(c=>[ARTIGIANO,`${c}-livello`,c,`${c}° livello`]),
  [ARTIGIANO,'livello-2-bis','2bis','Livello 2 bis'],
  [BANCARI,'3-area-4-livello','3A4','3ª area 4° livello'],
  [BANCARI,'3-area-3-livello','3A3','3ª area 3° livello'],
  [QD34,'quadro-direttivo-4-livello','QD4','Quadro direttivo 4° livello'],
  [BANCARI,'quadro-direttivo-1-livello','QD1','Quadro direttivo 1° livello'],
  ...['3','5','6'].map(c=>[ALIMENTARE,`${c}-livello`,c,`${c}° livello`]),
].map(([[slug,query,id,sezione],pagina,codice,etichetta])=>
  ({slug,query,id,sezione,codice,etichetta,rotta:`/minimi-ccnl/${slug}/${pagina}/`}));

test('29 pagine livello per i cinque contratti, in sitemap e linkate dalla tabella',()=>{
  assert.equal(PAGINE.length,29);
  const xml=sitemap();
  for(const slug of ['gomma-plastica','chimico-farmaceutico','metalmeccanico-artigiano','bancari','industria-alimentare'])
    assert.deepEqual(ROTTE.filter(r=>r.startsWith(`/minimi-ccnl/${slug}/`)&&r!==`/minimi-ccnl/${slug}/`).sort(),
      PAGINE.filter(p=>p.slug===slug).map(p=>p.rotta).sort(),slug);
  for(const p of PAGINE){
    assert.ok(xml.includes(`<loc>${ORIGIN}${p.rotta}</loc>`),`${p.rotta}: sitemap`);
    const tabella=leggi(`/minimi-ccnl/${p.slug}/`);
    const href=`href="../..${p.rotta}"`;
    assert.match(tabella,new RegExp(`<th scope="row"><a ${href}>`),`${p.rotta}: riga della tabella`);
    const approfondisci=uno(tabella,/<section class="related" aria-labelledby="livelli-titolo">([\s\S]*?)<\/section>/g,`${p.slug}: approfondisci`);
    assert.ok(approfondisci.includes(`${href}><span><b>${p.etichetta} `),`${p.rotta}: Approfondisci un livello`);
  }
});

test('H1 con etichetta e query, title entro 60 caratteri con il netto della pagina',()=>{
  for(const p of PAGINE){
    const html=leggi(p.rotta);
    assert.equal(uno(html,/<h1>([^<]+)<\/h1>/g,`${p.rotta}: h1`),`${p.etichetta} ${p.query}: minimo, RAL e netto`);
    const titolo=uno(html,/<title>([^<]+)<\/title>/g,`${p.rotta}: title`);
    assert.ok(titolo.length<=60,`${p.rotta}: ${titolo.length} caratteri — ${titolo}`);
    assert.ok(titolo.startsWith(`${p.etichetta} `),titolo);
    const apertura=uno(html,/<b>([\d.,]+) € netti al mese<\/b>/g,`${p.rotta}: netto in apertura`);
    const intero=String(Math.round(Number(apertura.replace(/\./g,'').replace(',','.')))).replace(/\B(?=(\d{3})+(?!\d))/g,'.');
    assert.ok(titolo.includes(` 2026: ${intero} € netti`),`${p.rotta}: ${titolo} invece di ${intero} €`);
    assert.doesNotMatch(html,/NaN|undefined|\[object/);
  }
  /* Le forme calcolate nel ticket il 21 ottobre. */
  assert.match(uno(leggi('/minimi-ccnl/chimico-farmaceutico/livello-e3/'),/<title>([^<]+)<\/title>/g,'E3'),
    /^Livello E3 Chimico farmaceutico 2026: [\d.]+ € netti al mese$/);
  assert.match(uno(leggi('/minimi-ccnl/metalmeccanico-artigiano/livello-2-bis/'),/<title>([^<]+)<\/title>/g,'2 bis'),
    /^Livello 2 bis Metalmeccanico artigiano 2026: [\d.]+ € netti$/);
  assert.match(uno(leggi('/minimi-ccnl/bancari/3-area-4-livello/'),/<title>([^<]+)<\/title>/g,'3A4'),
    /^3ª area 4° livello CCNL Bancari 2026: [\d.]+ € netti al mese$/);
});

test('il calcolatore riceve contratto, sezione e livello della pagina',()=>{
  for(const p of PAGINE){
    const q=new URLSearchParams({ccnl:p.id,...(p.sezione?{sezione:p.sezione}:{}),livello:p.codice});
    assert.ok(leggi(p.rotta).includes(`ccnl-livello.html?${q.toString().replaceAll('&','&amp;')}"`),`${p.rotta}: ${q}`);
  }
});

test('gli importi sono quelli delle fonti, alla data dei test',()=>{
  /* Valori presi dai dossier (processo/fonti-ccnl-gruppo2-*.md), non
     ricalcolati dalla funzione sotto test. */
  const casi=[
    ['/minimi-ccnl/gomma-plastica/livello-h/','1.796,11 €',['1.796,11 €']],
    ['/minimi-ccnl/chimico-farmaceutico/livello-e3/','1.954,29 €',['1.856,87 €','97,42 €']],
    ['/minimi-ccnl/metalmeccanico-artigiano/5-livello/','1.595,91 €',['1.595,91 €']],
    ['/minimi-ccnl/bancari/3-area-4-livello/','3.341,90 €',['3.341,90 €']],
    ['/minimi-ccnl/industria-alimentare/5-livello/','1.925,46 €',['1.325,21 €','517,65 €','72,27 €','10,33 €']],
  ];
  for(const [rotta,totale,voci] of casi){
    const html=leggi(rotta);
    assert.equal(html.match(/<span class="micro">Minimo lordo mensile<\/span><b>([^<]+)<\/b>/)[1],totale,rotta);
    const scomposizione=html.match(/<table class="scomposizione">[\s\S]*?<\/table>/)[0];
    for(const v of voci)assert.ok(testo(scomposizione).includes(v),`${rotta}: ${v}`);
  }
});

test('orafi, odontotecnica, restauro e olearia restano senza link; le pagine mostrano solo la loro sezione',()=>{
  const link=s=>[...s.matchAll(/<th scope="row"><a href="([^"]+)">/g)].length;
  for(const [slug,conPagine,senza] of [
    ['metalmeccanico-artigiano',['metalmeccanica-impianti',6],['orafi','odontotecnica','restauro']],
    ['industria-alimentare',['alimentare',3],['olearia-margariniera']],
  ]){
    const sezioni=leggi(`/minimi-ccnl/${slug}/`).split('<section class="ccnl-sezione"').slice(1);
    /* Solo la tabella della sezione: dopo l'ultima viene il blocco aumenti (RIC-141). */
    const di=id=>sezioni.find(s=>s.startsWith(` id="${id}"`)).split('</section>')[0];
    assert.equal(link(di(conPagine[0])),conPagine[1],slug);
    for(const id of senza)assert.equal(link(di(id)),0,`${slug}: ${id}`);
    for(const p of PAGINE.filter(p=>p.slug===slug)){
      const html=leggi(p.rotta);
      assert.equal([...html.matchAll(/<section class="ccnl-riga" id="([^"]+)"/g)].map(m=>m[1]).join(),conPagine[0],p.rotta);
    }
  }
});

test('Bancari: la pagina QD4 mostra la sola sezione qd34, le altre la sola aree-qd12',()=>{
  const bancari=CONTRATTI_SEO.find(c=>c.slug==='bancari');
  assert.equal(bancari.sezioneLivelli,undefined);
  for(const p of PAGINE.filter(p=>p.slug==='bancari')){
    assert.deepEqual(datiLivello(bancari,p.codice,ALLA).righe.map(r=>r.sezione),[p.sezione],p.codice);
    assert.deepEqual([...leggi(p.rotta).matchAll(/<section class="ccnl-riga" id="([^"]+)"/g)].map(m=>m[1]),[p.sezione],p.rotta);
  }
  const qd4=testo(leggi('/minimi-ccnl/bancari/quadro-direttivo-4-livello/'));
  assert.ok(qd4.includes('Quadri direttivi di 3° e 4° livello'));
  assert.ok(qd4.includes('fino a 7 scatti'));
  assert.doesNotMatch(qd4,/fino a 8 scatti/);
});

test('nessuna etichetta rotta in tutto /minimi-ccnl/',()=>{
  for(const rotta of ROTTE){
    const html=leggi(rotta);
    for(const rotto of ['2bis°','1Q°','1S°','3A°','Q°'])assert.ok(!html.includes(rotto),`${rotta}: ${rotto}`);
    assert.doesNotMatch(html,/[A-Za-z]\d*°/,rotta);
  }
  /* I livelli accanto senza pagina usano il nome del dataset. */
  assert.ok(leggi('/minimi-ccnl/dmo/1-livello/').includes('<b>Quadro DMO</b>'));
  assert.ok(leggi('/minimi-ccnl/studi-professionali/1-livello/').includes('<b>Quadri Studi professionali</b>'));
  assert.ok(leggi('/minimi-ccnl/gomma-plastica/livello-a/').includes('<b>Quadri Gomma plastica</b>'));
  assert.ok(leggi('/minimi-ccnl/industria-alimentare/3-livello/').includes('<b>Livello 3A Industria alimentare</b>'));
  assert.ok(leggi('/minimi-ccnl/metalmeccanico-artigiano/2-livello/').includes('<b>Livello 2 bis Metalmeccanico artigiano</b>'));
});

/* Artt. 94 e 103 del CCNL ABI: anzianità sospesa dal 1° gennaio 2013 al
   31 luglio 2014. Gli anni di una tappa dipendono dalla data di
   assunzione, quindi la tabella conta solo gli scatti. */
test('Bancari: scatti contati senza anni, con il periodo sospeso; gli altri contratti come prima',()=>{
  const sospensione='L’anzianità non matura dal 1° gennaio 2013 al 31 luglio 2014 (art. 94 c. 5 e art. 103 c. 3).';
  for(const p of PAGINE.filter(p=>p.slug==='bancari')){
    const html=leggi(p.rotta);
    const t=testo(html);
    assert.doesNotMatch(t,/anni ·/,p.rotta);
    assert.ok(t.includes(sospensione),p.rotta);
    assert.ok(html.includes('<th scope="col">Scatti maturati</th>'),p.rotta);
    assert.ok(!html.includes('<th scope="col">Anzianità in azienda</th>'),p.rotta);
    const tappe=[...html.matchAll(/<th scope="row">(\d+ scatt[oi])<\/th>/g)].map(m=>m[1]);
    assert.deepEqual(tappe,p.codice==='QD4'?['1 scatto','4 scatti','7 scatti']:['1 scatto','4 scatti','8 scatti'],p.rotta);
  }
  const artigiano=leggi('/minimi-ccnl/metalmeccanico-artigiano/5-livello/');
  assert.ok(artigiano.includes('<th scope="col">Anzianità in azienda</th>'));
  assert.ok(testo(artigiano).includes('2 anni · 1 scatto'));
  assert.ok(testo(artigiano).includes('10 anni · 5 scatti'));
});
