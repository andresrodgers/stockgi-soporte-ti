-- Seed demo local para validar paginacion.
-- Usuarios demo: contrasena temporal StockgiDemo2026!

insert into public.contracts (id, name, client_name, internal_code, status)
values ('00000000-0000-4000-8000-000000000001', 'StockGI Administracion', 'StockGI', 'STOCKGI-ADMIN', 'active')
on conflict (id) do update set name = excluded.name, client_name = excluded.client_name, internal_code = excluded.internal_code, status = excluded.status;

insert into public.app_users (
  id, contract_id, document_id, full_name, role, password_hash, email, area, position, location, status, must_change_password, locale
)
values
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001', '1075297653', 'Administrador StockGI', 'ti_administrativo', '$2b$12$Q2bS1JaSDX2UbNniQ6Mgv.bqt8nwyAJxEl1foM6mu065B3A96mW92', 'admin@stockgi.com', 'TI', 'Administrador TI', 'Principal', 'active', false, 'es-CO'),
  ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000001', '2002002001', 'Operativo TI Demo', 'ti_operativo', '$2b$12$Q2bS1JaSDX2UbNniQ6Mgv.bqt8nwyAJxEl1foM6mu065B3A96mW92', 'operativo.demo@stockgi.com', 'TI', 'Soporte TI', 'Principal', 'active', false, 'es-CO'),
  ('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000001', '3003003001', 'Usuario Demo Uno', 'usuario', '$2b$12$Q2bS1JaSDX2UbNniQ6Mgv.bqt8nwyAJxEl1foM6mu065B3A96mW92', 'usuario.uno@stockgi.com', 'Operacion', 'Analista', 'Principal', 'active', false, 'es-CO'),
  ('00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000000001', '3003003002', 'Usuario Demo Dos', 'usuario', '$2b$12$Q2bS1JaSDX2UbNniQ6Mgv.bqt8nwyAJxEl1foM6mu065B3A96mW92', 'usuario.dos@stockgi.com', 'Operacion', 'Coordinador', 'Principal', 'active', false, 'es-CO')
on conflict (contract_id, document_id) do update set
  full_name = excluded.full_name,
  role = excluded.role,
  password_hash = excluded.password_hash,
  email = excluded.email,
  area = excluded.area,
  position = excluded.position,
  location = excluded.location,
  status = excluded.status,
  must_change_password = excluded.must_change_password,
  locale = excluded.locale;

with demo_users as (
  select id from public.app_users where document_id in ('3003003001', '3003003002')
)
delete from public.tickets t
using demo_users u
where t.requester_id = u.id;

with request_type as (
  select rt.id as request_type_id,
         rt.category_id,
         rt.name as request_type_name,
         rt.default_priority,
         rt.response_sla_minutes,
         rt.resolution_sla_minutes
  from public.ticket_request_types rt
  join public.ticket_categories c on c.id = rt.category_id
  where c.name = 'Software y sistemas internos'
  order by rt.sort_order asc
  limit 1
), demo_rows as (
  select
    u.id as requester_id,
    u.contract_id,
    gs.ticket_index,
    row_number() over (order by u.document_id, gs.ticket_index) as global_index
  from public.app_users u
  cross join generate_series(1, 10) as gs(ticket_index)
  where u.document_id in ('3003003001', '3003003002')
), inserted as (
  insert into public.tickets (
    contract_id,
    requester_id,
    category_id,
    request_type_id,
    subject,
    description,
    status,
    priority,
    response_sla_minutes,
    resolution_sla_minutes,
    first_response_due_at,
    resolution_due_at,
    assigned_to_id,
    assigned_at,
    closed_at,
    closed_by_id,
    solution,
    created_at,
    updated_at
  )
  select
    dr.contract_id,
    dr.requester_id,
    rt.category_id,
    rt.request_type_id,
    rt.request_type_name,
    'Ticket demo de paginacion #' || dr.ticket_index || ' para validar listas, filtros y permisos.',
    case
      when dr.ticket_index in (1, 2, 3) then 'nuevo'
      when dr.ticket_index in (4, 5, 6) then 'en_proceso'
      when dr.ticket_index in (7, 8) then 'esperando_informacion'
      else 'cerrado'
    end,
    rt.default_priority,
    rt.response_sla_minutes,
    rt.resolution_sla_minutes,
    now() + make_interval(mins => rt.response_sla_minutes),
    now() + make_interval(mins => rt.resolution_sla_minutes),
    case when dr.ticket_index >= 4 then '00000000-0000-4000-8000-000000000201'::uuid else null end,
    case when dr.ticket_index >= 4 then now() - make_interval(hours => dr.ticket_index::int) else null end,
    case when dr.ticket_index in (9, 10) then now() - make_interval(hours => dr.ticket_index::int) else null end,
    case when dr.ticket_index in (9, 10) then '00000000-0000-4000-8000-000000000201'::uuid else null end,
    case when dr.ticket_index in (9, 10) then 'Ticket demo cerrado para validar historial.' else null end,
    now() - make_interval(hours => dr.global_index::int),
    now() - make_interval(hours => dr.global_index::int)
  from demo_rows dr
  cross join request_type rt
  returning id, requester_id
)
insert into public.ticket_comments (ticket_id, author_id, comment_type, body)
select id, requester_id, 'system', 'Ticket demo creado para validar paginacion.'
from inserted;