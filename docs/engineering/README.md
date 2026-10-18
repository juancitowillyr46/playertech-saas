# Engineering

## Propósito

Este directorio contiene las prácticas y estándares de ingeniería utilizados para desarrollar y mantener PlayerTech.

Los documentos de esta sección complementan la arquitectura definida en:

```text
docs/architecture/
```

## Documentos

| Documento | Propósito |
|---|---|
| [coding-standards.md](./coding-standards.md) | Convenciones y estándares de código |
| [git.md](./git.md) | Estrategia de ramas, commits y control de cambios |
| [testing.md](./testing.md) | Estrategia de pruebas |
| [security.md](./security.md) | Principios y prácticas de seguridad |
| [deployment.md](./deployment.md) | Despliegue en la nube: Supabase, Vercel y verificación |

## Principios

### Simplicidad

Las soluciones deben ser proporcionales a las necesidades del MVP.

No se debe introducir complejidad técnica sin una necesidad concreta.

### Reutilización

Antes de crear una nueva implementación se debe verificar si existe una solución reutilizable en el proyecto o en las tecnologías adoptadas.

### Separación de responsabilidades

El código debe respetar las responsabilidades definidas por la arquitectura.

Las decisiones de ingeniería no deben generar acoplamiento innecesario entre:

- UI;
- lógica de aplicación;
- acceso a datos;
- infraestructura.

### Trazabilidad

Los cambios relevantes deben poder relacionarse con una necesidad funcional, técnica o arquitectónica.

Cuando corresponda:

```text
User Story
    ↓
Specification
    ↓
Plan
    ↓
Tasks
    ↓
Implementation
    ↓
Tests
```

### Calidad incremental

La calidad se construye durante el desarrollo y no únicamente al finalizar una funcionalidad.

Cada cambio debe procurar:

- código mantenible;
- pruebas adecuadas;
- documentación cuando sea necesaria;
- cambios pequeños y comprensibles.

## Relación con SDD

PlayerTech utiliza Spec-Driven Development.

Las prácticas de ingeniería definidas aquí deben aplicarse durante la implementación de las especificaciones.

La documentación funcional se encuentra en:

```text
docs/product/
docs/backlog/
```

La arquitectura se encuentra en:

```text
docs/architecture/
```

Las especificaciones de funcionalidades se encuentran en:

```text
specs/
```