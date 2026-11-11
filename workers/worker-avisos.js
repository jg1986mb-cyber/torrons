// ============================================================
//  Café Torrons · Avisos a la app Torrons Cocina (Cloudflare Worker)
//  Cada minuto (y cuando la tienda lo pide) revisa los pedidos en Firebase:
//   - confirma pagos con Paggo (por medio del Worker torrons-pagos)
//   - cancela pedidos con tarjeta que no se pagan en 5 minutos
//   - manda el aviso con voz al teléfono (Firebase Cloud Messaging)
//   - cancelaciones: sin pagar → se cancela y avisa 1 vez; pagado → avisa 3 veces
//  Secretos: FIREBASE_SA (cuenta de servicio de Firebase)
//  Enlace de servicio: PAGOS → torrons-pagos
// ============================================================

const RTDB = 'https://cafe-torrons-default-rtdb.firebaseio.com';
const TOPIC = 'cocina';
const MIN_PAGO = 5; // minutos para pagar con tarjeta

// ================= Avisos a la app (Firebase Cloud Messaging) =================
let tokenCache = { valor: null, vence: 0 };

function b64url(buf) {
  const bytes = typeof buf === 'string' ? new TextEncoder().encode(buf) : new Uint8Array(buf);
  let bin = ''; bytes.forEach(b => bin += String.fromCharCode(b));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function tokenGoogle(env) {
  if (tokenCache.valor && Date.now() < tokenCache.vence) return tokenCache.valor;
  const sa = JSON.parse(env.FIREBASE_SA);
  const ahora = Math.floor(Date.now() / 1000);
  const cab = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const cuerpo = b64url(JSON.stringify({
    iss: sa.client_email, aud: 'https://oauth2.googleapis.com/token', iat: ahora, exp: ahora + 3600,
    scope: 'https://www.googleapis.com/auth/firebase.messaging https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email'
  }));
  const pem = sa.private_key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(pem), ch => ch.charCodeAt(0));
  const llave = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const firma = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', llave, new TextEncoder().encode(cab + '.' + cuerpo));
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + cab + '.' + cuerpo + '.' + b64url(firma)
  });
  const d = await r.json();
  if (!d.access_token) throw new Error('Google no dio token: ' + JSON.stringify(d));
  tokenCache = { valor: d.access_token, vence: Date.now() + 50 * 60000, proyecto: sa.project_id };
  return d.access_token;
}

async function db(env, ruta, opt = {}) {
  const t = await tokenGoogle(env);
  const sep = ruta.includes('?') ? '&' : '?';
  return fetch(RTDB + '/' + ruta + sep + 'access_token=' + t, opt);
}

// Reclama el aviso para no mandarlo dos veces (escritura condicional con ETag)
async function reclamar(env, ruta) {
  const r = await db(env, ruta + '.json', { headers: { 'X-Firebase-ETag': 'true' } });
  const etag = r.headers.get('ETag');
  const v = await r.json();
  if (v !== null) return false;
  const w = await db(env, ruta + '.json', { method: 'PUT', headers: { 'if-match': etag }, body: JSON.stringify(Date.now()) });
  return w.ok;
}

async function enviarPush(env, data, tema = TOPIC) {
  const t = await tokenGoogle(env);
  const proyecto = tokenCache.proyecto || 'cafe-torrons';
  const limpio = {}; Object.keys(data).forEach(k => { if (data[k] != null) limpio[k] = String(data[k]).slice(0, 1500); });
  const r = await fetch(`https://fcm.googleapis.com/v1/projects/${proyecto}/messages:send`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t },
    body: JSON.stringify({ message: { topic: tema, data: limpio, android: { priority: 'HIGH', ttl: '900s' } } })
  });
  return r.ok;
}

// Prefijo de llave de Firebase para una hora (las llaves push() van ordenadas por tiempo)
function prefijoLlave(ms) {
  const C = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';
  let s = '';
  for (let i = 0; i < 8; i++) { s = C.charAt(ms % 64) + s; ms = Math.floor(ms / 64); }
  return s;
}

