import { z } from "zod";

// Semua konfigurasi rahasia dibaca dari apps/web/.env (tidak di-commit).
// Validasi dilakukan saat pertama dipakai, supaya halaman yang tidak butuh
// Xendit atau blockchain tetap bisa jalan walau variabelnya belum diisi.
const schema = z.object({
  XENDIT_SECRET_KEY: z
    .string()
    .startsWith("xnd_development_", "Pakai secret key TEST MODE (xnd_development_...)"),
  XENDIT_CALLBACK_TOKEN: z.string().min(1),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
  SEPOLIA_RPC_URL: z.string().url().optional(),
  OPERATOR_PRIVATE_KEY: z.string().optional(),
  LEDGER_CONTRACT_ADDRESS: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const detail = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Konfigurasi .env tidak valid: ${detail}`);
  }
  cached = parsed.data;
  return cached;
}
