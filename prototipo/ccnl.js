/* Catalogo di presentazione: il CCNL suggerisce come distribuire il netto
   annuale, ma non entra mai nel motore fiscale o contributivo. */
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.CCNL_CATALOGO=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const VERSIONE_CATALOGO='2026-09-23';
  const congela=contratto=>Object.freeze({...contratto,fonte:Object.freeze(contratto.fonte)});
  const CCNL=Object.freeze([
    congela({
      id:'terziario-confcommercio-h011',
      nome:'Terziario, Distribuzione e Servizi',
      parti:'Confcommercio',
      codiceCnel:'H011',
      mensilita:14,
      dataRiferimento:'2024-03-22',
      fonte:{
        titolo:'Accordo di rinnovo del CCNL Terziario, 22 marzo 2024',
        url:'https://www.confcommerciomilano.it/it/contratti_lavoro/contrattazione_collettiva/ccnl_terziario_22_marzo_2024.html',
      },
    }),
    congela({
      id:'metalmeccanica-industria-c011',
      nome:'Industria Metalmeccanica e Installazione Impianti',
      parti:'Federmeccanica / Assistal',
      codiceCnel:'C011',
      mensilita:13,
      dataRiferimento:'2025-11-22',
      fonte:{
        titolo:'CCNL Metalmeccanica, rinnovo 22 novembre 2025',
        url:'https://www.federmeccanica.it/relazioni-industriali/documenti-ccnl-22-novembre-2025.html',
      },
    }),
    /* Gruppo 1 (RIC-60): gli stessi ID del dataset in
       retribuzione-ccnl.js. Le mensilità sono quelle vigenti; per le
       Cooperative sociali 13,5 dal 2025, perché la quattordicesima è
       mezza mensilità. */
    congela({
      id:'pubblici-esercizi-fipe-h05y',
      nome:'Pubblici esercizi, ristorazione collettiva e commerciale e turismo',
      parti:'FIPE, Confcommercio, Legacoop, Confcooperative, AGCI',
      codiceCnel:'H05Y',
      mensilita:14,
      dataRiferimento:'2024-06-05',
      fonte:{
        titolo:'CCNL FIPE — il testo, gli allegati e le tabelle retributive',
        url:'https://www.fipe.it/2025/03/10/area-lavoro/ccnl-fipe-testo/ccnl-fipe-il-testo/',
      },
    }),
    congela({
      id:'turismo-federalberghi-h052',
      nome:'Turismo — alberghi e complessi turistico-ricettivi',
      parti:'Federalberghi, FAITA Federcamping, Confcommercio',
      codiceCnel:'H052',
      mensilita:14,
      dataRiferimento:'2024-07-05',
      fonte:{
        titolo:'Accordo di rinnovo del CCNL Turismo, 5 luglio 2024',
        url:'https://ce-mu.it/rapportolavoro/contratti/cms_magazine/uploads/AlberghiFederalberghi_AccordoRinnovo_5.7.24.pdf',
      },
    }),
    congela({
      id:'agenzie-viaggi-fiavet-h04z',
      nome:'Turismo — agenzie di viaggi e tour operator',
      parti:'FIAVET, Confcommercio',
      codiceCnel:'H04Z',
      mensilita:14,
      dataRiferimento:'2024-07-26',
      fonte:{
        titolo:'Accordo di rinnovo del CCNL Imprese di viaggi e turismo, 26 luglio 2024',
        url:'https://ce-mu.it/rapportolavoro/contratti/cms_magazine/uploads/AgenzieViaggioTurismo_AccordoRinnovo_26.7.24.pdf',
      },
    }),
    congela({
      id:'logistica-trasporto-merci-i100',
      nome:'Logistica, trasporto merci e spedizione',
      parti:'Confetra, Fedit, Fedespedi, Assologistica, Anita, FAI, CNA Fita, Confartigianato Trasporti e altre',
      codiceCnel:'I100',
      mensilita:14,
      dataRiferimento:'2025-09-25',
      fonte:{
        titolo:'CCNL Logistica, trasporto merci e spedizione — stesura del testo 25 settembre 2025',
        url:'https://confartigianatotrasporti.it/wp-content/uploads/2025/10/CCNL_logistica_trasporto_merci_stesura_25set2025.pdf',
      },
    }),
    congela({
      id:'multiservizi-pulizia-k511',
      nome:'Servizi di pulizia e servizi integrati/multiservizi',
      parti:'Legacoop Produzione e Servizi, Confcooperative Lavoro e Servizi, AGCI Servizi, Unionservizi Confapi',
      codiceCnel:'K511',
      mensilita:14,
      dataRiferimento:'2025-08-06',
      fonte:{
        titolo:'Accordo integrativo 6 agosto 2025 con tabelle retributive',
        url:'https://www.lps.coop/wp-content/uploads/2025/08/AccordoIntegrativoTabelleRetributive_CCNLServPul_ServIntegr_Multiservizi_0608251.pdf',
      },
    }),
    congela({
      id:'studi-professionali-confprofessioni-h442',
      nome:'Studi e attività professionali',
      parti:'Confprofessioni',
      codiceCnel:'H442',
      mensilita:14,
      dataRiferimento:'2024-02-16',
      fonte:{
        titolo:'CCNL Studi professionali, 16 febbraio 2024 — testo integrale',
        url:'https://confprofessioni.eu/wp-content/uploads/2024/09/CCNL-Studi-2024-integrale-definitivo.pdf',
      },
    }),
    congela({
      id:'cooperative-sociali-t151',
      nome:'Cooperative sociali',
      parti:'Federsolidarietà Confcooperative, Legacoopsociali, AGCI Imprese sociali',
      codiceCnel:'T151',
      mensilita:13.5,
      dataRiferimento:'2024-01-26',
      fonte:{
        titolo:'CCNL Cooperative sociali 2023–2025, testo coordinato',
        url:'https://www.federsolidarieta.confcooperative.it/Portals/0/CCNL/CCNL%20delle%20Cooperative%20Sociali%202023-2025%20.pdf',
      },
    }),
    congela({
      id:'distribuzione-moderna-federdistribuzione-h008',
      nome:'Distribuzione Moderna Organizzata',
      parti:'Federdistribuzione',
      codiceCnel:'H008',
      mensilita:14,
      dataRiferimento:'2025-09-29',
      fonte:{
        titolo:'Testo unico CCNL Distribuzione Moderna Organizzata, 29 settembre 2025',
        url:'https://www.federdistribuzione.it/app/uploads/2026/04/Testo-Unico-CCNL-DMO.pdf',
      },
    }),
    congela({
      id:'metalmeccanica-pmi-confapi-c018',
      nome:'Piccola e media industria metalmeccanica, orafa e installazione impianti',
      parti:'Unionmeccanica Confapi',
      codiceCnel:'C018',
      mensilita:13,
      dataRiferimento:'2026-06-04',
      fonte:{
        titolo:'Ipotesi di accordo di rinnovo CCNL Unionmeccanica Confapi 2025–2028, 4 giugno 2026',
        url:'https://www.uilmnazionale.it/wp-content/uploads/2026/06/20260604-CCNL-Unionmeccanica-Confapi-2025-2028.pdf',
      },
    }),
    congela({
      id:'grafici-editori-g011',
      nome:'Grafici editori — aziende grafiche ed editoriali',
      parti:'Assografici, AIE, ANES',
      codiceCnel:'G011',
      mensilita:13,
      dataRiferimento:'2023-12-19',
      fonte:{
        titolo:'Misura e decorrenza dell’incremento TEM Grafici ed Editori, 11 gennaio 2024',
        url:'https://confindustriatoscanacentroecosta.it/ccnl-grafici-editori-nuove-tabelle-parametrali/',
      },
    }),
    congela({
      id:'poligrafici-quotidiani-g041',
      nome:'Poligrafici — quotidiani e agenzie di stampa',
      parti:'FIEG, ASIG',
      codiceCnel:'G041',
      mensilita:13,
      dataRiferimento:'2021-02-15',
      fonte:{
        titolo:'Fieg — firmato il rinnovo del CCNL Poligrafici, 19 dicembre 2018',
        url:'https://www.fieg.it/salastampa_item.asp?sta_id=1218',
      },
    }),
    congela({
      id:'vetro-lampade-display-b132',
      nome:'Vetro, lampade e display — industria',
      parti:'Assovetro',
      codiceCnel:'B132',
      mensilita:13,
      dataRiferimento:'2026-04-09',
      fonte:{
        titolo:'Scioglimento della riserva sull’ipotesi di rinnovo CCNL Vetro 2026–2028, 19 maggio 2026',
        url:'https://www.filctemcgil.it/images/download/CONTRATTI/vetro_lampade/260519%20Fulc%20189%20Scioglimento%20riserva%20ipotesi%20CCNL%20INDUSTRIA%20VETRO%20LAMPADE%20E%20DISPLAY%20triennio%202026-2028.pdf',
      },
    }),
    congela({
      id:'funzioni-centrali',
      nome:'Comparto Funzioni Centrali — personale non dirigente',
      parti:'ARAN / organizzazioni sindacali',
      codiceCnel:null,
      mensilita:13,
      dataRiferimento:'2025-01-27',
      fonte:{
        titolo:'CCNL Comparto Funzioni Centrali 2022–2024',
        url:'https://www.aranagenzia.it/documento_pubblico/contratto-collettivo-nazionale-di-lavoro-del-comparto-funzioni-centrali-periodo-2022-2024/',
      },
    }),
  ]);
  const perId=new Map(CCNL.map(contratto=>[contratto.id,contratto]));

  function trovaCcnl(id){
    if(!id)return null;
    return perId.get(id)||null;
  }
  function suggerisciMensilita(id,mensilitaAttuali=13){
    if(!id)return mensilitaAttuali;
    const contratto=trovaCcnl(id);
    if(!contratto)throw new RangeError(`CCNL sconosciuto: ${id}`);
    return contratto.mensilita;
  }
  function statoMensilita(id,mensilitaAttuali){
    const contratto=trovaCcnl(id);
    if(!contratto)return{personalizzato:false,consigliate:null};
    return{personalizzato:mensilitaAttuali!==contratto.mensilita,
      consigliate:contratto.mensilita};
  }
  function preferenzaDaUrl(id,mensilitaRaw,mensilitaAttuali,mensilitaAmmesse){
    const contratto=trovaCcnl(id);
    const ccnl=contratto?id:'';
    let mensilita=contratto?contratto.mensilita:mensilitaAttuali;
    const esplicite=Number(mensilitaRaw);
    if(mensilitaAmmesse.includes(esplicite))mensilita=esplicite;
    return{ccnl,mensilita};
  }

  return Object.freeze({VERSIONE_CATALOGO,CCNL,trovaCcnl,suggerisciMensilita,
    statoMensilita,preferenzaDaUrl});
});
