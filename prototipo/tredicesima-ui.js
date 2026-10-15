if(!CALCOLATORE_AVVIO.errore){
(()=>{
  const $=id=>document.getElementById(id);
  const form=$('t-form'),box=$('risultato');
  const euro=TREDICESIMA.formattaEuro;
  const perc=n=>`${(n*100).toLocaleString('it-IT',{maximumFractionDigits:2})}%`;
  const modalita=()=>form.querySelector('input[name="modalita"]:checked').value;
  const CAMPI=['importo','mensilita','mesi'];

  function aggiornaModalita(){
    const ral=modalita()==='ral';
    $('campo-mensilita').hidden=!ral;
    $('importo-label').textContent=ral?'RAL':'Lordo mensile';
    $('importo-help').textContent=ral?'Retribuzione annua lorda, come nel contratto.':'Il lordo della busta paga, prima di contributi e tasse.';
  }
  function pulisci(){
    box.hidden=true;
    for(const c of CAMPI){$(c).removeAttribute('aria-invalid');$(`${c}-errore`).hidden=true;}
  }
  function mostraErrore({campo,messaggio}){
    const c=CAMPI.includes(campo)?campo:'importo';
    $(c).setAttribute('aria-invalid','true');
    $(`${c}-errore`).textContent=messaggio;$(`${c}-errore`).hidden=false;$(c).focus();
  }
  function riga(titolo,formula,importo,segno){
    const tr=document.createElement('tr');
    const th=document.createElement('th');th.scope='row';th.textContent=titolo;
    const f=document.createElement('span');f.className='formula';f.textContent=formula;th.append(f);
    const td=document.createElement('td');td.textContent=`${segno}${euro(importo)}`;
    tr.append(th,td);return tr;
  }
  /* Le righe: la voce dice i numeri, qui si scrive la frase. */
  function righe(r){
    return r.voci.map(v=>{
      if(v.id==='lorda')return riga('Tredicesima lorda',v.mesi===12?`${euro(v.base)} lordi al mese · ${v.fonte}`:`${euro(v.base)} × ${v.mesi} mesi ÷ 12 · ${v.fonte}`,v.importo,'');
      if(v.id==='inps')return riga('Contributi INPS',`${perc(v.aliquota)} della lorda · ${v.fonte}`,v.importo,'−');
      if(v.id==='aggiuntivo')return riga('Contributo aggiuntivo INPS',`${perc(v.aliquota)} su ${euro(v.base)}: a dicembre stipendio e tredicesima superano ${euro(v.soglia)} · ${v.fonte}`,v.importo,'−');
      if(v.id==='irpef')return riga('IRPEF trattenuta',`${v.fasce.map(f=>`${perc(f.aliquota)} su ${euro(f.base)}`).join(' + ')}, senza detrazioni · ${v.fonte}`,v.importo,'−');
      if(v.id==='cuneo')return riga('Bonus cuneo fiscale',`${perc(v.aliquota)} di ${euro(v.base)}, esente · ${v.fonte}`,v.importo,'+');
    });
  }
  function testoDetassata(d){
    const link='<a href="/blog/tredicesima-detassata/">Cosa prevede la proposta</a>';
    return d.applicabile
      ?`<p>Se passasse l'ipotesi della sostitutiva al ${perc(d.aliquota)} fino a ${euro(d.soglia)} di reddito, sulla tua tredicesima risparmieresti <b>${euro(d.risparmio)}</b>. Oggi non è legge. ${link}.</p>`
      :`<p>Con l'ipotesi della sostitutiva al ${perc(d.aliquota)} il tuo risparmio sarebbe <b>0 €</b>: il tuo reddito stimato supera la soglia di ${euro(d.soglia)}. Oggi comunque non è legge. ${link}.</p>`;
  }
  function mostra(r){
    $('netta').textContent=euro(r.netta);$('netta-riga').textContent=euro(r.netta);
    $('righe').replaceChildren(...righe(r));
    $('nota-stima').hidden=r.modalita!=='lordo';
    $('detassata-testo').innerHTML=testoDetassata(r.detassata);
    box.hidden=false;
  }
  function leggiForm(){
    return{modalita:modalita(),importo:$('importo').value,mensilita:$('mensilita').value,mesi:$('mesi').value};
  }
  function esegui({silenzioso=false}={}){
    pulisci();
    const input=TREDICESIMA.normalizza(leggiForm());
    if(input.errore){if(!silenzioso)mostraErrore(input.errore);return;}
    mostra(TREDICESIMA.calcola(input));
    if(!silenzioso)box.focus();
    try{if(typeof window.gtag==='function')window.gtag('event','tredicesima_calcolata',{modalita:input.modalita});}catch(_){/* tracker facoltativo */}
  }

  form.addEventListener('change',e=>{if(e.target.name==='modalita'){aggiornaModalita();pulisci();}});
  form.addEventListener('input',pulisci);
  form.addEventListener('submit',e=>{e.preventDefault();esegui();});

  /* Precompilazione da link (?ral=30000, ?lordo=2300&mesi=8): se i
     valori sono validi calcola subito, altrimenti lascia la pagina vuota. */
  const q=TREDICESIMA.daQuery(location.search);
  if(q&&!TREDICESIMA.normalizza(q).errore){
    form.querySelector(`input[name="modalita"][value="${q.modalita}"]`).checked=true;
    $('importo').value=q.importo;$('mesi').value=q.mesi;if(q.mensilita)$('mensilita').value=q.mensilita;
    aggiornaModalita();esegui({silenzioso:true});
  }else aggiornaModalita();
})();

CALCOLATORE_AVVIO.pronto();
}
