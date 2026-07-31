-- CreateTable
CREATE TABLE "sla_config" (
    "priority" "Priority" NOT NULL,
    "first_response_hours" INTEGER NOT NULL,
    "resolution_hours" INTEGER NOT NULL,
    "warning_threshold" DECIMAL(3,2) NOT NULL,
    "escalation_chain" TEXT[],
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sla_config_pkey" PRIMARY KEY ("priority")
);
