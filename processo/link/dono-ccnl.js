// Il pezzo deterministico della skill link-dono (.claude/skills/link-dono): confronta le cifre lette sulla
// pagina di un prospect con il dataset dei minimi del sito e le classifica rispetto a due date, oggi e il
// giorno in cui Riccardo invierà la mail.
const path = require('node:path');
const R = require(path.join(__dirname, '../../prototipo/retribuzione-ccnl.js'));
const G = require(path.join(__dirname, '../../prototipo/genera-pagine-ccnl.js'));
const {soglie} = require(path.join(__dirname, '../../prototipo/motore.js'));

/* Le tabelle del dataset partono dalla tranche in vigore quando il sito le ha trascritte. Molte pagine da
   correggere sono ferme a tranche più vecchie: per riconoscerle (e solo per quello: il valore nuovo esce
   sempre dal dataset) si ricostruiscono all'indietro con gli aumenti dell'accordo che le ha decise.
   Commercio, art. 213 dell'accordo di rinnovo del 22 marzo 2024: aumenti per decorrenza, dal 1/4/2023.
   La tranche del 1/4/2023 viene dal protocollo straordinario del 12/12/2022 e fino a marzo 2024 era pagata come
   acconto, a parte; ad aprile 2024 è entrata nella paga base. Il totale si ricostruisce sottraendo, la paga base
   prima di aprile 2024 no: da lì in giù la voce si toglie. La tabella prima del 1/4/2023 si sa solo fin quando
   vale, non da quando: la decorrenza 2020-01-01 è un'etichetta, e il titolo lo dice.
   Riscontri su tabelle pubblicate da terzi, 15/10/2026: marzo 2025 e prima di aprile 2023 tornano entro un
   centesimo su quasi tutti i livelli (ARROTONDAMENTO), il Quadro e qualche livello no: lì la cifra resta non
   verificabile, che è il lato sicuro. */
const ART_213 = {
  '2023-04-01': {Q: 52.09, 1: 46.92, 2: 40.59, 3: 34.69, 4: 30.00, 5: 27.10, 6: 24.33, 7: 20.83, OV1: 28.32, OV2: 23.78},
  '2024-04-01': {Q: 121.54, 1: 109.48, 2: 94.70, 3: 80.94, 4: 70.00, 5: 63.24, 6: 56.78, 7: 48.61, OV1: 66.08, OV2: 55.48},
  '2025-03-01': {Q: 52.09, 1: 46.92, 2: 40.59, 3: 34.69, 4: 30.00, 5: 27.10, 6: 24.33, 7: 20.83, OV1: 28.32, OV2: 23.78},
  '2025-11-01': {Q: 60.77, 1: 54.74, 2: 47.35, 3: 40.47, 4: 35.00, 5: 31.62, 6: 28.39, 7: 24.31, OV1: 33.04, OV2: 27.74},
};
const STORICO = {
  'terziario-confcommercio-h011': {
    fonte: {
      titolo: 'Accordo di rinnovo del CCNL Terziario, 22 marzo 2024 — art. 213',
      url: 'https://ce-mu.it/rapportolavoro/contratti/cms_magazine/uploads/CommercioConfcommercio_AccordoRinnovo_22.3.2024.pdf',
      archivio: 'processo/dati/fonti/accordo-rinnovo-terziario-2024-03-22.pdf',
    },
    // [aumento che chiude la tabella, decorrenza della tabella prima, la paga base di quella tabella si ricostruisce?]
    passi: [
      ['2025-11-01', '2025-03-01', true],
      ['2025-03-01', '2024-04-01', true],
      ['2024-04-01', '2023-04-01', false],
      ['2023-04-01', '2020-01-01', false],
    ],
    aumenti: ART_213,
  },
};

