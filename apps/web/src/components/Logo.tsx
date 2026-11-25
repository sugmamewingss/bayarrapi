// Logo BayarRapi "Satu ke banyak".
// Titik putih = pengirim; tiga garis yang menyebar rapi = satu pembayaran diteruskan
// ke banyak rekening; titik amber = bukti yang tercatat di blockchain.
export function LogoMark({ size = 32, animated = false }: { size?: number; animated?: boolean }) {
  return (
    <svg
      viewBox="0 0 160 160"
      width={size}
      height={size}
      className={animated ? "logo-mark logo-animated" : "logo-mark"}
      aria-hidden="true"
    >
      <rect width="160" height="160" rx="38" fill="#0F6E56" />
      <g fill="none" stroke="#FFFFFF" strokeWidth="9" strokeLinecap="round">
        <path className="logo-line" pathLength={100} d="M47 80 C73 80 73 36 107 36" />
        <path className="logo-line" pathLength={100} d="M47 80 L107 80" />
        <path className="logo-line" pathLength={100} d="M47 80 C73 80 73 124 107 124" />
      </g>
      <circle cx="43" cy="80" r="16" fill="#FFFFFF" />
      <circle className="logo-dot d1" cx="121" cy="36" r="11" fill="#5DCAA5" />
      <circle className="logo-dot d2" cx="121" cy="80" r="11" fill="#F2A93B" />
      <circle className="logo-dot d3" cx="121" cy="124" r="11" fill="#5DCAA5" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="wordmark">
      Bayar<span>Rapi</span>
    </span>
  );
}
