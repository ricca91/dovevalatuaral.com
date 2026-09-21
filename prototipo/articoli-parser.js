// Contratto deliberatamente limitato: scalari YAML, array inline e Markdown editoriale.
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function url(value){
  if(typeof value!=='string'||/[\s<>"\\\x00-\x1f]/.test(value)||!(/^(https?:\/\/|\/(?!\/)|#)/.test(value)))throw Error(`URL non consentito: ${value}`);
  return value;
}
function scalar(raw){
  const match=raw.match(/^("(?:[^"\\]|\\.)*"|'(?:[^']|'')*'|\[[^\n]*\]|[^#]*?)(?:\s+#.*)?$/);
  if(!match)throw Error('valore YAML non supportato');
  const value=match[1].trim();
  if(value.startsWith('"')||value.startsWith('['))return JSON.parse(value);
  if(value.startsWith("'"))return value.slice(1,-1).replaceAll("''","'");
  if(!value||/^[&*!>|{}]/.test(value)||/:\s/.test(value))throw Error('usare uno scalare quotato o un array JSON inline');
  return value;
}
function date(value,key){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value)throw Error(`${key}: data non valida (AAAA-MM-GG)`);
}
function parse(source,file='articolo.md'){
  try{
    const match=source.replaceAll('\r\n','\n').match(/^---\n([\s\S]*?)\n---\n([\s\S]+)$/);
    if(!match)throw Error('frontmatter YAML assente o corpo vuoto');
    const meta=Object.create(null);
    for(const [i,line] of match[1].split('\n').entries()){
      if(!line.trim()||line.trim().startsWith('#'))continue;
      const entry=line.match(/^([a-z_]+):\s*(.*)$/);
      if(!entry)throw Error(`frontmatter riga ${i+2}: atteso campo: valore`);
      if(Object.hasOwn(meta,entry[1]))throw Error(`campo duplicato: ${entry[1]}`);
      meta[entry[1]]=scalar(entry[2]);
    }
    const required=['slug','titolo','title_seo','description','query_principale','cluster','data_pubblicazione','cta','link_interni','ipotesi_calcolo','fonti_verificate','stato'];
    for(const key of required)if(!Object.hasOwn(meta,key))throw Error(`campo obbligatorio mancante: ${key}`);
    for(const key of Object.keys(meta)){
      if(![...required,'data_aggiornamento'].includes(key))throw Error(`campo sconosciuto: ${key}`);
      if(key!=='link_interni'&&(typeof meta[key]!=='string'||!meta[key].trim()))throw Error(`${key}: attesa stringa non vuota`);
    }
    for(const key of ['slug','cluster'])if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(meta[key]))throw Error(`${key}: usare lettere minuscole, numeri e trattini`);
    if(!['bozza','rivisto','pubblicato'].includes(meta.stato))throw Error('stato: bozza | rivisto | pubblicato');
    meta.data_aggiornamento??=meta.data_pubblicazione;
    for(const key of ['data_pubblicazione','data_aggiornamento','fonti_verificate'])date(meta[key],key);
    if(meta.data_aggiornamento<meta.data_pubblicazione)throw Error('data_aggiornamento precedente alla pubblicazione');
    if(!Array.isArray(meta.link_interni)||meta.link_interni.some(v=>typeof v!=='string'))throw Error('link_interni: atteso array di stringhe');
    for(const value of [meta.cta,...meta.link_interni])if(!url(value).startsWith('/'))throw Error(`link interno atteso: ${value}`);
    return {...meta,body:match[2].trim(),file};
  }catch(error){throw Error(`${file}: ${error.message}`);}
}
function inline(text){
  let result='';
  while(text){
    let m;
    if((m=text.match(/^`([^`\n]+)`/)))result+=`<code>${escape(m[1])}</code>`;
    else if((m=text.match(/^\[([^\]\n]+)\]\(((?:[^\s()]|\([^\s()]*\))+)\)/)))result+=`<a href="${escape(url(m[2]))}">${inline(m[1])}</a>`;
    else if((m=text.match(/^\*\*(.+?)\*\*/)))result+=`<strong>${inline(m[1])}</strong>`;
    else if((m=text.match(/^\*([^*]+)\*/)))result+=`<em>${inline(m[1])}</em>`;
    else {result+=escape(text[0]);text=text.slice(1);continue;}
    text=text.slice(m[0].length);
  }
  return result;
}
function markdown(source){
  const lines=source.split('\n'),out=[];
  for(const [i,line] of lines.entries())if(/!\[|```|^#{1}\s|^#{4,}\s|^\s{2,}\S|^\[[^\]]+\]:/.test(line))throw Error(`Markdown non supportato alla riga ${i+1}`);
  const cells=line=>line.trim().replace(/^\|/,'').replace(/\|$/,'').split('|').map(v=>v.trim());
  for(let i=0;i<lines.length;){
    const line=lines[i];
    if(!line.trim()){i++;continue;}
    if(/^\s*</.test(line)||/!\[|```|^#{1}\s|^#{4,}\s/.test(line))throw Error(`Markdown non supportato alla riga ${i+1}`);
    const h=line.match(/^(#{2,3}) (.+)$/);
    if(h){out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`);i++;continue;}
    if(i+1<lines.length&&line.includes('|')&&/^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(lines[i+1].trim())){
      const headers=cells(line),rows=[];i+=2;
      while(i<lines.length&&lines[i].includes('|')&&lines[i].trim()){
        const row=cells(lines[i++]);if(row.length!==headers.length)throw Error('tabella: numero di celle diverso dalle intestazioni');rows.push(row);
      }
      out.push(`<div class="article-table" role="region" aria-label="Tabella" tabindex="0"><table><thead><tr>${headers.map(c=>`<th scope="col">${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(c=>`<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);continue;
    }
    if(/^> ?/.test(line)){
      const quote=[];while(i<lines.length&&/^> ?/.test(lines[i]))quote.push(lines[i++].replace(/^> ?/,''));
      out.push(`<blockquote>${markdown(quote.join('\n'))}</blockquote>`);continue;
    }
    if(/^(?:[-*] |\d+\. )/.test(line)){
      const ordered=/^\d/.test(line),items=[],pattern=ordered?/^\d+\. /:/^[-*] /;
      while(i<lines.length&&pattern.test(lines[i]))items.push(`<li>${inline(lines[i++].replace(pattern,''))}</li>`);
      out.push(`<${ordered?'ol':'ul'}>${items.join('')}</${ordered?'ol':'ul'}>`);continue;
    }
    if(line==='---'){out.push('<hr>');i++;continue;}
    if(/^\s{2,}\S/.test(line))throw Error(`Markdown riga ${i+1}: annidamento non supportato`);
    const paragraph=[line];i++;
    while(i<lines.length&&lines[i].trim()&&!/^(?:#|>|[-*] |\d+\. |\|)/.test(lines[i]))paragraph.push(lines[i++]);
    out.push(`<p>${inline(paragraph.join(' '))}</p>`);
  }
  return out.join('\n');
}
module.exports={parse,markdown,escape,url};
