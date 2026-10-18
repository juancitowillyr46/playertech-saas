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
| Confirmación | `p-message` informativo: «Si tu cuenta está pendiente de verificar, te enviamos un enlace nuevo. Ábrelo desde este mismo navegador. Si ya la verificaste, inicia sesión.» |
| Error | `p-message` de error con el mensaje del catálogo para `rate_limited` o `network` |
| Pie | «¿Ya tienes una cuenta con este correo?» con «Iniciar sesión» y «Recuperar mi contraseña» |

## Correo ya registrado en el registro (CA-005, cambiado el 2026-10-18)

- `AppErrorCode` nuevo `email_taken`: «Ya existe una cuenta con este correo.»
- `SupabaseAuthRepository.signUp` lo lanza si Auth responde `user_already_exists` o, con la verificación de correo activa, devuelve una cuenta sin identidades (`user.identities` vacío).
- El registro marca el campo de correo con el error `taken`, muestra el mensaje y los enlaces «Iniciar sesión» y «Recuperar mi contraseña». El error se borra al cambiar el correo.

## Retorno de enlaces a la raíz

Si Auth no acepta la dirección de retorno, vuelve a la dirección del sitio (la raíz) con `code` o `error`. `rootRedirect` (`core/auth/email-link-redirect.ts`) lleva esos parámetros a `/auth/callback`, que completa el ingreso o muestra «Enlace no válido».

## Caminos al reenvío (FR-010a)

| Pantalla | Cambio |
|---|---|
| Inicio de sesión (`login.ts`) | Con el error `email_not_confirmed`, enlace «Reenviar el correo de verificación» a `/auth/verify-email?email=<correo escrito>` |
| Retorno de enlaces (`callback.ts`), enlace no válido | Nuevo enlace «Reenviar el correo de verificación» a `/auth/verify-email`. El existente que lleva a `/auth/forgot-password` pasa de «Solicitar un enlace nuevo» a «Recuperar mi contraseña» |
