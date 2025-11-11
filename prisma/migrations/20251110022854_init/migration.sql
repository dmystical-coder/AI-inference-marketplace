-- CreateTable
CREATE TABLE "providers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pricePerRequest" REAL NOT NULL,
    "apiConfig" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "rating" REAL NOT NULL DEFAULT 4.5,
    "totalRequests" INTEGER NOT NULL DEFAULT 0,
    "successRate" REAL NOT NULL DEFAULT 0.95,
    "avgResponseTime" REAL NOT NULL DEFAULT 2.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "inference_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userWallet" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "output" TEXT,
    "status" TEXT NOT NULL,
    "cost" REAL NOT NULL,
    "txSignature" TEXT,
    "errorMessage" TEXT,
    "processingTime" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "inference_requests_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "escrow_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "txSignature" TEXT NOT NULL,
    "releaseTxSignature" TEXT,
    "refundTxSignature" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" DATETIME,
    "refundedAt" DATETIME,
    CONSTRAINT "escrow_transactions_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "inference_requests" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "providers_walletAddress_key" ON "providers"("walletAddress");

-- CreateIndex
CREATE INDEX "inference_requests_userWallet_idx" ON "inference_requests"("userWallet");

-- CreateIndex
CREATE INDEX "inference_requests_providerId_idx" ON "inference_requests"("providerId");

-- CreateIndex
CREATE INDEX "inference_requests_status_idx" ON "inference_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "escrow_transactions_requestId_key" ON "escrow_transactions"("requestId");

-- CreateIndex
CREATE INDEX "escrow_transactions_status_idx" ON "escrow_transactions"("status");
