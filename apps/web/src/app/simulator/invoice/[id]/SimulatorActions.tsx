"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SimulatorActions({ batchId }: { batchId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"PAID" | "EXPIRED" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send(result: "PAID" | "EXPIRED") {
    setLoading(result);
    setError(null);
    try {
      const res = await fetch(`/api/simulator/invoice/${batchId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Simulasi gagal.");
        return;
      }
      router.push(`/batches/${batchId}`);
      router.refresh();
    } catch {
      setError("Tidak bisa menghubungi server.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="grid" style={{ gap: 10 }}>
      <button type="button" className="btn btn-lg" onClick={() => send("PAID")} disabled={loading !== null}>
        {loading === "PAID" ? "Memproses..." : "Bayar sekarang (simulasi)"}
      </button>
      <button type="button" className="btn btn-secondary" onClick={() => send("EXPIRED")} disabled={loading !== null}>
        {loading === "EXPIRED" ? "Memproses..." : "Simulasikan invoice kedaluwarsa"}
      </button>
      {error && <div className="alert alert-error">{error}</div>}
    </div>
  );
}
