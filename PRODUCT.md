# Product

<!-- impeccable:product-schema 1 -->

> Brief de producto y marca de PlayerTech para Impeccable (T-01, spec 003). La visión completa está en [`docs/product/vision.md`](docs/product/vision.md) y el alcance del MVP, en [`docs/product/scope.md`](docs/product/scope.md); este documento no los repite. El sistema visual vive en `DESIGN.md`.

## Platform

web

## Users

- **Usuario principal: owner de una academia deportiva pequeña en Colombia** (inicialmente de fútbol). Es quien registra la academia y la administra. Nivel técnico medio (6 de 10).
- **Su trabajo:** mantener al día la información de la academia (datos, sedes y, en la Fase 2, jugadores, acudientes, grupos, actividades y convocatorias) sin depender de cuadernos, hojas de cálculo ni grupos de WhatsApp.
- **Su situación de uso** (confirmada por el responsable de producto el 2026-10-17):
  - desde el **celular**, sobre todo, de gama media o baja y con **datos móviles limitados**;
  - **al aire libre, en la cancha**: con sol directo, de pie y a veces con una sola mano;
  - también **en la oficina o en casa**, con más tiempo, a veces desde un computador.
- Otros roles (coordinadores, profesores, acudientes, jugadores) llegarán después; hoy no son usuarios del producto.

## Product Purpose

Centralizar la información y digitalizar los procesos operativos y administrativos de una academia deportiva, para que la operación no dependa de una sola persona ni de herramientas dispersas. El éxito de la Fase 1 es que una academia se registre sola, su owner acceda y mantenga la información base de la academia, aislada de las demás.

## Positioning

**Todo en un solo lugar.** PlayerTech reúne en un único sitio, y con acceso según el rol, la información que hoy está repartida entre cuadernos, hojas de cálculo, grupos de WhatsApp y la memoria de una persona. Una hoja de cálculo no da ese orden ni la colaboración entre roles, y un grupo de WhatsApp no conserva la información de forma consultable.

## Operating Context

- El owner alterna la gestión de la academia con su trabajo en la cancha: consultas rápidas y cortas desde el celular, y tareas más largas (registrar datos, revisar listados) desde casa u oficina.
- Hoy la operación vive en cuadernos, hojas de cálculo y grupos de WhatsApp. PlayerTech los reemplaza poco a poco.
- Correos de la plataforma: confirmación de cuenta y recuperación de contraseña, leídos casi siempre en el celular.

## Capabilities and Constraints

- **Fase 1 (actual):** registro autoservicio de la academia y su owner, verificación de correo, inicio y cierre de sesión, recuperación de contraseña, perfil de la academia y sedes. Plan Free sin límites; no hay cobro.
- **Fase 2 (pendiente de ideación):** jugadores, acudientes, grupos, actividades, convocatorias y respuestas.
- **Multi-tenant:** cada academia es un tenant aislado; nunca se muestran datos de otra academia.
- **Base tecnológica fija:** Angular, PrimeNG, layout de SakaiNG adoptado y Tailwind CSS (ADR-015). La identidad se construye **sobre** esa base, sin componentes que sustituyan a PrimeNG.
- **Idioma:** interfaz en español de Colombia, con el vocabulario de [`docs/product/glossary.md`](docs/product/glossary.md) (academia, owner, sede, sede principal, acudiente…).
- **Rendimiento:** por el uso con datos limitados en celulares de gama media, las pantallas deben cargar ligeras y funcionar aunque un recurso (por ejemplo, la tipografía) no llegue.
- **Decisiones abiertas:** logo definitivo, dominio propio y textos legales definitivos (antes del piloto, `docs/product/roadmap.md`).

## Brand Commitments

- **Nombre:** PlayerTech. Mientras no haya logo, la marca es tipográfica.
- **Personalidad** (brief de T-01): deportivo, confiable, cercano, moderno, enérgico, profesional y sencillo.
- **Voz:** **tuteo** ("Inicia sesión", "Revisa tu correo"), cercana y directa, sin tecnicismos ni jerga de software; mensajes de error que dicen qué pasó y qué hacer.
- Las referencias y restricciones visuales del brief están en [`docs/backlog/enablers/T-01-design-system.md`](docs/backlog/enablers/T-01-design-system.md); la paleta está abierta (el azul actual es solo un punto de partida).

## Evidence on Hand

- No hay clientes, testimonios, cifras ni casos reales todavía: el producto no ha tenido piloto. **No se deben inventar.**
- No hay logo, ilustraciones ni fotografía propias.
- Datos de prueba locales: academias A y B del seed (`supabase/seed.sql`), sin datos reales.

## Product Principles

1. **Un solo lugar:** cada dato de la academia tiene un sitio claro y se encuentra rápido.
2. **Pensado para la cancha:** lo frecuente se hace en el celular, con una mano y bajo el sol; lo largo puede esperar al computador.
3. **Simple antes que completo:** la tecnología quita trabajo al owner, no lo añade.
4. **Confianza:** el owner siempre sabe qué pasó con lo que hizo y sus datos están protegidos y aislados.
5. **Cercanía:** habla como una persona de la academia, en su idioma y con su vocabulario.

## Accessibility & Inclusion

- WCAG 2.1 AA como mínimo, en modo claro y oscuro (principio XIII de la Constitución).
- **Contraste alto y controles grandes** (áreas táctiles de al menos 44 px) por el uso al aire libre y con una mano.
- Etiquetas visibles en los formularios, foco de teclado visible y respeto por la preferencia de movimiento reducido.
- Textos de 16 px o más en los campos de formulario en el celular.

---

**Estado:** aprobado por el responsable de producto el 2026-10-17 (T019, CA-001 de T-01).
