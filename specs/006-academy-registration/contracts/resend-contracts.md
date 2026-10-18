# Contratos del reenvío de verificación

## AuthRepository (`core/auth/data/auth.repository.ts`)

```ts
/** Reenvía el correo de verificación. Solo falla con rate_limited o network (DEC-12). */
abstract resendVerification(email: string): Promise<void>;
```

`SupabaseAuthRepository`: `auth.resend({ type: 'signup', email, options: { emailRedirectTo: `${location.origin}/auth/callback` } })`. Mapea el error con `mapSupabaseError` y solo lo lanza si el código es `rate_limited` o `network` (mismo conjunto que la recuperación de contraseña).

## AuthService y RegistrationService

`AuthService.resendVerification(email)` delega en el repositorio. `RegistrationService.resendVerification(email)` delega en `AuthService`, porque la pantalla de la feature solo usa su servicio.

## Pantalla de verificar correo (`features/auth/verify-email/verify-email.ts`)

| Elemento | Comportamiento |
|---|---|
| Texto | «Te enviamos un enlace a **{correo}**. Ábrelo desde este mismo navegador para activar tu cuenta.» (existente) |
| Campo «Correo» | Solo sin parámetro `email`. Obligatorio y con formato de correo; errores junto al campo |
| Botón «Reenviar correo» | Secundario (`outlined`), ancho completo en el celular, al menos 44 px. Con espera: deshabilitado y con la etiqueta «Reenviar en m:ss». Con envío en curso: estado de carga |
| Espera | 60 s al llegar con `email` y tras cada envío correcto |
| Confirmación | `p-message` informativo: «Si tu cuenta está pendiente de verificar, te enviamos un enlace nuevo. Ábrelo desde este mismo navegador.» |
| Error | `p-message` de error con el mensaje del catálogo para `rate_limited` o `network` |
| Enlace | «Ir a iniciar sesión» (existente) |

## Caminos al reenvío (FR-010a)

| Pantalla | Cambio |
|---|---|
| Inicio de sesión (`login.ts`) | Con el error `email_not_confirmed`, enlace «Reenviar el correo de verificación» a `/auth/verify-email?email=<correo escrito>` |
| Retorno de enlaces (`callback.ts`), enlace no válido | Nuevo enlace «Reenviar el correo de verificación» a `/auth/verify-email`. El existente que lleva a `/auth/forgot-password` pasa de «Solicitar un enlace nuevo» a «Recuperar mi contraseña» |
