# Investigación: Acceso y sesión

Decisiones técnicas de la spec 005. Las reglas de producto ya están en DEC-28 y ADR-014; aquí se decide cómo cumplirlas.

## R1 — Sin migraciones ni cambios en el seed

- **Decisión**: no se toca la base de datos ni el seed. Los estados que exigen CA-004, CA-007 y CA-008 de HU-001 se preparan solo durante la validación y se revierten al terminar:
  - correo sin verificar: un registro nuevo desde la interfaz sin abrir el enlace;
  - academia suspendida: `status = 'suspended'` en la academia B;
  - sin membresía activa: `status = 'disabled'` en la membresía del owner B.
- **Motivo**: las pruebas pgTAP dependen del seed actual. Las redirecciones ya existen y se cubren con pruebas unitarias de los guards (R10).
- **Alternativas**: añadir cuentas al seed. Se descarta porque cambia datos de los que dependen otras pruebas, para un uso que solo existe en la validación.

## R2 — Qué cuenta como interacción

- **Decisión**: `pointerdown`, `keydown`, `wheel` y `scroll` (este en fase de captura, para incluir el desplazamiento de contenedores internos). Los escuchadores son pasivos y registran la hora como mucho una vez cada 5 s.
- **Motivo**: cubre tocar, hacer clic, escribir y desplazarse en celular y escritorio. `pointerdown` incluye el tacto. No se usa `mousemove`, porque un ratón que se roza no expresa intención y en el celular no existe. La renovación del token y las cargas de datos no disparan ninguno de estos eventos (FR-002).
- **Alternativas**: registrar cada evento, que escribe en el almacenamiento decenas de veces por segundo; o usar `mousemove`, que puede mantener la sesión sin que nadie la use.

## R3 — Medir por hora guardada y no con un temporizador

- **Decisión**: la hora de la última interacción se guarda en `localStorage` con la clave `playertech.lastActivityAt` (milisegundos). La sesión vence si `ahora − última > tiempo de inactividad`. La comprobación se hace:
  - cada 30 s mientras la pestaña está visible;
  - al volver a la pestaña (`visibilitychange` a visible), al recuperar el foco y en `pageshow`;
  - al arrancar la aplicación (R4).
- **Motivo**: con la pantalla bloqueada o en segundo plano, el navegador del celular congela los temporizadores (ADR-014); comparar horas funciona aunque la comprobación llegue tarde. `localStorage` lo comparten las pestañas del mismo origen, así que la interacción en una mantiene todas (FR-004) sin mensajes entre pestañas.
- **Alternativas**: un `setTimeout` de 60 minutos, que no se dispara con el celular bloqueado; o `BroadcastChannel`, que no hace falta porque el valor compartido ya está en el almacenamiento.

## R4 — Comprobación al arrancar, antes de mostrar datos

- **Decisión**: `AuthService.restore()`, que ya se ejecuta en el inicializador de la aplicación antes de la primera navegación, consulta a `InactivityService` si la sesión restaurada está vencida. Si lo está, borra la sesión local **sin navegar**, deja la sesión nula y guarda el motivo `inactivity` antes de marcar la sesión como lista. `authGuard` ve una sesión nula y dirige al inicio de sesión, conservando `returnUrl`. No se navega desde el inicializador porque la navegación inicial del router la pisaría y se perdería la ruta pedida.
- **Motivo**: cumple «antes de mostrar datos» (FR-003) sin pantallas intermedias: ninguna ruta privada llega a activarse.
- **Casos**:
  - Sesión sin hora guardada (primer arranque tras esta versión o almacenamiento borrado): se toma como actividad ahora y no se cierra.
  - Hora guardada en el futuro por más de 1 minuto (reloj cambiado): se toma como vencida (caso límite de la spec).

## R5 — Ciclo de vida del servicio

- **Decisión**: `AuthService` inicia `InactivityService` en el arranque y le pasa el cierre y la señal de sesión (`start(onExpire, isAuthenticated)`), así que la dependencia va en un solo sentido. La vigilancia reacciona a la sesión:
  - con sesión: registra la interacción y comprueba;
  - sin sesión: retira los escuchadores, detiene la comprobación periódica y borra la hora guardada.
  - Al iniciar sesión se guarda la hora actual.
