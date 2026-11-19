import Link from "next/link";
import { db } from "@/lib/db";
import { formatRupiah } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { BatchStatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

const PAID_STATUSES = ["FUNDED", "DISBURSING", "COMPLETED", "PARTIAL_FAILED"];

export default async function BatchesPage() {
  const batches = await db.batch.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { recipients: true } } },
  });

  const paid = batches.filter((b) => PAID_STATUSES.includes(b.status));
  const totalAllocated = paid.reduce((s, b) => s + b.totalAmount, 0);
  const totalRecipients = paid.reduce((s, b) => s + b._count.recipients, 0);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Dashboard batch</h1>
          <p className="muted" style={{ marginBottom: 0 }}>
            Semua batch kirim milik akun demo.
          </p>
        </div>
        <Link href="/batches/new" className="btn">
          + Buat batch
        </Link>
      </div>

      <section className="grid grid-3" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="stat-label">Total batch</div>
          <div className="stat-value">{batches.length}</div>
        </div>
        <div className="card">
          <div className="stat-label">Dana sudah dibayar ke BayarRapi</div>
          <div className="stat-value">{formatRupiah(totalAllocated)}</div>
        </div>
        <div className="card">
          <div className="stat-label">Penerima dari batch terbayar</div>
          <div className="stat-value">{totalRecipients}</div>
        </div>
      </section>

      <section className="card" style={{ padding: 0 }}>
        {batches.length === 0 ? (
          <div className="empty">
            <p>Belum ada batch.</p>
            <Link href="/batches/new" className="btn">
              Buat batch pertama
            </Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID batch</th>
                  <th>Dibuat</th>
                  <th className="num">Penerima</th>
                  <th className="num">Total ke penerima</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <Link href={`/batches/${b.id}`} className="mono">
                        {b.externalId}
                      </Link>
                    </td>
                    <td className="muted">{formatDateTime(b.createdAt)}</td>
                    <td className="num">{b._count.recipients}</td>
                    <td className="num">{formatRupiah(b.totalAmount)}</td>
                    <td>
                      <BatchStatusBadge status={b.status} />
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
