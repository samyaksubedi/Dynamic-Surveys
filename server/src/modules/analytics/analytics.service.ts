import type { SurveyDefinition } from "../surveys/surveys.schema.js";
import type { Answers } from "../responses/answers.schema.js";

export const calculateAnalytics = (
  definition: SurveyDefinition,
  responses: Answers[],
) => ({
  totalSubmittedResponses: responses.length,
  questions: definition.questions.map((question) => {
    const base = {
      id: question.id,
      type: question.type,
      label: question.label,
    };
    switch (question.type) {
      case "text":
        return {
          ...base,
          answers: responses
            .map((answers) => answers[question.id])
            .filter(
              (answer): answer is string =>
                typeof answer === "string" && answer.length > 0,
            ),
        };
      case "singleSelect":
        return {
          ...base,
          options: question.options.map((option) => ({
            id: option.id,
            label: option.label,
            count: responses.filter(
              (answers) => answers[question.id] === option.id,
            ).length,
          })),
        };
      case "multiSelect":
        return {
          ...base,
          options: question.options.map((option) => ({
            id: option.id,
            label: option.label,
            count: responses.filter((answers) => {
              const answer = answers[question.id];
              return Array.isArray(answer) && answer.includes(option.id);
            }).length,
          })),
        };
      case "rating": {
        const ratings = responses
          .map((answers) => answers[question.id])
          .filter((answer): answer is number => typeof answer === "number");
        return {
          ...base,
          responseCount: ratings.length,
          average:
            ratings.length === 0
              ? null
              : ratings.reduce((sum, rating) => sum + rating, 0) /
                ratings.length,
        };
      }
    }
  }),
});
