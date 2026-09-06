/* Netto -> RAL: adattatore inverso del motore, senza formule fiscali proprie. */
(function(root,factory){
  const inNode=typeof module!=='undefined'&&module.exports;
  const api=factory(inNode?require('./motore.js')
    :{calcola,applicaMensilita,parseRal,eur,K,toNumber});
  if(inNode)module.exports=api;else root.NETTO_RAL=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(MOTORE){
  const COMUNE='F205',MENSILITA=13,RAL_MAX=1000000,PASSO=100;
  const opzioniStandard=Object.freeze({comune:COMUNE,nucleo:[]});
  const calcolaStandard=ral=>MOTORE.calcola(String(ral),opzioniStandard);
  const centesimi=valore=>Math.round(Number(valore)*100);
  const NETTO_ANNUO_MAX_CENTESIMI=centesimi(calcolaStandard(RAL_MAX).kpi.nettoAnnuo);

  function normalizzaTarget(raw){
    const valoreNormalizzato=MOTORE.parseRal(String(raw??''));
    if(valoreNormalizzato===null)
      return{errore:'Inserisci il netto mensile che vorresti ottenere.'};
    const valore=Number(valoreNormalizzato);
    if(!Number.isFinite(valore)||valore<=0)
      return{errore:'Inserisci un importo maggiore di zero, usando solo cifre.'};
    const normalizzati=centesimi(valore);
    if(!Number.isSafeInteger(normalizzati)||!Number.isSafeInteger(normalizzati*MENSILITA))
      return{errore:'Il valore inserito non è leggibile come importo.'};
    if(normalizzati*MENSILITA>NETTO_ANNUO_MAX_CENTESIMI)
      return{errore:'Questo netto è fuori dall’intervallo coperto dal calcolatore.'};
    return{valore:normalizzati/100,centesimi:normalizzati};
  }

  function preparaRicerca(raw){
    const target=normalizzaTarget(raw);
    return target.errore?target:{targetAnnuoCentesimi:target.centesimi*MENSILITA};
  }

  function candidatoSeRaggiungeTarget(ral,targetAnnuoCentesimi){
    const annuale=calcolaStandard(ral);
    if(centesimi(annuale.kpi.nettoAnnuo)<targetAnnuoCentesimi)return null;
    const presentato=MOTORE.applicaMensilita(annuale,MENSILITA);
    return{ral,nettoAnnuo:annuale.kpi.nettoAnnuo,
      mediaMensile:presentato.kpi.mediaMensile,risultato:presentato};
  }

  function trovaRal(raw){
    const ricerca=preparaRicerca(raw);
    if(ricerca.errore)return null;
    for(let ral=PASSO;ral<=RAL_MAX;ral+=PASSO){
      const candidato=candidatoSeRaggiungeTarget(ral,ricerca.targetAnnuoCentesimi);
      if(candidato)return candidato;
    }
    return null;
  }

  function trovaRalProgressiva(raw,{dimensioneBlocco=250,cedi=()=>new Promise(r=>setTimeout(r,0))}={}){
    const ricerca=preparaRicerca(raw);
    if(ricerca.errore)return Promise.resolve({errore:ricerca.errore});
    let ral=PASSO;
    const blocco=()=>{
      const fine=Math.min(RAL_MAX,ral+(dimensioneBlocco-1)*PASSO);
      for(;ral<=fine;ral+=PASSO){
        const candidato=candidatoSeRaggiungeTarget(ral,ricerca.targetAnnuoCentesimi);
        if(candidato)return Promise.resolve(candidato);
      }
      if(ral>RAL_MAX)return Promise.resolve(null);
      return cedi().then(blocco);
    };
    return blocco();
  }

  function urlCalcolatore(ral,base='index.html'){
    const p=new URLSearchParams({ral:String(ral),m:String(MENSILITA),c:COMUNE,calc:'1'});
    return `${base}?${p}`;
  }

  return{COMUNE,MENSILITA,RAL_MAX,PASSO,normalizzaTarget,calcolaStandard,
    trovaRal,trovaRalProgressiva,urlCalcolatore};
});
