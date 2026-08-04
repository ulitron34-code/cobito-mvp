const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { validate } = require('../utils/validators');
const asyncHandler = require('../utils/asyncHandler');
const { httpError } = require('../utils/errors');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
router.use(authMiddleware);

router.get('/', asyncHandler(async (req, res) => {
  const clientes = await db.any(
    `SELECT c.*,
      COUNT(f.id)::int AS facturas,
      COALESCE(SUM(GREATEST(f.monto - COALESCE(p.pagado, 0), 0)) FILTER (WHERE f.estado <> 'PAGADA'), 0)::float AS saldo_pendiente
     FROM clientes c
     LEFT JOIN facturas f ON f.cliente_id = c.id
     LEFT JOIN (
       SELECT factura_id, SUM(monto) AS pagado
       FROM pagos
       GROUP BY factura_id
     ) p ON p.factura_id = f.id
     WHERE c.user_id = $1
     GROUP BY c.id
     ORDER BY c.created_at DESC`,
    [req.user.userId]
  );

  res.json(clientes);
}));

router.post('/', validate('cliente'), asyncHandler(async (req, res) => {
  const { nombre, rfc, email, telefono, notas } = req.body;
  const cliente = await db.one(
    `INSERT INTO clientes (id, user_id, nombre, rfc, email, telefono, notas)
     VALUES ($1, $2, $3, NULLIF($4, ''), NULLIF($5, ''), NULLIF($6, ''), NULLIF($7, ''))
     RETURNING *`,
    [uuidv4(), req.user.userId, nombre, rfc, email, telefono, notas]
  );

  res.status(201).json(cliente);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const cliente = await db.oneOrNone(
    `SELECT c.*,
      COUNT(f.id)::int AS facturas,
      COALESCE(SUM(GREATEST(f.monto - COALESCE(p.pagado, 0), 0)) FILTER (WHERE f.estado <> 'PAGADA'), 0)::float AS saldo_pendiente
     FROM clientes c
     LEFT JOIN facturas f ON f.cliente_id = c.id
     LEFT JOIN (
       SELECT factura_id, SUM(monto) AS pagado
       FROM pagos
       GROUP BY factura_id
     ) p ON p.factura_id = f.id
     WHERE c.id = $1 AND c.user_id = $2
     GROUP BY c.id`,
    [req.params.id, req.user.userId]
  );

  if (!cliente) throw httpError(404, 'Cliente no encontrado');

  const facturas = await db.any(
    `SELECT f.*,
      COALESCE(SUM(p.monto), 0)::float AS pagado,
      GREATEST(f.monto - COALESCE(SUM(p.monto), 0), 0)::float AS saldo
     FROM facturas f
     LEFT JOIN pagos p ON p.factura_id = f.id
     WHERE f.cliente_id = $1 AND f.user_id = $2
     GROUP BY f.id
     ORDER BY f.fecha_vencimiento ASC, f.created_at DESC`,
    [req.params.id, req.user.userId]
  );

  const pagos = await db.any(
    `SELECT p.*, f.folio
     FROM pagos p
     JOIN facturas f ON f.id = p.factura_id
     WHERE f.cliente_id = $1 AND f.user_id = $2
     ORDER BY p.fecha_pago DESC
     LIMIT 50`,
    [req.params.id, req.user.userId]
  );

  const promesas = await db.any(
    `SELECT pp.*, f.folio
     FROM promesas_pago pp
     JOIN facturas f ON f.id = pp.factura_id
     WHERE f.cliente_id = $1 AND f.user_id = $2
     ORDER BY pp.fecha_prometida ASC, pp.created_at DESC
     LIMIT 50`,
    [req.params.id, req.user.userId]
  );

  const logs = await db.any(
    `SELECT lc.*, f.folio
     FROM logs_comunicacion lc
     JOIN facturas f ON f.id = lc.factura_id
     WHERE f.cliente_id = $1 AND f.user_id = $2
     ORDER BY lc.created_at DESC
     LIMIT 50`,
    [req.params.id, req.user.userId]
  );

  const chatbot = await db.any(
    `SELECT cm.*, f.folio
     FROM chatbot_mensajes cm
     LEFT JOIN facturas f ON f.id = cm.factura_id
     WHERE cm.cliente_id = $1 AND (cm.user_id = $2 OR cm.user_id IS NULL)
     ORDER BY cm.created_at DESC
     LIMIT 50`,
    [req.params.id, req.user.userId]
  );

  res.json({ ...cliente, facturas_detalle: facturas, pagos, promesas, logs, chatbot });
}));

router.put('/:id', validate('cliente'), asyncHandler(async (req, res) => {
  const { nombre, rfc, email, telefono, notas } = req.body;
  const cliente = await db.oneOrNone(
    `UPDATE clientes
     SET nombre = $1, rfc = NULLIF($2, ''), email = NULLIF($3, ''), telefono = NULLIF($4, ''), notas = NULLIF($5, ''), updated_at = NOW()
     WHERE id = $6 AND user_id = $7
     RETURNING *`,
    [nombre, rfc, email, telefono, notas, req.params.id, req.user.userId]
  );

  if (!cliente) throw httpError(404, 'Cliente no encontrado');
  res.json(cliente);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const result = await db.result('DELETE FROM clientes WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
  if (result.rowCount === 0) throw httpError(404, 'Cliente no encontrado');
  res.json({ message: 'Cliente eliminado' });
}));

module.exports = router;
