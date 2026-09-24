'use strict';

const fs=require('node:fs');
const path=require('node:path');
const {performance}=require('node:perf_hooks');
const B=require('../../../server/busta-paga.js');
const T=require('../../../server/busta-paga-tetti.js');

const cartella=__dirname;
const fixture=JSON.parse(fs.readFileSync(path.join(cartella,'fixture.json'),'utf8'));

const valore=(campo)=>campo&&campo.sourceValue||null;
const trova=(voci,label)=>voci.some(voce=>voce.sourceLabel===label);

function valuta(caso,esito,durataMs){
  if(!esito.ok)return{id:caso.id,ok:false,durataMs,codice:esito.codice};
  const analisi=esito.analisi;
  const controlli={
    periodo:valore(analisi.periodo)===caso.attesi.periodo,
    competenze:valore(analisi.totali.competenze)===caso.attesi.totali.competenze,
    trattenute:valore(analisi.totali.trattenute)===caso.attesi.totali.trattenute,
    netto:valore(analisi.totali.netto)===caso.attesi.totali.netto,
    vociRichieste:caso.attesi.voci.every(label=>trova(analisi.voci,label)),
    nessunaInvenzione:analisi.voci.every(voce=>caso.testo.split('\n').some(riga=>
      riga.includes(voce.sourceLabel)&&(!voce.sourceAmount||riga.includes(voce.sourceAmount)))),
  };
  return{
    id:caso.id,
    ok:Object.values(controlli).every(Boolean),
    durataMs,
    controlli,
    motore:esito.motore,
    qualita:analisi.qualita,
    periodo:valore(analisi.periodo),
    totali:Object.fromEntries(Object.entries(analisi.totali).map(([k,v])=>[k,valore(v)])),
    voci:analisi.voci.map(({sourceLabel,sourceAmount,category,effect,plainExplanation,confidence,warnings})=>
      ({sourceLabel,sourceAmount,category,effect,plainExplanation,confidence,warnings})),
  };
}

async function esegui(){
  if(!process.env.AI_GATEWAY_API_KEY&&!process.env.VERCEL_OIDC_TOKEN)
    throw new Error('AI_GATEWAY_API_KEY o VERCEL_OIDC_TOKEN mancante');
  const risultati=[];
  for(const caso of fixture){
    const inizio=performance.now();
    const esito=await B.analizza({testo:caso.testo},{
      tetti:T.crea({BUSTA_PAGA_ANALISI_MINUTO:'20',BUSTA_PAGA_ANALISI_GIORNO:'100'}),
      ambiente:process.env,
      chiamante:'verifica-ric-71',
    });
    risultati.push(valuta(caso,esito,Math.round(performance.now()-inizio)));
  }
  const documento={
    eseguitoIl:new Date().toISOString(),
    modello:B.MODELLO,
    regioneRichiesta:B.REGIONE_INFERENZA,
    casi:risultati,
    riepilogo:{
      superati:risultati.filter(r=>r.ok).length,
      totali:risultati.length,
      latenzaMs:{min:Math.min(...risultati.map(r=>r.durataMs)),
        max:Math.max(...risultati.map(r=>r.durataMs)),
        media:Math.round(risultati.reduce((n,r)=>n+r.durataMs,0)/risultati.length)},
    },
  };
  return documento;
}

if(require.main===module)esegui().then(documento=>{
  process.stdout.write(`${JSON.stringify(documento,null,2)}\n`);
  process.exitCode=documento.casi.every(r=>r.ok)?0:1;
}).catch(errore=>{
  console.error(errore&&errore.message||'verifica fallita');
  process.exitCode=1;
});

module.exports={esegui,valuta};
