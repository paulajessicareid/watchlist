import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { MovieListItem } from '$lib/movie';
import { persistMovieMetadata } from '$lib/server/movies/persist-metadata';
import { db } from '$lib/server/db';
import {
	director,
	genre,
	movie,
	movieDirector,
	movieGenre
} from '$lib/server/db/schema';
import { and, asc, desc, eq, exists, inArray, sql } from 'drizzle-orm';
import { fetchMovieDetails, posterUrl, searchMovies } from '$lib/server/tmdb';
import { isMovieGenre, MOVIE_GENRES } from '$lib/genres';

const BACKFILL_CONCURRENCY = 5;

type MovieRow = {
	id: number;
	title: string;
	posterPath: string | null;
	tmdbId: number | null;
	releaseYear: number | null;
	isFavourite: boolean;
	createdAt: Date;
};

async function loadMovieMetadata(
	movieIds: number[]
): Promise<Map<number, { directors: string[]; genres: string[] }>> {
	const metadata = new Map<number, { directors: string[]; genres: string[] }>();
	if (movieIds.length === 0) return metadata;

	for (const id of movieIds) {
		metadata.set(id, { directors: [], genres: [] });
	}

	const directorRows = await db
		.select({
			movieId: movieDirector.movieId,
			name: director.name,
			sortOrder: movieDirector.sortOrder
		})
		.from(movieDirector)
		.innerJoin(director, eq(movieDirector.directorId, director.id))
		.where(inArray(movieDirector.movieId, movieIds))
		.orderBy(asc(movieDirector.sortOrder));

	for (const row of directorRows) {
		metadata.get(row.movieId)?.directors.push(row.name);
	}

	const genreRows = await db
		.select({
			movieId: movieGenre.movieId,
			name: genre.name
		})
		.from(movieGenre)
		.innerJoin(genre, eq(movieGenre.genreId, genre.id))
		.where(inArray(movieGenre.movieId, movieIds))
		.orderBy(asc(genre.name));

	for (const row of genreRows) {
		metadata.get(row.movieId)?.genres.push(row.name);
	}

	return metadata;
}

function toMovieListItem(
	row: MovieRow,
	meta: { directors: string[]; genres: string[] }
): MovieListItem {
	const posterPath = row.posterPath;
	return {
		id: row.id,
		title: row.title,
		posterUrl: posterPath ? posterUrl(posterPath) : null,
		releaseYear: row.releaseYear,
		directors: meta.directors,
		genres: meta.genres,
		isFavourite: row.isFavourite,
		createdAt: row.createdAt
	};
}

function movieBelongsToGenre(selectedGenre: string) {
	return exists(
		db
			.select({ one: sql`1` })
			.from(movieGenre)
			.innerJoin(genre, eq(movieGenre.genreId, genre.id))
			.where(and(eq(movieGenre.movieId, movie.id), eq(genre.name, selectedGenre)))
	);
}

async function loadUserMovies(userId: string, selectedGenre: string): Promise<MovieRow[]> {
	const conditions = [eq(movie.userId, userId)];
	if (selectedGenre) {
		conditions.push(movieBelongsToGenre(selectedGenre));
	}

	return db
		.select({
			id: movie.id,
			title: movie.title,
			posterPath: movie.posterPath,
			tmdbId: movie.tmdbId,
			releaseYear: movie.releaseYear,
			isFavourite: movie.isFavourite,
			createdAt: movie.createdAt
		})
		.from(movie)
		.where(and(...conditions))
		.orderBy(desc(movie.isFavourite), desc(movie.favouritedAt), desc(movie.createdAt));
}

