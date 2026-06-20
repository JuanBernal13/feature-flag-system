import { type Environment, type FeatureFlag, type Segment, type TargetingRule } from "@flagship/shared";
import { type AuditEntry } from "../types";

export function rowToFlag(row: Record<string, unknown>): FeatureFlag {
  return {
    id: String(row.id),
    projectKey: String(row.project_key),
    key: String(row.key),
    name: String(row.name),
    description: row.description ? String(row.description) : undefined,
    environment: row.environment as Environment,
    enabled: Boolean(row.enabled),
    rolloutPercentage: Number(row.rollout_percentage),
    rules: parseJsonArray<TargetingRule>(row.rules),
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString()
  };
}

export function rowToSegment(row: Record<string, unknown>): Segment {
  return {
    id: String(row.id),
    projectKey: String(row.project_key),
    key: String(row.key),
    name: String(row.name),
    environment: row.environment as Environment,
    includedUserIds: Array.isArray(row.included_user_ids) ? (row.included_user_ids as string[]) : [],
    excludedUserIds: Array.isArray(row.excluded_user_ids) ? (row.excluded_user_ids as string[]) : [],
    rules: parseJsonArray(row.rules),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString()
  };
}

export function rowToAudit(row: Record<string, unknown>): AuditEntry {
  return {
    id: String(row.id),
    projectKey: String(row.project_key),
    environment: row.environment as Environment,
    action: String(row.action),
    actor: String(row.actor),
    resourceType: row.resource_type as "flag" | "segment",
    resourceId: String(row.resource_id),
    before: row.before_value,
    after: row.after_value,
    createdAt: new Date(String(row.created_at)).toISOString()
  };
}

function parseJsonArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (typeof value === "string") {
    return JSON.parse(value) as T[];
  }

  return [];
}
