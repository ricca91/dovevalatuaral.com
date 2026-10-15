if(!CALCOLATORE_AVVIO.errore){
/* ============================================================
   IL CONTROLLER — tiene lo stato, disegna, e non calcola niente.
   Ogni numero che appare qui viene da COMPARA.confronta(), che a
   sua volta chiama due volte il motore della home: in questo file
   non esiste una sola formula fiscale, ed è il punto.
   ============================================================ */
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;');
const LATI=['A','B'];
const SEZIONI_PANNELLO={benefit:'Famiglia e benefit',costi:'Costi e tempo'};

const st={
  A:COMPARA.offertaVuota(),B:COMPARA.offertaVuota(),
  mobileLato:'A',
  pannelli:{A:{benefit:false,costi:false},B:{benefit:false,costi:false}},
  esito:null,errori:[],daAggiornare:false,
  messaggio:null,          /* link non leggibile, o esito della copia */
  linkDaSelezionare:null,  /* Clipboard non disponibile: il link si copia a mano */
  dettaglio:{A:false,B:false},
};

/* Una sezione con dei dati dentro parte aperta: un pannello chiuso su
   valori dichiarati nasconderebbe metà del confronto. */
const haBenefit=o=>o.nucleo.length>0||[o.welfareRaw,o.fringeRaw,o.buoniValoreRaw,
  o.buoniNumeroRaw].some(v=>String(v||'').trim()!=='')||o.buoniTipo!=='elettronici';
const haCosti=o=>[o.trasportoRaw,o.altreSpeseRaw,o.oreSettimanaliRaw,o.giorniPresenzaRaw,
  o.minutiViaggioRaw].some(v=>String(v||'').trim()!=='');
function apriPannelliConDati(){
  for(const lato of LATI){
    if(haBenefit(st[lato]))st.pannelli[lato].benefit=true;
    if(haCosti(st[lato]))st.pannelli[lato].costi=true;
  }
}

/* ---------- errori: dal campo all'elemento che lo porta ---------- */
const ID_CAMPO={ral:'ral',mensilita:'mensilita',comune:'comune',
  welfare:'welfare',fringe:'fringe',buoniTipo:'buoni-tipo',buoniValore:'buoni-valore',
  buoniNumero:'buoni-numero',trasporto:'trasporto',altreSpese:'altre-spese',
  oreSettimanali:'ore',giorniPresenza:'giorni',minutiViaggio:'minuti',
  nucleo:'nucleo-aggiungi'};
const idDi=(lato,campo)=>`${lato}-${ID_CAMPO[campo]||campo}`;
const erroreDi=(lato,campo)=>st.errori.find(e=>e.offerta===lato&&e.campo===campo)||null;

/* ---------- i pezzi del modulo ---------- */
function campoImporto(lato,campo,etichetta,valore,aiuto){
  const id=idDi(lato,campo),err=erroreDi(lato,campo);
  const idAiuto=`${id}-help`;
  return `<div class="field${err?' field--error':''}">
    <label class="label" for="${id}">${esc(etichetta)}</label>
    <div class="ingroup"><span class="affix">€</span>
      <input class="input" id="${id}" data-lato="${lato}" data-campo="${campo}"
        inputmode="decimal" autocomplete="off" placeholder="0"
        value="${esc(valore)}" aria-describedby="${idAiuto}"></div>
    ${err?`<p class="error-text" id="${idAiuto}">${esc(err.messaggio)}</p>`
      :`<p class="hint" id="${idAiuto}">${esc(aiuto)}</p>`}
  </div>`;
}
function campoNumero(lato,campo,etichetta,valore,aiuto,modo){
  const id=idDi(lato,campo),err=erroreDi(lato,campo);
  const idAiuto=`${id}-help`;
  return `<div class="field${err?' field--error':''}">
    <label class="label" for="${id}">${esc(etichetta)}</label>
    <input class="input" id="${id}" data-lato="${lato}" data-campo="${campo}"
      inputmode="${modo||'numeric'}" autocomplete="off" placeholder="0"
      value="${esc(valore)}" aria-describedby="${idAiuto}">
    ${err?`<p class="error-text" id="${idAiuto}">${esc(err.messaggio)}</p>`
      :`<p class="hint" id="${idAiuto}">${esc(aiuto)}</p>`}
  </div>`;
}
const opzioni=(elenco,selezionato,etichetta)=>elenco.map(x=>{
  const v=Object.hasOwn(x,'catastale')?x.catastale:x.id;
  return `<option value="${esc(v)}" ${String(v)===String(selezionato)?'selected':''}>${esc(etichetta(x))}</option>`;
}).join('');

function bloccoPrincipale(lato){
  const o=st[lato];
  const errRal=erroreDi(lato,'ral'),errComune=erroreDi(lato,'comune');
  const province=GEOGRAFIA_ITALIA.province(risolviRegione(o.comune).regione);
  const comuni=GEOGRAFIA_ITALIA.comuni(risolviRegione(o.comune).provincia);
  return `<div class="campi">
    <div class="campi campi--compenso">
      <div class="field${errRal?' field--error':''}">
        <label class="label" for="${lato}-ral">Retribuzione annua lorda</label>
        <div class="ingroup"><span class="affix">€</span>
          <input class="input" id="${lato}-ral" data-lato="${lato}" data-campo="ral"
            inputmode="decimal" autocomplete="off" placeholder="35.000"
            value="${esc(o.ralRaw)}" aria-describedby="${lato}-ral-help"></div>
        ${errRal?`<p class="error-text" id="${lato}-ral-help">${esc(errRal.messaggio)}</p>`
          :`<p class="hint" id="${lato}-ral-help">Il calcolo usa il domicilio fiscale selezionato, non la sede dell’azienda.</p>`}
      </div>
      <div class="field${erroreDi(lato,'mensilita')?' field--error':''}">
        <label class="label" for="${lato}-mensilita">Mensilità</label>
        <select class="select" id="${lato}-mensilita" data-lato="${lato}" data-campo="mensilita">
          ${COMPARA.MENSILITA_AMMESSE.map(m=>`<option value="${m}" ${Number(o.mensilitaRaw)===m?'selected':''}>${m}</option>`).join('')}
        </select>
        <p class="hint">Divide il netto annuo: presentazione, non calcolo.</p>
      </div>
    </div>
    <div class="campi campi--tre">
      <div class="field"><label class="label" for="${lato}-regione">Regione</label>
        <select class="select" id="${lato}-regione" data-lato="${lato}" data-campo="regione">
          ${opzioni(GEOGRAFIA_ITALIA.regioni(),risolviRegione(o.comune).regione,x=>x.nome)}</select></div>
      <div class="field"><label class="label" for="${lato}-provincia">Provincia</label>
        <select class="select" id="${lato}-provincia" data-lato="${lato}" data-campo="provincia">
          ${opzioni(province,risolviRegione(o.comune).provincia,x=>`${x.nome} (${x.sigla})`)}</select></div>
      <div class="field${errComune?' field--error':''}"><label class="label" for="${lato}-comune">Comune</label>
        <select class="select" id="${lato}-comune" data-lato="${lato}" data-campo="comune"
          aria-describedby="${lato}-comune-help">
          ${opzioni(comuni,o.comune,x=>x.nome)}</select>
        ${errComune?`<p class="error-text" id="${lato}-comune-help">${esc(errComune.messaggio)}</p>`
          :`<p class="hint" id="${lato}-comune-help">Domicilio fiscale.</p>`}</div>
    </div>
  </div>`;
}
/* La regione e la provincia non stanno nello stato: sono derivate dal
   comune, che è l'unico dato che il motore guarda davvero. */
function risolviRegione(catastale){
  try{
    const g=GEOGRAFIA_ITALIA.risolvi(catastale);
    return{regione:g.provincia.regione,provincia:g.comune.provincia};
  }catch{
    const g=GEOGRAFIA_ITALIA.risolvi('F205');
    return{regione:g.provincia.regione,provincia:g.comune.provincia};
  }
}

function bloccoNucleo(lato){
  const o=st[lato],err=erroreDi(lato,'nucleo');
  const riga=(f,i)=>`<tr>
    <td data-etichetta="Familiare"><select class="select nucleo-in" data-lato="${lato}"
        id="${lato}-nucleo-tipo-${i}" data-nucleo-tipo="${i}"
        aria-label="Tipo di familiare, riga ${i+1}">
      ${Object.entries(NOME_FAMILIARE).map(([k,n])=>
        `<option value="${k}" ${f.tipo===k?'selected':''}>${esc(n)}</option>`).join('')}
    </select></td>
    <td data-etichetta="Età">${f.tipo==='figlio'
      ?`<input class="input nucleo-in nucleo-eta" data-lato="${lato}"
          id="${lato}-nucleo-eta-${i}" data-nucleo-eta="${i}"
          type="text" inputmode="numeric" maxlength="3" autocomplete="off" placeholder="anni"
          aria-label="Età del figlio, riga ${i+1}" value="${f.eta===null?'':f.eta}">`
      :'<span class="muted xs">non rileva</span>'}</td>
    <td data-etichetta="Suo reddito"><input class="input nucleo-in nucleo-red" data-lato="${lato}"
        id="${lato}-nucleo-reddito-${i}" data-nucleo-reddito="${i}" type="text" inputmode="numeric" maxlength="7" autocomplete="off"
        placeholder="0" aria-label="Reddito del familiare, riga ${i+1}"
        value="${f.reddito>0?f.reddito:''}"></td>
    <td class="nucleo-dis" data-etichetta="Disabilità"><input type="checkbox" data-lato="${lato}"
        id="${lato}-nucleo-disabilita-${i}" data-nucleo-disabilita="${i}" ${f.disabilita?'checked':''}
        aria-label="Disabilità accertata (L. 104/1992) del familiare, riga ${i+1}"></td>
    <td><button type="button" class="nucleo-x" data-lato="${lato}"
      id="${lato}-nucleo-rimuovi-${i}" data-nucleo-rimuovi="${i}"
      aria-label="Togli il familiare della riga ${i+1}">✕</button></td>
  </tr>`;
  return `<div class="nucleo">
    ${o.nucleo.length?`<div class="table-wrap"><table class="table nucleo-tab">
      <caption class="sr">Familiari a carico dichiarati per ${esc(COMPARA.ETICHETTE[lato])}</caption>
      <thead><tr><th>Familiare</th><th>Età</th><th>Suo reddito</th><th>Disabilità</th>
        <th><span class="sr">Azioni</span></th></tr></thead>
      <tbody>${o.nucleo.map(riga).join('')}</tbody></table></div>`
      :`<p class="nucleo-vuoto">Nessun familiare dichiarato. Per i figli conta l’<b>età</b>,
         non il numero: sotto i 21 anni la detrazione è assorbita dall’Assegno Unico.</p>`}
    <div style="margin-top:var(--s-3)">
      <button type="button" class="btn btn--ghost btn--sm" id="${lato}-nucleo-aggiungi"
        data-lato="${lato}" data-nucleo-aggiungi="1"
        ${o.nucleo.length>=MAX_FAMILIARI?'disabled':''}>+ Aggiungi familiare</button>
    </div>
    ${err?`<p class="error-text" role="alert">${esc(err.messaggio)}</p>`:''}
  </div>`;
}

function bloccoBenefit(lato){
  const o=st[lato];
  return `${bloccoNucleo(lato)}
  <div class="campi campi--due">
    ${campoImporto(lato,'welfare','Welfare aziendale annuo',o.welfareRaw,
      'Valore già qualificato come esente: non entra nel denaro in busta.')}
    ${campoImporto(lato,'fringe','Fringe benefit annui',o.fringeRaw,
      'Oltre la soglia applicabile, l’intero valore diventa imponibile.')}
  </div>
  <div role="group" aria-labelledby="${lato}-buoni-lab">
    <span class="label" id="${lato}-buoni-lab">Buoni pasto</span>
    <div class="campi campi--tre" style="margin-top:var(--s-3)">
      <div class="field"><label class="xs mono" for="${lato}-buoni-tipo">Tipo</label>
        <select class="select" id="${lato}-buoni-tipo" data-lato="${lato}" data-campo="buoniTipo">
          ${COMPARA.TIPI_BUONI.map(t=>`<option value="${t}" ${o.buoniTipo===t?'selected':''}>${t==='elettronici'?'Elettronici':'Cartacei'}</option>`).join('')}
        </select></div>
      ${campoNumero(lato,'buoniValore','Valore unitario (€)',o.buoniValoreRaw,
        'Esenti fino a 8 € elettronici o 4 € cartacei.','decimal')}
      ${campoNumero(lato,'buoniNumero','Numero al mese',o.buoniNumeroRaw,
        'I giorni in presenza non lo determinano. Il confronto lo porta a 12 mesi.','decimal')}
    </div>
  </div>`;
}

function bloccoCosti(lato){
  const o=st[lato];
  return `<div class="campi campi--due">
    ${campoImporto(lato,'trasporto','Costi di trasporto mensili',o.trasportoRaw,
      'Abbonamenti, carburante, pedaggi: quello che dichiari tu. Il confronto li porta a 12 mesi.')}
    ${campoImporto(lato,'altreSpese','Altre spese mensili legate al lavoro',o.altreSpeseRaw,
      'Solo spese che vuoi considerare nel confronto; evita di contare due volte la stessa spesa.')}
  </div>
  <div class="campi campi--tre">
    ${campoNumero(lato,'oreSettimanali','Ore di lavoro settimanali',o.oreSettimanaliRaw,
      'Vuoto significa non dichiarato, non zero.','decimal')}
    ${campoNumero(lato,'giorniPresenza','Giorni in presenza al mese',o.giorniPresenzaRaw,
      'Di un mese tipo. Vuoto significa non dichiarato, non zero.','numeric')}
    ${campoNumero(lato,'minutiViaggio','Minuti di viaggio al giorno',o.minutiViaggioRaw,
      'Andata e ritorno. Vuoto significa non dichiarato.','decimal')}
  </div>
  <div class="callout callout--warn"><span class="callout__mark">Limite</span><div>
    Costi e giorni si dichiarano <b>al mese</b> e il confronto li porta a dodici mesi tali e
    quali: nessuna stima automatica di affitto, ferie, settimane lavorate, costi chilometrici o
    valore monetario del tempo. Entrano solo i numeri che dichiari.</div></div>`;
}

function pannello(lato,chiave,sotto,corpo){
  const aperta=st.pannelli[lato][chiave];
  const tid=`${lato}-opt-t-${chiave}`,pid=`${lato}-opt-p-${chiave}`;
  const conErrore=st.errori.some(e=>e.offerta===lato&&e.sezione===chiave);
  return `<div class="acc-item opt-item">
    <h3 class="opt-h"><button type="button" class="acc-trigger" id="${tid}"
      data-lato="${lato}" data-pannello="${chiave}" aria-expanded="${aperta}" aria-controls="${pid}">
      <span class="opt-titolo">
        <span>${esc(SEZIONI_PANNELLO[chiave])} <span class="tag">Facoltativo</span></span>
        <span class="opt-sub">${esc(sotto)}</span>
      </span>
      ${conErrore?'<span class="tag">Da correggere</span>':''}
      <span class="sign" aria-hidden="true">+</span>
    </button></h3>
    <div class="acc-panel opt-panel" id="${pid}" role="region" aria-labelledby="${tid}"
      ${aperta?'':'hidden'}>${corpo}</div>
  </div>`;
}

function modulo(lato){
  return `<section class="offerta offerta--${lato}" aria-labelledby="${lato}-titolo">
    <div class="offerta__head">
      <h2 id="${lato}-titolo">${esc(COMPARA.ETICHETTE[lato])}</h2>
      <span class="tag${lato==='B'?' tag--flux':''}">${lato}</span>
    </div>
    ${bloccoPrincipale(lato)}
    <div class="accordion opt">
      ${pannello(lato,'benefit','Familiari a carico, welfare, fringe e buoni pasto',bloccoBenefit(lato))}
      ${pannello(lato,'costi','Costi al mese, ore di lavoro e tempo di viaggio',bloccoCosti(lato))}
    </div>
  </section>`;
}

/* ---------- il risultato ---------- */
/* Il verde e il rosso stanno solo sul denaro, dove «più» e «meno» hanno un
   verso condiviso. Sulle ore no: meno ore di viaggio non è una perdita, e
   colorarle di rosso sarebbe la pagina che decide chi ha vinto. */
const CLASSE_DELTA=(v,unita)=>unita!=='euro'||v===0?'':v>0?'delta--su':'delta--giu';
function cellaValore(riga,lato){
  const v=lato==='a'?riga.a:riga.b;
  if(riga.unita==='ore')
    return v===null?'<span class="assente">Non dichiarato</span>':COMPARA.fmtNumero(v)+' h';
  let testo=COMPARA.fmtEuro(v);
  if(riga.divisore)testo+=`<span class="conf-div">÷ ${riga.divisore[lato]} mensilità</span>`;
  return testo;
}
function cellaDelta(riga){
  if(riga.senzaDelta)
    return '<span class="assente">Non confrontabile: mensilità diverse</span>';
  if(riga.delta===null)
    return '<span class="assente">Non dichiarato per entrambe</span>';
  const testo=riga.unita==='ore'
    ?COMPARA.fmtDeltaNumero(riga.delta)+' h':COMPARA.fmtDelta(riga.delta);
  /* Il segno non è mai solo un colore: c'è il simbolo, e sotto la parola. */
  return `<span class="${CLASSE_DELTA(riga.delta,riga.unita)}">${testo}</span>
    <span class="verso">${COMPARA.verso(riga.delta)}</span>`;
}
function tabella(esito){
  const riga=r=>`<tr>
    <td class="conf-voce" data-etichetta="Voce"><b>${esc(r.etichetta)}</b>
      ${r.nota?`<span class="conf-nota">${esc(r.nota)}</span>`:''}</td>
    <td class="num" data-etichetta="Lavoro attuale (A)">${cellaValore(r,'a')}</td>
    <td class="num" data-etichetta="Nuova offerta (B)">${cellaValore(r,'b')}</td>
    <td class="num" data-etichetta="Differenza (B − A)">${cellaDelta(r)}</td>
  </tr>`;
  return `<div class="table-wrap conf-wrap"><table class="table conf-tab">
    <caption class="sr">Confronto fra lavoro attuale e nuova offerta</caption>
    <thead><tr><th>Voce</th><th class="num">Lavoro attuale (A)</th>
      <th class="num">Nuova offerta (B)</th><th class="num">Differenza (B − A)</th></tr></thead>
    <tbody>${esito.righe.map(riga).join('')}</tbody></table></div>`;
}
function verifica(esito,lato){
  const res=esito.risultati[lato];
  const righe=componiRighe(res.voci);
  const perId=new Map(righe.map(r=>[r.id,r]));
  const corpo=res.voci.map(v=>{
    const r=perId.get(v.id);
    return `<tr>
      <td data-etichetta="Voce"><b>${esc(r.titolo)}</b>
        <span class="voci-formula">${esc(r.formula)}</span></td>
      <td class="num" data-etichetta="Importo">${eur(v.importo)}</td>
      <td data-etichetta="Fonte"><a href="${esc(r.fonte.url)}" target="_blank"
        rel="noopener noreferrer">${esc(r.fonte.titolo)}</a></td>
    </tr>`;
  }).join('');
  const avvisi=esito.avvisi[lato].map(a=>`<div class="callout callout--warn">
    <span class="callout__mark">Limite</span><div>${esc(a)}</div></div>`).join('');
  return `<details ${st.dettaglio[lato]?'open':''} data-dettaglio="${lato}">
    <summary><span>Verifica ${esc(COMPARA.ETICHETTE[lato])}: contributi, imposte e benefit</span></summary>
    <div class="acc-body">
      <p class="small muted">${esc(res.geografia.comune)} (${esc(res.geografia.provincia)}),
        addizionali ${esc(res.geografia.regione)} · snapshot ${esc(res.geografia.asOf)} ·
        regole ${esc(res.versioneRegole)}.</p>
      ${avvisi}
      <div class="table-wrap" style="margin-top:var(--s-4)"><table class="table voci-tab">
        <caption class="sr">Voci del calcolo di ${esc(COMPARA.ETICHETTE[lato])}</caption>
        <thead><tr><th>Voce</th><th class="num">Importo</th><th>Fonte</th></tr></thead>
        <tbody>${corpo}</tbody></table></div>
      <p style="margin-top:var(--s-4)"><a href="${esc(COMPARA.urlCalcolatore(st[lato]))}">
        Apri ${esc(COMPARA.ETICHETTE[lato].toLowerCase())} nel calcolatore →</a></p>
    </div>
  </details>`;
}
function condivisione(){
  return `<div class="condividi">
    <div class="riga">
      <button type="button" class="btn btn--ghost btn--sm" id="copia-link">Copia link del confronto</button>
      <a class="btn btn--link" href="${esc(COMPARA.urlCalcolatore(st.A))}">Torna al calcolatore con il lavoro attuale →</a>
    </div>
    ${st.linkDaSelezionare?`<label class="xs mono" for="link-manuale">Copia il link a mano</label>
      <input class="input link" id="link-manuale" readonly value="${esc(st.linkDaSelezionare)}">`:''}
    <p class="hint">Il link contiene i dati inseriti, inclusi quelli familiari. Condividilo solo
      con chi vuoi. Sta dopo il <span class="tag">#</span>, quindi non viene inviato al server —
      ma non è cifratura: chi riceve il link legge tutto.</p>
  </div>`;
}
function esitoHTML(){
  if(!st.esito)return '';
  const e=st.esito;
  return `<section class="esito${st.daAggiornare?' esito--stale':''}" aria-labelledby="esito-titolo">
    <h2 class="esito__titolo" id="esito-titolo" tabindex="-1">Quanto cambia per te</h2>
    ${st.daAggiornare?`<div class="callout callout--warn" role="status">
      <span class="callout__mark">Attenzione</span><div><b>Questi numeri non sono aggiornati.</b>
      Hai modificato i dati dopo l’ultimo confronto: premi <b>Confronta</b> per rifarlo.</div></div>
      <div class="stale"></div>`:''}
    <div class="riepilogo">
      <p class="primo">${esc(e.riepilogo.netto.testo)}</p>
      <p>${esc(e.riepilogo.costi.testo)}</p>
      <p class="small muted">${esc(e.riepilogo.viaggio.testo)}</p>
    </div>
    ${tabella(e)}
    <p class="hint" style="margin-top:var(--s-3)">I benefit spendibili non sono sommati al denaro
      dopo i costi: buoni pasto e welfare non sono denaro liberamente spendibile. Il tempo non
      viene monetizzato.</p>
    <div class="verifica">${LATI.map(l=>verifica(e,l)).join('')}</div>
    ${condivisione()}
    <p class="small" style="margin-top:var(--s-6)"><a href="netto-o-niente.html">Sai riconoscere l'offerta migliore? Gioca a Netto o niente →</a></p>
  </section>`;
}

function render(mantieniScroll){
  const y=window.scrollY,fuoco=document.activeElement&&document.activeElement.id;
  document.getElementById('app').innerHTML=`
    <nav class="mobile-steps" id="mobile-steps" aria-label="Passaggi del confronto">
      <button type="button" class="mobile-step" data-mobile-lato="A"
        ${st.mobileLato==='A'?'aria-current="step"':''}><small>Passaggio 1</small>Lavoro attuale</button>
      <button type="button" class="mobile-step" data-mobile-lato="B"
        ${st.mobileLato==='B'?'aria-current="step"':''}><small>Passaggio 2</small>Nuova offerta</button>
    </nav>
    <div class="offerte" data-mobile-lato="${st.mobileLato}">${LATI.map(modulo).join('')}</div>
    <div class="azioni">
      <button type="button" class="btn btn--primary btn--lg" id="btn-confronta">Confronta</button>
      <button type="button" class="btn btn--ghost" id="copia-a-b">Copia A in B</button>
      <button type="button" class="btn btn--link" id="azzera">Azzera</button>
      <span class="nota">Il confronto usa due volte lo stesso motore della home. Nessun
        punteggio complessivo: denaro, benefit e tempo restano distinti.</span>
    </div>
    ${st.messaggio?`<div class="callout callout--warn" id="messaggio" role="status" style="margin-top:var(--s-5)">
      <span class="callout__mark">Nota</span><div>${esc(st.messaggio)}</div></div>`:''}
    ${st.errori.length&&!st.esito?`<p class="error-text" role="alert" style="margin-top:var(--s-4)">
      Ci sono ${st.errori.length===1?'un dato da correggere':`${st.errori.length} dati da correggere`}:
      il confronto non è stato eseguito.</p>`:''}
    ${esitoHTML()}
    <div class="mobile-action">
      <button type="button" class="btn btn--primary btn--lg" id="mobile-primary">
        ${st.mobileLato==='A'?'Avanti: nuova offerta →':st.esito?'Aggiorna confronto':'Confronta'}
      </button>
    </div>`;
  aggiornaUrl();
  if(mantieniScroll)window.scrollTo(0,y);
  if(fuoco)document.getElementById(fuoco)?.focus({preventScroll:true});
}

/* Lo stato nell'URL sono gli input, mai i risultati: al ritorno si
   ricalcola, così un link non può congelare i numeri di ieri. */
function aggiornaUrl(){
  /* Da file:// qualche browser rifiuta replaceState: il link condivisibile
     è un di più, la pagina deve restare in piedi comunque. */
  try{history.replaceState(null,'','#'+COMPARA.codificaStato({A:st.A,B:st.B}));}
  catch{/* nessun URL aggiornabile: il pulsante di copia lo ricostruisce */}
}
function segnaDaAggiornare(){
  if(st.esito)st.daAggiornare=true;
}

/* ---------- il confronto ---------- */
function confronta(){
  const esito=COMPARA.confronta(st.A,st.B);
  st.errori=esito.errori;
  if(!esito.ok){
    st.esito=null;st.daAggiornare=false;
    /* Un errore dentro un pannello chiuso non si può correggere: la
       sezione si apre da sola, e il fuoco ci va dentro. */
    const primo=esito.errori[0];
    st.mobileLato=primo.offerta;
    if(primo.sezione!=='principale')st.pannelli[primo.offerta][primo.sezione]=true;
    render();
    const bersaglio=document.getElementById(idDi(primo.offerta,primo.campo));
    if(bersaglio){bersaglio.focus();
      bersaglio.scrollIntoView({behavior:movimento(),block:'center'});}
    return;
  }
  st.esito=esito.esito;st.daAggiornare=false;st.linkDaSelezionare=null;st.messaggio=null;
  render();
  const titolo=document.getElementById('esito-titolo');
  if(titolo){titolo.focus();titolo.scrollIntoView({behavior:movimento(),block:'start'});}
}
const movimento=()=>matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth';

/* ---------- eventi ---------- */
document.addEventListener('input',e=>{
  const d=e.target.dataset||{};
  if(!d.lato)return;
  const o=st[d.lato];
  if(d.campo&&Object.hasOwn(o,d.campo+'Raw')){o[d.campo+'Raw']=e.target.value;return segnaDaAggiornare();}
  if(d.nucleoEta!==undefined){
    const cifre=e.target.value.replace(/\D/g,'').slice(0,3);
    if(cifre!==e.target.value)e.target.value=cifre;
    o.nucleo[Number(d.nucleoEta)].eta=cifre===''?null:Number(cifre);
    return segnaDaAggiornare();
  }
  if(d.nucleoReddito!==undefined){
    const cifre=e.target.value.replace(/\D/g,'').slice(0,7);
    if(cifre!==e.target.value)e.target.value=cifre;
    o.nucleo[Number(d.nucleoReddito)].reddito=cifre===''?0:Number(cifre);
    return segnaDaAggiornare();
  }
});
document.addEventListener('change',e=>{
  const d=e.target.dataset||{};
  if(!d.lato)return;
  const o=st[d.lato];
  if(d.campo==='mensilita'){o.mensilitaRaw=e.target.value;segnaDaAggiornare();return render(true);}
  if(d.campo==='buoniTipo'){o.buoniTipo=e.target.value;segnaDaAggiornare();return render(true);}
  if(d.campo==='regione'){
    const p=GEOGRAFIA_ITALIA.province(Number(e.target.value))[0];
    o.comune=GEOGRAFIA_ITALIA.comuni(p.id)[0].catastale;segnaDaAggiornare();return render(true);
  }
  if(d.campo==='provincia'){
    o.comune=GEOGRAFIA_ITALIA.comuni(Number(e.target.value))[0].catastale;
    segnaDaAggiornare();return render(true);
  }
  if(d.campo==='comune'){o.comune=e.target.value;segnaDaAggiornare();return render(true);}
  if(d.nucleoDisabilita!==undefined){
    o.nucleo[Number(d.nucleoDisabilita)].disabilita=e.target.checked;
    segnaDaAggiornare();return render(true);
  }
  if(d.nucleoTipo!==undefined){
    const f=o.nucleo[Number(d.nucleoTipo)];
    f.tipo=e.target.value;
    if(f.tipo!=='figlio')f.eta=null;   // l'età non rileva per gli altri
    segnaDaAggiornare();return render(true);
  }
});
document.addEventListener('keydown',e=>{
  if(e.target.dataset&&e.target.dataset.campo==='ral'&&e.key==='Enter'){
    e.preventDefault();confronta();}
});
document.addEventListener('toggle',e=>{
  const lato=e.target.dataset&&e.target.dataset.dettaglio;
  if(lato)st.dettaglio[lato]=e.target.open;
},true);
document.addEventListener('click',e=>{
  const passo=e.target.closest('[data-mobile-lato]');
  if(passo&&passo.classList.contains('mobile-step')){
    st.mobileLato=passo.dataset.mobileLato;
    render();
    document.getElementById('mobile-steps')?.scrollIntoView({behavior:movimento(),block:'start'});
    return;
  }
  const primariaMobile=e.target.closest('#mobile-primary');
  if(primariaMobile){
    if(st.mobileLato==='A'){
      st.mobileLato='B';render();
      document.getElementById('mobile-steps')?.scrollIntoView({behavior:movimento(),block:'start'});
      return;
    }
    return confronta();
  }
  const pannelloTrigger=e.target.closest('[data-pannello]');
  if(pannelloTrigger){
    const{lato,pannello:chiave}=pannelloTrigger.dataset;
    st.pannelli[lato][chiave]=!st.pannelli[lato][chiave];
    return render(true);   // nessun dato cambia: solo cosa si vede
  }
  const aggiungi=e.target.closest('[data-nucleo-aggiungi]');
  if(aggiungi){
    const o=st[aggiungi.dataset.lato];
    if(o.nucleo.length>=MAX_FAMILIARI)return;
    o.nucleo.push({tipo:'figlio',eta:null,disabilita:false,reddito:0});
    segnaDaAggiornare();return render(true);
  }
  const rimuovi=e.target.closest('[data-nucleo-rimuovi]');
  if(rimuovi){
    st[rimuovi.dataset.lato].nucleo.splice(Number(rimuovi.dataset.nucleoRimuovi),1);
    segnaDaAggiornare();return render(true);
  }
  const bottone=e.target.closest('#btn-confronta,#copia-a-b,#azzera,#copia-link');
  if(!bottone)return;
  if(bottone.id==='btn-confronta')return confronta();
  if(bottone.id==='copia-a-b'){
    /* Copia per valore: modificare B non deve toccare A. */
    st.B=COMPARA.copiaOfferta(st.A);
    st.pannelli.B={benefit:haBenefit(st.B),costi:haCosti(st.B)};
    st.errori=st.errori.filter(x=>x.offerta!=='B');
    segnaDaAggiornare();return render(true);
  }
  if(bottone.id==='azzera'){
    st.A=COMPARA.offertaVuota();st.B=COMPARA.offertaVuota();
    st.pannelli={A:{benefit:false,costi:false},B:{benefit:false,costi:false}};
    st.esito=null;st.errori=[];st.daAggiornare=false;st.messaggio=null;
    st.linkDaSelezionare=null;return render();
  }
  if(bottone.id==='copia-link')return copiaLink();
});

/* Da file:// e su qualche browser la Clipboard API non c'è: invece di
   fallire in silenzio, il link compare in un campo da selezionare. */
function copiaLink(){
  const url=location.href.split('#')[0]+'#'+COMPARA.codificaStato({A:st.A,B:st.B});
  const manuale=()=>{
    st.linkDaSelezionare=url;
    st.messaggio='Copia automatica non disponibile: seleziona il link qui sotto e copialo a mano.';
    render(true);
    const campo=document.getElementById('link-manuale');
    if(campo){campo.focus();campo.select();}
  };
  if(!navigator.clipboard||!navigator.clipboard.writeText)return manuale();
  navigator.clipboard.writeText(url).then(()=>{
    st.linkDaSelezionare=null;
    st.messaggio='Link del confronto copiato negli appunti.';
    render(true);
  },manuale);
}

/* ---------- avvio: lo stato arriva dal fragment, se c'è ---------- */
function daFragment(){
  const grezzo=location.hash.replace(/^#/,'');
  if(grezzo==='')return;
  const letto=COMPARA.decodificaStato(grezzo);
  if(!letto.ok){
    /* Niente valori sostituiti con zeri: il modulo resta vuoto e
       utilizzabile, e la pagina dice perché. */
    st.messaggio=COMPARA.MOTIVI[letto.motivo]+' Il modulo qui sotto è vuoto e utilizzabile: '+
      'reinserisci i dati e premi Confronta.';
    return;
  }
  st.A=letto.stato.A;st.B=letto.stato.B;
  apriPannelliConDati();
  /* Al ripristino si ricalcola. Se una delle due offerte non è ancora
     completa — è il caso dell'arrivo dalla home — non è un errore:
     è un modulo da finire, e gli errori arrivano solo su Confronta. */
  const esito=COMPARA.confronta(st.A,st.B);
  if(esito.ok)st.esito=esito.esito;
}
daFragment();
render();

CALCOLATORE_AVVIO.pronto();
}
