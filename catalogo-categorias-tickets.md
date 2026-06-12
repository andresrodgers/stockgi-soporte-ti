# Catalogo funcional de categorias de tickets

## Criterio definido

Para la primera version, las categorias de tickets seran generales y quedaran definidas desde el diseno funcional del sistema.

El administrador no debe crear categorias libremente desde la plataforma, porque esto puede desordenar los reportes, prioridades y SLA. En primera version, el administrador podra consultar el catalogo y, si se decide habilitarlo, activar o inactivar opciones, pero no crear categorias nuevas sin ajuste funcional.

## Flujo de seleccion para el usuario

El usuario no selecciona prioridad ni SLA.

Al crear un ticket, el usuario selecciona:

1. Categoria general.
2. Tipo de solicitud.
3. Asunto.
4. Descripcion.
5. Adjuntos, si aplica.

Con la categoria y el tipo de solicitud, el sistema asigna automaticamente:

- Prioridad inicial.
- SLA de primera respuesta.
- SLA de solucion.
- Recomendacion u obligacion de adjunto.

TI puede corregir la categoria o el tipo de solicitud si el usuario selecciono una opcion incorrecta.

## Prioridades

### Baja

Solicitud que no detiene la operacion y puede atenderse de forma programada.

### Media

Afecta a un usuario o actividad puntual, pero existe alternativa temporal.

### Alta

Impide trabajar correctamente a un usuario, proceso o punto operativo relevante.

### Critica

Afecta a varios usuarios, una operacion completa o un sistema esencial.

## SLA base

- Critica: primera respuesta 30 minutos, solucion objetivo 4 horas.
- Alta: primera respuesta 1 hora, solucion objetivo 8 horas.
- Media: primera respuesta 4 horas, solucion objetivo 2 dias habiles.
- Baja: primera respuesta 1 dia habil, solucion objetivo 5 dias habiles.

## Categorias y tipos de solicitud

### 1. Accesos y contrasenas

Para bloqueos, claves, permisos y accesos a sistemas.

| Tipo de solicitud | Prioridad | Primera respuesta | Solucion objetivo | Adjunto |
| --- | --- | --- | --- | --- |
| Restablecer contrasena | Media | 4 horas | 2 dias habiles | No obligatorio |
| Usuario bloqueado | Media | 4 horas | 2 dias habiles | No obligatorio |
| Crear acceso | Media | 4 horas | 2 dias habiles | No obligatorio |
| Cambiar permisos | Media | 4 horas | 2 dias habiles | No obligatorio |
| Retirar acceso | Media | 4 horas | 2 dias habiles | No obligatorio |

### 2. Equipos de computo

Para fallas o requerimientos relacionados con computadores y perifericos basicos.

| Tipo de solicitud | Prioridad | Primera respuesta | Solucion objetivo | Adjunto |
| --- | --- | --- | --- | --- |
| Equipo no enciende | Alta | 1 hora | 8 horas | Recomendado |
| Equipo lento | Media | 4 horas | 2 dias habiles | Recomendado |
| Pantalla | Media | 4 horas | 2 dias habiles | Recomendado |
| Teclado o mouse | Media | 4 horas | 2 dias habiles | Recomendado |
| Cargador | Media | 4 horas | 2 dias habiles | Recomendado |
| Mantenimiento | Baja | 1 dia habil | 5 dias habiles | No obligatorio |

### 3. Conectividad

Para internet, red, WiFi, VPN o acceso a red interna.

| Tipo de solicitud | Prioridad | Primera respuesta | Solucion objetivo | Adjunto |
| --- | --- | --- | --- | --- |
| Sin internet | Alta | 1 hora | 8 horas | No obligatorio |
| Red lenta | Media | 4 horas | 2 dias habiles | No obligatorio |
| WiFi | Media | 4 horas | 2 dias habiles | No obligatorio |
| VPN | Alta | 1 hora | 8 horas | No obligatorio |
| No accede a red interna | Alta | 1 hora | 8 horas | No obligatorio |

