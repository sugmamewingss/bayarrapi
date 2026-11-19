import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paymentMode } from "@/lib/env";
import { PayinError, processInvoiceEvent } from "@/lib/payin";

// POST /api/simulator/invoice/:id/pay  body: { "result": "PAID" | "EXPIRED" }
// Hanya aktif di mode simulasi. Membentuk notifikasi seperti webhook Xendit,
// lalu memprosesnya lewat fungsi yang sama dengan webhook asli.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (paymentMode() !== "simulation") {
    return NextResponse.json({ error: "Simulator hanya aktif saat PAYMENT_MODE=simulation" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const result = body?.result === "EXPIRED" ? "EXPIRED" : "PAID";

  const batch = await db.batch.findUnique({ where: { id } });
  if (!batch || !batch.xenditInvoiceId) return NextResponse.json({ error: "Invoice tidak ditemukan" }, { status: 404 });

  const payload = {
    id: batch.xenditInvoiceId,
    external_id: batch.externalId,
    status: result,
    amount: batch.totalAmount + batch.feeAmount,
    payment_method: "SIMULATION",
    paid_at: new Date().toISOString(),
  };
  try {
    const out = await processInvoiceEvent({
      invoiceId: payload.id,
      externalId: payload.external_id,
      status: payload.status,
      amount: payload.amount,
      raw: payload,
    });
    return NextResponse.json({ ok: true, ...out });
  } catch (err) {
    if (err instanceof PayinError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
