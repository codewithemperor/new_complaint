-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('SUBMITTED', 'ROUTED', 'ASSIGNED', 'REASSIGNED', 'RETURNED', 'ESCALATED', 'APPROVED', 'REFERRED', 'REOPENED', 'CLOSED', 'AUTO_ESCALATED');

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "assigned_officer_id" UUID,
ADD COLUMN     "sla_breached" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sla_due_at" TIMESTAMP(3),
ADD COLUMN     "sla_first_responded_at" TIMESTAMP(3),
ADD COLUMN     "sla_paused_at" TIMESTAMP(3),
ADD COLUMN     "sla_started_at" TIMESTAMP(3),
ADD COLUMN     "sla_target_hours" INTEGER,
ADD COLUMN     "triaged_at" TIMESTAMP(3),
ADD COLUMN     "triaged_by_id" UUID;

-- CreateTable
CREATE TABLE "ticket_movements" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "type" "MovementType" NOT NULL,
    "from_user_id" UUID,
    "to_user_id" UUID,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routing_rules" (
    "id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "priority" "Priority",
    "lga" TEXT,
    "department_id" UUID NOT NULL,
    "default_officer_id" UUID,
    "priority_rank" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ticket_movements_ticket_id_created_at_idx" ON "ticket_movements"("ticket_id", "created_at");

-- CreateIndex
CREATE INDEX "ticket_movements_to_user_id_idx" ON "ticket_movements"("to_user_id");

-- CreateIndex
CREATE INDEX "ticket_movements_from_user_id_idx" ON "ticket_movements"("from_user_id");

-- CreateIndex
CREATE INDEX "routing_rules_category_priority_lga_idx" ON "routing_rules"("category", "priority", "lga");

-- CreateIndex
CREATE INDEX "routing_rules_department_id_idx" ON "routing_rules"("department_id");

-- CreateIndex
CREATE INDEX "tickets_assigned_officer_id_status_idx" ON "tickets"("assigned_officer_id", "status");

-- CreateIndex
CREATE INDEX "tickets_triaged_by_id_idx" ON "tickets"("triaged_by_id");

-- CreateIndex
CREATE INDEX "tickets_sla_breached_status_idx" ON "tickets"("sla_breached", "status");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assigned_officer_id_fkey" FOREIGN KEY ("assigned_officer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_movements" ADD CONSTRAINT "ticket_movements_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_movements" ADD CONSTRAINT "ticket_movements_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_movements" ADD CONSTRAINT "ticket_movements_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routing_rules" ADD CONSTRAINT "routing_rules_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
