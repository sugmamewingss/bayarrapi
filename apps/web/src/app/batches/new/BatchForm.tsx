"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BANKS, FEE_PER_RECIPIENT, MAX_RECIPIENTS, formatRupiah } from "@/lib/constants";

type Row = { name: string; bankCode: string; accountNumber: string; amount: string };

const emptyRow = (): Row => ({ name: "", bankCode: "BCA", accountNumber: "", amount: "" });

// Data contoh untuk demo. Semua nama dan nomor rekening fiktif.
const SAMPLE: Row[] = [
  { name: "Reseller Andi", bankCode: "BCA", accountNumber: "1234567890", amount: "150000" },
  { name: "Reseller Budi", bankCode: "BRI", accountNumber: "0987654321", amount: "275000" },
  { name: "Mitra Citra", bankCode: "MANDIRI", accountNumber: "1122334455", amount: "500000" },
  { name: "Reseller Dewi", bankCode: "BNI", accountNumber: "5566778899", amount: "125000" },
  { name: "Mitra Eko", bankCode: "CIMB", accountNumber: "7788990011", amount: "300000" },
];

export default function BatchForm() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [csv, setCsv] = useState("");
  const [showCsv, setShowCsv] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const amounts = rows.map((r) => Number(r.amount) || 0);
  const subtotal = amounts.reduce((s, a) => s + a, 0);
  const filled = rows.filter((r) => r.name || r.accountNumber || r.amount).length;
  const fee = FEE_PER_RECIPIENT * filled;

  function update(i: number, field: keyof Row, value: string) {
    setRows((prev) => prev.map((r, k) => (k === i ? { ...r, [field]: value } : r)));
  }

  function addRow() {
    if (rows.length < MAX_RECIPIENTS) setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(i: number) {
    setRows((prev) => (prev.length === 1 ? [emptyRow()] : prev.filter((_, k) => k !== i)));
  }

  // Format tiap baris: nama,bank,nomor rekening,nominal
  function importCsv() {
    const parsed: Row[] = csv
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.toLowerCase().startsWith("nama"))
      .map((line) => {
        const [name = "", bank = "", acc = "", amt = ""] = line.split(/[,;\t]/).map((c) => c.trim());
        return { name, bankCode: bank.toUpperCase(), accountNumber: acc.replace(/\D/g, ""), amount: amt.replace(/\D/g, "") };
      });
    if (parsed.length === 0) {
      setErrors(["Tidak ada baris yang bisa dibaca dari teks CSV."]);
      return;
    }
    setRows(parsed.slice(0, MAX_RECIPIENTS));
    setShowCsv(false);
    setCsv("");
    setErrors([]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
    const recipients = rows
      .filter((r) => r.name || r.accountNumber || r.amount)
      .map((r) => ({ ...r, amount: Number(r.amount) }));
    if (recipients.length === 0) {
      setErrors(["Isi minimal 1 penerima."]);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients }),
      });
      const data = await res.json();
      if (!res.ok) {
        const issues: { path: (string | number)[]; message: string }[] = data.issues ?? [];
        setErrors(
          issues.length
            ? issues.map((i) => (i.path[0] === "recipients" ? `Penerima #${Number(i.path[1]) + 1}: ${i.message}` : i.message))
            : [data.error ?? "Gagal membuat batch."],
        );
        return;
      }
      router.push(`/batches/${data.id}`);
    } catch {
      setErrors(["Tidak bisa menghubungi server."]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid" style={{ gridTemplateColumns: "minmax(0, 1fr) 300px", alignItems: "start" }}>
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0 }}>Daftar penerima</h2>
          <div className="row-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRows(SAMPLE)}>
              Isi data contoh
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCsv((v) => !v)}>
              Tempel dari spreadsheet
            </button>
          </div>
        </div>

        {showCsv && (
          <div style={{ padding: "0 20px 16px" }}>
            <label htmlFor="csv">Satu penerima per baris: nama, bank, nomor rekening, nominal</label>
            <textarea
              id="csv"
              rows={5}
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              placeholder={"Reseller Andi,BCA,1234567890,150000\nMitra Citra,MANDIRI,1122334455,500000"}
            />
            <div className="row-actions" style={{ marginTop: 8 }}>
              <button type="button" className="btn btn-sm" onClick={importCsv}>
                Masukkan ke tabel
              </button>
            </div>
          </div>
        )}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 36 }}>#</th>
                <th>Nama penerima</th>
                <th style={{ width: 150 }}>Bank</th>
                <th style={{ width: 170 }}>Nomor rekening</th>
                <th style={{ width: 150 }}>Nominal (Rp)</th>
                <th style={{ width: 44 }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td className="muted">{i + 1}</td>
                  <td>
                    <input value={r.name} onChange={(e) => update(i, "name", e.target.value)} placeholder="Nama sesuai rekening" />
                  </td>
                  <td>
                    <select value={r.bankCode} onChange={(e) => update(i, "bankCode", e.target.value)}>
                      {BANKS.map((b) => (
                        <option key={b.code} value={b.code}>
                          {b.code}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      value={r.accountNumber}
                      inputMode="numeric"
                      onChange={(e) => update(i, "accountNumber", e.target.value.replace(/\D/g, ""))}
                      placeholder="1234567890"
                    />
                  </td>
                  <td>
                    <input
                      value={r.amount}
                      inputMode="numeric"
                      onChange={(e) => update(i, "amount", e.target.value.replace(/\D/g, ""))}
                      placeholder="100000"
                    />
                  </td>
                  <td>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => removeRow(i)} aria-label={`Hapus penerima ${i + 1}`}>
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "12px 20px 16px" }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={addRow} disabled={rows.length >= MAX_RECIPIENTS}>
            + Tambah penerima
          </button>
          <span className="muted small" style={{ marginLeft: 12 }}>
            Maksimal {MAX_RECIPIENTS} penerima per batch.
          </span>
        </div>
      </div>

      <aside className="card">
        <h3>Ringkasan</h3>
        <div className="summary-line">
          <span className="muted">Penerima</span>
          <span>{filled}</span>
        </div>
        <div className="summary-line">
          <span className="muted">Total ke penerima</span>
          <span>{formatRupiah(subtotal)}</span>
        </div>
        <div className="summary-line">
          <span className="muted">Fee ({formatRupiah(FEE_PER_RECIPIENT)} x {filled})</span>
          <span>{formatRupiah(fee)}</span>
        </div>
        <div className="summary-line summary-total">
          <span>Total dibayar</span>
          <span>{formatRupiah(subtotal + fee)}</span>
        </div>

        {errors.length > 0 && (
          <div className="alert alert-error" style={{ marginTop: 12 }}>
            {errors.map((e) => (
              <div key={e}>{e}</div>
            ))}
          </div>
        )}

        <button type="submit" className="btn btn-lg" style={{ width: "100%", marginTop: 12 }} disabled={submitting}>
          {submitting ? "Menyimpan..." : "Simpan batch"}
        </button>
        <p className="muted small" style={{ marginTop: 10, marginBottom: 0 }}>
          Batch disimpan sebagai draf. Pembayaran dilakukan di langkah berikutnya.
        </p>
      </aside>
    </form>
  );
}
