# Modelo tecnico de base de datos Supabase - StockGI Soporte TI

> Estado actualizado 2026-06-11: este documento queda como referencia tecnica historica y como base SQL migrable. La decision vigente de produccion cambio a PostgreSQL local en la VM Ubuntu + storage privado local/MinIO + Cloudflare Tunnel. No se esperara Supabase Pro para avanzar.

## Objetivo

Definir el modelo tecnico inicial para conectar el portal de soporte TI StockGI a Supabase, manteniendo una arquitectura sencilla, migrable y alineada con los flujos ya definidos para los roles Usuario, TI Operativo y TI Administrativo.

Este documento sirve como base para crear el proyecto Supabase, ejecutar migraciones SQL, configurar Storage y reemplazar los datos simulados del frontend por datos reales.

## Principios de diseno

- La base de datos debe separar claramente contratos, usuarios, tickets, comentarios, adjuntos y eventos.
- Todo ticket debe pertenecer a un contrato y a un usuario solicitante.
- El usuario no define prioridad ni SLA; estos salen del catalogo funcional de categorias y tipos de solicitud.
- Los contratos y usuarios no se eliminan cuando ya tienen historial; se inactivan.
- Las categorias no seran administrables libremente en primera version; se cargan como catalogo controlado.
- La app debe poder migrarse despues a PostgreSQL local sin depender excesivamente de funciones exclusivas de Supabase.
- Los adjuntos permitidos en primera version son imagenes y PDF.
- La seguridad real debe aplicarse tambien en backend/base de datos, no solo en el frontend.

## Stack propuesto

- Supabase Project: proyecto nuevo independiente.
- Base de datos: PostgreSQL administrado por Supabase.
- Storage: Supabase Storage para adjuntos de tickets.
- Frontend: Next.js actual.
- Autenticacion de la app: login propio por contrato, cedula y contrasena.
- Hash de contrasenas: bcrypt o argon2 desde backend/server actions.

## Proyecto Supabase

Nombre sugerido:

```text
stockgi-soporte-ti
```

Uso:

- Un proyecto exclusivo para mesa de ayuda TI.
- No mezclar con bases de datos del SLI ni con otros proyectos.
- Usar ambiente inicial `dev` o `prod` segun decision operativa.

Recomendacion de ambientes:

- `stockgi-soporte-ti-dev`: pruebas y ajustes.
- `stockgi-soporte-ti-prod`: datos reales.

Si se quiere iniciar mas simple, se puede crear solo un proyecto y manejar los cambios con cuidado.

## Roles funcionales

Los roles funcionales se guardan como texto controlado:

```text
usuario
ti_operativo
ti_administrativo
```

Permisos esperados:

| Rol | Alcance |
| --- | --- |
| usuario | Crea tickets y consulta solo sus propios tickets |
| ti_operativo | Ve tickets nuevos, asignados a el y en espera; toma y cierra tickets |
| ti_administrativo | Administra usuarios, contratos, asignaciones, catalogo consultivo y reportes |

## Estados de usuarios y contratos

Estados recomendados:

```text
active
inactive
```

Reglas:

- Un contrato inactivo no debe aparecer para login ni para crear usuarios nuevos.
- Un usuario inactivo no puede iniciar sesion.
- No se eliminan contratos o usuarios con historial.

## Estados de ticket

Estados definidos para base de datos:

```text
nuevo
asignado
en_proceso
esperando_informacion
resuelto
cerrado
reabierto
cancelado
```

Regla practica para primera version:

- Al crear ticket: `nuevo`.
- Al tomar ticket: pasa directamente a `en_proceso` y queda asignado al tecnico.
- Al solicitar informacion: `esperando_informacion`.
- Cuando el usuario responde: puede volver a `en_proceso` si ya tiene responsable, o `nuevo` si no tiene responsable.
- Al cerrar: `cerrado`.
- `resuelto` queda reservado si mas adelante se quiere separar resuelto de cerrado.
- `reabierto` queda reservado para una segunda etapa si se permite reapertura formal.
- `cancelado` se usa para tickets creados por error o solicitudes no procedentes.

## Prioridades

Prioridades definidas:

```text
baja
media
alta
critica
```

SLA base:

