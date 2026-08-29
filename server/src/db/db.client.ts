import { PrismaClient } from "../generated/prisma/client.js";

export const prisma = new PrismaClient();

export const connectPostgres = async () => {
  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1`;
};

export const disconnectPostgres = () => prisma.$disconnect();
