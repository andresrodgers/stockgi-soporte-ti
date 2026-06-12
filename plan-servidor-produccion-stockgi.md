# Plan Servidor Produccion - StockGI Soporte TI

## Estado actual del servidor

Datos recibidos:

```text
IP local VM Ubuntu: 192.168.68.129
IP Tailscale/VPN VM: 100.116.114.36
Usuario SSH: stockgiadmin
Puerto SSH: 22
Sistema operativo: Ubuntu Server 24.04 LTS
Recursos VM: 4 vCPU / 16 GB RAM / 256 GB disco
IP publica del servidor: No aplica / Protegido
Puertos 80 y 443: confirmados hacia la VM
Llave SSH entregada: llave_definitiva.ppk
```

Esto sirve para administracion tecnica segura por Tailscale + SSH.

Pendiente importante: si no hay IP publica o mecanismo de tunel publico, los usuarios externos no podran entrar todavia por una URL publica normal.

## Objetivo

Mantener el desarrollo local en el equipo de trabajo y preparar el servidor fisico para produccion cuando se decida publicar.

Arquitectura recomendada:

```text
Usuarios finales
  -> URL publica HTTPS
    -> Proxy publico / DNS / Tunnel
      -> VM Ubuntu
        -> Caddy o Nginx
          -> App StockGI Soporte TI
          -> Futuras apps web
        -> PostgreSQL
        -> Storage local privado
        -> Backups

Equipo tecnico
  -> Tailscale
    -> SSH a VM Ubuntu
      -> despliegue, logs, mantenimiento
```

## Acceso tecnico actual

La conexion tecnica debe hacerse por Tailscale:

```powershell
ssh -i "RUTA_LLAVE_OPENSSH" stockgiadmin@100.116.114.36
```

Si la llave esta en formato `.ppk`, se puede usar PuTTY o convertirla a OpenSSH.

La llave privada no debe compartirse con usuarios finales ni quedar en repositorios.

## Como publicar usuarios externos con URL publica

Hay tres caminos viables.

### Opcion A - IP publica real + DNS + puertos 80/443

Es la opcion tradicional.

Requiere:

- IP publica fija del servidor o router de la empresa.
- NAT/port forwarding desde el router hacia la VM Ubuntu:
  - 80/tcp -> 192.168.68.129:80
  - 443/tcp -> 192.168.68.129:443
- Dominio o subdominio apuntando a esa IP publica:
  - soporte.stockgi.com
  - app.prodgers.com
- Caddy o Nginx en la VM para enrutar por dominio.
- Certificados SSL.

Ventajas:

- Metodo estandar.
- No depende de un tercero para tuneles.
- Buen rendimiento.

Riesgos/requisitos:

- El servidor queda expuesto en 80/443, por eso debe estar bien configurado.
- Se necesita IP publica y administracion del router/firewall.
- SSH no debe abrirse publicamente; se mantiene por Tailscale.

### Opcion B - Cloudflare Tunnel

Recomendada si no quieren o no pueden tener IP publica.

Flujo:

```text
Internet
  -> Cloudflare
    -> Tunnel saliente desde VM Ubuntu
      -> App local en la VM
```

Requiere:

- Dominio administrado en Cloudflare o DNS compatible.
- Instalar `cloudflared` en la VM.
- Crear tunnel para cada app o subdominio.
- Configurar Caddy/Nginx o apuntar el tunnel directo a cada puerto interno.

Ventajas:

- No requiere IP publica.
- No requiere abrir puertos entrantes 80/443.
- Buena seguridad perimetral.
- Facil para publicar varias apps con subdominios.

Riesgos/requisitos:

- Depende de Cloudflare.
- Hay que administrar DNS en Cloudflare.

### Opcion C - Tailscale Funnel

Puede servir para publicar servicios publicos desde Tailscale, pero no lo tomaria como primera opcion para produccion empresarial sin validarlo bien.

Uso recomendado:

- Pruebas publicas rapidas.
- Demos controladas.

Para produccion preferiria IP publica + DNS o Cloudflare Tunnel.

## Informacion que necesitamos para publicar una URL publica

Para definir el camino correcto necesitamos responder:

1. La app sera publica para cualquier usuario con internet o solo privada para empleados/clientes autorizados?
2. Que dominio/subdominio se usara?
   - Ejemplo: soporte.stockgi.com
3. Quien administra el DNS del dominio?
   - GoDaddy, Cloudflare, Namecheap, proveedor local, etc.
