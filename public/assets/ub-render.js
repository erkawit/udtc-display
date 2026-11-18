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

  const CSS = `
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
  const FA_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css';
  return { DEF, OPT, LABEL, PRESETS, FONTS, fontUrl, norm, fromLegacy, shade, vars, buttonHtml, CSS, FA_CSS, esc };
});
