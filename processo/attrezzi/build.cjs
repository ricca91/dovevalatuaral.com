const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
function build(){
  require('../../prototipo/genera-pagine-ral.js').generate();
  const output=path.join(root,'dist');
  fs.rmSync(output,{recursive:true,force:true});
  fs.cpSync(path.join(root,'prototipo'),output,{recursive:true,filter(file){
    const name=path.basename(file);
    // Solo su questo ramo: il prototipo di RIC-66 deve arrivare sulla preview
    // Vercel, perche' e' l'unico modo che ha Riccardo di guardarlo. Non va in main.
    if(name==='prototype-homepage-contatore.html')return true;
    return name!=='articoli'&&!name.startsWith('prototype-')&&!name.startsWith('genera-')&&!/\.(?:md|test\.js|template\.js)$/.test(name)&&!['articoli-parser.js','.gitkeep'].includes(name);
  }});
  console.log('Build completata: pagine statiche in dist/; sorgenti e bozze escluse.');
}
if(require.main===module){try{build();}catch(error){console.error(error.message);process.exitCode=1;}}
module.exports={build};
