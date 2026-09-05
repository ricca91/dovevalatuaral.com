/* ============================================================
   COMPARA — le prove dei contratti del confronto.

   Non riprovano il fisco: quello ha già motore.test.js. Provano le
   quattro cose che il confronto può sbagliare da solo — sottrarre
   male, monetizzare quello che non è denaro, condividere per
   riferimento due offerte che devono restare distinte, e fidarsi
   di un URL scritto da qualcun altro.
   ============================================================ */
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {test}=require('node:test');
const {resolve}=require('node:path');

const COMPARA=require('./compara.js');
const {calcola,applicaMensilita}=require('./motore.js');
const NUCLEO=require('./nucleo.js');

const leggi=nome=>readFileSync(resolve(__dirname,nome),'utf8');
const offerta=extra=>({...COMPARA.offertaVuota(),ralRaw:'35.000',...extra});
const riga=(esito,chiave)=>esito.righe.find(r=>r.chiave===chiave);
const confrontaOk=(a,b)=>{
  const esito=COMPARA.confronta(a,b);
  assert.equal(esito.ok,true,JSON.stringify(esito.errori));
  return esito.esito;
};

/* ============================================================
   IL CONFRONTO — due volte lo stesso motore, e delle sottrazioni
   ============================================================ */
test('due offerte identiche non producono nessuna differenza in denaro',()=>{
  const esito=confrontaOk(offerta(),offerta());
  for(const r of esito.righe.filter(r=>r.unita==='euro'&&!r.senzaDelta))
    assert.equal(r.delta,0,`${r.chiave} dovrebbe essere invariata`);
  assert.match(esito.riepilogo.netto.testo,/uguale/);
  /* Il tempo non dichiarato resta non dichiarato: non diventa zero. */
  assert.equal(riga(esito,'oreViaggio').a,null);
  assert.equal(riga(esito,'oreViaggio').b,null);
  assert.equal(riga(esito,'oreViaggio').delta,null);
  assert.equal(esito.riepilogo.viaggio.disponibile,false);
});

test('13 o 14 mensilità cambiano solo la presentazione',()=>{
  const esito=confrontaOk(offerta(),offerta({mensilitaRaw:'14'}));
  assert.equal(riga(esito,'netto').delta,0);
  assert.equal(riga(esito,'netto12').delta,0);
  assert.equal(riga(esito,'netto12').a,riga(esito,'netto12').b);
  /* Su mensilità diverse la differenza fra le medie non è un aumento:
     la riga porta i due divisori e nessun delta. */
  const media=riga(esito,'media');
  assert.equal(media.senzaDelta,true);
  assert.equal(media.delta,null);
  assert.deepEqual(media.divisore,{a:13,b:14});
  assert.notEqual(media.a,media.b);
});

test('ogni scenario coincide con il risultato ottenuto direttamente dal motore',()=>{
  const nucleo=[{tipo:'figlio',eta:22,disabilita:false,reddito:0},
    {tipo:'coniuge',eta:null,disabilita:false,reddito:1200}];
  const A=offerta({comune:'H501',nucleo,welfareRaw:'600',mensilitaRaw:'14'});
  const B=offerta({ralRaw:'48.000',comune:'L219',fringeRaw:'1.500',
    buoniValoreRaw:'8',buoniNumeroRaw:'220'});
  const esito=confrontaOk(A,B);
  const atteso=(ral,opzioni,mensilita)=>applicaMensilita(calcola(ral,opzioni),mensilita);
  assert.deepEqual(esito.risultati.A,atteso('35000',{comune:'H501',nucleo,
    welfare:'600',fringe:'0',buoniPasto:{tipo:'elettronici',valoreUnitario:'0',numero:0}},14));
  assert.deepEqual(esito.risultati.B,atteso('48000',{comune:'L219',nucleo:[],
    welfare:'0',fringe:'1500',buoniPasto:{tipo:'elettronici',valoreUnitario:'8',numero:220}},13));
  /* Le righe del confronto non sono un secondo calcolo: sono i KPI. */
  assert.equal(riga(esito,'netto').a,Math.round(esito.risultati.A.kpi.nettoInBusta*100));
  assert.equal(riga(esito,'benefit').b,Math.round(esito.risultati.B.kpi.benefitSpendibili*100));
  assert.equal(riga(esito,'pacchetto').b,Math.round(esito.risultati.B.kpi.valorePacchetto*100));
});

