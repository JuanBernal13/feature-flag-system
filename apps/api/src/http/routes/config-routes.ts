import { type FastifyInstance } from "fastify";
import { configQuerySchema } from "../schemas";
import { type AppContext } from "../context";

export async function registerConfigRoutes(app: FastifyInstance, context: AppContext) {
  app.get("/api/config", async (request) => {
    const query = configQuerySchema.parse(request.query);
    return context.configService.getConfig(query.apiKey, query.environment);
  });
}
