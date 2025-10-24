import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

declare global {
  var prisma: any;
}

export const prisma = globalThis.prisma || new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
}).$extends(withAccelerate());

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}
