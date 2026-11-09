// Fee BayarRapi per penerima (Rupiah). Biaya payout Xendit Rp2.500,
// jadi margin per penerima Rp500. Angka ini harus sama dengan business case.
export const FEE_PER_RECIPIENT = 3000;

// Batas nominal per penerima (Rupiah) untuk prototipe.
export const MIN_AMOUNT = 10_000;
export const MAX_AMOUNT = 50_000_000;

// Bank tujuan yang didukung prototipe, dengan kode channel Xendit Payouts.
export const BANKS = [
  { code: "BCA", name: "Bank Central Asia", channelCode: "ID_BCA" },
  { code: "BNI", name: "Bank Negara Indonesia", channelCode: "ID_BNI" },
  { code: "BRI", name: "Bank Rakyat Indonesia", channelCode: "ID_BRI" },
  { code: "MANDIRI", name: "Bank Mandiri", channelCode: "ID_MANDIRI" },
  { code: "PERMATA", name: "Bank Permata", channelCode: "ID_PERMATA" },
  { code: "CIMB", name: "CIMB Niaga", channelCode: "ID_CIMB" },
] as const;

export type BankCode = (typeof BANKS)[number]["code"];

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}
