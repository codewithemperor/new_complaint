-- CreateEnum
CREATE TYPE "AuditEventType" AS ENUM ('TICKET_ACKNOWLEDGED', 'TICKET_STARTED', 'TICKET_ASSIGNED', 'TICKET_ROUTED', 'INFO_REQUESTED', 'APPROVAL_REQUESTED', 'TICKET_APPROVED', 'TICKET_RETURNED', 'ESCALATION_TO_PS', 'ESCALATION_TO_COMMISSIONER', 'PS_DECISION', 'COMMISSIONER_DECISION', 'EXTERNAL_REFERRAL', 'TICKET_RESOLVED', 'TICKET_CLOSED', 'TICKET_AUTO_CLOSED', 'TICKET_REOPENED', 'REOPEN_ESCALATION', 'SLA_WARNING', 'SLA_BREACH_ESCALATION', 'TICKET_TRIAGED', 'MINUTE_POSTED', 'CITIZEN_INFO_REPLY', 'TICKET_ARCHIVED');

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "ticket_id" UUID,
    "actor_id" UUID,
    "event_type" "AuditEventType" NOT NULL,
    "meta" JSONB,
    "ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_events_ticket_id_created_at_idx" ON "audit_events"("ticket_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_events_actor_id_created_at_idx" ON "audit_events"("actor_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_events_event_type_created_at_idx" ON "audit_events"("event_type", "created_at");

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
