const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const schedule = [
  { days: 0, tipo: 'Recordatorio amable', canal: 'WHATSAPP' },
  { days: 3, tipo: 'Seguimiento', canal: 'WHATSAPP' },
  { days: 7, tipo: 'Aviso formal', canal: 'EMAIL' },
  { days: 14, tipo: 'Llamada de cobranza', canal: 'LLAMADA' },
  { days: 21, tipo: 'Escalamiento final', canal: 'EMAIL' }
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

function construirMensaje(factura, canal) {
  const monto = Number(factura.monto).toLocaleString('es-MX', {
    style: 'currency',
    currency: factura.moneda || 'MXN'
  });

  if (canal === 'EMAIL') {
    return `Hola ${factura.nombre}, te compartimos un recordatorio de pago de la factura ${factura.folio || factura.id} por ${monto}, vencida el ${factura.fecha_vencimiento}.`;
  }

  return `Hola ${factura.nombre}, soy COBITO. Tienes pendiente la factura ${factura.folio || factura.id} por ${monto}. ¿Nos confirmas fecha de pago?`;
}

module.exports = { crearCalendarioParaFactura, construirMensaje };
