'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api, Cliente, Factura } from '@/utils/api';
import { money, shortDate } from '@/utils/format';

const sampleCsv = `clienteNombre,rfc,email,telefono,folio,monto,fechaEmision,fechaVencimiento,concepto
Comercial Bajio,CBJ010101AA1,cobranza@bajio.mx,5551112233,F-1001,86400,2026-06-01,2026-07-10,Servicios mensuales
Ferreteria Norte,FNO020202BB2,pagos@norte.mx,5552223344,F-1002,42900,2026-06-15,2026-07-22,Material industrial`;

export default function FacturasPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [csv, setCsv] = useState(sampleCsv);
  const [form, setForm] = useState({ clienteId: '', folio: '', monto: '', fechaEmision: '', fechaVencimiento: '', concepto: '' });
  const [message, setMessage] = useState('');

  async function load() {
    const [c, f] = await Promise.all([api<Cliente[]>('/clientes'), api<Factura[]>('/facturas')]);
    setClientes(c);
    setFacturas(f);
    if (!form.clienteId && c[0]) setForm((prev) => ({ ...prev, clienteId: c[0].id }));
  }

  useEffect(() => { load().catch((err) => setMessage(err instanceof Error ? err.message : 'No se pudo cargar facturas')); }, []);

  async function createFactura(event: FormEvent) {
    event.preventDefault();
    await api<Factura>('/facturas', { method: 'POST', body: JSON.stringify({ ...form, monto: Number(form.monto), moneda: 'MXN' }) });
    setForm({ clienteId: form.clienteId, folio: '', monto: '', fechaEmision: '', fechaVencimiento: '', concepto: '' });
    setMessage('Factura creada y calendario generado.');
    await load();
  }

  async function importCsv() {
    const rows = parseCsv(csv);
    const response = await api<{ message: string }>('/facturas/import/excel', { method: 'POST', body: JSON.stringify({ facturas: rows }) });
    setMessage(response.message);
    await load();
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6 xl:grid-cols-[380px_1fr]">
      <aside className="space-y-5">
        <form onSubmit={createFactura} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-black">Facturas</h1>
          <p className="mt-1 text-sm text-slate-500">Alta manual con calendario automatico.</p>
          <div className="mt-5 space-y-3">
            <select className="field" value={form.clienteId} onChange={(e) => setForm({ ...form, clienteId: e.target.value })} required>
              <option value="">Selecciona cliente</option>
              {clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>)}
            </select>
            <input className="field" placeholder="Folio" value={form.folio} onChange={(e) => setForm({ ...form, folio: e.target.value })} />
            <input className="field" type="number" placeholder="Monto" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} required />
            <input className="field" type="date" value={form.fechaEmision} onChange={(e) => setForm({ ...form, fechaEmision: e.target.value })} required />
            <input className="field" type="date" value={form.fechaVencimiento} onChange={(e) => setForm({ ...form, fechaVencimiento: e.target.value })} required />
            <textarea className="field min-h-20" placeholder="Concepto" value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value })} />
            <button className="btn-primary w-full">Crear factura</button>
          </div>
        </form>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black">Importar CSV</h2>
          <p className="mt-1 text-sm text-slate-500">Pega columnas como el ejemplo.</p>
          <textarea className="field mt-4 min-h-56 font-mono text-xs" value={csv} onChange={(e) => setCsv(e.target.value)} />
          <button className="btn-secondary mt-3 w-full" onClick={importCsv}>Importar cartera</button>
          {message ? <p className="mt-3 text-sm font-semibold text-mint">{message}</p> : null}
        </section>
      </aside>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black">Facturas activas</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-xs uppercase text-slate-500"><tr><th className="py-3">Cliente</th><th>Folio</th><th>Vencimiento</th><th>Estado</th><th className="text-right">Monto</th></tr></thead>
            <tbody>
              {facturas.map((factura) => (
                <tr key={factura.id} className="border-b last:border-0">
                  <td className="py-3 font-semibold">{factura.cliente_nombre}</td>
                  <td>{factura.folio || factura.id.slice(0, 8)}</td>
                  <td>{shortDate(factura.fecha_vencimiento)}</td>
                  <td><span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold">{factura.estado}</span></td>
                  <td className="text-right font-black">{money(factura.monto)}</td>
                </tr>
              ))}
              {!facturas.length ? <tr><td className="py-6 text-slate-500" colSpan={5}>Sin facturas todavia.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function parseCsv(raw: string) {
  const [headerLine, ...lines] = raw.trim().split(/\r?\n/);
  const headers = headerLine.split(',').map((h) => h.trim());
  return lines.filter(Boolean).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    const row: Record<string, string | number> = {};
    headers.forEach((header, index) => { row[header] = header === 'monto' ? Number(values[index]) : values[index]; });
    return row;
  });
}

