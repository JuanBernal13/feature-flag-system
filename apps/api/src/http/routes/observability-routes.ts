import { type FastifyInstance } from "fastify";
import { DEMO_PROJECT_KEY } from "../../sample-data";
import { projectEnvQuerySchema } from "../schemas";
import { type AppContext } from "../context";

export async function registerObservabilityRoutes(app: FastifyInstance, context: AppContext) {
  app.get("/health", async () => ({
    status: "ok",
    storage: process.env.DATABASE_URL ? "postgres" : "memory",
    cache: process.env.REDIS_URL ? "redis" : "memory",
    checkedAt: new Date().toISOString()
  }));

  app.get("/api/audit", async (request) => {
    const query = projectEnvQuerySchema.partial({ environment: true }).parse(request.query);
    return context.store.listAudit(query.projectKey ?? DEMO_PROJECT_KEY, query.environment);
  });

  app.get("/api/metrics", async (request) => {
    const query = projectEnvQuerySchema.parse(request.query);
    return context.store.getMetrics(query.projectKey, query.environment);
  });
}
