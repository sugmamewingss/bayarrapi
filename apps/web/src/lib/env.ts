import { z } from "zod";

// Semua konfigurasi rahasia dibaca dari apps/web/.env (tidak di-commit).
// Validasi dilakukan saat pertama dipakai, supaya halaman yang tidak butuh
// Xendit atau blockchain tetap bisa jalan walau variabelnya belum diisi.
const schema = z.object({
  // "simulation" = pembayaran disimulasikan lokal, tanpa memanggil Xendit.
  // "xendit" = memakai Xendit test mode. Jika kosong, otomatis "xendit"
  // bila XENDIT_SECRET_KEY terisi, selain itu "simulation".
  PAYMENT_MODE: z.enum(["simulation", "xendit"]).optional(),
  XENDIT_SECRET_KEY: z
    .string()
    .startsWith("xnd_development_", "Pakai secret key TEST MODE (xnd_development_...)")
    .optional(),
  XENDIT_CALLBACK_TOKEN: z.string().min(1).optional(),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
  SEPOLIA_RPC_URL: z.string().url().optional(),
  OPERATOR_PRIVATE_KEY: z.string().optional(),
  LEDGER_CONTRACT_ADDRESS: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

// Nilai placeholder dari .env.example dianggap kosong.
function clean(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (value.endsWith("xxx") || value === "0x") return undefined;
  return value;
}

export function env(): Env {
  if (cached) return cached;
  const raw = {
    ...process.env,
    XENDIT_SECRET_KEY: clean(process.env.XENDIT_SECRET_KEY),
    XENDIT_CALLBACK_TOKEN: clean(process.env.XENDIT_CALLBACK_TOKEN),
    SEPOLIA_RPC_URL: clean(process.env.SEPOLIA_RPC_URL),
    OPERATOR_PRIVATE_KEY: clean(process.env.OPERATOR_PRIVATE_KEY),
    LEDGER_CONTRACT_ADDRESS: clean(process.env.LEDGER_CONTRACT_ADDRESS),
    PAYMENT_MODE: process.env.PAYMENT_MODE || undefined,
  };
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const detail = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Konfigurasi .env tidak valid: ${detail}`);
  }
  cached = parsed.data;
  return cached;
}

export function paymentMode(): "simulation" | "xendit" {
  const e = env();
  if (e.PAYMENT_MODE) return e.PAYMENT_MODE;
  return e.XENDIT_SECRET_KEY ? "xendit" : "simulation";
}

export function xenditSecretKey(): string {
  const key = env().XENDIT_SECRET_KEY;
  if (!key) throw new Error("XENDIT_SECRET_KEY belum diisi di apps/web/.env");
  return key;
}
