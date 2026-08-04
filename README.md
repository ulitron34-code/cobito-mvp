# COBITO

COBITO es un MVP SaaS para cobranza inteligente de facturas vencidas en PYMEs mexicanas. Esta version permite operar el flujo base sin integraciones pagadas: registro, clientes, facturas, calendario de cobranza, recordatorios simulados, promesas y pagos.

## Estado de esta entrega

Incluye:

- Backend Express + PostgreSQL/Supabase.
- Auth JWT con bcrypt.
- CRUD de clientes.
- Facturas manuales e importacion CSV con archivo, validacion y vista previa.
- Calendario automatico de cobranza por factura.
- Envio simulado por WhatsApp, email, SMS o llamada.
- Plantillas editables de mensajes de cobranza con preview por factura.
- Chatbot base de WhatsApp con webhook inbound, intenciones y auto-respuestas.
- Registro de promesas y pagos.
- Dashboard con vencido, promesas, cobrado, saldo abierto, aging report y prioridad.
- Ficha de cliente con facturas, pagos, promesas y contactos recientes.
- Frontend Next.js + Tailwind usable.
- Scripts `seed:demo` y `smoke` para probar API.

Todavia pendiente para fase 2:

- Envio WhatsApp real con Twilio o Meta.
- Stripe Payment Links reales.
- Tests automatizados.
- CI/CD y monitoreo.
- Importacion XLSX real.

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
3. Usar el CSV de ejemplo incluido en pantalla, cargar un archivo CSV o `docs/demo-cartera.csv`.
4. Revisar la vista previa e importar cartera.
5. Abrir Dashboard.
6. Abrir Clientes y revisar la ficha de un cliente.
7. Abrir Cobranza, elegir plantilla y copiar mensaje.
8. Pulsar Registrar contacto en un recordatorio.
9. Registrar promesa.
10. Registrar pago y volver al Dashboard para ver recuperacion.

## Endpoints principales

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET|POST /api/clientes`
- `GET /api/clientes/:id`
- `GET|POST /api/facturas`
- `POST /api/facturas/import/excel`
- `GET|POST /api/facturas/:id/pagos`
- `GET /api/cobranza/calendario`
- `GET|POST /api/cobranza/templates`
- `GET /api/cobranza/:facturaId/mensaje`
- `POST /api/cobranza/:facturaId/enviar`
- `POST /api/cobranza/:facturaId/promesa`
- `GET /api/cobranza/:facturaId/logs`
- `GET /api/dashboard/metricas`
- `GET /api/dashboard/prioridad`
- `GET /api/dashboard/aging`
- `GET|POST /api/webhooks/whatsapp`
## Chatbot WhatsApp

El webhook base funciona en modo simulado y esta preparado para payloads simples, Twilio o Meta Cloud API.

Ejemplo local:

```bash
curl -X POST http://localhost:5000/api/webhooks/whatsapp \
  -H 'Content-Type: application/json' \
  -d '{"from":"5551112233","body":"Prometo pagar el 15/08 la factura F-1001"}'
```

En produccion configura `WHATSAPP_WEBHOOK_SECRET` y manda el mismo valor en `x-cobito-webhook-secret` o `?secret=`.