test('1.200 € di costi solo su B tolgono 1.200 € l’anno e 100 € al mese, e non toccano il fisco',()=>{
  const senza=confrontaOk(offerta(),offerta());
  const con=confrontaOk(offerta(),offerta({trasportoRaw:'1.200'}));
  assert.equal(riga(con,'netto').delta,riga(senza,'netto').delta);   // il netto fiscale non si muove
  assert.equal(riga(con,'costi').delta,120000);
  assert.equal(riga(con,'dopoCosti').delta,riga(senza,'dopoCosti').delta-120000);
  assert.equal(riga(con,'dopoCosti12').delta,-10000);
  assert.match(con.riepilogo.costi.testo,/1\.200,00 €.*100,00 € al mese/);
});

test('i costi sono la somma delle due voci dichiarate, e possono superare il netto',()=>{
  const esito=confrontaOk(offerta({ralRaw:'20.000'}),
    offerta({ralRaw:'20.000',trasportoRaw:'12.000',altreSpeseRaw:'9.000,50'}));
  assert.equal(riga(esito,'costi').b,2100050);
  assert.equal(riga(esito,'dopoCosti').b,riga(esito,'netto').b-2100050);
  assert.ok(riga(esito,'dopoCosti').b<0,'il denaro dopo i costi può essere negativo');
});

test('la media su 12 nasce dal delta annuo, non da due medie già arrotondate',()=>{
  /* 35.000,05 contro 35.000: un delta annuo che diviso per 12 non è intero. */
  const esito=confrontaOk(offerta(),offerta({ralRaw:'35.111,11'}));
  const deltaAnnuo=riga(esito,'netto').delta;
  assert.equal(riga(esito,'netto12').delta,Math.round(deltaAnnuo/12));
  assert.notEqual(riga(esito,'netto12').b-riga(esito,'netto12').a,undefined);
});

/* ============================================================
   IL TEMPO — dichiarato, mancante, o zero: tre cose diverse
   ============================================================ */
test('100 giorni per 60 minuti fanno 100 ore annue di viaggio',()=>{
  const esito=confrontaOk(
    offerta({giorniPresenzaRaw:'100',minutiViaggioRaw:'60'}),
    offerta({giorniPresenzaRaw:'220',minutiViaggioRaw:'90'}));
  assert.equal(riga(esito,'oreViaggio').a,100);
  assert.equal(riga(esito,'oreViaggio').b,330);
  assert.equal(riga(esito,'oreViaggio').delta,230);
  assert.equal(esito.riepilogo.viaggio.disponibile,true);
});

test('zero ore dichiarate e ore non dichiarate non sono la stessa cosa',()=>{
  const zero=confrontaOk(offerta({giorniPresenzaRaw:'0',minutiViaggioRaw:'0'}),offerta({
    giorniPresenzaRaw:'0',minutiViaggioRaw:'0'}));
  assert.equal(riga(zero,'oreViaggio').a,0);
  const mezzo=confrontaOk(offerta({giorniPresenzaRaw:'220'}),offerta());
  assert.equal(riga(mezzo,'oreViaggio').a,null,'senza i minuti il prodotto non esiste');
  assert.equal(riga(mezzo,'oreViaggio').delta,null);
  assert.equal(COMPARA.oreViaggioAnnue({giorniPresenza:0,minutiViaggio:0}),0);
  assert.equal(COMPARA.oreViaggioAnnue({giorniPresenza:0,minutiViaggio:null}),null);
});

