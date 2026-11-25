"use client";

import { useState } from "react";
import Link from "next/link";
import Icon from "./Icon";

type Plan = "transfer" | "business" | null;

const BUSINESS = [
  { text: "Impor dari spreadsheet", ready: true },
  { text: "Laporan dan ekspor rekonsiliasi", ready: true },
  { text: "Persetujuan dua lapis", ready: false },
  { text: "Jadwal kirim berulang", ready: false },
  { text: "Notifikasi WhatsApp ke penerima", ready: false },
];

// Pilihan paket di halaman depan. Hanya paket per transfer yang bisa dipakai
// di prototipe; Paket Bisnis ditampilkan sebagai rencana (roadmap).
export default function PricingPicker({ fee }: { fee: string }) {
  const [plan, setPlan] = useState<Plan>(null);
  const canSend = plan === "transfer";
  const hint =
    plan === "business"
      ? "Paket Bisnis belum tersedia untuk saat ini. Pilih paket Per transfer untuk mulai kirim."
      : "Pilih paket Per transfer terlebih dahulu.";

  return (
    <>
      <div className="grid grid-2" role="radiogroup" aria-label="Pilih paket">
        <button
          type="button"
          role="radio"
          aria-checked={plan === "transfer"}
          className={`card price-card selectable${plan === "transfer" ? " selected" : ""}`}
          onClick={() => setPlan("transfer")}
        >
          <span className="radio-mark" aria-hidden="true" />
          <div className="price-name">
            Per transfer <span className="badge tone-green">Tersedia</span>
          </div>
          <div className="price-value">
            {fee}
            <span> / penerima</span>
          </div>
          <p className="muted" style={{ marginBottom: 0 }}>
            Dikembalikan penuh jika transfer gagal. Biaya metode bayar mengikuti tarif penyedia.
          </p>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={plan === "business"}
          className={`card price-card selectable${plan === "business" ? " selected" : ""}`}
          onClick={() => setPlan("business")}
        >
          <span className="radio-mark" aria-hidden="true" />
          <div className="price-name">
            Paket Bisnis <span className="badge tone-amber">Segera hadir</span>
          </div>
          <div className="price-value">
            Rp 149.000
            <span> / bulan</span>
          </div>
          <ul className="check-list">
            {BUSINESS.map((b) => (
              <li key={b.text} className={b.ready ? undefined : "todo"}>
                <Icon name={b.ready ? "check" : "clock"} size={16} /> {b.text}
                <span className={`mini-tag ${b.ready ? "ready" : ""}`}>{b.ready ? "Sudah ada" : "Roadmap"}</span>
              </li>
            ))}
          </ul>
        </button>
      </div>

      <div className={`send-cta${canSend ? " ready" : ""}`}>
        {canSend ? (
          <Link href="/batches/new" className="btn btn-lg btn-block">
            Mulai kirim <Icon name="arrow" size={18} />
          </Link>
        ) : (
          <span className="btn btn-lg btn-block btn-off" aria-disabled="true" tabIndex={0} aria-describedby="send-hint">
            Mulai kirim <Icon name="arrow" size={18} />
          </span>
        )}
        {!canSend && (
          <span className={`send-tip${plan === "business" ? " warn" : ""}`} id="send-hint" role="tooltip">
            {hint}
          </span>
        )}
      </div>
    </>
  );
}
