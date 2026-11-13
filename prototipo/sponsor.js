/* Sponsorship limitate (RIC-51) — gli slot sponsor, uguali su ogni pagina.

   Lo script legge il tabellone da /api/sponsor e lo disegna in tre posti:
   due colonne fisse ai lati sugli schermi larghi, una striscia sotto la
   navigazione e una griglia a fondo pagina su tutti gli altri. Mai dentro il
   flusso dalla RAL al netto, mai fra le Righe. L'ultimo riquadro, in basso a
   destra, non è uno slot: è l'invito a prenotarne uno.

   Nessuno script dello sponsor, nessun pixel: solo un link con rel="sponsored"
   e un logo servito dal nostro dominio. Le funzioni che producono markup sono
   pure e si provano in Node senza DOM. */
(function(){
  const PAGINA='/sponsor/';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function prezzo(d){
    if(!d||!Number.isFinite(d.prezzo_cent))return'';
    const cifra=new Intl.NumberFormat('it-IT',{style:'currency',currency:String(d.valuta||'eur').toUpperCase(),
      minimumFractionDigits:d.prezzo_cent%100?2:0,maximumFractionDigits:2}).format(d.prezzo_cent/100).replace(/ /g,' ');
    return d.durata_giorni?`${cifra} · ${d.durata_giorni} giorni`:cifra;
  }
  function logo(s,lato){
    return s.logo
      ?`<img class="sp-logo" src="${esc(s.logo)}" alt="${esc(s.logo_alt||'')}" width="${lato}" height="${lato}" loading="lazy" decoding="async">`
      :`<span class="sp-logo sp-logo--sigla" aria-hidden="true">${esc(s.nome.slice(0,1).toUpperCase())}</span>`;
  }
  /* Un riquadro per slot: sponsor attivo, slot libero prenotabile, slot riservato. */
  function carta(s,d){
    if(s.stato==='attivo')return`<a class="sp-card sp-card--attivo" data-tinta="${s.slot%5}" data-sponsor="${esc(s.nome)}" href="${esc(s.url)}" target="_blank" rel="sponsored noopener"><span class="sp-tag">Sponsor</span>${logo(s,40)}<strong class="sp-nome">${esc(s.nome)}</strong>${s.claim?`<span class="sp-claim">${esc(s.claim)}</span>`:''}</a>`;
    if(s.stato==='disponibile')return`<a class="sp-card sp-card--libero" href="${PAGINA}?slot=${s.slot}"><span class="sp-tag">Slot libero</span><strong class="sp-nome">Il tuo prodotto qui</strong><span class="sp-claim">${esc(prezzo(d))}</span></a>`;
    return`<div class="sp-card sp-card--riservato"><span class="sp-tag">Slot riservato</span><span class="sp-claim">In approvazione</span></div>`;
  }
  /* In basso a destra: non si prenota, serve a prenotare. */
  function invito(d){
    const liberi=d.disponibili>0?`${d.disponibili}/${d.slot_totali} slot liberi`:'Tutto esaurito';
    return`<a class="sp-card sp-card--invito" href="${PAGINA}"><span class="sp-tag">Sponsorizza</span><strong class="sp-nome">Diventa sponsor</strong><span class="sp-claim">${esc(liberi)}</span></a>`;
  }
  function carte(d){return[...d.slot.map(s=>carta(s,d)),invito(d)];}
  /* Metà a sinistra, metà a destra; l'invito chiude la colonna destra. */
  function colonne(d){
    const tutte=carte(d),meta=Math.ceil(tutte.length/2);
    return{sinistra:tutte.slice(0,meta).join(''),destra:tutte.slice(meta).join('')};
  }
  function fondo(d){return`<p class="sp-fondo__titolo">Sponsor</p><div class="sp-fondo__griglia">${carte(d).join('')}</div>`;}
  function striscia(d){
    const attivi=d.slot.filter(s=>s.stato==='attivo').map(s=>`<a class="sp-chip" data-sponsor="${esc(s.nome)}" href="${esc(s.url)}" target="_blank" rel="sponsored noopener">${logo(s,20)}<span>${esc(s.nome)}</span></a>`).join('');
    const p=prezzo(d).replace(' · ','/');
    const invitoChip=d.disponibili>0
      ?`<a class="sp-chip sp-chip--invito" href="${PAGINA}">+ Il tuo prodotto${p?` · ${esc(p)}`:''}</a>`
      :`<a class="sp-chip sp-chip--invito" href="${PAGINA}">Sponsorizza</a>`;
    return`<span class="sp-striscia__etichetta">Sponsor</span><div class="sp-striscia__scorri">${attivi}${invitoChip}</div>`;
  }
  const visibile=d=>!!d&&Array.isArray(d.slot)&&d.slot.length>0;

  const API={carta,invito,carte,colonne,fondo,striscia,prezzo,visibile};
  if(typeof module!=='undefined'&&module.exports){module.exports=API;return;}
  window.SPONSOR=API;

  /* --- browser ----------------------------------------------------------- */
  if(/^\/sponsor\/approva\//.test(location.pathname))return;
  const CHIAVE='sponsor:v1';
  function elemento(tag,classe){
    const e=document.createElement(tag);e.className=classe;
    if(tag==='aside')e.setAttribute('aria-label','Sponsor');
    return e;
  }
  function disegna(d){
    const posto=document.getElementById('sp-striscia');
    if(!visibile(d)){
      if(posto)posto.hidden=true;
      document.querySelectorAll('.sp-rail,.sp-fondo').forEach(e=>e.remove());
      return;
    }
    let s=posto;
    if(!s){
      s=elemento('aside','sp-striscia');s.id='sp-striscia';
      const header=document.querySelector('.site-header');
      if(header)header.after(s);else document.body.prepend(s);
    }
    s.hidden=false;s.innerHTML=striscia(d);
    const c=colonne(d);
    for(const [lato,html] of [['sx',c.sinistra],['dx',c.destra]]){
      let rail=document.querySelector('.sp-rail--'+lato);
      if(!rail){rail=elemento('aside','sp-rail sp-rail--'+lato);document.body.append(rail);}
      rail.innerHTML=html;
    }
    let f=document.querySelector('.sp-fondo');
    if(!f){
      f=elemento('aside','sp-fondo');
      const footer=[...document.body.children].reverse().find(e=>e.tagName==='FOOTER');
      if(footer)footer.before(f);else document.body.append(f);
    }
    f.innerHTML=fondo(d);
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
    try{
      const c=JSON.parse(sessionStorage.getItem(CHIAVE)||'null');
      if(c&&Date.now()-c.t<300000){disegna(c.d);inCache=true;}
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
