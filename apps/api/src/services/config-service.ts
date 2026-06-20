import { type ConfigChangedEvent, type Environment } from "@flagship/shared";
import { ConfigCache } from "../cache/config-cache";
import { ConfigEvents } from "../realtime/config-events";
import { type FlagStore } from "../storage/types";

export class ConfigService {
  constructor(
    private readonly store: FlagStore,
    private readonly cache: ConfigCache,
    private readonly events: ConfigEvents
  ) {}

  async getConfig(projectKey: string, environment: Environment) {
    const cached = await this.cache.get(projectKey, environment);

    if (cached) {
      return cached;
    }

    const config = await this.store.getConfig(projectKey, environment);
    await this.cache.set(config);
    return config;
  }

  async publishChange(
    projectKey: string,
    environment: Environment,
    flagKey?: string
  ): Promise<void> {
    await this.cache.invalidate(projectKey, environment);
    const config = await this.store.getConfig(projectKey, environment);
    const event: ConfigChangedEvent = {
      type: "config_changed",
      projectKey,
      environment,
      version: config.version,
      flagKey,
      changedAt: new Date().toISOString()
    };

    await this.events.publish(event);
  }
}
