/* ================================================================
 * UDTC Display Manager — Admin SPA (Vanilla JS + TailwindCSS + SweetAlert2)
 * ================================================================ */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clone = o => JSON.parse(JSON.stringify(o));
const rid = () => Math.random().toString(36).slice(2, 12);
let ORIGIN = location.origin;
const isLocalHost = h => /^(localhost|127\.|\[?::1\]?$|0\.0\.0\.0)/.test(h);
function resolveOrigin() {
  // ที่อยู่ที่ใช้สร้างโค้ดฝัง/ลิงก์ ต้องเป็นที่อยู่ที่เครื่องลูกข่ายเข้าถึงได้
  if (state.settings.publicUrl) return state.settings.publicUrl;
  if (isLocalHost(location.hostname) && state.server && state.server.urls && state.server.urls[0]) return state.server.urls[0];
  return location.origin;
}
const fmtSize = b => b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(1) + ' MB';
const fmtDate = d => d ? new Date(d).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : '-';
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

/* ---------------- Icons ---------------- */
const IC = {
  dash: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  widget: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
  page: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
  media: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  cog: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>', eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  ext: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  up: '<path d="m18 15-6-6-6 6"/>', down: '<path d="m6 9 6 6 6-6"/>', grip: '<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>',
  back: '<path d="m15 18-6-6 6-6"/>', save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>', logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
  video: '<path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2"/>', link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  html: '<path d="m18 16 4-4-4-4M6 8l-4 4 4 4M14.5 4l-5 16"/>', file: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><path d="M14 2v6h6"/>',
  heading: '<path d="M6 12h12M6 20V4M18 20V4"/>', text: '<path d="M17 6.1H3M21 12.1H3M15.1 18H3"/>', bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  minus: '<path d="M5 12h14"/>', desktop: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>', tablet: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M12 18h.01"/>',
  phone: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>', menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>', home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>', search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5"/>',
};
const icon = (n, c = 'w-4 h-4') => `<svg class="${c}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${IC[n] || ''}</svg>`;

/* ---------------- SweetAlert helpers ---------------- */
const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2200, timerProgressBar: true });
const ok = msg => Toast.fire({ icon: 'success', title: msg });
const fail = msg => Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: msg, confirmButtonText: 'ตกลง' });
const confirmBox = (title, text, btn = 'ยืนยัน', danger = true) => Swal.fire({
  icon: danger ? 'warning' : 'question', title, text, showCancelButton: true, confirmButtonText: btn, cancelButtonText: 'ยกเลิก',
  confirmButtonColor: danger ? '#be123c' : '#1e3a5f', reverseButtons: true, focusCancel: danger,
}).then(r => r.isConfirmed);

/* ---------------- API ---------------- */
async function api(method, url, body) {
  const opt = { method, headers: {}, credentials: 'same-origin' };
  if (body !== undefined) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
  const r = await fetch('/api' + url, opt);
  if (r.status === 401 && url !== '/login') { state.user = null; renderLogin(); throw new Error('หมดเวลาการใช้งาน กรุณาเข้าสู่ระบบใหม่'); }
  const ct = r.headers.get('content-type') || '';
  const data = ct.includes('json') ? await r.json() : await r.text();
  if (!r.ok) throw new Error(data.error || 'เกิดข้อผิดพลาด');
  return data;
}
// โหมดคลาวด์ (Vercel Blob): ย่อภาพก่อนอัปโหลด และส่งไฟล์ใหญ่ตรงจากเบราว์เซอร์ไปที่ Blob
const BLOB_CLIENT_URL = 'https://esm.sh/@vercel/blob@1/client';
const IMG_MAX_SIDE = 2400, IMG_KEEP_BYTES = 1.5 * 1048576;
const cloudStorage = () => !!(state.server && state.server.storage === 'blob');
async function shrinkImage(file) {
  if (!cloudStorage() || !/^image\/(jpeg|png|webp)$/.test(file.type) || typeof createImageBitmap !== 'function') return file;
  let bmp; try { bmp = await createImageBitmap(file); } catch { return file; }
  const scale = Math.min(1, IMG_MAX_SIDE / Math.max(bmp.width, bmp.height));
  if (scale === 1 && file.size <= IMG_KEEP_BYTES) { bmp.close && bmp.close(); return file; }
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height); bmp.close && bmp.close();
  const blob = await new Promise(r => c.toBlob(r, 'image/webp', 0.86));
  if (!blob || blob.type !== 'image/webp' || (scale === 1 && blob.size >= file.size)) return file;
  return new File([blob], file.name.replace(/\.[a-z0-9]+$/i, '') + '.webp', { type: 'image/webp' });
}
function uploadViaServer(file, onProgress) {
  return new Promise((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open('POST', '/api/media');
    x.setRequestHeader('X-Filename', encodeURIComponent(file.name));
    x.upload.onprogress = e => e.lengthComputable && onProgress && onProgress(e.loaded / e.total);
    x.onload = () => { let d; try { d = JSON.parse(x.responseText); } catch { d = {}; } x.status < 300 ? resolve(d) : reject(new Error(d.error || (x.status === 413 ? 'ไฟล์ใหญ่เกินไป' : 'อัปโหลดไม่สำเร็จ'))); };
    x.onerror = () => reject(new Error('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'));
    x.send(file);
  });
}
async function uploadDirectToBlob(file, onProgress) {
  let mod;
  try { mod = await import(BLOB_CLIENT_URL); } catch { throw new Error('โหลดตัวอัปโหลดไฟล์ใหญ่ไม่ได้ (esm.sh) — ตรวจการเชื่อมต่ออินเทอร์เน็ต'); }
  const ext = ((file.name.match(/\.[a-z0-9]+$/i) || [''])[0]).toLowerCase();
  const d = new Date();
  const pathname = `uploads/${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}/${Date.now().toString(36)}-${rid().slice(0, 6)}${ext}`;
  const r = await mod.upload(pathname, file, {
    access: 'public', handleUploadUrl: '/api/blob-upload', contentType: file.type || undefined,
    multipart: file.size > 50 * 1048576,
    onUploadProgress: p => onProgress && onProgress((p.percentage || 0) / 100),
  });
  return api('POST', '/media/register', { url: r.url, name: file.name, size: file.size });
}
async function uploadFile(file, onProgress) {
  file = await shrinkImage(file);
  const limit = (state.server && state.server.uploadDirectMax) || Infinity;
  if (cloudStorage() && file.size > limit) return uploadDirectToBlob(file, onProgress);
  return uploadViaServer(file, onProgress);
}
async function uploadMany(files) {
  const out = [];
  Swal.fire({ title: 'กำลังอัปโหลด...', html: '<div id="upst" class="text-sm text-slate-600">เตรียมไฟล์</div><div class="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden"><div id="upbar" class="h-full bg-navy-800 transition-all" style="width:0%"></div></div>', allowOutsideClick: false, showConfirmButton: false });
  try {
    for (let i = 0; i < files.length; i++) {
      $('#upst').textContent = `ไฟล์ ${i + 1}/${files.length}: ${files[i].name}`;
      out.push(await uploadFile(files[i], p => { $('#upbar').style.width = ((i + p) / files.length * 100) + '%'; }));
    }
    Swal.close(); ok(`อัปโหลดสำเร็จ ${out.length} ไฟล์`);
  } catch (e) { Swal.close(); fail(e.message); }
  return out;
}
function copyText(t) {
  (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => ok('คัดลอกแล้ว')).catch(() => {
    const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); ok('คัดลอกแล้ว');
  });
}

/* ---------------- Modal (stackable) ---------------- */
let modalZ = 50;
function openModal({ title, body, size = 'max-w-2xl', footer = '', onMount, onClose }) {
  const el = document.createElement('div');
  el.className = 'fixed inset-0 flex items-start sm:items-center justify-center p-3 sm:p-6';
  el.style.zIndex = ++modalZ;
  el.innerHTML = `<div class="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" data-close></div>
  <div class="relative bg-white rounded-2xl shadow-2xl w-full ${size} max-h-[92vh] flex flex-col">
    <div class="flex items-center justify-between px-5 py-4 border-b border-slate-200"><h3 class="font-bold text-lg text-slate-900">${title}</h3>
    <button class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" data-close>${icon('x', 'w-5 h-5')}</button></div>
    <div class="p-5 overflow-y-auto scroll-thin" data-body>${body}</div>
    ${footer ? `<div class="px-5 py-3 border-t border-slate-200 flex justify-end gap-2 bg-slate-50 rounded-b-2xl" data-foot>${footer}</div>` : ''}
  </div>`;
  $('#modals').appendChild(el);
  let closed = false;
  const close = () => { if (closed) return; closed = true; el.remove(); modalZ--; onClose && onClose(); };
  $$('[data-close]', el).forEach(b => b.onclick = close);
  el.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  onMount && onMount(el, close);
  return { el, close };
}

/* ---------------- Media picker ---------------- */
function pickMedia(kind = 'image') {
  return new Promise(resolve => {
    const accept = { image: 'image/*', video: 'video/*', file: '', any: '' }[kind];
    const label = { image: 'ภาพ', video: 'วีดีโอ', file: 'ไฟล์เอกสาร', any: 'ไฟล์' }[kind];
    let chosen = null;
    openModal({
      onClose: () => resolve(chosen),
      title: `เลือก${label}`, size: 'max-w-4xl',
      body: `<div class="flex flex-col sm:flex-row gap-3 mb-4">
          <label class="btn btn-primary cursor-pointer">${icon('upload')} อัปโหลด${label}ใหม่<input type="file" ${accept ? `accept="${accept}"` : ''} class="hidden" data-up></label>
          <div class="flex-1 flex gap-2"><input class="inp" placeholder="หรือวาง URL ${kind === 'video' ? '(รองรับ YouTube / Facebook / ไฟล์ .mp4)' : ''}" data-url><button class="btn btn-light" data-useurl>ใช้ URL</button></div>
        </div>
        <div class="grid grid-cols-3 sm:grid-cols-5 gap-3" data-grid><div class="col-span-full text-center py-10 text-slate-400">กำลังโหลด...</div></div>`,
      onMount: async (el, close) => {
        const done = url => { chosen = url; close(); };
        $('[data-useurl]', el).onclick = () => { const v = $('[data-url]', el).value.trim(); if (v) done(v); };
        $('[data-up]', el).onchange = async e => { const r = await uploadMany([...e.target.files]); if (r[0]) done(r[0].url); };
        const list = (await api('GET', '/media')).filter(x => kind === 'any' || kind === 'file' ? true : x.kind === kind);
        const g = $('[data-grid]', el);
        g.innerHTML = list.length ? list.map(x => `<button class="group text-left rounded-lg border border-slate-200 overflow-hidden hover:ring-2 hover:ring-navy-500" data-pick="${esc(x.url)}">
            <div class="aspect-square bg-slate-100 grid place-items-center overflow-hidden chk-pattern">${x.kind === 'image' ? `<img src="${esc(x.url)}" class="w-full h-full object-cover" loading="lazy">` : x.kind === 'video' ? icon('video', 'w-8 h-8 text-slate-400') : icon('file', 'w-8 h-8 text-slate-400')}</div>
            <div class="px-2 py-1.5 text-xs text-slate-600 truncate">${esc(x.name)}</div></button>`).join('')
          : `<div class="col-span-full text-center py-10 text-slate-400">ยังไม่มี${label}ในคลัง — อัปโหลดได้จากปุ่มด้านบน</div>`;
        $$('[data-pick]', g).forEach(b => b.onclick = () => done(b.dataset.pick));
      },
    });
  });
}

/* ---------------- State & routing ---------------- */
const state = { user: null, settings: {}, dirty: false };
window.addEventListener('beforeunload', e => { if (state.dirty) { e.preventDefault(); e.returnValue = ''; } });
const routes = [
  [/^#\/dashboard$/, viewDashboard], [/^#\/widgets$/, viewWidgets], [/^#\/widgets\/(\w+)$/, viewWidgetEditor],
  [/^#\/pages$/, viewPages], [/^#\/intros$/, viewIntros], [/^#\/intros\/(\w+)$/, viewIntroEditor], [/^#\/pages\/(\w+)$/, viewPageEditor], [/^#\/media$/, viewMedia],
  [/^#\/users$/, viewUsers], [/^#\/settings$/, viewSettings], [/^#\/account$/, viewAccount],
];
let lastHash = location.hash;
async function router() {
  if (!state.user) return;
  if (state.dirty && location.hash !== lastHash) {
    if (!(await confirmBox('ยังไม่ได้บันทึก', 'มีการแก้ไขที่ยังไม่ได้บันทึก ต้องการออกจากหน้านี้หรือไม่?', 'ออกโดยไม่บันทึก'))) { history.replaceState(null, '', lastHash); return; }
    state.dirty = false;
  }
  lastHash = location.hash;
  $('#modals').innerHTML = ''; modalZ = 50; // ปิดหน้าต่างที่ค้างอยู่เมื่อเปลี่ยนหน้า
  const h = location.hash || '#/dashboard';
  for (const [re, fn] of routes) {
    const m = h.match(re);
    if (m) { highlightNav(h); $('#view').innerHTML = '<div class="p-10 text-center text-slate-400">กำลังโหลด...</div>'; try { await fn(...m.slice(1)); } catch (e) { $('#view').innerHTML = `<div class="p-10 text-center text-rose-600">${esc(e.message)}</div>`; } window.scrollTo(0, 0); return; }
  }
  location.hash = '#/dashboard';
}
window.addEventListener('hashchange', router);

/* ---------------- Login ---------------- */
function renderLogin() {
  $('#app').innerHTML = `
  <div class="min-h-screen grid lg:grid-cols-2">
    <div class="hidden lg:flex flex-col justify-between p-12 bg-navy-800 text-white relative overflow-hidden">
      <div class="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-white/5"></div><div class="absolute -left-20 bottom-10 w-72 h-72 rounded-full bg-gold-500/10"></div>
      <div class="relative flex items-center gap-3"><img src="/assets/logo.svg" class="w-12 h-12"><div><div class="font-bold text-lg">ระบบจัดการส่วนแสดงผล</div><div class="text-navy-200 text-sm">Display &amp; Page Manager</div></div></div>
      <div class="relative"><h1 class="text-4xl font-bold leading-tight">จัดการภาพ วีดีโอ และลิงก์<br>สำหรับเว็บไซต์หน่วยงาน</h1>
        <p class="mt-4 text-navy-200 max-w-md leading-relaxed">สร้างส่วนแสดงผลแยกเป็นชิ้น นำไปฝังด้วย &lt;iframe&gt; ได้ทันที พร้อมสร้างหน้าเว็บเผยแพร่ข้อมูลเพิ่มเติม</p></div>
      <div class="relative text-sm text-navy-300">© ${new Date().getFullYear() + 543}</div>
    </div>
    <div class="flex items-center justify-center p-6">
      <form id="loginForm" class="w-full max-w-sm">
        <img src="/assets/logo.svg" class="w-14 h-14 lg:hidden mb-4">
        <h2 class="text-2xl font-bold text-slate-900">เข้าสู่ระบบ</h2><p class="text-slate-500 mt-1 mb-8">สำหรับเจ้าหน้าที่ผู้ดูแลเนื้อหา</p>
        <label class="lbl">ชื่อผู้ใช้</label><input name="username" class="inp !py-2.5 mb-4" autocomplete="username" required autofocus>
        <label class="lbl">รหัสผ่าน</label><input name="password" type="password" class="inp !py-2.5 mb-6" autocomplete="current-password" required>
        <button class="btn btn-primary w-full !py-3">เข้าสู่ระบบ</button>
        <a href="/" class="block text-center text-sm text-slate-500 hover:text-navy-800 mt-6">← กลับไปหน้าเว็บไซต์</a>
      </form>
    </div>
  </div>`;
  $('#loginForm').onsubmit = async e => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      const r = await api('POST', '/login', { username: f.get('username'), password: f.get('password') });
      state.user = r.user; await boot(); ok(`ยินดีต้อนรับ ${r.user.name}`);
    } catch (err) { fail(err.message); }
  };
}

/* ---------------- Shell ---------------- */
function renderShell() {
  const isAdmin = state.user.role === 'admin';
  const nav = [['#/dashboard', 'dash', 'ภาพรวม'], ['#/widgets', 'widget', 'ส่วนแสดงผล (iframe)'], ['#/pages', 'page', 'หน้าเว็บเผยแพร่'], ['#/intros', 'home', 'หน้า Intro'], ['#/media', 'media', 'คลังสื่อ']];
  const navAdmin = [['#/users', 'users', 'ผู้ใช้งาน'], ['#/settings', 'cog', 'ตั้งค่าเว็บไซต์']];
  const link = ([h, i, t]) => `<a href="${h}" class="nav-a" data-nav="${h}">${icon(i, 'w-[18px] h-[18px]')}<span>${t}</span></a>`;
  $('#app').innerHTML = `
  <div class="min-h-screen lg:pl-64">
    <aside id="side" class="fixed inset-y-0 left-0 w-64 bg-navy-900 text-white z-40 flex flex-col -translate-x-full lg:translate-x-0 transition-transform">
      <div class="h-16 flex items-center gap-3 px-5 border-b border-white/10"><img src="${esc(state.settings.logo || '/assets/logo.svg')}" class="w-9 h-9 object-contain"><div class="min-w-0"><div class="font-bold text-[15px] truncate">${esc(state.settings.siteName)}</div><div class="text-xs text-navy-300">ระบบจัดการส่วนแสดงผล</div></div></div>
      <nav class="flex-1 p-3 space-y-1 overflow-y-auto">
        <div class="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-navy-400">เนื้อหา</div>${nav.map(link).join('')}
        ${isAdmin ? `<div class="px-3 pt-5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-navy-400">ระบบ</div>${navAdmin.map(link).join('')}` : ''}
      </nav>
      <div class="p-3 border-t border-white/10 space-y-1">
        <a href="/" target="_blank" class="nav-a">${icon('ext', 'w-[18px] h-[18px]')}<span>เปิดหน้าเว็บไซต์</span></a>
      </div>
    </aside>
    <div id="sideBg" class="fixed inset-0 bg-black/40 z-30 hidden lg:hidden"></div>
    <header class="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6">
      <button id="sideBtn" class="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100">${icon('menu', 'w-5 h-5')}</button>
      <div class="hidden lg:block text-sm text-slate-500" id="crumb"></div>
      <div class="relative">
        <button id="userBtn" class="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-100">
          <span class="w-8 h-8 rounded-full bg-navy-800 text-white grid place-items-center text-sm font-bold">${esc(state.user.name.slice(0, 1))}</span>
          <span class="text-left hidden sm:block"><span class="block text-sm font-semibold leading-tight">${esc(state.user.name)}</span><span class="block text-xs text-slate-500">${state.user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้แก้ไขเนื้อหา'}</span></span>
          ${icon('down', 'w-4 h-4 text-slate-400')}
        </button>
        <div id="userMenu" class="hidden absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50">
          <a href="#/account" class="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-slate-50">${icon('key')} เปลี่ยนรหัสผ่าน</a>
          <button id="logoutBtn" class="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50">${icon('logout')} ออกจากระบบ</button>
        </div>
      </div>
    </header>
    <main id="view" class="p-4 sm:p-6"></main>
  </div>`;
  const side = $('#side'), bg = $('#sideBg');
  const toggle = o => { side.classList.toggle('-translate-x-full', !o); bg.classList.toggle('hidden', !o); };
  $('#sideBtn').onclick = () => toggle(true); bg.onclick = () => toggle(false);
  $$('#side a').forEach(a => a.addEventListener('click', () => toggle(false)));
  $('#userBtn').onclick = e => { e.stopPropagation(); $('#userMenu').classList.toggle('hidden'); };
  document.addEventListener('click', () => $('#userMenu') && $('#userMenu').classList.add('hidden'));
  $('#logoutBtn').onclick = async () => { await api('POST', '/logout'); state.user = null; state.dirty = false; renderLogin(); };
}
function highlightNav(h) {
  $$('[data-nav]').forEach(a => a.classList.toggle('on', h.startsWith(a.dataset.nav)));
}
const pageHead = (title, sub = '', actions = '') => `<div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
  <div><h1 class="text-2xl font-bold text-slate-900">${title}</h1>${sub ? `<p class="text-slate-500 mt-1 text-[15px]">${sub}</p>` : ''}</div><div class="flex flex-wrap gap-2">${actions}</div></div>`;

/* ================================================================
 * Dashboard
 * ================================================================ */
async function viewDashboard() {
  const s = await api('GET', '/stats');
  const stat = (ic, label, val, sub, href) => `<a href="${href}" class="card p-5 hover:shadow-md transition flex items-start gap-4">
    <span class="w-11 h-11 rounded-xl bg-navy-50 text-navy-800 grid place-items-center flex-none">${icon(ic, 'w-5 h-5')}</span>
    <span><span class="block text-sm text-slate-500">${label}</span><span class="block text-2xl font-bold text-slate-900 mt-0.5">${val}</span><span class="block text-xs text-slate-400 mt-0.5">${sub}</span></span></a>`;
  $('#view').innerHTML = `${pageHead(`สวัสดี, ${esc(state.user.name)}`, 'ภาพรวมของระบบจัดการส่วนแสดงผลและหน้าเว็บเผยแพร่')}
  <div class="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
    ${stat('widget', 'ส่วนแสดงผล', s.widgets, `${s.activeItems}/${s.items} รายการกำลังแสดง`, '#/widgets')}
    ${stat('page', 'หน้าเว็บ', s.pages, `เผยแพร่แล้ว ${s.published} หน้า`, '#/pages')}
    ${stat('media', 'ไฟล์ในคลังสื่อ', s.media, `รวม ${fmtSize(s.mediaSize)}`, '#/media')}
    ${stat('home', 'หน้าเว็บไซต์', '<span class="text-base">เปิดดู →</span>', ORIGIN.replace(/^https?:\/\//, ''), '/" target="_blank')}
  </div>
  ${state.server && state.server.cloud && state.server.storage !== 'blob' ? `<div class="mt-4 p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm"><b>ยังอัปโหลดไฟล์ไม่ได้:</b> โปรเจกต์บน Vercel ยังไม่ได้เชื่อม Vercel Blob — ไปที่ Vercel → แท็บ Storage → Create → Blob (Public) → Connect กับโปรเจกต์นี้ แล้วไปที่ Deployments → Redeploy</div>` : ''}
  <div class="card p-5 mt-4">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div><h3 class="font-semibold text-slate-900">${state.server && state.server.cloud ? 'ที่อยู่ของระบบ (ออนไลน์)' : 'ที่อยู่สำหรับเครื่องลูกข่าย'}</h3><p class="text-sm text-slate-500">${state.server && state.server.cloud ? 'ทำงานบน Vercel — เปิดได้จากทุกที่ที่มีอินเทอร์เน็ต' : `เครื่องในเครือข่ายเดียวกันเข้าใช้งานผ่านที่อยู่นี้ · เครื่องแม่ข่าย: <span class="font-mono">${esc(state.server ? state.server.hostname : '')}</span> พอร์ต <span class="font-mono">${state.server ? state.server.port : ''}</span>`}</p>
        <p class="text-xs mt-1.5 flex flex-wrap gap-1.5">${state.server ? `<span class="px-2 py-0.5 rounded-full ${state.server.db === 'neon' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}">ฐานข้อมูล: ${state.server.db === 'neon' ? 'Neon (คลาวด์)' : 'ไฟล์ในเครื่อง'}</span><span class="px-2 py-0.5 rounded-full ${state.server.storage === 'blob' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}">ไฟล์ภาพ: ${state.server.storage === 'blob' ? 'Vercel Blob (คนนอกเห็นได้)' : 'โฟลเดอร์ในเครื่อง'}</span>` : ''}</p></div>
      ${state.user.role === 'admin' ? '<a href="#/settings" class="btn btn-light btn-sm">ตั้งค่าที่อยู่</a>' : ''}
    </div>
    <div class="grid md:grid-cols-2 gap-3 mt-4">
      ${[['หน้าเว็บไซต์', ORIGIN + '/'], ['ระบบหลังบ้าน', ORIGIN + '/admin']].map(([t, u]) => `<div class="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200"><span class="text-xs text-slate-500 w-24 flex-none">${t}</span><span class="font-mono text-sm flex-1 truncate">${esc(u)}</span><button class="btn btn-light btn-sm" data-cpu="${esc(u)}">${icon('copy', 'w-3.5 h-3.5')}</button></div>`).join('')}
    </div>
    ${isLocalHost(location.hostname) && !state.settings.publicUrl && state.server && state.server.urls.length > 1 ? `<p class="text-xs text-amber-700 mt-3">เครื่องนี้มีหลาย IP (${state.server.urls.map(esc).join(', ')}) — ตรวจสอบว่าเป็น IP วงเดียวกับเครื่องลูกข่าย หรือกำหนดเองที่หน้าตั้งค่า</p>` : ''}
  </div>
  <div class="grid lg:grid-cols-3 gap-4 mt-4">
    <div class="card p-5 lg:col-span-2">
      <h3 class="font-semibold text-slate-900 mb-4">แก้ไขล่าสุด</h3>
      <div class="divide-y divide-slate-100">${s.recent.map(r => `<a href="#/${r.kind === 'widget' ? 'widgets' : 'pages'}/${r.id}" class="flex items-center gap-3 py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg">
        <span class="w-9 h-9 rounded-lg grid place-items-center ${r.kind === 'widget' ? 'bg-navy-50 text-navy-700' : 'bg-amber-50 text-gold-600'}">${icon(r.kind === 'widget' ? 'widget' : 'page')}</span>
        <span class="flex-1 min-w-0"><span class="block font-medium truncate">${esc(r.name)}</span><span class="block text-xs text-slate-500">${r.kind === 'widget' ? 'ส่วนแสดงผล' : 'หน้าเว็บ'} · ${fmtDate(r.updatedAt)}</span></span>${icon('back', 'w-4 h-4 rotate-180 text-slate-300')}</a>`).join('') || '<p class="text-slate-400 text-sm">ยังไม่มีข้อมูล</p>'}</div>
    </div>
    <div class="card p-5">
      <h3 class="font-semibold text-slate-900 mb-3">เริ่มต้นใช้งาน</h3>
      <ol class="space-y-3 text-sm text-slate-600">
        <li class="flex gap-3"><span class="w-6 h-6 rounded-full bg-navy-800 text-white text-xs grid place-items-center flex-none">1</span>สร้าง “ส่วนแสดงผล” แล้วเลือกรูปแบบ (กริด / สไลด์ / รายการลิงก์)</li>
        <li class="flex gap-3"><span class="w-6 h-6 rounded-full bg-navy-800 text-white text-xs grid place-items-center flex-none">2</span>เพิ่มภาพ วีดีโอ ปุ่มลิงก์ และกำหนดวันเริ่ม–สิ้นสุดการแสดงได้</li>
        <li class="flex gap-3"><span class="w-6 h-6 rounded-full bg-navy-800 text-white text-xs grid place-items-center flex-none">3</span>กด “โค้ดฝัง” คัดลอก &lt;iframe&gt; ไปวางในเว็บไซต์หลัก</li>
        <li class="flex gap-3"><span class="w-6 h-6 rounded-full bg-gold-500 text-white text-xs grid place-items-center flex-none">4</span>สร้าง “หน้าเว็บเผยแพร่” สำหรับข้อมูลเพิ่มเติม / ดูทั้งหมด</li>
      </ol>
      <a href="#/widgets" class="btn btn-primary w-full mt-5">${icon('plus')} จัดการส่วนแสดงผล</a>
    </div>
  </div>`;
  $$('[data-cpu]').forEach(b => b.onclick = () => copyText(b.dataset.cpu));
}

/* ================================================================
 * Widgets list
 * ================================================================ */
const LAYOUT_NAME = { grid: 'กริด', carousel: 'สไลด์', list: 'รายการลิงก์', canvas: 'ผืนผ้าใบ', tabs: 'แท็บ (รวมหลายส่วน)' };
async function viewWidgets() {
  const list = await api('GET', '/widgets');
  $('#view').innerHTML = `${pageHead('ส่วนแสดงผล (iframe)', 'แต่ละส่วนมีลิงก์แยก นำไปฝังในเว็บไซต์ด้วย &lt;iframe&gt; ได้', `<button class="btn btn-light" id="demoW">${icon('widget')} เพิ่มชุดตัวอย่าง</button><button class="btn btn-primary" id="newW">${icon('plus')} สร้างส่วนแสดงผล</button>`)}
  <div class="card mb-4 p-3 flex items-center gap-2">${icon('search', 'w-4 h-4 text-slate-400 ml-1')}<input id="q" class="flex-1 outline-none text-sm py-1" placeholder="ค้นหาชื่อ หรือ slug..."></div>
  <div id="wl" class="grid md:grid-cols-2 2xl:grid-cols-3 gap-4"></div>`;
  const draw = q => {
    const f = list.filter(w => !q || (w.name + w.slug).toLowerCase().includes(q.toLowerCase()));
    $('#wl').innerHTML = f.map(w => `
    <div class="card overflow-hidden flex flex-col">
      <div class="h-40 bg-slate-50 border-b border-slate-200 overflow-hidden relative">
        <iframe src="/embed/${esc(w.slug)}" class="absolute top-0 left-0 border-0 pointer-events-none origin-top-left" style="width:250%;height:250%;transform:scale(.4)" loading="lazy" tabindex="-1"></iframe>
        <a href="#/widgets/${w.id}" class="absolute inset-0"></a>
      </div>
      <div class="p-4 flex-1 flex flex-col">
        <div class="flex items-start justify-between gap-2">
          <a href="#/widgets/${w.id}" class="font-semibold text-slate-900 hover:text-navy-700">${esc(w.name)}</a>
          <span class="text-xs px-2 py-0.5 rounded-full bg-navy-50 text-navy-700 whitespace-nowrap">${LAYOUT_NAME[w.layout]}</span>
        </div>
        <div class="text-xs text-slate-500 mt-1 font-mono">/embed/${esc(w.slug)}</div>
        <div class="text-sm text-slate-500 mt-2 flex-1">${esc(w.description) || '&nbsp;'}</div>
        <div class="flex items-center gap-3 text-xs text-slate-500 mt-3">
          <span class="inline-flex items-center gap-1">${icon('eye', 'w-3.5 h-3.5')} แสดง ${w.activeCount}/${w.itemCount}${w.limit ? ` (จำกัด ${w.limit})` : ''}</span>
          <span class="inline-flex items-center gap-1">${icon('clock', 'w-3.5 h-3.5')} ${fmtDate(w.updatedAt)}</span>
        </div>
        <div class="flex gap-1.5 mt-4 pt-3 border-t border-slate-100">
          <a href="#/widgets/${w.id}" class="btn btn-primary btn-sm flex-1">${icon('edit', 'w-3.5 h-3.5')} แก้ไข</a>
          <button class="btn btn-light btn-sm" data-embed="${w.id}" title="โค้ดฝัง iframe">${icon('code', 'w-3.5 h-3.5')} iframe</button>
          <button class="btn btn-light btn-sm" data-export="${w.id}" title="ส่งออก HTML + CSS">${icon('html', 'w-3.5 h-3.5')} HTML</button>
          <a class="btn btn-light btn-sm" href="/embed/${esc(w.slug)}" target="_blank" title="เปิดดู">${icon('ext', 'w-3.5 h-3.5')}</a>
          <button class="btn btn-light btn-sm" data-dup="${w.id}" title="ทำสำเนา">${icon('copy', 'w-3.5 h-3.5')}</button>
          <button class="btn btn-danger btn-sm" data-del="${w.id}" title="ลบ">${icon('trash', 'w-3.5 h-3.5')}</button>
        </div>
      </div>
    </div>`).join('') || `<div class="col-span-full card p-12 text-center text-slate-500">ยังไม่มีส่วนแสดงผล</div>`;
    $$('[data-embed]').forEach(b => b.onclick = () => showEmbed(list.find(w => w.id === b.dataset.embed)));
    $$('[data-export]').forEach(b => b.onclick = () => showExport(list.find(w => w.id === b.dataset.export)));
    $$('[data-dup]').forEach(b => b.onclick = async () => { const c = await api('POST', `/widgets/${b.dataset.dup}/duplicate`); ok('ทำสำเนาแล้ว'); location.hash = `#/widgets/${c.id}`; });
    $$('[data-del]').forEach(b => b.onclick = async () => {
      const w = list.find(x => x.id === b.dataset.del);
      if (!(await confirmBox('ลบส่วนแสดงผล?', `"${w.name}" จะถูกลบ และ iframe ที่ฝังไว้จะไม่แสดงผลอีก`, 'ลบ'))) return;
      await api('DELETE', `/widgets/${w.id}`); ok('ลบแล้ว'); viewWidgets();
    });
  };
  draw('');
  $('#q').oninput = e => draw(e.target.value);
  $('#demoW').onclick = async () => {
    if (!(await confirmBox('เพิ่มชุดตัวอย่าง?', 'จะเพิ่มส่วนแสดงผลตัวอย่าง 7 ชิ้น (ปุ่มโลโก้ระบบออนไลน์, แท็บบริการประชาชน/วิชาการ, QR Code, Infographics) และหน้า “ตัวอย่างหน้าบริการ” — ข้อมูลเดิมไม่เปลี่ยน', 'เพิ่ม', false))) return;
    try { const r = await api('POST', '/demo'); ok('เพิ่มชุดตัวอย่างแล้ว'); viewWidgets(); window.open(`/p/${r.page}`, '_blank'); } catch (e) { fail(e.message); }
  };
  $('#newW').onclick = async () => {
    const r = await Swal.fire({
      title: 'สร้างส่วนแสดงผลใหม่', confirmButtonText: 'สร้าง', cancelButtonText: 'ยกเลิก', showCancelButton: true, reverseButtons: true,
      html: `<div class="text-left space-y-3">
        <div><label class="lbl">ชื่อ (ใช้ภายในหลังบ้าน)</label><input id="sw-name" class="inp" placeholder="เช่น แบนเนอร์หน้าแรก"></div>
        <div><label class="lbl">Slug สำหรับลิงก์ (a-z, 0-9, -)</label><input id="sw-slug" class="inp font-mono" placeholder="เช่น home-banner"></div>
        <div><label class="lbl">รูปแบบเริ่มต้น</label><select id="sw-layout" class="inp"><option value="carousel">สไลด์ (Carousel)</option><option value="grid">กริด (Grid)</option><option value="list">รายการลิงก์ (List)</option><option value="canvas">ผืนผ้าใบอิสระ — ลากวางปุ่มบนตาราง (Canvas)</option><option value="tabs">แท็บ — รวมหลายส่วนแสดงผล จัดคอลัมน์ได้ (Tabs)</option></select></div></div>`,
      preConfirm: () => {
        const name = $('#sw-name').value.trim(), slug = $('#sw-slug').value.trim();
        if (!name) return Swal.showValidationMessage('กรุณากรอกชื่อ');
        if (slug && !/^[a-z0-9-_]+$/i.test(slug)) return Swal.showValidationMessage('slug ใช้ได้เฉพาะ a-z 0-9 - _');
        return { name, slug, layout: $('#sw-layout').value, title: name };
      },
    });
    if (!r.isConfirmed) return;
    const d = r.value;
    if (d.layout === 'carousel') Object.assign(d, { columns: 1, ratio: '16/9', captionPos: 'overlay' });
    if (d.layout === 'list') Object.assign(d, { columns: 1, ratio: 'auto', shadow: false });
    if (d.layout === 'grid') Object.assign(d, { columns: 3, mobileColumns: 2, ratio: '4/3' });
    if (d.layout === 'canvas') Object.assign(d, { canvasW: 1200, canvasH: 400, gridSize: 20, stackMobile: true, shadow: false });
    if (d.layout === 'tabs') Object.assign(d, { showTitle: false, bg: 'transparent', gap: 20, tabs: [{ label: 'แท็บที่ 1', activeBg: '#1e3a5f', activeFg: '#ffffff', blocks: [] }, { label: 'แท็บที่ 2', activeBg: '#b8862b', activeFg: '#ffffff', blocks: [] }] });
    try { const w = await api('POST', '/widgets', d); ok('สร้างแล้ว'); location.hash = `#/widgets/${w.id}`; } catch (e) { fail(e.message); }
  };
}

function embedCodes(w) {
  const src = `${ORIGIN}/embed/${w.slug}`;
  return {
    url: src,
    auto: `<iframe src="${src}" data-uw-embed title="${w.name.replace(/"/g, '&quot;')}" style="width:100%;border:0;display:block" height="420" loading="lazy"></iframe>\n<script src="${ORIGIN}/assets/embed.js" async></script>`,
    fixed: `<iframe src="${src}" title="${w.name.replace(/"/g, '&quot;')}" width="100%" height="420" style="border:0;display:block" loading="lazy"></iframe>`,
    full: `${src}?full=1`,
  };
}
/* ---------------- ส่งออกโค้ด HTML + CSS (ไม่ใช้ iframe) ---------------- */
function showExport(w) {
  const cloudFiles = !!(state.server && state.server.storage === 'blob');
  let res = null, full = false, font = true, inline = !cloudFiles, pvW = '100%';
  openModal({
    title: `ส่งออกโค้ด HTML + CSS — ${esc(w.name)}`, size: 'max-w-6xl',
    footer: `<span class="mr-auto text-xs text-slate-500" data-size></span>
      <button class="btn btn-light" data-dl>${icon('down')} ดาวน์โหลดไฟล์ทดสอบ (.html)</button>
      <button class="btn btn-primary" data-cp>${icon('copy')} คัดลอกโค้ด</button>`,
    body: `<div class="grid lg:grid-cols-2 gap-5">
      <div class="space-y-3 min-w-0">
        <div class="p-3 rounded-xl bg-navy-50 border border-navy-100 text-sm text-slate-700 leading-relaxed">
          คัดลอกโค้ดไปวางในหน้าเว็บที่ต้องการได้เลย (เช่น โหมด HTML / Source ของช่องแก้ไขเนื้อหา) ไม่ต้องใช้ iframe ·
          CSS ถูกจำกัดให้มีผลเฉพาะส่วนนี้ ไม่กระทบหน้าตาส่วนอื่นของเว็บ · ขนาดจะปรับตามความกว้างของช่องที่วาง
        </div>
        <div class="flex flex-wrap gap-x-5 gap-y-2">
          ${w.limit && w.layout !== 'canvas' ? `<label class="flex items-center gap-2 text-sm"><input type="checkbox" class="tgl" data-o="full"> แสดงทั้งหมด (ไม่จำกัด ${w.limit} รายการ)</label>` : ''}
          <label class="flex items-center gap-2 text-sm"><input type="checkbox" class="tgl" data-o="inline" ${inline ? 'checked' : ''}> ${cloudFiles ? 'ฝังภาพไว้ในโค้ด (ไม่จำเป็น — ภาพอยู่บน Vercel Blob ซึ่งคนนอกเปิดได้อยู่แล้ว โค้ดจะสั้นกว่าถ้าไม่ฝัง)' : 'ฝังภาพไว้ในโค้ด (แนะนำ — ไม่ขึ้นหน้าต่างขอสิทธิ์เครือข่ายภายใน)'}</label>
          <label class="flex items-center gap-2 text-sm"><input type="checkbox" class="tgl" data-o="font" checked> รวมฟอนต์ Sarabun</label>
        </div>
        <div data-warn></div>
        <textarea readonly class="inp font-mono text-[11px] leading-snug !bg-slate-50" rows="16" data-code>กำลังสร้างโค้ด...</textarea>
        <div class="text-xs text-slate-500 space-y-1">
          <div>• โค้ดนี้เป็น <b>สำเนา ณ ตอนนี้</b> — หากแก้ไขในระบบหลังบ้าน ต้องกดส่งออกและวางใหม่ (ถ้าต้องการให้อัปเดตเองอัตโนมัติ ให้ใช้ “โค้ดฝัง” แบบ iframe)</div>
          <div>• ถ้าปิด “ฝังภาพไว้ในโค้ด” ภาพจะโหลดจาก <span class="font-mono">${esc(ORIGIN)}</span> — ถ้าเป็น IP ภายใน บุคคลภายนอกจะมองไม่เห็นภาพ และ Chrome จะถามสิทธิ์เข้าถึงเครือข่ายภายใน</div>
          <div>• ควรวางในกล่องที่มีความกว้าง (เช่น div ปกติ) — ถ้าวางในกล่อง flex ที่ไม่กำหนดความกว้าง ส่วนนี้อาจหดเล็กลง</div>
        </div>
      </div>
      <div class="min-w-0">
        <div class="flex items-center justify-between mb-2"><div class="text-sm font-semibold text-slate-700">ทดลองวางในหน้าเว็บจำลอง</div>
          <div class="seg !w-auto">${[['100%', 'เต็ม'], ['720px', 'คอลัมน์กลาง'], ['360px', 'แถบข้าง/มือถือ']].map(([v, t]) => `<button data-pw="${v}" class="!px-2.5 text-xs">${t}</button>`).join('')}</div></div>
        <iframe data-pv class="w-full h-[520px] rounded-xl border border-slate-200 bg-white" sandbox="allow-scripts allow-popups"></iframe>
      </div></div>`,
    onMount: async (el) => {
      const mock = code => `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
        <style>body{margin:0;font-family:Tahoma,sans-serif;background:#eef1f5;color:#333}header{background:#5a2d0c;color:#fff;padding:14px 20px;font-weight:bold}
        .wrap{max-width:1100px;margin:16px auto;padding:0 12px}.box{width:${pvW};max-width:100%;margin:0 auto;background:#fff;padding:12px;border:1px dashed #b6bfcc}
        p{font-size:13px;color:#777}a{color:#c00}img{max-width:100%}</style></head>
        <body><header>เว็บไซต์ปลายทาง (จำลอง)</header><div class="wrap"><p>ข้อความเดิมของเว็บไซต์ ... (กรอบประคือช่องที่นำโค้ดไปวาง)</p><div class="box">${code}</div><p>เนื้อหาส่วนอื่นของเว็บไซต์ ...</p></div></body></html>`;
      const load = async () => {
        try { res = await api('POST', `/widgets/${w.id}/export`, { base: ORIGIN, full, font, inline }); }
        catch (e) { $('[data-code]', el).value = e.message; return; }
        $('[data-code]', el).value = res.code;
        $('[data-size]', el).textContent = `ขนาด ${fmtSize(res.bytes)}`;
        $('[data-warn]', el).innerHTML = res.warnings.map(t => `<div class="text-xs p-2.5 mb-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">⚠ ${esc(t)}</div>`).join('');
        $('[data-pv]', el).srcdoc = mock(res.code);
        $$('[data-pw]', el).forEach(b => b.classList.toggle('on', b.dataset.pw === pvW));
      };
      $$('[data-o]', el).forEach(c => c.onchange = () => { if (c.dataset.o === 'full') full = c.checked; else if (c.dataset.o === 'inline') inline = c.checked; else font = c.checked; load(); });
      $$('[data-pw]', el).forEach(b => b.onclick = () => { pvW = b.dataset.pw; if (res) { $('[data-pv]', el).srcdoc = mock(res.code); $$('[data-pw]', el).forEach(x => x.classList.toggle('on', x.dataset.pw === pvW)); } });
      $('[data-cp]', el).onclick = () => res && copyText(res.code);
      $('[data-dl]', el).onclick = () => {
        if (!res) return;
        const page = `<!DOCTYPE html>\n<html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${w.name}</title></head>\n<body>\n${res.code}\n</body></html>`;
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([page], { type: 'text/html' })); a.download = `${w.slug}.html`; a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      };
      load();
    },
  });
}
function showEmbed(w) {
  const c = embedCodes(w);
  const box = (label, val, hint) => `<div><div class="flex items-center justify-between mb-1.5"><label class="lbl !mb-0">${label}</label><button class="btn btn-light btn-sm" data-cp="${esc(val)}">${icon('copy', 'w-3.5 h-3.5')} คัดลอก</button></div>
    <textarea readonly class="inp font-mono text-xs !bg-slate-50" rows="${val.split('\n').length + (val.length > 120 ? 2 : 0)}">${esc(val)}</textarea>${hint ? `<p class="text-xs text-slate-500 mt-1">${hint}</p>` : ''}</div>`;
  openModal({
    title: `โค้ดฝัง — ${esc(w.name)}`, size: 'max-w-2xl',
    body: `<div class="space-y-5">
      ${box('ลิงก์ส่วนแสดงผล', c.url)}
      ${box('แบบปรับความสูงอัตโนมัติ (แนะนำ)', c.auto, 'iframe จะยืด–หดตามเนื้อหาเอง ไม่มีแถบเลื่อน')}
      ${box('แบบกำหนดความสูงตายตัว', c.fixed, 'ใช้เมื่อเว็บไซต์ปลายทางไม่อนุญาตให้ใส่ &lt;script&gt; — ปรับค่า height ตามต้องการ')}
      ${box('ลิงก์แสดงรายการทั้งหมด (ไม่จำกัดจำนวน)', c.full)}
    </div>`,
    onMount: el => $$('[data-cp]', el).forEach(b => b.onclick = () => copyText(b.dataset.cp)),
  });
}

