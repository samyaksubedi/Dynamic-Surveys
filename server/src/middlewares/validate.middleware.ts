import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { ApiError } from "../utils/api-output.util.js";

export const validate = ({
  schema,
  source = "body",
}: {
  schema: ZodType;
  source?: "body" | "params" | "query";
}): RequestHandler => {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(
        new ApiError(
          400,
          `Error validating req.${source}`,
          result.error.issues.map(({ path, message }) => ({ path, message })),
        ),
      );
      return;
    }
    req[source] = result.data;
    next();
  };
};
