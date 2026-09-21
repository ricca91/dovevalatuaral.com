// Web Request evita il getter req.body dei Node helpers Vercel, che analizza
// il JSON. Alla verifica della firma arrivano sempre i bytes originali.
import {Readable} from 'node:stream';
import http from '../server/busta-paga-http.js';
export async function POST(request){
  const req=request.body?Readable.fromWeb(request.body):Readable.from([]);
  req.method='POST';req.headers=Object.fromEntries(request.headers);
  const headers=new Headers();let body='',status=200;
  await http.webhook(req,{setHeader:(k,v)=>headers.set(k,v),
    set statusCode(v){status=v;},end(v){body=v||'';}});
  return new Response(body,{status,headers});
}
