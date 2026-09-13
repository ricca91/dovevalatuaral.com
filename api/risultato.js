const {rispondi,html}=require('../server/risultato.js');
module.exports=(req,res)=>rispondi(req,res,html,'text/html; charset=utf-8');
