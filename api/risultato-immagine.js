const {Resvg}=require('@resvg/resvg-js');
const path=require('node:path');
const {rispondi,svg}=require('../server/risultato.js');
const fontFiles=['Archivo.ttf','JetBrainsMono.ttf'].map(f=>path.join(__dirname,'../server/fonts',f));
function png(m){return new Resvg(svg(m),{font:{fontFiles,loadSystemFonts:false}}).render().asPng();}
module.exports=(req,res)=>rispondi(req,res,png,'image/png');
