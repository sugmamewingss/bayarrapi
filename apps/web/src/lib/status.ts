export type Tone = "gray" | "amber" | "blue" | "green" | "red";

export const BATCH_STATUS: Record<string, { label: string; tone: Tone }> = {
  DRAFT: { label: "Draf", tone: "gray" },
  PENDING_PAYMENT: { label: "Menunggu pembayaran", tone: "amber" },
  FUNDED: { label: "Dana diterima", tone: "blue" },
  DISBURSING: { label: "Sedang dikirim", tone: "blue" },
  COMPLETED: { label: "Selesai", tone: "green" },
  PARTIAL_FAILED: { label: "Sebagian gagal", tone: "red" },
  EXPIRED: { label: "Kedaluwarsa", tone: "gray" },
};

export const RECIPIENT_STATUS: Record<string, { label: string; tone: Tone }> = {
  PENDING: { label: "Menunggu", tone: "gray" },
  PROCESSING: { label: "Diproses", tone: "blue" },
  SUCCEEDED: { label: "Terkirim", tone: "green" },
  FAILED: { label: "Gagal", tone: "red" },
};

// Urutan tahap untuk timeline di halaman detail batch.
export const BATCH_STEPS = [
  { key: "DRAFT", label: "Dibuat" },
  { key: "PENDING_PAYMENT", label: "Menunggu bayar" },
  { key: "FUNDED", label: "Dana diterima" },
  { key: "DISBURSING", label: "Dikirim ke penerima" },
  { key: "COMPLETED", label: "Selesai" },
] as const;
