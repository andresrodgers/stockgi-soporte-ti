# Portal de Soporte TI StockGI

## Objetivo

Crear una aplicacion web privada, sencilla y responsive para que empleados internos, empleados de contratos y personal de clientes puedan registrar solicitudes de soporte TI, adjuntar evidencias y consultar el seguimiento de sus propios tickets.

El equipo de TI podra gestionar, resolver, cerrar y analizar los tickets segun contrato, categoria, prioridad y responsable.

## Alcance de la primera version

La primera version debe enfocarse en:

- Login por contrato, cedula y contrasena.
- Creacion individual y carga masiva de usuarios por CSV.
- Registro de tickets con categoria, descripcion y adjuntos.
- Priorizacion definida por categorias y/o por TI.
- Seguimiento del ticket por comentarios y cambios de estado.
- Panel operativo para TI.
- Panel administrativo para usuarios, contratos, catalogo de categorias y reportes.
- Uso desde computador y celular.

No se incluye en primera version:

- Notificaciones por correo.
- Encuesta de satisfaccion.
- Aplicacion movil nativa.
- Visibilidad de tickets de otros usuarios.

## Contexto organizacional

StockGI es la empresa matriz o principal. Bajo esta empresa existen contratos, operaciones o clientes especificos donde trabajan usuarios que tambien requieren soporte TI.

El sistema debe permitir segmentar cada usuario y cada ticket por contrato, para saber desde donde se solicita el soporte y medir el comportamiento por operacion.

## Roles

### Usuario

Persona que solicita soporte.

Puede:

- Iniciar sesion seleccionando contrato, cedula y contrasena.
- Crear tickets.
- Adjuntar imagenes o PDF.
- Ver solo sus propios tickets.
- Consultar estado, historial y comentarios.
- Responder comentarios cuando TI solicite informacion.

No puede:

- Ver tickets de otros usuarios.
- Definir prioridad final del ticket.
- Asignar responsables.
- Cerrar tickets.

### TI Operativo

Persona encargada de atender y resolver tickets.

Puede:

- Ver tickets asignados o pendientes de asignacion, segun configuracion.
- Cambiar estados del ticket.
- Agregar comentarios internos o visibles al usuario.
- Solicitar informacion adicional.
- Cambiar prioridad si tiene permiso.
- Registrar solucion.
- Cerrar el ticket como resuelto.

### TI Administrativo

Persona que administra la plataforma y controla la operacion.

Puede:

- Crear, editar, activar y desactivar usuarios.
- Crear usuarios uno a uno.
- Importar usuarios por CSV.
- Restablecer contrasenas.
- Crear y administrar contratos.
- Consultar el catalogo funcional de categorias.
- Corregir categoria, tipo de solicitud, prioridad y SLA de tickets cuando aplique.
- Asignar tickets a TI operativo.
- Ver todos los tickets.
- Consultar reportes e indicadores.

## Login

Campos:

- Contrato.
- Cedula.
- Contrasena.

Regla:

- La misma cedula podria existir en mas de un contrato si una persona cambia de operacion o presta servicios en diferentes contratos. Por eso el contrato hace parte del acceso.

## Datos del usuario

Campos minimos:

- Contrato.
- Cedula.
- Nombre completo.
- Correo, opcional en primera version.
- Telefono, opcional.
- Cargo, opcional.
- Area, opcional.
- Sede o ubicacion, opcional.
- Rol.
- Estado: activo o inactivo.
- Fecha de creacion.

## Contratos

Campos minimos:

- Nombre del contrato.
- Cliente o empresa relacionada.
- Codigo interno, opcional.
- Estado: activo o inactivo.
- Fecha de inicio, opcional.
- Fecha de fin, opcional.

## Creacion de tickets

Campos visibles para el usuario:

- Categoria.
- Asunto.
- Descripcion del problema.
- Adjuntos: imagenes o PDF.

Campos que el sistema toma automaticamente:

- Usuario solicitante.
- Cedula.
- Contrato.
- Fecha y hora de creacion.
- Estado inicial.
- Prioridad inicial segun categoria.
- SLA segun categoria y prioridad.

Campos que gestiona TI:

- Responsable.
- Prioridad, si se permite ajustar.
- Estado.
- Comentarios.
- Diagnostico.
- Solucion aplicada.
- Tiempo invertido, opcional.
- Fecha de cierre.

## Estados del ticket

- Nuevo: ticket creado por el usuario.
- Asignado: ticket con responsable TI.
- En proceso: TI esta trabajando en la solucion.
- Esperando informacion: TI requiere respuesta del usuario.
- Resuelto: TI soluciono el caso.
- Cerrado: ticket finalizado por TI.
- Reabierto: ticket vuelve a proceso porque la solucion no fue suficiente.
- Cancelado: ticket anulado por error o solicitud no procedente.

## Categorias iniciales

Las categorias de tickets seran generales y quedaran definidas desde el diseno funcional del sistema. El administrador no debe crear categorias libremente en la primera version.

El usuario seleccionara una categoria general y luego un tipo de solicitud. La prioridad y el SLA se asignaran automaticamente segun ese tipo de solicitud.

