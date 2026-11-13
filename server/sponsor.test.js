/* Sponsorship limitate (RIC-51). Due seam, come da specifica:
   - il contratto sul catalogo: cosa passa dal database alle pagine;
   - il documento renderizzato: cosa una pagina mostra con un tabellone noto.
   Nessuna prova numerica: la sponsorship non tocca il dominio fiscale. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {tabellone,chiuso,handler}=require('./sponsor.js');
const S=require('../prototipo/sponsor.js');
const {inietta,SCRIPT,SEGNAPOSTO}=require('../processo/attrezzi/sponsor-inietta.cjs');

const base=(slot,extra={})=>({slot_totali:5,disponibili:0,prezzo_cent:9900,valuta:'eur',durata_giorni:30,
  checkout_url:'https://book.stripe.com/abc',vendite_aperte:true,slot,...extra});
const acme={slot:1,stato:'attivo',nome:'Acme Paghe',claim:'Cedolini senza errori',url:'https://acme.example/prodotto?ref=1',
  logo_url:'https://rifkyfawojizgbzabyxn.supabase.co/storage/v1/object/public/sponsor-loghi/abc-1.png',logo_alt:'Logo di Acme Paghe'};
const misto=()=>tabellone(base([acme,{slot:2,stato:'disponibile'},{slot:3,stato:'riservato'},{slot:4,stato:'disponibile'},{slot:5,stato:'disponibile'}]));

test('contratto: uno sponsor attivo arriva con link https, UTM dichiarati e logo sul dominio del sito',()=>{
  const s=misto().slot[0];
  assert.equal(s.stato,'attivo');
  const u=new URL(s.url);
  assert.equal(u.origin+u.pathname,'https://acme.example/prodotto');
  assert.equal(u.searchParams.get('ref'),'1');
  assert.equal(u.searchParams.get('utm_source'),'dovevalatuaral');
  assert.equal(u.searchParams.get('utm_medium'),'referral');
  assert.equal(u.searchParams.get('utm_campaign'),'sponsor');
  assert.equal(s.logo,'/sponsor-loghi/abc-1.png');
});

test('contratto: stato sconosciuto, link non sicuro o sponsor senza nome non si mostrano e non si vendono',()=>{
  const d=tabellone(base([
    {slot:1,stato:'in_vacanza'},
    {...acme,slot:2,url:'http://acme.example/'},
    {...acme,slot:3,url:'javascript:alert(1)'},
    {...acme,slot:4,nome:'   '},
    {...acme,slot:5,url:'https://utente:segreto@acme.example/'},
  ]));
  assert.deepEqual(d.slot.map(s=>s.stato),['riservato','riservato','riservato','riservato','riservato']);
  assert.equal(d.disponibili,0);
  assert.ok(!JSON.stringify(d).includes('javascript:'));
});

test('contratto: uno slot mancante dal catalogo resta muto, non libero',()=>{
  const d=tabellone(base([{slot:1,stato:'disponibile'}]));
  assert.equal(d.slot.length,5);
  assert.deepEqual(d.slot.map(s=>s.stato),['disponibile','riservato','riservato','riservato','riservato']);
});

test('contratto: un logo fuori dal nostro storage non viene servito',()=>{
  const d=tabellone(base([{...acme,logo_url:'https://tracker.example/pixel.gif'}]));
  assert.equal(d.slot[0].logo,null);
});

test('contratto: senza checkout Stripe valido o a vendite chiuse nessuno slot risulta disponibile',()=>{
  for(const extra of [{checkout_url:'https://evil.example/pay'},{vendite_aperte:false},{prezzo_cent:0},{durata_giorni:null}]){
    const d=tabellone(base([{slot:1,stato:'disponibile'},acme].map((s,i)=>({...s,slot:i+1})),extra));
    assert.equal(d.disponibili,0,JSON.stringify(extra));
    assert.equal(d.checkout_url,null);
    assert.equal(d.vendite_aperte,false);
    assert.equal(d.slot[1].stato,'attivo','lo sponsor già pagato resta visibile');
  }
});

test('contratto: un catalogo illeggibile dà il tabellone chiuso',()=>{
  for(const g of [null,'x',{},{slot_totali:99,slot:[]}])assert.deepEqual(tabellone(g),chiuso());
});

test('documento: lo sponsor attivo è etichettato, apre il suo link come sponsored e non porta script',()=>{
  const d=misto(),html=S.colonne(d).sinistra+S.colonne(d).destra+S.fondo(d)+S.striscia(d);
  assert.match(html,/<span class="sp-tag">Sponsor<\/span>/);
  const link=[...html.matchAll(/<a [^>]*data-sponsor="Acme Paghe"[^>]*>/g)].map(m=>m[0]);
  assert.equal(link.length,3,'colonne, griglia e striscia');
  for(const a of link){
    assert.match(a,/href="https:\/\/acme\.example\/prodotto\?ref=1&amp;utm_source=dovevalatuaral/);
    assert.match(a,/rel="sponsored noopener"/);
    assert.match(a,/target="_blank"/);
  }
  assert.match(html,/<img class="sp-logo" src="\/sponsor-loghi\/abc-1\.png" alt="Logo di Acme Paghe"/);
  assert.doesNotMatch(html,/<script|<iframe|onerror=|onclick=/i);
  assert.doesNotMatch(html.replace(/src="\/sponsor-loghi\/[^"]+"/g,''),/src="/,'nessun asset di terze parti');
});

test('documento: sei riquadri, tre per colonna, e in basso a destra l\'invito che non è uno slot',()=>{
  const c=S.colonne(misto());
  const conta=h=>(h.match(/class="sp-card /g)||[]).length;
  assert.equal(conta(c.sinistra),3);
  assert.equal(conta(c.destra),3);
  assert.match(c.destra,/<a class="sp-card sp-card--invito" href="\/sponsor\/">[\s\S]*3\/5 slot liberi[\s\S]*<\/a>$/);
});

test('documento: lo slot libero porta alla pagina sponsor con il suo numero e mostra il prezzo del checkout',()=>{
  const html=S.carte(misto()).join('');
  assert.match(html,/<a class="sp-card sp-card--libero" href="\/sponsor\/\?slot=2">/);
  assert.match(html,/99 € · 30 giorni/);
});

test('documento: lo slot riservato non è cliccabile e non rivela chi lo ha prenotato',()=>{
  const d=tabellone(base([{slot:1,stato:'riservato',nome:'Segreto Srl',url:'https://segreto.example/'}]));
  const html=S.carta(d.slot[0],d);
  assert.match(html,/^<div class="sp-card sp-card--riservato">/);
  assert.doesNotMatch(html,/Segreto|href=/);
});

test('documento: i testi dello sponsor sono sempre escapati',()=>{
  const d=tabellone(base([{...acme,nome:'<img src=x onerror=alert(1)>',claim:'"><script>alert(1)</script>'}]));
  const html=S.carte(d).join('')+S.striscia(d);
  assert.doesNotMatch(html,/<script>|<img src=x/);
  assert.match(html,/&lt;img src=x onerror=alert\(1\)&gt;/);
});

test('documento: tutto esaurito e tabellone chiuso',()=>{
  const pieno=tabellone(base([1,2,3,4,5].map(n=>({...acme,slot:n}))));
  assert.match(S.invito(pieno),/Tutto esaurito/);
  assert.doesNotMatch(S.striscia(pieno),/99 €/);
  assert.equal(S.visibile(chiuso()),false);
  assert.equal(S.visibile(pieno),true);
});

test('API: risponde con il tabellone validato e lo lascia in cache alla CDN',async()=>{
  const res={headers:{},setHeader(k,v){this.headers[k]=v;},end(b){this.body=b;}};
  await handler({method:'GET'},res,async()=>({ok:true,json:async()=>base([acme,{slot:2,stato:'disponibile'}])}));
  assert.equal(res.statusCode,200);
  assert.match(res.headers['Cache-Control'],/s-maxage=60/);
  const d=JSON.parse(res.body);
  assert.equal(d.slot[0].nome,'Acme Paghe');
  assert.equal(d.disponibili,1);
});

test('API: se il catalogo non risponde il sito resta in piedi, senza slot',async()=>{
  const res={headers:{},setHeader(k,v){this.headers[k]=v;},end(b){this.body=b;}};
  await handler({method:'GET'},res,async()=>{throw new Error('giù');});
  assert.equal(res.statusCode,200);
  assert.deepEqual(JSON.parse(res.body),chiuso());
  const post={headers:{},setHeader(k,v){this.headers[k]=v;},end(){}};
  await handler({method:'POST'},post);
  assert.equal(post.statusCode,405);
});

test('build: gli slot entrano in ogni pagina, una volta sola, fuori dal contenuto',()=>{
  const pagina='<!doctype html><html lang="it"><head><title>x</title></head><body><a class="skip-link" href="#app">Vai</a><header class="site-header"><div>nav</div></header><main id="app"><div class="calcbox">RAL</div></main></body></html>';
  const out=inietta(pagina);
  assert.equal(out.split(SCRIPT).length,2);
  assert.ok(out.includes('</header>'+SEGNAPOSTO+'<main'),'la striscia sta fra navigazione e contenuto');
  assert.ok(out.endsWith(SCRIPT+'</body></html>'));
  assert.equal(inietta(out),out,'idempotente');
  const main=out.slice(out.indexOf('<main'),out.indexOf('</main>'));
  assert.doesNotMatch(main,/sponsor|sp-/,'niente sponsor dentro il flusso dalla RAL al netto');
  const senzaNav=inietta('<html><head></head><body class="x"><main></main></body></html>');
  assert.ok(senzaNav.includes('<body class="x">'+SEGNAPOSTO));
  const spenta='<html data-sponsor="off"><head></head><body></body></html>';
  assert.equal(inietta(spenta),spenta);
});

test('pagine: la pagina sponsor dichiara regole e niente recensioni; approvazione e grazie non si indicizzano',()=>{
  const leggi=f=>fs.readFileSync(path.join(__dirname,'../prototipo/sponsor',f),'utf8');
  const sponsor=leggi('index.html');
  for(const frase of ['Rimborso completo','non si rinnova da solo','rel="sponsored"','Chi può sponsorizzare','non compra'])assert.ok(sponsor.includes(frase),frase);
  assert.doesNotMatch(sponsor,/<blockquote|testimonial|recension/i);
  assert.doesNotMatch(sponsor,/MRR/);
  assert.match(leggi('approva/index.html'),/<html lang="it" data-sponsor="off">[\s\S]*name="robots" content="noindex,nofollow"/);
  assert.match(leggi('grazie/index.html'),/name="robots" content="noindex"/);
});
