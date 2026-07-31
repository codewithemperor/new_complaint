-- CreateTable
CREATE TABLE "feedback" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "satisfied" BOOLEAN NOT NULL,
    "rating" INTEGER,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feedback_ticket_id_key" ON "feedback"("ticket_id");

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
