const {timingSafeEqual}=require('node:crypto');
const {creaArchivio}=require('../server/busta-paga-archivio');
module.exports=async(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  const atteso=Buffer.from(`Bearer ${process.env.CRON_SECRET||''}`);
  const ricevuto=Buffer.from(req.headers.authorization||'');
  if(req.method!=='GET'||!process.env.CRON_SECRET||atteso.length!==ricevuto.length||!timingSafeEqual(atteso,ricevuto)){
    res.statusCode=401;return res.end();
  }
  let archivio;
  try{
    if(!process.env.BUSTA_PAGA_DATABASE_URL)throw new Error('configurazione');
    archivio=creaArchivio(process.env.BUSTA_PAGA_DATABASE_URL);
    await archivio.pulisci(Date.now());res.statusCode=204;res.end();
  }catch(_){res.statusCode=503;res.end();}
  finally{if(archivio)await archivio.chiudi();}
};
