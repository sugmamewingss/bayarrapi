"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RetryChainButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function retry() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/chain/retry", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    setMsg(res.ok ? "Antrean on-chain diproses ulang." : (data.error ?? "Gagal"));
    router.refresh();
  }

  return (
    <div>
      <button type="button" className="btn btn-secondary btn-sm" onClick={retry} disabled={busy}>
        {busy ? "Memproses..." : "Ulangi pencatatan on-chain"}
      </button>
      {msg && <p className="muted small">{msg}</p>}
    </div>
  );
}
