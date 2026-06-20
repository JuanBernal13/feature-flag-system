import {
  type ConfigChangedEvent,
  type ConfigPayload,
  type Environment,
  type EvaluationContext,
  type FeatureFlag,
  type FlagEvaluation,
  evaluateFlag
} from "@flagship/shared";

export interface FeatureFlagClientOptions {
  apiKey: string;
  userId: string;
  baseUrl?: string;
  environment?: Environment;
  country?: string;
  email?: string;
  groups?: string[];
  attributes?: EvaluationContext["attributes"];
  cacheTtlMs?: number;
  streaming?: boolean;
  fetchImpl?: typeof fetch;
  WebSocketImpl?: typeof WebSocket;
}

export class FeatureFlagClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly cacheTtlMs: number;
  private readonly fetcher: typeof fetch;
  private readonly WebSocketCtor?: typeof WebSocket;
  private readonly streaming: boolean;
  private context: EvaluationContext;
  private config: ConfigPayload | undefined;
  private configFetchedAt = 0;
  private stream: WebSocket | undefined;
  private refreshPromise: Promise<void> | undefined;

  constructor(options: FeatureFlagClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = normalizeBaseUrl(options.baseUrl ?? "http://127.0.0.1:4000");
    this.cacheTtlMs = options.cacheTtlMs ?? 30_000;
    this.fetcher = options.fetchImpl ?? fetch;
    this.WebSocketCtor = options.WebSocketImpl ?? globalThis.WebSocket;
    this.streaming = options.streaming ?? true;
    this.context = {
      userId: options.userId,
      environment: options.environment ?? "production",
      country: options.country,
      email: options.email,
      groups: options.groups ?? [],
      attributes: options.attributes ?? {}
    };

    if (this.streaming && this.WebSocketCtor) {
      this.connectStream();
    }
  }

  async isEnabled(flagKey: string, fallback = false): Promise<boolean> {
    const evaluation = await this.evaluate(flagKey);
    return evaluation?.enabled ?? fallback;
  }

  async variation(flagKey: string, fallback?: string): Promise<string | undefined> {
    const evaluation = await this.evaluate(flagKey);
    return evaluation?.variant ?? fallback;
  }

  async evaluate(flagKey: string): Promise<FlagEvaluation | undefined> {
    await this.ensureFreshConfig();
    const flag = this.config?.flags.find((candidate: { key: string; }) => candidate.key === flagKey);

    if (!flag) {
      return {
        flagKey,
        enabled: false,
        reason: "FLAG_NOT_FOUND"
      };
    }

    return evaluateFlag(flag, this.context, this.config?.segments ?? []);
  }

  async allFlags(): Promise<Record<string, boolean>> {
    await this.ensureFreshConfig();

    return Object.fromEntries(
      (this.config?.flags ?? []).map((flag: { key: any; }) => [
        flag.key,
        evaluateFlag(flag, this.context, this.config?.segments ?? []).enabled
      ])
    );
  }

  identify(nextContext: Partial<EvaluationContext> & { userId: string }): void {
    this.context = {
      ...this.context,
      ...nextContext,
      groups: nextContext.groups ?? this.context.groups ?? [],
      attributes: {
        ...this.context.attributes,
        ...nextContext.attributes
      }
    };
  }

  async refresh(): Promise<void> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.fetchConfig().finally(() => {
      this.refreshPromise = undefined;
    });

    return this.refreshPromise;
  }

  close(): void {
    this.stream?.close();
    this.stream = undefined;
  }

  private async ensureFreshConfig(): Promise<void> {
    const isFresh = this.config && Date.now() - this.configFetchedAt < this.cacheTtlMs;

    if (!isFresh) {
      await this.refresh();
    }
  }

  private async fetchConfig(): Promise<void> {
    const params = new URLSearchParams({
      apiKey: this.apiKey,
      environment: this.context.environment ?? "production"
    });

    const response = await this.fetcher(`${this.baseUrl}/api/config?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Feature flag config request failed with ${response.status}`);
    }

    this.config = (await response.json()) as ConfigPayload;
    this.configFetchedAt = Date.now();
  }

  private connectStream(): void {
    if (!this.WebSocketCtor) {
      return;
    }

    const environment = this.context.environment ?? "production";
    const wsBaseUrl = this.baseUrl.replace(/^http/, "ws");
    const params = new URLSearchParams({
      projectKey: this.apiKey,
      environment
    });

    const stream = new this.WebSocketCtor(`${wsBaseUrl}/stream?${params.toString()}`);
    this.stream = stream;

    stream.addEventListener("message", (message) => {
      const event = safeParseEvent(message.data);

      if (event?.type === "config_changed") {
        void this.refresh();
      }
    });
  }
}

export type { ConfigPayload, Environment, EvaluationContext, FeatureFlag, FlagEvaluation };

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, "");
}

function safeParseEvent(data: unknown): ConfigChangedEvent | undefined {
  if (typeof data !== "string") {
    return undefined;
  }

  try {
    return JSON.parse(data) as ConfigChangedEvent;
  } catch {
    return undefined;
  }
}
