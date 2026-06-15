drop index if exists public.app_users_document_unique_idx;
create unique index if not exists app_users_document_unique_idx
  on public.app_users (btrim(document_id));

create unique index if not exists app_users_email_unique_idx
  on public.app_users (lower(btrim(email)))
  where email is not null and btrim(email) <> '';

create unique index if not exists app_users_phone_unique_idx
  on public.app_users (regexp_replace(phone, '\D', '', 'g'))
  where phone is not null and regexp_replace(phone, '\D', '', 'g') <> '';