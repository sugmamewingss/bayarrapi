// Ilustrasi alur dana di halaman depan: satu pembayaran masuk ke BayarRapi,
// lalu mengalir ke banyak rekening; tiap penerima mendapat bukti on-chain.
// Animasi memakai SVG (animateMotion) dan CSS, tanpa JavaScript.
const RECIPIENTS = [
  { name: "Reseller Andi", bank: "BCA ··7890", amount: "Rp150.000", y: 66 },
  { name: "Reseller Budi", bank: "BRI ··4321", amount: "Rp275.000", y: 146 },
  { name: "Mitra Citra", bank: "Mandiri ··4455", amount: "Rp500.000", y: 226 },
  { name: "Mitra Eko", bank: "CIMB ··0011", amount: "Rp300.000", y: 306 },
];

function route(y: number) {
  return `M150 186 H296 C332 186 326 ${y} 362 ${y}`;
}

export default function FlowHero() {
  return (
    <svg viewBox="0 0 520 372" className="flow-hero" role="img" aria-label="Satu pembayaran diteruskan ke banyak rekening">
      <g className="flow-lines">
        {RECIPIENTS.map((r) => (
          <path key={r.y} d={route(r.y)} />
        ))}
      </g>
      {RECIPIENTS.map((r, i) => (
        <circle key={`dot-${r.y}`} r="5" className="flow-dot">
          <animateMotion dur="2.8s" repeatCount="indefinite" begin={`${i * 0.45}s`} path={route(r.y)} />
        </circle>
      ))}

      <g className="flow-card">
        <rect x="10" y="150" width="140" height="72" rx="14" />
        <text x="26" y="178" className="fc-title">Pengirim</text>
        <text x="26" y="200" className="fc-sub">Bayar 1x · QRIS/VA</text>
      </g>

      <g transform="translate(224 150)">
        <rect width="72" height="72" rx="18" fill="#0F6E56" />
        <g fill="none" stroke="#fff" strokeWidth="4.2" strokeLinecap="round">
          <path d="M22 36 C34 36 34 16 50 16" />
          <path d="M22 36 L50 36" />
          <path d="M22 36 C34 36 34 56 50 56" />
        </g>
        <circle cx="20" cy="36" r="7.5" fill="#fff" />
        <circle cx="56" cy="16" r="5" fill="#5DCAA5" />
        <circle cx="56" cy="36" r="5" fill="#F2A93B" />
        <circle cx="56" cy="56" r="5" fill="#5DCAA5" />
      </g>
      <g className="flow-chain">
        <rect x="204" y="238" width="112" height="26" rx="13" />
        <text x="260" y="255" textAnchor="middle">Tercatat di Sepolia</text>
      </g>

      {RECIPIENTS.map((r, i) => (
        <g key={`card-${r.y}`} className="flow-card recipient" style={{ animationDelay: `${0.9 + i * 0.45}s` }}>
          <rect x="362" y={r.y - 32} width="148" height="64" rx="14" />
          <text x="376" y={r.y - 8} className="fc-title">{r.name}</text>
          <text x="376" y={r.y + 12} className="fc-sub">{r.bank}</text>
          <text x="376" y={r.y + 26} className="fc-amt">{r.amount}</text>
          <g className="flow-check" transform={`translate(484 ${r.y - 20})`}>
            <circle cx="9" cy="9" r="9" />
            <path d="M5 9.5 8 12.5 13 6.5" />
          </g>
        </g>
      ))}
    </svg>
  );
}
