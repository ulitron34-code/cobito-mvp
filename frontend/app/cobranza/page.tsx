'use client';

import { useEffect, useState } from 'react';
import { api, Factura } from '@/utils/api';
import { money, shortDate } from '@/utils/format';

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

export default function CobranzaPage() {
  const [items, setItems] = useState<Calendario[]>([]);
  const [facturas, setFacturas] = useState<Factura[]>([]);
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
    if (!promesa.facturaId && abiertas[0]) setPromesa((prev) => ({ ...prev, facturaId: abiertas[0].id }));
    if (!pago.facturaId && abiertas[0]) setPago((prev) => ({ ...prev, facturaId: abiertas[0].id }));
  }

  useEffect(() => { load().catch((err) => setMessage(err instanceof Error ? err.message : 'No se pudo cargar cobranza')); }, []);

  async function send(item: Calendario) {
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
    <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6 xl:grid-cols-[1fr_360px]">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black">Calendario de cobranza</h1>
            <p className="mt-1 text-sm text-slate-500">Recordatorios generados automaticamente por factura.</p>
          </div>
          {message ? <span className="rounded bg-mint/10 px-3 py-2 text-sm font-bold text-mint">{message}</span> : null}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-xs uppercase text-slate-500"><tr><th className="py-3">Fecha</th><th>Cliente</th><th>Accion</th><th>Canal</th><th>Monto</th><th></th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-3">{shortDate(item.fecha_programada)}</td>
                  <td className="font-semibold">{item.cliente_nombre}</td>
                  <td>{item.tipo_accion}</td>
                  <td><span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold">{item.canal}</span></td>
                  <td>{money(item.monto)}</td>
                  <td className="text-right"><button className="btn-secondary py-2 text-xs" onClick={() => send(item)} disabled={item.status === 'COMPLETADO'}>{item.status === 'COMPLETADO' ? 'Enviado' : 'Enviar'}</button></td>
                </tr>
              ))}
              {!items.length ? <tr><td className="py-6 text-slate-500" colSpan={6}>Sin calendario. Crea o importa facturas.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="space-y-5">
        <Panel title="Registrar promesa">
          <select className="field" value={promesa.facturaId} onChange={(e) => setPromesa({ ...promesa, facturaId: e.target.value })}>
            {facturas.map((f) => <option key={f.id} value={f.id}>{f.cliente_nombre} - {f.folio || f.id.slice(0, 8)}</option>)}
          </select>
          <input className="field" type="date" value={promesa.fechaPrometida} onChange={(e) => setPromesa({ ...promesa, fechaPrometida: e.target.value })} />
          <input className="field" type="number" placeholder="Monto prometido" value={promesa.monto} onChange={(e) => setPromesa({ ...promesa, monto: e.target.value })} />
          <button className="btn-primary w-full" onClick={savePromise} disabled={!promesa.facturaId || !promesa.fechaPrometida || !promesa.monto}>Guardar promesa</button>
        </Panel>

        <Panel title="Registrar pago">
          <select className="field" value={pago.facturaId} onChange={(e) => setPago({ ...pago, facturaId: e.target.value })}>
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

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-black">{title}</h2><div className="mt-4 space-y-3">{children}</div></section>;
}
