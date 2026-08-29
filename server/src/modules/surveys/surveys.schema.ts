import { z } from "zod";

const idSchema = z.uuid();
const conditionSchema = z.discriminatedUnion("operator", [
  z.object({
    sourceQuestionId: idSchema,
    operator: z.literal("equals"),
    value: z.union([z.string().max(5000), z.number().int().min(1).max(5)]),
  }),
  z.object({
    sourceQuestionId: idSchema,
    operator: z.literal("includes"),
    value: idSchema,
  }),
]);

const questionBase = {
  id: idSchema,
  label: z.string().trim().min(1).max(500),
  required: z.boolean(),
  condition: conditionSchema.optional(),
};

const optionSchema = z.object({
  id: idSchema,
  label: z.string().trim().min(1).max(200),
});

const textQuestionSchema = z.object({
  ...questionBase,
  type: z.literal("text"),
  maxLength: z.number().int().min(1).max(5000).default(2000),
});

const selectQuestionFields = {
  ...questionBase,
  options: z.array(optionSchema).min(2).max(50),
};

const singleSelectQuestionSchema = z.object({
  ...selectQuestionFields,
  type: z.literal("singleSelect"),
});

const multiSelectQuestionSchema = z.object({
  ...selectQuestionFields,
  type: z.literal("multiSelect"),
});

const ratingQuestionSchema = z.object({
  ...questionBase,
  type: z.literal("rating"),
  min: z.literal(1).default(1),
  max: z.literal(5).default(5),
});

export const questionSchema = z.discriminatedUnion("type", [
  textQuestionSchema,
  singleSelectQuestionSchema,
  multiSelectQuestionSchema,
  ratingQuestionSchema,
]);

export const surveyDefinitionSchema = z
  .object({ questions: z.array(questionSchema).max(100) })
  .superRefine((definition, context) => {
    const questionsById = new Map(
      definition.questions.map((question, index) => [
        question.id,
        { question, index },
      ]),
    );
    if (questionsById.size !== definition.questions.length) {
      context.addIssue({
        code: "custom",
        path: ["questions"],
        message: "Question IDs must be unique",
      });
    }

    definition.questions.forEach((question, index) => {
      if ("options" in question) {
        const optionIds = new Set(question.options.map((option) => option.id));
        if (optionIds.size !== question.options.length) {
          context.addIssue({
            code: "custom",
            path: ["questions", index, "options"],
            message: "Option IDs must be unique within a question",
          });
        }
      }
      const condition = question.condition;
      if (!condition) return;
      const source = questionsById.get(condition.sourceQuestionId);
      if (!source) {
        context.addIssue({
          code: "custom",
          path: ["questions", index, "condition"],
          message: "Condition references an unknown question",
        });
        return;
      }
      if (source.question.id === question.id) {
        context.addIssue({
          code: "custom",
          path: ["questions", index, "condition"],
          message: "A question cannot depend on itself",
        });
      }
      if (source.index >= index) {
        context.addIssue({
          code: "custom",
          path: ["questions", index, "condition"],
          message:
            "A controlling question must appear before its dependent question",
        });
      }

      if (condition.operator === "includes") {
        if (source.question.type !== "multiSelect") {
          context.addIssue({
            code: "custom",
            path: ["questions", index, "condition"],
            message:
              "The includes operator requires a multiSelect controlling question",
          });
        } else if (
          !source.question.options.some(
            (option) => option.id === condition.value,
          )
        ) {
          context.addIssue({
            code: "custom",
            path: ["questions", index, "condition", "value"],
            message: "Condition references an unknown option",
          });
        }
        return;
      }

      if (source.question.type === "multiSelect") {
        context.addIssue({
          code: "custom",
          path: ["questions", index, "condition"],
          message: "A multiSelect controlling question must use includes",
        });
      } else if (source.question.type === "singleSelect") {
        if (
          typeof condition.value !== "string" ||
          !source.question.options.some(
            (option) => option.id === condition.value,
          )
        ) {
          context.addIssue({
            code: "custom",
            path: ["questions", index, "condition", "value"],
            message: "Condition must reference a valid option ID",
          });
        }
      } else if (
        source.question.type === "text" &&
        typeof condition.value !== "string"
      ) {
        context.addIssue({
          code: "custom",
          path: ["questions", index, "condition", "value"],
          message: "Text conditions require a string value",
        });
      } else if (
        source.question.type === "rating" &&
        (typeof condition.value !== "number" ||
          !Number.isInteger(condition.value))
      ) {
        context.addIssue({
          code: "custom",
          path: ["questions", index, "condition", "value"],
          message: "Rating conditions require an integer value",
        });
      }
    });

    const visiting = new Set<string>();
    const visited = new Set<string>();
    const visit = (questionId: string): boolean => {
      if (visiting.has(questionId)) return true;
      if (visited.has(questionId)) return false;
      visiting.add(questionId);
      const dependency =
        questionsById.get(questionId)?.question.condition?.sourceQuestionId;
      if (dependency && visit(dependency)) return true;
      visiting.delete(questionId);
      visited.add(questionId);
      return false;
    };
    for (const question of definition.questions) {
      if (visit(question.id)) {
        context.addIssue({
          code: "custom",
          path: ["questions"],
          message: "Circular question dependencies are not allowed",
        });
        break;
      }
    }
  });

export const createSurveySchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).default(""),
  schema: surveyDefinitionSchema.default({ questions: [] }),
  acceptingResponses: z.boolean().default(true),
});

export const surveyIdParamsSchema = z.object({ surveyId: z.uuid() });

export const updateSurveyMetadataSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).optional(),
  })
  .refine(
    (data) => data.title !== undefined || data.description !== undefined,
    {
      message: "At least one metadata field is required",
    },
  );

export const updateAcceptingResponsesSchema = z.object({
  acceptingResponses: z.boolean(),
});

export type SurveyDefinition = z.infer<typeof surveyDefinitionSchema>;
export type SurveyQuestion = z.infer<typeof questionSchema>;
export type CreateSurveyInput = z.infer<typeof createSurveySchema>;
export type UpdateSurveyMetadataInput = z.infer<
  typeof updateSurveyMetadataSchema
>;
