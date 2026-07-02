import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  // runtime will throw in sign/verify; keep quick fail semantics
  console.warn("JWT_SECRET not set — set JWT_SECRET in environment.");
}

export function signToken(payload: object, expiresIn = "7d") {
  if (!JWT_SECRET) throw new Error("JWT_SECRET not configured");
  return jwt.sign(payload, JWT_SECRET!, { expiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string) {
  if (!JWT_SECRET) throw new Error("JWT_SECRET not configured");
  return jwt.verify(token, JWT_SECRET);
}