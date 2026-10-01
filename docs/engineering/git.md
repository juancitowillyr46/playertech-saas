# Git Standards

## Propósito

Define las prácticas de control de versiones utilizadas en PlayerTech.

## Repositorio

El repositorio principal contiene el producto y su documentación:

```text
playertech-saas/
```

La documentación funcional, arquitectura y especificaciones forman parte del repositorio y deben mantenerse versionadas junto con el código.

## Commits

Los commits deben representar cambios coherentes y relativamente pequeños.

Preferir commits enfocados:

```text
docs: define MVP epics and user stories
```

```text
docs: add frontend architecture
```

```text
feat: implement admin login
```

```text
fix: handle invalid login credentials
```

```text
test: add player service tests
```

## Convención

Se utilizará una convención basada en Conventional Commits.

Tipos principales:

| Tipo | Uso |
|---|---|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección |
| `docs` | Documentación |
| `test` | Pruebas |
| `refactor` | Refactorización |
| `style` | Cambios de formato/estilo sin comportamiento |
| `chore` | Mantenimiento técnico |

## Ramas

Para funcionalidades se recomienda:

```text
main
  │
  └── feature/<feature-name>
```

Ejemplo:

```text
feature/admin-login
```

Para correcciones:

```text
fix/<description>
```

## Pull Requests

Cuando el proyecto evolucione hacia trabajo colaborativo, los cambios relevantes deberán integrarse mediante Pull Requests.

Una Pull Request debe permitir identificar:

- qué se modificó;
- por qué se modificó;
- qué funcionalidad afecta;
- cómo fue validado.

## Relación con SDD

Cuando el cambio provenga de una especificación:

```text
specs/001-login/
```

el commit o Pull Request debería poder relacionarse con esa especificación.

La trazabilidad esperada es:

```text
HU
 ↓
Spec
 ↓
Implementation
 ↓
Commit
```

## Regla

Evitar commits que mezclen cambios funcionales, refactorizaciones y documentación no relacionada sin una razón clara.