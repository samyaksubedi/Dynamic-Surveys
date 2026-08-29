import { z } from "zod";

export const answersBodySchema = z.object({
  answers: z.record(z.string(), z.unknown()),
});
export type AnswersBody = z.infer<typeof answersBodySchema>;
