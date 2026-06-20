import Redis from "ioredis";
import { type ConfigPayload, type Environment } from "@flagship/shared";

export class ConfigCache {
  private readonly redis: Redis | undefined;
  private readonly memory = new Map<string, { value: ConfigPayload; expiresAt: number }>();
  private readonly ttlSeconds: number;

  constructor(redisUrl?: string, ttlSeconds = 30) {
    this.ttlSeconds = ttlSeconds;
    this.redis = redisUrl ? new Redis(redisUrl) : undefined;
  }

  async get(projectKey: string, environment: Environment): Promise<ConfigPayload | undefined> {
    const key = this.key(projectKey, environment);

    if (this.redis) {
      const value = await this.redis.get(key);
      return value ? (JSON.parse(value) as ConfigPayload) : undefined;
    }

    const cached = this.memory.get(key);

    if (!cached || cached.expiresAt < Date.now()) {
      this.memory.delete(key);
      return undefined;
    }

    return cached.value;
  }

  async set(payload: ConfigPayload): Promise<void> {
    const key = this.key(payload.projectKey, payload.environment);

    if (this.redis) {
      await this.redis.set(key, JSON.stringify(payload), "EX", this.ttlSeconds);
      return;
    }

    this.memory.set(key, {
      value: payload,
      expiresAt: Date.now() + this.ttlSeconds * 1000
    });
  }

  async invalidate(projectKey: string, environment: Environment): Promise<void> {
    const key = this.key(projectKey, environment);

    if (this.redis) {
      await this.redis.del(key);
      return;
    }

    this.memory.delete(key);
  }

  private key(projectKey: string, environment: Environment): string {
    return `config:${projectKey}:${environment}`;
  }
}
