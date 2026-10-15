if(!CALCOLATORE_AVVIO.errore){
(()=>{
  const form=document.getElementById('netto-form'),input=document.getElementById('netto');
  const button=document.getElementById('calcola'),status=document.getElementById('netto-status');
  const box=document.getElementById('risultato');let richiesta=0;
  const euro=n=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR',minimumFractionDigits:0,maximumFractionDigits:2}).format(n);
  const nascondi=()=>{richiesta++;button.disabled=false;box.hidden=true;status.textContent='';input.removeAttribute('aria-invalid');};
  input.addEventListener('input',nascondi);
  form.addEventListener('submit',async event=>{
    event.preventDefault();const id=++richiesta,target=NETTO_RAL.normalizzaTarget(input.value);
    box.hidden=true;input.removeAttribute('aria-invalid');
    if(target.errore){input.setAttribute('aria-invalid','true');status.textContent=target.errore;input.focus();return;}
    button.disabled=true;status.textContent='Calcolo in corso…';
    const risultato=await NETTO_RAL.trovaRalProgressiva(input.value);
    if(id!==richiesta)return;
    button.disabled=false;
    if(!risultato){status.textContent='Questo netto non è raggiungibile entro il limite di RAL del calcolatore.';return;}
    document.getElementById('frase-risultato').textContent=`Per avere circa ${euro(target.valore)} netti al mese, punta a una RAL di almeno ${euro(risultato.ral)}.`;
    document.getElementById('ral-risultato').textContent=euro(risultato.ral);
    document.getElementById('media-risultato').textContent=euro(risultato.mediaMensile);
    document.getElementById('cta-calcolatore').href=NETTO_RAL.urlCalcolatore(risultato.ral);
    const massimale=toNumber(K.contributi.massimale);
    document.getElementById('avviso-massimale').innerHTML=risultato.ral>massimale?'<div class="callout callout--warn"><span class="callout__mark">Limite</span><div>Il risultato applica il massimale contributivo assumendo la prima iscrizione previdenziale dal 1996.</div></div>':'';
    status.textContent='Calcolo completato.';box.hidden=false;box.focus?.();
  });
})();

CALCOLATORE_AVVIO.pronto();
}
