import type { Contract, Ticket, TicketCategory, User } from "./types";

export const contracts: Contract[] = [
  { id: "stockgi-admin", name: "StockGI Administracion", client: "StockGI", status: "Activo" },
  { id: "operacion-norte", name: "Operacion Norte", client: "Cliente externo A", status: "Activo" },
  { id: "logistica-centro", name: "Logistica Centro", client: "Cliente externo B", status: "Activo" },
  { id: "servicios-sur", name: "Servicios Sur", client: "Cliente externo C", status: "Activo" },
];

export const users: User[] = [
  {
    id: "user-1",
    contractId: "operacion-norte",
    cedula: "10101010",
    name: "Laura Martinez",
    role: "usuario",
    email: "laura.martinez@stockgi.com",
    phone: "300 111 2233",
    area: "Operacion",
    position: "Analista operativo",
    location: "Sede Norte",
    status: "Activo",
  },
  {
    id: "tech-1",
    contractId: "stockgi-admin",
    cedula: "20202020",
    name: "Carlos Rojas",
    role: "ti_operativo",
    email: "carlos.rojas@stockgi.com",
    area: "TI",
    position: "Soporte tecnico",
    location: "Principal",
    status: "Activo",
  },
  {
    id: "admin-1",
    contractId: "stockgi-admin",
    cedula: "30303030",
    name: "Andrea Gomez",
    role: "ti_administrativo",
    email: "andrea.gomez@stockgi.com",
    area: "TI",
    position: "Coordinacion TI",
    location: "Principal",
    status: "Activo",
  },
  {
    id: "user-2",
    contractId: "logistica-centro",
    cedula: "40404040",
    name: "Miguel Perez",
    role: "usuario",
    email: "miguel.perez@cliente.com",
    area: "Despachos",
    position: "Supervisor",
    location: "Bodega Centro",
    status: "Activo",
  },
];

export const technicians = users.filter((user) => user.role === "ti_operativo");

