import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../db/db.client.js";

export const userSessionRepository = {
  create: (data: Prisma.UserSessionUncheckedCreateInput) =>
    prisma.userSession.create({ data }),
  findByRefreshTokenHash: (refreshTokenHash: string) =>
    prisma.userSession.findUnique({ where: { refreshTokenHash } }),
  touch: (id: string) =>
    prisma.userSession.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    }),
  delete: (id: string) => prisma.userSession.deleteMany({ where: { id } }),
  deleteAll: (userId: string) =>
    prisma.userSession.deleteMany({ where: { userId } }),
  list: (userId: string) =>
    prisma.userSession.findMany({
      where: { userId, refreshTokenExpires: { gt: new Date() } },
      select: {
        id: true,
        deviceInfo: true,
        ipAddress: true,
        createdAt: true,
        lastUsedAt: true,
      },
      orderBy: { lastUsedAt: "desc" },
    }),
};
