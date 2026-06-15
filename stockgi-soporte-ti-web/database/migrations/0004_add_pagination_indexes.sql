create index if not exists tickets_requester_created_idx
  on public.tickets(requester_id, created_at desc);

create index if not exists tickets_assigned_status_created_idx
  on public.tickets(assigned_to_id, status, created_at desc);

create index if not exists tickets_status_created_idx
  on public.tickets(status, created_at desc);

create index if not exists tickets_unassigned_open_created_idx
  on public.tickets(created_at desc)
  where assigned_to_id is null and status not in ('cerrado', 'cancelado');

create index if not exists app_users_full_name_idx
  on public.app_users(lower(full_name));