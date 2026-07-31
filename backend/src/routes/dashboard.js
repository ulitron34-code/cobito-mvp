const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
router.use(authMiddleware);

router.get('/metricas', asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const metrics = await db.one(
    `SELECT
      COALESCE(SUM(CASE WHEN estado IN ('VENCIDA', 'PENDIENTE') AND fecha_vencimiento < NOW()::date THEN monto ELSE 0 END), 0)::float AS total_vencido,
      COALESCE(SUM(CASE WHEN estado = 'PROMESA' THEN monto ELSE 0 END), 0)::float AS total_promesa,
      COALESCE((SELECT SUM(p.monto) FROM pagos p JOIN facturas fp ON fp.id = p.factura_id WHERE fp.user_id = $1), 0)::float AS total_cobrado,
      COALESCE(SUM(monto), 0)::float AS total_facturado,
      COUNT(*)::int AS facturas_total,
      COUNT(*) FILTER (WHERE estado = 'PAGADA')::int AS facturas_pagadas,
      COUNT(*) FILTER (WHERE estado IN ('VENCIDA', 'PENDIENTE') AND fecha_vencimiento < NOW()::date)::int AS facturas_vencidas
     FROM facturas
     WHERE user_id = $1`,
    [userId]
  );

  const tasaRecuperacion = metrics.total_facturado > 0
    ? Number(((metrics.total_cobrado / metrics.total_facturado) * 100).toFixed(2))
    : 0;

  res.json({ ...metrics, tasa_recuperacion: tasaRecuperacion });
}));

router.get('/prioridad', asyncHandler(async (req, res) => {
  const rows = await db.any(
    `SELECT f.id, f.folio, f.monto::float, f.moneda, f.fecha_vencimiento, f.estado,
      c.nombre AS cliente_nombre, c.telefono, c.email,
      GREATEST(0, NOW()::date - f.fecha_vencimiento)::int AS dias_vencida,
      (GREATEST(0, NOW()::date - f.fecha_vencimiento)::int * 2 + LEAST(f.monto / 1000, 100))::float AS score
     FROM facturas f
     JOIN clientes c ON c.id = f.cliente_id
     WHERE f.user_id = $1 AND f.estado <> 'PAGADA'
     ORDER BY score DESC, f.fecha_vencimiento ASC
     LIMIT 20`,
    [req.user.userId]
  );

  res.json(rows);
}));

module.exports = router;
