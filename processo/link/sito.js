// Il sito per gli attrezzi backlink: l'origine canonica, i domini che contano come nostri, come si scrive un dominio.
// Un solo posto: lo usano verifica-pagina.js, misure.mjs, aggrega.js e dono-ccnl.js.

const ORIGIN = 'https://www.dovevalatuaral.com';
const DOMAIN = 'dovevalatuaral.com';
// Il dominio di lancio: fa 301 verso www, quindi un suo link è già nostro.
const LEGACY_DOMAIN = 'jethr.riccsartori.com';

// Dominio come lo scrive Airtable: senza protocollo, percorso né www, minuscolo. Accetta un URL, un host o host/percorso.
function normalizeDomain(input) {
  const host = /^[a-z]+:\/\//i.test(input) ? new URL(input).hostname : String(input).split('/')[0];
  return host.toLowerCase().replace(/^www\./, '');
}

// Il dominio è uno della lista o un suo sottodominio.
function inDomains(domain, list = []) {
  const normalized = normalizeDomain(domain);
  return list.some(entry => normalized === entry || normalized.endsWith(`.${entry}`));
}

const isOurs = host => inDomains(host, [DOMAIN, LEGACY_DOMAIN]);
const isOurSite = host => inDomains(host, [DOMAIN]);

module.exports = {ORIGIN, DOMAIN, LEGACY_DOMAIN, normalizeDomain, inDomains, isOurs, isOurSite};
