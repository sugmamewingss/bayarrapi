"use client";

import { useEffect, useRef, useState } from "react";

// Angka yang menghitung naik saat halaman dibuka.
export default function CountUp({ value, format = "number" }: { value: number; format?: "number" | "rupiah" }) {
  const [shown, setShown] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const duration = 1100;
    const t0 = performance.now();
    let frame = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(value * eased));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  const text =
    format === "rupiah"
      ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(shown)
      : new Intl.NumberFormat("id-ID").format(shown);
  return <span>{text}</span>;
}
