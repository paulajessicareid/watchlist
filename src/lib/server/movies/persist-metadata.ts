import { db } from '$lib/server/db';
import {
	director,
	genre,
	movieDirector,
	movieGenre
} from '$lib/server/db/schema';
import type { TMDBDirector, TMDBGenre } from '$lib/server/tmdb';
import { eq, inArray } from 'drizzle-orm';

async function upsertDirectors(directors: TMDBDirector[]): Promise<Map<number, number>> {
	const idByTmdbPersonId = new Map<number, number>();
	if (directors.length === 0) return idByTmdbPersonId;

	const tmdbPersonIds = directors.map((d) => d.tmdbPersonId);
	const existing = await db
		.select()
		.from(director)
		.where(inArray(director.tmdbPersonId, tmdbPersonIds));

	for (const row of existing) {
		idByTmdbPersonId.set(row.tmdbPersonId, row.id);
	}

	for (const d of directors) {
		if (idByTmdbPersonId.has(d.tmdbPersonId)) continue;

		const [inserted] = await db
			.insert(director)
			.values({ tmdbPersonId: d.tmdbPersonId, name: d.name })
			.onConflictDoUpdate({
				target: director.tmdbPersonId,
				set: { name: d.name }
			})
			.returning({ id: director.id, tmdbPersonId: director.tmdbPersonId });

		idByTmdbPersonId.set(inserted.tmdbPersonId, inserted.id);
	}

	return idByTmdbPersonId;
}

async function upsertGenres(genres: TMDBGenre[]): Promise<Map<number, number>> {
	const idByTmdbGenreId = new Map<number, number>();
	if (genres.length === 0) return idByTmdbGenreId;

	const tmdbGenreIds = genres.map((g) => g.tmdbGenreId);
	const existing = await db
		.select()
		.from(genre)
		.where(inArray(genre.tmdbGenreId, tmdbGenreIds));

	for (const row of existing) {
		idByTmdbGenreId.set(row.tmdbGenreId, row.id);
	}

	for (const g of genres) {
		if (idByTmdbGenreId.has(g.tmdbGenreId)) continue;

		const [inserted] = await db
			.insert(genre)
			.values({ tmdbGenreId: g.tmdbGenreId, name: g.name })
			.onConflictDoUpdate({
				target: genre.tmdbGenreId,
				set: { name: g.name }
			})
			.returning({ id: genre.id, tmdbGenreId: genre.tmdbGenreId });

		idByTmdbGenreId.set(inserted.tmdbGenreId, inserted.id);
	}

	return idByTmdbGenreId;
}

export async function persistMovieMetadata(
	movieId: number,
	directors: TMDBDirector[],
	genres: TMDBGenre[]
): Promise<void> {
	await db.delete(movieDirector).where(eq(movieDirector.movieId, movieId));
	await db.delete(movieGenre).where(eq(movieGenre.movieId, movieId));

	const directorIds = await upsertDirectors(directors);
	const genreIds = await upsertGenres(genres);

	if (directors.length > 0) {
		await db.insert(movieDirector).values(
			directors.map((d, index) => ({
				movieId,
				directorId: directorIds.get(d.tmdbPersonId)!,
				sortOrder: index
			}))
		);
	}

	if (genres.length > 0) {
		await db.insert(movieGenre).values(
			genres.map((g) => ({
				movieId,
				genreId: genreIds.get(g.tmdbGenreId)!
			}))
		);
	}
}
