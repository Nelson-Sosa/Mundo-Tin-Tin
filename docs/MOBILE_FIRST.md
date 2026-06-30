# Prompt Profesional — Arquitectura Responsive Mobile First

## Sistema: Mundo TIN-TIN

A partir de este momento, todo el sistema Mundo TIN-TIN debe desarrollarse siguiendo una arquitectura **Mobile First**, priorizando la experiencia de uso en teléfonos móviles y tablets.

---

## Contexto

La propietaria del negocio utilizará el sistema principalmente desde:

- **Smartphones Android** — uso diario
- **Tablets Android** — uso frecuente
- **Computadora** — ocasionalmente

Por lo tanto, la experiencia móvil tiene prioridad sobre la experiencia de escritorio.

---

## Objetivo

Todo componente nuevo debe diseñarse **primero para pantallas pequeñas** y luego adaptarse progresivamente a tablets y escritorio.

**No desarrollar interfaces pensadas primero para desktop.**

---

## Prioridad de diseño

1. **Smartphone** — máxima prioridad
2. **Tablet** — máxima prioridad
3. **Desktop** — adaptación responsive

---

## Dashboard

El Dashboard de administración debe optimizarse para **dispositivos táctiles**.

### Sidebar

| Dispositivo | Comportamiento |
|-------------|---------------|
| Escritorio | Sidebar lateral fijo |
| Tablet | Sidebar colapsable |
| Móvil | Drawer lateral deslizable (off-canvas) |

> Nunca mantener un sidebar fijo ocupando espacio en pantallas pequeñas.

### Navegación

- Utilizar una navegación táctil.
- Los botones deben tener un área táctil cómoda: **mínimo 44 × 44 px** (recomendaciones de accesibilidad).
- La navegación debe poder utilizarse completamente con **una sola mano** en teléfonos.

---

## Formularios

Todos los formularios deben ser **Mobile First**:

- Inputs grandes
- Botones de ancho completo cuando corresponda
- Espaciado cómodo entre controles
- Teclado adecuado según el tipo de dato (email, número, teléfono)

---

## Tablas

- **Evitar tablas tradicionales en móviles.**
- Cuando la información no quepa correctamente en una pantalla pequeña:
  - Convertir filas en **tarjetas (cards)**
  - Permitir una **vista optimizada para móviles**
- Las tablas grandes solo deben mostrarse en escritorio cuando aporten una mejor experiencia.

---

## CRUD

Todas las pantallas de:
- Productos
- Categorías
- Inventario
- Clientes
- Ventas

Deben ser **completamente utilizables desde un celular** sin necesidad de hacer zoom.

---

## Diseño Responsive

- Utilizar **breakpoints consistentes**.
- Los componentes deben adaptarse automáticamente a:
  - Móviles
  - Tablets
  - Escritorio
- **Sin duplicar componentes.**

---

## Rendimiento

Optimizar la aplicación para dispositivos móviles. **Evitar:**

- Animaciones pesadas
- Renders innecesarios
- Componentes excesivamente grandes

---

## Experiencia de Usuario

La interfaz debe sentirse como una **aplicación moderna**. Priorizar:

- Rapidez
- Simplicidad
- Botones grandes
- Navegación intuitiva
- Excelente experiencia táctil

---

## Arquitectura

- Los componentes deben ser **reutilizables y adaptables**.
- **No crear versiones separadas** para móvil y escritorio.
- Utilizar un **único componente responsive**.

---

## Recomendaciones adicionales

Como el sistema será usado principalmente en tablets y celulares, replantear ciertos módulos:

| Módulo | Enfoque recomendado |
|--------|-------------------|
| **Dashboard** | Tarjetas grandes con indicadores clave y accesos rápidos, en lugar de muchos gráficos. |
| **Productos** | Vista por tarjetas con búsqueda y filtros, reservando la tabla para escritorio si hace falta. |
| **Ventas** | Interfaz tipo POS con botones grandes y pocos toques para completar una venta. |
| **Inventario** | Acciones rápidas de "Entrada", "Salida" y "Ajuste" desde cada producto, sin navegar entre muchas pantallas. |

---

## Objetivo final

Desarrollar un sistema de gestión moderno, **completamente responsive y Mobile First**, optimizado para uso diario en smartphones y tablets, manteniendo una experiencia consistente en escritorio y preparado para crecer con los módulos de Productos, Inventario, Ventas, Clientes, Gastos y Reportes.
