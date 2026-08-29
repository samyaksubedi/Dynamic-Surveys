import { describe, expect, it } from "vitest";
import { definition, ids } from "../fixtures.js";
import { surveyDefinitionSchema } from "../../src/modules/surveys/surveys.schema.js";

const clone = () =>
  structuredClone(definition) as { questions: Array<Record<string, unknown>> };

describe("surveyDefinitionSchema", () => {
  it("accepts all four supported question types", () => {
    expect(surveyDefinitionSchema.parse(definition).questions).toHaveLength(5);
  });

  it("rejects unsupported question types", () => {
    const value = clone();
    value.questions[0]!.type = "date";
    expect(surveyDefinitionSchema.safeParse(value).success).toBe(false);
  });

  it("rejects duplicate question IDs", () => {
    const value = clone();
    value.questions[1]!.id = value.questions[0]!.id;
    expect(surveyDefinitionSchema.safeParse(value).success).toBe(false);
  });

  it("rejects duplicate option IDs", () => {
    const value = clone();
    const options = value.questions[0]!.options as Array<
      Record<string, unknown>
    >;
    options[1]!.id = options[0]!.id;
    expect(surveyDefinitionSchema.safeParse(value).success).toBe(false);
  });

  it("rejects unknown conditional references", () => {
    const value = clone();
    const condition = value.questions[1]!.condition as Record<string, unknown>;
    condition.sourceQuestionId = "99999999-9999-4999-8999-999999999999";
    expect(surveyDefinitionSchema.safeParse(value).success).toBe(false);
  });

  it("rejects self dependencies", () => {
    const value = clone();
    const condition = value.questions[1]!.condition as Record<string, unknown>;
    condition.sourceQuestionId = ids.conditionalText;
    expect(surveyDefinitionSchema.safeParse(value).success).toBe(false);
  });

  it("rejects reorderings that place a controller after its dependent", () => {
    const value = clone();
    [value.questions[0], value.questions[1]] = [
      value.questions[1]!,
      value.questions[0]!,
    ];
    expect(surveyDefinitionSchema.safeParse(value).success).toBe(false);
  });

  it("rejects circular dependencies", () => {
    const value = clone();
    value.questions[0]!.condition = {
      sourceQuestionId: ids.conditionalText,
      operator: "equals",
      value: "anything",
    };
    expect(surveyDefinitionSchema.safeParse(value).success).toBe(false);
  });

  it("rejects forged conditional option IDs", () => {
    const value = clone();
    const condition = value.questions[1]!.condition as Record<string, unknown>;
    condition.value = "99999999-9999-4999-8999-999999999999";
    expect(surveyDefinitionSchema.safeParse(value).success).toBe(false);
  });

  it("requires includes when multiSelect controls visibility", () => {
    const value = clone();
    value.questions[4]!.condition = {
      sourceQuestionId: ids.multi,
      operator: "equals",
      value: ids.red,
    };
    expect(surveyDefinitionSchema.safeParse(value).success).toBe(false);
  });
});
