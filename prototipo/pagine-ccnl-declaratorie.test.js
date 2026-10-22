const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {test}=require('node:test');
const {CONTRATTI_SEO,generate,rottaTabella}=require('./genera-pagine-ccnl.js');
const R=require('./retribuzione-ccnl.js');
const {DECLARATORIE,declaratorie,categoriaDi,lunghezza}=require('./declaratorie-ccnl.js');

/* RIC-146: sezione «I livelli del CCNL» nelle tabelle e blocco «Chi
   rientra nel …» nelle pagine livello, letti da declaratorie-ccnl.js.
   I controlli girano su ogni contratto del modulo: RIC-147 aggiunge i
   suoi alla lista CONTRATTI e ne eredita le regole. */

const ALLA='2026-09-22';
const ROOT=path.resolve(__dirname,'..');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'minimi-declaratorie-'));
generate(dir,{alla:ALLA});
const leggi=rotta=>fs.readFileSync(path.join(dir,rotta,'index.html'),'utf8');
const uno=(html,re,label)=>{const m=[...html.matchAll(re)];assert.equal(m.length,1,label);return m[0][1];};
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const seoDi=id=>CONTRATTI_SEO.find(c=>c.id===id);
const sezione=html=>uno(html,/<section class="ccnl-livelli" id="livelli"[^>]*>([\s\S]*?)<\/section>/g,'sezione livelli');
const chiRientra=html=>uno(html,/<section class="ccnl-blocco ccnl-chi-rientra" id="chi-rientra">([\s\S]*?)<\/section>/g,'chi rientra');
/* I codici della tabella vigente, nella sezione delle pagine livello. */
const codiciVigenti=id=>R.livelli(id,ALLA,seoDi(id).sezioneLivelli||null).map(l=>l.codice);

const CONTRATTI=['gomma-plastica-industria-b371','chimico-farmaceutico-industria-b011','area-meccanica-artigianato-c030','alimentare-industria-e012'];

test('il modulo ha i contratti attesi, e solo contratti che hanno una tabella',()=>{
  for(const id of CONTRATTI)assert.ok(declaratorie(id),id);
  for(const id of Object.keys(DECLARATORIE))assert.ok(seoDi(id),`${id}: nessuna tabella in CONTRATTI_SEO`);
  assert.equal(declaratorie('terziario-confcommercio-h011'),null);
});

test('ogni codice della tabella vigente sta in una sola categoria, e nessuna categoria ha codici fuori tabella',()=>{
  for(const id of Object.keys(DECLARATORIE)){
    const codici=codiciVigenti(id);
    const inCategorie=DECLARATORIE[id].categorie.flatMap(c=>c.codici);
    for(const codice of codici)
      assert.equal(inCategorie.filter(c=>c===codice).length,1,`${id}: ${codice} in ${inCategorie.filter(c=>c===codice).length} categorie`);
    assert.deepEqual([...inCategorie].sort(),[...codici].sort(),`${id}: categorie e tabella`);
    for(const codice of codici)assert.ok(categoriaDi(id,codice).codici.includes(codice));
  }
  assert.equal(codiciVigenti('gomma-plastica-industria-b371').length,10);
  assert.equal(codiciVigenti('chimico-farmaceutico-industria-b011').length,15);
  assert.deepEqual(codiciVigenti('area-meccanica-artigianato-c030'),['1Q','1','2','2bis','3','4','5','6']);
  assert.deepEqual(codiciVigenti('alimentare-industria-e012'),['1S','1','2','3A','3','4','5','6']);
});

