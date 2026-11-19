import { db } from "./db";
import { env, paymentMode } from "./env";
import { onBatchFunded } from "./events";
import { xenditRequest } from "./xendit";

type XenditInvoice = { id: string; invoice_url: string; status: string; external_id: string; amount: number };

// Membuat invoice untuk batch berstatus DRAFT.
// Mode xendit: memanggil Xendit Invoice API (test mode).
// Mode simulation: membuat invoice palsu yang dibayar lewat halaman simulator.
export async function createCheckout(batchId: string) {
  const batch = await db.batch.findUnique({ where: { id: batchId }, include: { recipients: true } });
  if (!batch) throw new PayinError(404, "Batch tidak ditemukan");
  if (batch.status === "PENDING_PAYMENT" && batch.invoiceUrl) return { invoiceUrl: batch.invoiceUrl, mode: paymentMode() };
  if (batch.status !== "DRAFT") throw new PayinError(409, `Batch berstatus ${batch.status}, tidak bisa dibayar lagi`);

  const amount = batch.totalAmount + batch.feeAmount;
  const base = env().APP_BASE_URL;
  let invoiceId: string;
  let invoiceUrl: string;

  if (paymentMode() === "xendit") {
    const invoice = await xenditRequest<XenditInvoice>("/v2/invoices", {
      method: "POST",
      body: {
        external_id: batch.externalId,
        amount,
        currency: "IDR",
        description: `BayarRapi ${batch.externalId}: ${batch.recipients.length} penerima`,
        invoice_duration: 86400,
        success_redirect_url: `${base}/batches/${batch.id}?paid=1`,
        failure_redirect_url: `${base}/batches/${batch.id}`,
      },
    });
    invoiceId = invoice.id;
    invoiceUrl = invoice.invoice_url;
  } else {
    invoiceId = `sim_inv_${batch.id}`;
    invoiceUrl = `${base}/simulator/invoice/${batch.id}`;
  }

  await db.batch.update({
    where: { id: batch.id },
    data: { status: "PENDING_PAYMENT", xenditInvoiceId: invoiceId, invoiceUrl },
  });
  return { invoiceUrl, mode: paymentMode() };
}

export type InvoiceEvent = {
  invoiceId: string;
  externalId: string;
  status: string; // PAID | SETTLED | EXPIRED
  amount: number;
  raw: unknown;
};

// Memproses notifikasi invoice (dari webhook Xendit atau simulator).
// Aman dipanggil berulang: notifikasi yang sama hanya diproses sekali.
export async function processInvoiceEvent(evt: InvoiceEvent) {
  const eventKey = `INVOICE:${evt.invoiceId}:${evt.status}`;
  const existing = await db.webhookEvent.findUnique({ where: { eventKey } });
  if (existing) return { duplicate: true as const };

  const batch = await db.batch.findUnique({ where: { externalId: evt.externalId } });
  if (!batch) throw new PayinError(404, `external_id ${evt.externalId} tidak dikenal`);
  if (batch.xenditInvoiceId && batch.xenditInvoiceId !== evt.invoiceId) throw new PayinError(400, "ID invoice tidak cocok dengan batch");
  if (evt.amount !== batch.totalAmount + batch.feeAmount) throw new PayinError(400, "Nominal invoice tidak cocok dengan batch");

  await db.webhookEvent.create({ data: { source: "INVOICE", eventKey, payload: JSON.stringify(evt.raw) } });

  let funded = false;
  if ((evt.status === "PAID" || evt.status === "SETTLED") && batch.status === "PENDING_PAYMENT") {
    await db.batch.update({ where: { id: batch.id }, data: { status: "FUNDED", paidAt: new Date() } });
    funded = true;
  } else if (evt.status === "EXPIRED" && batch.status === "PENDING_PAYMENT") {
    await db.batch.update({ where: { id: batch.id }, data: { status: "EXPIRED" } });
  }

  await db.webhookEvent.update({ where: { eventKey }, data: { processedAt: new Date() } });
  if (funded) await onBatchFunded(batch.id);
  return { duplicate: false as const, funded };
}

export class PayinError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
