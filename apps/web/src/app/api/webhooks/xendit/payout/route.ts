import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { processPayoutEvent } from "@/lib/payout";

function tokenValid(received: string | null): boolean {
  const expected = env().XENDIT_CALLBACK_TOKEN;
  if (!expected || !received) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// POST /api/webhooks/xendit/payout: notifikasi status payout dari Xendit.
// Format Xendit Payouts v2: { event: "payout.succeeded", data: { id, reference_id, status, failure_code, ... } }
export async function POST(req: Request) {
  if (!tokenValid(req.headers.get("x-callback-token"))) {
    return NextResponse.json({ error: "Token webhook tidak valid" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const data = body?.data ?? body;
  if (!data || typeof data.id !== "string" || typeof data.reference_id !== "string") {
    return NextResponse.json({ error: "Payload tidak dikenali" }, { status: 400 });
  }

  try {
    const result = await processPayoutEvent({
      payoutId: data.id,
      referenceId: data.reference_id,
      status: String(data.status),
      failureCode: data.failure_code ?? null,
      raw: body,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as { code?: string }).code === "P2002") {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    const message = err instanceof Error ? err.message : "Gagal memproses";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
