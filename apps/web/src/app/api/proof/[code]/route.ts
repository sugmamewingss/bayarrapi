import { NextResponse } from "next/server";
import { verifyProof } from "@/lib/proof";

export const dynamic = "force-dynamic";

// GET /api/proof/:code: cek bukti penerima terhadap catatan on-chain.
export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const result = await verifyProof(code.trim().toUpperCase());
  return NextResponse.json(result, { status: result.state === "not_found" ? 404 : 200 });
}