| Prioridad | Primera respuesta | Solucion objetivo |
| --- | --- | --- |
| critica | 30 minutos | 4 horas |
| alta | 1 hora | 8 horas |
| media | 4 horas | 2 dias habiles |
| baja | 1 dia habil | 5 dias habiles |

En base de datos se recomienda guardar los SLA en minutos para calcular vencimientos de forma simple.

| Prioridad | response_sla_minutes | resolution_sla_minutes |
| --- | ---: | ---: |
| critica | 30 | 240 |
| alta | 60 | 480 |
| media | 240 | 2880 |
| baja | 1440 | 7200 |

Nota: estos minutos son una aproximacion calendario. Si despues se requiere horario laboral real, se debe crear una regla adicional de calendario laboral.

## Tablas principales

### 1. contracts

Guarda contratos, operaciones o empresas desde donde se solicita soporte.

Campos:

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| id | uuid | si | Identificador interno |
| name | text | si | Nombre visible del contrato |
| client_name | text | no | Cliente o empresa relacionada |
| internal_code | text | no | Codigo interno |
| status | text | si | `active` o `inactive` |
| starts_at | date | no | Fecha inicio contrato |
| ends_at | date | no | Fecha fin contrato |
| notes | text | no | Observaciones administrativas |
| created_at | timestamptz | si | Fecha de creacion |
| updated_at | timestamptz | si | Fecha de actualizacion |

Reglas:

- `name` debe ser unico para contratos activos, o al menos controlado administrativamente.
- No eliminar contratos con tickets o usuarios asociados.

### 2. app_users

Usuarios de la plataforma. Se usa `app_users` para evitar confusion con tablas internas de Supabase Auth.

Campos:

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| id | uuid | si | Identificador interno |
| contract_id | uuid | si | Contrato al que pertenece |
| document_id | text | si | Cedula o documento |
| full_name | text | si | Nombre completo |
| role | text | si | `usuario`, `ti_operativo`, `ti_administrativo` |
| password_hash | text | si | Contrasena con hash |
| email | text | no | Correo |
| phone | text | no | Telefono |
| area | text | no | Area |
| position | text | no | Cargo |
| location | text | no | Sede o ubicacion |
| status | text | si | `active` o `inactive` |
| must_change_password | boolean | si | Obliga cambio despues de contrasena temporal |
| last_login_at | timestamptz | no | Ultimo ingreso |
| created_at | timestamptz | si | Fecha de creacion |
| updated_at | timestamptz | si | Fecha de actualizacion |

Restricciones:

- Unico por `contract_id + document_id`.
- `document_id` puede repetirse en contratos diferentes.
- Usuarios inactivos no pueden iniciar sesion.

### 3. ticket_categories

Catalogo controlado de categorias generales.

Campos:

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| id | uuid | si | Identificador interno |
| name | text | si | Nombre categoria |
| description | text | no | Descripcion funcional |
| sort_order | integer | si | Orden visual |
| status | text | si | `active` o `inactive` |
| created_at | timestamptz | si | Fecha de creacion |
| updated_at | timestamptz | si | Fecha de actualizacion |

Regla:

- En primera version el administrador consulta el catalogo, pero no crea categorias libremente.

Categorias iniciales:

1. Accesos y contrasenas
2. Equipos de computo
3. Conectividad
4. Correo y comunicacion
5. Impresoras y escaner
6. Software y sistemas internos
7. Recursos TI
8. Otro

### 4. ticket_request_types

Tipos de solicitud dentro de cada categoria. Define prioridad y SLA automatico.

Campos:

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| id | uuid | si | Identificador interno |
| category_id | uuid | si | Categoria padre |
| name | text | si | Nombre del tipo de solicitud |
| default_priority | text | si | Prioridad inicial |
| response_sla_minutes | integer | si | Minutos para primera respuesta |
| resolution_sla_minutes | integer | si | Minutos para solucion objetivo |
| attachment_rule | text | si | `not_required`, `recommended`, `required` |
| sort_order | integer | si | Orden visual |
| status | text | si | `active` o `inactive` |
| created_at | timestamptz | si | Fecha de creacion |
| updated_at | timestamptz | si | Fecha de actualizacion |

Reglas:

- El usuario selecciona categoria y tipo.
- El sistema copia prioridad y SLA desde esta tabla al ticket.
- Si el catalogo cambia despues, los tickets antiguos conservan su prioridad y SLA historico.

