import { ConfigService } from "../services/config-service";
import { AuditService } from "../services/audit-service";
import { type FlagStore } from "../storage/types";

export interface AppContext {
  store: FlagStore;
  configService: ConfigService;
  auditService: AuditService;
}
