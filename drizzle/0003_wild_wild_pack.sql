CREATE TABLE "document_relations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_document_id" uuid NOT NULL,
	"target_document_id" uuid NOT NULL,
	"relation_type" text NOT NULL,
	"effective_from" date,
	"note" text,
	"source_url" text NOT NULL,
	"verified_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "source_ref" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "source_url" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "legal_topics" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "retrieval_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "document_relations" ADD CONSTRAINT "document_relations_source_document_id_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_relations" ADD CONSTRAINT "document_relations_target_document_id_documents_id_fk" FOREIGN KEY ("target_document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "document_relations_pair_type_uidx" ON "document_relations" USING btree ("source_document_id","target_document_id","relation_type");--> statement-breakpoint
CREATE INDEX "document_relations_target_idx" ON "document_relations" USING btree ("target_document_id");--> statement-breakpoint
CREATE UNIQUE INDEX "documents_source_ref_uidx" ON "documents" USING btree ("source_ref");--> statement-breakpoint
CREATE INDEX "documents_legal_topics_idx" ON "documents" USING gin ("legal_topics");