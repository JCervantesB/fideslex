ALTER TABLE "appointment_requests" DROP CONSTRAINT IF EXISTS "appointment_requests_service_id_services_id_fk";--> statement-breakpoint
ALTER TABLE "appointment_requests" DROP CONSTRAINT IF EXISTS "appointment_requests_service_id_fkey";--> statement-breakpoint
ALTER TABLE "appointment_requests" RENAME COLUMN "service_id" TO "service_name";--> statement-breakpoint
ALTER TABLE "appointment_requests" ALTER COLUMN "service_name" TYPE varchar(120) USING "service_name"::varchar;
