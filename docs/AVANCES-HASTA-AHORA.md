# COBITO - Avances Hasta Ahora

Fecha: 31 de julio de 2026
Estado: Produccion activa

## 1. Infraestructura publicada

### GitHub

Repositorio:

- https://github.com/ulitron34-code/cobito-mvp

Commits relevantes:

- 9af437c - version inicial del MVP.
- 58d6a04 - ajuste de TypeScript para Vercel.
- 591f97d - controles de importacion demo.

### Supabase

Proyecto:

- Nombre visible: cobito-vmp
- Ref: ecvlcmhcyfliaargrizx

Tablas aplicadas:

- users
- clientes
- facturas
- calendario_cobranza
- promesas_pago
- pagos
- templates_mensajes
- logs_comunicacion

### Render

Backend:

- https://cobito-api.onrender.com

Estado:

- Servicio en verde.
- API conectada a Supabase usando pooler IPv4.

### Vercel

Frontend:

- https://cobito-mvp.vercel.app

Estado:

- Deploy en produccion.
- Variable configurada: NEXT_PUBLIC_API_URL apuntando al backend de Render.

## 2. Producto construido

### Backend

Stack:

- Node.js
- Express
- PostgreSQL/Supabase
- JWT

Rutas principales:

- Auth: registro y login.
- Clientes: alta y listado.
- Facturas: alta, listado, importacion y pagos.
- Cobranza: calendario, recordatorios simulados, promesas, logs.
- Dashboard: metricas y prioridad.

### Frontend

Stack:

- Next.js
- React
- Tailwind CSS

Pantallas creadas:

- Home
- Login
- Registro
- Dashboard
- Clientes
- Facturas
- Cobranza

## 3. Funciones verificadas en produccion

### Registro y dashboard

Se probo desde Vercel:

- Crear usuario nuevo.
- Entrar automaticamente al dashboard.
- Consultar metricas desde Render/Supabase.

Resultado:

- Correcto.

### Importacion demo

Se agrego y probo:

- Boton Cargar demo.
- Boton Importar cartera.
- 5 facturas de ejemplo.
- Mensaje de confirmacion.
- Tabla de facturas activa.

Resultado de prueba:

- 5 facturas importadas.
- Clientes visibles.
- Facturas vencidas visibles.

## 4. Trabajo realizado en esta iteracion

### Documento de producto

Se creo:

- docs/PLAN-MAESTRO-COBITO.md

Contenido:

- Vision del producto.
- Principios UX.
- Hallazgos de investigacion.
- Arquitectura funcional.
- Roadmap por fases.
- Modelo de navegacion.
- Modelo de datos futuro.
- Criterios para decidir nuevas funciones.

### Bandeja de cobranza mejorada

Archivo trabajado:

- frontend/app/cobranza/page.tsx

Mejoras implementadas:

- Cambio de enfoque de calendario a bandeja de cobranza.
- Resumen operativo: acciones de hoy, pendientes, facturas vencidas y saldo abierto.
- Filtros rapidos: Hoy, Pendientes, WhatsApp, Email, Hechos, Todo.
- Tabla de acciones con cliente, folio, canal, dias vencidos y monto.
- Seleccion de factura activa desde la fila.
- Panel lateral de factura activa.
- Mensaje de cobranza listo para copiar.
- Registro de contacto usando endpoint existente.
- Registro de promesa desde la misma vista.
- Registro de pago desde la misma vista.

## 5. Pendiente inmediato recomendado

1. Probar la bandeja de cobranza en produccion con datos demo.
2. Agregar checklist de activacion en Dashboard.
3. Agregar vista previa y validacion visual del CSV.
4. Crear ficha de cliente.
5. Agregar Aging report.

## 6. Criterio de avance

COBITO ya puede mostrarse como demo funcional:

1. Crear cuenta.
2. Importar cartera demo.
3. Ver dashboard.
4. Abrir cobranza.
5. Copiar mensaje.
6. Registrar promesa o pago.

Esto convierte el MVP en una experiencia de cobranza manual-asistida coherente, antes de pasar a integraciones de pago, WhatsApp o email real.

## 7. Avance del 4 de agosto de 2026

### Importacion y control de cartera

Se mejoro:

- Importacion CSV desde archivo o texto pegado.
- Parser robusto con `papaparse`.
- Vista previa de filas validas antes de importar.
- Validacion local de columnas requeridas, montos y fechas.
- Tabla de facturas mostrando saldo abierto neto de pagos parciales.

### Dashboard operativo

Se agrego:

- Calculo de metricas por saldo neto, no solo monto bruto.
- `saldo_abierto` en metricas.
- Aging report por buckets: por vencer, 0-30, 31-60, 61-90 y 90+ dias.
- Prioridad de cobranza basada en saldo pendiente y dias vencidos.

### Ficha de cliente

Se creo:

- Ruta frontend `/clientes/[id]`.
- Endpoint `GET /api/clientes/:id` enriquecido.
- Vista con saldo, facturas, pagos, promesas y contactos recientes.
- Enlace desde la cartera de clientes hacia la ficha.

### Plantillas de cobranza

Se agrego:

- Plantillas default por canal: WhatsApp, email, SMS y llamada.
- Endpoint `GET /api/cobranza/templates`.
- Endpoint `POST /api/cobranza/templates` para guardar plantillas del usuario.
- Endpoint `GET /api/cobranza/:facturaId/mensaje` para preview renderizado desde backend.
- Selector de canal y plantilla en la bandeja de cobranza.
- Guardado rapido de plantillas desde la vista de cobranza.
- Registro de contacto usando la plantilla seleccionada y guardando `templateId` en el resultado del log.

### Validacion tecnica

Se verifico:

- Sintaxis Node de rutas y servicios modificados.
- Build completo de Next.js con TypeScript.

Resultado:

- Build frontend correcto.
- COBITO queda como MVP manual-asistido mas completo, con mejor importacion, mejor visibilidad de saldos y mensajes de cobranza configurables.
### Chatbot WhatsApp base

Se agrego:

- Tabla `chatbot_mensajes` para guardar conversaciones inbound/outbound.
- Servicio `backend/src/services/chatbot.js` con deteccion de intenciones.
- Webhook `POST /api/webhooks/whatsapp` compatible con payload simple, Twilio y Meta Cloud API.
- Soporte opcional de `WHATSAPP_WEBHOOK_SECRET` para proteger el webhook en produccion.
- Registro automatico de promesa cuando el cliente responde con fecha de pago.
- Registro de aviso de pago, aclaracion, prorroga o solicitud de humano en logs de comunicacion.
- Historial de chat WhatsApp dentro de la ficha de cliente.

Intenciones soportadas:

- `PROMESA_PAGO`
- `PAGO_REPORTADO`
- `SOLICITA_PRORROGA`
- `ACLARACION`
- `HUMANO`
- `SALUDO`
- `NO_ENTENDIDO`