import type { Metadata } from "next";
import Link from "next/link";
import { paymentMode } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  title: "BayarRapi",
  description: "Bayar sekali, teruskan ke banyak rekening, dengan bukti on-chain.",
};

function modeLabel(): string {
  try {
    return paymentMode() === "xendit" ? "Xendit test mode" : "Mode simulasi";
  } catch {
    return "Konfigurasi .env belum valid";
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <header className="topbar">
          <div className="topbar-inner">
            <Link href="/" className="brand">
              <span className="brand-mark">BR</span>
              BayarRapi
            </Link>
            <nav className="nav">
              <Link href="/batches">Dashboard</Link>
              <Link href="/batches/new">Buat batch</Link>
              <Link href="/proof">Cek bukti</Link>
              <Link href="/reports">Laporan</Link>
            </nav>
            <span className="mode-pill">SANDBOX · {modeLabel()}</span>
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="footer">
          Prototipe Kelompok 3, Teknologi Blockchain dan Platform Keuangan Dijital. Tidak ada uang nyata.
        </footer>
      </body>
    </html>
  );
}
