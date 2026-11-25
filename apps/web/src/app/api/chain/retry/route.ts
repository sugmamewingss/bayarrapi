import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chainEnabled, processChainJobs } from "@/lib/chain";

// POST /api/chain/retry: ulangi job on-chain yang gagal atau tertunda (mis. setelah server restart).
export async function POST() {
  if (!chainEnabled()) return NextResponse.json({ error: "Koneksi blockchain belum dikonfigurasi di .env" }, { status: 400 });
  const reset = await db.chainJob.updateMany({ where: { status: "FAILED" }, data: { status: "QUEUED", attempts: 0 } });
  void processChainJobs();
  return NextResponse.json({ ok: true, requeued: reset.count });
}
