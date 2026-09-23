const fs=require('node:fs');
const path=require('node:path');
const R=require('./retribuzione-ccnl.js');
const {calcola,applicaMensilita}=require('./motore.js');
const {renderHub,renderTabella,renderLivello}=require('./ccnl-page.template.js');

/* ------------------------------------------------------------
   PAGINE SEO DEI MINIMI CCNL (RIC-59)

   Tre strati: hub, una tabella per contratto, pagine per livello.
   Nessun importo vive qui: ogni numero esce da componiRal() e dal
   motore, alla data della build. Questo file decide soltanto quali
   pagine esistono e come si chiamano.

   Le pagine per livello non sono una per riga del dataset (sarebbero
   233): esistono solo dove la domanda è misurata. Volumi DataForSEO,
   Italia, del 6 settembre (Commercio, Metalmeccanica) e del 22
   settembre 2026 (gli altri), nel commento di RIC-59.

   Slug e title seguono come la gente scrive la query:
   «5 livello ccnl commercio», «livello c3 metalmeccanico»,
   «livello d2 cooperative sociali». Niente «stipendio» negli slug.
   ------------------------------------------------------------ */

const numerico=codice=>`${codice.toLowerCase()}-livello`;
const lettera=codice=>`livello-${codice.toLowerCase()}`;
const livelloN=l=>`${l.codice.replace(/S$/i,'')}° livello${/S$/i.test(l.codice)?' super':''}`;
const livelloL=l=>`Livello ${l.codice}`;

const CONTRATTI_SEO=Object.freeze([
  {id:'terziario-confcommercio-h011',slug:'commercio',breve:'Commercio',query:'CCNL Commercio',
    titoloTabella:'CCNL Commercio',livelli:['2','3','4','5'],slugLivello:numerico,etichetta:livelloN},
  {id:'metalmeccanica-industria-c011',slug:'metalmeccanico',breve:'Metalmeccanico',query:'metalmeccanico',
    titoloTabella:'CCNL Metalmeccanico',livelli:['D1','D2','C1','C2','C3','B1','B2','B3','A1'],
    slugLivello:lettera,etichetta:livelloL},
  {id:'pubblici-esercizi-fipe-h05y',slug:'pubblici-esercizi',breve:'Pubblici esercizi',
    titoloTabella:'CCNL Pubblici esercizi (FIPE)'},
  {id:'turismo-federalberghi-h052',slug:'turismo',breve:'Turismo',query:'CCNL Turismo',
    titoloTabella:'CCNL Turismo',livelli:['3','4','5','6'],slugLivello:numerico,etichetta:livelloN,
    sezioneLivelli:'generale',
    /* «ccnl turismo 5 livello» lo scrive anche chi lavora in un bar:
       il FIPE si chiama «Pubblici esercizi… e turismo». La pagina per
       livello mostra i due contratti affiancati invece di sceglierne uno. */
    affianca:{id:'pubblici-esercizi-fipe-h05y',sezione:'generale'}},
  /* Agenzie di viaggi e tour operator hanno un contratto proprio,
     non quello degli alberghi. Solo la tabella: la domanda per livello
     non è misurata. */
  {id:'agenzie-viaggi-fiavet-h04z',slug:'agenzie-di-viaggio',breve:'Agenzie di viaggio',
    titoloTabella:'CCNL Agenzie di viaggio e tour operator'},
  {id:'logistica-trasporto-merci-i100',slug:'logistica',breve:'Logistica',
    titoloTabella:'CCNL Logistica e trasporto merci'},
  {id:'multiservizi-pulizia-k511',slug:'multiservizi',breve:'Multiservizi',query:'CCNL Multiservizi',
    titoloTabella:'CCNL Multiservizi e pulizie',livelli:['1','2','3','4'],slugLivello:numerico,
    etichetta:livelloN},
  {id:'studi-professionali-confprofessioni-h442',slug:'studi-professionali',breve:'Studi professionali',
    query:'CCNL Studi professionali',titoloTabella:'CCNL Studi professionali',
    livelli:['2','3','4','4S'],slugLivello:numerico,etichetta:livelloN},
  {id:'cooperative-sociali-t151',slug:'cooperative-sociali',breve:'Cooperative sociali',
    query:'cooperative sociali',titoloTabella:'CCNL Cooperative sociali',
    livelli:['B1','C1','C2','D1','D2','D3','E1','E2'],slugLivello:lettera,etichetta:livelloL,
    titoloLivello:'stipendio lordo e netto'},
  {id:'distribuzione-moderna-federdistribuzione-h008',slug:'dmo',breve:'DMO',
    titoloTabella:'CCNL DMO, distribuzione moderna'},
  {id:'metalmeccanica-pmi-confapi-c018',slug:'metalmeccanico-confapi',breve:'Metalmeccanico Confapi',
    titoloTabella:'CCNL Metalmeccanico Confapi'},
  {id:'grafici-editori-g011',slug:'grafici-editoriali',breve:'Grafici editoriali',
    titoloTabella:'CCNL Grafici editoriali'},
  {id:'poligrafici-quotidiani-g041',slug:'poligrafici',breve:'Poligrafici',
    titoloTabella:'CCNL Poligrafici'},
  {id:'vetro-lampade-display-b132',slug:'vetro',breve:'Vetro',titoloTabella:'CCNL Vetro'},
].map(Object.freeze));