function tabelle(ccnl, sezione) {
  const contratto = R.trovaContratto(ccnl);
  const sezioni = (contratto.sezioni || []).map(s => s.id);
  if (sezioni.length && !sezioni.includes(sezione))
    throw new RangeError(`${ccnl} ha più sezioni, indicane una: ${sezioni.join(', ')}`);
  const profilo = sezione ? contratto.sezioni.find(s => s.id === sezione) : contratto;
  const storico = STORICO[ccnl];
  if (!storico) return profilo.tabelle;
  const ricostruite = [];
  let dopo = profilo.tabelle[0];
  for (const [decorrenzaAumento, decorrenza, conPagaBase] of storico.passi) {
    if (dopo.decorrenza !== decorrenzaAumento) break;
    const aumenti = storico.aumenti[decorrenzaAumento];
    const meno = (importo, codice) => (cent(importo) - cent(aumenti[codice])) / 100;
    dopo = {
      decorrenza, titolo: `ricostruita dall'art. 213: in vigore fino al ${giorno(ieri(decorrenzaAumento))}`,
      ricostruita: storico.fonte,
      livelli: dopo.livelli.map(l => ({...l, totale: meno(l.totale, l.codice),
        voci: l.voci.flatMap(v => (v.id !== 'pagaBase' ? [v] : conPagaBase ? [{...v, importo: meno(v.importo, l.codice)}] : []))})),
    };
    ricostruite.unshift(dopo);
  }
  return [...ricostruite, ...profilo.tabelle];
}

const giorno = iso => iso.split('-').reverse().map(Number).join('/');

// Una correzione regge solo su una fonte delle parti firmatarie, o sul testo che hanno sottoscritto. Il dataset
// lo scrive in `parte` ("organizzazione sindacale firmataria", "testo dell'accordo sottoscritto dalle parti",
// "banca dati indipendente, non firmataria").
function firmata(fonte) {
  const parte = fonte.parte || '';
  return {...fonte, firmataria: /firmatari|sottoscritt/i.test(parte) && !/non firmatari/i.test(parte)};
}

function fonteDi(contratto) {
  const {titolo, parte, url, archivio} = contratto.fonte;
  return firmata({titolo, parte, url, archivio});
}

const STATI = ['ancora vero', 'cambiato', 'superato', 'non verificabile'];

// Ciò che il dataset non contiene (una tantum, date della tredicesima, scadenze) lo controlla l'agente sulla
// fonte primaria e lo passa già classificato: qui si pretende solo l'URL della fonte e chi la pubblica.
function controllataAMano(affermazione) {
  if (!STATI.includes(affermazione.stato))
    return {...affermazione, stato: 'non verificabile', motivo: `stato sconosciuto: ${affermazione.stato}`};
  if (!affermazione.fonte?.url)
    return {...affermazione, stato: 'non verificabile', motivo: 'manca l’URL della fonte primaria'};
  return {...affermazione, fonte: firmata(affermazione.fonte)};
}

const NON_VERIFICABILE = 'nessun valore della fonte corrisponde: base diversa (terzo elemento provinciale, scatti, '
  + 'part-time…) o errore da spiegare';

function importoDi(tabella, codice, voce) {
  const livello = tabella.livelli.find(l => l.codice === codice);
  if (!livello) return null;
  if (voce === 'totale') return livello.totale;
  return livello.voci.find(v => v.id === voce)?.importo ?? null;
}

const cent = euro => Math.round(euro * 100);
// Fino a due centesimi di differenza sono arrotondamento: Filcams pubblica i totali per livello, l'accordo
// gli aumenti a parametro, e chi somma dall'accordo può trovarsi un centesimo sopra o sotto.
const ARROTONDAMENTO = 2;
// Una cifra che la pagina dichiara approssimata ("circa 1.618 euro") vale fino all'euro: le tranche distano
// almeno venti euro, quindi non si confondono.
const ALL_EURO = 99;

// Dove la cifra della pagina compare nella fonte: il totale di una tabella, una sua voce, o il totale meno
// una sola voce (la voce che la pagina ha dimenticato). Tiene solo le corrispondenze più strette.
function corrispondenze(elenco, codice, importo, tolleranza) {
  const trovate = [];
  const prova = (atteso, trovata) => {
    const scarto = cent(importo) - cent(atteso);
    if (Math.abs(scarto) <= tolleranza) trovate.push({...trovata, scarto});
  };
  for (const tabella of elenco) {
    const livello = tabella.livelli.find(l => l.codice === codice);
    if (!livello) continue;
    prova(livello.totale, {tabella, voce: 'totale'});
    for (const voce of livello.voci) {
      prova(voce.importo, {tabella, voce: voce.id});
      if (voce.importo > 0)
        prova(livello.totale - voce.importo, {tabella, voce: 'totale', manca: {voce: voce.id, nome: voce.nome, importo: voce.importo}});
    }
  }
  const minimo = Math.min(...trovate.map(t => Math.abs(t.scarto)));
  return trovate.filter(t => Math.abs(t.scarto) === minimo);
}