### 5. tickets

Tabla central de solicitudes.

Campos:

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| id | uuid | si | Identificador interno |
| ticket_number | text | si | Numero visible, ejemplo `STI-2026-000123` |
| contract_id | uuid | si | Contrato del solicitante |
| requester_id | uuid | si | Usuario que crea el ticket |
| category_id | uuid | si | Categoria seleccionada |
| request_type_id | uuid | si | Tipo de solicitud seleccionado |
| subject | text | si | Asunto corto |
| description | text | si | Descripcion del problema |
| status | text | si | Estado actual |
| priority | text | si | Prioridad calculada o ajustada |
| response_sla_minutes | integer | si | SLA primera respuesta copiado del tipo |
| resolution_sla_minutes | integer | si | SLA solucion copiado del tipo |
| first_response_due_at | timestamptz | si | Fecha limite primera respuesta |
| resolution_due_at | timestamptz | si | Fecha limite solucion |
| first_response_at | timestamptz | no | Primera accion/comentario de TI |
| assigned_to_id | uuid | no | Tecnico responsable |
| assigned_at | timestamptz | no | Fecha asignacion/toma |
| closed_at | timestamptz | no | Fecha cierre |
| closed_by_id | uuid | no | Usuario TI que cierra |
| solution | text | no | Solucion final |
| internal_notes | text | no | Notas administrativas si se habilitan |
| created_at | timestamptz | si | Fecha creacion |
| updated_at | timestamptz | si | Fecha actualizacion |

Reglas:

- `ticket_number` debe ser unico.
- `requester_id` debe pertenecer al mismo `contract_id` del ticket.
- Al tomar ticket, se llena `assigned_to_id`, `assigned_at`, `first_response_at` si aun esta vacio, y estado pasa a `en_proceso`.
- Al solicitar informacion, estado pasa a `esperando_informacion` y debe existir comentario.
- Al cerrar, debe existir solucion/comentario final y se llena `closed_at`, `closed_by_id`.

### 6. ticket_comments

Historial conversacional visible del ticket.

Campos:

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| id | uuid | si | Identificador interno |
| ticket_id | uuid | si | Ticket relacionado |
| author_id | uuid | si | Usuario que comenta |
| comment_type | text | si | `comment`, `request_info`, `resolution`, `system` |
| body | text | si | Texto del comentario |
| visible_to_requester | boolean | si | Visible para usuario solicitante |
| created_at | timestamptz | si | Fecha creacion |

Reglas primera version:

- Comentarios de TI son visibles al usuario, salvo que se habilite modo interno mas adelante.
- Para `request_info` y `resolution`, `body` es obligatorio.
- Los cambios automaticos pueden guardarse como `system`.

### 7. ticket_attachments

Metadatos de archivos subidos al ticket o a comentarios.

Campos:

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| id | uuid | si | Identificador interno |
| ticket_id | uuid | si | Ticket relacionado |
| comment_id | uuid | no | Comentario relacionado, si aplica |
| uploaded_by_id | uuid | si | Usuario que sube el archivo |
| bucket | text | si | Bucket Supabase |
| storage_path | text | si | Ruta interna del archivo |
| original_filename | text | si | Nombre original |
| mime_type | text | si | Tipo MIME |
| file_size_bytes | bigint | si | Peso final en bytes |
| original_size_bytes | bigint | si | Peso antes de comprimir |
| stored_size_bytes | bigint | si | Peso almacenado final |
| compression_status | text | si | `not_applicable`, `pending`, `compressed`, `failed` |
| retention_days | integer | si | Dias de retencion despues del cierre, por defecto 30 |
| delete_after_at | timestamptz | no | Fecha programada de eliminacion fisica |
| deleted_at | timestamptz | no | Fecha real de eliminacion fisica |
| created_at | timestamptz | si | Fecha carga |

Reglas:

- Tipos permitidos: `image/png`, `image/jpeg`, `image/webp`, `application/pdf`.
- Limite sugerido: 10 MB por archivo. Las imagenes deben comprimirse antes de subir cuando sea posible.
- Adjuntos asociados a tickets cerrados no deben poder eliminarse desde UI normal; el sistema los elimina automaticamente 30 dias despues del cierre y conserva metadatos.

### 8. ticket_events

Bitacora tecnica para auditoria y reportes.

