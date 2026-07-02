import { NextResponse } from "next/server";

const COOKIE_NAME = "auth-token";

export async function GET() {
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", `${COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`);
  return res;
}