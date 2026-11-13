// Date di calendario per gli attrezzi backlink, come stringhe AAAA-MM-GG in UTC (nessun fuso, nessuna ora).

const DAY_MS = 86_400_000;

function addDays(iso, days) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day) + days * DAY_MS).toISOString().slice(0, 10);
}

// AAAA-MM-GG → G/M/AAAA, come nelle Note e nella Verifica.
const formatDay = iso => iso.split('-').reverse().map(Number).join('/');

// GG/MM/AAAA (dalle Note) o AAAA-MM-GG → AAAA-MM-GG.
function parseDay(value) {
  const m = String(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) throw new RangeError(`data non valida: ${value}`);
  return value;
}

module.exports = {addDays, formatDay, parseDay};
