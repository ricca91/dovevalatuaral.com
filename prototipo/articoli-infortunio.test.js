const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {calcola}=require('./motore');
const {parse}=require('./articoli-parser');
const text=fs.readFileSync(path.join(__dirname,'articoli','esempio-busta-paga-infortunio.md'),'utf8');
const articolo=parse(text,'esempio-busta-paga-infortunio.md');
const {body}=articolo;
const corpo=body.split('## Fonti')[0];
const cent=n=>Math.round(n*100);
const numero=s=>s.trim()==='—'?0:Number(s.replace(/[ €+]/g,'').replaceAll('.','').replace(',','.'));
const intero=n=>n.toLocaleString('it-IT',{useGrouping:'always'});
const sezione=titolo=>{
  const start=body.indexOf(`## ${titolo}`);
  assert.ok(start>=0,titolo);
  const end=body.indexOf('\n## ',start+3);
  return body.slice(start,end<0?undefined:end);
};
const paragrafo=(testo,pattern)=>testo.split('\n\n').find(p=>pattern.test(p));

/* Operaio a 2.100 € al mese, divisore 26, infortunio di lunedì. Gli importi si calcolano
   sulla giornaliera non arrotondata e si arrotondano alla fine, come nell'articolo.
   QUOTA è la paga di una giornata: la usano la trattenuta e i giorni del datore.
   RMG è la base INAIL minima: paga più rateo di tredicesima, senza ferie e festività. */
const RAL=27300,QUOTA=2100/26,RMG=2100*13/12/26;
const eur=n=>(Math.round(n*100)/100).toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2,useGrouping:'always'});
const giorni=g=>({
  trattenuta:g-Math.floor(g/7),                       // le domeniche non si tolgono
  datore:1+0.6*Math.min(3,g-1),                       // DPR 1124/1965 art. 73
  inail:Array.from({length:Math.max(0,g-4)},(_,i)=>i+5<=90?0.6:0.75).reduce((a,q)=>a+q,0)  // art. 68
});
const netto=ral=>calcola(ral.toFixed(2)).kpi.nettoAnnuo;
/* Estremo basso: i contributi a tuo carico girano solo sulla parte di lordo non pagata
   dall'INAIL. Il motore prende una RAL sola, quindi si cerca la RAL con lo stesso
   imponibile fiscale: IRPEF, detrazioni e addizionali guardano solo quello, e il netto
   di quella RAL è il netto cercato. */
const nettoSenzaContributiInail=(lordo,inail)=>{
  const imponibile=cent(lordo)-cent(calcola((lordo-inail).toFixed(2)).kpi.totaleContributi);
  let basso=cent(lordo),alto=cent(lordo+inail);
  while(basso<alto){
    const m=Math.floor((basso+alto)/2);
    if(cent(calcola((m/100).toFixed(2)).imponibile)<imponibile)basso=m+1;else alto=m;
  }
  const r=calcola((basso/100).toFixed(2));
  assert.equal(cent(r.imponibile),imponibile);
  return r.kpi.nettoAnnuo;
};
const stima=(buco,inail)=>{
  const alto=netto(RAL)-netto(RAL-buco);
  const basso=netto(RAL)-nettoSenzaContributiInail(RAL-buco,inail);
  return {alto,basso,da:Math.floor(basso/10)*10,a:Math.ceil(alto/10)*10};
};
const alNetto=sezione('Quanto costa davvero un infortunio non integrato, al netto?');
const scenari=alNetto.split('\n').filter(l=>/^\| \d+ \| /.test(l)).map(l=>l.split('|').slice(1,-1).map(s=>s.trim()));

