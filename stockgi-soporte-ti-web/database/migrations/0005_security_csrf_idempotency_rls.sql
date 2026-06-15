alter table public.app_sessions add column if not exists csrf_token_hash text;

create table if not exists public.idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  operation text not null,
  idempotency_key text not null,
  status text not null default 'processing' check (status in ('processing', 'completed', 'failed')),
  response_status integer,
  response_body jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, operation, idempotency_key)
);
create index if not exists idempotency_keys_user_created_idx on public.idempotency_keys(user_id, created_at desc);

create or replace function public.app_current_user_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.current_user_id', true), '')::uuid;
$$;

create or replace function public.app_current_contract_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.current_contract_id', true), '')::uuid;
$$;

create or replace function public.app_current_role()
returns text
language sql
stable
as $$
  select nullif(current_setting('app.current_role', true), '');
$$;

create or replace function public.app_auth_flow()
returns text
language sql
stable
as $$
  select nullif(current_setting('app.auth_flow', true), '');
$$;

create or replace function public.app_is_admin()
returns boolean
language sql
stable
as $$
  select public.app_current_role() = 'ti_administrativo';
$$;

alter table public.contracts enable row level security;
drop policy if exists contracts_select_policy on public.contracts;
create policy contracts_select_policy on public.contracts for select using (status = 'active' or public.app_is_admin());
drop policy if exists contracts_insert_policy on public.contracts;
create policy contracts_insert_policy on public.contracts for insert with check (public.app_is_admin());
drop policy if exists contracts_update_policy on public.contracts;
create policy contracts_update_policy on public.contracts for update using (public.app_is_admin()) with check (public.app_is_admin());

alter table public.app_users enable row level security;
drop policy if exists app_users_select_policy on public.app_users;
create policy app_users_select_policy on public.app_users for select using (
  public.app_auth_flow() in ('login', 'session')
  or public.app_is_admin()
  or id = public.app_current_user_id()
);
drop policy if exists app_users_insert_policy on public.app_users;
create policy app_users_insert_policy on public.app_users for insert with check (public.app_is_admin());
drop policy if exists app_users_update_policy on public.app_users;
create policy app_users_update_policy on public.app_users for update using (
  public.app_auth_flow() = 'login'
  or public.app_is_admin()
  or id = public.app_current_user_id()
) with check (
  public.app_auth_flow() = 'login'
  or public.app_is_admin()
  or id = public.app_current_user_id()
);

alter table public.ticket_categories enable row level security;
drop policy if exists ticket_categories_select_policy on public.ticket_categories;
create policy ticket_categories_select_policy on public.ticket_categories for select using (status = 'active' or public.app_is_admin());
drop policy if exists ticket_categories_write_policy on public.ticket_categories;
create policy ticket_categories_write_policy on public.ticket_categories for all using (public.app_is_admin()) with check (public.app_is_admin());

alter table public.ticket_request_types enable row level security;
drop policy if exists ticket_request_types_select_policy on public.ticket_request_types;
create policy ticket_request_types_select_policy on public.ticket_request_types for select using (status = 'active' or public.app_is_admin());
drop policy if exists ticket_request_types_write_policy on public.ticket_request_types;
create policy ticket_request_types_write_policy on public.ticket_request_types for all using (public.app_is_admin()) with check (public.app_is_admin());

alter table public.tickets enable row level security;
drop policy if exists tickets_select_policy on public.tickets;
create policy tickets_select_policy on public.tickets for select using (
  public.app_is_admin()
  or requester_id = public.app_current_user_id()
  or assigned_to_id = public.app_current_user_id()
  or (public.app_current_role() = 'ti_operativo' and assigned_to_id is null)
);
drop policy if exists tickets_insert_policy on public.tickets;
create policy tickets_insert_policy on public.tickets for insert with check (
  public.app_current_role() = 'usuario'
  and requester_id = public.app_current_user_id()
  and contract_id = public.app_current_contract_id()
);
drop policy if exists tickets_update_policy on public.tickets;
create policy tickets_update_policy on public.tickets for update using (
  public.app_is_admin()
  or assigned_to_id = public.app_current_user_id()
  or (public.app_current_role() = 'ti_operativo' and assigned_to_id is null)
) with check (
  public.app_is_admin()
  or assigned_to_id = public.app_current_user_id()
  or (public.app_current_role() = 'ti_operativo' and assigned_to_id is null)
);

alter table public.ticket_comments enable row level security;
drop policy if exists ticket_comments_select_policy on public.ticket_comments;
create policy ticket_comments_select_policy on public.ticket_comments for select using (
  exists (select 1 from public.tickets t where t.id = ticket_comments.ticket_id)
);
drop policy if exists ticket_comments_insert_policy on public.ticket_comments;
create policy ticket_comments_insert_policy on public.ticket_comments for insert with check (
  author_id = public.app_current_user_id()
  and exists (select 1 from public.tickets t where t.id = ticket_comments.ticket_id)
);

alter table public.ticket_attachments enable row level security;
drop policy if exists ticket_attachments_select_policy on public.ticket_attachments;
create policy ticket_attachments_select_policy on public.ticket_attachments for select using (
  exists (select 1 from public.tickets t where t.id = ticket_attachments.ticket_id)
);
drop policy if exists ticket_attachments_insert_policy on public.ticket_attachments;
create policy ticket_attachments_insert_policy on public.ticket_attachments for insert with check (
  uploaded_by_id = public.app_current_user_id()
  and exists (select 1 from public.tickets t where t.id = ticket_attachments.ticket_id)
);
drop policy if exists ticket_attachments_update_policy on public.ticket_attachments;
create policy ticket_attachments_update_policy on public.ticket_attachments for update using (public.app_is_admin()) with check (public.app_is_admin());

alter table public.ticket_events enable row level security;
drop policy if exists ticket_events_select_policy on public.ticket_events;
create policy ticket_events_select_policy on public.ticket_events for select using (
  ticket_id is null or exists (select 1 from public.tickets t where t.id = ticket_events.ticket_id)
);
drop policy if exists ticket_events_insert_policy on public.ticket_events;
create policy ticket_events_insert_policy on public.ticket_events for insert with check (
  actor_id is null or actor_id = public.app_current_user_id() or public.app_is_admin()
);

alter table public.bulk_imports enable row level security;
drop policy if exists bulk_imports_admin_policy on public.bulk_imports;
create policy bulk_imports_admin_policy on public.bulk_imports for all using (public.app_is_admin()) with check (public.app_is_admin());

alter table public.bulk_import_rows enable row level security;
drop policy if exists bulk_import_rows_admin_policy on public.bulk_import_rows;
create policy bulk_import_rows_admin_policy on public.bulk_import_rows for all using (public.app_is_admin()) with check (public.app_is_admin());

grant select, insert, update, delete on public.idempotency_keys to stockgi_app;
grant usage, select on all sequences in schema public to stockgi_app;