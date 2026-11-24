# Dokumentasi API

Semua endpoint ada di `apps/web/src/app/api`.

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| POST | `/api/batches` | Buat batch beserta daftar penerima |
| POST | `/api/batches/:id/checkout` | Buat invoice (Xendit atau simulasi) untuk batch |
| POST | `/api/webhooks/xendit/invoice` | Terima notifikasi pembayaran invoice dari Xendit |
| POST | `/api/simulator/invoice/:id/pay` | Simulasi pembayaran (hanya mode simulasi) |
| POST | `/api/webhooks/xendit/payout` | Terima notifikasi status payout dari Xendit |
| GET | `/api/reports/reconciliation?from=&to=&format=csv` | Laporan rekonsiliasi, JSON atau CSV |
| GET | `/api/proof/:code` | Cek bukti penerima terhadap catatan on-chain |
| POST | `/api/chain/retry` | Ulangi pencatatan on-chain yang gagal |

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

## Alur setelah pembayaran

`onBatchFunded()` di `src/lib/events.ts` menjalankan tiga hal:

1. Memasukkan job `RECORD_BATCH` ke tabel `ChainJob`.
2. `startPayouts()` di `src/lib/payout.ts`: batch jadi `DISBURSING`, satu payout per penerima.
   - Mode xendit: `POST /v2/payouts` dengan header `Idempotency-key` = `Recipient.idempotencyKey`, `reference_id` = `Recipient.id`.
   - Mode simulasi: hasil dibuat lokal setelah 1,5 detik. Nomor rekening berakhiran `0000` sengaja dibuat gagal (`INVALID_DESTINATION`).
3. Memproses antrean on-chain di latar belakang.

Setiap hasil payout final memasukkan job `RECORD_PAYOUT`. Batch jadi `COMPLETED` jika semua penerima terkirim, atau `PARTIAL_FAILED` jika ada yang gagal.

## POST /api/webhooks/xendit/payout

Header `x-callback-token` wajib sama dengan `XENDIT_CALLBACK_TOKEN`. Di Xendit Dashboard, isi URL webhook payout dengan alamat publik (misalnya lewat cloudflared atau ngrok) ditambah `/api/webhooks/xendit/payout`.

```json
{ "event": "payout.succeeded", "data": { "id": "disb-123", "reference_id": "<Recipient.id>", "status": "SUCCEEDED" } }
```

| Kondisi | Respons |
| --- | --- |
| Token salah atau kosong | `401` |
| `reference_id` tidak dikenal atau ID payout berbeda | `400` |
| Notifikasi yang sama datang lagi | `200` dengan `duplicate: true` |
| `SUCCEEDED` | Penerima jadi `SUCCEEDED` |
| `FAILED`, `CANCELLED`, `REVERSED` | Penerima jadi `FAILED`, `failure_code` disimpan |
| Status lain (`ACCEPTED`, dll.) | Diabaikan |

## Pencatatan on-chain

Kontrak `BayarRapiLedger` di Sepolia. Aktif jika `SEPOLIA_RPC_URL`, `OPERATOR_PRIVATE_KEY`, dan `LEDGER_CONTRACT_ADDRESS` terisi. Tidak ada data pribadi yang dikirim ke blockchain, hanya hash:

| Nilai | Rumus |
| --- | --- |
| ID batch | `keccak256(externalId)` |
| Hash penerima | `keccak256(JSON [[id, amount, proofCode], ...])`, diurutkan per id |
| Hash bukti | `solidityPackedKeccak256(["string","string","uint256","string"], [externalId, recipientId, amount, proofCode])` |

Job diproses satu per satu (supaya nonce wallet operator tidak bentrok), maksimal 5 percobaan. Pencatatan tidak pernah menahan alur pembayaran. Job yang tertinggal setelah server restart dilanjutkan saat halaman detail batch dibuka.

## GET /api/proof/:code

Menghitung ulang hash bukti dari data penerima lalu membaca `getPayout()` di kontrak.

| `state` | Arti |
| --- | --- |
| `verified` | Hash ada di kontrak, batch dan status cocok |
| `mismatch` | Data database berbeda dengan catatan on-chain |
| `pending` | Payout belum final atau belum tercatat |
| `unavailable` | RPC belum dikonfigurasi atau gagal |
| `not_found` | Kode tidak ada (`404`) |

## GET /api/reports/reconciliation

Kebijakan: transfer gagal dikembalikan penuh ke pengirim, nominal dan fee Rp2.900-nya. Fee hanya menjadi pendapatan untuk transfer yang berhasil.

Per batch yang sudah dibayar: uang masuk, alokasi, terkirim, gagal, refund (nominal + fee transfer gagal), fee dari transfer berhasil, biaya payout Xendit (Rp2.500 per payout berhasil), margin (fee berhasil dikurangi biaya Xendit), dan kelengkapan catatan on-chain.

Kolom `cocok` bernilai YA jika uang masuk = terkirim + refund + fee transfer berhasil, tidak ada payout yang masih diproses, dan semua hasil sudah tercatat on-chain.

Tambahkan `format=csv` untuk unduhan. Waktu dalam WIB. Baris pertama `sep=,` supaya Excel dengan setelan regional Indonesia tetap memisahkan kolom dengan benar.
