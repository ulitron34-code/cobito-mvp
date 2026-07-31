const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { validate } = require('../utils/validators');
const asyncHandler = require('../utils/asyncHandler');
const { httpError } = require('../utils/errors');
const { crearCalendarioParaFactura } = require('../services/cobranza');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
router.use(authMiddleware);

async function crearFactura(payload, userId) {
  const cliente = await db.oneOrNone('SELECT id FROM clientes WHERE id = $1 AND user_id = $2', [payload.clienteId, userId]);
  if (!cliente) throw httpError(404, 'Cliente no encontrado');

  const factura = await db.one(
    `INSERT INTO facturas (id, cliente_id, user_id, folio, monto, moneda, fecha_emision, fecha_vencimiento, concepto, estado)
     VALUES ($1, $2, $3, NULLIF($4, ''), $5, $6, $7, $8, NULLIF($9, ''), CASE WHEN $8::date < NOW()::date THEN 'VENCIDA'::factura_estado ELSE 'PENDIENTE'::factura_estado END)
     RETURNING *`,
    [uuidv4(), payload.clienteId, userId, payload.folio, payload.monto, payload.moneda || 'MXN', payload.fechaEmision, payload.fechaVencimiento, payload.concepto]
  );

  await crearCalendarioParaFactura(factura.id, factura.fecha_vencimiento);
  return factura;
}

router.get('/', asyncHandler(async (req, res) => {
  const { estado, q } = req.query;
  const params = [req.user.userId];
  let query = `SELECT f.*, c.nombre AS cliente_nombre, c.rfc, c.email, c.telefono,
      COALESCE((SELECT SUM(p.monto) FROM pagos p WHERE p.factura_id = f.id), 0)::float AS pagado
    FROM facturas f
    JOIN clientes c ON f.cliente_id = c.id
    WHERE f.user_id = $1`;

  if (estado) {
    params.push(estado);
    query += ` AND f.estado = $${params.length}`;
  }

  if (q) {
    params.push(`%${q}%`);
    query += ` AND (c.nombre ILIKE $${params.length} OR f.folio ILIKE $${params.length})`;
  }

  query += ' ORDER BY f.fecha_vencimiento ASC, f.created_at DESC';
  res.json(await db.any(query, params));
}));

router.post('/', validate('factura'), asyncHandler(async (req, res) => {
  const factura = await crearFactura(req.body, req.user.userId);
  res.status(201).json(factura);
}));

router.put('/:id/estado', validate('facturaEstado'), asyncHandler(async (req, res) => {
  const factura = await db.oneOrNone(
    'UPDATE facturas SET estado = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
    [req.body.estado, req.params.id, req.user.userId]
  );

  if (!factura) throw httpError(404, 'Factura no encontrada');
  res.json(factura);
}));


router.get('/:id/pagos', asyncHandler(async (req, res) => {
  const factura = await db.oneOrNone('SELECT id FROM facturas WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
  if (!factura) throw httpError(404, 'Factura no encontrada');

  const pagos = await db.any('SELECT * FROM pagos WHERE factura_id = $1 ORDER BY fecha_pago DESC', [req.params.id]);
  res.json(pagos);
}));
router.post('/:id/pagos', validate('pago'), asyncHandler(async (req, res) => {
  const factura = await db.oneOrNone('SELECT * FROM facturas WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
  if (!factura) throw httpError(404, 'Factura no encontrada');

  const pago = await db.tx(async (tx) => {
    const created = await tx.one(
      `INSERT INTO pagos (id, factura_id, monto, canal, referencia)
       VALUES ($1, $2, $3, NULLIF($4, ''), NULLIF($5, ''))
       RETURNING *`,
      [uuidv4(), req.params.id, req.body.monto, req.body.canal, req.body.referencia]
    );

    const totalPagado = await tx.one('SELECT COALESCE(SUM(monto), 0)::float AS total FROM pagos WHERE factura_id = $1', [req.params.id]);
    if (totalPagado.total >= Number(factura.monto)) {
      await tx.none('UPDATE facturas SET estado = $1, updated_at = NOW() WHERE id = $2', ['PAGADA', req.params.id]);
    }

    return created;
  });

  res.status(201).json(pago);
}));

router.post('/import/excel', validate('importFacturas'), asyncHandler(async (req, res) => {
  const created = [];

  await db.tx(async (tx) => {
    for (const item of req.body.facturas) {
      let cliente = null;
      if (item.rfc) {
        cliente = await tx.oneOrNone('SELECT id FROM clientes WHERE user_id = $1 AND rfc = $2', [req.user.userId, item.rfc]);
      }

      if (!cliente) {
        cliente = await tx.one(
          `INSERT INTO clientes (id, user_id, nombre, rfc, email, telefono)
           VALUES ($1, $2, $3, NULLIF($4, ''), NULLIF($5, ''), NULLIF($6, ''))
           ON CONFLICT (user_id, rfc) DO UPDATE SET nombre = EXCLUDED.nombre, email = EXCLUDED.email, telefono = EXCLUDED.telefono
           RETURNING id`,
          [uuidv4(), req.user.userId, item.clienteNombre, item.rfc, item.email, item.telefono]
        );
      }

      const factura = await tx.one(
        `INSERT INTO facturas (id, cliente_id, user_id, folio, monto, moneda, fecha_emision, fecha_vencimiento, concepto, estado)
         VALUES ($1, $2, $3, NULLIF($4, ''), $5, 'MXN', $6, $7, NULLIF($8, ''), CASE WHEN $7::date < NOW()::date THEN 'VENCIDA'::factura_estado ELSE 'PENDIENTE'::factura_estado END)
         ON CONFLICT (user_id, folio) DO UPDATE SET monto = EXCLUDED.monto, fecha_vencimiento = EXCLUDED.fecha_vencimiento, concepto = EXCLUDED.concepto, updated_at = NOW()
         RETURNING *`,
        [uuidv4(), cliente.id, req.user.userId, item.folio, item.monto, item.fechaEmision, item.fechaVencimiento, item.concepto]
      );

      await tx.none('DELETE FROM calendario_cobranza WHERE factura_id = $1', [factura.id]);
      created.push(factura);
    }
  });

  for (const factura of created) {
    await crearCalendarioParaFactura(factura.id, factura.fecha_vencimiento);
  }

  res.status(201).json({ message: `${created.length} facturas importadas`, facturas: created });
}));

module.exports = router;

