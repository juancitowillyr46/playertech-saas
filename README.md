# PlayerTech SaaS

Plataforma SaaS para la gestión de academias de fútbol.

El proyecto se desarrolla bajo un enfoque **Spec-Driven Development (SDD)**, manteniendo separadas las definiciones funcionales, decisiones técnicas y tareas de implementación.

## Estado actual

**MVP v1 — Frontend**

Las historias de usuario del MVP v1 ya se encuentran definidas. La implementación actual está enfocada principalmente en el frontend.

### Stack actual

- Angular
- TypeScript
- PrimeNG
- SakaiNG
- Tailwind CSS
- Supabase — utilizado actualmente como solución temporal para acelerar el MVP

### Evolución prevista

El frontend deberá mantenerse desacoplado de Supabase para permitir posteriormente su integración con:

**Angular → Symfony API → MySQL**

sin requerir un rediseño de la aplicación.

## Estructura del proyecto

```text
playertech-saas/
├── frontend/              # Aplicación Angular
├── backend/               # Backend Symfony (futuro)
├── docs/                  # Documentación general del proyecto
│   ├── product/           # Visión, glosario y roadmap
│   ├── backlog/           # Épicas e historias de usuario
│   ├── architecture/      # Arquitectura del sistema
│   └── engineering/       # Estándares y prácticas de desarrollo
├── specs/                 # Especificaciones SDD por funcionalidad
├── .specify/              # Configuración y memoria de Spec Kit
└── README.md
```

## Documentación

| Ruta | Contenido |
|---|---|
| `docs/product/` | Definición general del producto |
| `docs/backlog/` | Épicas e historias de usuario |
| `docs/architecture/` | Arquitectura y decisiones técnicas |
| `docs/engineering/` | Estándares de desarrollo |
| `specs/` | Especificaciones, planes y tareas por funcionalidad |
| `.specify/` | Configuración de Spec-Driven Development |

## Desarrollo

Instalar dependencias:

```bash
cd frontend
npm install
```

Ejecutar el frontend:

```bash
npx ng serve
```

La aplicación estará disponible normalmente en:

```text
http://localhost:4200
```

## Enfoque

PlayerTech se construye de forma incremental: primero se valida el **MVP v1**, manteniendo una base técnica que permita evolucionar posteriormente hacia una plataforma SaaS completa.

> **Build the MVP. Keep the architecture ready for what comes next.**