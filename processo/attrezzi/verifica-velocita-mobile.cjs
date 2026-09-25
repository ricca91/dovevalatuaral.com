/* Uso: NODE_PATH=/path/to/node_modules CHROME_PATH=/path/to/chrome node processo/attrezzi/verifica-velocita-mobile.cjs <preview-url> [output-dir] */
const {chromium}=require('playwright');const assert=require('assert/strict');const fs=require('fs');
const base=process.argv[2];const out=process.argv[3]||'/tmp/ric-81-reports';fs.mkdirSync(out,{recursive:true});
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH,args:['--no-sandbox']});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const page=await context.newPage();const errors=[],missing=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)missing.push([r.url(),r.status()]);});
 const ready=()=>page.waitForFunction(()=>performance.getEntriesByName('calcolatore-pronto').length>0);
 // Ritarda solo i dati: il modulo e la navigazione devono essere già presenti.
 let release;const gate=new Promise(r=>release=r);await page.route('**/dati-addizionali-2026.js',async route=>{await gate;await route.continue()});
 await page.goto(base+'/?ral=42000&m=14&c=H501&f=1200&n=f22&calc=1#risultato',{waitUntil:'commit'});
 await page.locator('#ral').waitFor();await page.locator('#ral').fill('48000');await page.locator('#ral').evaluate(el=>el.setSelectionRange(2,2));
 assert.equal(await page.locator('#go').isDisabled(),true);assert.equal(await page.locator('h1').textContent(),'Dove va la tua RAL');
 await page.locator('.site-menu-toggle').click();assert.equal(await page.locator('.site-menu-toggle').getAttribute('aria-expanded'),'true');await page.locator('.site-menu-toggle').click();await page.locator('#ral').focus();await page.locator('#ral').evaluate(el=>el.setSelectionRange(2,2));
 await page.screenshot({path:out+'/loading-mobile.png'});release();await ready();
 assert.equal(await page.locator('#ral').inputValue(),'48000');assert.equal(await page.locator('#comune').inputValue(),'H501');assert.equal(await page.locator('#mensilita').inputValue(),'14');
 assert.equal(await page.evaluate(()=>document.activeElement.id),'ral');assert.equal(await page.locator('#ral').evaluate(el=>el.selectionStart),2);
 assert.ok(await page.locator('#risultato').count());assert.equal(await page.locator('#fringe').inputValue(),'1200');assert.equal(await page.locator('#nucleo-eta-0').inputValue(),'22');
 await page.unroute('**/dati-addizionali-2026.js');
 await page.locator('#reset').click();assert.equal(await page.locator('#ral').inputValue(),'');
 await page.locator('#ral').fill('35000');await page.locator('#regione').selectOption({label:'Lazio'});await page.locator('#provincia').selectOption({label:'Roma (RM)'});await page.locator('#comune').selectOption('H501');await page.locator('#go').click();assert.ok(await page.locator('#risultato').count());
 await page.locator('[data-opt=nucleo]').click();await page.locator('#nucleo-aggiungi').click();await page.locator('#nucleo-eta-0').fill('22');
 await page.locator('[data-opt=pacchetto]').click();await page.locator('#fringe').fill('1800');await page.locator('#go').click();
 await page.locator('#vai-compara').click();await ready();assert.ok(page.url().includes('compara.html#'));
 await page.setViewportSize({width:1440,height:1000});
 await page.locator('#B-ral').fill('42000');await page.locator('#B-regione').selectOption({label:'Lombardia'});await page.locator('#B-provincia').selectOption({label:'Milano (MI)'});await page.locator('#B-comune').selectOption('F205');await page.locator('#btn-confronta').click();await page.locator('#esito-titolo').waitFor();
 assert.equal(await page.locator('#A-comune').inputValue(),'H501');assert.equal(await page.locator('#B-comune').inputValue(),'F205');
 await page.goto(base+'/ccnl-livello.html');await ready();await page.locator('#ccnl-form button[type=submit]').click();await page.locator('#risultato').waitFor({state:'visible'});
 await page.goto(base+'/calcolo-tredicesima/?ral=35000');await ready();await page.locator('#risultato').waitFor({state:'visible'});
 await page.setViewportSize({width:390,height:844});await page.locator('.site-menu-toggle').click();assert.equal(await page.locator('.site-menu-toggle').getAttribute('aria-expanded'),'true');console.log('PASS delayed data, editable inputs/focus, URL, municipality, reset, transfer');
 for(const [route,name] of [['/','home'],['/netto-ral.html','inverse'],['/ral-35000-netto/','ral'],['/minimi-ccnl/commercio/5-livello/','ccnl'],['/blog/esempio-busta-paga/','article'],['/ccnl-livello.html','ccnl-calculator'],['/calcolo-tredicesima/?ral=35000','tredicesima'],['/netto-o-niente.html','game']]){
   for(const [width,height,kind] of [[390,844,'mobile'],[1440,1000,'desktop']]){
     await page.setViewportSize({width,height});const response=await page.goto(base+route);assert.equal(response.status(),200);
     if(['home','inverse','ccnl-calculator','tredicesima','game'].includes(name))await ready();
     await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:out+'/'+name+'-'+kind+'.png',fullPage:true});
     assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,route+' overflow '+kind);
     assert.ok(await page.locator('h1').count());
   }
 }
 await page.goto(base+'/netto-ral.html');await ready();await page.locator('#netto').fill('2000');await page.locator('#calcola').click();await page.locator('#risultato').waitFor({state:'visible'});assert.match(await page.locator('#ral-risultato').textContent(),/€/);
 await page.goto(base+'/netto-o-niente.html');await ready();await page.locator('[data-action=start]').click();await page.locator('[data-action=A]').click();await page.locator('#non-feedback-title').waitFor();
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);console.log('PASS mobile/desktop routes, inversion, game, no JS errors');
 // Un guasto reale deve bloccare il calcolo, mostrare recupero, conservare input nel retry.
 const failed=await context.newPage();await failed.route('**/dati-addizionali-2026.js',r=>r.abort());
 await failed.goto(base+'/');await failed.locator('#avvio-riprova').waitFor({state:'visible'});assert.equal(await failed.locator('#go').isDisabled(),true);await failed.locator('#ral').fill('51000');
 await failed.unroute('**/dati-addizionali-2026.js');await failed.locator('#avvio-riprova').click();await failed.waitForFunction(()=>performance.getEntriesByName('calcolatore-pronto').length>0);assert.equal(await failed.locator('#ral').inputValue(),'51000');await failed.locator('#go').click();await failed.locator('#risultato').waitFor();console.log('PASS asset failure and retry');
 await failed.route('**/calcolatore-avvio.js',r=>r.abort());await failed.goto(base+'/');await failed.locator('#avvio-riprova').waitFor({state:'visible'});await failed.unroute('**/calcolatore-avvio.js');await failed.locator('#avvio-riprova').click();await failed.waitForFunction(()=>performance.getEntriesByName('calcolatore-pronto').length>0);console.log('PASS bootstrap failure and retry');
 const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});const staticPage=await nojs.newPage();await staticPage.goto(base+'/');assert.equal(await staticPage.locator('h1').textContent(),'Dove va la tua RAL');assert.equal(await staticPage.locator('#go').isDisabled(),true);assert.match(await staticPage.locator('noscript').textContent(),/attiva JavaScript/);console.log('PASS useful static HTML and noscript');
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
