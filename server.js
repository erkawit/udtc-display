/**
 * UDTC Display Manager
 * ระบบจัดการส่วนแสดงผล (iframe) และหน้าเว็บเผยแพร่ข้อมูล
 * รันด้วย Node.js อย่างเดียว ไม่ต้องติดตั้งแพ็กเกจเพิ่ม / ไม่ต้องใช้ XAMPP, Apache, AppServ
 *
 *   node server.js            (ค่าเริ่มต้น port 8090)
 *   PORT=9000 node server.js
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
require('./lib/env.js')(ROOT);
// ตั้งค่าพอร์ต/ที่อยู่ได้ที่ config.json (ตัวแปรแวดล้อม PORT / HOST มีผลเหนือกว่า)
let CONFIG = { port: 8090, host: '0.0.0.0' };
try { Object.assign(CONFIG, JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'))); } catch (e) { if (e.code !== 'ENOENT') console.error('อ่าน config.json ไม่ได้:', e.message); }
const PORT = parseInt(process.env.PORT || CONFIG.port || 8090, 10);
const HOST = process.env.HOST || CONFIG.host || '0.0.0.0';
const DATA_DIR = path.join(ROOT, 'data');
const UPLOAD_DIR = path.join(ROOT, 'uploads');
const PUBLIC_DIR = path.join(ROOT, 'public');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const UB = require('./public/assets/ub-render.js');
const MAX_UPLOAD = 200 * 1024 * 1024; // 200 MB
const SESSION_HOURS = 12;
const CLOUD = require('./lib/cloud.js').createCloud(CONFIG);
const NEON = CLOUD.dbMode === 'neon';
const BLOB = CLOUD.storage === 'blob';
const SERVER_PUT_MAX = 4 * 1024 * 1024;   // Vercel รับข้อมูลผ่านฟังก์ชันได้ไม่เกิน 4.5 MB ต่อครั้ง
const CLIENT_UPLOAD_MAX = 200 * 1024 * 1024;

if (!CLOUD.onVercel) for (const d of [NEON ? null : DATA_DIR, BLOB ? null : UPLOAD_DIR].filter(Boolean)) fs.mkdirSync(d, { recursive: true });

/* ------------------------------------------------------------------ */
/* Utilities                                                           */
/* ------------------------------------------------------------------ */
const uid = (n = 10) => crypto.randomBytes(n).toString('hex').slice(0, n);
const now = () => new Date().toISOString();

