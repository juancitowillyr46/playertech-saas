# Especificación de funcionalidad: Base de datos de la Fundación SaaS

**Feature Branch**: `001-database-foundation`

**Created**: 2026-10-16

**Status**: Draft

**Origen**: Habilitador técnico **T-00** — áreas 1 a 6 (`docs/backlog/enablers/T-00-saas-foundation.md`)

**Input**: Descripción del usuario: "database-foundation: Base de datos de la Fundación SaaS multi-tenant de PlayerTech. Implementa las áreas 1 a 6 del habilitador técnico T-00 y sus criterios de aceptación técnicos CA-001 a CA-007."

> Esta spec proviene de un habilitador técnico (principio I de la Constitución). Su usuario es el **equipo de desarrollo** y sus escenarios describen capacidades técnicas verificables. El modelo de datos de referencia está en `docs/architecture/database-schema.md` (Fase 1) y las decisiones en ADR-012, ADR-013 y ADR-014.

## Escenarios de usuario y pruebas *(mandatory)*

### Historia 1 - Entorno de datos reproducible (Prioridad: P1)

Como equipo de desarrollo, necesito reconstruir desde cero, en mi equipo, el modelo de datos completo de la Fase 1 con sus datos iniciales y de prueba, para desarrollar y verificar cualquier funcionalidad sobre una base idéntica y conocida.

**Motivo de prioridad**: Sin un entorno reproducible no es posible construir ni probar ninguna otra pieza.

**Prueba independiente**: Partiendo de un entorno vacío, se reconstruye la base de datos y se comprueba que existen todas las entidades de la Fase 1, los planes, los documentos legales vigentes y las dos academias de prueba.

**Referencia**: CA-001 de T-00.

**Escenarios de aceptación**:

1. **Dado** un entorno local vacío, **cuando** se reconstruye la base de datos, **entonces** quedan creadas todas las entidades de la Fase 1 con sus reglas de integridad, sin errores.
2. **Dado** que se reconstruyó la base de datos, **cuando** se consultan los datos iniciales, **entonces** existen los planes Free, Pro y Advanced y una versión vigente de los Términos y Condiciones y de la Política de Tratamiento de Datos.
3. **Dado** que se reconstruyó la base de datos, **cuando** se consultan los datos de prueba, **entonces** existen las academias A y B, cada una con su owner, su sede principal y su suscripción Free.
4. **Dado** que la base de datos ya existe, **cuando** se reconstruye de nuevo, **entonces** el resultado es idéntico al anterior.

---

### Historia 2 - Aislamiento entre academias (Prioridad: P1)

Como equipo de desarrollo, necesito que la propia base de datos garantice que un usuario solo accede a los datos de su academia, para que ninguna funcionalidad posterior pueda exponer datos de otro tenant aunque el frontend falle o se omita.

**Motivo de prioridad**: El aislamiento entre academias es el requisito de seguridad central del SaaS (principios VI y VIII).

**Prueba independiente**: Con las academias A y B del seed, se ejecutan las pruebas automáticas de aislamiento sobre todas las entidades protegidas.

**Referencia**: CA-002, CA-003 y CA-005 de T-00.

**Escenarios de aceptación**:

1. **Dado** el owner de la academia A, **cuando** consulta cualquier entidad protegida, **entonces** solo obtiene registros de la academia A.
2. **Dado** el owner de la academia A, **cuando** intenta crear, modificar o eliminar un registro de la academia B, **entonces** la operación se rechaza.
3. **Dado** el owner de la academia A, **cuando** intenta crear un registro indicando el identificador de la academia B, **entonces** la operación se rechaza aunque el identificador sea válido.
4. **Dado** un usuario autenticado sin membresía activa, **cuando** consulta cualquier entidad de academia, **entonces** no obtiene ningún registro.
5. **Dado** que la academia A está suspendida, **cuando** su owner intenta leer o modificar sus datos, **entonces** la operación se rechaza y los datos se conservan.
6. **Dado** un usuario autenticado, **cuando** intenta crear directamente academias, membresías, suscripciones o aceptaciones legales, **entonces** la operación se rechaza.
7. **Dado** una persona sin sesión, **cuando** intenta acceder a datos de cualquier academia, **entonces** no obtiene ningún registro.

