import { ApiError } from "../../utils/api-output.util.js";
import type {
  SurveyDefinition,
  SurveyQuestion,
} from "../surveys/surveys.schema.js";

export type Answers = Record<string, unknown>;

const isAnswered = (question: SurveyQuestion, value: unknown) => {
  if (value === undefined) return false;
  if (question.type === "text")
    return typeof value === "string" && value.trim().length > 0;
  if (question.type === "multiSelect")
    return Array.isArray(value) && value.length > 0;
  return true;
};

export const isQuestionVisible = (
  question: SurveyQuestion,
  answers: Answers,
  visibleQuestionIds: Set<string>,
) => {
  const condition = question.condition;
  if (!condition) return true;
  if (!visibleQuestionIds.has(condition.sourceQuestionId)) return false;
  const value = answers[condition.sourceQuestionId];
  if (condition.operator === "includes") {
    return Array.isArray(value) && value.includes(condition.value);
  }
  return value === condition.value;
};

const validateValue = (
  question: SurveyQuestion,
  value: unknown,
): string | undefined => {
  switch (question.type) {
    case "text":
      if (typeof value !== "string") return "must be a string";
      if (value.length > question.maxLength)
        return `must contain at most ${question.maxLength} characters`;
      return;
    case "singleSelect":
      if (typeof value !== "string") return "must be an option ID string";
      if (!question.options.some((option) => option.id === value))
        return "references an invalid option ID";
      return;
    case "multiSelect":
      if (
        !Array.isArray(value) ||
        value.some((entry) => typeof entry !== "string")
      )
        return "must be an array of option ID strings";
      if (new Set(value).size !== value.length)
        return "must not contain duplicate option IDs";
      if (
        value.some(
          (entry) => !question.options.some((option) => option.id === entry),
        )
      )
        return "references an invalid option ID";
      return;
    case "rating":
      if (
        typeof value !== "number" ||
        !Number.isInteger(value) ||
        value < 1 ||
        value > 5
      )
        return "must be an integer from 1 through 5";
      return;
  }
};

export const validateAnswers = ({
  definition,
  answers,
  final,
}: {
  definition: SurveyDefinition;
  answers: unknown;
  final: boolean;
}): Answers => {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    throw new ApiError(400, "Answers must be an object keyed by question ID");
  }
  const answerRecord = answers as Answers;
  const questionsById = new Map(
    definition.questions.map((question) => [question.id, question]),
  );
  const errors: Array<{ questionId: string; message: string }> = [];

  for (const questionId of Object.keys(answerRecord)) {
    if (!questionsById.has(questionId))
      errors.push({ questionId, message: "Unknown question ID" });
  }

  const visibleQuestionIds = new Set<string>();
  for (const question of definition.questions) {
    const visible = isQuestionVisible(
      question,
      answerRecord,
      visibleQuestionIds,
    );
    if (!visible) {
      if (Object.hasOwn(answerRecord, question.id))
        errors.push({
          questionId: question.id,
          message: "Answers for hidden questions are not accepted",
        });
      continue;
    }
    visibleQuestionIds.add(question.id);
    const value = answerRecord[question.id];
    if (value !== undefined) {
      const error = validateValue(question, value);
      if (error) errors.push({ questionId: question.id, message: error });
    }
    if (final && question.required && !isAnswered(question, value)) {
      errors.push({
        questionId: question.id,
        message: "A response is required",
      });
    }
  }

  if (errors.length > 0)
    throw new ApiError(400, "Invalid survey answers", errors);
  return answerRecord;
};
