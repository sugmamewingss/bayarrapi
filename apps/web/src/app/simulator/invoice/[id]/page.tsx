import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/constants";
import SimulatorActions from "./SimulatorActions";
import { LogoMark, Wordmark } from "@/components/Logo";

export const dynamic = "force-dynamic";

// Halaman pembayaran tiruan untuk mode simulasi.
// Meniru halaman invoice Xendit supaya alur bisa didemokan tanpa akun Xendit.
export default async function SimulatorInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const batch = await db.batch.findUnique({ where: { id }, include: { _count: { select: { recipients: true } } } });
  if (!batch) notFound();

  const amount = batch.totalAmount + batch.feeAmount;
  // Nomor VA tiruan, diturunkan dari ID batch.
  const va = "8808" + batch.externalId.replace(/\D/g, "").padEnd(12, "0").slice(0, 12);

  return (
    <div className="pay-shell">
      <div className="alert alert-info">Ini halaman pembayaran simulasi. Tidak ada uang yang berpindah.</div>
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <LogoMark size={30} />
          <Wordmark />
        </div>
        <p className="muted small" style={{ marginBottom: 0 }}>
          Total tagihan
        </p>
        <div className="pay-amount">{formatRupiah(amount)}</div>
        <div className="summary-line">
          <span className="muted">ID invoice</span>
          <span className="mono">{batch.externalId}</span>
        </div>
        <div className="summary-line">
          <span className="muted">Jumlah penerima</span>
          <span>{batch._count.recipients}</span>
        </div>
        <div className="va-box" style={{ marginTop: 12 }}>
          <div className="muted small">Virtual Account (simulasi)</div>
          <div className="mono" style={{ fontSize: 18, fontWeight: 700 }}>
            {va}
          </div>
        </div>
        {batch.status === "PENDING_PAYMENT" ? (
          <SimulatorActions batchId={batch.id} />
        ) : (
          <div className="alert alert-success" style={{ marginBottom: 0 }}>
            Invoice ini sudah diproses. <Link href={`/batches/${batch.id}`}>Lihat batch</Link>
          </div>
        )}
      </div>
    </div>
  );
}
