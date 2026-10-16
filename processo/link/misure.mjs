#!/usr/bin/env node
// Misure per le skill backlink (.claude/skills/link-review, link-dono per le date): date, GSC 28 contro 28 giorni,
// DataFast per referrer, controllo dei link. Node puro, nessuna dipendenza. Uso e dipendenze esterne: vedi
// .claude/skills/link-review/SKILL.md.
//
//   node processo/link/misure.mjs date [oggi]
//   node processo/link/misure.mjs gsc <oggi> [pagina linkata ...]
//   node processo/link/misure.mjs datafast <oggi> [dominio che linka ...]
//   node processo/link/misure.mjs link <url della pagina che linka> <nostra pagina concordata>
//
// Stampa JSON su stdout. Se una fonte non risponde: messaggio su stderr, stdout vuoto, uscita 2.

import { execFile } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parseEnv } from 'node:util';
import { addDays } from './date.js';
import { ORIGIN, inDomains, isOurSite, normalizeDomain } from './sito.js';
import { fetchPage, findLinks } from './verifica-pagina.js';

export function calendario(oggi) {
  const settimanaDal = addDays(oggi, -7);
  return {
    oggi,
    settimana: { dal: settimanaDal, al: addDays(oggi, -1) },
    dataforseo_date_from: settimanaDal,
    followup_dovuto_se_invio_entro: settimanaDal,
    attesa_se_link_dopo: addDays(oggi, -60),
  };
}

// 28 giorni che finiscono in `ultimo` e i 28 prima.
function finestre(ultimo) {
  return {
    recenti: { dal: addDays(ultimo, -27), al: ultimo },
    precedenti: { dal: addDays(ultimo, -55), al: addDays(ultimo, -28) },
  };
}

// Una pagina del sito come percorso: senza host (www o no), query e frammento; slash finale tranne sui file (.html).
export function normalizzaPagina(indirizzo) {
  let percorso = new URL(indirizzo, ORIGIN).pathname.replace(/\/index\.html$/, '/');
  if (!percorso.endsWith('/') && !percorso.split('/').at(-1).includes('.')) percorso += '/';
  return percorso;
}

const arrotonda = (n) => Math.round(n * 10) / 10;

// Somma clic e impressioni delle righe; posizione media pesata sulle impressioni.
function aggrega(righe) {
  const impressioni = righe.reduce((s, r) => s + r.impressions, 0);
  return {
    clic: righe.reduce((s, r) => s + r.clicks, 0),
    impressioni,
    posizione: impressioni ? arrotonda(righe.reduce((s, r) => s + r.position * r.impressions, 0) / impressioni) : null,
  };
}

// `query(dal, al, dimensioni)` restituisce le righe di searchAnalytics/query (formato di gsc.mjs).
export async function misuraGsc({ oggi, pagine = [], query }) {
  const giorni = await query(addDays(oggi, -10), oggi, 'date');
  if (!giorni.length) throw new Error(`nessun dato GSC tra ${addDays(oggi, -10)} e ${oggi}`);
  const ultimo = giorni.map((r) => r.keys[0]).sort().at(-1);
  const f = finestre(ultimo);
  const sito = {};
  for (const [nome, { dal, al }] of Object.entries(f)) {
    const righe = await query(dal, al, 'date');
    sito[nome] = {
      clic: righe.reduce((s, r) => s + r.clicks, 0),
      impressioni: righe.reduce((s, r) => s + r.impressions, 0),
    };
  }
  const linkate = [...new Set(pagine.map(normalizzaPagina))];
  const risultato = {
    ultimo_giorno_con_dati: ultimo,
    finestre: f,
    sito,
    pagine: [],
    query_entrate_top10: [],
    query_entrate_top10_sotto_10_impressioni: 0,
  };
  if (!linkate.length) return risultato;

  const perPagina = {};
  for (const [nome, { dal, al }] of Object.entries(f)) {
    perPagina[nome] = await query(dal, al, 'page');
  }
  risultato.pagine = linkate.map((pagina) => {
    const [recenti, precedenti] = ['recenti', 'precedenti'].map((nome) =>
      aggrega(perPagina[nome].filter((r) => normalizzaPagina(r.keys[0]) === pagina)),
    );
    return {
      pagina,
      recenti,
      precedenti,
      delta_clic: recenti.clic - precedenti.clic,
      delta_impressioni: recenti.impressioni - precedenti.impressioni,
      guadagna_impressioni: recenti.impressioni > precedenti.impressioni,
      perde_clic: recenti.clic < precedenti.clic,
    };
  });

  // Coppie query × pagina linkata, varianti di host sommate.
  const coppie = {};
  for (const [nome, { dal, al }] of Object.entries(f)) {
    const gruppi = new Map();
    for (const r of await query(dal, al, 'query,page')) {
      const pagina = normalizzaPagina(r.keys[1]);
      if (!linkate.includes(pagina)) continue;
      const chiave = JSON.stringify([r.keys[0], pagina]);
      gruppi.set(chiave, [...(gruppi.get(chiave) ?? []), r]);
    }
    coppie[nome] = new Map([...gruppi].map(([chiave, righe]) => [chiave, aggrega(righe)]));
  }
  for (const [chiave, ora] of coppie.recenti) {
    const prima = coppie.precedenti.get(chiave);
    if (ora.posizione > 10 || (prima && prima.posizione <= 10)) continue;
    // Con meno di 10 impressioni in 28 giorni la posizione media non dice niente: si conta e basta.
    if (ora.impressioni < 10) {
      risultato.query_entrate_top10_sotto_10_impressioni += 1;
      continue;
    }
    const [q, pagina] = JSON.parse(chiave);
    risultato.query_entrate_top10.push({
      query: q,
      pagina,
      posizione: ora.posizione,
      posizione_prima: prima?.posizione ?? null,
      clic: ora.clic,
      impressioni: ora.impressioni,
    });
  }
  risultato.query_entrate_top10.sort((a, b) => b.impressioni - a.impressioni || a.posizione - b.posizione);
  return risultato;
}

