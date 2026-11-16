const assert = require('node:assert/strict');
const { readdirSync, readFileSync } = require('node:fs');
const { test } = require('node:test');
const { join } = require('node:path');

// Gli articoli parlano al lettore: appunti di lavoro dell'agente che li scrive
// (strumenti, sessione, revisione, pagine non leggibili) non devono finire in pagina.
// RIC-225. Quei limiti vanno nel report, non nell'articolo.
const articoliDir = join(__dirname, 'articoli');
const frasiSpia = [
  'strumento di lettura',
  'strumenti di lettura',
  'in questa sessione',
  'durante questa revisione',
  'ha risposto 403',
  'risposto 403',
  'non ho potuto rileggere',
  'non ho potuto leggere',
  'parola per parola in questa',
  'flussi compressi',
  'solo il menu di navigazione',
  'strumento con cui leggo',
  'letto come immagine',
  'mio strumento',
];

test('gli articoli non contengono note di sessione dell\'agente', () => {
  const files = readdirSync(articoliDir).filter((f) => f.endsWith('.md'));
  assert.ok(files.length > 0, 'nessun articolo trovato in prototipo/articoli');
  const trovate = [];
  for (const file of files) {
    const testo = readFileSync(join(articoliDir, file), 'utf8').toLowerCase();
    for (const frase of frasiSpia) {
      if (testo.includes(frase)) trovate.push(`${file}: «${frase}»`);
    }
  }
  assert.deepEqual(
    trovate,
    [],
    `Note di sessione negli articoli (vanno nel report, non nella pagina):\n${trovate.join('\n')}`
  );
});
