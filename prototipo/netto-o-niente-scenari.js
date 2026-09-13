/* NETTO O NIENTE: input deterministici, mai formule fiscali.
 * Contratto del PRNG e ordine delle estrazioni in netto-o-niente.md. */
(function(root,factory){
  const node=typeof module!=='undefined'&&module.exports;
  const api=factory(node?require('./compara.js'):COMPARA,
    node?require('./geografia.js'):GEOGRAFIA_ITALIA);
  if(node)module.exports=api;else root.NON_SCENARI=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(C,G){
  'use strict';
  const VERSIONE='non-v1-2026-01';
  const DOMICILI=Object.freeze(['F205','H501','D612','L840','L781']);
  const LIVELLI=Object.freeze([
    {nome:'Riscaldamento',min:150000,max:Infinity},
    {nome:'Occhio ai costi',min:60000,max:300000},
    {nome:'Leggi tra le righe',min:36000,max:180000},
    {nome:'Sfida fiscale',min:24000,max:120000},
    {nome:'Fuoriclasse',min:24000,max:120000},
  ].map(Object.freeze));
  const livello=indice=>indice<=3?0:indice<=7?1:indice<=12?2:indice<=20?3:4;
  const uint32=n=>Number.isInteger(n)&&n>=0&&n<=4294967295;
  function fnv1a(s){
    let h=2166136261;
    for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619)>>>0;
    return h;
  }
  function mulberry32(seed){
    let a=seed>>>0;
    return()=>{
      a=(a+0x6D2B79F5)>>>0;
      let t=Math.imul(a^(a>>>15),1|a);
      t^=t+Math.imul(t^(t>>>7),61|t);
      return ((t^(t>>>14))>>>0)/4294967296;
    };
  }
  function valutaConfronto(A,B){
    try{
      const confronto=C.confronta(A,B);
      if(!confronto.ok)return{ok:false,errore:'calcolo'};
      const e=confronto.esito;
      for(const lato of ['A','B']){
        const r=e.risultati[lato];
        if(r.riconciliazione.verificata!==true||e.avvisi[lato].length)
          return{ok:false,errore:'inaffidabile'};
        if(![r.input.ral,r.kpi.nettoInBusta,r.kpi.totaleContributi,
          r.kpi.totaleImposte,r.kpi.benefitSpendibili,r.integrazioni]
          .every(n=>Number.isFinite(n)&&Number.isSafeInteger(C.inCentesimi(n))))
          return{ok:false,errore:'importi'};
        const catena=catenaContabile(r);
        if(!Object.values(catena).every(Number.isSafeInteger)||
          catena.ral-catena.contributi-catena.imposte+catena.integrazioni!==catena.netto)
          return{ok:false,errore:'ricostruzione'};
      }
      if(!e.righe.filter(r=>r.unita==='euro').every(r=>
        [r.a,r.b,r.delta].every(n=>n===null||Number.isSafeInteger(n))))
        return{ok:false,errore:'importi'};
      const r=e.righe.find(r=>r.chiave==='dopoCosti');
      if(!r||r.a<=0||r.b<=0)return{ok:false,errore:'disponibile'};
      return{ok:true,esito:e,vincitore:r.a>r.b?'A':r.b>r.a?'B':null,deltaCentesimi:r.delta};
    }catch(_){return{ok:false,errore:'calcolo'};}
  }
  function catenaContabile(r){
    // Il netto è la somma delle Voci arrotondate. Il KPI aggregato imposte
    // arrotonda invece l'IRPEF netta: può differire di 1 centesimo, già a
    // RAL 24.000/38.000. La catena usa le voci, senza cambiare il motore.
    const somma=tipi=>r.voci.filter(v=>v.somma==='nettoLavoratore'&&tipi.includes(v.tipo))
      .reduce((n,v)=>n+C.inCentesimi(v.importo),0);
    return{ral:C.inCentesimi(r.input.ral),contributi:-somma(['contributo']),
      imposte:-somma(['imposta','detrazione']),integrazioni:somma(['integrazione']),
      netto:C.inCentesimi(r.kpi.nettoInBusta)};
  }
  // Identità senza hash: nessuna collisione, e orientamento irrilevante.
  function identita(A,B){
    const firma=o=>JSON.stringify(Object.keys(o).sort().map(k=>[k,o[k]]));
    return [firma(A),firma(B)].sort().join('|');
  }
  // Tuple solo di INPUT: RAL, mensilità, trasporto/mese, altre/mese,
  // welfare/anno, codice comune, fringe/anno. Ricalcolate sempre.
  const FALLBACK=[
    [[[56500,13,0,0,0,'F205',0],[51000,13,0,0,0,'F205',0]],[[49000,13,0,0,0,'F205',0],[43500,13,0,0,0,'F205',0]],[[60500,13,0,0,0,'F205',0],[51000,13,0,0,0,'F205',0]],[[57500,13,0,0,0,'F205',0],[49000,13,0,0,0,'F205',0]],[[56000,13,0,0,0,'F205',0],[50000,13,0,0,0,'F205',0]],[[39500,13,0,0,0,'F205',0],[44000,13,0,0,0,'F205',0]],[[27000,13,0,0,0,'F205',0],[33000,13,0,0,0,'F205',0]],[[65000,13,0,0,0,'F205',0],[59500,13,0,0,0,'F205',0]]],
    [[[58500,13,300,0,0,'F205',0],[57000,13,50,0,0,'F205',0]],[[54000,13,350,0,0,'F205',0],[53000,14,150,0,0,'F205',0]],[[34000,13,425,0,0,'F205',0],[29500,14,175,0,0,'F205',0]],[[44000,14,425,0,0,'F205',0],[39500,14,100,0,0,'F205',0]],[[61500,14,200,0,0,'F205',0],[58500,13,275,0,0,'F205',0]],[[55500,14,175,0,0,'F205',0],[53500,14,225,0,0,'F205',0]],[[37500,14,200,0,0,'F205',0],[41500,13,125,0,0,'F205',0]],[[34500,13,250,0,0,'F205',0],[33000,14,400,0,0,'F205',0]]],
    [[[26000,13,200,50,500,'F205',0],[30500,13,450,125,2000,'F205',0]],[[37000,14,450,0,1500,'F205',0],[32500,13,100,50,500,'F205',0]],[[39500,13,25,0,1500,'F205',0],[43500,14,175,25,500,'F205',0]],[[36500,14,150,100,2000,'F205',0],[34000,14,50,75,2500,'F205',0]],[[38000,14,325,75,2000,'F205',0],[42000,13,300,125,500,'F205',0]],[[46500,13,175,125,1000,'F205',0],[47500,13,125,100,500,'F205',0]],[[54500,14,225,50,500,'F205',0],[50500,14,75,125,500,'F205',0]],[[28500,13,225,75,500,'F205',0],[27500,14,250,50,0,'F205',0]]],
    [[[49000,13,25,100,0,'F205',0],[54000,14,225,150,2500,'L840',0]],[[31000,13,350,0,1000,'L840',0],[30000,13,100,125,1000,'L840',0]],[[31000,13,300,150,2000,'L840',0],[30000,14,275,25,2000,'H501',0]],[[53500,14,425,0,2500,'D612',0],[50500,14,75,125,500,'H501',0]],[[33000,14,275,100,2500,'H501',0],[31500,14,350,75,500,'D612',0]],[[55500,14,50,50,2500,'L781',0],[57500,14,25,100,2500,'L781',0]],[[56000,13,125,25,0,'L840',0],[57000,14,75,0,2000,'D612',0]],[[54000,14,325,25,1500,'L840',0],[50000,13,225,25,1000,'L781',0]]],
    [[[41000,14,300,25,2000,'H501',2000],[38500,14,350,25,500,'D612',500]],[[53500,14,300,50,1000,'L840',0],[55000,13,175,125,2000,'H501',2000]],[[49500,13,375,50,1000,'L781',0],[45000,14,125,25,0,'H501',1000]],[[59500,13,400,75,2500,'D612',2000],[55500,13,275,0,0,'L840',1500]],[[50500,13,150,100,500,'F205',0],[49000,14,225,25,2500,'F205',1000]],[[27500,13,225,150,1500,'H501',500],[24500,13,75,150,500,'L840',2000]],[[33000,13,425,25,2500,'F205',2000],[31000,13,400,100,1000,'F205',500]],[[38500,14,175,25,1500,'L840',2000],[38000,13,150,100,500,'L781',2000]]],
  ];
  function daTupla(t){
    return{...C.offertaVuota(),ralRaw:String(t[0]),mensilitaRaw:String(t[1]),
      trasportoRaw:String(t[2]),altreSpeseRaw:String(t[3]),welfareRaw:String(t[4]),
      comune:t[5],fringeRaw:String(t[6])};
  }
  function candidato(rng,l){
    // Sempre 16 estrazioni, anche per variabili non ancora introdotte.
    const u=Array.from({length:16},()=>rng());
    const pick=(i,n)=>Math.floor(u[i]*n);
    const base=24000+500*pick(0,73);
    const diff=l===0?4000+500*pick(1,13):500+500*pick(1,10);
    const A=daTupla([base,l?13+pick(2,2):13,l?25*pick(4,19):0,
      l>=2?25*pick(6,7):0,l>=2?500*pick(8,6):0,
      l>=3?DOMICILI[pick(10,5)]:'F205',l>=4?500*pick(12,5):0]);
    const B=daTupla([base+diff,l?13+pick(3,2):13,l?25*pick(5,19):0,
      l>=2?25*pick(7,7):0,l>=2?500*pick(9,6):0,
      l>=3?DOMICILI[pick(11,5)]:'F205',l>=4?500*pick(13,5):0]);
    return{A,B};
  }
  function verificaCandidato(A,B,l,alta,precedenti){
    if(precedenti.includes(identita(A,B)))return null;
    for(const o of [A,B])G.risolvi(o.comune);
    const v=valutaConfronto(A,B);
    if(!v.ok||!v.vincitore)return null;
    const margine=Math.abs(v.deltaCentesimi);
    if(margine<LIVELLI[l].min||margine>LIVELLI[l].max)return null;
    const vinceAlta=Number((v.vincitore==='A'?A:B).ralRaw)>Number((v.vincitore==='A'?B:A).ralRaw);
    return l===0||vinceAlta===alta?v:null;
  }
  function generaConfronto({versione=VERSIONE,seed,indice,precedenti=[],forzaFallback=false}){
    if(versione!==VERSIONE||!uint32(seed)||!Number.isSafeInteger(indice)||indice<1)
      return{ok:false,errore:'parametri'};
    const l=livello(indice),recenti=precedenti.slice(-2);
    const rng=mulberry32(fnv1a(`${versione}|${seed}|${indice}`));
    const alta=rng()<0.5,scambia=rng()<0.5;
    function prova(c){
      const A=scambia?c.B:c.A,B=scambia?c.A:c.B;
      const v=verificaCandidato(A,B,l,alta,recenti);
      return v?{ok:true,A,B,id:identita(A,B),indice,livello:l,...v}:null;
    }
    try{
      for(let n=0;n<128&&!forzaFallback;n++){
        const r=prova(candidato(rng,l));
        if(r)return r;
      }
      const catalogo=FALLBACK[l],offset=fnv1a(`${versione}|${seed}|${indice}|fallback`)%catalogo.length;
      for(let n=0;n<catalogo.length;n++){
        const t=catalogo[(offset+n)%catalogo.length];
        const r=prova({A:daTupla(t[0]),B:daTupla(t[1])});
        if(r)return r;
      }
    }catch(_){/* Dataset o motore indisponibile: nessuna sconfitta. */}
    return{ok:false,errore:'generazione'};
  }
  return{VERSIONE,DOMICILI,LIVELLI,livello,uint32,fnv1a,mulberry32,valutaConfronto,catenaContabile,
    identita,generaConfronto,FALLBACK,daTupla};
});
