# Calcolatore della tredicesima — piano di implementazione

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** pagina `/calcolo-tredicesima/` con calcolatore della tredicesima lorda e netta (regole 2026), collegata dal menu, dalle pagine RAL e dall'articolo sulla tredicesima detassata.

**Architecture:** un modulo puro `prototipo/tredicesima.js` (UMD come `netto-ral.js`, BigInt a scala 1e8 come `motore.js`) restituisce voci numeriche; una pagina statica compone le righe. Il modulo **non** carica `motore.js` nel browser, perché il motore richiede `dati-addizionali-2026.js` (4,4 MB) che qui non serve: le poche costanti sono replicate e un test di parità le confronta con `K` del motore.

**Tech Stack:** HTML/CSS/JS statici, `node --test`, Vercel (output `prototipo/`).

**Spec:** `processo/calcolo-tredicesima.md`

## Global Constraints

- Branch `calcolo-13esima`. Niente push né PR senza ok di Riccardo.
- Nomi del dominio in italiano, impalcatura in inglese (`CONTEXT.md`).
- Nessuna soglia o aliquota letterale dentro la logica: stanno in `K` o in `PROPOSTA_DETASSATA`, con la fonte in commento.
- Limiti input: lordo mensile 100 – 9.000 €; RAL 1.000 – 120.000 €; mensilità 13 o 14; mesi interi 1 – 12. (Sotto il massimale contributivo 122.295 €, che è fuori perimetro.)
- Soglia mensile contributo aggiuntivo: 4.685 € (INPS circ. 6/2026).
- Proposta detassata: 15% fino a 15.000 € di imponibile, etichetta "proposta, non legge".
- Stile: `draftsman.css`, stesso markup di header/nav di `netto-ral.html`.
- `npm test` verde a fine di ogni task, tranne Task 1–2 dove i 3 test di `genera-articoli` falliscono già per il link a `/calcolo-tredicesima/` (commit `1d5699c`): tornano verdi al Task 3.

## Review Focus

1. Importo scritto all'italiana ("2.300,50", "30.000", "€ 2300") → deve essere letto, non rifiutato. Test in Task 2.
2. Query string invalida (`?ral=abc`, `?mesi=0`) → la pagina si apre vuota, senza errore visibile e senza calcolo. Test in Task 2 (`daQuery` + `normalizza`).
3. Bonus cuneo per chi ha lavorato pochi mesi → spetta sul reddito effettivo, percentuale sul reddito teorico annuo. Test in Task 1.
4. Mensile alto (4.000 €) → l'1% scatta anche se la sola tredicesima è sotto soglia, perché a dicembre si somma allo stipendio. Test in Task 1.
5. Link del menu su tutte le pagine (78 file con `nav-calcola`) → nessuna pagina dimenticata. Controllo con conteggio in Task 4.

---

### Task 1: modulo di calcolo

**Files:**
- Create: `prototipo/tredicesima.js`
- Test: `prototipo/tredicesima.test.js`

**Interfaces:**
- Produces: `TREDICESIMA` (globale nel browser) / `module.exports` in Node con
  - `calcolaDaRal({ral:string, mensilita?:13|14, mesi?:1..12}) → Risultato`
  - `calcolaDaLordo({lordo:string, mesi?:1..12}) → Risultato`
  - `Risultato = {modalita:'ral'|'lordo', voci:Voce[], lorda:number, netta:number, imponibileStimato:number, detassata:{applicabile:boolean, risparmio:number, soglia:number, aliquota:number}}`
  - `Voce = {id:'lorda'|'inps'|'aggiuntivo'|'irpef'|'cuneo', importo:number, base:number, fonte:string, aliquota?:number, soglia?:number, mesi?:number, fasce?:{da,a,aliquota,base,importo}[]}` — `aggiuntivo` e `cuneo` presenti solo se > 0
  - `K`, `PROPOSTA_DETASSATA`, `FONTI`, `imponibileAnnuo(BigInt)→BigInt`, `dec`, `toNumber`

- [ ] **Step 1: test che falliscono** — `prototipo/tredicesima.test.js`:

```js
const assert=require('node:assert/strict');
const {test}=require('node:test');
const T=require('./tredicesima.js');
const M=require('./motore.js');

const importi=r=>Object.fromEntries(r.voci.map(v=>[v.id,v.importo]));
const somma=r=>r.voci.reduce((t,v)=>t+(v.id==='lorda'||v.id==='cuneo'?v.importo:-v.importo),0);

test('le costanti coincidono con quelle del motore',()=>{
  for(const k of ['aliquotaIvs','massimale','primaFascia','aliquotaAggiuntivo'])
    assert.equal(T.K.contributi[k],M.K.contributi[k],k);
  assert.deepEqual(T.K.irpef.scaglioni,M.K.irpef.scaglioni);
  assert.deepEqual(T.K.sommaNonImponibile.aliquote,M.K.sommaNonImponibile.aliquote);
  for(const ral of ['15000','30000','60000','130000'])
    assert.equal(T.imponibileAnnuo(T.dec(ral)),M.imponibile(M.dec(ral)),ral);
});

test('casi di controllo su 13 mensilità e anno intero',()=>{
  assert.deepEqual(importi(T.calcolaDaRal({ral:'15000'})),{lorda:1153.85,inps:106.04,irpef:241,cuneo:55.53});
  assert.deepEqual(importi(T.calcolaDaRal({ral:'20000'})),{lorda:1538.46,inps:141.38,irpef:321.33,cuneo:67.06});
  assert.deepEqual(importi(T.calcolaDaRal({ral:'30000'})),{lorda:2307.69,inps:212.08,irpef:481.99});
  assert.deepEqual(importi(T.calcolaDaRal({ral:'35000'})),{lorda:2692.31,inps:247.42,aggiuntivo:7,irpef:571.17});
  assert.deepEqual(importi(T.calcolaDaRal({ral:'40000'})),{lorda:3076.92,inps:282.77,aggiuntivo:14.69,irpef:683.89});
  assert.equal(T.calcolaDaRal({ral:'15000'}).netta,862.34);
  assert.equal(T.calcolaDaRal({ral:'30000'}).netta,1613.62);
  assert.equal(T.calcolaDaRal({ral:'35000'}).netta,1866.72);
  assert.equal(T.calcolaDaRal({ral:'40000'}).netta,2095.57);
});

test('IRPEF con gli scaglioni ragguagliati a mese, fascia per fascia',()=>{
  const irpef=T.calcolaDaRal({ral:'35000'}).voci.find(v=>v.id==='irpef');
  assert.equal(irpef.fasce.length,2);
  assert.equal(irpef.fasce[0].a,2333.33333333);
  assert.equal(irpef.fasce[0].aliquota,0.23);
  assert.equal(irpef.fasce[1].aliquota,0.33);
  assert.equal(irpef.fasce.reduce((t,f)=>t+f.importo,0).toFixed(2),irpef.importo.toFixed(2));
  const alto=T.calcolaDaLordo({lordo:'9000'}).voci.find(v=>v.id==='irpef');
  assert.equal(alto.fasce.length,3);
  assert.equal(alto.fasce[2].a,null);
});

test('mesi lavorati: la tredicesima matura in ratei',()=>{
  assert.equal(T.calcolaDaRal({ral:'30000',mesi:8}).lorda,1538.46);
  assert.equal(T.calcolaDaLordo({lordo:'1200',mesi:6}).lorda,600);
});

test('le due modalità danno lo stesso risultato sullo stesso mensile',()=>{
  const daRal=T.calcolaDaRal({ral:'30000'}),daLordo=T.calcolaDaLordo({lordo:'2307.69'});
  assert.deepEqual(importi(daRal),importi(daLordo));
  assert.equal(T.calcolaDaRal({ral:'28000',mensilita:14}).lorda,2000);
});

test('contributo aggiuntivo: solo la quota che si deve alla tredicesima',()=>{
  assert.equal(importi(T.calcolaDaRal({ral:'30000'})).aggiuntivo,undefined);
  /* 4.000 + 4.000 = 8.000 a dicembre: 1% su 3.315 */
  assert.equal(importi(T.calcolaDaLordo({lordo:'4000'})).aggiuntivo,33.15);
  /* già sopra soglia col solo stipendio: 1% su tutta la tredicesima */
  assert.equal(importi(T.calcolaDaLordo({lordo:'5000'})).aggiuntivo,50);
});

test('bonus cuneo: spetta sul reddito dell\'anno, percentuale sul reddito teorico',()=>{
  assert.ok(importi(T.calcolaDaRal({ral:'22024'})).cuneo>0);
  assert.equal(importi(T.calcolaDaRal({ral:'22025'})).cuneo,undefined);
  /* 12.000 di RAL per 6 mesi: reddito dell'anno ~5.449, teorico ~10.897 → 5,3% */
  const breve=T.calcolaDaRal({ral:'12000',mesi:6}).voci.find(v=>v.id==='cuneo');
  assert.equal(breve.aliquota,0.053);
  assert.equal(breve.importo,22.21);
  /* 30.000 di RAL per 8 mesi: reddito dell'anno 18.162 → spetta, teorico 27.243 → 4,8% */
  assert.equal(T.calcolaDaRal({ral:'30000',mesi:8}).voci.find(v=>v.id==='cuneo').aliquota,0.048);
});

test('la netta riconcilia con le voci su una griglia di casi',()=>{
  for(const ral of ['1000','9000','16518','22024','35000','56224','90000','120000'])
    for(const mesi of [1,6,12])for(const mensilita of [13,14]){
      const r=T.calcolaDaRal({ral,mensilita,mesi});
      assert.equal(somma(r).toFixed(2),r.netta.toFixed(2),`${ral} ${mensilita} ${mesi}`);
    }
});

test('proposta detassata: risparmio sotto soglia, zero sopra',()=>{
  const sotto=T.calcolaDaRal({ral:'15000'}).detassata;
  assert.deepEqual(sotto,{applicabile:true,risparmio:83.83,soglia:15000,aliquota:0.15});
  assert.equal(T.calcolaDaRal({ral:'16518'}).detassata.risparmio,92.31);
  assert.deepEqual(T.calcolaDaRal({ral:'20000'}).detassata,{applicabile:false,risparmio:0,soglia:15000,aliquota:0.15});
});
```