// Un aumento è un fatto datato: la differenza tra il totale della tranche e quello della tabella prima.
// Non scade; può solo essere giusto, attribuito alla tranche sbagliata, o non spiegabile.
function classificaAumento(affermazione, elenco, fonte) {
  if (!affermazione.decorrenza)
    return {...affermazione, stato: 'non verificabile', fonte, motivo: 'aumento senza decorrenza: non si sa quale tranche'};
  const tranche = elenco.slice(1).map((tabella, i) => ({
    decorrenza: tabella.decorrenza, voce: 'aumento',
    importo: (cent(importoDi(tabella, affermazione.livello, 'totale')) - cent(importoDi(elenco[i], affermazione.livello, 'totale'))) / 100,
    ...(tabella.ricostruita ? {ricostruito: true} : {}),
  }));
  const vicino = t => Math.abs(cent(t.importo) - cent(affermazione.importo)) <= ARROTONDAMENTO;
  const sua = tranche.find(t => t.decorrenza === affermazione.decorrenza);
  if (sua && vicino(sua)) return {...affermazione, stato: 'ancora vero', fonte};
  const altra = tranche.find(vicino);
  if (sua && altra) {
    return {...affermazione, stato: 'cambiato', atteso: sua, fonte,
      motivo: `è l'aumento della tranche del ${giorno(altra.decorrenza)}`};
  }
  return {...affermazione, stato: 'non verificabile', fonte,
    motivo: sua ? 'l’aumento non corrisponde a nessuna tranche della fonte' : `nessuna tranche dal ${giorno(affermazione.decorrenza)} nella fonte`};
}

function classificaUna(affermazione, {ccnl, sezione, oggi, invio}) {
  const contratto = R.trovaContratto(ccnl);
  const elenco = tabelle(ccnl, sezione);
  const vigenteAl = data => elenco.filter(t => t.decorrenza <= data).at(-1) || null;
  const fonte = fonteDi(contratto);
  if (!elenco.some(t => t.livelli.some(l => l.codice === affermazione.livello)))
    return {...affermazione, stato: 'non verificabile', fonte, motivo: `livello ${affermazione.livello} non presente nella fonte`};
  if (affermazione.voce === 'aumento') return classificaAumento(affermazione, elenco, fonte);
  const dichiarata = affermazione.decorrenza ? vigenteAl(affermazione.decorrenza) : null;
  const allInvio = vigenteAl(invio);
  const trovate = corrispondenze(elenco, affermazione.livello, affermazione.importo,
    affermazione.approssimato ? ALL_EURO : ARROTONDAMENTO);
  // Una cifra può stare in più tabelle (le voci che le tranche non toccano): vince la tabella della data che
  // la pagina dichiara, poi quella in vigore all'invio, poi la più recente.
  const trovata = trovate.find(t => t.tabella === dichiarata)
    || trovate.find(t => t.tabella === allInvio) || trovate.at(-1);
  if (!trovata) return {...affermazione, stato: 'non verificabile', fonte, motivo: NON_VERIFICABILE};
  const valore = tabella => ({decorrenza: tabella.decorrenza, voce: trovata.voce,
    importo: importoDi(tabella, affermazione.livello, trovata.voce), ...(tabella.ricostruita ? {ricostruito: true} : {})});
  affermazione = {...affermazione, voce: trovata.voce, ...(trovata.scarto ? {scarto: trovata.scarto / 100} : {}),
    ...(trovata.tabella.ricostruita ? {riconosciutoDa: trovata.tabella.ricostruita} : {})};

  const dopo = elenco.find(t => t.decorrenza > trovata.tabella.decorrenza);
  if (dichiarata && trovata.tabella !== dichiarata) {
    return {...affermazione, stato: 'cambiato', atteso: valore(dichiarata), fonte,
      motivo: `è il valore in vigore dal ${giorno(trovata.tabella.decorrenza)}`};
  }
  if (trovata.manca) {
    const cambiato = {...affermazione, stato: 'cambiato', atteso: valore(trovata.tabella), manca: trovata.manca, fonte};
    if (!affermazione.vigente || trovata.tabella === allInvio) return cambiato;
    return {...cambiato, dal: dopo.decorrenza, nuovo: valore(allInvio)};
  }
  if (!affermazione.vigente || trovata.tabella === allInvio) {
    const prossima = elenco.find(t => t.decorrenza > allInvio.decorrenza);
    return {...affermazione, stato: 'ancora vero', prossima: prossima ? valore(prossima) : null, fonte};
  }
  if (trovata.tabella.decorrenza > invio) {
    return {...affermazione, stato: 'cambiato', atteso: valore(allInvio), fonte,
      motivo: `è il valore che entra in vigore dal ${giorno(trovata.tabella.decorrenza)}`};
  }
  return {
    ...affermazione,
    stato: 'superato',
    dal: dopo.decorrenza,
    veroOggi: trovata.tabella === vigenteAl(oggi),
    nuovo: valore(allInvio),
    fonte,
  };
}

