# OrderGo — Gestión de pedidos para pequeños negocios de comida

Aplicación web construida con **React + TypeScript** (Vite) y **Supabase**

Sprint 1
(autenticación y base de datos). Este primer sprint entrega:

- **HU01 — Registro e inicio de sesión**: alta de cuenta, login, sesión persistente y rutas protegidas.
- **HU02 — Registrar clientes**: alta y consulta de clientes, con búsqueda por nombre/teléfono.

Sprint 2
(Registro de pedidos, productos y consulta de pedidos). Este segundo sprint entrega:

- **HU03 — Registrar pedidos**: alta y registro de productos, pedidos, cálculo de totales.
- **HU04 — Consulta de pedidos**: Consulta de pedidos.

Sprint 3
(Estado y pago de pedidos).
- **HU05 — Actualizar estado del pedido**: cada pedido se puede mover entre Pendiente, En preparación, Listo y Entregado desde el propio listado, con actualización en tiempo real entre pestañas/dispositivos.
- **HU06 — Registrar información de pago**: cada pedido muestra si está Pagado o con Pago pendiente y, al pagarse, el método (efectivo, tarjeta, transferencia u otro).
- **Catálogo de productos** (funcionalidad adicional, no estaba en el backlog original): pantalla dedicada para ver, agregar, editar (nombre/precio/disponibilidad) y eliminar productos.

Sprint 4
(Editar, cancelar y consultar pedidos)
- **HU07 — Editar y cancelar pedidos**: se puede cambiar el cliente, los productos (con sus instrucciones) y las notas de un pedido, y cancelarlo con confirmación. La cancelación es lógica: el pedido se conserva en el historial como "Cancelado". Los pedidos entregados o cancelados ya no se pueden editar ni cancelar.
- **HU08 — Consultar pedidos por fecha o estado**: la lista **arranca mostrando solo los pedidos de hoy** (cada vez que se abre o refresca la página). Filtros combinables por cliente (nombre o teléfono), estado, pago, método de pago y rango de fechas, con conteo de resultados y botón **Volver a hoy**. Cada método de pago tiene su propio color.

Sprint 5
- **HU09 — Panel principal**: resumen de pedidos e ingresos de **hoy, esta semana o este mes** (lunes a domingo; el corte del día es la medianoche de tu zona horaria), con pedidos por estado e ingresos por método de pago, que se actualiza en tiempo real. Un ingreso es un pedido pagado y no cancelado; los cancelados que ya estaban pagados se avisan aparte.
- **CC06 — Pruebas automatizadas**: Vitest instalado; `npm test` ejecuta las pruebas de filtros, validaciones, pagos y cálculos del panel.
- **CC07 — Método de pago obligatorio**: un solo control de pago; elegir un método implica "Pagado", y la base de datos no permite guardar un pedido pagado sin método.