- [ ] **Step 2: eseguire e vedere il fallimento**

Run: `node --test prototipo/tredicesima.test.js`
Expected: FAIL, `Cannot find module './tredicesima.js'`

- [ ] **Step 3: implementazione** — `prototipo/tredicesima.js`:

```js
/* ============================================================
   TREDICESIMA — la trattenuta di dicembre sulla sola mensilità
   aggiuntiva. Regole 2026, lavoro dipendente privato.

   Non carica motore.js: nel browser il motore si porta dietro
   4 MB di addizionali che qui non servono (sulla tredicesima non
   si trattengono). Le poche costanti stanno qui sotto e
   tredicesima.test.js verifica che coincidano con K del motore:
   se una cambia là e non qui, il test si rompe.

   Qui dentro escono NUMERI (voci). Le righe le compone la pagina.
   ============================================================ */
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.TREDICESIMA=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  /* IMPALCATURA — virgola fissa su BigInt (scala 1e8), come nel motore. */
  const SC=8n,S=10n**8n,CENT=10n**6n;
  function dec(x){const s=String(x).trim();const neg=s.startsWith('-');
    const[i,f='']=(neg?s.slice(1):s).split('.');
    const frac=(f+'0'.repeat(Number(SC))).slice(0,Number(SC));
    const v=BigInt(i||'0')*S+BigInt(frac||'0');return neg?-v:v;}
  const mul=(a,b)=>(a*b)/S;
  const div=(a,b)=>(a*S)/b;
  const min=(a,b)=>a<b?a:b;
  const positivo=a=>a>0n?a:0n;
  const toNumber=a=>Number(a)/1e8;
  const arrotondaCentesimi=a=>{const neg=a<0n,x=neg?-a:a;const q=x/CENT,r=x%CENT;
    const y=(r*2n>=CENT?q+1n:q)*CENT;return neg?-y:y;};

  /* COSTANTI — stessi valori di K in motore.js (verificato dai test). */
  const K={
    contributi:{
      aliquotaIvs:dec('0.0919'),          // INPS circ. 101/2024
      massimale:dec('122295'),            // INPS circ. 6/2026
      primaFascia:dec('56224'),           // INPS circ. 6/2026
      aliquotaAggiuntivo:dec('0.01'),
      /* La soglia mensile la fissa la circolare, arrotondata: non è
         56.224 / 12 = 4.685,33. */
      primaFasciaMensile:dec('4685'),     // INPS circ. 6/2026
    },
    irpef:{                               // L. 199/2025, art. 1 c. 3
      scaglioni:[[dec('28000'),dec('0.23')],[dec('50000'),dec('0.33')],[null,dec('0.43')]],
    },
    sommaNonImponibile:{                  // L. 207/2024, art. 1 c. 4-5
      aliquote:[[dec('8500'),dec('0.071')],[dec('15000'),dec('0.053')],[dec('20000'),dec('0.048')]],
    },
  };
  const MESI_ANNO=dec('12');
  /* In modalità "lordo mensile" non conosciamo le mensilità: la
     stima dell'anno usa 13, e la pagina lo dichiara. */
  const MENSILITA_ANNUE_STIMA=dec('13');

  /* PROPOSTA, NON LEGGE. Ipotesi riportata da Sky TG24 il
     28/08/2026 per la Legge di Bilancio 2027: sostitutiva al 15%
     fino a 15.000 € di reddito. Da aggiornare quando c'è un testo. */
  const PROPOSTA_DETASSATA={aliquota:dec('0.15'),soglia:dec('15000')};

  const FONTI={
    lorda:'Prassi dei CCNL: una mensilità in più, maturata in ratei per i mesi lavorati',
    inps:'INPS, circolare 101/2024',
    aggiuntivo:'INPS, circolare 6/2026',
    irpef:'D.Lgs. 33/2025, art. 33 c. 3 lett. b; Agenzia delle Entrate, circolare 15/2007',
    cuneo:'L. 207/2024, art. 1 c. 4-5; Agenzia delle Entrate, circolare 4/2025',
  };

  /* Contributi e imponibile dell'anno, come imponibile() del
     motore: servono solo per il bonus cuneo e per la proposta. */
  function imponibileAnnuo(retribuzioneAnnua){
    const base=min(retribuzioneAnnua,K.contributi.massimale);
    const ivs=arrotondaCentesimi(mul(base,K.contributi.aliquotaIvs));
    const aggiuntivo=arrotondaCentesimi(mul(positivo(base-K.contributi.primaFascia),K.contributi.aliquotaAggiuntivo));
    return retribuzioneAnnua-ivs-aggiuntivo;
  }

  /* Gli scaglioni annui ragguagliati a mese, applicati alla sola
     tredicesima. Ogni fascia è arrotondata al centesimo: la somma
     delle fasce mostrate È l'IRPEF trattenuta. */
  function irpefPerFasce(base){
    const fasce=[];let precedente=0n;
    for(const[tettoAnnuo,aliquota]of K.irpef.scaglioni){
      const tetto=tettoAnnuo===null?null:div(tettoAnnuo,MESI_ANNO);
      const cima=tetto===null?base:min(base,tetto);
      if(cima>precedente)fasce.push({da:precedente,a:tetto,aliquota,base:cima-precedente,
        importo:arrotondaCentesimi(mul(cima-precedente,aliquota))});
      if(tetto===null||base<=tetto)break;
      precedente=tetto;
    }
    return fasce;
  }

  /* Circ. AdE 4/2025: se il bonus spetta lo decide il reddito
     dell'anno (fino a 20.000 €); la percentuale si sceglie sul
     reddito rapportato all'anno intero. Sopra 15.000 € di reddito
     teorico vale l'ultima percentuale. */
  function aliquotaCuneo(imponibileAnno,imponibileTeorico){
    const tabella=K.sommaNonImponibile.aliquote;
    if(imponibileAnno>tabella[tabella.length-1][0])return null;
    const riga=tabella.find(([tetto])=>imponibileTeorico<=tetto)??tabella[tabella.length-1];
    return riga[1];
  }

  function calcolaVoci({mensile,mesi,imponibileStimato,imponibileTeorico}){
    const lorda=arrotondaCentesimi(div(mul(mensile,dec(mesi)),MESI_ANNO));
    const inps=arrotondaCentesimi(mul(lorda,K.contributi.aliquotaIvs));
    /* Mensilizzazione: a dicembre tredicesima e stipendio fanno un
       mese solo. Conta la quota di eccedenza dovuta alla tredicesima. */
    const soglia=K.contributi.primaFasciaMensile;
    const eccedenza=positivo(mensile+lorda-soglia)-positivo(mensile-soglia);
    const aggiuntivo=arrotondaCentesimi(mul(eccedenza,K.contributi.aliquotaAggiuntivo));
    const baseIrpef=lorda-inps-aggiuntivo;
    const fasce=irpefPerFasce(baseIrpef);
    const irpef=fasce.reduce((t,f)=>t+f.importo,0n);
    const aliquotaBonus=aliquotaCuneo(imponibileStimato,imponibileTeorico);
    const cuneo=aliquotaBonus===null?0n:arrotondaCentesimi(mul(baseIrpef,aliquotaBonus));
    const netta=lorda-inps-aggiuntivo-irpef+cuneo;
    const proposta=imponibileStimato<=PROPOSTA_DETASSATA.soglia;
    const risparmio=proposta?positivo(irpef-arrotondaCentesimi(mul(baseIrpef,PROPOSTA_DETASSATA.aliquota))):0n;
    return{lorda,inps,aggiuntivo,eccedenza,baseIrpef,fasce,irpef,aliquotaBonus,cuneo,netta,
      detassata:{applicabile:proposta,risparmio}};
  }

  /* Riconciliazione: le voci mostrate devono ricostruire la netta
     al centesimo. È una guardia, non una prova di correttezza. */
  function riconcilia(voci,netta){
    const totale=voci.reduce((t,v)=>t+(v.id==='lorda'||v.id==='cuneo'?dec(v.importo):-dec(v.importo)),0n);
    if(totale!==netta)throw new Error(`Riconciliazione fallita: ${toNumber(totale)} ≠ ${toNumber(netta)}`);
  }

  const n=toNumber;
  function presenta(v,{mensile,mesi,imponibileStimato}){
    const voci=[
      {id:'lorda',importo:n(v.lorda),base:n(mensile),mesi,fonte:FONTI.lorda},
      {id:'inps',importo:n(v.inps),base:n(v.lorda),aliquota:n(K.contributi.aliquotaIvs),fonte:FONTI.inps},
    ];
    if(v.aggiuntivo>0n)voci.push({id:'aggiuntivo',importo:n(v.aggiuntivo),base:n(v.eccedenza),
      soglia:n(K.contributi.primaFasciaMensile),aliquota:n(K.contributi.aliquotaAggiuntivo),fonte:FONTI.aggiuntivo});
    voci.push({id:'irpef',importo:n(v.irpef),base:n(v.baseIrpef),fonte:FONTI.irpef,
      fasce:v.fasce.map(f=>({da:n(f.da),a:f.a===null?null:n(f.a),aliquota:n(f.aliquota),base:n(f.base),importo:n(f.importo)}))});
    if(v.cuneo>0n)voci.push({id:'cuneo',importo:n(v.cuneo),base:n(v.baseIrpef),aliquota:n(v.aliquotaBonus),fonte:FONTI.cuneo});
    riconcilia(voci,v.netta);
    return{voci,lorda:n(v.lorda),netta:n(v.netta),imponibileStimato:n(imponibileStimato),
      detassata:{applicabile:v.detassata.applicabile,risparmio:n(v.detassata.risparmio),
        soglia:n(PROPOSTA_DETASSATA.soglia),aliquota:n(PROPOSTA_DETASSATA.aliquota)}};
  }

  /* Importi come stringhe decimali con il punto ("30000", "2307.69"). */
  function calcolaDaRal({ral,mensilita=13,mesi=12}){
    const R=dec(ral);
    const mensile=div(R,dec(mensilita));
    const ctx={mensile,mesi,imponibileStimato:imponibileAnnuo(div(mul(R,dec(mesi)),MESI_ANNO)),
      imponibileTeorico:imponibileAnnuo(R)};
    return{modalita:'ral',...presenta(calcolaVoci(ctx),ctx)};
  }
  function calcolaDaLordo({lordo,mesi=12}){
    const mensile=dec(lordo),annua=mul(mensile,MENSILITA_ANNUE_STIMA);
    const ctx={mensile,mesi,imponibileStimato:imponibileAnnuo(div(mul(annua,dec(mesi)),MESI_ANNO)),
      imponibileTeorico:imponibileAnnuo(annua)};
    return{modalita:'lordo',...presenta(calcolaVoci(ctx),ctx)};
  }

  return{calcolaDaRal,calcolaDaLordo,K,PROPOSTA_DETASSATA,FONTI,imponibileAnnuo,dec,toNumber};
});
```

