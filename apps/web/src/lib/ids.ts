import { randomBytes, randomUUID } from "node:crypto";

// Huruf tanpa karakter yang mirip (0/O, 1/I/L) supaya mudah diketik penerima.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomCode(length: number): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

// external_id untuk invoice Xendit, contoh: BR-20261110-7KQ2MX
export function newBatchExternalId(now = new Date()): string {
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  return `BR-${date}-${randomCode(6)}`;
}

// Kode bukti untuk penerima, contoh: RAPI-4F7K-Q2MX
export function newProofCode(): string {
  return `RAPI-${randomCode(4)}-${randomCode(4)}`;
}

// Kunci idempotency untuk Xendit Payouts API (satu per penerima)
export function newIdempotencyKey(): string {
  return randomUUID();
}
