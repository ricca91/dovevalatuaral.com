/* Guardia editoriale: le pagine che raccontano il prodotto devono descrivere
   il perimetro che il prodotto copre davvero, non quello del primo prototipo.
   Non prova i calcoli — prova che il testo non contraddica il motore. */
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {test}=require('node:test');
const {join}=require('node:path');

const AGGIORNATO_AL='22 settembre 2026';   // data degli stati verificati su Linear

const leggi=nome=>readFileSync(join(__dirname,nome),'utf8');
function sezione(html,id,file){
  const inizio=html.indexOf(`<section id="${id}"`);
  assert.notEqual(inizio,-1,`${file}: manca la sezione #${id}`);
  const fine=html.indexOf('</section>',inizio);
  assert.notEqual(fine,-1,`${file}: sezione #${id} non chiusa`);
  const corpo=html.slice(inizio,fine);
  /* Lo slice si ferma alla prima chiusura: se un giorno queste sezioni si
     annidassero, il corpo sarebbe troncato e i doesNotMatch passerebbero a vuoto.
     Si guarda oltre il tag di apertura, che ovviamente e' un <section. */
  assert.doesNotMatch(corpo.slice(corpo.indexOf('>')+1),/<section\b/,
    `${file}: #${id} annidata, la guardia non reggerebbe`);
  return corpo;
}

/* Le tre capacità già in produzione: selettore geografico nazionale (RIC-35),
   nucleo familiare (RIC-40) e pacchetto retributivo (RIC-43). */
const PERIMETRO=[
  ['come-ho-lavorato.html','perimetro'],
  ['la-storia.html','limiti'],
];

for(const [file,id] of PERIMETRO){
  test(`${file} · il perimetro corrente non è limitato a Milano`,()=>{
    const testo=sezione(leggi(file),id,file);
    assert.doesNotMatch(testo,/Nessun familiare a carico|nessun benefit/i,
      `${file}: familiari e benefit non sono più esclusi`);
    /* Milano può restare, ma solo dichiarata come esempio: è la riga
       che distingue «il caso di riferimento» da «il limite del prodotto». */
    if(/Milano/.test(testo))
      assert.match(testo,/non il limite geografico/i,
        `${file}: se cita Milano deve dire che non è il limite geografico`);
    assert.match(testo,/comuni italiani attivi/i,`${file}: manca la scelta del comune`);
    assert.match(testo,/familiari a carico/i,`${file}: mancano i familiari a carico`);
    assert.match(testo,/pacchetto retributivo|welfare/i,`${file}: manca il pacchetto retributivo`);
  });

  test(`${file} · il perimetro distingue ciò che manca da ciò che è escluso`,()=>{
    assert.match(sezione(leggi(file),id,file),/non ancora copert|in backlog|restano apert/i,
      `${file}: gli sviluppi futuri non sono distinti dalle esclusioni di principio`);
  });

  test(`${file} · il perimetro rimanda ai limiti del calcolatore`,()=>{
    assert.match(sezione(leggi(file),id,file),/href="index\.html\?[^"]*calc=1/,
      `${file}: manca il rimando al calcolatore`);
  });
}

test('la-storia.html · la fotografia della backlog porta la data degli stati',()=>{
  assert.match(sezione(leggi('la-storia.html'),'commenti','la-storia.html'),
    new RegExp(AGGIORNATO_AL.replace(/ /g,'\\s')),
    `la tabella deve dichiarare la data degli stati (${AGGIORNATO_AL})`);
});

/* Stati verificati su Linear il 22 settembre 2026: RIC-34, RIC-35, RIC-40 e
   RIC-43 chiusi; RIC-60 in corso; RIC-42 e RIC-45 ancora in backlog.
   Sette filoni, sette righe: nessuna cella resta fuori dalla guardia. */
const STATI=[
  ['Mensilità oltre la tredicesima','fatto','fatto'],
  ['Regione e comune scelti da chi calcola','fatto','fatto'],
  ['Scelta del CCNL','corso','in corso'],
  ['Nucleo familiare e figli a carico','fatto','fatto'],
  ['Premi di risultato e MBO','apre','aperto'],
  ['Welfare e fringe benefit','fatto','fatto'],
  ["Costo totale per l'azienda",'apre','aperto'],
];
test('la-storia.html · ogni filone riporta lo stato verificato',()=>{
  const commenti=sezione(leggi('la-storia.html'),'commenti','la-storia.html');
  const righeTabella=[...commenti.matchAll(/<tr><td>([^<]+)<\/td><td class="n">\d+<\/td><td class="s (\w+)">([^<]+)<\/td><\/tr>/g)];
  assert.equal(righeTabella.length,STATI.length,'la tabella deve avere una riga per filone');
  righeTabella.forEach(([,filone,classe,etichetta],i)=>{
    const [atteso,classeAttesa,etichettaAttesa]=STATI[i];
    assert.equal(filone,atteso,`filone ${i+1} inatteso`);
    assert.equal(classe,classeAttesa,`«${filone}» ha la classe sbagliata`);
    assert.equal(etichetta,etichettaAttesa,`«${filone}» ha l'etichetta sbagliata`);
  });
});

/* Le pagine RAL sono output generato: la guardia sta sul template che le
   produce, non sui 17 artefatti. */
test('il template delle pagine RAL conserva Milano, che è il profilo simulato',()=>{
  for(const file of ['ral-page.template.js','confronti-ral/index.html'])
    assert.match(leggi(file),/Milano/,`${file}: Milano è il profilo simulato, non va rimossa`);
});
