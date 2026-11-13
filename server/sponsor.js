/* Sponsorship limitate (RIC-51): il contratto fra il database e le pagine.

   Il catalogo vive su Supabase (slot, stato, sponsor, date); qui lo si legge
   attraverso la sola funzione pubblica `sponsor_tabellone` e lo si riduce a ciò
   che una pagina può mostrare. Tutto quello che non rispetta il contratto —
   stato sconosciuto, link non https, sponsor attivo senza nome — degrada a
   «riservato»: lo slot non si vende e non mostra nulla. Meglio un riquadro
   muto di un link sbagliato su ogni pagina del sito. */
const SUPABASE_URL='https://rifkyfawojizgbzabyxn.supabase.co';
/* Chiave publishable: è pubblica per costruzione, le tabelle sono chiuse da RLS. */
const SUPABASE_KEY='sb_publishable_uE2WTveTICwGEKa4GHUCvw_Zt8Aj5fp';
const STORAGE=SUPABASE_URL+'/storage/v1/object/public/sponsor-loghi/';
const STATI=Object.freeze(['disponibile','riservato','attivo']);
const UTM=Object.freeze({utm_source:'dovevalatuaral',utm_medium:'referral',utm_campaign:'sponsor'});

function urlSicuro(grezzo){
  try{
    const u=new URL(String(grezzo));
    if(u.protocol!=='https:'||u.username||u.password||!u.hostname.includes('.'))return null;
    return u;
  }catch(_){return null;}
}
function destinazione(grezzo){
  const u=urlSicuro(grezzo);if(!u)return null;
  for(const [k,v] of Object.entries(UTM))if(!u.searchParams.has(k))u.searchParams.set(k,v);
  return u.toString();
}
/* I loghi escono solo dal nostro storage e si servono dal dominio del sito. */
function logo(grezzo){
  const s=String(grezzo||'');
  if(!s.startsWith(STORAGE))return null;
  const file=s.slice(STORAGE.length);
  return /^[A-Za-z0-9._-]{1,120}$/.test(file)&&!file.includes('..')?'/sponsor-loghi/'+file:null;
}
function checkout(grezzo){
  const u=urlSicuro(grezzo);
  return u&&/^(?:book|buy|donate)\.stripe\.com$/.test(u.hostname)?u.origin+u.pathname:null;
}
const testo=(v,max)=>String(v??'').replace(/\s+/g,' ').trim().slice(0,max);

function slot(r,numero){
  const muto={slot:numero,stato:'riservato'};
  if(!r||!STATI.includes(r.stato))return muto;
  if(r.stato!=='attivo')return{slot:numero,stato:r.stato};
  const nome=testo(r.nome,60),url=destinazione(r.url);
  if(!nome||!url)return muto;
  return{slot:numero,stato:'attivo',nome,claim:testo(r.claim,120),url,logo:logo(r.logo_url),logo_alt:testo(r.logo_alt,80)};
}

/* Il tabellone vuoto e chiuso: quello che si mostra se il database non risponde. */
function chiuso(){
  return{slot_totali:0,disponibili:0,prezzo_cent:null,valuta:'eur',durata_giorni:null,checkout_url:null,vendite_aperte:false,slot:[]};
}

function tabellone(grezzo){
  if(!grezzo||typeof grezzo!=='object')return chiuso();
  const totali=Number(grezzo.slot_totali);
  if(!Number.isInteger(totali)||totali<1||totali>12)return chiuso();
  const righe=new Map((Array.isArray(grezzo.slot)?grezzo.slot:[]).map(r=>[Number(r&&r.slot),r]));
  const slots=Array.from({length:totali},(_,i)=>slot(righe.get(i+1),i+1));
  const prezzo=Number(grezzo.prezzo_cent),durata=Number(grezzo.durata_giorni),link=checkout(grezzo.checkout_url);
  const vendibile=grezzo.vendite_aperte===true&&!!link&&Number.isInteger(prezzo)&&prezzo>0&&Number.isInteger(durata)&&durata>0;
  /* Senza un checkout coerente nessuno slot si dichiara disponibile:
     la scarsità mostrata non può eccedere quella vendibile. */
  if(!vendibile)for(const s of slots)if(s.stato==='disponibile')s.stato='riservato';
  return{
    slot_totali:totali,
    disponibili:slots.filter(s=>s.stato==='disponibile').length,
    prezzo_cent:vendibile?prezzo:null,
    valuta:/^[a-z]{3}$/.test(grezzo.valuta||'')?grezzo.valuta:'eur',
    durata_giorni:vendibile?durata:null,
    checkout_url:vendibile?link:null,
    vendite_aperte:vendibile,
    slot:slots,
  };
}

async function leggi(fetchImpl=fetch){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),4000);
  try{
    const r=await fetchImpl(SUPABASE_URL+'/rest/v1/rpc/sponsor_tabellone',{
      method:'POST',signal:controller.signal,
      headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY,'Content-Type':'application/json'},
      body:'{}',
    });
    if(!r.ok)throw new Error('Supabase '+r.status);
    return tabellone(await r.json());
  }finally{clearTimeout(timer);}
}

/* GET /api/sponsor — una risposta per tutti, tenuta in cache dalla CDN. */
async function handler(req,res,fetchImpl=fetch){
  if(req.method!=='GET'&&req.method!=='HEAD'){res.statusCode=405;res.setHeader('Allow','GET, HEAD');return res.end();}
  res.setHeader('Content-Type','application/json; charset=utf-8');
  let dati;
  try{
    dati=await leggi(fetchImpl);
    res.setHeader('Cache-Control','public, max-age=0, s-maxage=15, stale-while-revalidate=60');
  }catch(_){
    /* Il sito non dipende dagli sponsor: se il catalogo non risponde, niente slot. */
    dati=chiuso();
    res.setHeader('Cache-Control','public, max-age=0, s-maxage=15');
  }
  res.statusCode=200;
  res.end(req.method==='HEAD'?undefined:JSON.stringify(dati));
}

module.exports={tabellone,chiuso,destinazione,logo,checkout,leggi,handler,STATI,SUPABASE_URL};
