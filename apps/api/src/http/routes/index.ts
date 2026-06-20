import { type FastifyInstance } from "fastify";
import { type AppContext } from "../context";
import { registerConfigRoutes } from "./config-routes";
import { registerEvaluationRoutes } from "./evaluation-routes";
import { registerFlagRoutes } from "./flag-routes";
import { registerObservabilityRoutes } from "./observability-routes";
import { registerSegmentRoutes } from "./segment-routes";

export async function registerRoutes(app: FastifyInstance, context: AppContext) {
  await registerObservabilityRoutes(app, context);
  await registerConfigRoutes(app, context);
  await registerFlagRoutes(app, context);
  await registerSegmentRoutes(app, context);
  await registerEvaluationRoutes(app, context);
}