function relEffettivo(rel) {
  const token = rel.toLowerCase().split(/\s+/);
  return ['sponsored', 'ugc', 'nofollow'].find((t) => token.includes(t)) ?? 'follow';
}

// I link della pagina `pagina` che puntano al sito, confrontati con la `destinazione` concordata. Quali sono e il
// loro testo li dice verifica-pagina.js, l'unico controllo dei link; qui il confronto per la revisione.
export function controllaLink({ html, pagina, destinazione }) {
  const attesa = normalizzaPagina(destinazione);
  const link_al_sito = findLinks(html, pagina).map(({ url, text, imageAlt, rel, context }) => ({
    href: url.href,
    host: url.hostname.toLowerCase(),
    percorso: normalizzaPagina(url.href),
    anchor: text || (imageAlt ? `[immagine: ${imageAlt}]` : '[immagine senza alt]'),
    rel: rel ?? '',
    rel_effettivo: relEffettivo(rel ?? ''),
    verso_destinazione: isOurSite(url.hostname) && normalizzaPagina(url.href) === attesa,
    contesto: context,
  }));
  return { link_al_sito, verso_destinazione: link_al_sito.some((l) => l.verso_destinazione) };
}

// DataFast chiama alcune sorgenti per nome invece che per dominio (visto il 2026-10-15: Google, LinkedIn, Bing,
// ChatGPT, Yahoo, DuckDuckGo, GitHub). Le altre arrivano come dominio (riccsartori.com, vercel.com).
const SORGENTI_PER_NOME = {
  google: 'google.com',
  linkedin: 'linkedin.com',
  bing: 'bing.com',
  chatgpt: 'chatgpt.com',
  yahoo: 'yahoo.com',
  duckduckgo: 'duckduckgo.com',
  github: 'github.com',
  facebook: 'facebook.com',
  x: 'x.com',
  twitter: 'twitter.com',
  reddit: 'reddit.com',
  youtube: 'youtube.com',
};

// `referrers(dal, al)` restituisce data[] di GET /analytics/referrers: [{referrer, visitors}].
// Finestre di 28 giorni completi fino a ieri: DataFast non ha il ritardo di GSC.
export async function misuraDatafast({ oggi, domini = [], referrers }) {
  const f = finestre(addDays(oggi, -1));
  const righe = {};
  for (const [nome, { dal, al }] of Object.entries(f)) righe[nome] = await referrers(dal, al);
  const somma = (nome, filtro = () => true) =>
    righe[nome].filter(filtro).reduce((s, r) => s + r.visitors, 0);
  const daDominio = (dominio) => (r) => {
    const nome = normalizeDomain(r.referrer);
    return inDomains(SORGENTI_PER_NOME[nome] ?? nome, [dominio]);
  };
  return {
    finestre: f,
    referrer_distinti: { recenti: righe.recenti.length, precedenti: righe.precedenti.length },
    visitatori_somma: { recenti: somma('recenti'), precedenti: somma('precedenti') },
    domini: [...new Set(domini.map(normalizeDomain))].map((dominio) => ({
      dominio,
      recenti: somma('recenti', daDominio(dominio)),
      precedenti: somma('precedenti', daDominio(dominio)),
    })),
  };
}

// ---------------------------------------------------------------------------------------------------------------
// Riga di comando. Le dipendenze esterne stanno qui, sovrascrivibili dall'ambiente (i test le sostituiscono).

