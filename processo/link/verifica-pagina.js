// Apre una pagina esterna e dice se linka dovevalatuaral.com o lo nomina senza linkarlo.
// Uso: node processo/link/verifica-pagina.js <url> [<url>...]  → una riga JSON per URL.
// Lo usano le skill backlink (.claude/skills/link-recupero, link-dono). È anche l'unico controllo dei link:
// misure.mjs (link-review) legge i link con findLinks e scarica le pagine con fetchPage.
const {isOurs} = require('./sito.js');

// Ciò che il browser non mostra: commenti, script, stili.
const INVISIBLE = /<!--[\s\S]*?-->|<(script|style|noscript|template)\b[\s\S]*?<\/\1\s*>/gi;
// I tag che chiudono un blocco di testo: separano i paragrafi delle menzioni e delimitano il contesto di un link.
const BLOCK_TAGS = 'p|div|h[1-6]|li|ul|ol|br|tr|td|th|table|dd|dt|section|article|header|footer|blockquote|figcaption|nav|aside|main';
const BLOCK = new RegExp(`</?(?:${BLOCK_TAGS})\\b[^>]*>`, 'gi');

const ENTITIES = {amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', agrave: 'à', egrave: 'è', eacute: 'é', igrave: 'ì', ograve: 'ò', ugrave: 'ù'};
const decodeEntities = text => text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, name) =>
  name[0] === '#' ? String.fromCodePoint(Number(name[1].toLowerCase() === 'x' ? `0${name.slice(1)}` : name.slice(1)))
    : ENTITIES[name.toLowerCase()] ?? entity);

function visibleText(html) {
  return decodeEntities(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').replace(/ ([,.;:!?])/g, '$1').trim();
}

function attribute(tag, name) {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return m ? decodeEntities(m[1] ?? m[2] ?? m[3]) : null;
}

// Il testo del blocco (paragrafo, voce di lista, cella…) che contiene il link.
function context(html, start, end) {
  const openings = [...html.slice(0, start).matchAll(new RegExp(`<(?:${BLOCK_TAGS})\\b[^>]*>`, 'gi'))];
  const from = openings.length ? openings.at(-1).index + openings.at(-1)[0].length : Math.max(0, start - 300);
  const closing = html.slice(end).match(new RegExp(`</(?:${BLOCK_TAGS})\\s*>`, 'i'));
  const to = closing ? end + closing.index : end + 300;
  return visibleText(html.slice(from, to)).slice(0, 500);
}

// I link visibili della pagina verso il sito (o il dominio di lancio), con testo, alt dell'immagine, rel e contesto.
function findLinks(html, pageUrl) {
  const visible = html.replace(INVISIBLE, '');
  const links = [];
  for (const m of visible.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi)) {
    const href = attribute(m[1], 'href');
    if (!href) continue;
    let url;
    try { url = new URL(href, pageUrl); } catch { continue; }
    if (!isOurs(url.hostname)) continue;
    const image = m[2].match(/<img\b[^>]*>/i);
    links.push({
      url, text: visibleText(m[2]), imageAlt: image ? attribute(image[0], 'alt') : null, rel: attribute(m[1], 'rel'),
      context: context(visible, m.index, m.index + m[0].length),
    });
  }
  return links;
}

const extractLinks = (html, pageUrl) =>
  findLinks(html, pageUrl).map(({url, text, rel}) => ({href: url.href, testo: text, rel}));

// Solo 404 e 410 dicono "morta". Una richiesta bloccata (403, 429, 5xx, rete) non prova niente.
function outcomeOf(status) {
  if (status >= 200 && status < 300) return 'viva';
  if (status === 404 || status === 410) return 'morta';
  return 'non verificato';
}

const MENZIONE = /dove\s*va\s*la\s*tua\s*ral|dovevalatuaral/i;

// Paragrafi del testo visibile che nominano il sito.
function trovaMenzioni(html) {
  return html
    .replace(INVISIBLE, '')
    .replace(BLOCK, '\n')
    .split('\n')
    .map(visibleText)
    .filter(paragrafo => MENZIONE.test(paragrafo));
}

const HEADERS = {
  'user-agent': 'Mozilla/5.0 (compatible; dovevalatuaral-verifica-link/1.0; +https://www.dovevalatuaral.com/)',
  accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
};

// Scarica la pagina seguendo i redirect. Un errore di rete o il timeout escono come eccezione.
async function fetchPage(url, {timeoutMs = 20000} = {}) {
  const response = await fetch(url, {headers: HEADERS, redirect: 'follow', signal: AbortSignal.timeout(timeoutMs)});
  return {status: response.status, finalUrl: response.url, html: await response.text()};
}

async function verificaPagina(url, {timeoutMs = 20000} = {}) {
  let page;
  try {
    page = await fetchPage(url, {timeoutMs});
  } catch (e) {
    return {url, stato: null, esito: 'non verificato', errore: String(e.cause?.code || e.message), link: [], menzioni: []};
  }
  return {
    url, urlFinale: page.finalUrl, stato: page.status, esito: outcomeOf(page.status),
    link: extractLinks(page.html, page.finalUrl), menzioni: trovaMenzioni(page.html),
  };
}

module.exports = {verificaPagina, findLinks, fetchPage};

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
