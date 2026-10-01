# UI Architecture

## Propósito

Define las tecnologías y responsabilidades relacionadas con la interfaz visual de PlayerTech.

## Stack visual

PlayerTech utilizará:

- SakaiNG como template/base de aplicación;
- PrimeNG como biblioteca principal de componentes UI;
- Tailwind CSS para utilidades y composición de estilos;
- estilos propios de PlayerTech cuando sea necesario.

## SakaiNG

SakaiNG proporciona la base visual y estructural de la aplicación.

Se utilizará principalmente para:

- layout;
- navegación;
- estructura general;
- configuración visual;
- integración inicial de PrimeNG.

SakaiNG no debe convertirse en una dependencia conceptual de las funcionalidades del dominio.

Las funcionalidades de PlayerTech deben mantenerse independientes de la estructura interna específica del template.

## PrimeNG

PrimeNG será la biblioteca principal para componentes de interfaz.

Se utilizará cuando exista un componente adecuado para la necesidad funcional.

Ejemplos:

- Button;
- Input;
- Select;
- Table;
- Dialog;
- Toast;
- Menu;
- Calendar;
- DatePicker.

## Tailwind CSS

Tailwind CSS se utilizará para:

- composición de layouts;
- spacing;
- responsive design;
- utilidades visuales;
- ajustes específicos;
- estilos complementarios.

No se debe introducir CSS personalizado cuando una utilidad o componente existente resuelva adecuadamente la necesidad.

## Componentes propios

Cuando PrimeNG o SakaiNG no proporcionen una solución adecuada, podrán desarrollarse componentes propios.

Estos componentes deberán ubicarse según su alcance:

```text
shared/components/
```

si son reutilizables,

o dentro de:

```text
features/<feature>/
```

si pertenecen exclusivamente a una funcionalidad.

## Principio de consistencia

Las interfaces deben reutilizar los componentes y patrones existentes antes de crear nuevas variantes.

La intención es mantener una experiencia visual consistente y reducir duplicación.

## Separación UI / dominio

Los componentes visuales no deben asumir responsabilidades relacionadas con:

- acceso directo a Supabase;
- consultas SQL;
- reglas de persistencia;
- detalles de infraestructura.

La UI consume servicios y modelos definidos por la aplicación.