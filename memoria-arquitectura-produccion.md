# Memoria de arquitectura de produccion - StockGI Soporte TI

## Estado vigente

Fecha de decision: 2026-06-11

La decision vigente para produccion es desplegar la app en el servidor fisico de StockGI usando una VM Ubuntu y publicar el acceso externo mediante Cloudflare Tunnel.

## Infraestructura confirmada

```text
Servidor fisico: Windows con VM Ubuntu
Sistema VM: Ubuntu Server 24.04 LTS
IP local VM: 192.168.68.129
IP Tailscale/VPN VM: 100.116.114.36
Usuario SSH: stockgiadmin
Puerto SSH: 22
Recursos VM: 4 vCPU / 16 GB RAM / 256 GB disco
IP publica: No aplica / Protegido
Llave entregada: D:\12. StockGI\PPK\llave_definitiva.ppk
```

## Decision de publicacion

La app sera publica en internet por URL HTTPS, pero el acceso funcional sera privado por credenciales de usuarios creadas por la empresa.

Ruta recomendada:

```text
Usuarios finales
  -> https://soporte.stockgi.com
    -> Cloudflare
      -> Cloudflare Tunnel
        -> VM Ubuntu
          -> App Next.js StockGI Soporte TI
          -> PostgreSQL local privado
          -> Storage privado de adjuntos
```

## Cloudflare

StockGI ya tiene acceso a una cuenta Cloudflare con al menos un dominio en plan Free.

Decision:

- Usar Cloudflare Tunnel para no exponer la IP real del servidor.
- Mantener SSH solo por Tailscale, no publico.
- Mantener PostgreSQL y storage sin exposicion a internet.
- Usar subdominio recomendado: `soporte.stockgi.com`.

Notas:

- El dominio principal `stockgi.com` actualmente tiene la web principal alojada en Hostinger.
- Se debe validar si el DNS completo de `stockgi.com` puede pasar a Cloudflare.
- Si el DNS se mueve a Cloudflare, la web principal puede seguir alojada en Hostinger mediante registros DNS equivalentes.
- Cloudflare Tunnel se configura desde el panel de Cloudflare o por CLI `cloudflared` en la VM.

## MCP/automatizacion Cloudflare

En esta sesion de trabajo no aparece disponible un MCP/connector de Cloudflare.

Resultado de revision:

```text
Tool search: Cloudflare tunnel DNS zones -> 0 tools encontrados
```

Por ahora, la configuracion real de Cloudflare debe hacerse desde:

- Panel web de Cloudflare; o
- CLI `cloudflared` conectada a la cuenta; o
- API de Cloudflare si mas adelante se agregan credenciales/herramientas.

## Base de datos y archivos

Decision vigente:

```text
Base de datos: PostgreSQL local en la VM
Adjuntos: storage privado local
```

PostgreSQL debe guardar:

- contratos;
- usuarios;
- tickets;
- comentarios;
- eventos/auditoria;
- metadata de adjuntos;
- configuracion de catalogos y SLA.

Los archivos no deben guardarse directamente dentro de PostgreSQL en primera version. Se guardan en storage privado y PostgreSQL conserva metadata:

- nombre original;
- tipo MIME;
- tamano original;
- tamano almacenado;
- ruta interna privada;
- estado de compresion;
- fecha `delete_after_at`;
- fecha `deleted_at` cuando se elimine fisicamente.

Retencion definida:

```text
Eliminar archivo fisico 30 dias despues de cerrar el ticket.
Mantener metadata historica del adjunto.
```

## Relacion con Supabase

Supabase queda como referencia tecnica y posible alternativa futura, pero ya no es el destino principal de produccion.

El modelo SQL y las migraciones existentes siguen siendo utiles porque estan basadas en PostgreSQL y pueden adaptarse al PostgreSQL local.

Decision actual:

```text
No esperar Supabase Pro para avanzar.
Implementar repositorio PostgreSQL local.
Mantener DATA_SOURCE="demo" durante desarrollo.
Agregar DATA_SOURCE="postgres" para produccion local.
```

## Seguridad minima requerida

- Cloudflare Tunnel para publicar la app sin exponer IP publica.
- Tailscale para administracion tecnica SSH.
- SSH con llave, sin password.
- PostgreSQL solo accesible desde red interna Docker/VM.
- Storage local sin acceso publico directo.
- App publica solo por HTTPS.
- Cookies de sesion `httpOnly`, `secure`, `sameSite=lax` o mas restrictivo si aplica.
- Contrasenas con hash fuerte: argon2id recomendado o bcrypt si se prefiere simplicidad.
- Variables sensibles solo en `.env.production`, no en repositorio.
- Backups automaticos y restauracion probada.
- Logs de acceso y errores.
- Rate limiting para login.

## Pendientes proximos

