import { TextDecoder } from "node:util";
import type { BulkImportEditableRow, BulkImportResult, BulkImportRowResult } from "@/lib/types";
import { listContracts } from "@/server/contracts";
import { createUser, listUsers } from "@/server/users";
import {
  normalizeCedula,
  normalizeContractLookup,
  normalizeEmail,
  normalizePhone,
  normalizeRoleInput,
  normalizeStatusInput,
} from "@/server/users/validation";

const requiredColumns = [
  "contrato",
  "cedula",
  "nombre_completo",
  "rol",
  "correo",
  "telefono",
  "area",
  "cargo",
  "sede",
  "estado",
];

const optionalColumns = ["contrasena_temporal"];
const allowedColumns = [...requiredColumns, ...optionalColumns];
const maxCsvBytes = Number(process.env.MAX_CSV_IMPORT_MB || 1) * 1024 * 1024;
const maxCsvRows = Number(process.env.MAX_CSV_IMPORT_ROWS || 1000);
const maxFieldLength = Number(process.env.MAX_CSV_FIELD_LENGTH || 200);

type CsvRow = Record<string, string>;

export function validateCsvFileEnvelope(file: File) {
  if (!file.name.toLowerCase().endsWith(".csv")) throw new Error("Solo se acepta archivo .csv");
  if (file.size > maxCsvBytes) throw new Error("El archivo CSV supera el peso máximo permitido");
}

function decodeCsvBuffer(buffer: Buffer) {
  const utf8Decoder = new TextDecoder("utf-8", { fatal: true });
  try {
    return utf8Decoder.decode(buffer);
  } catch {
    return new TextDecoder("windows-1252").decode(buffer);
  }
}

export async function readCsvFileText(file: File) {
  validateCsvFileEnvelope(file);
  return decodeCsvBuffer(Buffer.from(await file.arrayBuffer()));
}

function normalize(value: unknown) {
  return String(value ?? "").trim();
}

function detectDelimiter(line: string) {
  let commas = 0;
  let semicolons = 0;
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes) {
      if (char === ',') commas += 1;
      if (char === ';') semicolons += 1;
    }
  }

  return semicolons > commas ? ';' : ',';
}

function splitCsvLine(line: string, delimiter: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  if (inQuotes) throw new Error("El CSV tiene comillas sin cerrar");
  values.push(current.trim());
  return values;
}

function assertFieldLength(value: string, rowNumber: number, column: string) {
  if (value.length > maxFieldLength) {
    throw new Error(`Fila ${rowNumber}: el campo ${column} supera ${maxFieldLength} caracteres`);
  }
}

function parseCsv(text: string) {
  if (Buffer.byteLength(text, "utf8") > maxCsvBytes) throw new Error("El archivo CSV supera el peso máximo permitido");
  const clean = text.replace(/^\uFEFF/, "");
  const lines = clean.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (!lines.length) throw new Error("El archivo CSV está vacío");
  if (lines.length - 1 > maxCsvRows) throw new Error(`El CSV supera el máximo de ${maxCsvRows} filas`);

  const delimiter = detectDelimiter(lines[0]);
  const headers = splitCsvLine(lines[0], delimiter).map((header) => header.trim());
  const missing = requiredColumns.filter((column) => !headers.includes(column));
  if (missing.length) throw new Error(`Faltan columnas obligatorias: ${missing.join(", ")}`);

  const unknown = headers.filter((header) => !allowedColumns.includes(header));
  if (unknown.length) throw new Error(`Columnas no permitidas: ${unknown.join(", ")}`);

  return lines.slice(1).map((line, lineIndex) => {
    const rowNumber = lineIndex + 2;
    const values = splitCsvLine(line, delimiter);
    return headers.reduce<CsvRow>((row, header, index) => {
      const value = values[index] ?? "";
      assertFieldLength(value, rowNumber, header);
      row[header] = value;
      return row;
    }, {});
  });
}

function csvRowToEditableRow(row: CsvRow): BulkImportEditableRow {
  return {
    contractName: normalize(row.contrato),
    cedula: normalize(row.cedula),
    name: normalize(row.nombre_completo),
    role: normalize(row.rol),
    email: normalize(row.correo),
    phone: normalize(row.telefono),
    area: normalize(row.area),
    position: normalize(row.cargo),
    location: normalize(row.sede),
    status: normalize(row.estado) || "Activo",
  };
}

