<!--
Sync Impact Report
- Version change: scaffold → 3.0.0
- Modified principles: scaffold placeholders → I–XII PlayerTech principles
- Added sections: Additional Constraints, Development Workflow, Governance
- Removed sections: none
- Follow-up TODOs: none
-->

# PlayerTech Constitution

## Core Principles

### I. Desarrollo guiado por especificaciones

Las funcionalidades significativas MUST seguir Spec-Driven Development: Historia de Usuario →
Especificación → Plan → Tareas → Implementación → Pruebas. La especificación MUST definir el
comportamiento esperado antes de implementar. Funcionalidades menores y refactors sin cambio de
comportamiento MAY usar un proceso simplificado cuando corresponda.

### II. Simplicidad

La solución MUST implementar solo la complejidad necesaria para las necesidades actuales. Se MUST
preferir soluciones simples, librerías y patrones adoptados, y abstracciones justificadas por una
necesidad real. No se MUST introducir infraestructura, complejidad o abstracciones para escenarios
hipotéticos.

### III. Separación de responsabilidades

Presentación, lógica de aplicación, acceso a datos e infraestructura MUST permanecer separadas.
Sus dependencias MUST ser explícitas y controladas. La interfaz de usuario MUST NOT depender
directamente de mecanismos concretos de persistencia o infraestructura.

### IV. Reutilización controlada

Antes de crear una solución, se MUST evaluar la arquitectura, componentes compartidos, librerías,
patrones y funcionalidades existentes. La reutilización MUST reducir duplicación y complejidad;
MUST NOT justificar abstracciones prematuras ni componentes genéricos sin necesidad real.

### V. Base tecnológica y visual reutilizable

Durante el MVP, SakaiNG MUST ser la base de template y estructura visual; PrimeNG, la base de
componentes de interfaz; y Tailwind CSS, la base de utilidades y composición. PlayerTech conserva
la responsabilidad sobre su dominio, comportamiento y experiencia específica. Las demos, páginas,
componentes y assets de SakaiNG son material de referencia, no funcionalidades de PlayerTech, y
MUST NOT modificarse directamente para implementar producto. Las personalizaciones MUST minimizar
el acoplamiento con la base tecnológica y las modificaciones del template solo MAY realizarse como
parte de una actualización o mantenimiento controlado.

### VI. Arquitectura evolutiva multi-tenant

PlayerTech utiliza un modelo multi-tenant desde el MVP: cada academia es un tenant y el
aislamiento de sus datos es un requisito arquitectónico inicial. Identidad de usuario, pertenencia a
academia, identidad de academia como tenant, datos de academia y mecanismos de autenticación y
autorización MUST permanecer separados. La identidad de usuario y la de tenant MUST NOT tratarse
como equivalentes. La arquitectura MUST permitir evolucionar hacia múltiples usuarios por academia,
roles, administración centralizada, APIs, backend propio y soporte multideportivo sin convertir
prematuramente esas capacidades en funcionalidades del MVP.

### VII. Trazabilidad

Cada decisión de desarrollo MUST poder relacionarse con Producto → Historia de Usuario →
Especificación → Arquitectura → Implementación → Pruebas. Cada nivel MUST complementar al anterior
sin duplicación innecesaria y permitir comprender por qué existe una funcionalidad, cómo se diseñó,
implementó y verificó.

### VIII. Seguridad y control de acceso

La seguridad MUST formar parte del diseño y MUST NOT depender exclusivamente de la interfaz. La
autenticación, autorización y protección de datos MUST usar los mecanismos de la arquitectura
adoptada. El aislamiento entre tenants MUST estar respaldado por mecanismos de autorización y
seguridad, no solo por filtros o validaciones frontend. Credenciales, secretos y mecanismos
privilegiados MUST NOT exponerse en el código cliente.

### IX. Calidad verificable

Las funcionalidades MUST tener criterios de aceptación claros, pruebas proporcionales a su riesgo y
validación de los principales flujos de negocio. Una funcionalidad significativa MUST NOT
considerarse terminada si sus criterios de aceptación no pueden verificarse.

### X. Documentación como fuente de conocimiento

Cada tipo de conocimiento MUST mantenerse en su documentación correspondiente: Constitución para
principios; arquitectura para decisiones y estructura técnica; ingeniería para prácticas; producto
para visión, alcance y evolución; backlog para épicas e historias; y specs para funcionalidades. Se
MUST evitar la duplicación innecesaria y mantener una única fuente de verdad por concepto.

### XI. Convención de Spec-Driven Development y GitHub Spec Kit

PlayerTech MUST usar GitHub Spec Kit para materializar SDD. Cada funcionalidad debe distinguir
`spec.md` (qué debe hacer), `plan.md` (cómo se implementará) y `tasks.md` (trabajo concreto).
Las specs MUST ser trazables a su Historia de Usuario y criterios de aceptación; los planes técnicos deben reflejar las decisiones arquitectónicas aplicables.

### XII. Excepciones controladas

Una excepción MUST justificarse y documentarse con el principio afectado, motivo, alcance,
referencia al cambio o decisión y condición o fecha de revisión si es temporal. Una excepción MUST
NOT modificar automáticamente la Constitución. Si se vuelve permanente, MUST evaluarse una
enmienda a la Constitución o a la documentación aplicable.

## Additional Constraints

Los detalles técnicos de autenticación, autorización, RLS, protección de datos, procedimientos y
estándares específicos se mantienen en `docs/architecture/` y `docs/engineering/`. Las necesidades
futuras MAY orientar decisiones arquitectónicas, pero MUST NOT convertirse en funcionalidades del
producto sin una necesidad validada.

## Development Workflow

Antes de implementar una funcionalidad significativa, el equipo MUST contar con una Historia de
Usuario, especificación, plan técnico y tareas verificables. Los planes MUST respetar esta
Constitución, la arquitectura y los estándares de ingeniería. Las pruebas MUST validar el
comportamiento acordado, incluido el aislamiento entre tenants cuando aplique.

## Governance

Esta Constitución prevalece sobre prácticas informales y guía las especificaciones, decisiones
arquitectónicas e implementaciones. Las enmiendas MUST documentar su motivo, impacto y cambios
requeridos en documentación dependiente. La versión sigue Semantic Versioning: MAJOR para
redefiniciones incompatibles de principios, MINOR para principios o guía material nueva y PATCH
para aclaraciones no semánticas. Las revisiones de specs, planes, tareas y cambios relevantes MUST
verificar cumplimiento y documentar excepciones aprobadas.

**Version**: 3.0.0 | **Ratified**: 2024-10-03 | **Last Amended**: 2026-10-03