function classifica({ccnl, sezione = null, oggi, invio = oggi, affermazioni}) {
  return affermazioni.map(a => ('stato' in a ? controllataAMano(a) : classificaUna(a, {ccnl, sezione, oggi, invio})));
}

const euro = importo => `${importo.toLocaleString('it-IT',
  {minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always'})} €`;
const ieri = iso => new Date(Date.parse(`${iso}T00:00:00Z`) - 864e5).toISOString().slice(0, 10);

// La cifra da proporre deve essere pubblicata dalla fonte: una tabella ricostruita all'indietro serve a
// riconoscere la cifra vecchia, non a sostituirla.
function solida(c) {
  const proposta = c.nuovo || c.atteso;
  return (c.stato === 'superato' || c.stato === 'cambiato') && c.fonte?.firmataria === true && !proposta?.ricostruito;
}

function dettaglio(c) {
  const valore = v => `${euro(v.importo)} (${v.voce}) dal ${giorno(v.decorrenza)}`;
  const parti = [];
  if (c.stato === 'superato' && !c.veroOggi) parti.push(`era il valore in vigore fino al ${giorno(ieri(c.dal))}`);
  if (c.manca) parti.push(`manca ${c.manca.nome} (${euro(c.manca.importo)})`);
  if (c.motivo) parti.push(c.motivo);
  if (c.atteso) parti.push(`la fonte dice ${valore(c.atteso)}`);
  if (c.nuovo) parti.push(`all’invio vale ${valore(c.nuovo)}`);
  if (c.nota) parti.push(c.nota);
  return parti.join('; ');
}

function etichetta(c, inMail) {
  if (c.stato === 'superato')
    return `superato dal ${giorno(c.dal)}${c.veroOggi ? `, vero fino al ${giorno(ieri(c.dal))}` : ''}`;
  if (c.stato === 'ancora vero' || inMail) return c.stato;
  return `${c.stato}, fuori dalla mail`;
}

/* Il cancello: una correzione entra nel foglio solo se è superata o cambiata secondo una fonte delle parti
   firmatarie. Tutto il resto resta fuori dalla mail ma entra nella Verifica, ognuna con l'URL della fonte
   consultata. Sotto le due correzioni solide la pagina si salta. */
