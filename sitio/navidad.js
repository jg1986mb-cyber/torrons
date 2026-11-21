/* ============================================================
   🎄 Decoración navideña · Café Torrons
   Todo es dibujo original (SVG/CSS/canvas): sin personajes,
   marcas, música ni imágenes de terceros.
   Se activa sola entre NV_DESDE y NV_HASTA.
   ============================================================ */
(function () {
  var NV_DESDE = new Date(2026, 10, 20);   // 20 nov 2026
  var NV_HASTA = new Date(2027, 0, 7);     // hasta el 6 ene 2027 (Día de Reyes)
  var hoy = new Date();
  var forzar = /[?&]navidad=1/.test(location.search);
  if (!forzar && (hoy < NV_DESDE || hoy >= NV_HASTA)) return;

  var calmado = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var COLORES = ['#ff4d4d', '#ffd23f', '#3ddc84', '#4dabff', '#ff8c1a', '#ff6ec7'];

  /* ---------- Estilos ---------- */
  var css = `
  .nv-logo { position: relative; display: inline-block; line-height: 0; flex: 0 0 auto; }
  .nv-gorro { position: absolute; width: 82%; left: 28%; top: -48%; transform: rotate(18deg); transform-origin: 20% 90%;
    pointer-events: none; filter: drop-shadow(0 2px 2px rgba(0,0,0,.35)); animation: nvGorro 3.2s ease-in-out infinite; z-index: 2; }
  @keyframes nvGorro { 0%,100% { transform: rotate(18deg); } 50% { transform: rotate(10deg); } }
  .nv-gorro .pompon { animation: nvPompon 3.2s ease-in-out infinite; transform-origin: 82px 14px; }
  @keyframes nvPompon { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-3px,3px); } }

  header { overflow: visible; }
  .nv-guirnalda { position: absolute; left: 0; right: 0; bottom: -15px; height: 22px; pointer-events: none; z-index: 3; }
  .nv-guirnalda svg { width: 100%; height: 22px; display: block; }
  .nv-foco { animation: nvFoco 1.6s ease-in-out infinite; }
  @keyframes nvFoco { 0%,100% { opacity: 1; filter: drop-shadow(0 0 4px currentColor); } 50% { opacity: .35; filter: none; } }

  .nv-nieve { position: fixed; inset: 0; pointer-events: none; z-index: 90; }

  .nv-banner { position: relative; overflow: hidden; color: #fff; padding: 26px 18px 22px;
    background: radial-gradient(ellipse at 22% 85%, rgba(255,150,60,.45), transparent 55%),
                radial-gradient(ellipse at 85% 10%, rgba(255,210,120,.18), transparent 50%),
                linear-gradient(160deg, #2b1410 0%, #5a1d14 55%, #7a2a12 100%); }
  .nv-banner::after { content: ''; position: absolute; inset: 0; pointer-events: none;
    background: radial-gradient(circle at 22% 80%, rgba(255,170,80,.25), transparent 40%); animation: nvCalor 3s ease-in-out infinite; }
  @keyframes nvCalor { 0%,100% { opacity: .6; } 50% { opacity: 1; } }
  .nv-wrap { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; gap: 22px; position: relative; z-index: 1; }
  .nv-pino { width: 150px; flex: 0 0 auto; }
  .nv-txt { flex: 1; min-width: 0; }
  .nv-txt h2 { font-family: 'Playfair Display', serif; font-size: 1.9rem; line-height: 1.15; margin: 0 0 6px; color: #ffe2a8;
    text-shadow: 0 0 18px rgba(255,190,90,.55); }
  .nv-txt p { margin: 0 0 12px; opacity: .92; font-size: .98rem; }
  .nv-btns { display: flex; gap: 10px; flex-wrap: wrap; }
  .nv-btn { border: none; cursor: pointer; font-family: inherit; font-weight: 700; font-size: .92rem; padding: 11px 18px; border-radius: 999px;
    background: linear-gradient(135deg, #e86a17, #c41e3a); color: #fff; box-shadow: 0 4px 14px rgba(232,106,23,.45); }
  .nv-btn.sec { background: rgba(255,255,255,.12); box-shadow: none; border: 1.5px solid rgba(255,255,255,.35); }
  .nv-taza { width: 96px; flex: 0 0 auto; }
  .nv-vapor path { animation: nvVapor 3s ease-in-out infinite; opacity: 0; }
  .nv-vapor path:nth-child(2) { animation-delay: 1s; } .nv-vapor path:nth-child(3) { animation-delay: 2s; }
  @keyframes nvVapor { 0% { opacity: 0; transform: translateY(8px); } 40% { opacity: .8; } 100% { opacity: 0; transform: translateY(-14px); } }
  .nv-estrella { animation: nvEstrella 2.4s ease-in-out infinite; transform-origin: 75px 14px; }
  @keyframes nvEstrella { 0%,100% { transform: scale(1) rotate(0); filter: drop-shadow(0 0 4px #ffd23f); } 50% { transform: scale(1.15) rotate(8deg); filter: drop-shadow(0 0 12px #ffd23f); } }
  .nv-luz { animation: nvFoco 1.4s ease-in-out infinite; }
  .nv-regalo .tapa { animation: nvTapa 2.8s ease-in-out infinite; transform-box: fill-box; transform-origin: center bottom; }
  @keyframes nvTapa { 0%,80%,100% { transform: translateY(0); } 88% { transform: translateY(-4px) rotate(-4deg); } }
  .nv-chispa { position: absolute; width: 4px; height: 4px; border-radius: 50%; background: #ffd27a; box-shadow: 0 0 6px #ffb347;
    animation: nvChispa 4s linear infinite; opacity: 0; }
  @keyframes nvChispa { 0% { opacity: 0; transform: translateY(0); } 15% { opacity: 1; } 100% { opacity: 0; transform: translateY(-90px) translateX(12px); } }

  .nv-adorno { position: absolute; top: 100%; width: 18px; pointer-events: none; z-index: 4; transform-origin: top center; animation: nvColgar 3.5s ease-in-out infinite; }
  @keyframes nvColgar { 0%,100% { transform: rotate(6deg); } 50% { transform: rotate(-6deg); } }


  .hero-banner > a { display: block; position: relative; max-width: 1920px; margin: 0 auto; }
  .nv-portada { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
  .nv-p-logo { position: absolute; }
  .nv-p-logo .nv-gorro { width: 80%; left: 34%; top: -40%; }
  .nv-p-banda { position: absolute; left: 0; right: 0; overflow: hidden; }
  .nv-pm { display: none; } 
  @media (max-width: 700px) { .nv-pm { display: block; } .nv-pd { display: none; } }
  .nv-real { position: absolute; top: -12%; will-change: transform; animation: nvCae linear infinite; }
  .nv-real svg { display: block; width: 100%; animation: nvGira ease-in-out infinite alternate; }
  @keyframes nvCae { from { transform: translate(0, 0) rotate(0); } to { transform: translate(var(--dx, 0px), 125cqh) rotate(var(--rot, 40deg)); } }
  @keyframes nvGira { from { transform: scaleX(1); } to { transform: scaleX(.55); } }
  .nv-p-banda { container-type: size; }
  @media (prefers-reduced-motion: reduce) { .nv-real { display: none; } }
  .nv-gorrito-footer { display: inline-block; animation: nvGorro 3.2s ease-in-out infinite; }

  @media (max-width: 700px) {
    .nv-banner { padding: 18px 14px 16px; }
    .nv-wrap { gap: 12px; }
    .nv-pino { width: 92px; }
    .nv-taza { display: none; }
    .nv-txt h2 { font-size: 1.35rem; }
    .nv-txt p { font-size: .86rem; margin-bottom: 10px; }
    .nv-btn { font-size: .82rem; padding: 9px 14px; }
    .nv-adorno { display: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    .nv-gorro, .nv-gorro .pompon, .nv-foco, .nv-luz, .nv-estrella, .nv-vapor path, .nv-regalo .tapa, .nv-chispa, .nv-adorno, .nv-banner::after { animation: none !important; }
    .nv-vapor path { opacity: .5; }
  }`;
  var st = document.createElement('style'); st.id = 'nv-css'; st.textContent = css; document.head.appendChild(st);

  /* ---------- Dibujos ---------- */
  var GORRO = '<svg class="nv-gorro" viewBox="0 0 100 80" aria-hidden="true">'
    + '<path d="M14 62 C20 34 42 10 82 14 C70 24 66 38 70 58 Z" fill="#d8232f"/>'
    + '<path d="M30 40 C40 26 56 18 76 16 C66 26 62 36 64 50 Z" fill="#b51824" opacity=".55"/>'
    + '<rect x="6" y="56" width="70" height="16" rx="8" fill="#fff"/>'
    + '<rect x="6" y="56" width="70" height="6" rx="3" fill="#e9eef2" opacity=".7"/>'
    + '<g class="pompon"><circle cx="82" cy="14" r="9" fill="#fff"/><circle cx="79" cy="11" r="3.5" fill="#eef3f6"/></g></svg>';

  function guirnalda(n) {
    var w = 1000, s = '<svg viewBox="0 0 ' + w + ' 22" preserveAspectRatio="none" aria-hidden="true">'
      + '<path d="M0 3 ' + Array.from({ length: n }, function (_, i) { var x = (i + 1) * w / n; return 'Q' + (x - w / n / 2) + ' 12 ' + x + ' 3'; }).join(' ') + '" fill="none" stroke="#2d4a2b" stroke-width="1.6"/>';
    for (var i = 0; i < n; i++) {
      var x = (i + .5) * w / n, c = COLORES[i % COLORES.length];
      s += '<g class="nv-foco" style="color:' + c + ';animation-delay:' + ((i % 3) * .5) + 's"><rect x="' + (x - 2) + '" y="6" width="4" height="3" fill="#3a3a3a"/>'
        + '<ellipse cx="' + x + '" cy="14" rx="3.2" ry="5" fill="' + c + '"/></g>';
    }
    return s + '</svg>';
  }

  function pino() {
    var luces = [[60, 40], [88, 46], [50, 64], [74, 70], [100, 74], [42, 92], [66, 98], [92, 100], [114, 96], [34, 120], [58, 126], [84, 128], [108, 124], [126, 120]];
    var s = '<svg class="nv-pino" viewBox="0 0 150 190" aria-hidden="true">'
      + '<ellipse cx="75" cy="178" rx="58" ry="7" fill="rgba(0,0,0,.3)"/>'
      + '<rect x="67" y="150" width="16" height="22" rx="2" fill="#6b3b1f"/>'
      + '<path d="M75 22 L118 78 L100 78 L132 118 L110 118 L142 154 L8 154 L40 118 L18 118 L50 78 L32 78 Z" fill="#1f6b3a"/>'
      + '<path d="M75 22 L118 78 L100 78 L132 118 L110 118 L142 154 L75 154 Z" fill="#185a30"/>'
      + '<path d="M44 74 Q75 90 108 72 M30 112 Q75 132 122 110 M22 148 Q75 164 132 146" fill="none" stroke="#ffd27a" stroke-width="1.6" stroke-dasharray="3 4" opacity=".85"/>';
    luces.forEach(function (p, i) {
      var c = COLORES[i % COLORES.length];
      s += '<circle class="nv-luz" cx="' + p[0] + '" cy="' + p[1] + '" r="4" fill="' + c + '" style="color:' + c + ';animation-delay:' + ((i * 0.23) % 1.4).toFixed(2) + 's"/>';
    });
    s += '<path class="nv-estrella" d="M75 2 L80 12 L91 13 L83 20 L85 31 L75 25 L65 31 L67 20 L59 13 L70 12 Z" fill="#ffd23f"/>'
      + '<g class="nv-regalo"><rect x="20" y="158" width="26" height="18" fill="#c41e3a"/><rect x="31" y="158" width="4" height="18" fill="#ffd23f"/>'
      + '<g class="tapa"><rect x="18" y="153" width="30" height="7" fill="#e0334f"/><rect x="31" y="153" width="4" height="7" fill="#ffd23f"/></g></g>'
      + '<g class="nv-regalo"><rect x="104" y="160" width="24" height="16" fill="#2f7bd8"/><rect x="114" y="160" width="4" height="16" fill="#fff"/>'
      + '<g class="tapa" style="animation-delay:1.3s"><rect x="102" y="155" width="28" height="7" fill="#4a90e2"/><rect x="114" y="155" width="4" height="7" fill="#fff"/></g></g>'
      + '</svg>';
    return s;
  }

  var TAZA = '<svg class="nv-taza" viewBox="0 0 100 100" aria-hidden="true">'
    + '<g class="nv-vapor" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="3" stroke-linecap="round">'
    + '<path d="M34 34 q-6 -8 0 -16 q6 -8 0 -16"/><path d="M50 34 q-6 -8 0 -16 q6 -8 0 -16"/><path d="M66 34 q-6 -8 0 -16 q6 -8 0 -16"/></g>'
    + '<path d="M18 40 h64 v26 a22 22 0 0 1 -22 22 h-20 a22 22 0 0 1 -22 -22 z" fill="#f4ede4"/>'
    + '<path d="M82 46 h6 a10 10 0 0 1 0 20 h-7" fill="none" stroke="#f4ede4" stroke-width="5"/>'
    + '<ellipse cx="50" cy="41" rx="31" ry="5" fill="#5b2c17"/>'
    + '<path d="M22 54 h56" stroke="#c41e3a" stroke-width="5"/><path d="M22 60 h56" stroke="#2f7a3c" stroke-width="3"/>'
    + '<ellipse cx="50" cy="92" rx="34" ry="4" fill="rgba(0,0,0,.25)"/></svg>';

  var MONEDA = '<svg viewBox="0 0 40 40" style="ANIM"><circle cx="20" cy="20" r="19" fill="#b8860b"/><circle cx="20" cy="20" r="16.5" fill="#f2c230"/>'
    + '<circle cx="20" cy="20" r="13" fill="none" stroke="#c9961a" stroke-width="1.4" stroke-dasharray="2 2"/>'
    + '<text x="20" y="26.5" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="18" fill="#9a6b07">Q</text>'
    + '<ellipse cx="14" cy="12" rx="5" ry="3" fill="#fff" opacity=".45"/></svg>';
  var BILLETE = '<svg viewBox="0 0 80 40" style="ANIM"><rect x="1" y="1" width="78" height="38" rx="3" fill="#3f8f4e" stroke="#2a6a36" stroke-width="2"/>'
    + '<rect x="6" y="6" width="68" height="28" rx="2" fill="none" stroke="#a8d8a0" stroke-width="1.2"/>'
    + '<circle cx="40" cy="20" r="10" fill="#6fbf73"/><text x="40" y="25.5" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="15" fill="#1f5a2a">Q</text>'
    + '<text x="11" y="15" font-family="Arial" font-weight="700" font-size="7" fill="#d9f2d3">Q</text><text x="64" y="32" font-family="Arial" font-weight="700" font-size="7" fill="#d9f2d3">Q</text></svg>';

  function adorno(c) {
    return '<svg viewBox="0 0 18 40" aria-hidden="true"><line x1="9" y1="0" x2="9" y2="20" stroke="#cfa64a" stroke-width="1"/>'
      + '<rect x="6.5" y="18" width="5" height="4" fill="#cfa64a"/><circle cx="9" cy="30" r="8" fill="' + c + '"/>'
      + '<circle cx="6" cy="27" r="2.4" fill="#fff" opacity=".55"/></svg>';
  }

  /* ---------- Montaje ---------- */
  function montar() {
    // 1) Gorro sobre los logos (encabezado y pie)
    document.querySelectorAll('header .logo img, footer img[src*="logo-torrons"]').forEach(function (img) {
      if (img.parentNode.classList.contains('nv-logo')) return;
      var w = document.createElement('span'); w.className = 'nv-logo';
      img.parentNode.insertBefore(w, img); w.appendChild(img);
      w.insertAdjacentHTML('beforeend', GORRO);
    });

    // 2) Guirnalda de luces y esferas colgando del encabezado
    var hdr = document.querySelector('header');
    if (hdr && !hdr.querySelector('.nv-guirnalda')) {
      var g = document.createElement('div'); g.className = 'nv-guirnalda';
      g.innerHTML = guirnalda(window.innerWidth < 700 ? 16 : 34);
      hdr.appendChild(g);
      [['8%', '#c41e3a', 0], ['31%', '#ffd23f', .8], ['69%', '#2f7bd8', .4], ['92%', '#3ddc84', 1.2]].forEach(function (a) {
        var d = document.createElement('div'); d.className = 'nv-adorno';
        d.style.left = a[0]; d.style.animationDelay = a[2] + 's'; d.innerHTML = adorno(a[1]); hdr.appendChild(d);
      });
    }

    // 3) Banner acogedor con pino, taza humeante y chispas
    var hero = document.querySelector('.hero-banner');
    if (hero && !document.querySelector('.nv-banner')) {
      var b = document.createElement('section'); b.className = 'nv-banner'; b.setAttribute('aria-label', 'Felices fiestas');
      b.innerHTML = '<div class="nv-wrap">' + pino()
        + '<div class="nv-txt"><h2>¡Felices fiestas!</h2>'
        + '<p>Este fin de año compártelo con algo rico y calientito. Te lo llevamos a tu casa.</p>'
        + '<div class="nv-btns"><button class="nv-btn" onclick="filterCategory(\'bebidas\');document.getElementById(\'menu\').scrollIntoView({behavior:\'smooth\'})">☕ Bebidas calientes</button>'
        + '<button class="nv-btn sec" onclick="document.getElementById(\'menu\').scrollIntoView({behavior:\'smooth\'})">🎁 Ver menú</button></div></div>'
        + TAZA + '</div>';
      for (var i = 0; i < 10; i++) {
        var ch = document.createElement('span'); ch.className = 'nv-chispa';
        ch.style.left = (8 + Math.random() * 30) + '%'; ch.style.bottom = (5 + Math.random() * 25) + '%';
        ch.style.animationDelay = (Math.random() * 4).toFixed(2) + 's'; b.appendChild(ch);
      }
      hero.parentNode.insertBefore(b, hero.nextSibling);
    }

    // 4) Portada: gorro en el logo de la imagen y realitos cayendo en la franja naranja
    var aP = document.querySelector('.hero-banner > a');
    if (aP && !aP.querySelector('.nv-portada')) {
      var cfg = [
        { cls: 'nv-pd', hat: 'width:64%;left:40%;top:-30%', logo: [39.7, 31.5, 20.6, 36.7], banda: [29.8, 40.4], n: 16 },   // computadora (1920x1080)
        { cls: 'nv-pm', hat: '', logo: [37.5, 24.8, 25, 20], banda: [23.2, 53.8], n: 11 }         // celular (1080x1350)
      ];
      var html = '';
      cfg.forEach(function (c) {
        var reales = '';
        for (var i = 0; i < c.n; i++) {
          var bill = Math.random() < .22, w = bill ? (c.cls === 'nv-pm' ? 9 : 4.2) : (c.cls === 'nv-pm' ? 7 + Math.random() * 3 : 2.6 + Math.random() * 1.6);
          var dur = 9 + Math.random() * 9, del = -Math.random() * dur;
          var x; do { x = Math.random() * 96; } while (x + w > c.logo[0] - 1 && x < c.logo[0] + c.logo[2] + 1);
          reales += '<span class="nv-real" style="left:' + x.toFixed(1) + '%;width:' + w.toFixed(2) + '%;animation-duration:' + dur.toFixed(1) + 's;animation-delay:' + del.toFixed(1)
            + 's;--dx:' + Math.round(Math.random() * 60 - 30) + 'px;--rot:' + Math.round(Math.random() * 120 - 60) + 'deg">'
            + (bill ? BILLETE : MONEDA).replace('ANIM', 'animation-duration:' + (1.6 + Math.random() * 2).toFixed(2) + 's') + '</span>';
        }
        html += '<div class="nv-p-logo ' + c.cls + '" style="left:' + c.logo[0] + '%;top:' + c.logo[1] + '%;width:' + c.logo[2] + '%;height:' + c.logo[3] + '%">' + GORRO.replace('class="nv-gorro"', 'class="nv-gorro" style="' + c.hat + '"') + '</div>'
          + '<div class="nv-p-banda ' + c.cls + '" style="top:' + c.banda[0] + '%;height:' + c.banda[1] + '%">' + reales + '</div>';
      });
      var ov = document.createElement('div'); ov.className = 'nv-portada'; ov.setAttribute('aria-hidden', 'true'); ov.innerHTML = html;
      aP.appendChild(ov);
      // el gorro va encima de las monedas
      ov.querySelectorAll('.nv-p-logo').forEach(function (l) { ov.appendChild(l); });
    }

    // 5) Nieve
    if (!calmado) nieve();
  }

  function nieve() {
    if (document.querySelector('.nv-nieve')) return;
    var cv = document.createElement('canvas'); cv.className = 'nv-nieve'; document.body.appendChild(cv);
    var ctx = cv.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 2), W, H, copos = [];
    function tam() { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    tam(); addEventListener('resize', tam);
    var N = W < 700 ? 34 : 70;
    for (var i = 0; i < N; i++) copos.push({ x: Math.random() * W, y: Math.random() * H, r: 1 + Math.random() * 2.6, v: .35 + Math.random() * .9, f: Math.random() * 6.28, a: .45 + Math.random() * .5 });
    var vivo = true;
    document.addEventListener('visibilitychange', function () { vivo = !document.hidden; if (vivo) requestAnimationFrame(paso); });
    function paso() {
      if (!vivo) return;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < copos.length; i++) {
        var c = copos[i]; c.y += c.v; c.f += .012; c.x += Math.sin(c.f) * .45;
        if (c.y > H + 5) { c.y = -5; c.x = Math.random() * W; }
        if (c.x > W + 5) c.x = -5; else if (c.x < -5) c.x = W + 5;
        ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, 6.283); ctx.fillStyle = 'rgba(255,255,255,' + c.a + ')'; ctx.fill();
      }
      requestAnimationFrame(paso);
    }
    requestAnimationFrame(paso);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar); else montar();
})();
