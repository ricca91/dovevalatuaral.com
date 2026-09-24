// Solo prova locale: mai importato da api/ o dalla build pubblica.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {scenario}=require('./supporto.cjs');
const H=require('../../../server/busta-paga-http');
const s=scenario(),root=path.resolve(__dirname,'../../../prototipo');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
  const u=new URL(req.url,'http://127.0.0.1:4192');req.query=Object.fromEntries(u.searchParams);
  if(u.pathname==='/api/busta-paga')return H.rispondi(req,res,{servizio:s.servizio});
  if(u.pathname==='/__prova/paga'&&req.method==='POST'){s.paga();res.end('Pagamento simulato');return;}
  if(u.pathname==='/__prova/configurazione-assente')return H.rispondi({...req,url:'/api/busta-paga',query:{azione:'configurazione'},headers:req.headers,method:'GET'},res);
  let file;try{file=path.resolve(root,'.'+decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));}catch(_){res.statusCode=400;return res.end();}
  if(!file.startsWith(root+'/')){res.statusCode=403;return res.end();}
  fs.readFile(file,(err,data)=>{
    if(err){res.statusCode=404;return res.end();}
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
    res.setHeader('Referrer-Policy','no-referrer');
    if(file.endsWith('/busta-paga.html'))data=Buffer.from(data.toString().replace('<main id="contenuto"','<p style="padding:12px;background:#ffe36e;color:#111;text-align:center">SIMULAZIONE LOCALE — analisi e pagamento fittizi, dati sintetici</p><main id="contenuto"'));
    res.end(data);
  });
});
server.listen(4192,'127.0.0.1',()=>console.log('Prova dichiarata: http://127.0.0.1:4192/busta-paga.html'));
