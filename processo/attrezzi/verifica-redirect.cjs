/* Verifica il routing reale della preview: node processo/attrezzi/verifica-redirect.cjs https://preview.vercel.app */
const assert = require('node:assert/strict');
const { VERSIONE } = require('../../prototipo/netto-o-niente-link.js');
const origin = process.argv[2];
if (!origin) throw new Error('Specificare l’URL della preview Vercel');
const base = new URL(origin);
const query = '?ral=35000&m=14&c=F205&calc=1';
const redirects = [
  ['/minimi-ccnl/commercio', '/minimi-ccnl/commercio/'],
  ['/minimi-ccnl/metalmeccanico', '/minimi-ccnl/metalmeccanico/'],
  ['/minimi-ccnl', '/minimi-ccnl/'],
  ['/minimi-ccnl/commercio/5-livello', '/minimi-ccnl/commercio/5-livello/'],
  ['/ral-35000-netto', '/ral-35000-netto/'],
  ['/calcolo-tredicesima' + query, '/calcolo-tredicesima/' + query],
  ['/index.html', '/'],
  ['/index.html?ral=35000', '/?ral=35000'],
  ['/index.html' + query, '/' + query],
];
const apiQuery = `?v=${VERSIONE}&s=123456789&t=12`;
const pages = [
  '/', '/netto-o-niente.html', '/compara.html', '/ccnl-livello.html',
  '/netto-ral.html', '/come-ho-lavorato.html', '/la-storia.html',
  '/draftsman.css', '/site-nav.js', '/robots.txt', '/sitemap.xml',
  '/api/risultato' + apiQuery, '/api/risultato-immagine' + apiQuery,
  `/risultato/${VERSIONE}/123456789/12`,
  `/risultato-immagine/${VERSIONE}/123456789/12.png`,
];
async function check(path, status, destination) {
  const response = await fetch(new URL(path, base), { method: 'HEAD', redirect: 'manual' });
  assert.equal(response.status, status, path);
  if (destination) {
    assert.equal(new URL(response.headers.get('location'), base).href, new URL(destination, base).href, path);
    await check(destination, 200);
  } else {
    assert.equal(response.headers.get('location'), null, path);
  }
  console.log(`${status} ${path}${destination ? ' → ' + destination : ''}`);
}
async function main() {
  for (const [path, destination] of redirects) await check(path, 308, destination);
  for (const path of pages) await check(path, 200);
  for (const path of ['/api/risultato' + apiQuery, '/api/risultato-immagine' + apiQuery]) {
    const response = await fetch(new URL(path, base), { redirect: 'manual' });
    assert.equal(response.status, 200, path);
    if (path.startsWith('/api/risultato-immagine')) {
      assert.match(response.headers.get('content-type'), /^image\/png/);
      assert.equal(Buffer.from(await response.arrayBuffer()).subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    } else {
      assert.match(await response.text(), /<!doctype html>/i);
    }
    console.log(`200 GET ${path} (contenuto verificato)`);
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
