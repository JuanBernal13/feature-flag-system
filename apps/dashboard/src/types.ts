export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
export const PROJECT_KEY = "demo_project_key";

export type Environment = "dev" | "staging" | "production";

export type RuleOperator =
  | "equals"
  | "notEquals"
  | "in"
  | "notIn"
  | "contains"
  | "startsWith"
  | "endsWith"
  | "inSegment";

export interface RuleConditionDto {
  attribute: string;
  operator: RuleOperator;
  values: string[];
}

export interface TargetingRuleDto {
  id: string;
  name: string;
  priority: number;
  conditions: RuleConditionDto[];
  serve: {
    enabled: boolean;
    rolloutPercentage?: number | undefined;
    variant?: string | undefined;
  };
}

export interface FeatureFlagDto {
  id: string;
  projectKey: string;
  key: string;
  name: string;
  description?: string | undefined;
  environment: Environment;
  enabled: boolean;
  rolloutPercentage: number;
  rules: TargetingRuleDto[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SegmentDto {
  id: string;
  projectKey: string;
  key: string;
  name: string;
  environment: Environment;
  includedUserIds: string[];
  excludedUserIds: string[];
  rules: RuleConditionDto[][];
  createdAt: string;
  updatedAt: string;
}

export interface FlagEvaluationDto {
  flagKey: string;
  enabled: boolean;
  reason:
    | "FLAG_NOT_FOUND"
    | "FLAG_OFF"
    | "RULE_MATCH"
    | "ROLLOUT_MATCH"
    | "FALLTHROUGH"
    | "ERROR";
  variant?: string | undefined;
  ruleId?: string | undefined;
  bucket?: number | undefined;
}

export interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  resourceType: string;
  resourceId: string;
  createdAt: string;
}

export interface MetricSummary {
  total: number;
  enabled: number;
  disabled: number;
  byFlag: Array<{
    flagKey: string;
    total: number;
    enabled: number;
    disabled: number;
  }>;
}

export interface NewFlagDraft {
  key: string;
  name: string;
  description: string;
  rolloutPercentage: number;
}

export interface NewRuleDraft {
  country: string;
  percentage: number;
}

export interface SimulatorDraft {
  userId: string;
  country: string;
  groups: string;
  flagKey: string;
}

export interface DashboardData {
  flags: FeatureFlagDto[];
  segments: SegmentDto[];
  audit: AuditEntry[];
  metrics: MetricSummary;
}
