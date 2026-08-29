import { Router } from "express";
import { authenticateUser } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createSurvey,
  deleteSurvey,
  getAnalytics,
  getSurvey,
  listSurveys,
  toggleSurvey,
  updateSurveyMetadata,
  updateSurveySchema,
} from "./surveys.controller.js";
import {
  createSurveySchema,
  surveyDefinitionSchema,
  surveyIdParamsSchema,
  updateAcceptingResponsesSchema,
  updateSurveyMetadataSchema,
} from "./surveys.schema.js";

export const surveysRouter = Router();
surveysRouter.use(authenticateUser);
surveysRouter.get("/", listSurveys);
surveysRouter.post("/", validate({ schema: createSurveySchema }), createSurvey);
surveysRouter.get(
  "/:surveyId/analytics",
  validate({ schema: surveyIdParamsSchema, source: "params" }),
  getAnalytics,
);
surveysRouter.patch(
  "/:surveyId/metadata",
  validate({ schema: surveyIdParamsSchema, source: "params" }),
  validate({ schema: updateSurveyMetadataSchema }),
  updateSurveyMetadata,
);
surveysRouter.put(
  "/:surveyId/schema",
  validate({ schema: surveyIdParamsSchema, source: "params" }),
  validate({ schema: surveyDefinitionSchema }),
  updateSurveySchema,
);
surveysRouter.patch(
  "/:surveyId/accepting-responses",
  validate({ schema: surveyIdParamsSchema, source: "params" }),
  validate({ schema: updateAcceptingResponsesSchema }),
  toggleSurvey,
);
surveysRouter.get(
  "/:surveyId",
  validate({ schema: surveyIdParamsSchema, source: "params" }),
  getSurvey,
);
surveysRouter.delete(
  "/:surveyId",
  validate({ schema: surveyIdParamsSchema, source: "params" }),
  deleteSurvey,
);
