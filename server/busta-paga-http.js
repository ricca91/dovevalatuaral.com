'use strict';
const {produzione,CODICI}=require('./busta-paga-acquisto');
const tokenDa=req=>/^Bearer ([a-f0-9]{64})$/.exec(req.headers?.authorization||'')?.[1];
function intestazioni(res){
  for(const [k,v] of Object.entries({'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'private, no-store, max-age=0','CDN-Cache-Control':'no-store',
    'Vercel-CDN-Cache-Control':'no-store','Referrer-Policy':'no-referrer',
    'X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'}))res.setHeader(k,v);
}
function invia(res,status,dati){res.statusCode=status;return res.end(JSON.stringify(dati));}
async function corpo(req,massimo=100000){
  if(req.body!==undefined){
    const s=typeof req.body==='string'?req.body:JSON.stringify(req.body);
    if(Buffer.byteLength(s)>massimo)throw {codice:'TESTO_TROPPO_LUNGO'};
    return typeof req.body==='string'?JSON.parse(req.body):req.body;
  }
  const chunks=[];let n=0;
  for await(const b of req){n+=b.length;if(n>massimo)throw {codice:'TESTO_TROPPO_LUNGO'};chunks.push(b);}
  return JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}');
}
async function rispondi(req,res,dipendenze){
  intestazioni(res);
  const azione=req.query?.azione||new URL(req.url,'https://interno').searchParams.get('azione')||'analizza';
  const metodi={configurazione:'GET',analizza:'POST',stato:'GET',checkout:'POST',cancella:'DELETE'};
  if(!Object.hasOwn(metodi,azione)||req.method!==metodi[azione])return invia(res,405,{ok:false,codice:'TESTO_NON_VALIDO'});
  if(req.headers?.['sec-fetch-site']==='cross-site')return invia(res,403,{ok:false,codice:'ACCESSO_NON_VALIDO'});
  try{
    const {servizio}=dipendenze||produzione();
    let risultato;
    if(azione==='configurazione')risultato=await servizio.configurazione();
    else{
      const token=tokenDa(req);
      if(!token)throw {codice:'ACCESSO_NON_VALIDO'};
      if(azione==='analizza'){
        const b=await corpo(req);
        risultato=await servizio.crea(token,b.testo,b.consenso,
          req.headers?.['x-vercel-forwarded-for']||req.socket?.remoteAddress||'ignoto');
      }else if(azione==='stato')risultato=await servizio.stato(token);
      else if(azione==='checkout')risultato=await servizio.checkout(token);
      else risultato=await servizio.cancella(token);
    }
    return invia(res,risultato.stato==='analisi'?202:200,risultato);
  }catch(e){
    const codice=Object.hasOwn(CODICI,e?.codice)?e.codice:'SERVIZIO_NON_DISPONIBILE';
    return invia(res,CODICI[codice],{ok:false,codice});
  }
}
async function webhook(req,res,dipendenze){
  intestazioni(res);
  if(req.method!=='POST')return invia(res,405,{ok:false});
  let deps,event;
  try{
    deps=dipendenze||produzione();
    const chunks=[];let n=0;
    if(Buffer.isBuffer(req.body)||typeof req.body==='string')chunks.push(Buffer.from(req.body));
    else{
      if(req.body!==undefined)throw new Error('raw-body-required');
      for await(const b of req){n+=b.length;if(n>262144)throw new Error('size');chunks.push(b);}
    }
    const raw=Buffer.concat(chunks);
    if(raw.length>262144)throw new Error('size');
    event=deps.stripe.webhooks.constructEvent(raw,req.headers['stripe-signature'],
      deps.webhookSecret||process.env.STRIPE_WEBHOOK_SECRET);
  }catch(_){return invia(res,400,{ok:false});}
  try{await deps.servizio.webhook(event);return invia(res,200,{ok:true});}
  catch(_){return invia(res,503,{ok:false});}
}
module.exports={rispondi,webhook,intestazioni};