function sanitizeEditableRow(row: BulkImportEditableRow): BulkImportEditableRow {
  return {
    contractName: normalize(row.contractName),
    cedula: normalize(row.cedula),
    name: normalize(row.name),
    role: normalize(row.role),
    email: normalize(row.email),
    phone: normalize(row.phone),
    area: normalize(row.area),
    position: normalize(row.position),
    location: normalize(row.location),
    status: normalize(row.status) || "Activo",
  };
}

async function processEditableRows(inputRows: Array<{ rowNumber: number; values: BulkImportEditableRow }>) {
  const rows = inputRows.map((row) => ({ rowNumber: row.rowNumber, values: sanitizeEditableRow(row.values) }));
  const contracts = await listContracts();
  const users = await listUsers();
  const results: BulkImportRowResult[] = [];
  const seenCedulas = new Set<string>();
  const seenEmails = new Set<string>();
  const seenPhones = new Set<string>();
  let createdUsers = 0;

  for (const row of rows) {
    const { rowNumber, values } = row;
    const contractLookup = normalizeContractLookup(values.contractName);
    const contract = contracts.find((item) => normalizeContractLookup(item.name) === contractLookup || item.id === values.contractName) ?? null;
    const cedula = normalizeCedula(values.cedula);
    const name = normalize(values.name);
    const role = normalizeRoleInput(values.role);
    const status = normalizeStatusInput(values.status || "Activo");
    const email = normalizeEmail(values.email);
    const phone = normalizePhone(values.phone);
    const errors: string[] = [];

    if (!contract) {
      errors.push("Contrato inexistente");
    } else if (contract.status !== "Activo") {
      errors.push("Contrato inactivo");
    }

    if (!cedula) errors.push("La cédula es obligatoria");
    if (!name) errors.push("El nombre completo es obligatorio");
    if (!role) errors.push("El rol no es válido");
    if (!status) errors.push("El estado no es válido");

    if (cedula && users.some((user) => normalizeCedula(user.cedula) === cedula)) errors.push("Ya existe un usuario con esa cédula");
    if (cedula && seenCedulas.has(cedula)) errors.push("La cédula está repetida dentro del lote");

    if (email && users.some((user) => normalizeEmail(user.email) === email)) errors.push("Ya existe un usuario con ese correo");
    if (email && seenEmails.has(email)) errors.push("El correo está repetido dentro del lote");

    if (phone && users.some((user) => normalizePhone(user.phone) === phone)) errors.push("Ya existe un usuario con ese celular");
    if (phone && seenPhones.has(phone)) errors.push("El celular está repetido dentro del lote");

    if (errors.length || !contract || !role || !status) {
      results.push({ rowNumber, status: "error", cedula, name, contractName: values.contractName, errorMessage: errors.join("; "), values });
      continue;
    }

    try {
      const created = await createUser({
        contractId: contract.id,
        cedula,
        name,
        role,
        email: email ?? undefined,
        phone: phone ?? undefined,
        area: values.area || undefined,
        position: values.position || undefined,
        location: values.location || undefined,
        status,
        mustChangePassword: true,
      });
      createdUsers += 1;
      seenCedulas.add(cedula);
      if (email) seenEmails.add(email);
      if (phone) seenPhones.add(phone);
      results.push({ rowNumber, status: "imported", cedula, name, contractName: values.contractName, temporaryPasswordGenerated: created.temporaryPasswordGenerated, values });
      users.push(created.user);
    } catch (error) {
      results.push({
        rowNumber,
        status: "error",
        cedula,
        name,
        contractName: values.contractName,
        errorMessage: error instanceof Error ? error.message : "No fue posible crear el usuario",
        values,
      });
    }
  }

  const errorRows = results.filter((result) => result.status === "error").length;
  return {
    totalRows: rows.length,
    validRows: rows.length - errorRows,
    errorRows,
    createdUsers,
    rows: results,
  } satisfies BulkImportResult;
}

export async function importUsersFromCsv(text: string) {
  const rows = parseCsv(text).map((row, index) => ({ rowNumber: index + 2, values: csvRowToEditableRow(row) }));
  return processEditableRows(rows);
}

export async function importCorrectedUsers(rows: Array<{ rowNumber: number; values: BulkImportEditableRow }>) {
  if (!rows.length) throw new Error("No hay filas para corregir");
  if (rows.length > maxCsvRows) throw new Error(`El lote supera el máximo de ${maxCsvRows} filas`);
  return processEditableRows(rows);
}
