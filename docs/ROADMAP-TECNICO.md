# ROADMAP TECNICO COBITO

## Criterio para MVP beta

- Registro/login funciona con Supabase.
- Importacion de cartera crea clientes, facturas y calendario.
- Dashboard muestra vencido, promesas, cobrado, saldo abierto, aging y prioridad.
- Cobranza registra logs de recordatorio simulado.
- Cobranza permite elegir y guardar plantillas de mensaje por canal.
- Promesas cambian factura a `PROMESA`.
- Pagos parciales se acumulan; pago completo cambia factura a `PAGADA`.
- Ficha de cliente muestra facturas, pagos, promesas, contactos y chat WhatsApp.

## Hecho en avance del 4 de agosto de 2026

1. Importacion CSV con archivo, parser robusto, validacion y preview.
2. Ficha de cliente `/clientes/[id]`.
3. Aging report en Dashboard.
4. Metricas y prioridades calculadas por saldo neto.
5. Plantillas de cobranza default y personalizadas.
6. Preview backend de mensaje por factura, canal y plantilla.
7. Webhook base de WhatsApp con chatbot inbound, intenciones y auto-respuestas.

## Fase 2: Envio WhatsApp real

1. Elegir proveedor: Twilio WhatsApp para velocidad o Meta Cloud API para costo/escala.
2. Crear servicio `backend/src/services/whatsapp.js` con interface:
   - `sendMessage({ to, body, facturaId })`
   - respuesta normalizada `{ provider, status, externalId }`.
3. Cambiar `cobranza/:facturaId/enviar` para usar provider real cuando existan env vars.
4. Guardar `externalId` en `logs_comunicacion.resultado`.
5. Extender webhook `/api/webhooks/whatsapp` para delivered/read/replied ademas de inbound text.
6. Reusar las plantillas actuales para el cuerpo del mensaje real.

## Fase 3: Stripe

1. Crear `payment_links` o tabla `links_pago`.
2. Endpoint `POST /api/facturas/:id/payment-link`.
3. Webhook Stripe para marcar pago cuando llegue `checkout.session.completed`.
4. Mostrar link de pago en mensaje WhatsApp/email como variable `{{linkPago}}`.

## Fase 4: Import XLSX real

1. Agregar upload con `multer`.
2. Parsear XLSX con `xlsx` en backend.
3. Reutilizar la misma validacion y preview que ya existe para CSV.
4. Devolver errores por fila antes de insertar.

## Fase 5: Seguridad y operacion

- Rate limit en auth y cobranza.
- Helmet.
- Refresh tokens o sesiones cortas.
- Tests con Jest/Supertest.
- Logs estructurados.
- Sentry.
- Backups Supabase.
- Auditoria de acciones de cobranza por usuario.