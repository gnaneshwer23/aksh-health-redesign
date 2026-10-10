import { createHash, randomBytes } from "node:crypto";

/** Human-typable single-use code: 4 groups of 4 from an unambiguous alphabet (~80 bits). Shown once, stored hashed. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateInviteCode(): string {
  const bytes = randomBytes(16);
  const chars = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
  return chars.match(/.{4}/g)!.join("-");
}

export function normaliseInviteCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function hashInviteCode(code: string): string {
  return createHash("sha256").update(normaliseInviteCode(code)).digest("hex");
}