---

### Historia 3 - Registro atómico de academia (Prioridad: P1)

Como equipo de desarrollo, necesito que el registro de una nueva cuenta cree en una sola operación todo lo que necesita una academia para operar, para que nunca queden academias o cuentas a medio crear.

**Motivo de prioridad**: Es la base de HU-014 (registro de academia) y de toda la Fase 1.

**Prueba independiente**: Se registra una cuenta de prueba con datos válidos y se verifican los registros creados; después se provoca un fallo y se verifica que no queda nada creado.

**Referencia**: CA-004 de T-00; HU-014.

**Escenarios de aceptación**:

1. **Dado** un registro con nombre de la academia, nombre del owner, correo, contraseña válida y aceptación de ambos documentos legales, **cuando** se completa, **entonces** quedan creados: el perfil del owner, la academia, la membresía de owner, la suscripción Free activa, la sede principal y las dos aceptaciones legales.
2. **Dado** un registro exitoso, **cuando** se revisa la academia creada, **entonces** tiene país Colombia, zona horaria America/Bogota, estado activo, un identificador amigable único y, como correo de contacto, el correo del registro.
3. **Dado** un registro exitoso, **cuando** se revisa la sede creada, **entonces** se llama "Sede principal", es de tipo lugar de entrenamiento, es la principal y está activa.
4. **Dado** un registro exitoso, **cuando** se revisan las aceptaciones legales, **entonces** cada una indica el documento, su versión vigente y la fecha y hora del servidor.
5. **Dado** un registro al que le falta un dato obligatorio o una aceptación legal, **cuando** se intenta completar, **entonces** no se crea la cuenta ni ningún dato de academia.
6. **Dado** un registro con un nombre de academia ya existente, **cuando** se completa, **entonces** se crea una academia nueva con un identificador amigable distinto.
7. **Dado** un correo que ya pertenece a una cuenta, **cuando** se intenta registrar de nuevo, **entonces** no se crea una segunda academia.

---

### Historia 4 - Reglas de integridad del dominio (Prioridad: P2)

Como equipo de desarrollo, necesito que la base de datos haga cumplir las reglas de negocio de la Fase 1, para que ninguna funcionalidad pueda dejar los datos en un estado inválido.

**Motivo de prioridad**: Protege la consistencia de las HU de sedes, perfil y planes (HU-017, HU-029 a HU-031).

**Prueba independiente**: Se intenta violar cada regla con datos de prueba y se comprueba que la base de datos lo impide.

**Escenarios de aceptación**:

1. **Dado** una academia, **cuando** se intenta dejarla sin sede principal o con más de una, **entonces** la operación se rechaza.
2. **Dado** la sede principal, **cuando** se intenta desactivarla o eliminarla, **entonces** la operación se rechaza.
3. **Dado** una sede inactiva, **cuando** se intenta marcarla como principal, **entonces** la operación se rechaza.
4. **Dado** una academia, **cuando** se intenta registrar una sede con un nombre ya usado por otra sede no eliminada (sin distinguir mayúsculas), **entonces** la operación se rechaza; **y** el nombre de una sede eliminada puede reutilizarse.
5. **Dado** una academia, **cuando** se intenta asignarle un segundo owner o una segunda suscripción activa, **entonces** la operación se rechaza.
6. **Dado** una persona que ya pertenece a una academia, **cuando** se intenta vincularla a otra, **entonces** la operación se rechaza.
7. **Dado** una aceptación legal registrada, **cuando** se intenta modificarla o eliminarla, **entonces** la operación se rechaza.
8. **Dado** el owner de una academia, **cuando** intenta modificar el estado, el identificador amigable, el país o la zona horaria de su academia, **entonces** la operación se rechaza; **y** puede modificar nombre, logo y datos de contacto.

