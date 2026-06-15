# Runbook QA End-to-End Repetible

## Objetivo

Validar StockGI Soporte TI de punta a punta con pruebas manuales y repetibles, sin Playwright ni automatización de navegador. Este runbook cubre preflight técnico, base de datos, accesos por rol, tickets, adjuntos, CSV, paginación, reportes, smoke operativo y cierre de verificación.

## Preparacion

Antes de empezar:

- El proyecto debe estar en `DATA_SOURCE="postgres"`.
- La app debe correr en `http://127.0.0.1:3002`.
- La base local debe estar vacia o reseed con datos conocidos.
- Deben existir al menos estos archivos de prueba:
  - una imagen `.png` o `.jpg`
  - un documento `.pdf`
  - un archivo invalido para rechazo manual
  - un CSV valido
  - un CSV con errores de formato o datos

## Dataset minimo esperado

Para que la prueba sea representativa:

- 1 usuario administrador TI
- 1 usuario operativo TI
- 2 usuarios solicitantes
- contratos activos e inactivos
- tickets distribuidos en estados distintos
- tickets con adjuntos
- al menos 20 tickets totales para forzar paginacion

## Orden de ejecucion

### 1. Preflight tecnico

Ejecutar:

```bash
npm run validate:encoding
npm run lint
npm run build
```

Esperado:

- no hay errores de encoding
- no hay errores de lint
- el build finaliza sin fallos

### 2. Base de datos local

Ejecutar:

```bash
npm run db:migrate
npm run db:seed
```

Esperado:

- migraciones aplicadas sin error
- seed minimo cargado
- existe el admin base
- existen categorias y tipos de solicitud

### 3. Verificacion de acceso

Validar manualmente:

- login como usuario solicitante
- login como TI operativo
- login como TI administrativo
- primer ingreso con contrasena temporal
- cambio de contrasena en la misma pantalla
- logout

Esperado:

- cada rol entra a su home correcto
- si hay contrasena temporal, obliga a cambiarla antes de operar
- logout invalida la sesion

### 4. Flujo de usuario

Validar:

- crear ticket
- anexar imagen o PDF
- rechazar archivo invalido
- consultar mis tickets
- filtrar por estado
- navegar paginacion de 10 en 10

Esperado:

- el ticket aparece en el historial del mismo usuario
- el adjunto queda visible en el detalle
- no aparecen tickets ajenos

### 5. Flujo TI

Validar:

- ver bandeja TI
- tomar ticket
- agregar comentario
- solicitar informacion
- adjuntar evidencia en respuesta
- cerrar ticket

Esperado:

- el operativo solo ve tickets permitidos por su rol
- el ticket cambia a `En proceso` al tomarlo
- solicitar informacion exige comentario
- cerrar ticket exige solucion

### 6. Flujo admin

Validar:

- consultar dashboard
- administrar usuarios
- crear o editar usuario
- administrar contratos
- cargar CSV
- consultar reportes

Esperado:

- el admin puede ver y operar tickets
- la carga CSV valida filas y devuelve resumen
- reportes y filtros cargan sin romper la UI

### 7. Adjuntos

Validar:

- subir imagen
- subir PDF
- intentar subir archivo invalido
- descargar adjunto desde detalle
- abrir vista previa de imagen
- correr limpieza de adjuntos vencidos

Esperado:

- imagen y PDF se aceptan
- el archivo invalido se rechaza
- la vista previa funciona para imagenes
- el script de limpieza tolera archivos ya eliminados
- la retencion sigue la regla de 30 dias desde cierre

### 8. Paginacion y volumen

Validar:

- tickets paginados
- usuarios paginados
- reportes con listas largas
- tablero admin sin tablas infinitas

Esperado:

- cada vista respeta el tamaño de pagina definido
- los filtros reinician pagina cuando aplica
- la UI no pierde contexto visual al cambiar de pagina

### 9. Smoke operativo

Validar:

- arrancar el stack local con Docker
- acceder a la app
- repetir login y flujo basico

Esperado:

- no hay choque con otros proyectos
- la app funciona en el puerto acordado
- la base local responde

### 10. Barrido final

Revisar en codigo activo:

- no quedan botones viejos visibles
- no quedan rutas o acciones retiradas expuestas
- no hay referencias a demo o maqueta en la UI activa
- no hay handlers activos que dependan de logica obsoleta

## Resultado esperado

Al terminar este runbook, la app debe quedar validada en:

- autenticacion
- tickets
- adjuntos
- CSV
- reportes
- paginacion
- permisos
- smoke local

Si aparece un error nuevo, documentarlo en `D:\8. Desarrollo\12_incidentes_lecciones` usando la plantilla de incidente antes de cerrar el bloque.


## Ultima ejecucion registrada

Fecha: 2026-06-14

Resultado:

- Preflight en repo host: `validate:encoding`, `lint` y `build` pasaron.
- Migraciones y seed: pasaron dentro del contenedor `stk-soporte_app`.
- Base de prueba: 1 contrato, 4 usuarios y 50 tickets antes del ticket QA adicional.
- Login validado por API para admin, operativo y usuario.
- Ticket QA creado: `STI-2026-000051`.
- Adjuntos: PNG y PDF aceptados; archivo `.txt` rechazado.
- Descarga autenticada de imagen: `200 OK`, `content-type: image/png`.
- Flujo operativo: tomar, solicitar informacion y cerrar paso correctamente.
- Paginacion: usuario con 26 tickets en 3 paginas; admin con 4 usuarios en 1 pagina.
- Logout: `/api/auth/me` devolvio `401` despues de cerrar sesion.

Observacion:

- `npm run lint` dentro del contenedor fallo cuando se ejecuto sobre una imagen Docker desfasada que no encontraba `eslint.config.*`. El lint y build del repo host si pasaron; para validar dentro de Docker se debe reconstruir la imagen antes.