test('le ore settimanali compaiono solo se qualcuno le ha dichiarate',()=>{
  assert.equal(riga(confrontaOk(offerta(),offerta()),'oreSettimanali'),undefined);
  const esito=confrontaOk(offerta({oreSettimanaliRaw:'40'}),offerta({oreSettimanaliRaw:'37,5'}));
  assert.equal(riga(esito,'oreSettimanali').a,40);
  assert.equal(riga(esito,'oreSettimanali').b,37.5);
  assert.equal(riga(esito,'oreSettimanali').delta,-2.5);
  const solaA=confrontaOk(offerta({oreSettimanaliRaw:'40'}),offerta());
  assert.equal(riga(solaA,'oreSettimanali').b,null);
  assert.equal(riga(solaA,'oreSettimanali').delta,null,'una sola dichiarata non è una differenza');
});

/* ============================================================
   I BENEFIT — spendibili, ma non denaro
   ============================================================ */
test('i benefit spendibili non entrano nel denaro dopo i costi',()=>{
  const conBenefit=offerta({welfareRaw:'1.000',buoniValoreRaw:'8',buoniNumeroRaw:'220'});
  const esito=confrontaOk(offerta(),conBenefit);
  assert.ok(riga(esito,'benefit').b>0);
  assert.equal(riga(esito,'dopoCosti').b,riga(esito,'netto').b);
  assert.equal(riga(esito,'pacchetto').b,riga(esito,'netto').b+riga(esito,'benefit').b);
});

test('anche con una quota imponibile il benefit resta fuori dal denaro dopo i costi',()=>{
  /* Buoni elettronici da 10 €: 2 € per titolo sono imponibili, quindi il
     netto in busta scende. Il valore spendibile resta comunque separato. */
  const imponibili=offerta({buoniValoreRaw:'10',buoniNumeroRaw:'220',fringeRaw:'3.000'});
  const esito=confrontaOk(offerta(),imponibili);
  const voci=esito.risultati.B.voci.filter(v=>v.somma==='benefitSpendibili');
  assert.ok(voci.some(v=>v.quotaImponibile>0),'lo scenario deve avere una quota imponibile');
  assert.ok(riga(esito,'netto').delta<0,'la quota imponibile abbassa il netto');
  assert.equal(riga(esito,'dopoCosti').b,riga(esito,'netto').b);
  assert.equal(riga(esito,'costi').b,0);
});

/* ============================================================
   COPIA A IN B — due offerte, mai gli stessi oggetti
   ============================================================ */
test('«Copia A in B» non condivide gli oggetti del nucleo né dei benefit',()=>{
  const A=offerta({nucleo:[{tipo:'figlio',eta:22,disabilita:false,reddito:0}],
    welfareRaw:'500',trasportoRaw:'900'});
  const B=COMPARA.copiaOfferta(A);
  assert.deepEqual(B,A);
  assert.notEqual(B.nucleo,A.nucleo);
  assert.notEqual(B.nucleo[0],A.nucleo[0]);
  B.nucleo[0].eta=30;B.nucleo.push({tipo:'coniuge',eta:null,disabilita:false,reddito:0});
  B.welfareRaw='9.000';
  assert.equal(A.nucleo.length,1);
  assert.equal(A.nucleo[0].eta,22);
  assert.equal(A.welfareRaw,'500');
  /* E il confronto che ne esce distingue davvero le due offerte. */
  assert.notEqual(riga(confrontaOk(A,B),'netto').delta,0);
});

/* ============================================================
   VALIDAZIONE — stesso parser della home, nessun easter egg
   ============================================================ */
