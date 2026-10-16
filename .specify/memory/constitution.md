# PlayerTech Constitution

## Core Principles

### I. Desarrollo guiado por especificaciones

Las funcionalidades y los trabajos técnicos significativos DEBEN seguir Spec-Driven Development. Una
especificación DEBE originarse en una **Historia de Usuario** o en un **Habilitador técnico (T-xx)**:
trabajo técnico necesario que no entrega funcionalidad visible al usuario final y que se define con
criterios de aceptación técnicos. El flujo es: HU o habilitador → Especificación → Plan → Tareas →
Implementación → Pruebas. La especificación DEBE definir el comportamiento esperado antes de
implementar. Las funcionalidades menores y los refactors sin cambio de comportamiento PUEDEN usar un
proceso simplificado.

*Razón: el comportamiento acordado antes de construir reduce retrabajo y hace verificable el resultado.*

### II. Simplicidad

La solución DEBE implementar solo la complejidad necesaria para las necesidades actuales. Se DEBEN
preferir soluciones simples, librerías y patrones ya adoptados, y abstracciones justificadas por una
necesidad real. NO DEBE introducirse infraestructura, complejidad o abstracciones para escenarios
hipotéticos.

### III. Separación de responsabilidades

Presentación, lógica de aplicación, acceso a datos e infraestructura DEBEN permanecer separadas, con
dependencias explícitas y controladas. La interfaz de usuario NO DEBE depender directamente de
mecanismos concretos de persistencia o infraestructura.

### IV. Reutilización controlada

Antes de crear una solución se DEBEN evaluar la arquitectura, los componentes compartidos, las
librerías, los patrones y las funcionalidades existentes. La reutilización DEBE reducir duplicación y
complejidad, y NO DEBE justificar abstracciones prematuras ni componentes genéricos sin necesidad real.

### V. Base tecnológica y visual reutilizable

Durante el MVP, **SakaiNG** es la base de layout y estructura visual; **PrimeNG**, la base de
componentes de interfaz; y **Tailwind CSS**, la base de utilidades y composición. PlayerTech conserva
la responsabilidad sobre su dominio, comportamiento y experiencia.

- El **layout de SakaiNG adoptado** es código propio de PlayerTech y PUEDE modificarse con cambios
  mínimos y controlados para representar la marca y la navegación del producto.
- Las **demos, páginas, componentes y assets de ejemplo** de SakaiNG son material de referencia y NO
  DEBEN modificarse para implementar funcionalidades de PlayerTech.
- La personalización visual DEBE realizarse mediante los tokens del tema de PrimeNG, utilidades de
  Tailwind CSS y los componentes del layout adoptado. NO DEBEN sobrescribirse estilos internos de
  PrimeNG.
- Las actualizaciones de la base tecnológica DEBEN integrarse de forma controlada, preservando las
  personalizaciones de PlayerTech.

*Razón: aprovechar la base adoptada sin quedar atado a su aspecto ni a sus demos.*

### VI. Arquitectura evolutiva multi-tenant

PlayerTech es multi-tenant desde el MVP: cada academia es un tenant y el aislamiento de sus datos es
un requisito arquitectónico inicial. La identidad de usuario, la pertenencia a la academia, la
identidad de la academia como tenant, los datos de la academia y los mecanismos de autenticación y
autorización DEBEN permanecer separados; la identidad de usuario y la de tenant NO DEBEN tratarse como
equivalentes. La arquitectura DEBE permitir evolucionar hacia múltiples usuarios por academia, roles,
administración centralizada, APIs, backend propio y soporte multideportivo, sin convertir
prematuramente esas capacidades en funcionalidades del MVP. La implementación actual PUEDE utilizar
servicios administrados o tecnologías específicas del MVP siempre que su acoplamiento se mantenga
controlado y no comprometa la evolución de la arquitectura.

### VII. Trazabilidad

Cada decisión de desarrollo DEBE poder relacionarse con Producto → HU o habilitador → Especificación →
Arquitectura → Implementación → Pruebas. Cada nivel DEBE complementar al anterior sin duplicación
innecesaria y permitir comprender por qué existe una funcionalidad, cómo se diseñó, implementó y
verificó.

### VIII. Seguridad y control de acceso

La seguridad DEBE formar parte del diseño y NO DEBE depender exclusivamente de la interfaz. La
autenticación, la autorización y la protección de datos DEBEN usar los mecanismos de la arquitectura
adoptada. El aislamiento entre tenants DEBE estar respaldado por mecanismos de autorización y
seguridad, no solo por filtros o validaciones del frontend. Las validaciones de seguridad y de negocio
que protegen los datos NO DEBEN depender únicamente de validaciones del frontend. Las credenciales,
los secretos y los mecanismos privilegiados NO DEBEN exponerse en el código cliente.

### IX. Calidad verificable