- [ ] **Step 4: test verdi**

Run: `node --test prototipo/tredicesima.test.js`
Expected: PASS, 9 test. Se `22024` non dà cuneo (dipende dall'arrotondamento dei contributi), trovare con uno script la RAL intera più alta con `imponibileStimato ≤ 20000` e usare quella e la successiva: il confine è ciò che si prova, non il numero.

- [ ] **Step 5: commit**

```bash
git add prototipo/tredicesima.js prototipo/tredicesima.test.js
git commit -m "feat(RIC-76): motore della tredicesima con ritenuta a scaglioni mensili"
```

### Task 2: lettura dell'input e query string

**Files:**
- Modify: `prototipo/tredicesima.js` (nuove funzioni prima del `return`, esportate)
- Test: `prototipo/tredicesima.test.js` (aggiunte)

**Interfaces:**
- Consumes: `calcolaDaRal`, `calcolaDaLordo`, `dec` (Task 1)
- Produces:
  - `normalizza({modalita:string, importo:string, mensilita?:string, mesi?:string}) → {errore:{campo:'modalita'|'importo'|'mensilita'|'mesi', messaggio:string}} | {modalita:'ral', ral:string, mensilita:13|14, mesi:number} | {modalita:'lordo', lordo:string, mesi:number}`
  - `calcola(input normalizzato) → Risultato`
  - `daQuery(search:string) → {modalita, importo, mensilita?, mesi} | null`
  - `LIMITI = {lordo:{min:'100',max:'9000'}, ral:{min:'1000',max:'120000'}}`

- [ ] **Step 1: test che falliscono** — in coda a `prototipo/tredicesima.test.js`:

```js
test('importi scritti come li scrive una persona',()=>{
  const ral=importo=>T.normalizza({modalita:'ral',importo}).ral;
  assert.equal(ral('30000'),'30000');
  assert.equal(ral('30.000'),'30000');
  assert.equal(ral('30.000,50'),'30000.50');
  assert.equal(ral('€ 30 000'),'30000');
  assert.equal(T.normalizza({modalita:'lordo',importo:'2.300,5'}).lordo,'2300.5');
});

test('input non validi: messaggio sul campo giusto',()=>{
  const campo=input=>T.normalizza(input).errore?.campo;
  assert.equal(campo({modalita:'ral',importo:''}),'importo');
  assert.equal(campo({modalita:'ral',importo:'abc'}),'importo');
  assert.equal(campo({modalita:'ral',importo:'-5000'}),'importo');
  assert.equal(campo({modalita:'ral',importo:'999'}),'importo');
  assert.equal(campo({modalita:'ral',importo:'120001'}),'importo');
  assert.equal(campo({modalita:'lordo',importo:'99'}),'importo');
  assert.equal(campo({modalita:'lordo',importo:'9000.01'}),'importo');
  assert.equal(campo({modalita:'ral',importo:'30000',mesi:'0'}),'mesi');
  assert.equal(campo({modalita:'ral',importo:'30000',mesi:'13'}),'mesi');
  assert.equal(campo({modalita:'ral',importo:'30000',mesi:'8.5'}),'mesi');
  assert.equal(campo({modalita:'ral',importo:'30000',mensilita:'15'}),'mensilita');
  assert.equal(campo({modalita:'altro',importo:'30000'}),'modalita');
  assert.match(T.normalizza({modalita:'ral',importo:'120001'}).errore.messaggio,/120\.000/);
});

test('input valido: calcola passa alla modalità giusta',()=>{
  const r=T.calcola(T.normalizza({modalita:'ral',importo:'30.000',mensilita:'13',mesi:'12'}));
  assert.equal(r.modalita,'ral');assert.equal(r.netta,1613.62);
  assert.equal(T.calcola(T.normalizza({modalita:'lordo',importo:'2.307,69'})).netta,1613.62);
});

test('query string: precompila, ma non inventa',()=>{
  assert.deepEqual(T.daQuery('?ral=30000&mesi=8'),{modalita:'ral',importo:'30000',mensilita:'13',mesi:'8'});
  assert.deepEqual(T.daQuery('?lordo=2300'),{modalita:'lordo',importo:'2300',mesi:'12'});
  assert.equal(T.daQuery(''),null);
  assert.equal(T.daQuery('?utm_source=x'),null);
  /* una query illeggibile si legge, ma normalizza la rifiuta: la pagina resta vuota */
  assert.ok(T.normalizza(T.daQuery('?ral=abc')).errore);
  assert.ok(T.normalizza(T.daQuery('?ral=30000&mesi=0')).errore);
});
```

- [ ] **Step 2: eseguire e vedere il fallimento**

Run: `node --test prototipo/tredicesima.test.js`
Expected: FAIL, `T.normalizza is not a function`

- [ ] **Step 3: implementazione** — in `prototipo/tredicesima.js`, prima di `return{calcolaDaRal,...}`:

```js
  /* ---------- l'input come lo scrive una persona ---------- */
  const LIMITI=Object.freeze({lordo:{min:'100',max:'9000'},ral:{min:'1000',max:'120000'}});
  const MENSILITA=Object.freeze([13,14]);
  const euro=s=>Number(s).toLocaleString('it-IT');

  /* "30.000,50" → "30000.50". null se vuoto, undefined se illeggibile. */
  function leggiImporto(raw){
    let s=String(raw??'').replace(/[\s €]/g,'');
    if(!s)return null;
    if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');
    else if(/^\d{1,3}(\.\d{3})+$/.test(s))s=s.replace(/\./g,'');
    return /^\d+(\.\d{1,2})?$/.test(s)?s:undefined;
  }

  function normalizza({modalita,importo,mensilita='13',mesi='12'}){
    if(!(modalita in LIMITI))return{errore:{campo:'modalita',messaggio:'Scegli da cosa partire.'}};
    const nome=modalita==='lordo'?'il lordo mensile':'la RAL';
    const valore=leggiImporto(importo);
    if(valore===null)return{errore:{campo:'importo',messaggio:`Inserisci ${nome}.`}};
    if(valore===undefined)return{errore:{campo:'importo',messaggio:'Usa solo cifre, con la virgola per i centesimi.'}};
    const{min:da,max:a}=LIMITI[modalita];
    if(dec(valore)<dec(da)||dec(valore)>dec(a))
      return{errore:{campo:'importo',messaggio:`Il calcolatore copre ${nome} da ${euro(da)} a ${euro(a)} €.`}};
    const m=Number(String(mesi).trim()||NaN);
    if(!Number.isInteger(m)||m<1||m>12)return{errore:{campo:'mesi',messaggio:'I mesi lavorati vanno da 1 a 12.'}};
    if(modalita==='lordo')return{modalita,lordo:valore,mesi:m};
    const k=Number(mensilita);
    if(!MENSILITA.includes(k))return{errore:{campo:'mensilita',messaggio:'Le mensilità possono essere 13 o 14.'}};
    return{modalita,ral:valore,mensilita:k,mesi:m};
  }

  function calcola(input){return input.modalita==='lordo'?calcolaDaLordo(input):calcolaDaRal(input);}

  function daQuery(search){
    const p=new URLSearchParams(search);
    if(p.has('lordo'))return{modalita:'lordo',importo:p.get('lordo'),mesi:p.get('mesi')??'12'};
    if(p.has('ral'))return{modalita:'ral',importo:p.get('ral'),mensilita:p.get('mensilita')??'13',mesi:p.get('mesi')??'12'};
    return null;
  }
```

E sostituire la riga `return{...}` finale con:

```js
  return{calcolaDaRal,calcolaDaLordo,normalizza,calcola,daQuery,LIMITI,K,PROPOSTA_DETASSATA,FONTI,imponibileAnnuo,dec,toNumber};
```

- [ ] **Step 4: test verdi**

Run: `node --test prototipo/tredicesima.test.js`
Expected: PASS, 13 test.

- [ ] **Step 5: commit**

```bash
git add prototipo/tredicesima.js prototipo/tredicesima.test.js
git commit -m "feat(RIC-76): lettura dell'input e della query per la tredicesima"
```

### Task 3: la pagina `/calcolo-tredicesima/`

**Files:**
- Create: `prototipo/calcolo-tredicesima/index.html`
- Create: `prototipo/calcolo-tredicesima.test.js`
- Modify: `prototipo/seo.test.js` (array `publicPages`)
- Modify: `prototipo/genera-pagine-ral.js:8-…` (array `PUBLIC_PAGES`)
- Regenerate: `prototipo/sitemap.xml` via `node prototipo/genera-pagine-ral.js`

**Interfaces:**
- Consumes: `TREDICESIMA.normalizza`, `.calcola`, `.daQuery` (Task 2); `gtag` opzionale.

- [ ] **Step 1: test che falliscono** — `prototipo/calcolo-tredicesima.test.js`:

```js
const assert=require('node:assert/strict');
const {test}=require('node:test');
const {readFileSync}=require('node:fs');
const {resolve}=require('node:path');
const html=readFileSync(resolve(__dirname,'calcolo-tredicesima/index.html'),'utf8');

test('la pagina carica il modulo e non il motore',()=>{
  assert.match(html,/<script src="\.\.\/tredicesima\.js"><\/script>/);
  assert.doesNotMatch(html,/motore\.js|dati-addizionali/);
});

test('le FAQ stanno nell\'HTML statico e coincidono con il JSON-LD',()=>{
  const blocchi=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
  const faq=blocchi.find(b=>b['@type']==='FAQPage');
  assert.ok(blocchi.find(b=>b['@type']==='WebApplication'));
  assert.ok(faq.mainEntity.length>=4);
  for(const q of faq.mainEntity)assert.ok(html.includes(`<h3>${q.name}</h3>`),q.name);
});

test('titolo e H1 contengono la keyword',()=>{
  assert.match(html,/<title>Calcolo tredicesima 2026/);
  assert.match(html,/<h1>[^<]*[Cc]alcolo (della )?tredicesima/);
});

test('la sitemap contiene la pagina',()=>{
  assert.match(readFileSync(resolve(__dirname,'sitemap.xml'),'utf8'),/<loc>https:\/\/www\.dovevalatuaral\.com\/calcolo-tredicesima\/<\/loc>/);
});
```

In `prototipo/seo.test.js`, dentro `publicPages`, dopo la riga di `netto-o-niente.html`:

```js
  ['calcolo-tredicesima/index.html', `${canonicalOrigin}/calcolo-tredicesima/`],
```

- [ ] **Step 2: eseguire e vedere il fallimento**

Run: `node --test prototipo/calcolo-tredicesima.test.js prototipo/seo.test.js`
Expected: FAIL, `ENOENT … calcolo-tredicesima/index.html`

- [ ] **Step 3: la pagina** — `prototipo/calcolo-tredicesima/index.html`:

```html
<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Calcolo della tredicesima 2026, lorda e netta: parti dal lordo mensile o dalla RAL, indica i mesi lavorati e vedi contributi, IRPEF trattenuta a dicembre e fonti.">
<title>Calcolo tredicesima 2026: lorda e netta, con i mesi lavorati | Dove va la tua RAL</title>
<link rel="canonical" href="https://www.dovevalatuaral.com/calcolo-tredicesima/">
<link rel="stylesheet" href="../draftsman.css">
<style>
body{padding-bottom:0}.pg{width:min(100% - (var(--gutter) * 2),1180px);margin-inline:auto}
.pagehero{position:relative;padding:clamp(26px,3.2vw,46px) 0 clamp(22px,2.6vw,34px);background-image:radial-gradient(circle at 1px 1px,var(--line) 1px,transparent 0),linear-gradient(to right,var(--line) 1px,transparent 1px),linear-gradient(to bottom,var(--line) 1px,transparent 1px);background-size:24px 24px,192px 192px,192px 192px;border-bottom:var(--bw) dashed var(--line-strong)}
.pagehero h1{font-family:var(--font-display);font-weight:800;font-stretch:var(--wdth);font-size:clamp(2rem,3.6vw,3.15rem);line-height:var(--lh-snug);letter-spacing:var(--ls-display);margin:0 0 var(--s-3);max-width:22ch;text-wrap:balance}
.pagehero p{margin:0;max-width:62ch;font-size:var(--t-body);line-height:1.55;color:var(--fg-muted)}
.pagehero .meta{display:flex;gap:var(--s-2);flex-wrap:wrap;margin-top:var(--s-5)}
.t-form{margin-top:clamp(18px,2vw,26px);border:var(--bw-thick) solid var(--line-solid);background:var(--bg-raised);padding:clamp(18px,2.4vw,26px);box-shadow:var(--lift-md) var(--line-solid)}
.t-form h2{margin:0 0 var(--s-5);font-size:var(--t-h4)}
.modi{display:flex;gap:0;border:0;padding:0;margin:0 0 var(--s-5)}.modi legend{margin-bottom:var(--s-2);font:500 var(--t-sm)/1.4 var(--font-mono)}
.modi label{display:inline-flex;align-items:center;gap:var(--s-2);padding:var(--s-2) var(--s-4);border:var(--bw) solid var(--line-strong);cursor:pointer}
.modi label+label{border-left:0}.modi input{accent-color:currentColor}
.campi{display:grid;gap:var(--s-5);grid-template-columns:repeat(auto-fit,minmax(200px,1fr));max-width:760px}
.campi [hidden]{display:none}
.ingroup{display:flex}.ingroup .affix{display:grid;place-items:center;width:44px;flex:none;border:var(--bw) solid var(--line-strong);border-right:0;background:var(--bg-sunken);font:500 var(--t-sm)/1 var(--font-mono);color:var(--fg-muted)}
.ingroup .input{flex:1;min-width:0}.errore{margin:var(--s-2) 0 0;font:400 var(--t-xs)/1.5 var(--font-mono);color:var(--danger,#b3261e)}
.azioni{display:flex;align-items:center;gap:var(--s-4);flex-wrap:wrap;margin-top:var(--s-5);padding-top:var(--s-5);border-top:var(--bw) dashed var(--line-strong)}
.result{margin-top:clamp(28px,3.4vw,48px);padding-top:var(--s-8);border-top:var(--bw) solid var(--line-strong)}.result[hidden]{display:none}
.result h2{margin:0 0 var(--s-4);font-size:var(--t-h3)}
.result__box{border:var(--bw-thick) solid var(--line-solid);background:var(--bg-raised);padding:clamp(18px,2.4vw,28px);box-shadow:var(--lift-md) var(--line-solid)}
.result__netta{display:block;margin:var(--s-2) 0 var(--s-5);font:800 clamp(1.9rem,3.4vw,2.75rem)/var(--lh-snug) var(--font-display);font-variant-numeric:tabular-nums;letter-spacing:var(--ls-display)}
.righe{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}
.righe th,.righe td{padding:var(--s-3) 0;border-top:var(--bw) dashed var(--line-strong);text-align:left;vertical-align:top}
.righe td:last-child{text-align:right;white-space:nowrap;padding-left:var(--s-4)}
.righe .formula{display:block;margin-top:var(--s-1);font:400 var(--t-xs)/1.5 var(--font-mono);color:var(--fg-muted)}
.righe tfoot th,.righe tfoot td{border-top:var(--bw-thick) solid var(--line-solid);font-weight:700}
.nota{margin:var(--s-5) 0 0;max-width:74ch;font-size:var(--t-sm);color:var(--fg-muted)}
.detassata{margin-top:var(--s-6)}
.contenuti{max-width:74ch;margin:clamp(40px,5vw,72px) 0}.contenuti h2{font-size:var(--t-h3)}.contenuti h3{font-size:var(--t-h5,1.1rem);margin-top:var(--s-6)}
.fonti{font-size:var(--t-sm)}.fonti li{margin-bottom:var(--s-2)}
.t-footer{margin-top:clamp(40px,5vw,72px);padding:var(--s-10) var(--s-4) var(--s-12);text-align:center;border-top:var(--bw) solid var(--line-strong);font:400 var(--t-xs)/1.6 var(--font-mono);color:var(--fg-muted)}
</style>
<script src="../analytics.js" async></script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebApplication","name":"Calcolo tredicesima 2026","url":"https://www.dovevalatuaral.com/calcolo-tredicesima/","applicationCategory":"FinanceApplication","operatingSystem":"Web","inLanguage":"it","isAccessibleForFree":true,"offers":{"@type":"Offer","price":"0","priceCurrency":"EUR"}}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[
{"@type":"Question","name":"Come si calcola la tredicesima?","acceptedAnswer":{"@type":"Answer","text":"La tredicesima lorda è una mensilità in più: lo stipendio lordo mensile, oppure la RAL divisa per le mensilità del contratto. Se hai lavorato solo una parte dell'anno matura in ratei: lordo mensile per mesi lavorati, diviso 12."}},
{"@type":"Question","name":"Perché la tredicesima è tassata di più?","acceptedAnswer":{"@type":"Answer","text":"Perché l'IRPEF si trattiene sulla sola tredicesima con gli scaglioni annui divisi per 12 e senza detrazioni da lavoro dipendente, che invece riducono la ritenuta sugli stipendi ordinari. Il conguaglio di fine anno ricalcola l'imposta sul totale."}},
{"@type":"Question","name":"Quando si paga la tredicesima?","acceptedAnswer":{"@type":"Answer","text":"Di norma con lo stipendio di dicembre, entro la data fissata dal contratto collettivo. Se il rapporto finisce prima, i ratei maturati si pagano con l'ultima busta paga."}},
{"@type":"Question","name":"Se ho lavorato solo qualche mese?","acceptedAnswer":{"@type":"Answer","text":"Ti spettano tanti dodicesimi quanti sono i mesi lavorati. Di solito una frazione di almeno 15 giorni conta come mese intero, ma la regola esatta la stabilisce il tuo CCNL."}}]}</script>
</head>
<body>
<a class="skip-link" href="#contenuto">Vai al contenuto</a>
<header class="site-header"><div class="site-header__in">
  <a class="site-brand" href="../index.html" aria-label="Dove va la tua RAL — home">Dove va la tua RAL</a>
  <button class="site-menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav"><span class="site-menu-toggle__icon" aria-hidden="true"></span><span class="sr">Apri il menu</span></button>
  <nav class="site-nav" id="site-nav" aria-label="Navigazione principale"><div class="site-nav__group" data-current><button class="site-nav__trigger" type="button" aria-expanded="false" aria-controls="nav-calcola">Calcola</button><div class="site-nav__submenu" id="nav-calcola"><a href="../index.html">RAL → Netto</a><a href="../netto-ral.html">Netto → RAL</a><a href="../ccnl-livello.html">CCNL e livello</a><a href="/calcolo-tredicesima/" aria-current="page">Tredicesima</a></div></div><div class="site-nav__group"><button class="site-nav__trigger" type="button" aria-expanded="false" aria-controls="nav-confronta">Confronta</button><div class="site-nav__submenu" id="nav-confronta"><a href="../compara.html">Due offerte</a><a href="../confronti-ral/">Livelli di RAL</a></div></div><a href="../netto-o-niente.html">Gioca</a><a href="/blog/">Blog</a><a href="../la-storia.html">La storia</a></nav>
</div></header>
<main id="contenuto">
  <div class="pagehero"><div class="pg">
    <div class="eyebrow">Tredicesima</div>
    <h1>Calcolo della tredicesima 2026, lorda e netta</h1>
    <p>Tre campi: lordo mensile o RAL, e i mesi lavorati. Non ti chiediamo il comune né i familiari a carico, perché sulla tredicesima non si trattengono addizionali e non si applicano detrazioni.</p>
    <div class="meta"><span class="tag tag--flux">Regole 2026</span><span class="tag">Dipendente privato</span><span class="tag">Trattenuta di dicembre</span></div>
  </div></div>
  <div class="pg">
  <section class="t-form" aria-labelledby="form-title">
    <h2 id="form-title">Il tuo caso</h2>
    <form id="t-form" novalidate>
      <fieldset class="modi"><legend>Parto da</legend>
        <label><input type="radio" name="modalita" value="lordo" checked> Lordo mensile</label>
        <label><input type="radio" name="modalita" value="ral"> RAL</label>
      </fieldset>
      <div class="campi">
        <div class="field"><label class="label" for="importo" id="importo-label">Stipendio lordo mensile</label>
          <div class="ingroup"><span class="affix" aria-hidden="true">€</span><input class="input" id="importo" name="importo" inputmode="decimal" autocomplete="off" aria-describedby="importo-help importo-errore"></div>
          <p class="hint" id="importo-help">Il lordo della busta paga, prima di contributi e tasse.</p>
          <p class="errore" id="importo-errore" hidden></p></div>
        <div class="field" id="campo-mensilita" hidden><label class="label" for="mensilita">Mensilità</label>
          <select class="input" id="mensilita" name="mensilita" aria-describedby="mensilita-errore"><option value="13" selected>13</option><option value="14">14</option></select>
          <p class="errore" id="mensilita-errore" hidden></p></div>
        <div class="field"><label class="label" for="mesi">Mesi lavorati nell'anno</label>
          <input class="input" id="mesi" name="mesi" type="number" min="1" max="12" step="1" value="12" inputmode="numeric" aria-describedby="mesi-help mesi-errore">
          <p class="hint" id="mesi-help">Di solito 15 giorni o più contano come mese intero, ma decide il CCNL.</p>
          <p class="errore" id="mesi-errore" hidden></p></div>
      </div>
      <div class="azioni"><button class="btn btn--primary btn--lg" type="submit">Calcola la tredicesima</button></div>
    </form>
  </section>
  <section class="result" id="risultato" aria-live="polite" tabindex="-1" hidden>
    <h2>La tua tredicesima</h2>
    <div class="result__box">
      <span class="micro">Netta, a dicembre</span>
      <strong class="result__netta" id="netta"></strong>
      <table class="righe"><tbody id="righe"></tbody>
        <tfoot><tr><th scope="row">Tredicesima netta</th><td id="netta-riga"></td></tr></tfoot></table>
      <p class="nota" id="nota-stima" hidden>Stima dell'anno su 13 mensilità: in modalità lordo mensile non conosciamo il tuo contratto.</p>
      <p class="nota">È la trattenuta di dicembre. A fine anno il conguaglio ricalcola l'IRPEF sul totale, con le detrazioni, e restituisce l'1% aggiuntivo se nell'anno resti sotto 56.224 €. Non contiamo l'ulteriore detrazione e il trattamento integrativo, che si ripartiscono sui mesi ordinari.</p>
    </div>
    <div class="callout detassata" id="detassata"><span class="callout__mark">Proposta, non legge</span><div id="detassata-testo"></div></div>
  </section>
  <section class="contenuti" aria-labelledby="faq-title">
    <h2 id="faq-title">Domande frequenti</h2>
    <h3>Come si calcola la tredicesima?</h3>
    <p>La tredicesima lorda è una mensilità in più: lo stipendio lordo mensile, oppure la RAL divisa per le mensilità del contratto. Se hai lavorato solo una parte dell'anno matura in ratei: lordo mensile per mesi lavorati, diviso 12.</p>
    <h3>Perché la tredicesima è tassata di più?</h3>
    <p>Perché l'IRPEF si trattiene sulla sola tredicesima con gli scaglioni annui divisi per 12 e senza detrazioni da lavoro dipendente, che invece riducono la ritenuta sugli stipendi ordinari. Il conguaglio di fine anno ricalcola l'imposta sul totale. L'ho spiegato con i numeri nell'<a href="/blog/tredicesima-detassata/">articolo sulla tredicesima detassata</a>.</p>
    <h3>Quando si paga la tredicesima?</h3>
    <p>Di norma con lo stipendio di dicembre, entro la data fissata dal contratto collettivo. Se il rapporto finisce prima, i ratei maturati si pagano con l'ultima busta paga.</p>
    <h3>Se ho lavorato solo qualche mese?</h3>
    <p>Ti spettano tanti dodicesimi quanti sono i mesi lavorati. Di solito una frazione di almeno 15 giorni conta come mese intero, ma la regola esatta la stabilisce il tuo CCNL.</p>
    <h2>Fonti</h2>
    <ul class="fonti">
      <li>D.Lgs. 24 marzo 2025, n. 33, art. 33 c. 3 lett. b — ritenuta sulle mensilità aggiuntive con gli scaglioni annui ragguagliati a mese (<a href="https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2025-03-24;33" rel="noopener">Normattiva</a>)</li>
      <li>Agenzia delle Entrate, circolare 15/2007 — conferma il metodo per la tredicesima (<a href="https://def.finanze.it/DocTribFrontend/getPrassiDetail.do?id=%7BD20F6A55-3E47-44DC-A55F-A88025D3249C%7D" rel="noopener">DEF Finanze</a>)</li>
      <li>L. 30 dicembre 2025, n. 199, art. 1 c. 3 — aliquote IRPEF 2026 (<a href="https://www.normattiva.it/eli/stato/LEGGE/2025/12/30/199/CONSOLIDATED" rel="noopener">Normattiva</a>)</li>
      <li>INPS, circolare 101/2024 — aliquota 9,19% a carico del lavoratore (<a href="https://www.inps.it/it/it/inps-comunica/atti/circolari-messaggi-e-normativa/dettaglio.circolari-e-messaggi.2024.11.circolare-numero-101-del-29-11-2024_14714.html" rel="noopener">INPS</a>)</li>
      <li>INPS, circolare 6/2026 — contributo aggiuntivo 1% oltre 4.685 € al mese, mensilizzazione e conguaglio (<a href="https://www.inps.it/it/it/inps-comunica/atti/circolari-messaggi-e-normativa/dettaglio.circolari-e-messaggi.2026.01.circolare-numero-6-del-30-01-2026_15151.html" rel="noopener">INPS</a>)</li>
      <li>L. 207/2024, art. 1 c. 4-5, e Agenzia delle Entrate, circolare 4/2025 — somma esente del cuneo sul reddito corrisposto nel mese (<a href="https://www.agenziaentrate.gov.it/portale/documents/20143/8410823/Circolare+lavoro+dipendente+LB2025+DD+IRPEF+n.+4+del+16+maggio+2025.pdf/36979eaa-9fc5-a4ec-a7aa-136497c53f91" rel="noopener">Agenzia delle Entrate</a>)</li>
    </ul>
  </section>
  </div>
</main>
<footer class="t-footer">Stima con le regole 2026, non il cedolino. <a href="../come-ho-lavorato.html">Come ho lavorato</a></footer>
<script src="../tredicesima.js"></script><script src="../site-nav.js"></script>
<script>
(()=>{
  const $=id=>document.getElementById(id);
  const form=$('t-form'),box=$('risultato');
  const euro=n=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
  const perc=n=>`${(n*100).toLocaleString('it-IT',{maximumFractionDigits:2})}%`;
  const modalita=()=>form.querySelector('input[name="modalita"]:checked').value;
  const CAMPI=['importo','mensilita','mesi'];

  function aggiornaModalita(){
    const ral=modalita()==='ral';
    $('campo-mensilita').hidden=!ral;
    $('importo-label').textContent=ral?'RAL (retribuzione annua lorda)':'Stipendio lordo mensile';
    $('importo-help').textContent=ral?'Il lordo annuo scritto nel contratto.':'Il lordo della busta paga, prima di contributi e tasse.';
  }
  function pulisci(){
    box.hidden=true;
    for(const c of CAMPI){$(c).removeAttribute('aria-invalid');$(`${c}-errore`).hidden=true;}
  }
  function mostraErrore({campo,messaggio}){
    const c=CAMPI.includes(campo)?campo:'importo';
    $(c).setAttribute('aria-invalid','true');
    $(`${c}-errore`).textContent=messaggio;$(`${c}-errore`).hidden=false;$(c).focus();
  }
  function riga(titolo,formula,importo,segno){
    const tr=document.createElement('tr');
    const th=document.createElement('th');th.scope='row';th.textContent=titolo;
    const f=document.createElement('span');f.className='formula';f.textContent=formula;th.append(f);
    const td=document.createElement('td');td.textContent=`${segno}${euro(importo)}`;
    tr.append(th,td);return tr;
  }
  /* Le righe: la voce dice i numeri, qui si scrive la frase. */
  function righe(r){
    return r.voci.map(v=>{
      if(v.id==='lorda')return riga('Tredicesima lorda',v.mesi===12?`${euro(v.base)} lordi al mese · ${v.fonte}`:`${euro(v.base)} × ${v.mesi} mesi ÷ 12 · ${v.fonte}`,v.importo,'');
      if(v.id==='inps')return riga('Contributi INPS',`${perc(v.aliquota)} della lorda · ${v.fonte}`,v.importo,'−');
      if(v.id==='aggiuntivo')return riga('Contributo aggiuntivo INPS',`${perc(v.aliquota)} su ${euro(v.base)}: a dicembre stipendio e tredicesima superano ${euro(v.soglia)} · ${v.fonte}`,v.importo,'−');
      if(v.id==='irpef')return riga('IRPEF trattenuta',`${v.fasce.map(f=>`${perc(f.aliquota)} su ${euro(f.base)}`).join(' + ')}, senza detrazioni · ${v.fonte}`,v.importo,'−');
      if(v.id==='cuneo')return riga('Bonus cuneo fiscale',`${perc(v.aliquota)} di ${euro(v.base)}, esente · ${v.fonte}`,v.importo,'+');
    });
  }
  function testoDetassata(d){
    const link='<a href="/blog/tredicesima-detassata/">Cosa prevede la proposta</a>';
    return d.applicabile
      ?`<p>Se passasse l'ipotesi della sostitutiva al ${perc(d.aliquota)} fino a ${euro(d.soglia)} di reddito, sulla tua tredicesima risparmieresti <b>${euro(d.risparmio)}</b>. Oggi non è legge. ${link}.</p>`
      :`<p>Con l'ipotesi della sostitutiva al ${perc(d.aliquota)} il tuo risparmio sarebbe <b>0 €</b>: il tuo reddito stimato supera la soglia di ${euro(d.soglia)}. Oggi comunque non è legge. ${link}.</p>`;
  }
  function mostra(r){
    $('netta').textContent=euro(r.netta);$('netta-riga').textContent=euro(r.netta);
    $('righe').replaceChildren(...righe(r));
    $('nota-stima').hidden=r.modalita!=='lordo';
    $('detassata-testo').innerHTML=testoDetassata(r.detassata);
    box.hidden=false;
  }
  function leggiForm(){
    return{modalita:modalita(),importo:$('importo').value,mensilita:$('mensilita').value,mesi:$('mesi').value};
  }
  function esegui({silenzioso=false}={}){
    pulisci();
    const input=TREDICESIMA.normalizza(leggiForm());
    if(input.errore){if(!silenzioso)mostraErrore(input.errore);return;}
    mostra(TREDICESIMA.calcola(input));
    if(!silenzioso)box.focus();
    try{if(typeof window.gtag==='function')window.gtag('event','tredicesima_calcolata',{modalita:input.modalita});}catch(_){/* tracker facoltativo */}
  }

  form.addEventListener('change',e=>{if(e.target.name==='modalita'){aggiornaModalita();pulisci();}});
  form.addEventListener('input',pulisci);
  form.addEventListener('submit',e=>{e.preventDefault();esegui();});

  /* Precompilazione da link (?ral=30000, ?lordo=2300&mesi=8): se i
     valori sono validi calcola subito, altrimenti lascia la pagina vuota. */
  const q=TREDICESIMA.daQuery(location.search);
  if(q&&!TREDICESIMA.normalizza(q).errore){
    form.querySelector(`input[name="modalita"][value="${q.modalita}"]`).checked=true;
    $('importo').value=q.importo;$('mesi').value=q.mesi;if(q.mensilita)$('mensilita').value=q.mensilita;
    aggiornaModalita();esegui({silenzioso:true});
  }else aggiornaModalita();
})();
</script>
</body></html>
```

- [ ] **Step 4: sitemap** — in `prototipo/genera-pagine-ral.js`, dentro `PUBLIC_PAGES`, subito dopo la voce di `netto-o-niente.html` (stesso ordine di `seo.test.js`):

```js
  `${ORIGIN}/calcolo-tredicesima/`,
