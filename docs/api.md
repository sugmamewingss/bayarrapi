# Dokumentasi API (rencana)

Penanggung jawab: Alfi. Payload lengkap diisi saat endpoint selesai dibuat.

| Method | Endpoint | Fungsi | Pemilik |
| --- | --- | --- | --- |
| POST | `/api/batches` | Buat batch beserta daftar penerima | Alfi |
| GET | `/api/batches/:id` | Detail batch dan status tiap penerima | Farhan |
| POST | `/api/batches/:id/checkout` | Buat invoice Xendit untuk batch | Alfi |
| POST | `/api/webhooks/xendit/invoice` | Terima notifikasi pembayaran invoice | Alfi |
| POST | `/api/webhooks/xendit/payout` | Terima notifikasi status payout | Farhan |
| GET | `/api/reports/reconciliation?from=&to=` | Laporan rekonsiliasi, bisa CSV | Farhan |
| GET | `/api/proof/:code` | Cek bukti penerima terhadap catatan on-chain | Irfan |

## Aturan keamanan webhook

1. Tolak request jika header `x-callback-token` tidak sama dengan `XENDIT_CALLBACK_TOKEN` (balas 401).
2. Cari batch berdasarkan `external_id`; tolak jika nominal berbeda.
3. Simpan `event_key` unik di tabel `WEBHOOK_EVENT`; jika sudah ada, balas 200 tanpa memproses ulang.
4. Status hanya dari webhook atau API Xendit, tidak pernah dari halaman browser.
