const fs=require('node:fs');
const path=require('node:path');
const R=require('./retribuzione-ccnl.js');
/* RIC-143: chi genera può passare un altro catalogo (R.creaCatalogo),
   per esempio una tranche futura fittizia nei test. Le funzioni che
   leggono il dataset prendono un parametro `R` con default CATALOGO:
   dentro, `R` è il catalogo ricevuto. datiContratto lo passa al template
   in `catalogo`, per le note che rileggono le tranche; il resto del
   template legge da R regole che non dipendono dalle tabelle. */
const CATALOGO=R;
const {calcola,applicaMensilita}=require('./motore.js');
const TREDICESIMA=require('./tredicesima.js');
const {renderHub,renderTabella,renderLivello}=require('./ccnl-page.template.js');
const {CONTRATTI_SEO,ROTTE,HUB,SEO_OVERRIDE,rottaTabella,rottaLivello}=require('./ccnl-seo.config.js');

/* ------------------------------------------------------------
   PAGINE SEO DEI MINIMI CCNL (RIC-59)

   Tre strati: hub, una tabella per contratto, pagine per livello.
   Nessun importo vive qui: ogni numero esce da componiRal() e dal
   motore, alla data della build. Quali pagine esistono, come si
   chiamano e gli override di title/description stanno in
   ccnl-seo.config.js (RIC-231): qui l'override di una rotta entra nei
   render come `meta` e non si riscrive mai l'HTML già generato.
   ------------------------------------------------------------ */

const COMUNE='F205';
/* Date di corresponsione dalle fonti contrattuali archiviate nel progetto:
   Commercio art. 177; Turismo scheda Filcams; Logistica art. 19;
   Multiservizi art. 21; Studi art. 143; Cooperative art. 79 bis; DMO art. 205.
   L'art. 54 Alimentari non specifica una data unica nella parte comune. */
const PAGAMENTO_14={commercio:'a luglio',turismo:'con la retribuzione di luglio',
  logistica:'entro la prima decade di luglio',multiservizi:'entro il 15 luglio',
  'studi-professionali':'entro giugno', 'cooperative-sociali':'con la retribuzione di giugno',
  dmo:'il 1° luglio', 'industria-alimentare':null};
const oggi=()=>new Date().toISOString().slice(0,10);

/* Una riga del dataset portata fino al netto, col profilo canonico
   del sito: tempo pieno, zero scatti, nessun superminimo, Milano. */
function stima(ccnl,sezione,codice,alla,{catalogo:R=CATALOGO,...extra}={}){
  const composta=R.componiRal({ccnl,sezione,livello:codice,alla,...extra});
  const risultato=applicaMensilita(calcola(String(composta.ral),{comune:COMUNE,nucleo:[]}),composta.mensilita);
  return {composta,nettoAnnuo:risultato.kpi.nettoAnnuo,nettoMensile:risultato.kpi.mediaMensile,voci:risultato.voci};
}

function profili(id,R=CATALOGO){
  const sezioni=R.sezioni(id);
  return sezioni.length?sezioni.map(s=>({sezione:s.id,nome:s.nome,descrizione:s.descrizione})):[{sezione:null,nome:null}];
}

function tabella(id,sezione,alla,rottaDi,R=CATALOGO){
  const vigente=R.tabellaVigente(id,alla,sezione);
  const prossima=R.prossimaTabella(id,alla,sezione);
  const righe=vigente.livelli.map(livello=>{
    const s=stima(id,sezione,livello.codice,alla,{catalogo:R});
    const futura=prossima&&prossima.livelli.find(l=>l.codice===livello.codice);
    return {livello,...s,
      futuraMensile:futura?R.componiRal({ccnl:id,sezione,livello:livello.codice,alla:prossima.decorrenza}).baseMensile:null,
      rotta:rottaDi?rottaDi(livello.codice):null};
  });
  return {decorrenza:vigente.decorrenza,prossima:prossima?prossima.decorrenza:null,righe,
    mensilita:R.mensilitaAlla(id,alla,sezione),ore:R.oreContrattuali(id,sezione),
    scatti:R.regolaScatti(id,sezione)};
}

