import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: any;
}

export const prisma = globalThis.prisma || new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}
