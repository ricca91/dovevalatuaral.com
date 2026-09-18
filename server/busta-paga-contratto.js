/* ============================================================
   BUSTA PAGA — IL CONTRATTO DELL'ANALISI.

   Qui non si chiama nessun modello e non si tocca la rete: è la
   parte che decide che cosa, di quello che il modello risponde,
   ha il diritto di finire sotto gli occhi di una persona.

   Tre regole, e sono la ragione per cui questo file esiste
   separato da chi fa la chiamata:

   1. **Ogni voce deve citarsi.** `sourceLabel` e `sourceAmount`
      devono comparire alla lettera in **una sola riga** del testo
      che abbiamo mandato. Quello che non passa viene scartato,
      non mostrato con confidenza bassa. È più stretto di quanto
      chieda il ticket — che vuole «alla lettera nel testo» — e la
      riga in più è voluta: su un cedolino la dicitura e il suo
      importo stanno sulla stessa riga, e pescare un importo da
      un'altra riga è esattamente l'errore che vogliamo impedire.
   2. **L'aritmetica non la fa il modello.** Il modello etichetta
      e classifica. La somma e il confronto con il netto
      dichiarato li fa `riconcilia()`.
   3. **Categoria ed effetto sono enumerazioni chiuse.** Un valore
      fuori elenco non è una voce da scartare: rende **tutta** la
      risposta non conforme, e una risposta non conforme non si
      renderizza.

   Nessun contenuto del documento esce da qui dentro un errore:
   le funzioni restituiscono codici, mai pezzi di cedolino.
   ============================================================ */
'use strict';

/* Le categorie del ticket padre, nell'ordine in cui compaiono lì. */
const CATEGORIE=Object.freeze(['competenza','trattenuta','contributo','imposta',
  'informativa','progressivo','sconosciuta']);
/* Le quattro risposte possibili a «che cosa fa al mio netto». */
const EFFETTI=Object.freeze(['aumenta_il_lordo','riduce_il_netto','non_modifica_il_netto','dipende']);
const CONFIDENZE=Object.freeze(['alta','media','bassa']);

/* Le tre famiglie che tolgono soldi. Servono a `riconcilia()` e stanno qui
   perché la somma è nostra: se cambia l'elenco, cambia il conto. */
const CATEGORIE_IN_USCITA=Object.freeze(['trattenuta','contributo','imposta']);

/* I codici che l'endpoint può restituire. La copy di ognuno vive in
   `prototipo/busta-paga-estrazione.js`, dentro `MESSAGGI`, insieme a quella
   degli errori di lettura: una prova impone che i due elenchi combacino, così
   nessun codice nuovo arriva a schermo senza qualcuno che lo spieghi. */
const CODICI=Object.freeze({
  TESTO_NON_VALIDO:'TESTO_NON_VALIDO',
  TESTO_TROPPO_LUNGO:'TESTO_TROPPO_LUNGO',
  TROPPE_RICHIESTE:'TROPPE_RICHIESTE',
  BUDGET_SUPERATO:'BUDGET_SUPERATO',
  RISPOSTA_NON_CONFORME:'RISPOSTA_NON_CONFORME',
  SERVIZIO_NON_DISPONIBILE:'SERVIZIO_NON_DISPONIBILE',
  NESSUNA_VOCE:'NESSUNA_VOCE',
});

const LIMITI=Object.freeze({
  /* Lo stesso tetto che `BUSTA_PAGA_ESTRAZIONE.LIMITI.caratteriMassimi`
     dichiara al browser. Qui è ripetuto perché il server non si fida del
     client: una prova verifica che i due numeri siano lo stesso numero. */
  caratteriMassimi:20000,
  caratteriMinimi:200,
  vociMassime:80,
  avvisiPerVoce:3,
  caratteriDicitura:200,
  caratteriImporto:40,
  caratteriSpiegazione:400,
  caratteriRiferimento:160,
  caratteriAvviso:200,
  verificheMassime:3,
  /* Un cedolino è in centesimi: sotto questa soglia il conto torna. */
  tolleranzaEuro:0.01,
});

