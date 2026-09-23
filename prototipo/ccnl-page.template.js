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

function scattiTesto(regola){
  switch(regola.tipo){
    case 'assenti':return 'nessuno scatto di anzianità';
    case 'quotaUnica':return `nessuno scatto: una quota unica di anzianità forfettaria dopo ${regola.dopoAnni} anni`;
    case 'percentualeMaturazione':return `fino a ${regola.massimo} scatti, uno ogni ${regola.cadenzaAnni} anni, calcolati in percentuale della tabella del momento`;
    default:return `fino a ${regola.massimo} scatti, uno ogni ${regola.cadenzaAnni} anni`;
  }
}

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
    :`<a href="${b.rotta==='/'?`${r}index.html`:verso(rotta,b.rotta)}">${esc(b.nome)}</a><span class="breadcrumb__sep" aria-hidden="true">›</span>`).join('');
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
  <a class="site-brand" href="${r}index.html" aria-label="Dove va la tua RAL — home">Dove va la tua RAL</a>
  <button class="site-menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav"><span class="site-menu-toggle__icon" aria-hidden="true"></span><span class="sr">Apri il menu</span></button>
  <nav class="site-nav" id="site-nav" aria-label="Navigazione principale"><div class="site-nav__group" data-current><button class="site-nav__trigger" type="button" aria-expanded="false" aria-controls="nav-calcola">Calcola</button><div class="site-nav__submenu" id="nav-calcola"><a href="${r}index.html">RAL → Netto</a><a href="${r}netto-ral.html">Netto → RAL</a><a href="${r}ccnl-livello.html">CCNL e livello</a></div></div><div class="site-nav__group"><button class="site-nav__trigger" type="button" aria-expanded="false" aria-controls="nav-confronta">Confronta</button><div class="site-nav__submenu" id="nav-confronta"><a href="${r}compara.html">Due offerte</a><a href="${r}confronti-ral/">Livelli di RAL</a><a href="${r}minimi-ccnl/"${rotta==='/minimi-ccnl/'?' aria-current="page"':''}>Minimi CCNL</a></div></div><a href="${r}netto-o-niente.html">Gioca</a><a href="/blog/">Blog</a><a href="${r}la-storia.html">La storia</a></nav>
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
  return `<a href="${esc(f.url)}" rel="nofollow">${esc(f.titolo)}</a> — ${esc(f.parte)}. Verificata il ${data(f.verificataIl)}.`;
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
  const body=`<header class="ral-intro"><div class="eyebrow">Minimi CCNL 2026</div>
    <h1>Minimi CCNL: tabelle retributive, lordo e netto</h1>
    <p class="lead">Tredici contratti collettivi, livello per livello: il minimo lordo mensile che il CCNL fissa, la RAL che ne risulta e il netto che ne resta. Tutti ricalcolati con le tabelle in vigore e le regole fiscali 2026.</p>
    <p class="ral-thesis">Gli importi sono la base nazionale: scatti, superminimo e integrativi si aggiungono sopra.</p>
    ${parziali.map(d=>`<p class="small">Per il ${esc(d.seo.titoloTabella)} la cifra annua è una base tabellare parziale e non va confrontata con la RAL degli altri contratti: manca il ${esc(d.contratto.quoteAnnueMancanti.map(q=>`${q.nome} (${q.fonte})`).join(' e il '))}.</p>`).join('')}
  </header>
  <section class="ccnl-omonimi" aria-labelledby="omonimi-titolo">
    <h2 id="omonimi-titolo">Due nomi che si confondono</h2>
    <div class="ccnl-omonimi__grid">
      <article><h3>«Commercio» sono due contratti</h3><p>Il <a href="${verso(rotta,'/minimi-ccnl/commercio/')}">CCNL Terziario Confcommercio</a> (H011) e il <a href="${verso(rotta,'/minimi-ccnl/dmo/')}">CCNL Distribuzione moderna organizzata</a> (H008), applicato da molte catene della grande distribuzione. Hanno gli stessi livelli, importi vicini ma non identici: controlla quale è scritto nella tua lettera di assunzione.</p></article>
      <article><h3>«Turismo» sono due contratti</h3><p>Il <a href="${verso(rotta,'/minimi-ccnl/turismo/')}">CCNL Turismo Federalberghi</a> (H052) vale per alberghi e campeggi; bar, ristoranti e mense applicano il <a href="${verso(rotta,'/minimi-ccnl/pubblici-esercizi/')}">CCNL Pubblici esercizi FIPE</a> (H05Y), che nel nome dice anche «turismo».</p></article>
    </div>
  </section>
  <section class="hub-grid" aria-label="Elenco dei contratti">${contratti.map(card).join('\n      ')}</section>
  <aside class="personalize"><a class="btn btn--primary btn--lg" href="${calcolatore(rotta,{ccnl:contratti[0].contratto.id})}">Calcola il tuo livello →</a><p>Aggiungi anzianità, superminimo e orario ridotto nel calcolatore CCNL e livello.</p></aside>
  <p class="ral-disclaimer">${PROFILO} Tabelle in vigore al ${data(alla)}. Non costituisce consulenza fiscale o del lavoro.</p>`;
  return layout({rotta,title:'Minimi CCNL 2026: tabelle retributive, lordo e netto per livello',
    description:'Tabelle retributive 2026 di tredici CCNL, dal Commercio al Metalmeccanico: minimo lordo mensile, RAL e netto stimato per ogni livello, con fonti e decorrenze.',
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

function renderTabella(d){
  const {seo,contratto,sezioni,rotta,alla}=d;
  const conSezioni=sezioni[0].sezione!==null;
  const tutte=sezioni.flatMap(s=>s.righe);
  const min=tutte.reduce((a,b)=>b.composta.baseMensile<a.composta.baseMensile?b:a);
  const max=tutte.reduce((a,b)=>b.composta.baseMensile>a.composta.baseMensile?b:a);
  const s0=sezioni[0];
  const pagine=tutte.filter(r=>r.rotta);
  const blocchi=sezioni.map(s=>`<section class="ccnl-sezione"${s.sezione?` id="${esc(s.sezione)}"`:''}>
    ${s.nome?`<h2>${esc(s.nome)}</h2>${s.descrizione?`<p>${esc(s.descrizione)}</p>`:''}`:'<h2>La tabella dei minimi</h2>'}
    ${tabellaSezione(rotta,d,s)}
    <p class="small">Scatti: ${esc(scattiTesto(s.scatti))}. ${s.prossima?`La prossima tranche firmata decorre dal ${data(s.prossima)}.`:'Nessuna tranche successiva è firmata.'}</p>
    <a class="btn btn--ghost" href="${calcolatore(rotta,{ccnl:contratto.id,sezione:s.sezione})}">Calcola con anzianità e superminimo${s.nome?` — ${esc(s.nome)}`:''}</a>
  </section>`).join('\n');
  const body=`<header class="ral-intro"><div class="eyebrow">${esc(contratto.codiceCnel)} · ${esc(contratto.parti)}</div>
    <h1>${esc(seo.titoloTabella)} 2026: tabelle retributive</h1>
    <p class="lead">${esc(contratto.nome)}. Il minimo lordo mensile va da ${eur(min.composta.baseMensile)} (${esc(min.livello.nome)}) a ${eur(max.composta.baseMensile)} (${esc(max.livello.nome)})${conSezioni?`, su ${sezioni.length} sezioni del contratto`:''}. Per ogni livello: ${R.ralCompleta(contratto.id)?'RAL':'base tabellare annualizzata'} su ${mensilitaTesto(s0.mensilita)} mensilità e netto medio al mese${R.ralCompleta(contratto.id)?'':' calcolato su quella base'}.</p>
  </header>
  ${avvisoParziale(contratto)}${avvisoFonte(contratto)}
  ${conSezioni?`<nav class="ccnl-indice" aria-label="Sezioni del contratto"><span class="micro">Sezioni</span>${sezioni.map(s=>`<a href="#${esc(s.sezione)}">${esc(s.nome)}</a>`).join('')}</nav>`:''}
  ${blocchi}
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
  const scatti=r.tappe.length?`<section class="ccnl-blocco"><h3>Con gli scatti di anzianità</h3>
    <p>Ogni scatto vale ${eur(r.composta.valoreScatto)} lordi al mese: ${esc(scattiTesto(r.regola))}, contando l’anzianità nella stessa azienda.</p>
    <div class="ccnl-tabella__scroll"><table class="ccnl-tabella"><thead><tr><th scope="col">Anzianità in azienda</th><th scope="col">Lordo mensile</th><th scope="col">RAL</th><th scope="col">Netto medio al mese</th></tr></thead><tbody>
    <tr><th scope="row">Nessuno scatto</th><td>${eur(r.composta.mensileTotale)}</td><td>${eur(r.composta.ral)}</td><td>${eur(r.nettoMensile)}</td></tr>
    ${r.tappe.map(t=>`<tr><th scope="row">${t.anni} anni · ${t.n} ${t.n===1?'scatto':'scatti'}</th><td>${eur(t.composta.mensileTotale)}</td><td>${eur(t.composta.ral)}</td><td>${eur(t.nettoMensile)}</td></tr>`).join('')}
    </tbody></table></div></section>`
    :`<section class="ccnl-blocco"><h3>Scatti di anzianità</h3><p>Regola del contratto: ${esc(scattiTesto(r.regola))}${r.regola.tipo==='percentualeMaturazione'?': il loro valore dipende dalla data in cui maturano, e il calcolatore lo ricostruisce dalla data di anzianità':''}.</p></section>`;
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
  const il=`il ${etichetta.charAt(0).toLowerCase()}${etichetta.slice(1)}`;
  const intro=uguali
    ?`Nel CCNL ${esc(contratto.nome)} ${esc(il)} ha un minimo di ${eur(r0.composta.baseMensile)} lordi al mese, uguale per ${righe.map(r=>esc(r.nome.toLowerCase())).join(' e per ')}`
    :`Nel CCNL ${esc(contratto.nome)}${conNome&&righe.length===1?` (${esc(r0.nome.toLowerCase())})`:''} ${esc(il)} ha un minimo di ${eur(r0.composta.baseMensile)} lordi al mese`;
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
  const titolo=`${nomeIntero} 2026: ${seo.titoloLivello||'minimo, lordo e netto'}`;
  return layout({rotta,title:titolo,
    description:`${etichetta} ${seo.query}: ${eur(r0.composta.baseMensile)} lordi al mese su ${mensilitaTesto(r0.composta.mensilita)} mensilità, RAL ${eur(r0.composta.ral)} e circa ${eur(r0.nettoMensile)} netti al mese. Con scatti, part-time e fonte.`,
    briciole:[{nome:'Home',rotta:'/'},{nome:'Minimi CCNL',rotta:'/minimi-ccnl/'},
      {nome:seo.titoloTabella,rotta:d.rottaTabella},{nome:etichetta,rotta}],body});
}

module.exports={renderHub,renderTabella,renderLivello,calcolatore,verso,data};
