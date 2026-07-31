const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { validate } = require('../utils/validators');
const asyncHandler = require('../utils/asyncHandler');
const { httpError } = require('../utils/errors');
const { construirMensaje } = require('../services/cobranza');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
router.use(authMiddleware);

router.get('/calendario', asyncHandler(async (req, res) => {
  const calendario = await db.any(
    `SELECT cc.*, f.folio, f.monto, f.moneda, f.fecha_vencimiento, c.nombre AS cliente_nombre
     FROM calendario_cobranza cc
     JOIN facturas f ON cc.factura_id = f.id
     JOIN clientes c ON f.cliente_id = c.id
     WHERE f.user_id = $1
     ORDER BY cc.fecha_programada ASC`,
    [req.user.userId]
  );

  res.json(calendario);
}));

router.post('/:facturaId/enviar', validate('enviarRecordatorio'), asyncHandler(async (req, res) => {
  const { facturaId } = req.params;
  const { canal } = req.body;

  const factura = await db.oneOrNone(
    `SELECT f.*, c.nombre, c.telefono, c.email
     FROM facturas f
     JOIN clientes c ON f.cliente_id = c.id
     WHERE f.id = $1 AND f.user_id = $2`,
    [facturaId, req.user.userId]
  );

  if (!factura) throw httpError(404, 'Factura no encontrada');

  const destinatario = canal === 'WHATSAPP' || canal === 'SMS' ? factura.telefono : factura.email;
  if (!destinatario && canal !== 'LLAMADA') throw httpError(400, `El cliente no tiene destinatario para ${canal}`);

  const mensaje = construirMensaje(factura, canal);
  const resultado = {
    status: 'simulado',
    canal,
    destinatario: destinatario || factura.telefono || factura.email || 'pendiente',
    provider: 'demo',
    timestamp: new Date().toISOString()
  };

  const log = await db.one(
    `INSERT INTO logs_comunicacion (id, factura_id, tipo, destinatario, mensaje, resultado)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [uuidv4(), facturaId, canal, resultado.destinatario, mensaje, resultado]
  );

  await db.none(
    `UPDATE calendario_cobranza
     SET status = 'COMPLETADO', completed_at = NOW()
     WHERE factura_id = $1 AND canal = $2 AND status = 'PENDIENTE'`,
    [facturaId, canal]
  );

  res.json({ message: `Recordatorio simulado por ${canal}`, log });
}));

router.post('/:facturaId/promesa', validate('promesa'), asyncHandler(async (req, res) => {
  const factura = await db.oneOrNone('SELECT id FROM facturas WHERE id = $1 AND user_id = $2', [req.params.facturaId, req.user.userId]);
  if (!factura) throw httpError(404, 'Factura no encontrada');

  const promesa = await db.tx(async (tx) => {
    const created = await tx.one(
      `INSERT INTO promesas_pago (id, factura_id, fecha_prometida, monto, notas)
       VALUES ($1, $2, $3, $4, NULLIF($5, ''))
       RETURNING *`,
      [uuidv4(), req.params.facturaId, req.body.fechaPrometida, req.body.monto, req.body.notas]
    );

    await tx.none('UPDATE facturas SET estado = $1, updated_at = NOW() WHERE id = $2', ['PROMESA', req.params.facturaId]);
    return created;
  });

  res.status(201).json(promesa);
}));

router.get('/:facturaId/logs', asyncHandler(async (req, res) => {
  const factura = await db.oneOrNone('SELECT id FROM facturas WHERE id = $1 AND user_id = $2', [req.params.facturaId, req.user.userId]);
  if (!factura) throw httpError(404, 'Factura no encontrada');

  const logs = await db.any('SELECT * FROM logs_comunicacion WHERE factura_id = $1 ORDER BY created_at DESC', [req.params.facturaId]);
  res.json(logs);
}));

module.exports = router;
