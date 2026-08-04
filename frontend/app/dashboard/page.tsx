'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AgingBucket, api, Factura, Metrics } from '@/utils/api';
import { daysLate, money, shortDate } from '@/utils/format';

type Priority = Factura & { score: number; dias_vencida: number };

const fallback: Metrics = {
  total_vencido: 0,
  total_promesa: 0,
  total_cobrado: 0,
  total_facturado: 0,
  saldo_abierto: 0,
  facturas_total: 0,
  facturas_pagadas: 0,
  facturas_vencidas: 0,
  tasa_recuperacion: 0
};

const agingLabels: Record<AgingBucket['bucket'], string> = {
  POR_VENCER: 'Por vencer',
  '0_30': '0-30 dias',
  '31_60': '31-60 dias',
  '61_90': '61-90 dias',
  '90_MAS': '90+ dias'
};

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics>(fallback);
  const [priority, setPriority] = useState<Priority[]>([]);
  const [aging, setAging] = useState<AgingBucket[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api<Metrics>('/dashboard/metricas'),
      api<Priority[]>('/dashboard/prioridad'),
      api<AgingBucket[]>('/dashboard/aging')
    ]).then(([m, p, a]) => {
      setMetrics(m);
      setPriority(p);
      setAging(a);
    }).catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar dashboard'));
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-ink">Dashboard</h1>
          <p className="mt-1 text-slate-500">Saldo vencido, promesas y recuperacion.</p>
        </div>
        <Link href="/facturas" className="btn-primary">Cargar facturas</Link>
      </div>

      {error ? <div className="mb-5 rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{error}. Revisa que backend y token esten activos.</div> : null}

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Vencido" value={money(metrics.total_vencido)} tone="text-coral" />
        <Metric label="En promesa" value={money(metrics.total_promesa)} tone="text-amber" />
        <Metric label="Cobrado" value={money(metrics.total_cobrado)} tone="text-mint" />
        <Metric label="Saldo abierto" value={money(metrics.saldo_abierto)} tone="text-ink" />
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black">Prioridad de cobranza</h2>
            <span className="text-sm text-slate-500">Top 20</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-xs uppercase text-slate-500">
                <tr><th className="py-3">Cliente</th><th>Factura</th><th>Vence</th><th>Dias</th><th className="text-right">Saldo</th></tr>
              </thead>
              <tbody>
                {priority.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="py-3 font-semibold">{row.cliente_nombre}</td>
                    <td>{row.folio || row.id.slice(0, 8)}</td>
                    <td>{shortDate(row.fecha_vencimiento)}</td>
                    <td>{row.dias_vencida ?? daysLate(row.fecha_vencimiento)}</td>
                    <td className="text-right font-black">{money(row.saldo ?? row.monto)}</td>
                  </tr>
                ))}
                {!priority.length ? <tr><td className="py-6 text-slate-500" colSpan={5}>Aun no hay facturas. Importa una cartera para ver prioridades.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black">Aging report</h2>
            <div className="mt-4 space-y-3 text-sm">
              {aging.map((bucket) => (
                <div key={bucket.bucket} className="rounded border border-slate-200 px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{agingLabels[bucket.bucket]}</span>
                    <strong>{money(bucket.saldo)}</strong>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{bucket.facturas} facturas</p>
                </div>
              ))}
              {!aging.length ? <p className="text-sm text-slate-500">Sin saldo abierto para clasificar.</p> : null}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black">Pulso operativo</h2>
            <div className="mt-4 space-y-3 text-sm">
              <Pulse label="Facturas totales" value={metrics.facturas_total} />
              <Pulse label="Facturas vencidas" value={metrics.facturas_vencidas} />
              <Pulse label="Facturas pagadas" value={metrics.facturas_pagadas} />
              <Pulse label="Recuperacion" value={`${metrics.tasa_recuperacion}%`} />
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className={`mt-2 text-2xl font-black ${tone}`}>{value}</p></div>;
}

function Pulse({ label, value }: { label: string; value: number | string }) {
  return <div className="flex items-center justify-between rounded border border-slate-200 px-3 py-2"><span>{label}</span><strong>{value}</strong></div>;
}