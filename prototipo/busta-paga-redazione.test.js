const {test}=require('node:test');
const assert=require('node:assert/strict');
const R=require('./busta-paga-redazione.js');

/* Stringhe costruite a mano: nessun cedolino reale entra in queste prove. */
const righe=(...testi)=>testi.map((testo,indice)=>({pagina:1,y:700-indice*10,testo,frammenti:[]}));
const redigi=(elenco,stato)=>R.applica(elenco,stato||R.statoIniziale(elenco));
const testo=(...testi)=>redigi(righe(...testi)).testo;
const soloRiga=(...testi)=>testo(...testi).split('\n');

test('il codice fiscale sparisce, l’importo accanto resta',()=>{
  const linee=soloRiga('COD. FISCALE RSSMRA80A01F205X IMPONIBILE 1.764,00');
  assert.equal(linee[0],'COD. FISCALE [CODICE_FISCALE] IMPONIBILE 1.764,00');
});

test('il segnaposto non rompe la struttura della riga',()=>{
  const originale='COD. FISCALE RSSMRA80A01F205X IMPONIBILE 1.764,00';
  const redatta=soloRiga(originale)[0];
  assert.equal(redatta.split(' ').length,originale.split(' ').length);
  assert.equal(redatta.split(' ').at(-1),'1.764,00');
  assert.doesNotMatch(redatta,/\s{2}|^\s|\s$/);
});

test('sedici caratteri non fanno un codice fiscale',()=>{
  const linea='PROGRESSIVO 1234567890123456 IMPONIBILE 1.764,00';
  assert.equal(soloRiga(linea)[0],linea);
});

test('l’IBAN sparisce, scritto di seguito o spezzato in gruppi',()=>{
  assert.equal(soloRiga('ACCREDITO IT60X0542811101000000123456')[0],'ACCREDITO [IBAN]');
  assert.equal(soloRiga('ACCREDITO IT60 X054 2811 1010 0000 0123 456 BANCA')[0],
    'ACCREDITO [IBAN] BANCA');
});

test('la partita IVA sparisce con l’etichetta e da sola, un importo no',()=>{
  assert.equal(soloRiga('P.IVA 01234567890 SEDE')[0],'P.IVA [PARTITA_IVA] SEDE');
  assert.equal(soloRiga('DITTA 01234567890')[0],'DITTA [PARTITA_IVA]');
  const importo='PROGRESSIVO NETTO 12.345.678,90';
  assert.equal(soloRiga(importo)[0],importo);
});

test('la data di nascita sparisce, il periodo di paga no',()=>{
  assert.equal(soloRiga('NATO IL 01/01/1980 A MILANO')[0],'NATO IL [DATA_NASCITA] A MILANO');
  assert.equal(soloRiga('DATA DI NASCITA 01-01-1980')[0],'DATA DI NASCITA [DATA_NASCITA]');
  const periodo='PERIODO DI PAGA 01/09/2026 - 30/09/2026';
  assert.equal(soloRiga(periodo)[0],periodo);
  const assunzione='DATA ASSUNZIONE 15/03/2019 QUALIFICA IMPIEGATO';
  assert.equal(soloRiga(assunzione)[0],assunzione);
});

test('della matricola sparisce il numero, non l’etichetta',()=>{
  assert.equal(soloRiga('MATRICOLA 004912 LIVELLO 5')[0],'MATRICOLA [MATRICOLA] LIVELLO 5');
  assert.equal(soloRiga('MATR. A-1234 CENTRO DI COSTO')[0],'MATR. [MATRICOLA] CENTRO DI COSTO');
});

test('indirizzo e CAP spariscono, il comune di riferimento fiscale resta leggibile',()=>{
  assert.equal(soloRiga('VIA GIUSEPPE GARIBALDI 12 20121 MILANO (MI)')[0],'[INDIRIZZO]');
  assert.equal(soloRiga('RESIDENZA VIA ROMA 4')[0],'RESIDENZA [INDIRIZZO]');
  const comune='ADDIZIONALE COMUNALE MILANO 0,80% 141,12';
  assert.equal(soloRiga(comune)[0],comune);
});