export const categories: TicketCategory[] = [
  {
    id: "accesos",
    name: "Accesos y contraseñas",
    description: "Bloqueos, claves, permisos y accesos a sistemas.",
    requestTypes: [
      { id: "restablecer-contrasena", name: "Restablecer contraseña", priority: "Media", firstResponseSla: "4 horas", resolutionSla: "2 días hábiles", attachmentRule: "No obligatorio" },
      { id: "usuario-bloqueado", name: "Usuario bloqueado", priority: "Media", firstResponseSla: "4 horas", resolutionSla: "2 días hábiles", attachmentRule: "No obligatorio" },
      { id: "crear-acceso", name: "Crear acceso", priority: "Media", firstResponseSla: "4 horas", resolutionSla: "2 días hábiles", attachmentRule: "No obligatorio" },
      { id: "cambiar-permisos", name: "Cambiar permisos", priority: "Media", firstResponseSla: "4 horas", resolutionSla: "2 días hábiles", attachmentRule: "No obligatorio" },
      { id: "retirar-acceso", name: "Retirar acceso", priority: "Media", firstResponseSla: "4 horas", resolutionSla: "2 días hábiles", attachmentRule: "No obligatorio" },
    ],
  },
  {
    id: "equipos",
    name: "Equipos de computo",
    description: "Computadores, pantallas, teclado, mouse, cargador y mantenimiento.",
    requestTypes: [
      { id: "equipo-no-enciende", name: "Equipo no enciende", priority: "Alta", firstResponseSla: "1 hora", resolutionSla: "8 horas", attachmentRule: "Recomendado" },
      { id: "equipo-lento", name: "Equipo lento", priority: "Media", firstResponseSla: "4 horas", resolutionSla: "2 días hábiles", attachmentRule: "Recomendado" },
      { id: "pantalla", name: "Pantalla", priority: "Media", firstResponseSla: "4 horas", resolutionSla: "2 días hábiles", attachmentRule: "Recomendado" },
      { id: "teclado-mouse", name: "Teclado o mouse", priority: "Media", firstResponseSla: "4 horas", resolutionSla: "2 días hábiles", attachmentRule: "Recomendado" },
      { id: "cargador", name: "Cargador", priority: "Media", firstResponseSla: "4 horas", resolutionSla: "2 días hábiles", attachmentRule: "Recomendado" },
      { id: "mantenimiento", name: "Mantenimiento", priority: "Baja", firstResponseSla: "1 dia habil", resolutionSla: "5 días hábiles", attachmentRule: "No obligatorio" },
    ],
  },
  {
    id: "conectividad",
    name: "Conectividad",
    description: "Internet, red, WiFi, VPN o acceso a red interna.",
    requestTypes: [
      { id: "sin-internet", name: "Sin internet", priority: "Alta", firstResponseSla: "1 hora", resolutionSla: "8 horas", attachmentRule: "No obligatorio" },
      { id: "red-lenta", name: "Red lenta", priority: "Media", firstResponseSla: "4 horas", resolutionSla: "2 días hábiles", attachmentRule: "No obligatorio" },
      { id: "wifi", name: "WiFi", priority: "Media", firstResponseSla: "4 horas", resolutionSla: "2 días hábiles", attachmentRule: "No obligatorio" },
      { id: "vpn", name: "VPN", priority: "Alta", firstResponseSla: "1 hora", resolutionSla: "8 horas", attachmentRule: "No obligatorio" },
      { id: "red-interna", name: "No accede a red interna", priority: "Alta", firstResponseSla: "1 hora", resolutionSla: "8 horas", attachmentRule: "No obligatorio" },
    ],
  },
  {
    id: "correo",
    name: "Correo y comunicacion",
    description: "Correo electronico, reuniones virtuales, telefonia o celular corporativo.",
    requestTypes: [
      { id: "no-envia-correos", name: "No envia correos", priority: "Media", firstResponseSla: "4 horas", resolutionSla: "2 días hábiles", attachmentRule: "No obligatorio" },
      { id: "no-recibe-correos", name: "No recibe correos", priority: "Media", firstResponseSla: "4 horas", resolutionSla: "2 días hábiles", attachmentRule: "No obligatorio" },
      { id: "configuracion-correo", name: "Configuracion de correo", priority: "Media", firstResponseSla: "4 horas", resolutionSla: "2 días hábiles", attachmentRule: "No obligatorio" },
      { id: "firma-correo", name: "Firma de correo", priority: "Baja", firstResponseSla: "1 dia habil", resolutionSla: "5 días hábiles", attachmentRule: "No obligatorio" },
      { id: "reuniones", name: "Teams, Meet o Zoom", priority: "Media", firstResponseSla: "4 horas", resolutionSla: "2 días hábiles", attachmentRule: "No obligatorio" },
      { id: "telefonia", name: "Telefonia o celular corporativo", priority: "Media", firstResponseSla: "4 horas", resolutionSla: "2 días hábiles", attachmentRule: "No obligatorio" },
    ],
  },
  {
    id: "impresoras",
    name: "Impresoras y escaner",
    description: "Impresion, escaneo, configuracion o insumos.",
    requestTypes: [
      { id: "no-imprime", name: "No imprime", priority: "Media", firstResponseSla: "4 horas", resolutionSla: "2 días hábiles", attachmentRule: "Recomendado" },
      { id: "no-escanea", name: "No escanea", priority: "Media", firstResponseSla: "4 horas", resolutionSla: "2 días hábiles", attachmentRule: "Recomendado" },
      { id: "configuracion-impresora", name: "Configuracion", priority: "Baja", firstResponseSla: "1 dia habil", resolutionSla: "5 días hábiles", attachmentRule: "No obligatorio" },
      { id: "error-impresora", name: "Error de impresora", priority: "Media", firstResponseSla: "4 horas", resolutionSla: "2 días hábiles", attachmentRule: "Recomendado" },
      { id: "toner", name: "Solicitud de toner o insumo", priority: "Baja", firstResponseSla: "1 dia habil", resolutionSla: "5 días hábiles", attachmentRule: "No obligatorio" },
    ],
  },
  {
    id: "software",
    name: "Software y sistemas internos",
    description: "Aplicaciones instaladas, sistemas corporativos, SLI y licencias.",
    requestTypes: [
      { id: "error-aplicacion", name: "Error en aplicacion", priority: "Media", firstResponseSla: "4 horas", resolutionSla: "2 días hábiles", attachmentRule: "Recomendado" },
      { id: "instalacion-software", name: "Instalacion de software autorizado", priority: "Baja", firstResponseSla: "1 dia habil", resolutionSla: "5 días hábiles", attachmentRule: "No obligatorio" },
      { id: "actualizacion", name: "Actualizacion", priority: "Baja", firstResponseSla: "1 dia habil", resolutionSla: "5 días hábiles", attachmentRule: "No obligatorio" },
      { id: "sli", name: "SLI o sistema interno", priority: "Alta", firstResponseSla: "1 hora", resolutionSla: "8 horas", attachmentRule: "Recomendado" },
      { id: "licencia-software", name: "Licencia de software", priority: "Media", firstResponseSla: "4 horas", resolutionSla: "2 días hábiles", attachmentRule: "No obligatorio" },
    ],
  },
  {
    id: "recursos",
    name: "Recursos TI",
    description: "Solicitudes planificadas de equipos, perifericos, licencias, ingresos o retiros.",
    requestTypes: [
      { id: "solicitud-equipo", name: "Solicitud de equipo", priority: "Baja", firstResponseSla: "1 dia habil", resolutionSla: "5 días hábiles", attachmentRule: "No obligatorio" },
      { id: "solicitud-periferico", name: "Solicitud de periferico", priority: "Baja", firstResponseSla: "1 dia habil", resolutionSla: "5 días hábiles", attachmentRule: "No obligatorio" },
      { id: "solicitud-licencia", name: "Solicitud de licencia", priority: "Media", firstResponseSla: "4 horas", resolutionSla: "2 días hábiles", attachmentRule: "No obligatorio" },
      { id: "usuario-nuevo", name: "Usuario nuevo", priority: "Media", firstResponseSla: "4 horas", resolutionSla: "2 días hábiles", attachmentRule: "No obligatorio" },
      { id: "alistamiento-ingreso", name: "Alistamiento para ingreso", priority: "Media", firstResponseSla: "4 horas", resolutionSla: "2 días hábiles", attachmentRule: "No obligatorio" },
      { id: "retiro-usuario", name: "Retiro de usuario", priority: "Media", firstResponseSla: "4 horas", resolutionSla: "2 días hábiles", attachmentRule: "No obligatorio" },
    ],
  },
  {
    id: "otro",
    name: "Otro",
    description: "Casos que no encajan en las categorias anteriores.",
    requestTypes: [
      { id: "no-clasificada", name: "Solicitud no clasificada", priority: "Baja", firstResponseSla: "1 dia habil", resolutionSla: "5 días hábiles", attachmentRule: "No obligatorio" },
    ],
  },
];

