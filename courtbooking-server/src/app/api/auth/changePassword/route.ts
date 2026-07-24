import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/utils/jwt";
import argon2 from "argon2";

function base64UrlDecode(input: string) {
  // pad and replace url-safe chars
  input = input.replace(/-/g, "+").replace(/_/g, "/");
  while (input.length % 4) input += "=";
  return Buffer.from(input, "base64").toString("utf8");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const encodedEmail = body?.UserEmail;
    const encodedToken = body?.ResetToken;
    const newPassword = body?.NewPassword?.toString();

    if (!encodedEmail || !encodedToken || !newPassword) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const email = base64UrlDecode(encodedEmail);
    const token = base64UrlDecode(encodedToken);

    let payload: any;
    try {
      payload = verifyToken(token) as any;
    } catch {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    if (payload?.purpose !== "reset" || payload?.email?.toString().toLowerCase() !== email.toLowerCase())
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });

    const user = await prisma.appUser.findFirst({ where: { Email: email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    //const hash = hashPassword(newPassword);
    const newHash = await argon2.hash(newPassword);
    await prisma.nodeUser.update({ where: { UserId: user.Id }, data: { passwordHash: newHash } });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}