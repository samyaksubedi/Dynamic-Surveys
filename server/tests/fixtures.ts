import { surveyDefinitionSchema } from "../src/modules/surveys/surveys.schema.js";

export const ids = {
  single: "11111111-1111-4111-8111-111111111111",
  yes: "11111111-1111-4111-8111-111111111112",
  no: "11111111-1111-4111-8111-111111111113",
  conditionalText: "22222222-2222-4222-8222-222222222222",
  multi: "33333333-3333-4333-8333-333333333333",
  red: "33333333-3333-4333-8333-333333333334",
  blue: "33333333-3333-4333-8333-333333333335",
  rating: "44444444-4444-4444-8444-444444444444",
  text: "55555555-5555-4555-8555-555555555555",
} as const;

export const definition = surveyDefinitionSchema.parse({
  questions: [
    {
      id: ids.single,
      type: "singleSelect",
      label: "Do you use Node.js?",
      required: true,
      options: [
        { id: ids.yes, label: "Yes" },
        { id: ids.no, label: "No" },
      ],
    },
    {
      id: ids.conditionalText,
      type: "text",
      label: "What do you build?",
      required: true,
      maxLength: 100,
      condition: {
        sourceQuestionId: ids.single,
        operator: "equals",
        value: ids.yes,
      },
    },
    {
      id: ids.multi,
      type: "multiSelect",
      label: "Favorite colors",
      required: true,
      options: [
        { id: ids.red, label: "Red" },
        { id: ids.blue, label: "Blue" },
      ],
    },
    {
      id: ids.rating,
      type: "rating",
      label: "Rating",
      required: true,
      min: 1,
      max: 5,
    },
    {
      id: ids.text,
      type: "text",
      label: "Notes",
      required: false,
      maxLength: 200,
    },
  ],
});
