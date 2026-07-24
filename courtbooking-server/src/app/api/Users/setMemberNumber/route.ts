import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/utils/session";

export async function POST(req: Request) {
  const session = await getSessionUser(req);
  if (!session || !session.roles.includes("Admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const id = body?.Id ?? body?.id;
  const memberNumber = body?.MemberNumber ?? body?.memberNumber;
  if (!id || memberNumber == null) return NextResponse.json({ error: "Id and MemberNumber required" }, { status: 400 });

  await prisma.appUser.update({ where: { Id: id }, data: { MemberNumber: Number(memberNumber) } });
  return NextResponse.json({ ok: true });
}