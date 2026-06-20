import { randomUUID } from "node:crypto";
import { type FeatureFlag, type Segment } from "@flagship/shared";

const now = new Date().toISOString();

export const DEMO_PROJECT_KEY = "demo_project_key";

export function createSeedFlags(): FeatureFlag[] {
  return [
    {
      id: randomUUID(),
      projectKey: DEMO_PROJECT_KEY,
      key: "new-checkout",
      name: "New checkout",
      description: "Canary release by country with deterministic bucketing.",
      environment: "production",
      enabled: true,
      rolloutPercentage: 0,
      tags: ["checkout", "canary"],
      createdAt: now,
      updatedAt: now,
      rules: [
        {
          id: randomUUID(),
          name: "Beta testers",
          priority: 1,
          conditions: [{ attribute: "segment", operator: "inSegment", values: ["beta-testers"] }],
          serve: { enabled: true, rolloutPercentage: 100, variant: "treatment" }
        },
        {
          id: randomUUID(),
          name: "Colombia 5%",
          priority: 2,
          conditions: [{ attribute: "country", operator: "equals", values: ["CO"] }],
          serve: { enabled: true, rolloutPercentage: 5, variant: "treatment" }
        },
        {
          id: randomUUID(),
          name: "Mexico 20%",
          priority: 3,
          conditions: [{ attribute: "country", operator: "equals", values: ["MX"] }],
          serve: { enabled: true, rolloutPercentage: 20, variant: "treatment" }
        }
      ]
    },
    {
      id: randomUUID(),
      projectKey: DEMO_PROJECT_KEY,
      key: "search-ranking-v2",
      name: "Search ranking v2",
      description: "Staged rollout for ranking experiments.",
      environment: "production",
      enabled: true,
      rolloutPercentage: 35,
      tags: ["search", "experiment"],
      createdAt: now,
      updatedAt: now,
      rules: [
        {
          id: randomUUID(),
          name: "Internal staff",
          priority: 1,
          conditions: [{ attribute: "email", operator: "endsWith", values: ["@company.com"] }],
          serve: { enabled: true, rolloutPercentage: 100, variant: "staff" }
        }
      ]
    },
    {
      id: randomUUID(),
      projectKey: DEMO_PROJECT_KEY,
      key: "one-click-refunds",
      name: "One-click refunds",
      description: "High-risk workflow behind an instant rollback switch.",
      environment: "production",
      enabled: false,
      rolloutPercentage: 0,
      tags: ["risk", "support"],
      createdAt: now,
      updatedAt: now,
      rules: []
    }
  ];
}

export function createSeedSegments(): Segment[] {
  return [
    {
      id: randomUUID(),
      projectKey: DEMO_PROJECT_KEY,
      key: "beta-testers",
      name: "Beta testers",
      environment: "production",
      includedUserIds: ["user_123", "user_777"],
      excludedUserIds: [],
      rules: [[{ attribute: "group", operator: "in", values: ["beta"] }]],
      createdAt: now,
      updatedAt: now
    }
  ];
}
