// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title BayarRapiLedger
/// @notice Catatan publik alokasi dana per batch dan bukti pencairan per penerima.
/// Kontrak ini TIDAK memegang dana. Dana bergerak lewat payment gateway (Xendit);
/// kontrak hanya menyimpan hash agar catatan tidak bisa diubah setelah ditulis
/// dan bisa diperiksa penerima tanpa akses ke basis data BayarRapi.
/// Tidak ada data pribadi (nama, nomor rekening) yang disimpan di sini.
contract BayarRapiLedger {
    uint8 public constant STATUS_SUCCEEDED = 1;
    uint8 public constant STATUS_FAILED = 2;

    struct Batch {
        bytes32 recipientsHash; // keccak256 dari daftar penerima (id, nominal, kode bukti)
        uint256 totalAmount; // total ke penerima, dalam Rupiah
        uint16 recipientCount;
        uint64 recordedAt;
        bool exists;
    }

    struct Payout {
        bytes32 batchId;
        uint8 status; // 1 = berhasil, 2 = gagal
        uint64 recordedAt;
        bool exists;
    }

    address public owner;
    address public operator; // server BayarRapi yang berhak menulis

    mapping(bytes32 => Batch) private batches;
    mapping(bytes32 => Payout) private payouts; // kunci: proofHash

    event BatchRecorded(bytes32 indexed batchId, bytes32 recipientsHash, uint256 totalAmount, uint16 recipientCount);
    event PayoutRecorded(bytes32 indexed batchId, bytes32 indexed proofHash, uint8 status);
    event OperatorChanged(address indexed previousOperator, address indexed newOperator);

    error NotOwner();
    error NotOperator();
    error ZeroAddress();
    error BatchAlreadyRecorded(bytes32 batchId);
    error BatchNotFound(bytes32 batchId);
    error InvalidBatch();
    error PayoutAlreadyRecorded(bytes32 proofHash);
    error InvalidStatus(uint8 status);

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyOperator() {
        if (msg.sender != operator) revert NotOperator();
        _;
    }

    constructor() {
        owner = msg.sender;
        operator = msg.sender;
        emit OperatorChanged(address(0), msg.sender);
    }

    function setOperator(address newOperator) external onlyOwner {
        if (newOperator == address(0)) revert ZeroAddress();
        emit OperatorChanged(operator, newOperator);
        operator = newOperator;
    }

    /// @notice Dicatat sekali setelah pembayaran batch terverifikasi lewat webhook.
    function recordBatch(bytes32 batchId, bytes32 recipientsHash, uint256 totalAmount, uint16 recipientCount)
        external
        onlyOperator
    {
        if (batches[batchId].exists) revert BatchAlreadyRecorded(batchId);
        if (recipientsHash == bytes32(0) || totalAmount == 0 || recipientCount == 0) revert InvalidBatch();
        batches[batchId] = Batch(recipientsHash, totalAmount, recipientCount, uint64(block.timestamp), true);
        emit BatchRecorded(batchId, recipientsHash, totalAmount, recipientCount);
    }

    /// @notice Dicatat sekali per penerima setelah status payout final dari gateway.
    function recordPayout(bytes32 batchId, bytes32 proofHash, uint8 status) external onlyOperator {
        if (!batches[batchId].exists) revert BatchNotFound(batchId);
        if (status != STATUS_SUCCEEDED && status != STATUS_FAILED) revert InvalidStatus(status);
        if (payouts[proofHash].exists) revert PayoutAlreadyRecorded(proofHash);
        payouts[proofHash] = Payout(batchId, status, uint64(block.timestamp), true);
        emit PayoutRecorded(batchId, proofHash, status);
    }

    function getBatch(bytes32 batchId) external view returns (Batch memory) {
        return batches[batchId];
    }

    function getPayout(bytes32 proofHash) external view returns (Payout memory) {
        return payouts[proofHash];
    }
}
