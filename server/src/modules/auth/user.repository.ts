import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../db/db.client.js";

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  isVerified: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export const userRepository = {
  create: (data: Prisma.UserCreateInput) =>
    prisma.user.create({ data, select: publicUserSelect }),
  findAuthByEmail: (email: string) =>
    prisma.user.findUnique({ where: { email } }),
  findPublicById: (id: string) =>
    prisma.user.findUnique({ where: { id }, select: publicUserSelect }),
  findByVerificationTokenHash: (emailVerificationTokenHash: string) =>
    prisma.user.findUnique({ where: { emailVerificationTokenHash } }),
  update: (id: string, data: Prisma.UserUpdateInput) =>
    prisma.user.update({ where: { id }, data, select: publicUserSelect }),
};