4. El servidor o la empresa tiene IP publica fija?
5. Si tiene IP publica, se puede abrir/redirigir 80 y 443 hacia la VM?
6. Si no tiene IP publica, podemos usar Cloudflare Tunnel?
7. La app tendra usuarios externos de clientes o solo empleados internos?
8. Se requiere SSL publico valido? Para produccion la respuesta debe ser si.
9. Se publicaran tambien otras apps como Prodgers en el mismo servidor?
10. Que subdominios se quieren reservar?

## Recomendacion para este caso

Como actualmente la informacion dice `IP publica: No aplica / Protegido`, la recomendacion inicial es:

1. Usar Tailscale solo para administracion tecnica por SSH.
2. Para acceso publico de usuarios finales, usar Cloudflare Tunnel si no habra IP publica.
3. Si mas adelante habilitan IP publica fija, usar Caddy/Nginx con DNS normal y certificados SSL.

## Plan de trabajo antes de produccion

### Fase 1 - Seguir desarrollo local

Se sigue trabajando en el equipo local:

```powershell
cd "D:\12. StockGI\TI_ticket\stockgi-soporte-ti-web"
npm run dev -- --hostname 127.0.0.1 --port 3001
```

Objetivo:

- Terminar frontend.
- Terminar API interna.
- Terminar modelo de datos.
- Preparar y probar conexion real a PostgreSQL local.

### Fase 2 - Preparar servidor por SSH

Por Tailscale:

```powershell
ssh stockgiadmin@100.116.114.36
```

Instalar:

- Docker
- Docker Compose
- Git
- Caddy o Nginx
- PostgreSQL
- Servicio de backups
- Estructura `/opt/stockgi`

### Fase 3 - Preparar despliegue de la app

Crear en el proyecto:

- `Dockerfile` creado
- `docker-compose.yml` creado
- `.env.production.example` creado
- scripts de migracion, seed, backup y limpieza creados
- Cloudflare Tunnel pendiente de credenciales reales

Servicios esperados:

```text
stk-soporte_app
stk-soporte_postgres
stk-soporte_cloudflared
stk-soporte_backup
```

### Fase 4 - Base de datos real

Produccion usara PostgreSQL local en la VM:

- Crear DB `stockgi_soporte_ti`
- Crear usuario de base de datos
- Ejecutar migraciones
- Crear backups automaticos

### Fase 5 - Publicacion HTTPS

Segun decision:

- IP publica + DNS + Caddy/Nginx
- Cloudflare Tunnel

Configurar URL final:

```text
https://soporte.stockgi.com
```

### Fase 6 - Pruebas de produccion

Validar:

- Login real
- Roles
- Tickets
- Adjuntos
- Carga masiva CSV
- Backups
- Restauracion de backup
- Logs
- Reinicio automatico
- SSL
- Acceso desde internet

## Pendientes inmediatos

- Probar conexion SSH con la llave `.ppk`.
- Convertir llave `.ppk` a formato OpenSSH si se usara PowerShell.
- Confirmar si StockGI tiene dominio/subdominio disponible.
- Confirmar si hay IP publica fija o si se usara Cloudflare Tunnel.
- Base final definida: PostgreSQL local en VM.
- Preparar Dockerfile y docker-compose para despliegue.

## Decision recomendada con informacion actual

Con la informacion confirmada, la ruta recomendada es:

```text
Dominio: stockgi.com
DNS actual: web principal en Hostinger; existe acceso a Cloudflare con dominio en plan Free
Publicacion: Cloudflare Tunnel
Base de datos: PostgreSQL local en la VM
Archivos: almacenamiento local privado, con metadata en PostgreSQL
Acceso tecnico: Tailscale + SSH
Acceso usuarios finales: URL publica HTTPS + login privado de la app
```

### Por que Cloudflare Tunnel

Cloudflare Tunnel es adecuado porque:

- No requiere IP publica fija.
- No expone la IP real del servidor.
- No requiere abrir puertos entrantes hacia el servidor para publicar la app.
- Permite publicar subdominios como `soporte.stockgi.com` apuntando hacia servicios internos de la VM.
- Mantiene SSH y base de datos fuera de internet.

La app quedaria asi:

```text
Usuario final
  -> https://soporte.stockgi.com
    -> Cloudflare
      -> Cloudflare Tunnel
        -> VM Ubuntu
          -> App StockGI
          -> PostgreSQL local privado
          -> Storage privado
```

### DNS y Hostinger

Aunque la pagina principal este alojada en Hostinger, se puede usar Cloudflare para DNS.

Opciones:

1. Mover la administracion DNS de `stockgi.com` a Cloudflare cambiando nameservers en Hostinger.
2. Mantener la web principal apuntando a Hostinger mediante registros DNS en Cloudflare.
3. Crear el subdominio `soporte.stockgi.com` en Cloudflare y conectarlo al Tunnel.

Esto no significa mover la pagina web principal de hosting. Solo cambia quien administra los registros DNS.

### Base de datos y archivos

Recomendacion:

- PostgreSQL local en la VM para datos estructurados: usuarios, contratos, tickets, comentarios, auditoria y metadata de adjuntos.
- No guardar imagenes/PDF directamente dentro de PostgreSQL salvo casos excepcionales.
- Guardar archivos en storage privado:
  - carpeta persistente privada en disco para v1.
- PostgreSQL guarda solo la metadata del archivo:
  - nombre original;
  - tipo MIME;
  - tamano original;
  - tamano almacenado;
  - ruta privada;
  - fecha de eliminacion programada;
  - estado de retencion.

### Seguridad minima requerida

- La base de datos no debe exponerse a internet.
- SSH solo por Tailscale, no publico.
- La app publica solo por HTTPS.
- Login con contrasenas hasheadas, no texto plano.
- Sesiones con cookies `httpOnly` y `secure`.
- Backups automaticos cifrados.
- Retencion de adjuntos: eliminar archivo fisico 30 dias despues de cerrar el ticket.
- Mantener metadata historica aunque se elimine el archivo.
- Panel administrativo protegido por rol y, si se desea, tambien por Cloudflare Access.

### Informacion pendiente para ejecutar Cloudflare Tunnel

- Usar la cuenta Cloudflare existente en plan Free.
- Confirmar acceso administrativo al dominio `stockgi.com` en Hostinger.
- Cambiar nameservers de `stockgi.com` a Cloudflare o definir estrategia DNS equivalente.
- Definir subdominio final: recomendado `soporte.stockgi.com`.
- Instalar `cloudflared` en la VM.
- Crear Tunnel en Cloudflare.
- Conectar hostname publico `soporte.stockgi.com` al servicio interno de la app.

## Decision final vigente

Con la informacion actual, se define como camino de produccion:

```text
Publicacion publica: Cloudflare Tunnel
Dominio esperado: soporte.stockgi.com
DNS: Cloudflare si se confirma migracion de nameservers desde Hostinger
Base de datos: PostgreSQL local en la VM
Adjuntos: storage privado local
Administracion tecnica: Tailscale + SSH
```

Cloudflare Tunnel se usara para publicar la app sin exponer IP publica del servidor. Tailscale se mantiene solo para administracion tecnica por SSH.

El plan Free de Cloudflare se considera suficiente para iniciar la prueba tecnica y publicar el subdominio, sujeto a validacion de limites reales de la cuenta de StockGI.

La documentacion oficial consultada indica que Cloudflare Tunnel permite publicar aplicaciones mediante un conector `cloudflared`, y la pagina de precios de Cloudflare ofrece planes Free para empezar una prueba de concepto.

Referencias:

- https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/
- https://www.cloudflare.com/plans/zero-trust-services/

## Estado implementado del despliegue

Ya existe estructura lista para probar en la VM:

```text
stockgi-soporte-ti-web/Dockerfile
stockgi-soporte-ti-web/docker-compose.yml
stockgi-soporte-ti-web/.env.production.example
stockgi-soporte-ti-web/database/migrations/0001_initial_postgres.sql
stockgi-soporte-ti-web/database/seeds/0001_seed_minimal.sql
stockgi-soporte-ti-web/scripts/migrate-postgres.cjs
stockgi-soporte-ti-web/scripts/seed-postgres.cjs
stockgi-soporte-ti-web/scripts/backup-postgres.sh
stockgi-soporte-ti-web/scripts/cleanup-attachments.cjs
```

Comandos esperados en la VM, despues de clonar repo y crear `.env.production`:

```bash
cd /opt/stockgi/stockgi-soporte-ti/stockgi-soporte-ti-web
COMPOSE_PROJECT_NAME=stk-soporte docker compose --env-file .env.production up -d --build
COMPOSE_PROJECT_NAME=stk-soporte docker compose --env-file .env.production exec app npm run db:migrate
COMPOSE_PROJECT_NAME=stk-soporte docker compose --env-file .env.production exec app npm run db:seed
```

Pendiente: Cloudflare Tunnel requiere token/credenciales reales de la cuenta Cloudflare y DNS de `soporte.stockgi.com`.