```

Poi rigenerare: `node prototipo/genera-pagine-ral.js`
Expected: nessun errore (il link dell'articolo a `/calcolo-tredicesima/` ora trova il file). `git diff --stat prototipo/sitemap.xml` mostra l'aggiunta della pagina e dell'articolo sulla tredicesima (il secondo mancava già su main).

- [ ] **Step 5: tutti i test**

Run: `npm test`
Expected: PASS completo (compresi i 3 test di `genera-articoli` che fallivano dal commit `1d5699c`). Se il test della sitemap in `seo.test.js` confronta l'ordine, allineare l'ordine delle due liste.

- [ ] **Step 6: commit**

```bash
git add prototipo/calcolo-tredicesima prototipo/calcolo-tredicesima.test.js prototipo/seo.test.js prototipo/genera-pagine-ral.js prototipo/sitemap.xml prototipo/blog
git commit -m "feat(RIC-76): pagina del calcolatore della tredicesima"
```

### Task 4: collegamenti — menu e pagine RAL

**Files:**
- Modify: tutti i file sotto `prototipo/` che contengono `nav-calcola` (78 oggi: HTML statici, `ral-page.template.js`, `ccnl-page.template.js`, `articolo.template.js`, pagine generate)
- Modify: `prototipo/ral-page.template.js:107` (aside `personalize`)
- Test: `prototipo/calcolo-tredicesima.test.js` (aggiunte)

- [ ] **Step 1: test che falliscono** — in coda a `prototipo/calcolo-tredicesima.test.js`:

```js
const {readdirSync,statSync}=require('node:fs');
function fileConMenu(dir=__dirname,out=[]){
  for(const nome of readdirSync(dir)){
    const p=resolve(dir,nome);
    if(nome==='node_modules'||nome==='vendor')continue;
    if(statSync(p).isDirectory())fileConMenu(p,out);
    else if(/\.(html|js)$/.test(nome)&&!nome.endsWith('.test.js')&&readFileSync(p,'utf8').includes('id="nav-calcola"'))out.push(p);
  }
  return out;
}