test('infortunio: nessun netto al centesimo presentato come risultato esatto (RIC-116)',()=>{
  for(const importo of ['153,72','57,58','67,23','326,48','1.133,26','1.410,51','21.697,75','21.688,10','21.601,61','21.428,85','20.622,07','20.344,82'])
    assert.ok(!corpo.includes(importo),importo);
  assert.doesNotMatch(corpo,/il totale dei dodici mesi è questo/);
  assert.doesNotMatch(corpo,/Netto perso sull'anno|Netto annuo calcolato/);
  assert.doesNotMatch(corpo,/59 centesimi|scendono a 53/);
});

test('infortunio: la tabella separa lordo al centesimo e stima netta in un intervallo (RIC-116)',()=>{
  assert.match(alNetto,/\| Giorni di calendario \| Trattenuta lorda \| Rientra da datore e INAIL, almeno \| Di cui indennità INAIL, almeno \| Buco lordo, al massimo \| Stima indicativa del netto perso, con la base minima \|/);
  assert.deepEqual(scenari.map(r=>Number(r[0])),[4,7,14,28,90,180]);
  const larghezze=[];
  for(const [g,trattenuta,rientra,inail,buco,intervallo] of scenari){
    const q=giorni(Number(g));
    assert.equal(cent(numero(trattenuta)),cent(QUOTA*q.trattenuta),`${g} giorni: trattenuta`);
    assert.equal(cent(numero(rientra)),cent(QUOTA*q.datore+RMG*q.inail),`${g} giorni: rientra`);
    assert.equal(cent(numero(inail)),cent(RMG*q.inail),`${g} giorni: indennità INAIL`);
    assert.equal(cent(numero(buco)),cent(QUOTA*(q.trattenuta-q.datore)-RMG*q.inail),`${g} giorni: buco`);
    const s=stima(numero(buco),numero(inail));
    assert.equal(intervallo,`${intero(s.da)}–${intero(s.a)} €`,`${g} giorni: intervallo`);
    assert.ok(s.basso/numero(buco)>=0.25&&s.alto/numero(buco)<=0.6,`${g} giorni: centesimi per euro`);
    larghezze.push((s.alto-s.basso)/numero(buco));
  }
  /* Senza indennità INAIL i due estremi coincidono; poi la forchetta si allarga con la durata. */
  assert.equal(larghezze[0],0);
  for(let i=1;i<larghezze.length;i++)assert.ok(larghezze[i]>larghezze[i-1],`${scenari[i][0]} giorni: forchetta`);
  assert.match(alNetto,/fra 25 e 60 centesimi netti/);
  assert.match(alNetto,/l'INAIL non è ancora entrata e i due estremi coincidono/);
  assert.equal(netto(RAL),21755.33);
  assert.ok(alNetto.includes('21.755,33 €'));
});

test("infortunio: intro, tabella, FAQ e perimetro usano lo stesso livello di certezza (RIC-116)",()=>{
  const quattordici=scenari.find(r=>r[0]==='14');
  const s=stima(numero(quattordici[4]),numero(quattordici[3]));
  const breve=paragrafo(body,/^> \*\*In breve\*\*/);
  assert.ok(breve.includes('218,08 € lordi'));
  assert.ok(breve.includes(`fra ${s.da} e ${s.a} €`),'stessa forchetta della tabella');
  assert.match(breve,/stima orientativa/);
  assert.match(breve,/trattamento contributivo/);
  assert.match(paragrafo(body,/^Le ipotesi/),/Gli importi netti sono stime orientative/);
  assert.match(articolo.ipotesi_calcolo,/netti stimati in un intervallo/);
  assert.match(sezione('Domande frequenti'),/i netti di questa pagina sono un intervallo orientativo, non un conto al centesimo/);
  assert.match(sezione('Quello che questa pagina non copre'),/\*\*Il trattamento contributivo dell'indennità\*\*, che il motore non modella: il netto perso è un intervallo/);
  assert.doesNotMatch(body,/Se vuoi il conto sulla tua cifra esatta/);
});

test("infortunio: fonte INAIL riaperta e data di aggiornamento (RIC-116)",()=>{
  const fonti=body.split('## Fonti')[1];
  assert.match(fonti,/- INAIL — [^\n]*indennità soggetta a IRPEF[^\n]*· verificata il 10 ottobre 2026, riaperta l'11 ottobre 2026/);
  assert.equal(articolo.data_aggiornamento,'2026-10-21');
});

/* Quattordici giorni con la base minima: tutti gli importi INAIL della pagina escono da RMG. */
const g14=giorni(14);
const indennita14=RMG*g14.inail,rientra14=QUOTA*g14.datore+indennita14,buco14=QUOTA*g14.trattenuta-rientra14;
const comeSiCalcola=sezione('Come si calcola la retribuzione media giornaliera?');

test('infortunio: la base INAIL comprende il rateo di tredicesima, non solo la paga (RIC-138)',()=>{
  assert.equal(eur(QUOTA),'80,77');assert.equal(eur(QUOTA/12),'6,73');assert.equal(eur(RMG),'87,50');
  assert.match(comeSiCalcola,/80,77 €/);
  const voci=Object.fromEntries(comeSiCalcola.split('\n').filter(l=>/^\| /.test(l)).map(l=>l.split('|').slice(1,-1).map(c=>c.trim())).map(([voce,...resto])=>[voce,resto]));
  assert.deepEqual(voci['Tredicesima mensilità'].slice(0,1),[`+${eur(QUOTA/12)} € al giorno`]);
  assert.deepEqual(voci['Ferie, festività e riposi compensativi'].slice(0,1),['non calcolate']);
  assert.deepEqual(voci['Premio di produzione'].slice(0,1),['0,00 €']);
  assert.deepEqual(voci['Altre mensilità aggiuntive'].slice(0,1),['0,00 €']);
  for(const voce of ['Tredicesima mensilità','Ferie, festività e riposi compensativi','Premio di produzione','Altre mensilità aggiuntive'])
    assert.ok(voci[voce][1].length>20,`${voce}: motivazione`);
  assert.deepEqual(voci['**Retribuzione media giornaliera**'].slice(0,1),[`**almeno ${eur(RMG)} €**`]);
  assert.match(comeSiCalcola,/\*\*87,50 € è un minimo, non la tua retribuzione media giornaliera\.\*\*/);
  assert.ok(comeSiCalcola.includes(`60% di ${eur(RMG)} € = **almeno ${eur(RMG*0.6)} € al giorno**`));
  assert.ok(comeSiCalcola.includes(`75% di ${eur(RMG)} € = **almeno ${eur(RMG*0.75)} € al giorno**`));
  assert.match(comeSiCalcola,/dieci giorni al 60% valgono sei volte la tua retribuzione media giornaliera/);
});

test('infortunio: nessun importo INAIL calcolato sulla sola paga mensile (RIC-138)',()=>{
  assert.doesNotMatch(corpo,/retribuzione media giornaliera è 80,77/);
  assert.doesNotMatch(corpo,/% di 80,77 €/);
  for(const vecchio of ['258,46','710,77','1.841,54','10 × 48,46','60,58','57,69 €. L','34,62','43,27','73%','4.167,69','9.619,62'])
    assert.ok(!corpo.includes(vecchio),vecchio);
  assert.doesNotMatch(articolo.description,/258,46/);
});

test('infortunio: con i dati che mancano, INAIL è un minimo e il buco un massimo (RIC-138)',()=>{
  const breve=paragrafo(body,/^> \*\*In breve\*\*/);
  for(const pezzo of [`almeno ${eur(RMG)} €`,`almeno ${eur(indennita14)} €`,`al massimo ${eur(buco14)} € lordi`])assert.ok(breve.includes(pezzo),pezzo);
  assert.match(breve,/ferie, festività e permessi/);
  const esempio=sezione("L'esempio: operaio a 2.100 € al mese, quattordici giorni di infortunio");
  assert.ok(esempio.includes(`| Indennità INAIL, 10 giorni di calendario al 60%, almeno 10 × ${eur(RMG*0.6)} € | almeno +${eur(indennita14)} € |`));
  assert.ok(esempio.includes(`| Totale lordo del mese, senza integrazione contrattuale | almeno ${eur(2100-buco14)} € |`));
  assert.ok(esempio.includes(`| Integrazione del datore, se il CCNL la prevede | da 0,00 € a +${eur(buco14)} € |`));
  assert.ok(esempio.includes(`almeno ${eur(rientra14)} € restituiti, al massimo ${eur(buco14)} € di differenza`));
  assert.ok(esempio.includes(`almeno il **${Math.floor(rientra14/(QUOTA*g14.trattenuta)*100)}%**`));
  assert.ok(articolo.description.includes(eur(buco14)));
  assert.match(articolo.ipotesi_calcolo,/rateo di tredicesima/);
  assert.match(articolo.ipotesi_calcolo,/ferie, festività e permessi/);
  assert.match(paragrafo(body,/^Le ipotesi/),/importi INAIL sono minimi/);
  assert.match(sezione('Quello che questa pagina non copre'),/\*\*Ferie, festività e riposi nella base INAIL\.\*\*[^\n]*87,50 € è un minimo/);
  assert.match(alNetto,/base minima di 87,50 €/);
  assert.match(alNetto,/Il lordo lo puoi verificare al centesimo quando conosci la tua base INAIL\./);
  const g90=scenari.find(r=>r[0]==='90'),g180=scenari.find(r=>r[0]==='180');
  assert.ok(alNetto.includes(`solo il ${Math.round((numero(g180[4])/numero(g90[4])-1)*100)}% più grande`));
});

test('infortunio: la FAQ sui 1.500 € usa la stessa base (RIC-138)',()=>{
  const base=1500*13/12/26;
  const faq=paragrafo(sezione('Domande frequenti'),/^Con paga fissa di 1\.500,00 €/);
  for(const importo of [eur(base),eur(1500/26),eur(1500/26/12),eur(base*0.6),eur(base*0.75)])assert.ok(faq.includes(`${importo} €`),importo);
  assert.match(faq,/13 mensilità/);assert.match(faq,/almeno/);
});

test('infortunio: fonti INAIL della base di calcolo, riaperte il 21 ottobre 2026 (RIC-138)',()=>{
  const fonti=body.split('## Fonti')[1];
  assert.match(fonti,/- INAIL — manuale utente del servizio «Dati retributivi[^\n]*tredicesima mensilità[^\n]*ferie comprensive di festività e riposi compensativi[^\n]*premio di produzione[^\n]*altre mensilità aggiuntive[^\n]*\(\[INAIL, PDF\]\(https:\/\/www\.inail\.it\/content\/dam\/inail-hub-site\/documenti\/modulistica-assicurazione\/2025\/02\/20250206-Manuale%20Dati%20retributivi%20lavoratore%20a%20tempo%20pieno_V2\.1\.pdf\)\) · verificata il 21 ottobre 2026/);
  assert.match(fonti,/- INAIL — istruzioni[^\n]*un dodicesimo[^\n]*\(\[INAIL, PDF\]\(https:\/\/www\.inail\.it\/content\/dam\/inail-hub-site\/documenti\/2016\/10\/Istruzioni%20per%20la%20compilazione%20Mod%2001%20Ret_Nav\.pdf\)\) · verificata il 21 ottobre 2026/);
});
