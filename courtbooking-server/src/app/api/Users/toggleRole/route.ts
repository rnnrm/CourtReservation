import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/utils/session";
import crypto from "crypto";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  const session = await getSessionUser(req);
  if (!session || !session.roles.includes("Admin")) {
    return new Response("Unauthorized", { status: 403, headers: { "content-type": "text/plain" } });
  }

  const body = await req.json();
  const id = body?.Id ?? body?.id;
  const roleName = body?.Role ?? body?.role;
  if (!id || !roleName) return new Response("Id and Role required", { status: 400, headers: { "content-type": "text/plain" } });

  let role = await prisma.role.findFirst({ where: { Name: roleName } });
  if (!role) {
    role = await prisma.role.create({
      data: { Id: crypto.randomUUID(), Name: roleName, NormalizedName: roleName.toUpperCase() },
    });
  }

  const existing = await prisma.userRole.findFirst({ where: { UserId: id, RoleId: role.Id } });
  if (existing) {
    await prisma.userRole.deleteMany({ where: { UserId: id, RoleId: role.Id } });
  } else {
    await prisma.userRole.create({ data: { UserId: id, RoleId: role.Id } });
    if (roleName === "Member") {
      const max = await prisma.appUser.aggregate({ _max: { MemberNumber: true } });
      const next = (max._max.MemberNumber ?? 0) + 1;
      await prisma.appUser.updateMany({ where: { Id: id, MemberNumber: null }, data: { MemberNumber: next } });
    }
  }

  return NextResponse.json({ ok: true });
}