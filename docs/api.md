# Dokumentasi API

Penanggung jawab: Alfi. Semua endpoint ada di `apps/web/src/app/api`.

| Method | Endpoint | Fungsi | Pemilik | Status |
| --- | --- | --- | --- | --- |
| POST | `/api/batches` | Buat batch beserta daftar penerima | Alfi | Selesai |
| POST | `/api/batches/:id/checkout` | Buat invoice (Xendit atau simulasi) untuk batch | Alfi | Selesai |
| POST | `/api/webhooks/xendit/invoice` | Terima notifikasi pembayaran invoice dari Xendit | Alfi | Selesai |
| POST | `/api/simulator/invoice/:id/pay` | Simulasi pembayaran (hanya mode simulasi) | Alfi | Selesai |
| POST | `/api/webhooks/xendit/payout` | Terima notifikasi status payout | Farhan | Belum |
| GET | `/api/reports/reconciliation?from=&to=` | Laporan rekonsiliasi, bisa CSV | Farhan | Belum |
| GET | `/api/proof/:code` | Cek bukti penerima terhadap catatan on-chain | Irfan | Belum |

## Mode pembayaran

`PAYMENT_MODE` di `apps/web/.env`:

- `simulation`: invoice dibuat lokal dan dibayar lewat halaman `/simulator/invoice/:id`. Tidak butuh akun Xendit.
- `xendit`: invoice dibuat lewat Xendit Invoice API test mode. Butuh `XENDIT_SECRET_KEY` dan `XENDIT_CALLBACK_TOKEN`.
- Kosong: otomatis `xendit` jika `XENDIT_SECRET_KEY` terisi, selain itu `simulation`.

Simulasi dan webhook asli memanggil fungsi yang sama (`processInvoiceEvent` di `src/lib/payin.ts`).

## POST /api/batches

Request:

```json
{
  "recipients": [
    { "name": "Reseller Andi", "bankCode": "BCA", "accountNumber": "1234567890", "amount": 150000 }
  ]
}
```

Aturan: 1 sampai 50 penerima; nominal Rp10.000 sampai Rp50.000.000; nomor rekening 6 sampai 20 digit; bank: BCA, BNI, BRI, MANDIRI, PERMATA, CIMB.

Response `201`: `{ "id": "...", "externalId": "BR-20261119-7KQ2MX", "status": "DRAFT" }`. Data salah: `400` dengan daftar `issues`.

## POST /api/batches/:id/checkout

Response `200`: `{ "invoiceUrl": "...", "mode": "simulation" }`. Batch berubah dari `DRAFT` ke `PENDING_PAYMENT`. Nominal invoice = total penerima + fee Rp2.900 per penerima.

## POST /api/webhooks/xendit/invoice

Dipanggil Xendit. Header `x-callback-token` wajib sama dengan `XENDIT_CALLBACK_TOKEN`.

Contoh body dari Xendit (dipotong):

```json
{ "id": "inv_123", "external_id": "BR-20261119-7KQ2MX", "status": "PAID", "amount": 933700 }
```

| Kondisi | Respons |
| --- | --- |
| Token salah atau kosong | `401` |
| `external_id` tidak dikenal | `404` |
| Nominal atau ID invoice tidak cocok | `400` |
| Notifikasi yang sama datang lagi | `200` dengan `duplicate: true`, tidak diproses ulang |
| `PAID` atau `SETTLED` | Batch jadi `FUNDED`, lalu `onBatchFunded()` dipanggil |
| `EXPIRED` | Batch jadi `EXPIRED` |

## Aturan keamanan webhook

1. Tolak request jika header `x-callback-token` tidak sama dengan `XENDIT_CALLBACK_TOKEN` (perbandingan waktu-konstan).
2. Cari batch berdasarkan `external_id`; tolak jika nominal atau ID invoice berbeda.
3. Simpan `eventKey` unik di tabel `WebhookEvent`; jika sudah ada, balas 200 tanpa memproses ulang.
4. Status hanya dari webhook atau API Xendit, tidak pernah dari halaman browser.