test('nessuna categoria ha testo vuoto: o la declaratoria citata, o il limite dichiarato con gli esempi del contratto',()=>{
  for(const [id,x] of Object.entries(DECLARATORIE)){
    for(const c of x.categorie){
      const nome=`${id} ${c.titolo}`;
      assert.ok(c.titolo&&c.riferimento,`${nome}: titolo e riferimento`);
      if(c.testo===null){
        assert.ok(x.senzaDeclaratoria&&x.senzaDeclaratoria.trim(),`${nome}: senza declaratoria ma senza spiegazione`);
        assert.ok((c.esempi||[]).some(e=>e.profili.length),`${nome}: senza declaratoria e senza esempi`);
      }else{
        assert.equal(typeof c.testo,'string',nome);
        assert.ok(c.testo.trim().length>20,`${nome}: testo vuoto`);
        for(const v of c.elenco||[])assert.ok(v.trim(),`${nome}: voce vuota`);
      }
      /* Citazione: niente virgolette proprie, accorciata con «[…]». */
      assert.ok(lunghezza(c)<=650,`${nome}: ${lunghezza(c)} caratteri citati`);
      assert.doesNotMatch([c.testo||'',...(c.elenco||[])].join(' '),/[«»]|\.\.\./,`${nome}: virgolette o puntini nel testo`);
      for(const e of c.esempi||[]){
        assert.ok(c.codici.includes(e.codice),`${nome}: esempi di ${e.codice}, che non è della categoria`);
        assert.ok(e.profili.length&&e.profili.every(p=>p.trim()),`${nome}: profilo vuoto`);
      }
      for(const n of c.note||[])assert.ok(n.testo.trim()&&n.riferimento.trim(),`${nome}: nota senza testo o riferimento`);
    }
    for(const f of x.fonti){
      assert.match(f.url,/^https:\/\//,`${id}: url della fonte`);
      assert.ok(fs.existsSync(path.join(ROOT,f.archivio)),`${id}: ${f.archivio} non archiviato`);
    }
    assert.match(x.verificataIl,/^\d{4}-\d{2}-\d{2}$/);
  }
});

test('la sezione ha H2, articolo, link alla fonte e sta dopo gli aumenti e prima delle FAQ',()=>{
  for(const id of Object.keys(DECLARATORIE)){
    const c=seoDi(id),x=DECLARATORIE[id];
    const html=leggi(rottaTabella(c));
    const s=sezione(html);
    assert.equal(uno(s,/<h2 id="livelli-ccnl-titolo">([^<]+)<\/h2>/g,`${id}: h2`),`I livelli del ${esc(c.titoloTabella)}`);
    for(const f of x.fonti){
      assert.ok(s.includes(`href="${esc(f.url)}"`),`${id}: link alla fonte ${f.titolo}`);
      assert.ok(s.includes(esc(f.parte)),`${id}: articolo ${f.parte}`);
    }
    assert.ok(s.includes(`<b>Fonte:</b> ${esc(x.articolo)}`),`${id}: la fonte comincia dall'articolo ${x.articolo}`);
    assert.ok(s.includes('Verificata il '),`${id}: data di verifica`);
    for(const cat of x.categorie){
      const voce=uno(s,new RegExp(`<article class="ccnl-livelli__voce" id="declaratoria-${cat.codici[0].toLowerCase()}" data-codici="${cat.codici.join(' ')}">([\\s\\S]*?)</article>`,'g'),`${id} ${cat.titolo}`);
      if(cat.testo)assert.ok(voce.includes(`«${esc(cat.testo)}`),`${id} ${cat.titolo}: testo citato`);
      else assert.ok(voce.includes(esc(x.senzaDeclaratoria)),`${id} ${cat.titolo}: limite dichiarato`);
      for(const e of cat.esempi||[])for(const p of e.profili)assert.ok(voce.includes(esc(p)),`${id} ${cat.titolo}: ${p}`);
    }
    const i=html.indexOf('<section class="ccnl-livelli"');
    const aumenti=html.indexOf('<section class="ccnl-aumenti"'),faq=html.indexOf('<section class="ccnl-faq"');
    assert.ok(aumenti>0&&aumenti<i,`${id}: dopo il blocco aumenti`);
    assert.ok(faq>i,`${id}: prima delle FAQ`);
    assert.ok(html.indexOf('<section class="ccnl-sezione" id="tabella">')<i,`${id}: dopo la tabella`);
  }
});

test('ogni codice con pagina livello è linkato dalla sezione; gli altri puntano alla tabella',()=>{
  for(const id of Object.keys(DECLARATORIE)){
    const c=seoDi(id);
    const s=sezione(leggi(rottaTabella(c)));
    const conPagina=new Set(c.livelli||[]);
    assert.ok(conPagina.size>0);
    for(const codice of codiciVigenti(id)){
      const voce=uno(s,new RegExp(`<article class="ccnl-livelli__voce"[^>]*data-codici="[^"]*\\b${codice}\\b[^"]*">([\\s\\S]*?)</article>`,'g'),`${id} ${codice}`);
      const link=uno(voce,/<p class="ccnl-livelli__link">([\s\S]*?)<\/p>/g,`${id} ${codice}: link`);
      if(conPagina.has(codice)){
        const rotta=`/minimi-ccnl/${c.slug}/${c.slugLivello(codice)}/`;
        assert.ok(link.includes(`href="../..${rotta}"`),`${id} ${codice}: link a ${rotta}`);
      }else assert.match(link,new RegExp(`<a href="#${c.sezioneLivelli||'tabella'}">[^<]+ in tabella</a>`),`${id} ${codice}: link alla tabella`);
    }
  }
  /* L'ancora esiste davvero. */
  for(const id of CONTRATTI)assert.ok(leggi(rottaTabella(seoDi(id))).includes(`id="${seoDi(id).sezioneLivelli||'tabella'}"`),id);
});

test('le pagine livello dei contratti del modulo hanno «Chi rientra nel …» sotto i KPI, con la declaratoria e i soli esempi del codice',()=>{
  let pagine=0;
  for(const id of Object.keys(DECLARATORIE)){
    const c=seoDi(id),x=DECLARATORIE[id];
    for(const codice of c.livelli){
      const html=leggi(`/minimi-ccnl/${c.slug}/${c.slugLivello(codice)}/`);
      const etichetta=c.etichetta(R.trovaLivello(id,codice,ALLA,c.sezioneLivelli||null));
      const b=chiRientra(html);
      assert.ok(b.includes(`<h3>Chi rientra nel ${esc(etichetta.charAt(0).toLowerCase()+etichetta.slice(1))}</h3>`),`${id} ${codice}: titolo`);
      const cat=categoriaDi(id,codice);
      if(cat.testo)assert.ok(b.includes(`«${esc(cat.testo)}`),`${id} ${codice}: declaratoria`);
      else assert.ok(b.includes(esc(x.senzaDeclaratoria)),`${id} ${codice}: limite`);
      const propri=(cat.esempi||[]).filter(e=>e.codice===codice).flatMap(e=>e.profili);
      for(const p of propri)assert.ok(b.includes(esc(p)),`${id} ${codice}: ${p}`);
      const altrui=(cat.esempi||[]).filter(e=>e.codice!==codice).flatMap(e=>e.profili).filter(p=>!propri.includes(p));
      for(const p of altrui)assert.ok(!b.includes(`; ${esc(p)};`)&&!b.includes(`>${esc(p)};`),`${id} ${codice}: ${p} è di un altro codice`);
      for(const f of x.fonti)assert.ok(b.includes(`href="${esc(f.url)}"`),`${id} ${codice}: fonte`);
      assert.ok(b.includes(`/minimi-ccnl/${c.slug}/#livelli"`),`${id} ${codice}: link alla sezione della tabella`);
      const kpi=html.indexOf('<div class="ccnl-kpi">'),blocco=html.indexOf('id="chi-rientra"'),scomp=html.indexOf('<table class="scomposizione">');
      assert.ok(kpi>0&&kpi<blocco&&blocco<scomp,`${id} ${codice}: sotto i KPI`);
      pagine++;
    }
  }
  assert.equal(pagine,25);
});

test('le pagine e le tabelle senza declaratorie non cambiano',()=>{
  for(const slug of ['commercio','metalmeccanico','multiservizi']){
    const c=CONTRATTI_SEO.find(x=>x.slug===slug);
    assert.ok(!leggi(rottaTabella(c)).includes('class="ccnl-livelli"'),slug);
    const rotta=`/minimi-ccnl/${slug}/${c.slugLivello(c.livelli[0])}/`;
    assert.ok(!leggi(rotta).includes('ccnl-chi-rientra'),rotta);
  }
});

test('chimico: categorie A–F con le posizioni del contratto, A dei quadri, F senza posizioni',()=>{
  const x=declaratorie('chimico-farmaceutico-industria-b011');
  assert.deepEqual(x.categorie.map(c=>c.codici.join(',')),['A1,A2,A3','B1,B2','C1,C2','D1,D2,D3','E1,E2,E3,E4','F']);
  assert.match(categoriaDi('chimico-farmaceutico-industria-b011','A2').testo,/lavoratori quadri/);
  for(const c of x.categorie.slice(0,5))
    assert.deepEqual(c.esempi.map(e=>e.codice),c.codici,`${c.titolo}: profili per ogni posizione`);
  assert.equal(categoriaDi('chimico-farmaceutico-industria-b011','F').esempi,undefined);
  const e3=leggi('/minimi-ccnl/chimico-farmaceutico/livello-e3/');
  assert.ok(chiRientra(e3).includes('La declaratoria vale per tutta la categoria E: E1, E2, E3 e E4.'));
  assert.ok(chiRientra(e3).includes('Stabularista'));
  assert.ok(!chiRientra(e3).includes('Campionatore'),'Campionatore è un profilo E4');
});

test('gomma plastica: declaratorie di quadri, G, H e I; livello I eliminato dal 1° dicembre 2028',()=>{
  const id='gomma-plastica-industria-b371';
  const conTesto=declaratorie(id).categorie.filter(c=>c.testo).map(c=>c.codici[0]);
  assert.deepEqual(conTesto,['Q','G','H','I']);
  for(const codice of ['G','H','I'])assert.equal(categoriaDi(id,codice).ambito,'area produzione');
  const i=categoriaDi(id,'I');
  assert.ok(i.note.some(n=>/1° dicembre 2028 sarà eliminato il livello I/.test(n.testo)&&/art\. 4 c\.18/.test(n.riferimento)));
  const pagina=chiRientra(leggi('/minimi-ccnl/gomma-plastica/livello-i/'));
  assert.ok(pagina.includes('1° dicembre 2028 sarà eliminato il livello I'));
  assert.ok(pagina.includes('<b>Produzione:</b> addetti a lavori di preparazione; aiuto esecutivo'));
  const f=chiRientra(leggi('/minimi-ccnl/gomma-plastica/livello-f/'));
  assert.ok(f.includes('<b>Produzione:</b> regleur/attrezzatore; addetto conduzione impianti'));
});

test('metalmeccanico artigiano: art. 17, meccanica di produzione con l\'installazione di impianti in nota, esempi solo dal contratto',()=>{
  const id='area-meccanica-artigianato-c030';
  const x=declaratorie(id);
  assert.equal(x.articolo,'art. 17');
  assert.deepEqual(x.categorie.map(c=>c.codici.join(',')),['1Q','1','2','2bis','3','4','5','6']);
  assert.match(categoriaDi(id,'1Q').testo,/funzioni organizzativamente articolate/);
  assert.match(categoriaDi(id,'2bis').testo,/coordinamento dell’intero processo produttivo/);
  for(const c of x.categorie.filter(c=>c.ambito))assert.equal(c.ambito,'settore Meccanica di produzione');
  /* L'installazione di impianti non ha il 1° livello (art. 17, p. 31). */
  assert.ok(categoriaDi(id,'1').note.some(n=>/non sono inquadrati i lavoratori del 1° livello/.test(n.testo)&&/Installazione di impianti/.test(n.riferimento)));
  for(const codice of ['2bis','3','4','5','6'])assert.ok(categoriaDi(id,codice).note.some(n=>/Installazione di impianti/.test(n.riferimento)),codice);
  assert.ok(x.fonti[0].archivio.endsWith('area-meccanica-c030-cnel-testo-definitivo-ccnl-2024-11-19.pdf'));
  const p2=chiRientra(leggi('/minimi-ccnl/metalmeccanico-artigiano/livello-2-bis/'));
  assert.ok(p2.includes('Tecnico di laboratorio'));
  assert.ok(!p2.includes('Operatore/programmatore di C.N.'),'è un profilo della terza categoria');
  const q=leggi(rottaTabella(seoDi(id)));
  assert.ok(sezione(q).includes('Declaratoria, settore Meccanica di produzione'));
});

test('industria alimentare: art. 26, parte comune, otto livelli; nessun profilo per livello, solo i ruoli della nota a verbale del 1°',()=>{
  const id='alimentare-industria-e012';
  const x=declaratorie(id);
  assert.equal(x.articolo,'art. 26');
  assert.deepEqual(x.categorie.map(c=>c.codici.join(',')),['1S','1','2','3A','3','4','5','6']);
  assert.ok(x.categorie.every(c=>c.testo));
  assert.deepEqual(x.categorie.filter(c=>c.esempi).map(c=>c.codici[0]),['1']);
  assert.match(x.avvertenza,/olearia/);
  assert.ok(categoriaDi(id,'6').note.some(n=>/passeranno dal 6° al 5° livello dopo un periodo di sei mesi/.test(n.testo)));
  const p5=chiRientra(leggi('/minimi-ccnl/industria-alimentare/5-livello/'));
  assert.ok(p5.includes('macchine per la lavorazione, il confezionamento e la movimentazione di merci e prodotti'));
  assert.ok(!p5.includes('Ruoli del contratto'),'nessun ruolo per il 5° livello');
  const p3=chiRientra(leggi('/minimi-ccnl/industria-alimentare/3-livello/'));
  assert.ok(p3.includes('lavoratori altamente specializzati'));
  assert.ok(!p3.includes('conducono e controllano, con interventi risolutivi'),'è del terzo livello A');
});
