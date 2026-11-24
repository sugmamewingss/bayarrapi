import { NextResponse } from "next/server";
import { createCheckout, PayinError } from "@/lib/payin";
import { XenditError } from "@/lib/xendit";

// POST /api/batches/:id/checkout: buat invoice untuk membayar batch.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const result = await createCheckout(id);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof PayinError) return NextResponse.json({ error: err.message }, { status: err.status });
    if (err instanceof XenditError) {
      console.error(err);
      return NextResponse.json({ error: "Gagal membuat invoice di Xendit", detail: err.body }, { status: 502 });
    }
    throw err;
  }
}