/* --- AUMENTI LETTI DAL DATASET (RIC-141) ---------------------

   Per i contratti con `aumentiDalDataset`, le tranche escono dal
   catalogo, sezione per sezione, senza date scritte qui. Si prendono
   le tabelle con decorrenza successiva ad `alla` meno 12 mesi: quelle
   scattate nell'ultimo anno restano visibili per un anno, insieme a
   tutte le future già firmate. «Prima» è il giorno precedente la
   decorrenza. La prima tabella del dataset non ha un prima da
   confrontare (R.livelli lancerebbe RangeError) e si salta.

   Ogni tranche: {decorrenza, prima, titolo, sezione, nome, aperta,
   righe:[{livello, rotta, prima, dopo, calo}]}, con `prima` e `dopo` dati
   da stima() e `calo` da caloNetto(). `aperta` è falso per le sezioni diverse da `sezioneLivelli`,
   che il template chiude in un <details>. */
const unAnnoPrima=alla=>`${Number(alla.slice(0,4))-1}${alla.slice(4)}`;
const giornoPrima=iso=>new Date(Date.parse(iso)-86400000).toISOString().slice(0,10);

function vigenteAl(id,alla,sezione,R=CATALOGO){
  try{return R.tabellaVigente(id,alla,sezione);}
  catch(e){if(e instanceof RangeError)return null;throw e;}
}

/* Dove il netto «dopo» è sotto il «prima», il motore dice perché: si
   cerca un'addizionale (comunale o regionale) esente fino a una soglia di
   imponibile che il prima non supera e il dopo sì. Soglia, ente e importi
   sono quelli del calcolo; se la causa è un'altra resta generica. */
function caloNetto(prima,dopo){
  if(!(dopo.nettoMensile<prima.nettoMensile))return null;
  const netto=Math.round((prima.nettoMensile-dopo.nettoMensile)*100)/100;
  for(const [id,addizionale] of [['addcom','comunale'],['addreg','regionale']]){
    const p=prima.voci.find(v=>v.id===id),d=dopo.voci.find(v=>v.id===id);
    const soglia=d&&d.regola&&Number(d.regola.esenzioneFinoA);
    if(p&&soglia&&p.base<=soglia&&d.base>soglia)
      return {netto,causa:{addizionale,ente:d.nome,soglia,imponibilePrima:p.base,imponibileDopo:d.base,importo:-d.importo}};
  }
  return {netto,causa:null};
}

function trancheDalDataset(c,alla,rottaDi,R=CATALOGO){
  return profili(c.id,R).flatMap(p=>{
    const aperta=!c.sezioneLivelli||!p.sezione||c.sezioneLivelli===p.sezione;
    const tranche=[];
    for(let t=R.prossimaTabella(c.id,unAnnoPrima(alla),p.sezione);t;t=R.prossimaTabella(c.id,t.decorrenza,p.sezione)){
      const prima=giornoPrima(t.decorrenza);
      if(!vigenteAl(c.id,prima,p.sezione,R))continue;
      /* Un livello che sparisce non ha un dopo, uno nuovo non ha un prima. */
      const dopo=new Set(t.livelli.map(l=>l.codice));
      tranche.push({decorrenza:t.decorrenza,prima,titolo:t.titolo,sezione:p.sezione,nome:p.nome,aperta,
        righe:R.livelli(c.id,prima,p.sezione).filter(l=>dopo.has(l.codice)).map(livello=>({livello,
          rotta:aperta&&rottaDi?rottaDi(livello.codice):null,
          prima:stima(c.id,p.sezione,livello.codice,prima,{catalogo:R}),dopo:stima(c.id,p.sezione,livello.codice,t.decorrenza,{catalogo:R})}))
          .map(r=>({...r,calo:caloNetto(r.prima,r.dopo)}))});
    }
    return tranche;
  });
}

/* RIC-144: dati per il riquadro fra i tre «metalmeccanico». Al 5° livello
   dell'Area meccanica (sezione metalmeccanica e impianti) il minimo viene
   dal dataset alla data della build. Solo le tabelle: nessuna pagina livello. */
