"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/batches", label: "Dashboard", match: (p: string) => p === "/batches" || /^\/batches\/(?!new)/.test(p) },
  { href: "/batches/new", label: "Buat batch", match: (p: string) => p === "/batches/new" },
  { href: "/proof", label: "Cek bukti", match: (p: string) => p.startsWith("/proof") },
  { href: "/reports", label: "Laporan", match: (p: string) => p.startsWith("/reports") },
];

export default function NavLinks() {
  const pathname = usePathname() ?? "/";
  return (
    <nav className="nav">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className={l.match(pathname) ? "active" : undefined}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
