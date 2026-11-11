// ============================================================
//  Café Torrons · Pagos con Paggo (Cloudflare Worker)
//  Guarda la llave de Paggo en secreto y crea/consulta links de pago.
//
//  Variables que se configuran en Cloudflare (Settings → Variables and Secrets):
//    PAGGO_API_KEY  (Secret)  → llave de API generada en Paggo (Credenciales)
//    ADMIN_KEY      (Secret)  → una contraseña que tú inventas; la pide admin.html
//    EMAIL_NEGOCIO  (Text)    → correo que se usa si el cliente no escribe uno
//  Enlace de servicio AVISOS → torrons-avisos (manda los avisos a la app de cocina)
// ============================================================

const ORIGENES = [
  'https://torronsgt.pages.dev',
  'https://www.torronsguatemala.com',
  'https://torronsguatemala.com'
];
const PAGGO = 'https://api.paggoapp.com/api';

function esPermitido(origin) {
  return ORIGENES.includes(origin) || /^https:\/\/[a-z0-9-]+\.torronsgt\.pages\.dev$/.test(origin);
}

function emailValido(e) {
  return typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length < 120;
}

function paggoFetch(env, path, opt = {}) {
  return fetch(PAGGO + path, { ...opt, headers: { 'Content-Type': 'application/json', 'X-API-KEY': env.PAGGO_API_KEY } });
}

export default {
  async fetch(req, env, ctx) {
    const origin = req.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': esPermitido(origin) ? origin : ORIGENES[0],
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
      'Vary': 'Origin'
    };
    const json = (obj, status = 200) =>
      new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    const url = new URL(req.url);

    // ---------- Avisar a la app de cocina ya (lo llama la tienda al terminar un pedido) ----------
    if (url.pathname === '/notificar') {
      if (!esPermitido(origin) && req.headers.get('X-Admin-Key') !== env.ADMIN_KEY) return json({ error: 'Origen no permitido' }, 403);
      if (env.AVISOS) ctx.waitUntil(env.AVISOS.fetch('https://torrons-avisos/revisar').catch(() => {}));
      return json({ ok: true });
    }

    // ---------- Probar aviso (solo administrador) ----------
    if (url.pathname === '/probar-aviso') {
      if (!env.ADMIN_KEY || req.headers.get('X-Admin-Key') !== env.ADMIN_KEY) return json({ error: 'No autorizado' }, 401);
      if (!env.AVISOS) return json({ ok: false, error: 'Falta el enlace AVISOS → torrons-avisos' }, 500);
      const r = await env.AVISOS.fetch('https://torrons-avisos/probar');
      const t = await r.text();
      return json({ ok: r.ok, error: r.ok ? undefined : t }, r.ok ? 200 : 500);
    }

    if (!env.PAGGO_API_KEY) return json({ error: 'Falta configurar PAGGO_API_KEY' }, 500);

    const paggo = (path, opt = {}) => paggoFetch(env, path, opt);

    async function buscarLinkPorUrl(link) {
      try {
        const r = await paggo('/center/transactions/links');
        const d = await r.json();
        const lista = d.resul || d.result || [];
        return lista.find(x => x.link === link) || null;
      } catch (e) { return null; }
    }

    // ---------- Crear link de pago (lo llama la tienda) ----------
    if (url.pathname === '/crear-link' && req.method === 'POST') {
      if (!esPermitido(origin)) return json({ error: 'Origen no permitido' }, 403);
      let b;
      try { b = await req.json(); } catch (e) { return json({ error: 'Datos inválidos' }, 400); }

      const amount = Math.round(Number(b.amount) * 100) / 100;
      if (!(amount >= 1 && amount <= 5000)) return json({ error: 'Monto inválido' }, 400);

      const cuerpo = {
        concept: String(b.concept || 'Pedido Café Torrons').slice(0, 150),
        amount,
        customerName: String(b.customerName || 'Cliente').slice(0, 80),
        email: emailValido(b.email) ? b.email : (env.EMAIL_NEGOCIO || 'ventas@torronsguatemala.com')
      };

      const r = await paggo('/center/transactions/create-link', { method: 'POST', body: JSON.stringify(cuerpo) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.result || !d.result.link) return json({ error: 'Paggo no generó el link', detalle: d }, 502);

      const info = await buscarLinkPorUrl(d.result.link);
      return json({ link: d.result.link, expira: d.result.expirationDate, linkId: info ? info.id : null, monto: amount });
    }

    // ---------- ¿Ya pagó? (lo consulta la página del cliente; solo responde sí/no) ----------
    if (url.pathname === '/pago' && req.method === 'GET') {
      if (!esPermitido(origin)) return json({ error: 'Origen no permitido' }, 403);
      let id = url.searchParams.get('linkId');
      const link = url.searchParams.get('link');
      if (!id && link) {
        const info = await buscarLinkPorUrl(link);
        if (!info) return json({ pagado: false });
        if (String(info.status || '').toLowerCase() === 'pagado') return json({ pagado: true });
        id = info.id;
      }
      if (!id || !/^\d+$/.test(id)) return json({ pagado: false });
      const r = await paggo('/center/transactions/links/' + id);
      const d = await r.json().catch(() => ({}));
      const st = String((d.result || {}).status || '').toLowerCase();
      return json({ pagado: st === 'pagado' });
    }

    // ---------- Consultar estado (solo administrador) ----------
    if (url.pathname === '/estado' && req.method === 'GET') {
      if (!env.ADMIN_KEY || req.headers.get('X-Admin-Key') !== env.ADMIN_KEY) return json({ error: 'No autorizado' }, 401);
      let id = url.searchParams.get('linkId');
      const link = url.searchParams.get('link');
      if (!id && link) {
        const info = await buscarLinkPorUrl(link);
        if (!info) return json({ error: 'Link no encontrado' }, 404);
        id = info.id;
      }
      if (!id || !/^\d+$/.test(id)) return json({ error: 'Falta linkId' }, 400);
      const r = await paggo('/center/transactions/links/' + id);
      const d = await r.json().catch(() => ({}));
      if (!r.ok) return json({ error: 'Paggo respondió error', detalle: d }, r.status);
      const x = d.result || {};
      return json({ linkId: x.id, estado: String(x.status || '').toLowerCase(), monto: x.amount, fechaPago: x.paymentDate || null, link: x.link });
    }

    // ---------- Probar conexión (solo administrador) ----------
    if (url.pathname === '/probar' && req.method === 'GET') {
      if (!env.ADMIN_KEY || req.headers.get('X-Admin-Key') !== env.ADMIN_KEY) return json({ error: 'No autorizado' }, 401);
      const r = await paggo('/center/transactions/welcome', { method: 'POST' });
      const d = await r.json().catch(() => ({}));
      return json({ ok: r.ok, paggo: d }, r.ok ? 200 : r.status);
    }

    return json({ servicio: 'Café Torrons · pagos', ok: true });
  }
};
