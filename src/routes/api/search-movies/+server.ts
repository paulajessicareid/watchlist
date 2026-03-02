import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { searchMovies } from '$lib/server/tmdb';

export const GET: RequestHandler = async (event) => {
	if (!event.locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const q = event.url.searchParams.get('q');
	if (!q?.trim()) {
		return json({ results: [] });
	}

	const results = await searchMovies(q);
	return json({ results });
};