test('la RAL segue il parser e i limiti della home',()=>{
  const errore=(grezza,campo)=>{
    const esito=COMPARA.normalizzaOfferta(grezza);
    assert.equal(esito.ok,false,`${JSON.stringify(grezza)} doveva fallire`);
    assert.ok(esito.errori.some(e=>e.campo===campo),
      `atteso un errore su ${campo}, trovato ${JSON.stringify(esito.errori)}`);
    return esito.errori;
  };
  errore({...COMPARA.offertaVuota(),ralRaw:''},'ral');
  errore(offerta({ralRaw:'trentacinquemila'}),'ral');
  errore(offerta({ralRaw:'-1'}),'ral');
  errore(offerta({ralRaw:'Infinity'}),'ral');
  errore(offerta({ralRaw:'1e999'}),'ral');
  errore(offerta({ralRaw:'1.000.001'}),'ral');
  assert.equal(COMPARA.normalizzaOfferta(offerta({ralRaw:'1.000.000'})).ok,true);
  /* L'easter egg della home non esiste sul comparatore: 47.000,00 è una RAL. */
  const egg=COMPARA.normalizzaOfferta(offerta({ralRaw:'4.700.000'}));
  assert.equal(egg.ok,false);
  assert.equal(COMPARA.normalizzaOfferta(offerta({ralRaw:'47.000'})).ok,true);
});

test('gli importi facoltativi vuoti valgono zero, quelli assurdi sono errori',()=>{
  const buona=COMPARA.normalizzaOfferta(offerta());
  assert.equal(buona.valore.welfare,'0');
  assert.equal(buona.valore.costi.centesimi,0);
  for(const[campo,grezza]of[
    ['welfare',{welfareRaw:'-10'}],
    ['fringe',{fringeRaw:'abc'}],
    ['trasporto',{trasportoRaw:'-0,01'}],
    ['altreSpese',{altreSpeseRaw:'NaN'}],
    ['buoniNumero',{buoniNumeroRaw:'12,5'}],
    ['buoniNumero',{buoniNumeroRaw:'-3'}],
    ['giorniPresenza',{giorniPresenzaRaw:'367'}],
    ['giorniPresenza',{giorniPresenzaRaw:'10,5'}],
    ['minutiViaggio',{minutiViaggioRaw:'1.441'}],
    ['oreSettimanali',{oreSettimanaliRaw:'169'}],
  ]){
    const esito=COMPARA.normalizzaOfferta(offerta(grezza));
    assert.equal(esito.ok,false,`${campo}: ${JSON.stringify(grezza)} doveva fallire`);
    assert.ok(esito.errori.some(e=>e.campo===campo),
      `${campo}: trovato ${JSON.stringify(esito.errori)}`);
  }
  assert.equal(COMPARA.normalizzaOfferta(offerta({giorniPresenzaRaw:'366',
    minutiViaggioRaw:'1.440',oreSettimanaliRaw:'168'})).ok,true);
});

test('gli enum sconosciuti sono errori, non default silenziosi',()=>{
  for(const[campo,grezza]of[
    ['mensilita',{mensilitaRaw:'17'}],
    ['mensilita',{mensilitaRaw:'tredici'}],
    ['buoniTipo',{buoniTipo:'aurei'}],
    ['ccnl',{ccnl:'contratto-inventato'}],
    ['comune',{comune:'ZZZZ'}],
    ['nucleo',{nucleo:'f22'}],
    ['nucleo',{nucleo:[{tipo:'cugino'}]}],
    ['nucleo',{nucleo:[{tipo:'coniuge'},{tipo:'coniuge'}]}],
    ['nucleo',{nucleo:[{tipo:'figlio',eta:'ventidue'}]}],
    ['nucleo',{nucleo:[{tipo:'figlio',eta:22,reddito:-5}]}],
  ]){
    const esito=COMPARA.normalizzaOfferta(offerta(grezza));
    assert.equal(esito.ok,false,`${campo}: ${JSON.stringify(grezza)} doveva fallire`);
    assert.ok(esito.errori.some(e=>e.campo===campo),
      `${campo}: trovato ${JSON.stringify(esito.errori)}`);
  }
});

test('ogni errore dice in quale pannello sta il campo da correggere',()=>{
  const esito=COMPARA.confronta(offerta({welfareRaw:'-1'}),offerta({minutiViaggioRaw:'-1'}));
  assert.equal(esito.ok,false);
  assert.equal(esito.esito,null);
  const welfare=esito.errori.find(e=>e.campo==='welfare');
  const minuti=esito.errori.find(e=>e.campo==='minutiViaggio');
  assert.deepEqual([welfare.offerta,welfare.sezione],['A','benefit']);
  assert.deepEqual([minuti.offerta,minuti.sezione],['B','costi']);
  assert.equal(COMPARA.SEZIONE_DEL_CAMPO.ral,'principale');
});

