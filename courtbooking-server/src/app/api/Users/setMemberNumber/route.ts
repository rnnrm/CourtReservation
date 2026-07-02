import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/utils/session";

export async function POST(req: Request) {
  const session = await getSessionUser(req);
  if (!session || !session.roles.includes("Admin")) {
    return new Response("Unauthorized", { status: 403, headers: { "content-type": "text/plain" } });
  }

  const body = await req.json();
  const id = body?.Id ?? body?.id;
  const memberNumber = body?.MemberNumber ?? body?.memberNumber;
  if (!id || memberNumber == null) return new Response("Id and MemberNumber required", { status: 400, headers: { "content-type": "text/plain" } });

  await prisma.appUser.update({ where: { Id: id }, data: { MemberNumber: Number(memberNumber) } });
  return NextResponse.json({ ok: true });
}