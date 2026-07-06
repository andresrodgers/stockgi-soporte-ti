-- La migracion 0005 activo RLS en app_users con politicas de select/insert/update,
-- pero no definio una politica de delete. Sin politica para un comando, Postgres
-- deniega ese comando para todas las filas (0 rows affected, sin error de permisos),
-- por lo que "Eliminar usuario" fallaba siempre con "Usuario no encontrado".
drop policy if exists app_users_delete_policy on public.app_users;
create policy app_users_delete_policy on public.app_users for delete using (public.app_is_admin());
