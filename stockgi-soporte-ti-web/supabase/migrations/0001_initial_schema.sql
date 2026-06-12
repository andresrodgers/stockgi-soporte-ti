-- StockGI Soporte TI - initial Supabase schema
-- Login is handled by the application using contract + document_id + password_hash.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.contracts (
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

create unique index contracts_active_name_idx on public.contracts (lower(name)) where status = 'active';
create trigger contracts_set_updated_at before update on public.contracts for each row execute function public.set_updated_at();

create table public.app_users (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id),
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

create index app_users_role_status_idx on public.app_users(role, status);
create trigger app_users_set_updated_at before update on public.app_users for each row execute function public.set_updated_at();

create table public.ticket_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  sort_order integer not null default 0,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger ticket_categories_set_updated_at before update on public.ticket_categories for each row execute function public.set_updated_at();

create table public.ticket_request_types (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.ticket_categories(id),
  name text not null,
  default_priority text not null check (default_priority in ('baja', 'media', 'alta', 'critica')),
  response_sla_minutes integer not null check (response_sla_minutes > 0),
  resolution_sla_minutes integer not null check (resolution_sla_minutes > 0),
  attachment_rule text not null default 'not_required' check (attachment_rule in ('not_required', 'recommended', 'required')),
  sort_order integer not null default 0,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, name)
);

create index ticket_request_types_category_idx on public.ticket_request_types(category_id, status, sort_order);
create trigger ticket_request_types_set_updated_at before update on public.ticket_request_types for each row execute function public.set_updated_at();

create table public.ticket_counters (
  year integer primary key,
  last_number integer not null default 0
);

create or replace function public.next_ticket_number()
returns text
language plpgsql
as $$
declare
  current_year integer := extract(year from now())::integer;
  next_number integer;
begin
  insert into public.ticket_counters(year, last_number)
  values (current_year, 1)
  on conflict (year) do update set last_number = public.ticket_counters.last_number + 1
  returning last_number into next_number;

  return 'STI-' || current_year || '-' || lpad(next_number::text, 6, '0');
end;
$$;

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique default public.next_ticket_number(),
  contract_id uuid not null references public.contracts(id),
  requester_id uuid not null references public.app_users(id),
  category_id uuid not null references public.ticket_categories(id),
  request_type_id uuid not null references public.ticket_request_types(id),
  subject text not null,
  description text not null,
  status text not null default 'nuevo' check (status in ('nuevo', 'asignado', 'en_proceso', 'esperando_informacion', 'resuelto', 'cerrado', 'reabierto', 'cancelado')),
  priority text not null check (priority in ('baja', 'media', 'alta', 'critica')),
  response_sla_minutes integer not null check (response_sla_minutes > 0),
  resolution_sla_minutes integer not null check (resolution_sla_minutes > 0),
  first_response_due_at timestamptz not null,
  resolution_due_at timestamptz not null,
  first_response_at timestamptz,
  assigned_to_id uuid references public.app_users(id),
  assigned_at timestamptz,
  closed_at timestamptz,
  closed_by_id uuid references public.app_users(id),
  solution text,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tickets_contract_status_idx on public.tickets(contract_id, status);
create index tickets_requester_idx on public.tickets(requester_id);
create index tickets_assigned_to_idx on public.tickets(assigned_to_id);
create index tickets_category_idx on public.tickets(category_id, request_type_id);
create index tickets_created_at_idx on public.tickets(created_at desc);
create index tickets_sla_idx on public.tickets(resolution_due_at, status);
create trigger tickets_set_updated_at before update on public.tickets for each row execute function public.set_updated_at();

create or replace function public.validate_ticket_contract()
returns trigger
language plpgsql
as $$
declare
  requester_contract uuid;
begin
  select contract_id into requester_contract from public.app_users where id = new.requester_id;
  if requester_contract is null or requester_contract <> new.contract_id then
    raise exception 'requester_id must belong to ticket contract_id';
  end if;
  return new;
end;
$$;

create trigger tickets_validate_contract before insert or update of contract_id, requester_id on public.tickets for each row execute function public.validate_ticket_contract();

create table public.ticket_comments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  author_id uuid not null references public.app_users(id),
  comment_type text not null default 'comment' check (comment_type in ('comment', 'request_info', 'resolution', 'system')),
  body text not null,
  visible_to_requester boolean not null default true,
  created_at timestamptz not null default now()
);

create index ticket_comments_ticket_idx on public.ticket_comments(ticket_id, created_at);

create table public.ticket_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  comment_id uuid references public.ticket_comments(id) on delete set null,
  uploaded_by_id uuid not null references public.app_users(id),
  bucket text not null default 'ticket-attachments',
  storage_path text not null unique,
  original_filename text not null,
  mime_type text not null check (mime_type in ('image/png', 'image/jpeg', 'image/webp', 'application/pdf')),
  file_size_bytes bigint not null check (file_size_bytes >= 0),
  original_size_bytes bigint not null check (original_size_bytes >= 0),
  stored_size_bytes bigint not null check (stored_size_bytes >= 0),
  compression_status text not null default 'not_applicable' check (compression_status in ('not_applicable', 'pending', 'compressed', 'failed')),
  retention_days integer not null default 30 check (retention_days > 0),
  delete_after_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index ticket_attachments_ticket_idx on public.ticket_attachments(ticket_id);
create index ticket_attachments_delete_after_idx on public.ticket_attachments(delete_after_at) where deleted_at is null;

create or replace function public.schedule_attachment_retention()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'cerrado' and new.closed_at is not null and (old.status is distinct from new.status or old.closed_at is distinct from new.closed_at) then
    update public.ticket_attachments
    set delete_after_at = new.closed_at + (retention_days || ' days')::interval
    where ticket_id = new.id and deleted_at is null and delete_after_at is null;
  end if;
  return new;
end;
$$;

create trigger tickets_schedule_attachment_retention after update of status, closed_at on public.tickets for each row execute function public.schedule_attachment_retention();

create table public.ticket_events (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  actor_id uuid references public.app_users(id),
  event_type text not null,
  from_value text,
  to_value text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index ticket_events_ticket_idx on public.ticket_events(ticket_id, created_at);

create table public.bulk_imports (
  id uuid primary key default gen_random_uuid(),
  uploaded_by_id uuid not null references public.app_users(id),
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

create table public.bulk_import_rows (
  id uuid primary key default gen_random_uuid(),
  bulk_import_id uuid not null references public.bulk_imports(id) on delete cascade,
  row_number integer not null,
  status text not null check (status in ('valid', 'error', 'imported')),
  payload jsonb not null,
  error_message text,
  created_at timestamptz not null default now()
);

create index bulk_import_rows_import_idx on public.bulk_import_rows(bulk_import_id, row_number);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ticket-attachments',
  'ticket-attachments',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
