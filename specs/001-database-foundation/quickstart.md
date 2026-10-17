# Validación rápida: Base de datos de la Fundación SaaS

Guía para comprobar de punta a punta que la spec funciona. No contiene implementación.

## Prerrequisitos

- Docker Desktop en ejecución.
- Node 20.19 o superior.
- Dependencias instaladas en la raíz del repositorio: `npm install`.

## 1. Levantar y reconstruir el entorno (Historia 1)

```bash
npm run db:start      # levanta Supabase local (la primera vez descarga imágenes)
npm run db:reset      # aplica todas las migraciones y el seed desde cero
npm run db:status     # muestra las URL locales (API, Studio, correo de prueba)
```

**Resultado esperado:**
- `db:reset` termina sin errores, en menos de 5 minutos (SC-001).
- En Studio aparecen las tablas de la Fase 1, los planes Free, Pro y Advanced, los dos documentos legales vigentes y las academias `academia-a` y `academia-b`, cada una con su sede principal y su suscripción Free.
- Repetir `db:reset` produce el mismo resultado (SC-002).

## 2. Ejecutar las pruebas automáticas (Historias 2 a 5)

```bash
npm run db:test
```

**Resultado esperado:** todas las pruebas pasan, con al menos:

| Grupo | Verifica |
|---|---|
| Esquema | RLS habilitado en todas las tablas de la Fase 1 |
| Aislamiento | Para cada tabla protegida: acceso a la propia academia y rechazo de acceso a la otra (SC-003) |
| Suspensión | Una academia suspendida no puede leer ni modificar sus datos |
| Registro | Éxito completo y reversión total ante un fallo provocado (SC-004) |
| Integridad | Cada regla de la Historia 4 se rechaza al intentar violarla (SC-005) |
| Almacenamiento | Configuración de los buckets; prefijo propio aceptado y prefijo ajeno rechazado; lectura pública y privada. Los límites de tipo y tamaño los aplica la API de Storage y se validan en la sección 4 |

## 3. Autenticación local (Historia 6)

Con el entorno levantado:

1. Registrar una cuenta contra la API local de Auth con datos válidos según [contracts/registration-metadata.md](contracts/registration-metadata.md).
2. Intentar iniciar sesión **antes** de verificar el correo → debe rechazarse.
3. Abrir el visor de correo de prueba (URL en `db:status`) → aparece el correo de verificación y no se envió a ningún destinatario real.
4. Abrir el enlace de verificación e iniciar sesión → debe permitirse.
5. Intentar registrar una cuenta con una contraseña de 7 caracteres → debe rechazarse.
6. Solicitar la recuperación de contraseña de la cuenta → el correo aparece en el visor local.
7. Decodificar el token de acceso de la sesión → el claim `exp` es igual a `iat + 3600` (1 hora).
8. Iniciar sesión con `owner.a@playertech.test` y la contraseña local del seed → debe permitirse.

## 4. Límites del almacenamiento (Historia 5)

Con la sesión de `owner.a@playertech.test`, contra la API local de Storage y en una ruta de su academia dentro de `public-assets`:

1. Subir una imagen PNG de menos de 1 MB → debe aceptarse.
2. Subir un archivo PDF → debe rechazarse por tipo.
3. Subir una imagen de más de 1 MB → debe rechazarse por tamaño.

## 5. Tipos para el frontend

```bash
npm run db:types
```

**Resultado esperado:** se genera o actualiza `frontend/src/app/core/supabase/database.types.ts` con las tablas y funciones de esta spec.

## 6. Revisión de secretos (SC-006)

Revisar que el repositorio no contiene claves privilegiadas: ningún `service_role`, contraseñas reales ni archivos `.env` versionados. Las contraseñas del seed son solo de desarrollo local y se documentan en `supabase/README.md`.

## Usuarios de prueba

| Usuario | Correo | Academia |
|---|---|---|
| Owner A | `owner.a@playertech.test` | `academia-a` |
| Owner B | `owner.b@playertech.test` | `academia-b` |

La contraseña local compartida de desarrollo se documenta en `supabase/README.md`.
