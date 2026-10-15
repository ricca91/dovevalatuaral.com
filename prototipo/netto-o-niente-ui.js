if(!CALCOLATORE_AVVIO.errore){
/* Controller DOM: nessun calcolo fiscale o PRNG dei round. */
(function(){
  'use strict';
  const N=NON,S=NON_SCENARI,C=COMPARA,H=NON_SHARE;
  const mount=document.getElementById('non-mount'),live=document.getElementById('non-live');
  const bestKey='non:best:'+N.VERSIONE,runKey='non:run:'+N.VERSIONE;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const euro=C.fmtEuro,num=n=>new Intl.NumberFormat('it-IT').format(n);
  let stato=null,sfida=null,best=null,recordInRun=false,epoch=0,replayDaRecuperare=false;
  let memoriaRun=null,localOk=true,sessionOk=true,corrotto=false;
  let scontrino=null;
  const shareOrigin=location.protocol==='file:'?NON_LINK.CANONICAL:location.origin;
  const datiRisultato=()=>H.risultato(stato,shareOrigin);
  function avvisoStorage(){
    const el=document.getElementById('non-storage');
    const messaggi=[];
    if(!localOk)messaggi.push('Puoi giocare, ma il record non verrà salvato su questo dispositivo.');
    if(!sessionOk)messaggi.push('Il ripristino dopo un aggiornamento della pagina non è disponibile. Puoi continuare a giocare in questa pagina.');
    if(corrotto)messaggi.push('Il salvataggio non era leggibile. Puoi iniziare una nuova partita; i dati non validi sono stati ignorati.');
    el.textContent=messaggi.join(' ');el.hidden=!messaggi.length;
  }
  function leggiStorage(tipo,chiave){
    try{return window[tipo].getItem(chiave);}catch(_){if(tipo==='localStorage')localOk=false;else sessionOk=false;return null;}
  }
  function salva(){
    memoriaRun=N.salvaRun(stato);
    if(sessionOk)try{sessionStorage.setItem(runKey,memoriaRun);}catch(_){sessionOk=false;}
    avvisoStorage();
  }
  function aggiornaRecord(){
    // Rileggi il record: due schede non devono farlo scendere.
    const attuale=N.leggiRecord(leggiStorage('localStorage',bestKey));
    best=best===null?attuale:Math.max(best,attuale||0);
    if(best===null||stato.score>best){
      recordInRun=stato.score>0;best=stato.score;
      if(localOk)try{localStorage.setItem(bestKey,String(best));}catch(_){localOk=false;}
    }
    avvisoStorage();
  }
  function evento(nome,dati){
    try{if(typeof window.gtag==='function')window.gtag('event',nome,dati);}catch(_){/* Tracker facoltativo. */}
  }
  function seedNuovo(){
    try{return crypto.getRandomValues(new Uint32Array(1))[0];}
    catch(_){return (Math.floor(Math.random()*4294967296)^Date.now())>>>0;}
  }
  const bottone=(azione,testo,secondario=false)=>`<button type="button" class="non-button${secondario?' non-button--secondary':''}" data-action="${azione}">${testo}</button>`;
  function focus(id){const el=document.getElementById(id);if(el)el.focus();}
  function intro(){
    document.body.classList.remove('non-playing');
    stato=null;mount.setAttribute('aria-busy','false');
    mount.innerHTML=`<section class="non-intro" aria-label="Inizia una partita"><div class="non-intro-copy">
      <h2>Il lordo promette.<br>Il netto decide.</h2>
      <p>Scegli l'offerta che lascia più soldi in un anno dopo i costi del lavoro. Ogni risposta corretta vale 1. Al primo errore, la partita finisce.</p>
      ${sfida?`<p class="non-target">Il tuo amico ha fatto ${num(sfida.target)}. Per batterlo devi arrivare a ${num(sfida.target+1)}.</p>`:''}
      <p class="non-record" style="text-align:left">Il tuo record: ${best===null?'—':num(best)}</p>
      ${bottone('start',sfida?'Accetta la sfida':'Gioca')}
    </div><div class="non-intro-art" aria-hidden="true"><span class="non-eyebrow">[ UNA SERIE. FINO AL PRIMO ERRORE. ]</span>
      <div class="non-path"><span>1</span><span>2</span><span>3</span><b>…</b><span>×</span></div>
      <strong>Quanto vai avanti?</strong><p>Niente fretta. Leggi gli indizi, fai la tua scelta.<br>Il prossimo record è tutto da scrivere.</p>
    </div></section>`;
  }
  function errore(tipo='tecnico'){
    mount.setAttribute('aria-busy','false');
    mount.innerHTML=`<section class="non-feedback non-feedback--end"><h2 id="non-error-title" tabindex="-1">${esc(N.errori[tipo])}</h2>
      ${stato?`<p>${num(stato.score)} risposte corrette consecutive. Il tuo record: ${best===null?'—':num(best)}.</p>`:''}
      <div class="non-actions">${tipo==='tecnico'&&stato?bottone('recover','Riprova a caricare'):''}${bottone('new','Nuova partita',true)}</div></section>`;
    live.textContent=N.errori[tipo];focus('non-error-title');
  }
  function nomeComune(o){return GEOGRAFIA_ITALIA.risolvi(o.comune).comune.nome;}
  function carta(lato,rivelata){
    const r=stato.round,o=r[lato],other=r[lato==='A'?'B':'A'];
    const scelta=stato.scelte.at(-1),vince=r.vincitore===lato;
    const fields=[['Mensilità',esc(o.mensilitaRaw)],
      ['Costi del lavoro / mese',`Trasporto ${euro(C.inCentesimi(o.trasportoRaw))}<br>Altre spese ${euro(C.inCentesimi(o.altreSpeseRaw))}`]];
    if(o.comune!==other.comune)fields.push(['Domicilio fiscale previsto nello scenario',esc(nomeComune(o))]);
    if(Number(o.welfareRaw)||Number(other.welfareRaw))fields.push(['Welfare esente / anno',euro(C.inCentesimi(o.welfareRaw))]);
    if(Number(o.fringeRaw)||Number(other.fringeRaw))fields.push(['Fringe benefit / anno',euro(C.inCentesimi(o.fringeRaw))]);
    let conti='';
    if(rivelata){
      const res=r.esito.risultati[lato],c=S.catenaContabile(res);
      const costo=r.esito.righe.find(x=>x.chiave==='costi')[lato.toLowerCase()];
      const disponibile=r.esito.righe.find(x=>x.chiave==='dopoCosti')[lato.toLowerCase()];
      const righe=[['− Contributi',c.contributi],['− Imposte nette',c.imposte],
        ...(c.integrazioni?[['+ Integrazioni',c.integrazioni]]:[]),['= Netto annuo in busta',c.netto],['− Costi del lavoro annui',costo]];
      conti=`<div class="non-reveal"><p class="non-choice${scelta===lato&&!vince?' non-choice--wrong':''}">${vince?'✓ Più disponibile':'Meno disponibile'}${scelta===lato?' · La tua scelta':''}</p>
        <dl class="non-chain">${righe.map(([label,v])=>`<div${label.startsWith('=')?' class="non-net"':''}><dt>${label}</dt><dd>${euro(v)}</dd></div>`).join('')}</dl>
        <p class="non-available">= Disponibile annuo<strong>${euro(disponibile)}</strong></p>
        ${(Number(o.welfareRaw)||Number(other.welfareRaw)||Number(o.fringeRaw)||Number(other.fringeRaw))?`<p class="non-benefit">Benefit non monetari: <b>${euro(C.inCentesimi(res.kpi.benefitSpendibili))}/anno</b><br>Separati dal disponibile.</p>`:''}</div>`;
    }
    return`<article class="non-offer${rivelata&&vince?' non-offer--winner':''}" aria-label="Offerta ${lato}">
      <h3><span class="non-letter" aria-hidden="true">${lato}</span>Offerta ${lato}</h3>
      <p class="non-ral">${num(Number(o.ralRaw))} €</p><p class="non-ral-label">RAL annua</p>
      <dl class="non-fields">${fields.map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
      ${rivelata?conti:bottone(lato,`Scelgo ${lato}`)}</article>`;
  }
  function dettagli(){
    const r=stato.round,ris=r.esito.risultati;
    const maps={};
    for(const l of ['A','B'])maps[l]=new Map(componiRighe(ris[l].voci).map((v,i)=>[v.id,{...v,importo:ris[l].voci[i].importo}]));
    const ids=[...new Set([...maps.A.keys(),...maps.B.keys()])];
    const cell=v=>v?`<strong>${euro(C.inCentesimi(v.importo))}</strong><p>${esc(v.formula)}</p><a href="${esc(v.fonte.url)}" target="_blank" rel="noopener noreferrer">${esc(v.fonte.titolo)}</a>`:'Non presente';
    return`<details class="non-detail"><summary>Come sono fatti i conti</summary><div>
      <p>Importi annui. Le imposte nette sono la somma delle voci arrotondate del motore, detrazioni già incluse. Questa è la catena che ricostruisce il netto al centesimo.</p>
      <table class="non-table"><caption>Voci e fonti delle offerte A e B</caption><thead><tr><th scope="col">Voce</th><th scope="col">Offerta A</th><th scope="col">Offerta B</th></tr></thead><tbody>
      ${ids.map(id=>`<tr><th scope="row">${esc((maps.A.get(id)||maps.B.get(id)).titolo)}</th><td>${cell(maps.A.get(id))}</td><td>${cell(maps.B.get(id))}</td></tr>`).join('')}
      </tbody></table></div></details>`;
  }
  function bersaglio(){
    if(stato.target===null)return'';
    const t=stato.target,n=stato.score;
    const msg=n===t?'Hai pareggiato il record della sfida.':n>t?'Hai superato il record della sfida. Quanto vai avanti?':`Per batterlo devi arrivare a ${num(t+1)}.`;
    return`<p class="non-target">${stato.mode==='replay'?'Rivincita · ':''}Il tuo amico ha fatto ${num(t)}. ${msg}</p>`;
  }
  function risultato(){
    const dati=datiRisultato();
    return`<section class="non-result" aria-labelledby="non-result-title">
      <div class="non-receipt" id="non-receipt"></div>
      <div class="non-result-copy"><p class="non-eyebrow">[ PARTITA CHIUSA. SFIDA APERTA. ]</p>
        <h2 id="non-result-title" tabindex="-1">${num(stato.score)} di fila.<br>Chi fa meglio?</h2>
        ${recordInRun?'<p class="non-badge">Nuovo record personale!</p>':''}
        <p>Il tuo risultato è pronto da condividere.</p>
        <div class="non-result-actions">${bottone('share','Condividi')}${bottone('new','Riprova',true)}</div>
        <p class="non-share-hint" id="non-share-hint">LinkedIn, X, WhatsApp e Telegram.</p>
      </div>
    </section>
    <dialog id="non-share-dialog" class="non-share-dialog" aria-labelledby="non-share-title" aria-describedby="non-share-description">
      <div class="non-dialog-heading"><h2 id="non-share-title">Condividi il risultato</h2>
        <button class="non-dialog-close" type="button" data-action="close-share" aria-label="Chiudi condivisione" autofocus>×</button></div>
      <p id="non-share-description">Scegli dove pubblicarlo. Il link porta alla tua sfida, con lo scontrino in anteprima.</p>
      <a class="non-social-preview" href="${esc(dati.url)}" target="_blank" rel="noopener noreferrer" aria-label="Apri l’anteprima del tuo risultato">
        <img id="non-og-preview" alt="${esc(dati.alt)}" width="1200" height="630">
        <span><strong>${esc(dati.score)} di fila. ${esc(dati.invito)}</strong><small>dovevalatuaral.com</small></span>
      </a>
      <p id="non-preview-status" class="non-share-hint" role="status" hidden></p>
      <div class="non-social-buttons">${H.destinazioni(dati).map(d=>`<a class="non-button non-button--secondary" href="${esc(d.url)}" target="_blank" rel="noopener noreferrer" data-share-destination="${d.method}">${d.nome}<span aria-hidden="true">↗</span></a>`).join('')}</div>
      <div class="non-dialog-extras">${bottone('copy','Copia link',true)}<a id="non-save-receipt" class="non-download-link" hidden>Salva immagine</a></div>
      <p class="non-share-hint">Confermi il post nel social scelto. L’anteprima può richiedere qualche secondo; aspetto e ritaglio dipendono dal social.</p>
      <div id="non-share-status" class="non-share-status" role="status"></div>
    </dialog>`;
  }
  function preparaScontrino(){
    if(!stato||stato.fase!=='FINE')return;
    const box=document.getElementById('non-receipt');if(!box)return;
    scontrino=datiRisultato();
    try{
      scontrino=H.prepara(stato,shareOrigin);
      const img=document.createElement('img');img.src=scontrino.src;img.alt=scontrino.alt;
      img.width=1080;img.height=1350;box.replaceChildren(img);
      const salva=document.getElementById('non-save-receipt');
      salva.href=scontrino.src;salva.download=scontrino.nomeFile;salva.hidden=false;
    }catch(_){
      box.textContent=`NETTO O NIENTE · ${scontrino.score} di fila. ${scontrino.invito}`;
      document.getElementById('non-share-hint').textContent='Testo e link pronti da condividere.';
    }
  }
  function render(spostaFocus=false){
    document.body.classList.add('non-playing');
    if(stato.fase==='ERRORE'){errore();return;}
    const r=stato.round,reveal=stato.fase!=='DOMANDA',end=stato.fase==='FINE';
    const spiegazione=reveal?N.costruisciSpiegazione(r):null;
    const titolo=end?(stato.score===0?'La RAL ti ha fregato al primo confronto.':`${num(stato.score)} di fila. La serie finisce qui.`):`Esatto. ${num(stato.score)} di fila.`;
    const badge=({5:'5 di fila. Hai preso il ritmo.',10:'10 di fila. Occhio allenato.',20:'20 di fila. Ora sei un fuoriclasse.',50:'50 di fila. Una serie da raccontare.'})[stato.score];
    mount.setAttribute('aria-busy','false');
    scontrino=null;
    mount.innerHTML=`${end?risultato():''}<div class="non-toolbar"><span class="non-score" aria-label="${stato.score} risposte corrette consecutive">${num(stato.score)} di fila</span><span class="non-record">Il tuo record: ${best===null?'—':num(best)}</span></div>
      ${bersaglio()}<p class="non-round-label"><span>Confronto ${num(stato.indice)}</span><span>${S.LIVELLI[r.livello].nome}</span></p>
      <h2 class="non-question" id="non-question" tabindex="-1">Quale offerta ti lascia più soldi in un anno, dopo i costi del lavoro?</h2>
      <p class="non-contract">Confrontiamo il netto annuo in busta meno i costi del lavoro indicati. Welfare e fringe benefit restano separati.</p>
      <p class="non-profile">Dipendente privato · Anno intero · Un datore e un reddito · Senza familiari a carico · Buoni pasto: 0.
      ${r.A.comune===r.B.comune?`<br>Domicilio fiscale previsto nello scenario: <b>${esc(nomeComune(r.A))}</b>.`:''}
      ${r.livello>=3?' Condizioni annuali stabili, nessun trasferimento in corso d’anno.':''}</p>
      <div class="non-offers">${carta('A',reveal)}${carta('B',reveal)}</div>
      ${reveal?`<section class="non-feedback${end?' non-feedback--end':''}" aria-labelledby="non-feedback-title">
        <h2 id="non-feedback-title" tabindex="-1">${titolo}</h2>
        ${end?`<p>Hai sbagliato il confronto ${num(stato.indice)}.</p>`:''}
        ${recordInRun?'<p class="non-badge">Nuovo record personale!</p>':''}
        ${badge&&!end?`<p class="non-badge">${badge}</p>`:''}
        <p>${esc(spiegazione.frase)}</p>${spiegazione.note.map(n=>`<p>${esc(n)}</p>`).join('')}
        <div class="non-actions">${end?(stato.target!==null?bottone('replay','Rigioca questa sfida',true):''):bottone('next','Prossimo confronto')}
        <a class="non-button non-button--secondary" data-comparison href="compara.html#${esc(C.codificaStato({A:r.A,B:r.B}))}" target="_blank" rel="noopener noreferrer">Apri questo confronto ↗</a></div>
      </section>${dettagli()}`:''}`;
    if(end)preparaScontrino();
    if(end){
      const img=document.getElementById('non-og-preview'),status=document.getElementById('non-preview-status');
      img.addEventListener('error',()=>{img.hidden=true;status.hidden=false;status.textContent='Anteprima immagine non caricata. Puoi aprire il risultato per riprovare.';});
      img.addEventListener('load',()=>{img.hidden=false;status.hidden=true;});
      img.src=datiRisultato().immagine;
      const dialog=document.getElementById('non-share-dialog');
      dialog.addEventListener('close',()=>focusShare());
      dialog.addEventListener('keydown',e=>{
        if(e.key!=='Tab')return;
        const controls=[...dialog.querySelectorAll('a[href],button:not(:disabled),textarea')].filter(el=>el.getClientRects().length);
        const first=controls[0],last=controls.at(-1);
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
      });
      dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
    }
    if(spostaFocus){
      live.textContent=reveal?`${titolo} ${spiegazione.frase}`:`Confronto ${stato.indice}. ${S.LIVELLI[r.livello].nome}.`;
      focus(end?'non-result-title':reveal?'non-feedback-title':'non-question');
      if(end)document.querySelector('.non-result').scrollIntoView({block:'start'});
    }
  }
  function avvia(mode){
    epoch++;recordInRun=false;replayDaRecuperare=false;scontrino=null;
    const seed=sfida?sfida.seed:seedNuovo(),target=sfida?sfida.target:null;
    stato=N.creaPartita({seed,target,mode});salva();render(true);
    if(stato.fase==='DOMANDA')evento('non_start',{mode});
  }
  function nuova(){sfida=null;history.replaceState(null,'',location.pathname+location.search);avvia('free');}
  function esitoShare(messaggio){const el=document.getElementById('non-share-status');if(el)el.textContent=messaggio;}
  function focusShare(){const b=mount.querySelector('[data-action="share"]');if(b)b.focus();}
  function condividi(){
    if(!stato||stato.fase!=='FINE')return;
    const dialog=document.getElementById('non-share-dialog');if(dialog.open)return;
    esitoShare('');dialog.showModal();evento('non_share_open',{});
  }
  async function copia(button){
    if(!stato||stato.fase!=='FINE')return;
    const turno=epoch,{url}=scontrino||datiRisultato();button.disabled=true;
    try{
      if(navigator.clipboard&&typeof navigator.clipboard.writeText==='function'){
        try{await navigator.clipboard.writeText(url);if(turno===epoch){evento('non_share',{method:'clipboard'});esitoShare('Link copiato');}return;}catch(_){/* fallback manuale */}
      }
      if(turno!==epoch)return;
      const el=document.getElementById('non-share-status');
      el.textContent='La copia automatica non è disponibile. Puoi copiare questo link:';
      const label=document.createElement('label');label.textContent='Link della sfida con anteprima';
      const field=document.createElement('textarea');field.className='non-share-field';field.readOnly=true;field.value=url;
      label.append(field);el.append(label);field.focus();field.select();evento('non_share',{method:'manual'});
    }finally{if(turno===epoch)button.disabled=false;}
  }
  // Niente click ripetuti o Enter tenuto premuto durante un ridisegno.
  mount.addEventListener('keydown',e=>{if(e.repeat&&(e.key==='Enter'||e.key===' '))e.preventDefault();});
  mount.addEventListener('click',e=>{
    if(e.detail>1){e.preventDefault();return;}
    const link=e.target.closest('[data-comparison]');
    if(link){evento('non_open_comparison',{round:stato.indice});return;}
    const destinazione=e.target.closest('[data-share-destination]');
    if(destinazione){evento('non_share_destination',{method:destinazione.dataset.shareDestination});return;}
    if(e.target.closest('#non-save-receipt')){evento('non_share_download',{format:'png'});return;}
    const button=e.target.closest('button[data-action]');if(!button||button.disabled)return;
    const action=button.dataset.action;
    if(action==='start'){avvia(sfida?'challenge':'free');return;}
    if(action==='new'){nuova();return;}
    if(action==='share'){condividi();return;}
    if(action==='close-share'){document.getElementById('non-share-dialog').close();return;}
    if(action==='copy'){void copia(button);return;}
    if(action==='replay'){sfida={seed:stato.seed,target:stato.target};avvia('replay');return;}
    if(action==='recover'){
      if(replayDaRecuperare){void ingresso();return;}
      if(stato.riprendi)stato=N.prossimo({...stato,fase:stato.riprendi});
      else stato=N.creaPartita(stato);
      salva();render(true);return;
    }
    if(!stato)return;
    if((action==='A'||action==='B')&&stato.fase==='DOMANDA'){
      mount.querySelectorAll('[data-action="A"],[data-action="B"]').forEach(b=>b.disabled=true);
      stato=N.rispondi(stato,action);salva();aggiornaRecord();
      evento('non_answer',{round:stato.indice,tier:stato.round.livello+1,correct:stato.fase==='RIVELAZIONE'});
      if(stato.fase==='FINE')evento('non_end',{score:stato.score,mode:stato.mode});
      render(true);
    }else if(action==='next'&&stato.fase==='RIVELAZIONE'){
      button.disabled=true;stato=N.prossimo(stato);salva();render(true);
    }
  });
  async function ingresso(){
    const turno=++epoch;stato=null;recordInRun=false;replayDaRecuperare=false;scontrino=null;
    const parsed=N.decodificaSfida(location.hash);
    if(!parsed.ok){sfida=null;errore(parsed.errore);return;}
    sfida=parsed.sfida;
    const rawBest=leggiStorage('localStorage',bestKey);best=N.leggiRecord(rawBest);
    if(rawBest!==null&&best===null)corrotto=true;
    const raw= sessionOk?leggiStorage('sessionStorage',runKey):memoriaRun;
    const saved=raw===null?null:N.leggiRun(raw);
    if(raw!==null&&!saved)corrotto=true;
    avvisoStorage();
    const coerente=saved&&(sfida?saved.seed===sfida.seed&&saved.target===sfida.target:saved.target===null);
    if(!coerente){intro();return;}
    mount.setAttribute('aria-busy','true');mount.textContent='Ripristiniamo la tua partita…';
    const replay=N.ripristinaRun(saved);let step=replay.next();
    while(!step.done){
      mount.textContent=`Ripristiniamo la tua partita… ${num(step.value.elaborate)} risposte ricalcolate.`;
      await new Promise(resolve=>setTimeout(resolve,0));if(turno!==epoch)return;step=replay.next();
    }
    if(turno!==epoch)return;
    stato=step.value;
    // Un errore tecnico nel replay non sovrascrive la cronologia completa
    // con il solo prefisso ricostruito: il prossimo tentativo la rileggerà.
    if(stato.fase==='ERRORE'){replayDaRecuperare=true;errore();return;}
    salva();
    if(stato.score>0||stato.fase==='FINE')aggiornaRecord();
    render();
  }
  window.addEventListener('hashchange',()=>void ingresso());
  window.addEventListener('storage',e=>{if(e.key===bestKey){const n=N.leggiRecord(e.newValue);if(n!==null)best=Math.max(best||0,n);}});
  // Anche un ripristino velocissimo aggiorna la card quando i font locali sono pronti.
  if(document.fonts)document.fonts.ready.then(preparaScontrino).catch(()=>{});
  void ingresso();
})();

CALCOLATORE_AVVIO.pronto();
}
