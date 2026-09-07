const {applicaMensilita,eur}=require('./motore.js');

const ORIGIN='https://www.dovevalatuaral.com';
const formatRal=ral=>new Intl.NumberFormat('it-IT').format(ral);
const pct=(value,ral)=>(value/ral*100).toFixed(2).replace('.',',');
const query=(ral,mensilita)=>`../index.html?ral=${formatRal(ral)}&amp;m=${mensilita}&amp;c=F205&amp;calc=1`;

function renderRalPage({ral,result,previous,next}){
  const formatted=formatRal(ral);
  const canonical=`${ORIGIN}/ral-${ral}-netto/`;
  const months=[12,13,14].map(mensilita=>({
    mensilita,
    monthly:applicaMensilita(result,mensilita).kpi.mediaMensile,
  }));
  const contributions=result.kpi.totaleContributi;
  const taxes=result.kpi.totaleImposte;
  const net=result.kpi.nettoAnnuo;
  const neighbours=[previous,next].filter(Boolean).map(value=>`
        <a class="related-card" href="../ral-${value}-netto/">
          <span><b>RAL ${formatRal(value)} €</b><small>Confronta 12, 13 e 14 mensilità</small></span>
          <span class="related-card__arrow" aria-hidden="true">→</span>
        </a>`).join('');
  const cards=months.map(({mensilita,monthly})=>`
      <a class="month-card month-card--${mensilita}" data-mensilita="${mensilita}" data-netto-mensile="${monthly.toFixed(2)}" href="${query(ral,mensilita)}"
         aria-label="Apri il calcolo di ${formatted} euro su ${mensilita} mensilità">
        <div class="month-card__month">${mensilita} mensilità</div>
        <div class="month-card__net">${eur(monthly)}</div>
        <div class="month-card__label">Netto al mese</div>
        <ul class="month-card__facts">
          <li><span><i class="fact-dot fact-dot--net"></i>Netto annuo</span><b>${eur(net)}</b></li>
          <li><span><i class="fact-dot fact-dot--tax"></i>Imposte totali</span><b>${eur(taxes)}</b></li>
          <li><span><i class="fact-dot fact-dot--contrib"></i>Contributi totali</span><b>${eur(contributions)}</b></li>
        </ul>
      </a>`).join('');

  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" href="data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org/2000/svg%27%20viewBox%3D%270%200%2032%2032%27%3E%3Cpath%20d%3D%27M6%200H32V26L26%2032H0V6Z%27%20fill%3D%27%231E1C2B%27/%3E%3Ctext%20x%3D%2716%27%20y%3D%2723%27%20font-family%3D%27system-ui%2Csans-serif%27%20font-size%3D%2719%27%20font-weight%3D%27700%27%20fill%3D%27%2321D4E3%27%20text-anchor%3D%27middle%27%3E%E2%82%AC%3C/text%3E%3C/svg%3E">
<title>RAL ${formatted} €: stipendio netto su 12, 13 e 14 mensilità</title>
<meta name="description" content="Quanto sono netti ${formatted} euro di RAL? Confronta lo stipendio netto mensile su 12, 13 e 14 mensilità, con imposte e contributi 2026.">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="RAL ${formatted} €: netto su 12, 13 e 14 mensilità">
<meta property="og:description" content="Lo stesso netto annuo, distribuito su 12, 13 o 14 mensilità. Stima 2026 per un dipendente privato a Milano.">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonical}">
<link rel="stylesheet" href="../draftsman.css">
<link rel="stylesheet" href="../ral-page.css">
</head>
<body data-ral="${ral}" data-netto-annuo="${net.toFixed(2)}" data-imposte="${taxes.toFixed(2)}" data-contributi="${contributions.toFixed(2)}">
<a class="skip-link" href="#contenuto">Vai al contenuto</a>
<header class="site-header"><div class="site-header__in">
  <a class="site-brand" href="../index.html" aria-label="Dove va la tua RAL — home">Dove va la tua RAL</a>
  <button class="site-menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav"><span class="site-menu-toggle__icon" aria-hidden="true"></span><span class="sr">Apri il menu</span></button>
  <nav class="site-nav" id="site-nav" aria-label="Navigazione principale"><div class="site-nav__group"><button class="site-nav__trigger" type="button" aria-expanded="false" aria-controls="nav-calcola">Calcola</button><div class="site-nav__submenu" id="nav-calcola"><a href="../index.html">RAL → Netto</a><a href="../netto-ral.html">Netto → RAL</a><a href="../ccnl-livello.html">CCNL e livello</a></div></div><div class="site-nav__group" data-current><button class="site-nav__trigger" type="button" aria-expanded="false" aria-controls="nav-confronta">Confronta</button><div class="site-nav__submenu" id="nav-confronta"><a href="../compara.html">Due offerte</a><a href="../confronti-ral/" aria-current="page">Livelli di RAL</a></div></div><a href="../la-storia.html">La storia</a></nav>
