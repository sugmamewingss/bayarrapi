import { db } from "./db";
import { paymentMode } from "./env";
import { processInvoiceEvent } from "./payin";
import { processPayoutEvent } from "./payout";
import { xenditRequest } from "./xendit";

type XenditInvoice = { id: string; external_id: string; status: string; amount: number };
type XenditPayout = { id: string; reference_id: string; status: string; failure_code?: string | null };

// Cadangan jika webhook tidak bisa diterima (misalnya tanpa URL publik).
// Server menanyakan status langsung ke API Xendit, lalu memprosesnya lewat
// fungsi yang sama dengan webhook. Status tetap tidak pernah diambil dari browser,
// dan hasil yang sama tidak diproses dua kali (eventKey unik).
export async function syncBatchWithXendit(batchId: string) {
  if (paymentMode() !== "xendit") return { skipped: true as const };
  const batch = await db.batch.findUnique({ where: { id: batchId }, include: { recipients: true } });
  if (!batch) return { skipped: true as const };

  const result = { invoice: null as string | null, payouts: 0 };

  if (batch.status === "PENDING_PAYMENT" && batch.xenditInvoiceId) {
    const inv = await xenditRequest<XenditInvoice>(`/v2/invoices/${batch.xenditInvoiceId}`);
    result.invoice = inv.status;
    if (["PAID", "SETTLED", "EXPIRED"].includes(inv.status)) {
      await processInvoiceEvent({
        invoiceId: inv.id,
        externalId: inv.external_id,
        status: inv.status,
        amount: inv.amount,
        raw: { source: "sync", ...inv },
      });
    }
  }

  const processing = batch.recipients.filter(
    (r) => r.status === "PROCESSING" && r.xenditPayoutId && !r.xenditPayoutId.startsWith("sim_"),
  );
  for (const r of processing) {
    const p = await xenditRequest<XenditPayout>(`/v2/payouts/${r.xenditPayoutId}`);
    const out = await processPayoutEvent({
      payoutId: p.id,
      referenceId: p.reference_id,
      status: p.status,
      failureCode: p.failure_code ?? null,
      raw: { source: "sync", ...p },
    });
    if (!("ignored" in out)) result.payouts++;
  }
  return result;
}
