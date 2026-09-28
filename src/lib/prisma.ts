import { PrismaClient } from "@prisma/client";

// Next.js lädt Module in der Entwicklung mehrfach neu (Hot Reload).
// Ohne dieses Singleton-Pattern würden dabei zu viele DB-Verbindungen
// aufgebaut werden.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
