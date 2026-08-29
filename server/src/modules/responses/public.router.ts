import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { createSubmissionRateLimiter } from "../../middlewares/submission-rate-limit.middleware.js";
import { ensureRespondentSession } from "../respondent-sessions/respondent-session.middleware.js";
import { surveyIdParamsSchema } from "../surveys/surveys.schema.js";
import {
  getPublicSurvey,
  getResponseState,
  saveDraft,
  submitResponse,
} from "./responses.controller.js";
import { answersBodySchema } from "./responses.schema.js";

export const publicSurveysRouter = Router();
publicSurveysRouter.use(
  "/:surveyId",
  validate({ schema: surveyIdParamsSchema, source: "params" }),
  ensureRespondentSession,
);
publicSurveysRouter.get("/:surveyId", getPublicSurvey);
publicSurveysRouter.get("/:surveyId/response", getResponseState);
publicSurveysRouter.put(
  "/:surveyId/response",
  validate({ schema: answersBodySchema }),
  saveDraft,
);
publicSurveysRouter.post(
  "/:surveyId/submissions",
  createSubmissionRateLimiter(),
  validate({ schema: answersBodySchema }),
  submitResponse,
);
