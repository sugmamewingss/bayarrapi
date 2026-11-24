import { db } from "./db";
import { batchKey, ledgerReader, proofHash } from "./chain";

export type ProofCheck =
  | { state: "not_found" }
  | { state: "pending"; reason: string }
  | { state: "verified"; proofHash: string; recordedAt: Date; onChainStatus: "SUCCEEDED" | "FAILED" }
  | { state: "mismatch"; reason: string }
  | { state: "unavailable"; reason: string };

// Cek bukti penerima langsung ke smart contract, tidak hanya percaya database.
// Hash dihitung ulang dari data penerima, lalu dicari di kontrak.
export async function verifyProof(code: string): Promise<ProofCheck> {
  const r = await db.recipient.findUnique({ where: { proofCode: code }, include: { batch: true } });
  if (!r) return { state: "not_found" };
  if (r.status !== "SUCCEEDED" && r.status !== "FAILED") return { state: "pending", reason: "Payout belum final" };

  const reader = ledgerReader();
  if (!reader) return { state: "unavailable", reason: "Koneksi blockchain belum dikonfigurasi" };

  const hash = proofHash(r.batch.externalId, r.id, r.amount, r.proofCode);
  if (r.proofHash && r.proofHash !== hash) return { state: "mismatch", reason: "Data penerima di database berubah setelah dicatat" };

  try {
    const p = await reader.getPayout(hash);
    if (!p.exists) return { state: "pending", reason: "Belum tercatat on-chain" };
    if (p.batchId !== batchKey(r.batch.externalId)) return { state: "mismatch", reason: "Batch on-chain berbeda" };
    const onChainStatus = Number(p.status) === 1 ? "SUCCEEDED" : "FAILED";
    if (onChainStatus !== r.status) return { state: "mismatch", reason: "Status on-chain berbeda dengan database" };
    return { state: "verified", proofHash: hash, recordedAt: new Date(Number(p.recordedAt) * 1000), onChainStatus };
  } catch (err) {
    return { state: "unavailable", reason: err instanceof Error ? err.message.slice(0, 120) : "RPC gagal" };
  }
}
