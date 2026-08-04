'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { api, Cliente } from '@/utils/api';
import { money } from '@/utils/format';

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [form, setForm] = useState({ nombre: '', rfc: '', email: '', telefono: '', notas: '' });
  const [error, setError] = useState('');

  async function load() {
    setClientes(await api<Cliente[]>('/clientes'));
  }

  useEffect(() => { load().catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar clientes')); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await api<Cliente>('/clientes', { method: 'POST', body: JSON.stringify(form) });
      setForm({ nombre: '', rfc: '', email: '', telefono: '', notas: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear cliente');
    }
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[360px_1fr]">
      <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-black">Clientes</h1>
        <p className="mt-1 text-sm text-slate-500">Alta rapida para ligar facturas.</p>
        <div className="mt-5 space-y-3">
          <input className="field" placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          <input className="field" placeholder="RFC" value={form.rfc} onChange={(e) => setForm({ ...form, rfc: e.target.value.toUpperCase() })} />
          <input className="field" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="field" placeholder="Telefono WhatsApp" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          <textarea className="field min-h-24" placeholder="Notas" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
          {error ? <p className="text-sm font-semibold text-coral">{error}</p> : null}
          <button className="btn-primary w-full">Guardar cliente</button>
        </div>
      </form>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black">Cartera de clientes</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-xs uppercase text-slate-500"><tr><th className="py-3">Cliente</th><th>RFC</th><th>Contacto</th><th>Facturas</th><th className="text-right">Saldo</th></tr></thead>
            <tbody>
              {clientes.map((cliente) => (
                <tr key={cliente.id} className="border-b last:border-0">
                  <td className="py-3 font-semibold"><Link className="text-ink hover:text-mint" href={`/clientes/${cliente.id}`}>{cliente.nombre}</Link></td>
                  <td>{cliente.rfc || '-'}</td>
                  <td>{cliente.email || cliente.telefono || '-'}</td>
                  <td>{cliente.facturas || 0}</td>
                  <td className="text-right font-black">{money(cliente.saldo_pendiente)}</td>
                </tr>
              ))}
              {!clientes.length ? <tr><td className="py-6 text-slate-500" colSpan={5}>Sin clientes todavia.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