- **Motivo**: las pantallas públicas no cuentan inactividad (caso límite). Al iniciar sesión de nuevo, la hora antigua de otra sesión no la cierra en el acto.
- **Almacenamiento no disponible**: las lecturas y escrituras van en `try/catch` y se usa un valor en memoria. El cierre funciona con la aplicación abierta; se pierden la comprobación al reabrir y la compartida entre pestañas (supuesto de la spec).

## R6 — Motivo del cierre y aviso en el inicio de sesión

- **Decisión**: `AuthService.signOut(reason)` con `reason: 'manual' | 'inactivity'` (por defecto `manual`) guarda el motivo en una señal de solo lectura `signOutReason`. El inicio de sesión muestra un `p-message` informativo: «Tu sesión se cerró por inactividad. Ingresa de nuevo para continuar.» El motivo se borra al iniciar sesión.
- **Motivo**: no hace falta un parámetro en la URL: el aviso solo tiene sentido en la misma carga de la aplicación. Si la persona recarga el inicio de sesión, el aviso desaparece, lo que es correcto.
- **Alternativas**: `?reason=inactivity` en la URL. Se descarta porque persiste al compartir o recargar y obliga a validar el parámetro.

## R7 — Cerrar sesión solo en este dispositivo

- **Decisión**: `SupabaseAuthRepository.signOut()` llama a `auth.signOut({ scope: 'local' })`.
- **Motivo**: el alcance por defecto de `supabase-js` es `global` y revoca las sesiones de todos los dispositivos. Eso incumple la regla de HU-015 y FR-010. Con `local`, la sesión se borra del navegador aunque el servidor no responda, y `AuthService` ya limpia el estado en `finally` (caso «sin conexión»).

## R8 — Botón «atrás» tras cerrar sesión

- **Decisión**: no se añade código salvo que la validación demuestre lo contrario. El cierre de sesión navega dentro de la aplicación; «atrás» vuelve a una ruta privada, `authGuard` la rechaza al no haber sesión, y el contexto de academia ya se limpió. Se cubre con una prueba de guard y un paso del quickstart en el celular.
- **Si falla** (por ejemplo, el navegador restaura la página desde su caché tras salir de la aplicación): `InactivityService` ya escucha `pageshow`. Bastaría con que, sin sesión y con la página restaurada (`event.persisted`), recargue la ruta.

## R9 — Tiempo configurable y pruebas sin esperar

- **Decisión**: `AppConfig.sessionInactivityMinutes` (número). Vale 60 en `environment.ts` (producción) y 60 en `environment.development.ts`; para la validación en el celular se cambia temporalmente a 2. `validateAppConfig` exige un entero mayor que 0.
- **Pruebas**: Vitest con `vi.useFakeTimers()` y `vi.setSystemTime()` simula el paso de 60 minutos, el regreso de segundo plano (`visibilitychange`), la hora en el futuro y la interacción en otra pestaña (evento `storage` o escritura directa en el almacenamiento).

## R10 — Criterios ya construidos que no tienen prueba

- **Decisión**: se añaden solo las pruebas que faltan según `contracts/acceptance-coverage.md`:
  - `membership.guard`: academia suspendida → `/auth/suspended` (CA-007); sin membresía → `/auth/access-denied` (CA-008);
  - `AuthService`: restaurar, cerrar sesión con motivo y limpiar el contexto;
  - repositorio: cierre con alcance local;
  - inicio de sesión: aviso de inactividad y su ausencia tras un cierre manual.
- Lo que depende de Supabase (CA-004, CA-005 de HU-016, CA-006 de HU-016) se verifica de punta a punta en el quickstart con el buzón local.

## R11 — Revisión de experiencia y accesibilidad

- **Decisión**: `/impeccable audit` y `/impeccable critique` sobre las 7 pantallas de acceso a 360 px y en escritorio, en modo claro y oscuro, más el detector. Se corrigen los hallazgos críticos y altos dentro de los tres sitios de estilos de `AGENTS.md`.
