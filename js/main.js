/* ============================================================
   Android Compose Interview Guide — Shared JS
   ============================================================ */

/* ---------- Nav definition ---------- */
const NAV_PAGES = [
  { id: 'ui',          label: 'UI',            href: 'ui.html' },
  { id: 'theming',     label: 'Theming',        href: 'theming.html' },
  { id: 'coroutines',  label: 'Coroutines',     href: 'coroutines.html' },
  { id: 'flow',        label: 'Flow',           href: 'flow.html' },
  { id: 'viewmodels',  label: 'ViewModels',     href: 'viewmodels.html' },
  { id: 'di',          label: 'DI / No DI',     href: 'di.html' },
  { id: 'permissions', label: 'Permissions',    href: 'permissions.html' },
  { id: 'manifests',   label: 'Manifests',      href: 'manifests.html' },
  { id: 'services',    label: 'Services',       href: 'services.html' },
  { id: 'storage',     label: 'Storage',        href: 'storage.html' },
  { id: 'gradle',      label: 'Gradle DSL',     href: 'gradle.html' },
  { id: 'patterns',    label: 'Design Patterns', href: 'patterns.html' },
];

/* ---------- Build top nav ---------- */
function buildNav() {
  const container = document.getElementById('nav-container');
  if (!container) return;

  const currentPage = document.body.dataset.page || '';

  // Resolve relative href based on current location
  const isRoot = !window.location.pathname.includes('/pages/');
  const prefix = isRoot ? 'pages/' : '';

  const tabsHTML = NAV_PAGES.map(p => `
    <a class="nav-tab${p.id === currentPage ? ' active' : ''}"
       href="${prefix}${p.href}">${p.label}</a>
  `).join('');

  container.innerHTML = `
    <nav class="top-nav">
      <a class="nav-brand" href="${isRoot ? 'index.html' : '../index.html'}">
        <span class="brand-icon">A</span>
        <span>Compose Guide</span>
      </a>
      <div class="nav-tabs">${tabsHTML}</div>
      <div class="nav-controls">
        <div class="search-wrap">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input class="search-input" id="searchInput" type="search" placeholder="Search…" autocomplete="off">
        </div>
        <button class="theme-btn" id="themeBtn" title="Toggle theme">🌙</button>
      </div>
    </nav>
    <div class="search-dropdown" id="searchDropdown"></div>
  `;

  initTheme();
  initSearch();
}

/* ---------- Theme ---------- */
function initTheme() {
  const saved = localStorage.getItem('guide-theme') || 'light';
  applyTheme(saved);

  document.getElementById('themeBtn')?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('guide-theme', next);
  });
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const btn = document.getElementById('themeBtn');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

/* ---------- Search ---------- */
function initSearch() {
  const input = document.getElementById('searchInput');
  const dropdown = document.getElementById('searchDropdown');
  if (!input || !dropdown) return;

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (q.length < 2) { dropdown.classList.remove('open'); return; }

    // Gather subsections on current page
    const results = [];
    document.querySelectorAll('.subsection').forEach(section => {
      const h2 = section.querySelector('h2, h3');
      const desc = section.querySelector('.sub-desc');
      const code = section.querySelector('code');
      const title = h2?.textContent || '';
      const snippet = desc?.textContent || code?.textContent || '';
      if (title.toLowerCase().includes(q) || snippet.toLowerCase().includes(q)) {
        results.push({ id: section.id, title, snippet: snippet.slice(0, 90) });
      }
    });

    if (!results.length) {
      dropdown.innerHTML = `<div class="search-empty">No results for "<strong>${esc(q)}</strong>"</div>`;
    } else {
      dropdown.innerHTML = results.map(r => `
        <div class="search-result" onclick="scrollToSection('${r.id}')">
          <div class="sr-title">${highlight(r.title, q)}</div>
          <div class="sr-snippet">${highlight(r.snippet, q)}</div>
        </div>
      `).join('');
    }
    dropdown.classList.add('open');
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.search-wrap') && !e.target.closest('.search-dropdown')) {
      dropdown.classList.remove('open');
    }
  });
}

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  document.getElementById('searchDropdown')?.classList.remove('open');
  document.getElementById('searchInput').value = '';
}

function highlight(text, query) {
  const re = new RegExp(`(${esc(query)})`, 'gi');
  return esc(text).replace(re, '<mark>$1</mark>');
}

function esc(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ---------- Sidebar scroll spy ---------- */
function initScrollSpy() {
  const links = document.querySelectorAll('.sidebar a[href^="#"]');
  if (!links.length) return;

  const sections = [...links].map(a => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(a => a.classList.remove('active'));
        const link = document.querySelector(`.sidebar a[href="#${entry.target.id}"]`);
        if (link) link.classList.add('active');
      }
    });
  }, { rootMargin: `-${64 + 20}px 0px -60% 0px` });

  sections.forEach(s => observer.observe(s));
}

/* ---------- Code expand / collapse ---------- */
function toggleExpand(btn) {
  const card = btn.closest('.code-card');
  const expanded = card.querySelector('.code-expanded');
  if (!expanded) return;
  const open = expanded.classList.toggle('open');
  btn.textContent = open ? 'Show less' : 'Show more';
}

/* ---------- Copy to clipboard ---------- */
function copyCode(btn) {
  const card = btn.closest('.code-card');
  // prefer expanded code if open, else quick snippet
  const expanded = card.querySelector('.code-expanded.open code');
  const quick = card.querySelector('pre:not(.code-expanded *) code');
  const text = (expanded || quick)?.textContent || '';
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
  });
}

/* ---------- Inject code data into DOM ---------- */
function initCode(codeMap) {
  Object.entries(codeMap).forEach(([id, code]) => {
    const el = document.getElementById('code-' + id);
    if (el) el.textContent = code;
  });
  if (window.Prism) Prism.highlightAll();
}

/* ---------- Boot ---------- */
function boot() {
  buildNav();
  initScrollSpy();
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