// gsc.mjs vive fuori dal repo, non è versionato e porta con sé le credenziali OAuth (~/.config/ricc-os/…).
const GSC_BIN = process.env.GSC_BIN || '/root/ricc-os/integrazioni/gsc/gsc.mjs';
const GSC_SITE = process.env.GSC_SITE || 'sc-domain:dovevalatuaral.com';

class FonteMuta extends Error {}

function queryGsc(dal, al, dimensioni) {
  return new Promise((risolvi, rifiuta) => {
    execFile(
      process.execPath,
      [GSC_BIN, 'query', GSC_SITE, dal, al, dimensioni, '25000'],
      { maxBuffer: 256 * 1024 * 1024, timeout: 120_000 },
      (errore, stdout, stderr) => {
        if (errore) return rifiuta(new FonteMuta(`GSC non ha risposto: ${(stderr || errore.message).trim()}`));
        try {
          risolvi(JSON.parse(stdout));
        } catch {
          rifiuta(new FonteMuta(`GSC non ha risposto: output non JSON da ${GSC_BIN}`));
        }
      },
    );
  });
}

// La chiave DataFast: prima l'ambiente, poi il .env del checkout principale (fuori da git, assente nei worktree).
const DATAFAST_ENV_FILE = process.env.DATAFAST_ENV_FILE || '/root/ricc-os/projects/dovevalatuaral.com/.env';
const DATAFAST_API = process.env.DATAFAST_API || 'https://datafa.st/api/v1';

function chiaveDatafast() {
  if (process.env.DATAFAST_API_KEY) return process.env.DATAFAST_API_KEY;
  const chiave = existsSync(DATAFAST_ENV_FILE) ? parseEnv(readFileSync(DATAFAST_ENV_FILE, 'utf8')).DATAFAST_API_KEY : '';
  if (!chiave) throw new FonteMuta(`DataFast non ha risposto: DATAFAST_API_KEY assente (né nell'ambiente né in ${DATAFAST_ENV_FILE})`);
  return chiave;
}

function referrersDatafast(chiave) {
  return async (dal, al) => {
    const url = new URL(`${DATAFAST_API}/analytics/referrers`);
    url.search = new URLSearchParams({ startAt: dal, endAt: al, timezone: 'Europe/Rome', limit: '1000' });
    const res = await fetch(url, { headers: { Authorization: `Bearer ${chiave}` }, signal: AbortSignal.timeout(60_000) });
    const corpo = await res.text();
    if (!res.ok) throw new FonteMuta(`DataFast non ha risposto: HTTP ${res.status} ${corpo.slice(0, 200)}`);
    return JSON.parse(corpo).data ?? [];
  };
}

const oggiARoma = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome' }).format(new Date());
const DATA = /^\d{4}-\d{2}-\d{2}$/;

const comandi = {
  async date(oggi = oggiARoma()) {
    return calendario(oggi);
  },
  async gsc(oggi = oggiARoma(), ...pagine) {
    try {
      return await misuraGsc({ oggi, pagine, query: queryGsc });
    } catch (e) {
      throw e instanceof FonteMuta ? e : new FonteMuta(`GSC non ha risposto: ${e.message}`);
    }
  },
  async datafast(oggi = oggiARoma(), ...domini) {
    const chiave = chiaveDatafast();
    try {
      return await misuraDatafast({ oggi, domini, referrers: referrersDatafast(chiave) });
    } catch (e) {
      const messaggio = e instanceof FonteMuta ? e.message : `DataFast non ha risposto: ${e.message}`;
      throw new FonteMuta(messaggio.replaceAll(chiave, '***'));
    }
  },
  async link(pagina, destinazione) {
    if (!pagina || !destinazione) throw new Error('uso: link <url della pagina che linka> <nostra pagina concordata>');
    let pag;
    try {
      pag = await fetchPage(pagina, { timeoutMs: 30_000 });
    } catch (e) {
      throw new FonteMuta(`pagina non raggiungibile: ${e.cause?.code ?? e.message}`);
    }
    const html = pag.status >= 200 && pag.status < 300 ? pag.html : '';
    return { pagina, http: pag.status, url_finale: pag.finalUrl, ...controllaLink({ html, pagina: pag.finalUrl, destinazione }) };
  },
};

async function principale([comando, ...argomenti]) {
  if (!comandi[comando] || (argomenti[0] !== undefined && comando !== 'link' && !DATA.test(argomenti[0]))) {
    console.error('uso: date [oggi] | gsc <oggi> [pagina ...] | datafast <oggi> [dominio ...] | link <url> <destinazione>');
    return 1;
  }
  try {
    console.log(JSON.stringify(await comandi[comando](...argomenti), null, 2));
    return 0;
  } catch (e) {
    console.error(e instanceof FonteMuta ? e.message : `errore: ${e.message}`);
    return 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await principale(process.argv.slice(2));
}