Campos:

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| id | uuid | si | Identificador interno |
| ticket_id | uuid | si | Ticket relacionado |
| actor_id | uuid | no | Usuario que dispara evento |
| event_type | text | si | Tipo de evento |
| from_value | text | no | Valor anterior |
| to_value | text | no | Valor nuevo |
| metadata | jsonb | no | Datos adicionales |
| created_at | timestamptz | si | Fecha evento |

Eventos sugeridos:

```text
ticket_created
ticket_taken
ticket_assigned
status_changed
priority_changed
category_changed
information_requested
requester_replied
ticket_closed
attachment_uploaded
user_created
user_updated
contract_created
contract_updated
```

### 9. bulk_imports

Control de cargues masivos de usuarios por CSV.

Campos:

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| id | uuid | si | Identificador interno |
| uploaded_by_id | uuid | si | Administrador que carga archivo |
| original_filename | text | si | Nombre del CSV |
| status | text | si | `uploaded`, `validated`, `imported`, `failed` |
| total_rows | integer | si | Total filas detectadas |
| valid_rows | integer | si | Filas validas |
| error_rows | integer | si | Filas con error |
| created_users | integer | si | Usuarios creados |
| updated_users | integer | si | Usuarios actualizados si se permite |
| created_at | timestamptz | si | Fecha carga |
| completed_at | timestamptz | no | Fecha finalizacion |

### 10. bulk_import_rows

Detalle por fila validada en carga masiva.

Campos:

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| id | uuid | si | Identificador interno |
| bulk_import_id | uuid | si | Cargue relacionado |
| row_number | integer | si | Numero de fila en CSV |
| status | text | si | `valid`, `error`, `imported` |
| payload | jsonb | si | Datos leidos de la fila |
| error_message | text | no | Error de validacion |
| created_at | timestamptz | si | Fecha registro |

## Relaciones principales

```text
contracts 1---N app_users
contracts 1---N tickets
app_users 1---N tickets como requester
app_users 1---N tickets como assigned_to
app_users 1---N ticket_comments
ticket_categories 1---N ticket_request_types
ticket_categories 1---N tickets
ticket_request_types 1---N tickets
tickets 1---N ticket_comments
tickets 1---N ticket_attachments
tickets 1---N ticket_events
bulk_imports 1---N bulk_import_rows
```

## Indices recomendados

```sql
create index idx_app_users_contract_document on app_users(contract_id, document_id);
create index idx_app_users_role_status on app_users(role, status);
create index idx_tickets_contract_status on tickets(contract_id, status);
create index idx_tickets_requester on tickets(requester_id);
create index idx_tickets_assigned_to on tickets(assigned_to_id);
create index idx_tickets_category on tickets(category_id, request_type_id);
create index idx_tickets_created_at on tickets(created_at desc);
create index idx_tickets_sla on tickets(resolution_due_at, status);
create index idx_ticket_comments_ticket on ticket_comments(ticket_id, created_at);
create index idx_ticket_attachments_ticket on ticket_attachments(ticket_id);
create index idx_ticket_events_ticket on ticket_events(ticket_id, created_at);
```

## Esquema SQL inicial sugerido

Este SQL es una base inicial. Antes de ejecutarlo, conviene convertirlo en migracion versionada.

