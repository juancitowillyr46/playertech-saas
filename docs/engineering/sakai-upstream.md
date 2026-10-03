# Guía de actualización de SakaiNG

## Propósito

Define cómo PlayerTech mantiene y evalúa futuras actualizaciones del proyecto **SakaiNG** utilizado como base del frontend.

El objetivo es poder aprovechar correcciones, mejoras y nuevas capacidades de SakaiNG sin perder las decisiones arquitectónicas, funcionales y visuales propias de PlayerTech.

---

# 1. Modelo de repositorios

PlayerTech utiliza un único repositorio principal:

```text
playertech-saas/
│
├── .git/
├── docs/
├── specs/
├── .specify/
├── frontend/
└── backend/
```

El repositorio mantiene dos referencias remotas:

```text
origin
└── Repositorio de PlayerTech

sakai-upstream
└── Repositorio oficial de SakaiNG
```

Conceptualmente:

```text
              PrimeFaces / SakaiNG
                       │
                       │ sakai-upstream
                       ▼
                ┌──────────────┐
                │   PlayerTech │
                │              │
                │  frontend/   │
                └──────┬───────┘
                       │
                       │ origin
                       ▼
                 GitHub PlayerTech
```

---

# 2. Principio fundamental

SakaiNG es una **base tecnológica y visual**, no la fuente de verdad del producto PlayerTech.

PlayerTech mantiene el control sobre:

- arquitectura;
- funcionalidades;
- dominio;
- componentes propios;
- estilos propios;
- configuración;
- integración con Supabase;
- estructura de features;
- especificaciones;
- pruebas;
- documentación.

Por lo tanto:

> Las actualizaciones de SakaiNG se evalúan e integran de manera controlada. No se sincronizan automáticamente.

---

# 3. Remote de SakaiNG

El remote debe configurarse como:

```bash
git remote add sakai-upstream https://github.com/primefaces/sakai-ng.git
```

Verificar:

```bash
git remote -v
```

Resultado esperado:

```text
origin
    https://github.com/juancitowillyr46/playertech-saas.git

sakai-upstream
    https://github.com/primefaces/sakai-ng.git
```

---

# 4. Actualizar la referencia de SakaiNG

Antes de evaluar una actualización:

```bash
git fetch sakai-upstream
```

Este comando **no modifica el código de PlayerTech**.

Actualiza las referencias locales del repositorio remoto.

```text
Antes

PlayerTech
   │
   └── sakai-upstream/main → versión conocida


Después de git fetch

PlayerTech
   │
   ├── estado actual
   │
   └── sakai-upstream/main → última versión conocida
```

---

# 5. Evaluar los cambios

Nunca se debe integrar una actualización de SakaiNG directamente sin analizarla.

Primero revisar el historial:

```bash
git log --oneline --decorate sakai-upstream/main
```

También puede compararse el estado actual con la nueva referencia:

```bash
git diff HEAD..sakai-upstream/main
```

Para cambios grandes, revisar especialmente:

- Angular;
- TypeScript;
- PrimeNG;
- Tailwind;
- estructura de componentes;
- layout;
- estilos;
- configuración;
- dependencias;
- breaking changes;
- configuración de build;
- cambios en autenticación o navegación;
- cambios en componentes utilizados por PlayerTech.

---

# 6. Clasificación de una actualización

Una actualización de SakaiNG debería clasificarse antes de integrarse.

## Tipo A — Dependencias

Ejemplos:

- actualización de PrimeNG;
- actualización de Angular;
- actualización de TypeScript;
- actualización de Tailwind.

Puede requerir actualización controlada de `package.json` y pruebas.

---

## Tipo B — Correcciones

Ejemplos:

- corrección de estilos;
- corrección de componentes;
- corrección de errores de layout;
- corrección de comportamiento.

Evaluar si PlayerTech necesita la corrección y si existen personalizaciones afectadas.

---

## Tipo C — Nuevas capacidades

Ejemplos:

- nuevos componentes;
- mejoras del layout;
- nuevas variantes visuales;
- nuevas capacidades de navegación.

No incorporar automáticamente.

Primero determinar si aportan valor a PlayerTech.

---

## Tipo D — Cambios estructurales

Ejemplos:

- reorganización de carpetas;
- cambios importantes de configuración;
- migración de Angular;
- cambios importantes en el sistema de estilos.

Estas actualizaciones requieren una evaluación técnica más profunda.

---

# 7. Crear una rama de actualización

Una actualización de SakaiNG debe realizarse en una rama independiente.

Ejemplo:

```bash
git checkout -b chore/update-sakai-ng
```

Para una actualización específica:

```text
chore/update-sakai-ng-2026-xx
```

La rama debe partir del estado estable de PlayerTech:

```text
main
 │
 └── chore/update-sakai-ng
```

---

# 8. Integrar los cambios

