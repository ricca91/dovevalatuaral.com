/* Sponsorship limitate (RIC-51) — gli slot sponsor, uguali su ogni pagina.

   Lo script legge il tabellone da /api/sponsor e lo disegna in due modi:
   sugli schermi larghi due colonne fisse ai lati, alte quanto lo schermo;
   su tutti gli altri due barre che scorrono piano, una sotto la navigazione
   e una fissa in fondo allo schermo, così ogni slot passa sotto gli occhi.
   Mai dentro il flusso dalla RAL al netto, mai fra le Righe. L'ultimo
   riquadro, in basso a destra, non è uno slot: porta dritto al pagamento.

   Nessuno script dello sponsor, nessun pixel: solo un link con rel="sponsored"
   e un logo servito dal nostro dominio. Le funzioni che producono markup sono
   pure e si provano in Node senza DOM. */
(function(){
  const PAGINA='/sponsor/';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function prezzo(d){
    if(!d||!Number.isFinite(d.prezzo_cent))return'';
    const cifra=new Intl.NumberFormat('it-IT',{style:'currency',currency:String(d.valuta||'eur').toUpperCase(),
      minimumFractionDigits:d.prezzo_cent%100?2:0,maximumFractionDigits:2}).format(d.prezzo_cent/100).replace(/\u00a0/g,' ');
    return d.durata_giorni?`${cifra} · ${d.durata_giorni} giorni`:cifra;
  }
  /* Dove porta il riquadro «Diventa sponsor»: al checkout, sul primo slot libero.
     Se è tutto pieno (o le vendite sono chiuse) alla pagina che spiega quando si libera. */
  function acquista(d){
    const libero=d&&d.checkout_url&&d.disponibili>0&&d.slot.find(s=>s.stato==='disponibile');
    return libero?`${d.checkout_url}?client_reference_id=slot-${libero.slot}&locale=it`:PAGINA;
  }
  function logo(s,lato){
    return s.logo
      ?`<img class="sp-logo" src="${esc(s.logo)}" alt="${esc(s.logo_alt||'')}" width="${lato}" height="${lato}" loading="lazy" decoding="async">`
      :`<span class="sp-logo sp-logo--sigla" aria-hidden="true">${esc(s.nome.slice(0,1).toUpperCase())}</span>`;
  }
  /* Un riquadro per slot: sponsor attivo, slot libero prenotabile, slot pagato in approvazione. */
  function carta(s,d){
    if(s.stato==='attivo')return`<a class="sp-card sp-card--attivo" data-tinta="${s.slot%5}" data-sponsor="${esc(s.nome)}" href="${esc(s.url)}" target="_blank" rel="sponsored noopener"><span class="sp-tag">Sponsor</span>${logo(s,40)}<strong class="sp-nome">${esc(s.nome)}</strong>${s.claim?`<span class="sp-claim">${esc(s.claim)}</span>`:''}</a>`;
    if(s.stato==='disponibile')return`<a class="sp-card sp-card--libero" href="${PAGINA}?slot=${s.slot}"><span class="sp-tag">Slot libero</span><strong class="sp-nome">Il tuo prodotto qui</strong><span class="sp-claim">${esc(prezzo(d))}</span></a>`;
    return`<div class="sp-card sp-card--riservato"><span class="sp-tag">Slot preso</span><strong class="sp-nome">In approvazione</strong></div>`;
  }
  const liberi=d=>d.disponibili>0?`${d.disponibili}/${d.slot_totali} slot liberi`:'Tutto esaurito';
  /* In basso a destra: non si prenota, serve a prenotare. */
  function invito(d){
    return`<a class="sp-card sp-card--invito" href="${esc(acquista(d))}"><span class="sp-tag">Sponsorizza</span><strong class="sp-nome">Diventa sponsor</strong><span class="sp-claim">${esc(liberi(d))}</span></a>`;
  }
  function carte(d){return[...d.slot.map(s=>carta(s,d)),invito(d)];}
  /* Metà a sinistra, metà a destra; l'invito chiude la colonna destra. */
  function metà(lista){const m=Math.ceil(lista.length/2);return[lista.slice(0,m),lista.slice(m)];}
  function colonne(d){
    const [sinistra,destra]=metà(carte(d));
    return{sinistra:sinistra.join(''),destra:destra.join('')};
  }

  /* Le barre: gli stessi slot in formato pillola. Sopra la prima metà, sotto
     la seconda e l'invito: è la stessa disposizione delle colonne. */
  function pillola(s,d){
    if(s.stato==='attivo')return`<a class="sp-chip sp-chip--attivo" data-tinta="${s.slot%5}" data-sponsor="${esc(s.nome)}" href="${esc(s.url)}" target="_blank" rel="sponsored noopener">${logo(s,20)}<span>${esc(s.nome)}</span></a>`;
    if(s.stato==='disponibile'){const p=prezzo(d).replace(' · ','/');return`<a class="sp-chip sp-chip--libero" href="${PAGINA}?slot=${s.slot}">+ Il tuo prodotto${p?` · ${esc(p)}`:''}</a>`;}
    return`<span class="sp-chip sp-chip--riservato">Slot preso · in approvazione</span>`;
  }
  function pilloleInvito(d){return`<a class="sp-chip sp-chip--invito" href="${esc(acquista(d))}">Diventa sponsor · ${esc(liberi(d))}</a>`;}
  /* Un nastro che scorre, senza etichetta: la barra si annuncia come «Sponsor»
     ai lettori di schermo e ogni sponsor porta rel="sponsored". La stessa fila due volte, la seconda copia è inerte
     e serve solo a far tornare il giro senza salti. Con pochi slot la fila si
     ripete finché riempie uno schermo largo. */
  function nastro(pezzi){
    let fila=pezzi.slice();
    while(fila.length&&fila.length<8)fila=fila.concat(pezzi);
    const giro=fila.join('');
    return`<div class="sp-nastro" style="--sp-durata:${Math.max(36,fila.length*7)}s"><div class="sp-nastro__pista"><div class="sp-nastro__copia">${giro}</div><div class="sp-nastro__copia" aria-hidden="true" inert>${giro}</div></div></div>`;
  }
  function barre(d){
    const [sopra,sotto]=metà([...d.slot.map(s=>pillola(s,d)),pilloleInvito(d)]);
    return{sopra:nastro(sopra),sotto:nastro(sotto)};
  }
  const visibile=d=>!!d&&Array.isArray(d.slot)&&d.slot.length>0;

  const API={carta,invito,carte,colonne,pillola,barre,acquista,prezzo,visibile};
  if(typeof module!=='undefined'&&module.exports){module.exports=API;return;}
  window.SPONSOR=API;

  /* --- browser ----------------------------------------------------------- */
  if(/^\/sponsor\/approva\//.test(location.pathname))return;
  const CHIAVE='sponsor:v2';
  function elemento(tag,classe){
    const e=document.createElement(tag);e.className=classe;
    if(tag==='aside')e.setAttribute('aria-label','Sponsor');
    return e;
  }
  function disegna(d){
    const posto=document.getElementById('sp-striscia');
    if(!visibile(d)){
      if(posto)posto.hidden=true;
      document.querySelectorAll('.sp-rail,.sp-barra--sotto').forEach(e=>e.remove());
      document.documentElement.classList.remove('sp-con-barra');
      return;
    }
    const b=barre(d);
    let s=posto;
    if(!s){
      s=elemento('aside','sp-striscia');s.id='sp-striscia';
      const header=document.querySelector('.site-header');
      if(header)header.after(s);else document.body.prepend(s);
    }
    s.classList.add('sp-barra','sp-barra--sopra');
    s.hidden=false;s.innerHTML=b.sopra;
    let giù=document.querySelector('.sp-barra--sotto');
    if(!giù){giù=elemento('aside','sp-barra sp-barra--sotto');document.body.append(giù);}
    giù.innerHTML=b.sotto;
    document.documentElement.classList.add('sp-con-barra');
    const c=colonne(d);
    for(const [lato,html] of [['sx',c.sinistra],['dx',c.destra]]){
      let rail=document.querySelector('.sp-rail--'+lato);
      if(!rail){rail=elemento('aside','sp-rail sp-rail--'+lato);document.body.append(rail);}
      rail.innerHTML=html;
    }
    document.dispatchEvent(new CustomEvent('sponsor:tabellone',{detail:d}));
  }
  function stile(){
    if(document.querySelector('link[data-sponsor-css]'))return;
    const l=document.createElement('link');l.rel='stylesheet';l.href='/sponsor.css';l.setAttribute('data-sponsor-css','');
    document.head.append(l);
  }
  function avvia(){
    stile();
    let inCache=false;
    /* Cache breve: uno slot appena pagato deve sparire dai liberi in fretta. */
    try{
      const c=JSON.parse(sessionStorage.getItem(CHIAVE)||'null');
      if(c&&Date.now()-c.t<60000){disegna(c.d);inCache=true;}
    }catch(_){}
    fetch('/api/sponsor',{headers:{Accept:'application/json'}}).then(r=>r.ok?r.json():Promise.reject()).then(d=>{
      disegna(d);
      try{sessionStorage.setItem(CHIAVE,JSON.stringify({t:Date.now(),d}));}catch(_){}
    }).catch(()=>{if(!inCache)disegna(null);});
    /* Il clic verso lo sponsor si conta con gli analytics del sito, senza pixel di terzi. */
    document.addEventListener('click',e=>{
      const a=e.target.closest&&e.target.closest('a[data-sponsor]');if(!a)return;
      const nome=a.getAttribute('data-sponsor');
      try{window.gtag&&window.gtag('event','sponsor_click',{sponsor:nome});}catch(_){}
      try{window.datafast&&window.datafast('sponsor_click',{sponsor:nome.slice(0,60)});}catch(_){}
    });
  }
  window.SPONSOR.aggiorna=()=>fetch('/api/sponsor').then(r=>r.json());
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',avvia);else avvia();
})();
