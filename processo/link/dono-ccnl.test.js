const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {execFile} = require('node:child_process');
const {promisify} = require('node:util');
const {classifica, cancello, nettoPrimaDopo} = require('./dono-ccnl.js');

// Importi attesi presi dalle tabelle Filcams CGIL (firmataria) e dall'art. 213 dell'accordo
// di rinnovo del 22 marzo 2024, non ricalcolati dal codice.
const COMMERCIO = 'terziario-confcommercio-h011';
const FILCAMS = 'https://www.filcams.cgil.it/page/confcommercio_terziario';
const OGGI = '2026-10-15';
const INVIO = '2026-11-03';

test('un minimo vero oggi ma sostituito dalla tranche del 1° novembre è superato da quella data', () => {
  const [a] = classifica({
    ccnl: COMMERCIO, oggi: OGGI, invio: INVIO,
    affermazioni: [{id: 'A1', frase: 'IV livello: 1.783,75 €', livello: '4', importo: 1783.75, vigente: true}],
  });
  assert.equal(a.stato, 'superato');
  assert.equal(a.dal, '2026-11-01');
  assert.equal(a.veroOggi, true);
  assert.deepEqual(a.nuovo, {decorrenza: '2026-11-01', voce: 'totale', importo: 1818.75});
  assert.equal(a.fonte.url, FILCAMS);
});

test('il minimo in vigore il giorno dell’invio è ancora vero, e dice quando arriva la tranche dopo', () => {
  const [a] = classifica({
    ccnl: COMMERCIO, oggi: OGGI, invio: INVIO,
    affermazioni: [{id: 'A1', frase: '3° livello dal 1/11/2026: 2.024,38 €', livello: '3', importo: 2024.38, vigente: true}],
  });
  assert.equal(a.stato, 'ancora vero');
  assert.deepEqual(a.prossima, {decorrenza: '2027-02-01', voce: 'totale', importo: 2070.63});
});

test('una cifra che non corrisponde a nessun valore della fonte non è una correzione: non verificabile', () => {
  // Confcommercio Vicenza stampa il terzo elemento provinciale (6,20 €) al posto di quello nazionale (2,07 €):
  // il suo totale è giusto per Vicenza, non sbagliato.
  const [a] = classifica({
    ccnl: COMMERCIO, oggi: OGGI, invio: INVIO,
    affermazioni: [{id: 'A1', frase: '4 | 1.257,46 | 524,22 | 6,2 | 1.787,88', livello: '4', importo: 1787.88,
      decorrenza: '2025-11-01', vigente: false}],
  });
  assert.equal(a.stato, 'non verificabile');
  assert.match(a.motivo, /nessun valore/);
  assert.equal(a.fonte.url, FILCAMS);
});

test('un totale a cui manca esattamente una voce della fonte è cambiato, e la voce mancante è nominata', () => {
  // Totale del 4° livello dal 1/11/2025 stampato senza il terzo elemento nazionale: 1.257,46 + 524,22.
  const [a] = classifica({
    ccnl: COMMERCIO, oggi: OGGI, invio: INVIO,
    affermazioni: [{id: 'A1', frase: 'IV | 1257,46 € | - | 1781,68 €', livello: '4', importo: 1781.68,
      decorrenza: '2025-11-01', vigente: false}],
  });
  assert.equal(a.stato, 'cambiato');
  assert.deepEqual(a.atteso, {decorrenza: '2025-11-01', voce: 'totale', importo: 1783.75});
  assert.deepEqual(a.manca, {voce: 'terzoElemento', nome: 'Terzo elemento nazionale', importo: 2.07});
});

