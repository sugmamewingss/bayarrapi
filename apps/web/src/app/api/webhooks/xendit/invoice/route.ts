import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { PayinError, processInvoiceEvent } from "@/lib/payin";

function tokenValid(received: string | null): boolean {
  const expected = env().XENDIT_CALLBACK_TOKEN;
  if (!expected || !received) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// POST /api/webhooks/xendit/invoice: notifikasi status invoice dari Xendit.
// Keamanan: (1) verifikasi x-callback-token, (2) cocokkan external_id dan nominal,
// (3) notifikasi ganda tidak diproses ulang. Status tidak pernah diambil dari browser.
export async function POST(req: Request) {
  if (!tokenValid(req.headers.get("x-callback-token"))) {
    return NextResponse.json({ error: "Token webhook tidak valid" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.id !== "string" || typeof body.external_id !== "string") {
    return NextResponse.json({ error: "Payload tidak dikenali" }, { status: 400 });
  }

  try {
    const result = await processInvoiceEvent({
      invoiceId: body.id,
      externalId: body.external_id,
      status: String(body.status),
      amount: Number(body.amount),
      raw: body,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof PayinError) return NextResponse.json({ error: err.message }, { status: err.status });
    // Notifikasi yang sama datang bersamaan: anggap duplikat.
    if (err instanceof Error && "code" in err && (err as { code?: string }).code === "P2002") {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    throw err;
  }
}
