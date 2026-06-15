# CLAUDE.md — stockgi-soporte-ti-web

> Este archivo complementa el CLAUDE.md global (`C:\Users\Andres Rodgers\.claude\CLAUDE.md`). No repite reglas ya definidas allí.

---

## Qué es el proyecto

Portal interno de soporte TI para StockGI. Los usuarios finales (empleados) crean tickets de soporte; el equipo de TI los atiende y cierra. Hay tres perfiles de usuario: empleado que reporta incidencias, técnico operativo TI que resuelve, y administrador TI que gestiona usuarios, contratos y reportes.

---

## Stack técnico

| Capa | Tecnología | Versión exacta |
|---|---|---|
| Framework | Next.js | 16.2.7 |
| UI | React | 19.2.4 |
| Estilos | Tailwind CSS v4 | ^4 |
| Base de datos | PostgreSQL (via `pg`) | ^8.21.0 |
| Hashing de contraseñas | bcryptjs | ^3.0.3 |
| Lenguaje | TypeScript | ^5 |

No hay ORM. Las consultas son SQL directo via la función `query()` de `src/server/db/index.ts`.

---

## Comandos

```bash
npm run dev                  # servidor de desarrollo
npm run build                # build de producción (--webpack)
npm run start                # servidor de producción
npm run lint                 # ESLint
npm run db:migrate           # ejecutar migraciones PostgreSQL
npm run db:seed              # seed mínimo de datos
npm run db:seed:demo         # seed local de QA/paginacion; no usar en produccion
npm run attachments:cleanup  # limpiar archivos adjuntos vencidos
npm run validate:encoding    # validar encoding de archivos CSV
```

---

## Estructura de carpetas

```
src/
├── app/
│   ├── page.tsx                    # login (raíz)
│   ├── cambiar-contrasena/         # flujo de contraseña temporal obligatoria
│   ├── usuario/                    # portal del empleado
│   │   ├── crear-ticket/           # formulario de creación de ticket
│   │   └── tickets/                # listado de tickets del usuario
│   ├── ti/                         # portal del equipo TI
│   │   ├── asignados/              # tickets asignados al técnico
│   │   └── espera/                 # tickets en espera de información
│   ├── admin/                      # portal del administrador TI
│   │   ├── usuarios/               # gestión de usuarios
│   │   ├── contratos/              # gestión de contratos
│   │   ├── catalogo/               # categorías y tipos de solicitud
│   │   ├── carga-masiva/           # importación de usuarios por CSV
│   │   └── reportes/               # reportes y métricas
│   ├── tickets/[id]/               # detalle de ticket (compartido por todos los roles)
│   └── api/                        # Route Handlers de Next.js
│       ├── auth/                   # login, logout, me, change-password
│       ├── tickets/                # CRUD tickets + adjuntos + acciones
│       ├── admin/                  # usuarios, contratos, importación masiva
│       ├── categories/             # catálogo de categorías
│       ├── contracts/              # contratos disponibles al login
│       └── users/                  # listado de usuarios (para asignación)
├── components/
│   ├── ui.tsx                      # componentes base compartidos (ver sección UI)
│   ├── tickets.tsx                 # componentes de listado y tarjeta de ticket
│   └── app-shell.tsx               # layout principal con sidebar y topbar
├── context/
│   └── app-state.tsx               # estado global del cliente (AppStateContext)
├── server/
│   ├── db/index.ts                 # pool de conexión PostgreSQL y función query()
│   ├── auth/                       # login, rate limiting, cambio de contraseña
│   ├── session/                    # cookie HMAC-SHA256 + tabla app_sessions
│   ├── repositories/               # interfaz DataRepository + implementación postgres
│   ├── tickets/                    # lógica de negocio de tickets
│   ├── users/                      # lógica de negocio de usuarios
│   ├── contracts/                  # lógica de negocio de contratos
│   ├── categories/                 # catálogo de categorías y tipos de solicitud
│   ├── bulk-import/                # importación masiva de usuarios desde CSV
│   ├── attachments/                # gestión y almacenamiento de adjuntos en disco
│   ├── navigation.ts               # guards de sesión y redirección por rol
│   └── http.ts                     # helpers de respuesta HTTP
├── lib/
│   ├── types.ts                    # fuente de verdad de todos los tipos del dominio
│   ├── api-client.ts               # apiFetch helper para llamadas del cliente
│   └── client-files.ts             # validación de archivos antes de subir
└── i18n/
    ├── config.ts                   # configuración de locale
    ├── index.ts                    # función t() de traducción
    └── dictionaries/es-CO.ts       # strings en español Colombia
```

---

## Estado de la data

