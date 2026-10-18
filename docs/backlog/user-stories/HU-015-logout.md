# HU-015 — Cerrar sesión

**Épica:** EP-01 — Acceso y sesión · **Fase:** 1 — Fundación SaaS · **Prioridad:** MVP · **Estado:** Terminada (entorno local) · spec 005
**Spec:** pendiente

## Historia de usuario

> Como **owner**, quiero cerrar mi sesión, y que se cierre sola si dejo de usar PlayerTech, para evitar que otra persona acceda a la información de mi academia desde mi dispositivo.

## Criterios de aceptación

### CA-001 — Cierre de sesión manual

**Dado** que el owner tiene una sesión iniciada,
**cuando** selecciona la opción de cerrar sesión,
**entonces** el sistema finaliza la sesión y le muestra el inicio de sesión.

### CA-002 — Acceso tras cerrar sesión

**Dado** que el owner cerró su sesión,
**cuando** intenta volver a una funcionalidad privada, incluso con el botón "atrás" del navegador,
**entonces** el sistema no muestra la información y solicita iniciar sesión.

### CA-003 — Cierre por inactividad

**Dado** que el owner tiene una sesión iniciada,
**cuando** pasan 60 minutos sin ninguna interacción con PlayerTech,
**entonces** el sistema cierra la sesión y le muestra el inicio de sesión con un aviso de que se cerró por inactividad.

### CA-004 — La interacción mantiene la sesión

**Dado** que el owner interactúa con PlayerTech,
**cuando** transcurre el tiempo,
**entonces** el periodo de inactividad se reinicia con cada interacción.

## Reglas de negocio

- La inactividad se mide por la interacción del usuario, no por la actividad técnica de la aplicación.
- El tiempo de inactividad sigue corriendo con la aplicación cerrada o en segundo plano: al volver después de 60 minutos, se piden de nuevo las credenciales (DEC-28).
- No hay aviso previo al cierre por inactividad (DEC-28).
- Cerrar sesión en un dispositivo no cierra las sesiones de otros dispositivos.

## Fuera de alcance

- Cerrar la sesión en todos los dispositivos.
- Aviso previo con cuenta regresiva antes del cierre por inactividad (descartado en DEC-28).

## Decisiones relacionadas

DEC-28 (ADR-012) y ADR-014.
