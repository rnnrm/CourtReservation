//import { PrismaClient } from "@/generated/prisma";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  // Allow single PrismaClient instance in development to avoid connection storms
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient;
}
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma: PrismaClient =
    global.__prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}