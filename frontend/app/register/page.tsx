'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { api, saveSession, User } from '@/utils/api';

type AuthResponse = { token: string; user: User };

export default function RegisterPage() {
  const router = useRouter();
  const [empresa, setEmpresa] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify({ empresa, email, password }) });
      saveSession(data.token, data.user);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la cuenta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-66px)] max-w-md place-items-center px-4">
      <form onSubmit={submit} className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black">Crear cuenta demo</h1>
        <p className="mt-2 text-sm text-slate-500">Password minimo de 8 caracteres.</p>
        <div className="mt-6 space-y-4">
          <input className="field" placeholder="Empresa" value={empresa} onChange={(e) => setEmpresa(e.target.value)} required />
          <input className="field" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="field" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          {error ? <p className="text-sm font-semibold text-coral">{error}</p> : null}
          <button className="btn-primary w-full" disabled={loading}>{loading ? 'Creando...' : 'Crear cuenta'}</button>
        </div>
        <p className="mt-5 text-center text-sm text-slate-500">Ya tienes cuenta? <Link className="font-bold text-mint" href="/login">Entrar</Link></p>
      </form>
    </main>
  );
}
