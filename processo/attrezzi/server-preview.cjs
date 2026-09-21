/* Server di sviluppo loopback: statici + stessi handler Node delle Functions. */
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const port=4182,root=path.resolve(__dirname,'../../prototipo');
process.env.NON_DEV_ORIGIN='http://127.0.0.1:'+port;
const handlers={'busta-paga':require('../../api/busta-paga.js'),'busta-paga-webhook':require('../../server/busta-paga-http.js').webhook,'busta-paga-pulizia':require('../../api/busta-paga-pulizia.js'),risultato:require('../../api/risultato.js'),'risultato-immagine':require('../../api/risultato-immagine.js')};
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.xml':'application/xml','.txt':'text/plain'};
http.createServer((req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1:'+port);
  const match=url.pathname.match(/^\/(risultato|risultato-immagine)\/([^/]+)\/([^/]+)\/([^/]+)$/);
  const api=url.pathname.match(/^\/api\/(risultato|risultato-immagine|busta-paga|busta-paga-webhook|busta-paga-pulizia)$/);
  if(match||api){
    const query={};for(const [k,v] of url.searchParams){query[k]=Object.hasOwn(query,k)?[].concat(query[k],v):v;}
    if(match){
      // Come le rewrite Vercel: il path prevale sui parametri omonimi.
      Object.assign(query,{v:match[2],s:match[3],t:match[1]==='risultato-immagine'?match[4].replace(/\.png$/,''):match[4]});
    }
    req.query=query;return handlers[(match||api)[1]](req,res);
  }
  let name;try{name=decodeURIComponent(url.pathname);}catch(_){res.statusCode=400;return res.end();}
  if(name.endsWith('/'))name+='index.html';
  const file=path.resolve(root,'.'+name);
  if(!file.startsWith(root+path.sep)){res.statusCode=403;return res.end();}
  fs.readFile(file,(err,data)=>{
    if(err){res.statusCode=404;return res.end('Not found');}
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
    res.end(req.method==='HEAD'?undefined:data);
  });
}).listen(port,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:'+port));
