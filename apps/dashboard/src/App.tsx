import { FormEvent, useEffect, useState } from "react";
import { Activity, Gauge, Radio, ShieldCheck } from "lucide-react";
import {
  createFlag,
  createRule,
  deleteRule,
  evaluateFlag,
  rollbackFlag,
  updateFlag
} from "./api/client";
import { AuditPanel } from "./components/AuditPanel";
import { FlagDetailPanel } from "./components/FlagDetailPanel";
import { FlagListPanel } from "./components/FlagListPanel";
import { MetricTile } from "./components/MetricTile";
import { SimulatorPanel } from "./components/SimulatorPanel";
import { Topbar } from "./components/Topbar";
import { useDashboardData } from "./hooks/useDashboardData";
import type { Environment, FlagEvaluationDto, NewFlagDraft, NewRuleDraft, SimulatorDraft } from "./types";

const EMPTY_FLAG_DRAFT: NewFlagDraft = {
  key: "",
  name: "",
  description: "",
  rolloutPercentage: 0
};

export function App() {
  const [environment, setEnvironment] = useState<Environment>("production");
  const dashboard = useDashboardData(environment);
  const [draftRollout, setDraftRollout] = useState(0);
  const [newFlag, setNewFlag] = useState<NewFlagDraft>(EMPTY_FLAG_DRAFT);
  const [newRule, setNewRule] = useState<NewRuleDraft>({ country: "CO", percentage: 5 });
  const [simulator, setSimulator] = useState<SimulatorDraft>({
    userId: "user_123",
    country: "CO",
    groups: "beta",
    flagKey: "new-checkout"
  });
  const [evaluation, setEvaluation] = useState<FlagEvaluationDto>();

  useEffect(() => {
    if (dashboard.selectedFlag) {
      setDraftRollout(dashboard.selectedFlag.rolloutPercentage);
      setSimulator((current) => ({
        ...current,
        flagKey: current.flagKey || dashboard.selectedFlag?.key || "new-checkout"
      }));
    }
  }, [dashboard.selectedFlag]);

  async function handleCreateFlag(event: FormEvent) {
    event.preventDefault();
    const flag = await createFlag(environment, {
      key: newFlag.key,
      name: newFlag.name,
      description: newFlag.description,
      enabled: false,
      rolloutPercentage: Number(newFlag.rolloutPercentage),
      tags: ["portfolio"]
    });

    dashboard.setNotice(`${flag.key} created`);
    setNewFlag(EMPTY_FLAG_DRAFT);
    dashboard.setSelectedId(flag.id);
    await dashboard.refresh();
  }

  async function handleToggleFlag() {
    const flag = dashboard.selectedFlag;

    if (!flag) {
      return;
    }

    await updateFlag(flag.id, { enabled: !flag.enabled });
    dashboard.setNotice(flag.enabled ? "Flag disabled" : "Flag enabled");
    await dashboard.refresh();
  }

  async function handleSaveRollout() {
    const flag = dashboard.selectedFlag;

    if (!flag) {
      return;
    }

    await updateFlag(flag.id, { rolloutPercentage: draftRollout });
    dashboard.setNotice(`Rollout set to ${draftRollout}%`);
    await dashboard.refresh();
  }

  async function handleRollback() {
    const flag = dashboard.selectedFlag;

    if (!flag) {
      return;
    }

    const updated = await rollbackFlag(flag.id);
    dashboard.setNotice(`${updated.key} rolled back`);
    await dashboard.refresh();
  }

  async function handleAddRule(event: FormEvent) {
    event.preventDefault();
    const flag = dashboard.selectedFlag;

    if (!flag) {
      return;
    }

    const country = newRule.country.toUpperCase();
    await createRule(flag.id, {
      name: `${country} ${newRule.percentage}%`,
      conditions: [{ attribute: "country", operator: "equals", values: [country] }],
      serve: {
        enabled: true,
        rolloutPercentage: Number(newRule.percentage),
        variant: "treatment"
      }
    });

    dashboard.setNotice(`${country} rule added`);
    await dashboard.refresh();
  }

  async function handleDeleteRule(ruleId: string) {
    const flag = dashboard.selectedFlag;

    if (!flag) {
      return;
    }

    await deleteRule(flag.id, ruleId);
    dashboard.setNotice("Rule removed");
    await dashboard.refresh();
  }

  async function handleSimulation(event: FormEvent) {
    event.preventDefault();
    const result = await evaluateFlag({
      flagKey: simulator.flagKey,
      context: {
        userId: simulator.userId,
        country: simulator.country,
        environment,
        groups: simulator.groups
          .split(",")
          .map((group) => group.trim())
          .filter(Boolean)
      }
    });

    setEvaluation(result);
    await dashboard.refresh();
  }

  const enabledRate = dashboard.metrics.total
    ? Math.round((dashboard.metrics.enabled / dashboard.metrics.total) * 100)
    : 0;

  return (
    <div className="app-shell">
      <Topbar environment={environment} live={dashboard.live} onEnvironmentChange={setEnvironment} />

      <main className="workspace">
        <section className="metric-grid" aria-label="Metrics">
          <MetricTile
            icon={<ShieldCheck size={19} />}
            label="Active flags"
            value={dashboard.flags.filter((flag) => flag.enabled).length}
          />
          <MetricTile icon={<Activity size={19} />} label="Evaluations" value={dashboard.metrics.total} />
          <MetricTile icon={<Gauge size={19} />} label="Enabled rate" value={`${enabledRate}%`} />
          <MetricTile icon={<Radio size={19} />} label="Segments" value={dashboard.segments.length} />
        </section>

        <section className="content-grid">
          <FlagListPanel
            draft={newFlag}
            flags={dashboard.flags}
            loading={dashboard.loading}
            notice={dashboard.notice}
            selectedFlag={dashboard.selectedFlag}
            onDraftChange={setNewFlag}
            onSelectFlag={dashboard.setSelectedId}
            onSubmit={handleCreateFlag}
          />

          <FlagDetailPanel
            draftRollout={draftRollout}
            newRule={newRule}
            selectedFlag={dashboard.selectedFlag}
            onAddRule={handleAddRule}
            onDeleteRule={handleDeleteRule}
            onNewRuleChange={setNewRule}
            onRollback={handleRollback}
            onRolloutChange={setDraftRollout}
            onSaveRollout={handleSaveRollout}
            onToggle={handleToggleFlag}
          />

          <SimulatorPanel
            draft={simulator}
            evaluation={evaluation}
            flags={dashboard.flags}
            onDraftChange={setSimulator}
            onSubmit={handleSimulation}
          />

          <AuditPanel audit={dashboard.audit} />
        </section>
      </main>
    </div>
  );
}
