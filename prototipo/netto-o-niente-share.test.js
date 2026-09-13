const {test}=require('node:test');
const assert=require('node:assert/strict');
const H=require('./netto-o-niente-share.js'),N=require('./netto-o-niente.js');
const end=(score=12)=>({fase:'FINE',seed:123456789,score,best:999});
test('scontrino: run conclusa, zero, singolare e grandi punteggi, mai il best',()=>{
  for(const score of [0,1,12,101,999999999999999]){
    const r=H.risultato(end(score));
    assert.equal(r.score,new Intl.NumberFormat('it-IT').format(score));
    assert.equal(N.decodificaSfida(r.gioco.split('#')[1]).sfida.target,score);
    assert.equal(r.url,`https://www.dovevalatuaral.com/risultato/${N.VERSIONE}/123456789/${score}`);
    assert.equal(r.nomeFile,`netto-o-niente-${score}.png`);
    assert.ok(r.testo.includes(r.invito));assert.ok(r.alt.includes(r.score));
    assert.ok(r.testo.endsWith(r.url));
  }
  assert.match(H.risultato(end(0)).frase,/alla prima/);
  assert.match(H.risultato(end(1)).frase,/confronto 2/);
  assert.doesNotMatch(H.risultato(end()).testo,/999/);
  for(const fase of ['DOMANDA','RIVELAZIONE','ERRORE'])assert.throws(()=>H.risultato({...end(),fase}));
});
test('risultato e immagine rimangono sulla preview, canonical in produzione',()=>{
  for(const base of ['https://esempio.vercel.app','http://127.0.0.1:4182']){
    const d=H.risultato(end(),base);assert.equal(new URL(d.url).origin,base);
    assert.equal(new URL(d.immagine).origin,base);assert.equal(new URL(d.gioco).origin,base);
  }
  assert.equal(new URL(H.risultato(end(),'https://dovevalatuaral.com').url).origin,'https://www.dovevalatuaral.com');
});
test('destinazioni: URL codificati, t e seed sopravvivono anche al fragment',()=>{
  const dati=H.risultato(end(0)),links=H.destinazioni(dati);
  assert.deepEqual(links.map(d=>d.method),['linkedin','x','whatsapp','telegram']);
  for(const d of links){
    const u=new URL(d.url);assert.equal(u.protocol,'https:');assert.equal(u.hash,'');
    if(d.method==='whatsapp')assert.equal(u.searchParams.get('text'),dati.testo);
    else assert.equal(u.searchParams.get('url'),dati.url);
  }
});
test('disegno 4:5 con dominio, risultato e invito reali, testo lungo adattato',()=>{
  for(const score of [0,1,12,999999999999999]){
    const texts=[],c={fillRect(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},stroke(){},setLineDash(){},
      measureText(s){return{width:s.length*parseFloat(this.font.split(' ')[1])*.6};},
      fillText(s,x,y){texts.push({s,x,y,font:this.font});}};
    const canvas={getContext:()=>c},r=H.risultato(end(score));H.disegna(canvas,r);
    assert.equal(canvas.width,1080);assert.equal(canvas.height,1350);
    for(const text of [r.score,r.invito,'dovevalatuaral.com'])assert.ok(texts.some(t=>t.s===text));
    assert.ok(texts.every(t=>t.x>=0&&t.y>0&&t.y<1350));
  }
  assert.throws(()=>H.disegna({getContext:()=>null},H.risultato(end())));
});