test('se la cifra cambiata è presentata come in vigore, la correzione porta il valore del giorno dell’invio', () => {
  const [a] = classifica({
    ccnl: COMMERCIO, oggi: OGGI, invio: INVIO,
    affermazioni: [{id: 'A1', frase: 'Decorrenza: 1 novembre 2025 — IV | 1781,68 €', livello: '4', importo: 1781.68,
      decorrenza: '2025-11-01', vigente: true}],
  });
  assert.equal(a.stato, 'cambiato');
  assert.equal(a.manca.voce, 'terzoElemento');
  assert.equal(a.dal, '2026-11-01');
  assert.deepEqual(a.nuovo, {decorrenza: '2026-11-01', voce: 'totale', importo: 1818.75});
});

test('una cifra datata e giusta per la sua data resta vera anche dopo la tranche: la storia non scade', () => {
  // «Le tabelle di novembre 2025» in una notizia del 21/11/2025: non dice che valgono ancora.
  const [a] = classifica({
    ccnl: COMMERCIO, oggi: OGGI, invio: INVIO,
    affermazioni: [{id: 'A1', frase: 'dal 1° novembre 2025 il 4° livello: 1.783,75 €', livello: '4', importo: 1783.75,
      decorrenza: '2025-11-01', vigente: false}],
  });
  assert.equal(a.stato, 'ancora vero');
});

test('una cifra giusta attribuita alla data sbagliata è cambiata', () => {
  const [a] = classifica({
    ccnl: COMMERCIO, oggi: OGGI, invio: INVIO,
    affermazioni: [{id: 'A1', frase: 'dal 1° novembre 2026 il 4° livello sale a 1.783,75 €', livello: '4',
      importo: 1783.75, decorrenza: '2026-11-01', vigente: false}],
  });
  assert.equal(a.stato, 'cambiato');
  assert.deepEqual(a.atteso, {decorrenza: '2026-11-01', voce: 'totale', importo: 1818.75});
  assert.match(a.motivo, /1\/11\/2025/);
});

test('una cifra futura presentata come già in vigore è cambiata: all’invio vale ancora la tabella di prima', () => {
  const [a] = classifica({
    ccnl: COMMERCIO, oggi: OGGI, invio: INVIO,
    affermazioni: [{id: 'A1', frase: 'stipendio 4° livello oggi: 1.858,75 €', livello: '4', importo: 1858.75, vigente: true}],
  });
  assert.equal(a.stato, 'cambiato');
  assert.match(a.motivo, /dal 1\/2\/2027/);
  assert.deepEqual(a.atteso, {decorrenza: '2026-11-01', voce: 'totale', importo: 1818.75});
});

test('una cifra che è una sola voce (la paga base) si confronta con quella voce, e la correzione resta su quella voce', () => {
  const [a] = classifica({
    ccnl: COMMERCIO, oggi: OGGI, invio: INVIO,
    affermazioni: [{id: 'A1', frase: 'Minimo tabellare IV: 1257,46 €', livello: '4', importo: 1257.46, vigente: true}],
  });
  assert.equal(a.stato, 'superato');
  assert.equal(a.voce, 'pagaBase');
  assert.deepEqual(a.nuovo, {decorrenza: '2026-11-01', voce: 'pagaBase', importo: 1292.46});
});

test('una voce che le tranche non toccano (la contingenza) resta vera anche se compare in tabelle vecchie', () => {
  const [a] = classifica({
    ccnl: COMMERCIO, oggi: OGGI, invio: INVIO,
    affermazioni: [{id: 'A1', frase: 'Contingenza IV: 524,22 €', livello: '4', importo: 524.22, vigente: true}],
  });
  assert.equal(a.stato, 'ancora vero');
  assert.equal(a.voce, 'contingenza');
});

test('un centesimo o due di differenza è arrotondamento, non una correzione', () => {
  // Quadro dal 1/11/2026 calcolato dall'accordo: 2.986,29 + 60,77 = 3.047,06; Filcams pubblica 3.047,05.
  const [a] = classifica({
    ccnl: COMMERCIO, oggi: OGGI, invio: INVIO,
    affermazioni: [{id: 'A1', frase: 'Quadro: 3.047,06 €', livello: 'Q', importo: 3047.06, vigente: true}],
  });
  assert.equal(a.stato, 'ancora vero');
  assert.equal(a.scarto, 0.01);
});

