/**
 * UB — ตัวสร้างปุ่ม (ใช้ร่วมกันทั้งฝั่งเซิร์ฟเวอร์ Node.js และหน้าหลังบ้าน)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.UB = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const isColor = c => c === 'transparent' || /^#[0-9a-f]{3,8}$/i.test(String(c || ''));
  const num = (v, a, b, d) => { v = Number(v); return Number.isFinite(v) ? Math.min(b, Math.max(a, v)) : d; };
  const pick = (v, list, d) => list.includes(v) ? v : d;

  // ฟอนต์ภาษาไทยจาก Google Fonts (น้ำหนักที่ฟอนต์นั้นมีจริง)
  const FONTS = [
    ['', 'ตามหน้าเว็บ', ''], ['Sarabun', 'Sarabun สารบรรณ', '400;600;700'], ['Prompt', 'Prompt', '400;500;600;700'], ['Kanit', 'Kanit', '400;500;600;700'],
    ['Mitr', 'Mitr', '400;500;600'], ['Noto Sans Thai', 'Noto Sans Thai', '400;500;600;700'], ['IBM Plex Sans Thai', 'IBM Plex Sans Thai', '400;500;600;700'],
    ['Bai Jamjuree', 'Bai Jamjuree', '400;500;600;700'], ['Chakra Petch', 'Chakra Petch', '400;500;600;700'], ['K2D', 'K2D', '400;500;600;700'],
    ['Niramit', 'Niramit', '400;500;600;700'], ['Athiti', 'Athiti', '400;500;600;700'], ['Pridi', 'Pridi (มีหัว)', '400;500;600;700'],
    ['Taviraj', 'Taviraj (มีหัว)', '400;500;600;700'], ['Trirong', 'Trirong (มีหัว)', '400;500;600;700'], ['Charm', 'Charm (ลายมือ)', '400;700'],
    ['Chonburi', 'Chonburi (หัวเรื่อง)', '400'], ['Itim', 'Itim (น่ารัก)', '400'], ['Sriracha', 'Sriracha (ลายมือ)', '400'], ['Mali', 'Mali', '400;500;600;700'],
  ];
  const FONT_NAMES = FONTS.map(f => f[0]);
  function fontUrl(list) {
    const fams = [...new Set(list.filter(f => f && FONT_NAMES.includes(f)))];
    if (!fams.length) return '';
    return 'https://fonts.googleapis.com/css2?' + fams.map(f => `family=${f.replace(/ /g, '+')}:wght@${FONTS.find(x => x[0] === f)[2]}`).join('&') + '&display=swap';
  }
  const DEF = {
    bg: '#1e3a5f', bg2: '', grad: '135deg', color: '#ffffff', iconColor: '',
    radius: 10, borderW: 0, borderC: '#1e3a5f', shadow: 'md', depth: 'flat',
    hover: 'lift', idle: 'none', fontSize: 16, fontWeight: 600,
    iconSize: 20, iconPos: 'left', align: 'center', padX: 20, padY: 12, font: '',
  };
  const OPT = {
    grad: ['90deg', '135deg', '180deg', '45deg'],
    shadow: ['none', 'sm', 'md', 'lg', 'xl'],
    depth: ['flat', 'raised', 'inset'],
    hover: ['none', 'lift', 'grow', 'press', 'bounce', 'pulse', 'shake', 'glow', 'shine', 'invert', 'darken', 'bright', 'icon'],
    idle: ['none', 'pulse', 'float', 'glow', 'shine'],
    iconPos: ['left', 'right', 'top', 'only'],
    align: ['center', 'left'],
    fontWeight: [400, 500, 600, 700],
  };
  const LABEL = {
    shadow: { none: 'ไม่มี', sm: 'บาง', md: 'ปกติ', lg: 'มาก', xl: 'มากพิเศษ' },
    depth: { flat: 'แบนราบ', raised: 'นูน 3 มิติ', inset: 'ยุบลง' },
    hover: { none: 'ไม่มี', lift: 'ยกลอยขึ้น', grow: 'ขยายใหญ่', press: 'กดลง', bounce: 'เด้ง (bounce)', pulse: 'เต้นเป็นจังหวะ', shake: 'สั่น', glow: 'เรืองแสง', shine: 'แสงวิ่งผ่าน', invert: 'สลับสี', darken: 'เข้มขึ้น', bright: 'สว่างขึ้น', icon: 'ไอคอนขยับ' },
    idle: { none: 'ไม่มี', pulse: 'เต้นตลอด', float: 'ลอยขึ้นลง', glow: 'เรืองแสงตลอด', shine: 'แสงวิ่งเป็นระยะ' },
    iconPos: { left: 'ซ้าย', right: 'ขวา', top: 'ด้านบน', only: 'ไอคอนอย่างเดียว' },
  };

  const PRESETS = [
    { id: 'navy', name: 'กรมท่า', style: { bg: '#1e3a5f', color: '#ffffff', radius: 10, shadow: 'md', hover: 'lift' } },
    { id: 'gold', name: 'ทองไล่สี', style: { bg: '#d4a64a', bg2: '#9a6e1f', grad: '135deg', color: '#ffffff', radius: 10, shadow: 'md', hover: 'shine' } },
    { id: 'outline', name: 'เส้นขอบ', style: { bg: '#ffffff', color: '#1e3a5f', borderW: 2, borderC: '#1e3a5f', radius: 10, shadow: 'none', hover: 'invert' } },
    { id: 'pill', name: 'แคปซูล', style: { bg: '#0f766e', bg2: '#14b8a6', grad: '90deg', color: '#ffffff', radius: 999, shadow: 'md', hover: 'grow' } },
    { id: 'raised', name: 'นูน 3D', style: { bg: '#2563eb', color: '#ffffff', radius: 12, depth: 'raised', shadow: 'sm', hover: 'press' } },
    { id: 'raisedRed', name: 'นูน 3D แดง', style: { bg: '#be123c', color: '#ffffff', radius: 12, depth: 'raised', shadow: 'sm', hover: 'press' } },
    { id: 'square', name: 'เหลี่ยมเรียบ', style: { bg: '#334155', color: '#ffffff', radius: 0, shadow: 'none', hover: 'darken' } },
    { id: 'soft', name: 'สีอ่อน', style: { bg: '#e8eef6', color: '#1e3a5f', iconColor: '#b8862b', radius: 14, shadow: 'none', hover: 'lift' } },
    { id: 'tile', name: 'การ์ดไอคอน', style: { bg: '#ffffff', color: '#1e293b', iconColor: '#1e3a5f', radius: 16, shadow: 'lg', hover: 'lift', iconPos: 'top', iconSize: 34, borderW: 1, borderC: '#e2e8f0' } },
    { id: 'glowGreen', name: 'เรืองแสงเขียว', style: { bg: '#059669', bg2: '#10b981', grad: '135deg', color: '#ffffff', radius: 12, shadow: 'md', hover: 'glow' } },
    { id: 'purple', name: 'ม่วงเด้ง', style: { bg: '#7c3aed', bg2: '#c026d3', grad: '135deg', color: '#ffffff', radius: 14, shadow: 'lg', hover: 'bounce' } },
    { id: 'text', name: 'ข้อความ/ป้าย', style: { bg: 'transparent', color: '#1e293b', iconColor: '#b8862b', radius: 0, shadow: 'none', hover: 'none', fontSize: 22, fontWeight: 700 } },
  ];

  function norm(s) {
    s = Object.assign({}, DEF, s || {});
    return {
      bg: isColor(s.bg) ? s.bg : DEF.bg, bg2: s.bg2 && isColor(s.bg2) ? s.bg2 : '', grad: pick(s.grad, OPT.grad, DEF.grad),
      color: isColor(s.color) ? s.color : DEF.color, iconColor: s.iconColor && isColor(s.iconColor) ? s.iconColor : '',
      radius: num(s.radius, 0, 999, 10), borderW: num(s.borderW, 0, 12, 0), borderC: isColor(s.borderC) ? s.borderC : DEF.borderC,
      shadow: pick(s.shadow, OPT.shadow, 'md'), depth: pick(s.depth, OPT.depth, 'flat'), hover: pick(s.hover, OPT.hover, 'lift'),
      idle: pick(s.idle, OPT.idle, 'none'), fontSize: num(s.fontSize, 8, 120, 16), fontWeight: pick(Number(s.fontWeight), OPT.fontWeight, 600),
      iconSize: num(s.iconSize, 8, 200, 20), iconPos: pick(s.iconPos, OPT.iconPos, 'left'), align: pick(s.align, OPT.align, 'center'),
      padX: num(s.padX, 0, 100, 20), padY: num(s.padY, 0, 100, 12),
      font: FONT_NAMES.includes(s.font) ? s.font : '',
    };
  }
  /** ปุ่มแบบเดิม (btnStyle) -> สไตล์ใหม่ */
  function fromLegacy(btnStyle, accent) {
    accent = isColor(accent) ? accent : '#1e3a5f';
    switch (btnStyle) {
      case 'accent': return norm({ bg: '#b8862b', color: '#fff', shadow: 'sm' });
      case 'outline': return norm({ bg: '#ffffff', color: accent, borderW: 2, borderC: accent, shadow: 'none', hover: 'invert' });
      case 'light': return norm({ bg: '#f1f5f9', color: '#0f172a', shadow: 'none', hover: 'darken' });
      default: return norm({ bg: accent, color: '#fff', shadow: 'sm' });
    }
  }
  function hex6(h) {
    h = String(h || '').replace('#', '');
    if (h.length === 3 || h.length === 4) h = h.slice(0, 3).split('').map(c => c + c).join('');
    return /^[0-9a-f]{6}/i.test(h) ? h.slice(0, 6) : null;
  }
  function shade(hex, p) {
    const h = hex6(hex); if (!h) return 'rgba(0,0,0,.3)';
    const n = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
    const t = p < 0 ? 0 : 255, a = Math.abs(p);
    return '#' + n.map(v => Math.round(v + (t - v) * a).toString(16).padStart(2, '0')).join('');
  }
  function alpha(hex, a) { const h = hex6(hex); return h ? '#' + h + Math.round(a * 255).toString(16).padStart(2, '0') : 'rgba(0,0,0,.2)'; }

  const SH = { none: '0 0 #0000', sm: '0 1px 3px rgba(15,23,42,.18)', md: '0 4px 12px rgba(15,23,42,.16)', lg: '0 10px 24px rgba(15,23,42,.2)', xl: '0 18px 40px rgba(15,23,42,.26)' };
  const SHH = { none: '0 6px 16px rgba(15,23,42,.16)', sm: SH.md, md: SH.lg, lg: SH.xl, xl: '0 26px 50px rgba(15,23,42,.3)' };

  /** สร้าง CSS variables ของปุ่ม; cw = ความกว้างผืนผ้าใบ (ให้ขนาดย่อ/ขยายตาม) */
  function vars(st, cw) {
    const u = v => cw ? `calc(${v} * 100cqw / ${cw})` : v + 'px';
    const base = st.bg === 'transparent' ? st.color : st.bg;
    const bgi = st.bg2 ? `linear-gradient(${st.grad}, ${st.bg}, ${st.bg2})` : st.bg;
    let sh, shh, shp, py;
    if (st.depth === 'raised') {
      const edge = shade(base, -0.32), hi = 'inset 0 1px 0 rgba(255,255,255,.35)';
      sh = `${hi}, 0 ${u(5)} 0 ${edge}, ${SH[st.shadow]}`;
      shh = `${hi}, 0 ${u(7)} 0 ${edge}, ${SHH[st.shadow]}`;
      shp = `${hi}, 0 ${u(1)} 0 ${edge}, ${SH.sm}`; py = u(4);
    } else if (st.depth === 'inset') {
      const ins = 'inset 0 2px 7px rgba(0,0,0,.28), inset 0 -1px 0 rgba(255,255,255,.25)';
      sh = ins; shh = `${ins}, ${SH.sm}`; shp = ins; py = u(1);
    } else { sh = SH[st.shadow]; shh = SHH[st.shadow]; shp = SH.sm; py = u(2); }
    const r = st.radius >= 999 ? '999px' : u(st.radius);
    return [
      `--bgi:${bgi}`, `--fg:${st.color}`, `--ic:${st.iconColor || st.color}`, `--r:${r}`, `--bw:${st.borderW}px`, `--bc:${st.borderC}`,
      `--sh:${sh}`, `--shh:${shh}`, `--shp:${shp}`, `--py:${py}`, `--fs:${u(st.fontSize)}`, `--fw:${st.fontWeight}`, `--is:${u(st.iconSize)}`,
      `--pad:${u(st.padY)} ${u(st.padX)}`, `--gi:${u(Math.round(st.fontSize * 0.55))}`, `--glow:${alpha(base, 0.45)}`,
      `--ivbg:${st.color}`, `--ivfg:${st.bg === 'transparent' ? '#ffffff' : st.bg}`,
      ...(st.font ? [`--ff:'${st.font}',sans-serif`] : []),
    ].join(';');
  }
  const safeIcon = c => /^[a-z0-9\- ]{3,80}$/i.test(String(c || '')) ? c : '';

  /**
   * it: { title, subtitle, iconFa, icon(emoji), link, newTab, style }
   * opt: { tag:'a'|'div', cw, cls, target }
   */
  function buttonHtml(it, opt = {}) {
    const st = norm(it.style);
    const fa = safeIcon(it.iconFa);
    const img = it.iconImg && !/^\s*(javascript|data|vbscript):/i.test(it.iconImg) ? `<img class="ui ui-img" src="${esc(it.iconImg)}" alt="" loading="lazy" draggable="false">` : '';
    const ic = img || (fa ? `<i class="ui ${esc(fa)}" aria-hidden="true"></i>` : (it.icon ? `<span class="ui">${esc(it.icon)}</span>` : ''));
    const pos = !ic && st.iconPos === 'only' ? 'left' : st.iconPos;
    const text = pos === 'only' ? '' : `<span class="ut">${esc(it.title || '')}${it.subtitle ? `<small>${esc(it.subtitle)}</small>` : ''}</span>`;
    const cls = `ub pos-${pos} al-${st.align} d-${st.depth} h-${st.hover} a-${st.idle}${opt.cls ? ' ' + opt.cls : ''}`;
    const style = vars(st, opt.cw);
    const title = pos === 'only' && it.title ? ` title="${esc(it.title)}" aria-label="${esc(it.title)}"` : '';
    if (opt.tag !== 'div' && it.link) {
      const tgt = it.newTab ? ' target="_blank" rel="noopener"' : ` target="${opt.target || '_top'}"`;
      return `<a class="${cls}" style="${style}" href="${esc(it.link)}"${tgt}${title}>${ic}${text}</a>`;
    }
    return `<div class="${cls}" style="${style}"${title}>${ic}${text}</div>`;
  }


  /* ---------------- ข้อความ / เส้นคั่น / ช่องว่าง ---------------- */
  const TDEF = {
    content: 'พิมพ์ข้อความที่นี่', tag: 'p', font: '', size: 18, sizeM: 0, weight: 400, color: '#1e293b', align: 'left', vAlign: 'top',
    lineH: 1.6, letter: 0, italic: false, underline: false, upper: false, bg: '', pad: 0, radius: 0, border: 0, borderColor: '#cbd5e1',
    borderSide: 'all', shadow: 'none', tShadow: false, maxW: 0, iconFa: '', iconColor: '', full: true,
    // เส้นคั่น
    lineStyle: 'solid', thick: 2, widthPct: 100, mTop: 12, mBot: 12,
    // ช่องว่าง
    h: 32, hM: 0,
  };
  const TOPT = { tag: ['p', 'h2', 'h3', 'h4', 'div'], align: ['left', 'center', 'right', 'justify'], vAlign: ['top', 'middle', 'bottom'],
    borderSide: ['all', 'left', 'bottom', 'top'], shadow: ['none', 'soft', 'strong'], lineStyle: ['solid', 'dashed', 'dotted', 'double'] };
  const TPRESETS = [
    { id: 'h1', name: 'หัวข้อใหญ่', s: { tag: 'h2', size: 32, sizeM: 24, weight: 700, color: '#1e3a5f', lineH: 1.3 } },
    { id: 'h2', name: 'หัวข้อรอง', s: { tag: 'h3', size: 22, sizeM: 19, weight: 600, color: '#1e3a5f', lineH: 1.4 } },
    { id: 'body', name: 'เนื้อหา', s: { tag: 'p', size: 17, sizeM: 15, weight: 400, color: '#334155', lineH: 1.75 } },
    { id: 'bar', name: 'หัวข้อแถบซ้าย', s: { tag: 'h3', size: 22, weight: 700, color: '#1e3a5f', border: 5, borderSide: 'left', borderColor: '#b8862b', pad: 10, lineH: 1.3 } },
    { id: 'badge', name: 'ป้ายเน้น', s: { tag: 'div', size: 15, weight: 600, color: '#ffffff', bg: '#b8862b', pad: 10, radius: 999, align: 'center', full: false } },
    { id: 'notice', name: 'กล่องประกาศ', s: { tag: 'div', size: 16, weight: 400, color: '#7c2d12', bg: '#fff7ed', pad: 16, radius: 12, border: 1, borderColor: '#fdba74', lineH: 1.7, iconFa: 'fa-solid fa-bullhorn', iconColor: '#ea580c' } },
    { id: 'quote', name: 'คำโปรย', s: { tag: 'p', size: 19, weight: 400, italic: true, color: '#475569', align: 'center', lineH: 1.7 } },
    { id: 'hero', name: 'ข้อความบนภาพ', s: { tag: 'h2', size: 40, sizeM: 26, weight: 700, color: '#ffffff', align: 'center', tShadow: true, lineH: 1.25 } },
  ];
  function normText(t) {
    t = t && typeof t === 'object' ? t : {};
    const o = {};
    for (const k in TDEF) {
      const d = TDEF[k], v = t[k];
      if (TOPT[k]) o[k] = pick(v, TOPT[k], d);
      else if (typeof d === 'boolean') o[k] = v === undefined ? d : !!v;
      else if (typeof d === 'number') o[k] = num(v, k === 'letter' ? -5 : 0, { size: 160, sizeM: 160, weight: 900, lineH: 4, letter: 20, pad: 120, radius: 999, border: 20, maxW: 3000, thick: 30, widthPct: 100, mTop: 200, mBot: 200, h: 1000, hM: 1000 }[k] || 999, d);
      else if (k === 'content') o[k] = String(v ?? d).slice(0, 20000);
      else if (k === 'font') o[k] = FONT_NAMES.includes(v) ? v : '';
      else if (k === 'iconFa') o[k] = /^[a-z0-9\- ]{3,80}$/i.test(String(v || '')) ? String(v).trim() : '';
      else if (k === 'bg' || k === 'iconColor') o[k] = isColor(v) ? v : '';
      else o[k] = isColor(v) ? v : d;
    }
    if (o.weight < 100) o.weight = 400;
    return o;
  }
  /** ข้อความแบบง่าย: **ตัวหนา** *เอียง* __ขีดเส้นใต้__ [ข้อความ](ลิงก์) และลิงก์ https:// คลิกได้ ขึ้นบรรทัดใหม่ได้ */
  function richText(src) {
    let h = esc(src);
    const links = [];
    h = h.replace(/\[([^\]\n]+)\]\(((?:https?:\/\/|\/|#|mailto:|tel:)[^\s)]+)\)/g, (m, t, u) => { links.push(`<a href="${u}" target="_blank" rel="noopener">${t}</a>`); return `\u0000${links.length - 1}\u0000`; });
    h = h.replace(/(^|[\s(])(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g, (m, pre, u) => { links.push(`<a href="${u}" target="_blank" rel="noopener">${u}</a>`); return `${pre}\u0000${links.length - 1}\u0000`; });
    h = h.replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>').replace(/__([^_\n]+)__/g, '<u>$1</u>').replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<i>$2</i>');
    h = h.replace(/\u0000(\d+)\u0000/g, (m, i) => links[+i]);
    return h.replace(/\r?\n/g, '<br>');
  }
  const TSH = { none: 'none', soft: '0 2px 10px rgba(15,23,42,.08),0 1px 3px rgba(15,23,42,.06)', strong: '0 10px 30px rgba(15,23,42,.18),0 3px 8px rgba(15,23,42,.1)' };
  /** opts.cw = ความกว้างผืนผ้าใบ (ปรับขนาดตามจอ) · opts.link = {href, target} */
  function textHtml(t, opts = {}) {
    t = normText(t);
    const cw = opts.cw, px = v => cw ? `calc(${v} * 100cqw / ${cw})` : `${v}px`;
    const fs = px(t.size), fsm = `${t.sizeM || Math.max(12, Math.round(t.size * (t.size > 24 ? .78 : .92)))}px`;
    const bw = t.border ? `${px(t.border)} solid ${t.borderColor}` : '';
    const border = !t.border ? '' : t.borderSide === 'all' ? `border:${bw};` : `border-${t.borderSide}:${bw};`;
    const style = [`--tfs:${fs}`, `--tfsm:${fsm}`, t.font ? `font-family:'${t.font}',var(--uwf,inherit)` : '', `font-weight:${t.weight}`, `color:${t.color}`,
      `text-align:${t.align}`, `line-height:${t.lineH}`, t.letter ? `letter-spacing:${px(t.letter)}` : '', t.italic ? 'font-style:italic' : '',
      t.underline ? 'text-decoration:underline' : '', t.upper ? 'text-transform:uppercase' : '', t.bg ? `background:${t.bg}` : '',
      t.pad ? `padding:${px(t.pad)} ${px(Math.round(t.pad * (t.radius >= 99 ? 1.8 : 1.25)))}` : '', t.radius ? `border-radius:${t.radius >= 999 ? '999px' : px(t.radius)}` : '', border,
      t.shadow !== 'none' ? `box-shadow:${TSH[t.shadow]}` : '', t.tShadow ? 'text-shadow:0 2px 12px rgba(0,0,0,.45),0 1px 2px rgba(0,0,0,.35)' : '',
      t.maxW ? `max-width:${px(t.maxW)}` : '', `--tva:${t.vAlign === 'middle' ? 'center' : t.vAlign === 'bottom' ? 'flex-end' : 'flex-start'}`].filter(Boolean).join(';');
    const icon = t.iconFa ? `<i class="${esc(t.iconFa)} ux-ic"${t.iconColor ? ` style="color:${t.iconColor}"` : ''}></i>` : '';
    const body = `<${t.tag} class="ux-t">${icon}<span>${richText(t.content)}</span></${t.tag}>`;
    const cls = `ux${t.full ? '' : ' fit'} al-${t.align}${t.maxW ? ' mw' : ''}`;
    if (opts.link && opts.link.href) return `<a class="${cls} ux-a" style="${style}" href="${esc(opts.link.href)}"${opts.link.target ? ` target="${opts.link.target}"${opts.link.target === '_blank' ? ' rel="noopener"' : ''}` : ''}>${body}</a>`;
    return `<div class="${cls}" style="${style}">${body}</div>`;
  }
  function dividerHtml(t, opts = {}) {
    t = normText(t);
    const cw = opts.cw, px = v => cw ? `calc(${v} * 100cqw / ${cw})` : `${v}px`;
    const m = t.align === 'center' ? 'auto' : t.align === 'right' ? 'auto 0 auto auto' : '0';
    return `<div class="ux-hr" style="padding:${px(t.mTop)} 0 ${px(t.mBot)}"><hr style="border:0;border-top:${t.lineStyle === 'double' ? Math.max(3, t.thick) : t.thick}px ${t.lineStyle} ${t.color};width:${t.widthPct}%;margin:${m === 'auto' ? '0 auto' : m === '0' ? '0' : '0 0 0 auto'}"></div>`;
  }
  function spacerHtml(t, opts = {}) {
    t = normText(t);
    return `<div class="ux-sp" style="--sph:${opts.cw ? `calc(${t.h} * 100cqw / ${opts.cw})` : t.h + 'px'};--sphm:${(t.hM || t.h)}px" aria-hidden="true"></div>`;
  }
  const TEXT_CSS = `
.ux{box-sizing:border-box;display:block;font-size:var(--tfs);overflow-wrap:anywhere;text-decoration:none}
.ux.fit{display:table;max-width:100%}.ux.fit.al-center{margin-left:auto;margin-right:auto}.ux.fit.al-right{margin-left:auto}
.ux.mw.al-center{margin-left:auto;margin-right:auto}.ux.mw.al-right{margin-left:auto}
.ux .ux-t{margin:0;padding:0;font:inherit;color:inherit;letter-spacing:inherit;line-height:inherit;text-align:inherit;border:0;background:none}
.ux .ux-t a{color:inherit;text-decoration:underline}.ux b{font-weight:700}
.ux .ux-ic{margin-right:.45em}
a.ux-a{color:inherit;cursor:pointer;transition:filter .2s,transform .2s}a.ux-a:hover{filter:brightness(.92)}
.ux-hr hr{display:block;height:0;background:none}
.ux-sp{height:var(--sph)}
@media(max-width:639px){.ux{font-size:var(--tfsm)}.ux-sp{height:var(--sphm)}}
`;

  const CSS = TEXT_CSS + `
.ub{position:relative;box-sizing:border-box;display:flex;align-items:center;justify-content:center;gap:var(--gi);width:100%;height:100%;min-height:0;padding:var(--pad);
  background:var(--bgi);color:var(--fg);border:var(--bw) solid var(--bc);border-radius:var(--r);box-shadow:var(--sh);font-family:var(--ff,inherit);font-size:var(--fs);font-weight:var(--fw);
  line-height:1.3;text-decoration:none;text-align:center;overflow:hidden;cursor:pointer;-webkit-tap-highlight-color:transparent;
  transition:transform .28s cubic-bezier(.34,1.56,.64,1),box-shadow .28s,filter .25s,background .25s,color .25s}
.ub.auto{display:inline-flex;width:auto;height:auto}
div.ub{cursor:default}
.ub .ui{flex:none;font-size:var(--is);color:var(--ic);line-height:1;transition:transform .3s cubic-bezier(.34,1.56,.64,1),color .25s;font-style:normal}
.ub .ui-img{height:var(--is);width:auto;max-width:100%;object-fit:contain;display:block}
.ub .ut{min-width:0;overflow-wrap:anywhere}.ub .ut small{display:block;font-size:.72em;font-weight:400;opacity:.85;margin-top:.15em}
.ub.pos-top{flex-direction:column}.ub.pos-right{flex-direction:row-reverse}
.ub.al-left{justify-content:flex-start;text-align:left}.ub.al-left.pos-top{align-items:flex-start}
.ub.h-lift:hover{transform:translateY(-4px);box-shadow:var(--shh)}
.ub.h-grow:hover{transform:scale(1.05);box-shadow:var(--shh)}
.ub.h-press:hover{transform:translateY(var(--py));box-shadow:var(--shp)}
.ub.h-bounce:hover{animation:ub-bounce .75s}
.ub.h-pulse:hover{animation:ub-pulse 1.1s ease-in-out infinite}
.ub.h-shake:hover{animation:ub-shake .45s}
.ub.h-glow:hover{box-shadow:0 0 0 4px var(--glow),0 0 24px var(--glow)}
.ub.h-invert:hover{background:var(--ivbg);color:var(--ivfg)}.ub.h-invert:hover .ui{color:var(--ivfg)}
.ub.h-darken:hover{filter:brightness(.88)}.ub.h-bright:hover{filter:brightness(1.12)}
.ub.h-icon:hover .ui{transform:translateX(5px) scale(1.12)}.ub.h-icon.pos-top:hover .ui{transform:translateY(-4px) scale(1.15)}.ub.h-icon.pos-right:hover .ui{transform:translateX(-5px) scale(1.12)}
.ub.h-shine::after,.ub.a-shine::after{content:'';position:absolute;top:0;left:-80%;width:50%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.5),transparent);transform:skewX(-20deg);pointer-events:none}
.ub.h-shine:hover::after{animation:ub-shine .85s}
.ub.a-shine::after{animation:ub-shine 3.2s infinite}
.ub.a-pulse{animation:ub-pulse 2s ease-in-out infinite}.ub.a-float{animation:ub-float 3s ease-in-out infinite}.ub.a-glow{animation:ub-glow 2s ease-in-out infinite}
.ub.d-raised:active,.ub.h-press:active{transform:translateY(var(--py));box-shadow:var(--shp)}
a.ub:active{filter:brightness(.95)}
a.ub:focus-visible{outline:3px solid var(--glow);outline-offset:2px}
@keyframes ub-bounce{0%,100%{transform:translateY(0)}30%{transform:translateY(-9px)}50%{transform:translateY(0)}70%{transform:translateY(-4px)}85%{transform:translateY(0)}}
@keyframes ub-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.045)}}
@keyframes ub-shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-4px)}40%,80%{transform:translateX(4px)}}
@keyframes ub-shine{0%{left:-80%}60%,100%{left:130%}}
@keyframes ub-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes ub-glow{0%,100%{box-shadow:var(--sh)}50%{box-shadow:0 0 0 4px var(--glow),0 0 22px var(--glow)}}
@media (prefers-reduced-motion:reduce){.ub,.ub *{animation:none!important;transition:none!important}}
`;

  /* ---------------- ภาพแบบปรับแต่ง (ผืนผ้าใบอิสระ) ---------------- */
  const IDEF = { fit: 'cover', pos: 'center', shape: 'rect', radius: 16, border: 0, borderColor: '#ffffff', borderStyle: 'solid', frame: 0, frameBg: '#ffffff',
    depth: 'md', shColor: '#0f172a', tiltX: 0, tiltY: 0, rotate: 0, flipX: false,
    gray: 0, bright: 100, sat: 100, contrast: 100, blur: 0, opacity: 100, tint: '', tintOp: 0, grad: false,
    hover: 'zoom', hoverAmt: 2, speed: 450, idle: 'none',
    cap: 'none', capColor: '#ffffff', capSize: 18, capAlign: 'left' };
  const IOPT = {
    fit: ['cover', 'contain', 'fill'], pos: ['center', 'top', 'bottom', 'left', 'right'], shape: ['rect', 'circle', 'pill', 'blob', 'arch'],
    borderStyle: ['solid', 'dashed', 'double'], depth: ['none', 'soft', 'md', 'strong', 'emboss', 'float', 'stack', 'neon', 'inset'],
    hover: ['none', 'zoom', 'zoomout', 'lift', 'tilt3d', 'pop', 'glow', 'color', 'bright', 'rotate', 'shine', 'blurin', 'flip'],
    idle: ['none', 'float', 'pulse', 'swing', 'breathe', 'kenburns', 'shine'], cap: ['none', 'bottom', 'top', 'center', 'hover'], capAlign: ['left', 'center', 'right'],
  };
  const IPRESETS = [
    { id: 'clean', name: 'เรียบหรู', s: { shape: 'rect', radius: 16, depth: 'md', hover: 'zoom', idle: 'none', border: 0, frame: 0 } },
    { id: 'emboss', name: 'นูน 3 มิติ', s: { shape: 'rect', radius: 20, depth: 'emboss', hover: 'tilt3d', border: 0, frame: 0 } },
    { id: 'float', name: 'ลอยตัว', s: { radius: 18, depth: 'float', hover: 'lift', idle: 'float' } },
    { id: 'polaroid', name: 'กรอบโพลารอยด์', s: { radius: 4, frame: 12, frameBg: '#ffffff', depth: 'strong', rotate: -3, hover: 'pop', cap: 'none' } },
    { id: 'stack', name: 'ซ้อนชั้น', s: { radius: 14, depth: 'stack', shColor: '#b8862b', hover: 'lift' } },
    { id: 'neon', name: 'เรืองแสง', s: { radius: 16, depth: 'neon', shColor: '#38bdf8', border: 2, borderColor: '#38bdf8', hover: 'glow', idle: 'breathe' } },
    { id: 'circle', name: 'วงกลม', s: { shape: 'circle', border: 4, borderColor: '#ffffff', depth: 'md', hover: 'rotate' } },
    { id: 'bw', name: 'ขาวดำ → สี', s: { radius: 12, gray: 100, hover: 'color', depth: 'soft' } },
    { id: 'cinema', name: 'ภาพยนตร์', s: { radius: 10, grad: true, cap: 'bottom', depth: 'strong', hover: 'zoom', idle: 'kenburns' } },
    { id: 'shine', name: 'เงาวิ่ง', s: { radius: 16, depth: 'md', hover: 'shine', idle: 'shine' } },
  ];
  function normImg(f) {
    const o = Object.assign({}, IDEF, f || {});
    for (const k in IOPT) if (!IOPT[k].includes(o[k])) o[k] = IDEF[k];
    const n = (k, a, b) => { const v = Number(o[k]); o[k] = Number.isFinite(v) ? Math.min(b, Math.max(a, v)) : IDEF[k]; };
    n('radius', 0, 400); n('border', 0, 40); n('frame', 0, 80); n('tiltX', -45, 45); n('tiltY', -45, 45); n('rotate', -180, 180);
    n('gray', 0, 100); n('bright', 20, 200); n('sat', 0, 300); n('contrast', 20, 200); n('blur', 0, 20); n('opacity', 5, 100); n('tintOp', 0, 100);
    n('hoverAmt', 1, 3); n('speed', 100, 2000); n('capSize', 10, 72);
    const hex = v => /^#[0-9a-f]{3,8}$/i.test(String(v || ''));
    for (const k of ['borderColor', 'shColor', 'capColor']) if (!hex(o[k])) o[k] = IDEF[k];
    if (o.frameBg !== 'transparent' && !hex(o.frameBg)) o.frameBg = IDEF.frameBg;
    if (o.tint && !hex(o.tint)) o.tint = '';
    o.flipX = !!o.flipX; o.grad = !!o.grad;
    return o;
  }
  function imageHtml(it, opts = {}) {
    const f = normImg(it.fx), cw = opts.cw, px = v => cw ? `calc(${v} * 100cqw / ${cw})` : `${v}px`;
    const r = f.shape === 'circle' ? '50%' : f.shape === 'pill' ? '9999px' : f.shape === 'blob' ? '42% 58% 63% 37% / 41% 44% 56% 59%' : f.shape === 'arch' ? `${px(9999)} ${px(9999)} ${px(f.radius)} ${px(f.radius)}` : px(f.radius);
    const filt = [f.gray && `grayscale(${f.gray}%)`, f.bright !== 100 && `brightness(${f.bright}%)`, f.sat !== 100 && `saturate(${f.sat}%)`, f.contrast !== 100 && `contrast(${f.contrast}%)`, f.blur && `blur(${px(f.blur)})`].filter(Boolean).join(' ') || 'none';
    const tf = [`perspective(${px(1000)})`, f.tiltX && `rotateX(${f.tiltX}deg)`, f.tiltY && `rotateY(${f.tiltY}deg)`, f.rotate && `rotate(${f.rotate}deg)`].filter(Boolean).join(' ');
    const amt = [0, 1.04, 1.08, 1.14][f.hoverAmt];
    const vars = `--ir:${r};--ibw:${px(f.border)};--ibc:${f.borderColor};--ibs:${f.borderStyle};--ifp:${px(f.frame)};--ifb:${f.frameBg};--isc:${f.shColor};--iu:${px(1)};` +
      `--ifit:${f.fit};--ipos:${f.pos};--ifl:${filt};--iop:${f.opacity / 100};--itf:${tf};--isp:${f.speed}ms;--iamt:${amt};--itint:${f.tint || 'transparent'};--itop:${f.tintOp / 100};` +
      `--icc:${f.capColor};--ics:${px(f.capSize)}`;
    const cls = `uim d-${f.depth} h-${f.hover} i-${f.idle} s-${f.shape}${f.flipX ? ' fx' : ''}${f.gray && f.hover === 'color' ? ' g2c' : ''}`;
    const capTxt = (it.title || it.subtitle) ? `${it.title ? `<b>${esc(it.title)}</b>` : ''}${it.subtitle ? `<small>${esc(it.subtitle)}</small>` : ''}` : '';
    const cap = f.cap !== 'none' && capTxt ? `<div class="uim-cap c-${f.cap}" style="text-align:${f.capAlign}">${capTxt}</div>` : '';
    const img = `<img src="${esc(it.src)}" alt="${esc(it.title || '')}" loading="lazy" draggable="false">`;
    const inner = `<div class="uim-fr"><div class="uim-in">${img}${f.tint && f.tintOp ? '<i class="uim-tint"></i>' : ''}${f.grad ? '<i class="uim-grad"></i>' : ''}<i class="uim-sh"></i>${cap}</div></div>`;
    const tag = it.link && !opts.noLink ? 'a' : 'div';
    const attrs = tag === 'a' ? ` href="${esc(it.link)}"${it.newTab !== false ? ' target="_blank" rel="noopener"' : ''}` : '';
    return `<${tag} class="${cls}"${attrs} style="${vars}"${f.hover === 'tilt3d' ? ' data-tilt' : ''}>${inner}</${tag}>`;
  }
  const IMG_CSS = `
.uim{display:block;position:relative;width:100%;height:100%;box-sizing:border-box;text-decoration:none;color:inherit;transform:var(--itf);transform-style:preserve-3d;transition:transform var(--isp) cubic-bezier(.2,.8,.2,1),filter var(--isp);opacity:var(--iop)}
.uim .uim-fr{position:relative;width:100%;height:100%;box-sizing:border-box;padding:var(--ifp);background:var(--ifb);border-radius:var(--ir);border:var(--ibw) var(--ibs) var(--ibc);transition:box-shadow var(--isp),transform var(--isp)}
.uim:not([class*="d-"]) .uim-fr,.uim .uim-fr{background-clip:padding-box}
.uim .uim-in{position:relative;width:100%;height:100%;overflow:hidden;border-radius:calc(var(--ir) - var(--ifp) / 2);isolation:isolate}
.uim.s-circle .uim-in,.uim.s-pill .uim-in,.uim.s-blob .uim-in,.uim.s-arch .uim-in{border-radius:var(--ir)}
.uim img{display:block;width:100%;height:100%;object-fit:var(--ifit);object-position:var(--ipos);filter:var(--ifl);transition:transform var(--isp) cubic-bezier(.2,.8,.2,1),filter var(--isp);user-select:none}
.uim.fx img{transform:scaleX(-1)}
.uim i{position:absolute;inset:0;pointer-events:none;font-style:normal}
.uim .uim-tint{background:var(--itint);opacity:var(--itop);mix-blend-mode:multiply}
.uim .uim-grad{background:linear-gradient(180deg,transparent 45%,rgba(2,6,23,.72))}
.uim .uim-sh{z-index:2;background:linear-gradient(105deg,transparent 30%,rgba(255,255,255,.55) 48%,transparent 66%);transform:translateX(-120%);opacity:0}
/* มิติ / เงา */
.uim.d-none .uim-fr{box-shadow:none}
.uim.d-soft .uim-fr{box-shadow:0 calc(var(--iu)*4) calc(var(--iu)*14) rgba(15,23,42,.12)}
.uim.d-md .uim-fr{box-shadow:0 calc(var(--iu)*10) calc(var(--iu)*28) rgba(15,23,42,.22),0 calc(var(--iu)*2) calc(var(--iu)*6) rgba(15,23,42,.12)}
.uim.d-strong .uim-fr{box-shadow:0 calc(var(--iu)*22) calc(var(--iu)*50) rgba(15,23,42,.38),0 calc(var(--iu)*6) calc(var(--iu)*14) rgba(15,23,42,.2)}
.uim.d-emboss .uim-fr{box-shadow:inset 0 calc(var(--iu)*2) 0 rgba(255,255,255,.6),inset 0 calc(var(--iu)*-3) 0 rgba(0,0,0,.18),0 calc(var(--iu)*8) 0 color-mix(in srgb,var(--isc) 75%,#000),0 calc(var(--iu)*18) calc(var(--iu)*28) rgba(15,23,42,.35)}
.uim.d-emboss .uim-in::after{content:'';position:absolute;inset:0;border-radius:inherit;box-shadow:inset 0 calc(var(--iu)*3) calc(var(--iu)*6) rgba(255,255,255,.35),inset 0 calc(var(--iu)*-6) calc(var(--iu)*12) rgba(0,0,0,.25);pointer-events:none;z-index:3}
.uim.d-float .uim-fr{box-shadow:0 calc(var(--iu)*34) calc(var(--iu)*40) calc(var(--iu)*-18) rgba(15,23,42,.55)}
.uim.d-stack .uim-fr{box-shadow:calc(var(--iu)*10) calc(var(--iu)*10) 0 var(--isc),calc(var(--iu)*20) calc(var(--iu)*20) 0 color-mix(in srgb,var(--isc) 45%,transparent)}
.uim.d-neon .uim-fr{box-shadow:0 0 calc(var(--iu)*6) var(--isc),0 0 calc(var(--iu)*22) var(--isc),0 0 calc(var(--iu)*48) color-mix(in srgb,var(--isc) 60%,transparent)}
.uim.d-inset .uim-in::after{content:'';position:absolute;inset:0;border-radius:inherit;box-shadow:inset 0 0 calc(var(--iu)*30) rgba(0,0,0,.55);pointer-events:none;z-index:3}
/* คำบรรยาย */
.uim-cap{position:absolute;left:0;right:0;z-index:4;padding:.7em .9em;color:var(--icc);font-size:var(--ics);line-height:1.35;transition:opacity var(--isp),transform var(--isp)}
.uim-cap b{display:block;font-weight:700}.uim-cap small{display:block;font-size:.72em;opacity:.88;margin-top:.15em}
.uim-cap.c-bottom{bottom:0;background:linear-gradient(transparent,rgba(2,6,23,.7))}.uim-cap.c-top{top:0;background:linear-gradient(rgba(2,6,23,.7),transparent)}
.uim-cap.c-center{top:50%;transform:translateY(-50%);text-shadow:0 2px 12px rgba(0,0,0,.6)}
.uim-cap.c-hover{inset:0;display:flex;flex-direction:column;justify-content:flex-end;background:linear-gradient(transparent 30%,rgba(2,6,23,.8));opacity:0;transform:translateY(8%)}
.uim:hover .uim-cap.c-hover{opacity:1;transform:none}
/* เมื่อชี้เมาส์ */
.uim.h-zoom:hover img{transform:scale(var(--iamt))}
.uim.h-zoomout img{transform:scale(var(--iamt))}.uim.h-zoomout:hover img{transform:scale(1)}
.uim.h-lift:hover{transform:var(--itf) translateY(calc(var(--iu)*-10))}.uim.h-lift:hover .uim-fr{filter:drop-shadow(0 calc(var(--iu)*14) calc(var(--iu)*16) rgba(15,23,42,.25))}
.uim.h-pop:hover{transform:scale(var(--iamt)) rotate(0deg)}
.uim.h-glow:hover .uim-fr{box-shadow:0 0 0 calc(var(--iu)*4) color-mix(in srgb,var(--isc) 55%,transparent),0 0 calc(var(--iu)*40) var(--isc)}
.uim.h-color img{transition:filter var(--isp)}.uim.h-color:hover img{filter:none}
.uim.h-bright:hover img{filter:var(--ifl) brightness(1.15) saturate(1.15)}
.uim.h-rotate:hover{transform:var(--itf) rotate(calc((var(--iamt) - 1) * 60deg)) scale(var(--iamt))}
.uim.h-shine:hover .uim-sh{opacity:1;animation:uim-shine .9s ease}
.uim.h-blurin img{filter:var(--ifl) blur(calc(var(--iu)*4))}.uim.h-blurin:hover img{filter:var(--ifl)}
.uim.h-flip:hover .uim-in{transform:rotateY(180deg) scaleX(-1)}.uim.h-flip .uim-in{transition:transform var(--isp)}
.uim[data-tilt]{will-change:transform}
/* เคลื่อนไหวตลอด */
.uim.i-float{animation:uim-float 4s ease-in-out infinite}.uim.i-pulse{animation:uim-pulse 2.4s ease-in-out infinite}
.uim.i-swing{animation:uim-swing 4s ease-in-out infinite;transform-origin:top center}.uim.i-breathe .uim-fr{animation:uim-breathe 3s ease-in-out infinite}
.uim.i-kenburns img{animation:uim-ken 14s ease-in-out infinite alternate}.uim.i-shine .uim-sh{opacity:1;animation:uim-shine 3.4s ease-in-out infinite}
@keyframes uim-float{0%,100%{translate:0 0}50%{translate:0 calc(var(--iu)*-10)}}
@keyframes uim-pulse{0%,100%{scale:1}50%{scale:1.035}}
@keyframes uim-swing{0%,100%{rotate:-2deg}50%{rotate:2deg}}
@keyframes uim-breathe{0%,100%{filter:brightness(1)}50%{filter:brightness(1.12)}}
@keyframes uim-ken{0%{transform:scale(1) translate(0,0)}100%{transform:scale(1.15) translate(-3%,-2%)}}
@keyframes uim-shine{0%{transform:translateX(-120%)}55%,100%{transform:translateX(120%)}}
/* แอนิเมชันตอนเลื่อนมาถึง */
.uw-js [data-enter]{transition:opacity var(--edur,700ms) cubic-bezier(.2,.8,.2,1) var(--edel,0ms),transform var(--edur,700ms) cubic-bezier(.2,.8,.2,1) var(--edel,0ms),filter var(--edur,700ms) var(--edel,0ms)}
.uw-js [data-enter]:not(.in){opacity:0}
.uw-js [data-enter="fade-up"]:not(.in){transform:translateY(40px)}.uw-js [data-enter="fade-down"]:not(.in){transform:translateY(-40px)}
.uw-js [data-enter="slide-left"]:not(.in){transform:translateX(-60px)}.uw-js [data-enter="slide-right"]:not(.in){transform:translateX(60px)}
.uw-js [data-enter="zoom"]:not(.in){transform:scale(.8)}.uw-js [data-enter="zoom-out"]:not(.in){transform:scale(1.15)}
.uw-js [data-enter="flip"]:not(.in){transform:perspective(800px) rotateY(70deg)}.uw-js [data-enter="blur"]:not(.in){filter:blur(12px)}
.uw-js [data-enter="rotate"]:not(.in){transform:rotate(-12deg) scale(.9)}
@media (prefers-reduced-motion:reduce){.uim,.uim *{animation:none!important;transition:none!important}[data-enter]{opacity:1!important;transform:none!important;filter:none!important}}
`;
  /* ---------------- ตาราง ---------------- */
  const TBDEF = { font: '', size: 15, color: '#1e293b', bg: '#ffffff', headBg: '#1e3a5f', headFg: '#ffffff', headWeight: 700, headSize: 0,
    footBg: '#f1f5f9', footFg: '#0f172a', stripe: true, stripeBg: '#f8fafc', hover: true, hoverBg: '#eef2ff',
    border: 'all', bw: 1, bc: '#e2e8f0', radius: 12, pad: 10, shadow: 'soft', align: 'left', headAlign: 'left', vAlign: 'middle',
    firstColBold: false, firstColBg: '', capColor: '#0f172a', capSize: 20, capAlign: 'left', capWeight: 700, minColW: 80 };
  const TBOPT = { border: ['all', 'rows', 'cols', 'outer', 'none'], shadow: ['none', 'soft', 'md', 'strong'], align: ['left', 'center', 'right'],
    headAlign: ['left', 'center', 'right'], vAlign: ['top', 'middle', 'bottom'], capAlign: ['left', 'center', 'right'] };
  const TBPRESETS = [
    { id: 'navy', name: 'น้ำเงินทางการ', s: { headBg: '#1e3a5f', headFg: '#ffffff', stripe: true, stripeBg: '#f4f7fc', border: 'rows', bc: '#e2e8f0', radius: 12, shadow: 'soft', hoverBg: '#e8eef8' } },
    { id: 'gold', name: 'ทองหรู', s: { headBg: '#b8862b', headFg: '#ffffff', stripe: true, stripeBg: '#fbf7ee', border: 'rows', bc: '#efe3c8', radius: 14, shadow: 'md', hoverBg: '#f6ecd6' } },
    { id: 'grid', name: 'เส้นตารางครบ', s: { headBg: '#f1f5f9', headFg: '#0f172a', stripe: false, border: 'all', bc: '#cbd5e1', radius: 6, shadow: 'none', hoverBg: '#f8fafc' } },
    { id: 'minimal', name: 'มินิมอล', s: { headBg: '#ffffff', headFg: '#0f172a', stripe: false, border: 'rows', bc: '#e5e7eb', radius: 0, shadow: 'none', hoverBg: '#f9fafb', bg: '#ffffff' } },
    { id: 'green', name: 'เขียวหยก', s: { headBg: '#14625e', headFg: '#ffffff', stripe: true, stripeBg: '#f0f8f6', border: 'rows', bc: '#d5ebe6', radius: 12, shadow: 'soft', hoverBg: '#e1f2ee' } },
    { id: 'maroon', name: 'แดงเลือดหมู', s: { headBg: '#7a1f35', headFg: '#ffffff', stripe: true, stripeBg: '#fbf3f4', border: 'rows', bc: '#f0dce1', radius: 12, shadow: 'soft', hoverBg: '#f6e4e8' } },
    { id: 'dark', name: 'โหมดมืด', s: { bg: '#0f172a', color: '#e2e8f0', headBg: '#1e293b', headFg: '#fbbf24', stripe: true, stripeBg: '#111c33', border: 'rows', bc: '#1e293b', radius: 12, shadow: 'md', hoverBg: '#1e293b', footBg: '#1e293b', footFg: '#fbbf24', capColor: '#0f172a' } },
    { id: 'card', name: 'การ์ดลอย', s: { headBg: '#eef2ff', headFg: '#3730a3', stripe: false, border: 'none', radius: 18, shadow: 'strong', hoverBg: '#f5f7ff', pad: 14 } },
  ];
  function normTable(t) {
    t = t && typeof t === 'object' ? t : {};
    const hex = v => /^#[0-9a-f]{3,8}$/i.test(String(v || ''));
    let rows = Array.isArray(t.rows) && t.rows.length ? t.rows : [[{ t: 'หัวข้อ 1' }, { t: 'หัวข้อ 2' }, { t: 'หัวข้อ 3' }], [{ t: '' }, { t: '' }, { t: '' }], [{ t: '' }, { t: '' }, { t: '' }]];
    rows = rows.slice(0, 300).map(r => (Array.isArray(r) ? r : []).slice(0, 40));
    const nc = Math.max(1, ...rows.map(r => r.length));
    rows = rows.map(r => Array.from({ length: nc }, (_, c) => {
      const x = r[c] && typeof r[c] === 'object' ? r[c] : { t: r[c] == null ? '' : String(r[c]) };
      const o = { t: String(x.t == null ? '' : x.t).slice(0, 5000) };
      if (['left', 'center', 'right'].includes(x.al)) o.al = x.al;
      if (x.b) o.b = 1; if (x.i) o.i = 1;
      if (hex(x.bg)) o.bg = x.bg; if (hex(x.fg)) o.fg = x.fg;
      const cs = Math.round(Number(x.cs) || 1), rs = Math.round(Number(x.rs) || 1);
      if (cs > 1) o.cs = Math.min(cs, nc - c); if (rs > 1) o.rs = rs;
      return o;
    }));
    const st = Object.assign({}, TBDEF, t.st || {});
    for (const k in TBOPT) if (!TBOPT[k].includes(st[k])) st[k] = TBDEF[k];
    const n = (k, a, b) => { const v = Number(st[k]); st[k] = Number.isFinite(v) ? Math.min(b, Math.max(a, v)) : TBDEF[k]; };
    n('size', 8, 48); n('headSize', 0, 60); n('headWeight', 300, 900); n('bw', 0, 8); n('radius', 0, 40); n('pad', 0, 40); n('capSize', 10, 60); n('capWeight', 300, 900); n('minColW', 0, 600);
    for (const k of ['color', 'bg', 'headBg', 'headFg', 'footBg', 'footFg', 'stripeBg', 'hoverBg', 'bc', 'capColor']) if (!hex(st[k]) && st[k] !== 'transparent') st[k] = TBDEF[k];
    if (st.firstColBg && !hex(st.firstColBg)) st.firstColBg = '';
    st.stripe = !!st.stripe; st.hover = !!st.hover; st.firstColBold = !!st.firstColBold;
    st.font = String(st.font || '').replace(/[^\w ก-๙-]/g, '').slice(0, 60);
    const head = Math.max(0, Math.min(rows.length, Math.round(Number(t.head ?? 1))));
    return { rows, head, headCol: !!t.headCol, foot: !!t.foot && rows.length - head > 1, caption: String(t.caption || '').slice(0, 300), note: String(t.note || '').slice(0, 500),
      colW: Array.from({ length: nc }, (_, c) => Math.max(0, Math.min(2000, Number((t.colW || [])[c]) || 0))),
      sort: !!t.sort, search: !!t.search, sticky: t.sticky !== false, maxH: Math.max(0, Math.min(4000, Number(t.maxH) || 0)), wrap: t.wrap !== false, st };
  }
  /** เซลล์ที่ถูกเซลล์อื่นรวมทับ (colspan/rowspan) */
  function tableCover(rows) {
    const cov = rows.map(r => r.map(() => false));
    rows.forEach((r, ri) => r.forEach((c, ci) => {
      if (cov[ri][ci]) return;
      for (let a = 0; a < (c.rs || 1); a++) for (let b = 0; b < (c.cs || 1); b++) if ((a || b) && cov[ri + a] && ci + b < r.length) cov[ri + a][ci + b] = true;
    }));
    return cov;
  }
  function tableHtml(it, opts = {}) {
    const T = normTable(it.tb), s = T.st, cw = opts.cw, px = v => cw ? `calc(${v} * 100cqw / ${cw})` : `${v}px`;
    const cov = tableCover(T.rows), nr = T.rows.length, footAt = T.foot ? nr - 1 : -1;
    const sh = { none: 'none', soft: '0 4px 14px rgba(15,23,42,.08)', md: '0 10px 28px rgba(15,23,42,.14)', strong: '0 20px 48px rgba(15,23,42,.22)' }[s.shadow];
    const vars = [`--tbf:${s.font ? `'${s.font}',` : ''}inherit`, `--tbs:${px(s.size)}`, `--tbc:${s.color}`, `--tbbg:${s.bg}`, `--tbhb:${s.headBg}`, `--tbhf:${s.headFg}`, `--tbhw:${s.headWeight}`,
      `--tbhs:${s.headSize ? px(s.headSize) : '1em'}`, `--tbfb:${s.footBg}`, `--tbff:${s.footFg}`, `--tbsb:${s.stripeBg}`, `--tbhv:${s.hoverBg}`, `--tbbw:${px(s.bw)}`, `--tbbc:${s.bc}`,
      `--tbr:${px(s.radius)}`, `--tbp:${px(s.pad)}`, `--tbsh:${sh}`, `--tbal:${s.align}`, `--tbha:${s.headAlign}`, `--tbva:${s.vAlign}`, `--tbmw:${px(s.minColW)}`,
      `--tbcc:${s.capColor}`, `--tbcs:${px(s.capSize)}`, `--tbcw:${s.capWeight}`, `--tbca:${s.capAlign}`, s.firstColBg ? `--tbfc:${s.firstColBg}` : ''].filter(Boolean).join(';');
    const cell = (c, ri, ci, tag, scope) => {
      const st = [c.al ? `text-align:${c.al}` : '', c.b ? 'font-weight:700' : '', c.i ? 'font-style:italic' : '', c.bg ? `background:${c.bg}` : '', c.fg ? `color:${c.fg}` : ''].filter(Boolean).join(';');
      return `<${tag}${scope ? ` scope="${scope}"` : ''}${c.cs > 1 ? ` colspan="${c.cs}"` : ''}${c.rs > 1 ? ` rowspan="${c.rs}"` : ''}${st ? ` style="${st}"` : ''}>${richText(c.t)}</${tag}>`;
    };
    const tr = ri => {
      const isH = ri < T.head, isF = ri === footAt;
      return `<tr>${T.rows[ri].map((c, ci) => cov[ri][ci] ? '' : isH ? cell(c, ri, ci, 'th', 'col') : (T.headCol && ci === 0) ? cell(c, ri, ci, 'th', isF ? '' : 'row') : cell(c, ri, ci, 'td')).join('')}</tr>`;
    };
    const idx = [...Array(nr).keys()];
    const thead = T.head ? `<thead>${idx.slice(0, T.head).map(tr).join('')}</thead>` : '';
    const tbody = `<tbody>${idx.slice(T.head, footAt < 0 ? nr : footAt).map(tr).join('')}</tbody>`;
    const tfoot = footAt >= 0 ? `<tfoot>${tr(footAt)}</tfoot>` : '';
    const hasW = T.colW.some(Boolean), tot = T.colW.reduce((a, b) => a + (b || 0), 0);
    const cols = hasW ? `<colgroup>${T.colW.map(v => `<col${v ? ` style="width:${(v / tot * 100).toFixed(2)}%"` : ''}>`).join('')}</colgroup>` : '';
    const sortable = T.sort && T.head && !T.rows.slice(T.head, footAt < 0 ? nr : footAt).some(r => r.some(c => c.rs > 1 || c.cs > 1));
    const cls = `utb-w b-${s.border}${s.stripe ? ' strp' : ''}${s.hover ? ' hov' : ''}${T.sticky ? ' stk' : ''}${T.headCol ? ' hcol' : ''}${s.firstColBold ? ' fcb' : ''}${s.firstColBg ? ' fcbg' : ''}${T.wrap ? '' : ' nowrap'}${opts.fill ? ' fill' : ''}`;
    return `<div class="${cls}" style="${vars}"${sortable ? ' data-sort' : ''}>${T.caption ? `<div class="utb-cap">${esc(T.caption)}</div>` : ''}${T.search ? `<div class="utb-tools"><input type="search" class="utb-q" placeholder="ค้นหาในตาราง…" aria-label="ค้นหาในตาราง"></div>` : ''}<div class="utb-sc"${T.maxH && !opts.fill ? ` style="max-height:${px(T.maxH)}"` : ''}><table class="utb">${cols}${thead}${tbody}${tfoot}</table></div>${T.note ? `<div class="utb-note">${richText(T.note)}</div>` : ''}</div>`;
  }
  const TB_CSS = `
.utb-w{font-family:var(--tbf);font-size:var(--tbs);color:var(--tbc);display:flex;flex-direction:column;gap:.6em;min-width:0;box-sizing:border-box}
.utb-w.fill{height:100%}.utb-w.fill .utb-sc{flex:1;min-height:0}
.utb-cap{color:var(--tbcc);font-size:var(--tbcs);font-weight:var(--tbcw);text-align:var(--tbca);line-height:1.3}
.utb-note{font-size:.85em;opacity:.75}
.utb-tools{display:flex}.utb-q{flex:1;max-width:320px;font:inherit;font-size:.92em;padding:.45em .75em;border:1px solid var(--tbbc);border-radius:8px;background:#fff;color:#0f172a;outline:0;box-sizing:border-box}.utb-q:focus{border-color:var(--tbhb);box-shadow:0 0 0 3px color-mix(in srgb,var(--tbhb) 20%,transparent)}
.utb-sc{overflow:auto;border-radius:var(--tbr);box-shadow:var(--tbsh);background:var(--tbbg);-webkit-overflow-scrolling:touch}
.utb{width:100%;border-collapse:separate;border-spacing:0;background:var(--tbbg);color:var(--tbc);font-size:1em;line-height:1.5}
.utb th,.utb td{padding:var(--tbp) calc(var(--tbp) * 1.3);text-align:var(--tbal);vertical-align:var(--tbva);min-width:var(--tbmw);word-break:break-word}
.utb-w.nowrap .utb th,.utb-w.nowrap .utb td{white-space:nowrap}
.utb thead th{background:var(--tbhb);color:var(--tbhf);font-weight:var(--tbhw);font-size:var(--tbhs);text-align:var(--tbha)}
.utb-w.stk thead th{position:sticky;top:0;z-index:2}
.utb tfoot td,.utb tfoot th{background:var(--tbfb);color:var(--tbff);font-weight:700}
.utb-w.strp tbody tr:nth-child(even) td,.utb-w.strp tbody tr:nth-child(even) th{background:var(--tbsb)}
.utb-w.hov tbody tr:hover td,.utb-w.hov tbody tr:hover th{background:var(--tbhv)}
.utb-w.hcol tbody th{font-weight:700;text-align:left}
.utb-w.fcb tbody td:first-child{font-weight:700}.utb-w.fcbg tbody td:first-child,.utb-w.fcbg tbody th:first-child{background:var(--tbfc)}
.utb-w.b-all th,.utb-w.b-all td{border-right:var(--tbbw) solid var(--tbbc);border-bottom:var(--tbbw) solid var(--tbbc)}
.utb-w.b-all .utb{border-top:var(--tbbw) solid var(--tbbc);border-left:var(--tbbw) solid var(--tbbc)}
.utb-w.b-all .utb-sc{border-radius:var(--tbr)}
.utb-w.b-rows tbody tr:not(:last-child) td,.utb-w.b-rows tbody tr:not(:last-child) th,.utb-w.b-rows thead tr:last-child th{border-bottom:var(--tbbw) solid var(--tbbc)}
.utb-w.b-rows tfoot td,.utb-w.b-rows tfoot th{border-top:var(--tbbw) solid var(--tbbc)}
.utb-w.b-cols th:not(:last-child),.utb-w.b-cols td:not(:last-child){border-right:var(--tbbw) solid var(--tbbc)}
.utb-w.b-outer .utb-sc{border:var(--tbbw) solid var(--tbbc)}
.utb a{color:inherit;text-decoration:underline}
.utb-w[data-sort] thead tr:last-child th{cursor:pointer;user-select:none}
.utb-w[data-sort] thead tr:last-child th::after{content:'⇅';opacity:.45;margin-left:.4em;font-size:.85em}
.utb-w[data-sort] thead th[aria-sort=ascending]::after{content:'▲';opacity:.9}.utb-w[data-sort] thead th[aria-sort=descending]::after{content:'▼';opacity:.9}
.utb tr.utb-hide{display:none}
`;
  const FA_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css';
  return { DEF, OPT, LABEL, PRESETS, FONTS, fontUrl, norm, fromLegacy, shade, vars, buttonHtml, CSS: CSS + IMG_CSS + TB_CSS, FA_CSS, esc,
    TDEF, TOPT, TPRESETS, normText, richText, textHtml, dividerHtml, spacerHtml,
    IDEF, IOPT, IPRESETS, normImg, imageHtml, TBDEF, TBOPT, TBPRESETS, normTable, tableHtml, tableCover, ENTERS: ['none', 'fade', 'fade-up', 'fade-down', 'slide-left', 'slide-right', 'zoom', 'zoom-out', 'flip', 'blur', 'rotate'] };
});
