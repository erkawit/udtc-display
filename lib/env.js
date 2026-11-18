// อ่านไฟล์ .env (ถ้ามี) — ไม่ทับค่าที่ตั้งไว้แล้วในระบบ
'use strict';
const fs = require('fs');
const path = require('path');
module.exports = function loadEnv(dir) {
  let txt;
  try { txt = fs.readFileSync(path.join(dir, '.env'), 'utf8'); } catch { return; }
  for (const line of txt.replace(/^﻿/, '').split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!m || line.trim().startsWith('#')) continue;
    let v = m[2];
    if (/^(['"]).*\1$/.test(v)) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
};
