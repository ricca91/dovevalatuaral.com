/* ============================================================
   BUSTA PAGA — LA PAGINA.

   Tiene insieme lettore, redazione e schermo. Tre regole che
   valgono per tutto il file:

   1. Il testo mostrato nel riquadro è lo stesso che partirà:
      lo produce `applica()` una volta sola, e da lì nascono sia
      i bottoni sia la stringa. Non esiste un riassunto di cosa
      è stato oscurato che possa divergere da ciò che parte.
   2. Niente `localStorage`, niente `sessionStorage`, nessuna
      richiesta di rete. Il documento vive in questa scheda.
   3. Nessun messaggio a schermo riporta un pezzo del documento,
      nemmeno il nome del file: spesso contiene il cognome.
   4. La rete la tocca un file solo, `busta-paga-invio.js`, e la
      misurazione un file solo, `busta-paga-misura.js`. Qui si
      chiamano, non si reimplementano: è quello che permette alle
      prove di dire «da questo file non esce niente» leggendolo.
   ============================================================ */
(()=>{
  'use strict';
  const E=window.BUSTA_PAGA_ESTRAZIONE;
  const R=window.BUSTA_PAGA_REDAZIONE;
  const I=window.BUSTA_PAGA_INVIO;
  const V=window.BUSTA_PAGA_RISULTATO;
  const M=window.BUSTA_PAGA_MISURA;

  /* L'invio è attivo da RIC-69. La costante resta perché è l'interruttore: a
     `false` il percorso torna interamente locale senza toccare altro. La logica
     del consenso non cambia — senza spunta il pulsante è disattivo comunque. */
  const INVIO_ATTIVO=true;
  const ATTESA_LETTORE=20000;

  const $=id=>document.getElementById(id);
  const file=$('bp-file');
  const stato=$('bp-stato');
  const errore=$('bp-errore');
  const errore_titolo=$('bp-errore-titolo');
  const errore_cosa=$('bp-errore-cosa');
  const revisione=$('bp-revisione');
  const payload=$('bp-payload');
  const legenda=$('bp-legenda');
  const conteggio=$('bp-conteggio');
  const consenso=$('bp-consenso');
  const invia=$('bp-invia');
  const nota=$('bp-invio-nota');
  const ricomincia=$('bp-ricomincia');
  const live=$('bp-live');
  const risultato=$('bp-risultato');
  const risultatoCorpo=$('bp-risultato-corpo');
  const feedback=$('bp-feedback');
  const feedbackGrazie=$('bp-feedback-grazie');
  if(!file||!payload)return;

  const misura=(nome,proprieta)=>{if(M)M.evento(nome,proprieta);};
  misura('payslip_view');

  let righe=[];
  let redazione=null;
  /* Un cedolino sono qualche centinaio di parole, e ognuna è un bottone. Con un
     bottone per tabulazione uscire dal riquadro costerebbe trecento Tab: il
     riquadro è quindi un gruppo a tabindex mobile — una sola parola nel percorso
     di tabulazione, le frecce per muoversi dentro. */
  let attivo=0;

  const annuncia=testo=>{if(live)live.textContent=testo;};
  const mostraStato=testo=>{if(stato)stato.textContent=testo;};

  function mostraErrore(codice){
    const messaggio=E.MESSAGGI[codice]||E.MESSAGGI.PDF_ILLEGGIBILE;
    errore_titolo.textContent=messaggio.titolo;
    errore_cosa.textContent=messaggio.cosaFare;
    errore.hidden=false;
    annuncia(messaggio.titolo);
  }
  const nascondiErrore=()=>{errore.hidden=true;};

  /* Il lettore è un modulo ES e arriva dopo il resto: finché non c'è, il campo
     resta disattivato invece di accettare un file che nessuno saprebbe aprire. */
  const lettorePronto=new Promise((risolvi,rifiuta)=>{
    if(window.BUSTA_PAGA_PDF)return risolvi(window.BUSTA_PAGA_PDF);
    window.addEventListener('busta-paga-pdf-pronto',()=>risolvi(window.BUSTA_PAGA_PDF),{once:true});
    setTimeout(()=>rifiuta(new Error('lettore')),ATTESA_LETTORE);
  });
  lettorePronto.then(()=>{
    file.disabled=false;
    mostraStato('Pronto. Il file resta in questa scheda.');
  }).catch(()=>{
    mostraStato('');
    errore_titolo.textContent='Il lettore di PDF non si è caricato.';
    errore_cosa.textContent='Ricarica la pagina. Se succede di nuovo, serve un browser aggiornato: questa pagina usa i moduli JavaScript.';
    errore.hidden=false;
  });

  file.addEventListener('change',async()=>{
    const scelto=file.files&&file.files[0];
    if(!scelto)return;
    nascondiErrore();
    azzeraRevisione();
    file.disabled=true;
    mostraStato('Leggo il documento in questa scheda…');
    let esito;
    try{
      const lettore=await lettorePronto;
      esito=await lettore.leggi(scelto);
    }catch(_){
      esito={ok:false,codice:'PDF_ILLEGGIBILE'};
    }finally{
      file.disabled=false;
      // Il File non serve più: lasciarlo appeso al campo terrebbe in vita il
      // riferimento al documento, e il nome del file, per tutta la sessione.
      file.value='';
    }
    /* Un evento solo per la selezione, scattato quando la lettura è finita:
       è lo stesso gesto della persona, e solo qui sappiamo quante pagine
       aveva il documento. Sul fallimento la fascia resta «ignoto», così il
       gradino del funnel non sparisce. */
    misura('payslip_upload_selected',{
      file_type:scelto.type==='application/pdf'?'pdf':'altro',
      page_bucket:esito.ok&&M?M.fasciaPagine(esito.pagine):'ignoto',
    });
    misura('payslip_extraction',{success:Boolean(esito.ok),error_code:esito.ok?null:esito.codice});

    if(!esito.ok){
      mostraStato('');
      mostraErrore(esito.codice);
      return;
    }
    righe=esito.righe;
    redazione=R.statoIniziale(righe);
    mostraStato(`Letto: ${esito.pagine} ${esito.pagine===1?'pagina':'pagine'}, ${righe.length} righe. Il PDF non è uscito da qui.`);
    rendi();
    revisione.hidden=false;
    annuncia('Documento letto. Controlla il testo prima di confermare.');
    revisione.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});
  });

  function azzeraRevisione(){
    righe=[];redazione=null;
    revisione.hidden=true;
    payload.textContent='';
    legenda.textContent='';
    if(consenso)consenso.checked=false;
    azzeraRisultato();
    aggiornaInvio();
  }

  /* La sessione locale è tutta qui dentro: svuotare questi nodi è davvero
     cancellarla, perché non esiste nessuna copia altrove — né in memoria del
     browser, né sul server, che non ha conservato niente. */
  function azzeraRisultato(){
    if(risultato)risultato.hidden=true;
    if(risultatoCorpo)risultatoCorpo.textContent='';
    if(feedback)feedback.hidden=false;
    if(feedbackGrazie)feedbackGrazie.hidden=true;
  }

  function bottoneSegmento(segmento,indiceRiga){
    const bottone=document.createElement('button');
    bottone.type='button';
    bottone.className='bp-parola';
    bottone.textContent=segmento.testo;
    bottone.dataset.riga=String(indiceRiga);
    bottone.dataset.parole=segmento.parole.join(',');
    bottone.setAttribute('aria-pressed',String(segmento.oscurato));
    bottone.tabIndex=-1;   // tabindex mobile: si entra una volta sola, poi frecce
    if(segmento.oscurato){
      bottone.dataset.oscurato='';
      const quante=segmento.parole.length;
      bottone.setAttribute('aria-label',quante===1
        ?`${R.TIPI[segmento.tipo].etichetta}: una parola oscurata. Premi per riportarla nel testo.`
        :`${R.TIPI[segmento.tipo].etichetta}: ${quante} parole oscurate. Premi per riportarle nel testo.`);
    }
    return bottone;
  }

  function rendi(fuoco){
    const {righe:redatte,elenco}=R.applica(righe,redazione);
    payload.textContent='';
    let pagina=null;
    redatte.forEach((riga,indice)=>{
      if(pagina!==null&&riga.pagina!==pagina){
        const marcatore=document.createElement('p');
        marcatore.className='bp-pagina';
        marcatore.textContent=`[PAGINA ${riga.pagina}]`;
        payload.appendChild(marcatore);
      }
      pagina=riga.pagina;
      const elemento=document.createElement('p');
      elemento.className='bp-riga';
      riga.segmenti.forEach((segmento,posizione)=>{
        if(posizione)elemento.appendChild(document.createTextNode(' '));
        elemento.appendChild(bottoneSegmento(segmento,indice));
      });
      payload.appendChild(elemento);
    });

    legenda.textContent='';
    for(const voce of elenco){
      const item=document.createElement('li');
      const titolo=document.createElement('p');
      titolo.className='bp-legenda__titolo';
      const nome=document.createElement('strong');
      nome.textContent=voce.etichetta;
      const quante=document.createElement('span');
      quante.className='mono bp-legenda__conteggio';
      quante.textContent=`×${voce.conteggio}`;
      titolo.append(nome,' ',quante);
      const perche=document.createElement('p');
      perche.className='bp-legenda__motivo';
      perche.textContent=voce.motivo;
      item.append(titolo,perche);
      legenda.appendChild(item);
    }
    if(!elenco.length){
      const item=document.createElement('li');
      item.textContent='Non abbiamo riconosciuto niente da oscurare. Controlla tu, riga per riga: il riconoscimento automatico non è mai completo.';
      legenda.appendChild(item);
    }

    const bottoni=[...payload.querySelectorAll('.bp-parola')];
    attivo=Math.max(0,Math.min(attivo,bottoni.length-1));
    if(bottoni[attivo])bottoni[attivo].tabIndex=0;

    const oscurate=Object.keys(redazione.oscurate).length;
    conteggio.textContent=oscurate===1?'1 parola oscurata':`${oscurate} parole oscurate`;

    if(fuoco){
      const bottone=[...payload.querySelectorAll(`.bp-parola[data-riga="${fuoco.riga}"]`)]
        .find(b=>b.dataset.parole.split(',').includes(String(fuoco.parola)));
      if(bottone){
        bottoni.forEach(b=>{b.tabIndex=-1;});
        attivo=bottoni.indexOf(bottone);
        bottone.tabIndex=0;
        bottone.focus();
      }
    }
  }

  payload.addEventListener('click',evento=>{
    const bottone=evento.target.closest('.bp-parola');
    if(!bottone||!redazione)return;
    const riga=Number(bottone.dataset.riga);
    const indici=bottone.dataset.parole.split(',').map(Number);
    const eraOscurato=bottone.hasAttribute('data-oscurato');
    for(const parola of indici)redazione=R.commuta(redazione,riga,parola);
    rendi({riga,parola:indici[0]});
    annuncia(eraOscurato
      ?(indici.length===1?'Parola riportata nel testo.':`${indici.length} parole riportate nel testo.`)
      :'Parola oscurata.');
  });

  payload.addEventListener('focusin',evento=>{
    const bottone=evento.target.closest('.bp-parola');
    if(!bottone)return;
    const bottoni=[...payload.querySelectorAll('.bp-parola')];
    bottoni.forEach(b=>{b.tabIndex=-1;});
    attivo=bottoni.indexOf(bottone);
    bottone.tabIndex=0;
  });

  payload.addEventListener('keydown',evento=>{
    const bottone=evento.target.closest('.bp-parola');
    if(!bottone)return;
    const bottoni=[...payload.querySelectorAll('.bp-parola')];
    const posizione=bottoni.indexOf(bottone);
    const riga=Number(bottone.dataset.riga);
    let prossima=null;
    if(evento.key==='ArrowRight')prossima=posizione+1;
    else if(evento.key==='ArrowLeft')prossima=posizione-1;
    else if(evento.key==='Home')prossima=0;
    else if(evento.key==='End')prossima=bottoni.length-1;
    else if(evento.key==='ArrowDown'||evento.key==='ArrowUp'){
      const cercata=riga+(evento.key==='ArrowDown'?1:-1);
      const scelto=bottoni.find(b=>Number(b.dataset.riga)===cercata);
      if(scelto)prossima=bottoni.indexOf(scelto);
    }
    if(prossima===null)return;
    evento.preventDefault();
    const destinazione=bottoni[Math.max(0,Math.min(bottoni.length-1,prossima))];
    if(!destinazione)return;
    bottoni.forEach(b=>{b.tabIndex=-1;});
    attivo=bottoni.indexOf(destinazione);
    destinazione.tabIndex=0;
    destinazione.focus();
  });

  let inCorso=false;

  function aggiornaInvio(){
    if(!invia)return;
    const consentito=Boolean(consenso&&consenso.checked);
    invia.disabled=!INVIO_ATTIVO||!consentito||inCorso;
    if(inCorso){nota.textContent='Sto mandando il testo che vedi qui sopra. Non chiudere la pagina.';return;}
    nota.textContent=!consentito
      ?'Il consenso è obbligatorio: senza spunta il testo non parte.'
      :(INVIO_ATTIVO
        ?'Parte esattamente il testo del riquadro, e nient’altro: non il PDF, non il suo nome. Non viene salvato da nessuna parte.'
        :'Consenso registrato in questa scheda. In questa versione l’invio è disattivato: il testo che vedi non esce di qui.');
  }
  if(consenso)consenso.addEventListener('change',aggiornaInvio);

  /* L'invio. Il testo non si ricostruisce: si prende dalla stessa chiamata che
     ha disegnato il riquadro, così quello che parte e quello che la persona ha
     letto non possono divergere nemmeno per un carattere. */
  const formConferma=$('bp-conferma');
  if(formConferma)formConferma.addEventListener('submit',async evento=>{
    evento.preventDefault();
    if(!INVIO_ATTIVO||inCorso||!redazione||!I)return;
    if(!(consenso&&consenso.checked))return;

    const {testo}=R.applica(righe,redazione);
    if(testo.length>E.LIMITI.caratteriMassimi){
      mostraErrore('TESTO_TROPPO_LUNGO');
      misura('payslip_analysis',{success:false,error_code:'TESTO_TROPPO_LUNGO'});
      return;
    }

    misura('payslip_redaction_confirmed');
    nascondiErrore();
    azzeraRisultato();
    inCorso=true;
    aggiornaInvio();
    mostraStato('Spiegazione in corso. Di solito ci vogliono una ventina di secondi.');
    annuncia('Invio in corso.');

    const esito=await I.analizza(testo);
    inCorso=false;
    aggiornaInvio();

    misura('payslip_analysis',{success:Boolean(esito&&esito.ok),
      error_code:esito&&esito.ok?null:(esito&&esito.codice)||'SERVIZIO_NON_DISPONIBILE'});

    if(!esito||!esito.ok){
      mostraStato('');
      mostraErrore((esito&&esito.codice)||'SERVIZIO_NON_DISPONIBILE');
      return;
    }

    if(esito.analisi.guardie)
      misura('payslip_guards',{dropped_bucket:esito.analisi.guardie.dropped_bucket});

    mostraStato('Spiegazione pronta. Il documento non è stato conservato da nessuna parte.');
    if(V)V.rendi(risultatoCorpo,esito.analisi,esito.motore);
    if(risultato){
      risultato.hidden=false;
      risultato.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});
    }
    annuncia('Spiegazione pronta.');
  });

  /* Il voto. Parte un booleano e basta: nessun testo libero, perché un campo
     di testo sotto un cedolino è un invito a incollarci dentro un cedolino. */
  if(feedback)feedback.addEventListener('click',evento=>{
    const bottone=evento.target.closest('[data-utile]');
    if(!bottone)return;
    misura('payslip_feedback',{useful:bottone.dataset.utile==='si'});
    feedback.hidden=true;
    if(feedbackGrazie)feedbackGrazie.hidden=false;
    annuncia('Grazie, il voto è stato registrato.');
  });

  if(ricomincia)ricomincia.addEventListener('click',()=>{
    azzeraRevisione();
    nascondiErrore();
    mostraStato('Sessione cancellata. Niente è rimasto in questa pagina.');
    annuncia('Sessione cancellata.');
    file.focus();
  });

  aggiornaInvio();
})();
