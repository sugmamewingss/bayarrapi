import { BATCH_STATUS, RECIPIENT_STATUS } from "@/lib/status";

const LIVE = new Set(["PENDING_PAYMENT", "FUNDED", "DISBURSING", "PROCESSING"]);

export function BatchStatusBadge({ status }: { status: string }) {
  const s = BATCH_STATUS[status] ?? { label: status, tone: "gray" };
  return (
    <span className={`badge tone-${s.tone}${LIVE.has(status) ? " live" : ""}`}>
      <i className="badge-dot" />
      {s.label}
    </span>
  );
}

export function RecipientStatusBadge({ status }: { status: string }) {
  const s = RECIPIENT_STATUS[status] ?? { label: status, tone: "gray" };
  return (
    <span className={`badge tone-${s.tone}${LIVE.has(status) ? " live" : ""}`}>
      <i className="badge-dot" />
      {s.label}
    </span>
  );
}