Las categorias deben ser claras para el usuario y utiles para TI.

### Accesos y contrasenas

Ejemplos:

- Olvido de contrasena.
- Bloqueo de usuario.
- Solicitud de acceso a sistema.
- Cambio de permisos.

Prioridad sugerida: media.

### Equipos de computo

Ejemplos:

- Computador lento.
- Equipo no enciende.
- Problemas con teclado, mouse, pantalla o cargador.
- Requerimiento de mantenimiento.

Prioridad sugerida: media.

### Internet y red

Ejemplos:

- Sin conexion a internet.
- Problemas de red local.
- Lentitud de conexion.
- Falla de VPN, si aplica.

Prioridad sugerida: alta cuando afecta operacion; media en casos individuales.

### Impresoras y escaner

Ejemplos:

- No imprime.
- Error de configuracion.
- Atasco o falla del equipo.
- Escaner no funciona.

Prioridad sugerida: baja o media.

### Correo electronico

Ejemplos:

- No recibe o no envia correos.
- Configuracion de correo.
- Problemas con firma.
- Buzon lleno.

Prioridad sugerida: media.

### Software y aplicaciones

Ejemplos:

- Error en programa instalado.
- Instalacion de software autorizado.
- Actualizacion requerida.
- Falla en aplicacion interna.

Prioridad sugerida: media.

### Sistemas internos StockGI / SLI

Ejemplos:

- Error en SLI.
- Problema de acceso.
- Falla de modulo.
- Solicitud relacionada con plataforma interna.

Prioridad sugerida: alta si afecta operacion critica; media si es individual.

### Telefonia y comunicacion

Ejemplos:

- Falla de extension.
- Problemas con celular corporativo.
- Problemas con herramientas de comunicacion.

Prioridad sugerida: media.

### Solicitud de equipo o recurso TI

Ejemplos:

- Solicitud de computador.
- Solicitud de periferico.
- Solicitud de licencia.
- Solicitud de cuenta o recurso nuevo.

Prioridad sugerida: baja o media.

### Otro

Categoria de respaldo cuando el usuario no encuentra una opcion adecuada.

Prioridad sugerida: baja hasta revision de TI.

## Prioridades

La prioridad no debe ser definida libremente por el usuario. Debe salir de la categoria o ser ajustada por TI.

### Baja

No detiene la operacion. Puede esperar atencion programada.

Ejemplo: solicitud de instalacion no urgente, consulta o ajuste menor.

### Media

Afecta a un usuario o proceso, pero existe alternativa temporal.

Ejemplo: problema de correo individual, impresora secundaria, equipo lento.

### Alta

Afecta una actividad operativa importante o impide trabajar a un usuario clave.

Ejemplo: usuario sin acceso a sistema critico, falla de red en sede pequena, equipo principal sin funcionar.

### Critica

Afecta a varios usuarios, una operacion completa o un sistema esencial.

Ejemplo: caida de sistema interno, sin internet en operacion, falla que detiene atencion o produccion.

## SLA sugerido

Los SLA pueden ajustarse por contrato o por categoria.

- Critica: primera respuesta 30 minutos, solucion objetivo 4 horas.
- Alta: primera respuesta 1 hora, solucion objetivo 8 horas.
- Media: primera respuesta 4 horas, solucion objetivo 2 dias habiles.
- Baja: primera respuesta 1 dia habil, solucion objetivo 5 dias habiles.

## Reportes

Reportes para TI Administrativo:

- Tickets creados por rango de fechas.
- Tickets por contrato.
- Tickets por categoria.
- Tickets por estado.
- Tickets por prioridad.
- Tickets por responsable TI.
- Tiempo promedio de respuesta.
- Tiempo promedio de solucion.
- Tickets vencidos por SLA.
- Tickets abiertos vs cerrados.

## Pantallas principales

### Usuario

- Login.
- Crear ticket.
- Mis tickets.
- Detalle del ticket.
- Mi perfil basico.

### TI Operativo

- Login.
- Bandeja de tickets.
- Detalle y gestion del ticket.
- Mis tickets asignados.

### TI Administrativo

- Dashboard.
- Gestion de tickets.
- Usuarios.
- Importacion por CSV.
- Contratos.
- Catalogo de categorias.
- Reportes.

## Reglas clave

- El usuario solo ve sus propios tickets.
- El contrato es obligatorio para iniciar sesion y para crear tickets.
- Todo ticket queda asociado a contrato y usuario.
- Los adjuntos permitidos son imagenes y PDF.
- TI cierra los tickets cuando los resuelve.
- No se enviaran correos en la primera version.
- La interfaz debe ser sencilla, clara y apta para celular.

## Pendientes por definir

- Lista definitiva de contratos iniciales.
- Lista definitiva de usuarios iniciales.
- Formato de CSV para importacion masiva.
- Si TI operativo ve todos los tickets o solo los asignados.
- Si los comentarios de TI pueden ser internos y publicos, o solo publicos.
- Si la prioridad puede ser ajustada por TI operativo o solo por TI administrativo.
- Si el SLA se mide en horas calendario o solo en horario laboral.
- URL final donde se publicara la aplicacion.

