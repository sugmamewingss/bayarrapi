-- CreateTable
CREATE TABLE "Sender" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "totalAmount" INTEGER NOT NULL,
    "feeAmount" INTEGER NOT NULL,
    "recipientsHash" TEXT,
    "xenditInvoiceId" TEXT,
    "invoiceUrl" TEXT,
    "paidAt" DATETIME,
    "chainTxHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Batch_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Sender" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Recipient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bankCode" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "failureCode" TEXT,
    "xenditPayoutId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "proofCode" TEXT NOT NULL,
    "proofHash" TEXT,
    "chainTxHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Recipient_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" DATETIME
);

-- CreateTable
CREATE TABLE "ChainJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Sender_email_key" ON "Sender"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_externalId_key" ON "Batch"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_xenditInvoiceId_key" ON "Batch"("xenditInvoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "Recipient_xenditPayoutId_key" ON "Recipient"("xenditPayoutId");

-- CreateIndex
CREATE UNIQUE INDEX "Recipient_idempotencyKey_key" ON "Recipient"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Recipient_proofCode_key" ON "Recipient"("proofCode");

-- CreateIndex
CREATE UNIQUE INDEX "Recipient_proofHash_key" ON "Recipient"("proofHash");

-- CreateIndex
CREATE INDEX "Recipient_batchId_idx" ON "Recipient"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_eventKey_key" ON "WebhookEvent"("eventKey");

-- CreateIndex
CREATE INDEX "ChainJob_status_idx" ON "ChainJob"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ChainJob_type_refId_key" ON "ChainJob"("type", "refId");
