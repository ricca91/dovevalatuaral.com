(()=>{
  const header=document.querySelector('.site-header');
  const button=header?.querySelector('.site-menu-toggle');
  const nav=header?.querySelector('.site-nav');
  if(!header||!button||!nav)return;

  const groups=[...nav.querySelectorAll('.site-nav__group')];
  const closeGroups=(except=null)=>groups.forEach(group=>{
    if(group===except)return;
    group.removeAttribute('data-open');
    group.querySelector('.site-nav__trigger')?.setAttribute('aria-expanded','false');
  });
  const close=()=>{
    header.removeAttribute('data-menu-open');
    button.setAttribute('aria-expanded','false');
    closeGroups();
  };
  button.addEventListener('click',()=>{
    const open=!header.hasAttribute('data-menu-open');
    header.toggleAttribute('data-menu-open',open);
    button.setAttribute('aria-expanded',String(open));
  });
  groups.forEach(group=>{
    const trigger=group.querySelector('.site-nav__trigger');
    const links=[...group.querySelectorAll('.site-nav__submenu a')];
    trigger?.addEventListener('click',()=>{
      const open=!group.hasAttribute('data-open');
      closeGroups(group);group.toggleAttribute('data-open',open);
      trigger.setAttribute('aria-expanded',String(open));
    });
    trigger?.addEventListener('keydown',event=>{
      if(!['ArrowDown','ArrowUp'].includes(event.key))return;
      event.preventDefault();group.setAttribute('data-open','');trigger.setAttribute('aria-expanded','true');
      links[event.key==='ArrowDown'?0:links.length-1]?.focus();
    });
    links.forEach((link,index)=>link.addEventListener('keydown',event=>{
      if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
      event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?links.length-1:
        (index+(event.key==='ArrowDown'?1:-1)+links.length)%links.length;links[next]?.focus();
    }));
  });
  nav.addEventListener('click',event=>{if(event.target.closest('a'))close();});
  document.addEventListener('click',event=>{if(!nav.contains(event.target))closeGroups();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){
    const open=nav.querySelector('.site-nav__group[data-open]');
    if(open){closeGroups();open.querySelector('.site-nav__trigger')?.focus();}
    else{close();button.focus();}
  }});
  matchMedia('(min-width: 761px)').addEventListener('change',event=>{if(event.matches)close();});
})();
