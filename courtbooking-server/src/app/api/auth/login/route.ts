import { prisma } from "@/lib/prisma";
import argon2 from "argon2";
import { verifyAspNetPassword } from "@/utils/aspNetHashVerifier";
import { signToken } from "@/utils/jwt";
import { NextResponse } from "next/server";

const COOKIE_NAME = "auth-token";
const COOKIE_MAX_AGE = 7 * 24 * 3600; // 7 days in seconds

function setTokenCookieStr(token: string, maxAgeSec = COOKIE_MAX_AGE) {
  const isProd = process.env.NODE_ENV === "production";
  const securePart = isProd ? "Secure; " : "";
  const sameSite = isProd ? "None" : "Lax";
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Max-Age=${maxAgeSec}; ${securePart}SameSite=${sameSite}`;
}

export async function POST(req: Request) {
  const body = await req.json();
  const { Email, Password } = body ?? {};
  if (!Email || !Password) return NextResponse.json({ error: "Missing credentials" }, { status: 400 });

  // find aspnet user by email
  const aspUser = await prisma.appUser.findFirst({ where: { Email: Email } });
  if (!aspUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // check Node-side hash first
  const nodeUser = await prisma.nodeUser.findUnique({ where: { UserId: aspUser.Id } });
  if (nodeUser) {
    try {
      const ok = await argon2.verify(nodeUser.passwordHash, Password);
      if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      
      const roles = await prisma.userRole.findMany({
        where: { UserId: aspUser.Id },
        include: { role: true },
      });
      const roleNames = roles.map((r: any) => r.role?.Name).filter(Boolean) as string[];
      var role = roleNames.includes("Admin") ? "Admin" : roleNames.includes("Member") ? "Member" : "Guest";
      const token = signToken({ sub: aspUser.Id, name: aspUser.UserName, securityStamp: aspUser.SecurityStamp });
      const res = NextResponse.json({ id: aspUser.Id, name: aspUser.UserName, role: role, MemberNumber: aspUser.MemberNumber });
      res.headers.set("Set-Cookie", setTokenCookieStr(token));
      return res;
    } catch (err) {
      console.error("argon verify error", err);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  }

  // fallback: verify ASP.NET hash
  if (!aspUser.PasswordHash) return NextResponse.json({ error: "No password set" }, { status: 401 });

  let matched = false;
  try {
    matched = verifyAspNetPassword(aspUser.PasswordHash!, Password);
  } catch (err) {
    console.error("ASP.NET hash verify error:", (err as Error).message);
    return NextResponse.json({ error: "Server error verifying password" }, { status: 500 });
  }

  if (!matched) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  // on success, create a Node-side argon2 hash to avoid future ASP.NET parsing
  try {
    const newHash = await argon2.hash(Password);
    await prisma.nodeUser.create({
      data: { UserId: aspUser.Id, passwordHash: newHash },
    });
  } catch (err) {
    console.error("Failed creating node user hash", err);
    // continue — login still valid
  }
  const roles = await prisma.userRole.findMany({
    where: { UserId: aspUser.Id },
    include: { role: true },
  });
  const roleNames = roles.map((r: any) => r.role?.Name).filter(Boolean) as string[];
  var role = roleNames.includes("Admin") ? "Admin" : roleNames.includes("Member") ? "Member" : "Guest";
  const token = signToken({ sub: aspUser.Id, name: aspUser.UserName, securityStamp: aspUser.SecurityStamp });
  const res = NextResponse.json({ id: aspUser.Id, name: aspUser.UserName, role: role, MemberNumber: aspUser.MemberNumber });
  res.headers.set("Set-Cookie", setTokenCookieStr(token));
  return res;
}