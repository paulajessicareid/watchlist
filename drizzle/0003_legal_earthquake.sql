CREATE TABLE "director" (
	"id" serial PRIMARY KEY NOT NULL,
	"tmdb_person_id" integer NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "director_tmdb_person_id_unique" UNIQUE("tmdb_person_id")
);
--> statement-breakpoint
CREATE TABLE "genre" (
	"id" serial PRIMARY KEY NOT NULL,
	"tmdb_genre_id" integer NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "genre_tmdb_genre_id_unique" UNIQUE("tmdb_genre_id")
);
--> statement-breakpoint
CREATE TABLE "movie_director" (
	"movie_id" integer NOT NULL,
	"director_id" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "movie_director_movie_id_director_id_pk" PRIMARY KEY("movie_id","director_id")
);
--> statement-breakpoint
CREATE TABLE "movie_genre" (
	"movie_id" integer NOT NULL,
	"genre_id" integer NOT NULL,
	CONSTRAINT "movie_genre_movie_id_genre_id_pk" PRIMARY KEY("movie_id","genre_id")
);
--> statement-breakpoint
ALTER TABLE "movie" ADD COLUMN "tmdb_id" integer;--> statement-breakpoint
ALTER TABLE "movie" ADD COLUMN "release_year" integer;--> statement-breakpoint
ALTER TABLE "movie_director" ADD CONSTRAINT "movie_director_movie_id_movie_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movie"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_director" ADD CONSTRAINT "movie_director_director_id_director_id_fk" FOREIGN KEY ("director_id") REFERENCES "public"."director"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_genre" ADD CONSTRAINT "movie_genre_movie_id_movie_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movie"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_genre" ADD CONSTRAINT "movie_genre_genre_id_genre_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genre"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie" ADD CONSTRAINT "movie_user_tmdb_unique" UNIQUE("user_id","tmdb_id");