---

### Historia 5 - Almacenamiento de archivos aislado (Prioridad: P2)

Como equipo de desarrollo, necesito que el almacenamiento de archivos respete el aislamiento entre academias y los límites de tipo y tamaño, para que el logo de la academia (HU-017) y los archivos futuros se guarden de forma segura y portable.

**Motivo de prioridad**: Necesario para HU-017; menos crítico que el aislamiento de datos.

**Prueba independiente**: Con los owners de A y B se intentan subidas válidas e inválidas en ambos espacios de almacenamiento.

**Referencia**: CA-006 de T-00; ADR-013.

**Escenarios de aceptación**:

1. **Dado** el owner de la academia A, **cuando** sube una imagen permitida dentro del espacio de su academia, **entonces** la subida se acepta y queda registrada con su clave relativa, tipo, tamaño y autor.
2. **Dado** el owner de la academia A, **cuando** intenta subir un archivo al espacio de la academia B, **entonces** la subida se rechaza.
3. **Dado** un archivo de tipo no permitido o mayor al tamaño máximo, **cuando** se intenta subir, **entonces** la subida se rechaza.
4. **Dado** un logo subido al espacio público, **cuando** cualquier persona lo solicita, **entonces** puede leerlo.
5. **Dado** un archivo del espacio privado, **cuando** lo solicita alguien que no es miembro de la academia, **entonces** no puede leerlo.

---

### Historia 6 - Autenticación local configurada (Prioridad: P3)

Como equipo de desarrollo, necesito que el entorno local aplique las mismas reglas de autenticación que producción, para probar el registro, la verificación de correo y la recuperación de contraseña sin enviar correos reales.

**Motivo de prioridad**: Habilita las pruebas de HU-001, HU-014 y HU-016, pero no bloquea las demás historias de esta spec.

**Prueba independiente**: Se registra una cuenta en local y se comprueba que no puede iniciar sesión hasta verificar el correo, cuyo mensaje queda capturado localmente.

**Referencia**: ADR-014.

**Escenarios de aceptación**:

1. **Dado** una cuenta recién registrada, **cuando** intenta iniciar sesión sin verificar su correo, **entonces** no puede acceder.
2. **Dado** un registro o una recuperación de contraseña en local, **cuando** se envía el correo, **entonces** queda capturado en el entorno local y no se entrega a ningún destinatario real.
3. **Dado** una contraseña de menos de 8 caracteres, **cuando** se intenta registrar una cuenta, **entonces** el registro se rechaza.
4. **Dado** una sesión iniciada, **cuando** pasa una hora sin renovarse, **entonces** su credencial de acceso deja de ser válida.

---

### Casos límite

- El correo del registro contiene mayúsculas o espacios: se normaliza antes de usarlo como correo de contacto.
- Dos registros simultáneos con el mismo nombre de academia: ambos obtienen identificadores amigables distintos (se garantiza por diseño; no se prueba de forma automática).
- El seed se ejecuta sobre una base de datos que ya tiene datos: la reconstrucción parte siempre de cero, sin duplicados.
- Una membresía desactivada: el usuario deja de acceder a los datos de su academia sin que estos se eliminen.
- Un archivo con una ruta que no comienza por el identificador de una academia: la subida se rechaza.
- Un documento legal sin versión vigente al momento del registro: el registro falla completo y no deja datos parciales.
- Una sede eliminada lógicamente: no se devuelve en las consultas habituales, pero sus datos se conservan.

## Requisitos *(mandatory)*

### Requisitos funcionales

**Entorno y reproducibilidad**

