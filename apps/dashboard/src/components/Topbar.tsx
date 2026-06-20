import { Flag, Wifi, WifiOff } from "lucide-react";
import type { Environment } from "../types";

const ENVIRONMENTS: Environment[] = ["dev", "staging", "production"];

export function Topbar({
  environment,
  live,
  onEnvironmentChange
}: {
  environment: Environment;
  live: boolean;
  onEnvironmentChange: (environment: Environment) => void;
}) {
  return (
    <header className="topbar">
      <div className="brand-block">
        <div className="brand-mark">
          <Flag size={22} aria-hidden="true" />
        </div>
        <div>
          <p className="eyebrow">Flagship</p>
          <h1>Feature Flag Control Plane</h1>
        </div>
      </div>

      <div className="topbar-actions">
        <div className="segmented-control" aria-label="Environment selector">
          {ENVIRONMENTS.map((candidate) => (
            <button
              key={candidate}
              className={candidate === environment ? "active" : ""}
              onClick={() => onEnvironmentChange(candidate)}
            >
              {candidate}
            </button>
          ))}
        </div>
        <span className={live ? "status live" : "status"}>
          {live ? <Wifi size={16} /> : <WifiOff size={16} />}
          {live ? "Live" : "Offline"}
        </span>
      </div>
    </header>
  );
}
