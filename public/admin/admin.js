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
  plus: '<path d="M12 5v14M5 12h14"/>', qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4M20 17v3"/>', table: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>', sparkle: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>', check: '<path d="M20 6 9 17l-5-5"/>', edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
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
/* เวลาประเทศไทย (UTC+7) ↔ ISO สำหรับช่อง datetime-local */
const bkkLocal = iso => { const t = Date.parse(iso); return Number.isFinite(t) ? new Date(t + 7 * 3600e3).toISOString().slice(0, 16) : ''; };
const bkkIso = v => v ? new Date(v + ':00+07:00').toISOString() : '';
const bkkText = iso => new Date(iso).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }) + ' น.';
const toast = msg => Toast.fire({ icon: 'info', title: msg });
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
/* ภาพที่อัปโหลดจะถูกย่อในเบราว์เซอร์ก่อนส่งขึ้นเครื่องแม่ข่าย: ด้านยาวไม่เกิน 1920px เป็น WebP
   และสร้างภาพย่อ 800px อีกชุด (ใช้กับมือถือ / การ์ดเล็ก ผ่าน srcset) — ลดขนาดข้อมูลที่ผู้ชมต้องโหลดลงมาก */
const IMG_MAX_SIDE = 1920, IMG_SM_SIDE = 800, IMG_KEEP_BYTES = 300 * 1024, IMG_Q = 0.82;
async function encodeImg(bmp, side, q) {
  const scale = Math.min(1, side / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(bmp.width * scale)); c.height = Math.max(1, Math.round(bmp.height * scale));
  const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(bmp, 0, 0, c.width, c.height);
  const blob = await new Promise(r => c.toBlob(r, 'image/webp', q));
  return blob && blob.type === 'image/webp' ? { blob, w: c.width, h: c.height, scale } : null;
}
/** คืน { file: ไฟล์หลักที่ย่อแล้ว, sm: ภาพย่อ 800px (ถ้าภาพกว้างพอ) } */
async function optimizeImage(file, force = false) {
  if (!/^image\/(jpeg|png|webp|bmp)$/.test(file.type) || typeof createImageBitmap !== 'function') return { file };
  let bmp; try { bmp = await createImageBitmap(file); } catch { return { file }; }
  try {
    const big = Math.max(bmp.width, bmp.height);
    let main = file;
    if (force || big > IMG_MAX_SIDE || file.size > IMG_KEEP_BYTES) {
      const e = await encodeImg(bmp, IMG_MAX_SIDE, IMG_Q);
      if (e && e.blob.size < file.size) main = new File([e.blob], file.name.replace(/\.[a-z0-9]+$/i, '') + '.webp', { type: 'image/webp' });
    }
    let sm = null;
    if (big > IMG_SM_SIDE * 1.15) { const e = await encodeImg(bmp, IMG_SM_SIDE, 0.8); if (e && e.blob.size < main.size * 0.8) sm = new File([e.blob], file.name.replace(/\.[a-z0-9]+$/i, '') + '-800.webp', { type: 'image/webp' }); }
    return { file: main, sm };
  } finally { bmp.close && bmp.close(); }
}
async function shrinkImage(file) { return (await optimizeImage(file)).file; }
const cloudStorage = () => !!(state.server && state.server.storage === 'blob');
function uploadViaServer(file, onProgress, hdr = {}) {
  return new Promise((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open('POST', '/api/media');
    x.setRequestHeader('X-Filename', encodeURIComponent(file.name));
    for (const k in hdr) x.setRequestHeader(k, hdr[k]);
    x.upload.onprogress = e => e.lengthComputable && onProgress && onProgress(e.loaded / e.total);
    x.onload = () => { let d; try { d = JSON.parse(x.responseText); } catch { d = {}; } x.status < 300 ? resolve(d) : reject(new Error(d.error || (x.status === 413 ? 'ไฟล์ใหญ่เกินไป' : 'อัปโหลดไม่สำเร็จ'))); };
    x.onerror = () => reject(new Error('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'));
    x.send(file);
  });
}
async function uploadDirectToBlob(file, onProgress, replaceOf) {
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
  return api('POST', '/media/register', { url: r.url, name: file.name, size: file.size, replaceOf: replaceOf || undefined });
}
async function uploadFile(file, onProgress, hdr = {}) {
  const o = await optimizeImage(file, !!hdr['X-Replace-Of']);
  file = o.file;
  const limit = (state.server && state.server.uploadDirectMax) || Infinity;
  let item;
  if (cloudStorage() && file.size > limit) item = await uploadDirectToBlob(file, onProgress, hdr['X-Replace-Of']);
  else item = await uploadViaServer(file, onProgress, hdr);
  if (o.sm && item && item.id) { try { item = { ...item, ...(await uploadViaServer(o.sm, null, { 'X-Variant-Of': item.id })) }; } catch (e) { console.warn('อัปโหลดภาพย่อไม่สำเร็จ', e); } }
  return item;
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
    const accept = { image: 'image/*', video: 'video/*', file: '', any: '', pdf: '.pdf,application/pdf' }[kind];
    const label = { image: 'ภาพ', video: 'วีดีโอ', file: 'ไฟล์เอกสาร', any: 'ไฟล์', pdf: 'ไฟล์ PDF' }[kind];
    let chosen = null;
    openModal({
      onClose: () => resolve(chosen),
      title: `เลือก${label}`, size: 'max-w-4xl',
      body: `<div class="flex flex-col sm:flex-row gap-3 mb-4">
          <label class="btn btn-primary cursor-pointer">${icon('upload')} อัปโหลด${label}ใหม่<input type="file" ${accept ? `accept="${accept}"` : ''} class="hidden" data-up></label>
          <div class="flex-1 flex gap-2"><input class="inp" placeholder="หรือวาง URL ${kind === 'video' ? '/ โค้ดฝัง — YouTube, Facebook, TikTok, Vimeo, Google Drive, .mp4' : ''}" data-url><button class="btn btn-light" data-useurl>ใช้ URL</button></div>
        </div>
        <div class="grid grid-cols-3 sm:grid-cols-5 gap-3" data-grid><div class="col-span-full text-center py-10 text-slate-400">กำลังโหลด...</div></div>`,
      onMount: async (el, close) => {
        const done = url => { chosen = url; close(); };
        $('[data-useurl]', el).onclick = () => { const v = $('[data-url]', el).value.trim(); if (v) done(v); };
        $('[data-up]', el).onchange = async e => { const r = await uploadMany([...e.target.files]); if (r[0]) done(r[0].url); };
        let list = (await api('GET', '/media')).filter(x => kind === 'any' || kind === 'file' ? true : kind === 'pdf' ? /\.pdf($|\?)/i.test(x.url) : x.kind === kind);
        const g = $('[data-grid]', el);
        const drawG = () => {
          g.innerHTML = list.length ? list.map(x => `<div class="relative group rounded-lg border border-slate-200 overflow-hidden hover:ring-2 hover:ring-navy-500">
            <button class="block w-full text-left" data-pick="${esc(x.url)}"><div class="aspect-square bg-slate-100 grid place-items-center overflow-hidden chk-pattern">${x.kind === 'image' ? `<img src="${esc(x.url)}" class="w-full h-full object-cover" loading="lazy">` : x.kind === 'video' ? icon('video', 'w-8 h-8 text-slate-400') : icon('file', 'w-8 h-8 text-slate-400')}</div>
            <div class="px-2 py-1.5 text-xs text-slate-600 truncate pr-8">${esc(x.name)}</div></button>
            <button class="absolute bottom-1 right-1 p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50" data-pdel="${x.id}" title="ลบไฟล์นี้">${icon('trash', 'w-3.5 h-3.5')}</button>
            ${x.usedIn && x.usedIn.length ? `<span class="absolute top-1.5 left-1.5 text-[10px] px-1.5 rounded bg-emerald-600 text-white">ใช้อยู่</span>` : ''}</div>`).join('')
            : `<div class="col-span-full text-center py-10 text-slate-400">ยังไม่มี${label}ในคลัง — อัปโหลดได้จากปุ่มด้านบน</div>`;
          $$('[data-pick]', g).forEach(b => b.onclick = () => done(b.dataset.pick));
          $$('[data-pdel]', g).forEach(b => b.onclick = async () => {
            const x = list.find(m => m.id === b.dataset.pdel);
            const used = x.usedIn && x.usedIn.length ? `\n\nไฟล์นี้กำลังถูกใช้งานที่: ${x.usedIn.slice(0, 3).join(', ')} — ภาพในจุดนั้นจะหายไป` : '';
            if (!(await confirmBox('ลบไฟล์ถาวร?', `"${x.name}" จะถูกลบถาวร กู้คืนไม่ได้${used}`, 'ลบถาวร'))) return;
            try { await api('DELETE', `/media/${x.id}`); list = list.filter(m => m.id !== x.id); ok('ลบแล้ว'); drawG(); } catch (e) { fail(e.message); }
          });
        };
        drawG();
      },
    });
  });
}

/* ---------------- State & routing ---------------- */
const state = { user: null, settings: {}, dirty: false };
window.addEventListener('beforeunload', e => { if (state.dirty) { e.preventDefault(); e.returnValue = ''; } });
const routes = [
  [/^#\/dashboard$/, viewDashboard], [/^#\/widgets$/, viewWidgets], [/^#\/widgets\/(\w+)$/, viewWidgetEditor],
  [/^#\/pages$/, viewPages], [/^#\/templates$/, viewTemplates], [/^#\/intros$/, viewIntros], [/^#\/intros\/(\w+)$/, viewIntroEditor], [/^#\/pages\/(\w+)$/, viewPageEditor], [/^#\/media$/, viewMedia],
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
  const nav = [['#/dashboard', 'dash', 'ภาพรวม'], ['#/widgets', 'widget', 'ส่วนแสดงผล (iframe)'], ['#/pages', 'page', 'หน้าเว็บเผยแพร่'], ['#/templates', 'sparkle', 'สร้างจากแม่แบบ'], ['#/intros', 'home', 'หน้า Intro'], ['#/media', 'media', 'คลังสื่อ']];
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
const LAYOUT_NAME = { grid: 'กริด', carousel: 'สไลด์', list: 'รายการลิงก์', canvas: 'ผืนผ้าใบ', tabs: 'แท็บ (รวมหลายส่วน)', code: 'เขียนโค้ด HTML' };
/** ลากสลับตำแหน่งการ์ด + ปักดาวรายการโปรด (รายการโปรดอยู่บนสุดเสมอ และลบไม่ได้จนกว่าจะปลดดาว) */
function favButtons(x, kind) {
  return `<div class="absolute top-2 right-2 flex gap-1 z-10">
    <button class="h-8 w-8 grid place-items-center rounded-lg shadow ${x.fav ? 'bg-gold-500 text-white' : 'bg-white/90 text-slate-400 hover:text-gold-500'}" data-fav="${x.id}" title="${x.fav ? 'ปลดดาว (เลิกเป็นรายการโปรด)' : 'ปักดาวเป็นรายการโปรด — แสดงบนสุดและกันการลบโดยไม่ตั้งใจ'}"><span class="text-lg leading-none">${x.fav ? '★' : '☆'}</span></button>
    <button class="h-8 w-8 grid place-items-center rounded-lg shadow bg-white/90 text-slate-500 hover:text-navy-700 cursor-grab active:cursor-grabbing" data-drag title="ลากเพื่อสลับตำแหน่ง"><svg viewBox="0 0 24 24" class="w-4 h-4" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg></button></div>`;
}
function bindOrdering(box, list, base, redraw) {
  $$('[data-fav]', box).forEach(b => b.onclick = async e => {
    e.preventDefault(); e.stopPropagation();
    const x = list.find(y => y.id === b.dataset.fav); x.fav = !x.fav;
    try { await api('POST', `/${base}/${x.id}/fav`, { fav: x.fav }); } catch (er) { x.fav = !x.fav; return fail(er.message); }
    list.sort((a, c) => (!!c.fav - !!a.fav)); // stable: คงลำดับเดิมในกลุ่ม
    ok(x.fav ? 'ปักดาวแล้ว — แสดงบนสุด และกันการลบ' : 'ปลดดาวแล้ว'); redraw();
  });
  let dragId = null;
  $$('[data-card]', box).forEach(card => {
    const h = $('[data-drag]', card); if (!h) return;
    h.addEventListener('mousedown', () => { card.draggable = true; });
    h.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); });
    card.addEventListener('dragstart', e => { dragId = card.dataset.card; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragId); card.classList.add('opacity-50'); });
    card.addEventListener('dragend', () => { card.draggable = false; card.classList.remove('opacity-50'); $$('[data-card]', box).forEach(c => c.classList.remove('ring-4', 'ring-navy-300')); });
    card.addEventListener('dragover', e => { if (!dragId || dragId === card.dataset.card) return; e.preventDefault(); $$('[data-card]', box).forEach(c => c.classList.toggle('ring-4', c === card)); card.classList.add('ring-navy-300'); });
    card.addEventListener('drop', async e => {
      e.preventDefault(); if (!dragId || dragId === card.dataset.card) return;
      const from = list.findIndex(y => y.id === dragId), item = list[from]; list.splice(from, 1);
      const r = card.getBoundingClientRect(), after = (e.clientY - r.top) > r.height / 2 || (e.clientX - r.left) > r.width * .66;
      let to = list.findIndex(y => y.id === card.dataset.card) + (after ? 1 : 0); list.splice(to, 0, item);
      const before = list.map(y => y.id).join();
      list.sort((a, c) => (!!c.fav - !!a.fav));
      if (list.map(y => y.id).join() !== before) toast('รายการโปรดอยู่บนสุดเสมอ — จัดลำดับได้ภายในกลุ่มเดียวกัน');
      dragId = null; redraw();
      try { await api('POST', `/${base}/reorder`, { ids: list.map(y => y.id) }); ok('จัดลำดับแล้ว'); } catch (er) { fail(er.message); }
    });
  });
}

async function viewWidgets() {
  const list = await api('GET', '/widgets');
  $('#view').innerHTML = `${pageHead('ส่วนแสดงผล (iframe)', 'แต่ละส่วนมีลิงก์แยก นำไปฝังในเว็บไซต์ด้วย &lt;iframe&gt; ได้', `<button class="btn btn-light" id="demoW">${icon('widget')} เพิ่มชุดตัวอย่าง</button><button class="btn btn-primary" id="newW">${icon('plus')} สร้างส่วนแสดงผล</button>`)}
  <div class="card mb-4 p-3 flex items-center gap-2">${icon('search', 'w-4 h-4 text-slate-400 ml-1')}<input id="q" class="flex-1 outline-none text-sm py-1" placeholder="ค้นหาชื่อ หรือ slug..."></div>
  <p class="text-xs text-slate-500 -mt-2 mb-3">☆ ปักดาวรายการที่ใช้งานจริง ให้แสดงบนสุดและกันการเผลอลบ · ลากปุ่ม ⠿ ที่มุมภาพเพื่อสลับตำแหน่ง (ลากได้เมื่อไม่ได้ค้นหา)</p>
  <div id="wl" class="grid md:grid-cols-2 2xl:grid-cols-3 gap-4"></div>`;
  const draw = q => {
    const f = list.filter(w => !q || (w.name + w.slug).toLowerCase().includes(q.toLowerCase()));
    const canDrag = !q;
    $('#wl').innerHTML = f.map(w => `
    <div class="card overflow-hidden flex flex-col transition ${w.fav ? 'ring-2 ring-gold-400' : ''}" data-card="${w.id}">
      <div class="h-40 bg-slate-50 border-b border-slate-200 overflow-hidden relative">
        ${favButtons(w).replace(canDrag ? '' : /<button[^>]*data-drag[\s\S]*?<\/button>/, '')}
        ${w.fav ? '<span class="absolute top-2 left-2 z-10 text-[11px] px-2 py-0.5 rounded-full bg-gold-500 text-white font-semibold shadow">★ รายการโปรด</span>' : ''}
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
          ${w.fav ? `<button class="btn btn-light btn-sm opacity-40 cursor-not-allowed" data-locked title="รายการโปรด — ปลดดาวก่อนจึงลบได้">${icon('trash', 'w-3.5 h-3.5')}</button>` : `<button class="btn btn-danger btn-sm" data-del="${w.id}" title="ลบ">${icon('trash', 'w-3.5 h-3.5')}</button>`}
        </div>
      </div>
    </div>`).join('') || `<div class="col-span-full card p-12 text-center text-slate-500">ยังไม่มีส่วนแสดงผล</div>`;
    bindOrdering($('#wl'), list, 'widgets', () => draw($('#q').value));
    $$('[data-locked]').forEach(b => b.onclick = () => toast('รายการนี้ปักดาวไว้ — กด ☆ ที่มุมภาพเพื่อปลดดาวก่อนจึงลบได้'));
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
        <div><label class="lbl">รูปแบบเริ่มต้น</label><select id="sw-layout" class="inp"><option value="carousel">สไลด์ (Carousel)</option><option value="grid">กริด (Grid)</option><option value="list">รายการลิงก์ (List)</option><option value="canvas">ผืนผ้าใบอิสระ — ลากวางปุ่มบนตาราง (Canvas)</option><option value="tabs">แท็บ — รวมหลายส่วนแสดงผล จัดคอลัมน์ได้ (Tabs)</option><option value="code">เขียนโค้ด HTML / CSS — ออกแบบโครงสร้างเองด้วยแท็ก (Code)</option></select></div></div>`,
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
    if (d.layout === 'code') Object.assign(d, { bg: '#ffffff', padding: 16, code: { html: `<section class="ux-section sm">\n  <div class="ux-head"><h2>${d.name.replace(/[<>&]/g, '')}</h2></div>\n  <p class="ux-text">เริ่มเขียน HTML ที่นี่ หรือกด “แทรกโครงสร้าง” เพื่อเลือกส่วนประกอบสำเร็จรูป</p>\n</section>\n`, css: '', js: '' } });
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
      <div data-auto>${box('แบบปรับความสูงอัตโนมัติ (แนะนำ)', c.auto, 'iframe จะยืด–หดตามเนื้อหาเอง ไม่มีแถบเลื่อน')}</div>
      <p class="text-xs -mt-3" data-hmsg><span class="text-slate-400">กำลังวัดความสูงจริงของส่วนแสดงผล…</span></p>
      ${box('แบบกำหนดความสูงตายตัว', c.fixed, 'ใช้เมื่อเว็บไซต์ปลายทางไม่อนุญาตให้ใส่ &lt;script&gt; — ปรับค่า height ตามต้องการ')}
      ${box('ลิงก์แสดงรายการทั้งหมด (ไม่จำกัดจำนวน)', c.full)}
    </div>`,
    onMount: el => {
      $$('[data-cp]', el).forEach(b => b.onclick = () => copyText(b.dataset.cp));
      // วัดความสูงจริง (จอกว้าง 1200px) แล้วใส่เป็น height เริ่มต้นของ iframe — หน้าเว็บจะไม่กระตุก/ร่นตอนโหลดครั้งแรก
      const f = document.createElement('iframe'); f.src = `/embed/${w.slug}`; f.style.cssText = 'position:fixed;left:-99999px;top:0;width:1200px;height:600px;border:0;visibility:hidden';
      let done = false;
      const onMsg = e => { if (e.source !== f.contentWindow || !e.data || e.data.type !== 'uw-resize') return; const h = Math.max(20, Math.round(e.data.height)); clearTimeout(tm); tm = setTimeout(() => finish(h), 700); };
      let tm = 0;
      const finish = h => {
        if (done) return; done = true; removeEventListener('message', onMsg); f.remove();
        if (!h || !document.body.contains(el)) return;
        const code = c.auto.replace(/height="\d+"/, `height="${h}"`);
        $('[data-auto]', el).innerHTML = box('แบบปรับความสูงอัตโนมัติ (แนะนำ)', code, 'iframe จะยืด–หดตามเนื้อหาเอง ไม่มีแถบเลื่อน');
        $('[data-hmsg]', el).innerHTML = `<span class="text-emerald-700">✓ ตั้งความสูงเริ่มต้นเป็น ${h}px ตามขนาดจริง (จอกว้าง 1200px) — ตอนเปิดเว็บครั้งแรกจะไม่มีพื้นที่ว่างค้าง · ถ้าแก้เนื้อหาจนสูงต่างจากเดิมมาก ให้คัดลอกโค้ดใหม่</span>`;
        $$('[data-cp]', el).forEach(b => b.onclick = () => copyText(b.dataset.cp));
      };
      addEventListener('message', onMsg); document.body.appendChild(f);
      setTimeout(() => { if (!done) { done = true; removeEventListener('message', onMsg); f.remove(); const m = $('[data-hmsg]', el); if (m) m.innerHTML = ''; } }, 8000);
    },
  });
}

/** นำหน้าเว็บเผยแพร่ไปใช้: ลิงก์ + โค้ด iframe (เลือกได้ว่าจะแสดงหัวเรื่อง/พื้นหลัง) */
function showPageShare(p) {
  const opt = { title: true, bg: true, h: 900 };
  const box = (label, val, hint) => `<div><div class="flex items-center justify-between mb-1.5"><label class="lbl !mb-0">${label}</label><button class="btn btn-light btn-sm" data-cp="${esc(val)}">${icon('copy', 'w-3.5 h-3.5')} คัดลอก</button></div>
    <textarea readonly class="inp font-mono text-xs !bg-slate-50" rows="${val.split('\n').length + (val.length > 120 ? 2 : 0)}">${esc(val)}</textarea>${hint ? `<p class="text-xs text-slate-500 mt-1">${hint}</p>` : ''}</div>`;
  const codes = () => {
    const link = `${ORIGIN}/p/${p.slug}`, q = `?embed=1${opt.title ? '' : '&title=0'}${opt.bg ? '' : '&bg=0'}`, src = link + q, t = esc(p.title);
    return { link, src,
      auto: `<iframe src="${src}" title="${t}" data-uw-embed style="width:100%;border:0;display:block" height="${opt.h}" loading="lazy"></iframe>\n<script src="${ORIGIN}/assets/embed.js"></script>`,
      fixed: `<iframe src="${src}" title="${t}" style="width:100%;border:0;display:block" height="${opt.h}" loading="lazy"></iframe>`,
      full: `<iframe src="${link}" title="${t}" style="position:fixed;inset:0;width:100%;height:100%;border:0;z-index:9999"></iframe>` };
  };
  openModal({
    title: `นำหน้าเว็บไปใช้ — ${esc(p.title)}`, size: 'max-w-2xl',
    body: `<div class="space-y-5">
      ${p.status !== 'published' ? `<div class="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">⚠ หน้านี้ยังเป็น <b>ฉบับร่าง</b> — ผู้ชมภายนอกจะเปิดไม่ได้จนกว่าจะเปลี่ยนสถานะเป็น “เผยแพร่” แล้วบันทึก</div>` : ''}
      <div class="p-3 rounded-xl border border-slate-200 bg-slate-50 grid sm:grid-cols-3 gap-3 items-end">
        ${p.chrome && p.chrome.title ? '<label class="flex items-center justify-between gap-2 text-sm text-slate-700">แสดงหัวเรื่อง/ภาพปก<input type="checkbox" class="tgl" data-o="title" checked></label>' : '<div class="text-xs text-slate-500">หัวเรื่องหน้า: ปิดอยู่ (ตั้งที่ “ส่วนประกอบรอบเนื้อหา”)</div>'}
        <label class="flex items-center justify-between gap-2 text-sm text-slate-700">พื้นหลังสีเทาอ่อน<input type="checkbox" class="tgl" data-o="bg" checked></label>
        <div><label class="lbl">ความสูงเริ่มต้น (px)</label><input type="number" class="inp" data-o="h" value="900" min="200" max="6000"></div>
        <p class="text-xs text-slate-500 sm:col-span-3">โค้ด iframe แสดงเฉพาะเนื้อหาของหน้าเสมอ (ไม่มีแถบโลโก้/เมนูและส่วนท้าย) · ลิงก์ที่คลิกในหน้า จะเปิดทั้งหน้าต่าง</p>
      </div>
      <div data-codes class="space-y-5"></div>
      <div class="flex gap-2"><a class="btn btn-light btn-sm" data-open target="_blank">${icon('ext', 'w-3.5 h-3.5')} เปิดดูแบบที่จะฝัง</a></div>
    </div>`,
    onMount: el => {
      const draw = () => { const c = codes(); $('[data-codes]', el).innerHTML = `${box('ลิงก์หน้าเว็บ', c.link)}
        ${box('โค้ด iframe แบบปรับความสูงอัตโนมัติ (แนะนำ)', c.auto, 'iframe ยืด–หดตามเนื้อหาเอง ไม่มีแถบเลื่อน — วางทั้ง 2 บรรทัด')}
        ${box('โค้ด iframe แบบกำหนดความสูงตายตัว', c.fixed, 'ใช้เมื่อเว็บปลายทางไม่อนุญาตให้ใส่ &lt;script&gt; — ปรับค่า height ให้พอดีกับเนื้อหา')}
        ${box('โค้ดฝังแบบเต็มหน้าจอ', c.full)}`;
        $('[data-open]', el).href = c.src; $$('[data-cp]', el).forEach(b => b.onclick = () => copyText(b.dataset.cp)); };
      $$('[data-o]', el).forEach(i => i.addEventListener(i.type === 'checkbox' ? 'change' : 'input', () => { opt[i.dataset.o] = i.type === 'checkbox' ? i.checked : Math.max(200, Math.min(6000, +i.value || 900)); draw(); }));
      draw();
    },
  });
}

/* ================================================================
 * ตัวแก้ไขโค้ด HTML / CSS / JS + ชุดโครงสร้างสำเร็จรูป + ตัวอย่างสด
 * ================================================================ */
const IMG_PH = '/assets/samples/hero-1.svg';
const CODE_SNIPPETS = [
  ['โครงสร้าง', [
    ['หัวข้อส่วน', `<div class="ux-head"><h2>หัวข้อของส่วนนี้</h2></div>\n`],
    ['ส่วนเนื้อหา (กล่องกว้างสุด 1200px)', `<section class="ux-section">\n  <div class="ux-container">\n    <div class="ux-head"><h2>หัวข้อ</h2></div>\n    <p class="ux-text">เนื้อหา…</p>\n  </div>\n</section>\n`],
    ['2 คอลัมน์ ภาพ + ข้อความ', `<div class="ux-split">\n  <img class="ux-img ux-shadow" src="${IMG_PH}" alt="">\n  <div>\n    <h2 class="ux-title">หัวข้อ</h2>\n    <div class="ux-divider gold"></div>\n    <p class="ux-text">รายละเอียด…</p>\n    <a class="ux-btn" href="#">อ่านเพิ่มเติม</a>\n  </div>\n</div>\n`],
    ['กริด 3 คอลัมน์ (เปล่า)', `<div class="ux-grid c3">\n  <div class="ux-box">ช่องที่ 1</div>\n  <div class="ux-box">ช่องที่ 2</div>\n  <div class="ux-box">ช่องที่ 3</div>\n</div>\n`],
    ['แถวจัดกึ่งกลาง', `<div class="ux-row center">\n  …\n</div>\n`],
  ]],
  ['ส่วนประกอบ', [
    ['แบนเนอร์ (Hero)', `<div class="ux-hero" style="background-image:url('${IMG_PH}');--h:340px">\n  <div class="ux-hero-in">\n    <h1>ศาลจังหวัดอุดรธานี</h1>\n    <p>ให้บริการประชาชนด้วยความรวดเร็ว โปร่งใส เป็นธรรม</p>\n    <a class="ux-btn gold" href="#">เริ่มต้นใช้บริการ</a>\n  </div>\n</div>\n`],
    ['การ์ดข่าว 3 คอลัมน์', `<div class="ux-grid c3">\n${[1, 2, 3].map(n => `  <a class="ux-card" href="#">\n    <img src="${IMG_PH}" alt="">\n    <div class="ux-card-body">\n      <span class="ux-badge">ข่าวประชาสัมพันธ์</span>\n      <h3>หัวข้อข่าวที่ ${n}</h3>\n      <p>รายละเอียดโดยย่อของข่าว…</p>\n    </div>\n  </a>`).join('\n')}\n</div>\n`],
    ['ปุ่มบริการพร้อมไอคอน 4 คอลัมน์', `<div class="ux-grid c4">\n${[['fa-solid fa-scale-balanced', 'ตรวจสอบคดี'], ['fa-solid fa-file-pdf', 'แบบฟอร์ม'], ['fa-solid fa-calendar-check', 'วันนัดพิจารณา'], ['fa-solid fa-phone', 'ติดต่อศาล']].map(([i, t]) => `  <a class="ux-tile" href="#"><i class="${i}"></i>${t}</a>`).join('\n')}\n</div>\n`],
    ['ปุ่ม', `<a class="ux-btn" href="#">ปุ่มหลัก</a>\n<a class="ux-btn gold" href="#">ปุ่มทอง</a>\n<a class="ux-btn outline" href="#">ปุ่มเส้นขอบ</a>\n`],
    ['ตัวเลขสถิติ', `<div class="ux-grid c4">\n${[['1,250', 'คดีที่รับ'], ['98%', 'ความพึงพอใจ'], ['24', 'บริการออนไลน์'], ['15 นาที', 'เวลารอเฉลี่ย']].map(([b, t]) => `  <div class="ux-stat"><b>${b}</b><span>${t}</span></div>`).join('\n')}\n</div>\n`],
    ['ประกาศ / แจ้งเตือน', `<div class="ux-notice warn"><i class="fa-solid fa-triangle-exclamation"></i><div><b>ประกาศ</b> ข้อความแจ้งเตือน…</div></div>\n`],
    ['รายการเครื่องหมายถูก', `<ul class="ux-list check">\n  <li>บัตรประจำตัวประชาชน</li>\n  <li>สำเนาทะเบียนบ้าน</li>\n  <li>เอกสารอื่นที่เกี่ยวข้อง</li>\n</ul>\n`],
    ['ตาราง', `<div class="ux-scroll">\n<table class="ux-table">\n  <thead><tr><th>ลำดับ</th><th>รายการ</th><th>ค่าธรรมเนียม</th></tr></thead>\n  <tbody>\n    <tr><td>1</td><td>คัดสำเนาเอกสาร</td><td>50 บาท</td></tr>\n    <tr><td>2</td><td>ขอใบสำคัญ</td><td>100 บาท</td></tr>\n  </tbody>\n</table>\n</div>\n`],
    ['คำถามที่พบบ่อย (กดเปิด/ปิด)', `<div class="ux-faq">\n  <details open><summary>คำถามที่ 1</summary><div>คำตอบ…</div></details>\n  <details><summary>คำถามที่ 2</summary><div>คำตอบ…</div></details>\n</div>\n`],
    ['ข้อมูลติดต่อ', `<div class="ux-contact">\n  <div><span class="ux-icon-circle"><i class="fa-solid fa-phone"></i></span><div><b>โทรศัพท์</b><br>042-xxx-xxx</div></div>\n  <div><span class="ux-icon-circle"><i class="fa-solid fa-envelope"></i></span><div><b>อีเมล</b><br>udtc@coj.go.th</div></div>\n  <div><span class="ux-icon-circle"><i class="fa-solid fa-location-dot"></i></span><div><b>ที่อยู่</b><br>…</div></div>\n</div>\n`],
    ['เส้นคั่น', `<hr class="ux-divider">\n`],
  ]],
  ['สื่อ', [
    ['ภาพ', `<img class="ux-img" src="${IMG_PH}" alt="คำอธิบายภาพ">\n`],
    ['วีดีโอ YouTube', `<div class="ux-video"><iframe src="https://www.youtube-nocookie.com/embed/VIDEO_ID" allowfullscreen loading="lazy"></iframe></div>\n`],
    ['แผนที่ Google Maps', `<div class="ux-video"><iframe src="https://maps.google.com/maps?q=ศาลจังหวัดอุดรธานี&output=embed" loading="lazy"></iframe></div>\n`],
  ]],
];
const VOID_TAGS = /^(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)$/i;
/** ช่องเขียนโค้ด: เลขบรรทัด, Tab เยื้อง, ขึ้นบรรทัดคงระดับเยื้อง, ปิดแท็กอัตโนมัติ */
function codeArea(ta, { html = false, onSave } = {}) {
  const wrap = ta.parentNode, gut = $('[data-gut]', wrap);
  const nums = () => { const n = ta.value.split('\n').length; if (gut.childElementCount !== n) gut.textContent = Array.from({ length: n }, (_, i) => i + 1).join('\n'); gut.scrollTop = ta.scrollTop; };
  const put = (txt, selBack = 0) => { ta.setRangeText(txt, ta.selectionStart, ta.selectionEnd, 'end'); if (selBack) ta.selectionStart = ta.selectionEnd = ta.selectionEnd - selBack; ta.dispatchEvent(new Event('input')); };
  ta.addEventListener('scroll', () => { gut.scrollTop = ta.scrollTop; });
  ta.addEventListener('input', nums);
  ta.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); onSave && onSave(); return; }
    if (e.key === 'Tab') {
      e.preventDefault();
      const v = ta.value, a = ta.selectionStart, b = ta.selectionEnd, ls = v.lastIndexOf('\n', a - 1) + 1;
      if (a === b && !e.shiftKey) return put('  ');
      const le = v.indexOf('\n', b - (b > a && v[b - 1] === '\n' ? 1 : 0)); const end = le < 0 ? v.length : le;
      const blk = v.slice(ls, end), nb = e.shiftKey ? blk.replace(/^ {1,2}/gm, '') : blk.replace(/^/gm, '  ');
      ta.setRangeText(nb, ls, end, 'select'); ta.dispatchEvent(new Event('input')); return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      const v = ta.value, a = ta.selectionStart, ls = v.lastIndexOf('\n', a - 1) + 1, ind = (v.slice(ls).match(/^[ \t]*/) || [''])[0];
      const prev = v.slice(ls, a), next = v.slice(a, a + 2);
      e.preventDefault();
      if (html && /<([a-z][\w-]*)[^>]*>$/i.test(prev) && next.startsWith('</')) return put('\n' + ind + '  \n' + ind, ind.length + 1);
      if (!html && /\{\s*$/.test(prev) && next.startsWith('}')) return put('\n' + ind + '  \n' + ind, ind.length + 1);
      return put('\n' + ind + (/[{]\s*$/.test(prev) ? '  ' : ''));
    }
    if (html && e.key === '>' && !e.ctrlKey && !e.metaKey) {
      const v = ta.value, a = ta.selectionStart, m = v.slice(Math.max(0, a - 200), a).match(/<([a-z][\w-]*)(\s[^<>]*)?$/i);
      if (m && !VOID_TAGS.test(m[1]) && !/\/$/.test(m[2] || '')) { e.preventDefault(); return put(`></${m[1]}>`, m[1].length + 3); }
    }
  });
  nums();
  return { insert: txt => { ta.focus(); put(txt); } };
}
const codeBox = (key, ph, rows = 20) => `<div class="cbx relative flex rounded-xl border border-slate-700 bg-[#0f172a] overflow-hidden ${key === 'html' ? '' : 'hidden'}" data-cbox="${key}">
  <pre data-gut class="select-none text-right text-[12px] leading-[1.6] font-mono text-slate-500 py-3 px-2 m-0 overflow-hidden bg-[#0b1222] border-r border-slate-800" style="min-width:2.8em"></pre>
  <textarea data-code="${key}" spellcheck="false" wrap="off" class="flex-1 min-w-0 bg-transparent text-[13px] leading-[1.6] font-mono text-slate-100 p-3 outline-none resize-none caret-amber-300" style="tab-size:2;height:var(--cbh,60vh)" placeholder="${esc(ph)}"></textarea></div>`;
/**
 * ตัวแก้ไขโค้ดพร้อมตัวอย่างสด
 * host: element · st: { html, css, js, tailwind } · opts: { tabs:['html','css','js'], bg, padding, onChange, onSave, page }
 */
function mountCodeEditor(host, st, opts = {}) {
  const tabs = opts.tabs || ['html', 'css', 'js'];
  host.innerHTML = `<div class="grid xl:grid-cols-2 gap-4 items-start">
    <div class="space-y-2 min-w-0">
      <div class="flex flex-wrap items-center gap-1.5">
        <div class="seg">${tabs.map((t, i) => `<button data-ctab="${t}" class="${i ? '' : 'on'}">${{ html: 'HTML', css: 'CSS', js: 'JavaScript' }[t]}</button>`).join('')}</div>
        <div class="relative" data-snipwrap><button class="btn btn-gold btn-sm" data-snipbtn>${icon('plus', 'w-3.5 h-3.5')} แทรกโครงสร้าง</button>
          <div data-snipmenu class="hidden absolute z-30 left-0 mt-1 w-72 max-h-[60vh] overflow-y-auto bg-white rounded-xl shadow-2xl border border-slate-200 p-1.5 text-sm">
            ${CODE_SNIPPETS.map(([g, list]) => `<div class="px-2 pt-2 pb-1 text-[11px] font-semibold text-slate-400 uppercase">${g}</div>${list.map(([n], i) => `<button class="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-navy-50 text-slate-700" data-snip="${esc(g)}|${i}">${esc(n)}</button>`).join('')}`).join('')}
          </div></div>
        <button class="btn btn-light btn-sm" data-cins="img" title="แทรกภาพจากคลังสื่อ">${icon('image', 'w-3.5 h-3.5')} ภาพ</button>
        <button class="btn btn-light btn-sm" data-cins="link" title="แทรกลิงก์ / ไฟล์">${icon('link', 'w-3.5 h-3.5')} ลิงก์</button>
        <button class="btn btn-light btn-sm" data-cins="icon" title="แทรกไอคอน Font Awesome">${icon('sparkle', 'w-3.5 h-3.5')} ไอคอน</button>
        ${opts.page ? '' : `<button class="btn btn-light btn-sm" data-cins="widget" title="ฝังส่วนแสดงผลอื่นในตำแหน่งนี้">${icon('widget', 'w-3.5 h-3.5')} ส่วนแสดงผล</button>`}
      </div>
      ${tabs.map(t => codeBox(t, t === 'html' ? 'พิมพ์ HTML เช่น <div class="ux-grid c3">…</div>' : t === 'css' ? '.my-box { color: #1e3a5f; }' : '// root = กล่องเนื้อหานี้ เช่น root.querySelector(...)')).join('')}
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span><b>Tab</b> เยื้อง · <b>Shift+Tab</b> ถอยเยื้อง · พิมพ์ <code>&lt;div&gt;</code> ปิดแท็กให้อัตโนมัติ · <b>Ctrl+S</b> บันทึก</span>
        ${opts.page ? '' : `<label class="flex items-center gap-1.5 ml-auto"><input type="checkbox" class="tgl" data-tw ${st.tailwind ? 'checked' : ''}> ใช้คลาส Tailwind (เฉพาะแบบ iframe)</label>`}
      </div>
      <details class="text-xs text-slate-600 rounded-xl border border-slate-200 bg-slate-50 p-3"><summary class="cursor-pointer font-semibold text-slate-700">คลาสสำเร็จรูป ux-… ที่ใช้ได้ทันที</summary>
        <div class="mt-2 grid sm:grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px] leading-relaxed">
          <div><b>ux-container</b> กล่องกว้างสุด 1200px</div><div><b>ux-section</b> เว้นระยะบน–ล่าง (.sm .lg)</div>
          <div><b>ux-grid c2…c6</b> กริด (มือถือย่ออัตโนมัติ)</div><div><b>ux-split</b> 2 คอลัมน์ (มือถือเรียงลง)</div>
          <div><b>ux-row</b> แถว (.center .between)</div><div><b>ux-head</b> หัวข้อมีแถบทอง</div>
          <div><b>ux-title / ux-text / ux-muted</b></div><div><b>ux-card / ux-card-body</b> การ์ด</div>
          <div><b>ux-tile</b> ปุ่มไอคอน</div><div><b>ux-btn</b> (.gold .outline .sm .lg .block)</div>
          <div><b>ux-hero</b> แบนเนอร์ภาพพื้นหลัง</div><div><b>ux-badge / ux-stat / ux-notice</b></div>
          <div><b>ux-list check / link</b></div><div><b>ux-table / ux-faq / ux-video</b></div>
          <div class="sm:col-span-2 font-sans">เปลี่ยนสีหลักทั้งชุด: ในแท็บ CSS ใส่ <code>.uw-code{--ux-primary:#7c2d12;--ux-accent:#d97706}</code></div>
        </div></details>
    </div>
    <div class="min-w-0 xl:sticky xl:top-20 space-y-2">
      <div class="flex items-center justify-between"><span class="text-sm font-semibold text-slate-700">ตัวอย่างสด</span>
        <div class="seg whitespace-nowrap">${[['100%', 'เต็ม'], ['768px', 'แท็บเล็ต'], ['390px', 'มือถือ']].map(([v, t], i) => `<button data-pvw="${v}" class="${i ? '' : 'on'}">${t}</button>`).join('')}</div></div>
      <div class="rounded-xl border border-slate-200 chk-pattern p-2 overflow-auto"><iframe data-cpv sandbox="allow-scripts allow-popups" class="bg-white mx-auto block rounded-lg border-0" style="width:100%;height:var(--cbh,60vh)"></iframe></div>
      <div data-cmsg class="text-xs text-slate-500"></div>
    </div></div>`;
  const tas = {}, eds = {};
  let cur = 'html';
  tabs.forEach(t => { tas[t] = $(`[data-code="${t}"]`, host); tas[t].value = st[t] || ''; eds[t] = codeArea(tas[t], { html: t === 'html', onSave: opts.onSave }); });
  const pv = $('[data-cpv]', host);
  let timer = 0, seq = 0;
  const refresh = async () => {
    const my = ++seq;
    try {
      const r = await fetch('/api/code-preview', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ bg: opts.bg ? opts.bg() : '#ffffff', padding: opts.padding ? opts.padding() : 16, code: { html: st.html, css: st.css || '', js: st.js || '', tailwind: !!st.tailwind, pad: true } }) });
      const html = await r.text(); if (my !== seq) return;
      pv.srcdoc = opts.page ? html.replace('</head>', '<script src="https://cdn.tailwindcss.com"></script></head>') : html;
      const n = (st.html.match(/<[a-z][\w-]*/gi) || []).length;
      $('[data-cmsg]', host).textContent = `${n} แท็ก · ${(new Blob([st.html + (st.css || '') + (st.js || '')]).size / 1024).toFixed(1)} KB`;
    } catch (e) { $('[data-cmsg]', host).textContent = 'แสดงตัวอย่างไม่สำเร็จ'; }
  };
  const changed = () => { opts.onChange && opts.onChange(); clearTimeout(timer); timer = setTimeout(refresh, 450); };
  tabs.forEach(t => tas[t].addEventListener('input', () => { st[t] = tas[t].value; changed(); }));
  $$('[data-ctab]', host).forEach(b => b.onclick = () => { cur = b.dataset.ctab; $$('[data-ctab]', host).forEach(x => x.classList.toggle('on', x === b)); $$('[data-cbox]', host).forEach(x => x.classList.toggle('hidden', x.dataset.cbox !== cur)); tas[cur].focus(); });
  $$('[data-pvw]', host).forEach(b => b.onclick = () => { $$('[data-pvw]', host).forEach(x => x.classList.toggle('on', x === b)); pv.style.width = b.dataset.pvw; });
  const tw = $('[data-tw]', host); if (tw) tw.onchange = () => { st.tailwind = tw.checked; changed(); };
  const menu = $('[data-snipmenu]', host);
  $('[data-snipbtn]', host).onclick = e => { e.stopPropagation(); menu.classList.toggle('hidden'); };
  document.addEventListener('click', e => { if (!host.contains(e.target) || !e.target.closest('[data-snipwrap]')) menu.classList.add('hidden'); });
  const toHtml = () => { if (cur !== 'html') $('[data-ctab="html"]', host).click(); return eds.html; };
  $$('[data-snip]', host).forEach(b => b.onclick = () => { const [g, i] = b.dataset.snip.split('|'), sn = CODE_SNIPPETS.find(x => x[0] === g)[1][+i]; menu.classList.add('hidden'); toHtml().insert(sn[1]); });
  $$('[data-cins]', host).forEach(b => b.onclick = async () => {
    const k = b.dataset.cins;
    if (k === 'img') { const u = await pickMedia('image'); if (u) toHtml().insert(`<img class="ux-img" src="${u}" alt="">`); }
    else if (k === 'icon') { const c = await pickIcon(''); if (c) toHtml().insert(`<i class="${c}"></i>`); }
    else if (k === 'link') {
      const r = await Swal.fire({ title: 'แทรกลิงก์', html: `<div style="text-align:left;display:grid;gap:8px;font-size:14px"><label>ข้อความ<input id="clT" class="swal2-input" style="margin:4px 0 0;width:100%"></label><label>URL<input id="clU" class="swal2-input" style="margin:4px 0 0;width:100%" placeholder="https://… หรือกดปุ่มด้านล่างเพื่อเลือกไฟล์"></label><button type="button" id="clF" class="swal2-styled" style="margin:0;background:#e2e8f0;color:#1e293b;font-size:13px">📎 เลือกไฟล์จากคลังสื่อ</button><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="clB" checked> เปิดในแท็บใหม่</label><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="clS"> แสดงเป็นปุ่ม</label></div>`,
        showCancelButton: true, confirmButtonText: 'แทรก', cancelButtonText: 'ยกเลิก', reverseButtons: true, focusConfirm: false,
        didOpen: () => { document.getElementById('clF').onclick = async () => { const keep = [document.getElementById('clT').value, document.getElementById('clB').checked, document.getElementById('clS').checked]; Swal.close(); const u = await pickMedia('any'); if (u) toHtml().insert(`<a${keep[2] ? ' class="ux-btn"' : ''} href="${u}"${keep[1] ? ' target="_blank" rel="noopener"' : ''}>${esc(keep[0] || fileTitle(u) || 'ดาวน์โหลด')}</a>`); }; },
        preConfirm: () => ({ t: document.getElementById('clT').value, u: document.getElementById('clU').value.trim(), b: document.getElementById('clB').checked, s: document.getElementById('clS').checked }) });
      if (r.isConfirmed && r.value.u) toHtml().insert(`<a${r.value.s ? ' class="ux-btn"' : ''} href="${esc(r.value.u)}"${r.value.b ? ' target="_blank" rel="noopener"' : ''}>${esc(r.value.t || r.value.u)}</a>`);
    } else if (k === 'widget') {
      const ws = (await api('GET', '/widgets')).filter(x => !opts.selfId || x.id !== opts.selfId);
      const r = await Swal.fire({ title: 'ฝังส่วนแสดงผลอื่น', input: 'select', inputOptions: Object.fromEntries(ws.map(x => [x.slug, `${x.name} (${LAYOUT_NAME[x.layout] || x.layout})`])), showCancelButton: true, confirmButtonText: 'แทรก', cancelButtonText: 'ยกเลิก', reverseButtons: true });
      if (r.isConfirmed && r.value) toHtml().insert(`{{widget:${r.value}}}\n`);
    }
  });
  refresh();
  return { refresh, setHeight: h => host.style.setProperty('--cbh', h) };
}
/** หน้าตัวแก้ไขของส่วนแสดงผลแบบเขียนโค้ด HTML */
async function viewCodeWidget(w) {
  w.code = Object.assign({ html: '', css: '', js: '', tailwind: false, pad: true }, w.code || {});
  const markDirty = () => { state.dirty = true; $('#dirtyDot').classList.remove('hidden'); $('#saveBtn').classList.add('ring-4', 'ring-gold-400/40'); };
  $('#view').innerHTML = `
  <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
    <div class="flex items-center gap-3 min-w-0">
      <a href="#/widgets" class="p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200">${icon('back', 'w-5 h-5')}</a>
      <div class="min-w-0"><div class="text-xs text-slate-500">ส่วนแสดงผล · เขียนโค้ด HTML</div><div class="flex items-center gap-1.5"><h1 class="text-xl font-bold text-slate-900 truncate" id="cwTitle">${esc(w.name)}</h1><button class="p-1.5 rounded-lg text-slate-400 hover:text-navy-700 hover:bg-white" id="cwRen" title="เปลี่ยนชื่อ">${icon('edit', 'w-4 h-4')}</button></div></div>
      <span id="dirtyDot" class="hidden text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">ยังไม่บันทึก</span>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <label class="flex items-center gap-1.5 text-sm text-slate-600">พื้นหลัง <input type="color" id="cwBg" class="h-8 w-10 rounded border border-slate-300" value="${/^#[0-9a-f]{6}$/i.test(w.bg) ? w.bg : '#ffffff'}"><button class="text-[11px] px-1.5 py-0.5 rounded border ${w.bg === 'transparent' ? 'border-navy-700 bg-navy-50 text-navy-800' : 'border-slate-300 text-slate-500'}" id="cwTr">โปร่งใส</button></label>
      <label class="flex items-center gap-1.5 text-sm text-slate-600">ระยะขอบ <input type="number" id="cwPad" class="inp !w-20 !py-1.5" min="0" max="80" value="${w.padding ?? 16}"></label>
      <a href="/embed/${esc(w.slug)}" target="_blank" class="btn btn-light">${icon('ext')} เปิดดู</a>
      <button class="btn btn-light" id="cwEmbed">${icon('code')} โค้ดฝัง iframe</button>
      <button class="btn btn-light" id="cwExport">${icon('down')} ส่งออก HTML+CSS</button>
      <button class="btn btn-primary" id="saveBtn">${icon('save')} บันทึก</button>
    </div>
  </div>
  <div id="cwEd"></div>`;
  state.dirty = false;
  const ed = mountCodeEditor($('#cwEd'), w.code, { bg: () => w.bg, padding: () => w.code.pad === false ? 0 : (w.padding ?? 16), onChange: markDirty, onSave: () => $('#saveBtn').onclick(), selfId: w.id });
  const save = async () => {
    try { const r = await api('PUT', `/widgets/${w.id}`, { ...w, layout: 'code' }); Object.assign(w, r); w.code = Object.assign(w.code, r.code); state.dirty = false; $('#dirtyDot').classList.add('hidden'); $('#saveBtn').classList.remove('ring-4', 'ring-gold-400/40'); ok('บันทึกเรียบร้อย'); return true; }
    catch (e) { fail(e.message); return false; }
  };
  $('#saveBtn').onclick = save;
  $('#cwBg').oninput = e => { w.bg = e.target.value; markDirty(); ed.refresh(); };
  $('#cwTr').onclick = () => { w.bg = 'transparent'; markDirty(); ed.refresh(); };
  $('#cwPad').oninput = e => { w.padding = Math.max(0, Math.min(80, +e.target.value || 0)); w.code.pad = w.padding > 0; markDirty(); ed.refresh(); };
  $('#cwRen').onclick = async () => { const r = await Swal.fire({ title: 'เปลี่ยนชื่อ', input: 'text', inputValue: w.name, showCancelButton: true, confirmButtonText: 'บันทึก', cancelButtonText: 'ยกเลิก', reverseButtons: true }); if (r.isConfirmed && r.value.trim()) { w.name = r.value.trim(); $('#cwTitle').textContent = w.name; await save(); } };
  $('#cwEmbed').onclick = async () => { if (state.dirty) await save(); showEmbed(w); };
  $('#cwExport').onclick = async () => { if (state.dirty) await save(); if (typeof showExport === 'function') showExport(w); else location.hash = `#/widgets/${w.id}`; };
}
/** แก้ไขโค้ด HTML ของรายการ / บล็อก ในหน้าต่างใหญ่ */
function editHtmlCode(html, onDone, { page = false } = {}) {
  const st = { html: html || '' };
  openModal({
    title: 'ตัวแก้ไขโค้ด HTML', size: 'max-w-[1400px]',
    body: '<div data-he style="--cbh:62vh"></div>',
    footer: `<button class="btn btn-light" data-close>ยกเลิก</button><button class="btn btn-primary" data-apply>${icon('check')} ใช้โค้ดนี้</button>`,
    onMount: (el, close) => { mountCodeEditor($('[data-he]', el), st, { tabs: ['html'], page, onSave: () => $('[data-apply]', el).click() }); $('[data-apply]', el).onclick = () => { onDone(st.html); close(); }; },
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
/* ---------------- PDF: ภาพตัวอย่างหน้าแรก (ใช้ในหลังบ้าน) ---------------- */
const PDFJS_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs', PDFW_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
let pdfLibP = null; const pdfThumbs = {};
function pdfThumb(url) {
  if (pdfThumbs[url]) return pdfThumbs[url];
  if (!pdfLibP) pdfLibP = import(PDFJS_URL).then(m => { m.GlobalWorkerOptions.workerSrc = PDFW_URL; return m; });
  return (pdfThumbs[url] = pdfLibP.then(m => m.getDocument({ url }).promise).then(async d => {
    const pg = await d.getPage(1), v = pg.getViewport({ scale: 1 }), vp = pg.getViewport({ scale: 360 / v.width });
    const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height;
    await pg.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
    return { src: c.toDataURL('image/jpeg', .8), pages: d.numPages };
  }).catch(() => null));
}
/** ใส่ภาพตัวอย่าง PDF ให้ทุก element ที่มี data-pdfthumb */
function fillPdfThumbs(root) {
  $$('[data-pdfthumb]', root).forEach(el => {
    const u = el.dataset.pdfthumb; el.removeAttribute('data-pdfthumb');
    pdfThumb(u).then(t => { if (!t) return; el.innerHTML = `<img src="${t.src}" style="width:100%;height:100%;object-fit:cover;object-position:top;display:block" draggable="false">${el.dataset.pages !== undefined ? `<span style="position:absolute;right:4px;bottom:4px;font-size:11px;background:rgba(15,23,42,.75);color:#fff;border-radius:4px;padding:0 5px">${t.pages} หน้า</span>` : ''}`; });
  });
}
const isPdfUrl = u => /\.pdf($|[?#])/i.test(String(u || ''));
const fileTitle = n => decodeURIComponent(String(n || '').split('/').pop()).replace(/\.[^.]+$/, '');
/** แปลงไฟล์ที่อัปโหลดแล้วเป็นรายการ (ภาพ = ลิงก์ภาพเต็มอัตโนมัติ · PDF = ตัวแสดงตัวอย่าง) */
function itemFromUpload(u) {
  const base = { id: rid(), title: fileTitle(u.name || u.url), subtitle: '', src: u.url, link: '', newTab: true, active: true, start: '', end: '' };
  if (isPdfUrl(u.url)) return { ...base, type: 'pdf', pdf: { mode: 'single', h: 640, hM: 0, bar: true, dl: true } };
  if (u.kind === 'video' || /\.(mp4|webm|ogg|mov)$/i.test(u.url)) return { ...base, type: 'video' };
  if (u.kind === 'image' || /\.(png|jpe?g|gif|webp|svg)$/i.test(u.url)) return { ...base, type: 'image', full: true };
  return null;
}

/* ---------------- ตัวแก้ไข + ออกแบบตาราง ---------------- */
const newTable = () => UB.normTable({ rows: [[{ t: 'ลำดับ' }, { t: 'รายการ' }, { t: 'รายละเอียด' }], [{ t: '1' }, { t: '' }, { t: '' }], [{ t: '2' }, { t: '' }, { t: '' }], [{ t: '3' }, { t: '' }, { t: '' }]], head: 1 });
function parseDelimited(text) {
  text = String(text || '').replace(/\r\n?/g, '\n').replace(/\n+$/, '');
  const delim = text.includes('\t') ? '\t' : ',';
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; continue; }
    if (ch === '"' && cur === '') q = true; else if (ch === delim) { row.push(cur); cur = ''; } else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; } else cur += ch;
  }
  row.push(cur); rows.push(row);
  return rows;
}
function editTable(it0, onDone) {
  const it = clone(it0); it.tb = UB.normTable(it.tb);
  let sel = { r0: 0, c0: 0, r1: 0, c1: 0 }, side = 'design';
  const T = () => it.tb;
  const nc = () => T().rows[0].length, nr = () => T().rows.length;
  const box = () => ({ r0: Math.min(sel.r0, sel.r1), r1: Math.max(sel.r0, sel.r1), c0: Math.min(sel.c0, sel.c1), c1: Math.max(sel.c0, sel.c1) });
  const blank = () => ({ t: '' });
  // ปรับ rowspan/colspan เมื่อแทรก/ลบแถว-คอลัมน์
  function insRow(at) {
    T().rows.forEach((r, ri) => r.forEach(c => { if (c.rs > 1 && ri < at && ri + c.rs > at) c.rs++; }));
    T().rows.splice(at, 0, Array.from({ length: nc() }, blank));
    if (at < T().head) T().head++;
  }
  function delRow(at) {
    if (nr() <= 1) return;
    T().rows.forEach((r, ri) => r.forEach((c, ci) => {
      if (c.rs > 1 && ri < at && ri + c.rs > at) c.rs--;
      if (ri === at && c.rs > 1 && T().rows[at + 1]) { T().rows[at + 1][ci] = { ...c, rs: c.rs - 1 }; }
    }));
    T().rows.splice(at, 1);
    if (at < T().head) T().head--;
  }
  function insCol(at) {
    T().rows.forEach(r => { r.forEach((c, ci) => { if (c.cs > 1 && ci < at && ci + c.cs > at) c.cs++; }); r.splice(at, 0, blank()); });
    T().colW.splice(at, 0, 0);
  }
  function delCol(at) {
    if (nc() <= 1) return;
    T().rows.forEach(r => { r.forEach((c, ci) => { if (c.cs > 1 && ci < at && ci + c.cs > at) c.cs--; if (ci === at && c.cs > 1 && r[at + 1]) r[at + 1] = { ...c, cs: c.cs - 1 }; }); r.splice(at, 1); });
    T().colW.splice(at, 1);
  }
  const cellsIn = f => { const b = box(); for (let r = b.r0; r <= b.r1; r++) for (let c = b.c0; c <= b.c1; c++) f(T().rows[r][c], r, c); };
  let pendingLink = null, pickP = null;
  openModal({
    title: 'ตาราง — แก้ไขข้อมูลและออกแบบ', size: 'max-w-[1400px]',
    body: `<div class="grid xl:grid-cols-[1fr_400px] gap-4">
      <div class="min-w-0 space-y-3">
        <div class="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs" data-tools>
          <span class="font-semibold text-slate-500 mr-1">แถว</span><button class="btn btn-light btn-sm" data-op="rowUp">+ บน</button><button class="btn btn-light btn-sm" data-op="rowDown">+ ล่าง</button><button class="btn btn-light btn-sm !text-rose-600" data-op="rowDel">ลบแถว</button>
          <span class="w-px h-6 bg-slate-300 mx-1"></span>
          <span class="font-semibold text-slate-500 mr-1">คอลัมน์</span><button class="btn btn-light btn-sm" data-op="colLeft">+ ซ้าย</button><button class="btn btn-light btn-sm" data-op="colRight">+ ขวา</button><button class="btn btn-light btn-sm !text-rose-600" data-op="colDel">ลบคอลัมน์</button>
          <span class="w-px h-6 bg-slate-300 mx-1"></span>
          <button class="btn btn-light btn-sm" data-op="merge" title="รวมเซลล์ที่เลือก (Shift+คลิกเพื่อเลือกหลายช่อง)">⊞ รวมเซลล์</button><button class="btn btn-light btn-sm" data-op="split">⊟ แยกเซลล์</button>
          <span class="w-px h-6 bg-slate-300 mx-1"></span>
          <button class="btn btn-light btn-sm !px-2" data-op="al-left" title="ชิดซ้าย">⯇</button><button class="btn btn-light btn-sm !px-2" data-op="al-center" title="กึ่งกลาง">≡</button><button class="btn btn-light btn-sm !px-2" data-op="al-right" title="ชิดขวา">⯈</button>
          <button class="btn btn-light btn-sm !px-2 font-bold" data-op="bold">B</button><button class="btn btn-light btn-sm !px-2 italic" data-op="ital">I</button>
          <label class="btn btn-light btn-sm !px-2 cursor-pointer" title="สีพื้นเซลล์">🎨<input type="color" class="w-0 h-0 opacity-0" data-cellc="bg" value="#fef3c7"></label>
          <label class="btn btn-light btn-sm !px-2 cursor-pointer" title="สีตัวอักษรในเซลล์"><span class="font-bold underline decoration-rose-500 decoration-2">A</span><input type="color" class="w-0 h-0 opacity-0" data-cellc="fg" value="#b91c1c"></label>
          <button class="btn btn-light btn-sm" data-op="clearfmt" title="ล้างรูปแบบเซลล์ที่เลือก">ล้างรูปแบบ</button>
          <span class="w-px h-6 bg-slate-300 mx-1"></span>
          <button class="btn btn-light btn-sm !text-navy-800 font-semibold" data-op="img" title="แทรกภาพลงในช่องที่เลือก (ตำแหน่งเคอร์เซอร์)">🖼 แทรกภาพ</button><button class="btn btn-light btn-sm !text-navy-800 font-semibold" data-op="qr" title="สร้าง/ออกแบบ QR Code แล้ววางในช่องที่เลือก · วางเคอร์เซอร์บนโค้ด QR เดิมแล้วกดเพื่อแก้ไข">${icon('qr', 'w-3.5 h-3.5 inline')} แทรก QR Code</button><button class="btn btn-light btn-sm !text-navy-800 font-semibold" data-op="link" title="แทรกลิงก์ / ทำข้อความที่เลือกให้เป็นลิงก์">🔗 แทรกลิงก์</button>
          <span class="w-px h-6 bg-slate-300 mx-1"></span>
          <button class="btn btn-light btn-sm" data-op="paste">📋 วางจาก Excel</button><label class="btn btn-light btn-sm cursor-pointer">📄 นำเข้า CSV<input type="file" accept=".csv,.tsv,.txt,text/csv" class="hidden" data-csv></label>
          <button class="btn btn-light btn-sm !text-rose-600" data-op="clearall">ล้างข้อมูล</button>
        </div>
        <div class="flex items-center gap-2 text-xs text-slate-500" data-selinfo></div>
        <div class="overflow-auto rounded-xl border border-slate-300 bg-white" style="max-height:46vh" data-gridwrap><table class="w-full border-collapse text-sm" data-grid></table></div>
        <p class="text-xs text-slate-500">คลิกช่องเพื่อพิมพ์ · <b>Shift + คลิก</b> เลือกหลายช่อง (เพื่อรวมเซลล์/จัดรูปแบบพร้อมกัน) · <b>Tab</b> ไปช่องถัดไป · <b>วางข้อมูลที่คัดลอกจาก Excel/Google Sheets</b> ลงในช่องได้เลย · ปุ่ม <b>🖼 แทรกภาพ</b> / <b>QR Code</b> / <b>🔗 แทรกลิงก์</b> จะใส่ที่ตำแหน่งเคอร์เซอร์ในช่อง (ภาพแสดงเป็นโค้ด ![ชื่อ|กว้าง](url) ในช่องแก้ไข) · ทำตัวหนาด้วย **ข้อความ**</p>
        <div><div class="text-xs font-semibold text-slate-500 mb-1">ตัวอย่างการแสดงผลจริง</div><div class="rounded-xl chk-pattern border border-slate-200 p-4 overflow-auto" style="max-height:38vh" data-pv></div></div>
      </div>
      <div class="space-y-3 min-w-0"><div class="seg" data-side><button data-sd="design">🎨 ออกแบบ</button><button data-sd="struct">⚙ โครงสร้างและฟังก์ชัน</button></div><div data-panel class="space-y-3"></div></div></div>`,
    footer: `<button class="btn btn-light" data-close>ยกเลิก</button><button class="btn btn-primary" data-apply>${icon('check')} ใช้ตารางนี้</button>`,
    onMount: (el, close) => {
      const grid = $('[data-grid]', el), pv = $('[data-pv]', el), panel = $('[data-panel]', el);
      const paint = () => { ensureFont(T().st.font); pv.innerHTML = UB.tableHtml(it); };
      function drawGrid() {
        const cov = UB.tableCover(T().rows), b = box();
        grid.innerHTML = `<thead><tr><th class="w-8 bg-slate-100 border border-slate-200"></th>${T().rows[0].map((_, c) => `<th class="bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-500 px-1 py-0.5 cursor-pointer hover:bg-slate-200" data-colh="${c}" title="เลือกทั้งคอลัมน์">${String.fromCharCode(65 + (c % 26))}${c >= 26 ? Math.floor(c / 26) : ''}${T().colW[c] ? ` · ${T().colW[c]}` : ''}</th>`).join('')}</tr></thead>
          <tbody>${T().rows.map((r, ri) => `<tr><th class="bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-500 cursor-pointer hover:bg-slate-200 ${ri < T().head ? '!bg-navy-100 !text-navy-800' : ''} ${T().foot && ri === nr() - 1 ? '!bg-amber-100' : ''}" data-rowh="${ri}" title="เลือกทั้งแถว">${ri < T().head ? 'H' : ri + 1 - T().head}</th>${r.map((c, ci) => cov[ri][ci] ? '' : `<td contenteditable="plaintext-only" spellcheck="false" data-r="${ri}" data-c="${ci}"${c.cs > 1 ? ` colspan="${c.cs}"` : ''}${c.rs > 1 ? ` rowspan="${c.rs}"` : ''} class="border border-slate-200 px-2 py-1.5 align-top min-w-[90px] outline-none focus:bg-sky-50 ${ri < T().head ? 'font-semibold bg-slate-50' : ''} ${ri >= b.r0 && ri <= b.r1 && ci >= b.c0 && ci <= b.c1 ? '!bg-sky-100 ring-1 ring-inset ring-sky-400' : ''}" style="${c.al ? `text-align:${c.al};` : ''}${c.b ? 'font-weight:700;' : ''}${c.i ? 'font-style:italic;' : ''}${c.bg ? `background:${c.bg};` : ''}${c.fg ? `color:${c.fg};` : ''}">${esc(c.t)}</td>`).join('')}</tr>`).join('')}</tbody>`;
        const n = (b.r1 - b.r0 + 1) * (b.c1 - b.c0 + 1);
        $('[data-selinfo]', el).innerHTML = `ตาราง <b>${nr()} × ${nc()}</b> · เลือก ${n > 1 ? `<b>${n} ช่อง</b>` : `ช่อง ${String.fromCharCode(65 + b.c0)}${b.r0 + 1}`}`;
      }
      const refreshSel = () => { const b = box(); $$('td[data-r]', grid).forEach(td => { const r = +td.dataset.r, c = +td.dataset.c, on = r >= b.r0 && r <= b.r1 && c >= b.c0 && c <= b.c1; td.classList.toggle('!bg-sky-100', on); td.classList.toggle('ring-1', on); td.classList.toggle('ring-inset', on); td.classList.toggle('ring-sky-400', on); }); const n = (b.r1 - b.r0 + 1) * (b.c1 - b.c0 + 1); $('[data-selinfo]', el).innerHTML = `ตาราง <b>${nr()} × ${nc()}</b> · เลือก ${n > 1 ? `<b>${n} ช่อง</b>` : `ช่อง ${String.fromCharCode(65 + b.c0)}${b.r0 + 1}`}`; };
      const redraw = () => { drawGrid(); paint(); drawPanel(); };
      grid.addEventListener('mousedown', e => {
        const td = e.target.closest('td[data-r]'), rh = e.target.closest('[data-rowh]'), ch = e.target.closest('[data-colh]');
        if (rh) { e.preventDefault(); const r = +rh.dataset.rowh; sel = e.shiftKey ? { ...sel, r1: r, c1: nc() - 1 } : { r0: r, c0: 0, r1: r, c1: nc() - 1 }; refreshSel(); drawPanel(); return; }
        if (ch) { e.preventDefault(); const c = +ch.dataset.colh; sel = e.shiftKey ? { ...sel, r1: nr() - 1, c1: c } : { r0: 0, c0: c, r1: nr() - 1, c1: c }; refreshSel(); drawPanel(); return; }
        if (!td) return;
        const r = +td.dataset.r, c = +td.dataset.c, cell = T().rows[r][c];
        if (e.shiftKey) { e.preventDefault(); sel = { ...sel, r1: r + (cell.rs || 1) - 1, c1: c + (cell.cs || 1) - 1 }; } else sel = { r0: r, c0: c, r1: r + (cell.rs || 1) - 1, c1: c + (cell.cs || 1) - 1 };
        refreshSel(); drawPanel();
      });
      // จำตำแหน่งเคอร์เซอร์/ข้อความที่เลือกในช่อง เพื่อแทรกภาพ/ลิงก์
      let caret = null;
      const offIn = (td, node, off) => { const r = document.createRange(); r.selectNodeContents(td); try { r.setEnd(node, off); } catch (e) { return td.innerText.length; } return r.toString().length; };
      const onSelChange = () => {
        if (!document.body.contains(grid)) return document.removeEventListener('selectionchange', onSelChange);
        const s = window.getSelection(); if (!s || !s.rangeCount) return;
        const rg = s.getRangeAt(0), td = rg.startContainer.nodeType === 1 ? rg.startContainer.closest && rg.startContainer.closest('td[data-r]') : rg.startContainer.parentElement && rg.startContainer.parentElement.closest('td[data-r]');
        if (!td || !grid.contains(td)) return;
        const a = offIn(td, rg.startContainer, rg.startOffset), b = offIn(td, rg.endContainer, rg.endOffset);
        caret = { r: +td.dataset.r, c: +td.dataset.c, a: Math.min(a, b), b: Math.max(a, b) };
      };
      document.addEventListener('selectionchange', onSelChange);
      const insertAt = (txt, replaceSel) => {
        const b0 = box(), cell = T().rows[b0.r0][b0.c0];
        const k = caret && caret.r === b0.r0 && caret.c === b0.c0 ? caret : { a: cell.t.length, b: cell.t.length };
        const a = Math.min(k.a, cell.t.length), e = Math.min(replaceSel ? k.b : k.a, cell.t.length);
        const pre = cell.t.slice(0, a), post = cell.t.slice(e);
        cell.t = pre + (pre && !/\s$/.test(pre) && !replaceSel ? ' ' : '') + txt + (post && !/^\s/.test(post) && !replaceSel ? ' ' : '') + post;
        caret = { r: b0.r0, c: b0.c0, a: a + txt.length + 1, b: a + txt.length + 1 };
      };
      grid.addEventListener('input', e => { const td = e.target.closest('td[data-r]'); if (!td) return; T().rows[+td.dataset.r][+td.dataset.c].t = td.innerText.replace(/\n$/, ''); paint(); });
      grid.addEventListener('keydown', e => {
        const td = e.target.closest('td[data-r]'); if (!td || e.key !== 'Tab') return;
        e.preventDefault(); const tds = $$('td[data-r]', grid), i = tds.indexOf(td), nx = tds[i + (e.shiftKey ? -1 : 1)];
        if (nx) { nx.focus(); sel = { r0: +nx.dataset.r, c0: +nx.dataset.c, r1: +nx.dataset.r, c1: +nx.dataset.c }; refreshSel(); }
        else if (!e.shiftKey) { insRow(nr()); sel = { r0: nr() - 1, c0: 0, r1: nr() - 1, c1: 0 }; redraw(); const f = $(`td[data-r="${nr() - 1}"][data-c="0"]`, grid); if (f) f.focus(); }
      });
      // วางข้อมูลหลายช่อง (จาก Excel / Google Sheets)
      grid.addEventListener('paste', e => {
        const td = e.target.closest('td[data-r]'); const txt = (e.clipboardData || window.clipboardData).getData('text');
        if (!td || !/[\t\n]/.test(txt.replace(/\n$/, ''))) return;
        e.preventDefault(); fillFrom(+td.dataset.r, +td.dataset.c, parseDelimited(txt));
      });
      function fillFrom(r0, c0, data) {
        while (nr() < r0 + data.length) insRow(nr());
        const w = Math.max(...data.map(r => r.length)); while (nc() < c0 + w) insCol(nc());
        data.forEach((row, i) => row.forEach((v, j) => { T().rows[r0 + i][c0 + j].t = v; }));
        sel = { r0, c0, r1: r0 + data.length - 1, c1: c0 + w - 1 }; redraw(); Toast.fire({ icon: 'success', title: `ใส่ข้อมูล ${data.length} แถว × ${w} คอลัมน์` });
      }
      $$('[data-op]', el).forEach(btn => btn.onclick = async () => {
        const op = btn.dataset.op, b = box();
        if (op === 'rowUp') { insRow(b.r0); sel = { r0: b.r0, c0: b.c0, r1: b.r0, c1: b.c0 }; }
        if (op === 'rowDown') { insRow(b.r1 + 1); sel = { r0: b.r1 + 1, c0: b.c0, r1: b.r1 + 1, c1: b.c0 }; }
        if (op === 'rowDel') { if (b.r1 - b.r0 + 1 >= nr()) return fail('ต้องเหลืออย่างน้อย 1 แถว'); for (let r = b.r1; r >= b.r0; r--) delRow(r); sel = { r0: Math.min(b.r0, nr() - 1), c0: 0, r1: Math.min(b.r0, nr() - 1), c1: 0 }; }
        if (op === 'colLeft') { insCol(b.c0); sel = { r0: b.r0, c0: b.c0, r1: b.r0, c1: b.c0 }; }
        if (op === 'colRight') { insCol(b.c1 + 1); sel = { r0: b.r0, c0: b.c1 + 1, r1: b.r0, c1: b.c1 + 1 }; }
        if (op === 'colDel') { if (b.c1 - b.c0 + 1 >= nc()) return fail('ต้องเหลืออย่างน้อย 1 คอลัมน์'); for (let c = b.c1; c >= b.c0; c--) delCol(c); sel = { r0: 0, c0: Math.min(b.c0, nc() - 1), r1: 0, c1: Math.min(b.c0, nc() - 1) }; }
        if (op === 'merge') {
          if (b.r0 === b.r1 && b.c0 === b.c1) return fail('เลือกหลายช่องก่อน (Shift + คลิก)');
          const head = T().rows[b.r0][b.c0], texts = [];
          cellsIn((c, r, ci) => { if (c.t && c !== head) texts.push(c.t); if (c !== head) { c.t = ''; delete c.cs; delete c.rs; } });
          if (texts.length) head.t = [head.t, ...texts].filter(Boolean).join(' ');
          head.cs = b.c1 - b.c0 + 1; head.rs = b.r1 - b.r0 + 1; if (head.cs < 2) delete head.cs; if (head.rs < 2) delete head.rs;
        }
        if (op === 'split') cellsIn(c => { delete c.cs; delete c.rs; });
        if (op.startsWith('al-')) cellsIn(c => { c.al = op.slice(3); });
        if (op === 'bold') { const on = !T().rows[b.r0][b.c0].b; cellsIn(c => { if (on) c.b = 1; else delete c.b; }); }
        if (op === 'ital') { const on = !T().rows[b.r0][b.c0].i; cellsIn(c => { if (on) c.i = 1; else delete c.i; }); }
        if (op === 'img') {
          const url = await pickMedia('image'); if (!url) return;
          const r = await Swal.fire({ title: 'แทรกภาพในตาราง', html: `<div style="text-align:left;font-size:14px;display:grid;gap:10px"><img src="${esc(url)}" style="max-height:110px;max-width:100%;margin:auto;border-radius:6px;border:1px solid #e2e8f0">
            <label>คำอธิบายภาพ (alt)<input id="swAlt" class="swal2-input" style="margin:4px 0 0;width:100%" value="${esc(fileTitle ? fileTitle(url) : '')}"></label>
            <label>ความกว้าง<div style="display:flex;gap:6px;margin-top:4px"><input id="swW" type="number" min="0" max="2000" value="80" class="swal2-input" style="margin:0;flex:1"><select id="swU" class="swal2-select" style="margin:0"><option value="">px</option><option value="%">% ของช่อง</option></select></div><small style="color:#64748b">0 = ขนาดจริง (ไม่เกินความกว้างช่อง)</small></label>
            <label>ลิงก์เมื่อคลิกภาพ (เว้นว่างได้)<input id="swL" class="swal2-input" style="margin:4px 0 0;width:100%" placeholder="https://… หรือเลือก &quot;เปิดภาพขนาดเต็ม&quot; ด้านล่าง"></label>
            <label style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="swFull"> คลิกแล้วเปิดภาพขนาดเต็ม</label></div>`,
            showCancelButton: true, confirmButtonText: 'แทรกภาพ', cancelButtonText: 'ยกเลิก', reverseButtons: true, focusConfirm: false,
            preConfirm: () => ({ alt: document.getElementById('swAlt').value.replace(/[\]|\[\n]/g, ' ').trim(), w: Math.max(0, Math.min(2000, +document.getElementById('swW').value || 0)), u: document.getElementById('swU').value, link: document.getElementById('swL').value.trim(), full: document.getElementById('swFull').checked }) });
          if (!r.isConfirmed) return;
          const v = r.value, w = v.w ? `|${v.u === '%' ? Math.min(100, v.w) + '%' : v.w}` : '';
          let code = `![${v.alt}${w}](${url})`;
          const lk = v.full ? url : v.link;
          if (lk) { if (!/^(https?:\/\/|\/|mailto:|tel:|#)/i.test(lk)) return fail('ลิงก์ต้องขึ้นต้นด้วย https:// หรือ /'); code = `[${code}](${lk})`; }
          insertAt(code); drawGrid(); paint(); return;
        }
        if (op === 'qr') {
          if (!T().qrs) T().qrs = {};
          const cell = T().rows[b.r0][b.c0], re = /!\[[^\]\n|]*(?:\|\d{1,4}%?)?\]\(qr:([\w-]{1,40})\)/g;
          const k = caret && caret.r === b.r0 && caret.c === b.c0 ? caret : null;
          let hit = null, mm;
          while ((mm = re.exec(cell.t))) { if (T().qrs[mm[1]] && (!k || (k.a >= mm.index && k.a <= mm.index + mm[0].length))) { hit = mm[1]; if (k) break; } }
          if (hit && !k && (cell.t.match(re) || []).length > 1) hit = null;
          if (hit) return designQr({ title: 'QR Code', qr: T().qrs[hit] }, n => { T().qrs[hit] = n.qr; drawGrid(); paint(); ok('แก้ไข QR Code ในตารางแล้ว'); });
          return designQr({ title: '', qr: { ...newQr(), maxW: 1200 } }, async n => {
            const q = n.qr, isLink = /^(https?:|tel:|mailto:)/i.test(q.text);
            const r = await Swal.fire({ title: 'วาง QR Code ในช่องตาราง', html: `<div style="text-align:left;font-size:14px;display:grid;gap:10px">
              <label>ความกว้างในช่อง<div style="display:flex;gap:6px;margin-top:4px"><input id="swQW" type="number" min="30" max="1200" value="110" class="swal2-input" style="margin:0;flex:1"><select id="swQU" class="swal2-select" style="margin:0"><option value="">px</option><option value="%">% ของช่อง</option></select></div></label>
              ${isLink ? '<label style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="swQL" checked> คลิกที่ QR แล้วเปิดลิงก์ในโค้ด</label>' : ''}</div>`,
              showCancelButton: true, confirmButtonText: 'วางในช่อง', cancelButtonText: 'ยกเลิก', reverseButtons: true, focusConfirm: false,
              preConfirm: () => ({ w: Math.max(30, Math.min(1200, +document.getElementById('swQW').value || 110)), u: document.getElementById('swQU').value, link: !!(document.getElementById('swQL') || {}).checked }) });
            if (!r.isConfirmed) return;
            let id; do { id = 'q' + Math.random().toString(36).slice(2, 8); } while (T().qrs[id]);
            T().qrs[id] = q;
            const alt = (q.cap || 'QR Code').replace(/[\[\]|\n]/g, ' ').slice(0, 60), wv = r.value.u === '%' ? Math.min(100, r.value.w) + '%' : r.value.w;
            let code = `![${alt}|${wv}](qr:${id})`;
            if (r.value.link && isLink) code = `[${code}](${q.text.replace(/\s/g, '%20').replace(/\)/g, '%29')})`;
            insertAt(code); drawGrid(); paint(); ok('วาง QR Code ในตารางแล้ว');
          });
        }
        if (op === 'link') {
          const cell = T().rows[b.r0][b.c0], k = caret && caret.r === b.r0 && caret.c === b.c0 && caret.b > caret.a ? caret : null;
          const selTxt = k ? cell.t.slice(k.a, k.b) : '';
          const r = await Swal.fire({ title: 'แทรกลิงก์ในตาราง', html: `<div style="text-align:left;font-size:14px;display:grid;gap:10px">
            <label>ข้อความที่แสดง<input id="swT" class="swal2-input" style="margin:4px 0 0;width:100%" value="${esc(selTxt)}" placeholder="เช่น ดาวน์โหลดแบบฟอร์ม"></label>
            <label>ที่อยู่ลิงก์ (URL)<input id="swU2" class="swal2-input" style="margin:4px 0 0;width:100%" placeholder="https://… · tel:042… · mailto:…"></label>
            <button type="button" id="swPickF" class="swal2-styled" style="margin:0;background:#e2e8f0;color:#1e293b;font-size:13px">📎 เลือกไฟล์จากคลังสื่อ (PDF / ภาพ / เอกสาร)</button></div>`,
            showCancelButton: true, confirmButtonText: 'แทรกลิงก์', cancelButtonText: 'ยกเลิก', reverseButtons: true, focusConfirm: false,
            didOpen: () => { (selTxt ? document.getElementById('swU2') : document.getElementById('swT')).focus(); document.getElementById('swPickF').onclick = async () => { const keep = { t: document.getElementById('swT').value }; pickP = (async () => { Swal.close(); const u = await pickMedia('any'); pendingLink = u ? { t: keep.t, u } : null; })(); }; },
            preConfirm: () => { const t = document.getElementById('swT').value.replace(/[\[\]\n]/g, ' ').trim(), u = document.getElementById('swU2').value.trim();
              if (!/^(https?:\/\/|\/|mailto:|tel:|#)\S*$/i.test(u)) { Swal.showValidationMessage('ใส่ URL ที่ขึ้นต้นด้วย https:// , / , tel: หรือ mailto:'); return false; }
              return { t: t || u, u }; } });
          if (!r.isConfirmed && pickP) { await pickP; pickP = null; }
          let v = r.isConfirmed ? r.value : null;
          if (!v && pendingLink) { v = { t: pendingLink.t || fileTitle(pendingLink.u) || 'ไฟล์แนบ', u: pendingLink.u }; pendingLink = null; }
          if (!v) return;
          insertAt(`[${v.t}](${v.u.replace(/\s/g, '%20').replace(/\)/g, '%29')})`, !!(k && selTxt)); drawGrid(); paint(); return;
        }
        if (op === 'clearfmt') cellsIn(c => { ['al', 'b', 'i', 'bg', 'fg'].forEach(k => delete c[k]); });
        if (op === 'clearall') { if (!(await confirmBox('ล้างข้อมูลทั้งตาราง?', 'ข้อความในทุกช่องจะถูกลบ (โครงสร้างและการออกแบบยังอยู่)', 'ล้างข้อมูล'))) return; T().rows.forEach(r => r.forEach(c => { c.t = ''; })); }
        if (op === 'paste') {
          const r = await Swal.fire({ title: 'วางข้อมูลจาก Excel / Google Sheets', input: 'textarea', inputPlaceholder: 'คัดลอกช่วงเซลล์จาก Excel แล้ววาง (Ctrl/⌘+V) ที่นี่', inputAttributes: { rows: 10 },
            html: '<label style="display:flex;gap:6px;align-items:center;justify-content:center;font-size:14px"><input type="checkbox" id="swRepl" checked> แทนที่ข้อมูลเดิมทั้งตาราง (แถวแรก = หัวตาราง)</label>', showCancelButton: true, confirmButtonText: 'ใส่ข้อมูล', cancelButtonText: 'ยกเลิก', reverseButtons: true,
            preConfirm: v => ({ v, repl: document.getElementById('swRepl').checked }) });
          if (!r.isConfirmed || !r.value.v.trim()) return;
          const data = parseDelimited(r.value.v);
          if (r.value.repl) { const w = Math.max(...data.map(x => x.length)); it.tb = UB.normTable({ ...T(), rows: data.map(row => Array.from({ length: w }, (_, i) => ({ t: row[i] || '' }))), colW: [], head: 1 }); sel = { r0: 0, c0: 0, r1: 0, c1: 0 }; }
          else return fillFrom(box().r0, box().c0, data);
        }
        redraw();
      });
      $$('[data-cellc]', el).forEach(i => i.addEventListener('input', () => { cellsIn(c => { c[i.dataset.cellc] = i.value; }); drawGrid(); paint(); }));
      $('[data-csv]', el).onchange = async e => {
        const f = e.target.files[0]; e.target.value = ''; if (!f) return;
        const data = parseDelimited((await f.text()).replace(/^﻿/, ''));
        const w = Math.max(...data.map(x => x.length));
        it.tb = UB.normTable({ ...T(), rows: data.map(row => Array.from({ length: w }, (_, i) => ({ t: row[i] || '' }))), colW: [], head: 1 });
        sel = { r0: 0, c0: 0, r1: 0, c1: 0 }; redraw(); ok(`นำเข้า ${data.length} แถว`);
      };
      $$('[data-sd]', el).forEach(b => b.onclick = () => { side = b.dataset.sd; drawPanel(); });
      function drawPanel() {
        $$('[data-sd]', el).forEach(b => b.classList.toggle('on', b.dataset.sd === side));
        const t = T(), s = t.st, b = box();
        const seg = (k, list, obj = s, attr = 'tseg') => `<div class="seg flex-wrap">${list.map(([v, l]) => `<button type="button" data-${attr}="${k}" data-v="${v}" class="${String(obj[k]) === String(v) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
        const col = (k, l, allowT) => `<label class="flex items-center justify-between gap-2 text-sm text-slate-600">${l}<span class="flex items-center gap-1">${allowT ? `<button type="button" class="text-[11px] px-1.5 py-0.5 rounded border ${s[k] === 'transparent' ? 'border-navy-700 text-navy-800' : 'border-slate-300 text-slate-500'}" data-ttr="${k}">โปร่งใส</button>` : ''}<input type="color" class="h-7 w-9 rounded border border-slate-300 cursor-pointer" data-tc="${k}" value="${/^#[0-9a-f]{6}$/i.test(s[k] || '') ? s[k] : '#ffffff'}"></span></label>`;
        const rg = (k, l, min, max, step = 1, unit = 'px') => `<div><div class="flex justify-between"><label class="lbl !mb-0">${l}</label><span class="text-xs text-slate-500"><span data-tout="${k}">${s[k]}</span>${unit}</span></div><input type="range" class="w-full accent-navy-800" data-tr="${k}" min="${min}" max="${max}" step="${step}" value="${s[k]}"></div>`;
        const tg = (k, l, obj = s, attr = 'tt') => `<label class="flex items-center justify-between gap-2 text-sm text-slate-700 cursor-pointer py-0.5">${l}<input type="checkbox" class="tgl" data-${attr}="${k}" ${obj[k] ? 'checked' : ''}></label>`;
        const sec = (title, body, open = true) => `<details class="rounded-xl border border-slate-200 bg-white" ${open ? 'open' : ''}><summary class="px-3 py-2 cursor-pointer text-sm font-semibold text-slate-700 select-none">${title}</summary><div class="px-3 pb-3 space-y-3">${body}</div></details>`;
        if (side === 'design') panel.innerHTML = `
          <div><label class="lbl">ธีมสำเร็จรูป</label><div class="grid grid-cols-2 gap-1.5">${UB.TBPRESETS.map(p => `<button type="button" class="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-slate-200 hover:border-navy-400 text-xs text-left" data-tpre="${p.id}"><span class="w-6 h-4 rounded-sm border border-black/10 flex-none" style="background:linear-gradient(${p.s.headBg} 45%,${p.s.stripe ? p.s.stripeBg || '#f8fafc' : p.s.bg || '#fff'} 45%)"></span>${esc(p.name)}</button>`).join('')}</div></div>
          ${sec('🔤 ตัวอักษร', `<div class="grid grid-cols-2 gap-3"><div><label class="lbl">ฟอนต์</label><select class="inp !py-1.5" data-ts="font"><option value="">ตามเว็บไซต์</option>${UB.FONTS.map(([v, l]) => `<option value="${v}" ${s.font === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>${rg('size', 'ขนาด', 10, 48)}</div>${rg('minFs', 'ขนาดขั้นต่ำเมื่อย่อบนจอเล็ก (0 = ย่อตามสัดส่วนเสมอ)', 0, 32)}<p class="text-xs text-slate-500 -mt-1">บนผืนผ้าใบ ตาราง (และทุกอย่าง) จะย่อ–ขยายตามความกว้างจริงที่แสดง เช่น ผืนผ้าใบกว้าง 1200px แสดงในช่องกว้าง 600px ตัวอักษร 16px จะเหลือ 8px — ค่านี้กันไม่ให้เล็กกว่าที่กำหนด (ถ้าข้อความเกินกล่อง ตารางจะเลื่อนดูได้ หรือลากขยายกล่องบนผืนผ้าใบ)</p>
            ${col('color', 'สีตัวอักษร')}<div><label class="lbl">จัดข้อความ (ทั้งตาราง)</label>${seg('align', [['left', 'ซ้าย'], ['center', 'กลาง'], ['right', 'ขวา']])}</div><div><label class="lbl">แนวตั้งในช่อง</label>${seg('vAlign', [['top', 'บน'], ['middle', 'กลาง'], ['bottom', 'ล่าง']])}</div>`)}
          ${sec('🟦 หัวตาราง', `${col('headBg', 'สีพื้นหัวตาราง')}${col('headFg', 'สีตัวอักษรหัวตาราง')}<div class="grid grid-cols-2 gap-3">${rg('headSize', 'ขนาด (0 = เท่าเนื้อหา)', 0, 32)}<div><label class="lbl">ความหนา</label><select class="inp !py-1.5" data-ts="headWeight">${[400, 500, 600, 700, 800].map(v => `<option ${s.headWeight == v ? 'selected' : ''}>${v}</option>`).join('')}</select></div></div><div><label class="lbl">จัดข้อความหัวตาราง</label>${seg('headAlign', [['left', 'ซ้าย'], ['center', 'กลาง'], ['right', 'ขวา']])}</div>`)}
          ${sec('▤ พื้นและแถว', `${col('bg', 'สีพื้นตาราง', true)}${tg('stripe', 'แถวสลับสี')}${s.stripe ? col('stripeBg', 'สีแถวสลับ') : ''}${tg('hover', 'ไฮไลต์แถวเมื่อชี้เมาส์')}${s.hover ? col('hoverBg', 'สีไฮไลต์') : ''}
            ${tg('firstColBold', 'คอลัมน์แรกตัวหนา')}<label class="flex items-center justify-between gap-2 text-sm text-slate-600">สีพื้นคอลัมน์แรก<span class="flex items-center gap-1"><button type="button" class="text-[11px] px-1.5 py-0.5 rounded border border-slate-300 text-slate-500" data-tclr="firstColBg">ไม่ใช้</button><input type="color" class="h-7 w-9 rounded border border-slate-300 cursor-pointer" data-tc="firstColBg" value="${s.firstColBg || '#f1f5f9'}"></span></label>
            ${t.foot ? `${col('footBg', 'สีพื้นแถวสรุป')}${col('footFg', 'สีตัวอักษรแถวสรุป')}` : ''}`)}
          ${sec('▦ เส้นขอบ มุม และเงา', `<div><label class="lbl">เส้นขอบ</label>${seg('border', [['all', 'ทุกช่อง'], ['rows', 'เส้นแนวนอน'], ['cols', 'เส้นแนวตั้ง'], ['outer', 'กรอบนอก'], ['none', 'ไม่มี']])}</div>
            ${s.border !== 'none' ? `<div class="grid grid-cols-2 gap-3">${rg('bw', 'ความหนาเส้น', 1, 6)}<div class="flex items-end">${col('bc', 'สีเส้น')}</div></div>` : ''}
            <div class="grid grid-cols-2 gap-3">${rg('radius', 'มุมมน', 0, 32)}${rg('pad', 'ระยะในช่อง', 2, 28)}</div><div><label class="lbl">เงา</label>${seg('shadow', [['none', 'ไม่มี'], ['soft', 'อ่อน'], ['md', 'กลาง'], ['strong', 'เข้ม']])}</div>${rg('minColW', 'ความกว้างคอลัมน์ขั้นต่ำ', 0, 300)}`)}
          ${t.caption ? sec('🏷 ชื่อตาราง', `${col('capColor', 'สี')}<div class="grid grid-cols-2 gap-3">${rg('capSize', 'ขนาด', 12, 40)}<div><label class="lbl">ความหนา</label><select class="inp !py-1.5" data-ts="capWeight">${[400, 600, 700, 800].map(v => `<option ${s.capWeight == v ? 'selected' : ''}>${v}</option>`).join('')}</select></div></div><div>${seg('capAlign', [['left', 'ซ้าย'], ['center', 'กลาง'], ['right', 'ขวา']])}</div>`, false) : ''}`;
        else panel.innerHTML = `
          ${sec('📌 หัวและท้ายตาราง', `<div><label class="lbl">จำนวนแถวหัวตาราง</label>${seg('head', [[0, 'ไม่มี'], [1, '1 แถว'], [2, '2 แถว'], [3, '3 แถว']], t, 'tbs')}</div>
            ${tg('headCol', 'คอลัมน์แรกเป็นหัวแถว', t, 'tbt')}${tg('foot', 'แถวสุดท้ายเป็นแถวสรุป / รวม', t, 'tbt')}`)}
          ${sec('🏷 ชื่อและหมายเหตุ', `<div><label class="lbl">ชื่อตาราง (แสดงด้านบน · เว้นว่างได้)</label><input class="inp" data-tbx="caption" value="${esc(t.caption)}" placeholder="เช่น ตารางนัดพิจารณาคดี ประจำเดือน"></div>
            <div><label class="lbl">หมายเหตุใต้ตาราง</label><input class="inp" data-tbx="note" value="${esc(t.note)}" placeholder="เช่น ข้อมูล ณ วันที่ ..."></div>`)}
          ${sec('⚡ ฟังก์ชัน', `${tg('search', 'ช่องค้นหาในตาราง', t, 'tbt')}${tg('sort', 'คลิกหัวคอลัมน์เพื่อเรียงลำดับ', t, 'tbt')}${tg('sticky', 'หัวตารางติดด้านบนเมื่อเลื่อน', t, 'tbt')}${tg('wrap', 'ตัดขึ้นบรรทัดใหม่เมื่อข้อความยาว', t, 'tbt')}
            <div><label class="lbl">ความสูงสูงสุด (0 = ไม่จำกัด · เกินแล้วเลื่อนดูในตาราง)</label><input type="number" class="inp" data-tbn="maxH" min="0" max="4000" value="${t.maxH}"></div>
            <p class="text-xs text-slate-500">บนจอเล็ก ตารางกว้างจะเลื่อนซ้าย–ขวาได้อัตโนมัติ · ในผืนผ้าใบอิสระ ความสูงตามกรอบที่ลากปรับ</p>`)}
          ${sec('↔ ความกว้างคอลัมน์', `<p class="text-xs text-slate-500">ใส่เป็นสัดส่วน เช่น 1, 3, 2 (0 = อัตโนมัติ) · คอลัมน์ที่เลือกอยู่: <b>${String.fromCharCode(65 + b.c0)}</b></p>
            <div class="grid grid-cols-4 gap-2">${t.colW.map((v, c) => `<label class="text-xs text-slate-500 ${c >= b.c0 && c <= b.c1 ? 'font-bold text-navy-800' : ''}">${String.fromCharCode(65 + (c % 26))}<input type="number" class="inp !py-1 !px-2" min="0" max="2000" data-cw="${c}" value="${v}"></label>`).join('')}</div>`)}`;
        const set = (k, v) => { T().st[k] = v; const o = $(`[data-tout="${k}"]`, panel); if (o) o.textContent = v; paint(); };
        $$('[data-tr]', panel).forEach(i => i.addEventListener('input', () => set(i.dataset.tr, Number(i.value))));
        $$('[data-tc]', panel).forEach(i => i.addEventListener('input', () => set(i.dataset.tc, i.value)));
        $$('[data-ts]', panel).forEach(i => i.addEventListener('change', () => { set(i.dataset.ts, i.dataset.ts === 'font' ? i.value : Number(i.value)); }));
        $$('[data-tt]', panel).forEach(i => i.addEventListener('change', () => { T().st[i.dataset.tt] = i.checked; paint(); drawPanel(); }));
        $$('[data-tseg]', panel).forEach(b => b.onclick = () => { T().st[b.dataset.tseg] = b.dataset.v; paint(); drawPanel(); });
        $$('[data-ttr]', panel).forEach(b => b.onclick = () => { T().st[b.dataset.ttr] = 'transparent'; paint(); drawPanel(); });
        $$('[data-tclr]', panel).forEach(b => b.onclick = () => { T().st[b.dataset.tclr] = ''; paint(); drawPanel(); });
        $$('[data-tpre]', panel).forEach(b => b.onclick = () => { const p = UB.TBPRESETS.find(x => x.id === b.dataset.tpre); T().st = { ...UB.TBDEF, font: T().st.font, size: T().st.size, ...p.s }; it.tb = UB.normTable(T()); paint(); drawPanel(); });
        $$('[data-tbs]', panel).forEach(b => b.onclick = () => { T().head = Math.min(nr(), Number(b.dataset.v)); it.tb = UB.normTable(T()); redraw(); });
        $$('[data-tbt]', panel).forEach(i => i.addEventListener('change', () => { T()[i.dataset.tbt] = i.checked; it.tb = UB.normTable(T()); drawGrid(); paint(); drawPanel(); }));
        $$('[data-tbx]', panel).forEach(i => i.addEventListener('input', () => { T()[i.dataset.tbx] = i.value; paint(); }));
        $$('[data-tbx]', panel).forEach(i => i.addEventListener('change', () => drawPanel()));
        $$('[data-tbn]', panel).forEach(i => i.addEventListener('input', () => { T()[i.dataset.tbn] = Number(i.value) || 0; paint(); }));
        $$('[data-cw]', panel).forEach(i => i.addEventListener('input', () => { T().colW[+i.dataset.cw] = Math.max(0, Number(i.value) || 0); drawGrid(); paint(); }));
      }
      redraw();
      $('[data-apply]', el).onclick = () => { if (T().qrs) { const all = T().rows.flat().map(c => c.t).join('\n') + (T().note || ''); for (const k of Object.keys(T().qrs)) if (!all.includes(`(qr:${k})`)) delete T().qrs[k]; } it.tb = UB.normTable(T()); onDone(it); close(); };
    },
  });
}

/* ---------------- วีดีโอจาก URL ---------------- */
const VKIND_IC = { youtube: 'fa-brands fa-youtube text-red-600', ytlist: 'fa-brands fa-youtube text-red-600', vimeo: 'fa-brands fa-vimeo-v text-sky-500', facebook: 'fa-brands fa-facebook text-blue-600', tiktok: 'fa-brands fa-tiktok text-slate-900', instagram: 'fa-brands fa-instagram text-pink-600', gdrive: 'fa-brands fa-google-drive text-emerald-600', dailymotion: 'fa-solid fa-circle-play text-slate-800', streamable: 'fa-solid fa-circle-play text-sky-700', hls: 'fa-solid fa-tower-broadcast text-rose-600', file: 'fa-solid fa-file-video text-slate-600', iframe: 'fa-solid fa-code text-slate-600' };
const VKIND_NOTE = {
  facebook: 'วีดีโอต้องตั้งเป็น “สาธารณะ” จึงจะแสดงได้ · คลิปบางประเภทของ Facebook อาจไม่ยอมให้ฝัง',
  instagram: 'โพสต์ต้องเป็นบัญชีสาธารณะ · ตัวเลือกเล่นอัตโนมัติ/วนซ้ำใช้ไม่ได้กับ Instagram',
  tiktok: 'ตัวเลือกเล่นอัตโนมัติ/วนซ้ำใช้ไม่ได้กับ TikTok',
  gdrive: 'ต้องตั้งการแชร์ไฟล์เป็น “ทุกคนที่มีลิงก์” · Google Drive ไม่รองรับเล่นอัตโนมัติ',
  hls: 'สตรีมสด .m3u8 — Safari เล่นได้ทันที เบราว์เซอร์อื่นโหลดตัวเล่น hls.js อัตโนมัติ',
  iframe: 'ใช้โค้ดฝังจากเว็บต้นทางโดยตรง — ตัวเลือกเล่นอัตโนมัติ/วนซ้ำขึ้นกับเว็บต้นทาง',
};
function videoSection(it) {
  const vo = UB.normVideo(it.vo), info = UB.videoInfo(it.src, vo.frame), isFile = info.kind === 'file' || info.kind === 'hls';
  const tg = (k, l, dis) => `<label class="flex items-center justify-between gap-2 text-sm ${dis ? 'opacity-50' : 'text-slate-700'}">${l}<input type="checkbox" class="tgl" data-vo="${k}" ${vo[k] ? 'checked' : ''} ${dis ? 'disabled' : ''}></label>`;
  const noCtl = ['tiktok', 'instagram', 'gdrive', 'facebook', 'iframe'].includes(info.kind);
  return `<div class="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
    <div><label class="lbl">ลิงก์วีดีโอ หรือโค้ดฝัง</label>
      <div class="flex gap-2"><textarea class="inp text-sm font-mono !py-2" rows="2" data-vsrc placeholder="วางลิงก์ เช่น https://www.youtube.com/watch?v=… , https://youtu.be/… , Facebook, TikTok, Vimeo หรือโค้ด <iframe …>">${esc(vo.frame && it.src ? it.src : it.src)}</textarea>
      <div class="flex flex-col gap-1.5"><button class="btn btn-light btn-sm whitespace-nowrap" data-vpaste title="วางจากคลิปบอร์ด">${icon('copy', 'w-3.5 h-3.5')} วาง</button><button class="btn btn-primary btn-sm whitespace-nowrap" data-pick="video">${icon('upload', 'w-3.5 h-3.5')} อัปโหลด</button></div></div>
      <div data-vinfo class="mt-2"></div></div>
    <div data-vprevbox class="${it.src ? '' : 'hidden'}"><div class="flex items-center justify-between mb-1"><span class="lbl !mb-0">ตัวอย่าง</span><button class="btn btn-light btn-sm" data-vprevbtn>${icon('eye', 'w-3.5 h-3.5')} โหลดตัวอย่าง</button></div>
      <div data-vprev class="rounded-lg overflow-hidden bg-slate-900 mx-auto grid place-items-center text-slate-400 text-xs" style="aspect-ratio:${UB.videoRatio(it.src, vo) || '16/9'};max-height:340px">${info.thumb ? `<img src="${esc(info.thumb)}" class="w-full h-full object-cover opacity-80" alt="">` : 'กด “โหลดตัวอย่าง” เพื่อทดลองเล่น'}</div></div>
    <div class="grid sm:grid-cols-2 gap-x-4 gap-y-2">${tg('autoplay', 'เล่นอัตโนมัติ (ปิดเสียงให้)', noCtl && info.kind !== 'facebook')}${tg('mute', 'ปิดเสียง', noCtl && info.kind !== 'facebook')}${tg('loop', 'เล่นวนซ้ำ', noCtl)}${tg('controls', 'แสดงปุ่มควบคุม', noCtl)}</div>
    <div class="grid grid-cols-2 gap-3"><div><label class="lbl">เริ่มเล่นที่ (นาที:วินาที)</label><input class="inp" data-vstart value="${vo.start ? `${Math.floor(vo.start / 60)}:${String(vo.start % 60).padStart(2, '0')}` : ''}" placeholder="เช่น 1:30" ${noCtl ? 'disabled' : ''}></div>
      <div><label class="lbl">สัดส่วนกรอบ</label><select class="inp" data-vratio>${[['auto', 'อัตโนมัติ' + (info.vertical ? ' (แนวตั้ง 9:16)' : '')], ['16/9', '16:9 แนวนอน'], ['9/16', '9:16 แนวตั้ง (Shorts/Reels)'], ['4/3', '4:3'], ['1/1', '1:1 จัตุรัส'], ['21/9', '21:9 จอกว้าง']].map(([v, l]) => `<option value="${v}" ${vo.ratio === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div>
    <div class="rounded-lg border ${UB.normVPanel(it.vp).on ? 'border-navy-300 bg-navy-50' : 'border-slate-200 bg-white'} p-2.5 flex items-center gap-3">
      <div class="flex-1 text-sm"><b class="text-slate-800">กรอบและแถบหัวข้อ</b><div class="text-xs text-slate-500">${UB.normVPanel(it.vp).on ? `เปิดใช้ · ${UB.normVPanel(it.vp).toggle ? (UB.normVPanel(it.vp).open ? 'กดแถบเพื่อยุบได้ (เริ่มแบบเปิด)' : 'เริ่มแบบยุบ กดแถบเพื่อเปิด') : 'แถบหัวข้อคงที่'}` : 'ใส่ชื่อเรื่อง แถบหัวข้อที่กดยุบ/ขยายได้ และตกแต่งกรอบ'}</div></div>
      <button class="btn btn-gold btn-sm" data-vpdesign>🎨 ออกแบบกรอบ / แถบหัวข้อ</button></div>
    ${isFile ? `<div><label class="lbl">ภาพหน้าปก (ไม่บังคับ)</label><div class="flex gap-2"><input class="inp text-xs font-mono" data-f="poster" value="${esc(it.poster || '')}"><button class="btn btn-light btn-sm" data-pick="poster">${icon('media', 'w-3.5 h-3.5')}</button></div></div>` : ''}
  </div>`;
}
function bindVideoSection(F, it, redraw) {
  const ta = $('[data-vsrc]', F), box = $('[data-vinfo]', F);
  it.vo = UB.normVideo(it.vo);
  const show = () => {
    const raw = ta.value.trim(), frame = /^<iframe/i.test(raw), url = frame ? UB.iframeSrc(raw) : raw, info = UB.videoInfo(url, frame || it.vo.frame);
    if (!raw) { box.innerHTML = '<p class="text-xs text-slate-500">รองรับ YouTube (วีดีโอ / Shorts / Live / Playlist), Facebook (วีดีโอ / Reels / fb.watch), TikTok, Instagram Reels, Vimeo, Google Drive, Dailymotion, ไฟล์ .mp4/.webm, สตรีม .m3u8 และโค้ดฝัง &lt;iframe&gt; จากเว็บอื่น</p>'; return; }
    const bad = frame && !url ? 'ไม่พบลิงก์ในโค้ด iframe' : !/^(https?:\/\/|\/)/i.test(url) ? 'ลิงก์ต้องขึ้นต้นด้วย https://' : '';
    box.innerHTML = bad ? `<div class="text-xs p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">⚠ ${bad}</div>`
      : `<div class="flex items-start gap-2 text-xs p-2 rounded-lg ${info.unknown ? 'bg-amber-50 border border-amber-200 text-amber-900' : 'bg-emerald-50 border border-emerald-200 text-emerald-900'}"><i class="${VKIND_IC[info.kind] || 'fa-solid fa-circle-play'} text-base leading-none mt-0.5"></i><div><b>${info.unknown ? 'ไม่รู้จักเว็บนี้ — จะลองเล่นเป็นไฟล์วีดีโอ' : 'ตรวจพบ: ' + esc(info.name)}</b>${info.vertical ? ' · แนวตั้ง' : ''}${info.start ? ` · เริ่มที่ ${info.start} วินาที (จากลิงก์)` : ''}
        ${info.unknown ? '<div class="mt-0.5">ถ้าเป็นหน้าเว็บที่มีวีดีโอ ให้คัดลอก “โค้ดฝัง (Embed)” &lt;iframe&gt; จากเว็บนั้นมาวางแทน</div>' : VKIND_NOTE[info.kind] ? `<div class="mt-0.5 opacity-80">${VKIND_NOTE[info.kind]}</div>` : ''}</div></div>`;
  };
  ta.addEventListener('input', () => {
    const raw = ta.value.trim(), frame = /^<iframe/i.test(raw);
    it.src = frame ? UB.iframeSrc(raw) : raw; it.vo.frame = frame || (it.vo.frame && !UB.videoInfo(it.src).kind.match(/youtube|vimeo|facebook|tiktok|instagram|gdrive|dailymotion|streamable/));
    show(); $('[data-vprevbox]', F).classList.toggle('hidden', !it.src);
  });
  ta.addEventListener('change', () => { if (/^<iframe/i.test(ta.value.trim())) ta.value = it.src; setTimeout(redraw, 0); });
  show();
  const ps = $('[data-vpaste]', F); if (ps) ps.onclick = async () => { try { const t = await navigator.clipboard.readText(); if (t) { ta.value = t.trim(); ta.dispatchEvent(new Event('input')); ta.dispatchEvent(new Event('change')); } } catch (e) { fail('เบราว์เซอร์ไม่อนุญาตให้อ่านคลิปบอร์ด — กด Ctrl+V ในช่องแทน'); } };
  $$('[data-vo]', F).forEach(c => c.onchange = () => { it.vo[c.dataset.vo] = c.checked; if (c.dataset.vo === 'autoplay' && c.checked) it.vo.mute = true; it.vo = UB.normVideo(it.vo); redraw(); });
  const st = $('[data-vstart]', F); if (st) st.onchange = () => { it.vo.start = UB.normVideo({ start: (s => { s = s.trim(); if (!s) return 0; const c = s.split(':').map(Number); return c.reduce((a, b) => a * 60 + (b || 0), 0); })(st.value) }).start; };
  const rt = $('[data-vratio]', F); if (rt) rt.onchange = () => { it.vo.ratio = rt.value; redraw(); };
  const vd = $('[data-vpdesign]', F); if (vd) vd.onclick = () => designVPanel(it, n => { it.vp = n.vp; if (n.title != null) it.title = n.title; redraw(); });
  const pb = $('[data-vprevbtn]', F); if (pb) pb.onclick = () => { const h = UB.videoEmbed(it.src, it.vo, { poster: it.poster }); const pv = $('[data-vprev]', F); pv.innerHTML = h ? h.replace(/^<(iframe|video)/, '<$1 style="width:100%;height:100%;display:block;border:0;background:#000"') : 'ไม่พบวีดีโอ'; };
}

function designVPanel(it0, onDone) {
  const it = clone(it0); it.vp = UB.normVPanel({ ...(it.vp || {}), on: true }); if (!it.vp.title) it.vp.title = it.title || '';
  const V = () => it.vp, info = UB.videoInfo(it.src, it.vo && it.vo.frame);
  const ph = `<div class="uvp-ph" style="background:#0f172a ${info.thumb ? `url('${esc(info.thumb)}') center/cover` : ''};display:grid;place-items:center"><div style="width:64px;height:64px;border-radius:99px;background:rgba(0,0,0,.55);display:grid;place-items:center;color:#fff;font-size:26px">▶</div></div>`;
  let tab = 'bar';
  openModal({
    title: 'ออกแบบกรอบวีดีโอ และแถบหัวข้อ', size: 'max-w-6xl',
    body: `<div class="grid lg:grid-cols-[1fr_400px] gap-5"><div class="min-w-0 space-y-2 lg:sticky lg:top-0 self-start">
        <div class="rounded-2xl chk-pattern border border-slate-200 p-5"><div data-pv></div></div>
        <p class="text-xs text-slate-500">ตัวอย่างใช้ภาพแทนตัวเล่นจริง · กดที่แถบหัวข้อในตัวอย่างเพื่อลองยุบ/ขยาย</p></div>
      <div class="space-y-3 min-w-0"><div class="seg flex-wrap"><button data-tb="bar">🏷 แถบหัวข้อ</button><button data-tb="frame">🖼 กรอบ</button><button data-tb="act">↕ ยุบ/ขยาย</button></div><div data-panel class="space-y-3"></div></div></div>`,
    footer: `<label class="mr-auto flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" class="tgl" data-off> ไม่ใช้กรอบ (แสดงวีดีโออย่างเดียว)</label><button class="btn btn-light" data-close>ยกเลิก</button><button class="btn btn-primary" data-apply>${icon('check')} ใช้การออกแบบนี้</button>`,
    onMount: (el, close) => {
      const pv = $('[data-pv]', el), panel = $('[data-panel]', el);
      const paint = () => { if (V().font && typeof ensureFont === 'function') ensureFont(V().font); pv.innerHTML = UB.videoPanelHtml(it, { preview: ph }); const b = $('[data-uvp]', pv); if (b) b.onclick = () => { const P = b.parentNode, c = !P.classList.contains('closed'); P.classList.toggle('closed', c); b.setAttribute('aria-expanded', !c); }; };
      const set = (k, v, re) => { V()[k] = v; it.vp = UB.normVPanel(V()); const o = $(`[data-vout="${k}"]`, panel); if (o) o.textContent = v; paint(); if (re) draw(); };
      const sec = (t, b) => `<div class="rounded-xl border border-slate-200 bg-white p-3 space-y-3"><div class="text-sm font-semibold text-slate-700">${t}</div>${b}</div>`;
      const seg = (k, l) => `<div class="seg flex-wrap">${l.map(([v, t]) => `<button type="button" data-vseg="${k}" data-v="${v}" class="${String(V()[k]) === String(v) ? 'on' : ''}">${t}</button>`).join('')}</div>`;
      const rg = (k, l, a, b, u = 'px', st = 1) => `<div><div class="flex justify-between"><label class="lbl !mb-0">${l}</label><span class="text-xs text-slate-500"><span data-vout="${k}">${V()[k]}</span>${u}</span></div><input type="range" class="w-full accent-navy-800" data-vr="${k}" min="${a}" max="${b}" step="${st}" value="${V()[k]}"></div>`;
      const col = (k, l, tr, opt) => `<label class="flex items-center justify-between gap-2 text-sm text-slate-600">${l}<span class="flex items-center gap-1">${tr ? `<button type="button" class="text-[11px] px-1.5 py-0.5 rounded border ${V()[k] === 'transparent' ? 'border-navy-700 bg-navy-50 text-navy-800' : 'border-slate-300 text-slate-500'}" data-vtr="${k}">โปร่งใส</button>` : ''}${opt ? `<button type="button" class="text-[11px] px-1.5 py-0.5 rounded border ${!V()[k] ? 'border-navy-700 bg-navy-50 text-navy-800' : 'border-slate-300 text-slate-500'}" data-vclr="${k}">${opt}</button>` : ''}<input type="color" class="h-8 w-10 rounded border border-slate-300 cursor-pointer" data-vc="${k}" value="${/^#[0-9a-f]{6}$/i.test(V()[k] || '') ? V()[k] : '#ffffff'}"></span></label>`;
      function draw() {
        $$('[data-tb]', el).forEach(b => b.classList.toggle('on', b.dataset.tb === tab));
        const v = V();
        if (tab === 'bar') panel.innerHTML = sec('ธีมสำเร็จรูป', `<div class="grid grid-cols-2 gap-1.5">${UB.VPPRESETS.map(p => `<button type="button" class="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-slate-200 hover:border-navy-400 text-xs text-left" data-vpre="${p.id}"><span class="w-7 h-5 rounded flex-none border" style="background:${p.s.barBg2 ? `linear-gradient(135deg,${p.s.barBg},${p.s.barBg2})` : p.s.barBg};border-color:${p.s.bw ? p.s.bc : '#e2e8f0'}"></span>${esc(p.name)}</button>`).join('')}</div>`)
          + sec('ชื่อเรื่อง', `<div><label class="lbl">หัวข้อ</label><input class="inp" data-vx="title" value="${esc(v.title)}" placeholder="เช่น วีดีโอแนะนำการติดต่อศาล"></div><div><label class="lbl">คำอธิบายรอง (ไม่บังคับ)</label><input class="inp" data-vx="sub" value="${esc(v.sub)}" placeholder="เช่น ความยาว 3 นาที"></div>
            <div><label class="lbl">ไอคอนหน้าหัวข้อ</label><div class="flex gap-2"><select class="inp" data-vicon>${[['auto', 'อัตโนมัติ (ตามแหล่งวีดีโอ)'], ['', 'ไม่มีไอคอน'], ['fa-solid fa-circle-play', '▶ ปุ่มเล่น'], ['fa-solid fa-film', '🎞 ฟิล์ม'], ['fa-solid fa-video', '📹 กล้อง'], ['fa-solid fa-scale-balanced', '⚖ ตราชั่ง'], ['fa-solid fa-bullhorn', '📢 ประกาศ'], ['fa-solid fa-circle-info', 'ℹ ข้อมูล'], ['fa-brands fa-youtube', 'YouTube'], ['fa-brands fa-facebook', 'Facebook']].map(([a, b]) => `<option value="${a}" ${v.icon === a ? 'selected' : ''}>${b}</option>`).join('')}${!['auto', '', 'fa-solid fa-circle-play', 'fa-solid fa-film', 'fa-solid fa-video', 'fa-solid fa-scale-balanced', 'fa-solid fa-bullhorn', 'fa-solid fa-circle-info', 'fa-brands fa-youtube', 'fa-brands fa-facebook'].includes(v.icon) ? `<option value="${esc(v.icon)}" selected>${esc(v.icon)}</option>` : ''}</select><button class="btn btn-light btn-sm" data-vipick title="เลือกไอคอนอื่น">${icon('sparkle', 'w-3.5 h-3.5')}</button></div></div>`)
          + sec('รูปแบบแถบ', `<div class="grid grid-cols-2 gap-3"><div><label class="lbl">ตำแหน่งแถบ</label>${seg('barPos', [['top', 'ด้านบน'], ['bottom', 'ด้านล่าง']])}</div><div><label class="lbl">จัดข้อความ</label>${seg('align', [['left', 'ชิดซ้าย'], ['center', 'กลาง']])}</div></div>
            ${col('barBg', v.barBg2 ? 'สีแถบ (เริ่ม)' : 'สีแถบ', true)}${col('barBg2', 'สีไล่ระดับ (ปลาย)', false, 'ไม่ไล่สี')}${col('barFg', 'สีตัวอักษร')}${col('subFg', 'สีคำอธิบายรอง', false, 'ตามตัวอักษร')}
            <div><label class="lbl">ฟอนต์</label><select class="inp" data-vfont><option value="">ตามเว็บไซต์</option>${UB.FONTS.map(([a, b]) => `<option value="${a}" ${v.font === a ? 'selected' : ''}>${b}</option>`).join('')}</select></div>
            <div class="grid grid-cols-2 gap-3">${rg('fs', 'ขนาดตัวอักษร', 10, 40)}${rg('bpad', 'ความสูงแถบ (ระยะขอบ)', 2, 32)}</div>
            <div><label class="lbl">ความหนาตัวอักษร</label>${seg('fw', [[400, 'ปกติ'], [600, 'หนา'], [700, 'หนามาก'], [800, 'หนาพิเศษ']])}</div>`);
        else if (tab === 'frame') panel.innerHTML = sec('ขนาดกรอบ', `${rg('maxW', 'ความกว้างสูงสุด (0 = เต็มพื้นที่)', 0, 1600)}<div><label class="lbl">จัดตำแหน่งกรอบ</label>${seg('falign', [['left', 'ซ้าย'], ['center', 'กลาง'], ['right', 'ขวา']])}</div>
            <div><label class="lbl">สัดส่วนวีดีโอ</label><select class="inp" data-vratio2>${[['auto', 'อัตโนมัติ'], ['16/9', '16:9'], ['9/16', '9:16 แนวตั้ง'], ['4/3', '4:3'], ['1/1', '1:1'], ['21/9', '21:9']].map(([a, b]) => `<option value="${a}" ${UB.normVideo(it.vo).ratio === a ? 'selected' : ''}>${b}</option>`).join('')}</select></div>`)
          + sec('เส้นขอบและมุม', `${rg('bw', 'ความหนาเส้นขอบ', 0, 12)}${v.bw ? col('bc', 'สีเส้นขอบ') : ''}${rg('radius', 'ความมนของมุม', 0, 40)}<div><label class="lbl">เงา</label>${seg('shadow', [['none', 'ไม่มี'], ['soft', 'นุ่ม'], ['md', 'กลาง'], ['strong', 'เข้ม']])}</div>`)
          + sec('พื้นหลังรอบวีดีโอ', `${col('bg', 'สีพื้น', true)}${rg('pad', 'ระยะขอบรอบวีดีโอ', 0, 40)}`);
        else panel.innerHTML = sec('การยุบ / ขยาย', `<label class="flex items-center justify-between text-sm text-slate-700">กดแถบหัวข้อเพื่อยุบ/ขยายวีดีโอ<input type="checkbox" class="tgl" data-vt="toggle" ${v.toggle ? 'checked' : ''}></label>
            ${v.toggle ? `<div><label class="lbl">สถานะเริ่มต้น</label>${seg('open', [['true', '▼ เปิดแสดงวีดีโอ (กดเพื่อยุบ)'], ['false', '▶ ยุบไว้ (แสดงเฉพาะแถบ กดเพื่อเปิด)']])}</div>
            <div><label class="lbl">สัญลักษณ์ที่แถบ</label>${seg('chev', [['chevron', '⌄ ลูกศร'], ['caret', '▾ สามเหลี่ยม'], ['plus', '＋ บวก/ลบ'], ['none', 'ไม่แสดง']])}</div>
            ${rg('ms', 'ความเร็วการยุบ/ขยาย', 0, 1200, ' ms', 50)}
            <p class="text-xs text-slate-500">เมื่อยุบ วีดีโอจะหยุดเล่นอัตโนมัติ · ถ้าเริ่มแบบยุบ ตัวเล่นจะยังไม่โหลดจนกว่าผู้ชมจะกดเปิด (หน้าเว็บโหลดเร็วขึ้น)</p>` : '<p class="text-xs text-slate-500">แถบหัวข้อแสดงคงที่ ไม่ยุบ/ขยาย</p>'}`);
        $$('[data-vpre]', panel).forEach(b => b.onclick = () => { const p = UB.VPPRESETS.find(x => x.id === b.dataset.vpre); it.vp = UB.normVPanel({ ...V(), ...p.s }); paint(); draw(); });
        $$('[data-vx]', panel).forEach(i => i.oninput = () => set(i.dataset.vx, i.value));
        $$('[data-vseg]', panel).forEach(b => b.onclick = () => set(b.dataset.vseg, b.dataset.vseg === 'open' ? b.dataset.v === 'true' : b.dataset.vseg === 'fw' ? Number(b.dataset.v) : b.dataset.v, true));
        $$('[data-vr]', panel).forEach(i => i.oninput = () => set(i.dataset.vr, Number(i.value)));
        $$('[data-vc]', panel).forEach(i => { i.oninput = () => set(i.dataset.vc, i.value); i.onchange = () => draw(); });
        $$('[data-vtr]', panel).forEach(b => b.onclick = () => set(b.dataset.vtr, 'transparent', true));
        $$('[data-vclr]', panel).forEach(b => b.onclick = () => set(b.dataset.vclr, '', true));
        $$('[data-vt]', panel).forEach(i => i.onchange = () => set(i.dataset.vt, i.checked, true));
        const ic = $('[data-vicon]', panel); if (ic) ic.onchange = () => set('icon', ic.value);
        const ip = $('[data-vipick]', panel); if (ip && typeof pickIcon === 'function') ip.onclick = async () => { const c = await pickIcon(V().icon); if (c) set('icon', c, true); }; else if (ip) ip.remove();
        const fo = $('[data-vfont]', panel); if (fo) fo.onchange = () => set('font', fo.value);
        const r2 = $('[data-vratio2]', panel); if (r2) r2.onchange = () => { it.vo = UB.normVideo({ ...(it.vo || {}), ratio: r2.value }); paint(); };
      }
      $$('[data-tb]', el).forEach(b => b.onclick = () => { tab = b.dataset.tb; draw(); });
      paint(); draw();
      $('[data-apply]', el).onclick = () => { const off = $('[data-off]', el).checked; it.vp = UB.normVPanel({ ...V(), on: !off }); if (it.vo) it0.vo = it.vo; onDone({ vp: it.vp, title: it.vp.title || it0.title }); close(); };
    },
  });
}

/* ---------------- ตัวสร้างและออกแบบ QR Code ---------------- */
const QR_KINDS = [
  ['url', '🔗 ลิงก์เว็บไซต์', [['url', 'ที่อยู่เว็บ (URL)', 'https://udtc.coj.go.th/']]],
  ['text', '📝 ข้อความ', [['text', 'ข้อความ', 'ศาลจังหวัดอุดรธานี', 'area']]],
  ['tel', '📞 โทรออก', [['tel', 'หมายเลขโทรศัพท์', '042-xxx-xxx']]],
  ['sms', '💬 ส่ง SMS', [['tel', 'หมายเลขผู้รับ', '08x-xxx-xxxx'], ['msg', 'ข้อความ', '', 'area']]],
  ['mail', '✉️ อีเมล', [['to', 'อีเมลผู้รับ', 'saraban@coj.go.th'], ['sub', 'หัวเรื่อง', ''], ['body', 'ข้อความ', '', 'area']]],
  ['line', '🟢 LINE', [['id', 'LINE ID / Official Account (เช่น @udtc)', '@'], ['url', 'หรือวางลิงก์ LINE (line.me/…) ทั้งลิงก์', '']]],
  ['wifi', '📶 Wi-Fi', [['ssid', 'ชื่อเครือข่าย (SSID)', ''], ['pass', 'รหัสผ่าน', ''], ['sec', 'ความปลอดภัย', 'WPA', 'sel:WPA=WPA/WPA2/WPA3,WEP=WEP,nopass=ไม่มีรหัส'], ['hidden', 'เครือข่ายซ่อน', '', 'chk']]],
  ['map', '📍 แผนที่ / ตำแหน่ง', [['q', 'ชื่อสถานที่ หรือพิกัด (lat,lng) หรือวางลิงก์ Google Maps', 'ศาลจังหวัดอุดรธานี']]],
];
function qrTextFrom(kind, f) {
  const v = k => String(f[k] || '').trim(), wesc = x => x.replace(/([\;,:"])/g, '\\$1');
  if (kind === 'url') { const u = v('url'); return u && !/^[a-z][\w+.-]*:/i.test(u) ? 'https://' + u : u; }
  if (kind === 'text') return String(f.text || '');
  if (kind === 'tel') return 'tel:' + v('tel').replace(/[^\d+*#]/g, '');
  if (kind === 'sms') return `SMSTO:${v('tel').replace(/[^\d+]/g, '')}:${v('msg')}`;
  if (kind === 'mail') { const q = [v('sub') && 'subject=' + encodeURIComponent(v('sub')), v('body') && 'body=' + encodeURIComponent(v('body'))].filter(Boolean).join('&'); return `mailto:${v('to')}${q ? '?' + q : ''}`; }
  if (kind === 'line') { if (/^https?:\/\//i.test(v('url'))) return v('url'); const id = v('id').replace(/^@?/, '@'); return id.length > 1 ? `https://line.me/R/ti/p/${encodeURIComponent(id)}` : ''; }
  if (kind === 'wifi') return `WIFI:T:${f.sec || 'WPA'};S:${wesc(v('ssid'))};${f.sec === 'nopass' ? '' : `P:${wesc(v('pass'))};`}${f.hidden ? 'H:true;' : ''};`;
  if (kind === 'map') { const q = v('q'); if (/^https?:\/\//i.test(q)) return q; const ll = q.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/); return ll ? `https://www.google.com/maps?q=${ll[1]},${ll[2]}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`; }
  return '';
}
const hexLum = h => { const m = String(h || '').match(/^#?([0-9a-f]{6})/i); if (!m) return 1; const n = parseInt(m[1], 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(x => { x /= 255; return x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4; }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
async function toDataUrl(u) {
  if (!u || /^data:/.test(u)) return u;
  try { const r = await fetch(u, { mode: 'cors' }); if (!r.ok) return u; const b = await r.blob(); return await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => res(u); fr.readAsDataURL(b); }); } catch (e) { return u; }
}
async function downloadQr(q, kind, name) {
  const data = q.logo ? await toDataUrl(q.logo) : '';
  let svg = UB.qrSvg(q).replace('<svg ', '<svg xmlns:xlink="http://www.w3.org/1999/xlink" ');
  if (q.logo && data) svg = svg.split(`href="${esc(q.logo)}"`).join(`href="${data}"`);
  const base = (name || 'qr-code').replace(/[\\/:*?"<>|]+/g, '').slice(0, 60) || 'qr-code';
  const save = (blob, ext) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${base}.${ext}`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800); };
  if (kind === 'svg') return save(new Blob([svg], { type: 'image/svg+xml' }), 'svg');
  const size = kind === 'png-l' ? 2048 : 1024;
  const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
  const cv = document.createElement('canvas'); cv.width = cv.height = size; const ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = q.shape !== 'square';
  ctx.drawImage(img, 0, 0, size, size);
  try { cv.toBlob(b => b ? save(b, 'png') : fail('สร้างไฟล์ PNG ไม่ได้ — ลองดาวน์โหลดแบบ SVG'), 'image/png'); } catch (e) { fail('ภาพโลโก้มาจากโดเมนอื่นที่ไม่อนุญาตให้แปลงเป็น PNG — ดาวน์โหลดแบบ SVG แทนได้'); }
}
function newQr() { return UB.normQr({ kind: 'url', kf: { url: 'https://udtc.coj.go.th/' }, text: 'https://udtc.coj.go.th/', ...UB.QPRESETS[1].s, frame: 'none' }); }
function designQr(it0, onDone) {
  const it = clone(it0); it.qr = UB.normQr(it.qr || newQr());
  let tab = 'content';
  const Q = () => it.qr;
  openModal({
    title: 'QR Code — สร้างและออกแบบ', size: 'max-w-6xl',
    body: `<div class="grid lg:grid-cols-[1fr_420px] gap-5">
      <div class="min-w-0 space-y-3 lg:sticky lg:top-0 self-start">
        <div class="rounded-2xl chk-pattern border border-slate-200 p-6 grid place-items-center" style="min-height:360px"><div data-pv class="w-full" style="max-width:340px"></div></div>
        <div data-info class="text-xs rounded-xl border p-3 space-y-1"></div>
        <div class="flex flex-wrap gap-2"><span class="text-xs font-semibold text-slate-500 self-center mr-1">ดาวน์โหลด</span><button class="btn btn-light btn-sm" data-dl="png">PNG 1024px</button><button class="btn btn-light btn-sm" data-dl="png-l">PNG 2048px (พิมพ์)</button><button class="btn btn-light btn-sm" data-dl="svg">SVG (เวกเตอร์)</button></div>
      </div>
      <div class="space-y-3 min-w-0">
        <div class="seg flex-wrap" data-tabs><button data-tb="content">📝 เนื้อหา</button><button data-tb="style">🎨 สีและรูปทรง</button><button data-tb="logo">🖼 โลโก้กลาง</button><button data-tb="frame">🏷 กรอบ/คำบรรยาย</button></div>
        <div data-panel class="space-y-3"></div>
      </div></div>`,
    footer: `<button class="btn btn-light" data-close>ยกเลิก</button><button class="btn btn-primary" data-apply>${icon('check')} ใช้ QR Code นี้</button>`,
    onMount: (el, close) => {
      const pv = $('[data-pv]', el), panel = $('[data-panel]', el), info = $('[data-info]', el);
      const paint = () => {
        const q = Q(); pv.innerHTML = UB.qrHtml({ qr: q }, { noLink: true });
        const ecc = q.ecc === 'auto' ? (q.logo ? 'H' : 'M') : q.ecc; let m = null; try { m = UB.qrEncode(q.text || ' ', ecc); } catch (e) { }
        const warn = [];
        if (!q.text.trim()) warn.push('ยังไม่มีเนื้อหา');
        if (!m) warn.push('ข้อมูลยาวเกินกว่าที่ QR Code รองรับ — ลดความยาวข้อความ หรือเลือกระดับแก้ไขข้อผิดพลาดต่ำลง');
        if (q.logo && ['L', 'M'].includes(ecc)) warn.push('มีโลโก้แต่ระดับแก้ไขข้อผิดพลาดเป็น ' + ecc + ' — แนะนำ “อัตโนมัติ” หรือ H เพื่อให้สแกนได้แน่นอน');
        if (q.logo && q.logoSize > 28) warn.push('โลโก้ใหญ่มาก — ควรทดสอบสแกนด้วยมือถือก่อนใช้งานจริง');
        if (q.bg !== 'transparent' && hexLum(q.fg) > hexLum(q.bg)) warn.push('จุด QR สีอ่อนกว่าพื้น (สีกลับ) — มือถือบางรุ่น/บางแอปอาจสแกนไม่ได้');
        else if (q.bg !== 'transparent' && (Math.max(hexLum(q.fg), hexLum(q.bg)) + .05) / (Math.min(hexLum(q.fg), hexLum(q.bg)) + .05) < 4) warn.push('สีจุดกับสีพื้นใกล้กันเกินไป อาจสแกนยาก');
        if (q.bg === 'transparent') warn.push('พื้นโปร่งใส — ต้องวางบนพื้นสีอ่อน จุดจึงจะสแกนได้');
        if (m && m.size > 73 && q.shape !== 'square') warn.push('ข้อมูลยาว จุดเล็กมาก — แนะนำรูปทรง “สี่เหลี่ยม” หรือแสดงขนาดใหญ่ขึ้น');
        info.className = `text-xs rounded-xl border p-3 space-y-1 ${warn.length ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'}`;
        info.innerHTML = `<div class="font-semibold">${m ? `QR เวอร์ชัน ${m.ver} · ${m.size}×${m.size} จุด · แก้ไขข้อผิดพลาดระดับ ${ecc} (${{ L: '7', M: '15', Q: '25', H: '30' }[ecc]}%) · ${new TextEncoder().encode(q.text).length} ไบต์` : 'สร้าง QR ไม่ได้'}</div>
          ${warn.length ? warn.map(x => `<div>⚠ ${esc(x)}</div>`).join('') : '<div>✓ พร้อมใช้งาน — สร้างในเครื่อง ไม่ส่งข้อมูลไปเว็บอื่น · ควรทดลองสแกนด้วยมือถือจากหน้าจอนี้ก่อนนำไปใช้</div>'}`;
      };
      const set = (k, v, redrawPanel) => { Q()[k] = v; it.qr = UB.normQr(Q()); const o = $(`[data-qout="${k}"]`, panel); if (o) o.textContent = v; paint(); if (redrawPanel) drawPanel(); };
      $$('[data-tb]', el).forEach(b => b.onclick = () => { tab = b.dataset.tb; drawPanel(); });
      $$('[data-dl]', el).forEach(b => b.onclick = () => downloadQr(Q(), b.dataset.dl, it.title || Q().cap || 'qr-code').catch(() => fail('ดาวน์โหลดไม่สำเร็จ')));
      function drawPanel() {
        $$('[data-tb]', el).forEach(b => b.classList.toggle('on', b.dataset.tb === tab));
        const q = Q();
        const seg = (k, list) => `<div class="seg flex-wrap">${list.map(([v, l]) => `<button type="button" data-qseg="${k}" data-v="${v}" class="${String(q[k]) === String(v) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
        const col = (k, l, allowT) => `<label class="flex items-center justify-between gap-2 text-sm text-slate-600">${l}<span class="flex items-center gap-1">${allowT ? `<button type="button" class="text-[11px] px-1.5 py-0.5 rounded border ${q[k] === 'transparent' ? 'border-navy-700 text-navy-800 bg-navy-50' : 'border-slate-300 text-slate-500'}" data-qtr="${k}">โปร่งใส</button>` : ''}<input type="color" class="h-8 w-10 rounded border border-slate-300 cursor-pointer" data-qc="${k}" value="${/^#[0-9a-f]{6}$/i.test(q[k] || '') ? q[k] : '#ffffff'}"></span></label>`;
        const colOpt = (k, l, def) => `<label class="flex items-center justify-between gap-2 text-sm text-slate-600">${l}<span class="flex items-center gap-1"><button type="button" class="text-[11px] px-1.5 py-0.5 rounded border ${!q[k] ? 'border-navy-700 text-navy-800 bg-navy-50' : 'border-slate-300 text-slate-500'}" data-qclr="${k}">ตามสีจุด</button><input type="color" class="h-8 w-10 rounded border border-slate-300 cursor-pointer" data-qc="${k}" value="${q[k] || def}"></span></label>`;
        const rg = (k, l, min, max, unit = '') => `<div><div class="flex justify-between"><label class="lbl !mb-0">${l}</label><span class="text-xs text-slate-500"><span data-qout="${k}">${q[k]}</span>${unit}</span></div><input type="range" class="w-full accent-navy-800" data-qr="${k}" min="${min}" max="${max}" value="${q[k]}"></div>`;
        const sec = (title, body) => `<div class="rounded-xl border border-slate-200 bg-white p-3 space-y-3"><div class="text-sm font-semibold text-slate-700">${title}</div>${body}</div>`;
        if (tab === 'content') {
          const K = QR_KINDS.find(k => k[0] === q.kind) || QR_KINDS[0];
          panel.innerHTML = sec('ประเภทข้อมูล', `<div class="grid grid-cols-2 gap-1.5">${QR_KINDS.map(([k, l]) => `<button type="button" class="px-2 py-1.5 rounded-lg border text-xs text-left ${q.kind === k ? 'border-navy-700 bg-navy-50 text-navy-900 font-semibold' : 'border-slate-200 hover:border-navy-400'}" data-qk="${k}">${l}</button>`).join('')}</div>`)
            + sec('ข้อมูลใน QR Code', K[2].map(([f, l, ph, ty]) => {
              const v = q.kf[f] != null ? q.kf[f] : '';
              if (ty === 'area') return `<div><label class="lbl">${l}</label><textarea class="inp" rows="3" data-kf="${f}" placeholder="${esc(ph)}">${esc(v)}</textarea></div>`;
              if (ty === 'chk') return `<label class="flex items-center justify-between text-sm text-slate-700">${l}<input type="checkbox" class="tgl" data-kf="${f}" ${v ? 'checked' : ''}></label>`;
              if (ty && ty.startsWith('sel:')) return `<div><label class="lbl">${l}</label><select class="inp" data-kf="${f}">${ty.slice(4).split(',').map(o => { const [a, b] = o.split('='); return `<option value="${a}" ${(v || ph) === a ? 'selected' : ''}>${b}</option>`; }).join('')}</select></div>`;
              return `<div><label class="lbl">${l}</label><input class="inp" data-kf="${f}" value="${esc(v)}" placeholder="${esc(ph)}"></div>`;
            }).join('') + `<details class="text-xs"><summary class="cursor-pointer text-slate-500">ข้อมูลจริงที่เข้ารหัส</summary><code class="block mt-1 p-2 rounded bg-slate-100 break-all" data-raw>${esc(q.text)}</code></details>`)
            + sec('ความทนทาน', `<div><label class="lbl">ระดับแก้ไขข้อผิดพลาด</label>${seg('ecc', [['auto', 'อัตโนมัติ'], ['L', 'L 7%'], ['M', 'M 15%'], ['Q', 'Q 25%'], ['H', 'H 30%']])}<p class="text-xs text-slate-500 mt-1">อัตโนมัติ = M ถ้าไม่มีโลโก้ / H ถ้ามีโลโก้ (ยิ่งสูงยิ่งทนต่อโลโก้/รอยเปื้อน แต่จุดหนาแน่นขึ้น)</p></div>
              <div><label class="lbl">ขนาดแสดงผลสูงสุด (px) ในส่วนแสดงผลแบบการ์ด/รายการ</label><input type="number" class="inp" min="60" max="1200" data-qn="maxW" value="${q.maxW}"></div>
              <label class="flex items-center justify-between text-sm text-slate-700">คลิกที่ QR แล้วเปิดลิงก์ในโค้ดด้วย (ลิงก์ / โทร / อีเมล)<input type="checkbox" class="tgl" data-qt="linkSelf" ${q.linkSelf ? 'checked' : ''}></label>`);
        } else if (tab === 'style') {
          panel.innerHTML = sec('ธีมสำเร็จรูป', `<div class="grid grid-cols-2 gap-1.5">${UB.QPRESETS.map(p => `<button type="button" class="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-slate-200 hover:border-navy-400 text-xs text-left" data-qpre="${p.id}"><span class="w-7 h-7 rounded border border-black/10 flex-none overflow-hidden" style="background:${p.s.bg || '#fff'}">${UB.qrSvg({ text: 'UDTC', margin: 1, ...p.s, frame: 'none' })}</span>${esc(p.name)}</button>`).join('')}</div>`)
            + sec('สี', `<div><label class="lbl">สีของจุด</label>${seg('grad', [['none', 'สีเดียว'], ['linear', 'ไล่สีแนวทแยง'], ['radial', 'ไล่สีจากกลาง']])}</div>
              ${col('fg', q.grad === 'none' ? 'สีจุด' : 'สีที่ 1')}${q.grad !== 'none' ? col('fg2', 'สีที่ 2') : ''}${col('bg', 'สีพื้นหลัง', true)}
              ${colOpt('eyeColor', 'สีกรอบตามุม', '#1e3a5f')}${colOpt('eyeInner', 'สีจุดกลางตามุม', '#b8862b')}`)
            + sec('รูปทรง', `<div><label class="lbl">รูปทรงจุด</label>${seg('shape', [['square', '■ สี่เหลี่ยม'], ['rounded', '▢ มุมมน'], ['dots', '● จุดกลม'], ['diamond', '◆ เพชร'], ['vbar', '┃ แท่งตั้ง']])}</div>
              <div><label class="lbl">รูปทรงตามุม (3 มุม)</label>${seg('eye', [['square', 'สี่เหลี่ยม'], ['rounded', 'มุมมน'], ['circle', 'วงกลม'], ['leaf', 'ใบไม้']])}</div>
              <div class="grid grid-cols-2 gap-3">${rg('margin', 'ขอบว่างรอบ QR', 0, 8, ' จุด')}${rg('radius', 'มุมพื้นหลังมน', 0, 40)}</div>
              <p class="text-xs text-slate-500">ขอบว่าง (quiet zone) อย่างน้อย 2 จุด ช่วยให้สแกนง่ายเมื่อวางบนพื้นที่มีลวดลาย</p>`);
        } else if (tab === 'logo') {
          panel.innerHTML = sec('โลโก้ตรงกลาง QR', `<div class="flex gap-3 items-center"><div class="w-20 h-20 rounded-xl border border-slate-200 chk-pattern grid place-items-center overflow-hidden flex-none">${q.logo ? `<img src="${esc(q.logo)}" class="max-w-full max-h-full object-contain">` : icon('image', 'w-7 h-7 text-slate-300')}</div>
              <div class="flex-1 space-y-2"><button class="btn btn-primary btn-sm w-full" data-qlogo>${icon('media', 'w-3.5 h-3.5')} เลือก / อัปโหลดโลโก้</button>${q.logo ? `<button class="btn btn-light btn-sm w-full !text-rose-600" data-qnologo>นำโลโก้ออก</button>` : ''}</div></div>
              <p class="text-xs text-slate-500">เมื่อใส่โลโก้ ระบบเลือกระดับแก้ไขข้อผิดพลาด <b>H (30%)</b> ให้อัตโนมัติ และเว้นจุดใต้โลโก้ออก เพื่อให้ยังสแกนได้ · แนะนำภาพ PNG พื้นโปร่งใส หรือ SVG</p>`)
            + (q.logo ? sec('ขนาดและพื้นรองโลโก้', `${rg('logoSize', 'ขนาดโลโก้ (% ของ QR)', 8, 32, '%')}
              <div><label class="lbl">พื้นรองหลังโลโก้</label>${seg('logoShape', [['rounded', 'มุมมน'], ['circle', 'วงกลม'], ['square', 'สี่เหลี่ยม'], ['none', 'ไม่มี (วางทับ)']])}</div>
              ${q.logoShape !== 'none' ? `${col('logoBg', 'สีพื้นรอง')}${rg('logoPad', 'ระยะห่างรอบโลโก้', 0, 30, '%')}` : ''}`) : '');
        } else {
          panel.innerHTML = sec('กรอบป้าย', `<div>${seg('frame', [['none', 'ไม่มีกรอบ'], ['bottom', 'ป้ายด้านล่าง'], ['top', 'ป้ายด้านบน'], ['box', 'กรอบอย่างเดียว']])}</div>
              ${q.frame !== 'none' ? `${col('frameColor', 'สีกรอบ/ป้าย')}${q.frame !== 'box' ? `<div><label class="lbl">ข้อความบนป้าย</label><input class="inp" data-qx="frameText" value="${esc(q.frameText)}" placeholder="สแกนเลย"></div>${col('frameFg', 'สีตัวอักษรบนป้าย')}` : ''}` : ''}
              <div class="flex flex-wrap gap-1.5">${['สแกนเลย', 'สแกนเพื่อเข้าเว็บไซต์', 'สแกนเพื่อติดต่อ', 'แบบประเมินความพึงพอใจ', 'SCAN ME'].map(t => `<button type="button" class="px-2 py-1 rounded-full border border-slate-200 text-xs hover:border-navy-400" data-qft="${esc(t)}">${esc(t)}</button>`).join('')}</div>`)
            + sec('คำบรรยายใต้ QR', `<div><input class="inp" data-qx="cap" value="${esc(q.cap)}" placeholder="เช่น ติดตามข่าวสารศาลจังหวัดอุดรธานี"></div><div class="grid grid-cols-2 gap-3 items-end">${rg('capSize', 'ขนาดตัวอักษร', 10, 48, 'px')}${col('capColor', 'สี')}</div>`);
        }
        $$('[data-qk]', panel).forEach(b => b.onclick = () => { if (q.kind === b.dataset.qk) return; q.kind = b.dataset.qk; const K = QR_KINDS.find(k => k[0] === q.kind); const kf = {}; K[2].forEach(([f, , ph, ty]) => { kf[f] = (ty === 'chk' ? false : ty && ty.startsWith('sel:') ? ph : (['url', 'text', 'id', 'q'].includes(f) ? ph : '')); }); q.kf = kf; q.text = qrTextFrom(q.kind, kf); it.qr = UB.normQr(q); paint(); drawPanel(); });
        $$('[data-kf]', panel).forEach(i => i.addEventListener(i.type === 'checkbox' || i.tagName === 'SELECT' ? 'change' : 'input', () => { q.kf[i.dataset.kf] = i.type === 'checkbox' ? i.checked : i.value; q.text = qrTextFrom(q.kind, q.kf); const raw = $('[data-raw]', panel); if (raw) raw.textContent = q.text; paint(); }));
        $$('[data-qseg]', panel).forEach(b => b.onclick = () => set(b.dataset.qseg, b.dataset.v, true));
        $$('[data-qc]', panel).forEach(i => i.addEventListener('input', () => set(i.dataset.qc, i.value)));
        $$('[data-qc]', panel).forEach(i => i.addEventListener('change', () => drawPanel()));
        $$('[data-qtr]', panel).forEach(b => b.onclick = () => set(b.dataset.qtr, 'transparent', true));
        $$('[data-qclr]', panel).forEach(b => b.onclick = () => set(b.dataset.qclr, '', true));
        $$('[data-qr]', panel).forEach(i => i.addEventListener('input', () => set(i.dataset.qr, Number(i.value))));
        $$('[data-qn]', panel).forEach(i => i.addEventListener('change', () => set(i.dataset.qn, Number(i.value))));
        $$('[data-qt]', panel).forEach(i => i.addEventListener('change', () => set(i.dataset.qt, i.checked)));
        $$('[data-qx]', panel).forEach(i => i.addEventListener('input', () => set(i.dataset.qx, i.value)));
        $$('[data-qft]', panel).forEach(b => b.onclick = () => { set('frameText', b.dataset.qft); if (q.frame === 'none') set('frame', 'bottom'); drawPanel(); });
        $$('[data-qpre]', panel).forEach(b => b.onclick = () => { const p = UB.QPRESETS.find(x => x.id === b.dataset.qpre); it.qr = UB.normQr({ ...Q(), eyeColor: '', eyeInner: '', grad: 'none', ...p.s, frame: p.s.frame || Q().frame }); paint(); drawPanel(); });
        const lg = $('[data-qlogo]', panel); if (lg) lg.onclick = async () => { const u = await pickMedia('image'); if (u) { set('logo', u, true); } };
        const nl = $('[data-qnologo]', panel); if (nl) nl.onclick = () => set('logo', '', true);
      }
      paint(); drawPanel();
      $('[data-apply]', el).onclick = () => {
        const q = UB.normQr(Q());
        if (!q.text.trim()) return fail('กรุณาใส่ข้อมูลใน QR Code');
        try { UB.qrEncode(q.text, q.ecc === 'auto' ? (q.logo ? 'H' : 'M') : q.ecc); } catch (e) { return fail('ข้อมูลยาวเกินไป'); }
        it.qr = q; if (!it.title) it.title = q.cap || 'QR Code'; onDone(it); close();
      };
    },
  });
}

/* ---------------- ตัวออกแบบภาพ (ผืนผ้าใบอิสระ) ---------------- */
const IMG_LABEL = {
  fit: [['cover', 'เต็มกรอบ'], ['contain', 'แสดงครบ'], ['fill', 'ยืดเต็ม']],
  pos: [['center', 'กลาง'], ['top', 'บน'], ['bottom', 'ล่าง'], ['left', 'ซ้าย'], ['right', 'ขวา']],
  shape: [['rect', 'สี่เหลี่ยม'], ['circle', 'วงกลม'], ['pill', 'แคปซูล'], ['blob', 'ทรงอิสระ'], ['arch', 'โค้งบน']],
  borderStyle: [['solid', 'เส้นทึบ'], ['dashed', 'เส้นประ'], ['double', 'เส้นคู่']],
  depth: [['none', 'ไม่มี'], ['soft', 'เงาอ่อน'], ['md', 'เงากลาง'], ['strong', 'เงาเข้ม'], ['emboss', 'นูน 3 มิติ'], ['float', 'ลอยตัว'], ['stack', 'ซ้อนชั้น'], ['neon', 'เรืองแสง'], ['inset', 'เว้าลึก']],
  hover: [['none', 'ไม่มี'], ['zoom', 'ซูมเข้า'], ['zoomout', 'ซูมออก'], ['lift', 'ยกลอย'], ['tilt3d', 'เอียง 3 มิติตามเมาส์'], ['pop', 'เด้งขยาย'], ['glow', 'เรืองแสง'], ['color', 'ขาวดำ→สี'], ['bright', 'สว่างขึ้น'], ['rotate', 'หมุนเล็กน้อย'], ['shine', 'แสงวิ่งผ่าน'], ['blurin', 'เบลอ→ชัด'], ['flip', 'พลิกภาพ']],
  idle: [['none', 'ไม่มี'], ['float', 'ลอยขึ้นลง'], ['pulse', 'เต้นเบาๆ'], ['swing', 'แกว่ง'], ['breathe', 'สว่างเป็นจังหวะ'], ['kenburns', 'ซูมช้าๆ (Ken Burns)'], ['shine', 'แสงวิ่งเป็นระยะ']],
  cap: [['none', 'ไม่แสดง'], ['bottom', 'ด้านล่าง'], ['top', 'ด้านบน'], ['center', 'กลางภาพ'], ['hover', 'แสดงเมื่อชี้เมาส์']],
  capAlign: [['left', 'ซ้าย'], ['center', 'กลาง'], ['right', 'ขวา']],
};
const ENTER_LABEL = { none: 'ไม่มี', fade: 'ค่อยๆ ปรากฏ', 'fade-up': 'ลอยขึ้น', 'fade-down': 'ลอยลง', 'slide-left': 'เลื่อนจากซ้าย', 'slide-right': 'เลื่อนจากขวา', zoom: 'ขยายเข้า', 'zoom-out': 'ย่อเข้า', flip: 'พลิก 3 มิติ', blur: 'เบลอ→ชัด', rotate: 'หมุนเข้า' };
function enterControls(it) {
  const e = it.enter || { type: 'none', delay: 0, dur: 700 };
  return `<div class="grid grid-cols-3 gap-2"><div class="col-span-3"><select class="inp !py-1.5" data-en="type">${UB.ENTERS.map(k => `<option value="${k}" ${e.type === k ? 'selected' : ''}>${ENTER_LABEL[k] || k}</option>`).join('')}</select></div>
    <label class="text-xs text-slate-500">หน่วงเวลา (ms)<input type="number" class="inp !py-1.5" data-en="delay" min="0" max="5000" step="100" value="${e.delay || 0}"></label>
    <label class="text-xs text-slate-500">ความยาว (ms)<input type="number" class="inp !py-1.5" data-en="dur" min="100" max="3000" step="100" value="${e.dur || 700}"></label>
    <div class="flex items-end"><button type="button" class="btn btn-light btn-sm w-full" data-enplay>▶ ดูตัวอย่าง</button></div></div>
    <p class="text-xs text-slate-500 mt-1">เล่นครั้งเดียวเมื่อเลื่อนหน้าเว็บมาถึงชิ้นนี้ · ตั้งหน่วงเวลาไล่กันหลายชิ้น เช่น 0, 150, 300 ms จะได้แบบทยอยขึ้น</p>`;
}
function bindEnter(box, it, onChange, playEl) {
  $$('[data-en]', box).forEach(el => el.addEventListener('input', () => {
    const e = it.enter || { type: 'none', delay: 0, dur: 700 };
    e[el.dataset.en] = el.dataset.en === 'type' ? el.value : Number(el.value) || 0;
    it.enter = e.type === 'none' ? undefined : e; onChange && onChange();
  }));
  const pb = $('[data-enplay]', box);
  if (pb) pb.onclick = () => {
    const t = playEl(); const e = it.enter; if (!t || !e) return;
    t.setAttribute('data-enter', e.type); t.style.setProperty('--edel', '0ms'); t.style.setProperty('--edur', e.dur + 'ms');
    if (t.parentElement) t.parentElement.classList.add('uw-js'); t.classList.remove('in'); void t.offsetWidth; requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('in')));
  };
}
function bindTilt(root) {
  $$('.uim[data-tilt]', root).forEach(el => {
    el.onpointermove = ev => { const b = el.getBoundingClientRect(), x = (ev.clientX - b.left) / b.width - .5, y = (ev.clientY - b.top) / b.height - .5;
      el.style.transform = `perspective(900px) rotateX(${(-y * 16).toFixed(2)}deg) rotateY(${(x * 16).toFixed(2)}deg) scale(1.03)`; };
    el.onpointerleave = () => { el.style.transform = ''; };
  });
}
function designImage(it0, onDone) {
  const it = clone(it0);
  it.fx = UB.normImg(it.fx || { radius: 16, depth: 'md', hover: 'zoom' });
  const ar = it.pos ? `${it.pos.w}/${it.pos.h}` : '4/3';
  openModal({
    title: 'ปรับแต่งภาพ', size: 'max-w-6xl',
    body: `<div class="grid lg:grid-cols-[1fr_380px] gap-5">
      <div class="lg:order-2"><div class="lg:sticky lg:top-0 space-y-2">
        <div class="rounded-xl chk-pattern border border-slate-200 p-8 grid place-items-center" style="min-height:300px"><div data-pv style="width:100%;max-width:340px;aspect-ratio:${ar}"></div></div>
        <p class="text-xs text-slate-500 text-center">ชี้เมาส์ที่ภาพเพื่อดูเอฟเฟกต์ · ขนาดจริงตามกรอบบนผืนผ้าใบ</p></div></div>
      <div class="lg:order-1 space-y-3" data-ctl></div></div>`,
    footer: `<button class="btn btn-light mr-auto" data-reset>ล้างการปรับแต่ง</button><button class="btn btn-light" data-close>ยกเลิก</button><button class="btn btn-primary" data-apply>${icon('check')} ใช้แบบนี้</button>`,
    onMount: (el, close) => {
      const pv = $('[data-pv]', el), ctl = $('[data-ctl]', el);
      const paint = () => { pv.innerHTML = UB.imageHtml(it, { noLink: true }); bindTilt(pv); };
      const draw = () => {
        const f = it.fx;
        const seg = (k, list) => `<div class="seg flex-wrap">${list.map(([v, l]) => `<button type="button" data-fseg="${k}" data-v="${v}" class="${String(f[k]) === String(v) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
        const rg = (k, l, min, max, step = 1, unit = '') => `<div><div class="flex justify-between"><label class="lbl !mb-0">${l}</label><span class="text-xs text-slate-500"><span data-fout="${k}">${f[k]}</span>${unit}</span></div><input type="range" class="w-full accent-navy-800" data-f="${k}" min="${min}" max="${max}" step="${step}" value="${f[k]}"></div>`;
        const col = (k, l) => `<label class="flex items-center gap-2 text-sm text-slate-600">${l}<input type="color" class="h-8 w-10 rounded border border-slate-300 cursor-pointer" data-fc="${k}" value="${/^#[0-9a-f]{6}$/i.test(f[k] || '') ? f[k] : '#ffffff'}"></label>`;
        const tg = (k, l) => `<label class="flex items-center justify-between gap-2 text-sm text-slate-700 cursor-pointer">${l}<input type="checkbox" class="tgl" data-ft="${k}" ${f[k] ? 'checked' : ''}></label>`;
        const sec = (t, b) => `<details class="rounded-xl border border-slate-200 bg-white group" open><summary class="px-3 py-2 cursor-pointer text-sm font-semibold text-slate-700 select-none">${t}</summary><div class="px-3 pb-3 space-y-3">${b}</div></details>`;
        ctl.innerHTML = `
          <div><label class="lbl">รูปแบบสำเร็จรูป</label><div class="flex flex-wrap gap-1.5">${UB.IPRESETS.map(p => `<button type="button" class="px-2.5 py-1 rounded-md text-xs border border-slate-300 hover:bg-slate-50" data-ipre="${p.id}">${esc(p.name)}</button>`).join('')}</div></div>
          ${sec('🖼 ภาพ', `<div class="flex items-center gap-2"><img src="${esc(it.src)}" class="w-14 h-14 rounded-lg object-cover border border-slate-200"><button type="button" class="btn btn-light btn-sm" data-chg>${icon('media', 'w-3.5 h-3.5')} เปลี่ยนภาพ</button></div>
            <div><label class="lbl">การจัดภาพในกรอบ</label>${seg('fit', IMG_LABEL.fit)}</div><div><label class="lbl">จุดยึดภาพ</label>${seg('pos', IMG_LABEL.pos)}</div>${tg('flipX', 'กลับภาพซ้าย–ขวา')}`)}
          ${sec('⬛ รูปทรงและกรอบ', `<div>${seg('shape', IMG_LABEL.shape)}</div>${f.shape === 'rect' || f.shape === 'arch' ? rg('radius', 'มุมมน', 0, 120, 1, 'px') : ''}
            <div class="grid grid-cols-2 gap-3">${rg('border', 'เส้นขอบ', 0, 20, 1, 'px')}<div class="flex items-end">${col('borderColor', 'สีเส้นขอบ')}</div></div>${f.border ? `<div>${seg('borderStyle', IMG_LABEL.borderStyle)}</div>` : ''}
            <div class="grid grid-cols-2 gap-3">${rg('frame', 'กรอบรูป (ขอบขาว)', 0, 40, 1, 'px')}<div class="flex items-end">${col('frameBg', 'สีกรอบ')}</div></div>`)}
          ${sec('✨ มิติ นูน และเงา', `<div>${seg('depth', IMG_LABEL.depth)}</div>${['emboss', 'stack', 'neon'].includes(f.depth) ? col('shColor', f.depth === 'neon' ? 'สีแสง' : 'สีชั้นเงา') : ''}
            <div class="grid grid-cols-3 gap-3">${rg('tiltX', 'เอียงหน้า–หลัง', -30, 30, 1, '°')}${rg('tiltY', 'เอียงซ้าย–ขวา', -30, 30, 1, '°')}${rg('rotate', 'หมุน', -45, 45, 1, '°')}</div>`)}
          ${sec('🖱 เมื่อชี้เมาส์', `<div>${seg('hover', IMG_LABEL.hover)}</div>
            <div class="grid grid-cols-2 gap-3"><div><label class="lbl">ความแรง</label>${seg('hoverAmt', [[1, 'น้อย'], [2, 'กลาง'], [3, 'มาก']])}</div>${rg('speed', 'ความเร็ว', 100, 1500, 50, 'ms')}</div>`)}
          ${sec('🔁 เคลื่อนไหวตลอดเวลา', `<div>${seg('idle', IMG_LABEL.idle)}</div>`)}
          ${sec('🎬 แอนิเมชันตอนเลื่อนมาถึง', `<div data-enbox>${enterControls(it)}</div>`)}
          ${sec('🎨 ปรับสีภาพ', `<div class="grid grid-cols-2 gap-3">${rg('gray', 'ขาวดำ', 0, 100, 1, '%')}${rg('bright', 'ความสว่าง', 40, 160, 1, '%')}${rg('sat', 'ความสดของสี', 0, 200, 1, '%')}${rg('contrast', 'คอนทราสต์', 50, 160, 1, '%')}${rg('blur', 'เบลอ', 0, 10, 1, 'px')}${rg('opacity', 'ความทึบ', 10, 100, 1, '%')}</div>
            <div class="grid grid-cols-2 gap-3"><div class="flex items-end">${col('tint', 'แต้มสีทับ')}</div>${rg('tintOp', 'ความเข้มสีทับ', 0, 100, 1, '%')}</div>${tg('grad', 'ไล่เงาดำด้านล่าง (ช่วยให้อ่านคำบรรยายง่าย)')}`)}
          ${sec('💬 คำบรรยายบนภาพ', `<div>${seg('cap', IMG_LABEL.cap)}</div>
            <div class="grid grid-cols-2 gap-3"><input class="inp" data-it="title" placeholder="หัวข้อ" value="${esc(it.title || '')}"><input class="inp" data-it="subtitle" placeholder="คำอธิบาย (ไม่บังคับ)" value="${esc(it.subtitle || '')}"></div>
            ${f.cap !== 'none' ? `<div class="grid grid-cols-2 gap-3">${rg('capSize', 'ขนาดตัวอักษร', 10, 48, 1, 'px')}<div class="flex items-end">${col('capColor', 'สีตัวอักษร')}</div></div><div>${seg('capAlign', IMG_LABEL.capAlign)}</div>` : ''}`)}
          ${sec('🔗 ลิงก์เมื่อคลิก', `<label class="flex items-center justify-between gap-2 text-sm text-slate-700 cursor-pointer"><span><b>คลิกเพื่อเปิดภาพขนาดเต็ม</b> (ลิงก์ไปไฟล์ต้นฉบับ)</span><input type="checkbox" class="tgl" data-full ${it.full ? 'checked' : ''}></label>
            <input class="inp" data-it="link" placeholder="หรือใส่ลิงก์อื่น https://... (มีลิงก์นี้จะใช้แทนภาพเต็ม)" value="${esc(it.link || '')}">
            <a class="text-xs text-navy-700 underline" href="${esc(it.src)}" target="_blank">เปิดดูภาพต้นฉบับ</a><label class="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" class="w-4 h-4 accent-navy-800" data-newtab ${it.newTab !== false ? 'checked' : ''}> เปิดในแท็บใหม่</label>`)}`;
        const set = (k, v) => { it.fx[k] = v; const o = $(`[data-fout="${k}"]`, ctl); if (o) o.textContent = v; paint(); };
        $$('[data-f]', ctl).forEach(i => i.addEventListener('input', () => set(i.dataset.f, Number(i.value))));
        $$('[data-fc]', ctl).forEach(i => i.addEventListener('input', () => set(i.dataset.fc, i.value)));
        $$('[data-ft]', ctl).forEach(i => i.addEventListener('change', () => set(i.dataset.ft, i.checked)));
        $$('[data-fseg]', ctl).forEach(b => b.onclick = () => { const k = b.dataset.fseg; it.fx[k] = typeof UB.IDEF[k] === 'number' ? Number(b.dataset.v) : b.dataset.v; it.fx = UB.normImg(it.fx); paint(); draw(); });
        $$('[data-ipre]', ctl).forEach(b => b.onclick = () => { const p = UB.IPRESETS.find(x => x.id === b.dataset.ipre); it.fx = UB.normImg({ ...UB.IDEF, ...p.s }); paint(); draw(); });
        $$('[data-it]', ctl).forEach(i => i.addEventListener('input', () => { it[i.dataset.it] = i.value; paint(); }));
        const nt = $('[data-newtab]', ctl); if (nt) nt.onchange = () => { it.newTab = nt.checked; };
        const fu = $('[data-full]', ctl); if (fu) fu.onchange = () => { it.full = fu.checked; };
        $('[data-chg]', ctl).onclick = async () => { const u = await pickMedia('image'); if (u) { it.src = u; paint(); draw(); } };
        bindEnter($('[data-enbox]', ctl), it, null, () => pv);
      };
      paint(); draw();
      $('[data-reset]', el).onclick = () => { delete it.fx; onDone(it); close(); };
      $('[data-apply]', el).onclick = () => { onDone(it); close(); };
    },
  });
}
function editEnter(it, onDone) {
  const c = clone(it);
  openModal({ title: 'แอนิเมชันตอนเลื่อนมาถึง', size: 'max-w-lg',
    body: `<div class="rounded-xl chk-pattern border border-slate-200 p-6 grid place-items-center mb-4" style="min-height:140px"><div data-pv class="px-6 py-4 rounded-xl bg-navy-800 text-white font-semibold shadow-lg">${esc(c.title || TYPE_META[c.type].name)}</div></div><div data-enbox>${enterControls(c)}</div>`,
    footer: `<button class="btn btn-light" data-close>ยกเลิก</button><button class="btn btn-primary" data-apply>${icon('check')} ตกลง</button>`,
    onMount: (el, close) => { bindEnter($('[data-enbox]', el), c, null, () => $('[data-pv]', el)); $('[data-apply]', el).onclick = () => { onDone(c.enter); close(); }; } });
}

function mountCanvas(host, w, hooks) {
  let sel = null, zoom = 'fit', showGrid = true, snapOn = true, scale = 1;
  const W = () => Math.max(200, Number(w.canvasW) || 1200), Hh = () => Math.max(60, Number(w.canvasH) || 400), G = () => Math.max(2, Number(w.gridSize) || 20);
  host.innerHTML = `
    <div class="card p-2.5 flex flex-wrap items-center gap-2">
      <button class="btn btn-primary btn-sm" data-add="button">${icon('plus', 'w-3.5 h-3.5')} ปุ่ม</button>
      <button class="btn btn-light btn-sm" data-add="text">${icon('text', 'w-3.5 h-3.5')} ข้อความ</button>
      <button class="btn btn-light btn-sm" data-add="image">${icon('image', 'w-3.5 h-3.5')} ภาพ</button>
      <button class="btn btn-light btn-sm" data-add="video">${icon('video', 'w-3.5 h-3.5')} วีดีโอ</button>
      <button class="btn btn-light btn-sm" data-add="pdf">${icon('file', 'w-3.5 h-3.5')} PDF</button>
      <button class="btn btn-light btn-sm" data-add="table">${icon('table', 'w-3.5 h-3.5')} ตาราง</button>
      <button class="btn btn-light btn-sm" data-add="qr">${icon('qr', 'w-3.5 h-3.5')} QR Code</button>
      <span class="w-px h-6 bg-slate-200 mx-1"></span>
      <label class="flex items-center gap-1.5 text-xs text-slate-600"><input type="checkbox" class="tgl !w-8 !h-[18px] after:!w-3 after:!h-3" data-grid checked> เส้นตาราง</label>
      <label class="flex items-center gap-1.5 text-xs text-slate-600"><input type="checkbox" class="tgl !w-8 !h-[18px] after:!w-3 after:!h-3" data-snap checked> ยึดตามตาราง</label>
      <div class="flex items-center rounded-lg border border-slate-300 overflow-hidden bg-white" title="ซูม: Ctrl/⌘ + ล้อเมาส์ · Ctrl/⌘ + = / − / 0">
        <button class="px-2 py-1 hover:bg-slate-100 text-sm font-bold" data-zm="-" title="ซูมออก">−</button>
        <button class="px-2 py-1 hover:bg-slate-100 text-xs font-mono min-w-[52px] border-x border-slate-200" data-zm="menu" title="เลือกระดับซูม">100%</button>
        <button class="px-2 py-1 hover:bg-slate-100 text-sm font-bold" data-zm="+" title="ซูมเข้า">+</button></div>
      <button class="btn btn-light btn-sm !px-2" data-zm="fit" title="พอดีจอ">⤢ พอดีจอ</button><button class="btn btn-light btn-sm !px-2" data-zm="1" title="ขนาดจริง">1:1</button>
      <div class="relative"><div data-zmenu class="hidden absolute z-30 top-1 left-0 bg-white rounded-lg shadow-lg border border-slate-200 py-1 w-28">${[0.25, 0.5, 0.75, 1, 1.5, 2, 3].map(z => `<button class="block w-full text-left px-3 py-1 text-xs hover:bg-slate-50" data-zset="${z}">${z * 100}%</button>`).join('')}</div></div>
      <span class="ml-auto text-xs text-slate-500 font-mono" data-info></span>
    </div>
    <div class="card px-2.5 mt-2 h-[52px] flex flex-nowrap items-center gap-2 text-xs overflow-x-auto overflow-y-hidden scroll-thin whitespace-nowrap" data-selbar></div>
    <div class="mt-2 rounded-xl bg-slate-300/50 p-4 overflow-auto scroll-thin" style="max-height:calc(100vh - 290px)" data-wrap tabindex="0">
      <div data-scaler class="relative mx-auto"><div data-cv class="absolute top-0 left-0 origin-top-left shadow-xl"></div></div>
    </div>
    <p class="text-xs text-slate-500 mt-2"><b>ลากไฟล์ภาพ/PDF จากเครื่องมาวางได้เลย</b> · ลากเพื่อย้าย · ลากจุดที่มุม/ขอบเพื่อปรับขนาด · ดับเบิลคลิกเพื่อแก้ไข · ลูกศรเลื่อนทีละช่อง (Shift = ทีละ 1px) · Delete ลบ · Ctrl+D ทำสำเนา · L ล็อก · <b>ซูม</b>: Ctrl/⌘ + ล้อเมาส์ หรือปุ่ม − / + · <b>เลื่อนมุมมอง</b>: กด Space ค้างแล้วลาก</p>`;
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
    else if (it.type === 'image' && it.fx && it.src) inner = UB.imageHtml(it, { cw: W(), noLink: true });
    else if (it.type === 'image') inner = it.src ? `<img src="${esc(it.src)}" style="width:100%;height:100%;object-fit:${w.fit};border-radius:${w.radius}px;display:block" draggable="false">` : `<div class="w-full h-full grid place-items-center bg-slate-100 text-slate-400">${icon('image', 'w-8 h-8')}</div>`;
    else if (it.type === 'video' && it.vp && it.vp.on) { const vi = UB.videoInfo(it.src, it.vo && it.vo.frame); inner = UB.videoPanelHtml({ ...it, vp: { ...it.vp, open: true } }, { cw: W(), fill: true, preview: `<div class="uvp-ph" style="background:#0f172a ${vi.thumb ? `url('${esc(vi.thumb)}') center/cover` : ''}"></div>` }).replace('data-uvp', 'data-uvp-off'); }
    else if (it.type === 'video') { const vi = UB.videoInfo(it.src, it.vo && it.vo.frame); inner = `<div class="w-full h-full grid place-items-center bg-slate-900 text-white relative overflow-hidden" style="border-radius:${w.radius}px">${vi.thumb ? `<img src="${esc(vi.thumb)}" class="absolute inset-0 w-full h-full object-cover opacity-70" draggable="false" alt="">` : ''}<div class="relative text-center"><i class="${VKIND_IC[vi.kind] || 'fa-solid fa-circle-play'} !text-white text-4xl"></i><div class="text-[11px] mt-1 opacity-80">${esc(vi.name || 'วีดีโอ')}</div></div></div>`; }
    else if (it.type === 'text') { ensureFont(it.ts && it.ts.font); inner = UB.textHtml(it.ts, { cw: W() }); }
    else if (it.type === 'divider') inner = `<div class="h-full flex flex-col justify-center">${UB.dividerHtml(it.ts, { cw: W() })}</div>`;
    else if (it.type === 'table') { ensureFont(it.tb && it.tb.st && it.tb.st.font); inner = UB.tableHtml(it, { cw: W(), fill: true }); }
    else if (it.type === 'qr') inner = UB.qrHtml(it, { cw: W(), fill: true, noLink: true });
    else if (it.type === 'pdf') inner = `<div class="w-full h-full flex flex-col rounded-lg overflow-hidden border border-slate-300 bg-slate-200"><div class="flex items-center gap-1.5 px-2 py-1 bg-slate-800 text-white text-xs flex-none" style="font-size:calc(var(--hs) * .95)">📄 <span class="truncate">${esc(it.title || 'PDF')}</span></div><div class="flex-1 relative overflow-hidden bg-white" data-pdfthumb="${esc(it.src)}" data-pages><div class="absolute inset-0 grid place-items-center text-slate-400 text-xs">กำลังโหลดตัวอย่าง PDF…</div></div></div>`;
    else if (it.type === 'spacer') inner = `<div class="w-full h-full border border-dashed border-slate-400/70"></div>`;
    else inner = `<div class="w-full h-full overflow-hidden">${it.html}</div>`;
    return `<div class="cv-el${p.locked ? ' locked' : ''}${it.active ? '' : ' off'}" data-id="${it.id}" style="left:${p.x}px;top:${p.y}px;width:${p.w}px;height:${p.h}px;z-index:${p.z || 1}">
      <div class="cv-in">${inner}</div>${p.locked ? `<span class="cv-lock">🔒</span>` : ''}${it.enter ? `<span class="cv-fxb" title="มีแอนิเมชันตอนเลื่อนมาถึง">✨</span>` : ''}</div>`;
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
    fillPdfThumbs(cv);
    $('[data-info]', host).textContent = `${W()} × ${Hh()} px · ตาราง ${g}px`;
    const zb = $('[data-zm="menu"]', host); if (zb) zb.textContent = `${Math.round(scale * 100)}%${zoom === 'fit' ? '*' : ''}`;
    bindTilt(cv);
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
      ${it.type === 'image' ? `<button class="btn btn-sm ${it.fx ? 'btn-gold' : 'btn-light'}" data-act="imgfx">🎨 ปรับแต่งภาพ</button>` : ''}
      ${it.type === 'table' ? `<button class="btn btn-sm btn-gold" data-act="table">${icon('table', 'w-3.5 h-3.5')} แก้ไขตาราง</button>` : ''}
      ${it.type === 'qr' ? `<button class="btn btn-sm btn-gold" data-act="qr">${icon('qr', 'w-3.5 h-3.5')} ออกแบบ QR</button>` : ''}
      <button class="btn btn-sm ${it.enter ? 'btn-gold' : 'btn-light'}" data-act="enter" title="แอนิเมชันตอนเลื่อนมาถึง">✨ แอนิเมชัน</button>
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
    if (a === 'imgfx') return designImage(it, n => { Object.assign(it, n); if (!n.fx) delete it.fx; if (!n.enter) delete it.enter; hooks.change(); });
    if (a === 'table') return editTable(it, n => { Object.assign(it, n); hooks.change(); });
    if (a === 'qr') return designQr(it, n => { Object.assign(it, n); hooks.change(); });
    if (a === 'enter') return editEnter(it, e => { if (e) it.enter = e; else delete it.enter; hooks.change(); });
    hooks.change();
  }
  async function addEl(type) {
    const g = G(), n = w.items.length;
    const base = { id: rid(), title: '', subtitle: '', src: '', link: '', newTab: true, icon: '', iconFa: '', btnStyle: 'primary', html: '', active: true, start: '', end: '' };
    let it;
    if (type === 'image') {
      const url = await pickMedia('image'); if (!url) return;
      it = { ...base, type: 'image', src: url, full: true, title: fileTitle(url), pos: { x: g, y: g, w: snap(320), h: snap(200), z: n + 1, locked: false } };
    } else if (type === 'table') {
      it = { ...base, type: 'table', title: 'ตาราง', tb: newTable(), pos: { x: g, y: g, w: snap(640), h: snap(260), z: n + 1, locked: false } };
      const off = (n % 6) * g; it.pos.x += off; it.pos.y += off; clampPos(it.pos);
      return editTable(it, done => { w.items.push(done); sel = done.id; hooks.change(); });
    } else if (type === 'video') {
      const url = await pickMedia('video'); if (!url) return;
      const vi = UB.videoInfo(url), vert = vi.vertical;
      it = { ...base, type: 'video', title: vi.kind === 'file' ? decodeURIComponent(url.split('/').pop()).replace(/\.[^.]+$/, '') : (vi.name || 'วีดีโอ'), src: /^<iframe/i.test(url) ? UB.iframeSrc(url) : url, vo: UB.normVideo({ frame: /^<iframe/i.test(url) }), pos: { x: g, y: g, w: snap(vert ? 270 : 480), h: snap(vert ? 480 : 270), z: n + 1, locked: false } };
      const off = (n % 6) * g; it.pos.x += off; it.pos.y += off; clampPos(it.pos);
    } else if (type === 'qr') {
      it = { ...base, type: 'qr', title: 'QR Code', qr: newQr(), pos: { x: g, y: g, w: snap(220), h: snap(220), z: n + 1, locked: false } };
      const off = (n % 6) * g; it.pos.x += off; it.pos.y += off; clampPos(it.pos);
      return designQr(it, done => { const q = done.qr, extra = (q.frame === 'top' || q.frame === 'bottom' ? 46 : 0) + (q.cap ? q.capSize * 1.6 + 8 : 0); done.pos.h = snap(done.pos.w + extra); clampPos(done.pos); w.items.push(done); sel = done.id; hooks.change(); });
    } else if (type === 'pdf') {
      const url = await pickMedia('pdf'); if (!url) return;
      it = { ...itemFromUpload({ url }), pos: { x: g, y: g, w: snap(480), h: snap(620), z: n + 1, locked: false } };
    } else if (type === 'text') {
      it = { ...base, type: 'text', link: '', ts: UB.normText({ ...UB.TPRESETS.find(p => p.id === 'h2').s, content: 'หัวข้อ / ข้อความ' }), pos: { x: g, y: g, w: snap(400), h: snap(80), z: n + 1, locked: false } };
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
  cv.addEventListener('dblclick', () => { const it = lastDown && byId(lastDown); if (!it) return; it.type === 'button' ? hooks.design(it) : it.type === 'image' ? act('imgfx') : it.type === 'table' ? act('table') : it.type === 'qr' ? act('qr') : hooks.edit(it); });
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
  const ZSTEPS = [0.1, 0.15, 0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1, 1.25, 1.5, 2, 2.5, 3, 4];
  // ซูมโดยคงจุดใต้เมาส์/กึ่งกลางไว้ที่เดิม
  function setZoom(z, cx, cy) {
    const r = wrap.getBoundingClientRect(), px = cx == null ? r.width / 2 : cx - r.left, py = cy == null ? r.height / 2 : cy - r.top;
    const old = scale, ux = (wrap.scrollLeft + px - scaler.offsetLeft) / old, uy = (wrap.scrollTop + py - scaler.offsetTop) / old;
    zoom = z === 'fit' ? 'fit' : String(Math.min(4, Math.max(0.1, +z)));
    redraw();
    if (zoom !== 'fit') { wrap.scrollLeft = ux * scale + scaler.offsetLeft - px; wrap.scrollTop = uy * scale + scaler.offsetTop - py; }
  }
  const stepZoom = (dir, cx, cy) => { const c = scale; const n = dir > 0 ? ZSTEPS.find(z => z > c + 0.001) || 4 : [...ZSTEPS].reverse().find(z => z < c - 0.001) || 0.1; setZoom(n, cx, cy); };
  $$('[data-zm]', host).forEach(b => b.onclick = e => {
    const v = b.dataset.zm;
    if (v === '+') stepZoom(1); else if (v === '-') stepZoom(-1); else if (v === 'menu') { e.stopPropagation(); $('[data-zmenu]', host).classList.toggle('hidden'); } else setZoom(v);
  });
  $$('[data-zset]', host).forEach(b => b.onclick = () => { $('[data-zmenu]', host).classList.add('hidden'); setZoom(b.dataset.zset); });
  document.addEventListener('click', () => { const m = $('[data-zmenu]', host); if (m) m.classList.add('hidden'); });
  wrap.addEventListener('wheel', e => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    const f = Math.exp(-e.deltaY * (e.deltaMode ? 0.05 : 0.002));
    setZoom(Math.min(4, Math.max(0.1, scale * f)), e.clientX, e.clientY);
  }, { passive: false });
  wrap.addEventListener('keydown', e => {
    if (!(e.ctrlKey || e.metaKey) || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    if (e.key === '=' || e.key === '+') { e.preventDefault(); stepZoom(1); } else if (e.key === '-') { e.preventDefault(); stepZoom(-1); } else if (e.key === '0') { e.preventDefault(); setZoom('fit'); }
  });
  // กด Space ค้างแล้วลาก = เลื่อนมุมมอง
  let panKey = false, pan = null;
  wrap.addEventListener('keydown', e => { if (e.code === 'Space' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); panKey = true; wrap.style.cursor = 'grab'; } });
  wrap.addEventListener('keyup', e => { if (e.code === 'Space') { panKey = false; wrap.style.cursor = ''; } });
  wrap.addEventListener('pointerdown', e => { if (!panKey && e.button !== 1) return; e.preventDefault(); e.stopPropagation(); pan = { x: e.clientX, y: e.clientY, l: wrap.scrollLeft, t: wrap.scrollTop }; wrap.setPointerCapture(e.pointerId); wrap.style.cursor = 'grabbing'; }, true);
  wrap.addEventListener('pointermove', e => { if (!pan) return; wrap.scrollLeft = pan.l - (e.clientX - pan.x); wrap.scrollTop = pan.t - (e.clientY - pan.y); });
  wrap.addEventListener('pointerup', () => { if (pan) { pan = null; wrap.style.cursor = panKey ? 'grab' : ''; } });
  const ro = new ResizeObserver(() => { if (zoom === 'fit' && document.body.contains(host)) { const s = computeScale(); if (Math.abs(s - scale) > 0.01) redraw(); } });
  ro.observe(wrap);
  // ลากไฟล์ (ภาพ / PDF / วีดีโอ) จากเครื่องมาวางบนผืนผ้าใบ = อัปโหลด + วาง ณ จุดที่ปล่อย
  wrap.addEventListener('dragover', e => { if ([...(e.dataTransfer.types || [])].includes('Files')) { e.preventDefault(); wrap.classList.add('ring-4', 'ring-navy-400'); } });
  wrap.addEventListener('dragleave', e => { if (!wrap.contains(e.relatedTarget)) wrap.classList.remove('ring-4', 'ring-navy-400'); });
  wrap.addEventListener('drop', async e => {
    const files = [...(e.dataTransfer.files || [])]; wrap.classList.remove('ring-4', 'ring-navy-400');
    if (!files.length) return; e.preventDefault();
    const r = cv.getBoundingClientRect(); let x = (e.clientX - r.left) / scale, y = (e.clientY - r.top) / scale;
    const ups = await uploadMany(files); let skipped = 0;
    for (const u of ups) {
      const it = itemFromUpload(u); if (!it) { skipped++; continue; }
      const sz = it.type === 'pdf' ? [480, 620] : it.type === 'video' ? [480, 270] : [320, 220];
      it.pos = { x: snap(x), y: snap(y), w: snap(sz[0]), h: snap(sz[1]), z: w.items.length + 1, locked: false };
      clampPos(it.pos); w.items.push(it); sel = it.id; x += G() * 2; y += G() * 2;
    }
    if (skipped) Toast.fire({ icon: 'info', title: `ข้าม ${skipped} ไฟล์ที่ไม่ใช่ภาพ/PDF/วีดีโอ (ยังอยู่ในคลังสื่อ)` });
    if (ups.length - skipped) hooks.change();
  });
  redraw();
  return { redraw, select: id => { sel = id; redraw(); } };
}
const CANVAS_CSS = `
.cv-fxb{position:absolute;top:2px;right:2px;font-size:calc(var(--hs) * 1.2);line-height:1;pointer-events:none;filter:drop-shadow(0 1px 1px rgba(0,0,0,.4))}
.cv-in>.ux{height:100%;display:flex;flex-direction:column;justify-content:var(--tva)}.cv-in>.ux.fit{display:flex;max-width:none}.cv-in>.ux-hr{height:100%}
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
  pdf: { name: 'PDF', ic: 'file', cls: 'bg-rose-50 text-rose-700' },
  table: { name: 'ตาราง', ic: 'table', cls: 'bg-cyan-50 text-cyan-700' },
  qr: { name: 'QR Code', ic: 'qr', cls: 'bg-indigo-50 text-indigo-700' },
  text: { name: 'ข้อความ', ic: 'text', cls: 'bg-amber-50 text-amber-700' },
  divider: { name: 'เส้นคั่น', ic: 'minus', cls: 'bg-slate-100 text-slate-600' },
  spacer: { name: 'ช่องว่าง', ic: 'menu', cls: 'bg-slate-100 text-slate-500' },
  html: { name: 'HTML', ic: 'html', cls: 'bg-violet-50 text-violet-700' },
};
const TEXTY = ['text', 'divider', 'spacer'];
const textTitle = it => it.type === 'text' ? String((it.ts && it.ts.content) || '').replace(/[*_\[\]]|\(https?:[^)]*\)/g, '').split('\n')[0].trim().slice(0, 60) : TYPE_META[it.type].name;

/* ---------------- ตัวออกแบบข้อความ / เส้นคั่น / ช่องว่าง ---------------- */
function textPreviewHtml(it) {
  const ts = it.ts;
  if (it.type === 'divider') return UB.dividerHtml(ts);
  if (it.type === 'spacer') return `<div class="relative border border-dashed border-slate-400 bg-slate-100/70 grid place-items-center text-xs text-slate-500" style="height:${ts.h}px">ช่องว่าง ${ts.h}px${ts.hM ? ` (มือถือ ${ts.hM}px)` : ''}</div>`;
  ensureFont(ts.font);
  return UB.textHtml(ts);
}
/** วาดตัวควบคุมลงใน box · onChange เรียกเมื่อค่าเปลี่ยน (อัปเดตตัวอย่าง) */
function mountTextDesigner(box, it, onChange) {
  const W8 = [[300, 'บาง'], [400, 'ปกติ'], [500, 'กลาง'], [600, 'กึ่งหนา'], [700, 'หนา'], [800, 'หนามาก'], [900, 'ดำ']];
  const draw = () => {
    const t = it.ts = UB.normText(it.ts);
    const seg = (k, list) => `<div class="seg flex-wrap">${list.map(([v, l]) => `<button type="button" data-tseg="${k}" data-v="${v}" class="${String(t[k]) === String(v) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
    const nm = (k, l, min, max, step = 1, unit = 'px') => `<div><label class="lbl">${l}</label><div class="flex items-center gap-1.5"><input type="number" class="inp !py-1.5" data-ts="${k}" min="${min}" max="${max}" step="${step}" value="${t[k]}"><span class="text-xs text-slate-500 w-6">${unit}</span></div></div>`;
    const rg = (k, l, min, max, step = 1, unit = 'px') => `<div><div class="flex justify-between"><label class="lbl">${l}</label><span class="text-xs text-slate-500"><span data-tout="${k}">${t[k]}</span>${unit}</span></div><input type="range" class="w-full accent-navy-800" data-ts="${k}" min="${min}" max="${max}" step="${step}" value="${t[k]}"></div>`;
    const col = (k, l, empty) => `<div><label class="lbl">${l}</label><div class="flex gap-1.5 items-center"><input type="color" class="h-9 w-11 rounded border border-slate-300 cursor-pointer flex-none" data-tsc="${k}" value="${/^#[0-9a-f]{6}$/i.test(t[k] || '') ? t[k] : '#ffffff'}">${empty ? `<button type="button" class="btn btn-light btn-sm flex-1 ${!t[k] ? '!border-navy-700 !text-navy-800' : ''}" data-tclr="${k}">${empty}</button>` : `<input class="inp !py-1.5 font-mono text-xs" data-tsx="${k}" value="${esc(t[k])}">`}</div></div>`;
    const tgl = (k, l) => `<label class="flex items-center justify-between gap-2 py-1 cursor-pointer text-sm text-slate-700">${l}<input type="checkbox" class="tgl" data-ts="${k}" ${t[k] ? 'checked' : ''}></label>`;
    const sec = (title, body) => `<div class="p-3 rounded-xl border border-slate-200 space-y-3"><div class="text-xs font-bold uppercase tracking-wider text-slate-400">${title}</div>${body}</div>`;
    let html;
    if (it.type === 'divider') html = sec('เส้นคั่น', `<div><label class="lbl">ลายเส้น</label>${seg('lineStyle', [['solid', 'เส้นทึบ'], ['dashed', 'เส้นประ'], ['dotted', 'จุด'], ['double', 'เส้นคู่']])}</div>
        <div class="grid grid-cols-2 gap-3">${rg('thick', 'ความหนา', 1, 12)}${col('color', 'สีเส้น')}</div>
        ${rg('widthPct', 'ความยาวเส้น', 5, 100, 1, '%')}<div><label class="lbl">ตำแหน่ง</label>${seg('align', [['left', 'ชิดซ้าย'], ['center', 'กึ่งกลาง'], ['right', 'ชิดขวา']])}</div>
        <div class="grid grid-cols-2 gap-3">${nm('mTop', 'ระยะห่างด้านบน', 0, 200)}${nm('mBot', 'ระยะห่างด้านล่าง', 0, 200)}</div>`);
    else if (it.type === 'spacer') html = sec('ช่องว่าง', `<div class="grid grid-cols-2 gap-3">${nm('h', 'ความสูง (จอใหญ่)', 0, 1000)}${nm('hM', 'บนมือถือ (0 = เท่ากัน)', 0, 1000)}</div>${rg('h', 'ปรับละเอียด', 0, 300)}<p class="text-xs text-slate-500">ใช้เว้นระยะระหว่างรายการ เช่น ระหว่างหัวข้อกับกลุ่มปุ่ม</p>`);
    else html = `
      <div><label class="lbl">รูปแบบสำเร็จรูป</label><div class="flex flex-wrap gap-1.5">${UB.TPRESETS.map(p => `<button type="button" class="px-2.5 py-1 rounded-md text-xs border border-slate-300 hover:bg-slate-50" data-tpre="${p.id}">${esc(p.name)}</button>`).join('')}</div></div>
      <div><div class="flex items-center justify-between mb-1"><label class="lbl !mb-0">ข้อความ</label>
        <div class="flex gap-1"><button type="button" class="btn btn-light btn-sm !px-2 font-bold" data-wrap="**" title="ตัวหนา">B</button><button type="button" class="btn btn-light btn-sm !px-2 italic" data-wrap="*" title="ตัวเอียง">I</button><button type="button" class="btn btn-light btn-sm !px-2 underline" data-wrap="__" title="ขีดเส้นใต้">U</button><button type="button" class="btn btn-light btn-sm !px-2" data-tlink title="ใส่ลิงก์ในข้อความ">${icon('link', 'w-3.5 h-3.5')}</button></div></div>
        <textarea class="inp" rows="4" data-ts="content">${esc(t.content)}</textarea>
        <p class="text-xs text-slate-500 mt-1">กด Enter เพื่อขึ้นบรรทัดใหม่ · เลือกคำแล้วกด B / I / U เพื่อทำตัวหนา เอียง ขีดเส้นใต้ · ลิงก์ https:// คลิกได้อัตโนมัติ</p></div>
      ${sec('ตัวอักษร', `<div class="grid grid-cols-2 gap-3"><div><label class="lbl">ฟอนต์</label><select class="inp !py-1.5" data-ts="font">${UB.FONTS.map(([v, l]) => `<option value="${v}" ${t.font === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
          <div><label class="lbl">ความหนา</label><select class="inp !py-1.5" data-ts="weight">${W8.map(([v, l]) => `<option value="${v}" ${t.weight == v ? 'selected' : ''}>${l} (${v})</option>`).join('')}</select></div></div>
        <div class="grid grid-cols-3 gap-3">${nm('size', 'ขนาด', 8, 160)}${nm('sizeM', 'บนมือถือ (0=อัตโนมัติ)', 0, 160)}${col('color', 'สีตัวอักษร')}</div>
        ${rg('size', 'ปรับขนาดละเอียด', 10, 96)}
        <div class="grid grid-cols-2 gap-3">${rg('lineH', 'ระยะห่างบรรทัด', 1, 3, 0.05, '')}${rg('letter', 'ระยะห่างตัวอักษร', -2, 10, 0.5)}</div>
        <div class="grid grid-cols-2 gap-x-4">${tgl('italic', 'ตัวเอียงทั้งหมด')}${tgl('underline', 'ขีดเส้นใต้ทั้งหมด')}${tgl('upper', 'ตัวพิมพ์ใหญ่ (A–Z)')}${tgl('tShadow', 'เงาตัวอักษร (บนภาพ)')}</div>`)}
      ${sec('การจัดวาง', `<div><label class="lbl">จัดแนวนอน</label>${seg('align', [['left', 'ชิดซ้าย'], ['center', 'กึ่งกลาง'], ['right', 'ชิดขวา'], ['justify', 'เต็มบรรทัด']])}</div>
        <div><label class="lbl">จัดแนวตั้ง (ใช้ในผืนผ้าใบอิสระ)</label>${seg('vAlign', [['top', 'บน'], ['middle', 'กลาง'], ['bottom', 'ล่าง']])}</div>
        <div><label class="lbl">ความกว้างกล่อง</label>${seg('full', [['true', 'เต็มแถว'], ['false', 'พอดีข้อความ']])}</div>
        <div class="grid grid-cols-2 gap-3">${nm('maxW', 'กว้างสูงสุด (0 = ไม่จำกัด)', 0, 3000)}<div><label class="lbl">ประเภทข้อความ (SEO)</label><select class="inp !py-1.5" data-ts="tag">${[['p', 'ย่อหน้า'], ['h2', 'หัวข้อ H2'], ['h3', 'หัวข้อ H3'], ['h4', 'หัวข้อ H4'], ['div', 'ทั่วไป']].map(([v, l]) => `<option value="${v}" ${t.tag === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div>`)}
      ${sec('กล่องและพื้นหลัง', `<div class="grid grid-cols-2 gap-3">${col('bg', 'พื้นหลัง', 'โปร่งใส')}<div><label class="lbl">เงากล่อง</label>${seg('shadow', [['none', 'ไม่มี'], ['soft', 'อ่อน'], ['strong', 'เข้ม']])}</div></div>
        <div class="grid grid-cols-2 gap-3">${rg('pad', 'ระยะขอบใน', 0, 60)}${rg('radius', 'มุมมน', 0, 40)}</div>
        <div class="grid grid-cols-3 gap-3">${nm('border', 'เส้นขอบ', 0, 20)}${col('borderColor', 'สีเส้นขอบ')}<div><label class="lbl">ด้าน</label><select class="inp !py-1.5" data-ts="borderSide">${[['all', 'รอบกล่อง'], ['left', 'ซ้าย'], ['bottom', 'ล่าง'], ['top', 'บน']].map(([v, l]) => `<option value="${v}" ${t.borderSide === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div>`)}
      ${sec('ไอคอนหน้าข้อความ', `<div class="flex items-center gap-2">${t.iconFa ? `<span class="w-9 h-9 grid place-items-center rounded-lg border border-slate-200 text-lg" style="color:${t.iconColor || t.color}"><i class="${esc(t.iconFa)}"></i></span>` : '<span class="text-xs text-slate-400">ไม่มี</span>'}
        <button type="button" class="btn btn-light btn-sm" data-ticon>${t.iconFa ? 'เปลี่ยนไอคอน' : 'เลือกไอคอน'}</button>${t.iconFa ? `<button type="button" class="btn btn-light btn-sm" data-tnoicon>${icon('x', 'w-3.5 h-3.5')}</button>` : ''}
        ${t.iconFa ? `<input type="color" class="h-9 w-11 rounded border border-slate-300 cursor-pointer ml-auto" data-tsc="iconColor" value="${/^#[0-9a-f]{6}$/i.test(t.iconColor || '') ? t.iconColor : t.color}" title="สีไอคอน">` : ''}</div>`)}`;
    box.innerHTML = `<div class="space-y-3">${html}</div>`;
    const set = (k, v) => { it.ts[k] = v; const o = $(`[data-tout="${k}"]`, box); if (o) o.textContent = v; $$(`[data-ts="${k}"]`, box).forEach(x => { if (x !== document.activeElement && x.type !== 'checkbox') x.value = v; }); onChange(); };
    $$('[data-ts]', box).forEach(el => el.addEventListener('input', () => {
      const k = el.dataset.ts, d = UB.TDEF[k];
      set(k, el.type === 'checkbox' ? el.checked : typeof d === 'number' ? Number(el.value) : el.value);
    }));
    $$('[data-tsc]', box).forEach(el => el.addEventListener('input', () => { set(el.dataset.tsc, el.value); const m = $(`[data-tsx="${el.dataset.tsc}"]`, box); if (m) m.value = el.value; }));
    $$('[data-tsx]', box).forEach(el => el.addEventListener('input', () => { if (/^#[0-9a-f]{3,8}$/i.test(el.value)) set(el.dataset.tsx, el.value); }));
    $$('[data-tclr]', box).forEach(b => b.onclick = () => { it.ts[b.dataset.tclr] = ''; onChange(); draw(); });
    $$('[data-tsc="bg"]', box).forEach(el => el.addEventListener('change', draw));
    $$('[data-tseg]', box).forEach(b => b.onclick = () => { const k = b.dataset.tseg, d = UB.TDEF[k]; it.ts[k] = typeof d === 'boolean' ? b.dataset.v === 'true' : typeof d === 'number' ? Number(b.dataset.v) : b.dataset.v; onChange(); draw(); });
    $$('[data-tpre]', box).forEach(b => b.onclick = () => { const p = UB.TPRESETS.find(x => x.id === b.dataset.tpre); it.ts = UB.normText({ ...UB.TDEF, content: it.ts.content, font: it.ts.font, iconFa: p.s.iconFa || '', ...p.s }); onChange(); draw(); });
    const ta = $('textarea[data-ts="content"]', box);
    $$('[data-wrap]', box).forEach(b => b.onclick = () => {
      const m = b.dataset.wrap, a = ta.selectionStart, z = ta.selectionEnd, v = ta.value, sel = v.slice(a, z) || 'ข้อความ';
      ta.value = v.slice(0, a) + m + sel + m + v.slice(z); ta.focus(); ta.setSelectionRange(a + m.length, a + m.length + sel.length); set('content', ta.value);
    });
    const tl = $('[data-tlink]', box); if (tl) tl.onclick = async () => {
      const a = ta.selectionStart, z = ta.selectionEnd, v = ta.value, sel = v.slice(a, z) || 'คลิกที่นี่';
      const r = await Swal.fire({ title: 'ใส่ลิงก์', input: 'url', inputValue: 'https://', inputLabel: `ข้อความ: ${sel}`, showCancelButton: true, confirmButtonText: 'ใส่ลิงก์', cancelButtonText: 'ยกเลิก', reverseButtons: true });
      if (!r.isConfirmed || !r.value) return;
      ta.value = v.slice(0, a) + `[${sel}](${r.value})` + v.slice(z); set('content', ta.value);
    };
    const ti = $('[data-ticon]', box); if (ti) ti.onclick = async () => { const c = await pickIcon(it.ts.iconFa); if (c) { it.ts.iconFa = c; onChange(); draw(); } };
    const tn = $('[data-tnoicon]', box); if (tn) tn.onclick = () => { it.ts.iconFa = ''; onChange(); draw(); };
  };
  draw();
}
function itemStatus(i) {
  const n = new Date();
  if (!i.active) return ['ปิด', 'bg-slate-100 text-slate-500'];
  if (i.start && new Date(i.start) > n) return ['รอแสดง', 'bg-amber-50 text-amber-700'];
  if (i.end && new Date(i.end + (i.end.length <= 10 ? 'T23:59:59' : '')) < n) return ['หมดอายุ', 'bg-slate-100 text-slate-500'];
  return ['แสดง', 'bg-emerald-50 text-emerald-700'];
}

async function viewWidgetEditor(id) {
  const orig = await api('GET', `/widgets/${id}`);
  if (orig.layout === 'code') return viewCodeWidget(orig);
  const w = clone(orig);
  // ค่าเริ่มต้นของตัวเลือกสไลด์ (ส่วนแสดงผลที่สร้างก่อนมีตัวเลือกเหล่านี้)
  const dflt = { ratioW: 16, ratioH: 9, carWMode: 'auto', carW: 1200, carWPct: 100, carAlign: 'center', carHMode: w.ratio === 'auto' ? 'auto' : 'ratio', carH: 400, carHM: 0, imgPos: 'center', transEffect: 'slide', transMs: 600, transEase: 'smooth', pauseHover: true, carBg: '',
    boxWMode: 'auto', boxW: 1000, boxWPct: 100, boxAlign: 'center', boxHMode: 'auto', boxH: 300, boxHM: 0, boxVAlign: 'top' };
  for (const k in dflt) if (w[k] === undefined) w[k] = dflt[k];
  let tab = 'items', device = 'desktop', previewFull = false, designer = null, rightMode = 'design';
  const markDirty = () => {
    state.dirty = true; $('#saveBtn').classList.add('ring-4', 'ring-gold-400/40'); $('#dirtyDot').classList.remove('hidden'); refresh();
    if (designer && w.layout === 'canvas' && rightMode === 'design') designer.redraw();
  };

  $('#view').innerHTML = `
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
    <div class="flex items-center gap-3 min-w-0">
      <a href="#/widgets" class="p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200">${icon('back', 'w-5 h-5')}</a>
      <div class="min-w-0"><div class="text-xs text-slate-500">ส่วนแสดงผล</div><div class="flex items-center gap-1.5 min-w-0"><h1 class="text-xl font-bold text-slate-900 truncate" id="wTitle">${esc(w.name)}</h1><button class="p-1.5 rounded-lg text-slate-400 hover:text-navy-800 hover:bg-slate-100 flex-none" id="renameW" title="เปลี่ยนชื่อส่วนแสดงผล">${icon('edit', 'w-4 h-4')}</button></div></div>
      <span id="dirtyDot" class="hidden text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">ยังไม่บันทึก</span>
    </div>
    <div class="flex flex-wrap gap-2">
      <button class="btn btn-light" id="embedBtn">${icon('code')} โค้ดฝัง (iframe)</button>
      <button class="btn btn-light" id="exportBtn">${icon('html')} ส่งออก HTML + CSS</button>
      <button class="btn btn-light" id="toCodeBtn" title="สร้างสำเนาเป็นโค้ด HTML เพื่อแก้โครงสร้างด้วยแท็กได้อิสระ">${icon('code')} แปลงเป็นโค้ด HTML</button>
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
    $('#pvWrap').classList.toggle('bg-white', w.bg !== 'transparent');
    try { pv.srcdoc = await api('POST', '/widgets/preview', { ...w, __full: previewFull }); } catch (e) { /* ignore */ }
  }, 250);
  const setDevice = d => {
    device = d;
    $('#pvWrap').style.width = { desktop: '100%', tablet: '768px', phone: '390px' }[d];
    $$('#devSeg button').forEach(b => b.classList.toggle('on', b.dataset.dev === d));
    setTimeout(() => { measureBox(); if (w.layout === 'carousel') measureCar(); }, 450);
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
  $('#toCodeBtn').onclick = async () => {
    if (state.dirty && (await confirmBox('ยังไม่ได้บันทึก', 'บันทึกก่อนแปลงหรือไม่?', 'บันทึก', false))) await $('#saveBtn').onclick();
    if (!(await confirmBox('แปลงเป็นโค้ด HTML?', 'ระบบจะสร้าง “สำเนาใหม่” เป็นส่วนแสดงผลแบบเขียนโค้ด — ส่วนแสดงผลเดิมไม่เปลี่ยนแปลง', 'สร้างสำเนาเป็นโค้ด', false))) return;
    try { const c = await api('POST', `/widgets/${w.id}/to-code`); state.dirty = false; ok('สร้างสำเนาแบบโค้ด HTML แล้ว'); location.hash = `#/widgets/${c.id}`; } catch (e) { fail(e.message); }
  };
  $('#exportBtn').onclick = async () => {
    if (state.dirty) { if (!(await confirmBox('ยังไม่ได้บันทึก', 'โค้ดจะสร้างจากข้อมูลที่บันทึกล่าสุด ต้องการบันทึกก่อนหรือไม่?', 'บันทึกแล้วส่งออก', false))) return; await $('#saveBtn').onclick(); }
    showExport(w);
  };
  $('#renameW').onclick = async () => {
    const r = await Swal.fire({ title: 'เปลี่ยนชื่อส่วนแสดงผล', input: 'text', inputValue: w.name, showCancelButton: true, confirmButtonText: 'ตกลง', cancelButtonText: 'ยกเลิก', reverseButtons: true,
      inputValidator: v => !String(v || '').trim() && 'กรุณากรอกชื่อ' });
    if (!r.isConfirmed) return;
    w.name = String(r.value).trim(); $('#wTitle').textContent = w.name; markDirty();
    if (tab === 'info') drawPanel();
    Toast.fire({ icon: 'info', title: 'อย่าลืมกดบันทึก' });
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
    const rng = (k, t, min, max, unit = '', step = 1) => `<div><div class="flex justify-between"><label class="lbl">${t}</label><span class="text-xs text-slate-500"><span data-out="${k}">${w[k]}</span>${unit}</span></div><input type="range" class="w-full accent-navy-800" min="${min}" max="${max}" step="${step}" data-k="${k}" value="${w[k]}"></div>`;
    const ratios = [['auto', 'ตามภาพจริง'], ['16/9', '16:9'], ['16/6', '16:6 แบนเนอร์'], ['21/9', '21:9'], ['4/3', '4:3'], ['3/2', '3:2'], ['1/1', '1:1'], ['3/4', '3:4 แนวตั้ง'], ['2/3', '2:3 โปสเตอร์'], ['custom', 'กำหนดเอง (กว้าง:สูง)']];
    const ratioSel = (redraw = true) => `<select class="inp" data-k="ratio" ${redraw ? 'data-redraw' : ''}>${ratios.map(([v, t]) => `<option value="${v}" ${w.ratio === v ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
    const ratioCustom = () => w.ratio === 'custom' ? `<div class="flex items-center gap-2 mt-2"><input type="number" class="inp" min="1" data-k="ratioW" value="${w.ratioW || 16}" title="กว้าง"><span class="text-slate-400">:</span><input type="number" class="inp" min="1" data-k="ratioH" value="${w.ratioH || 9}" title="สูง"></div>` : '';
    const num = (k, t, min, max, unit) => `<div><label class="lbl">${t}</label><div class="flex items-center gap-2"><input type="number" class="inp" data-k="${k}" min="${min}" max="${max}" value="${w[k]}"><span class="text-xs text-slate-500 w-6">${unit}</span></div></div>`;
    const isCar = w.layout === 'carousel';
    const isC = w.layout === 'canvas', isT = w.layout === 'tabs', isG = w.layout === 'grid' || w.layout === 'carousel';
    for (const [k, v] of Object.entries({ cbMode: 'none', cbScope: 'link', cbW: 3, cbStyle: 'solid', cbColor: '#1e3a5f', cbHColor: '#d4a72c', cbAnim: 'glow', cbOff: 0 })) if (w[k] == null) w[k] = v;
    const wseg = (k, list) => `<div class="seg flex-wrap">${list.map(([v, t]) => `<button data-wseg="${k}" data-v="${v}" class="${String(w[k]) === String(v) ? 'on' : ''}">${t}</button>`).join('')}</div>`;
    const wseg3 = (k, list) => wseg(k, list).replace('class="seg flex-wrap"', 'class="seg !grid grid-cols-3 gap-1"');
    const wcol = (k, t) => `<div><label class="lbl">${t}</label><div class="flex gap-2"><input type="color" class="h-9 w-11 rounded border border-slate-300 cursor-pointer" data-k="${k}" value="${/^#[0-9a-f]{6}$/i.test(w[k] || '') ? w[k] : '#1e293b'}"></div></div>`;
    P.innerHTML = `
      ${sec('รูปแบบ', `<div class="grid grid-cols-2 gap-2">
        ${lay('carousel', 'สไลด์', 'เลื่อนภาพอัตโนมัติ', '<svg viewBox="0 0 60 36" class="w-full h-full"><rect x="8" y="4" width="44" height="24" rx="3" fill="currentColor" opacity=".85"/><rect x="1" y="9" width="5" height="14" rx="1.5" fill="currentColor" opacity=".25"/><rect x="54" y="9" width="5" height="14" rx="1.5" fill="currentColor" opacity=".25"/><circle cx="25" cy="32" r="1.6" fill="currentColor"/><circle cx="30" cy="32" r="1.6" fill="currentColor" opacity=".3"/><circle cx="35" cy="32" r="1.6" fill="currentColor" opacity=".3"/></svg>')}
        ${lay('grid', 'กริด', 'เรียงเป็นตาราง', '<svg viewBox="0 0 60 36" class="w-full h-full">' + [0, 1, 2].map(c => [0, 1].map(r => `<rect x="${4 + c * 18}" y="${3 + r * 16}" width="16" height="14" rx="2" fill="currentColor" opacity="${.85 - r * .35}"/>`).join('')).join('') + '</svg>')}
        ${lay('list', 'รายการลิงก์', 'แถวพร้อมไอคอน', '<svg viewBox="0 0 60 36" class="w-full h-full">' + [0, 1, 2].map(r => `<rect x="4" y="${3 + r * 11}" width="8" height="8" rx="2" fill="currentColor" opacity=".85"/><rect x="15" y="${5 + r * 11}" width="${38 - r * 6}" height="4" rx="2" fill="currentColor" opacity=".35"/>`).join('') + '</svg>')}
        ${lay('canvas', 'ผืนผ้าใบอิสระ', 'ลากวางปุ่มบนเส้นตาราง', '<svg viewBox="0 0 60 36" class="w-full h-full"><g stroke="currentColor" stroke-width=".4" opacity=".3">' + [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => `<line x1="${i * 5}" y1="0" x2="${i * 5}" y2="36"/>`).join('') + [1, 2, 3, 4, 5, 6].map(i => `<line x1="0" y1="${i * 5}" x2="60" y2="${i * 5}"/>`).join('') + '</g><rect x="5" y="5" width="20" height="10" rx="2" fill="currentColor" opacity=".85"/><rect x="30" y="5" width="25" height="20" rx="2" fill="currentColor" opacity=".55"/><rect x="5" y="20" width="20" height="10" rx="5" fill="currentColor" opacity=".85"/></svg>')}
        ${lay('tabs', 'แท็บ', 'รวมหลายส่วน จัดซ้าย–ขวา', '<svg viewBox="0 0 60 36" class="w-full h-full"><rect x="2" y="1" width="56" height="8" rx="4" fill="currentColor" opacity=".15"/><rect x="3" y="2" width="27" height="6" rx="3" fill="currentColor" opacity=".85"/><rect x="2" y="12" width="22" height="22" rx="2" fill="currentColor" opacity=".55"/><g fill="currentColor" opacity=".3"><rect x="27" y="12" width="9" height="10" rx="1.5"/><rect x="38" y="12" width="9" height="10" rx="1.5"/><rect x="49" y="12" width="9" height="10" rx="1.5"/><rect x="27" y="24" width="9" height="10" rx="1.5"/><rect x="38" y="24" width="9" height="10" rx="1.5"/><rect x="49" y="24" width="9" height="10" rx="1.5"/></g></svg>')}
      </div>`)}
      ${isC ? '' : sec('ขนาดพื้นที่แสดงผล', `<div class="space-y-3">
        <div id="boxMeasure" class="p-2.5 rounded-lg bg-navy-50 border border-navy-100 text-xs text-slate-700 font-mono">กำลังวัดขนาด...</div>
        <div><label class="lbl">ความกว้าง</label>${wseg('boxWMode', [['auto', 'อัตโนมัติ'], ['px', 'กำหนด px'], ['%', 'เปอร์เซ็นต์']])}
          ${w.boxWMode === 'px' ? `<div class="mt-2">${num('boxW', 'กว้างสูงสุด', 100, 3840, 'px')}<p class="text-xs text-slate-500 mt-1">ช่องที่วางแคบกว่านี้ จะย่อให้พอดีอัตโนมัติ</p></div>` : ''}
          ${w.boxWMode === '%' ? `<div class="mt-2">${rng('boxWPct', 'กว้าง (เทียบกับช่องที่วาง)', 10, 100, '%')}</div>` : ''}
          ${w.boxWMode !== 'auto' ? `<div class="mt-2"><label class="lbl">ตำแหน่ง</label>${wseg('boxAlign', [['left', 'ชิดซ้าย'], ['center', 'กึ่งกลาง'], ['right', 'ชิดขวา']])}</div>` : ''}</div>
        <div><label class="lbl">ความสูง</label>${wseg('boxHMode', [['auto', 'อัตโนมัติ'], ['min', 'สูงอย่างน้อย'], ['fixed', 'สูงคงที่']])}
          ${w.boxHMode !== 'auto' ? `<div class="mt-2 grid grid-cols-2 gap-3">${num('boxH', 'สูง (จอใหญ่)', 20, 3000, 'px')}${num('boxHM', 'บนมือถือ (0 = เท่ากัน)', 0, 3000, 'px')}</div>
            <div class="mt-2">${rng('boxH', 'ปรับความสูงละเอียด', 20, 1000, 'px')}</div>
            <div class="mt-2"><label class="lbl">วางเนื้อหาในแนวตั้ง</label>${wseg('boxVAlign', [['top', 'ชิดบน'], ['middle', 'กึ่งกลาง'], ['bottom', 'ชิดล่าง']])}</div>
            ${w.boxHMode === 'fixed' ? '<p class="text-xs text-amber-700 mt-1">สูงคงที่: เนื้อหาที่ยาวเกินจะถูกตัด — ถ้าไม่แน่ใจให้ใช้ “สูงอย่างน้อย”</p>' : ''}` : '<p class="text-xs text-slate-500 mt-1">สูงเท่ากับเนื้อหา ไม่มีพื้นที่ว่างเกิน</p>'}</div>
        <p class="text-xs text-slate-500">${isCar ? 'ขนาดของภาพในสไลด์ ปรับได้อีกชั้นที่หัวข้อ “ขนาดการแสดงผลสไลด์” ด้านล่าง' : 'ความกว้างของแต่ละรายการ ปรับได้ที่จำนวนคอลัมน์และระยะห่าง'}</p></div>`)}
      ${sec('พื้นหลัง', `<div class="space-y-3">
        <div><label class="lbl">พื้นหลังทั้งส่วน${isC ? ' (ผืนผ้าใบ)' : ''}</label>
          <div class="flex gap-2"><button class="btn btn-light btn-sm flex-1 ${w.bg === '#ffffff' ? '!border-navy-700 !text-navy-800' : ''}" data-wbg="#ffffff">สีขาว</button><button class="btn btn-light btn-sm flex-1 ${w.bg === 'transparent' ? '!border-navy-700 !text-navy-800' : ''}" data-wbg="transparent">โปร่งใส</button>
          <input type="color" class="h-9 w-11 rounded border border-slate-300 cursor-pointer flex-none" id="wbgColor" title="เลือกสี" value="${w.bg === 'transparent' ? '#ffffff' : w.bg}"></div></div>
        ${isC || isT ? '' : `<div><label class="lbl">${isCar ? 'พื้นหลังกรอบภาพสไลด์' : 'พื้นหลังการ์ด / กรอบภาพ'} <span class="font-normal text-slate-400">(เห็นเมื่อภาพไม่เต็มกรอบ หรือภาพ PNG โปร่งใส)</span></label>
          <div class="flex gap-2"><button class="btn btn-light btn-sm flex-1 ${!w.carBg ? '!border-navy-700 !text-navy-800' : ''}" data-cbg="">ค่าเริ่มต้น</button><button class="btn btn-light btn-sm flex-1 ${w.carBg === 'transparent' ? '!border-navy-700 !text-navy-800' : ''}" data-cbg="transparent">โปร่งใส</button>
          <input type="color" class="h-9 w-11 rounded border border-slate-300 cursor-pointer flex-none" id="cbgColor" title="เลือกสี" value="${/^#[0-9a-f]{6}$/i.test(w.carBg || '') ? w.carBg : '#ffffff'}"></div></div>`}
        <p class="text-xs text-slate-500">โปร่งใส = เห็นพื้นหลังของหน้าเว็บศาลที่นำไปวาง · การ์ดโปร่งใสจะปิดเงาให้อัตโนมัติ · ในตัวอย่างจะเห็นเป็นลายตาราง</p></div>`)}
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
        ${isCar ? '' : `<div class="grid grid-cols-2 gap-3">
          <div><label class="lbl">สัดส่วนภาพ</label>${ratioSel()}${ratioCustom()}</div>
          <div><label class="lbl">การปรับภาพ</label><select class="inp" data-k="fit"><option value="cover" ${w.fit === 'cover' ? 'selected' : ''}>เต็มกรอบ (ครอป)</option><option value="contain" ${w.fit === 'contain' ? 'selected' : ''}>แสดงครบทั้งภาพ</option></select></div>
        </div>`}</div>`) : sec('ภาพย่อ', `<div><label class="lbl">สัดส่วนภาพย่อ (กรณีรายการเป็นภาพ)</label>${ratioSel()}${ratioCustom()}</div>`)}
      ${isCar ? sec('ขนาดการแสดงผลสไลด์', `<div class="space-y-4">
        <div id="carMeasure" class="p-3 rounded-xl bg-navy-50 border border-navy-100 text-xs text-slate-700 leading-relaxed">กำลังวัดขนาดจากตัวอย่าง...</div>
        <div><label class="lbl">ความกว้าง</label>${wseg('carWMode', [['auto', 'อัตโนมัติ'], ['px', 'กำหนด px'], ['%', 'เปอร์เซ็นต์']])}
          ${w.carWMode === 'px' ? `<div class="mt-2">${num('carW', 'กว้างสูงสุด', 100, 3840, 'px')}<p class="text-xs text-slate-500 mt-1">ถ้าพื้นที่วางแคบกว่านี้ จะย่อลงให้พอดีอัตโนมัติ</p></div>` : ''}
          ${w.carWMode === '%' ? `<div class="mt-2">${rng('carWPct', 'กว้าง (เทียบกับพื้นที่วาง)', 10, 100, '%')}</div>` : ''}
          ${w.carWMode !== 'auto' ? `<div class="mt-2"><label class="lbl">ตำแหน่ง</label>${wseg('carAlign', [['left', 'ชิดซ้าย'], ['center', 'กึ่งกลาง'], ['right', 'ชิดขวา']])}</div>` : ''}</div>
        <div><label class="lbl">ความสูง</label>${wseg('carHMode', [['auto', 'อัตโนมัติ'], ['ratio', 'ตามสัดส่วน'], ['px', 'กำหนด px']])}
          ${w.carHMode === 'auto' ? `<p class="text-xs text-slate-500 mt-2">ความสูงเปลี่ยนตามภาพแต่ละภาพ ภาพไม่ถูกครอป (ภาพขนาดไม่เท่ากัน กรอบจะยืด–หดตาม)</p>` : ''}
          ${w.carHMode === 'ratio' ? `<div class="mt-2">${ratioSel()}${ratioCustom()}<button class="btn btn-light btn-sm mt-2" id="ratioFromImg">${icon('media', 'w-3.5 h-3.5')} ใช้สัดส่วนจากภาพแรก</button><p class="text-xs text-slate-500 mt-1">ความสูงปรับตามความกว้างโดยคงสัดส่วนเดิม เหมาะกับทุกขนาดจอ</p></div>` : ''}
          ${w.carHMode === 'px' ? `<div class="mt-2 grid grid-cols-2 gap-3">${num('carH', 'สูง (จอใหญ่)', 40, 2000, 'px')}${num('carHM', 'สูงบนมือถือ (0 = เท่าจอใหญ่)', 0, 2000, 'px')}</div><div class="mt-2">${rng('carH', 'ปรับความสูงละเอียด', 40, 1000, 'px')}</div>` : ''}</div>
        ${w.carHMode !== 'auto' ? `<div class="grid grid-cols-2 gap-3">
          <div><label class="lbl">การปรับภาพในกรอบ</label><select class="inp" data-k="fit"><option value="cover" ${w.fit === 'cover' ? 'selected' : ''}>เต็มกรอบ (ครอป)</option><option value="contain" ${w.fit === 'contain' ? 'selected' : ''}>แสดงครบทั้งภาพ</option></select></div>
          <div><label class="lbl">จุดยึดภาพ (เมื่อครอป)</label>${wseg('imgPos', [['top', 'บน'], ['center', 'กลาง'], ['bottom', 'ล่าง']])}</div></div>` : ''}
        <div id="natSizes" class="text-xs text-slate-500"></div></div>`) : ''}
      ${!isC && isCar ? sec('การเปลี่ยนภาพ', `<div class="space-y-3">
        <div><label class="lbl">เอฟเฟกต์</label>${wseg('transEffect', [['slide', 'เลื่อน'], ['fade', 'จางซ้อน'], ['none', 'ตัดทันที']])}</div>
        <div class="grid grid-cols-2 gap-3">${num('autoplay', 'เปลี่ยนภาพทุก (0 = ไม่เลื่อนเอง)', 0, 60, 'วิ')}${w.transEffect === 'none' ? '' : num('transMs', 'ระยะเวลาเปลี่ยนผ่าน', 0, 5000, 'ms')}</div>
        ${rng('autoplay', 'แสดงแต่ละภาพนาน', 0, 20, ' วินาที', 0.5)}
        ${w.transEffect === 'none' ? '' : `${rng('transMs', 'ความเร็วการเปลี่ยนผ่าน', 100, 3000, ' ms', 50)}
        <div><label class="lbl">จังหวะการเคลื่อนไหว</label><select class="inp" data-k="transEase">${[['smooth', 'นุ่มนวล (แนะนำ)'], ['ease', 'ธรรมดา'], ['ease-in-out', 'ช้า–เร็ว–ช้า'], ['linear', 'ความเร็วคงที่'], ['bounce', 'เด้งเล็กน้อย']].map(([v, t]) => `<option value="${v}" ${w.transEase === v ? 'selected' : ''}>${t}</option>`).join('')}</select></div>`}
        ${w.autoplay > 0 && w.transEffect !== 'none' && w.transMs >= w.autoplay * 1000 ? `<p class="text-xs text-amber-700">⚠ เวลาเปลี่ยนผ่านนานกว่าเวลาแสดงภาพ ภาพจะเลื่อนต่อเนื่องโดยไม่หยุด</p>` : ''}
        ${w.transEffect === 'fade' && w.columns > 1 ? `<p class="text-xs text-amber-700">เอฟเฟกต์จางซ้อนแสดงครั้งละ 1 ภาพเสมอ</p>` : ''}
        ${tg('pauseHover', 'หยุดเลื่อนเมื่อชี้เมาส์')}${tg('showArrows', 'แสดงปุ่มลูกศร')}${tg('showDots', 'แสดงจุดบอกตำแหน่ง')}</div>`) : ''}
      ${isC || isT ? '' : sec('คำบรรยายภาพ', `${tg('showCaption', 'แสดงชื่อ/คำบรรยาย', true)}${w.showCaption && w.layout !== 'list' ? `<div class="seg mt-2">${[['below', 'ใต้ภาพ'], ['overlay', 'ทับบนภาพ']].map(([v, t]) => `<button data-cap="${v}" class="${w.captionPos === v ? 'on' : ''}">${t}</button>`).join('')}</div>
        <div class="grid grid-cols-2 gap-3 mt-3"><div><label class="lbl">จัดข้อความ</label>${wseg('captionAlign', [['left', 'ชิดซ้าย'], ['center', 'กึ่งกลาง']])}</div>${wcol('capColor', 'สีชื่อภาพ')}</div>` : ''}`)}
      ${isG ? sec('ภาพในการ์ด', `<div class="space-y-3">
        ${rng('imgPad', 'ระยะขอบรอบภาพ (เหมาะกับโลโก้ / QR Code)', 0, 40, 'px')}
        ${tg('lightbox', 'คลิกภาพเพื่อขยายดู (เมื่อภาพไม่มีลิงก์)')}
        ${wcol('link2Color', 'สีลิงก์ที่ 2 ใต้ภาพ (เช่น “ดาวน์โหลดแบบฟอร์ม”)')}</div>`) : ''}
      ${isG ? sec('เส้นขอบปุ่มภาพ / เอฟเฟกต์เมื่อชี้เมาส์', `<div class="space-y-3">
        <div><label class="lbl">แสดงเส้นขอบ</label>${wseg('cbMode', [['none', 'ไม่มี'], ['always', 'แสดงตลอด'], ['hover', 'เฉพาะเมื่อชี้เมาส์']])}</div>
        ${(w.cbMode || 'none') === 'none' ? '<p class="text-xs text-slate-500">เพิ่มกรอบรอบภาพที่ใช้เป็นปุ่มกด ให้ผู้ใช้เห็นชัดว่าคลิกได้ — เลือก “แสดงตลอด” หรือ “เฉพาะเมื่อชี้เมาส์”</p>' : `
        <div><label class="lbl">ใช้กับ</label>${wseg('cbScope', [['link', 'เฉพาะภาพที่มีลิงก์ (ปุ่มภาพ)'], ['all', 'ภาพทุกภาพ']])}</div>
        <div class="grid grid-cols-2 gap-3">${wcol('cbColor', w.cbMode === 'hover' ? 'สีเส้นขอบ (รอง)' : 'สีเส้นขอบ')}${wcol('cbHColor', 'สีเมื่อชี้เมาส์')}</div>
        ${rng('cbW', 'ความหนาเส้น', 1, 12, 'px')}
        ${rng('cbOff', 'ระยะเส้นจากขอบการ์ด (เข้าด้านใน)', 0, 16, 'px')}
        <div><label class="lbl">ลายเส้น</label>${wseg('cbStyle', [['solid', '━ เส้นทึบ'], ['dashed', '┅ เส้นประ'], ['dotted', '⋯ จุด'], ['double', '═ เส้นคู่']])}</div>
        <div><label class="lbl">Animation เมื่อชี้เมาส์</label>${wseg3('cbAnim', [['none', 'เปลี่ยนสีอย่างเดียว'], ['glow', '✨ เรืองแสง'], ['pulse', '◎ คลื่นกระจาย'], ['spin', '🌀 เส้นไล่สีวิ่งรอบ'], ['lift', '⬆ ยกลอย'], ['zoom', '🔍 ซูมภาพ']])}</div>
        <p class="text-xs text-slate-500">บนมือถือ/แท็บเล็ต (ไม่มีเมาส์) โหมด “เฉพาะเมื่อชี้เมาส์” จะแสดงเส้นขอบตลอด เพื่อให้รู้ว่ากดได้ · ชี้เมาส์ที่ภาพในตัวอย่างด้านซ้ายเพื่อทดลอง</p>`}</div>`) : ''}
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
          <div class="text-xs text-slate-500 self-end pb-2">สีพื้นหลัง / โปร่งใส ตั้งได้ที่หัวข้อ “พื้นหลัง” ด้านบน</div>
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
    if (!isCar) $$('[data-k]', P).forEach(el => el.addEventListener('input', () => $$(`[data-k="${el.dataset.k}"]`, P).forEach(o => { if (o !== el && o.type !== 'checkbox') o.value = el.value; })));
    measureBox();
    if (isCar) carHelpers(P);
    $('#pvWrap').classList.toggle('bg-white', w.bg !== 'transparent');
    $$('[data-wbg]', P).forEach(b => b.onclick = () => { w.bg = b.dataset.wbg; markDirty(); drawPanel(); });
    const wbc = $('#wbgColor', P); if (wbc) wbc.onchange = () => { w.bg = wbc.value; markDirty(); drawPanel(); };
    $$('[data-cbg]', P).forEach(b => b.onclick = () => { w.carBg = b.dataset.cbg; markDirty(); drawPanel(); });
    const cbc = $('#cbgColor', P); if (cbc) cbc.onchange = () => { w.carBg = cbc.value; markDirty(); drawPanel(); };
    $$('[data-k="accent"]', P).forEach(c => c.addEventListener('input', () => { const m = $('[data-mirror="accent"]', P); if (m) m.value = c.value; }));
    $$('[data-k="bg"]', P).forEach(c => c.addEventListener('input', () => { w.bg = c.value; }));
  }

  /* สไลด์: ขนาดภาพจริง + ขนาดที่แสดงในตัวอย่าง */
  const natCache = {};
  const natSize = src => natCache[src] || (natCache[src] = new Promise(r => { const im = new Image(); im.onload = () => r({ w: im.naturalWidth, h: im.naturalHeight }); im.onerror = () => r(null); im.src = src; }));
  async function carHelpers(P) {
    // sync number <-> range ที่ใช้ key เดียวกัน
    $$('[data-k]', P).forEach(el => el.addEventListener('input', () => $$(`[data-k="${el.dataset.k}"]`, P).forEach(o => { if (o !== el && o.type !== 'checkbox') o.value = el.value; })));
    const imgs = (w.items || []).filter(i => i.type === 'image' && i.src && i.active !== false);
    const rb = $('#ratioFromImg', P);
    if (rb) rb.onclick = async () => { const n = imgs[0] && await natSize(imgs[0].src); if (!n) return fail('ยังไม่มีภาพในสไลด์'); w.ratio = 'custom'; w.ratioW = n.w; w.ratioH = n.h; markDirty(); drawPanel(); };
    const box = $('#natSizes', P);
    if (box && imgs.length) {
      const sizes = await Promise.all(imgs.slice(0, 12).map(i => natSize(i.src)));
      if (!document.body.contains(box)) return;
      box.innerHTML = `<div class="font-semibold text-slate-600 mb-1">ขนาดไฟล์ภาพจริง</div>` + sizes.map((n, k) => `<div class="flex justify-between gap-2 py-0.5 border-b border-slate-100"><span class="truncate">${esc(imgs[k].title || 'ภาพที่ ' + (k + 1))}</span><span class="font-mono flex-none">${n ? `${n.w} × ${n.h} px <span class="text-slate-400">(${(n.w / n.h).toFixed(2)}:1)</span>` : 'โหลดไม่ได้'}</span></div>`).join('');
    }
    measureCar();
  }
  function measureCar() {
    const box = $('#carMeasure'); if (!box) return;
    let d; try { d = pv.contentDocument; } catch { d = null; }
    const car = d && d.querySelector('.uw-car'), media = d && d.querySelector('.uw-car .uw-slide' + (w.transEffect === 'fade' ? '.on' : '') + ' .uw-media');
    if (!car) { box.textContent = 'ยังไม่มีภาพในสไลด์ — เพิ่มภาพที่แท็บ “รายการ” แล้วขนาดจะแสดงที่นี่'; return; }
    const r = car.getBoundingClientRect(), m = media ? media.getBoundingClientRect() : null;
    const dev = { desktop: 'จอใหญ่', tablet: 'แท็บเล็ต (768px)', phone: 'มือถือ (390px)' }[device] || '';
    box.innerHTML = `<div class="flex items-center justify-between gap-2"><b class="text-navy-800">ขนาดที่แสดงจริงในตัวอย่าง</b><span class="text-slate-500">${dev}</span></div>
      <div class="mt-1 font-mono text-[13px]">กรอบสไลด์: <b>${Math.round(r.width)} × ${Math.round(r.height)}</b> px</div>
      ${m ? `<div class="font-mono text-[13px]">พื้นที่ภาพ: <b>${Math.round(m.width)} × ${Math.round(m.height)}</b> px</div>` : ''}
      <div class="text-slate-500 mt-1">ขนาดจริงบนเว็บขึ้นกับความกว้างของช่องที่นำไปวาง สลับดูจอใหญ่ / แท็บเล็ต / มือถือ ได้ที่แถบด้านบนตัวอย่าง</div>`;
  }
  function measureBox() {
    const box = $('#boxMeasure'); if (!box) return;
    let d; try { d = pv.contentDocument; } catch { d = null; }
    const u = d && d.querySelector('.uw'); if (!u) return;
    const r = u.getBoundingClientRect();
    box.innerHTML = `ขนาดในตัวอย่าง (${{ desktop: 'จอใหญ่', tablet: 'แท็บเล็ต', phone: 'มือถือ' }[device]}): <b>${Math.round(r.width)} × ${Math.round(r.height)}</b> px`;
  }
  pv.addEventListener('load', () => {
    [0, 600, 1500].forEach(t => setTimeout(() => { measureBox(); if (w.layout === 'carousel') measureCar(); }, t));
  });

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
        <label class="btn btn-primary cursor-pointer">${icon('upload')} อัปโหลดภาพ / PDF<input type="file" accept="image/*,.pdf,application/pdf" multiple class="hidden" id="bulkUp"></label>
        <button class="btn btn-light w-full" id="addBtn">${icon('plus')} เพิ่มรายการ</button>
      </div>
      <div id="addMenu" class="hidden mb-3 p-2 rounded-xl border border-navy-200 bg-navy-50/60">
        <div class="flex items-center justify-between px-1 mb-1.5"><span class="text-xs font-semibold text-slate-600">เลือกประเภทรายการที่จะเพิ่ม</span><button class="text-slate-400 hover:text-slate-700" id="addClose" title="ปิด">${icon('x', 'w-4 h-4')}</button></div>
        <div class="grid grid-cols-3 sm:grid-cols-4 gap-1.5">${Object.entries(TYPE_META).map(([k, m]) => `<button data-add="${k}" class="flex flex-col items-center gap-1 p-2 rounded-lg bg-white border border-slate-200 hover:border-navy-400 hover:shadow-sm text-xs font-medium text-slate-700"><span class="w-8 h-8 rounded-lg grid place-items-center ${m.cls}">${icon(m.ic, 'w-4 h-4')}</span>${m.name}</button>`).join('')}</div>
      </div>
      <div class="flex items-center justify-between text-xs text-slate-500 mb-2 px-1"><span>${items.length} รายการ · ลากเพื่อจัดลำดับ</span>${w.limit ? `<span class="text-amber-700">แสดงจริง ${w.limit} รายการแรก</span>` : ''}</div>
      <div id="dropItems" class="hidden mb-2 p-4 rounded-xl border-2 border-dashed border-navy-400 bg-navy-50 text-center text-sm text-navy-800">ปล่อยไฟล์ที่นี่เพื่อเพิ่มเป็นรายการ (ภาพ / PDF / วีดีโอ)</div>
      <div id="itemList" class="space-y-2">${items.map((it, idx) => {
      const tm = TYPE_META[it.type], [st, stc] = itemStatus(it);
      const thumb = it.type === 'pdf' && it.src ? `<span class="relative w-full h-full block bg-white" data-pdfthumb="${esc(it.src)}">${icon('file', 'w-5 h-5 m-auto mt-3')}</span>` : it.type === 'text' ? `<span class="font-bold text-base" style="${it.ts && it.ts.font ? `font-family:'${esc(it.ts.font)}'` : ''}">Aa</span>` : it.type === 'image' && it.src ? `<img src="${esc(it.src)}" class="w-full h-full object-cover">` : it.type === 'button' ? `<span class="w-full h-full p-1 block">${UB.buttonHtml({ title: it.iconFa || it.iconImg ? '' : (it.icon || 'Aa'), iconFa: it.iconFa, iconImg: it.iconImg, style: { ...(it.style || UB.fromLegacy(it.btnStyle, w.accent)), fontSize: 11, iconSize: 15, padX: 2, padY: 2, iconPos: it.iconFa || it.iconImg ? 'only' : 'left', radius: Math.min((it.style || {}).radius ?? 6, 8), hover: 'none', idle: 'none', depth: 'flat' } }, { tag: 'div' })}</span>` : icon(tm.ic, 'w-5 h-5');
      const hidden = w.limit && idx >= w.limit;
      return `<div class="group flex items-center gap-2.5 p-2 rounded-xl border ${hidden ? 'border-dashed border-slate-300 bg-slate-50/70' : 'border-slate-200 bg-white'} hover:border-navy-300" draggable="true" data-idx="${idx}">
          <span class="cursor-grab text-slate-300 hover:text-slate-500">${icon('grip')}</span>
          <span class="w-14 h-11 rounded-lg overflow-hidden grid place-items-center flex-none ${tm.cls}">${thumb}</span>
          <button class="flex-1 min-w-0 text-left" data-edit="${idx}"><span class="block text-sm font-medium truncate ${it.active ? '' : 'text-slate-400 line-through'}">${esc(it.title || (TEXTY.includes(it.type) ? textTitle(it) : '') || '(ไม่มีชื่อ)')}</span>
            <span class="flex items-center gap-1.5 mt-0.5"><span class="text-[11px] px-1.5 rounded ${tm.cls}">${tm.name}</span><span class="text-[11px] px-1.5 rounded ${stc}">${st}</span>${it.end ? `<span class="text-[11px] text-slate-400">ถึง ${esc(it.end)}</span>` : ''}${hidden ? '<span class="text-[11px] text-slate-400">เกินจำนวน</span>' : ''}</span></button>
          <button class="p-1.5 rounded-lg text-slate-400 hover:text-navy-800 hover:bg-slate-100" data-rn="${idx}" title="เปลี่ยนชื่อ">${icon('edit', 'w-4 h-4')}</button>
          <input type="checkbox" class="tgl" data-act="${idx}" ${it.active ? 'checked' : ''} title="เปิด/ปิดการแสดง">
          <div class="flex flex-col"><button class="text-slate-400 hover:text-navy-800 disabled:opacity-20" data-mv="${idx}:-1" ${idx === 0 ? 'disabled' : ''}>${icon('up', 'w-4 h-4')}</button><button class="text-slate-400 hover:text-navy-800 disabled:opacity-20" data-mv="${idx}:1" ${idx === items.length - 1 ? 'disabled' : ''}>${icon('down', 'w-4 h-4')}</button></div>
          <button class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50" data-rm="${idx}">${icon('trash')}</button>
        </div>`;
    }).join('') || `<div class="text-center py-10 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">ยังไม่มีรายการ<br>เริ่มจากอัปโหลดภาพ หรือกด “เพิ่มรายการ”</div>`}</div>`;

    $('#addBtn').onclick = () => $('#addMenu').classList.toggle('hidden');
    $('#addClose').onclick = () => $('#addMenu').classList.add('hidden');
    $$('[data-add]', P).forEach(b => b.onclick = () => editItem({ id: rid(), type: b.dataset.add, title: '', subtitle: '', src: '', link: '', newTab: true, icon: '', btnStyle: 'primary', html: '', active: true, start: '', end: '', ...(b.dataset.add === 'table' ? { title: 'ตาราง', tb: newTable() } : {}), ...(b.dataset.add === 'qr' ? { title: 'QR Code', qr: newQr() } : {}), ...(TEXTY.includes(b.dataset.add) ? { ts: UB.normText(b.dataset.add === 'text' ? { ...UB.TPRESETS.find(p => p.id === 'h2').s, content: 'หัวข้อ / ข้อความ' } : b.dataset.add === 'divider' ? { color: '#cbd5e1' } : {}) } : {}) }, true));
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
        const it = itemFromUpload(u); if (!it) return;
        w.items.push(asBtn && it.type === 'image' ? toLogoButton(it) : it);
      });
      if (asBtn && ups.length) Toast.fire({ icon: 'info', title: 'เพิ่มเป็นปุ่มโลโก้แล้ว — แก้ข้อความและลิงก์ของแต่ละปุ่มได้เลย' });
      if (ups.length) { markDirty(); drawPanel(); }
    };
    $$('[data-edit]', P).forEach(b => b.onclick = () => editItem(clone(items[+b.dataset.edit]), false, +b.dataset.edit));
    fillPdfThumbs(P);
    // ลากไฟล์จากเครื่องมาวางในรายการ
    const dz = $('#dropItems');
    P.ondragover = e => { if ([...(e.dataTransfer.types || [])].includes('Files')) { e.preventDefault(); dz.classList.remove('hidden'); } };
    P.ondragleave = e => { if (!P.contains(e.relatedTarget)) dz.classList.add('hidden'); };
    P.ondrop = async e => {
      const files = [...(e.dataTransfer.files || [])]; dz.classList.add('hidden');
      if (!files.length) return; e.preventDefault();
      const ups = await uploadMany(files); let n = 0;
      ups.forEach(u => { const it = itemFromUpload(u); if (it) { w.items.push(it); n++; } });
      if (n) { markDirty(); drawPanel(); }
    };
    $$('[data-rn]', P).forEach(b => b.onclick = async () => {
      const it = items[+b.dataset.rn];
      const r = await Swal.fire({ title: 'เปลี่ยนชื่อรายการ', input: 'text', inputValue: it.title || '', inputPlaceholder: 'ชื่อ / หัวข้อ', showCancelButton: true, confirmButtonText: 'บันทึกชื่อ', cancelButtonText: 'ยกเลิก', reverseButtons: true });
      if (!r.isConfirmed) return;
      it.title = String(r.value || '').trim(); markDirty(); drawPanel();
    });
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
          if (t === 'table' && !it.tb) it.tb = newTable();
          if (t === 'qr' && !it.qr) it.qr = newQr();
          if (t === 'pdf') it.pdf = Object.assign({ mode: 'single', h: 640, hM: 0, bar: true, dl: true }, it.pdf || {});
          F.innerHTML = `<div class="space-y-4">
            <div><label class="lbl">ประเภท</label><div class="seg flex-wrap">${Object.entries(TYPE_META).map(([k, mm]) => `<button data-ty="${k}" class="${t === k ? 'on' : ''} flex items-center justify-center gap-1.5">${icon(mm.ic, 'w-3.5 h-3.5')} ${mm.name}</button>`).join('')}</div></div>
            ${TEXTY.includes(t) ? `<div class="rounded-xl border border-slate-200 overflow-hidden sticky -top-5 z-20 shadow-sm bg-white"><div class="px-3 py-1.5 text-xs text-slate-500 bg-slate-50 border-b border-slate-200">ตัวอย่าง (ติดอยู่ด้านบนขณะเลื่อนปรับค่า)</div><div class="p-4 bg-white" style="${it.ts && it.ts.tShadow ? 'background:#334155' : ''}" data-txpv>${textPreviewHtml(it)}</div></div>
              <div data-txd></div>` : ''}
            ${t === 'image' ? `<div><label class="lbl">ภาพ</label>
              <div class="flex gap-3 items-start"><div class="w-36 aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 chk-pattern grid place-items-center flex-none">${it.src ? `<img src="${esc(it.src)}" class="w-full h-full object-contain">` : icon('image', 'w-7 h-7 text-slate-300')}</div>
              <div class="flex-1 space-y-2"><button class="btn btn-primary btn-sm w-full" data-pick="image">${icon('media', 'w-3.5 h-3.5')} เลือก / อัปโหลดภาพ</button><input class="inp text-xs font-mono" data-f="src" value="${esc(it.src)}" placeholder="หรือวาง URL ภาพ"></div></div></div>` : ''}
            ${t === 'video' ? videoSection(it) : ''}
            ${t === 'table' ? `<div class="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div class="flex items-center justify-between"><label class="lbl !mb-0">ตาราง ${it.tb ? `(${it.tb.rows.length} แถว × ${it.tb.rows[0].length} คอลัมน์)` : ''}</label><button class="btn btn-primary btn-sm" data-tbedit>${icon('table', 'w-3.5 h-3.5')} แก้ไขข้อมูล / ออกแบบตาราง</button></div>
              <div class="bg-white rounded-lg border border-slate-200 p-3 overflow-auto" style="max-height:260px">${UB.tableHtml(it)}</div></div>` : ''}
            ${t === 'qr' ? `<div class="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div class="flex items-center justify-between gap-2"><label class="lbl !mb-0">QR Code</label><button class="btn btn-primary btn-sm" data-qredit>${icon('qr', 'w-3.5 h-3.5')} สร้าง / ออกแบบ QR Code</button></div>
              <div class="flex gap-3 items-center"><div class="w-36 flex-none chk-pattern rounded-lg p-2">${UB.qrHtml(it, { noLink: true })}</div><div class="text-xs text-slate-600 break-all">${esc(UB.normQr(it.qr).text)}</div></div></div>` : ''}
            ${t === 'pdf' ? `<div><label class="lbl">ไฟล์ PDF</label>
              <div class="flex gap-3 items-start"><div class="w-28 aspect-[3/4] rounded-lg overflow-hidden border border-slate-200 bg-white relative flex-none" ${it.src ? `data-pdfthumb="${esc(it.src)}" data-pages` : ''}>${icon('file', 'w-7 h-7 text-slate-300 m-auto mt-10')}</div>
              <div class="flex-1 space-y-2"><button class="btn btn-primary btn-sm w-full" data-pick="pdf">${icon('upload', 'w-3.5 h-3.5')} เลือก / อัปโหลด PDF</button><input class="inp text-xs font-mono" data-f="src" value="${esc(it.src)}" placeholder="หรือวาง URL ไฟล์ .pdf">
                ${it.src ? `<a class="btn btn-light btn-sm w-full" href="${esc(it.src)}" target="_blank">${icon('ext', 'w-3.5 h-3.5')} เปิดไฟล์ต้นฉบับ</a>` : ''}</div></div></div>
              <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div><label class="lbl">รูปแบบตัวแสดงตัวอย่าง</label><div class="seg">${[['single', 'ทีละหน้า (มีปุ่ม ‹ ›)'], ['scroll', 'เลื่อนดูทุกหน้า']].map(([v, l]) => `<button type="button" data-pm="${v}" class="${it.pdf.mode === v ? 'on' : ''}">${l}</button>`).join('')}</div></div>
                <div class="grid grid-cols-2 gap-3"><div><label class="lbl">ความสูง (px)</label><input type="number" class="inp" data-pf="h" min="200" max="3000" value="${it.pdf.h}"></div><div><label class="lbl">บนมือถือ (0 = อัตโนมัติ)</label><input type="number" class="inp" data-pf="hM" min="0" max="3000" value="${it.pdf.hM}"></div></div>
                <p class="text-xs text-slate-500 -mt-1">ในผืนผ้าใบอิสระ ความสูงตามกรอบที่ลากปรับขนาด</p>
                <label class="flex items-center justify-between text-sm text-slate-700">แสดงแถบชื่อไฟล์และปุ่มด้านบน<input type="checkbox" class="tgl" data-pfc="bar" ${it.pdf.bar ? 'checked' : ''}></label>
                <label class="flex items-center justify-between text-sm text-slate-700">มีปุ่มดาวน์โหลด<input type="checkbox" class="tgl" data-pfc="dl" ${it.pdf.dl ? 'checked' : ''}></label></div>` : ''}
            ${t === 'html' ? `<div><div class="flex items-center justify-between mb-1"><label class="lbl !mb-0">โค้ด HTML</label><button class="btn btn-gold btn-sm" data-htmled>${icon('code', 'w-3.5 h-3.5')} เปิดตัวแก้ไขโค้ด + ตัวอย่าง</button></div><textarea class="inp font-mono text-xs" rows="8" data-f="html" placeholder="<div>...</div>">${esc(it.html)}</textarea><p class="text-xs text-amber-700 mt-1">⚠ HTML จะแสดงผลตามที่ใส่ ควรใช้โค้ดจากแหล่งที่เชื่อถือได้เท่านั้น</p></div>` : ''}
            ${TEXTY.includes(t) ? `<div><label class="lbl">ชื่อ (ใช้ภายใน · เว้นว่างได้)</label><input class="inp" data-f="title" value="${esc(it.title)}" placeholder="${esc(textTitle(it))}"></div>` : t !== 'html' ? `<div class="grid gap-3">

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
            ${!['html', 'divider', 'spacer', 'table'].includes(t) ? `<div class="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">${t === 'qr' ? '<p class="text-xs text-slate-500">ลิงก์นี้ใช้เมื่อคลิกที่ QR บนหน้าเว็บ (ถ้าเว้นว่าง และเปิด “คลิกแล้วเปิดลิงก์ในโค้ด” ไว้ในตัวออกแบบ จะใช้ลิงก์ในโค้ดแทน)</p>' : ''}
              <label class="lbl !mb-0">${icon('link', 'w-3.5 h-3.5 inline')} ${t === 'text' ? 'ลิงก์เมื่อคลิกทั้งกล่องข้อความ' : 'ลิงก์เมื่อคลิก'} ${t === 'video' ? '(ไม่ใช้กับวีดีโอ)' : '(ไม่บังคับ)'}</label>
              ${t === 'image' ? `<label class="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-700 cursor-pointer"><span>${icon('ext', 'w-3.5 h-3.5 inline')} <b>คลิกเพื่อเปิดภาพขนาดเต็ม</b> (ลิงก์ไปไฟล์ภาพต้นฉบับ · ใช้เมื่อไม่ได้ใส่ลิงก์อื่น)</span><input type="checkbox" class="tgl" data-f="full" ${it.full ? 'checked' : ''}></label>` : ''}
              ${t === 'pdf' ? '<p class="text-xs text-slate-500">PDF มีปุ่ม “เปิดเต็มจอ” ในตัวแสดงตัวอย่างอยู่แล้ว ลิงก์นี้ไม่จำเป็น</p>' : ''}
              ${t !== 'video' && t !== 'pdf' ? `<div class="flex gap-2"><input class="inp" data-f="link" value="${esc(it.link)}" placeholder="https://... หรือ /p/ชื่อหน้า"><button class="btn btn-light btn-sm" data-pp title="เลือกหน้าเว็บในระบบ">${icon('page', 'w-3.5 h-3.5')}</button><button class="btn btn-light btn-sm" data-pick="file" title="ลิงก์ไปไฟล์เอกสาร">${icon('file', 'w-3.5 h-3.5')}</button></div>
              <label class="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" class="tgl" data-f="newTab" ${it.newTab ? 'checked' : ''}> เปิดในแท็บใหม่</label>` : ''}
              ${t === 'image' && it.src ? `<a class="text-xs text-navy-700 underline" href="${esc(it.src)}" target="_blank">เปิดดูภาพต้นฉบับ</a>` : ''}
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
            if (TEXTY.includes(it.type)) {
              const seed = it.type === 'text' ? { ...UB.TPRESETS.find(p => p.id === 'h2').s, content: it.title || it.subtitle || 'หัวข้อ / ข้อความ' } : it.type === 'divider' ? { color: '#cbd5e1' } : {};
              it.ts = UB.normText(it.ts && it.ts.content ? it.ts : seed);
            }
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
            else if (k === 'file') it.link = url; else if (k === 'poster') it.poster = url; else { it.src = url; if (!it.title && !(it.type === 'video' && UB.videoInfo(url).kind !== 'file')) it.title = decodeURIComponent(url.split('/').pop()).replace(/\.[^.]+$/, ''); }
            draw();
          });
          const pp = $('[data-pp]', F); if (pp) pp.onclick = async () => { const s = await choosePage(); if (s) { it.link = `/p/${s}`; it.newTab = false; draw(); } };
          if (it.type === 'video') bindVideoSection(F, it, draw);
          const hed = $('[data-htmled]', F); if (hed) hed.onclick = () => editHtmlCode(it.html, h => { it.html = h; draw(); });
          const tbe = $('[data-tbedit]', F); if (tbe) tbe.onclick = () => editTable(it, n => { it.tb = n.tb; draw(); });
          const qre = $('[data-qredit]', F); if (qre) qre.onclick = () => designQr(it, n => { it.qr = n.qr; if (!it.title) it.title = n.title; draw(); });
          $$('[data-pm]', F).forEach(b => b.onclick = () => { it.pdf.mode = b.dataset.pm; draw(); });
          $$('[data-pf]', F).forEach(i => i.addEventListener('input', () => { it.pdf[i.dataset.pf] = Number(i.value) || 0; }));
          $$('[data-pfc]', F).forEach(i => i.addEventListener('change', () => { it.pdf[i.dataset.pfc] = i.checked; }));
          fillPdfThumbs(F);
          const txd = $('[data-txd]', F);
          if (txd) mountTextDesigner(txd, it, () => { const pv = $('[data-txpv]', F); if (pv) { pv.innerHTML = textPreviewHtml(it); pv.style.background = it.ts.tShadow ? '#334155' : ''; } });
        };
        draw();
        $('[data-ok]', el).onclick = () => {
          if ((it.type === 'image' || it.type === 'video') && !it.src) return Swal.fire({ icon: 'warning', title: `กรุณาเลือก${tm().name}`, confirmButtonText: 'ตกลง' });
          if (it.type === 'button' && !it.title) return Swal.fire({ icon: 'warning', title: 'กรุณากรอกข้อความบนปุ่ม', confirmButtonText: 'ตกลง' });
          if (it.type === 'pdf' && !it.src) return Swal.fire({ icon: 'warning', title: 'กรุณาเลือกไฟล์ PDF', confirmButtonText: 'ตกลง' });
          if (it.type === 'text' && !String(it.ts.content || '').trim()) return Swal.fire({ icon: 'warning', title: 'กรุณาพิมพ์ข้อความ', confirmButtonText: 'ตกลง' });
          if (!TEXTY.includes(it.type)) delete it.ts;
          if (it.type !== 'table') delete it.tb;
          if (it.type !== 'qr') delete it.qr;
          if (it.start && it.end && it.start > it.end) return Swal.fire({ icon: 'warning', title: 'วันเริ่มต้องไม่เกินวันสิ้นสุด', confirmButtonText: 'ตกลง' });
          if (isNew) { if (w.layout === 'canvas' && !it.pos) { const g = w.gridSize || 20; it.pos = { x: g, y: g, w: it.type === 'button' ? 240 : it.type === 'text' ? 400 : 320, h: it.type === 'button' ? 60 : it.type === 'text' ? 80 : TEXTY.includes(it.type) ? 40 : 200, z: w.items.length + 1, locked: false }; } w.items.push(it); } else w.items[idx] = it;
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
/* ---------------- แม่แบบหน้าเว็บ ---------------- */
const TPL_SKETCH = {
  'full-services': ['hero', 'logos5', 'tabs', 'info3'],
  'news-home': ['hero', 'textc', 'cards3', 'list2', 'qr5'],
  'online-center': ['herolow', 'texth', 'logos4', 'list1', 'notice'],
  gallery: ['hero', 'slide3', 'cards2', 'band'],
  minimal: ['herowide', 'textc', 'outline4', 'line'],
};
function tplSketch(id, c) {
  const bar = (w, h = 4, o = 1) => `<div style="width:${w}%;height:${h}px;border-radius:2px;background:${c};opacity:${o}"></div>`;
  const row = (n, h, o = .55, r = 3) => `<div style="display:grid;grid-template-columns:repeat(${n},1fr);gap:3px">${Array.from({ length: n }, () => `<div style="height:${h}px;border-radius:${r}px;background:${c};opacity:${o}"></div>`).join('')}</div>`;
  const P = {
    hero: `<div style="height:34px;border-radius:4px;background:linear-gradient(120deg,${c},#94a3b8);position:relative"><div style="position:absolute;bottom:3px;left:50%;transform:translateX(-50%);display:flex;gap:2px">${'<i style="width:3px;height:3px;border-radius:2px;background:#fff;display:block"></i>'.repeat(3)}</div></div>`,
    herolow: `<div style="height:22px;border-radius:4px;background:linear-gradient(120deg,${c},#94a3b8)"></div>`,
    herowide: `<div style="height:28px;background:linear-gradient(120deg,${c},#94a3b8)"></div>`,
    logos5: row(5, 12, .35), logos4: row(4, 12, .35), outline4: `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:3px">${`<div style="height:12px;border-radius:3px;border:1.5px solid ${c}"></div>`.repeat(4)}</div>`,
    tabs: `<div style="display:flex;gap:3px">${bar(22, 5)}${bar(22, 5, .3)}</div><div style="display:grid;grid-template-columns:2fr 3fr;gap:3px"><div style="height:22px;border-radius:3px;background:${c};opacity:.45"></div>${row(3, 9, .25)}</div>`,
    info3: row(3, 22, .4), cards3: row(3, 16, .45), cards2: row(2, 16, .45), qr5: row(5, 9, .3, 2),
    slide3: `<div style="display:flex;align-items:center;gap:3px"><span style="font-size:8px;color:${c}">‹</span><div style="flex:1">${row(3, 20, .4)}</div><span style="font-size:8px;color:${c}">›</span></div>`,
    textc: `<div style="display:flex;flex-direction:column;align-items:center;gap:2px">${bar(40, 5)}${bar(60, 3, .35)}</div>`,
    texth: `<div style="border-left:3px solid ${c};padding-left:3px;display:flex;flex-direction:column;gap:2px">${bar(40, 5)}${bar(55, 3, .35)}</div>`,
    list2: `<div style="display:grid;grid-template-columns:1fr 1fr;gap:3px">${'<div style="height:6px;border-radius:2px;background:#cbd5e1"></div>'.repeat(4)}</div>`,
    list1: `<div style="display:flex;flex-direction:column;gap:2px">${'<div style="height:5px;border-radius:2px;background:#cbd5e1"></div>'.repeat(3)}</div>`,
    notice: `<div style="height:10px;border-radius:3px;background:#e0f2fe;border-left:3px solid #0284c7"></div>`,
    band: `<div style="height:10px;border-radius:3px;background:${c}"></div>`, line: `<div style="height:1px;background:#cbd5e1;margin:3px 0"></div>${bar(50, 3, .3)}`,
  };
  return `<div style="display:flex;flex-direction:column;gap:4px;padding:8px;background:#fff;border-radius:8px;border:1px solid #e2e8f0;height:118px;overflow:hidden">${TPL_SKETCH[id].map(k => P[k]).join('')}</div>`;
}
/** วาดตัวเลือกแม่แบบลงใน root (ใช้ทั้งหน้าเมนู และหน้าต่างจากหน้าเว็บเผยแพร่) */
async function buildTplPicker(root, onDone) {
  const meta = await api('GET', '/templates');
  let tpl = meta.templates[0].id, theme = meta.themes[0].id;
  root.innerHTML = `<p class="text-sm text-slate-500 mb-4">ระบบจะสร้าง <b>ส่วนแสดงผลทุกชิ้น</b> (รวมสไลด์ภาพ) และ <b>หน้าเว็บ</b> ให้พร้อมแก้ไข — เปลี่ยนภาพ ข้อความ ลิงก์ ได้ทีหลัง ข้อมูลเดิมไม่ถูกแก้</p>
    <div class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">1. เลือกแม่แบบ (5 แบบ)</div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3" data-tpls></div>
    <div class="mt-5 grid md:grid-cols-2 gap-4">
      <div><div class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">2. เลือกธีมสี</div><div class="flex flex-wrap gap-2" data-themes></div></div>
      <div><div class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">3. ชื่อหน้าเว็บ</div><input class="inp" data-title placeholder="เว้นว่าง = ใช้ชื่อแม่แบบ"></div></div>
    <div class="mt-5 pt-4 border-t border-slate-200 flex flex-wrap items-center gap-2">
      <button class="btn btn-light" data-rand>${icon('sparkle')} สุ่มแม่แบบ + ธีม</button>
      <span class="text-sm text-slate-500 ml-auto" data-sum></span>
      <button class="btn btn-primary" data-tok>${icon('plus')} สร้างหน้าเว็บ</button></div>`;
  const draw = () => {
    const th = meta.themes.find(t => t.id === theme);
    $('[data-tpls]', root).innerHTML = meta.templates.map(t => `<button type="button" data-tp="${t.id}" class="text-left p-2.5 rounded-xl border-2 transition ${t.id === tpl ? 'border-navy-700 bg-navy-50' : 'border-slate-200 hover:border-slate-300 bg-white'}">
      ${tplSketch(t.id, th.main)}<div class="mt-2 font-semibold text-sm text-slate-900 flex items-center gap-1.5">${t.id === tpl ? icon('check', 'w-4 h-4 text-navy-700') : ''}${esc(t.name)}</div><div class="text-xs text-slate-500 leading-relaxed">${esc(t.desc)}</div></button>`).join('');
    $('[data-themes]', root).innerHTML = meta.themes.map(t => `<button type="button" data-th="${t.id}" class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border-2 text-xs bg-white ${t.id === theme ? 'border-navy-700' : 'border-slate-200'}"><span class="w-4 h-4 rounded-full" style="background:linear-gradient(135deg,${t.main} 55%,${t.acc} 55%)"></span>${esc(t.name)}</button>`).join('');
    $('[data-sum]', root).textContent = `${meta.templates.find(t => t.id === tpl).name} · ธีม${th.name}`;
    $$('[data-tp]', root).forEach(b => b.onclick = () => { tpl = b.dataset.tp; draw(); });
    $$('[data-th]', root).forEach(b => b.onclick = () => { theme = b.dataset.th; draw(); });
  };
  draw();
  $('[data-rand]', root).onclick = () => {
    const pick = a => a[Math.floor(Math.random() * a.length)];
    let n = pick(meta.templates).id; const m = pick(meta.themes).id;
    if (n === tpl && m === theme) n = pick(meta.templates.filter(t => t.id !== tpl)).id;
    tpl = n; theme = m; draw();
  };
  $('[data-tok]', root).onclick = async () => {
    const b = $('[data-tok]', root); b.disabled = true; b.textContent = 'กำลังสร้าง...';
    try {
      const r = await api('POST', '/templates', { template: tpl, theme, title: $('[data-title]', root).value.trim() });
      if (onDone) onDone();
      ok(`สร้างหน้า “${r.page.title}” และส่วนแสดงผล ${r.widgets} ชิ้นแล้ว`);
      window.open(`/p/${r.page.slug}`, '_blank'); location.hash = `#/pages/${r.page.id}`;
    } catch (e) { b.disabled = false; b.innerHTML = `${icon('plus')} สร้างหน้าเว็บ`; fail(e.message); }
  };
}
function pickTemplate() {
  openModal({ title: 'สร้างหน้าเว็บจากแม่แบบ', size: 'max-w-5xl', body: '<div data-tplroot>กำลังโหลด...</div>',
    onMount: (el, close) => buildTplPicker($('[data-tplroot]', el), close) });
}
async function viewTemplates() {
  $('#view').innerHTML = `${pageHead('สร้างจากแม่แบบ', 'เลือกแม่แบบหน้าเว็บ 5 แบบ (ทุกแบบมีสไลด์ภาพ) + ธีมสี แล้วกดสร้าง — ได้หน้าเว็บและส่วนแสดงผลพร้อมแก้ไข')}
    <div class="card p-5" id="tplRoot">กำลังโหลด...</div>`;
  await buildTplPicker($('#tplRoot'));
}

async function viewPages() {
  const list = await api('GET', '/pages');
  const home = state.settings.homePageId;
  $('#view').innerHTML = `${pageHead('หน้าเว็บเผยแพร่', 'หน้าเว็บเต็มรูปแบบสำหรับเผยแพร่ข้อมูลเพิ่มเติม (แยกจากส่วนแสดงผล iframe)', `<a class="btn btn-light" href="/" target="_blank">${icon('ext')} ดูหน้าเว็บไซต์</a><button class="btn btn-light !border-gold-500 !text-gold-600" id="tplP">${icon('sparkle')} สร้างจากแม่แบบ</button><button class="btn btn-primary" id="newP">${icon('plus')} สร้างหน้าเว็บ</button>`)}
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
          <button class="btn btn-light btn-sm" data-shp="${p.id}" title="นำไปใช้ / โค้ด iframe">${icon('code', 'w-3.5 h-3.5')}</button>
          <button class="btn btn-light btn-sm" data-renp="${p.id}" title="เปลี่ยนชื่อ">${icon('edit', 'w-3.5 h-3.5')}</button>
          <button class="btn btn-light btn-sm" data-cl="${esc(p.slug)}" title="คัดลอกลิงก์">${icon('link', 'w-3.5 h-3.5')}</button>
          <button class="btn btn-light btn-sm" data-dup="${p.id}" title="ทำสำเนา">${icon('copy', 'w-3.5 h-3.5')}</button>
          <button class="btn btn-danger btn-sm" data-del="${p.id}" title="ลบ">${icon('trash', 'w-3.5 h-3.5')}</button></div></td></tr>`).join('') || '<tr><td colspan="5" class="text-center py-12 text-slate-400">ยังไม่มีหน้าเว็บ</td></tr>'}</tbody></table></div></div>`;
  $$('[data-cl]').forEach(b => b.onclick = () => copyText(`${ORIGIN}/p/${b.dataset.cl}`));
  $$('[data-shp]').forEach(b => b.onclick = () => showPageShare(list.find(x => x.id === b.dataset.shp)));
  $$('[data-renp]').forEach(b => b.onclick = async () => {
    const it = list.find(x => x.id === b.dataset.renp);
    const r = await Swal.fire({ title: 'เปลี่ยนชื่อหน้าเว็บ', input: 'text', inputValue: it.title, showCancelButton: true, confirmButtonText: 'บันทึก', cancelButtonText: 'ยกเลิก', reverseButtons: true, inputValidator: v => !v.trim() && 'กรุณากรอกชื่อหน้า' });
    if (!r.isConfirmed) return; const full = await api('GET', `/pages/${it.id}`); full.title = r.value.trim().slice(0, 300); await api('PUT', `/pages/${it.id}`, full); ok('เปลี่ยนชื่อแล้ว'); viewPages();
  });
  $$('[data-dup]').forEach(b => b.onclick = async () => { const c = await api('POST', `/pages/${b.dataset.dup}/duplicate`); ok('ทำสำเนาแล้ว'); location.hash = `#/pages/${c.id}`; });
  $$('[data-del]').forEach(b => b.onclick = async () => {
    const p = list.find(x => x.id === b.dataset.del);
    if (!(await confirmBox('ลบหน้าเว็บ?', `"${p.title}" จะถูกลบถาวร`, 'ลบ'))) return;
    await api('DELETE', `/pages/${p.id}`); ok('ลบแล้ว'); viewPages();
  });
  $('#tplP').onclick = () => pickTemplate();
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
      <div class="min-w-0"><div class="text-xs text-slate-500">หน้าเว็บเผยแพร่</div><div class="flex items-center gap-1.5 min-w-0"><h1 class="text-xl font-bold text-slate-900 truncate" id="pTitle">${esc(p.title)}</h1><button class="p-1.5 rounded-lg text-slate-400 hover:text-navy-700 hover:bg-white" id="renP" title="เปลี่ยนชื่อหน้า">${icon('edit', 'w-4 h-4')}</button></div></div>
      <span id="dirtyDot" class="hidden text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">ยังไม่บันทึก</span>
    </div>
    <div class="flex flex-wrap gap-2">
      <button class="btn btn-light" id="shareP">${icon('code')} นำไปใช้ / iframe</button>
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
        <div class="text-sm font-semibold text-slate-700">ส่วนประกอบรอบเนื้อหา</div>
        <p class="text-xs text-slate-500 -mt-1">ปิดทั้งหมด = แสดงเฉพาะเนื้อหาที่วางไว้ (เหมาะกับนำไปใช้ในเว็บศาล)</p>
        ${[['header', 'แถบโลโก้และเมนูด้านบน'], ['title', 'หัวเรื่องหน้า + เส้นทาง (หน้าหลัก / …)'], ['footer', 'ส่วนท้ายเว็บ'], ['updated', 'วันที่ปรับปรุงล่าสุด']].map(([k, t]) => `<label class="flex items-center justify-between text-sm"><span>${t}</span><input type="checkbox" class="tgl" data-ch="${k}" ${p.chrome && p.chrome[k] ? 'checked' : ''}></label>`).join('')}
      </div>
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
      if (i.dataset.p === 'title') $('#pTitle').textContent = i.value || 'หน้าใหม่';
      markDirty();
    }));
    $$('[data-st]', S).forEach(b => b.onclick = () => { p.status = b.dataset.st; markDirty(); drawSettings(); });
    $$('[data-ch]', S).forEach(c => c.onchange = () => { p.chrome = { ...(p.chrome || {}), [c.dataset.ch]: c.checked }; markDirty(); });
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
      case 'video': return `<div class="flex gap-2"><input class="inp" data-b="src" value="${esc(b.src)}" placeholder="ลิงก์ YouTube / Facebook / TikTok / Vimeo / Google Drive / ไฟล์ mp4 หรือโค้ด <iframe>"><button class="btn btn-light btn-sm" data-pk="video">${icon('upload', 'w-3.5 h-3.5')} อัปโหลด</button></div><input class="inp text-sm mt-2" data-b="caption" value="${esc(b.caption)}" placeholder="คำบรรยาย (ไม่บังคับ)">`;
      case 'button': return `<div class="grid sm:grid-cols-2 gap-2"><input class="inp" data-b="label" value="${esc(b.label)}" placeholder="ข้อความบนปุ่ม"><input class="inp" data-b="link" value="${esc(b.link)}" placeholder="https://..."></div>
        <div class="flex flex-wrap items-center gap-2 mt-2">${b.btn ? `<div class="px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">${UB.buttonHtml({ title: b.label || 'ลิงก์', iconFa: b.iconFa, style: b.btn }, { tag: 'div', cls: 'auto' })}</div><button class="btn btn-light btn-sm" data-bdel title="กลับไปใช้แบบพื้นฐาน">${icon('x', 'w-3.5 h-3.5')}</button>` : `<div class="seg !w-auto">${[['primary', 'สีหลัก'], ['accent', 'สีทอง'], ['outline', 'เส้นขอบ']].map(([v, t]) => `<button data-bst="${v}" class="${b.style === v ? 'on' : ''} !px-2.5">${t}</button>`).join('')}</div>`}
          <button class="btn btn-primary btn-sm" data-bdesign>🎨 ออกแบบปุ่ม / ไอคอน</button>${alignSeg(b)}
        <label class="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" class="tgl" data-b="newTab" ${b.newTab ? 'checked' : ''}> แท็บใหม่</label></div>`;
      case 'widget': return `<select class="inp" data-b="widgetSlug"><option value="">— เลือกส่วนแสดงผล —</option>${widgets.map(w => `<option value="${esc(w.slug)}" ${b.widgetSlug === w.slug ? 'selected' : ''}>${esc(w.name)} (${LAYOUT_NAME[w.layout]})</option>`).join('')}</select>
        <label class="flex items-center gap-2 text-sm text-slate-600 mt-2"><input type="checkbox" class="tgl" data-b="full" ${b.full ? 'checked' : ''}> แสดงรายการทั้งหมด (ไม่จำกัดจำนวน — เหมาะกับหน้า “ดูทั้งหมด”)</label>`;
      case 'notice': return `<div class="seg mb-2">${[['info', 'ข้อมูล'], ['success', 'สำเร็จ'], ['warning', 'เตือน'], ['danger', 'สำคัญ']].map(([v, t]) => `<button data-tone="${v}" class="${b.tone === v ? 'on' : ''}">${t}</button>`).join('')}</div><input class="inp font-semibold" data-b="title" value="${esc(b.title)}" placeholder="หัวข้อประกาศ"><textarea class="inp mt-2" rows="3" data-b="content" placeholder="รายละเอียด">${esc(b.content)}</textarea>`;
      case 'file': return `<div class="flex gap-2"><input class="inp" data-b="src" value="${esc(b.src)}" placeholder="ลิงก์ไฟล์"><button class="btn btn-light btn-sm" data-pk="file">${icon('upload', 'w-3.5 h-3.5')} เลือกไฟล์</button></div>
        <div class="grid sm:grid-cols-2 gap-2 mt-2"><input class="inp" data-b="title" value="${esc(b.title)}" placeholder="ชื่อเอกสาร"><input class="inp" data-b="note" value="${esc(b.note)}" placeholder="รายละเอียด เช่น ประกาศ ณ วันที่..."></div>`;
      case 'html': return `<div class="flex justify-end mb-1.5"><button class="btn btn-gold btn-sm" data-bhtml>${icon('code', 'w-3.5 h-3.5')} เปิดตัวแก้ไขโค้ด + ตัวอย่าง</button></div><textarea class="inp font-mono text-xs" rows="6" data-b="html" placeholder="<div>...</div>">${esc(b.html)}</textarea><p class="text-xs text-amber-700 mt-1">⚠ ใช้โค้ดจากแหล่งที่เชื่อถือได้เท่านั้น</p>`;
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
      const bh = $('[data-bhtml]', card); if (bh) bh.onclick = () => editHtmlCode(b.html, h => { b.html = h; markDirty(); drawBlocks(); }, { page: true });
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
  $('#renP').onclick = async () => {
    const r = await Swal.fire({ title: 'เปลี่ยนชื่อหน้าเว็บ', input: 'text', inputValue: p.title, showCancelButton: true, confirmButtonText: 'บันทึก', cancelButtonText: 'ยกเลิก', reverseButtons: true, inputValidator: v => !v.trim() && 'กรุณากรอกชื่อหน้า' });
    if (!r.isConfirmed) return; p.title = r.value.trim().slice(0, 300); $('#pTitle').textContent = p.title; markDirty(); await save();
  };
  $('#shareP').onclick = async () => { if (state.dirty && (await confirmBox('ยังไม่ได้บันทึก', 'บันทึกก่อนนำไปใช้หรือไม่?', 'บันทึก', false))) await save(); showPageShare(p); };
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
  <div class="card p-4 mb-4 text-sm" id="itl"><span class="text-slate-400">กำลังโหลดตารางเวลา…</span></div>
  <div class="grid md:grid-cols-2 2xl:grid-cols-3 gap-4" id="il"></div>
  <p class="text-xs text-slate-500 mt-2">☆ ปักดาวรายการที่ใช้งานจริง ให้แสดงบนสุดและกันการเผลอลบ · ลากปุ่ม ⠿ เพื่อสลับตำแหน่ง</p>
  <p class="text-xs text-slate-500 mt-4">ลิงก์กลาง <span class="font-mono">/intro</span> (ใช้ฝังด้วย iframe ในเว็บไซต์ศาล) แสดงหน้า Intro ที่อยู่ในช่วงเวลาที่ตั้งไว้ก่อน ถ้าไม่มี จะแสดงหน้า Intro หลัก — สร้างหน้าสำหรับวาระพิเศษไว้ล่วงหน้า แล้วตั้งเวลาที่แท็บ “ตั้งเวลาแสดง” ในหน้าแก้ไข</p>`;
  api('GET', '/intros/active').then(d => {
    const lab = { live: ['bg-emerald-100 text-emerald-800', 'กำลังแสดง'], wait: ['bg-sky-100 text-sky-800', 'รอแสดง'], done: ['bg-slate-200 text-slate-600', 'หมดเวลา'] };
    const tl = d.timeline.filter(x => x.state !== 'done');
    $('#itl').innerHTML = `<div class="flex flex-wrap items-center gap-x-4 gap-y-1"><span class="font-semibold text-slate-800">${icon('eye', 'w-4 h-4 inline')} ขณะนี้ลิงก์ /intro แสดง: ${esc(d.name || '-')}</span><span class="text-xs text-slate-500">${d.by === 'schedule' ? 'ตามเวลาที่ตั้งไว้' : 'หน้า Intro หลัก'}${d.next ? ' · เปลี่ยนครั้งถัดไป ' + bkkText(d.next) : ''}</span></div>` +
      (tl.length ? `<div class="mt-2 flex flex-wrap gap-2">${tl.map(x => `<span class="text-xs px-2 py-1 rounded-lg ${lab[x.state][0]}">${lab[x.state][1]} · ${esc(x.name)} · ${x.start ? bkkText(x.start) : 'ไม่กำหนด'} – ${x.end ? bkkText(x.end) : 'ไม่กำหนด'}</span>`).join('')}</div>` : '<div class="text-xs text-slate-500 mt-1">ไม่มีหน้า Intro ที่รอแสดงตามเวลา</div>');
  }).catch(() => { $('#itl').remove(); });
  const drawI = () => { $('#il').innerHTML = `${list.map(it => `
    <div class="card overflow-hidden flex flex-col transition ${it.fav ? 'ring-2 ring-gold-400' : it.isMain ? 'ring-2 ring-navy-300' : ''}" data-card="${it.id}">
      <div class="aspect-video bg-slate-900 relative overflow-hidden">
        ${favButtons(it)}
        <iframe src="/intro/${esc(it.slug)}?preview=1" sandbox="allow-scripts allow-same-origin" class="absolute top-0 left-0 border-0 pointer-events-none origin-top-left" style="width:1440px;height:810px;transform:scale(var(--s,.3))" data-thumb loading="lazy" tabindex="-1"></iframe>
        <a href="#/intros/${it.id}" class="absolute inset-0"></a>
        <div class="absolute top-2 left-2 flex flex-col items-start gap-1 z-10">${it.isActive ? '<span class="text-xs px-2 py-1 rounded-full bg-emerald-600 text-white font-semibold shadow">● กำลังแสดงที่ /intro</span>' : ''}${it.isMain ? '<span class="text-xs px-2 py-1 rounded-full bg-navy-800 text-white font-semibold">หน้า Intro หลัก</span>' : ''}${it.schedState === 'wait' ? '<span class="text-[11px] px-2 py-0.5 rounded-full bg-sky-600 text-white font-semibold shadow">⏱ รอแสดง</span>' : it.schedState === 'done' ? '<span class="text-[11px] px-2 py-0.5 rounded-full bg-slate-500 text-white font-semibold shadow">หมดเวลา</span>' : ''}${it.fav ? '<span class="text-[11px] px-2 py-0.5 rounded-full bg-gold-500 text-white font-semibold shadow">★ รายการโปรด</span>' : ''}</div>
      </div>
      <div class="p-4 flex-1 flex flex-col">
        <a href="#/intros/${it.id}" class="font-semibold text-slate-900 hover:text-navy-700">${esc(it.name)}</a>
        <div class="text-xs text-slate-500 font-mono mt-1">/intro/${esc(it.slug)}</div>
        ${it.schedule && it.schedule.on ? `<div class="text-xs mt-2 px-2 py-1 rounded-lg bg-sky-50 text-sky-900 border border-sky-100">⏱ ${it.schedule.start ? bkkText(it.schedule.start) : 'ไม่กำหนด'} – ${it.schedule.end ? bkkText(it.schedule.end) : 'ไม่กำหนด'}${it.schedule.note ? ' · ' + esc(it.schedule.note) : ''}</div>` : ''}
        <div class="text-xs text-slate-500 mt-2">${it.buttons.length} ปุ่ม · แก้ไขล่าสุด ${fmtDate(it.updatedAt)}</div>
        <div class="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-slate-100">
          <a href="#/intros/${it.id}" class="btn btn-primary btn-sm flex-1">${icon('edit', 'w-3.5 h-3.5')} แก้ไข</a>
          <a href="/intro/${esc(it.slug)}" target="_blank" class="btn btn-light btn-sm" title="เปิดดู">${icon('ext', 'w-3.5 h-3.5')}</a>
          ${it.isMain ? '' : `<button class="btn btn-light btn-sm" data-main="${it.id}" title="ตั้งเป็นหน้า Intro หลัก (/intro)">★ ตั้งเป็นหลัก</button>`}
          <button class="btn btn-light btn-sm" data-reni="${it.id}" title="เปลี่ยนชื่อ">${icon('edit', 'w-3.5 h-3.5')}</button>
          <button class="btn btn-light btn-sm" data-dupi="${it.id}" title="ทำสำเนา">${icon('copy', 'w-3.5 h-3.5')}</button>
          ${it.fav ? `<button class="btn btn-light btn-sm opacity-40 cursor-not-allowed" data-locked title="รายการโปรด — ปลดดาวก่อนจึงลบได้">${icon('trash', 'w-3.5 h-3.5')}</button>` : `<button class="btn btn-danger btn-sm" data-deli="${it.id}" title="ลบ">${icon('trash', 'w-3.5 h-3.5')}</button>`}
        </div>
      </div>
    </div>`).join('') || '<div class="col-span-full card p-12 text-center text-slate-500">ยังไม่มีหน้า Intro</div>'}`;
  bindIntroCards(); };
  const bindIntroCards = () => {
  bindOrdering($('#il'), list, 'intros', drawI);
  $$('[data-locked]').forEach(b => b.onclick = () => toast('รายการนี้ปักดาวไว้ — กด ☆ ที่มุมภาพเพื่อปลดดาวก่อนจึงลบได้'));
  $$('[data-thumb]').forEach(f => { const w = f.parentElement.clientWidth; f.style.setProperty('--s', w / 1440); });
  $('#newI').onclick = async () => {
    const r = await Swal.fire({ title: 'สร้างหน้า Intro', showCancelButton: true, confirmButtonText: 'สร้าง', cancelButtonText: 'ยกเลิก', reverseButtons: true,
      html: `<div class="text-left space-y-3"><div><label class="lbl">ชื่อ (ภายใน)</label><input id="si-n" class="inp" placeholder="เช่น Intro วันแม่ 2569"></div><div><label class="lbl">Slug (ลิงก์ /intro/...)</label><input id="si-s" class="inp font-mono" placeholder="เช่น mothers-day"></div></div>`,
      preConfirm: () => { const name = $('#si-n').value.trim(), slug = $('#si-s').value.trim(); if (!name) return Swal.showValidationMessage('กรุณากรอกชื่อ'); if (slug && !/^[a-z0-9-_]+$/i.test(slug)) return Swal.showValidationMessage('slug ใช้ได้เฉพาะ a-z 0-9 - _'); return { name, slug, title: state.settings.siteName }; } });
    if (!r.isConfirmed) return;
    const it = await api('POST', '/intros', r.value); location.hash = `#/intros/${it.id}`;
  };
  $('#demoI').onclick = async () => { const it = await api('POST', '/intros/demo'); ok('เพิ่มตัวอย่างแล้ว'); location.hash = `#/intros/${it.id}`; };
  $$('[data-main]').forEach(b => b.onclick = async () => { await api('POST', `/intros/${b.dataset.main}/main`); await viewIntros(); introMainNotice(list.find(x => x.id === b.dataset.main)); });
  $$('[data-reni]').forEach(b => b.onclick = async () => {
    const it = list.find(x => x.id === b.dataset.reni);
    const r = await Swal.fire({ title: 'เปลี่ยนชื่อหน้า Intro', input: 'text', inputValue: it.name, showCancelButton: true, confirmButtonText: 'บันทึก', cancelButtonText: 'ยกเลิก', reverseButtons: true, inputValidator: v => !v.trim() && 'กรุณากรอกชื่อ' });
    if (!r.isConfirmed) return; const full = await api('GET', `/intros/${it.id}`); full.name = r.value.trim().slice(0, 200); await api('PUT', `/intros/${it.id}`, full); ok('เปลี่ยนชื่อแล้ว'); viewIntros();
  });
  $$('[data-dupi]').forEach(b => b.onclick = async () => { const c = await api('POST', `/intros/${b.dataset.dupi}/duplicate`); ok('ทำสำเนาแล้ว'); location.hash = `#/intros/${c.id}`; });
  $$('[data-deli]').forEach(b => b.onclick = async () => { const it = list.find(x => x.id === b.dataset.deli); if (!(await confirmBox('ลบหน้า Intro?', it.name, 'ลบ'))) return; await api('DELETE', `/intros/${it.id}`); ok('ลบแล้ว'); viewIntros(); });
  };
  drawI();
}

function introMainNotice(it) {
  const main = `${ORIGIN}/intro`;
  Swal.fire({ icon: 'success', title: 'ตั้งเป็นหน้า Intro หลักแล้ว', confirmButtonText: 'เข้าใจแล้ว', width: 560,
    html: `<div style="text-align:left;font-size:14px;line-height:1.6"><p><b>${esc(it ? it.name : '')}</b> จะแสดงที่ลิงก์ <code>${esc(main)}</code> ทันที</p>
      <p style="margin-top:8px">หน้าเว็บศาลจะเปลี่ยนตามทันที <b>เฉพาะเมื่อ</b> ใช้ลิงก์หรือโค้ดฝังของ “หน้า Intro หลัก” (<code>/intro</code>) — ถ้าใช้ไฟล์ index.html ที่ดาวน์โหลดไว้ หรือลิงก์ที่มีชื่อเฉพาะ (<code>/intro/ชื่อ</code>) จะยังเป็นหน้าเดิม</p>
      <p style="margin-top:8px;color:#64748b">ดูโค้ดได้ที่ปุ่ม “นำไปใช้ / ส่งออก” → หัวข้อ “สลับหน้า Intro ได้ทันที”</p></div>` });
}
function showIntroShare(it) {
  const url = `${ORIGIN}/intro/${it.slug}`, main = `${ORIGIN}/intro`;
  const lis = `<script>addEventListener('message',function(e){if(e.origin==='${ORIGIN}'&&e.data&&e.data.type==='uw-intro-go'&&/^https?:\\/\\//.test(e.data.url))location.href=e.data.url;});</script>`;
  const ifrMain = `<iframe src="${main}" title="${esc(it.title || 'หน้าแรก')}" style="position:fixed;inset:0;width:100%;height:100%;border:0;z-index:9999"></iframe>\n${lis}`;
  const docMain = `<!DOCTYPE html>\n<html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(it.title || 'หน้าแรก')}</title><style>html,body{margin:0;height:100%;overflow:hidden;background:#0f172a}</style></head>\n<body>\n${ifrMain}\n</body></html>`;
  const ifr = `<iframe src="${url}" title="${it.title || it.name}" style="position:fixed;inset:0;width:100%;height:100%;border:0;z-index:9999"></iframe>
<script>addEventListener('message',function(e){if(e.origin==='${ORIGIN}'&&e.data&&e.data.type==='uw-intro-go'&&/^https?:\\/\\//.test(e.data.url))location.href=e.data.url;});</script>`;
  const box = (label, val, hint) => `<div><div class="flex items-center justify-between mb-1.5"><label class="lbl !mb-0">${label}</label><button class="btn btn-light btn-sm" data-cp="${esc(val)}">${icon('copy', 'w-3.5 h-3.5')} คัดลอก</button></div>
    <textarea readonly class="inp font-mono text-xs !bg-slate-50" rows="${val.length > 90 ? 3 : 1}">${esc(val)}</textarea>${hint ? `<p class="text-xs text-slate-500 mt-1">${hint}</p>` : ''}</div>`;
  openModal({
    title: `นำหน้า Intro ไปใช้ — ${esc(it.name)}`, size: 'max-w-2xl',
    body: `<div class="space-y-5">
      <div class="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
        <div class="font-semibold text-emerald-900">ดาวน์โหลดหน้านี้เป็นไฟล์ HTML (ฝังภาพไว้ในไฟล์ — หน้าคงที่)</div>
        <p class="text-sm text-emerald-900/80 mt-1">ได้ไฟล์ <span class="font-mono">index.html</span> ไฟล์เดียว นำไปวางเป็นหน้า Intro ของเว็บศาลได้ทันที ไม่เรียกเครื่องแม่ข่ายภายใน จึงไม่ขึ้นหน้าต่างขอสิทธิ์ และบุคคลภายนอกเห็นภาพครบ</p>
        <button class="btn btn-primary mt-3" data-dl>${icon('down')} ดาวน์โหลด index.html</button><div data-warn class="mt-3 space-y-1.5"></div>
      </div>
      <div class="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
        <div class="font-semibold text-amber-900">★ สลับหน้า Intro ได้ทันที (ตามที่ “ตั้งเป็นหน้าหลัก”)</div>
        <p class="text-sm text-amber-900/80">วางโค้ดนี้ในเว็บศาล <b>ครั้งเดียว</b> — ต่อจากนี้กด “ตั้งเป็นหน้าหลัก” ที่หน้า Intro ใดในระบบ หน้าเว็บศาลจะเปลี่ยนตามทันทีโดยไม่ต้องแก้เว็บศาลอีก (ต้องเปิดเครื่องแม่ข่ายให้ภายนอกเข้าถึงได้ เช่น Vercel)</p>
        <button class="btn btn-gold btn-sm" data-dlmain>${icon('down')} ดาวน์โหลด index.html แบบสลับอัตโนมัติ</button>
        ${box('หรือโค้ดฝังเต็มหน้าจอ (วางในหน้าแรกของเว็บศาล)', ifrMain)}
      </div>
      ${box('ลิงก์หน้า Intro นี้', url)}
      ${box('ลิงก์หน้า Intro หลัก (เปลี่ยนตามที่ตั้งเป็นหลัก)', main, 'ใช้ลิงก์นี้ถ้าต้องการสลับหน้า Intro ตามวาระโดยไม่ต้องแก้เว็บศาล (ต้องเปิดเครื่องแม่ข่ายให้ภายนอกเข้าถึงได้)')}
      ${box('โค้ดฝังแบบเต็มหน้าจอ (iframe)', ifr, 'วางในหน้าเปล่าของระบบจัดการเว็บ (คัดลอกทั้ง 2 บรรทัด — บรรทัด script ช่วยให้เปลี่ยนหน้าทั้งหน้าต่างเมื่อกดลิงก์/เข้าเว็บอัตโนมัติ) — ถ้าเครื่องแม่ข่ายเป็น IP ภายใน ผู้ใช้ภายนอกจะมองไม่เห็นและ Chrome จะถามสิทธิ์เครือข่ายภายใน')}
    </div>`,
    onMount: el => {
      $$('[data-cp]', el).forEach(b => b.onclick = () => copyText(b.dataset.cp));
      $('[data-dlmain]', el).onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([docMain], { type: 'text/html' })); a.download = 'index.html'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); ok('ดาวน์โหลดแล้ว'); };
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
      <div class="min-w-0"><div class="text-xs text-slate-500">หน้า Intro</div><div class="flex items-center gap-1.5 min-w-0"><h1 class="text-xl font-bold text-slate-900 truncate" id="iTitle">${esc(it.name)}</h1><button class="p-1.5 rounded-lg text-slate-400 hover:text-navy-700 hover:bg-white" id="renI" title="เปลี่ยนชื่อ">${icon('edit', 'w-4 h-4')}</button></div></div>
      <span id="mainBadge"></span>
      <span id="dirtyDot" class="hidden text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">ยังไม่บันทึก</span>
    </div>
    <div class="flex flex-wrap gap-2">
      <button class="btn btn-light hidden" id="setMainBtn" title="ให้ลิงก์ /intro แสดงหน้านี้ทันที">★ ตั้งเป็นหน้าหลัก</button>
      <button class="btn btn-light" id="shareBtn">${icon('code')} นำไปใช้ / ส่งออก</button>
      <a class="btn btn-light" id="openBtn" href="/intro/${esc(it.slug)}" target="_blank">${icon('ext')} เปิดดู</a>
      <button class="btn btn-primary" id="saveBtn">${icon('save')} บันทึก</button>
    </div>
  </div>
  <div class="grid xl:grid-cols-[440px_1fr] gap-5 items-start">
    <div class="card overflow-hidden">
      <div class="flex border-b border-slate-200 bg-slate-50/60 overflow-x-auto" id="itabs">${[['buttons', 'ปุ่ม'], ['bg', 'ภาพพื้นหลัง'], ['bar', 'แถบปุ่ม'], ['anim', 'แอนิเมชัน'], ['sched', 'ตั้งเวลาแสดง'], ['general', 'ทั่วไป']].map(([k, t]) => `<button data-t="${k}" class="flex-1 px-3 py-3 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap">${t}</button>`).join('')}</div>
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
  const refreshMain = async () => {
    const lst = await api('GET', '/intros'), me = lst.find(x => x.id === it.id), isMain = !!(me && me.isMain);
    $('#mainBadge').innerHTML = isMain ? '<span class="text-xs px-2 py-0.5 rounded-full bg-gold-500 text-white font-semibold whitespace-nowrap">★ หน้า Intro หลัก</span>' : '';
    $('#setMainBtn').classList.toggle('hidden', isMain);
  };
  refreshMain();
  $('#setMainBtn').onclick = async () => {
    if (state.dirty && (await confirmBox('ยังไม่ได้บันทึก', 'บันทึกการแก้ไขก่อนตั้งเป็นหน้าหลักหรือไม่?', 'บันทึก', false))) await $('#saveBtn').onclick();
    await api('POST', `/intros/${it.id}/main`); await refreshMain(); introMainNotice(it);
  };
  $('#renI').onclick = async () => {
    const r = await Swal.fire({ title: 'เปลี่ยนชื่อหน้า Intro', input: 'text', inputValue: it.name, showCancelButton: true, confirmButtonText: 'ตกลง', cancelButtonText: 'ยกเลิก', reverseButtons: true, inputValidator: v => !v.trim() && 'กรุณากรอกชื่อ' });
    if (!r.isConfirmed) return; it.name = r.value.trim().slice(0, 200); $('#iTitle').textContent = it.name; markDirty(); await $('#saveBtn').onclick();
  };
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
      if (i.dataset.p === 'name') $('#iTitle').textContent = v || 'หน้า Intro';
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
    if (tab === 'sched') { drawSched(P); return; }
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

  /* ตั้งเวลาแสดงผล: เก็บเป็น ISO (UTC) แสดงผลเป็นเวลาประเทศไทย */
  function drawSched(P) {
    it.schedule = it.schedule || { on: false, start: '', end: '', note: '' };
    const sc = it.schedule;
    const day = (d, h, m) => { const x = new Date(Date.now() + 7 * 3600e3); x.setUTCDate(x.getUTCDate() + d); return x.toISOString().slice(0, 10) + `T${h}:${m}`; };
    P.innerHTML = `<div class="space-y-4">
      <div class="p-3 rounded-xl bg-navy-50 border border-navy-100 text-xs text-slate-700 leading-relaxed">ลิงก์กลาง <span class="font-mono font-semibold">/intro</span> จะแสดงหน้านี้แทนหน้า Intro หลักโดยอัตโนมัติเมื่อถึงช่วงเวลาที่กำหนด และกลับไปแสดงหน้า Intro หลักเมื่อหมดเวลา · เวลาเป็นเวลาประเทศไทย · ถ้ามีหลายหน้าซ้อนช่วงเวลากัน ระบบเลือกหน้าที่เริ่มแสดงล่าสุด</div>
      ${tg('schedule.on', 'เปิดการตั้งเวลาแสดงผล', true)}
      <div class="grid sm:grid-cols-2 gap-3 ${sc.on ? '' : 'opacity-50 pointer-events-none'}">
        <div><label class="lbl">เริ่มแสดง</label><input type="datetime-local" class="inp" data-sch="start" value="${bkkLocal(sc.start)}"></div>
        <div><label class="lbl">สิ้นสุด</label><input type="datetime-local" class="inp" data-sch="end" value="${bkkLocal(sc.end)}"></div>
      </div>
      <div class="flex flex-wrap gap-1.5 ${sc.on ? '' : 'opacity-50 pointer-events-none'}">
        <button class="btn btn-light btn-sm" data-qs="${day(0, '00', '00')}|${day(1, '00', '00')}">วันนี้ทั้งวัน</button>
        <button class="btn btn-light btn-sm" data-qs="${day(1, '00', '00')}|${day(2, '00', '00')}">พรุ่งนี้ทั้งวัน</button>
        <button class="btn btn-light btn-sm" data-qs="${day(0, '00', '00')}|${day(7, '00', '00')}">๗ วันนับจากวันนี้</button>
        <button class="btn btn-light btn-sm" data-qs="|">ล้างเวลา</button>
      </div>
      ${txt('schedule.note', 'หมายเหตุ (เช่น วาระ/โอกาส)', 'เช่น วันพ่อแห่งชาติ')}
      <div id="schState" class="text-sm"></div>
      ${H('ตารางเวลาแสดงผลที่ลิงก์ /intro')}
      <div id="schTl" class="text-sm text-slate-500">กำลังโหลด…</div>
      <p class="text-xs text-slate-500">ช่วงเวลาที่ตั้งจะมีผลเมื่อกดบันทึก · หน้าเว็บที่เปิดค้างไว้จะโหลดหน้าใหม่เองเมื่อถึงเวลาเปลี่ยน · ใช้ได้กับลิงก์ /intro (iframe กลาง) เท่านั้น โค้ด HTML ที่ส่งออกไม่เปลี่ยนตามเวลา</p>
    </div>`;
    bind(P);
    const st = () => { const t = Date.now(), s0 = Date.parse(sc.start), e0 = Date.parse(sc.end); let h;
      if (!sc.on) h = '<span class="text-slate-500">ไม่ได้ตั้งเวลา — แสดงเมื่อเป็นหน้า Intro หลัก หรือเปิดด้วยลิงก์ /intro/' + esc(it.slug) + '</span>';
      else if (!sc.start && !sc.end) h = '<span class="text-amber-700">กรุณากำหนดเวลาเริ่มหรือสิ้นสุดอย่างน้อยหนึ่งค่า</span>';
      else if (sc.start && sc.end && e0 <= s0) h = '<span class="text-red-600">เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม</span>';
      else if (s0 && t < s0) h = `<span class="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-semibold">รอแสดง</span> เริ่ม ${bkkText(sc.start)}`;
      else if (e0 && t >= e0) h = `<span class="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">หมดเวลาแล้ว</span> เมื่อ ${bkkText(sc.end)}`;
      else h = `<span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">อยู่ในช่วงเวลาแสดง</span>${sc.end ? ' ถึง ' + bkkText(sc.end) : ''}`;
      $('#schState', P).innerHTML = h; };
    st();
    $$('[data-sch]', P).forEach(i => i.addEventListener('change', () => { sc[i.dataset.sch] = bkkIso(i.value); markDirty(); st(); }));
    $$('[data-qs]', P).forEach(b => b.onclick = () => { const [a, z] = b.dataset.qs.split('|'); sc.start = bkkIso(a); sc.end = bkkIso(z); markDirty(); draw(); });
    api('GET', '/intros/active').then(d => { const el = $('#schTl', P); if (!el) return;
      const lab = { live: ['bg-emerald-100 text-emerald-800', 'กำลังแสดง'], wait: ['bg-sky-100 text-sky-800', 'รอแสดง'], done: ['bg-slate-200 text-slate-600', 'หมดเวลา'] };
      el.innerHTML = `<div class="mb-2">ขณะนี้ /intro แสดง: <b class="text-slate-800">${esc(d.name || '-')}</b> ${d.by === 'schedule' ? '(ตามเวลาที่ตั้ง)' : '(หน้า Intro หลัก)'}${d.next ? ` · เปลี่ยนครั้งถัดไป ${bkkText(d.next)}` : ''}</div>` +
        (d.timeline.length ? `<div class="divide-y divide-slate-100 border border-slate-200 rounded-lg">${d.timeline.map(x => `<div class="px-3 py-2 flex flex-wrap items-center gap-2"><span class="text-[11px] px-2 py-0.5 rounded-full font-semibold ${lab[x.state][0]}">${lab[x.state][1]}</span><span class="font-medium text-slate-800">${esc(x.name)}</span><span class="text-xs text-slate-500">${x.start ? bkkText(x.start) : 'ไม่กำหนด'} – ${x.end ? bkkText(x.end) : 'ไม่กำหนด'}</span></div>`).join('')}</div>` : '<div class="text-xs">ยังไม่มีหน้า Intro ที่ตั้งเวลาไว้ (ที่บันทึกแล้ว)</div>'); }).catch(() => {});
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
const HEAVY_IMG = 400 * 1024;
/** ภาพที่ควรลดขนาด: ใหญ่เกิน 400KB หรือยังไม่มีภาพย่อ (ไม่รวม SVG / GIF) */
function optCandidates(list) { return list.filter(x => x.kind === 'image' && !x.optimized && !x.sm && !/\.(svg|gif)(\?|$)/i.test(x.url) && x.size > 120 * 1024); }
async function optimizeMedia(items) {
  if (!items.length) return false;
  const total = items.reduce((a, x) => a + (x.size || 0), 0);
  const c = await Swal.fire({ icon: 'question', title: `ลดขนาดภาพ ${items.length} ไฟล์?`, confirmButtonText: 'เริ่มลดขนาด', cancelButtonText: 'ยกเลิก', showCancelButton: true, reverseButtons: true,
    html: `<div style="text-align:left;font-size:14px;line-height:1.7">ขนาดรวมตอนนี้ <b>${fmtSize(total)}</b><br>• ย่อด้านยาวไม่เกิน 1920px และแปลงเป็น WebP (คุณภาพใกล้เคียงเดิม)<br>• สร้างภาพย่อ 800px สำหรับมือถือ/การ์ดเล็ก<br>• เปลี่ยนลิงก์ภาพทุกจุดที่ใช้งาน (ส่วนแสดงผล หน้าเว็บ Intro) ให้อัตโนมัติ แล้วลบไฟล์เดิม<br><span style="color:#b45309">ภาพที่ฝังไว้ด้วยโค้ดส่งออก HTML ในเว็บอื่นก่อนหน้านี้ ต้องคัดลอกโค้ดใหม่ ส่วน iframe เปลี่ยนตามเอง</span></div>` });
  if (!c.isConfirmed) return false;
  let done = 0, saved = 0, failN = 0;
  Swal.fire({ title: 'กำลังลดขนาดภาพ…', html: '<div id="opst" class="text-sm text-slate-600"></div><div class="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden"><div id="opbar" class="h-full bg-navy-700 transition-all" style="width:0%"></div></div>', allowOutsideClick: false, showConfirmButton: false });
  for (const it of items) {
    const st = document.getElementById('opst'); if (st) st.textContent = `${done + 1}/${items.length}: ${it.name}`;
    try {
      let blob;
      try { const r = await fetch(it.url, { mode: 'cors', cache: 'no-store' }); if (!r.ok) throw 0; blob = await r.blob(); } catch { const r = await fetch(`/api/media/${it.id}/raw`); if (!r.ok) throw new Error('อ่านไฟล์เดิมไม่ได้'); blob = await r.blob(); }
      const file = new File([blob], it.name, { type: blob.type || 'image/jpeg' });
      const before = it.size || blob.size;
      const res = await uploadFile(file, null, { 'X-Replace-Of': it.id });
      saved += Math.max(0, before - (res.size || before));
    } catch (e) { failN++; console.warn('ลดขนาดไม่สำเร็จ', it.name, e); }
    done++; const b = document.getElementById('opbar'); if (b) b.style.width = (done / items.length * 100) + '%';
  }
  Swal.fire({ icon: failN ? 'warning' : 'success', title: 'ลดขนาดภาพเสร็จแล้ว', confirmButtonText: 'ตกลง', html: `ประหยัดได้ <b>${fmtSize(saved)}</b> จาก ${fmtSize(total)}${failN ? `<br><span style="color:#b91c1c">ไม่สำเร็จ ${failN} ไฟล์ (ลองใหม่ได้)</span>` : ''}` });
  return true;
}
async function viewMedia() {
  let list = await api('GET', '/media');
  let filter = 'all';
  const sel = new Set();
  $('#view').innerHTML = `${pageHead('คลังสื่อ', 'ภาพ วีดีโอ และไฟล์เอกสารที่อัปโหลดไว้ (สูงสุด 200MB ต่อไฟล์)', `<label class="btn btn-primary cursor-pointer">${icon('upload')} อัปโหลดไฟล์<input type="file" multiple class="hidden" id="mUp"></label>`)}
  <div id="drop" class="card p-6 mb-4 border-2 border-dashed border-slate-300 text-center text-slate-500 text-sm">ลากไฟล์มาวางที่นี่เพื่ออัปโหลด</div>
  <div class="flex flex-wrap items-center gap-3 mb-3"><div class="seg !w-auto flex-wrap" id="mf">${[['all', 'ทั้งหมด'], ['image', 'ภาพ'], ['video', 'วีดีโอ'], ['file', 'เอกสาร'], ['unused', 'ไม่ได้ใช้']].map(([k, t]) => `<button data-mf="${k}" class="!px-4 whitespace-nowrap">${t}</button>`).join('')}</div>
  <div class="card flex-1 min-w-[200px] px-3 py-2 flex items-center gap-2">${icon('search', 'w-4 h-4 text-slate-400')}<input id="mq" class="flex-1 outline-none text-sm" placeholder="ค้นหาชื่อไฟล์..."></div></div>
  <div id="mbar" class="card px-3 py-2 mb-4 flex flex-wrap items-center gap-2 text-sm"></div>
  <div id="mg" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3"></div>`;
  const shown = () => {
    const q = ($('#mq').value || '').toLowerCase();
    return list.filter(x => (filter === 'all' || (filter === 'unused' ? !x.usedIn.length : x.kind === filter)) && x.name.toLowerCase().includes(q));
  };
  const usedNote = arr => arr.length ? `\n\nไฟล์ที่กำลังถูกใช้งาน ${arr.length} ไฟล์ จะทำให้ภาพในจุดนั้นหายไป:\n` + arr.slice(0, 6).map(x => `• ${x.name} → ${x.usedIn.slice(0, 2).join(', ')}${x.usedIn.length > 2 ? ' ...' : ''}`).join('\n') + (arr.length > 6 ? '\n...' : '') : '';
  async function removeMany(items) {
    if (!items.length) return;
    const used = items.filter(x => x.usedIn.length);
    const r = await Swal.fire({ icon: 'warning', title: items.length === 1 ? 'ลบไฟล์นี้?' : `ลบ ${items.length} ไฟล์?`,
      html: `<div class="text-left text-sm whitespace-pre-line">${esc((items.length === 1 ? `"${items[0].name}"` : items.slice(0, 5).map(x => '• ' + x.name).join('\n') + (items.length > 5 ? `\nและอีก ${items.length - 5} ไฟล์` : '')) + '\n\nไฟล์จะถูกลบถาวร กู้คืนไม่ได้' + usedNote(used))}</div>`,
      showCancelButton: true, confirmButtonText: used.length ? 'ลบทั้งที่ยังใช้งานอยู่' : 'ลบถาวร', cancelButtonText: 'ยกเลิก', confirmButtonColor: '#e11d48', reverseButtons: true, focusCancel: true });
    if (!r.isConfirmed) return;
    try {
      if (items.length === 1) await api('DELETE', `/media/${items[0].id}`);
      else await api('POST', '/media/bulk-delete', { ids: items.map(x => x.id) });
      const ids = new Set(items.map(x => x.id));
      list = list.filter(m => !ids.has(m.id)); ids.forEach(i => sel.delete(i));
      ok(`ลบแล้ว ${items.length} ไฟล์`); draw();
    } catch (e) { fail(e.message); }
  }
  const draw = () => {
    $$('[data-mf]').forEach(b => b.classList.toggle('on', b.dataset.mf === filter));
    const f = shown();
    [...sel].forEach(id => { if (!list.some(x => x.id === id)) sel.delete(id); });
    const allOn = f.length && f.every(x => sel.has(x.id));
    const totalSize = list.reduce((a, x) => a + (x.size || 0), 0);
    $('#mbar').innerHTML = `<label class="flex items-center gap-2 cursor-pointer select-none"><input type="checkbox" id="mAll" class="w-4 h-4 accent-navy-800" ${allOn ? 'checked' : ''} ${f.length ? '' : 'disabled'}> เลือกทั้งหมดที่แสดง (${f.length})</label>
      <span class="text-slate-400">·</span><span class="text-slate-500">ทั้งหมด ${list.length} ไฟล์ · ${fmtSize(totalSize)}${list.some(x => !x.usedIn.length) ? ` · ไม่ได้ใช้งาน ${list.filter(x => !x.usedIn.length).length} ไฟล์` : ''}</span>
      ${(() => { const h = optCandidates(list); return h.length ? `<button class="btn btn-gold btn-sm" id="mOpt" title="ย่อภาพที่ใหญ่เกินเป็น WebP ≤1920px + สร้างภาพย่อสำหรับมือถือ แล้วเปลี่ยนทุกจุดที่ใช้ภาพนั้นให้อัตโนมัติ">⚡ ลดขนาดภาพ ${h.length} ไฟล์ (${fmtSize(h.reduce((a, x) => a + (x.size || 0), 0))})</button>` : list.some(x => x.kind === 'image') ? '<span class="text-xs text-emerald-700">✓ ภาพทั้งหมดขนาดเหมาะสมแล้ว</span>' : ''; })()}
      <span class="ml-auto flex items-center gap-2">${sel.size ? `<span class="font-semibold text-navy-800">เลือกแล้ว ${sel.size} ไฟล์</span><button class="btn btn-light btn-sm" id="mClear">ยกเลิกเลือก</button>
        <button class="btn btn-sm !bg-rose-600 !text-white hover:!bg-rose-700" id="mDel">${icon('trash', 'w-3.5 h-3.5')} ลบที่เลือก</button>` : '<span class="text-xs text-slate-400">ติ๊กช่องที่มุมภาพเพื่อเลือกหลายไฟล์</span>'}</span>`;
    $('#mg').innerHTML = f.map(x => `<div class="card overflow-hidden group relative ${sel.has(x.id) ? 'ring-2 ring-navy-600' : ''}">
      <label class="absolute top-2 left-2 z-10 w-7 h-7 rounded-md bg-white/95 shadow grid place-items-center cursor-pointer" title="เลือก"><input type="checkbox" class="w-4 h-4 accent-navy-800" data-ms="${x.id}" ${sel.has(x.id) ? 'checked' : ''}></label>
      ${x.usedIn.length ? `<span class="absolute top-2 right-2 z-10 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-600 text-white" title="${esc(x.usedIn.join('\n'))}">ใช้อยู่ ${x.usedIn.length}</span>` : `<span class="absolute top-2 right-2 z-10 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-500/80 text-white">ไม่ได้ใช้</span>`}
      <div class="aspect-square chk-pattern grid place-items-center relative overflow-hidden cursor-pointer" data-mt="${x.id}">${x.kind === 'image' ? `<img src="${esc(x.url)}" class="w-full h-full object-cover" loading="lazy">` : x.kind === 'video' ? `<video src="${esc(x.url)}#t=0.5" class="w-full h-full object-cover" preload="metadata" muted></video>` : isPdfUrl(x.url) ? `<div class="absolute inset-0 bg-white" data-pdfthumb="${esc(x.url)}" data-pages><div class="h-full grid place-items-center text-xs text-slate-400">PDF</div></div>` : `<div class="text-center">${icon('file', 'w-10 h-10 text-slate-400 mx-auto')}<div class="text-xs font-bold text-slate-500 mt-1">${esc(x.url.split('.').pop().toUpperCase())}</div></div>`}</div>
      <div class="p-2.5"><div class="text-xs font-medium truncate" title="${esc(x.name)}">${esc(x.name)}</div><div class="text-[11px] ${x.kind === 'image' && x.size > HEAVY_IMG ? 'text-rose-600 font-semibold' : 'text-slate-400'}">${fmtSize(x.size)}${x.kind === 'image' && x.size > HEAVY_IMG ? ' ⚠ ใหญ่' : ''}${x.sm ? ' · <span class="text-emerald-600" title="มีภาพย่อ 800px สำหรับมือถือ">✓ ย่อแล้ว</span>' : ''} · ${new Date(x.createdAt).toLocaleDateString('th-TH')}</div>
        <div class="flex items-center gap-1 mt-2">
          <button class="flex-1 btn btn-light btn-sm !px-1.5" data-cu="${esc(x.url)}" title="คัดลอกลิงก์">${icon('link', 'w-3.5 h-3.5')}</button>
          <a class="flex-1 btn btn-light btn-sm !px-1.5" href="${esc(x.url)}" target="_blank" title="เปิดดู">${icon('ext', 'w-3.5 h-3.5')}</a>
          <button class="flex-1 btn btn-light btn-sm !px-1.5 !text-rose-600 hover:!bg-rose-50 hover:!border-rose-300" data-md="${x.id}" title="ลบไฟล์">${icon('trash', 'w-3.5 h-3.5')}</button></div></div></div>`).join('')
      || `<div class="col-span-full text-center py-12 text-slate-400">${filter === 'unused' ? 'ไม่มีไฟล์ที่ไม่ได้ใช้งาน' : 'ไม่มีไฟล์'}</div>`;
    fillPdfThumbs($('#mg'));
    $$('[data-cu]').forEach(b => b.onclick = () => copyText(/^https?:/i.test(b.dataset.cu) ? b.dataset.cu : ORIGIN + b.dataset.cu));
    $$('[data-md]').forEach(b => b.onclick = () => removeMany([list.find(m => m.id === b.dataset.md)]));
    $$('[data-ms]').forEach(c => c.onchange = () => { c.checked ? sel.add(c.dataset.ms) : sel.delete(c.dataset.ms); draw(); });
    $$('[data-mt]').forEach(t => t.onclick = () => { const id = t.dataset.mt; sel.has(id) ? sel.delete(id) : sel.add(id); draw(); });
    const all = $('#mAll'); if (all) all.onchange = () => { f.forEach(x => all.checked ? sel.add(x.id) : sel.delete(x.id)); draw(); };
    const cl = $('#mClear'); if (cl) cl.onclick = () => { sel.clear(); draw(); };
    const dl = $('#mDel'); if (dl) dl.onclick = () => removeMany(list.filter(x => sel.has(x.id)));
    const mo = $('#mOpt'); if (mo) mo.onclick = async () => { const items = sel.size ? optCandidates(list.filter(x => sel.has(x.id))) : optCandidates(list); if (await optimizeMedia(items.length ? items : optCandidates(list))) { list = await api('GET', '/media'); draw(); } };
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
      <div class="card p-5"><h3 class="font-semibold mb-1">สำรอง / กู้คืนข้อมูล</h3><p class="text-sm text-slate-500 mb-4">${state.server && state.server.db === 'neon' ? 'ข้อมูลอยู่ในฐานข้อมูล Neon และไฟล์สื่ออยู่ใน Vercel Blob' : 'ไฟล์ข้อมูลอยู่ที่ <code class="text-xs bg-slate-100 px-1 rounded">data/db.json</code> และไฟล์สื่ออยู่ในโฟลเดอร์ <code class="text-xs bg-slate-100 px-1 rounded">uploads/</code>'}</p>
        <a href="/api/backup" class="btn btn-light w-full mb-2">${icon('down')} ดาวน์โหลดไฟล์สำรอง (.json)</a>
        <label class="btn btn-light w-full cursor-pointer">${icon('upload')} กู้คืนจากไฟล์สำรอง<input type="file" accept=".json" class="hidden" id="rest"></label></div>
      <div class="card p-5" id="abCard"><h3 class="font-semibold mb-1">สำรองข้อมูลอัตโนมัติ</h3><p class="text-sm text-slate-400">กำลังโหลด…</p></div>
    </div>
  </div>`;
  $$('[data-s]').forEach(i => i.addEventListener('input', () => { s[i.dataset.s] = i.value; const m = $(`[data-sm="${i.dataset.s}"]`); if (m) m.value = i.value; }));
  $$('[data-sm]').forEach(i => i.addEventListener('input', () => { if (/^#[0-9a-f]{6}$/i.test(i.value)) { s[i.dataset.sm] = i.value; $(`[data-s="${i.dataset.sm}"]`).value = i.value; } }));
  $('#pickLogo').onclick = async () => { const u = await pickMedia('image'); if (u) { s.logo = u; $('#lg').src = u; } };
  $('#saveS').onclick = async () => { try { state.settings = await api('PUT', '/settings', s); ORIGIN = resolveOrigin(); ok('บันทึกแล้ว'); renderShell(); highlightNav('#/settings'); viewSettings(); } catch (e) { fail(e.message); } };
  renderAutoBackup();
  $('#rest').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    if (!(await confirmBox('กู้คืนข้อมูล?', 'ข้อมูลปัจจุบันทั้งหมดจะถูกแทนที่ด้วยไฟล์สำรอง (ระบบจะเก็บสำเนาข้อมูลเดิมไว้ในโฟลเดอร์ data/)', 'กู้คืน'))) return;
    try { const r = await fetch('/api/restore', { method: 'POST', body: await f.text(), headers: { 'Content-Type': 'application/json' } }); const d = await r.json(); if (!r.ok) throw new Error(d.error); await Swal.fire({ icon: 'success', title: 'กู้คืนสำเร็จ', confirmButtonText: 'ตกลง' }); location.reload(); } catch (err) { fail(err.message); }
  };
}

/** การ์ดสำรองข้อมูลอัตโนมัติ (ทุกวัน 00:00 น. เขียนทับชุดเดิม) */
async function renderAutoBackup() {
  const el = $('#abCard'); if (!el) return;
  if (state.user.role !== 'admin') { el.innerHTML = '<h3 class="font-semibold mb-1">สำรองข้อมูลอัตโนมัติ</h3><p class="text-sm text-slate-500">เฉพาะผู้ดูแลระบบ</p>'; return; }
  let d; try { d = await api('GET', '/auto-backup'); } catch (e) { el.innerHTML = `<h3 class="font-semibold mb-1">สำรองข้อมูลอัตโนมัติ</h3><p class="text-sm text-red-600">${esc(e.message)}</p>`; return; }
  const when = t => new Date(t).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'medium', timeStyle: 'short' }) + ' น.';
  const kb = n => n >= 1048576 ? (n / 1048576).toFixed(2) + ' MB' : (n / 1024).toFixed(1) + ' KB';
  const by = { schedule: 'ตามเวลา', cron: 'ตามเวลา (Vercel Cron)', manual: 'กดสำรองเอง', 'catch-up': 'สำรองย้อนหลังเมื่อเปิดเครื่อง' };
  const failHtml = d.lastAttempt && !d.lastAttempt.ok ? `<div class="mt-2 p-2 rounded-lg bg-red-50 text-red-700 text-xs">ครั้งล่าสุดไม่สำเร็จ (${when(d.lastAttempt.at)}): ${esc(d.lastAttempt.error)}</div>` : '';
  const warn = d.onVercel && !d.cronSecret ? `<div class="mt-2 p-2 rounded-lg bg-amber-50 text-amber-800 text-xs">แนะนำให้ตั้งค่าตัวแปร <b>CRON_SECRET</b> ใน Vercel → Settings → Environment Variables เพื่อป้องกันผู้อื่นเรียกคำสั่งสำรองข้อมูล</div>` : '';
  el.innerHTML = `<div class="flex items-start justify-between gap-3 mb-1"><h3 class="font-semibold">สำรองข้อมูลอัตโนมัติ</h3>
      <label class="inline-flex items-center gap-2 text-sm cursor-pointer select-none"><input type="checkbox" id="abOn" class="w-4 h-4 accent-navy-600" ${d.on ? 'checked' : ''}> เปิดใช้งาน</label></div>
    <p class="text-sm text-slate-500">${esc(d.schedule)} · เก็บไว้ชุดเดียว เขียนทับชุดเดิมทุกครั้ง</p>
    <p class="text-xs text-slate-500 mt-1">ที่เก็บ: <span class="font-mono">${esc(d.location)}</span></p>
    <div class="mt-3 p-3 rounded-xl ${d.last ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50 border border-slate-200'} text-sm">
      ${d.last ? `<div class="font-medium text-emerald-800">สำรองล่าสุด ${when(d.last.at)}</div><div class="text-xs text-emerald-700 mt-0.5">ขนาด ${kb(d.last.size)}${d.lastAttempt && d.lastAttempt.ok ? ' · ' + (by[d.lastAttempt.by] || '') : ''}</div>` : '<div class="text-slate-500">ยังไม่มีข้อมูลสำรองอัตโนมัติ</div>'}
    </div>${failHtml}${warn}
    <div class="grid gap-2 mt-3">
      <button class="btn btn-primary" id="abRun">${icon('save')} สำรองตอนนี้ (ทับชุดเดิม)</button>
      <a class="btn btn-light ${d.last ? '' : 'pointer-events-none opacity-50'}" href="/api/auto-backup/download">${icon('down')} ดาวน์โหลดข้อมูลสำรองอัตโนมัติ</a>
      <button class="btn btn-light" id="abRestore" ${d.last ? '' : 'disabled'}>${icon('upload')} กู้คืนจากข้อมูลสำรองอัตโนมัติ</button>
    </div>`;
  $('#abOn').onchange = async e => { try { await api('PUT', '/auto-backup', { on: e.target.checked }); ok(e.target.checked ? 'เปิดการสำรองข้อมูลอัตโนมัติแล้ว' : 'ปิดการสำรองข้อมูลอัตโนมัติแล้ว'); } catch (err) { fail2(err); } renderAutoBackup(); };
  $('#abRun').onclick = async () => { const b = $('#abRun'); b.disabled = true; b.textContent = 'กำลังสำรองข้อมูล…'; try { await api('POST', '/auto-backup/run'); ok('สำรองข้อมูลแล้ว'); } catch (err) { fail2(err); } renderAutoBackup(); };
  $('#abRestore').onclick = async () => {
    if (!d.last || !(await confirmBox('กู้คืนจากข้อมูลสำรองอัตโนมัติ?', `ข้อมูลปัจจุบันทั้งหมดจะถูกแทนที่ด้วยข้อมูลสำรองเมื่อ ${when(d.last.at)} (ระบบจะเก็บสำเนาข้อมูลปัจจุบันไว้ก่อน)`, 'กู้คืน'))) return;
    try { await api('POST', '/auto-backup/restore'); await Swal.fire({ icon: 'success', title: 'กู้คืนสำเร็จ', confirmButtonText: 'ตกลง' }); location.reload(); } catch (err) { fail2(err); }
  };
  function fail2(err) { fail(err.message); }
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
