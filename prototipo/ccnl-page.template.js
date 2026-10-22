const {eur}=require('./motore.js');
const {ORIGIN}=require('./ral-page.template.js');
const R=require('./retribuzione-ccnl.js');

/* ------------------------------------------------------------
   Template delle pagine dei minimi CCNL: hub, tabella per
   contratto, pagina per livello. Ricevono dati già calcolati dal
   generatore e non fanno aritmetica propria, a parte il confronto
   fra due importi già composti.
   ------------------------------------------------------------ */

const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const MESI=['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
const data=iso=>{const [a,m,g]=iso.split('-').map(Number);return `${g===1?'1°':g} ${MESI[m-1]} ${a}`;};
const mensilitaTesto=m=>String(m).replace('.',',');
const profondita=rotta=>rotta.split('/').filter(Boolean).length;
const radice=rotta=>'../'.repeat(profondita(rotta));
/* Da una pagina all'altra dentro /minimi-ccnl/: link relativi come
   nel resto del sito, così la preview e il dominio si comportano
   allo stesso modo. */
const verso=(da,a)=>`${radice(da)}${a.replace(/^\//,'')}`;

function calcolatore(da,{ccnl,sezione,livello}){
  const q=new URLSearchParams({ccnl,...(sezione?{sezione}:{}),...(livello?{livello}:{})});
  return `${radice(da)}ccnl-livello.html?${esc(q.toString())}`;
}

/* Cadenza, decorrenza e periodi sospesi li scrive il catalogo
   (descrizioneScatti), lo stesso testo della pagina CCNL e livello. */
function scattiTesto(regola){
  const {cadenza,decorrenza}=R.descrizioneScatti(regola);
  switch(regola.tipo){
    case 'assenti':return 'nessuno scatto di anzianità';
    case 'quotaUnica':return `nessuno scatto: una quota unica di anzianità forfettaria dopo ${regola.dopoAnni} anni`;
    case 'percentualeMaturazione':return `fino a ${regola.massimo} scatti, ${cadenza}${decorrenza}, calcolati in percentuale della tabella del momento`;
    default:return `fino a ${regola.massimo} scatti, ${cadenza}${decorrenza}`;
  }
}
/* I periodi sospesi sono frasi intere: vanno dopo il punto. */
const sospensioniTesto=regola=>R.descrizioneScatti(regola).sospensioni;

function layout({rotta,title,description,briciole,body,jsonLd=true}){
  const r=radice(rotta);
  const canonical=`${ORIGIN}${rotta}`;
  const ld=jsonLd?`\n<script type="application/ld+json">${JSON.stringify({
    '@context':'https://schema.org','@type':'BreadcrumbList',
    itemListElement:briciole.map((b,i)=>({'@type':'ListItem',position:i+1,name:b.nome,
      item:`${ORIGIN}${b.rotta}`})),
  }).replace(/</g,'\\u003c')}</script>`:'';
  const nav=briciole.map((b,i)=>i===briciole.length-1
    ?`<span aria-current="page">${esc(b.nome)}</span>`
    :`<a href="${b.rotta==='/'?'/':verso(rotta,b.rotta)}">${esc(b.nome)}</a><span class="breadcrumb__sep" aria-hidden="true">›</span>`).join('');
  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" href="data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org/2000/svg%27%20viewBox%3D%270%200%2032%2032%27%3E%3Cpath%20d%3D%27M6%200H32V26L26%2032H0V6Z%27%20fill%3D%27%231E1C2B%27/%3E%3Ctext%20x%3D%2716%27%20y%3D%2723%27%20font-family%3D%27system-ui%2Csans-serif%27%20font-size%3D%2719%27%20font-weight%3D%27700%27%20fill%3D%27%2321D4E3%27%20text-anchor%3D%27middle%27%3E%E2%82%AC%3C/text%3E%3C/svg%3E">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonical}">
<link rel="stylesheet" href="${r}draftsman.css">
<link rel="stylesheet" href="${r}ral-page.css">
<link rel="stylesheet" href="${r}ccnl-pages.css">
<script src="${r}analytics.js" async></script>${ld}
</head>
<body>
<a class="skip-link" href="#contenuto">Vai al contenuto</a>
<header class="site-header"><div class="site-header__in">
  <a class="site-brand" href="/" aria-label="Dove va la tua RAL — home">Dove va la tua RAL</a>
  <button class="site-menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav"><span class="site-menu-toggle__icon" aria-hidden="true"></span><span class="sr">Apri il menu</span></button>
  <nav class="site-nav" id="site-nav" aria-label="Navigazione principale"><div class="site-nav__group" data-current><button class="site-nav__trigger" type="button" aria-expanded="false" aria-controls="nav-calcola">Calcola</button><div class="site-nav__submenu" id="nav-calcola"><a href="/">RAL → Netto</a><a href="${r}netto-ral.html">Netto → RAL</a><a href="${r}ccnl-livello.html">CCNL e livello</a><a href="/calcolo-tredicesima/">Tredicesima</a></div></div><div class="site-nav__group"><button class="site-nav__trigger" type="button" aria-expanded="false" aria-controls="nav-confronta">Confronta</button><div class="site-nav__submenu" id="nav-confronta"><a href="${r}compara.html">Due offerte</a><a href="${r}confronti-ral/">Livelli di RAL</a><a href="${r}minimi-ccnl/"${rotta==='/minimi-ccnl/'?' aria-current="page"':''}>Minimi CCNL</a></div></div><a href="${r}netto-o-niente.html">Gioca</a><a href="/blog/">Blog</a><a href="${r}la-storia.html">La storia</a></nav>
</div></header>
<nav class="breadcrumb" aria-label="Percorso"><div class="shell breadcrumb__in">${nav}</div></nav>
<main id="contenuto" class="ral-main ccnl-main"><div class="shell">
${body}
</div></main>
<footer class="footer ral-footer"><div class="shell"><span>© 2026 Dove va la tua RAL</span><a href="${verso(rotta,'/minimi-ccnl/')}">Tutti i minimi CCNL</a></div></footer>
<script src="${r}site-nav.js"></script></body>
</html>
`;
}

const PROFILO=`Dove non è indicato diversamente, netto stimato con le regole fiscali 2026 per un dipendente privato a Milano, anno intero, tempo pieno, senza familiari a carico, senza scatti di anzianità e senza superminimo.`;

function fonte(contratto){
  const f=contratto.fonte;
  const normativa=contratto.fonteNormativa;
  const riferimento=normativa
    ?` Fonte normativa: <a href="${esc(normativa.url)}" rel="nofollow">${esc(normativa.titolo)}</a>. Verificata il ${data(normativa.verificataIl)}.`:'';
  return `<a href="${esc(f.url)}" rel="nofollow">${esc(f.titolo)}</a> — ${esc(f.parte)}. Verificata il ${data(f.verificataIl)}.${riferimento}`;
}

function avvisoFonte(contratto){
  return contratto.notaFonte
    ?`<div class="callout callout--warn"><span class="callout__mark">Fonte</span><div>${esc(contratto.notaFonte)}</div></div>`:'';
}

/* RIC-77: dove il contratto prevede una quota annua che nessuna fonte
   quantifica, la cifra annua è una base parziale e il netto pure. */
function avvisoParziale(contratto){
  const avviso=R.avvisoRalParziale(contratto.id);
  return avviso?`<div class="callout callout--warn"><span class="callout__mark">Parziale</span><div>${esc(avviso)}</div></div>`:'';
}
const nettoMese=id=>R.ralCompleta(id)?'Netto medio al mese':'Netto medio al mese sulla base parziale';

function esclusioni(voci){
  return `<details class="limiti"><summary>Che cosa questi importi non contengono</summary><ul>${
    voci.map(v=>`<li>${esc(v)}</li>`).join('')}</ul></details>`;
}

/* --- HUB ---------------------------------------------------- */

function renderHub({contratti,alla}){
  const rotta='/minimi-ccnl/';
  const card=d=>{
    const righe=d.sezioni.flatMap(s=>s.righe);
    const min=Math.min(...righe.map(r=>r.composta.baseMensile));
    const max=Math.max(...righe.map(r=>r.composta.baseMensile));
    const livelli=(d.seo.livelli||[]).length;
    const parziale=d.contratto.quoteAnnueMancanti.length
      ?`<small>Copertura parziale: la cifra annua non comprende il ${esc(d.contratto.quoteAnnueMancanti.map(q=>q.nome).join(' e il '))}.</small>`:'';
    return `<a class="hub-card" href="${verso(rotta,d.rotta)}"><span class="micro">${esc(d.contratto.codiceCnel)} · ${esc(d.contratto.parti)}</span><b>${esc(d.seo.titoloTabella)}</b><small>${esc(d.contratto.nome)} · da ${eur(min)} a ${eur(max)} lordi al mese${livelli?` · ${livelli} pagine per livello`:''}</small>${parziale}<span aria-hidden="true">→</span></a>`;
  };
  const parziali=contratti.filter(d=>d.contratto.quoteAnnueMancanti.length);
  /* RIC-144: sigle e codici CNEL dei contratti omonimi si leggono dal dataset. */
  const cnel=id=>esc(R.trovaContratto(id).codiceCnel);
  const lnk=(slug,testo)=>`<a href="${verso(rotta,`/minimi-ccnl/${slug}/`)}">${testo}</a>`;
  const body=`<header class="ral-intro"><div class="eyebrow">Minimi CCNL 2026</div>
    <h1>Minimi CCNL: tabelle retributive, lordo e netto</h1>
    <p class="lead">${contratti.length} contratti collettivi, livello per livello: il minimo lordo mensile che il CCNL fissa, la RAL che ne risulta e il netto che ne resta. Tutti ricalcolati con le tabelle in vigore e le regole fiscali 2026.</p>
    <p class="ral-thesis">Gli importi sono la base nazionale: scatti, superminimo e integrativi si aggiungono sopra.</p>
    ${parziali.map(d=>`<p class="small">Per il ${esc(d.seo.titoloTabella)} la cifra annua è una base tabellare parziale e non va confrontata con la RAL degli altri contratti: manca il ${esc(d.contratto.quoteAnnueMancanti.map(q=>`${q.nome} (${q.fonte})`).join(' e il '))}.</p>`).join('')}
  </header>
  <section class="ccnl-omonimi" aria-labelledby="omonimi-titolo">
    <h2 id="omonimi-titolo">Nomi che si confondono</h2>
    <div class="ccnl-omonimi__grid">
      <article><h3>«Commercio» sono due contratti</h3><p>Il <a href="${verso(rotta,'/minimi-ccnl/commercio/')}">CCNL Terziario Confcommercio</a> (H011) e il <a href="${verso(rotta,'/minimi-ccnl/dmo/')}">CCNL Distribuzione moderna organizzata</a> (H008), applicato da molte catene della grande distribuzione. Hanno gli stessi livelli, importi vicini ma non identici: controlla quale è scritto nella tua lettera di assunzione.</p></article>
      <article><h3>«Turismo» sono tre contratti</h3><p>Il <a href="${verso(rotta,'/minimi-ccnl/turismo/')}">CCNL Turismo Federalberghi</a> (H052) vale per alberghi e campeggi; bar, ristoranti e mense applicano il <a href="${verso(rotta,'/minimi-ccnl/pubblici-esercizi/')}">CCNL Pubblici esercizi FIPE</a> (H05Y), che nel nome dice anche «turismo»; agenzie di viaggi e tour operator hanno il <a href="${verso(rotta,'/minimi-ccnl/agenzie-di-viaggio/')}">CCNL Imprese di viaggi e turismo FIAVET</a> (H04Z), con importi e decorrenze diversi da quelli degli alberghi.</p></article>
      <article><h3>«Metalmeccanico» sono tre contratti</h3><p>Il ${lnk('metalmeccanico','CCNL Metalmeccanico industria')} Federmeccanica-Assistal (${cnel('metalmeccanica-industria-c011')}) vale per l’industria; il ${lnk('metalmeccanico-confapi','CCNL Metalmeccanico PMI')} Unionmeccanica-Confapi (${cnel('metalmeccanica-pmi-confapi-c018')}) per le piccole e medie imprese associate; il ${lnk('metalmeccanico-artigiano','CCNL Area meccanica dell’artigianato')} di Confartigianato, CNA, Casartigiani e CLAAI (${cnel('area-meccanica-artigianato-c030')}) per le aziende artigiane. Ognuno ha livelli e importi propri. C’è anche un contratto «metalmeccanico artigiano» firmato da Conflavoro, con importi suoi, che queste tabelle non coprono: il codice CNEL è in busta paga.</p></article>
      <article><h3>«Bancari»: l’ABI non è il credito cooperativo</h3><p>Il ${lnk('bancari','CCNL Credito ABI')} (${cnel('credito-abi-j241')}) vale per le banche associate all’ABI, per le aree professionali e i quadri direttivi. Le banche di credito cooperativo applicano un contratto proprio, che queste tabelle non coprono.</p></article>
    </div>
  </section>
  <section class="hub-grid" aria-label="Elenco dei contratti">${contratti.map(card).join('\n      ')}</section>
  <aside class="personalize"><a class="btn btn--primary btn--lg" href="${calcolatore(rotta,{ccnl:contratti[0].contratto.id})}">Calcola il tuo livello →</a><p>Aggiungi anzianità, superminimo e orario ridotto nel calcolatore CCNL e livello.</p></aside>
  <p class="ral-disclaimer">${PROFILO} Tabelle in vigore al ${data(alla)}. Non costituisce consulenza fiscale o del lavoro.</p>`;
  return layout({rotta,title:'Minimi CCNL 2026: tabelle retributive, lordo e netto per livello',
    description:`Tabelle retributive 2026 di ${contratti.length} CCNL, dal Commercio ai Bancari: minimo lordo mensile, RAL e netto stimato per ogni livello, con fonti e decorrenze.`,
    briciole:[{nome:'Home',rotta:'/'},{nome:'Minimi CCNL',rotta}],body});
}

/* --- TABELLA PER CONTRATTO ---------------------------------- */

function tabellaSezione(rotta,d,s){
  const futura=s.prossima!==null;
  const righe=s.righe.map(r=>{
    const nome=r.livello.exCategoria?`${esc(r.livello.nome)} <small>(ex ${esc(r.livello.exCategoria)}ª cat.)</small>`:esc(r.livello.nome);
    return `<tr><th scope="row">${r.rotta?`<a href="${verso(rotta,r.rotta)}">${nome}</a>`:nome}</th><td>${eur(r.composta.baseMensile)}</td>${futura?`<td>${r.futuraMensile===null?'—':eur(r.futuraMensile)}</td>`:''}<td>${eur(r.composta.ral)}</td><td>${eur(r.nettoMensile)}</td></tr>`;
  }).join('');
  const id=d.contratto.id;
  return `<div class="ccnl-tabella__scroll"><table class="ccnl-tabella">
    <caption>${s.nome?`${esc(s.nome)} — `:''}tabella in vigore dal ${data(s.decorrenza)} · ${mensilitaTesto(s.mensilita)} mensilità · ${s.ore} ore settimanali</caption>
    <thead><tr><th scope="col">Livello</th><th scope="col">Minimo lordo mensile</th>${futura?`<th scope="col">Dal ${data(s.prossima)}</th>`:''}<th scope="col">${esc(R.etichettaAnnua(id))}</th><th scope="col">${nettoMese(id)}</th></tr></thead>
    <tbody>${righe}</tbody></table></div>`;
}

/* La tabella prima/dopo di una tranche: la usano commercio e
   metalmeccanico (date scritte nel generatore) e il blocco letto dal
   dataset (RIC-141). */
function tabellaAumento(rotta,righe,caption){
  return `<div class="ccnl-tabella__scroll"><table class="ccnl-tabella"><caption>${caption}</caption>
      <thead><tr>${['Livello','Lordo prima','Aumento lordo','Lordo dopo','Netto medio prima','Netto medio dopo'].map(t=>`<th scope="col">${t}</th>`).join('')}</tr></thead>
      <tbody>${righe.map(r=>`<tr data-livello="${r.livello.codice}"><th scope="row">${r.rotta?`<a href="${verso(rotta,r.rotta)}">${esc(r.livello.nome)}</a>`:esc(r.livello.nome)}</th><td>${eur(r.prima.composta.baseMensile)}</td><td>+${eur(r.dopo.composta.baseMensile-r.prima.composta.baseMensile)}</td><td>${eur(r.dopo.composta.baseMensile)}</td><td>${eur(r.prima.nettoMensile)}</td><td>${eur(r.dopo.nettoMensile)}</td></tr>`).join('')}</tbody></table></div>`;
}

function tabelleAumenti(d){
  return d.aumenti.map(a=>`<section class="ccnl-aumento" data-decorrenza="${a.decorrenza}"><h3>Dal ${data(a.decorrenza)}</h3>
      ${tabellaAumento(d.rotta,a.righe,`Aumento del ${data(a.decorrenza)} — importi mensili in euro`)}</section>`).join('');
}

/* --- AUMENTI LETTI DAL DATASET (RIC-141) ---------------------

   Acceso da `aumentiDalDataset` in CONTRATTI_SEO; tranche e righe le
   prepara il generatore in d.aumentiDataset. Qui nessuna data e nessun
   importo scritti a mano: titolo, intestazioni e limiti si leggono dalle
   tranche. Le sezioni diverse da `sezioneLivelli` stanno in un
   <details> chiuso. */
const ANNO_REGOLE='2026'; // le regole fiscali del motore, come in PROFILO
const elenco=v=>v.length>1?`${v.slice(0,-1).join(', ')} e ${v.at(-1)}`:v.join('');

function aumentiDalDataset(d){
  const tranche=d.aumentiDataset||[];
  if(!d.seo.aumentiDalDataset||!tranche.length)return '';
  const date=[...new Set(tranche.map(t=>t.decorrenza))].sort();
  const anni=[...new Set(date.map(x=>x.slice(0,4)))];
  const titolo=date.length===1?`Aumento del ${data(date[0])}`
    :`Aumenti ${anni.length===1?anni[0]:`${anni[0]}–${anni.at(-1)}`}`;
  const oltre=anni.filter(a=>a>ANNO_REGOLE).map(a=>`il ${a}`);
  const mensilita=[...new Set(tranche.flatMap(t=>t.righe.flatMap(r=>[r.prima.composta.mensilita,r.dopo.composta.mensilita])))];
  const conSezioni=tranche[0].sezione!==null;
  /* Netto dopo sotto il prima: una riga di spiegazione, con soglia ed
     ente presi dal motore (caloNetto nel generatore). */
  const etichetta=l=>d.seo.etichetta?d.seo.etichetta(l):`Livello ${l.nome}`;
  const nota=r=>{
    const c=r.calo,x=c.causa;
    const perche=x?`L’imponibile IRPEF annuo passa da ${eur(x.imponibilePrima)} a ${eur(x.imponibileDopo)} e supera i ${eur(x.soglia)} fino a cui ${x.addizionale==='comunale'?'il Comune di':'la Regione'} ${esc(x.ente)} esenta dall’addizionale ${x.addizionale}: l’addizionale diventa dovuta, ${eur(x.importo)} l’anno.`
      :`Con il nuovo lordo imposte e detrazioni del calcolo ${ANNO_REGOLE} cambiano più dell’aumento.`;
    return `<p class="small ccnl-aumento__nota" data-livello="${esc(r.livello.codice)}">${esc(etichetta(r.livello))}: il netto medio scende di ${eur(c.netto)} al mese nonostante l’aumento lordo. ${perche}</p>`;
  };
  const blocco=t=>`<section class="ccnl-aumento" data-decorrenza="${t.decorrenza}"${t.sezione?` data-sezione="${esc(t.sezione)}"`:''}>
      <${conSezioni?'h4':'h3'}>${t.decorrenza>d.alla?'Dal':'In vigore dal'} ${data(t.decorrenza)}</${conSezioni?'h4':'h3'}>
      ${tabellaAumento(d.rotta,t.righe,`${t.nome?`${esc(t.nome)} — `:''}${esc(t.titolo)} — importi mensili in euro`)}${t.righe.filter(r=>r.calo).map(nota).join('')}</section>`;
  const perSezione=[...new Set(tranche.map(t=>t.sezione))].map(s=>tranche.filter(t=>t.sezione===s));
  const sezioni=perSezione.map(ts=>!conSezioni?ts.map(blocco).join('')
    :ts[0].aperta?`<div class="ccnl-aumenti__sezione"><h3>${esc(ts[0].nome)}</h3>${ts.map(blocco).join('')}</div>`
    :`<details class="ccnl-aumenti__sezione"><summary>${esc(ts[0].nome)}</summary>${ts.map(blocco).join('')}</details>`).join('\n    ');
  return `<section class="ccnl-aumenti" id="aumenti"><h2>${titolo}: lordo e netto prima e dopo</h2>
    <p>Confronto a parità di condizioni: regole fiscali ${ANNO_REGOLE}${oltre.length?` anche per ${elenco(oltre)}`:''}, RAL annualizzata su ${mensilita.length===1?`${mensilitaTesto(mensilita[0])} mensilità`:'le mensilità di ciascuna sezione'}. Il netto è una media annua, non il cedolino del mese dell’aumento${oltre.length?', e non è una previsione delle imposte future':''}. Un superminimo assorbibile può ridurre l’aumento effettivo in busta paga.</p>
    ${sezioni}
    ${notaAumenti(d)}
    <p class="small">Fonte degli aumenti: ${fonte(d.contratto)}</p>
  </section>`;
}

/* Domande frequenti con schema FAQPage: il testo della risposta è lo
   stesso nella pagina e nello schema; i link stanno solo nella pagina. */
function faqConSchema(rotta,{id,titolo,voci}){
  const schema={'@context':'https://schema.org','@type':'FAQPage',mainEntity:voci.map(v=>({'@type':'Question',name:v.domanda,acceptedAnswer:{'@type':'Answer',text:v.risposta}}))};
  const link=l=>`<a href="${l.href.startsWith('#')?l.href:verso(rotta,l.href)}">${esc(l.testo)}</a>`;
  return `<section class="ccnl-faq"><h2>${esc(titolo)}</h2>${voci.map(v=>`<h3>${esc(v.domanda)}</h3><p>${esc(v.risposta)} ${v.link.map(link).join(' · ')}.</p>`).join('')}</section>
    <script id="${esc(id)}" type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script>`;
}

/* --- GOMMA PLASTICA, CHIMICO, ALIMENTARE (RIC-142) -----------

   Nota sotto il blocco aumenti e FAQ. Le date dei fatti normativi (il
   livello I che sparisce, l'IAR di settembre 2027) sono quelle delle
   fonti in processo/fonti-ccnl-gruppo2-*: la nota esce solo se la
   tranche corrispondente è nel blocco. Importi e mensilità vengono dal
   dataset. */
const unaNota=t=>`<p class="small ccnl-aumenti__nota">${t}</p>`;
const importoVoce=(l,id)=>(l.voci.find(v=>v.id===id)||{importo:0}).importo;
/* Tranche in cui compare un EDR che la tabella precedente non aveva. */
function trancheNuovoEdr(d){
  return (d.aumentiDataset||[]).find(t=>R.livelli(d.contratto.id,t.decorrenza,t.sezione).some(l=>importoVoce(l,'edr')>0)
    &&!R.livelli(d.contratto.id,t.prima,t.sezione).some(l=>importoVoce(l,'edr')>0));
}
/* Tranche in cui cambia solo l'IAR: ogni altra voce resta com'era. */
function trancheSoloIar(d,t){
  const id=d.contratto.id,prima=R.livelli(id,t.prima,t.sezione);
  const dopo=R.livelli(id,t.decorrenza,t.sezione).filter(l=>prima.some(p=>p.codice===l.codice));
  const cambia=(l,voce)=>{const p=prima.find(x=>x.codice===l.codice);return importoVoce(l,voce)!==importoVoce(p,voce);};
  const voci=[...new Set(dopo.flatMap(l=>l.voci.map(v=>v.id)))];
  return dopo.some(l=>cambia(l,'iar'))&&!dopo.some(l=>voci.some(v=>v!=='iar'&&cambia(l,v)));
}
const sezioneTranche=(d,t)=>t.sezione===(sezionePrincipale(d).sezione);
function notaAumenti(d){
  const tranche=d.aumentiDataset||[],fatti=(R.FATTI_AUMENTI||{})[d.contratto.id]||{};
  const gomma=fatti.livelloEliminato;
  if(gomma&&tranche.some(t=>t.decorrenza===gomma.dal))
    return unaNota(`Dal ${data(gomma.dal)} il livello ${esc(gomma.livello)} è eliminato nelle aree ${esc(gomma.aree)}, con le posizioni riclassificate nel livello ${esc(gomma.riclassificatoIn)}. La tabella lo riporta ancora e il calcolo lo mantiene.`);
  const chimico=fatti.trattamentoComplessivo,t=chimico&&trancheNuovoEdr(d);
  if(t){
    const edr=R.livelli(d.contratto.id,t.decorrenza,t.sezione).map(l=>({codice:l.codice,importo:importoVoce(l,'edr')}))
      .filter(x=>x.importo>0).sort((a,b)=>a.importo-b.importo);
    return unaNota(`Dal ${data(t.decorrenza)} l’aumento comprende il nuovo EDR, da ${eur(edr[0].importo)} (${esc(edr[0].codice)}) a ${eur(edr.at(-1).importo)} (${esc(edr.at(-1).codice)}), su ${mensilitaTesto(t.righe[0].dopo.composta.mensilita)} mensilità. Il «trattamento economico complessivo» di ${eur(chimico.importo).replace(',00','')} annunciato per la ${esc(chimico.livello)} comprende ${esc(chimico.comprende)}: non è un aumento della RAL.`);
  }
  const iar=tranche.find(t=>sezioneTranche(d,t)&&trancheSoloIar(d,t));
  if(iar)return unaNota(`Il ${data(iar.decorrenza)} sale solo l’IAR; i minimi restano quelli del ${data(R.tabellaVigente(d.contratto.id,iar.prima,iar.sezione).decorrenza)}.`);
  return '';
}

const BREVI={minimo:'minimo',ipo:'IPO',edr:'EDR',iar:'IAR',contingenza:'contingenza'};
const sezionePrincipale=d=>d.sezioni.find(s=>s.sezione===d.seo.sezioneLivelli)||d.sezioni[0];
const rigaDi=(d,codice)=>sezionePrincipale(d).righe.find(r=>r.livello.codice===codice);
const vaiAlLivello=(r,nome)=>r&&r.rotta?{href:r.rotta,testo:`Vedi ${nome}`}:{href:'#aumenti',testo:'Aumenti in tabella'};

/* «Quanto prende netto…»: minimo (o minimo composto con le sue voci), netto medio e profilo. */
function vociNetto(d,codice,di){
  const s=sezionePrincipale(d),r=rigaDi(d,codice);
  const voci=r.livello.voci.filter(v=>v.importo>0);
  const composto=voci.length>1
    ?`Il minimo composto ${di} è ${eur(r.composta.baseMensile)} lordi al mese (${voci.map(v=>`${BREVI[v.id]||v.nome.toLowerCase()} ${eur(v.importo)}`).join(', ')})`
    :`Il minimo vigente ${di} è ${eur(r.composta.baseMensile)} lordi al mese`;
  return {risposta:`${composto}: il netto medio stimato è ${eur(r.nettoMensile)} su ${mensilitaTesto(s.mensilita)} mensilità, per un tempo pieno a Milano senza scatti né superminimo.`};
}

function faqGruppo2(d){
  const slug=d.seo.slug;
  if(!['gomma-plastica','chimico-farmaceutico','industria-alimentare'].includes(slug))return '';
  const s=sezionePrincipale(d);
  const tranche=(d.aumentiDataset||[]).filter(t=>t.sezione===s.sezione);
  const future=tranche.filter(t=>t.decorrenza>d.alla);
  const netto=(codice,nome,di,domanda)=>{const v=vociNetto(d,codice,di);return {domanda,risposta:v.risposta,link:[vaiAlLivello(rigaDi(d,codice),nome)]};};
  let voci=[];
  if(slug==='gomma-plastica'){
    const h=rigaDi(d,'H'),ultima=future.at(-1),h2=ultima&&ultima.righe.find(r=>r.livello.codice==='H');
    const anni=[...new Set(tranche.map(t=>t.decorrenza.slice(0,4)))];
    voci=[
      netto('H','il livello H','del livello H','Quanto prende netto il livello H del CCNL gomma plastica?'),
      netto('F','il livello F','del livello F','Quanto prende netto il livello F?'),
      ...(h2?[{domanda:`Quali sono gli aumenti del rinnovo ${anni[0]}–${anni.at(-1)}?`,
        risposta:`L’ipotesi del 10 dicembre 2025 (art. 17) fissa le tranche del ${elenco(tranche.map(t=>data(t.decorrenza)))}. Al livello H il minimo vigente di ${eur(h.composta.baseMensile)} arriva a ${eur(h2.dopo.composta.baseMensile)} lordi al mese dal ${data(ultima.decorrenza)}.`,
        link:[vaiAlLivello(h,'il livello H')]}]:[]),
      {domanda:'Quante mensilità ha il CCNL gomma plastica?',
        risposta:`${mensilitaTesto(s.mensilita)} (art. 25): tredicesima compresa. Il netto in tabella è una media annua su ${mensilitaTesto(s.mensilita)} mensilità, non il valore del singolo cedolino.`,
        link:[vaiAlLivello(h,'il livello H')]},
    ];
  }
  if(slug==='chimico-farmaceutico'){
    const e3=rigaDi(d,'E3');
    voci=[
      netto('E3','l’E3','dell’E3','Quanto prende netto un E3 nel CCNL chimico farmaceutico?'),
      netto('D1','il D1','del D1','Quanto prende netto un D1?'),
      ...(s.scatti.tipo==='assenti'?[{domanda:'Nel chimico ci sono gli scatti di anzianità?',
        risposta:'No: sono aboliti dal 1° gennaio 2010 (art. 17). Gli importi maturati fino al 31 dicembre 2009 restano come superminimo individuale non assorbibile, da sommare al tuo superminimo.',
        link:[vaiAlLivello(e3,'l’E3')]}]:[]),
      {domanda:'Il CCNL chimico ha 13 o 14 mensilità?',
        risposta:`${mensilitaTesto(s.mensilita)} nel settore chimico e chimico-farmaceutico (art. 21), non 14. La 14ª mensilità è dei soli lubrificanti e GPL, che queste tabelle non coprono. Il netto in tabella è una media su ${mensilitaTesto(s.mensilita)} mensilità.`,
        link:[vaiAlLivello(e3,'l’E3')]},
    ];
  }
  if(slug==='industria-alimentare'){
    const c5=rigaDi(d,'5'),edr=c5.livello.voci.find(v=>v.id==='edr'&&v.mensilita);
    const anno=tranche.at(-1)&&tranche.at(-1).decorrenza.slice(0,4);
    const ts=tranche.filter(t=>t.decorrenza.startsWith(anno));
    const riga5=t=>t.righe.find(r=>r.livello.codice==='5');
    /* Ultima tranche dei minimi seguita da una di solo IAR: lo dicono le voci del dataset. «Seconda» tranche dell'IAR è dalla fonte (IAR dal 1/12/2023 e dal 1/9/2027). */
    const proprio=ts.length===2&&!trancheSoloIar(d,ts[0])&&trancheSoloIar(d,ts[1])&&riga5(ts[0])&&riga5(ts[1]);
    voci=[
      ...(edr?[{domanda:'Quante mensilità ha il CCNL industria alimentare?',
        risposta:`${mensilitaTesto(s.mensilita)}: tredicesima e quattordicesima (art. 54). L’EDR di ${eur(edr.importo)} vale ${mensilitaTesto(edr.mensilita)} mensilità (art. 52). Il netto in tabella è una media annua su ${mensilitaTesto(s.mensilita)} mensilità.`,
        link:[vaiAlLivello(c5,'il 5° livello')]}]:[]),
      ...(proprio?[{domanda:`Quali aumenti ci sono nel ${anno}?`,
        risposta:`Il ${data(ts[0].decorrenza)} scatta l’ultima tranche dei minimi, il ${data(ts[1].decorrenza)} la seconda tranche dell’IAR. Al 5° livello il lordo mensile passa da ${eur(riga5(ts[0]).prima.composta.baseMensile)} a ${eur(riga5(ts[0]).dopo.composta.baseMensile)} a gennaio e a ${eur(riga5(ts[1]).dopo.composta.baseMensile)} a ${MESI[Number(ts[1].decorrenza.slice(5,7))-1]}.`,
        link:[vaiAlLivello(c5,'il 5° livello')]}]:[]),
      netto('5','il 5° livello','del 5° livello','Quanto prende netto il 5° livello?'),
    ];
  }
  return faqConSchema(d.rotta,{id:`faq-${slug}`,titolo:`Domande frequenti sul ${d.seo.titoloTabella}`,voci});
}

/* RIC-141: le risposte leggono la tabella principale e il blocco
   aumenti. Il 5° livello è il più cercato (RIC-137). Il codice C049 del
   contratto Conflavoro è verificato sull'archivio CNEL: vedi
   processo/fonti-ccnl-gruppo2-area-meccanica.md. */
function faqMetalmeccanicoArtigiano(d){
  if(d.seo.slug!=='metalmeccanico-artigiano')return '';
  const sezione=d.sezioni.find(s=>s.sezione==='metalmeccanica-impianti');
  const r5=sezione.righe.find(r=>r.livello.codice==='5');
  const vai=r=>r&&r.rotta?{href:r.rotta,testo:`Vedi il ${r.livello.codice}° livello`}
    :{href:`#${sezione.sezione}`,testo:`Tabella ${sezione.nome.toLowerCase()}`};
  const ultima=d.aumentiDataset.filter(t=>t.sezione===sezione.sezione).at(-1);
  const a5=ultima&&ultima.righe.find(r=>r.livello.codice==='5');
  const [,mese]=ultima?ultima.decorrenza.split('-').map(Number):[];
  const industria=R.trovaContratto('metalmeccanica-industria-c011');
  const livelliIndustria=R.livelli(industria.id,d.alla);
  const voci=[
    {domanda:'Quanto prende netto il 5° livello metalmeccanico artigiano?',
      risposta:`Nella sezione ${sezione.nome.toLowerCase()} il minimo vigente del 5° livello è ${eur(r5.composta.baseMensile)} lordi al mese: il netto medio stimato è ${eur(r5.nettoMensile)} su ${mensilitaTesto(sezione.mensilita)} mensilità, per un tempo pieno a Milano senza scatti né superminimo.`,
      link:[vai(r5)]},
    /* Senza una tranche negli ultimi 12 mesi o futura la domanda non ha risposta dal blocco: si toglie. */
    ...(a5?[{domanda:`Di quanto aumenta lo stipendio a ${MESI[mese-1]} ${ultima.decorrenza.slice(0,4)}?`,
      risposta:`Dal ${data(ultima.decorrenza)} decorre la ${ultima.titolo.replace(/, dal .*?(?= \(|$)/,'')}. Al 5° livello il minimo passa da ${eur(a5.prima.composta.baseMensile)} a ${eur(a5.dopo.composta.baseMensile)} lordi al mese e il netto medio da ${eur(a5.prima.nettoMensile)} a ${eur(a5.dopo.nettoMensile)}.`,
      link:[vai(r5)]}]:[]),
    {domanda:'Che differenza c’è con il metalmeccanico industria?',
      risposta:`Sono due contratti diversi. Il ${industria.codiceCnel} (Federmeccanica-Assistal, livelli ${livelliIndustria[0].codice}–${livelliIndustria.at(-1).codice}) vale per l’industria; il ${d.contratto.codiceCnel} (Confartigianato, CNA, Casartigiani, CLAAI, livelli ${sezione.righe[0].livello.codice}–${sezione.righe.at(-1).livello.codice}) per le imprese artigiane. Il codice va controllato in busta paga o nella lettera di assunzione.`,
      link:[{href:'/minimi-ccnl/metalmeccanico/',testo:'Tabella del metalmeccanico industria'},vai(r5)]},
    {domanda:'Il contratto metalmeccanico artigiano Conflavoro è lo stesso?',
      risposta:`No. Il CCNL Metalmeccanico Artigianato di Conflavoro PMI e Fesica Confsal (codice CNEL C049) ha lo stesso nome, ma parti e importi propri. Queste tabelle sono del ${d.contratto.codiceCnel} e non lo coprono: controlla il codice in busta paga.`,
      link:[vai(null)]},
  ];
  return faqConSchema(d.rotta,{id:'faq-metalmeccanico-artigiano',titolo:'Domande frequenti sul CCNL Metalmeccanico artigiano',voci});
}

function aumentiCommercio(d){
  if(d.seo.slug!=='commercio')return '';
  return `<section><h2>Aumenti 2026 e 2027: quanto cambia il netto</h2>
    <p>Il rinnovo del 22 marzo 2024 prevede due ultime tranche: novembre 2026 e febbraio 2027. Gli aumenti sono lordi mensili e variano per livello. Un superminimo assorbibile può ridurre l’aumento effettivo in busta paga.</p>
    <p>Confronto a parità di condizioni: regole fiscali 2026 anche per febbraio 2027, RAL annualizzata su 14 mensilità. Il netto è una media annua, non il cedolino del mese dell’aumento; non è una previsione della fiscalità 2027.</p>
    ${tabelleAumenti(d)}
    <p class="small">Fonte degli aumenti: <a href="https://ce-mu.it/rapportolavoro/contratti/cms_magazine/uploads/CommercioConfcommercio_AccordoRinnovo_22.3.2024.pdf">accordo di rinnovo, art. 213, pagina 59 del PDF</a>. I totali seguono le tabelle nazionali Filcams, inclusi gli arrotondamenti per livello.</p>
  </section>
  <section><h2>Scatti di anzianità e quattordicesima</h2>
    <p>Sono previsti fino a 10 scatti, uno ogni 3 anni nella stessa azienda o gruppo. Il valore lordo mensile di un singolo scatto è:</p>
    <div class="ccnl-tabella__scroll"><table class="ccnl-tabella"><caption>Valore di uno scatto di anzianità</caption><thead><tr><th scope="col">Livello</th><th scope="col">Scatto mensile lordo</th></tr></thead><tbody>${d.sezioni[0].righe.map(r=>`<tr><th scope="row">${esc(r.livello.nome)}</th><td>${eur(r.composta.valoreScatto)}</td></tr>`).join('')}</tbody></table></div>
    <p>Le mensilità sono 14: dodici ordinarie, tredicesima a Natale e quattordicesima il 1° luglio. La media netta in tabella divide il netto annuo per 14: le mensilità aggiuntive non hanno necessariamente lo stesso netto di quelle ordinarie.</p>
  </section>`;
}

function faqCommercio(d){
  if(d.seo.slug!=='commercio')return '';
  const r=codice=>d.sezioni[0].righe.find(r=>r.livello.codice===codice);
  const tre=r('3'),quattro=r('4');
  const faq=[
    {domanda:'Quanto prende netto il 3° livello CCNL Commercio?',risposta:`Il netto medio stimato è ${eur(tre.nettoMensile)} al mese su 14 mensilità, con minimo lordo di ${eur(tre.composta.baseMensile)}. Il caso è un tempo pieno a Milano senza scatti né superminimo.`,livello:'3'},
    {domanda:'Cosa cambia tra 4° e 3° livello di Commercio?',risposta:`Il minimo lordo passa da ${eur(quattro.composta.baseMensile)} del 4° livello a ${eur(tre.composta.baseMensile)} del 3°. Il netto dipende anche da comune, anzianità e condizioni personali: il confronto usa lo stesso profilo.`,livello:'4'},
    {domanda:'Quali sono gli aumenti previsti per il 2026 e il 2027?',risposta:'Al 4° livello sono previsti 35 € lordi mensili dal 1° novembre 2026 e altri 40 € dal 1° febbraio 2027. Gli importi sono riparametrati sugli altri livelli, come mostrano le tabelle prima e dopo.',livello:'4'},
    {domanda:'Quali sono le fasce di retribuzione nel CCNL Commercio?',risposta:'La tabella nazionale comprende Quadro e livelli dal 1° al 7°, oltre alle due categorie degli operatori di vendita. Sono minimi contrattuali: scatti, superminimo e maggiorazioni possono aumentare la retribuzione.',livello:'5'},
  ];
  const schema={'@context':'https://schema.org','@type':'FAQPage',mainEntity:faq.map(f=>({'@type':'Question',name:f.domanda,acceptedAnswer:{'@type':'Answer',text:f.risposta}}))};
  return `<section class="ccnl-faq"><h2>Domande frequenti sul CCNL Commercio</h2>${faq.map(f=>`<h3>${esc(f.domanda)}</h3><p>${esc(f.risposta)} <a href="${verso(d.rotta,`/minimi-ccnl/commercio/${f.livello}-livello/`)}">Approfondisci il ${f.livello}° livello</a>.</p>`).join('')}</section>
    <script id="faq-commercio" type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script>`;
}

function metalmeccanico(d){
  if(d.seo.slug!=='metalmeccanico')return '';
  const r=codice=>d.sezioni[0].righe.find(r=>r.livello.codice===codice);
  const c3=r('C3'),d1=r('D1'),a1=r('A1');
  const faq=[
    ['Quali sono gli aumenti del CCNL Metalmeccanico nel 2026, 2027 e 2028?', 'Al C3 sono previsti 53,17 € lordi mensili da giugno 2026, 59,58 € da giugno 2027 e 64,87 € da giugno 2028. Sono importi del rinnovo del 22 novembre 2025; la salvaguardia IPCA-NEI può aumentare i valori futuri.','C3'],
    ['Quanto guadagna netto un metalmeccanico di livello C3?',`Al C3 il minimo vigente è ${eur(c3.composta.baseMensile)} lordi mensili; il netto medio stimato è ${eur(c3.nettoMensile)} su 13 mensilità. Il confronto usa tempo pieno a Milano, senza scatti né superminimo, con regole fiscali 2026.`,'C3'],
    ['Quali sono i livelli del CCNL Metalmeccanico Industria?',`I nove livelli sono D1, D2, C1, C2, C3, B1, B2, B3 e A1. Il minimo vigente va da ${eur(d1.composta.baseMensile)} del D1 a ${eur(a1.composta.baseMensile)} dell’A1. Questa tabella riguarda Federmeccanica-Assistal, codice CNEL C011.`,'D1'],
    ['Quante mensilità ha il CCNL Metalmeccanico?', 'Il C011 prevede 13 mensilità: dodici ordinarie e la tredicesima. Il netto in tabella è il netto annuo diviso 13, non il valore esatto di ogni cedolino. I contratti Confapi e artigiani hanno discipline proprie.','A1'],
  ];
  const schema={'@context':'https://schema.org','@type':'FAQPage',mainEntity:faq.map(([name,text])=>({'@type':'Question',name,acceptedAnswer:{'@type':'Answer',text}}))};
  return `<section><h2>Aumenti 2026, 2027 e 2028: lordo e netto prima e dopo</h2>
    <p>Il rinnovo del 22 novembre 2025 fissa tre tranche dal 1° giugno di ogni anno. Per il C3 gli aumenti lordi mensili sono 53,17 €, 59,58 € e 64,87 €. La clausola di salvaguardia IPCA-NEI prevede l’adeguamento se l’inflazione supera gli incrementi di riferimento: i valori futuri possono quindi crescere.</p>
    <p>Confronto a parità di condizioni: regole fiscali 2026 anche per il 2027 e il 2028, RAL annualizzata su 13 mensilità, imposta sostitutiva del 5% non applicata. Il netto medio non è il cedolino del mese dell’aumento né una previsione delle imposte future. Scatti, superminimo, premi e welfare non sono inclusi.</p>
    <p>Un superminimo assorbibile può ridurre l’aumento effettivo: l’accordo prevede l’assorbimento degli aumenti individuali riconosciuti dal 1° gennaio 2017, salvo espressa clausola di non assorbibilità.</p>
    ${tabelleAumenti(d)}
    <p class="small">Fonte: <a href="${esc(d.contratto.fonteAccordo.url)}">accordo firmato il 22 novembre 2025, pagina 2 del PDF</a>; <a href="${esc(d.contratto.fonte.url)}">tabella FIM CISL di giugno 2026</a> per il confronto con giugno 2025. Importi verificati il 16 ottobre 2026.</p>
  </section>
  <section class="ccnl-faq"><h2>Domande frequenti sul CCNL Metalmeccanico</h2>${faq.map(([domanda,risposta,codice])=>`<h3>${esc(domanda)}</h3><p>${esc(risposta)} <a href="${verso(d.rotta,`/minimi-ccnl/metalmeccanico/livello-${codice.toLowerCase()}/`)}">Approfondisci il livello ${codice}</a>.</p>`).join('')}</section>
  <script id="faq-metalmeccanico" type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script>`;
}

function decorrenzeSettore(d){
  if(!['studi-professionali','cooperative-sociali'].includes(d.seo.slug))return '';
  const studi=d.seo.slug==='studi-professionali';
  const codice=studi?'3':'D1';
  const righe=d.contratto.tabelle.map(t=>{
    const importo=R.componiRal({ccnl:d.contratto.id,livello:codice,alla:t.decorrenza}).baseMensile;
    const stato=t.decorrenza>d.alla?'Prossima tranche firmata':t.decorrenza===d.sezioni[0].decorrenza?'In vigore':'Tranche precedente';
    return `<tr><th scope="row"><time datetime="${t.decorrenza}">${data(t.decorrenza)}</time></th><td>${stato}</td><td>${eur(importo)}</td></tr>`;
  }).join('');
  return `<section class="ccnl-decorrenze"><h2>Decorrenze e prossimi aumenti</h2>
    <div class="ccnl-tabella__scroll"><table class="ccnl-tabella"><caption>Minimo lordo mensile del livello ${codice}: cronologia delle tranche firmate</caption><thead><tr><th scope="col">Decorrenza</th><th scope="col">Stato al ${data(d.alla)}</th><th scope="col">Lordo mensile</th></tr></thead><tbody>${righe}</tbody></table></div>
    <p class="small">Fonte: ${fonte(d.contratto)}.</p>
    ${studi?'<p>La tabella principale riporta per ogni livello il minimo vigente e, quando futura, la tranche di dicembre 2026.</p>':`<p>Prossimi aumenti: nessuna decorrenza successiva nel testo contrattuale citato. Il <a href="https://www.uilfp.it/ccnl-cooperative-sociali-report-sulla-prosecuzione-della-trattativa-per-il-rinnovo/">comunicato UILFP del 1° ottobre 2026</a> riferisce che la discussione su vigenza e aumenti è rinviata a una fase successiva della trattativa; non attribuiamo importi al rinnovo in corso.</p>`}
  </section>`;
}

// RIC-101: risposte e schema condividono gli stessi dati della tabella.
function faqSettore(d){
  const studi=d.seo.slug==='studi-professionali';
  if(!studi&&d.seo.slug!=='cooperative-sociali')return '';
  const r=d.sezioni[0].righe.find(r=>r.livello.codice===(studi?'3':'D1'));
  const faq=studi?[
    ['Quanto guadagna il 3° livello degli studi professionali?',`Il minimo è ${eur(r.composta.baseMensile)} lordi mensili; il netto medio stimato è ${eur(r.nettoMensile)} su 14 mensilità. La stima considera tempo pieno a Milano, senza scatti né superminimo.`,'3'],
    ['Quando aumentano gli stipendi degli studi professionali?', 'La quarta tranche firmata decorre dal 1° dicembre 2026: al 3° livello il minimo passa da 1.706,37 € a 1.726,37 € lordi mensili. Gli importi degli altri livelli sono nella tabella.','3'],
    ['Quante mensilità prevede il CCNL Studi professionali?', 'Sono 14 mensilità, comprese tredicesima e quattordicesima. Il netto in tabella è una media annua, non il valore del singolo cedolino.','4'],
  ]:[
    ['Quanto guadagna un D1?',`Il minimo D1 è ${eur(r.composta.baseMensile)} lordi mensili su 13,5 mensilità. Il netto medio stimato è ${eur(r.nettoMensile)} al mese per un tempo pieno a Milano, senza scatti né superminimo.`,'D1'],
    ['Qual è lo stipendio netto in una cooperativa sociale?', 'Dipende da livello, orario, comune e condizioni personali. La tabella mostra il netto medio annuo su 13,5 mensilità; nella pagina D2 puoi personalizzare il calcolo.','D2'],
    ['Quando sono previsti i prossimi aumenti nelle cooperative sociali?', 'L’ultima tranche del CCNL 2023–2025 decorre da ottobre 2025. Il comunicato UILFP del 1° ottobre 2026 descrive una trattativa ancora aperta e rinvia la discussione sugli aumenti.','C1'],
  ];
  const schema={'@context':'https://schema.org','@type':'FAQPage',mainEntity:faq.map(([name,text])=>({'@type':'Question',name,acceptedAnswer:{'@type':'Answer',text}}))};
  return `<section class="ccnl-faq"><h2>Domande frequenti: ${esc(d.seo.breve)}</h2>${faq.map(([q,a,c])=>`<h3>${esc(q)}</h3><p>${esc(a)} <a href="${verso(d.rotta,d.sezioni[0].righe.find(r=>r.livello.codice===c).rotta)}">Vedi il livello ${esc(c)}</a>.</p>`).join('')}</section>
    <script id="faq-settore" type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script>`;
}

/* RIC-144: tre contratti si chiamano «metalmeccanico». Il riquadro porta
   chi lavora in un'azienda artigiana dall'industria all'Area meccanica
   (importo letto dal dataset) e chi è in un'industria dall'artigiano
   all'industria e al Confapi. Nessun confronto livello per livello. */
function ponteMetalmeccanico(d){
  const rotta=d.rotta;
  if(d.seo.slug==='metalmeccanico'&&d.artigiano){
    const a=d.artigiano;
    return `<section class="ccnl-blocco ccnl-affiancato"><h2>Lavori in un’azienda artigiana?</h2>
    <p>Allora il tuo contratto è probabilmente il CCNL Area meccanica dell’artigianato (${esc(a.contratto.codiceCnel)}), con livelli ${esc(a.primoLivello)}–${esc(a.ultimoLivello)} e importi propri. Al ${esc(a.livello)}° livello il minimo è <b>${eur(a.composta.baseMensile)}</b> lordi al mese, alla data della build. Le PMI non artigiane associate a Confapi applicano il ${esc(d.confapi.contratto.codiceCnel)}.</p>
    <a class="btn btn--ghost" href="${verso(rotta,a.rotta)}">Tabella ${esc(a.seo.titoloTabella)} →</a>
    <a class="btn btn--ghost" href="${verso(rotta,d.confapi.rotta)}">Tabella ${esc(d.confapi.seo.titoloTabella)} →</a></section>`;
  }
  if(d.seo.slug==='metalmeccanico-artigiano'&&d.industria){
    return `<section class="ccnl-blocco ccnl-affiancato"><h2>Lavori in un’industria metalmeccanica?</h2>
    <p>Allora il tuo contratto non è questo: l’industria applica il ${esc(d.industria.contratto.nome)} (${esc(d.industria.contratto.codiceCnel)}), le PMI associate a Confapi il ${esc(d.confapi.contratto.nome)} (${esc(d.confapi.contratto.codiceCnel)}). Livelli e importi sono diversi.</p>
    <a class="btn btn--ghost" href="${verso(rotta,d.industria.rotta)}">Tabella ${esc(d.industria.seo.titoloTabella)} →</a>
    <a class="btn btn--ghost" href="${verso(rotta,d.confapi.rotta)}">Tabella ${esc(d.confapi.seo.titoloTabella)} →</a></section>`;
  }
  return '';
}

function renderTabella(d){
  const {seo,contratto,sezioni,rotta,alla}=d;
  const conSezioni=sezioni[0].sezione!==null;
  const tutte=sezioni.flatMap(s=>s.righe);
  const min=tutte.reduce((a,b)=>b.composta.baseMensile<a.composta.baseMensile?b:a);
  const max=tutte.reduce((a,b)=>b.composta.baseMensile>a.composta.baseMensile?b:a);
  const s0=sezioni[0];
  const pagine=seo.etichetta?tutte.filter(r=>r.rotta):[];
  const blocchi=sezioni.map(s=>`<section class="ccnl-sezione"${s.sezione?` id="${esc(s.sezione)}"`:''}>
    ${s.nome?`<h2>${esc(s.nome)}</h2>${s.descrizione?`<p>${esc(s.descrizione)}</p>`:''}`:'<h2>La tabella dei minimi</h2>'}
    ${tabellaSezione(rotta,d,s)}
    <p class="small">Scatti: ${esc(scattiTesto(s.scatti))}.${esc(sospensioniTesto(s.scatti))} ${s.prossima?`La prossima tranche firmata decorre dal ${data(s.prossima)}.`:'Nessuna tranche successiva è firmata.'}</p>
    <a class="btn btn--ghost" href="${calcolatore(rotta,{ccnl:contratto.id,sezione:s.sezione})}">Calcola con anzianità e superminimo${s.nome?` — ${esc(s.nome)}`:''}</a>
  </section>`).join('\n');
  const body=`<header class="ral-intro"><div class="eyebrow">${esc(contratto.codiceCnel)} · ${esc(contratto.parti)}</div>
    <h1>${esc(seo.titoloTabella)} 2026: tabelle retributive</h1>
    ${(d.aumenti.length||seo.aumentiDalDataset||['studi-professionali','cooperative-sociali'].includes(seo.slug))?`<p class="small">Aggiornato al <time datetime="${alla}">${data(alla)}</time>.</p>`:''}
    <p class="lead">${esc(contratto.nome)}. Il minimo lordo mensile va da ${eur(min.composta.baseMensile)} (${esc(min.livello.nome)}) a ${eur(max.composta.baseMensile)} (${esc(max.livello.nome)})${conSezioni?`, su ${sezioni.length} sezioni del contratto`:''}. Per ogni livello: ${R.ralCompleta(contratto.id)?'RAL':'base tabellare annualizzata'} su ${mensilitaTesto(s0.mensilita)} mensilità e netto medio al mese${R.ralCompleta(contratto.id)?'':' calcolato su quella base'}.</p>
  </header>
  ${avvisoParziale(contratto)}${avvisoFonte(contratto)}
  ${ponteMetalmeccanico(d)}
  ${conSezioni?`<nav class="ccnl-indice" aria-label="Sezioni del contratto"><span class="micro">Sezioni</span>${sezioni.map(s=>`<a href="#${esc(s.sezione)}">${esc(s.nome)}</a>`).join('')}</nav>`:''}
  ${blocchi}
  ${aumentiDalDataset(d)}
  ${faqMetalmeccanicoArtigiano(d)}
  ${faqGruppo2(d)}
  ${aumentiCommercio(d)}
  ${faqCommercio(d)}
  ${metalmeccanico(d)}
  ${decorrenzeSettore(d)}
  ${faqSettore(d)}
  ${pagine.length?`<section class="related" aria-labelledby="livelli-titolo"><h2 id="livelli-titolo">Approfondisci un livello</h2><div class="related__grid">${pagine.map(r=>`
    <a class="related-card" href="${verso(rotta,r.rotta)}"><span><b>${esc(seo.etichetta(r.livello))} ${esc(seo.breve)}</b><small>${eur(r.composta.baseMensile)} lordi · ${eur(r.nettoMensile)} netti al mese</small></span><span class="related-card__arrow" aria-hidden="true">→</span></a>`).join('')}
  </div></section>`:''}
  <section class="ccnl-note" aria-label="Fonte e limiti">
    <p class="small"><b>Fonte:</b> ${fonte(contratto)}</p>
    ${esclusioni(d.esclusioni)}
  </section>
  <p class="ral-disclaimer">${PROFILO} Base nazionale: le maggiorazioni territoriali e aziendali non sono comprese. Non costituisce consulenza fiscale o del lavoro.</p>`;
  return layout({rotta,
    title:`${seo.titoloTabella} 2026: tabelle retributive e netto`,
    description:`Tabelle retributive ${seo.titoloTabella} in vigore dal ${data(s0.decorrenza)}: minimo lordo mensile, ${R.ralCompleta(contratto.id)?'RAL':'base annua'} e netto stimato per ognuno dei ${tutte.length} livelli${conSezioni?' e delle sezioni del contratto':''}, con fonte e decorrenza.`,
    briciole:[{nome:'Home',rotta:'/'},{nome:'Minimi CCNL',rotta:'/minimi-ccnl/'},{nome:seo.titoloTabella,rotta}],body});
}

/* --- PAGINA PER LIVELLO ------------------------------------- */

/* RIC-99: il title porta il netto medio al mese dell'apertura,
   arrotondato all'euro, entro 60 caratteri. Se la forma piena non ci
   sta si toglie «CCNL» dal nome del contratto, poi «al mese»; se
   nemmeno così, la build si ferma invece di pubblicarlo troncato. */
const TITLE_MAX=60;
const euroIntero=n=>`${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,'.')} €`;
function titoloLivello(etichetta,query,netto){
  const breve=query.replace(/^CCNL /,'');
  const cifra=euroIntero(netto);
  const forme=[`${etichetta} ${query} 2026: ${cifra} netti al mese`,
    `${etichetta} ${breve} 2026: ${cifra} netti al mese`,
    `${etichetta} ${breve} 2026: ${cifra} netti`];
  const titolo=forme.find(t=>t.length<=TITLE_MAX);
  if(!titolo)throw new RangeError(`Title oltre ${TITLE_MAX} caratteri anche accorciato: ${forme.at(-1)}`);
  return titolo;
}

function scomposizione(r){
  const voci=r.livello.voci.map(v=>`<tr><td>${esc(v.nome)}${v.mensilita&&v.mensilita!==r.composta.mensilita?` <small>(su ${mensilitaTesto(v.mensilita)} mensilità)</small>`:''}</td><td>${eur(v.importo)}</td></tr>`);
  const totale=voci.length>1?[`<tr class="somma"><td>Totale mensile</td><td>${eur(r.composta.baseMensile)}</td></tr>`]:[];
  const annuo=r.composta.identitaSemplice
    ?`<tr class="somma"><td>RAL — × ${mensilitaTesto(r.composta.mensilita)} mensilità</td><td>${eur(r.composta.ral)}</td></tr>`
    :r.composta.quote.filter(q=>q.annuo!==0).map(q=>`<tr><td>${esc(q.nome)} — ${eur(q.mensile)} × ${mensilitaTesto(q.mensilita)}</td><td>${eur(q.annuo)}</td></tr>`).join('')
      +`<tr class="somma"><td>RAL</td><td>${eur(r.composta.ral)}</td></tr>`;
  return `<table class="scomposizione"><caption>Come si compone — tabella in vigore dal ${data(r.composta.decorrenza)}</caption>
    <thead><tr><th scope="col">Voce</th><th scope="col">Importo</th></tr></thead>
    <tbody>${[...voci,...totale].join('')}${annuo}</tbody></table>`;
}

function blocchiRiga(rotta,d,r,conNome){
  /* Tappe senza anni (periodo sospeso, RIC-140): si contano gli scatti. */
  const soloScatti=r.tappe.some(t=>t.anni===null);
  const scatti=r.tappe.length?`<section class="ccnl-blocco"><h3>Con gli scatti di anzianità</h3>
    <p>Ogni scatto vale ${eur(r.composta.valoreScatto)} lordi al mese: ${esc(scattiTesto(r.regola))}, contando l’anzianità nella stessa azienda.${esc(sospensioniTesto(r.regola))}</p>
    <div class="ccnl-tabella__scroll"><table class="ccnl-tabella"><thead><tr><th scope="col">${soloScatti?'Scatti maturati':'Anzianità in azienda'}</th><th scope="col">Lordo mensile</th><th scope="col">RAL</th><th scope="col">Netto medio al mese</th></tr></thead><tbody>
    <tr><th scope="row">Nessuno scatto</th><td>${eur(r.composta.mensileTotale)}</td><td>${eur(r.composta.ral)}</td><td>${eur(r.nettoMensile)}</td></tr>
    ${r.tappe.map(t=>`<tr><th scope="row">${t.anni===null?'':`${t.anni} anni · `}${t.n} ${t.n===1?'scatto':'scatti'}</th><td>${eur(t.composta.mensileTotale)}</td><td>${eur(t.composta.ral)}</td><td>${eur(t.nettoMensile)}</td></tr>`).join('')}
    </tbody></table></div></section>`
    :`<section class="ccnl-blocco"><h3>Scatti di anzianità</h3><p>Regola del contratto: ${esc(scattiTesto(r.regola))}${r.regola.tipo==='percentualeMaturazione'?': il loro valore dipende dalla data in cui maturano, e il calcolatore lo ricostruisce dalla data di anzianità':''}.${esc(sospensioniTesto(r.regola))}</p></section>`;
  const partTime=r.partTime.length?`<section class="ccnl-blocco"><h3>Part-time</h3>
    <p>Il tempo pieno è di ${r.ore} ore settimanali. A orario ridotto costante il minimo si riproporziona sulle ore lavorate.</p>
    <div class="ccnl-tabella__scroll"><table class="ccnl-tabella"><thead><tr><th scope="col">Ore settimanali</th><th scope="col">Lordo mensile</th><th scope="col">RAL</th><th scope="col">Netto medio al mese</th></tr></thead><tbody>
    ${r.partTime.map(p=>`<tr><th scope="row">${p.ore} ore</th><td>${eur(p.composta.mensileTotale)}</td><td>${eur(p.composta.ral)}</td><td>${eur(p.nettoMensile)}</td></tr>`).join('')}
    </tbody></table></div></section>`:'';
  const futura=r.futura?`<p class="small">Dal ${data(r.futura.decorrenza)} la tranche già firmata porta il minimo a ${eur(r.futura.composta.baseMensile)} lordi al mese (RAL ${eur(r.futura.composta.ral)}).</p>`:'';
  return `<section class="ccnl-riga"${r.sezione?` id="${esc(r.sezione)}"`:''}>
    ${conNome?`<h2>${esc(r.nome)}</h2>`:''}
    <div class="ccnl-kpi">
      <div><span class="micro">Minimo lordo mensile</span><b>${eur(r.composta.baseMensile)}</b></div>
      <div><span class="micro">RAL · ${mensilitaTesto(r.composta.mensilita)} mensilità</span><b>${eur(r.composta.ral)}</b></div>
      <div><span class="micro">Netto annuo stimato</span><b>${eur(r.nettoAnnuo)}</b></div>
      <div><span class="micro">Netto medio al mese</span><b>${eur(r.nettoMensile)}</b></div>
    </div>
    ${scomposizione(r)}
    ${futura}
    ${scatti}
    ${partTime}
    <a class="btn btn--primary" href="${calcolatore(rotta,{ccnl:d.contratto.id,sezione:r.sezione,livello:d.codice})}">Calcola con la tua anzianità e il superminimo →</a>
  </section>`;
}

function renderLivello(d){
  const {seo,contratto,etichetta,righe,rotta,alla}=d;
  const r0=righe[0];
  const conNome=righe.length>1||contratto.sezioni;
  const nomeIntero=`${etichetta} ${seo.query}`;
  const uguali=righe.length>1&&righe.every(r=>r.composta.ral===r0.composta.ral);
  const affiancato=d.affiancato?`<section class="ccnl-blocco ccnl-affiancato"><h2>Lavori in un bar, un ristorante o una mensa?</h2>
    <p>Allora il tuo contratto è probabilmente il ${esc(d.affiancato.contratto.nome)} (${esc(d.affiancato.contratto.codiceCnel)}), non quello degli alberghi. Allo stesso ${esc(etichetta)}, sezione ${esc(d.affiancato.sezione.nome.toLowerCase())}, il minimo è <b>${eur(d.affiancato.composta.baseMensile)}</b> lordi al mese: RAL ${eur(d.affiancato.composta.ral)}, circa ${eur(d.affiancato.nettoMensile)} netti al mese.</p>
    <a class="btn btn--ghost" href="${verso(rotta,`/minimi-ccnl/${d.affiancato.seo.slug}/`)}">Tabella completa ${esc(d.affiancato.seo.titoloTabella)} →</a></section>`:'';
  const vicini=d.vicini.length?`<section class="related" aria-labelledby="vicini-titolo"><h2 id="vicini-titolo">I livelli accanto</h2><div class="related__grid">${d.vicini.map(v=>`
    <a class="related-card" href="${v.rotta?verso(rotta,v.rotta):`${verso(rotta,d.rottaTabella)}${r0.sezione?`#${esc(r0.sezione)}`:''}`}"><span><b>${esc(v.etichetta)} ${esc(seo.breve)}</b><small>${eur(v.livello.totale)} lordi al mese</small></span><span class="related-card__arrow" aria-hidden="true">→</span></a>`).join('')}
    <a class="related-card" href="${verso(rotta,d.rottaTabella)}"><span><b>Tutti i livelli</b><small>${esc(seo.titoloTabella)}: tabella completa</small></span><span class="related-card__arrow" aria-hidden="true">→</span></a>
  </div></section>`:'';
  /* «la 3ª area 4° livello» (Bancari), «il 5° livello» negli altri. */
  const il=`${/^\d+ª /.test(etichetta)?'la':'il'} ${etichetta.charAt(0).toLowerCase()}${etichetta.slice(1)}`;
  /* Un nome che chiude già con una parentesi (Area meccanica) non ne prende una seconda. */
  const sezione=conNome&&righe.length===1
    ?(contratto.nome.endsWith(')')?`, sezione ${esc(r0.nome.toLowerCase())},`:` (${esc(r0.nome.toLowerCase())})`):'';
  const intro=uguali
    ?`Nel CCNL ${esc(contratto.nome)} ${esc(il)} ha un minimo di ${eur(r0.composta.baseMensile)} lordi al mese, uguale per ${righe.map(r=>esc(r.nome.toLowerCase())).join(' e per ')}`
    :`Nel CCNL ${esc(contratto.nome)}${sezione} ${esc(il)} ha un minimo di ${eur(r0.composta.baseMensile)} lordi al mese`;
  const body=`<header class="ral-intro"><div class="eyebrow">${esc(seo.titoloTabella)} · ${esc(contratto.codiceCnel)}</div>
    <h1>${esc(nomeIntero)}: minimo, RAL e netto</h1>
    <p class="lead">${intro}. Su ${mensilitaTesto(r0.composta.mensilita)} mensilità fa una RAL di ${eur(r0.composta.ral)}: circa <b>${eur(r0.nettoMensile)} netti al mese</b>, senza scatti né superminimo.</p>
    <p class="ral-thesis">Tabella nazionale in vigore dal ${data(r0.composta.decorrenza)}.</p>
  </header>
  ${avvisoFonte(contratto)}
  ${righe.map(r=>blocchiRiga(rotta,d,r,conNome)).join('\n')}
  ${affiancato}
  ${vicini}
  <section class="ccnl-note" aria-label="Fonte e limiti">
    <p class="small"><b>Fonte:</b> ${fonte(contratto)}</p>
    ${esclusioni([...d.esclusioni,...righe.flatMap(r=>r.composta.esclusioni.filter(e=>!d.esclusioni.includes(e)))])}
  </section>
  <p class="ral-disclaimer">${PROFILO} Base nazionale: le maggiorazioni territoriali e aziendali non sono comprese. Non costituisce consulenza fiscale o del lavoro.</p>`;
  return layout({rotta,title:titoloLivello(etichetta,seo.query,r0.nettoMensile),
    description:`${etichetta} ${seo.query}: ${eur(r0.composta.baseMensile)} lordi al mese su ${mensilitaTesto(r0.composta.mensilita)} mensilità, RAL ${eur(r0.composta.ral)} e circa ${eur(r0.nettoMensile)} netti al mese. Con scatti, part-time e fonte.`,
    briciole:[{nome:'Home',rotta:'/'},{nome:'Minimi CCNL',rotta:'/minimi-ccnl/'},
      {nome:seo.titoloTabella,rotta:d.rottaTabella},{nome:etichetta,rotta}],body});
}

module.exports={renderHub,renderTabella,renderLivello,titoloLivello,calcolatore,verso,data};
