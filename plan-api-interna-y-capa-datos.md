# Plan API interna y capa de datos - StockGI Soporte TI

## Objetivo

Preparar la app web para operar con backend real sin depender todavia del proyecto Supabase remoto. La aplicacion mantiene datos demo, pero ahora usa una arquitectura intermedia compatible con la futura base de datos:

```text
Frontend
  -> API routes internas de Next.js
     -> servicios de negocio server-side
        -> repositorio demo temporal
        -> repositorio PostgreSQL local futuro
```

## Estado actual validado

- `DATA_SOURCE="demo"` es el modo activo actual.
- API interna activa para auth, tickets, usuarios, contratos, categorias, adjuntos y carga masiva.
- Supabase remoto queda como alternativa futura; la decision vigente de produccion es PostgreSQL local en la VM.
- CSV es el formato activo para carga masiva.
- XLSX fue eliminado para evitar dependencia vulnerable y confusion.
- La app ya tiene migraciones SQL basadas en PostgreSQL que pueden adaptarse al PostgreSQL local.
- La app ahora tiene API interna y servicios server-side.
- El repositorio temporal usa los datos de `demo-data` en memoria del proceso de Next.js.
- No hay persistencia real todavia; al reiniciar el servidor se restauran los datos demo.
- Proteccion de rutas por sesion y rol implementada con layouts server-side.
- El login / redirige automaticamente al home del rol cuando existe sesion activa.

## Capa de repositorios

Se agrego una capa formal de repositorios:

```text
src/server/repositories/types.ts
src/server/repositories/demo-repository.ts
src/server/repositories/supabase-repository.ts
src/server/repositories/postgres-repository.ts
src/server/repositories/index.ts
```

Selector actual:

```env
DATA_SOURCE="demo"
```

Valores esperados:

| Valor | Estado | Uso |
| --- | --- | --- |
| `demo` | Activo | Usa datos demo en memoria del proceso Next.js |
| `postgres` | Implementado, pendiente prueba en VM | Usa PostgreSQL local con sesiones opacas, usuarios, contratos, tickets, comentarios y adjuntos |
| `supabase` | Alternativa futura | Usaria Supabase si se decide volver a cloud administrado |

El repositorio Supabase existe como stub historico. El repositorio PostgreSQL local ya esta implementado y se activa con `DATA_SOURCE="postgres"`, pendiente de prueba contra la VM.
## Capa server-side creada

Carpetas principales:

```text
src/server/auth
src/server/contracts
src/server/users
src/server/tickets
src/server/categories
src/server/attachments
src/server/session
```

Responsabilidades:

| Modulo | Responsabilidad |
| --- | --- |
| `auth` | Login demo por contrato, cedula y contrasena; validacion de rol |
| `session` | Cookie `httpOnly` firmada para sesion basica |
| `tickets` | Crear, consultar, tomar, comentar, solicitar informacion y cerrar tickets |
| `contracts` | Listar, crear y actualizar contratos |
| `users` | Listar, crear y actualizar usuarios |
| `categories` | Exponer catalogo fijo |
| `attachments` | Validacion base de tipo, peso y metadata futura |

## Endpoints internos

### Autenticacion

| Metodo | Ruta | Uso |
| --- | --- | --- |
| POST | `/api/auth/login` | Login con contrato, cedula y contrasena demo |
| POST | `/api/auth/logout` | Borra cookie de sesion |
| GET | `/api/auth/me` | Devuelve usuario autenticado |

Login actual:

```json
{
  "contractId": "operacion-norte",
  "documentId": "10101010",
  "password": "stockgi-demo"
}
```

Respuesta:

```json
{
  "data": {
    "user": {}
  }
}
```

### Catalogos

| Metodo | Ruta | Uso |
| --- | --- | --- |
| GET | `/api/contracts` | Lista contratos |
| GET | `/api/categories` | Lista categorias y tipos |

### Tickets