</div></header>
<nav class="breadcrumb" aria-label="Percorso"><div class="shell breadcrumb__in">
  <a href="../index.html">Home</a><span class="breadcrumb__sep" aria-hidden="true">›</span>
  <a href="../confronti-ral/">Confronti RAL</a><span class="breadcrumb__sep" aria-hidden="true">›</span>
  <span aria-current="page">RAL ${formatted} €</span>
</div></nav>
<main id="contenuto" class="ral-main"><div class="shell">
  <header class="ral-intro"><div class="eyebrow">Confronta la tua RAL</div>
    <h1>RAL ${formatted} €: netto su 12, 13 o 14 mensilità</h1>
    <p class="lead">Lo stesso netto annuo, distribuito in modo diverso.</p>
    <p class="ral-thesis">Le mensilità cambiano la media, non le imposte.</p>
  </header>
  <section class="month-grid" aria-label="Confronto dello stipendio netto mensile">${cards}
  </section>
  <section class="annual" aria-labelledby="risultato-annuo">
    <div class="annual__result"><div class="micro">Risultato annuo — uguale in ogni caso</div><div id="risultato-annuo" class="annual__label">Netto annuo</div><div class="annual__value">${eur(net)}</div></div>
    <div class="annual__composition"><div class="micro">Composizione annua</div>
      <div class="moneybar" role="img" aria-label="Su ${formatted} euro lordi: ${eur(contributions)} di contributi, ${eur(taxes)} di imposte e ${eur(net)} netti">
        <div class="moneybar__part moneybar__contrib" style="width:${(contributions/ral*100).toFixed(4)}%"><b>${pct(contributions,ral)}%</b><span>Contributi</span></div>
        <div class="moneybar__part moneybar__tax" style="width:${(taxes/ral*100).toFixed(4)}%"><b>${pct(taxes,ral)}%</b><span class="sr">Imposte</span></div>
        <div class="moneybar__part moneybar__net" style="width:${(net/ral*100).toFixed(4)}%"><b>${eur(net)}</b><span>${pct(net,ral)}%</span></div>
      </div>
      <div class="moneybar__legend" aria-hidden="true"><span><i class="fact-dot fact-dot--contrib"></i>Contributi ${eur(contributions)}</span><span><i class="fact-dot fact-dot--tax"></i>Imposte ${eur(taxes)}</span><span><i class="fact-dot fact-dot--net"></i>Netto ${eur(net)}</span></div>
    </div>
  </section>
  <section class="assumptions" aria-label="Ipotesi del calcolo">
    <div class="assumption"><span class="assumption__no" aria-hidden="true">01</span><div><span class="micro">Dove</span><b>Milano</b></div></div>
    <div class="assumption"><span class="assumption__no" aria-hidden="true">02</span><div><span class="micro">Profilo</span><b>Dipendente privato, FPLD ordinario, anno completo</b></div></div>
    <div class="assumption"><span class="assumption__no" aria-hidden="true">03</span><div><span class="micro">Familiari a carico</span><b>Nessun familiare</b></div></div>
  </section>
  <aside class="personalize"><a class="btn btn--primary btn--lg" href="${query(ral,14)}">Calcola il tuo caso →</a><p>Modifica comune, mensilità, famiglia e pacchetto retributivo per ottenere una stima costruita sulla tua situazione.</p></aside>
  <section class="month-explainer" aria-labelledby="mensilita-titolo">
    <div class="month-explainer__intro"><div class="eyebrow">Come leggere il confronto</div><h2 id="mensilita-titolo">Tre numeri mensili, un solo netto annuo</h2></div>
    <div class="month-explainer__grid">
      <article><span class="month-explainer__no" aria-hidden="true">01</span><h3>Il totale non cambia</h3><p>Su 12, 13 o 14 mensilità il netto annuo stimato resta <strong>${eur(net)}</strong>.</p></article>
      <article><span class="month-explainer__no" aria-hidden="true">02</span><h3>Cambia la media mensile</h3><p>Lo stesso importo viene diviso in più pagamenti: per questo il netto medio della singola mensilità diminuisce.</p></article>
      <article><span class="month-explainer__no" aria-hidden="true">03</span><h3>Decide il contratto</h3><p>Il numero e il calendario delle mensilità dipendono dal contratto applicato, non da una scelta fiscale.</p></article>
    </div>
  </section>
  <section class="related" aria-labelledby="correlati-titolo"><h2 id="correlati-titolo">Altri confronti RAL</h2><div class="related__grid">${neighbours}
    </div></section>
  <p class="ral-disclaimer">Stima basata sulle regole fiscali 2026. Non costituisce consulenza fiscale o del lavoro. Il risultato può cambiare in base a comune, situazione familiare, inquadramento contributivo e altre condizioni personali.</p>
