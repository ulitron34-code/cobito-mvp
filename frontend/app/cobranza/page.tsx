'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, Factura } from '@/utils/api';
import { daysLate, money, shortDate } from '@/utils/format';

type Calendario = {
  id: string;
  factura_id: string;
  folio?: string;
  cliente_nombre: string;
  monto: number;
  fecha_vencimiento: string;
  tipo_accion: string;
  fecha_programada: string;
  canal: 'WHATSAPP' | 'EMAIL' | 'SMS' | 'LLAMADA';
  status: string;
};

type Filter = 'HOY' | 'PENDIENTE' | 'WHATSAPP' | 'EMAIL' | 'COMPLETADO' | 'TODO';

const filters: { label: string; value: Filter }[] = [
  { label: 'Hoy', value: 'HOY' },
  { label: 'Pendientes', value: 'PENDIENTE' },
  { label: 'WhatsApp', value: 'WHATSAPP' },
  { label: 'Email', value: 'EMAIL' },
  { label: 'Hechos', value: 'COMPLETADO' },
  { label: 'Todo', value: 'TODO' }
];

export default function CobranzaPage() {
  const [items, setItems] = useState<Calendario[]>([]);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [selectedFacturaId, setSelectedFacturaId] = useState('');
  const [filter, setFilter] = useState<Filter>('PENDIENTE');
  const [message, setMessage] = useState('');
  const [promesa, setPromesa] = useState({ facturaId: '', fechaPrometida: '', monto: '' });
  const [pago, setPago] = useState({ facturaId: '', monto: '', canal: 'TRANSFERENCIA', referencia: '' });

  async function load() {
    const [calendar, invoices] = await Promise.all([
      api<Calendario[]>('/cobranza/calendario'),
      api<Factura[]>('/facturas')
    ]);
    const abiertas = invoices.filter((f) => f.estado !== 'PAGADA');
    setItems(calendar);
    setFacturas(abiertas);
    const firstId = abiertas[0]?.id || '';
    setSelectedFacturaId((current) => current || firstId);
    if (!promesa.facturaId && firstId) setPromesa((prev) => ({ ...prev, facturaId: firstId }));
    if (!pago.facturaId && firstId) setPago((prev) => ({ ...prev, facturaId: firstId }));
  }

  useEffect(() => { load().catch((err) => setMessage(err instanceof Error ? err.message : 'No se pudo cargar cobranza')); }, []);

  const selectedFactura = facturas.find((factura) => factura.id === selectedFacturaId) || facturas[0];
  const filteredItems = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return items.filter((item) => {
      if (filter === 'TODO') return true;
      if (filter === 'HOY') return item.status === 'PENDIENTE' && new Date(item.fecha_programada).getTime() <= today.getTime();
      if (filter === 'PENDIENTE') return item.status === 'PENDIENTE';
      if (filter === 'COMPLETADO') return item.status === 'COMPLETADO';
      return item.canal === filter && item.status === 'PENDIENTE';
    });
  }, [filter, items]);

  const resumen = useMemo(() => {
    const pendientes = items.filter((item) => item.status === 'PENDIENTE');
    const hoy = pendientes.filter((item) => new Date(item.fecha_programada) <= new Date());
    const saldo = facturas.reduce((total, factura) => total + Number(factura.monto || 0) - Number(factura.pagado || 0), 0);
    return {
      hoy: hoy.length,
      pendientes: pendientes.length,
      vencidas: facturas.filter((factura) => factura.estado === 'VENCIDA').length,
      saldo
    };
  }, [facturas, items]);

  function selectFactura(facturaId: string) {
    setSelectedFacturaId(facturaId);
    setPromesa((prev) => ({ ...prev, facturaId }));
    setPago((prev) => ({ ...prev, facturaId }));
  }

  function buildMessage(factura?: Factura) {
    if (!factura) return 'Carga una cartera para generar mensajes de cobranza.';
    const folio = factura.folio || factura.id.slice(0, 8);
    const vencimiento = shortDate(factura.fecha_vencimiento);
    return `Hola ${factura.cliente_nombre}, te contacto por la factura ${folio} por ${money(factura.monto)}, vencida el ${vencimiento}. Nos confirmas fecha estimada de pago?`;
  }

  async function copyMessage() {
    const text = buildMessage(selectedFactura);
    await navigator.clipboard.writeText(text);
    setMessage('Mensaje copiado.');
  }

  async function send(item: Calendario) {
    selectFactura(item.factura_id);
    const response = await api<{ message: string }>(`/cobranza/${item.factura_id}/enviar`, { method: 'POST', body: JSON.stringify({ canal: item.canal }) });
    setMessage(response.message);
    await load();
  }

  async function savePromise() {
    await api(`/cobranza/${promesa.facturaId}/promesa`, { method: 'POST', body: JSON.stringify({ fechaPrometida: promesa.fechaPrometida, monto: Number(promesa.monto) }) });
    setMessage('Promesa registrada.');
    setPromesa({ ...promesa, fechaPrometida: '', monto: '' });
    await load();
  }

  async function savePayment() {
    await api(`/facturas/${pago.facturaId}/pagos`, { method: 'POST', body: JSON.stringify({ monto: Number(pago.monto), canal: pago.canal, referencia: pago.referencia }) });
    setMessage('Pago registrado.');
    setPago({ ...pago, monto: '', referencia: '' });
    await load();
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6 xl:grid-cols-[1fr_380px]">
      <section className="space-y-5">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black">Bandeja de cobranza</h1>
              <p className="mt-1 text-sm text-slate-500">Prioriza, contacta y registra avances desde una sola vista.</p>
            </div>
            {message ? <span className="rounded bg-mint/10 px-3 py-2 text-sm font-bold text-mint">{message}</span> : null}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <Metric label="Acciones hoy" value={resumen.hoy} />
            <Metric label="Pendientes" value={resumen.pendientes} />
            <Metric label="Facturas vencidas" value={resumen.vencidas} />
            <Metric label="Saldo abierto" value={money(resumen.saldo)} />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {filters.map((option) => (
              <button
                key={option.value}
                className={filter === option.value ? 'btn-primary py-2 text-sm' : 'btn-secondary py-2 text-sm'}
                type="button"
                onClick={() => setFilter(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-xs uppercase text-slate-500">
                <tr><th className="py-3">Fecha</th><th>Cliente</th><th>Accion</th><th>Canal</th><th>Dias</th><th className="text-right">Monto</th><th></th></tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className={item.factura_id === selectedFactura?.id ? 'border-b bg-mint/5 last:border-0' : 'border-b last:border-0'}>
                    <td className="py-3">{shortDate(item.fecha_programada)}</td>
                    <td>
                      <button className="text-left font-semibold text-ink" type="button" onClick={() => selectFactura(item.factura_id)}>
                        {item.cliente_nombre}
                        <span className="block text-xs font-normal text-slate-500">{item.folio || item.factura_id.slice(0, 8)}</span>
                      </button>
                    </td>
                    <td>{item.tipo_accion}</td>
                    <td><span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold">{item.canal}</span></td>
                    <td>{daysLate(item.fecha_vencimiento)}</td>
                    <td className="text-right font-semibold">{money(item.monto)}</td>
                    <td className="text-right">
                      <button className="btn-secondary py-2 text-xs" onClick={() => send(item)} disabled={item.status === 'COMPLETADO'}>
                        {item.status === 'COMPLETADO' ? 'Hecho' : 'Registrar contacto'}
                      </button>
                    </td>
                  </tr>
                ))}
                {!filteredItems.length ? <tr><td className="py-6 text-slate-500" colSpan={7}>No hay acciones en este filtro.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <aside className="space-y-5">
        <Panel title="Factura activa">
          {selectedFactura ? (
            <>
              <div className="rounded border border-slate-200 p-3 text-sm">
                <p className="font-black">{selectedFactura.cliente_nombre}</p>
                <p className="mt-1 text-slate-500">{selectedFactura.folio || selectedFactura.id.slice(0, 8)} - vence {shortDate(selectedFactura.fecha_vencimiento)}</p>
                <p className="mt-3 text-2xl font-black text-coral">{money(selectedFactura.monto)}</p>
              </div>
              <textarea className="field min-h-36 text-sm" value={buildMessage(selectedFactura)} readOnly />
              <button className="btn-primary w-full" type="button" onClick={copyMessage}>Copiar mensaje</button>
            </>
          ) : <p className="text-sm text-slate-500">Carga facturas para activar acciones de cobranza.</p>}
        </Panel>

        <Panel title="Registrar promesa">
          <select className="field" value={promesa.facturaId} onChange={(e) => selectFactura(e.target.value)}>
            {facturas.map((f) => <option key={f.id} value={f.id}>{f.cliente_nombre} - {f.folio || f.id.slice(0, 8)}</option>)}
          </select>
          <input className="field" type="date" value={promesa.fechaPrometida} onChange={(e) => setPromesa({ ...promesa, fechaPrometida: e.target.value })} />
          <input className="field" type="number" placeholder="Monto prometido" value={promesa.monto} onChange={(e) => setPromesa({ ...promesa, monto: e.target.value })} />
          <button className="btn-primary w-full" onClick={savePromise} disabled={!promesa.facturaId || !promesa.fechaPrometida || !promesa.monto}>Guardar promesa</button>
        </Panel>

        <Panel title="Registrar pago">
          <select className="field" value={pago.facturaId} onChange={(e) => selectFactura(e.target.value)}>
            {facturas.map((f) => <option key={f.id} value={f.id}>{f.cliente_nombre} - {money(f.monto)}</option>)}
          </select>
          <input className="field" type="number" placeholder="Monto pagado" value={pago.monto} onChange={(e) => setPago({ ...pago, monto: e.target.value })} />
          <select className="field" value={pago.canal} onChange={(e) => setPago({ ...pago, canal: e.target.value })}>
            <option>TRANSFERENCIA</option>
            <option>STRIPE</option>
            <option>EFECTIVO</option>
            <option>CHEQUE</option>
          </select>
          <input className="field" placeholder="Referencia" value={pago.referencia} onChange={(e) => setPago({ ...pago, referencia: e.target.value })} />
          <button className="btn-primary w-full" onClick={savePayment} disabled={!pago.facturaId || !pago.monto}>Guardar pago</button>
        </Panel>
      </aside>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded border border-slate-200 px-3 py-3"><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className="mt-1 text-xl font-black">{value}</p></div>;
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-black">{title}</h2><div className="mt-4 space-y-3">{children}</div></section>;
}