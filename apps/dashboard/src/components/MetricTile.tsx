export function MetricTile({
  icon,
  label,
  value
}: {
  icon: JSX.Element;
  label: string;
  value: string | number;
}) {
  return (
    <div className="metric-tile">
      <span>{icon}</span>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}
