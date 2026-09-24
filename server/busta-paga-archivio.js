'use strict';
const {Pool}=require('pg');

// Migrazione esplicita: processo/attrezzi/busta-paga-migra.cjs.
// L'applicazione non crea tabelle durante una richiesta utente.
const SCHEMA=`
CREATE TABLE IF NOT EXISTS bp_ordini (
  id text PRIMARY KEY, dati jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS bp_ordini_scadenza ON bp_ordini ((dati->>'eliminaIl'));
CREATE TABLE IF NOT EXISTS bp_limiti (
  chiave text PRIMARY KEY, conteggio integer NOT NULL, scadenza bigint NOT NULL
);`;

function creaArchivio(connectionString,{pool:poolIniettato}={}){
  const pool=poolIniettato||new Pool({connectionString,max:3,connectionTimeoutMillis:5000,
    idleTimeoutMillis:10000,statement_timeout:15000});
  async function consumaCon(connessione,chiave,massimo,scadenza){
    const {rows}=await connessione.query(`INSERT INTO bp_limiti VALUES($1,1,$2)
      ON CONFLICT(chiave) DO UPDATE SET conteggio=bp_limiti.conteggio+1
      RETURNING conteggio`,[chiave,scadenza]);
    return rows[0].conteggio<=massimo;
  }
  pool.on('error',()=>{}); // Nessun errore del driver (potrebbe contenere credenziali) nei log.
  return{
    async transazione(id,operazione){
      const c=await pool.connect();
      try{
        await c.query('BEGIN');
        // Serializza anche la prima creazione, prima che esista una riga.
        await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',[id]);
        const {rows}=await c.query('SELECT dati FROM bp_ordini WHERE id=$1 FOR UPDATE',[id]);
        let dati=rows[0]?.dati||null;
        const risultato=await operazione(dati,nuovi=>{dati=nuovi;},
          {consuma:(...args)=>consumaCon(c,...args)});
        if(dati)await c.query(`INSERT INTO bp_ordini(id,dati) VALUES($1,$2::jsonb)
          ON CONFLICT(id) DO UPDATE SET dati=excluded.dati`,[id,JSON.stringify(dati)]);
        await c.query('COMMIT');
        return risultato;
      }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e;}
      finally{c.release();}
    },
    consuma:(...args)=>consumaCon(pool,...args),
    async pulisci(adesso){
      // Il cron pulisce anche senza visite; ogni lettura rifiuta subito gli scaduti.
      await pool.query(`UPDATE bp_ordini SET dati=(dati-'cifrato') || '{"stato":"scaduto"}'::jsonb
        WHERE (dati->>'scadenza')::bigint <= $1 AND dati ? 'cifrato'`,[adesso]);
      await pool.query("DELETE FROM bp_ordini WHERE (dati->>'eliminaIl')::bigint <= $1",[adesso]);
      await pool.query('DELETE FROM bp_limiti WHERE scadenza <= $1',[adesso]);
    },
    migra:()=>pool.query(SCHEMA),
    chiudi:()=>pool.end(),
  };
}
module.exports={creaArchivio,SCHEMA};
