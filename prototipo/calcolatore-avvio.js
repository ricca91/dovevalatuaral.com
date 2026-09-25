/* Stato di caricamento separato dal motore: nessun dato fiscale provvisorio. */
const CALCOLATORE_AVVIO=(()=>{
  const modificati=new Set();
  const messaggio=document.getElementById('avvio-messaggio');
  const riprova=document.getElementById('avvio-riprova');
  let completato=false;
  const registra=e=>{if(e.target.id)modificati.add(e.target.id);};
  document.addEventListener('input',registra,true);
  document.addEventListener('change',registra,true);
  // La query si legge subito; il controller fiscale la rileggerà integralmente.
  const query=new URLSearchParams(location.search);
  const ral=document.getElementById('ral'),mensilita=document.getElementById('mensilita');
  if(ral&&ral.value!==ral.defaultValue)modificati.add('ral');
  if(ral&&query.has('ral')&&!modificati.has('ral'))ral.value=query.get('ral');
  if(ral&&mensilita&&mensilita.value!==mensilita.querySelector('option[selected]')?.value)modificati.add('mensilita');
  if(ral&&mensilita&&!modificati.has('mensilita')&&['12','13','14','15','16'].includes(query.get('m')))mensilita.value=query.get('m');
  function fallito(){
    if(completato)return;
    document.documentElement.dataset.calcError='true';
    messaggio.textContent='Il calcolatore non si è caricato. Controlla la connessione e riprova.';
    messaggio.parentElement.setAttribute('role','alert');
    riprova.hidden=false;
  }
  function erroreEvento(e){
    if(e.target?.matches?.('script[defer]')||e.filename&&new URL(e.filename,location.href).origin===location.origin)fallito();
  }
  window.addEventListener('error',erroreEvento,true);
  riprova.addEventListener('click',()=>{
    // Il nuovo documento evita doppie dichiarazioni globali e doppi listener.
    const url=new URL(location.href);
    if(ral){url.searchParams.set('ral',document.getElementById('ral').value);url.searchParams.set('m',document.getElementById('mensilita').value);}
    location.replace(url.href);
  });
  document.addEventListener('DOMContentLoaded',()=>{if(!completato)fallito();},{once:true});
  if(document.documentElement.dataset.calcError)fallito();
  return {
    modificati,
    get errore(){return document.documentElement.dataset.calcError==='true';},
    pronto(){
      if(this.errore){fallito();return;}
      completato=true;
      document.querySelectorAll('[data-avvio-inert]').forEach(el=>el.removeAttribute('inert'));
      document.querySelectorAll('[data-avvio-disabled]').forEach(el=>{el.disabled=false;el.removeAttribute('data-avvio-disabled');});
      messaggio.textContent='Calcolatore pronto.';
      messaggio.parentElement.classList.add('avvio--pronto');
      document.removeEventListener('input',registra,true);
      document.removeEventListener('change',registra,true);
      window.removeEventListener('error',erroreEvento,true);
      performance.mark('calcolatore-pronto');
    },
  };
})();
