const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {test,after}=require('node:test');
const {ROTTE,CONTRATTI_SEO,generate,datiContratto}=require('./genera-pagine-ccnl.js');
const {STATO_RINNOVO_BANCARI:STATO,statoRinnovo,data}=require('./ccnl-page.template.js');
const R=require('./retribuzione-ccnl.js');
const {calcola,applicaMensilita,eur}=require('./motore.js');

/* RIC-143: tabella Bancari (J241) pronta per il giorno della firma del
   rinnovo. Con il dataset reale: «rinnovo» in title e H1, riquadro dello
   stato del rinnovo, quattro FAQ, nessun blocco aumenti. Con un catalogo
   fittizio che aggiunge due tranche: tabella, blocco aumenti e pagine
   livello si aggiornano senza toccare altro che il dataset. */

const ID='credito-abi-j241';
const ROTTA='/minimi-ccnl/bancari/';
const ALLA='2026-10-22';
const cartelle=[];
after(()=>{for(const dir of cartelle)fs.rmSync(dir,{recursive:true,force:true});});
const genera=opzioni=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ric143-'));
  cartelle.push(dir);
  generate(dir,opzioni);
  return rotta=>fs.readFileSync(path.join(dir,rotta,'index.html'),'utf8');
};
const testo=html=>html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
const uno=(html,re,label)=>{const m=[...html.matchAll(re)];assert.equal(m.length,1,label);return m[0][1];};
const seo=slug=>CONTRATTI_SEO.find(c=>c.slug===slug);
const PAGINE=['3-area-4-livello','3-area-3-livello','quadro-direttivo-4-livello','quadro-direttivo-1-livello'].map(p=>`${ROTTA}${p}/`);
/* Il netto come lo calcola il motore, senza passare dal generatore. */
const atteso=(catalogo,sezione,codice,alla)=>{
  const composta=catalogo.componiRal({ccnl:ID,sezione,livello:codice,alla});
  return {lordo:composta.baseMensile,
    netto:applicaMensilita(calcola(String(composta.ral),{comune:'F205',nucleo:[]}),composta.mensilita).kpi.mediaMensile};
};

const leggi=genera({alla:ALLA});

test('title e H1 con «rinnovo», title entro 60 caratteri; gli altri contratti come prima',()=>{
  const html=leggi(ROTTA);
  const titolo=uno(html,/<title>([^<]+)<\/title>/g,'title');
  assert.equal(titolo,'CCNL Bancari (ABI) 2026: tabelle, netto e rinnovo');
  assert.ok(titolo.length<=60,`${titolo.length} caratteri`);
  assert.equal(uno(html,/<meta property="og:title" content="([^"]+)">/g,'og:title'),titolo);
  assert.equal(uno(html,/<h1>([^<]+)<\/h1>/g,'h1'),'CCNL Bancari (ABI) 2026: tabelle retributive e rinnovo');
  /* L'anno resta al template (RIC-105): nella coda non c'è. */
  const bancari=seo('bancari');
  for(const coda of [bancari.codaTitolo,bancari.codaH1])assert.doesNotMatch(coda,/\d{4}/);
  assert.deepEqual(CONTRATTI_SEO.filter(c=>c.codaTitolo||c.codaH1).map(c=>c.slug),['bancari']);
  const commercio=leggi('/minimi-ccnl/commercio/');
  assert.equal(uno(commercio,/<title>([^<]+)<\/title>/g,'commercio'),'CCNL Commercio 2026: tabelle retributive e netto');
  assert.equal(uno(commercio,/<h1>([^<]+)<\/h1>/g,'commercio h1'),'CCNL Commercio 2026: tabelle retributive');
});