</div></main>
<footer class="footer ral-footer"><div class="shell"><span>© 2026 Dove va la tua RAL</span><a href="../confronti-ral/">Tutti i confronti RAL</a></div></footer>
<script src="../site-nav.js"></script></body>
</html>
`;
}

function renderHub({rals,results}){
  const cards=rals.map(ral=>{
    const result=results.get(ral);
    return `<a class="hub-card" href="../ral-${ral}-netto/"><span class="micro">RAL ${formatRal(ral)} €</span><b>${eur(result.kpi.nettoAnnuo)}</b><small>netto annuo stimato · da ${eur(applicaMensilita(result,12).kpi.mediaMensile)} al mese su 12 mensilità</small><span aria-hidden="true">→</span></a>`;
  }).join('\n      ');
  return `<!doctype html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Confronti RAL: stipendio netto da 20.000 a 100.000 €</title>
<meta name="description" content="Confronta il netto 2026 per 17 RAL da 20.000 a 100.000 euro, su 12, 13 e 14 mensilità.">
<link rel="canonical" href="${ORIGIN}/confronti-ral/"><meta property="og:type" content="website"><meta property="og:url" content="${ORIGIN}/confronti-ral/">
<link rel="stylesheet" href="../draftsman.css"><link rel="stylesheet" href="../ral-page.css"></head>
<body><a class="skip-link" href="#contenuto">Vai al contenuto</a>
<header class="site-header"><div class="site-header__in"><a class="site-brand" href="../index.html" aria-label="Dove va la tua RAL — home">Dove va la tua RAL</a><button class="site-menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav"><span class="site-menu-toggle__icon" aria-hidden="true"></span><span class="sr">Apri il menu</span></button><nav class="site-nav" id="site-nav" aria-label="Navigazione principale"><div class="site-nav__group"><button class="site-nav__trigger" type="button" aria-expanded="false" aria-controls="nav-calcola">Calcola</button><div class="site-nav__submenu" id="nav-calcola"><a href="../index.html">RAL → Netto</a><a href="../netto-ral.html">Netto → RAL</a><a href="../ccnl-livello.html">CCNL e livello</a></div></div><div class="site-nav__group" data-current><button class="site-nav__trigger" type="button" aria-expanded="false" aria-controls="nav-confronta">Confronta</button><div class="site-nav__submenu" id="nav-confronta"><a href="../compara.html">Due offerte</a><a href="../confronti-ral/" aria-current="page">Livelli di RAL</a></div></div><a href="../la-storia.html">La storia</a></nav></div></header>
<nav class="breadcrumb" aria-label="Percorso"><div class="shell breadcrumb__in"><a href="../index.html">Home</a><span class="breadcrumb__sep" aria-hidden="true">›</span><span aria-current="page">Confronti RAL</span></div></nav>
<main id="contenuto" class="ral-main hub-main"><div class="shell"><header class="ral-intro"><div class="eyebrow">Confronti RAL</div><h1>Dal lordo al netto, cifra per cifra</h1><p class="lead">Scegli una RAL e confronta subito lo stesso netto annuo su 12, 13 e 14 mensilità.</p></header>
<section class="hub-grid" aria-label="Elenco dei confronti RAL">${cards}</section>
<p class="ral-disclaimer">Stime 2026 per un dipendente privato a Milano, FPLD ordinario, anno completo e nessun familiare a carico.</p></div></main>
<footer class="footer ral-footer"><div class="shell"><span>© 2026 Dove va la tua RAL</span></div></footer><script src="../site-nav.js"></script></body></html>
`;
}

module.exports={ORIGIN,formatRal,renderRalPage,renderHub};
