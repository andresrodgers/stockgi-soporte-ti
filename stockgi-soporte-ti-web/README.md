# StockGI Soporte TI Web

App web privada para gestion de tickets de soporte TI de StockGI.

## Desarrollo local

```powershell
npm install
npm run dev -- --hostname 127.0.0.1 --port 3001
```

Modo local por defecto:

```env
DATA_SOURCE="demo"
```

## Validacion

`powershell
npm run lint
npm run build
` 

El script 
pm run build usa 
ext build --webpack para evitar el warning de Turbopack en el endpoint de descarga autenticada de adjuntos privados.

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