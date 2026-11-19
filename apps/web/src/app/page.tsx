import Link from "next/link";
import { FEE_PER_RECIPIENT, formatRupiah } from "@/lib/constants";

const steps = [
  {
    title: "Unggah daftar penerima",
    text: "Isi nama, bank, nomor rekening, dan nominal. Bisa ketik satu per satu atau tempel dari spreadsheet.",
  },
  {
    title: "Bayar sekali",
    text: "Satu invoice untuk semua penerima, lewat VA, QRIS, atau e-wallet.",
  },
  {
    title: "Dana diteruskan otomatis",
    text: "Tiap penerima dikirimi dana dan kode bukti yang bisa dicek sendiri ke catatan blockchain.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <span className="badge tone-green">Prototipe sandbox</span>
        <h1 style={{ marginTop: 12 }}>Bayar sekali, teruskan ke banyak rekening</h1>
        <p>
          Untuk pemilik usaha yang rutin membayar komisi reseller, bagi hasil mitra, atau dana panitia.
          Tidak perlu transfer satu per satu, tidak perlu kirim screenshot sebagai bukti.
        </p>
        <div className="row-actions" style={{ marginTop: 20 }}>
          <Link href="/batches/new" className="btn btn-lg">
            Buat batch kirim
          </Link>
          <Link href="/proof" className="btn btn-secondary btn-lg">
            Cek bukti penerima
          </Link>
        </div>
      </section>

      <section className="grid grid-3" style={{ marginTop: 24 }}>
        {steps.map((s, i) => (
          <div className="card" key={s.title}>
            <div className="feature-num">{i + 1}</div>
            <h3>{s.title}</h3>
            <p className="muted" style={{ marginBottom: 0 }}>
              {s.text}
            </p>
          </div>
        ))}
      </section>

      <section className="card" style={{ marginTop: 24 }}>
        <h2>Biaya</h2>
        <p className="muted" style={{ marginBottom: 0 }}>
          {formatRupiah(FEE_PER_RECIPIENT)} per penerima. Biaya metode pembayaran (VA, QRIS, e-wallet) mengikuti tarif
          penyedia pembayaran. Pada prototipe ini semua transaksi memakai mode sandbox dan data dummy.
        </p>
      </section>
    </>
  );
}
