    import { NextResponse } from "next/server";
//import { PrismaClient } from "@prisma/client";

//const prisma = new PrismaClient();

import { prisma } from "../../../../lib/prisma";
import { formatScore } from "../formatScore";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const competitionName = url.searchParams.get("competitionName") ?? "";
  if (!competitionName) return new Response("competitionName required", { status: 400, headers: { "content-type": "text/plain" } });

  const matches = await prisma.matchResult.findMany({
    where: { Confirmed: true, CompetitionName: competitionName },
    orderBy: { DatePlayed: "desc" },
    take: 50
  });

  const result = await Promise.all(matches.map(async (m: any) => {
    // winner players
    const winnerPlayers = await prisma.competitorPlayer.findMany({ where: { CompetitorId: m.WinnerId } });
    const winnerNames = await Promise.all(winnerPlayers.map(async (wp: any) => (await prisma.appUser.findUnique({ where: { Id: wp.AppUserId } }))?.UserName));
    // loser players
    const loserPlayers = await prisma.competitorPlayer.findMany({ where: { CompetitorId: m.LoserId } });
    const loserNames = await Promise.all(loserPlayers.map(async (lp: any) => (await prisma.appUser.findUnique({ where: { Id: lp.AppUserId } }))?.UserName));

    return {
      winner1: winnerNames[0] ?? null,
      winner2: winnerNames.length > 1 ? winnerNames[1] : null,
      loser1: loserNames[0] ?? null,
      loser2: loserNames.length > 1 ? loserNames[1] : null,
      score: formatScore(m.Score),
      // .NET ToShortDateString equivalent (South Africa)
      datePlayed: m.DatePlayed ? (m.DatePlayed as Date).toLocaleDateString("en-ZA") : null,
      pointsChange: Math.round(m.PointsChange * 10) / 10
    };
  }));

  return NextResponse.json(result);
}