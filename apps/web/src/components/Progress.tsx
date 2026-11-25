// Bilah progres dengan label, dipakai di detail batch.
export default function Progress({ label, value, total, tone = "green" }: { label: string; value: number; total: number; tone?: "green" | "amber" }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div className="progress">
      <div className="progress-head">
        <span>{label}</span>
        <span className="mono">
          {value}/{total}
        </span>
      </div>
      <div className="progress-track">
        <div className={`progress-bar tone-${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
