'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { aggrega } = require('./aggrega.js');

const NESSUNO = { nostri: [], competitor: [], giganti: [], istituzioni: [] };

test('un dominio citato da un prompt ChatGPT diventa un prospect con pagina, prompt e citazioni', () => {
  const esito = aggrega({
    chatgpt: { 'COM-1': ['https://ascom.bo.it/2026/10/09/aumento/'] },
  }, NESSUNO);

  assert.deepEqual(esito.prospect, [{
    dominio: 'ascom.bo.it',
    pagine: ['https://ascom.bo.it/2026/10/09/aumento/'],
    prompt: ['COM-1'],
    aiOverview: [],
    motori: ['ChatGPT'],
    citazioni: '1 prompt ChatGPT · ChatGPT',
  }]);
});

test('lo stesso dominio, con o senza www, conta una volta per prompt e tiene le pagine senza doppioni', () => {
  const esito = aggrega({
    chatgpt: {
      'COM-1': ['https://www.filcams.cgil.it/page/terziario', 'https://www.filcams.cgil.it/page/terziario'],
      'COM-4': ['https://filcams.cgil.it/article/terziario/43d4', 'https://www.filcams.cgil.it/page/terziario'],
    },
  }, NESSUNO);

  assert.equal(esito.prospect.length, 1);
  const [filcams] = esito.prospect;
  assert.equal(filcams.dominio, 'filcams.cgil.it');
  assert.deepEqual(filcams.pagine, [
    'https://www.filcams.cgil.it/page/terziario',
    'https://filcams.cgil.it/article/terziario/43d4',
  ]);
  assert.deepEqual(filcams.prompt, ['COM-1', 'COM-4']);
  assert.equal(filcams.citazioni, '2 prompt ChatGPT · ChatGPT');
});

test('AI Overview aggiunge il motore e i cluster; i co-citati contano solo da 3 menzioni in su', () => {
  const esito = aggrega({
    chatgpt: { 'COM-1': ['https://www.filcams.cgil.it/page/terziario'] },
    aiOverview: {
      commercio: {
        top: { 'www.filcams.cgil.it': 44, 'www.contrattocommercio.it': 103 },
        co: { 'upwardcdl.it': 13, 'www.zetaservice.com': 2 },
      },
      'studi-professionali': { top: { 'www.filcams.cgil.it': 31 }, co: {} },
    },
  }, NESSUNO);

  const per = Object.fromEntries(esito.prospect.map((p) => [p.dominio, p]));
  assert.deepEqual(per['filcams.cgil.it'].aiOverview, [
    { cluster: 'commercio', menzioni: 44, coCitato: false },
    { cluster: 'studi-professionali', menzioni: 31, coCitato: false },
  ]);
  assert.deepEqual(per['filcams.cgil.it'].motori, ['ChatGPT', 'AI Overview']);
  assert.equal(per['filcams.cgil.it'].citazioni, '1 prompt ChatGPT + 2 cluster AI Overview · ChatGPT, AI Overview');

  assert.deepEqual(per['contrattocommercio.it'].pagine, []);
  assert.deepEqual(per['contrattocommercio.it'].prompt, []);
  assert.deepEqual(per['contrattocommercio.it'].motori, ['AI Overview']);
  assert.equal(per['contrattocommercio.it'].citazioni, '1 cluster AI Overview · AI Overview');

  assert.deepEqual(per['upwardcdl.it'].aiOverview, [{ cluster: 'commercio', menzioni: 13, coCitato: true }]);
  assert.equal(per['zetaservice.com'], undefined);
});

test('le pagine nostre escono dai prospect e finiscono nella metrica GEO, con i prompt che le citano', () => {
  const esito = aggrega({
    chatgpt: {
      'COM-2': ['https://www.dovevalatuaral.com/minimi-ccnl/commercio/4-livello/', 'https://quantospetta.it/ccnl/commercio/4'],
      'COM-5': ['https://www.dovevalatuaral.com/minimi-ccnl/commercio/'],
      'MET-3': ['https://www.dovevalatuaral.com/minimi-ccnl/commercio/'],
    },
    aiOverview: { commercio: { top: { 'www.dovevalatuaral.com': 4 }, co: {} } },
  }, { ...NESSUNO, nostri: ['dovevalatuaral.com'] });

  assert.deepEqual(esito.prospect.map((p) => p.dominio), ['quantospetta.it']);
  assert.deepEqual(esito.nostre, {
    chatgpt: [
      { url: 'https://www.dovevalatuaral.com/minimi-ccnl/commercio/4-livello/', prompt: ['COM-2'] },
      { url: 'https://www.dovevalatuaral.com/minimi-ccnl/commercio/', prompt: ['COM-5', 'MET-3'] },
    ],
    aiOverview: [{ cluster: 'commercio', menzioni: 4, coCitato: false }],
  });
});

