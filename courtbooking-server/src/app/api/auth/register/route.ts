import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { signToken } from "@/utils/jwt";
import { NextResponse } from "next/server";
import argon2 from "argon2";

const COOKIE_NAME = "auth-token";
const COOKIE_MAX_AGE = 7 * 24 * 3600; // 7 days in seconds

// Parameters matching ASP.NET Identity defaults
const ITERATIONS = 10000;
const SALT_SIZE = 16;   // 128-bit salt
const SUBKEY_SIZE = 32; // 256-bit subkey
const HASH_ALGO = "sha512";

function hashPassword(password: string) {
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

function setTokenCookieStr(token: string, maxAgeSec = COOKIE_MAX_AGE) {
  const isProd = process.env.NODE_ENV === "production";
  const securePart = isProd ? "Secure; " : "";
  const sameSite = isProd ? "None" : "Lax";
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Max-Age=${maxAgeSec}; ${securePart}SameSite=${sameSite}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = body?.Email?.toString().trim().toLowerCase();
    const name = (body?.Name ?? "").toString();
    const password = body?.Password?.toString();

    if (!email || !password) return new Response("Email and Password required", { status: 400, headers: { "content-type": "text/plain" } });

    const existing = await prisma.appUser.findFirst({ where: { Email: email } });
    if (existing) return new Response("User already exists", { status: 409, headers: { "content-type": "text/plain" } });

    // Hash password using ASP.NET Identity format
    const hash = hashPassword(password);
    
    // Create user
    const user = await prisma.appUser.create({
      data: {
        Id: uuidv4(),
        UserName: name || email.split("@")[0],
        Email: email,
        PasswordHash: hash,
        SecurityStamp: uuidv4(),
      },
    });

    // Auto-login: create argon2 hash and issue JWT token
    try {
      const argonHash = await argon2.hash(password);
      await prisma.nodeUser.create({
        data: { UserId: user.Id, passwordHash: argonHash },
      });
    } catch (err) {
      console.error("Failed creating node user hash after register", err);
      // continue — still logged in via JWT
    }

    const token = signToken({ sub: user.Id, name: user.UserName, securityStamp: user.SecurityStamp });
    const res = NextResponse.json({ id: user.Id, name: user.UserName, email });
    res.headers.set("Set-Cookie", setTokenCookieStr(token));
    return res;
  } catch (err: any) {
    return new Response(err?.message ?? "Server error", { status: 500, headers: { "content-type": "text/plain" } });
  }
}