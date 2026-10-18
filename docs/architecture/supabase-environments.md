# Supabase Environments

## Propósito

Define la estrategia de ambientes de Supabase utilizada por PlayerTech durante el desarrollo, pruebas y evolución del producto.

El objetivo es mantener separados los datos, configuraciones y cambios de cada ambiente, permitiendo desarrollar y validar nuevas funcionalidades sin afectar otros ambientes.

---

## Ambientes

PlayerTech utilizará ambientes independientes de Supabase según la etapa del ciclo de desarrollo.

Conceptualmente:

```text
Development
    │
    ▼
Supabase Development
    │
    ▼
Testing / Validation
    │
    ▼
Supabase Production
```

La cantidad concreta de ambientes podrá evolucionar según las necesidades del proyecto.

---

## Development

El ambiente de desarrollo se utiliza para:

- desarrollo de funcionalidades;
- ejecución de migrations;
- pruebas locales;
- datos de prueba;
- experimentación controlada.

El desarrollo local debe conectarse únicamente al proyecto Supabase correspondiente al ambiente de desarrollo.

Los datos de desarrollo no deben considerarse datos reales de producción.

---

## Testing

Cuando exista un ambiente independiente de pruebas, este se utilizará para:

- validar funcionalidades integradas;
- ejecutar pruebas de aceptación;
- verificar migrations;
- validar políticas de seguridad;
- comprobar aislamiento entre tenants.

El ambiente de pruebas debe utilizar datos controlados y reproducibles.

---

## Entorno de pruebas en la nube (actual)

Desde la spec 008 (habilitador T-02) existe un proyecto de Supabase en la nube para pruebas del equipo, sin academias reales y sin el seed, con el frontend en Vercel. Las migraciones se aplican con `npm run db:push` y la configuración del frontend llega por variables de entorno. Guía: `docs/engineering/deployment.md`.

---

## Production

El ambiente de producción contiene los datos reales utilizados por las academias.

Las modificaciones sobre producción deben realizarse mediante cambios versionados y controlados.

No se deben realizar cambios manuales en el esquema de producción como mecanismo principal de evolución.

---

## Configuración

La configuración específica de cada ambiente debe mantenerse separada del código de aplicación.

El frontend utilizará únicamente valores públicos necesarios para conectarse con Supabase.

No deben almacenarse en el repositorio:

- claves privadas;
- service role keys;
- credenciales administrativas;
- secretos;
- tokens sensibles.

Las variables de entorno deben utilizarse para proporcionar la configuración correspondiente a cada ambiente.

---

## Migrations

Las modificaciones del esquema de Supabase deben realizarse mediante migrations versionadas.

Conceptualmente:

```text
Migration
    ↓
Development
    ↓
Testing
    ↓
Production
```

Una migration aplicada en un ambiente debe poder reproducirse en los ambientes posteriores.

Las migrations constituyen la fuente versionada de evolución del esquema.

Consultar:

`docs/architecture/supabase-migrations-guide.md`

---

## Seed y datos de prueba

Los datos necesarios para desarrollo y pruebas deben poder generarse de forma reproducible.

Los seeds no deben depender de datos reales de producción.

Los datos utilizados para validar multi-tenancy deben permitir comprobar como mínimo:

```text
Academy A
 ├── User A
 └── Business Data A

Academy B
 ├── User B
 └── Business Data B
```

y verificar que:

```text
User A → puede acceder a Academy A
User A → no puede acceder a Academy B
```

---

## Multi-Tenant

Todos los ambientes deben conservar el mismo modelo multi-tenant definido por PlayerTech.

La separación entre ambientes y la separación entre tenants son conceptos diferentes:

```text
Environment
    │
    ├── Development
    ├── Testing
    └── Production

Tenant
    │
    ├── Academy A
    ├── Academy B
    └── Academy C
```

El aislamiento entre tenants debe mantenerse independientemente del ambiente.

Las políticas de RLS y los mecanismos de autorización deben validarse en los ambientes correspondientes.

---

## Frontend

La aplicación Angular no debe contener configuraciones específicas de un único ambiente directamente en el código fuente.

El entorno determina los valores de configuración utilizados para conectarse con Supabase.

Conceptualmente:

```text
Angular
   │
   ▼
Environment Configuration
   │
   ├── Supabase URL
   └── Supabase public key
```

La configuración sensible nunca debe exponerse al frontend.

---

## Reglas

> Cada ambiente debe utilizar su propio proyecto/configuración de Supabase cuando la separación de datos lo requiera.

> Las migrations son el mecanismo principal para evolucionar el esquema.

> Los datos de desarrollo y pruebas deben ser controlados y reproducibles.

> Las credenciales y secretos no deben almacenarse en el repositorio.

> El modelo multi-tenant y sus mecanismos de aislamiento deben mantenerse en todos los ambientes.

> Producción no debe utilizarse como ambiente de desarrollo o experimentación.

---

## Relación con otros documentos

- `docs/architecture/supabase.md`
- `docs/architecture/supabase-migrations-guide.md`
- `docs/architecture/data.md`
- `docs/engineering/security.md`
- `docs/engineering/testing.md`