const METODOS = { delivery: '🛵 Delivery', pickup: '🏪 Retiro en local', cash: '🛵 Envío contra entrega' };
const q = n => 'Q' + (Number(n) || 0).toFixed(2);

function datosPedido(key, o) {
  const c = o.cliente || {};
  const items = Object.values(o.items || {});
  const lineas = items.map(it => {
    let l = `${it.extra ? '  + ' : ''}${it.cant} x ${it.nombre}`;
    if (it.detalle && it.detalle.length) l += '\n    ' + it.detalle.join(', ');
    if (it.nota) l += '\n    ' + it.nota;
    return l;
  });
  const dir = [c.calle, c.colonia, c.zona ? 'Zona ' + String(c.zona).replace(/^zona\s*/i, '') : ''].filter(Boolean).join(', ');
  let tel = String(c.tel || '').replace(/\D/g, '');
  if (tel.length === 8) tel = '502' + tel;
  const pago = o.pago ? (o.pago.estado === 'pagado' ? '💳 Pagado con tarjeta' : '💳 Tarjeta pendiente') : '💵 Pago manual';
  const cuerpo = [
    `${METODOS[o.metodo] || o.metodo || ''} · ${pago} · Total ${q(o.pago && o.pago.monto || o.subtotal)}`,
    c.tel ? '📞 ' + c.tel : '',
    dir ? '📍 ' + dir : '',
    '',
    ...lineas
  ].filter((x, i) => x !== '' || i === 3).join('\n');
  const mapa = c.maps && /^https:\/\//.test(c.maps) ? c.maps
    : (dir ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(dir + ', Guatemala') : '');
  const nombre = c.nombre || 'un cliente';
  return {
    tipo: 'pedido', key,
    titulo: `🔔 Pedido de ${nombre} · ${items.filter(i => !i.extra).length} producto(s)`,
    cuerpo,
    wa: tel ? 'https://wa.me/' + tel : '',
    mapa,
    voz: `¡Llegó un pedido nuevo de ${nombre}! ${o.metodo === 'pickup' ? 'Es para retirar en el local.' : 'Es para delivery.'} Por favor prepáralo e imprime la comanda.`
  };
}

