-- CreateEnum
CREATE TYPE "ApproverRole" AS ENUM ('DIRECTOR', 'PERMANENT_SECRETARY', 'COMMISSIONER');

-- AlterEnum
ALTER TYPE "ApprovalStatus" ADD VALUE 'REFERRED';

-- AlterTable
ALTER TABLE "approval_requests" ADD COLUMN     "approver_role" "ApproverRole" NOT NULL DEFAULT 'DIRECTOR',
ADD COLUMN     "decision" TEXT,
ADD COLUMN     "referred_body" TEXT;

-- CreateTable
CREATE TABLE "delegations" (
    "id" UUID NOT NULL,
    "delegator_id" UUID NOT NULL,
    "delegate_id" UUID NOT NULL,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_to" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delegations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "delegations_delegate_id_valid_from_valid_to_idx" ON "delegations"("delegate_id", "valid_from", "valid_to");

-- CreateIndex
CREATE INDEX "delegations_delegator_id_idx" ON "delegations"("delegator_id");

-- CreateIndex
CREATE INDEX "approval_requests_current_approver_id_status_idx" ON "approval_requests"("current_approver_id", "status");

-- CreateIndex
CREATE INDEX "approval_requests_approver_role_status_idx" ON "approval_requests"("approver_role", "status");

-- AddForeignKey
ALTER TABLE "delegations" ADD CONSTRAINT "delegations_delegator_id_fkey" FOREIGN KEY ("delegator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegations" ADD CONSTRAINT "delegations_delegate_id_fkey" FOREIGN KEY ("delegate_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