- **PostgreSQL real, conectado.** No hay mocks ni datos en memoria en producción.
- La variable `DATA_SOURCE="postgres"` controla qué repositorio usa `src/server/repositories/index.ts`.
- Migraciones en `database/migrations/0001_initial_postgres.sql`. El script `db:migrate` las aplica.
- Adjuntos almacenados en disco en la ruta configurada por `UPLOAD_ROOT` (por defecto `./uploads`).
- Seed mínimo (`db:seed`) crea el primer contrato y usuario administrador.
- Seed local de QA (`db:seed:demo`) agrega usuarios y tickets de prueba para paginacion; no se usa en produccion.

---

## QA y validacion

Runbook principal: `docs/runbook-qa-end-to-end.md`.

Ultima corrida validada:

- `npm run validate:encoding`, `npm run lint` y `npm run build` pasaron en el repo host.
- `db:migrate` y `db:seed` pasaron dentro de `stk-soporte_app`.
- Login por API validado para `ti_administrativo`, `ti_operativo` y `usuario`.
- Ticket real creado, adjuntos PNG/PDF subidos y descarga autenticada validada.
- Archivo invalido rechazado por MIME.
- Flujo TI validado: tomar ticket, solicitar informacion y cerrar.
- Paginacion server-side validada.
- Logout invalida la sesion.

Nota operativa: si se ejecuta `npm run lint` dentro de una imagen Docker vieja puede fallar por no encontrar `eslint.config.*`; validar lint/build en el repo fuente o reconstruir la imagen antes de usarla como referencia.

---

## Auth

Auth **real y en producción**, no es provisional.

- Login por `contractId` + `document_id` + `password` (bcrypt). El contrato actúa como tenant.
- Sesión persistida en tabla `app_sessions` con token HMAC-SHA256 firmado. Cookie `stockgi_session` httpOnly, SameSite=lax.
- TTL de sesión configurable via `SESSION_TTL_HOURS` (default 8 horas).
- Rate limiting por IP: máx 10 intentos en 15 minutos → bloqueo temporal (`auth_rate_limits`).
- Bloqueo por usuario: 5 intentos fallidos → bloqueo de 15 minutos en `app_users.locked_until`.
- Flujo de contraseña temporal: `must_change_password=true` → redirige a `/cambiar-contrasena` antes de dar acceso.
- Guards en `src/server/navigation.ts`: `requirePageSession()` valida sesión, rol y estado de contraseña en SSR.
- Roles y rutas home: `usuario → /usuario`, `ti_operativo → /ti`, `ti_administrativo → /admin`.
- Evento de auditoría en `session_events` en cada login, logout y cambio de contraseña.

Variables requeridas:

```env
DATABASE_URL=
MIGRATION_DATABASE_URL=
SESSION_SECRET=          # mínimo 32 bytes
SESSION_COOKIE_SECURE=   # "true" en producción HTTPS
SESSION_TTL_HOURS=8
APP_BASE_URL=
UPLOAD_ROOT=
```

---

## Decisiones de arquitectura

- **Multi-tenant por contrato.** Cada usuario pertenece a un contrato (`contract_id`). El ticket hereda el contrato del usuario que lo crea. No hay aislamiento RLS en PostgreSQL; el filtrado es a nivel de aplicación en el repositorio.
- **Repositorio como capa de abstracción.** `src/server/repositories/types.ts` define la interfaz `DataRepository`. La implementación activa es `postgres-repository.ts`. Si se quisiera agregar otro backend de datos, se implementa esa interfaz.
- **Sin ORM.** Todas las consultas son SQL parametrizado directo. Los tipos de base de datos son internos al repositorio; la app consume los tipos de `src/lib/types.ts`.
- **Sin middleware de autenticación Next.js.** La validación de sesión ocurre en cada Server Component/Route Handler vía `requirePageSession()` o `getSession()`. No hay `middleware.ts`.
- **Estado cliente centralizado.** `AppStateContext` en `src/context/app-state.tsx` mantiene el estado global del cliente con fetching inicial y mutaciones optimistas donde aplica.
- **Adjuntos en disco local.** No se usa S3 ni almacenamiento externo. Los archivos se guardan en `UPLOAD_ROOT`. En producción esto implica persistencia del volumen (Docker) o migración futura a object storage.
- **i18n mínima.** Solo `es-CO`. La función `t()` resuelve strings del diccionario; no hay librerías externas de i18n.

---

## Convenciones de UI

### Tokens de color (`src/app/globals.css`)

