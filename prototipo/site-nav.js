(()=>{
  const header=document.querySelector('.site-header');
  const button=header?.querySelector('.site-menu-toggle');
  const nav=header?.querySelector('.site-nav');
  if(!header||!button||!nav)return;

  const close=()=>{
    header.removeAttribute('data-menu-open');
    button.setAttribute('aria-expanded','false');
  };
  button.addEventListener('click',()=>{
    const open=!header.hasAttribute('data-menu-open');
    header.toggleAttribute('data-menu-open',open);
    button.setAttribute('aria-expanded',String(open));
  });
  nav.addEventListener('click',event=>{if(event.target.closest('a'))close();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){close();button.focus();}});
  matchMedia('(min-width: 761px)').addEventListener('change',event=>{if(event.matches)close();});
})();
