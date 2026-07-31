'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getUser, logout } from '@/utils/api';

const links = [
  ['Dashboard', '/dashboard'],
  ['Clientes', '/clientes'],
  ['Facturas', '/facturas'],
  ['Cobranza', '/cobranza']
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = getUser();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded bg-ink text-sm font-black text-white">CO</span>
          <span>
            <span className="block text-base font-black tracking-normal text-ink">COBITO</span>
            <span className="block text-xs text-slate-500">Cobranza inteligente</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className={`rounded px-3 py-2 text-sm font-medium ${pathname === href ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          {user ? <span className="hidden text-slate-500 sm:inline">{user.empresa}</span> : null}
          {user ? (
            <button className="rounded border border-slate-300 px-3 py-2 text-slate-700" onClick={() => { logout(); router.push('/login'); }}>
              Salir
            </button>
          ) : (
            <Link href="/login" className="rounded bg-mint px-3 py-2 font-semibold text-white">Entrar</Link>
          )}
        </div>
      </div>
    </header>
  );
}
