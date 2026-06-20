import { type FastifyInstance } from "fastify";
import { evaluateFlag } from "@flagship/shared";
import { evaluateSchema } from "../schemas";
import { type AppContext } from "../context";

export async function registerEvaluationRoutes(app: FastifyInstance, context: AppContext) {
  app.post("/api/evaluate", async (request) => {
    const body = evaluateSchema.parse(request.body);
    const environment = body.context.environment ?? "production";
    const config = await context.configService.getConfig(body.apiKey, environment);
    const flag = config.flags.find((candidate) => candidate.key === body.flagKey);
    const evaluation = flag
      ? evaluateFlag(flag, { ...body.context, environment }, config.segments)
      : { flagKey: body.flagKey, enabled: false, reason: "FLAG_NOT_FOUND" as const };

    await context.store.recordEvaluation({
      projectKey: body.apiKey,
      environment,
      flagKey: body.flagKey,
      userId: body.context.userId,
      enabled: evaluation.enabled,
      reason: evaluation.reason
    });

    return evaluation;
  });
}
