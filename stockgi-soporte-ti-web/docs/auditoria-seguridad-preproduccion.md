# Auditoria de seguridad preproduccion - StockGI Soporte TI

Fecha: 2026-06-14
Proyecto: StockGI Soporte TI
Estado: remediacion aplicada antes de despliegue publico.

## Objetivo

Registrar el estado de seguridad especifico de esta app antes del despliegue y dejar trazabilidad local del bloque de endurecimiento aplicado sobre StockGI Soporte TI.

## Hallazgos originales

1. Faltaba CSRF para mutaciones con cookie de sesion.
2. Faltaba idempotencia en creacion de tickets e importacion CSV.
3. Los adjuntos validaban MIME declarado, pero no extension ni firma real del archivo.
4. El CSV no tenia limites firmes por peso, filas y longitud de campos.
5. `/api/categories` estaba expuesto sin sesion.
6. Los errores API devolvian demasiados `error.message` al cliente.
7. Faltaba HSTS y la CSP no diferenciaba dev/prod.
8. El aislamiento multi-contrato dependia demasiado del backend; faltaba RLS en PostgreSQL.
9. `npm audit` reportaba vulnerabilidad moderada transitiva en `postcss` via `next`.

## Remediacion aplicada

- CSRF token server-side para mutaciones autenticadas.
- `Idempotency-Key` para `tickets.create` e `admin.importUsers`.
- Validacion server-side de adjuntos por MIME, extension y magic bytes.
- Limites CSV por tamano, filas, columnas permitidas y longitud de campo.
- `/api/categories` protegido por sesion.
- Errores publicos normalizados y detalle interno en logs.
- Headers productivos reforzados con HSTS y CSP diferenciada dev/prod.
- Migracion `0005_security_csrf_idempotency_rls.sql` con RLS y tablas auxiliares.
- Override de `postcss@8.5.10` en `package.json` para eliminar la vulnerabilidad reportada por `npm audit` sin usar `audit fix --force`.

## Validacion ejecutada

- `npm run validate:encoding`: OK.
- `npm run lint`: OK.
- `npm run build`: OK.
- `npm audit --audit-level=moderate`: OK, 0 vulnerabilidades.
- `docker compose --env-file .env.production -p stk-soporte build --pull=false app`: OK.
- `docker compose --env-file .env.production -p stk-soporte up -d --force-recreate app`: OK.
- `docker compose --env-file .env.production -p stk-soporte exec app npm run db:migrate`: OK, incluyendo `0005_security_csrf_idempotency_rls.sql`.
- `/api/categories` sin sesion: `401`.
- `/api/contracts` sin sesion: `200`, solo contratos activos y campos minimos.
- Headers verificados en `http://127.0.0.1:3002`: CSP, HSTS y `nosniff` presentes.
- `docker compose --env-file .env.production -p stk-soporte exec app npm run attachments:cleanup`: OK.

## Pendiente manual

La validacion autenticada completa con admin no se completo en este bloque porque la base local ya tenia una contrasena distinta a la del seed inicial. No se reseteo sin autorizacion explicita para no alterar credenciales del entorno actual.

## Relacion con la base de conocimiento externa

Los patrones reutilizables derivados de esta auditoria deben vivir en `D:\8. Desarrollo`. Este documento queda solo en el repositorio del proyecto por ser especifico de StockGI Soporte TI.