import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../db/db.client.js";
import { ApiError } from "../../utils/api-output.util.js";
import { surveyDefinitionSchema } from "../surveys/surveys.schema.js";
import { validateAnswers, type Answers } from "./answers.schema.js";
import { responseRepository } from "./responses.repository.js";

const asJson = (value: Answers) => value as Prisma.InputJsonValue;
const getPublicSurvey = async (surveyId: string) => {
  const survey = await prisma.survey.findUnique({ where: { id: surveyId } });
  if (!survey) throw new ApiError(404, "Survey not found");
  return {
    id: survey.id,
    title: survey.title,
    description: survey.description,
    schema: surveyDefinitionSchema.parse(survey.schema),
    acceptingResponses: survey.acceptingResponses,
    createdAt: survey.createdAt,
    updatedAt: survey.updatedAt,
  };
};

const getState = async (surveyId: string, respondentSessionId: string) => {
  await getPublicSurvey(surveyId);
  const response = await responseRepository.findForSession(
    surveyId,
    respondentSessionId,
  );
  if (!response) return { status: "NONE" as const, answers: {} };
  return {
    status: response.status,
    answers: response.answers,
    submittedAt: response.submittedAt,
  };
};

const saveDraft = async (
  surveyId: string,
  respondentSessionId: string,
  answers: unknown,
) =>
  prisma.$transaction(
    async (transaction) => {
      await transaction.$queryRaw`SELECT "id" FROM "Survey" WHERE "id" = ${surveyId} FOR UPDATE`;
      await transaction.$queryRaw`SELECT "id" FROM "RespondentSession" WHERE "id" = ${respondentSessionId} FOR UPDATE`;
      const survey = await transaction.survey.findUnique({
        where: { id: surveyId },
      });
      if (!survey) throw new ApiError(404, "Survey not found");
      if (!survey.acceptingResponses)
        throw new ApiError(
          403,
          "This survey is not currently accepting responses.",
        );
      const existing = await transaction.response.findUnique({
        where: {
          surveyId_respondentSessionId: { surveyId, respondentSessionId },
        },
      });
      if (existing?.status === "SUBMITTED")
        throw new ApiError(409, "You have already submitted this survey.");
      const validated = validateAnswers({
        definition: surveyDefinitionSchema.parse(survey.schema),
        answers,
        final: false,
      });
      return transaction.response.upsert({
        where: {
          surveyId_respondentSessionId: { surveyId, respondentSessionId },
        },
        create: {
          surveyId,
          respondentSessionId,
          answers: asJson(validated),
          status: "DRAFT",
        },
        update: { answers: asJson(validated) },
        select: {
          status: true,
          answers: true,
          submittedAt: true,
          updatedAt: true,
        },
      });
    },
    { isolationLevel: "Serializable" },
  );

const submit = async (
  surveyId: string,
  respondentSessionId: string,
  answers: unknown,
) =>
  prisma.$transaction(
    async (transaction) => {
      await transaction.$queryRaw`SELECT "id" FROM "Survey" WHERE "id" = ${surveyId} FOR UPDATE`;
      await transaction.$queryRaw`SELECT "id" FROM "RespondentSession" WHERE "id" = ${respondentSessionId} FOR UPDATE`;
      const survey = await transaction.survey.findUnique({
        where: { id: surveyId },
      });
      if (!survey) throw new ApiError(404, "Survey not found");
      if (!survey.acceptingResponses)
        throw new ApiError(
          403,
          "This survey is not currently accepting responses.",
        );
      const existing = await transaction.response.findUnique({
        where: {
          surveyId_respondentSessionId: { surveyId, respondentSessionId },
        },
      });
      if (existing?.status === "SUBMITTED")
        throw new ApiError(409, "You have already submitted this survey.");
      const validated = validateAnswers({
        definition: surveyDefinitionSchema.parse(survey.schema),
        answers,
        final: true,
      });
      const submittedAt = new Date();
      return transaction.response.upsert({
        where: {
          surveyId_respondentSessionId: { surveyId, respondentSessionId },
        },
        create: {
          surveyId,
          respondentSessionId,
          answers: asJson(validated),
          status: "SUBMITTED",
          submittedAt,
        },
        update: {
          answers: asJson(validated),
          status: "SUBMITTED",
          submittedAt,
        },
        select: {
          status: true,
          answers: true,
          submittedAt: true,
          updatedAt: true,
        },
      });
    },
    { isolationLevel: "Serializable" },
  );

export const responseService = { getPublicSurvey, getState, saveDraft, submit };
