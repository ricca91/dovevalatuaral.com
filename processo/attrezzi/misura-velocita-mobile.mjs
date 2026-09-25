// Richiede lighthouse 13.5.0 in un ambiente di strumenti separato dal sito.
// Uso: CHROME_PATH=/path/to/chrome node misura-velocita-mobile.mjs <url> <label> [mobile|desktop] [runs]
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import fs from 'node:fs';
const [url,label,form='mobile',runs='3']=process.argv.slice(2);
const output=process.env.REPORT_DIR||'/tmp/ric-81-reports';fs.mkdirSync(output,{recursive:true});
for(let i=1;i<=Number(runs);i++){
 const chrome=await chromeLauncher.launch({chromePath:process.env.CHROME_PATH,chromeFlags:['--headless','--no-sandbox','--disable-dev-shm-usage']});
 try{
 const {lhr,report}=await lighthouse(url,{port:chrome.port,output:['json','html'],onlyCategories:['performance'],formFactor:form,...(form==='desktop'?{screenEmulation:{mobile:false,width:1350,height:940,deviceScaleFactor:1,disabled:false},throttling:{rttMs:40,throughputKbps:10240,cpuSlowdownMultiplier:1,requestLatencyMs:0,downloadThroughputKbps:0,uploadThroughputKbps:0}}:{})});
 fs.writeFileSync(`${output}/${label}-${form}-${i}.json`,report[0]);fs.writeFileSync(`${output}/${label}-${form}-${i}.html`,report[1]);
 const a=lhr.audits;console.log(JSON.stringify({label,form,run:i,score:lhr.categories.performance.score,FCP:a['first-contentful-paint'].numericValue,LCP:a['largest-contentful-paint'].numericValue,TBT:a['total-blocking-time'].numericValue,CLS:a['cumulative-layout-shift'].numericValue,errors:lhr.runtimeError,ready:a['user-timings']?.details?.items}));
 }finally{await chrome.kill();}
}