test('un minimo commercio fermo a una tranche precedente al dataset si riconosce dall’art. 213 dell’accordo', () => {
  // 4° livello dal 1/3/2025: 1.783,75 − 35,00 (aumento del 1/11/2025, art. 213) = 1.748,75.
  const [a] = classifica({
    ccnl: COMMERCIO, oggi: OGGI, invio: INVIO,
    affermazioni: [{id: 'A1', frase: '4° livello: 1.748,75 €', livello: '4', importo: 1748.75, vigente: true}],
  });
  assert.equal(a.stato, 'superato');
  assert.equal(a.dal, '2025-11-01');
  assert.equal(a.veroOggi, false);
  assert.deepEqual(a.nuovo, {decorrenza: '2026-11-01', voce: 'totale', importo: 1818.75});
  assert.equal(a.riconosciutoDa.url,
    'https://ce-mu.it/rapportolavoro/contratti/cms_magazine/uploads/CommercioConfcommercio_AccordoRinnovo_22.3.2024.pdf');
});

test('anche un minimo commercio di prima del rinnovo (fino al 31/3/2023) si riconosce, ma solo dal totale', () => {
  // 4° livello: 1.783,75 − 35,00 − 30,00 − 70,00 − 30,00 (art. 213) = 1.618,75. La paga base di allora non si
  // ricostruisce: la tranche del 1/4/2023 era un acconto pagato a parte e nel 2024 è entrata nella paga base.
  const [totale, pagaBase] = classifica({
    ccnl: COMMERCIO, oggi: OGGI, invio: INVIO,
    affermazioni: [
      {id: 'A1', frase: '4° livello: 1.618,75 euro', livello: '4', importo: 1618.75, vigente: true},
      {id: 'A2', frase: 'paga base 4° livello: 1.092,46 €', livello: '4', importo: 1092.46, vigente: true},
    ],
  });
  assert.equal(totale.stato, 'superato');
  assert.equal(totale.dal, '2023-04-01');
  assert.deepEqual(totale.nuovo, {decorrenza: '2026-11-01', voce: 'totale', importo: 1818.75});
  assert.equal(pagaBase.stato, 'non verificabile');
});

test('la fonte dice se viene da una parte firmataria: Filcams sì, la banca dati del Vetro no', () => {
  const [commercio] = classifica({ccnl: COMMERCIO, oggi: OGGI, invio: INVIO,
    affermazioni: [{id: 'A1', livello: '4', importo: 1818.75, vigente: true}]});
  assert.equal(commercio.fonte.firmataria, true);
  assert.match(commercio.fonte.parte, /Filcams/);

  const [vetro] = classifica({ccnl: 'vetro-lampade-display-b132', sezione: 'meccanizzati', oggi: OGGI, invio: INVIO,
    affermazioni: [{id: 'A1', livello: 'A', importo: 1, vigente: true}]});
  assert.equal(vetro.fonte.firmataria, false);
  assert.equal(vetro.fonte.url, 'https://www.lavorofacile.it/rinnovi-ccnl/rinnovato-il-ccnl-vetro-industria');
});

test('un aumento si confronta con la differenza tra la tabella della sua decorrenza e quella prima', () => {
  const [giusto, sbagliato, senzaData] = classifica({ccnl: COMMERCIO, oggi: OGGI, invio: INVIO, affermazioni: [
    {id: 'A1', frase: '4° livello: +35 € dal 1° novembre 2026', livello: '4', voce: 'aumento', importo: 35, decorrenza: '2026-11-01'},
    {id: 'A2', frase: '4° livello: +40 € dal 1° novembre 2026', livello: '4', voce: 'aumento', importo: 40, decorrenza: '2026-11-01'},
    {id: 'A3', frase: 'aumento di 35 € al 4° livello', livello: '4', voce: 'aumento', importo: 35},
  ]});
  assert.equal(giusto.stato, 'ancora vero');
  assert.equal(sbagliato.stato, 'cambiato');
  assert.deepEqual(sbagliato.atteso, {decorrenza: '2026-11-01', voce: 'aumento', importo: 35});
  assert.match(sbagliato.motivo, /1\/2\/2027/); // 40 € è l'aumento della tranche dopo
  assert.equal(senzaData.stato, 'non verificabile');
});