- **FR-001**: El entorno local DEBE poder reconstruirse completamente desde cero con un único procedimiento, aplicando todas las definiciones versionadas del modelo y el seed.
- **FR-002**: Todas las definiciones del modelo (entidades, reglas, funciones, políticas y almacenamiento) DEBEN estar versionadas en el repositorio; ningún cambio de esquema DEBE depender de acciones manuales.
- **FR-003**: La reconstrucción DEBE cargar los planes Free, Pro y Advanced (Free sin límites) y una versión vigente de cada documento legal.
- **FR-004**: El seed DEBE crear dos academias de prueba (A y B), cada una con su owner, su sede principal y su suscripción Free, con datos ficticios y reproducibles.

**Modelo de datos**

- **FR-005**: El sistema DEBE implementar las entidades de la Fase 1 definidas en `docs/architecture/database-schema.md`, con sus atributos, valores por defecto, restricciones e índices.
- **FR-006**: Cada entidad perteneciente a una academia DEBE registrar a qué academia pertenece y DEBE impedir relaciones con registros de otra academia.
- **FR-007**: Las entidades de negocio DEBEN usar borrado lógico; ningún registro de negocio DEBE eliminarse físicamente desde la aplicación.
- **FR-008**: El sistema DEBE mantener automáticamente las fechas de creación y última modificación.

**Autorización y aislamiento**

- **FR-009**: El sistema DEBE determinar la academia de un usuario exclusivamente a partir de su membresía, nunca a partir de datos enviados por el cliente.
- **FR-010**: El sistema DEBE permitir el acceso a datos de una academia solo a usuarios con membresía activa en una academia activa.
- **FR-011**: El sistema DEBE ofrecer funciones reutilizables para comprobar la membresía, obtener la academia actual y comprobar el rol, de modo que las reglas de acceso no repitan esa lógica.
- **FR-012**: Toda entidad protegida DEBE tener reglas de acceso para lectura, creación, modificación y eliminación según la matriz de `docs/architecture/database-schema.md`.
- **FR-013**: Las entidades creadas por el registro (academias, membresías, suscripciones y aceptaciones legales) NO DEBEN aceptar creación directa por parte del cliente.
- **FR-014**: El owner NO DEBE poder modificar el estado, el identificador amigable, el país ni la zona horaria de su academia.

**Registro atómico**

- **FR-015**: Al crearse una cuenta, el sistema DEBE crear en una única transacción: perfil, academia, membresía de owner, suscripción Free activa, sede principal y una aceptación por cada documento legal vigente.
- **FR-016**: Si cualquier parte del registro falla, el sistema DEBE revertir la operación completa, incluida la cuenta.
- **FR-017**: El registro DEBE exigir nombre de la academia, nombre del owner y la aceptación de ambos documentos legales.
- **FR-018**: El sistema DEBE generar un identificador amigable único para cada academia, aunque su nombre se repita.
- **FR-019**: La academia DEBE crearse con país Colombia, zona horaria America/Bogota, estado activo y el correo del registro como correo de contacto.
- **FR-020**: La sede principal DEBE crearse con el nombre "Sede principal", tipo lugar de entrenamiento, activa.
- **FR-021**: Cada aceptación legal DEBE registrar el documento, su versión y la fecha y hora del servidor.

**Reglas de integridad**

- **FR-022**: Cada academia DEBE tener exactamente una sede principal, que DEBE estar activa y no eliminada.
- **FR-023**: El nombre de una sede DEBE ser único dentro de su academia entre las sedes no eliminadas, sin distinguir mayúsculas.
- **FR-024**: Cada academia DEBE tener exactamente un owner y como máximo una suscripción activa.
- **FR-025**: Una persona DEBE pertenecer como máximo a una academia.
- **FR-026**: Las aceptaciones legales NO DEBEN poder modificarse ni eliminarse.
- **FR-027**: Solo DEBE existir una versión vigente por tipo de documento legal.

**Almacenamiento**

- **FR-028**: El sistema DEBE ofrecer un espacio de almacenamiento público (logos) y uno privado (archivos sensibles futuros).
- **FR-029**: Solo los miembros de una academia DEBEN poder escribir en el espacio de esa academia, identificado por el primer segmento de la ruta.
- **FR-030**: El espacio público DEBE aceptar solo imágenes JPG o PNG de hasta 1 MB.
- **FR-031**: Cada archivo DEBE registrarse con su clave relativa (sin dominio ni proveedor), tipo, tamaño, autor y entidad asociada.

