// Test di misure.mjs, l'attrezzo deterministico della skill link-review.
// Si lanciano con: node --test .claude/skills/link-review/misure.test.mjs
// Nessuna rete vera: GSC e DataFast sono finti (funzioni iniettate, script e server locali).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { calendario, misuraGsc, misuraDatafast, controllaLink } from './misure.mjs';

const CLI = fileURLToPath(new URL('./misure.mjs', import.meta.url));
const { DATAFAST_API_KEY: _chiaveVera, ...AMBIENTE } = process.env; // la chiave vera non arriva mai ai test

// Lancia la CLI come la lancia l'agente; risolve sempre con { codice, stdout, stderr }.
function cli(argomenti, ambiente = {}) {
  return new Promise((risolvi) => {
    execFile(process.execPath, [CLI, ...argomenti], { env: { ...AMBIENTE, ...ambiente } }, (errore, stdout, stderr) =>
      risolvi({ codice: errore ? errore.code : 0, stdout, stderr }),
    );
  });
}

// Un gsc.mjs finto: stampa le righe come quello vero, oppure fallisce come quello vero.
function gscBinFinto({ fallisci } = {}) {
  const cartella = mkdtempSync(join(tmpdir(), 'link-review-gsc-'));
  const file = join(cartella, 'gsc.mjs');
  writeFileSync(
    file,
    fallisci
      ? `console.error(${JSON.stringify(fallisci)}); process.exit(1);`
      : `const [, , comando, sito, dal, al, dimensioni] = process.argv;
         if (comando !== 'query' || sito !== 'sc-domain:dovevalatuaral.com') { console.error('errore: argomenti'); process.exit(1); }
         const righe = dimensioni === 'date' && al >= '2026-10-12' && dal <= '2026-10-12'
           ? [{ keys: ['2026-10-12'], clicks: 34, impressions: 2273, ctr: 0.015, position: 6.9 }] : [];
         console.log(JSON.stringify(righe, null, 2));`,
  );
  return file;
}

test('calendario del lunedì: settimana, follow-up dovuti, soglia dei 60 giorni di attesa', () => {
  assert.deepEqual(calendario('2026-11-02'), {
    oggi: '2026-11-02',
    settimana: { dal: '2026-10-26', al: '2026-11-01' },
    dataforseo_date_from: '2026-10-26',
    followup_dovuto_se_invio_entro: '2026-10-26',
    attesa_se_link_dopo: '2026-09-03',
  });
});

// GSC finto: risponde come gsc.mjs (righe {keys, clicks, impressions, ctr, position}) a seconda delle dimensioni.
function gscFinto({ giorni = [], pagine = {}, queryPagine = {} } = {}) {
  const chiamate = [];
  const query = async (dal, al, dimensioni) => {
    chiamate.push({ dal, al, dimensioni });
    if (dimensioni === 'date') return giorni.filter((r) => r.keys[0] >= dal && r.keys[0] <= al);
    if (dimensioni === 'page') return pagine[`${dal}/${al}`] ?? [];
    if (dimensioni === 'query,page') return queryPagine[`${dal}/${al}`] ?? [];
    throw new Error(`dimensioni inattese: ${dimensioni}`);
  };
  return { query, chiamate };
}
const giorno = (data, clicks = 0, impressions = 0) => ({ keys: [data], clicks, impressions, ctr: 0, position: 7 });

test("GSC: le finestre partono dall'ultimo giorno con dati, non da oggi meno un ritardo fisso", async () => {
  const { query } = gscFinto({ giorni: [giorno('2026-10-11', 9, 916), giorno('2026-10-12', 34, 2273)] });
  const r = await misuraGsc({ oggi: '2026-10-15', pagine: [], query });
  assert.equal(r.ultimo_giorno_con_dati, '2026-10-12');
  assert.deepEqual(r.finestre, {
    recenti: { dal: '2026-09-15', al: '2026-10-12' },
    precedenti: { dal: '2026-08-18', al: '2026-09-14' },
  });
});

