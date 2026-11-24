import { BATCH_STATUS, RECIPIENT_STATUS } from "@/lib/status";

export function BatchStatusBadge({ status }: { status: string }) {
  const s = BATCH_STATUS[status] ?? { label: status, tone: "gray" };
  return <span className={`badge tone-${s.tone}`}>{s.label}</span>;
}

export function RecipientStatusBadge({ status }: { status: string }) {
  const s = RECIPIENT_STATUS[status] ?? { label: status, tone: "gray" };
  return <span className={`badge tone-${s.tone}`}>{s.label}</span>;
}
