import { FormEvent } from "react";
import { Plus } from "lucide-react";
import type { FeatureFlagDto, NewFlagDraft } from "../types";

export function FlagListPanel({
  draft,
  flags,
  loading,
  notice,
  selectedFlag,
  onDraftChange,
  onSelectFlag,
  onSubmit
}: {
  draft: NewFlagDraft;
  flags: FeatureFlagDto[];
  loading: boolean;
  notice: string;
  selectedFlag?: FeatureFlagDto | undefined;
  onDraftChange: (draft: NewFlagDraft) => void;
  onSelectFlag: (flagId: string) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <div className="panel flag-list-panel">
      <div className="panel-title">
        <div>
          <p className="eyebrow">Configuration</p>
          <h2>Flags</h2>
        </div>
        <span className="muted">{notice}</span>
      </div>

      <form className="create-form" onSubmit={onSubmit}>
        <input
          aria-label="Flag key"
          placeholder="flag-key"
          value={draft.key}
          onChange={(event) => onDraftChange({ ...draft, key: event.target.value })}
          required
        />
        <input
          aria-label="Flag name"
          placeholder="Display name"
          value={draft.name}
          onChange={(event) => onDraftChange({ ...draft, name: event.target.value })}
          required
        />
        <button className="primary-button" type="submit">
          <Plus size={17} />
          Create
        </button>
      </form>

      <div className="flag-list" aria-busy={loading}>
        {flags.map((flag) => (
          <button
            key={flag.id}
            className={flag.id === selectedFlag?.id ? "flag-row selected" : "flag-row"}
            onClick={() => onSelectFlag(flag.id)}
          >
            <span className={flag.enabled ? "toggle-dot on" : "toggle-dot"} />
            <span>
              <strong>{flag.name}</strong>
              <small>{flag.key}</small>
            </span>
            <span className="rollout-chip">{flag.rolloutPercentage}%</span>
          </button>
        ))}
      </div>
    </div>
  );
}