test('GSC: clic e impressioni del sito sommati giorno per giorno in ciascuna finestra', async () => {
  const { query } = gscFinto({
    giorni: [
      giorno('2026-08-17', 1000, 1000), // fuori da entrambe le finestre
      giorno('2026-08-18', 3, 300),
      giorno('2026-09-14', 4, 400),
      giorno('2026-09-15', 10, 1000),
      giorno('2026-10-12', 20, 2000),
    ],
  });
  const r = await misuraGsc({ oggi: '2026-10-15', pagine: [], query });
  assert.deepEqual(r.sito, {
    recenti: { clic: 30, impressioni: 3000 },
    precedenti: { clic: 7, impressioni: 700 },
  });
});

const riga = (keys, clicks, impressions, position) => ({ keys, clicks, impressions, ctr: 0, position });
const RECENTI = '2026-09-15/2026-10-12';
const PRECEDENTI = '2026-08-18/2026-09-14';

test('GSC: pagine linkate confrontate tra le finestre, varianti www e senza www sommate', async () => {
  const { query } = gscFinto({
    giorni: [giorno('2026-10-12')],
    pagine: {
      [RECENTI]: [
        riga(['https://www.dovevalatuaral.com/minimi-ccnl/commercio/'], 8, 400, 6),
        riga(['https://dovevalatuaral.com/minimi-ccnl/commercio/'], 2, 100, 11),
        riga(['https://www.dovevalatuaral.com/minimi-ccnl/logistica/'], 50, 5000, 3),
        riga(['https://www.dovevalatuaral.com/minimi-ccnl/metalmeccanico/'], 0, 40, 25),
      ],
      [PRECEDENTI]: [riga(['https://www.dovevalatuaral.com/minimi-ccnl/commercio/'], 12, 300, 9.2)],
    },
  });
  const r = await misuraGsc({
    oggi: '2026-10-15',
    pagine: ['https://dovevalatuaral.com/minimi-ccnl/commercio', '/minimi-ccnl/metalmeccanico/'],
    query,
  });
  assert.deepEqual(r.pagine, [
    {
      pagina: '/minimi-ccnl/commercio/',
      recenti: { clic: 10, impressioni: 500, posizione: 7 },
      precedenti: { clic: 12, impressioni: 300, posizione: 9.2 },
      delta_clic: -2,
      delta_impressioni: 200,
      guadagna_impressioni: true,
      perde_clic: true,
    },
    {
      pagina: '/minimi-ccnl/metalmeccanico/',
      recenti: { clic: 0, impressioni: 40, posizione: 25 },
      precedenti: { clic: 0, impressioni: 0, posizione: null },
      delta_clic: 0,
      delta_impressioni: 40,
      guadagna_impressioni: true,
      perde_clic: false,
    },
  ]);
});

test('GSC: query delle pagine linkate entrate in top 10 (prima oltre il 10° posto o assenti)', async () => {
  const commercio = 'https://www.dovevalatuaral.com/minimi-ccnl/commercio/';
  const { query } = gscFinto({
    giorni: [giorno('2026-10-12')],
    queryPagine: {
      [RECENTI]: [
        riga(['ccnl commercio 2026', commercio], 5, 200, 8),
        riga(['minimi commercio', 'https://dovevalatuaral.com/minimi-ccnl/commercio/'], 1, 30, 9),
        riga(['tabella commercio', commercio], 9, 90, 4), // era già in top 10
        riga(['commercio 4 livello', commercio], 0, 70, 15), // non in top 10
        riga(['ccnl logistica', 'https://www.dovevalatuaral.com/minimi-ccnl/logistica/'], 7, 70, 2), // pagina non linkata
      ],
      [PRECEDENTI]: [riga(['ccnl commercio 2026', commercio], 1, 50, 14), riga(['tabella commercio', commercio], 3, 60, 6)],
    },
  });
  const r = await misuraGsc({ oggi: '2026-10-15', pagine: ['/minimi-ccnl/commercio/'], query });
  assert.deepEqual(r.query_entrate_top10, [
    { query: 'ccnl commercio 2026', pagina: '/minimi-ccnl/commercio/', posizione: 8, posizione_prima: 14, clic: 5, impressioni: 200 },
    { query: 'minimi commercio', pagina: '/minimi-ccnl/commercio/', posizione: 9, posizione_prima: null, clic: 1, impressioni: 30 },
  ]);
});

