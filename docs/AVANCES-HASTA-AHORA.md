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
