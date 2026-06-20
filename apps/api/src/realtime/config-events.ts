import { EventEmitter } from "node:events";
import Redis from "ioredis";
import { randomUUID } from "node:crypto";
import { type ConfigChangedEvent } from "@flagship/shared";

const CHANNEL = "flagship:config-events";

export class ConfigEvents {
  private readonly emitter = new EventEmitter();
  private readonly nodeId = randomUUID();
  private readonly pub?: Redis;
  private readonly sub?: Redis;

  constructor(redisUrl?: string) {
    if (!redisUrl) {
      return;
    }

    this.pub = new Redis(redisUrl);
    this.sub = new Redis(redisUrl);

    this.sub.subscribe(CHANNEL).catch(() => undefined);
    this.sub.on("message", (_channel, payload) => {
      const message = JSON.parse(payload) as { nodeId: string; event: ConfigChangedEvent };

      if (message.nodeId !== this.nodeId) {
        this.emitter.emit("event", message.event);
      }
    });
  }

  onConfigChanged(listener: (event: ConfigChangedEvent) => void): void {
    this.emitter.on("event", listener);
  }

  async publish(event: ConfigChangedEvent): Promise<void> {
    this.emitter.emit("event", event);

    if (this.pub) {
      await this.pub.publish(CHANNEL, JSON.stringify({ nodeId: this.nodeId, event }));
    }
  }
}
