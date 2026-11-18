#!/usr/bin/env node
/**
 * ย้ายข้อมูลจากเครื่องแม่ข่ายเดิม (data/db.json + uploads/) ขึ้น Neon + Vercel Blob
 *
 *   1) npm install
 *   2) คัดลอก .env.example เป็น .env แล้วใส่ DATABASE_URL และ BLOB_READ_WRITE_TOKEN
 *   3) node scripts/migrate-to-cloud.js --dry-run     (ทดลอง ไม่เขียนอะไร)
 *      node scripts/migrate-to-cloud.js               (ย้ายจริง)
 *
 * ตัวเลือก
 *   --dry-run                 แสดงสิ่งที่จะทำ ไม่อัปโหลด/ไม่เขียนฐานข้อมูล
 *   --force                   เขียนทับข้อมูลใน Neon ที่มีอยู่แล้ว (สำรองชุดเดิมไว้ในตาราง app_backup ก่อน)
 *   --skip-files              ไม่อัปโหลดไฟล์ (ใช้เมื่อเคยอัปโหลดแล้ว — ยังต้องมีไฟล์ data/blob-map.json)
 *   --public-url=https://...  ที่อยู่เว็บบน Vercel (ใช้สร้างโค้ดฝัง) — ถ้าไม่ระบุ จะล้างค่าที่เป็น IP ภายใน
 *   --db=path --uploads=path  ระบุตำแหน่งไฟล์เอง (ค่าเริ่มต้น data/db.json และ uploads/)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
require('../lib/env.js')(ROOT);
const { createCloud } = require('../lib/cloud.js');

const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, ...v] = a.replace(/^--/, '').split('='); return [k, v.length ? v.join('=') : true]; }));
const DRY = !!args['dry-run'];
const DB_PATH = path.resolve(ROOT, args.db || 'data/db.json');
const UP_DIR = path.resolve(ROOT, args.uploads || 'uploads');
const MAP_FILE = path.join(path.dirname(DB_PATH), 'blob-map.json');
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.ogg': 'video/ogg', '.mov': 'video/quicktime', '.mp3': 'audio/mpeg', '.pdf': 'application/pdf',
  '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation', '.zip': 'application/zip', '.txt': 'text/plain; charset=utf-8' };

const fmt = b => b < 1048576 ? (b / 1024).toFixed(0) + ' KB' : (b / 1048576).toFixed(1) + ' MB';
const die = m => { console.error('\n  ✖ ' + m + '\n'); process.exit(1); };

function walk(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return walk(p, base);
    return e.isFile() ? [path.relative(base, p).split(path.sep).join('/')] : [];
  });
}

(async () => {
  console.log('\n  ย้ายข้อมูล UDTC Display Manager → Neon + Vercel Blob' + (DRY ? '  (ทดลอง — ไม่เขียนจริง)' : ''));
  const cloud = createCloud({});
  if (cloud.dbMode !== 'neon') die('ไม่พบ DATABASE_URL — ใส่ในไฟล์ .env หรือตัวแปรแวดล้อม');
  if (cloud.storage !== 'blob' && !args['skip-files']) die('ไม่พบ BLOB_READ_WRITE_TOKEN — ใส่ในไฟล์ .env หรือใช้ --skip-files');
  if (!fs.existsSync(DB_PATH)) die('ไม่พบไฟล์ ' + DB_PATH);
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  console.log(`  ▸ ข้อมูล: ส่วนแสดงผล ${(db.widgets || []).length} · หน้าเว็บ ${(db.pages || []).length} · หน้า Intro ${(db.intros || []).length} · ผู้ใช้ ${(db.users || []).length} · คลังสื่อ ${(db.media || []).length}`);

  // 1) ตรวจฐานข้อมูลปลายทาง
  const existing = await cloud.dbLoad();
  if (existing && !args.force) die('ใน Neon มีข้อมูลอยู่แล้ว (อาจเป็นชุดตัวอย่างที่สร้างตอนเปิดเว็บครั้งแรก)\n    ถ้าต้องการแทนที่ด้วยข้อมูลจากเครื่องเดิม ให้รันใหม่พร้อม --force (ระบบจะสำรองชุดเดิมไว้ให้)');

  // 2) อัปโหลดไฟล์
  let map = {};
  try { map = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8')); } catch {}
  const files = walk(UP_DIR);
  const todo = args['skip-files'] ? [] : files.filter(f => !map[f]);
  const total = todo.reduce((a, f) => a + fs.statSync(path.join(UP_DIR, f)).size, 0);
  console.log(`  ▸ ไฟล์ใน uploads/: ${files.length} ไฟล์ · ต้องอัปโหลด ${todo.length} ไฟล์ (${fmt(total)})${files.length - todo.length ? ` · ข้าม ${files.length - todo.length} ไฟล์ที่เคยอัปแล้ว` : ''}`);
  let done = 0, failed = 0;
  const worker = async () => {
    while (todo.length) {
      const rel = todo.shift();
      const full = path.join(UP_DIR, rel);
      const ext = path.extname(rel).toLowerCase();
      try {
        if (!DRY) {
          map[rel] = await cloud.blobPut('uploads/' + rel, fs.readFileSync(full), MIME[ext] || 'application/octet-stream');
          fs.writeFileSync(MAP_FILE, JSON.stringify(map, null, 2));
        } else map[rel] = 'https://(ทดลอง).public.blob.vercel-storage.com/uploads/' + rel;
        done++;
        process.stdout.write(`\r    ${DRY ? 'จะอัปโหลด' : 'อัปโหลดแล้ว'} ${done} ไฟล์${failed ? ` · ผิดพลาด ${failed}` : ''}   `);
      } catch (e) { failed++; console.error(`\n    ✖ ${rel}: ${e.message}`); }
    }
  };
  await Promise.all(Array.from({ length: 4 }, worker));
  if (done || failed) console.log('');
  if (failed) die(`อัปโหลดไม่สำเร็จ ${failed} ไฟล์ — รันคำสั่งเดิมอีกครั้ง ระบบจะอัปต่อเฉพาะไฟล์ที่ยังขาด`);

  // 3) เปลี่ยนที่อยู่ไฟล์ในข้อมูล  /uploads/202611/x.png  หรือ  http://10.34.20.10:8090/uploads/...  →  https://...blob.vercel-storage.com/uploads/...
  let replaced = 0;
  const missing = new Set();
  let text = JSON.stringify(db);
  text = text.replace(/(?:https?:\/\/[^"'\s()<>\\]*?)?\/uploads\/([^"'\s()<>\\?#]+)/g, (m, rel) => {
    let r = rel; try { r = decodeURIComponent(rel); } catch {}
    if (map[r]) { replaced++; return map[r]; }
    if (/^\d{6}\//.test(r)) missing.add(r);
    return m;
  });
  const out = JSON.parse(text);
  out.settings = out.settings || {};
  const pub = typeof args['public-url'] === 'string' ? args['public-url'].trim().replace(/\/+$/, '') : '';
  if (pub) out.settings.publicUrl = pub;
  else if (/\/\/(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(out.settings.publicUrl || '')) out.settings.publicUrl = '';
  console.log(`  ▸ เปลี่ยนที่อยู่ไฟล์ในข้อมูล ${replaced} จุด`);
  if (missing.size) console.log(`  ⚠ อ้างถึงไฟล์ที่ไม่พบใน uploads/ ${missing.size} ไฟล์ (จะแสดงไม่ได้): ${[...missing].slice(0, 5).join(', ')}${missing.size > 5 ? ' ...' : ''}`);

  // 4) บันทึกลง Neon
  if (DRY) { console.log('\n  ✓ ทดลองเสร็จ — รันอีกครั้งโดยไม่ใส่ --dry-run เพื่อย้ายจริง\n'); return; }
  if (existing) { await cloud.dbBackup(existing.data, 'before-migrate'); console.log('  ▸ สำรองข้อมูลเดิมใน Neon ไว้ที่ตาราง app_backup แล้ว'); }
  const v = await cloud.dbForceSave(out);
  fs.writeFileSync(path.join(path.dirname(DB_PATH), 'db.cloud.json'), JSON.stringify(out, null, 2));
  console.log(`  ✓ บันทึกลง Neon แล้ว (เวอร์ชัน ${v}) · สำเนาที่ส่งขึ้นไป: ${path.relative(ROOT, path.join(path.dirname(DB_PATH), 'db.cloud.json'))}`);
  console.log('  ✓ เสร็จสิ้น — เปิดเว็บบน Vercel แล้วเข้าสู่ระบบด้วยบัญชีเดิมได้เลย\n');
})().catch(e => die(e.stack || e.message));
