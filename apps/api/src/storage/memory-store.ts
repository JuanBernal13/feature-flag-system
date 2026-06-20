import { randomUUID } from "node:crypto";
import {
  type ConfigPayload,
  type Environment,
  type FeatureFlag,
  type Segment,
  type TargetingRule,
  clampPercentage,
  stableConfigVersion
} from "@flagship/shared";
import { createSeedFlags, createSeedSegments } from "../sample-data";
import {
  type AuditEntry,
  type CreateFlagInput,
  type CreateSegmentInput,
  type FlagStore,
  type MetricSummary,
  type UpdateFlagInput,
  type UpdateRuleInput
} from "./types";

export class MemoryStore implements FlagStore {
  private readonly flags = new Map<string, FeatureFlag>();
  private readonly segments = new Map<string, Segment>();
  private readonly audit: AuditEntry[] = [];
  private readonly metrics = new Map<string, { total: number; enabled: number; disabled: number }>();

  constructor() {
    for (const flag of createSeedFlags()) {
      this.flags.set(flag.id, flag);
    }

    for (const segment of createSeedSegments()) {
      this.segments.set(segment.id, segment);
    }
  }

  async listFlags(projectKey: string, environment: Environment): Promise<FeatureFlag[]> {
    return [...this.flags.values()]
      .filter((flag) => flag.projectKey === projectKey && flag.environment === environment)
      .sort((left, right) => left.key.localeCompare(right.key));
  }

  async getFlagById(id: string): Promise<FeatureFlag | undefined> {
    return this.flags.get(id);
  }

  async getFlagByKey(
    projectKey: string,
    environment: Environment,
    key: string
  ): Promise<FeatureFlag | undefined> {
    return [...this.flags.values()].find(
      (flag) =>
        flag.projectKey === projectKey && flag.environment === environment && flag.key === key
    );
  }

  async createFlag(input: CreateFlagInput): Promise<FeatureFlag> {
    const timestamp = new Date().toISOString();
    const flag: FeatureFlag = {
      id: randomUUID(),
      projectKey: input.projectKey,
      environment: input.environment,
      key: input.key,
      name: input.name,
      description: input.description,
      enabled: input.enabled ?? false,
      rolloutPercentage: clampPercentage(input.rolloutPercentage ?? 0),
      rules: [],
      tags: input.tags ?? [],
      createdAt: timestamp,
      updatedAt: timestamp
    };

    this.flags.set(flag.id, flag);
    return flag;
  }

  async updateFlag(id: string, input: UpdateFlagInput): Promise<FeatureFlag | undefined> {
    const current = this.flags.get(id);

    if (!current) {
      return undefined;
    }

    const next: FeatureFlag = {
      ...current,
      name: input.name ?? current.name,
      description: input.description === undefined ? current.description : input.description,
      enabled: input.enabled ?? current.enabled,
      rolloutPercentage:
        input.rolloutPercentage === undefined
          ? current.rolloutPercentage
          : clampPercentage(input.rolloutPercentage),
      rules: input.rules ?? current.rules,
      tags: input.tags ?? current.tags,
      updatedAt: new Date().toISOString()
    };

    this.flags.set(id, next);
    return next;
  }

  async deleteFlag(id: string): Promise<boolean> {
    return this.flags.delete(id);
  }

  async createRule(
    flagId: string,
    rule: Omit<TargetingRule, "id" | "priority">
  ): Promise<FeatureFlag | undefined> {
    const flag = this.flags.get(flagId);

    if (!flag) {
      return undefined;
    }

    const nextRule: TargetingRule = {
      ...rule,
      id: randomUUID(),
      priority: flag.rules.length + 1
    };

    return this.updateFlag(flagId, { rules: [...flag.rules, nextRule] });
  }

  async updateRule(
    flagId: string,
    ruleId: string,
    input: UpdateRuleInput
  ): Promise<FeatureFlag | undefined> {
    const flag = this.flags.get(flagId);

    if (!flag) {
      return undefined;
    }

    return this.updateFlag(flagId, {
      rules: flag.rules.map((rule) =>
        rule.id === ruleId
          ? {
              ...rule,
              name: input.name ?? rule.name,
              priority: input.priority ?? rule.priority,
              conditions: input.conditions ?? rule.conditions,
              serve: { ...rule.serve, ...input.serve }
            }
          : rule
      )
    });
  }

  async deleteRule(flagId: string, ruleId: string): Promise<FeatureFlag | undefined> {
    const flag = this.flags.get(flagId);

    if (!flag) {
      return undefined;
    }

    return this.updateFlag(flagId, {
      rules: flag.rules
        .filter((rule) => rule.id !== ruleId)
        .map((rule, index) => ({ ...rule, priority: index + 1 }))
    });
  }

  async listSegments(projectKey: string, environment: Environment): Promise<Segment[]> {
    return [...this.segments.values()].filter(
      (segment) => segment.projectKey === projectKey && segment.environment === environment
    );
  }

  async createSegment(input: CreateSegmentInput): Promise<Segment> {
    const timestamp = new Date().toISOString();
    const segment: Segment = {
      id: randomUUID(),
      projectKey: input.projectKey,
      environment: input.environment,
      key: input.key,
      name: input.name,
      includedUserIds: input.includedUserIds ?? [],
      excludedUserIds: input.excludedUserIds ?? [],
      rules: [],
      createdAt: timestamp,
      updatedAt: timestamp
    };

    this.segments.set(segment.id, segment);
    return segment;
  }

  async getConfig(projectKey: string, environment: Environment): Promise<ConfigPayload> {
    const flags = await this.listFlags(projectKey, environment);
    const segments = await this.listSegments(projectKey, environment);

    return {
      projectKey,
      environment,
      flags,
      segments,
      version: stableConfigVersion(flags, segments),
      generatedAt: new Date().toISOString()
    };
  }

  async appendAudit(entry: Omit<AuditEntry, "id" | "createdAt">): Promise<AuditEntry> {
    const auditEntry: AuditEntry = {
      ...entry,
      id: randomUUID(),
      createdAt: new Date().toISOString()
    };

    this.audit.unshift(auditEntry);
    return auditEntry;
  }

  async listAudit(projectKey: string, environment?: Environment): Promise<AuditEntry[]> {
    return this.audit
      .filter(
        (entry) =>
          entry.projectKey === projectKey &&
          (environment === undefined || entry.environment === environment)
      )
      .slice(0, 100);
  }

  async recordEvaluation(input: {
    projectKey: string;
    environment: Environment;
    flagKey: string;
    userId: string;
    enabled: boolean;
    reason: string;
  }): Promise<void> {
    const key = `${input.projectKey}:${input.environment}:${input.flagKey}`;
    const current = this.metrics.get(key) ?? { total: 0, enabled: 0, disabled: 0 };

    current.total += 1;
    current.enabled += input.enabled ? 1 : 0;
    current.disabled += input.enabled ? 0 : 1;
    this.metrics.set(key, current);
  }

  async getMetrics(projectKey: string, environment: Environment): Promise<MetricSummary> {
    const byFlag = [...this.metrics.entries()]
      .filter(([key]) => key.startsWith(`${projectKey}:${environment}:`))
      .map(([key, value]) => ({
        flagKey: key.split(":").at(-1) ?? "unknown",
        ...value
      }));

    return {
      total: byFlag.reduce((sum, flag) => sum + flag.total, 0),
      enabled: byFlag.reduce((sum, flag) => sum + flag.enabled, 0),
      disabled: byFlag.reduce((sum, flag) => sum + flag.disabled, 0),
      byFlag
    };
  }
}
