import { relations } from 'drizzle-orm';
import {
	boolean,
	integer,
	pgTable,
	primaryKey,
	serial,
	text,
	timestamp,
	unique
} from 'drizzle-orm/pg-core';
import { user } from './auth.schema';

export const movie = pgTable(
	'movie',
	{
		id: serial('id').primaryKey(),
		title: text('title').notNull(),
		posterPath: text('poster_path'),
		tmdbId: integer('tmdb_id'),
		releaseYear: integer('release_year'),
		isFavourite: boolean('is_favourite').notNull().default(false),
		favouritedAt: timestamp('favourited_at'),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(table) => [unique('movie_user_tmdb_unique').on(table.userId, table.tmdbId)]
);

export const director = pgTable('director', {
	id: serial('id').primaryKey(),
	tmdbPersonId: integer('tmdb_person_id').notNull().unique(),
	name: text('name').notNull()
});

export const genre = pgTable('genre', {
	id: serial('id').primaryKey(),
	tmdbGenreId: integer('tmdb_genre_id').notNull().unique(),
	name: text('name').notNull()
});

export const movieDirector = pgTable(
	'movie_director',
	{
		movieId: integer('movie_id')
			.notNull()
			.references(() => movie.id, { onDelete: 'cascade' }),
		directorId: integer('director_id')
			.notNull()
			.references(() => director.id, { onDelete: 'cascade' }),
		sortOrder: integer('sort_order').notNull().default(0)
	},
	(table) => [primaryKey({ columns: [table.movieId, table.directorId] })]
);

export const movieGenre = pgTable(
	'movie_genre',
	{
		movieId: integer('movie_id')
			.notNull()
			.references(() => movie.id, { onDelete: 'cascade' }),
		genreId: integer('genre_id')
			.notNull()
			.references(() => genre.id, { onDelete: 'cascade' })
	},
	(table) => [primaryKey({ columns: [table.movieId, table.genreId] })]
);

export const movieRelations = relations(movie, ({ one, many }) => ({
	user: one(user, {
		fields: [movie.userId],
		references: [user.id]
	}),
	movieDirectors: many(movieDirector),
	movieGenres: many(movieGenre)
}));

export const directorRelations = relations(director, ({ many }) => ({
	movieDirectors: many(movieDirector)
}));

export const genreRelations = relations(genre, ({ many }) => ({
	movieGenres: many(movieGenre)
}));

export const movieDirectorRelations = relations(movieDirector, ({ one }) => ({
	movie: one(movie, {
		fields: [movieDirector.movieId],
		references: [movie.id]
	}),
	director: one(director, {
		fields: [movieDirector.directorId],
		references: [director.id]
	})
}));

export const movieGenreRelations = relations(movieGenre, ({ one }) => ({
	movie: one(movie, {
		fields: [movieGenre.movieId],
		references: [movie.id]
	}),
	genre: one(genre, {
		fields: [movieGenre.genreId],
		references: [genre.id]
	})
}));

export * from './auth.schema';
