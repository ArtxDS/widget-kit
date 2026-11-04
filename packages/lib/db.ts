import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export function getDb() {
  const cachedClient = globalForPrisma.prisma;
  if (cachedClient && typeof cachedClient.itemTestRun?.findMany === "function") {
    return cachedClient;
  }

  // A dev server can keep a Prisma singleton created before a schema change.
  // Replace that stale client after Prisma Client has been regenerated.
  if (cachedClient) void cachedClient.$disconnect();

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add the Supabase pooled connection string to .env.local.",
    );
  }

  const adapter = new PrismaPg({ connectionString, max: 5 });
  const client = new PrismaClient({ adapter });

  globalForPrisma.prisma = client;
  return client;
}
