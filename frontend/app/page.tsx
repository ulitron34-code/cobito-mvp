import Link from 'next/link';

export default function Home() {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-66px)] max-w-7xl grid-cols-1 gap-8 px-4 py-8 lg:grid-cols-[1fr_420px] lg:items-center">
      <section className="py-8">
        <p className="mb-3 text-sm font-bold uppercase text-mint">COBITO para PYMEs mexicanas</p>
        <h1 className="max-w-3xl text-4xl font-black leading-tight text-ink md:text-6xl">Cobranza inteligente por WhatsApp, sin cambiar tu ERP.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">Carga tus facturas, prioriza lo vencido, manda recordatorios y registra promesas de pago desde un panel ligero pensado para dueños y contadores.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/register" className="btn-primary">Crear cuenta demo</Link>
          <Link href="/dashboard" className="btn-secondary">Ver dashboard</Link>
        </div>
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black">Cartera prioritaria</h2>
          <span className="rounded bg-coral/10 px-2 py-1 text-xs font-bold text-coral">Demo</span>
        </div>
        {[
          ['Comercial Bajío', '$86,400', '18 días'],
          ['Ferretería Norte', '$42,900', '9 días'],
          ['Grupo Textil MX', '$31,200', '5 días']
        ].map(([name, amount, late]) => (
          <div key={name} className="mb-3 rounded border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <strong>{name}</strong>
              <span className="font-black text-ink">{amount}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-slate-500">
              <span>Factura vencida</span>
              <span>{late}</span>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
