import Fastify from "fastify";
import cors from "@fastify/cors";
import { ZodError } from "zod";
import { ConfigCache } from "./cache/config-cache";
import { registerRoutes } from "./http/routes";
import { ConfigEvents } from "./realtime/config-events";
import { RealtimeHub } from "./realtime/realtime-hub";
import { AuditService } from "./services/audit-service";
import { ConfigService } from "./services/config-service";
import { createStore } from "./storage/create-store";

export async function buildApp() {
  const app = Fastify({ logger: true });
  const store = await createStore();
  const cache = new ConfigCache(process.env.REDIS_URL);
  const events = new ConfigEvents(process.env.REDIS_URL);
  const realtimeHub = new RealtimeHub();
  const context = {
    store,
    auditService: new AuditService(store),
    configService: new ConfigService(store, cache, events)
  };

  realtimeHub.attach(app.server);
  events.onConfigChanged((event) => realtimeHub.broadcast(event));

  await app.register(cors, {
    origin: parseCorsOrigin()
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      reply.code(400).send({
        error: "ValidationError",
        issues: error.issues
      });
      return;
    }

    app.log.error(error);
    reply.code(500).send({ error: "InternalServerError" });
  });

  await registerRoutes(app, context);
  return app;
}

function parseCorsOrigin(): boolean | string[] {
  const origin = process.env.CORS_ORIGIN;

  if (!origin) {
    return true;
  }

  return origin.split(",").map((value) => value.trim());
}
