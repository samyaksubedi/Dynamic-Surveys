import { describe, expect, it } from "vitest";
import { ApiError } from "../../src/utils/api-output.util.js";
import { validateAnswers } from "../../src/modules/responses/answers.schema.js";
import { definition, ids } from "../fixtures.js";

const base = {
  [ids.single]: ids.yes,
  [ids.conditionalText]: "APIs",
  [ids.multi]: [ids.red],
  [ids.rating]: 5,
};

const invalid = (answers: unknown, final = true) => {
  try {
    validateAnswers({ definition, answers, final });
    return undefined;
  } catch (error) {
    return error;
  }
};

describe("validateAnswers", () => {
  it("allows missing required answers in a draft", () => {
    expect(validateAnswers({ definition, answers: {}, final: false })).toEqual(
      {},
    );
  });

  it("requires every visible required answer on submission", () => {
    expect(invalid({}, true)).toBeInstanceOf(ApiError);
  });

  it("does not require a hidden conditional question", () => {
    const answers = {
      [ids.single]: ids.no,
      [ids.multi]: [ids.red],
      [ids.rating]: 5,
    };
    expect(validateAnswers({ definition, answers, final: true })).toEqual(
      answers,
    );
  });

  it("rejects an answer for a hidden question", () => {
    expect(invalid({ ...base, [ids.single]: ids.no })).toBeInstanceOf(ApiError);
  });

  it("rejects unknown question IDs", () => {
    expect(
      invalid({ ...base, "99999999-9999-4999-8999-999999999999": "forged" }),
    ).toBeInstanceOf(ApiError);
  });

  it("rejects invalid single-select options", () => {
    expect(invalid({ ...base, [ids.single]: ids.red })).toBeInstanceOf(
      ApiError,
    );
  });

  it("rejects invalid and duplicate multi-select options", () => {
    expect(
      invalid({ ...base, [ids.multi]: [ids.red, ids.red] }),
    ).toBeInstanceOf(ApiError);
    expect(invalid({ ...base, [ids.multi]: [ids.yes] })).toBeInstanceOf(
      ApiError,
    );
  });

  it("rejects incorrect answer types", () => {
    expect(invalid({ ...base, [ids.text]: 42 })).toBeInstanceOf(ApiError);
    expect(invalid({ ...base, [ids.multi]: ids.red })).toBeInstanceOf(ApiError);
  });

  it("enforces integer ratings from 1 through 5", () => {
    for (const rating of [0, 6, 2.5]) {
      expect(invalid({ ...base, [ids.rating]: rating })).toBeInstanceOf(
        ApiError,
      );
    }
    expect(
      validateAnswers({
        definition,
        answers: { ...base, [ids.rating]: 1 },
        final: true,
      }),
    ).toBeTruthy();
  });

  it("enforces configured text maximum length even in drafts", () => {
    expect(invalid({ [ids.text]: "x".repeat(201) }, false)).toBeInstanceOf(
      ApiError,
    );
  });
});
