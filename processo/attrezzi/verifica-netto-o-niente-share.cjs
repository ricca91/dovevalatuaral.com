/* node processo/attrezzi/verifica-netto-o-niente-share.cjs <playwright-core> <cdp> [base-url] [output-dir]
 * Sito/PNG/metadata reali; non pubblica sui social e non simula l'esito dei crawler reali. */
const {chromium}=require(process.argv[2]);
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const N=require('../../prototipo/netto-o-niente.js'),L=require('../../prototipo/netto-o-niente-link.js');
const base=process.argv[4]||'http://127.0.0.1:4182';
const out=process.argv[5]||path.resolve(__dirname,'../verifiche/ric-62-social');
const runKey='non:run:'+N.VERSIONE;
function conclusa(score){
  let s=N.creaPartita({seed:123456789});
  for(let n=0;n<score;n++){s=N.rispondi(s,s.round.vincitore);s=N.prossimo(s);}
  return N.rispondi(s,s.round.vincitore==='A'?'B':'A');
}
async function main(){
  fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.connectOverCDP(process.argv[3]),contexts=[],errors=[],checks=[];
  async function setup(score=12,width=390,mode='normal'){
    const context=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce'});contexts.push(context);
    await context.route('**/analytics.js',r=>r.fulfill({contentType:'application/javascript',body:''}));
    await context.addInitScript(({raw,key,mode})=>{
      sessionStorage.setItem(key,raw);localStorage.setItem('non:best:non-v1-2026-01','999');
      window.events=[];window.calls=[];window.copies=[];window.gtag=(...args)=>window.events.push(args);
      Object.defineProperty(navigator,'share',{configurable:true,value:d=>{window.calls.push(d);throw Error('Menu nativo vietato');}});
      if(mode==='canvas-error')HTMLCanvasElement.prototype.getContext=()=>null;
      Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:t=>{
        if(mode==='denied')return Promise.reject(Error('denied'));
        if(mode==='pending')return new Promise(resolve=>window.finishCopy=resolve);
        window.copies.push(t);return Promise.resolve();
      }}});
    },{raw:N.salvaRun(conclusa(score)),key:runKey,mode});
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.goto(base+'/netto-o-niente.html');await page.waitForSelector('[data-action="share"]');await page.evaluate(()=>document.fonts.ready);
    await page.waitForFunction(()=>{const i=document.getElementById('non-og-preview');return i.complete&&i.naturalWidth===1200;});
    return{page,context};
  }
  const click=(p,a)=>p.locator(`[data-action="${a}"]`).click();
  const fits=async p=>{
    assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth));
    assert.deepEqual(await p.locator('dialog[open] a,dialog[open] button').evaluateAll(els=>els.filter(el=>{
      const r=el.getBoundingClientRect();return r.width>0&&(r.left<0||r.right>innerWidth+1||r.height<44);
    }).map(e=>e.outerHTML)),[]);
  };
  try{
    const {page,context}=await setup();await click(page,'share');
    assert.equal(await page.locator('#non-share-dialog').evaluate(d=>d.open),true);
    assert.deepEqual(await page.locator('[data-share-destination]').evaluateAll(els=>els.map(e=>e.dataset.shareDestination)),['linkedin','x','whatsapp','telegram']);
    await fits(page);await page.screenshot({path:path.join(out,'finestra-mobile.png')});
    const links=L.crea({seed:123456789,score:12},base);
    assert.equal(await page.locator('.non-social-preview').getAttribute('href'),links.url);
    assert.equal(await page.locator('#non-og-preview').getAttribute('src'),links.immagine);
    assert.equal(await page.evaluate(()=>window.calls.length),0);
    await click(page,'copy');assert.equal(await page.evaluate(()=>window.copies[0]),links.url);
    assert.equal(await page.locator('#non-share-status').textContent(),'Link copiato');
    // Popup reali, destinazioni intercettate: nessuna pubblicazione esterna.
    for(const method of ['linkedin','x','whatsapp','telegram']){
      const a=page.locator(`[data-share-destination="${method}"]`),url=await a.getAttribute('href'),parsed=new URL(url);
      if(method==='whatsapp')assert.ok(parsed.searchParams.get('text').endsWith(links.url));else assert.equal(parsed.searchParams.get('url'),links.url);
      await context.route(url,r=>r.fulfill({contentType:'text/html',body:'Destinazione social intercettata: nessuna pubblicazione.'}));
      const [popup]=await Promise.all([page.waitForEvent('popup'),a.click()]);await popup.waitForLoadState();assert.equal(popup.url(),url);await popup.close();
    }
    assert.equal(await page.evaluate(()=>window.events.filter(e=>e[1]==='non_share_destination').length),4);
    await page.bringToFront();await page.locator('[data-action="close-share"]').focus();
    for(let n=0;n<15;n++){await page.keyboard.press('Tab');assert.ok(await page.evaluate(()=>!!document.activeElement.closest('dialog')));}
    await page.keyboard.press('Escape');assert.equal(await page.locator('#non-share-dialog').evaluate(d=>d.open),false);
    assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),'share');
    await page.locator('[data-action="share"]').dblclick();assert.equal(await page.locator('dialog[open]').count(),1);
    await click(page,'close-share');assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),'share');
    checks.push('dialog nostro, 4 social, popup intercettati senza post, copia, Tab/Escape/focus/doppio click');
    for(const ua of ['LinkedInBot/1.0','Twitterbot/1.0','WhatsApp/2.0']){
      const r=await context.request.get(links.url,{headers:{'User-Agent':ua}});assert.equal(r.status(),200);
      const html=await r.text();for(const tag of ['og:title','og:description','og:url','og:image','twitter:card'])assert.ok(html.includes(tag));
      assert.ok(html.includes(links.immagine));assert.ok(html.includes('summary_large_image'));assert.ok(html.includes('noindex,follow'));
    }
    const png=await context.request.get(links.immagine);assert.equal(png.status(),200);assert.match(png.headers()['content-type'],/image\/png/);
    const bytes=await png.body();assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10]);
    assert.equal(bytes.readUInt32BE(16),1200);assert.equal(bytes.readUInt32BE(20),630);assert.ok(bytes.length<1000000);
    fs.writeFileSync(path.join(out,'anteprima-social-12.png'),bytes);
    const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});contexts.push(nojs);
    const landing=await nojs.newPage();await landing.goto(links.url);assert.match(await landing.locator('h1').textContent(),/12 di fila/);
    assert.equal(await landing.locator('img').evaluate(i=>i.complete&&i.naturalWidth),1200);
    assert.equal(await landing.getByRole('link',{name:'Accetta la sfida',exact:true}).getAttribute('href'),links.gioco);
    await landing.screenshot({path:path.join(out,'risultato-pubblico-mobile.png'),fullPage:true});
    const recipient=await browser.newContext();contexts.push(recipient);await recipient.route('**/analytics.js',r=>r.fulfill({body:''}));
    const rp=await recipient.newPage();await rp.goto(links.url);await rp.getByRole('link',{name:'Accetta la sfida',exact:true}).click();
    await rp.waitForSelector('[data-action="start"]');assert.match(await rp.locator('.non-target').textContent(),/ha fatto 12/);await click(rp,'start');
    assert.equal(await rp.locator('.non-ral').first().textContent(),new Intl.NumberFormat('it-IT').format(Number(N.creaPartita({seed:123456789}).round.A.ralRaw))+' €');
    checks.push('HTML OG/Twitter con user-agent bot, PNG 1200×630, landing senza JS e sfida identica in contesto pulito');
    for(const suffix of ['?x=1','?s=0'])assert.equal((await context.request.get(links.url+suffix)).status(),400);
    for(const q of ['v=bad&s=0&t=0',`v=${N.VERSIONE}&s=0&s=1&t=0`,`v=${N.VERSIONE}&s=0&t=%3Cscript%3E`])assert.equal((await context.request.get(base+'/api/risultato?'+q)).status(),400);
    assert.equal((await context.request.post(links.url)).status(),405);assert.equal((await context.request.head(links.immagine)).status(),200);
    checks.push('malformati/duplicati/chiavi aggiuntive rifiutati, POST 405, HEAD 200');
    for(const mode of ['denied','canvas-error','pending']){
      const {page:p}=await setup(0,375,mode);await click(p,'share');if(mode==='canvas-error')assert.equal(await p.locator('#non-save-receipt').isVisible(),false);
      await click(p,'copy');if(mode==='denied')assert.equal(await p.locator('textarea:focus').inputValue(),L.crea({seed:123456789,score:0},base).url);
      if(mode==='pending'){await click(p,'close-share');await click(p,'new');await p.evaluate(()=>window.finishCopy());assert.equal(await p.locator('dialog').count(),0);assert.equal(await p.evaluate(()=>window.events.filter(e=>e[1]==='non_share').length),0);}
    }
    for(const [width,height] of [[375,667],[390,844],[1440,900]]){
      await page.setViewportSize({width,height});await click(page,'share');await fits(page);await page.screenshot({path:path.join(out,`finestra-${width}.png`)});await click(page,'close-share');
    }
    await page.setViewportSize({width:375,height:667});await page.evaluate(()=>document.body.style.zoom='2');await click(page,'share');await fits(page);await page.screenshot({path:path.join(out,'finestra-zoom-200.png')});
    const events=await page.evaluate(()=>window.events);for(const e of events)for(const k of Object.keys(e[2]))assert.ok(!['seed','url','A','B','target'].includes(k));
    assert.deepEqual(errors,[]);checks.push('canvas indisponibile, clipboard rifiutata/tardiva, zero, 375/390/1440, zoom 200%, zero errori console');
    console.log(JSON.stringify({ok:true,base,checks,errors},null,2));
  }finally{for(const c of contexts)await c.close();await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