test('riquadro «Stato del rinnovo» dopo l’header e prima della prima sezione, al posto di notaFonte',()=>{
  const html=leggi(ROTTA);
  const riquadro=uno(html,/<section class="ccnl-blocco ccnl-affiancato ccnl-rinnovo" id="rinnovo"[^>]*>([\s\S]*?)<\/section>/g,'riquadro');
  const i=html.indexOf('id="rinnovo"');
  assert.ok(html.indexOf('</header>\n  <section class="ccnl-blocco ccnl-affiancato ccnl-rinnovo"')>0,'subito dopo l’header');
  assert.ok(i<html.indexOf('<section class="ccnl-sezione"'),'prima delle sezioni');
  assert.ok(i<html.indexOf('<nav class="ccnl-indice"'),'prima dell’indice');
  /* La data è quella della verifica, non quella della build. */
  assert.match(riquadro,new RegExp(`<h2 id="rinnovo-titolo">Stato del rinnovo al <time datetime="${STATO.verificatoIl}">${data(STATO.verificatoIl)}</time></h2>`));
  assert.equal(STATO.firmatoIl,null);
  const voci=[...riquadro.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m=>m[1]);
  assert.equal(voci.length,STATO.fatti.length);
  STATO.fatti.forEach((f,n)=>{
    assert.ok(testo(voci[n]).startsWith(f.testo),f.testo);
    const link=[...voci[n].matchAll(/<a href="(https:\/\/[^"]+)" rel="nofollow">/g)].map(m=>m[1]);
    assert.equal(link.length,f.fonti.length,f.testo);
  });
  const t=testo(riquadro);
  for(const fatto of ['scaduto il 31 marzo 2026','tabella del 1° marzo 2026','31 dicembre 2026','dal 1° aprile 2026','non c’è intesa','13 ottobre 2026','non un accordo'])
    assert.ok(t.includes(fatto),fatto);
  /* Nessun importo, né della piattaforma né d'altro. */
  assert.doesNotMatch(t,/€|euro|\b518\b/);
  /* fonteSospensione viene dal dataset. */
  assert.ok(riquadro.includes(`href="${R.trovaContratto(ID).fonteSospensione.url}"`));
  assert.ok(riquadro.includes(`href="${R.trovaContratto(ID).fonte.url}"`));
  /* Sulla tabella il riquadro sostituisce notaFonte; sulle pagine livello notaFonte resta. */
  assert.doesNotMatch(html,/callout--warn/);
  for(const rotta of PAGINE){
    const livello=leggi(rotta);
    assert.ok(livello.includes(`<span class="callout__mark">Fonte</span><div>${R.trovaContratto(ID).notaFonte}</div>`),rotta);
    assert.doesNotMatch(livello,/id="rinnovo"/,rotta);
  }
  assert.doesNotMatch(leggi('/minimi-ccnl/commercio/'),/id="rinnovo"/);
});

test('il giorno della firma il titolo del riquadro diventa «Rinnovo firmato il …»',()=>{
  const d=datiContratto(seo('bancari'),ALLA);
  const html=statoRinnovo(d,{...STATO,firmatoIl:'2026-12-10'});
  assert.match(html,/<h2 id="rinnovo-titolo">Rinnovo firmato il <time datetime="2026-12-10">10 dicembre 2026<\/time><\/h2>/);
  assert.equal(statoRinnovo(datiContratto(seo('commercio'),ALLA)),'');
});

test('«Aggiornato al» e nessun blocco aumenti con il dataset reale',()=>{
  const html=leggi(ROTTA);
  assert.match(html,new RegExp(`<p class="small">Aggiornato al <time datetime="${ALLA}">${data(ALLA)}</time>\\.</p>`));
  assert.doesNotMatch(html,/ccnl-aumento|id="aumenti"/);
  assert.deepEqual(datiContratto(seo('bancari'),ALLA).aumentiDataset,[]);
});

