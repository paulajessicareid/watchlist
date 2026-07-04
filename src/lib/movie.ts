export interface MovieListItem {
	id: number;
	title: string;
	posterUrl: string | null;
	releaseYear: number | null;
	directors: string[];
	genres: string[];
	isFavourite: boolean;
	createdAt: Date;
}

export const MOVIE_SORT_FIELDS = [
	'createdAt',
	'releaseYear',
	'director',
	'genre',
	'title',
	'isFavourite'
] as const;

export type MovieSortField = (typeof MOVIE_SORT_FIELDS)[number];

export function formatMovieMeta(movie: Pick<MovieListItem, 'releaseYear' | 'directors' | 'genres'>): string {
	const parts: string[] = [];
	if (movie.releaseYear != null) {
		parts.push(String(movie.releaseYear));
	}
	if (movie.directors.length > 0) {
		parts.push(movie.directors.join(', '));
	}
	if (movie.genres.length > 0) {
		parts.push(movie.genres.join(', '));
	}
	return parts.join(' · ');
}
