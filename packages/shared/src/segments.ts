import { baseConditionMatches } from "./base-conditions";
import { type EvaluationContext, type Segment } from "./types";

export function segmentMatches(segment: Segment, context: EvaluationContext): boolean {
  if (segment.excludedUserIds.includes(context.userId)) {
    return false;
  }

  if (segment.includedUserIds.includes(context.userId)) {
    return true;
  }

  return segment.rules.some((ruleGroup) =>
    ruleGroup.every((condition) => baseConditionMatches(condition, context))
  );
}
