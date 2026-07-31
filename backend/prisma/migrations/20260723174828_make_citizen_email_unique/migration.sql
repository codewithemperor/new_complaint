-- AlterTable
ALTER TABLE "citizens" ALTER COLUMN "email" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "citizens_email_key" ON "citizens"("email");

-- DropIndex (old non-unique index replaced by the unique constraint above)
DROP INDEX IF EXISTS "citizens_email_idx";
