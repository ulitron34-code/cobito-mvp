const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

function normalizePhone(value = '') {
  return String(value).replace(/\D/g, '').slice(-10);
}

function normalizeText(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function detectIntent(body) {
  const text = normalizeText(body);
  if (/\b(pague|pagado|liquidado|ya pague|transferi|deposit[eé])\b/.test(text)) return 'PAGO_REPORTADO';
  if (/\b(promesa|prometo|pago el|pagar[eé]|liquido el|el \d{1,2})\b/.test(text)) return 'PROMESA_PAGO';
  if (/\b(prorroga|extension|mas tiempo|no puedo|despues)\b/.test(text)) return 'SOLICITA_PRORROGA';
  if (/\b(no reconozco|desconozco|incorrecta|no es mia|aclaracion)\b/.test(text)) return 'ACLARACION';
  if (/\b(asesor|humano|llamar|telefono|ayuda)\b/.test(text)) return 'HUMANO';
  if (/\b(hola|buen dia|buenas|gracias)\b/.test(text)) return 'SALUDO';
  return 'NO_ENTENDIDO';
}

function extractAmount(body) {
  const match = String(body).replace(/,/g, '').match(/\$?\s*(\d+(?:\.\d{1,2})?)/);
  return match ? Number(match[1]) : null;
}

function extractDate(body) {
  const text = normalizeText(body);
  const iso = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (iso) return iso[1];

  const slash = text.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](20\d{2}))?\b/);
  if (slash) {
    const day = slash[1].padStart(2, '0');
    const month = slash[2].padStart(2, '0');
    const year = slash[3] || String(new Date().getFullYear());
    return `${year}-${month}-${day}`;
  }

  const relativeDays = [
    ['hoy', 0],
    ['manana', 1],
    ['pasado manana', 2],
    ['proxima semana', 7],
    ['siguiente semana', 7]
  ];
  const found = relativeDays.find(([word]) => text.includes(word));
  if (!found) return null;
  const date = new Date();
  date.setDate(date.getDate() + Number(found[1]));
  return date.toISOString().slice(0, 10);
}

