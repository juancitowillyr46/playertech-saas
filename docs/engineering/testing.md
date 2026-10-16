# Testing

## Propósito

Define la estrategia general de pruebas para PlayerTech.

El objetivo es validar tanto el comportamiento funcional definido por las User Stories como la calidad técnica de la implementación.

## Principio

Las pruebas deben derivarse principalmente de:

- User Stories;
- Acceptance Criteria;
- reglas de negocio;
- comportamiento técnico relevante.

## Niveles de prueba

### Unit Tests

Validan unidades pequeñas de código de forma aislada.

Se utilizarán principalmente para:

- servicios;
- lógica de aplicación;
- transformaciones;
- reglas de negocio.

Ejemplo:

```text
PlayerService
    ↓
Unit Test
```

### Component Tests

Validan el comportamiento de componentes importantes de la interfaz.

Ejemplos:

- formularios;
- estados de carga;
- validaciones;
- interacción del usuario;
- mensajes de error.

### Integration Tests

Validan la interacción entre componentes técnicos.

Ejemplos:

```text
Service
   ↓
Repository
   ↓
Supabase
```

Cuando una integración real sea costosa o innecesaria para una prueba específica, se podrán utilizar mocks o dobles de prueba.

### End-to-End

Las pruebas E2E validan flujos completos desde la perspectiva del usuario.

Ejemplo:

```text
Login
 ↓
Players
 ↓
Create Player
 ↓
Player appears in list
```

No todos los escenarios requieren E2E.

### Database Tests

Validan la seguridad y las reglas que se aplican en PostgreSQL: políticas RLS, aislamiento entre academias, restricciones y funciones como el registro atómico.

En una aplicación de una sola página, ninguna prueba de frontend demuestra que los datos estén protegidos, porque el frontend puede omitirse. **El aislamiento entre academias solo se demuestra con pruebas de base de datos.**

## Herramientas y prioridad

```text
            ▲  E2E (pocas)           Playwright — flujos completos en navegador
           ╱ ╲
          ╱   ╲ Componentes          Vitest — formularios, validaciones, estados
         ╱─────╲
        ╱       ╲ Unitarias          Vitest — services, guards, mapeo de errores
       ╱─────────╲
      ╱  Base de   ╲                 pgTAP — RLS, aislamiento A/B, registro atómico
     ╱    datos     ╲
    ╱───────────────╲
```

| Nivel | Herramienta | Cuándo |
|---|---|---|
| Base de datos | **pgTAP**, mediante `supabase test db` | Desde la Fase 1 (obligatorio en T-00) |
| Unitarias | **Vitest** | Desde la Fase 1 |
| Componentes | **Vitest** + Angular Testing Library | Desde la Fase 1 |
| End-to-End | **Playwright** | Cuando exista el flujo completo de negocio (Fase 2) |

Vitest sustituye a Karma, que está deprecado y es considerablemente más lento. Angular 21 soporta Vitest de forma oficial.

## Relación con Acceptance Criteria

Cada Acceptance Criterion relevante debe poder validarse mediante una prueba o validación correspondiente.

Ejemplo:

```text
HU-001
"El administrador puede iniciar sesión
con credenciales válidas."

        ↓

Test

Given credentials valid
When administrator submits login
Then application grants access
```

## MVP

Para el MVP se priorizarán pruebas sobre:

- autenticación;
- creación y consulta de jugadores;
- actividades;
- convocatorias;
- respuestas;
- reglas de negocio críticas.
- aislamiento entre academias y acceso no autorizado a datos de otro tenant.

Para cada entidad protegida por tenant, las pruebas de integración o de RLS deben verificar, como mínimo, que un usuario con membresía en la Academia A puede acceder a sus datos y no puede acceder ni modificar los de la Academia B.

## Calidad

Una funcionalidad no se considera técnicamente completa únicamente porque la interfaz funcione.

Debe considerarse también:

- comportamiento esperado;
- errores;
- validaciones;
- casos límite relevantes;
- regresiones.

## Principio

> Las pruebas deben proteger el comportamiento del producto, no solamente la implementación actual.
