import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { movie } from '$lib/server/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { posterUrl, searchMoviePoster } from '$lib/server/tmdb';

const BACKFILL_CONCURRENCY = 5;

async function backfillPosterPaths(
	movies: { id: number; title: string; posterPath: string | null }[]
): Promise<Map<number, string>> {
	const toBackfill = movies.filter((m) => m.posterPath === null);
	const updated = new Map<number, string>();
	if (toBackfill.length === 0) return updated;

	for (let i = 0; i < toBackfill.length; i += BACKFILL_CONCURRENCY) {
		const batch = toBackfill.slice(i, i + BACKFILL_CONCURRENCY);
		const results = await Promise.all(batch.map((m) => searchMoviePoster(m.title)));
		await Promise.all(
			batch.map((m, j) => {
				const path = results[j];
				if (path) {
					updated.set(m.id, path);
					return db.update(movie).set({ posterPath: path }).where(eq(movie.id, m.id));
				}
				return Promise.resolve();
			})
		);
	}
	return updated;
}

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		return redirect(302, '/login');
	}
	const rows = await db
		.select()
		.from(movie)
		.where(eq(movie.userId, event.locals.user.id))
		.orderBy(desc(movie.createdAt));

	const backfilled = await backfillPosterPaths(rows);

	const movies = rows.map((m) => {
		const posterPath = m.posterPath ?? backfilled.get(m.id) ?? null;
		return {
			...m,
			posterPath,
			posterUrl: posterPath ? posterUrl(posterPath) : null
		};
	});

	return { user: event.locals.user, movies };
};

export const actions: Actions = {
	addMovie: async (event) => {
		if (!event.locals.user) {
			return redirect(302, '/login');
		}
		const formData = await event.request.formData();
		const title = formData.get('title')?.toString()?.trim() ?? '';
		const posterPath = formData.get('posterPath')?.toString()?.trim() || null;
		if (!title) {
			return { success: false, message: 'Title is required' };
		}
		await db.insert(movie).values({
			title,
			posterPath: posterPath || undefined,
			userId: event.locals.user.id
		});
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
};
