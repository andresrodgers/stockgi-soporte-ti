import type { BulkImportResult, BulkImportRowResult, Role, User } from "@/lib/types";
import { listContracts } from "@/server/contracts";
import { createUser, listUsers } from "@/server/users";

const requiredColumns = [
  "contrato",
  "cedula",
  "nombre_completo",
  "rol",
  "contrasena_temporal",
  "correo",
  "telefono",
  "area",
  "cargo",
  "sede",
  "estado",
];

const validRoles: Role[] = ["usuario", "ti_operativo", "ti_administrativo"];
const validStatuses: User["status"][] = ["Activo", "Inactivo"];

type CsvRow = Record<string, string>;

function normalize(value: unknown) {
  return String(value ?? "").trim();
}

function splitCsvLine(line: string) {
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

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function parseCsv(text: string) {
  const clean = text.replace(/^\uFEFF/, "");
  const lines = clean.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (!lines.length) throw new Error("El archivo CSV esta vacio");

  const headers = splitCsvLine(lines[0]).map((header) => header.trim());
  const missing = requiredColumns.filter((column) => !headers.includes(column));
  if (missing.length) throw new Error(`Faltan columnas obligatorias: ${missing.join(", ")}`);

  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return headers.reduce<CsvRow>((row, header, index) => {
      row[header] = values[index] ?? "";
      return row;
    }, {});
  });
}

function findContractId(contracts: Awaited<ReturnType<typeof listContracts>>, nameOrId: string) {
  return contracts.find((contract) => contract.id === nameOrId || contract.name.toLowerCase() === nameOrId.toLowerCase())?.id;
}

export async function importUsersFromCsv(text: string) {
  const rows = parseCsv(text);
  const contracts = await listContracts();
  const users = await listUsers();
  const results: BulkImportRowResult[] = [];
  let createdUsers = 0;

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const contractValue = normalize(row.contrato);
    const cedula = normalize(row.cedula);
    const name = normalize(row.nombre_completo);
    const role = normalize(row.rol) as Role;
    const status = (normalize(row.estado) || "Activo") as User["status"];
    const contractId = findContractId(contracts, contractValue);
    const errors: string[] = [];

    if (!contractId) errors.push("Contrato inexistente o inactivo");
    if (!cedula) errors.push("Cedula obligatoria");
    if (!name) errors.push("Nombre obligatorio");
    if (!validRoles.includes(role)) errors.push("Rol invalido");
    if (!validStatuses.includes(status)) errors.push("Estado invalido");
    if (contractId && users.some((user) => user.contractId === contractId && user.cedula === cedula)) errors.push("Cedula ya existe en ese contrato");

    if (errors.length || !contractId) {
      results.push({ rowNumber, status: "error", cedula, name, contractName: contractValue, errorMessage: errors.join("; ") });
      return;
    }

    createUser({
      contractId,
      cedula,
      name,
      role,
      email: normalize(row.correo),
      phone: normalize(row.telefono),
      area: normalize(row.area),
      position: normalize(row.cargo),
      location: normalize(row.sede),
      status,
    });
    createdUsers += 1;
    results.push({ rowNumber, status: "imported", cedula, name, contractName: contractValue });
  });

  const errorRows = results.filter((row) => row.status === "error").length;
  const result: BulkImportResult = {
    totalRows: rows.length,
    validRows: rows.length - errorRows,
    errorRows,
    createdUsers,
    rows: results,
  };

  return result;
}
