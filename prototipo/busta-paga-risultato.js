/* ============================================================
   BUSTA PAGA — IL RISULTATO A SCHERMO.

   Le quattro sezioni del ticket padre: «In breve», «Le voci
   spiegate», «Come torna il conto», «Cose da verificare».

   Due regole, e sono entrambe visibili nel codice:

   1. **Si scrive testo, mai HTML.** Ogni stringa che viene dal
      documento o dal modello passa da `textContent` o da
      `createTextNode`. In questo file la parola `innerHTML` non
      compare, e una prova lo verifica. Un cedolino che contiene
      uno script compare a schermo come caratteri.
   2. **Tre cose diverse si vedono diverse.** Il *dato letto dal
      documento* è a caratteri fissi e porta il suo riferimento;
      la *spiegazione* è prosa e viene dal modello; il *calcolo*
      è nostro e lo dice. Mescolarli sarebbe il modo più veloce
      di far passare per letto un numero che abbiamo dedotto.

   Quello che non c'è: nessuna stima. Se un totale non è stato
   individuato si scrive «non individuato» e si va avanti.
   ============================================================ */
(()=>{
  'use strict';

  /* `useGrouping:'always'` non è un vezzo: in italiano la regola CLDR non
     raggruppa le migliaia sotto le cinque cifre, e `2435,17` finirebbe a due
     centimetri dal `2.435,17` scritto sul cedolino. Se i numeri nostri e
     quelli del documento si scrivono diversi, il confronto costa fatica. */
  const NUMERO=new Intl.NumberFormat('it-IT',
    {minimumFractionDigits:2,maximumFractionDigits:2,useGrouping:'always'});
  const euro=valore=>`${NUMERO.format(valore)} €`;

  const CATEGORIA=Object.freeze({
    competenza:'Competenza',
    trattenuta:'Trattenuta',
    contributo:'Contributo',
    imposta:'Imposta',
    informativa:'Informativa',
    progressivo:'Progressivo',
    sconosciuta:'Sconosciuta',
  });
  const EFFETTO=Object.freeze({
    aumenta_il_lordo:'Aumenta il lordo',
    riduce_il_netto:'Riduce il netto',
    non_modifica_il_netto:'Non modifica il netto del mese',
    dipende:'Dipende',
  });
  const CONFIDENZA=Object.freeze({
    alta:'Confidenza alta',
    media:'Confidenza media',
    bassa:'Confidenza bassa',
  });
  const TOTALI=Object.freeze([
    ['periodo','Periodo'],
    ['competenze','Totale competenze'],
    ['trattenute','Totale trattenute'],
    ['netto','Netto da pagare'],
    ['ferieResidue','Ferie residue'],
    ['permessiResidui','Permessi residui'],
  ]);

  function elemento(tag,classe,testo){
    const nodo=document.createElement(tag);
    if(classe)nodo.className=classe;
    if(testo!==undefined&&testo!==null)nodo.textContent=String(testo);
    return nodo;
  }

  /* ----------------------------------------------------------
     1. In breve. Solo valori realmente individuati nel documento.
     ---------------------------------------------------------- */
  function inBreve(analisi){
    const sezione=elemento('section','bp-ris__blocco');
    sezione.appendChild(elemento('h3','bp-ris__h','In breve'));
    sezione.appendChild(elemento('p','bp-ris__nota',
      'Questi valori sono letti dal documento, non calcolati da noi. Quelli che non abbiamo trovato restano «non individuato»: non li stimiamo.'));

    const lista=elemento('dl','bp-ris__breve');
    for(const [chiave,etichetta] of TOTALI){
      const letto=chiave==='periodo'?analisi.periodo:analisi.totali[chiave];
      lista.appendChild(elemento('dt',null,etichetta));
      const valore=elemento('dd',letto?'bp-ris__letto':'bp-ris__assente');
      valore.appendChild(elemento('span','mono',letto?letto.sourceValue:'non individuato'));
      if(letto&&letto.sourceReference)
        valore.appendChild(elemento('span','bp-ris__dove',` — ${letto.sourceReference}`));
      lista.appendChild(valore);
    }
    sezione.appendChild(lista);
    return sezione;
  }

  /* ----------------------------------------------------------
     2. Le voci spiegate. Dicitura e importo com'erano scritti,
        poi la spiegazione, poi come l'abbiamo classificata.
     ---------------------------------------------------------- */
  function voce(dato){
    const item=elemento('li','bp-voce');
    item.dataset.categoria=dato.category;

    const testa=elemento('p','bp-voce__testa');
    testa.appendChild(elemento('span','mono bp-voce__dicitura',dato.sourceLabel));
    if(dato.sourceAmount)
      testa.appendChild(elemento('span','mono bp-voce__importo',dato.sourceAmount));
    item.appendChild(testa);

    const etichette=elemento('p','bp-voce__etichette');
    etichette.appendChild(elemento('span','bp-tag',CATEGORIA[dato.category]));
    etichette.appendChild(elemento('span','bp-tag bp-tag--effetto',EFFETTO[dato.effect]));
    etichette.appendChild(elemento('span','bp-tag bp-tag--conf',CONFIDENZA[dato.confidence]));
    item.appendChild(etichette);

    item.appendChild(elemento('p','bp-voce__spiega',dato.plainExplanation));

    if(dato.sourceReference)
      item.appendChild(elemento('p','bp-voce__dove',`Letta in: ${dato.sourceReference}`));

    if(dato.warnings&&dato.warnings.length){
      const avvisi=elemento('ul','bp-voce__avvisi');
      for(const avviso of dato.warnings)avvisi.appendChild(elemento('li',null,avviso));
      item.appendChild(avvisi);
    }
    return item;
  }

  function vociSpiegate(analisi){
    const sezione=elemento('section','bp-ris__blocco');
    sezione.appendChild(elemento('h3','bp-ris__h','Le voci spiegate'));
    sezione.appendChild(elemento('p','bp-ris__nota',
      'Dicitura e importo sono copiati dal documento: se non comparivano alla lettera nel testo che hai inviato, la voce non è qui. La spiegazione, invece, è del modello — è la parte che può sbagliare.'));

    const lista=elemento('ul','bp-voci');
    for(const dato of analisi.voci)lista.appendChild(voce(dato));
    sezione.appendChild(lista);

    if(analisi.guardie&&analisi.guardie.scartate)
      sezione.appendChild(elemento('p','bp-ris__nota',
        `Abbiamo scartato ${analisi.guardie.scartate===1?'una voce':`${analisi.guardie.scartate} voci`} perché la dicitura o l’importo non si ritrovavano alla lettera nel testo inviato.`));
    return sezione;
  }

  /* ----------------------------------------------------------
     3. Come torna il conto. Qui i numeri sono nostri, e lo dice.
     ---------------------------------------------------------- */
  function riga(etichetta,valore,classe){
    const elementoRiga=elemento('p',classe||'bp-conto__riga');
    elementoRiga.appendChild(elemento('span','bp-conto__voce',etichetta));
    elementoRiga.appendChild(elemento('span','mono bp-conto__cifra',
      valore===null?'non individuato':euro(valore)));
    return elementoRiga;
  }

  function comeTorna(analisi){
    const conto=analisi.conto;
    const sezione=elemento('section','bp-ris__blocco');
    sezione.appendChild(elemento('h3','bp-ris__h','Come torna il conto'));
    sezione.appendChild(elemento('p','bp-ris__nota',
      'Questa è l’unica parte in cui compaiono numeri calcolati da noi. La somma e il confronto li fa il codice di questa pagina, mai il modello.'));

    if(conto.stato==='non_calcolabile'){
      sezione.appendChild(elemento('p','bp-conto__esito',
        'Non abbiamo individuato tutti e tre i totali che servono — competenze, trattenute e netto — quindi il conto non si può rifare. Preferiamo dirlo piuttosto che stimarli.'));
      sezione.appendChild(riga('Totale competenze letto',conto.competenze.dichiarato));
      sezione.appendChild(riga('Totale trattenute letto',conto.trattenute.dichiarato));
      sezione.appendChild(riga('Netto letto',conto.netto.dichiarato));
      return sezione;
    }

    sezione.appendChild(riga('Totale competenze letto',conto.competenze.dichiarato));
    sezione.appendChild(riga('Totale trattenute letto',conto.trattenute.dichiarato));
    sezione.appendChild(riga('Competenze meno trattenute, calcolato da noi',conto.netto.calcolato,'bp-conto__riga bp-conto__riga--calcolo'));
    sezione.appendChild(riga('Netto letto sul documento',conto.netto.dichiarato));

    if(conto.stato==='torna')
      sezione.appendChild(elemento('p','bp-conto__esito bp-conto__esito--ok',
        'Il conto torna: competenze meno trattenute danno il netto scritto sul cedolino.'));
    else
      sezione.appendChild(elemento('p','bp-conto__esito bp-conto__esito--no',
        `Il conto non torna per ${euro(Math.abs(conto.differenza))}. Non vuol dire che il cedolino sia sbagliato: può essere un arrotondamento, un conguaglio o una voce che non siamo riusciti ad attribuire. Potrebbe valere la pena verificarlo.`));
    return sezione;
  }

  /* ----------------------------------------------------------
     4. Cose da verificare. Al massimo tre, e non sono del modello:
        le scrive il nostro codice guardando quello che ha estratto.
     ---------------------------------------------------------- */
  function daVerificare(analisi){
    const sezione=elemento('section','bp-ris__blocco');
    sezione.appendChild(elemento('h3','bp-ris__h','Cose da verificare'));
    if(!analisi.verifiche.length){
      sezione.appendChild(elemento('p','bp-ris__nota',
        'Da quello che abbiamo letto non è emerso niente che valga la pena controllare. Non vuol dire che sia tutto in ordine: vuol dire che i nostri controlli non hanno trovato niente.'));
      return sezione;
    }
    const lista=elemento('ul','bp-verifiche');
    for(const verifica of analisi.verifiche){
      const item=elemento('li');
      item.appendChild(elemento('p','bp-verifiche__titolo',verifica.titolo));
      item.appendChild(elemento('p','bp-verifiche__dettaglio',verifica.dettaglio));
      lista.appendChild(item);
    }
    sezione.appendChild(lista);
    return sezione;
  }

  /* Il piede: da dove viene la spiegazione e che cosa non sappiamo. Il limite
     dichiarato sta a schermo, non solo nella PR: era la richiesta del ticket. */
  function provenienza(motore){
    const sezione=elemento('section','bp-ris__blocco bp-ris__blocco--piede');
    sezione.appendChild(elemento('h3','bp-ris__h','Da dove viene questa spiegazione'));
    if(motore&&motore.modello)
      sezione.appendChild(elemento('p','bp-ris__nota',
        `Il testo oscurato è stato spiegato da ${motore.modello}, instradato via Vercel AI Gateway con inferenza in regione europea, retention zero e divieto di addestramento sui prompt. Non è stato salvato da nessuna parte: né da noi, né nei log.`));
    sezione.appendChild(elemento('p','bp-ris__nota',
      'Limite dichiarato: nessuno ha verificato su cedolini veri quanto bene il modello li legga. Abbiamo scelto controlli meccanici — ogni voce deve citarsi, le somme le facciamo noi — invece di una valutazione su documenti di altre persone. Impediscono di mostrarti numeri inventati; non garantiscono che quelli veri siano capiti.'));
    return sezione;
  }

  function rendi(radice,analisi,motore){
    if(!radice)return null;
    radice.textContent='';
    radice.appendChild(inBreve(analisi));
    radice.appendChild(vociSpiegate(analisi));
    radice.appendChild(comeTorna(analisi));
    radice.appendChild(daVerificare(analisi));
    radice.appendChild(provenienza(motore));
    return radice;
  }

  window.BUSTA_PAGA_RISULTATO={CATEGORIA,EFFETTO,CONFIDENZA,TOTALI,euro,rendi};
})();
