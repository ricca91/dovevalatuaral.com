/* Contratto pubblico leggero: non carica il motore fiscale sul server social. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.NON_LINK=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSIONE='non-v1-2026-01',CANONICAL='https://www.dovevalatuaral.com';
  function valida(query){
    if(!query||Object.keys(query).sort().join(',')!=='s,t,v')return null;
    const {v,s,t}=query;
    if(v!==VERSIONE||typeof s!=='string'||typeof t!=='string'||
      !/^(0|[1-9]\d{0,9})$/.test(s)||Number(s)>4294967295||
      !/^(0|[1-9]\d{0,14})$/.test(t))return null;
    return{v,s,t};
  }
  function origine(value=CANONICAL){
    const u=new URL(value);
    if(u.username||u.password||!['https:','http:'].includes(u.protocol))throw Error('Origine non valida');
    if(['dovevalatuaral.com','www.dovevalatuaral.com'].includes(u.hostname))return CANONICAL;
    return u.origin;
  }
  function crea({versione=VERSIONE,seed,score},base=CANONICAL){
    const p=valida({v:versione,s:String(seed),t:String(score)});
    if(!p)throw new RangeError('Risultato non valido');
    const origin=origine(base),path=`/${p.v}/${p.s}/${p.t}`;
    return{...p,url:origin+'/risultato'+path,immagine:origin+'/risultato-immagine'+path+'.png',
      gioco:origin+'/netto-o-niente.html#'+new URLSearchParams(p).toString()};
  }
  return{VERSIONE,CANONICAL,valida,origine,crea};
});
