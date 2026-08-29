import { prisma } from "../../db/db.client.js";

export const responseRepository = {
  findForSession: (surveyId: string, respondentSessionId: string) =>
    prisma.response.findUnique({
      where: {
        surveyId_respondentSessionId: { surveyId, respondentSessionId },
      },
    }),
};
