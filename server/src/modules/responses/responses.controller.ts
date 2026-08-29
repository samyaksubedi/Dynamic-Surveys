import type { RequestHandler } from "express";
import { ApiError, ApiResponse } from "../../utils/api-output.util.js";
import type { AnswersBody } from "./responses.schema.js";
import { responseService } from "./responses.service.js";

const sessionId = (req: Parameters<RequestHandler>[0]) => {
  if (!req.respondentSession)
    throw new ApiError(500, "Respondent session is unavailable");
  return req.respondentSession.id;
};
const surveyId = (value: string | string[] | undefined) =>
  Array.isArray(value) ? (value[0] ?? "") : (value ?? "");

export const getPublicSurvey: RequestHandler = async (req, res, next) => {
  try {
    res.json(
      new ApiResponse(
        200,
        {
          survey: await responseService.getPublicSurvey(
            surveyId(req.params.surveyId),
          ),
        },
        "Survey fetched successfully",
      ),
    );
  } catch (error) {
    next(error);
  }
};
export const getResponseState: RequestHandler = async (req, res, next) => {
  try {
    res.json(
      new ApiResponse(
        200,
        {
          response: await responseService.getState(
            surveyId(req.params.surveyId),
            sessionId(req),
          ),
        },
        "Response state fetched successfully",
      ),
    );
  } catch (error) {
    next(error);
  }
};
export const saveDraft: RequestHandler = async (req, res, next) => {
  try {
    res.json(
      new ApiResponse(
        200,
        {
          response: await responseService.saveDraft(
            surveyId(req.params.surveyId),
            sessionId(req),
            (req.body as AnswersBody).answers,
          ),
        },
        "Draft saved successfully",
      ),
    );
  } catch (error) {
    next(error);
  }
};
export const submitResponse: RequestHandler = async (req, res, next) => {
  try {
    res.status(201).json(
      new ApiResponse(
        201,
        {
          response: await responseService.submit(
            surveyId(req.params.surveyId),
            sessionId(req),
            (req.body as AnswersBody).answers,
          ),
        },
        "Survey submitted successfully",
      ),
    );
  } catch (error) {
    next(error);
  }
};
