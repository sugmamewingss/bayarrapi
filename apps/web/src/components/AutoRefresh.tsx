"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Memuat ulang data halaman secara berkala selama proses masih berjalan.
export default function AutoRefresh({ active, ms = 3000 }: { active: boolean; ms?: number }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => router.refresh(), ms);
    return () => clearInterval(t);
  }, [active, ms, router]);
  return null;
}
