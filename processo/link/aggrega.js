'use strict';
const { isOurs, normalizeDomain, inDomains } = require('./sito.js');
// Aggrega le citazioni raccolte da link-fonti: un dominio per riga, quanti prompt ChatGPT e quanti cluster
// AI Overview lo citano, cosa si scarta (esclusi.json, domini già su Airtable) e quali pagine nostre sono citate.
// Quali domini sono "nostri" lo dice sito.js, lo stesso degli altri attrezzi.
// Uso: node processo/link/aggrega.js <raccolta.json>   (formato: .claude/skills/link-fonti/SKILL.md, passo 4)

// Un co-citato di AI Overview conta solo se compare in almeno tante risposte accanto a un dominio del top 10.
const MIN_CO_MENZIONI = 3;

function citazioni(voce) {
  const parti = [];
  if (voce.prompt.length) parti.push(`${voce.prompt.length} prompt ChatGPT`);
  if (voce.aiOverview.length) parti.push(`${voce.aiOverview.length} cluster AI Overview`);
  return `${parti.join(' + ')} · ${voce.motori.join(', ')}`;
}

function aggrega(raccolta, esclusi) {
  const perDominio = new Map();
  const voceDi = (dominio) => {
    if (!perDominio.has(dominio)) {
      perDominio.set(dominio, { dominio, promptPerPagina: new Map(), prompt: [], aiOverview: [] });
    }
    return perDominio.get(dominio);
  };

  for (const [id, urls] of Object.entries(raccolta.chatgpt || {})) {
    for (const url of urls) {
      const voce = voceDi(normalizeDomain(url));
      const promptDellaPagina = voce.promptPerPagina.get(url) || [];
      if (!promptDellaPagina.includes(id)) promptDellaPagina.push(id);
      voce.promptPerPagina.set(url, promptDellaPagina);
      if (!voce.prompt.includes(id)) voce.prompt.push(id);
    }
  }

  for (const [cluster, { top = {}, co = {} }] of Object.entries(raccolta.aiOverview || {})) {
    for (const [host, menzioni] of Object.entries(top)) {
      voceDi(normalizeDomain(host)).aiOverview.push({ cluster, menzioni, coCitato: false });
    }
    for (const [host, menzioni] of Object.entries(co)) {
      if (menzioni < MIN_CO_MENZIONI) continue;
      const voce = voceDi(normalizeDomain(host));
      if (voce.aiOverview.some((a) => a.cluster === cluster)) continue;
      voce.aiOverview.push({ cluster, menzioni, coCitato: true });
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
  for (const { promptPerPagina, ...voce } of perDominio.values()) {
    if (isOurs(voce.dominio)) {
      for (const [url, prompt] of promptPerPagina) nostre.chatgpt.push({ url, prompt });
      nostre.aiOverview.push(...voce.aiOverview);
      continue;
    }
    const motivo = motivoEsclusione(voce.dominio);
    if (motivo) {
      esclusiDalRun.push({ dominio: voce.dominio, motivo });
      continue;
    }
    const motori = [];
    if (voce.prompt.length) motori.push('ChatGPT');
    if (voce.aiOverview.length) motori.push('AI Overview');
    const completa = { dominio: voce.dominio, pagine: [...promptPerPagina.keys()], prompt: voce.prompt, aiOverview: voce.aiOverview, motori };
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
