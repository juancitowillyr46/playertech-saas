# Especificación de funcionalidad: Despliegue del entorno de pruebas

**Feature Branch**: `008-deployment`

**Created**: 2026-10-18

**Status**: Draft

**Origen**: Habilitador técnico **T-02 — Despliegue del entorno de pruebas** (`docs/backlog/enablers/T-02-deployment.md`)

**Input**: Descripción del usuario: "deployment: Implementar T-02. Desplegar PlayerTech como entorno de pruebas para el equipo: el frontend en un servicio de alojamiento conectado al repositorio y el backend en un proyecto de Supabase en la nube, con las migraciones y sin el seed; autenticación configurada; configuración pública de producción; guía de despliegue y verificación."

> Esta spec proviene de un habilitador técnico (principio I) y referencia sus criterios CA-001 a CA-006. Sus usuarios son el **equipo de producto**, que probará PlayerTech en la nube desde cualquier dispositivo, y el **responsable de producto**, que crea las cuentas y los proyectos. El alcance lo decidió el responsable de producto el 2026-10-18: **entorno de pruebas, sin academias reales**. Las decisiones técnicas previas están en ADR-014 (autenticación), ADR-015 (solo valores públicos en el cliente), ADR-016 (plan de Supabase) y ADR-017 (portabilidad).

## Escenarios de usuario y pruebas *(mandatory)*

### Historia 1 - Backend en la nube (Prioridad: P1)

Como equipo, quiero la base de datos, la autenticación y el almacenamiento de PlayerTech en la nube, iguales a los locales y sin datos de prueba, para probar con condiciones reales.

**Motivo de prioridad**: Sin backend en la nube, el frontend publicado no tiene con qué trabajar.

**Prueba independiente**: Tras aplicar las migraciones, se comprueba que el proyecto en la nube tiene el mismo esquema, las mismas reglas de acceso, los catálogos y los buckets, y ninguna cuenta ni academia de prueba.

**Referencia**: CA-001 de T-02.

**Escenarios de aceptación**:

1. **Dado** el proyecto en la nube vacío, **cuando** se aplican las migraciones del repositorio, **entonces** se cumple CA-001 de T-02: esquema, reglas de acceso por academia, funciones, planes, documentos legales vigentes y buckets quedan iguales a los locales.
2. **Dado** el proyecto en la nube, **cuando** se revisan sus datos, **entonces** no hay cuentas, academias ni sedes de prueba (el seed no se aplica).
3. **Dado** la autenticación en la nube, **cuando** se revisa su configuración, **entonces** exige verificar el correo, exige una contraseña de al menos 8 caracteres y solo acepta volver a la dirección del frontend publicado (y de sus vistas previas) en `/auth/callback`.

---

### Historia 2 - Frontend publicado (Prioridad: P1)

Como equipo, quiero abrir PlayerTech en una dirección pública con HTTPS desde cualquier dispositivo, y que cada cambio aprobado se publique solo.

**Motivo de prioridad**: Es lo que permite probar desde el celular sin depender del PC de desarrollo.

**Prueba independiente**: Se abre la dirección pública desde el celular, se recarga una ruta interna y se comprueba que un merge a la rama principal publica una versión nueva.

**Referencia**: CA-002, CA-003 y CA-005 de T-02.

**Escenarios de aceptación**:

1. **Dado** un merge a la rama principal, **cuando** termina la publicación, **entonces** se cumple CA-002 de T-02: la versión nueva está disponible con HTTPS.
2. **Dado** un PR abierto, **cuando** se publica su vista previa, **entonces** el equipo puede probar el cambio en una dirección propia antes del merge.
3. **Dado** el frontend publicado, **cuando** se abre o recarga directamente una ruta interna, **entonces** se cumple CA-003 de T-02: carga la aplicación y no un error.
4. **Dado** lo que descarga el navegador, **cuando** se inspecciona, **entonces** se cumple CA-005 de T-02: solo hay valores públicos del backend.

---

### Historia 3 - Cuenta de punta a punta en la nube (Prioridad: P1)

Como miembro del equipo, quiero registrarme, verificar mi correo y usar PlayerTech en la nube, para confirmar que el entorno funciona completo.

**Motivo de prioridad**: Demuestra que frontend, autenticación, correo y base de datos están bien conectados.

**Prueba independiente**: Un miembro del equipo del proyecto se registra en la dirección pública, abre el enlace del correo en el mismo navegador e inicia sesión; luego edita su academia y una sede.

**Referencia**: CA-004 de T-02.

**Escenarios de aceptación**:

1. **Dado** un miembro del equipo, **cuando** se registra y abre el enlace de verificación, **entonces** se cumple CA-004 de T-02: llega al inicio de una academia nueva con plan Free y sede principal.
2. **Dado** la academia creada en la nube, **cuando** edita su perfil y crea una sede, **entonces** los cambios se guardan como en local.
3. **Dado** que la persona olvida su contraseña, **cuando** usa la recuperación, **entonces** recibe el correo y puede definir una nueva.

---

### Historia 4 - Desarrollo local intacto y guía de despliegue (Prioridad: P2)

Como equipo, quiero seguir desarrollando en local como hasta ahora y tener una guía para repetir o revisar el despliegue.

**Motivo de prioridad**: El despliegue no debe romper el flujo de trabajo diario.

