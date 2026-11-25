"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Menanyakan status ke Xendit lewat server: otomatis tiap 5 detik selama proses
// berjalan, dan bisa dipicu manual. Berguna jika webhook belum bisa diterima.
export default function XenditSync({ batchId, active }: { batchId: string; active: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const sync = useCallback(async () => {
    setBusy(true);
    const res = await fetch(`/api/batches/${batchId}/sync`, { method: "POST" }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setBusy(false);
    setMsg(res?.ok ? null : (data.error ?? "Tidak bisa menghubungi Xendit"));
    router.refresh();
  }, [batchId, router]);

  useEffect(() => {
    if (!active) return;
    const t = setInterval(sync, 5000);
    return () => clearInterval(t);
  }, [active, sync]);

  return (
    <div style={{ marginTop: 12 }}>
      <button type="button" className="btn btn-secondary btn-sm" onClick={sync} disabled={busy}>
        {busy ? "Mengecek..." : "Cek status ke Xendit"}
      </button>
      {msg && <p className="small" style={{ color: "var(--red)" }}>{msg}</p>}
    </div>
  );
}
