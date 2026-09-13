/* Browser reale: richiede playwright-core già installato e Chromium/CDP.
 * node processo/attrezzi/verifica-netto-o-niente.cjs <playwright-core> <cdp-url> [base-url]
 * Non aggiunge dipendenze runtime o una build al sito. */
const {chromium}=require(process.argv[2]);
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const N=require('../../prototipo/netto-o-niente.js');
const S=require('../../prototipo/netto-o-niente-scenari.js');
const base=process.argv[4]||'http://127.0.0.1:4182';
const dir=path.resolve(__dirname,'../verifiche/ric-62');
const runKey='non:run:'+N.VERSIONE,bestKey='non:best:'+N.VERSIONE;
const checks=[];
async function main(){
  fs.mkdirSync(dir,{recursive:true});
  const browser=await chromium.connectOverCDP(process.argv[3]);
  const contexts=[];
  async function setup(viewport={width:1440,height:900},init){
    const context=await browser.newContext({viewport,reducedMotion:'reduce'});contexts.push(context);
    // Il tracker è assente: nessuna chiamata al servizio durante le prove.
    await context.route('**/analytics.js',route=>route.fulfill({contentType:'application/javascript',body:''}));
    await context.addInitScript(()=>{window.nonEvents=[];window.gtag=(...args)=>window.nonEvents.push(args);});
    if(init)await context.addInitScript(init);
    const page=await context.newPage();page.on('pageerror',e=>{throw e;});
    return{context,page};
  }
  const click=async(page,action)=>page.locator(`[data-action="${action}"]`).click();
  const ready=async page=>page.waitForFunction(()=>document.querySelector('#non-mount').getAttribute('aria-busy')==='false');
  const reload=async page=>{await page.reload();await ready(page);};
  const snapshot=async(page,name)=>{
    await page.evaluate(()=>{document.activeElement.blur();window.scrollTo(0,0);});
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    await page.screenshot({path:path.join(dir,name+'.png'),fullPage:true});
  };
  const fits=async page=>{
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),true);
    const outside=await page.locator('.non-offer,.non-offer button,.non-score,.non-record,.site-menu-toggle').evaluateAll(els=>els.filter(el=>{
      const r=el.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left<-1);
    }).map(e=>e.className));
    assert.deepEqual(outside,[],'nessun controllo ritagliato, anche con zoom');
  };
  const score=async(page,n)=>assert.equal(await page.locator('.non-score').textContent(),`${n} di fila`);
  const current=async page=>page.evaluate(key=>JSON.parse(sessionStorage.getItem(key)),runKey);
  const endZero=async page=>{
    await page.goto(base+'/netto-o-niente.html#'+N.codificaSfida({seed:0,target:0}));await ready(page);await click(page,'start');
    const r=S.generaConfronto({seed:0,indice:1});await click(page,r.vincitore==='A'?'B':'A');await score(page,0);
  };
  try{
    const {page,context}=await setup();
    await page.goto(base+'/netto-o-niente.html');await ready(page);await snapshot(page,'intro-desktop');
    await page.goto(base+'/netto-o-niente.html#'+N.codificaSfida({seed:123456789,target:10}));await ready(page);
    assert.match(await page.locator('.non-target').textContent(),/arrivare a 11/);
    await click(page,'start');await fits(page);await snapshot(page,'domanda-desktop');
    const initial=await page.locator('.non-offers').textContent();
    assert.equal(await page.locator('.non-available').count(),0);
    assert.equal(await page.locator('[data-comparison]').count(),0);
    await reload(page);assert.equal(await page.locator('.non-offers').textContent(),initial);await score(page,0);
    assert.equal((await page.evaluate(()=>window.nonEvents)).length,0,'reload non invia eventi di gioco');
    let s=N.creaPartita({seed:123456789,target:10});
    for(let i=1;i<=22;i++){
      const right=s.round.vincitore;
      if(i===1){
        await page.locator(`[data-action="${right}"]`).focus();await page.keyboard.press('Enter');
        await page.keyboard.down('Enter');await page.keyboard.down('Enter');await page.keyboard.up('Enter');
      }else await click(page,right);
      s=N.rispondi(s,right);await score(page,i);
      assert.equal(await page.locator('[data-action="A"]').count(),0);
      assert.equal(await page.evaluate(()=>document.activeElement.id),'non-feedback-title');
      if(i===1){await reload(page);await score(page,1);assert.equal((await current(page)).fase,'RIVELAZIONE');}
      if(i===10)assert.match(await page.locator('.non-target').textContent(),/Hai pareggiato/);
      if(i===11)assert.match(await page.locator('.non-target').textContent(),/Hai superato/);
      if(i===13)await snapshot(page,'rivelazione-desktop');
      if(i===21){
        await page.locator('.non-detail summary').click();await fits(page);
        assert.ok(await page.locator('.non-table a').count()>10);
        await snapshot(page,'conti-e-fonti-desktop');
      }
      await click(page,'next');s=N.prossimo(s);
      if(i===1){await reload(page);assert.equal((await current(page)).fase,'DOMANDA');await score(page,1);}
      assert.equal((await current(page)).scelte.length,i);
    }
    await click(page,s.round.vincitore==='A'?'B':'A');s=N.rispondi(s,s.round.vincitore==='A'?'B':'A');
    await score(page,22);assert.match(await page.locator('#non-feedback-title').textContent(),/22 di fila/);
    await reload(page);await score(page,22);assert.equal((await current(page)).fase,'FINE');
    assert.equal(await page.locator('[data-action="next"]').count(),0);await snapshot(page,'fine-desktop');
    const comparison=await page.locator('[data-comparison]').getAttribute('href');
    const [popup]=await Promise.all([page.waitForEvent('popup'),page.locator('[data-comparison]').click()]);
    await popup.waitForLoadState();
    const actual=await popup.evaluate(()=>{
      const parsed=COMPARA.decodificaStato(location.hash);const r=COMPARA.confronta(parsed.stato.A,parsed.stato.B);
      return{A:parsed.stato.A,B:parsed.stato.B,righe:r.esito.righe.filter(x=>['netto','costi','dopoCosti'].includes(x.chiave)),text:document.getElementById('app').textContent};
    });
    assert.deepEqual(actual.righe,s.round.esito.righe.filter(x=>['netto','costi','dopoCosti'].includes(x.chiave)));
    assert.ok(actual.text.includes(require('../../prototipo/compara.js').fmtEuro(s.round.esito.righe.find(x=>x.chiave==='dopoCosti').a)));
    await popup.close();assert.ok(comparison.startsWith('compara.html#v=1'));
    checks.push('22 corrette, pareggio/superamento, primo errore, tastiera, quattro fasi di reload e Compara reale');
    // Sfida riaperta in contesto separato: gli stessi input, oltre il record.
    const shared=N.testoSfida(s).url.replace(N.CANONICAL,base+'/netto-o-niente.html');
    const {page:friend}=await setup({width:390,height:844});
    await friend.goto(shared);await ready(friend);await click(friend,'start');
    assert.equal(await friend.locator('.non-offers').textContent(),initial);
    const browserSequence=await friend.evaluate(()=>{
      let precedenti=[];return Array.from({length:101},(_,i)=>{
        const r=NON_SCENARI.generaConfronto({seed:123456789,indice:i+1,precedenti});
        precedenti=[...precedenti,r.id].slice(-2);return{A:r.A,B:r.B,v:r.vincitore};
      });
    });
    let prev=[];
    for(let i=0;i<101;i++){
      const r=S.generaConfronto({seed:123456789,indice:i+1,precedenti:prev});prev=[...prev,r.id].slice(-2);
      assert.deepEqual(browserSequence[i],{A:r.A,B:r.B,v:r.vincitore});
    }
    await click(page,'replay');await score(page,0);assert.equal((await current(page)).seed,123456789);
    assert.match(await page.locator('.non-target').textContent(),/Rivincita/);
    await click(page,S.generaConfronto({seed:123456789,indice:1}).vincitore==='A'?'B':'A');
    await click(page,'new');assert.equal(new URL(page.url()).hash,'');await score(page,0);
    assert.equal((await current(page)).target,null);assert.equal(await page.evaluate(key=>localStorage.getItem(key),bestKey),'22');
    checks.push('link in contesto separato, 101 round browser/Node identici, rivincita e nuovo seed senza perdere record');
    // Mobile, zoom 200%, assenza overflow e reduced motion.
    for(const size of [{width:375,height:812},{width:390,height:844}]){
      await friend.setViewportSize(size);await fits(friend);await snapshot(friend,`domanda-${size.width}`);
      const sizes=await friend.locator('.non-fields dt,.non-fields dd').evaluateAll(els=>els.map(e=>parseFloat(getComputedStyle(e).fontSize)));
      assert.ok(sizes.every(n=>n>=14));
      for(const b of await friend.locator('.non-offer button').all())assert.ok((await b.boundingBox()).height>=44);
    }
    await friend.evaluate(()=>{document.documentElement.style.zoom='2';});await fits(friend);await snapshot(friend,'zoom-200-mobile');
    await friend.evaluate(()=>{document.documentElement.style.zoom='';});await reload(friend);
    await click(friend,S.generaConfronto({seed:123456789,indice:1}).vincitore);
    assert.equal(await friend.locator('.non-reveal').first().evaluate(e=>getComputedStyle(e).animationName),'none');
    await fits(friend);await snapshot(friend,'rivelazione-mobile');
    await click(friend,'next');const second=S.generaConfronto({seed:123456789,indice:2});
    await click(friend,second.vincitore==='A'?'B':'A');await fits(friend);await snapshot(friend,'fine-mobile');
    // Apertura del menu mobile vero.
    await friend.locator('.site-menu-toggle').click();assert.equal(await friend.locator('.site-menu-toggle').getAttribute('aria-expanded'),'true');
    await friend.locator('.site-menu-toggle').click();
    checks.push('375×812, 390×844, desktop, zoom 200%, tocchi 44px, testo 14px, reduced motion e menu');
    // Nuovo intento URL prevale su qualsiasi run salvata.
    await page.goto(base+'/netto-o-niente.html#'+N.codificaSfida({seed:0,target:0}));await ready(page);
    assert.equal(await page.locator('[data-action="start"]').count(),1);await click(page,'start');
    await click(page,S.generaConfronto({seed:0,indice:1}).vincitore);
    assert.match(await page.locator('.non-target').textContent(),/Hai superato/);
    for(const fragment of ['v=obsolete&s=0&t=0',`v=${N.VERSIONE}&s=0&t=0&t=1`,'x'.repeat(513),`v=${N.VERSIONE}&s=%3Cimg%20onerror=alert(1)%3E&t=0`]){
      await page.goto(base+'/netto-o-niente.html#'+fragment);await ready(page);
      assert.equal(await page.locator('#non-error-title').count(),1);assert.equal(await page.locator('[data-action="A"]').count(),0);
    }
    await click(page,'new');await score(page,0);
    checks.push('target zero, nuovo intento, versioni incompatibili, duplicati, URL enorme/malevolo recuperabili');
    // Storage rifiutato o corrotto non ferma il gioco.
    const {page:blocked}=await setup({width:375,height:812},()=>{
      Object.defineProperty(window,'localStorage',{get(){throw new DOMException('blocked','SecurityError');}});
      Object.defineProperty(window,'sessionStorage',{get(){throw new DOMException('blocked','SecurityError');}});
      window.gtag=undefined;
    });
    await blocked.goto(base+'/netto-o-niente.html');await ready(blocked);await click(blocked,'start');
    assert.match(await blocked.locator('#non-storage').textContent(),/record non verrà salvato/);
    await click(blocked,'A');assert.equal(await blocked.locator('#non-feedback-title').count(),1);
    await snapshot(blocked,'storage-indisponibile-mobile');
    const {page:broken}=await setup(undefined,()=>{localStorage.setItem('non:best:non-v1-2026-01','NaN');sessionStorage.setItem('non:run:non-v1-2026-01','{"broken":');});
    await broken.goto(base+'/netto-o-niente.html');await ready(broken);assert.match(await broken.locator('#non-storage').textContent(),/non era leggibile/);
    await click(broken,'start');await score(broken,0);
    checks.push('storage bloccato/corrotto e tracker assente: gioco utilizzabile');
    // Doppio tap reale e errore di generazione recuperabile.
    const {page:tap}=await setup();
    await tap.goto(base+'/netto-o-niente.html#'+N.codificaSfida({seed:0,target:0}));await ready(tap);await click(tap,'start');
    await tap.locator(`[data-action="${S.generaConfronto({seed:0,indice:1}).vincitore}"]`).dblclick();
    await score(tap,1);assert.equal((await current(tap)).scelte.length,1);
    await tap.evaluate(()=>{window.originalGenerator=NON_SCENARI.generaConfronto;NON_SCENARI.generaConfronto=()=>({ok:false});});
    await click(tap,'next');assert.equal(await tap.locator('#non-error-title').count(),1);
    assert.equal((await current(tap)).scelte.length,1);
    await tap.evaluate(()=>{NON_SCENARI.generaConfronto=window.originalGenerator;});await click(tap,'recover');
    await score(tap,1);assert.equal((await current(tap)).fase,'DOMANDA');
    // Replay lungo, guasto a metà e ripresa della cronologia originale.
    const {page:long}=await setup(undefined,()=>{
      let api;
      Object.defineProperty(window,'NON_SCENARI',{configurable:true,get:()=>api,set:value=>{
        const generate=value.generaConfronto;
        value.generaConfronto=args=>sessionStorage.getItem('test-non-fault')==='1'&&args.indice===14?{ok:false}:generate(args);
        api=value;
      }});
    });
    let longRun=N.creaPartita({seed:7,target:10});
    for(let n=0;n<105;n++){longRun=N.rispondi(longRun,longRun.round.vincitore);if(n<104)longRun=N.prossimo(longRun);}
    await long.goto(base+'/netto-o-niente.html');await ready(long);
    await long.evaluate(({raw,runKey,bestKey})=>{sessionStorage.setItem(runKey,raw);localStorage.setItem(bestKey,'105');sessionStorage.setItem('test-non-fault','1');},{raw:N.salvaRun(longRun),runKey,bestKey});
    await long.goto(base+'/netto-o-niente.html#'+N.codificaSfida({seed:7,target:10}));await ready(long);
    assert.equal(await long.locator('#non-error-title').count(),1);
    assert.equal((await current(long)).scelte.length,105,'errore non tronca il salvataggio');
    await long.evaluate(()=>sessionStorage.removeItem('test-non-fault'));await click(long,'recover');await ready(long);
    await score(long,105);assert.equal((await current(long)).scelte.length,105);
    assert.equal((await current(long)).fase,'RIVELAZIONE');
    assert.equal((await long.evaluate(()=>window.nonEvents)).length,0,'nessun evento dal replay');
    checks.push('doppio tap reale, errore tecnico recuperabile, replay a blocchi di 105 risposte senza perdita della cronologia');
    // Share API: successo, cancellazione, clipboard, ultimo fallback.
    for(const method of ['web_share','cancel','clipboard','manual']){
      const {page:share}=await setup();await endZero(share);
      await share.evaluate(method=>{
        window.copied=null;window.shared=null;
        Object.defineProperty(navigator,'share',{configurable:true,value:method==='web_share'?async d=>{window.shared=d;}:
          method==='cancel'?async()=>{throw new DOMException('cancel','AbortError');}:undefined});
        Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{
          if(method==='manual')throw new DOMException('denied','NotAllowedError');window.copied=text;
        }}});
      },method);
      await click(share,'share');await share.waitForFunction(()=>!document.querySelector('[data-action="share"]').disabled);
      const out=await share.evaluate(()=>({copied:window.copied,shared:window.shared,events:window.nonEvents,status:document.getElementById('non-share-status').textContent}));
      if(method==='cancel'){assert.equal(out.copied,null);assert.equal(out.status,'');assert.equal(out.events.filter(e=>e[1]==='non_share').length,0);}
      else{
        assert.equal(out.events.filter(e=>e[1]==='non_share').length,1);
        assert.equal(out.events.at(-1)[2].method,method);
        if(method==='clipboard'){assert.equal(out.status,'Link copiato');assert.match(out.copied,/&t=0$/);}
        if(method==='web_share')assert.match(out.shared.url,/&t=0$/);
        if(method==='manual'){assert.equal(await share.locator('textarea:focus').count(),1);assert.doesNotMatch(out.status,/Link copiato/);}
      }
      assert.deepEqual(out.events.filter(e=>e[1]!=='non_share').map(e=>e[1]),['non_start','non_answer','non_end']);
      for(const e of out.events)for(const k of Object.keys(e[2]))assert.ok(!['seed','url','A','B','target'].includes(k));
    }
    checks.push('WebShare/cancel/clipboard/manuale e analytics una sola volta, senza payload privati');
    // Clipboard reale, non solo API sostituita.
    const {page:clip,context:clipContext}=await setup();await clipContext.grantPermissions(['clipboard-read','clipboard-write'],{origin:base});
    await endZero(clip);await clip.evaluate(()=>Object.defineProperty(navigator,'share',{value:undefined,configurable:true}));
    await click(clip,'share');await clip.waitForFunction(()=>document.getElementById('non-share-status').textContent==='Link copiato');
    assert.match(await clip.evaluate(()=>navigator.clipboard.readText()),/&t=0$/);
    // Offline file://: tutte le funzioni e gli asset locali.
    const {page:offline,context:offContext}=await setup();await offContext.setOffline(true);
    await offline.goto('file://'+path.resolve(__dirname,'../../prototipo/netto-o-niente.html'));await ready(offline);
    await click(offline,'start');await click(offline,'A');assert.equal(await offline.locator('#non-feedback-title').count(),1);
    checks.push('clipboard reale riletta e partita file:// offline');
    // JS disabilitato conserva indicazione e link utile.
    const nojs=await browser.newContext({javaScriptEnabled:false});contexts.push(nojs);const nojsPage=await nojs.newPage();
    await nojsPage.goto(base+'/netto-o-niente.html');assert.match(await nojsPage.locator('noscript').textContent(),/Per giocare serve JavaScript/);
    checks.push('noscript con link al calcolatore');
    console.log(JSON.stringify({ok:true,base,checks},null,2));
  }finally{for(const c of contexts)await c.close();await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
