const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {calcola}=require('./motore');
const {parse}=require('./articoli-parser');
const slug='stipendio-netto-2027';
const articolo=parse(fs.readFileSync(path.join(__dirname,'articoli',`${slug}.md`),'utf8'),`${slug}.md`);
const {body}=articolo;
const [testo,fonti]=body.split('## Fonti');
const sezione=titolo=>{
  const start=body.indexOf(titolo);
  assert.ok(start>=0,titolo);
  const end=body.slice(start+titolo.length).search(/\n#{2,3} /);
  return body.slice(start,end<0?undefined:start+titolo.length+end);
};
const cents=s=>Math.round(Number(s.replace(/[€\s+.]/g,'').replace(',','.'))*100);
const rows=text=>text.split('\n').filter(l=>/^\| [\d.]+ € \|/.test(l)).map(l=>l.split('|').slice(1,-1).map(s=>s.trim()));

test('stipendio 2027: il CdM del 28 ottobre è al passato, il DDL non è presentato come ipotesi (RIC-155)',()=>{
  assert.doesNotMatch(body,/il testo arriva in Consiglio dei ministri/);
  assert.doesNotMatch(body,/Nessuna misura della manovra 2027 è ancora legge/);
  assert.doesNotMatch(body,/nessuna è ancora scritta in un documento ufficiale/);
  assert.doesNotMatch(body,/ipotesi più avanzata/);
  assert.doesNotMatch(body,/il Consiglio dei ministri approva il disegno di legge/);
  assert.doesNotMatch(body,/il giorno prima del Consiglio dei ministri/);
  assert.match(body.split('\n')[0],/^Il 28 ottobre 2026 il Consiglio dei ministri ha approvato il disegno di legge di bilancio 2027\./);
  assert.match(sezione('## Quando entra in vigore'),/\*\*28 ottobre 2026\*\*: il Consiglio dei ministri ha approvato il disegno di legge/);
});

test('stipendio 2027: la soglia a 55.000 € è misura del DDL, non legge, e il Parlamento può cambiarla (RIC-155)',()=>{
  const apertura=body.split('\n\n').slice(0,2).join('\n');
  assert.match(apertura,/non è ancora legge/);
  assert.match(apertura,/può cambiare durante l'esame in Parlamento/);
  assert.match(apertura,/aliquota IRPEF del 33% fino a 55\.000 €/);
  assert.match(apertura,/beneficio massimo annunciato di \*\*500 € l'anno\*\*/);
  assert.match(articolo.description,/approvat[oa] dal Consiglio dei ministri/);
  assert.match(articolo.description,/non è ancora legge/);
  assert.match(articolo.ipotesi_calcolo,/DDL approvato dal Consiglio dei ministri il 28 ottobre 2026, non ancora legge/);
  assert.doesNotMatch(testo,/L'ipotesi abbassa|l'ipotesi a 55\.000|ipotesi del 33%/i);
});

test('stipendio 2027: misure del DDL, proposte rimaste fuori e regole vigenti stanno in sezioni separate (RIC-155)',()=>{
  const vigenti=sezione('## Cosa è già certo per lo stipendio del 2027');
  const ddl=sezione('### Cosa c\'è nel disegno di legge approvato dal Consiglio dei ministri');
  const fuori=sezione('### Cosa è rimasto fuori o non è confermato');
  assert.ok(body.indexOf(vigenti)<body.indexOf(ddl)&&body.indexOf(ddl)<body.indexOf(fuori));
  assert.match(vigenti,/23% fino a 28\.000 €, 33% fino a 50\.000 €, 43% oltre/);
  assert.match(ddl,/IRPEF al 33% fino a 55\.000 €/);
  assert.match(ddl,/5% sugli aumenti contrattuali/);
  assert.match(ddl,/1%/);
  for(const proposta of [/60\.000 € dal 2028/,/tassa piatta al 5%[^\n]*35 anni/,/tredicesima detassata/i]){
    assert.match(fuori,proposta);
    assert.doesNotMatch(ddl,proposta);
  }
  assert.doesNotMatch(sezione('## La tredicesima cambia a dicembre 2026 o nel 2027'),/Documento programmatico di bilancio e nessun testo ufficiale/);
});

test('stipendio 2027: le tabelle sono lo scenario del DDL e tornano con il motore (RIC-155)',()=>{
  const tabelle=sezione('## Quanto cambia il netto nel 2027, RAL per RAL');
  assert.match(tabelle,/scenario del DDL approvato dal Consiglio dei ministri, non ancora legge/);
  assert.doesNotMatch(tabelle,/fino a 60\.000 €/);
  const annuo=rows(tabelle).filter(r=>r.length===4);
  const mensile=rows(tabelle).filter(r=>r.length===3);
  assert.equal(annuo.length,8);
  assert.equal(mensile.length,5);
  const ddl=ral=>{
    const r=calcola(ral);
    const taglio=Math.round(Math.max(0,Math.min(r.imponibile,55000)-50000)*10);
    return {oggi:Math.round(r.kpi.nettoAnnuo*100),taglio};
  };
  for(const [ral,oggi,scenario,differenza] of annuo){
    const atteso=ddl(cents(ral)/100);
    assert.equal(cents(oggi),atteso.oggi,ral);
    assert.equal(cents(differenza),atteso.taglio,ral);
    assert.equal(cents(scenario),atteso.oggi+atteso.taglio,ral);
  }
  for(const [ral,oggi,scenario] of mensile){
    const atteso=ddl(cents(ral)/100);
    assert.equal(cents(oggi),Math.round(atteso.oggi/13),ral);
    assert.equal(cents(scenario),Math.round((atteso.oggi+atteso.taglio)/13),ral);
  }
});

test('stipendio 2027: fonti del CdM e data di aggiornamento visibile (RIC-155)',()=>{
  assert.ok(articolo.data_aggiornamento>='2026-10-29',articolo.data_aggiornamento);
  assert.match(fonti,/Comunicato stampa del Consiglio dei ministri n\. 195[^\n]*https:\/\/www\.governo\.it\/it\/articolo\/comunicato-stampa-del-consiglio-dei-ministri-n-195\/32973[^\n]*letto il 29 ottobre 2026/);
  assert.match(fonti,/Corriere della Sera, 28 ottobre 2026[^\n]*500 euro/);
  assert.doesNotMatch(fonti,/Consiglio dei ministri sulla manovra fissato per il 28 ottobre/);
  const {prepare}=require('./genera-articoli');
  const html=prepare().pages.get(`/blog/${slug}/`);
  assert.match(html,/Aggiornato il <time datetime="2026-10-29">29 ottobre 2026<\/time>/);
});
