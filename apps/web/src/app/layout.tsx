import type { Metadata } from "next";
import Link from "next/link";
import { paymentMode } from "@/lib/env";
import { LogoMark, Wordmark } from "@/components/Logo";
import NavLinks from "@/components/NavLinks";
import "./globals.css";

export const metadata: Metadata = {
  title: "BayarRapi",
  description: "Bayar sekali, teruskan ke banyak rekening, dengan bukti on-chain.",
};

function modeLabel(): { text: string; tone: string } {
  try {
    return paymentMode() === "xendit"
      ? { text: "Xendit test mode", tone: "blue" }
      : { text: "Mode simulasi", tone: "amber" };
  } catch {
    return { text: "Konfigurasi .env belum valid", tone: "red" };
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const mode = modeLabel();
  return (
    <html lang="id">
      <body>
        <header className="topbar">
          <div className="topbar-inner">
            <Link href="/" className="brand">
              <LogoMark size={32} animated />
              <Wordmark />
            </Link>
            <NavLinks />
            <span className={`mode-pill tone-${mode.tone}`}>
              <i className="pulse-dot" />
              Sandbox · {mode.text}
            </span>
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="footer">
          <div className="footer-inner">
            <div className="footer-brand">
              <LogoMark size={28} />
              <div>
                <Wordmark />
                <div className="muted small">Bayar sekali, teruskan ke banyak rekening.</div>
              </div>
            </div>
            <div className="muted small">
              Prototipe Kelompok 3, Teknologi Blockchain dan Platform Keuangan Dijital. Tidak ada uang nyata.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
