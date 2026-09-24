const {escape:e,markdown}=require('./articoli-parser.js');
const {ORIGIN}=require('./ral-page.template.js');
const formatDate=value=>new Intl.DateTimeFormat('it-IT',{dateStyle:'long',timeZone:'UTC'}).format(new Date(value));
const time=value=>`<time datetime="${value}">${formatDate(value)}</time>`;
function layout({title,description,route,content}){
  return `<!doctype html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(title)}</title><meta name="description" content="${e(description)}">
<link rel="canonical" href="${ORIGIN}${route}"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}"><meta property="og:url" content="${ORIGIN}${route}"><meta property="og:type" content="${route==='/blog/'?'website':'article'}">
<link rel="stylesheet" href="/draftsman.css"><link rel="stylesheet" href="/articolo.css"><script src="/analytics.js" async></script></head>
<body><a class="skip-link" href="#contenuto">Vai al contenuto</a>
<header class="site-header"><div class="site-header__in"><a class="site-brand" href="/" aria-label="Dove va la tua RAL — home">Dove va la tua RAL</a><button class="site-menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav"><span class="site-menu-toggle__icon" aria-hidden="true"></span><span class="sr">Apri il menu</span></button><nav class="site-nav" id="site-nav" aria-label="Navigazione principale"><div class="site-nav__group"><button class="site-nav__trigger" type="button" aria-expanded="false" aria-controls="nav-calcola">Calcola</button><div class="site-nav__submenu" id="nav-calcola"><a href="/">RAL → Netto</a><a href="/netto-ral.html">Netto → RAL</a><a href="/ccnl-livello.html">CCNL e livello</a><a href="/calcolo-tredicesima/">Tredicesima</a></div></div><div class="site-nav__group"><button class="site-nav__trigger" type="button" aria-expanded="false" aria-controls="nav-confronta">Confronta</button><div class="site-nav__submenu" id="nav-confronta"><a href="/compara.html">Due offerte</a><a href="/confronti-ral/">Livelli di RAL</a></div></div><a href="/netto-o-niente.html">Gioca</a><a href="/blog/"${route==='/blog/'?' aria-current="page"':''}>Blog</a><a href="/la-storia.html">La storia</a></nav></div></header>
<main id="contenuto" class="blog-shell">${content}</main><footer class="footer"><div class="blog-shell">Dove va la tua RAL · <a href="/come-ho-lavorato.html">Come ho lavorato</a></div></footer><script src="/site-nav.js"></script></body></html>\n`;
}
const labels={'/':'Metti la tua RAL e vedi il tuo caso','/netto-ral.html':'Calcola la RAL dal netto che vuoi','/compara.html':'Confronta le tue offerte','/ccnl-livello.html':'Calcola la RAL dal tuo CCNL','/busta-paga.html':'Apri lo strumento per la busta paga','/confronti-ral/':'Confronta i livelli di RAL'};
function renderArticle(article,articles){
  const sections=article.body.split(/^## Fonti\s*$/m);
  if(sections.length!==2||!sections[1].trim())throw Error(`${article.file}: serve una sola sezione finale "## Fonti" con le fonti citate`);
  if(!/\[[^\]]+\]\(https?:\/\//.test(sections[1]))throw Error(`${article.file}: Fonti deve contenere almeno un link alla fonte`);
  const related=articles.filter(a=>a.cluster===article.cluster&&a.slug!==article.slug);
  return layout({title:article.title_seo,description:article.description,route:`/blog/${article.slug}/`,content:`
<nav class="blog-breadcrumb" aria-label="Percorso"><a href="/">Home</a> / <a href="/blog/">Blog</a></nav>
<article><header class="article-intro"><p class="eyebrow">${e(article.cluster.replaceAll('-',' '))}</p><h1>${e(article.titolo)}</h1><p class="article-dates">Pubblicato il ${time(article.data_pubblicazione)}<br>Aggiornato il ${time(article.data_aggiornamento)}</p></header>
<div class="article-body">${markdown(sections[0])}</div>
<aside class="article-assumptions"><h2>Ipotesi del calcolo</h2><p>${e(article.ipotesi_calcolo)}</p></aside>
<section class="article-sources"><h2>Fonti</h2><p class="article-dates">Verificate il ${time(article.fonti_verificate)}</p>${markdown(sections[1])}</section>
<div class="article-cta"><a class="btn btn--primary" href="${e(article.cta)}">${e(labels[article.cta]||'Apri il calcolo per il tuo caso')} →</a></div></article>
${related.length?`<section class="blog-related"><h2>Nello stesso argomento</h2>${cards(related)}</section>`:''}`});
}
function cards(articles){return `<ul class="blog-cards">${articles.map(a=>`<li><a href="/blog/${a.slug}/"><span class="article-dates">${time(a.data_pubblicazione)}</span><h3>${e(a.titolo)}</h3><p>${e(a.description)}</p><span aria-hidden="true">Leggi l’articolo →</span></a></li>`).join('')}</ul>`;}
function renderIndex(articles){
  const clusters=[...new Set(articles.map(a=>a.cluster))].sort();
  return layout({title:'Blog: RAL, stipendio netto e busta paga',description:'Articoli su RAL, stipendio netto e busta paga, con ipotesi di calcolo, fonti e date di aggiornamento visibili.',route:'/blog/',content:`<header class="article-intro"><p class="eyebrow">Il blog</p><h1>Capire il tuo stipendio.</h1><p class="lead">Dal lordo al netto, con le ipotesi in chiaro e le fonti accanto.</p></header>${articles.length?`<nav class="blog-clusters" aria-label="Argomenti">${clusters.map(c=>`<a href="#${c}">${e(c.replaceAll('-',' '))}</a>`).join('')}</nav>${clusters.map(c=>`<section class="blog-cluster" id="${c}"><h2>${e(c.replaceAll('-',' '))}</h2>${cards(articles.filter(a=>a.cluster===c))}</section>`).join('')}`:'<p class="blog-empty">I primi articoli sono in preparazione. Nel frattempo puoi <a href="/">calcolare il netto dalla tua RAL</a>.</p>'}`});
}
module.exports={renderArticle,renderIndex};
