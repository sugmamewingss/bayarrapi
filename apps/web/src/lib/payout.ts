import { db } from "./db";
import { paymentMode } from "./env";
import { BANKS } from "./constants";
import { xenditRequest } from "./xendit";
import { processChainJobs, queueChainJob } from "./chain";

type XenditPayout = { id: string; reference_id: string; status: string };

// Mengirim satu payout per penerima setelah batch FUNDED.
// Mode xendit: Xendit Payouts API (test mode), status final datang lewat webhook.
// Mode simulation: hasil dibuat lokal. Nomor rekening yang berakhiran 0000
// sengaja dibuat GAGAL supaya skenario gagal bisa didemokan.
export async function startPayouts(batchId: string) {
  const batch = await db.batch.findUnique({ where: { id: batchId }, include: { recipients: true } });
  if (!batch || batch.status !== "FUNDED") return;
  await db.batch.update({ where: { id: batch.id }, data: { status: "DISBURSING" } });

  for (const r of batch.recipients) {
    if (r.status !== "PENDING") continue;
    if (paymentMode() === "xendit") {
      const bank = BANKS.find((b) => b.code === r.bankCode);
      try {
        const payout = await xenditRequest<XenditPayout>("/v2/payouts", {
          method: "POST",
          headers: { "Idempotency-key": r.idempotencyKey },
          body: {
            reference_id: r.id,
            channel_code: bank?.channelCode ?? `ID_${r.bankCode}`,
            channel_properties: { account_holder_name: r.name, account_number: r.accountNumber },
            amount: r.amount,
            currency: "IDR",
            description: `BayarRapi ${batch.externalId}`,
          },
        });
        await db.recipient.update({ where: { id: r.id }, data: { status: "PROCESSING", xenditPayoutId: payout.id } });
      } catch (err) {
        console.error(`[payout] gagal membuat payout untuk ${r.id}`, err);
        await applyPayoutResult({ recipientId: r.id, payoutId: null, status: "FAILED", failureCode: "CREATE_FAILED", raw: String(err) });
      }
    } else {
      const simId = `sim_po_${r.id}`;
      await db.recipient.update({ where: { id: r.id }, data: { status: "PROCESSING", xenditPayoutId: simId } });
      const status = r.accountNumber.endsWith("0000") ? "FAILED" : "SUCCEEDED";
      // Jeda singkat meniru waktu proses bank.
      setTimeout(() => {
        processPayoutEvent({
          payoutId: simId,
          referenceId: r.id,
          status,
          failureCode: status === "FAILED" ? "INVALID_DESTINATION" : null,
          raw: { simulated: true, id: simId, reference_id: r.id, status },
        }).catch((e) => console.error("[payout] simulasi gagal diproses", e));
      }, 1500);
    }
  }
}

export type PayoutEvent = {
  payoutId: string;
  referenceId: string;
  status: string; // SUCCEEDED | FAILED | CANCELLED | REVERSED | ACCEPTED ...
  failureCode: string | null;
  raw: unknown;
};

// Memproses notifikasi payout (webhook Xendit atau simulasi). Aman dipanggil berulang.
export async function processPayoutEvent(evt: PayoutEvent) {
  const final = evt.status === "SUCCEEDED" ? "SUCCEEDED" : ["FAILED", "CANCELLED", "REVERSED"].includes(evt.status) ? "FAILED" : null;
  if (!final) return { ignored: true as const };

  const eventKey = `PAYOUT:${evt.payoutId}:${evt.status}`;
  if (await db.webhookEvent.findUnique({ where: { eventKey } })) return { duplicate: true as const };
  await db.webhookEvent.create({ data: { source: "PAYOUT", eventKey, payload: JSON.stringify(evt.raw) } });

  const recipient = await db.recipient.findUnique({ where: { id: evt.referenceId } });
  if (!recipient) throw new Error(`reference_id ${evt.referenceId} tidak dikenal`);
  if (recipient.xenditPayoutId && recipient.xenditPayoutId !== evt.payoutId) throw new Error("ID payout tidak cocok");

  await applyPayoutResult({ recipientId: recipient.id, payoutId: evt.payoutId, status: final, failureCode: evt.failureCode, raw: evt.raw });
  await db.webhookEvent.update({ where: { eventKey }, data: { processedAt: new Date() } });
  return { duplicate: false as const };
}

async function applyPayoutResult(p: { recipientId: string; payoutId: string | null; status: "SUCCEEDED" | "FAILED"; failureCode: string | null; raw: unknown }) {
  const r = await db.recipient.update({
    where: { id: p.recipientId },
    data: { status: p.status, failureCode: p.failureCode, ...(p.payoutId ? { xenditPayoutId: p.payoutId } : {}) },
  });
  await queueChainJob("RECORD_PAYOUT", r.id);
  await finalizeBatch(r.batchId);
  void processChainJobs();
}

// Batch selesai jika semua penerima sudah berstatus final.
async function finalizeBatch(batchId: string) {
  const recipients = await db.recipient.findMany({ where: { batchId }, select: { status: true } });
  if (recipients.some((r) => r.status === "PENDING" || r.status === "PROCESSING")) return;
  const allOk = recipients.every((r) => r.status === "SUCCEEDED");
  await db.batch.update({ where: { id: batchId }, data: { status: allOk ? "COMPLETED" : "PARTIAL_FAILED" } });
}
