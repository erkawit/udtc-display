/**
 * โหมดคลาวด์: Neon (ฐานข้อมูล) + Vercel Blob (ไฟล์ภาพ/วิดีโอ)
 *
 * เปิดใช้อัตโนมัติเมื่อมีตัวแปรแวดล้อม
 *   DATABASE_URL           → เก็บข้อมูลใน Neon (PostgreSQL) แทน data/db.json
 *   BLOB_READ_WRITE_TOKEN  → เก็บไฟล์อัปโหลดใน Vercel Blob แทนโฟลเดอร์ uploads/
 * ถ้าไม่มี ระบบทำงานแบบเดิมบนเครื่องแม่ข่าย (ไม่ต้องติดตั้งแพ็กเกจใดๆ)
 *
 * ข้อมูลทั้งระบบเก็บเป็น JSON ก้อนเดียวในตาราง app_state (ข้อมูลระบบนี้เล็ก — ไม่กี่ร้อย KB)
 * พร้อมเลขเวอร์ชันกันการเขียนทับกันเมื่อแก้จากหลายเครื่องพร้อมกัน
 */
'use strict';

function cfg(CONFIG, envKey, cfgKey) {
  return String(process.env[envKey] || (CONFIG && CONFIG[cfgKey]) || '').trim();
}

function createCloud(CONFIG) {
  const DATABASE_URL = cfg(CONFIG, 'DATABASE_URL', 'databaseUrl') || cfg(CONFIG, 'POSTGRES_URL', 'postgresUrl');
  // ปกติชื่อ BLOB_READ_WRITE_TOKEN แต่ถ้าตอนเชื่อม Blob store ตั้ง prefix เอง ชื่อจะเป็น <PREFIX>_READ_WRITE_TOKEN
  const BLOB_TOKEN = cfg(CONFIG, 'BLOB_READ_WRITE_TOKEN', 'blobToken') || (() => {
    const k = Object.keys(process.env).find(k => /_READ_WRITE_TOKEN$/.test(k) && /^vercel_blob_rw_/.test(process.env[k] || ''));
    return k ? String(process.env[k]).trim() : '';
  })();
  const cloud = {
    dbMode: DATABASE_URL ? 'neon' : 'file',
    storage: BLOB_TOKEN ? 'blob' : 'disk',
    onVercel: !!process.env.VERCEL,
  };

  /* ---------------- Neon ---------------- */
  let _sql = null;
  function sql() {
    if (_sql) return _sql;
    let neon;
    try { ({ neon } = require('@neondatabase/serverless')); }
    catch { throw new Error('ไม่พบแพ็กเกจ @neondatabase/serverless — รัน npm install ก่อน'); }
    _sql = neon(DATABASE_URL);
    return _sql;
  }
  const q = (text, params = []) => sql().query(text, params);
  let tableReady = false;
  async function ensureTable() {
    if (tableReady) return;
    await q(`CREATE TABLE IF NOT EXISTS app_state (
      id integer PRIMARY KEY,
      data jsonb NOT NULL,
      version integer NOT NULL DEFAULT 1,
      updated_at timestamptz NOT NULL DEFAULT now())`);
    await q(`CREATE TABLE IF NOT EXISTS app_backup (
      id serial PRIMARY KEY,
      note text,
      data jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now())`);
    tableReady = true;
  }
  cloud.dbVersion = async () => {
    await ensureTable();
    const r = await q('SELECT version FROM app_state WHERE id = 1');
    return r[0] ? Number(r[0].version) : 0;
  };
  cloud.dbLoad = async () => {
    await ensureTable();
    const r = await q('SELECT data, version FROM app_state WHERE id = 1');
    if (!r[0]) return null;
    const data = typeof r[0].data === 'string' ? JSON.parse(r[0].data) : r[0].data;
    return { data, version: Number(r[0].version) };
  };
  /** บันทึกเมื่อเวอร์ชันตรงกันเท่านั้น — คืนเวอร์ชันใหม่ หรือ null ถ้ามีคนอื่นบันทึกไปก่อน */
  cloud.dbSave = async (data, version) => {
    await ensureTable();
    const json = JSON.stringify(data);
    if (!version) {
      const r = await q(`INSERT INTO app_state (id, data, version) VALUES (1, $1::jsonb, 1)
                         ON CONFLICT (id) DO NOTHING RETURNING version`, [json]);
      return r[0] ? Number(r[0].version) : null;
    }
    const r = await q(`UPDATE app_state SET data = $1::jsonb, version = version + 1, updated_at = now()
                       WHERE id = 1 AND version = $2 RETURNING version`, [json, version]);
    return r[0] ? Number(r[0].version) : null;
  };
  /** เขียนทับโดยไม่สนเวอร์ชัน (ใช้ตอนกู้คืน/ย้ายข้อมูล) */
  cloud.dbForceSave = async (data) => {
    await ensureTable();
    const r = await q(`INSERT INTO app_state (id, data, version) VALUES (1, $1::jsonb, 1)
                       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, version = app_state.version + 1, updated_at = now()
                       RETURNING version`, [JSON.stringify(data)]);
    return Number(r[0].version);
  };
  cloud.dbBackup = async (data, note) => {
    await ensureTable();
    await q('INSERT INTO app_backup (note, data) VALUES ($1, $2::jsonb)', [String(note || ''), JSON.stringify(data)]);
    // เก็บไว้ 20 ชุดล่าสุด
    await q('DELETE FROM app_backup WHERE id NOT IN (SELECT id FROM app_backup ORDER BY id DESC LIMIT 20)');
  };

  /* ---------------- Vercel Blob ---------------- */
  function blobLib() {
    try { return require('@vercel/blob'); }
    catch { throw new Error('ไม่พบแพ็กเกจ @vercel/blob — รัน npm install ก่อน'); }
  }
  cloud.blobPut = async (pathname, body, contentType) => {
    const { put } = blobLib();
    const r = await put(pathname, body, { access: 'public', contentType, token: BLOB_TOKEN, addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 31536000 });
    return r.url;
  };
  cloud.blobDel = async (url) => {
    const { del } = blobLib();
    await del(url, { token: BLOB_TOKEN });
  };
  cloud.isBlobUrl = u => /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(String(u || ''));
  /** ขั้นตอนอัปโหลดตรงจากเบราว์เซอร์ (ไฟล์ใหญ่กว่า 4 MB) */
  cloud.handleClientUpload = async (req, body, { authorize, maxBytes, allowedContentTypes }) => {
    let handleUpload;
    try { ({ handleUpload } = require('@vercel/blob/client')); }
    catch { throw new Error('ไม่พบแพ็กเกจ @vercel/blob — รัน npm install ก่อน'); }
    return handleUpload({
      body, request: req, token: BLOB_TOKEN,
      onBeforeGenerateToken: async (pathname) => {
        authorize(pathname);
        return { allowedContentTypes, maximumSizeInBytes: maxBytes, addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 31536000 };
      },
      // เบราว์เซอร์จะแจ้งลงทะเบียนไฟล์เองหลังอัปโหลดเสร็จ จึงไม่ต้องทำอะไรตรงนี้
      onUploadCompleted: async () => {},
    });
  };

  return cloud;
}

module.exports = { createCloud };
