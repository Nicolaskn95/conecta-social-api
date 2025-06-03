-- DropForeignKey
ALTER TABLE "log_employee_event" DROP CONSTRAINT "log_employee_event_id_employee_fkey";

-- DropForeignKey
ALTER TABLE "log_employee_event" DROP CONSTRAINT "log_employee_event_id_event_fkey";

-- AddForeignKey
ALTER TABLE "log_employee_event" ADD CONSTRAINT "log_employee_event_id_employee_fkey" FOREIGN KEY ("id_employee") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_employee_event" ADD CONSTRAINT "log_employee_event_id_event_fkey" FOREIGN KEY ("id_event") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
