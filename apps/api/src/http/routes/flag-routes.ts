import { type FastifyInstance } from "fastify";
import {
  createFlagSchema,
  idParamsSchema,
  projectEnvQuerySchema,
  ruleParamsSchema,
  ruleSchema,
  updateFlagSchema
} from "../schemas";
import { type AppContext } from "../context";

export async function registerFlagRoutes(app: FastifyInstance, context: AppContext) {
  app.get("/api/flags", async (request) => {
    const query = projectEnvQuerySchema.parse(request.query);
    return context.store.listFlags(query.projectKey, query.environment);
  });

  app.post("/api/flags", async (request, reply) => {
    const body = createFlagSchema.parse(request.body);
    const existing = await context.store.getFlagByKey(body.projectKey, body.environment, body.key);

    if (existing) {
      reply.code(409).send({ error: "Flag key already exists in this environment" });
      return;
    }

    const flag = await context.store.createFlag(body);
    await context.auditService.recordChange({
      actorHeader: request.headers["x-actor"],
      action: "flag.created",
      resource: flag,
      after: flag
    });
    await context.configService.publishChange(flag.projectKey, flag.environment, flag.key);
    reply.code(201).send(flag);
  });

  app.patch("/api/flags/:id", async (request, reply) => {
    const params = idParamsSchema.parse(request.params);
    const body = updateFlagSchema.parse(request.body);
    const before = await context.store.getFlagById(params.id);

    if (!before) {
      reply.code(404).send({ error: "Flag not found" });
      return;
    }

    const after = await context.store.updateFlag(params.id, body);

    if (!after) {
      reply.code(404).send({ error: "Flag not found" });
      return;
    }

    await context.auditService.recordChange({
      actorHeader: request.headers["x-actor"],
      action: "flag.updated",
      resource: after,
      before,
      after
    });
    await context.configService.publishChange(after.projectKey, after.environment, after.key);
    return after;
  });

  app.post("/api/flags/:id/rollback", async (request, reply) => {
    const params = idParamsSchema.parse(request.params);
    const before = await context.store.getFlagById(params.id);

    if (!before) {
      reply.code(404).send({ error: "Flag not found" });
      return;
    }

    const after = await context.store.updateFlag(params.id, {
      enabled: false,
      rolloutPercentage: 0
    });

    if (!after) {
      reply.code(404).send({ error: "Flag not found" });
      return;
    }

    await context.auditService.recordChange({
      actorHeader: request.headers["x-actor"],
      action: "flag.rollback",
      resource: after,
      before,
      after
    });
    await context.configService.publishChange(after.projectKey, after.environment, after.key);
    return after;
  });

  app.delete("/api/flags/:id", async (request, reply) => {
    const params = idParamsSchema.parse(request.params);
    const before = await context.store.getFlagById(params.id);

    if (!before) {
      reply.code(404).send({ error: "Flag not found" });
      return;
    }

    await context.store.deleteFlag(params.id);
    await context.auditService.recordChange({
      actorHeader: request.headers["x-actor"],
      action: "flag.deleted",
      resource: before,
      before
    });
    await context.configService.publishChange(before.projectKey, before.environment, before.key);
    reply.code(204).send();
  });

  app.post("/api/flags/:id/rules", async (request, reply) => {
    const params = idParamsSchema.parse(request.params);
    const body = ruleSchema.parse(request.body);
    const before = await context.store.getFlagById(params.id);

    if (!before) {
      reply.code(404).send({ error: "Flag not found" });
      return;
    }

    const after = await context.store.createRule(params.id, body);

    if (!after) {
      reply.code(404).send({ error: "Flag not found" });
      return;
    }

    await context.auditService.recordChange({
      actorHeader: request.headers["x-actor"],
      action: "rule.created",
      resource: after,
      before,
      after
    });
    await context.configService.publishChange(after.projectKey, after.environment, after.key);
    reply.code(201).send(after);
  });

  app.patch("/api/flags/:id/rules/:ruleId", async (request, reply) => {
    const params = ruleParamsSchema.parse(request.params);
    const body = ruleSchema.partial().parse(request.body);
    const before = await context.store.getFlagById(params.id);

    if (!before) {
      reply.code(404).send({ error: "Flag not found" });
      return;
    }

    const after = await context.store.updateRule(params.id, params.ruleId, body);

    if (!after) {
      reply.code(404).send({ error: "Flag not found" });
      return;
    }

    await context.auditService.recordChange({
      actorHeader: request.headers["x-actor"],
      action: "rule.updated",
      resource: after,
      before,
      after
    });
    await context.configService.publishChange(after.projectKey, after.environment, after.key);
    return after;
  });

  app.delete("/api/flags/:id/rules/:ruleId", async (request, reply) => {
    const params = ruleParamsSchema.parse(request.params);
    const before = await context.store.getFlagById(params.id);

    if (!before) {
      reply.code(404).send({ error: "Flag not found" });
      return;
    }

    const after = await context.store.deleteRule(params.id, params.ruleId);

    if (!after) {
      reply.code(404).send({ error: "Flag not found" });
      return;
    }

    await context.auditService.recordChange({
      actorHeader: request.headers["x-actor"],
      action: "rule.deleted",
      resource: after,
      before,
      after
    });
    await context.configService.publishChange(after.projectKey, after.environment, after.key);
    return after;
  });
}
