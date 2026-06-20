import { type Environment } from "@flagship/shared";
import { type FlagStore } from "../storage/types";

interface AuditedResource {
  id: string;
  projectKey: string;
  environment: Environment;
}

export class AuditService {
  constructor(private readonly store: FlagStore) {}

  async recordChange(input: {
    actorHeader: string | string[] | undefined;
    action: string;
    resource: AuditedResource;
    before?: unknown;
    after?: unknown;
  }): Promise<void> {
    await this.store.appendAudit({
      projectKey: input.resource.projectKey,
      environment: input.resource.environment,
      action: input.action,
      actor: this.actorFromHeader(input.actorHeader),
      resourceType: input.action.startsWith("segment") ? "segment" : "flag",
      resourceId: input.resource.id,
      before: input.before,
      after: input.after
    });
  }

  private actorFromHeader(header: string | string[] | undefined): string {
    if (Array.isArray(header)) {
      return header[0] ?? "dashboard";
    }

    return header ?? "dashboard";
  }
}
