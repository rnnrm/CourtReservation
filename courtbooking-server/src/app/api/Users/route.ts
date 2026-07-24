import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/utils/session";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
/*  const session = await getSessionUser(req);
  if (!session || !session.roles.includes("Admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }*/

  const users = await prisma.appUser.findMany({
    select: { Id: true, UserName: true, MemberNumber: true }
  });

  const result: Record<string, any> = {};
  for (const u of users) {
    const roles = await prisma.userRole.findMany({
      where: { UserId: u.Id },
      include: { role: true }
    });
    result[u.Id] = {
      name: u.UserName ?? null,
      id: u.Id,
      roles: roles.map((r: any) => r.role?.Name).filter(Boolean),
      memberNumber: u.MemberNumber ?? null
    };
  }
  return NextResponse.json(result);
}

export async function DELETE(req: Request) {
  const session = await getSessionUser(req);
  if (!session || !session.roles.includes("Admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const id = typeof body === "string" ? body : body?.id ?? body?.Id;
  if (!id) return NextResponse.json({ error: "Id required" }, { status: 400 });

  await prisma.reservation.deleteMany({ where: { ownerId: id } });
  await prisma.userRole.deleteMany({ where: { UserId: id } });
  await prisma.nodeUser.deleteMany({ where: { UserId: id } });
  await prisma.appUser.delete({ where: { Id: id } });

  return NextResponse.json({ ok: true });
}