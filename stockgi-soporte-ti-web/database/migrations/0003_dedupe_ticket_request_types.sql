with ranked as (
  select
    id,
    row_number() over (
      partition by category_id, sort_order
      order by (octet_length(name) > length(name)) desc, updated_at desc, id desc
    ) as rn
  from public.ticket_request_types
)
delete from public.ticket_request_types target
using ranked
where target.id = ranked.id
  and ranked.rn > 1;