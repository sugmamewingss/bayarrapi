import { db } from "./db";
import { XENDIT_PAYOUT_COST } from "./constants";

export type ReconRow = {
  externalId: string;
  batchId: string;
  status: string;
  paidAt: Date | null;
  recipients: number;
  invoiceAmount: number; // dibayar pengirim (penerima + fee)
  allocated: number; // total nominal penerima
  succeededAmount: number;
  failedAmount: number; // wajib dikembalikan ke pengirim
  pendingAmount: number;
  fee: number;
  xenditCost: number;
  margin: number; // fee - biaya Xendit
  onChain: string; // "Lengkap" | "x/y" | "-"
  match: boolean;
  note: string;
};

// Rekonsiliasi per batch yang sudah dibayar dalam rentang tanggal (WIB, inklusif).
// Cek: (1) uang masuk = alokasi + fee, (2) alokasi = terkirim + gagal + menunggu,
// (3) semua hasil final sudah tercatat on-chain.
export async function buildReconciliation(from?: string, to?: string): Promise<ReconRow[]> {
  const paidAt: { gte?: Date; lte?: Date; not: null } = { not: null };
  if (from) paidAt.gte = new Date(`${from}T00:00:00+07:00`);
  if (to) paidAt.lte = new Date(`${to}T23:59:59.999+07:00`);

  const batches = await db.batch.findMany({
    where: { paidAt },
    include: { recipients: true },
    orderBy: { paidAt: "desc" },
  });

  return batches.map((b) => {
    const sum = (status: string) => b.recipients.filter((r) => r.status === status).reduce((t, r) => t + r.amount, 0);
    const succeededAmount = sum("SUCCEEDED");
    const failedAmount = sum("FAILED");
    const pendingAmount = sum("PENDING") + sum("PROCESSING");
    const succeededCount = b.recipients.filter((r) => r.status === "SUCCEEDED").length;
    const finals = b.recipients.filter((r) => r.status === "SUCCEEDED" || r.status === "FAILED");
    const recorded = finals.filter((r) => r.chainTxHash || r.proofHash).length;
    const invoiceAmount = b.totalAmount + b.feeAmount;
    const xenditCost = succeededCount * XENDIT_PAYOUT_COST;

    const notes: string[] = [];
    const moneyOk = succeededAmount + failedAmount + pendingAmount === b.totalAmount;
    if (!moneyOk) notes.push("Alokasi tidak sama dengan jumlah status penerima");
    if (pendingAmount > 0) notes.push("Masih ada payout diproses");
    if (failedAmount > 0) notes.push("Dana gagal kirim harus dikembalikan ke pengirim");
    const chainOk = Boolean(b.chainTxHash || b.recipientsHash) && recorded === finals.length;
    if (!chainOk && finals.length > 0) notes.push("Catatan on-chain belum lengkap");

    return {
      externalId: b.externalId,
      batchId: b.id,
      status: b.status,
      paidAt: b.paidAt,
      recipients: b.recipients.length,
      invoiceAmount,
      allocated: b.totalAmount,
      succeededAmount,
      failedAmount,
      pendingAmount,
      fee: b.feeAmount,
      xenditCost,
      margin: b.feeAmount - xenditCost,
      onChain: finals.length === 0 ? "-" : chainOk ? "Lengkap" : `${recorded}/${finals.length}`,
      match: moneyOk && pendingAmount === 0 && chainOk,
      note: notes.join("; "),
    };
  });
}

export function toCsv(rows: ReconRow[]): string {
  const head = [
    "external_id", "status", "dibayar", "penerima", "uang_masuk", "alokasi", "terkirim", "gagal_refund",
    "diproses", "fee", "biaya_xendit", "margin", "on_chain", "cocok", "catatan",
  ];
  const esc = (v: unknown) => {
    const s = v instanceof Date ? v.toISOString() : String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map((r) =>
    [
      r.externalId, r.status, r.paidAt, r.recipients, r.invoiceAmount, r.allocated, r.succeededAmount, r.failedAmount,
      r.pendingAmount, r.fee, r.xenditCost, r.margin, r.onChain, r.match ? "YA" : "TIDAK", r.note,
    ].map(esc).join(","),
  );
  return [head.join(","), ...lines].join("\n");
}