const SEO_DI=slug=>CONTRATTI_SEO.find(x=>x.slug===slug);
function collegamentiMetalmeccanico(c,alla,R=CATALOGO){
  if(!['metalmeccanico','metalmeccanico-artigiano'].includes(c.slug))return {};
  const ponte=slug=>({seo:SEO_DI(slug),contratto:R.trovaContratto(SEO_DI(slug).id),rotta:rottaTabella(SEO_DI(slug))});
  const fuori={industria:ponte('metalmeccanico'),confapi:ponte('metalmeccanico-confapi')};
  if(c.slug!=='metalmeccanico')return fuori;
  const art=ponte('metalmeccanico-artigiano'),sezione='metalmeccanica-impianti',livello='5';
  const livelli=R.livelli(art.contratto.id,alla,sezione);
  return {confapi:fuori.confapi,artigiano:{...art,livello,primoLivello:livelli[0].codice,ultimoLivello:livelli.at(-1).codice,
    composta:stima(art.contratto.id,sezione,livello,alla,{catalogo:R}).composta}};
}

function datiContratto(c,alla,{catalogo:R=CATALOGO}={}){
  const contratto=R.trovaContratto(c.id);
  const conPagina=new Set(c.livelli||[]);
  const rottaDi=codice=>conPagina.has(codice)?rottaLivello(c,codice):null;
  return {seo:c,contratto,catalogo:R,rotta:rottaTabella(c),...collegamentiMetalmeccanico(c,alla,R),esclusioni:R.ESCLUSIONI[c.id]||[],
    aumentiDataset:c.aumentiDalDataset?trancheDalDataset(c,alla,rottaDi,R):[],
    aumenti:(c.slug==='commercio'?['2026-11-01','2027-02-01']:c.slug==='metalmeccanico'?['2026-06-01','2027-06-01','2028-06-01']:[]).map(decorrenza=>{
      const prima=new Date(Date.parse(decorrenza)-86400000).toISOString().slice(0,10);
      return {decorrenza,righe:R.livelli(c.id,prima).map(livello=>({livello,rotta:rottaDi(livello.codice),
        prima:stima(c.id,null,livello.codice,prima,{catalogo:R}),dopo:stima(c.id,null,livello.codice,decorrenza,{catalogo:R})}))};
    }),
    sezioni:profili(c.id,R).map(p=>({...p,...tabella(c.id,p.sezione,alla,
      !c.sezioneLivelli||c.sezioneLivelli===p.sezione||!p.sezione?rottaDi:null,R)}))};
}

/* Per la pagina di un livello: ogni sezione in cui il livello esiste
   (Multiservizi lo ha fra operai e impiegati), gli scatti a tappe,
   tre orari ridotti e la tranche successiva. */
