import { Contract, JsonRpcProvider, Wallet, keccak256, solidityPackedKeccak256, toUtf8Bytes } from "ethers";
import { db } from "./db";
import { env } from "./env";
import { LEDGER_ABI } from "./ledger-abi";

// ---------- Hash yang dicatat on-chain ----------
// Tidak ada data pribadi yang keluar dari server: yang dicatat hanya hash.

// ID batch di kontrak = keccak256 dari external_id batch.
export function batchKey(externalId: string): string {
  return keccak256(toUtf8Bytes(externalId));
}

// Hash daftar penerima: id, nominal, dan kode bukti, diurutkan per id.
export function recipientsHash(recipients: { id: string; amount: number; proofCode: string }[]): string {
  const rows = [...recipients].sort((a, b) => a.id.localeCompare(b.id)).map((r) => [r.id, r.amount, r.proofCode]);
  return keccak256(toUtf8Bytes(JSON.stringify(rows)));
}

// Hash bukti satu penerima. Penerima bisa menghitung ulang dari kode buktinya.
export function proofHash(externalId: string, recipientId: string, amount: number, proofCode: string): string {
  return solidityPackedKeccak256(["string", "string", "uint256", "string"], [externalId, recipientId, amount, proofCode]);
}

// ---------- Koneksi kontrak ----------
export function chainEnabled(): boolean {
  const e = env();
  return Boolean(e.SEPOLIA_RPC_URL && e.OPERATOR_PRIVATE_KEY && e.LEDGER_CONTRACT_ADDRESS);
}

let cachedLedger: Contract | null = null;
let cachedReader: Contract | null = null;

function ledger(): Contract {
  if (cachedLedger) return cachedLedger;
  const e = env();
  const provider = new JsonRpcProvider(e.SEPOLIA_RPC_URL);
  const wallet = new Wallet(e.OPERATOR_PRIVATE_KEY!, provider);
  cachedLedger = new Contract(e.LEDGER_CONTRACT_ADDRESS!, LEDGER_ABI, wallet);
  return cachedLedger;
}

export function ledgerReader(): Contract | null {
  const e = env();
  if (!e.SEPOLIA_RPC_URL || !e.LEDGER_CONTRACT_ADDRESS) return null;
  if (!cachedReader) cachedReader = new Contract(e.LEDGER_CONTRACT_ADDRESS, LEDGER_ABI, new JsonRpcProvider(e.SEPOLIA_RPC_URL));
  return cachedReader;
}

// ---------- Antrean pencatatan ----------
// Pencatatan ke blockchain tidak pernah menahan alur pembayaran.
// Job dicatat di tabel ChainJob, lalu diproses berurutan (satu transaksi
// dalam satu waktu supaya nonce wallet operator tidak bentrok) dan diulang jika gagal.
const MAX_ATTEMPTS = 5;

export async function queueChainJob(type: "RECORD_BATCH" | "RECORD_PAYOUT", refId: string) {
  await db.chainJob.upsert({
    where: { type_refId: { type, refId } },
    update: {},
    create: { type, refId },
  });
}

let running: Promise<void> | null = null;

export function processChainJobs(): Promise<void> {
  if (!chainEnabled()) return Promise.resolve();
  if (!running) {
    running = runQueue().finally(() => {
      running = null;
    });
  }
  return running;
}

async function runQueue() {
  // Ulangi sampai tidak ada job yang bisa diproses lagi.
  for (let guard = 0; guard < 100; guard++) {
    const jobs = await db.chainJob.findMany({
      where: { status: "QUEUED", attempts: { lt: MAX_ATTEMPTS } },
      orderBy: { createdAt: "asc" },
    });
    let progressed = false;
    for (const job of jobs) {
      try {
        const done = job.type === "RECORD_BATCH" ? await recordBatch(job.refId) : await recordPayout(job.refId);
        if (done) {
          await db.chainJob.update({ where: { id: job.id }, data: { status: "DONE", lastError: null } });
          progressed = true;
        }
      } catch (err) {
        const attempts = job.attempts + 1;
        const message = err instanceof Error ? err.message.slice(0, 500) : String(err);
        console.error(`[chain] ${job.type} ${job.refId} gagal (percobaan ${attempts}):`, message);
        await db.chainJob.update({
          where: { id: job.id },
          data: { attempts, lastError: message, status: attempts >= MAX_ATTEMPTS ? "FAILED" : "QUEUED" },
        });
      }
    }
    if (!progressed) return;
  }
}

// true = selesai, false = belum bisa diproses sekarang (menunggu job lain)
async function recordBatch(batchId: string): Promise<boolean> {
  const batch = await db.batch.findUnique({ where: { id: batchId }, include: { recipients: true } });
  if (!batch) return true;
  if (batch.chainTxHash) return true;
  const key = batchKey(batch.externalId);
  const hash = recipientsHash(batch.recipients);

  const existing = await ledger().getBatch(key);
  if (existing.exists) {
    await db.batch.update({ where: { id: batch.id }, data: { recipientsHash: existing.recipientsHash } });
    return true;
  }
  const tx = await ledger().recordBatch(key, hash, batch.totalAmount, batch.recipients.length);
  await tx.wait(1);
  await db.batch.update({ where: { id: batch.id }, data: { recipientsHash: hash, chainTxHash: tx.hash } });
  console.log(`[chain] batch ${batch.externalId} tercatat: ${tx.hash}`);
  return true;
}

async function recordPayout(recipientId: string): Promise<boolean> {
  const r = await db.recipient.findUnique({ where: { id: recipientId }, include: { batch: true } });
  if (!r) return true;
  if (r.chainTxHash) return true;
  if (r.status !== "SUCCEEDED" && r.status !== "FAILED") return false;
  // Batch harus sudah tercatat lebih dulu.
  const batchJob = await db.chainJob.findUnique({ where: { type_refId: { type: "RECORD_BATCH", refId: r.batchId } } });
  if (!batchJob || batchJob.status !== "DONE") return false;

  const key = batchKey(r.batch.externalId);
  const hash = proofHash(r.batch.externalId, r.id, r.amount, r.proofCode);
  const status = r.status === "SUCCEEDED" ? 1 : 2;

  const existing = await ledger().getPayout(hash);
  if (existing.exists) {
    await db.recipient.update({ where: { id: r.id }, data: { proofHash: hash } });
    return true;
  }
  const tx = await ledger().recordPayout(key, hash, status);
  await tx.wait(1);
  await db.recipient.update({ where: { id: r.id }, data: { proofHash: hash, chainTxHash: tx.hash } });
  console.log(`[chain] bukti ${r.proofCode} tercatat: ${tx.hash}`);
  return true;
}