test('la sigla sindacale sparisce e l’importo resta: la riconciliazione deve tornare',()=>{
  assert.equal(soloRiga('TRATTENUTA SINDACALE CGIL 1,00% 18,50')[0],
    '[SIGLA_SINDACALE] 1,00% 18,50');
  assert.equal(soloRiga('QUOTA ASSOCIATIVA FIOM 18,50')[0],'[SIGLA_SINDACALE] 18,50');
  assert.equal(soloRiga('CONTRIBUTO UILM MENSILE 12,00')[0],
    'CONTRIBUTO [SIGLA_SINDACALE] MENSILE 12,00');
});

test('una sigla dentro un’altra parola non è una sigla',()=>{
  for(const linea of ['COMUNE DI CISLAGO 0,80% 141,12','RIMBORSO SLCX 10,00','FIMAUTO SPA SEDE'])
    assert.equal(soloRiga(linea)[0],linea);
});

test('il motivo di assenza sparisce, ore e importo restano',()=>{
  assert.equal(soloRiga('MALATTIA INPS 16,00 ORE 123,45')[0],'[MOTIVO_ASSENZA] INPS 16,00 ORE 123,45');
  assert.equal(soloRiga('PERMESSO LEGGE 104 8,00 ORE 61,72')[0],'[MOTIVO_ASSENZA] 8,00 ORE 61,72');
  assert.equal(soloRiga('INFORTUNIO CARENZA 3,00 45,00')[0],'[MOTIVO_ASSENZA] 3,00 45,00');
  assert.equal(soloRiga('CONGEDO PARENTALE 30% 8,00 40,00')[0],'[MOTIVO_ASSENZA] 30% 8,00 40,00');
});

test('ferie e permessi ordinari non sono motivi di assenza',()=>{
  for(const linea of ['FERIE GODUTE 8,00 ORE 100,00','PERMESSI ROL 4,00 ORE 50,00'])
    assert.equal(soloRiga(linea)[0],linea);
});

test('il nome accanto al codice fiscale sparisce con lui',()=>{
  assert.equal(soloRiga('ROSSI MARIO RSSMRA80A01F205X')[0],'[NOME] [CODICE_FISCALE]');
});

test('il nome dopo l’etichetta del dipendente sparisce',()=>{
  assert.equal(soloRiga('DIPENDENTE: ROSSI MARIO')[0],'DIPENDENTE: [NOME]');
  assert.equal(soloRiga('COGNOME E NOME ROSSI MARIO')[0],'COGNOME E NOME [NOME]');
});

test('l’euristica sull’intestazione non mangia il vocabolario del cedolino',()=>{
  const intestazione=['BUSTA PAGA','RETRIBUZIONE ORDINARIA','TOTALE COMPETENZE 2.100,00',
    'QUALIFICA IMPIEGATO','LIVELLO 5 CCNL COMMERCIO'];
  assert.deepEqual(soloRiga(...intestazione),intestazione);
});

test('l’euristica sul nome vale sull’intestazione, non a metà cedolino',()=>{
  const riempimento=Array.from({length:R.INTESTAZIONE_RIGHE},(_,i)=>`RETRIBUZIONE VOCE ${i} 10,00`);
  const [,...resto]=soloRiga('BUSTA PAGA MENSILE',...riempimento,'BIANCHI GIOVANNA');
  assert.equal(resto.at(-1),'BIANCHI GIOVANNA','fuori intestazione l’euristica tace');
  assert.equal(soloRiga('BIANCHI GIOVANNA')[0],'[NOME]');
});

test('l’utente può riportare una parola oscurata e oscurarne un’altra',()=>{
  const elenco=righe('RESIDENZA VIA ROMA 4');
  let stato=R.statoIniziale(elenco);
  assert.equal(R.applica(elenco,stato).testo,'RESIDENZA [INDIRIZZO]');

  stato=R.commuta(stato,0,1); // «VIA» torna leggibile
  assert.equal(R.applica(elenco,stato).testo,'RESIDENZA VIA [INDIRIZZO]');

  stato=R.commuta(stato,0,0); // «RESIDENZA» oscurata a mano
  assert.equal(R.applica(elenco,stato).testo,'[OSCURATO] VIA [INDIRIZZO]');

  stato=R.commuta(stato,0,0); // e riportata
  assert.equal(R.applica(elenco,stato).testo,'RESIDENZA VIA [INDIRIZZO]');
});