/* ================================================================
 * Font Awesome icon picker
 * ================================================================ */
const FA_ICONS = {
  solid: 'house house-chimney building building-columns landmark city scale-balanced scale-unbalanced gavel book book-open book-bookmark bookmark newspaper bullhorn bell bell-concierge file file-lines file-pdf file-word file-excel file-powerpoint file-image file-video file-contract file-signature file-invoice file-circle-check file-shield file-export file-import folder folder-open folder-tree box-archive inbox paperclip clipboard clipboard-list clipboard-check list list-check list-ol table table-list calendar calendar-days calendar-check calendar-plus calendar-week clock hourglass-half stopwatch phone phone-volume square-phone mobile-screen fax envelope envelope-open-text at paper-plane comments comment comment-dots message headset microphone location-dot location-arrow map map-location-dot compass route globe earth-asia link arrow-right arrow-left arrow-up arrow-down arrow-up-right-from-square arrow-right-to-bracket arrow-right-from-bracket angles-right chevron-right caret-right circle-arrow-right hand-point-right download upload print magnifying-glass filter sliders gear gears screwdriver-wrench wrench circle-info circle-question circle-check circle-xmark circle-exclamation triangle-exclamation info question exclamation check xmark plus minus ban shield-halved lock lock-open key fingerprint user users user-tie user-shield user-check user-plus user-group people-group person person-chalkboard children baby wheelchair universal-access hands-holding hand-holding-heart handshake heart star award medal trophy certificate graduation-cap school chalkboard-user lightbulb rocket bolt fire leaf tree sun moon cloud cloud-arrow-down droplet umbrella briefcase id-card id-badge address-card address-book money-bill coins wallet receipt credit-card cart-shopping store truck car bus taxi motorcycle plane hospital house-medical kit-medical stethoscope pills laptop desktop computer tv display server database wifi qrcode barcode camera image images photo-film film video circle-play play podcast rss share-nodes thumbs-up face-smile pen pen-to-square pen-nib signature stamp scroll quote-left tags tag ticket thumbtack calculator chart-bar chart-pie chart-line chart-simple sitemap diagram-project cubes puzzle-piece wand-magic-sparkles flag flag-checkered utensils mug-hot place-of-worship vihara church mosque hands-praying person-walking person-running gift cake-candles music volume-high language bars ellipsis grip eye eye-slash rotate arrows-rotate power-off right-from-bracket circle-dot star-of-life fire-extinguisher dumbbell futbol hand',
  regular: 'file file-lines file-pdf file-word file-excel folder folder-open calendar calendar-days calendar-check clock envelope envelope-open bell bookmark comment comments user address-card id-card image images star heart thumbs-up hand-point-right circle-check circle-question circle-xmark face-smile lightbulb newspaper paper-plane copy clipboard building map eye pen-to-square square-check flag',
  brands: 'facebook facebook-f facebook-messenger line youtube x-twitter instagram tiktok google google-drive microsoft windows android apple chrome edge firefox github telegram whatsapp linkedin wordpress dropbox slack discord',
};
const FA_TH = {
  house: 'บ้าน หน้าแรก', 'building-columns': 'ศาล ราชการ อาคาร', landmark: 'ศาล ราชการ', 'scale-balanced': 'ตาชั่ง ยุติธรรม กฎหมาย ศาล', gavel: 'ค้อน ศาล ผู้พิพากษา พิจารณาคดี',
  book: 'หนังสือ', newspaper: 'ข่าว', bullhorn: 'ประกาศ ประชาสัมพันธ์ โทรโข่ง', bell: 'แจ้งเตือน', file: 'ไฟล์ เอกสาร', 'file-lines': 'เอกสาร', 'file-pdf': 'pdf เอกสาร',
  'file-contract': 'สัญญา จัดซื้อ จัดจ้าง', 'file-signature': 'ลงนาม คำร้อง', folder: 'แฟ้ม', calendar: 'ปฏิทิน วันนัด', 'calendar-check': 'นัดความ วันนัด ตรวจสอบ', 'calendar-days': 'ปฏิทิน',
  clock: 'เวลา', phone: 'โทรศัพท์ ติดต่อ', envelope: 'อีเมล จดหมาย', 'location-dot': 'แผนที่ ที่ตั้ง', map: 'แผนที่', globe: 'เว็บไซต์ อินเทอร์เน็ต', link: 'ลิงก์',
  download: 'ดาวน์โหลด', upload: 'อัปโหลด', print: 'พิมพ์', 'magnifying-glass': 'ค้นหา', gear: 'ตั้งค่า', 'circle-info': 'ข้อมูล', 'circle-question': 'คำถาม ช่วยเหลือ',
  user: 'ผู้ใช้ บุคคล', users: 'บุคลากร กลุ่ม', 'user-tie': 'ผู้บริหาร', 'people-group': 'ประชาชน ทีม', handshake: 'ไกล่เกลี่ย ตกลง ความร่วมมือ', briefcase: 'งาน สมัครงาน',
  'id-card': 'บัตร', 'money-bill': 'เงิน ค่าธรรมเนียม', coins: 'เงิน', receipt: 'ใบเสร็จ', laptop: 'คอมพิวเตอร์ ออนไลน์ e-filing', video: 'วีดีโอ ออนไลน์ ประชุม', 'circle-play': 'เล่น วีดีโอ',
  image: 'ภาพ', images: 'อัลบั้ม ภาพ', camera: 'กล้อง', 'chart-bar': 'สถิติ', 'chart-pie': 'สถิติ', award: 'รางวัล', medal: 'เหรียญ', star: 'ดาว', heart: 'หัวใจ', 'shield-halved': 'ความปลอดภัย',
  lock: 'ล็อก', key: 'กุญแจ', comments: 'แชท ความคิดเห็น', headset: 'call center ติดต่อ', 'graduation-cap': 'การศึกษา', school: 'โรงเรียน', 'hand-holding-heart': 'ช่วยเหลือ บริการ',
  wheelchair: 'ผู้พิการ', 'universal-access': 'การเข้าถึง', qrcode: 'คิวอาร์', line: 'ไลน์', facebook: 'เฟซบุ๊ก', youtube: 'ยูทูบ', 'arrow-right': 'ลูกศร ถัดไป', 'paper-plane': 'ส่ง',
};
function pickIcon(current = '') {
  return new Promise(resolve => {
    let style = /fa-brands/.test(current) ? 'brands' : /fa-regular/.test(current) ? 'regular' : 'solid', result = null;
    openModal({
      title: 'เลือกไอคอน (Font Awesome)', size: 'max-w-4xl', onClose: () => resolve(result),
      footer: `<div class="flex-1 flex items-center gap-2"><input class="inp font-mono text-xs !w-72" data-custom placeholder="หรือพิมพ์ class เอง เช่น fa-solid fa-gavel" value="${esc(current)}"><button class="btn btn-light btn-sm" data-usecustom>ใช้ class นี้</button></div>
        <button class="btn btn-light" data-none>ไม่ใช้ไอคอน</button><button class="btn btn-light" data-close>ยกเลิก</button>`,
      body: `<div class="flex flex-col sm:flex-row gap-3 mb-4"><div class="seg sm:!w-72" data-st>${[['solid', 'Solid'], ['regular', 'Regular'], ['brands', 'Brands']].map(([k, t]) => `<button data-sty="${k}">${t}</button>`).join('')}</div>
        <div class="flex-1 flex items-center gap-2 border border-slate-300 rounded-lg px-3">${icon('search', 'w-4 h-4 text-slate-400')}<input class="flex-1 py-2 outline-none text-sm" data-q placeholder="ค้นหา เช่น gavel, ศาล, ประกาศ, ปฏิทิน..." autofocus></div></div>
        <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2" data-grid></div>
        <p class="text-xs text-slate-500 mt-4">ดูไอคอนทั้งหมดได้ที่ <a href="https://fontawesome.com/search?o=r&m=free" target="_blank" class="underline">fontawesome.com</a> (เลือกเฉพาะแบบ Free) แล้วคัดลอก class มาวางช่องด้านล่าง</p>`,
      onMount: (el, close) => {
        const done = v => { result = v; close(); };
        const draw = () => {
          $$('[data-sty]', el).forEach(b => b.classList.toggle('on', b.dataset.sty === style));
          const q = $('[data-q]', el).value.trim().toLowerCase();
          const names = FA_ICONS[style].split(' ').filter(n => !q || n.includes(q) || (FA_TH[n] || '').includes(q));
          $('[data-grid]', el).innerHTML = names.map(n => {
            const cls = `fa-${style} fa-${n}`;
            return `<button class="flex flex-col items-center gap-1.5 p-3 rounded-xl border ${cls === current ? 'border-navy-700 bg-navy-50' : 'border-slate-200'} hover:border-navy-500 hover:bg-navy-50 text-slate-700" data-ic="${cls}" title="${n}${FA_TH[n] ? ' — ' + FA_TH[n] : ''}">
              <i class="${cls} text-xl"></i><span class="text-[10px] text-slate-500 truncate w-full text-center">${n}</span></button>`;
          }).join('') || '<div class="col-span-full text-center text-slate-400 py-8">ไม่พบไอคอน — ลองใช้คำภาษาอังกฤษ หรือพิมพ์ class เองด้านล่าง</div>';
          $$('[data-ic]', el).forEach(b => b.onclick = () => done(b.dataset.ic));
        };
        $$('[data-sty]', el).forEach(b => b.onclick = () => { style = b.dataset.sty; draw(); });
        $('[data-q]', el).oninput = draw;
        $('[data-none]', el).onclick = () => done('');
        $('[data-usecustom]', el).onclick = () => { const v = $('[data-custom]', el).value.trim(); if (/^[a-z0-9\- ]{3,80}$/i.test(v)) done(v); else Toast.fire({ icon: 'warning', title: 'class ไม่ถูกต้อง' }); };
        draw();
      },
    });
  });
}

/* ================================================================
 * Button designer (ออกแบบปุ่ม)
 * ================================================================ */
async function loadMyPresets() { try { return await api('GET', '/button-presets'); } catch { return []; } }
/**
 * it: { title, subtitle, iconFa, style } — แก้ไขค่าใน object โดยตรง
 * opts.onApplyAll(style) — ปุ่ม "ใช้สไตล์นี้กับทุกปุ่ม"
 * คืนค่า true เมื่อกดตกลง
 */
