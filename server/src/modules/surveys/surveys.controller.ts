import type { RequestHandler } from "express";
import { ApiResponse } from "../../utils/api-output.util.js";
import type {
  CreateSurveyInput,
  SurveyDefinition,
  UpdateSurveyMetadataInput,
} from "./surveys.schema.js";
import { surveyService } from "./surveys.service.js";

const surveyId = (value: string | string[] | undefined) =>
  Array.isArray(value) ? (value[0] ?? "") : (value ?? "");

export const createSurvey: RequestHandler = async (req, res, next) => {
  try {
    const survey = await surveyService.create(
      req.user.id,
      req.body as CreateSurveyInput,
    );
    res
      .status(201)
      .json(new ApiResponse(201, { survey }, "Survey created successfully"));
  } catch (error) {
    next(error);
  }
};
export const listSurveys: RequestHandler = async (req, res, next) => {
  try {
    res.json(
      new ApiResponse(
        200,
        { surveys: await surveyService.list(req.user.id) },
        "Surveys fetched successfully",
      ),
    );
  } catch (error) {
    next(error);
  }
};
export const getSurvey: RequestHandler = async (req, res, next) => {
  try {
    res.json(
      new ApiResponse(
        200,
        {
          survey: await surveyService.get(
            surveyId(req.params.surveyId),
            req.user.id,
          ),
        },
        "Survey fetched successfully",
      ),
    );
  } catch (error) {
    next(error);
  }
};
export const updateSurveyMetadata: RequestHandler = async (req, res, next) => {
  try {
    res.json(
      new ApiResponse(
        200,
        {
          survey: await surveyService.updateMetadata(
            surveyId(req.params.surveyId),
            req.user.id,
            req.body as UpdateSurveyMetadataInput,
          ),
        },
        "Survey metadata updated successfully",
      ),
    );
  } catch (error) {
    next(error);
  }
};
export const updateSurveySchema: RequestHandler = async (req, res, next) => {
  try {
    res.json(
      new ApiResponse(
        200,
        {
          survey: await surveyService.updateSchema(
            surveyId(req.params.surveyId),
            req.user.id,
            req.body as SurveyDefinition,
          ),
        },
        "Survey structure updated successfully",
      ),
    );
  } catch (error) {
    next(error);
  }
};
export const toggleSurvey: RequestHandler = async (req, res, next) => {
  try {
    res.json(
      new ApiResponse(
        200,
        {
          survey: await surveyService.setAcceptingResponses(
            surveyId(req.params.surveyId),
            req.user.id,
            (req.body as { acceptingResponses: boolean }).acceptingResponses,
          ),
        },
        "Survey response availability updated successfully",
      ),
    );
  } catch (error) {
    next(error);
  }
};
export const deleteSurvey: RequestHandler = async (req, res, next) => {
  try {
    await surveyService.remove(surveyId(req.params.surveyId), req.user.id);
    res.json(new ApiResponse(200, null, "Survey deleted successfully"));
  } catch (error) {
    next(error);
  }
};
export const getAnalytics: RequestHandler = async (req, res, next) => {
  try {
    res.json(
      new ApiResponse(
        200,
        {
          analytics: await surveyService.analytics(
            surveyId(req.params.surveyId),
            req.user.id,
          ),
        },
        "Survey analytics fetched successfully",
      ),
    );
  } catch (error) {
    next(error);
  }
};
