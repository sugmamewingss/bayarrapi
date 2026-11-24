# contracts

Smart contract `BayarRapiLedger` (Solidity 0.8.24 + Hardhat), dideploy ke Ethereum Sepolia.

Kontrak tidak memegang dana. Isinya hanya catatan hash:

| Fungsi | Siapa | Kegunaan |
| --- | --- | --- |
| `recordBatch(batchId, recipientsHash, totalAmount, recipientCount)` | Operator (server) | Dicatat sekali setelah pembayaran batch terverifikasi |
| `recordPayout(batchId, proofHash, status)` | Operator (server) | Dicatat sekali per penerima setelah status payout final (1 berhasil, 2 gagal) |
| `getBatch(batchId)`, `getPayout(proofHash)` | Publik | Dibaca halaman cek bukti penerima |
| `setOperator(address)` | Owner | Mengganti alamat server yang berhak menulis |

Tidak ada data pribadi (nama, nomor rekening) di kontrak.

## Menjalankan

```bash
cd contracts
npm install
npx hardhat compile
npx hardhat test
```

## Deploy ke Sepolia

1. Salin `.env.example` menjadi `.env`, isi `OPERATOR_PRIVATE_KEY` dengan private key wallet khusus testnet yang punya Sepolia ETH.
2. Jalankan `npm run deploy:sepolia`.
3. Salin alamat kontrak ke `apps/web/.env` sebagai `LEDGER_CONTRACT_ADDRESS`.
