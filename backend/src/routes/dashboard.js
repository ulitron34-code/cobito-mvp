const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
router.use(authMiddleware);

router.get('/metricas', asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const metrics = await db.one(
    `WITH factura_saldos AS (
      SELECT f.*,
        GREATEST(f.monto - COALESCE(p.pagado, 0), 0) AS saldo
      FROM facturas f
      LEFT JOIN (
        SELECT factura_id, SUM(monto) AS pagado
        FROM pagos
        GROUP BY factura_id
      ) p ON p.factura_id = f.id
      WHERE f.user_id = $1
    )
    SELECT
      COALESCE(SUM(CASE WHEN estado IN ('VENCIDA', 'PENDIENTE') AND fecha_vencimiento < NOW()::date THEN saldo ELSE 0 END), 0)::float AS total_vencido,
      COALESCE(SUM(CASE WHEN estado = 'PROMESA' THEN saldo ELSE 0 END), 0)::float AS total_promesa,
      COALESCE((SELECT SUM(p.monto) FROM pagos p JOIN facturas fp ON fp.id = p.factura_id WHERE fp.user_id = $1), 0)::float AS total_cobrado,
      COALESCE(SUM(monto), 0)::float AS total_facturado,
      COALESCE(SUM(CASE WHEN estado <> 'PAGADA' THEN saldo ELSE 0 END), 0)::float AS saldo_abierto,
      COUNT(*)::int AS facturas_total,
      COUNT(*) FILTER (WHERE estado = 'PAGADA')::int AS facturas_pagadas,
      COUNT(*) FILTER (WHERE estado IN ('VENCIDA', 'PENDIENTE') AND fecha_vencimiento < NOW()::date AND saldo > 0)::int AS facturas_vencidas
     FROM factura_saldos`,
    [userId]
  );

  const tasaRecuperacion = metrics.total_facturado > 0
    ? Number(((metrics.total_cobrado / metrics.total_facturado) * 100).toFixed(2))
    : 0;

  res.json({ ...metrics, tasa_recuperacion: tasaRecuperacion });
}));

router.get('/prioridad', asyncHandler(async (req, res) => {
  const rows = await db.any(
    `WITH factura_saldos AS (
      SELECT f.*,
        GREATEST(f.monto - COALESCE(p.pagado, 0), 0) AS saldo
      FROM facturas f
      LEFT JOIN (
        SELECT factura_id, SUM(monto) AS pagado
        FROM pagos
        GROUP BY factura_id
      ) p ON p.factura_id = f.id
      WHERE f.user_id = $1
    )
    SELECT f.id, f.folio, f.monto::float, f.saldo::float, f.moneda, f.fecha_vencimiento, f.estado,
      c.nombre AS cliente_nombre, c.telefono, c.email,
      GREATEST(0, NOW()::date - f.fecha_vencimiento)::int AS dias_vencida,
      (GREATEST(0, NOW()::date - f.fecha_vencimiento)::int * 2 + LEAST(f.saldo / 1000, 100))::float AS score
     FROM factura_saldos f
     JOIN clientes c ON c.id = f.cliente_id
     WHERE f.estado <> 'PAGADA' AND f.saldo > 0
     ORDER BY score DESC, f.fecha_vencimiento ASC
     LIMIT 20`,
    [req.user.userId]
  );

  res.json(rows);
}));

router.get('/aging', asyncHandler(async (req, res) => {
  const rows = await db.any(
    `WITH factura_saldos AS (
      SELECT f.*,
        GREATEST(f.monto - COALESCE(p.pagado, 0), 0) AS saldo,
        GREATEST(0, NOW()::date - f.fecha_vencimiento)::int AS dias_vencida
      FROM facturas f
      LEFT JOIN (
        SELECT factura_id, SUM(monto) AS pagado
        FROM pagos
        GROUP BY factura_id
      ) p ON p.factura_id = f.id
      WHERE f.user_id = $1 AND f.estado <> 'PAGADA'
    )
    SELECT bucket,
      COUNT(*)::int AS facturas,
      COALESCE(SUM(saldo), 0)::float AS saldo
    FROM (
      SELECT saldo,
        CASE
          WHEN dias_vencida <= 0 THEN 'POR_VENCER'
          WHEN dias_vencida <= 30 THEN '0_30'
          WHEN dias_vencida <= 60 THEN '31_60'
          WHEN dias_vencida <= 90 THEN '61_90'
          ELSE '90_MAS'
        END AS bucket
      FROM factura_saldos
      WHERE saldo > 0
    ) bucketed
    GROUP BY bucket
    ORDER BY CASE bucket
      WHEN 'POR_VENCER' THEN 0
      WHEN '0_30' THEN 1
      WHEN '31_60' THEN 2
      WHEN '61_90' THEN 3
      ELSE 4
    END`,
    [req.user.userId]
  );

  res.json(rows);
}));

module.exports = router;