function extractFolio(body) {
  const match = String(body).match(/(?:factura|folio|fac\.?|f-)\s*#?:?\s*([a-z0-9-]+)/i);
  return match ? match[1].toUpperCase() : null;
}

async function findFactura({ facturaId, folio, from }) {
  if (facturaId) {
    return db.oneOrNone(
      `SELECT f.*, c.id AS cliente_id, c.user_id, c.nombre, c.telefono, c.email,
        GREATEST(f.monto - COALESCE((SELECT SUM(p.monto) FROM pagos p WHERE p.factura_id = f.id), 0), 0)::float AS saldo
       FROM facturas f
       JOIN clientes c ON c.id = f.cliente_id
       WHERE f.id = $1`,
      [facturaId]
    );
  }

  if (folio) {
    return db.oneOrNone(
      `SELECT f.*, c.id AS cliente_id, c.user_id, c.nombre, c.telefono, c.email,
        GREATEST(f.monto - COALESCE((SELECT SUM(p.monto) FROM pagos p WHERE p.factura_id = f.id), 0), 0)::float AS saldo
       FROM facturas f
       JOIN clientes c ON c.id = f.cliente_id
       WHERE UPPER(f.folio) = $1
       ORDER BY f.created_at DESC
       LIMIT 1`,
      [folio]
    );
  }

  const phone = normalizePhone(from);
  if (!phone) return null;
  return db.oneOrNone(
    `SELECT f.*, c.id AS cliente_id, c.user_id, c.nombre, c.telefono, c.email,
      GREATEST(f.monto - COALESCE((SELECT SUM(p.monto) FROM pagos p WHERE p.factura_id = f.id), 0), 0)::float AS saldo
     FROM facturas f
     JOIN clientes c ON c.id = f.cliente_id
     WHERE regexp_replace(COALESCE(c.telefono, ''), '\\D', '', 'g') LIKE $1
       AND f.estado <> 'PAGADA'
     ORDER BY f.fecha_vencimiento ASC, f.created_at DESC
     LIMIT 1`,
    [`%${phone}`]
  );
}

function buildReply(intent, factura, parsed) {
  if (!factura) {
    return 'Gracias por escribir a COBITO. No pude ubicar tu factura con este telefono o folio. Comparte el folio de la factura para ayudarte.';
  }

  const folio = factura.folio || String(factura.id).slice(0, 8);
  const saldo = Number(factura.saldo || factura.monto).toLocaleString('es-MX', { style: 'currency', currency: factura.moneda || 'MXN' });

  if (intent === 'PAGO_REPORTADO') {
    return `Gracias, registramos tu aviso de pago para la factura ${folio}. Nuestro equipo validara el pago por ${parsed.amount ? parsed.amount.toLocaleString('es-MX', { style: 'currency', currency: factura.moneda || 'MXN' }) : saldo}.`;
  }

  if (intent === 'PROMESA_PAGO') {
    if (parsed.date) return `Gracias, registramos tu promesa de pago para la factura ${folio} el ${parsed.date}.`;
    return `Gracias. Para registrar la promesa de la factura ${folio}, indicanos la fecha en formato DD/MM o AAAA-MM-DD.`;
  }

  if (intent === 'SOLICITA_PRORROGA') {
    return `Entendido. Para revisar una prorroga de la factura ${folio}, compartenos la fecha posible de pago y el monto estimado.`;
  }

  if (intent === 'ACLARACION') {
    return `Gracias por avisar. Marcamos la factura ${folio} para aclaracion y un asesor revisara el caso.`;
  }

  if (intent === 'HUMANO') {
    return `Claro. Dejamos solicitud para que un asesor revise la factura ${folio} y te contacte.`;
  }

  if (intent === 'SALUDO') {
    return `Hola, soy el asistente de COBITO. Tienes saldo pendiente de ${saldo} en la factura ${folio}. Puedes responder con fecha de pago o avisarnos si ya pagaste.`;
  }

  return `Gracias por tu mensaje. Para ayudarte con la factura ${folio}, responde con una fecha de pago, avisa si ya pagaste o solicita hablar con un asesor.`;
}

async function handleInboundMessage(payload) {
  const body = payload.body || payload.Body || payload.message || '';
  const from = payload.from || payload.From || payload.waId || payload.phone || '';
  const folio = payload.folio || extractFolio(body);
  const factura = await findFactura({ facturaId: payload.facturaId, folio, from });
  const intent = detectIntent(body);
  const parsed = { amount: extractAmount(body), date: extractDate(body), folio };
  const reply = buildReply(intent, factura, parsed);

  await db.tx(async (tx) => {
    await tx.none(
      `INSERT INTO chatbot_mensajes (id, user_id, cliente_id, factura_id, canal, direccion, telefono, mensaje, intencion, respuesta, metadata)
       VALUES ($1, $2, $3, $4, 'WHATSAPP', 'INBOUND', NULLIF($5, ''), $6, $7, $8, $9)`,
      [uuidv4(), factura?.user_id || null, factura?.cliente_id || null, factura?.id || null, from, body, intent, reply, { providerPayload: payload, parsed }]
    );

    if (factura && intent === 'PROMESA_PAGO' && parsed.date) {
      await tx.none(
        `INSERT INTO promesas_pago (id, factura_id, fecha_prometida, monto, notas)
         VALUES ($1, $2, $3, $4, $5)`,
        [uuidv4(), factura.id, parsed.date, parsed.amount || factura.saldo || factura.monto, 'Registrada por chatbot WhatsApp']
      );
      await tx.none('UPDATE facturas SET estado = $1, updated_at = NOW() WHERE id = $2', ['PROMESA', factura.id]);
    }

    if (factura && intent === 'PAGO_REPORTADO') {
      await tx.none(
        `INSERT INTO logs_comunicacion (id, factura_id, tipo, destinatario, mensaje, resultado)
         VALUES ($1, $2, 'WHATSAPP', NULLIF($3, ''), $4, $5)`,
        [uuidv4(), factura.id, from, body, { status: 'pago_reportado', parsed }]
      );
    }

    if (factura && ['ACLARACION', 'HUMANO', 'SOLICITA_PRORROGA'].includes(intent)) {
      await tx.none(
        `INSERT INTO logs_comunicacion (id, factura_id, tipo, destinatario, mensaje, resultado)
         VALUES ($1, $2, 'WHATSAPP', NULLIF($3, ''), $4, $5)`,
        [uuidv4(), factura.id, from, body, { status: 'requiere_revision', intent, parsed }]
      );
    }

    await tx.none(
      `INSERT INTO chatbot_mensajes (id, user_id, cliente_id, factura_id, canal, direccion, telefono, mensaje, intencion, metadata)
       VALUES ($1, $2, $3, $4, 'WHATSAPP', 'OUTBOUND', NULLIF($5, ''), $6, $7, $8)`,
      [uuidv4(), factura?.user_id || null, factura?.cliente_id || null, factura?.id || null, from, reply, intent, { autoReply: true }]
    );
  });

  return { reply, intent, facturaId: factura?.id || null, clienteId: factura?.cliente_id || null, parsed };
}

module.exports = { handleInboundMessage, detectIntent, extractDate, extractAmount };