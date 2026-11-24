import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/constants";
import { bankName, formatDateTime, maskAccount } from "@/lib/format";
import { BatchStatusBadge, RecipientStatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function ProofPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code: rawCode } = await searchParams;
  const code = rawCode?.trim().toUpperCase();
  const recipient = code
    ? await db.recipient.findUnique({ where: { proofCode: code }, include: { batch: true } })
    : null;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <h1>Cek bukti penerima</h1>
      <p className="muted">
        Masukkan kode bukti yang kamu terima dari pengirim. Kamu bisa melihat nominal yang dialokasikan untukmu tanpa
        perlu akun.
      </p>

      <form className="card" method="get" style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="code">Kode bukti</label>
          <input id="code" name="code" defaultValue={code ?? ""} placeholder="RAPI-XXXX-XXXX" className="mono" />
        </div>
        <button type="submit" className="btn">
          Cek
        </button>
      </form>

      {code && !recipient && (
        <div className="alert alert-error" style={{ marginTop: 16 }}>
          Kode {code} tidak ditemukan. Periksa lagi penulisannya.
        </div>
      )}

      {recipient && (
        <section className="card" style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
            <div>
              <div className="stat-label">Dialokasikan untuk</div>
              <h2 style={{ margin: 0 }}>{recipient.name}</h2>
            </div>
            <RecipientStatusBadge status={recipient.status} />
          </div>
          <div className="pay-amount" style={{ marginTop: 12 }}>
            {formatRupiah(recipient.amount)}
          </div>
          <div className="summary-line">
            <span className="muted">Rekening tujuan</span>
            <span>
              {bankName(recipient.bankCode)} <span className="mono">{maskAccount(recipient.accountNumber)}</span>
            </span>
          </div>
          <div className="summary-line">
            <span className="muted">Batch</span>
            <span className="mono">{recipient.batch.externalId}</span>
          </div>
          <div className="summary-line">
            <span className="muted">Status batch</span>
            <BatchStatusBadge status={recipient.batch.status} />
          </div>
          <div className="summary-line">
            <span className="muted">Pengirim membayar</span>
            <span>{formatDateTime(recipient.batch.paidAt)}</span>
          </div>

          <div className="va-box" style={{ marginTop: 16, marginBottom: 0 }}>
            <div className="small" style={{ fontWeight: 600 }}>
              Catatan blockchain
            </div>
            {recipient.chainTxHash ? (
              <a
                href={`https://sepolia.etherscan.io/tx/${recipient.chainTxHash}`}
                target="_blank"
                rel="noreferrer"
                className="small"
              >
                Lihat bukti pencairan di Etherscan (Sepolia)
              </a>
            ) : (
              <div className="muted small">Belum dicatat on-chain. Pencatatan aktif setelah modul blockchain terpasang.</div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
