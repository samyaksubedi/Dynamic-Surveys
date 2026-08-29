import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../db/db.client.js";

export const surveyRepository = {
  create: (data: Prisma.SurveyUncheckedCreateInput) =>
    prisma.survey.create({ data }),
  listOwned: (creatorId: string) =>
    prisma.survey.findMany({
      where: { creatorId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { responses: { where: { status: "SUBMITTED" } } } },
      },
    }),
  findOwned: (id: string, creatorId: string) =>
    prisma.survey.findFirst({ where: { id, creatorId } }),
  findPublic: (id: string) => prisma.survey.findUnique({ where: { id } }),
  deleteOwned: (id: string, creatorId: string) =>
    prisma.survey.deleteMany({ where: { id, creatorId } }),
  updateOwned: (
    id: string,
    creatorId: string,
    data: Prisma.SurveyUpdateInput,
  ) => prisma.survey.update({ where: { id, creatorId }, data }),
};
