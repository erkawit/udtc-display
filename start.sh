#!/bin/sh
# เปลี่ยนพอร์ตได้ที่ config.json
cd "$(dirname "$0")"
exec node server.js
