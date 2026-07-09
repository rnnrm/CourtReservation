import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { getSessionUser } from "@/utils/session";
import { NextResponse } from "next/server";

/**
 * POST /api/ladder
 * Mirrors server-side logic in LadderController.Post
 */

function parseDateOnly(v?: string | null) {
  if (!v) return new Date();
  const d = new Date(v);
  if (isNaN(d.getTime())) return new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function updatePointsAndPersist(winner: any, loser: any) {
  const E = 1.0 / (1.0 + Math.pow(10.0, (loser.Rating - winner.Rating) / 400.0));
  const k = 32;
  const pointsChange = k * (1.0 - E);
  winner.Rating = Number(winner.Rating) + pointsChange;
  loser.Rating = Number(loser.Rating) - pointsChange;
  return Math.round(pointsChange * 100) / 100;
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser(req);
    if (!session) return new Response("Unauthorized", { status: 401, headers: { "content-type": "text/plain" } });
    const userId = session.id;

    const body = await req.json();
    if (!body) return new Response("Missing body", { status: 400, headers: { "content-type": "text/plain" } });

    // prune unconfirmed matches older than 14 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);
    await prisma.matchResult.deleteMany({
      where: { Confirmed: false, DatePlayed: { lt: cutoff } },
    });

    // parse input
    const pCompetition = body.CompetitionName ?? "Ladder";
    const pScore: number[] = Array.isArray(body.Score) ? body.Score.map(Number) : [];
    if (pScore.length % 2 === 1) return new Response("Invalid score array", { status: 400, headers: { "content-type": "text/plain" } });

    // calculate wins vs losses
    let win = 0, lose = 0;
    for (let i = 0; i < pScore.length; i += 2) {
      const a = pScore[i], b = pScore[i + 1];
      if (a > b) win++;
      else if (a < b) lose++;
    }
    if (win === lose) return new Response("Invalid score (tie)", { status: 400, headers: { "content-type": "text/plain" } });

    const doubles = !!(body.Partner && body.Opponent2);
    let Winner1 = userId;
    let Winner2 = body.Partner ?? null;
    let Loser1 = body.Opponent;
    let Loser2 = body.Opponent2 ?? null;

    if (lose > win) {
      for (let i = 0; i < pScore.length; i += 2) {
        [pScore[i], pScore[i + 1]] = [pScore[i + 1], pScore[i]];
      }
      Winner1 = body.Opponent;
      Winner2 = body.Opponent2 ?? null;
      Loser1 = userId;
      Loser2 = body.Partner ?? null;
    }

    async function findCompetitorForPlayers(playerA: string, playerB?: string) {
      const candEntries = await prisma.competitorPlayer.findMany({
        where: { AppUserId: playerA },
        select: { CompetitorId: true },
      });
      if (candEntries.length === 0) return null;
      const candidateIds = candEntries.map((e: any) => e.CompetitorId);

      if (playerB) {
        for (const cid of candidateIds) {
          const hasOther = await prisma.competitorPlayer.findFirst({
            where: { CompetitorId: cid, AppUserId: playerB },
            select: { CompetitorId: true },
          });
          if (hasOther) {
            const comp = await prisma.competitor.findFirst({ where: { Id: cid, Competition: pCompetition } });
            if (comp) return comp;
          }
        }
        return null;
      } else {
        for (const cid of candidateIds) {
          const comp = await prisma.competitor.findFirst({ where: { Id: cid, Competition: pCompetition } });
          if (comp) return comp;
        }
        return null;
      }
    }

    let winners = await findCompetitorForPlayers(Winner1, Winner2 ?? undefined);
    if (!winners) {
      const type = doubles ? "doubles" : "singles";
      const compId = uuidv4();
      winners = await prisma.competitor.create({
        data: {
          Id: compId,
          Rating: 1500,
          Rank: 0,
          Type: type,
          Competition: pCompetition,
          MatchesPlayed: 0,
        },
      });
      await prisma.competitorPlayer.createMany({
        data: [
          { CompetitorId: compId, AppUserId: Winner1 },
          ...(doubles && Winner2 ? [{ CompetitorId: compId, AppUserId: Winner2 }] : []),
        ],
      });
    }

    let losers = await findCompetitorForPlayers(Loser1, Loser2 ?? undefined);
    if (!losers) {
      const type = doubles ? "doubles" : "singles";
      const compId = uuidv4();
      losers = await prisma.competitor.create({
        data: {
          Id: compId,
          Rating: 1500,
          Rank: 0,
          Type: type,
          Competition: pCompetition,
          MatchesPlayed: 0,
        },
      });
      await prisma.competitorPlayer.createMany({
        data: [
          { CompetitorId: compId, AppUserId: Loser1 },
          ...(doubles && Loser2 ? [{ CompetitorId: compId, AppUserId: Loser2 }] : []),
        ],
      });
    }

    let ReportedByCompetitor = winners;
    const loggedInIsWinnerSide = (Winner1 === userId) || (Winner2 === userId);
    if (!loggedInIsWinnerSide) ReportedByCompetitor = losers;

    const datePlayed = parseDateOnly(body.DatePlayed ?? new Date().toISOString());

    const oppositeMatch = await prisma.matchResult.findFirst({
      where: {
        CompetitionName: pCompetition,
        WinnerId: winners.Id,
        LoserId: losers.Id,
        Confirmed: false,
        NOT: { ReportedById: ReportedByCompetitor.Id },
        DatePlayed: {
          gte: new Date(Date.UTC(datePlayed.getUTCFullYear(), datePlayed.getUTCMonth(), datePlayed.getUTCDate(), 0, 0, 0)),
          lt: new Date(Date.UTC(datePlayed.getUTCFullYear(), datePlayed.getUTCMonth(), datePlayed.getUTCDate() + 1, 0, 0, 0)),
        },
      },
    });

    if (!oppositeMatch) {
      const existingReported = await prisma.matchResult.findFirst({
        where: {
          CompetitionName: pCompetition,
          WinnerId: winners.Id,
          LoserId: losers.Id,
          Confirmed: false,
          ReportedById: ReportedByCompetitor.Id,
          DatePlayed: {
            gte: new Date(Date.UTC(datePlayed.getUTCFullYear(), datePlayed.getUTCMonth(), datePlayed.getUTCDate(), 0, 0, 0)),
            lt: new Date(Date.UTC(datePlayed.getUTCFullYear(), datePlayed.getUTCMonth(), datePlayed.getUTCDate() + 1, 0, 0, 0)),
          },
        },
      });
      if (existingReported) {
        await prisma.matchResult.delete({ where: { Id: existingReported.Id } });
      }

      const mr = await prisma.matchResult.create({
        data: {
          Id: uuidv4(),
          Confirmed: false,
          CompetitionName: pCompetition,
          DatePlayed: datePlayed,
          WinnerId: winners.Id,
          LoserId: losers.Id,
          Score: pScore,
          ReportedById: ReportedByCompetitor.Id,
          PointsChange: 0,
        },
      });
      return NextResponse.json({ status: "Pending", matchId: mr.Id }, { status: 201 });
    } else {
      const matchId = oppositeMatch.Id;
      await prisma.matchResult.update({
        where: { Id: matchId },
        data: { Confirmed: true },
      });

      await prisma.competitor.updateMany({
        where: { Id: winners.Id },
        data: { MatchesPlayed: { increment: 1 } },
      });
      await prisma.competitor.updateMany({
        where: { Id: losers.Id },
        data: { MatchesPlayed: { increment: 1 } },
      });

      const winnerRec = await prisma.competitor.findUnique({ where: { Id: winners.Id } });
      const loserRec = await prisma.competitor.findUnique({ where: { Id: losers.Id } });
      if (winnerRec && loserRec) {
        const pointsChange = updatePointsAndPersist(winnerRec, loserRec);
        await prisma.competitor.updateMany({
          where: { Id: winnerRec.Id },
          data: { Rating: winnerRec.Rating },
        });
        await prisma.competitor.updateMany({
          where: { Id: loserRec.Id },
          data: { Rating: loserRec.Rating },
        });

        await prisma.matchResult.update({
          where: { Id: matchId },
          data: { PointsChange: pointsChange },
        });
      }

      return NextResponse.json({ status: "Updated", matchId }, { status: 200 });
    }
  } catch (err: any) {
    return new Response(err?.message ?? "Server error", { status: 500, headers: { "content-type": "text/plain" } });
  }
}