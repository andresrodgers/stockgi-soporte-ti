-- Seed minimo produccion/local. Cambiar contrasena temporal en primer login.

insert into public.contracts (id, name, client_name, internal_code, status)
values ('00000000-0000-4000-8000-000000000001', 'StockGI Administracion', 'StockGI', 'STOCKGI-ADMIN', 'active')
on conflict (id) do update set name = excluded.name, client_name = excluded.client_name, internal_code = excluded.internal_code, status = excluded.status;

insert into public.app_users (
  id, contract_id, document_id, full_name, role, password_hash, email, area, position, location, status, must_change_password
)
values (
  '00000000-0000-4000-8000-000000000101',
  '00000000-0000-4000-8000-000000000001',
  '30303030',
  'Administrador StockGI',
  'ti_administrativo',
  '$2b$12$8Abirdrb4EGmNKAR4IRbyufIUhBGd/04r2hGvXz.Kwgl5mMqnmJ72',
  'admin@stockgi.com',
  'TI',
  'Administrador TI',
  'Principal',
  'active',
  true
)
on conflict (contract_id, document_id) do update set
  full_name = excluded.full_name,
  role = excluded.role,
  email = excluded.email,
  status = excluded.status;

with categories(id, name, description, sort_order) as (
  values
    ('10000000-0000-4000-8000-000000000001'::uuid, 'Accesos y contrasenas', 'Usuarios, claves, permisos y accesos a sistemas.', 1),
    ('10000000-0000-4000-8000-000000000002'::uuid, 'Equipos de computo', 'Computadores, portatiles, perifericos y diagnostico de equipo.', 2),
    ('10000000-0000-4000-8000-000000000003'::uuid, 'Conectividad', 'Internet, red local, VPN y conectividad de sedes.', 3),
    ('10000000-0000-4000-8000-000000000004'::uuid, 'Correo y comunicacion', 'Correo, cuentas, mensajeria y herramientas de comunicacion.', 4),
    ('10000000-0000-4000-8000-000000000005'::uuid, 'Impresoras y escaner', 'Impresoras, escaner, consumibles y configuracion.', 5),
    ('10000000-0000-4000-8000-000000000006'::uuid, 'Software y sistemas internos', 'Aplicaciones internas, licencias y errores de software.', 6),
    ('10000000-0000-4000-8000-000000000007'::uuid, 'Recursos TI', 'Solicitudes de recursos, equipos, cuentas o configuraciones nuevas.', 7),
    ('10000000-0000-4000-8000-000000000008'::uuid, 'Otro', 'Solicitudes no clasificadas en las categorias anteriores.', 8)
)
insert into public.ticket_categories (id, name, description, sort_order, status)
select id, name, description, sort_order, 'active' from categories
on conflict (id) do update set name = excluded.name, description = excluded.description, sort_order = excluded.sort_order, status = excluded.status;

insert into public.ticket_request_types (category_id, name, default_priority, response_sla_minutes, resolution_sla_minutes, attachment_rule, sort_order, status)
select c.id, rt.name, rt.priority, rt.response_sla, rt.resolution_sla, rt.attachment_rule, rt.sort_order, 'active'
from public.ticket_categories c
join (values
  ('Accesos y contrasenas', 'Restablecer contrasena', 'media', 240, 2880, 'not_required', 1),
  ('Accesos y contrasenas', 'Crear o ajustar permisos', 'media', 240, 2880, 'recommended', 2),
  ('Accesos y contrasenas', 'Bloqueo de usuario critico', 'alta', 60, 480, 'recommended', 3),
  ('Equipos de computo', 'Falla de equipo', 'alta', 60, 480, 'recommended', 1),
  ('Equipos de computo', 'Mantenimiento o revision', 'media', 240, 2880, 'recommended', 2),
  ('Conectividad', 'Sin internet o red', 'critica', 30, 240, 'recommended', 1),
  ('Conectividad', 'Intermitencia de red', 'alta', 60, 480, 'recommended', 2),
  ('Correo y comunicacion', 'Falla de correo', 'media', 240, 2880, 'recommended', 1),
  ('Impresoras y escaner', 'No imprime o no escanea', 'media', 240, 2880, 'recommended', 1),
  ('Software y sistemas internos', 'Error en sistema interno', 'alta', 60, 480, 'recommended', 1),
  ('Software y sistemas internos', 'Solicitud de licencia', 'baja', 1440, 7200, 'not_required', 2),
  ('Recursos TI', 'Solicitud de equipo o recurso', 'baja', 1440, 7200, 'not_required', 1),
  ('Otro', 'Solicitud general', 'baja', 1440, 7200, 'recommended', 1)
) as rt(category_name, name, priority, response_sla, resolution_sla, attachment_rule, sort_order)
  on c.name = rt.category_name
on conflict (category_id, name) do update set
  default_priority = excluded.default_priority,
  response_sla_minutes = excluded.response_sla_minutes,
  resolution_sla_minutes = excluded.resolution_sla_minutes,
  attachment_rule = excluded.attachment_rule,
  sort_order = excluded.sort_order,
  status = excluded.status;
