const {test}=require('node:test');
const assert=require('node:assert/strict');
const E=require('./busta-paga-estrazione.js');

/* Le coordinate sono scritte a mano: nessun PDF entra in queste prove.
   Convenzione, la stessa di pdf.js: y è la linea di base misurata dal fondo
   della pagina, quindi una riga più in alto ha y più grande. */
const f=(testo,x,y,larghezza,altezza=9,pagina=1)=>({pagina,testo,x,y,larghezza,altezza});

test('le righe nascono dalle coordinate, non dall’ordine dei frammenti',()=>{
  // Frammenti mescolati come li restituisce una tabella densa: prima l'importo
  // della seconda riga, poi la dicitura della prima.
  const righe=E.componiRighe([
    f('1.764,00',420,700,48),
    f('RETRIBUZIONE ORDINARIA',56,712,120),
    f('168,00',300,712,36),
    f('TRATTENUTA INPS',56,700,90),
  ]);
  assert.equal(righe.length,2);
  assert.equal(righe[0].testo,'RETRIBUZIONE ORDINARIA 168,00');
  assert.equal(righe[1].testo,'TRATTENUTA INPS 1.764,00');
  assert.deepEqual(righe.map(r=>r.pagina),[1,1]);
});

test('una colonna disallineata di frazioni di punto resta sulla sua riga',()=>{
  const righe=E.componiRighe([
    f('CONTRIBUTO IVS',56,712,80),
    f('9,19%',300,711.4,30),   // stessa riga, linea di base leggermente più bassa
    f('161,98',420,712.6,40),  // stessa riga, leggermente più alta
  ]);
  assert.equal(righe.length,1);
  assert.equal(righe[0].testo,'CONTRIBUTO IVS 9,19% 161,98');
});

test('due righe vicine ma distinte non si fondono',()=>{
  const righe=E.componiRighe([
    f('FERIE RESIDUE',56,712,80),
    f('12,50',420,712,30),
    f('PERMESSI RESIDUI',56,702,90),   // 10 punti più in basso: riga diversa
    f('4,00',420,702,24),
  ]);
  assert.equal(righe.length,2);
  assert.equal(righe[0].testo,'FERIE RESIDUE 12,50');
  assert.equal(righe[1].testo,'PERMESSI RESIDUI 4,00');
});

test('un carattere più grande sulla stessa linea di base non apre una riga nuova',()=>{
  const righe=E.componiRighe([
    f('NETTO DEL MESE',56,300,100,14),
    f('1.402,55',420,300.9,60,9),
  ]);
  assert.equal(righe.length,1);
  assert.equal(righe[0].testo,'NETTO DEL MESE 1.402,55');
});

test('i frammenti contigui compongono la parola, quelli distanti restano separati',()=>{
  // pdf.js spezza spesso una parola in due frammenti attaccati.
  const righe=E.componiRighe([
    f('IRP',56,712,18),
    f('EF',74,712,12),
    f('LORDA',92,712,30),      // distanza 6: una parola nuova
    f('321,40',420,712,36),
  ]);
  assert.equal(righe[0].testo,'IRPEF LORDA 321,40');
});

test('gli spazi interni al frammento non si moltiplicano e i vuoti spariscono',()=>{
  const righe=E.componiRighe([
    f('  TOTALE   COMPETENZE  ',56,712,140),
    f('   ',200,712,10),
    f('2.100,00',420,712,48),
  ]);
  assert.equal(righe[0].testo,'TOTALE COMPETENZE 2.100,00');
});

test('le pagine restano separate e ordinate anche con y identiche',()=>{
  const righe=E.componiRighe([
    f('SECONDA PAGINA',56,712,90,9,2),
    f('PRIMA PAGINA',56,712,90,9,1),
  ]);
  assert.deepEqual(righe.map(r=>[r.pagina,r.testo]),[[1,'PRIMA PAGINA'],[2,'SECONDA PAGINA']]);
});

test('frammenti sovrapposti sulla stessa riga non perdono caratteri',()=>{
  const righe=E.componiRighe([
    f('TOTALE',56,712,40),
    f('COMPETENZE',95,712,60), // inizia un punto prima della fine del precedente
  ]);
  assert.equal(righe[0].testo,'TOTALECOMPETENZE');
});

