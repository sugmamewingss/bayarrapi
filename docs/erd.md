# ERD (draf awal)

Penanggung jawab: Farhan. Draf ini titik awal dan boleh diubah.

```mermaid
erDiagram
    SENDER ||--o{ BATCH : membuat
    BATCH ||--|{ RECIPIENT : berisi
    BATCH ||--o{ WEBHOOK_EVENT : menerima
    RECIPIENT ||--o{ WEBHOOK_EVENT : menerima
    BATCH ||--o{ CHAIN_JOB : dicatat
    RECIPIENT ||--o{ CHAIN_JOB : dicatat

    SENDER {
        string id PK
        string name
        string email
        datetime created_at
    }
    BATCH {
        string id PK
        string sender_id FK
        string external_id UK
        string status "DRAFT|PENDING_PAYMENT|FUNDED|DISBURSING|COMPLETED|PARTIAL_FAILED|EXPIRED"
        int total_amount
        int fee_amount
        string recipients_hash
        string xendit_invoice_id
        string chain_tx_hash
        datetime created_at
    }
    RECIPIENT {
        string id PK
        string batch_id FK
        string name
        string bank_code
        string account_number
        int amount
        string status "PENDING|PROCESSING|SUCCEEDED|FAILED"
        string xendit_payout_id
        string idempotency_key UK
        string proof_code UK
        string proof_hash
        string chain_tx_hash
    }
    WEBHOOK_EVENT {
        string id PK
        string source "INVOICE|PAYOUT"
        string event_key UK
        json payload
        datetime received_at
        datetime processed_at
    }
    CHAIN_JOB {
        string id PK
        string type "RECORD_BATCH|RECORD_PAYOUT"
        string ref_id
        string status "QUEUED|DONE|FAILED"
        int attempts
        string last_error
    }
```

Catatan:
- Nama dan nomor rekening penerima hanya di basis data, tidak pernah ke blockchain.
- `event_key` unik dipakai untuk idempotency webhook.
- `proof_code` diberikan ke penerima; `proof_hash` = `keccak256(batch_id, recipient_id, amount, salt)` yang dicatat on-chain.
