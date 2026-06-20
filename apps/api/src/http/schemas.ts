import { z } from "zod";
import { ENVIRONMENTS } from "@flagship/shared";
import { DEMO_PROJECT_KEY } from "../sample-data";

export const environmentSchema = z.enum(ENVIRONMENTS);

export const idParamsSchema = z.object({
  id: z.string().min(1)
});

export const ruleParamsSchema = z.object({
  id: z.string().min(1),
  ruleId: z.string().min(1)
});

export const projectEnvQuerySchema = z.object({
  projectKey: z.string().min(1).default(DEMO_PROJECT_KEY),
  environment: environmentSchema.default("production")
});

export const configQuerySchema = z.object({
  apiKey: z.string().min(1),
  environment: environmentSchema.default("production")
});

export const conditionSchema = z.object({
  attribute: z.string().min(1),
  operator: z.enum([
    "equals",
    "notEquals",
    "in",
    "notIn",
    "contains",
    "startsWith",
    "endsWith",
    "inSegment"
  ]),
  values: z.array(z.string().min(1)).min(1)
});

export const ruleSchema = z.object({
  name: z.string().min(1),
  conditions: z.array(conditionSchema).min(1),
  serve: z.object({
    enabled: z.boolean(),
    rolloutPercentage: z.number().min(0).max(100).optional(),
    variant: z.string().optional()
  })
});

export const createFlagSchema = z.object({
  projectKey: z.string().min(1).default(DEMO_PROJECT_KEY),
  environment: environmentSchema.default("production"),
  key: z.string().regex(/^[a-z0-9][a-z0-9-_.]*$/),
  name: z.string().min(1),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
  rolloutPercentage: z.number().min(0).max(100).optional(),
  tags: z.array(z.string()).optional()
});

export const updateFlagSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
  rolloutPercentage: z.number().min(0).max(100).optional(),
  tags: z.array(z.string()).optional()
});

export const segmentSchema = z.object({
  projectKey: z.string().min(1).default(DEMO_PROJECT_KEY),
  environment: environmentSchema.default("production"),
  key: z.string().regex(/^[a-z0-9][a-z0-9-_.]*$/),
  name: z.string().min(1),
  includedUserIds: z.array(z.string()).optional(),
  excludedUserIds: z.array(z.string()).optional()
});

export const evaluateSchema = z.object({
  apiKey: z.string().min(1),
  flagKey: z.string().min(1),
  context: z.object({
    userId: z.string().min(1),
    environment: environmentSchema.optional(),
    country: z.string().optional(),
    email: z.string().optional(),
    groups: z.array(z.string()).optional(),
    attributes: z.record(z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])).optional()
  })
});