function cancello(classificate, {oggi, invio = oggi}) {
  const foglio = classificate.filter(solida);
  const fuori = classificate.filter(c => !solida(c) && c.stato !== 'ancora vero');
  const decisione = foglio.length >= 2 ? 'scrivi' : 'salta';
  const righe = classificate.map(c => {
    const fonti = [c.fonte?.url, c.riconosciutoDa?.url].filter(Boolean).join(' + ') || 'nessuna';
    const testo = dettaglio(c);
    return `[${etichetta(c, foglio.includes(c))}] «${c.frase ?? c.id}»${testo ? ` → ${testo}` : ''} — fonte: ${fonti}`;
  });
  // Prima della tranche la mail sarebbe falsa: una cifra ancora vera oggi diventa superata solo dal suo `dal`,
  // e una cifra proposta che entra in vigore dopo oggi non è ancora quella giusta.
  const nonPrimaDel = foglio.flatMap(c => [c.veroOggi ? c.dal : null, (c.nuovo || c.atteso)?.decorrenza])
    .filter(data => data && data > oggi).sort().at(-1) || null;
  const intestazione = `link-dono, controllo del ${giorno(oggi)}, invio previsto dal ${giorno(invio)}: `
    + `${foglio.length} correzioni solide su ${classificate.length} affermazioni → ${decisione}`
    + (nonPrimaDel ? `. Non inviare prima del ${giorno(nonPrimaDel)}, e prima di inviare ricontrolla la pagina: `
      + 'se l’hanno già aggiornata, la mail non serve' : '');
  return {decisione, foglio, fuori, nonPrimaDel, verifica: [intestazione, ...righe].join('\n')};
}

/* Il netto per livello prima e dopo una tranche: il complemento che chi pubblica il lordo non ha. Esce da
   stima(), la stessa funzione delle pagine /minimi-ccnl/, quindi con il loro profilo: tempo pieno, zero
   scatti, nessun superminimo, comune di Milano, nessun familiare a carico. */
const ORIGINE = 'https://www.dovevalatuaral.com';
const SALTI_MILANO = soglie({comune: 'F205', nucleo: []});

function nettoPrimaDopo(ccnl, {prima, dopo, sezione = null, livelli = null}) {
  const seo = G.CONTRATTI_SEO.find(c => c.id === ccnl);
  const pagina = codice => {
    if (!seo) return null;
    const conPagina = (seo.livelli || []).includes(codice) && (!seo.sezioneLivelli || seo.sezioneLivelli === sezione);
    return `${ORIGINE}${G.rottaTabella(seo)}${conPagina ? `${seo.slugLivello(codice)}/` : ''}`;
  };
  const codici = R.tabellaVigente(ccnl, dopo, sezione).livelli.map(l => l.codice)
    .filter(codice => !livelli || livelli.includes(codice));
  const righe = codici.map(codice => {
    const a = G.stima(ccnl, sezione, codice, prima), b = G.stima(ccnl, sezione, codice, dopo);
    const soglia = SALTI_MILANO.find(s => a.composta.ral < s.ral && s.ral <= b.composta.ral);
    return {
      codice,
      nome: R.trovaLivello(ccnl, codice, dopo, sezione).nome,
      minimo: {prima: a.composta.baseMensile, dopo: b.composta.baseMensile},
      ral: {prima: a.composta.ral, dopo: b.composta.ral},
      nettoAnnuo: {prima: a.nettoAnnuo, dopo: b.nettoAnnuo},
      nettoMensile: {prima: a.nettoMensile, dopo: b.nettoMensile},
      mensilita: b.composta.mensilita,
      pagina: pagina(codice),
      salto: soglia ? `soglia a ${euro(soglia.ral)} di RAL: ${soglia.causa}` : null,
    };
  });
  const tabella = seo ? `${ORIGINE}${G.rottaTabella(seo)}` : null;
  return {ccnl, sezione, prima, dopo, righe, testo: testoNetto({ccnl, dopo, righe, tabella})};
}

// Per il corpo della mail: testo semplice, una riga per livello, le ipotesi scritte. Le cifre non si ricopiano a
// mano. Un solo link, il più specifico: la pagina del livello se il livello è uno, altrimenti la tabella.
function testoNetto({ccnl, dopo, righe, tabella}) {
  const freccia = ({prima, dopo: poi}) => `${euro(prima).slice(0, -2)} → ${euro(poi)}`;
  const mensilita = [...new Set(righe.map(r => r.mensilita))].join(' o ');
  const link = righe.length === 1 && righe[0].pagina ? righe[0].pagina : tabella;
  return [
    `Netto per livello, CCNL ${R.trovaContratto(ccnl).nome}, prima e dopo la tranche dal ${giorno(dopo)}`,
    `(tempo pieno, nessuno scatto di anzianità, residenza a Milano, nessun familiare a carico; netto annuo diviso per ${mensilita} mensilità)`,
    ...righe.map(r => `${r.nome}: lordo ${freccia(r.minimo)} al mese, netto ${freccia(r.nettoMensile)} al mese`
      + (r.salto ? ` (${r.salto}; il netto cresce meno del lordo)` : '')),
    ...(link ? [`Con la propria anzianità e il superminimo: ${link}`] : []),
  ].join('\n');
}

