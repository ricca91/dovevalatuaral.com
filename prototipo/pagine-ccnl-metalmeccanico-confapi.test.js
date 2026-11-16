const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {test}=require('node:test');
const {CONTRATTI_SEO,generate}=require('./genera-pagine-ccnl.js');
const R=require('./retribuzione-ccnl.js');
const {calcola,applicaMensilita,eur}=require('./motore.js');

/* RIC-228: Metalmeccanico Confapi (C018). Aumenti, FAQ e data letti dal
   dataset; valori di controllo dal verbale del 17 giugno 2026 e
   dall'ipotesi del 4 giugno 2026 (p. 5) in processo/dati/fonti. */

const ID='metalmeccanica-pmi-confapi-c018';
const ROTTA='/minimi-ccnl/metalmeccanico-confapi/';
const ALLA='2026-11-16';
const genera=alla=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),`ric228-${alla}-`));
  generate(dir,{alla});
  return fs.readFileSync(path.join(dir,ROTTA,'index.html'),'utf8');
};
const html=genera(ALLA);
const testo=h=>h.replace(/<script[\s\S]*?<\/script>/g,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
const uno=(h,re,label)=>{const m=[...h.matchAll(re)];assert.equal(m.length,1,label);return m[0][1];};
const faqDi=h=>JSON.parse(uno(h,/<script id="faq-metalmeccanico-confapi" type="application\/ld\+json">([\s\S]*?)<\/script>/g,'schema FAQ'));
const blocco=(h,d)=>uno(h,new RegExp(`<section class="ccnl-aumento" data-decorrenza="${d}">([\\s\\S]*?)</section>`,'g'),d);

test('flag acceso e dati del dataset coerenti con le fonti',()=>{
  assert.equal(CONTRATTI_SEO.find(c=>c.slug==='metalmeccanico-confapi').aumentiDalDataset,true);
  const minimo=(codice,alla)=>R.livelli(ID,alla).find(l=>l.codice===codice).voci.find(v=>v.id==='minimo').importo;
  /* Verbale 17 giugno 2026: 5° livello 2.245,87 (+50,00); ipotesi 4 giugno 2026: 2.290,87 e 2.345,87. */
  assert.equal(minimo('5','2026-06-01'),2245.87);
  assert.equal(minimo('5','2027-06-01'),2290.87);
  assert.equal(minimo('5','2028-06-01'),2345.87);
  assert.equal(minimo('9Q','2026-06-01'),3124.30);
});

test('blocco aumenti: tre tranche, lordo e netto prima/dopo dal motore',()=>{
  assert.equal([...html.matchAll(/<section class="ccnl-aumento" /g)].length,3);
  for(const d of ['2026-06-01','2027-06-01','2028-06-01']){
    const b=blocco(html,d),prima=new Date(Date.parse(d)-86400000).toISOString().slice(0,10);
    const riga=testo(uno(b,/<tr data-livello="5">([\s\S]*?)<\/tr>/g,d));
    for(const alla of [prima,d]){
      const c=R.componiRal({ccnl:ID,livello:'5',alla});
      const netto=applicaMensilita(calcola(String(c.ral),{comune:'F205',nucleo:[]}),c.mensilita).kpi.mediaMensile;
      assert.ok(riga.includes(eur(c.baseMensile))&&riga.includes(eur(netto)),`${d} ${alla}`);
    }
  }
  assert.match(testo(blocco(html,'2026-06-01')),/5ª categoria 2\.195,87 € \+50,00 € 2\.245,87 €/);
  assert.match(testo(html),/Aumenti 2026–2028: lordo e netto prima e dopo/);
  assert.match(testo(html),/Fonte degli aumenti: Ipotesi di accordo di rinnovo CCNL Unionmeccanica Confapi/);
});

test('nota IPCA: soglie e valore 2025 dalle fonti, esce solo con le tranche 2027 e 2028',()=>{
  const nota=testo(uno(html,/<p class="small ccnl-aumenti__nota">([\s\S]*?)<\/p>/g,'nota'));
  assert.match(nota,/2,653% nel 2027 e 2,729% nel 2028 \(art\. 40\).*IPCA 2025 è stato 1,9%/);
  assert.doesNotMatch(genera('2030-01-15'),/ccnl-aumenti__nota/);
});

test('data di aggiornamento visibile',()=>{
  assert.match(html,new RegExp(`Aggiornato al <time datetime="${ALLA}">16 novembre 2026</time>`));
});

test('FAQ: tre domande, schema FAQPage uguale al testo, sotto i 350 caratteri, cifre dal dataset',()=>{
  const faq=faqDi(html);
  assert.equal(faq['@type'],'FAQPage');
  assert.equal(faq.mainEntity.length,3);
  const visibile=uno(html,/<section class="ccnl-faq">([\s\S]*?)<\/section>/g,'FAQ visibili');
  const paragrafi=[...visibile.matchAll(/<h3>([^<]+)<\/h3><p>([\s\S]*?)<\/p>/g)];
  assert.equal(paragrafi.length,3);
  faq.mainEntity.forEach((q,i)=>{
    assert.equal(paragrafi[i][1],q.name);
    assert.ok(testo(paragrafi[i][2]).startsWith(q.acceptedAnswer.text),q.name);
    assert.ok(q.acceptedAnswer.text.length<350,`${q.name}: ${q.acceptedAnswer.text.length}`);
  });
  const [diff,decorrenza,livelli]=faq.mainEntity.map(q=>q.acceptedAnswer.text);
  assert.match(diff,/C011 \(Federmeccanica-Assistal\).*C018 \(Unionmeccanica Confapi, categorie 1–9\)/);
  assert.match(decorrenza,/dal 1° giugno 2026 \(verbale del 17 giugno 2026\).*1° giugno 2027 e 1° giugno 2028.*da 2\.245,87 € a 2\.290,87 €.*2,653% nel 2027 e 2,729% nel 2028/);
  assert.match(livelli,/^9 categorie, dalla 1ª alla 9ª, più i Quadri 8Q e 9Q.*2\.245,87 € lordi al mese.*su 13 mensilità/);
  const c=R.componiRal({ccnl:ID,livello:'5',alla:ALLA});
  const netto=applicaMensilita(calcola(String(c.ral),{comune:'F205',nucleo:[]}),c.mensilita).kpi.mediaMensile;
  assert.ok(livelli.includes(eur(netto)));
  assert.match(visibile,/href="[^"]*minimi-ccnl\/metalmeccanico\/"/);
});

test('senza tranche nella finestra: niente blocco, nota né NaN; FAQ coerente',()=>{
  const h=genera('2030-01-15');
  assert.doesNotMatch(h,/ccnl-aumento|id="aumenti"|NaN|undefined/);
  assert.match(h,/Aggiornato al <time datetime="2030-01-15">/);
  for(const q of faqDi(h).mainEntity)assert.ok(testo(h).includes(q.acceptedAnswer.text),q.name);
});
