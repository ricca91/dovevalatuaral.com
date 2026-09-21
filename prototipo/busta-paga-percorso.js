/* Anteprima e report sono risposte diverse del server. Qui non si nascondono
   sezioni già scaricate: il report arriva solo dopo la verifica del pagamento. */
(()=>{
  'use strict';
  const I=window.BUSTA_PAGA_INVIO,A=window.BUSTA_PAGA_ACCESSO,V=window.BUSTA_PAGA_RISULTATO;
  const $=id=>document.getElementById(id),box=$('bp-acquisto');
  if(!box)return;
  let occupato=false,timer=null,versione=0;
  const messaggi={
    CONFIGURAZIONE_MANCANTE:'Il percorso è in preparazione. Analisi e acquisti non sono ancora disponibili.',
    ACCESSO_NON_VALIDO:'Non troviamo questo accesso. Apri il link privato salvato oppure avvia una nuova analisi.',
    SESSIONE_SCADUTA:'Questo report è scaduto o è stato cancellato. Non effettuare un altro pagamento per recuperarlo: contatta l’assistenza con il riferimento ordine.',
    ANALISI_INTERROTTA:'L’analisi si è interrotta. Non hai pagato nulla. Cancella questo tentativo prima di riprovare.',
    OPERAZIONE_DIVERSA:'Il testo è cambiato dopo l’invio. Cancella il tentativo precedente prima di analizzare il nuovo testo.',
    REPORT_NON_UTILIZZABILE:'Non abbiamo individuato abbastanza dati per un report utile. Il pagamento è bloccato. Prova un PDF digitale più completo.',
    PAGAMENTO_IN_CORSO:'Stiamo verificando un pagamento già avviato. Aggiorna lo stato tra poco; non avviare un secondo acquisto.',
    PAGAMENTO_NON_VALIDO:'Il pagamento richiede una verifica. Conserva il riferimento ordine e contatta l’assistenza.',
    MEMORIA_NON_DISPONIBILE:'Il browser impedisce di conservare l’accesso al report. Consenti la memoria di sessione prima di continuare.',
    TROPPE_RICHIESTE:'Hai effettuato diversi tentativi. Attendi prima di riprovare.',
    SERVIZIO_NON_DISPONIBILE:'Non riusciamo a verificare lo stato. Usa “Aggiorna stato”: il tentativo e il pagamento già avviati restano gli stessi.',
  };
  const misura=nome=>window.BUSTA_PAGA_MISURA?.evento(nome);
  function errore(codice){
    box.hidden=false;
    $('bp-acquisto-stato').textContent=messaggi[codice]||window.BUSTA_PAGA_ESTRAZIONE.MESSAGGI[codice]?.cosaFare||messaggi.SERVIZIO_NON_DISPONIBILE;
    $('bp-paga').disabled=true;
    $('bp-riprova-stato').hidden=!A.leggi();
  }
  function nodo(tag,testo,classe){const n=document.createElement(tag);n.textContent=testo;if(classe)n.className=classe;return n;}
  function mostra(esito){
    clearTimeout(timer);box.hidden=false;
    if(!esito?.ok){errore(esito?.codice);return;}
    $('bp-riprova-stato').hidden=false;
    if(esito.stato==='analisi'){
      $('bp-acquisto-stato').textContent='Prepariamo il report completo. Puoi recuperare lo stato senza inviare di nuovo il testo.';
      $('bp-paga').disabled=true;timer=setTimeout(aggiorna,3000);return;
    }
    $('bp-anteprima').textContent='';
    const a=esito.anteprima,p=esito.prezzo;
    $('bp-anteprima').append(nodo('p',a.periodo?.sourceValue||'Periodo non individuato','bp-eyebrow'));
    const totali=nodo('dl','','bp-acquisto-totali');
    for(const [k,label] of [['competenze','Competenze'],['trattenute','Trattenute'],['netto','Netto']]){
      const gruppo=document.createElement('div');
      gruppo.append(nodo('dt',label),nodo('dd',a.totali[k]?.sourceValue||'non individuato'));
      totali.append(gruppo);
    }
    $('bp-anteprima').append(totali,nodo('h3',a.estratto.sourceLabel),nodo('p',a.estratto.plainExplanation),
      nodo('p','Fonte: '+a.estratto.sourceReference,'bp-invio-nota'));
    const elenco=nodo('ul','');for(const s of a.sezioni)elenco.append(nodo('li',s));
    $('bp-sezioni-acquisto').replaceChildren(elenco);
    $('bp-prezzo-acquisto').textContent=(p.test?'Prezzo di test, nessun addebito reale: ':'Pagamento una tantum: ')+
      new Intl.NumberFormat('it-IT',{style:'currency',currency:p.valuta}).format(p.importo/100);
    $('bp-riferimento').textContent='Riferimento ordine: '+esito.ordine;
    $('bp-scadenza').textContent='Accesso fino al '+new Date(esito.scadenza).toLocaleString('it-IT')+'.';
    $('bp-recupero').hidden=false;
    $('bp-link-recupero').value=A.link();
    const pagato=esito.stato==='pagato';
    $('bp-offerta').hidden=pagato;
    $('bp-paga').disabled=pagato;
    $('bp-stampa').hidden=!pagato;
    $('bp-acquisto-stato').textContent=pagato?'Pagamento verificato. Il report completo è disponibile.':
      A.ritorno==='annullato'?'Pagamento annullato: la tua anteprima è ancora qui. Puoi riprendere lo stesso checkout.':
        'La tua anteprima è pronta. Il report completo è già preparato.';
    $('bp-risultato').hidden=!pagato;
    if(pagato){V.rendi($('bp-risultato-corpo'),esito.report.analisi,esito.report.motore);}
    else{$('bp-risultato-corpo').textContent='';misura('payslip_preview');}
  }
  async function aggiorna(){
    if(occupato)return;
    const v=versione;occupato=true;$('bp-riprova-stato').disabled=true;
    const e=await I.stato();occupato=false;$('bp-riprova-stato').disabled=false;
    if(v===versione)mostra(e);
  }
  $('bp-riprova-stato').addEventListener('click',aggiorna);
  $('bp-paga').addEventListener('click',async()=>{
    if(occupato)return;occupato=true;$('bp-paga').disabled=true;
    $('bp-acquisto-stato').textContent='Apro il pagamento sicuro…';
    const e=await I.checkout();occupato=false;
    if(e.ok&&e.url){
      // Il link privato non viene mai trasferito a Stripe.
      try{const u=new URL(e.url);if(u.protocol!=='https:'||u.hostname!=='checkout.stripe.com')throw new Error();
        misura('payslip_checkout');location.assign(u.href);
      }catch(_){errore('SERVIZIO_NON_DISPONIBILE');}
    }else if(e.ok)mostra(e);else errore(e.codice);
  });
  $('bp-stampa').addEventListener('click',()=>window.print());
  $('bp-link-recupero').addEventListener('click',e=>e.target.select());
  $('bp-cancella-server').addEventListener('click',()=>window.dispatchEvent(new Event('bp-cancella')));
  function azzera(){versione++;clearTimeout(timer);box.hidden=true;$('bp-anteprima').textContent='';
    $('bp-link-recupero').value='';$('bp-recupero').hidden=true;$('bp-offerta').hidden=true;}
  const pronto=I.configurazione().then(c=>{
    const attivo=c.ok&&A.disponibile;
    $('bp-configurazione').textContent=attivo?
      (c.prezzo.test?'Versione test. ':'')+'Anteprima gratuita; report una tantum a '+
      new Intl.NumberFormat('it-IT',{style:'currency',currency:c.prezzo.valuta}).format(c.prezzo.importo/100)+'.':
      A.disponibile?messaggi.CONFIGURAZIONE_MANCANTE:messaggi.MEMORIA_NON_DISPONIBILE;
    if(A.leggi())aggiorna();
    return attivo;
  });
  window.BUSTA_PAGA_PERCORSO={mostra,errore,azzera,pronto};
})();
