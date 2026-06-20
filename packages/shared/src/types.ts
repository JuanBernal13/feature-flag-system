export const ENVIRONMENTS = ["dev", "staging", "production"] as const;

export type Environment = (typeof ENVIRONMENTS)[number];

export type RuleOperator =
  | "equals"
  | "notEquals"
  | "in"
  | "notIn"
  | "contains"
  | "startsWith"
  | "endsWith"
  | "inSegment";

export type AttributeValue = string | number | boolean | string[] | undefined | null;

export interface EvaluationContext {
  userId: string;
  environment?: Environment | undefined;
  country?: string | undefined;
  email?: string | undefined;
  groups?: string[] | undefined;
  attributes?: Record<string, AttributeValue> | undefined;
}

export interface RuleCondition {
  attribute: string;
  operator: RuleOperator;
  values: string[];
}

export interface ServeConfig {
  enabled: boolean;
  rolloutPercentage?: number | undefined;
  variant?: string | undefined;
}

export interface TargetingRule {
  id: string;
  name: string;
  priority: number;
  conditions: RuleCondition[];
  serve: ServeConfig;
}

export interface FeatureFlag {
  id: string;
  projectKey: string;
  key: string;
  name: string;
  description?: string | undefined;
  environment: Environment;
  enabled: boolean;
  rolloutPercentage: number;
  rules: TargetingRule[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Segment {
  id: string;
  projectKey: string;
  key: string;
  name: string;
  environment: Environment;
  includedUserIds: string[];
  excludedUserIds: string[];
  rules: RuleCondition[][];
  createdAt: string;
  updatedAt: string;
}

export type EvaluationReason =
  | "FLAG_NOT_FOUND"
  | "FLAG_OFF"
  | "RULE_MATCH"
  | "ROLLOUT_MATCH"
  | "FALLTHROUGH"
  | "ERROR";

export interface FlagEvaluation {
  flagKey: string;
  enabled: boolean;
  variant?: string | undefined;
  reason: EvaluationReason;
  ruleId?: string | undefined;
  bucket?: number | undefined;
}

export interface ConfigPayload {
  projectKey: string;
  environment: Environment;
  version: string;
  generatedAt: string;
  flags: FeatureFlag[];
  segments: Segment[];
}

export interface ConfigChangedEvent {
  type: "config_changed";
  projectKey: string;
  environment: Environment;
  version: string;
  flagKey?: string | undefined;
  changedAt: string;
}
