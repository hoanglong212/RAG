CREATE TABLE "legal_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"scenario" text NOT NULL,
	"topic" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"analysis" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" text DEFAULT 'Người dùng' NOT NULL,
	"email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watchlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"topics" text[] DEFAULT '{}'::text[] NOT NULL,
	"document_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "legal_cases" ADD CONSTRAINT "legal_cases_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "legal_cases_user_updated_idx" ON "legal_cases" USING btree ("user_id","updated_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "watchlists_user_idx" ON "watchlists" USING btree ("user_id");