test('commuta non modifica lo stato che riceve',()=>{
  const elenco=righe('NOTE LIBERE');
  const stato=R.statoIniziale(elenco);
  const dopo=R.commuta(stato,0,0);
  assert.notEqual(stato,dopo);
  assert.equal(R.applica(elenco,stato).testo,'NOTE LIBERE');
  assert.equal(R.applica(elenco,dopo).testo,'[OSCURATO] LIBERE');
});

test('lo stato ignora indici che non esistono',()=>{
  const elenco=righe('UNA RIGA');
  const stato=R.statoIniziale(elenco);
  assert.equal(R.commuta(stato,9,0),stato);
  assert.equal(R.commuta(stato,0,9),stato);
});

test('l’elenco dice che cosa è stato oscurato e perché, senza citarlo',()=>{
  const elenco=righe('ROSSI MARIO RSSMRA80A01F205X','TRATTENUTA SINDACALE CGIL 18,50',
    'MALATTIA INPS 16,00 123,45');
  const {elenco:voci,testo:payload}=redigi(elenco);
  const tipi=voci.map(v=>v.tipo);
  assert.deepEqual(tipi,['nome','codice-fiscale','sigla-sindacale','motivo-assenza']);
  for(const voce of voci){
    assert.ok(voce.etichetta&&voce.motivo,voce.tipo);
    assert.equal(voce.conteggio,1);
    assert.ok(!payload.includes('ROSSI'));
  }
  assert.match(voci.find(v=>v.tipo==='sigla-sindacale').motivo,/art\. 9|sindacal/i);
  assert.match(voci.find(v=>v.tipo==='motivo-assenza').motivo,/salute|art\. 9/i);
});

test('le proposte incerte sono dichiarate tali',()=>{
  const {segnalazioni}=redigi(righe('BIANCHI GIOVANNA','COD. FISCALE RSSMRA80A01F205X'));
  const perTipo=Object.fromEntries(segnalazioni.map(s=>[s.tipo,s]));
  assert.equal(perTipo['nome'].incerto,true);
  assert.equal(perTipo['codice-fiscale'].incerto,false);
});

test('il testo del payload è esattamente la concatenazione dei segmenti mostrati',()=>{
  const elenco=[
    {pagina:1,y:700,testo:'ROSSI MARIO RSSMRA80A01F205X',frammenti:[]},
    {pagina:1,y:690,testo:'RETRIBUZIONE 1.764,00',frammenti:[]},
    {pagina:2,y:700,testo:'SEGUE MALATTIA 16,00',frammenti:[]},
  ];
  const {righe:redatte,testo:payload}=redigi(elenco);
  const ricomposto=[];
  let pagina=null;
  for(const riga of redatte){
    if(pagina!==null&&riga.pagina!==pagina)ricomposto.push(`[PAGINA ${riga.pagina}]`);
    pagina=riga.pagina;
    ricomposto.push(riga.segmenti.map(s=>s.testo).join(' '));
  }
  assert.equal(ricomposto.join('\n'),payload);
  assert.equal(payload,'[NOME] [CODICE_FISCALE]\nRETRIBUZIONE 1.764,00\n[PAGINA 2]\nSEGUE [MOTIVO_ASSENZA] 16,00');
});

test('ogni segmento sa quali parole rappresenta, per il clic e per la tastiera',()=>{
  const {righe:[riga]}=redigi(righe('RESIDENZA VIA ROMA 4'));
  assert.deepEqual(riga.segmenti.map(s=>[s.testo,s.oscurato,s.parole]),[
    ['RESIDENZA',false,[0]],
    ['[INDIRIZZO]',true,[1,2,3]],
  ]);
});

test('ogni tipo dichiara segnaposto, etichetta e motivo, e il segnaposto è una parola sola',()=>{
  for(const [tipo,voce] of Object.entries(R.TIPI)){
    assert.match(voce.segnaposto,/^\[[A-Z_]+\]$/,tipo);
    assert.ok(voce.etichetta&&voce.motivo,tipo);
  }
  assert.equal(R.TIPI.manuale.segnaposto,'[OSCURATO]');
});
