// Data dummy untuk demo. Jalankan: npm run db:seed
// Semua nama dan nomor rekening fiktif.
import { PrismaClient } from "@prisma/client";
import { newIdempotencyKey, newProofCode } from "../src/lib/ids";
import { FEE_PER_RECIPIENT } from "../src/lib/constants";

const db = new PrismaClient();

const DEMO_EXTERNAL_ID = "BR-DEMO-0001";

const recipients = [
  { name: "Reseller Andi", bankCode: "BCA", accountNumber: "1234567890", amount: 150_000 },
  { name: "Reseller Budi", bankCode: "BRI", accountNumber: "0987654321", amount: 275_000 },
  { name: "Mitra Citra", bankCode: "MANDIRI", accountNumber: "1122334455", amount: 500_000 },
];

async function main() {
  const sender = await db.sender.upsert({
    where: { email: "demo@bayarrapi.test" },
    update: {},
    create: { name: "Toko Rapi Dummy", email: "demo@bayarrapi.test" },
  });

  // Hapus batch demo lama supaya seed bisa dijalankan berulang
  await db.batch.deleteMany({ where: { externalId: DEMO_EXTERNAL_ID } });

  const totalAmount = recipients.reduce((sum, r) => sum + r.amount, 0);

  const batch = await db.batch.create({
    data: {
      senderId: sender.id,
      externalId: DEMO_EXTERNAL_ID,
      totalAmount,
      feeAmount: FEE_PER_RECIPIENT * recipients.length,
      recipients: {
        create: recipients.map((r) => ({
          ...r,
          idempotencyKey: newIdempotencyKey(),
          proofCode: newProofCode(),
        })),
      },
    },
    include: { recipients: true },
  });

  console.log(`Sender: ${sender.name} (${sender.email})`);
  console.log(`Batch ${batch.externalId}: ${batch.recipients.length} penerima, total Rp${totalAmount}`);
  for (const r of batch.recipients) {
    console.log(`  - ${r.name} | ${r.bankCode} ${r.accountNumber} | Rp${r.amount} | kode bukti ${r.proofCode}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