test('un input ostile non fa esplodere il confronto',()=>{
  const ostili=[undefined,null,{},{ralRaw:{}},{ralRaw:[]},
    {ralRaw:'35000',nucleo:[null]},
    {ralRaw:'35000',nucleo:[{tipo:'figlio',eta:Infinity}]},
    {ralRaw:'35000',mensilitaRaw:Infinity},
    {ralRaw:'35000',comune:'<script>alert(1)</script>'},
    {ralRaw:'9'.repeat(400)}];
  for(const ostile of ostili){
    const esito=COMPARA.confronta(ostile,offerta());
    assert.equal(esito.ok,false,`${JSON.stringify(ostile)} non doveva passare`);
    assert.ok(esito.errori.length>0);
  }
});

/* ============================================================
   LO STATO NELL'URL — fragment, versionato, non fidato
   ============================================================ */
test('il fragment conserva tutti gli input e riproduce gli stessi risultati',()=>{
  const stato={
    A:offerta({comune:'H501',mensilitaRaw:'14',ccnl:'metalmeccanica-industria-c011',
      nucleo:[{tipo:'figlio',eta:22,disabilita:true,reddito:1500}],
      welfareRaw:'600',fringeRaw:'900',buoniTipo:'cartacei',
      buoniValoreRaw:'4',buoniNumeroRaw:'200',
      trasportoRaw:'1.200',altreSpeseRaw:'300,50',
      oreSettimanaliRaw:'40',giorniPresenzaRaw:'220',minutiViaggioRaw:'90'}),
    B:offerta({ralRaw:'48.000',comune:'L219'}),
  };
  const fragment=COMPARA.codificaStato(stato);
  assert.match(fragment,/^v=1&/);
  const letto=COMPARA.decodificaStato(fragment);
  assert.equal(letto.ok,true);
  assert.deepEqual(letto.stato,stato);
  /* Il fragment porta gli input, non i risultati: al ritorno si ricalcola. */
  assert.doesNotMatch(fragment,/netto|kpi|risultat/i);
  assert.deepEqual(confrontaOk(letto.stato.A,letto.stato.B),confrontaOk(stato.A,stato.B));
});

test('il fragment sopravvive al cancelletto e ignora quello che non conosce',()=>{
  const stato={A:offerta(),B:offerta({ralRaw:'40.000'})};
  const fragment=COMPARA.codificaStato(stato);
  assert.deepEqual(COMPARA.decodificaStato('#'+fragment).stato,stato);
  assert.deepEqual(COMPARA.decodificaStato(fragment+'&futuro=1').stato,stato);
});

test('un link corrotto o di un’altra versione è recuperabile, non un crash',()=>{
  const casi=[['',           'vuoto'],
    ['ral=35000',            'illeggibile'],   // manca la versione
    ['v=2&a.ral=35000',      'versione'],
    ['v=1&a.c=ZZZZ',         'illeggibile'],   // comune inesistente
    ['v=1&a.m=17',           'illeggibile'],   // mensilità fuori elenco
    ['v=1&a.bt=aurei',       'illeggibile'],
    ['v=1&a.ccnl=inventato', 'illeggibile'],
    ['v=1&a.n=f22.pippo',    'illeggibile'],   // token che il codec scarterebbe
    ['v=1&a.ral='+'9'.repeat(300),'illeggibile']];
  for(const[grezzo,motivo]of casi){
    const letto=COMPARA.decodificaStato(grezzo);
    assert.equal(letto.ok,false,`${grezzo} non doveva essere letto`);
    assert.equal(letto.motivo,motivo,grezzo);
    assert.equal(letto.stato,null,'nessun valore sostituito con uno zero');
    assert.ok(COMPARA.MOTIVI[letto.motivo],'ogni motivo ha una frase per la pagina');
  }
});

