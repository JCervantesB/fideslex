ALTER TABLE "appointment_services" DROP CONSTRAINT "appointment_services_appointment_id_appointments_id_fk";
--> statement-breakpoint
ALTER TABLE "appointment_services" DROP CONSTRAINT "appointment_services_service_id_services_id_fk";
--> statement-breakpoint
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_user_id_profiles_user_id_fk";
--> statement-breakpoint
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_client_id_profiles_user_id_fk";
--> statement-breakpoint
ALTER TABLE "schedules" DROP CONSTRAINT "schedules_user_id_profiles_user_id_fk";
--> statement-breakpoint
ALTER TABLE "service_assignees" DROP CONSTRAINT "service_assignees_service_id_services_id_fk";
--> statement-breakpoint
ALTER TABLE "service_assignees" DROP CONSTRAINT "service_assignees_user_id_profiles_user_id_fk";
--> statement-breakpoint
ALTER TABLE "service_categories" DROP CONSTRAINT "service_categories_service_id_services_id_fk";
--> statement-breakpoint
ALTER TABLE "service_categories" DROP CONSTRAINT "service_categories_category_id_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "user_id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "client_id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "user_id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "service_assignees" ALTER COLUMN "user_id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "appointment_services" ADD CONSTRAINT "appointment_services_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_services" ADD CONSTRAINT "appointment_services_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_client_id_profiles_user_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_assignees" ADD CONSTRAINT "service_assignees_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_assignees" ADD CONSTRAINT "service_assignees_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_categories" ADD CONSTRAINT "service_categories_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_categories" ADD CONSTRAINT "service_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "appointments_user_start_idx" ON "appointments" USING btree ("user_id","start_at");--> statement-breakpoint
CREATE UNIQUE INDEX "schedules_start_end_unique" ON "schedules" USING btree ("start_min","end_min");--> statement-breakpoint
ALTER TABLE "schedules" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "schedules" DROP COLUMN "weekday";