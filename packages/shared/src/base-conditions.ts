import { readAttributeValues, normalizeExpectedValues } from "./attributes";
import { type EvaluationContext, type RuleCondition } from "./types";

export function baseConditionMatches(
  condition: RuleCondition,
  context: EvaluationContext
): boolean {
  const actualValues = readAttributeValues(condition.attribute, context);
  const expectedValues = normalizeExpectedValues(condition.attribute, condition.values);

  if (actualValues.length === 0) {
    return condition.operator === "notEquals" || condition.operator === "notIn";
  }

  switch (condition.operator) {
    case "equals":
      return actualValues.some((actual) => expectedValues.includes(actual));
    case "notEquals":
      return actualValues.every((actual) => !expectedValues.includes(actual));
    case "in":
      return actualValues.some((actual) => expectedValues.includes(actual));
    case "notIn":
      return actualValues.every((actual) => !expectedValues.includes(actual));
    case "contains":
      return actualValues.some((actual) =>
        expectedValues.some((expected) => actual.includes(expected))
      );
    case "startsWith":
      return actualValues.some((actual) =>
        expectedValues.some((expected) => actual.startsWith(expected))
      );
    case "endsWith":
      return actualValues.some((actual) =>
        expectedValues.some((expected) => actual.endsWith(expected))
      );
    default:
      return false;
  }
}