test('le stringhe malevole restano dati, non codice',()=>{
  const veleno='"><script>x</script>';   // sotto il limite di lunghezza del campo
  const letto=COMPARA.decodificaStato(COMPARA.codificaStato({
    A:{...COMPARA.offertaVuota(),ralRaw:veleno},B:COMPARA.offertaVuota()}));
  assert.equal(letto.ok,true);
  assert.equal(letto.stato.A.ralRaw,veleno,'il testo resta identico, non interpretato');
  const esito=COMPARA.confronta(letto.stato.A,letto.stato.B);
  assert.equal(esito.ok,false);
  assert.ok(esito.errori.some(e=>e.campo==='ral'));
});

test('il nucleo usa lo stesso codec della home',()=>{
  const nucleo=[{tipo:'figlio',eta:22,disabilita:true,reddito:1500},
    {tipo:'ascendente',eta:null,disabilita:false,reddito:0}];
  const fragment=COMPARA.codificaStato({A:offerta({nucleo}),B:COMPARA.offertaVuota()});
  assert.match(fragment,/a\.n=f22dr1500\.a/);
  assert.deepEqual(NUCLEO.deserializzaNucleo('f22dr1500.a'),nucleo);
});

/* ============================================================
   IL PASSAGGIO DALLA HOME — lo scenario arriva intero
   ============================================================ */
test('lo stato della home diventa l’offerta A senza perdere niente',()=>{
  const home={ralRaw:'42.000',mensilita:14,comune:'H501',ccnl:'terziario-confcommercio-h011',
    nucleo:[{tipo:'figlio',eta:22,disabilita:false,reddito:0}],
    welfareRaw:'600',fringeRaw:'900',buoniTipo:'cartacei',
    buoniValoreRaw:'4',buoniNumeroRaw:'200'};
  const A=COMPARA.offertaDaCalcolatore(home);
  assert.equal(A.ralRaw,'42.000');
  assert.equal(A.mensilitaRaw,'14');
  assert.equal(A.comune,'H501');
  assert.equal(A.ccnl,'terziario-confcommercio-h011');
  assert.deepEqual(A.nucleo,home.nucleo);
  assert.notEqual(A.nucleo,home.nucleo,'la home non deve condividere la lista');
  assert.equal(A.buoniTipo,'cartacei');
  /* Costi e tempo restano da compilare: la home non li conosce. */
  assert.equal(A.trasportoRaw,'');
  assert.equal(A.giorniPresenzaRaw,'');
  /* E l'offerta ricostruisce lo stesso identico calcolo della home. */
  const dalConfronto=confrontaOk(A,A).risultati.A;
  assert.deepEqual(dalConfronto,applicaMensilita(calcola('42000',{comune:'H501',
    nucleo:home.nucleo,welfare:'600',fringe:'900',
    buoniPasto:{tipo:'cartacei',valoreUnitario:'4',numero:200}}),14));
});

test('il ritorno al calcolatore usa il formato di URL della home, immutato',()=>{
  const url=COMPARA.urlCalcolatore(offerta({comune:'H501',mensilitaRaw:'14',
    nucleo:[{tipo:'figlio',eta:22,disabilita:false,reddito:0}],welfareRaw:'600'}));
  const query=new URLSearchParams(url.split('?')[1]);
  assert.equal(url.split('?')[0],'index.html');
  assert.equal(query.get('ral'),'35.000');
  assert.equal(query.get('m'),'14');
  assert.equal(query.get('c'),'H501');
  assert.equal(query.get('n'),'f22');
  assert.equal(query.get('w'),'600');
  assert.equal(query.get('calc'),'1');
  /* Nessun parametro nuovo: la home non deve imparare niente. */
  assert.deepEqual([...query.keys()].filter(k=>
    !['ral','m','c','ccnl','n','w','f','bt','bv','bn','calc'].includes(k)),[]);
  assert.equal(new URLSearchParams(COMPARA.urlCalcolatore(offerta()).split('?')[1]).get('n'),null);
});

