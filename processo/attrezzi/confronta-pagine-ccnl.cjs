#!/usr/bin/env node
/* ============================================================
   CONFRONTO DELLE PAGINE CCNL fra due ref git (RIC-231).

   Serve ai refactor di prototipo/genera-pagine-ccnl.js e di
   prototipo/ccnl-page.template.js: il vincolo è zero diff byte
   per byte nelle pagine generate sotto minimi-ccnl/.

   Uso:
     node processo/attrezzi/confronta-pagine-ccnl.cjs [BASE [ALTRO]] [--alla AAAA-MM-GG]

     BASE   ref git di partenza (default: main)
     ALTRO  ref git da confrontare (default: WORKING = working tree
            corrente, file non versionati compresi, .gitignore rispettato)
     --alla data di riferimento passata a generate() (default 2026-06-30,
            uguale per i due lati)

   Per ogni lato estrae il codice in una tmpdir (git archive, oppure
   copia del working tree: il checkout corrente non viene toccato),
   esegue generate() in un processo a parte verso una tmpdir di
   output, poi fa `diff -r` delle due cartelle minimi-ccnl/.

   Determinismo: generate() e i template leggono la data corrente solo
   come default di `alla`, che qui è fissata. Non risultano altre
   fonti non deterministiche (niente rete, niente random).

   Exit: 0 pagine identiche, 1 diverse, 2 errore.
   ============================================================ */

const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {execFileSync,spawnSync}=require('node:child_process');

const RADICE=path.resolve(__dirname,'..','..');
const ALLA_DEFAULT='2026-06-30';

function argomenti(argv){
  const pos=[];let alla=ALLA_DEFAULT;
  for(let i=0;i<argv.length;i++){
    if(argv[i]==='--alla')alla=argv[++i];
    else if(argv[i].startsWith('--alla='))alla=argv[i].slice(7);
    else pos.push(argv[i]);
  }
  if(!/^\d{4}-\d{2}-\d{2}$/.test(alla||''))throw new Error(`--alla non valida: ${alla}`);
  if(pos.length>2)throw new Error('Troppi argomenti: BASE [ALTRO] [--alla AAAA-MM-GG]');
  return {base:pos[0]||'main',altro:pos[1]||'WORKING',alla};
}

function estrai(ref,dest){
  fs.mkdirSync(dest,{recursive:true});
  if(ref==='WORKING'){
    const elenco=execFileSync('git',['ls-files','-z','-co','--exclude-standard'],{cwd:RADICE,maxBuffer:1<<28}).toString().split('\0').filter(Boolean);
    for(const f of elenco){
      const src=path.join(RADICE,f);
      if(!fs.existsSync(src))continue;
      fs.mkdirSync(path.dirname(path.join(dest,f)),{recursive:true});
      fs.copyFileSync(src,path.join(dest,f));
    }
  }else{
    const tar=execFileSync('git',['archive','--format=tar',ref],{cwd:RADICE,maxBuffer:1<<30});
    execFileSync('tar',['-x','-C',dest],{input:tar});
  }
}

function genera(codice,out,alla){
  const gen=path.join(codice,'prototipo','genera-pagine-ccnl.js');
  const r=spawnSync(process.execPath,['-e',
    'const {generate}=require(process.argv[1]);const p=generate(process.argv[2],{alla:process.argv[3]});console.log(p.length)',
    gen,out,alla],{cwd:codice,encoding:'utf8'});
  if(r.status!==0)throw new Error(`generate() fallita:\n${r.stderr||r.stdout}`);
  return Number(r.stdout.trim());
}

function conta(dir){
  let n=0;
  (function giro(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){
    if(e.isDirectory())giro(path.join(d,e.name));else if(e.name==='index.html')n++;}})(dir);
  return n;
}

function main(){
  const {base,altro,alla}=argomenti(process.argv.slice(2));
  for(const ref of [base,altro])if(ref!=='WORKING')execFileSync('git',['rev-parse','--verify','--quiet',`${ref}^{commit}`],{cwd:RADICE,stdio:'ignore'});
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'confronta-ccnl-'));
  try{
    const lati=[['base',base],['altro',altro]].map(([nome,ref])=>{
      const codice=path.join(tmp,nome+'-codice'),out=path.join(tmp,nome+'-out');
      estrai(ref,codice);fs.mkdirSync(out);
      const generate=genera(codice,out,alla);
      return {ref,out,generate,pagine:conta(path.join(out,'minimi-ccnl'))};
    });
    const [a,b]=lati;
    const d=spawnSync('diff',['-rq',path.join(a.out,'minimi-ccnl'),path.join(b.out,'minimi-ccnl')],{encoding:'utf8',maxBuffer:1<<28});
    if(d.status>1)throw new Error(`diff fallito: ${d.stderr}`);
    const righe=d.stdout.split('\n').filter(Boolean);
    console.log(`Data di riferimento: ${alla}`);
    console.log(`${a.ref}: ${a.pagine} pagine (generate: ${a.generate})`);
    console.log(`${b.ref}: ${b.pagine} pagine (generate: ${b.generate})`);
    if(!righe.length){console.log('IDENTICHE: zero differenze.');return 0;}
    console.log(`DIVERSE: ${righe.length} file con differenze`);
    for(const r of righe.slice(0,50))console.log('  '+r.split(tmp+path.sep).join(''));
    if(righe.length>50)console.log(`  ... e altri ${righe.length-50}`);
    const full=spawnSync('diff',['-r','-U2',path.join(a.out,'minimi-ccnl'),path.join(b.out,'minimi-ccnl')],{encoding:'utf8',maxBuffer:1<<28}).stdout;
    console.log('\n'+full.split('\n').slice(0,40).join('\n').split(tmp+path.sep).join(''));
    return 1;
  }finally{fs.rmSync(tmp,{recursive:true,force:true});}
}

try{process.exitCode=main();}catch(e){console.error('Errore: '+e.message);process.exitCode=2;}
