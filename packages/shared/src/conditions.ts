import { baseConditionMatches } from "./base-conditions";
import { segmentMatches } from "./segments";
import { type EvaluationContext, type RuleCondition, type Segment } from "./types";

export function conditionMatches(
  condition: RuleCondition,
  context: EvaluationContext,
  segments: Segment[] = []
): boolean {
  if (condition.operator === "inSegment") {
    return condition.values.some((segmentKey) => {
      const segment = segments.find((candidate) => candidate.key === segmentKey);
      return segment ? segmentMatches(segment, context) : false;
    });
  }

  return baseConditionMatches(condition, context);
}
