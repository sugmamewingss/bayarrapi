# Pembagian Tugas Kelompok 3

Dibagi rata: tiap anggota memegang satu bagian prototipe, satu bagian business case, dan satu dokumen teknis.
Pembagian ini awal dan boleh ditukar setelah tim tahu kekuatan masing-masing. Catat perubahan di `docs/log-ide.md`.

## Tanggung jawab per anggota

| Anggota | Prototipe (kode) | Business case | Dokumen teknis |
| --- | --- | --- | --- |
| Alfi Perdiansyah Putra | Pay-in: buat invoice Xendit, webhook invoice, verifikasi `x-callback-token`, idempotency | Ringkasan eksekutif, peta regulasi dan perizinan, KYC/AML dan UU PDP | Dokumentasi API, log ide (notulen), koordinasi repo |
| Muhammad Farhan Muzakkiy | Payout: Payouts API per penerima, webhook payout, laporan rekonsiliasi | Model pendapatan, proyeksi 3 tahun (unit economics, BEP, NPV) | ERD dan skema basis data (Prisma) |
| Mukhamad Irfan Nur Khakim | Smart contract `BayarRapiLedger`: tulis, uji, deploy ke Sepolia; modul server yang memanggil contract + antrean retry | Arsitektur sistem, manajemen risiko (operasional, siber) | Diagram arsitektur, alasan pakai blockchain |
| Rakapaksi Satrya Putra | Frontend: form batch kirim, dashboard status, halaman cek bukti penerima | Masalah dan segmen, pasar TAM/SAM/SOM, BMC, roadmap dan KPI | User stories, slide presentasi, video demo |

Analisis kompetitor sudah selesai (dikerjakan bersama, 9 Nov 2026). Pernyataan AI diisi semua anggota.

## Jadwal

| Periode | Target |
| --- | --- |
| 10 - 12 Nov 2026 | Semua: akun Xendit test mode, wallet Sepolia + faucet, clone repo. Farhan: ERD. Irfan: rancangan contract. Rakapaksi: user stories + wireframe. Alfi: daftar endpoint API. |
| 13 - 17 Nov 2026 | Pay-in jalan sampai webhook (Alfi). Payout per penerima (Farhan). Contract lulus uji lokal (Irfan). Halaman form batch dan dashboard (Rakapaksi). |
| 18 - 21 Nov 2026 | Integrasi: webhook memanggil contract, rekonsiliasi, halaman cek bukti. Draf bagian business case masing-masing masuk ke dokumen. |
| 22 - 24 Nov 2026 | Uji skenario sukses, gagal, kedaluwarsa, webhook palsu, webhook ganda. Finalisasi dan kumpulkan business case (24 Nov). |
| 25 Nov - presentasi | Rekam video demo, slide, latihan tanya jawab. |
