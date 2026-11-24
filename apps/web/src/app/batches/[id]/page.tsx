import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { FEE_PER_RECIPIENT, formatRupiah } from "@/lib/constants";
import { bankName, formatDateTime, maskAccount } from "@/lib/format";
import { BATCH_STEPS } from "@/lib/status";
import { BatchStatusBadge, RecipientStatusBadge } from "@/components/StatusBadge";
import AutoRefresh from "@/components/AutoRefresh";
import RetryChainButton from "@/components/RetryChainButton";
import { chainEnabled, processChainJobs } from "@/lib/chain";
import PayButton from "./PayButton";

const TX_URL = "https://sepolia.etherscan.io/tx/";

export const dynamic = "force-dynamic";

function stepState(current: string, index: number): "done" | "current" | "todo" {
  const order = BATCH_STEPS.map((s) => s.key as string);
  // Status di luar alur utama dipetakan ke tahap terdekat.
  const mapped = current === "PARTIAL_FAILED" ? "COMPLETED" : current === "EXPIRED" ? "PENDING_PAYMENT" : current;
  const pos = order.indexOf(mapped);
  if (current === "COMPLETED" || index < pos) return "done";
  if (index === pos) return "current";
  return "todo";
}

export default async function BatchDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const { id } = await params;
  const { paid } = await searchParams;
  const batch = await db.batch.findUnique({
    where: { id },
    include: { recipients: { orderBy: { createdAt: "asc" } } },
  });
  if (!batch) notFound();

  const grandTotal = batch.totalAmount + batch.feeAmount;
  const onChain = chainEnabled();
  const jobs = await db.chainJob.findMany({
    where: { refId: { in: [batch.id, ...batch.recipients.map((r) => r.id)] } },
  });
  const queued = jobs.filter((j) => j.status === "QUEUED").length;
  const failedJobs = jobs.filter((j) => j.status === "FAILED");
  // Lanjutkan antrean yang tertinggal (misalnya setelah server dimatikan).
  if (onChain && queued > 0) void processChainJobs();
  const inProgress =
    ["PENDING_PAYMENT", "FUNDED", "DISBURSING"].includes(batch.status) || (onChain && queued > 0);
  const failedRecipients = batch.recipients.filter((r) => r.status === "FAILED");

  return (
    <>
      <AutoRefresh active={inProgress} />
      <div className="page-head">
        <div>
          <Link href="/batches" className="small">
            ← Kembali ke dashboard
          </Link>
          <h1 style={{ marginTop: 6 }}>
            <span className="mono" style={{ fontSize: 24 }}>
              {batch.externalId}
            </span>
          </h1>
          <div className="row-actions" style={{ alignItems: "center" }}>
            <BatchStatusBadge status={batch.status} />
            <span className="muted small">Dibuat {formatDateTime(batch.createdAt)}</span>
          </div>
        </div>
      </div>

      {paid && batch.status === "PENDING_PAYMENT" && (
        <div className="alert alert-info">Pembayaran sedang dikonfirmasi. Muat ulang halaman ini dalam beberapa detik.</div>
      )}
      {(batch.status === "FUNDED" || batch.status === "DISBURSING") && (
        <div className="alert alert-info">
          Pembayaran terverifikasi lewat webhook. Dana sedang dikirim ke tiap penerima; halaman ini diperbarui otomatis.
        </div>
      )}
      {batch.status === "COMPLETED" && (
        <div className="alert alert-success">Semua penerima sudah menerima dana.</div>
      )}
      {batch.status === "PARTIAL_FAILED" && (
        <div className="alert alert-error">
          {failedRecipients.length} penerima gagal dikirim. Nominal dan fee-nya dikembalikan ke pengirim: total{" "}
          {formatRupiah(failedRecipients.reduce((t, r) => t + r.amount + FEE_PER_RECIPIENT, 0))}. Tercatat di laporan
          rekonsiliasi.
        </div>
      )}
      {batch.status === "EXPIRED" && <div className="alert alert-error">Invoice kedaluwarsa. Buat batch baru untuk mencoba lagi.</div>}

      <section className="card">
        <h3>Tahap</h3>
        <ol className="steps">
          {BATCH_STEPS.map((s, i) => (
            <li key={s.key} className={`step ${stepState(batch.status, i)}`}>
              {i > 0 && <span className="step-sep" />}
              <span className="step-dot">{stepState(batch.status, i) === "done" ? "✓" : i + 1}</span>
              {s.label}
            </li>
          ))}
        </ol>
      </section>

      <section className="grid" style={{ gridTemplateColumns: "minmax(0, 1fr) 300px", alignItems: "start", marginTop: 16 }}>
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: "16px 20px" }}>
            <h2 style={{ margin: 0 }}>Penerima ({batch.recipients.length})</h2>
            <p className="muted small" style={{ margin: "4px 0 0" }}>
              Bagikan kode bukti ke tiap penerima supaya mereka bisa cek sendiri di halaman Cek bukti.
            </p>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Bank</th>
                  <th>Rekening</th>
                  <th className="num">Nominal</th>
                  <th>Status</th>
                  <th>Kode bukti</th>
                  <th>On-chain</th>
                </tr>
              </thead>
              <tbody>
                {batch.recipients.map((r) => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td title={bankName(r.bankCode)}>{r.bankCode}</td>
                    <td className="mono">{maskAccount(r.accountNumber)}</td>
                    <td className="num">{formatRupiah(r.amount)}</td>
                    <td>
                      <RecipientStatusBadge status={r.status} />
                      {r.failureCode && <div className="muted small mono">{r.failureCode}</div>}
                    </td>
                    <td>
                      <Link href={`/proof?code=${r.proofCode}`} className="mono">
                        {r.proofCode}
                      </Link>
                    </td>
                    <td className="small">
                      {r.chainTxHash ? (
                        <a href={`${TX_URL}${r.chainTxHash}`} target="_blank" rel="noreferrer">
                          Lihat tx
                        </a>
                      ) : r.proofHash ? (
                        "Tercatat"
                      ) : r.status === "SUCCEEDED" || r.status === "FAILED" ? (
                        <span className="muted">Antre</span>
                      ) : (
                        <span className="muted">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="card">
          <h3>Pembayaran</h3>
          <div className="summary-line">
            <span className="muted">Total ke penerima</span>
            <span>{formatRupiah(batch.totalAmount)}</span>
          </div>
          <div className="summary-line">
            <span className="muted">Fee BayarRapi</span>
            <span>{formatRupiah(batch.feeAmount)}</span>
          </div>
          <div className="summary-line summary-total">
            <span>Total dibayar</span>
            <span>{formatRupiah(grandTotal)}</span>
          </div>
          <div style={{ marginTop: 16 }}>
            {batch.status === "DRAFT" && <PayButton batchId={batch.id} label="Bayar sekarang" />}
            {batch.status === "PENDING_PAYMENT" && batch.invoiceUrl && (
              <a href={batch.invoiceUrl} className="btn btn-lg" style={{ width: "100%" }}>
                Lanjutkan pembayaran
              </a>
            )}
            {batch.paidAt && <p className="muted small">Dibayar {formatDateTime(batch.paidAt)}</p>}
          </div>
          {batch.xenditInvoiceId && (
            <p className="muted small" style={{ marginBottom: 0, wordBreak: "break-all" }}>
              ID invoice: <span className="mono">{batch.xenditInvoiceId}</span>
            </p>
          )}
          <h3 style={{ marginTop: 20 }}>Catatan blockchain</h3>
          {!onChain && <p className="muted small">Pencatatan on-chain nonaktif: isi variabel Sepolia di apps/web/.env.</p>}
          {batch.chainTxHash ? (
            <p className="small">
              <a href={`${TX_URL}${batch.chainTxHash}`} target="_blank" rel="noreferrer">
                Lihat catatan batch di Etherscan
              </a>
            </p>
          ) : (
            onChain && Boolean(batch.paidAt) && <p className="muted small">Batch sedang dicatat ke Sepolia...</p>
          )}
          {batch.recipientsHash && (
            <p className="muted small" style={{ wordBreak: "break-all" }}>
              Hash penerima: <span className="mono">{batch.recipientsHash}</span>
            </p>
          )}
          {onChain && queued > 0 && <p className="muted small">{queued} pencatatan dalam antrean.</p>}
          {onChain && failedJobs.length > 0 && (
            <>
              <p className="small" style={{ color: "var(--red)" }}>
                {failedJobs.length} pencatatan gagal. Terakhir: {failedJobs[0].lastError?.slice(0, 80)}
              </p>
              <RetryChainButton />
            </>
          )}
        </aside>
      </section>
    </>
  );
}