test('ogni menu "Calcola" porta alla tredicesima',()=>{
  const file=fileConMenu();
  assert.ok(file.length>=70,`trovati solo ${file.length} file con il menu`);
  for(const f of file)assert.match(readFileSync(f,'utf8'),/<a href="\/calcolo-tredicesima\/"( aria-current="page")?>Tredicesima<\/a>/,f);
});

test('le pagine RAL linkano la tredicesima a quella RAL',()=>{
  assert.match(readFileSync(resolve(__dirname,'ral-30000-netto/index.html'),'utf8'),/href="\.\.\/calcolo-tredicesima\/\?ral=30000"/);
});
```

- [ ] **Step 2: eseguire e vedere il fallimento**

Run: `node --test prototipo/calcolo-tredicesima.test.js`
Expected: FAIL su entrambi i nuovi test.

- [ ] **Step 3: voce di menu ovunque** — script una tantum (non committato):

```bash
node -e '
const fs=require("fs"),path=require("path");
const DA="CCNL e livello</a></div>",A="CCNL e livello</a><a href=\"/calcolo-tredicesima/\">Tredicesima</a></div>";
let n=0;(function giro(d){for(const x of fs.readdirSync(d)){const p=path.join(d,x);
 if(["node_modules","vendor"].includes(x))continue;
 if(fs.statSync(p).isDirectory())giro(p);
 else if(/\.(html|js)$/.test(x)&&!x.endsWith(".test.js")){const s=fs.readFileSync(p,"utf8");
  if(s.includes("id=\"nav-calcola\"")&&s.includes(DA)&&!s.includes("/calcolo-tredicesima/\">Tredicesima")){fs.writeFileSync(p,s.split(DA).join(A));n++;}}}})("prototipo");
