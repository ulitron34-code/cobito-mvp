const API_URL = process.env.API_URL || 'http://localhost:5000/api';

async function main() {
  const health = await fetch(API_URL.replace('/api', '/health')).then((res) => res.json());
  console.log('Health:', health);

  const email = `smoke-${Date.now()}@cobito.mx`;
  const password = 'password123';
  const register = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ empresa: 'Smoke Test', email, password })
  });
  if (!register.ok) throw new Error(`Register fallo: ${register.status}`);
  const session = await register.json();

  const clientes = await fetch(`${API_URL}/clientes`, {
    headers: { Authorization: `Bearer ${session.token}` }
  });
  if (!clientes.ok) throw new Error(`Clientes fallo: ${clientes.status}`);

  console.log('Smoke test OK');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
