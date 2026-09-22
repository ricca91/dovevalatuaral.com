// Confine concordato: CTA → unico upload → revisione/consenso → anteprima.
// Eseguire con il server-fixture RIC-72 attivo. AI/Stripe sono simulati;
// PDF.js, oscuramento, rete, UI e controlli di accesso sono quelli del prodotto.
const {execFileSync}=require('node:child_process');
const {mkdtempSync}=require('node:fs');
const {tmpdir}=require('node:os');
const path=require('node:path');
const base='http://127.0.0.1:4192';
const output=mkdtempSync(path.join(tmpdir(),'ric73-browser-'));
const session='ric73-test-'+process.pid;
let completato=false;
function browser(...args){return execFileSync('agent-browser',['--session',session,...args],{encoding:'utf8',timeout:30000});}
function verifica(condizione,messaggio){browser('eval',`if(!(${condizione}))throw new Error(${JSON.stringify(messaggio)});true`);}
try{
  browser('open','file://'+path.join(__dirname,'cedolino-sintetico.html'));
  browser('pdf',path.join(output,'cedolino.pdf'));
  browser('set','viewport','1440','1000');
  browser('open',base+'/busta-paga.html');
  browser('wait','#bp-file:enabled');
  verifica('document.querySelectorAll("input[type=file]").length===1','Upload duplicato');
  verifica('document.querySelector("#bp-consenso").checked===false','Consenso preselezionato');
  verifica('!document.querySelector(".bl-demo-report").hidden','Demo del report assente');
  browser('click','.bl-header a[href="#bp-upload"]');
  verifica('location.hash==="#bp-upload"','CTA non collegata al percorso');
  browser('upload','#bp-file',path.join(output,'cedolino.pdf'));
  browser('wait','#bp-revisione');
  verifica('document.querySelector("#bp-invia").disabled','Invio possibile senza consenso');
  verifica('document.querySelector("#bp-payload").innerText.includes("2300,00")','Il testo non è visibile prima del consenso');
  browser('focus','#bp-consenso');browser('press','Space');
  verifica('!document.querySelector("#bp-invia").disabled','Consenso non abilita l’invio');
  browser('focus','#bp-invia');browser('press','Enter');
  browser('wait','#bp-anteprima h3');
  verifica('document.querySelector("#bp-risultato-corpo").textContent===""','Report privato presente prima del pagamento');
  verifica('document.querySelector("#bp-anteprima").innerText.includes("2300,00")','Anteprima non collegata al documento');
  verifica('document.querySelector("#bp-offerta").hidden===false','Offerta non disponibile dopo l’anteprima');
  browser('screenshot',path.join(output,'anteprima-desktop.png'));
  browser('reload');browser('wait','#bp-anteprima h3');
  verifica('document.querySelector("#bp-risultato-corpo").textContent===""','Refresh aggira il pagamento');
  // Creazione e pagamento tramite il solo server locale dichiarato: nessuna carta.
  browser('eval','window.BUSTA_PAGA_INVIO.checkout()');
  browser('eval','fetch("/__prova/paga",{method:"POST"}).then(r=>r.text())');
  browser('click','#bp-riprova-stato');browser('wait','#bp-risultato');
  verifica('document.querySelector("#bp-risultato-corpo").innerText.includes("Superminimo")','Report non sbloccato');
  browser('set','viewport','390','844');
  verifica('document.documentElement.scrollWidth<=innerWidth','Overflow mobile');
  browser('screenshot',path.join(output,'report-mobile.png'));
  browser('click','.bp-cancellazione summary');browser('click','#bp-cancella-server');
  browser('wait','#bp-file:enabled');
  verifica('document.querySelector("#bp-risultato-corpo").textContent===""','Report non cancellato');
  browser('open',base+'/busta-paga.html');
  browser('click','.site-menu-toggle');
  verifica('document.querySelector(".site-menu-toggle").getAttribute("aria-expanded")==="true"','Menu mobile chiuso');
  browser('press','Escape');
  verifica('document.activeElement===document.querySelector(".site-menu-toggle")','Focus non restituito dopo Escape');
  browser('click','.bl-faq summary');
  verifica('document.querySelector(".bl-faq details").open','FAQ non espandibile');
  browser('click','.bl-faq summary');
  browser('screenshot','--full',path.join(output,'landing-mobile.png'));
  browser('open',base+'/index.html');
  verifica('!document.querySelector("a[href*=busta-paga]")','Ingresso pubblico attivo prima del rilascio');
  browser('set','viewport','1440','1000');
  browser('open',base+'/busta-paga.html');
  verifica('document.documentElement.scrollWidth<=innerWidth','Overflow desktop');
  browser('screenshot','--full',path.join(output,'landing-desktop.png'));
  console.log('PASS — CTA, PDF, consenso, anteprima, paywall, refresh, recupero, cancellazione, menu/FAQ, mobile e gate pubblico.');
  console.log('Evidenze sintetiche: '+output);
  completato=true;
}catch(error){
  console.error(browser('eval','JSON.stringify({stato:document.querySelector("#bp-stato")?.textContent,acquisto:document.querySelector("#bp-acquisto-stato")?.textContent,uploadDisabilitato:document.querySelector("#bp-file")?.disabled})'));
  console.error(browser('errors'));
  throw error;
}finally{if(completato)browser('close');else console.error('Sessione diagnostica: '+session);}
