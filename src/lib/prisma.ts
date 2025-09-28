// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

declare global {
  // permitir reuso en dev sin que TS se queje
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    // opcional: logs útiles
    // log: ["query", "error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