console.log("file aggiornati:",n);'
grep -rl 'id="nav-calcola"' prototipo --include=*.html --include=*.js | xargs grep -L 'calcolo-tredicesima/"' | grep -v '\.test\.js$'
```

Expected: `file aggiornati:` ≈ 77 (la pagina nuova ce l'ha già) e il `grep -L` finale **non stampa nulla**. Se stampa file, aprirli: hanno un markup del menu diverso e vanno sistemati a mano.

- [ ] **Step 4: link dalle pagine RAL** — in `prototipo/ral-page.template.js`, sostituire la riga 107:

```js
  <aside class="personalize"><a class="btn btn--primary btn--lg" href="${query(ral,14)}">Calcola il tuo caso →</a><p>Modifica comune, mensilità, famiglia e pacchetto retributivo per ottenere una stima costruita sulla tua situazione.</p></aside>
```

con:

```js
  <aside class="personalize"><a class="btn btn--primary btn--lg" href="${query(ral,14)}">Calcola il tuo caso →</a><p>Modifica comune, mensilità, famiglia e pacchetto retributivo per ottenere una stima costruita sulla tua situazione.</p><p><a href="../calcolo-tredicesima/?ral=${ral}">La tua tredicesima netta a questa RAL →</a></p></aside>
```

- [ ] **Step 5: rigenerare e testare**

Run: `node prototipo/genera-pagine-ral.js && npm test`
Expected: PASS completo. Rigenerare subito dopo lo script del menu verifica che i template producano lo stesso markup messo a mano nelle pagine generate (nessun diff inatteso).

- [ ] **Step 6: commit**

```bash
git add prototipo
git status --short   # controllare che non entrino file estranei
git commit -m "feat(RIC-76): la tredicesima nel menu e dalle pagine RAL"
```

### Task 5: articolo — bonus cuneo alle righe 15.000 e 20.000 €

**Files:**
- Modify: `prototipo/articoli/tredicesima-detassata.md` (prima tabella, "Cosa non copro", Fonti)
- Regenerate: `prototipo/blog/tredicesima-detassata/index.html` via `node prototipo/genera-pagine-ral.js`

- [ ] **Step 1: valori dal modulo** (non a mano)

Run: `node -e 'const T=require("./prototipo/tredicesima.js");for(const ral of ["15000","20000"]){const r=T.calcolaDaRal({ral});console.log(ral,r.voci.find(v=>v.id==="cuneo"),r.netta)}'`
Expected: 15.000 → cuneo 55,53 €, netta 862,34 €; 20.000 → cuneo 67,06 €, netta 1.142,81 €.

- [ ] **Step 2: tabella** — aggiungere la colonna "Bonus cuneo" tra IRPEF e netto; righe 15.000 e 20.000 con `+55,53 €` / `+67,06 €` e netto `862,34 €` / `1.142,81 €`; dalle 25.000 in su `—`. Sotto la tabella, una frase: "Fino a 20.000 € di reddito sulla tredicesima si applica anche la somma esente del cuneo fiscale, calcolata sul reddito corrisposto nel mese (circolare AdE 4/2025)." Le colonne del risparmio con la detassata **non cambiano** (la sostitutiva prende il posto dell'IRPEF, non del bonus).

- [ ] **Step 3: fonti** — aggiungere in "Fonti", stesso formato delle altre voci:

```
- L. 30 dicembre 2024, n. 207, art. 1 c. 4-5, e Agenzia delle Entrate, circolare 4/2025 — la somma esente del cuneo si calcola sul reddito di lavoro dipendente corrisposto nel mese, tredicesima compresa ([Agenzia delle Entrate](https://www.agenziaentrate.gov.it/portale/documents/20143/8410823/Circolare+lavoro+dipendente+LB2025+DD+IRPEF+n.+4+del+16+maggio+2025.pdf/36979eaa-9fc5-a4ec-a7aa-136497c53f91)) · verificata il 24 settembre 2026
```

- [ ] **Step 4: nessun numero stale**

Run: `grep -n "806,81\|1.075,75" prototipo/articoli/tredicesima-detassata.md`
Expected: nessuna riga (oppure solo dove il testo parla esplicitamente del valore senza bonus).

- [ ] **Step 5: rigenerare e testare**

Run: `node prototipo/genera-pagine-ral.js && npm test`
Expected: PASS completo.

- [ ] **Step 6: commit**

```bash
git add prototipo/articoli/tredicesima-detassata.md prototipo/blog prototipo/sitemap.xml
git commit -m "fix(articolo): il bonus cuneo si applica anche alla tredicesima fino a 20.000 €"
```

### Task 6: verifica e consegna

**Files:**
- Create: `processo/verifiche/calcolo-tredicesima/README.md` + screenshot PNG

- [ ] **Step 1: build come in produzione**

Run: `node processo/attrezzi/build.cjs && ls dist/calcolo-tredicesima/index.html dist/tredicesima.js && test ! -e dist/tredicesima.test.js && echo ok`
Expected: `ok`

- [ ] **Step 2: screenshot headless** — server di anteprima in background (`npm run dev`, porta 4182), poi:

```bash
D=processo/verifiche/calcolo-tredicesima; mkdir -p $D
for w in 375 1440; do
  google-chrome --headless=new --disable-gpu --hide-scrollbars --window-size=$w,2600 --screenshot=$D/vuoto-$w.png "http://127.0.0.1:4182/calcolo-tredicesima/"
  google-chrome --headless=new --disable-gpu --hide-scrollbars --window-size=$w,2600 --screenshot=$D/risultato-40000-$w.png "http://127.0.0.1:4182/calcolo-tredicesima/?ral=40000"
  google-chrome --headless=new --disable-gpu --hide-scrollbars --window-size=$w,2600 --screenshot=$D/detassata-15000-$w.png "http://127.0.0.1:4182/calcolo-tredicesima/?ral=15000"
  google-chrome --headless=new --disable-gpu --hide-scrollbars --window-size=$w,2600 --screenshot=$D/lordo-8-mesi-$w.png "http://127.0.0.1:4182/calcolo-tredicesima/?lordo=2300&mesi=8"
done
```

Guardare ogni PNG (Read tool): risultato visibile, righe leggibili a 375 px, nessun overflow orizzontale, riquadro detassata presente. Lo stato di errore è coperto dai test di `normalizza` (non raggiungibile da URL per scelta).

- [ ] **Step 3: README della verifica** — `processo/verifiche/calcolo-tredicesima/README.md`: elenco degli screenshot, esito di `npm test` (numero test), cosa è verificato qui e cosa solo il deploy live può confermare (indicizzazione, rich results FAQ, evento `tredicesima_calcolata` in GA4).

- [ ] **Step 4: commit**

```bash
git add processo/verifiche/calcolo-tredicesima
git commit -m "test(RIC-76): verifica visiva del calcolatore della tredicesima"
```

- [ ] **Step 5: consegna** — chiedere a Riccardo l'ok per push e PR verso `main` (preview Vercel). Solo dopo l'ok: `git push -u origin calcolo-13esima` e `gh pr create` con descrizione che separa verificato / da verificare in produzione.
