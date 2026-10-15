// Apre una pagina esterna e dice se linka dovevalatuaral.com o lo nomina senza linkarlo.
// Uso: node processo/link/verifica-pagina.js <url> [<url>...]  → una riga JSON per URL.
// Lo usano le skill backlink (.claude/skills/link-recupero).
// jethr.riccsartori.com è il dominio di lancio: fa 301 verso www, quindi un suo link è già nostro.
const NOSTRI = ['dovevalatuaral.com', 'www.dovevalatuaral.com', 'jethr.riccsartori.com'];
const INVISIBILE = /<!--[\s\S]*?-->|<(script|style|noscript|template)\b[\s\S]*?<\/\1\s*>/gi;

function attributo(tag, nome) {
  const m = tag.match(new RegExp(`\\s${nome}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return m ? (m[1] ?? m[2] ?? m[3]) : null;
}

function testoVisibile(html) {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function estraiLink(html, urlPagina) {
  const link = [];
  for (const m of html.replace(INVISIBILE, '').matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const href = attributo(m[1], 'href');
    if (!href) continue;
    let url;
    try { url = new URL(href, urlPagina); } catch { continue; }
    if (!NOSTRI.includes(url.hostname)) continue;
    link.push({href: url.href, testo: testoVisibile(m[2]), rel: attributo(m[1], 'rel')});
  }
  return link;
}

// Solo 404 e 410 dicono "morta". Una richiesta bloccata (403, 429, 5xx, rete) non prova niente.
function esitoDi(stato) {
  if (stato >= 200 && stato < 300) return 'viva';
  if (stato === 404 || stato === 410) return 'morta';
  return 'non verificato';
}

const MENZIONE = /dove\s*va\s*la\s*tua\s*ral|dovevalatuaral/i;
const BLOCCO = /<\/?(?:p|div|h[1-6]|li|ul|ol|br|tr|td|th|table|section|article|header|footer|blockquote|figcaption|nav|aside|main)\b[^>]*>/gi;

// Paragrafi del testo visibile che nominano il sito.
function trovaMenzioni(html) {
  return html
    .replace(INVISIBILE, '')
    .replace(BLOCCO, '\n')
    .split('\n')
    .map(testoVisibile)
    .filter(paragrafo => MENZIONE.test(paragrafo));
}

const INTESTAZIONI = {
  'user-agent': 'Mozilla/5.0 (compatible; dovevalatuaral-verifica-link/1.0; +https://www.dovevalatuaral.com/)',
  accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
};

async function verificaPagina(url, {timeoutMs = 20000} = {}) {
  let risposta, html;
  try {
    risposta = await fetch(url, {headers: INTESTAZIONI, signal: AbortSignal.timeout(timeoutMs)});
    html = await risposta.text();
  } catch (e) {
    return {url, stato: null, esito: 'non verificato', errore: String(e.cause?.code || e.message), link: [], menzioni: []};
  }
  return {
    url, urlFinale: risposta.url, stato: risposta.status, esito: esitoDi(risposta.status),
    link: estraiLink(html, risposta.url), menzioni: trovaMenzioni(html),
  };
}

module.exports = {verificaPagina};

if (require.main === module) {
  const urls = process.argv.slice(2);
  if (!urls.length) {
    console.error('Uso: node processo/link/verifica-pagina.js <url> [<url>...]');
    process.exit(2);
  }
  (async () => {
    for (const url of urls) console.log(JSON.stringify(await verificaPagina(url)));
  })();
}
