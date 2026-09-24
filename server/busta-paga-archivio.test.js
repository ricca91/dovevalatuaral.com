const {test}=require('node:test');
const assert=require('node:assert/strict');
const {mkdtemp,rm}=require('node:fs/promises');
const os=require('node:os'),path=require('node:path');
const {PGlite}=require('@electric-sql/pglite');
const {creaArchivio}=require('./busta-paga-archivio');
const {scenario}=require('../processo/verifiche/ric-72/supporto.cjs');
const {creaServizio,idDaToken,DURATE}=require('./busta-paga-acquisto');
function pool(db){
  let prenotata=false;
  return{on(){},query:(...a)=>{
    assert.equal(prenotata,false,'nessuna seconda connessione per i contatori dentro una transazione');
    return db.query(...a);
  },connect:async()=>{prenotata=true;return{query:(...a)=>db.query(...a),release(){prenotata=false;}};},end:()=>db.close()};
}

test('SQL PostgreSQL reale: rollback, persistenza dopo riapertura e cancellazione per scadenza',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'ric72-pg-'));
  let db=new PGlite(dir),a=creaArchivio(null,{pool:pool(db)});
  try{
    // PGlite esegue PostgreSQL in un solo processo: verifica SQL e persistenza,
    // non la contesa fra più connessioni del servizio ospitato.
    await db.exec(require('./busta-paga-archivio').SCHEMA);
    const s=scenario({archivio:a});await s.crea();await s.servizio.checkout(s.token);s.paga();
    const pronto=await s.servizio.stato(s.token);assert.equal(pronto.stato,'pagato');
    await assert.rejects(a.transazione(idDaToken(s.token),async(o,salva)=>{o.stato='cancellato';salva(o);throw Error('rollback');}));
    assert.equal((await s.servizio.stato(s.token)).stato,'pagato');
    await a.chiudi();db=new PGlite(dir);a=creaArchivio(null,{pool:pool(db)});
    const riavvio=creaServizio({archivio:a,stripe:s.stripe,ambiente:s.ambiente});
    assert.equal((await riavvio.stato(s.token)).report.analisi.voci.length,4);
    assert.equal(s.chiamate,1);assert.equal(s.creazioni,1);
    await a.pulisci(Date.now()+DURATE.report+60000);
    const {rows}=await db.query('SELECT dati FROM bp_ordini');assert.equal(rows[0].dati.cifrato,undefined);
    await a.pulisci(Date.now()+DURATE.transazione+60000);
    assert.equal((await db.query('SELECT * FROM bp_ordini')).rows.length,0);
  }finally{await a.chiudi();await rm(dir,{recursive:true,force:true});}
});
