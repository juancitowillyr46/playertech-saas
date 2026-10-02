# Análisis del template Sakai-ng y adaptación para PlayerTech

## Objetivo

Este documento analiza la estructura, patrones y decisiones de arquitectura del template administrativo de PrimeNG, `sakai-ng`, con el fin de identificar qué conviene reutilizar para PlayerTech y qué debe adaptarse para mantener un enfoque ordenado, escalable y alineado con una arquitectura pragmática para MVP.

No se trata de copiar el template tal cual, sino de extraer principios útiles y adaptarlos a un producto real con:
- autenticación y autorización por Supabase;
- evolución hacia un backend Symfony + MySQL;
- MVP bien estructurado, pero sin sobre-ingeniería;
- enfoque de producto con SDD y Constitution;
- arquitectura DDD-lite + Clean Architecture aplicada con criterio.

---

## 1. Estructura del template Sakai

La estructura observada en `primefaces/sakai-ng` muestra un patrón típico de admin dashboard Angular moderno:

```text
src/
├── app.config.ts
├── app.routes.ts
├── app/
│   ├── layout/
│   │   ├── component/
│   │   │   ├── app.layout.ts
│   │   │   ├── app.topbar.ts
│   │   │   ├── app.sidebar.ts
│   │   │   └── app.footer.ts
│   │   └── service/
│   │       └── layout.service.ts
│   ├── pages/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   │   └── components/
│   │   ├── documentation/
│   │   ├── landing/
│   │   ├── notfound/
│   │   ├── pages.routes.ts
│   │   └── uikit/
│   └── ...
├── assets/
└── index.html