/* ============================================================
   BUSTA PAGA — ESTRAZIONE.

   Da frammenti con coordinate a righe di testo. È la parte che
   decide se l'importo finisce accanto alla dicitura giusta.

   Una libreria di estrazione non restituisce righe: restituisce
   pezzi di testo con la loro posizione sulla pagina. Su una
   tabella densa come un cedolino, concatenarli nell'ordine in
   cui arrivano mescola le colonne. Qui i frammenti si
   raggruppano per linea di base e si ordinano per ascissa.

   Nessun DOM, nessuna libreria: la logica si prova con array di
   coordinate scritti a mano, senza nessun PDF.
   ============================================================ */
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.BUSTA_PAGA_ESTRAZIONE=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const LIMITI=Object.freeze({
    byteMassimi:5*1024*1024,   // il cedolino digitale sta in pochi centinaia di KB
    pagineMassime:3,           // una mensilità sola, come dichiara la pagina
    caratteriMinimi:200,       // sotto questa soglia non è un cedolino leggibile
    righeMinime:5,
    caratteriMassimi:20000,    // tetto del testo, per la PR che invia
  });

  /* Quanto può scostarsi una linea di base dalla riga a cui appartiene, in
     frazione dell'altezza del carattere. Gli importi di una tabella sono spesso
     composti qualche decimo di punto più in alto o più in basso della dicitura. */
  const TOLLERANZA_RIGA=0.45;
  /* Sotto questa distanza due frammenti sono la stessa parola spezzata dalla
     libreria: «IRP» + «EF» deve tornare «IRPEF», non «IRP EF». */
  const DISTANZA_SPAZIO=0.25;

  const spazioNormalizzato=testo=>String(testo).replace(/\s+/g,' ').trim();

  /* Dagli item di pdf.js ai nostri frammenti. La matrice di trasformazione porta
     la posizione: transform[4] è l'ascissa, transform[5] la linea di base misurata
     dal fondo della pagina, transform[3] la scala verticale del carattere. */
  function frammentiDaTextContent(items,{pagina}={}){
    const frammenti=[];
    for(const item of items||[]){
      const testo=spazioNormalizzato(item&&item.str);
      if(!testo)continue;
      const t=item.transform||[];
      frammenti.push({
        pagina,
        testo,
        x:Number(t[4])||0,
        y:Number(t[5])||0,
        larghezza:Number(item.width)||0,
        altezza:Number(item.height)||Math.abs(Number(t[3]))||0,
      });
    }
    return frammenti;
  }

  function componiRighe(frammenti,opzioni={}){
    const tolleranza=opzioni.tolleranzaRiga??TOLLERANZA_RIGA;
    const distanzaSpazio=opzioni.distanzaSpazio??DISTANZA_SPAZIO;
    const puliti=(frammenti||[])
      .map(f=>({...f,testo:spazioNormalizzato(f.testo)}))
      .filter(f=>f.testo);
    // Dall'alto verso il basso: nelle coordinate del PDF l'origine è in fondo,
    // quindi la riga più in alto è quella con y maggiore.
    puliti.sort((a,b)=>(a.pagina-b.pagina)||(b.y-a.y)||(a.x-b.x));

    const righe=[];
    for(const frammento of puliti){
      const corrente=righe[righe.length-1];
      const stessaRiga=corrente
        &&corrente.pagina===frammento.pagina
        &&Math.abs(corrente.y-frammento.y)<=tolleranza*Math.max(corrente.altezza,frammento.altezza);
      if(stessaRiga){
        corrente.frammenti.push(frammento);
        corrente.altezza=Math.max(corrente.altezza,frammento.altezza);
      }else{
        righe.push({pagina:frammento.pagina,y:frammento.y,altezza:frammento.altezza,frammenti:[frammento]});
      }
    }

    return righe.map(riga=>{
      riga.frammenti.sort((a,b)=>a.x-b.x);
      let testo='';
      let precedente=null;
      for(const frammento of riga.frammenti){
        if(precedente){
          const distanza=frammento.x-(precedente.x+precedente.larghezza);
          const soglia=distanzaSpazio*Math.max(precedente.altezza,frammento.altezza);
          if(distanza>soglia)testo+=' ';
        }
        testo+=frammento.testo;
        precedente=frammento;
      }
      return Object.freeze({
        pagina:riga.pagina,
        y:riga.y,
        testo:spazioNormalizzato(testo),
        frammenti:Object.freeze(riga.frammenti.map(Object.freeze)),
      });
    }).filter(riga=>riga.testo);
  }

  /* Il testo del documento, com'è dopo la ricomposizione. Il cambio di pagina è
     una riga esplicita: serve a tenere il riferimento alla pagina d'origine. */
  function testoDaRighe(righe){
    const parti=[];
    let pagina=null;
    for(const riga of righe||[]){
      if(pagina!==null&&riga.pagina!==pagina)parti.push(`[PAGINA ${riga.pagina}]`);
      pagina=riga.pagina;
      parti.push(riga.testo);
    }
    return parti.join('\n');
  }

  const errore=codice=>({ok:false,codice});
  const AMMESSO={ok:true};

  function verificaFile({nome='',tipo='',dimensione=0}={}){
    const estensionePdf=/\.pdf$/i.test(nome);
    const tipoPdf=tipo==='application/pdf'||(!tipo&&estensionePdf);
    if(!tipoPdf||(tipo&&tipo!=='application/pdf'))return errore('FILE_NON_PDF');
    if(dimensione>LIMITI.byteMassimi)return errore('FILE_TROPPO_GRANDE');
    if(!(dimensione>0))return errore('FILE_VUOTO');
    return AMMESSO;
  }

  function verificaDocumento({pagine=0}={}){
    if(!(pagine>0))return errore('PDF_SENZA_TESTO');
    if(pagine>LIMITI.pagineMassime)return errore('TROPPE_PAGINE');
    return AMMESSO;
  }

  function verificaRighe(righe){
    const elenco=righe||[];
    if(!elenco.length)return errore('PDF_SENZA_TESTO');
    const caratteri=elenco.reduce((totale,riga)=>totale+riga.testo.length,0);
    if(elenco.length<LIMITI.righeMinime||caratteri<LIMITI.caratteriMinimi)
      return errore('ESTRAZIONE_VUOTA');
    return AMMESSO;
  }

  /* Copy degli errori. Nessun messaggio riporta una parte del documento: il
     testo del cedolino non esce da qui, nemmeno dentro un errore. */
  const MESSAGGI=Object.freeze({
    FILE_NON_PDF:{
      titolo:'Serve un PDF, non un’immagine.',
      cosaFare:'Scarica il cedolino dal portale del datore o dell’ufficio paghe nel formato PDF originale. Una foto o uno screenshot non contengono il testo da leggere.',
    },
    FILE_TROPPO_GRANDE:{
      titolo:'Il file supera i 5 MB.',
      cosaFare:'Un cedolino digitale pesa molto meno. Se il tuo è più pesante, probabilmente è una scansione: in questa versione non è supportata.',
    },
    FILE_VUOTO:{
      titolo:'Il file è vuoto.',
      cosaFare:'Il caricamento potrebbe essersi interrotto. Riprova a selezionare il file.',
    },
    TROPPE_PAGINE:{
      titolo:'Il documento supera le 3 pagine.',
      cosaFare:'Questa versione legge una sola mensilità. Se il PDF contiene più cedolini, caricane uno per volta.',
    },
    PDF_SENZA_TESTO:{
      titolo:'In questo PDF non c’è testo selezionabile.',
      cosaFare:'È quasi sempre una scansione o una foto trasformata in PDF. Serve il PDF digitale originale: in questa versione non riconosciamo le immagini.',
    },
    ESTRAZIONE_VUOTA:{
      titolo:'Abbiamo letto troppo poco per lavorarci.',
      cosaFare:'Il testo estratto è troppo breve per essere un cedolino. Controlla di aver caricato il documento giusto e in formato digitale.',
    },
    PDF_PROTETTO:{
      titolo:'Il PDF è protetto da password.',
      cosaFare:'Aprilo con la password e salvane una copia senza protezione, poi ricaricala.',
    },
    PDF_ILLEGGIBILE:{
      titolo:'Non siamo riusciti ad aprire il file.',
      cosaFare:'Il PDF potrebbe essere danneggiato o creato da un programma che non riusciamo a leggere. Prova a riscaricarlo dal portale.',
    },
  });

  return{LIMITI,TOLLERANZA_RIGA,DISTANZA_SPAZIO,MESSAGGI,
    frammentiDaTextContent,componiRighe,testoDaRighe,
    verificaFile,verificaDocumento,verificaRighe};
});
