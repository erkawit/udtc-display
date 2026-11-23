/* วางคู่กับ <iframe data-uw-embed>: ปรับความสูงอัตโนมัติ + แสดงภาพขยาย (lightbox) บนหน้าเว็บหลัก */
(function () {
  if (window.__uwEmbed) return; window.__uwEmbed = true;
  function showLB(src, t) {
    var o = document.createElement('div'); o.setAttribute('role', 'dialog');
    o.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:rgba(15,23,42,.9);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;cursor:zoom-out;font-family:Sarabun,system-ui,sans-serif';
    var im = document.createElement('img'); im.src = src; im.alt = t || '';
    im.style.cssText = 'max-width:94vw;max-height:84vh;object-fit:contain;border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,.5);background:#fff';
    var c = document.createElement('div'); c.textContent = t || ''; c.style.cssText = 'color:#fff;margin-top:14px;font-size:16px;text-align:center;max-width:90vw';
    var x = document.createElement('button'); x.textContent = '✕'; x.setAttribute('aria-label', 'ปิด');
    x.style.cssText = 'position:absolute;top:14px;right:18px;width:44px;height:44px;border-radius:99px;border:0;background:rgba(255,255,255,.15);color:#fff;font-size:20px;cursor:pointer';
    var a = document.createElement('a'); a.href = src; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'เปิดภาพขนาดเต็ม'; a.style.cssText = 'color:#cbd5e1;font-size:13px;margin-top:6px';
    o.appendChild(x); o.appendChild(im); o.appendChild(c); if (!/^data:/.test(src)) o.appendChild(a);
    function close() { o.remove(); document.removeEventListener('keydown', k); }
    function k(e) { if (e.key === 'Escape') close(); }
    o.addEventListener('click', function (e) { if (e.target !== a) close(); });
    document.addEventListener('keydown', k); document.body.appendChild(o);
  }
  /* ขอความสูงจาก iframe ทันทีที่สคริปต์นี้พร้อม — แก้กรณีเปิดเว็บครั้งแรก สคริปต์นี้โหลดช้ากว่า iframe
     ทำให้พลาดข้อความแจ้งความสูง iframe จึงค้างที่ความสูงเริ่มต้น (เช่น 420px) จนกว่าจะ refresh */
  function ping(f) { try { f.contentWindow && f.contentWindow.postMessage({ type: 'uw-ping' }, '*'); } catch (err) {} }
  function hook(f) { if (f.__uwHook) return; f.__uwHook = true; f.addEventListener('load', function () { ping(f); }); ping(f); }
  function scan() { var fr = document.querySelectorAll('iframe[data-uw-embed]'); for (var i = 0; i < fr.length; i++) hook(fr[i]); }
  scan();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan);
  window.addEventListener('load', scan);
  var pend = false; if (window.MutationObserver) new MutationObserver(function () { if (pend) return; pend = true; setTimeout(function () { pend = false; scan(); }, 250); }).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('message', function (e) {
    var d = e.data; if (!d || !d.type) return;
    var fr = document.querySelectorAll('iframe[data-uw-embed]'), f = null;
    for (var i = 0; i < fr.length; i++) if (fr[i].contentWindow === e.source) { f = fr[i]; break; }
    if (!f) return;
    if (d.type === 'uw-resize') {
      f.style.height = d.height + 'px';
      if (!f.__uwHello) { f.__uwHello = true; try { e.source.postMessage({ type: 'uw-host' }, '*'); } catch (err) {} }
    } else if (d.type === 'uw-lightbox' && /^https?:/i.test(d.src || '')) showLB(d.src, d.title);
  });
})();