const spazi=testo=>String(testo).replace(/\s+/g,' ').trim();

/* Taglia invece di rifiutare. Spiegazione, riferimento e avvisi sono testo del
   modello, non dati: se è troppo lungo lo accorciamo, mentre un'enumerazione
   sbagliata o una citazione falsa fanno cadere la risposta intera. Il confine
   è voluto: si è severi su ciò che pretende di essere un fatto. */
function taglia(testo,massimo){
  const pulito=spazi(testo);
  return pulito.length<=massimo?pulito:`${pulito.slice(0,massimo-1).trimEnd()}…`;
}

/* ------------------------------------------------------------
   Numeri all'italiana.
   Un cedolino scrive `2.562,00`, a volte `18,50-` con il meno in coda, a
   volte con l'euro attaccato. Tutto il resto non è un importo: torna `null`,
   e chi chiama decide che farne.
   ------------------------------------------------------------ */
const FORMA_IMPORTO=/^([-+]?)\s*(?:€\s*)?((?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?)\s*(?:€\s*)?([-+]?)$/;
function numero(valore){
  if(typeof valore!=='string')return null;
  const grezzo=valore.replace(/\u00a0/g,' ').trim();
  const pezzi=grezzo.match(FORMA_IMPORTO);
  if(!pezzi)return null;
  if(pezzi[1]&&pezzi[3])return null;      // due segni non sono un numero
  const segno=(pezzi[1]==='-'||pezzi[3]==='-')?-1:1;
  const valoreNumerico=Number(pezzi[2].replace(/\./g,'').replace(',','.'));
  return Number.isFinite(valoreNumerico)?segno*valoreNumerico:null;
}

const arrotonda=valore=>Math.round(valore*100)/100;

/* ------------------------------------------------------------
   La citazione.
   `righeDi()` prepara una volta sola le righe del testo inviato, normalizzate
   negli spazi e basta: nessuna minuscola, nessun accento tolto. «Alla lettera»
   vuol dire alla lettera.
   ------------------------------------------------------------ */
const righeDi=testo=>String(testo||'').split('\n').map(spazi).filter(Boolean);

/* La riga del testo inviato che contiene tutti i pezzi, o `null`. Chiedere una
   riga sola è il punto: dicitura e importo devono stare insieme com'erano sul
   cedolino. */
function rigaCheCita(righe,...pezzi){
  const cercati=pezzi.filter(pezzo=>typeof pezzo==='string'&&spazi(pezzo)).map(spazi);
  if(!cercati.length)return null;
  return righe.find(riga=>cercati.every(pezzo=>riga.includes(pezzo)))||null;
}
const cita=(righe,...pezzi)=>rigaCheCita(righe,...pezzi)!==null;

/* ------------------------------------------------------------
   Lo schema.
   `validaRisposta()` guarda solo la forma: tipi giusti, enumerazioni dentro
   l'elenco, niente campi obbligatori mancanti. Non guarda il testo inviato —
   quello è lavoro delle guardie, e tenerli separati serve a poter provare i
   due fallimenti uno per volta.
   ------------------------------------------------------------ */
const stringa=valore=>typeof valore==='string'&&spazi(valore).length>0;
const stringaOpzionale=valore=>valore===null||valore===undefined||typeof valore==='string';

function validaValoreLetto(grezzo){
  if(grezzo===null||grezzo===undefined)return{ok:true,valore:null};
  if(typeof grezzo!=='object'||Array.isArray(grezzo))return{ok:false};
  if(!stringa(grezzo.sourceValue))return{ok:true,valore:null};   // «non individuato»
  if(!stringaOpzionale(grezzo.sourceReference))return{ok:false};
  return{ok:true,valore:{
    sourceValue:taglia(grezzo.sourceValue,LIMITI.caratteriImporto),
    sourceReference:taglia(grezzo.sourceReference||'',LIMITI.caratteriRiferimento),
  }};
}

const CHIAVI_TOTALI=Object.freeze(['competenze','trattenute','netto','ferieResidue','permessiResidui']);

function validaRisposta(grezza){
  const nonConforme={ok:false,codice:CODICI.RISPOSTA_NON_CONFORME};
  if(!grezza||typeof grezza!=='object'||Array.isArray(grezza))return nonConforme;
  if(!Array.isArray(grezza.voci))return nonConforme;
  if(grezza.voci.length>LIMITI.vociMassime)return nonConforme;

  const periodo=validaValoreLetto(grezza.periodo);
  if(!periodo.ok)return nonConforme;

  const totaliGrezzi=grezza.totali===null||grezza.totali===undefined?{}:grezza.totali;
  if(typeof totaliGrezzi!=='object'||Array.isArray(totaliGrezzi))return nonConforme;
  const totali={};
  for(const chiave of CHIAVI_TOTALI){
    const esito=validaValoreLetto(totaliGrezzi[chiave]);
    if(!esito.ok)return nonConforme;
    totali[chiave]=esito.valore;
  }

  const voci=[];
  for(const grezzo of grezza.voci){
    if(!grezzo||typeof grezzo!=='object'||Array.isArray(grezzo))return nonConforme;
    if(!stringa(grezzo.sourceLabel))return nonConforme;
    if(!stringaOpzionale(grezzo.sourceAmount))return nonConforme;
    /* Le tre enumerazioni chiuse. Fuori elenco non è una voce da buttare: è
       tutta la risposta che non si renderizza. */
    if(!CATEGORIE.includes(grezzo.category))return nonConforme;
    if(!EFFETTI.includes(grezzo.effect))return nonConforme;
    if(!CONFIDENZE.includes(grezzo.confidence))return nonConforme;
    if(!stringa(grezzo.plainExplanation))return nonConforme;
    if(!stringaOpzionale(grezzo.sourceReference))return nonConforme;
    const avvisiGrezzi=grezzo.warnings===null||grezzo.warnings===undefined?[]:grezzo.warnings;
    if(!Array.isArray(avvisiGrezzi))return nonConforme;
    if(avvisiGrezzi.some(avviso=>typeof avviso!=='string'))return nonConforme;

    voci.push({
      sourceLabel:taglia(grezzo.sourceLabel,LIMITI.caratteriDicitura),
      sourceAmount:stringa(grezzo.sourceAmount)?taglia(grezzo.sourceAmount,LIMITI.caratteriImporto):null,
      category:grezzo.category,
      effect:grezzo.effect,
      plainExplanation:taglia(grezzo.plainExplanation,LIMITI.caratteriSpiegazione),
      confidence:grezzo.confidence,
      sourceReference:taglia(grezzo.sourceReference||'',LIMITI.caratteriRiferimento),
      warnings:avvisiGrezzi.map(avviso=>taglia(avviso,LIMITI.caratteriAvviso))
        .filter(Boolean).slice(0,LIMITI.avvisiPerVoce),
    });
  }

  return{ok:true,risposta:{periodo:periodo.valore,totali,voci}};
}

/* ------------------------------------------------------------
   Le guardie.
   Prendono una risposta già valida di forma e il testo che abbiamo mandato, e
   buttano via tutto quello che non si cita. Restituiscono anche quanto hanno
   buttato, a fasce: il numero esatto di voci di un cedolino è un dato del
   cedolino, la fascia no.
   ------------------------------------------------------------ */
function fascia(scartate,ricevute){
  if(!ricevute||!scartate)return'0';
  const quota=Math.round(scartate/ricevute*100);
  if(quota<=10)return'1-10';
  if(quota<=25)return'11-25';
  if(quota<=50)return'26-50';
  return'51-100';
}

function guardie(risposta,testo){
  const righe=righeDi(testo);

  const periodo=risposta.periodo&&cita(righe,risposta.periodo.sourceValue)?risposta.periodo:null;

  const totali={};
  let totaliScartati=0;
  for(const chiave of CHIAVI_TOTALI){
    const letto=risposta.totali[chiave];
    if(!letto){totali[chiave]=null;continue;}
    if(!cita(righe,letto.sourceValue)){totali[chiave]=null;totaliScartati+=1;continue;}
    totali[chiave]={...letto,numero:numero(letto.sourceValue)};
  }

  const voci=[];
  const viste=new Set();
  let scartate=0;
  for(const voce of risposta.voci){
    /* La riga sola: dicitura e importo devono stare insieme, com'erano. */
    if(!cita(righe,voce.sourceLabel,voce.sourceAmount)){scartate+=1;continue;}
    /* Stessa dicitura e stesso importo due volte è una voce raddoppiata: la
       somma la farebbe due volte, e la somma è nostra. */
    const impronta=`${voce.sourceLabel}\u0000${voce.sourceAmount||''}`;
    if(viste.has(impronta)){scartate+=1;continue;}
    viste.add(impronta);
    voci.push({...voce,numero:numero(voce.sourceAmount)});
  }

  return{periodo,totali,voci,
    guardie:{ricevute:risposta.voci.length,scartate,
      dropped_bucket:fascia(scartate,risposta.voci.length),totaliScartati}};
}

/* ------------------------------------------------------------
   Il conto.
   Tre confronti, tutti nostri. Il modello non somma mai.
   ------------------------------------------------------------ */
function riconcilia(totali,voci){
  const sommaCompetenze=arrotonda(voci
    .filter(voce=>voce.category==='competenza'&&voce.numero!==null)
    .reduce((totale,voce)=>totale+Math.abs(voce.numero),0));
  const sommaTrattenute=arrotonda(voci
    .filter(voce=>CATEGORIE_IN_USCITA.includes(voce.category)&&voce.numero!==null)
    .reduce((totale,voce)=>totale+Math.abs(voce.numero),0));

  const dichiarato=chiave=>(totali[chiave]&&totali[chiave].numero!==null?totali[chiave].numero:null);
  const competenze=dichiarato('competenze');
  const trattenute=dichiarato('trattenute');
  const netto=dichiarato('netto');

  const scostamento=(valore,sommato)=>valore===null?null:arrotonda(valore-sommato);

  const calcolabile=competenze!==null&&trattenute!==null&&netto!==null;
  const differenza=calcolabile?arrotonda(competenze-trattenute-netto):null;
  const torna=calcolabile&&Math.abs(differenza)<=LIMITI.tolleranzaEuro;

  return{
    stato:!calcolabile?'non_calcolabile':(torna?'torna':'non_torna'),
    competenze:{dichiarato:competenze,sommato:sommaCompetenze,scostamento:scostamento(competenze,sommaCompetenze)},
    trattenute:{dichiarato:trattenute,sommato:sommaTrattenute,scostamento:scostamento(trattenute,sommaTrattenute)},
    netto:{dichiarato:netto,calcolato:calcolabile?arrotonda(competenze-trattenute):null},
    differenza,
  };
}

/* ------------------------------------------------------------
   Cose da verificare.
   Al massimo tre, fondate su quello che abbiamo estratto, in ordine di
   importanza. Copy prudente: il cedolino non è mai «sbagliato», al massimo
   vale la pena controllarlo.
   ------------------------------------------------------------ */
/* `useGrouping:'always'`: la regola italiana non raggruppa sotto le cinque
   cifre, ma un cedolino scrive `2.435,17` e qui si parla proprio di quello. */
const FORMATO_EURO=new Intl.NumberFormat('it-IT',
  {minimumFractionDigits:2,maximumFractionDigits:2,useGrouping:'always'});
const euro=valore=>`${FORMATO_EURO.format(Math.abs(valore))} €`;

function verifiche(conto,voci,contoGuardie){
  const trovate=[];
  const oltre=valore=>valore!==null&&Math.abs(valore)>LIMITI.tolleranzaEuro;

  if(conto.stato==='non_torna')
    trovate.push({titolo:'Competenze meno trattenute non danno il netto dichiarato',
      dettaglio:`Dai totali che abbiamo letto restano ${euro(conto.differenza)} di differenza. `+
        'Può dipendere da una voce che non abbiamo attribuito, da un arrotondamento o da un conguaglio: potrebbe valere la pena verificarlo con chi fa le paghe.'});

  if(oltre(conto.competenze.scostamento))
    trovate.push({titolo:'Le competenze che abbiamo riconosciuto non arrivano al totale',
      dettaglio:`Fra la somma delle voci in entrata e il totale competenze scritto sul cedolino ballano ${euro(conto.competenze.scostamento)}. `+
        'Di solito vuol dire che qualche riga non è stata riconosciuta, non che manchino dei soldi.'});

  if(oltre(conto.trattenute.scostamento))
    trovate.push({titolo:'Le trattenute che abbiamo riconosciuto non arrivano al totale',
      dettaglio:`Fra la somma di trattenute, contributi e imposte e il totale scritto sul cedolino ballano ${euro(conto.trattenute.scostamento)}. `+
        'Anche qui la spiegazione più probabile è una riga che non abbiamo classificato.'});

  const sconosciute=voci.filter(voce=>voce.category==='sconosciuta').length;
  if(sconosciute)
    trovate.push({titolo:sconosciute===1?'Una voce è rimasta senza spiegazione':`${sconosciute} voci sono rimaste senza spiegazione`,
      dettaglio:'Le trovi più sotto marcate come sconosciute, con la dicitura originale. Se pesano sul netto, potrebbe valere la pena chiedere che cosa sono.'});

  if(conto.stato==='non_calcolabile')
    trovate.push({titolo:'Non abbiamo individuato tutti i totali',
      dettaglio:'Senza totale competenze, totale trattenute e netto letti dal documento non possiamo rifare il conto. Non li stimiamo: quello che non abbiamo letto resta «non individuato».'});

  if(contoGuardie&&contoGuardie.scartate)
    trovate.push({titolo:'Qualche voce è stata scartata prima di arrivare qui',
      dettaglio:'Mostriamo solo le voci la cui dicitura e il cui importo compaiono alla lettera nel testo che hai inviato. Quelle che non superano il controllo non te le facciamo vedere, nemmeno con una confidenza bassa.'});

  return trovate.slice(0,LIMITI.verificheMassime);
}

/* ------------------------------------------------------------
   Il passaggio unico: da risposta del modello ad analisi renderizzabile.
   `grezzo` è quello che il modello ha prodotto; `testo` è quello che abbiamo
   mandato. Se qualcosa non torna esce un codice, mai un pezzo di documento.
   ------------------------------------------------------------ */

/* Il modello a volte incornicia il JSON in un blocco di codice. Togliamo la
   cornice e basta: nessun tentativo di riparare un JSON rotto, perché una
   risposta che non è JSON è una risposta non conforme. */
function jsonDaTesto(grezzo){
  if(typeof grezzo!=='string')return null;
  let corpo=grezzo.trim();
  const recinto=corpo.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if(recinto)corpo=recinto[1].trim();
  try{
    const valore=JSON.parse(corpo);
    return valore&&typeof valore==='object'?valore:null;
  }catch(_){return null;}
}

function analizza(grezzo,testo){
  const oggetto=typeof grezzo==='string'?jsonDaTesto(grezzo):grezzo;
  if(!oggetto)return{ok:false,codice:CODICI.RISPOSTA_NON_CONFORME};

  const forma=validaRisposta(oggetto);
  if(!forma.ok)return forma;

  const passate=guardie(forma.risposta,testo);
  if(!passate.voci.length)return{ok:false,codice:CODICI.NESSUNA_VOCE};

  const conto=riconcilia(passate.totali,passate.voci);
  return{ok:true,analisi:{
    periodo:passate.periodo,
    totali:passate.totali,
    voci:passate.voci,
    conto,
    verifiche:verifiche(conto,passate.voci,passate.guardie),
    guardie:passate.guardie,
  }};
}

module.exports={CATEGORIE,EFFETTI,CONFIDENZE,CATEGORIE_IN_USCITA,CODICI,LIMITI,CHIAVI_TOTALI,
  numero,righeDi,cita,rigaCheCita,fascia,taglia,
  validaRisposta,guardie,riconcilia,verifiche,jsonDaTesto,analizza};