test('GSC: sotto le 10 impressioni una query entrata in top 10 è rumore: si conta ma non si elenca', async () => {
  const commercio = 'https://www.dovevalatuaral.com/minimi-ccnl/commercio/';
  const { query } = gscFinto({
    giorni: [giorno('2026-10-12')],
    queryPagine: {
      [RECENTI]: [
        riga(['5 livello', commercio], 0, 1, 2),
        riga(['ccnl commercio 2026', commercio], 0, 27, 9.6),
        riga(['minimi tabellari commercio 2026', commercio], 0, 9, 3),
        riga(['tabelle retributive commercio 2026', commercio], 1, 44, 9.4),
      ],
    },
  });
  const r = await misuraGsc({ oggi: '2026-10-15', pagine: ['/minimi-ccnl/commercio/'], query });
  assert.deepEqual(
    r.query_entrate_top10.map((q) => q.query),
    ['tabelle retributive commercio 2026', 'ccnl commercio 2026'],
  );
  assert.equal(r.query_entrate_top10_sotto_10_impressioni, 2);
});

test('DataFast: visitatori dai domini che linkano, sottodomini e www inclusi, finestre fino a ieri', async () => {
  const risposte = {
    '2026-09-17/2026-10-14': [
      { referrer: 'Google', visitors: 300 },
      { referrer: 'Direct/None', visitors: 100 },
      { referrer: 'www.cgil-esempio.it', visitors: 4 },
      { referrer: 'blog.cgil-esempio.it', visitors: 2 },
      { referrer: 'riccsartori.com', visitors: 16 },
    ],
    '2026-08-20/2026-09-16': [
      { referrer: 'Google', visitors: 200 },
      { referrer: 'cgil-esempio.it', visitors: 1 },
    ],
  };
  const referrers = async (dal, al) => risposte[`${dal}/${al}`] ?? [];
  const r = await misuraDatafast({
    oggi: '2026-10-15',
    domini: ['https://www.CGIL-esempio.it/minimi', 'consulente-esempio.it'],
    referrers,
  });
  assert.deepEqual(r, {
    finestre: {
      recenti: { dal: '2026-09-17', al: '2026-10-14' },
      precedenti: { dal: '2026-08-20', al: '2026-09-16' },
    },
    referrer_distinti: { recenti: 5, precedenti: 2 },
    visitatori_somma: { recenti: 422, precedenti: 201 },
    domini: [
      { dominio: 'cgil-esempio.it', recenti: 6, precedenti: 1 },
      { dominio: 'consulente-esempio.it', recenti: 0, precedenti: 0 },
    ],
  });
});

test('DataFast: le sorgenti che DataFast chiama per nome (GitHub, LinkedIn) contano per il loro dominio', async () => {
  const referrers = async (dal) =>
    dal === '2026-09-17' ? [{ referrer: 'GitHub', visitors: 5 }, { referrer: 'LinkedIn', visitors: 124 }, { referrer: 'Google', visitors: 459 }] : [];
  const r = await misuraDatafast({ oggi: '2026-10-15', domini: ['github.com', 'www.linkedin.com'], referrers });
  assert.deepEqual(r.domini, [
    { dominio: 'github.com', recenti: 5, precedenti: 0 },
    { dominio: 'linkedin.com', recenti: 124, precedenti: 0 },
  ]);
});

