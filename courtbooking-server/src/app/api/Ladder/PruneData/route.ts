import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(req: Request) {
    const authHeader = req.headers.get("authorization") || "";
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cutoffDays = Number(process.env.PRUNE_CUTOFF_DAYS ?? "14");
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - cutoffDays);

    try {
        const result = await prisma.matchResult.deleteMany({
            where: {
                Confirmed: false,
                DatePlayed: { lt: cutoff },
            },
        });

        return NextResponse.json({
            success: true,
            cutoff: cutoff.toISOString(),
            deleted: result.count,
        });
    } catch (err) {
        console.error("Prune failed:", err);
        return NextResponse.json({ error: "Prune failed: Internal Server Error" }, { status: 500 });
    }
}