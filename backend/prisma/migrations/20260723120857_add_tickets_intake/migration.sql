-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('SUBMITTED', 'ACKNOWLEDGED', 'TRIAGED', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_APPROVAL', 'APPROVED', 'RESOLVED', 'CLOSED', 'REOPENED', 'ESCALATED', 'REFERRED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('P1', 'P2', 'P3', 'P4');

-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('WEB', 'WALK_IN', 'PHONE', 'LETTER', 'EMAIL');

-- CreateEnum
CREATE TYPE "Sensitivity" AS ENUM ('NORMAL', 'SENSITIVE', 'CONFIDENTIAL');

-- CreateEnum
CREATE TYPE "AwaitingState" AS ENUM ('NONE', 'CITIZEN', 'DEPARTMENT', 'APPROVAL');

-- CreateEnum
CREATE TYPE "AttachmentKind" AS ENUM ('EVIDENCE', 'RESOLUTION', 'MINUTE');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "citizens" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "lga" TEXT,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "citizens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" UUID NOT NULL,
    "ticket_code" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'SUBMITTED',
    "category" TEXT,
    "priority" "Priority",
    "sensitivity" "Sensitivity" NOT NULL DEFAULT 'NORMAL',
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "channel" "Channel" NOT NULL DEFAULT 'WEB',
    "lga" TEXT,
    "citizen_id" UUID NOT NULL,
    "department_id" UUID,
    "awaiting" "AwaitingState" NOT NULL DEFAULT 'NONE',
    "tracking_token" TEXT NOT NULL,
    "resolution_text" TEXT,
    "resolved_at" TIMESTAMP(3),
    "resolved_by_id" UUID,
    "closed_at" TIMESTAMP(3),
    "closed_reason" TEXT,
    "reopen_count" INTEGER NOT NULL DEFAULT 0,
    "last_reopened_at" TIMESTAMP(3),
    "feedback_grace_due_at" TIMESTAMP(3),
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_attachments" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "kind" "AttachmentKind" NOT NULL DEFAULT 'EVIDENCE',
    "filename" TEXT NOT NULL,
    "stored_path" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "uploaded_by_id" UUID,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_sequences" (
    "id" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "last_value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ticket_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" UUID NOT NULL,
    "ticket_id" UUID,
    "event_id" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "error" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "citizens_email_idx" ON "citizens"("email");

-- CreateIndex
CREATE INDEX "citizens_phone_idx" ON "citizens"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_ticket_code_key" ON "tickets"("ticket_code");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_tracking_token_key" ON "tickets"("tracking_token");

-- CreateIndex
CREATE INDEX "tickets_status_idx" ON "tickets"("status");

-- CreateIndex
CREATE INDEX "tickets_priority_idx" ON "tickets"("priority");

-- CreateIndex
CREATE INDEX "tickets_department_id_status_idx" ON "tickets"("department_id", "status");

-- CreateIndex
CREATE INDEX "tickets_channel_idx" ON "tickets"("channel");

-- CreateIndex
CREATE INDEX "tickets_created_at_idx" ON "tickets"("created_at");

-- CreateIndex
CREATE INDEX "tickets_reopen_count_idx" ON "tickets"("reopen_count");

-- CreateIndex
CREATE INDEX "ticket_attachments_ticket_id_idx" ON "ticket_attachments"("ticket_id");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_sequences_year_key" ON "ticket_sequences"("year");

-- CreateIndex
CREATE INDEX "notification_logs_ticket_id_idx" ON "notification_logs"("ticket_id");

-- CreateIndex
CREATE INDEX "notification_logs_event_id_idx" ON "notification_logs"("event_id");

-- CreateIndex
CREATE INDEX "notification_logs_recipient_idx" ON "notification_logs"("recipient");

-- CreateIndex
CREATE INDEX "notification_logs_status_created_at_idx" ON "notification_logs"("status", "created_at");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_citizen_id_fkey" FOREIGN KEY ("citizen_id") REFERENCES "citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