test('quattro FAQ, testo identico nella pagina e nello schema, numeri dalla tabella',()=>{
  const html=leggi(ROTTA);
  const faq=JSON.parse(uno(html,/<script id="faq-bancari" type="application\/ld\+json">([^<]+)<\/script>/g,'FAQ'));
  assert.equal(faq['@type'],'FAQPage');
  assert.deepEqual(faq.mainEntity.map(q=>q.name),[
    'Quanto guadagna netto un quadro direttivo bancario?',
    'Quanto prende netto la 3ª area 4° livello?',
    'Quale contratto applicano le banche?',
    'A che punto è il rinnovo del contratto dei bancari?']);
  const visibile=uno(html,/<section class="ccnl-faq"><h2>Domande frequenti sul CCNL Bancari<\/h2>([\s\S]*?)<\/section>/g,'FAQ visibili');
  const paragrafi=[...visibile.matchAll(/<h3>([^<]+)<\/h3><p>([\s\S]*?)<\/p>/g)];
  assert.equal(paragrafi.length,4);
  faq.mainEntity.forEach((q,i)=>{
    assert.equal(paragrafi[i][1],q.name);
    assert.ok(testo(paragrafi[i][2]).startsWith(q.acceptedAnswer.text),q.name);
    assert.ok(q.acceptedAnswer.text.length<350,`${q.name}: ${q.acceptedAnswer.text.length} caratteri`);
  });
  const [quadro,area,contratto,rinnovo]=faq.mainEntity.map(q=>q.acceptedAnswer.text);
  for(const [testoRisposta,sezione,codice] of [[quadro,'aree-qd12','QD1'],[quadro,'qd34','QD4'],[area,'aree-qd12','3A4']]){
    const a=atteso(R,sezione,codice,ALLA);
    assert.ok(testoRisposta.includes(eur(a.lordo))&&testoRisposta.includes(eur(a.netto)),`${codice}: ${eur(a.lordo)} ${eur(a.netto)}`);
  }
  assert.ok(area.includes('3.341,90 €'));
  assert.match(quadro,/13 mensilità/);
  assert.match(contratto,/J241/);
  assert.match(contratto,/credito cooperativo hanno un contratto proprio/);
  assert.equal(rinnovo,STATO.faq(data(STATO.verificatoIl)));
  assert.doesNotMatch(rinnovo,/€|euro|\b518\b/);
  /* Link: alla pagina livello dove c'è, altrimenti alla sezione o al riquadro. */
  const link=paragrafi.map(p=>[...p[2].matchAll(/<a href="([^"]+)">/g)].map(m=>m[1]));
  assert.deepEqual(link,[
    ['../../minimi-ccnl/bancari/quadro-direttivo-1-livello/','../../minimi-ccnl/bancari/quadro-direttivo-4-livello/'],
    ['../../minimi-ccnl/bancari/3-area-4-livello/'],
    ['#aree-qd12','#qd34'],
    ['#rinnovo']]);
  /* Le FAQ vengono dopo le tabelle. */
  assert.ok(html.lastIndexOf('<section class="ccnl-sezione"')<html.indexOf('<section class="ccnl-faq">'));
});

test('scatti: i QD3–QD4 contano dall’assunzione o dalla nomina, le aree dall’assunzione (artt. 94 e 103)',()=>{
  const qd4=testo(leggi(`${ROTTA}quadro-direttivo-4-livello/`));
  assert.ok(qd4.includes('fino a 7 scatti, il primo dopo 4 anni e poi uno ogni 3, ciascuno dal primo giorno del mese in cui matura, '+
    'contando l’anzianità dalla data di assunzione o di nomina a quadro direttivo di 3° o 4° livello, che sostituisce gli scatti maturati prima.'));
  for(const rotta of PAGINE.filter(r=>!r.includes('quadro-direttivo-4'))){
    const t=testo(leggi(rotta));
    assert.ok(t.includes('fino a 8 scatti, il primo dopo 4 anni e poi uno ogni 3, ciascuno dal primo giorno del mese in cui matura, '+
      'contando l’anzianità di servizio dalla data di assunzione.'),rotta);
  }
  for(const rotta of PAGINE)assert.doesNotMatch(testo(leggi(rotta)),/stessa azienda/,rotta);
  /* Gli altri contratti tengono la frase di sempre. */
  assert.ok(testo(leggi('/minimi-ccnl/commercio/5-livello/')).includes('contando l’anzianità nella stessa azienda.'));
});

/* Un nome di livello che chiude con una parentesi, nel lead fra
   parentesi, diventava «(Area unificata (ex 1ª e 2ª area professionale))». */
test('nessuna doppia parentesi nel testo visibile di /minimi-ccnl/',()=>{
  const visibile=html=>testo(html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/g,''));
  for(const rotta of ROTTE)assert.doesNotMatch(visibile(leggi(rotta)),/\)\s*\)|\(\s*\(/,rotta);
  assert.ok(testo(leggi(ROTTA)).includes('va da 2.479,45 € (Area unificata, ex 1ª e 2ª area professionale) a 5.160,06 € (Quadro direttivo di 4° livello), su 2 sezioni'));
  assert.ok(testo(leggi('/minimi-ccnl/metalmeccanico-confapi/')).includes('(Quadro A, 9ª categoria).'));
  /* Le tabelle e i nomi nel dataset restano come sono. */
  assert.ok(leggi(ROTTA).includes('<th scope="row">Area unificata (ex 1ª e 2ª area professionale)</th>'));
});

