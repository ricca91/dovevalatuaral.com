const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {test}=require('node:test');
const {CONTRATTI_SEO,generate,datiContratto,caloNetto}=require('./genera-pagine-ccnl.js');
const {renderTabella}=require('./ccnl-page.template.js');
const R=require('./retribuzione-ccnl.js');
const {calcola,applicaMensilita,eur}=require('./motore.js');

/* RIC-141: il blocco aumenti letto dal dataset, acceso dal flag
   `aumentiDalDataset`, sul metalmeccanico artigiano (C030). */

const ID='area-meccanica-artigianato-c030';
const ROTTA='/minimi-ccnl/metalmeccanico-artigiano/';
const ALLA='2026-09-22';
const generaAl=alla=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),`ric141-${alla}-`));
  generate(dir,{alla});
  return rotta=>fs.readFileSync(path.join(dir,rotta,'index.html'),'utf8');
};
const leggi=generaAl(ALLA);
const testo=html=>html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
const uno=(html,re,label)=>{const m=[...html.matchAll(re)];assert.equal(m.length,1,label);return m[0][1];};
const giornoPrima=iso=>new Date(Date.parse(iso)-86400000).toISOString().slice(0,10);
const seo=slug=>CONTRATTI_SEO.find(c=>c.slug===slug);
const blocco=(html,decorrenza,sezione)=>uno(html,
  new RegExp(`<section class="ccnl-aumento" data-decorrenza="${decorrenza}"${sezione?` data-sezione="${sezione}"`:''}>([\\s\\S]*?)</section>`,'g'),
  `${decorrenza} ${sezione}`);
/* Il netto come lo calcola il motore, senza passare dal generatore. */
const atteso=(sezione,codice,alla)=>{
  const composta=R.componiRal({ccnl:ID,sezione,livello:codice,alla});
  return {lordo:composta.baseMensile,
    netto:applicaMensilita(calcola(String(composta.ral),{comune:'F205',nucleo:[]}),composta.mensilita).kpi.mediaMensile};
};

test('artigiano: una sezione ccnl-aumento per tranche e sezione, lordo e netto prima/dopo dal motore',()=>{
  const html=leggi(ROTTA);
  const sezioni=R.sezioni(ID).map(s=>s.id);
  assert.equal(sezioni.length,4);
  assert.equal([...html.matchAll(/<section class="ccnl-aumento" /g)].length,8);
  for(const sezione of sezioni)for(const decorrenza of ['2026-03-01','2026-11-01']){
    const b=blocco(html,decorrenza,sezione);
    const prima=giornoPrima(decorrenza);
    for(const livello of R.livelli(ID,prima,sezione)){
      const riga=testo(uno(b,new RegExp(`<tr data-livello="${livello.codice}">([\\s\\S]*?)</tr>`,'g'),`${sezione} ${livello.codice}`));
      const p=atteso(sezione,livello.codice,prima),d=atteso(sezione,livello.codice,decorrenza);
      for(const importo of [p.lordo,d.lordo,p.netto,d.netto])assert.ok(riga.includes(eur(importo)),`${sezione} ${livello.codice}: ${eur(importo)}`);
      assert.ok(riga.includes(`+${eur(d.lordo-p.lordo)}`),`${sezione} ${livello.codice}: aumento`);
    }
    /* La fonte di ogni tranche è il titolo della tabella del dataset. */
    assert.ok(b.includes(R.prossimaTabella(ID,prima,sezione).titolo),`${sezione} ${decorrenza}: titolo`);
  }
  /* Valori di controllo del ticket, 5° livello metalmeccanica. */
  const cinque=testo(uno(blocco(html,'2026-11-01','metalmeccanica-impianti'),/<tr data-livello="5">([\s\S]*?)<\/tr>/g,'5°'));
  assert.equal(cinque,' 5 1.595,91 € +19,26 € 1.615,17 € 1.378,04 € 1.390,47 € ');
});

