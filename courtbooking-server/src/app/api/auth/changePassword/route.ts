import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/utils/jwt";
import {hashPassword} from "@/utils/hashing";

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

    if (!encodedEmail || !encodedToken || !newPassword) return new Response("Missing fields", { status: 400, headers: { "content-type": "text/plain" } });

    const email = base64UrlDecode(encodedEmail);
    const token = base64UrlDecode(encodedToken);

    let payload: any;
    try {
      payload = verifyToken(token) as any;
    } catch {
      return new Response("Invalid or expired token", { status: 400, headers: { "content-type": "text/plain" } });
    }

    if (payload?.purpose !== "reset" || payload?.email?.toString().toLowerCase() !== email.toLowerCase())
      return new Response("Invalid token", { status: 400, headers: { "content-type": "text/plain" } });

    const user = await prisma.appUser.findFirst({ where: { Email: email } });
    if (!user) return new Response("User not found", { status: 404, headers: { "content-type": "text/plain" } });

    const hash = hashPassword(newPassword);
    await prisma.appUser.update({ where: { Id: user.Id }, data: { PasswordHash: hash } });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return new Response(err?.message ?? "Server error", { status: 500, headers: { "content-type": "text/plain" } });
  }
}