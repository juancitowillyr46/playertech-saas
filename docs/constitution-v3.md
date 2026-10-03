# PlayerTech Constitution

## Propósito

Esta Constitución define los principios fundamentales que gobiernan el desarrollo y evolución de PlayerTech.

Las especificaciones, decisiones arquitectónicas e implementaciones deben respetar estos principios.

Los detalles técnicos, procedimientos y estándares específicos se mantienen en la documentación especializada del proyecto.

---

## Principios Fundamentales

### I. Desarrollo guiado por especificaciones

Las funcionalidades significativas deben desarrollarse mediante un proceso de **Spec-Driven Development (SDD)**.

La especificación debe definir el comportamiento esperado antes de implementar la solución.

El flujo de desarrollo es:

```text
Historia de Usuario
        ↓
Especificación
        ↓
Plan
        ↓
Tareas
        ↓
Implementación
        ↓
Pruebas
```

Las funcionalidades menores y los refactors internos que no cambien el comportamiento pueden seguir un proceso simplificado cuando corresponda.

---

### II. Simplicidad

La solución debe implementar la complejidad necesaria para resolver las necesidades actuales del producto.

Se deben preferir:

- soluciones simples;
- librerías y patrones ya adoptados;
- abstracciones justificadas por necesidades reales.

No se debe introducir complejidad, infraestructura o abstracciones únicamente para resolver necesidades hipotéticas futuras.

---

### III. Separación de responsabilidades

La solución debe mantener separadas las responsabilidades de:

- presentación;
- lógica de aplicación;
- acceso a datos;
- infraestructura.

Las dependencias entre estas responsabilidades deben ser explícitas y controladas.

La arquitectura debe evitar que la interfaz de usuario dependa directamente de mecanismos concretos de persistencia o infraestructura.

---

### IV. Reutilización controlada

Antes de crear una nueva solución, se debe evaluar si existe una solución reutilizable dentro de:

- la arquitectura existente;
- componentes compartidos;
- librerías adoptadas;
- patrones establecidos;
- funcionalidades existentes del producto.

La reutilización debe reducir duplicación y complejidad, pero no debe justificar abstracciones prematuras o componentes genéricos sin una necesidad real.

---

### V. Base tecnológica y visual reutilizable

PlayerTech debe aprovechar las tecnologías y componentes adoptados como base del producto antes de crear soluciones equivalentes o reemplazarlos innecesariamente.

Durante el MVP:

- **SakaiNG** constituye la base de template y estructura visual de la aplicación.
- **PrimeNG** constituye la base principal de componentes de interfaz.
- **Tailwind CSS** proporciona utilidades y composición visual.
- **PlayerTech** mantiene la responsabilidad sobre el dominio, comportamiento y experiencia específica del producto.

Las personalizaciones propias de PlayerTech deben minimizar el acoplamiento innecesario con la base tecnológica adoptada.

Las demos, páginas de ejemplo, componentes de demostración y assets proporcionados por SakaiNG constituyen material de referencia para identificar patrones de interfaz, composición, componentes y capacidades disponibles en la base tecnológica.

Estos recursos no constituyen funcionalidades propias de PlayerTech y no deben modificarse directamente para implementar funcionalidades del producto.

Las funcionalidades de PlayerTech deben implementarse dentro de la estructura propia de la aplicación, reutilizando o componiendo las capacidades proporcionadas por SakaiNG, PrimeNG y Tailwind CSS cuando corresponda.

En particular, no se debe modificar innecesariamente el núcleo de SakaiNG cuando una extensión, composición o personalización externa permita alcanzar el resultado requerido.

Las actualizaciones de las tecnologías base deben evaluarse e integrarse de manera controlada, preservando las personalizaciones y funcionalidades propias de PlayerTech.

Las modificaciones de archivos pertenecientes al template solo deben realizarse cuando formen parte de una actualización o mantenimiento controlado de la base tecnológica.

---

### VI. Arquitectura evolutiva

Las decisiones arquitectónicas deben permitir que PlayerTech evolucione sin requerir reconstrucciones innecesarias.

PlayerTech utiliza un **modelo multi-tenant desde el MVP**, donde cada academia representa un tenant y el aislamiento de sus datos forma parte de la arquitectura desde el inicio.

La arquitectura debe mantener separadas las siguientes responsabilidades:

- identidad del usuario;
- pertenencia del usuario a una academia;
- identidad de la academia como tenant;
- datos pertenecientes a cada academia;
- mecanismos de autenticación y autorización.

La identidad del usuario y la identidad del tenant son conceptos distintos y no deben tratarse como equivalentes.

La implementación del modelo multi-tenant debe permitir evolucionar posteriormente hacia:

- múltiples usuarios por academia;
- múltiples roles y permisos;
- administración centralizada de academias;
- APIs y servicios propios;
- backend propio;
- soporte para múltiples disciplinas deportivas;
- nuevas capacidades de plataforma.

El aislamiento de los datos entre tenants debe considerarse un requisito arquitectónico desde el MVP.

Las necesidades futuras deben considerarse en las decisiones arquitectónicas, pero no deben convertirse prematuramente en funcionalidades del producto.

La implementación actual puede utilizar servicios administrados o tecnologías específicas del MVP siempre que su acoplamiento pueda mantenerse controlado y no comprometa la evolución de la arquitectura.

---

### VII. Trazabilidad

Las decisiones de desarrollo deben mantener una relación verificable entre:

```text
Producto
   ↓
Historia de Usuario
   ↓
Especificación
   ↓
Arquitectura
   ↓
Implementación
   ↓
Pruebas
```

Cada nivel debe complementar al anterior sin duplicarlo innecesariamente.

La trazabilidad debe permitir comprender por qué existe una funcionalidad, cómo fue diseñada, cómo fue implementada y cómo se verificó.

---

### VIII. Seguridad y control de acceso

La seguridad debe formar parte del diseño de las funcionalidades y no depender exclusivamente de la interfaz de usuario.

La autenticación, autorización y protección de datos deben implementarse utilizando los mecanismos de seguridad proporcionados por la arquitectura adoptada.

El aislamiento de datos entre tenants debe estar respaldado por mecanismos de autorización y seguridad apropiados y no depender únicamente de filtros o validaciones realizadas en el frontend.

Las validaciones de seguridad y de negocio que protegen los datos no deben depender únicamente de validaciones realizadas en el frontend.

Las credenciales, secretos y mecanismos privilegiados no deben exponerse en el código cliente.

Los detalles específicos de autenticación, autorización, RLS y protección de datos se mantienen en la documentación de arquitectura y seguridad.

---

### IX. Calidad verificable

La calidad debe evaluarse principalmente mediante comportamiento verificable.

Las funcionalidades deben contar con:

- criterios de aceptación claros;
- pruebas apropiadas para su nivel de riesgo;
- validación de los principales flujos de negocio.

El nivel y tipo de pruebas debe ser proporcional a la criticidad de la funcionalidad.

No se debe considerar terminada una funcionalidad significativa cuando sus criterios de aceptación no puedan ser verificados.

---

### X. Documentación como fuente de conocimiento

Cada tipo de conocimiento debe mantenerse en la documentación que le corresponde.

- **Constitución:** principios fundamentales.
- **Documentación de arquitectura:** decisiones y estructura técnica.
- **Documentación de ingeniería:** prácticas y estándares de desarrollo.
- **Documentación de producto:** visión, alcance y evolución.
- **Backlog:** épicas e historias de usuario.
- **Specs:** comportamiento y alcance de funcionalidades.

Se debe evitar la duplicación innecesaria de información y mantener una única fuente de verdad para cada concepto.

---

### XI. Convención de Spec-Driven Development y GitHub Spec Kit

PlayerTech utiliza GitHub Spec Kit como herramienta para materializar el proceso SDD.

Las especificaciones de funcionalidades deben mantener una estructura consistente que permita distinguir:

```text
spec.md  → QUÉ debe hacer el sistema
plan.md  → CÓMO se implementará
tasks.md → QUÉ trabajo debe realizarse
```

Las especificaciones deben mantener trazabilidad hacia su Historia de Usuario y sus criterios de aceptación.

Los planes técnicos deben reflejar las decisiones arquitectónicas aplicables.

Las tareas deben representar trabajo concreto y verificable.

La estructura detallada y el uso operativo de GitHub Spec Kit se mantienen en la documentación de ingeniería correspondiente.

---

### XII. Excepciones controladas

Cuando una implementación necesite apartarse de un principio de esta Constitución, la excepción debe estar explícitamente justificada y documentada.

La excepción debe indicar, cuando corresponda:

- principio afectado;
- motivo;
- alcance;
- referencia al cambio o decisión;
- condición o fecha de revisión, si es temporal.

Una excepción no modifica automáticamente la Constitución.

Si una excepción se convierte en una práctica permanente, debe evaluarse si corresponde actualizar la Constitución o la documentación de arquitectura o ingeniería.

---

## Documentación relacionada

Los detalles de implementación y las prácticas específicas se encuentran en:

- `docs/architecture/` — arquitectura y decisiones estructurales.
- `docs/engineering/` — prácticas y estándares de desarrollo.
- `docs/product/` — visión, alcance y evolución del producto.
- `docs/backlog/` — épicas e historias de usuario.
- `specs/` — especificaciones de funcionalidades.
- `.specify/memory/` — memoria y reglas utilizadas por GitHub Spec Kit.