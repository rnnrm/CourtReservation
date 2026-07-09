import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatScore } from "../formatScore";

export async function GET(req: Request) {
  // Return pending (unconfirmed) match results with player names
  const pending = await prisma.matchResult.findMany({
    where: { Confirmed: false },
    orderBy: { DatePlayed: "desc" },
    take: 100
  });

  const result = await Promise.all(
    pending.map(async (m: any) => {
      // winner players
      const winnerPlayers = await prisma.competitorPlayer.findMany({ where: { CompetitorId: m.WinnerId } });
      const winnerNames = await Promise.all(
        winnerPlayers.map(async (wp: any) => (await prisma.appUser.findUnique({ where: { Id: wp.AppUserId } }))?.UserName ?? null)
      );

      // loser players
      const loserPlayers = await prisma.competitorPlayer.findMany({ where: { CompetitorId: m.LoserId } });
      const loserNames = await Promise.all(
        loserPlayers.map(async (lp: any) => (await prisma.appUser.findUnique({ where: { Id: lp.AppUserId } }))?.UserName ?? null)
      );

      // reported by players (competitor that reported)
      const reportedPlayers = await prisma.competitorPlayer.findMany({ where: { CompetitorId: m.ReportedById } });
      const reportedNames = await Promise.all(
        reportedPlayers.map(async (rp: any) => (await prisma.appUser.findUnique({ where: { Id: rp.AppUserId } }))?.UserName ?? null)
      );

      const reportedBy =
        reportedNames.length > 1 ? `${reportedNames[0]} & ${reportedNames[1]}` : reportedNames[0] ?? null;

      return {
        id: m.Id,
        winner1: winnerNames[0] ?? null,
        winner2: winnerNames.length > 1 ? winnerNames[1] : null,
        loser1: loserNames[0] ?? null,
        loser2: loserNames.length > 1 ? loserNames[1] : null,
        score: formatScore(m.Score),
        datePlayed: m.DatePlayed ? (m.DatePlayed as Date).toLocaleDateString("en-ZA") : null,
        competitionName: m.CompetitionName,
        reportedBy
      };
    })
  );

  return NextResponse.json(result);
}