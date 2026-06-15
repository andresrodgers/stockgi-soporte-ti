alter table public.app_users
  add column if not exists locale varchar(10) not null default 'es-CO';