async function revisarPedidos(env) {
  if (!env.FIREBASE_SA) return { error: 'Falta FIREBASE_SA' };
  const desde = prefijoLlave(Date.now() - 6 * 3600000);
  const filtro = `orderBy=%22%24key%22&startAt=%22${desde}%22`;
  const [rp, rs, re] = await Promise.all([db(env, 'pedidos.json?' + filtro), db(env, 'seguimiento.json?' + filtro), db(env, 'entregas.json?' + filtro)]);
  const pedidos = (await rp.json()) || {};
  const seg = (await rs.json()) || {};
  const entregas = (await re.json()) || {};
  const res = { revisados: 0, avisos: 0 };

  for (const key of Object.keys(pedidos)) {
    const o = pedidos[key]; if (!o || typeof o !== 'object') continue;
    res.revisados++;
    const s = seg[key] || {};
    let cancelado = o.estado === 'cancelado' || s.etapa === 'cancelado';
    const porFaltaDePago = cancelado && s.motivo === 'sin_pago';
    const nombre = (o.cliente || {}).nombre || 'un cliente';

    // 1) pago con tarjeta pendiente → preguntar a Paggo por medio de torrons-pagos (máx. 3 horas).
    //    También se revisan los cancelados por falta de pago: si pagó tarde, el pedido revive.
    if (o.pago && o.pago.estado !== 'pagado' && (o.pago.linkId || o.pago.link) && (!cancelado || porFaltaDePago) && (o.ts || 0) > Date.now() - 3 * 3600000 && env.PAGOS) {
      try {
        const qs = o.pago.linkId ? 'linkId=' + o.pago.linkId : 'link=' + encodeURIComponent(o.pago.link);
        const r = await env.PAGOS.fetch('https://torrons-pagos/pago?' + qs, { headers: { Origin: 'https://torronsgt.pages.dev' } });
        const d = await r.json();
        if (d && d.pagado) {
          await db(env, `pedidos/${key}/pago.json`, { method: 'PATCH', body: JSON.stringify({ estado: 'pagado', fechaPago: new Date().toISOString() }) });
          o.pago.estado = 'pagado';
          if (porFaltaDePago) {
            await db(env, `pedidos/${key}.json`, { method: 'PATCH', body: JSON.stringify({ estado: 'pendiente' }) });
            await db(env, `seguimiento/${key}.json`, { method: 'PATCH', body: JSON.stringify({ etapa: 'recibido', motivo: null }) });
            o.estado = 'pendiente'; s.etapa = 'recibido'; cancelado = false;
          }
        }
      } catch (e) {}
    }

    // 1b) con tarjeta y sin pagar después de 5 minutos → se cancela solo
    if (!cancelado && o.pago && o.pago.estado !== 'pagado' && !o.impreso && (!s.etapa || s.etapa === 'recibido') && !(s.cancelacion || {}).estado
        && Date.now() - (o.ts || 0) > MIN_PAGO * 60000) {
      await db(env, `pedidos/${key}.json`, { method: 'PATCH', body: JSON.stringify({ estado: 'cancelado' }) });
      await db(env, `seguimiento/${key}.json`, { method: 'PATCH', body: JSON.stringify({ etapa: 'cancelado', motivo: 'sin_pago' }) });
      cancelado = true;
    }

    // 2) pedido listo para cocina → aviso
    const listo = !cancelado && !o.impreso && (!s.etapa || s.etapa === 'recibido') && (!o.pago || o.pago.estado === 'pagado');
    if (listo && !o.notificado && await reclamar(env, `pedidos/${key}/notificado`)) {
      if (await enviarPush(env, datosPedido(key, o))) res.avisos++;
    }

    // 3) ya se imprimió en otro aparato → callar la alarma del teléfono
    if (o.notificado && (o.impreso || cancelado || (s.etapa && s.etapa !== 'recibido')) && !o.avisoDetener && await reclamar(env, `pedidos/${key}/avisoDetener`)) {
      await enviarPush(env, { tipo: 'detener', key });
    }

    // 4) el cliente canceló: sin pagar → se cancela solo y avisa 1 vez; pagado → avisa 3 veces (reembolso)
    const cx = s.cancelacion || {};
    if (cx.estado === 'solicitada' && !cx.notificado && await reclamar(env, `seguimiento/${key}/cancelacion/notificado`)) {
      const pagado = !!(o.pago && o.pago.estado === 'pagado');
      if (!pagado && !o.impreso) {
        await db(env, `pedidos/${key}.json`, { method: 'PATCH', body: JSON.stringify({ estado: 'cancelado' }) });
        await db(env, `seguimiento/${key}.json`, { method: 'PATCH', body: JSON.stringify({ etapa: 'cancelado', 'cancelacion/estado': 'aceptada' }) });
      }
      await enviarPush(env, pagado ? {
        tipo: 'cancelacion', key: key + '-cx', repetir: '3',
        titulo: `⚠️ ${nombre} canceló un pedido PAGADO`,
        cuerpo: `Pagó ${q(o.pago.montoPaggo || o.pago.monto)} con tarjeta.\nAcepta la cancelación en la app y haz el reembolso total en Paggo.`,
        voz: `Atención. ${nombre} canceló su pedido ya pagado. Hay que hacer el reembolso.`
      } : {
        tipo: 'cancelacion', key: key + '-cx', repetir: '1',
        titulo: `↩️ ${nombre} canceló su pedido`,
        cuerpo: `Pedido de ${q(o.subtotal)} · no había pagado. Ya quedó cancelado.`,
        voz: `Aviso. ${nombre} canceló su pedido. No había pagado.`
      });
      res.avisos++;
    }
  }
  // 5) motoristas: viaje nuevo → aviso a los que están en línea; aceptado → aviso a cocina
  for (const key of Object.keys(entregas)) {
    const e = entregas[key]; if (!e || typeof e !== 'object') continue;
    const o = pedidos[key] || {};
    const sg = seg[key] || {};
    if ((o.estado === 'cancelado' || sg.etapa === 'cancelado') && ['disponible', 'asignado'].includes(e.estado)) {
      await db(env, `entregas/${key}.json`, { method: 'PATCH', body: JSON.stringify({ estado: 'cancelado' }) });
      continue;
    }
    const lugar = [e.zona, e.colonia].filter(Boolean).join(' · ') || 'Guatemala';
    const gana = Number(e.pago) > 0 ? `Ganas Q${Number(e.pago).toFixed(0)}` : `Cobras Q${Number(e.cobrar || 0).toFixed(0)} en efectivo`;
    const viaje = (titulo) => ({
      tipo: 'viaje', key: 'viaje-' + key, titulo,
      cuerpo: `${lugar}${e.km ? ' · ' + e.km + ' km' : ''} · ${gana}. Abre la app y acéptalo.`,
      voz: `Nuevo viaje disponible en ${e.zona || 'la ciudad'}. ${Number(e.pago) > 0 ? 'Ganas ' + Number(e.pago).toFixed(0) + ' quetzales.' : 'Cobras el envío en efectivo.'}`
    });
    if (e.estado === 'disponible' && !e.avisado && await reclamar(env, `entregas/${key}/avisado`)) {
      if (await enviarPush(env, viaje(`🛵 Nuevo viaje · ${e.zona || 'Guatemala'}`), 'motoristas')) res.avisos++;
    } else if (e.estado === 'disponible' && e.avisado && Date.now() - e.avisado > 5 * 60000 && !e.reavisado && await reclamar(env, `entregas/${key}/reavisado`)) {
      await enviarPush(env, viaje(`⏰ Viaje sin tomar · ${e.zona || 'Guatemala'}`), 'motoristas');
      await enviarPush(env, { tipo: 'info', key: key + '-sinmoto', repetir: '1', titulo: '⏰ Nadie ha tomado el viaje', cuerpo: `Pedido de ${(o.cliente || {}).nombre || 'cliente'} lleva 5 minutos sin motorista.`, voz: 'Atención. Nadie ha tomado el viaje todavía.' });
    }
    if (['asignado', 'recogido'].includes(e.estado) && !e.avisoCocina && await reclamar(env, `entregas/${key}/avisoCocina`)) {
      const nm = (e.motoristaNombre || 'Un motorista').split(' ')[0];
      await enviarPush(env, { tipo: 'info', key: key + '-moto', repetir: '1', titulo: `🛵 ${nm} tomó el pedido de ${(o.cliente || {}).nombre || 'un cliente'}`, cuerpo: `Va en camino a Torrons a recogerlo.`, voz: `${nm} aceptó el viaje y va por el pedido.` });
    }
  }
  return res;
}


const txt = (t, status = 200) => new Response(t, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

export default {
  async scheduled(_ev, env, ctx) {
    ctx.waitUntil(revisarPedidos(env).catch(e => console.log('revisarPedidos', e.message)));
  },

  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    if (!env.FIREBASE_SA) return txt('Falta el secreto FIREBASE_SA', 500);
    if (url.pathname === '/probar') {
      const ok = await enviarPush(env, {
        tipo: 'pedido', key: 'prueba-' + Date.now(),
        titulo: '🧪 Pedido de prueba',
        cuerpo: '🛵 Delivery · 💳 Pagado\n\n1 x Churrasco con Queso\n1 x Café americano',
        voz: '¡Llegó un pedido de prueba! Los avisos de Torrons funcionan.'
      });
      return txt(ok ? '✅ Aviso de prueba enviado a la app' : '❌ No se pudo enviar el aviso', ok ? 200 : 500);
    }
    if (url.pathname === '/revisar') {
      const r = await revisarPedidos(env);
      return txt('Revisado: ' + JSON.stringify(r));
    }
    return txt('torrons-avisos activo. /probar manda un aviso de prueba a la app.');
  }
};
