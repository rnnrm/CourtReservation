
import crypto from "crypto";
// Parameters matching ASP.NET Identity defaults
const ITERATIONS = 10000;
const SALT_SIZE = 16;   // 128-bit salt
const SUBKEY_SIZE = 32; // 256-bit subkey
const HASH_ALGO = "sha512";

export function hashPassword(password: string) {
  // Generate random salt
  const salt = crypto.randomBytes(SALT_SIZE);

  // Derive subkey using PBKDF2
  const subkey = crypto.pbkdf2Sync(
    password,
    salt,
    ITERATIONS,
    SUBKEY_SIZE,
    HASH_ALGO
  );

  // ASP.NET Identity stores: [version byte][salt][subkey]
  const version = Buffer.from([0x01]); // format marker (0x01 for IdentityV3)
  const output = Buffer.concat([version, salt, subkey]);

  // Base64 encode final result
  return output.toString("base64");
}