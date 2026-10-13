const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {parse}=require('./articoli-parser');
const text=fs.readFileSync(path.join(__dirname,'articoli','ferie-busta-paga-ore-o-giorni.md'),'utf8');
const articolo=parse(text,'ferie-busta-paga-ore-o-giorni.md');
const {body}=articolo;
const sezione=titolo=>{
  const start=body.indexOf(titolo);
  assert.ok(start>=0,titolo);
  const end=body.indexOf('\n#',start+titolo.length);
  return body.slice(start,end<0?undefined:end);
};
const ap=sezione('### Che cosa vuol dire ferie AP in busta paga?');
const godute=sezione('### Che significa «ferie godute AP»?');
const scadenze=sezione('## Perché le ferie AP stanno in un contatore separato?');

test('Ferie: nessuna frase dà il 30 giugno 2027 a tutto il saldo AP 2025 (RIC-118)',()=>{
  assert.doesNotMatch(body,/finite nella colonna AP hanno come termine il \*\*30 giugno 2027\*\*/);
  assert.doesNotMatch(body,/quelle del 2024, se ce ne sono ancora, erano attese entro il 30 giugno 2026/);
  assert.doesNotMatch(ap,/Il motivo è una scadenza diversa/);
  assert.doesNotMatch(godute,/è quello che scade prima/);
  for(const frase of body.split(/(?<=[.:])\s/).filter(f=>f.includes('30 giugno 2027')))
    assert.match(frase,/restanti due/,frase);
});

test('Ferie: le prime due settimane sono distinte dalle restanti due (RIC-118)',()=>{
  assert.match(scadenze,/sul cedolino di ottobre 2026 il solo dato «AP 2025» non basta per assegnare una scadenza unica/);
  assert.match(scadenze,/Del minimo legale, almeno due settimane dovevano essere godute già nel 2025; le restanti due hanno come termine ordinario il \*\*30 giugno 2027\*\*/);
});

test('Ferie: quota eccedente e termini diversi dipendono dal CCNL (RIC-118)',()=>{
  assert.match(scadenze,/Eventuali giorni eccedenti il minimo e termini diversi dipendono dal CCNL applicato/);
});

test('Ferie: la colonna AP indica l\'anno di maturazione, non prova la scadenza (RIC-118)',()=>{
  assert.match(ap,/La separazione per anno aiuta il controllo, ma non codifica necessariamente ogni scadenza legale o contrattuale/);
  assert.match(scadenze,/Il contatore AP, se non separa queste quote, indica l'anno di maturazione ma non dimostra da solo la scadenza/);
});

test('Ferie: fonti ministeriali e data di aggiornamento (RIC-118)',()=>{
  const fonti=body.split('## Fonti')[1];
  assert.match(fonti,/D\.Lgs\. 8 aprile 2003, n\. 66, art\. 10 [^\n]*verificata il 13 ottobre 2026/);
  assert.match(fonti,/Ministero del Lavoro, «Ferie annuali»[^\n]*lavoro\.gov\.it\/sportello-unico-digitale\/termini-e-condizioni-di-impiego\/ferie-annuali[^\n]*verificata il 13 ottobre 2026/);
  assert.match(fonti,/Ministero del Lavoro, circolare n\. 8 del 3 marzo 2005, punti 16 e 17[^\n]*20050303_Circ_08\.pdf[^\n]*verificata il 13 ottobre 2026/);
  assert.equal(articolo.data_aggiornamento,'2026-10-13');
});
