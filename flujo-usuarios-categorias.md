# Flujo de usuarios

## Como comenzar

El sistema debe configurarse en este orden:

1. Crear contratos.
2. Validar que el catalogo funcional de categorias ya este cargado.
3. Crear usuarios.
4. Probar creacion de tickets con usuarios reales.

La razon es simple: el usuario necesita pertenecer a un contrato, y el ticket necesita usar una categoria del catalogo funcional ya definido. Las categorias no se crean libremente desde administracion en la primera version.

## Flujo de creacion de contratos

Antes de crear usuarios, el administrador debe crear los contratos u operaciones disponibles.

### Campos del contrato

- Nombre del contrato.
- Cliente o empresa relacionada.
- Codigo interno, opcional.
- Estado: activo o inactivo.
- Observaciones, opcional.

### Reglas

- Solo los contratos activos aparecen en el login.
- Solo los contratos activos aparecen al crear usuarios.
- No se debe eliminar un contrato si ya tiene usuarios o tickets. En ese caso se inactiva.

## Flujo de creacion de usuario uno a uno

Este flujo lo usa TI administrativo cuando necesita crear un usuario puntual.

### Paso 1: entrar a usuarios

TI administrativo ingresa al modulo `Usuarios` y selecciona `Nuevo usuario`.

### Paso 2: llenar datos basicos

Campos obligatorios:

- Contrato.
- Cedula.
- Nombre completo.
- Rol.
- Contrasena temporal.
- Estado.

Campos opcionales:

- Correo.
- Telefono.
- Area.
- Cargo.
- Sede o ubicacion.

### Paso 3: seleccionar rol

Roles disponibles:

- Usuario.
- TI operativo.
- TI administrativo.

### Paso 4: guardar usuario

Al guardar, el sistema valida:

- Que la cedula no exista ya en el mismo contrato.
- Que el contrato este activo.
- Que el rol sea valido.
- Que la contrasena temporal cumpla una regla minima.

### Paso 5: entregar acceso

El administrador informa al usuario:

- Contrato que debe seleccionar.
- Cedula.
- Contrasena temporal.

En primera version no se enviara correo automatico.

## Flujo de carga masiva por Excel

Este flujo lo usa TI administrativo para crear muchos usuarios.

### Paso 1: descargar plantilla

El sistema debe ofrecer una plantilla de Excel con columnas definidas.

### Columnas sugeridas

- contrato
- cedula
- nombre_completo
- rol
- contrasena_temporal
- correo
- telefono
- area
- cargo
- sede
- estado

### Paso 2: cargar archivo

El administrador carga el Excel desde el modulo `Importar usuarios`.

### Paso 3: validar informacion

Antes de guardar, el sistema debe mostrar:

- Usuarios validos.
- Usuarios con errores.
- Cedulas duplicadas dentro del archivo.
- Cedulas ya existentes en el mismo contrato.
- Contratos no encontrados.
- Roles invalidos.

### Paso 4: confirmar importacion

El administrador confirma la importacion solo de los registros validos.

### Paso 5: resultado

El sistema muestra:

- Total de usuarios creados.
- Total de usuarios omitidos.
- Archivo o tabla con errores para corregir.

## Reglas para usuarios

- La cedula puede repetirse en contratos diferentes.
- La cedula no puede repetirse dentro del mismo contrato.
- Un usuario inactivo no puede iniciar sesion.
- El contrato seleccionado en el login debe coincidir con el contrato del usuario.
- Los usuarios con rol `Usuario` solo ven sus propios tickets.

## Catalogo de categorias

El flujo y las reglas de categorias quedan definidos en `catalogo-categorias-tickets.md`.

Reglas principales:

- El administrador no crea categorias libremente en la primera version.
- El usuario selecciona categoria general y tipo de solicitud.
- La prioridad y el SLA se asignan automaticamente segun el tipo de solicitud.
- TI puede corregir categoria, tipo de solicitud o prioridad si el caso real lo requiere.

## Flujo recomendado para crear un ticket

1. Usuario inicia sesion con contrato, cedula y contrasena.
2. Usuario selecciona `Crear ticket`.
3. Sistema muestra datos del usuario y contrato, sin permitir editarlos.
4. Usuario selecciona categoria.
5. Sistema asigna prioridad automaticamente.
6. Usuario escribe asunto y descripcion.
7. Usuario adjunta imagen o PDF si aplica.
8. Usuario guarda el ticket.
9. Sistema crea ticket en estado `Nuevo`.
10. TI administrativo u operativo lo revisa y lo asigna.

## Pendientes de decision

- Definir lista inicial real de contratos.
- Definir horario laboral para medir SLA.
- Confirmar si TI operativo puede cambiar prioridad o solo TI administrativo.
- Confirmar si un ticket nuevo se asigna manualmente o queda visible para todos los TI operativos.
