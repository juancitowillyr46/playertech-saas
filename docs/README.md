# Documentación

Esta carpeta contiene la documentación funcional, técnica y de ingeniería del proyecto **PlayerTech SaaS**.

La documentación se organiza por responsabilidad para mantener separadas las definiciones del producto, la arquitectura y las prácticas de desarrollo.

## Estructura

```text
docs/
├── product/          # Definición y contexto del producto
├── backlog/          # Épicas e historias de usuario
├── architecture/     # Arquitectura y decisiones técnicas
├── engineering/      # Estándares y prácticas de desarrollo
└── README.md
```

### `product/`

Documentación relacionada con el producto:

- Visión del producto
- Alcance
- Glosario
- Roadmap

### `backlog/`

Documentación del backlog funcional:

- Épicas
- Historias de usuario
- Relaciones entre épicas e historias

### `architecture/`

Documentación de la arquitectura técnica:

- Arquitectura general
- Frontend
- Backend
- Infraestructura
- Decisiones arquitectónicas

### `engineering/`

Reglas y prácticas para el desarrollo:

- Estándares de código
- Git
- Testing
- Seguridad
- Convenciones del proyecto

## Especificaciones SDD

Las especificaciones de funcionalidades se mantienen fuera de `docs/`, en:

```text
specs/
```

Cada funcionalidad puede contener su especificación, plan técnico y tareas de implementación.

```text
specs/
└── <feature>/
    ├── spec.md
    ├── plan.md
    └── tasks.md
```

De esta manera:

**`docs/` → conocimiento general del proyecto**

**`specs/` → especificaciones concretas de funcionalidades**