const HUB='/minimi-ccnl/';
const rottaTabella=c=>`${HUB}${c.slug}/`;
const rottaLivello=(c,codice)=>`${HUB}${c.slug}/${c.slugLivello(codice)}/`;

/* Le rotte non dipendono dalla data: sitemap e test le leggono senza
   generare niente. */
const ROTTE=Object.freeze([HUB,
  ...CONTRATTI_SEO.flatMap(c=>[rottaTabella(c),...(c.livelli||[]).map(codice=>rottaLivello(c,codice))])]);

const COMUNE='F205';
const oggi=()=>new Date().toISOString().slice(0,10);

/* Una riga del dataset portata fino al netto, col profilo canonico
   del sito: tempo pieno, zero scatti, nessun superminimo, Milano. */
function stima(ccnl,sezione,codice,alla,extra={}){
  const composta=R.componiRal({ccnl,sezione,livello:codice,alla,...extra});
  const risultato=applicaMensilita(calcola(String(composta.ral),{comune:COMUNE,nucleo:[]}),composta.mensilita);
  return {composta,nettoAnnuo:risultato.kpi.nettoAnnuo,nettoMensile:risultato.kpi.mediaMensile};
}

function profili(id){
  const sezioni=R.sezioni(id);
  return sezioni.length?sezioni.map(s=>({sezione:s.id,nome:s.nome,descrizione:s.descrizione})):[{sezione:null,nome:null}];
}

function tabella(id,sezione,alla,rottaDi){
  const vigente=R.tabellaVigente(id,alla,sezione);
  const prossima=R.prossimaTabella(id,alla,sezione);
  const righe=vigente.livelli.map(livello=>{
    const s=stima(id,sezione,livello.codice,alla);
    const futura=prossima&&prossima.livelli.find(l=>l.codice===livello.codice);
    return {livello,...s,
      futuraMensile:futura?R.componiRal({ccnl:id,sezione,livello:livello.codice,alla:prossima.decorrenza}).baseMensile:null,
      rotta:rottaDi?rottaDi(livello.codice):null};
  });
  return {decorrenza:vigente.decorrenza,prossima:prossima?prossima.decorrenza:null,righe,
    mensilita:R.mensilitaAlla(id,alla,sezione),ore:R.oreContrattuali(id,sezione),
    scatti:R.regolaScatti(id,sezione)};
}

function datiContratto(c,alla){
  const contratto=R.trovaContratto(c.id);
  const conPagina=new Set(c.livelli||[]);
  const rottaDi=codice=>conPagina.has(codice)?rottaLivello(c,codice):null;
  return {seo:c,contratto,rotta:rottaTabella(c),esclusioni:R.ESCLUSIONI[c.id]||[],
    sezioni:profili(c.id).map(p=>({...p,...tabella(c.id,p.sezione,alla,
      !c.sezioneLivelli||c.sezioneLivelli===p.sezione||!p.sezione?rottaDi:null)}))};
}

