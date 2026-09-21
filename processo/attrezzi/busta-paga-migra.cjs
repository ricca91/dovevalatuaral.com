'use strict';
const {creaArchivio}=require('../../server/busta-paga-archivio');
async function main(){
  if(!process.env.BUSTA_PAGA_DATABASE_URL)throw new Error('configurazione');
  const a=creaArchivio(process.env.BUSTA_PAGA_DATABASE_URL);
  try{await a.migra();console.log('Schema busta paga pronto.');}finally{await a.chiudi();}
}
main().catch(()=>{console.error('Migrazione non riuscita: controllare connessione e permessi del database.');process.exitCode=1;});
