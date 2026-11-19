import { NextResponse } from "next/server";
import { createBatch, createBatchInput } from "@/lib/batches";

// POST /api/batches: buat batch baru beserta daftar penerima.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = createBatchInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data batch tidak valid", issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })) },
      { status: 400 },
    );
  }
  const batch = await createBatch(parsed.data);
  return NextResponse.json({ id: batch.id, externalId: batch.externalId, status: batch.status }, { status: 201 });
}
