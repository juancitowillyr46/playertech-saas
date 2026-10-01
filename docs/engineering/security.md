# Security

## Propósito

Define los principios de seguridad aplicables al MVP de PlayerTech.

La seguridad debe formar parte del diseño de las funcionalidades y no tratarse únicamente como una actividad posterior.

## Authentication

El acceso administrativo utilizará autenticación mediante Supabase Auth durante el MVP.

El frontend debe mantener protegidas las rutas que requieren sesión.

Ejemplo:

```text
Public
  └── Login

Authenticated
  ├── Dashboard
  ├── Players
  ├── Activities
  └── Call-ups
```

## Authorization

La autenticación determina quién es el usuario.

La autorización determina qué datos y operaciones puede realizar.

Durante el MVP se mantendrá un modelo simple centrado en el administrador de la academia.

La evolución hacia roles y permisos avanzados queda fuera del alcance actual.

## Row Level Security

La protección de datos debe implementarse mediante Row Level Security cuando corresponda.

No se debe confiar exclusivamente en restricciones implementadas en Angular.

```text
Frontend validation
        +
Supabase RLS
        ↓
Data protection
```

## Datos sensibles

No deben almacenarse innecesariamente datos sensibles.

El MVP debe limitar la información almacenada a la necesaria para las funcionalidades definidas.

Los datos adicionales deberán justificarse por una necesidad funcional.

## Secrets

Las credenciales y secretos no deben almacenarse en el repositorio.

No deben incluirse:

```text
API keys privadas
Passwords
Service role keys
Tokens
Secrets
```

Los valores necesarios para el frontend deben gestionarse mediante la configuración correspondiente y nunca utilizar credenciales privilegiadas en el cliente.

## Supabase

El cliente frontend debe utilizar únicamente las credenciales y mecanismos destinados al acceso público/cliente.

Las claves privilegiadas de Supabase no deben exponerse en Angular.

## Enlaces de convocatoria

Los enlaces utilizados para las convocatorias deben respetar las reglas definidas funcionalmente:

- acceso temporal;
- expiración;
- asociación con una convocatoria;
- asociación con el jugador correspondiente;
- no permitir modificaciones después de registrar la respuesta.

Los detalles técnicos de implementación deberán definirse en la especificación de la funcionalidad correspondiente.

## Validación

Las validaciones del frontend mejoran la experiencia del usuario, pero no constituyen por sí mismas una frontera de seguridad.

Las restricciones importantes deben aplicarse también en la capa de datos o servicio correspondiente.

## Principio

> Ninguna funcionalidad debe asumir que una validación realizada únicamente en el frontend constituye una protección de seguridad.