function designButton(it, opts = {}) {
  return new Promise(async resolve => {
    let st = UB.norm(clone(it.style || UB.fromLegacy(it.btnStyle, opts.accent)));
    let iconFa = it.iconFa || '', iconImg = it.iconImg || '', okd = false, pvBg = 'white';
    ensureFont(st.font, ...UB.PRESETS.map(p => p.style.font));
    let mine = await loadMyPresets();
    openModal({
      title: 'ออกแบบปุ่ม', size: 'max-w-6xl', onClose: () => resolve(okd),
      footer: `${opts.onApplyAll ? `<button class="btn btn-light mr-auto" data-all>${icon('copy')} ใช้สไตล์นี้กับทุกปุ่มในส่วนแสดงผลนี้</button>` : ''}
        <button class="btn btn-light" data-close>ยกเลิก</button><button class="btn btn-primary" data-ok>${icon('save')} ใช้รูปแบบนี้</button>`,
      body: `<div class="grid lg:grid-cols-[1fr_380px] gap-6">
        <div data-ctrl class="space-y-5 min-w-0"></div>
        <div class="lg:sticky lg:top-0 self-start space-y-3">
          <div class="flex items-center justify-between"><div class="text-sm font-semibold text-slate-700">ตัวอย่าง <span class="font-normal text-xs text-slate-400">(ลองเอาเมาส์ชี้ / ลากมุมขวาล่างเพื่อปรับขนาด)</span></div>
            <div class="seg !w-auto" data-pvbg>${[['white', 'ขาว'], ['gray', 'เทา'], ['dark', 'เข้ม']].map(([k, t]) => `<button data-b="${k}" class="!px-2 !py-1 text-xs">${t}</button>`).join('')}</div></div>
          <div data-stage class="rounded-xl border border-slate-200 p-8 grid place-items-center min-h-[260px] transition-colors">
            <div data-box style="width:260px;height:${st.iconPos === 'top' ? 140 : 64}px;resize:both;overflow:visible;min-width:40px;min-height:30px;max-width:340px;max-height:300px" class="relative"></div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <input class="inp text-sm" data-t="title" value="${esc(it.title || '')}" placeholder="ข้อความบนปุ่ม">
            <input class="inp text-sm" data-t="subtitle" value="${esc(it.subtitle || '')}" placeholder="ข้อความรอง">
          </div>
          <button class="btn btn-light w-full" data-savemine>${icon('save')} บันทึกเป็น “สไตล์ของฉัน” เพื่อนำไปใช้ซ้ำ</button>
        </div></div>`,
      onMount: (el, close) => {
        const C = $('[data-ctrl]', el);
        const preview = () => {
          $('[data-box]', el).innerHTML = UB.buttonHtml({ title: it.title || 'ตัวอย่างปุ่ม', subtitle: it.subtitle, iconFa, iconImg, style: st }, { tag: 'div' });
          const bg = { white: '#ffffff', gray: '#f1f5f9', dark: '#0f172a' }[pvBg];
          $('[data-stage]', el).style.background = bg;
          $$('[data-pvbg] button', el).forEach(b => b.classList.toggle('on', b.dataset.b === pvBg));
        };
        const mini = (style, ic, label) => UB.buttonHtml({ title: label, iconFa: ic, style: { ...UB.norm(style), fontSize: 13, iconSize: style.iconPos === 'top' ? 16 : 14, padX: 10, padY: 6, iconPos: style.iconPos === 'top' ? 'left' : style.iconPos } }, { tag: 'div' });
        const colorRow = (k, label, allowNone) => `<div><label class="lbl">${label}</label><div class="flex gap-2 items-center">
          <input type="color" class="h-9 w-11 rounded border border-slate-300 cursor-pointer flex-none" data-s="${k}" value="${/^#[0-9a-f]{6}$/i.test(st[k]) ? st[k] : '#ffffff'}">
          <input class="inp font-mono text-xs" data-sx="${k}" value="${esc(st[k])}" placeholder="${allowNone ? 'ไม่กำหนด' : ''}">
          ${allowNone ? `<button class="btn btn-light btn-sm" data-clear="${k}" title="ล้าง">${icon('x', 'w-3.5 h-3.5')}</button>` : ''}</div></div>`;
        const range = (k, label, min, max, unit = 'px') => `<div><div class="flex justify-between"><label class="lbl">${label}</label><span class="text-xs text-slate-500"><span data-o="${k}">${st[k]}</span>${unit}</span></div><input type="range" class="w-full accent-navy-800" min="${min}" max="${max}" data-s="${k}" value="${Math.min(st[k], max)}"></div>`;
        const seg = (k, list) => `<div class="seg flex-wrap">${list.map(([v, t]) => `<button data-sg="${k}" data-v="${v}" class="${String(st[k]) === String(v) ? 'on' : ''}">${t}</button>`).join('')}</div>`;
        const H = t => `<div class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">${t}</div>`;
        const draw = () => {
          C.innerHTML = `
          <div>${H('สไตล์สำเร็จรูป')}
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">${UB.PRESETS.map(p => `<button data-pre="${p.id}" class="h-11 rounded-lg p-1 hover:ring-2 hover:ring-navy-300 ${p.style.bg === 'transparent' || p.style.bg === '#ffffff' ? 'bg-slate-50' : ''}">${mini(p.style, iconFa || 'fa-solid fa-star', p.name)}</button>`).join('')}</div>
            ${mine.length ? `<div class="text-xs font-semibold text-slate-500 mt-3 mb-2">สไตล์ของฉัน</div><div class="grid grid-cols-2 sm:grid-cols-4 gap-2">${mine.map(p => `<div class="relative group"><button data-my="${p.id}" class="w-full h-11 rounded-lg p-1 bg-slate-50 hover:ring-2 hover:ring-navy-300">${mini(p.style, p.iconFa || iconFa || 'fa-solid fa-star', p.name)}</button>
              <button data-mydel="${p.id}" class="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-600 text-white text-xs hidden group-hover:grid place-items-center">×</button></div>`).join('')}</div>` : ''}
          </div>
          <div class="grid sm:grid-cols-2 gap-5">
            <div class="space-y-3">${H('ไอคอน')}
              <div class="flex items-center gap-3"><span class="w-16 h-16 rounded-xl border border-slate-200 grid place-items-center text-2xl text-navy-800 bg-slate-50 overflow-hidden p-1">${iconImg ? `<img src="${esc(iconImg)}" class="max-w-full max-h-full object-contain">` : iconFa ? `<i class="${esc(iconFa)}"></i>` : '<span class="text-xs text-slate-400">ไม่มี</span>'}</span>
                <div class="flex-1 grid grid-cols-2 gap-1.5"><button class="btn btn-primary btn-sm" data-pickicon>${icon('search', 'w-3.5 h-3.5')} ไอคอน</button><button class="btn btn-light btn-sm" data-pickimg>${icon('image', 'w-3.5 h-3.5')} ภาพ / โลโก้</button>
                ${iconFa || iconImg ? `<button class="btn btn-light btn-sm col-span-2" data-noicon>ไม่ใช้ไอคอน</button>` : ''}</div></div>
              <div><label class="lbl">ตำแหน่งไอคอน</label>${seg('iconPos', Object.entries(UB.LABEL.iconPos))}</div>
              ${range('iconSize', iconImg ? 'ความสูงภาพ / โลโก้' : 'ขนาดไอคอน', 10, 140)}
              ${colorRow('iconColor', 'สีไอคอน (ว่าง = ตามสีตัวอักษร)', true)}
            </div>
            <div class="space-y-3">${H('ตัวอักษร')}
              <div><label class="lbl">ฟอนต์</label><select class="inp" data-s="font">${UB.FONTS.map(([v, l]) => `<option value="${v}" ${st.font === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
              ${colorRow('color', 'สีตัวอักษร')}
              ${range('fontSize', 'ขนาดตัวอักษร', 10, 48)}
              <div><label class="lbl">ความหนา</label>${seg('fontWeight', [[400, 'ปกติ'], [500, 'กลาง'], [600, 'หนา'], [700, 'หนามาก']])}</div>
              <div><label class="lbl">การจัดวาง</label>${seg('align', [['center', 'กึ่งกลาง'], ['left', 'ชิดซ้าย']])}</div>
            </div>
            <div class="space-y-3">${H('พื้นหลัง')}
              ${colorRow('bg', 'สีพื้น')}
              <button class="btn btn-light btn-sm" data-transp>${st.bg === 'transparent' ? '✓ ' : ''}พื้นโปร่งใส</button>
              ${colorRow('bg2', 'ไล่สีไปยัง (ว่าง = สีเดียว)', true)}
              ${st.bg2 ? `<div><label class="lbl">ทิศทางการไล่สี</label>${seg('grad', [['90deg', '→'], ['180deg', '↓'], ['135deg', '↘'], ['45deg', '↗']])}</div>` : ''}
            </div>
            <div class="space-y-3">${H('ขอบและมุม')}
              <div><label class="lbl">มุม</label><div class="flex flex-wrap gap-1.5">${[[0, 'เหลี่ยม'], [4, 'มนน้อย'], [10, 'มน'], [18, 'มนมาก'], [999, 'แคปซูล']].map(([v, t]) => `<button class="px-2.5 py-1 text-xs border ${st.radius === v ? 'border-navy-700 bg-navy-50 text-navy-800' : 'border-slate-300'}" style="border-radius:${Math.min(v, 14)}px" data-rad="${v}">${t}</button>`).join('')}</div></div>
              ${st.radius < 999 ? range('radius', 'ความมนของมุม', 0, 60) : ''}
              ${range('borderW', 'ความหนาเส้นขอบ', 0, 8)}
              ${st.borderW ? colorRow('borderC', 'สีเส้นขอบ') : ''}
            </div>
          </div>
          <div class="grid sm:grid-cols-2 gap-5">
            <div class="space-y-3">${H('มิติและเงา')}
              <div><label class="lbl">มิติ</label>${seg('depth', Object.entries(UB.LABEL.depth))}</div>
              <div><label class="lbl">เงา</label>${seg('shadow', Object.entries(UB.LABEL.shadow))}</div>
            </div>
            <div class="space-y-3">${H('ระยะห่างภายใน')}
              ${range('padX', 'ซ้าย–ขวา', 0, 60)}${range('padY', 'บน–ล่าง', 0, 40)}
            </div>
          </div>
          <div>${H('เอฟเฟกต์เมื่อเอาเมาส์ชี้ (hover)')}
            <div class="grid grid-cols-3 sm:grid-cols-5 gap-2">${UB.OPT.hover.map(h => `<button data-hov="${h}" class="relative h-12 rounded-lg border ${st.hover === h ? 'border-navy-700 ring-2 ring-navy-200' : 'border-slate-200'} p-1.5 bg-slate-50">
              ${UB.buttonHtml({ title: UB.LABEL.hover[h], style: { ...st, hover: h, idle: 'none', fontSize: 12, padX: 6, padY: 4, iconPos: 'left' } }, { tag: 'div' })}</button>`).join('')}</div>
            <p class="text-xs text-slate-500 mt-2">เอาเมาส์ไปชี้ที่ตัวเลือกเพื่อดูเอฟเฟกต์ก่อนเลือกได้</p>
          </div>
          <div>${H('ภาพเคลื่อนไหวตลอดเวลา (ใช้เท่าที่จำเป็น)')}${seg('idle', Object.entries(UB.LABEL.idle))}</div>`;
          bindCtrl(); preview();
        };
        const setS = (k, v, redraw) => { st[k] = v; st = UB.norm(st); if (redraw) draw(); else preview(); };
        const bindCtrl = () => {
          $$('[data-s]', C).forEach(i => i.addEventListener('input', () => {
            const k = i.dataset.s, v = i.type === 'range' ? Number(i.value) : i.value;
            if (k === 'font') ensureFont(v);
            const o = $(`[data-o="${k}"]`, C); if (o) o.textContent = v;
            const x = $(`[data-sx="${k}"]`, C); if (x) x.value = v;
            setS(k, v, k === 'borderW' && (v === 0) !== (st.borderW === 0));
          }));
          $$('[data-sx]', C).forEach(i => i.addEventListener('change', () => { const v = i.value.trim(); if (!v || /^#[0-9a-f]{3,8}$/i.test(v) || v === 'transparent') setS(i.dataset.sx, v, true); }));
          $$('[data-clear]', C).forEach(b => b.onclick = () => setS(b.dataset.clear, '', true));
          $$('[data-sg]', C).forEach(b => b.onclick = () => setS(b.dataset.sg, isNaN(b.dataset.v) ? b.dataset.v : Number(b.dataset.v), true));
          $$('[data-rad]', C).forEach(b => b.onclick = () => setS('radius', Number(b.dataset.rad), true));
          $$('[data-hov]', C).forEach(b => b.onclick = () => setS('hover', b.dataset.hov, true));
          $('[data-transp]', C).onclick = () => setS('bg', st.bg === 'transparent' ? '#1e3a5f' : 'transparent', true);
          $$('[data-pre]', C).forEach(b => b.onclick = () => { st = UB.norm(UB.PRESETS.find(p => p.id === b.dataset.pre).style); draw(); });
          $$('[data-my]', C).forEach(b => b.onclick = () => { const p = mine.find(x => x.id === b.dataset.my); st = UB.norm(p.style); if (p.iconFa && !iconFa) iconFa = p.iconFa; draw(); });
          $$('[data-mydel]', C).forEach(b => b.onclick = async () => { if (!(await confirmBox('ลบสไตล์นี้?', '', 'ลบ'))) return; await api('DELETE', `/button-presets/${b.dataset.mydel}`); mine = mine.filter(x => x.id !== b.dataset.mydel); draw(); });
          $('[data-pickicon]', C).onclick = async () => { const v = await pickIcon(iconFa); if (v !== null) { iconFa = v; iconImg = ''; draw(); } };
          $('[data-pickimg]', C).onclick = async () => { const v = await pickMedia('image'); if (v) { iconImg = v; iconFa = ''; if (st.iconSize < 40) st.iconSize = 56; draw(); } };
          const ni = $('[data-noicon]', C); if (ni) ni.onclick = () => { iconFa = ''; iconImg = ''; draw(); };
        };
        $$('[data-t]', el).forEach(i => i.addEventListener('input', () => { it[i.dataset.t] = i.value; preview(); }));
        $$('[data-pvbg] button', el).forEach(b => b.onclick = () => { pvBg = b.dataset.b; preview(); });
        $('[data-savemine]', el).onclick = async () => {
          const r = await Swal.fire({ title: 'ตั้งชื่อสไตล์', input: 'text', inputValue: it.title || '', showCancelButton: true, confirmButtonText: 'บันทึก', cancelButtonText: 'ยกเลิก', reverseButtons: true });
          if (!r.isConfirmed) return;
          const p = await api('POST', '/button-presets', { name: r.value || 'สไตล์ของฉัน', style: st, iconFa }); mine.push(p); draw(); ok('บันทึกสไตล์แล้ว');
        };
        $('[data-ok]', el).onclick = () => { it.style = st; it.iconFa = iconFa; it.iconImg = iconImg; okd = true; close(); };
        const all = $('[data-all]', el);
        if (all) all.onclick = async () => {
          if (!(await confirmBox('ใช้สไตล์นี้กับทุกปุ่ม?', 'สี รูปทรง และเอฟเฟกต์ของทุกปุ่มในส่วนแสดงผลนี้จะเปลี่ยนเป็นแบบนี้ (ไอคอนและข้อความของแต่ละปุ่มไม่เปลี่ยน)', 'ใช้กับทุกปุ่ม', false))) return;
          it.style = st; it.iconFa = iconFa; it.iconImg = iconImg; opts.onApplyAll(clone(st)); okd = true; close();
        };
        draw();
      },
    });
  });
}

/* ================================================================
 * Canvas designer (ผืนผ้าใบ ลากวาง + เส้นตาราง)
 * ================================================================ */
const CANVAS_PRESETS = [[1200, 300, 'แบนเนอร์เตี้ย'], [1200, 400, 'แบนเนอร์'], [1200, 600, 'ส่วนกลางหน้า'], [800, 800, 'สี่เหลี่ยม'], [400, 800, 'แถบข้าง'], [1920, 1080, 'Full HD'], [600, 120, 'ปุ่มเดี่ยว/แถบปุ่ม']];
function ensurePositions(w) {
  const g = w.gridSize || 20;
  let y = g;
  w.items.forEach(it => {
    if (it.pos) return;
    const h = it.type === 'image' ? 200 : it.type === 'video' ? 225 : 60;
    const wd = it.type === 'button' ? 240 : 320;
    it.pos = { x: g, y: Math.min(y, Math.max(0, w.canvasH - h)), w: wd, h, z: 1, locked: false };
    y += h + g;
  });
}
function mountCanvas(host, w, hooks) {
  let sel = null, zoom = 'fit', showGrid = true, snapOn = true, scale = 1;
  const W = () => Math.max(200, Number(w.canvasW) || 1200), Hh = () => Math.max(60, Number(w.canvasH) || 400), G = () => Math.max(2, Number(w.gridSize) || 20);
  host.innerHTML = `
    <div class="card p-2.5 flex flex-wrap items-center gap-2">
      <button class="btn btn-primary btn-sm" data-add="button">${icon('plus', 'w-3.5 h-3.5')} ปุ่ม</button>
      <button class="btn btn-light btn-sm" data-add="text">${icon('text', 'w-3.5 h-3.5')} ข้อความ</button>
      <button class="btn btn-light btn-sm" data-add="image">${icon('image', 'w-3.5 h-3.5')} ภาพ</button>
      <span class="w-px h-6 bg-slate-200 mx-1"></span>
      <label class="flex items-center gap-1.5 text-xs text-slate-600"><input type="checkbox" class="tgl !w-8 !h-[18px] after:!w-3 after:!h-3" data-grid checked> เส้นตาราง</label>
      <label class="flex items-center gap-1.5 text-xs text-slate-600"><input type="checkbox" class="tgl !w-8 !h-[18px] after:!w-3 after:!h-3" data-snap checked> ยึดตามตาราง</label>
      <select class="inp !w-auto !py-1 text-xs" data-zoom><option value="fit">พอดีจอ</option><option value="0.5">50%</option><option value="0.75">75%</option><option value="1">100%</option></select>
      <span class="ml-auto text-xs text-slate-500 font-mono" data-info></span>
    </div>
    <div class="card px-2.5 mt-2 h-[52px] flex flex-nowrap items-center gap-2 text-xs overflow-x-auto overflow-y-hidden scroll-thin whitespace-nowrap" data-selbar></div>
    <div class="mt-2 rounded-xl bg-slate-300/50 p-4 overflow-auto scroll-thin" style="max-height:calc(100vh - 290px)" data-wrap tabindex="0">
      <div data-scaler class="relative mx-auto"><div data-cv class="absolute top-0 left-0 origin-top-left shadow-xl"></div></div>
    </div>
    <p class="text-xs text-slate-500 mt-2">ลากเพื่อย้าย · ลากจุดที่มุม/ขอบเพื่อปรับขนาด · ดับเบิลคลิกเพื่อแก้ไข · ลูกศรเลื่อนทีละช่อง (Shift = ทีละ 1px) · Delete ลบ · Ctrl+D ทำสำเนา · L ล็อก</p>`;
  const cv = $('[data-cv]', host), wrap = $('[data-wrap]', host), scaler = $('[data-scaler]', host);
  const snap = v => snapOn ? Math.round(v / G()) * G() : Math.round(v);
  const byId = id => w.items.find(i => i.id === id);

  function computeScale() {
    if (zoom !== 'fit') return Number(zoom);
    const avail = (wrap.clientWidth || 800) - 32;
    return Math.min(1, avail / W());
  }
  function elHtml(it) {
    const p = it.pos;
    let inner;
    if (it.type === 'button') inner = UB.buttonHtml({ ...it, title: it.title || 'ปุ่ม', style: it.style || UB.fromLegacy(it.btnStyle, w.accent) }, { tag: 'div', cw: W() });
    else if (it.type === 'image') inner = it.src ? `<img src="${esc(it.src)}" style="width:100%;height:100%;object-fit:${w.fit};border-radius:${w.radius}px;display:block" draggable="false">` : `<div class="w-full h-full grid place-items-center bg-slate-100 text-slate-400">${icon('image', 'w-8 h-8')}</div>`;
    else if (it.type === 'video') inner = `<div class="w-full h-full grid place-items-center bg-slate-900 text-white" style="border-radius:${w.radius}px">${icon('video', 'w-10 h-10')}</div>`;
    else inner = `<div class="w-full h-full overflow-hidden">${it.html}</div>`;
    return `<div class="cv-el${p.locked ? ' locked' : ''}${it.active ? '' : ' off'}" data-id="${it.id}" style="left:${p.x}px;top:${p.y}px;width:${p.w}px;height:${p.h}px;z-index:${p.z || 1}">
      <div class="cv-in">${inner}</div>${p.locked ? `<span class="cv-lock">🔒</span>` : ''}</div>`;
  }
  const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map(h => `<span class="cv-h" data-h="${h}"></span>`).join('');
  function applySel() {
    $$('.cv-el', cv).forEach(el => {
      const it = byId(el.dataset.id), on = sel === el.dataset.id;
      el.classList.toggle('sel', on);
      $$('.cv-h', el).forEach(h => h.remove());
      if (on && !it.pos.locked) el.insertAdjacentHTML('beforeend', HANDLES);
      el.style.zIndex = on ? 9000 : (it.pos.z || 1); // ชิ้นที่เลือกอยู่บนสุดขณะแก้ไข
    });
    drawSel();
  }
  function redraw() {
    ensurePositions(w);
    scale = computeScale();
    const g = G();
    cv.style.cssText = `width:${W()}px;height:${Hh()}px;transform:scale(${scale});background-color:${w.bg === 'transparent' ? '#ffffff' : w.bg};container-type:inline-size;--hs:${12 / scale}px;--hb:${2 / scale}px;
      ${showGrid ? `background-image:linear-gradient(to right,rgba(30,58,95,.13) 1px,transparent 1px),linear-gradient(to bottom,rgba(30,58,95,.13) 1px,transparent 1px);background-size:${g}px ${g}px;` : ''}`;
    scaler.style.width = W() * scale + 'px'; scaler.style.height = Hh() * scale + 'px';
    cv.innerHTML = w.items.map(elHtml).join('');
    $('[data-info]', host).textContent = `${W()} × ${Hh()} px · ตาราง ${g}px · ${Math.round(scale * 100)}%`;
    applySel();
  }
  function drawSel() {
    const bar = $('[data-selbar]', host), it = sel && byId(sel);
    if (!it) { bar.innerHTML = `<span class="text-slate-400">คลิกเลือกชิ้นงานบนผืนผ้าใบเพื่อปรับตำแหน่ง/ขนาด</span>`; return; }
    const p = it.pos;
    bar.innerHTML = `<span class="font-semibold text-slate-700 truncate max-w-[140px] flex-none">${esc(it.title || TYPE_META[it.type].name)}</span>
      ${['x', 'y', 'w', 'h'].map(k => `<label class="flex items-center gap-1 text-slate-500">${k.toUpperCase()}<input type="number" class="inp !w-[68px] !py-1 !px-2 text-xs" data-p="${k}" value="${p[k]}" ${p.locked ? 'disabled' : ''}></label>`).join('')}
      <span class="w-px h-5 bg-slate-200"></span>
      <button class="btn btn-sm ${p.locked ? 'btn-gold' : 'btn-light'}" data-act="lock">${p.locked ? '🔒 ล็อกอยู่' : '🔓 ล็อก'}</button>
      <button class="btn btn-light btn-sm" data-act="edit">${icon('edit', 'w-3.5 h-3.5')} แก้ไข</button>
      ${it.type === 'button' ? `<button class="btn btn-light btn-sm" data-act="design">🎨 ออกแบบ</button>` : ''}
      <button class="btn btn-light btn-sm" data-act="front" title="นำมาไว้หน้าสุด">⬆ หน้า</button><button class="btn btn-light btn-sm" data-act="back" title="ส่งไปหลังสุด">⬇ หลัง</button>
      <button class="btn btn-light btn-sm" data-act="dup">${icon('copy', 'w-3.5 h-3.5')}</button>
      <button class="btn btn-danger btn-sm" data-act="del">${icon('trash', 'w-3.5 h-3.5')}</button>`;
    $$('[data-p]', bar).forEach(i => i.onchange = () => { p[i.dataset.p] = Math.max(i.dataset.p === 'w' || i.dataset.p === 'h' ? 4 : 0, Number(i.value) || 0); clampPos(p); hooks.change(); });
    $$('[data-act]', bar).forEach(b => b.onclick = () => act(b.dataset.act));
  }
  function clampPos(p) {
    p.w = Math.min(p.w, W()); p.h = Math.min(p.h, Hh());
    p.x = Math.max(0, Math.min(p.x, W() - p.w)); p.y = Math.max(0, Math.min(p.y, Hh() - p.h));
  }
  async function act(a) {
    const it = byId(sel); if (!it) return;
    const zs = w.items.map(i => i.pos.z || 1);
    if (a === 'lock') it.pos.locked = !it.pos.locked;
    if (a === 'front') it.pos.z = Math.max(...zs) + 1;
    if (a === 'back') { w.items.forEach(i => i.pos.z = (i.pos.z || 1) + 1); it.pos.z = 1; }
    if (a === 'dup') { const c = clone(it); c.id = rid(); c.pos.x = Math.min(c.pos.x + G(), W() - c.pos.w); c.pos.y = Math.min(c.pos.y + G(), Hh() - c.pos.h); c.pos.locked = false; w.items.push(c); sel = c.id; }
    if (a === 'del') { if (!(await confirmBox('ลบชิ้นงานนี้?', it.title || '', 'ลบ'))) return; w.items = w.items.filter(i => i.id !== it.id); sel = null; }
    if (a === 'edit') return hooks.edit(it);
    if (a === 'design') return hooks.design(it);
    hooks.change();
  }
  async function addEl(type) {
    const g = G(), n = w.items.length;
    const base = { id: rid(), title: '', subtitle: '', src: '', link: '', newTab: true, icon: '', iconFa: '', btnStyle: 'primary', html: '', active: true, start: '', end: '' };
    let it;
    if (type === 'image') {
      const url = await pickMedia('image'); if (!url) return;
      it = { ...base, type: 'image', src: url, title: decodeURIComponent(url.split('/').pop()).replace(/\.[^.]+$/, ''), pos: { x: g, y: g, w: snap(320), h: snap(200), z: n + 1, locked: false } };
    } else if (type === 'text') {
      it = { ...base, type: 'button', title: 'หัวข้อ / ข้อความ', link: '', style: UB.norm(UB.PRESETS.find(p => p.id === 'text').style), pos: { x: g, y: g, w: snap(400), h: snap(60), z: n + 1, locked: false } };
    } else {
      it = { ...base, type: 'button', title: 'ปุ่มใหม่', iconFa: 'fa-solid fa-circle-arrow-right', style: UB.norm(UB.PRESETS[0].style), pos: { x: g, y: g, w: snap(240), h: snap(60), z: n + 1, locked: false } };
    }
    const off = (n % 6) * g; it.pos.x += off; it.pos.y += off; clampPos(it.pos);
    w.items.push(it); sel = it.id; hooks.change();
  }

  /* pointer: move / resize */
  let drag = null, lastDown = null;
  // หาชิ้นงานบนสุด ณ ตำแหน่งที่คลิก (ไม่พึ่ง e.target เพราะ pointer capture อาจทำให้ target เป็นผืนผ้าใบ)
  function hitTest(cx, cy) {
    const r = cv.getBoundingClientRect(), x = (cx - r.left) / scale, y = (cy - r.top) / scale;
    let best = null, bz = -1;
    w.items.forEach((it, i) => {
      const p = it.pos; if (!p || x < p.x || y < p.y || x > p.x + p.w || y > p.y + p.h) return;
      const z = (it.id === sel ? 1e6 : (p.z || 1) * 1000) + i;
      if (z > bz) { bz = z; best = it; }
    });
    return best;
  }
  cv.addEventListener('pointerdown', e => {
    const hEl = e.target.closest && e.target.closest('.cv-h');
    const it = hEl ? byId(hEl.closest('.cv-el').dataset.id) : hitTest(e.clientX, e.clientY);
    if (!it) { lastDown = null; if (sel) { sel = null; applySel(); } return; }
    lastDown = it.id;
    if (sel !== it.id) { sel = it.id; applySel(); hooks.select && hooks.select(it); }
    wrap.focus({ preventScroll: true });
    if (it.pos.locked || e.button !== 0) return;
    e.preventDefault();
    drag = { id: it.id, h: hEl ? hEl.dataset.h : null, sx: e.clientX, sy: e.clientY, p0: { ...it.pos }, moved: false };
    cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener('pointermove', e => {
    if (!drag) return;
    const it = byId(drag.id), p = it.pos, p0 = drag.p0, g = G();
    const dx = (e.clientX - drag.sx) / scale, dy = (e.clientY - drag.sy) / scale;
    if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 3) return;
    drag.moved = true;
    const min = snapOn ? g : 10;
    if (!drag.h) { p.x = snap(p0.x + dx); p.y = snap(p0.y + dy); }
    else {
      const h = drag.h;
      if (h.includes('e')) p.w = Math.max(min, snap(p0.x + p0.w + dx) - p0.x);
      if (h.includes('s')) p.h = Math.max(min, snap(p0.y + p0.h + dy) - p0.y);
      if (h.includes('w')) { const nx = Math.min(snap(p0.x + dx), p0.x + p0.w - min); p.w = p0.x + p0.w - nx; p.x = nx; }
      if (h.includes('n')) { const ny = Math.min(snap(p0.y + dy), p0.y + p0.h - min); p.h = p0.y + p0.h - ny; p.y = ny; }
    }
    clampPos(p);
    const el = $(`.cv-el[data-id="${it.id}"]`, cv);
    Object.assign(el.style, { left: p.x + 'px', top: p.y + 'px', width: p.w + 'px', height: p.h + 'px' });
    let tip = $('.cv-tip', cv);
    if (!tip) { tip = document.createElement('div'); tip.className = 'cv-tip'; cv.appendChild(tip); }
    tip.textContent = drag.h ? `${p.w} × ${p.h}` : `X ${p.x}  Y ${p.y}`;
    Object.assign(tip.style, { left: p.x + 'px', top: Math.max(0, p.y - 28 / scale) + 'px' });
  });
  const endDrag = () => { if (drag && drag.moved) hooks.change(); else if (drag) drawSel(); drag = null; const t = $('.cv-tip', cv); if (t) t.remove(); };
  cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);
  // pointer capture ทำให้ target ของ dblclick เป็นผืนผ้าใบ จึงใช้ชิ้นงานที่ถูกกดล่าสุดแทน
  cv.addEventListener('dblclick', () => { const it = lastDown && byId(lastDown); if (!it) return; it.type === 'button' ? hooks.design(it) : hooks.edit(it); });
  wrap.addEventListener('keydown', e => {
    const it = sel && byId(sel); if (!it || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    const step = e.shiftKey ? 1 : G();
    const mv = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (mv && !it.pos.locked) { e.preventDefault(); it.pos.x += mv[0]; it.pos.y += mv[1]; clampPos(it.pos); hooks.change(); }
    else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); act('del'); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') { e.preventDefault(); act('dup'); }
    else if (e.key.toLowerCase() === 'l' && !e.ctrlKey) { act('lock'); }
    else if (e.key === 'Escape') { sel = null; applySel(); }
  });
  $$('[data-add]', host).forEach(b => b.onclick = () => addEl(b.dataset.add));
  $('[data-grid]', host).onchange = e => { showGrid = e.target.checked; redraw(); };
  $('[data-snap]', host).onchange = e => { snapOn = e.target.checked; };
  $('[data-zoom]', host).onchange = e => { zoom = e.target.value; redraw(); };
  const ro = new ResizeObserver(() => { if (zoom === 'fit' && document.body.contains(host)) { const s = computeScale(); if (Math.abs(s - scale) > 0.01) redraw(); } });
  ro.observe(wrap);
  redraw();
  return { redraw, select: id => { sel = id; redraw(); } };
}
const CANVAS_CSS = `
.cv-el{position:absolute;box-sizing:border-box;cursor:move;user-select:none;touch-action:none}
.cv-el.locked{cursor:default}.cv-el.off{opacity:.35}
.cv-el .cv-in{width:100%;height:100%;pointer-events:none}
.cv-el.sel{outline:var(--hb) solid #2563eb;outline-offset:var(--hb)}
.cv-el:hover:not(.sel){outline:var(--hb) dashed #60a5fa}
.cv-h{position:absolute;width:var(--hs);height:var(--hs);background:#fff;border:var(--hb) solid #2563eb;border-radius:calc(var(--hs) / 4);z-index:20;box-sizing:border-box}
.cv-h[data-h=nw]{left:calc(var(--hs) / -2);top:calc(var(--hs) / -2);cursor:nwse-resize}.cv-h[data-h=se]{right:calc(var(--hs) / -2);bottom:calc(var(--hs) / -2);cursor:nwse-resize}
.cv-h[data-h=ne]{right:calc(var(--hs) / -2);top:calc(var(--hs) / -2);cursor:nesw-resize}.cv-h[data-h=sw]{left:calc(var(--hs) / -2);bottom:calc(var(--hs) / -2);cursor:nesw-resize}
.cv-h[data-h=n]{left:calc(50% - var(--hs) / 2);top:calc(var(--hs) / -2);cursor:ns-resize}.cv-h[data-h=s]{left:calc(50% - var(--hs) / 2);bottom:calc(var(--hs) / -2);cursor:ns-resize}
.cv-h[data-h=e]{top:calc(50% - var(--hs) / 2);right:calc(var(--hs) / -2);cursor:ew-resize}.cv-h[data-h=w]{top:calc(50% - var(--hs) / 2);left:calc(var(--hs) / -2);cursor:ew-resize}
.cv-lock{position:absolute;top:calc(var(--hs) * -1);right:calc(var(--hs) * -1);font-size:calc(var(--hs) * 1.1);z-index:21;line-height:1}
.cv-tip{position:absolute;z-index:50;background:#0f172a;color:#fff;font:600 calc(var(--hs) * 1.05)/1 ui-monospace,monospace;padding:calc(var(--hs) * .4) calc(var(--hs) * .6);border-radius:calc(var(--hs) * .4);pointer-events:none;white-space:nowrap}
`;
(function injectCss() {
  const s = document.createElement('style');
  s.textContent = UB.CSS + CANVAS_CSS;
  document.head.appendChild(s);
})();

/* ================================================================
 * Widget editor
 * ================================================================ */
const TYPE_META = {
  image: { name: 'ภาพ', ic: 'image', cls: 'bg-sky-50 text-sky-700' },
  video: { name: 'วีดีโอ', ic: 'video', cls: 'bg-rose-50 text-rose-700' },
  button: { name: 'ปุ่มลิงก์', ic: 'link', cls: 'bg-emerald-50 text-emerald-700' },
  html: { name: 'HTML', ic: 'html', cls: 'bg-violet-50 text-violet-700' },
};
function itemStatus(i) {
  const n = new Date();
  if (!i.active) return ['ปิด', 'bg-slate-100 text-slate-500'];
  if (i.start && new Date(i.start) > n) return ['รอแสดง', 'bg-amber-50 text-amber-700'];
  if (i.end && new Date(i.end + (i.end.length <= 10 ? 'T23:59:59' : '')) < n) return ['หมดอายุ', 'bg-slate-100 text-slate-500'];
  return ['แสดง', 'bg-emerald-50 text-emerald-700'];
}

async function viewWidgetEditor(id) {
  const orig = await api('GET', `/widgets/${id}`);
  const w = clone(orig);
  let tab = 'items', device = 'desktop', previewFull = false, designer = null, rightMode = 'design';
  const markDirty = () => {
    state.dirty = true; $('#saveBtn').classList.add('ring-4', 'ring-gold-400/40'); $('#dirtyDot').classList.remove('hidden'); refresh();
    if (designer && w.layout === 'canvas' && rightMode === 'design') designer.redraw();
  };

  $('#view').innerHTML = `
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
    <div class="flex items-center gap-3 min-w-0">
      <a href="#/widgets" class="p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200">${icon('back', 'w-5 h-5')}</a>
      <div class="min-w-0"><div class="text-xs text-slate-500">ส่วนแสดงผล</div><h1 class="text-xl font-bold text-slate-900 truncate" id="wTitle">${esc(w.name)}</h1></div>
      <span id="dirtyDot" class="hidden text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">ยังไม่บันทึก</span>
    </div>
    <div class="flex flex-wrap gap-2">
      <button class="btn btn-light" id="embedBtn">${icon('code')} โค้ดฝัง (iframe)</button>
      <button class="btn btn-light" id="exportBtn">${icon('html')} ส่งออก HTML + CSS</button>
      <a class="btn btn-light" href="/embed/${esc(w.slug)}" target="_blank" id="openBtn">${icon('ext')} เปิดดู</a>
      <button class="btn btn-primary" id="saveBtn">${icon('save')} บันทึก</button>
    </div>
  </div>
  <div class="grid xl:grid-cols-[460px_1fr] gap-5 items-start">
    <div class="card overflow-hidden">
      <div class="flex border-b border-slate-200 bg-slate-50/60" id="tabs">
        ${[['items', 'รายการ'], ['layout', 'รูปแบบการแสดงผล'], ['info', 'ข้อมูลทั่วไป']].map(([k, t]) => `<button data-tab="${k}" class="flex-1 px-3 py-3 text-sm font-semibold border-b-2 -mb-px">${t}</button>`).join('')}
      </div>
      <div id="panel" class="p-4"></div>
    </div>
    <div class="xl:sticky xl:top-20 space-y-3 min-w-0">
      <div id="modeBar" class="hidden"><div class="seg" id="modeSeg"><button data-mode="design">🧩 ออกแบบ (ลากวางบนตาราง)</button><button data-mode="preview">👁 ตัวอย่างจริง / มือถือ</button></div></div>
      <div id="designBox" class="hidden"></div>
      <div id="previewBox" class="space-y-3">
      <div class="card p-3 flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2 text-sm font-semibold text-slate-700">${icon('eye')} ตัวอย่างการแสดงผล <span class="text-xs font-normal text-slate-400">(อัปเดตทันที ยังไม่บันทึกจริง)</span></div>
        <div class="flex items-center gap-2">
          <label class="flex items-center gap-1.5 text-xs text-slate-600"><input type="checkbox" class="tgl !w-8 !h-[18px] after:!w-3 after:!h-3" id="pvFull"> แสดงทั้งหมด</label>
          <div class="seg" id="devSeg">${[['desktop', 'desktop'], ['tablet', 'tablet'], ['phone', 'phone']].map(([k, i]) => `<button data-dev="${k}" class="!px-2.5" title="${k}">${icon(i)}</button>`).join('')}</div>
        </div>
      </div>
      <div class="card p-4 chk-pattern overflow-auto scroll-thin" style="max-height:calc(100vh - 170px)">
        <div id="pvWrap" class="mx-auto transition-all bg-white shadow-sm"><iframe id="pv" class="w-full border-0 block" style="height:300px" sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"></iframe></div>
      </div>
      </div>
    </div>
  </div>`;

  /* preview */
  const pv = $('#pv');
  window.addEventListener('message', function onMsg(e) {
    if (!document.body.contains(pv)) return window.removeEventListener('message', onMsg);
    if (e.source === pv.contentWindow && e.data && e.data.type === 'uw-resize') pv.style.height = Math.max(120, e.data.height) + 'px';
  });
  const refresh = debounce(async () => {
    try { pv.srcdoc = await api('POST', '/widgets/preview', { ...w, __full: previewFull }); } catch (e) { /* ignore */ }
  }, 250);
  const setDevice = d => {
    device = d;
    $('#pvWrap').style.width = { desktop: '100%', tablet: '768px', phone: '390px' }[d];
    $$('#devSeg button').forEach(b => b.classList.toggle('on', b.dataset.dev === d));
  };
  $$('#devSeg button').forEach(b => b.onclick = () => setDevice(b.dataset.dev));
  $('#pvFull').onchange = e => { previewFull = e.target.checked; refresh(); };
  setDevice('desktop');

  /* right column: designer vs preview */
  const designHooks = {
    change: () => { markDirty(); if (tab === 'items') drawPanel(); },
    edit: it => editItem(clone(it), false, w.items.findIndex(i => i.id === it.id)),
    design: async it => { if (await designButton(it, { accent: w.accent, onApplyAll: st => w.items.forEach(i => { if (i.type === 'button') i.style = clone(st); }) })) { markDirty(); if (tab === 'items') drawPanel(); } },
  };
  function syncRight() {
    const isC = w.layout === 'canvas';
    $('#modeBar').classList.toggle('hidden', !isC);
    const mode = isC ? rightMode : 'preview';
    $('#designBox').classList.toggle('hidden', mode !== 'design');
    $('#previewBox').classList.toggle('hidden', mode !== 'preview');
    $$('#modeSeg button').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
    if (mode === 'design') { if (!designer) designer = mountCanvas($('#designBox'), w, designHooks); else designer.redraw(); }
    else refresh();
  }
  $$('#modeSeg button').forEach(b => b.onclick = () => { rightMode = b.dataset.mode; syncRight(); });

  /* save */
  $('#saveBtn').onclick = async () => {
    try {
      const r = await api('PUT', `/widgets/${id}`, w);
      Object.assign(w, r); state.dirty = false;
      $('#saveBtn').classList.remove('ring-4', 'ring-gold-400/40'); $('#dirtyDot').classList.add('hidden');
      $('#wTitle').textContent = w.name; $('#openBtn').href = `/embed/${w.slug}`;
      ok('บันทึกเรียบร้อย');
      if (tab === 'info') drawPanel();
    } catch (e) { fail(e.message); }
  };
  $('#exportBtn').onclick = async () => {
    if (state.dirty) { if (!(await confirmBox('ยังไม่ได้บันทึก', 'โค้ดจะสร้างจากข้อมูลที่บันทึกล่าสุด ต้องการบันทึกก่อนหรือไม่?', 'บันทึกแล้วส่งออก', false))) return; await $('#saveBtn').onclick(); }
    showExport(w);
  };
  $('#embedBtn').onclick = () => { if (state.dirty) Toast.fire({ icon: 'info', title: 'อย่าลืมกดบันทึกก่อนนำไปใช้' }); showEmbed(w); };
  document.onkeydown = e => { if ((e.ctrlKey || e.metaKey) && e.key === 's' && $('#saveBtn')) { e.preventDefault(); $('#saveBtn').click(); } };

  /* tabs */
  const drawTabs = () => $$('#tabs button').forEach(b => {
    const on = b.dataset.tab === tab;
    b.className = `flex-1 px-3 py-3 text-sm font-semibold border-b-2 -mb-px ${on ? 'border-navy-800 text-navy-800 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`;
  });
  $$('#tabs button').forEach(b => b.onclick = () => { tab = b.dataset.tab; drawTabs(); drawPanel(); });

  /* generic binder: data-k for widget fields */
  const bind = root => {
    $$('[data-k]', root).forEach(el => {
      const k = el.dataset.k;
      const ev = el.type === 'checkbox' || el.tagName === 'SELECT' || el.type === 'color' || el.type === 'range' ? 'input' : 'input';
      el.addEventListener(ev, () => {
        w[k] = el.type === 'checkbox' ? el.checked : (el.type === 'number' || el.type === 'range') ? Number(el.value) : el.value;
        const out = $(`[data-out="${k}"]`, root); if (out) out.textContent = el.value;
        if (el.dataset.redraw !== undefined) drawPanel();
        markDirty();
      });
    });
  };

  function drawPanel() {
    const P = $('#panel');
    if (tab === 'items') return drawItems(P);
    if (tab === 'info') {
      P.innerHTML = `<div class="space-y-4">
        <div><label class="lbl">ชื่อส่วนแสดงผล (ภายใน)</label><input class="inp" data-k="name" value="${esc(w.name)}"></div>
        <div><label class="lbl">Slug (ใช้ในลิงก์ iframe)</label><div class="flex items-center"><span class="px-3 py-2 text-sm bg-slate-100 border border-r-0 border-slate-300 rounded-l-lg text-slate-500 whitespace-nowrap">/embed/</span><input class="inp !rounded-l-none font-mono" data-k="slug" value="${esc(w.slug)}"></div>
          <p class="text-xs text-amber-700 mt-1">⚠ หากเปลี่ยน slug ต้องอัปเดตโค้ด iframe ที่ฝังไว้ในเว็บไซต์ด้วย</p></div>
        <div><label class="lbl">คำอธิบาย</label><textarea class="inp" rows="3" data-k="description">${esc(w.description)}</textarea></div>
        <div class="pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1"><div>สร้างเมื่อ: ${fmtDate(w.createdAt)}</div><div>แก้ไขล่าสุด: ${fmtDate(w.updatedAt)}</div></div>
      </div>`;
      $('[data-k="slug"]', P).addEventListener('input', e => { e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9\-_]/g, '-'); });
      return bind(P);
    }
    /* layout tab */
    const lay = (k, t, d, svg) => `<button data-lay="${k}" class="text-left p-3 rounded-xl border-2 transition ${w.layout === k ? 'border-navy-800 bg-navy-50' : 'border-slate-200 hover:border-slate-300'}">
      <div class="h-12 mb-2 text-navy-700">${svg}</div><div class="font-semibold text-sm">${t}</div><div class="text-xs text-slate-500 leading-snug">${d}</div></button>`;
    const sec = (t, body) => `<div class="pt-4 mt-4 border-t border-slate-100 first:border-0 first:mt-0 first:pt-0"><div class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">${t}</div>${body}</div>`;
    const tg = (k, t, redraw) => `<label class="flex items-center justify-between gap-3 py-1.5 cursor-pointer"><span class="text-sm text-slate-700">${t}</span><input type="checkbox" class="tgl" data-k="${k}" ${w[k] ? 'checked' : ''} ${redraw ? 'data-redraw' : ''}></label>`;
    const rng = (k, t, min, max, unit = '') => `<div><div class="flex justify-between"><label class="lbl">${t}</label><span class="text-xs text-slate-500"><span data-out="${k}">${w[k]}</span>${unit}</span></div><input type="range" class="w-full accent-navy-800" min="${min}" max="${max}" data-k="${k}" value="${w[k]}"></div>`;
    const ratios = [['auto', 'ตามภาพจริง'], ['16/9', '16:9'], ['16/6', '16:6 แบนเนอร์'], ['21/9', '21:9'], ['4/3', '4:3'], ['3/2', '3:2'], ['1/1', '1:1'], ['3/4', '3:4 แนวตั้ง'], ['2/3', '2:3 โปสเตอร์']];
    const isC = w.layout === 'canvas', isT = w.layout === 'tabs', isG = w.layout === 'grid' || w.layout === 'carousel';
    const wseg = (k, list) => `<div class="seg flex-wrap">${list.map(([v, t]) => `<button data-wseg="${k}" data-v="${v}" class="${String(w[k]) === String(v) ? 'on' : ''}">${t}</button>`).join('')}</div>`;
    const wcol = (k, t) => `<div><label class="lbl">${t}</label><div class="flex gap-2"><input type="color" class="h-9 w-11 rounded border border-slate-300 cursor-pointer" data-k="${k}" value="${/^#[0-9a-f]{6}$/i.test(w[k] || '') ? w[k] : '#1e293b'}"></div></div>`;
    P.innerHTML = `
      ${sec('รูปแบบ', `<div class="grid grid-cols-2 gap-2">
        ${lay('carousel', 'สไลด์', 'เลื่อนภาพอัตโนมัติ', '<svg viewBox="0 0 60 36" class="w-full h-full"><rect x="8" y="4" width="44" height="24" rx="3" fill="currentColor" opacity=".85"/><rect x="1" y="9" width="5" height="14" rx="1.5" fill="currentColor" opacity=".25"/><rect x="54" y="9" width="5" height="14" rx="1.5" fill="currentColor" opacity=".25"/><circle cx="25" cy="32" r="1.6" fill="currentColor"/><circle cx="30" cy="32" r="1.6" fill="currentColor" opacity=".3"/><circle cx="35" cy="32" r="1.6" fill="currentColor" opacity=".3"/></svg>')}
        ${lay('grid', 'กริด', 'เรียงเป็นตาราง', '<svg viewBox="0 0 60 36" class="w-full h-full">' + [0, 1, 2].map(c => [0, 1].map(r => `<rect x="${4 + c * 18}" y="${3 + r * 16}" width="16" height="14" rx="2" fill="currentColor" opacity="${.85 - r * .35}"/>`).join('')).join('') + '</svg>')}
        ${lay('list', 'รายการลิงก์', 'แถวพร้อมไอคอน', '<svg viewBox="0 0 60 36" class="w-full h-full">' + [0, 1, 2].map(r => `<rect x="4" y="${3 + r * 11}" width="8" height="8" rx="2" fill="currentColor" opacity=".85"/><rect x="15" y="${5 + r * 11}" width="${38 - r * 6}" height="4" rx="2" fill="currentColor" opacity=".35"/>`).join('') + '</svg>')}
        ${lay('canvas', 'ผืนผ้าใบอิสระ', 'ลากวางปุ่มบนเส้นตาราง', '<svg viewBox="0 0 60 36" class="w-full h-full"><g stroke="currentColor" stroke-width=".4" opacity=".3">' + [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => `<line x1="${i * 5}" y1="0" x2="${i * 5}" y2="36"/>`).join('') + [1, 2, 3, 4, 5, 6].map(i => `<line x1="0" y1="${i * 5}" x2="60" y2="${i * 5}"/>`).join('') + '</g><rect x="5" y="5" width="20" height="10" rx="2" fill="currentColor" opacity=".85"/><rect x="30" y="5" width="25" height="20" rx="2" fill="currentColor" opacity=".55"/><rect x="5" y="20" width="20" height="10" rx="5" fill="currentColor" opacity=".85"/></svg>')}
        ${lay('tabs', 'แท็บ', 'รวมหลายส่วน จัดซ้าย–ขวา', '<svg viewBox="0 0 60 36" class="w-full h-full"><rect x="2" y="1" width="56" height="8" rx="4" fill="currentColor" opacity=".15"/><rect x="3" y="2" width="27" height="6" rx="3" fill="currentColor" opacity=".85"/><rect x="2" y="12" width="22" height="22" rx="2" fill="currentColor" opacity=".55"/><g fill="currentColor" opacity=".3"><rect x="27" y="12" width="9" height="10" rx="1.5"/><rect x="38" y="12" width="9" height="10" rx="1.5"/><rect x="49" y="12" width="9" height="10" rx="1.5"/><rect x="27" y="24" width="9" height="10" rx="1.5"/><rect x="38" y="24" width="9" height="10" rx="1.5"/><rect x="49" y="24" width="9" height="10" rx="1.5"/></g></svg>')}
      </div>`)}
      ${sec('หัวข้อ', `${tg('showTitle', 'แสดงหัวข้อด้านบน', true)}${w.showTitle ? `<input class="inp mt-2" data-k="title" value="${esc(w.title)}" placeholder="หัวข้อที่แสดง">
        <div class="mt-2"><label class="lbl">รูปแบบหัวข้อ</label>${wseg('titleStyle', [['bar', '▍ แถบซ้าย'], ['pill', '⬭ แคปซูลกลาง'], ['center', 'กึ่งกลาง+ขีด'], ['plain', 'ข้อความ']])}</div>` : ''}`)}
      ${isT ? sec('แถบแท็บ', `<div class="space-y-3"><div><label class="lbl">รูปแบบแถบ</label>${wseg('tabStyle', [['pill', 'กล่องแคปซูล'], ['button', 'ปุ่มแยก'], ['underline', 'ขีดเส้นใต้']])}</div>
        ${tg('tabEqual', 'แท็บกว้างเท่ากันเต็มแถว')}<p class="text-xs text-slate-500">เพิ่มแท็บ เลือกสี และจัดวางเนื้อหาได้ที่แท็บ “รายการ”</p></div>`) : ''}
      ${isC ? sec('ขนาดผืนผ้าใบ', `<div class="space-y-3">
        <div class="grid grid-cols-2 gap-3"><div><label class="lbl">กว้าง (px)</label><input type="number" class="inp" data-k="canvasW" value="${w.canvasW}" min="200" max="3840"></div><div><label class="lbl">สูง (px)</label><input type="number" class="inp" data-k="canvasH" value="${w.canvasH}" min="60" max="4000"></div></div>
        <div class="flex flex-wrap gap-1.5">${CANVAS_PRESETS.map(([cw, ch, t]) => `<button class="px-2.5 py-1 rounded-md text-xs border ${w.canvasW === cw && w.canvasH === ch ? 'border-navy-700 bg-navy-50 text-navy-800' : 'border-slate-300 hover:bg-slate-50'}" data-cvp="${cw}x${ch}">${t} <span class="text-slate-400">${cw}×${ch}</span></button>`).join('')}</div>
        <div><label class="lbl">ขนาดช่องตาราง</label><select class="inp" data-k="gridSize">${[5, 10, 20, 25, 40, 50].map(n => `<option value="${n}" ${w.gridSize == n ? 'selected' : ''}>${n} px</option>`).join('')}</select></div>
        ${tg('stackMobile', 'บนมือถือ: เรียงปุ่มเป็นแนวตั้งอัตโนมัติ')}
        ${tg('canvasMax', 'ไม่ขยายใหญ่เกินขนาดที่ออกแบบ')}
        <p class="text-xs text-slate-500">ผืนผ้าใบจะย่อ–ขยายตามความกว้างของ iframe โดยคงสัดส่วนและตำแหน่งเดิม</p></div>`) : ''}
      ${isC || isT ? '' : w.layout !== 'list' ? sec('การจัดวาง', `<div class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div><label class="lbl">${w.layout === 'carousel' ? 'จำนวนต่อหน้า (จอใหญ่)' : 'จำนวนคอลัมน์ (จอใหญ่)'}</label><select class="inp" data-k="columns">${[1, 2, 3, 4, 5, 6].map(n => `<option ${w.columns == n ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
          <div><label class="lbl">บนมือถือ</label><select class="inp" data-k="mobileColumns">${[1, 2, 3].map(n => `<option ${w.mobileColumns == n ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="lbl">สัดส่วนภาพ</label><select class="inp" data-k="ratio">${ratios.map(([v, t]) => `<option value="${v}" ${w.ratio === v ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
          <div><label class="lbl">การปรับภาพ</label><select class="inp" data-k="fit"><option value="cover" ${w.fit === 'cover' ? 'selected' : ''}>เต็มกรอบ (ครอป)</option><option value="contain" ${w.fit === 'contain' ? 'selected' : ''}>แสดงครบทั้งภาพ</option></select></div>
        </div></div>`) : sec('ภาพย่อ', `<div><label class="lbl">สัดส่วนภาพย่อ (กรณีรายการเป็นภาพ)</label><select class="inp" data-k="ratio">${ratios.map(([v, t]) => `<option value="${v}" ${w.ratio === v ? 'selected' : ''}>${t}</option>`).join('')}</select></div>`)}
      ${!isC && w.layout === 'carousel' ? sec('สไลด์', `<div class="space-y-2">${rng('autoplay', 'เปลี่ยนสไลด์อัตโนมัติทุก (0 = ปิด)', 0, 20, ' วินาที')}${tg('showArrows', 'แสดงปุ่มลูกศร')}${tg('showDots', 'แสดงจุดบอกตำแหน่ง')}</div>`) : ''}
      ${isC || isT ? '' : sec('คำบรรยายภาพ', `${tg('showCaption', 'แสดงชื่อ/คำบรรยาย', true)}${w.showCaption && w.layout !== 'list' ? `<div class="seg mt-2">${[['below', 'ใต้ภาพ'], ['overlay', 'ทับบนภาพ']].map(([v, t]) => `<button data-cap="${v}" class="${w.captionPos === v ? 'on' : ''}">${t}</button>`).join('')}</div>
        <div class="grid grid-cols-2 gap-3 mt-3"><div><label class="lbl">จัดข้อความ</label>${wseg('captionAlign', [['left', 'ชิดซ้าย'], ['center', 'กึ่งกลาง']])}</div>${wcol('capColor', 'สีชื่อภาพ')}</div>` : ''}`)}
      ${isG ? sec('ภาพในการ์ด', `<div class="space-y-3">
        ${rng('imgPad', 'ระยะขอบรอบภาพ (เหมาะกับโลโก้ / QR Code)', 0, 40, 'px')}
        ${tg('lightbox', 'คลิกภาพเพื่อขยายดู (เมื่อภาพไม่มีลิงก์)')}
        ${wcol('link2Color', 'สีลิงก์ที่ 2 ใต้ภาพ (เช่น “ดาวน์โหลดแบบฟอร์ม”)')}</div>`) : ''}
      ${isC || isT ? '' : sec('จำกัดจำนวน (แก้ปัญหาภาพเยอะเกินไป)', `<div class="space-y-3">
        <div><label class="lbl">แสดงสูงสุด (0 = ไม่จำกัด)</label><input type="number" min="0" class="inp" data-k="limit" value="${w.limit}"></div>
        <div class="grid grid-cols-2 gap-3"><div><label class="lbl">ข้อความปุ่ม</label><input class="inp" data-k="moreLabel" value="${esc(w.moreLabel)}" placeholder="ดูทั้งหมด"></div>
        <div><label class="lbl">ลิงก์ปุ่ม “ดูทั้งหมด”</label><div class="flex gap-1"><input class="inp" data-k="moreLink" value="${esc(w.moreLink)}" placeholder="/p/..."><button class="btn btn-light btn-sm" id="pickPage" title="เลือกหน้าเว็บ">${icon('page')}</button></div></div></div>
        <p class="text-xs text-slate-500">ตัวอย่าง: แสดง 4 ภาพล่าสุด แล้วให้ปุ่ม “ดูทั้งหมด” ลิงก์ไปหน้าเว็บที่รวมภาพทั้งหมด</p></div>`)}
      ${sec('ระยะห่างและความสวยงาม', `<div class="space-y-3">
        ${isC ? '' : rng('gap', isT ? 'ระยะห่างระหว่างคอลัมน์' : 'ระยะห่างระหว่างรายการ', 0, 40, 'px')}${rng('padding', 'ขอบด้านใน', 0, 40, 'px')}${isT ? '' : rng('radius', isC ? 'ความมนของมุมภาพ' : 'ความมนของมุมการ์ด', 0, 28, 'px')}
        ${rng('panelRadius', 'ความมนของกรอบพื้นหลังทั้งชุด', 0, 32, 'px')}
        ${isG ? rng('btnMinH', 'ความสูงขั้นต่ำของปุ่ม (0 = อัตโนมัติ)', 0, 320, 'px') : ''}
        ${isC || isT ? '' : tg('shadow', 'เงาการ์ด')}
        <div class="grid grid-cols-2 gap-3">
          <div><label class="lbl">สีหลัก</label><div class="flex gap-2"><input type="color" class="h-10 w-12 rounded border border-slate-300 cursor-pointer" data-k="accent" value="${w.accent}"><input class="inp font-mono text-xs" value="${w.accent}" data-mirror="accent"></div></div>
          <div><label class="lbl">สีพื้นหลัง</label><div class="flex gap-2"><input type="color" class="h-10 w-12 rounded border border-slate-300 cursor-pointer" data-k="bg" value="${w.bg === 'transparent' ? '#ffffff' : w.bg}"><button class="btn btn-light btn-sm flex-1 ${w.bg === 'transparent' ? '!border-navy-700 !text-navy-800' : ''}" id="bgT">โปร่งใส</button></div></div>
        </div></div>`)}`;
    $$('[data-lay]', P).forEach(b => b.onclick = () => {
      w.layout = b.dataset.lay;
      if (w.layout === 'canvas') { w.canvasW = w.canvasW || 1200; w.canvasH = w.canvasH || 400; w.gridSize = w.gridSize || 20; if (w.stackMobile === undefined) w.stackMobile = true; ensurePositions(w); }
      markDirty(); drawPanel(); syncRight();
    });
    $$('[data-cvp]', P).forEach(b => b.onclick = () => { const [cw, ch] = b.dataset.cvp.split('x').map(Number); w.canvasW = cw; w.canvasH = ch; markDirty(); drawPanel(); });
    $$('[data-cap]', P).forEach(b => b.onclick = () => { w.captionPos = b.dataset.cap; markDirty(); drawPanel(); });
    $$('[data-wseg]', P).forEach(b => b.onclick = () => { w[b.dataset.wseg] = b.dataset.v; markDirty(); drawPanel(); });
    $$('[data-mirror]', P).forEach(inp => inp.oninput = () => { if (/^#[0-9a-f]{6}$/i.test(inp.value)) { w[inp.dataset.mirror] = inp.value; $(`[data-k="${inp.dataset.mirror}"]`, P).value = inp.value; markDirty(); } });
    const bgT = $('#bgT'); if (bgT) bgT.onclick = () => { w.bg = w.bg === 'transparent' ? '#ffffff' : 'transparent'; markDirty(); drawPanel(); };
    const pp = $('#pickPage'); if (pp) pp.onclick = async () => { const s = await choosePage(); if (s) { w.moreLink = `/p/${s}`; markDirty(); drawPanel(); } };
    bind(P);
    $$('[data-k="accent"]', P).forEach(c => c.addEventListener('input', () => { const m = $('[data-mirror="accent"]', P); if (m) m.value = c.value; }));
    $$('[data-k="bg"]', P).forEach(c => c.addEventListener('input', () => { w.bg = c.value; }));
  }

  let widgetCache = null;
  async function drawTabsEditor(P) {
    if (!widgetCache) widgetCache = await api('GET', '/widgets');
    const opts = widgetCache.filter(x => x.layout !== 'tabs' && x.id !== w.id);
    w.tabs = w.tabs || [];
    const SPANS = [[3, '1/4'], [4, '1/3'], [5, '5/12'], [6, '1/2'], [7, '7/12'], [8, '2/3'], [9, '3/4'], [12, 'เต็ม']];
    const mini = t => {
      let row = 0; const bars = [];
      t.blocks.forEach(b => { if (row + b.span > 12) row = 0; bars.push(b); row += b.span; });
      return `<div class="grid grid-cols-12 gap-1 mt-2">${t.blocks.map((b, i) => { const x = opts.find(o => o.slug === b.widgetSlug); return `<div class="h-6 rounded text-[10px] text-white grid place-items-center truncate px-1" style="grid-column:span ${b.span};background:${t.activeBg}${i % 2 ? 'cc' : ''}">${esc(x ? x.name : '?')}</div>`; }).join('')}</div>`;
    };
    P.innerHTML = `<div class="p-3 rounded-xl bg-navy-50 border border-navy-100 text-xs text-slate-600 leading-relaxed mb-3">
        สร้าง “ส่วนแสดงผล” ย่อยแต่ละชิ้นก่อน (เช่น แบนเนอร์, ปุ่มบริการ, QR Code) แล้วนำมาวางในแต่ละแท็บ · ความกว้างเต็มแถว = 12 ส่วน (เช่น ซ้าย 5/12 + ขวา 7/12) · บนมือถือจะเรียงต่อกันลงมา</div>
      <div class="space-y-3">${w.tabs.map((t, ti) => `<div class="rounded-xl border border-slate-200 overflow-hidden">
        <div class="flex items-center gap-2 p-2.5 bg-slate-50 border-b border-slate-200">
          <input type="color" data-tc="${ti}:activeBg" value="${t.activeBg}" class="h-8 w-9 rounded border border-slate-300 flex-none" title="สีแท็บเมื่อเลือก">
          <input class="inp !py-1.5 font-semibold" data-tl="${ti}" value="${esc(t.label)}">
          <button class="btn btn-light btn-sm !px-2" data-tic="${ti}" title="ไอคอนแท็บ">${t.iconFa ? `<i class="${esc(t.iconFa)}"></i>` : icon('plus', 'w-3.5 h-3.5')}</button>
          <input type="color" data-tc="${ti}:activeFg" value="${t.activeFg}" class="h-8 w-9 rounded border border-slate-300 flex-none" title="สีตัวอักษรเมื่อเลือก">
          <input type="checkbox" class="tgl" data-ta="${ti}" ${t.active !== false ? 'checked' : ''} title="เปิด/ปิดแท็บ">
          <button class="text-slate-400 hover:text-navy-800 disabled:opacity-20" data-tm="${ti}:-1" ${ti === 0 ? 'disabled' : ''}>${icon('up')}</button>
          <button class="text-slate-400 hover:text-navy-800 disabled:opacity-20" data-tm="${ti}:1" ${ti === w.tabs.length - 1 ? 'disabled' : ''}>${icon('down')}</button>
          <button class="p-1 text-slate-400 hover:text-rose-600" data-tr="${ti}">${icon('trash')}</button>
        </div>
        <div class="p-2.5 space-y-2">
          ${t.blocks.map((b, bi) => `<div class="flex items-center gap-1.5">
            <select class="inp !py-1.5 text-sm" data-bw="${ti}:${bi}"><option value="">— เลือกส่วนแสดงผล —</option>${opts.map(o => `<option value="${esc(o.slug)}" ${o.slug === b.widgetSlug ? 'selected' : ''}>${esc(o.name)} (${LAYOUT_NAME[o.layout]})</option>`).join('')}</select>
            <select class="inp !py-1.5 text-sm !w-[88px] flex-none" data-bs="${ti}:${bi}" title="ความกว้าง">${SPANS.map(([v, l]) => `<option value="${v}" ${b.span == v ? 'selected' : ''}>${l}</option>`).join('')}</select>
            <button class="text-slate-400 hover:text-navy-800 disabled:opacity-20 flex-none" data-bm="${ti}:${bi}:-1" ${bi === 0 ? 'disabled' : ''}>${icon('up')}</button>
            <button class="text-slate-400 hover:text-navy-800 disabled:opacity-20 flex-none" data-bm="${ti}:${bi}:1" ${bi === t.blocks.length - 1 ? 'disabled' : ''}>${icon('down')}</button>
            ${b.widgetSlug && opts.find(o => o.slug === b.widgetSlug) ? `<a class="p-1 text-slate-400 hover:text-navy-800 flex-none" href="#/widgets/${opts.find(o => o.slug === b.widgetSlug).id}" title="แก้ไขส่วนนี้">${icon('edit')}</a>` : ''}
            <button class="p-1 text-slate-400 hover:text-rose-600 flex-none" data-br="${ti}:${bi}">${icon('x')}</button></div>`).join('') || '<p class="text-xs text-slate-400 py-2 text-center">ยังไม่มีเนื้อหาในแท็บนี้</p>'}
          <button class="btn btn-light btn-sm w-full" data-ba="${ti}">${icon('plus', 'w-3.5 h-3.5')} เพิ่มส่วนแสดงผลในแท็บนี้</button>
          ${t.blocks.length ? mini(t) : ''}
        </div></div>`).join('')}</div>
      <button class="btn btn-primary w-full mt-3" data-tadd>${icon('plus')} เพิ่มแท็บ</button>
      <a href="#/widgets" class="block text-center text-xs text-navy-700 hover:underline mt-3">+ สร้างส่วนแสดงผลย่อยใหม่</a>`;
    const T = w.tabs, ch = (redraw = true) => { markDirty(); if (redraw) drawTabsEditor(P); };
    $$('[data-tl]', P).forEach(i => i.oninput = () => { T[+i.dataset.tl].label = i.value; ch(false); });
    $$('[data-tc]', P).forEach(i => i.oninput = () => { const [ti, k] = i.dataset.tc.split(':'); T[+ti][k] = i.value; ch(false); });
    $$('[data-ta]', P).forEach(i => i.onchange = () => { T[+i.dataset.ta].active = i.checked; ch(false); });
    $$('[data-tic]', P).forEach(b => b.onclick = async () => { const v = await pickIcon(T[+b.dataset.tic].iconFa); if (v !== null) { T[+b.dataset.tic].iconFa = v; ch(); } });
    $$('[data-tm]', P).forEach(b => b.onclick = () => { const [i, d] = b.dataset.tm.split(':').map(Number); [T[i], T[i + d]] = [T[i + d], T[i]]; ch(); });
    $$('[data-tr]', P).forEach(b => b.onclick = async () => { if (!(await confirmBox('ลบแท็บนี้?', T[+b.dataset.tr].label, 'ลบ'))) return; T.splice(+b.dataset.tr, 1); ch(); });
    $$('[data-bw]', P).forEach(sl => sl.onchange = () => { const [ti, bi] = sl.dataset.bw.split(':').map(Number); T[ti].blocks[bi].widgetSlug = sl.value; ch(); });
    $$('[data-bs]', P).forEach(sl => sl.onchange = () => { const [ti, bi] = sl.dataset.bs.split(':').map(Number); T[ti].blocks[bi].span = Number(sl.value); ch(); });
    $$('[data-bm]', P).forEach(b => b.onclick = () => { const [ti, bi, d] = b.dataset.bm.split(':').map(Number); const B = T[ti].blocks; [B[bi], B[bi + d]] = [B[bi + d], B[bi]]; ch(); });
    $$('[data-br]', P).forEach(b => b.onclick = () => { const [ti, bi] = b.dataset.br.split(':').map(Number); T[ti].blocks.splice(bi, 1); ch(); });
    $$('[data-ba]', P).forEach(b => b.onclick = () => { T[+b.dataset.ba].blocks.push({ id: rid(), widgetSlug: '', span: 12 }); ch(); });
    $('[data-tadd]', P).onclick = () => { const cols = ['#1e3a5f', '#b8862b', '#0f766e', '#e07a5f', '#7c3aed']; T.push({ id: rid(), label: `แท็บที่ ${T.length + 1}`, activeBg: cols[T.length % cols.length], activeFg: '#ffffff', active: true, blocks: [] }); ch(); };
  }

  // สไตล์ปุ่มโลโก้: ใช้สไตล์ของปุ่มแรกที่มีโลโก้/ปุ่มแรกในชุด ถ้าไม่มีใช้แบบการ์ดไอคอน
  const logoBtnStyle = () => {
    const ref = w.items.find(i => i.type === 'button' && i.iconImg && i.style) || w.items.find(i => i.type === 'button' && i.style);
    const st = ref ? clone(ref.style) : UB.norm(UB.PRESETS.find(p => p.id === 'tile').style);
    if (st.iconPos === 'left' || st.iconPos === 'right' || st.iconPos === 'only') st.iconPos = 'top';
    if (st.iconSize < 40) st.iconSize = 54;
    return st;
  };
  const toLogoButton = it => {
    it.type = 'button';
    if (it.src && !it.iconImg) it.iconImg = it.src;
    it.src = ''; it.iconFa = '';
    if (!it.style) it.style = logoBtnStyle();
    return it;
  };

  function drawItems(P) {
    if (w.layout === 'tabs') return drawTabsEditor(P);
    const items = w.items;
    P.innerHTML = `
      <div class="grid grid-cols-2 gap-2 mb-3">
        <label class="btn btn-primary cursor-pointer">${icon('upload')} อัปโหลดหลายภาพ<input type="file" accept="image/*" multiple class="hidden" id="bulkUp"></label>
        <div class="relative"><button class="btn btn-light w-full" id="addBtn">${icon('plus')} เพิ่มรายการ</button>
          <div id="addMenu" class="hidden absolute right-0 left-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-10">
            ${Object.entries(TYPE_META).map(([k, m]) => `<button data-add="${k}" class="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-slate-50"><span class="w-7 h-7 rounded-lg grid place-items-center ${m.cls}">${icon(m.ic, 'w-3.5 h-3.5')}</span>${m.name}</button>`).join('')}
          </div></div>
      </div>
      <div class="flex items-center justify-between text-xs text-slate-500 mb-2 px-1"><span>${items.length} รายการ · ลากเพื่อจัดลำดับ</span>${w.limit ? `<span class="text-amber-700">แสดงจริง ${w.limit} รายการแรก</span>` : ''}</div>
      <div id="itemList" class="space-y-2">${items.map((it, idx) => {
      const tm = TYPE_META[it.type], [st, stc] = itemStatus(it);
      const thumb = it.type === 'image' && it.src ? `<img src="${esc(it.src)}" class="w-full h-full object-cover">` : it.type === 'button' ? `<span class="w-full h-full p-1 block">${UB.buttonHtml({ title: it.iconFa || it.iconImg ? '' : (it.icon || 'Aa'), iconFa: it.iconFa, iconImg: it.iconImg, style: { ...(it.style || UB.fromLegacy(it.btnStyle, w.accent)), fontSize: 11, iconSize: 15, padX: 2, padY: 2, iconPos: it.iconFa || it.iconImg ? 'only' : 'left', radius: Math.min((it.style || {}).radius ?? 6, 8), hover: 'none', idle: 'none', depth: 'flat' } }, { tag: 'div' })}</span>` : icon(tm.ic, 'w-5 h-5');
      const hidden = w.limit && idx >= w.limit;
      return `<div class="group flex items-center gap-2.5 p-2 rounded-xl border ${hidden ? 'border-dashed border-slate-300 bg-slate-50/70' : 'border-slate-200 bg-white'} hover:border-navy-300" draggable="true" data-idx="${idx}">
          <span class="cursor-grab text-slate-300 hover:text-slate-500">${icon('grip')}</span>
          <span class="w-14 h-11 rounded-lg overflow-hidden grid place-items-center flex-none ${tm.cls}">${thumb}</span>
          <button class="flex-1 min-w-0 text-left" data-edit="${idx}"><span class="block text-sm font-medium truncate ${it.active ? '' : 'text-slate-400 line-through'}">${esc(it.title || '(ไม่มีชื่อ)')}</span>
            <span class="flex items-center gap-1.5 mt-0.5"><span class="text-[11px] px-1.5 rounded ${tm.cls}">${tm.name}</span><span class="text-[11px] px-1.5 rounded ${stc}">${st}</span>${it.end ? `<span class="text-[11px] text-slate-400">ถึง ${esc(it.end)}</span>` : ''}${hidden ? '<span class="text-[11px] text-slate-400">เกินจำนวน</span>' : ''}</span></button>
          <input type="checkbox" class="tgl" data-act="${idx}" ${it.active ? 'checked' : ''} title="เปิด/ปิดการแสดง">
          <div class="flex flex-col"><button class="text-slate-400 hover:text-navy-800 disabled:opacity-20" data-mv="${idx}:-1" ${idx === 0 ? 'disabled' : ''}>${icon('up', 'w-4 h-4')}</button><button class="text-slate-400 hover:text-navy-800 disabled:opacity-20" data-mv="${idx}:1" ${idx === items.length - 1 ? 'disabled' : ''}>${icon('down', 'w-4 h-4')}</button></div>
          <button class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50" data-rm="${idx}">${icon('trash')}</button>
        </div>`;
    }).join('') || `<div class="text-center py-10 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">ยังไม่มีรายการ<br>เริ่มจากอัปโหลดภาพ หรือกด “เพิ่มรายการ”</div>`}</div>`;

    $('#addBtn').onclick = e => { e.stopPropagation(); $('#addMenu').classList.toggle('hidden'); };
    document.addEventListener('click', () => $('#addMenu') && $('#addMenu').classList.add('hidden'), { once: true });
    $$('[data-add]', P).forEach(b => b.onclick = () => editItem({ id: rid(), type: b.dataset.add, title: '', subtitle: '', src: '', link: '', newTab: true, icon: '', btnStyle: 'primary', html: '', active: true, start: '', end: '' }, true));
    $('#bulkUp').onchange = async e => {
      const files = [...e.target.files]; e.target.value = '';
      if (!files.length) return;
      let asBtn = false;
      if (w.items.some(i => i.type === 'button')) {
        const r = await Swal.fire({ title: 'เพิ่มภาพเป็นแบบไหน?', icon: 'question', showDenyButton: true, showCancelButton: true,
          html: 'ส่วนแสดงผลนี้มีปุ่มอยู่แล้ว<br><b>ปุ่มโลโก้</b> = ภาพอยู่บนปุ่มพร้อมข้อความ (ใช้สไตล์เดียวกับปุ่มเดิม)<br><b>การ์ดภาพ</b> = ภาพเต็มการ์ด',
          confirmButtonText: 'ปุ่มโลโก้ + ข้อความ', denyButtonText: 'การ์ดภาพ', cancelButtonText: 'ยกเลิก', denyButtonColor: '#64748b', reverseButtons: true });
        if (r.isDismissed) return;
        asBtn = r.isConfirmed;
      }
      const ups = await uploadMany(files);
      ups.forEach(u => {
        const it = { id: rid(), type: 'image', title: u.name.replace(/\.[^.]+$/, ''), subtitle: '', src: u.url, link: '', newTab: true, active: true, start: '', end: '' };
        w.items.push(asBtn ? toLogoButton(it) : it);
      });
      if (asBtn && ups.length) Toast.fire({ icon: 'info', title: 'เพิ่มเป็นปุ่มโลโก้แล้ว — แก้ข้อความและลิงก์ของแต่ละปุ่มได้เลย' });
      if (ups.length) { markDirty(); drawPanel(); }
    };
    $$('[data-edit]', P).forEach(b => b.onclick = () => editItem(clone(items[+b.dataset.edit]), false, +b.dataset.edit));
    $$('[data-act]', P).forEach(c => c.onchange = () => { items[+c.dataset.act].active = c.checked; markDirty(); drawPanel(); });
    $$('[data-mv]', P).forEach(b => b.onclick = () => { const [i, d] = b.dataset.mv.split(':').map(Number); [items[i], items[i + d]] = [items[i + d], items[i]]; markDirty(); drawPanel(); });
    $$('[data-rm]', P).forEach(b => b.onclick = async () => {
      if (!(await confirmBox('ลบรายการนี้?', items[+b.dataset.rm].title || '', 'ลบ'))) return;
      items.splice(+b.dataset.rm, 1); markDirty(); drawPanel();
    });
    // drag & drop
    let from = null;
    $$('[data-idx]', P).forEach(row => {
      row.addEventListener('dragstart', e => { from = +row.dataset.idx; row.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; });
      row.addEventListener('dragend', () => row.classList.remove('dragging'));
      row.addEventListener('dragover', e => { e.preventDefault(); row.classList.add('drag-over'); });
      row.addEventListener('dragleave', () => row.classList.remove('drag-over'));
      row.addEventListener('drop', e => {
        e.preventDefault(); row.classList.remove('drag-over');
        const to = +row.dataset.idx; if (from === null || from === to) return;
        const [m] = items.splice(from, 1); items.splice(to, 0, m); from = null; markDirty(); drawPanel();
      });
    });
  }

  function editItem(it, isNew, idx) {
    const tm = () => TYPE_META[it.type];
    const m = openModal({
      title: isNew ? 'เพิ่มรายการ' : 'แก้ไขรายการ', size: 'max-w-xl',
      footer: `<button class="btn btn-light" data-close>ยกเลิก</button><button class="btn btn-primary" data-ok>${icon('save')} ${isNew ? 'เพิ่ม' : 'ตกลง'}</button>`,
      body: '<div data-form></div>',
      onMount: (el, close) => {
        const F = $('[data-form]', el);
        const draw = () => {
          const t = it.type;
          F.innerHTML = `<div class="space-y-4">
            <div><label class="lbl">ประเภท</label><div class="seg">${Object.entries(TYPE_META).map(([k, mm]) => `<button data-ty="${k}" class="${t === k ? 'on' : ''} flex items-center justify-center gap-1.5">${icon(mm.ic, 'w-3.5 h-3.5')} ${mm.name}</button>`).join('')}</div></div>
            ${t === 'image' ? `<div><label class="lbl">ภาพ</label>
              <div class="flex gap-3 items-start"><div class="w-36 aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 chk-pattern grid place-items-center flex-none">${it.src ? `<img src="${esc(it.src)}" class="w-full h-full object-contain">` : icon('image', 'w-7 h-7 text-slate-300')}</div>
              <div class="flex-1 space-y-2"><button class="btn btn-primary btn-sm w-full" data-pick="image">${icon('media', 'w-3.5 h-3.5')} เลือก / อัปโหลดภาพ</button><input class="inp text-xs font-mono" data-f="src" value="${esc(it.src)}" placeholder="หรือวาง URL ภาพ"></div></div></div>` : ''}
            ${t === 'video' ? `<div><label class="lbl">วีดีโอ</label><div class="flex gap-2"><input class="inp text-sm" data-f="src" value="${esc(it.src)}" placeholder="ลิงก์ YouTube / Facebook หรือไฟล์ .mp4"><button class="btn btn-primary btn-sm" data-pick="video">${icon('upload', 'w-3.5 h-3.5')} อัปโหลด</button></div>
              <p class="text-xs text-slate-500 mt-1">รองรับ youtube.com/watch?v=..., youtu.be/..., YouTube Shorts, วีดีโอ Facebook และไฟล์ mp4/webm</p>
              <div class="mt-2"><label class="lbl">ภาพหน้าปก (เฉพาะไฟล์วีดีโอ — ไม่บังคับ)</label><div class="flex gap-2"><input class="inp text-xs font-mono" data-f="poster" value="${esc(it.poster || '')}"><button class="btn btn-light btn-sm" data-pick="poster">${icon('media', 'w-3.5 h-3.5')}</button></div></div></div>` : ''}
            ${t === 'html' ? `<div><label class="lbl">โค้ด HTML</label><textarea class="inp font-mono text-xs" rows="8" data-f="html" placeholder="<div>...</div>">${esc(it.html)}</textarea><p class="text-xs text-amber-700 mt-1">⚠ HTML จะแสดงผลตามที่ใส่ ควรใช้โค้ดจากแหล่งที่เชื่อถือได้เท่านั้น</p></div>` : ''}
            ${t !== 'html' ? `<div class="grid gap-3">

              <div><label class="lbl">${t === 'button' ? 'ข้อความบนปุ่ม' : 'ชื่อ / หัวข้อ'}</label><input class="inp" data-f="title" value="${esc(it.title)}"></div></div>
              <div><label class="lbl">${t === 'button' ? 'ข้อความรอง (ไม่บังคับ)' : 'คำบรรยาย (ไม่บังคับ)'}</label><input class="inp" data-f="subtitle" value="${esc(it.subtitle)}"></div>` : `<div><label class="lbl">ชื่อ (ใช้ภายใน)</label><input class="inp" data-f="title" value="${esc(it.title)}"></div>`}
            ${t === 'button' ? `<div class="p-3 rounded-xl border border-slate-200 bg-slate-50">
              <div class="flex items-center justify-between mb-2"><label class="lbl !mb-0">หน้าตาปุ่ม · ไอคอน</label><button class="btn btn-primary btn-sm" data-design>🎨 ออกแบบปุ่ม / เลือกไอคอน</button></div>
              <div class="bg-white rounded-lg border border-slate-200 p-5 grid place-items-center"><div style="width:260px;height:${(it.style && it.style.iconPos === 'top') ? 130 : 60}px">${UB.buttonHtml({ ...it, title: it.title || 'ปุ่ม', style: it.style || UB.fromLegacy(it.btnStyle, w.accent) }, { tag: 'div' })}</div></div>
              <div class="flex items-center gap-2 mt-3"><span class="text-xs font-semibold text-slate-600">ภาพ / โลโก้บนปุ่ม:</span>
                ${it.iconImg ? `<img src="${esc(it.iconImg)}" class="h-8 max-w-[120px] object-contain rounded border border-slate-200 bg-white p-0.5">` : '<span class="text-xs text-slate-400">ไม่มี</span>'}
                <button class="btn btn-light btn-sm" data-logo>${icon('image', 'w-3.5 h-3.5')} ${it.iconImg ? 'เปลี่ยน' : 'เลือกภาพ'}</button>
                ${it.iconImg ? `<button class="btn btn-light btn-sm" data-nologo title="เอาภาพออก">${icon('x', 'w-3.5 h-3.5')}</button>` : ''}</div>
              <p class="text-xs text-slate-500 mt-2">เลือกไอคอน Font Awesome, สี, มุมมน/เหลี่ยม, นูน 3 มิติ, เงา และเอฟเฟกต์เมื่อเอาเมาส์ชี้ได้ที่ปุ่ม “ออกแบบปุ่ม”</p></div>` : ''}
            ${t === 'image' && w.items.some(i => i.type === 'button' && i.id !== it.id) ? `<div class="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900 flex items-center gap-3">
              <span class="flex-1">รายการนี้เป็น <b>การ์ดภาพ</b> จึงแสดงเป็นภาพเต็มการ์ด ถ้าต้องการให้เป็นปุ่มมีโลโก้ + ข้อความเหมือนปุ่มอื่น</span>
              <button class="btn btn-primary btn-sm" data-tologo>แปลงเป็นปุ่มโลโก้</button></div>` : ''}
            ${t !== 'html' ? `<div class="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label class="lbl !mb-0">${icon('link', 'w-3.5 h-3.5 inline')} ลิงก์เมื่อคลิก ${t === 'video' ? '(ไม่ใช้กับวีดีโอ)' : '(ไม่บังคับ)'}</label>
              ${t !== 'video' ? `<div class="flex gap-2"><input class="inp" data-f="link" value="${esc(it.link)}" placeholder="https://... หรือ /p/ชื่อหน้า"><button class="btn btn-light btn-sm" data-pp title="เลือกหน้าเว็บในระบบ">${icon('page', 'w-3.5 h-3.5')}</button><button class="btn btn-light btn-sm" data-pick="file" title="ลิงก์ไปไฟล์เอกสาร">${icon('file', 'w-3.5 h-3.5')}</button></div>
              <label class="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" class="tgl" data-f="newTab" ${it.newTab ? 'checked' : ''}> เปิดในแท็บใหม่</label>` : ''}
              ${t === 'image' ? `<div class="pt-2 border-t border-slate-200"><label class="lbl">ลิงก์ที่ 2 ใต้ภาพ (ไม่บังคับ) เช่น “ดาวน์โหลดแบบฟอร์ม”</label>
                <div class="grid grid-cols-[1fr_1.4fr] gap-2"><input class="inp" data-f="link2Text" value="${esc(it.link2Text || '')}" placeholder="ข้อความลิงก์"><div class="flex gap-2"><input class="inp" data-f="link2" value="${esc(it.link2 || '')}" placeholder="https://..."><button class="btn btn-light btn-sm" data-pick="file2" title="เลือกไฟล์">${icon('file', 'w-3.5 h-3.5')}</button></div></div></div>` : ''}
            </div>` : ''}
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div class="flex items-center justify-between"><label class="lbl !mb-0">${icon('clock', 'w-3.5 h-3.5 inline')} กำหนดช่วงเวลาแสดงผล</label><label class="flex items-center gap-2 text-sm"><input type="checkbox" class="tgl" data-f="active" ${it.active ? 'checked' : ''}> เปิดแสดง</label></div>
              <div class="grid grid-cols-2 gap-3 mt-2"><div><label class="text-xs text-slate-500">เริ่มแสดง</label><input type="date" class="inp" data-f="start" value="${esc(it.start)}"></div><div><label class="text-xs text-slate-500">สิ้นสุด</label><input type="date" class="inp" data-f="end" value="${esc(it.end)}"></div></div>
              <p class="text-xs text-slate-500 mt-1.5">เว้นว่าง = แสดงตลอด · เมื่อถึงวันสิ้นสุดระบบจะซ่อนให้อัตโนมัติ</p>
            </div>
          </div>`;
          $$('[data-f]', F).forEach(i => i.addEventListener('input', () => { it[i.dataset.f] = i.type === 'checkbox' ? i.checked : i.value; if (i.dataset.f === 'src' && it.type === 'image') { const im = F.querySelector('.chk-pattern img'); if (im) im.src = i.value; } }));
          $$('[data-ty]', F).forEach(b => b.onclick = () => {
            const from = it.type, to = b.dataset.ty;
            if (from === 'image' && to === 'button') toLogoButton(it); // ภาพเดิมกลายเป็นโลโก้บนปุ่ม
            else { if (from === 'button' && to === 'image' && it.iconImg && !it.src) it.src = it.iconImg; it.type = to; }
            if (it.type === 'button' && !it.btnStyle) it.btnStyle = 'primary';
            draw();
          });
          $$('[data-bs]', F).forEach(b => b.onclick = () => { it.btnStyle = b.dataset.bs; draw(); });
          const lg = $('[data-logo]', F); if (lg) lg.onclick = async () => { const u = await pickMedia('image'); if (u) { it.iconImg = u; it.iconFa = ''; it.style = it.style || logoBtnStyle(); if (it.style.iconSize < 40) it.style.iconSize = 54; if (it.style.iconPos !== 'top') it.style.iconPos = 'top'; draw(); } };
          const nl = $('[data-nologo]', F); if (nl) nl.onclick = () => { it.iconImg = ''; draw(); };
          const tl = $('[data-tologo]', F); if (tl) tl.onclick = () => { toLogoButton(it); draw(); };
          const dz = $('[data-design]', F); if (dz) dz.onclick = async () => { if (await designButton(it, { accent: w.accent, onApplyAll: st => { w.items.forEach(i => { if (i.type === 'button') i.style = clone(st); }); markDirty(); } })) draw(); };
          $$('[data-pick]', F).forEach(b => b.onclick = async () => {
            const k = b.dataset.pick; const url = await pickMedia(k === 'poster' ? 'image' : k === 'file2' ? 'any' : k);
            if (!url) return;
            if (k === 'file2') { it.link2 = url; if (!it.link2Text) it.link2Text = 'ดาวน์โหลด'; }
            else if (k === 'file') it.link = url; else if (k === 'poster') it.poster = url; else { it.src = url; if (!it.title) it.title = decodeURIComponent(url.split('/').pop()).replace(/\.[^.]+$/, ''); }
            draw();
          });
          const pp = $('[data-pp]', F); if (pp) pp.onclick = async () => { const s = await choosePage(); if (s) { it.link = `/p/${s}`; it.newTab = false; draw(); } };
        };
        draw();
        $('[data-ok]', el).onclick = () => {
          if ((it.type === 'image' || it.type === 'video') && !it.src) return Swal.fire({ icon: 'warning', title: `กรุณาเลือก${tm().name}`, confirmButtonText: 'ตกลง' });
          if (it.type === 'button' && !it.title) return Swal.fire({ icon: 'warning', title: 'กรุณากรอกข้อความบนปุ่ม', confirmButtonText: 'ตกลง' });
          if (it.start && it.end && it.start > it.end) return Swal.fire({ icon: 'warning', title: 'วันเริ่มต้องไม่เกินวันสิ้นสุด', confirmButtonText: 'ตกลง' });
          if (isNew) { if (w.layout === 'canvas' && !it.pos) { const g = w.gridSize || 20; it.pos = { x: g, y: g, w: it.type === 'button' ? 240 : 320, h: it.type === 'button' ? 60 : 200, z: w.items.length + 1, locked: false }; } w.items.push(it); } else w.items[idx] = it;
          close(); markDirty(); drawPanel();
        };
      },
    });
    return m;
  }

  drawTabs(); drawPanel(); syncRight();
}

async function choosePage() {
  const pages = await api('GET', '/pages');
  if (!pages.length) { Swal.fire({ icon: 'info', title: 'ยังไม่มีหน้าเว็บ', text: 'สร้างหน้าเว็บที่เมนู “หน้าเว็บเผยแพร่” ก่อน', confirmButtonText: 'ตกลง' }); return null; }
  const r = await Swal.fire({
    title: 'เลือกหน้าเว็บ', input: 'select', inputOptions: Object.fromEntries(pages.map(p => [p.slug, `${p.title}${p.status !== 'published' ? ' (ร่าง)' : ''}`])),
    showCancelButton: true, confirmButtonText: 'เลือก', cancelButtonText: 'ยกเลิก', reverseButtons: true,
  });
  return r.isConfirmed ? r.value : null;
}

/* ================================================================
 * Pages
 * ================================================================ */
async function viewPages() {
  const list = await api('GET', '/pages');
  const home = state.settings.homePageId;
  $('#view').innerHTML = `${pageHead('หน้าเว็บเผยแพร่', 'หน้าเว็บเต็มรูปแบบสำหรับเผยแพร่ข้อมูลเพิ่มเติม (แยกจากส่วนแสดงผล iframe)', `<a class="btn btn-light" href="/" target="_blank">${icon('ext')} ดูหน้าเว็บไซต์</a><button class="btn btn-primary" id="newP">${icon('plus')} สร้างหน้าเว็บ</button>`)}
  <div class="card overflow-hidden">
    <div class="overflow-x-auto"><table class="w-full text-sm">
      <thead class="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide"><tr><th class="text-left px-5 py-3 font-semibold">หน้าเว็บ</th><th class="text-left px-3 py-3 font-semibold">สถานะ</th><th class="text-left px-3 py-3 font-semibold hidden md:table-cell">เมนู</th><th class="text-left px-3 py-3 font-semibold hidden lg:table-cell">แก้ไขล่าสุด</th><th class="px-5 py-3"></th></tr></thead>
      <tbody class="divide-y divide-slate-100">${list.sort((a, b) => (a.menuOrder || 0) - (b.menuOrder || 0)).map(p => `<tr class="hover:bg-slate-50/60">
        <td class="px-5 py-3"><div class="flex items-center gap-3"><span class="w-14 h-10 rounded-md overflow-hidden bg-slate-100 flex-none grid place-items-center">${p.cover ? `<img src="${esc(p.cover)}" class="w-full h-full object-cover">` : icon('page', 'w-4 h-4 text-slate-400')}</span>
          <div class="min-w-0"><a href="#/pages/${p.id}" class="font-semibold text-slate-900 hover:text-navy-700">${esc(p.title)}</a>${home === p.id ? ' <span class="text-[11px] px-1.5 py-0.5 rounded bg-gold-500/10 text-gold-600 font-semibold">หน้าแรก</span>' : ''}<div class="text-xs text-slate-500 font-mono">/p/${esc(p.slug)} · ${p.blockCount} บล็อก</div></div></div></td>
        <td class="px-3 py-3">${p.status === 'published' ? '<span class="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium">เผยแพร่</span>' : '<span class="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">ฉบับร่าง</span>'}</td>
        <td class="px-3 py-3 hidden md:table-cell text-slate-600">${p.showInMenu ? `แสดง (ลำดับ ${p.menuOrder})` : '<span class="text-slate-400">ไม่แสดง</span>'}</td>
        <td class="px-3 py-3 hidden lg:table-cell text-slate-500">${fmtDate(p.updatedAt)}</td>
        <td class="px-5 py-3"><div class="flex justify-end gap-1.5">
          <a href="#/pages/${p.id}" class="btn btn-primary btn-sm">${icon('edit', 'w-3.5 h-3.5')} แก้ไข</a>
          <a href="/p/${esc(p.slug)}" target="_blank" class="btn btn-light btn-sm" title="เปิดดู">${icon('ext', 'w-3.5 h-3.5')}</a>
          <button class="btn btn-light btn-sm" data-cl="${esc(p.slug)}" title="คัดลอกลิงก์">${icon('link', 'w-3.5 h-3.5')}</button>
          <button class="btn btn-light btn-sm" data-dup="${p.id}" title="ทำสำเนา">${icon('copy', 'w-3.5 h-3.5')}</button>
          <button class="btn btn-danger btn-sm" data-del="${p.id}" title="ลบ">${icon('trash', 'w-3.5 h-3.5')}</button></div></td></tr>`).join('') || '<tr><td colspan="5" class="text-center py-12 text-slate-400">ยังไม่มีหน้าเว็บ</td></tr>'}</tbody></table></div></div>`;
  $$('[data-cl]').forEach(b => b.onclick = () => copyText(`${ORIGIN}/p/${b.dataset.cl}`));
  $$('[data-dup]').forEach(b => b.onclick = async () => { const c = await api('POST', `/pages/${b.dataset.dup}/duplicate`); ok('ทำสำเนาแล้ว'); location.hash = `#/pages/${c.id}`; });
  $$('[data-del]').forEach(b => b.onclick = async () => {
    const p = list.find(x => x.id === b.dataset.del);
    if (!(await confirmBox('ลบหน้าเว็บ?', `"${p.title}" จะถูกลบถาวร`, 'ลบ'))) return;
    await api('DELETE', `/pages/${p.id}`); ok('ลบแล้ว'); viewPages();
  });
  $('#newP').onclick = async () => {
    const r = await Swal.fire({
      title: 'สร้างหน้าเว็บใหม่', showCancelButton: true, confirmButtonText: 'สร้าง', cancelButtonText: 'ยกเลิก', reverseButtons: true,
      html: `<div class="text-left space-y-3"><div><label class="lbl">ชื่อหน้า</label><input id="sp-t" class="inp" placeholder="เช่น ประกาศรับสมัครงาน"></div>
        <div><label class="lbl">Slug (ลิงก์ /p/...)</label><input id="sp-s" class="inp font-mono" placeholder="เช่น jobs"></div></div>`,
      preConfirm: () => {
        const title = $('#sp-t').value.trim(), slug = $('#sp-s').value.trim();
        if (!title) return Swal.showValidationMessage('กรุณากรอกชื่อหน้า');
        if (!slug || !/^[a-z0-9-_]+$/i.test(slug)) return Swal.showValidationMessage('กรุณากรอก slug (a-z 0-9 - _)');
        return { title, slug, status: 'draft', blocks: [{ type: 'text', content: '' }] };
      },
    });
    if (!r.isConfirmed) return;
    try { const p = await api('POST', '/pages', r.value); location.hash = `#/pages/${p.id}`; } catch (e) { fail(e.message); }
  };
}

const BLOCK_META = {
  heading: ['หัวข้อ', 'heading'], text: ['ข้อความ', 'text'], image: ['ภาพ', 'image'], video: ['วีดีโอ', 'video'],
  button: ['ปุ่มลิงก์', 'link'], widget: ['ส่วนแสดงผล', 'widget'], notice: ['กล่องประกาศ', 'bell'], file: ['ไฟล์เอกสาร', 'file'],
  html: ['HTML', 'html'], divider: ['เส้นคั่น', 'minus'],
};
async function viewPageEditor(id) {
  const [p, widgets] = await Promise.all([api('GET', `/pages/${id}`), api('GET', '/widgets')]);
  const markDirty = () => { state.dirty = true; $('#dirtyDot').classList.remove('hidden'); $('#saveBtn').classList.add('ring-4', 'ring-gold-400/40'); };

  $('#view').innerHTML = `
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
    <div class="flex items-center gap-3 min-w-0">
      <a href="#/pages" class="p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200">${icon('back', 'w-5 h-5')}</a>
      <div class="min-w-0"><div class="text-xs text-slate-500">หน้าเว็บเผยแพร่</div><h1 class="text-xl font-bold text-slate-900 truncate" id="pTitle">${esc(p.title)}</h1></div>
      <span id="dirtyDot" class="hidden text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">ยังไม่บันทึก</span>
    </div>
    <div class="flex flex-wrap gap-2">
      <button class="btn btn-light" id="pvBtn">${icon('eye')} ดูตัวอย่าง</button>
      <button class="btn btn-primary" id="saveBtn">${icon('save')} บันทึก</button>
    </div>
  </div>
  <div class="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
    <div><div id="blocks" class="space-y-3"></div>
      <div class="mt-4 card p-4"><div class="text-sm font-semibold text-slate-600 mb-3">เพิ่มบล็อกเนื้อหา</div>
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-2">${Object.entries(BLOCK_META).map(([k, [n, i]]) => `<button class="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-200 hover:border-navy-400 hover:bg-navy-50 text-slate-600 hover:text-navy-800 transition" data-addb="${k}">${icon(i, 'w-5 h-5')}<span class="text-xs font-medium">${n}</span></button>`).join('')}</div></div>
    </div>
    <div class="space-y-4 lg:sticky lg:top-20">
      <div class="card p-4 space-y-4" id="pset"></div>
    </div>
  </div>`;

  const drawSettings = () => {
    const S = $('#pset');
    S.innerHTML = `
      <div><label class="lbl">สถานะ</label><div class="seg">${[['draft', 'ฉบับร่าง'], ['published', 'เผยแพร่']].map(([v, t]) => `<button data-st="${v}" class="${p.status === v ? 'on' : ''}">${t}</button>`).join('')}</div></div>
      <div><label class="lbl">ชื่อหน้า</label><input class="inp" data-p="title" value="${esc(p.title)}"></div>
      <div><label class="lbl">Slug</label><div class="flex"><span class="px-2.5 py-2 text-sm bg-slate-100 border border-r-0 border-slate-300 rounded-l-lg text-slate-500">/p/</span><input class="inp !rounded-l-none font-mono" data-p="slug" value="${esc(p.slug)}"></div></div>
      <div><label class="lbl">คำอธิบายสั้น</label><textarea class="inp" rows="2" data-p="description">${esc(p.description)}</textarea></div>
      <div><label class="lbl">ภาพปก (ไม่บังคับ)</label>
        ${p.cover ? `<div class="relative rounded-lg overflow-hidden border border-slate-200 aspect-[16/7] mb-2"><img src="${esc(p.cover)}" class="w-full h-full object-cover"><button class="absolute top-1.5 right-1.5 p-1 rounded-md bg-white/90 text-rose-600" id="rmCover">${icon('x')}</button></div>` : ''}
        <button class="btn btn-light btn-sm w-full" id="pickCover">${icon('media', 'w-3.5 h-3.5')} ${p.cover ? 'เปลี่ยนภาพปก' : 'เลือกภาพปก'}</button></div>
      <div class="pt-3 border-t border-slate-100 space-y-2">
        <label class="flex items-center justify-between text-sm"><span>แสดงในเมนูด้านบน</span><input type="checkbox" class="tgl" data-p="showInMenu" ${p.showInMenu ? 'checked' : ''}></label>
        <div class="flex items-center justify-between text-sm"><span>ลำดับในเมนู</span><input type="number" class="inp !w-20 text-center" data-p="menuOrder" value="${p.menuOrder || 0}"></div>
      </div>
      <div class="pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-2">
        <div class="flex items-center gap-2"><span class="flex-1 truncate font-mono">${ORIGIN}/p/${esc(p.slug)}</span><button class="btn btn-light btn-sm" id="cpLink">${icon('copy', 'w-3.5 h-3.5')}</button></div>
        <div>แก้ไขล่าสุด: ${fmtDate(p.updatedAt)}</div>
      </div>`;
    $$('[data-p]', S).forEach(i => i.addEventListener('input', () => {
      p[i.dataset.p] = i.type === 'checkbox' ? i.checked : i.type === 'number' ? Number(i.value) : i.value;
      if (i.dataset.p === 'slug') i.value = p.slug = i.value.toLowerCase().replace(/[^a-z0-9\-_]/g, '-');
      markDirty();
    }));
    $$('[data-st]', S).forEach(b => b.onclick = () => { p.status = b.dataset.st; markDirty(); drawSettings(); });
    $('#pickCover').onclick = async () => { const u = await pickMedia('image'); if (u) { p.cover = u; markDirty(); drawSettings(); } };
    const rc = $('#rmCover'); if (rc) rc.onclick = () => { p.cover = ''; markDirty(); drawSettings(); };
    $('#cpLink').onclick = () => copyText(`${ORIGIN}/p/${p.slug}`);
  };

  const alignSeg = (b, opts = ['left', 'center', 'right']) => `<div class="seg !w-auto">${opts.map(a => `<button data-al="${a}" class="${b.align === a ? 'on' : ''} !px-2.5">${{ left: 'ซ้าย', center: 'กลาง', right: 'ขวา', justify: 'เต็ม' }[a]}</button>`).join('')}</div>`;
  const blockBody = b => {
    switch (b.type) {
      case 'heading': return `<div class="flex gap-2"><select class="inp !w-24" data-b="level">${[2, 3, 4].map(l => `<option value="${l}" ${b.level == l ? 'selected' : ''}>H${l}</option>`).join('')}</select><input class="inp font-semibold" data-b="text" value="${esc(b.text)}" placeholder="ข้อความหัวข้อ"></div><div class="mt-2">${alignSeg(b)}</div>`;
      case 'text': return `<textarea class="inp leading-relaxed" rows="5" data-b="content" placeholder="พิมพ์เนื้อหา... (เว้นบรรทัดว่างเพื่อขึ้นย่อหน้าใหม่, **ตัวหนา**, ลิงก์ https:// จะคลิกได้อัตโนมัติ)">${esc(b.content)}</textarea><div class="mt-2">${alignSeg(b, ['left', 'center', 'right', 'justify'])}</div>`;
      case 'image': return `<div class="flex gap-3"><div class="w-40 aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 chk-pattern grid place-items-center flex-none">${b.src ? `<img src="${esc(b.src)}" class="w-full h-full object-contain">` : icon('image', 'w-7 h-7 text-slate-300')}</div>
        <div class="flex-1 space-y-2"><button class="btn btn-light btn-sm" data-pk="image">${icon('media', 'w-3.5 h-3.5')} เลือก / อัปโหลดภาพ</button>
        <input class="inp text-sm" data-b="caption" value="${esc(b.caption)}" placeholder="คำบรรยายใต้ภาพ"><input class="inp text-sm" data-b="link" value="${esc(b.link)}" placeholder="ลิงก์เมื่อคลิกภาพ (ไม่บังคับ)">
        <select class="inp text-sm" data-b="width">${[['full', 'เต็มความกว้าง'], ['wide', 'กว้าง'], ['medium', 'กลาง'], ['small', 'เล็ก']].map(([v, t]) => `<option value="${v}" ${b.width === v ? 'selected' : ''}>${t}</option>`).join('')}</select></div></div>`;
      case 'video': return `<div class="flex gap-2"><input class="inp" data-b="src" value="${esc(b.src)}" placeholder="ลิงก์ YouTube / Facebook หรือไฟล์ mp4"><button class="btn btn-light btn-sm" data-pk="video">${icon('upload', 'w-3.5 h-3.5')} อัปโหลด</button></div><input class="inp text-sm mt-2" data-b="caption" value="${esc(b.caption)}" placeholder="คำบรรยาย (ไม่บังคับ)">`;
      case 'button': return `<div class="grid sm:grid-cols-2 gap-2"><input class="inp" data-b="label" value="${esc(b.label)}" placeholder="ข้อความบนปุ่ม"><input class="inp" data-b="link" value="${esc(b.link)}" placeholder="https://..."></div>
        <div class="flex flex-wrap items-center gap-2 mt-2">${b.btn ? `<div class="px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">${UB.buttonHtml({ title: b.label || 'ลิงก์', iconFa: b.iconFa, style: b.btn }, { tag: 'div', cls: 'auto' })}</div><button class="btn btn-light btn-sm" data-bdel title="กลับไปใช้แบบพื้นฐาน">${icon('x', 'w-3.5 h-3.5')}</button>` : `<div class="seg !w-auto">${[['primary', 'สีหลัก'], ['accent', 'สีทอง'], ['outline', 'เส้นขอบ']].map(([v, t]) => `<button data-bst="${v}" class="${b.style === v ? 'on' : ''} !px-2.5">${t}</button>`).join('')}</div>`}
          <button class="btn btn-primary btn-sm" data-bdesign>🎨 ออกแบบปุ่ม / ไอคอน</button>${alignSeg(b)}
        <label class="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" class="tgl" data-b="newTab" ${b.newTab ? 'checked' : ''}> แท็บใหม่</label></div>`;
      case 'widget': return `<select class="inp" data-b="widgetSlug"><option value="">— เลือกส่วนแสดงผล —</option>${widgets.map(w => `<option value="${esc(w.slug)}" ${b.widgetSlug === w.slug ? 'selected' : ''}>${esc(w.name)} (${LAYOUT_NAME[w.layout]})</option>`).join('')}</select>
        <label class="flex items-center gap-2 text-sm text-slate-600 mt-2"><input type="checkbox" class="tgl" data-b="full" ${b.full ? 'checked' : ''}> แสดงรายการทั้งหมด (ไม่จำกัดจำนวน — เหมาะกับหน้า “ดูทั้งหมด”)</label>`;
      case 'notice': return `<div class="seg mb-2">${[['info', 'ข้อมูล'], ['success', 'สำเร็จ'], ['warning', 'เตือน'], ['danger', 'สำคัญ']].map(([v, t]) => `<button data-tone="${v}" class="${b.tone === v ? 'on' : ''}">${t}</button>`).join('')}</div><input class="inp font-semibold" data-b="title" value="${esc(b.title)}" placeholder="หัวข้อประกาศ"><textarea class="inp mt-2" rows="3" data-b="content" placeholder="รายละเอียด">${esc(b.content)}</textarea>`;
      case 'file': return `<div class="flex gap-2"><input class="inp" data-b="src" value="${esc(b.src)}" placeholder="ลิงก์ไฟล์"><button class="btn btn-light btn-sm" data-pk="file">${icon('upload', 'w-3.5 h-3.5')} เลือกไฟล์</button></div>
        <div class="grid sm:grid-cols-2 gap-2 mt-2"><input class="inp" data-b="title" value="${esc(b.title)}" placeholder="ชื่อเอกสาร"><input class="inp" data-b="note" value="${esc(b.note)}" placeholder="รายละเอียด เช่น ประกาศ ณ วันที่..."></div>`;
      case 'html': return `<textarea class="inp font-mono text-xs" rows="6" data-b="html" placeholder="<div>...</div>">${esc(b.html)}</textarea><p class="text-xs text-amber-700 mt-1">⚠ ใช้โค้ดจากแหล่งที่เชื่อถือได้เท่านั้น</p>`;
      case 'divider': return `<hr class="border-slate-300">`;
    }
    return '';
  };
  const drawBlocks = () => {
    const B = $('#blocks');
    B.innerHTML = p.blocks.map((b, i) => {
      const [n, ic] = BLOCK_META[b.type];
      return `<div class="card group" draggable="false" data-bi="${i}">
        <div class="flex items-center gap-2 px-4 py-2 border-b border-slate-100 bg-slate-50/70 rounded-t-[.85rem]">
          <span class="cursor-grab text-slate-300 hover:text-slate-500" data-handle>${icon('grip')}</span>
          <span class="flex items-center gap-1.5 text-xs font-semibold text-slate-600">${icon(ic, 'w-3.5 h-3.5')} ${n}</span>
          <div class="ml-auto flex items-center gap-0.5">
            <button class="p-1.5 rounded hover:bg-white text-slate-400 hover:text-navy-800 disabled:opacity-20" data-bm="${i}:-1" ${i === 0 ? 'disabled' : ''}>${icon('up')}</button>
            <button class="p-1.5 rounded hover:bg-white text-slate-400 hover:text-navy-800 disabled:opacity-20" data-bm="${i}:1" ${i === p.blocks.length - 1 ? 'disabled' : ''}>${icon('down')}</button>
            <button class="p-1.5 rounded hover:bg-white text-slate-400 hover:text-navy-800" data-bd="${i}" title="ทำสำเนา">${icon('copy')}</button>
            <button class="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600" data-br="${i}" title="ลบ">${icon('trash')}</button>
          </div></div>
        <div class="p-4">${blockBody(b)}</div></div>`;
    }).join('') || `<div class="card p-10 text-center text-slate-400">ยังไม่มีเนื้อหา — เพิ่มบล็อกจากด้านล่าง</div>`;
    $$('[data-bi]', B).forEach(card => {
      const b = p.blocks[+card.dataset.bi];
      $$('[data-b]', card).forEach(i => i.addEventListener('input', () => { b[i.dataset.b] = i.type === 'checkbox' ? i.checked : i.value; markDirty(); }));
      $$('[data-al]', card).forEach(x => x.onclick = () => { b.align = x.dataset.al; markDirty(); drawBlocks(); });
      $$('[data-bst]', card).forEach(x => x.onclick = () => { b.style = x.dataset.bst; markDirty(); drawBlocks(); });
      const bd = $('[data-bdesign]', card); if (bd) bd.onclick = async () => {
        const proxy = { title: b.label, iconFa: b.iconFa || '', style: b.btn || UB.fromLegacy(b.style === 'accent' ? 'accent' : b.style === 'outline' ? 'outline' : 'primary', state.settings.primary) };
        if (await designButton(proxy)) { b.btn = proxy.style; b.iconFa = proxy.iconFa; b.label = proxy.title; markDirty(); drawBlocks(); }
      };
      const bx = $('[data-bdel]', card); if (bx) bx.onclick = () => { b.btn = null; b.iconFa = ''; markDirty(); drawBlocks(); };
      $$('[data-tone]', card).forEach(x => x.onclick = () => { b.tone = x.dataset.tone; markDirty(); drawBlocks(); });
      $$('[data-pk]', card).forEach(x => x.onclick = async () => {
        const u = await pickMedia(x.dataset.pk === 'file' ? 'any' : x.dataset.pk); if (!u) return;
        b.src = u; if (b.type === 'file' && !b.title) b.title = decodeURIComponent(u.split('/').pop());
        markDirty(); drawBlocks();
      });
      // drag via handle
      const h = $('[data-handle]', card);
      h.addEventListener('mousedown', () => card.draggable = true);
      card.addEventListener('dragend', () => { card.draggable = false; card.classList.remove('dragging'); });
      card.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', card.dataset.bi); card.classList.add('dragging'); });
      card.addEventListener('dragover', e => { e.preventDefault(); card.classList.add('drag-over'); });
      card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
      card.addEventListener('drop', e => {
        e.preventDefault(); card.classList.remove('drag-over');
        const from = +e.dataTransfer.getData('text/plain'), to = +card.dataset.bi;
        if (Number.isNaN(from) || from === to) return;
        const [m] = p.blocks.splice(from, 1); p.blocks.splice(to, 0, m); markDirty(); drawBlocks();
      });
    });
    $$('[data-bm]', B).forEach(x => x.onclick = () => { const [i, d] = x.dataset.bm.split(':').map(Number); [p.blocks[i], p.blocks[i + d]] = [p.blocks[i + d], p.blocks[i]]; markDirty(); drawBlocks(); });
    $$('[data-bd]', B).forEach(x => x.onclick = () => { const i = +x.dataset.bd; p.blocks.splice(i + 1, 0, { ...clone(p.blocks[i]), id: rid() }); markDirty(); drawBlocks(); });
    $$('[data-br]', B).forEach(x => x.onclick = async () => { if (!(await confirmBox('ลบบล็อกนี้?', '', 'ลบ'))) return; p.blocks.splice(+x.dataset.br, 1); markDirty(); drawBlocks(); });
  };
  const DEF = {
    heading: { text: '', level: 2, align: 'left' }, text: { content: '', align: 'left' }, image: { src: '', caption: '', link: '', width: 'full' },
    video: { src: '', caption: '' }, button: { label: '', link: '', style: 'primary', align: 'left', newTab: true }, widget: { widgetSlug: '', full: true },
    notice: { tone: 'info', title: '', content: '' }, file: { title: '', src: '', note: '' }, html: { html: '' }, divider: {},
  };
  $$('[data-addb]').forEach(x => x.onclick = () => {
    p.blocks.push({ id: rid(), type: x.dataset.addb, ...clone(DEF[x.dataset.addb]) }); markDirty(); drawBlocks();
    const last = $('#blocks').lastElementChild; last && last.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  const save = async () => {
    if (!p.title.trim()) return fail('กรุณากรอกชื่อหน้า');
    try {
      const r = await api('PUT', `/pages/${id}`, p);
      Object.assign(p, r); state.dirty = false;
      $('#dirtyDot').classList.add('hidden'); $('#saveBtn').classList.remove('ring-4', 'ring-gold-400/40');
      $('#pTitle').textContent = p.title; drawSettings(); ok('บันทึกเรียบร้อย'); return true;
    } catch (e) { fail(e.message); return false; }
  };
  $('#saveBtn').onclick = save;
  $('#pvBtn').onclick = async () => {
    if (state.dirty && !(await save())) return;
    window.open(`/p/${p.slug}`, '_blank');
  };
  document.onkeydown = e => { if ((e.ctrlKey || e.metaKey) && e.key === 's' && $('#saveBtn')) { e.preventDefault(); save(); } };
  drawSettings(); drawBlocks();
}

/* ================================================================
 * Intro pages (หน้า Intro)
 * ================================================================ */
const loadedFonts = new Set();
function ensureFont(...names) {
  const need = names.filter(n => n && !loadedFonts.has(n));
  if (!need.length) return;
  need.forEach(n => loadedFonts.add(n));
  const url = UB.fontUrl(need); if (!url) return;
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = url; document.head.appendChild(l);
}
const getP = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
const setP = (o, p, v) => { const ks = p.split('.'); const last = ks.pop(); ks.reduce((a, k) => (a[k] = a[k] || {}), o)[last] = v; };

async function viewIntros() {
  const list = await api('GET', '/intros');
  $('#view').innerHTML = `${pageHead('หน้า Intro', 'หน้าแรกเต็มจอก่อนเข้าเว็บไซต์ — เปลี่ยนภาพ ออกแบบปุ่ม เมนูย่อย และแอนิเมชันได้', `<button class="btn btn-light" id="demoI">${icon('widget')} เพิ่มตัวอย่าง</button><button class="btn btn-primary" id="newI">${icon('plus')} สร้างหน้า Intro</button>`)}
  <div class="grid md:grid-cols-2 2xl:grid-cols-3 gap-4">${list.map(it => `
    <div class="card overflow-hidden flex flex-col ${it.isMain ? 'ring-2 ring-gold-400' : ''}">
      <div class="aspect-video bg-slate-900 relative overflow-hidden">
        <iframe src="/intro/${esc(it.slug)}" class="absolute top-0 left-0 border-0 pointer-events-none origin-top-left" style="width:1440px;height:810px;transform:scale(var(--s,.3))" data-thumb loading="lazy" tabindex="-1"></iframe>
        <a href="#/intros/${it.id}" class="absolute inset-0"></a>
        ${it.isMain ? '<span class="absolute top-2 left-2 text-xs px-2 py-1 rounded-full bg-gold-500 text-white font-semibold">★ หน้า Intro หลัก</span>' : ''}
      </div>
      <div class="p-4 flex-1 flex flex-col">
        <a href="#/intros/${it.id}" class="font-semibold text-slate-900 hover:text-navy-700">${esc(it.name)}</a>
        <div class="text-xs text-slate-500 font-mono mt-1">/intro/${esc(it.slug)}</div>
        <div class="text-xs text-slate-500 mt-2">${it.buttons.length} ปุ่ม · แก้ไขล่าสุด ${fmtDate(it.updatedAt)}</div>
        <div class="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-slate-100">
          <a href="#/intros/${it.id}" class="btn btn-primary btn-sm flex-1">${icon('edit', 'w-3.5 h-3.5')} แก้ไข</a>
          <a href="/intro/${esc(it.slug)}" target="_blank" class="btn btn-light btn-sm" title="เปิดดู">${icon('ext', 'w-3.5 h-3.5')}</a>
          ${it.isMain ? '' : `<button class="btn btn-light btn-sm" data-main="${it.id}" title="ตั้งเป็นหน้า Intro หลัก (/intro)">★ ตั้งเป็นหลัก</button>`}
          <button class="btn btn-light btn-sm" data-dupi="${it.id}" title="ทำสำเนา">${icon('copy', 'w-3.5 h-3.5')}</button>
          <button class="btn btn-danger btn-sm" data-deli="${it.id}" title="ลบ">${icon('trash', 'w-3.5 h-3.5')}</button>
        </div>
      </div>
    </div>`).join('') || '<div class="col-span-full card p-12 text-center text-slate-500">ยังไม่มีหน้า Intro</div>'}</div>
  <p class="text-xs text-slate-500 mt-4">ทำสำเนาหน้า Intro เดิมไว้สำหรับวาระพิเศษ (เช่น วันสำคัญ) แล้วกด “ตั้งเป็นหลัก” เมื่อต้องการสลับ — ลิงก์ <span class="font-mono">/intro</span> จะแสดงหน้าหลักเสมอ</p>`;
  $$('[data-thumb]').forEach(f => { const w = f.parentElement.clientWidth; f.style.setProperty('--s', w / 1440); });
  $('#newI').onclick = async () => {
    const r = await Swal.fire({ title: 'สร้างหน้า Intro', showCancelButton: true, confirmButtonText: 'สร้าง', cancelButtonText: 'ยกเลิก', reverseButtons: true,
      html: `<div class="text-left space-y-3"><div><label class="lbl">ชื่อ (ภายใน)</label><input id="si-n" class="inp" placeholder="เช่น Intro วันแม่ 2569"></div><div><label class="lbl">Slug (ลิงก์ /intro/...)</label><input id="si-s" class="inp font-mono" placeholder="เช่น mothers-day"></div></div>`,
      preConfirm: () => { const name = $('#si-n').value.trim(), slug = $('#si-s').value.trim(); if (!name) return Swal.showValidationMessage('กรุณากรอกชื่อ'); if (slug && !/^[a-z0-9-_]+$/i.test(slug)) return Swal.showValidationMessage('slug ใช้ได้เฉพาะ a-z 0-9 - _'); return { name, slug, title: state.settings.siteName }; } });
    if (!r.isConfirmed) return;
    const it = await api('POST', '/intros', r.value); location.hash = `#/intros/${it.id}`;
  };
  $('#demoI').onclick = async () => { const it = await api('POST', '/intros/demo'); ok('เพิ่มตัวอย่างแล้ว'); location.hash = `#/intros/${it.id}`; };
  $$('[data-main]').forEach(b => b.onclick = async () => { await api('POST', `/intros/${b.dataset.main}/main`); ok('ตั้งเป็นหน้า Intro หลักแล้ว'); viewIntros(); });
  $$('[data-dupi]').forEach(b => b.onclick = async () => { const c = await api('POST', `/intros/${b.dataset.dupi}/duplicate`); ok('ทำสำเนาแล้ว'); location.hash = `#/intros/${c.id}`; });
  $$('[data-deli]').forEach(b => b.onclick = async () => { const it = list.find(x => x.id === b.dataset.deli); if (!(await confirmBox('ลบหน้า Intro?', it.name, 'ลบ'))) return; await api('DELETE', `/intros/${it.id}`); ok('ลบแล้ว'); viewIntros(); });
}

function showIntroShare(it) {
  const url = `${ORIGIN}/intro/${it.slug}`, main = `${ORIGIN}/intro`;
  const ifr = `<iframe src="${url}" title="${it.title || it.name}" style="position:fixed;inset:0;width:100%;height:100%;border:0;z-index:9999"></iframe>`;
  const box = (label, val, hint) => `<div><div class="flex items-center justify-between mb-1.5"><label class="lbl !mb-0">${label}</label><button class="btn btn-light btn-sm" data-cp="${esc(val)}">${icon('copy', 'w-3.5 h-3.5')} คัดลอก</button></div>
    <textarea readonly class="inp font-mono text-xs !bg-slate-50" rows="${val.length > 90 ? 3 : 1}">${esc(val)}</textarea>${hint ? `<p class="text-xs text-slate-500 mt-1">${hint}</p>` : ''}</div>`;
  openModal({
    title: `นำหน้า Intro ไปใช้ — ${esc(it.name)}`, size: 'max-w-2xl',
    body: `<div class="space-y-5">
      <div class="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
        <div class="font-semibold text-emerald-900">แนะนำ: ดาวน์โหลดเป็นไฟล์ HTML (ฝังภาพไว้ในไฟล์)</div>
        <p class="text-sm text-emerald-900/80 mt-1">ได้ไฟล์ <span class="font-mono">index.html</span> ไฟล์เดียว นำไปวางเป็นหน้า Intro ของเว็บศาลได้ทันที ไม่เรียกเครื่องแม่ข่ายภายใน จึงไม่ขึ้นหน้าต่างขอสิทธิ์ และบุคคลภายนอกเห็นภาพครบ</p>
        <button class="btn btn-primary mt-3" data-dl>${icon('down')} ดาวน์โหลด index.html</button><div data-warn class="mt-3 space-y-1.5"></div>
      </div>
      ${box('ลิงก์หน้า Intro นี้', url)}
      ${box('ลิงก์หน้า Intro หลัก (เปลี่ยนตามที่ตั้งเป็นหลัก)', main, 'ใช้ลิงก์นี้ถ้าต้องการสลับหน้า Intro ตามวาระโดยไม่ต้องแก้เว็บศาล (ต้องเปิดเครื่องแม่ข่ายให้ภายนอกเข้าถึงได้)')}
      ${box('โค้ดฝังแบบเต็มหน้าจอ (iframe)', ifr, 'วางในหน้าเปล่าของระบบจัดการเว็บ — ถ้าเครื่องแม่ข่ายเป็น IP ภายใน ผู้ใช้ภายนอกจะมองไม่เห็นและ Chrome จะถามสิทธิ์เครือข่ายภายใน')}
    </div>`,
    onMount: el => {
      $$('[data-cp]', el).forEach(b => b.onclick = () => copyText(b.dataset.cp));
      $('[data-dl]', el).onclick = async () => {
        try {
          const r = await api('POST', `/intros/${it.id}/export`, { base: ORIGIN });
          $('[data-warn]', el).innerHTML = r.warnings.map(t => `<div class="text-xs p-2 rounded-lg bg-white border border-emerald-200 text-slate-700">• ${esc(t)}</div>`).join('');
          const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([r.html], { type: 'text/html' })); a.download = 'index.html'; a.click();
          setTimeout(() => URL.revokeObjectURL(a.href), 2000); ok(`ดาวน์โหลดแล้ว (${fmtSize(r.bytes)})`);
        } catch (e) { fail(e.message); }
      };
    },
  });
}

async function viewIntroEditor(id) {
  const it = clone(await api('GET', `/intros/${id}`));
  let tab = 'buttons', dev = 'desktop';
  const DEV = { desktop: [1440, 900], tablet: [820, 1180], phone: [390, 844] };
  ensureFont(it.font, ...it.buttons.map(b => b.style && b.style.font));
  const markDirty = () => { state.dirty = true; $('#dirtyDot').classList.remove('hidden'); $('#saveBtn').classList.add('ring-4', 'ring-gold-400/40'); refresh(); };
  $('#view').innerHTML = `
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
    <div class="flex items-center gap-3 min-w-0">
      <a href="#/intros" class="p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200">${icon('back', 'w-5 h-5')}</a>
      <div class="min-w-0"><div class="text-xs text-slate-500">หน้า Intro</div><h1 class="text-xl font-bold text-slate-900 truncate" id="iTitle">${esc(it.name)}</h1></div>
      <span id="dirtyDot" class="hidden text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">ยังไม่บันทึก</span>
    </div>
    <div class="flex flex-wrap gap-2">
      <button class="btn btn-light" id="shareBtn">${icon('code')} นำไปใช้ / ส่งออก</button>
      <a class="btn btn-light" id="openBtn" href="/intro/${esc(it.slug)}" target="_blank">${icon('ext')} เปิดดู</a>
      <button class="btn btn-primary" id="saveBtn">${icon('save')} บันทึก</button>
    </div>
  </div>
  <div class="grid xl:grid-cols-[440px_1fr] gap-5 items-start">
    <div class="card overflow-hidden">
      <div class="flex border-b border-slate-200 bg-slate-50/60 overflow-x-auto" id="itabs">${[['buttons', 'ปุ่ม'], ['bg', 'ภาพพื้นหลัง'], ['bar', 'แถบปุ่ม'], ['anim', 'แอนิเมชัน'], ['general', 'ทั่วไป']].map(([k, t]) => `<button data-t="${k}" class="flex-1 px-3 py-3 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap">${t}</button>`).join('')}</div>
      <div id="ipanel" class="p-4"></div>
    </div>
    <div class="xl:sticky xl:top-20 space-y-3 min-w-0">
      <div class="card p-3 flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2 text-sm font-semibold text-slate-700">${icon('eye')} ตัวอย่าง <span class="text-xs font-normal text-slate-400">(ยังไม่บันทึกจริง)</span></div>
        <div class="flex items-center gap-2"><button class="btn btn-light btn-sm" id="replay">▶ เล่นแอนิเมชันอีกครั้ง</button>
          <div class="seg" id="idev">${[['desktop', 'desktop'], ['tablet', 'tablet'], ['phone', 'phone']].map(([k, i]) => `<button data-d="${k}" class="!px-2.5" title="${k}">${icon(i)}</button>`).join('')}</div></div>
      </div>
      <div class="card p-4 bg-slate-800 overflow-hidden" id="pvBox"><div id="pvScale" class="mx-auto relative overflow-hidden rounded-lg shadow-2xl"><iframe id="ipv" class="absolute top-0 left-0 border-0 origin-top-left bg-black" sandbox="allow-scripts allow-same-origin allow-popups"></iframe></div>
        <p class="text-xs text-slate-400 mt-3 text-center" id="pvInfo"></p></div>
    </div>
  </div>`;
  const pv = $('#ipv');
  const fit = () => {
    const [W, H] = DEV[dev], box = $('#pvBox').clientWidth - 32, maxH = window.innerHeight - 220;
    const s = Math.min(box / W, maxH / H, 1);
    Object.assign(pv.style, { width: W + 'px', height: H + 'px', transform: `scale(${s})` });
    Object.assign($('#pvScale').style, { width: W * s + 'px', height: H * s + 'px' });
    $('#pvInfo').textContent = `${W} × ${H} px · ย่อเหลือ ${Math.round(s * 100)}%`;
    $$('#idev button').forEach(b => b.classList.toggle('on', b.dataset.d === dev));
  };
  const refresh = debounce(async () => { try { pv.srcdoc = await api('POST', '/intros/preview', it); } catch (e) { /* ignore */ } }, 300);
  $$('#idev button').forEach(b => b.onclick = () => { dev = b.dataset.d; fit(); });
  $('#replay').onclick = () => { pv.srcdoc = pv.srcdoc.replace(/<!--r\d*-->|$/, `<!--r${Date.now()}-->`); };
  window.addEventListener('resize', debounce(() => { if (document.body.contains(pv)) fit(); }, 150));
  fit();

  $('#saveBtn').onclick = async () => {
    try {
      const r = await api('PUT', `/intros/${id}`, it); Object.assign(it, r); state.dirty = false;
      $('#dirtyDot').classList.add('hidden'); $('#saveBtn').classList.remove('ring-4', 'ring-gold-400/40');
      $('#iTitle').textContent = it.name; $('#openBtn').href = `/intro/${it.slug}`; ok('บันทึกเรียบร้อย'); if (tab === 'general') draw();
    } catch (e) { fail(e.message); }
  };
  document.onkeydown = e => { if ((e.ctrlKey || e.metaKey) && e.key === 's' && $('#saveBtn')) { e.preventDefault(); $('#saveBtn').click(); } };
  $('#shareBtn').onclick = async () => { if (state.dirty && (await confirmBox('ยังไม่ได้บันทึก', 'บันทึกก่อนนำไปใช้หรือไม่?', 'บันทึก', false))) await $('#saveBtn').onclick(); showIntroShare(it); };

  /* control helpers (data-p = path) */
  const H = t => `<div class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 mt-5 first:mt-0">${t}</div>`;
  const rng = (p, l, min, max, u = 'px') => `<div><div class="flex justify-between"><label class="lbl">${l}</label><span class="text-xs text-slate-500"><span data-o="${p}">${getP(it, p)}</span>${u}</span></div><input type="range" class="w-full accent-navy-800" min="${min}" max="${max}" data-p="${p}" data-n value="${getP(it, p)}"></div>`;
  const tg = (p, l, rd) => `<label class="flex items-center justify-between gap-3 py-1.5 cursor-pointer"><span class="text-sm text-slate-700">${l}</span><input type="checkbox" class="tgl" data-p="${p}" ${getP(it, p) ? 'checked' : ''} ${rd ? 'data-rd' : ''}></label>`;
  const sg = (p, opts) => `<div class="seg flex-wrap">${opts.map(([v, t]) => `<button data-sp="${p}" data-v="${v}" class="${String(getP(it, p)) === String(v) ? 'on' : ''}">${t}</button>`).join('')}</div>`;
  const col = (p, l) => `<div><label class="lbl">${l}</label><div class="flex gap-2"><input type="color" class="h-9 w-11 rounded border border-slate-300 cursor-pointer" data-p="${p}" value="${getP(it, p)}"><input class="inp font-mono text-xs" data-px="${p}" value="${getP(it, p)}"></div></div>`;
  const txt = (p, l, ph = '') => `<div><label class="lbl">${l}</label><input class="inp" data-p="${p}" value="${esc(getP(it, p) || '')}" placeholder="${esc(ph)}"></div>`;
  const media = (p, l, hint) => `<div><label class="lbl">${l}</label><div class="flex gap-3 items-center"><div class="w-36 aspect-video rounded-lg overflow-hidden border border-slate-200 chk-pattern grid place-items-center flex-none">${getP(it, p) ? `<img src="${esc(getP(it, p))}" class="w-full h-full object-cover">` : icon('image', 'w-6 h-6 text-slate-300')}</div>
    <div class="flex-1 space-y-1.5"><button class="btn btn-primary btn-sm w-full" data-pick="${p}">${icon('upload', 'w-3.5 h-3.5')} เลือก / อัปโหลดภาพ</button>${getP(it, p) ? `<button class="btn btn-light btn-sm w-full" data-clr="${p}">เอาภาพออก</button>` : ''}</div></div>${hint ? `<p class="text-xs text-slate-500 mt-1.5">${hint}</p>` : ''}</div>`;
  const bind = P => {
    $$('[data-p]', P).forEach(i => i.addEventListener('input', () => {
      const v = i.type === 'checkbox' ? i.checked : i.dataset.n !== undefined || i.type === 'number' ? Number(i.value) : i.value;
      setP(it, i.dataset.p, v);
      const o = $(`[data-o="${i.dataset.p}"]`, P); if (o) o.textContent = i.value;
      const x = $(`[data-px="${i.dataset.p}"]`, P); if (x) x.value = i.value;
      if (i.dataset.p === 'font') ensureFont(v);
      markDirty(); if (i.dataset.rd !== undefined) draw();
    }));
    $$('[data-px]', P).forEach(i => i.addEventListener('change', () => { if (/^#[0-9a-f]{6}$/i.test(i.value)) { setP(it, i.dataset.px, i.value); markDirty(); draw(); } }));
    $$('[data-sp]', P).forEach(b => b.onclick = () => { const v = b.dataset.v; setP(it, b.dataset.sp, isNaN(v) || v === '' ? v : Number(v)); markDirty(); draw(); });
    $$('[data-pick]', P).forEach(b => b.onclick = async () => { const u = await pickMedia('image'); if (u) { setP(it, b.dataset.pick, u); markDirty(); draw(); } });
    $$('[data-clr]', P).forEach(b => b.onclick = () => { setP(it, b.dataset.clr, ''); markDirty(); draw(); });
  };
  const drawTabs = () => $$('#itabs button').forEach(b => { const on = b.dataset.t === tab; b.className = `flex-1 px-3 py-3 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap ${on ? 'border-navy-800 text-navy-800 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`; });
  $$('#itabs button').forEach(b => b.onclick = () => { tab = b.dataset.t; drawTabs(); draw(); });

  function draw() {
    const P = $('#ipanel');
    if (tab === 'buttons') return drawButtons(P);
    if (tab === 'bg') P.innerHTML = `<div class="space-y-4">
      ${media('bg.image', 'ภาพ Intro (จอคอมพิวเตอร์)', 'แนะนำ 1920 × 1080 px ขึ้นไป ไฟล์ JPG ไม่เกิน 1–2 MB')}
      ${media('bg.imageMobile', 'ภาพสำหรับมือถือ (ไม่บังคับ)', 'ภาพแนวตั้ง เช่น 1080 × 1920 — ถ้าไม่ใส่ จะใช้ภาพหลักแล้วครอปให้พอดีจอ')}
      ${H('การแสดงภาพ')}
      ${sg('bg.fit', [['cover', 'เต็มจอพอดี (ครอป)'], ['contain', 'เห็นครบทั้งภาพ'], ['fill', 'ยืดเต็มจอ'], ['width', 'เต็มความกว้าง']])}
      <p class="text-xs text-slate-500 -mt-2">${{ cover: 'เต็มหน้าจอทุกขนาด ไม่มีขอบ — ขอบภาพบางส่วนอาจถูกตัด (แนะนำ)', contain: 'เห็นภาพครบ ส่วนที่เหลือเติมด้วยพื้นหลัง', fill: 'ยืดภาพให้เต็มจอ — สัดส่วนภาพอาจผิดเพี้ยน', width: 'กว้างเต็มจอ ความสูงตามสัดส่วนภาพ' }[it.bg.fit]}</p>
      ${it.bg.fit !== 'fill' ? `<div><label class="lbl">จุดยึดภาพ (ส่วนที่ต้องการให้เห็นเสมอ)</label>${sg('bg.pos', [['center', 'กลาง'], ['top', 'บน'], ['bottom', 'ล่าง'], ['left', 'ซ้าย'], ['right', 'ขวา']])}</div>` : ''}
      ${it.bg.fit === 'contain' ? tg('bg.blurBack', 'พื้นหลังเป็นภาพเดียวกันแบบเบลอ (แทนสีพื้น)') : ''}
      ${col('bg.color', 'สีพื้นหลัง')}
      ${H('เอฟเฟกต์')}
      ${tg('bg.kenburns', 'ภาพซูมช้าๆ (Ken Burns)')}
      ${rng('bg.blur', 'เบลอภาพ', 0, 20)}
      <div class="grid grid-cols-2 gap-3">${col('bg.overlay', 'สีชั้นทับภาพ')}<div>${rng('bg.overlayOpacity', 'ความเข้ม', 0, 90, '%')}</div></div>
      ${H('ข้อความบนภาพ (ถ้าภาพไม่มีข้อความ)')}
      ${tg('head.show', 'แสดงข้อความบนภาพ', true)}
      ${it.head.show ? `<div class="space-y-3">${txt('head.text', 'หัวข้อ', 'เช่น ศาลจังหวัดอุดรธานี')}${txt('head.sub', 'ข้อความรอง', 'เช่น ยินดีต้อนรับ')}
        <div class="grid grid-cols-2 gap-3">${col('head.color', 'สีข้อความ')}<div>${rng('head.size', 'ขนาด', 16, 96)}</div></div>
        <div><label class="lbl">ตำแหน่ง</label>${sg('head.pos', [['top', 'บนสุด'], ['upper', 'ค่อนบน'], ['center', 'กลางจอ']])}</div>${tg('head.shadow', 'เงาตัวอักษร')}</div>` : ''}
    </div>`;
    if (tab === 'bar') P.innerHTML = `<div class="space-y-4">
      ${H('ตำแหน่ง')}
      <div><label class="lbl">ตำแหน่งแถบปุ่ม</label>${sg('bar.pos', [['bottom', 'ด้านล่าง'], ['center', 'กลางจอ'], ['top', 'ด้านบน']])}</div>
      <div><label class="lbl">จัดแนว</label>${sg('bar.align', [['left', 'ซ้าย'], ['center', 'กลาง'], ['right', 'ขวา']])}</div>
      ${rng('bar.offset', 'ระยะห่างจากขอบจอ', 0, 160)}
      ${H('พื้นหลังแถบ')}
      ${sg('bar.style', [['glass', 'กระจกฝ้า'], ['solid', 'สีทึบ'], ['none', 'ไม่มีพื้นหลัง']])}
      ${it.bar.style !== 'none' ? `<div class="grid grid-cols-2 gap-3">${col('bar.bg', 'สีแถบ')}<div>${rng('bar.opacity', 'ความทึบ', 0, 100, '%')}</div></div>${rng('bar.radius', 'ความมนของมุมแถบ', 0, 40)}${rng('bar.pad', 'ขอบด้านในแถบ', 0, 40)}` : ''}
      ${H('ขนาดและการเรียงปุ่ม')}
      ${rng('bar.btnH', 'ความสูงปุ่ม', 32, 140)}${rng('bar.btnW', 'ความกว้างขั้นต่ำของปุ่ม', 60, 480)}${rng('bar.gap', 'ระยะห่างระหว่างปุ่ม', 0, 40)}${rng('bar.maxWidth', 'ความกว้างสูงสุดของแถบ', 320, 1800)}
      <div><label class="lbl">จำนวนคอลัมน์ (0 = เรียงต่อกันอัตโนมัติ)</label>${sg('bar.cols', [[0, 'อัตโนมัติ'], [2, '2'], [3, '3'], [4, '4'], [5, '5'], [6, '6']])}</div>
      <div><label class="lbl">บนมือถือ</label>${sg('bar.mobileCols', [[1, '1 คอลัมน์'], [2, '2 คอลัมน์'], [3, '3 คอลัมน์']])}</div>
    </div>`;
    if (tab === 'anim') P.innerHTML = `<div class="space-y-4">
      <div class="p-3 rounded-xl bg-navy-50 border border-navy-100 text-xs text-slate-600">กด “▶ เล่นแอนิเมชันอีกครั้ง” เหนือตัวอย่างเพื่อดูผล · ผู้ที่ตั้งค่าลดการเคลื่อนไหวในเครื่องจะเห็นแบบไม่มีแอนิเมชันโดยอัตโนมัติ</div>
      ${H('แถบปุ่มเมื่อโหลดหน้า')}
      ${sg('anim.bar', [['slide-up', 'ลอยขึ้นจากล่าง'], ['drop', 'ตกลงจากบน'], ['zoom', 'ขยายเข้า'], ['fade', 'ค่อยๆ ปรากฏ'], ['none', 'ไม่มี']])}
      ${H('ปุ่มแต่ละปุ่ม')}
      ${sg('anim.items', [['stagger-up', 'ทยอยลอยขึ้น'], ['pop', 'เด้งออกมา'], ['flip', 'พลิกขึ้น'], ['slide-left', 'เลื่อนจากขวา'], ['fade', 'ค่อยๆ ปรากฏ'], ['none', 'ไม่มี']])}
      ${H('จังหวะ')}
      ${rng('anim.delay', 'รอก่อนเริ่ม', 0, 3000, ' ms')}${rng('anim.duration', 'ความเร็ว (ระยะเวลา)', 200, 2000, ' ms')}${rng('anim.stagger', 'ระยะห่างระหว่างปุ่ม', 0, 600, ' ms')}
    </div>`;
    if (tab === 'general') P.innerHTML = `<div class="space-y-4">
      ${txt('name', 'ชื่อ (ใช้ภายใน)')}
      <div><label class="lbl">Slug</label><div class="flex"><span class="px-2.5 py-2 text-sm bg-slate-100 border border-r-0 border-slate-300 rounded-l-lg text-slate-500">/intro/</span><input class="inp !rounded-l-none font-mono" data-p="slug" value="${esc(it.slug)}"></div></div>
      ${txt('title', 'ชื่อหน้าเว็บ (แสดงบนแท็บเบราว์เซอร์)')}
      ${H('ฟอนต์หลักของหน้า')}
      <select class="inp" data-p="font">${UB.FONTS.filter(f => f[0]).map(([v, l]) => `<option value="${v}" ${it.font === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <div class="p-4 rounded-xl border border-slate-200 text-2xl text-center" style="font-family:'${esc(it.font)}',sans-serif">ศาลจังหวัดอุดรธานี ยินดีต้อนรับ 2569</div>
      <p class="text-xs text-slate-500">ฟอนต์ของแต่ละปุ่มเลือกแยกได้ในตัวออกแบบปุ่ม (ค่าเริ่มต้นใช้ฟอนต์หลัก)</p>
      ${H('เข้าสู่เว็บไซต์อัตโนมัติ')}
      ${tg('autoGo.on', 'พาไปยังเว็บไซต์อัตโนมัติเมื่อครบเวลา', true)}
      ${it.autoGo.on ? `<div class="grid grid-cols-[1fr_120px] gap-3">${txt('autoGo.link', 'ลิงก์ปลายทาง', 'https://udtc.coj.go.th/th/page/item/index/id/1')}<div><label class="lbl">วินาที</label><input type="number" class="inp" data-p="autoGo.seconds" value="${it.autoGo.seconds}" min="3" max="120"></div></div><p class="text-xs text-slate-500">ถ้าผู้ใช้แตะหน้าจอ การนับถอยหลังจะหยุดเอง</p>` : ''}
    </div>`;
    bind(P);
    const sl = $('[data-p="slug"]', P); if (sl) sl.addEventListener('input', () => { sl.value = sl.value.toLowerCase().replace(/[^a-z0-9\-_]/g, '-'); it.slug = sl.value; });
  }

  function drawButtons(P) {
    const B = it.buttons;
    P.innerHTML = `
      <div class="grid grid-cols-2 gap-2 mb-3"><button class="btn btn-primary" id="addB">${icon('plus')} เพิ่มปุ่ม</button><button class="btn btn-light" id="addDD">${icon('menu')} เพิ่มปุ่มเมนูย่อย</button></div>
      <div class="text-xs text-slate-500 mb-2 px-1">${B.length} ปุ่ม · ลากเพื่อจัดลำดับ · คลิกเพื่อแก้ไข</div>
      <div class="space-y-2" id="blist">${B.map((b, i) => `<div class="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-white hover:border-navy-300" draggable="true" data-bi="${i}">
        <span class="cursor-grab text-slate-300">${icon('grip')}</span>
        <button class="w-32 h-11 flex-none p-1 rounded-lg bg-slate-700" data-eb="${i}">${UB.buttonHtml({ ...b, link: '', style: { ...b.style, fontSize: 11, iconSize: Math.min(b.style.iconSize, 14), padX: 4, padY: 2, iconPos: b.style.iconPos === 'top' ? 'left' : b.style.iconPos, hover: 'none', idle: 'none' } }, { tag: 'div' })}</button>
        <button class="flex-1 min-w-0 text-left" data-eb="${i}"><span class="block text-sm font-medium truncate ${b.active ? '' : 'line-through text-slate-400'}">${esc(b.title)}</span>
          <span class="text-[11px] text-slate-500">${b.children.length ? `เมนูย่อย ${b.children.length} รายการ` : esc(b.link || 'ไม่มีลิงก์')}</span></button>
        <input type="checkbox" class="tgl" data-ba="${i}" ${b.active ? 'checked' : ''}>
        <div class="flex flex-col"><button class="text-slate-400 hover:text-navy-800 disabled:opacity-20" data-bm="${i}:-1" ${i === 0 ? 'disabled' : ''}>${icon('up')}</button><button class="text-slate-400 hover:text-navy-800 disabled:opacity-20" data-bm="${i}:1" ${i === B.length - 1 ? 'disabled' : ''}>${icon('down')}</button></div>
        <button class="p-1 text-slate-400 hover:text-navy-800" data-bd="${i}" title="ทำสำเนา">${icon('copy')}</button>
        <button class="p-1 text-slate-400 hover:text-rose-600" data-br="${i}">${icon('trash')}</button></div>`).join('') || '<div class="text-center py-8 text-slate-400 text-sm border-2 border-dashed rounded-xl">ยังไม่มีปุ่ม</div>'}</div>
      ${B.length > 1 ? `<button class="btn btn-light btn-sm w-full mt-3" id="sameStyle">${icon('copy', 'w-3.5 h-3.5')} ใช้สไตล์ของปุ่มแรกกับทุกปุ่ม</button>` : ''}`;
    const base = () => clone(B[0] ? B[0].style : UB.norm(UB.PRESETS[1].style));
    $('#addB').onclick = () => { B.push({ id: rid(), title: 'ปุ่มใหม่', subtitle: '', link: '', newTab: false, iconFa: '', iconImg: '', style: base(), active: true, children: [] }); markDirty(); drawButtons(P); editIntroBtn(B.length - 1); };
    $('#addDD').onclick = () => { B.push({ id: rid(), title: 'เมนูบริการ', subtitle: '', link: '', newTab: false, iconFa: 'fa-solid fa-bars', iconImg: '', style: base(), active: true, children: [{ id: rid(), title: 'เมนูย่อย 1', link: '', iconFa: '', newTab: true }] }); markDirty(); drawButtons(P); editIntroBtn(B.length - 1); };
    $$('[data-eb]', P).forEach(b => b.onclick = () => editIntroBtn(+b.dataset.eb));
    $$('[data-ba]', P).forEach(c => c.onchange = () => { B[+c.dataset.ba].active = c.checked; markDirty(); drawButtons(P); });
    $$('[data-bm]', P).forEach(b => b.onclick = () => { const [i, d] = b.dataset.bm.split(':').map(Number); [B[i], B[i + d]] = [B[i + d], B[i]]; markDirty(); drawButtons(P); });
    $$('[data-bd]', P).forEach(b => b.onclick = () => { const i = +b.dataset.bd, c = clone(B[i]); c.id = rid(); B.splice(i + 1, 0, c); markDirty(); drawButtons(P); });
    $$('[data-br]', P).forEach(b => b.onclick = async () => { if (!(await confirmBox('ลบปุ่มนี้?', B[+b.dataset.br].title, 'ลบ'))) return; B.splice(+b.dataset.br, 1); markDirty(); drawButtons(P); });
    const ss = $('#sameStyle'); if (ss) ss.onclick = async () => { if (!(await confirmBox('ใช้สไตล์ปุ่มแรกกับทุกปุ่ม?', 'สี รูปทรง ฟอนต์ และเอฟเฟกต์จะเหมือนปุ่มแรก (ข้อความ ไอคอน และลิงก์ไม่เปลี่ยน)', 'ใช้กับทุกปุ่ม', false))) return; B.forEach(b => b.style = clone(B[0].style)); markDirty(); drawButtons(P); };
    let from = null;
    $$('[data-bi]', P).forEach(row => {
      row.addEventListener('dragstart', () => { from = +row.dataset.bi; row.classList.add('dragging'); });
      row.addEventListener('dragend', () => row.classList.remove('dragging'));
      row.addEventListener('dragover', e => { e.preventDefault(); row.classList.add('drag-over'); });
      row.addEventListener('dragleave', () => row.classList.remove('drag-over'));
      row.addEventListener('drop', e => { e.preventDefault(); row.classList.remove('drag-over'); const to = +row.dataset.bi; if (from === null || from === to) return; const [m] = B.splice(from, 1); B.splice(to, 0, m); from = null; markDirty(); drawButtons(P); });
    });
  }

  function editIntroBtn(idx) {
    const b = clone(it.buttons[idx]);
    openModal({
      title: 'แก้ไขปุ่ม', size: 'max-w-2xl',
      footer: `<button class="btn btn-light" data-close>ยกเลิก</button><button class="btn btn-primary" data-ok>${icon('save')} ตกลง</button>`,
      body: '<div data-f></div>',
      onMount: (el, close) => {
        const F = $('[data-f]', el);
        const draw2 = () => {
          ensureFont(b.style.font || it.font);
          F.innerHTML = `<div class="space-y-4">
            <div class="rounded-xl p-6 grid place-items-center" style="background:#334155;font-family:'${esc(it.font)}',sans-serif"><div style="width:${Math.max(200, it.bar.btnW)}px;height:${it.bar.btnH}px">${UB.buttonHtml({ ...b, link: '' }, { tag: 'div' })}</div></div>
            <div class="flex flex-wrap gap-2"><button class="btn btn-primary btn-sm" data-design>🎨 ออกแบบปุ่ม / ไอคอน / ฟอนต์</button>
              <select class="inp !w-auto !py-1.5 text-sm" data-font><option value="">ฟอนต์: ตามหน้า (${esc(it.font)})</option>${UB.FONTS.filter(f => f[0]).map(([v, l]) => `<option value="${v}" ${b.style.font === v ? 'selected' : ''}>ฟอนต์: ${l}</option>`).join('')}</select></div>
            <div class="grid sm:grid-cols-2 gap-3"><div><label class="lbl">ข้อความบนปุ่ม</label><input class="inp" data-k="title" value="${esc(b.title)}"></div><div><label class="lbl">ข้อความรอง (ไม่บังคับ)</label><input class="inp" data-k="subtitle" value="${esc(b.subtitle)}"></div></div>
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div class="flex items-center justify-between"><label class="lbl !mb-0">${icon('menu', 'w-3.5 h-3.5 inline')} เมนูย่อย (Drop Down)</label><span class="text-xs text-slate-500">${b.children.length ? 'ปุ่มนี้จะเปิดเมนูแทนการลิงก์' : 'ไม่มี = ปุ่มลิงก์ปกติ'}</span></div>
              ${b.children.map((c, ci) => `<div class="flex items-center gap-1.5">
                <button class="btn btn-light btn-sm !px-2 w-9" data-cic="${ci}" title="ไอคอน">${c.iconFa ? `<i class="${esc(c.iconFa)}"></i>` : icon('plus', 'w-3.5 h-3.5')}</button>
                <input class="inp !py-1.5 text-sm" data-ck="${ci}:title" value="${esc(c.title)}" placeholder="ชื่อเมนู">
                <input class="inp !py-1.5 text-sm" data-ck="${ci}:link" value="${esc(c.link)}" placeholder="https://...">
                <label class="flex items-center gap-1 text-xs text-slate-500 whitespace-nowrap" title="เปิดในแท็บใหม่"><input type="checkbox" data-cn="${ci}" ${c.newTab ? 'checked' : ''}>แท็บใหม่</label>
                <button class="text-slate-400 hover:text-navy-800 disabled:opacity-20" data-cm="${ci}:-1" ${ci === 0 ? 'disabled' : ''}>${icon('up')}</button>
                <button class="text-slate-400 hover:text-navy-800 disabled:opacity-20" data-cm="${ci}:1" ${ci === b.children.length - 1 ? 'disabled' : ''}>${icon('down')}</button>
                <button class="p-1 text-slate-400 hover:text-rose-600" data-cr="${ci}">${icon('x')}</button></div>`).join('')}
              <button class="btn btn-light btn-sm w-full" data-cadd>${icon('plus', 'w-3.5 h-3.5')} เพิ่มเมนูย่อย</button>
            </div>
            ${b.children.length ? '' : `<div class="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2"><label class="lbl !mb-0">${icon('link', 'w-3.5 h-3.5 inline')} ลิงก์เมื่อคลิก</label>
              <div class="flex gap-2"><input class="inp" data-k="link" value="${esc(b.link)}" placeholder="https://udtc.coj.go.th/th/page/item/index/id/1"><button class="btn btn-light btn-sm" data-pp title="เลือกหน้าเว็บในระบบ">${icon('page', 'w-3.5 h-3.5')}</button></div>
              <label class="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" class="tgl" data-nt ${b.newTab ? 'checked' : ''}> เปิดในแท็บใหม่</label>
              <p class="text-xs text-slate-500">ปุ่ม “เข้าสู่เว็บไซต์” ควรใส่ลิงก์เต็มของหน้าแรกเว็บศาล และไม่ต้องเปิดแท็บใหม่</p></div>`}
          </div>`;
          $$('[data-k]', F).forEach(i => i.oninput = () => { b[i.dataset.k] = i.value; });
          $$('[data-k="title"],[data-k="subtitle"]', F).forEach(i => i.onchange = draw2);
          const nt = $('[data-nt]', F); if (nt) nt.onchange = () => { b.newTab = nt.checked; };
          $('[data-font]', F).onchange = e => { b.style.font = e.target.value; draw2(); };
          $('[data-design]', F).onclick = async () => { if (await designButton(b, { onApplyAll: st => { it.buttons.forEach(x => x.style = clone(st)); markDirty(); } })) draw2(); };
          const pp = $('[data-pp]', F); if (pp) pp.onclick = async () => { const s = await choosePage(); if (s) { b.link = `${ORIGIN}/p/${s}`; draw2(); } };
          $$('[data-ck]', F).forEach(i => i.oninput = () => { const [ci, k] = i.dataset.ck.split(':'); b.children[+ci][k] = i.value; });
          $$('[data-cn]', F).forEach(i => i.onchange = () => { b.children[+i.dataset.cn].newTab = i.checked; });
          $$('[data-cic]', F).forEach(x => x.onclick = async () => { const v = await pickIcon(b.children[+x.dataset.cic].iconFa); if (v !== null) { b.children[+x.dataset.cic].iconFa = v; draw2(); } });
          $$('[data-cm]', F).forEach(x => x.onclick = () => { const [i, d] = x.dataset.cm.split(':').map(Number); [b.children[i], b.children[i + d]] = [b.children[i + d], b.children[i]]; draw2(); });
          $$('[data-cr]', F).forEach(x => x.onclick = () => { b.children.splice(+x.dataset.cr, 1); draw2(); });
          $('[data-cadd]', F).onclick = () => { b.children.push({ id: rid(), title: '', link: '', iconFa: '', newTab: true }); draw2(); };
        };
        draw2();
        $('[data-ok]', el).onclick = () => {
          if (!b.title.trim()) return Swal.fire({ icon: 'warning', title: 'กรุณากรอกข้อความบนปุ่ม', confirmButtonText: 'ตกลง' });
          b.children = b.children.filter(c => c.title.trim());
          it.buttons[idx] = b; close(); markDirty(); if (tab === 'buttons') drawButtons($('#ipanel'));
        };
      },
    });
  }

  drawTabs(); draw(); refresh();
}

/* ================================================================
 * Media library
 * ================================================================ */
async function viewMedia() {
  let list = await api('GET', '/media');
  let filter = 'all';
  $('#view').innerHTML = `${pageHead('คลังสื่อ', 'ภาพ วีดีโอ และไฟล์เอกสารที่อัปโหลดไว้ (สูงสุด 200MB ต่อไฟล์)', `<label class="btn btn-primary cursor-pointer">${icon('upload')} อัปโหลดไฟล์<input type="file" multiple class="hidden" id="mUp"></label>`)}
  <div id="drop" class="card p-6 mb-4 border-2 border-dashed border-slate-300 text-center text-slate-500 text-sm">ลากไฟล์มาวางที่นี่เพื่ออัปโหลด</div>
  <div class="flex flex-wrap items-center gap-3 mb-4"><div class="seg !w-auto" id="mf">${[['all', 'ทั้งหมด'], ['image', 'ภาพ'], ['video', 'วีดีโอ'], ['file', 'เอกสาร']].map(([k, t]) => `<button data-mf="${k}" class="!px-4">${t}</button>`).join('')}</div>
  <div class="card flex-1 min-w-[200px] px-3 py-2 flex items-center gap-2">${icon('search', 'w-4 h-4 text-slate-400')}<input id="mq" class="flex-1 outline-none text-sm" placeholder="ค้นหาชื่อไฟล์..."></div></div>
  <div id="mg" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3"></div>`;
  const draw = () => {
    const q = ($('#mq').value || '').toLowerCase();
    $$('[data-mf]').forEach(b => b.classList.toggle('on', b.dataset.mf === filter));
    const f = list.filter(x => (filter === 'all' || x.kind === filter) && x.name.toLowerCase().includes(q));
    $('#mg').innerHTML = f.map(x => `<div class="card overflow-hidden group">
      <div class="aspect-square chk-pattern grid place-items-center relative overflow-hidden">${x.kind === 'image' ? `<img src="${esc(x.url)}" class="w-full h-full object-cover" loading="lazy">` : x.kind === 'video' ? `<video src="${esc(x.url)}#t=0.5" class="w-full h-full object-cover" preload="metadata" muted></video>` : `<div class="text-center">${icon('file', 'w-10 h-10 text-slate-400 mx-auto')}<div class="text-xs font-bold text-slate-500 mt-1">${esc(x.url.split('.').pop().toUpperCase())}</div></div>`}
        <div class="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5">
          <button class="p-2 rounded-lg bg-white text-slate-700" data-cu="${esc(x.url)}" title="คัดลอกลิงก์">${icon('link')}</button>
          <a class="p-2 rounded-lg bg-white text-slate-700" href="${esc(x.url)}" target="_blank" title="เปิด">${icon('ext')}</a>
          <button class="p-2 rounded-lg bg-white text-rose-600" data-md="${x.id}" title="ลบ">${icon('trash')}</button></div></div>
      <div class="p-2.5"><div class="text-xs font-medium truncate" title="${esc(x.name)}">${esc(x.name)}</div><div class="text-[11px] text-slate-400">${fmtSize(x.size)} · ${new Date(x.createdAt).toLocaleDateString('th-TH')}</div></div></div>`).join('')
      || '<div class="col-span-full text-center py-12 text-slate-400">ไม่มีไฟล์</div>';
    $$('[data-cu]').forEach(b => b.onclick = () => copyText(ORIGIN + b.dataset.cu));
    $$('[data-md]').forEach(b => b.onclick = async () => {
      const x = list.find(m => m.id === b.dataset.md);
      if (!(await confirmBox('ลบไฟล์?', `"${x.name}" — หากไฟล์นี้ถูกใช้อยู่ในส่วนแสดงผลหรือหน้าเว็บ จะแสดงผลไม่ได้`, 'ลบ'))) return;
      await api('DELETE', `/media/${x.id}`); list = list.filter(m => m.id !== x.id); ok('ลบแล้ว'); draw();
    });
  };
  const up = async files => { if (!files.length) return; await uploadMany(files); list = await api('GET', '/media'); draw(); };
  $('#mUp').onchange = e => up([...e.target.files]);
  const dz = $('#drop');
  ['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('!border-navy-500', 'bg-navy-50'); }));
  ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('!border-navy-500', 'bg-navy-50'); }));
  dz.addEventListener('drop', e => up([...e.dataTransfer.files]));
  $$('[data-mf]').forEach(b => b.onclick = () => { filter = b.dataset.mf; draw(); });
  $('#mq').oninput = draw;
  draw();
}

/* ================================================================
 * Users
 * ================================================================ */
async function viewUsers() {
  const list = await api('GET', '/users');
  $('#view').innerHTML = `${pageHead('ผู้ใช้งาน', 'บัญชีสำหรับเข้าระบบหลังบ้าน', `<button class="btn btn-primary" id="newU">${icon('plus')} เพิ่มผู้ใช้</button>`)}
  <div class="card overflow-hidden"><table class="w-full text-sm"><thead class="bg-slate-50 text-xs text-slate-500 uppercase"><tr><th class="text-left px-5 py-3">ผู้ใช้</th><th class="text-left px-3 py-3">สิทธิ์</th><th class="text-left px-3 py-3 hidden sm:table-cell">สร้างเมื่อ</th><th class="px-5 py-3"></th></tr></thead>
  <tbody class="divide-y divide-slate-100">${list.map(u => `<tr><td class="px-5 py-3"><div class="flex items-center gap-3"><span class="w-9 h-9 rounded-full bg-navy-100 text-navy-800 grid place-items-center font-bold">${esc(u.name.slice(0, 1))}</span><div><div class="font-semibold">${esc(u.name)} ${u.id === state.user.id ? '<span class="text-xs text-slate-400">(คุณ)</span>' : ''}</div><div class="text-xs text-slate-500 font-mono">${esc(u.username)}</div></div></div></td>
    <td class="px-3 py-3">${u.role === 'admin' ? '<span class="text-xs px-2 py-1 rounded-full bg-navy-50 text-navy-800 font-medium">ผู้ดูแลระบบ</span>' : '<span class="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">ผู้แก้ไขเนื้อหา</span>'}</td>
    <td class="px-3 py-3 hidden sm:table-cell text-slate-500">${fmtDate(u.createdAt)}</td>
    <td class="px-5 py-3"><div class="flex justify-end gap-1.5"><button class="btn btn-light btn-sm" data-ue="${u.id}">${icon('edit', 'w-3.5 h-3.5')} แก้ไข</button>${u.id !== state.user.id ? `<button class="btn btn-danger btn-sm" data-ud="${u.id}">${icon('trash', 'w-3.5 h-3.5')}</button>` : ''}</div></td></tr>`).join('')}</tbody></table></div>
  <p class="text-xs text-slate-500 mt-3">ผู้ดูแลระบบ: จัดการได้ทุกส่วน · ผู้แก้ไขเนื้อหา: จัดการส่วนแสดงผล หน้าเว็บ และคลังสื่อ (ไม่สามารถจัดการผู้ใช้และตั้งค่าเว็บไซต์)</p>`;
  const form = (u = {}) => `<div class="text-left space-y-3">
    ${u.id ? '' : `<div><label class="lbl">ชื่อผู้ใช้ (สำหรับเข้าระบบ)</label><input id="u-un" class="inp font-mono"></div>`}
    <div><label class="lbl">ชื่อที่แสดง</label><input id="u-nm" class="inp" value="${esc(u.name || '')}"></div>
    <div><label class="lbl">สิทธิ์</label><select id="u-rl" class="inp" ${u.id === state.user.id ? 'disabled' : ''}><option value="editor" ${u.role === 'editor' ? 'selected' : ''}>ผู้แก้ไขเนื้อหา</option><option value="admin" ${u.role === 'admin' ? 'selected' : ''}>ผู้ดูแลระบบ</option></select></div>
    <div><label class="lbl">${u.id ? 'ตั้งรหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)' : 'รหัสผ่าน (อย่างน้อย 8 ตัว)'}</label><input id="u-pw" type="password" class="inp" autocomplete="new-password"></div></div>`;
  $('#newU').onclick = async () => {
    const r = await Swal.fire({ title: 'เพิ่มผู้ใช้', html: form({ role: 'editor' }), showCancelButton: true, confirmButtonText: 'เพิ่ม', cancelButtonText: 'ยกเลิก', reverseButtons: true,
      preConfirm: () => api('POST', '/users', { username: $('#u-un').value, name: $('#u-nm').value, role: $('#u-rl').value, password: $('#u-pw').value }).catch(e => Swal.showValidationMessage(e.message)) });
    if (r.isConfirmed) { ok('เพิ่มผู้ใช้แล้ว'); viewUsers(); }
  };
  $$('[data-ue]').forEach(b => b.onclick = async () => {
    const u = list.find(x => x.id === b.dataset.ue);
    const r = await Swal.fire({ title: `แก้ไข ${esc(u.username)}`, html: form(u), showCancelButton: true, confirmButtonText: 'บันทึก', cancelButtonText: 'ยกเลิก', reverseButtons: true,
      preConfirm: () => api('PUT', `/users/${u.id}`, { name: $('#u-nm').value, role: $('#u-rl').value, password: $('#u-pw').value || undefined }).catch(e => Swal.showValidationMessage(e.message)) });
    if (r.isConfirmed) { ok('บันทึกแล้ว'); if (u.id === state.user.id && r.value && r.value.name) state.user.name = r.value.name; viewUsers(); }
  });
  $$('[data-ud]').forEach(b => b.onclick = async () => {
    const u = list.find(x => x.id === b.dataset.ud);
    if (!(await confirmBox('ลบผู้ใช้?', `บัญชี "${u.username}" จะถูกลบ`, 'ลบ'))) return;
    try { await api('DELETE', `/users/${u.id}`); ok('ลบแล้ว'); viewUsers(); } catch (e) { fail(e.message); }
  });
}

/* ================================================================
 * Settings
 * ================================================================ */
async function viewSettings() {
  const [s, pages] = await Promise.all([api('GET', '/settings'), api('GET', '/pages')]);
  $('#view').innerHTML = `${pageHead('ตั้งค่าเว็บไซต์', 'ข้อมูลหน่วยงานและรูปแบบหน้าเว็บเผยแพร่')}
  <div class="grid lg:grid-cols-[1fr_360px] gap-5 items-start">
    <div class="card p-5 space-y-4">
      <div class="grid sm:grid-cols-2 gap-4"><div><label class="lbl">ชื่อหน่วยงาน (ไทย)</label><input class="inp" data-s="siteName" value="${esc(s.siteName)}"></div><div><label class="lbl">ชื่อหน่วยงาน (อังกฤษ)</label><input class="inp" data-s="siteNameEn" value="${esc(s.siteNameEn)}"></div></div>
      <div><label class="lbl">โลโก้</label><div class="flex items-center gap-3"><img id="lg" src="${esc(s.logo || '/assets/logo.svg')}" class="w-14 h-14 object-contain rounded-lg border border-slate-200 p-1"><button class="btn btn-light btn-sm" id="pickLogo">${icon('media', 'w-3.5 h-3.5')} เปลี่ยนโลโก้</button></div></div>
      <div class="grid sm:grid-cols-2 gap-4">
        <div><label class="lbl">สีหลัก</label><div class="flex gap-2"><input type="color" data-s="primary" value="${s.primary}" class="h-10 w-12 rounded border border-slate-300"><input class="inp font-mono" value="${s.primary}" data-sm="primary"></div></div>
        <div><label class="lbl">สีเน้น</label><div class="flex gap-2"><input type="color" data-s="accent" value="${s.accent}" class="h-10 w-12 rounded border border-slate-300"><input class="inp font-mono" value="${s.accent}" data-sm="accent"></div></div>
      </div>
      <div><label class="lbl">ข้อความส่วนท้าย (ที่อยู่ / ติดต่อ)</label><textarea class="inp" rows="3" data-s="footer">${esc(s.footer)}</textarea></div>
      <div class="p-4 rounded-xl bg-navy-50 border border-navy-100">
        <label class="lbl">${state.server && state.server.cloud ? 'ที่อยู่เว็บไซต์สาธารณะ (ใช้สร้างโค้ดฝัง iframe และลิงก์)' : 'ที่อยู่เว็บไซต์สำหรับเครื่องลูกข่าย (ใช้สร้างโค้ดฝัง iframe และลิงก์)'}</label>
        <input class="inp font-mono" data-s="publicUrl" value="${esc(s.publicUrl || '')}" placeholder="${esc((state.server && state.server.urls[0]) || location.origin)}" list="srvUrls">
        <datalist id="srvUrls">${((state.server && state.server.urls) || []).map(u => `<option value="${esc(u)}">`).join('')}</datalist>
        <p class="text-xs text-slate-600 mt-1.5">เว้นว่าง = ใช้อัตโนมัติ (${esc(resolveOrigin())}) · หากมีชื่อโดเมน/DNS ภายใน เช่น <span class="font-mono">http://display.udtc.local:8090</span> ให้ใส่ที่นี่</p>
      </div>
      <div><label class="lbl">หน้าแรกของเว็บไซต์</label><select class="inp" data-s="homePageId"><option value="">แสดงรายการหน้าเว็บทั้งหมด (ค่าเริ่มต้น)</option>${pages.filter(p => p.status === 'published').map(p => `<option value="${p.id}" ${s.homePageId === p.id ? 'selected' : ''}>${esc(p.title)}</option>`).join('')}</select></div>
      <div class="pt-2"><button class="btn btn-primary" id="saveS">${icon('save')} บันทึกการตั้งค่า</button></div>
    </div>
    <div class="space-y-4">
      <div class="card p-5"><h3 class="font-semibold mb-1">สำรอง / กู้คืนข้อมูล</h3><p class="text-sm text-slate-500 mb-4">ไฟล์ข้อมูลอยู่ที่ <code class="text-xs bg-slate-100 px-1 rounded">data/db.json</code> และไฟล์สื่ออยู่ในโฟลเดอร์ <code class="text-xs bg-slate-100 px-1 rounded">uploads/</code></p>
        <a href="/api/backup" class="btn btn-light w-full mb-2">${icon('down')} ดาวน์โหลดไฟล์สำรอง (.json)</a>
        <label class="btn btn-light w-full cursor-pointer">${icon('upload')} กู้คืนจากไฟล์สำรอง<input type="file" accept=".json" class="hidden" id="rest"></label></div>
    </div>
  </div>`;
  $$('[data-s]').forEach(i => i.addEventListener('input', () => { s[i.dataset.s] = i.value; const m = $(`[data-sm="${i.dataset.s}"]`); if (m) m.value = i.value; }));
  $$('[data-sm]').forEach(i => i.addEventListener('input', () => { if (/^#[0-9a-f]{6}$/i.test(i.value)) { s[i.dataset.sm] = i.value; $(`[data-s="${i.dataset.sm}"]`).value = i.value; } }));
  $('#pickLogo').onclick = async () => { const u = await pickMedia('image'); if (u) { s.logo = u; $('#lg').src = u; } };
  $('#saveS').onclick = async () => { try { state.settings = await api('PUT', '/settings', s); ORIGIN = resolveOrigin(); ok('บันทึกแล้ว'); renderShell(); highlightNav('#/settings'); viewSettings(); } catch (e) { fail(e.message); } };
  $('#rest').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    if (!(await confirmBox('กู้คืนข้อมูล?', 'ข้อมูลปัจจุบันทั้งหมดจะถูกแทนที่ด้วยไฟล์สำรอง (ระบบจะเก็บสำเนาข้อมูลเดิมไว้ในโฟลเดอร์ data/)', 'กู้คืน'))) return;
    try { const r = await fetch('/api/restore', { method: 'POST', body: await f.text(), headers: { 'Content-Type': 'application/json' } }); const d = await r.json(); if (!r.ok) throw new Error(d.error); await Swal.fire({ icon: 'success', title: 'กู้คืนสำเร็จ', confirmButtonText: 'ตกลง' }); location.reload(); } catch (err) { fail(err.message); }
  };
}

/* ================================================================
 * Account
 * ================================================================ */
async function viewAccount() {
  $('#view').innerHTML = `${pageHead('เปลี่ยนรหัสผ่าน', `บัญชี ${esc(state.user.username)}`)}
  <form id="pwf" class="card p-5 max-w-md space-y-4">
    <div><label class="lbl">รหัสผ่านปัจจุบัน</label><input type="password" name="current" class="inp" required autocomplete="current-password"></div>
    <div><label class="lbl">รหัสผ่านใหม่ (อย่างน้อย 8 ตัว)</label><input type="password" name="next" class="inp" required minlength="8" autocomplete="new-password"></div>
    <div><label class="lbl">ยืนยันรหัสผ่านใหม่</label><input type="password" name="next2" class="inp" required autocomplete="new-password"></div>
    <button class="btn btn-primary">${icon('save')} เปลี่ยนรหัสผ่าน</button></form>`;
  $('#pwf').onsubmit = async e => {
    e.preventDefault(); const f = new FormData(e.target);
    if (f.get('next') !== f.get('next2')) return fail('รหัสผ่านใหม่ไม่ตรงกัน');
    try { await api('PUT', '/account/password', { current: f.get('current'), next: f.get('next') }); e.target.reset(); Swal.fire({ icon: 'success', title: 'เปลี่ยนรหัสผ่านแล้ว', confirmButtonText: 'ตกลง' }); } catch (err) { fail(err.message); }
  };
}

/* ---------------- Boot ---------------- */
async function boot() {
  try {
    const r = await api('GET', '/me');
    state.user = r.user; state.settings = r.settings; state.server = r.server; ORIGIN = resolveOrigin();
  } catch { return renderLogin(); }
  renderShell();
  if (!location.hash) location.hash = '#/dashboard'; else router();
}
boot();