const PAGINA_CHE_LINKA = `<!doctype html><html><body>
<nav><a href="/chi-siamo">Chi siamo</a></nav>
<p>Le tabelle aggiornate dei minimi sono su <a class="x" href="https://www.dovevalatuaral.com/minimi-ccnl/commercio/" rel="noopener nofollow">Dove va la tua RAL</a>, con il netto per livello.</p>
<p>Calcola il netto: <a href='https://dovevalatuaral.com/'>dovevalatuaral.com</a></p>
<ul><li>Vecchio dominio: <A HREF=http://jethr.riccsartori.com/ REL="sponsored ugc">qui</A></li></ul>
<p><a href="https://www.dovevalatuaral.com/minimi-ccnl/commercio/"><img src="x.png" alt="Tabella CCNL commercio"></a></p>
<p>Altro: <a href="https://www.altrosito.it/dovevalatuaral.com/">non nostro</a></p>
</body></html>`;

test('link: trova solo i link verso il sito, con anchor, rel effettivo e confronto con la destinazione concordata', () => {
  const r = controllaLink({
    html: PAGINA_CHE_LINKA,
    pagina: 'https://www.cgil-esempio.it/minimi/',
    destinazione: 'https://dovevalatuaral.com/minimi-ccnl/commercio',
  });
  assert.deepEqual(
    r.link_al_sito.map(({ contesto, ...link }) => link),
    [
      {
        href: 'https://www.dovevalatuaral.com/minimi-ccnl/commercio/',
        host: 'www.dovevalatuaral.com',
        percorso: '/minimi-ccnl/commercio/',
        anchor: 'Dove va la tua RAL',
        rel: 'noopener nofollow',
        rel_effettivo: 'nofollow',
        verso_destinazione: true,
      },
      {
        href: 'https://dovevalatuaral.com/',
        host: 'dovevalatuaral.com',
        percorso: '/',
        anchor: 'dovevalatuaral.com',
        rel: '',
        rel_effettivo: 'follow',
        verso_destinazione: false,
      },
      {
        href: 'http://jethr.riccsartori.com/',
        host: 'jethr.riccsartori.com',
        percorso: '/',
        anchor: 'qui',
        rel: 'sponsored ugc',
        rel_effettivo: 'sponsored',
        verso_destinazione: false,
      },
      {
        href: 'https://www.dovevalatuaral.com/minimi-ccnl/commercio/',
        host: 'www.dovevalatuaral.com',
        percorso: '/minimi-ccnl/commercio/',
        anchor: '[immagine: Tabella CCNL commercio]',
        rel: '',
        rel_effettivo: 'follow',
        verso_destinazione: true,
      },
    ],
  );
  assert.equal(r.verso_destinazione, true);
});

test('link: il contesto è il testo del blocco che contiene il link, per il test del lettore', () => {
  const r = controllaLink({
    html: PAGINA_CHE_LINKA,
    pagina: 'https://www.cgil-esempio.it/minimi/',
    destinazione: 'https://dovevalatuaral.com/minimi-ccnl/commercio/',
  });
  assert.equal(r.link_al_sito[0].contesto, 'Le tabelle aggiornate dei minimi sono su Dove va la tua RAL, con il netto per livello.');
  assert.equal(r.link_al_sito[2].contesto, 'Vecchio dominio: qui');
});

test("link: le entità HTML nell'href vengono decodificate", () => {
  const r = controllaLink({
    html: '<p><a href="https://www.dovevalatuaral.com/?ral=35000&amp;m=13">caso</a></p>',
    pagina: 'https://github.com/ricca91/dovevalatuaral.com',
    destinazione: 'https://www.dovevalatuaral.com/',
  });
  assert.equal(r.link_al_sito[0].href, 'https://www.dovevalatuaral.com/?ral=35000&m=13');
});

test('CLI gsc: interroga gsc.mjs sulla proprietà del sito e stampa il JSON delle misure', async () => {
  const r = await cli(['gsc', '2026-10-15'], { GSC_BIN: gscBinFinto() });
  assert.equal(r.codice, 0, r.stderr);
  const misure = JSON.parse(r.stdout);
  assert.equal(misure.ultimo_giorno_con_dati, '2026-10-12');
  assert.deepEqual(misure.sito.recenti, { clic: 34, impressioni: 2273 });
});

