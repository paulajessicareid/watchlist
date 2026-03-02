import { TMDB_API_KEY } from '$env/static/private';

export { posterUrl } from '$lib/tmdb';

export interface TMDBMovie {
	id: number;
	title: string;
	poster_path: string | null;
}

const TMDB_BASE = 'https://api.themoviedb.org/3';

export async function searchMovies(query: string): Promise<TMDBMovie[]> {
	if (!query.trim()) return [];

	try {
		const url = `${TMDB_BASE}/search/movie?query=${encodeURIComponent(query.trim())}`;
		const res = await fetch(url, {
			headers: {
				Authorization: `Bearer ${TMDB_API_KEY}`
			}
		});

		if (!res.ok) return [];

		const data = (await res.json()) as { results?: TMDBMovie[] };
		const results = data.results ?? [];

		return results.filter((m): m is TMDBMovie & { poster_path: string } => m.poster_path != null);
	} catch {
		return [];
	}
}

export async function searchMoviePoster(title: string): Promise<string | null> {
	const results = await searchMovies(title);
	return results[0]?.poster_path ?? null;
}
