import { z } from "zod";
import { db } from "./db";
import { BANKS, FEE_PER_RECIPIENT, MAX_AMOUNT, MAX_RECIPIENTS, MIN_AMOUNT } from "./constants";
import { newBatchExternalId, newIdempotencyKey, newProofCode } from "./ids";

const bankCodes = BANKS.map((b) => b.code) as [string, ...string[]];

export const recipientInput = z.object({
  name: z.string().trim().min(2, "Nama penerima minimal 2 huruf").max(80),
  bankCode: z.enum(bankCodes, { errorMap: () => ({ message: "Bank tidak didukung" }) }),
  accountNumber: z
    .string()
    .trim()
    .regex(/^[0-9]{6,20}$/, "Nomor rekening harus 6 sampai 20 digit angka"),
  amount: z.coerce
    .number()
    .int("Nominal harus bilangan bulat")
    .min(MIN_AMOUNT, `Nominal minimal Rp${MIN_AMOUNT.toLocaleString("id-ID")}`)
    .max(MAX_AMOUNT, `Nominal maksimal Rp${MAX_AMOUNT.toLocaleString("id-ID")}`),
});

export const createBatchInput = z.object({
  // Prototipe belum punya login: pengirim diambil dari email ini (default akun demo).
  senderEmail: z.string().email().default("demo@bayarrapi.test"),
  recipients: z
    .array(recipientInput)
    .min(1, "Minimal 1 penerima")
    .max(MAX_RECIPIENTS, `Maksimal ${MAX_RECIPIENTS} penerima per batch`),
});

export type CreateBatchInput = z.infer<typeof createBatchInput>;

export function calcTotals(amounts: number[]) {
  const totalAmount = amounts.reduce((s, a) => s + a, 0);
  const feeAmount = FEE_PER_RECIPIENT * amounts.length;
  return { totalAmount, feeAmount, grandTotal: totalAmount + feeAmount };
}

export async function createBatch(input: CreateBatchInput) {
  const sender = await db.sender.upsert({
    where: { email: input.senderEmail },
    update: {},
    create: { name: input.senderEmail.split("@")[0], email: input.senderEmail },
  });

  const { totalAmount, feeAmount } = calcTotals(input.recipients.map((r) => r.amount));

  return db.batch.create({
    data: {
      senderId: sender.id,
      externalId: newBatchExternalId(),
      totalAmount,
      feeAmount,
      recipients: {
        create: input.recipients.map((r) => ({
          name: r.name,
          bankCode: r.bankCode,
          accountNumber: r.accountNumber,
          amount: r.amount,
          idempotencyKey: newIdempotencyKey(),
          proofCode: newProofCode(),
        })),
      },
    },
    include: { recipients: true },
  });
}
