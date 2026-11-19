"use client";

import { useState } from "react";

export default function PayButton({ batchId, label }: { batchId: string; label: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/batches/${batchId}/checkout`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal membuat invoice.");
        return;
      }
      window.location.href = data.invoiceUrl;
    } catch {
      setError("Tidak bisa menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button type="button" className="btn btn-lg" onClick={pay} disabled={loading} style={{ width: "100%" }}>
        {loading ? "Membuat invoice..." : label}
      </button>
      {error && (
        <div className="alert alert-error" style={{ marginTop: 10, marginBottom: 0 }}>
          {error}
        </div>
      )}
    </div>
  );
}
