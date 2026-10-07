const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {calcola}=require('./motore');
const text=fs.readFileSync(path.join(__dirname,'articoli','esempio-busta-paga-liquidazione-tfr.md'),'utf8');
const cents=s=>Math.round(Number(s.replace(/[€\s*.]/g,'').replace('−','-').replace(',','.'))*100);
const eur=c=>`${(c/100).toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2,useGrouping:'always'})} €`;
/* Importo dell'unica riga di tabella che comincia con l'etichetta data. */
const riga=label=>{
  const found=text.split('\n').filter(l=>l.replace(/\*\*/g,'').startsWith(`| ${label}`));
  assert.equal(found.length,1,label);
  return cents(found[0].split('|').slice(1,-1).pop());
};
const voce=(ral,id)=>Math.round(calcola(ral).voci.find(v=>v.id===id).importo*100);

/* Anni precedenti, RAL 30.000 € costante a Milano (RIC-87). Le aliquote 2025 di Lombardia e
   Milano coincidono con le 2026 (tabelle MEF), quindi le addizionali 2025 sono quelle che il
   motore dà oggi su 30.000 €. Il reddito 2024 è più alto: esonero di 6 punti sull'IVS delle
   dodici mensilità ordinarie, non sulla tredicesima (L. 213/2023 c. 15, INPS circ. 11/2024). */
const regionale2025=-voce(30000,'addreg');
const comunale2025=-voce(30000,'addcom');
const reddito2024=30000-(30000*12/13*0.0319+30000/13*0.0919);
const acconto2025=Math.round(0.3*0.008*reddito2024*100);
const acconto2026=Math.round(0.3*comunale2025);

test("l'ultimo cedolino scala dalla comunale 2026 l'acconto già trattenuto",()=>{
  const ral=30710.08;
  assert.equal(riga('Addizionale regionale Lombardia 2026'),voce(ral,'addreg'));
  assert.equal(riga('Addizionale comunale Milano 2026'),voce(ral,'addcom')+acconto2026);
  const ordinario=riga('Totale competenze a tassazione ordinaria')+riga('Contributi IVS, 9,19%')+riga('IRPEF del mese')
    +riga('Addizionale regionale Lombardia 2026')+riga('Addizionale comunale Milano 2026');
  assert.equal(riga('Netto della parte ordinaria'),ordinario);
  assert.equal(riga("Netto dell'ultimo cedolino"),ordinario+riga('TFR netto'));
  for(const importo of [ordinario,riga("Netto dell'ultimo cedolino")])
    assert.ok(text.split(eur(importo)).length-1>=3,`${eur(importo)} in apertura, in breve e in tabella`);
});

test("i cedolini da gennaio a novembre trattengono le addizionali 2025 e l'acconto 2026",()=>{
  assert.equal(riga('Saldo addizionale regionale 2025'),-regionale2025);
  assert.equal(riga('Saldo addizionale comunale 2025'),-(comunale2025-acconto2025));
  assert.equal(riga('Acconto addizionale comunale 2026'),-acconto2026);
  const etichette=['Lordo, 11','Contributi IVS, 11','IRPEF, 11','Saldo addizionale regionale 2025','Saldo addizionale comunale 2025','Acconto addizionale comunale 2026'];
  const undici=etichette.map(riga).reduce((a,b)=>a+b,0);
  assert.equal(riga('Netto incassato in undici mesi'),undici);
  /* Cassa dell'anno, poi ritorno al netto del motore: si rimettono i saldi 2025. */
  const cassa=undici+riga('Netto della parte ordinaria');
  const saldi=regionale2025+comunale2025-acconto2025;
  assert.ok(text.includes(`nel 2026 incassi **${eur(cassa)}**`));
  assert.ok(text.includes(`${eur(cassa).slice(0,-2)} + ${eur(saldi).slice(0,-2)} = ${eur(cassa+saldi)}`));
  assert.ok(Math.abs(cassa+saldi-Math.round(calcola(30710.08).kpi.nettoAnnuo*100))<=10,'scarto di arrotondamento');
});
