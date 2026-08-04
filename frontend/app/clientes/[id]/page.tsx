'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { api, ClienteDetalle } from '@/utils/api';
import { daysLate, money, shortDate } from '@/utils/format';

export default function ClienteDetallePage() {
  const params = useParams<{ id: string }>();
  const [cliente, setCliente] = useState<ClienteDetalle | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!params.id) return;
    api<ClienteDetalle>(`/clientes/${params.id}`)
      .then(setCliente)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar cliente'));
  }, [params.id]);

  const abiertas = useMemo(() => cliente?.facturas_detalle.filter((factura) => factura.estado !== 'PAGADA') || [], [cliente]);
  const vencidas = abiertas.filter((factura) => daysLate(factura.fecha_vencimiento) > 0);

  if (error) {
    return <main className="mx-auto max-w-7xl px-4 py-6"><p className="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{error}</p></main>;
  }

  if (!cliente) {
    return <main className="mx-auto max-w-7xl px-4 py-6"><p className="text-sm text-slate-500">Cargando cliente...</p></main>;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/clientes" className="text-sm font-semibold text-mint">Volver a clientes</Link>
          <h1 className="mt-2 text-3xl font-black text-ink">{cliente.nombre}</h1>
          <p className="mt-1 text-sm text-slate-500">{cliente.rfc || 'Sin RFC'} · {cliente.email || cliente.telefono || 'Sin contacto'}</p>
        </div>
        <Link href="/cobranza" className="btn-primary">Abrir cobranza</Link>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Saldo abierto" value={money(cliente.saldo_pendiente)} tone="text-coral" />
        <Metric label="Facturas" value={cliente.facturas || 0} tone="text-ink" />
        <Metric label="Vencidas" value={vencidas.length} tone="text-amber" />
        <Metric label="Promesas" value={cliente.promesas.filter((promesa) => promesa.status === 'ACTIVA').length} tone="text-mint" />
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_360px]">
        <Panel title="Facturas del cliente">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-xs uppercase text-slate-500"><tr><th className="py-3">Folio</th><th>Vence</th><th>Dias</th><th>Estado</th><th className="text-right">Saldo</th></tr></thead>
              <tbody>
                {cliente.facturas_detalle.map((factura) => (
                  <tr key={factura.id} className="border-b last:border-0">
                    <td className="py-3 font-semibold">{factura.folio || factura.id.slice(0, 8)}</td>
                    <td>{shortDate(factura.fecha_vencimiento)}</td>
                    <td>{daysLate(factura.fecha_vencimiento)}</td>
                    <td><span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold">{factura.estado}</span></td>
                    <td className="text-right font-black">{money(factura.saldo ?? factura.monto)}</td>
                  </tr>
                ))}
                {!cliente.facturas_detalle.length ? <tr><td className="py-6 text-slate-500" colSpan={5}>Sin facturas para este cliente.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </Panel>

        <aside className="space-y-5">
          <Panel title="Promesas">
            <StackEmpty show={!cliente.promesas.length}>Sin promesas registradas.</StackEmpty>
            {cliente.promesas.slice(0, 5).map((promesa) => (
              <HistoryItem key={promesa.id} title={`${promesa.folio || promesa.factura_id.slice(0, 8)} · ${money(promesa.monto)}`} meta={`${shortDate(promesa.fecha_prometida)} · ${promesa.status}`} />
            ))}
          </Panel>

          <Panel title="Pagos">
            <StackEmpty show={!cliente.pagos.length}>Sin pagos registrados.</StackEmpty>
            {cliente.pagos.slice(0, 5).map((pago) => (
              <HistoryItem key={pago.id} title={`${pago.folio || pago.factura_id.slice(0, 8)} · ${money(pago.monto)}`} meta={`${shortDate(pago.fecha_pago)} · ${pago.canal || 'Pago'}`} />
            ))}
          </Panel>

          <Panel title="Chat WhatsApp">
            <StackEmpty show={!cliente.chatbot?.length}>Sin mensajes del chatbot.</StackEmpty>
            {cliente.chatbot?.slice(0, 6).map((chat) => (
              <HistoryItem
                key={chat.id}
                title={`${chat.direccion === 'INBOUND' ? 'Cliente' : 'COBITO'} · ${chat.intencion || 'Mensaje'}`}
                meta={`${shortDate(chat.created_at)} · ${chat.folio || chat.factura_id?.slice(0, 8) || chat.telefono || 'Sin factura'}`}
                body={chat.mensaje}
              />
            ))}
          </Panel>

          <Panel title="Contactos recientes">
            <StackEmpty show={!cliente.logs.length}>Sin contactos registrados.</StackEmpty>
            {cliente.logs.slice(0, 5).map((log) => (
              <HistoryItem key={log.id} title={`${log.tipo} · ${log.folio || log.factura_id.slice(0, 8)}`} meta={`${shortDate(log.created_at)} · ${log.destinatario || 'Sin destinatario'}`} />
            ))}
          </Panel>
        </aside>
      </section>
    </main>
  );
}

function Metric({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className={`mt-2 text-2xl font-black ${tone}`}>{value}</p></div>;
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-black">{title}</h2><div className="mt-4 space-y-3">{children}</div></section>;
}

function HistoryItem({ title, meta, body }: { title: string; meta: string; body?: string }) {
  return <div className="rounded border border-slate-200 px-3 py-2 text-sm"><p className="font-bold text-ink">{title}</p><p className="mt-1 text-xs text-slate-500">{meta}</p>{body ? <p className="mt-2 text-xs leading-relaxed text-slate-700">{body}</p> : null}</div>;
}

function StackEmpty({ show, children }: { show: boolean; children: ReactNode }) {
  return show ? <p className="text-sm text-slate-500">{children}</p> : null;
}