import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/utils/session";
import { NextResponse } from "next/server";

function formatReservationForOutput(r: any) {
  // start/end as ISO strings when present
  const startIso = r.Start ? (r.Start as Date).toISOString() : null;
  const endIso = r.End ? (r.End as Date).toISOString() : null;

  // include `date` ONLY for all-day reservations and when Date is present
  const includeDate = !!r.AllDay && !!r.Date;
  const dateStr = includeDate ? (r.Date as Date).toLocaleDateString("en-ZA") : undefined;

  const out: any = {
    id: r.Id,
    title: r.Title ?? "",
    start: startIso,
    end: endIso,
    allDay: r.AllDay,
    className: r.ClassName,
    backgroundColor: r.BackgroundColor,
    extendedProps: {
      owner: r.ownerId ?? "",
      court: r.court ?? 0,
      description: r.Description ?? null,
    },
  };

  if (includeDate) out.date = dateStr;

  return out;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");
  const court = url.searchParams.get("court");

  const where: any = {};
  if (court) where.court = Number(court);

  const rows = await prisma.reservation.findMany({
    where,
    orderBy: { Start: "asc" },
  });

  // Use Date objects for filtering, then convert for output
  const reservationsRaw = rows.map((r: any) => ({
    Id: r.Id,
    Title: r.Title ?? "",
    Start: r.Start ?? null,
    End: r.End ?? null,
    Date: r.Date ?? null,
    AllDay: r.AllDay ?? false,
    ClassName: r.ClassName ?? "",
    BackgroundColor: r.BackgroundColor ?? null,
    ownerId: r.ownerId ?? "",
    court: r.court ?? 0,
    Description: r.Description ?? null,
  }));

  if (!start && !end) {
    return NextResponse.json(reservationsRaw.map(formatReservationForOutput));
  }

  const startDt = start ? new Date(start) : null;
  const endDt = end ? new Date(end) : null;

  const filteredRaw = reservationsRaw.filter((r: any) => {
    const reservationStart = (r.Start as Date | null) ?? (r.Date as Date | null);
    const reservationEnd =
      (r.End as Date | null) ?? (r.Date as Date | null) ?? reservationStart;
    if (!reservationStart) return false;

    if (startDt && endDt) {
      return (
        reservationStart < endDt && (reservationEnd ?? reservationStart) >= startDt
      );
    }
    if (startDt) {
      return (reservationEnd ?? reservationStart) >= startDt;
    }
    if (endDt) {
      return reservationStart < endDt;
    }
    return false;
  });

  return NextResponse.json(filteredRaw.map(formatReservationForOutput));
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!body) return new Response("Bad Request", { status: 400, headers: { "content-type": "text/plain" } });

  const created = await prisma.reservation.create({
    data: {
      Id: body.Id ?? undefined,
      Title: body.Title ?? "",
      Start: body.Start ? new Date(body.Start) : null,
      End: body.End ? new Date(body.End) : null,
      Date: body.Date ? new Date(body.Date) : null,
      AllDay: body.AllDay ?? null,
      ClassName: body.ClassName ?? null,
      BackgroundColor: body.BackgroundColor ?? null,
      ownerId: body.ExtendedProps?.owner ?? body.ownerId ?? "",
      court: body.ExtendedProps?.court ?? body.court ?? 0,
      Description: body.ExtendedProps?.description ?? body.description ?? null,
    },
  });

  // Return created reservation using same output format
  return NextResponse.json(formatReservationForOutput(created), { status: 201 });
}

export async function PUT(req: Request) {
  const body = await req.json();
  if (!body || !body.Id) return new Response("Bad Request", { status: 400, headers: { "content-type": "text/plain" } });

  const session = await getSessionUser(req);
  if (!session) return new Response("Unauthorized", { status: 403, headers: { "content-type": "text/plain" } });

  const existing = await prisma.reservation.findUnique({ where: { Id: body.Id } });
  if (!existing) return new Response("Not found", { status: 404, headers: { "content-type": "text/plain" } });

  const isOwner = existing.ownerId === session.id;
  const isAdmin = session.roles.includes("Admin");
  if (!isOwner && !isAdmin) return new Response("Unauthorized", { status: 403, headers: { "content-type": "text/plain" } });

  const updated = await prisma.reservation.update({
    where: { Id: body.Id },
    data: {
      Title: body.Title ?? existing.Title,
      Start: body.Start ? new Date(body.Start) : existing.Start,
      End: body.End ? new Date(body.End) : existing.End,
      Date: body.Date ? new Date(body.Date) : existing.Date,
      AllDay: body.AllDay ?? existing.AllDay,
      ClassName: body.ClassName ?? existing.ClassName,
      BackgroundColor: body.BackgroundColor ?? existing.BackgroundColor,
      court: body.ExtendedProps?.court ?? body.court ?? existing.court,
      Description: body.ExtendedProps?.description ?? body.description ?? existing.Description,
    },
  });

  return NextResponse.json(formatReservationForOutput(updated), { status: 200 });
}

export async function DELETE(req: Request) {
  const body = await req.json();
  const bookingId = body?.BookingId ?? body?.Id;
  if (!bookingId) return new Response("BookingId required", { status: 400, headers: { "content-type": "text/plain" } });

  const session = await getSessionUser(req);
  if (!session) return new Response("Unauthorized", { status: 403, headers: { "content-type": "text/plain" } });

  const existing = await prisma.reservation.findUnique({ where: { Id: bookingId } });
  if (!existing) return new Response("Not found", { status: 404, headers: { "content-type": "text/plain" } });

  const isOwner = existing.ownerId === session.id;
  const isAdmin = session.roles.includes("Admin");
  if (!isOwner && !isAdmin) return new Response("Unauthorized", { status: 403, headers: { "content-type": "text/plain" } });

  await prisma.reservation.delete({ where: { Id: bookingId } });
  return new Response(null, { status: 204 });
}