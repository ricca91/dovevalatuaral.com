/* ============================================================
   COMPARA — due offerte, lo stesso motore, nessuna formula nuova.

   Questo file non sa niente di fisco. Normalizza quello che una
   persona ha scritto in un modulo, chiama DUE VOLTE `calcola()`
   esattamente come fa la home, e sottrae. Se qui dentro comparisse
   un'aliquota, il confronto smetterebbe di essere lo stesso
   calcolo visto due volte e diventerebbe un secondo calcolatore
   da tenere allineato a mano.

   Le tre parti, in ordine:
   1. normalizzaOfferta — dal testo grezzo ai valori, o agli errori
   2. confronta        — due scenari, le righe e il riepilogo
   3. codificaStato    — lo stato nel fragment, e ritorno

   Script classico come il resto: si carica da file://, e la stessa
   riga gira in Node per le prove.
   ============================================================ */
(function(root,factory){
  const inNode=typeof module!=='undefined'&&module.exports;
  const api=factory(
    inNode?require('./motore.js')
      :{calcola,applicaMensilita,MENSILITA_AMMESSE,parseRal,eur,fmt,K,toNumber},
    inNode?require('./geografia.js'):GEOGRAFIA_ITALIA,
    inNode?require('./nucleo.js')
      :{MAX_FAMILIARI,TIPO_LETTERA,serializzaNucleo,deserializzaNucleo,copiaNucleo});
  if(inNode)module.exports=api;else root.COMPARA=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(MOTORE,GEOGRAFIA,NUCLEO){

/* La versione dello schema sta nell'URL: un link vecchio deve poter
   dire «non so leggerti» invece di ricostruire un confronto sbagliato. */
const VERSIONE_STATO=1;
const COMUNE_DEFAULT='F205';
const MENSILITA_DEFAULT=13;
const TIPI_BUONI=Object.freeze(['elettronici','cartacei']);
const ETICHETTE=Object.freeze({A:'Lavoro attuale',B:'Nuova offerta'});
const MASSIMALE=MOTORE.toNumber(MOTORE.K.contributi.massimale);
/* I costi e i giorni si dichiarano AL MESE: è il modo in cui una persona
   conosce le proprie spese — un abbonamento, un pieno, i giorni in ufficio di
   un mese tipo — mentre l'equivalente annuo è un conto che dovrebbe fare a
   mente prima di scrivere. Il confronto lo porta a dodici mesi qui dentro, in
   un posto solo, e la tabella resta annua come il resto della pagina. */
const MESI=12;
const LIMITI=Object.freeze({
  ral:1000000,            // lo stesso perimetro della home, senza easter egg
  giorniPresenzaMese:31,
  buoniNumeroMese:310,    // dieci al giorno nel mese più lungo: un tetto, non una regola
  minutiViaggio:1440,
  oreSettimanali:168,
  lunghezzaCampo:24,      // un importo non è mai lungo: oltre, è rumore da URL
  lunghezzaNucleo:220,    // 12 familiari serializzati stanno abbondantemente sotto
});

/* Ogni campo dichiara in quale pannello vive: un errore dentro una
   sezione chiusa non si può correggere, e la pagina deve sapere
   quale aprire prima di spostare il fuoco. */
const SEZIONE_DEL_CAMPO=Object.freeze({
  ral:'principale',mensilita:'principale',comune:'principale',
  nucleo:'benefit',welfare:'benefit',fringe:'benefit',
  buoniTipo:'benefit',buoniValore:'benefit',buoniNumero:'benefit',
  trasporto:'costi',altreSpese:'costi',
  oreSettimanali:'costi',giorniPresenza:'costi',minutiViaggio:'costi',
});

/* ---------- l'offerta grezza: solo testo, come è stato scritto ----------
   Niente CCNL: sul confronto suggerirebbe soltanto le mensilità, che qui
   sono già un campo esplicito per ciascuna offerta. Un secondo controllo
   che muove il primo, e non tocca nessun numero, è rumore. */
const offertaVuota=()=>({
  ralRaw:'',mensilitaRaw:String(MENSILITA_DEFAULT),comune:COMUNE_DEFAULT,
  nucleo:[],
  welfareRaw:'',fringeRaw:'',buoniTipo:'elettronici',buoniValoreRaw:'',buoniNumeroRaw:'',
  trasportoRaw:'',altreSpeseRaw:'',
  oreSettimanaliRaw:'',giorniPresenzaRaw:'',minutiViaggioRaw:'',
});

/* «Copia A in B» esiste per essere modificata subito dopo: se le due
   offerte condividessero la lista dei familiari o l'oggetto dei buoni,
   toccare B cambierebbe A in silenzio. Copia per valore, sempre. */
const copiaOfferta=offerta=>({...offertaVuota(),...(offerta||{}),
  nucleo:NUCLEO.copiaNucleo((offerta||{}).nucleo)});

/* Lo stato della home ha nomi suoi: la traduzione sta qui, in un posto
   solo, così la CTA «Confronta con un'offerta» non reinventa il mapping. */
function offertaDaCalcolatore(stato){
  const s=stato||{};
  return{...offertaVuota(),
    ralRaw:s.ralRaw||'',mensilitaRaw:String(s.mensilita||MENSILITA_DEFAULT),
    comune:s.comune||COMUNE_DEFAULT,
    nucleo:NUCLEO.copiaNucleo(s.nucleo),
    welfareRaw:s.welfareRaw||'',fringeRaw:s.fringeRaw||'',
    buoniTipo:s.buoniTipo||'elettronici',
    buoniValoreRaw:s.buoniValoreRaw||'',buoniNumeroRaw:perMese(s.buoniNumeroRaw)};
}

/* Il ritorno al calcolatore usa la query string della home, immutata: costi,
   tempo e CCNL restano fuori — i primi due perché la home non li conosce, il
   terzo perché il confronto non lo chiede e non lo può inventare. Senza `ccnl`
   la home parte da «Nessun CCNL selezionato» e tiene le mensilità che arrivano. */
function urlCalcolatore(offerta,base='index.html'){
  const o={...offertaVuota(),...(offerta||{})};
  const p=new URLSearchParams();
  p.set('ral',String(o.ralRaw||''));
  p.set('m',String(o.mensilitaRaw||MENSILITA_DEFAULT));
  p.set('c',String(o.comune||COMUNE_DEFAULT));
  const n=NUCLEO.serializzaNucleo(o.nucleo);
  if(n)p.set('n',n);
  if(o.welfareRaw)p.set('w',String(o.welfareRaw));
  if(o.fringeRaw)p.set('f',String(o.fringeRaw));
  if(o.buoniTipo&&o.buoniTipo!=='elettronici')p.set('bt',String(o.buoniTipo));
  if(o.buoniValoreRaw)p.set('bv',String(o.buoniValoreRaw));
  /* La home conta i buoni all'anno e il suo URL non si tocca: qui si
     rimoltiplica per dodici, così andare e tornare non sposta un buono. */
  const buoniAnno=perAnno(o.buoniNumeroRaw);
  if(buoniAnno!==null)p.set('bn',String(buoniAnno));
  p.set('calc','1');
  return base+'?'+p.toString();
}

/* Il ponte fra le due unità, in due funzioni e in un posto solo. Il giro
   completo è esatto: 220 all'anno diventano 18,33 al mese, e 18,33 al mese
   tornano 220 all'anno — l'errore su dodici mesi vale sei centesimi di buono,
   e non arriva mai a spostarne uno. */
function perMese(rawAnnuo){
  const t=String(rawAnnuo===null||rawAnnuo===undefined?'':rawAnnuo).trim().replace(/[.\s]/g,'');
  if(!/^\d+$/.test(t))return '';
  const annuo=Number(t);
  if(!Number.isSafeInteger(annuo))return '';
  return annuo%MESI===0?String(annuo/MESI):(annuo/MESI).toFixed(2).replace('.',',');
}
function perAnno(rawMensile){
  const t=String(rawMensile===null||rawMensile===undefined?'':rawMensile).trim();
  if(t==='')return null;
  const v=MOTORE.parseRal(t);
  if(v===null||Number.isNaN(Number(v))||!Number.isFinite(Number(v))||Number(v)<0)return null;
  return Math.round(Number(v)*MESI);
}

/* ============================================================
   1. NORMALIZZAZIONE — dal testo ai valori, o agli errori.
   Ogni errore porta il campo e il pannello: la pagina non deve
   indovinare dove sta la casella da aprire.
   ============================================================ */
const testo=v=>v===null||v===undefined?'':String(v);
const finito=v=>Number.isFinite(Number(v));

function normalizzaOfferta(grezza){
  const o={...offertaVuota(),...(grezza||{})};
  const errori=[];
  const sbaglia=(campo,messaggio)=>{
    if(!errori.some(e=>e.campo===campo))
      errori.push({campo,sezione:SEZIONE_DEL_CAMPO[campo]||'principale',messaggio});
    return null;
  };
  const lungo=(campo,raw)=>{
    if(testo(raw).length<=LIMITI.lunghezzaCampo)return false;
    sbaglia(campo,'Il valore inserito non è leggibile come numero.');
    return true;
  };

  /* --- RAL: stesso parser e stesso perimetro della home --- */
  let ral=null;
  if(!lungo('ral',o.ralRaw)){
    const v=MOTORE.parseRal(testo(o.ralRaw));
    if(v===null)sbaglia('ral','Inserisci la RAL per confrontare.');
    else if(Number.isNaN(Number(v)))
      sbaglia('ral','Solo cifre: usa la virgola per i decimali, per esempio 35.000,50.');
    else if(Number(v)<0)sbaglia('ral','La RAL non può essere negativa.');
    else if(!finito(v))sbaglia('ral','Il valore inserito non è leggibile come numero.');
    else if(Number(v)>LIMITI.ral)
      sbaglia('ral','Il confronto è disponibile fino a una RAL di 1.000.000 €.');
    else ral=v;
  }

  /* --- importi facoltativi: vuoto vale zero, mai «non dichiarato» --- */
  const importo=(campo,raw,nome)=>{
    const t=testo(raw).trim();
    if(t==='')return '0';
    if(lungo(campo,t))return null;
    const v=MOTORE.parseRal(t);
    if(v===null||Number.isNaN(Number(v))||!finito(v)||Number(v)<0)
      return sbaglia(campo,`${nome} deve essere un importo positivo, oppure vuoto.`);
    return v;
  };
  const welfare=importo('welfare',o.welfareRaw,'Il welfare annuo');
  const fringe=importo('fringe',o.fringeRaw,'I fringe benefit annui');
  const buoniValore=importo('buoniValore',o.buoniValoreRaw,'Il valore unitario dei buoni');
  const trasporto=importo('trasporto',o.trasportoRaw,'Il costo di trasporto annuo');
  const altreSpese=importo('altreSpese',o.altreSpeseRaw,'Le altre spese annue');

  /* --- interi: i buoni e i giorni si contano, non si misurano --- */
  const intero=(campo,raw,max,nome,vuoto)=>{
    const t=testo(raw).trim().replace(/[.\s]/g,'');
    if(t==='')return vuoto;
    if(lungo(campo,t))return null;
    if(!/^\d+$/.test(t))
      return sbaglia(campo,`${nome} deve essere un numero intero, oppure vuoto.`);
    const n=Number(t);
    if(!Number.isSafeInteger(n)||n<0||n>max)
      return sbaglia(campo,`${nome} deve stare fra 0 e ${max}.`);
    return n;
  };
  /* Il tempo lasciato vuoto NON è zero: è «non dichiarato», e resta
     distinto per tutta la catena fino alla riga della tabella. */
  const giorniPresenzaMese=intero('giorniPresenza',o.giorniPresenzaRaw,
    LIMITI.giorniPresenzaMese,'I giorni in presenza al mese',null);

  /* --- misure con decimali: 37,5 ore alla settimana è un caso vero --- */
  const misura=(campo,raw,max,nome,vuoto=null)=>{
    const t=testo(raw).trim();
    if(t==='')return vuoto;
    if(lungo(campo,t))return null;
    const v=MOTORE.parseRal(t);
    if(v===null||Number.isNaN(Number(v))||!finito(v)||Number(v)<0||Number(v)>max)
      return sbaglia(campo,`${nome} deve stare fra 0 e ${fmtNumero(max)}.`);
    return Number(v);
  };
  const minutiViaggio=misura('minutiViaggio',o.minutiViaggioRaw,LIMITI.minutiViaggio,
    'I minuti di viaggio al giorno');
  const oreSettimanali=misura('oreSettimanali',o.oreSettimanaliRaw,LIMITI.oreSettimanali,
    'Le ore di lavoro settimanali');
  /* I buoni si contano al mese, e accettano i decimali per una ragione sola:
     220 buoni l'anno — il caso più comune che arriva dalla home — sono 18,33
     al mese, e nessun intero li rappresenta. Chi compila a mano scrive 20 e
     resta 20; la media con la virgola compare solo quando serve a non perdere
     per strada quattro buoni all'anno. Al motore arriva comunque un intero:
     il conto annuo. */
  const buoniNumeroMese=misura('buoniNumero',o.buoniNumeroRaw,LIMITI.buoniNumeroMese,
    'Il numero di buoni al mese',0);

  /* --- enumerazioni: sconosciuto è un errore, non un default --- */
  const mensilitaNumero=Number(testo(o.mensilitaRaw));
  const mensilita=MOTORE.MENSILITA_AMMESSE.includes(mensilitaNumero)?mensilitaNumero
    :sbaglia('mensilita','Mensilità non ammessa: scegline una fra 12 e 16.');
  const buoniTipo=TIPI_BUONI.includes(o.buoniTipo)?o.buoniTipo
    :sbaglia('buoniTipo','Tipo di buoni pasto sconosciuto.');
  let comune=null;
  try{comune=GEOGRAFIA.risolvi(testo(o.comune)||COMUNE_DEFAULT).comune.catastale;}
  catch{sbaglia('comune','Comune non attivo nello snapshot Istat.');}

  /* --- nucleo: le stesse regole del codec, verificate una per una --- */
  const nucleo=[];
  const familiari=Array.isArray(o.nucleo)?o.nucleo:null;
  if(familiari===null)
    sbaglia('nucleo','Il nucleo dichiarato non è una lista di familiari.');
  else if(familiari.length>NUCLEO.MAX_FAMILIARI)
    sbaglia('nucleo',`Il nucleo dichiarato non può superare ${NUCLEO.MAX_FAMILIARI} familiari.`);
  else{
    let coniugi=0;
    for(const f of familiari){
      const tipo=f&&NUCLEO.TIPO_LETTERA[f.tipo]?f.tipo:null;
      if(!tipo){sbaglia('nucleo','Tipo di familiare sconosciuto.');break;}
      if(tipo==='coniuge'&&++coniugi>1){
        sbaglia('nucleo','L’art. 12 conosce un solo coniuge a carico.');break;}
      const eta=tipo!=='figlio'||f.eta===null||f.eta===undefined||f.eta===''?null:Number(f.eta);
      if(eta!==null&&(!Number.isInteger(eta)||eta<0||eta>999)){
        sbaglia('nucleo','L’età di un figlio deve essere un numero intero di anni.');break;}
      const reddito=f.reddito===null||f.reddito===undefined||f.reddito===''?0:Number(f.reddito);
      if(!Number.isInteger(reddito)||reddito<0||reddito>9999999){
        sbaglia('nucleo','Il reddito di un familiare deve essere un intero non negativo.');break;}
      nucleo.push({tipo,eta,disabilita:!!f.disabilita,reddito});
    }
  }

  if(errori.length)return{ok:false,errori,valore:null};

  const costiCentesimiMese=inCentesimi(trasporto)+inCentesimi(altreSpese);
  return{ok:true,errori:[],valore:{
    ral,mensilita,comune,nucleo,
    welfare,fringe,
    buoniPasto:{tipo:buoniTipo,valoreUnitario:buoniValore,
      numero:buoniNumeroMese===null?null:Math.round(buoniNumeroMese*MESI)},
    buoniNumeroMese,
    /* Mensile per chi scrive, annuo per il confronto: la moltiplicazione per
       12 su centesimi interi è esatta, e non lascia in giro mezzo centesimo. */
    costi:{trasportoMese:trasporto,altreSpeseMese:altreSpese,
      centesimiMese:costiCentesimiMese,centesimi:costiCentesimiMese*MESI},
    tempo:{oreSettimanali,giorniPresenzaMese,minutiViaggio},
  }};
}

/* ============================================================
   2. CONFRONTO — due chiamate al motore, e delle sottrazioni.
   Gli importi derivati vivono in centesimi interi: sottrarre due
   medie già arrotondate produce un euro che non esiste.
   ============================================================ */
/* Le stringhe che escono da parseRal hanno la forma `\d+(\.\d+)?`:
   qui si convertono in centesimi senza passare da un float. */
function inCentesimi(valore){
  const t=testo(valore);
  const m=/^(\d+)(?:\.(\d*))?$/.exec(t);
  if(!m)return Math.round(Number(t)*100);
  const decimali=(m[2]||'').padEnd(3,'0');
  const su=Number(decimali[2])>=5?1:0;   // mezzo centesimo verso l'alto, come il motore
  return Number(m[1])*100+Number(decimali.slice(0,2))+su;
}
const centesimiDi=numero=>Math.round(numero*100);
/* Math.round arrotonda verso +∞: su un delta negativo darebbe un
   centesimo di differenza fra «−104,17» e «+104,16». Simmetrico. */
const dividiCentesimi=(centesimi,divisore)=>{
  const q=centesimi/divisore;
  return q<0?-Math.round(-q):Math.round(q);
};
const arrotonda2=n=>Math.round(n*100)/100;

function calcolaScenario(valore){
  return MOTORE.applicaMensilita(MOTORE.calcola(valore.ral,{
    comune:valore.comune,nucleo:valore.nucleo,
    welfare:valore.welfare,fringe:valore.fringe,
    buoniPasto:valore.buoniPasto,
  }),valore.mensilita);
}

/* Le ore di viaggio non sono una stima: sono la moltiplicazione di dati
   dichiarati. I giorni arrivano al mese, quindi passano per i dodici mesi
   prima di incontrare i minuti. Se manca uno dei due il risultato non è
   zero, è assente. */
function oreViaggioAnnue(tempo){
  if(tempo.giorniPresenzaMese===null||tempo.minutiViaggio===null)return null;
  return arrotonda2(tempo.giorniPresenzaMese*MESI*tempo.minutiViaggio/60);
}

function avvisiScenario(risultato){
  const avvisi=[];
  if(risultato.input.ral>MASSIMALE)avvisi.push(
    `Oltre ${fmtNumero(MASSIMALE)} € di RAL il risultato applica il massimale contributivo `+
    'assumendo nessuna anzianità contributiva al 31 dicembre 1995: se la condizione non vale, '+
    'il numero non è applicabile.');
  if(!risultato.riconciliazione.verificata)avvisi.push(
    'La riconciliazione del motore non chiude su questo scenario: il risultato non è affidabile.');
  return avvisi;
}

function confronta(grezzaA,grezzaB){
  const normalizzate={A:normalizzaOfferta(grezzaA),B:normalizzaOfferta(grezzaB)};
  const errori=[];
  for(const lato of['A','B'])
    for(const e of normalizzate[lato].errori)errori.push({offerta:lato,...e});
  if(errori.length)return{ok:false,errori,esito:null};

  const risultati={};
  for(const lato of['A','B']){
    try{risultati[lato]=calcolaScenario(normalizzate[lato].valore);}
    catch(errore){
      return{ok:false,esito:null,errori:[{offerta:lato,campo:'ral',sezione:'principale',
        messaggio:`Il motore non ha potuto calcolare questo scenario: ${errore.message}`}]};
    }
  }

  const A=normalizzate.A.valore,B=normalizzate.B.valore;
  const c=(lato,estrai)=>centesimiDi(estrai(risultati[lato]));
  const ral={A:c('A',r=>r.input.ral),B:c('B',r=>r.input.ral)};
  const netto={A:c('A',r=>r.kpi.nettoInBusta),B:c('B',r=>r.kpi.nettoInBusta)};
  const media={A:c('A',r=>r.kpi.mediaMensile),B:c('B',r=>r.kpi.mediaMensile)};
  const benefit={A:c('A',r=>r.kpi.benefitSpendibili),B:c('B',r=>r.kpi.benefitSpendibili)};
  const pacchetto={A:c('A',r=>r.kpi.valorePacchetto),B:c('B',r=>r.kpi.valorePacchetto)};
  const costi={A:A.costi.centesimi,B:B.costi.centesimi};
  /* I benefit non entrano qui: buoni e welfare non sono denaro che si
     può usare per pagare il treno, e sommarli falserebbe la riga. */
  const dopoCosti={A:netto.A-costi.A,B:netto.B-costi.B};
  const viaggio={A:oreViaggioAnnue(A.tempo),B:oreViaggioAnnue(B.tempo)};
  const oreSettimana={A:A.tempo.oreSettimanali,B:B.tempo.oreSettimanali};

  const deltaNetto=netto.B-netto.A;
  const deltaDopoCosti=dopoCosti.B-dopoCosti.A;
  const deltaOre=(a,b)=>a===null||b===null?null:arrotonda2(b-a);

  const righe=[
    {chiave:'ral',etichetta:'RAL annua',unita:'euro',
      a:ral.A,b:ral.B,delta:ral.B-ral.A},
    {chiave:'netto',etichetta:'Netto annuo in busta',unita:'euro',
      a:netto.A,b:netto.B,delta:deltaNetto},
    {chiave:'netto12',etichetta:'Netto annuo / 12',unita:'euro',
      nota:'Media su 12 mesi, per confrontare offerte con mensilità diverse.',
      a:dividiCentesimi(netto.A,12),b:dividiCentesimi(netto.B,12),
      delta:dividiCentesimi(deltaNetto,12)},
    /* Un netto diviso per 13 e uno diviso per 14 non stanno sulla stessa
       scala: la differenza fra le due medie non è un aumento, quindi non
       si calcola. Il divisore resta visibile per ciascuna offerta. */
    {chiave:'media',etichetta:'Media per mensilità scelta',unita:'euro',
      nota:'Mensilità diverse non sono un aumento: qui la differenza non si calcola.',
      a:media.A,b:media.B,delta:null,senzaDelta:true,
      divisore:{a:A.mensilita,b:B.mensilita}},
    {chiave:'benefit',etichetta:'Benefit spendibili annui',unita:'euro',
      nota:'Welfare, fringe e buoni: valore spendibile, non denaro in busta.',
      a:benefit.A,b:benefit.B,delta:benefit.B-benefit.A},
    {chiave:'pacchetto',etichetta:'Valore nominale del pacchetto annuo',unita:'euro',
      a:pacchetto.A,b:pacchetto.B,delta:pacchetto.B-pacchetto.A},
    {chiave:'costi',etichetta:'Costi annui dichiarati',unita:'euro',
      nota:'Trasporto più le altre spese, dichiarati al mese e portati a 12 mesi. '+
        'Nessuna stima automatica.',
      a:costi.A,b:costi.B,delta:costi.B-costi.A},
    {chiave:'dopoCosti',etichetta:'Netto annuo meno costi dichiarati',unita:'euro',
      a:dopoCosti.A,b:dopoCosti.B,delta:deltaDopoCosti},
    {chiave:'dopoCosti12',etichetta:'Netto meno costi / 12',unita:'euro',
      nota:'La differenza annua divisa per 12, non due medie sottratte.',
      a:dividiCentesimi(dopoCosti.A,12),b:dividiCentesimi(dopoCosti.B,12),
      delta:dividiCentesimi(deltaDopoCosti,12)},
  ];
  if(oreSettimana.A!==null||oreSettimana.B!==null)righe.push({
    chiave:'oreSettimanali',etichetta:'Ore di lavoro settimanali',unita:'ore',
    a:oreSettimana.A,b:oreSettimana.B,delta:deltaOre(oreSettimana.A,oreSettimana.B)});
  righe.push({chiave:'oreViaggio',etichetta:'Ore annue di viaggio',unita:'ore',
    nota:'Giorni al mese × 12 × minuti al giorno ÷ 60. Il tempo non viene monetizzato.',
    a:viaggio.A,b:viaggio.B,delta:deltaOre(viaggio.A,viaggio.B)});

  return{ok:true,errori:[],esito:{
    offerte:{A,B},risultati,
    avvisi:{A:avvisiScenario(risultati.A),B:avvisiScenario(risultati.B)},
    righe,
    riepilogo:{
      netto:{delta:deltaNetto,testo:frasenetto(deltaNetto)},
      costi:{delta:deltaDopoCosti,deltaMese:dividiCentesimi(deltaDopoCosti,12),
        testo:fraseCosti(deltaDopoCosti,dividiCentesimi(deltaDopoCosti,12))},
      viaggio:{disponibile:viaggio.A!==null&&viaggio.B!==null,
        a:viaggio.A,b:viaggio.B,delta:deltaOre(viaggio.A,viaggio.B),
        testo:fraseViaggio(viaggio)},
    },
  }};
}

/* ---------- le frasi: il segno non è mai solo un colore ---------- */
function frasenetto(delta){
  if(delta===0)return'Il netto annuo è uguale nelle due offerte.';
  return`Con la nuova offerta il netto annuo ${delta>0?'aumenta':'diminuisce'} `+
    `di ${fmtEuro(Math.abs(delta))}.`;
}
function fraseCosti(delta,deltaMese){
  if(delta===0)
    return'Dopo i costi dichiarati per lavorare, il denaro disponibile è lo stesso.';
  return`Dopo i costi dichiarati per lavorare, ${delta>0?'restano':'mancano'} `+
    `${fmtEuro(Math.abs(delta))} l’anno, cioè ${fmtEuro(Math.abs(deltaMese))} al mese.`;
}
function fraseViaggio(viaggio){
  if(viaggio.A===null||viaggio.B===null)
    return'Ore annue di viaggio: non dichiarate per entrambe le offerte, quindi non confrontate.';
  const delta=arrotonda2(viaggio.B-viaggio.A);
  if(delta===0)
    return`Le ore annue di viaggio sono le stesse: ${fmtNumero(viaggio.A)}.`;
  return`Le ore annue di viaggio passano da ${fmtNumero(viaggio.A)} a `+
    `${fmtNumero(viaggio.B)}: ${delta>0?'+':'−'}${fmtNumero(Math.abs(delta))} l’anno.`;
}

/* ---------- formattazione condivisa da pagina e prove ---------- */
const fmtEuro=centesimi=>MOTORE.eur(centesimi/100);
/* «−0,00 €» non è un numero che qualcuno vuole leggere: lo zero non
   ha segno, e sotto ha comunque la sua parola. */
const fmtDelta=centesimi=>centesimi===0?MOTORE.eur(0)
  :(centesimi>0?'+':'')+MOTORE.eur(centesimi/100);
const verso=valore=>valore===0?'uguale':valore>0?'in aumento':'in calo';
function fmtNumero(valore){
  if(valore===null||valore===undefined)return'—';
  const negativo=valore<0;
  let testoValore=Math.abs(valore).toFixed(2).replace(/0+$/,'').replace(/\.$/,'');
  const[intera,decimale]=testoValore.split('.');
  const raggruppata=intera.replace(/\B(?=(\d{3})+(?!\d))/g,'.');
  return(negativo?'−':'')+raggruppata+(decimale?','+decimale:'');
}
const fmtDeltaNumero=valore=>valore===null?'—'
  :valore===0?'0':(valore>0?'+':'−')+fmtNumero(Math.abs(valore));

/* ============================================================
   3. STATO NELL'URL — fragment, non query string.
   Il fragment non viene inviato al server: i dati familiari e gli
   importi di due offerte restano sul dispositivo di chi apre il
   link. Non è cifratura — chi ha il link legge tutto — ed è per
   questo che la pagina lo dice accanto al pulsante.
   ============================================================ */
/* La `m` finale di `trm`, `asm`, `ggm` e `bnm` non è decorazione: quei quattro
   campi erano annui in una versione precedente dello schema, e un nome uguale con
   un'unità diversa farebbe rileggere «1.200 all'anno» come «1.200 al mese».
   Col nome nuovo un link vecchio lascia il campo vuoto — non dichiarato, mai
   un numero sbagliato. */
const CAMPI_TESTO=Object.freeze([
  ['w','welfareRaw'],['f','fringeRaw'],['bv','buoniValoreRaw'],['bnm','buoniNumeroRaw'],
  ['trm','trasportoRaw'],['asm','altreSpeseRaw'],
  ['ore','oreSettimanaliRaw'],['ggm','giorniPresenzaRaw'],['min','minutiViaggioRaw'],
]);

function codificaOfferta(parametri,prefisso,offerta){
  const o={...offertaVuota(),...(offerta||{})};
  parametri.set(prefisso+'ral',testo(o.ralRaw));
  parametri.set(prefisso+'m',testo(o.mensilitaRaw));
  parametri.set(prefisso+'c',testo(o.comune));
  const nucleo=NUCLEO.serializzaNucleo(o.nucleo);
  if(nucleo)parametri.set(prefisso+'n',nucleo);
  if(o.buoniTipo&&o.buoniTipo!=='elettronici')parametri.set(prefisso+'bt',testo(o.buoniTipo));
  for(const[chiave,campo]of CAMPI_TESTO)
    if(testo(o[campo])!=='')parametri.set(prefisso+chiave,testo(o[campo]));
}

/* Lo stato porta gli input, mai i risultati: al ripristino si
   ricalcola, così un link non può congelare numeri di ieri. */
function codificaStato(stato){
  const parametri=new URLSearchParams();
  parametri.set('v',String(VERSIONE_STATO));
  codificaOfferta(parametri,'a.',(stato||{}).A);
  codificaOfferta(parametri,'b.',(stato||{}).B);
  return parametri.toString();
}

/* Un valore che non può venire da questo modulo — un comune inesistente,
   una mensilità fuori elenco, un nucleo che non si riserializza uguale —
   non viene «corretto»: rende il link non leggibile, e la pagina lo dice.
   Gli importi invece restano testo grezzo, così un numero sbagliato
   diventa un errore di campo che si può correggere a mano. */
function decodificaOfferta(parametri,prefisso){
  const o=offertaVuota();
  const leggi=chiave=>parametri.get(prefisso+chiave);
  for(const[chiave,campo]of[['ral','ralRaw'],...CAMPI_TESTO]){
    const valore=leggi(chiave);
    if(valore===null)continue;
    if(valore.length>LIMITI.lunghezzaCampo)return null;
    o[campo]=valore;
  }
  const mensilita=leggi('m');
  if(mensilita!==null){
    if(!MOTORE.MENSILITA_AMMESSE.includes(Number(mensilita)))return null;
    o.mensilitaRaw=String(Number(mensilita));
  }
  const comune=leggi('c');
  if(comune!==null){
    try{o.comune=GEOGRAFIA.risolvi(comune).comune.catastale;}catch{return null;}
  }
  const tipo=leggi('bt');
  if(tipo!==null){
    if(!TIPI_BUONI.includes(tipo))return null;
    o.buoniTipo=tipo;
  }
  const nucleo=leggi('n');
  if(nucleo!==null&&nucleo!==''){
    if(nucleo.length>LIMITI.lunghezzaNucleo)return null;
    const familiari=NUCLEO.deserializzaNucleo(nucleo);
    /* Il codec scarta i token che non riconosce. Scartarli in silenzio
       qui vorrebbe dire ricostruire il nucleo di un'altra persona: se
       non si riserializza identico, il link non è leggibile. */
    if(NUCLEO.serializzaNucleo(familiari)!==nucleo)return null;
    o.nucleo=familiari;
  }
  return o;
}

function decodificaStato(fragment){
  const grezzo=testo(fragment).replace(/^#/,'');
  if(grezzo==='')return{ok:false,motivo:'vuoto',stato:null};
  let parametri;
  try{parametri=new URLSearchParams(grezzo);}
  catch{return{ok:false,motivo:'illeggibile',stato:null};}
  const versione=parametri.get('v');
  if(versione===null)return{ok:false,motivo:'illeggibile',stato:null};
  if(versione!==String(VERSIONE_STATO))return{ok:false,motivo:'versione',stato:null};
  const A=decodificaOfferta(parametri,'a.'),B=decodificaOfferta(parametri,'b.');
  if(!A||!B)return{ok:false,motivo:'illeggibile',stato:null};
  return{ok:true,motivo:null,stato:{A,B}};
}

const MOTIVI=Object.freeze({
  vuoto:'Il link non contiene nessun confronto.',
  versione:'Questo link usa una versione dello schema che questa pagina non conosce.',
  illeggibile:'Il link del confronto non è leggibile: alcuni valori non sono validi.',
});

return Object.freeze({
  VERSIONE_STATO,LIMITI,ETICHETTE,TIPI_BUONI,MOTIVI,SEZIONE_DEL_CAMPO,
  MENSILITA_AMMESSE:MOTORE.MENSILITA_AMMESSE,
  offertaVuota,copiaOfferta,offertaDaCalcolatore,urlCalcolatore,
  normalizzaOfferta,confronta,oreViaggioAnnue,
  codificaStato,decodificaStato,
  inCentesimi,dividiCentesimi,perMese,perAnno,
  fmtEuro,fmtDelta,fmtNumero,fmtDeltaNumero,verso,
});
});
