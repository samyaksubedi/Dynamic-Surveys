import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../db/db.client.js";
import { ApiError } from "../../utils/api-output.util.js";
import { calculateAnalytics } from "../analytics/analytics.service.js";
import type { Answers } from "../responses/answers.schema.js";
import {
  surveyDefinitionSchema,
  type CreateSurveyInput,
  type SurveyDefinition,
  type UpdateSurveyMetadataInput,
} from "./surveys.schema.js";
import { surveyRepository } from "./surveys.repository.js";

const asJson = (value: object) => value as Prisma.InputJsonValue;
const parseDefinition = (value: Prisma.JsonValue): SurveyDefinition =>
  surveyDefinitionSchema.parse(value);
const ensureOwned = async (surveyId: string, creatorId: string) => {
  const survey = await surveyRepository.findOwned(surveyId, creatorId);
  if (!survey) throw new ApiError(404, "Survey not found");
  return survey;
};

const create = (creatorId: string, input: CreateSurveyInput) =>
  surveyRepository.create({
    ...input,
    creatorId,
    schema: asJson(input.schema),
  });

const list = async (creatorId: string) => {
  const surveys = await surveyRepository.listOwned(creatorId);
  return surveys.map(({ _count, ...survey }) => ({
    ...survey,
    schema: parseDefinition(survey.schema),
    submittedResponseCount: _count.responses,
  }));
};

const get = async (surveyId: string, creatorId: string) => {
  const survey = await ensureOwned(surveyId, creatorId);
  return { ...survey, schema: parseDefinition(survey.schema) };
};

const updateMetadata = async (
  surveyId: string,
  creatorId: string,
  input: UpdateSurveyMetadataInput,
) => {
  await ensureOwned(surveyId, creatorId);
  const data: Prisma.SurveyUpdateInput = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  return surveyRepository.updateOwned(surveyId, creatorId, data);
};

const updateSchema = async (
  surveyId: string,
  creatorId: string,
  definition: SurveyDefinition,
) =>
  prisma.$transaction(
    async (transaction) => {
      await transaction.$queryRaw`SELECT "id" FROM "Survey" WHERE "id" = ${surveyId} FOR UPDATE`;
      const survey = await transaction.survey.findFirst({
        where: { id: surveyId, creatorId },
      });
      if (!survey) throw new ApiError(404, "Survey not found");
      const submitted = await transaction.response.count({
        where: { surveyId, status: "SUBMITTED" },
      });
      if (submitted > 0) {
        throw new ApiError(
          409,
          "The survey structure cannot be changed after responses have been submitted.",
        );
      }
      return transaction.survey.update({
        where: { id: surveyId },
        data: { schema: asJson(definition) },
      });
    },
    { isolationLevel: "Serializable" },
  );

const setAcceptingResponses = async (
  surveyId: string,
  creatorId: string,
  acceptingResponses: boolean,
) => {
  await ensureOwned(surveyId, creatorId);
  return surveyRepository.updateOwned(surveyId, creatorId, {
    acceptingResponses,
  });
};

const remove = async (surveyId: string, creatorId: string) => {
  const deleted = await surveyRepository.deleteOwned(surveyId, creatorId);
  if (deleted.count === 0) throw new ApiError(404, "Survey not found");
};

const analytics = async (surveyId: string, creatorId: string) => {
  const survey = await ensureOwned(surveyId, creatorId);
  const responses = await prisma.response.findMany({
    where: { surveyId, status: "SUBMITTED" },
    select: { answers: true },
    orderBy: { submittedAt: "asc" },
  });
  return calculateAnalytics(
    parseDefinition(survey.schema),
    responses.map((response) => response.answers as Answers),
  );
};

export const surveyService = {
  create,
  list,
  get,
  updateMetadata,
  updateSchema,
  setAcceptingResponses,
  remove,
  analytics,
};