| Metodo | Ruta | Uso |
| --- | --- | --- |
| GET | `/api/tickets` | Lista tickets segun rol |
| POST | `/api/tickets` | Crea ticket de usuario |
| GET | `/api/tickets/[id]` | Consulta detalle con permisos |
| POST | `/api/tickets/[id]/take` | TI operativo toma ticket |
| POST | `/api/tickets/[id]/comment` | Agrega comentario |
| POST | `/api/tickets/[id]/request-info` | TI solicita informacion |
| POST | `/api/tickets/[id]/close` | TI cierra ticket |

Reglas actuales:

- Usuario ve solo tickets propios.
- TI operativo ve tickets sin asignar, en espera o asignados a el.
- TI administrativo ve todos los tickets.
- Crear ticket asigna prioridad desde categoria/tipo.
- Tomar ticket asigna tecnico y pasa a `En proceso`.
- Solicitar informacion requiere comentario y pasa a `Esperando informacion`.
- Cerrar ticket requiere solucion y pasa a `Cerrado`.

### Administracion

| Metodo | Ruta | Uso |
| --- | --- | --- |
| GET | `/api/admin/users` | Lista usuarios, solo admin |
| POST | `/api/admin/users` | Crea usuario, solo admin |
| PATCH | `/api/admin/users/[id]` | Actualiza usuario, solo admin |
| GET | `/api/admin/contracts` | Lista contratos, solo admin |
| POST | `/api/admin/contracts` | Crea contrato, solo admin |
| PATCH | `/api/admin/contracts/[id]` | Actualiza contrato, solo admin |

## Sesion

La sesion usa dos modos segun `DATA_SOURCE`:

```text
stockgi_session
```

Propiedades:

- `httpOnly`
- `sameSite=lax`
- `secure` solo en produccion
- duracion: 8 horas

Modo demo: payload firmado compatible con la demo. Modo PostgreSQL: token opaco, hash del token en `app_sessions`, revocacion en logout, expiracion y eventos en `session_events`.

## Proteccion de rutas visuales

Implementado con layouts server-side de Next.js. No se usa `proxy.ts` en esta fase porque la sesion firmada ya se valida desde servidor y los endpoints siguen siendo la segunda capa de autorizacion.

Archivos principales:

```text
src/server/navigation.ts
src/app/page.tsx
src/app/login-client.tsx
src/app/usuario/layout.tsx
src/app/ti/layout.tsx
src/app/admin/layout.tsx
src/app/tickets/layout.tsx
```

Reglas activas:

| Ruta | Acceso |
| --- | --- |
| `/` | Si hay sesion, redirige al home del rol |
| `/usuario/*` | Solo rol `usuario` |
| `/ti/*` | Solo rol `ti_operativo` |
| `/admin/*` | Solo rol `ti_administrativo` |
| `/tickets/[id]` | Cualquier usuario autenticado; permisos especificos se validan en API/servicio |

Homes por rol:

| Rol | Home |
| --- | --- |
| `usuario` | `/usuario` |
| `ti_operativo` | `/ti` |
| `ti_administrativo` | `/admin` |

La proteccion visual no reemplaza los permisos de API. Las rutas API deben mantener `401` cuando no hay sesion y `403` cuando el rol no corresponde.

## Adjuntos

Fase actual:

- El frontend permite seleccionar imagenes o PDF.
- Se guarda metadata estructurada de adjuntos: nombre, tipo, peso original, peso final, estado de compresion y retencion.
- El servicio `attachments` ya define validaciones base:
  - PNG
  - JPG/JPEG
  - WebP
  - PDF
  - maximo 10 MB
- La retencion definida para produccion sera 30 dias despues del cierre del ticket.

Fase PostgreSQL local / produccion:

- Guardar archivos en storage privado local.
- Guardar metadata en `ticket_attachments`.
- Comprimir imagenes antes de subir cuando sea posible.
- Programar eliminacion fisica despues de `closed_at + 30 dias`.

## Migracion futura a PostgreSQL local

Cuando la VM este lista con PostgreSQL local:

1. Crear base `stockgi_soporte_ti`.
2. Ejecutar migraciones y seed adaptados a PostgreSQL local.
3. Copiar variables reales a `.env.production`.
4. Crear `postgres-repository` con la misma interfaz del repositorio demo.
5. Cambiar `DATA_SOURCE` de `demo` a `postgres`.
6. Mantener los endpoints actuales sin cambiar frontend.
7. Probar permisos por rol, tickets, adjuntos y carga masiva.

## Pendientes

- Probar acceso SSH a la VM por Tailscale.
- Instalar Docker y PostgreSQL local en la VM.
- Conectar login real con hash de contrasena.
- Subir adjuntos reales a storage privado local.
- Cambiar `DATA_SOURCE` de `demo` a `postgres` cuando la VM este lista.
## Comandos de verificacion

```powershell
cd "D:\12. StockGI\TI_ticket\stockgi-soporte-ti-web"
npm run build
npm run lint
npm run dev -- --hostname 127.0.0.1 --port 3001
```


## Avance adicional antes de PostgreSQL local

Implementado en modo `DATA_SOURCE="demo"`:

- Adjuntos con metadata estructurada en frontend y API.
- Validacion de tipos permitidos: PNG, JPG/JPEG, WebP y PDF.
- Limite logico de 10 MB por archivo.
- Compresion cliente de imagenes a WebP con lado largo maximo de 1600 px.
- Endpoint `POST /api/tickets/[id]/attachments` para agregar metadata de adjuntos al ticket.
- Carga masiva real desde `.csv` con endpoint `POST /api/admin/import-users`.
- Validacion de columnas oficiales de plantilla CSV.
- Validacion por fila: contrato, cedula, nombre, rol, estado y duplicados por contrato.
- Creacion de usuarios validos en repositorio demo.
- Logout visible conectado a `/api/auth/logout`.
- Rehidratacion basica del adaptador frontend desde API interna y /api/auth/me.
- Proteccion de rutas por sesion y rol en layouts server-side.

Pendientes para PostgreSQL local en VM:

- Subir archivos reales a storage privado local.
- Guardar metadata real de adjuntos en tabla `ticket_attachments`.
- Ejecutar tarea de eliminacion fisica despues de 30 dias desde cierre.
- Cambiar `DATA_SOURCE="demo"` a `DATA_SOURCE="postgres"` cuando la VM este activa.
- Probar carga masiva contra tabla real `app_users`.
- Probar login real con BCrypt cost 12 contra PostgreSQL local.


## Estado real implementado - PostgreSQL local

Implementado en codigo:

- `DATA_SOURCE="postgres"` como selector de repositorio real.
- Cliente PostgreSQL lazy en `src/server/db` para no romper `next build` sin `DATABASE_URL`.
- Migracion inicial en `database/migrations/0001_initial_postgres.sql`.
- Seed minimo en `database/seeds/0001_seed_minimal.sql`.
- Usuarios DB separados por intencion: migrator para DDL y app para DML.
- Login real con BCrypt cost 12.
- Bloqueo de usuario: 5 intentos fallidos bloquean 15 minutos.
- Sesion opaca en `app_sessions` con cookie `stockgi_session` httpOnly.
- Cambio obligatorio de contrasena en `/cambiar-contrasena`.
- Storage privado local para adjuntos con metadata en PostgreSQL.
- Endpoint de descarga autenticado de adjuntos.
- Scripts `db:migrate`, `db:seed` y `attachments:cleanup`.
- Dockerfile y `docker-compose.yml` aislados con `COMPOSE_PROJECT_NAME=stockgi_soporte_ti`.

Pendiente de infraestructura:

- Crear `.env.production` real en la VM, sin subirlo a Git.
- Levantar PostgreSQL local con Docker en la VM.
- Ejecutar migraciones y seed contra la base real.
- Probar backup y restore.
- Configurar Cloudflare Tunnel para `soporte.stockgi.com`.
- Hacer prueba funcional completa con `DATA_SOURCE="postgres"`.

Nota tecnica: el build de produccion usa `next build --webpack` porque Turbopack muestra una advertencia NFT al trazar el endpoint de descarga autenticada de archivos privados. Webpack valida limpio este caso. El endpoint quedo como Node runtime dinamico y el storage valida rutas para evitar path traversal.