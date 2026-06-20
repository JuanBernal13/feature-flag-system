import { randomUUID } from "node:crypto";
import pg from "pg";
import {
  type ConfigPayload,
  type Environment,
  type FeatureFlag,
  type Segment,
  type TargetingRule,
  clampPercentage,
  stableConfigVersion
} from "@flagship/shared";
import { rowToAudit, rowToFlag, rowToSegment } from "./postgres/mappers";
import { runMigrations } from "./postgres/migrations";
import { seedPostgresIfEmpty } from "./postgres/seed";
import {
  type AuditEntry,
  type CreateFlagInput,
  type CreateSegmentInput,
  type FlagStore,
  type MetricSummary,
  type UpdateFlagInput,
  type UpdateRuleInput
} from "./types";

const { Pool } = pg;

export class PostgresStore implements FlagStore {
  private readonly pool: pg.Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async init(): Promise<void> {
    await runMigrations(this.pool);
    await seedPostgresIfEmpty(this.pool);
  }

  async listFlags(projectKey: string, environment: Environment): Promise<FeatureFlag[]> {
    const result = await this.pool.query(
      `
        select *
        from feature_flags
        where project_key = $1 and environment = $2
        order by key asc
      `,
      [projectKey, environment]
    );

    return result.rows.map(rowToFlag);
  }

  async getFlagById(id: string): Promise<FeatureFlag | undefined> {
    const result = await this.pool.query("select * from feature_flags where id = $1", [id]);
    return result.rows[0] ? rowToFlag(result.rows[0]) : undefined;
  }

  async getFlagByKey(
    projectKey: string,
    environment: Environment,
    key: string
  ): Promise<FeatureFlag | undefined> {
    const result = await this.pool.query(
      `
        select *
        from feature_flags
        where project_key = $1 and environment = $2 and key = $3
      `,
      [projectKey, environment, key]
    );

    return result.rows[0] ? rowToFlag(result.rows[0]) : undefined;
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

    await this.pool.query(
      `
        insert into feature_flags (
          id, project_key, environment, key, name, description,
          enabled, rollout_percentage, rules, tags, created_at, updated_at
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, $12)
      `,
      [
        flag.id,
        flag.projectKey,
        flag.environment,
        flag.key,
        flag.name,
        flag.description ?? null,
        flag.enabled,
        flag.rolloutPercentage,
        JSON.stringify(flag.rules),
        flag.tags,
        flag.createdAt,
        flag.updatedAt
      ]
    );

    return flag;
  }

  async updateFlag(id: string, input: UpdateFlagInput): Promise<FeatureFlag | undefined> {
    const current = await this.getFlagById(id);

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

    const result = await this.pool.query(
      `
        update feature_flags
        set
          name = $2,
          description = $3,
          enabled = $4,
          rollout_percentage = $5,
          rules = $6::jsonb,
          tags = $7,
          updated_at = $8
        where id = $1
        returning *
      `,
      [
        id,
        next.name,
        next.description ?? null,
        next.enabled,
        next.rolloutPercentage,
        JSON.stringify(next.rules),
        next.tags,
        next.updatedAt
      ]
    );

    return result.rows[0] ? rowToFlag(result.rows[0]) : undefined;
  }

  async deleteFlag(id: string): Promise<boolean> {
    const result = await this.pool.query("delete from feature_flags where id = $1", [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async createRule(
    flagId: string,
    rule: Omit<TargetingRule, "id" | "priority">
  ): Promise<FeatureFlag | undefined> {
    const flag = await this.getFlagById(flagId);

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
    const flag = await this.getFlagById(flagId);

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
    const flag = await this.getFlagById(flagId);

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
    const result = await this.pool.query(
      `
        select *
        from segments
        where project_key = $1 and environment = $2
        order by key asc
      `,
      [projectKey, environment]
    );

    return result.rows.map(rowToSegment);
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

    await this.pool.query(
      `
        insert into segments (
          id, project_key, environment, key, name, included_user_ids,
          excluded_user_ids, rules, created_at, updated_at
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10)
      `,
      [
        segment.id,
        segment.projectKey,
        segment.environment,
        segment.key,
        segment.name,
        segment.includedUserIds,
        segment.excludedUserIds,
        JSON.stringify(segment.rules),
        segment.createdAt,
        segment.updatedAt
      ]
    );

    return segment;
  }

  async getConfig(projectKey: string, environment: Environment): Promise<ConfigPayload> {
    const [flags, segments] = await Promise.all([
      this.listFlags(projectKey, environment),
      this.listSegments(projectKey, environment)
    ]);

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

    await this.pool.query(
      `
        insert into audit_log (
          id, project_key, environment, action, actor, resource_type,
          resource_id, before_value, after_value, created_at
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10)
      `,
      [
        auditEntry.id,
        auditEntry.projectKey,
        auditEntry.environment,
        auditEntry.action,
        auditEntry.actor,
        auditEntry.resourceType,
        auditEntry.resourceId,
        JSON.stringify(auditEntry.before ?? null),
        JSON.stringify(auditEntry.after ?? null),
        auditEntry.createdAt
      ]
    );

    return auditEntry;
  }

  async listAudit(projectKey: string, environment?: Environment): Promise<AuditEntry[]> {
    const result = await this.pool.query(
      `
        select *
        from audit_log
        where project_key = $1 and ($2::text is null or environment = $2)
        order by created_at desc
        limit 100
      `,
      [projectKey, environment ?? null]
    );

    return result.rows.map(rowToAudit);
  }

  async recordEvaluation(input: {
    projectKey: string;
    environment: Environment;
    flagKey: string;
    userId: string;
    enabled: boolean;
    reason: string;
  }): Promise<void> {
    await this.pool.query(
      `
        insert into flag_evaluations (
          id, project_key, environment, flag_key, user_id,
          enabled, reason, created_at
        )
        values ($1, $2, $3, $4, $5, $6, $7, now())
      `,
      [
        randomUUID(),
        input.projectKey,
        input.environment,
        input.flagKey,
        input.userId,
        input.enabled,
        input.reason
      ]
    );
  }

  async getMetrics(projectKey: string, environment: Environment): Promise<MetricSummary> {
    const result = await this.pool.query(
      `
        select
          flag_key,
          count(*)::int as total,
          count(*) filter (where enabled)::int as enabled,
          count(*) filter (where not enabled)::int as disabled
        from flag_evaluations
        where project_key = $1 and environment = $2
        group by flag_key
        order by total desc
      `,
      [projectKey, environment]
    );

    const byFlag = result.rows.map((row) => ({
      flagKey: row.flag_key as string,
      total: Number(row.total),
      enabled: Number(row.enabled),
      disabled: Number(row.disabled)
    }));

    return {
      total: byFlag.reduce((sum, flag) => sum + flag.total, 0),
      enabled: byFlag.reduce((sum, flag) => sum + flag.enabled, 0),
      disabled: byFlag.reduce((sum, flag) => sum + flag.disabled, 0),
      byFlag
    };
  }

}
