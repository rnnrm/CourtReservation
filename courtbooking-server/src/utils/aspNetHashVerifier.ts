import crypto from "crypto";

/**
 * Verify ASP.NET Identity PBKDF2-HMAC hash (format byte 0x01).
 * Returns true when password matches.
 */
export function verifyAspNetPassword(hashedBase64: string, password: string): boolean {
  if (!hashedBase64 || !password) return false;

  let hash: Buffer;
  try {
    hash = Buffer.from(hashedBase64, "base64");
  } catch {
    return false;
  }

  if (hash.length < 13) return false;

  const format = hash.readUInt8(0);
  if (format !== 0x01) return false; // only support format marker 0x01

  const prf = hash.readUInt32BE(1);      // PRF id (0=HMACSHA1,1=HMACSHA256,2=HMACSHA512)
  const iter = hash.readUInt32BE(5);     // iteration count
  const saltLen = hash.readUInt32BE(9);  // salt length

  const saltStart = 13;
  const saltEnd = saltStart + saltLen;
  if (hash.length < saltEnd) return false;

  const salt = hash.slice(saltStart, saltEnd);
  const subkey = hash.slice(saltEnd); // remainder is subkey (works with standard Identity layout)

  // Map PRF id to digest; support prf 0/1/2 explicitly.
  let digest: string;
  if (prf === 0) {
    digest = "sha1";
  } else if (prf === 1) {
    digest = "sha256";
  } else if (prf === 2) {
    digest = "sha512";
  } else {
    // Fallback: infer from subkey length (robust heuristic)
    if (subkey.length === 20) digest = "sha1";
    else if (subkey.length === 64) digest = "sha512";
    else digest = "sha256";
  }

  try {
    const derived = crypto.pbkdf2Sync(password, salt, iter, subkey.length, digest);
    if (derived.length !== subkey.length) return false;
    return crypto.timingSafeEqual(derived, subkey);
  } catch {
    return false;
  }
}