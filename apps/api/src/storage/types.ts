import {
  type ConfigPayload,
  type Environment,
  type FeatureFlag,
  type Segment,
  type TargetingRule
} from "@flagship/shared";

export interface AuditEntry {
  id: string;
  projectKey: string;
  environment: Environment;
  action: string;
  actor: string;
  resourceType: "flag" | "segment";
  resourceId: string;
  before?: unknown | undefined;
  after?: unknown | undefined;
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

export interface CreateFlagInput {
  projectKey: string;
  environment: Environment;
  key: string;
  name: string;
  description?: string | undefined;
  enabled?: boolean | undefined;
  rolloutPercentage?: number | undefined;
  tags?: string[] | undefined;
}

export interface UpdateFlagInput {
  name?: string | undefined;
  description?: string | undefined;
  enabled?: boolean | undefined;
  rolloutPercentage?: number | undefined;
  tags?: string[] | undefined;
  rules?: TargetingRule[] | undefined;
}

export interface UpdateRuleInput {
  name?: string | undefined;
  priority?: number | undefined;
  conditions?: TargetingRule["conditions"] | undefined;
  serve?: Partial<TargetingRule["serve"]> | undefined;
}

export interface CreateSegmentInput {
  projectKey: string;
  environment: Environment;
  key: string;
  name: string;
  includedUserIds?: string[] | undefined;
  excludedUserIds?: string[] | undefined;
}

export interface FlagStore {
  listFlags(projectKey: string, environment: Environment): Promise<FeatureFlag[]>;
  getFlagById(id: string): Promise<FeatureFlag | undefined>;
  getFlagByKey(
    projectKey: string,
    environment: Environment,
    key: string
  ): Promise<FeatureFlag | undefined>;
  createFlag(input: CreateFlagInput): Promise<FeatureFlag>;
  updateFlag(id: string, input: UpdateFlagInput): Promise<FeatureFlag | undefined>;
  deleteFlag(id: string): Promise<boolean>;
  createRule(flagId: string, rule: Omit<TargetingRule, "id" | "priority">): Promise<FeatureFlag | undefined>;
  updateRule(
    flagId: string,
    ruleId: string,
    input: UpdateRuleInput
  ): Promise<FeatureFlag | undefined>;
  deleteRule(flagId: string, ruleId: string): Promise<FeatureFlag | undefined>;
  listSegments(projectKey: string, environment: Environment): Promise<Segment[]>;
  createSegment(input: CreateSegmentInput): Promise<Segment>;
  getConfig(projectKey: string, environment: Environment): Promise<ConfigPayload>;
  appendAudit(entry: Omit<AuditEntry, "id" | "createdAt">): Promise<AuditEntry>;
  listAudit(projectKey: string, environment?: Environment): Promise<AuditEntry[]>;
  recordEvaluation(input: {
    projectKey: string;
    environment: Environment;
    flagKey: string;
    userId: string;
    enabled: boolean;
    reason: string;
  }): Promise<void>;
  getMetrics(projectKey: string, environment: Environment): Promise<MetricSummary>;
}