test('competitor, giganti, istituzioni e domini già su Airtable escono con il motivo, sottodomini compresi', () => {
  const esito = aggrega({
    chatgpt: {
      'MET-4': ['https://www.bustaia.it/strumenti/2000-lordo', 'https://tuttocalcolo.it/stipendio-netto/2000'],
      'TRE-1': ['https://www.lavoro.gov.it/notizie/bilancio-2026', 'https://def.finanze.it/prassi?id=1'],
    },
    aiOverview: { commercio: { top: { 'it.indeed.com': 60, 'www.confcommercio.it': 107 }, co: {} } },
    giaInAirtable: ['confcommercio.it'],
  }, {
    nostri: [],
    competitor: ['bustaia.it'],
    giganti: ['indeed.com'],
    istituzioni: ['gov.it', 'finanze.it'],
  });

  assert.deepEqual(esito.prospect.map((p) => p.dominio), ['tuttocalcolo.it']);
  assert.deepEqual(esito.esclusi, [
    { dominio: 'bustaia.it', motivo: 'competitor' },
    { dominio: 'lavoro.gov.it', motivo: 'istituzione' },
    { dominio: 'def.finanze.it', motivo: 'istituzione' },
    { dominio: 'it.indeed.com', motivo: 'gigante' },
    { dominio: 'confcommercio.it', motivo: 'già su Airtable' },
  ]);
});

test('i prospect sono ordinati per motori, poi prompt ChatGPT, poi cluster e menzioni AI Overview', () => {
  const esito = aggrega({
    chatgpt: {
      'COM-1': ['https://solo-chatgpt.it/a', 'https://entrambi.it/a'],
      'COM-2': ['https://solo-chatgpt.it/b'],
    },
    aiOverview: {
      commercio: { top: { 'entrambi.it': 5, 'aio-poche.it': 10, 'aio-tante.it': 90 }, co: {} },
      tredicesima: { top: { 'aio-poche.it': 3 }, co: {} },
    },
  }, NESSUNO);

  assert.deepEqual(esito.prospect.map((p) => p.dominio), [
    'entrambi.it', 'solo-chatgpt.it', 'aio-poche.it', 'aio-tante.it',
  ]);
});

test('da riga di comando legge la raccolta, applica esclusi.json e stampa il JSON', () => {
  const cartella = fs.mkdtempSync(path.join(os.tmpdir(), 'link-fonti-'));
  const file = path.join(cartella, 'raccolta.json');
  fs.writeFileSync(file, JSON.stringify({
    chatgpt: {
      'COM-2': [
        'https://www.dovevalatuaral.com/minimi-ccnl/commercio/4-livello/',
        'https://www.youtube.com/watch?v=x',
        'https://www.bustaia.it/strumenti/x',
        'https://ascom.bo.it/2026/10/09/aumento/',
      ],
    },
  }));

  const run = spawnSync(process.execPath, [path.join(__dirname, 'aggrega.js'), file], { encoding: 'utf8' });

  assert.equal(run.status, 0, run.stderr);
  const esito = JSON.parse(run.stdout);
  assert.deepEqual(esito.prospect.map((p) => p.dominio), ['ascom.bo.it']);
  assert.deepEqual(esito.esclusi, [
    { dominio: 'youtube.com', motivo: 'gigante' },
    { dominio: 'bustaia.it', motivo: 'competitor' },
  ]);
  assert.deepEqual(esito.nostre.chatgpt, [
    { url: 'https://www.dovevalatuaral.com/minimi-ccnl/commercio/4-livello/', prompt: ['COM-2'] },
  ]);
});