test('artigiano: titolo, intestazioni, limiti, fonte e posizione del blocco',()=>{
  const html=leggi(ROTTA);
  const aumenti=uno(html,/<section class="ccnl-aumenti" id="aumenti">([\s\S]*?)<section class="ccnl-faq">/g,'blocco');
  assert.match(aumenti,/<h2>Aumenti 2026: lordo e netto prima e dopo<\/h2>/);
  assert.match(blocco(html,'2026-03-01','metalmeccanica-impianti'),/<h4>In vigore dal 1° marzo 2026<\/h4>/);
  assert.match(blocco(html,'2026-11-01','metalmeccanica-impianti'),/<h4>Dal 1° novembre 2026<\/h4>/);
  const t=testo(aumenti);
  assert.match(t,/regole fiscali 2026, RAL annualizzata su 13 mensilità/);
  assert.match(t,/media annua, non il cedolino del mese dell’aumento/);
  assert.match(t,/superminimo assorbibile può ridurre l’aumento/);
  assert.match(aumenti,/Fonte degli aumenti: <a href="https:\/\/az-apim-cne-sa-0002-lgc-we\.azure-api\.net\/[^"]+221687"/);
  /* Aperta solo la sezione con le pagine livello; le altre in <details> chiusi. */
  const chiuse=[...aumenti.matchAll(/<details class="ccnl-aumenti__sezione"><summary>([^<]+)<\/summary>([\s\S]*?)<\/details>/g)];
  assert.deepEqual(chiuse.map(m=>m[1]),['Orafi, argentieri ed affini','Odontotecnica','Restauro di beni culturali']);
  for(const [,,dentro] of chiuse)assert.equal([...dentro.matchAll(/data-sezione="metalmeccanica-impianti"/g)].length,0);
  assert.doesNotMatch(aumenti,/<details[^>]* open/);
  /* Dopo le tabelle per sezione, prima delle FAQ. */
  assert.ok(html.lastIndexOf('<section class="ccnl-sezione"')<html.indexOf('id="aumenti"'));
  assert.ok(html.indexOf('id="aumenti"')<html.indexOf('<section class="ccnl-faq">'));
});

test('artigiano al 15 novembre 2026: la tranche di novembre resta, «In vigore dal», tabella a 1.615,17 €',()=>{
  const html=generaAl('2026-11-15')(ROTTA);
  assert.match(blocco(html,'2026-11-01','metalmeccanica-impianti'),/<h4>In vigore dal 1° novembre 2026<\/h4>/);
  assert.match(blocco(html,'2026-03-01','orafi'),/<h4>In vigore dal 1° marzo 2026<\/h4>/);
  const principale=uno(html,/<section class="ccnl-sezione" id="metalmeccanica-impianti">([\s\S]*?)<\/section>/g,'tabella');
  assert.ok(testo(uno(principale,/<tr><th scope="row">(?:<a [^>]+>)?5(?:<\/a>)?<\/th>([\s\S]*?)<\/tr>/g,'5°')).includes('1.615,17 €'));
  assert.match(html,/Aggiornato al <time datetime="2026-11-15">15 novembre 2026<\/time>/);
});

test('artigiano al 15 novembre 2027: nessuna tranche negli ultimi 12 mesi né futura, niente blocco',()=>{
  const html=generaAl('2027-11-15')(ROTTA);
  assert.doesNotMatch(html,/ccnl-aumento|id="aumenti"/);
  assert.match(html,/Aggiornato al <time datetime="2027-11-15">/);
  /* Senza blocco la domanda sull'aumento si toglie; le altre restano coerenti. */
  const faq=JSON.parse(uno(html,/<script id="faq-metalmeccanico-artigiano" type="application\/ld\+json">([^<]+)<\/script>/g,'FAQ'));
  assert.equal(faq.mainEntity.length,3);
  for(const q of faq.mainEntity)assert.ok(testo(html).includes(q.acceptedAnswer.text));
  assert.doesNotMatch(html,/NaN|undefined/);
});

test('con una sola tranche nella finestra il titolo è «Aumento del …»',()=>{
  const html=generaAl('2027-06-01')(ROTTA);
  assert.match(html,/<h2>Aumento del 1° novembre 2026: lordo e netto prima e dopo<\/h2>/);
  assert.equal([...html.matchAll(/<section class="ccnl-aumento" /g)].length,4);
});

