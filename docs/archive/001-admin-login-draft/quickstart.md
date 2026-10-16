# Validación rápida: Admin Login

## Prerrequisitos

- Usar la configuración de desarrollo de frontend asociada al ambiente de desarrollo de Supabase.
- Preparar un usuario administrador con una membresía de academia activa.
- Preparar un usuario con credenciales válidas y sin membresía de academia activa.
- Preparar una ruta privada y asegurar que existe una academia separada para verificaciones de
  autorización/RLS.

## Verificaciones locales

Desde `frontend/`:

```powershell
npm test
npm run build
```

## Escenarios de aceptación

1. Abrir la ruta de login y enviar sin correo electrónico o contraseña. Verificar retroalimentación de
   campo obligatorio y que no se muestra ninguna ruta privada.
2. Enviar credenciales inválidas. Verificar un mensaje genérico y ausencia de acceso privado.
3. Enviar credenciales válidas del usuario con membresía activa. Verificar acceso a una ruta privada y
   un contexto de academia resuelto.
4. Abrir una ruta privada sin sesión válida. Verificar que no muestra contenido protegido y solicita
   login.
5. Enviar credenciales válidas del usuario sin membresía activa. Verificar acceso denegado, sesión
   conservada, ausencia de contexto de academia y ausencia de acceso a rutas privadas.
6. Terminar o invalidar la sesión activa y realizar una acción protegida. Verificar que el acceso se
   detiene y se solicita login.
7. En el ambiente de pruebas, verificar que el usuario autenticado de Academy A no puede leer ni
   modificar datos de Academy B; consultar `docs/architecture/supabase-migrations-guide.md` para la
   guía de validación RLS.

## Resultado esperado

Todos los escenarios satisfacen el comportamiento observable de [spec.md](./spec.md) y el contrato
de UI de [contracts/login-flow.md](./contracts/login-flow.md), sin exponer contenido protegido ni
asumir un tenant para un usuario sin membresía.