function datiLivello(c,codice,alla,{catalogo:R=CATALOGO}={}){
  const contratto=R.trovaContratto(c.id);
  /* La pagina per livello chiama RAL la cifra annua in titolo, KPI e
     scomposizione: dove una quota annua manca non la si genera (RIC-77). */
  if(!R.ralCompleta(c.id))throw new RangeError(`${c.id}: cifra annua parziale, niente pagina per livello`);
  const sezioni=profili(c.id,R).filter(p=>!c.sezioneLivelli||p.sezione===c.sezioneLivelli)
    .filter(p=>R.trovaLivello(c.id,codice,alla,p.sezione));
  if(!sezioni.length)throw new RangeError(`Livello ${codice} assente in ${c.id} al ${alla}`);
  const righe=sezioni.map(p=>{
    const livello=R.trovaLivello(c.id,codice,alla,p.sezione);
    const base=stima(c.id,p.sezione,codice,alla,{catalogo:R});
    /* La modalità lordo del calcolatore parte dal minimo effettivo: la
       divisione della RAL non funziona se alcune voci hanno incidenze diverse. */
    const tredicesima=TREDICESIMA.calcolaDaLordo({lordo:String(base.composta.baseMensile),mesi:12});
    const m=base.composta.mensilita;
    const lordo14=Math.round(base.composta.quote.reduce((s,q)=>s+Math.round(q.mensile*100)*Math.max(0,q.mensilita-13),0))/100;
    const quattordicesima=m>13?TREDICESIMA.calcolaAggiuntiva({lordo:String(lordo14),mensile:String(base.composta.baseMensile),ral:String(base.composta.ral)}):null;
    const regola=R.regolaScatti(c.id,p.sezione);
    /* Con un periodo di anzianità sospeso (Bancari: 2013–2014) gli anni
       di una tappa dipendono dalla data di assunzione: la tappa dice
       solo quanti scatti, il testo della regola dice il resto (RIC-140). */
    const anniDi=n=>regola.sospensioni.length?null:regola.primoDopoAnni+(n-1)*regola.cadenzaAnni;
    const tappe=base.composta.valoreScatto!==null&&regola.tipo==='cifraFissa'&&regola.massimo>0
      ?[...new Set([1,Math.ceil(regola.massimo/2),regola.massimo])].map(n=>({n,anni:anniDi(n),
        ...stima(c.id,p.sezione,codice,alla,{scatti:n,catalogo:R})})):[];
    const ore=R.oreContrattuali(c.id,p.sezione);
    const partTime=[20,24,30].filter(h=>h<ore).map(h=>({ore:h,...stima(c.id,p.sezione,codice,alla,{oreSettimanali:h,catalogo:R})}));
    const prossima=R.prossimaTabella(c.id,alla,p.sezione);
    const futura=prossima&&prossima.livelli.some(l=>l.codice===codice)
      ?{decorrenza:prossima.decorrenza,...stima(c.id,p.sezione,codice,prossima.decorrenza,{catalogo:R})}:null;
    return {...p,livello,...base,tredicesima,quattordicesima,pagamento14:PAGAMENTO_14[c.slug]??null,regola,tappe,partTime,futura,ore};
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
        ...stima(altro.id,c.affianca.sezione,codice,alla,{catalogo:R})};
  }
  return {seo:c,contratto,codice,etichetta:c.etichetta(righe[0].livello),rotta:rottaLivello(c,codice),
    rottaTabella:rottaTabella(c),righe,esclusioni:R.ESCLUSIONI[c.id]||[],affiancato,
    /* L'ordine del dataset va dal più alto al più basso in alcuni
       contratti e al contrario in altri: «sopra» e «sotto» si
       decidono sull'importo, non sulla posizione. */
    vicini:[vicino(tutti[i-1]),vicino(tutti[i+1])].filter(Boolean)
      .sort((a,b)=>a.livello.totale-b.livello.totale)};
}

/* La RAL di ogni pagina per livello, la stessa che la pagina mostra in
   testa: serve a chi la linka da fuori, come le pagine RAL (RIC-92). */
function ralLivelli({alla=oggi(),catalogo=CATALOGO}={}){
  return CONTRATTI_SEO.flatMap(c=>(c.livelli||[]).map(codice=>{
    const d=datiLivello(c,codice,alla,{catalogo});
    return {rotta:d.rotta,slug:c.slug,nome:`${d.etichetta} ${c.breve}`,ral:d.righe[0].composta.ral};
  }));
}

function write(file,contents){
  fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,contents,'utf8');
}

/* RIC-215/RIC-231: l'override di title/description della rotta, se c'è,
   è un input del render (`meta`); il template lo applica a title,
   description, og:title e og:description e a nient'altro. */
const metaDi=rotta=>SEO_OVERRIDE[rotta];

function generate(outputDir=__dirname,{alla=oggi(),catalogo=CATALOGO}={}){
  const contratti=CONTRATTI_SEO.map(c=>datiContratto(c,alla,{catalogo}));
  fs.rmSync(path.join(outputDir,'minimi-ccnl'),{recursive:true,force:true});
  const pagine=new Map();
  pagine.set(HUB,renderHub({contratti,alla}));
  for(const dati of contratti){
    pagine.set(dati.rotta,renderTabella({...dati,alla,meta:metaDi(dati.rotta)}));
    for(const codice of dati.seo.livelli||[]){
      const livello=datiLivello(dati.seo,codice,alla,{catalogo});
      pagine.set(livello.rotta,renderLivello({...livello,alla,meta:metaDi(livello.rotta)}));
    }
  }
  for(const [rotta,html] of pagine)write(path.join(outputDir,rotta,'index.html'),html);
  return [...pagine.keys()];
}

module.exports={CONTRATTI_SEO,ROTTE,HUB,rottaTabella,generate,stima,datiContratto,datiLivello,ralLivelli,caloNetto};
