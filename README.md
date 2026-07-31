# COBITO

COBITO es un MVP SaaS para cobranza inteligente de facturas vencidas en PYMEs mexicanas. Esta version permite operar el flujo base sin integraciones pagadas: registro, clientes, facturas, calendario de cobranza, recordatorios simulados, promesas y pagos.

## Estado de esta entrega

Incluye:

- Backend Express + PostgreSQL/Supabase.
- Auth JWT con bcrypt.
- CRUD de clientes.
- Facturas manuales e importacion por CSV pegado desde el frontend.
- Calendario automatico de cobranza por factura.
- Envio simulado por WhatsApp, email, SMS o llamada.
- Registro de promesas y pagos.
- Dashboard con vencido, promesas, cobrado, recuperacion y prioridad.
- Frontend Next.js + Tailwind usable.
- Scripts `seed:demo` y `smoke` para probar API.

Todavia pendiente para fase 2:

- WhatsApp real con Twilio o Meta.
- Stripe Payment Links reales.
- Tests automatizados.
- CI/CD y monitoreo.
- Importacion real XLSX con archivo.

## Estructura

```text
COBITO/
  backend/    API REST Node.js
  frontend/   App Next.js
  database/   schema.sql para Supabase/Postgres
  docs/       notas y ejemplos
```

## Setup rapido

1. Crear DB en Supabase o PostgreSQL.
2. Ejecutar `database/schema.sql`.
3. Backend:

```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

4. Frontend:

```bash
cd frontend
copy .env.local.example .env.local
npm install
npm run dev
```

5. Abrir `http://localhost:3000`.

## Demo por API

Con backend corriendo:

```bash
cd backend
npm run seed:demo
npm run smoke
```

Usuario demo por defecto:

```text
demo@cobito.mx / password123
```

## Flujo demo recomendado

1. Crear cuenta en `/register`.
2. Entrar a Facturas.
3. Usar el CSV de ejemplo incluido en pantalla o `docs/demo-cartera.csv`.
4. Importar cartera.
5. Abrir Dashboard.
6. Abrir Cobranza y pulsar Enviar en un recordatorio.
7. Registrar promesa.
8. Registrar pago y volver al Dashboard para ver recuperacion.

## Endpoints principales

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET|POST /api/clientes`
- `GET|POST /api/facturas`
- `POST /api/facturas/import/excel`
- `GET|POST /api/facturas/:id/pagos`
- `GET /api/cobranza/calendario`
- `POST /api/cobranza/:facturaId/enviar`
- `POST /api/cobranza/:facturaId/promesa`
- `GET /api/cobranza/:facturaId/logs`
- `GET /api/dashboard/metricas`
- `GET /api/dashboard/prioridad`