test('un’affermazione controllata a mano sulla fonte primaria passa così com’è; senza URL della fonte no', () => {
  const [conFonte, senzaFonte, daBancaDati] = classifica({ccnl: COMMERCIO, oggi: OGGI, invio: INVIO, affermazioni: [
    {id: 'A1', frase: 'una tantum di 350 € in due rate', stato: 'ancora vero',
      fonte: {url: 'https://ce-mu.it/x/AccordoRinnovo.pdf', parte: 'testo dell’accordo sottoscritto dalle parti firmatarie'},
      nota: 'art. 213: 175 € a luglio 2024 e 175 € a luglio 2025'},
    {id: 'A2', frase: 'il contratto scade nel 2026', stato: 'cambiato', nota: 'scade il 31/3/2027'},
    {id: 'A3', frase: '14 mensilità', stato: 'ancora vero',
      fonte: {url: 'https://www.kitech.it/x', parte: 'Kitech, banca dati indipendente, non firmataria'}},
  ]});
  assert.equal(conFonte.stato, 'ancora vero');
  assert.equal(conFonte.fonte.firmataria, true);
  assert.equal(senzaFonte.stato, 'non verificabile');
  assert.match(senzaFonte.motivo, /fonte/);
  assert.equal(daBancaDati.fonte.firmataria, false);
});

test('un contratto con più sezioni senza la sezione è un errore che elenca le sezioni', () => {
  assert.throws(() => classifica({ccnl: 'multiservizi-pulizia-k511', oggi: OGGI, invio: INVIO,
    affermazioni: [{id: 'A1', livello: '2', importo: 1, vigente: true}]}), /impiegati, operai/);
});

test('un livello che la fonte non ha è non verificabile, non un errore', () => {
  const [a] = classifica({ccnl: COMMERCIO, oggi: OGGI, invio: INVIO,
    affermazioni: [{id: 'A1', frase: 'Livello 8: 1.300,00 €', livello: '8', importo: 1300, vigente: true}]});
  assert.equal(a.stato, 'non verificabile');
  assert.match(a.motivo, /livello 8/);
});

// --- il cancello ---

const pagina = affermazioni => classifica({ccnl: COMMERCIO, oggi: OGGI, invio: INVIO, affermazioni});

test('con due correzioni solide la pagina si scrive; il non verificabile resta fuori dalla mail ma entra nella Verifica', () => {
  const esito = cancello(pagina([
    {id: 'A1', frase: 'IV livello: 1.783,75 €', livello: '4', importo: 1783.75, vigente: true},
    {id: 'A2', frase: 'V livello: 1.660,08 €', livello: '5', importo: 1660.08, vigente: true},
    {id: 'A3', frase: 'IV livello a Vicenza: 1.787,88 €', livello: '4', importo: 1787.88, vigente: true},
  ]), {oggi: OGGI, invio: INVIO});
  assert.equal(esito.decisione, 'scrivi');
  assert.deepEqual(esito.foglio.map(c => c.id), ['A1', 'A2']);
  assert.deepEqual(esito.fuori.map(c => c.id), ['A3']);
  const righe = esito.verifica.split('\n').filter(r => r.includes('«'));
  assert.equal(righe.length, 3);
  for (const riga of righe) assert.match(riga, /https:\/\/www\.filcams\.cgil\.it\/page\/confcommercio_terziario/);
});

