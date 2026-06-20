import { describe, expect, it, vi } from "vitest";
import { FeatureFlagClient } from "../src";

describe("FeatureFlagClient", () => {
  it("evaluates cached flags locally", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({
        projectKey: "demo_project_key",
        environment: "production",
        version: "1",
        generatedAt: "2026-01-01T00:00:00.000Z",
        segments: [],
        flags: [
          {
            id: "flag_1",
            projectKey: "demo_project_key",
            key: "new-checkout",
            name: "New checkout",
            environment: "production",
            enabled: true,
            rolloutPercentage: 100,
            rules: [],
            tags: [],
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z"
          }
        ]
      })
    );

    const client = new FeatureFlagClient({
      apiKey: "demo_project_key",
      userId: "user_123",
      streaming: false,
      fetchImpl: fetchImpl as unknown as typeof fetch
    });

    await expect(client.isEnabled("new-checkout")).resolves.toBe(true);
    await expect(client.isEnabled("new-checkout")).resolves.toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
