# Flujos de uso por rol

## Principio general

La plataforma debe ser sencilla: cada rol entra y ve solo lo que necesita para trabajar. No debe haber menus extensos ni pantallas decorativas. La navegacion debe estar enfocada en crear, atender, cerrar y analizar tickets.

## Rol Usuario

El usuario es la persona que solicita soporte. Su flujo debe ser el mas simple.

### Menu principal

- Crear ticket.
- Mis tickets.
- Mi perfil.
- Cerrar sesion.

### Flujo de ingreso

1. El usuario abre la URL privada del portal.
2. Selecciona el contrato al que pertenece.
3. Digita cedula.
4. Digita contrasena.
5. Ingresa al panel de usuario.

### Pantalla inicial del usuario

Al entrar, el usuario ve:

- Boton principal: `Crear ticket`.
- Resumen simple:
  - Tickets abiertos.
  - Tickets en proceso.
  - Tickets resueltos o cerrados.
- Lista de sus tickets recientes.

### Flujo para crear ticket

1. Usuario selecciona `Crear ticket`.
2. El sistema muestra sus datos basicos:
   - Nombre.
   - Cedula.
   - Contrato.
3. El usuario selecciona categoria.
4. El sistema asigna prioridad automaticamente segun categoria.
5. El usuario escribe asunto.
6. El usuario escribe descripcion del problema.
7. El usuario adjunta imagen o PDF, si aplica.
8. El usuario confirma y envia.
9. El sistema muestra numero de ticket y estado `Nuevo`.

### Flujo para consultar tickets

1. Usuario entra a `Mis tickets`.
2. Ve una lista con:
   - Numero de ticket.
   - Asunto.
   - Categoria.
   - Estado.
   - Fecha de creacion.
3. Puede filtrar por estado:
   - Todos.
   - Abiertos.
   - En proceso.
   - Resueltos.
   - Cerrados.
4. Selecciona un ticket.
5. Ve el detalle:
   - Informacion del caso.
   - Estado actual.
   - Comentarios de TI.
   - Adjuntos.
   - Historial.

### Flujo para responder a TI

1. TI cambia el ticket a `Esperando informacion`.
2. Usuario entra al detalle del ticket.
3. Escribe respuesta.
4. Puede adjuntar imagen o PDF adicional.
5. Envia respuesta.
6. El ticket vuelve a quedar disponible para TI.

### Restricciones del usuario

- Solo ve sus propios tickets.
- No puede cambiar prioridad.
- No puede cambiar responsable.
- No puede cerrar tickets.
- No puede ver reportes.
- No puede administrar usuarios, contratos ni categorias.

## Rol TI Operativo

TI operativo es quien atiende y resuelve tickets.

### Menu principal

- Bandeja de tickets.
- Mis tickets asignados.
- Tickets en espera.
- Historial.
- Cerrar sesion.

### Flujo de ingreso

1. Ingresa a la URL privada.
2. Selecciona contrato, si su usuario esta asociado a un contrato especifico.
3. Digita cedula.
4. Digita contrasena.
5. Ingresa al panel operativo.

Nota: si TI operativo atiende todos los contratos, el sistema puede permitirle entrar con un contrato administrativo o global.

### Pantalla inicial de TI operativo

Al entrar, ve una bandeja de trabajo con:

- Tickets nuevos.
- Tickets asignados a el.
- Tickets en proceso.
- Tickets esperando informacion.
- Tickets vencidos o proximos a vencer por SLA.

### Flujo para tomar o recibir un ticket

Opcion A: asignacion manual por TI administrativo.

1. TI administrativo asigna el ticket.
2. TI operativo lo ve en `Mis tickets asignados`.
3. TI operativo abre el ticket.
4. Cambia estado a `En proceso`.

Opcion B: bandeja compartida.

1. TI operativo entra a `Bandeja de tickets`.
2. Abre un ticket nuevo.
3. Selecciona `Tomar ticket`.
4. El ticket queda asignado a ese tecnico.
5. Cambia estado a `En proceso`.

### Flujo para gestionar ticket

1. TI operativo abre el ticket.
2. Revisa:
   - Usuario solicitante.
   - Contrato.
   - Categoria.
   - Prioridad.
   - SLA.
   - Descripcion.
   - Adjuntos.
   - Historial.
3. Agrega comentario de avance.
4. Si necesita informacion, cambia estado a `Esperando informacion`.
5. Si esta trabajando el caso, mantiene estado `En proceso`.
6. Si soluciona el caso, registra:
   - Diagnostico.
   - Solucion aplicada.
   - Comentario final.
7. Cambia estado a `Resuelto` o `Cerrado`, segun regla definida.

### Flujo para resolver y cerrar

Primera version recomendada:

1. TI operativo registra solucion.
2. TI operativo marca el ticket como `Cerrado`.
3. El sistema guarda fecha de cierre.
4. El ticket queda visible para el usuario en su historial.

### Acciones disponibles para TI operativo

