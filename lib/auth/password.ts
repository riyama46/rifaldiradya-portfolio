import { compare, hash } from "bcryptjs";

export const BCRYPT_COST = 12;

// A real cost-12 hash of a discarded random secret, compared against when the email is wrong so
// the response time does not reveal whether the email matched (SDD section 6).
const DUMMY_HASH = "$2b$12$Zehs4ha5mtiJgTo9aT.OL.gENEMRLjWqbQdGQ.DsqVzy2IdW.iS1W";

export function hashPassword(password: string): Promise<string> {
  return hash(password, BCRYPT_COST);
}

/** Always runs one bcrypt comparison, whether or not the email matched. */
export async function verifyCredentials(
  input: { email: string; password: string },
  admin: { email: string; passwordHash: string },
): Promise<boolean> {
  const emailMatches = input.email.trim().toLowerCase() === admin.email.trim().toLowerCase();
  const passwordMatches = await compare(
    input.password,
    emailMatches ? admin.passwordHash : DUMMY_HASH,
  );
  return emailMatches && passwordMatches;
}
