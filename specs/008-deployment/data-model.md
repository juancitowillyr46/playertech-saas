# Modelo de datos: Despliegue del entorno de pruebas

Sin cambios en la base de datos. Este documento describe la configuración por entorno.

## Configuración pública del frontend

| Variable de Vercel | Valor | Pública | Regla |
|---|---|---|---|
| `SUPABASE_URL` | `https://<ref>.supabase.co` | Sí | Obligatoria; debe empezar por `https://` |
| `SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` | Sí | Obligatoria; nunca una clave `service_role` ni `sb_secret_…` |

Se definen en *Production* y *Preview*, con el mismo proyecto de pruebas.

## Secretos (fuera del repositorio y del chat)

| Secreto | Dónde vive | Quién lo usa |
|---|---|---|
| Contraseña de la base de datos | Gestor de contraseñas del responsable | `supabase link` y `db push`, en su terminal |
| Token de la Supabase CLI | Sesión local de `supabase login` | El responsable |
| Clave `service_role` / `sb_secret_…` | Panel de Supabase | Nadie en el frontend; no se usa en este alcance |

## Entornos

| Entorno | Frontend | Backend | Datos |
|---|---|---|---|
| Local | `npm start` (`localhost:4200`) | Supabase local (Docker) | Seed de desarrollo |
| Pruebas | Vercel (`main` y vistas previas) | Proyecto de Supabase en la nube | Solo los del equipo; sin seed |
| Producción | Pendiente (antes del piloto) | Pendiente | Academias reales |