async function backfillMovies(movies: MovieRow[]): Promise<void> {
	const toBackfill = movies.filter((m) => m.tmdbId === null);
	if (toBackfill.length === 0) return;

	for (let i = 0; i < toBackfill.length; i += BACKFILL_CONCURRENCY) {
		const batch = toBackfill.slice(i, i + BACKFILL_CONCURRENCY);
		await Promise.all(
			batch.map(async (m) => {
				const results = await searchMovies(m.title);
				const match = results[0];
				if (!match) return;

				const details = await fetchMovieDetails(match.id);
				if (!details) return;

				await db
					.update(movie)
					.set({
						tmdbId: match.id,
						releaseYear: details.releaseYear,
						posterPath: m.posterPath ?? details.posterPath ?? undefined
					})
					.where(eq(movie.id, m.id));

				await persistMovieMetadata(m.id, details.directors, details.genres);
			})
		);
	}
}

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		return redirect(302, '/login');
	}

	const userId = event.locals.user.id;
	const selectedGenre = event.url.searchParams.get('genre')?.trim() ?? '';

	if (selectedGenre && !isMovieGenre(selectedGenre)) {
		return redirect(302, '/');
	}

	let rows = await loadUserMovies(userId, selectedGenre);
	const allRows = await loadUserMovies(userId, '');

	await backfillMovies(allRows);

	rows = await loadUserMovies(userId, selectedGenre);

	const metadata = await loadMovieMetadata(rows.map((m) => m.id));
	const movies = rows.map((row) => toMovieListItem(row, metadata.get(row.id)!));

	return {
		user: event.locals.user,
		movies,
		genres: [...MOVIE_GENRES],
		selectedGenre
	};
};

export const actions: Actions = {
	addMovie: async (event) => {
		if (!event.locals.user) {
			return redirect(302, '/login');
		}

		const formData = await event.request.formData();
		const tmdbIdRaw = formData.get('tmdbId')?.toString()?.trim() ?? '';
		const parsedTmdbId = parseInt(tmdbIdRaw, 10);
		if (!Number.isInteger(parsedTmdbId) || parsedTmdbId < 1) {
			return { success: false, message: 'Invalid movie selection' };
		}

		const existing = await db
			.select({ id: movie.id })
			.from(movie)
			.where(
				and(eq(movie.userId, event.locals.user.id), eq(movie.tmdbId, parsedTmdbId))
			)
			.limit(1);

		if (existing.length > 0) {
			return { success: false, message: 'This movie is already on your watchlist' };
		}

		const details = await fetchMovieDetails(parsedTmdbId);
		if (!details) {
			return { success: false, message: 'Could not fetch movie details' };
		}

		const posterPath = formData.get('posterPath')?.toString()?.trim() || null;

		const [inserted] = await db
			.insert(movie)
			.values({
				title: details.title,
				posterPath: posterPath || details.posterPath || undefined,
				tmdbId: parsedTmdbId,
				releaseYear: details.releaseYear,
				userId: event.locals.user.id
			})
			.returning({ id: movie.id });

		await persistMovieMetadata(inserted.id, details.directors, details.genres);

		return { success: true };
	},
	removeMovie: async (event) => {
		if (!event.locals.user) {
			return redirect(302, '/login');
		}
		const formData = await event.request.formData();
		const id = formData.get('id');
		const parsedId = typeof id === 'string' ? parseInt(id, 10) : NaN;
		if (!Number.isInteger(parsedId) || parsedId < 1) {
			return { success: false, message: 'Invalid movie' };
		}
		await db
			.delete(movie)
			.where(and(eq(movie.id, parsedId), eq(movie.userId, event.locals.user.id)));
		return { success: true, removedId: parsedId };
	},
	toggleFavourite: async (event) => {
		if (!event.locals.user) {
			return redirect(302, '/login');
		}
		const formData = await event.request.formData();
		const id = formData.get('id');
		const parsedId = typeof id === 'string' ? parseInt(id, 10) : NaN;
		if (!Number.isInteger(parsedId) || parsedId < 1) {
			return { success: false, message: 'Invalid movie' };
		}

		const [existing] = await db
			.select({ isFavourite: movie.isFavourite })
			.from(movie)
			.where(and(eq(movie.id, parsedId), eq(movie.userId, event.locals.user.id)))
			.limit(1);

		if (!existing) {
			return { success: false, message: 'Movie not found' };
		}

		if (existing.isFavourite) {
			await db
				.update(movie)
				.set({ isFavourite: false, favouritedAt: null })
				.where(and(eq(movie.id, parsedId), eq(movie.userId, event.locals.user.id)));
		} else {
			await db
				.update(movie)
				.set({ isFavourite: true, favouritedAt: new Date() })
				.where(and(eq(movie.id, parsedId), eq(movie.userId, event.locals.user.id)));
		}

		return { success: true };
	}
};
