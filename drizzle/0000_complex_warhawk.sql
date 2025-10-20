-- Profiles table already exists; skipping creation
--> statement-breakpoint
CREATE TABLE "service_assignees" (
	"service_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "service_assignees_service_id_user_id_pk" PRIMARY KEY("service_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(120) NOT NULL,
	"descripcion" text,
	"precio" numeric(10, 2) DEFAULT '0' NOT NULL,
	"estado" varchar(20) DEFAULT 'activo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "service_assignees" ADD CONSTRAINT "service_assignees_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_assignees" ADD CONSTRAINT "service_assignees_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;