export const initialTickets: Ticket[] = [
  {
    id: "ticket-1",
    number: "STK-0001",
    subject: "No puedo ingresar al SLI",
    description: "Al intentar entrar al sistema SLI aparece un error de credenciales.",
    categoryId: "software",
    requestTypeId: "sli",
    priority: "Alta",
    status: "En proceso",
    requesterId: "user-1",
    contractId: "operacion-norte",
    assigneeId: "tech-1",
    createdAt: "2026-06-04 08:35",
    updatedAt: "2026-06-04 09:10",
    dueAt: "2026-06-04 16:35",
    attachments: [{ id: "att-1", name: "captura-error-sli.png", originalFilename: "captura-error-sli.png", mimeType: "image/png", originalSizeBytes: 640000, storedSizeBytes: 210000, compressionStatus: "compressed", retentionDays: 30 }],
    comments: [
      { id: "c-1", author: "Laura Martinez", role: "usuario", message: "Adjunto captura del error.", createdAt: "2026-06-04 08:35" },
      { id: "c-2", author: "Carlos Rojas", role: "ti_operativo", message: "Estamos validando permisos del usuario en SLI.", createdAt: "2026-06-04 09:10" },
    ],
  },
  {
    id: "ticket-2",
    number: "STK-0002",
    subject: "Equipo muy lento",
    description: "El computador tarda mucho en abrir correo y archivos compartidos.",
    categoryId: "equipos",
    requestTypeId: "equipo-lento",
    priority: "Media",
    status: "Nuevo",
    requesterId: "user-2",
    contractId: "logistica-centro",
    createdAt: "2026-06-04 10:12",
    updatedAt: "2026-06-04 10:12",
    dueAt: "2026-06-06 10:12",
    attachments: [],
    comments: [],
  },
  {
    id: "ticket-3",
    number: "STK-0003",
    subject: "Solicitud de licencia para aplicativo",
    description: "Se requiere licencia para nuevo usuario de la operacion.",
    categoryId: "recursos",
    requestTypeId: "solicitud-licencia",
    priority: "Media",
    status: "Cerrado",
    requesterId: "user-1",
    contractId: "operacion-norte",
    assigneeId: "tech-1",
    createdAt: "2026-06-03 14:20",
    updatedAt: "2026-06-04 08:05",
    dueAt: "2026-06-05 14:20",
    attachments: [{ id: "att-2", name: "autorizacion.pdf", originalFilename: "autorizacion.pdf", mimeType: "application/pdf", originalSizeBytes: 320000, storedSizeBytes: 320000, compressionStatus: "not_applicable", retentionDays: 30 }],
    solution: "Licencia asignada y validada con usuario.",
    comments: [
      { id: "c-3", author: "Carlos Rojas", role: "ti_operativo", message: "Licencia asignada y ticket cerrado.", createdAt: "2026-06-04 08:05" },
    ],
  },
];

export function getCategoryName(categoryId: string) {
  return categories.find((category) => category.id === categoryId)?.name ?? "Sin categoria";
}

export function getRequestType(categoryId: string, requestTypeId: string) {
  return categories.find((category) => category.id === categoryId)?.requestTypes.find((type) => type.id === requestTypeId);
}