test('una correzione su una fonte non firmataria non conta: con una sola solida la pagina si salta', () => {
  const esito = cancello(pagina([
    {id: 'A1', frase: 'IV livello: 1.783,75 €', livello: '4', importo: 1783.75, vigente: true},
    {id: 'A2', frase: '13 mensilità', stato: 'cambiato', nota: 'sono 14',
      fonte: {url: 'https://www.kitech.it/x', parte: 'Kitech, banca dati indipendente, non firmataria'}},
  ]), {oggi: OGGI, invio: INVIO});
  assert.equal(esito.decisione, 'salta');
  assert.deepEqual(esito.foglio.map(c => c.id), ['A1']);
  assert.deepEqual(esito.fuori.map(c => c.id), ['A2']);
  assert.match(esito.verifica, /\[cambiato, fuori dalla mail\] «13 mensilità»/);
});

test('se una correzione è vera fino alla tranche, la mail non parte prima della tranche e la Verifica lo dice', () => {
  const esito = cancello(pagina([
    {id: 'A1', frase: 'IV livello: 1.783,75 €', livello: '4', importo: 1783.75, vigente: true},
    {id: 'A2', frase: 'V livello: 1.660,08 €', livello: '5', importo: 1660.08, vigente: true},
  ]), {oggi: OGGI, invio: INVIO});
  assert.equal(esito.nonPrimaDel, '2026-11-01');
  assert.match(esito.verifica, /\[superato dal 1\/11\/2026, vero fino al 31\/10\/2026\] «IV livello: 1\.783,75 €»/);
  assert.match(esito.verifica, /non inviare prima del 1\/11\/2026/i);
  assert.match(esito.verifica, /1\.818,75 € \(totale\) dal 1\/11\/2026/);
});

test('un valore ricostruito all’indietro riconosce la tabella vecchia ma non diventa la cifra da proporre', () => {
  // Tabella datata marzo 2025 a cui manca il terzo elemento: l'errore c'è, ma il totale giusto di allora
  // non è pubblicato da nessuna fonte del sito, è una sottrazione.
  const esito = cancello(pagina([
    {id: 'A1', frase: 'mar 2025 — IV | 1746,68 €', livello: '4', importo: 1746.68, decorrenza: '2025-03-01', vigente: false},
    {id: 'A2', frase: 'mar 2025 — V | 1626,39 €', livello: '5', importo: 1626.39, decorrenza: '2025-03-01', vigente: false},
  ]), {oggi: OGGI, invio: INVIO});
  assert.equal(esito.decisione, 'salta');
  assert.deepEqual(esito.fuori.map(c => c.id), ['A1', 'A2']);
});

// --- il netto per livello ---

// Valori del motore del sito (profilo delle pagine: Milano, tempo pieno, zero scatti, 14 mensilità) annotati
// nell'esplorazione di RIC-119 il 15/10/2026, prima che questo modulo esistesse.
test('il netto per livello prima e dopo la tranche, con la pagina del livello quando esiste', () => {
  const {righe} = nettoPrimaDopo(COMMERCIO, {prima: '2026-10-31', dopo: '2026-11-01'});
  const terzo = righe.find(r => r.codice === '3');
  assert.deepEqual(terzo.minimo, {prima: 1983.91, dopo: 2024.38});
  assert.deepEqual(terzo.ral, {prima: 27774.74, dopo: 28341.32});
  assert.deepEqual(terzo.nettoMensile, {prima: 1578.75, dopo: 1602.81});
  assert.equal(terzo.pagina, 'https://www.dovevalatuaral.com/minimi-ccnl/commercio/3-livello/');
  assert.equal(terzo.salto, null);
  assert.equal(righe.find(r => r.codice === '6').pagina, 'https://www.dovevalatuaral.com/minimi-ccnl/commercio/');
});

test('se l’aumento fa passare un salto, la riga lo dice: il 4° livello commercio guadagna 490 € lordi e 110 netti', () => {
  const {righe} = nettoPrimaDopo(COMMERCIO, {prima: '2026-10-31', dopo: '2026-11-01'});
  const quarto = righe.find(r => r.codice === '4');
  assert.deepEqual(quarto.ral, {prima: 24972.5, dopo: 25462.5});
  assert.deepEqual(quarto.nettoAnnuo, {prima: 20553.09, dopo: 20662.87});
  assert.match(quarto.salto, /addizionale comunale di Milano/);
});

