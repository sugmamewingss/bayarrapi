import { BANKS } from "./constants";

export function bankName(code: string): string {
  return BANKS.find((b) => b.code === code)?.name ?? code;
}

// 1234567890 -> ******7890
export function maskAccount(accountNumber: string): string {
  if (accountNumber.length <= 4) return accountNumber;
  return "*".repeat(accountNumber.length - 4) + accountNumber.slice(-4);
}

export function formatDateTime(date: Date | null | undefined): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(date);
}
