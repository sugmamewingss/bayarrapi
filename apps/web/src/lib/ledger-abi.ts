// ABI minimal kontrak BayarRapiLedger (contracts/contracts/BayarRapiLedger.sol).
export const LEDGER_ABI = [
  "function recordBatch(bytes32 batchId, bytes32 recipientsHash, uint256 totalAmount, uint16 recipientCount)",
  "function recordPayout(bytes32 batchId, bytes32 proofHash, uint8 status)",
  "function getBatch(bytes32 batchId) view returns (tuple(bytes32 recipientsHash, uint256 totalAmount, uint16 recipientCount, uint64 recordedAt, bool exists))",
  "function getPayout(bytes32 proofHash) view returns (tuple(bytes32 batchId, uint8 status, uint64 recordedAt, bool exists))",
] as const;
