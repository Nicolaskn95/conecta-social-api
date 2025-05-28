-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(1000),
    "date" TIMESTAMP(3) NOT NULL,
    "greeting_description" VARCHAR(1000),
    "attendance" INTEGER,
    "embedded_instagram" VARCHAR(1000),
    "street" VARCHAR(100) NOT NULL,
    "neighborhood" VARCHAR(30) NOT NULL,
    "number" VARCHAR(20) NOT NULL,
    "city" VARCHAR(30) NOT NULL,
    "uf" VARCHAR(2) NOT NULL,
    "state" VARCHAR(20) NOT NULL,
    "cep" VARCHAR(9) NOT NULL,
    "complement" VARCHAR(30),
    "status" VARCHAR(20) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_employee_event" (
    "id" TEXT NOT NULL,
    "id_employee" VARCHAR(25) NOT NULL,
    "id_event" VARCHAR(25) NOT NULL,
    "log_message" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_employee_event_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "log_employee_event" ADD CONSTRAINT "log_employee_event_id_employee_fkey" FOREIGN KEY ("id_employee") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_employee_event" ADD CONSTRAINT "log_employee_event_id_event_fkey" FOREIGN KEY ("id_event") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