function hashPassword(pw, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(pw), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(pw, stored) {
  const [salt, hash] = String(stored || '').split(':');
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(String(pw), salt, 64);
  const orig = Buffer.from(hash, 'hex');
  return orig.length === test.length && crypto.timingSafeEqual(orig, test);
}
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function safeUrl(u) {
  u = String(u ?? '').trim();
  if (!u) return '';
  if (/^(javascript|vbscript|data):/i.test(u.replace(/\s/g, ''))) return '';
  return u;
}
function slugify(s) {
  const out = String(s || '').toLowerCase().trim()
    .replace(/[^a-z0-9ก-๙\-_\s]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return out || uid(6);
}
function cleanSlug(s) {
  return String(s || '').toLowerCase().trim().replace(/[^a-z0-9\-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || uid(6);
}
function clamp(n, a, b, d) { n = Number(n); return Number.isFinite(n) ? Math.min(b, Math.max(a, n)) : d; }
function color(c, d) { return /^#[0-9a-f]{3,8}$/i.test(String(c || '')) ? c : d; }

/* ------------------------------------------------------------------ */
/* JSON database (atomic write)                                        */
/* ------------------------------------------------------------------ */
let db;
let saveTimer = null;
let dbVersion = 0;        // โหมด Neon: เวอร์ชันข้อมูลที่โหลดมา
let dbDirty = false;      // โหมด Neon: มีการแก้ไขที่ยังไม่ได้บันทึก (บันทึกก่อนส่งคำตอบ)
let dbCheckedAt = 0;
function saveNow() {
  if (NEON) { dbDirty = true; return; }
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}
function save() {
  if (NEON) { dbDirty = true; return; }
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 150);
}
/** โหมด Neon: โหลดข้อมูลล่าสุด (โหลดใหม่เฉพาะเมื่อเวอร์ชันเปลี่ยน) */
async function ensureDb({ fresh = false } = {}) {
  if (!NEON) return;
  if (db && !fresh && Date.now() - dbCheckedAt < 3000) return;
  const v = db ? await CLOUD.dbVersion() : -1;
  dbCheckedAt = Date.now();
  if (db && v === dbVersion) return;
  const r = await CLOUD.dbLoad();
  if (r) { db = r.data; dbVersion = r.version; loadDbDefaults(); return; }
  // ฐานข้อมูลว่าง: สร้างข้อมูลเริ่มต้น + ชุดตัวอย่าง
  db = seed(); loadDbDefaults(); seedDemo();
  const nv = await CLOUD.dbSave(db, 0);
  if (nv) { dbVersion = nv; console.log('สร้างฐานข้อมูลเริ่มต้นใน Neon แล้ว (admin / caogikojt02)'); }
  else { const again = await CLOUD.dbLoad(); db = again.data; dbVersion = again.version; loadDbDefaults(); }
}
/** โหมด Neon: บันทึกการแก้ไข — ถ้ามีเครื่องอื่นบันทึกก่อน จะแจ้งให้โหลดใหม่ */
async function flushDb() {
  if (!NEON || !dbDirty) return;
  dbDirty = false;
  const nv = await CLOUD.dbSave(db, dbVersion);
  if (nv === null) {
    dbVersion = -1; // บังคับโหลดใหม่ครั้งถัดไป
    const e = new Error('ข้อมูลถูกแก้ไขจากเครื่องอื่นพร้อมกัน — กรุณากดบันทึกอีกครั้ง'); e.status = 409; throw e;
  }
  dbVersion = nv; dbCheckedAt = Date.now();
}
function sample(n) { return `/assets/samples/banner-${n}.svg`; }
function seed() {
  const t = now();
  return {
    settings: {
      siteName: 'ศาลจังหวัดอุดรธานี',
      siteNameEn: 'Udon Thani Provincial Court',
      logo: '/assets/logo.svg',
      primary: '#1e3a5f',
      accent: '#b8862b',
      footer: 'ศาลจังหวัดอุดรธานี  ถนนโพศรี ตำบลหมากแข้ง อำเภอเมืองอุดรธานี จังหวัดอุดรธานี 41000',
      homePageId: '',
      publicUrl: '',
    },
    users: [{ id: uid(), username: 'admin', name: 'ผู้ดูแลระบบ', role: 'admin', password: hashPassword('caogikojt02'), createdAt: t }],
    widgets: [
      {
        id: uid(), slug: 'pr-banner', name: 'แบนเนอร์ประชาสัมพันธ์ (สไลด์)', description: 'ตัวอย่างแบบสไลด์ เปลี่ยนภาพอัตโนมัติ',
        title: 'ข่าวประชาสัมพันธ์', showTitle: true, layout: 'carousel', columns: 1, mobileColumns: 1, gap: 12, ratio: '16/6', fit: 'cover',
        radius: 12, shadow: true, showCaption: true, captionPos: 'overlay', autoplay: 5, showArrows: true, showDots: true,
        limit: 0, moreLabel: '', moreLink: '', bg: '#ffffff', padding: 12, accent: '#1e3a5f', updatedAt: t, createdAt: t,
        items: [1, 2, 3].map(n => ({ id: uid(), type: 'image', title: `ตัวอย่างแบนเนอร์ที่ ${n}`, subtitle: 'แก้ไขหรือเปลี่ยนภาพได้ที่ระบบหลังบ้าน', src: sample(n), link: '', newTab: true, active: true, start: '', end: '' })),
      },
      {
        id: uid(), slug: 'quick-links', name: 'ลิงก์ประกาศ / บริการ', description: 'ตัวอย่างแบบรายการลิงก์',
        title: 'ประกาศและข่าวสาร', showTitle: true, layout: 'list', columns: 1, mobileColumns: 1, gap: 8, ratio: 'auto', fit: 'cover',
        radius: 10, shadow: false, showCaption: true, captionPos: 'below', autoplay: 0, showArrows: false, showDots: false,
        limit: 0, moreLabel: '', moreLink: '', bg: '#ffffff', padding: 12, accent: '#1e3a5f', updatedAt: t, createdAt: t,
        items: [
          { id: uid(), type: 'button', title: 'ประกาศศาลจังหวัดอุดรธานี', subtitle: '', icon: '📢', link: 'https://udtc.coj.go.th/', newTab: true, btnStyle: 'light', active: true, start: '', end: '' },
          { id: uid(), type: 'button', title: 'เผยแพร่การจัดซื้อจัดจ้าง', subtitle: '', icon: '📄', link: 'https://udtc.coj.go.th/', newTab: true, btnStyle: 'light', active: true, start: '', end: '' },
          { id: uid(), type: 'button', title: 'ข่าวรับสมัครงาน', subtitle: '', icon: '💼', link: 'https://udtc.coj.go.th/', newTab: true, btnStyle: 'light', active: true, start: '', end: '' },
        ],
      },
      {
        id: uid(), slug: 'gallery-grid', name: 'กริดภาพกิจกรรม (จำกัด 4 ภาพ)', description: 'ตัวอย่างแบบกริด จำกัดจำนวน + ปุ่มดูทั้งหมด',
        title: 'ภาพกิจกรรม', showTitle: true, layout: 'grid', columns: 4, mobileColumns: 2, gap: 12, ratio: '4/3', fit: 'cover',
        radius: 10, shadow: true, showCaption: true, captionPos: 'below', autoplay: 0, showArrows: false, showDots: false,
        limit: 4, moreLabel: 'ดูทั้งหมด', moreLink: '/p/activities', bg: '#ffffff', padding: 12, accent: '#1e3a5f', updatedAt: t, createdAt: t,
        items: [1, 2, 3, 1, 2, 3].map((n, i) => ({ id: uid(), type: 'image', title: `กิจกรรมที่ ${i + 1}`, subtitle: '', src: sample(n), link: '', newTab: true, active: true, start: '', end: '' })),
      },
      {
        id: uid(), slug: 'service-buttons', name: 'ปุ่มบริการ (ผืนผ้าใบ ลากวางได้)', description: 'ตัวอย่างแบบผืนผ้าใบ จัดวางปุ่มอิสระบนเส้นตาราง',
        title: 'บริการประชาชน', showTitle: true, layout: 'canvas', columns: 1, mobileColumns: 1, gap: 12, ratio: 'auto', fit: 'cover',
        radius: 12, shadow: false, showCaption: false, captionPos: 'below', autoplay: 0, showArrows: false, showDots: false,
        limit: 0, moreLabel: '', moreLink: '', bg: '#ffffff', padding: 12, accent: '#1e3a5f', canvasW: 1200, canvasH: 320, gridSize: 20, stackMobile: true, canvasMax: false,
        updatedAt: t, createdAt: t,
        items: [
          ['ประกาศศาล', 'fa-solid fa-bullhorn', 'tile', 20, 20], ['จัดซื้อจัดจ้าง', 'fa-solid fa-file-contract', 'tile', 320, 20],
          ['รับสมัครงาน', 'fa-solid fa-briefcase', 'tile', 620, 20], ['ห้องไกล่เกลี่ยออนไลน์', 'fa-solid fa-video', 'tile', 920, 20],
          ['ตรวจสอบวันนัดความ', 'fa-solid fa-calendar-check', 'navy', 20, 200], ['ยื่นฟ้องอิเล็กทรอนิกส์', 'fa-solid fa-laptop', 'gold', 320, 200],
          ['ติดต่อศาล', 'fa-solid fa-phone', 'raised', 620, 200], ['แผนที่ / การเดินทาง', 'fa-solid fa-location-dot', 'outline', 920, 200],
        ].map(([title, iconFa, pr, x, y], i) => ({ id: uid(), type: 'button', title, subtitle: '', iconFa, icon: '', link: 'https://udtc.coj.go.th/', newTab: true,
          style: UB.norm((UB.PRESETS.find(p => p.id === pr) || {}).style), pos: { x, y, w: 260, h: pr === 'tile' ? 140 : 80, z: 1, locked: false },
          active: true, start: '', end: '', src: '', poster: '', html: '', btnStyle: 'primary' })),
      },
    ],
    pages: [
      {
        id: uid(), slug: 'activities', title: 'ภาพกิจกรรมทั้งหมด', description: 'รวมภาพกิจกรรมของศาลจังหวัดอุดรธานี', cover: '',
        status: 'published', showInMenu: true, menuOrder: 1, createdAt: t, updatedAt: t,
        blocks: [
          { id: uid(), type: 'text', content: 'หน้านี้เป็นตัวอย่างหน้าเว็บเผยแพร่ข้อมูล ซึ่งสามารถดึง "ส่วนแสดงผล" มาแสดงได้ และเพิ่มเนื้อหาอื่นๆ เช่น ข้อความ ภาพ วีดีโอ ไฟล์เอกสาร และปุ่มลิงก์' },
          { id: uid(), type: 'widget', widgetSlug: 'gallery-grid', full: true },
        ],
      },
      {
        id: uid(), slug: 'about', title: 'เกี่ยวกับหน่วยงาน', description: 'ข้อมูลทั่วไป', cover: sample(2),
        status: 'published', showInMenu: true, menuOrder: 2, createdAt: t, updatedAt: t,
        blocks: [
          { id: uid(), type: 'heading', text: 'ข้อมูลทั่วไป', level: 2, align: 'left' },
          { id: uid(), type: 'text', content: 'ศาลจังหวัดอุดรธานีมีอำนาจพิจารณาพิพากษาคดีแพ่งและคดีอาญาทั่วไป\nแก้ไขเนื้อหานี้ได้ที่ระบบหลังบ้าน > หน้าเว็บ' },
          { id: uid(), type: 'notice', tone: 'info', title: 'เวลาทำการ', content: 'วันจันทร์ – วันศุกร์ เวลา 08.30 – 16.30 น. (เว้นวันหยุดราชการ)' },
          { id: uid(), type: 'button', label: 'เว็บไซต์ศาลจังหวัดอุดรธานี', link: 'https://udtc.coj.go.th/', style: 'primary', align: 'left', newTab: true },
        ],
      },
    ],
    media: [],
  };
}

/* ---------------- ชุดตัวอย่าง (แบบหน้าเว็บศาล: ปุ่มระบบออนไลน์ / แท็บบริการ / QR / Infographics) ---------------- */
function makeDemo(widgets) {
  const used = new Set(widgets.map(w => w.slug));
  const slug = base => { let s = base, n = 2; while (used.has(s)) s = `${base}-${n++}`; used.add(s); return s; };
  const S = n => `/assets/samples/${n}`;
  const btn = (title, extra) => Object.assign({ type: 'button', title, link: 'https://udtc.coj.go.th/', newTab: true, active: true }, extra);
  const mk = (o) => { const w = normWidget(o); w.id = uid(); w.createdAt = w.updatedAt = now(); w.slug = slug(o.slug); return w; };
  const logoStyle = { bg: '#ffffff', color: '#1e3a8a', radius: 22, shadow: 'md', hover: 'lift', iconPos: 'top', iconSize: 54, fontSize: 18, fontWeight: 700, padX: 16, padY: 26 };
  const online = mk({
    slug: 'online-systems', name: 'ปุ่มระบบบริการออนไลน์ (โลโก้)', description: 'กริด 5 คอลัมน์ ปุ่มใช้ภาพโลโก้แทนไอคอน', layout: 'grid',
    columns: 5, mobileColumns: 2, gap: 22, padding: 22, bg: '#f4f7fc', panelRadius: 16, btnMinH: 200, accent: '#1e3a8a', showTitle: false, shadow: false,
    items: [['ระบบรับส่งอิเล็กทรอนิกส์', 1], ['ระบบบริการออนไลน์ศาล', 2], ['ระบบแจ้งเตือนอิเล็กทรอนิกส์', 3], ['ระบบคำนวณค่านำหมาย', 4], ['ห้องพิจารณาคดีอิเล็กทรอนิกส์', 5],
      ['ติดตามสำนวนคดีศาล', 6], ['ระบบไกล่เกลี่ยก่อนฟ้อง', 7], ['ระบบตรวจสอบสิ่งพิมพ์', 8], ['พิสูจน์และยืนยันตัวตน', 9], ['ระบบค้นหาเขตอำนาจศาล', 10]]
      .map(([t, n]) => btn(t, { iconImg: S(`logo-${n}.svg`), style: logoStyle })),
  });
  const banners = mk({
    slug: 'public-banners', name: 'แบนเนอร์บริการประชาชน (คอลัมน์ซ้าย)', description: 'ภาพแบนเนอร์เรียงแนวตั้ง ใช้ในแท็บบริการประชาชน', layout: 'grid',
    columns: 1, mobileColumns: 1, gap: 16, padding: 0, bg: 'transparent', ratio: '16/7', radius: 14, shadow: true, showCaption: false, showTitle: false,
    items: [1, 2, 3, 4].map(n => ({ type: 'image', title: `แบนเนอร์ ${n}`, src: S(`banner-${n}.svg`), link: 'https://udtc.coj.go.th/', newTab: true, active: true })),
  });
  const tile = (fg, ic) => ({ bg: '#ffffff', color: '#334155', iconColor: ic, radius: 14, borderW: 1, borderC: '#e2e8f0', shadow: 'sm', hover: 'lift', iconPos: 'top', iconSize: 46, fontSize: 16, fontWeight: 500, padX: 14, padY: 22 });
  const tiles = mk({
    slug: 'public-tiles', name: 'ปุ่มบริการประชาชน (คอลัมน์ขวา)', description: 'กริด 3 คอลัมน์ ปุ่มไอคอนด้านบน + ปุ่มเน้นสีเข้ม', layout: 'grid',
    columns: 3, mobileColumns: 2, gap: 16, padding: 0, bg: 'transparent', btnMinH: 220, showTitle: false, shadow: false,
    items: [
      ['ห้องพิจารณาคดีอิเล็กทรอนิกส์', 'fa-solid fa-video', '#2563eb'], ['การสืบพยานผ่านจอภาพ', 'fa-solid fa-desktop', '#0ea5e9'],
      ['ศูนย์ประสานงานคดีที่พิจารณาทางอิเล็กทรอนิกส์', 'fa-solid fa-people-group', '#ef4444'], ['ระบบรับส่งอิเล็กทรอนิกส์', 'fa-solid fa-laptop', '#1e3a5f'],
      ['อัตราค่านำหมาย', 'fa-solid fa-map-location-dot', '#f59e0b'], ['รับเงินด้วยวิธีการโอน (Internet Banking)', 'fa-solid fa-money-bill', '#16a34a'],
      ['ข้อมูลการโอนเงินจ่ายคืนค่าธรรมเนียมศาล', 'fa-solid fa-coins', '#16a34a'], ['เปิดทำการศาลในวันหยุดราชการ', 'fa-solid fa-clock', '#0891b2'],
      ['บัญชีทนายความขอแรง', 'fa-solid fa-scale-balanced', '#b8862b'], ['ผู้ประนีประนอมประจำศาล', 'fa-solid fa-handshake', '#7c3aed'],
      ['แบบสอบถามความพึงพอใจผู้มาติดต่อราชการ', 'fa-solid fa-clipboard-check', '#ea580c'],
    ].map(([t, ic, c]) => btn(t, { iconFa: ic, style: tile('#334155', c) }))
      .concat([btn('ติดต่อเรา', { subtitle: 'ศาลจังหวัดอุดรธานี', iconFa: 'fa-solid fa-phone-volume', style: { bg: '#1e3a8a', color: '#ffffff', iconColor: '#facc15', radius: 14, shadow: 'md', hover: 'lift', iconPos: 'top', iconSize: 46, fontSize: 17, fontWeight: 600, padX: 14, padY: 22 } })]),
  });
  const qr = mk({
    slug: 'qr-codes', name: 'แถบ QR Code', description: 'ภาพ QR พร้อมคำอธิบาย คลิกเพื่อขยาย', layout: 'grid',
    columns: 5, mobileColumns: 2, gap: 22, padding: 28, bg: '#f1f5fd', panelRadius: 20, ratio: '1/1', fit: 'contain', imgPad: 14, radius: 16, shadow: true,
    showCaption: true, captionAlign: 'center', capColor: '#1e3a8a', lightbox: true, showTitle: false,
    items: ['สอบถามข้อมูลคดีผู้บริโภค', 'เตรียมความพร้อมก่อนเป็นพยานศาล', 'แบบตอบรับการมาศาลของพยาน', 'แจ้งปัญหาข้อขัดข้อง / การร้องเรียน', 'แบบสอบถามความพึงพอใจผู้มาติดต่อราชการ']
      .map((t, i) => ({ type: 'image', title: t, src: S(`qr-${i + 1}.svg`), active: true })),
  });
  const academic = mk({
    slug: 'academic-tiles', name: 'ปุ่มบริการวิชาการ', description: 'ปุ่มในแท็บบริการวิชาการ', layout: 'grid',
    columns: 5, mobileColumns: 2, gap: 16, padding: 0, bg: 'transparent', btnMinH: 170, showTitle: false, shadow: false,
    items: [['การรับนักศึกษาฝึกงาน', 'fa-solid fa-user-group', '#475569'], ['การเข้าศึกษาดูงาน', 'fa-solid fa-map-location-dot', '#2563eb']]
      .map(([t, ic, c]) => btn(t, { iconFa: ic, style: { ...tile('#334155', c), bg: '#fff7f4', borderC: '#fde2d8' } })),
  });
  const tabs = mk({
    slug: 'services-tabs', name: 'แท็บบริการประชาชน / บริการวิชาการ', description: 'รวมหลายส่วนแสดงผลไว้ในแท็บ จัดคอลัมน์ซ้าย–ขวาได้', layout: 'tabs',
    padding: 12, gap: 20, bg: 'transparent', tabStyle: 'pill', tabEqual: true, showTitle: false,
    tabs: [
      { label: 'บริการประชาชน', activeBg: '#f2c94c', activeFg: '#ffffff', blocks: [{ widgetSlug: banners.slug, span: 5 }, { widgetSlug: tiles.slug, span: 7 }, { widgetSlug: qr.slug, span: 12 }] },
      { label: 'บริการวิชาการ', activeBg: '#e07a5f', activeFg: '#ffffff', blocks: [{ widgetSlug: academic.slug, span: 12 }, { widgetSlug: qr.slug, span: 12 }] },
    ],
  });
  const infoNames = ['ข้อกำหนดว่าด้วยการใช้เทคโนโลยีปัญญาประดิษฐ์ (AI)', 'สิทธิขอปล่อยชั่วคราว', 'ใบแต่งทนายความ (รูปแบบใหม่)', 'ป้ายกล้องวงจรปิด CCTV', 'แนวทางปฏิบัติสำหรับประชาชน', 'ข้อกำหนดของศาล'];
  const infographics = mk({
    slug: 'infographics', name: 'Infographics', description: 'กริด 3 คอลัมน์ ภาพแนวตั้ง หัวข้อแบบแคปซูล คลิกเพื่อขยาย', layout: 'grid',
    title: 'Infographics', showTitle: true, titleStyle: 'pill', accent: '#1e40af', columns: 3, mobileColumns: 1, gap: 28, padding: 16, bg: '#ffffff',
    ratio: '3/4', radius: 16, shadow: true, showCaption: true, captionAlign: 'center', capColor: '#1e3a8a', lightbox: true, link2Color: '#dc2626', limit: 6,
    items: infoNames.map((t, i) => ({ type: 'image', title: t, src: S(`info-${i + 1}.svg`), active: true, ...(i === 2 ? { link2: S('info-3.svg'), link2Text: 'ดาวน์โหลดแบบฟอร์ม' } : {}) })),
  });
  return [online, banners, tiles, qr, academic, tabs, infographics];
}
function demoPage(d) {
  const t = now();
  return { id: uid(), slug: 'services-demo', title: 'ตัวอย่างหน้าบริการ', description: 'ตัวอย่างการจัดหน้า: ปุ่มระบบออนไลน์ · แท็บบริการ · QR Code · Infographics',
    cover: '', status: 'published', showInMenu: true, menuOrder: 3, createdAt: t, updatedAt: t,
    blocks: [d[0], d[5], d[6]].map(w => ({ id: uid(), type: 'widget', widgetSlug: w.slug, full: false })) };
}
/* ------------------------------------------------------------------ */
/* แม่แบบหน้าเว็บ (สร้างส่วนแสดงผล + หน้าเว็บให้พร้อมแก้ไข)            */
/* ------------------------------------------------------------------ */
const THEMES = {
  navy: { name: 'น้ำเงิน–ทอง', main: '#1e3a5f', deep: '#0b1f3a', soft: '#f4f7fc', acc: '#b8862b' },
  green: { name: 'เขียวหยก', main: '#14625e', deep: '#0f3d3e', soft: '#f0f8f6', acc: '#c79a3b' },
  maroon: { name: 'แดงเลือดหมู', main: '#7a1f35', deep: '#3b0f1f', soft: '#fbf3f4', acc: '#c79a3b' },
  indigo: { name: 'ม่วงคราม', main: '#3b3486', deep: '#1f1b4d', soft: '#f4f3fc', acc: '#0284c7' },
  brown: { name: 'น้ำตาลทอง', main: '#7a5a1e', deep: '#3a2a0b', soft: '#fbf7ee', acc: '#b45309' },
};
const TEMPLATES = [
  { id: 'full-services', name: 'หน้าบริการเต็มรูปแบบ', desc: 'สไลด์ภาพ · ปุ่มโลโก้ระบบออนไลน์ · แท็บบริการประชาชน/วิชาการ · QR · Infographics' },
  { id: 'news-home', name: 'หน้าแรกข่าวสาร', desc: 'สไลด์ภาพแบบจางซ้อน · ข้อความต้อนรับ · ข่าวประชาสัมพันธ์ 3 คอลัมน์ · ลิงก์ด่วน · QR' },
  { id: 'online-center', name: 'ศูนย์บริการออนไลน์', desc: 'สไลด์ภาพเตี้ย · ปุ่มโลโก้ 4 คอลัมน์ · รายการดาวน์โหลดแบบฟอร์ม · กล่องติดต่อ' },
  { id: 'gallery', name: 'ประชาสัมพันธ์ & Infographic', desc: 'สไลด์ภาพ · สไลด์ Infographic 3 ภาพต่อหน้า · ภาพกิจกรรม 2 คอลัมน์ · ข้อความติดต่อ' },
  { id: 'minimal', name: 'เรียบง่าย (มินิมอล)', desc: 'สไลด์ภาพกว้าง · หัวข้อกึ่งกลาง · ปุ่มเส้นขอบ 4 คอลัมน์ · เส้นคั่น' },
];
function makeTemplate(tplId, themeId, pageTitle) {
  const T = THEMES[themeId] || THEMES.navy;
  const used = new Set(db.widgets.map(w => w.slug));
  const slug = base => { let s = base, n = 2; while (used.has(s)) s = `${base}-${n++}`; used.add(s); return s; };
  const S = n => `/assets/samples/${n}`;
  const mk = o => { const w = normWidget(o); w.id = uid(); w.createdAt = w.updatedAt = now(); w.slug = slug(o.slug); return w; };
  const btn = (title, extra) => Object.assign({ type: 'button', title, link: 'https://udtc.coj.go.th/', newTab: true, active: true }, extra);
  const txt = (content, ts) => ({ type: 'text', title: '', active: true, ts: UB.normText({ content, ...ts }) });
  const hero = (o = {}) => mk(Object.assign({
    slug: 'hero-slide', name: 'สไลด์ภาพหลัก', description: 'แบนเนอร์สไลด์ภาพ (เปลี่ยนภาพได้ที่แท็บรายการ)', layout: 'carousel',
    columns: 1, mobileColumns: 1, padding: 0, gap: 0, bg: 'transparent', showTitle: false, showCaption: false, radius: 16, shadow: true,
    ratio: 'custom', ratioW: 1920, ratioH: 700, carHMode: 'ratio', fit: 'cover', autoplay: 5, transEffect: 'slide', transMs: 700, transEase: 'smooth',
    showArrows: true, showDots: true, accent: T.main,
    // เริ่มสไลด์จากภาพที่สีตรงกับธีม
    items: [0, 1, 2, 3, 4].map(k => (k + Math.max(0, Object.keys(THEMES).indexOf(themeId))) % 5 + 1).map((n, i) => ({ type: 'image', title: `สไลด์ ${i + 1}`, src: S(`hero-${n}.svg`), link: '', active: true })),
  }, o));
  const logoStyle = { bg: '#ffffff', color: T.main, radius: 20, shadow: 'md', hover: 'lift', iconPos: 'top', iconSize: 54, fontSize: 17, fontWeight: 700, padX: 14, padY: 24 };
  const logos = (o = {}) => mk(Object.assign({
    slug: 'online-systems', name: 'ปุ่มระบบบริการออนไลน์ (โลโก้)', layout: 'grid', columns: 5, mobileColumns: 2, gap: 20, padding: 22, bg: T.soft, panelRadius: 16,
    btnMinH: 190, accent: T.main, showTitle: false, shadow: false,
    items: [['ระบบรับส่งอิเล็กทรอนิกส์', 1], ['ระบบบริการออนไลน์ศาล', 2], ['ระบบแจ้งเตือนอิเล็กทรอนิกส์', 3], ['ระบบคำนวณค่านำหมาย', 4], ['ห้องพิจารณาคดีอิเล็กทรอนิกส์', 5],
      ['ติดตามสำนวนคดีศาล', 6], ['ระบบไกล่เกลี่ยก่อนฟ้อง', 7], ['ระบบตรวจสอบสิ่งพิมพ์', 8], ['พิสูจน์และยืนยันตัวตน', 9], ['ระบบค้นหาเขตอำนาจศาล', 10]]
      .map(([t, n]) => btn(t, { iconImg: S(`logo-${n}.svg`), style: logoStyle })),
  }, o));
  const qr = (o = {}) => mk(Object.assign({
    slug: 'qr-codes', name: 'แถบ QR Code', layout: 'grid', columns: 5, mobileColumns: 2, gap: 20, padding: 26, bg: T.soft, panelRadius: 20, ratio: '1/1', fit: 'contain', imgPad: 14,
    radius: 16, shadow: true, showCaption: true, captionAlign: 'center', capColor: T.main, lightbox: true, showTitle: true, title: 'สแกน QR Code', titleStyle: 'center', accent: T.main,
    items: ['สอบถามข้อมูลคดี', 'เตรียมความพร้อมก่อนเป็นพยาน', 'แบบตอบรับการมาศาลของพยาน', 'แจ้งปัญหา / ร้องเรียน', 'แบบสอบถามความพึงพอใจ']
      .map((t, i) => ({ type: 'image', title: t, src: S(`qr-${i + 1}.svg`), active: true })),
  }, o));
  const infoNames = ['ข้อกำหนดการใช้ AI', 'สิทธิขอปล่อยชั่วคราว', 'ใบแต่งทนายความ', 'ป้ายกล้องวงจรปิด', 'แนวทางสำหรับประชาชน', 'ข้อกำหนดของศาล'];
  const infoItems = infoNames.map((t, i) => ({ type: 'image', title: t, src: S(`info-${i + 1}.svg`), active: true }));
  let ws = [], blocks = [];
  const W = w => ({ id: uid(), type: 'widget', widgetSlug: w.slug, full: false });

  if (tplId === 'full-services') {
    const d = makeDemo(db.widgets.concat(ws)); d.forEach(w => used.add(w.slug));
    const [online, , , , , tabs, info] = d;
    online.bg = T.soft; online.accent = T.main; online.items.forEach(i => { if (i.style) i.style.color = T.main; });
    info.accent = T.main; info.capColor = T.main;
    tabs.tabs[0].activeBg = T.acc; tabs.tabs[1].activeBg = T.main;
    const h = hero();
    ws = [h, ...d];
    blocks = [W(h), W(online), W(tabs), W(info)];
  } else if (tplId === 'news-home') {
    const h = hero({ transEffect: 'fade', transMs: 1000, autoplay: 6, radius: 0, shadow: false });
    const intro = mk({ slug: 'welcome-text', name: 'ข้อความต้อนรับ', layout: 'grid', columns: 1, mobileColumns: 1, gap: 6, padding: 28, bg: '#ffffff', showTitle: false, shadow: false,
      items: [txt('ศาลจังหวัดอุดรธานี', { tag: 'h2', size: 34, sizeM: 26, weight: 700, color: T.main, align: 'center' }),
        txt('มุ่งมั่นอำนวยความยุติธรรม ด้วยความรวดเร็ว เสมอภาค และโปร่งใส\nให้บริการประชาชนทั้งที่ศาลและผ่านระบบออนไลน์', { size: 18, color: '#475569', align: 'center', lineH: 1.7 }),
        { type: 'divider', title: '', active: true, ts: UB.normText({ color: T.acc, thick: 3, widthPct: 12, align: 'center', mTop: 10, mBot: 0 }) }] });
    const news = mk({ slug: 'news-grid', name: 'ข่าวประชาสัมพันธ์ (3 คอลัมน์)', layout: 'grid', title: 'ข่าวประชาสัมพันธ์', showTitle: true, titleStyle: 'bar', accent: T.main,
      columns: 3, mobileColumns: 1, gap: 22, padding: 22, bg: '#ffffff', ratio: '16/9', radius: 14, shadow: true, showCaption: true, captionPos: 'below',
      items: [1, 2, 3, 4, 1, 2].map((n, i) => ({ type: 'image', title: `หัวข้อข่าวตัวอย่างที่ ${i + 1}`, subtitle: 'รายละเอียดข่าวโดยย่อ — แก้ไขได้ที่ระบบหลังบ้าน', src: S(`banner-${n}.svg`), link: 'https://udtc.coj.go.th/', newTab: true, active: true })) });
    const quick = mk({ slug: 'quick-links', name: 'ลิงก์ด่วน', layout: 'list', title: 'ลิงก์ด่วน', showTitle: true, titleStyle: 'bar', accent: T.main, columns: 2, mobileColumns: 1, gap: 10, padding: 22, bg: T.soft,
      items: [['ตรวจสอบนัดความ', 'fa-solid fa-calendar-check'], ['ค้นหาข้อมูลคดี', 'fa-solid fa-magnifying-glass'], ['ค่าธรรมเนียมศาล', 'fa-solid fa-coins'], ['แบบฟอร์มคำร้อง', 'fa-solid fa-file-lines'],
        ['ติดต่อหน่วยงาน', 'fa-solid fa-phone'], ['แผนที่การเดินทาง', 'fa-solid fa-map-location-dot']].map(([t, ic]) => btn(t, { iconFa: ic, subtitle: 'คำอธิบายสั้นๆ' })) });
    const q = qr();
    ws = [h, intro, news, quick, q]; blocks = ws.map(W);
  } else if (tplId === 'online-center') {
    const h = hero({ carHMode: 'px', carH: 340, carHM: 200, transEffect: 'slide', autoplay: 5, radius: 14 });
    const head = mk({ slug: 'online-heading', name: 'หัวข้อศูนย์บริการออนไลน์', layout: 'grid', columns: 1, mobileColumns: 1, gap: 4, padding: 18, bg: 'transparent', showTitle: false, shadow: false,
      items: [txt('ศูนย์บริการออนไลน์', { tag: 'h2', size: 30, weight: 700, color: T.main, borderSide: 'left', border: 5, borderColor: T.acc, pad: 12, bg: '' }),
        txt('เลือกระบบที่ต้องการใช้งาน ทุกระบบเปิดในแท็บใหม่', { size: 16, color: '#64748b', pad: 0 })] });
    const lg = logos({ columns: 4, mobileColumns: 2, bg: '#ffffff', padding: 18 }); lg.items = lg.items.slice(0, 8);
    const dl = mk({ slug: 'download-forms', name: 'ดาวน์โหลดแบบฟอร์ม', layout: 'list', title: 'ดาวน์โหลดแบบฟอร์ม', showTitle: true, titleStyle: 'pill', accent: T.main, columns: 1, mobileColumns: 1, gap: 8, padding: 20, bg: T.soft,
      items: ['คำร้องขอคัดถ่ายเอกสาร', 'ใบแต่งทนายความ', 'คำร้องขอปล่อยชั่วคราว', 'หนังสือมอบอำนาจ', 'แบบคำขอรับเงินคืน'].map(t => btn(t, { iconFa: 'fa-solid fa-file-arrow-down', subtitle: 'PDF · แก้ไขลิงก์ไฟล์ได้ที่หลังบ้าน' })) });
    ws = [h, head, lg, dl]; blocks = ws.map(W);
    blocks.push({ id: uid(), type: 'notice', tone: 'info', title: 'ติดต่อสอบถาม', content: 'ศาลจังหวัดอุดรธานี ถนนโพศรี ตำบลหมากแข้ง อำเภอเมืองอุดรธานี จังหวัดอุดรธานี 41000 · โทร. (แก้ไขเบอร์โทรได้ที่หลังบ้าน)' });
  } else if (tplId === 'gallery') {
    const h = hero({ autoplay: 5, transEffect: 'slide', transEase: 'ease-in-out', radius: 20 });
    const infoSlide = mk({ slug: 'info-slide', name: 'สไลด์ Infographic (3 ภาพต่อหน้า)', layout: 'carousel', title: 'Infographics', showTitle: true, titleStyle: 'pill', accent: T.main,
      columns: 3, mobileColumns: 1, gap: 20, padding: 22, bg: T.soft, panelRadius: 18, ratio: '3/4', carHMode: 'ratio', fit: 'cover', radius: 14, shadow: true,
      showCaption: true, captionPos: 'below', captionAlign: 'center', capColor: T.main, lightbox: true, autoplay: 4, transMs: 600, showArrows: true, showDots: true, items: infoItems });
    const acts = mk({ slug: 'activity-grid', name: 'ภาพกิจกรรม (2 คอลัมน์)', layout: 'grid', title: 'ภาพกิจกรรม', showTitle: true, titleStyle: 'bar', accent: T.main,
      columns: 2, mobileColumns: 1, gap: 18, padding: 22, bg: '#ffffff', ratio: '16/9', radius: 14, shadow: true, showCaption: true, captionPos: 'overlay', lightbox: true,
      items: [1, 2, 3, 4].map(n => ({ type: 'image', title: `กิจกรรมตัวอย่างที่ ${n}`, src: S(`banner-${n}.svg`), active: true })) });
    const contact = mk({ slug: 'contact-text', name: 'ข้อความติดต่อ', layout: 'grid', columns: 1, mobileColumns: 1, gap: 0, padding: 16, bg: 'transparent', showTitle: false, shadow: false,
      items: [txt('สอบถามข้อมูลเพิ่มเติม ติดต่อ **กลุ่มงานประชาสัมพันธ์** ศาลจังหวัดอุดรธานี', { size: 18, color: '#ffffff', bg: T.main, pad: 22, radius: 14, align: 'center', iconFa: 'fa-solid fa-circle-info', iconColor: T.acc, shadow: 'soft' })] });
    ws = [h, infoSlide, acts, contact]; blocks = ws.map(W);
  } else {
    const h = hero({ ratioW: 21, ratioH: 7, radius: 0, shadow: false, transEffect: 'slide', transMs: 900, autoplay: 6, showArrows: false });
    const head = mk({ slug: 'minimal-heading', name: 'หัวข้อกึ่งกลาง', layout: 'grid', columns: 1, mobileColumns: 1, gap: 6, padding: 34, bg: '#ffffff', showTitle: false, shadow: false,
      items: [txt('บริการของเรา', { tag: 'h2', size: 32, weight: 600, color: '#0f172a', align: 'center', letter: 0.5 }),
        txt('เลือกบริการที่ต้องการ', { size: 17, color: '#64748b', align: 'center' })] });
    const outline = { bg: '#ffffff', color: T.main, iconColor: T.acc, radius: 12, borderW: 1.5, borderC: T.main, shadow: 'none', hover: 'lift', iconPos: 'top', iconSize: 40, fontSize: 16, fontWeight: 600, padX: 14, padY: 22 };
    const tiles = mk({ slug: 'minimal-tiles', name: 'ปุ่มบริการ (เส้นขอบ)', layout: 'grid', columns: 4, mobileColumns: 2, gap: 16, padding: 20, bg: '#ffffff', btnMinH: 150, showTitle: false, shadow: false,
      items: [['ยื่นฟ้องออนไลน์', 'fa-solid fa-file-signature'], ['ตรวจสอบนัดความ', 'fa-solid fa-calendar-days'], ['ห้องพิจารณาออนไลน์', 'fa-solid fa-video'], ['ไกล่เกลี่ยข้อพิพาท', 'fa-solid fa-handshake'],
        ['ค่าธรรมเนียม', 'fa-solid fa-coins'], ['ดาวน์โหลดแบบฟอร์ม', 'fa-solid fa-download'], ['ร้องเรียน / ข้อเสนอแนะ', 'fa-solid fa-comments'], ['ติดต่อเรา', 'fa-solid fa-phone']]
        .map(([t, ic]) => btn(t, { iconFa: ic, style: outline })) });
    const foot = mk({ slug: 'minimal-footer-text', name: 'ข้อความปิดท้าย', layout: 'grid', columns: 1, mobileColumns: 1, gap: 0, padding: 12, bg: '#ffffff', showTitle: false, shadow: false,
      items: [{ type: 'divider', title: '', active: true, ts: UB.normText({ color: '#e2e8f0', thick: 1, widthPct: 100, mTop: 6, mBot: 14 }) },
        txt('เวลาทำการ จันทร์–ศุกร์ 08.30–16.30 น. (เว้นวันหยุดราชการ)', { size: 15, color: '#64748b', align: 'center', iconFa: 'fa-regular fa-clock', iconColor: T.main })] });
    ws = [h, head, tiles, foot]; blocks = ws.map(W);
  }
  const tpl = TEMPLATES.find(t => t.id === tplId) || TEMPLATES[4];
  const t = now();
  const page = { id: uid(), slug: uniqueSlug(db.pages, `tpl-${tpl.id}`), title: String(pageTitle || tpl.name).slice(0, 300), description: `สร้างจากแม่แบบ “${tpl.name}” · ธีม${T.name}`,
    cover: '', status: 'published', showInMenu: false, menuOrder: 50, createdAt: t, updatedAt: t, blocks: blocks.map(normBlock) };
  return { widgets: ws, page };
}

function loadDb() {
  if (fs.existsSync(DB_FILE)) {
    try { db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
    catch (e) { console.error('อ่าน data/db.json ไม่ได้:', e.message); process.exit(1); }
  } else {
    db = seed();
    FRESH_INSTALL = true;
    saveNow();
    console.log('สร้างฐานข้อมูลเริ่มต้นแล้ว (admin / caogikojt02)');
  }
  db.settings = Object.assign(seed().settings, db.settings || {});
  for (const k of ['users', 'widgets', 'pages', 'media', 'buttonPresets', 'intros']) db[k] = db[k] || [];
}
let FRESH_INSTALL = false;
if (!NEON) {
  if (CLOUD.onVercel) console.error('ยังไม่ได้ตั้งค่า DATABASE_URL — บน Vercel ต้องใช้ฐานข้อมูล Neon');
  else loadDb();
}

/* ------------------------------------------------------------------ */
/* Sessions                                                            */
/* ------------------------------------------------------------------ */
// เซสชันแบบ cookie ลงลายเซ็น (HMAC) — ไม่ต้องเก็บในหน่วยความจำ จึงใช้ได้ทั้งเครื่องแม่ข่ายและ Vercel
// เปลี่ยนรหัสผ่าน/ลบผู้ใช้ = cookie เดิมใช้ไม่ได้ทันที (ผูกกับลายนิ้วมือรหัสผ่าน)
const SESSION_SECRET = (() => {
  const v = String(process.env.SESSION_SECRET || CONFIG.sessionSecret || '').trim();
  if (v) return v;
  if (NEON) return crypto.createHash('sha256').update('udtc-session:' + (process.env.DATABASE_URL || CONFIG.databaseUrl || '')).digest('hex');
  const f = path.join(DATA_DIR, 'session.key');
  try { return fs.readFileSync(f, 'utf8').trim(); } catch {}
  const k = crypto.randomBytes(32).toString('hex');
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(f, k); } catch {}
  return k;
})();
const loginAttempts = new Map(); // ip -> {count, until}
const b64u = b => Buffer.from(b).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const pwPrint = u => crypto.createHash('sha256').update(String(u.password)).digest('hex').slice(0, 16);
function signSession(u) {
  const body = b64u(JSON.stringify({ u: u.id, p: pwPrint(u), e: Date.now() + SESSION_HOURS * 3600e3 }));
  const sig = b64u(crypto.createHmac('sha256', SESSION_SECRET).update(body).digest());
  return `${body}.${sig}`;
}
function readSession(tok) {
  const [body, sig] = String(tok || '').split('.');
  if (!body || !sig) return null;
  const want = b64u(crypto.createHmac('sha256', SESSION_SECRET).update(body).digest());
  if (want.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(want), Buffer.from(sig))) return null;
  try { const d = JSON.parse(Buffer.from(body.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')); return d.e > Date.now() ? d : null; } catch { return null; }
}
const isHttps = req => req.headers['x-forwarded-proto'] === 'https' || !!(req.socket && req.socket.encrypted);
function sessionCookie(req, value, maxAge) {
  return `udtc_sid=${value}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}${isHttps(req) ? '; Secure' : ''}`;
}
function parseCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach(p => {
    const i = p.indexOf('=');
    if (i > 0) { try { out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); } catch {} }
  });
  return out;
}
function currentUser(req, res) {
  const s = readSession(parseCookies(req).udtc_sid);
  if (!s) return null;
  const u = db.users.find(x => x.id === s.u);
  if (!u || pwPrint(u) !== s.p) return null;
  // ต่ออายุอัตโนมัติเมื่อเหลือไม่ถึงครึ่ง
  if (res && s.e - Date.now() < SESSION_HOURS * 1800e3 && !res.headersSent) res.setHeader('Set-Cookie', sessionCookie(req, signSession(u), SESSION_HOURS * 3600));
  return u;
}
const clientIp = req => String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress;
const publicUser = u => u && ({ id: u.id, username: u.username, name: u.name, role: u.role, createdAt: u.createdAt });

/* ------------------------------------------------------------------ */
/* HTTP helpers                                                        */
/* ------------------------------------------------------------------ */
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.ico': 'image/x-icon', '.mp4': 'video/mp4',
  '.webm': 'video/webm', '.ogg': 'video/ogg', '.mov': 'video/quicktime', '.pdf': 'application/pdf',
  '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint', '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.zip': 'application/zip', '.txt': 'text/plain; charset=utf-8', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2',
};
const ALLOWED_UPLOAD = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.mp4', '.webm', '.ogg', '.mov', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.txt', '.mp3']);

function send(res, status, body, headers = {}) {
  res.writeHead(status, Object.assign({ 'X-Content-Type-Options': 'nosniff' }, headers));
  res.end(body);
}
function json(res, status, data) {
  send(res, status, JSON.stringify(data), { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
}
function readBody(req, limit = 5 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on('data', c => { size += c.length; if (size > limit) { reject(new Error('ข้อมูลมีขนาดใหญ่เกินไป')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
async function readJson(req) {
  const b = await readBody(req);
  if (!b.length) return {};
  try { return JSON.parse(b.toString('utf8')); } catch { throw new Error('รูปแบบข้อมูลไม่ถูกต้อง'); }
}
function serveFile(req, res, file, { cache = 'public, max-age=3600', frameable = true } = {}) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return notFound(res);
    const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
    const headers = { 'Content-Type': type, 'Cache-Control': cache, 'Accept-Ranges': 'bytes', 'X-Content-Type-Options': 'nosniff' };
    if (!frameable) headers['X-Frame-Options'] = 'DENY';
    if (type === 'image/svg+xml') headers['Content-Security-Policy'] = "script-src 'none'";
    const range = req.headers.range;
    if (range) {
      const m = /bytes=(\d*)-(\d*)/.exec(range);
      let start = m && m[1] ? parseInt(m[1], 10) : 0;
      let end = m && m[2] ? parseInt(m[2], 10) : st.size - 1;
      if (m && !m[1] && m[2]) { start = st.size - parseInt(m[2], 10); end = st.size - 1; }
      if (start >= st.size || end >= st.size || start > end) { res.writeHead(416, { 'Content-Range': `bytes */${st.size}` }); return res.end(); }
      res.writeHead(206, Object.assign(headers, { 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Content-Length': end - start + 1 }));
      if (req.method === 'HEAD') return res.end();
      return fs.createReadStream(file, { start, end }).pipe(res);
    }
    res.writeHead(200, Object.assign(headers, { 'Content-Length': st.size }));
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
}
function notFound(res, msg = 'ไม่พบหน้าที่ต้องการ') {
  send(res, 404, layoutPage({ title: 'ไม่พบหน้า', body: `<div class="max-w-xl mx-auto text-center py-24"><div class="text-6xl font-bold text-slate-300">404</div><p class="mt-4 text-slate-600">${esc(msg)}</p><a href="/" class="inline-block mt-6 px-5 py-2.5 rounded-lg text-white" style="background:var(--primary)">กลับหน้าหลัก</a></div>` }), { 'Content-Type': 'text/html; charset=utf-8' });
}
function safeJoin(base, rel) {
  const p = path.normalize(path.join(base, rel));
  return p.startsWith(base + path.sep) || p === base ? p : null;
}

/* ------------------------------------------------------------------ */
/* Normalizers (validate input from admin)                            */
/* ------------------------------------------------------------------ */
const LAYOUTS = ['grid', 'carousel', 'list', 'canvas', 'tabs'];
const safeFa = c => /^[a-z0-9\- ]{3,80}$/i.test(String(c || '')) ? String(c).trim() : '';
const RATIOS = ['auto', '16/9', '16/6', '21/9', '4/3', '3/2', '1/1', '3/4', '2/3', 'custom'];
const EASES = { smooth: 'cubic-bezier(.4,0,.2,1)', ease: 'ease', linear: 'linear', 'ease-in-out': 'ease-in-out', bounce: 'cubic-bezier(.34,1.4,.64,1)' };
/** ขนาดพื้นที่แสดงผลทั้งชุด (ใช้ได้ทุกรูปแบบ ยกเว้นผืนผ้าใบที่มีขนาดของตัวเอง) */
function boxCfg(w) {
  return {
    wMode: ['auto', 'px', '%'].includes(w.boxWMode) ? w.boxWMode : 'auto', w: clamp(w.boxW, 100, 3840, 1000), wPct: clamp(w.boxWPct, 10, 100, 100),
    align: ['left', 'center', 'right'].includes(w.boxAlign) ? w.boxAlign : 'center',
    hMode: ['auto', 'min', 'fixed'].includes(w.boxHMode) ? w.boxHMode : 'auto', h: clamp(w.boxH, 20, 3000, 300), hM: clamp(w.boxHM, 0, 3000, 0),
    vAlign: ['top', 'middle', 'bottom'].includes(w.boxVAlign) ? w.boxVAlign : 'top',
  };
}
/** สัดส่วนภาพที่ใช้จริง (รองรับกำหนดเอง กว้าง:สูง) */
function ratioVal(w) {
  if (w.ratio === 'custom') return `${clamp(w.ratioW, 1, 10000, 16)}/${clamp(w.ratioH, 1, 10000, 9)}`;
  return w.ratio === 'auto' || !w.ratio ? 'auto' : w.ratio;
}
/** ค่าขนาด/การเปลี่ยนภาพของสไลด์ (ใส่ค่าเริ่มต้นให้ส่วนแสดงผลเก่าที่ยังไม่มีค่าเหล่านี้) */
function carCfg(w) {
  const hMode = ['auto', 'ratio', 'px'].includes(w.carHMode) ? w.carHMode : (ratioVal(w) === 'auto' ? 'auto' : 'ratio');
  return {
    wMode: ['auto', 'px', '%'].includes(w.carWMode) ? w.carWMode : 'auto',
    w: clamp(w.carW, 100, 3840, 1200), wPct: clamp(w.carWPct, 10, 100, 100),
    align: ['left', 'center', 'right'].includes(w.carAlign) ? w.carAlign : 'center',
    hMode, h: clamp(w.carH, 40, 2000, 400), hM: clamp(w.carHM, 0, 2000, 0),
    pos: ['top', 'center', 'bottom'].includes(w.imgPos) ? w.imgPos : 'center',
    fx: ['slide', 'fade', 'none'].includes(w.transEffect) ? w.transEffect : 'slide',
    ms: clamp(w.transMs, 0, 5000, 600), ease: EASES[w.transEase] ? w.transEase : 'smooth',
    pauseHover: w.pauseHover !== false,
    bg: w.carBg === 'transparent' ? 'transparent' : color(w.carBg, ''),
  };
}
function normItem(i) {
  const type = ['image', 'video', 'button', 'html', 'text', 'divider', 'spacer', 'pdf'].includes(i.type) ? i.type : 'image';
  return {
    id: i.id || uid(), type,
    title: String(i.title || '').slice(0, 300), subtitle: String(i.subtitle || '').slice(0, 500),
    src: safeUrl(i.src), poster: safeUrl(i.poster), link: safeUrl(i.link), newTab: i.newTab !== false, full: !!i.full,
    pdf: type === 'pdf' ? normPdf(i.pdf) : undefined,
    iconImg: safeUrl(i.iconImg), link2: safeUrl(i.link2), link2Text: String(i.link2Text || '').slice(0, 120),
    iconFa: safeFa(i.iconFa), style: i.style && typeof i.style === 'object' ? UB.norm(i.style) : null,
    pos: i.pos && typeof i.pos === 'object' ? { x: clamp(i.pos.x, 0, 4000, 0), y: clamp(i.pos.y, 0, 4000, 0), w: clamp(i.pos.w, 4, 4000, 200), h: clamp(i.pos.h, 4, 4000, 60), z: clamp(i.pos.z, 0, 999, 1), locked: !!i.pos.locked } : null,
    icon: String(i.icon || '').slice(0, 8), btnStyle: ['primary', 'outline', 'light', 'accent'].includes(i.btnStyle) ? i.btnStyle : 'primary',
    html: type === 'html' ? String(i.html || '') : '',
    ts: ['text', 'divider', 'spacer'].includes(type) ? UB.normText(i.ts) : undefined,
    fx: type === 'image' && i.fx && typeof i.fx === 'object' ? UB.normImg(i.fx) : undefined,
    enter: i.enter && UB.ENTERS.includes(i.enter.type) && i.enter.type !== 'none' ? { type: i.enter.type, delay: clamp(i.enter.delay, 0, 5000, 0), dur: clamp(i.enter.dur, 100, 3000, 700) } : undefined,
    active: i.active !== false, start: String(i.start || ''), end: String(i.end || ''),
  };
}
function normWidget(w, existing) {
  const out = Object.assign({}, existing || {}, {
    name: String(w.name || 'ส่วนแสดงผลใหม่').slice(0, 200),
    description: String(w.description || '').slice(0, 500),
    title: String(w.title || '').slice(0, 200), showTitle: !!w.showTitle,
    layout: LAYOUTS.includes(w.layout) ? w.layout : 'grid',
    columns: clamp(w.columns, 1, 6, 3), mobileColumns: clamp(w.mobileColumns, 1, 3, 1),
    gap: clamp(w.gap, 0, 48, 12), ratio: RATIOS.includes(w.ratio) ? w.ratio : 'auto',
    ratioW: clamp(w.ratioW, 1, 10000, 16), ratioH: clamp(w.ratioH, 1, 10000, 9),
    fit: w.fit === 'contain' ? 'contain' : 'cover', radius: clamp(w.radius, 0, 32, 10), shadow: !!w.shadow,
    showCaption: !!w.showCaption, captionPos: w.captionPos === 'overlay' ? 'overlay' : 'below',
    autoplay: Math.round(clamp(w.autoplay, 0, 60, 5) * 10) / 10, showArrows: !!w.showArrows, showDots: !!w.showDots,
    limit: clamp(w.limit, 0, 500, 0), moreLabel: String(w.moreLabel || '').slice(0, 100), moreLink: safeUrl(w.moreLink),
    bg: w.bg === 'transparent' ? 'transparent' : color(w.bg, '#ffffff'), padding: clamp(w.padding, 0, 48, 12),
    accent: color(w.accent, '#1e3a5f'),
    canvasW: clamp(w.canvasW, 200, 3840, 1200), canvasH: clamp(w.canvasH, 60, 4000, 400), gridSize: clamp(w.gridSize, 2, 200, 20),
    stackMobile: w.stackMobile !== false, canvasMax: !!w.canvasMax,
    titleStyle: ['bar', 'pill', 'center', 'plain'].includes(w.titleStyle) ? w.titleStyle : 'bar',
    captionAlign: w.captionAlign === 'center' ? 'center' : 'left', capColor: color(w.capColor, '#1e293b'),
    imgPad: clamp(w.imgPad, 0, 60, 0), panelRadius: clamp(w.panelRadius, 0, 40, 0), btnMinH: clamp(w.btnMinH, 0, 600, 0),
    lightbox: !!w.lightbox, link2Color: color(w.link2Color, '#c2410c'),
    ...(b => ({ boxWMode: b.wMode, boxW: b.w, boxWPct: b.wPct, boxAlign: b.align, boxHMode: b.hMode, boxH: b.h, boxHM: b.hM, boxVAlign: b.vAlign }))(boxCfg(w)),
    ...(c => ({ carWMode: c.wMode, carW: c.w, carWPct: c.wPct, carAlign: c.align, carHMode: c.hMode, carH: c.h, carHM: c.hM,
      imgPos: c.pos, transEffect: c.fx, transMs: c.ms, transEase: c.ease, pauseHover: c.pauseHover, carBg: c.bg }))(carCfg(w)),
    tabStyle: ['pill', 'underline', 'button'].includes(w.tabStyle) ? w.tabStyle : 'pill', tabEqual: w.tabEqual !== false,
    tabs: Array.isArray(w.tabs) ? w.tabs.slice(0, 12).map(t => ({
      id: t.id || uid(), label: String(t.label || 'แท็บ').slice(0, 80), iconFa: safeFa(t.iconFa), active: t.active !== false,
      activeBg: color(t.activeBg, '#1e3a5f'), activeFg: color(t.activeFg, '#ffffff'),
      blocks: Array.isArray(t.blocks) ? t.blocks.slice(0, 24).map(b => ({ id: b.id || uid(), widgetSlug: cleanSlug(b.widgetSlug), span: clamp(b.span, 1, 12, 12) })) : [],
    })) : (existing ? existing.tabs || [] : []),
    items: Array.isArray(w.items) ? w.items.map(normItem) : (existing ? existing.items : []),
    updatedAt: now(),
  });
  return out;
}
const BLOCK_TYPES = ['heading', 'text', 'image', 'video', 'button', 'widget', 'notice', 'file', 'html', 'divider'];
function normBlock(b) {
  const type = BLOCK_TYPES.includes(b.type) ? b.type : 'text';
  const o = { id: b.id || uid(), type };
  const s = (k, n = 5000) => String(b[k] ?? '').slice(0, n);
  switch (type) {
    case 'heading': Object.assign(o, { text: s('text', 300), level: clamp(b.level, 2, 4, 2), align: ['left', 'center', 'right'].includes(b.align) ? b.align : 'left' }); break;
    case 'text': Object.assign(o, { content: s('content', 50000), align: ['left', 'center', 'right', 'justify'].includes(b.align) ? b.align : 'left' }); break;
    case 'image': Object.assign(o, { src: safeUrl(b.src), caption: s('caption', 300), link: safeUrl(b.link), width: ['full', 'wide', 'medium', 'small'].includes(b.width) ? b.width : 'full' }); break;
    case 'video': Object.assign(o, { src: safeUrl(b.src), caption: s('caption', 300) }); break;
    case 'button': Object.assign(o, { iconFa: safeFa(b.iconFa), btn: b.btn && typeof b.btn === 'object' ? UB.norm(b.btn) : null, label: s('label', 200), link: safeUrl(b.link), style: ['primary', 'outline', 'accent'].includes(b.style) ? b.style : 'primary', align: ['left', 'center', 'right'].includes(b.align) ? b.align : 'left', newTab: !!b.newTab }); break;
    case 'widget': Object.assign(o, { widgetSlug: cleanSlug(b.widgetSlug), full: b.full !== false }); break;
    case 'notice': Object.assign(o, { tone: ['info', 'success', 'warning', 'danger'].includes(b.tone) ? b.tone : 'info', title: s('title', 300), content: s('content', 5000) }); break;
    case 'file': Object.assign(o, { title: s('title', 300), src: safeUrl(b.src), note: s('note', 300) }); break;
    case 'html': Object.assign(o, { html: String(b.html || '') }); break;
  }
  return o;
}
function normPage(p, existing) {
  return Object.assign({}, existing || {}, {
    title: String(p.title || 'หน้าใหม่').slice(0, 300), description: String(p.description || '').slice(0, 1000),
    cover: safeUrl(p.cover), status: p.status === 'published' ? 'published' : 'draft',
    showInMenu: !!p.showInMenu, menuOrder: clamp(p.menuOrder, 0, 999, 0),
    blocks: Array.isArray(p.blocks) ? p.blocks.map(normBlock) : (existing ? existing.blocks : []),
    updatedAt: now(),
  });
}
function uniqueSlug(list, slug, selfId) {
  let s = cleanSlug(slug), n = 2;
  const base = s;
  while (list.some(x => x.slug === s && x.id !== selfId)) s = `${base}-${n++}`;
  return s;
}

/* ------------------------------------------------------------------ */
/* Renderers                                                           */
/* ------------------------------------------------------------------ */
function youtubeId(u) {
  const m = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/.exec(String(u || ''));
  return m ? m[1] : null;
}
function videoHtml(src, poster, cls = '') {
  const yt = youtubeId(src);
  if (yt) return `<iframe class="${cls}" src="https://www.youtube-nocookie.com/embed/${yt}?rel=0" title="YouTube video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
  const fb = /facebook\.com\/.+\/videos\//.test(src) ? `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(src)}&show_text=false` : null;
  if (fb) return `<iframe class="${cls}" src="${esc(fb)}" frameborder="0" allowfullscreen loading="lazy"></iframe>`;
  return `<video class="${cls}" src="${esc(src)}" ${poster ? `poster="${esc(poster)}"` : ''} controls preload="metadata" playsinline></video>`;
}
function isVisible(item, at = new Date()) {
  if (!item.active) return false;
  if (item.start && new Date(item.start) > at) return false;
  if (item.end && new Date(item.end + (item.end.length <= 10 ? 'T23:59:59' : '')) < at) return false;
  return true;
}

const WIDGET_CSS = `
*{box-sizing:border-box}html,body{margin:0;padding:0}
body{font-family:'Sarabun',system-ui,-apple-system,'Segoe UI',Tahoma,sans-serif;color:#1e293b;-webkit-font-smoothing:antialiased}
.uw{background:var(--bg);padding:var(--pad)}
.uw-title{display:flex;align-items:center;gap:10px;margin:0 0 12px;font-size:1.15rem;font-weight:700;color:var(--accent)}
.uw-title:before{content:'';width:4px;height:1.2em;border-radius:4px;background:var(--accent)}
.uw-grid{display:grid;gap:var(--gap);grid-template-columns:repeat(var(--mcols),minmax(0,1fr))}
@media(min-width:640px){.uw-grid{grid-template-columns:repeat(min(var(--cols),2),minmax(0,1fr))}}
@media(min-width:900px){.uw-grid{grid-template-columns:repeat(var(--cols),minmax(0,1fr))}}
.uw-card{position:relative;display:flex;flex-direction:column;overflow:hidden;border-radius:var(--radius);background:#fff;text-decoration:none;color:inherit;transition:transform .2s,box-shadow .2s}
.uw.shadow .uw-card{box-shadow:0 1px 3px rgba(15,23,42,.08),0 4px 14px rgba(15,23,42,.06)}
a.uw-card:hover{transform:translateY(-2px)}.uw.shadow a.uw-card:hover{box-shadow:0 6px 24px rgba(15,23,42,.14)}
.uw-media{position:relative;width:100%;aspect-ratio:var(--ratio);background:#f1f5f9;overflow:hidden}
.uw-media.auto{aspect-ratio:auto}
.uw-media img,.uw-media video,.uw-media iframe{display:block;width:100%;height:100%;object-fit:var(--fit);border:0}
.uw-media.auto img,.uw-media.auto video{height:auto}.uw-media.auto iframe{aspect-ratio:16/9;height:auto}
.uw-cap{padding:10px 12px}.uw-cap b{display:block;font-weight:600;font-size:.95rem;line-height:1.4}
.uw-cap small{display:block;margin-top:2px;color:#64748b;font-size:.82rem;line-height:1.45}
.uw-cap.overlay{position:absolute;left:0;right:0;bottom:0;padding:28px 16px 14px;color:#fff;background:linear-gradient(transparent,rgba(2,6,23,.78));pointer-events:none}
.uw-cap.overlay small{color:rgba(255,255,255,.85)}.uw-cap.overlay b{color:#fff}
.upd{display:flex;flex-direction:column;height:var(--pdh,640px);border-radius:var(--radius,12px);overflow:hidden;background:var(--pdbg,#e2e8f0);border:1px solid #cbd5e1;box-sizing:border-box;font-size:14px}
@media(max-width:639px){.upd:not(.fill){height:var(--pdhm,480px)}}
.upd.fill{height:100%}
.upd-bar{flex:none;display:flex;align-items:center;gap:6px;padding:6px 8px;background:#1e293b;color:#fff;font-size:13px;line-height:1.2}
.upd-t{flex:1;min-width:0;display:flex;align-items:center;gap:6px;font-weight:600}.upd-t span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.upd-t svg{flex:none;color:#fca5a5}
.upd-nav{display:flex;align-items:center;gap:4px}.upd-pg{font-variant-numeric:tabular-nums;opacity:.85;white-space:nowrap;min-width:3.5em;text-align:center}
.upd-bar button,.upd-btn{flex:none;border:0;cursor:pointer;background:rgba(255,255,255,.14);color:#fff!important;border-radius:6px;padding:4px 9px;font:inherit;line-height:1.2;text-decoration:none!important;white-space:nowrap}
.upd-bar button:hover,.upd-btn:hover{background:rgba(255,255,255,.26)}.upd-bar button:disabled{opacity:.35;cursor:default}
.upd-view{flex:1;min-height:0;overflow:auto;padding:10px;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;gap:10px}
.upd-view canvas{display:block;max-width:100%;height:auto;background:#fff;box-shadow:0 2px 10px rgba(15,23,42,.18)}
.upd-view iframe{flex:1;width:100%;border:0;background:#fff}
.upd-msg{margin:auto;color:#475569;font-size:13px;text-align:center;padding:12px}.upd-msg a{color:#1d4ed8;text-decoration:underline!important}
.uw-grid>.upd-card,.uw-list>.uw-row-pdf{grid-column:1/-1}.upd-card{padding:0;overflow:visible;background:transparent;box-shadow:none}
.uw-btn{display:flex;align-items:center;justify-content:center;gap:10px;min-height:52px;padding:12px 18px;border-radius:var(--radius);font-weight:600;text-decoration:none;text-align:center;transition:all .2s;line-height:1.35;height:100%}
.uw-btn .ic{font-size:1.25em}.uw-btn small{display:block;font-weight:400;opacity:.8;font-size:.8rem}
.uw-btn.primary{background:var(--accent);color:#fff}.uw-btn.primary:hover{filter:brightness(1.12)}
.uw-btn.accent{background:#b8862b;color:#fff}.uw-btn.accent:hover{filter:brightness(1.08)}
.uw-btn.outline{border:1.5px solid var(--accent);color:var(--accent);background:#fff}.uw-btn.outline:hover{background:var(--accent);color:#fff}
.uw-btn.light{background:#f1f5f9;color:#0f172a}.uw-btn.light:hover{background:#e2e8f0}
.uw-html{height:100%}
.uw-list{display:flex;flex-direction:column;gap:var(--gap)}
.uw-row{display:flex;align-items:center;gap:14px;padding:12px 14px;border:1px solid #e2e8f0;border-radius:var(--radius);background:#fff;text-decoration:none;color:inherit;transition:all .2s}
a.uw-row:hover{border-color:var(--accent);background:#f8fafc}
.uw-row .th{flex:0 0 auto;width:96px;aspect-ratio:var(--ratio);border-radius:calc(var(--radius) * .6);overflow:hidden;background:#f1f5f9}
.uw-row .th.auto{aspect-ratio:4/3}.uw-row .th img{width:100%;height:100%;object-fit:cover;display:block}
.uw-row .ic{flex:0 0 auto;width:40px;height:40px;display:grid;place-items:center;border-radius:10px;background:color-mix(in srgb,var(--accent) 10%,#fff);font-size:1.2rem}
.uw-row .tx{flex:1;min-width:0}.uw-row .tx b{display:block;font-weight:600;line-height:1.4}.uw-row .tx small{display:block;color:#64748b;font-size:.85rem;margin-top:2px}
.uw-row .ar{flex:0 0 auto;display:flex;color:#94a3b8;transition:transform .2s}a.uw-row:hover .ar{transform:translateX(3px);color:var(--accent)}
.uw-row.video{display:block;padding:0;overflow:hidden}
.uw-car{position:relative;overflow:hidden;border-radius:var(--radius)}
.uw.shadow .uw-car{box-shadow:0 1px 3px rgba(15,23,42,.08),0 4px 14px rgba(15,23,42,.06)}
.uw-track{display:flex;transition:transform var(--tms,.6s) var(--tease,cubic-bezier(.4,0,.2,1)),height var(--tms,.6s) var(--tease,ease)}
.uw-carbox{width:100%;max-width:100%}
.uw.cbg .uw-media,.uw.cbg .uw-card,.uw.cbg .uw-row,.uw.cbg .uw-row .th{background:var(--car-bg)}
.uw.cbg-t .uw-car,.uw.cbg-t .uw-card,.uw.cbg-t a.uw-card:hover,.uw.cbg-t .uw-card.lk:hover{box-shadow:none!important}
.uw-car .uw-media img{object-position:var(--opos,center)}
.uw-car.h-auto .uw-track{align-items:flex-start}
.uw-car.h-px .uw-media{aspect-ratio:auto!important;height:var(--car-h)}.uw-car.h-px .uw-media img,.uw-car.h-px .uw-media video{height:100%!important}
@media(max-width:639px){.uw-car.h-px .uw-media{height:var(--car-hm)}}
.uw-car.fx-fade .uw-track{display:grid;transform:none!important}
.uw-car.fx-fade .uw-slide{grid-area:1/1;margin:0;align-self:start;opacity:0;visibility:hidden;transition:opacity var(--tms,.6s) var(--tease,ease),visibility 0s linear var(--tms,.6s)}
.uw-car.fx-fade .uw-slide.on{opacity:1;visibility:visible;z-index:1;transition:opacity var(--tms,.6s) var(--tease,ease)}
.uw-slide{flex:0 0 calc((100% - (var(--cols) - 1) * var(--gap)) / var(--cols));margin-right:var(--gap)}
@media(max-width:639px){.uw-slide{flex-basis:calc((100% - (var(--mcols) - 1) * var(--gap)) / var(--mcols))}}
.uw-car .uw-card{border-radius:var(--radius);height:100%}
.uw-nav{position:absolute;top:50%;transform:translateY(-50%);width:40px;height:40px;border-radius:999px;border:0;background:rgba(255,255,255,.9);color:#0f172a;cursor:pointer;display:grid;place-items:center;box-shadow:0 2px 10px rgba(0,0,0,.18);opacity:.85;transition:opacity .2s;z-index:2}
.uw-nav:hover{opacity:1}.uw-nav.prev{left:10px}.uw-nav.next{right:10px}
.uw-dots{display:flex;justify-content:center;gap:6px;margin-top:10px}
.uw-dots button{width:8px;height:8px;border-radius:99px;border:0;background:#cbd5e1;cursor:pointer;padding:0;transition:all .3s}
.uw-dots button.on{width:22px;background:var(--accent)}
.uw-more{display:flex;justify-content:flex-end;margin-top:12px}
.uw-more a{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:999px;border:1px solid var(--accent);color:var(--accent);text-decoration:none;font-size:.9rem;font-weight:600;transition:all .2s}
.uw-more a:hover{background:var(--accent);color:#fff}
.uw-bw{height:100%;min-height:52px;display:flex}
.uc{position:relative;width:100%;container-type:inline-size}
.uc-el{position:absolute;box-sizing:border-box}
.uc-el.t-text>.ux{height:100%;display:flex;flex-direction:column;justify-content:var(--tva)}.uc-el.t-text>.ux.fit{display:flex;max-width:none}
.uc-el.t-divider{display:flex;flex-direction:column;justify-content:center}
@media(max-width:639px){.uc:not(.stack) .ux{font-size:var(--tfs)}}
.uw-tx{min-width:0}.uw-grid>.uw-tx.full,.uw-list>.uw-tx.full{grid-column:1/-1}.uc-el .uw-html{height:100%;overflow:hidden}.uc-img{display:block;height:100%}
@media(max-width:600px){.uc.stack{aspect-ratio:auto!important;display:flex;flex-direction:column;gap:10px}
.uc.stack .uc-el{position:relative;left:auto!important;top:auto!important;width:100%!important;height:auto!important}
.uc.stack .uc-el.t-button,.uc.stack .uc-el.t-text,.uc.stack .uc-el.t-divider,.uc.stack .uc-el.t-spacer{aspect-ratio:auto!important}
.uc.stack .uc-el.t-text .ux{height:auto!important}
.uc.stack .ub{min-height:54px;font-size:16px!important;padding:12px 16px!important;border-radius:min(var(--r),14px)}
.uc.stack .ub .ui{font-size:20px!important}.uc.stack .ub.pos-top .ui{font-size:28px!important}}
.uw{border-radius:var(--prad,0)}
.uw.bh{display:flex;flex-direction:column;justify-content:var(--bva)}.uw.bh>*{flex:none}.uw.bh-min{min-height:var(--bh)}.uw.bh-fixed{height:var(--bh);overflow:hidden}
@media(max-width:639px){.uw.bh-min{min-height:var(--bhm)}.uw.bh-fixed{height:var(--bhm)}}
.uw-bw{min-height:var(--bminh,52px)}
.uw.capc .uw-cap{text-align:center}.uw-cap b{color:var(--capc,inherit)}
.uw-media.pad{padding:var(--imgpad);background:#fff}.uw-media.pad img{object-fit:contain}
.uw-ml{display:block;color:inherit;text-decoration:none;cursor:pointer}
.uw-card.lk:hover{transform:translateY(-2px)}.uw.shadow .uw-card.lk:hover{box-shadow:0 6px 24px rgba(15,23,42,.14)}
.uw-l2{display:block;padding:0 12px 12px;font-size:.88rem;font-weight:600;color:var(--l2c);text-decoration:none}.uw.capc .uw-l2{text-align:center}.uw-l2:hover{text-decoration:underline}
.uw-title.ts-plain:before,.uw-title.ts-pill:before,.uw-title.ts-center:before{display:none}
.uw-title.ts-pill{justify-content:center;margin-bottom:20px}.uw-title.ts-pill span{display:inline-block;padding:.5em 1.7em;border-radius:999px;color:#fff;letter-spacing:.02em;
 background:linear-gradient(135deg,var(--accent),color-mix(in srgb,var(--accent) 65%,#000));box-shadow:0 6px 16px color-mix(in srgb,var(--accent) 35%,transparent)}
.uw-title.ts-center{flex-direction:column;justify-content:center;gap:8px;margin-bottom:18px}.uw-title.ts-center:after{content:'';width:48px;height:3px;border-radius:3px;background:var(--accent)}
.ut-bar{display:flex;gap:6px;margin-bottom:16px}
.ut-bar.ut-pill{background:#fff;padding:6px;border-radius:16px;box-shadow:0 2px 10px rgba(15,23,42,.08)}
.ut-bar.eq .ut-tab{flex:1}
.ut-tab{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:0;background:transparent;cursor:pointer;font:inherit;font-size:1.05rem;font-weight:600;color:#475569;padding:12px 22px;border-radius:12px;transition:all .25s}
.ut-tab:hover{color:#0f172a;background:#f1f5f9}
.ut-pill .ut-tab.on,.ut-button .ut-tab.on{background:var(--tbg);color:var(--tfg);box-shadow:0 4px 12px color-mix(in srgb,var(--tbg) 40%,transparent)}
.ut-button .ut-tab{border:1px solid #e2e8f0;background:#fff}
.ut-underline{border-bottom:2px solid #e2e8f0}.ut-underline .ut-tab{border-radius:0;margin-bottom:-2px;border-bottom:3px solid transparent}.ut-underline .ut-tab:hover{background:transparent}
.ut-underline .ut-tab.on{color:var(--tbg);border-bottom-color:var(--tbg)}
.ut-panel{display:none}.ut-panel.on{display:block;animation:ut-in .35s ease}
@keyframes ut-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.ut-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:var(--gap);align-items:start}
.ut-col{grid-column:span var(--span);min-width:0}.ut-col>.uw{height:100%}
@media(max-width:640px){.uw-bw{min-height:min(var(--bminh,52px),150px)}}
@media(max-width:760px){.ut-col{grid-column:1/-1}.ut-tab{padding:10px 12px;font-size:.95rem}}
.uw-empty{padding:28px;text-align:center;color:#94a3b8;border:1px dashed #cbd5e1;border-radius:var(--radius)}
`;
const ARROW = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';

/* ---------------- PDF + ลิงก์ภาพขนาดเต็ม ---------------- */
function normPdf(o) {
  o = o && typeof o === 'object' ? o : {};
  return { mode: o.mode === 'scroll' ? 'scroll' : 'single', h: clamp(o.h, 200, 3000, 640), hM: clamp(o.hM, 0, 3000, 0),
    bar: o.bar !== false, dl: o.dl !== false, bg: /^#[0-9a-f]{3,8}$/i.test(o.bg || '') ? o.bg : '#e2e8f0' };
}
/** ภาพที่ติ๊ก “คลิกเพื่อเปิดภาพขนาดเต็ม” และไม่มีลิงก์อื่น → ลิงก์ไปไฟล์ภาพต้นฉบับ */
const withFull = it => it.type === 'image' && it.full && !it.link && it.src ? { ...it, link: it.src, newTab: true } : it;
const PDF_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>';
function pdfHtml(it, { fill = false } = {}) {
  const o = normPdf(it.pdf), u = esc(it.src), name = esc(it.title || decodeURIComponent(String(it.src).split('/').pop() || 'เอกสาร PDF'));
  const st = fill ? 'height:100%' : `--pdh:${o.h}px;--pdhm:${o.hM || Math.round(o.h * 0.75)}px`;
  const bar = o.bar ? `<div class="upd-bar"><span class="upd-t">${PDF_ICON}<span>${name}</span></span>
    ${o.mode === 'single' ? `<span class="upd-nav"><button type="button" class="upd-prev" aria-label="หน้าก่อน">‹</button><span class="upd-pg">–</span><button type="button" class="upd-next" aria-label="หน้าถัดไป">›</button></span>` : '<span class="upd-pg"></span>'}
    <a class="upd-btn" href="${u}" target="_blank" rel="noopener">เปิดเต็มจอ</a>${o.dl ? `<a class="upd-btn" href="${u}" download>ดาวน์โหลด</a>` : ''}</div>` : '';
  return `<div class="upd${fill ? ' fill' : ''} m-${o.mode}" data-pdf="${u}" style="${st};--pdbg:${o.bg}">${bar}<div class="upd-view"><div class="upd-msg">กำลังโหลดเอกสาร PDF…</div></div></div>`;
}
function linkAttrs(it) { return `href="${esc(it.link)}"${it.newTab ? ' target="_blank" rel="noopener"' : ' target="_top"'}`; }

function cardHtml(it, w) {
  if (!w.lightbox) it = withFull(it);
  if (it.type === 'pdf') return `<div class="uw-card upd-card">${pdfHtml(it)}</div>`;
  const ratioCls = ratioVal(w) === 'auto' || (w.layout === 'carousel' && carCfg(w).hMode !== 'ratio') ? ' auto' : '';
  const capOverlay = w.captionPos === 'overlay' && it.type === 'image';
  const cap = (w.showCaption && (it.title || it.subtitle))
    ? `<div class="uw-cap${capOverlay ? ' overlay' : ''}">${it.title ? `<b>${esc(it.title)}</b>` : ''}${it.subtitle ? `<small>${esc(it.subtitle)}</small>` : ''}</div>` : '';
  if (it.type === 'image') {
    const media = `<div class="uw-media${ratioCls}${w.imgPad ? ' pad' : ''}"><img src="${esc(it.src)}" alt="${esc(it.title)}" loading="lazy">${capOverlay ? cap : ''}</div>`;
    const l2 = it.link2 ? `<a class="uw-l2" href="${esc(it.link2)}" target="_blank" rel="noopener">${esc(it.link2Text || 'ดาวน์โหลด')}</a>` : '';
    let head = media, lk = false;
    if (it.link) { head = `<a class="uw-ml" ${linkAttrs(it)}>${media}${capOverlay ? '' : cap}</a>`; lk = true; }
    else if (w.lightbox && it.src) { head = `<a class="uw-ml" href="${esc(it.src)}" data-lb data-lbt="${esc(it.title)}">${media}${capOverlay ? '' : cap}</a>`; lk = true; }
    else head = media + (capOverlay ? '' : cap);
    return `<div class="uw-card${lk ? ' lk' : ''}">${head}${l2}</div>`;
  }
  if (it.type === 'video') {
    return `<div class="uw-card"><div class="uw-media${ratioCls === ' auto' ? '' : ''}" style="${w.ratio === 'auto' ? 'aspect-ratio:16/9' : ''}">${videoHtml(it.src, it.poster)}</div>${w.captionPos === 'overlay' ? cap.replace(' overlay', '') : cap}</div>`;
  }
  if (it.type === 'button') return `<div class="uw-bw">${btnHtml(it, w)}</div>`;
  if (TEXTY.includes(it.type)) return textItemHtml(it);
  return `<div class="uw-html">${it.html}</div>`;
}
const TEXTY = ['text', 'divider', 'spacer'];
function textItemHtml(it, cw) {
  const ts = it.ts || {};
  if (it.type === 'divider') return `<div class="uw-tx full">${UB.dividerHtml(ts, { cw })}</div>`;
  if (it.type === 'spacer') return `<div class="uw-tx full">${UB.spacerHtml(ts, { cw })}</div>`;
  const link = it.link ? { href: it.link, target: it.newTab ? '_blank' : '_top' } : null;
  const inner = UB.textHtml(ts, { cw, link });
  return cw ? inner : `<div class="uw-tx${ts.full !== false ? ' full' : ''}">${inner}</div>`;
}
function btnHtml(it, w, cw) {
  return UB.buttonHtml({ ...it, title: it.title || 'ปุ่ม', style: it.style || UB.fromLegacy(it.btnStyle, w.accent) }, { cw });
}
function rowHtml(it, w) {
  it = withFull(it);
  if (it.type === 'pdf') return `<div class="uw-row-pdf">${pdfHtml(it)}</div>`;
  if (it.type === 'video') return `<div class="uw-row video"><div class="uw-media" style="aspect-ratio:16/9">${videoHtml(it.src, it.poster)}</div>${it.title ? `<div class="uw-cap"><b>${esc(it.title)}</b>${it.subtitle ? `<small>${esc(it.subtitle)}</small>` : ''}</div>` : ''}</div>`;
  if (it.type === 'html') return `<div class="uw-html">${it.html}</div>`;
  if (TEXTY.includes(it.type)) return textItemHtml(it);
  const lead = it.type === 'image' && it.src
    ? `<span class="th${w.ratio === 'auto' ? ' auto' : ''}"><img src="${esc(it.src)}" alt="" loading="lazy"></span>`
    : (it.iconFa ? `<span class="ic" style="color:${(it.style && it.style.iconColor) || w.accent}"><i class="${esc(it.iconFa)}"></i></span>` : it.icon ? `<span class="ic">${esc(it.icon)}</span>` : '');
  const inner = `${lead}<span class="tx"><b>${esc(it.title || '')}</b>${it.subtitle ? `<small>${esc(it.subtitle)}</small>` : ''}</span>${it.link ? `<span class="ar">${ARROW}</span>` : ''}`;
  return it.link ? `<a class="uw-row" ${linkAttrs(it)}>${inner}</a>` : `<div class="uw-row">${inner}</div>`;
}

function canvasHtml(items, w) {
  const W = w.canvasW, H = w.canvasH, pct = (v, t) => +(v / t * 100).toFixed(4);
  const els = items.map((it, i) => ({ it, p: it.pos || { x: 0, y: i * 80, w: 240, h: 60, z: 1 } }))
    .sort((a, b) => a.p.y - b.p.y || a.p.x - b.p.x)
    .map(({ it: it0, p }) => {
      const it = withFull(it0);
      let inner;
      if (it.type === 'button') inner = btnHtml(it, w, W);
      else if (it.type === 'image' && it.fx) inner = UB.imageHtml(it, { cw: W });
      else if (it.type === 'image') {
        const r = it.style ? `calc(${it.style.radius} * 100cqw / ${W})` : `${w.radius}px`;
        const img = `<img src="${esc(it.src)}" alt="${esc(it.title)}" loading="lazy" style="width:100%;height:100%;object-fit:${w.fit};border-radius:${r};display:block">`;
        inner = it.link ? `<a ${linkAttrs(it)} class="uc-img">${img}</a>` : img;
      } else if (it.type === 'video') inner = `<div class="uw-media" style="height:100%;border-radius:${w.radius}px">${videoHtml(it.src, it.poster)}</div>`;
      else if (it.type === 'pdf') inner = pdfHtml(it, { fill: true });
      else if (TEXTY.includes(it.type)) inner = it.type === 'text' ? textItemHtml(it, W) : it.type === 'divider' ? UB.dividerHtml(it.ts, { cw: W }) : '';
      else inner = `<div class="uw-html">${it.html}</div>`;
      const en = it.enter && it.enter.type ? ` data-enter="${it.enter.type}"` : '', ev = en ? `;--edel:${it.enter.delay}ms;--edur:${it.enter.dur}ms` : '';
      return `<div class="uc-el t-${it.type}${it.fx ? ' fxi' : ''}"${en} style="left:${pct(p.x, W)}%;top:${pct(p.y, H)}%;width:${pct(p.w, W)}%;height:${pct(p.h, H)}%;z-index:${p.z || 1};aspect-ratio:${p.w}/${p.h}${ev}">${inner}</div>`;
    }).join('');
  return `<div class="uc${w.stackMobile ? ' stack' : ''}" style="aspect-ratio:${W}/${H};${w.canvasMax ? `max-width:${W}px;margin:0 auto;` : ''}">${els}</div>`;
}
function tabsHtml(w) {
  const tabs = (w.tabs || []).filter(t => t.active !== false);
  if (!tabs.length) return `<div class="uw-empty">ยังไม่มีแท็บ</div>`;
  const bar = tabs.length > 1 ? `<div class="ut-bar ut-${w.tabStyle}${w.tabEqual ? ' eq' : ''}" role="tablist">${tabs.map((t, i) =>
    `<button type="button" class="ut-tab${i === 0 ? ' on' : ''}" role="tab" aria-selected="${i === 0}" data-t="${i}" style="--tbg:${t.activeBg};--tfg:${t.activeFg}">${t.iconFa ? `<i class="${esc(t.iconFa)}"></i>` : ''}${esc(t.label)}</button>`).join('')}</div>` : '';
  const panels = tabs.map((t, i) => `<div class="ut-panel${i === 0 ? ' on' : ''}" role="tabpanel" data-p="${i}"><div class="ut-grid">${t.blocks.map(b => {
    const c = db.widgets.find(x => x.slug === b.widgetSlug);
    if (!c || c.layout === 'tabs' || c.id === w.id) return '';
    return `<div class="ut-col" style="--span:${b.span}">${renderWidgetInner(c)}</div>`;
  }).join('')}</div></div>`).join('');
  return bar + panels;
}
function tabChildren(w) {
  return w.layout === 'tabs' ? (w.tabs || []).flatMap(t => t.blocks.map(b => db.widgets.find(x => x.slug === b.widgetSlug))).filter(c => c && c.layout !== 'tabs') : [];
}
function renderWidgetInner(w, { full = false } = {}) {
  let items = (w.items || []).filter(i => isVisible(i));
  const total = items.length;
  if (!full && w.limit > 0) items = items.slice(0, w.limit);
  const vars = `--bg:${w.bg};--pad:${w.padding}px;--gap:${w.gap}px;--cols:${w.layout === 'carousel' ? w.columns : w.columns};--mcols:${w.mobileColumns};--ratio:${ratioVal(w)};--fit:${w.fit};--radius:${w.radius}px;--accent:${w.accent};--prad:${w.panelRadius || 0}px;--imgpad:${w.imgPad || 0}px;--capc:${w.capColor || 'inherit'};--l2c:${w.link2Color || '#c2410c'}${w.btnMinH ? `;--bminh:${w.btnMinH}px` : ''}`;
  let body;
  if (w.layout === 'tabs') body = tabsHtml(w);
  else if (!items.length) body = `<div class="uw-empty">ยังไม่มีรายการแสดงผล</div>`;
  else if (w.layout === 'canvas') body = canvasHtml(items, w);
  else if (w.layout === 'list') body = `<div class="uw-list">${items.map(i => rowHtml(i, w)).join('')}</div>`;
  else if (w.layout === 'carousel') {
    const c = carCfg(w);
    const boxW = c.wMode === 'px' ? `${c.w}px` : c.wMode === '%' ? `${c.wPct}%` : '100%';
    const boxM = c.align === 'left' ? '0 auto 0 0' : c.align === 'right' ? '0 0 0 auto' : '0 auto';
    const cv = `--car-h:${c.h}px;--car-hm:${c.hM || c.h}px;--tms:${c.fx === 'none' ? 0 : c.ms}ms;--tease:${EASES[c.ease]};--opos:${c.pos === 'center' ? 'center' : 'center ' + c.pos}`;
    body = `<div class="uw-carbox" style="width:${boxW};margin:${boxM}"><div class="uw-car h-${c.hMode} fx-${c.fx}" style="${cv}" data-autoplay="${w.autoplay}" data-fx="${c.fx}" data-hover="${c.pauseHover ? 1 : 0}"><div class="uw-track">${items.map(i => `<div class="uw-slide">${cardHtml(i, w)}</div>`).join('')}</div>${w.showArrows && items.length > 1 ? `<button class="uw-nav prev" aria-label="ก่อนหน้า" style="transform:translateY(-50%) rotate(180deg)">${ARROW}</button><button class="uw-nav next" aria-label="ถัดไป">${ARROW}</button>` : ''}</div>${w.showDots && items.length > 1 ? `<div class="uw-dots"></div>` : ''}</div>`;
  } else body = `<div class="uw-grid">${items.map(i => cardHtml(i, w)).join('')}</div>`;
  const more = (!full && w.moreLink && (w.limit === 0 || total > 0)) ? `<div class="uw-more"><a href="${esc(w.moreLink)}" target="_top">${esc(w.moreLabel || 'ดูทั้งหมด')} ${ARROW}</a></div>` : '';
  const title = w.showTitle && w.title ? `<h2 class="uw-title ts-${w.titleStyle || 'bar'}"><span>${esc(w.title)}</span></h2>` : '';
  const bx = boxCfg(w), cb = carCfg(w).bg;
  let bstyle = cb ? `;--car-bg:${cb}` : '', bcls = cb ? ` cbg${cb === 'transparent' ? ' cbg-t' : ''}` : '';
  if (w.layout !== 'canvas') {
    if (bx.wMode !== 'auto') bstyle += `;max-width:${bx.wMode === 'px' ? bx.w + 'px' : bx.wPct + '%'};margin:${bx.align === 'left' ? '0 auto 0 0' : bx.align === 'right' ? '0 0 0 auto' : '0 auto'}`;
    if (bx.hMode !== 'auto') { bcls += ` bh bh-${bx.hMode}`; bstyle += `;--bh:${bx.h}px;--bhm:${bx.hM || bx.h}px;--bva:${bx.vAlign === 'middle' ? 'center' : bx.vAlign === 'bottom' ? 'flex-end' : 'flex-start'}`; }
  }
  return `<div class="uw${w.shadow ? ' shadow' : ''}${w.captionAlign === 'center' ? ' capc' : ''}${bcls}" style="${vars}${bstyle}">${title}${body}${more}</div>`;
}

const LIGHTBOX_FN = `function(src,t){var o=document.createElement('div');o.setAttribute('role','dialog');
o.style.cssText='position:fixed;inset:0;z-index:2147483000;background:rgba(15,23,42,.9);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;cursor:zoom-out;font-family:Sarabun,system-ui,sans-serif';
var im=document.createElement('img');im.src=src;im.alt=t||'';im.style.cssText='max-width:94vw;max-height:84vh;object-fit:contain;border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,.5);background:#fff';
var c=document.createElement('div');c.textContent=t||'';c.style.cssText='color:#fff;margin-top:14px;font-size:16px;text-align:center;max-width:90vw';
var x=document.createElement('button');x.textContent='\\u2715';x.setAttribute('aria-label','ปิด');x.style.cssText='position:absolute;top:14px;right:18px;width:44px;height:44px;border-radius:99px;border:0;background:rgba(255,255,255,.15);color:#fff;font-size:20px;cursor:pointer';
var a=document.createElement('a');a.href=src;a.target='_blank';a.rel='noopener';a.textContent='เปิดภาพขนาดเต็ม';a.style.cssText='color:#cbd5e1;font-size:13px;margin-top:6px';
o.appendChild(x);o.appendChild(im);o.appendChild(c);if(!/^data:/.test(src))o.appendChild(a);
function close(){o.remove();document.removeEventListener('keydown',k);}function k(e){if(e.key==='Escape')close();}
o.addEventListener('click',function(e){if(e.target!==a)close();});document.addEventListener('keydown',k);document.body.appendChild(o);}`;
function runtimeJs(rootExpr, embed) {
  return `(function(){var R=${rootExpr};if(!R)return;
  var showLB=${LIGHTBOX_FN};
  function narrow(){return (R.clientWidth||innerWidth)<640;}
  var PDFJS='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs',PDFW='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs',pdfLib=null;
  function getPdf(){if(!pdfLib)pdfLib=import(PDFJS).then(function(m){m.GlobalWorkerOptions.workerSrc=PDFW;return m;});return pdfLib;}
  function pdfFallback(box,url){var v=box.querySelector('.upd-view');v.innerHTML='<iframe src="'+url+'#view=FitH" title="PDF"></iframe><div class="upd-msg" style="margin:0;flex:none;padding:4px">ถ้าไม่เห็นเอกสาร <a href="'+url+'" target="_blank" rel="noopener">เปิดไฟล์ PDF</a></div>';}
  function initPdf(box){if(box._pdf)return;box._pdf=1;var url=box.getAttribute('data-pdf'),view=box.querySelector('.upd-view'),pg=box.querySelector('.upd-pg'),single=box.classList.contains('m-single'),doc=null,cur=1,busy=false;
    function paint(n,into){return doc.getPage(n).then(function(p){var w=Math.max(200,view.clientWidth-20),v1=p.getViewport({scale:1}),sc=w/v1.width,dpr=Math.min(2,window.devicePixelRatio||1),vp=p.getViewport({scale:sc*dpr});
      var c=document.createElement('canvas');c.width=vp.width;c.height=vp.height;c.style.width=Math.round(vp.width/dpr)+'px';into.appendChild(c);return p.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;});}
    function show(n){if(busy||!doc)return;busy=true;cur=Math.max(1,Math.min(doc.numPages,n));var tmp=document.createElement('div');tmp.style.display='contents';
      paint(cur,tmp).then(function(){view.innerHTML='';view.appendChild(tmp);view.scrollTop=0;busy=false;upd();},function(){busy=false;});}
    function upd(){if(pg)pg.textContent=single?(cur+' / '+doc.numPages):(doc.numPages+' หน้า');var a=box.querySelector('.upd-prev'),b=box.querySelector('.upd-next');if(a)a.disabled=cur<=1;if(b)b.disabled=cur>=doc.numPages;}
    getPdf().then(function(m){return m.getDocument({url:url}).promise;}).then(function(d){doc=d;
      if(single){show(1);var a=box.querySelector('.upd-prev'),b=box.querySelector('.upd-next');if(a)a.onclick=function(){show(cur-1);};if(b)b.onclick=function(){show(cur+1);};}
      else{view.innerHTML='';var n=Math.min(d.numPages,60),i=1;(function next(){if(i>n)return;paint(i++,view).then(next,next);})();upd();}
    }).catch(function(){pdfFallback(box,url);});}
  var pdfs=R.querySelectorAll('.upd[data-pdf]');
  if(pdfs.length){if('IntersectionObserver' in window){var pio=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){pio.unobserve(e.target);initPdf(e.target);}});},{rootMargin:'200px'});[].forEach.call(pdfs,function(b){pio.observe(b);});}else [].forEach.call(pdfs,initPdf);}
  var ens=R.querySelectorAll('[data-enter]');[].forEach.call(ens,function(e){e.parentElement&&e.parentElement.classList.add('uw-js');});
  if(ens.length){if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.15});[].forEach.call(ens,function(e){io.observe(e);});}else [].forEach.call(ens,function(e){e.classList.add('in');});}
  [].forEach.call(R.querySelectorAll('.uim[data-tilt]'),function(el){
    var base=getComputedStyle(el).transform;base=base==='none'?'':base+' ';
    el.addEventListener('pointermove',function(ev){var b=el.getBoundingClientRect(),x=(ev.clientX-b.left)/b.width-.5,y=(ev.clientY-b.top)/b.height-.5;
      el.style.transform=base+'perspective(900px) rotateX('+(-y*16).toFixed(2)+'deg) rotateY('+(x*16).toFixed(2)+'deg) scale(1.03)';});
    el.addEventListener('pointerleave',function(){el.style.transform='';});
  });
  [].forEach.call(R.querySelectorAll('.uw-car'),function(car){
    var track=car.querySelector('.uw-track'),slides=[].slice.call(track.children),root=car.closest('.uw');
    var dotsBox=car.parentNode.querySelector('.uw-dots'),i=0,timer=null,fx=car.getAttribute('data-fx')||'slide';
    function per(){if(fx==='fade')return 1;var cs=getComputedStyle(root);return parseInt(cs.getPropertyValue(narrow()?'--mcols':'--cols'))||1;}
    function fitH(){if(!car.classList.contains('h-auto'))return;var m=0,e=Math.min(slides.length,i+per());for(var k=i;k<e;k++)m=Math.max(m,slides[k].offsetHeight);if(m)track.style.height=m+'px';}
    [].forEach.call(car.querySelectorAll('img'),function(im){if(!im.complete)im.addEventListener('load',fitH);});
    function pages(){return Math.max(1,slides.length-per()+1);}
    function go(n){var p=pages();i=(n+p)%p;var s=slides[i];
      if(fx==='fade')slides.forEach(function(x,k){x.classList.toggle('on',k===i);});else track.style.transform='translateX(-'+(s?s.offsetLeft:0)+'px)';fitH();
      if(dotsBox){[].forEach.call(dotsBox.children,function(d,k){d.className=k===i?'on':'';});}}
    function dots(){if(!dotsBox)return;dotsBox.innerHTML='';for(var k=0;k<pages();k++){var b=document.createElement('button');b.type='button';b.setAttribute('aria-label','สไลด์ '+(k+1));(function(k){b.onclick=function(){go(k);reset();};})(k);dotsBox.appendChild(b);}}
    function reset(){clearInterval(timer);var a=+car.dataset.autoplay;if(a>0&&pages()>1)timer=setInterval(function(){if(car.offsetParent)go(i+1);},a*1000);}
    var pv=car.querySelector('.prev'),nx=car.querySelector('.next');
    if(pv)pv.onclick=function(){go(i-1);reset();};if(nx)nx.onclick=function(){go(i+1);reset();};
    if(car.getAttribute('data-hover')!=='0'){car.addEventListener('mouseenter',function(){clearInterval(timer);});car.addEventListener('mouseleave',reset);}
    var sx=null;car.addEventListener('touchstart',function(e){sx=e.touches[0].clientX;},{passive:true});
    car.addEventListener('touchend',function(e){if(sx===null)return;var dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>40){go(i+(dx<0?1:-1));reset();}sx=null;});
    addEventListener('resize',function(){dots();go(Math.min(i,pages()-1));});
    dots();go(0);reset();
  });
  [].forEach.call(R.querySelectorAll('.ut-bar'),function(bar){
    var box=bar.parentNode,tabs=[].slice.call(bar.children);
    function panels(){return [].filter.call(box.children,function(c){return c.classList.contains('ut-panel');});}
    tabs.forEach(function(t,k){t.addEventListener('click',function(){
      tabs.forEach(function(x,j){x.classList.toggle('on',j===k);x.setAttribute('aria-selected',j===k);});
      panels().forEach(function(p,j){p.classList.toggle('on',j===k);});
      try{dispatchEvent(new Event('resize'));}catch(e){}
    });});
  });
  var hostLB=false;
  R.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[data-lb]');if(!a)return;e.preventDefault();
    var t=a.getAttribute('data-lbt')||'';
    if(window.parent!==window&&${embed ? 'true' : 'false'}){if(hostLB)parent.postMessage({type:'uw-lightbox',src:a.href,title:t},'*');else window.open(a.href,'_blank');return;}
    showLB(a.href,t);});
  ${embed ? `addEventListener('message',function(e){if(e.data&&e.data.type==='uw-host')hostLB=true;});
  function post(){try{var b=document.body,h=Math.ceil(b.getBoundingClientRect().height);if(!h)h=b.scrollHeight;parent.postMessage({type:'uw-resize',height:h},'*');}catch(e){}}
  addEventListener('load',post);addEventListener('resize',post);
  if(window.ResizeObserver)new ResizeObserver(post).observe(document.body);
  [].forEach.call(document.querySelectorAll('img'),function(im){im.addEventListener('load',post);});
  post();` : ''}
})();`;
}
const WIDGET_JS = runtimeJs('document.body', true);

/* ---------------- Export: HTML + CSS ชุดเดียว (ไม่ใช้ iframe) ---------------- */
function scopeCss(css, scope) {
  const pre = sel => {
    sel = sel.trim();
    if (sel === '*') return `${scope},${scope} *`;
    if (/^(html|body)$/.test(sel)) return scope;
    sel = sel.replace(/^(html|body)\b\s*/, '');
    return sel ? `${scope} ${sel}` : scope;
  };
  const walk = str => {
    let out = '', pos = 0;
    while (pos < str.length) {
      const open = str.indexOf('{', pos); if (open < 0) break;
      const sel = str.slice(pos, open).trim();
      let depth = 1, j = open + 1;
      while (j < str.length && depth) { if (str[j] === '{') depth++; else if (str[j] === '}') depth--; j++; }
      const body = str.slice(open + 1, j - 1);
      if (/^@(media|supports|container)/.test(sel)) {
        // คิวรีตามความกว้าง -> วัดจากกล่องที่วาง (container) แทนหน้าจอ ให้ผลเหมือนอยู่ใน iframe
        const q = sel.replace(/^@media\s*\(((?:min|max)-width:[^)]+)\)/, '@container uwx ($1)');
        out += `${q}{${walk(body)}}`;
      } else if (/^@/.test(sel)) out += `${sel}{${body}}`;
      else out += sel.split(',').map(pre).join(',') + `{${body}}`;
      pos = j;
    }
    return out;
  };
  return walk(css.replace(/\/\*[\s\S]*?\*\//g, ''));
}
const INLINE_MAX = 2 * 1024 * 1024; // ภาพที่ใหญ่กว่านี้ไม่ฝังในโค้ด
function localFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split(/[?#]/)[0]);
  if (clean.startsWith('/uploads/')) return safeJoin(UPLOAD_DIR, clean.slice(9));
  if (clean.startsWith('/assets/')) return safeJoin(path.join(PUBLIC_DIR, 'assets'), clean.slice(8));
  return null;
}
function exportWidget(w, { base, full = false, font = true, inline = true }) {
  const id = `uwx-${w.slug}`.replace(/[^a-z0-9\-_]/gi, '-');
  const scope = `#${id}`;
  const stat = { inlined: 0, inlineBytes: 0, tooBig: [], external: new Set() };
  const cache = new Map();
  // ฝังภาพเป็น data URI: หน้าเว็บปลายทางจะไม่ต้องเรียกไฟล์จากเครื่องแม่ข่าย (IP ภายใน) อีก
  const toData = p => {
    if (cache.has(p)) return cache.get(p);
    let out = null;
    const f = localFile(p), mime = f && MIME[path.extname(f).toLowerCase()];
    if (f && mime && mime.startsWith('image/') && fs.existsSync(f)) {
      const size = fs.statSync(f).size;
      if (size <= INLINE_MAX) { out = `data:${mime};base64,${fs.readFileSync(f).toString('base64')}`; stat.inlined++; stat.inlineBytes += size; }
      else stat.tooBig.push(path.basename(f));
    }
    cache.set(p, out); return out;
  };
  const abs = html => html.replace(/(\s(src|href|poster|data-pdf))="(\/(?!\/)[^"]*)"/g, (m, attr, name, p, off, all) => {
    // href ฝังได้เฉพาะลิงก์ขยายภาพ (data-lb) — ลิงก์ทั่วไปแบบ data: เบราว์เซอร์ไม่ยอมเปิด · PDF ไม่ฝัง (ไฟล์ใหญ่)
    const lb = name === 'data-pdf' ? false : (name !== 'href' || all.startsWith(' data-lb', off + m.length));
    if (inline && lb) { const d = toData(p); if (d) return `${attr}="${d}"`; }
    if (name === 'href') stat.external.add(p.split('/')[1]);
    else stat.external.add('img');
    return `${attr}="${base}${p}"`;
  });
  const bg = w.bg === 'transparent' ? 'transparent' : w.bg;
  const reset = `${scope}{container-name:uwx;container-type:inline-size;display:block;background:${bg};font-family:'Sarabun',system-ui,-apple-system,'Segoe UI',Tahoma,sans-serif;color:#1e293b;line-height:1.5;text-align:left}
${scope} :where(div,a,span,h2,img,i,small,b,button,video,iframe){border:0;box-shadow:none;margin:0;outline:0;float:none;text-transform:none;letter-spacing:normal;text-shadow:none;max-width:none;min-height:0}
${scope} a,${scope} a:hover,${scope} a:visited,${scope} a:focus{text-decoration:none!important}
${scope} a.ub,${scope} a.ub:visited{color:var(--fg)!important}${scope} a.ub.h-invert:hover{color:var(--ivfg)!important}
${scope} a.uw-row,${scope} a.uw-card,${scope} a.uw-ml,${scope} a.uw-row:visited,${scope} a.uw-card:visited,${scope} a.uw-ml:visited{color:inherit!important}
${scope} a.uw-l2{color:var(--l2c)!important}${scope} button.ut-tab{margin:0;line-height:1.3;text-transform:none;min-height:0}${scope} .ut-pill .ut-tab.on,${scope} .ut-button .ut-tab.on{color:var(--tfg)!important}
${scope} .uw-more a{color:var(--accent)!important}${scope} .uw-more a:hover{color:#fff!important}
${scope} h2.uw-title{font-size:1.15rem;font-weight:700;color:var(--accent);padding:0;line-height:1.3}${scope} button{font-family:inherit}`;
  const css = reset + scopeCss(WIDGET_CSS + UB.CSS, scope);
  const html = abs(renderWidgetInner(w, { full }));
  let js = '';
  if (/uw-car|ut-bar|data-lb|data-tilt|data-enter|data-pdf/.test(html)) js = `\n<script>${runtimeJs(`document.getElementById('${id}')`, false)}</script>`;
  const links = [font ? '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap">' : '',
    needsFa(w) ? `<link rel="stylesheet" href="${UB.FA_CSS}">` : '',
    UB.fontUrl(widgetFonts(w)) ? `<link rel="stylesheet" href="${UB.fontUrl(widgetFonts(w))}">` : ''].filter(Boolean).join('\n');
  const stamp = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
  const code = `<!-- ${w.name} | ส่งออกจาก UDTC Display Manager เมื่อ ${stamp} — เป็นสำเนา หากแก้ไขในระบบต้องส่งออกใหม่ -->
${links ? links + '\n' : ''}<style>${css}</style>
<div id="${id}">${html}</div>${js}`;
  const warnings = [];
  const all = [w, ...tabChildren(w)];
  const sched = all.flatMap(x => x.items || []).filter(i => i.start || i.end);
  if (sched.length) warnings.push(`มี ${sched.length} รายการที่กำหนดวันเริ่ม/สิ้นสุด — โค้ดนี้ส่งออกเฉพาะรายการที่แสดงอยู่ ณ ตอนนี้ และจะไม่ซ่อน/แสดงตามวันอัตโนมัติ`);
  if (all.some(x => (x.items || []).some(i => i.type === 'html'))) warnings.push('มีรายการแบบ HTML — ตรวจสอบว่าเว็บปลายทางรองรับโค้ดนั้น');
  if (js) warnings.push('มีสไลด์ / แท็บ / การคลิกขยายภาพ ซึ่งต้องใช้ <script> — หากเว็บปลายทางตัด script ออก ส่วนนี้จะแสดงได้แต่กดใช้งานไม่ได้ (แท็บจะค้างที่แท็บแรก)');
  if (w.layout === 'tabs') warnings.push('แบบแท็บรวมเนื้อหาจากส่วนแสดงผลอื่น — หากแก้ส่วนใดส่วนหนึ่ง ต้องส่งออกแท็บนี้ใหม่');
  const privateBase = /\/\/(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|[^/]*\.local\b)/.test(base);
  if (inline && stat.inlined) warnings.unshift(`ฝังภาพไว้ในโค้ดแล้ว ${stat.inlined} ภาพ (${(stat.inlineBytes / 1048576).toFixed(2)} MB) — หน้าเว็บปลายทางจะไม่เรียกไฟล์จากเครื่องแม่ข่าย จึงไม่ขึ้นหน้าต่างขอสิทธิ์ “เข้าถึงอุปกรณ์ในเครือข่ายภายใน”`);
  if (stat.tooBig.length) warnings.push(`ภาพใหญ่เกิน 2MB จึงไม่ได้ฝัง: ${stat.tooBig.join(', ')} — ย่อขนาดภาพแล้วส่งออกใหม่`);
  if (privateBase && (stat.tooBig.length || stat.external.has('img'))) warnings.push(`ยังมีภาพที่โหลดจาก ${base} (IP ภายใน) — บุคคลภายนอกจะมองไม่เห็น และ Chrome จะขึ้นหน้าต่างขอสิทธิ์เข้าถึงเครือข่ายภายใน`);
  if (privateBase && [...stat.external].some(k => k !== 'img')) warnings.push(`ลิงก์บางรายการชี้ไปที่ ${base} (เช่น ไฟล์ PDF หรือหน้า /p/...) ซึ่งบุคคลภายนอกเปิดไม่ได้ — ควรใช้ลิงก์ที่เปิดได้จากภายนอก เช่น ไฟล์ที่อัปโหลดไว้บนเว็บศาล`);
  if (code.length > 1.5 * 1048576) warnings.push(`โค้ดมีขนาด ${(code.length / 1048576).toFixed(1)} MB — ระบบจัดการเนื้อหาบางระบบจำกัดขนาด ถ้าวางไม่ได้ให้ย่อภาพหรือแยกส่งออกทีละส่วน`);
  return { code, bytes: Buffer.byteLength(code), warnings, id };
}
function widgetFonts(w) { return [w, ...tabChildren(w)].flatMap(x => (x.items || []).flatMap(i => [i.style && i.style.font, i.ts && i.ts.font])).filter(Boolean); }
function needsFa(w) { return [w, ...tabChildren(w)].some(x => (x.items || []).some(i => i.iconFa || (i.ts && i.ts.iconFa)) || (x.tabs || []).some(t => t.iconFa)); }
function renderWidgetDoc(w, opts = {}) {
  return `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(w.name)}</title><base target="_top">
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
${needsFa(w) ? `<link rel="stylesheet" href="${UB.FA_CSS}">` : ''}
${UB.fontUrl(widgetFonts(w)) ? `<link rel="stylesheet" href="${UB.fontUrl(widgetFonts(w))}">` : ''}
<style>${WIDGET_CSS}${UB.CSS}body{background:${w.bg === 'transparent' ? 'transparent' : w.bg}}</style></head>
<body>${renderWidgetInner(w, opts)}<script>${WIDGET_JS}</script></body></html>`;
}


/* ================================================================== */
/* Intro pages (หน้า Intro เต็มจอ + แถบปุ่ม + แอนิเมชัน + เมนูย่อย)     */
/* ================================================================== */
const pick1 = (v, list, d) => list.includes(v) ? v : d;
function normIntroBtn(b) {
  return {
    id: b.id || uid(), title: String(b.title || 'ปุ่ม').slice(0, 120), subtitle: String(b.subtitle || '').slice(0, 160),
    link: safeUrl(b.link), newTab: !!b.newTab, iconFa: safeFa(b.iconFa), iconImg: safeUrl(b.iconImg),
    style: UB.norm(b.style || UB.PRESETS[0].style), active: b.active !== false,
    children: Array.isArray(b.children) ? b.children.slice(0, 20).map(c => ({
      id: c.id || uid(), title: String(c.title || 'เมนู').slice(0, 120), link: safeUrl(c.link), iconFa: safeFa(c.iconFa), newTab: c.newTab !== false,
    })) : [],
  };
}
function normIntro(x, existing) {
  const bg = x.bg || {}, bar = x.bar || {}, an = x.anim || {}, hd = x.head || {}, ag = x.autoGo || {};
  return Object.assign({}, existing || {}, {
    name: String(x.name || 'หน้า Intro').slice(0, 200), title: String(x.title || '').slice(0, 200),
    font: UB.FONTS.some(f => f[0] === x.font) ? x.font : 'Sarabun',
    bg: {
      image: safeUrl(bg.image), imageMobile: safeUrl(bg.imageMobile),
      fit: pick1(bg.fit, ['cover', 'contain', 'fill', 'width'], 'cover'), pos: pick1(bg.pos, ['center', 'top', 'bottom', 'left', 'right'], 'center'),
      color: color(bg.color, '#0f172a'), blurBack: bg.blurBack !== false, overlay: color(bg.overlay, '#000000'),
      overlayOpacity: clamp(bg.overlayOpacity, 0, 90, 0), blur: clamp(bg.blur, 0, 20, 0), kenburns: !!bg.kenburns,
    },
    head: { show: !!hd.show, text: String(hd.text || '').slice(0, 200), sub: String(hd.sub || '').slice(0, 300), color: color(hd.color, '#ffffff'),
      size: clamp(hd.size, 16, 96, 44), pos: pick1(hd.pos, ['top', 'center', 'upper'], 'upper'), shadow: hd.shadow !== false },
    bar: {
      pos: pick1(bar.pos, ['bottom', 'center', 'top'], 'bottom'), align: pick1(bar.align, ['center', 'left', 'right'], 'center'),
      style: pick1(bar.style, ['glass', 'solid', 'none'], 'glass'), bg: color(bar.bg, '#0f172a'), opacity: clamp(bar.opacity, 0, 100, 55),
      radius: clamp(bar.radius, 0, 40, 20), pad: clamp(bar.pad, 0, 48, 16), gap: clamp(bar.gap, 0, 48, 14), offset: clamp(bar.offset, 0, 200, 32),
      maxWidth: clamp(bar.maxWidth, 280, 2400, 1100), btnH: clamp(bar.btnH, 32, 200, 60), btnW: clamp(bar.btnW, 60, 600, 200),
      cols: clamp(bar.cols, 0, 8, 0), mobileCols: clamp(bar.mobileCols, 1, 3, 1),
    },
    anim: {
      bar: pick1(an.bar, ['slide-up', 'fade', 'zoom', 'drop', 'none'], 'slide-up'),
      items: pick1(an.items, ['stagger-up', 'pop', 'fade', 'flip', 'slide-left', 'none'], 'stagger-up'),
      delay: clamp(an.delay, 0, 5000, 400), duration: clamp(an.duration, 100, 3000, 700), stagger: clamp(an.stagger, 0, 1000, 120),
    },
    autoGo: { on: !!ag.on, seconds: clamp(ag.seconds, 3, 120, 15), link: safeUrl(ag.link) },
    buttons: Array.isArray(x.buttons) ? x.buttons.slice(0, 30).map(normIntroBtn) : (existing ? existing.buttons : []),
    updatedAt: now(),
  });
}
const CARET = '<svg class="in-caret" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
const INTRO_CSS = `
*{box-sizing:border-box}html,body{margin:0;height:100%}
body{font-family:var(--font),'Sarabun',system-ui,sans-serif;background:var(--bgc);overflow:hidden;-webkit-font-smoothing:antialiased}
.in-root{position:fixed;inset:0;height:100dvh;overflow:hidden;background:var(--bgc)}
.in-back{position:absolute;inset:-40px;background-size:cover;background-position:center;filter:blur(28px) brightness(.75);transform:scale(1.05)}
.in-bg{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
.in-bg picture{display:block;width:100%;height:100%}
.in-bg img{display:block;width:100%;height:100%;object-position:var(--bgpos)}
.fit-cover img{object-fit:cover}.fit-contain img{object-fit:contain}.fit-fill img{object-fit:fill}
.fit-width{overflow-y:auto;align-items:var(--bgalign,center)}.fit-width picture,.fit-width img{height:auto}
.in-bg.blur img{filter:blur(var(--blur))}
.in-bg.kb img{animation:in-kb 24s ease-in-out infinite alternate}
@keyframes in-kb{from{transform:scale(1)}to{transform:scale(1.09)}}
.in-ov{position:absolute;inset:0;pointer-events:none}
.in-head{position:absolute;left:0;right:0;text-align:center;padding:0 20px;color:var(--hc);z-index:2}
.in-head.p-top{top:6%}.in-head.p-upper{top:22%}.in-head.p-center{top:50%;transform:translateY(-60%)}
.in-head h1{margin:0;font-size:clamp(22px,5vw,var(--hs));font-weight:700;line-height:1.25}
.in-head p{margin:.5em 0 0;font-size:clamp(14px,2vw,calc(var(--hs) * .42));opacity:.92}
.in-head.sh h1,.in-head.sh p{text-shadow:0 2px 12px rgba(0,0,0,.55)}
.in-bar{position:absolute;left:0;right:0;z-index:5;display:flex;padding:0 16px}
.in-bar.p-bottom{bottom:var(--off)}.in-bar.p-top{top:var(--off)}.in-bar.p-center{top:50%;transform:translateY(-50%)}
.in-bar.a-center{justify-content:center}.in-bar.a-left{justify-content:flex-start}.in-bar.a-right{justify-content:flex-end}
.in-panel{width:fit-content;max-width:min(var(--maxw),100%);padding:var(--pad);border-radius:var(--rad)}
.in-panel:has(.grid){width:min(var(--maxw),100%)}
.s-glass .in-panel{background:var(--pbg);backdrop-filter:blur(14px) saturate(140%);-webkit-backdrop-filter:blur(14px) saturate(140%);border:1px solid rgba(255,255,255,.22);box-shadow:0 20px 50px rgba(0,0,0,.28)}
.s-solid .in-panel{background:var(--pbg);box-shadow:0 20px 50px rgba(0,0,0,.25)}
.in-items{display:flex;flex-wrap:wrap;gap:var(--gap);justify-content:center}
.in-items.grid{display:grid;grid-template-columns:repeat(var(--cols),minmax(0,1fr))}
.in-btn{position:relative;min-width:var(--bw);height:var(--bh);display:flex}
.in-items.grid .in-btn{min-width:0}
.in-btn>.ub{width:100%}
.in-caret{flex:none;margin-left:2px;transition:transform .25s}
.in-dd.open .in-caret{transform:rotate(180deg)}
.in-menu{position:absolute;left:50%;min-width:max(100%,220px);transform:translateX(-50%) translateY(8px);background:#fff;border-radius:14px;box-shadow:0 18px 48px rgba(15,23,42,.3);padding:6px;opacity:0;visibility:hidden;transition:all .22s ease;z-index:20;font-family:var(--font),sans-serif}
.in-menu.up{bottom:calc(100% + 10px)}.in-menu.down{top:calc(100% + 10px)}
.in-menu.up{transform:translateX(-50%) translateY(8px)}.in-menu.down{transform:translateX(-50%) translateY(-8px)}
.in-dd.open .in-menu{opacity:1;visibility:visible;transform:translateX(-50%) translateY(0)}
.in-menu a{display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:10px;color:#1e293b;text-decoration:none;font-size:15px;font-weight:500;white-space:nowrap}
.in-menu a:hover{background:#f1f5f9;color:#0f172a}.in-menu a i{width:18px;text-align:center;color:#64748b}
.in-auto{position:absolute;right:16px;bottom:12px;z-index:6;color:rgba(255,255,255,.85);font-size:13px;background:rgba(0,0,0,.35);padding:6px 12px;border-radius:99px;text-decoration:none}
/* animations: ยังไม่เริ่มจนกว่าจะเพิ่ม .go */
.in-root:not(.go) .in-bar.ab-slide-up,.in-root:not(.go) .in-bar.ab-fade,.in-root:not(.go) .in-bar.ab-zoom,.in-root:not(.go) .in-bar.ab-drop{opacity:0}
.in-root:not(.go) .ai-on .in-btn{opacity:0}
.go .ab-slide-up .in-panel{animation:in-up var(--dur) cubic-bezier(.2,.9,.25,1.15) both}
.go .ab-fade .in-panel{animation:in-fade var(--dur) ease both}
.go .ab-zoom .in-panel{animation:in-zoom var(--dur) cubic-bezier(.2,.9,.25,1.2) both}
.go .ab-drop .in-panel{animation:in-drop var(--dur) cubic-bezier(.2,.9,.25,1.15) both}
.go .ai-stagger-up .in-btn{animation:in-iup var(--dur) cubic-bezier(.2,.9,.25,1.2) both;animation-delay:calc(var(--d0) + var(--i) * var(--st))}
.go .ai-pop .in-btn{animation:in-pop var(--dur) cubic-bezier(.3,1.6,.5,1) both;animation-delay:calc(var(--d0) + var(--i) * var(--st))}
.go .ai-fade .in-btn{animation:in-fade var(--dur) ease both;animation-delay:calc(var(--d0) + var(--i) * var(--st))}
.go .ai-flip .in-btn{animation:in-flip var(--dur) cubic-bezier(.2,.9,.25,1.1) both;animation-delay:calc(var(--d0) + var(--i) * var(--st))}
.go .ai-slide-left .in-btn{animation:in-left var(--dur) cubic-bezier(.2,.9,.25,1.1) both;animation-delay:calc(var(--d0) + var(--i) * var(--st))}
.go .in-head{animation:in-fade 1s ease both}
@keyframes in-up{from{opacity:0;transform:translateY(120%)}to{opacity:1;transform:none}}
@keyframes in-drop{from{opacity:0;transform:translateY(-120%)}to{opacity:1;transform:none}}
@keyframes in-zoom{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:none}}
@keyframes in-fade{from{opacity:0}to{opacity:1}}
@keyframes in-iup{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:none}}
@keyframes in-pop{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:none}}
@keyframes in-flip{from{opacity:0;transform:perspective(600px) rotateX(85deg)}to{opacity:1;transform:none}}
@keyframes in-left{from{opacity:0;transform:translateX(60px)}to{opacity:1;transform:none}}
@media(max-width:700px){.in-items:not(.grid) .in-btn{flex:1 1 calc((100% - (var(--mcols) - 1) * var(--gap)) / var(--mcols));min-width:0}
.in-items.grid{grid-template-columns:repeat(var(--mcols),minmax(0,1fr))}.in-btn{height:max(48px,calc(var(--bh) * .85))}
.in-bar{padding:0 10px}.in-panel{padding:calc(var(--pad) * .7)}}
@media (prefers-reduced-motion:reduce){.in-root *{animation:none!important;opacity:1!important}}
`;
const INTRO_JS = `(function(){
  var R=document.querySelector('.in-root');
  function start(){R.classList.add('go');}
  if(document.readyState==='complete')setTimeout(start,50);else addEventListener('load',function(){setTimeout(start,50);});
  setTimeout(start,2500);
  var dds=[].slice.call(document.querySelectorAll('.in-dd'));
  function closeAll(x){dds.forEach(function(d){if(d!==x){d.classList.remove('open');d.querySelector('.ub').setAttribute('aria-expanded','false');}});}
  dds.forEach(function(d){var b=d.querySelector('.ub');b.setAttribute('role','button');b.setAttribute('tabindex','0');b.setAttribute('aria-haspopup','true');b.setAttribute('aria-expanded','false');
    function tg(e){e.preventDefault();e.stopPropagation();var o=!d.classList.contains('open')||(Date.now()-(d._hv||0)<600);closeAll(d);d.classList.toggle('open',o);b.setAttribute('aria-expanded',o);}
    b.addEventListener('click',tg);b.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' ')tg(e);});
    if(matchMedia('(hover:hover)').matches){var t;d.addEventListener('mouseenter',function(){clearTimeout(t);closeAll(d);if(!d.classList.contains('open'))d._hv=Date.now();d.classList.add('open');});d.addEventListener('mouseleave',function(){t=setTimeout(function(){d.classList.remove('open');},250);});}
  });
  document.addEventListener('click',function(){closeAll();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closeAll();});
  var a=document.querySelector('.in-auto');
  if(a){var n=+a.getAttribute('data-s'),go=a.getAttribute('href'),sp=a.querySelector('b');var iv=setInterval(function(){n--;if(sp)sp.textContent=n;if(n<=0){clearInterval(iv);if(!window.__uwPreview)location.href=go;}},1000);
    document.addEventListener('pointerdown',function(e){if(!a.contains(e.target)){clearInterval(iv);a.remove();}},{once:true});}
})();`;
function introButtonHtml(b, i, it) {
  const kids = b.children.filter(c => c.title);
  if (kids.length) {
    const btn = UB.buttonHtml({ ...b, link: '' }, { tag: 'div' }).replace(/<\/div>$/, `${CARET}</div>`);
    const menu = `<div class="in-menu ${it.bar.pos === 'bottom' ? 'up' : 'down'}" role="menu">${kids.map(c => `<a role="menuitem" href="${esc(c.link || '#')}"${c.newTab ? ' target="_blank" rel="noopener"' : ''}>${c.iconFa ? `<i class="${esc(c.iconFa)}"></i>` : ''}${esc(c.title)}</a>`).join('')}</div>`;
    return `<div class="in-btn in-dd" style="--i:${i}">${btn}${menu}</div>`;
  }
  return `<div class="in-btn" style="--i:${i}">${UB.buttonHtml(b, { target: '_self' })}</div>`;
}
function introFonts(it) { return [it.font, ...it.buttons.map(b => b.style && b.style.font)]; }
function renderIntro(it, { preview = false } = {}) {
  const bg = it.bg, bar = it.bar, an = it.anim, hd = it.head;
  const btns = it.buttons.filter(b => b.active);
  const needFa = btns.some(b => b.iconFa || b.children.some(c => c.iconFa));
  const fontLink = UB.fontUrl(introFonts(it));
  const hexA = (hex, a) => { const h = (hex || '#000000').replace('#', '').slice(0, 6); return '#' + h + Math.round(a * 255).toString(16).padStart(2, '0'); };
  const vars = [`--font:'${it.font}'`, `--bgc:${bg.color}`, `--bgpos:${bg.pos}`, `--blur:${bg.blur}px`, `--hc:${hd.color}`, `--hs:${hd.size}px`,
    `--off:${bar.offset}px`, `--maxw:${bar.maxWidth}px`, `--pad:${bar.pad}px`, `--rad:${bar.radius}px`, `--gap:${bar.gap}px`,
    `--bh:${bar.btnH}px`, `--bw:${bar.btnW}px`, `--cols:${bar.cols || 1}`, `--mcols:${bar.mobileCols}`,
    `--pbg:${bar.style === 'none' ? 'transparent' : hexA(bar.bg, bar.opacity / 100)}`,
    `--dur:${an.duration}ms`, `--d0:${an.delay + (an.bar !== 'none' ? Math.round(an.duration * .45) : 0)}ms`, `--st:${an.stagger}ms`].join(';');
  const img = bg.image ? `<picture>${bg.imageMobile ? `<source media="(max-width:768px)" srcset="${esc(bg.imageMobile)}">` : ''}<img src="${esc(bg.image)}" alt="${esc(it.title || it.name)}" fetchpriority="high"></picture>` : '';
  const head = hd.show && (hd.text || hd.sub) ? `<div class="in-head p-${hd.pos}${hd.shadow ? ' sh' : ''}">${hd.text ? `<h1>${esc(hd.text)}</h1>` : ''}${hd.sub ? `<p>${esc(hd.sub)}</p>` : ''}</div>` : '';
  const barHtml = btns.length ? `<nav class="in-bar p-${bar.pos} a-${bar.align} s-${bar.style} ab-${an.bar}" aria-label="เมนูหน้าแรก"><div class="in-panel"><div class="in-items${bar.cols ? ' grid' : ''}${an.items !== 'none' ? ' ai-on ai-' + an.items : ''}">${btns.map((b, i) => introButtonHtml(b, i, it)).join('')}</div></div></nav>` : '';
  const auto = it.autoGo.on && it.autoGo.link ? `<a class="in-auto" href="${esc(it.autoGo.link)}" data-s="${it.autoGo.seconds}">เข้าสู่เว็บไซต์อัตโนมัติใน <b>${it.autoGo.seconds}</b> วินาที</a>` : '';
  return `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(it.title || db.settings.siteName)}</title><link rel="icon" href="${esc(db.settings.logo || '/assets/logo.svg')}">
${bg.image ? `<link rel="preload" as="image" href="${esc(bg.image)}">` : ''}
${fontLink ? `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="${fontLink}">` : ''}
${needFa ? `<link rel="stylesheet" href="${UB.FA_CSS}">` : ''}
<style>${INTRO_CSS}${UB.CSS}</style>${preview ? '<script>window.__uwPreview=true</script>' : ''}</head>
<body><div class="in-root" style="${vars}">
${bg.fit === 'contain' && bg.blurBack && bg.image ? `<div class="in-back" style="background-image:url('${esc(bg.image)}')"></div>` : ''}
<div class="in-bg fit-${bg.fit}${bg.blur ? ' blur' : ''}${bg.kenburns ? ' kb' : ''}">${img}</div>
${bg.overlayOpacity ? `<div class="in-ov" style="background:${bg.overlay};opacity:${bg.overlayOpacity / 100}"></div>` : ''}
${head}${barHtml}${auto}
</div><script>${INTRO_JS}</script></body></html>`;
}
function exportIntro(it, base) {
  let html = renderIntro(it);
  const stat = { inlined: 0, bytes: 0, tooBig: [], ext: 0 };
  html = html.replace(/((?:src|href|srcset)=["']|url\(')(\/(?!\/)[^"')]*)/g, (m, pre, p) => {
    const f = localFile(p), mime = f && MIME[path.extname(f).toLowerCase()];
    if (f && mime && mime.startsWith('image/') && fs.existsSync(f)) {
      const size = fs.statSync(f).size;
      if (size <= 6 * 1048576) { stat.inlined++; stat.bytes += size; return pre + `data:${mime};base64,${fs.readFileSync(f).toString('base64')}`; }
      stat.tooBig.push(path.basename(f));
    }
    stat.ext++;
    return pre + base + p;
  });
  const warnings = [];
  if (stat.inlined) warnings.push(`ฝังภาพไว้ในไฟล์แล้ว ${stat.inlined} ภาพ (${(stat.bytes / 1048576).toFixed(2)} MB) — เปิดได้โดยไม่ต้องเรียกเครื่องแม่ข่าย`);
  if (stat.tooBig.length) warnings.push(`ภาพใหญ่เกิน 6MB ไม่ได้ฝัง: ${stat.tooBig.join(', ')}`);
  if (/\/\/(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(base) && stat.ext) warnings.push(`มีลิงก์ ${stat.ext} รายการที่ชี้ไปยัง ${base} (IP ภายใน) — บุคคลภายนอกเปิดไม่ได้ ควรใช้ลิงก์เต็ม เช่น https://udtc.coj.go.th/...`);
  return { html, bytes: Buffer.byteLength(html), warnings };
}
function demoIntro(intros) {
  const t = now();
  const slug = uniqueSlug(intros, 'main');
  const it = normIntro({
    name: 'หน้า Intro หลัก (ตัวอย่าง)', title: 'ศาลจังหวัดอุดรธานี', font: 'Kanit',
    bg: { image: '/assets/samples/intro-bg.svg', fit: 'cover', pos: 'center', color: '#0f172a', overlayOpacity: 0, kenburns: true },
    head: { show: false },
    bar: { pos: 'bottom', align: 'center', style: 'glass', bg: '#0f172a', opacity: 45, radius: 22, pad: 16, gap: 14, offset: 36, maxWidth: 1000, btnH: 60, btnW: 210, cols: 0, mobileCols: 1 },
    anim: { bar: 'slide-up', items: 'stagger-up', delay: 300, duration: 700, stagger: 110 },
    buttons: [
      { title: 'เข้าสู่เว็บไซต์', iconFa: 'fa-solid fa-arrow-right-to-bracket', link: 'https://udtc.coj.go.th/th/page/item/index/id/1', style: { ...UB.PRESETS.find(p => p.id === 'gold').style, font: 'Kanit', fontSize: 18, radius: 14, hover: 'shine' } },
      { title: 'บริการออนไลน์', iconFa: 'fa-solid fa-laptop', style: { bg: '#ffffff', color: '#1e3a5f', iconColor: '#b8862b', radius: 14, shadow: 'md', hover: 'lift', font: 'Kanit', fontSize: 18 },
        children: [{ title: 'ระบบรับส่งอิเล็กทรอนิกส์', iconFa: 'fa-solid fa-file-arrow-up', link: 'https://udtc.coj.go.th/' }, { title: 'ระบบบริการออนไลน์ศาล', iconFa: 'fa-solid fa-globe', link: 'https://udtc.coj.go.th/' }, { title: 'ตรวจสอบวันนัดความ', iconFa: 'fa-solid fa-calendar-check', link: 'https://udtc.coj.go.th/' }] },
      { title: 'ติดต่อศาล', iconFa: 'fa-solid fa-phone', link: 'https://udtc.coj.go.th/', style: { bg: 'transparent', color: '#ffffff', borderW: 2, borderC: '#ffffff', radius: 14, shadow: 'none', hover: 'invert', font: 'Kanit', fontSize: 18 } },
    ],
  });
  it.id = uid(); it.slug = slug; it.createdAt = t;
  return it;
}

/* ---------------- Public pages ---------------- */
function navPages() {
  return db.pages.filter(p => p.status === 'published' && p.showInMenu).sort((a, b) => (a.menuOrder || 0) - (b.menuOrder || 0));
}
function layoutPage({ title, body, description = '', active = '' }) {
  const s = db.settings;
  const nav = navPages();
  const logo = s.logo ? `<img src="${esc(s.logo)}" alt="" class="h-11 w-11 object-contain">` : '';
  return `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} | ${esc(s.siteName)}</title>${description ? `<meta name="description" content="${esc(description)}">` : ''}
<link rel="icon" href="${esc(s.logo || '/assets/logo.svg')}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${UB.FA_CSS}">
<script src="https://cdn.tailwindcss.com"></script>
<script>tailwind.config={theme:{extend:{fontFamily:{sans:['Sarabun','system-ui','sans-serif']}}}}</script>
<style>:root{--primary:${s.primary};--accent:${s.accent}}body{font-family:'Sarabun',system-ui,sans-serif}
.prose-text p{margin:0 0 1em;line-height:1.85}.prose-text a{color:var(--primary);text-decoration:underline}
.nav-link.active{color:var(--primary);border-color:var(--accent)}${UB.CSS}</style></head>
<body class="bg-slate-50 text-slate-800 antialiased min-h-screen flex flex-col">
<div style="background:var(--primary)" class="h-1.5"></div>
<header class="bg-white border-b border-slate-200 sticky top-0 z-30">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-20">
    <a href="/" class="flex items-center gap-3 min-w-0">${logo}<div class="min-w-0"><div class="font-bold text-lg leading-tight truncate" style="color:var(--primary)">${esc(s.siteName)}</div><div class="text-xs text-slate-500 tracking-wide truncate">${esc(s.siteNameEn)}</div></div></a>
    <nav class="hidden md:flex items-center gap-1">${nav.map(p => `<a href="/p/${esc(p.slug)}" class="nav-link px-3 py-2 text-[15px] text-slate-600 hover:text-slate-900 border-b-2 border-transparent ${p.slug === active ? 'active' : ''}">${esc(p.title)}</a>`).join('')}</nav>
    ${nav.length ? `<button id="mnav" class="md:hidden p-2 rounded-lg hover:bg-slate-100" aria-label="เมนู"><svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button>` : ''}
  </div>
  <div id="mnavbox" class="md:hidden hidden border-t border-slate-100 px-4 py-2">${nav.map(p => `<a href="/p/${esc(p.slug)}" class="block px-3 py-2.5 rounded-lg text-slate-700 hover:bg-slate-50">${esc(p.title)}</a>`).join('')}</div>
</header>
<main class="flex-1">${body}</main>
<footer class="mt-16 text-slate-300" style="background:var(--primary)">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
    <div><div class="font-semibold text-white">${esc(s.siteName)}</div><div class="text-sm mt-1 opacity-80 whitespace-pre-line">${esc(s.footer)}</div></div>
    <div class="text-xs opacity-60">© ${new Date().getFullYear() + 543} ${esc(s.siteName)}</div>
  </div>
</footer>
<script src="/assets/embed.js"></script>
<script>var b=document.getElementById('mnav');if(b)b.onclick=function(){document.getElementById('mnavbox').classList.toggle('hidden')}</script>
</body></html>`;
}
function textToHtml(t) {
  return esc(t).split(/\n{2,}/).map(p => `<p>${p.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>').replace(/\n/g, '<br>')}</p>`).join('');
}
const TONES = {
  info: ['bg-sky-50 border-sky-200 text-sky-900', 'ℹ️'], success: ['bg-emerald-50 border-emerald-200 text-emerald-900', '✅'],
  warning: ['bg-amber-50 border-amber-200 text-amber-900', '⚠️'], danger: ['bg-rose-50 border-rose-200 text-rose-900', '⛔'],
};
function renderBlock(b) {
  const al = { left: 'text-left', center: 'text-center', right: 'text-right', justify: 'text-justify' };
  const jal = { left: 'justify-start', center: 'justify-center', right: 'justify-end' };
  switch (b.type) {
    case 'heading': {
      const sz = { 2: 'text-2xl', 3: 'text-xl', 4: 'text-lg' }[b.level];
      return `<h${b.level} class="${sz} font-bold text-slate-900 ${al[b.align]} mt-2" ${b.level === 2 ? 'style="border-left:4px solid var(--accent);padding-left:12px"' : ''}>${esc(b.text)}</h${b.level}>`;
    }
    case 'text': return `<div class="prose-text text-[17px] text-slate-700 ${al[b.align] || ''}">${textToHtml(b.content)}</div>`;
    case 'image': {
      if (!b.src) return '';
      const wd = { full: 'w-full', wide: 'max-w-4xl', medium: 'max-w-2xl', small: 'max-w-md' }[b.width];
      const img = `<img src="${esc(b.src)}" alt="${esc(b.caption)}" class="w-full rounded-xl border border-slate-200" loading="lazy">`;
      return `<figure class="${wd} mx-auto">${b.link ? `<a href="${esc(b.link)}" target="_blank" rel="noopener">${img}</a>` : img}${b.caption ? `<figcaption class="text-sm text-slate-500 text-center mt-2">${esc(b.caption)}</figcaption>` : ''}</figure>`;
    }
    case 'video': return b.src ? `<figure><div class="aspect-video rounded-xl overflow-hidden bg-black">${videoHtml(b.src, '', 'w-full h-full')}</div>${b.caption ? `<figcaption class="text-sm text-slate-500 text-center mt-2">${esc(b.caption)}</figcaption>` : ''}</figure>` : '';
    case 'button': {
      if (b.btn) return `<div class="flex ${jal[b.align]}">${UB.buttonHtml({ title: b.label || 'ลิงก์', iconFa: b.iconFa, link: b.link || '#', newTab: b.newTab, style: b.btn }, { cls: 'auto', target: '_self' })}</div>`;
      const st = { primary: 'text-white shadow-sm hover:opacity-90" style="background:var(--primary)', accent: 'text-white shadow-sm hover:opacity-90" style="background:var(--accent)', outline: 'border-2 hover:bg-slate-50" style="border-color:var(--primary);color:var(--primary)' }[b.style];
      return `<div class="flex ${jal[b.align]}"><a href="${esc(b.link || '#')}" ${b.newTab ? 'target="_blank" rel="noopener"' : ''} class="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${st}">${esc(b.label || 'ลิงก์')} ${ARROW}</a></div>`;
    }
    case 'widget': {
      const w = db.widgets.find(x => x.slug === b.widgetSlug);
      if (!w) return '';
      return `<iframe src="/embed/${esc(w.slug)}${b.full ? '?full=1' : ''}" data-uw-embed title="${esc(w.name)}" class="w-full block" style="border:0;min-height:120px" loading="lazy"></iframe>`;
    }
    case 'notice': {
      const [c, ic] = TONES[b.tone];
      return `<div class="rounded-xl border p-5 ${c}"><div class="flex gap-3"><span class="text-xl leading-none">${ic}</span><div>${b.title ? `<div class="font-semibold mb-1">${esc(b.title)}</div>` : ''}<div class="text-[15px] leading-relaxed whitespace-pre-line">${esc(b.content)}</div></div></div></div>`;
    }
    case 'file': {
      if (!b.src) return '';
      const ext = (path.extname(b.src.split('?')[0]).slice(1) || 'file').toUpperCase();
      return `<a href="${esc(b.src)}" target="_blank" rel="noopener" class="group flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-400 hover:shadow-sm transition">
        <span class="flex-none w-12 h-12 rounded-lg grid place-items-center text-xs font-bold text-white" style="background:var(--primary)">${esc(ext.slice(0, 4))}</span>
        <span class="flex-1 min-w-0"><span class="block font-semibold text-slate-900">${esc(b.title || 'เอกสาร')}</span>${b.note ? `<span class="block text-sm text-slate-500">${esc(b.note)}</span>` : ''}</span>
        <span class="text-sm font-medium" style="color:var(--primary)">ดาวน์โหลด ↓</span></a>`;
    }
    case 'html': return `<div>${b.html}</div>`;
    case 'divider': return `<hr class="border-slate-200 my-2">`;
  }
  return '';
}
function renderPage(p, preview = false) {
  const cover = p.cover ? `<div class="relative h-56 sm:h-72 overflow-hidden"><img src="${esc(p.cover)}" class="absolute inset-0 w-full h-full object-cover" alt=""><div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-slate-900/10"></div>
    <div class="relative max-w-6xl mx-auto px-4 sm:px-6 h-full flex flex-col justify-end pb-8"><h1 class="text-3xl sm:text-4xl font-bold text-white">${esc(p.title)}</h1>${p.description ? `<p class="text-slate-200 mt-2 max-w-2xl">${esc(p.description)}</p>` : ''}</div></div>`
    : `<div class="bg-white border-b border-slate-200"><div class="max-w-6xl mx-auto px-4 sm:px-6 py-10"><nav class="text-sm text-slate-500 mb-3"><a href="/" class="hover:underline">หน้าหลัก</a> <span class="mx-1">/</span> ${esc(p.title)}</nav><h1 class="text-3xl sm:text-4xl font-bold" style="color:var(--primary)">${esc(p.title)}</h1>${p.description ? `<p class="text-slate-600 mt-2 max-w-3xl">${esc(p.description)}</p>` : ''}</div></div>`;
  const banner = preview && p.status !== 'published' ? `<div class="bg-amber-100 text-amber-900 text-center text-sm py-2">โหมดดูตัวอย่าง — หน้านี้ยังเป็น "ฉบับร่าง" ผู้เข้าชมทั่วไปจะมองไม่เห็น</div>` : '';
  const body = `${banner}${cover}<div class="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6">${p.blocks.map(renderBlock).join('\n')}
    <div class="pt-6 text-xs text-slate-400">ปรับปรุงล่าสุด ${new Date(p.updatedAt).toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Bangkok' })}</div></div>`;
  return layoutPage({ title: p.title, description: p.description, body, active: p.slug });
}
function renderHome() {
  const s = db.settings;
  const home = s.homePageId && db.pages.find(p => p.id === s.homePageId && p.status === 'published');
  if (home) return renderPage(home);
  const pages = db.pages.filter(p => p.status === 'published').sort((a, b) => (a.menuOrder || 0) - (b.menuOrder || 0));
  const body = `<section class="bg-white border-b border-slate-200"><div class="max-w-6xl mx-auto px-4 sm:px-6 py-14">
    <div class="text-sm font-semibold tracking-wider" style="color:var(--accent)">ศูนย์เผยแพร่ข้อมูล</div>
    <h1 class="text-3xl sm:text-4xl font-bold mt-2" style="color:var(--primary)">${esc(s.siteName)}</h1>
    <p class="text-slate-600 mt-3 max-w-2xl">รวมหน้าข้อมูลข่าวสาร ประกาศ และเอกสารเผยแพร่ของหน่วยงาน</p></div></section>
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-10"><div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
    ${pages.map(p => `<a href="/p/${esc(p.slug)}" class="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition">
      <div class="aspect-[16/8] bg-slate-100 overflow-hidden">${p.cover ? `<img src="${esc(p.cover)}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt="">` : `<div class="w-full h-full grid place-items-center text-4xl text-white/90" style="background:linear-gradient(135deg,var(--primary),#334155)">📄</div>`}</div>
      <div class="p-5"><h2 class="font-semibold text-lg text-slate-900">${esc(p.title)}</h2>${p.description ? `<p class="text-sm text-slate-500 mt-1 line-clamp-2">${esc(p.description)}</p>` : ''}
      <div class="mt-4 text-sm font-medium" style="color:var(--primary)">อ่านต่อ →</div></div></a>`).join('') || '<p class="text-slate-500">ยังไม่มีหน้าเผยแพร่</p>'}
    </div></div>`;
  return layoutPage({ title: 'หน้าหลัก', body });
}

/* ------------------------------------------------------------------ */
/* API                                                                 */
/* ------------------------------------------------------------------ */
/** ลบไฟล์จริง (Vercel Blob หรือโฟลเดอร์ uploads/) */
async function removeMediaFile(it) {
  if (CLOUD.isBlobUrl(it.url)) { if (BLOB) await CLOUD.blobDel(it.url).catch(e => console.error('ลบไฟล์ใน Blob ไม่ได้:', e.message)); }
  else if (!CLOUD.onVercel && String(it.url).startsWith('/uploads/')) { const f = safeJoin(UPLOAD_DIR, it.url.replace(/^\/uploads\//, '')); if (f) fs.rm(f, () => {}); }
}
function newUploadName(ext) {
  const d = new Date();
  return { sub: `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`, fname: `${Date.now().toString(36)}-${uid(6)}${ext}` };
}
function mediaItem(orig, url, size, user) {
  const ext = path.extname(String(url).split('?')[0]).toLowerCase();
  const kind = /\.(png|jpe?g|gif|webp|svg)$/.test(ext) ? 'image' : /\.(mp4|webm|ogg|mov)$/.test(ext) ? 'video' : 'file';
  return { id: uid(), name: String(orig).slice(0, 200), url, kind, size, uploadedBy: user.username, createdAt: now() };
}
async function api(req, res, pathname, query) {
  const m = req.method;
  const seg = pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);

  // CSRF: state-changing requests must come from same origin
  if (m !== 'GET' && m !== 'HEAD') {
    const origin = req.headers.origin;
    let oh = null; try { oh = origin ? new URL(origin).host : null; } catch { oh = 'invalid'; }
    if (origin && oh !== req.headers.host) return json(res, 403, { error: 'ไม่อนุญาต (origin)' });
  }

  if (seg[0] === 'login' && m === 'POST') {
    const ip = clientIp(req);
    const la = loginAttempts.get(ip);
    if (la && la.until > Date.now()) return json(res, 429, { error: 'เข้าสู่ระบบผิดหลายครั้ง กรุณารอ 5 นาที' });
    const { username, password } = await readJson(req);
    const u = db.users.find(x => x.username === String(username || '').trim());
    if (!u || !verifyPassword(password, u.password)) {
      const c = (la && la.until < Date.now() ? 0 : (la ? la.count : 0)) + 1;
      loginAttempts.set(ip, { count: c, until: c >= 5 ? Date.now() + 5 * 60e3 : 0 });
      return json(res, 401, { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }
    loginAttempts.delete(ip);
    res.setHeader('Set-Cookie', sessionCookie(req, signSession(u), SESSION_HOURS * 3600));
    return json(res, 200, { user: publicUser(u) });
  }
  if (seg[0] === 'logout') {
    res.setHeader('Set-Cookie', sessionCookie(req, '', 0));
    return json(res, 200, { ok: true });
  }

  if (seg[0] === 'blob-upload' && m === 'POST') {
    if (!BLOB) return json(res, 400, { error: 'ยังไม่ได้ตั้งค่า Vercel Blob' });
    const body = await readJson(req);
    const r = await CLOUD.handleClientUpload(req, body, {
      maxBytes: CLIENT_UPLOAD_MAX,
      allowedContentTypes: ['image/*', 'video/*', 'audio/*', 'application/pdf', 'application/zip', 'text/plain', 'application/msword', 'application/vnd.*', 'application/octet-stream'],
      authorize: pathname => {
        const u = currentUser(req);
        if (!u) { const e = new Error('กรุณาเข้าสู่ระบบ'); e.status = 401; throw e; }
        if (!/^uploads\/\d{6}\/[a-z0-9-]+\.[a-z0-9]+$/.test(pathname) || !ALLOWED_UPLOAD.has(path.extname(pathname))) { const e = new Error('ชื่อไฟล์ไม่ถูกต้อง'); e.status = 400; throw e; }
      },
    });
    return json(res, 200, r);
  }

  const user = currentUser(req, res);
  if (!user) return json(res, 401, { error: 'กรุณาเข้าสู่ระบบ' });
  const isAdmin = user.role === 'admin';

  if (seg[0] === 'me') return json(res, 200, { user: publicUser(user), settings: db.settings, server: serverInfo() });

  if (seg[0] === 'stats') {
    return json(res, 200, {
      widgets: db.widgets.length, items: db.widgets.reduce((a, w) => a + w.items.length, 0),
      activeItems: db.widgets.reduce((a, w) => a + w.items.filter(i => isVisible(i)).length, 0),
      pages: db.pages.length, published: db.pages.filter(p => p.status === 'published').length,
      media: db.media.length, mediaSize: db.media.reduce((a, x) => a + (x.size || 0), 0),
      recent: [...db.widgets.map(w => ({ kind: 'widget', id: w.id, name: w.name, updatedAt: w.updatedAt })), ...db.pages.map(p => ({ kind: 'page', id: p.id, name: p.title, updatedAt: p.updatedAt }))]
        .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0, 6),
    });
  }

  /* settings */
  if (seg[0] === 'settings') {
    if (m === 'GET') return json(res, 200, db.settings);
    if (m === 'PUT') {
      if (!isAdmin) return json(res, 403, { error: 'เฉพาะผู้ดูแลระบบ' });
      const b = await readJson(req);
      Object.assign(db.settings, {
        siteName: String(b.siteName || '').slice(0, 200), siteNameEn: String(b.siteNameEn || '').slice(0, 200),
        logo: safeUrl(b.logo), primary: color(b.primary, '#1e3a5f'), accent: color(b.accent, '#b8862b'),
        footer: String(b.footer || '').slice(0, 2000), homePageId: String(b.homePageId || ''), mainIntroId: b.mainIntroId !== undefined ? String(b.mainIntroId || '') : (db.settings.mainIntroId || ''),
        publicUrl: /^https?:\/\/[^\s]+$/i.test(String(b.publicUrl || '').trim()) ? String(b.publicUrl).trim().replace(/\/+$/, '') : '',
      });
      save(); return json(res, 200, db.settings);
    }
  }

  /* widgets */
  if (seg[0] === 'widgets') {
    if (seg[1] === 'preview' && m === 'POST') {
      const b = await readJson(req);
      const w = normWidget(b);
      return send(res, 200, renderWidgetDoc(w, { full: !!b.__full }), { 'Content-Type': 'text/html; charset=utf-8' });
    }
    if (!seg[1]) {
      if (m === 'GET') return json(res, 200, db.widgets.map(w => ({ ...w, itemCount: w.items.length, activeCount: w.items.filter(i => isVisible(i)).length })));
      if (m === 'POST') {
        const b = await readJson(req);
        const w = normWidget(Object.assign({ showTitle: true, shadow: true, showCaption: true, showArrows: true, showDots: true, columns: 3, mobileColumns: 1, autoplay: 5 }, b));
        w.id = uid(); w.createdAt = now(); w.slug = uniqueSlug(db.widgets, b.slug || slugify(b.name).replace(/[ก-๙]/g, '') || 'widget');
        db.widgets.push(w); save(); return json(res, 201, w);
      }
    }
    const w = db.widgets.find(x => x.id === seg[1]);
    if (!w) return json(res, 404, { error: 'ไม่พบส่วนแสดงผล' });
    if (seg[2] === 'export' && m === 'POST') {
      const b = await readJson(req);
      let base = String(b.base || db.settings.publicUrl || `${isHttps(req) ? 'https' : 'http'}://${req.headers.host}`).trim().replace(/\/+$/, '');
      if (!/^https?:\/\/[^\s"'<>]+$/i.test(base)) base = `${isHttps(req) ? 'https' : 'http'}://${req.headers.host}`;
      return json(res, 200, exportWidget(w, { base, full: !!b.full, font: b.font !== false, inline: b.inline !== false }));
    }
    if (seg[2] === 'duplicate' && m === 'POST') {
      const c = JSON.parse(JSON.stringify(w));
      c.id = uid(); c.name += ' (สำเนา)'; c.slug = uniqueSlug(db.widgets, w.slug + '-copy'); c.createdAt = c.updatedAt = now();
      c.items.forEach(i => { i.id = uid(); });
      db.widgets.push(c); save(); return json(res, 201, c);
    }
    if (m === 'GET') return json(res, 200, w);
    if (m === 'PUT') {
      const b = await readJson(req);
      const nw = normWidget(b, w);
      nw.slug = uniqueSlug(db.widgets, b.slug || w.slug, w.id);
      Object.assign(w, nw); save(); return json(res, 200, w);
    }
    if (m === 'DELETE') { db.widgets = db.widgets.filter(x => x.id !== w.id); save(); return json(res, 200, { ok: true }); }
  }

  /* pages */
  if (seg[0] === 'pages') {
    if (!seg[1]) {
      if (m === 'GET') return json(res, 200, db.pages.map(p => ({ ...p, blockCount: p.blocks.length, blocks: undefined })));
      if (m === 'POST') {
        const b = await readJson(req);
        const p = normPage(b);
        p.id = uid(); p.createdAt = now(); p.slug = uniqueSlug(db.pages, b.slug || 'page');
        db.pages.push(p); save(); return json(res, 201, p);
      }
    }
    const p = db.pages.find(x => x.id === seg[1]);
    if (!p) return json(res, 404, { error: 'ไม่พบหน้าเว็บ' });
    if (seg[2] === 'duplicate' && m === 'POST') {
      const c = JSON.parse(JSON.stringify(p));
      c.id = uid(); c.title += ' (สำเนา)'; c.slug = uniqueSlug(db.pages, p.slug + '-copy'); c.status = 'draft'; c.createdAt = c.updatedAt = now();
      db.pages.push(c); save(); return json(res, 201, c);
    }
    if (m === 'GET') return json(res, 200, p);
    if (m === 'PUT') {
      const b = await readJson(req);
      const np = normPage(b, p);
      np.slug = uniqueSlug(db.pages, b.slug || p.slug, p.id);
      Object.assign(p, np); save(); return json(res, 200, p);
    }
    if (m === 'DELETE') {
      db.pages = db.pages.filter(x => x.id !== p.id);
      if (db.settings.homePageId === p.id) db.settings.homePageId = '';
      save(); return json(res, 200, { ok: true });
    }
  }

  /* media */
  if (seg[0] === 'media') {
    if (!seg[1] && m === 'GET') {
      // บอกว่าไฟล์ไหนถูกใช้อยู่ที่ใด (ส่วนแสดงผล / หน้าเว็บ / หน้า Intro / ตั้งค่า)
      const places = [...db.widgets.map(x => ['ส่วนแสดงผล', x.name, JSON.stringify(x)]), ...db.pages.map(x => ['หน้าเว็บ', x.title, JSON.stringify(x)]),
        ...db.intros.map(x => ['หน้า Intro', x.name, JSON.stringify(x)]), ['ตั้งค่าเว็บไซต์', 'โลโก้', JSON.stringify(db.settings)]];
      return json(res, 200, [...db.media].reverse().map(x => ({ ...x, usedIn: places.filter(p => p[2].includes(x.url)).map(p => `${p[0]}: ${p[1]}`) })));
    }
    if (seg[1] === 'bulk-delete' && m === 'POST') {
      const b = await readJson(req);
      const ids = new Set(Array.isArray(b.ids) ? b.ids.map(String) : []);
      const del = db.media.filter(x => ids.has(x.id));
      for (const it of del) await removeMediaFile(it);
      db.media = db.media.filter(x => !ids.has(x.id)); save();
      return json(res, 200, { ok: true, deleted: del.length });
    }
    if (seg[1] === 'register' && m === 'POST') {
      // หลังเบราว์เซอร์อัปโหลดตรงไป Vercel Blob แล้ว ให้บันทึกรายการลงคลังสื่อ
      if (!BLOB) return json(res, 400, { error: 'ยังไม่ได้ตั้งค่า Vercel Blob' });
      const b = await readJson(req);
      if (!CLOUD.isBlobUrl(b.url)) return json(res, 400, { error: 'ที่อยู่ไฟล์ไม่ถูกต้อง' });
      const item = mediaItem(String(b.name || 'file'), String(b.url), Number(b.size) || 0, user);
      db.media.push(item); save(); return json(res, 201, item);
    }
    if (!seg[1] && m === 'POST') {
      const orig = decodeURIComponent(String(req.headers['x-filename'] || 'file'));
      const ext = path.extname(orig).toLowerCase();
      if (!ALLOWED_UPLOAD.has(ext)) return json(res, 400, { error: `ไม่รองรับไฟล์ประเภท ${ext || '(ไม่มีนามสกุล)'}` });
      if (!BLOB && CLOUD.onVercel) return json(res, 503, { error: process.env.BLOB_STORE_ID
        ? 'เชื่อม Blob store แล้ว แต่ยังไม่มี BLOB_READ_WRITE_TOKEN — ไปที่ Vercel → Storage → Blob store → คัดลอกค่า BLOB_READ_WRITE_TOKEN (ขึ้นต้น vercel_blob_rw_) → Settings → Environment Variables → เพิ่มชื่อ BLOB_READ_WRITE_TOKEN (ทุก Environment) แล้วกด Redeploy'
        : 'ยังไม่ได้เชื่อม Vercel Blob กับโปรเจกต์นี้ (ไม่พบ BLOB_READ_WRITE_TOKEN) — ไปที่ Vercel → Storage → Blob → Connect กับโปรเจกต์ แล้วกด Redeploy' });
      const len = parseInt(req.headers['content-length'] || '0', 10);
      const { sub, fname } = newUploadName(ext);
      if (BLOB) {
        if (len > SERVER_PUT_MAX) return json(res, 413, { error: 'ไฟล์ใหญ่กว่า 4 MB ต้องอัปโหลดตรง (รีเฟรชหน้าหลังบ้านแล้วลองใหม่)' });
        const buf = await readBody(req, SERVER_PUT_MAX + 1024);
        const url = await CLOUD.blobPut(`uploads/${sub}/${fname}`, buf, MIME[ext] || 'application/octet-stream');
        const item = mediaItem(orig, url, buf.length, user);
        db.media.push(item); save(); return json(res, 201, item);
      }
      if (len > MAX_UPLOAD) return json(res, 413, { error: 'ไฟล์มีขนาดเกิน 200MB' });
      fs.mkdirSync(path.join(UPLOAD_DIR, sub), { recursive: true });
      const dest = path.join(UPLOAD_DIR, sub, fname);
      await new Promise((resolve, reject) => {
        let size = 0;
        const ws = fs.createWriteStream(dest);
        req.on('data', c => { size += c.length; if (size > MAX_UPLOAD) { req.destroy(); ws.destroy(); fs.rm(dest, () => {}); reject(new Error('ไฟล์ใหญ่เกินไป')); } });
        req.pipe(ws); ws.on('finish', resolve); ws.on('error', reject);
      });
      const st = fs.statSync(dest);
      const item = mediaItem(orig, `/uploads/${sub}/${fname}`, st.size, user);
      db.media.push(item); save(); return json(res, 201, item);
    }
    const it = db.media.find(x => x.id === seg[1]);
    if (!it) return json(res, 404, { error: 'ไม่พบไฟล์' });
    if (m === 'DELETE') {
      await removeMediaFile(it);
      db.media = db.media.filter(x => x.id !== it.id); save(); return json(res, 200, { ok: true });
    }
    if (m === 'PUT') { const b = await readJson(req); it.name = String(b.name || it.name).slice(0, 200); save(); return json(res, 200, it); }
  }

  if (seg[0] === 'templates') {
    if (m === 'GET') return json(res, 200, { templates: TEMPLATES, themes: Object.entries(THEMES).map(([id, v]) => ({ id, name: v.name, main: v.main, acc: v.acc })) });
    if (m === 'POST') {
      const b = await readJson(req);
      const tid = TEMPLATES.some(t => t.id === b.template) ? b.template : TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)].id;
      const th = THEMES[b.theme] ? b.theme : Object.keys(THEMES)[Math.floor(Math.random() * 5)];
      const r = makeTemplate(tid, th, b.title);
      db.widgets.push(...r.widgets); db.pages.push(r.page); save();
      return json(res, 201, { page: { id: r.page.id, slug: r.page.slug, title: r.page.title }, widgets: r.widgets.length, template: tid, theme: th });
    }
  }
  if (seg[0] === 'demo' && m === 'POST') {
    const d = makeDemo(db.widgets);
    db.widgets.push(...d);
    const pg = demoPage(d); pg.slug = uniqueSlug(db.pages, pg.slug); db.pages.push(pg);
    save(); return json(res, 201, { widgets: d.map(w => ({ id: w.id, name: w.name })), page: pg.slug });
  }

  /* intro pages */
  if (seg[0] === 'intros') {
    if (seg[1] === 'preview' && m === 'POST') { const b = await readJson(req); return send(res, 200, renderIntro(normIntro(b), { preview: true }), { 'Content-Type': 'text/html; charset=utf-8' }); }
    if (seg[1] === 'demo' && m === 'POST') { const it = demoIntro(db.intros); db.intros.push(it); save(); return json(res, 201, it); }
    if (!seg[1]) {
      if (m === 'GET') return json(res, 200, db.intros.map(x => ({ ...x, isMain: db.settings.mainIntroId === x.id })));
      if (m === 'POST') {
        const b = await readJson(req);
        const it = normIntro(Object.assign({ buttons: [{ title: 'เข้าสู่เว็บไซต์', iconFa: 'fa-solid fa-arrow-right-to-bracket', link: '/', style: UB.PRESETS.find(p => p.id === 'gold').style }] }, b));
        it.id = uid(); it.createdAt = now(); it.slug = uniqueSlug(db.intros, b.slug || 'intro');
        db.intros.push(it); if (!db.settings.mainIntroId) db.settings.mainIntroId = it.id; save(); return json(res, 201, it);
      }
    }
    const it = db.intros.find(x => x.id === seg[1]);
    if (!it) return json(res, 404, { error: 'ไม่พบหน้า Intro' });
    if (seg[2] === 'main' && m === 'POST') { db.settings.mainIntroId = it.id; save(); return json(res, 200, { ok: true }); }
    if (seg[2] === 'duplicate' && m === 'POST') { const c = JSON.parse(JSON.stringify(it)); c.id = uid(); c.name += ' (สำเนา)'; c.slug = uniqueSlug(db.intros, it.slug + '-copy'); c.createdAt = c.updatedAt = now(); db.intros.push(c); save(); return json(res, 201, c); }
    if (seg[2] === 'export' && m === 'POST') {
      const b = await readJson(req);
      let base = String(b.base || db.settings.publicUrl || `${isHttps(req) ? 'https' : 'http'}://${req.headers.host}`).trim().replace(/\/+$/, '');
      if (!/^https?:\/\/[^\s"'<>]+$/i.test(base)) base = `${isHttps(req) ? 'https' : 'http'}://${req.headers.host}`;
      return json(res, 200, exportIntro(it, base));
    }
    if (m === 'GET') return json(res, 200, it);
    if (m === 'PUT') { const b = await readJson(req); const n = normIntro(b, it); n.slug = uniqueSlug(db.intros, b.slug || it.slug, it.id); Object.assign(it, n); save(); return json(res, 200, it); }
    if (m === 'DELETE') { db.intros = db.intros.filter(x => x.id !== it.id); if (db.settings.mainIntroId === it.id) db.settings.mainIntroId = db.intros[0] ? db.intros[0].id : ''; save(); return json(res, 200, { ok: true }); }
  }

  /* saved button styles */
  if (seg[0] === 'button-presets') {
    db.buttonPresets = db.buttonPresets || [];
    if (!seg[1] && m === 'GET') return json(res, 200, db.buttonPresets);
    if (!seg[1] && m === 'POST') {
      const b = await readJson(req);
      const p = { id: uid(), name: String(b.name || 'สไตล์ของฉัน').slice(0, 60), iconFa: safeFa(b.iconFa), style: UB.norm(b.style), createdBy: user.username, createdAt: now() };
      db.buttonPresets.push(p); save(); return json(res, 201, p);
    }
    if (seg[1] && m === 'DELETE') { db.buttonPresets = db.buttonPresets.filter(x => x.id !== seg[1]); save(); return json(res, 200, { ok: true }); }
  }

  /* account */
  if (seg[0] === 'account' && seg[1] === 'password' && m === 'PUT') {
    const { current, next } = await readJson(req);
    if (!verifyPassword(current, user.password)) return json(res, 400, { error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
    if (String(next || '').length < 8) return json(res, 400, { error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร' });
    user.password = hashPassword(next); save(); return json(res, 200, { ok: true });
  }

  /* users (admin only) */
  if (seg[0] === 'users') {
    if (!isAdmin) return json(res, 403, { error: 'เฉพาะผู้ดูแลระบบ' });
    if (!seg[1] && m === 'GET') return json(res, 200, db.users.map(publicUser));
    if (!seg[1] && m === 'POST') {
      const b = await readJson(req);
      const username = String(b.username || '').trim();
      if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(username)) return json(res, 400, { error: 'ชื่อผู้ใช้ต้องเป็น a-z, 0-9, _ . - ยาว 3-32 ตัว' });
      if (db.users.some(u => u.username === username)) return json(res, 400, { error: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' });
      if (String(b.password || '').length < 8) return json(res, 400, { error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' });
      const u = { id: uid(), username, name: String(b.name || username).slice(0, 100), role: b.role === 'admin' ? 'admin' : 'editor', password: hashPassword(b.password), createdAt: now() };
      db.users.push(u); save(); return json(res, 201, publicUser(u));
    }
    const u = db.users.find(x => x.id === seg[1]);
    if (!u) return json(res, 404, { error: 'ไม่พบผู้ใช้' });
    if (m === 'PUT') {
      const b = await readJson(req);
      if (b.name !== undefined) u.name = String(b.name).slice(0, 100);
      if (b.role && u.id !== user.id) u.role = b.role === 'admin' ? 'admin' : 'editor';
      if (b.password) { if (String(b.password).length < 8) return json(res, 400, { error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' }); u.password = hashPassword(b.password); }
      save(); return json(res, 200, publicUser(u));
    }
    if (m === 'DELETE') {
      if (u.id === user.id) return json(res, 400, { error: 'ไม่สามารถลบบัญชีของตนเองได้' });
      db.users = db.users.filter(x => x.id !== u.id);
      save(); return json(res, 200, { ok: true });
    }
  }

  /* backup */
  if (seg[0] === 'backup' && m === 'GET') {
    if (!isAdmin) return json(res, 403, { error: 'เฉพาะผู้ดูแลระบบ' });
    const data = JSON.stringify({ ...db, users: db.users.map(u => ({ ...u })) }, null, 2);
    return send(res, 200, data, { 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="backup-${new Date().toISOString().slice(0, 10)}.json"` });
  }
  if (seg[0] === 'restore' && m === 'POST') {
    if (!isAdmin) return json(res, 403, { error: 'เฉพาะผู้ดูแลระบบ' });
    const b = JSON.parse((await readBody(req, 50 * 1024 * 1024)).toString('utf8'));
    if (!Array.isArray(b.widgets) || !Array.isArray(b.pages) || !Array.isArray(b.users) || !b.users.length) return json(res, 400, { error: 'ไฟล์สำรองไม่ถูกต้อง' });
    if (NEON) await CLOUD.dbBackup(db, 'before-restore');
    else fs.copyFileSync(DB_FILE, DB_FILE.replace(/\.json$/, `.before-restore-${Date.now()}.json`));
    db = b; loadDbDefaults(); saveNow();
    return json(res, 200, { ok: true });
  }

  return json(res, 404, { error: 'ไม่พบ API' });
}
function serverInfo() {
  const mode = { db: CLOUD.dbMode, storage: CLOUD.storage, cloud: CLOUD.onVercel, uploadDirectMax: BLOB ? SERVER_PUT_MAX : MAX_UPLOAD };
  if (CLOUD.onVercel) return Object.assign(mode, { port: 443, hostname: 'vercel', ips: [], urls: [] });
  return Object.assign(mode, serverInfoLocal());
}
function serverInfoLocal() {
  const nets = require('os').networkInterfaces();
  const ips = Object.values(nets).flat().filter(n => n && n.family === 'IPv4' && !n.internal).map(n => n.address);
  return { port: PORT, hostname: require('os').hostname(), ips, urls: ips.map(ip => `http://${ip}${PORT === 80 ? '' : ':' + PORT}`) };
}
function loadDbDefaults() {
  db.settings = Object.assign(seed().settings, db.settings || {});
  for (const k of ['users', 'widgets', 'pages', 'media', 'buttonPresets', 'intros']) db[k] = db[k] || [];
}

/* ------------------------------------------------------------------ */
/* Router                                                              */
/* ------------------------------------------------------------------ */
async function route(req, res) {
  const u = new URL(req.url, 'http://x');
  let pathname;
  try { pathname = decodeURIComponent(u.pathname); } catch { return send(res, 400, 'Bad request'); }
  try {
    // ไฟล์คงที่ไม่ต้องใช้ฐานข้อมูล
    if (pathname.startsWith('/assets/')) {
      const f = safeJoin(path.join(PUBLIC_DIR, 'assets'), pathname.slice('/assets/'.length));
      return f ? serveFile(req, res, f) : notFound(res);
    }
    if (pathname === '/admin' || pathname === '/admin/') {
      return serveFile(req, res, path.join(PUBLIC_DIR, 'admin', 'index.html'), { cache: 'no-cache', frameable: false });
    }
    if (pathname.startsWith('/admin/')) {
      const f = safeJoin(path.join(PUBLIC_DIR, 'admin'), pathname.slice('/admin/'.length));
      return f ? serveFile(req, res, f, { cache: 'no-cache', frameable: false }) : notFound(res);
    }
    if (pathname === '/favicon.ico') return serveFile(req, res, path.join(PUBLIC_DIR, 'assets', 'logo.svg'));
    if (!NEON && !db) return send(res, 503, setupNeededPage(), { 'Content-Type': 'text/html; charset=utf-8' });
    await ensureDb({ fresh: pathname.startsWith('/api/') });
    if (pathname.startsWith('/api/')) return await api(req, res, pathname, u.searchParams);

    if (pathname.startsWith('/embed/')) {
      const slug = pathname.split('/')[2];
      const w = db.widgets.find(x => x.slug === slug);
      if (!w) return send(res, 404, '<!doctype html><meta charset="utf-8"><p style="font-family:sans-serif;color:#94a3b8;text-align:center;padding:20px">ไม่พบส่วนแสดงผล</p>', { 'Content-Type': 'text/html; charset=utf-8' });
      return send(res, 200, renderWidgetDoc(w, { full: u.searchParams.get('full') === '1' }), { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
    }
    if (pathname.startsWith('/uploads/')) {
      if (BLOB || CLOUD.onVercel) return notFound(res, 'ไฟล์นี้อยู่ในเครื่องแม่ข่ายเดิม — ย้ายไฟล์ขึ้น Vercel Blob ด้วยสคริปต์ย้ายข้อมูล');
      const f = safeJoin(UPLOAD_DIR, pathname.slice('/uploads/'.length));
      return f ? serveFile(req, res, f, { cache: 'public, max-age=604800' }) : notFound(res);
    }
    if (pathname === '/intro' || pathname === '/intro/' || pathname.startsWith('/intro/')) {
      const slug = pathname.split('/')[2];
      const it = slug ? db.intros.find(x => x.slug === slug) : (db.intros.find(x => x.id === db.settings.mainIntroId) || db.intros[0]);
      if (!it) return notFound(res, 'ยังไม่มีหน้า Intro');
      return send(res, 200, renderIntro(it), { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
    }
    if (pathname.startsWith('/p/')) {
      const slug = pathname.split('/')[2];
      const p = db.pages.find(x => x.slug === slug);
      const preview = !!currentUser(req);
      if (!p || (p.status !== 'published' && !preview)) return notFound(res);
      return send(res, 200, renderPage(p, preview), { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
    }
    if (pathname === '/') return send(res, 200, renderHome(), { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
    return notFound(res);
  } catch (e) {
    console.error(e);
    if (!res.headersSent) json(res, e.status || 500, { error: e.message || 'เกิดข้อผิดพลาด' });
  }
}
function setupNeededPage() {
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ตั้งค่าระบบ</title>
<div style="font-family:Sarabun,Tahoma,sans-serif;max-width:640px;margin:60px auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;line-height:1.7">
<h2 style="color:#1e3a5f;margin-top:0">ยังไม่ได้เชื่อมต่อฐานข้อมูล Neon</h2>
<p>บน Vercel ต้องตั้งค่าตัวแปร <b>DATABASE_URL</b> (และ <b>BLOB_READ_WRITE_TOKEN</b> สำหรับอัปโหลดไฟล์) ที่ Project → Settings → Environment Variables แล้วกด Redeploy</p>
<p style="color:#64748b">ดูขั้นตอนเต็มในไฟล์ DEPLOY-VERCEL.md</p></div>`;
}

/**
 * ตัวจัดการคำขอ (ใช้ได้ทั้ง http.createServer และ Vercel Function)
 * โหมด Neon: ถ้าคำขอนี้แก้ไขข้อมูล จะบันทึกลงฐานข้อมูลให้เสร็จก่อนส่งคำตอบ
 */
let queue = Promise.resolve();
function handler(req, res) {
  if (!NEON) return route(req, res);
  // ทำทีละคำขอในอินสแตนซ์เดียวกัน เพื่อไม่ให้ข้อมูลในหน่วยความจำชนกัน
  const run = () => new Promise(resolve => {
    const writeHead = res.writeHead.bind(res), end = res.end.bind(res);
    let head = null, ended = false;
    res.writeHead = (...a) => { if (dbDirty) { head = a; return res; } return writeHead(...a); };
    res.end = (...a) => {
      if (ended) return res; ended = true;
      if (!dbDirty && !head) { end(...a); resolve(); return res; }
      flushDb().then(() => { if (head) writeHead(...head); end(...a); },
        e => {
          console.error('บันทึกข้อมูลไม่สำเร็จ:', e.message);
          res.removeHeader('Set-Cookie');
          writeHead(e.status || 500, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
          end(JSON.stringify({ error: e.status === 409 ? e.message : 'บันทึกข้อมูลลงฐานข้อมูลไม่สำเร็จ: ' + e.message }));
        }).finally(resolve);
      return res;
    };
    res.on('close', resolve);
    route(req, res).catch(e => { console.error(e); if (!res.headersSent) json(res, 500, { error: e.message }); });
  });
  const p = queue.then(run, run);
  queue = p.catch(() => {});
  return p;
}
module.exports = { handler };
module.exports.default = handler;

function seedDemo() { const d = makeDemo(db.widgets); db.widgets.push(...d); db.pages.push(demoPage(d)); const di = demoIntro(db.intros); db.intros.push(di); db.settings.mainIntroId = di.id; }
if (FRESH_INSTALL) { seedDemo(); saveNow(); }

if (require.main !== module) return;
const server = http.createServer(handler);

// ติดตั้งใหม่: เพิ่มชุดตัวอย่าง (ทำหลังประกาศฟังก์ชันทั้งหมดแล้ว)

server.on('error', e => {
  if (e.code === 'EADDRINUSE') console.error(`\n  ✖ พอร์ต ${PORT} ถูกโปรแกรมอื่นใช้อยู่ — แก้ค่า "port" ใน config.json แล้วเปิดใหม่\n`);
  else if (e.code === 'EACCES') console.error(`\n  ✖ ไม่มีสิทธิ์ใช้พอร์ต ${PORT} — ลองพอร์ตที่มากกว่า 1024 หรือรันด้วยสิทธิ์ผู้ดูแลระบบ\n`);
  else console.error(e);
  process.exit(1);
});
server.listen(PORT, HOST, () => {
  const nets = require('os').networkInterfaces();
  const ips = Object.values(nets).flat().filter(n => n && n.family === 'IPv4' && !n.internal).map(n => n.address);
  console.log('\n  UDTC Display Manager พร้อมใช้งาน');
  console.log(`  [${new Date().toLocaleString('th-TH')}] เริ่มทำงานที่ ${HOST}:${PORT}`);
  console.log(`  ▸ หน้าเว็บ     http://localhost:${PORT}/`);
  console.log(`  ▸ หลังบ้าน     http://localhost:${PORT}/admin`);
  ips.forEach(ip => console.log(`  ▸ เครื่องลูกข่าย http://${ip}:${PORT}/   (หลังบ้าน http://${ip}:${PORT}/admin)`));
  console.log(`  ▸ ฐานข้อมูล: ${NEON ? 'Neon (คลาวด์)' : 'data/db.json'} · ไฟล์อัปโหลด: ${BLOB ? 'Vercel Blob (คลาวด์)' : 'โฟลเดอร์ uploads/'}`);
  console.log('  (กด Ctrl+C เพื่อหยุด)\n');
});
process.on('SIGINT', () => { clearTimeout(saveTimer); saveNow(); process.exit(0); });
process.on('SIGTERM', () => { clearTimeout(saveTimer); saveNow(); process.exit(0); });
