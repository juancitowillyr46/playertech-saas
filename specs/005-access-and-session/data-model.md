# Modelo de datos: Acceso y sesión

Sin cambios en la base de datos (R1). Esta spec solo maneja estado en el navegador.

## Última interacción (navegador)

| Campo | Dónde | Tipo | Regla |
|---|---|---|---|
| `playertech.lastActivityAt` | `localStorage` (compartido por las pestañas) | número (milisegundos desde 1970), guardado como texto | Se escribe al iniciar sesión y con cada interacción, como mucho una vez cada 5 s. Se borra al cerrar sesión |

**Vigencia de la sesión** (DEC-28, FR-012), con `limite = sessionInactivityMinutes × 60 000`:

| Situación | Resultado |
|---|---|
| Sin valor guardado | Vigente; se guarda la hora actual |
| `ahora − última ≤ limite` | Vigente |
| `ahora − última > limite` | Vencida |
| `última > ahora + 60 000` (reloj cambiado) | Vencida |

## Motivo del cierre (memoria)

`SignOutReason = 'manual' | 'inactivity'`. Vive en `AuthService` y solo dura la carga actual de la aplicación. Se borra al iniciar sesión.

## Estados de la sesión

```text
sin sesión ──iniciar sesión──▶ activa ──interacción──▶ activa
                                 │
                                 ├─ cerrar sesión ─────────────▶ sin sesión (motivo manual, sin aviso)
                                 └─ inactividad vencida ───────▶ sin sesión (motivo inactivity, con aviso)
                                    (abierta, al volver o al reabrir)
```

## Configuración

`AppConfig.sessionInactivityMinutes`: entero > 0. Producción: 60. Desarrollo: 60 por defecto; 2 para la validación en el celular.