// La skill parla con gli slug del sito (`commercio`), il dataset con gli id (`terziario-confcommercio-h011`).
function idDi(ccnl) {
  return G.CONTRATTI_SEO.find(c => c.slug === ccnl)?.id || R.trovaContratto(ccnl).id;
}

// Cosa sa la fonte, per leggere la pagina del prospect con gli stessi codici di livello e le stesse voci.
function valori(ccnl, sezione = null) {
  const contratto = R.trovaContratto(ccnl);
  return {
    ccnl, sezione, nome: contratto.nome, fonte: fonteDi(contratto),
    accordo: contratto.fonteAccordo ? firmata({...contratto.fonteAccordo}) : null,
    sezioni: R.sezioni(ccnl).map(s => s.id),
    tabelle: tabelle(ccnl, sezione).map(t => ({
      decorrenza: t.decorrenza, titolo: t.titolo, ...(t.ricostruita ? {ricostruita: t.ricostruita.url} : {}),
      livelli: t.livelli.map(l => ({codice: l.codice, nome: l.nome, totale: l.totale,
        voci: Object.fromEntries(l.voci.map(v => [v.id, v.importo])), scatto: l.scatto ?? null})),
    })),
  };
}

module.exports = {classifica, cancello, nettoPrimaDopo, valori};

const USO = `Uso:
  node processo/link/dono-ccnl.js valori <ccnl> [--sezione <id>]
      → JSON: fonte (con firmataria sì/no), tabelle per decorrenza con totale, voci e scatto per livello
  node processo/link/dono-ccnl.js classifica <affermazioni.json>
      {"ccnl": "commercio", "sezione": null, "oggi": "AAAA-MM-GG", "invio": "AAAA-MM-GG", "affermazioni": [...]}
      → JSON: affermazioni classificate, decisione del cancello, foglio, fuori, nonPrimaDel, verifica
  node processo/link/dono-ccnl.js netto <ccnl> <prima> <dopo> [--sezione <id>] [--livelli 3,4,5] [--json]
      → testo del netto per livello da incollare nella mail (JSON con --json)`;

function opzione(argomenti, nome) {
  const i = argomenti.indexOf(nome);
  return i === -1 ? null : argomenti[i + 1];
}

if (require.main === module) {
  const [comando, ...argomenti] = process.argv.slice(2);
  if (comando === 'valori' && argomenti[0]) {
    console.log(JSON.stringify(valori(idDi(argomenti[0]), opzione(argomenti, '--sezione')), null, 2));
  } else if (comando === 'classifica' && argomenti[0]) {
    const input = JSON.parse(require('node:fs').readFileSync(argomenti[0], 'utf8'));
    const ccnl = idDi(input.ccnl);
    const affermazioni = classifica({...input, ccnl});
    const esito = cancello(affermazioni, input);
    console.log(JSON.stringify({ccnl, oggi: input.oggi, invio: input.invio || input.oggi, affermazioni,
      decisione: esito.decisione, foglio: esito.foglio.map(c => c.id), fuori: esito.fuori.map(c => c.id),
      nonPrimaDel: esito.nonPrimaDel, verifica: esito.verifica}, null, 2));
  } else if (comando === 'netto' && argomenti.length >= 3) {
    const [ccnl, prima, dopo] = argomenti;
    const livelli = opzione(argomenti, '--livelli')?.split(',') || null;
    const risultato = nettoPrimaDopo(idDi(ccnl), {prima, dopo, sezione: opzione(argomenti, '--sezione'), livelli});
    console.log(argomenti.includes('--json') ? JSON.stringify(risultato, null, 2) : risultato.testo);
  } else {
    console.error(USO);
    process.exit(2);
  }
}
