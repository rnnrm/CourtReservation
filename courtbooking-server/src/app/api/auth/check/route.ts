import { getSessionUser } from "@/utils/session";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return new Response("Unauthorized", { status: 401, headers: { "content-type": "text/plain" } });
    }

    return NextResponse.json({
      id: session.id,
      name: session.name,
      role: session.roles.includes("Admin") ? "Admin" : session.roles.includes("Member") ? "Member" : "Guest",
      memberNumber: session.rawUser.MemberNumber ?? null
    });
  } catch (err) {
    console.error("auth/check error", err);
    return new Response("Unauthorized", { status: 401, headers: { "content-type": "text/plain" } });
  }
}