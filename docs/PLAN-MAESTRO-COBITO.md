# COBITO - Plan Maestro de Producto y UX

Fecha: 31 de julio de 2026
Estado: Plan maestro v1
Objetivo: convertir COBITO en una app de cobranza intuitiva, profesional, minimalista y lista para operar sin depender de parches continuos.

## 1. Vision del producto

COBITO debe ser una herramienta de cobranza inteligente para negocios que necesitan recuperar cuentas por cobrar sin vivir entre hojas de Excel, mensajes sueltos y recordatorios manuales.

La experiencia debe responder una pregunta central cada vez que el usuario entra:

> Que tengo que cobrar hoy y cual es la siguiente mejor accion?

La app no debe sentirse como un sistema contable pesado. Debe sentirse como una bandeja de trabajo clara, rapida y confiable.

## 2. Principios de UX

### 2.1 Claridad antes que cantidad

Cada pantalla debe mostrar solo lo necesario para decidir o actuar. Los datos secundarios deben estar en detalle, filtros o fichas, no compitiendo con la accion principal.

### 2.2 Una accion primaria por contexto

En dashboard: decidir que atender.
En cobranza: contactar, registrar promesa o registrar pago.
En facturas: importar o crear cartera.
En cliente: entender historial y proximo paso.

### 2.3 Flujo guiado, no entrenamiento

El usuario debe poder registrarse, cargar cartera demo, importar facturas y empezar cobranza sin manual. Los estados vacios deben decir que hacer, no solo decir que no hay datos.

### 2.4 Profesional y minimalista

Interfaz sobria, tablas claras, botones consistentes, jerarquia visual fuerte y pocas decoraciones. COBITO es una herramienta de trabajo financiero, no una landing decorativa.

### 2.5 Manual-asistido primero, automatizado despues

Antes de integrar WhatsApp, pagos o ERPs, la app debe dominar el flujo manual-asistido: mensaje listo para copiar, promesas, pagos, prioridades y seguimiento.

## 3. Hallazgos de investigacion

Referencias revisadas:

- Designpixil - SaaS Dashboard UX: https://designpixil.com/blog/saas-dashboard-ux-best-practices
- Foundey - SaaS Dashboard Design: https://foundey.com/blog/saas-dashboard-design
- Goodface - Custom SaaS Dashboard Design Guide: https://goodface.agency/uk/insight/custom-saas-dashboard-design-guide/
- Agicap - Accounts Receivable Automation: https://agicap.com/en-us/products/account-receivable/
- Billtrust - Collections Software: https://www.billtrust.com/products/accounts-receivable-collections-software
- Epicor Cash Collect: https://www.epicor.com/en-us/products/epicor-financials/cash-collect/
- Plooto - Accounts Receivable Automation: https://www.plooto.com/product/accounts-receivable-automation-software
- Blixo - Accounts Receivables: https://blixo.com/

Conclusiones aplicables a COBITO:

1. Los dashboards utiles no son reportes; son superficies de decision.
2. La cobranza debe priorizar cuentas automaticamente.
3. La app debe mostrar quien requiere accion, por que y que mensaje usar.
4. Promesas, pagos e historial deben vivir cerca de la factura, no escondidos.
5. El importador debe ser confiable porque es la puerta de entrada del producto.
6. La automatizacion debe construirse encima de un flujo manual bien probado.
7. Un portal de cliente y links de pago son fase monetizable, no primer paso obligatorio.

## 4. Arquitectura funcional propuesta

### 4.1 Inicio guiado

Objetivo: activar una cuenta nueva en menos de 5 minutos.

Componentes:

- Checklist de activacion.
- Cargar cartera demo.
- Importar CSV propio.
- Revisar dashboard.
- Registrar primera promesa o pago.
- Mensaje de exito cuando la cuenta ya tiene cartera activa.

Criterio de exito:

- Un usuario nuevo entiende que hacer sin soporte.
- La demo puede mostrarse desde cero en una reunion.

### 4.2 Dashboard ejecutivo

Objetivo: decirle al usuario que pasa y donde actuar.

Bloques:

- Saldo vencido.
- Saldo por vencer.
- Cobrado del periodo.
- Promesas proximas.
- Acciones de hoy.
- Top cuentas urgentes.

Regla de diseno:

- Maximo 4 metricas arriba.
- Tabla principal con prioridad accionable.
- Cero graficas decorativas hasta que haya tendencia historica real.

### 4.3 Bandeja de cobranza

Objetivo: ser la pantalla diaria de trabajo.

Funciones clave:

- Filtros: Hoy, Pendientes, WhatsApp, Email, Hechos, Todo.
- Resumen operativo.
- Tabla de acciones programadas.
- Seleccion de factura activa.
- Mensaje listo para copiar.
- Registrar contacto.
- Registrar promesa.
- Registrar pago.

Criterio de exito:

- El usuario no necesita salir de la pantalla para avanzar una cobranza.

### 4.4 Facturas e importacion

Objetivo: que cargar cartera sea facil y confiable.

Funciones clave:

- Carga demo.
- Pegado CSV.
- Vista previa antes de importar.
- Validacion de columnas.
- Deteccion de errores por fila.
- Importacion idempotente por folio.
- Exportar cartera.

Criterio de exito:

- El usuario sabe que se va a importar antes de confirmar.

### 4.5 Clientes

Objetivo: dar contexto completo por cuenta.

Funciones clave:

- Ficha de cliente.
- Saldo total.
- Facturas abiertas.
- Historial de contactos.
- Promesas.
- Pagos.
- Notas internas.
- Riesgo simple.
- Proxima accion recomendada.

Criterio de exito:

- El usuario puede explicar la situacion de un cliente en menos de 30 segundos.

### 4.6 Plantillas y mensajes

Objetivo: estandarizar comunicacion sin integrar proveedores aun.

Funciones clave:

- Plantillas por canal.
- Variables: cliente, folio, monto, vencimiento, dias vencidos.
- Copiar WhatsApp.
- Copiar email.
- Registrar contacto simulado.
- Historial del mensaje usado.

Criterio de exito:

- La cobranza se ve profesional aunque el envio aun sea manual.

### 4.7 Reportes financieros

Objetivo: medir recuperacion y cartera.

Funciones clave:

- Aging: 0-30, 31-60, 61-90, 90+.
- DSO basico.
- Recuperacion mensual.
- Promesas cumplidas vs incumplidas.
- Clientes de mayor riesgo.
- Export CSV.

Criterio de exito:

- El usuario puede tomar decisiones de credito/cobranza, no solo operar pendientes.

### 4.8 Automatizacion avanzada

Objetivo: reducir trabajo manual cuando el flujo base ya este probado.

Funciones futuras:

- Envio real por email.
- WhatsApp Business API.
- Links de pago.
- Portal de cliente.
- Conciliacion de pagos.
- Integraciones contables.
- Multiusuario y roles.

## 5. Roadmap recomendado

### Fase 1 - Demo profesional operativa

Prioridad: inmediata.

Entregables:

- Importador demo claro.
- Bandeja de cobranza mejorada.
- Mensaje listo para copiar.
- Registro de promesa/pago desde una sola vista.
- Dashboard con acciones de hoy.
- Documentacion del plan maestro.

### Fase 2 - UX redonda

Entregables:

- Checklist de activacion.
- Empty states utiles.
- Busqueda global.
- Filtros persistentes.
- Mejor manejo de errores.
- Vista previa de CSV.

### Fase 3 - Producto robusto

Entregables:

- Ficha de cliente.
- Historial completo por factura.
- Aging report.
- Score de prioridad.
- Exportaciones.
- Plantillas editables.

### Fase 4 - Monetizacion

Entregables:

- Portal de cliente.
- Links de pago.
- Stripe o Mercado Pago.
- Email real.
- WhatsApp real.
- Planes y limites por suscripcion.

### Fase 5 - Escala

Entregables:

- Roles y permisos.
- Multiempresa.
- Auditoria.
- Integracion contable.
- API publica.
- Notificaciones programadas.

## 6. Modelo de navegacion recomendado

Navegacion principal:

1. Dashboard
2. Cobranza
3. Facturas
4. Clientes
5. Reportes
6. Configuracion

Regla:

- Cobranza debe estar antes que Facturas cuando la app ya tenga datos, porque es la pantalla diaria.
- Facturas es setup y mantenimiento.
- Dashboard es supervision.
- Clientes es investigacion.

## 7. Modelo de datos futuro

Tablas existentes:

- users
- clientes
- facturas
- calendario_cobranza
- promesas_pago
- pagos
- templates_mensajes
- logs_comunicacion

Tablas sugeridas:

- organizaciones
- miembros
- roles
- disputas
- archivos_importacion
- filas_importacion
- configuracion_cobranza
- links_pago
- conciliaciones
- audit_logs

## 8. Indicadores clave del producto

MVP:

- Facturas importadas.
- Saldo abierto.
- Saldo vencido.
- Contactos registrados.
- Promesas activas.
- Pagos registrados.

Producto maduro:

- DSO.
- Tasa de recuperacion.
- Tiempo promedio de pago.
- Promesas cumplidas.
- Riesgo por cliente.
- Monto recuperado por automatizacion.

## 9. Criterios de calidad UX

Antes de agregar una funcion, debe responder:

1. Que decision mejora?
2. Que accion reduce?
3. En que pantalla vive naturalmente?
4. Puede resolverse con una accion existente?
5. Se entiende sin explicacion?
6. Aporta al flujo de cobrar mas rapido?

Si no pasa estas preguntas, no entra al MVP.

## 10. Proxima implementacion recomendada

Despues del primer bloque de bandeja de cobranza:

1. Crear checklist de activacion en Dashboard.
2. Agregar vista previa del CSV antes de importar.
3. Crear ficha basica de cliente.
4. Agregar historial visible por factura.
5. Crear reporte Aging.

Este orden mejora demos, reduce confusion y fortalece el producto antes de integrar proveedores externos.