test('CLI gsc: se GSC non risponde lo dice ed esce con 2, senza numeri', async () => {
  const r = await cli(['gsc', '2026-10-15'], { GSC_BIN: gscBinFinto({ fallisci: 'errore: token: invalid_grant' }) });
  assert.equal(r.codice, 2);
  assert.equal(r.stdout, '');
  assert.match(r.stderr, /GSC non ha risposto: .*invalid_grant/);
});

// Un server HTTP locale che fa la parte di datafa.st o di una pagina che linka.
async function server(gestore) {
  const s = createServer(gestore);
  await new Promise((ok) => s.listen(0, '127.0.0.1', ok));
  return { base: `http://127.0.0.1:${s.address().port}`, chiudi: () => s.close() };
}

const CHIAVE_FINTA = 'df_chiave_finta_da_non_stampare_123';

test('CLI datafast: legge la chiave dal file .env indicato, la usa come Bearer e non la stampa mai', async () => {
  const referrer = {
    '2026-09-17': [{ referrer: 'Google', visitors: 300 }, { referrer: 'cgil-esempio.it', visitors: 3 }],
    '2026-08-20': [{ referrer: 'Google', visitors: 200 }],
  };
  const df = await server((req, res) => {
    const url = new URL(req.url, 'http://x');
    if (req.headers.authorization !== `Bearer ${CHIAVE_FINTA}` || url.pathname !== '/api/v1/analytics/referrers') {
      res.writeHead(401).end(JSON.stringify({ status: 'error', message: 'unauthorized' }));
      return;
    }
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ status: 'success', data: referrer[url.searchParams.get('startAt')] ?? [] }));
  });
  const env = join(mkdtempSync(join(tmpdir(), 'link-review-env-')), '.env');
  writeFileSync(env, `ANTHROPIC_API_KEY=altro\nDATAFAST_API_KEY=${CHIAVE_FINTA}\n`);
  try {
    const r = await cli(['datafast', '2026-10-15', 'cgil-esempio.it'], { DATAFAST_ENV_FILE: env, DATAFAST_API: `${df.base}/api/v1` });
    assert.equal(r.codice, 0, r.stderr);
    assert.deepEqual(JSON.parse(r.stdout).domini, [{ dominio: 'cgil-esempio.it', recenti: 3, precedenti: 0 }]);
    assert.doesNotMatch(r.stdout + r.stderr, new RegExp(CHIAVE_FINTA));
  } finally {
    df.chiudi();
  }
});

test('CLI datafast: senza chiave dice dove l\'ha cercata ed esce con 2', async () => {
  const r = await cli(['datafast', '2026-10-15'], { DATAFAST_ENV_FILE: '/nessuna/cartella/.env' });
  assert.equal(r.codice, 2);
  assert.equal(r.stdout, '');
  assert.match(r.stderr, /DataFast non ha risposto: DATAFAST_API_KEY assente .*\/nessuna\/cartella\/\.env/);
});

test('CLI link: scarica la pagina che linka e riporta stato HTTP e link verso la destinazione', async () => {
  const sito = await server((req, res) => {
    if (req.url === '/minimi/') res.writeHead(200, { 'content-type': 'text/html' }).end(PAGINA_CHE_LINKA);
    else res.writeHead(404).end('non trovata');
  });
  try {
    const vivo = await cli(['link', `${sito.base}/minimi/`, 'https://www.dovevalatuaral.com/minimi-ccnl/commercio/']);
    assert.equal(vivo.codice, 0, vivo.stderr);
    const r = JSON.parse(vivo.stdout);
    assert.deepEqual([r.http, r.verso_destinazione, r.link_al_sito.length], [200, true, 4]);

    const morto = JSON.parse((await cli(['link', `${sito.base}/sparita/`, 'https://www.dovevalatuaral.com/'])).stdout);
    assert.deepEqual([morto.http, morto.verso_destinazione, morto.link_al_sito], [404, false, []]);
  } finally {
    sito.chiudi();
  }
});