```sql
create extension if not exists pgcrypto;

create table contracts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  client_name text,
  internal_code text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  starts_at date,
  ends_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table app_users (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contracts(id),
  document_id text not null,
  full_name text not null,
  role text not null check (role in ('usuario', 'ti_operativo', 'ti_administrativo')),
  password_hash text not null,
  email text,
  phone text,
  area text,
  position text,
  location text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  must_change_password boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (contract_id, document_id)
);

create table ticket_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  sort_order integer not null default 0,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ticket_request_types (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references ticket_categories(id),
  name text not null,
  default_priority text not null check (default_priority in ('baja', 'media', 'alta', 'critica')),
  response_sla_minutes integer not null,
  resolution_sla_minutes integer not null,
  attachment_rule text not null default 'not_required' check (attachment_rule in ('not_required', 'recommended', 'required')),
  sort_order integer not null default 0,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, name)
);

create table tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique,
  contract_id uuid not null references contracts(id),
  requester_id uuid not null references app_users(id),
  category_id uuid not null references ticket_categories(id),
  request_type_id uuid not null references ticket_request_types(id),
  subject text not null,
  description text not null,
  status text not null default 'nuevo' check (status in ('nuevo', 'asignado', 'en_proceso', 'esperando_informacion', 'resuelto', 'cerrado', 'reabierto', 'cancelado')),
  priority text not null check (priority in ('baja', 'media', 'alta', 'critica')),
  response_sla_minutes integer not null,
  resolution_sla_minutes integer not null,
  first_response_due_at timestamptz not null,
  resolution_due_at timestamptz not null,
  first_response_at timestamptz,
  assigned_to_id uuid references app_users(id),
  assigned_at timestamptz,
  closed_at timestamptz,
  closed_by_id uuid references app_users(id),
  solution text,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ticket_comments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  author_id uuid not null references app_users(id),
  comment_type text not null default 'comment' check (comment_type in ('comment', 'request_info', 'resolution', 'system')),
  body text not null,
  visible_to_requester boolean not null default true,
  created_at timestamptz not null default now()
);

create table ticket_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  comment_id uuid references ticket_comments(id) on delete set null,
  uploaded_by_id uuid not null references app_users(id),
  bucket text not null,
  storage_path text not null unique,
  original_filename text not null,
  mime_type text not null,
  file_size_bytes bigint not null,
  created_at timestamptz not null default now()
);

create table ticket_events (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  actor_id uuid references app_users(id),
  event_type text not null,
  from_value text,
  to_value text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table bulk_imports (
  id uuid primary key default gen_random_uuid(),
  uploaded_by_id uuid not null references app_users(id),
  original_filename text not null,
  status text not null default 'uploaded' check (status in ('uploaded', 'validated', 'imported', 'failed')),
  total_rows integer not null default 0,
  valid_rows integer not null default 0,
  error_rows integer not null default 0,
  created_users integer not null default 0,
  updated_users integer not null default 0,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table bulk_import_rows (
  id uuid primary key default gen_random_uuid(),
  bulk_import_id uuid not null references bulk_imports(id) on delete cascade,
  row_number integer not null,
  status text not null check (status in ('valid', 'error', 'imported')),
  payload jsonb not null,
  error_message text,
  created_at timestamptz not null default now()
);
```

## Generacion de numero de ticket

Formato sugerido:

```text
STI-YYYY-000001
```

Opciones:

1. Generarlo en backend consultando una secuencia por ano.
2. Crear una tabla `ticket_counters` por ano.
3. Usar una funcion PostgreSQL.

Recomendacion inicial: funcion PostgreSQL o tabla de contadores para evitar duplicados en concurrencia.

Tabla sugerida:

```sql
create table ticket_counters (
  year integer primary key,
  last_number integer not null default 0
);
```

## Storage Supabase

Bucket sugerido:

```text
ticket-attachments
```

Configuracion:

- Bucket privado.
- Maximo por archivo: 10 MB.
- MIME permitidos:
  - `image/png`
  - `image/jpeg`
  - `image/webp`
  - `application/pdf`

Ruta sugerida:

```text
tickets/{ticket_id}/{attachment_id}-{filename}
```

Reglas:

- El usuario solicitante puede subir adjuntos a sus propios tickets abiertos.
- TI puede subir adjuntos a tickets que pueda gestionar.
- La descarga debe validarse por permisos del ticket.
- Para mayor control, descargar mediante endpoint del backend que valide sesion y genere URL firmada.

## Seguridad y autenticacion

### Login propio

Campos de login:

- Contrato.
- Cedula.
- Contrasena.

Proceso:

1. Buscar contrato activo.
2. Buscar usuario activo por `contract_id + document_id`.
3. Comparar contrasena contra `password_hash`.
4. Crear sesion segura.
5. Guardar `last_login_at`.

Recomendacion:

- No guardar contrasenas en texto plano.
- No exponer `password_hash` al frontend.
- Usar cookies httpOnly si se implementa autenticacion propia en Next.js.

### RLS en Supabase

Si se usa Supabase directo desde cliente, se requiere RLS fuerte. Sin embargo, como el login sera personalizado, la opcion mas controlada es:

- Acceso a Supabase desde servidor Next.js con service role solo en backend.
- Frontend nunca recibe `service_role_key`.
- Backend valida rol y permisos antes de consultar o modificar.

