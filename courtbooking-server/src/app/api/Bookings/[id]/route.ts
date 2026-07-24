import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/utils/session";
import { NextResponse } from "next/server";

function toReservation(r: any) {
  return {
    id: r.Id,
    title: r.Title ?? "",
    // Convert to South Africa short-date format
    start: r.Start ? (r.Start as Date).toLocaleDateString("en-ZA") : null,
    end: r.End ? (r.End as Date).toLocaleDateString("en-ZA") : null,
    date: r.Date ? (r.Date as Date).toLocaleDateString("en-ZA") : null,
    allDay: r.AllDay,
    className: r.ClassName,
    backgroundColor: r.BackgroundColor,
    extendedProps: {
      owner: r.ownerId ?? "",
      court: r.court ?? 0,
      description: r.Description ?? null,
    },
  };
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await prisma.reservation.findUnique({ where: { Id: id } });
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(toReservation(r));
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await prisma.reservation.findUnique({ where: { Id: id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const session = await getSessionUser(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const userId = session.id;
  const isOwner = userId && existing.ownerId === userId;
  const isAdmin = session.roles.includes("Admin");
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json();

  const updated = await prisma.reservation.update({
    where: { Id: id },
    data: {
      Title: body.title ?? existing.Title,
      Start: body.start ? new Date(body.start) : body.start === null ? null : existing.Start,
      End: body.end ? new Date(body.end) : body.end === null ? null : existing.End,
      Date: body.date ? new Date(body.date) : body.date === null ? null : existing.Date,
      AllDay: body.allDay ?? existing.AllDay,
      ClassName: body.className ?? existing.ClassName,
      BackgroundColor: body.backgroundColor ?? existing.BackgroundColor,
      court: body.extendedProps?.court ?? body.court ?? existing.court,
      Description: body.extendedProps?.description ?? body.description ?? existing.Description,
    },
  });

  // Return updated in short-date string form
  return NextResponse.json(toReservation(updated), { status: 200 });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await prisma.reservation.findUnique({ where: { Id: id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const session = await getSessionUser(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const userId = session.id;
  const isOwner = userId && existing.ownerId === userId;
  const isAdmin = session.roles.includes("Admin");
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  await prisma.reservation.delete({ where: { Id: id } });
  return NextResponse.json(null, { status: 204 });
}