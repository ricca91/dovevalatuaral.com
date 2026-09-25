if(!CALCOLATORE_AVVIO.errore){
(()=>{
  const R=RETRIBUZIONE_CCNL;
  const COMUNE='F205';
  const form=document.getElementById('ccnl-form');
  const campo=id=>document.getElementById(id);
  const selCcnl=campo('ccnl'),selSezione=campo('sezione'),selLivello=campo('livello');
  const selProfilo=campo('profilo'),status=campo('ccnl-status');
  const box=campo('risultato');
  /* `eur` viene dal motore, non da Intl: la locale italiana non
     raggruppa le migliaia sotto le cinque cifre, e un 1257,46 €
     accanto a un 28.640,22 € nella stessa tabella si nota. Il
     formattatore del motore raggruppa sempre, come tutto il sito. */
  const euro=n=>eur(n);
  const mensilitaTesto=m=>String(m).replace('.',',');
  const movimento=()=>matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth';
  const data=iso=>new Date(iso+'T00:00:00').toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'});
  const opzione=(valore,testo)=>{const o=document.createElement('option');o.value=valore;o.textContent=testo;return o;};
  const sezione=()=>campo('campo-sezione').hidden?null:selSezione.value;

  /* Il selettore viene dal dataset: nessun contratto scritto a mano
     nella pagina, quindi uno nuovo nel dato è uno nuovo qui. */
  for(const contratto of R.CONTRATTI)
    selCcnl.append(opzione(contratto.id,`${contratto.nome} — ${contratto.parti} (${contratto.codiceCnel})`));
  campo('tag-contratti').textContent=`${R.CONTRATTI.length} CCNL privati`;

  /* La sezione compare solo dove il contratto ne ha. Cambiarla, come
     cambiare contratto, rende incompatibili livello, scatti e ore:
     si ricostruisce tutto a valle e si toglie il risultato. */
  function popolaSezioni(){
    const sezioni=R.sezioni(selCcnl.value);
    selSezione.innerHTML='';
    for(const s of sezioni)selSezione.append(opzione(s.id,s.nome));
    campo('campo-sezione').hidden=sezioni.length===0;
  }

  function descriviScatti(regola){
    switch(regola.tipo){
      case 'assenti':return 'Questo contratto non prevede scatti di anzianità.';
      case 'quotaUnica':return 'Nessuno scatto: una quota unica di anzianità forfettaria dal quinto anno nel settore. Scrivi 1 se la percepisci già, 0 se no.';
      case 'percentualeMaturazione':return `Fino a ${regola.massimo}, uno ogni ${regola.cadenzaAnni} anni, ciascuno pari alla tabella del giorno in cui matura: qui serve la data di anzianità, il numero da solo non basta.`;
      default:return `Massimo ${regola.massimo}, uno ogni ${regola.cadenzaAnni} anni. Se lo compili prevale sull’anzianità.`;
    }
  }

  function popolaLivelli(){
    const contratto=R.trovaContratto(selCcnl.value);
    const s=sezione();
    const livelli=R.livelli(selCcnl.value,undefined,s);
    selLivello.innerHTML='';
    for(const livello of livelli)
      selLivello.append(opzione(livello.codice,livello.exCategoria
        ?`${livello.nome} (ex ${livello.exCategoria}ª categoria)`:livello.nome));
    const ore=R.oreContrattuali(selCcnl.value,s);
    const mensilita=R.mensilitaAlla(selCcnl.value,undefined,s);
    const descrizione=s?R.sezioni(selCcnl.value).find(x=>x.id===s).descrizione:'';
    campo('sezione-help').textContent=descrizione||'Questo contratto ha tabelle, scatti o orari diversi per settore o per categoria.';
    campo('ore').placeholder=`${ore} (tempo pieno)`;
    campo('ore').value='';campo('scatti').value='';
    campo('livello-help').textContent=
      `${livelli.length} livelli · ${mensilitaTesto(mensilita)} mensilità · tempo pieno ${ore} ore settimanali.`;
    campo('ccnl-help').textContent=contratto.notaFonte
      ?'Tabelle da fonti non firmatarie: i dettagli sono nel risultato.'
      :'Mensilità e orario a tempo pieno li fissa il contratto.';
    popolaProfili();
  }

  /* Profilo e scatti dipendono dal livello: dove il contratto non
     pubblica il valore dello scatto, o dove un numero da solo non
     basta a ricostruirlo, il campo non si offre invece di fallire
     dopo. */
  function popolaProfili(){
    const s=sezione();
    const livello=R.trovaLivello(selCcnl.value,selLivello.value,undefined,s);
    selProfilo.innerHTML='';
    selProfilo.append(opzione('','Nessuna indennità professionale'));
    for(const p of livello.profili)
      selProfilo.append(opzione(p.id,`${p.nome.charAt(0).toUpperCase()}${p.nome.slice(1)} — ${euro(p.voce.importo)} al mese`));
    campo('campo-profilo').hidden=livello.profili.length===0;

    const regola=R.regolaScatti(selCcnl.value,s);
    const documentati=regola.tipo==='assenti'||regola.tipo==='percentualeMaturazione'
      ?true:(regola.importi?regola.importi[livello.codice]!=null:livello.scatto!=null);
    const nonCalcolabili=!documentati;
    const senzaNumero=nonCalcolabili||regola.tipo==='assenti'||regola.tipo==='percentualeMaturazione';
    campo('scatti').disabled=senzaNumero;
    campo('anzianita').disabled=nonCalcolabili||regola.tipo==='assenti';
    if(campo('anzianita').disabled)campo('anzianita').value='';
    if(senzaNumero)campo('scatti').value='';
    campo('scatti-help').textContent=nonCalcolabili
      ?'Il contratto non pubblica il valore dello scatto per questo livello: il calcolo li lascia fuori e lo dice.'
      :descriviScatti(regola);
    campo('anzianita-help').textContent=nonCalcolabili
      ?'Scatti non calcolabili per questo livello: la data non serve.'
      :`Conta l’${regola.base}. Serve per far decorrere lo scatto dal momento giusto; lascia vuoto se non la sai.`;
  }

  const numero=(raw,{intero=false}={})=>{
    const testo=String(raw??'').trim().replace(/\s|€/g,'');
    if(testo==='')return null;
    const valore=Number(testo.replace(/\.(?=\d{3}(\D|$))/g,'').replace(',','.'));
    if(!Number.isFinite(valore)||valore<0)return NaN;
    return intero?(Number.isInteger(valore)?valore:NaN):valore;
  };

  const nascondi=()=>{box.hidden=true;status.textContent='';
    for(const id of ['anzianita','superminimo','ore','scatti'])
      campo(id).removeAttribute('aria-invalid');};

  selCcnl.addEventListener('change',()=>{popolaSezioni();popolaLivelli();nascondi();});
  selSezione.addEventListener('change',()=>{popolaLivelli();nascondi();});
  selLivello.addEventListener('change',()=>{popolaProfili();nascondi();});
  for(const id of ['livello','sezione','profilo','anzianita','superminimo','ore','scatti'])
    campo(id).addEventListener('input',nascondi);

  function riga(nome,importo,classe=''){
    return `<tr${classe?` class="${classe}"`:''}><td>${nome}</td><td>${euro(importo)}</td></tr>`;
  }

  function rigaScatti(composta,regola){
    if(!composta.scattiPrevisti)return riga('Scatti di anzianità — il contratto non li prevede',0);
    if(!composta.scattiDocumentati)return riga('Scatti di anzianità — non calcolabili per questo livello',0);
    if(composta.numeroScatti===0)return riga(regola.tipo==='quotaUnica'
      ?'Anzianità forfettaria di settore — non considerata'
      :'Scatti di anzianità — zero scatti considerati',0);
    if(regola.tipo==='quotaUnica')return riga('Anzianità forfettaria di settore',composta.scattiMensili);
    if(composta.valoreScatto===null)return riga(
      `Scatti di anzianità — ${composta.numeroScatti}, ciascuno al valore della sua maturazione (${
        composta.dettaglioScatti.map(s=>euro(s.importo)).join(' + ')})`,composta.scattiMensili);
    return riga(composta.partTime
      ?`Scatti di anzianità — ${composta.numeroScatti} scatti, totale riproporzionato`
      :`Scatti di anzianità — ${composta.numeroScatti} × ${euro(composta.valoreScatto)}`,
      composta.scattiMensili);
  }

  form.addEventListener('submit',event=>{
    event.preventDefault();
    nascondi();
    const anzianita=campo('anzianita').value||null;
    const superminimo=numero(campo('superminimo').value);
    const ore=numero(campo('ore').value);
    const scatti=numero(campo('scatti').value,{intero:true});
    const contratto=R.trovaContratto(selCcnl.value);
    const s=sezione();
    const regola=R.regolaScatti(contratto.id,s);
    const oreContratto=R.oreContrattuali(contratto.id,s);

    for(const [id,valore,messaggio] of [
      ['anzianita',anzianita!==null&&!/^\d{4}-\d{2}-\d{2}$/.test(anzianita)?NaN:0,'Indica una data di inizio anzianità valida, oppure lasciala vuota.'],
      ['superminimo',superminimo,'Indica il superminimo mensile usando solo cifre.'],
      ['ore',ore,'Indica le ore settimanali usando solo cifre.'],
      ['scatti',scatti,`Indica un numero intero di scatti fra 0 e ${regola.massimo}.`],
    ]) if(Number.isNaN(valore)){
      campo(id).setAttribute('aria-invalid','true');
      status.textContent=messaggio;campo(id).focus();
      if(id==='ore'||id==='scatti')document.getElementById('avanzate').open=true;
      return;
    }
    if(ore!==null&&(ore<=0||ore>oreContratto)){
      campo('ore').setAttribute('aria-invalid','true');
      document.getElementById('avanzate').open=true;
      status.textContent=`L’orario deve stare fra 1 e ${oreContratto} ore settimanali: sopra il tempo pieno il contratto non riproporziona nulla.`;
      campo('ore').focus();return;
    }
    if(scatti!==null&&scatti>regola.massimo){
      campo('scatti').setAttribute('aria-invalid','true');
      document.getElementById('avanzate').open=true;
      status.textContent=`Questo contratto si ferma a ${regola.massimo} scatti.`;
      campo('scatti').focus();return;
    }

    let composta;
    try{
      composta=R.componiRal({ccnl:contratto.id,sezione:s,livello:selLivello.value,
        profilo:selProfilo.value||null,dataAnzianita:anzianita,scatti:scatti,
        oreSettimanali:ore,superminimoMensile:superminimo||0});
    }catch(errore){
      const suScatti=/scatti/i.test(errore.message)&&scatti!==null;
      const id=suScatti?'scatti':'anzianita';
      campo(id).setAttribute('aria-invalid','true');
      if(suScatti)document.getElementById('avanzate').open=true;
      status.textContent=errore.message;campo(id).focus();return;
    }
    if(composta.ral>1000000){
      campo('superminimo').setAttribute('aria-invalid','true');
      status.textContent='La RAL composta supera 1.000.000 €: il calcolatore non produce una stima oltre questo limite.';
      campo('superminimo').focus();return;
    }
    const livello=R.trovaLivello(contratto.id,selLivello.value,undefined,s);
    const nomeSezione=s?R.sezioni(contratto.id).find(x=>x.id===s).nome:null;
    const profilo=composta.profilo?livello.profili.find(p=>p.id===composta.profilo):null;
    const risultato=applicaMensilita(
      calcola(String(composta.ral),{comune:COMUNE,nucleo:[]}),composta.mensilita);

    campo('frase-risultato').textContent=
      `${contratto.nome}${nomeSezione?` (${nomeSezione})`:''}, ${livello.nome}`+
      `${profilo?`, ${profilo.nome}`:''}`+
      `${composta.partTime?`, ${composta.oreSettimanali} ore settimanali`:', tempo pieno'}: `+
      (composta.ralCompleta?`la retribuzione contrattuale annua lorda è`
        :`la ${R.etichettaAnnua(contratto.id).toLowerCase()}, senza le quote annue non quantificate, è`);
    campo('ral-risultato').textContent=euro(composta.ral);
    /* RIC-77: dove il contratto prevede una quota annua che nessuna
       fonte quantifica, la cifra non si chiama RAL e il netto è
       dichiarato per quello che è, calcolato su una base parziale. */
    const suBase=composta.ralCompleta?'':' sulla base parziale';
    campo('netto-etichetta').textContent=`Netto annuo stimato${suBase}`;
    campo('media-etichetta').textContent=`Netto medio mensile${suBase}`;
    campo('avviso-parziale').innerHTML=composta.ralCompleta?'':
      `<div class="callout callout--warn"><span class="callout__mark">Parziale</span><div>${R.avvisoRalParziale(contratto.id)}</div></div>`;
    const annua=composta.ralCompleta?'Retribuzione annua lorda':R.etichettaAnnua(contratto.id);
    campo('netto-risultato').textContent=euro(risultato.kpi.nettoAnnuo);
    campo('media-risultato').textContent=euro(risultato.kpi.mediaMensile);
    campo('mensilita-risultato').textContent=mensilitaTesto(composta.mensilita);

    /* La scomposizione mostra le voci come le pubblica quel
       contratto: scomposte dove lo sono, all-in dove lo è. */
    const vociBase=composta.partTime
      ? [[`Retribuzione contrattuale, riproporzionata da ${euro(composta.baseMensileIntera)}`,composta.baseMensile]]
      : livello.voci.map(voce=>[voce.nome,voce.importo]);
    const indennita=composta.quote.find(q=>profilo&&q.id===profilo.voce.id);
    campo('scomposizione-corpo').innerHTML=[
      ...vociBase.map(([nome,importo])=>riga(nome,importo)),
      /* Il totale della scomposizione serve solo dove c'è qualcosa da
         sommare: dove il contratto pubblica un importo unico, ripeterlo
         sotto se stesso non aggiunge niente. */
      ...(composta.partTime||vociBase.length===1
        ?[]:[riga('Totale contrattuale mensile',composta.baseMensile)]),
      ...(indennita?[riga(indennita.nome,indennita.mensile)]:[]),
      rigaScatti(composta,regola),
      riga(composta.superminimoMensile===0
        ? 'Superminimo — non dichiarato':'Superminimo lordo mensile',
        composta.superminimoMensile),
      riga('Lordo mensile totale',composta.mensileTotale,'somma'),
      /* L'ultima moltiplicazione è la sola che porta fuori dal mese:
         mostrarla come riga propria evita l'etichetta «× 13 mensilità»
         accanto a un importo che mensile lo è ancora. Dove le voci non
         entrano tutte nelle stesse mensilità, la moltiplicazione unica
         sarebbe falsa: le quote stanno nella tabella qui sotto. */
      ...(composta.identitaSemplice
        ?[riga(`${annua} — × ${mensilitaTesto(composta.mensilita)} mensilità`,composta.ral,'somma')]:[]),
    ].join('');
    campo('annualizzazione').hidden=composta.identitaSemplice;
    campo('annualizzazione-corpo').innerHTML=composta.identitaSemplice?'':[
      ...composta.quote.filter(q=>q.annuo!==0).map(q=>
        riga(`${q.nome} — ${euro(q.mensile)} × ${mensilitaTesto(q.mensilita)}`,q.annuo)),
      riga(annua,composta.ral,'somma'),
    ].join('');
    campo('scomposizione-caption').textContent=
      `Come si compone il lordo mensile — tabella in vigore dal ${data(composta.decorrenza)}`;

    const prossima=R.prossimaTabella(contratto.id,undefined,s);
    campo('nota-decorrenza').textContent=
      `Importi della base nazionale in vigore dal ${data(composta.decorrenza)}, annualizzati a condizioni costanti: `+
      `non è il reddito di un anno attraversato da una tranche.`+
      (prossima?` La prossima tranche decorre dal ${data(prossima.decorrenza)}.`
        :' Nessuna tranche successiva è firmata.');

    campo('avviso-scatti').innerHTML=
      !composta.scattiDocumentati
      ? '<div class="callout"><span class="callout__mark">Nota</span><div>Il contratto non pubblica il valore dello scatto per questo livello: il calcolo considera <strong>zero scatti</strong>, e con qualche anno in azienda la cifra reale è più alta.</div></div>'
      : composta.scattiPrevisti&&composta.numeroScatti===0&&!composta.anzianitaDichiarata&&!composta.scattiOverride
      ? `<div class="callout"><span class="callout__mark">Nota</span><div>Non hai indicato l’anzianità: il calcolo considera <strong>zero ${regola.tipo==='quotaUnica'?'anzianità forfettaria':'scatti'}</strong>. Con qualche anno ${regola.tipo==='quotaUnica'?'nel settore':'in azienda'} la cifra reale è più alta.</div></div>`
      : composta.scattiAlTetto&&regola.tipo!=='quotaUnica'
      ? `<div class="callout"><span class="callout__mark">Tetto</span><div>Sei al massimo di ${regola.massimo} scatti previsto dal contratto: l’anzianità successiva non ne matura altri.</div></div>`
      :'';

    campo('avviso-limiti').innerHTML=[
      ...(composta.ral>122295
        ?['<div class="callout callout--warn"><span class="callout__mark">Limite</span><div>Sopra 122.295 € il massimale contributivo dipende dall’anzianità previdenziale al 31 dicembre 1995, che qui si assume assente.</div></div>']:[]),
      ...(!Number.isInteger(composta.mensilita)
        ?[`<div class="callout"><span class="callout__mark">Mensilità</span><div>Questo contratto paga ${mensilitaTesto(composta.mensilita)} mensilità: la quattordicesima è metà di una retribuzione mensile. Il netto medio qui è diviso per ${mensilitaTesto(composta.mensilita)}; il calcolatore completo sceglie solo fra mensilità intere.</div></div>`]:[]),
    ].join('');

    campo('esclusioni').innerHTML=[
      ...composta.esclusioni,
      'Part-time verticale, ciclico e multiperiodale: l’orario non è esprimibile qui come ore settimanali costanti.',
      ...(contratto.id==='terziario-confcommercio-h011'?["Orari ordinari speciali del Terziario: la base è 40 ore; il contratto prevede eccezioni fino a 42 o 45 ore per lavorazioni particolari."]:[]),
      'Netto stimato per un dipendente privato a Milano, anno intero, senza familiari a carico e senza benefit. Il contratto da solo non identifica tutte le aliquote contributive del settore.',
    ].map(voce=>`<li>${voce}</li>`).join('');
    campo('nota-fonte').innerHTML=
      `Fonte: <a href="${contratto.fonte.url}">${contratto.fonte.titolo}</a> — ${contratto.fonte.parte}. `+
      `Decorrenza ${data(composta.decorrenza)}, verificata il ${data(contratto.fonte.verificataIl)}.`+
      (composta.partTime?` Riproporzione a norma di ${R.FONTE_RIPROPORZIONE.titolo}.`:'');
    campo('nota-affidabilita').textContent=contratto.notaFonte||'';

    campo('cta-calcolatore').textContent=composta.ralCompleta
      ?'Apri il calcolatore completo':'Apri il calcolatore completo con questa base parziale';
    campo('cta-calcolatore').href=
      `index.html?ral=${composta.ral}&m=${composta.mensilita}&c=${COMUNE}&calc=1`;
    status.textContent='Calcolo completato.';
    box.hidden=false;
    /* Il risultato sta sotto il modulo e su mobile finisce fuori
       schermo: portarcisi è metà della risposta. Il fuoco va sul
       titolo perché chi naviga da tastiera o con uno screen reader
       deve arrivarci come ci arriva chi vede la pagina scorrere. */
    const titolo=campo('risultato-titolo');
    titolo.focus();
    titolo.scrollIntoView({behavior:movimento(),block:'start'});
  });

  /* Le pagine dei minimi CCNL portano qui con contratto, sezione e
     livello nell'indirizzo. Si preseleziona solo ciò che il dataset
     conosce: un parametro sbagliato o vecchio lascia il default. */
  const richiesta=new URLSearchParams(location.search);
  const scegli=(select,valore)=>{
    if(valore&&[...select.options].some(o=>o.value===valore))select.value=valore;
  };
  scegli(selCcnl,richiesta.get('ccnl'));
  popolaSezioni();
  scegli(selSezione,richiesta.get('sezione'));
  popolaLivelli();
  scegli(selLivello,richiesta.get('livello'));
  popolaProfili();
})();

CALCOLATORE_AVVIO.pronto();
}
