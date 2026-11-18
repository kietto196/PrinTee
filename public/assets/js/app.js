/* ==========================================================
   PrinTee — ứng dụng 1 trang, không cần thư viện.
   Dữ liệu: manifest.json (sinh từ public/data/*.json + public/media/)
   Đường dẫn:  #/            trang chủ
               #/all         tất cả mẫu
               #/c/<danh-muc>
               #/p/<danh-muc>/<id-san-pham>
               #/search/<từ khoá>
   ========================================================== */
(() => {
  'use strict';

  /* ---------- tiện ích ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const enc = encodeURIComponent;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* bỏ qua */ } },
  };
  const DAY = 864e5;
  const isMobile = () => window.matchMedia('(max-width: 900px)').matches;

  const svg = (d) => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const I = {
    home: svg('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h5v-6h4v6h5V9.5"/>'),
    grid: svg('<rect x="3" y="3" width="7" height="7" rx="1.6"/><rect x="14" y="3" width="7" height="7" rx="1.6"/><rect x="3" y="14" width="7" height="7" rx="1.6"/><rect x="14" y="14" width="7" height="7" rx="1.6"/>'),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    sidebar: svg('<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16"/>'),
    menu: svg('<path d="M4 6h16M4 12h16M4 18h16"/>'),
    left: svg('<path d="m15 18-6-6 6-6"/>'),
    right: svg('<path d="m9 18 6-6-6-6"/>'),
    up: svg('<path d="m6 15 6-6 6 6"/>'),
    close: svg('<path d="M18 6 6 18M6 6l12 12"/>'),
    play: svg('<path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/>'),
    clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    layers: svg('<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>'),
    image: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>'),
    video: svg('<rect x="3" y="5" width="13" height="14" rx="2"/><path d="m16 10 5-3v10l-5-3z"/>'),
    share: svg('<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>'),
    external: svg('<path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>'),
    chat: svg('<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8M8 13h5"/>'),
    expand: svg('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
    globe: svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
    mail: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
    phone: svg('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1"/>'),
    bag: svg('<path d="M5 8h14l-1 12H6z"/><path d="M9 8a3 3 0 0 1 6 0"/>'),
    facebook: svg('<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8a0 0 0 0 1 0 0z"/>'),
    instagram: svg('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor"/>'),
    tiktok: svg('<path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3c.5 3 2.5 5 5 5"/>'),
  };
  const LINK_ICON = { facebook: I.facebook, instagram: I.instagram, tiktok: I.tiktok, youtube: I.video, zalo: I.chat, messenger: I.chat, shopee: I.bag, shop: I.bag, email: I.mail, mail: I.mail, phone: I.phone, website: I.globe };

  const LOGO = `<svg viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="ptg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF9A3D"/><stop offset="1" stop-color="#FF4F2E"/></linearGradient></defs><rect width="48" height="48" rx="13" fill="url(#ptg)"/><rect x="13" y="10" width="6.5" height="28" rx="2.2" fill="#fff"/><rect x="13" y="10" width="17" height="5" rx="2.5" fill="#fff"/><rect x="13" y="16.5" width="21" height="5" rx="2.5" fill="#fff"/><rect x="13" y="23" width="17" height="5" rx="2.5" fill="#fff"/><circle cx="32.5" cy="34" r="3.2" fill="#fff" opacity=".92"/></svg>`;

  /* ---------- trạng thái ---------- */
  const S = {
    site: {},
    categories: [],
    products: [],
    sort: store.get('pt-sort') || 'new',
    gallery: null,
  };
  const view = $('#view');

  const productUrl = (p) => `#/p/${enc(p.category)}/${enc(p.id)}`;
  const catUrl = (key) => `#/c/${enc(key)}`;
  const safeUrl = (u) => (/^\s*javascript:/i.test(String(u || '')) ? '#' : String(u || '#'));
  const isExternal = (u) => /^(https?:)?\/\//i.test(u) || /^(mailto|tel):/i.test(u);

  function relTime(t) {
    if (!t) return '';
    const d = Math.floor((Date.now() - t) / DAY);
    if (d <= 0) return 'Hôm nay';
    if (d === 1) return 'Hôm qua';
    if (d < 7) return `${d} ngày trước`;
    if (d < 30) return `${Math.floor(d / 7)} tuần trước`;
    if (d < 365) return `${Math.floor(d / 30)} tháng trước`;
    return `${Math.floor(d / 365)} năm trước`;
  }
  const fmtDate = (t) => (t ? new Date(t).toLocaleDateString('vi-VN') : '');

  function avatar() {
    const a = S.site.avatar;
    return `<span class="avatar">${a ? `<img src="${esc(a)}" alt="">` : LOGO}</span>`;
  }
  function brandHtml() {
    const name = String(S.site.name || 'PrinTee');
    const m = /^(.*?)([A-Z][a-z]*)$/.exec(name);
    const word = m && m[1] ? `${esc(m[1])}<span class="w2">${esc(m[2])}</span>` : esc(name);
    return `${S.site.logo ? `<img src="${esc(S.site.logo)}" alt="" style="width:36px;height:36px;border-radius:10px">` : LOGO}<span class="wm">${word}</span>`;
  }

  /* ---------- nạp dữ liệu ---------- */
  async function boot() {
    setupStatic();
    try {
      const res = await fetch('manifest.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Không tải được manifest.json (HTTP ${res.status}).`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      ingest(data);
    } catch (err) {
      showFatal(err);
      return;
    }
    renderChrome();
    window.addEventListener('hashchange', route);
    route();
  }

  function ingest(data) {
    S.site = Object.assign({ name: 'PrinTee' }, data.site || {});
    S.categories = [];
    S.products = [];
    for (const c of data.categories || []) {
      const cat = { ...c, products: [] };
      for (const raw of c.products || []) {
        const media = (raw.media || []).filter((m) => m && m.src);
        const t = Date.parse(raw.date) || 0;
        const p = {
          ...raw,
          media,
          category: c.key,
          categoryName: c.name,
          categoryIcon: c.icon || '',
          author: raw.author || S.site.author || S.site.name,
          time: t,
          hasVideo: media.some((m) => m.type === 'video'),
          profiles: Array.isArray(raw.profiles) ? raw.profiles : [],
        };
        p.search = norm([p.title, p.tags.join(' '), c.name, p.description, p.author, p.id].join(' '));
        p.titleN = norm(p.title);
        p.tagsN = p.tags.map(norm);
        cat.products.push(p);
        S.products.push(p);
      }
      cat.cover = c.cover || (cat.products.find((p) => p.cover) || {}).cover || null;
      S.categories.push(cat);
    }
  }

  function showFatal(err) {
    const local = location.protocol === 'file:';
    view.innerHTML = `<div class="fatal empty">${I.layers}<h3>Chưa tải được dữ liệu</h3>
      <p>${local
        ? 'Bạn đang mở trực tiếp file index.html nên trình duyệt chặn đọc dữ liệu. Mở Terminal tại thư mục dự án và chạy <code>npm run dev</code>, rồi vào <code>http://localhost:3000</code>.'
        : 'Kiểm tra lại các file JSON trong <code>public/data</code>. Chi tiết lỗi:'}</p>
      <pre>${esc(err && err.message ? err.message : err)}</pre></div>`;
  }

  /* ---------- khung: sidebar, topbar, footer ---------- */
  function setupStatic() {
    $('#menuBtn').innerHTML = I.menu;
    $('#searchIco').innerHTML = I.search;
    if (isMobile()) $('#q').placeholder = 'Tìm mẫu in…';
    $('#toTop').innerHTML = `${I.up}<span>TOP</span>`;
    $('#toTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    window.addEventListener('scroll', () => $('#toTop').classList.toggle('show', window.scrollY > 700), { passive: true });
    $('#menuBtn').addEventListener('click', () => $('#app').classList.add('drawer-open'));
    $('#scrim').addEventListener('click', closeDrawer);
    if (store.get('pt-collapsed') === '1') $('#app').classList.add('collapsed');
    view.addEventListener('click', (e) => {
      const b = e.target.closest('[data-back]');
      if (b) { e.preventDefault(); goBack(); }
      const sh = e.target.closest('[data-share]');
      if (sh) { e.preventDefault(); share(); }
    });
    document.addEventListener('keydown', onKey);
    setupSearch();
  }

  function renderChrome() {
    const s = S.site;
    document.title = `${s.name} · ${s.tagline || 'Mẫu in 3D'}`;
    $('#mobileBrand').innerHTML = brandHtml();

    const cats = S.categories.map((c) => `
      <a class="sb-link" data-r="c:${esc(c.key)}" href="${catUrl(c.key)}" title="${esc(c.name)}">
        <span class="sb-emoji">${c.icon ? esc(c.icon) : I.layers}</span>
        <span class="sb-label">${esc(c.name)}</span><em class="sb-count">${c.products.length}</em>
      </a>`).join('');
    const links = (s.links || []).filter((l) => l && l.url).map((l) => `
      <a class="sb-link" href="${esc(safeUrl(l.url))}" target="_blank" rel="noopener" title="${esc(l.label || l.type)}">
        ${LINK_ICON[String(l.type || '').toLowerCase()] || I.globe}<span class="sb-label">${esc(l.label || l.type || l.url)}</span>
      </a>`).join('');

    $('#sidebar').innerHTML = `
      <div class="sb-head">
        <a class="brand" href="#/">${brandHtml()}</a>
        <button class="sb-toggle" id="sbToggle" aria-label="Thu gọn menu" title="Thu gọn / mở rộng">${I.sidebar}</button>
      </div>
      <nav class="sb-nav">
        <a class="sb-link" data-r="home" href="#/" title="Trang chủ">${I.home}<span class="sb-label">Trang chủ</span></a>
        <a class="sb-link" data-r="all" href="#/all" title="Tất cả mẫu">${I.grid}<span class="sb-label">Tất cả mẫu</span><em class="sb-count">${S.products.length}</em></a>
        <div class="sb-section">Danh mục</div><div class="sb-cat-gap"></div>
        ${cats || '<div class="sb-section" style="text-transform:none;font-weight:400">Chưa có danh mục</div>'}
        ${links ? `<div class="sb-section">Kết nối</div><div class="sb-cat-gap"></div>${links}` : ''}
      </nav>
      <div class="sb-foot">© ${new Date().getFullYear()} ${esc(s.name)}</div>`;

    $('#sbToggle').addEventListener('click', () => {
      if (isMobile()) return closeDrawer();
      const c = $('#app').classList.toggle('collapsed');
      store.set('pt-collapsed', c ? '1' : '0');
    });

    const contact = s.contact && s.contact.url ? s.contact : null;
    $('#topActions').innerHTML = contact
      ? `<a class="btn outline" href="${esc(safeUrl(contact.url))}" target="_blank" rel="noopener" title="${esc(contact.label || 'Liên hệ')}">${I.chat}<span>${esc(contact.label || 'Liên hệ')}</span></a>`
      : '';

    $('#footer').innerHTML = `<span>© ${new Date().getFullYear()} ${esc(s.name)}${s.tagline ? ' · ' + esc(s.tagline) : ''}</span>
      <span>${(s.links || []).filter((l) => l && l.url).map((l) => `<a href="${esc(safeUrl(l.url))}" target="_blank" rel="noopener">${esc(l.label || l.type)}</a>`).join(' · ')}</span>`;
  }

  function closeDrawer() { $('#app').classList.remove('drawer-open'); }
  function setActive(r) { $$('.sb-link[data-r]').forEach((a) => a.classList.toggle('on', a.dataset.r === r)); }
  let navCount = 0;
  function goBack() {
    if (navCount > 1) history.back();
    else location.hash = '#/';
  }

  /* ---------- router ---------- */
  function route() {
    const raw = location.hash.replace(/^#\/?/, '');
    const seg = raw.split('/').filter(Boolean).map((s) => { try { return decodeURIComponent(s); } catch { return s; } });
    navCount += 1;
    S.gallery = null;
    closeLightbox();
    closeDrawer();
    hideSuggest();
    if (seg[0] !== 'search') $('#q').value = '';

    let active = '';
    if (!seg.length) { renderHome(); active = 'home'; }
    else if (seg[0] === 'all') { renderListing('all'); active = 'all'; }
    else if (seg[0] === 'c' && seg[1]) { renderListing(seg[1]); active = 'c:' + seg[1]; }
    else if (seg[0] === 'p' && seg[2]) { renderProduct(seg[1], seg.slice(2).join('/')); active = 'c:' + seg[1]; }
    else if (seg[0] === 'search') renderSearch(seg.slice(1).join('/'));
    else render404();
    setActive(active);
    window.scrollTo(0, 0);
  }

  /* ---------- thẻ sản phẩm ---------- */
  function card(p) {
    const isNew = p.time && Date.now() - p.time < 14 * DAY;
    const badge = p.featured ? '<span class="badge hot">Nổi bật</span>' : isNew ? '<span class="badge">Mới</span>' : '';
    const prof = p.profiles[0];
    const img = p.cover
      ? `<img src="${esc(p.cover)}" alt="${esc(p.title)}" loading="lazy" decoding="async">`
      : `<div class="noimg">${I.image}</div>`;
    const stats = [
      p.price ? `<span class="price">${esc(p.price)}</span>` : prof && prof.time ? `<span title="Thời gian in">${I.clock}${esc(prof.time)}</span>` : '',
      `<span title="Số ảnh & video">${I.image}${p.media.length}</span>`,
    ].join('');
    return `<a class="card" href="${productUrl(p)}">
      <div class="card-media">${img}${badge}
        <span class="card-cat">${esc(p.categoryIcon)} ${esc(p.categoryName)}</span>
        ${p.hasVideo ? `<span class="card-vid" title="Có video">${I.play}</span>` : ''}
      </div>
      <h3 class="card-title">${esc(p.title)}</h3>
      <div class="card-meta">
        <div class="card-author">${avatar()}<div><b>${esc(p.author)}</b><small>${relTime(p.time)}</small></div></div>
        <div class="card-stats">${stats}</div>
      </div>
    </a>`;
  }

  function catTabs(active) {
    const tabs = S.categories.map((c) => `
      <a class="cat-tab ${active === c.key ? 'on' : ''}" href="${catUrl(c.key)}">
        <span class="cat-av">${c.cover ? `<img src="${esc(c.cover)}" alt="" loading="lazy">` : `<span>${esc(c.icon || c.name.charAt(0))}</span>`}
          ${c.icon && c.cover ? `<i class="cat-emoji">${esc(c.icon)}</i>` : ''}</span>
        <span class="cat-name">${esc(c.name)}</span>
      </a>`).join('');
    return `<div class="cat-tabs">
      <a class="cat-tab ${active === 'all' ? 'on' : ''}" href="#/all"><span class="cat-av"><span>${I.grid}</span></span><span class="cat-name">Tất cả</span></a>
      ${tabs}</div>`;
  }

  function sortList(list, mode) {
    const a = list.slice();
    if (mode === 'name') a.sort((x, y) => x.title.localeCompare(y.title, 'vi'));
    else if (mode === 'old') a.sort((x, y) => x.time - y.time);
    else if (mode === 'featured') a.sort((x, y) => (y.featured ? 1 : 0) - (x.featured ? 1 : 0) || y.time - x.time);
    else a.sort((x, y) => y.time - x.time);
    return a;
  }

  function emptyData() {
    return `<div class="empty">${I.layers}<h3>Chưa có sản phẩm nào</h3>
      <p>Tạo file JSON trong <code>public/data/</code> (mỗi file là 1 danh mục) và thêm ảnh vào <code>public/media/&lt;danh-muc&gt;/&lt;id&gt;/</code>.</p></div>`;
  }

  /* ---------- trang chủ ---------- */
  function renderHome() {
    const s = S.site;
    document.title = `${s.name} · ${s.tagline || 'Mẫu in 3D'}`;
    if (!S.products.length) { view.innerHTML = emptyData(); return; }
    const featured = sortList(S.products.filter((p) => p.featured), 'new');
    const newest = sortList(S.products, 'new');
    const videos = S.products.filter((p) => p.hasVideo).length;
    const contact = s.contact && s.contact.url ? s.contact : null;
    view.innerHTML = `
      <section class="hero">
        <div class="hero-text">
          <span class="eyebrow">${I.layers}${esc(s.heroEyebrow || 'Mẫu in 3D')}</span>
          <h1>${esc(s.tagline || 'Bộ sưu tập mẫu in 3D')}</h1>
          ${s.description ? `<p>${esc(s.description)}</p>` : ''}
          <div class="hero-actions">
            <a class="btn primary" href="#/all">${I.grid}Xem tất cả mẫu</a>
            ${contact ? `<a class="btn ghost" href="${esc(safeUrl(contact.url))}" target="_blank" rel="noopener">${I.chat}${esc(contact.label || 'Liên hệ')}</a>` : ''}
          </div>
        </div>
        <div class="hero-stats">
          <div><b>${S.products.length}</b><span>mẫu in</span></div>
          <div><b>${S.categories.length}</b><span>danh mục</span></div>
          <div><b>${videos}</b><span>có video</span></div>
        </div>
      </section>
      ${catTabs(null)}
      ${featured.length ? `<div class="sec-head"><h2 class="sec-title">Nổi bật</h2></div><div class="grid">${featured.slice(0, 8).map(card).join('')}</div>` : ''}
      <div class="sec-head"><h2 class="sec-title">Mới cập nhật</h2><a class="link-more" href="#/all">Xem tất cả ${I.right}</a></div>
      <div class="grid">${newest.slice(0, 12).map(card).join('')}</div>`;
  }

  /* ---------- trang danh mục / tất cả ---------- */
  function renderListing(key) {
    const cat = key === 'all' ? null : S.categories.find((c) => c.key === key);
    if (key !== 'all' && !cat) return render404();
    const list = cat ? cat.products : S.products;
    document.title = `${cat ? cat.name : 'Tất cả mẫu'} · ${S.site.name}`;
    const opts = [['new', 'Mới nhất'], ['old', 'Cũ nhất'], ['name', 'Tên A → Z'], ['featured', 'Nổi bật trước']];
    view.innerHTML = `
      <div class="page-head">
        <button class="back-btn" data-back aria-label="Quay lại">${I.left}</button>
        <div><h1>${cat ? `${cat.icon ? esc(cat.icon) + ' ' : ''}${esc(cat.name)}` : 'Tất cả mẫu'}</h1>
          ${cat && cat.description ? `<p class="muted">${esc(cat.description)}</p>` : ''}</div>
        <div class="head-tools"><span class="count">${list.length} mẫu</span>
          <select class="sort" id="sort" aria-label="Sắp xếp">${opts.map(([v, l]) => `<option value="${v}" ${S.sort === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
        </div>
      </div>
      ${catTabs(key)}
      <div class="grid" id="grid"></div>`;
    const fill = () => {
      $('#grid').innerHTML = list.length ? sortList(list, S.sort).map(card).join('') : '';
      if (!list.length) $('#grid').outerHTML = emptyData();
    };
    fill();
    const sel = $('#sort');
    if (sel) sel.addEventListener('change', () => { S.sort = sel.value; store.set('pt-sort', S.sort); fill(); });
  }

  /* ---------- tìm kiếm ---------- */
  function search(q) {
    const nq = norm(q).trim();
    const tokens = nq.split(/\s+/).filter(Boolean);
    if (!tokens.length) return [];
    return S.products
      .map((p) => {
        if (!tokens.every((t) => p.search.includes(t))) return null;
        let score = 0;
        if (p.titleN.includes(nq)) score += 10;
        if (p.titleN.startsWith(tokens[0])) score += 3;
        tokens.forEach((t) => {
          if (p.titleN.includes(t)) score += 5;
          if (p.tagsN.some((g) => g.includes(t))) score += 3;
          if (norm(p.categoryName).includes(t)) score += 2;
        });
        return { p, score };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score || b.p.time - a.p.time)
      .map((x) => x.p);
  }

  function renderSearch(q) {
    $('#q').value = q;
    document.title = `Tìm “${q}” · ${S.site.name}`;
    const res = search(q);
    const tags = {};
    S.products.forEach((p) => p.tags.forEach((t) => { tags[t] = (tags[t] || 0) + 1; }));
    const popular = Object.entries(tags).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t]) => t);
    view.innerHTML = `
      <div class="page-head">
        <button class="back-btn" data-back aria-label="Quay lại">${I.left}</button>
        <div><h1>Kết quả cho “${esc(q)}”</h1><p class="muted">${res.length} mẫu phù hợp</p></div>
      </div>
      ${res.length ? `<div class="grid">${res.map(card).join('')}</div>` : `
        <div class="empty">${I.search}<h3>Không tìm thấy mẫu nào</h3><p>Thử từ khoá khác, hoặc xem các chủ đề phổ biến:</p>
          <div class="chips">${popular.map((t) => `<a class="tag" href="#/search/${enc(t)}">#${esc(t)}</a>`).join('')}</div></div>`}`;
  }

  let sugSel = -1;
  let sugItems = [];
  function setupSearch() {
    const form = $('#searchForm');
    const input = $('#q');
    const box = $('#suggest');
    let timer;
    const update = () => {
      const q = input.value.trim();
      if (!q || !S.products.length) return hideSuggest();
      sugItems = search(q).slice(0, 6);
      sugSel = -1;
      box.innerHTML = sugItems.length
        ? sugItems.map((p, i) => `<a class="sg-item" data-i="${i}" href="${productUrl(p)}">
            <span class="sg-thumb">${p.cover ? `<img src="${esc(p.cover)}" alt="">` : ''}</span>
            <span><b>${esc(p.title)}</b><small>${esc(p.categoryIcon)} ${esc(p.categoryName)}</small></span></a>`).join('')
          + `<a class="sg-all" href="#/search/${enc(q)}">Xem tất cả kết quả cho “${esc(q)}” →</a>`
        : `<div class="sg-empty">Không tìm thấy mẫu nào cho “${esc(q)}”</div>`;
      box.hidden = false;
    };
    input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(update, 80); });
    input.addEventListener('focus', () => { if (input.value.trim()) update(); });
    input.addEventListener('keydown', (e) => {
      if (box.hidden) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!sugItems.length) return;
        const n = sugItems.length;
        if (e.key === 'ArrowDown') sugSel = sugSel + 1 >= n ? -1 : sugSel + 1;
        else sugSel = sugSel - 1 < -1 ? n - 1 : sugSel - 1;
        $$('.sg-item', box).forEach((el, i) => el.classList.toggle('on', i === sugSel));
      } else if (e.key === 'Escape') { hideSuggest(); input.blur(); }
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = input.value.trim();
      if (sugSel >= 0 && sugItems[sugSel]) location.hash = productUrl(sugItems[sugSel]);
      else if (q) location.hash = `#/search/${enc(q)}`;
      hideSuggest();
      input.blur();
    });
    document.addEventListener('click', (e) => { if (!form.contains(e.target)) hideSuggest(); });
  }
  function hideSuggest() { const b = $('#suggest'); if (b) { b.hidden = true; b.innerHTML = ''; } sugSel = -1; }

  /* ---------- trang chi tiết ---------- */
  function recommend(p, n = 6) {
    const tags = new Set(p.tagsN);
    const seed = (s) => { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0; return (h >>> 0) / 4294967295; };
    return S.products
      .filter((x) => x !== p)
      .map((x) => ({
        x,
        s: (x.category === p.category ? 3 : 0) + x.tagsN.filter((t) => tags.has(t)).length * 2 + (x.featured ? 0.5 : 0) + seed(p.id + x.id),
      }))
      .sort((a, b) => b.s - a.s)
      .slice(0, n)
      .map((r) => r.x);
  }

  function renderProduct(catKey, id) {
    const p = S.products.find((x) => x.category === catKey && x.id === id);
    if (!p) return render404();
    document.title = `${p.title} · ${S.site.name}`;

    const contact = S.site.contact && S.site.contact.url ? [S.site.contact] : [];
    const links = (Array.isArray(p.links) && p.links.length ? p.links : contact).filter((l) => l && l.url);
    const imgs = p.media.filter((m) => m.type === 'image').length;
    const vids = p.media.length - imgs;
    const specs = Object.entries(p.specs || {}).filter(([, v]) => v !== '' && v != null);
    const recs = recommend(p);

    const profiles = p.profiles.length ? `
      <h3 class="panel-title">Cấu hình in <em>(${p.profiles.length})</em></h3>
      <div class="profiles">${p.profiles.map((r) => `
        <div class="profile">
          <div class="pf-img">${p.cover ? `<img src="${esc(r.image || p.cover)}" alt="" loading="lazy">` : ''}</div>
          <div><b>${esc(r.name || 'Cấu hình')}</b>
            <div class="pf-meta">
              ${r.badge ? `<span class="pf-badge">${esc(r.badge)}</span>` : ''}
              ${r.time ? `<span>${I.clock}${esc(r.time)}</span>` : ''}
              ${r.plates ? `<span>${I.layers}${esc(r.plates)} plate</span>` : ''}
              ${r.filament ? `<span>${esc(r.filament)}</span>` : ''}
            </div></div>
        </div>`).join('')}</div>` : '';

    view.innerHTML = `
      <div class="d-head">
        <div class="crumbs">
          <button class="back-btn" data-back aria-label="Quay lại">${I.left}</button>
          <a href="${catUrl(p.category)}">${esc(p.categoryIcon)} ${esc(p.categoryName)}</a><span>/</span>
          <span class="cur">${esc(p.title)}</span>
        </div>
        <h1 class="d-title">${esc(p.title)}</h1>
        <div class="d-author">${avatar()}<b>${esc(p.author)}</b>
          ${p.featured ? '<span class="pill-outline">Nổi bật</span>' : ''}
          ${p.time ? `<span class="muted">· ${fmtDate(p.time)}</span>` : ''}</div>
      </div>
      <div class="d-cols">
        <div class="d-main">
          <div class="gallery" id="gallery"></div>
          <section class="panel d-desc">
            <div class="tabs"><span class="tab on">Mô tả</span></div>
            <div class="md">${md(p.description) || '<p class="muted">Chưa có mô tả.</p>'}</div>
          </section>
        </div>
        <aside class="d-side">
          <section class="panel d-info">
            ${p.price ? `<div class="price-row"><span>Giá tham khảo</span><b>${esc(p.price)}</b></div>` : ''}
            ${profiles}
            <div class="cta">
              ${links.map((l, i) => `<a class="btn ${i === 0 ? 'primary' : 'ghost'} block" href="${esc(safeUrl(l.url))}" ${isExternal(l.url) ? 'target="_blank" rel="noopener"' : ''}>${i === 0 ? I.chat : I.external}${esc(l.label || 'Mở liên kết')}</a>`).join('')}
              <button class="btn ghost block" data-share>${I.share}Chia sẻ</button>
            </div>
            <dl class="specs">
              <div><dt>Danh mục</dt><dd><a href="${catUrl(p.category)}">${esc(p.categoryName)}</a></dd></div>
              ${specs.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}
              <div><dt>Thư viện</dt><dd>${imgs} ảnh${vids ? ` · ${vids} video` : ''}</dd></div>
              ${p.time ? `<div><dt>Ngày đăng</dt><dd>${fmtDate(p.time)}</dd></div>` : ''}
            </dl>
            ${p.tags.length ? `<div class="tags">${p.tags.map((t) => `<a class="tag" href="#/search/${enc(t)}">#${esc(t)}</a>`).join('')}</div>` : ''}
          </section>
          ${recs.length ? `<section class="panel d-recs">
            <h3 class="panel-title">Có thể bạn thích</h3>
            <div class="recs">${recs.map((r) => `
              <a class="rec" href="${productUrl(r)}">
                <span class="rec-img">${r.cover ? `<img src="${esc(r.cover)}" alt="" loading="lazy">` : ''}${r.hasVideo ? `<span class="card-vid">${I.play}</span>` : ''}</span>
                <span class="rec-body"><b>${esc(r.title)}</b><span class="rec-cat">${esc(r.categoryIcon)} ${esc(r.categoryName)}</span>
                  <span class="rec-meta">${r.price ? `<span class="price">${esc(r.price)}</span> · ` : ''}${relTime(r.time)}</span></span>
              </a>`).join('')}</div>
          </section>` : ''}
        </aside>
      </div>`;
    mountGallery($('#gallery'), p.media, p.title);
  }

  function render404() {
    document.title = `Không tìm thấy · ${S.site.name}`;
    view.innerHTML = `<div class="empty" style="margin-top:40px">${I.search}<h3>Không tìm thấy trang này</h3>
      <p>Có thể sản phẩm đã bị đổi tên hoặc ẩn.</p><p><a class="btn primary" href="#/">Về trang chủ</a></p></div>`;
  }

  /* ---------- gallery ---------- */
  function thumbHtml(m, i) {
    const inner = m.type === 'video'
      ? `${m.poster ? `<img src="${esc(m.poster)}" alt="" loading="lazy">` : `<video src="${esc(m.src)}#t=0.1" muted preload="metadata" playsinline></video>`}<span class="play">${I.play}</span>`
      : `<img src="${esc(m.src)}" alt="" loading="lazy">`;
    return `<button class="thumb" data-i="${i}" aria-label="${m.type === 'video' ? 'Video' : 'Ảnh'} ${i + 1}">${inner}</button>`;
  }
  function mediaHtml(m, title, i, total) {
    return m.type === 'video'
      ? `<video src="${esc(m.src)}" controls playsinline preload="metadata" ${m.poster ? `poster="${esc(m.poster)}"` : ''}></video>`
      : `<img src="${esc(m.src)}" alt="${esc(title)} - ảnh ${i + 1}/${total}">`;
  }
  function pauseAll(root) { $$('video', root).forEach((v) => { try { v.pause(); } catch { /* */ } }); }
  function centerThumb(strip, el) {
    if (!el) return;
    strip.scrollTo({ left: el.offsetLeft - strip.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' });
  }
  function addSwipe(el, onPrev, onNext) {
    let x0 = null, y0 = null;
    el.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    el.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      const dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) (dx > 0 ? onPrev : onNext)();
      x0 = null;
    }, { passive: true });
  }

  function mountGallery(root, media, title) {
    if (!media.length) {
      root.innerHTML = `<div class="stage empty"><div class="noimg">${I.image}</div></div>`;
      return;
    }
    let idx = 0;
    const many = media.length > 1;
    root.innerHTML = `
      <div class="stage">
        <div class="stage-media"></div>
        ${many ? `<button class="nav prev" aria-label="Trước">${I.left}</button><button class="nav next" aria-label="Sau">${I.right}</button>` : ''}
        <div class="stage-pill"><span class="pill-count"></span><span class="sep"></span><button class="zoom">${I.expand}Phóng to</button></div>
      </div>
      <div class="thumbs-wrap">
        ${many ? `<button class="tnav tl" aria-label="Cuộn trái">${I.left}</button>` : ''}
        <div class="thumbs">${media.map(thumbHtml).join('')}</div>
        ${many ? `<button class="tnav tr" aria-label="Cuộn phải">${I.right}</button>` : ''}
      </div>`;
    const stage = $('.stage', root);
    const box = $('.stage-media', root);
    const strip = $('.thumbs', root);
    const show = (i) => {
      pauseAll(box);
      idx = (i + media.length) % media.length;
      const m = media[idx];
      box.innerHTML = mediaHtml(m, title, idx, media.length);
      stage.classList.toggle('is-video', m.type === 'video');
      $('.pill-count', root).textContent = `${m.type === 'video' ? 'Video' : 'Ảnh'} ${idx + 1}/${media.length}`;
      $$('.thumb', strip).forEach((t, k) => t.classList.toggle('on', k === idx));
      centerThumb(strip, $$('.thumb', strip)[idx]);
    };
    box.addEventListener('click', (e) => { if (e.target.tagName === 'IMG') openLightbox(media, idx, title); });
    $('.zoom', root).addEventListener('click', () => { pauseAll(box); openLightbox(media, idx, title); });
    strip.addEventListener('click', (e) => { const t = e.target.closest('.thumb'); if (t) show(+t.dataset.i); });
    if (many) {
      $('.nav.prev', root).addEventListener('click', () => show(idx - 1));
      $('.nav.next', root).addEventListener('click', () => show(idx + 1));
      $('.tl', root).addEventListener('click', () => strip.scrollBy({ left: -strip.clientWidth * 0.8, behavior: 'smooth' }));
      $('.tr', root).addEventListener('click', () => strip.scrollBy({ left: strip.clientWidth * 0.8, behavior: 'smooth' }));
      addSwipe(box, () => show(idx - 1), () => show(idx + 1));
    }
    S.gallery = { prev: () => show(idx - 1), next: () => show(idx + 1) };
    show(0);
  }

  /* ---------- lightbox (xem ảnh to) ---------- */
  const LB = { media: [], idx: 0, title: '' };
  function openLightbox(media, idx, title) {
    const el = $('#lightbox');
    LB.media = media; LB.title = title;
    const many = media.length > 1;
    el.innerHTML = `
      <div class="lb-top"><span class="lb-count"></span><span class="lb-hint">Bấm vào ảnh để phóng to · ← → để chuyển · Esc để đóng</span>
        <button class="lb-close" aria-label="Đóng">${I.close}</button></div>
      <div class="lb-stage">
        ${many ? `<button class="lb-nav prev" aria-label="Trước">${I.left}</button>` : ''}
        <div class="lb-media"></div>
        ${many ? `<button class="lb-nav next" aria-label="Sau">${I.right}</button>` : ''}
      </div>
      ${many ? `<div class="lb-thumbs">${media.map(thumbHtml).join('')}</div>` : '<div></div>'}`;
    el.hidden = false;
    document.body.classList.add('no-scroll');
    requestAnimationFrame(() => el.classList.add('open'));

    const box = $('.lb-media', el);
    $('.lb-close', el).addEventListener('click', closeLightbox);
    $('.lb-stage', el).addEventListener('click', (e) => {
      if (e.target.classList.contains('lb-stage') || e.target === box) closeLightbox();
    });
    if (many) {
      $('.lb-nav.prev', el).addEventListener('click', () => lbShow(LB.idx - 1));
      $('.lb-nav.next', el).addEventListener('click', () => lbShow(LB.idx + 1));
      $('.lb-thumbs', el).addEventListener('click', (e) => { const t = e.target.closest('.thumb'); if (t) lbShow(+t.dataset.i); });
    }
    box.addEventListener('click', (e) => {
      if (e.target.tagName !== 'IMG') return;
      const z = box.classList.toggle('zoomed');
      if (z) setOrigin(e);
    });
    box.addEventListener('mousemove', (e) => { if (box.classList.contains('zoomed')) setOrigin(e); });
    addSwipe(box, () => { if (!box.classList.contains('zoomed')) lbShow(LB.idx - 1); }, () => { if (!box.classList.contains('zoomed')) lbShow(LB.idx + 1); });
    function setOrigin(e) {
      const img = $('img', box);
      if (!img) return;
      const r = img.getBoundingClientRect();
      // r đã bị phóng to → quy về kích thước gốc
      const x = Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100));
      const y = Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100));
      img.style.transformOrigin = `${x}% ${y}%`;
    }
    lbShow(idx);
  }
  function lbShow(i) {
    const el = $('#lightbox');
    if (el.hidden) return;
    const box = $('.lb-media', el);
    pauseAll(box);
    box.classList.remove('zoomed');
    LB.idx = (i + LB.media.length) % LB.media.length;
    const m = LB.media[LB.idx];
    box.innerHTML = mediaHtml(m, LB.title, LB.idx, LB.media.length);
    if (m.type === 'video') { const v = $('video', box); v.autoplay = true; }
    $('.lb-count', el).textContent = `${LB.idx + 1} / ${LB.media.length}`;
    const strip = $('.lb-thumbs', el);
    if (strip) {
      $$('.thumb', strip).forEach((t, k) => t.classList.toggle('on', k === LB.idx));
      centerThumb(strip, $$('.thumb', strip)[LB.idx]);
    }
  }
  function closeLightbox() {
    const el = $('#lightbox');
    if (!el || el.hidden) return;
    pauseAll(el);
    el.classList.remove('open');
    el.hidden = true;
    el.innerHTML = '';
    document.body.classList.remove('no-scroll');
  }

  /* ---------- bàn phím ---------- */
  function onKey(e) {
    const lb = $('#lightbox');
    if (!lb.hidden) {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') lbShow(LB.idx - 1);
      else if (e.key === 'ArrowRight') lbShow(LB.idx + 1);
      return;
    }
    const tag = (e.target.tagName || '').toUpperCase();
    if (['INPUT', 'TEXTAREA', 'SELECT', 'VIDEO'].includes(tag) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === '/') { e.preventDefault(); $('#q').focus(); return; }
    if (e.key === 'Escape') closeDrawer();
    if (S.gallery && e.key === 'ArrowLeft') S.gallery.prev();
    if (S.gallery && e.key === 'ArrowRight') S.gallery.next();
  }

  /* ---------- chia sẻ & thông báo ---------- */
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => t.classList.remove('show'), 2200);
  }
  async function share() {
    const url = location.href;
    if (navigator.share && isMobile()) {
      try { await navigator.share({ title: document.title, url }); return; } catch { /* người dùng huỷ */ return; }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast('Đã sao chép liên kết');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast('Đã sao chép liên kết'); } catch { window.prompt('Sao chép liên kết:', url); }
      ta.remove();
    }
  }

  /* ---------- markdown đơn giản cho phần mô tả ---------- */
  function inline(s) {
    let h = esc(s);
    h = h.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, u) => `<img src="${safeUrl(u)}" alt="${alt}" loading="lazy">`);
    h = h.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => `<a href="${safeUrl(u)}"${isExternal(u) ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`);
    h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    h = h.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
    h = h.replace(/`([^`]+)`/g, '<code>$1</code>');
    return h;
  }
  function md(src) {
    const lines = String(src || '').replace(/\r/g, '').split('\n');
    let html = '';
    let para = [];
    let list = null;
    const flushP = () => { if (para.length) { html += `<p>${para.map(inline).join('<br>')}</p>`; para = []; } };
    const flushL = () => { if (list) { html += `<${list.t}>${list.items.map((x) => `<li>${inline(x)}</li>`).join('')}</${list.t}>`; list = null; } };
    for (const line of lines) {
      const t = line.trim();
      let m;
      if (!t) { flushP(); flushL(); continue; }
      if (/^(-{3,}|\*{3,})$/.test(t)) { flushP(); flushL(); html += '<hr>'; continue; }
      if ((m = /^(#{1,3})\s+(.*)$/.exec(t))) { flushP(); flushL(); const lv = m[1].length + 2; html += `<h${lv}>${inline(m[2])}</h${lv}>`; continue; }
      if ((m = /^[-*•]\s+(.*)$/.exec(t))) { flushP(); if (!list || list.t !== 'ul') { flushL(); list = { t: 'ul', items: [] }; } list.items.push(m[1]); continue; }
      if ((m = /^\d+[.)]\s+(.*)$/.exec(t))) { flushP(); if (!list || list.t !== 'ol') { flushL(); list = { t: 'ol', items: [] }; } list.items.push(m[1]); continue; }
      flushL();
      para.push(t);
    }
    flushP(); flushL();
    return html;
  }

  boot();
})();