| Variable CSS | Valor | Uso |
|---|---|---|
| `--brand-primary` | `#0b8e36` | Verde principal, botones, acentos |
| `--brand-primary-dark` | `#086b2a` | Hover de botones primarios |
| `--brand-primary-soft` | `#e8f6ed` | Fondos suaves, hover ghost |
| `--brand-secondary` | `#657269` | Texto secundario, etiquetas |
| `--background` | `#f3f7f4` | Fondo general de la app |
| `--foreground` | `#152219` | Texto principal |
| `--app-surface` | `#ffffff` | Superficie de cards |
| `--app-muted` | `#eef5f0` | Fondos de sección interna |
| `--app-input` | `#edf4ef` | Fondo de inputs y selects |
| `--app-border` | `rgba(11,142,54,0.12)` | Bordes de cards |
| `--st-blue` | `#2468a2` | Estado "Nuevo/Asignado" |
| `--st-amber` | `#c98712` | Estado "En proceso/Espera" |
| `--st-green` | `#0b8e36` | Estado "Resuelto" |
| `--st-red` | `#c94632` | Estado "Cancelado/Reabierto" |
| `--st-gray` | `#69756e` | Estado "Cerrado" |
| `--shadow-sm` | `0 2px 12px -5px rgba(11,142,54,0.18)` | Cards |
| `--shadow-md` | `0 14px 38px -20px rgba(11,142,54,0.3)` | Modales, elevación |

### Tipografía

- **Cuerpo:** `"Avenir LT Std"`, fallback `"Avenir Next"`, `Inter`, `Arial`.
- **Brand/Titulares:** `"BankGothic"` con clase `.font-brand`.
- **Mono:** `"Geist Mono"`.

### Border radius

- Cards: `rounded-[14px]` (14px).
- Botones: `rounded-[14px]` (14px).
- Inputs/selects: `13px` (`.select-field` global).

### Clases utilitarias globales

| Clase | Descripción |
|---|---|
| `.sidebar-gradient` | Gradiente verde del sidebar (`#0d7b34 → #06481e`) |
| `.topbar-glass` | Glassmorphism del topbar (blur 12px) |
| `.card-shadow` | Sombra de cards (usa `--shadow-sm`) |
| `.btn-shadow` | Sombra de botones primarios |
| `.select-field` | Estilo unificado para `<select>` |
| `.scrollbar-thin` | Scrollbar delgado verde |
| `.sidebar-scrollbar` | Scrollbar del sidebar (blanco semitransparente) |

### Componentes compartidos (`src/components/ui.tsx`)

| Componente | Descripción |
|---|---|
| `<Card>` | Contenedor blanco con `rounded-[14px]` y `card-shadow` |
| `<PageHeader>` | Encabezado de página con eyebrow, título, descripción y acción opcional |
| `<ButtonLink>` | Botón como `<Link>` con variantes `primary`, `secondary`, `ghost` |
| `<Badge>` | Indicador de estado con punto de color y tono (`blue`, `amber`, `green`, `red`, `gray`) |
| `<Field>` | Wrapper de campo de formulario con label |
| `statusTone(status)` | Función que mapea `TicketStatus` → tono de Badge |
| `priorityTone(priority)` | Función que mapea `Priority` → tono de Badge |

---

## Enumeraciones clave del dominio

**Fuente de verdad:** [`src/lib/types.ts`](src/lib/types.ts)

### Roles (`Role`)

| Valor | Descripción | Ruta home |
|---|---|---|
| `"usuario"` | Empleado que crea tickets | `/usuario` |
| `"ti_operativo"` | Técnico TI que resuelve tickets | `/ti` |
| `"ti_administrativo"` | Admin TI (usuarios, contratos, reportes) | `/admin` |

### Estados de ticket (`TicketStatus`)

`"Nuevo"` → `"Asignado"` → `"En proceso"` → `"Esperando informacion"` → `"Resuelto"` → `"Cerrado"`

También: `"Reabierto"`, `"Cancelado"`

Mapeo DB (snake_case) ↔ app (Pascal/space) definido en `src/server/repositories/postgres-repository.ts`:
- `statusToDb` y `statusFromDb` son los traductores — no mapear manualmente en otro lugar.

### Prioridades (`Priority`)

`"Baja"` | `"Media"` | `"Alta"` | `"Critica"`

### Estado de contratos y usuarios

`"Activo"` / `"Inactivo"` en la capa de aplicación → `"active"` / `"inactive"` en base de datos.

### Regla de adjunto (`attachmentRule`)

`"No obligatorio"` | `"Recomendado"` (definido en `TicketRequestType`).

---

## Regla de mantenimiento

Actualizar este archivo cuando:

- Se agreguen nuevas rutas de página o segmentos bajo `app/`
- Cambie el sistema de autenticación o sesión
- Se agreguen nuevos roles o estados de ticket en `src/lib/types.ts`
- Se agreguen tokens CSS o componentes compartidos en `ui.tsx`
- Se migre el almacenamiento de adjuntos (disco → S3 u otro)
- Se agreguen dependencias con versión relevante al stack