La integración debe hacerse de manera controlada.

Antes:

```text
main
 │
 └── PlayerTech
```

Durante:

```text
main
 │
 └── chore/update-sakai-ng
          │
          └── cambios SakaiNG
```

Después de integrar:

```text
main
 │
 └── PlayerTech
       +
     SakaiNG actualizado
```

La estrategia concreta de integración puede ser:

- merge;
- cherry-pick;
- actualización manual de dependencias;
- adaptación manual de código;
- combinación de las anteriores.

La elección depende del tipo de actualización.

---

# 9. Resolver conflictos

Los conflictos no deben resolverse simplemente eligiendo:

```bash
git checkout --theirs
```

ni:

```bash
git checkout --ours
```

sin analizar el contenido.

Para cada conflicto se debe determinar:

```text
¿El cambio pertenece a SakaiNG?
          │
          ├── Sí → evaluar integración
          │
          └── No → preservar decisión PlayerTech
```

Las partes relacionadas con el dominio PlayerTech deben permanecer bajo control del proyecto.

---

# 10. Verificación

Después de integrar una actualización se debe comprobar como mínimo:

### Instalación

```bash
npm install
```

### Build

```bash
npm run build
```

### Tests

```bash
npm test
```

o el comando definido por el proyecto.

### Aplicación

```bash
npm start
```

Además se debe realizar una revisión funcional de las áreas afectadas.

---

# 11. Áreas críticas de PlayerTech

Las actualizaciones de SakaiNG deben verificarse especialmente en:

```text
frontend/
│
├── core/
│   ├── auth
│   ├── guards
│   └── configuration
│
├── shared/
│
├── features/
│   ├── players
│   ├── groups
│   ├── activities
│   ├── call-ups
│   └── responses
│
└── layout/
```

Una actualización visual de SakaiNG no debe romper:

- navegación;
- autenticación;
- guards;
- formularios;
- componentes reutilizables;
- integración con Supabase;
- responsive design;
- features existentes.

---

# 12. Actualizaciones que no deben incorporarse automáticamente

No se debe actualizar SakaiNG automáticamente por el simple hecho de que exista una nueva versión.

Antes de actualizar se debe considerar:

```text
Nueva versión SakaiNG
        │
        ▼
¿Existe una necesidad?
        │
        ├── No → posponer
        │
        └── Sí
             │
             ▼
       Evaluar impacto
             │
             ▼
        Crear rama
             │
             ▼
          Integrar
             │
             ▼
           Probar
             │
             ▼
       Revisar regresiones
             │
             ▼
          Aceptar
```

---

# 13. Frecuencia

No se establece una frecuencia obligatoria de actualización.

Las actualizaciones deben responder a una necesidad técnica o funcional, por ejemplo:

- corrección de un problema;
- vulnerabilidad;
- actualización requerida de Angular;
- actualización requerida de PrimeNG;
- mejora necesaria;
- compatibilidad;
- nueva capacidad útil para PlayerTech.

La prioridad de una actualización depende de su impacto y necesidad para el producto.

---

# 14. Trazabilidad

Cuando se incorpora una actualización significativa de SakaiNG debe quedar registrada mediante Git.

Ejemplo:

```text
chore: update SakaiNG dependencies
```

Para una actualización mayor:

```text
chore: upgrade SakaiNG base
```

Si la actualización requiere cambios propios:

```text
chore: adapt PlayerTech frontend to SakaiNG update
```

Cuando corresponda, la actualización puede documentarse en:

```text
docs/architecture/
docs/engineering/
```

o asociarse a una especificación si forma parte de una funcionalidad concreta.

---

# 15. Regla de oro

```text
SakaiNG proporciona la base.
PlayerTech controla el producto.
```

Por lo tanto:

```text
SakaiNG
   │
   │ actualizaciones
   ▼
Evaluar
   │
   ▼
Adaptar
   │
   ▼
Probar
   │
   ▼
Integrar
   │
   ▼
PlayerTech
```

Nunca:

```text
SakaiNG
   │
   │ actualización automática
   ▼
PlayerTech
```

---

# 16. Resumen operativo

El procedimiento recomendado es:

```bash
# 1. Obtener actualizaciones
git fetch sakai-upstream

# 2. Revisar cambios
git log --oneline sakai-upstream/main

# 3. Crear rama
git checkout -b chore/update-sakai-ng

# 4. Evaluar e integrar cambios
#    según el tipo de actualización

# 5. Instalar dependencias
npm install

# 6. Ejecutar pruebas
npm test

# 7. Construir
npm run build

# 8. Verificar aplicación
npm start

# 9. Revisar cambios
git diff

# 10. Commit
git commit -m "chore: update SakaiNG base"
```

La actualización solo debe llegar a `main` después de verificar que PlayerTech continúa funcionando correctamente.