-- StockGI Soporte TI - initial seed data

insert into public.contracts (name, client_name, internal_code, status, notes)
values ('StockGI Administracion', 'StockGI', 'STOCKGI-ADMIN', 'active', 'Contrato administrativo inicial para TI y administradores')
on conflict do nothing;

with categories(name, description, sort_order) as (
  values
    ('Accesos y contrasenas', 'Bloqueos, claves, permisos y accesos a sistemas.', 1),
    ('Equipos de computo', 'Fallas o requerimientos relacionados con computadores y perifericos basicos.', 2),
    ('Conectividad', 'Internet, red, WiFi, VPN o acceso a red interna.', 3),
    ('Correo y comunicacion', 'Correo electronico, reuniones virtuales, telefonia o celular corporativo.', 4),
    ('Impresoras y escaner', 'Impresion, escaneo, configuracion o insumos.', 5),
    ('Software y sistemas internos', 'Aplicaciones instaladas, sistemas corporativos, SLI y licencias.', 6),
    ('Recursos TI', 'Solicitudes planificadas de equipos, perifericos, licencias, ingresos o retiros.', 7),
    ('Otro', 'Casos que no encajan en las categorias anteriores.', 8)
)
insert into public.ticket_categories (name, description, sort_order, status)
select name, description, sort_order, 'active'
from categories
on conflict (name) do update set
  description = excluded.description,
  sort_order = excluded.sort_order,
  status = 'active';

with request_types(category_name, name, priority, response_sla, resolution_sla, attachment_rule, sort_order) as (
  values
    ('Accesos y contrasenas', 'Restablecer contrasena', 'media', 240, 2880, 'not_required', 1),
    ('Accesos y contrasenas', 'Usuario bloqueado', 'media', 240, 2880, 'not_required', 2),
    ('Accesos y contrasenas', 'Crear acceso', 'media', 240, 2880, 'not_required', 3),
    ('Accesos y contrasenas', 'Cambiar permisos', 'media', 240, 2880, 'not_required', 4),
    ('Accesos y contrasenas', 'Retirar acceso', 'media', 240, 2880, 'not_required', 5),

    ('Equipos de computo', 'Equipo no enciende', 'alta', 60, 480, 'recommended', 1),
    ('Equipos de computo', 'Equipo lento', 'media', 240, 2880, 'recommended', 2),
    ('Equipos de computo', 'Pantalla', 'media', 240, 2880, 'recommended', 3),
    ('Equipos de computo', 'Teclado o mouse', 'media', 240, 2880, 'recommended', 4),
    ('Equipos de computo', 'Cargador', 'media', 240, 2880, 'recommended', 5),
    ('Equipos de computo', 'Mantenimiento', 'baja', 1440, 7200, 'not_required', 6),

    ('Conectividad', 'Sin internet', 'alta', 60, 480, 'not_required', 1),
    ('Conectividad', 'Red lenta', 'media', 240, 2880, 'not_required', 2),
    ('Conectividad', 'WiFi', 'media', 240, 2880, 'not_required', 3),
    ('Conectividad', 'VPN', 'alta', 60, 480, 'not_required', 4),
    ('Conectividad', 'No accede a red interna', 'alta', 60, 480, 'not_required', 5),

    ('Correo y comunicacion', 'No envia correos', 'media', 240, 2880, 'not_required', 1),
    ('Correo y comunicacion', 'No recibe correos', 'media', 240, 2880, 'not_required', 2),
    ('Correo y comunicacion', 'Configuracion de correo', 'media', 240, 2880, 'not_required', 3),
    ('Correo y comunicacion', 'Firma de correo', 'baja', 1440, 7200, 'not_required', 4),
    ('Correo y comunicacion', 'Teams, Meet o Zoom', 'media', 240, 2880, 'not_required', 5),
    ('Correo y comunicacion', 'Telefonia o celular corporativo', 'media', 240, 2880, 'not_required', 6),

    ('Impresoras y escaner', 'No imprime', 'media', 240, 2880, 'recommended', 1),
    ('Impresoras y escaner', 'No escanea', 'media', 240, 2880, 'recommended', 2),
    ('Impresoras y escaner', 'Configuracion', 'baja', 1440, 7200, 'not_required', 3),
    ('Impresoras y escaner', 'Error de impresora', 'media', 240, 2880, 'recommended', 4),
    ('Impresoras y escaner', 'Solicitud de toner o insumo', 'baja', 1440, 7200, 'not_required', 5),

    ('Software y sistemas internos', 'Error en aplicacion', 'media', 240, 2880, 'recommended', 1),
    ('Software y sistemas internos', 'Instalacion de software autorizado', 'baja', 1440, 7200, 'not_required', 2),
    ('Software y sistemas internos', 'Actualizacion', 'baja', 1440, 7200, 'not_required', 3),
    ('Software y sistemas internos', 'SLI o sistema interno', 'alta', 60, 480, 'recommended', 4),
    ('Software y sistemas internos', 'Licencia de software', 'media', 240, 2880, 'not_required', 5),

    ('Recursos TI', 'Solicitud de equipo', 'baja', 1440, 7200, 'not_required', 1),
    ('Recursos TI', 'Solicitud de periferico', 'baja', 1440, 7200, 'not_required', 2),
    ('Recursos TI', 'Solicitud de licencia', 'media', 240, 2880, 'not_required', 3),
    ('Recursos TI', 'Usuario nuevo', 'media', 240, 2880, 'not_required', 4),
    ('Recursos TI', 'Alistamiento para ingreso', 'media', 240, 2880, 'not_required', 5),
    ('Recursos TI', 'Retiro de usuario', 'media', 240, 2880, 'not_required', 6),

    ('Otro', 'Solicitud no clasificada', 'baja', 1440, 7200, 'not_required', 1)
)
insert into public.ticket_request_types (
  category_id,
  name,
  default_priority,
  response_sla_minutes,
  resolution_sla_minutes,
  attachment_rule,
  sort_order,
  status
)
select
  c.id,
  rt.name,
  rt.priority,
  rt.response_sla,
  rt.resolution_sla,
  rt.attachment_rule,
  rt.sort_order,
  'active'
from request_types rt
join public.ticket_categories c on c.name = rt.category_name
on conflict (category_id, name) do update set
  default_priority = excluded.default_priority,
  response_sla_minutes = excluded.response_sla_minutes,
  resolution_sla_minutes = excluded.resolution_sla_minutes,
  attachment_rule = excluded.attachment_rule,
  sort_order = excluded.sort_order,
  status = 'active';