1. Probar acceso SSH a `100.116.114.36` con la llave entregada.
2. Confirmar dominio/subdominio final: recomendado `soporte.stockgi.com`.
3. Confirmar si `stockgi.com` se administrara desde Cloudflare DNS.
4. Instalar Docker y Docker Compose en la VM.
5. Crear despliegue Docker de la app.
6. Crear servicio PostgreSQL local.
7. Usar storage local privado para adjuntos.
8. Probar repositorio `postgres` ya implementado en la app.
9. Configurar Cloudflare Tunnel hacia el puerto interno de la app.
10. Probar acceso externo por HTTPS.

## Referencias oficiales consultadas

- https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/
- https://www.cloudflare.com/plans/zero-trust-services/

## Precaucion con Docker y otros proyectos

Existe otro proyecto de pruebas de Rivio usando Docker Desktop. Para evitar cruces entre proyectos, StockGI debe usar nombres aislados en Docker:

```text
Compose project name: stk-soporte
Red Docker: stk-soporte_net
Volumen PostgreSQL: stk-soporte_postgres_data
Volumen storage: stk-soporte_storage_data
Contenedor app: stk-soporte_app
Contenedor db: stk-soporte_postgres
Contenedor tunnel: stk-soporte_cloudflared
```

Reglas:

- No reutilizar nombres de contenedores, redes o volumenes de Rivio.
- No usar puertos ya ocupados por otros proyectos.
- En desarrollo local, mantener la app en puerto `3001` si `3000` esta ocupado.
- En produccion, el puerto interno puede ser `3001` y Cloudflare Tunnel apuntara a ese servicio interno.
- Definir `COMPOSE_PROJECT_NAME=stk-soporte` en `.env` o en el comando de despliegue.

Ejemplo futuro:

```bash
COMPOSE_PROJECT_NAME=stk-soporte docker compose up -d --build
```

## Estado implementado en codigo

Fecha de implementacion: 2026-06-11

Ya existe base tecnica para produccion:

- Migracion PostgreSQL local en `stockgi-soporte-ti-web/database/migrations/0001_initial_postgres.sql`.
- Seed minimo en `stockgi-soporte-ti-web/database/seeds/0001_seed_minimal.sql`.
- Repositorio `postgres` implementado en `src/server/repositories/postgres-repository.ts`.
- Sesiones opacas en base de datos para `DATA_SOURCE="postgres"`.
- Hash de contrasenas con BCrypt cost 12.
- Cambio obligatorio de contrasena temporal.
- Storage privado local para adjuntos en `/var/lib/stockgi/uploads` dentro de produccion Docker.
- Docker Compose aislado con servicios `app`, `postgres`, `cloudflared` y `backup`.
- Scripts de migracion, seed, backup y limpieza de adjuntos.

Pendientes reales antes de abrir al publico:

1. ~~Crear `.env.production` real en la VM.~~ Hecho.
2. ~~Levantar Docker Compose en la VM.~~ Hecho.
3. ~~Ejecutar `npm run db:migrate` y `npm run db:seed` dentro del contenedor o job autorizado.~~ Hecho.
4. Cambiar la contrasena temporal del primer admin. Pendiente de confirmar con el equipo.
5. ~~Probar backup y restore en base temporal.~~ Backup automatico corriendo (`stk-soporte_backup`); restore no se ha probado formalmente.
6. ~~Configurar Cloudflare Tunnel y DNS de `soporte.stockgi.com`.~~ Hecho, en produccion.
7. ~~Ejecutar prueba funcional completa con `DATA_SOURCE="postgres"`.~~ Hecho.

## Estado real verificado en produccion (2026-07-06)

Producción esta activa y verificada en `stk-webapp-support-01` (100.116.114.36):

- App corriendo en Docker (`stk-soporte_app`), Postgres (`stk-soporte_postgres`) y Cloudflare
  Tunnel (`stk-soporte_cloudflared`) activos. Sitio publico `https://soporte.stockgi.com`
  responde 200.
- Repositorio del servidor sincronizado con `main` (commit `6bf671c` al momento de esta nota):
  incluye correcciones de react-doctor (paralelizacion de awaits, accesibilidad, modales
  nativos `<dialog>`, limpieza de dead code) y una migracion (`0007`) que corrige una politica
  RLS de `DELETE` faltante en `app_users` (el borrado de usuarios estaba roto en produccion
  hasta esta fecha).
- Backup automatico (`stk-soporte_backup`) estuvo detenido ~2 semanas (ultimo backup real:
  18 de junio) y se reinicio el 2026-07-06; genera dump diario en `/backups` dentro del
  contenedor.
- Pendiente real: probar un restore completo desde un dump de backup en una base temporal, y
  confirmar que la contrasena temporal del primer admin ya fue cambiada.