Esto simplifica la primera version y facilita una migracion futura a PostgreSQL local.

## Permisos por rol

### Usuario

Puede:

- Crear tickets propios.
- Ver tickets donde `requester_id = session.user.id`.
- Comentar sus propios tickets.
- Subir adjuntos a sus propios tickets.

No puede:

- Ver tickets de otros usuarios.
- Ver reportes globales.
- Cambiar prioridad, responsable o categoria.
- Cerrar tickets.

### TI Operativo

Puede:

- Ver tickets nuevos, en proceso, en espera o asignados a el segun regla de bandeja.
- Tomar tickets sin responsable.
- Comentar tickets visibles.
- Solicitar informacion.
- Cerrar tickets asignados a el.
- Subir adjuntos tecnicos.

No puede:

- Administrar contratos.
- Crear usuarios.
- Crear categorias.
- Cambiar catalogo funcional.

### TI Administrativo

Puede:

- Ver todos los tickets.
- Asignar tickets.
- Crear y editar usuarios.
- Inactivar usuarios.
- Crear, editar e inactivar contratos.
- Consultar catalogo.
- Consultar reportes.
- Ejecutar cargas masivas.

Regla adicional:

- Cambios administrativos importantes deben crear eventos en `ticket_events` o bitacora equivalente.

## Datos iniciales

### Contrato administrativo

Crear un contrato inicial para administradores y TI global:

```text
StockGI Administracion
```

### Usuario administrativo inicial

Crear manualmente el primer usuario admin:

```text
Contrato: StockGI Administracion
Cedula: definida por StockGI
Rol: ti_administrativo
Contrasena temporal: definida al crear
Estado: active
```

### Catalogo inicial

Cargar las categorias y tipos definidos en `catalogo-categorias-tickets.md`.

Resumen de tipos iniciales:

| Categoria | Tipos |
| --- | --- |
| Accesos y contrasenas | Restablecer contrasena, Usuario bloqueado, Crear acceso, Cambiar permisos, Retirar acceso |
| Equipos de computo | Equipo no enciende, Equipo lento, Pantalla, Teclado o mouse, Cargador, Mantenimiento |
| Conectividad | Sin internet, Red lenta, WiFi, VPN, No accede a red interna |
| Correo y comunicacion | No envia correos, No recibe correos, Configuracion de correo, Firma de correo, Teams Meet o Zoom, Telefonia o celular corporativo |
| Impresoras y escaner | No imprime, No escanea, Configuracion, Error de impresora, Solicitud de toner o insumo |
| Software y sistemas internos | Error en aplicacion, Instalacion de software autorizado, Actualizacion, SLI o sistema interno, Licencia de software |
| Recursos TI | Solicitud de equipo, Solicitud de periferico, Solicitud de licencia, Usuario nuevo, Alistamiento para ingreso, Retiro de usuario |
| Otro | Solicitud no clasificada |

## Carga masiva de usuarios

Plantilla CSV definida:

```text
contrato
cedula
nombre_completo
rol
contrasena_temporal
correo
telefono
area
cargo
sede
estado
```

Reglas de validacion:

- `contrato` debe existir y estar activo.
- `cedula` obligatoria.
- `nombre_completo` obligatorio.
- `rol` debe ser uno de los roles permitidos.
- `contrasena_temporal` obligatoria para nuevos usuarios.
- `estado` debe ser `active` o `inactive`.
- Si `contract_id + document_id` ya existe, definir si se actualiza o se reporta error.

Decision recomendada primera version:

- Si el usuario ya existe, reportar error para evitar cambios masivos accidentales.
- La edicion de contrato se hace uno a uno desde administracion.

## Reportes soportados por este modelo

- Tickets por contrato.
- Tickets por categoria.
- Tickets por tipo de solicitud.
- Tickets por estado.
- Tickets por prioridad.
- Tickets por tecnico responsable.
- Tickets vencidos por SLA.
- Tickets abiertos vs cerrados.
- Tiempo promedio de primera respuesta.
- Tiempo promedio de cierre.
- Usuarios por contrato.
- Cargas masivas ejecutadas y errores por fila.

## Consultas base de reportes

Tickets por contrato:

```sql
select c.name, count(*) as total
from tickets t
join contracts c on c.id = t.contract_id
group by c.name
order by total desc;
```

Tickets por estado:

```sql
select status, count(*) as total
from tickets
group by status
order by total desc;
```

Tickets vencidos abiertos:

```sql
select *
from tickets
where status not in ('cerrado', 'cancelado')
  and resolution_due_at < now()
order by resolution_due_at asc;
```

Tiempo promedio de cierre en horas:

```sql
select avg(extract(epoch from (closed_at - created_at)) / 3600) as avg_close_hours
from tickets
where closed_at is not null;
```

## Migracion futura a servidor local

Para facilitar migracion desde Supabase a PostgreSQL local:

- Mantener migraciones SQL en el repositorio.
- Evitar logica critica solo en el dashboard de Supabase.
- Guardar archivos en Storage con rutas controladas que puedan copiarse luego.
- No depender de Supabase Auth si se mantiene login propio.
- Documentar variables de entorno.
- Mantener backups exportables de PostgreSQL.

En migracion local, equivalencias:

| Supabase | Servidor local |
| --- | --- |
| PostgreSQL Supabase | PostgreSQL local |
| Supabase Storage | Carpeta local protegida o MinIO |
| Supabase project URL | URL backend propio |
| Supabase service key | Usuario/credencial backend PostgreSQL |

## Variables de entorno esperadas

```text
NEXT_PUBLIC_APP_NAME=StockGI Soporte TI
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SESSION_SECRET=
ATTACHMENTS_BUCKET=ticket-attachments
MAX_ATTACHMENT_MB=10
```

Nota:

- `SUPABASE_SERVICE_ROLE_KEY` nunca debe exponerse al navegador.
- Variables sensibles no deben subirse al repositorio.

## Orden recomendado de implementacion

1. Crear proyecto Supabase nuevo.
2. Crear migracion SQL inicial con tablas, indices y restricciones.
3. Crear bucket privado `ticket-attachments`.
4. Cargar catalogo inicial de categorias y tipos.
5. Crear contrato `StockGI Administracion`.
6. Crear primer usuario `ti_administrativo`.
7. Implementar backend de login.
8. Conectar frontend a datos reales.
9. Implementar creacion real de tickets.
10. Implementar comentarios, tomar ticket, solicitar informacion y cerrar ticket.
11. Implementar adjuntos reales.
12. Implementar administracion de usuarios y contratos.
13. Implementar carga masiva real contra Supabase.
14. Implementar reportes reales.
15. Probar permisos por rol.

## Decisiones pendientes antes de ejecutar

- Nombre final del proyecto Supabase.
- Si se usara un solo ambiente o dev/prod separado.
- Cedula del primer usuario administrador.
- Lista inicial de contratos reales.
- Lista inicial de usuarios reales.
- Limite final de peso por adjunto.
- Si el SLA se medira por tiempo calendario o horario laboral.
- Si el usuario puede reabrir un ticket cerrado o solo crear uno nuevo.

## Recomendacion final

Para la primera version real, usar Supabase como backend administrado, pero construir el acceso a datos desde el servidor Next.js. Esto mantiene el sistema simple, evita exponer claves sensibles, permite permisos claros por rol y deja abierta la posibilidad de migrar a PostgreSQL local mas adelante.



## Tarea pendiente: activacion Supabase Pro

Estado: pendiente hasta que StockGI active el plan de Supabase de USD 25/mes o libere cupo de proyectos gratuitos.

Motivo:

- La organizacion `Rivio` ya tiene 2 proyectos activos en plan Free.
- Supabase no permite crear un tercer proyecto activo gratuito.
- Los proyectos actuales `Rivio App` y `Prodgers MVP` se deben conservar.

Accion cuando el plan este activo:

1. Crear proyecto Supabase `stockgi-soporte-ti` en la organizacion `Rivio`.
2. Usar region `sa-east-1`.
3. Vincular el proyecto local con `supabase link`.
4. Ejecutar migraciones con `supabase db push --include-seed`.
5. Crear/copiar variables reales a `.env.local`.
6. Validar Storage privado `ticket-attachments`.
7. Probar creacion de contratos, usuarios, tickets, comentarios y adjuntos.

Comandos base:

```powershell
supabase projects create stockgi-soporte-ti --org-id zlycziqowjkimhykcsqi --region sa-east-1
supabase link --project-ref <project-ref>
supabase db push --include-seed
```

Variables requeridas:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```



