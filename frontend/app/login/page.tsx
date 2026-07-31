'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { api, saveSession, User } from '@/utils/api';

type AuthResponse = { token: string; user: User };

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      saveSession(data.token, data.user);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-66px)] max-w-md place-items-center px-4">
      <form onSubmit={submit} className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black">Entrar a COBITO</h1>
        <p className="mt-2 text-sm text-slate-500">Continua tu gestion de cobranza.</p>
        <div className="mt-6 space-y-4">
          <input className="field" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="field" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error ? <p className="text-sm font-semibold text-coral">{error}</p> : null}
          <button className="btn-primary w-full" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
        </div>
        <p className="mt-5 text-center text-sm text-slate-500">Sin cuenta? <Link className="font-bold text-mint" href="/register">Registrate</Link></p>
      </form>
    </main>
  );
}
