// จุดเข้าใช้งานบน Vercel — ทุกคำขอ (ยกเว้นไฟล์ใน public/) ถูกส่งมาที่นี่ แล้วให้ server.js จัดการต่อ
module.exports = require('../server.js').handler;
