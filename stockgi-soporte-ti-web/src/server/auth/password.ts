import bcrypt from "bcryptjs";

const bcryptCost = Number(process.env.BCRYPT_COST || 12);

export async function hashPassword(password: string) {
  return bcrypt.hash(password, bcryptCost);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function validatePasswordPolicy(password: string) {
  if (password.length < 8) {
    throw new Error("La contraseña debe tener mínimo 8 caracteres");
  }
}
