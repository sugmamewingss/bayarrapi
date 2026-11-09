import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BayarRapi",
  description: "Bayar sekali, teruskan ke banyak rekening, dengan bukti on-chain.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <header className="topbar">
          <a href="/" className="brand">BayarRapi</a>
          <span className="badge">SANDBOX</span>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
