/* ============================================================
   NUCLEO FAMILIARE — il codec, e nient'altro.

   Stava dentro index.html finché una pagina sola scriveva
   familiari in un URL. Da quando anche il confronto ne scrive due,
   la scelta è fra due copie che possono divergere in silenzio e un
   file di venti righe: vince il file. Qui non c'è DOM e non c'è
   fisco — solo la traduzione fra la lista di familiari e la
   stringa che entra in un link.

   Script classico come il motore, perché deve caricarsi anche da
   file://, e la stessa riga gira in Node per i test.
   ============================================================ */
const TIPO_LETTERA={coniuge:'c',figlio:'f',ascendente:'a'};
const LETTERA_TIPO={c:'coniuge',f:'figlio',a:'ascendente'};
const NOME_FAMILIARE={coniuge:'Coniuge',figlio:'Figlio',ascendente:'Ascendente convivente'};
const MAX_FAMILIARI=12;
/* `d` è la disabilità accertata: entra nell'URL come tutto il resto,
   perché un link deve poter ricostruire lo stesso identico calcolo. */
const serializzaNucleo=nucleo=>(nucleo||[]).map(f=>TIPO_LETTERA[f.tipo]+
  (f.eta===null||f.eta===undefined?'':f.eta)+(f.disabilita?'d':'')+
  (f.reddito>0?'r'+f.reddito:'')).join('.');
function deserializzaNucleo(testo){
  let coniugi=0;
  return String(testo||'').split('.').map(t=>{
    const m=/^([cfa])(\d{1,3})?(d)?(?:r(\d{1,7}))?$/.exec(t);
    if(!m)return null;
    const tipo=LETTERA_TIPO[m[1]];
    if(tipo==='coniuge'&&++coniugi>1)return null;   // l'art. 12 ne conosce uno solo
    return{tipo,eta:m[2]===undefined?null:Number(m[2]),
      disabilita:m[3]!==undefined,reddito:m[4]?Number(m[4]):0};
  }).filter(Boolean).slice(0,MAX_FAMILIARI);
}
/* «Copia A in B» deve poter modificare B senza toccare A: una copia
   per valore dei familiari, non la stessa lista con due nomi. */
const copiaNucleo=nucleo=>(nucleo||[]).map(f=>({tipo:f.tipo,eta:f.eta,
  disabilita:!!f.disabilita,reddito:f.reddito||0}));

if(typeof module!=='undefined'&&module.exports)module.exports={
  TIPO_LETTERA,LETTERA_TIPO,NOME_FAMILIARE,MAX_FAMILIARI,
  serializzaNucleo,deserializzaNucleo,copiaNucleo};
