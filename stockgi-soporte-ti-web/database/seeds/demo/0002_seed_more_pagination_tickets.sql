-- Seed demo incremental para sumar 30 tickets y validar paginacion con mas volumen.

with request_types as (
  select rt.id as request_type_id,
         rt.category_id,
         rt.name as request_type_name,
         rt.default_priority,
         rt.response_sla_minutes,
         rt.resolution_sla_minutes,
         row_number() over (order by c.sort_order asc, rt.sort_order asc, rt.name asc) as rn
  from public.ticket_request_types rt
  join public.ticket_categories c on c.id = rt.category_id
  where rt.status = 'active' and c.status = 'active'
), demo_rows as (
  select
    u.id as requester_id,
    u.contract_id,
    gs.ticket_index,
    row_number() over (order by u.document_id, gs.ticket_index) as global_index,
    ((row_number() over (order by u.document_id, gs.ticket_index) - 1) % (select count(*) from request_types)) + 1 as request_type_rn
  from public.app_users u
  cross join generate_series(11, 25) as gs(ticket_index)
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
    'Ticket demo adicional #' || dr.ticket_index || ' para probar paginacion con mayor volumen.',
    case
      when dr.global_index % 10 in (1, 2, 3) then 'nuevo'
      when dr.global_index % 10 in (4, 5, 6, 7) then 'en_proceso'
      when dr.global_index % 10 in (8, 9) then 'esperando_informacion'
      else 'cerrado'
    end,
    rt.default_priority,
    rt.response_sla_minutes,
    rt.resolution_sla_minutes,
    now() + make_interval(mins => rt.response_sla_minutes),
    now() + make_interval(mins => rt.resolution_sla_minutes),
    case when dr.global_index % 10 in (4, 5, 6, 7, 8, 9, 0) then '00000000-0000-4000-8000-000000000201'::uuid else null end,
    case when dr.global_index % 10 in (4, 5, 6, 7, 8, 9, 0) then now() - make_interval(hours => (dr.global_index + 20)::int) else null end,
    case when dr.global_index % 10 = 0 then now() - make_interval(hours => (dr.global_index + 20)::int) else null end,
    case when dr.global_index % 10 = 0 then '00000000-0000-4000-8000-000000000201'::uuid else null end,
    case when dr.global_index % 10 = 0 then 'Ticket demo adicional cerrado.' else null end,
    now() - make_interval(hours => (dr.global_index + 20)::int),
    now() - make_interval(hours => (dr.global_index + 20)::int)
  from demo_rows dr
  join request_types rt on rt.rn = dr.request_type_rn
  returning id, requester_id
)
insert into public.ticket_comments (ticket_id, author_id, comment_type, body)
select id, requester_id, 'system', 'Ticket demo adicional creado para validar paginacion.'
from inserted;