test('l’adapter di pdf.js legge la linea di base dalla matrice di trasformazione',()=>{
  const items=[
    {str:'RETRIBUZIONE',transform:[9,0,0,9,56,712],width:120,height:9},
    {str:'',transform:[9,0,0,9,200,712],width:0,height:9},
    {str:'1.764,00',transform:[9,0,0,9,420,712],width:48,height:9},
  ];
  const frammenti=E.frammentiDaTextContent(items,{pagina:3});
  assert.equal(frammenti.length,2,'i frammenti vuoti non entrano');
  assert.deepEqual(frammenti[0],{pagina:3,testo:'RETRIBUZIONE',x:56,y:712,larghezza:120,altezza:9});
  assert.equal(E.componiRighe(frammenti)[0].testo,'RETRIBUZIONE 1.764,00');
});

test('l’altezza mancante si deduce dalla matrice',()=>{
  const [frammento]=E.frammentiDaTextContent([{str:'X',transform:[11,0,0,11,10,20],width:6}],{pagina:1});
  assert.equal(frammento.altezza,11);
});

test('ogni riga conserva i frammenti che la compongono',()=>{
  const frammenti=[f('MALATTIA',56,712,50),f('123,45',420,712,36)];
  const [riga]=E.componiRighe(frammenti);
  assert.deepEqual(riga.frammenti.map(fr=>fr.testo),['MALATTIA','123,45']);
  assert.equal(riga.y,712);
});

test('il testo del documento unisce le righe e segna il cambio di pagina',()=>{
  const righe=E.componiRighe([
    f('PRIMA',56,712,40,9,1),
    f('SECONDA',56,700,40,9,1),
    f('TERZA',56,712,40,9,2),
  ]);
  assert.equal(E.testoDaRighe(righe),'PRIMA\nSECONDA\n[PAGINA 2]\nTERZA');
});

test('il file entra solo se è un PDF digitale entro i limiti',()=>{
  const ok={nome:'cedolino.pdf',tipo:'application/pdf',dimensione:120000};
  assert.deepEqual(E.verificaFile(ok),{ok:true});
  assert.deepEqual(E.verificaFile({...ok,tipo:'image/jpeg',nome:'foto.jpg'}),
    {ok:false,codice:'FILE_NON_PDF'});
  assert.deepEqual(E.verificaFile({...ok,dimensione:E.LIMITI.byteMassimi+1}),
    {ok:false,codice:'FILE_TROPPO_GRANDE'});
  assert.deepEqual(E.verificaFile({...ok,dimensione:0}),{ok:false,codice:'FILE_VUOTO'});
  // Un PDF salvato senza tipo MIME dal sistema operativo resta ammesso.
  assert.deepEqual(E.verificaFile({...ok,tipo:''}),{ok:true});
});

test('oltre il tetto di pagine il percorso si ferma prima di leggere',()=>{
  assert.deepEqual(E.verificaDocumento({pagine:E.LIMITI.pagineMassime}),{ok:true});
  assert.deepEqual(E.verificaDocumento({pagine:E.LIMITI.pagineMassime+1}),
    {ok:false,codice:'TROPPE_PAGINE'});
  assert.deepEqual(E.verificaDocumento({pagine:0}),{ok:false,codice:'PDF_SENZA_TESTO'});
});

test('scansione e documento quasi vuoto hanno codici distinti',()=>{
  assert.deepEqual(E.verificaRighe([]),{ok:false,codice:'PDF_SENZA_TESTO'});
  assert.deepEqual(E.verificaRighe(E.componiRighe([f('COPIA',56,712,40)])),
    {ok:false,codice:'ESTRAZIONE_VUOTA'});
  const denso=E.componiRighe(Array.from({length:30},(_,i)=>
    f(`RETRIBUZIONE ORDINARIA VOCE ${i} 1.234,56`,56,700-i*10,200)));
  assert.deepEqual(E.verificaRighe(denso),{ok:true});
});

test('ogni codice di errore ha un messaggio, e nessun messaggio cita il documento',()=>{
  const codici=['FILE_NON_PDF','FILE_TROPPO_GRANDE','FILE_VUOTO','TROPPE_PAGINE',
    'PDF_SENZA_TESTO','ESTRAZIONE_VUOTA','PDF_PROTETTO','PDF_ILLEGGIBILE'];
  for(const codice of codici){
    const messaggio=E.MESSAGGI[codice];
    assert.ok(messaggio&&messaggio.titolo&&messaggio.cosaFare,codice);
    assert.doesNotMatch(messaggio.titolo+messaggio.cosaFare,/\$\{|%s/);
  }
  assert.deepEqual(Object.keys(E.MESSAGGI).sort(),[...codici].sort());
});
