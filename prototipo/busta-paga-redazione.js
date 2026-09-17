/* ============================================================
   BUSTA PAGA — REDAZIONE.

   Da righe a righe oscurate, più l'elenco di che cosa è stato
   oscurato e perché.

   Tre principi, e il resto discende da questi:

   1. Si oscura sostituendo, non rimuovendo. Il segnaposto è una
      parola sola: la riga mantiene le sue colonne, quindi
      l'importo resta accanto alla sua dicitura.
   2. Di sigle sindacali e motivi di assenza si oscura
      l'etichetta e si tiene l'importo. Sono categorie
      particolari ex art. 9 GDPR — appartenenza sindacale e
      stato di salute — ma la riconciliazione deve continuare
      a tornare.
   3. Il riconoscimento è deterministico e prudente, e sbaglia.
      Per questo ogni parola resta commutabile a mano: quello
      che la macchina non ha visto lo vede l'utente.

   Nessun DOM, nessuna rete: si prova su stringhe scritte a mano.
   ============================================================ */
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.BUSTA_PAGA_REDAZIONE=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const TIPI=Object.freeze({
    'nome':{segnaposto:'[NOME]',etichetta:'Nome e cognome',
      motivo:'Identifica direttamente la persona. Il riconoscimento è un’euristica sull’intestazione: controlla che non ne sia rimasto.'},
    'codice-fiscale':{segnaposto:'[CODICE_FISCALE]',etichetta:'Codice fiscale',
      motivo:'Identificativo diretto: contiene anche data e luogo di nascita.'},
    'iban':{segnaposto:'[IBAN]',etichetta:'IBAN',
      motivo:'Coordinate bancarie: non servono a spiegare il cedolino.'},
    'partita-iva':{segnaposto:'[PARTITA_IVA]',etichetta:'Partita IVA',
      motivo:'Identifica l’azienda o il professionista.'},
    'data-nascita':{segnaposto:'[DATA_NASCITA]',etichetta:'Data di nascita',
      motivo:'Insieme a poche altre informazioni rende riconoscibile la persona.'},
    'matricola':{segnaposto:'[MATRICOLA]',etichetta:'Matricola',
      motivo:'Identifica il lavoratore dentro l’azienda.'},
    'indirizzo':{segnaposto:'[INDIRIZZO]',etichetta:'Indirizzo',
      motivo:'Localizza la persona. Il comune del calcolo fiscale resta visibile dove compare da solo.'},
    'cap':{segnaposto:'[CAP]',etichetta:'CAP',
      motivo:'Restringe la residenza a poche strade.'},
    'sigla-sindacale':{segnaposto:'[SIGLA_SINDACALE]',etichetta:'Sigla sindacale',
      motivo:'La quota associativa rivela l’appartenenza sindacale: categoria particolare ex art. 9 GDPR. L’importo resta.'},
    'motivo-assenza':{segnaposto:'[MOTIVO_ASSENZA]',etichetta:'Motivo di assenza',
      motivo:'Malattia, infortunio e permessi legge 104 rivelano lo stato di salute: categoria particolare ex art. 9 GDPR. Ore e importo restano.'},
    'manuale':{segnaposto:'[OSCURATO]',etichetta:'Oscurato a mano',
      motivo:'Lo hai deciso tu.'},
  });

  /* Le righe che consideriamo intestazione, dove l'euristica sul nome ha senso.
     Più in basso in un cedolino ci sono voci e importi, non anagrafiche. */
  const INTESTAZIONE_RIGHE=12;

  const senzaAccenti=t=>t.normalize('NFD').replace(/[̀-ͯ]/g,'');
  const normalizza=t=>senzaAccenti(String(t).toUpperCase()).replace(/^[^0-9A-Z]+|[^0-9A-Z]+$/g,'');
  const insieme=(...parole)=>Object.freeze(new Set(parole.flatMap(p=>p.split(/\s+/))));

  /* Il vocabolario del cedolino: parole che un'euristica sul nome non deve
     scambiare per un cognome. Non serve completezza, serve che le parole
     frequenti dell'intestazione stiano qui. */
  const VOCABOLARIO=insieme(
    'BUSTA PAGA CEDOLINO PROSPETTO RETRIBUZIONE RETRIBUTIVO FOGLIO MENSILE MENSILITA',
    'DIPENDENTE LAVORATORE DATORE AZIENDA DITTA SOCIETA COOPERATIVA IMPRESA SEDE LEGALE UNITA PRODUTTIVA STABILIMENTO FILIALE',
    'SPA SRL SNC SAS SCARL SCRL SRLS SAPA ONLUS',
    'QUALIFICA LIVELLO CATEGORIA MANSIONE INQUADRAMENTO CCNL CONTRATTO SETTORE COMMERCIO METALMECCANICI TERZIARIO INDUSTRIA ARTIGIANATO EDILIZIA',
    'OPERAIO IMPIEGATO QUADRO DIRIGENTE APPRENDISTA INTERMEDIO TEMPO PIENO PARZIALE INDETERMINATO DETERMINATO FULL PART TIME',
    'PERIODO MESE ANNO DATA ASSUNZIONE CESSAZIONE ANZIANITA SCATTI SCATTO DECORRENZA',
    'CODICE COD CF FISCALE PARTITA IVA MATRICOLA MATR POSIZIONE INPS INAIL INPDAP FONDO PREVIDENZA COMPLEMENTARE',
    'DOC PROT PROG NUM NR REG RIF',
    'TOTALE TOTALI COMPETENZE TRATTENUTE RITENUTE NETTO LORDO IMPONIBILE IMPONIBILI CONTRIBUTI CONTRIBUTO',
    'IRPEF ADDIZIONALE ADDIZIONALI COMUNALE REGIONALE ACCONTO SALDO DETRAZIONE DETRAZIONI TRATTAMENTO INTEGRATIVO CUNEO BONUS',
    'ORDINARIA STRAORDINARIO NOTTURNO FESTIVO SUPPLEMENTARE PRESENZA ORE ORARIO GIORNI GIORNATE PAGA BASE CONTINGENZA EDR SUPERMINIMO INDENNITA',
    'FERIE PERMESSI ROL EX FESTIVITA RESIDUE RESIDUI MATURATE GODUTE SPETTANTI TREDICESIMA QUATTORDICESIMA TFR ACCANTONAMENTO',
    'PROGRESSIVI PROGRESSIVO ANNO CORRENTE PRECEDENTE RIEPILOGO NOTE CENTRO COSTO REPARTO SETTIMANA DIVISA EURO PAGAMENTO BONIFICO ACCREDITO BANCA',
    'COMUNE PROVINCIA REGIONE ITALIA RESIDENZA DOMICILIO FISCALE VIA PIAZZA CORSO VIALE',
    'SIG SIGNOR SIGNORA COGNOME NOME NOMINATIVO CAF CUD CU',
  );

  const SIGLE_SINDACALI=insieme(
    'CGIL CISL UIL UGL USB CUB COBAS SGB ADL CONFSAL SNALS GILDA ANIEF USI CSA CISAL',
    'FIOM FIM UILM FAILMS FIMIC FILCTEM FEMCA UILTEC FILCA FENEAL UILTUCS FILLEA',
    'FILCAMS FISASCAT SLC FISTEL UILCOM FILT UILTRASPORTI FLAI UILA FPL NIDIL UILPA ORSA SIULP SAPPE FNSI',
  );
  /* Parole che innescano l'oscuramento della dicitura sindacale insieme a quella
     che le precede: «TRATTENUTA SINDACALE», «QUOTA ASSOCIATIVA». */
  const SINDACALE_PREFISSI=insieme('TRATTENUTA TRATTENUTE QUOTA QUOTE CONTRIBUTO CONTRIBUTI DELEGA RITENUTA RIT VERSAMENTO');

  const ASSENZA_PAROLE=insieme(
    'MALATTIA MALATT MAL INFORTUNIO INFORT CARENZA COMPORTO CONVALESCENZA RICOVERO DEGENZA',
    'MATERNITA PATERNITA PARENTALE ALLATTAMENTO GRAVIDANZA PUERPERIO INTERDIZIONE',
    'HANDICAP INVALIDITA INVALIDO MUTILATO TERAPIA TERAPIE EMODIALISI DIALISI ONCOLOGICA SALVAVITA DONAZIONE AVIS AIDO',
  );
  /* Parole assorbite quando precedono un motivo di assenza: «PERMESSO LEGGE 104»,
     «CONGEDO PARENTALE», «VISITA MEDICA». */
  const ASSENZA_PREFISSI=insieme('PERMESSO PERMESSI CONGEDO CONGEDI ASSENZA ASSENZE LEGGE L ART ARTICOLO 33 VISITA MEDICA ASPETTATIVA INDENNITA GG');

  const ETICHETTE_NOME=insieme('DIPENDENTE LAVORATORE LAVORATRICE NOMINATIVO NOME SIG SIGRA SIGNOR SIGNORA');

  const parole=testo=>[...String(testo).matchAll(/\S+/g)]
    .map(m=>({testo:m[0],inizio:m.index,fine:m.index+m[0].length}));

  const importoLike=parola=>/^[€]?[+-]?\d{1,3}(?:\.\d{3})*,\d{1,4}[€%]?$/.test(parola)
    ||/^\d+[,.]\d+\s*%?$/.test(parola)||/^\d{1,3},\d{2}$/.test(parola);
  const nomeLike=parola=>{
    const n=normalizza(parola);
    return n.length>=3&&/^[A-Z']+$/.test(n)&&!VOCABOLARIO.has(n);
  };

  /* Un riconoscitore riceve la riga e restituisce indici di parola. Quelli che
     ragionano per espressione regolare lavorano sul testo e poi allargano
     l'intervallo alle parole che tocca: si oscura sempre parole intere, così il
     clic dell'utente e il riconoscimento automatico parlano la stessa lingua. */
  function paroleToccate(elencoParole,inizio,fine){
    const indici=[];
    elencoParole.forEach((parola,indice)=>{
      if(parola.inizio<fine&&parola.fine>inizio)indici.push(indice);
    });
    return indici;
  }
  function daRegex(testo,elencoParole,regex,gruppo=0){
    const trovati=[];
    for(const match of testo.matchAll(regex)){
      const valore=match[gruppo];
      if(valore===undefined)continue;
      const inizio=gruppo===0?match.index:match.index+match[0].indexOf(valore);
      trovati.push(paroleToccate(elencoParole,inizio,inizio+valore.length));
    }
    return trovati.filter(indici=>indici.length);
  }

  const RE_CODICE_FISCALE=/\b[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]\b/gi;
  const RE_IBAN_IT=/\bIT\d{2}(?:[ ]?[A-Z0-9]){23}\b/gi;
  const RE_IBAN=/\b[A-Z]{2}\d{2}[A-Z0-9]{11,28}\b/gi;
  const RE_PIVA_ETICHETTA=/\b(?:P\.?\s?IVA|PART\.?\s?IVA|PARTITA\s+IVA)\b[\s:.]*(\d{11})\b/gi;
  const RE_PIVA=/\b\d{11}\b/g;
  const RE_DATA=/\b\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}\b/g;
  const RE_NASCITA=/\bNAT[OA]\b|\bNASCITA\b/i;
  const RE_MATRICOLA=/\bMATR(?:ICOLA)?\b\.?\s*(?:n\.?|N\.?|°)?\s*([A-Z0-9][A-Z0-9\-\/]{1,11})\b/g;
  const INDIRIZZO_CHIAVI=insieme('VIA VIALE VLE PIAZZA PIAZZALE PZA PZZA CORSO CSO LARGO LGO VICOLO STRADA CONTRADA FRAZIONE LOCALITA LOC BORGO SALITA TRAVERSA RESIDENTE');

  const riconoscitori=[
    {tipo:'codice-fiscale',incerto:false,trova:(riga,p)=>daRegex(riga.testo,p,RE_CODICE_FISCALE)},
    {tipo:'iban',incerto:false,trova:(riga,p)=>[
      ...daRegex(riga.testo,p,RE_IBAN_IT),...daRegex(riga.testo,p,RE_IBAN)]},
    {tipo:'partita-iva',incerto:false,trova:(riga,p)=>[
      ...daRegex(riga.testo,p,RE_PIVA_ETICHETTA,1),...daRegex(riga.testo,p,RE_PIVA)]},
    {tipo:'data-nascita',incerto:false,trova:(riga,p)=>
      RE_NASCITA.test(riga.testo)?daRegex(riga.testo,p,RE_DATA):[]},
    {tipo:'matricola',incerto:false,trova:(riga,p)=>daRegex(riga.testo,p,RE_MATRICOLA,1)},
    {tipo:'indirizzo',incerto:true,trova:(riga,p)=>{
      const trovati=[];
      p.forEach((parola,indice)=>{
        if(!INDIRIZZO_CHIAVI.has(normalizza(parola.testo)))return;
        const corsa=[];
        for(let i=indice;i<p.length;i++){
          if(importoLike(p[i].testo))break;   // l'indirizzo finisce dove inizia una colonna di numeri
          corsa.push(i);
        }
        if(corsa.length>1)trovati.push(corsa);
      });
      return trovati;
    }},
    {tipo:'cap',incerto:true,trova:(riga,p)=>{
      const trovati=[];
      p.forEach((parola,indice)=>{
        const seguente=p[indice+1];
        if(!/^\d{5}$/.test(normalizza(parola.testo))||!seguente)return;
        if(nomeLike(seguente.testo))trovati.push([indice]);
      });
      return trovati;
    }},
    {tipo:'sigla-sindacale',incerto:false,trova:(riga,p)=>{
      const trovati=[];
      p.forEach((parola,indice)=>{
        const n=normalizza(parola.testo);
        if(SIGLE_SINDACALI.has(n)){trovati.push([indice]);return;}
        const dicitura=/^SINDACAL[EI]$/.test(n)||n==='SINDACATO'||/^ASSOCIATIV[AO]$/.test(n);
        if(!dicitura)return;
        const corsa=[indice];
        const precedente=p[indice-1];
        if(precedente&&SINDACALE_PREFISSI.has(normalizza(precedente.testo)))corsa.unshift(indice-1);
        trovati.push(corsa);
      });
      return trovati;
    }},
    {tipo:'motivo-assenza',incerto:false,trova:(riga,p)=>{
      const trovati=[];
      p.forEach((parola,indice)=>{
        const n=normalizza(parola.testo);
        const legge104=/^104(?:\/92)?$/.test(n);
        if(!ASSENZA_PAROLE.has(n)&&!legge104)return;
        const corsa=[indice];
        for(let i=indice-1;i>=0;i--){
          const precedente=normalizza(p[i].testo);
          if(!ASSENZA_PREFISSI.has(precedente)&&!(legge104&&/^(?:L|ART)$/.test(precedente)))break;
          corsa.unshift(i);
        }
        trovati.push(corsa);
      });
      return trovati;
    }},
    {tipo:'nome',incerto:true,trova:(riga,p,contesto)=>{
      const trovati=[];
      const seguito=(da,quante=3)=>{
        const corsa=[];
        for(let i=da;i<p.length&&corsa.length<quante;i++){
          if(!nomeLike(p[i].testo))break;
          corsa.push(i);
        }
        return corsa;
      };
      // a. dopo l'etichetta del dipendente.
      p.forEach((parola,indice)=>{
        if(!ETICHETTE_NOME.has(normalizza(parola.testo)))return;
        const corsa=seguito(indice+1);
        if(corsa.length)trovati.push(corsa);
      });
      // b. accanto al codice fiscale: il nome gli sta quasi sempre a fianco.
      for(const indici of daRegex(riga.testo,p,RE_CODICE_FISCALE)){
        const primo=indici[0];
        const corsa=[];
        for(let i=primo-1;i>=0&&corsa.length<3;i--){
          if(!nomeLike(p[i].testo))break;
          corsa.unshift(i);
        }
        if(corsa.length)trovati.push(corsa);
        const dopo=seguito(indici[indici.length-1]+1);
        if(dopo.length)trovati.push(dopo);
      }
      // c. euristica sull'intestazione: una riga corta, senza importi, fatta di
      //    parole che non appartengono al vocabolario del cedolino.
      if(contesto.indice<INTESTAZIONE_RIGHE&&p.length<=6&&!p.some(w=>importoLike(w.testo))){
        let corsa=[];
        p.forEach((parola,indice)=>{
          if(nomeLike(parola.testo))corsa.push(indice);
          else{if(corsa.length>=2)trovati.push(corsa);corsa=[];}
        });
        if(corsa.length>=2)trovati.push(corsa);
      }
      return trovati;
    }},
  ];

  function segnala(righe){
    const segnalazioni=[];
    (righe||[]).forEach((riga,indice)=>{
      const elencoParole=parole(riga.testo);
      const assegnate=new Map();
      for(const riconoscitore of riconoscitori){
        for(const indici of riconoscitore.trova(riga,elencoParole,{indice})){
          // Chi arriva prima tiene la parola: l'ordine dei riconoscitori è la
          // loro priorità, dal più determinato al più euristico.
          const liberi=indici.filter(i=>!assegnate.has(i));
          if(!liberi.length)continue;
          liberi.forEach(i=>assegnate.set(i,riconoscitore.tipo));
          segnalazioni.push({riga:indice,parole:liberi,tipo:riconoscitore.tipo,incerto:riconoscitore.incerto});
        }
      }
    });
    return segnalazioni.sort((a,b)=>(a.riga-b.riga)||(a.parole[0]-b.parole[0]));
  }

  const chiave=(riga,parola)=>`${riga}:${parola}`;

  function statoIniziale(righe){
    const conteggi=(righe||[]).map(riga=>parole(riga.testo).length);
    const segnalazioni=segnala(righe);
    const oscurate={};
    for(const segnalazione of segnalazioni)
      for(const parola of segnalazione.parole)oscurate[chiave(segnalazione.riga,parola)]=segnalazione.tipo;
    return Object.freeze({conteggi:Object.freeze(conteggi),
      segnalazioni:Object.freeze(segnalazioni.map(Object.freeze)),
      oscurate:Object.freeze(oscurate)});
  }

  function commuta(stato,riga,parola){
    if(!(riga>=0&&riga<stato.conteggi.length))return stato;
    if(!(parola>=0&&parola<stato.conteggi[riga]))return stato;
    const k=chiave(riga,parola);
    const oscurate={...stato.oscurate};
    if(oscurate[k])delete oscurate[k];else oscurate[k]='manuale';
    return Object.freeze({...stato,oscurate:Object.freeze(oscurate)});
  }

  function applica(righe,stato){
    const usato=stato||statoIniziale(righe);
    const fuori=[];
    const conteggioPerTipo=new Map();
    const redatte=(righe||[]).map((riga,indice)=>{
      const elencoParole=parole(riga.testo);
      const segmenti=[];
      elencoParole.forEach((parola,posizione)=>{
        const tipo=usato.oscurate[chiave(indice,posizione)];
        const ultimo=segmenti[segmenti.length-1];
        if(tipo&&ultimo&&ultimo.oscurato&&ultimo.tipo===tipo){
          ultimo.parole.push(posizione);   // stessa famiglia, di seguito: un segnaposto solo
          return;
        }
        if(tipo){
          segmenti.push({testo:TIPI[tipo].segnaposto,oscurato:true,tipo,parole:[posizione]});
          conteggioPerTipo.set(tipo,(conteggioPerTipo.get(tipo)||0)+1);
          return;
        }
        segmenti.push({testo:parola.testo,oscurato:false,tipo:null,parole:[posizione]});
      });
      return{pagina:riga.pagina,y:riga.y,segmenti};
    });

    const parti=[];
    let pagina=null;
    for(const riga of redatte){
      if(pagina!==null&&riga.pagina!==pagina)parti.push(`[PAGINA ${riga.pagina}]`);
      pagina=riga.pagina;
      parti.push(riga.segmenti.map(s=>s.testo).join(' '));
    }

    for(const [tipo,conteggio] of conteggioPerTipo)
      fuori.push({tipo,etichetta:TIPI[tipo].etichetta,motivo:TIPI[tipo].motivo,conteggio});

    return{righe:redatte,testo:parti.join('\n'),elenco:fuori,
      segnalazioni:usato.segnalazioni||[]};
  }

  return{TIPI,INTESTAZIONE_RIGHE,VOCABOLARIO,SIGLE_SINDACALI,ASSENZA_PAROLE,
    parole,statoIniziale,commuta,applica,segnala,chiave};
});
