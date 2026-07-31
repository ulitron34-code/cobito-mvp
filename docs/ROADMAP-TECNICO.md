# ROADMAP TECNICO COBITO

## Criterio para MVP beta

- Registro/login funciona con Supabase.
- Importacion de cartera crea clientes, facturas y calendario.
- Dashboard muestra vencido, promesas, cobrado y prioridad.
- Cobranza registra logs de recordatorio simulado.
- Promesas cambian factura a `PROMESA`.
- Pagos parciales se acumulan; pago completo cambia factura a `PAGADA`.

## Fase 2: WhatsApp real

1. Elegir proveedor: Twilio WhatsApp para velocidad o Meta Cloud API para costo/escala.
2. Crear servicio `backend/src/services/whatsapp.js` con interface:
   - `sendMessage({ to, body, facturaId })`
   - respuesta normalizada `{ provider, status, externalId }`.
3. Cambiar `cobranza/:facturaId/enviar` para usar provider real cuando existan env vars.
4. Guardar `externalId` en `logs_comunicacion.resultado`.
5. Agregar webhook `/api/webhooks/whatsapp` para delivered/read/replied.

## Fase 3: Stripe

1. Crear `payment_links` o tabla `links_pago`.
2. Endpoint `POST /api/facturas/:id/payment-link`.
3. Webhook Stripe para marcar pago cuando llegue `checkout.session.completed`.
4. Mostrar link de pago en mensaje WhatsApp/email.

## Fase 4: Import XLSX real

1. Agregar upload con `multer`.
2. Parsear XLSX con `xlsx` o CSV con `papaparse` en backend.
3. Validar columnas y devolver preview antes de insertar.

## Fase 5: Seguridad y operacion

- Rate limit en auth y cobranza.
- Helmet.
- Refresh tokens o sesiones cortas.
- Tests con Jest/Supertest.
- Logs estructurados.
- Sentry.
- Backups Supabase.
