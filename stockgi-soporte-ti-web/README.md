# StockGI Soporte TI Web

App web privada para gestion de tickets de soporte TI de StockGI.

## Desarrollo local

```powershell
npm install
npm run dev -- --hostname 127.0.0.1 --port 3001
```

La app requiere PostgreSQL como unica fuente de datos activa. El entorno debe configurarse asi:

```env
DATA_SOURCE="postgres"
```

Cualquier otro valor de `DATA_SOURCE` no esta soportado en esta version.

## Idioma y encoding

La interfaz usa espanol Colombia/LatAm (`es-CO`) mediante diccionarios locales en `src/i18n`. Los textos visibles deben centralizarse alli o pasar por formatters (`formatRole`, `formatTicketStatus`, `formatPriority`). Los archivos deben guardarse en UTF-8 sin BOM.

```powershell
npm run validate:encoding
```

## Paginacion

Las listas productivas usan paginacion server-side sobre PostgreSQL. El patron de API es:

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "totalItems": 0,
    "totalPages": 1
  }
}
```

En la API publica de Next se expone como `tickets/users + pagination` para mantener compatibilidad con las pantallas actuales. Las vistas paginadas usan `10` registros por pagina y reinician a pagina `1` cuando cambia un filtro o bandeja.

## Validacion

```powershell
npm run validate:encoding
npm run lint
npm run build
```

El script `npm run build` usa `next build --webpack` para evitar el warning de Turbopack en el endpoint de descarga autenticada de adjuntos privados.

La validacion end-to-end manual esta documentada en `docs/runbook-qa-end-to-end.md`. La ultima corrida valida confirmo:

- login por rol: usuario, TI operativo y TI administrativo
- creacion de ticket real
- subida y descarga de adjuntos PNG/PDF
- rechazo de archivo no permitido
- flujo TI: tomar, solicitar informacion y cerrar
- paginacion server-side
- logout con sesion invalidada

## Produccion objetivo

La produccion objetivo usa:

- Next.js en Node runtime.
- PostgreSQL local en la VM Ubuntu.
- Storage privado local para adjuntos.
- Sesiones opacas con cookie `stockgi_session`.
- Docker Compose aislado con `COMPOSE_PROJECT_NAME=stk-soporte`.
- Cloudflare Tunnel para `soporte.stockgi.com`.

## Variables

Copiar `.env.production.example` a `.env.production` en la VM y completar valores reales. No subir `.env.production` a Git.

## Base de datos

```bash
npm run db:migrate
npm run db:seed
```

El seed crea un contrato base y un admin temporal. La contrasena temporal debe cambiarse en el primer login.

## Docker

```bash
COMPOSE_PROJECT_NAME=stk-soporte docker compose --env-file .env.production up -d --build
```

PostgreSQL no debe exponerse a internet. Cloudflare Tunnel publica solo la app.

Runbook operativo completo: docs/runbook-produccion-stk-soporte.md.

Para cambios de codigo en Docker local:

```powershell
docker compose --env-file .env.production -p stk-soporte build --pull=false app
docker compose --env-file .env.production -p stk-soporte up -d --force-recreate app
```

Si se ejecutan migraciones o seeds desde el host Windows y `postgres` no resuelve, correrlos dentro del contenedor `stk-soporte_app`, porque ahi si existe la red interna de Docker.