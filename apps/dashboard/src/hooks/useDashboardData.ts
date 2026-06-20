import { useCallback, useEffect, useMemo, useState } from "react";
import { getAudit, getFlags, getMetrics, getSegments } from "../api/client";
import {
  API_URL,
  PROJECT_KEY,
  type AuditEntry,
  type Environment,
  type FeatureFlagDto,
  type MetricSummary,
  type SegmentDto
} from "../types";

const EMPTY_METRICS: MetricSummary = {
  total: 0,
  enabled: 0,
  disabled: 0,
  byFlag: []
};

export function useDashboardData(environment: Environment) {
  const [flags, setFlags] = useState<FeatureFlagDto[]>([]);
  const [segments, setSegments] = useState<SegmentDto[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [metrics, setMetrics] = useState<MetricSummary>(EMPTY_METRICS);
  const [selectedId, setSelectedId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [notice, setNotice] = useState("Ready");

  const selectedFlag = useMemo(
    () => flags.find((flag) => flag.id === selectedId) ?? flags[0],
    [flags, selectedId]
  );

  const loadData = useCallback(
    async (showLoading = true) => {
      if (showLoading) {
        setLoading(true);
      }

      const [nextFlags, nextSegments, nextMetrics, nextAudit] = await Promise.all([
        getFlags(environment),
        getSegments(environment),
        getMetrics(environment),
        getAudit(environment)
      ]);

      setFlags(nextFlags);
      setSegments(nextSegments);
      setMetrics(nextMetrics);
      setAudit(nextAudit);
      setSelectedId((current) => current ?? nextFlags[0]?.id);
      setLoading(false);
    },
    [environment]
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const wsUrl = `${API_URL.replace(/^http/, "ws")}/stream?projectKey=${PROJECT_KEY}&environment=${environment}`;
    const socket = new WebSocket(wsUrl);

    socket.addEventListener("open", () => setLive(true));
    socket.addEventListener("close", () => setLive(false));
    socket.addEventListener("message", (event) => {
      const payload = JSON.parse(event.data) as { type?: string; flagKey?: string };

      if (payload.type === "config_changed") {
        setNotice(payload.flagKey ? `${payload.flagKey} synced` : "Config synced");
        void loadData(false);
      }
    });

    return () => socket.close();
  }, [environment, loadData]);

  return {
    audit,
    flags,
    live,
    loading,
    metrics,
    notice,
    segments,
    selectedFlag,
    setNotice,
    setSelectedId,
    refresh: () => loadData(false)
  };
}
