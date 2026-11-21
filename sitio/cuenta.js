/* ============================================================
   👤 Cuentas de clientes · ⭐ Puntos · 🎰 Máquina de premios
   Café Torrons. Los puntos, premios y tiros los decide el servidor
   (torrons-avisos); aquí solo se muestran y se piden.
   ============================================================ */
(function () {
  'use strict';
  var SRV = 'https://torrons-avisos.analyzerog.workers.dev/cuenta/';
  var MIN_CANJE = 5;
  var cfgFb = (typeof firebaseConfig !== 'undefined' && firebaseConfig) || (window.firebase && firebase.apps[0] && firebase.apps[0].options);
  var app = firebase.initializeApp(cfgFb, 'clientes');   // sesión aparte del administrador y motoristas
  var auth = app.auth(); auth.languageCode = 'es';
  var cdb = app.database();

  var CU = { uid: null, d: null, ref: null };
  window.CU = CU;
  var premioSel = null;            // key del premio elegido para el pedido
  var usarPuntos = false, puntosMonto = 0;
  try { var g = JSON.parse(localStorage.getItem('torronsCanje') || '{}'); premioSel = g.p || null; usarPuntos = !!g.u; puntosMonto = Number(g.m) || 0; } catch (e) {}
  function guardarCanje() { try { localStorage.setItem('torronsCanje', JSON.stringify({ p: premioSel, u: usarPuntos, m: puntosMonto })); } catch (e) {} }

  var $ = function (id) { return document.getElementById(id); };
  var r2 = function (n) { return Math.round((Number(n) || 0) * 100) / 100; };
  var q = function (n) { return 'Q ' + r2(n).toFixed(2); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  function fecha(t, conHora) {
    var d = new Date(t); if (isNaN(d)) return '';
    var f = d.toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return conHora ? f + ' ' + d.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' }) : f;
  }
  function toast(t) { if (window.showToast) showToast(t); else alert(t); }
  function hoyGT() { return new Date(Date.now() - 6 * 3600000).toISOString().slice(0, 10); }

  async function llamar(ruta, cuerpo, conSesion) {
    var h = { 'Content-Type': 'application/json' };
    if (conSesion) {
      if (!auth.currentUser) throw new Error('Entra a tu cuenta primero');
      h.Authorization = 'Bearer ' + await auth.currentUser.getIdToken();
    }
    var r = await fetch(SRV + ruta, { method: 'POST', headers: h, body: JSON.stringify(cuerpo || {}) });
    var d = await r.json().catch(function () { return { ok: false, error: 'Sin conexión con el servidor' }; });
    if (d.sesion) { auth.signOut(); }
    return d;
  }

  // ===================== ESTILOS =====================
  var css = `
  .cu-hbtn{display:inline-flex;align-items:center;gap:6px;border:1.5px solid rgba(255,255,255,.35);background:rgba(255,255,255,.08);color:#fff;border-radius:999px;padding:8px 14px;font-family:inherit;font-weight:600;font-size:.88rem;cursor:pointer;white-space:nowrap}
  .cu-hbtn b{color:#ffd27a}
  .cu-hbtn .cu-ht{display:none}@media(max-width:600px){.cu-hbtn{display:none}}
  .cu-ov{position:fixed;inset:0;background:rgba(20,10,6,.62);z-index:2000;display:none;align-items:flex-end;justify-content:center;backdrop-filter:blur(3px)}
  .cu-ov.open{display:flex}
  @media(min-width:640px){.cu-ov{align-items:center}}
  .cu-modal{background:#fff;width:100%;max-width:440px;max-height:92vh;overflow:auto;border-radius:22px 22px 0 0;padding:22px 20px 26px;position:relative;animation:cuSube .25s ease}
  @media(min-width:640px){.cu-modal{border-radius:22px}}
  @keyframes cuSube{from{transform:translateY(30px);opacity:0}to{transform:none;opacity:1}}
  .cu-x{position:absolute;top:12px;right:12px;width:36px;height:36px;border-radius:50%;border:none;background:#f3efe9;font-size:1.1rem;cursor:pointer}
  .cu-modal h3{font-family:'Playfair Display',serif;font-size:1.45rem;margin:0 0 4px;color:#1a1a1a}
  .cu-sub{color:#666;font-size:.88rem;margin:0 0 14px}
  .cu-lbl{display:block;font-weight:600;font-size:.85rem;margin:12px 0 5px;color:#333}
  .cu-in{width:100%;padding:13px 14px;border:1.5px solid #e2dcd4;border-radius:12px;font-size:1rem;font-family:inherit;box-sizing:border-box;background:#fff}
  .cu-in:focus{outline:none;border-color:#e86a17;box-shadow:0 0 0 3px rgba(232,106,23,.15)}
  .cu-pass{position:relative}.cu-pass .cu-in{padding-right:52px;letter-spacing:2px}
  .cu-ojo{position:absolute;right:6px;top:50%;transform:translateY(-50%);border:none;background:none;font-size:1.25rem;width:42px;height:42px;cursor:pointer;border-radius:10px}
  .cu-ojo:hover{background:#f6f1ea}
  .cu-btn{width:100%;margin-top:16px;padding:14px;border:none;border-radius:14px;background:linear-gradient(135deg,#e86a17,#c41e3a);color:#fff;font-weight:700;font-size:1.02rem;font-family:inherit;cursor:pointer;box-shadow:0 6px 16px rgba(196,30,58,.25)}
  .cu-btn:disabled{opacity:.6}
  .cu-btn.sec{background:#f3efe9;color:#333;box-shadow:none}
  .cu-btn.peligro{background:#fff;color:#c62828;border:1.5px solid #f0c4c4;box-shadow:none}
  .cu-links{display:flex;flex-direction:column;gap:10px;margin-top:16px;text-align:center;font-size:.9rem}
  .cu-links a{color:#b4500f;font-weight:600;text-decoration:none;cursor:pointer}
  .cu-err{color:#c62828;font-size:.86rem;margin-top:10px;min-height:1em}
  .cu-ok{background:#edf7ee;color:#1e6b2a;border-radius:12px;padding:10px 12px;font-size:.88rem;margin-top:10px}
  .cu-nota{font-size:.78rem;color:#777;margin-top:6px}
  .cu-chk{display:flex;gap:8px;align-items:flex-start;font-size:.82rem;margin-top:12px;color:#444}
  .cu-chk input{margin-top:2px;width:18px;height:18px;accent-color:#c41e3a}
  .cu-perfil{background:#faf6f1;border-radius:14px;padding:12px 14px;font-size:.9rem;line-height:1.7}
  .cu-sep{border:none;border-top:1px solid #eee;margin:18px 0 4px}

  /* ===== Mi Torrons ===== */
  .mt{max-width:1100px;margin:26px auto 8px;padding:0 14px}
  .mt-inv{display:flex;align-items:center;gap:16px;background:linear-gradient(135deg,#2b1410,#6b2014);color:#fff;border-radius:20px;padding:18px 20px;box-shadow:0 10px 30px rgba(60,20,10,.25);overflow:hidden;position:relative}
  .mt-inv .big{font-size:3rem;filter:drop-shadow(0 4px 10px rgba(0,0,0,.4));animation:mtBote 2s ease-in-out infinite}
  @keyframes mtBote{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-6px) rotate(4deg)}}
  .mt-inv h3{margin:0 0 4px;font-family:'Playfair Display',serif;color:#ffe2a8;font-size:1.35rem}
  .mt-inv p{margin:0 0 10px;font-size:.9rem;opacity:.92}
  .mt-inv .cu-btn{width:auto;margin:0 8px 0 0;padding:10px 18px;font-size:.92rem}
  .mt-hola{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:12px}
  .mt-hola h3{margin:0;font-family:'Playfair Display',serif;font-size:1.5rem}
  .mt-pts{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#fff3d6,#ffe2a8);border:1.5px solid #f0c66b;border-radius:999px;padding:8px 14px;font-weight:700;color:#6b4300}
  .mt-acc{display:flex;gap:8px;flex-wrap:wrap}
  .mt-pts,.mt-acc button{font-size:.86rem}@media(max-width:600px){.mt-hola h3{font-size:1.2rem}.mt-pts{padding:6px 10px}.mt-acc button{padding:7px 10px;font-size:.8rem}}
  .mt-acc button{border:1.5px solid #e2dcd4;background:#fff;border-radius:999px;padding:9px 14px;font-family:inherit;font-weight:600;font-size:.86rem;cursor:pointer}
  .mt-acc button.pri{background:#1a1a1a;color:#fff;border-color:#1a1a1a}
  .mt-grid{display:grid;grid-template-columns:minmax(0,520px) minmax(0,1fr);gap:22px;align-items:start}
  @media(max-width:900px){.mt-grid{grid-template-columns:1fr}}

  /* ===== Máquina ===== */
  .sm{position:relative;margin:0 auto;max-width:520px;padding-right:30px}
  .sm-cab{position:relative;border-radius:30px 30px 20px 20px;padding:14px 14px 16px;background:linear-gradient(165deg,#e0283a 0%,#a3121f 45%,#5c0810 100%);border:4px solid #e9b949;box-shadow:inset 0 2px 0 rgba(255,255,255,.35),inset 0 -8px 18px rgba(0,0,0,.45),0 22px 44px rgba(60,10,10,.38)}
  .sm-cab::before{content:'';position:absolute;inset:6px;border-radius:24px 24px 14px 14px;border:1.5px solid rgba(255,220,140,.35);pointer-events:none}
  .sm-top{position:relative;background:radial-gradient(ellipse at 50% 0,#3a1a0c,#150906);border-radius:18px 18px 10px 10px;padding:14px 10px 12px;text-align:center;border:2px solid #b88a2a;overflow:hidden}
  .sm-tit{font-family:'Playfair Display',serif;font-weight:700;font-size:1.9rem;letter-spacing:3px;color:#ffe08a;text-shadow:0 0 6px #ffb52e,0 0 18px #ff8a00,0 2px 0 #7a3c00;line-height:1}
  .sm-tit small{display:block;font-family:Poppins,sans-serif;font-size:.62rem;letter-spacing:4px;color:#ffcf8a;margin-top:6px;text-shadow:none;opacity:.9}
  .sm-focos{position:absolute;left:8px;right:8px;display:flex;justify-content:space-between;pointer-events:none}
  .sm-focos.a{top:4px}.sm-focos.b{bottom:3px}
  .sm-focos i{width:7px;height:7px;border-radius:50%;background:#ffd23f;box-shadow:0 0 6px #ffb000;animation:smFoco 1s steps(1) infinite}
  .sm-focos i:nth-child(odd){animation-delay:.5s}
  @keyframes smFoco{0%{opacity:1}50%{opacity:.18}}
  .sm.gira .sm-focos i{animation-duration:.25s}
  .sm.gana .sm-focos i{animation-duration:.12s;background:#fff}
  .sm-ventana{position:relative;margin:14px 4px 10px;padding:10px;border-radius:16px;background:linear-gradient(#2a140b,#120805);box-shadow:inset 0 4px 14px rgba(0,0,0,.8),0 0 0 3px #c9962f,0 0 0 6px #6b0c16}
  .sm-rodillos{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
  .sm-rod{--h:84px;position:relative;height:calc(var(--h)*1.75);overflow:hidden;border-radius:10px;background:linear-gradient(90deg,#d9d0c3,#fffdf8 30%,#fffdf8 70%,#d9d0c3)}
  .sm-rod::after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(rgba(0,0,0,.55),rgba(0,0,0,0) 32%,rgba(0,0,0,0) 68%,rgba(0,0,0,.55)),linear-gradient(105deg,rgba(255,255,255,.35) 0,rgba(255,255,255,0) 40%)}
  .sm-tira{position:absolute;left:0;right:0;top:0;will-change:transform}
  .sm-celda{height:var(--h);display:flex;align-items:center;justify-content:center;font-size:calc(var(--h)*.6);line-height:1;filter:drop-shadow(0 3px 2px rgba(0,0,0,.25))}
  .sm.gira .sm-tira.mov{filter:blur(2.5px)}
  .sm-linea{position:absolute;left:4px;right:4px;top:50%;height:3px;margin-top:-1.5px;background:rgba(255,40,60,.85);box-shadow:0 0 10px #ff2040;pointer-events:none;border-radius:2px;opacity:.85}
  .sm-flecha{position:absolute;top:50%;width:0;height:0;border:9px solid transparent;margin-top:-9px}
  .sm-flecha.i{left:-6px;border-left-color:#ffd23f}.sm-flecha.d{right:-6px;border-right-color:#ffd23f}
  .sm.gana .sm-rod.ok{animation:smBrilla .5s ease-in-out 4}
  @keyframes smBrilla{50%{box-shadow:0 0 0 3px #ffd23f,0 0 24px #ffd23f}}
  .sm-led{display:flex;justify-content:space-between;gap:8px;background:#0d0503;border:2px solid #5a3a10;border-radius:10px;padding:8px 12px;margin:0 4px 12px;font-family:'Courier New',monospace;font-weight:700;color:#ff5a3c;text-shadow:0 0 6px #ff2a00;font-size:.86rem;letter-spacing:1px}
  .sm-led b{color:#ffd23f;text-shadow:0 0 6px #ffb000}
  .sm-bots{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 4px}
  .sm-b{position:relative;border:none;border-radius:16px;padding:14px 8px 16px;font-family:inherit;font-weight:800;font-size:.86rem;letter-spacing:.5px;color:#fff;cursor:pointer;text-transform:uppercase;line-height:1.15;transition:transform .08s,box-shadow .08s}
  .sm-b small{display:block;font-weight:600;font-size:.7rem;letter-spacing:0;text-transform:none;opacity:.9;margin-top:3px}
  .sm-b.d{background:linear-gradient(#3ccf6e,#1f9a4a);box-shadow:0 6px 0 #146b32,0 10px 16px rgba(0,0,0,.35)}
  .sm-b.c{background:linear-gradient(#ffa23c,#e8650f);box-shadow:0 6px 0 #a5420a,0 10px 16px rgba(0,0,0,.35)}
  .sm-b:active:not(:disabled){transform:translateY(5px);box-shadow:0 1px 0 rgba(0,0,0,.4)}
  .sm-b:disabled{filter:grayscale(.85) brightness(.85);cursor:not-allowed}
  .sm-palanca{position:absolute;right:-4px;top:96px;width:34px;height:150px;pointer-events:none}
  .sm-palanca .base{position:absolute;left:0;bottom:6px;width:20px;height:44px;border-radius:6px;background:linear-gradient(90deg,#8a8a8a,#e8e8e8,#7a7a7a)}
  .sm-palanca .palo{position:absolute;left:7px;bottom:40px;width:7px;height:96px;border-radius:4px;background:linear-gradient(90deg,#999,#fff,#888);transform-origin:50% 100%;transition:transform .35s cubic-bezier(.3,1.6,.5,1)}
  .sm-palanca .bola{position:absolute;left:-9px;top:-20px;width:26px;height:26px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ff8a8a,#d4111f 55%,#7a0008)}
  .sm.jala .sm-palanca .palo{transform:scaleY(-.55)}
  .sm-son{position:absolute;top:10px;right:42px;z-index:3;border:none;background:rgba(0,0,0,.35);color:#fff;border-radius:999px;width:30px;height:30px;cursor:pointer;font-size:.9rem}
  .sm-msg{position:absolute;inset:0;display:none;align-items:center;justify-content:center;z-index:4;pointer-events:none}
  .sm-msg.on{display:flex}
  .sm-msg .card{pointer-events:auto;background:linear-gradient(160deg,#fffaf0,#ffe9c2);border:3px solid #e9b949;border-radius:20px;padding:18px 20px;text-align:center;max-width:86%;box-shadow:0 20px 50px rgba(0,0,0,.45);animation:smPop .45s cubic-bezier(.2,1.6,.4,1)}
  @keyframes smPop{from{transform:scale(.3);opacity:0}to{transform:scale(1);opacity:1}}
  .sm-msg .em{font-size:3.2rem;line-height:1}
  .sm-msg h4{margin:6px 0 4px;font-family:'Playfair Display',serif;font-size:1.35rem;color:#7a1a0a}
  .sm-msg p{margin:0 0 10px;font-size:.86rem;color:#5a4030}
  .sm-msg button{border:none;border-radius:999px;padding:9px 18px;background:#c41e3a;color:#fff;font-weight:700;font-family:inherit;cursor:pointer}
  .sm-lluvia{position:absolute;inset:0;pointer-events:none;z-index:3}
  @media(max-width:480px){.sm-tit small{letter-spacing:1.5px;font-size:.56rem}.sm{padding-right:24px}.sm-rod{--h:66px}.sm-tit{font-size:1.5rem}.sm-palanca{top:84px;height:126px}.sm-palanca .palo{height:76px}}

  /* ===== Premios ===== */
  .pr-tit{font-weight:700;font-size:1.05rem;margin:4px 0 10px;display:flex;align-items:center;gap:8px}
  .pr-lista{display:grid;gap:10px}
  .pr{display:flex;gap:12px;align-items:center;background:#fff;border:1.5px solid #eee3d6;border-radius:16px;padding:12px 14px;box-shadow:0 4px 12px rgba(0,0,0,.04)}
  .pr .em{font-size:2rem;width:48px;height:48px;display:flex;align-items:center;justify-content:center;background:#fff6e6;border-radius:12px;flex:0 0 auto}
  .pr .tx{flex:1;min-width:0}
  .pr .tx b{display:block;font-size:.95rem}
  .pr .tx small{display:block;color:#777;font-size:.75rem;line-height:1.45}
  .pr .est{font-size:.72rem;font-weight:700;border-radius:999px;padding:3px 9px;white-space:nowrap}
  .pr .est.ok{background:#e8f6ea;color:#1e7a33}.pr .est.no{background:#f1f1f1;color:#888}.pr .est.res{background:#fff3d6;color:#8a5a00}
  .pr button{border:none;border-radius:999px;padding:8px 12px;background:#c41e3a;color:#fff;font-weight:700;font-family:inherit;font-size:.78rem;cursor:pointer;white-space:nowrap}
  .pr.off{opacity:.55}
  .pr-vacio{background:#faf6f1;border-radius:14px;padding:16px;text-align:center;color:#777;font-size:.9rem}

  /* ===== Canje en el carrito ===== */
  .cu-canje{margin:0 16px 10px;border:1.5px dashed #f0c66b;background:#fffaf0;border-radius:14px;padding:10px 12px;font-size:.85rem}
  .cu-canje .t{font-weight:700;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center}
  .cu-canje .chips{display:flex;gap:6px;flex-wrap:wrap}
  .cu-canje .chip{border:1.5px solid #e9d3a6;background:#fff;border-radius:999px;padding:6px 10px;font-family:inherit;font-size:.78rem;cursor:pointer}
  .cu-canje .chip.on{background:#c41e3a;color:#fff;border-color:#c41e3a}
  .cu-canje .aviso{color:#a0520a;font-size:.76rem;margin-top:5px}
  .cu-canje .pts{display:flex;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap}
  .cu-canje .pts input[type=number]{width:90px;padding:6px 8px;border:1.5px solid #e2dcd4;border-radius:8px;font-family:inherit}
  .cu-canje a{color:#b4500f;font-weight:600;cursor:pointer}

  /* ===== Compras y puntos ===== */
  .mc-saldo{background:linear-gradient(135deg,#2b1410,#7a2a12);color:#fff;border-radius:18px;padding:16px 18px;margin-bottom:14px}
  .mc-saldo .n{font-size:2rem;font-weight:800;color:#ffd27a}
  .mc-saldo small{opacity:.85}
  .mc-tabs{display:flex;gap:6px;margin-bottom:10px}
  .mc-tabs button{flex:1;border:1.5px solid #e2dcd4;background:#fff;border-radius:999px;padding:8px;font-family:inherit;font-weight:600;cursor:pointer}
  .mc-tabs button.on{background:#1a1a1a;color:#fff;border-color:#1a1a1a}
  .mc-it{display:flex;justify-content:space-between;gap:10px;padding:10px 2px;border-bottom:1px solid #f0ebe4;font-size:.86rem}
  .mc-it small{display:block;color:#888;font-size:.74rem}
  .mc-it .v{font-weight:700;white-space:nowrap;text-align:right}
  .mc-it .v.mas{color:#1e7a33}.mc-it .v.menos{color:#c62828}
  `;
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // ===================== MODAL DE CUENTA =====================
  var ov = document.createElement('div'); ov.className = 'cu-ov'; ov.id = 'cu-ov';
  ov.innerHTML = '<div class="cu-modal" role="dialog" aria-modal="true"><button class="cu-x" aria-label="Cerrar" onclick="cuCerrar()">✕</button><div id="cu-body"></div></div>';
  ov.addEventListener('click', function (e) { if (e.target === ov) cuCerrar(); });
  document.body.appendChild(ov);
  window.cuCerrar = function () { ov.classList.remove('open'); };
  function abrir(html) { $('cu-body').innerHTML = html; ov.classList.add('open'); var f = ov.querySelector('input'); if (f && window.innerWidth > 700) setTimeout(function () { f.focus(); }, 60); }
  function err(t) { var e = $('cu-err'); if (e) e.textContent = t || ''; }
  function ocupado(b, si, txt) { if (!b) return; if (si) { b.dataset.t = b.innerHTML; b.disabled = true; b.innerHTML = '⏳ ' + (txt || 'Un momento…'); } else { b.disabled = false; if (b.dataset.t) b.innerHTML = b.dataset.t; } }
  function campoClave(id, ph) {
    var nueva = /^cu-c[12]$/.test(id);
    return '<div class="cu-pass"><input class="cu-in" id="' + id + '" type="password" ' + (nueva ? 'inputmode="numeric" maxlength="12" oninput="this.value=this.value.replace(/\\D/g,\'\')"' : 'maxlength="64"') + ' autocomplete="' + (nueva ? 'new-password' : 'current-password') + '" placeholder="' + (ph || '••••••') + '">' +
      '<button type="button" class="cu-ojo" aria-label="Mostrar clave" onclick="cuOjo(\'' + id + '\',this)">👁️</button></div>';
  }
  window.cuOjo = function (id, b) { var i = $(id); var ver = i.type === 'password'; i.type = ver ? 'text' : 'password'; b.textContent = ver ? '🙈' : '👁️'; b.setAttribute('aria-label', ver ? 'Ocultar clave' : 'Mostrar clave'); };
  var telIn = function (id, v) { return '<input class="cu-in" id="' + id + '" type="tel" inputmode="numeric" maxlength="9" placeholder="Ej: 5555 1234" autocomplete="tel-national" value="' + esc(v || '') + '">'; };
  var tel8 = function (t) { return String(t || '').replace(/\D/g, '').replace(/^502(?=\d{8}$)/, ''); };

  window.cuEntrar = function (tel) {
    abrir('<h3>👤 Entra al Club Torrons</h3><p class="cu-sub">Juega gratis cada día, junta puntos y canjéalos en tus pedidos.</p>' +
      '<label class="cu-lbl" for="cu-tel">Número de teléfono</label>' + telIn('cu-tel', tel) +
      '<label class="cu-lbl" for="cu-clave">Clave</label>' + campoClave('cu-clave') +
      '<div class="cu-err" id="cu-err"></div>' +
      '<button class="cu-btn" id="cu-go" onclick="cuHacerEntrar()">Entrar</button>' +
      '<div class="cu-links"><a onclick="cuRecuperar()">🔑 Olvidé mi clave</a><a onclick="cuRegistro()">✨ Unirme al Club Torrons</a><a onclick="cuEntrarCorreo()">📧 Cambié de número · entrar con mi correo</a></div>');
    $('cu-clave').addEventListener('keydown', function (e) { if (e.key === 'Enter') cuHacerEntrar(); });
  };
  window.cuHacerEntrar = async function () {
    var b = $('cu-go'); err('');
    var tel = $('cu-tel').value, clave = $('cu-clave').value;
    if (tel8(tel).length !== 8) return err('Escribe tu número de 8 dígitos');
    if (clave.length < 6) return err('Tu clave tiene al menos 6 números');
    ocupado(b, true, 'Entrando…');
    try {
      var d = await llamar('entrar', { tel: tel, clave: clave });
      if (!d.ok) { ocupado(b, false); return err(d.error); }
      await auth.signInWithCustomToken(d.token);
      cuCerrar(); toast('👋 ¡Bienvenido de vuelta!');
      setTimeout(function () { var s = $('mi-torrons'); if (s) s.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 400);
    } catch (e) { ocupado(b, false); err('No se pudo entrar. Revisa tu conexión.'); }
  };
  window.cuRegistro = function () {
    abrir('<h3>✨ Únete al Club Torrons</h3><p class="cu-sub">Ganas el <b>2%</b> de cada compra en puntos, 1 tiro gratis al día y 1 tiro por cada compra.</p>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div><label class="cu-lbl" for="cu-nom">Nombre</label><input class="cu-in" id="cu-nom" maxlength="40" autocomplete="given-name" placeholder="Ej: Ana"></div>' +
      '<div><label class="cu-lbl" for="cu-ape">Apellido</label><input class="cu-in" id="cu-ape" maxlength="40" autocomplete="family-name" placeholder="Ej: López"></div></div>' +
      '<label class="cu-lbl" for="cu-tel">Número de teléfono</label>' + telIn('cu-tel') +
      '<label class="cu-lbl" for="cu-mail">Correo (para recuperar tu clave)</label><input class="cu-in" id="cu-mail" type="email" autocomplete="email" maxlength="120" placeholder="tucorreo@gmail.com">' +
      '<label class="cu-lbl" for="cu-c1">Elige tu clave (6 a 12 números)</label>' + campoClave('cu-c1') +
      '<label class="cu-lbl" for="cu-c2">Repite tu clave</label>' + campoClave('cu-c2') +
      '<label class="cu-chk"><input type="checkbox" id="cu-acepto"> <span>Acepto los <a href="legal.html#club" target="_blank" rel="noopener">Términos del Club Torrons</a> (puntos, premios y máquina) y la <a href="legal.html#privacidad" target="_blank" rel="noopener">política de privacidad</a>.</span></label>' +
      '<div class="cu-err" id="cu-err"></div>' +
      '<button class="cu-btn" id="cu-go" onclick="cuHacerRegistro()">Unirme al Club Torrons</button>' +
      '<div class="cu-links"><a onclick="cuEntrar()">Ya tengo cuenta · Entrar</a></div>');
  };
  window.cuHacerRegistro = async function () {
    var b = $('cu-go'); err('');
    var nom = $('cu-nom').value.trim(), ape = $('cu-ape').value.trim(), tel = $('cu-tel').value, mail = $('cu-mail').value.trim(), c1 = $('cu-c1').value, c2 = $('cu-c2').value;
    if (nom.length < 2) return err('Escribe tu nombre');
    if (ape.length < 2) return err('Escribe tu apellido');
    if (tel8(tel).length !== 8) return err('Escribe tu número de 8 dígitos');
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(mail)) return err('Escribe un correo válido');
    if (!/^\d{6,12}$/.test(c1)) return err('La clave debe tener de 6 a 12 números');
    if (c1 !== c2) return err('Las dos claves no son iguales');
    if (/^(\d)\1+$/.test(c1) || '0123456789012'.indexOf(c1) >= 0 || '9876543210987'.indexOf(c1) >= 0) return err('Esa clave es muy fácil de adivinar. Elige otra.');
    if (!$('cu-acepto').checked) return err('Marca la casilla para aceptar los términos');
    ocupado(b, true, 'Creando tu cuenta…');
    try {
      var d = await llamar('registro', { nombre: nom, apellido: ape, tel: tel, email: mail, clave: c1 });
      if (!d.ok) { ocupado(b, false); return err(d.error); }
      await auth.signInWithCustomToken(d.token);
      try { await auth.currentUser.sendEmailVerification({ url: 'https://torronsgt.pages.dev/' }); } catch (e) {}
      abrir('<h3>🎉 ¡Listo, ' + esc(nom.split(' ')[0]) + '!</h3><p class="cu-sub">Ya eres parte del <b>Club Torrons</b>.</p>' +
        '<div class="cu-ok">📧 Te mandamos un correo a <b>' + esc(mail) + '</b> para confirmarlo. Revisa también la carpeta de spam.</div>' +
        '<p class="cu-sub" style="margin-top:12px">Ya tienes tu <b>tiro gratis de hoy</b> esperándote en la máquina 🎰</p>' +
        '<button class="cu-btn" onclick="cuCerrar();document.getElementById(\'mi-torrons\').scrollIntoView({behavior:\'smooth\'})">🎰 ¡Ir a jugar!</button>');
    } catch (e) { ocupado(b, false); err('No se pudo crear la cuenta. Revisa tu conexión.'); }
  };
  window.cuRecuperar = function () {
    abrir('<h3>🔑 Recupera tu clave</h3><p class="cu-sub">Te mandamos un enlace a tu correo para que elijas una clave nueva.</p>' +
      '<label class="cu-lbl" for="cu-tel">Tu número de teléfono</label>' + telIn('cu-tel') +
      '<div class="cu-err" id="cu-err"></div><button class="cu-btn" id="cu-go" onclick="cuHacerRecuperar(\'tel\')">Enviarme el correo</button>' +
      '<hr class="cu-sep"><label class="cu-lbl" for="cu-mail">…o escribe tu correo</label><input class="cu-in" id="cu-mail" type="email" placeholder="tucorreo@gmail.com">' +
      '<button class="cu-btn sec" id="cu-go2" onclick="cuHacerRecuperar(\'mail\')">Enviar al correo</button>' +
      '<div class="cu-links"><a onclick="cuEntrar()">← Volver</a></div>');
  };
  window.cuHacerRecuperar = async function (modo) {
    err('');
    var b = $(modo === 'tel' ? 'cu-go' : 'cu-go2');
    if (modo === 'tel') {
      if (tel8($('cu-tel').value).length !== 8) return err('Escribe tu número de 8 dígitos');
      ocupado(b, true, 'Enviando…');
      var d = await llamar('recuperar', { tel: $('cu-tel').value }).catch(function () { return { ok: false, error: 'Sin conexión' }; });
      ocupado(b, false);
      if (!d.ok) return err(d.error);
      $('cu-err').outerHTML = '<div class="cu-ok">📧 Listo. Te enviamos el enlace a <b>' + esc(d.correo) + '</b>. Ábrelo desde este teléfono y elige tu clave nueva. Revisa también spam.</div>';
    } else {
      var m = $('cu-mail').value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(m)) return err('Escribe un correo válido');
      ocupado(b, true, 'Enviando…');
      try { await auth.sendPasswordResetEmail(m, { url: 'https://torronsgt.pages.dev/?cliente=1' }); } catch (e) {}
      ocupado(b, false);
      $('cu-err').outerHTML = '<div class="cu-ok">📧 si ese correo está en el Club Torrons, te llegará el enlace en unos minutos. Revisa también spam.</div>';
    }
  };
  window.cuEntrarCorreo = function () {
    abrir('<h3>📧 Entrar con mi correo</h3><p class="cu-sub">Si cambiaste de número, entra con tu correo y tu clave. Luego actualizas tu número en tu perfil.</p>' +
      '<label class="cu-lbl" for="cu-mail">Correo</label><input class="cu-in" id="cu-mail" type="email" autocomplete="email" placeholder="tucorreo@gmail.com">' +
      '<label class="cu-lbl" for="cu-clave">Clave</label>' + campoClave('cu-clave') +
      '<div class="cu-err" id="cu-err"></div><button class="cu-btn" id="cu-go" onclick="cuHacerCorreo()">Entrar</button>' +
      '<div class="cu-links"><a onclick="cuRecuperar()">🔑 Olvidé mi clave</a><a onclick="cuEntrar()">← Volver</a></div>');
  };
  window.cuHacerCorreo = async function () {
    var b = $('cu-go'); err('');
    var m = $('cu-mail').value.trim(), c = $('cu-clave').value;
    if (!m || c.length < 6) return err('Escribe tu correo y tu clave');
    ocupado(b, true, 'Entrando…');
    try {
      var r = await auth.signInWithEmailAndPassword(m, c);
      var s = await cdb.ref('clientes/' + r.user.uid + '/tel').once('value').catch(function () { return null; });
      if (!s) { await auth.signOut(); ocupado(b, false); return err('Ese correo no es de una cuenta de cliente activa'); }
      cuCerrar(); setTimeout(cuPerfil, 300);
    } catch (e) {
      ocupado(b, false);
      var c0 = String(e && e.code || '');
      err(/disabled/.test(c0) ? '🔒 Esta cuenta está bloqueada. Escríbenos en 💬 Ayuda.' : /too-many/.test(c0) ? 'Demasiados intentos. Espera unos minutos.' : 'Correo o clave incorrectos');
    }
  };

  window.cuPerfil = function () {
    if (!CU.d) return cuEntrar();
    var d = CU.d, u = auth.currentUser || {};
    abrir('<h3>👤 Mi cuenta</h3><div class="cu-perfil"><b>' + esc(d.nombre + ' ' + (d.apellido || '')) + '</b><br>📱 ' + esc(tel8(d.tel).replace(/(\d{4})(\d{4})/, '$1 $2')) + '<br>📧 ' + esc(d.email || u.email || '') +
      (u.emailVerified ? ' <span style="color:#1e7a33">✔ confirmado</span>' : ' <a style="color:#b4500f;cursor:pointer" onclick="cuReenviarVerif(this)">confirmar correo</a>') + '</div>' +
      '<hr class="cu-sep"><label class="cu-lbl">🔒 Cambiar mi clave</label>' + campoClave('cu-act', 'Clave actual') + '<div style="height:8px"></div>' + campoClave('cu-c1', 'Clave nueva (6 a 12 números)') + '<div style="height:8px"></div>' + campoClave('cu-c2', 'Repite la clave nueva') +
      '<div class="cu-err" id="cu-err"></div><button class="cu-btn" id="cu-go" onclick="cuHacerClave()">Guardar clave nueva</button>' +
      '<hr class="cu-sep"><label class="cu-lbl" for="cu-ntel">📱 Cambiar mi número</label>' + telIn('cu-ntel') +
      '<div class="cu-err" id="cu-err2"></div><button class="cu-btn sec" id="cu-go2" onclick="cuHacerTel()">Cambiar número</button>' +
      '<p class="cu-nota">Si perdiste o te robaron el teléfono, escríbenos en 💬 Ayuda y bloqueamos tu cuenta.</p>' +
      '<button class="cu-btn peligro" onclick="cuSalir()">Cerrar sesión</button>');
  };
  window.cuReenviarVerif = async function (a) { try { await auth.currentUser.sendEmailVerification({ url: 'https://torronsgt.pages.dev/' }); a.textContent = 'enviado ✔'; } catch (e) { a.textContent = 'intenta más tarde'; } };
  window.cuHacerClave = async function () {
    var b = $('cu-go'); err('');
    var a = $('cu-act').value, c1 = $('cu-c1').value, c2 = $('cu-c2').value;
    if (a.length < 6) return err('Escribe tu clave actual');
    if (!/^\d{6,12}$/.test(c1)) return err('La clave nueva debe tener de 6 a 12 números');
    if (c1 !== c2) return err('Las claves nuevas no son iguales');
    if (/^(\d)\1+$/.test(c1) || '0123456789012'.indexOf(c1) >= 0) return err('Esa clave es muy fácil de adivinar');
    ocupado(b, true, 'Guardando…');
    try {
      var u = auth.currentUser;
      await u.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(u.email, a));
      await u.updatePassword(c1);
      ocupado(b, false); $('cu-act').value = $('cu-c1').value = $('cu-c2').value = '';
      $('cu-err').outerHTML = '<div class="cu-ok">✅ Tu clave nueva quedó guardada.</div><div class="cu-err" id="cu-err"></div>';
    } catch (e) { ocupado(b, false); err(/wrong-password|invalid/.test(String(e.code)) ? 'La clave actual no es correcta' : 'No se pudo cambiar. Intenta de nuevo.'); }
  };
  window.cuHacerTel = async function (claveOtra) {
    var b = $('cu-go2'); var e2 = $('cu-err2'); e2.textContent = '';
    var t = $('cu-ntel') ? $('cu-ntel').value : window.__cuTelNuevo;
    if (tel8(t).length !== 8) { e2.textContent = 'Escribe el número nuevo de 8 dígitos'; return; }
    window.__cuTelNuevo = t;
    ocupado(b, true, 'Cambiando…');
    var d = await llamar('cambiar-tel', { tel: t, claveOtra: claveOtra || undefined }, true).catch(function () { return { ok: false, error: 'Sin conexión' }; });
    ocupado(b, false);
    if (d.ok) { toast('✅ Tu número ahora es ' + tel8(d.tel)); cuCerrar(); return; }
    if (d.conflicto) {
      abrir('<h3>⚠️ Ese número ya tiene cuenta</h3><p class="cu-sub">El número <b>' + esc(tel8(t)) + '</b> ya está en otra cuenta del Club Torrons. Elige con cuál te quedas:</p>' +
        '<div class="cu-perfil"><b>Opción 1 · Quedarme con ESTA cuenta</b><br><small>La otra cuenta se cierra y <b>pierde sus puntos y premios</b>. Para confirmar que es tuya, escribe la clave de la otra cuenta.</small></div>' +
        campoClave('cu-otra', 'Clave de la otra cuenta') + '<div class="cu-err" id="cu-err2">' + (claveOtra ? esc(d.error) : '') + '</div>' +
        '<button class="cu-btn" id="cu-go2" onclick="cuConfirmarUnir()">Quedarme con esta cuenta</button>' +
        '<hr class="cu-sep"><div class="cu-perfil"><b>Opción 2 · Quedarme con la OTRA cuenta</b><br><small>Sales de esta y entras con el número ' + esc(tel8(t)) + ' y su clave. Esta cuenta se queda como está.</small></div>' +
        '<button class="cu-btn sec" onclick="cuSalir(true)">Usar la otra cuenta</button>');
      return;
    }
    e2.textContent = d.error || 'No se pudo cambiar';
  };
  window.cuConfirmarUnir = function () {
    var c = $('cu-otra').value;
    if (c.length < 6) { $('cu-err2').textContent = 'Escribe la clave de la otra cuenta'; return; }
    if (!confirm('¿Seguro? La otra cuenta se cerrará y perderá sus puntos y premios.')) return;
    if (!confirm('Confirma de nuevo: esto no se puede deshacer.')) return;
    cuHacerTel(c);
  };
  window.cuSalir = async function (aOtra) {
    var t = window.__cuTelNuevo;
    await auth.signOut(); premioSel = null; usarPuntos = false; guardarCanje();
    if (aOtra) cuEntrar(t); else { cuCerrar(); toast('Sesión cerrada'); }
  };

  // Enlaces que llegan por correo: cambiar clave / confirmar correo
  (function enlaceCorreo() {
    var p = new URLSearchParams(location.search), modo = p.get('mode'), code = p.get('oobCode');
    if (!modo || !code) return;
    var cont = p.get('continueUrl') || '';
    history.replaceState(null, '', location.pathname);
    if (modo === 'verifyEmail') {
      auth.applyActionCode(code).then(function () { toast('✅ ¡Tu correo quedó confirmado!'); if (auth.currentUser) auth.currentUser.reload(); })
        .catch(function () { toast('Ese enlace ya se usó o venció'); });
    } else if (modo === 'resetPassword') {
      var cliente = /cliente=1/.test(cont);
      auth.verifyPasswordResetCode(code).then(function (mail) {
        abrir('<h3>🔑 Elige tu clave nueva</h3><p class="cu-sub">Cuenta: <b>' + esc(mail) + '</b></p>' +
          '<label class="cu-lbl">Clave nueva ' + (cliente ? '(6 a 12 números)' : '(mínimo 6 caracteres)') + '</label>' + campoClave('cu-c1') +
          '<label class="cu-lbl">Repite la clave</label>' + campoClave('cu-c2') +
          '<div class="cu-err" id="cu-err"></div><button class="cu-btn" id="cu-go">Guardar mi clave</button>');
        if (!cliente) ['cu-c1', 'cu-c2'].forEach(function (i) { $(i).removeAttribute('oninput'); $(i).setAttribute('inputmode', 'text'); $(i).maxLength = 64; });
        $('cu-go').onclick = async function () {
          var c1 = $('cu-c1').value, c2 = $('cu-c2').value; err('');
          if (cliente ? !/^\d{6,12}$/.test(c1) : c1.length < 6) return err(cliente ? 'La clave debe tener de 6 a 12 números' : 'Mínimo 6 caracteres');
          if (c1 !== c2) return err('Las claves no son iguales');
          ocupado($('cu-go'), true, 'Guardando…');
          try {
            await auth.confirmPasswordReset(code, c1);
            abrir('<h3>✅ ¡Clave cambiada!</h3><p class="cu-sub">Ya puedes entrar con tu clave nueva.</p>' + (cliente ? '<button class="cu-btn" onclick="cuEntrar()">Entrar</button>' : '<button class="cu-btn" onclick="cuCerrar()">Listo</button>'));
          } catch (e) { ocupado($('cu-go'), false); err('El enlace venció. Pide uno nuevo.'); }
        };
      }).catch(function () { toast('Ese enlace ya se usó o venció. Pide uno nuevo.'); });
    }
  })();

  // ===================== DATOS DEL CLIENTE =====================
  function saldo(d, ahora) {
    ahora = ahora || Date.now();
    return r2(Object.values((d && d.lotes) || {}).reduce(function (s, l) { return s + (l && l.vence > ahora ? Number(l.resta) || 0 : 0); }, 0));
  }
  function premiosDe(d) {
    var a = Object.keys((d && d.premios) || {}).map(function (k) { var p = d.premios[k]; p.key = k; return p; });
    var ahora = Date.now();
    a.forEach(function (p) {
      p.estado = p.usado ? 'usado' : (p.vence < ahora ? 'vencido' : (p.reservado && p.reservado.t > ahora - 20 * 60000 ? 'apartado' : 'ok'));
    });
    return a.sort(function (x, y) { var o = { ok: 0, apartado: 1, usado: 2, vencido: 3 }; return (o[x.estado] - o[y.estado]) || (y.emitido - x.emitido); });
  }
  CU.saldo = function () { return saldo(CU.d); };

  auth.onAuthStateChanged(function (u) {
    if (CU.ref) { CU.ref.off(); CU.ref = null; }
    CU.uid = u ? u.uid : null; CU.d = null;
    if (!u) { pintar(); return; }
    CU.ref = cdb.ref('clientes/' + u.uid);
    CU.ref.on('value', function (s) {
      CU.d = s.val();
      if (!CU.d) { auth.signOut(); return; }
      pintar();
    }, function () {
      // sin permiso: la cuenta se bloqueó
      auth.signOut(); toast('🔒 Tu cuenta está bloqueada. Escríbenos en 💬 Ayuda.');
    });
  });

  // ===================== BOTÓN DEL ENCABEZADO Y SECCIÓN =====================
  var hdr = document.querySelector('.hdr-right');
  var hb = document.createElement('button'); hb.className = 'cu-hbtn'; hb.id = 'cu-hbtn';
  hb.onclick = function () { CU.d ? document.getElementById('mi-torrons').scrollIntoView({ behavior: 'smooth' }) : cuEntrar(); };
  if (hdr) hdr.insertBefore(hb, hdr.firstChild);
  var nav = document.querySelector('header nav');
  if (nav) { var a = document.createElement('a'); a.href = '#mi-torrons'; a.innerHTML = '🎰 Club'; nav.insertBefore(a, nav.children[1] || null); }

  var sec = document.createElement('section'); sec.className = 'mt'; sec.id = 'mi-torrons';
  var menuT = document.getElementById('menu');
  if (menuT) menuT.parentNode.insertBefore(sec, menuT); else document.querySelector('main').prepend(sec);

  var SIMB = ['⭐', '🌟', '💰', '🎟️', '☕', '🍟', '🌭', '🥩', '🎉', '🍫', '🔔', '🍒'];
  var estadoMaq = { girando: false };

  function pintar() {
    var d = CU.d;
    hb.innerHTML = d ? '⭐ <b>' + q(saldo(d)).replace('Q ', 'Q') + '</b><span class="cu-ht"> · ' + esc(String(d.nombre || '').split(' ')[0]) + '</span>' : '👤 <span class="cu-ht">Entrar</span><span class="cu-hm" style="display:none"></span>';
    if (!d) {
      sec.innerHTML = '<div class="mt-inv"><div class="big">🎰</div><div><h3>Únete al Club Torrons</h3><p>Es gratis: 1 tiro gratis cada día, 1 tiro por cada compra y el <b>2%</b> de tus compras en puntos.</p>' +
        '<button class="cu-btn" onclick="cuRegistro()">✨ Unirme gratis</button><button class="cu-btn sec" style="width:auto;margin:0" onclick="cuEntrar()">Ya tengo cuenta</button></div></div>';
      estadoMaq.montada = false;
      if (window.updateCartUI) updateCartUI();
      return;
    }
    if (!estadoMaq.montada) {
      sec.innerHTML = '<div class="mt-hola"><h3>Club Torrons · Hola, ' + esc(String(d.nombre || '').split(' ')[0]) + ' 👋</h3>' +
        '<div class="mt-acc"><span class="mt-pts" id="mt-pts"></span><button class="pri" onclick="cuCompras()">🧾 Mis compras y puntos</button><button onclick="cuPerfil()">👤 Mi cuenta</button></div></div>' +
        '<div class="mt-grid"><div>' + maquinaHTML() + '</div><div><div class="pr-tit">🎁 Mis premios <small style="font-weight:500;color:#888;font-size:.78rem">· duran 7 días</small></div><div class="pr-lista" id="pr-lista"></div></div></div>';
      estadoMaq.montada = true;
      prepararRodillos();
    }
    $('mt-pts').innerHTML = '⭐ ' + q(saldo(d)) + ' en puntos';
    pintarLed(); pintarPremios();
    if (window.updateCartUI) updateCartUI();
  }

  // ===================== MÁQUINA =====================
  function maquinaHTML() {
    var focos = ''; for (var i = 0; i < 16; i++) focos += '<i></i>';
    return '<div class="sm" id="sm"><button class="sm-son" id="sm-son" onclick="cuSonido()" title="Sonido">' + (sonidoOn() ? '🔊' : '🔇') + '</button>' +
      '<div class="sm-cab"><div class="sm-top"><div class="sm-focos a">' + focos + '</div><div class="sm-tit">TORRONS<small>★ CLUB · MÁQUINA DE PREMIOS ★</small></div><div class="sm-focos b">' + focos + '</div></div>' +
      '<div class="sm-ventana"><div class="sm-rodillos">' + [0, 1, 2].map(function (i) { return '<div class="sm-rod" id="sm-r' + i + '"><div class="sm-tira" id="sm-t' + i + '"></div></div>'; }).join('') + '</div>' +
      '<div class="sm-linea"></div><div class="sm-flecha i"></div><div class="sm-flecha d"></div></div>' +
      '<div class="sm-led" id="sm-led"></div>' +
      '<div class="sm-bots"><button class="sm-b d" id="sm-bd" onclick="cuJugar(\'diario\')">🎰 Tiro diario<small id="sm-bd-s"></small></button><button class="sm-b c" id="sm-bc" onclick="cuJugar(\'compra\')">🎁 Tiro por compra<small id="sm-bc-s"></small></button></div>' +
      '</div><div class="sm-palanca"><div class="base"></div><div class="palo"><div class="bola"></div></div></div>' +
      '<canvas class="sm-lluvia" id="sm-lluvia"></canvas><div class="sm-msg" id="sm-msg"></div></div>';
  }
  function altoCelda() { var r = $('sm-r0'); return r ? parseFloat(getComputedStyle(r).getPropertyValue('--h')) || 84 : 84; }
  function prepararRodillos() {
    for (var i = 0; i < 3; i++) {
      var t = $('sm-t' + i); var s = [SIMB[(i * 4) % SIMB.length], SIMB[(i * 4 + 1) % SIMB.length], SIMB[(i * 4 + 2) % SIMB.length]];
      t.innerHTML = s.map(function (x) { return '<div class="sm-celda">' + x + '</div>'; }).join('');
      t.style.transition = 'none'; t.style.transform = 'translateY(' + desplaz(1) + 'px)';
    }
  }
  function desplaz(idx) { var h = altoCelda(); var alto = h * 1.75; return -(idx * h) + (alto - h) / 2; }
  function tirosHoy() { return CU.d && (CU.d.juego || {}).dia !== hoyGT() ? 1 : 0; }
  function tirosCompra() { return CU.d ? Number((CU.d.juego || {}).compras) || 0 : 0; }
  function pintarLed() {
    if (!$('sm-led')) return;
    $('sm-led').innerHTML = '<span>HOY <b>' + tirosHoy() + '</b></span><span>COMPRAS <b>' + tirosCompra() + '</b></span><span>⭐ <b>' + q(saldo(CU.d)).replace('Q ', 'Q') + '</b></span>';
    $('sm-bd').disabled = estadoMaq.girando || !tirosHoy();
    $('sm-bc').disabled = estadoMaq.girando || !tirosCompra();
    $('sm-bd-s').textContent = tirosHoy() ? '¡Disponible!' : 'Vuelve mañana';
    $('sm-bc-s').textContent = tirosCompra() ? tirosCompra() + ' disponible' + (tirosCompra() > 1 ? 's' : '') : 'Compra y gana 1';
  }

  // ----- Sonidos (sintetizados, originales) -----
  var actx = null;
  function sonidoOn() { try { return localStorage.getItem('torronsSonido') !== '0'; } catch (e) { return true; } }
  window.cuSonido = function () { try { localStorage.setItem('torronsSonido', sonidoOn() ? '0' : '1'); } catch (e) {} $('sm-son').textContent = sonidoOn() ? '🔊' : '🔇'; };
  function tono(f, dur, tipo, vol, cuando) {
    if (!sonidoOn()) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var t0 = actx.currentTime + (cuando || 0), o = actx.createOscillator(), g = actx.createGain();
      o.type = tipo || 'square'; o.frequency.setValueAtTime(f, t0);
      g.gain.setValueAtTime(vol || .05, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
      o.connect(g); g.connect(actx.destination); o.start(t0); o.stop(t0 + dur + .02);
    } catch (e) {}
  }
  var tic = null;
  function sonarGiro(si) { clearInterval(tic); if (si) tic = setInterval(function () { tono(900 + Math.random() * 300, .03, 'square', .025); }, 75); }
  function sonarParo(i) { tono(140 - i * 15, .12, 'triangle', .18); tono(420, .05, 'square', .04); }
  function sonarGana(grande) {
    var n = grande ? [523, 659, 784, 1047, 784, 1047, 1319] : [523, 659, 784, 1047];
    n.forEach(function (f, i) { tono(f, .18, 'triangle', .12, i * .11); tono(f * 2, .1, 'square', .03, i * .11); });
  }
  function sonarNada() { tono(392, .2, 'triangle', .1, 0); tono(330, .3, 'triangle', .1, .2); }

  // ----- Lluvia de monedas al ganar -----
  function lluvia(segundos) {
    var cv = $('sm-lluvia'); if (!cv) return;
    var sm = $('sm'), W = sm.offsetWidth, H = sm.offsetHeight, dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    var c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    var ps = []; for (var i = 0; i < 46; i++) ps.push({ x: W / 2 + (Math.random() - .5) * 60, y: H * .45, vx: (Math.random() - .5) * 9, vy: -6 - Math.random() * 8, r: 6 + Math.random() * 7, a: Math.random() * 6, va: .1 + Math.random() * .3, col: Math.random() < .7 ? 'o' : ['#ff4d6d', '#3ddc84', '#4dabff', '#ffd23f'][i % 4] });
    var fin = Date.now() + segundos * 1000;
    (function paso() {
      c.clearRect(0, 0, W, H);
      ps.forEach(function (p) {
        p.vy += .35; p.x += p.vx; p.y += p.vy; p.a += p.va;
        var sx = Math.abs(Math.cos(p.a));
        c.save(); c.translate(p.x, p.y); c.scale(sx, 1);
        if (p.col === 'o') {
          c.beginPath(); c.arc(0, 0, p.r, 0, 6.283); c.fillStyle = '#e9b13a'; c.fill();
          c.beginPath(); c.arc(0, 0, p.r * .72, 0, 6.283); c.fillStyle = '#ffd95a'; c.fill();
          if (sx > .45) { c.fillStyle = '#a8700c'; c.font = 'bold ' + (p.r * 1.1) + 'px Georgia'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('Q', 0, 1); }
        } else { c.fillStyle = p.col; c.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); }
        c.restore();
      });
      if (Date.now() < fin) requestAnimationFrame(paso); else c.clearRect(0, 0, W, H);
    })();
  }

  function simbolosPara(premio) {
    if (!premio || premio.tipo === 'nada') {
      var a = SIMB.slice().sort(function () { return Math.random() - .5; });
      return [a[0], a[1], a[2]];
    }
    var e = premio.emoji || '⭐';
    if (SIMB.indexOf(e) < 0) e = '⭐';
    return [e, e, e];
  }
  function girarRodillos(final) {
    var h = altoCelda();
    return Promise.all([0, 1, 2].map(function (i) {
      return new Promise(function (ok) {
        var t = $('sm-t' + i), n = 26 + i * 7, celdas = [];
        var actual = (t.children[1] || t.children[0] || {}).textContent || SIMB[0];
        celdas.push(SIMB[(Math.random() * SIMB.length) | 0], actual);
        for (var k = 0; k < n; k++) celdas.push(SIMB[(Math.random() * SIMB.length) | 0]);
        celdas.push(final[i], SIMB[(Math.random() * SIMB.length) | 0]);
        t.innerHTML = celdas.map(function (x) { return '<div class="sm-celda">' + x + '</div>'; }).join('');
        t.style.transition = 'none'; t.style.transform = 'translateY(' + desplaz(1) + 'px)';
        t.classList.add('mov');
        void t.offsetHeight;
        var dur = 1.7 + i * .55;
        t.style.transition = 'transform ' + dur + 's cubic-bezier(.12,.62,.16,1.02)';
        t.style.transform = 'translateY(' + desplaz(celdas.length - 2) + 'px)';
        setTimeout(function () { t.classList.remove('mov'); }, dur * 1000 - 380);
        setTimeout(function () { sonarParo(i); ok(); }, dur * 1000);
      });
    }));
  }

  window.cuJugar = async function (tipo) {
    if (estadoMaq.girando) return;
    if (!CU.d) return cuEntrar();
    if (tipo === 'diario' && !tirosHoy()) return toast('Ya usaste tu tiro de hoy. ¡Vuelve mañana!');
    if (tipo === 'compra' && !tirosCompra()) return toast('Cada pedido entregado te da 1 tiro 🎁');
    estadoMaq.girando = true; pintarLed();
    var sm = $('sm'); $('sm-msg').classList.remove('on');
    sm.classList.add('jala'); setTimeout(function () { sm.classList.remove('jala'); }, 380);
    sm.classList.remove('gana'); sm.classList.add('gira'); sonarGiro(true);
    var res = llamar('jugar', { tipo: tipo }, true).catch(function () { return { ok: false, error: 'Sin conexión. Tu tiro no se gastó.' }; });
    // rodillos girando mientras responde el servidor
    var espera = new Promise(function (ok) { setTimeout(ok, 350); });
    var d = (await Promise.all([res, espera]))[0];
    if (!d.ok) {
      sonarGiro(false); sm.classList.remove('gira'); estadoMaq.girando = false; pintarLed();
      return toast(d.error || 'No se pudo jugar');
    }
    var fin = simbolosPara(d.premio);
    await girarRodillos(fin);
    sonarGiro(false); sm.classList.remove('gira');
    var gano = d.premio.tipo !== 'nada';
    if (gano) {
      sm.classList.add('gana');
      [0, 1, 2].forEach(function (i) { $('sm-r' + i).classList.add('ok'); setTimeout(function () { $('sm-r' + i).classList.remove('ok'); }, 2200); });
      var grande = d.premio.tipo === 'producto' || /10/.test(d.premio.id);
      sonarGana(grande); lluvia(grande ? 3.2 : 2.2);
      if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
    } else sonarNada();
    var det = d.premio.tipo === 'puntos' ? 'Ya se sumaron a tus puntos ⭐' : d.premio.tipo === 'nada' ? (tipo === 'diario' ? 'Mañana tienes otro tiro gratis' : 'Sigue comprando y gana más tiros') : 'Úsalo en tu próximo pedido. Vence el ' + fecha(d.premio.vence) + '.';
    $('sm-msg').innerHTML = '<div class="card"><div class="em">' + esc(d.premio.emoji || '🎁') + '</div><h4>' + (gano ? '¡Ganaste!' : '¡Casi!') + '</h4><p><b>' + esc(d.premio.txt) + '</b><br>' + det + '</p><button onclick="document.getElementById(\'sm-msg\').classList.remove(\'on\')">' + (gano ? '¡Genial!' : 'OK') + '</button></div>';
    $('sm-msg').classList.add('on');
    setTimeout(function () { sm.classList.remove('gana'); }, 2600);
    estadoMaq.girando = false; pintarLed();
  };

  // ===================== PREMIOS =====================
  function textoPremio(p) {
    var cond = [];
    if (p.minimo) cond.push('compra mínima Q' + p.minimo);
    if (p.tipo === 'pct') cond.push('no aplica a productos en oferta');
    if (p.tipo === 'producto') cond.push('agrégalo a tu carrito');
    return cond.join(' · ');
  }
  function pintarPremios() {
    var l = $('pr-lista'); if (!l) return;
    var ps = premiosDe(CU.d), ahora = Date.now();
    var jug = Object.values((CU.d && CU.d.jugadas) || {}).filter(function (j) { return j && /^pts/.test(j.premio) && j.t > ahora - 30 * 86400000; }).sort(function (a, b) { return b.t - a.t; }).slice(0, 5);
    var visibles = ps.filter(function (p) { return p.estado === 'ok' || p.estado === 'apartado' || (p.usado ? p.usado.t : p.vence) > ahora - 30 * 86400000; }).slice(0, 25);
    if (!visibles.length && !jug.length) { l.innerHTML = '<div class="pr-vacio">Aquí verás los premios que ganes en la máquina 🎰<br><small>Cada premio dura 7 días.</small></div>'; return; }
    l.innerHTML = visibles.map(function (p) {
      var est = p.estado === 'ok' ? '<span class="est ok">Disponible</span>' : p.estado === 'apartado' ? '<span class="est res">Apartado</span>' : p.estado === 'usado' ? '<span class="est no">✅ Usado</span>' : '<span class="est no">⌛ Vencido</span>';
      var btn = p.estado === 'ok' ? '<button onclick="cuUsarPremio(\'' + p.key + '\')">' + (premioSel === p.key ? '✓ Elegido' : 'Usar') + '</button>' : '';
      return '<div class="pr' + (p.estado === 'ok' || p.estado === 'apartado' ? '' : ' off') + '"><div class="em">' + esc(p.emoji) + '</div><div class="tx"><b>' + esc(p.txt) + '</b>' +
        '<small>Emitido: ' + fecha(p.emitido, true) + '<br>Vence: ' + fecha(p.vence, true) + '</small>' + (textoPremio(p) && p.estado === 'ok' ? '<small>' + esc(textoPremio(p)) + '</small>' : '') + '</div>' +
        '<div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">' + est + btn + '</div></div>';
    }).join('') + jug.map(function (j) {
      return '<div class="pr"><div class="em">⭐</div><div class="tx"><b>' + esc(j.txt) + '</b><small>Ganado: ' + fecha(j.t, true) + '<br>Sumado a tus puntos (duran 6 meses)</small></div><span class="est ok">Sumado</span></div>';
    }).join('');
  }
  window.cuUsarPremio = function (key) {
    var p = premiosDe(CU.d).find(function (x) { return x.key === key; });
    if (!p || p.estado !== 'ok') return toast('Ese premio ya no está disponible');
    if (window.cupon) { if (window.quitarCupon) quitarCupon(true); toast('🎟️ Quitamos el cupón: solo se usa 1 premio o cupón por pedido (+ tus puntos)'); }
    premioSel = key; guardarCanje();
    if (p.tipo === 'producto' && p.prod && !(typeof cart !== 'undefined' ? cart : []).some(function (i) { return i.id === p.prod && !i.isComboExtra; })) {
      if (window.addToCart) addToCart(p.prod);
      toast('🎁 Agregamos ' + p.txt.replace(/ gratis.*$/i, '') + ' al carrito');
    } else toast('🎁 Premio elegido para tu pedido');
    pintarPremios(); if (window.updateCartUI) updateCartUI();
    if (window.toggleCart && !document.querySelector('.cart-sidebar.open, #cart-sidebar.open')) setTimeout(toggleCart, 500);
  };

  // ===================== CANJE EN EL CARRITO =====================
  function premioElegido() {
    if (!CU.d || !premioSel) return null;
    var p = premiosDe(CU.d).find(function (x) { return x.key === premioSel; });
    return p && p.estado === 'ok' ? p : null;
  }
  function descPremio() {
    var p = premioElegido(); if (!p) return 0;
    var sub = window.getCartSubtotal ? getCartSubtotal() : 0;
    if (sub < (Number(p.minimo) || 0)) return 0;
    if (p.tipo === 'pct') return r2((window.getBaseCupon ? getBaseCupon() : sub) * p.valor / 100);
    if (p.tipo === 'producto') {
      var it = (typeof cart !== 'undefined' ? cart : []).find(function (i) { return i.id === p.prod && !i.isComboExtra; });
      if (!it) return 0;
      var prod = (typeof products !== 'undefined' ? products : []).find(function (x) { return x.id === p.prod; });
      return r2(Math.min(it.price, prod ? prod.price : it.price));
    }
    return 0;
  }
  function descPuntos() {
    if (!CU.d || !usarPuntos) return 0;
    var sub = window.getCartSubtotal ? getCartSubtotal() : 0;
    var max = r2(sub - (window.getCartDescuento ? getCartDescuento() : 0) - descPremio());
    var m = r2(Math.min(puntosMonto || saldo(CU.d), saldo(CU.d), max));
    return m >= MIN_CANJE ? m : 0;
  }
  window.cuDescPremio = descPremio; window.cuDescPuntos = descPuntos;
  window.cuDescTotal = function () { return r2(descPremio() + descPuntos()); };

  window.cuRenderCanje = function () {
    var box = $('cu-canje'); if (!box) return;
    var hay = (typeof cart !== 'undefined' ? cart : []).length;
    box.style.display = hay ? 'block' : 'none';
    var rp = $('cart-premio-row'), rpt = $('cart-puntos-row');
    if (!CU.d) {
      box.innerHTML = '<a onclick="cuEntrar()">👤 Entra a tu cuenta</a> para usar tus puntos y premios, y ganar el 2% de esta compra.';
      if (rp) rp.style.display = 'none'; if (rpt) rpt.style.display = 'none';
      return;
    }
    var ps = premiosDe(CU.d).filter(function (p) { return p.estado === 'ok'; });
    var sel = premioElegido(); if (premioSel && !sel) { premioSel = null; guardarCanje(); }
    var s = saldo(CU.d), dp = descPremio(), dpt = descPuntos();
    var h = '<div class="t"><span>🎁 Tus premios y puntos</span><small style="font-weight:500;color:#888">ganas ' + q(((window.getCartSubtotal ? getCartSubtotal() : 0) - (window.getCartDescuento ? getCartDescuento() : 0) - dp - dpt) * .02) + '</small></div>';
    if (ps.length) {
      h += '<div class="chips">' + ps.map(function (p) { return '<button class="chip' + (premioSel === p.key ? ' on' : '') + '" onclick="cuElegirPremio(\'' + p.key + '\')">' + esc(p.emoji) + ' ' + esc(p.txt) + '</button>'; }).join('') + '</div>';
      if (sel && dp === 0) {
        var sub = window.getCartSubtotal ? getCartSubtotal() : 0;
        h += '<div class="aviso">' + (sub < sel.minimo ? '⚠️ Este premio pide compra mínima de Q' + sel.minimo + '.' : sel.tipo === 'producto' ? '⚠️ Agrega el producto del premio a tu carrito. <a onclick="addToCart(' + Number(sel.prod) + ')">Agregar</a>' : '⚠️ Tus productos ya están en oferta: el % no aplica.') + '</div>';
      }
      h += '<div class="aviso" style="color:#888">Solo 1 premio o cupón por pedido, más tus puntos.</div>';
    }
    h += '<div class="pts"><label style="display:flex;gap:6px;align-items:center;cursor:pointer"><input type="checkbox" ' + (usarPuntos ? 'checked' : '') + (s < MIN_CANJE ? ' disabled' : '') + ' onchange="cuUsarPuntos(this.checked)"> Usar mis puntos</label>' +
      (usarPuntos && s >= MIN_CANJE ? '<input type="number" min="' + MIN_CANJE + '" step="0.5" value="' + (puntosMonto || dpt || s) + '" onchange="cuMontoPuntos(this.value)">' : '') +
      '<small style="color:#777">Tienes ' + q(s) + (s < MIN_CANJE ? ' · se canjean desde Q' + MIN_CANJE : '') + '</small></div>';
    box.innerHTML = h;
    if (rp) { rp.style.display = dp > 0 ? 'flex' : 'none'; if (dp > 0) { $('cart-premio-label').textContent = '🎁 ' + sel.txt; $('cart-premio').textContent = '−' + q(dp).replace('Q ', 'Q '); } }
    if (rpt) { rpt.style.display = dpt > 0 ? 'flex' : 'none'; if (dpt > 0) $('cart-puntos').textContent = '−' + q(dpt); }
  };
  window.cuElegirPremio = function (k) {
    if (premioSel === k) premioSel = null;
    else {
      if (window.cupon) { if (window.quitarCupon) quitarCupon(true); toast('🎟️ Quitamos el cupón: solo 1 premio o cupón por pedido'); }
      premioSel = k;
    }
    guardarCanje(); if (window.updateCartUI) updateCartUI(); pintarPremios();
  };
  window.cuUsarPuntos = function (si) { usarPuntos = !!si; puntosMonto = 0; guardarCanje(); if (window.updateCartUI) updateCartUI(); };
  window.cuMontoPuntos = function (v) { puntosMonto = Math.max(0, r2(v)); if (puntosMonto && puntosMonto < MIN_CANJE) { toast('Los puntos se canjean desde Q' + MIN_CANJE); puntosMonto = MIN_CANJE; } guardarCanje(); if (window.updateCartUI) updateCartUI(); };
  // Si aplican un cupón, se quita el premio (solo uno de los dos)
  window.cuAlAplicarCupon = function () { if (premioSel) { premioSel = null; guardarCanje(); toast('🎁 Quitamos el premio: solo 1 premio o cupón por pedido'); pintarPremios(); } };

  window.cuLineas = function () {
    var a = [], dp = descPremio(), dpt = descPuntos(), p = premioElegido();
    if (dp > 0) a.push({ t: '🎁 Premio: ' + p.txt, v: dp });
    if (dpt > 0) a.push({ t: '⭐ Puntos canjeados', v: dpt });
    return a;
  };
  window.cuDatosPedido = function () {
    if (!CU.uid || !CU.d) return null;
    var d = { uid: CU.uid }, dp = descPremio(), dpt = descPuntos(), p = premioElegido();
    if (dp > 0 && p) { d.premio = p.key; d.premioTxt = String(p.txt).slice(0, 60); d.descPremio = dp; }
    if (dpt > 0) d.puntos = dpt;
    return d;
  };
  // Aparta el premio y los puntos en el servidor ANTES de crear el pedido
  window.cuReservar = async function (key) {
    var d = window.cuDatosPedido(); if (!d || (!d.premio && !d.puntos)) return { ok: true };
    var r = await llamar('reservar', { pedido: key, premio: d.premio || null, puntos: d.puntos || 0 }, true).catch(function () { return { ok: false, error: 'Sin conexión. Intenta de nuevo.' }; });
    return r;
  };
  window.cuLimpiarCanje = function () { premioSel = null; usarPuntos = false; puntosMonto = 0; guardarCanje(); };
  window.cuPrefill = function () {
    if (!CU.d) return;
    var n = $('customer-name'), t = $('customer-phone');
    if (n && !n.value) n.value = ((CU.d.nombre || '') + ' ' + (CU.d.apellido || '')).trim();
    if (t && !t.value) t.value = tel8(CU.d.tel);
  };

  // ===================== MIS COMPRAS Y PUNTOS =====================
  window.cuCompras = function (tab) {
    if (!CU.d) return cuEntrar();
    tab = tab || 'compras';
    var d = CU.d, ahora = Date.now(), s = saldo(d);
    var lotes = Object.values(d.lotes || {}).filter(function (l) { return l.resta > 0 && l.vence > ahora; }).sort(function (a, b) { return a.vence - b.vence; });
    var prox = lotes[0];
    var h = '<h3>🧾 Mis compras y puntos</h3><div class="mc-saldo"><small>Tus puntos</small><div class="n">' + q(s) + '</div><small>1 punto = Q1 · se canjean desde Q' + MIN_CANJE + ' · ganas el 2% de cada compra' +
      (prox ? '<br>⏳ ' + q(prox.resta) + ' vencen el ' + fecha(prox.vence) : '') + '</small></div>' +
      '<div class="mc-tabs"><button class="' + (tab === 'compras' ? 'on' : '') + '" onclick="cuCompras(\'compras\')">🛍️ Compras</button><button class="' + (tab === 'puntos' ? 'on' : '') + '" onclick="cuCompras(\'puntos\')">⭐ Movimientos</button></div>';
    if (tab === 'compras') {
      var cs = Object.keys(d.compras || {}).map(function (k) { var c = d.compras[k]; c.k = k; return c; }).sort(function (a, b) { return (b.t || 0) - (a.t || 0); });
      var EST = { recibido: '🧾 Recibido', preparando: '👨‍🍳 Preparando', listo: '✅ Listo', en_camino: '🛵 En camino', entregado: '🎉 Entregado', cancelado: '❌ Cancelado' };
      h += cs.length ? cs.map(function (c) {
        return '<div class="mc-it"><div><b>#' + esc(c.codigo) + '</b> · ' + fecha(c.t, true) + '<small>' + esc(c.items || '') + '</small><small>' + (EST[c.estado] || esc(c.estado)) + '</small></div><div class="v">' + q(c.total) +
          (c.puntos ? '<small style="color:#1e7a33">+' + q(c.puntos) + ' en puntos</small>' : c.estado === 'cancelado' ? '' : '<small>puntos al entregar</small>') + '</div></div>';
      }).join('') : '<div class="pr-vacio">Aún no tienes compras con tu cuenta.<br><small>Haz tu pedido con la sesión abierta y gana el 2%.</small></div>';
    } else {
      var ms = Object.keys(d.movs || {}).map(function (k) { return d.movs[k]; }).sort(function (a, b) { return b.t - a.t; }).slice(0, 80);
      h += ms.length ? ms.map(function (m) {
        return '<div class="mc-it"><div>' + esc(m.motivo || (m.tipo === 'gana' ? 'Puntos ganados' : 'Canje')) + '<small>' + fecha(m.t, true) + '</small></div><div class="v ' + (m.pts > 0 ? 'mas' : 'menos') + '">' + (m.pts > 0 ? '+' : '−') + q(Math.abs(m.pts)) + '</div></div>';
      }).join('') : '<div class="pr-vacio">Todavía no tienes movimientos de puntos.</div>';
    }
    abrir(h);
  };

  pintar();
})();
