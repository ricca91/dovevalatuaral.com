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
   sulla giornaliera non arrotondata e si arrotondano alla fine, come nell'articolo. */
const RAL=27300,RMG=2100/26;
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
  assert.match(alNetto,/\| Giorni di calendario \| Trattenuta lorda \| Rientra da datore e INAIL \| Di cui indennità INAIL \| Buco lordo \| Stima indicativa del netto perso \|/);
  assert.deepEqual(scenari.map(r=>Number(r[0])),[4,7,14,28,90,180]);
  const larghezze=[];
  for(const [g,trattenuta,rientra,inail,buco,intervallo] of scenari){
    const q=giorni(Number(g));
    assert.equal(cent(numero(trattenuta)),cent(RMG*q.trattenuta),`${g} giorni: trattenuta`);
    assert.equal(cent(numero(rientra)),cent(RMG*(q.datore+q.inail)),`${g} giorni: rientra`);
    assert.equal(cent(numero(inail)),cent(RMG*q.inail),`${g} giorni: indennità INAIL`);
    assert.equal(cent(numero(buco)),cent(RMG*(q.trattenuta-q.datore-q.inail)),`${g} giorni: buco`);
    const s=stima(numero(buco),numero(inail));
    assert.equal(intervallo,`${intero(s.da)}–${intero(s.a)} €`,`${g} giorni: intervallo`);
    assert.ok(s.basso/numero(buco)>=0.35&&s.alto/numero(buco)<=0.6,`${g} giorni: centesimi per euro`);
    larghezze.push((s.alto-s.basso)/numero(buco));
  }
  /* Senza indennità INAIL i due estremi coincidono; poi la forchetta si allarga con la durata. */
  assert.equal(larghezze[0],0);
  for(let i=1;i<larghezze.length;i++)assert.ok(larghezze[i]>larghezze[i-1],`${scenari[i][0]} giorni: forchetta`);
  assert.match(alNetto,/fra 35 e 60 centesimi netti/);
  assert.match(alNetto,/l'INAIL non è ancora entrata e i due estremi coincidono/);
  assert.equal(netto(RAL),21755.33);
  assert.ok(alNetto.includes('21.755,33 €'));
});

test("infortunio: intro, tabella, FAQ e perimetro usano lo stesso livello di certezza (RIC-116)",()=>{
  const quattordici=scenari.find(r=>r[0]==='14');
  const s=stima(numero(quattordici[4]),numero(quattordici[3]));
  const breve=paragrafo(body,/^> \*\*In breve\*\*/);
  assert.ok(breve.includes('258,46 € lordi'));
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
  assert.equal(articolo.data_aggiornamento,'2026-10-11');
});
