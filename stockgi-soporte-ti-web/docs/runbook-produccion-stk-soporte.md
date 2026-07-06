# Runbook Produccion - stk-soporte

## Objetivo

Operar StockGI Soporte TI en la VM Ubuntu usando Docker Compose, PostgreSQL local, adjuntos en storage privado local y Cloudflare Tunnel. Este documento cubre despliegue, arranque, migraciones, backups, restore, limpieza de adjuntos, verificacion y recuperacion basica.

## Arquitectura de produccion

- App: Next.js Node runtime en contenedor `stk-soporte_app`.
- Base de datos: PostgreSQL 16 en contenedor `stk-soporte_postgres`.
- Adjuntos: volumen privado Docker `stk-soporte_storage_data`, montado en `/var/lib/stockgi/uploads` dentro de la app.
- Backups: volumen Docker `stk-soporte_backups` con dumps `pg_dump -Fc`.
- Publicacion: Cloudflare Tunnel en contenedor `stk-soporte_cloudflared`.
- Red interna: `stk-soporte_net`.
- Proyecto Compose: `stk-soporte`.

PostgreSQL no debe exponerse al host ni a internet. La app publica solo por Cloudflare Tunnel o por el puerto local `127.0.0.1:${APP_PORT}` para pruebas tecnicas.

## Prerrequisitos VM Ubuntu

Instalar y validar:

```bash
sudo apt update
sudo apt install -y git ca-certificates curl
sudo systemctl status docker
sudo docker version
sudo docker compose version
```

Usuario recomendado: `stockgiadmin` con acceso SSH por llave y permisos para Docker.

Ruta recomendada del proyecto:

```bash
/opt/stockgi-soporte-ti
```

## Variables de entorno

Crear `.env.production` desde `.env.production.example` y completar valores reales:

```bash
cp .env.production.example .env.production
nano .env.production
```

Valores criticos:

```env
DATA_SOURCE="postgres"
APP_BASE_URL="https://soporte.stockgi.com"
APP_PORT="3002"
POSTGRES_MIGRATOR_PASSWORD="..."
POSTGRES_APP_PASSWORD="..."
SESSION_SECRET="...64+ caracteres aleatorios..."
SESSION_COOKIE_SECURE="true"
UPLOAD_STORAGE_PATH="/var/lib/stockgi/uploads"
MAX_ATTACHMENT_MB="10"
ATTACHMENT_RETENTION_DAYS="30"
CLOUDFLARE_TUNNEL_TOKEN="..."
COMPOSE_PROJECT_NAME="stk-soporte"
```

Reglas:

- No subir `.env.production` a Git.
- `SESSION_COOKIE_SECURE` debe ser `true` en HTTPS real.
- Cambiar secretos si fueron compartidos por chat, correo o capturas.
- Usar passwords distintos para `stockgi_migrator` y `stockgi_app`.

## Despliegue inicial

Desde la VM:

```bash
cd /opt
git clone <repo-privado> stockgi-soporte-ti
cd /opt/stockgi-soporte-ti
cp .env.production.example .env.production
nano .env.production
```

Construir y levantar app + PostgreSQL:

```bash
docker compose --env-file .env.production -p stk-soporte up -d --build app postgres
```

Ejecutar migraciones y seed minimo dentro de la red Docker:

```bash
docker exec stk-soporte_app sh -lc "npm run db:migrate"
docker exec stk-soporte_app sh -lc "npm run db:seed"
```

Validar estado:

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
docker logs --tail=100 stk-soporte_app
docker logs --tail=100 stk-soporte_postgres
```

## Actualizacion de codigo

Desde `/opt/stockgi-soporte-ti/stockgi-soporte-ti-web`:

```bash
git pull origin main
npm run validate:encoding
npm run lint
npm run build
```

Nota real (2026-07-06): `git pull` puede fallar con `Permission denied (publickey)` si el
remote `origin` apunta a `git@github.com:...` en vez del alias SSH dedicado del servidor. El
servidor tiene una llave de deploy en `~/.ssh/github_stockgi_soporte` con un `Host github-stockgi`
en `~/.ssh/config`. Si pasa, corregir una sola vez:

```bash
git remote set-url origin git@github-stockgi:andresrodgers/stockgi-soporte-ti.git
```

Nota real (2026-07-06): antes de un `git pull`, revisar si hay cambios sin confirmar en el
working tree del servidor (`git status`). Si alguna vez alguien aplico un fix copiando
archivos directo al servidor sin commitear, hacer `git diff` para confirmar si el contenido ya
esta en el commit remoto antes de decidir entre `git stash` (reversible) o descartar. Nunca
usar `git checkout -- .` / `git reset --hard` a ciegas sin verificar primero.

Reconstruir solo la app:

```bash
docker compose --env-file .env.production -p stk-soporte build --pull=false app
docker compose --env-file .env.production -p stk-soporte up -d --force-recreate app
```

Si hay migraciones nuevas:

```bash
docker exec stk-soporte_app sh -lc "npm run db:migrate"
```

Verificar:

```bash
docker logs --tail=100 stk-soporte_app
curl -I http://127.0.0.1:3002
```

## Cloudflare Tunnel

Levantar tunnel cuando `CLOUDFLARE_TUNNEL_TOKEN` este configurado:

```bash
docker compose --env-file .env.production -p stk-soporte --profile tunnel up -d cloudflared
```

Validar:

```bash
docker logs --tail=100 stk-soporte_cloudflared
curl -I https://soporte.stockgi.com
```

Configuracion esperada en Cloudflare:

- Public hostname: `soporte.stockgi.com`
- Service interno: `http://app:3001`
- DNS del dominio gestionado por Cloudflare o CNAME compatible hacia el tunnel.