test('il netto per livello si incolla nella mail come testo semplice, con le ipotesi dichiarate', () => {
  const {testo} = nettoPrimaDopo(COMMERCIO, {prima: '2026-10-31', dopo: '2026-11-01', livelli: ['3', '4']});
  const righe = testo.split('\n');
  assert.match(righe[0], /dal 1\/11\/2026/);
  assert.match(testo, /Milano/);
  assert.match(testo, /14 mensilità/);
  assert.match(testo, /3° livello: lordo 1\.983,91 → 2\.024,38 € al mese, netto 1\.578,75 → 1\.602,81 € al mese/);
  assert.match(testo, /4° livello: .*1\.468,08 → 1\.475,92 €.*addizionale comunale/);
  assert.match(testo, /https:\/\/www\.dovevalatuaral\.com\/minimi-ccnl\/commercio\/4-livello\//);
  assert.doesNotMatch(testo, /5° livello/);
});

// --- la riga di comando, come la usa la skill ---

const CLI = require.resolve('./dono-ccnl.js');
const esegui = (...argomenti) => promisify(execFile)(process.execPath, [CLI, ...argomenti]);

test('CLI classifica: legge il file delle affermazioni e stampa classificazione, decisione e testo della Verifica', async t => {
  const cartella = fs.mkdtempSync(path.join(os.tmpdir(), 'link-dono-'));
  t.after(() => fs.rmSync(cartella, {recursive: true, force: true}));
  const file = path.join(cartella, 'pagina.json');
  fs.writeFileSync(file, JSON.stringify({ccnl: 'commercio', oggi: OGGI, invio: INVIO, affermazioni: [
    {id: 'A1', frase: 'IV livello: 1.783,75 €', livello: '4', importo: 1783.75, vigente: true},
    {id: 'A2', frase: 'V livello: 1.660,08 €', livello: '5', importo: 1660.08, vigente: true},
  ]}));
  const {stdout} = await esegui('classifica', file);
  const esito = JSON.parse(stdout);
  assert.equal(esito.decisione, 'scrivi');
  assert.deepEqual(esito.affermazioni.map(a => a.stato), ['superato', 'superato']);
  assert.match(esito.verifica, /^link-dono, controllo del 15\/10\/2026/);
});

test('CLI netto: accetta lo slug del sito e stampa il testo da incollare', async () => {
  const {stdout} = await esegui('netto', 'commercio', '2026-10-31', '2026-11-01', '--livelli', '4');
  assert.match(stdout, /^Netto per livello, CCNL Terziario/);
  assert.match(stdout, /4° livello: lordo 1\.783,75 → 1\.818,75 € al mese/);
});

test('CLI valori: le tabelle della fonte per decorrenza, con quelle ricostruite segnate e la fonte firmataria', async () => {
  const {stdout} = await esegui('valori', 'commercio');
  const valori = JSON.parse(stdout);
  assert.equal(valori.fonte.firmataria, true);
  assert.deepEqual(valori.tabelle.map(t => [t.decorrenza, Boolean(t.ricostruita)]), [
    ['2020-01-01', true], ['2023-04-01', true], ['2024-04-01', true], ['2025-03-01', true],
    ['2025-11-01', false], ['2026-11-01', false], ['2027-02-01', false]]);
  const quarto = valori.tabelle[5].livelli.find(l => l.codice === '4');
  assert.equal(quarto.totale, 1818.75);
  assert.equal(quarto.voci.pagaBase, 1292.46);
});

test('CLI senza comando valido: esce con 2 e spiega l’uso', async () => {
  await assert.rejects(esegui('boh'), err => err.code === 2 && /Uso:/.test(err.stderr));
});
