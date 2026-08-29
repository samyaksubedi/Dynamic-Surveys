import { describe, expect, it } from "vitest";
import { calculateAnalytics } from "../../src/modules/analytics/analytics.service.js";
import { definition, ids } from "../fixtures.js";

describe("calculateAnalytics", () => {
  it("calculates each question type and includes zero-count options", () => {
    const result = calculateAnalytics(definition, [
      {
        [ids.single]: ids.yes,
        [ids.conditionalText]: "API",
        [ids.multi]: [ids.red, ids.blue],
        [ids.rating]: 5,
        [ids.text]: "First",
      },
      { [ids.single]: ids.no, [ids.multi]: [ids.red], [ids.rating]: 3 },
    ]);
    expect(result.totalSubmittedResponses).toBe(2);
    expect(result.questions[0]).toMatchObject({
      options: [
        { id: ids.yes, count: 1 },
        { id: ids.no, count: 1 },
      ],
    });
    expect(result.questions[1]).toMatchObject({ answers: ["API"] });
    expect(result.questions[2]).toMatchObject({
      options: [
        { id: ids.red, count: 2 },
        { id: ids.blue, count: 1 },
      ],
    });
    expect(result.questions[3]).toMatchObject({ responseCount: 2, average: 4 });
  });

  it("returns null when a rating has no submitted answer", () => {
    const result = calculateAnalytics(definition, [{}]);
    expect(result.questions[3]).toMatchObject({
      responseCount: 0,
      average: null,
    });
  });
});
