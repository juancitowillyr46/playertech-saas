# Modelo de datos: Alta de academia

Sin cambios en la base de datos (R1). Lo que crea el registro está en el contrato de la spec 001 (`specs/001-database-foundation/contracts/`) y en `docs/architecture/database-schema.md`.

## Estado de la pantalla de verificar correo (memoria)

| Campo | Tipo | Regla |
|---|---|---|
| `email` | texto | Del parámetro `email`; si falta, lo escribe la persona (correo válido, obligatorio para reenviar) |
| `secondsLeft` | entero ≥ 0 | 60 al llegar desde el registro y tras cada reenvío; baja 1 por segundo. Con valor > 0 el botón está deshabilitado |
| `sent` | sí/no | Muestra el mensaje genérico tras un reenvío |
| `errorMessage` | texto o nulo | Solo `rate_limited` o `network` (R3) |
