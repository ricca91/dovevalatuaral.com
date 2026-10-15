#!/usr/bin/env node
// Misure per la skill link-review: date, GSC 28 contro 28 giorni, DataFast per referrer, controllo dei link.
// Node puro, nessuna dipendenza. Uso e dipendenze esterne: vedi SKILL.md accanto a questo file.
//
//   node misure.mjs date [oggi]
//   node misure.mjs gsc <oggi> [pagina linkata ...]
//   node misure.mjs datafast <oggi> [dominio che linka ...]
//   node misure.mjs link <url della pagina che linka> <nostra pagina concordata>
//
// Stampa JSON su stdout. Se una fonte non risponde: messaggio su stderr, stdout vuoto, uscita 2.

import { execFile } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parseEnv } from 'node:util';

const GIORNO = 86_400_000;

function sposta(data, giorni) {
  const [a, m, g] = data.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, g) + giorni * GIORNO).toISOString().slice(0, 10);
}

export function calendario(oggi) {
  const settimanaDal = sposta(oggi, -7);
  return {
    oggi,
    settimana: { dal: settimanaDal, al: sposta(oggi, -1) },
    dataforseo_date_from: settimanaDal,
    followup_dovuto_se_invio_entro: settimanaDal,
    attesa_se_link_dopo: sposta(oggi, -60),
  };
}

// 28 giorni che finiscono in `ultimo` e i 28 prima.
function finestre(ultimo) {
  return {
    recenti: { dal: sposta(ultimo, -27), al: ultimo },
    precedenti: { dal: sposta(ultimo, -55), al: sposta(ultimo, -28) },
  };
}

// Una pagina del sito come percorso: senza host (www o no), query e frammento; slash finale tranne sui file (.html).
export function normalizzaPagina(indirizzo) {
  let percorso = new URL(indirizzo, 'https://www.dovevalatuaral.com').pathname.replace(/\/index\.html$/, '/');
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
  const giorni = await query(sposta(oggi, -10), oggi, 'date');
  if (!giorni.length) throw new Error(`nessun dato GSC tra ${sposta(oggi, -10)} e ${oggi}`);
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

// Host che contano come "il sito": il dominio con i sottodomini e il vecchio dominio, che fa 301 verso www.
const NOSTRO = /(^|\.)dovevalatuaral\.com$/;
const LEGACY = 'jethr.riccsartori.com';

const ENTITA = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', agrave: 'à', egrave: 'è', eacute: 'é', igrave: 'ì', ograve: 'ò', ugrave: 'ù' };
const decodifica = (s) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (e, n) =>
    n[0] === '#' ? String.fromCodePoint(Number(n[1].toLowerCase() === 'x' ? `0${n.slice(1)}` : n.slice(1))) : ENTITA[n.toLowerCase()] ?? e,
  );
const testo = (html) =>
  decodifica(html.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .replace(/ ([,.;:!?])/g, '$1')
    .trim();

function attributo(attributi, nome) {
  const m = attributi.match(new RegExp(`\\b${nome}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return m ? decodifica(m[1] ?? m[2] ?? m[3]) : null;
}

const BLOCCO = 'p|li|td|th|div|blockquote|h[1-6]|dd|dt|figcaption|section|article';

// Il testo del blocco (paragrafo, voce di lista, cella…) che contiene il link.
function contesto(html, inizio, fine) {
  const aperture = [...html.slice(0, inizio).matchAll(new RegExp(`<(?:${BLOCCO})\\b[^>]*>`, 'gi'))];
  const da = aperture.length ? aperture.at(-1).index + aperture.at(-1)[0].length : Math.max(0, inizio - 300);
  const chiusura = html.slice(fine).match(new RegExp(`</(?:${BLOCCO})\\s*>`, 'i'));
  const a = chiusura ? fine + chiusura.index : fine + 300;
  return testo(html.slice(da, a)).slice(0, 500);
}

function relEffettivo(rel) {
  const token = rel.toLowerCase().split(/\s+/);
  return ['sponsored', 'ugc', 'nofollow'].find((t) => token.includes(t)) ?? 'follow';
}

// I link della pagina `pagina` che puntano al sito, confrontati con la `destinazione` concordata.
export function controllaLink({ html, pagina, destinazione }) {
  const attesa = normalizzaPagina(destinazione);
  const link_al_sito = [];
  for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi)) {
    const href = attributo(m[1], 'href');
    if (!href) continue;
    let url;
    try {
      url = new URL(href, pagina);
    } catch {
      continue;
    }
    const host = url.hostname.toLowerCase();
    if (!NOSTRO.test(host) && host !== LEGACY) continue;
    const alt = m[2].match(/<img\b[^>]*>/i) ? attributo(m[2].match(/<img\b[^>]*>/i)[0], 'alt') : null;
    const rel = attributo(m[1], 'rel') ?? '';
    link_al_sito.push({
      href: url.href,
      host,
      percorso: normalizzaPagina(url.href),
      anchor: testo(m[2]) || (alt ? `[immagine: ${alt}]` : '[immagine senza alt]'),
      rel,
      rel_effettivo: relEffettivo(rel),
      verso_destinazione: NOSTRO.test(host) && normalizzaPagina(url.href) === attesa,
      contesto: contesto(html, m.index, m.index + m[0].length),
    });
  }
  return { link_al_sito, verso_destinazione: link_al_sito.some((l) => l.verso_destinazione) };
}

// Dominio radice come lo scrive Airtable: senza protocollo, percorso né www, minuscolo.
export function normalizzaDominio(dominio) {
  const host = /^[a-z]+:\/\//i.test(dominio) ? new URL(dominio).hostname : dominio.split('/')[0];
  return host.toLowerCase().replace(/^www\./, '');
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
  const f = finestre(sposta(oggi, -1));
  const righe = {};
  for (const [nome, { dal, al }] of Object.entries(f)) righe[nome] = await referrers(dal, al);
  const somma = (nome, filtro = () => true) =>
    righe[nome].filter(filtro).reduce((s, r) => s + r.visitors, 0);
  const daDominio = (dominio) => (r) => {
    const nome = r.referrer.toLowerCase().replace(/^www\./, '');
    const ref = SORGENTI_PER_NOME[nome] ?? nome;
    return ref === dominio || ref.endsWith(`.${dominio}`);
  };
  return {
    finestre: f,
    referrer_distinti: { recenti: righe.recenti.length, precedenti: righe.precedenti.length },
    visitatori_somma: { recenti: somma('recenti'), precedenti: somma('precedenti') },
    domini: [...new Set(domini.map(normalizzaDominio))].map((dominio) => ({
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
    let res;
    try {
      res = await fetch(pagina, {
        redirect: 'follow',
        headers: { 'User-Agent': 'Mozilla/5.0 (link-review di dovevalatuaral.com)', Accept: 'text/html' },
        signal: AbortSignal.timeout(30_000),
      });
    } catch (e) {
      throw new FonteMuta(`pagina non raggiungibile: ${e.cause?.code ?? e.message}`);
    }
    const html = res.ok ? await res.text() : '';
    return { pagina, http: res.status, url_finale: res.url, ...controllaLink({ html, pagina: res.url, destinazione }) };
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
