import Link from "next/link";
import { formatRupiah } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { buildReconciliation } from "@/lib/reports";
import { BatchStatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams;
  const from = sp.from && DATE.test(sp.from) ? sp.from : undefined;
  const to = sp.to && DATE.test(sp.to) ? sp.to : undefined;
  const rows = await buildReconciliation(from, to);

  const total = (k: "invoiceAmount" | "succeededAmount" | "failedAmount" | "fee" | "xenditCost" | "margin") =>
    rows.reduce((t, r) => t + r[k], 0);
  const qs = new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}), format: "csv" });

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Laporan rekonsiliasi</h1>
          <p className="muted" style={{ margin: 0 }}>
            Mencocokkan uang masuk, hasil payout, fee, dan catatan on-chain per batch.
          </p>
        </div>
      </div>

      <form className="card" method="get" style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div>
          <label htmlFor="from">Dari</label>
          <input id="from" name="from" type="date" defaultValue={from ?? ""} />
        </div>
        <div>
          <label htmlFor="to">Sampai</label>
          <input id="to" name="to" type="date" defaultValue={to ?? ""} />
        </div>
        <button type="submit" className="btn">
          Tampilkan
        </button>
        <a className="btn btn-secondary" href={`/api/reports/reconciliation?${qs.toString()}`}>
          Unduh CSV
        </a>
      </form>

      <section className="grid grid-3" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="stat-label">Uang masuk</div>
          <div className="stat-value">{formatRupiah(total("invoiceAmount"))}</div>
        </div>
        <div className="card">
          <div className="stat-label">Terkirim ke penerima</div>
          <div className="stat-value">{formatRupiah(total("succeededAmount"))}</div>
        </div>
        <div className="card">
          <div className="stat-label">Wajib refund (gagal kirim)</div>
          <div className="stat-value">{formatRupiah(total("failedAmount"))}</div>
        </div>
        <div className="card">
          <div className="stat-label">Fee BayarRapi</div>
          <div className="stat-value">{formatRupiah(total("fee"))}</div>
        </div>
        <div className="card">
          <div className="stat-label">Biaya payout Xendit</div>
          <div className="stat-value">{formatRupiah(total("xenditCost"))}</div>
        </div>
        <div className="card">
          <div className="stat-label">Margin transaksi</div>
          <div className="stat-value">{formatRupiah(total("margin"))}</div>
        </div>
      </section>

      <section className="card" style={{ padding: 0, marginTop: 16 }}>
        {rows.length === 0 ? (
          <div className="empty">Belum ada batch yang dibayar pada rentang ini.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Status</th>
                  <th>Dibayar</th>
                  <th className="num">Uang masuk</th>
                  <th className="num">Terkirim</th>
                  <th className="num">Gagal</th>
                  <th className="num">Margin</th>
                  <th>On-chain</th>
                  <th>Cocok</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.batchId}>
                    <td>
                      <Link href={`/batches/${r.batchId}`} className="mono">
                        {r.externalId}
                      </Link>
                    </td>
                    <td>
                      <BatchStatusBadge status={r.status} />
                    </td>
                    <td className="small">{formatDateTime(r.paidAt)}</td>
                    <td className="num">{formatRupiah(r.invoiceAmount)}</td>
                    <td className="num">{formatRupiah(r.succeededAmount)}</td>
                    <td className="num">{formatRupiah(r.failedAmount)}</td>
                    <td className="num">{formatRupiah(r.margin)}</td>
                    <td className="small">{r.onChain}</td>
                    <td title={r.note}>
                      <span className={`badge ${r.match ? "tone-green" : "tone-amber"}`}>{r.match ? "Cocok" : "Cek"}</span>
                      {r.note && <div className="muted small">{r.note}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
