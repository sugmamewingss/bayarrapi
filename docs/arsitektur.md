# Arsitektur Sistem (draf awal)

Penanggung jawab: Irfan.

```mermaid
sequenceDiagram
    actor P as Pengirim
    participant W as BayarRapi (Next.js)
    participant DB as Basis data
    participant X as Xendit test mode
    participant C as BayarRapiLedger (Sepolia)
    actor R as Penerima

    P->>W: Buat batch (daftar penerima dummy)
    W->>DB: Simpan batch DRAFT
    W->>X: Buat invoice (total + fee)
    X-->>P: Halaman bayar (VA/QRIS/e-wallet)
    P->>X: Bayar di simulator
    X->>W: Webhook invoice PAID (x-callback-token)
    W->>W: Verifikasi token, cocokkan external_id dan nominal, cek idempotency
    W->>DB: Batch FUNDED
    W->>C: recordBatch(batchId, recipientsHash, total, count)
    loop Tiap penerima
        W->>X: Buat payout (Idempotency-key)
        X->>W: Webhook payout SUCCEEDED/FAILED
        W->>DB: Update status penerima
        W->>C: recordPayout(batchId, proofHash, status)
    end
    R->>W: Cek kode bukti
    W->>C: Baca catatan proofHash
    W-->>R: Nominal, status, tautan Etherscan
```

## Kenapa blockchain

Pengirim bisa saja mengubah data di basis data sendiri. Catatan on-chain membuat alokasi dan status pencairan per penerima tidak bisa diubah setelah dicatat, dan penerima bisa memeriksanya tanpa akses ke dashboard pengirim.

Batasan yang harus diakui: blockchain tidak membuktikan bahwa uang benar-benar masuk ke rekening penerima. Sumber kebenaran status tetap Xendit. Blockchain hanya membuktikan bahwa catatan tidak diubah sejak ditulis.