test('FAQ artigiano: quattro domande, testo identico nella pagina e nello schema, numeri dalla tabella',()=>{
  const html=leggi(ROTTA);
  const faq=JSON.parse(uno(html,/<script id="faq-metalmeccanico-artigiano" type="application\/ld\+json">([^<]+)<\/script>/g,'FAQ'));
  assert.equal(faq['@type'],'FAQPage');
  assert.deepEqual(faq.mainEntity.map(q=>q.name),[
    'Quanto prende netto il 5° livello metalmeccanico artigiano?',
    'Di quanto aumenta lo stipendio a novembre 2026?',
    'Che differenza c’è con il metalmeccanico industria?',
    'Il contratto metalmeccanico artigiano Conflavoro è lo stesso?']);
  const visibile=uno(html,/<section class="ccnl-faq">([\s\S]*?)<\/section>/g,'FAQ visibili');
  const paragrafi=[...visibile.matchAll(/<h3>([^<]+)<\/h3><p>([\s\S]*?)<\/p>/g)];
  assert.equal(paragrafi.length,4);
  faq.mainEntity.forEach((q,i)=>{
    assert.equal(paragrafi[i][1],q.name);
    assert.ok(testo(paragrafi[i][2]).startsWith(q.acceptedAnswer.text),q.name);
    assert.ok(q.acceptedAnswer.text.length<350,`${q.name}: ${q.acceptedAnswer.text.length}`);
    /* Ogni risposta linka la pagina livello o, finché non c'è, l'ancora della sezione. */
    assert.match(paragrafi[i][2],/<a href="(#metalmeccanica-impianti|[^"]*\/minimi-ccnl\/metalmeccanico-artigiano\/[^"]+)">/,q.name);
  });
  const [netto,aumento,industria,conflavoro]=faq.mainEntity.map(q=>q.acceptedAnswer.text);
  const vigente=atteso('metalmeccanica-impianti','5',ALLA);
  assert.ok(netto.includes(eur(vigente.lordo))&&netto.includes(eur(vigente.netto)));
  assert.match(netto,/13 mensilità.*tempo pieno a Milano senza scatti né superminimo/);
  const p=atteso('metalmeccanica-impianti','5','2026-10-31'),d=atteso('metalmeccanica-impianti','5','2026-11-01');
  assert.ok(aumento.includes(`da ${eur(p.lordo)} a ${eur(d.lordo)} lordi`));
  assert.ok(aumento.includes(`da ${eur(p.netto)} a ${eur(d.netto)}`));
  assert.match(aumento,/quarta e ultima tranche \(art\. 29\)/);
  assert.match(industria,/C011 .*livelli D1–A1.*C030 .*livelli 1Q–6/);
  assert.match(paragrafi[2][2],/href="\.\.\/\.\.\/minimi-ccnl\/metalmeccanico\/"/);
  assert.match(conflavoro,/^No\./);
  assert.match(conflavoro,/C049/);
  /* Nessun importo del contratto Conflavoro, che queste tabelle non coprono. */
  assert.doesNotMatch(conflavoro,/€|\d\.\d{3}/);
  assert.doesNotMatch(html,/1\.658/);
});

test('«Aggiornato al» sulla tabella artigiana',()=>{
  assert.match(leggi(ROTTA),/<p class="small">Aggiornato al <time datetime="2026-09-22">22 settembre 2026<\/time>\.<\/p>/);
});

test('commercio e metalmeccanico industria restano sul blocco con le date scritte, senza il generico',()=>{
  for(const slug of ['commercio','metalmeccanico']){
    const html=leggi(`/minimi-ccnl/${slug}/`);
    assert.equal(seo(slug).aumentiDalDataset,undefined,slug);
    assert.doesNotMatch(html,/class="ccnl-aumenti"|data-sezione=|faq-metalmeccanico-artigiano/,slug);
  }
  assert.equal([...leggi('/minimi-ccnl/commercio/').matchAll(/<section class="ccnl-aumento" /g)].length,2);
  assert.equal([...leggi('/minimi-ccnl/metalmeccanico/').matchAll(/<section class="ccnl-aumento" /g)].length,3);
});

test('la prima tabella del dataset non ha un prima: la tranche si salta (bancari, 1° marzo 2026)',()=>{
  const bancari=seo('bancari');
  /* Il caso è reale: al giorno prima della sola tabella del J241 non c'è niente. */
  for(const s of R.sezioni(bancari.id))assert.throws(()=>R.livelli(bancari.id,'2026-02-28',s.id),RangeError);
  for(const alla of ['2026-03-15',ALLA]){
    const d=datiContratto({...bancari,aumentiDalDataset:true},alla);
    assert.deepEqual(d.aumentiDataset,[],alla);
    assert.doesNotMatch(renderTabella({...d,alla}),/ccnl-aumento/,alla);
  }
});

test('blocco generico su un contratto senza sezioni: niente data-sezione, h3 per tranche, anni oltre il 2026 dichiarati',()=>{
  const gomma=seo('gomma-plastica');
  const d=datiContratto({...gomma,aumentiDalDataset:true},ALLA);
  assert.deepEqual(d.aumentiDataset.map(t=>t.decorrenza),['2026-01-01','2027-04-01','2028-04-01','2028-12-01']);
  const html=renderTabella({...d,alla:ALLA});
  assert.match(html,/<h2>Aumenti 2026–2028: lordo e netto prima e dopo<\/h2>/);
  assert.match(testo(html),/regole fiscali 2026 anche per il 2027 e il 2028/);
  assert.equal([...html.matchAll(/<section class="ccnl-aumento" data-decorrenza="\d{4}-\d{2}-\d{2}">/g)].length,4);
  assert.doesNotMatch(html,/data-sezione=|<details class="ccnl-aumenti__sezione"/);
  assert.match(html,/<h3>In vigore dal 1° gennaio 2026<\/h3>/);
  assert.match(html,/<h3>Dal 1° aprile 2027<\/h3>/);
  assert.match(html,/Aggiornato al <time/);
  assert.doesNotMatch(html,/NaN|undefined/);
});