### 4. Correo y comunicacion

Para correo electronico, reuniones virtuales, telefonia o celular corporativo.

| Tipo de solicitud | Prioridad | Primera respuesta | Solucion objetivo | Adjunto |
| --- | --- | --- | --- | --- |
| No envia correos | Media | 4 horas | 2 dias habiles | No obligatorio |
| No recibe correos | Media | 4 horas | 2 dias habiles | No obligatorio |
| Configuracion de correo | Media | 4 horas | 2 dias habiles | No obligatorio |
| Firma de correo | Baja | 1 dia habil | 5 dias habiles | No obligatorio |
| Teams, Meet o Zoom | Media | 4 horas | 2 dias habiles | No obligatorio |
| Telefonia o celular corporativo | Media | 4 horas | 2 dias habiles | No obligatorio |

### 5. Impresoras y escaner

Para impresion, escaneo, configuracion o insumos.

| Tipo de solicitud | Prioridad | Primera respuesta | Solucion objetivo | Adjunto |
| --- | --- | --- | --- | --- |
| No imprime | Media | 4 horas | 2 dias habiles | Recomendado |
| No escanea | Media | 4 horas | 2 dias habiles | Recomendado |
| Configuracion | Baja | 1 dia habil | 5 dias habiles | No obligatorio |
| Error de impresora | Media | 4 horas | 2 dias habiles | Recomendado |
| Solicitud de toner o insumo | Baja | 1 dia habil | 5 dias habiles | No obligatorio |

### 6. Software y sistemas internos

Para aplicaciones instaladas, sistemas corporativos, SLI y licencias.

| Tipo de solicitud | Prioridad | Primera respuesta | Solucion objetivo | Adjunto |
| --- | --- | --- | --- | --- |
| Error en aplicacion | Media | 4 horas | 2 dias habiles | Recomendado |
| Instalacion de software autorizado | Baja | 1 dia habil | 5 dias habiles | No obligatorio |
| Actualizacion | Baja | 1 dia habil | 5 dias habiles | No obligatorio |
| SLI o sistema interno | Alta | 1 hora | 8 horas | Recomendado |
| Licencia de software | Media | 4 horas | 2 dias habiles | No obligatorio |

Nota: si una falla de SLI o sistema interno afecta a varios usuarios o una operacion completa, TI puede subir la prioridad a Critica.

### 7. Recursos TI

Para solicitudes planificadas de equipos, perifericos, licencias, ingresos o retiros.

| Tipo de solicitud | Prioridad | Primera respuesta | Solucion objetivo | Adjunto |
| --- | --- | --- | --- | --- |
| Solicitud de equipo | Baja | 1 dia habil | 5 dias habiles | No obligatorio |
| Solicitud de periferico | Baja | 1 dia habil | 5 dias habiles | No obligatorio |
| Solicitud de licencia | Media | 4 horas | 2 dias habiles | No obligatorio |
| Usuario nuevo | Media | 4 horas | 2 dias habiles | No obligatorio |
| Alistamiento para ingreso | Media | 4 horas | 2 dias habiles | No obligatorio |
| Retiro de usuario | Media | 4 horas | 2 dias habiles | No obligatorio |

### 8. Otro

Para casos que no encajan en las categorias anteriores.

| Tipo de solicitud | Prioridad | Primera respuesta | Solucion objetivo | Adjunto |
| --- | --- | --- | --- | --- |
| Solicitud no clasificada | Baja | 1 dia habil | 5 dias habiles | No obligatorio |

## Reglas operativas

- El usuario no define prioridad.
- La prioridad inicial nace del tipo de solicitud.
- TI puede ajustar prioridad si el caso real lo requiere.
- TI puede corregir categoria y tipo de solicitud.
- Los reportes deben agruparse por categoria general y tipo de solicitud.
- Las categorias deben mantenerse estables para que los indicadores sean comparables.
- Los cambios al catalogo deben tratarse como ajustes funcionales del sistema, no como una configuracion libre.
