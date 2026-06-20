import { FormEvent } from "react";
import { Plus, RotateCcw, Save, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import type { FeatureFlagDto, NewRuleDraft } from "../types";

export function FlagDetailPanel({
  draftRollout,
  newRule,
  selectedFlag,
  onAddRule,
  onDeleteRule,
  onNewRuleChange,
  onRollback,
  onRolloutChange,
  onSaveRollout,
  onToggle
}: {
  draftRollout: number;
  newRule: NewRuleDraft;
  selectedFlag?: FeatureFlagDto | undefined;
  onAddRule: (event: FormEvent) => void;
  onDeleteRule: (ruleId: string) => void;
  onNewRuleChange: (draft: NewRuleDraft) => void;
  onRollback: () => void;
  onRolloutChange: (value: number) => void;
  onSaveRollout: () => void;
  onToggle: () => void;
}) {
  if (!selectedFlag) {
    return (
      <div className="panel detail-panel">
        <div className="empty-state">No flags in this environment</div>
      </div>
    );
  }

  return (
    <div className="panel detail-panel">
      <div className="panel-title">
        <div>
          <p className="eyebrow">Selected flag</p>
          <h2>{selectedFlag.name}</h2>
        </div>
        <div className="button-row">
          <button
            className="icon-command"
            title={selectedFlag.enabled ? "Disable flag" : "Enable flag"}
            onClick={onToggle}
          >
            {selectedFlag.enabled ? <ToggleRight size={21} /> : <ToggleLeft size={21} />}
          </button>
          <button className="icon-command danger" title="Instant rollback" onClick={onRollback}>
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      <p className="description">{selectedFlag.description ?? "No description"}</p>

      <div className="control-strip">
        <label>
          Global rollout
          <input
            type="number"
            min="0"
            max="100"
            value={draftRollout}
            onChange={(event) => onRolloutChange(Number(event.target.value))}
          />
        </label>
        <button className="secondary-button" onClick={onSaveRollout}>
          <Save size={16} />
          Save
        </button>
      </div>

      <div className="subsection-title">
        <h3>Targeting rules</h3>
        <span>{selectedFlag.rules.length}</span>
      </div>

      <form className="rule-form" onSubmit={onAddRule}>
        <input
          aria-label="Country code"
          value={newRule.country}
          maxLength={2}
          onChange={(event) =>
            onNewRuleChange({ ...newRule, country: event.target.value.toUpperCase() })
          }
        />
        <input
          aria-label="Rule rollout percentage"
          type="number"
          min="0"
          max="100"
          value={newRule.percentage}
          onChange={(event) => onNewRuleChange({ ...newRule, percentage: Number(event.target.value) })}
        />
        <button className="secondary-button" type="submit">
          <Plus size={16} />
          Add
        </button>
      </form>

      <div className="rules-table">
        {selectedFlag.rules.map((rule) => (
          <div className="rule-row" key={rule.id}>
            <span className="rule-priority">{rule.priority}</span>
            <span>
              <strong>{rule.name}</strong>
              <small>
                {rule.conditions
                  .map(
                    (condition) =>
                      `${condition.attribute} ${condition.operator} ${condition.values.join(",")}`
                  )
                  .join(" and ")}
              </small>
            </span>
            <span className="rollout-chip">{rule.serve.rolloutPercentage ?? 100}%</span>
            <button
              className="icon-command"
              title="Delete rule"
              onClick={() => onDeleteRule(rule.id)}
            >
              <Trash2 size={17} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
