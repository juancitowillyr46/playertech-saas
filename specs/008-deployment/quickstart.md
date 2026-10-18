# Guía de validación: Despliegue del entorno de pruebas

**Quién hace qué**: 🧑 responsable de producto (cuentas, paneles, secretos) · 🤖 agente (repositorio y verificación).

## 1. Repositorio listo (🤖)

`build:vercel`, `write-environment.mjs` con su prueba, `vercel.json`, `db:push` y la guía, en la rama de la spec. Verificación local: `node --test frontend/scripts/write-environment.test.mjs`; `npm run build:vercel` con variables de ejemplo, que debe pasar `check:bundle`, y sin variables, que debe fallar con un mensaje claro.

## 2. Backend en la nube (🧑, con comandos que prepara 🤖)

| # | Paso | Resultado esperado |
|---|---|---|
| 2.1 | Crear el proyecto en supabase.com (plan Free; región recomendada: São Paulo) | Proyecto con su `ref`, URL y clave publicable |
| 2.2 | En la raíz: `npx supabase login` y `npx supabase link --project-ref <ref>` (escribir la contraseña de la base de datos en el terminal) | Proyecto enlazado |
| 2.3 | `npm run db:push` | 11 migraciones aplicadas; `npx supabase migration list` muestra las mismas en local y en remoto |
| 2.4 | En el editor SQL del panel, la consulta de verificación de `docs/engineering/deployment.md` | 0 usuarios y 0 academias; 3 planes; 2 documentos legales vigentes; 2 buckets |
| 2.5 | Configurar la autenticación según `contracts/deployment.md` e invitar al equipo | Ajustes guardados |
| 2.6 | Pasar a 🤖 la URL y la clave publicable (públicas) | — |

## 3. Frontend en Vercel (🧑)

| # | Paso | Resultado esperado |
|---|---|---|
| 3.1 | Importar el repositorio en vercel.com con los ajustes de `contracts/deployment.md` y las dos variables | Primera publicación correcta en `https://<proyecto>.vercel.app` |
| 3.2 | Copiar la URL de producción y la de las vistas previas en las redirecciones de Supabase (2.5) | — |

## 4. Verificación en la nube (🧑 en el celular, 🤖 desde el PC)

| # | Paso | Resultado esperado |
|---|---|---|
| 4.1 | Abrir la URL pública en el celular | Inicio de sesión con HTTPS |
| 4.2 | Abrir y recargar directamente `/auth/register` y `/settings/venues` | Carga la aplicación (CA-003) |
| 4.3 | Registrarse con un correo del equipo, abrir el enlace en el mismo navegador e iniciar sesión | Inicio de una academia con plan Free y sede principal (CA-004); medir el tiempo (SC-001) |
| 4.4 | Editar el perfil, subir un logo y crear una sede | Se guardan |
| 4.5 | Recuperar la contraseña | Llega el correo y se define una nueva |
| 4.6 | Revisar el registro de la compilación en Vercel | `check:bundle` sin claves privilegiadas (CA-005) |
| 4.7 | Abrir un PR de prueba | Vista previa publicada; su enlace de correo vuelve a la vista previa |
| 4.8 | Hacer merge a `main` | Publicación automática en menos de 10 minutos (SC-003) |
| 4.9 | En local: `npm run db:test` y `npm start` | Todo sigue igual (CA-006) |

## Resultados

*(se completa al implementar)*