## Backup diario

El servicio `backup` genera dumps en el volumen `stk-soporte_backups` y elimina backups mayores a 30 dias.

Arrancar backup automatico:

```bash
docker compose --env-file .env.production -p stk-soporte --profile backup up -d backup
```

Validar ultimo backup:

```bash
docker logs --tail=100 stk-soporte_backup
docker run --rm -v stk-soporte_backups:/backups alpine sh -lc "ls -lh /backups | tail"
```

Regla operativa:

- Revisar que exista backup reciente despues de cada deploy.
- Copiar backups periodicamente fuera del servidor principal.
- Un backup sin restore probado no cuenta como backup confiable.

## Restore de prueba

No probar restore sobre produccion directamente. Crear base temporal:

```bash
docker exec stk-soporte_postgres createdb -U stockgi_migrator stockgi_restore_test
```

Restaurar un dump al entorno temporal:

```bash
docker compose --env-file .env.production -p stk-soporte run --rm --entrypoint sh backup -lc "PGPASSWORD=$POSTGRES_MIGRATOR_PASSWORD pg_restore -h postgres -U stockgi_migrator -d stockgi_restore_test --clean --if-exists /backups/NOMBRE_DEL_BACKUP.dump"
```

Validar conteos minimos:

```bash
docker exec stk-soporte_postgres psql -U stockgi_migrator -d stockgi_restore_test -c "select count(*) from app_users; select count(*) from tickets; select count(*) from ticket_attachments;"
```

Eliminar base temporal:

```bash
docker exec stk-soporte_postgres dropdb -U stockgi_migrator stockgi_restore_test
```

## Adjuntos y retencion

Politica:

- Adjuntos activos mientras el ticket no este cerrado.
- Al cerrar ticket, `delete_after_at = closed_at + 30 dias`.
- El archivo fisico se elimina al vencer `delete_after_at`.
- La metadata queda historica con `deleted_at`.

Ejecucion manual dentro de la app:

```bash
docker exec stk-soporte_app sh -lc "npm run attachments:cleanup"
```

Verificacion:

```bash
docker exec stk-soporte_postgres psql -U stockgi_migrator -d stockgi_soporte_ti -c "select count(*) from ticket_attachments where deleted_at is null and delete_after_at <= now();"
```

Para automatizar por systemd en la VM, usar `docs/runbook-retencion-adjuntos.md`.

## Checklist despues de deploy

Ejecutar:

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
docker logs --tail=100 stk-soporte_app
docker logs --tail=100 stk-soporte_postgres
curl -I http://127.0.0.1:3002
```

Validar en navegador:

- login admin
- login usuario
- crear ticket
- subir adjunto PNG/PDF
- tomar y cerrar ticket
- descargar adjunto
- revisar dashboard y reportes
- logout

Validar seguridad basica:

- PostgreSQL no tiene puerto publico.
- `.env.production` no esta en Git.
- `SESSION_COOKIE_SECURE=true` en produccion HTTPS.
- Cloudflare Tunnel publica solo la app.
- Backups recientes existen (`docker ps` debe mostrar `stk-soporte_backup` como `Up`, no
  `Exited`; si esta detenido no hay backups nuevos aunque el volumen tenga dumps viejos).
- Si la migracion agrega RLS a una tabla nueva, confirmar que existan las 4 politicas
  (select/insert/update/delete): `select polname, polcmd from pg_policies join pg_policy on
  pg_policies.policyname=pg_policy.polname where tablename='NOMBRE_TABLA';`. Postgres deniega
  en silencio (0 filas, sin error) el comando que no tenga politica.

## Diagnostico rapido

App no abre:

```bash
docker logs --tail=200 stk-soporte_app
docker inspect stk-soporte_app --format '{{json .State}}'
```

PostgreSQL no esta sano:

```bash
docker logs --tail=200 stk-soporte_postgres
docker exec stk-soporte_postgres pg_isready -U stockgi_migrator -d stockgi_soporte_ti
```

Tunnel no publica:

```bash
docker logs --tail=200 stk-soporte_cloudflared
curl -I http://127.0.0.1:3002
```

Adjuntos no descargan:

```bash
docker exec stk-soporte_postgres psql -U stockgi_migrator -d stockgi_soporte_ti -c "select id, storage_path, deleted_at from ticket_attachments order by created_at desc limit 10;"
docker exec stk-soporte_app sh -lc "ls -lah /var/lib/stockgi/uploads"
```

Migraciones fallan desde Windows por `postgres ENOTFOUND`:

- Ejecutarlas dentro del contenedor `stk-soporte_app`.
- Ese host solo resuelve dentro de la red Docker.

## Rollback basico

Si el deploy nuevo falla pero la base no cambio:

```bash
git log --oneline -5
git checkout <commit_anterior>
docker compose --env-file .env.production -p stk-soporte build --pull=false app
docker compose --env-file .env.production -p stk-soporte up -d --force-recreate app
```

Si hubo migraciones destructivas, no hacer rollback improvisado. Restaurar primero en base temporal, validar impacto y decidir ventana de mantenimiento.

## Comandos frecuentes

```bash
# Ver contenedores
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Ver logs app
docker logs -f stk-soporte_app

# Reiniciar app
docker compose --env-file .env.production -p stk-soporte restart app

# Reiniciar todo el stack principal
docker compose --env-file .env.production -p stk-soporte up -d app postgres

# Detener app sin borrar datos
docker compose --env-file .env.production -p stk-soporte stop app

# Nunca usar en produccion sin backup verificado
# docker volume rm stk-soporte_postgres_data
# docker volume rm stk-soporte_storage_data
```