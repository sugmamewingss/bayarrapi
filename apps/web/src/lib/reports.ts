import { db } from "./db";
import { FEE_PER_RECIPIENT, XENDIT_PAYOUT_COST } from "./constants";

export type ReconRow = {
  externalId: string;
  batchId: string;
  status: string;
  paidAt: Date | null;
  recipients: number;
  invoiceAmount: number; // dibayar pengirim (penerima + fee)
  allocated: number; // total nominal penerima
  succeededAmount: number;
  failedAmount: number; // nominal transfer gagal
  pendingAmount: number;
  fee: number; // fee yang ditagih di invoice
  feeRefund: number; // fee transfer gagal, ikut dikembalikan
  refund: number; // total wajib dikembalikan ke pengirim
  feeEarned: number; // fee dari transfer berhasil
  xenditCost: number;
  margin: number; // fee transfer berhasil - biaya Xendit
  onChain: string; // "Lengkap" | "x/y" | "-"
  match: boolean;
  note: string;
};

// Rekonsiliasi per batch yang sudah dibayar dalam rentang tanggal (WIB, inklusif).
// Kebijakan: transfer gagal dikembalikan penuh ke pengirim, nominal dan fee-nya.
// Cek: (1) uang masuk = terkirim + refund + fee transfer berhasil + yang masih diproses,
// (2) tidak ada payout yang masih diproses, (3) semua hasil final tercatat on-chain.
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
    const failedCount = b.recipients.filter((r) => r.status === "FAILED").length;
    const pendingCount = b.recipients.length - succeededCount - failedCount;
    const feeRefund = failedCount * FEE_PER_RECIPIENT;
    const feeEarned = succeededCount * FEE_PER_RECIPIENT;
    const refund = failedAmount + feeRefund;
    const finals = b.recipients.filter((r) => r.status === "SUCCEEDED" || r.status === "FAILED");
    const recorded = finals.filter((r) => r.chainTxHash || r.proofHash).length;
    const invoiceAmount = b.totalAmount + b.feeAmount;
    const xenditCost = succeededCount * XENDIT_PAYOUT_COST;

    const notes: string[] = [];
    const moneyOk =
      succeededAmount + refund + feeEarned + pendingAmount + pendingCount * FEE_PER_RECIPIENT === invoiceAmount &&
      b.feeAmount === b.recipients.length * FEE_PER_RECIPIENT;
    if (!moneyOk) notes.push("Uang masuk tidak sama dengan rincian per penerima");
    if (pendingAmount > 0) notes.push("Masih ada payout diproses");
    if (refund > 0) notes.push("Refund nominal dan fee transfer gagal ke pengirim");
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
      feeRefund,
      refund,
      feeEarned,
      xenditCost,
      margin: feeEarned - xenditCost,
      onChain: finals.length === 0 ? "-" : chainOk ? "Lengkap" : `${recorded}/${finals.length}`,
      match: moneyOk && pendingAmount === 0 && chainOk,
      note: notes.join("; "),
    };
  });
}

// Waktu WIB, format 2026-11-25 00:23 (mudah dibaca dan diurutkan di Excel).
function wib(d: Date): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function toCsv(rows: ReconRow[]): string {
  const head = [
    "external_id", "status", "dibayar_wib", "penerima", "uang_masuk", "alokasi", "terkirim", "gagal",
    "fee_refund", "total_refund", "diproses", "fee_ditagih", "fee_berhasil", "biaya_xendit", "margin",
    "on_chain", "cocok", "catatan",
  ];
  const esc = (v: unknown) => {
    const s = v instanceof Date ? wib(v) : String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map((r) =>
    [
      r.externalId, r.status, r.paidAt, r.recipients, r.invoiceAmount, r.allocated, r.succeededAmount, r.failedAmount,
      r.feeRefund, r.refund, r.pendingAmount, r.fee, r.feeEarned, r.xenditCost, r.margin, r.onChain,
      r.match ? "YA" : "TIDAK", r.note,
    ].map(esc).join(","),
  );
  // Baris "sep=," membuat Excel memakai koma sebagai pemisah di setelan regional apa pun (termasuk Indonesia).
  return ["sep=,", head.join(","), ...lines].join("\r\n");
}
