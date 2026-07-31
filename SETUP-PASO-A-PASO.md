# SETUP PASO A PASO - COBITO MVP

## 1. Base de datos

Crea un proyecto en Supabase y abre SQL Editor. Copia y ejecuta completo:

```text
database/schema.sql
```

Copia tu connection string en formato URI.

## 2. Backend

```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

Edita `.env`:

```bash
DATABASE_URL=postgresql://postgres:password@host:5432/postgres
JWT_SECRET=un-secreto-largo
FRONTEND_URL=http://localhost:3000
```

Prueba:

```bash
curl http://localhost:5000/health
```

## 3. Frontend

```bash
cd frontend
copy .env.local.example .env.local
npm install
npm run dev
```

Abre `http://localhost:3000`.

## 4. Demo rapida

Con backend corriendo:

```bash
cd backend
npm run seed:demo
npm run smoke
```

Luego entra con:

```text
demo@cobito.mx / password123
```

## 5. Demo manual

- Registra una cuenta.
- Entra a Facturas.
- Usa el CSV de ejemplo incluido en pantalla.
- Importa cartera.
- Abre Dashboard.
- Abre Cobranza y pulsa Enviar en un recordatorio.
- Registra una promesa.
- Registra un pago.

## 6. Produccion despues

Para produccion, usa:

- Supabase para PostgreSQL.
- Railway/Render para backend.
- Vercel para frontend.
- Variables reales en cada plataforma.

No actives WhatsApp o Stripe reales hasta validar el flujo con 3-5 usuarios beta.
