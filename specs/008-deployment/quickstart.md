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

Ejecución del 2026-10-18. Entorno de pruebas: https://playertech-saas.vercel.app con el proyecto de Supabase `ztibxfmcysicwfrypbef`.

| Sección | Resultado |
|---|---|
| 1. Repositorio | ✓ Pruebas del script 5/5. `build:vercel` falla sin variables y compila con ellas, pasando `check:bundle`. `environment.ts` sin cambios en el repositorio. `vercel.json` (heredado de SakaiNG) conservado |
| 2. Backend | ✓ El responsable ejecutó `supabase login`, `link` y `db:push`: 11 migraciones, iguales en local y en remoto. `link` no pidió la contraseña: la CLI usa la sesión para crear un rol temporal. Verificado con la clave publicable: documentos legales vigentes legibles; academias y planes con permiso denegado sin sesión |
| 3. Frontend | ✓ Publicado en Vercel desde `main`, con HTTPS y HSTS. La compilación generó la configuración y pasó `check:bundle` |
| 4. Verificación | ✓ 4.2: las 6 rutas internas cargan la app al abrirse directamente. ✓ La app arranca en un navegador real y lee los documentos legales de la nube, sin errores. ✓ 4.3 y 4.4, validados por el responsable en el celular: registro, verificación, inicio de sesión, perfil, logo y sede. ⏳ 4.5 recuperación: el correo incluido de Supabase agotó su cupo por hora («Hiciste demasiados intentos», mensaje correcto de la app); queda por confirmar en la nube con SMTP propio (el flujo está validado en local, spec 005). ⏳ 4.7 y 4.8: vista previa de un PR y tiempo de publicación, a confirmar en el próximo PR |

**Hallazgos de la prueba en la nube**

- El primer enlace de verificación volvió a `localhost`: la URL de Vercel aún no estaba en *Redirect URLs*, y Supabase usa la *Site URL* por defecto. Se configuró y se documentó en la guía. La cuenta sí quedó verificada.
- Las plantillas de correo con la identidad no se pueden editar en el plan gratuito sin SMTP propio: se aplicarán con el SMTP, antes del piloto.
- CA-006 (local intacto): `db:test` falló al principio (137 de 144) porque la validación de la spec 007 dejó registros de archivos y un logo en la academia A del seed, y pgTAP la necesita limpia. No era un fallo del código. Se limpiaron por la API de Storage y por SQL, y quedó en 144/144. `config.toml` y `environment.ts` siguen sin cambios.
- Tema oscuro al abrir: la app sigue la preferencia del dispositivo (T-01, CA-006) y cada dirección guarda la elección del usuario por separado.
