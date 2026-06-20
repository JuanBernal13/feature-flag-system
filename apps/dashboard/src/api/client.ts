import {
  API_URL,
  PROJECT_KEY,
  type AuditEntry,
  type Environment,
  type FeatureFlagDto,
  type FlagEvaluationDto,
  type MetricSummary,
  type SegmentDto
} from "../types";

interface RequestOptions {
  method?: string;
  body?: unknown;
}

export async function getFlags(environment: Environment) {
  return request<FeatureFlagDto[]>(`/api/flags?${projectEnvQuery(environment)}`);
}

export async function getSegments(environment: Environment) {
  return request<SegmentDto[]>(`/api/segments?${projectEnvQuery(environment)}`);
}

export async function getMetrics(environment: Environment) {
  return request<MetricSummary>(`/api/metrics?${projectEnvQuery(environment)}`);
}

export async function getAudit(environment: Environment) {
  return request<AuditEntry[]>(`/api/audit?${projectEnvQuery(environment)}`);
}

export async function createFlag(environment: Environment, body: unknown) {
  return request<FeatureFlagDto>("/api/flags", {
    method: "POST",
    body: {
      projectKey: PROJECT_KEY,
      environment,
      ...asRecord(body)
    }
  });
}

export async function updateFlag(flagId: string, body: unknown) {
  return request<FeatureFlagDto>(`/api/flags/${flagId}`, {
    method: "PATCH",
    body
  });
}

export async function rollbackFlag(flagId: string) {
  return request<FeatureFlagDto>(`/api/flags/${flagId}/rollback`, {
    method: "POST"
  });
}

export async function createRule(flagId: string, body: unknown) {
  return request<FeatureFlagDto>(`/api/flags/${flagId}/rules`, {
    method: "POST",
    body
  });
}

export async function deleteRule(flagId: string, ruleId: string) {
  return request<FeatureFlagDto>(`/api/flags/${flagId}/rules/${ruleId}`, {
    method: "DELETE"
  });
}

export async function evaluateFlag(body: unknown) {
  return request<FlagEvaluationDto>("/api/evaluate", {
    method: "POST",
    body: {
      apiKey: PROJECT_KEY,
      ...asRecord(body)
    }
  });
}

function projectEnvQuery(environment: Environment): string {
  return `projectKey=${PROJECT_KEY}&environment=${environment}`;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const init: RequestInit = {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      "x-actor": "portfolio-dashboard"
    }
  };

  if (options.body !== undefined) {
    init.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_URL}${path}`, init);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}
