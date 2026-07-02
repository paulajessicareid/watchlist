import { env } from '$env/dynamic/private';

export { posterUrl } from '$lib/tmdb';

export interface TMDBMovie {
	id: number;
	title: string;
	poster_path: string | null;
	release_date?: string;
}

export interface TMDBDirector {
	tmdbPersonId: number;
	name: string;
}

export interface TMDBGenre {
	tmdbGenreId: number;
	name: string;
}

export interface TMDBMovieDetails {
	title: string;
	posterPath: string | null;
	releaseYear: number | null;
	directors: TMDBDirector[];
	genres: TMDBGenre[];
}

const TMDB_BASE = 'https://api.themoviedb.org/3';

function tmdbHeaders(): HeadersInit {
	return {
		Authorization: `Bearer ${env.TMDB_API_KEY}`
	};
}

function parseReleaseYear(releaseDate: string | undefined | null): number | null {
	if (!releaseDate) return null;
	const year = parseInt(releaseDate.slice(0, 4), 10);
	return Number.isInteger(year) ? year : null;
}

export async function searchMovies(query: string): Promise<TMDBMovie[]> {
	if (!query.trim()) return [];

	try {
		const url = `${TMDB_BASE}/search/movie?query=${encodeURIComponent(query.trim())}`;
		const res = await fetch(url, { headers: tmdbHeaders() });

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

export async function fetchMovieDetails(tmdbId: number): Promise<TMDBMovieDetails | null> {
	try {
		const url = `${TMDB_BASE}/movie/${tmdbId}?append_to_response=credits`;
		const res = await fetch(url, { headers: tmdbHeaders() });

		if (!res.ok) return null;

		const data = (await res.json()) as {
			title?: string;
			poster_path?: string | null;
			release_date?: string;
			genres?: { id: number; name: string }[];
			credits?: { crew?: { id: number; name: string; job: string }[] };
		};

		if (!data.title) return null;

		const directors: TMDBDirector[] = (data.credits?.crew ?? [])
			.filter((member) => member.job === 'Director')
			.map((member) => ({
				tmdbPersonId: member.id,
				name: member.name
			}));

		const genres: TMDBGenre[] = (data.genres ?? []).map((g) => ({
			tmdbGenreId: g.id,
			name: g.name
		}));

		return {
			title: data.title,
			posterPath: data.poster_path ?? null,
			releaseYear: parseReleaseYear(data.release_date),
			directors,
			genres
		};
	} catch {
		return null;
	}
}
