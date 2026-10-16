const {test, before, after} = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const {execFile} = require('node:child_process');
const {promisify} = require('node:util');
const {verificaPagina} = require('./verifica-pagina.js');
const CLI = require.resolve('./verifica-pagina.js');
const run = (...argomenti) => promisify(execFile)(process.execPath, [CLI, ...argomenti]);

// Server locale: ogni path simula una pagina esterna reale.
const pagine = {
  '/con-link': [200, `<html><body><p>Per il netto usa
    <a href="https://www.dovevalatuaral.com/minimi-ccnl/commercio/" rel="nofollow noopener">Dove va la tua RAL</a>.</p></body></html>`],
  '/menzione': [200, `<html><body><h1>Strumenti utili</h1>
    <p>Per il netto ho provato <strong>Dove va la tua RAL</strong>: chiaro e gratuito.</p>
    <p>Altro paragrafo senza nomi.</p></body></html>`],
  '/solo-script': [200, `<html><head><style>.dovevalatuaral{}</style>
    <script>var u = "https://www.dovevalatuaral.com/";</script></head>
    <body><!-- dove va la tua ral --><p>Niente da vedere.</p></body></html>`],
  '/link-legacy': [200, `<p>Il calcolatore di Riccardo:
    <a href='https://jethr.riccsartori.com/la-storia.html'>jethr.riccsartori.com</a></p>
    <p>Link non nostro: <a href="https://www.riccsartori.com/">sito personale</a></p>`],
  '/link-commentato': [200, `<p>Risorse</p><!-- <a href="https://www.dovevalatuaral.com/">vecchio</a> -->`],
  '/spostata': [301, '', {location: '/con-link'}],
  '/spostata-su-morta': [308, '', {location: '/rimossa'}],
  '/rimossa': [410, 'gone'],
  '/bloccata': [403, 'Access denied'],
  '/troppe': [429, 'Too many requests'],
  '/errore': [503, 'Service unavailable'],
};

let server, base, lastUserAgent;
before(async () => {
  server = http.createServer((req, res) => {
    lastUserAgent = req.headers['user-agent'];
    if (req.url === '/muta') return; // non risponde mai
    const pagina = pagine[req.url];
    if (!pagina) { res.writeHead(404); res.end('non trovata'); return; }
    const [stato, corpo, intestazioni = {}] = pagina;
    res.writeHead(stato, {'content-type': 'text/html; charset=utf-8', ...intestazioni});
    res.end(corpo);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => { server.closeAllConnections(); server.close(); });

test('pagina viva con un link al sito: stato 200, link con href, testo e rel', async () => {
  const r = await verificaPagina(`${base}/con-link`);
  assert.equal(r.stato, 200);
  assert.equal(r.esito, 'viva');
  assert.deepEqual(r.link, [{
    href: 'https://www.dovevalatuaral.com/minimi-ccnl/commercio/',
    testo: 'Dove va la tua RAL',
    rel: 'nofollow noopener',
  }]);
});

test('404 e 410 sono pagine morte', async () => {
  for (const [path, stato] of [['/non-esiste', 404], ['/rimossa', 410]]) {
    const r = await verificaPagina(`${base}${path}`);
    assert.equal(r.stato, stato);
    assert.equal(r.esito, 'morta', path);
  }
});

test('richiesta bloccata o server in errore: non verificato, mai morta', async () => {
  for (const [path, stato] of [['/bloccata', 403], ['/troppe', 429], ['/errore', 503]]) {
    const r = await verificaPagina(`${base}${path}`);
    assert.equal(r.stato, stato);
    assert.equal(r.esito, 'non verificato', path);
  }
});

test('host irraggiungibile: non verificato, senza stato HTTP, con il motivo', async () => {
  const r = await verificaPagina('http://127.0.0.1:1/qualcosa');
  assert.equal(r.stato, null);
  assert.equal(r.esito, 'non verificato');
  assert.match(r.errore, /\S/);
  assert.deepEqual(r.link, []);
  assert.deepEqual(r.menzioni, []);
});

test('menzione senza link: riporta la frase, nessun link', async () => {
  const r = await verificaPagina(`${base}/menzione`);
  assert.equal(r.esito, 'viva');
  assert.deepEqual(r.link, []);
  assert.deepEqual(r.menzioni, ['Per il netto ho provato Dove va la tua RAL: chiaro e gratuito.']);
});

test('script, stili e commenti HTML non sono menzioni', async () => {
  const r = await verificaPagina(`${base}/solo-script`);
  assert.deepEqual(r.menzioni, []);
  assert.deepEqual(r.link, []);
});

test('il dominio legacy jethr.riccsartori.com conta come link nostro, riccsartori.com no', async () => {
  const r = await verificaPagina(`${base}/link-legacy`);
  assert.deepEqual(r.link, [{
    href: 'https://jethr.riccsartori.com/la-storia.html', testo: 'jethr.riccsartori.com', rel: null,
  }]);
});

test('un link commentato nell\'HTML non è un link', async () => {
  const r = await verificaPagina(`${base}/link-commentato`);
  assert.deepEqual(r.link, []);
});

test('redirect seguiti: esito e link dalla pagina finale, con urlFinale', async () => {
  const viva = await verificaPagina(`${base}/spostata`);
  assert.equal(viva.stato, 200);
  assert.equal(viva.esito, 'viva');
  assert.equal(viva.urlFinale, `${base}/con-link`);
  assert.equal(viva.link.length, 1);
  const morta = await verificaPagina(`${base}/spostata-su-morta`);
  assert.equal(morta.esito, 'morta');
  assert.equal(morta.urlFinale, `${base}/rimossa`);
});

test('pagina che non risponde entro il timeout: non verificato', async () => {
  const r = await verificaPagina(`${base}/muta`, {timeoutMs: 200});
  assert.equal(r.stato, null);
  assert.equal(r.esito, 'non verificato');
  assert.match(r.errore, /timeout/i);
});

test('CLI: una riga JSON per URL, nell\'ordine dato', async () => {
  const {stdout} = await run(`${base}/con-link`, `${base}/rimossa`);
  const righe = stdout.trim().split('\n').map(r => JSON.parse(r));
  assert.deepEqual(righe.map(r => [r.url, r.esito]), [[`${base}/con-link`, 'viva'], [`${base}/rimossa`, 'morta']]);
});

test('CLI senza URL: spiega l\'uso ed esce con 2', async () => {
  await assert.rejects(run(), e => e.code === 2 && /uso:/i.test(e.stderr));
});

test('si presenta con uno user agent che nomina il sito', async () => {
  await verificaPagina(`${base}/con-link`);
  assert.match(lastUserAgent, /dovevalatuaral\.com/);
});
