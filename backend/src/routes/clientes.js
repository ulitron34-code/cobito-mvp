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
      COALESCE(SUM(CASE WHEN f.estado <> 'PAGADA' THEN f.monto ELSE 0 END), 0)::float AS saldo_pendiente
     FROM clientes c
     LEFT JOIN facturas f ON f.cliente_id = c.id
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
    'SELECT * FROM clientes WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user.userId]
  );

  if (!cliente) throw httpError(404, 'Cliente no encontrado');
  res.json(cliente);
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
