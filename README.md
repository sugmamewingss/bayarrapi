# BayarRapi

Prototipe payment gateway "bayar sekali, teruskan ke banyak rekening" dengan jejak bukti di blockchain.
Tugas Akhir mata kuliah Teknologi Blockchain dan Platform Keuangan Dijital, FILKOM Universitas Brawijaya, 2026.

## Konsep singkat

1. Pengirim membuat **batch kirim**: daftar penerima dummy (nama, bank, nomor rekening, nominal).
2. Sistem menghitung total ditambah fee, lalu membuat invoice Xendit (VA, QRIS, e-wallet).
3. Pengirim membayar lewat simulator Xendit test mode.
4. Webhook invoice diverifikasi (`x-callback-token`), `external_id` dan nominal dicocokkan, notifikasi ganda ditolak.
5. Batch dicatat ke smart contract di Ethereum Sepolia (hash daftar penerima dan total). Status batch: `FUNDED`.
6. Backend mengirim payout per penerima lewat Xendit Payouts API dengan `Idempotency-key` per item.
7. Webhook payout memperbarui status tiap penerima. Bukti tiap pencairan dicatat on-chain.
8. Dashboard rekonsiliasi: total masuk = total terkirim + fee + yang gagal/dikembalikan.
9. Halaman cek penerima: masukkan kode bukti, cocokkan dengan catatan on-chain.

Semua transaksi memakai **sandbox/test mode dan testnet**. Tidak ada uang nyata, token bernilai, atau data pribadi asli.

## Struktur repo

| Folder | Isi |
| --- | --- |
| `apps/web` | Aplikasi Next.js: dashboard pengirim, API route, webhook, halaman cek penerima |
| `contracts` | Smart contract Solidity + Hardhat (deploy ke Sepolia) |
| `docs` | Dokumentasi: pembagian tugas, log ide, user stories, ERD, arsitektur, API, pernyataan AI |

## Stack

- Next.js (App Router) + TypeScript
- Xendit test mode: Invoice API (pay-in) dan Payouts API (payout)
- Solidity + Hardhat, jaringan Ethereum Sepolia
- Basis data: SQLite via Prisma (cukup untuk prototipe)

## Cara menjalankan (lokal)

Butuh Node.js 20 atau lebih baru.

```bash
cd apps/web
npm install
cp ../.env.example .env   # lalu isi nilainya
npm run dev
```

Buka http://localhost:3000.

Smart contract:

```bash
cd contracts
npm install
npx hardhat compile
```

## Aturan kerja tim

- Jangan pernah commit API key. Simpan di `.env.local` (lihat `.env.example`).
- Satu fitur = satu branch: `feat/<nama-fitur>`. Gabung ke `main` lewat Pull Request.
- Tiap anggota commit dari akun GitHub sendiri. Riwayat commit per anggota ikut dinilai.
- Format pesan commit: `feat: ...`, `fix: ...`, `docs: ...`, `chore: ...`, `test: ...`.

## Anggota Kelompok 3

| Nama | NIM |
| --- | --- |
| Alfi Perdiansyah Putra | 245150701111028 |
| Muhammad Farhan Muzakkiy | 245150707111048 |
| Mukhamad Irfan Nur Khakim | 245150701111021 |
| Rakapaksi Satrya Putra | 245150701111034 |

Pembagian tugas: [`docs/pembagian-tugas.md`](docs/pembagian-tugas.md)
