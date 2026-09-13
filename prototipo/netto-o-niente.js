(function(root,factory){
  const node=typeof module!=='undefined'&&module.exports;
  const api=factory(node?require('./netto-o-niente-scenari.js'):NON_SCENARI,
    node?require('./compara.js'):COMPARA);
  if(node)module.exports=api;else root.NON=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(S,C){
  'use strict';
  const VERSIONE=S.VERSIONE;
  const CANONICAL='https://www.dovevalatuaral.com/netto-o-niente.html';
  const punteggioValido=n=>Number.isSafeInteger(n)&&n>=0&&String(n).length<=15;
  const errori={
    link:'Questa sfida non è leggibile. Puoi iniziare una nuova partita.',
    versione:'Questa sfida usa una versione precedente o diversa del gioco. Inizia una nuova partita con le regole attuali.',
    tecnico:'Non riusciamo a preparare il prossimo confronto. Il tuo punteggio non è perso.',
  };
  function decodificaSfida(fragment){
    if(typeof fragment!=='string'||fragment.length>512)return{ok:false,errore:'link'};
    const raw=fragment.startsWith('#')?fragment.slice(1):fragment;
    if(!raw)return{ok:true,sfida:null};
    const p=new URLSearchParams(raw);
    if([...p.keys()].some(k=>!['v','s','t'].includes(k))||
      ['v','s','t'].some(k=>p.getAll(k).length!==1))return{ok:false,errore:'link'};
    const s=p.get('s'),t=p.get('t');
    const decimale=v=>/^(0|[1-9][0-9]*)$/.test(v);
    if(!decimale(s)||!decimale(t)||!S.uint32(Number(s))||!punteggioValido(Number(t)))
      return{ok:false,errore:'link'};
    if(p.get('v')!==VERSIONE)return{ok:false,errore:'versione'};
    return{ok:true,sfida:{seed:Number(s),target:Number(t)}};
  }
  function codificaSfida({seed,target}){
    if(!S.uint32(seed)||!punteggioValido(target))throw new RangeError('Sfida non valida');
    return new URLSearchParams({v:VERSIONE,s:String(seed),t:String(target)}).toString();
  }
  function creaPartita({seed,target=null,mode=target===null?'free':'challenge'}){
    if(!S.uint32(seed)||(target!==null&&!punteggioValido(target)))throw new RangeError('Partita non valida');
    const round=S.generaConfronto({seed,indice:1});
    return{versione:VERSIONE,seed,target,mode,scelte:[],score:0,indice:1,
      precedenti:[],round,fase:round.ok?'DOMANDA':'ERRORE'};
  }
  function rispondi(stato,lato){
    if(stato.fase!=='DOMANDA'||!['A','B'].includes(lato))return stato;
    const corretta=lato===stato.round.vincitore;
    return{...stato,scelte:[...stato.scelte,lato],score:stato.score+(corretta?1:0),
      fase:corretta?'RIVELAZIONE':'FINE'};
  }
  function prossimo(stato){
    if(stato.fase!=='RIVELAZIONE')return stato;
    const indice=stato.indice+1,precedenti=[...stato.precedenti,stato.round.id].slice(-2);
    const round=S.generaConfronto({seed:stato.seed,indice,precedenti});
    // Manteniamo l'ultima rivelazione come checkpoint recuperabile.
    if(!round.ok)return{...stato,fase:'ERRORE',riprendi:'RIVELAZIONE'};
    return{...stato,indice,precedenti,round,fase:'DOMANDA'};
  }
  function salvaRun(s){
    return JSON.stringify({seed:s.seed,target:s.target,mode:s.mode,scelte:s.scelte,
      fase:s.fase==='ERRORE'?(s.riprendi||'DOMANDA'):s.fase});
  }
  function leggiRun(raw){
    try{
      const s=JSON.parse(raw);
      if(!s||!S.uint32(s.seed)||(s.target!==null&&!punteggioValido(s.target))||
        !['free','challenge','replay'].includes(s.mode)||
        (s.mode==='free')!==(s.target===null)||!Array.isArray(s.scelte)||
        s.scelte.some(c=>c!=='A'&&c!=='B')||
        !['DOMANDA','RIVELAZIONE','FINE'].includes(s.fase))return null;
      return s;
    }catch(_){return null;}
  }
  // Replay incrementale: il controller cede il thread fra blocchi. Score e
  // fase derivano dalle scelte; una sconfitta tronca qualsiasi coda iniettata.
  function* ripristinaRun(saved){
    let s=creaPartita(saved);
    for(let i=0;i<saved.scelte.length;i++){
      if(s.fase==='ERRORE'||s.fase==='FINE')return s;
      if(s.fase==='RIVELAZIONE')s=prossimo(s);
      if(s.fase==='ERRORE')return s;
      s=rispondi(s,saved.scelte[i]);
      if(i%10===9)yield{elaborate:i+1};
    }
    if(s.fase==='RIVELAZIONE'&&saved.fase==='DOMANDA')s=prossimo(s);
    return s;
  }
  function leggiRecord(raw){
    if(typeof raw!=='string'||!/^(0|[1-9][0-9]*)$/.test(raw))return null;
    const n=Number(raw);return Number.isSafeInteger(n)?n:null;
  }
  function costruisciSpiegazione(round){
    const e=round.esito,v=round.vincitore,altro=v==='A'?'B':'A';
    const riga=k=>e.righe.find(r=>r.chiave===k);
    const di=(r,l)=>l==='A'?r.a:r.b;
    const vantaggio=Math.abs(round.deltaCentesimi);
    let frase=`Con ${v} restano ${C.fmtEuro(vantaggio)} in più all'anno dopo i costi indicati.`;
    const netto=riga('netto'),costi=riga('costi');
    if(di(netto,altro)>di(netto,v)&&di(costi,altro)>di(costi,v))
      frase=`${altro} porta ${C.fmtEuro(di(netto,altro)-di(netto,v))} netti in più, ma richiede ${C.fmtEuro(di(costi,altro)-di(costi,v))} di costi aggiuntivi. ${frase}`;
    const note=[];
    if(round.A.mensilitaRaw!==round.B.mensilitaRaw)
      note.push('13 o 14 mensilità distribuiscono lo stesso netto annuo: non sono un aumento.');
    if(Number(round.A.welfareRaw)||Number(round.B.welfareRaw))
      note.push('Il welfare resta separato dal denaro in busta e non aumenta questo punteggio.');
    for(const lato of ['A','B']){
      const fringe=e.risultati[lato].voci.find(v=>v.id==='fringe');
      if(fringe&&fringe.quotaImponibile>0)
        note.push(`In ${lato}, ${C.fmtEuro(C.inCentesimi(fringe.quotaImponibile))} di fringe sono imponibili: il motore ne include l'effetto in contributi e imposte. Il valore del benefit resta separato.`);
    }
    if(round.A.comune!==round.B.comune)note.push('Il domicilio fiscale cambia le addizionali. Qui variano anche le altre condizioni indicate.');
    return{frase,note};
  }
  function testoSfida(s){
    if(s.fase!=='FINE')throw new Error('Solo una run conclusa è condivisibile');
    const url=CANONICAL+'#'+codificaSfida({seed:s.seed,target:s.score});
    const testo=s.score===0?'Mi sono fermato al primo confronto. Tu fai meglio?':s.score===1?
      'Ne ho azzeccato 1 prima di sbagliare. Tu quanti ne fai?':
      `Ne ho azzeccati ${s.score} prima di sbagliare. Tu quanti ne fai?`;
    return{url,testo:`${testo} Stessa sequenza: ${url}`};
  }
  return{VERSIONE,CANONICAL,errori,creaPartita,rispondi,prossimo,codificaSfida,
    decodificaSfida,salvaRun,leggiRun,ripristinaRun,leggiRecord,costruisciSpiegazione,
    testoSfida,valutaConfronto:S.valutaConfronto};
});