/* --- IL GIORNO DELLA FIRMA, CON NUMERI FITTIZI ---------------

   Un J241 con due tranche dichiaratamente fittizie, costruito con
   R.creaCatalogo come farà il dataset: dal 1° aprile 2026, retroattiva,
   stipendi del 1° marzo 2026 più 100,00 €; dal 1° aprile 2027 altri
   150,00 €. Le due sezioni condividono le tabelle, come TABELLE_ABI. */
const vero=R.trovaContratto(ID);
const marzo=['qd34','aree-qd12'].flatMap(id=>vero.sezioni.find(s=>s.id===id).tabelle[0].livelli);
assert.equal(marzo.length,9);
const piu=euro=>marzo.map(l=>({...l,voci:l.voci.map(v=>v.id==='stipendio'?{...v,importo:Math.round((v.importo+euro)*100)/100}:v)}));
const FITTIZIE=[
  {decorrenza:'2026-03-01',titolo:vero.sezioni[0].tabelle[0].titolo,livelli:marzo},
  {decorrenza:'2026-04-01',titolo:'FITTIZIA, prova RIC-143: stipendi +100,00 € dal 1° aprile 2026',livelli:piu(100)},
  {decorrenza:'2027-04-01',titolo:'FITTIZIA, prova RIC-143: altri 150,00 € dal 1° aprile 2027',livelli:piu(250)},
];
const CATALOGO=R.creaCatalogo({versione:`${R.VERSIONE_DATASET}+fittizio-ric143`,
  contratti:R.CONTRATTI.map(c=>c.id!==ID?c:{...c,sezioni:c.sezioni.map(s=>({...s,tabelle:FITTIZIE}))}),
  esclusioni:R.ESCLUSIONI});
const FIRMA='2026-12-15';
const SEZIONI=['aree-qd12','qd34'];

test('il catalogo fittizio cambia solo il J241',()=>{
  for(const s of SEZIONI){
    assert.deepEqual(CATALOGO.livelli(ID,'2026-03-31',s),R.livelli(ID,'2026-03-31',s),s);
    assert.equal(CATALOGO.tabellaVigente(ID,FIRMA,s).decorrenza,'2026-04-01');
    assert.equal(CATALOGO.prossimaTabella(ID,FIRMA,s).decorrenza,'2027-04-01');
  }
  assert.equal(CATALOGO.componiRal({ccnl:ID,sezione:'aree-qd12',livello:'3A4',alla:FIRMA}).baseMensile,3441.90);
  assert.equal(CATALOGO.componiRal({ccnl:ID,sezione:'qd34',livello:'QD4',alla:'2027-04-01'}).baseMensile,5410.06);
});

