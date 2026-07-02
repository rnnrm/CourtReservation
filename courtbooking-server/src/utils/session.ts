import { verifyToken } from "./jwt";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "auth-token";

function extractTokenFromRequest(req: Request): string | null {
  const cookie = req.headers.get("cookie") ?? "";
  const cookiePairs = cookie.split(";").map(s => s.trim());
  const authCookie = cookiePairs.find(s => s.startsWith(`${COOKIE_NAME}=`));
  if (authCookie) {
    return authCookie.split("=")[1];
  }
  return null;
}

export async function getSessionUser(req: Request) {
  const token = extractTokenFromRequest(req);
  if (!token) return null;
  let payload: any;
  try {
    payload = verifyToken(token) as any;
  } catch {
    return null;
  }
  const userId = payload?.sub;
  if (!userId) return null;

  // load authoritative user data and roles
  const user = await prisma.appUser.findUnique({ where: { Id: userId } });
  if (!user) return null;

  // security stamp check (mirror ASP.NET invalidation behavior)
  if (payload.securityStamp && user.SecurityStamp !== payload.securityStamp) {
    return null; // token was issued before a critical change (password reset etc.)
  }

  const roles = await prisma.userRole.findMany({
    where: { UserId: user.Id },
    include: { role: true },
  });
  const roleNames = roles.map(r => r.role?.Name).filter(Boolean) as string[];

  return {
    id: user.Id,
    name: user.UserName,
    roles: roleNames,
    rawUser: user,
    payload
  };
}