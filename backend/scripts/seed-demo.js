const API_URL = process.env.API_URL || 'http://localhost:5000/api';

const demoUser = {
  empresa: 'Demo COBITO',
  email: process.env.DEMO_EMAIL || 'demo@cobito.mx',
  password: process.env.DEMO_PASSWORD || 'password123'
};

const facturas = [
  { clienteNombre: 'Comercial Bajio', rfc: 'CBJ010101AA1', email: 'cobranza@bajio.mx', telefono: '5551112233', folio: 'F-1001', monto: 86400, fechaEmision: '2026-06-01', fechaVencimiento: '2026-07-10', concepto: 'Servicios mensuales' },
  { clienteNombre: 'Ferreteria Norte', rfc: 'FNO020202BB2', email: 'pagos@norte.mx', telefono: '5552223344', folio: 'F-1002', monto: 42900, fechaEmision: '2026-06-15', fechaVencimiento: '2026-07-22', concepto: 'Material industrial' },
  { clienteNombre: 'Grupo Textil MX', rfc: 'GTM030303CC3', email: 'admin@textilmx.mx', telefono: '5553334455', folio: 'F-1003', monto: 31200, fechaEmision: '2026-06-20', fechaVencimiento: '2026-07-26', concepto: 'Insumos textiles' },
  { clienteNombre: 'Distribuidora Sur', rfc: 'DSU040404DD4', email: 'cuentas@sur.mx', telefono: '5554445566', folio: 'F-1004', monto: 155000, fechaEmision: '2026-05-28', fechaVencimiento: '2026-07-05', concepto: 'Pedido mayorista' },
  { clienteNombre: 'Consultoria Delta', rfc: 'CDE050505EE5', email: 'finanzas@delta.mx', telefono: '5555556677', folio: 'F-1005', monto: 18700, fechaEmision: '2026-07-01', fechaVencimiento: '2026-07-30', concepto: 'Servicios profesionales' }
];

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${response.status} ${data.error || response.statusText}`);
  return data;
}

async function main() {
  let session;
  try {
    session = await request('/auth/register', { method: 'POST', body: JSON.stringify(demoUser) });
    console.log('Usuario demo creado');
  } catch (error) {
    if (!String(error.message).includes('409')) throw error;
    session = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email: demoUser.email, password: demoUser.password }) });
    console.log('Usuario demo ya existia, login correcto');
  }

  const auth = { Authorization: `Bearer ${session.token}` };
  const imported = await request('/facturas/import/excel', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ facturas })
  });

  const metrics = await request('/dashboard/metricas', { headers: auth });
  console.log(imported.message);
  console.log('Metricas:', metrics);
  console.log(`Login demo: ${demoUser.email} / ${demoUser.password}`);
}

main().catch((error) => {
  console.error('Seed demo fallo:', error.message);
  process.exit(1);
});
