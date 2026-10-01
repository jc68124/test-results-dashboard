import { PrismaClient } from '@jc68124/test-results-dashboard-db';
import { PrismaD1 } from '@prisma/adapter-d1';

export function getPrismaClient(db: D1Database): PrismaClient {
    const adapter = new PrismaD1(db);
    const prisma = new PrismaClient({ adapter });

    return prisma;
}