/* ============================================================
   PRESENTAZIONE — il segno non è mai solo un colore
   ============================================================ */
test('lo zero non ha segno e ogni delta ha la sua parola',()=>{
  assert.equal(COMPARA.fmtDelta(0),'0,00 €');
  assert.equal(COMPARA.fmtDelta(-1),'−0,01 €');
  assert.equal(COMPARA.fmtDelta(120000),'+1.200,00 €');
  assert.equal(COMPARA.fmtDeltaNumero(0),'0');
  assert.equal(COMPARA.fmtDeltaNumero(null),'—');
  assert.equal(COMPARA.fmtNumero(100),'100');
  assert.equal(COMPARA.fmtNumero(37.5),'37,5');
  assert.equal(COMPARA.fmtNumero(1234.25),'1.234,25');
  assert.deepEqual([COMPARA.verso(1),COMPARA.verso(0),COMPARA.verso(-1)],
    ['in aumento','uguale','in calo']);
});

test('gli avvisi del motore arrivano fino al confronto',()=>{
  const esito=confrontaOk(offerta(),offerta({ralRaw:'150.000'}));
  assert.deepEqual(esito.avvisi.A,[]);
  assert.equal(esito.avvisi.B.length,1);
  assert.match(esito.avvisi.B[0],/massimale contributivo/);
  assert.equal(esito.risultati.B.riconciliazione.verificata,true);
});

/* ============================================================
   LA PAGINA — quello che si può provare senza browser
   ============================================================ */
test('compara.html dichiara title, description e self-canonical',()=>{
  const html=leggi('compara.html');
  assert.match(html,/<link rel="canonical" href="https:\/\/www\.dovevalatuaral\.com\/compara\.html">/);
  assert.match(html,/<title>[^<]*Confronta due offerte[^<]*<\/title>/);
  assert.match(html,/<meta name="description" content="[^"]+">/);
  assert.doesNotMatch(html,/<meta\s+name="robots"\s+content="[^"]*noindex/i);
  assert.match(html,/<h1>Confronta due offerte<\/h1>/);
  assert.match(html,/Confronta netto, benefit e costi legati al lavoro\./);
  assert.match(html,/Lavoro attuale/);
  assert.match(html,/Nuova offerta/);
});

test('la pagina carica gli script accanto e nessuna dipendenza esterna',()=>{
  const html=leggi('compara.html');
  for(const file of['dati-addizionali-2026.js','geografia.js','motore.js','ccnl.js',
    'fonti.js','righe.js','nucleo.js','compara.js'])
    assert.match(html,new RegExp(`<script src="${file.replace('.','\\.')}"></script>`),file);
  assert.doesNotMatch(html,/<script[^>]+src="https?:/);
  assert.doesNotMatch(html,/localStorage|sessionStorage/);
  assert.doesNotMatch(html,/type="module"/);
});

test('la home porta al confronto e il calcolo esistente non regredisce',()=>{
  const html=leggi('index.html');
  assert.match(html,/href="compara\.html"/,'il link «Confronta due offerte» dalla home');
  assert.match(html,/compara\.html#/,'la CTA dopo un risultato valido porta lo scenario nel fragment');
  assert.match(html,/<script src="nucleo\.js"><\/script>/);
  assert.match(html,/<script src="compara\.js"><\/script>/);
  /* Il codec del nucleo non è più duplicato dentro la pagina. */
  assert.doesNotMatch(html,/function deserializzaNucleo/);
  /* E la query string della home resta quella di prima. */
  assert.match(html,/p\.set\('ral',st\.ralRaw\)/);
  assert.match(html,/history\.replaceState\(null,'','\?'\+p\.toString\(\)/);
});

test('la sitemap e il canonical del confronto stanno insieme',()=>{
  assert.match(leggi('sitemap.xml'),/<loc>https:\/\/www\.dovevalatuaral\.com\/compara\.html<\/loc>/);
});
