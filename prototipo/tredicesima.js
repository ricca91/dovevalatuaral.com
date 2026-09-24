/* ============================================================
   TREDICESIMA — la trattenuta di dicembre sulla sola mensilità
   aggiuntiva. Regole 2026, lavoro dipendente privato.

   Non carica motore.js: nel browser il motore si porta dietro
   4 MB di addizionali che qui non servono (sulla tredicesima non
   si trattengono). Le poche costanti stanno qui sotto e
   tredicesima.test.js verifica che coincidano con K del motore:
   se una cambia là e non qui, il test si rompe.

   Qui dentro escono NUMERI (voci). Le righe le compone la pagina.
   ============================================================ */
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.TREDICESIMA=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  /* IMPALCATURA — virgola fissa su BigInt (scala 1e8), come nel motore. */
  const SC=8n,S=10n**8n,CENT=10n**6n;
  function dec(x){const s=String(x).trim();const neg=s.startsWith('-');
    const[i,f='']=(neg?s.slice(1):s).split('.');
    const frac=(f+'0'.repeat(Number(SC))).slice(0,Number(SC));
    const v=BigInt(i||'0')*S+BigInt(frac||'0');return neg?-v:v;}
  const mul=(a,b)=>(a*b)/S;
  const div=(a,b)=>(a*S)/b;
  const min=(a,b)=>a<b?a:b;
  const positivo=a=>a>0n?a:0n;
  const toNumber=a=>Number(a)/1e8;
  const arrotondaCentesimi=a=>{const neg=a<0n,x=neg?-a:a;const q=x/CENT,r=x%CENT;
    const y=(r*2n>=CENT?q+1n:q)*CENT;return neg?-y:y;};

  /* COSTANTI — stessi valori di K in motore.js (verificato dai test). */
  const K={
    contributi:{
      aliquotaIvs:dec('0.0919'),          // INPS circ. 101/2024
      massimale:dec('122295'),            // INPS circ. 6/2026
      primaFascia:dec('56224'),           // INPS circ. 6/2026
      aliquotaAggiuntivo:dec('0.01'),
      /* La soglia mensile la fissa la circolare, arrotondata: non è
         56.224 / 12 = 4.685,33. */
      primaFasciaMensile:dec('4685'),     // INPS circ. 6/2026
    },
    irpef:{                               // L. 199/2025, art. 1 c. 3
      scaglioni:[[dec('28000'),dec('0.23')],[dec('50000'),dec('0.33')],[null,dec('0.43')]],
    },
    sommaNonImponibile:{                  // L. 207/2024, art. 1 c. 4-5
      aliquote:[[dec('8500'),dec('0.071')],[dec('15000'),dec('0.053')],[dec('20000'),dec('0.048')]],
    },
  };
  const MESI_ANNO=dec('12');
  /* In modalità "lordo mensile" non conosciamo le mensilità: la
     stima dell'anno usa 13, e la pagina lo dichiara. */
  const MENSILITA_ANNUE_STIMA=dec('13');

  /* PROPOSTA, NON LEGGE. Ipotesi riportata da Sky TG24 il
     28/08/2026 per la Legge di Bilancio 2027: sostitutiva al 15%
     fino a 15.000 € di reddito. Da aggiornare quando c'è un testo. */
  const PROPOSTA_DETASSATA={aliquota:dec('0.15'),soglia:dec('15000')};

  const FONTI={
    lorda:'Prassi dei CCNL: una mensilità in più, maturata in ratei per i mesi lavorati',
    inps:'INPS, circolare 101/2024',
    aggiuntivo:'INPS, circolare 6/2026',
    irpef:'D.Lgs. 33/2025, art. 33 c. 3 lett. b; Agenzia delle Entrate, circolare 15/2007',
    cuneo:'L. 207/2024, art. 1 c. 4-5; Agenzia delle Entrate, circolare 4/2025',
  };

  /* Contributi e imponibile dell'anno, come imponibile() del
     motore: servono solo per il bonus cuneo e per la proposta. */
  function imponibileAnnuo(retribuzioneAnnua){
    const base=min(retribuzioneAnnua,K.contributi.massimale);
    const ivs=arrotondaCentesimi(mul(base,K.contributi.aliquotaIvs));
    const aggiuntivo=arrotondaCentesimi(mul(positivo(base-K.contributi.primaFascia),K.contributi.aliquotaAggiuntivo));
    return retribuzioneAnnua-ivs-aggiuntivo;
  }

  /* Gli scaglioni annui ragguagliati a mese, applicati alla sola
     tredicesima. Ogni fascia è arrotondata al centesimo: la somma
     delle fasce mostrate È l'IRPEF trattenuta. */
  function irpefPerFasce(base){
    const fasce=[];let precedente=0n;
    for(const[tettoAnnuo,aliquota]of K.irpef.scaglioni){
      const tetto=tettoAnnuo===null?null:div(tettoAnnuo,MESI_ANNO);
      const cima=tetto===null?base:min(base,tetto);
      if(cima>precedente)fasce.push({da:precedente,a:tetto,aliquota,base:cima-precedente,
        importo:arrotondaCentesimi(mul(cima-precedente,aliquota))});
      if(tetto===null||base<=tetto)break;
      precedente=tetto;
    }
    return fasce;
  }

  /* Circ. AdE 4/2025: se il bonus spetta lo decide il reddito
     dell'anno (fino a 20.000 €); la percentuale si sceglie sul
     reddito rapportato all'anno intero. Sopra 15.000 € di reddito
     teorico vale l'ultima percentuale. */
  function aliquotaCuneo(imponibileAnno,imponibileTeorico){
    const tabella=K.sommaNonImponibile.aliquote;
    if(imponibileAnno>tabella[tabella.length-1][0])return null;
    const riga=tabella.find(([tetto])=>imponibileTeorico<=tetto)??tabella[tabella.length-1];
    return riga[1];
  }

  function calcolaVoci({mensile,mesi,imponibileStimato,imponibileTeorico}){
    const lorda=arrotondaCentesimi(div(mul(mensile,dec(mesi)),MESI_ANNO));
    const inps=arrotondaCentesimi(mul(lorda,K.contributi.aliquotaIvs));
    /* Mensilizzazione: a dicembre tredicesima e stipendio fanno un
       mese solo. Conta la quota di eccedenza dovuta alla tredicesima. */
    const soglia=K.contributi.primaFasciaMensile;
    const eccedenza=positivo(mensile+lorda-soglia)-positivo(mensile-soglia);
    const aggiuntivo=arrotondaCentesimi(mul(eccedenza,K.contributi.aliquotaAggiuntivo));
    const baseIrpef=lorda-inps-aggiuntivo;
    const fasce=irpefPerFasce(baseIrpef);
    const irpef=fasce.reduce((t,f)=>t+f.importo,0n);
    const aliquotaBonus=aliquotaCuneo(imponibileStimato,imponibileTeorico);
    const cuneo=aliquotaBonus===null?0n:arrotondaCentesimi(mul(baseIrpef,aliquotaBonus));
    const netta=lorda-inps-aggiuntivo-irpef+cuneo;
    const proposta=imponibileStimato<=PROPOSTA_DETASSATA.soglia;
    const risparmio=proposta?positivo(irpef-arrotondaCentesimi(mul(baseIrpef,PROPOSTA_DETASSATA.aliquota))):0n;
    return{lorda,inps,aggiuntivo,eccedenza,baseIrpef,fasce,irpef,aliquotaBonus,cuneo,netta,
      detassata:{applicabile:proposta,risparmio}};
  }

  /* Riconciliazione: le voci mostrate devono ricostruire la netta
     al centesimo. È una guardia, non una prova di correttezza. */
  function riconcilia(voci,netta){
    const totale=voci.reduce((t,v)=>t+(v.id==='lorda'||v.id==='cuneo'?dec(v.importo):-dec(v.importo)),0n);
    if(totale!==netta)throw new Error(`Riconciliazione fallita: ${toNumber(totale)} ≠ ${toNumber(netta)}`);
  }

  const n=toNumber;
  function presenta(v,{mensile,mesi,imponibileStimato}){
    const voci=[
      {id:'lorda',importo:n(v.lorda),base:n(mensile),mesi,fonte:FONTI.lorda},
      {id:'inps',importo:n(v.inps),base:n(v.lorda),aliquota:n(K.contributi.aliquotaIvs),fonte:FONTI.inps},
    ];
    if(v.aggiuntivo>0n)voci.push({id:'aggiuntivo',importo:n(v.aggiuntivo),base:n(v.eccedenza),
      soglia:n(K.contributi.primaFasciaMensile),aliquota:n(K.contributi.aliquotaAggiuntivo),fonte:FONTI.aggiuntivo});
    voci.push({id:'irpef',importo:n(v.irpef),base:n(v.baseIrpef),fonte:FONTI.irpef,
      fasce:v.fasce.map(f=>({da:n(f.da),a:f.a===null?null:n(f.a),aliquota:n(f.aliquota),base:n(f.base),importo:n(f.importo)}))});
    if(v.cuneo>0n)voci.push({id:'cuneo',importo:n(v.cuneo),base:n(v.baseIrpef),aliquota:n(v.aliquotaBonus),fonte:FONTI.cuneo});
    riconcilia(voci,v.netta);
    return{voci,lorda:n(v.lorda),netta:n(v.netta),imponibileStimato:n(imponibileStimato),
      detassata:{applicabile:v.detassata.applicabile,risparmio:n(v.detassata.risparmio),
        soglia:n(PROPOSTA_DETASSATA.soglia),aliquota:n(PROPOSTA_DETASSATA.aliquota)}};
  }

  /* Importi come stringhe decimali con il punto ("30000", "2307.69"). */
  function calcolaDaRal({ral,mensilita=13,mesi=12}){
    const R=dec(ral);
    const mensile=div(R,dec(mensilita));
    const ctx={mensile,mesi,imponibileStimato:imponibileAnnuo(div(mul(R,dec(mesi)),MESI_ANNO)),
      imponibileTeorico:imponibileAnnuo(R)};
    return{modalita:'ral',...presenta(calcolaVoci(ctx),ctx)};
  }
  function calcolaDaLordo({lordo,mesi=12}){
    const mensile=dec(lordo),annua=mul(mensile,MENSILITA_ANNUE_STIMA);
    const ctx={mensile,mesi,imponibileStimato:imponibileAnnuo(div(mul(annua,dec(mesi)),MESI_ANNO)),
      imponibileTeorico:imponibileAnnuo(annua)};
    return{modalita:'lordo',...presenta(calcolaVoci(ctx),ctx)};
  }

  /* ---------- l'input come lo scrive una persona ---------- */
  const LIMITI=Object.freeze({lordo:{min:'100',max:'9000'},ral:{min:'1000',max:'120000'}});
  const MENSILITA=Object.freeze([13,14]);
  /* Come eur() del motore: il punto delle migliaia anche a 4 cifre,
     che Intl it-IT invece omette ("3076,92"). */
  const grp=i=>i.replace(/\B(?=(\d{3})+(?!\d))/g,'.');
  function formattaEuro(n){const neg=n<0,[i,d]=Math.abs(n).toFixed(2).split('.');return`${neg?'−':''}${grp(i)},${d} €`;}
  const euro=s=>grp(String(Number(s)));

  /* "30.000,50" → "30000.50". null se vuoto, undefined se illeggibile. */
  function leggiImporto(raw){
    let s=String(raw??'').replace(/[\s €]/g,'');
    if(!s)return null;
    if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');
    else if(/^\d{1,3}(\.\d{3})+$/.test(s))s=s.replace(/\./g,'');
    return /^\d+(\.\d{1,2})?$/.test(s)?s:undefined;
  }

  function normalizza({modalita,importo,mensilita='13',mesi='12'}){
    if(!(modalita in LIMITI))return{errore:{campo:'modalita',messaggio:'Scegli da cosa partire.'}};
    const nome=modalita==='lordo'?'il lordo mensile':'la RAL';
    const valore=leggiImporto(importo);
    if(valore===null)return{errore:{campo:'importo',messaggio:`Inserisci ${nome}.`}};
    if(valore===undefined)return{errore:{campo:'importo',messaggio:'Usa solo cifre, con la virgola per i centesimi.'}};
    const{min:da,max:a}=LIMITI[modalita];
    if(dec(valore)<dec(da)||dec(valore)>dec(a))
      return{errore:{campo:'importo',messaggio:`Il calcolatore copre ${nome} da ${euro(da)} a ${euro(a)} €.`}};
    const m=Number(String(mesi).trim()||NaN);
    if(!Number.isInteger(m)||m<1||m>12)return{errore:{campo:'mesi',messaggio:'I mesi lavorati vanno da 1 a 12.'}};
    if(modalita==='lordo')return{modalita,lordo:valore,mesi:m};
    const k=Number(mensilita);
    if(!MENSILITA.includes(k))return{errore:{campo:'mensilita',messaggio:'Le mensilità possono essere 13 o 14.'}};
    return{modalita,ral:valore,mensilita:k,mesi:m};
  }

  function calcola(input){return input.modalita==='lordo'?calcolaDaLordo(input):calcolaDaRal(input);}

  function daQuery(search){
    const p=new URLSearchParams(search);
    if(p.has('lordo'))return{modalita:'lordo',importo:p.get('lordo'),mesi:p.get('mesi')??'12'};
    if(p.has('ral'))return{modalita:'ral',importo:p.get('ral'),mensilita:p.get('mensilita')??'13',mesi:p.get('mesi')??'12'};
    return null;
  }

  return{calcolaDaRal,calcolaDaLordo,normalizza,calcola,daQuery,formattaEuro,LIMITI,K,PROPOSTA_DETASSATA,FONTI,imponibileAnnuo,dec,toNumber};
});
