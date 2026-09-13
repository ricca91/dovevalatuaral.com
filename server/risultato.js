const L=require('../prototipo/netto-o-niente-link.js');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function origineServer(env=process.env){
  // Mai Host/X-Forwarded-Host: impedisce metadata avvelenati e URL esterni.
  if(env.VERCEL_ENV==='preview'&&/^[a-z0-9-]+\.vercel\.app$/.test(env.VERCEL_URL||''))return'https://'+env.VERCEL_URL;
  if(!env.VERCEL&&/^http:\/\/127\.0\.0\.1:\d{4,5}$/.test(env.NON_DEV_ORIGIN||''))return env.NON_DEV_ORIGIN;
  return L.CANONICAL;
}
function modello(query,origin=origineServer()){
  const p=L.valida(query);if(!p)return null;
  const links=L.crea({versione:p.v,seed:p.s,score:p.t},origin);
  const score=new Intl.NumberFormat('it-IT').format(Number(p.t));
  const next=new Intl.NumberFormat('it-IT').format(Number(p.t)+1);
  return{...links,score,next,titolo:`${score} di fila. Tu arrivi a ${next}? | Netto o niente`,
    descrizione:`Ho riconosciuto ${score} ${p.t==='1'?'offerta':'offerte'} di fila prima di sbagliare. Stessi confronti, stesso ordine: riesci a battermi?`,
    alt:`Netto o niente: ${score} risposte giuste di fila. Tu arrivi a ${next}?`};
}
function html(m){
  return`<!doctype html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(m.titolo)}</title><meta name="description" content="${esc(m.descrizione)}">
<meta name="robots" content="noindex,follow"><link rel="canonical" href="${esc(m.url)}">
<meta property="og:type" content="website"><meta property="og:locale" content="it_IT">
<meta property="og:site_name" content="Netto o niente"><meta property="og:title" content="${esc(m.titolo)}">
<meta property="og:description" content="${esc(m.descrizione)}"><meta property="og:url" content="${esc(m.url)}">
<meta property="og:image" content="${esc(m.immagine)}"><meta property="og:image:secure_url" content="${esc(m.immagine)}">
<meta property="og:image:type" content="image/png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(m.alt)}"><meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(m.titolo)}"><meta name="twitter:description" content="${esc(m.descrizione)}">
<meta name="twitter:image" content="${esc(m.immagine)}"><meta name="twitter:image:alt" content="${esc(m.alt)}">
<link rel="icon" href="data:,"><link rel="stylesheet" href="/draftsman.css"><link rel="stylesheet" href="/netto-o-niente.css"></head>
<body class="non-page"><main class="non-landing">
<a class="non-landing-brand" href="/netto-o-niente.html">NETTO O NIENTE</a>
<p class="non-eyebrow">[ UNA PARTITA. UNA SFIDA. ]</p>
<h1>${esc(m.score)} di fila.<br>Tu arrivi a ${esc(m.next)}?</h1>
<a href="${esc(m.gioco)}" aria-label="Accetta la sfida: supera ${esc(m.score)} risposte corrette"><img src="${esc(m.immagine)}" alt="${esc(m.alt)}" width="1200" height="630"></a>
<p>Due offerte di lavoro. Scegli quella che lascia più soldi dopo tasse e costi del lavoro. Al primo errore, la serie finisce.</p>
<a class="non-button" href="${esc(m.gioco)}">Accetta la sfida</a>
<p class="non-landing-note">Stessi confronti, stesso ordine. Nessun account.<br>Punteggio condiviso dal giocatore, non certificato. Scenari fittizi.</p>
</main></body></html>`;
}
function svg(m){
  // Composizione orizzontale per OG: score leggibile anche come miniatura.
  const scoreSize=Math.min(200,Math.floor(590/Math.max(1,m.score.length)*1.5));
  const nextSize=Math.min(44,Math.floor(650/(`Tu arrivi a ${m.next}?`.length)*1.5));
  let strappo='M44 568';for(let x=44;x<1156;x+=24)strappo+=` L${x+12} 580 L${Math.min(x+24,1156)} 568`;
  return`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#1E1C2B"/><rect x="44" y="40" width="1112" height="528" fill="#F7F6F1"/><path d="${strappo} Z" fill="#F7F6F1"/>
<g fill="#1E1C2B" font-family="Archivo" font-weight="700">
<text x="88" y="119" font-size="54">NETTO O NIENTE</text><text x="1110" y="111" text-anchor="end" font-size="21">LO SCONTRINO DELLA PARTITA</text>
<path d="M88 154H1112 M88 474H1112" stroke="#1E1C2B" stroke-width="2" stroke-dasharray="8 8"/>
<rect x="88" y="190" width="596" height="252" fill="#DCF06B"/>
<text x="386" y="360" text-anchor="middle" font-family="JetBrains Mono" font-size="${scoreSize}">${esc(m.score)}</text>
<text x="386" y="414" text-anchor="middle" font-size="25">${m.t==='1'?'RISPOSTA GIUSTA':'RISPOSTE GIUSTE'} DI FILA</text>
<text x="732" y="254" font-size="29" font-weight="400"><tspan x="732">Pensavo di saper</tspan><tspan x="732" dy="43">leggere un’offerta</tspan><tspan x="732" dy="43">di lavoro.</tspan></text>
<text x="732" y="410" font-size="28">E invece.</text>
<text x="88" y="535" font-size="${nextSize}">Tu arrivi a ${esc(m.next)}?</text>
<text x="1110" y="531" text-anchor="end" font-size="25">dovevalatuaral.com</text>
</g></svg>`;
}
function rispondi(req,res,render,type){
  res.setHeader('X-Content-Type-Options','nosniff');
  if(!['GET','HEAD'].includes(req.method)){res.setHeader('Allow','GET, HEAD');res.statusCode=405;return res.end();}
  // La rewrite Vercel può sovrascrivere parametri omonimi prima di req.query.
  // Per i link pubblici il risultato è interamente nel path: niente query.
  const rawUrl=new URL(req.url||'/api/risultato','http://localhost');
  const publicQuery=/^\/risultato(?:-immagine)?\//.test(rawUrl.pathname)&&rawUrl.search!=='';
  const m=publicQuery?null:modello(req.query);
  if(!m){res.statusCode=400;res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','text/plain; charset=utf-8');return res.end(req.method==='HEAD'?'':'Risultato non valido o versione non supportata.');}
  try{
    const body=render(m);
    res.setHeader('Content-Type',type);
    res.setHeader('Cache-Control','public, max-age=3600, s-maxage=86400');
    res.setHeader('X-Robots-Tag','noindex');
    res.statusCode=200;return res.end(req.method==='HEAD'?undefined:body);
  }catch(_){res.statusCode=500;res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','text/plain; charset=utf-8');return res.end(req.method==='HEAD'?'':'Anteprima temporaneamente non disponibile.');}
}
module.exports={modello,html,svg,origineServer,rispondi};
