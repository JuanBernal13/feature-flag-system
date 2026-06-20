import { type FastifyInstance } from "fastify";
import { projectEnvQuerySchema, segmentSchema } from "../schemas";
import { type AppContext } from "../context";

export async function registerSegmentRoutes(app: FastifyInstance, context: AppContext) {
  app.get("/api/segments", async (request) => {
    const query = projectEnvQuerySchema.parse(request.query);
    return context.store.listSegments(query.projectKey, query.environment);
  });

  app.post("/api/segments", async (request, reply) => {
    const body = segmentSchema.parse(request.body);
    const segment = await context.store.createSegment(body);

    await context.auditService.recordChange({
      actorHeader: request.headers["x-actor"],
      action: "segment.created",
      resource: segment,
      after: segment
    });
    await context.configService.publishChange(segment.projectKey, segment.environment);
    reply.code(201).send(segment);
  });
}
