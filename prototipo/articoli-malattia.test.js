const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {calcola}=require('./motore');
const {parse}=require('./articoli-parser.js');
const text=fs.readFileSync(path.join(__dirname,'articoli','esempio-busta-paga-malattia.md'),'utf8');
const {ipotesi_calcolo:ipotesi,body}=parse(text);
const CIRCOLARE_84='Circolare+numero+84+del+22-4-1980';
const cents=s=>Math.round(Number(s.replace(/[€\s+*.]/g,'').replace('−','-').replace(',','.'))*100);
const eur=c=>`${(c/100).toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2,useGrouping:'always'})} €`;
const sezione=titolo=>{
  const start=body.indexOf(`## ${titolo}`);
  assert.ok(start>=0,titolo);
  const end=body.indexOf('\n## ',start+3);
  return body.slice(start,end<0?undefined:end);
};
const paragrafo=(testo,pattern)=>testo.split('\n\n').find(p=>pattern.test(p));

/* INPS circ. 84/1980 punto 9.1: il divisore fisso 26 vale per gli operai retribuiti in misura
   fissa mensile, sulla retribuzione complessiva del mese precedente la malattia e interamente
   lavorato. Non è "il divisore del tuo contratto", che serve alla trattenuta (RIC-84). */
const MESE_PRECEDENTE=208000,DIVISORE=26;
const rmg=Math.round(MESE_PRECEDENTE/DIVISORE);
const giornaliera=quota=>Math.round(rmg*quota);
/* Indennità INPS su g giornate: carenza 1-3, 50% fino al 20°, 66,66% dal 21° (circ. 178/1985). */
const indennita=(g,base=rmg)=>{
  let totale=0;
  for(let d=4;d<=g;d++)totale+=Math.round(base*(d<=20?0.5:0.6666));
  return totale;
};

test("l'esempio dichiara qualifica, paga fissa mensile e mese precedente lavorato per intero",()=>{
  for(const [dove,testo] of [['ipotesi_calcolo',ipotesi],['ipotesi',paragrafo(body,/^Le ipotesi/)],['perimetro',sezione('Quello che questa pagina non copre')]]){
    assert.match(testo,/operaio/,dove);
    assert.match(testo,/paga fissa mensile/,dove);
    assert.match(testo,/mese precedente[^.;]*(interamente lavorato|lavorato per intero)/,dove);
  }
  assert.doesNotMatch(body,/vale per un dipendente privato/);
});

test('la RMG INPS non è "lordo del mese / divisore del contratto" e la circolare sta accanto alla formula',()=>{
  assert.doesNotMatch(body,/retribuzione media giornaliera[^.]*divisore del (tuo )?(contratto|CCNL)/);
  assert.doesNotMatch(body,/si ottiene dividendo la retribuzione lorda del mese/);
  const sez=sezione('Come si calcola la retribuzione media giornaliera?');
  const formula=paragrafo(sez,/26/);
  assert.ok(formula.includes(CIRCOLARE_84),'link alla circolare 84/1980 nel paragrafo della formula');
  assert.match(formula,/operai/);
  assert.match(formula,/mese precedente/);
  assert.ok(formula.includes(`${eur(rmg)} al giorno`));
  assert.match(sez,/solo per gli operai/);
});

test("la trattenuta del datore è distinta dalla base dell'indennità INPS",()=>{
  const sez=sezione('Come si calcola la retribuzione media giornaliera?');
  const trattenuta=paragrafo(sez,/trattenuta/);
  assert.ok(trattenuta,'paragrafo sulla trattenuta');
  assert.match(trattenuta,/divisore del (tuo )?(contratto|CCNL)/);
  assert.match(trattenuta,/INPS/);
  assert.match(trattenuta,/mese precedente/);
});

test('280 € e la tabella degli scenari escono dalla casistica INPS dichiarata e dal motore',()=>{
  assert.equal(rmg,8000);
  assert.equal(indennita(10),28000);
  const riga=label=>{
    const found=body.split('\n').filter(l=>l.startsWith(`| ${label}`));
    assert.equal(found.length,1,label);
    return found[0].split('|').slice(1,-1).map(s=>s.trim());
  };
  const [labelIndennita,importo]=riga('Indennità INPS');
  assert.ok(labelIndennita.includes(`7 × ${eur(giornaliera(0.5))}`));
  assert.equal(cents(importo),indennita(10));
  const ral=MESE_PRECEDENTE*13/100;
  const netto=r=>calcola(r).kpi.nettoAnnuo;
  const scenari=body.split('\n').filter(l=>/^\| \d+ \| /.test(l)).map(l=>l.split('|').slice(1,-1).map(s=>s.trim()));
  assert.equal(scenari.length,4);
  for(const [g,trattenuta,inps,buco,annuo,perso] of scenari){
    const giorni=Number(g);
    assert.equal(cents(trattenuta),giorni*rmg,`${g} giornate: trattenuta`);
    assert.equal(cents(inps),indennita(giorni),`${g} giornate: indennità`);
    assert.equal(cents(buco),giorni*rmg-indennita(giorni),`${g} giornate: buco`);
    assert.equal(cents(annuo),Math.round(netto(ral-cents(buco)/100)*100),`${g} giornate: netto`);
    assert.equal(cents(perso),Math.round((netto(ral)-netto(ral-cents(buco)/100))*100),`${g} giornate: perso`);
  }
  /* Domanda frequente su 1.500 € nel mese precedente: stessa casistica, stessa formula. */
  const base1500=Math.round(150000/DIVISORE);
  const faq=sezione('Domande frequenti');
  for(const importo of [base1500,Math.round(base1500*0.5),Math.round(base1500*0.6666),7*Math.round(base1500*0.5),10*base1500])
    assert.ok(faq.includes(eur(importo)),eur(importo));
});

test('le fonti INPS sulla base di calcolo sono in elenco',()=>{
  const fonti=sezione('Fonti');
  assert.ok(fonti.includes(CIRCOLARE_84));
  assert.ok(fonti.includes('Circolare+numero+213+del+31-7-1995'));
});
