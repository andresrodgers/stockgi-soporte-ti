import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const bcryptCost = Number(process.env.BCRYPT_COST || 12);

export async function hashPassword(password: string) {
  return bcrypt.hash(password, bcryptCost);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function validatePasswordPolicy(password: string) {
  if (password.length < 8) {
    throw new Error("La contrasena debe tener minimo 8 caracteres");
  }
}

export function generateTemporaryPassword(length = 14) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = randomBytes(length * 2);
  let output = "";

  for (const byte of bytes) {
    output += alphabet[byte % alphabet.length];
    if (output.length === length) break;
  }

  return output;
}
