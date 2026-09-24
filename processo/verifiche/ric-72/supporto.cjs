const crypto=require('node:crypto');
const C=require('../../../server/busta-paga-contratto');
const {creaServizio}=require('../../../server/busta-paga-acquisto');
const TESTO=`CEDOLINO SINTETICO DIMOSTRATIVO - nessuna persona reale
Periodo SETTEMBRE 2026
Retribuzione ordinaria 2000,00
Superminimo 300,00
Contributi INPS 211,33
IRPEF 388,67
Totale competenze 2300,00
Totale trattenute 600,00
Netto del mese 1700,00
Documento costruito per verificare il percorso tecnico, non la correttezza fiscale.`;
const voce=(sourceLabel,sourceAmount,category,effect)=>({sourceLabel,sourceAmount,category,effect,
  plainExplanation:'Spiegazione sintetica di '+sourceLabel,confidence:'alta',sourceReference:'pagina 1',warnings:[]});
const GREZZO={periodo:{sourceValue:'SETTEMBRE 2026',sourceReference:'pagina 1'},
  totali:Object.fromEntries([['competenze','2300,00'],['trattenute','600,00'],['netto','1700,00']].map(([k,v])=>[k,{sourceValue:v,sourceReference:'pagina 1'}])),
  voci:[voce('Retribuzione ordinaria','2000,00','competenza','aumenta_il_lordo'),
    voce('Superminimo','300,00','competenza','aumenta_il_lordo'),
    voce('Contributi INPS','211,33','contributo','riduce_il_netto'),voce('IRPEF','388,67','imposta','riduce_il_netto')]};
const REPORT={...C.analizza(GREZZO,TESTO),motore:{modello:'fixture dichiarata',regione:'eu'}};
function memoria(){
  const righe=new Map(),code=new Map(),contatori=new Map();
  return{righe,contatori,
    async transazione(id,fn){
      const prima=code.get(id)||Promise.resolve();let rilascia;
      const attuale=new Promise(r=>rilascia=r);code.set(id,attuale);
      await prima;
      try{
        let o=structuredClone(righe.get(id)||null);
        const risultato=await fn(o,nuovo=>o=nuovo);
        if(o)righe.set(id,structuredClone(o));
        return risultato;
      }finally{rilascia();if(code.get(id)===attuale)code.delete(id);}
    },
    async consuma(k,max,scadenza){const n=(contatori.get(k)?.n||0)+1;contatori.set(k,{n,scadenza});return n<=max;},
    async pulisci(t){for(const [k,o] of righe){if(o.eliminaIl<=t)righe.delete(k);
      else if(o.scadenza<=t){delete o.cifrato;o.stato='scaduto';}}
      for(const [k,v] of contatori)if(v.scadenza<=t)contatori.delete(k);
    }
  };
}
function scenario(opzioni={}){
  let ora=Date.now(),chiamate=0,creazioni=0;
  const archivio=opzioni.archivio||memoria(),sessioni=new Map(),chiavi=new Map();
  const stripe={prices:{retrieve:async()=>({id:'price_test',active:true,type:'one_time',livemode:false,unit_amount:100,currency:'eur'})},
    checkout:{sessions:{
      async create(p,{idempotencyKey:k}){
        if(chiavi.has(k))return structuredClone(sessioni.get(chiavi.get(k)));
        creazioni++;
        const id='cs_test_'+crypto.randomBytes(8).toString('hex');
        const s={id,url:'https://checkout.stripe.com/c/pay/'+id,mode:p.mode,status:'open',payment_status:'unpaid',
          livemode:false,amount_total:100,currency:'eur',metadata:p.metadata,client_reference_id:p.client_reference_id,
          payment_intent:'pi_test',expires_at:p.expires_at};
        sessioni.set(id,s);chiavi.set(k,id);return structuredClone(s);
      },
      async retrieve(id){return structuredClone(sessioni.get(id));},
      async expire(id){sessioni.get(id).status='expired';return structuredClone(sessioni.get(id));}
    }}};
  const ambiente={BUSTA_PAGA_CHIAVE_REPORT:'ab'.repeat(32),STRIPE_PRICE_ID:'price_test',BUSTA_PAGA_ORIGINE:'https://esempio.test',...opzioni.ambiente};
  const analizza=async(...args)=>{chiamate++;return opzioni.analizza?opzioni.analizza(...args):structuredClone(REPORT);};
  const servizio=creaServizio({archivio,stripe,ambiente,adesso:()=>ora,analizza});
  const token=crypto.randomBytes(32).toString('hex');
  return{servizio,archivio,stripe,sessioni,token,ambiente,analizza,
    get chiamate(){return chiamate;},get creazioni(){return creazioni;},
    avanza:ms=>{ora+=ms;},
    paga(){const s=[...sessioni.values()].at(-1);s.status='complete';s.payment_status='paid';return s;},
    crea:()=>servizio.crea(token,TESTO,true,'ip-sintetico')};
}
module.exports={scenario,memoria,TESTO,REPORT,GREZZO};
