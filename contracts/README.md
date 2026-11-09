# contracts

Smart contract `BayarRapiLedger` (Solidity + Hardhat), deploy ke Ethereum Sepolia. Penanggung jawab: Irfan.

Rancangan fungsi:
- `recordBatch(bytes32 batchId, bytes32 recipientsHash, uint256 totalAmount, uint16 count)`: hanya operator.
- `recordPayout(bytes32 batchId, bytes32 proofHash, uint8 status)`: hanya operator.
- `getBatch(bytes32 batchId)` dan `getPayout(bytes32 proofHash)`: baca publik untuk halaman cek penerima.

Tidak ada data pribadi (nama, nomor rekening) yang disimpan di contract.
