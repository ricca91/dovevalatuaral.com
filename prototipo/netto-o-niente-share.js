/* Scontrino locale: nessun upload, dipendenza o modifica alla sequenza di gioco. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./netto-o-niente.js'),require('./netto-o-niente-link.js'));
  else root.NON_SHARE=factory(root.NON,root.NON_LINK);
})(typeof globalThis!=='undefined'?globalThis:this,function(N,L){
  'use strict';
  const numero=n=>new Intl.NumberFormat('it-IT').format(n);
  function risultato(stato,base){
    N.testoSfida(stato); // Valida fase, seed e punteggio della run, mai il best.
    const links=L.crea({versione:N.VERSIONE,seed:stato.seed,score:stato.score},base),{url}=links;
    const score=numero(stato.score),prossimo=numero(stato.score+1);
    const frase=stato.score===0?'Pensavo di saper leggere un’offerta di lavoro. Mi sono fermato alla prima.':
      `Pensavo di saper leggere un’offerta di lavoro. Mi sono fermato al confronto ${prossimo}.`;
    const invito=`Tu arrivi a ${prossimo}?`;
    const testo=`NETTO O NIENTE · ${score} di fila.\n${frase}\n${invito}\nStessa sequenza: ${url}`;
    return{...links,score,frase,invito,testo,url,nomeFile:`netto-o-niente-${stato.score}.png`,
      alt:`Netto o niente. ${score} ${stato.score===1?'risposta corretta':'risposte corrette'} di fila. ${frase} ${invito} dovevalatuaral.com`};
  }
  function disegna(canvas,dati){
    canvas.width=1080;canvas.height=1350;
    const c=canvas.getContext('2d');if(!c)throw new Error('Canvas non disponibile');
    const ink='#1E1C2B',paper='#F7F6F1',lime='#DCF06B';
    c.fillStyle=ink;c.fillRect(0,0,1080,1350);
    c.fillStyle=paper;c.fillRect(64,64,952,1200);
    // Bordo strappato dello scontrino, non un cedolino fiscale.
    c.beginPath();c.moveTo(64,1264);
    for(let x=64;x<1016;x+=28){c.lineTo(x+14,1280);c.lineTo(Math.min(x+28,1016),1264);}
    c.closePath();c.fill();
    c.textAlign='center';c.textBaseline='middle';
    function testo(value,y,size=44,font='"Archivo", sans-serif',weight=700,max=800){
      c.fillStyle=ink;c.font=`${weight} ${size}px ${font}`;
      while(c.measureText(value).width>max&&size>16){size--;c.font=`${weight} ${size}px ${font}`;}
      c.fillText(value,540,y);
    }
    const mono='"JetBrains Mono", monospace';
    testo('[ LO SCONTRINO DELLA PARTITA ]',136,30,mono,400,850);
    testo('NETTO O NIENTE',230,76);
    function linea(y){c.strokeStyle=ink;c.lineWidth=2;c.setLineDash([10,10]);c.beginPath();c.moveTo(112,y);c.lineTo(968,y);c.stroke();c.setLineDash([]);}
    linea(306);
    c.fillStyle=lime;c.fillRect(112,352,856,344);
    testo(dati.score,500,248,mono,800,800);
    testo(dati.score==='1'?'RISPOSTA GIUSTA DI FILA':'RISPOSTE GIUSTE DI FILA',643,36,mono,500);
    testo('Pensavo di saper leggere',781,46,'"Instrument Sans", sans-serif',500);
    testo('un’offerta di lavoro.',843,46,'"Instrument Sans", sans-serif',500);
    const finale=dati.frase.split('. ')[1];
    testo(finale,918,38,'"Instrument Sans", sans-serif',500,840);
    linea(995);
    testo(dati.invito,1063,60);
    testo('dovevalatuaral.com',1170,43,mono,700,840);
  }
  function prepara(stato,base){
    const dati=risultato(stato,base),canvas=document.createElement('canvas');
    disegna(canvas,dati);
    // PNG verticale facoltativo per il download; i social usano il link pubblico.
    const src=canvas.toDataURL('image/png');
    if(!src.startsWith('data:image/png;base64,'))throw new Error('PNG non disponibile');
    return{...dati,src};
  }
  function destinazioni(dati){
    return[
      {nome:'LinkedIn',method:'linkedin',url:'https://www.linkedin.com/sharing/share-offsite/?url='+encodeURIComponent(dati.url)},
      {nome:'X',method:'x',url:'https://twitter.com/intent/tweet?text='+encodeURIComponent(`NETTO O NIENTE · ${dati.score} di fila. ${dati.invito}`)+'&url='+encodeURIComponent(dati.url)},
      {nome:'WhatsApp',method:'whatsapp',url:'https://wa.me/?text='+encodeURIComponent(dati.testo)},
      {nome:'Telegram',method:'telegram',url:'https://t.me/share/url?url='+encodeURIComponent(dati.url)+'&text='+encodeURIComponent(dati.testo.replace('\nStessa sequenza: '+dati.url,''))}
    ];
  }
  return{risultato,disegna,prepara,destinazioni};
});