- Ver tickets.
- Tomar ticket, si aplica.
- Cambiar estado.
- Agregar comentarios.
- Adjuntar evidencias tecnicas.
- Solicitar informacion.
- Registrar solucion.
- Cerrar ticket.
- Cambiar prioridad, solo si se autoriza.

### Restricciones de TI operativo

- No administra usuarios.
- No crea contratos.
- No crea categorias.
- No ve configuraciones generales.
- No modifica contrasenas de otros usuarios, salvo que se autorice como funcion puntual.

## Rol TI Administrativo

TI administrativo controla la plataforma, la configuracion y el seguimiento.

### Menu principal

- Dashboard.
- Tickets.
- Usuarios.
- Carga masiva.
- Contratos.
- Catalogo de categorias.
- Reportes.
- Configuracion.
- Cerrar sesion.

### Flujo de ingreso

1. Ingresa a la URL privada.
2. Digita credenciales.
3. Ingresa al panel administrativo.

Nota: para este rol se puede mantener el mismo login con contrato, cedula y contrasena, o crear un contrato administrativo llamado `StockGI Administracion`.

### Pantalla inicial administrativa

Al entrar, ve un dashboard con:

- Tickets abiertos.
- Tickets nuevos.
- Tickets vencidos por SLA.
- Tickets cerrados del mes.
- Tiempo promedio de solucion.
- Tickets por contrato.
- Tickets por categoria.
- Rendimiento por tecnico.

### Flujo para administrar tickets

1. Entra a `Tickets`.
2. Ve todos los tickets.
3. Filtra por:
   - Contrato.
   - Estado.
   - Categoria.
   - Prioridad.
   - Responsable.
   - Fecha.
4. Abre un ticket.
5. Puede:
   - Asignar responsable.
   - Cambiar prioridad.
   - Cambiar categoria.
   - Cambiar estado.
   - Agregar comentario.
   - Cerrar ticket.

### Flujo para crear usuario uno a uno

1. Entra a `Usuarios`.
2. Selecciona `Nuevo usuario`.
3. Llena:
   - Contrato.
   - Cedula.
   - Nombre completo.
   - Rol.
   - Contrasena temporal.
   - Estado.
4. Guarda usuario.
5. Entrega al usuario:
   - Contrato.
   - Cedula.
   - Contrasena temporal.

### Flujo para cargar usuarios por CSV

1. Entra a `Carga masiva`.
2. Descarga plantilla.
3. Llena usuarios en la plantilla CSV.
4. Carga archivo.
5. El sistema valida registros.
6. El administrador revisa errores.
7. Confirma importacion de registros validos.
8. El sistema muestra resumen de carga.

### Flujo para administrar contratos

1. Entra a `Contratos`.
2. Ve listado de contratos activos e inactivos.
3. Puede crear nuevo contrato.
4. Puede editar contrato.
5. Puede inactivar contrato.

Regla: no se eliminan contratos con historial; se inactivan.

### Flujo para consultar catalogo de categorias

1. Entra a `Catalogo de categorias`.
2. Ve las categorias generales y tipos de solicitud definidos para el sistema.
3. Consulta la prioridad inicial, SLA y regla de adjuntos de cada tipo de solicitud.
4. Puede usar esta informacion para corregir tickets mal clasificados.

Regla: en primera version, el administrador no crea categorias libremente. Las categorias quedan definidas desde el diseno funcional para conservar orden en reportes, prioridades y SLA.

### Flujo para reportes

1. Entra a `Reportes`.
2. Selecciona rango de fechas.
3. Aplica filtros:
   - Contrato.
   - Categoria.
   - Tecnico.
   - Estado.
   - Prioridad.
4. Consulta indicadores.
5. Exporta a CSV, si se requiere.

### Acciones disponibles para TI administrativo

- Ver todos los tickets.
- Asignar tickets.
- Cambiar categoria, prioridad y estado.
- Crear y editar usuarios.
- Importar usuarios por CSV.
- Restablecer contrasenas.
- Crear y editar contratos.
- Consultar catalogo de categorias.
- Consultar reportes.
- Exportar informacion.

## Flujo general del ticket

1. Usuario crea ticket.
2. Ticket queda en estado `Nuevo`.
3. TI administrativo o TI operativo lo toma/asigna.
4. Ticket pasa a `Asignado`.
5. TI operativo lo trabaja en estado `En proceso`.
6. Si falta informacion, pasa a `Esperando informacion`.
7. Usuario responde.
8. TI continua gestion.
9. TI registra solucion.
10. TI cierra ticket.
11. Usuario puede consultar el ticket cerrado en su historial.

## Decision recomendada para primera version

Para hacerlo sencillo:

- TI operativo puede ver tickets nuevos y tomar casos.
- TI administrativo tambien puede asignar tickets manualmente.
- TI operativo puede cerrar tickets.
- TI administrativo puede corregir categoria y prioridad.
- TI operativo puede sugerir o cambiar prioridad solo si se le da permiso.
- Los comentarios pueden ser visibles al usuario en primera version.
- Los comentarios internos pueden dejarse para una segunda version.

