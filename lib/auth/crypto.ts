import { createHash, randomBytes } from "node:crypto";

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** 32 random bytes, URL-safe. Only ever stored hashed (admin_sessions.token_hash). */
export function newSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Raw IPs are never stored (SDD section 3); the salt makes the hash useless outside this app. */
export function hashIp(ip: string, salt: string): string {
  return sha256(`${ip}|${salt}`);
}