Las funcionalidades DEBEN tener criterios de aceptación claros, pruebas proporcionales a su riesgo y
validación de los principales flujos de negocio. Una funcionalidad significativa NO DEBE considerarse
terminada si sus criterios de aceptación no pueden verificarse.

### X. Documentación como fuente de conocimiento

Cada tipo de conocimiento DEBE mantenerse en su documentación correspondiente, con una única fuente de
verdad por concepto:

| Fuente | Contenido |
|---|---|
| `.specify/memory/constitution.md` | Principios (fuente única; `docs/constitution.md` es una puerta de entrada que la enlaza) |
| `docs/architecture/` | Decisiones (ADR) y estructura técnica |
| `docs/engineering/` | Prácticas y estándares de desarrollo |
| `docs/product/` | Visión, alcance y evolución |
| `docs/backlog/` | Épicas, historias de usuario y habilitadores técnicos |
| `specs/` | Especificaciones, planes y tareas de cada funcionalidad |
| `PRODUCT.md` y `DESIGN.md` | Brief de producto y marca; sistema visual |
| `CLAUDE.md` | Guía operativa para agentes; NO DEBE establecer principios |
| `docs/archive/` | Artefactos obsoletos; no son fuente de verdad |

Se DEBE evitar la duplicación: un documento DEBE enlazar a la fuente correspondiente en lugar de
repetirla.

### XI. Convención de Spec-Driven Development y GitHub Spec Kit

PlayerTech DEBE usar GitHub Spec Kit para materializar SDD. Cada funcionalidad DEBE distinguir
`spec.md` (qué debe hacer), `plan.md` (cómo se implementará) y `tasks.md` (trabajo concreto). Las
specs DEBEN ser trazables a su HU o habilitador y a sus criterios de aceptación; una spec PUEDE cubrir
una o varias HU de la misma épica y DEBE referenciar sus criterios de aceptación en lugar de copiarlos.
Los planes técnicos DEBEN reflejar las decisiones arquitectónicas aplicables. Las tareas DEBEN
representar trabajo concreto y verificable.

### XII. Excepciones controladas

Una excepción DEBE justificarse y documentarse con el principio afectado, el motivo, el alcance, la
referencia al cambio o decisión y la condición o fecha de revisión si es temporal. Una excepción NO
DEBE modificar automáticamente la Constitución. Si se vuelve permanente, DEBE evaluarse una enmienda a
la Constitución o a la documentación aplicable.

### XIII. Experiencia de usuario

La experiencia de usuario y la calidad visual son requisitos del producto, no un acabado opcional.

- Las interfaces DEBEN diseñarse primero para móvil: el usuario principal (owner de una academia)
  trabaja desde el celular.
- Las interfaces DEBEN cumplir criterios de accesibilidad: contraste, foco de teclado visible,
  etiquetas en los formularios y áreas táctiles adecuadas.
- Las interfaces DEBEN ser consistentes mediante un sistema de diseño propio construido sobre la base
  tecnológica adoptada (principio V).
- Los textos DEBEN ser claros y en el lenguaje del usuario.
- Una pantalla significativa NO DEBE considerarse terminada sin una revisión de experiencia y
  accesibilidad.

Este principio NO DEBE usarse para justificar componentes propios que reemplacen innecesariamente a
PrimeNG.

*Razón: la adopción del producto depende de que el owner pueda usarlo con facilidad y confianza.*

## Restricciones adicionales

Los detalles técnicos de autenticación, autorización, RLS, protección de datos, procedimientos y
estándares específicos se mantienen en `docs/architecture/` y `docs/engineering/`. Las necesidades
futuras PUEDEN orientar decisiones arquitectónicas, pero NO DEBEN convertirse en funcionalidades del
producto sin una necesidad validada.

## Flujo de desarrollo

Antes de implementar un trabajo significativo, el equipo DEBE contar con una HU o un habilitador
técnico en estado *Definida*, una especificación, un plan técnico y tareas verificables. Los planes
DEBEN respetar esta Constitución, la arquitectura y los estándares de ingeniería. Las pruebas DEBEN
validar el comportamiento acordado, incluido el aislamiento entre tenants cuando aplique. Las
pantallas significativas DEBEN pasar la revisión de experiencia y accesibilidad del principio XIII.

## Governance

Esta Constitución prevalece sobre prácticas informales y guía las especificaciones, las decisiones
arquitectónicas y las implementaciones. Las enmiendas DEBEN documentar su motivo, impacto y los cambios
requeridos en la documentación dependiente. La versión sigue Semantic Versioning: MAJOR para
redefiniciones incompatibles o eliminación de principios, MINOR para principios nuevos o guía ampliada
de forma material, y PATCH para aclaraciones no semánticas. Las revisiones de specs, planes, tareas y
cambios relevantes DEBEN verificar el cumplimiento y documentar las excepciones aprobadas
(principio XII).

**Version**: 3.1.0 | **Ratified**: 2026-10-03 | **Last Amended**: 2026-10-16
