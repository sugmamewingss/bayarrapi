import Link from "next/link";
import { db } from "@/lib/db";
import { FEE_PER_RECIPIENT, formatRupiah } from "@/lib/constants";
import { env } from "@/lib/env";
import FlowHero from "@/components/FlowHero";
import CountUp from "@/components/CountUp";
import Icon from "@/components/Icon";
import PricingPicker from "@/components/PricingPicker";

export const dynamic = "force-dynamic";

const STEPS = [
  { icon: "upload", title: "Unggah daftar penerima", text: "Ketik nama, bank, rekening, dan nominal, atau tempel langsung dari spreadsheet." },
  { icon: "wallet", title: "Bayar sekali", text: "Satu invoice untuk semua penerima lewat QRIS, virtual account, atau e-wallet." },
  { icon: "split", title: "Dana diteruskan otomatis", text: "Tiap penerima dikirimi dana dan kode bukti yang bisa dicek sendiri." },
];

const FEATURES = [
  { icon: "shield", title: "Bukti on-chain", text: "Hash bukti tiap pencairan dicatat ke smart contract. Penerima bisa memverifikasi tanpa harus percaya pada kami." },
  { icon: "chart", title: "Rekonsiliasi otomatis", text: "Uang masuk, terkirim, refund, dan fee selalu dicocokkan per batch, lengkap dengan ekspor CSV." },
  { icon: "refund", title: "Refund otomatis", text: "Transfer yang gagal dikembalikan penuh ke pengirim, termasuk fee-nya." },
  { icon: "bolt", title: "Aman dari dobel proses", text: "Webhook diverifikasi token, setiap payout punya idempotency key, notifikasi ganda diabaikan." },
];

export default async function HomePage() {
  const [batches, delivered, recorded, sum] = await Promise.all([
    db.batch.count(),
    db.recipient.count({ where: { status: "SUCCEEDED" } }),
    db.recipient.count({ where: { OR: [{ chainTxHash: { not: null } }, { proofHash: { not: null } }] } }),
    db.recipient.aggregate({ where: { status: "SUCCEEDED" }, _sum: { amount: true } }),
  ]);
  const contract = env().LEDGER_CONTRACT_ADDRESS;

  return (
    <>
      <section className="hero-grid">
        <div className="hero-copy">
          <span className="eyebrow">
            <i className="pulse-dot" /> Prototipe · Xendit test mode + Ethereum Sepolia
          </span>
          <h1 className="hero-title">
            Bayar sekali, <mark>teruskan</mark> ke banyak rekening.
          </h1>
          <p className="lead">
            Untuk pemilik usaha yang rutin membayar komisi reseller, bagi hasil mitra, atau dana panitia. Tidak perlu
            transfer satu per satu, tidak perlu kirim screenshot sebagai bukti.
          </p>
          <div className="row-actions">
            <Link href="/batches/new" className="btn btn-lg">
              Buat batch kirim <Icon name="arrow" size={18} />
            </Link>
            <Link href="/proof" className="btn btn-secondary btn-lg">
              <Icon name="search" size={18} /> Cek bukti penerima
            </Link>
          </div>
          <ul className="trust-row">
            <li>
              <Icon name="check" size={16} /> {formatRupiah(FEE_PER_RECIPIENT)} per penerima
            </li>
            <li>
              <Icon name="check" size={16} /> Refund otomatis jika gagal
            </li>
            <li>
              <Icon name="check" size={16} /> Tanpa integrasi API
            </li>
          </ul>
        </div>
        <div className="hero-visual">
          <FlowHero />
        </div>
      </section>

      <section className="stats-band">
        <div>
          <div className="stats-value">
            <CountUp value={batches} />
          </div>
          <div className="stats-label">Batch dibuat</div>
        </div>
        <div>
          <div className="stats-value">
            <CountUp value={delivered} />
          </div>
          <div className="stats-label">Transfer berhasil</div>
        </div>
        <div>
          <div className="stats-value">
            <CountUp value={sum._sum.amount ?? 0} format="rupiah" />
          </div>
          <div className="stats-label">Dana diteruskan</div>
        </div>
        <div>
          <div className="stats-value">
            <CountUp value={recorded} />
          </div>
          <div className="stats-label">Bukti tercatat on-chain</div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <span className="kicker">Cara kerja</span>
          <h2>Tiga langkah, selesai dalam hitungan menit</h2>
        </div>
        <div className="how-grid">
          {STEPS.map((s, i) => (
            <div className="how-step" key={s.title}>
              <div className="how-icon">
                <Icon name={s.icon} size={22} />
                <span className="how-num">{i + 1}</span>
              </div>
              <h3>{s.title}</h3>
              <p className="muted">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <span className="kicker">Kenapa BayarRapi</span>
          <h2>Bukan sekadar transfer massal</h2>
        </div>
        <div className="grid grid-2">
          {FEATURES.map((f) => (
            <div className="card feature-card" key={f.title}>
              <div className="icon-bubble">
                <Icon name={f.icon} size={22} />
              </div>
              <div>
                <h3>{f.title}</h3>
                <p className="muted" style={{ marginBottom: 0 }}>
                  {f.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <span className="kicker">Biaya</span>
          <h2>Murah per transfer, lengkap untuk bisnis</h2>
        </div>
        <PricingPicker fee={formatRupiah(FEE_PER_RECIPIENT)} />
      </section>

      {contract && (
        <section className="card contract-card">
          <div className="icon-bubble amber">
            <Icon name="link" size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ marginBottom: 2 }}>Smart contract terverifikasi</h3>
            <p className="muted small mono" style={{ margin: 0, wordBreak: "break-all" }}>
              BayarRapiLedger · {contract}
            </p>
          </div>
          <a
            className="btn btn-secondary btn-sm"
            href={`https://sepolia.etherscan.io/address/${contract}#code`}
            target="_blank"
            rel="noreferrer"
          >
            Lihat di Etherscan <Icon name="external" size={15} />
          </a>
        </section>
      )}

      <section className="cta-band">
        <div>
          <h2>Siap kirim ke banyak rekening sekaligus?</h2>
          <p>Coba dengan data contoh. Semua transaksi di prototipe ini memakai uang uji coba.</p>
        </div>
        <Link href="/batches/new" className="btn btn-light btn-lg">
          Buat batch pertama <Icon name="arrow" size={18} />
        </Link>
      </section>
    </>
  );
}
