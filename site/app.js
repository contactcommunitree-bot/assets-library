// Asset Library — gallery client.
// Loads ./assets.json, renders a filterable grid, click-to-copy CDN URLs.

const state = {
  manifest: null,
  filters: { org: new Set(), campaign: new Set(), type: new Set() },
  query: '',
};

const $ = (id) => document.getElementById(id);
const grid = $('grid');
const empty = $('empty');
const meta = $('meta');
const toast = $('toast');

init();

async function init() {
  try {
    const res = await fetch('./assets.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    state.manifest = await res.json();
  } catch (err) {
    meta.textContent = `Failed to load manifest: ${err.message}`;
    return;
  }

  renderPills();
  bindEvents();
  render();
}

function renderPills() {
  const { taxonomy, assets } = state.manifest;
  const countBy = (dim, slug) => assets.filter(a => {
    if (dim === 'campaign') return a.campaigns.includes(slug);
    return a[dim] === slug;
  }).length;

  const mount = (container, items, dim) => {
    container.innerHTML = '';
    for (const item of items) {
      const n = countBy(dim, item.slug);
      const pill = document.createElement('button');
      pill.className = 'pill';
      pill.dataset.slug = item.slug;
      pill.dataset.dim = dim;
      pill.innerHTML = `${item.label}<span class="count">${n}</span>`;
      pill.addEventListener('click', () => toggleFilter(dim, item.slug, pill));
      container.appendChild(pill);
    }
  };

  mount($('org-pills'), taxonomy.organizations, 'org');
  mount($('campaign-pills'), taxonomy.campaigns, 'campaign');
  mount($('type-pills'), taxonomy.types, 'type');
}

function toggleFilter(dim, slug, pill) {
  const set = state.filters[dim];
  if (set.has(slug)) { set.delete(slug); pill.classList.remove('active'); }
  else { set.add(slug); pill.classList.add('active'); }
  render();
}

function bindEvents() {
  $('search').addEventListener('input', (e) => {
    state.query = e.target.value.trim().toLowerCase();
    render();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== $('search')) {
      e.preventDefault(); $('search').focus();
    }
    if (e.key === 'Escape') {
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) backdrop.remove();
    }
  });
}

function matches(a) {
  const f = state.filters;
  if (f.org.size && !f.org.has(a.org)) return false;
  if (f.type.size && !f.type.has(a.type)) return false;
  if (f.campaign.size && !a.campaigns.some(c => f.campaign.has(c))) return false;
  if (state.query) {
    const hay = [a.filename, a.alt, a.org, a.type, ...a.campaigns].join(' ').toLowerCase();
    if (!hay.includes(state.query)) return false;
  }
  return true;
}

function render() {
  const filtered = state.manifest.assets.filter(matches);
  meta.textContent = `${filtered.length} of ${state.manifest.count} assets · updated ${new Date(state.manifest.generatedAt).toLocaleDateString()}`;

  grid.innerHTML = '';
  if (filtered.length === 0) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  const frag = document.createDocumentFragment();
  for (const a of filtered) frag.appendChild(card(a));
  grid.appendChild(frag);
}

function card(a) {
  const el = document.createElement('div');
  el.className = 'card';
  el.addEventListener('click', () => openModal(a));

  const isImage = ['png','jpg','jpeg','gif','webp','svg','avif'].includes(a.ext);
  const thumb = document.createElement('div');
  thumb.className = 'thumb' + (isImage ? '' : ' doc');
  if (isImage) {
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.src = a.url;
    img.alt = a.alt;
    thumb.appendChild(img);
  } else {
    thumb.textContent = '📄';
  }
  el.appendChild(thumb);

  const body = document.createElement('div');
  body.className = 'card-body';
  body.innerHTML = `
    <div class="card-title">${escapeHtml(a.slug)}.${a.ext}</div>
    <div class="card-tags">${escapeHtml(a.org)} · ${escapeHtml(a.type)}</div>
  `;
  el.appendChild(body);
  return el;
}

function openModal(a) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) backdrop.remove(); });

  const isImage = ['png','jpg','jpeg','gif','webp','svg','avif'].includes(a.ext);
  const imgTag = `<img src="${a.url}" alt="${escapeHtml(a.alt)}" style="max-width:100%; height:auto;">`;

  backdrop.innerHTML = `
    <div class="modal" role="dialog">
      <h2>${escapeHtml(a.slug)}.${a.ext}</h2>
      <div class="preview">
        ${isImage ? `<img src="${a.url}" alt="${escapeHtml(a.alt)}">` : '<span style="font-size:48px">📄</span>'}
      </div>
      <div class="url" id="modal-url">${a.url}</div>
      <div class="row">
        <button data-action="copy-url">Copy URL</button>
        ${isImage ? '<button data-action="copy-img" class="secondary">Copy &lt;img&gt; tag</button>' : ''}
        <button data-action="open" class="secondary">Open in new tab</button>
      </div>
      <div class="meta-grid">
        <b>Organization</b><span>${escapeHtml(a.org)}</span>
        <b>Type</b><span>${escapeHtml(a.type)}</span>
        <b>Campaigns</b><span>${a.campaigns.map(escapeHtml).join(', ')}</span>
        <b>Path</b><span>${escapeHtml(a.path)}</span>
        <b>Size</b><span>${formatBytes(a.bytes)}</span>
        <b>Updated</b><span>${new Date(a.mtime).toLocaleString()}</span>
      </div>
    </div>`;
  document.body.appendChild(backdrop);

  backdrop.querySelector('[data-action="copy-url"]').addEventListener('click', () => copy(a.url, 'URL copied'));
  backdrop.querySelector('[data-action="open"]').addEventListener('click', () => window.open(a.url, '_blank'));
  const imgBtn = backdrop.querySelector('[data-action="copy-img"]');
  if (imgBtn) imgBtn.addEventListener('click', () => copy(imgTag, '<img> tag copied'));
}

async function copy(text, label) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(label);
  } catch {
    showToast('Copy failed — clipboard blocked');
  }
}

let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 1800);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n/1024).toFixed(1)} KB`;
  return `${(n/1024/1024).toFixed(2)} MB`;
}