test('alla firma: tabelle, blocco aumenti e pagine livello dai soli numeri del dataset',()=>{
  /* Nessun RangeError: la generazione arriva in fondo, anche per le pagine livello. */
  const firma=genera({alla:FIRMA,catalogo:CATALOGO});
  const html=firma(ROTTA);
  assert.doesNotMatch(html,/NaN|undefined|\[object/);

  /* Tabella vigente dal 1° aprile 2026 in tutte e due le sezioni, con la colonna della tranche dopo. */
  for(const s of SEZIONI){
    const sezione=uno(html,new RegExp(`<section class="ccnl-sezione" id="${s}">([\\s\\S]*?)</section>`,'g'),s);
    assert.match(sezione,/tabella in vigore dal 1° aprile 2026/,s);
    assert.ok(sezione.includes('<th scope="col">Dal 1° aprile 2027</th>'),s);
    assert.match(sezione,/La prossima tranche firmata decorre dal 1° aprile 2027\./,s);
  }
  const riga=(s,nome)=>testo(uno(html,new RegExp(`<section class="ccnl-sezione" id="${s}">[\\s\\S]*?<tr><th scope="row">(?:<a [^>]+>)?${nome}(?:</a>)?</th>([\\s\\S]*?)</tr>`,'g'),nome));
  assert.ok(riga('aree-qd12','3ª area professionale, 4° livello').startsWith(' 3.441,90 € 3.591,90 € '));
  assert.ok(riga('qd34','Quadro direttivo di 4° livello').startsWith(' 5.260,06 € 5.410,06 € '));

  /* Blocco aumenti: due tranche per sezione; ad aprile 2026 il «prima» è la tabella del 1° marzo 2026. */
  const aumenti=uno(html,/<section class="ccnl-aumenti" id="aumenti">([\s\S]*?)<section class="ccnl-faq">/g,'blocco');
  assert.match(aumenti,/<h2>Aumenti 2026–2027: lordo e netto prima e dopo<\/h2>/);
  assert.equal([...aumenti.matchAll(/<section class="ccnl-aumento" /g)].length,4);
  for(const s of SEZIONI)for(const [decorrenza,aumento,titolo] of [['2026-04-01','+100,00 €','In vigore dal 1° aprile 2026'],['2027-04-01','+150,00 €','Dal 1° aprile 2027']]){
    const b=uno(aumenti,new RegExp(`<section class="ccnl-aumento" data-decorrenza="${decorrenza}" data-sezione="${s}">([\\s\\S]*?)</section>`,'g'),`${s} ${decorrenza}`);
    assert.ok(b.includes(`<h4>${titolo}</h4>`),`${s} ${decorrenza}`);
    const prima=new Date(Date.parse(decorrenza)-86400000).toISOString().slice(0,10);
    const livelli=CATALOGO.livelli(ID,prima,s);
    assert.equal([...b.matchAll(/<tr data-livello=/g)].length,livelli.length);
    for(const l of livelli){
      const r=testo(uno(b,new RegExp(`<tr data-livello="${l.codice}">([\\s\\S]*?)</tr>`,'g'),`${s} ${l.codice}`));
      const p=atteso(CATALOGO,s,l.codice,prima),d=atteso(CATALOGO,s,l.codice,decorrenza);
      if(decorrenza==='2026-04-01')assert.equal(p.lordo,R.componiRal({ccnl:ID,sezione:s,livello:l.codice,alla:'2026-03-01'}).baseMensile,l.codice);
      assert.ok(r.includes(aumento),`${s} ${l.codice}: ${aumento}`);
      for(const importo of [p.lordo,d.lordo,p.netto,d.netto])assert.ok(r.includes(eur(importo)),`${s} ${l.codice}: ${eur(importo)}`);
    }
  }
  assert.ok(uno(aumenti,/<section class="ccnl-aumento" data-decorrenza="2026-04-01" data-sezione="aree-qd12">([\s\S]*?)<\/section>/g,'3A4')
    .includes('<td>3.341,90 €</td><td>+100,00 €</td><td>3.441,90 €</td>'));
  assert.ok(uno(aumenti,/<section class="ccnl-aumento" data-decorrenza="2026-04-01" data-sezione="qd34">([\s\S]*?)<\/section>/g,'QD4')
    .includes('<td>5.160,06 €</td><td>+100,00 €</td><td>5.260,06 €</td>'));

  /* Pagine 3A4 e QD4: il nuovo minimo e la frase sulla tranche futura. */
  for(const [pagina,minimo,futuro] of [['3-area-4-livello','3.441,90 €','3.591,90 €'],['quadro-direttivo-4-livello','5.260,06 €','5.410,06 €']]){
    const livello=firma(`${ROTTA}${pagina}/`);
    assert.equal(livello.match(/<span class="micro">Minimo lordo mensile<\/span><b>([^<]+)<\/b>/)[1],minimo,pagina);
    assert.ok(testo(livello).includes(`Dal 1° aprile 2027 la tranche già firmata porta il minimo a ${futuro} lordi al mese`),pagina);
    assert.match(livello,/Tabella nazionale in vigore dal 1° aprile 2026\./,pagina);
    assert.doesNotMatch(livello,/NaN|undefined/,pagina);
  }
  /* Le FAQ leggono i numeri nuovi. */
  const faq=JSON.parse(uno(html,/<script id="faq-bancari" type="application\/ld\+json">([^<]+)<\/script>/g,'FAQ'));
  assert.ok(faq.mainEntity[1].acceptedAnswer.text.includes('3.441,90 €'));
  assert.ok(faq.mainEntity[0].acceptedAnswer.text.includes('5.260,06 €'));
  /* Gli altri contratti non cambiano. */
  const reale=genera({alla:FIRMA});
  for(const rotta of ['/minimi-ccnl/commercio/','/minimi-ccnl/metalmeccanico-artigiano/','/minimi-ccnl/gomma-plastica/','/minimi-ccnl/commercio/5-livello/'])
    assert.equal(firma(rotta),reale(rotta),rotta);
});

test('senza catalogo il generatore usa il dataset: stesse pagine di prima',()=>{
  const conR=genera({alla:ALLA,catalogo:R});
  for(const rotta of ['/minimi-ccnl/',ROTTA,...PAGINE,'/minimi-ccnl/chimico-farmaceutico/'])assert.equal(conR(rotta),leggi(rotta),rotta);
});
