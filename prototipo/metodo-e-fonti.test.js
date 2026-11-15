/* RIC-162, RIC-163, RIC-224: la pagina «Metodo e fonti», il footer comune
   a tutte le pagine pubbliche e la descrizione del percorso CCNL. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {test}=require('node:test');
const {PUBLIC_PAGES,RALS}=require('./genera-pagine-ral.js');
const {ROTTE}=require('./genera-pagine-ccnl.js');
const {readArticles}=require('./genera-articoli.js');

const ISSUES='https://github.com/ricca91/dovevalatuaral.com/issues';
const LINKEDIN='https://www.linkedin.com/in/riccsartori/';
const leggi=nome=>fs.readFileSync(path.join(__dirname,nome),'utf8');
const file=rotta=>rotta.endsWith('/')?`${rotta.slice(1)}index.html`:rotta.slice(1);
const footer=html=>html.match(/<footer\b[\s\S]*?<\/footer>/g).at(-1);
const href=(html,pagina)=>[...html.matchAll(/href="([^"]+)"/g)]
  .map(m=>new URL(m[1].replaceAll('&amp;','&'),`https://www.dovevalatuaral.com/${pagina.replace(/index\.html$/,'')}`).href);
const pubbliche=[...PUBLIC_PAGES.map(u=>new URL(u).pathname),...RALS.map(r=>`/ral-${r}-netto/`),...ROTTE,
  '/blog/',...readArticles().map(a=>`/blog/${a.slug}/`)].map(file);

test('la pagina Metodo e fonti è tra le pagine pubbliche e ha il canale per le segnalazioni',()=>{
  assert.ok(PUBLIC_PAGES.includes('https://www.dovevalatuaral.com/metodo-e-fonti.html'));
  const html=leggi('metodo-e-fonti.html');
  assert.match(html,/<section id="segnala-errore"/);
  const link=href(html,'metodo-e-fonti.html');
  assert.ok(link.includes(ISSUES),'manca il link alle issue GitHub');
  assert.ok(link.includes(LINKEDIN),'manca il link a LinkedIn');
  assert.doesNotMatch(html,/mailto:|@[a-z0-9-]+\.(com|it|to)\b/i,'nessun indirizzo email inventato');
});

test('Metodo e fonti non promette una revisione umana che non c’è',()=>{
  const testo=leggi('metodo-e-fonti.html').replace(/<[^>]+>/g,' ');
  assert.match(testo,/agente AI/);
  assert.match(testo,/Nessuna revisione umana di ogni articolo/);
  assert.match(testo,/Non è un parere fiscale/);
});

test('ogni pagina pubblica ha nel footer nome, autore, Metodo e fonti, Minimi CCNL e contatti',()=>{
  assert.ok(pubbliche.length>80);
  for(const pagina of pubbliche){
    const f=footer(leggi(pagina));
    assert.doesNotMatch(f,/jet\s*hr|ai builder|prototipo/i,pagina);
    assert.match(f,/Dove va la tua RAL/,pagina);
    const link=href(f,pagina);
    for(const atteso of [LINKEDIN,'https://www.dovevalatuaral.com/metodo-e-fonti.html','https://www.dovevalatuaral.com/minimi-ccnl/',
      'https://www.dovevalatuaral.com/metodo-e-fonti.html#segnala-errore'])
      assert.ok(link.includes(atteso),`${pagina}: nel footer manca ${atteso}`);
  }
});

test('gli articoli e le tabelle CCNL rimandano a Metodo e fonti',()=>{
  const metodo='https://www.dovevalatuaral.com/metodo-e-fonti.html';
  const articoli=readArticles().map(a=>`blog/${a.slug}/index.html`);
  assert.ok(articoli.length>0);
  for(const pagina of articoli){
    const html=leggi(pagina);
    assert.match(html,/class="article-author"[^>]*>Dove va la tua RAL, di <a href="https:\/\/www\.linkedin\.com\/in\/riccsartori\/">Riccardo Sartori<\/a>/,pagina);
    assert.ok(href(html.match(/<p class="article-author">[\s\S]*?<\/p>/)[0],pagina).includes(metodo),pagina);
  }
  for(const rotta of ROTTE){
    const html=leggi(file(rotta));
    const riga=html.match(/<p class="small">Come verifico questi numeri:[\s\S]*?<\/p>/);
    assert.ok(riga,`${rotta}: manca il rimando a Metodo e fonti`);
    assert.ok(href(riga[0],file(rotta)).includes(metodo),rotta);
  }
});

test('come-ho-lavorato descrive il percorso CCNL com’è e rimanda a Metodo e fonti (RIC-224)',()=>{
  const html=leggi('come-ho-lavorato.html');
  assert.doesNotMatch(html,/senza entrare nel motore fiscale/);
  assert.match(html,/ricostruisce la RAL dalle tabelle nazionali \(minimo, scatti, superminimo, orario\) e la passa allo stesso motore fiscale/);
  assert.ok(href(html,'come-ho-lavorato.html').includes('https://www.dovevalatuaral.com/metodo-e-fonti.html'));
  assert.doesNotMatch(html.replace(/<[^>]+>/g,' '),/prototipo/i);
});

test('la-storia mostra che la scelta del CCNL oggi è fatta, con il numero vero di contratti',()=>{
  const {CONTRATTI}=require('./retribuzione-ccnl.js');
  assert.match(leggi('la-storia.html'),new RegExp(`oggi i contratti coperti sono ${CONTRATTI.length}\\b`));
});