/* Per la pagina di un livello: ogni sezione in cui il livello esiste
   (Multiservizi lo ha fra operai e impiegati), gli scatti a tappe,
   tre orari ridotti e la tranche successiva. */
function datiLivello(c,codice,alla){
  const contratto=R.trovaContratto(c.id);
  const sezioni=profili(c.id).filter(p=>!c.sezioneLivelli||p.sezione===c.sezioneLivelli)
    .filter(p=>R.trovaLivello(c.id,codice,alla,p.sezione));
  if(!sezioni.length)throw new RangeError(`Livello ${codice} assente in ${c.id} al ${alla}`);
  const righe=sezioni.map(p=>{
    const livello=R.trovaLivello(c.id,codice,alla,p.sezione);
    const base=stima(c.id,p.sezione,codice,alla);
    const regola=R.regolaScatti(c.id,p.sezione);
    const tappe=base.composta.valoreScatto!==null&&regola.tipo==='cifraFissa'&&regola.massimo>0
      ?[...new Set([1,Math.ceil(regola.massimo/2),regola.massimo])].map(n=>({n,anni:n*regola.cadenzaAnni,
        ...stima(c.id,p.sezione,codice,alla,{scatti:n})})):[];
    const ore=R.oreContrattuali(c.id,p.sezione);
    const partTime=[20,24,30].filter(h=>h<ore).map(h=>({ore:h,...stima(c.id,p.sezione,codice,alla,{oreSettimanali:h})}));
    const prossima=R.prossimaTabella(c.id,alla,p.sezione);
    const futura=prossima&&prossima.livelli.some(l=>l.codice===codice)
      ?{decorrenza:prossima.decorrenza,...stima(c.id,p.sezione,codice,prossima.decorrenza)}:null;
    return {...p,livello,...base,regola,tappe,partTime,futura,ore};
  });
  const tutti=R.livelli(c.id,alla,sezioni[0].sezione);
  const i=tutti.findIndex(l=>l.codice===codice);
  const vicino=l=>l&&{livello:l,etichetta:c.etichetta(l),
    rotta:(c.livelli||[]).includes(l.codice)?rottaLivello(c,l.codice):null};
  let affiancato=null;
  if(c.affianca){
    const altro=R.trovaContratto(c.affianca.id);
    if(R.trovaLivello(altro.id,codice,alla,c.affianca.sezione))
      affiancato={contratto:altro,seo:CONTRATTI_SEO.find(x=>x.id===altro.id),
        sezione:R.sezioni(altro.id).find(s=>s.id===c.affianca.sezione),
        ...stima(altro.id,c.affianca.sezione,codice,alla)};
  }
  return {seo:c,contratto,codice,etichetta:c.etichetta(righe[0].livello),rotta:rottaLivello(c,codice),
    rottaTabella:rottaTabella(c),righe,esclusioni:R.ESCLUSIONI[c.id]||[],affiancato,
    /* L'ordine del dataset va dal più alto al più basso in alcuni
       contratti e al contrario in altri: «sopra» e «sotto» si
       decidono sull'importo, non sulla posizione. */
    vicini:[vicino(tutti[i-1]),vicino(tutti[i+1])].filter(Boolean)
      .sort((a,b)=>a.livello.totale-b.livello.totale)};
}

function write(file,contents){
  fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,contents,'utf8');
}

function generate(outputDir=__dirname,{alla=oggi()}={}){
  const contratti=CONTRATTI_SEO.map(c=>datiContratto(c,alla));
  fs.rmSync(path.join(outputDir,'minimi-ccnl'),{recursive:true,force:true});
  const pagine=new Map();
  pagine.set(HUB,renderHub({contratti,alla}));
  for(const dati of contratti){
    pagine.set(dati.rotta,renderTabella({...dati,alla}));
    for(const codice of dati.seo.livelli||[]){
      const livello=datiLivello(dati.seo,codice,alla);
      pagine.set(livello.rotta,renderLivello({...livello,alla}));
    }
  }
  for(const [rotta,html] of pagine)write(path.join(outputDir,rotta,'index.html'),html);
  return [...pagine.keys()];
}

module.exports={CONTRATTI_SEO,ROTTE,HUB,generate,stima,datiContratto,datiLivello};
