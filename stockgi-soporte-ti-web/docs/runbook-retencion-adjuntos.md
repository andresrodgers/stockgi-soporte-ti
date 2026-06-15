# Runbook Retencion De Adjuntos

## Politica

- Los adjuntos se conservan mientras el ticket no este cerrado.
- Cuando el ticket se cierra, la base calcula `delete_after_at = closed_at + 30 dias`.
- El archivo fisico se elimina cuando vence `delete_after_at`.
- La metadata del adjunto permanece en base de datos y se marca con `deleted_at`.

## Script oficial

Comando:

```bash
cd /opt/stockgi-soporte-ti
DATABASE_URL="postgresql://..." UPLOAD_STORAGE_PATH="/var/lib/stockgi/uploads" node scripts/cleanup-attachments.cjs
```

El script:
- consulta adjuntos vencidos,
- elimina el archivo fisico si existe,
- tolera `ENOENT`,
- marca `deleted_at = now()`.

## Instalacion recomendada en Ubuntu

### 1. Service

Archivo: `/etc/systemd/system/stockgi-attachments-cleanup.service`

```ini
[Unit]
Description=StockGI cleanup de adjuntos vencidos
After=docker.service network-online.target

[Service]
Type=oneshot
WorkingDirectory=/opt/stockgi-soporte-ti
Environment=DATABASE_URL=postgresql://stockgi_app:CAMBIAR_PASSWORD@127.0.0.1:5432/stockgi_soporte_ti
Environment=UPLOAD_STORAGE_PATH=/var/lib/docker/volumes/stk-soporte_storage_data/_data
ExecStart=/usr/bin/node /opt/stockgi-soporte-ti/scripts/cleanup-attachments.cjs
User=stockgiadmin
Group=stockgiadmin
```

### 2. Timer

Archivo: `/etc/systemd/system/stockgi-attachments-cleanup.timer`

```ini
[Unit]
Description=Ejecucion diaria cleanup adjuntos StockGI

[Timer]
OnCalendar=*-*-* 02:15:00
Persistent=true
Unit=stockgi-attachments-cleanup.service

[Install]
WantedBy=timers.target
```

### 3. Activacion

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now stockgi-attachments-cleanup.timer
sudo systemctl status stockgi-attachments-cleanup.timer
sudo systemctl list-timers | grep stockgi-attachments-cleanup
```

### 4. Prueba manual

```bash
sudo systemctl start stockgi-attachments-cleanup.service
sudo journalctl -u stockgi-attachments-cleanup.service -n 100 --no-pager
```

## Validacion operativa

- Confirmar que existan filas con `delete_after_at <= now()`.
- Confirmar que el archivo fisico desaparezca del storage privado.
- Confirmar que `ticket_attachments.deleted_at` quede poblado.
- Confirmar que el job no falle cuando el archivo ya no exista.
