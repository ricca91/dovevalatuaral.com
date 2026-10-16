'use strict';
const { isOurs, normalizeDomain, inDomains } = require('./sito.js');
// Aggrega le citazioni raccolte da link-fonti: un dominio per riga, quanti prompt ChatGPT e quanti cluster
// AI Overview lo citano, cosa si scarta (esclusi.json, domini già su Airtable) e quali pagine nostre sono citate.
// Quali domini sono "nostri" lo dice sito.js, lo stesso degli altri attrezzi.
// Uso: node processo/link/aggrega.js <raccolta.json>   (formato: .claude/skills/link-fonti/SKILL.md, passo 4)

// Un co-citato di AI Overview conta solo se compare in almeno tante risposte accanto a un dominio del top 10.
const MIN_CO_MENZIONI = 3;

function citazioni(citato) {
  const parti = [];
  if (citato.prompt.length) parti.push(`${citato.prompt.length} prompt ChatGPT`);
  if (citato.aiOverview.length) parti.push(`${citato.aiOverview.length} cluster AI Overview`);
  return `${parti.join(' + ')} · ${citato.motori.join(', ')}`;
}

function aggrega(raccolta, esclusi) {
  const perDominio = new Map();
  const dominioCitato = (dominio) => {
    if (!perDominio.has(dominio)) {
      perDominio.set(dominio, { dominio, promptPerPagina: new Map(), prompt: [], aiOverview: [] });
    }
    return perDominio.get(dominio);
  };

  for (const [id, urls] of Object.entries(raccolta.chatgpt || {})) {
    for (const url of urls) {
      const citato = dominioCitato(normalizeDomain(url));
      const promptDellaPagina = citato.promptPerPagina.get(url) || [];
      if (!promptDellaPagina.includes(id)) promptDellaPagina.push(id);
      citato.promptPerPagina.set(url, promptDellaPagina);
      if (!citato.prompt.includes(id)) citato.prompt.push(id);
    }
  }

  for (const [cluster, { top = {}, co = {} }] of Object.entries(raccolta.aiOverview || {})) {
    for (const [host, menzioni] of Object.entries(top)) {
      dominioCitato(normalizeDomain(host)).aiOverview.push({ cluster, menzioni, coCitato: false });
    }
    for (const [host, menzioni] of Object.entries(co)) {
      if (menzioni < MIN_CO_MENZIONI) continue;
      const citato = dominioCitato(normalizeDomain(host));
      if (citato.aiOverview.some((a) => a.cluster === cluster)) continue;
      citato.aiOverview.push({ cluster, menzioni, coCitato: true });
    }
  }

  const giaSuAirtable = (raccolta.giaInAirtable || []).map(normalizeDomain);
  const motivoEsclusione = (dominio) => {
    if (inDomains(dominio, esclusi.proprie)) return 'proprietà di Riccardo';
    if (inDomains(dominio, esclusi.competitor)) return 'competitor';
    if (inDomains(dominio, esclusi.giganti)) return 'gigante';
    if (inDomains(dominio, esclusi.istituzioni)) return 'istituzione';
    if (giaSuAirtable.includes(dominio)) return 'già su Airtable';
    return null;
  };

  const prospect = [];
  const esclusiDalRun = [];
  const nostre = { chatgpt: [], aiOverview: [] };
  for (const { promptPerPagina, ...citato } of perDominio.values()) {
    if (isOurs(citato.dominio)) {
      for (const [url, prompt] of promptPerPagina) nostre.chatgpt.push({ url, prompt });
      nostre.aiOverview.push(...citato.aiOverview);
      continue;
    }
    const motivo = motivoEsclusione(citato.dominio);
    if (motivo) {
      esclusiDalRun.push({ dominio: citato.dominio, motivo });
      continue;
    }
    const motori = [];
    if (citato.prompt.length) motori.push('ChatGPT');
    if (citato.aiOverview.length) motori.push('AI Overview');
    const completa = { dominio: citato.dominio, pagine: [...promptPerPagina.keys()], prompt: citato.prompt, aiOverview: citato.aiOverview, motori };
    prospect.push({ ...completa, citazioni: citazioni(completa) });
  }
  const menzioniAio = (p) => p.aiOverview.reduce((somma, a) => somma + a.menzioni, 0);
  prospect.sort((a, b) =>
    b.motori.length - a.motori.length
    || b.prompt.length - a.prompt.length
    || b.aiOverview.length - a.aiOverview.length
    || menzioniAio(b) - menzioniAio(a)
    || a.dominio.localeCompare(b.dominio));
  return { prospect, esclusi: esclusiDalRun, nostre };
}

module.exports = { aggrega };

if (require.main === module) {
  const fs = require('node:fs');
  const path = require('node:path');
  const [file] = process.argv.slice(2);
  if (!file) {
    console.error('uso: node processo/link/aggrega.js <raccolta.json>');
    process.exit(2);
  }
  const raccolta = JSON.parse(fs.readFileSync(file, 'utf8'));
  const esclusi = JSON.parse(fs.readFileSync(path.join(__dirname, 'esclusi.json'), 'utf8'));
  process.stdout.write(`${JSON.stringify(aggrega(raccolta, esclusi), null, 2)}\n`);
}
