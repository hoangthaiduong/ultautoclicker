(() => {
  const page = document.body.dataset.page || 'home';
  const header = document.querySelector('[data-site-header]');
  const footer = document.querySelector('[data-site-footer]');
  const icon = (name) => {
    const paths = {
      sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>',
      moon:'<path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/>',
      menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
      download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
      arrow:'<path d="M5 12h14m-7-7 7 7-7 7"/>'
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || ''}</svg>`;
  };
  const nav = [
    ['home','Home','index.html'],['features','Features','features.html'],['tutorial','Tutorial','tutorial.html'],['download','Download','download.html'],['faq','FAQ','faq.html']
  ];
  if (header) header.innerHTML = `<div class="container nav"><a class="logo" href="index.html"><img src="assets/logo.svg" alt="Ultimate Autoclicker logo"><span><strong>Ultimate Autoclicker</strong><small>Take control of every click</small></span></a><nav class="nav-links" id="site-nav" aria-label="Main navigation">${nav.map(([key,label,url])=>`<a class="${page===key?'active':''}" href="${url}">${label}</a>`).join('')}</nav><div class="nav-actions"><button class="theme-toggle" id="theme-toggle" title="Toggle theme" aria-label="Toggle light or dark theme">${icon('moon')}</button><a class="btn btn-primary btn-small" href="download.html">Get extension ${icon('arrow')}</a><button class="menu-toggle" id="menu-toggle" aria-label="Open navigation" aria-expanded="false">${icon('menu')}</button></div></div>`;
  if (footer) footer.innerHTML = `<div class="container"><div class="footer-grid"><div class="footer-about"><a class="logo" href="index.html"><img src="assets/logo.svg" alt=""><span><strong>Ultimate Autoclicker</strong><small>Take control of every click</small></span></a><p>A lightweight, local-first browser workflow assistant designed around clear controls, predictable behavior and user choice.</p></div><div class="footer-col"><h4>Product</h4><a href="features.html">Features</a><a href="download.html">Download</a><a href="tutorial.html">Tutorial</a></div><div class="footer-col"><h4>Resources</h4><a href="faq.html">FAQ</a><a href="tutorial.html#troubleshooting">Troubleshooting</a><a href="about.html">About</a></div><div class="footer-col"><h4>Information</h4><a href="about.html#privacy">Privacy</a><a href="about.html#limitations">Technical limits</a><a href="about.html#contact">Contact</a></div></div><div class="copyright"><span>© 2026 Ultimate Autoclicker. All rights reserved.</span><span>Built for clarity, control and local-first use.</span></div></div>`;
  let theme = 'light';
  try { theme = localStorage.getItem('uac-site-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); } catch (_) {}
  function applyTheme() { document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : 'light'; const button = document.getElementById('theme-toggle'); if (button) button.innerHTML = icon(theme === 'dark' ? 'sun' : 'moon'); }
  applyTheme();
  document.getElementById('theme-toggle')?.addEventListener('click', () => { theme = theme === 'dark' ? 'light' : 'dark'; try { localStorage.setItem('uac-site-theme', theme); } catch (_) {} applyTheme(); });
  const menu = document.getElementById('menu-toggle');
  menu?.addEventListener('click', () => { const navEl = document.getElementById('site-nav'); const open = navEl.classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); });
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = String(new Date().getFullYear()));
  const sizeTarget = document.querySelector('[data-download-size]');
  if (sizeTarget) fetch('downloads/ultimate-autoclicker-extension.zip').then(r => r.blob()).then(blob => { sizeTarget.textContent = `${(blob.size / 1024).toFixed(1)} KB`; }).catch(() => { sizeTarget.textContent = 'ZIP package'; });
})();
