ALTER TABLE "movie" ADD COLUMN "is_favourite" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "movie" ADD COLUMN "favourited_at" timestamp;