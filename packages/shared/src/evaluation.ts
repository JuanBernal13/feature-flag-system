import { conditionMatches } from "./conditions";
import { percentageBucket } from "./hashing";
import { clampPercentage } from "./percentage";
import {
  type EvaluationContext,
  type FeatureFlag,
  type FlagEvaluation,
  type Segment
} from "./types";

export function evaluateFlag(
  flag: FeatureFlag | undefined,
  context: EvaluationContext,
  segments: Segment[] = []
): FlagEvaluation {
  if (!flag) {
    return { flagKey: "unknown", enabled: false, reason: "FLAG_NOT_FOUND" };
  }

  if (!flag.enabled) {
    return { flagKey: flag.key, enabled: false, reason: "FLAG_OFF" };
  }

  const sortedRules = [...flag.rules].sort((left, right) => left.priority - right.priority);

  for (const rule of sortedRules) {
    if (!rule.conditions.every((condition) => conditionMatches(condition, context, segments))) {
      continue;
    }

    const rollout = clampPercentage(rule.serve.rolloutPercentage ?? 100);
    const bucket = percentageBucket(flag.key, rule.id, context.userId);
    const enabled = rule.serve.enabled && bucket < rollout;
    const result: FlagEvaluation = {
      flagKey: flag.key,
      enabled,
      reason: "RULE_MATCH",
      ruleId: rule.id,
      bucket
    };

    if (enabled && rule.serve.variant) {
      result.variant = rule.serve.variant;
    }

    return result;
  }

  const rollout = clampPercentage(flag.rolloutPercentage);
  const bucket = percentageBucket(flag.key, "fallthrough", context.userId);
  const enabled = bucket < rollout;

  return {
    flagKey: flag.key,
    enabled,
    reason: rollout > 0 ? "ROLLOUT_MATCH" : "FALLTHROUGH",
    bucket
  };
}

export function evaluateAll(
  flags: FeatureFlag[],
  context: EvaluationContext,
  segments: Segment[] = []
): Record<string, FlagEvaluation> {
  return Object.fromEntries(
    flags.map((flag) => [flag.key, evaluateFlag(flag, context, segments)])
  );
}
