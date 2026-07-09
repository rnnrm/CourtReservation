import { NextResponse } from "next/server";
//import { PrismaClient } from "@prisma/client";

//const prisma = new PrismaClient();
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const competitionName = url.searchParams.get("competitionName") ?? "";
  if (!competitionName) return new Response("competitionName required", { status: 400, headers: { "content-type": "text/plain" } });

  const competitors = await prisma.competitor.findMany({
    where: { Competition: competitionName },
    orderBy: { Rating: "desc" },
  });

  const result = await Promise.all(competitors.map(async (c: any) => {
    // fetch player ids for this competitor
    const players = await prisma.competitorPlayer.findMany({ where: { CompetitorId: c.Id } });
    const playerUsers = await Promise.all(players.map(async (p: any) => {
      const u = await prisma.appUser.findUnique({ where: { Id: p.AppUserId } });
      return { id: p.AppUserId, userName: u?.UserName ?? null };
    }));
    return {
      id: c.Id,
      rating: Math.round(c.Rating),
      rank: c.Rank,
      type: c.Type,
      players: playerUsers
    };
  }));

  return NextResponse.json(result);
}