// Fee BayarRapi per penerima (Rupiah). Biaya payout Xendit Rp2.500 adalah batas bawah,
// jadi margin per transfer Rp400 sebelum biaya on-chain. Margin utama datang dari
// langganan Paket Bisnis (Rp149.000 per bulan). Harus sama dengan business case.
export const FEE_PER_RECIPIENT = 2900;

// Batas jumlah penerima per batch untuk prototipe.
export const MAX_RECIPIENTS = 50;

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
