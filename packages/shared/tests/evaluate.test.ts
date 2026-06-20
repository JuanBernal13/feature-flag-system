import { describe, expect, it } from "vitest";
import {
  type FeatureFlag,
  type Segment,
  evaluateFlag,
  percentageBucket
} from "../src";

const baseFlag: FeatureFlag = {
  id: "flag_1",
  projectKey: "demo_project_key",
  key: "new-checkout",
  name: "New checkout",
  environment: "production",
  enabled: true,
  rolloutPercentage: 0,
  tags: ["checkout"],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  rules: [
    {
      id: "rule_co",
      name: "Colombia canary",
      priority: 1,
      conditions: [{ attribute: "country", operator: "equals", values: ["CO"] }],
      serve: { enabled: true, rolloutPercentage: 5 }
    },
    {
      id: "rule_mx",
      name: "Mexico rollout",
      priority: 2,
      conditions: [{ attribute: "country", operator: "equals", values: ["MX"] }],
      serve: { enabled: true, rolloutPercentage: 20 }
    }
  ]
};

describe("evaluateFlag", () => {
  it("uses deterministic buckets for percentage rollouts", () => {
    const first = percentageBucket("new-checkout", "rule_co", "user_123");
    const second = percentageBucket("new-checkout", "rule_co", "user_123");

    expect(first).toBe(second);
    expect(first).toBeGreaterThanOrEqual(0);
    expect(first).toBeLessThanOrEqual(100);
  });

  it("matches the first applicable country rule", () => {
    const bucket = percentageBucket("new-checkout", "rule_mx", "user_123");
    const result = evaluateFlag(baseFlag, {
      userId: "user_123",
      country: "MX",
      environment: "production"
    });

    expect(result.ruleId).toBe("rule_mx");
    expect(result.enabled).toBe(bucket < 20);
  });

  it("falls through to the global rollout when no rule matches", () => {
    const result = evaluateFlag(
      { ...baseFlag, rolloutPercentage: 100 },
      { userId: "user_123", country: "AR", environment: "production" }
    );

    expect(result.reason).toBe("ROLLOUT_MATCH");
    expect(result.enabled).toBe(true);
  });

  it("supports reusable user segments", () => {
    const betaSegment: Segment = {
      id: "segment_1",
      projectKey: "demo_project_key",
      key: "beta-testers",
      name: "Beta testers",
      environment: "production",
      includedUserIds: ["user_123"],
      excludedUserIds: [],
      rules: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z"
    };

    const result = evaluateFlag(
      {
        ...baseFlag,
        rules: [
          {
            id: "rule_segment",
            name: "Beta users",
            priority: 1,
            conditions: [{ attribute: "segment", operator: "inSegment", values: ["beta-testers"] }],
            serve: { enabled: true, rolloutPercentage: 100 }
          }
        ]
      },
      { userId: "user_123", country: "CO" },
      [betaSegment]
    );

    expect(result.enabled).toBe(true);
    expect(result.ruleId).toBe("rule_segment");
  });
});
