import { History } from "lucide-react";
import type { AuditEntry } from "../types";

export function AuditPanel({ audit }: { audit: AuditEntry[] }) {
  return (
    <div className="panel audit-panel">
      <div className="panel-title">
        <div>
          <p className="eyebrow">Safety</p>
          <h2>Audit log</h2>
        </div>
        <History size={19} aria-hidden="true" />
      </div>

      <div className="audit-list">
        {audit.length === 0 ? (
          <div className="empty-state">No changes yet</div>
        ) : (
          audit.map((entry) => (
            <div className="audit-row" key={entry.id}>
              <span>{entry.action}</span>
              <small>{entry.actor}</small>
              <time>{new Date(entry.createdAt).toLocaleTimeString()}</time>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
