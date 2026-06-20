import { FormEvent } from "react";
import { Radio } from "lucide-react";
import type { FeatureFlagDto, FlagEvaluationDto, SimulatorDraft } from "../types";
import { PROJECT_KEY } from "../types";

export function SimulatorPanel({
  draft,
  evaluation,
  flags,
  onDraftChange,
  onSubmit
}: {
  draft: SimulatorDraft;
  evaluation?: FlagEvaluationDto | undefined;
  flags: FeatureFlagDto[];
  onDraftChange: (draft: SimulatorDraft) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <div className="panel simulator-panel">
      <div className="panel-title">
        <div>
          <p className="eyebrow">SDK parity</p>
          <h2>Evaluation</h2>
        </div>
      </div>

      <form className="simulator-form" onSubmit={onSubmit}>
        <select
          aria-label="Flag selector"
          value={draft.flagKey}
          onChange={(event) => onDraftChange({ ...draft, flagKey: event.target.value })}
        >
          {flags.map((flag) => (
            <option key={flag.id} value={flag.key}>
              {flag.key}
            </option>
          ))}
        </select>
        <input
          aria-label="User id"
          value={draft.userId}
          onChange={(event) => onDraftChange({ ...draft, userId: event.target.value })}
        />
        <input
          aria-label="Country"
          value={draft.country}
          maxLength={2}
          onChange={(event) => onDraftChange({ ...draft, country: event.target.value.toUpperCase() })}
        />
        <input
          aria-label="Groups"
          value={draft.groups}
          onChange={(event) => onDraftChange({ ...draft, groups: event.target.value })}
        />
        <button className="primary-button" type="submit">
          <Radio size={16} />
          Evaluate
        </button>
      </form>

      <div className={evaluation?.enabled ? "evaluation-result enabled" : "evaluation-result"}>
        <span>{evaluation ? (evaluation.enabled ? "Enabled" : "Disabled") : "Pending"}</span>
        <strong>{evaluation?.reason ?? "Run a check"}</strong>
        <small>{evaluation?.bucket !== undefined ? `bucket ${evaluation.bucket}` : "local-ready SDK"}</small>
      </div>

      <pre className="sdk-snippet">{`const flags = new FeatureFlagClient({
  apiKey: "${PROJECT_KEY}",
  userId: "${draft.userId}",
  country: "${draft.country}"
});

if (await flags.isEnabled("${draft.flagKey || "new-checkout"}")) {
  showNewCheckout();
}`}</pre>
    </div>
  );
}