**Prueba independiente**: Se inicia el entorno local y se comprueba que funciona contra Supabase local; se siguen los pasos de la guía para verificar el entorno en la nube.

**Referencia**: CA-006 de T-02.

**Escenarios de aceptación**:

1. **Dado** el entorno local, **cuando** se trabaja como hasta ahora, **entonces** se cumple CA-006 de T-02.
2. **Dado** la guía de despliegue, **cuando** el equipo la sigue, **entonces** puede aplicar migraciones nuevas y verificar el entorno sin conocimiento previo del despliegue.

---

### Edge Cases

- **Correo de una persona ajena al equipo**: sin servidor de correo propio, el correo de verificación no llega; la persona no puede completar el registro. Limitación aceptada para este entorno.
- **Límite de envíos de correo**: el servicio de correo incluido permite pocos envíos por hora; si se alcanza, se muestra el mensaje de «demasiados intentos» existente.
- **Enlaces de correo de una vista previa**: deben volver a la vista previa que los pidió, no a la dirección principal.
- **Migraciones nuevas en el futuro**: se aplican a la nube con el mismo procedimiento, nunca editando la base de datos a mano.
- **Configuración de producción vacía o inválida**: la aplicación no arranca y lo indica (comportamiento existente, FR-007 de la spec 002); la publicación no debe dejar una versión rota en la dirección principal.
- **Documentos legales**: sus enlaces apuntan a una dirección que aún no existe; aceptable para pruebas.

## Requirements *(mandatory)*

### Functional Requirements

**Backend en la nube (CA-001 de T-02)**

- **FR-001**: El proyecto en la nube DEBE tener aplicadas todas las migraciones del repositorio, en orden, con el mismo resultado que en local.
- **FR-002**: El seed de desarrollo NO DEBE aplicarse en la nube.
- **FR-003**: La autenticación en la nube DEBE exigir verificar el correo y una contraseña de al menos 8 caracteres (ADR-014).
- **FR-004**: La autenticación en la nube DEBE aceptar como retorno solo la dirección del frontend publicado y la de sus vistas previas, en `/auth/callback`.

**Frontend publicado (CA-002, CA-003 y CA-005 de T-02)**

- **FR-005**: Cada merge a la rama principal DEBE publicar automáticamente el frontend con HTTPS.
- **FR-006**: Cada PR DEBE tener una vista previa publicada.
- **FR-007**: Abrir o recargar cualquier ruta interna DEBE cargar la aplicación.
- **FR-008**: El frontend publicado DEBE contener solo valores públicos del backend (dirección y clave publicable). Las claves privilegiadas, la contraseña de la base de datos y los tokens NO DEBEN estar en el repositorio ni en el chat (decisión del 2026-10-18; ADR-015).

**Funcionamiento y operación (CA-004 y CA-006 de T-02)**

- **FR-009**: Un miembro del equipo DEBE poder registrarse, verificar su correo, iniciar sesión, recuperar su contraseña y usar las funcionalidades de la Fase 1 en la nube.
- **FR-010**: El desarrollo local DEBE seguir funcionando contra Supabase local sin cambios.
- **FR-011**: DEBE existir una guía de despliegue y verificación: crear y enlazar el proyecto, aplicar migraciones, configurar la autenticación y el frontend, y verificar cada criterio.
- **FR-012**: Las limitaciones del entorno de pruebas (correo solo para el equipo, sin copias de seguridad propias, documentos legales provisionales) DEBEN quedar documentadas.

### Key Entities

- **Entorno de pruebas**: frontend publicado más proyecto de backend en la nube, sin academias reales.
- **Configuración pública de producción**: dirección del backend y clave publicable que usa el frontend publicado.
- **Secretos**: contraseña de la base de datos, clave privilegiada y tokens de cuenta. Solo los maneja el responsable de producto, fuera del repositorio y del chat.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un miembro del equipo abre PlayerTech desde su celular por la dirección pública con HTTPS y completa registro, verificación e inicio de sesión en menos de 5 minutos.
- **SC-002**: El 100 % de las rutas internas abiertas o recargadas directamente cargan la aplicación.
- **SC-003**: Un merge a la rama principal queda publicado en menos de 10 minutos sin pasos manuales.
- **SC-004**: La revisión de lo que descarga el navegador encuentra 0 valores privilegiados.
- **SC-005**: El proyecto en la nube tiene 0 cuentas o academias de prueba y el 100 % de las migraciones aplicadas.
- **SC-006**: El entorno local sigue funcionando y sus pruebas de base de datos pasan.

## Assumptions

- El responsable de producto crea las cuentas y los proyectos (backend y alojamiento del frontend), conecta el repositorio de GitHub e inicia sesión en las herramientas de línea de comandos cuando haga falta. Solo comparte valores públicos.
- El backend usa el plan gratuito durante el desarrollo y el piloto (ADR-016).
- La dirección pública inicial es la que asigna el servicio de alojamiento; el dominio propio queda para antes del piloto.
- Los correos de la nube usan las plantillas por defecto del proveedor; las plantillas con la identidad de PlayerTech y el servidor de correo propio quedan para antes del piloto.
- La región del backend la elige el responsable al crear el proyecto (recomendada: la más cercana a Colombia).
- Quedan fuera de alcance: servidor de correo propio, dominio propio, plantillas de correo en la nube, copias de seguridad propias, documentos legales definitivos, mitigaciones de SEC-01, monitoreo y un entorno de producción separado.
