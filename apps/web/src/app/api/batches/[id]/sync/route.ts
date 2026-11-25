import { NextResponse } from "next/server";
import { syncBatchWithXendit } from "@/lib/xendit-sync";

// POST /api/batches/:id/sync: tanyakan status invoice dan payout ke API Xendit.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    return NextResponse.json({ ok: true, ...(await syncBatchWithXendit(id)) });
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as { code?: string }).code === "P2002") {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    const message = err instanceof Error ? err.message.slice(0, 300) : "Gagal sinkron";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
