const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const schedule = [
  { days: 0, tipo: 'Recordatorio amable', canal: 'WHATSAPP' },
  { days: 3, tipo: 'Seguimiento', canal: 'WHATSAPP' },
  { days: 7, tipo: 'Aviso formal', canal: 'EMAIL' },
  { days: 14, tipo: 'Llamada de cobranza', canal: 'LLAMADA' },
  { days: 21, tipo: 'Escalamiento final', canal: 'EMAIL' }
];

const defaultTemplates = [
  {
    id: 'default-whatsapp-amable',
    nombre: 'WhatsApp amable',
    canal: 'WHATSAPP',
    contenido: 'Hola {{cliente}}, soy COBITO. Tienes pendiente la factura {{folio}} por {{monto}}, vencida el {{vencimiento}}. Nos confirmas fecha estimada de pago?',
    is_default: true
  },
  {
    id: 'default-whatsapp-seguimiento',
    nombre: 'WhatsApp seguimiento',
    canal: 'WHATSAPP',
    contenido: 'Hola {{cliente}}, damos seguimiento a la factura {{folio}} por {{monto}}. Ya tiene {{diasVencida}} dias vencida. Podemos contar con tu pago esta semana?',
    is_default: true
  },
  {
    id: 'default-email-formal',
    nombre: 'Email formal',
    canal: 'EMAIL',
    contenido: 'Hola {{cliente}}, te compartimos un recordatorio de pago de la factura {{folio}} por {{monto}}, vencida el {{vencimiento}}. Quedamos atentos a tu confirmacion de fecha de pago.',
    is_default: true
  },
  {
    id: 'default-llamada-guion',
    nombre: 'Guion llamada',
    canal: 'LLAMADA',
    contenido: 'Llamar a {{cliente}} por factura {{folio}} de {{monto}}, vencida el {{vencimiento}}. Preguntar fecha de pago y registrar promesa si aplica.',
    is_default: true
  },
  {
    id: 'default-sms-corto',
    nombre: 'SMS corto',
    canal: 'SMS',
    contenido: 'Recordatorio COBITO: factura {{folio}} por {{monto}} vencida el {{vencimiento}}. Confirma fecha de pago, por favor.',
    is_default: true
  }
];

function addDays(dateValue, days) {
  const date = new Date(dateValue);
  date.setDate(date.getDate() + days);
  return date;
}

async function crearCalendarioParaFactura(facturaId, fechaVencimiento) {
  const rows = schedule.map((item) => ({
    id: uuidv4(),
    factura_id: facturaId,
    tipo_accion: item.tipo,
    fecha_programada: addDays(fechaVencimiento, item.days),
    canal: item.canal,
    status: 'PENDIENTE'
  }));

  const columnSet = new db.$config.pgp.helpers.ColumnSet(
    ['id', 'factura_id', 'tipo_accion', 'fecha_programada', 'canal', 'status'],
    { table: 'calendario_cobranza' }
  );

  await db.none(db.$config.pgp.helpers.insert(rows, columnSet));
}

function listarTemplatesPorCanal(canal) {
  return defaultTemplates.filter((template) => template.canal === canal);
}

async function listarTemplates(userId) {
  const custom = await db.any(
    `SELECT id::text, nombre, canal, contenido, is_default, created_at
     FROM templates_mensajes
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  return [...defaultTemplates, ...custom];
}

async function resolverTemplate(userId, canal, templateId) {
  if (templateId) {
    const foundDefault = defaultTemplates.find((template) => template.id === templateId && template.canal === canal);
    if (foundDefault) return foundDefault;

    const custom = await db.oneOrNone(
      `SELECT id::text, nombre, canal, contenido, is_default
       FROM templates_mensajes
       WHERE id = $1 AND user_id = $2 AND canal = $3`,
      [templateId, userId, canal]
    );
    if (custom) return custom;
  }

  return listarTemplatesPorCanal(canal)[0] || defaultTemplates[0];
}

function construirMensaje(factura, canal, templateContent) {
  const template = templateContent || (listarTemplatesPorCanal(canal)[0] || defaultTemplates[0]).contenido;
  const monto = Number(factura.saldo || factura.monto).toLocaleString('es-MX', {
    style: 'currency',
    currency: factura.moneda || 'MXN'
  });
  const fechaVencimiento = new Date(factura.fecha_vencimiento).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const diasVencida = Math.max(0, Math.floor((Date.now() - new Date(factura.fecha_vencimiento).getTime()) / 86400000));

  return template
    .replaceAll('{{cliente}}', factura.nombre || factura.cliente_nombre || 'cliente')
    .replaceAll('{{folio}}', factura.folio || factura.id)
    .replaceAll('{{monto}}', monto)
    .replaceAll('{{vencimiento}}', fechaVencimiento)
    .replaceAll('{{diasVencida}}', String(diasVencida));
}

module.exports = { crearCalendarioParaFactura, construirMensaje, listarTemplates, resolverTemplate };