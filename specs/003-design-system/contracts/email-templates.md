# Contrato: plantillas de correo de autenticación

Correos de Supabase Auth (ADR-014). En local se leen en Mailpit (http://127.0.0.1:54324).

## Registro en `supabase/config.toml`

| Sección | `subject` | `content_path` |
|---|---|---|
| `[auth.email.template.confirmation]` | "Confirma tu correo para activar tu academia en PlayerTech" (ajustable con `/impeccable clarify`) | `./supabase/templates/confirmation.html` |
| `[auth.email.template.recovery]` | "Restablece tu contraseña de PlayerTech" (ajustable) | `./supabase/templates/recovery.html` |

Los cambios de `config.toml` y de las plantillas se aplican al reiniciar Supabase local (`npm run db:stop` y `npm run db:start`).

## Variables

| Variable | Uso |
|---|---|
| `{{ .ConfirmationURL }}` | Botón y enlace en texto. Conserva el flujo PKCE actual: Supabase verifica y redirige a `/auth/callback` con el código |
| `{{ .Email }}` | Opcional, para indicar a qué cuenta corresponde |
| `{{ .Data.full_name }}` | Saludo personalizado («Hola, Juan Pérez.»), con respaldo «Hola.» si falta. Es el nombre del registro (metadato `full_name`, spec 001); las plantillas no permiten extraer solo el primer nombre |

No se usan `{{ .Token }}` ni `{{ .TokenHash }}`: el flujo de la spec 002 no los necesita.

## Estructura de cada plantilla

1. Texto de vista previa oculto (*preheader*).
2. Marca tipográfica de PlayerTech en texto, no en imagen.
3. Título y un párrafo en español de Colombia, con el vocabulario del glosario, que empieza saludando por el nombre.
4. Botón de acción, como enlace con aspecto de botón y al menos 44 px de alto.
5. El mismo enlace en texto plano, con la explicación "Si el botón no funciona, copia este enlace…".
6. Vigencia del enlace y, en recuperación, "Si no solicitaste este cambio, ignora este correo; tu contraseña no cambiará".
7. Pie con el nombre del producto, sin direcciones ni datos inventados.

## Reglas técnicas

- Maquetación con tablas, estilos en línea y un ancho máximo de unos 600 px. Sin hojas externas, scripts, formularios ni fuentes web (la pila de respaldo es del sistema).
- Colores tomados de los tokens de `DESIGN.md`, con contraste AA para el texto y el botón.
- `lang="es"` y estructura legible con imágenes bloqueadas o estilos ignorados.
