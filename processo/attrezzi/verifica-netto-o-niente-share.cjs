/* node processo/attrezzi/verifica-netto-o-niente-share.cjs <playwright-core> <cdp> [base-url]
 * Native OS/social sheet mocked; image generation, downloads, clicks and DOM are real. */
const {chromium}=require(process.argv[2]);
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const N=require('../../prototipo/netto-o-niente.js');
const base=process.argv[4]||'http://127.0.0.1:4182';
const out=path.resolve(__dirname,'../verifiche/ric-62-share');
const runKey='non:run:'+N.VERSIONE;
function conclusa(score){
  let s=N.creaPartita({seed:123456789});
  for(let n=0;n<score;n++){s=N.rispondi(s,s.round.vincitore);s=N.prossimo(s);}
  return N.rispondi(s,s.round.vincitore==='A'?'B':'A');
}
async function main(){
  fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.connectOverCDP(process.argv[3]),contexts=[],errors=[],checks=[];
  async function setup(score=12,width=390,mode='file'){
    const context=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce'});contexts.push(context);
    await context.route('**/analytics.js',r=>r.fulfill({contentType:'application/javascript',body:''}));
    await context.addInitScript(({raw,key,mode})=>{
      sessionStorage.setItem(key,raw);localStorage.setItem('non:best:non-v1-2026-01','999');
      window.events=[];window.calls=[];window.copies=[];
      window.gtag=(...args)=>window.events.push(args);
      Object.defineProperty(navigator,'canShare',{configurable:true,value:d=>mode!=='text'&&!!d.files});
      Object.defineProperty(navigator,'share',{configurable:true,value:mode==='absent'?undefined:d=>{
        window.calls.push({data:d,active:navigator.userActivation.isActive});
        if(mode==='cancel')return Promise.reject(new DOMException('cancel','AbortError'));
        if(mode==='error')return Promise.reject(new DOMException('blocked','NotAllowedError'));
        if(mode==='pending')return new Promise(resolve=>window.finishShare=resolve);
        return Promise.resolve();
      }});
      if(mode==='canvas-error')HTMLCanvasElement.prototype.getContext=()=>null;
      if(mode==='png-error')HTMLCanvasElement.prototype.toDataURL=()=>{throw Error('no encoding');};
      if(mode==='no-file')Object.defineProperty(window,'File',{value:undefined});
      Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async t=>window.copies.push(t)}});
    },{raw:N.salvaRun(conclusa(score)),key:runKey,mode});
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.goto(base+'/netto-o-niente.html');
    await page.waitForFunction(()=>document.getElementById('non-mount').getAttribute('aria-busy')==='false');
    await page.evaluate(()=>document.fonts.ready);
    return{page,context};
  }
  const click=(p,a)=>p.locator(`[data-action="${a}"]`).click();
  const checkFits=async p=>{
    assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth));
    assert.deepEqual(await p.locator('.non-result button,.non-result img').evaluateAll(els=>els.filter(el=>{
      const r=el.getBoundingClientRect();return r.width>0&&(r.left<0||r.right>innerWidth+1);
    }).map(e=>e.outerHTML)),[]);
  };
  try{
    const {page}=await setup();await checkFits(page);
    assert.equal(await page.locator('[data-action="share"]').textContent(),'Condividi');
    assert.equal(await page.locator('#non-share-options').getAttribute('open'),null);
    assert.match(await page.locator('#non-receipt img').getAttribute('alt'),/12 risposte/);
    await page.screenshot({path:path.join(out,'risultato-mobile.png'),fullPage:true});
    await click(page,'share');
    const data=await page.evaluate(async()=>{
      const {data:d,active}=window.calls[0],f=d.files[0],bytes=new Uint8Array(await f.arrayBuffer());
      const bitmap=await createImageBitmap(f);
      return{active,name:f.name,type:f.type,size:f.size,signature:[...bytes.slice(0,8)],width:bitmap.width,height:bitmap.height,text:d.text,
        calls:window.calls.length,events:window.events,copies:window.copies,preview:document.querySelector('#non-receipt img').src};
    });
    assert.equal(data.active,true,'share riceve attivazione del click');assert.equal(data.calls,1);
    assert.equal(data.name,'netto-o-niente-12.png');assert.equal(data.type,'image/png');
    assert.deepEqual(data.signature,[137,80,78,71,13,10,26,10]);assert.equal(data.width,1080);assert.equal(data.height,1350);
    assert.ok(data.size>10000&&data.size<1000000);assert.ok(data.text.endsWith('&t=12'));assert.deepEqual(data.copies,[]);
    assert.deepEqual(data.events.map(e=>[e[1],e[2]]),[['non_share',{method:'web_share_file'}]]);
    fs.writeFileSync(path.join(out,'scontrino-12.png'),Buffer.from(data.preview.split(',')[1],'base64'));
    await page.reload();await page.waitForSelector('#non-receipt img');
    assert.equal(await page.locator('#non-receipt img').getAttribute('src'),data.preview,'stesso risultato dopo reload');
    checks.push('PNG reale 1080×1350, score run e link, file pronto nel click con attivazione, reload stabile e nessun upload');
    // Download reale riusa lo stesso PNG, non rigenera o carica dati altrove.
    await page.locator('#non-share-options summary').click();
    const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#non-save-receipt').click()]);
    assert.equal(download.suggestedFilename(),'netto-o-niente-12.png');
    assert.deepEqual(fs.readFileSync(await download.path()),Buffer.from(data.preview.split(',')[1],'base64'));
    checks.push('download opzionale reale e byte identici all’immagine condivisa');
    for(const mode of ['text','cancel','error','absent','canvas-error','png-error','no-file']){
      const {page:p}=await setup(0,375,mode);await click(p,'share');
      await p.waitForFunction(()=>!document.querySelector('[data-action="share"]').disabled);
      const result=await p.evaluate(()=>({calls:window.calls.map(x=>({file:!!x.data.files,url:x.data.url,active:x.active})),copies:window.copies,events:window.events,status:document.getElementById('non-share-status').textContent,open:document.getElementById('non-share-options').open}));
      assert.deepEqual(result.copies,[]);
      if(mode==='cancel'){assert.equal(result.status,'');assert.equal(result.open,false);assert.deepEqual(result.events,[]);}
      else if(mode==='absent'||mode==='error'){
        assert.equal(result.open,true);assert.deepEqual(result.events,[]);await click(p,'copy');
        assert.equal(await p.locator('#non-share-status').textContent(),'Risultato e link copiati');
        assert.match(await p.evaluate(()=>window.copies[0]),/&t=0$/);
        if(mode==='absent')await p.screenshot({path:path.join(out,'alternative-mobile.png'),fullPage:true});
      }else{assert.equal(result.calls[0].file,false);assert.match(result.calls[0].url,/&t=0$/);assert.equal(result.calls[0].active,true);}
      await checkFits(p);
    }
    checks.push('testo senza file, cancel senza effetti collaterali, errore nativo, API assente, canvas/PNG/File indisponibili');
    const {page:pending}=await setup(1,390,'pending');await click(pending,'share');
    // Tentativo di share concorrente + nuova run mentre il sistema è aperto.
    await pending.locator('#non-share-options summary').click();await click(pending,'share-link');
    assert.equal(await pending.evaluate(()=>window.calls.length),1);
    await click(pending,'new');await pending.evaluate(()=>window.finishShare());
    assert.equal(await pending.locator('.non-result').count(),0);
    assert.deepEqual(await pending.evaluate(()=>window.events.filter(e=>e[1]==='non_share')),[]);
    checks.push('condivisione concorrente bloccata e completamento vecchia run ignorato');
    const {page:double}=await setup(1,390,'pending');await double.locator('[data-action="share"]').dblclick();
    assert.equal(await double.evaluate(()=>window.calls.length),1);await double.evaluate(()=>window.finishShare());
    const {page:desktop}=await setup(12,1440);await desktop.screenshot({path:path.join(out,'risultato-desktop.png'),fullPage:true});
    for(const width of [375,390,1440]){await desktop.setViewportSize({width,height:844});await checkFits(desktop);}
    await desktop.setViewportSize({width:375,height:844});await desktop.evaluate(()=>document.body.style.zoom='2');await checkFits(desktop);
    await desktop.screenshot({path:path.join(out,'risultato-zoom-200.png'),fullPage:true});
    const {page:zero}=await setup(0);await zero.screenshot({path:path.join(out,'risultato-zero.png'),fullPage:true});
    // Schermo corto e percorso reale: la CTA non richiede scroll dopo la sconfitta.
    await zero.setViewportSize({width:375,height:667});await click(zero,'new');
    const winner=await zero.evaluate(()=>{
      const raw=NON.leggiRun(sessionStorage.getItem('non:run:'+NON.VERSIONE));
      return NON.creaPartita(raw).round.vincitore;
    });
    await click(zero,winner==='A'?'B':'A');
    assert.equal(await zero.evaluate(()=>document.activeElement.id),'non-result-title');
    const rect=await zero.locator('[data-action="share"]').boundingBox();
    assert.ok(rect.y>=64&&rect.y+rect.height<=667,'Condividi visibile senza scroll anche a 375×667');
    await zero.screenshot({path:path.join(out,'risultato-schermo-corto.png')});
    // Sequenza del link ricevuto in un contesto pulito.
    const recipient=await browser.newContext();contexts.push(recipient);await recipient.route('**/analytics.js',r=>r.fulfill({body:''}));
    const rp=await recipient.newPage();await rp.goto(base+'/netto-o-niente.html#'+data.text.split('#')[1]);
    await rp.waitForSelector('[data-action="start"]');assert.match(await rp.locator('.non-target').textContent(),/ha fatto 12/);
    await click(rp,'start');assert.equal(await rp.locator('.non-ral').first().textContent(),new Intl.NumberFormat('it-IT').format(Number(N.creaPartita({seed:123456789}).round.A.ralRaw))+' €');
    checks.push('doppio tap, mobile 375/390, desktop 1440, zoom 200%, score zero e sfida ricevuta in altro contesto');
    assert.deepEqual(errors,[]);console.log(JSON.stringify({ok:true,base,checks,errors},null,2));
  }finally{for(const c of contexts)await c.close();await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