test('blocco generico senza sezioneLivelli: tutte le sezioni aperte',()=>{
  const {sezioneLivelli,...senza}=seo('metalmeccanico-artigiano');
  assert.equal(sezioneLivelli,'metalmeccanica-impianti');
  const d=datiContratto(senza,ALLA);
  assert.ok(d.aumentiDataset.every(t=>t.aperta));
  const html=renderTabella({...d,alla:ALLA});
  assert.doesNotMatch(html,/<details class="ccnl-aumenti__sezione"/);
  assert.equal([...html.matchAll(/<div class="ccnl-aumenti__sezione"><h3>/g)].length,4);
});

test('dove il netto dopo scende, una nota con soglia, Comune e importi presi dal motore',()=>{
  const html=leggi(ROTTA);
  /* Le righe con il netto in calo, ricalcolate qui dal motore. */
  const calcolo=(sezione,codice,alla)=>{
    const composta=R.componiRal({ccnl:ID,sezione,livello:codice,alla});
    return applicaMensilita(calcola(String(composta.ral),{comune:'F205',nucleo:[]}),composta.mensilita);
  };
  const attese=[];
  for(const s of R.sezioni(ID))for(const decorrenza of ['2026-03-01','2026-11-01'])
    for(const livello of R.livelli(ID,giornoPrima(decorrenza),s.id)){
      const p=calcolo(s.id,livello.codice,giornoPrima(decorrenza)),d=calcolo(s.id,livello.codice,decorrenza);
      if(d.kpi.mediaMensile<p.kpi.mediaMensile)attese.push({sezione:s.id,decorrenza,codice:livello.codice,p,d});
    }
  assert.deepEqual(attese.map(a=>`${a.sezione} ${a.decorrenza} ${a.codice}`),
    ['metalmeccanica-impianti 2026-11-01 2','orafi 2026-11-01 2']);
  assert.equal([...html.matchAll(/class="small ccnl-aumento__nota"/g)].length,attese.length);
  for(const a of attese){
    const nota=testo(uno(blocco(html,a.decorrenza,a.sezione),/<p class="small ccnl-aumento__nota" data-livello="2">([\s\S]*?)<\/p>/g,a.sezione));
    const add=v=>v.voci.find(x=>x.id==='addcom');
    const soglia=add(a.d).regola.esenzioneFinoA;
    assert.ok(add(a.p).base<=soglia&&add(a.d).base>soglia);
    assert.equal(nota,`2° livello: il netto medio scende di ${eur(a.p.kpi.mediaMensile-a.d.kpi.mediaMensile)} al mese nonostante l’aumento lordo. `+
      `L’imponibile IRPEF annuo passa da ${eur(add(a.p).base)} a ${eur(add(a.d).base)} e supera i ${eur(soglia)} fino a cui `+
      `il Comune di ${a.d.geografia.comune} esenta dall’addizionale comunale: l’addizionale diventa dovuta, ${eur(-add(a.d).importo)} l’anno.`);
  }
  /* Nessuna nota dove il netto sale, né sulle tabelle con le date scritte. */
  assert.doesNotMatch(blocco(html,'2026-03-01','metalmeccanica-impianti'),/ccnl-aumento__nota/);
  for(const slug of ['commercio','metalmeccanico'])assert.doesNotMatch(leggi(`/minimi-ccnl/${slug}/`),/ccnl-aumento__nota/);
});

test('se la causa del calo non è una soglia di esenzione, la nota resta generica',()=>{
  const riga=(netto,base)=>({nettoMensile:netto,voci:[{id:'addcom',base,importo:-1,nome:'Milano',regola:{esenzioneFinoA:23000}}]});
  assert.equal(caloNetto(riga(1500,24000),riga(1501,24100)),null);
  assert.deepEqual(caloNetto(riga(1500,24000),riga(1499.5,24100)),{netto:0.5,causa:null});
  assert.equal(caloNetto(riga(1500,22900),riga(1499.5,23100)).causa.soglia,23000);
  const d=datiContratto(seo('metalmeccanico-artigiano'),ALLA);
  const r=d.aumentiDataset[0].righe.find(x=>x.livello.codice==='5');
  r.calo={netto:0.5,causa:null};
  const html=renderTabella({...d,alla:ALLA});
  assert.ok(testo(html).includes('5° livello: il netto medio scende di 0,50 € al mese nonostante l’aumento lordo. Con il nuovo lordo imposte e detrazioni del calcolo 2026 cambiano più dell’aumento.'));
});