**Autenticación local**

- **FR-032**: El entorno local DEBE exigir verificación de correo antes del primer acceso.
- **FR-033**: El entorno local DEBE exigir contraseñas de al menos 8 caracteres.
- **FR-034**: La credencial de acceso de una sesión DEBE caducar a la hora si no se renueva.
- **FR-035**: Los correos de autenticación del entorno local DEBEN quedar capturados localmente sin enviarse a destinatarios reales.

**Verificación**

- **FR-036**: El sistema DEBE incluir pruebas automáticas que verifiquen, para cada entidad protegida, el acceso permitido dentro de la propia academia y el rechazo de cualquier acceso a otra academia.
- **FR-037**: Las pruebas automáticas DEBEN cubrir el registro atómico (éxito y fallo), las reglas de integridad, la academia suspendida y el almacenamiento.
- **FR-038**: El repositorio NO DEBE contener secretos, claves privilegiadas ni credenciales reales.

### Entidades principales

Definidas en detalle en `docs/architecture/database-schema.md` (Fase 1):

- **Plan**: nivel de servicio (Free, Pro, Advanced) con sus límites; global.
- **Documento legal**: versión de los Términos y Condiciones o de la Política de Tratamiento de Datos; global.
- **Perfil**: datos personales del usuario autenticado; independiente de la academia.
- **Academia**: el tenant; nombre, identificador amigable, estado, país, zona horaria, logo y contacto.
- **Suscripción**: plan contratado por una academia.
- **Membresía**: pertenencia de un usuario a una academia, con su rol (owner) y estado.
- **Sede**: lugar físico de la academia; una es la principal.
- **Archivo**: registro de un archivo almacenado de forma portable, perteneciente a una academia.
- **Aceptación legal**: registro auditado e inmutable de que un usuario aceptó una versión de un documento legal.

## Criterios de éxito *(mandatory)*

### Resultados medibles

- **SC-001**: El entorno local completo se reconstruye desde cero en menos de 5 minutos con un único procedimiento.
- **SC-002**: Dos reconstrucciones consecutivas producen el mismo modelo y los mismos datos de prueba.
- **SC-003**: El 100% de las entidades protegidas tiene pruebas automáticas de aislamiento, y el 100% de esas pruebas pasa.
- **SC-004**: En el 100% de los casos de fallo provocado durante el registro, no queda ningún dato parcial.
- **SC-005**: El 100% de las reglas de integridad de la Historia 4 se rechaza al intentar violarlas.
- **SC-006**: Una revisión del repositorio no encuentra ningún secreto ni credencial privilegiada.
- **SC-007**: La spec de base del frontend (002) y las HU de la Fase 1 pueden desarrollarse sin cambios en el modelo de esta spec, salvo los que surjan de nuevas decisiones de producto.

## Supuestos

- El entorno se ejecuta en local con Supabase CLI sobre Docker; no se usa un proyecto en la nube en esta spec.
- Las pruebas de base de datos se escriben con pgTAP (`docs/engineering/testing.md`).
- Los documentos legales iniciales son versiones de prueba (`2026-10-v1`) con URL provisional; su texto definitivo queda fuera de esta spec.
- En el MVP no se capturan la IP ni el navegador en las aceptaciones legales (DEC-29, decidido en `research.md` R4); esos campos quedan vacíos.
- El SMTP propio no aplica en local: los correos se capturan en el entorno local (ADR-014).
- La limpieza de registros no verificados y las tablas de la Fase 2 quedan fuera de alcance.
- El criterio CA-007 de T-00 (configuración del frontend sin secretos) se cubre en esta spec solo en lo relativo al repositorio (FR-038); la configuración del frontend corresponde a la spec 002.
