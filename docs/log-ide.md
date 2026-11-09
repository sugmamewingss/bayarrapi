# Log Pengembangan Ide

Catatan diskusi dan keputusan tiap pertemuan. Entri terbaru di atas.

## 9 Nov 2026: Revisi konsep setelah masukan dosen

- Keputusan: konsep diubah menjadi "bayar sekali, teruskan ke banyak rekening" (mirip Flip). Pengirim membayar satu invoice, dana diteruskan ke banyak penerima di bank berbeda.
- Keputusan: provider sandbox pindah dari Midtrans ke Xendit test mode, karena pay-in dan payout ada di satu akun test.
- Keputusan: stack Node.js + Next.js, smart contract Solidity + Hardhat di Sepolia.
- Keputusan: repo di akun GitHub Alfi, anggota lain jadi collaborator.
- Keputusan: peran blockchain berubah dari hash audit umum menjadi bukti alokasi dana yang bisa dicek tiap penerima.
- Temuan analisis kompetitor: Flip for Business Rp1.800 per transfer, Xendit dan OY! Rp2.500. BayarRapi tidak bisa bersaing di harga; pembeda harus transparansi ke penerima.
- Dosen: pertemuan kelas hari ini dipakai untuk membuat prototipe, data dummy dulu.

## 8 Nov 2026: Review proposal oleh dosen

- Masukan 1: payment gateway harus bisa meneruskan satu transaksi ke banyak penerima (konsep awal seperti Flip).
- Masukan 2: lakukan analisis kompetitor.
- Masukan 3: lanjutkan ke pembuatan prototipe.

## 29 Okt 2026: Proposal dikumpulkan

- Konsep awal: BayarRapi sebagai payment gateway untuk UMKM dengan invoice, checkout Midtrans Sandbox, webhook, rekonsiliasi, dan hash audit di Sepolia.
- Pencairan ke banyak merchant saat itu ditulis di luar cakupan MVP (direvisi 9 Nov).
